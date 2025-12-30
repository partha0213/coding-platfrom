from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime

from app.db import database
from app.models.learning import Course, CourseProblem, UserCourseProgress, CourseProblemTestCase, AdminAuditLog
from app.models.models import User
from app.api.deps import get_current_admin
from app.services.audit import log_admin_action
from app.schemas.learning import TestCaseRequest, TestCaseResponse

router = APIRouter()


# ============================================================================
# VALIDATION UTILITIES
# ============================================================================

def validate_no_duplicate_steps(course_id: int, step_number: int, exclude_problem_id: Optional[int], db: Session) -> None:
    """
    Ensure no duplicate step_number exists in a course.
    Raises HTTPException if duplicate found.
    """
    query = db.query(CourseProblem).filter(
        CourseProblem.course_id == course_id,
        CourseProblem.step_number == step_number
    )
    
    if exclude_problem_id:
        query = query.filter(CourseProblem.id != exclude_problem_id)
    
    existing = query.first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Step {step_number} already exists in this course (Problem ID: {existing.id})"
        )


def validate_step_deletion(course_id: int, step_number: int, db: Session, force: bool = False) -> None:
    """
    Validate if a step can be safely deleted.
    
    Rules:
    - Cannot delete if any user has progressed past this step (unless force=True)
    - This prevents breaking user progression
    """
    if force:
        return  # Admin explicitly forced deletion
    
    # Check if any user has progressed past this step
    users_past_step = db.query(UserCourseProgress).filter(
        UserCourseProgress.course_id == course_id,
        UserCourseProgress.current_step > step_number
    ).count()
    
    if users_past_step > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete step {step_number}: {users_past_step} user(s) have progressed past it. Use force=true to override."
        )


# = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = #
# COURSE MANAGEMENT
# = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = #

@router.get("/courses")
def list_courses_admin(
    db: Session = Depends(database.get_db),
    admin: User = Depends(get_current_admin)
):
    """
    List all courses with admin metadata.
    """
    courses = db.query(Course).all()
    
    result = []
    for course in courses:
        problem_count = db.query(CourseProblem).filter(CourseProblem.course_id == course.id).count()
        user_count = db.query(UserCourseProgress).filter(UserCourseProgress.course_id == course.id).count()
        
        result.append({
            "id": course.id,
            "language": course.language,
            "editor_language": course.editor_language,
            "is_active": course.is_active,
            "problem_count": problem_count,
            "user_count": user_count,
            "created_at": course.created_at.isoformat() if course.created_at else None
        })
    
    return result


@router.post("/courses")
def create_course(
    course_data: dict,  # {"language": str, "editor_language": str}
    db: Session = Depends(database.get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Create a new programming language course.
    
    Request:
    - language: Display name (e.g., "Python", "JavaScript")
    - editor_language: Editor identifier (e.g., "python", "javascript")
    
    Validation:
    - Language must be unique
    - Both fields required
    """
    if not course_data.get("language") or not course_data.get("editor_language"):
        raise HTTPException(status_code=400, detail="Missing required fields: language, editor_language")
    
    language = course_data["language"].strip()
    editor_language = course_data["editor_language"].strip()
    
    # Check if language already exists
    existing = db.query(Course).filter(Course.language == language).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Course for '{language}' already exists")
    
    course = Course(
        language=language,
        editor_language=editor_language,
        is_active=True
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    
    # Audit log
    log_admin_action(
        db, admin.id, "CREATE_COURSE", "course", course.id,
        new_value={"language": course.language, "editor_language": course.editor_language}
    )
    
    return {
        "id": course.id,
        "language": course.language,
        "editor_language": course.editor_language,
        "is_active": course.is_active,
        "created_at": course.created_at.isoformat()
    }


@router.patch("/courses/{course_id}/activate")
def activate_course(
    course_id: int,
    db: Session = Depends(database.get_db),
    admin: User = Depends(get_current_admin)
):
    """Activate a course (make it visible to users)."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    course.is_active = True
    db.commit()
    
    # Audit log
    log_admin_action(db, admin.id, "ACTIVATE_COURSE", "course", course_id)
    
    return {"message": f"Course '{course.language}' activated", "is_active": True}


@router.patch("/courses/{course_id}/deactivate")
def deactivate_course(
    course_id: int,
    db: Session = Depends(database.get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Deactivate a course (hide from users, but preserve data).
    
    Note: Existing user progress is preserved.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    course.is_active = False
    db.commit()
    
    # Audit log
    log_admin_action(db, admin.id, "DEACTIVATE_COURSE", "course", course_id)
    
    return {"message": f"Course '{course.language}' deactivated", "is_active": False}


@router.get("/courses/{course_id}")
def get_course_admin_view(
    course_id: int,
    db: Session = Depends(database.get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Get full course details (admin view).
    
    Returns:
    - Course info
    - All problems with solution_code (admin-only)
    - User statistics
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    problems = db.query(CourseProblem).filter(
        CourseProblem.course_id == course_id
    ).order_by(CourseProblem.step_number).all()
    
    # User statistics
    total_users = db.query(UserCourseProgress).filter(
        UserCourseProgress.course_id == course_id
    ).count()
    
    completed_users = db.query(UserCourseProgress).filter(
        UserCourseProgress.course_id == course_id,
        UserCourseProgress.current_step > len(problems)
    ).count()
    
    return {
        "id": course.id,
        "language": course.language,
        "editor_language": course.editor_language,
        "is_active": course.is_active,
        "created_at": course.created_at.isoformat(),
        "problems": [
            {
                "id": p.id,
                "step_number": p.step_number,
                "title": p.title,
                "description": p.description,
                "starter_code": p.starter_code,
                "solution_code": p.solution_code,  # ADMIN ONLY
                "created_at": p.created_at.isoformat()
            }
            for p in problems
        ],
        "statistics": {
            "total_problems": len(problems),
            "total_users": total_users,
            "completed_users": completed_users
        }
    }


# ============================================================================
# PROBLEM MANAGEMENT
# ============================================================================

@router.post("/courses/{course_id}/problems")
def add_problem(
    course_id: int,
    problem_data: dict,
    db: Session = Depends(database.get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Add a new problem to a course.
    
    Request:
    - step_number: int (must be unique in course)
    - title: str
    - description: str
    - starter_code: Optional[str]
    - solution_code: Optional[str]
    
    Validation:
    - Course must exist
    - step_number must be unique
    - No gaps allowed (if step 3 exists, can't add step 5 without step 4)
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Validate required fields
    required_fields = ["step_number", "title", "description"]
    for field in required_fields:
        if field not in problem_data:
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
    
    step_number = problem_data["step_number"]
    
    # Check for duplicate step
    validate_no_duplicate_steps(course_id, step_number, None, db)
    
    # Validate no gaps in step sequence
    existing_steps = db.query(CourseProblem.step_number).filter(
        CourseProblem.course_id == course_id
    ).order_by(CourseProblem.step_number).all()
    
    existing_step_numbers = [s[0] for s in existing_steps]
    
    if existing_step_numbers:
        max_step = max(existing_step_numbers)
        # Allow adding next sequential step OR filling a gap
        expected_steps = set(range(1, max_step + 1))
        actual_steps = set(existing_step_numbers)
        gaps = expected_steps - actual_steps
        
        if step_number > max_step + 1:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot add step {step_number}. Next sequential step is {max_step + 1}."
            )
    
    problem = CourseProblem(
        course_id=course_id,
        step_number=step_number,
        title=problem_data["title"],
        description=problem_data["description"],
        starter_code=problem_data.get("starter_code"),
        solution_code=problem_data.get("solution_code"),
        validation_policy=problem_data.get("validation_policy")
    )
    
    db.add(problem)
    db.commit()
    db.refresh(problem)
    
    # Audit log
    log_admin_action(
        db, admin.id, "ADD_PROBLEM", "problem", problem.id,
        new_value={"course_id": course_id, "step_number": step_number, "title": problem.title, "validation_policy": problem.validation_policy}
    )
    
    return {
        "id": problem.id,
        "course_id": course_id,
        "step_number": problem.step_number,
        "title": problem.title,
        "message": f"Problem added successfully at step {step_number}"
    }


@router.put("/problems/{problem_id}")
def update_problem(
    problem_id: int,
    problem_data: dict,
    db: Session = Depends(database.get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Update problem content.
    
    Allowed updates:
    - title
    - description
    - starter_code
    - solution_code
    
    NOT allowed:
    - Changing course_id (use delete + create instead)
    - Changing step_number (use reorder endpoint)
    """
    problem = db.query(CourseProblem).filter(CourseProblem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # Capture old values for audit
    old_values = {
        "title": problem.title,
        "description": problem.description,
        "starter_code": problem.starter_code,
        "solution_code": problem.solution_code,
        "validation_policy": problem.validation_policy
    }
    
    # Update allowed fields
    if "title" in problem_data:
        problem.title = problem_data["title"]
    if "description" in problem_data:
        problem.description = problem_data["description"]
    if "starter_code" in problem_data:
        problem.starter_code = problem_data["starter_code"]
    if "solution_code" in problem_data:
        problem.solution_code = problem_data["solution_code"]
    if "validation_policy" in problem_data:
        problem.validation_policy = problem_data["validation_policy"]
    
    # Prevent changing structural fields
    if "course_id" in problem_data or "step_number" in problem_data:
        raise HTTPException(
            status_code=400,
            detail="Cannot change course_id or step_number. Use reorder endpoint for step changes."
        )
    
    db.commit()
    db.refresh(problem)
    
    # Audit log
    log_admin_action(
        db, admin.id, "UPDATE_PROBLEM", "problem", problem_id,
        old_value=old_values,
        new_value=problem_data
    )
    
    return {
        "id": problem.id,
        "step_number": problem.step_number,
        "title": problem.title,
        "message": "Problem updated successfully"
    }


@router.get("/problems/{problem_id}")
def get_problem_admin(
    problem_id: int,
    db: Session = Depends(database.get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Get individual problem details (admin view).
    """
    problem = db.query(CourseProblem).filter(CourseProblem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    return {
        "id": problem.id,
        "course_id": problem.course_id,
        "step_number": problem.step_number,
        "title": problem.title,
        "description": problem.description,
        "starter_code": problem.starter_code,
        "solution_code": problem.solution_code,
        "validation_policy": problem.validation_policy,
        "created_at": problem.created_at.isoformat()
    }


@router.delete("/problems/{problem_id}")
def delete_problem(
    problem_id: int,
    force: bool = False,
    db: Session = Depends(database.get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Delete a problem.
    
    Safety:
    - Prevents deletion if users have progressed past this step
    - Use force=true to override (will break user progression)
    
    Warning: Deletion creates a gap in step sequence.
    """
    problem = db.query(CourseProblem).filter(CourseProblem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # Validate safe deletion
    validate_step_deletion(problem.course_id, problem.step_number, db, force)
    
    course_id = problem.course_id
    step_number = problem.step_number
    
    db.delete(problem)
    db.commit()
    
    # Audit log
    log_admin_action(
        db, admin.id, "DELETE_PROBLEM", "problem", problem_id,
        old_value={"course_id": course_id, "step_number": step_number, "force": force}
    )
    
    return {
        "message": f"Problem at step {step_number} deleted",
        "course_id": course_id,
        "deleted_step": step_number,
        "warning": "This creates a gap in the step sequence. Consider reordering."
    }


@router.post("/courses/{course_id}/reorder")
def reorder_steps(
    course_id: int,
    reorder_data: dict,  # {"mappings": [{"problem_id": int, "new_step": int}, ...]}
    db: Session = Depends(database.get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Reorder problem steps in a course.
    
    Request:
    - mappings: List of {problem_id, new_step}
    
    Validation:
    - All problems must belong to course
    - No duplicate step numbers
    - No gaps in sequence (1, 2, 3... not 1, 3, 5)
    
    This is atomic: either all changes succeed or none do.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    mappings = reorder_data.get("mappings", [])
    if not mappings:
        raise HTTPException(status_code=400, detail="No mappings provided")
    
    # Validate all problems exist and belong to course
    problem_ids = [m["problem_id"] for m in mappings]
    problems = db.query(CourseProblem).filter(
        CourseProblem.id.in_(problem_ids),
        CourseProblem.course_id == course_id
    ).all()
    
    if len(problems) != len(problem_ids):
        raise HTTPException(status_code=400, detail="Some problems not found or don't belong to this course")
    
    # Validate new step numbers
    new_steps = [m["new_step"] for m in mappings]
    
    # Check for duplicates
    if len(new_steps) != len(set(new_steps)):
        raise HTTPException(status_code=400, detail="Duplicate step numbers in mapping")
    
    # Check for gaps
    new_steps_sorted = sorted(new_steps)
    expected = list(range(1, len(new_steps) + 1))
    if new_steps_sorted != expected:
        raise HTTPException(
            status_code=400,
            detail=f"Step sequence must be continuous. Expected {expected}, got {new_steps_sorted}"
        )
    
    # Apply changes (atomic)
    try:
        # First pass: Move to temporary large values to avoid unique constraint violations
        for mapping in mappings:
            problem = db.query(CourseProblem).filter(
                CourseProblem.id == mapping["problem_id"]
            ).first()
            # Temporary value = new_step + 1000 (enough to avoid existing steps)
            problem.step_number = mapping["new_step"] + 1000
        
        db.flush() # Ensure temp values are flushed
        
        # Second pass: Move to final values
        for mapping in mappings:
            problem = db.query(CourseProblem).filter(
                CourseProblem.id == mapping["problem_id"]
            ).first()
            problem.step_number = mapping["new_step"]
        
        db.commit()
        
        # Audit log
        log_admin_action(
            db, admin.id, "REORDER_STEPS", "course", course_id,
            new_value={"mappings": mappings}
        )
        
        return {
            "message": f"Reordered {len(mappings)} problems successfully",
            "course_id": course_id,
            "updated_count": len(mappings)
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Reordering failed: {str(e)}")


# ============================================================================
# USER PROGRESS MANAGEMENT
# ============================================================================

@router.get("/courses/{course_id}/users")
def get_course_users(
    course_id: int,
    db: Session = Depends(database.get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Get all users enrolled in a course with their progress.
    
    Returns:
    - User ID, username, email
    - Current step
    - Completion percentage
    - Last updated
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    total_problems = db.query(CourseProblem).filter(
        CourseProblem.course_id == course_id
    ).count()
    
    progress_records = db.query(UserCourseProgress).filter(
        UserCourseProgress.course_id == course_id
    ).all()
    
    result = []
    for progress in progress_records:
        user = progress.user
        completed_steps = max(0, progress.current_step - 1)
        percentage = round((completed_steps / total_problems * 100), 1) if total_problems > 0 else 0
        
        result.append({
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "current_step": progress.current_step,
            "completed_steps": completed_steps,
            "total_steps": total_problems,
            "percentage_complete": percentage,
            "last_updated": progress.updated_at.isoformat() if progress.updated_at else None
        })
    
    return {
        "course_id": course_id,
        "language": course.language,
        "total_users": len(result),
        "users": result
    }


@router.delete("/users/{user_id}/courses/{course_id}/progress")
def reset_user_progress(
    user_id: int,
    course_id: int,
    db: Session = Depends(database.get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Reset a user's progress for a course.
    
    This sets current_step back to 1 (or deletes the progress record).
    
    Use cases:
    - User requests fresh start
    - Debugging / testing
    - Problem step order changed
    """
    progress = db.query(UserCourseProgress).filter(
        UserCourseProgress.user_id == user_id,
        UserCourseProgress.course_id == course_id
    ).first()
    
    if not progress:
        raise HTTPException(status_code=404, detail="No progress found for this user/course")
    
    user = db.query(User).filter(User.id == user_id).first()
    course = db.query(Course).filter(Course.id == course_id).first()
    
    # Delete progress record
    db.delete(progress)
    db.commit()
    
    # Audit log
    log_admin_action(
        db, admin.id, "RESET_PROGRESS", "user_progress", progress.id,
        old_value={"user_id": user_id, "course_id": course_id, "last_step": progress.current_step}
    )
    
    return {
        "message": f"Progress reset for user '{user.username}' in course '{course.language}'",
        "user_id": user_id,
        "course_id": course_id
    }


@router.get("/statistics")
def get_platform_statistics(
    db: Session = Depends(database.get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Get overall platform statistics.
    
    Returns:
    - Total courses
    - Total problems
    - Total users with progress
    - Average completion rate
    """
    total_courses = db.query(Course).count()
    active_courses = db.query(Course).filter(Course.is_active == True).count()
    total_problems = db.query(CourseProblem).count()
    total_users_with_progress = db.query(UserCourseProgress.user_id).distinct().count()
    
    # Calculate average completion rate across all courses
    all_progress = db.query(UserCourseProgress).all()
    if all_progress:
        completion_rates = []
        for progress in all_progress:
            total_problems_in_course = db.query(CourseProblem).filter(
                CourseProblem.course_id == progress.course_id
            ).count()
            if total_problems_in_course > 0:
                completed = max(0, progress.current_step - 1)
                rate = (completed / total_problems_in_course) * 100
                completion_rates.append(rate)
        
        avg_completion = round(sum(completion_rates) / len(completion_rates), 1) if completion_rates else 0
    else:
        avg_completion = 0
    
    return {
        "courses": {
            "total": total_courses,
            "active": active_courses,
            "inactive": total_courses - active_courses
        },
        "problems": {
            "total": total_problems
        },
        "users": {
            "with_progress": total_users_with_progress
        },
        "avg_completion_rate": avg_completion
    }


# ============================================================================
# TEST CASE MANAGEMENT
# ============================================================================

@router.post("/problems/{problem_id}/test-cases", response_model=TestCaseResponse)
def add_test_case(
    problem_id: int,
    test_case_data: TestCaseRequest,
    db: Session = Depends(database.get_db),
    admin: User = Depends(get_current_admin)
):
    """Add a new test case to a problem."""
    problem = db.query(CourseProblem).filter(CourseProblem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    test_case = CourseProblemTestCase(
        problem_id=problem_id,
        input_data=test_case_data.input_data,
        expected_output=test_case_data.expected_output,
        is_hidden=test_case_data.is_hidden
    )
    db.add(test_case)
    db.commit()
    db.refresh(test_case)
    
    # Audit log
    log_admin_action(
        db, admin.id, "ADD_TEST_CASE", "test_case", test_case.id,
        new_value={"problem_id": problem_id, "is_hidden": test_case.is_hidden}
    )
    
    return test_case


@router.get("/problems/{problem_id}/test-cases", response_model=list[TestCaseResponse])
def list_test_cases(
    problem_id: int,
    db: Session = Depends(database.get_db),
    admin: User = Depends(get_current_admin)
):
    """List all test cases for a problem (admin only)."""
    problem = db.query(CourseProblem).filter(CourseProblem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    return problem.test_cases


@router.delete("/test-cases/{test_case_id}")
def delete_test_case(
    test_case_id: int,
    db: Session = Depends(database.get_db),
    admin: User = Depends(get_current_admin)
):
    """Delete a test case."""
    test_case = db.query(CourseProblemTestCase).filter(CourseProblemTestCase.id == test_case_id).first()
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    problem_id = test_case.problem_id
    db.delete(test_case)
    db.commit()
    
    # Audit log
    log_admin_action(
        db, admin.id, "DELETE_TEST_CASE", "test_case", test_case_id,
        old_value={"problem_id": problem_id}
    )
    
    return {"message": "Test case deleted successfully"}

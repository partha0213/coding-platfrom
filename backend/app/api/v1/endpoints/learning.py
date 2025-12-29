from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.db import database
from app.models.learning import Course, CourseProblem, UserCourseProgress, SubmissionLog
from app.models.models import User
from app.api.deps import get_current_user
from app.services.secure_executor import CodeExecutor
from app.services.rate_limiter import submission_limiter

router = APIRouter()


# ============================================================================
# ACCESS CONTROL UTILITIES
# ============================================================================

def get_or_create_progress(user_id: int, course_id: int, db: Session) -> UserCourseProgress:
    """
    Get user's progress for a course, or create if first access.
    Initial current_step = 1 (user can access step 1).
    """
    progress = db.query(UserCourseProgress).filter(
        UserCourseProgress.user_id == user_id,
        UserCourseProgress.course_id == course_id
    ).first()
    
    if not progress:
        progress = UserCourseProgress(
            user_id=user_id,
            course_id=course_id,
            current_step=1  # Start at step 1
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
    
    return progress


def validate_problem_access(
    user_id: int,
    problem: CourseProblem,
    db: Session
) -> tuple[bool, str]:
    """
    Validate if user can access a specific problem.
    
    Returns: (is_allowed, reason_if_denied)
    
    Rules:
    - User can access problem if problem.step_number <= current_step
    - If problem.step_number > current_step, access is DENIED
    """
    progress = get_or_create_progress(user_id, problem.course_id, db)
    
    if problem.step_number > progress.current_step:
        return False, f"Step {problem.step_number} is locked. Complete step {progress.current_step} first."
    
    return True, ""


def can_submit_to_step(
    user_id: int,
    problem: CourseProblem,
    db: Session
) -> tuple[bool, str]:
    """
    Validate if user can SUBMIT to a specific step.
    
    Returns: (is_allowed, reason_if_denied)
    
    Rules:
    - User can only submit to current_step (exact match)
    - Cannot re-submit to already completed steps (step < current_step)
    - Cannot skip ahead (step > current_step)
    """
    progress = get_or_create_progress(user_id, problem.course_id, db)
    
    if problem.step_number < progress.current_step:
        return False, f"Step {problem.step_number} is already completed. You are on step {progress.current_step}."
    
    if problem.step_number > progress.current_step:
        return False, f"Cannot skip to step {problem.step_number}. Complete step {progress.current_step} first."
    
    # Exact match: this is the current step
    return True, ""


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/courses")
def list_courses(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all active courses.
    
    Returns:
    - List of courses with basic info
    - User's progress (current_step) for each course if started
    
    No access control needed - listing is public.
    """
    courses = db.query(Course).filter(Course.is_active == True).all()
    
    result = []
    for course in courses:
        # Get user's progress for this course (if any)
        progress = db.query(UserCourseProgress).filter(
            UserCourseProgress.user_id == current_user.id,
            UserCourseProgress.course_id == course.id
        ).first()
        
        # Count total problems in course
        total_problems = db.query(CourseProblem).filter(
            CourseProblem.course_id == course.id
        ).count()
        
        completed_steps = max(0, progress.current_step - 1) if progress else 0
        percentage = round((completed_steps / total_problems * 100), 1) if total_problems > 0 else 0
        
        result.append({
            "id": course.id,
            "language": course.language,
            "editor_language": course.editor_language,
            "progress": {
                "current_step": progress.current_step if progress else 1,
                "total_steps": total_problems,
                "percentage_complete": percentage,
                "is_started": progress is not None,
                "is_completed": progress.current_step > total_problems if progress else False
            }
        })
    
    return result


@router.get("/courses/{course_id}/problems")
def get_course_problems(
    course_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all problems for a course WITH access filtering.
    
    Returns:
    - List of problems ordered by step_number
    - Each problem includes:
      - Basic info (id, title, step_number)
      - Access status: "accessible", "current", "locked"
      - Description ONLY if accessible
    
    Security:
    - Hides description and code for locked steps
    - Shows which step is current
    - Prevents information leakage
    """
    # Verify course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if not course.is_active:
        raise HTTPException(status_code=403, detail="Course is not active")
    
    # Get or create user's progress
    progress = get_or_create_progress(current_user.id, course_id, db)
    
    # Get all problems ordered by step_number
    problems = db.query(CourseProblem).filter(
        CourseProblem.course_id == course_id
    ).order_by(CourseProblem.step_number).all()
    
    result = []
    for problem in problems:
        # Determine access status
        if problem.step_number < progress.current_step:
            access_status = "completed"
        elif problem.step_number == progress.current_step:
            access_status = "current"
        else:
            access_status = "locked"
        
        # Only include sensitive data if accessible
        is_accessible = problem.step_number <= progress.current_step
        
        result.append({
            "id": problem.id,
            "step_number": problem.step_number,
            "title": problem.title,
            "access_status": access_status,
            # Conditional fields - only if accessible
            "description": problem.description if is_accessible else None,
            "starter_code": problem.starter_code if is_accessible else None,
            # Never expose solution code
            "created_at": problem.created_at.isoformat() if is_accessible else None
        })
    
    return {
        "course": {
            "id": course.id,
            "language": course.language,
            "editor_language": course.editor_language
        },
        "progress": {
            "current_step": progress.current_step,
            "total_steps": len(problems)
        },
        "problems": result
    }


@router.get("/problems/{problem_id}")
def get_problem(
    problem_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a single problem with full details.
    
    Returns:
    - Full problem details if user has access
    - Includes starter code
    - NEVER includes solution code
    
    Security:
    - Validates problem.step_number <= user's current_step
    - Returns 403 if user tries to access future step
    - Prevents direct URL bypass
    """
    problem = db.query(CourseProblem).filter(CourseProblem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # Verify course is active
    if not problem.course.is_active:
        raise HTTPException(status_code=403, detail="Course is not active")
    
    # ACCESS CONTROL: Check if user can access this step
    is_allowed, reason = validate_problem_access(current_user.id, problem, db)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=reason
        )
    
    # Get user's progress
    progress = get_or_create_progress(current_user.id, problem.course_id, db)
    
    return {
        "id": problem.id,
        "course_id": problem.course_id,
        "step_number": problem.step_number,
        "title": problem.title,
        "description": problem.description,
        "starter_code": problem.starter_code,
        "course": {
            "id": problem.course.id,
            "language": problem.course.language,
            "editor_language": problem.course.editor_language
        },
        "progress": {
            "current_step": progress.current_step,
            "is_current": problem.step_number == progress.current_step,
            "is_completed": problem.step_number < progress.current_step
        }
        # NOTE: solution_code is NEVER returned
    }


@router.post("/problems/{problem_id}/submit")
def submit_solution(
    problem_id: int,
    submission: dict,  # {"code": "str"}
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit a solution for a problem.
    
    Request body:
    - code: string (user's submitted code)
    
    Returns:
    - Feedback on submission
    - Updated progress if successful
    
    Security & Logic:
    - User can ONLY submit to current_step (exact match)
    - Cannot re-submit to completed steps
    - Cannot skip ahead to future steps
    - On successful submission:
      * current_step increments by 1
      * Unlocks next step
    - On failed submission:
      * No progress change
      * User can retry same step
    
    Error cases:
    - 403: Trying to submit to wrong step
    - 404: Problem not found
    - 400: Invalid submission format
    """
    problem = db.query(CourseProblem).filter(CourseProblem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # Validate submission format
    if not submission or "code" not in submission:
        raise HTTPException(status_code=400, detail="Missing 'code' in submission")
    
    code = submission["code"]
    if not code or not isinstance(code, str):
        raise HTTPException(status_code=400, detail="Invalid code format")
    
    # ACCESS CONTROL: Check if user can SUBMIT to this step
    is_allowed, reason = can_submit_to_step(current_user.id, problem, db)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=reason
        )
    
    # 1. Payload Size Validation (64KB cap)
    payload_size = len(code.encode('utf-8'))
    if payload_size > 65536:
        raise HTTPException(
            status_code=status.HTTP_413_PAYLOAD_TOO_LARGE,
            detail="Payload too large. Code must be under 64KB."
        )

    # Get user's progress (guaranteed to exist after can_submit_to_step)
    progress = db.query(UserCourseProgress).filter(
        UserCourseProgress.user_id == current_user.id,
        UserCourseProgress.course_id == problem.course_id
    ).first()
    
    # Rate limiting check (Phase 7: Abuse Prevention)
    submission_limiter.check_rate_limit(current_user.id)
    
    executor = CodeExecutor()
    course = problem.course
    
    # Get real test cases from DB
    db_test_cases = problem.test_cases
    if db_test_cases:
        test_cases = [
            {
                "input_data": tc.input_data or "",
                "expected_output": tc.expected_output.strip()
            }
            for tc in db_test_cases
        ]
    else:
        # FALLBACK: Use solution_code as a single test case if none defined
        test_cases = [
            {
                "input_data": "",
                "expected_output": problem.solution_code.strip() if problem.solution_code else ""
            }
        ]
    
    # Execute based on course language
    if course.editor_language == "python":
        result = executor.execute_python(code, test_cases)
    elif course.editor_language == "javascript":
        result = executor.execute_javascript(code, test_cases)
    else:
        raise HTTPException(
            status_code=500,
            detail=f"Unsupported language: {course.editor_language}"
        )
    
    is_correct = result["verdict"] == "Passed"
    
    # 2. Submission Logging (Phase 9: Final Implementation)
    log = SubmissionLog(
        user_id=current_user.id,
        problem_id=problem_id,
        verdict=result["verdict"],
        execution_time=result.get("execution_time", 0.0),
        timeout_flag=result.get("verdict") == "Timed Out",
        payload_size=payload_size
    )
    db.add(log)
    
    # Log result to rate limiter for abuse tracking
    submission_limiter.log_result(current_user.id, is_correct)
    
    if is_correct:
        # SUCCESS: Increment current_step
        old_step = progress.current_step
        progress.current_step += 1
        progress.updated_at = datetime.now()
        db.commit()
        
        # Check if course is complete
        total_problems = db.query(CourseProblem).filter(
            CourseProblem.course_id == problem.course_id
        ).count()
        
        is_course_complete = progress.current_step > total_problems
        
        return {
            "success": True,
            "message": "Correct! Step completed.",
            "progress": {
                "completed_step": old_step,
                "current_step": progress.current_step,
                "is_course_complete": is_course_complete
            },
            "execution": {
                "passed_cases": result["passed_cases"],
                "total_cases": result["total_cases"],
                "execution_time": result["execution_time"],
                "output": result.get("output_log", "")
            },
            "next_step_unlocked": not is_course_complete
        }
    else:
        # FAILURE: No progress change, user can retry
        return {
            "success": False,
            "message": "Incorrect solution. Try again.",
            "progress": {
                "current_step": progress.current_step
            },
            "execution": {
                "passed_cases": result["passed_cases"],
                "total_cases": result["total_cases"],
                "execution_time": result["execution_time"],
                "output": result.get("output_log", "")
            },
            "hint": "Review the problem description and expected output."
        }




@router.get("/courses/{course_id}/progress")
def get_progress(
    course_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed progress for a specific course.
    
    Returns:
    - Current step
    - Completed steps
    - Total steps
    - Percentage complete
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    progress = get_or_create_progress(current_user.id, course_id, db)
    
    total_problems = db.query(CourseProblem).filter(
        CourseProblem.course_id == course_id
    ).count()
    
    completed_steps = max(0, progress.current_step - 1)  # current_step is next to do
    percentage = round((completed_steps / total_problems * 100), 1) if total_problems > 0 else 0
    
    return {
        "course_id": course_id,
        "language": course.language,
        "current_step": progress.current_step,
        "completed_steps": completed_steps,
        "total_steps": total_problems,
        "percentage_complete": percentage,
        "is_complete": progress.current_step > total_problems
    }

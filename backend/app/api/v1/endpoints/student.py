from fastapi import APIRouter, Depends
from typing import Optional
from sqlalchemy.orm import Session
from app.db import database
from app.models import models
from app.models.learning import Course, CourseProblem, UserCourseProgress, SubmissionLog
from app.schemas import schemas
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/stats/{user_id}")
def get_student_stats(user_id: int, db: Session = Depends(database.get_db)):
    # Legacy submissions (Tests)
    test_submissions = db.query(models.Submission).filter(models.Submission.user_id == user_id).all()
    
    # New Learning submissions
    learning_logs = db.query(SubmissionLog).filter(SubmissionLog.user_id == user_id).all()
    
    total_test_attempts = len(test_submissions)
    total_learning_attempts = len(learning_logs)
    
    # Mastered steps across all courses
    mastery_records = db.query(UserCourseProgress).filter(UserCourseProgress.user_id == user_id).all()
    total_steps_mastered = sum([max(0, m.current_step - 1) for m in mastery_records])
    
    # Total unique problems/steps passed
    unique_solved_ids = {s.problem_id for s in test_submissions if s.verdict == "Passed"}
    # For learning, successful attempts are in SubmissionLog with verdict "Passed"
    unique_learning_solved = {l.problem_id for l in learning_logs if l.verdict == "Passed"}
    
    passed_submissions = len(unique_solved_ids) + len(unique_learning_solved)
    
    total_submissions = total_test_attempts + total_learning_attempts
    failed_attempts = len([s for s in test_submissions if s.verdict != "Passed"]) + \
                      len([l for l in learning_logs if l.verdict != "Passed"])
    
    strike_rate = 0.0
    if total_submissions > 0:
        strike_rate = failed_attempts / total_submissions
    
    # Calculate streak (combining both sources)
    from datetime import datetime, date, timedelta
    dates = {s.created_at.date() for s in test_submissions}
    dates.update({l.timestamp.date() for l in learning_logs})
    sorted_dates = sorted(list(dates), reverse=True)
    
    streak = 0
    if sorted_dates:
        today = date.today()
        if sorted_dates[0] == today or sorted_dates[0] == today - timedelta(days=1):
            streak = 1
            for i in range(len(sorted_dates) - 1):
                if sorted_dates[i] - sorted_dates[i+1] == timedelta(days=1):
                    streak += 1
                else:
                    break
                    
    return {
        "solved_count": passed_submissions,
        "total_attempts": total_submissions,
        "steps_mastered": total_steps_mastered,
        "strike_rate": round(strike_rate, 2),
        "streak": streak,
        "mastery_level": "Architect" if total_steps_mastered > 20 else "Expert" if total_steps_mastered > 10 else "Advanced" if total_steps_mastered > 5 else "Pioneer"
    }

@router.get("/tip")
def get_random_tip():
    import random
    tips = [
        "Maintaining a 100% integrity score increases your chance of getting noticed by recruiters.",
        "Practice 'Two Sum' variations to master array and hash map logic.",
        "Always dry-run your code with corner cases like empty arrays or null inputs.",
        "Optimize for time complexity; many firms look for O(n) or O(log n) solutions.",
        "Explain your thought process; in real interviews, the 'how' is as important as the 'what'."
    ]
    return {"tip": random.choice(tips)}

@router.get("/submissions/{user_id}")
def get_student_submissions(
    user_id: int, 
    test_id: Optional[int] = None,
    db: Session = Depends(database.get_db)
):
    # Fetch legacy/test submissions
    test_query = db.query(models.Submission).filter(models.Submission.user_id == user_id)
    if test_id:
        test_query = test_query.filter(models.Submission.test_id == test_id)
    test_submissions = test_query.order_by(models.Submission.created_at.desc()).all()
    
    # Fetch learning logs (only for global view, test_id is None)
    learning_logs = []
    if not test_id:
        learning_logs = db.query(SubmissionLog).filter(SubmissionLog.user_id == user_id).order_by(SubmissionLog.timestamp.desc()).all()
    
    combined = []
    for s in test_submissions:
        combined.append({
            "id": f"t_{s.id}",
            "problem_id": s.problem_id,
            "problem_title": s.problem.title,
            "verdict": s.verdict,
            "passed_cases": s.passed_cases,
            "total_cases": s.total_cases,
            "type": "TEST",
            "submitted_at": s.created_at.isoformat()
        })
        
    for l in learning_logs:
        combined.append({
            "id": f"l_{l.id}",
            "problem_id": l.problem_id,
            "problem_title": l.problem.title,
            "verdict": l.verdict,
            "passed_cases": 1 if l.verdict == "Passed" else 0, # Step is binary
            "total_cases": 1,
            "type": "LEARNING",
            "submitted_at": l.timestamp.isoformat()
        })
        
    # Sort by time
    combined.sort(key=lambda x: x["submitted_at"], reverse=True)
    
    return combined[:50] # Limit to 50 for performance

@router.get("/analytics/{user_id}")
def get_student_analytics(user_id: int, db: Session = Depends(database.get_db)):
    # 1. Course/Language mastery breakdown
    courses = db.query(Course).filter(Course.is_active == True).all()
    category_mastery = []
    
    for course in courses:
        total_steps = db.query(CourseProblem).filter(CourseProblem.course_id == course.id).count()
        progress = db.query(UserCourseProgress).filter(
            UserCourseProgress.user_id == user_id,
            UserCourseProgress.course_id == course.id
        ).first()
        
        mastered = max(0, progress.current_step - 1) if progress else 0
        percentage = round((mastered / total_steps * 100), 1) if total_steps > 0 else 0
        
        category_mastery.append({
            "label": course.language,
            "solved": mastered,
            "total": total_steps,
            "progress": percentage
        })
    
    # 2. Activity Heatmap (combining Tests and Learning)
    from datetime import datetime, timedelta, date
    today = date.today()
    last_30_days = [today - timedelta(days=i) for i in range(29, -1, -1)]
    
    test_subs = db.query(models.Submission).filter(models.Submission.user_id == user_id).all()
    learning_logs = db.query(SubmissionLog).filter(SubmissionLog.user_id == user_id).all()
    
    submission_dates = [s.created_at.date() for s in test_subs]
    submission_dates.extend([l.timestamp.date() for l in learning_logs])
    
    heatmap = []
    for day in last_30_days:
        count = submission_dates.count(day)
        level = 0
        if count > 8: level = 3
        elif count > 4: level = 2
        elif count > 0: level = 1
        
        heatmap.append({
            "date": day.isoformat(),
            "count": count,
            "level": level
        })
        
    # 3. Milestones (updated for learning flow)
    total_mastered = sum([c["solved"] for c in category_mastery])
    
    milestones = [
        {"icon": "\ud83c\udfc1", "name": "First Blood", "desc": "Completed 1st step", "active": total_mastered >= 1},
        {"icon": "\ud83c\udfc6", "name": "Polyglot", "desc": "Started 2+ courses", "active": len([c for c in category_mastery if c["solved"] > 0]) >= 2},
        {"icon": "\ud83d\udee1\ufe0f", "name": "Deep Dive", "desc": "Mastered 5 steps", "active": total_mastered >= 5},
        {"icon": "\ud83d\udd25", "name": "On Fire", "desc": "Active 3+ day streak", "active": total_mastered >= 1} # Placeholder for logic above if needed
    ]
    
    return {
        "category_mastery": category_mastery,
        "heatmap": heatmap,
        "milestones": milestones
    }

@router.get("/test-results/{user_id}/{test_id}")
def get_student_test_results(user_id: int, test_id: int, db: Session = Depends(database.get_db)):
    # 1. Get Test Details
    test = db.query(models.ScheduledTest).filter(models.ScheduledTest.id == test_id).first()
    if not test:
        return {"error": "Test not found"}
    
    # 2. Get Problems in this test
    test_problems = db.query(models.TestProblem).filter(models.TestProblem.test_id == test_id).all()
    problem_ids = [tp.problem_id for tp in test_problems]
    
    # 3. Get Submissions for these problems in this test
    # Fallback: check both test_id and time window
    st_fallback = test.start_time
    et_fallback = test.end_time
    all_subs = db.query(models.Submission).filter(
        models.Submission.user_id == user_id,
        (models.Submission.test_id == test_id) |
        (
            models.Submission.problem_id.in_(problem_ids) &
            (models.Submission.created_at >= st_fallback) &
            (models.Submission.created_at <= et_fallback)
        ) if problem_ids else (models.Submission.test_id == test_id)
    ).order_by(models.Submission.created_at.desc()).all()

    # Separate true submissions from runs
    true_submissions = [s for s in all_subs if s.is_test_submission]
    
    # Deduplicate to get LATEST per problem
    latest_true_subs = {}
    for s in true_submissions:
        if s.problem_id not in latest_true_subs:
            latest_true_subs[s.problem_id] = s
    
    # 4. Get Violations
    violations_raw = db.query(models.BehaviorLog).filter(
        models.BehaviorLog.user_id == user_id,
        models.BehaviorLog.test_id == test_id
    ).all()
    
    v_counts = {}
    for v in violations_raw:
        v_counts[v.event_type] = v_counts.get(v.event_type, 0) + 1
    
    # Format violations for frontend
    all_types = ["TAB_SWITCH", "OBJECT_DETECTED", "CAMERA_BLOCKED", "EXIT_FULLSCREEN"]
    violations = [{"type": t, "count": v_counts.get(t, 0), "severity": "MEDIUM" if v_counts.get(t, 0) > 0 else "LOW"} for t in all_types]

    # Calculate Score using ONLY the latest true submission per problem
    solved_count = len([s for s in latest_true_subs.values() if s.verdict == "Passed"])
    total_p = len(problem_ids)
    score = round((solved_count / total_p * 100), 0) if total_p > 0 else 0

    return {
        "test": {
            "id": test.id,
            "title": test.title,
            "start_time": test.start_time.isoformat(),
            "end_time": test.end_time.isoformat()
        },
        "results": {
            "score": score,
            "solvedProblems": solved_count,
            "totalProblems": total_p,
            "submissions": [
                {
                    "id": s.id,
                    "problem_id": s.problem_id,
                    "problem_title": s.problem.title,
                    "verdict": s.verdict,
                    "passed_cases": s.passed_cases,
                    "total_cases": s.total_cases,
                    "code": s.code,
                    "is_test_submission": s.is_test_submission,
                    "is_latest": s.id in [ls.id for ls in latest_true_subs.values()],
                    "error_message": s.error_message,
                    "submitted_at": s.created_at.isoformat()
                } for s in all_subs
            ]
        },
        "violations": violations
    }

@router.get("/enrollments/{user_id}")
def get_user_enrollments(user_id: int, db: Session = Depends(database.get_db)):
    enrollments = db.query(models.TestEnrollment).filter(models.TestEnrollment.user_id == user_id).all()
    return [
        {
            "test_id": e.test_id,
            "status": e.status
        } for e in enrollments
    ]

@router.post("/log-behavior")
def log_behavior_violation(
    violation: dict,
    db: Session = Depends(database.get_db)
):
    """Log proctoring violations during tests"""
    log = models.BehaviorLog(
        user_id=violation.get("user_id"),
        problem_id=violation.get("problem_id"),
        test_id=violation.get("test_id"),
        event_type=violation.get("event_type"),
        severity=violation.get("severity", "LOW"),
        details=violation.get("details", "")
    )
    db.add(log)
    db.commit()
    return {"status": "logged", "event_type": violation.get("event_type")}

@router.get("/active-test")
def get_active_test(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """Get currently active scheduled test for a user"""
    from datetime import datetime
    now = datetime.now()
    
    # Find active tests within time window
    active_tests = db.query(models.ScheduledTest).filter(
        models.ScheduledTest.is_active == True,
        models.ScheduledTest.start_time <= now,
        models.ScheduledTest.end_time >= now
    ).all()
    
    if not active_tests:
        return {"active_test": None}
    
    # Return first active test with its problems via junction table
    test = active_tests[0]
    
    # CHECK ENROLLMENT STATUS - BLOCK RE-ENTRY
    enrollment = db.query(models.TestEnrollment).filter(
        models.TestEnrollment.test_id == test.id,
        models.TestEnrollment.user_id == current_user.id
    ).first()
    
    if enrollment:
        if enrollment.status == "COMPLETED":
            return {"active_test": None, "message": "You have already submitted this test and cannot re-enter."}
        if enrollment.status == "DISQUALIFIED":
            return {"active_test": None, "message": "You have been disqualified from this test for proctoring violations."}
    
    # Get problems through the junction table
    test_problems = db.query(models.TestProblem).filter(
        models.TestProblem.test_id == test.id
    ).order_by(models.TestProblem.order).all()
    
    problems = [tp.problem for tp in test_problems]
    
    # Ensure student is marked as present
    if not enrollment:
        enrollment = models.TestEnrollment(test_id=test.id, user_id=current_user.id, status="PRESENT")
        db.add(enrollment)
        db.commit()
    elif enrollment.status == "REGISTERED":
        enrollment.status = "PRESENT"
        db.commit()
    
    return {
        "active_test": {
            "id": test.id,
            "title": test.title,
            "start_time": test.start_time.isoformat(),
            "end_time": test.end_time.isoformat(),
            "problems": [
                {
                    "id": p.id,
                    "title": p.title,
                    "description": p.description,
                    "difficulty": p.difficulty,
                    "category": p.category
                }
                for p in problems
            ]
        }
    }

@router.post("/complete-test/{test_id}")
def complete_test(test_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """Mark a test as completed by the student"""
    enrollment = db.query(models.TestEnrollment).filter(
        models.TestEnrollment.test_id == test_id,
        models.TestEnrollment.user_id == current_user.id
    ).first()
    
    if not enrollment:
        enrollment = models.TestEnrollment(test_id=test_id, user_id=current_user.id, status="COMPLETED")
        db.add(enrollment)
    else:
        enrollment.status = "COMPLETED"
    
    db.commit()
    return {"status": "completed", "test_id": test_id}

@router.post("/disqualify-test/{test_id}")
def disqualify_test(test_id: int, user_id: int, db: Session = Depends(database.get_db)):
    """Explicitly disqualify a student from a test (usually called by proctoring)"""
    enrollment = db.query(models.TestEnrollment).filter(
        models.TestEnrollment.test_id == test_id,
        models.TestEnrollment.user_id == user_id
    ).first()
    
    if not enrollment:
        enrollment = models.TestEnrollment(test_id=test_id, user_id=user_id, status="DISQUALIFIED")
        db.add(enrollment)
    else:
        enrollment.status = "DISQUALIFIED"
    
    db.commit()
    return {"status": "disqualified", "test_id": test_id}

@router.get("/test-history/{user_id}")
def get_student_test_history(user_id: int, db: Session = Depends(database.get_db)):
    """Get a summary of all tests completed by a student"""
    enrollments = db.query(models.TestEnrollment).filter(
        models.TestEnrollment.user_id == user_id,
        models.TestEnrollment.status == "COMPLETED"
    ).all()
    
    history = []
    for enrollment in enrollments:
        test = enrollment.test
        # Get problems for this test
        test_problems = db.query(models.TestProblem).filter(models.TestProblem.test_id == test.id).all()
        problem_ids = [tp.problem_id for tp in test_problems]
        
        # Get student's submissions for this test
        submissions = db.query(models.Submission).filter(
            models.Submission.user_id == user_id,
            models.Submission.test_id == test.id
        ).all()
        
        # Calculate score
        solved = len([s for s in submissions if s.verdict == "Passed"])
        total = len(problem_ids)
        score = round((solved / total * 100), 0) if total > 0 else 0
        
        history.append({
            "test_id": test.id,
            "title": test.title,
            "completed_at": test.end_time.isoformat(), # Use test end time as completion time approx
            "score": score,
            "solved": solved,
            "total": total
        })
        
    return history

from fastapi import APIRouter, Depends
from typing import Optional
from sqlalchemy.orm import Session
from app.db import database
from app.models import models
from app.schemas import schemas
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/stats/{user_id}")
def get_student_stats(user_id: int, db: Session = Depends(database.get_db)):
    submissions = db.query(models.Submission).filter(models.Submission.user_id == user_id).all()
    
    total_submissions = len(submissions)
    passed_submissions = len({s.problem_id for s in submissions if s.verdict == "Passed"}) # Unique problems solved
    failed_attempts = len([s for s in submissions if s.verdict != "Passed"])
    
    strike_rate = 0.0
    if total_submissions > 0:
        strike_rate = failed_attempts / total_submissions
    
    # Calculate streak
    from datetime import datetime, date, timedelta
    dates = sorted({s.created_at.date() for s in submissions}, reverse=True)
    
    streak = 0
    if dates:
        today = date.today()
        # If the latest submission is today or yesterday, start counting
        if dates[0] == today or dates[0] == today - timedelta(days=1):
            streak = 1
            for i in range(len(dates) - 1):
                if dates[i] - dates[i+1] == timedelta(days=1):
                    streak += 1
                else:
                    break
                    
    return {
        "solved_count": passed_submissions,
        "total_attempts": total_submissions,
        "strike_rate": round(strike_rate, 2),
        "streak": streak,
        "mastery_level": "Expert" if passed_submissions > 10 else "Advanced" if passed_submissions > 5 else "Pioneer"
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
    query = db.query(models.Submission).filter(models.Submission.user_id == user_id)
    
    if test_id:
        query = query.filter(models.Submission.test_id == test_id)
        
    submissions = query.order_by(models.Submission.created_at.desc()).all()
    
    return [
        {
            "id": s.id,
            "problem_id": s.problem_id,
            "test_id": s.test_id,
            "problem_title": s.problem.title,
            "verdict": s.verdict,
            "passed_cases": s.passed_cases,
            "total_cases": s.total_cases,
            "code": s.code,
            "error_message": s.error_message,
            "submitted_at": s.created_at.isoformat()
        }
        for s in submissions
    ]

@router.get("/analytics/{user_id}")
def get_student_analytics(user_id: int, db: Session = Depends(database.get_db)):
    submissions = db.query(models.Submission).filter(
        models.Submission.user_id == user_id
    ).all()
    
    # 1. Category mastery breakdown
    problems = db.query(models.Problem).all()
    category_summary = {}
    
    for problem in problems:
        cat = problem.category
        if cat not in category_summary:
            category_summary[cat] = {"total": 0, "solved": 0}
        category_summary[cat]["total"] += 1
    
    for sub in submissions:
        if sub.verdict == "Passed":
            cat = sub.problem.category
            if cat in category_summary:
                category_summary[cat]["solved"] += 1
    
    category_mastery = []
    for cat, data in category_summary.items():
        accuracy = (data["solved"] / data["total"] * 100) if data["total"] > 0 else 0
        category_mastery.append({
            "label": cat,
            "solved": data["solved"],
            "total": data["total"],
            "progress": round(accuracy, 1)
        })
    
    # 2. Heatmap (last 30 days)
    from datetime import datetime, timedelta, date
    today = date.today()
    last_30_days = [today - timedelta(days=i) for i in range(29, -1, -1)]
    
    submission_dates = [s.created_at.date() for s in submissions]
    
    heatmap = []
    for day in last_30_days:
        count = submission_dates.count(day)
        # Determine activity level (0-3)
        level = 0
        if count > 5: level = 3
        elif count > 2: level = 2
        elif count > 0: level = 1
        
        heatmap.append({
            "date": day.isoformat(),
            "count": count,
            "level": level
        })
        
    # 5. Milestones
    solved_problem_ids = {s.problem_id for s in submissions if s.verdict == "Passed"}
    
    # Get current streak from the helper logic
    streak = 0
    if submission_dates:
        unique_dates = sorted(list(set(submission_dates)), reverse=True)
        if unique_dates[0] == today or unique_dates[0] == today - timedelta(days=1):
            streak = 1
            for i in range(len(unique_dates) - 1):
                if unique_dates[i] - unique_dates[i+1] == timedelta(days=1):
                    streak += 1
                else: break
                
    milestones = [
        {"icon": "🏁", "name": "First Blood", "desc": "Solved 1st challenge", "active": len(solved_problem_ids) >= 1},
        {"icon": "🏆", "name": "Polyglot", "desc": "Solved in 1+ problems", "active": len(solved_problem_ids) >= 1},
        {"icon": "🛡️", "name": "Security Pro", "desc": "Logged into platform", "active": True},
        {"icon": "🔥", "name": "Hot Streak", "desc": "Any active streak", "active": streak >= 1}
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

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.db import database
from app.models import models
from app.schemas import schemas

router = APIRouter()

@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(database.get_db)):
    # Leaderboard logic: Most solved count, excluding admins (case-insensitive)
    from sqlalchemy import func
    users = db.query(models.User).filter(func.upper(models.User.role) != "ADMIN").all()
    leaderboard = []
    
    for user in users:
        solved = db.query(models.Submission).filter(
            models.Submission.user_id == user.id, 
            models.Submission.verdict == "Passed"
        ).count()
        
        leaderboard.append({
            "id": user.id,
            "username": user.username,
            "solved": solved,
            "role": user.role
        })
        
    return sorted(leaderboard, key=lambda x: x["solved"], reverse=True)

@router.get("/global-stats")
def get_global_stats(db: Session = Depends(database.get_db)):
    from sqlalchemy import func
    total_users = db.query(models.User).filter(func.upper(models.User.role) != "ADMIN").count()
    # "Live Challenges" should only include problems that are not test-exclusive
    total_problems = db.query(models.Problem).filter(models.Problem.is_test_problem == False).count()
    
    # Exclude admin submissions from global metrics
    total_submissions = db.query(models.Submission).join(models.User).filter(func.upper(models.User.role) != "ADMIN").count()
    passed_submissions = db.query(models.Submission).join(models.User).filter(
        models.Submission.verdict == "Passed",
        func.upper(models.User.role) != "ADMIN"
    ).count()
    
    pass_rate = (passed_submissions / total_submissions * 100) if total_submissions > 0 else 0
    
    return {
        "total_users": total_users,
        "total_problems": total_problems, # Dynamic total from DB
        "total_submissions": total_submissions,
        "pass_rate": round(pass_rate, 1)
    }

def enrich_test_helper(test: models.ScheduledTest):
    from datetime import datetime
    now = datetime.now()
    
    # Check time bounds - stripped for naive comparison
    st = test.start_time.replace(tzinfo=None) if test.start_time.tzinfo else test.start_time
    et = test.end_time.replace(tzinfo=None) if test.end_time.tzinfo else test.end_time
    
    if now < st:
        status = "UPCOMING"
    elif st <= now <= et:
        status = "ACTIVE"
    else:
        status = "EXPIRED"

    # Dynamic active status: flag must be True AND we must be in window
    is_active = bool(test.is_active and status == "ACTIVE")
    
    return {
        "id": test.id,
        "title": test.title,
        "start_time": test.start_time,
        "end_time": test.end_time,
        "is_active": is_active,
        "status": status,
        "problem_ids": [tp.problem_id for tp in test.test_problems]
    }

@router.post("/tests", response_model=schemas.ScheduledTestResponse)
def create_test(test: schemas.TestCreate, db: Session = Depends(database.get_db)):
    # Create the test
    new_test = models.ScheduledTest(
        title=test.title,
        start_time=test.start_time,
        end_time=test.end_time
    )
    db.add(new_test)
    db.commit()
    db.refresh(new_test)
    
    # Add problems to test using junction table
    for idx, problem_id in enumerate(test.problem_ids):
        test_problem = models.TestProblem(
            test_id=new_test.id,
            problem_id=problem_id,
            order=idx
        )
        db.add(test_problem)
    
    db.commit()
    db.refresh(new_test)
    return enrich_test_helper(new_test)

@router.get("/tests", response_model=List[schemas.ScheduledTestResponse])
def get_tests(db: Session = Depends(database.get_db)):
    tests = db.query(models.ScheduledTest).all()
    return [enrich_test_helper(test) for test in tests]

@router.post("/test-problems")
def create_test_problem(problem_data: dict, db: Session = Depends(database.get_db)):
    """Create a problem exclusive to a test (won't appear in regular problem list)"""
    try:
        db_problem = models.Problem(
            title=problem_data.get("title"),
            description=problem_data.get("description"),
            difficulty=problem_data.get("difficulty", "Medium"),
            category=problem_data.get("category", "General"),
            starter_codes=problem_data.get("starter_codes", {"javascript": "", "python": ""}),
            is_test_problem=True  # Mark as test-exclusive
        )
        db.add(db_problem)
        db.commit()
        db.refresh(db_problem)
        
        # Add test cases
        for tc in problem_data.get("test_cases", []):
            db_tc = models.TestCase(
                problem_id=db_problem.id,
                input_data=tc.get("input_data", ""),
                expected_output=tc.get("expected_output", ""),
                is_hidden=tc.get("is_hidden", False)
            )
            db.add(db_tc)
        
        db.commit()
        db.refresh(db_problem)
        
        return {"id": db_problem.id, "title": db_problem.title, "status": "created"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

@router.get("/test-results/{test_id}")
def get_test_results(test_id: int, db: Session = Depends(database.get_db)):
    """Get all student results for a specific test (Admin only)"""
    from sqlalchemy import func
    
    # Get test details
    test = db.query(models.ScheduledTest).filter(models.ScheduledTest.id == test_id).first()
    if not test:
        return {"error": "Test not found"}
    
    # Get all problems in this test
    test_problems = db.query(models.TestProblem).filter(
        models.TestProblem.test_id == test_id
    ).order_by(models.TestProblem.order).all()
    
    problem_ids = [tp.problem_id for tp in test_problems]
    
    # Get all participants - those enrolled, marked present, or with submissions/logs for this test
    # Also fallback: anyone who submitted to these problems during the test window
    enrolled_ids = [r[0] for r in db.query(models.TestEnrollment.user_id).filter(models.TestEnrollment.test_id == test_id).all()]
    submission_ids = [r[0] for r in db.query(models.Submission.user_id).filter(models.Submission.test_id == test_id).all()]
    behavior_ids = [r[0] for r in db.query(models.BehaviorLog.user_id).filter(models.BehaviorLog.test_id == test_id).all()]
    
    # Fallback for submissions during window - normalize for naive comparison
    st_fallback = test.start_time.replace(tzinfo=None) if test.start_time.tzinfo else test.start_time
    et_fallback = test.end_time.replace(tzinfo=None) if test.end_time.tzinfo else test.end_time
    
    fallback_ids = [r[0] for r in db.query(models.Submission.user_id).filter(
        models.Submission.problem_id.in_(problem_ids),
        models.Submission.created_at >= st_fallback,
        models.Submission.created_at <= et_fallback
    ).all()] if problem_ids else []

    participant_ids = list(set(enrolled_ids + submission_ids + behavior_ids + fallback_ids))
    
    # Also track who explicitly clicked "Finish Test"
    completed_ids = [r[0] for r in db.query(models.TestEnrollment.user_id).filter(
        models.TestEnrollment.test_id == test_id,
        models.TestEnrollment.status == "COMPLETED"
    ).all()]
    
    # Still get all non-admin users for the total list, but identify who participated
    all_students = db.query(models.User).filter(func.upper(models.User.role) != "ADMIN").all()
    
    results = []
    participated_count = 0
    total_score_sum = 0
    total_submissions_count = 0
    total_violations_count = 0
    total_completed_count = 0

    for student in all_students:
        is_participant = student.id in participant_ids
        
        # Get submissions - FILTER FOR LATEST SUBMISSION PER PROBLEM
        # We only want is_test_submission=True for actual scoring
        all_subs = db.query(models.Submission).filter(
            models.Submission.user_id == student.id,
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
        
        # Scoring is based ONLY on the latest true submission for each problem
        solved_count = len([s for s in latest_true_subs.values() if s.verdict == "Passed"])
        total_p = len(problem_ids)
        score = (solved_count / total_p * 100) if total_p > 0 else 0
        
        # Count total ATTEMPTS (all submissions + runs) for the "Submissions" metric
        total_attempts = len(all_subs)
        
        # Get violation count
        violations = db.query(models.BehaviorLog).filter(
            models.BehaviorLog.user_id == student.id,
            models.BehaviorLog.test_id == test_id
        ).count()

        # Update aggregate stats if they actually did something or were enrolled
        if is_participant or total_attempts > 0 or violations > 0:
            participated_count += 1
            total_score_sum += score
            total_submissions_count += total_attempts
            total_violations_count += violations
            if student.id in completed_ids:
                total_completed_count += 1

        results.append({
            "user_id": student.id,
            "username": student.username,
            "email": student.email,
            "solved": solved_count,
            "total_problems": total_p,
            "score": round(score, 2),
            "violations": violations,
            "submissions": total_attempts,
            "participated": is_participant
        })
    
    return {
        "test": {
            "id": test.id,
            "title": test.title,
            "start_time": test.start_time.isoformat(),
            "end_time": test.end_time.isoformat()
        },
        "total_students": participated_count,
        "avg_score": round(total_score_sum / participated_count, 2) if participated_count > 0 else 0,
        "total_submissions": total_submissions_count,
        "total_violations": total_violations_count,
        "total_completed": total_completed_count,
        "results": sorted(results, key=lambda x: (x["participated"], x["score"]), reverse=True)
    }

@router.get("/test-results/{test_id}/export")
def export_test_results_csv(test_id: int, db: Session = Depends(database.get_db)):
    """Export test results as CSV"""
    from fastapi.responses import Response
    from sqlalchemy import func
    import csv
    import io
    
    # Get test data (reuse logic from get_test_results)
    test = db.query(models.ScheduledTest).filter(models.ScheduledTest.id == test_id).first()
    if not test:
        return {"error": "Test not found"}
    
    test_problems = db.query(models.TestProblem).filter(
        models.TestProblem.test_id == test_id
    ).order_by(models.TestProblem.order).all()
    
    problem_ids = [tp.problem_id for tp in test_problems]
    
    # Get all participants
    enrolled_ids = [r[0] for r in db.query(models.TestEnrollment.user_id).filter(models.TestEnrollment.test_id == test_id).all()]
    submission_ids = [r[0] for r in db.query(models.Submission.user_id).filter(models.Submission.test_id == test_id).all()]
    behavior_ids = [r[0] for r in db.query(models.BehaviorLog.user_id).filter(models.BehaviorLog.test_id == test_id).all()]
    
    st_fallback = test.start_time
    et_fallback = test.end_time
    fallback_ids = [r[0] for r in db.query(models.Submission.user_id).filter(
        models.Submission.problem_id.in_(problem_ids),
        models.Submission.created_at >= st_fallback,
        models.Submission.created_at <= et_fallback
    ).all()] if problem_ids else []

    participant_ids = list(set(enrolled_ids + submission_ids + behavior_ids + fallback_ids))
    all_students = db.query(models.User).filter(func.upper(models.User.role) != "ADMIN").all()
    
    # Prepare CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["Student ID", "Username", "Email", "Solved", "Total Problems", "Score (%)", "Violations", "Total Submissions"])
    
    # Data rows
    for student in all_students:
        submissions = db.query(models.Submission).filter(
            models.Submission.user_id == student.id,
            (models.Submission.test_id == test_id) | 
            (
                models.Submission.problem_id.in_(problem_ids) & 
                (models.Submission.created_at >= st_fallback) & 
                (models.Submission.created_at <= et_fallback)
            ) if problem_ids else (models.Submission.test_id == test_id)
        ).all()
        
        violations = db.query(models.BehaviorLog).filter(
            models.BehaviorLog.user_id == student.id,
            models.BehaviorLog.test_id == test_id
        ).count()
        
        solved = len([s for s in submissions if s.verdict == "Passed"])
        total_problems = len(problem_ids)
        score = (solved / total_problems * 100) if total_problems > 0 else 0
        
        writer.writerow([
            student.id,
            student.username,
            student.email,
            solved,
            total_problems,
            round(score, 2),
            violations,
            len(submissions)
        ])
    
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=test_{test_id}_results.csv"}
    )

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.db import database
from app.models import models
from app.schemas import schemas
from app.services.compiler import CodeExecutor
from app.api.deps import get_current_user
import json

router = APIRouter()
executor = CodeExecutor()

@router.post("/", response_model=schemas.ExecutionResult)
def execute_code(
    request: schemas.ExecuteRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Fetch Problem
    problem = db.query(models.Problem).filter(models.Problem.id == request.problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # 2. Prepare Test Cases
    test_cases_dicts = []
    for tc in problem.test_cases:
        test_cases_dicts.append({
            "input_data": tc.input_data,
            "expected_output": tc.expected_output
        })
    
    # 3. Run Code
    if request.language == "javascript":
        result = executor.run_javascript(request.code, test_cases_dicts)
    elif request.language == "python":
        result = executor.run_python(request.code, test_cases_dicts)
    else:
        raise HTTPException(status_code=400, detail="Unsupported language")
    
    # 4. Record Submission
    user_id = current_user.id 
    
    submission = models.Submission(
        user_id=user_id,
        problem_id=problem.id,
        test_id=request.test_id,
        code=request.code,
        verdict=result["verdict"],
        passed_cases=result["passed_cases"],
        total_cases=result["total_cases"],
        execution_time_ms=result["execution_time"],
        error_message=result.get("output_log") if result["verdict"] == "Error" else None,
        is_test_submission=request.is_test_submission
    )
    db.add(submission)
    db.commit()
    
    return result

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db import database
from app.models import models
from app.schemas import schemas

from app.core.security import get_password_hash # Not needed here but keeping clean imports
from app.api.deps import get_current_admin

router = APIRouter()

@router.get("", response_model=List[schemas.ProblemResponse])
def get_problems(db: Session = Depends(database.get_db)):
    # Only return non-test problems for regular problem list
    problems = db.query(models.Problem).filter(models.Problem.is_test_problem == False).all()
    import json
    for p in problems:
        if isinstance(p.starter_codes, str):
            p.starter_codes = json.loads(p.starter_codes)
    return problems

@router.post("", response_model=schemas.ProblemResponse)
def create_problem(
    problem: schemas.ProblemCreate, 
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    try:
        db_problem = models.Problem(
            title=problem.title,
            description=problem.description,
            difficulty=problem.difficulty,
            category=problem.category,
            starter_codes=problem.starter_codes,
            creator_id=current_admin.id,
            is_test_problem=problem.is_test_problem if hasattr(problem, 'is_test_problem') else False
        )
        db.add(db_problem)
        db.commit()
        db.refresh(db_problem)
        
        # Add test cases
        for tc in problem.test_cases:
            db_tc = models.TestCase(
                problem_id=db_problem.id,
                input_data=tc.input_data,
                expected_output=tc.expected_output,
                is_hidden=tc.is_hidden
            )
            db.add(db_tc)
        
        db.commit()
        db.refresh(db_problem)
        
        # Ensure starter_codes is a dict (fixes ResponseValidationError if DB column is Text)
        if isinstance(db_problem.starter_codes, str):
            import json
            db_problem.starter_codes = json.loads(db_problem.starter_codes)
            
        return db_problem
    except Exception as e:
        db.rollback()
        print(f"ERROR creating problem: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Database error while creating problem: {str(e)}"
        )

@router.get("/{problem_id}", response_model=schemas.ProblemResponse)
def get_problem(problem_id: int, db: Session = Depends(database.get_db)):
    problem = db.query(models.Problem).filter(models.Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
        
    # Ensure starter_codes is a dict
    if isinstance(problem.starter_codes, str):
        import json
        problem.starter_codes = json.loads(problem.starter_codes)
        
    return problem

@router.put("/{problem_id}", response_model=schemas.ProblemResponse)
def update_problem(
    problem_id: int,
    problem_update: schemas.ProblemUpdate,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    db_problem = db.query(models.Problem).filter(models.Problem.id == problem_id).first()
    if not db_problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # Optional: Only creator or super-admin can edit
    # if db_problem.creator_id != current_admin.id:
    #     raise HTTPException(status_code=403, detail="Not authorized to edit this problem")

    try:
        update_data = problem_update.dict(exclude_unset=True)
        test_cases = update_data.pop("test_cases", None)

        for key, value in update_data.items():
            setattr(db_problem, key, value)
        
        if test_cases is not None:
            # Simple approach: delete old test cases and add new ones
            db.query(models.TestCase).filter(models.TestCase.problem_id == problem_id).delete()
            for tc in test_cases:
                db_tc = models.TestCase(
                    problem_id=problem_id,
                    input_data=tc.input_data,
                    expected_output=tc.expected_output,
                    is_hidden=tc.is_hidden
                )
                db.add(db_tc)
        
        db.commit()
        db.refresh(db_problem)
        return db_problem
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{problem_id}")
def delete_problem(
    problem_id: int,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    db_problem = db.query(models.Problem).filter(models.Problem.id == problem_id).first()
    if not db_problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    try:
        # Delete related test cases first if not cascaded
        db.query(models.TestCase).filter(models.TestCase.problem_id == problem_id).delete()
        db.delete(db_problem)
        db.commit()
        return {"status": "success", "message": "Problem deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

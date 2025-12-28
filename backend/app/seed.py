from sqlalchemy.orm import Session
from app.db import database
from app.models import models
from app.core import security
import json
import traceback

def seed():
    try:
        print("Resetting database...")
        models.Base.metadata.drop_all(bind=database.engine)
        models.Base.metadata.create_all(bind=database.engine)
        
        db = next(database.get_db())
        print("Creating users...")
        users = [
            models.User(email="admin@example.com", username="admin", hashed_password=security.get_password_hash("adminpass"), role="ADMIN"),
            models.User(email="student@example.com", username="curious_student", hashed_password=security.get_password_hash("studentpass"), role="STUDENT")
        ]
        db.add_all(users)
        db.commit()

        print("Creating problems...")
        prob_data = {
            "title": "Two Sum",
            "description": "Given an array of integers, return indices of the two numbers such that they add up to a specific target.",
            "difficulty": "Easy",
            "category": "Arrays",
            "starter_codes": {
                "javascript": "function solution(nums, target) {\n  // your code here\n}",
                "python": "def solution(nums: list[int], target: int) -> list[int]:\n    # your code here\n    pass"
            }
        }
        
        # Explicit serialization to string for the Text column
        problem = models.Problem(
            title=prob_data["title"],
            description=prob_data["description"],
            difficulty=prob_data["difficulty"],
            category=prob_data["category"],
            starter_codes=json.dumps(prob_data["starter_codes"])
        )
        db.add(problem)
        db.commit()
        db.refresh(problem)

        print(f"Adding test cases for problem {problem.id}...")
        test_cases = [
            models.TestCase(problem_id=problem.id, input_data="[2, 7, 11, 15], 9", expected_output="[0, 1]", is_hidden=False),
            models.TestCase(problem_id=problem.id, input_data="[3, 2, 4], 6", expected_output="[1, 2]", is_hidden=False)
        ]
        db.add_all(test_cases)
        db.commit()

        print("Done.")
    except Exception as e:
        print(f"Error during seeding: {e}")
        traceback.print_exc()
        db.rollback()

if __name__ == "__main__":
    seed()

import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.models.learning import Course, CourseProblem, CourseProblemTestCase
from app.models.models import User
from app.db import database
from datetime import datetime

def seed():
    db = SessionLocal()
    try:
        print("--- Coding Platform Seed v2 (Python Mastery) ---")
        
        # 1. Ensure Python Course Exists
        course = db.query(Course).filter(Course.language == "Python").first()
        if not course:
            course = Course(
                language="Python",
                editor_language="python",
                is_active=True
            )
            db.add(course)
            db.commit()
            db.refresh(course)
            print(f"Created course: {course.language}")
        else:
            print(f"Found existing course: {course.language}")

        # Define 7 Steps
        steps = [
            {
                "step_number": 1,
                "title": "The First Awakening",
                "description": "Welcome to Python. Your first task is simple: establish communication. Use the 'print' function to output exactly the phrase 'Hello, Python!' to the console.",
                "starter_code": "# established communication\n\n",
                "solution_code": "print('Hello, Python!')",
                "test_cases": [{"input": "", "output": "Hello, Python!"}]
            },
            {
                "step_number": 2,
                "title": "Variable Arithmetic",
                "description": "Create two variables 'a' and 'b', assign them the values 5 and 10 respectively. Then, print their sum.",
                "starter_code": "a = 5\n# b = ?\n",
                "solution_code": "a = 5\nb = 10\nprint(a + b)",
                "test_cases": [{"input": "", "output": "15"}]
            },
            {
                "step_number": 3,
                "title": "Guard Duty (Conditionals)",
                "description": "A variable 'score' is predefined (e.g., score = 85). Write a program that checks the score. If it's 80 or above, print 'Passed'. Otherwise, print 'Try Again'.",
                "starter_code": "score = 85\n# write your if/else logic here\n",
                "solution_code": "score = 85\nif score >= 80:\n    print('Passed')\nelse:\n    print('Try Again')",
                "test_cases": [{"input": "", "output": "Passed"}]
            },
            {
                "step_number": 4,
                "title": "The Infinite Loop (Loops)",
                "description": "Print all numbers from 1 to 5 (inclusive), each on a new line, using a 'for' loop and a 'range()'.",
                "starter_code": "for i in ...\n",
                "solution_code": "for i in range(1, 6):\n    print(i)",
                "test_cases": [{"input": "", "output": "1\n2\n3\n4\n5"}]
            },
            {
                "step_number": 5,
                "title": "List Mastery",
                "description": "Given a list 'fruits = [\"apple\", \"banana\", \"cherry\"]', print the second item in the list.",
                "starter_code": "fruits = [\"apple\", \"banana\", \"cherry\"]\n# your code here\n",
                "solution_code": "fruits = [\"apple\", \"banana\", \"cherry\"]\nprint(fruits[1])",
                "test_cases": [{"input": "", "output": "banana"}]
            },
            {
                "step_number": 6,
                "title": "Dictionary Secrets",
                "description": "Create a dictionary named 'hero' with keys 'name' (value 'Pythonic') and 'power' (value 'Code'). Print the value associated with the key 'power'.",
                "starter_code": "# hero = { ... }\n",
                "solution_code": "hero = {'name': 'Pythonic', 'power': 'Code'}\nprint(hero['power'])",
                "test_cases": [{"input": "", "output": "Code"}]
            },
            {
                "step_number": 7,
                "title": "The Function Forge",
                "description": "Define a function 'greet(name)' that returns 'Hello, {name}'. Then, call the function with the argument 'Student' and print the result.",
                "starter_code": "def greet(name):\n    return ...\n\n# call and print\n",
                "solution_code": "def greet(name):\n    return f'Hello, {name}'\n\nprint(greet('Student'))",
                "test_cases": [{"input": "", "output": "Hello, Student"}]
            }
        ]

        # 2. Add/Update Problems
        for s in steps:
            # Check if problem exists in this course
            problem = db.query(CourseProblem).filter(
                CourseProblem.course_id == course.id,
                CourseProblem.step_number == s["step_number"]
            ).first()

            if not problem:
                problem = CourseProblem(
                    course_id=course.id,
                    step_number=s["step_number"],
                    title=s["title"],
                    description=s["description"],
                    starter_code=s["starter_code"],
                    solution_code=s["solution_code"]
                )
                db.add(problem)
                db.commit()
                db.refresh(problem)
                print(f"Added Step {s['step_number']}: {s['title']}")
            else:
                # Update existing
                problem.title = s["title"]
                problem.description = s["description"]
                problem.starter_code = s["starter_code"]
                problem.solution_code = s["solution_code"]
                db.commit()
                print(f"Updated Step {s['step_number']}: {s['title']}")

            # Clear and Add Test Cases
            db.query(CourseProblemTestCase).filter(CourseProblemTestCase.problem_id == problem.id).delete()
            for tc in s["test_cases"]:
                db.add(CourseProblemTestCase(
                    problem_id=problem.id,
                    input_data=tc["input"],
                    expected_output=tc["output"],
                    is_hidden=False
                ))
            db.commit()

        print("--- Seeding Completed Successfully ---")

    except Exception as e:
        print(f"ERROR: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()

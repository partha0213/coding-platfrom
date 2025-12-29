import sys
import os
from sqlalchemy.orm import Session

# Add the parent directory to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import database
from app.models.models import User
from app.models.learning import Course, CourseProblem, CourseProblemTestCase, UserCourseProgress

def seed_python_course():
    db = next(database.get_db())
    
    # 1. Clear Existing Python Course
    python_course = db.query(Course).filter(Course.language == "python").first()
    if python_course:
        print(f"Cleaning up existing course: {python_course.id}")
        db.delete(python_course)
        db.commit()
    
    # 2. Create Master Course
    course = Course(
        language="python",
        editor_language="python",
        is_active=True
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    
    print(f"Created Mastering Python Course (ID: {course.id})")
    
    # 3. Define Steps
    problems = [
        {
            "step": 1,
            "title": "Welcome to Python",
            "desc": "Write a program that prints 'Hello, World!' to the console.",
            "starter": "print(\"Change me\")",
            "tests": [
                {"input": "", "output": "Hello, World!"}
            ]
        },
        {
            "step": 2,
            "title": "Simple Arithmetic",
            "desc": "Create two variables 'a' with value 10 and 'b' with value 5. Print their sum.",
            "starter": "a = 0\nb = 0\n# Print sum here",
            "tests": [
                {"input": "", "output": "15"}
            ]
        },
        {
            "step": 3,
            "title": "List Logic",
            "desc": "Create a list named 'fruits' containing 'apple', 'banana', and 'cherry'. Print the second item in the list.",
            "starter": "fruits = []\n# Print second item",
            "tests": [
                {"input": "", "output": "banana"}
            ]
        },
        {
            "step": 4,
            "title": "Looping Through Numbers",
            "desc": "Write a loop that prints numbers from 1 to 5 (inclusive), each on a new line.",
            "starter": "for i in range(1, 1):\n    pass",
            "tests": [
                {"input": "", "output": "1\n2\n3\n4\n5"}
            ]
        },
        {
            "step": 5,
            "title": "Defining Functions",
            "desc": "Define a function 'greet(name)' that returns 'Hello, {name}'. Then print the result of greet('Student').",
            "starter": "def greet(name):\n    return \"\"\n\n# Print greet('Student')",
            "tests": [
                {"input": "", "output": "Hello, Student"}
            ]
        }
    ]
    
    for p_data in problems:
        problem = CourseProblem(
            course_id=course.id,
            step_number=p_data["step"],
            title=p_data["title"],
            description=p_data["desc"],
            starter_code=p_data["starter"]
        )
        db.add(problem)
        db.commit()
        db.refresh(problem)
        
        # Add Test Cases
        for t_data in p_data["tests"]:
            tc = CourseProblemTestCase(
                problem_id=problem.id,
                input_data=t_data["input"],
                expected_output=t_data["output"]
            )
            db.add(tc)
        
        db.commit()
        print(f"  - Added Step {p_data['step']}: {p_data['title']}")

    print("\n✅ Mastering Python Course Seeded Successfully!")

if __name__ == "__main__":
    seed_python_course()

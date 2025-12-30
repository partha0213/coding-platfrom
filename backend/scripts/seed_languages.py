
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.database import SessionLocal, engine
from app.models.models import User
from app.models.learning import Course, Base

def seed_languages_tiered():
    print("Resetting and Seeding Tiered Courses...")
    
    # 1. Drop the courses table to handle schema change cleanly
    # WARNING: This deletes all existing course data!
    try:
        # We need to drop dependent tables first to avoid FK errors
        # course_problems, user_course_progress depend on courses
        with engine.connect() as conn:
            conn.execute(text("DROP TABLE IF EXISTS submission_logs"))
            conn.execute(text("DROP TABLE IF EXISTS course_problem_test_cases"))
            conn.execute(text("DROP TABLE IF EXISTS course_problems"))
            conn.execute(text("DROP TABLE IF EXISTS user_course_progress"))
            conn.execute(text("DROP TABLE IF EXISTS courses"))
            conn.commit()
            print("Dropped existing course tables.")
            
        # 2. Re-create tables
        Base.metadata.create_all(bind=engine)
        print("Re-created tables with new schema.")
        
    except Exception as e:
        print(f"Error during reset: {e}")
        return

    db = SessionLocal()
    
    languages = [
        {"language": "Python", "editor_language": "python"},
        {"language": "JavaScript", "editor_language": "javascript"},
        {"language": "Java", "editor_language": "java"},
        {"language": "C++", "editor_language": "cpp"},
        {"language": "C", "editor_language": "c"},
        {"language": "C#", "editor_language": "csharp"},
        {"language": "Go (Golang)", "editor_language": "go"},
        {"language": "Rust", "editor_language": "rust"},
        {"language": "TypeScript", "editor_language": "typescript"},
        {"language": "PHP", "editor_language": "php"},
        {"language": "Kotlin", "editor_language": "kotlin"},
    ]
    
    levels = [
        {"name": "Beginner", "order": 1},
        {"name": "Intermediate", "order": 2},
        {"name": "Advanced", "order": 3}
    ]
    
    total_added = 0
    
    for lang_data in languages:
        print(f"Adding tiers for {lang_data['language']}...")
        for lvl in levels:
            course = Course(
                language=lang_data["language"],
                editor_language=lang_data["editor_language"],
                level=lvl["name"],
                level_order=lvl["order"],
                is_active=True
            )
            db.add(course)
            total_added += 1
            
    db.commit()
    print(f"Successfully added {total_added} courses ({len(languages)} languages * 3 levels).")
    db.close()

if __name__ == "__main__":
    seed_languages_tiered()

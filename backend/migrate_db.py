"""
Migration script to add new columns for test-exclusive problems and enhanced behavior logging
Run this script to update your database schema
"""
from sqlalchemy import create_engine, text
from app.db.database import SQLALCHEMY_DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)

migrations = [
    # Add is_test_problem column to problems table
    """
    ALTER TABLE problems 
    ADD COLUMN IF NOT EXISTS is_test_problem BOOLEAN DEFAULT FALSE;
    """,
    
    # Add test_id and severity columns to behavior_logs table
    """
    ALTER TABLE behavior_logs 
    ADD COLUMN IF NOT EXISTS test_id INTEGER REFERENCES scheduled_tests(id);
    """,
    
    """
    ALTER TABLE behavior_logs 
    ADD COLUMN IF NOT EXISTS severity VARCHAR DEFAULT 'LOW';
    """,
    
    # Add problem_ids column to scheduled_tests table
    """
    ALTER TABLE scheduled_tests 
    ADD COLUMN IF NOT EXISTS problem_ids JSON DEFAULT '[]'::json;
    """
]

def run_migrations():
    with engine.connect() as conn:
        for migration in migrations:
            try:
                conn.execute(text(migration))
                conn.commit()
                print(f"✅ Executed: {migration.strip()[:60]}...")
            except Exception as e:
                print(f"❌ Error: {str(e)}")
                print(f"   SQL: {migration.strip()[:60]}...")
        
    print("\n🎉 Database migration completed!")

if __name__ == "__main__":
    print("🔧 Starting database migration...\n")
    run_migrations()

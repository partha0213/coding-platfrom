import psycopg2
import os

def migrate():
    url = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/coding_platform")
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    
    try:
        print("Checking for missing columns in 'submissions' table...")
        
        # Add test_id
        cur.execute("""
            ALTER TABLE submissions 
            ADD COLUMN IF NOT EXISTS test_id INTEGER 
            REFERENCES scheduled_tests(id);
        """)
        print("Added 'test_id' column.")
        
        # Add error_message
        cur.execute("""
            ALTER TABLE submissions 
            ADD COLUMN IF NOT EXISTS error_message TEXT;
        """)
        print("Added 'error_message' column.")
        
        conn.commit()
        print("Migration completed successfully.")
    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    migrate()

from sqlalchemy import create_engine, text
import os

SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://postgres:root@localhost:5432/coding_platform"
)

engine = create_engine(SQLALCHEMY_DATABASE_URL)

def migrate():
    with engine.connect() as connection:
        print("Attempting to add column 'creator_id' to 'problems' table...")
        try:
            connection.execute(text("ALTER TABLE problems ADD COLUMN creator_id INTEGER REFERENCES users(id);"))
            connection.commit()
            print("Successfully added creator_id column.")
        except Exception as e:
            print(f"Error or notice: {e}")

if __name__ == "__main__":
    migrate()

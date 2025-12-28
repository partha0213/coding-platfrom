from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# Load environment variables from .env file using absolute path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
env_path = os.path.join(BASE_DIR, ".env")
loaded = load_dotenv(dotenv_path=env_path, override=True)

# Default to a local postgres instance. User can override via env var.
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql://postgres:root@localhost:5432/coding_platform"

print(f"DEBUG: database.py loaded .env from {env_path}: {loaded}")
print(f"DEBUG: SQLALCHEMY_DATABASE_URL hostname: {DATABASE_URL.split('@')[-1].split('/')[0] if '@' in DATABASE_URL else 'local'}")

SQLALCHEMY_DATABASE_URL = DATABASE_URL

# fallback for local dev if postgres is not set up (commented out for prod-grade request)
# SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

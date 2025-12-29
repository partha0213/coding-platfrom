import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import Base, get_db
from app.models.learning import Course, CourseProblem, UserCourseProgress
from app.models.models import User
from app.api.deps import get_current_user, get_current_admin

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    # Clear overrides after test
    app.dependency_overrides = {}

@pytest.fixture
def mock_user(client, test_user):
    app.dependency_overrides[get_current_user] = lambda: test_user
    return test_user

@pytest.fixture
def mock_admin(client, test_admin):
    app.dependency_overrides[get_current_user] = lambda: test_admin
    app.dependency_overrides[get_current_admin] = lambda: test_admin
    return test_admin

@pytest.fixture
def test_user(db):
    user = User(username="testuser", email="test@example.com", hashed_password="hashed", role="STUDENT")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def test_admin(db):
    user = User(username="admin", email="admin@example.com", hashed_password="hashed", role="ADMIN")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def python_course(db):
    course = Course(language="Python", editor_language="python", is_active=True)
    db.add(course)
    db.commit()
    db.refresh(course)
    
    # Add 3 problems
    for i in range(1, 4):
        problem = CourseProblem(
            course_id=course.id,
            step_number=i,
            title=f"Step {i}",
            description=f"Description {i}",
            solution_code=f"Step {i}"  # The EXPECTED OUTPUT for the fallback logic
        )
        db.add(problem)
    db.commit()
    return course

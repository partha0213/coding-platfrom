from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="STUDENT") # "ADMIN", "STUDENT"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    submissions = relationship("Submission", back_populates="user")
    enrollments = relationship("TestEnrollment", back_populates="user")
    behavior_logs = relationship("BehaviorLog", back_populates="user")

class Problem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    difficulty = Column(String) # "Easy", "Medium", "Hard"
    category = Column(String, index=True)
    starter_codes = Column(JSON) # {"javascript": "...", "python": "..."}
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_test_problem = Column(Boolean, default=False)  # True if problem is exclusive to a test
    
    test_cases = relationship("TestCase", back_populates="problem")
    submissions = relationship("Submission", back_populates="problem")

class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id"))
    input_data = Column(Text) # JSON string or raw text
    expected_output = Column(Text)
    is_hidden = Column(Boolean, default=True)
    
    problem = relationship("Problem", back_populates="test_cases")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    problem_id = Column(Integer, ForeignKey("problems.id"))
    test_id = Column(Integer, ForeignKey("scheduled_tests.id"), nullable=True)  # New: track test submissions
    code = Column(Text)
    verdict = Column(String) # "Passed", "Failed", "Error"
    passed_cases = Column(Integer, default=0)
    total_cases = Column(Integer, default=0)
    execution_time_ms = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)  # New: store compilation/runtime errors
    is_test_submission = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="submissions")
    problem = relationship("Problem", back_populates="submissions")

# Telemetry Models
class BehaviorLog(Base):
    __tablename__ = "behavior_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=True)
    test_id = Column(Integer, ForeignKey("scheduled_tests.id"), nullable=True)
    event_type = Column(String) # "TAB_SWITCH", "OBJECT_DETECTED", "CAMERA_BLOCKED", "EXIT_FULLSCREEN"
    severity = Column(String, default="LOW") # "LOW", "MEDIUM", "HIGH"
    details = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="behavior_logs")

# Exam/Test Scheduler
class ScheduledTest(Base):
    __tablename__ = "scheduled_tests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)

    enrollments = relationship("TestEnrollment", back_populates="test")
    test_problems = relationship("TestProblem", back_populates="test", cascade="all, delete-orphan")

# Junction table for many-to-many relationship between tests and problems
class TestProblem(Base):
    __tablename__ = "test_problems"
    
    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("scheduled_tests.id"), nullable=False)
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=False)
    order = Column(Integer, default=0)  # To maintain problem order in test
    
    test = relationship("ScheduledTest", back_populates="test_problems")
    problem = relationship("Problem")

class TestEnrollment(Base):
    __tablename__ = "test_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("scheduled_tests.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="REGISTERED") # "REGISTERED", "PRESENT", "ABSENT"
    
    test = relationship("ScheduledTest", back_populates="enrollments")
    user = relationship("User", back_populates="enrollments")

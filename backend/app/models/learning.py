from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, UniqueConstraint, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

# Language-based sequential learning models

class Course(Base):
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    language = Column(String, nullable=False, index=True) # Not unique anymore
    level = Column(String, nullable=False) # "Beginner", "Intermediate", "Advanced"
    level_order = Column(Integer, nullable=False) # 1, 2, 3
    editor_language = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint('language', 'level', name='unique_lang_level'),
    )
    
    # Relationships
    problems = relationship("CourseProblem", back_populates="course", cascade="all, delete-orphan")
    user_progress = relationship("UserCourseProgress", back_populates="course", cascade="all, delete-orphan")


class CourseProblem(Base):
    __tablename__ = "course_problems"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    step_number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    starter_code = Column(Text, nullable=True)
    solution_code = Column(Text, nullable=True)  # Hidden from learners
    validation_policy = Column(JSON, nullable=True)  # Logic requirements (AST checks)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint('course_id', 'step_number', name='unique_course_step'),
    )
    
    # Relationships
    course = relationship("Course", back_populates="problems")
    test_cases = relationship("CourseProblemTestCase", back_populates="problem", cascade="all, delete-orphan")


class UserCourseProgress(Base):
    __tablename__ = "user_course_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    current_step = Column(Integer, default=1, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        UniqueConstraint('user_id', 'course_id', name='unique_user_course'),
    )
    
    # Relationships
    user = relationship("User")
    course = relationship("Course", back_populates="user_progress")


class CourseProblemTestCase(Base):
    __tablename__ = "course_problem_test_cases"
    
    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("course_problems.id", ondelete="CASCADE"), nullable=False, index=True)
    input_data = Column(Text, nullable=True)
    expected_output = Column(Text, nullable=False)
    is_hidden = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    problem = relationship("CourseProblem", back_populates="test_cases")


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String, nullable=False)  # e.g., "CREATE_COURSE", "REORDER_STEPS"
    entity_type = Column(String, nullable=False)  # e.g., "course", "problem"
    entity_id = Column(Integer, nullable=True)
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    admin = relationship("User")


class SubmissionLog(Base):
    __tablename__ = "submission_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    problem_id = Column(Integer, ForeignKey("course_problems.id", ondelete="CASCADE"), nullable=False, index=True)
    verdict = Column(String, nullable=False) # "Passed", "Failed", "Error"
    execution_time = Column(Float, nullable=True)
    timeout_flag = Column(Boolean, default=False)
    payload_size = Column(Integer, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")
    problem = relationship("CourseProblem")

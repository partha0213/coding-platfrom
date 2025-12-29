from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# ============================================================================
# Course Schemas
# ============================================================================

class CourseListResponse(BaseModel):
    id: int
    language: str
    editor_language: str
    total_steps: int
    current_step: int
    is_started: bool
    is_completed: bool


class CourseInfo(BaseModel):
    id: int
    language: str
    editor_language: str


# ============================================================================
# Problem Schemas
# ============================================================================

class ProblemListItem(BaseModel):
    id: int
    step_number: int
    title: str
    access_status: str  # "completed", "current", "locked"
    description: Optional[str] = None
    starter_code: Optional[str] = None
    test_cases: Optional[List['TestCaseResponse']] = None
    created_at: Optional[str] = None


class TestCaseRequest(BaseModel):
    input_data: Optional[str] = None
    expected_output: str
    is_hidden: bool = True


class TestCaseResponse(BaseModel):
    id: int
    problem_id: int
    input_data: Optional[str]
    expected_output: str
    is_hidden: bool
    created_at: datetime


class AuditLogResponse(BaseModel):
    id: int
    admin_id: int
    action: str
    entity_type: str
    entity_id: Optional[int]
    old_value: Optional[dict]
    new_value: Optional[dict]
    timestamp: datetime


class CourseProblemsResponse(BaseModel):
    course: CourseInfo
    progress: dict
    problems: list


class ProblemDetailResponse(BaseModel):
    id: int
    course_id: int
    step_number: int
    title: str
    description: str
    starter_code: Optional[str]
    course: CourseInfo
    progress: dict


# ============================================================================
# Submission Schemas
# ============================================================================

class SubmissionRequest(BaseModel):
    code: str


class SubmissionResponse(BaseModel):
    success: bool
    message: str
    progress: dict
    next_step_unlocked: Optional[bool] = None
    hint: Optional[str] = None


# ============================================================================
# Progress Schemas
# ============================================================================

class ProgressResponse(BaseModel):
    course_id: int
    language: str
    current_step: int
    completed_steps: int
    total_steps: int
    percentage_complete: float
    is_complete: bool

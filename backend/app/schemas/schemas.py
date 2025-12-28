from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Token
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class RefreshRequest(BaseModel):
    refresh_token: str

# User
class UserBase(BaseModel):
    email: str
    username: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime
    class Config:
        from_attributes = True

# Problem
class ProblemBase(BaseModel):
    title: str
    description: str
    difficulty: str
    category: str
    starter_codes: dict # {"javascript": "...", "python": "..."}

class TestCaseCreate(BaseModel):
    input_data: str
    expected_output: str
    is_hidden: bool

class ProblemCreate(ProblemBase):
    test_cases: List[TestCaseCreate]

class ProblemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None
    category: Optional[str] = None
    starter_codes: Optional[dict] = None
    test_cases: Optional[List[TestCaseCreate]] = None

class ProblemResponse(ProblemBase):
    id: int
    creator_id: Optional[int] = None
    class Config:
        from_attributes = True

# Executor
class ExecuteRequest(BaseModel):
    code: str
    problem_id: int
    test_id: Optional[int] = None
    language: str = "javascript" # or python
    is_test_submission: bool = False

class ExecutionResult(BaseModel):
    verdict: str # Passed, Failed, Error
    passed_cases: int
    total_cases: int
    output_log: str
    execution_time: float

# Behavior
class BehaviorEvent(BaseModel):
    problem_id: int
    event_type: str # TAB_SWITCH, PASTE_ATTEMPT
    details: Optional[str] = None

class BehaviorLogResponse(BaseModel):
    id: int
    event_type: str
    timestamp: datetime
class ScheduledTestResponse(BaseModel):
    id: int
    title: str
    start_time: datetime
    end_time: datetime
    is_active: bool
    status: str
    problem_ids: List[int] = []

    class Config:
        from_attributes = True

class TestCreate(BaseModel):
    title: str
    start_time: datetime
    end_time: datetime
    problem_ids: List[int] = []

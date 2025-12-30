from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import database
from .models import models
from .api.v1.endpoints import problems, student, admin, execution, auth, learning, learning_admin
# Create tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="CodeVault Assessment Platform", redirect_slashes=False)

# CORS
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://coding-platfrom-seven.vercel.app",
    "https://coding-platfrom-production.up.railway.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(problems.router, prefix="/api/v1/problems", tags=["problems"])
app.include_router(execution.router, prefix="/api/v1/execute", tags=["execution"])
app.include_router(student.router, prefix="/api/v1/student", tags=["student"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(learning.router, prefix="/api/v1/learning", tags=["learning"])
app.include_router(learning_admin.router, prefix="/api/v1/admin/learning", tags=["admin-learning"])

@app.get("/")
def read_root():
    return {"status": "ok", "message": "CodeVault API is running"}

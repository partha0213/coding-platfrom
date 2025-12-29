import pytest
from app.main import app
from app.models.learning import CourseProblem, UserCourseProgress
from app.api.deps import get_current_user, get_current_admin

def test_sequential_progression(client, test_user, python_course, db):
    """Test standard progression from step 1 to 2."""
    app.dependency_overrides[get_current_user] = lambda: test_user
    course_id = python_course.id
    problems = python_course.problems
    p1, p2, p3 = problems[0], problems[1], problems[2]
    
    # Check initial progress (step 1 should be unlocked)
    response = client.get(f"/api/v1/learning/courses/{course_id}/problems")
    assert response.status_code == 200
    data = response.json()["problems"]
    assert data[0]["access_status"] == "current"
    assert data[1]["access_status"] == "locked"
    
    # Submit correct solution for step 1
    response = client.post(
        f"/api/v1/learning/problems/{p1.id}/submit",
        json={"code": f"print('Step 1')"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["progress"]["current_step"] == 2
    
    # Check progress (step 2 should now be unlocked)
    response = client.get(f"/api/v1/learning/courses/{course_id}/problems")
    data = response.json()["problems"]
    assert data[0]["access_status"] == "completed"
    assert data[1]["access_status"] == "current"
    assert data[2]["access_status"] == "locked"

def test_bypass_attack(client, mock_user, python_course):
    """Attempt to submit to step 3 when on step 1."""
    course_id = python_course.id
    problems = python_course.problems
    p3 = problems[2]
    
    # Attempt to skip to step 3
    response = client.post(
        f"/api/v1/learning/problems/{p3.id}/submit",
        json={"code": "print('Step 3')"}
    )
    assert response.status_code == 403
    assert "Cannot skip to step 3" in response.json()["detail"]

def test_re_submit_attack(client, mock_user, python_course, db):
    """Attempt to re-submit to step 1 after completing it."""
    course_id = python_course.id
    p1 = python_course.problems[0]
    
    # Complete step 1
    client.post(f"/api/v1/learning/problems/{p1.id}/submit", json={"code": "print('Step 1')"})
    
    # Attempt to re-submit to step 1
    response = client.post(
        f"/api/v1/learning/problems/{p1.id}/submit",
        json={"code": "print('Step 1 again')"}
    )
    assert response.status_code == 403
    assert "already completed" in response.json()["detail"]

def test_locked_step_access(client, mock_user, python_course):
    """Attempt to get details of a locked step."""
    p2 = python_course.problems[1]
    
    # Attempt to access step 2 (locked)
    response = client.get(f"/api/v1/learning/problems/{p2.id}")
    assert response.status_code == 403
    assert "Step 2 is locked" in response.json()["detail"]

def test_admin_reorder_impact(client, test_user, test_admin, python_course, db):
    """Test reordering steps after user has progressed."""
    from app.api.deps import get_current_user, get_current_admin
    course_id = python_course.id
    p1, p2, p3 = python_course.problems[0], python_course.problems[1], python_course.problems[2]
    
    # User completes step 1
    app.dependency_overrides[get_current_user] = lambda: test_user
    client.post(f"/api/v1/learning/problems/{p1.id}/submit", json={"code": "print('Step 1')"})
    
    # Admin swaps step 2 and 3
    app.dependency_overrides[get_current_user] = lambda: test_admin
    app.dependency_overrides[get_current_admin] = lambda: test_admin
    response = client.post(
        f"/api/v1/admin/learning/courses/{course_id}/reorder",
        json={
            "mappings": [
                {"problem_id": p1.id, "new_step": 1},
                {"problem_id": p3.id, "new_step": 2},
                {"problem_id": p2.id, "new_step": 3}
            ]
        }
    )
    assert response.status_code == 200
    
    # User tries to submit to old step 2 (which is now step 3)
    app.dependency_overrides[get_current_user] = lambda: test_user
    response = client.post(
        f"/api/v1/learning/problems/{p2.id}/submit",
        json={"code": "print('Old step 2')"}
    )
    assert response.status_code == 403
    
    # User must submit to new step 2 (p3)
    response = client.post(
        f"/api/v1/learning/problems/{p3.id}/submit",
        json={"code": "print('Step 3')"}
    )
    assert response.status_code == 200

def test_progress_reset(client, test_user, test_admin, python_course, db):
    """Test resetting user progress."""
    from app.api.deps import get_current_user, get_current_admin
    course_id = python_course.id
    p1 = python_course.problems[0]
    user_id = test_user.id
    
    # User completes step 1
    app.dependency_overrides[get_current_user] = lambda: test_user
    client.post(f"/api/v1/learning/problems/{p1.id}/submit", json={"code": "print('Step 1')"})
    
    # Admin resets progress
    app.dependency_overrides[get_current_user] = lambda: test_admin
    app.dependency_overrides[get_current_admin] = lambda: test_admin
    response = client.delete(f"/api/v1/admin/learning/users/{user_id}/courses/{course_id}/progress")
    assert response.status_code == 200
    
    # User should be back to step 1
    app.dependency_overrides[get_current_user] = lambda: test_user
    response = client.get(f"/api/v1/learning/courses/{course_id}/problems")
    data = response.json()["problems"]
    assert data[0]["access_status"] == "current"

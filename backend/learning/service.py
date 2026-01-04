# service.py
import httpx
import os
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from datetime import datetime, timezone
from learning.repo import (

    create_session_attendance, get_session_attendance, get_session_attendance_by_id,
    update_session_attendance, delete_session_attendance, get_or_create_attendance,
    create_resource, get_resource_by_id, list_resources, update_resource, delete_resource,
    create_submission, get_submission_by_id, list_submissions, update_submission
)

ACADEMIC_SERVICE_URL = os.getenv("ACADEMIC_SERVICE_URL", "http://localhost:8003/academic")

# =========================
# HELPER: Call Academic Service
# =========================

def get_session_from_academic(session_id: str) -> Optional[Dict[str, Any]]:
    """Lấy thông tin session từ Academic service"""
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(f"{ACADEMIC_SERVICE_URL}/class-sessions/{session_id}")
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        print(f"Failed to get session from academic service: {e}")
        return None

def get_class_from_academic(class_id: str) -> Optional[Dict[str, Any]]:
    """Lấy thông tin class từ Academic service"""
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(f"{ACADEMIC_SERVICE_URL}/classes/{class_id}")
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        print(f"Failed to get class from academic service: {e}")
        return None



# =========================
# SESSION ATTENDANCE
# =========================

def svc_mark_attendance(**fields) -> Dict[str, Any]:
    """Điểm danh học sinh cho buổi học"""
    # Verify session exists
    session = get_session_from_academic(fields["session_id"])
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get or create attendance record
    attendance = get_or_create_attendance(
        session_id=fields["session_id"],
        student_id=fields["student_id"]
    )
    
    # Update status if different
    if fields.get("status") and fields["status"] != attendance["status"]:
        update_data = {"status": fields["status"]}
        attendance = update_session_attendance(attendance["id"], update_data)
    
    return attendance

def svc_list_session_attendance(
    session_id: Optional[str] = None,
    student_id: Optional[str] = None,
    status: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Lấy danh sách điểm danh"""
    return get_session_attendance(session_id=session_id, student_id=student_id, status=status)

def svc_get_session_attendance(attendance_id: str) -> Dict[str, Any]:
    """Lấy chi tiết điểm danh"""
    attendance = get_session_attendance_by_id(attendance_id)
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    return attendance

def svc_update_session_attendance(attendance_id: str, **fields) -> Dict[str, Any]:
    """Cập nhật điểm danh"""
    if not fields:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    existing = get_session_attendance_by_id(attendance_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    updated = update_session_attendance(attendance_id, fields)
    return updated

def svc_delete_session_attendance(attendance_id: str) -> Dict[str, str]:
    """Xóa điểm danh"""
    existing = get_session_attendance_by_id(attendance_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    delete_session_attendance(attendance_id)
    return {"message": "Attendance record deleted successfully"}

# =========================
# SESSION RESOURCES
# =========================

def svc_create_resource(**fields) -> Dict[str, Any]:
    """Tạo một tài nguyên mới."""
    session_id = fields.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    # Kiểm tra xem session có tồn tại không bằng cách gọi academic service
    session = get_session_from_academic(session_id)
    if not session:
        raise HTTPException(
            status_code=404, 
            detail=f"Session not found in academic service for ID: {session_id}"
        )
    
    return create_resource(fields)

def svc_list_resources(session_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Lấy danh sách tài nguyên."""
    return list_resources(session_id=session_id)

def svc_get_resource(resource_id: str) -> Dict[str, Any]:
    """Lấy chi tiết một tài nguyên."""
    resource = get_resource_by_id(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource

def svc_update_resource(resource_id: str, **fields) -> Dict[str, Any]:
    """Cập nhật một tài nguyên."""
    if not fields:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    existing = get_resource_by_id(resource_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    updated = update_resource(resource_id, fields)
    return updated or existing

def svc_delete_resource(resource_id: str) -> Dict[str, str]:
    """Xóa một tài nguyên."""
    existing = get_resource_by_id(resource_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    delete_resource(resource_id)
    return {"message": "Resource deleted successfully"}

# =========================
# STUDENT SUBMISSIONS
# =========================

def svc_create_submission(student_id: str, **fields) -> Dict[str, Any]:
    """Học viên nộp bài."""
    resource_id = fields.get("resource_id")
    
    # 1. Validate resource exists and is an exercise
    resource = get_resource_by_id(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource (exercise) not found")
    if resource.get("resource_type") != 'exercise':
        raise HTTPException(status_code=400, detail="You can only submit to resources of type 'exercise'")
        
    # 2. Check for duplicate submission
    existing_submission = list_submissions(resource_id=resource_id, student_id=student_id)
    if existing_submission:
        raise HTTPException(status_code=409, detail="You have already submitted for this exercise")

    # 3. Create submission
    payload = {
        "resource_id": resource_id,
        "student_id": student_id,
        "submission_url": fields.get("submission_url")
    }
    return create_submission(payload)

def svc_list_submissions(resource_id: Optional[str] = None, student_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Lấy danh sách bài nộp."""
    return list_submissions(resource_id=resource_id, student_id=student_id)

def svc_grade_submission(submission_id: str, **fields) -> Dict[str, Any]:
    """Gia sư chấm bài."""
    grade = fields.get("grade")
    feedback = fields.get("feedback")

    if grade is None:
        raise HTTPException(status_code=400, detail="grade is required for grading")

    submission = get_submission_by_id(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # TODO: Add authorization logic to ensure only the correct tutor can grade.

    update_payload = {
        "grade": grade,
        "feedback": feedback,
        "graded_at": datetime.now(timezone.utc)
    }
    
    updated = update_submission(submission_id, update_payload)
    return updated or submission

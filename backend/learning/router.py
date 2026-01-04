# router.py
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any
from learning.schemas import (
    SessionAttendanceCreate, SessionAttendanceUpdate, SessionAttendanceOut,
    SessionResourceCreate, SessionResourceUpdate, SessionResourceOut,
    StudentSubmissionCreate, StudentSubmissionUpdate, StudentSubmissionOut
)
from learning.service import (
    svc_mark_attendance, svc_list_session_attendance, svc_get_session_attendance,
    svc_update_session_attendance, svc_delete_session_attendance,
    svc_create_resource, svc_list_resources, svc_get_resource,
    svc_update_resource, svc_delete_resource,
    svc_create_submission, svc_list_submissions, svc_grade_submission
)
from learning.utils import get_current_user, require_roles
from pydantic import BaseModel

router = APIRouter(prefix="/learning")


# =========================
# SESSION ATTENDANCE (Điểm danh)
# =========================

@router.post("/attendance", response_model=SessionAttendanceOut, status_code=201, tags=["3. Attendance"])
def mark_attendance_api(
    body: SessionAttendanceCreate,
    claims: dict = Depends(require_roles(["student"]))
):
    """[STUDENT] Tự điểm danh cho buổi học của mình"""
    #Khi an nut tham gia vao buoi hoc call api nay
    student_id = claims.get("sub")
    return svc_mark_attendance(student_id=student_id, **body.model_dump())
@router.get("/attendance", response_model=List[SessionAttendanceOut], tags=["3. Attendance"])
def list_attendance_api(
    session_id: str | None = Query(None, description="Filter theo session_id"),
    student_id: str | None = Query(None, description="Filter theo student_id"),
    status: str | None = Query(None, description="Filter theo status (present|absent|late|excused)"),
    claims: dict = Depends(get_current_user)
):
    """Lấy danh sách điểm danh"""
    user_role = claims.get("role")
    user_id = claims.get("sub")
    
    # Students can only see their own attendance
    if user_role == "student":
        student_id = user_id
    
    return svc_list_session_attendance(session_id=session_id, student_id=student_id, status=status)

@router.get("/attendance/{attendance_id}", response_model=SessionAttendanceOut, tags=["3. Attendance"])
def get_attendance_api(
    attendance_id: str,
    claims: dict = Depends(get_current_user)
):
    """Lấy chi tiết điểm danh"""
    attendance = svc_get_session_attendance(attendance_id)
    
    # Students can only see their own attendance
    user_role = claims.get("role")
    user_id = claims.get("sub")
    if user_role == "student" and attendance["student_id"] != user_id:
        raise HTTPException(status_code=403, detail="Cannot view other students' attendance")
    
    return attendance

@router.patch("/attendance/{attendance_id}", response_model=SessionAttendanceOut, tags=["3. Attendance"])
def update_attendance_api(
    attendance_id: str,
    body: SessionAttendanceUpdate,
    claims: dict = Depends(require_roles(["tutor", "admin", "staff"]))
):
    """[TUTOR/ADMIN/STAFF] Cập nhật điểm danh"""
    return svc_update_session_attendance(attendance_id, **body.model_dump(exclude_unset=True))

@router.delete("/attendance/{attendance_id}", tags=["3. Attendance"])
def delete_attendance_api(
    attendance_id: str,
    claims: dict = Depends(require_roles(["admin", "staff"]))
):
    """[ADMIN/STAFF] Xóa điểm danh"""
    return svc_delete_session_attendance(attendance_id)

# =========================
# SESSION RESOURCES (Tài nguyên buổi học)
# =========================

@router.post("/resources", response_model=SessionResourceOut, status_code=201, tags=["4. Resources"])
def create_resource_api(
    body: SessionResourceCreate,
    claims: dict = Depends(require_roles(["tutor", "admin", "staff","student"]))
):
    """[TUTOR/ADMIN/STAFF] Tạo tài nguyên mới cho buổi học (slide, exercise, ...)."""
    # TODO: Add authorization logic to check if the user is the tutor of the session's class.
    return svc_create_resource(**body.model_dump())

@router.get("/resources", response_model=List[SessionResourceOut], tags=["4. Resources"])
def list_resources_api(
    session_id: str | None = Query(None, description="Lọc tài nguyên theo ID của buổi học"),
    claims: dict = Depends(get_current_user)
):
    """[ALL] Lấy danh sách tài nguyên. Có thể lọc theo buổi học."""
    # TODO: Add authorization logic to check if user is student/tutor of the session's class.
    return svc_list_resources(session_id=session_id)

@router.get("/resources/{resource_id}", response_model=SessionResourceOut, tags=["4. Resources"])
def get_resource_api(
    resource_id: str,
    claims: dict = Depends(get_current_user)
):
    """[ALL] Lấy chi tiết một tài nguyên."""
    # TODO: Add authorization logic here as well.
    return svc_get_resource(resource_id)

@router.patch("/resources/{resource_id}", response_model=SessionResourceOut, tags=["4. Resources"])
def update_resource_api(
    resource_id: str,
    body: SessionResourceUpdate,
    claims: dict = Depends(require_roles(["tutor", "admin", "staff","student"]))
):
    """[TUTOR/ADMIN/STAFF] Cập nhật tài nguyên."""
    # TODO: Add authorization logic.
    return svc_update_resource(resource_id, **body.model_dump(exclude_unset=True))

@router.delete("/resources/{resource_id}", status_code=200, tags=["4. Resources"])
def delete_resource_api(
    resource_id: str,
    claims: dict = Depends(require_roles(["tutor", "admin", "staff","student"]))
):
    """[TUTOR/ADMIN/STAFF] Xóa một tài nguyên."""
    # TODO: Add authorization logic.
    return svc_delete_resource(resource_id)

# =========================
# STUDENT SUBMISSIONS (Nộp và chấm bài)
# =========================

@router.post("/submissions", response_model=StudentSubmissionOut, status_code=201, tags=["5. Submissions"])
def create_submission_api(
    body: StudentSubmissionCreate,
    claims: dict = Depends(require_roles(["student"]))
):
    """[STUDENT] Nộp bài cho một exercise."""
    student_id = claims.get("sub")
    return svc_create_submission(student_id=student_id, **body.model_dump())

@router.get("/submissions", response_model=List[StudentSubmissionOut], tags=["5. Submissions"])
def list_submissions_api(
    resource_id: str | None = Query(None, description="Lọc bài nộp theo ID của bài tập (exercise)"),
    student_id: str | None = Query(None, description="Lọc bài nộp theo ID của học viên"),
    claims: dict = Depends(get_current_user)
):
    """[ALL] Lấy danh sách bài nộp.
    - Tutor/Admin: Có thể lọc theo resource_id để xem tất cả bài nộp cho 1 exercise.
    - Student: Chỉ có thể xem bài nộp của chính mình (tự động lọc theo student_id từ token).
    """
    user_role = claims.get("role")
    user_id = claims.get("sub")

    # If user is a student, force filter by their own ID
    if user_role == "student":
        if student_id and student_id != user_id:
             raise HTTPException(status_code=403, detail="Students can only view their own submissions.")
        student_id = user_id

    return svc_list_submissions(resource_id=resource_id, student_id=student_id)

@router.patch("/submissions/{submission_id}/grade", response_model=StudentSubmissionOut, tags=["5. Submissions"])
def grade_submission_api(
    submission_id: str,
    body: StudentSubmissionUpdate,
    claims: dict = Depends(require_roles(["tutor", "admin", "staff"]))
):
    """[TUTOR/ADMIN/STAFF] Chấm điểm và nhận xét cho một bài nộp."""
    # TODO: Add authorization to ensure the user is the tutor for this submission's class.
    return svc_grade_submission(submission_id, **body.model_dump(exclude_unset=True))

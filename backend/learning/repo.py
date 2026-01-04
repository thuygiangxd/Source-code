# repo.py
from typing import Optional, Dict, Any, List
from learning.db import get_supabase_client
from uuid import UUID
from datetime import date, datetime


def _jsonify(d: dict) -> dict:
    """Convert date/datetime/UUID to JSON-serializable format"""
    out = {}
    for k, v in d.items():
        if isinstance(v, (date, datetime)):
            out[k] = v.isoformat()
        elif isinstance(v, UUID):
            out[k] = str(v)
        else:
            out[k] = v
    return out


SCHEMA = "learning_svc"

TB_SESSION_ATTENDANCE = "session_attendance"
TB_SESSION_RESOURCES = "session_resources"
TB_STUDENT_SUBMISSIONS = "student_submissions"

ATTENDANCE_COLS = "id, session_id, student_id, status"
RESOURCE_COLS = "id, session_id, resource_type, title, url, description, uploaded_at"
SUBMISSION_COLS = "id, resource_id, student_id, submission_url, grade, feedback, submitted_at, graded_at"


def _first(data):
    return data[0] if isinstance(data, list) and data else None


def _tb(name):
    return get_supabase_client().schema(SCHEMA).from_(name)





# =========================
# SESSION ATTENDANCE - READ
# =========================

def get_session_attendance(
    session_id: Optional[str] = None,
    student_id: Optional[str] = None,
    status: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Lấy danh sách điểm danh"""
    q = _tb(TB_SESSION_ATTENDANCE).select(ATTENDANCE_COLS)
    
    if session_id:
        q = q.eq("session_id", session_id)
    if student_id:
        q = q.eq("student_id", student_id)
    if status:
        q = q.eq("status", status)
    
    res = q.order("marked_at", desc=True).execute()
    return res.data or []


def get_session_attendance_by_id(attendance_id: str) -> Optional[Dict[str, Any]]:
    """Lấy chi tiết điểm danh"""
    res = _tb(TB_SESSION_ATTENDANCE).select(ATTENDANCE_COLS).eq("id", attendance_id).limit(1).execute()
    return _first(res.data)


# =========================
# SESSION ATTENDANCE 
# =========================

def create_session_attendance(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Tạo bản điểm danh cho buổi học"""
    data = {
        "session_id": payload["session_id"],
        "student_id": payload["student_id"],
        "status": payload.get("status", "absent")
    }
    res = _tb(TB_SESSION_ATTENDANCE).insert(_jsonify(data), returning="representation").execute()
    return res.data[0]


def update_session_attendance(attendance_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Cập nhật điểm danh"""
    data = _jsonify(payload)
    res = _tb(TB_SESSION_ATTENDANCE).update(data).eq("id", attendance_id).execute()
    return _first(res.data)


def delete_session_attendance(attendance_id: str) -> None:
    """Xóa điểm danh"""
    _tb(TB_SESSION_ATTENDANCE).delete().eq("id", attendance_id).execute()


def get_or_create_attendance(session_id: str, student_id: str) -> Dict[str, Any]:
    """Lấy hoặc tạo mới bản điểm danh"""
    # Kiểm tra xem đã có chưa
    res = _tb(TB_SESSION_ATTENDANCE).select(ATTENDANCE_COLS)\
        .eq("session_id", session_id)\
        .eq("student_id", student_id)\
        .limit(1)\
        .execute()
    
    if res.data:
        return res.data[0]
    
    # Chưa có thì tạo mới với status = "absent" (mặc định vắng)
    return create_session_attendance({
        "session_id": session_id,
        "student_id": student_id,
        "status": "absent"
    })

# =========================
# SESSION RESOURCES
# =========================

def create_resource(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Tạo một tài nguyên mới cho buổi học."""
    res = _tb(TB_SESSION_RESOURCES).insert(_jsonify(payload), returning="representation").execute()
    return res.data[0]

def get_resource_by_id(resource_id: str) -> Optional[Dict[str, Any]]:
    """Lấy một tài nguyên theo ID."""
    res = _tb(TB_SESSION_RESOURCES).select(RESOURCE_COLS).eq("id", resource_id).limit(1).execute()
    return _first(res.data)

def list_resources(session_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Lấy danh sách tài nguyên, có thể lọc theo session_id."""
    q = _tb(TB_SESSION_RESOURCES).select(RESOURCE_COLS)
    if session_id:
        q = q.eq("session_id", session_id)
    res = q.order("uploaded_at", desc=True).execute()
    return res.data or []

def update_resource(resource_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Cập nhật một tài nguyên."""
    res = _tb(TB_SESSION_RESOURCES).update(_jsonify(payload)).eq("id", resource_id).execute()
    return _first(res.data)

def delete_resource(resource_id: str) -> None:
    """Xóa một tài nguyên."""
    _tb(TB_SESSION_RESOURCES).delete().eq("id", resource_id).execute()

# =========================
# STUDENT SUBMISSIONS
# =========================

def create_submission(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Học viên nộp bài."""
    res = _tb(TB_STUDENT_SUBMISSIONS).insert(_jsonify(payload), returning="representation").execute()
    return res.data[0]

def get_submission_by_id(submission_id: str) -> Optional[Dict[str, Any]]:
    """Lấy bài nộp theo ID."""
    res = _tb(TB_STUDENT_SUBMISSIONS).select(SUBMISSION_COLS).eq("id", submission_id).limit(1).execute()
    return _first(res.data)

def list_submissions(
    resource_id: Optional[str] = None,
    student_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Lấy danh sách bài nộp, có thể lọc theo bài tập hoặc học viên."""
    q = _tb(TB_STUDENT_SUBMISSIONS).select(SUBMISSION_COLS)
    if resource_id:
        q = q.eq("resource_id", resource_id)
    if student_id:
        q = q.eq("student_id", student_id)
    res = q.order("submitted_at", desc=True).execute()
    return res.data or []

def update_submission(submission_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Cập nhật bài nộp (dùng để chấm điểm)."""
    res = _tb(TB_STUDENT_SUBMISSIONS).update(_jsonify(payload)).eq("id", submission_id).execute()
    return _first(res.data)

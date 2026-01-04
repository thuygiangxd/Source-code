# schemas.py
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

# =========================
# SESSION RESOURCES (Tài nguyên buổi học: slide, exercise, ...)
# =========================

class SessionResourceCreate(BaseModel):
    session_id: str = Field(..., description="ID của buổi học")
    resource_type: Literal['slide', 'exercise', 'meeting', 'submission','review']
    title: str = Field(..., min_length=1, description="Tiêu đề tài nguyên")
    url: str = Field(..., min_length=1, description="Đường link tới tài nguyên")
    description: Optional[str] = None

class SessionResourceUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1)
    url: Optional[str] = Field(default=None, min_length=1)
    description: Optional[str] = None
    resource_type: Optional[Literal['slide', 'exercise', 'meeting', 'submission','review']] = None

class SessionResourceOut(BaseModel):
    id: str
    session_id: str
    resource_type: str
    title: str
    url: str
    description: Optional[str]
    uploaded_at: datetime

# =========================
# STUDENT SUBMISSIONS (Bài nộp của học viên)
# =========================

class StudentSubmissionCreate(BaseModel):
    resource_id: str = Field(..., description="ID của bài tập (resource_type='exercise')")
    submission_url: str = Field(..., description="Link file bài làm của học viên")

class StudentSubmissionUpdate(BaseModel):
    grade: float = Field(..., ge=0, description="Điểm số")
    feedback: Optional[str] = Field(None, description="Nhận xét của giáo viên")

class StudentSubmissionOut(BaseModel):
    id: str
    resource_id: str
    student_id: str
    submission_url: str
    grade: Optional[float]
    feedback: Optional[str]
    submitted_at: datetime
    graded_at: Optional[datetime]

# =========================
# SESSION ATTENDANCE (Điểm danh buổi học)
# =========================

class SessionAttendanceCreate(BaseModel):
    session_id: str = Field(..., description="ID của buổi học")
    status: Literal["present", "absent", "late", "excused"] = Field(default="present")

class SessionAttendanceUpdate(BaseModel):
    status: Optional[Literal["present", "absent", "late", "excused"]] = None

class SessionAttendanceOut(BaseModel):
    id: str
    session_id: str
    student_id: str
    status: str

# =========================
# SESSION RESOURCES (Tài nguyên buổi học: slide, exercise, ...)
# =========================

# class SessionResourceCreate(BaseModel):
#     session_id: str = Field(..., description="ID của buổi học")
#     resource_type: Literal['slide', 'exercise', 'meeting', 'submission','review']
#     title: str = Field(..., min_length=1, description="Tiêu đề tài nguyên")
#     url: str = Field(..., min_length=1, description="Đường link tới tài nguyên")
#     description: Optional[str] = None

# class SessionResourceUpdate(BaseModel):
#     title: Optional[str] = Field(default=None, min_length=1)
#     url: Optional[str] = Field(default=None, min_length=1)
#     description: Optional[str] = None
#     resource_type: Optional[Literal['slide', 'exercise', 'meeting', 'submission','review']] = None

# class SessionResourceOut(BaseModel):
#     id: str
#     session_id: str
#     resource_type: str
#     title: str
#     url: str
#     description: Optional[str]
#     uploaded_at: datetime

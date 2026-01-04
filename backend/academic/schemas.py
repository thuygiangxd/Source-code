from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict, Literal
from decimal import Decimal
from datetime import date, datetime

# ==============
# TUTOR PROFILES
# ==============
# class TutorProfileBase(BaseModel):
#     user_id: str
#     bio: Optional[str] = None
#     status: Literal["active","inactive"] = "inactive"

# class TutorProfileCreate(TutorProfileBase):
#     pass

# class TutorProfileUpdate(BaseModel):
    
#     status: Optional[Literal["active","inactive"]] = None


# class TutorProfileOut(TutorProfileBase):
#     id: str
#     created_at: datetime | None = None

# ==============
# TUTOR PROFILES
# ==============
class TutorProfileBase(BaseModel):
    user_id: str
    bio: Optional[str] = None
    status: Literal["active","inactive", "rejected", "ended"] = "inactive"

class TutorProfileCreate(TutorProfileBase):
    pass

class TutorProfileUpdate(BaseModel):
    
    status: Optional[Literal["active","inactive", "rejected", "ended"]] = None


class TutorProfileOut(TutorProfileBase):
    id: str
    created_at: datetime | None = None
    fee_amount: float | None = None




# ==============
# STUDENT REGISTRATIONS
# ==============
class StudentRegistrationBase(BaseModel):
    student_id: str
    education_level: str
    grade: int
    subject: str
    default_fee: Decimal
    note: Optional[str] = None
    type: Literal['online', 'offline'] = 'online'
    address: Optional[str] = None
    status: Literal["pending", "matched", "cancelled", "processing"] = "processing"
    schedule_json: Dict[str, Any]
    start_date: date
    end_date: date

class StudentRegistrationCreate(BaseModel):
    education_level: str
    grade: int
    subject: str
    default_fee: Decimal
    note: Optional[str] = None
    type: Literal['online', 'offline'] = 'online'
    address: Optional[str] = None
    schedule_json: Dict[str, Any]
    start_date: date
    end_date: date
    # student_id will be taken from the token

class StudentRegistrationUpdate(BaseModel):
    education_level: Optional[str] = None
    grade: Optional[int] = None
    subject: Optional[str] = None
    default_fee: Optional[Decimal] = None
    note: Optional[str] = None
    type: Optional[Literal['online', 'offline']] = None
    address: Optional[str] = None
    status: Optional[Literal["pending", "matched", "cancelled", "processing"]] = None
    schedule_json: Optional[Dict[str, Any]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class StudentRegistrationOut(StudentRegistrationBase):
    id: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
    fee_amount: float | None = None


# ==============
# STUDENT-TUTOR ASSIGNMENTS
# ==============
class StudentTutorAssignmentBase(BaseModel):
    registration_id: str
    student_id: str
    tutor_user_id: str
    status: Literal["active", "released"] = "active"

class StudentTutorAssignmentCreate(BaseModel):
    registration_id: str
    tutor_user_id: str
    # student_id will be taken from the registration

class StudentTutorAssignmentUpdate(BaseModel):
    status: Optional[Literal["active", "released"]] = None

class StudentTutorAssignmentOut(StudentTutorAssignmentBase):
    id: str
    assigned_at: datetime | None = None


# ==============
# CLASSES
# ==============
class ClassBase(BaseModel):
    student_tutor_assignments_id: str
    class_name: str = Field(min_length=1)
    status: Literal["open", "closed"] = "open"
    start_date: date
    end_date: date
    tutor_salary: Decimal

class ClassCreate(BaseModel):
    student_tutor_assignments_id: str
    class_name: str = Field(min_length=1)

class ClassUpdate(BaseModel):
    class_name: Optional[str] = None
    status: Optional[Literal["open", "closed"]] = None

class ClassOut(ClassBase):
    id: str
    created_at: datetime | None = None


# ==============
# CLASS SESSIONS
# ==============
class SessionBase(BaseModel):
    class_id: str
    session_index: int = Field(ge=1)
    start_time: datetime
    end_time: datetime
    study_hours: Optional[Decimal] = None
    status: Literal["scheduled", "processing", "completed", "cancelled"] = "scheduled"

class SessionCreate(SessionBase):
    pass

class SessionUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    study_hours: Optional[Decimal] = None
    status: Optional[Literal["scheduled", "processing", "completed", "cancelled"]] = None

class SessionOut(SessionBase):
    id: str
    created_at: datetime | None = None

# ==============
# PAYROLL
# ==============
class PayrollStatusUpdate(BaseModel):
    tutor_id: str
    month: str # YYYY-MM

class PaymentHistoryOut(BaseModel):
    id: str
    tutor_id: str
    payment_month: str
    paid_at: datetime
    tutor_name: Optional[str] = None
from typing import Optional, Dict, Any, List
from academic.db import get_supabase_client
from uuid import UUID
from datetime import date, datetime, timezone
from decimal import Decimal
from dateutil.relativedelta import relativedelta

def _jsonify(d: dict) -> dict:
    out = {}
    for k, v in d.items():
        if isinstance(v, (date, datetime)):
            out[k] = v.isoformat()
        elif isinstance(v, UUID):
            out[k] = str(v)
        elif isinstance(v, Decimal):
            out[k] = str(v)
        else:
            out[k] = v
    return out

SCHEMA = "academic_svc"
TB_TUTOR_PROFILES = "tutor_profiles"
TB_STUDENT_REGISTRATIONS = "student_registrations"
TB_STUDENT_TUTOR_ASSIGNMENTS = "student_tutor_assignments"
TB_CLASSES  = "classes"
TB_CLASS_SESSIONS = "class_sessions"
TB_MONTHLY_PAYMENTS = "monthly_payments"

TUTOR_PROFILE_COLS = "id, user_id, bio, status, created_at"
STUDENT_REG_COLS = (
    "id, student_id, education_level, grade, subject, default_fee, note, type, address, "
    "status, schedule_json, start_date, end_date, created_at, updated_at"
)
STUDENT_TUTOR_ASSIGN_COLS = "id, registration_id, student_id, tutor_user_id, status, assigned_at"
CLASS_COLS = "id, student_tutor_assignments_id, class_name, status, start_date, end_date, created_at, tutor_salary"
SESSION_COLS = (
    "id, class_id, session_index, start_time, end_time, study_hours, status, created_at"
)

def _first(data): return data[0] if isinstance(data, list) and data else None
def _tb(name):    return get_supabase_client().schema(SCHEMA).from_(name)

# =========================
# TUTOR PROFILES
# =========================
def list_tutor_profiles(
    user_id: Optional[str] = None,
    status: Optional[str] = None
)-> List[Dict[str, Any]]:
    q = _tb(TB_TUTOR_PROFILES).select(TUTOR_PROFILE_COLS)
    if user_id: q = q.eq("user_id", user_id)
    if status:  q = q.eq("status", status)
    q = q.order("created_at", desc=True)
    res = q.execute()
    return res.data or []

def get_tutor_profile(profile_id: str) -> Optional[Dict[str, Any]]:
    res = (
        _tb(TB_TUTOR_PROFILES)
        .select("*")
        .eq("id", profile_id)
        .limit(1)
        .execute()
    )
    return _first(res.data)

def create_tutor_profile_row(payload: Dict[str, Any]) -> Dict[str, Any]:
    res = _tb(TB_TUTOR_PROFILES).insert(_jsonify(payload), returning="representation").execute()
    return res.data[0]

def update_tutor_profile_row(profile_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    res = _tb(TB_TUTOR_PROFILES).update(_jsonify(payload)).eq("id", profile_id).execute()
    return _first(res.data)

def delete_tutor_profile_row(profile_id: str) -> None:
    _tb(TB_TUTOR_PROFILES).delete().eq("id", profile_id).execute()


# =========================
# STUDENT REGISTRATIONS
# =========================
def list_student_registrations(
    student_id: Optional[str] = None,
    status: Optional[str] = None
) -> List[Dict[str, Any]]:
    q = _tb(TB_STUDENT_REGISTRATIONS).select(STUDENT_REG_COLS)
    if student_id: q = q.eq("student_id", student_id)
    if status: q = q.eq("status", status)
    q = q.order("created_at", desc=True)
    res = q.execute()
    return res.data or []

def get_student_registration(reg_id: str) -> Optional[Dict[str, Any]]:
    res = (
        _tb(TB_STUDENT_REGISTRATIONS)
        .select(STUDENT_REG_COLS)
        .eq("id", reg_id)
        .limit(1)
        .execute()
    )
    return _first(res.data)

def create_student_registration_row(payload: Dict[str, Any]) -> Dict[str, Any]:
    res = _tb(TB_STUDENT_REGISTRATIONS).insert(_jsonify(payload), returning="representation").execute()
    return res.data[0]

def update_student_registration_row(reg_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    payload["updated_at"] = datetime.now(timezone.utc)
    res = _tb(TB_STUDENT_REGISTRATIONS).update(_jsonify(payload)).eq("id", reg_id).execute()
    return _first(res.data)

def delete_student_registration_row(reg_id: str) -> None:
    _tb(TB_STUDENT_REGISTRATIONS).delete().eq("id", reg_id).execute()


# =========================
# STUDENT-TUTOR ASSIGNMENTS
# =========================
def list_student_tutor_assignments(
    student_id: Optional[str] = None,
    tutor_user_id: Optional[str] = None,
    registration_id: Optional[str] = None,
    status: Optional[str] = None,
    assignment_ids: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    q = _tb(TB_STUDENT_TUTOR_ASSIGNMENTS).select(STUDENT_TUTOR_ASSIGN_COLS)
    if student_id: q = q.eq("student_id", student_id)
    if tutor_user_id: q = q.eq("tutor_user_id", tutor_user_id)
    if registration_id: q = q.eq("registration_id", registration_id)
    if status: q = q.eq("status", status)
    if assignment_ids: q = q.in_("id", assignment_ids)
    q = q.order("assigned_at", desc=True)
    res = q.execute()
    return res.data or []

def get_student_tutor_assignment(assign_id: str) -> Optional[Dict[str, Any]]:
    res = (
        _tb(TB_STUDENT_TUTOR_ASSIGNMENTS)
        .select(STUDENT_TUTOR_ASSIGN_COLS)
        .eq("id", assign_id)
        .limit(1)
        .execute()
    )
    return _first(res.data)

def create_student_tutor_assignment_row(payload: Dict[str, Any]) -> Dict[str, Any]:
    res = _tb(TB_STUDENT_TUTOR_ASSIGNMENTS).insert(_jsonify(payload), returning="representation").execute()
    return res.data[0]

def update_student_tutor_assignment_row(assign_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    res = _tb(TB_STUDENT_TUTOR_ASSIGNMENTS).update(_jsonify(payload)).eq("id", assign_id).execute()
    return _first(res.data)

def delete_student_tutor_assignment_row(assign_id: str) -> None:
    _tb(TB_STUDENT_TUTOR_ASSIGNMENTS).delete().eq("id", assign_id).execute()


# =========================
# CLASSES
# =========================
def list_classes(
    student_tutor_assignments_id: Optional[str] = None,
    status: Optional[str] = None,
    student_tutor_assignments_ids: Optional[List[str]] = None,
    start_month: Optional[str] = None
) -> List[Dict[str, Any]]:
    q = _tb(TB_CLASSES).select(CLASS_COLS)
    if student_tutor_assignments_id: q = q.eq("student_tutor_assignments_id", student_tutor_assignments_id)
    if status: q = q.eq("status", status)
    if student_tutor_assignments_ids: q = q.in_("student_tutor_assignments_id", student_tutor_assignments_ids)
    if start_month:
        try:
            start_date_filter = datetime.strptime(start_month, "%Y-%m").date()
            end_date_filter = start_date_filter + relativedelta(months=1)
            q = q.gte("start_date", start_date_filter.isoformat())
            q = q.lt("start_date", end_date_filter.isoformat())
        except ValueError:
            # Ignore invalid month format
            pass
    q = q.order("created_at", desc=True)
    res = q.execute()
    return res.data or []

def get_class(class_id: str) -> Optional[Dict[str, Any]]:
    res = (
        _tb(TB_CLASSES)
        .select("*")
        .eq("id", class_id)
        .limit(1)
        .execute()
    )
    return _first(res.data)

def create_class_row(payload: Dict[str, Any]) -> Dict[str, Any]:
    res = _tb(TB_CLASSES).insert(_jsonify(payload), returning="representation").execute()
    return res.data[0]

def update_class_row(class_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    res = _tb(TB_CLASSES).update(_jsonify(payload)).eq("id", class_id).execute()
    return _first(res.data)

def delete_class_row(class_id: str) -> None:
    _tb(TB_CLASS_SESSIONS).delete().eq("class_id", class_id).execute()
    _tb(TB_CLASSES).delete().eq("id", class_id).execute()


# =========================
# CLASS SESSIONS
# =========================
def _calc_study_hours_if_needed(payload: Dict[str, Any]) -> Dict[str, Any]:
    if payload.get("study_hours") is None and payload.get("start_time") and payload.get("end_time"):
        st = payload["start_time"]
        et = payload["end_time"]
        if isinstance(st, str): st = datetime.fromisoformat(st)
        if isinstance(et, str): et = datetime.fromisoformat(et)
        if st.tzinfo is None: st = st.replace(tzinfo=timezone.utc)
        if et.tzinfo is None: et = et.replace(tzinfo=timezone.utc)
        seconds = (et - st).total_seconds()
        if seconds <= 0:
            raise ValueError("end_time must be greater than start_time")
        payload["study_hours"] = Decimal(seconds / 3600.0)
    return payload

def list_class_sessions(
    class_id: Optional[str] = None,
    status: Optional[str] = None,
    class_ids: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    q = _tb(TB_CLASS_SESSIONS).select(SESSION_COLS)
    if class_id: q = q.eq("class_id", class_id)
    if status:   q = q.eq("status", status)
    if class_ids: q = q.in_("class_id", class_ids)
    q = q.order("class_id", desc=False).order("session_index", desc=False)
    res = q.execute()
    return res.data or []

def get_session_details(session_id: str) -> Optional[Dict[str, Any]]:
    res = _tb(TB_CLASS_SESSIONS).select(SESSION_COLS).eq("id", session_id).limit(1).execute()
    return _first(res.data)

def create_session_row(payload: Dict[str, Any]) -> Dict[str, Any]:
    payload = _calc_study_hours_if_needed(payload)
    res = (
        _tb(TB_CLASS_SESSIONS)
        .insert(_jsonify(payload), returning="representation")
        .execute()
    )
    return res.data[0]

def update_session_row(session_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    touching_times = any(k in payload for k in ("start_time", "end_time"))
    if touching_times and "study_hours" not in payload:
        old = get_session_details(session_id)
        if not old:
            return None
        merged = {**old, **payload}
        payload = _calc_study_hours_if_needed(merged)
    res = _tb(TB_CLASS_SESSIONS).update(_jsonify(payload)).eq("id", session_id).execute()
    return _first(res.data)

def delete_session_row(session_id: str) -> None:
    _tb(TB_CLASS_SESSIONS).delete().eq("id", session_id).execute()


# =========================
# PAYROLL
# =========================
def mark_as_paid(tutor_id: str, month: str) -> Dict[str, Any]:
    payload = {"tutor_id": tutor_id, "payment_month": month}
    res = _tb(TB_MONTHLY_PAYMENTS).insert(_jsonify(payload), returning="representation").execute()
    return res.data[0]

def get_paid_tutor_ids_for_month(month: str) -> List[str]:
    res = _tb(TB_MONTHLY_PAYMENTS).select("tutor_id").eq("payment_month", month).execute()
    return [item["tutor_id"] for item in res.data] if res.data else []

# def list_payment_history() -> List[Dict[str, Any]]:
#     res = _tb(TB_MONTHLY_PAYMENTS).select("*").order("paid_at", desc=True).execute()
#     return res.data or []
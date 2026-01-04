from typing import Dict, Any, Optional, List
from fastapi import HTTPException
import httpx
import os
from datetime import date, datetime, timedelta, time as dt_time
from decimal import Decimal

from academic.repo import (
    list_tutor_profiles, get_tutor_profile, create_tutor_profile_row, update_tutor_profile_row, delete_tutor_profile_row,
    list_student_registrations, get_student_registration, create_student_registration_row, update_student_registration_row, delete_student_registration_row,
    list_student_tutor_assignments, get_student_tutor_assignment, create_student_tutor_assignment_row, update_student_tutor_assignment_row, delete_student_tutor_assignment_row,
    list_classes, get_class, create_class_row, update_class_row, delete_class_row,
    list_class_sessions, get_session_details, create_session_row, update_session_row, delete_session_row,
    mark_as_paid, get_paid_tutor_ids_for_month
    # , list_payment_history
)

AUTH_SERVICE_URL = os.getenv("AUTH_SVC_URL", "http://localhost:8001")

# =========================
# TUTOR PROFILES
# =========================
def svc_list_tutor_profiles(user_id: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
    return list_tutor_profiles(user_id=user_id, status=status)

def svc_get_tutor_profile(profile_id: str):
    data = get_tutor_profile(profile_id)
    if not data:
        raise HTTPException(status_code=404, detail="Tutor Profile not found")
    return data

def svc_create_tutor_profile(**kwargs):
    return create_tutor_profile_row(kwargs)

def svc_update_tutor_profile(profile_id: str, **kwargs):
    existing = get_tutor_profile(profile_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Tutor Profile not found")

    new_status = kwargs.get("status")
    if new_status and new_status != existing.get("status"):
        user_id = existing.get("user_id")
        if user_id:
            new_role = None
            if new_status == "active":
                new_role = "tutor"
            elif new_status == "inactive":
                new_role = "student"
            
            if new_role:
                try:
                    with httpx.Client(timeout=10.0) as client:
                        response = client.patch(
                            f"{AUTH_SERVICE_URL}/auth/update-role",
                            json={"user_id": user_id, "new_role_code": new_role}
                        )
                        response.raise_for_status()
                        print(f"[Academic] Updated role to '{new_role}' for user_id={user_id}")
                except httpx.HTTPError as e:
                    print(f"[Academic] Warning: Failed to update role for user_id={user_id}: {e}")

    updated = update_tutor_profile_row(profile_id, kwargs)
    return updated or existing

def svc_delete_tutor_profile(profile_id: str):
    existing = get_tutor_profile(profile_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Tutor Profile not found")
    delete_tutor_profile_row(profile_id)
    return {"deleted_tutor_profile_id": profile_id}

# =========================
# STUDENT REGISTRATIONS
# =========================
def svc_list_student_registrations(student_id: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
    return list_student_registrations(student_id=student_id, status=status)

# def svc_get_student_registration(reg_id: str):
#     data = get_student_registration(reg_id)
#     if not data:
#         raise HTTPException(status_code=404, detail="Student Registration not found")
#     return data


def svc_get_student_registration(reg_id: str):
    """Lấy registration kèm học phí (default_fee) từ course"""
    data = get_student_registration(reg_id)
    if not data:
        raise HTTPException(status_code=404, detail="Student Registration not found")
    # Thêm field fee_amount để Payment Service sử dụng
    data["fee_amount"] = data.get("default_fee")
    return data

def svc_create_student_registration(student_id: str, **kwargs):
    kwargs["student_id"] = student_id
    return create_student_registration_row(kwargs)

def svc_update_student_registration(reg_id: str, **kwargs):
    existing = get_student_registration(reg_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Student Registration not found")
    updated = update_student_registration_row(reg_id, kwargs)
    return updated or existing

def svc_cancel_student_registration(reg_id: str, student_id: str):
    existing = get_student_registration(reg_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Student Registration not found")
    if existing["student_id"] != student_id:
        raise HTTPException(status_code=403, detail="You can only cancel your own registration")
    if existing["status"] == "matched":
        raise HTTPException(status_code=400, detail="Cannot cancel matched registration")
    return update_student_registration_row(reg_id, {"status": "cancelled"})

# =========================
# STUDENT-TUTOR ASSIGNMENTS
# =========================
def svc_list_student_tutor_assignments(
    student_id: Optional[str] = None,
    tutor_user_id: Optional[str] = None,
    registration_id: Optional[str] = None,
    status: Optional[str] = None
) -> List[Dict[str, Any]]:
    return list_student_tutor_assignments(
        student_id=student_id,
        tutor_user_id=tutor_user_id,
        registration_id=registration_id,
        status=status
    )

def svc_get_student_tutor_assignment(assign_id: str):
    data = get_student_tutor_assignment(assign_id)
    if not data:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return data

def _create_assignment_and_class(registration_id: str, tutor_user_id: str):
    reg = get_student_registration(registration_id)
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    if reg["status"] not in ["pending", "processing"]:
        raise HTTPException(status_code=400, detail=f"Registration is not in a pending state (current: {reg['status']})")

    existing_assigns = list_student_tutor_assignments(registration_id=registration_id, status="active")
    if existing_assigns:
        raise HTTPException(status_code=400, detail="Registration already has an active assignment")

    assignment = create_student_tutor_assignment_row({
        "registration_id": registration_id,
        "student_id": reg["student_id"],
        "tutor_user_id": tutor_user_id,
        "status": "active"
    })

    class_name = f"{reg['subject']} - Lớp {reg['grade']}"
    tutor_salary = Decimal(reg.get('default_fee', 0)) * Decimal('0.65')

    new_class = create_class_row({
        "student_tutor_assignments_id": assignment["id"],
        "class_name": class_name,
        "start_date": reg["start_date"],
        "end_date": reg["end_date"],
        "tutor_salary": tutor_salary
    })

    _generate_class_sessions(
        class_id=new_class["id"],
        start_date=new_class.get("start_date"),
        end_date=new_class.get("end_date"),
        schedule_json=reg["schedule_json"]
    )

    update_student_registration_row(registration_id, {"status": "matched"})
    return assignment

def svc_tutor_claim_registration(registration_id: str, tutor_user_id: str):
    return _create_assignment_and_class(registration_id, tutor_user_id)

def svc_staff_assign_tutor(registration_id: str, tutor_user_id: str):
    return _create_assignment_and_class(registration_id, tutor_user_id)

def svc_release_assignment(assign_id: str):
    existing = get_student_tutor_assignment(assign_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if existing["status"] == "released":
        raise HTTPException(status_code=400, detail="Assignment already released")

    classes = list_classes(student_tutor_assignments_id=assign_id, status="open")
    for cls in classes:
        delete_class_row(cls["id"])

    updated = update_student_tutor_assignment_row(assign_id, {"status": "released"})
    update_student_registration_row(existing["registration_id"], {"status": "pending"})
    return updated

# =========================
# CLASSES
# =========================
def svc_list_classes(
    student_tutor_assignments_id: Optional[str] = None, 
    status: Optional[str] = None, 
    start_month: Optional[str] = None,
    claims: dict = {}
):
    user_id = claims.get("sub")
    role = claims.get("role")

    # Admin/Staff can see all classes
    if role in ["admin", "staff", "accountant"]:
        return list_classes(
            student_tutor_assignments_id=student_tutor_assignments_id, 
            status=status,
            start_month=start_month
        )

    # Students/Tutors can only see their own classes
    if not user_id:
        return []

    # Find all assignments for the user
    if role == "student":
        assignments = list_student_tutor_assignments(student_id=user_id)
    elif role == "tutor":
        assignments = list_student_tutor_assignments(tutor_user_id=user_id)
    else:
        return []

    if not assignments:
        return []

    assignment_ids = [a["id"] for a in assignments]
    
    # If the user is also filtering by a specific assignment_id,
    # we need to make sure that assignment_id is one of their assignments.
    target_assignment_ids = assignment_ids
    if student_tutor_assignments_id:
        if student_tutor_assignments_id in assignment_ids:
            target_assignment_ids = [student_tutor_assignments_id]
        else:
            return [] # The requested assignment_id does not belong to the user

    return list_classes(
        student_tutor_assignments_ids=target_assignment_ids, 
        status=status,
        start_month=start_month
    )

def svc_get_class(class_id: str):
    data = get_class(class_id)
    if not data:
        raise HTTPException(status_code=404, detail="Class not found")
    return data

def svc_update_class(class_id: str, **kwargs):
    updated = update_class_row(class_id, kwargs)
    if not updated:
        raise HTTPException(status_code=404, detail="Class not found")
    return updated

# =========================
# CLASS SESSIONS
# =========================
def svc_list_class_sessions(class_id: Optional[str] = None, status: Optional[str] = None, claims: dict = {}):
    user_id = claims.get("sub")
    role = claims.get("role")

    # Admin/Staff can see all sessions
    if role in ["admin", "staff"]:
        return list_class_sessions(class_id=class_id, status=status)

    # Students/Tutors can only see their own sessions
    if not user_id:
        return []

    # Find all assignments for the user
    if role == "student":
        assignments = list_student_tutor_assignments(student_id=user_id)
    elif role == "tutor":
        assignments = list_student_tutor_assignments(tutor_user_id=user_id)
    else:
        return [] # Should not happen for other roles

    if not assignments:
        return []

    assignment_ids = [a["id"] for a in assignments]

    # Find all classes for those assignments
    user_classes = list_classes(student_tutor_assignments_ids=assignment_ids)
    if not user_classes:
        return []
    
    user_class_ids = [c["id"] for c in user_classes]

    # If the user is also filtering by a specific class_id,
    # we need to make sure that class_id is one of their classes.
    target_class_ids = user_class_ids
    if class_id:
        if class_id in user_class_ids:
            target_class_ids = [class_id]
        else:
            return [] # The requested class_id does not belong to the user

    # Find all sessions for those classes
    return list_class_sessions(class_ids=target_class_ids, status=status)

def svc_get_session_details(session_id: str):
    data = get_session_details(session_id)
    if not data:
        raise HTTPException(status_code=404, detail="Session not found")
    return data

def svc_create_session(**kwargs):
    return create_session_row(kwargs)

def svc_update_session(session_id: str, **kwargs):
    updated = update_session_row(session_id, kwargs)
    if not updated:
        raise HTTPException(status_code=404, detail="Session not found")
    return updated

def svc_delete_class_session(session_id: str):
    if not get_session_details(session_id):
        raise HTTPException(status_code=404, detail="Session not found")
    delete_session_row(session_id)
    return {"deleted_session_id": session_id}

def _generate_class_sessions(class_id: str, start_date, end_date, schedule_json: dict):
    if not all([start_date, end_date, schedule_json]):
        return

    if isinstance(start_date, str): start_date = datetime.fromisoformat(start_date).date()
    if isinstance(end_date, str): end_date = datetime.fromisoformat(end_date).date()

    days = schedule_json.get("days", [])
    start_time_str = schedule_json.get("start_time", "08:00")
    end_time_str = schedule_json.get("end_time", "10:00")

    day_map = {"Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3, "Fri": 4, "Sat": 5, "Sun": 6}
    day_numbers = [day_map.get(d) for d in days if d in day_map]
    if not day_numbers: return

    start_time = dt_time.fromisoformat(start_time_str)
    end_time = dt_time.fromisoformat(end_time_str)

    study_hours = (datetime.combine(date.min, end_time) - datetime.combine(date.min, start_time)).total_seconds() / 3600.0

    session_index = 1
    current_date = start_date
    while current_date <= end_date:
        if current_date.weekday() in day_numbers:
            create_session_row({
                "class_id": class_id,
                "session_index": session_index,
                "start_time": datetime.combine(current_date, start_time),
                "end_time": datetime.combine(current_date, end_time),
                "study_hours": study_hours,
                "status": "scheduled"
            })
            session_index += 1
        current_date += timedelta(days=1)




def svc_complete_session(session_id: str):
    """Tutor đánh dấu hoàn thành buổi học (Vào lớp)"""
    existing = get_session_details(session_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Chỉ đơn giản cập nhật status = completed
    update_payload = {"status": "completed"}
    
    updated = update_session_row(session_id, update_payload)
    return updated

def svc_processing_session(session_id: str):
    """Tutor đánh dấu hoàn thành buổi học (Vào lớp)"""
    existing = get_session_details(session_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # 
    update_payload = {"status": "processing"}
    
    updated = update_session_row(session_id, update_payload)
    return updated


# =========================
# PAYROLL
# =========================
def svc_mark_as_paid(tutor_id: str, month: str):
    # Simple validation
    try:
        datetime.strptime(month, "%Y-%m")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM.")
    
    return mark_as_paid(tutor_id, month)

# def svc_get_paid_tutors_for_month(month: str) -> List[Dict[str, Any]]:
#     return get_paid_tutor_ids_for_month(month)

def svc_get_paid_tutor_ids_for_month(month: str) -> List[str]:
    return get_paid_tutor_ids_for_month(month)

# async def svc_list_payment_history() -> List[Dict[str, Any]]:
#     history = list_payment_history()
#     if not history:
#         return []

#     tutor_ids = list(set([item["tutor_id"] for item in history]))
#     users_map = await _get_users_by_ids(tutor_ids)

#     for item in history:
#         tutor = users_map.get(item.get("tutor_id"))
#         item["tutor_name"] = tutor.get("name") if tutor else "N/A"
    
#     return history
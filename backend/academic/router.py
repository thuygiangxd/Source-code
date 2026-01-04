from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from fastapi import UploadFile, File, Form
import uuid, os, shutil


from .schemas import (
    TutorProfileOut, TutorProfileCreate, TutorProfileUpdate,
    StudentRegistrationOut, StudentRegistrationCreate, StudentRegistrationUpdate,
    StudentTutorAssignmentOut, StudentTutorAssignmentUpdate,
    ClassOut, ClassCreate, ClassUpdate,
    SessionOut, SessionCreate, SessionUpdate,
    PayrollStatusUpdate, PaymentHistoryOut
)
from .service import (
    svc_list_tutor_profiles, svc_get_tutor_profile, svc_create_tutor_profile, svc_update_tutor_profile, svc_delete_tutor_profile,
    svc_list_student_registrations, svc_get_student_registration, svc_create_student_registration, svc_update_student_registration, svc_cancel_student_registration,
    svc_list_student_tutor_assignments, svc_get_student_tutor_assignment, svc_tutor_claim_registration, svc_staff_assign_tutor, svc_release_assignment,
    svc_list_classes, svc_get_class, svc_update_class,
    svc_list_class_sessions, svc_get_session_details, svc_create_session, svc_update_session, svc_delete_class_session,
    svc_processing_session, svc_complete_session,
    svc_get_paid_tutor_ids_for_month, svc_mark_as_paid
    # svc_list_payment_history
)
from .utils import get_current_user, require_roles

router = APIRouter(prefix="/academic")
# UPLOAD_CV_DIR = "upload_cv"
UPLOAD_CV_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "upload_cv"))
os.makedirs(UPLOAD_CV_DIR, exist_ok=True)

# =========================
# TUTOR PROFILES
# =========================
#Xem danh sách hồ sơ tutor, lọc theo user_id, trạng thái
@router.get("/tutor-profiles", response_model=List[TutorProfileOut], tags=["Tutor Profiles"])
def list_tutor_profiles_api(
    user_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    claims: dict = Depends(get_current_user)
):
    return svc_list_tutor_profiles(user_id=user_id, status=status)

@router.get("/tutor-profiles/{profile_id}", response_model=TutorProfileOut, tags=["Tutor Profiles"])
def get_tutor_profile_api(profile_id: str, claims: dict = Depends(get_current_user)):
    return svc_get_tutor_profile(profile_id)


# student muốn làm tutor thì nộp CV
# @router.post("/tutor-profiles", response_model=TutorProfileOut, status_code=201, tags=["Tutor Profiles"])
# def create_tutor_profile_api(body: TutorProfileCreate, claims: dict = Depends(require_roles(["student"]))):
#     data = body.model_dump()
#     data['user_id'] = claims['sub']
#     return svc_create_tutor_profile(**data)
@router.post("/tutor-profiles", response_model=TutorProfileOut, status_code=201, tags=["Tutor Profiles"])
def create_tutor_profile_api(
    cv: UploadFile = File(...),
    status: str = Form("inactive"),
    claims: dict = Depends(require_roles(["student"]))
):
    user_id = claims["sub"]

    # Lấy username (ưu tiên username trong claims, fallback email)
    username = claims.get("username") or claims.get("preferred_username") or claims.get("email").split("@")[0]

    # Lấy đuôi file
    ext = cv.filename.split(".")[-1]

    # Tạo tên file theo cú pháp yêu cầu
    filename = f"{username}_CV.{ext}"

    filepath = os.path.join(UPLOAD_CV_DIR, filename)

    # Lưu file thật vào thư mục
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(cv.file, buffer)

    # Lưu DB: bio = đường dẫn file
    data = {
        "user_id": user_id,
        "bio": filename,
        "status": status
    }

    profile = svc_create_tutor_profile(**data)
    return profile


#duyệt hồ sơ (cho admin)
@router.patch("/tutor-profiles/{profile_id}", response_model=TutorProfileOut, tags=["Tutor Profiles"])
def update_tutor_profile_api(profile_id: str, body: TutorProfileUpdate, claims: dict = Depends(require_roles(["admin", "staff"]))):
    return svc_update_tutor_profile(profile_id, **body.model_dump(exclude_unset=True))
# xóa (admin)
@router.delete("/tutor-profiles/{profile_id}", status_code=204, tags=["Tutor Profiles"])
def delete_tutor_profile_api(profile_id: str, claims: dict = Depends(require_roles(["admin", "staff"]))):
    svc_delete_tutor_profile(profile_id)
    return {}


# @router.post("/tutor-profiles", response_model=TutorProfileOut, status_code=201, tags=["Tutor Profiles"])
# def create_tutor_profile_api(body: TutorProfileCreate, claims: dict = Depends(require_roles(["admin", "staff"]))):
#     return svc_create_tutor_profile(**body.model_dump())


# =========================
# STUDENT REGISTRATIONS
# =========================
@router.get("/my-registrations", response_model=list[StudentRegistrationOut], tags=["8. My Registrations (Student)"])
def list_my_registrations_api(claims: dict = Depends(require_roles(["student"]))):
    """[STUDENT] Xem danh sách đăng ký lớp học của tôi"""
    return svc_list_student_registrations(student_id=claims["sub"])

# @router.post("/my-registrations", response_model=StudentRegistrationOut, status_code=201, tags=["8. My Registrations (Student)"])
# def create_my_registration_api(body: StudentRegistrationCreate, claims: dict = Depends(require_roles(["student"]))):
#     """[STUDENT] Đăng ký lớp học. student_id tự động lấy từ token"""
#     return svc_create_student_registration(student_id=claims["sub"], **body.model_dump())

# @router.patch("/my-registrations/{reg_id}/cancel", response_model=StudentRegistrationOut, tags=["8. My Registrations (Student)"])
# def cancel_my_registration_api(reg_id: str, claims: dict = Depends(require_roles(["student"]))):
#     """[STUDENT] Hủy đăng ký của tôi (chỉ được hủy nếu chưa matched)"""
#     return svc_cancel_student_registration(reg_id, student_id=claims["sub"])


#lọc theo student, trạng thái, cấp độ..
@router.get("/registrations", response_model=List[StudentRegistrationOut], tags=["Student Registrations"])
def list_registrations_api(
    student_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    claims: dict = Depends(get_current_user)
):
    return svc_list_student_registrations(student_id=student_id, status=status)

@router.get("/registrations/{reg_id}", response_model=StudentRegistrationOut, tags=["Student Registrations"])
def get_registration_api(reg_id: str, claims: dict = Depends(get_current_user)):
    return svc_get_student_registration(reg_id)

@router.post("/registrations", response_model=StudentRegistrationOut, status_code=201, tags=["Student Registrations"])
def create_registration_api(body: StudentRegistrationCreate, claims: dict = Depends(require_roles(["student"]))):
    return svc_create_student_registration(student_id=claims["sub"], **body.model_dump())

#bỏ student
@router.patch("/registrations/{reg_id}", response_model=StudentRegistrationOut, tags=["Student Registrations"])
def update_registration_api(reg_id: str, body: StudentRegistrationUpdate, claims: dict = Depends(require_roles(["admin", "staff","student"]))):
    return svc_update_student_registration(reg_id, **body.model_dump(exclude_unset=True))

@router.patch("/registrations/{reg_id}/cancel", response_model=StudentRegistrationOut, tags=["Student Registrations"])
def cancel_registration_api(reg_id: str, claims: dict = Depends(require_roles(["student"]))):
    return svc_cancel_student_registration(reg_id, student_id=claims["sub"])

# =========================
# STUDENT-TUTOR ASSIGNMENTS
# =========================
@router.get("/assignments", response_model=List[StudentTutorAssignmentOut], tags=["Assignments"])
def list_assignments_api(
    student_id: Optional[str] = Query(None),
    tutor_user_id: Optional[str] = Query(None),
    registration_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    claims: dict = Depends(get_current_user)
):
    return svc_list_student_tutor_assignments(
        student_id=student_id,
        tutor_user_id=tutor_user_id,
        registration_id=registration_id,
        status=status
    )
@router.get("/my-assignments", response_model=list[StudentTutorAssignmentOut], tags=["10. Tutor Claims"])
def list_my_assignments_api(    student_id: str | None = Query(None),
    tutor_user_id: str | None = Query(None),
    registration_id: str | None = Query(None),
    status: str | None = Query(None, description="active|released"),
    claims: dict = Depends(require_roles(["tutor"]))):
    """[TUTOR] Xem danh sách học sinh đã claim"""
    return svc_list_student_tutor_assignments(        
        student_id=student_id,
        tutor_user_id= claims["sub"],
        registration_id=registration_id,
        status=status)

# @router.post("/assignments/claim/{reg_id}", response_model=StudentTutorAssignmentOut, tags=["Assignments"])
# def tutor_claim_api(reg_id: str, claims: dict = Depends(require_roles(["tutor"]))):
#     return svc_tutor_claim_registration(reg_id, tutor_user_id=claims["sub"])

@router.post("/my-assignments/{reg_id}/claim", response_model=StudentTutorAssignmentOut, tags=["10. Tutor Claims"])
def tutor_claim_registration_api(reg_id: str, claims: dict = Depends(require_roles(["tutor","student"]))):
    """[TUTOR] Claim registration (tự nhận học sinh)"""
    return svc_tutor_claim_registration(reg_id, tutor_user_id=claims["sub"])

@router.patch("/my-assignments/{assign_id}/release", response_model=StudentTutorAssignmentOut, tags=["10. Tutor Claims"])
def release_my_assignment_api(assign_id: str, claims: dict = Depends(require_roles(["tutor"]))):
    """[TUTOR] Release assignment (trả lại học sinh)"""
    # Kiểm tra ownership
    assign = svc_get_student_tutor_assignment(assign_id)
    if assign["tutor_user_id"] != claims["sub"]:
        raise HTTPException(status_code=403, detail="You can only release your own assignments")
    return svc_release_assignment(assign_id)

# # admin phân công
# @router.post("/assignments/assign/{reg_id}", response_model=StudentTutorAssignmentOut, tags=["Assignments"])
# def staff_assign_api(reg_id: str, tutor_user_id: str, claims: dict = Depends(require_roles(["admin", "staff"]))):
#     return svc_staff_assign_tutor(reg_id, tutor_user_id)
# #admin release
# @router.patch("/assignments/{assign_id}/release", response_model=StudentTutorAssignmentOut, tags=["Assignments"])
# def release_assignment_api(assign_id: str, claims: dict = Depends(require_roles(["admin", "staff", "tutor"]))):
#     assign = svc_get_student_tutor_assignment(assign_id)
#     if claims['role'] == 'tutor' and assign['tutor_user_id'] != claims['sub']:
#         raise HTTPException(status_code=403, detail="Tutor can only release their own assignments")
#     return svc_release_assignment(assign_id)

# =========================
# CLASSES
# =========================
@router.get("/classes", response_model=List[ClassOut], tags=["Classes"])
def list_classes_api(
    student_tutor_assignments_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start_month: Optional[str] = Query(None, description="Filter by start month in YYYY-MM format", regex=r"^\d{4}-\d{2}$"),
    claims: dict = Depends(get_current_user)

):
    return svc_list_classes(
        student_tutor_assignments_id=student_tutor_assignments_id, 
        status=status, 
        start_month=start_month,
        claims=claims
    )

@router.get("/classes/{class_id}", response_model=ClassOut, tags=["Classes"])
def get_class_api(class_id: str, claims: dict = Depends(get_current_user)):
    return svc_get_class(class_id)

@router.patch("/classes/{class_id}", response_model=ClassOut, tags=["Classes"])
def update_class_api(class_id: str, body: ClassUpdate, claims: dict = Depends(require_roles(["admin", "staff"]))):
    return svc_update_class(class_id, **body.model_dump(exclude_unset=True))

# =========================
# CLASS SESSIONS
# =========================
@router.get("/class-sessions", response_model=List[SessionOut], tags=["Sessions"])
def list_sessions_api(
    class_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    claims: dict = Depends(get_current_user)
):
    return svc_list_class_sessions(class_id=class_id, status=status, claims=claims)

@router.get("/class-sessions/{session_id}", response_model=SessionOut, tags=["Sessions"])
def get_session_api(session_id: str):
    return svc_get_session_details(session_id)

# @router.post("/class-sessions", response_model=SessionOut, status_code=201, tags=["Sessions"])
# def create_session_api(body: SessionCreate, claims: dict = Depends(require_roles(["admin", "staff"]))):
#     return svc_create_session(**body.model_dump())



@router.post("/class-sessions", response_model=SessionOut, status_code=201, tags=["4. Class Sessions"])
def create_session_api(body: SessionCreate):
    """[Admin/Staff] Tạo buổi học mới"""
    return svc_create_session(**body.model_dump())

@router.patch("/class-sessions/{session_id}", response_model=SessionOut, tags=["Sessions"])
def update_session_api(session_id: str, body: SessionUpdate, claims: dict = Depends(require_roles(["admin", "staff"]))):
    return svc_update_session(session_id, **body.model_dump(exclude_unset=True))

@router.delete("/class-sessions/{session_id}", status_code=204, tags=["Sessions"])
def delete_session_api(session_id: str, claims: dict = Depends(require_roles(["admin", "staff"]))):
    svc_delete_class_session(session_id)
    return {}


@router.patch("/class-sessions/{session_id}/complete", response_model=SessionOut, tags=["4. Class Sessions"])
def complete_session_api(
    session_id: str,
    claims: dict = Depends(get_current_user)
):
    """[TUTOR] Đánh dấu hoàn thành buổi học (Vào lớp)"""
    return svc_complete_session(session_id)


@router.patch("/class-sessions/{session_id}/processing", response_model=SessionOut, tags=["4. Class Sessions"])
def processsing_session_api(
    session_id: str,
    claims: dict = Depends(get_current_user)
):
    """[TUTOR] Đánh dấu hoàn thành buổi học (Vào lớp)"""
    return svc_processing_session(session_id)


# =========================
# PAYROLL
# =========================
@router.get("/payrolls/paid-status/{month}", response_model=List[str], tags=["Payroll"])
def get_paid_statuses_api(month: str, claims: dict = Depends(require_roles(["accountant", "admin"]))):
    return svc_get_paid_tutor_ids_for_month(month)

@router.post("/payrolls/mark-as-paid", status_code=201, tags=["Payroll"])
def mark_as_paid_api(body: PayrollStatusUpdate, claims: dict = Depends(require_roles(["accountant", "admin"]))):
    return svc_mark_as_paid(body.tutor_id, body.month)

# @router.get("/payrolls/history", response_model=List[PaymentHistoryOut], tags=["Payroll"])
# async def list_payment_history_api(claims: dict = Depends(require_roles(["accountant", "admin"]))):
#     return await svc_list_payment_history()





# =========================
# PAYMENT INTEGRATION
# =========================
@router.patch("/registrations/{reg_id}/status", tags=["9. Registrations (Admin/Staff/Payment)"])
def update_registration_status_api(
    reg_id: str,
    body: dict,
    claims: dict = Depends(get_current_user)
):
    """
    [Internal or Payment Service] Cập nhật trạng thái đăng ký học (status).
    Cho phép payment service hoặc admin/staff gọi.
    """
    new_status = body.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Missing 'status' in body")


    # ⚠️ Nếu không phải admin/staff/student thì có thể dùng API key nội bộ (nếu sau này muốn)
    updated = svc_update_student_registration(reg_id, status=new_status)
    if not updated:
        raise HTTPException(status_code=404, detail="Registration not found")


    return {"message": f"Registration status updated to '{new_status}'", "status": new_status}
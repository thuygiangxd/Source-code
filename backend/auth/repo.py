# repo.py
from typing import Optional, Dict, Any, List
from auth.db import get_supabase_client

SCHEMA = "auth_svc"
TABLE = "accounts"
TABLE_ROLES = "roles"


def _tb():
    """Tạo query builder cho bảng auth_svc.accounts"""
    client = get_supabase_client()
    return client.schema(SCHEMA).from_(TABLE)


def _tb_roles():
    """Query builder cho bảng auth_svc.roles"""
    client = get_supabase_client()
    return client.schema(SCHEMA).from_(TABLE_ROLES)


def _first_or_none(data: Optional[List[Dict]]) -> Optional[Dict[str, Any]]:
    if isinstance(data, list) and data:
        return data[0]
    return None


def find_auth_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Tìm tài khoản đăng nhập theo username"""
    res = (
        _tb()
        .select("id, username, password_hash, external_user_id, role_code")
        .eq("username", username)
        .limit(1)
        .execute()
    )
    return _first_or_none(res.data)


def create_auth(username: str, password_hash: str, external_user_id: str, role_code: str = "student") -> Dict[str, Any]:
    """Tạo mới bản ghi tài khoản"""
    res = (
        _tb()
        .insert(
            {
                "username": username,
                "password_hash": password_hash,
                "external_user_id": external_user_id,
                "role_code": role_code,
            },
            returning="representation",
        )
        .execute()
    )
    return res.data[0]


# ====== PHẦN BỔ SUNG: ROLES ======

def get_role_by_code(code: str) -> Optional[Dict[str, Any]]:
    """Lấy thông tin role theo code (vd: student, tutor, staff, admin, accountant)"""
    res = (
        _tb_roles()
        .select("id, code, name")
        .eq("code", code)
        .limit(1)
        .execute()
    )
    return _first_or_none(res.data)


def list_roles() -> List[Dict[str, Any]]:
    """Lấy danh sách toàn bộ role"""
    res = _tb_roles().select("id, code, name").execute()
    return res.data or [] 


    return _first_or_none(res.data)

def update_auth_password(username: str, new_password_hash: str) -> Optional[Dict[str, Any]]:
    """Cập nhật password_hash cho tài khoản theo username"""
    res = (
        _tb()
        .update({"password_hash": new_password_hash})
        .eq("username", username)
        .execute()
    )
    return _first_or_none(res.data)

def update_auth_role_by_user_id(external_user_id: str, new_role_code: str) -> Optional[Dict[str, Any]]:
    """Cập nhật role_code cho tài khoản theo external_user_id"""
    res = (
        _tb()
        .update({"role_code": new_role_code})
        .eq("external_user_id", external_user_id)
        .execute()
    )
    return _first_or_none(res.data)

def find_auth_by_external_user_id(external_user_id: str) -> Optional[Dict[str, Any]]:
    """Tìm tài khoản đăng nhập theo external_user_id"""
    res = (
        _tb()
        .select("id, username, password_hash, external_user_id, role_code")
        .eq("external_user_id", external_user_id)
        .limit(1)
        .execute()
    )
    return _first_or_none(res.data)

# ====== PASSWORD RESET OTPS ======

OTP_TABLE = "password_reset_otps"

def _tb_otp():
    """Query builder cho bảng auth_svc.password_reset_otps"""
    client = get_supabase_client()
    return client.schema(SCHEMA).from_(OTP_TABLE)

def create_otp(email: str, otp_code: str, expires_at: str) -> Dict[str, Any]:
    """Tạo mới bản ghi OTP"""
    res = (
        _tb_otp()
        .insert(
            {
                "email": email,
                "otp_code": otp_code,
                "expires_at": expires_at,
            },
            returning="representation",
        )
        .execute()
    )
    return res.data[0]

def find_otp_by_email_and_code(email: str, otp_code: str) -> Optional[Dict[str, Any]]:
    """Tìm OTP theo email và mã OTP"""
    res = (
        _tb_otp()
        .select("*")
        .eq("email", email)
        .eq("otp_code", otp_code)
        .eq("is_used", False)
        .limit(1)
        .execute()
    )
    return _first_or_none(res.data)

def mark_otp_as_used(otp_id: str) -> Optional[Dict[str, Any]]:
    """Đánh dấu OTP đã được sử dụng"""
    res = (
        _tb_otp()
        .update({"is_used": True})
        .eq("id", otp_id)
        .execute()
    )
    return _first_or_none(res.data)
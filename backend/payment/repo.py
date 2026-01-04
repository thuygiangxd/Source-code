from typing import Optional, Dict, Any, List
from payment.db import get_supabase_client
from datetime import datetime

SCHEMA = "payment_svc"
TABLE_INTENTS = "payment_intents"
TABLE_PAYMENTS = "payments"

def _tb_intents():
    """Query builder cho bảng payment_svc.payment_intents"""
    client = get_supabase_client()
    return client.schema(SCHEMA).from_(TABLE_INTENTS)

def _tb_payments():
    """Query builder cho bảng payment_svc.payments"""
    client = get_supabase_client()
    return client.schema(SCHEMA).from_(TABLE_PAYMENTS)

def _first_or_none(data: Optional[List[Dict]]) -> Optional[Dict[str, Any]]:
    if isinstance(data, list) and data:
        return data[0]
    return None

# ====== PAYMENT INTENTS ======

def create_payment_intent(
    payer_user_id: str,
    payer_email: str,
    registration_id: str,
    amount: float
) -> Dict[str, Any]:
    """Tạo payment intent mới"""
    res = (
        _tb_intents()
        .insert(
            {
                "payer_user_id": payer_user_id,
                "payer_email": payer_email,
                "registration_id": registration_id,
                "amount": amount,
                "status": "pending",
            },
            returning="representation",
        )
        .execute()
    )
    return res.data[0]

def find_payment_intent_by_id(intent_id: str) -> Optional[Dict[str, Any]]:
    """Tìm payment intent theo ID"""
    res = (
        _tb_intents()
        .select("*")
        .eq("id", intent_id)
        .limit(1)
        .execute()
    )
    return _first_or_none(res.data)

def update_payment_intent_otp(
    intent_id: str,
    otp_code: str,
    expires_at: str
) -> Optional[Dict[str, Any]]:
    """Cập nhật OTP cho payment intent"""
    res = (
        _tb_intents()
        .update({
            "otp_code": otp_code,
            "otp_expires_at": expires_at,
            "status": "otp_sent",
            "otp_attempts": 0
        })
        .eq("id", intent_id)
        .execute()
    )
    return _first_or_none(res.data)

def increment_otp_attempts(intent_id: str) -> Optional[Dict[str, Any]]:
    """Tăng số lần thử OTP"""
    intent = find_payment_intent_by_id(intent_id)
    if not intent:
        return None
    
    new_attempts = intent.get("otp_attempts", 0) + 1
    res = (
        _tb_intents()
        .update({"otp_attempts": new_attempts})
        .eq("id", intent_id)
        .execute()
    )
    return _first_or_none(res.data)

def update_payment_intent_status(
    intent_id: str,
    status: str
) -> Optional[Dict[str, Any]]:
    """Cập nhật status của payment intent"""
    res = (
        _tb_intents()
        .update({"status": status})
        .eq("id", intent_id)
        .execute()
    )
    return _first_or_none(res.data)

def list_payment_intents_by_user(
    payer_user_id: str,
    status: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Lấy danh sách payment intents của user"""
    query = _tb_intents().select("*").eq("payer_user_id", payer_user_id)
    
    if status:
        query = query.eq("status", status)
    
    res = query.order("created_at", desc=True).execute()
    return res.data or []

def list_payment_intents_by_registration(
    registration_id: str
) -> List[Dict[str, Any]]:
    """Lấy danh sách payment intents theo registration"""
    res = (
        _tb_intents()
        .select("*")
        .eq("registration_id", registration_id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []

# ====== PAYMENTS ======

def create_payment(
    intent_id: str,
    amount: float,
    payer_balance_before: float,
    payer_balance_after: float
) -> Dict[str, Any]:
    """Tạo bản ghi payment sau khi xác nhận thành công"""
    res = (
        _tb_payments()
        .insert(
            {
                "intent_id": intent_id,
                "amount": amount,
                "payer_balance_before": payer_balance_before,
                "payer_balance_after": payer_balance_after,
            },
            returning="representation",
        )
        .execute()
    )
    return res.data[0]

def find_payment_by_intent_id(intent_id: str) -> Optional[Dict[str, Any]]:
    """Tìm payment theo intent_id"""
    res = (
        _tb_payments()
        .select("*")
        .eq("intent_id", intent_id)
        .limit(1)
        .execute()
    )
    return _first_or_none(res.data)

def list_payments_by_user(payer_user_id: str) -> List[Dict[str, Any]]:
    """Lấy danh sách payments của user thông qua join với intents"""
    res = (
        _tb_payments()
        .select("*, payment_intents!inner(payer_user_id)")
        .eq("payment_intents.payer_user_id", payer_user_id)
        .order("paid_at", desc=True)
        .execute()
    )
    return res.data or []

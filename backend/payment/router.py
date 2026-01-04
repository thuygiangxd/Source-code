from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List
from payment.schemas import (
    CreatePaymentIntentRequest,
    CreatePaymentIntentResponse,
    RequestOTPRequest,
    RequestOTPResponse,
    ConfirmPaymentRequest,
    ConfirmPaymentResponse,
    PaymentIntentResponse,
    CancelPaymentIntentRequest,
)
from payment.utils import get_current_user
from payment.service import (
    create_payment_intent_service,
    request_otp_service,
    confirm_payment_service,
    get_payment_intent_service,
    cancel_payment_intent_service,
    list_user_payment_intents_service,
    list_registration_payment_intents_service,
    cancel_or_fail_payment_intent_service,
)

router = APIRouter(prefix="/payment", tags=["payment"])
security = HTTPBearer()

# @router.post("/intents", response_model=CreatePaymentIntentResponse)
# def create_payment_intent(req: CreatePaymentIntentRequest):
#     """Tạo payment intent mới"""
#     return create_payment_intent_service(
#         payer_user_id=req.payer_user_id,
#         payer_email=req.payer_email,
#         registration_id=req.registration_id,
#         amount=req.amount
#     )
# @router.post("/intents", response_model=CreatePaymentIntentResponse)
# def create_payment_intent(
#     req: CreatePaymentIntentRequest,
#     claims: dict = Depends(get_current_user)  # ✅ lấy token hiện tại
# ):
#     token_for_user = claims["_raw_token"]
#     return create_payment_intent_service(
#         payer_user_id=req.payer_user_id,
#         payer_email=req.payer_email,
#         registration_id=req.registration_id,
#         token_for_user=token_for_user  # ✅ truyền token qua service
#     )
@router.post("/intents", response_model=CreatePaymentIntentResponse)
async def create_payment_intent(
    req: CreatePaymentIntentRequest,
    claims: dict = Depends(get_current_user)  # ✅ lấy user hiện tại từ token
):
    """Tạo payment intent mới (tự lấy user_id & email từ token)"""
    token_for_user = claims["_raw_token"]
    return await create_payment_intent_service(
        registration_id=req.registration_id,
        token_for_user=token_for_user,
        current_user=claims
    )



@router.post("/intents/request-otp", response_model=RequestOTPResponse)
def request_otp(req: RequestOTPRequest):
    """Yêu cầu gửi OTP để xác nhận thanh toán"""
    return request_otp_service(req.intent_id)

# @router.post("/intents/confirm", response_model=ConfirmPaymentResponse)
# async def confirm_payment(req: ConfirmPaymentRequest):
#     """Xác nhận thanh toán bằng OTP"""
#     return await confirm_payment_service(req.intent_id, req.otp_code)
@router.post("/intents/confirm")
async def confirm_payment(
    req: ConfirmPaymentRequest,
    claims: dict = Depends(get_current_user)  # ✅ lấy token của user từ FE
):
    token_for_user = claims["_raw_token"]
    return await confirm_payment_service(req.intent_id, req.otp_code, token_for_user)


@router.get("/intents/{intent_id}", response_model=PaymentIntentResponse)
def get_payment_intent(intent_id: str):
    """Lấy thông tin chi tiết payment intent"""
    return get_payment_intent_service(intent_id)

@router.post("/intents/cancel")
def cancel_payment_intent(req: CancelPaymentIntentRequest):
    """Hủy payment intent"""
    return cancel_payment_intent_service(req.intent_id)

@router.get("/intents/user/{user_id}")
def list_user_payment_intents(
    user_id: str,
    status: Optional[str] = Query(None, description="Filter by status")
):
    """Lấy danh sách payment intents của user"""
    return list_user_payment_intents_service(user_id, status)

@router.get("/intents/registration/{registration_id}")
def list_registration_payment_intents(registration_id: str):
    """Lấy danh sách payment intents theo registration ID"""
    return list_registration_payment_intents_service(registration_id)

@router.post("/intents/confirm", response_model=ConfirmPaymentResponse)
async def confirm_payment(req: ConfirmPaymentRequest, claims: dict = Depends(get_current_user)):
    """Xác nhận thanh toán bằng OTP"""
    token = claims.get("_raw_token")
    return await confirm_payment_service(req.intent_id, req.otp_code, token)

@router.post("/intents/fail")
def fail_payment_intent(req: CancelPaymentIntentRequest):
    """Đánh dấu OTP thất bại (failed)"""
    return cancel_or_fail_payment_intent_service(req.intent_id, is_fail=True)


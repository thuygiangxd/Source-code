import os
from dateutil import parser
import httpx
from fastapi import HTTPException, status
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from payment.repo import (
    create_payment_intent,
    find_payment_intent_by_id,
    update_payment_intent_otp,
    increment_otp_attempts,
    update_payment_intent_status,
    list_payment_intents_by_user,
    list_payment_intents_by_registration,
    create_payment,
    find_payment_by_intent_id,
)
# from payment.utils import generate_otp, send_email
from payment.utils import generate_otp
from payment.mailer import send_otp_email, send_payer_receipt_email

from payment.schemas import (
    CreatePaymentIntentResponse,
    RequestOTPResponse,
    ConfirmPaymentResponse,
    PaymentIntentResponse,
)

USER_SERVICE_URL = os.getenv("USER_SVC_URL", "http://localhost:8002")
ACADEMIC_SERVICE_URL = os.getenv("ACADEMIC_SVC_URL", "http://localhost:8003")
OTP_EXPIRATION_MINUTES = 10
MAX_OTP_ATTEMPTS = 3

# def create_payment_intent_service(
#     payer_user_id: str,
#     payer_email: str,
#     registration_id: str,
#     amount: Decimal
# ) -> CreatePaymentIntentResponse:
#     """Tạo payment intent mới"""
    
#     # Validate user exists
#     try:
#         with httpx.Client(timeout=10.0) as client:
#             r = client.get(f"{USER_SERVICE_URL}/user/{payer_user_id}")
#             r.raise_for_status()
#     except httpx.HTTPError as e:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=f"User not found or service error: {e}"
#         )
    
#     # Create payment intent
#     intent = create_payment_intent(
#         payer_user_id=payer_user_id,
#         payer_email=payer_email,
#         registration_id=registration_id,
#         amount=float(amount)
#     )
    
#     return CreatePaymentIntentResponse(
#         message="Payment intent created successfully",
#         intent_id=intent["id"],
#         status=intent["status"]
#     )
# async def create_payment_intent_service(
#     registration_id: str,
#     token_for_user: str,
#     current_user: dict
# ) -> CreatePaymentIntentResponse:
    
#     # Lấy user từ token
#     payer_user_id = current_user["sub"]
#     # payer_username = current_user.get("username")
#     # payer_email = current_user.get("email")
#     """Tạo payment intent mới và tự lấy fee từ academic_svc"""
    
#     # # 1️⃣ Kiểm tra user tồn tại
#     # try:
#     #     with httpx.Client(timeout=10.0) as client:
#     #         # r = client.get(f"{USER_SERVICE_URL}/user/{payer_user_id}")
#     #         r = client.get(
#     #             f"{USER_SERVICE_URL}/user/by-id/{payer_user_id}",
#     #             headers={"Authorization": f"Bearer {token_for_user}"}
#     #         )
#     #         r.raise_for_status()
#     # except httpx.HTTPError as e:
#     #     raise HTTPException(status_code=400, detail=f"User not found: {e}")
#     # 4️⃣ Gọi user_svc lấy số dư
#     try:
#         async with httpx.AsyncClient(timeout=10.0) as client:
#             r = await client.get(
#                 f"{USER_SERVICE_URL}/user/by-id/{intent['payer_user_id']}",
#                 headers={"Authorization": f"Bearer {token_for_user}"}
#             )
#             r.raise_for_status()
#             user = r.json()
#             balance_before = float(user.get("balance", 0))
#     except httpx.HTTPError as e:
#         # update_payment_intent_status(intent_id, "failed")
#         raise HTTPException(status_code=502, detail=f"user_svc unreachable: {e}")

#     # 3️⃣ Lấy học phí thật
#     actual_amount = float(registration.get("fee_amount", 0))
#     if actual_amount <= 0:
#         raise HTTPException(status_code=400, detail="Invalid or missing fee amount")

#     # 4️⃣ Kiểm tra số dư
#     if balance_before < actual_amount:
#         raise HTTPException(
#             status_code=400,
#             detail="Insufficient balance. Please deposit more to continue."
#         )
    
#     # 1️⃣ Lấy thông tin user thật để có email
#     try:
#         with httpx.Client(timeout=10.0) as client:
#             r = client.get(
#                 f"{USER_SERVICE_URL}/user/by-id/{payer_user_id}",
#                 headers={"Authorization": f"Bearer {token_for_user}"}
#             )
#             r.raise_for_status()
#             user_data = r.json()
#             payer_email = user_data.get("email")  # ✅ lấy email thật từ user_svc
#     except httpx.HTTPError as e:
#         raise HTTPException(status_code=400, detail=f"User not found: {e}")


#     # 2️⃣ Lấy thông tin đăng ký từ academic_svc
#     try:
#         with httpx.Client(timeout=10.0) as client:
#             # r = client.get(f"{ACADEMIC_SERVICE_URL}/academic/registration/{registration_id}")
#             # r = client.get(f"{ACADEMIC_SERVICE_URL}/academic/registrations/{registration_id}")
#             r = client.get(
#                     f"{ACADEMIC_SERVICE_URL}/academic/registrations/{registration_id}",
#                     headers={"Authorization": f"Bearer {token_for_user}"}
#                 )            
#             r.raise_for_status()
#             registration = r.json()
#             # 🔥 Debug thêm dòng này:
#             print(f"[DEBUG] Academic API Response: {registration}")
#     except httpx.HTTPError as e:
#         raise HTTPException(status_code=400, detail=f"Cannot fetch registration info: {e}")

#     # 3️⃣ Xác định học phí thật từ registration
#     actual_amount = registration.get("fee_amount")
#     if not actual_amount:
#         raise HTTPException(status_code=400, detail="Missing fee amount in registration")

#     # 4️⃣ Tạo intent thanh toán
#     intent = create_payment_intent(
#         payer_user_id=payer_user_id,
#         payer_email=payer_email,
#         registration_id=registration_id,
#         amount=float(actual_amount)
#     )

#     return CreatePaymentIntentResponse(
#         message="Payment intent created successfully",
#         intent_id=intent["id"],
#         status=intent["status"]
#     )
async def create_payment_intent_service(
    registration_id: str,
    token_for_user: str,
    current_user: dict
) -> CreatePaymentIntentResponse:
    """Tạo payment intent mới, kiểm tra số dư trước khi tạo"""
    
    payer_user_id = current_user["sub"]

    # 1️⃣ Lấy thông tin user từ user_svc (để có email + balance)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                f"{USER_SERVICE_URL}/user/by-id/{payer_user_id}",
                headers={"Authorization": f"Bearer {token_for_user}"}
            )
            r.raise_for_status()
            user_data = r.json()
            payer_email = user_data.get("email")
            balance = float(user_data.get("balance", 0))
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"user_svc unreachable: {e}")

    # 2️⃣ Lấy thông tin đăng ký học từ academic_svc
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                f"{ACADEMIC_SERVICE_URL}/academic/registrations/{registration_id}",
                headers={"Authorization": f"Bearer {token_for_user}"}
            )
            r.raise_for_status()
            registration = r.json()
            print(f"[DEBUG] Academic API Response: {registration}")
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Cannot fetch registration info: {e}")

    # 3️⃣ Lấy học phí thật
    actual_amount = float(registration.get("fee_amount", 0))
    if actual_amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid or missing fee amount")

    # 4️⃣ Kiểm tra số dư
    if balance < actual_amount:
        raise HTTPException(
            status_code=400,
            detail="Insufficient balance. Please deposit more to continue."
        )

    # 5️⃣ Tạo intent thanh toán (nếu đủ tiền)
    intent = create_payment_intent(
        payer_user_id=payer_user_id,
        payer_email=payer_email,
        registration_id=registration_id,
        amount=actual_amount
    )

    return CreatePaymentIntentResponse(
        message="Payment intent created successfully",
        intent_id=intent["id"],
        status=intent["status"]
    )



def request_otp_service(intent_id: str) -> RequestOTPResponse:
    """Gửi OTP qua email để xác nhận thanh toán"""
    
    intent = find_payment_intent_by_id(intent_id)
    if not intent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment intent not found"
        )
    
    # Kiểm tra status phải là pending hoặc otp_sent
    if intent["status"] not in ["pending", "otp_sent"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot request OTP for intent with status: {intent['status']}"
        )
    
    # Generate OTP
    otp_code = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRATION_MINUTES)
    
    # Update intent with OTP
    updated_intent = update_payment_intent_otp(
        intent_id=intent_id,
        otp_code=otp_code,
        expires_at=expires_at.isoformat()
    )
    
    if not updated_intent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update payment intent with OTP"
        )
    
    # Send email
    subject = "Payment Confirmation OTP"
    body = f"""
    Your OTP for payment confirmation is: {otp_code}
    
    Amount: {intent['amount']}
    Registration ID: {intent['registration_id']}
    
    This OTP is valid for {OTP_EXPIRATION_MINUTES} minutes.
    """
    
    try:
        # send_email(to_email=intent["payer_email"], subject=subject, body=body)
        send_otp_email(intent["payer_email"], otp_code)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send OTP email: {e}"
        )
    
    return RequestOTPResponse(
        message="OTP sent to your email",
        expires_at=expires_at
    )

# async def confirm_payment_service(
#     intent_id: str,
#     otp_code: str
# ) -> ConfirmPaymentResponse:
#     """Xác nhận thanh toán bằng OTP"""
    
#     intent = find_payment_intent_by_id(intent_id)
#     if not intent:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Payment intent not found"
#         )
    
#     # Kiểm tra status
#     if intent["status"] != "otp_sent":
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=f"Payment intent status is {intent['status']}, expected 'otp_sent'"
#         )
    
#     # Kiểm tra số lần thử
#     if intent["otp_attempts"] >= MAX_OTP_ATTEMPTS:
#         update_payment_intent_status(intent_id, "failed")
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Maximum OTP attempts exceeded"
#         )
    
#     # Kiểm tra OTP
#     if intent["otp_code"] != otp_code:
#         increment_otp_attempts(intent_id)
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Invalid OTP code"
#         )
    
#     # Kiểm tra OTP expiry
#     otp_expires_at = datetime.fromisoformat(intent["otp_expires_at"])
#     if otp_expires_at < datetime.now(timezone.utc):
#         update_payment_intent_status(intent_id, "expired")
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="OTP has expired"
#         )
    
#     # Update intent status to processing
#     update_payment_intent_status(intent_id, "processing")
    
#     # Get user balance
#     try:
#         async with httpx.AsyncClient(timeout=10.0) as client:
#             r = await client.get(f"{USER_SERVICE_URL}/user/{intent['payer_user_id']}")
#             r.raise_for_status()
#             user = r.json()
#             balance_before = float(user.get("balance", 0))
#     except httpx.HTTPError as e:
#         update_payment_intent_status(intent_id, "failed")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Failed to get user balance: {e}"
#         )
    
#     # Check sufficient balance
#     payment_amount = float(intent["amount"])
#     if balance_before < payment_amount:
#         update_payment_intent_status(intent_id, "failed")
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Insufficient balance"
#         )
    
#     # Deduct balance
#     balance_after = balance_before - payment_amount
#     try:
#         async with httpx.AsyncClient(timeout=10.0) as client:
#             r = await client.patch(
#                 f"{USER_SERVICE_URL}/user/{intent['payer_user_id']}/balance",
#                 json={"balance": balance_after}
#             )
#             r.raise_for_status()
#     except httpx.HTTPError as e:
#         update_payment_intent_status(intent_id, "failed")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Failed to update user balance: {e}"
#         )
    
#     # Create payment record
#     payment = create_payment(
#         intent_id=intent_id,
#         amount=payment_amount,
#         payer_balance_before=balance_before,
#         payer_balance_after=balance_after
#     )
    
#     # Update intent status to confirmed
#     update_payment_intent_status(intent_id, "confirmed")
    
#     return ConfirmPaymentResponse(
#         message="Payment confirmed successfully",
#         payment_id=payment["id"],
#         amount=Decimal(str(payment_amount))
#     )
async def confirm_payment_service(intent_id: str, otp_code: str, token_for_user: str):
    """Xác nhận thanh toán bằng OTP và trừ tiền nếu đủ"""
    intent = find_payment_intent_by_id(intent_id)
    if not intent:
        raise HTTPException(status_code=404, detail="Payment intent not found")

    # 1️⃣ Kiểm tra OTP
    if intent["otp_code"] != otp_code:
        increment_otp_attempts(intent_id)
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # 2️⃣ Kiểm tra hết hạn
    # Thay dòng cũ bằng:
    otp_expires_at = parser.isoparse(intent["otp_expires_at"])

    if otp_expires_at < datetime.now(timezone.utc):
        update_payment_intent_status(intent_id, "expired")
        raise HTTPException(status_code=400, detail="OTP expired")

    # 3️⃣ Lock intent
    update_payment_intent_status(intent_id, "processing")

    # 4️⃣ Gọi user_svc lấy số dư
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                f"{USER_SERVICE_URL}/user/by-id/{intent['payer_user_id']}",
                headers={"Authorization": f"Bearer {token_for_user}"}
            )
            r.raise_for_status()
            user = r.json()
            balance_before = float(user.get("balance", 0))
    except httpx.HTTPError as e:
        update_payment_intent_status(intent_id, "failed")
        raise HTTPException(status_code=502, detail=f"user_svc unreachable: {e}")

    # 5️⃣ Kiểm tra số dư
    amount = float(intent["amount"])
    # if balance_before < amount:
    #     update_payment_intent_status(intent_id, "failed")
    #     # 🚨 Gửi về FE thông báo rõ ràng
    #     raise HTTPException(
    #         status_code=400,
    #         detail="Insufficient balance. Please deposit more to continue."
    #     )

    # # 6️⃣ Trừ tiền (nếu đủ)
    # new_balance = balance_before - amount
    # async with httpx.AsyncClient(timeout=10.0) as client:
    #     await client.patch(
    #         f"{USER_SERVICE_URL}/user/by-id/{intent['payer_user_id']}/balance",
    #         headers={"Authorization": f"Bearer {token_for_user}"},
    #         json={"balance": new_balance}
    #     )
    # 6️⃣ Trừ tiền (nếu đủ)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                f"{USER_SERVICE_URL}/user/{intent['payer_user_id']}/debit",
                headers={"Authorization": f"Bearer {token_for_user}"},
                json={"amount": amount}
            )
            r.raise_for_status()
            user_after = r.json()
            new_balance = float(user_after.get("balance", balance_before - amount))
    except httpx.HTTPError as e:
        update_payment_intent_status(intent_id, "failed")
        raise HTTPException(
            status_code=502,
            detail=f"Failed to debit user balance via user_svc: {e}"
        )


    # 7️⃣ Ghi lịch sử payment
    payment = create_payment(
        intent_id=intent_id,
        amount=amount,
        payer_balance_before=balance_before,
        payer_balance_after=new_balance,
    )
    # 8️⃣ Cập nhật trạng thái đăng ký bên academic_svc
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.patch(
                f"{ACADEMIC_SERVICE_URL}/academic/registrations/{intent['registration_id']}/status",
                headers={"Authorization": f"Bearer {token_for_user}"},
                json={"status": "pending"}  # ← chuyển từ processing → pending sau khi thanh toán
            )
            r.raise_for_status()
            print(f"[INFO] Registration {intent['registration_id']} updated to 'pending'")
    except httpx.HTTPError as e:
        print(f"[WARN] Failed to update registration status: {e}")


    update_payment_intent_status(intent_id, "confirmed")
    # ✅ Chuẩn bị thông tin gửi biên nhận
    payment_info = {
        "order_id": intent_id,
        "amount": amount,
        "payment_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "description": f"Thanh toán học phí - Registration ID: {intent['registration_id']}",
        "payer_user": intent["payer_email"],   # hoặc username nếu có
        "student_user": intent["payer_email"], # nếu người thanh toán chính là người học
    }

    # ✅ Gửi email biên nhận HTML
    try:
        send_payer_receipt_email(
            to_email=intent["payer_email"],
            payment_info=payment_info
        )
    except Exception as e:
        print(f"[WARN] Failed to send receipt email: {e}")


def get_payment_intent_service(intent_id: str) -> PaymentIntentResponse:
    """Lấy thông tin payment intent"""
    intent = find_payment_intent_by_id(intent_id)
    if not intent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment intent not found"
        )
    
    return PaymentIntentResponse(
        id=intent["id"],
        created_at=intent["created_at"],
        payer_user_id=intent["payer_user_id"],
        payer_email=intent["payer_email"],
        registration_id=intent["registration_id"],
        amount=Decimal(str(intent["amount"])),
        status=intent["status"],
        otp_attempts=intent["otp_attempts"]
    )

def cancel_payment_intent_service(intent_id: str):
    """Hủy payment intent"""
    intent = find_payment_intent_by_id(intent_id)
    if not intent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment intent not found"
        )
    
    if intent["status"] in ["confirmed", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel intent with status: {intent['status']}"
        )
    
    update_payment_intent_status(intent_id, "cancelled")
    return {"message": "Payment intent cancelled successfully"}

def list_user_payment_intents_service(payer_user_id: str, status: str = None):
    """Lấy danh sách payment intents của user"""
    intents = list_payment_intents_by_user(payer_user_id, status)
    return intents

def list_registration_payment_intents_service(registration_id: str):
    """Lấy danh sách payment intents theo registration"""
    intents = list_payment_intents_by_registration(registration_id)
    return intents

def cancel_or_fail_payment_intent_service(intent_id: str, is_fail: bool = False):
    """Hủy hoặc đánh dấu OTP thất bại"""
    intent = find_payment_intent_by_id(intent_id)
    if not intent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment intent not found"
        )

    if intent["status"] in ["confirmed", "cancelled", "failed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update intent with status: {intent['status']}"
        )

    new_status = "failed" if is_fail else "cancelled"
    update_payment_intent_status(intent_id, new_status)

    return {"message": f"Payment intent marked as {new_status} successfully"}

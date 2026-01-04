from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from decimal import Decimal

class CreatePaymentIntentRequest(BaseModel):
    registration_id: str


class CreatePaymentIntentResponse(BaseModel):
    message: str
    intent_id: str
    status: str

class RequestOTPRequest(BaseModel):
    intent_id: str

class RequestOTPResponse(BaseModel):
    message: str
    expires_at: datetime

class ConfirmPaymentRequest(BaseModel):
    intent_id: str
    otp_code: str

class ConfirmPaymentResponse(BaseModel):
    message: str
    payment_id: str
    amount: Decimal

class PaymentIntentResponse(BaseModel):
    id: str
    created_at: datetime
    payer_user_id: str
    payer_email: str
    registration_id: str
    amount: Decimal
    status: str
    otp_attempts: int

class PaymentResponse(BaseModel):
    id: str
    intent_id: str
    paid_at: datetime
    amount: Decimal
    payer_balance_before: Decimal
    payer_balance_after: Decimal

class CancelPaymentIntentRequest(BaseModel):
    intent_id: str

class FailPaymentIntentRequest(BaseModel):
    intent_id: str


# schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    message: str
    username: str
    access_token: str
    token_type: str = "bearer"

from typing import Optional

class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    name: str
    password: str
    phone: str 
    role: Optional[str] = "student"

class SignupResponse(BaseModel):
    message: str
    username: str

class UpdatePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class OtpRequestResponse(BaseModel):
    message: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

class ResetPasswordResponse(BaseModel):
    message: str

class UpdateRoleRequest(BaseModel):
    user_id: str
    new_role_code: str
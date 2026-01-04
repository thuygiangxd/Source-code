# router.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from auth.schemas import LoginRequest, LoginResponse, SignupRequest, SignupResponse, UpdatePasswordRequest, ForgotPasswordRequest, OtpRequestResponse, ResetPasswordRequest, ResetPasswordResponse, UpdateRoleRequest
from auth.service import login_auth, signup_auth, update_password, request_password_reset_otp, reset_password_with_otp, update_user_role
from auth.utils import decode_token

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    return login_auth(req.username, req.password)

@router.post("/signup", response_model=SignupResponse)
def signup(req: SignupRequest):
    return signup_auth(username=req.username, email=req.email, name=req.name, password=req.password, phone=req.phone, role_code=req.role)

@router.patch("/password")
def change_password(req: UpdatePasswordRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        claims = decode_token(token)
        username = claims.get("username")
        if not username:
            raise HTTPException(status_code=400, detail="Username not found in token")
        return update_password(username, req.current_password, req.new_password)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

@router.post("/forgot-password/request-otp", response_model=OtpRequestResponse)
async def forgot_password_request_otp(req: ForgotPasswordRequest):
    return await request_password_reset_otp(req.email)

@router.post("/forgot-password/reset", response_model=ResetPasswordResponse)
async def forgot_password_reset(req: ResetPasswordRequest):
    return await reset_password_with_otp(req.email, req.otp, req.new_password)

@router.get("/verify")
def verify(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        claims = decode_token(token)
        return {"valid": True, "claims": claims}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

@router.patch("/update-role")
def update_role(req: UpdateRoleRequest):
    """Internal endpoint để update role của user (được gọi từ các service khác)"""
    return update_user_role(req.user_id, req.new_role_code)



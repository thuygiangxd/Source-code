# service.py
import os
from fastapi import HTTPException, status
from auth.utils import create_access_token, verify_password, hash_password, generate_otp, send_email
from auth.repo import find_auth_by_username, create_auth, update_auth_password, update_auth_role_by_user_id, create_otp, find_otp_by_email_and_code, mark_otp_as_used, find_auth_by_external_user_id
from auth.schemas import LoginResponse, SignupResponse, UpdatePasswordRequest, OtpRequestResponse, ResetPasswordResponse
import httpx
from typing import Optional
from datetime import datetime, timedelta, timezone

USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://localhost:8002/user")
OTP_EXPIRATION_MINUTES = 10 # OTP valid for 10 minutes

def login_auth(username: str, password: str) -> LoginResponse:
    print(f"[AuthService] Login attempt: {username}")
    auth = find_auth_by_username(username)
    if not auth:
        print("[AuthService] User not found in auth table")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    if not verify_password(password, auth["password_hash"]):
        print("[AuthService] Password verification failed")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token_data = {
        "sub": auth["external_user_id"],
        "username": auth.get("username"),
        "role": auth["role_code"],
    }
    print(f"[AuthService] Login success, token_data={token_data}")
    access_token = create_access_token(token_data)
    return LoginResponse(message="Login successful", username=username, access_token=access_token)


def signup_auth(username: str, email: str, name: str, password: str,phone:str, role_code: str) -> SignupResponse:
    if find_auth_by_username(username):
        raise HTTPException(status_code=400, detail="Username already exists")

    # tạo profile ở user-service
    try:
        with httpx.Client(timeout=10.0) as client:
            r = client.post(
                f"{USER_SERVICE_URL}/create",
                json={"username": username, "email": email, "name": name, "phone":phone},
            )
            r.raise_for_status()
            user = r.json()  # {"id": "...", ...}
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"User service failed: {e}")

    pwd_hash = hash_password(password)
    _ = create_auth(username=username, password_hash=pwd_hash, external_user_id=user["id"])
    return SignupResponse(message="Signup successful", username=username)

def update_password(username: str, current_password: str, new_password: str):
    auth = find_auth_by_username(username)
    if not auth:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if not verify_password(current_password, auth["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid current password")
    
    new_password_hash = hash_password(new_password)
    updated_auth = update_auth_password(username, new_password_hash)
    if not updated_auth:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update password")
    return {"message": "Password updated successfully"}

async def request_password_reset_otp(email: str) -> OtpRequestResponse:
    # Check if user exists in user service
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(f"{USER_SERVICE_URL}/by-email/{email}")
            r.raise_for_status()
            user = r.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User with this email not found")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"User service error: {e}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Could not connect to user service: {e}")

    otp_code = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRATION_MINUTES)
    
    # Store OTP
    create_otp(email=email, otp_code=otp_code, expires_at=expires_at.isoformat())

    # Send email
    subject = "Password Reset OTP"
    body = f"Your OTP for password reset is: {otp_code}. It is valid for {OTP_EXPIRATION_MINUTES} minutes."
    send_email(to_email=email, subject=subject, body=body)

    return OtpRequestResponse(message="OTP sent to your email")

async def reset_password_with_otp(email: str, otp: str, new_password: str) -> ResetPasswordResponse:
    # Check if user exists in user service
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(f"{USER_SERVICE_URL}/by-email/{email}")
            r.raise_for_status()
            user = r.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User with this email not found")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"User service error: {e}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Could not connect to user service: {e}")

    # Find and validate OTP
    otp_record = find_otp_by_email_and_code(email, otp)
    if not otp_record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP or OTP already used")

    if datetime.fromisoformat(otp_record["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP expired")

    if otp_record["is_used"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP already used")

    # Mark OTP as used
    mark_otp_as_used(otp_record["id"])

    # Find auth record using external_user_id
    auth = find_auth_by_external_user_id(user["id"])
    if not auth:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auth record not found for user")

    # Update password
    new_password_hash = hash_password(new_password)
    updated_auth = update_auth_password(auth["username"], new_password_hash)
    if not updated_auth:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update password")

    return ResetPasswordResponse(message="Password reset successfully")

def update_user_role(user_id: str, new_role_code: str):
    """Update role_code cho user theo external_user_id"""
    updated = update_auth_role_by_user_id(user_id, new_role_code)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found")
    return {"message": f"Role updated to {new_role_code} successfully", "user_id": user_id, "new_role": new_role_code}
# utils.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import os

JWT_SECRET = os.getenv("JWT_SECRET", "default_secret_key_change_this")
JWT_ALGORITHM = "HS256"

security = HTTPBearer()

def decode_token(token: str):
    """Decode JWT token"""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    token = credentials.credentials
    claims = decode_token(token)
    return claims

def require_roles(allowed_roles: list):
    """Dependency to check if user has required role"""
    def role_checker(claims: dict = Depends(get_current_user)):
        user_role = claims.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {allowed_roles}"
            )
        return claims
    return role_checker

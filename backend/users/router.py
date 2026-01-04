# # users/router.py
from fastapi import APIRouter, Depends, HTTPException
from decimal import Decimal
from .schemas import UserPublic, DebitRequest, DebitResponse, CreateUserIn
from .service import (
    create_user_service,
    get_user_by_id_service,
    get_user_by_username_service,
    get_me_service,
    debit_user_service,
    deposit_user_service,
    get_user_by_email_service,update_user_service
)
from .utils import get_current_user



router = APIRouter(prefix="/user", tags=["users"])

# --- PUBLIC: không cần token ---
@router.post("/create", response_model=UserPublic)
def api_create_user(body: CreateUserIn):
    return create_user_service(body.dict())

@router.get("/by-email/{email}", response_model=UserPublic)
def api_get_user_by_email(email: str):
    user = get_user_by_email_service(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# --- PROTECTED: require_auth gắn TRỰC TIẾP vào hàm ---
@router.get("/me", response_model=UserPublic)
def api_get_me(claims: dict = Depends(get_current_user)):
    return get_me_service(claims)

@router.get("/by-id/{user_id}", response_model=UserPublic)
def api_get_user_by_id(user_id: str, _: dict = Depends(get_current_user)):
    return get_user_by_id_service(user_id)

@router.get("/by-username/{username}", response_model=UserPublic)
def api_get_user_by_username(username: str, _: dict = Depends(get_current_user)):
    return get_user_by_username_service(username)

@router.post("/{user_id}/debit", response_model=DebitResponse)
def api_debit_user(user_id: str, body: DebitRequest, _: dict = Depends(get_current_user)):
    row = debit_user_service(user_id, Decimal(str(body.amount)))
    return {"new_balance": row["balance"]}

@router.post("/{user_id}/deposit")
def api_deposit_user(user_id: str, body: DebitRequest, _: dict = Depends(get_current_user)):
    """
    Nạp tiền thật vào tài khoản người dùng.
    """
    row = deposit_user_service(user_id, Decimal(str(body.amount)))
    return {"new_balance": row["balance"]}









@router.patch("/{user_id}/update")
def api_update_user(user_id: str, body: dict, _: dict = Depends(get_current_user)):
    return update_user_service(user_id, body)

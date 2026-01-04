# from decimal import Decimal
# from fastapi import HTTPException
# from typing import Dict, Any
# from .schemas import CreateUserIn,UserPublic, DebitResponse, DebitRequest, DepositRequest, DepositResponse
# from .repo import (
#     get_user_by_id,
#     find_user_by_username,
#     update_balance_if_unchanged,
#     create_user,
#     find_user_by_email,
# )

# def create_user_service(payload: Dict[str, Any]) -> Dict[str, Any]:
#     """
#     Tạo profile: {username, email, name, phone}
#     Rely vào unique constraint DB; nếu trùng, trả 400 với message từ DB.
#     """
#     if not payload.get("username") or not payload.get("email") or not payload.get("name") or not payload.get("phone"):
#         raise HTTPException(status_code=400, detail="Missing required fields")
#     try:
#         row = create_user(payload)
#         return row
#     except Exception as e:
#         # ví dụ: duplicate key value violates unique constraint "users_username_key"
#         raise HTTPException(status_code=400, detail=str(e))

# def get_user_by_id_service(user_id: str) -> Dict[str, Any]:
#     u = get_user_by_id(user_id)
#     if not u:
#         raise HTTPException(status_code=404, detail="User not found")
#     return u

# def get_user_by_email_service(email: str) -> Dict[str, Any]:
#     u = find_user_by_email(email)
#     if not u:
#         raise HTTPException(status_code=404, detail="User not found")
#     return u

# def get_user_by_username_service(username: str) -> Dict[str, Any]:
#     u = find_user_by_username(username)
#     if not u:
#         raise HTTPException(status_code=404, detail="User not found")
#     return u

# def get_me_service(claims: dict) -> Dict[str, Any]:
#     user_id = claims.get("sub")
#     if user_id:
#         u = get_user_by_id(user_id)
#         if u:
#             return u
#     username = claims.get("username")
#     if username:
#         u = find_user_by_username(username)
#         if u:
#             return u
#     raise HTTPException(status_code=404, detail="User not found")

# #Tru tien
# def debit_user_service(user_id: str, amount: Decimal) -> Dict[str, Any]:
#     if amount is None or amount <= 0:
#         raise HTTPException(status_code=400, detail="Invalid amount")

#     u = get_user_by_id(user_id)
#     if not u:
#         raise HTTPException(status_code=404, detail="User not found")

#     old_balance = Decimal(str(u["balance"]))
#     if old_balance < amount:
#         raise HTTPException(status_code=409, detail="Insufficient funds")

#     new_balance = old_balance - amount
#     row = update_balance_if_unchanged(user_id, old_balance, new_balance)
#     if not row:
#         raise HTTPException(status_code=409, detail="Balance changed, please retry")
#     return row


# #Nap tien
# def deposit_user_service(user_id: str, amount: Decimal) -> Dict[str, Any]:
#     """
#     Nạp tiền thật vào tài khoản.
#     """
#     if amount is None or amount <= 0:
#         raise HTTPException(status_code=400, detail="Invalid amount")

#     u = get_user_by_id(user_id)
#     if not u:
#         raise HTTPException(status_code=404, detail="User not found")

#     old_balance = Decimal(str(u["balance"]))
#     new_balance = old_balance + amount

#     row = update_balance_if_unchanged(user_id, old_balance, new_balance)
#     if not row:
#         raise HTTPException(status_code=409, detail="Balance changed, please retry")

#     return row





from decimal import Decimal
from fastapi import HTTPException
from typing import Dict, Any
from .schemas import CreateUserIn,UserPublic, DebitResponse, DebitRequest, DepositRequest, DepositResponse
from .repo import (
    get_user_by_id,
    find_user_by_username,
    update_balance_if_unchanged,
    create_user,
    find_user_by_email,
    update_user,
)

def create_user_service(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Tạo profile: {username, email, name, phone}
    Rely vào unique constraint DB; nếu trùng, trả 400 với message từ DB.
    """
    if not payload.get("username") or not payload.get("email") or not payload.get("name") or not payload.get("phone"):
        raise HTTPException(status_code=400, detail="Missing required fields")
    try:
        row = create_user(payload)
        return row
    except Exception as e:
        # ví dụ: duplicate key value violates unique constraint "users_username_key"
        raise HTTPException(status_code=400, detail=str(e))

def get_user_by_id_service(user_id: str) -> Dict[str, Any]:
    u = get_user_by_id(user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return u

def get_user_by_email_service(email: str) -> Dict[str, Any]:
    u = find_user_by_email(email)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return u

def get_user_by_username_service(username: str) -> Dict[str, Any]:
    u = find_user_by_username(username)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return u

def get_me_service(claims: dict) -> Dict[str, Any]:
    user_id = claims.get("sub")
    if user_id:
        u = get_user_by_id(user_id)
        if u:
            return u
    username = claims.get("username")
    if username:
        u = find_user_by_username(username)
        if u:
            return u
    raise HTTPException(status_code=404, detail="User not found")

#Tru tien
def debit_user_service(user_id: str, amount: Decimal) -> Dict[str, Any]:
    if amount is None or amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    u = get_user_by_id(user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    old_balance = Decimal(str(u["balance"]))
    if old_balance < amount:
        raise HTTPException(status_code=409, detail="Insufficient funds")

    new_balance = old_balance - amount
    row = update_balance_if_unchanged(user_id, old_balance, new_balance)
    if not row:
        raise HTTPException(status_code=409, detail="Balance changed, please retry")
    return row


#Nap tien
def deposit_user_service(user_id: str, amount: Decimal) -> Dict[str, Any]:
    """
    Nạp tiền thật vào tài khoản.
    """
    if amount is None or amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    u = get_user_by_id(user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    old_balance = Decimal(str(u["balance"]))
    new_balance = old_balance + amount

    row = update_balance_if_unchanged(user_id, old_balance, new_balance)
    if not row:
        raise HTTPException(status_code=409, detail="Balance changed, please retry")

    return row

def update_user_service(user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    allowed_fields = {"name", "email", "phone"}

    update_data = {
        key: value
        for key, value in payload.items()
        if key in allowed_fields and value is not None
    }

    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    row = update_user(user_id, update_data)
    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    return row
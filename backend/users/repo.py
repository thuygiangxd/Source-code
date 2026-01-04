from typing import Optional, Dict, Any
from decimal import Decimal
from .db import get_supabase_client

SCHEMA = "user_svc"
TABLE  = "users"

def _tb():
    return get_supabase_client().schema(SCHEMA).table(TABLE)


def _tb():
    client = get_supabase_client()
    return client.schema(SCHEMA).from_(TABLE)

def _first(data):
    return data[0] if isinstance(data, list) and data else None

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    res = (_tb()
           .select("id, username, email, name, phone, gender, balance, created_at")
           .eq("id", user_id).limit(1).execute())
    return _first(res.data)

def find_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    res = (_tb()
           .select("id, username, email, name, phone, gender, balance, created_at")
           .eq("username", username).limit(1).execute())
    return _first(res.data)

def find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    res = (_tb()
           .select("id, username, email, name, phone, gender, balance, created_at")
           .eq("email", email).limit(1).execute())
    return _first(res.data)

def create_user(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    data = {username, email, name}
    balance để DB default = 0.00
    """
    res = (_tb()
           .insert(
               {
                   "username": data["username"],
                   "email": data["email"],
                   "name": data["name"],
                    "phone": data["phone"],
                    
               },
               returning="representation",
           )
           .execute())
    return res.data[0]

def update_balance_if_unchanged(user_id: str, old_balance: Decimal, new_balance: Decimal) -> Optional[Dict[str, Any]]:
    res = (_tb()
           .update({"balance": str(new_balance)}, returning="representation")
           .eq("id", user_id)
           .eq("balance", str(old_balance))
           .execute())
    return _first(res.data)










def update_user(user_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    res = (
        _tb()
        .update(data, returning="representation")
        .eq("id", user_id)
        .execute()
    )
    return _first(res.data)
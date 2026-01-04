from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from decimal import Decimal
from typing import Annotated
from pydantic import Field

Money = Annotated[Decimal, Field(max_digits=18, decimal_places=2)]

class CreateUserIn(BaseModel):
    username: str
    email: EmailStr
    name: str
    phone: str

class UserPublic(BaseModel):
    id: str
    username: str
    email: EmailStr
    name: str
    balance: Money
    created_at: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None

class DebitRequest(BaseModel):
    amount: Annotated[Decimal, Field(gt=0, max_digits=18, decimal_places=2)]

class DebitResponse(BaseModel):
    new_balance: Money


class DepositRequest(BaseModel):
    amount: Annotated[Decimal, Field(gt=0, max_digits=18, decimal_places=2)]

class DepositResponse(BaseModel):
    new_balance: Money
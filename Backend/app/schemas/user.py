from pydantic import BaseModel, EmailStr
from typing import Optional, Dict

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    empID: Optional[str] = None


class UserBase(BaseModel):
    empID: str
    name: str
    role: str
    team: Optional[str] = None
    email: EmailStr
    is_admin: bool = False

class UserOut(UserBase):
    id: str

    class Config:
        from_attributes = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    empID: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None
    team: Optional[str] = None
    email: Optional[EmailStr] = None
    is_admin: Optional[bool] = None
    password: Optional[str] = None

class UserOut(UserBase):
    id: str

    class Config:
        from_attributes = True
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    user_id: int
    assigned_mine_id: Optional[int] = None

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    role_id: int
    assigned_mine_id: Optional[int] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    role_id: Optional[int] = None
    assigned_mine_id: Optional[int] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: int
    created_at: datetime
    role: RoleResponse

    class Config:
        from_attributes = True

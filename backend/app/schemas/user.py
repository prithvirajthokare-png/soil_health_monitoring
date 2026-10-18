from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: str = Field(..., min_length=5, max_length=255)
    full_name: Optional[str] = None
    role: str = Field(default="user", pattern="^(admin|user)$")
    is_active: bool = True

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None
    role: str = Field(default="user", pattern="^(admin|user)$")
    assigned_farms: Optional[List[str]] = Field(default_factory=list)

class UserUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = Field(default=None, pattern="^(admin|user)$")
    is_active: Optional[bool] = None
    assigned_farms: Optional[List[str]] = None

class UserFarmAssignmentResponse(BaseModel):
    id: int
    user_id: int
    location_id: str
    role_on_farm: str
    assigned_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: Optional[datetime] = None
    assigned_farms: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class FarmAssignmentRequest(BaseModel):
    location_ids: List[str]
    role_on_farm: Optional[str] = "owner"

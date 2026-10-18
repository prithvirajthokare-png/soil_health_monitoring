from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.app.database import get_db
from backend.app.models.user import User, UserFarmAssignment
from backend.app.schemas.user import (
    LoginRequest, 
    TokenResponse, 
    UserResponse, 
    UserCreate
)
from backend.app.services.auth import (
    hash_password, 
    verify_password, 
    create_access_token, 
    require_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication & Access Control"])

def _format_user_response(user: User) -> UserResponse:
    assigned_farms = [a.location_id for a in user.farm_assignments] if user.farm_assignments else []
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        assigned_farms=assigned_farms
    )

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user credentials (username or email) and return an access token.
    """
    clean_username = request.username.strip().lower()
    user = db.query(User).filter(
        (User.username == clean_username) | (User.email == clean_username)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact an administrator."
        )

    if not verify_password(request.password, user.hashed_password, user.salt):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    token = create_access_token(user.id, user.username, user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=_format_user_response(user)
    )

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(request: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user account.
    """
    clean_username = request.username.strip().lower()
    clean_email = request.email.strip().lower()

    if db.query(User).filter(User.username == clean_username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{clean_username}' is already taken."
        )

    if db.query(User).filter(User.email == clean_email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{clean_email}' is already registered."
        )

    hashed_pw, salt = hash_password(request.password)

    new_user = User(
        username=clean_username,
        email=clean_email,
        hashed_password=hashed_pw,
        salt=salt,
        full_name=request.full_name or clean_username.title(),
        role=request.role if request.role in ["admin", "user"] else "user",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Optional initial farm assignments
    if request.assigned_farms:
        for loc_id in request.assigned_farms:
            assignment = UserFarmAssignment(
                user_id=new_user.id,
                location_id=loc_id.strip(),
                role_on_farm="owner"
            )
            db.add(assignment)
        db.commit()
        db.refresh(new_user)

    token = create_access_token(new_user.id, new_user.username, new_user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=_format_user_response(new_user)
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(require_current_user)):
    """
    Get profile and assigned farms of currently authenticated user.
    """
    return _format_user_response(current_user)

@router.post("/logout")
def logout(current_user: User = Depends(require_current_user)):
    """
    Acknowledge client logout.
    """
    return {"status": "success", "message": f"User {current_user.username} logged out"}

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.user import User, UserFarmAssignment
from backend.app.models.location import Location
from backend.app.schemas.user import (
    UserResponse, 
    UserCreate, 
    UserUpdate, 
    FarmAssignmentRequest,
    UserFarmAssignmentResponse
)
from backend.app.services.auth import (
    require_admin_user, 
    require_current_user, 
    hash_password
)

router = APIRouter(prefix="/users", tags=["User Management & Farm Assignments"])

def _format_user(u: User) -> UserResponse:
    assigned_farms = [a.location_id for a in u.farm_assignments] if u.farm_assignments else []
    return UserResponse(
        id=u.id,
        username=u.username,
        email=u.email,
        full_name=u.full_name,
        role=u.role,
        is_active=u.is_active,
        created_at=u.created_at,
        assigned_farms=assigned_farms
    )

@router.get("", response_model=List[UserResponse])
def list_all_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_user)
):
    """
    List all registered users with their roles and assigned farms (Admin only).
    """
    users = db.query(User).order_by(User.id.asc()).all()
    return [_format_user(u) for u in users]

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    request: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_user)
):
    """
    Create a new user with specific role and assigned farms (Admin only).
    """
    clean_username = request.username.strip().lower()
    clean_email = request.email.strip().lower()

    if db.query(User).filter(User.username == clean_username).first():
        raise HTTPException(status_code=400, detail=f"Username '{clean_username}' already exists.")

    if db.query(User).filter(User.email == clean_email).first():
        raise HTTPException(status_code=400, detail=f"Email '{clean_email}' already registered.")

    hashed_pw, salt = hash_password(request.password)

    new_user = User(
        username=clean_username,
        email=clean_email,
        hashed_password=hashed_pw,
        salt=salt,
        full_name=request.full_name or clean_username.title(),
        role=request.role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

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

    return _format_user(new_user)

@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user)
):
    """
    Get details of a user by ID. Regular users can only query themselves; Admins can query any user.
    """
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return _format_user(user)

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    request: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_user)
):
    """
    Update a user profile, password, role, active status, and farm assignments (Admin only).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if request.email:
        clean_email = request.email.strip().lower()
        conflict = db.query(User).filter(User.email == clean_email, User.id != user_id).first()
        if conflict:
            raise HTTPException(status_code=400, detail=f"Email '{clean_email}' already in use.")
        user.email = clean_email

    if request.full_name is not None:
        user.full_name = request.full_name

    if request.role:
        user.role = request.role

    if request.is_active is not None:
        user.is_active = request.is_active

    if request.password:
        hashed_pw, salt = hash_password(request.password)
        user.hashed_password = hashed_pw
        user.salt = salt

    # Replace farm assignments if provided
    if request.assigned_farms is not None:
        db.query(UserFarmAssignment).filter(UserFarmAssignment.user_id == user_id).delete()
        for loc_id in request.assigned_farms:
            assignment = UserFarmAssignment(
                user_id=user_id,
                location_id=loc_id.strip(),
                role_on_farm="owner"
            )
            db.add(assignment)

    db.commit()
    db.refresh(user)
    return _format_user(user)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_user)
):
    """
    Delete a user account (Admin only). An admin cannot delete themselves.
    """
    if admin.id == user_id:
        raise HTTPException(status_code=400, detail="Administrators cannot delete their own account.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return None

@router.get("/{user_id}/farms", response_model=List[str])
def get_user_assigned_farms(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user)
):
    """
    Get list of location IDs assigned to a user.
    """
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    assignments = db.query(UserFarmAssignment).filter(UserFarmAssignment.user_id == user_id).all()
    return [a.location_id for a in assignments]

@router.post("/{user_id}/farms", response_model=UserResponse)
def assign_farms_to_user(
    user_id: int,
    request: FarmAssignmentRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_user)
):
    """
    Assign one or more farms to a user (Admin only).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for loc_id in request.location_ids:
        clean_loc = loc_id.strip()
        # Check if already assigned
        existing = db.query(UserFarmAssignment).filter(
            UserFarmAssignment.user_id == user_id,
            UserFarmAssignment.location_id == clean_loc
        ).first()
        if not existing:
            assignment = UserFarmAssignment(
                user_id=user_id,
                location_id=clean_loc,
                role_on_farm=request.role_on_farm or "owner"
            )
            db.add(assignment)

    db.commit()
    db.refresh(user)
    return _format_user(user)

@router.delete("/{user_id}/farms/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def unassign_farm_from_user(
    user_id: int,
    location_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_user)
):
    """
    Unassign a specific farm from a user (Admin only).
    """
    assignment = db.query(UserFarmAssignment).filter(
        UserFarmAssignment.user_id == user_id,
        UserFarmAssignment.location_id == location_id.strip()
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    db.delete(assignment)
    db.commit()
    return None

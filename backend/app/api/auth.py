from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.security import verify_password, create_access_token
from app.core.config import settings
from app.models.user import User, Role
from app.schemas.auth import LoginRequest, Token, UserResponse
from app.services.audit_service import audit_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    # Search by email or username
    user = db.query(User).filter(
        (User.email == login_data.username_or_email) | (User.username == login_data.username_or_email)
    ).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        audit_service.log(
            db=db,
            action="USER_LOGIN_FAILED",
            username=login_data.username_or_email,
            status="FAILURE",
            details={"reason": "Invalid credentials"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account")

    role_name = user.role.name if user.role else "supervisor"
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id,
        role=role_name,
        expires_delta=access_token_expires
    )

    audit_service.log(
        db=db,
        action="USER_LOGIN_SUCCESS",
        user_id=user.id,
        username=user.username,
        resource_type="USER",
        resource_id=str(user.id),
        status="SUCCESS",
        details={"role": role_name}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role_name,
        "username": user.username,
        "user_id": user.id,
        "assigned_mine_id": user.assigned_mine_id
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

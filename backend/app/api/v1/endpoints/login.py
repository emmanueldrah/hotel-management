from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.user import User
from app.schemas.user import Token, ForgotPassword, ResetPassword

router = APIRouter()

@router.post("/login/access-token", response_model=Token)
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "refresh_token": security.create_access_token(
            user.id, expires_delta=timedelta(days=30)
        ),
        "token_type": "bearer",
    }

@router.post("/password-recovery/{email}", response_model=Any)
def recover_password(email: str, db: Session = Depends(deps.get_db)) -> Any:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # In real world, send email with token
    return {"message": "Password recovery email sent (mock)"}

@router.post("/reset-password/", response_model=Any)
def reset_password(reset: ResetPassword, db: Session = Depends(deps.get_db)) -> Any:
    # In real world, verify token
    user = db.query(User).filter(User.email == "admin@hotel.com").first() # Mock
    user.hashed_password = security.get_password_hash(reset.new_password)
    db.add(user)
    db.commit()
    return {"message": "Password updated successfully"}

"""
Operator Authentication and JWT Session Management
Uses Argon2id for secure password hashing and role-based JWT bearer authentication.
"""

from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import jwt

from backend.app.config import settings
from backend.app.database.session import get_db
from backend.app.models.models import User
import secrets
from backend.app.schemas.schemas import (
    UserLoginRequest, TokenResponse, UserResponse,
    ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest, GenericMessageResponse
)
from backend.app.core.audit_manager import audit_manager

router = APIRouter(prefix="/auth", tags=["Operator Authentication"])
security_bearer = HTTPBearer(auto_error=False)
ph = PasswordHasher()

# Single-use, time-limited reset tokens in memory: token -> {username, expires_at, used}
_password_reset_tokens = {}

def hash_password(password: str) -> str:
    return ph.hash(password)

def verify_password(hash_str: str, password: str) -> bool:
    try:
        return ph.verify(hash_str, password)
    except VerifyMismatchError:
        return False
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer), db: Session = Depends(get_db)) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found")
    return user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")
    return current_user

def seed_default_users(db: Session):
    """Seeds default hospital roles if they do not exist."""
    hospital_users = [
        {
            "username": "admin",
            "full_name": "Dr. Sarah Jenkins",
            "email": "admin@hospital.org",
            "role": "ADMIN",
            "password": settings.ADMIN_DEFAULT_PASSWORD
        },
        {
            "username": "it_admin",
            "full_name": "Marcus Vance",
            "email": "it.admin@hospital.org",
            "role": "IT_ADMIN",
            "password": "SecureMedIT2026!"
        },
        {
            "username": "analyst",
            "full_name": "Alex Chen",
            "email": "cyber.analyst@hospital.org",
            "role": "SECURITY_ANALYST",
            "password": settings.ANALYST_DEFAULT_PASSWORD
        },
        {
            "username": "operator",
            "full_name": "David Miller",
            "email": "operator@hospital.org",
            "role": "OPERATOR",
            "password": "SecureMedOps2026!"
        }
    ]

    for u in hospital_users:
        existing = db.query(User).filter(User.username == u["username"]).first()
        if not existing:
            new_u = User(
                username=u["username"],
                full_name=u["full_name"],
                email=u["email"],
                password_hash=hash_password(u["password"]),
                role=u["role"],
                hospital_name="St. Jude Memorial Hospital",
                password_updated_at=datetime.now(timezone.utc)
            )
            db.add(new_u)
        else:
            # Backfill profile metadata if missing
            if not existing.email:
                existing.email = u["email"]
            if not existing.full_name:
                existing.full_name = u["full_name"]
            if not existing.hospital_name:
                existing.hospital_name = "St. Jude Memorial Hospital"
    db.commit()

@router.post("/login", response_model=TokenResponse)
def login(request: UserLoginRequest, db: Session = Depends(get_db)):
    req_id = request.username.strip()
    user = db.query(User).filter((User.username == req_id) | (User.email == req_id)).first()
    if not user or not verify_password(user.password_hash, request.password):
        audit_manager.log_event(
            db, 
            event_type="OPERATOR_LOGIN_FAILED", 
            actor=req_id, 
            event_data={"reason": "Invalid credentials"}
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid hospital email/username or password")

    user.last_login = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token(data={"sub": user.username, "role": user.role})
    audit_manager.log_event(
        db, 
        event_type="OPERATOR_LOGIN_SUCCESS", 
        actor=user.username, 
        event_data={"role": user.role, "hospital": user.hospital_name}
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        username=user.username
    )

@router.get("/me", response_model=UserResponse)
def get_current_operator(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/change-password", response_model=GenericMessageResponse)
def change_password(
    request: ChangePasswordRequest, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(current_user.password_hash, request.current_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password verification failed")
    
    if len(request.new_password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be at least 8 characters")

    current_user.password_hash = hash_password(request.new_password)
    current_user.password_updated_at = datetime.now(timezone.utc)
    db.commit()

    audit_manager.log_event(
        db,
        event_type="PASSWORD_CHANGED",
        actor=current_user.username,
        event_data={"hospital": current_user.hospital_name}
    )
    return GenericMessageResponse(message="Password successfully changed and secured with Argon2id.")

@router.post("/forgot-password", response_model=GenericMessageResponse)
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    identifier = request.identifier.strip()
    user = db.query(User).filter((User.username == identifier) | (User.email == identifier)).first()
    
    reset_token = None
    if user:
        reset_token = secrets.token_urlsafe(32)
        _password_reset_tokens[reset_token] = {
            "username": user.username,
            "expires_at": datetime.now(timezone.utc) + timedelta(minutes=15),
            "used": False
        }
        audit_manager.log_event(
            db,
            event_type="PASSWORD_RESET_REQUESTED",
            actor=user.username,
            event_data={"identifier": identifier}
        )

    # Generic response to prevent user enumeration
    return GenericMessageResponse(
        message="If an account with that email or username exists, password recovery instructions and a secure reset token have been generated.",
        reset_token=reset_token
    )

@router.post("/reset-password", response_model=GenericMessageResponse)
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_entry = _password_reset_tokens.get(request.token)
    if not token_entry or token_entry["used"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid, used, or expired password reset token")

    if datetime.now(timezone.utc) > token_entry["expires_at"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password reset token has expired")

    if len(request.new_password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be at least 8 characters")

    user = db.query(User).filter(User.username == token_entry["username"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    user.password_hash = hash_password(request.new_password)
    user.password_updated_at = datetime.now(timezone.utc)
    token_entry["used"] = True
    db.commit()

    audit_manager.log_event(
        db,
        event_type="PASSWORD_RESET_COMPLETED",
        actor=user.username,
        event_data={"status": "SUCCESS"}
    )
    return GenericMessageResponse(message="Password reset successfully completed. You may now log in.")

@router.post("/logout", response_model=GenericMessageResponse)
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    audit_manager.log_event(
        db,
        event_type="OPERATOR_LOGOUT",
        actor=current_user.username,
        event_data={"hospital": current_user.hospital_name}
    )
    return GenericMessageResponse(message="Session successfully terminated.")

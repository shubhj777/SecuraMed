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
from backend.app.schemas.schemas import UserLoginRequest, TokenResponse, UserResponse
from backend.app.core.audit_manager import audit_manager

router = APIRouter(prefix="/auth", tags=["Operator Authentication"])
security_bearer = HTTPBearer(auto_error=False)
ph = PasswordHasher()

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
    """Seeds default admin and security analyst accounts if they do not exist."""
    admin = db.query(User).filter(User.username == settings.ADMIN_DEFAULT_USERNAME).first()
    if not admin:
        admin_user = User(
            username=settings.ADMIN_DEFAULT_USERNAME,
            password_hash=hash_password(settings.ADMIN_DEFAULT_PASSWORD),
            role="ADMIN"
        )
        db.add(admin_user)
        db.commit()

    analyst = db.query(User).filter(User.username == settings.ANALYST_DEFAULT_USERNAME).first()
    if not analyst:
        analyst_user = User(
            username=settings.ANALYST_DEFAULT_USERNAME,
            password_hash=hash_password(settings.ANALYST_DEFAULT_PASSWORD),
            role="SECURITY_ANALYST"
        )
        db.add(analyst_user)
        db.commit()

@router.post("/login", response_model=TokenResponse)
def login(request: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(user.password_hash, request.password):
        audit_manager.log_event(
            db, 
            event_type="OPERATOR_LOGIN_FAILED", 
            actor=request.username, 
            event_data={"reason": "Invalid credentials"}
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    token = create_access_token(data={"sub": user.username, "role": user.role})
    audit_manager.log_event(
        db, 
        event_type="OPERATOR_LOGIN_SUCCESS", 
        actor=user.username, 
        event_data={"role": user.role}
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

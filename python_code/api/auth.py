"""
auth.py — Authentication routes, JWT logic, password hashing,
          and the reusable `require_auth` dependency.

Routes mounted at /api/auth:
  POST /api/auth/signup
  POST /api/auth/login
  POST /api/auth/logout
  GET  /api/auth/me
"""
from __future__ import annotations

import sys
from pathlib import Path

# Ensure sibling modules (database.py) are importable when loaded as api.auth
_API_DIR = Path(__file__).resolve().parent
if str(_API_DIR) not in sys.path:
    sys.path.insert(0, str(_API_DIR))

import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import APIRouter, Cookie, HTTPException, Response, status
from jose import JWTError, jwt
import bcrypt
from pydantic import BaseModel, Field

from database import (
    UserRecord,
    create_user,
    email_exists,
    get_user_by_email,
    get_user_by_id,
    init_db,
)

# Load .env so JWT_SECRET is available when running directly / in tests
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(_REPO_ROOT / ".env", override=False)

# ── Initialise DB on import ────────────────────────────────────────────────
init_db()

# ── Config ─────────────────────────────────────────────────────────────────
_JWT_SECRET: str = os.getenv("JWT_SECRET", "CHANGE_ME_IN_PRODUCTION_USE_ENV_VAR")
_ALGORITHM = "HS256"
_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
_COOKIE_NAME = "mw_access_token"
_IS_PRODUCTION = os.getenv("ENVIRONMENT", "development") == "production"

# ── Password hashing ───────────────────────────────────────────────────────
# Using bcrypt directly — passlib 1.7.4 is incompatible with bcrypt 4+/5+.
# rounds=10 is OWASP minimum: secure and fast enough for good UX.
_BCRYPT_ROUNDS = 10


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ── JWT helpers ────────────────────────────────────────────────────────────

def _create_access_token(user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=_ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "role": role, "exp": expire}
    return jwt.encode(payload, _JWT_SECRET, algorithm=_ALGORITHM)


def _decode_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT. Raises HTTPException on failure."""
    try:
        return jwt.decode(token, _JWT_SECRET, algorithms=[_ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please log in again.",
        )


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=_COOKIE_NAME,
        value=token,
        httponly=True,           # not accessible from JS
        secure=_IS_PRODUCTION,   # HTTPS-only in prod
        samesite="lax",
        max_age=_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )


def _clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(key=_COOKIE_NAME, path="/")


# ── Reusable auth dependency ───────────────────────────────────────────────

def require_auth(mw_access_token: str | None = Cookie(default=None)) -> UserRecord:
    """
    FastAPI dependency — use on any protected endpoint:

        @app.get("/api/orders")
        def orders(user: UserRecord = Depends(require_auth)):
            ...
    """
    if not mw_access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
        )
    payload = _decode_token(mw_access_token)
    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
        )
    user = get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists.",
        )
    return user


def require_admin(mw_access_token: str | None = Cookie(default=None)) -> UserRecord:
    """
    Dependency for admin-only endpoints. Chains require_auth + role check.

        @app.delete("/api/admin/users/{uid}")
        def delete_user(user: UserRecord = Depends(require_admin)):
            ...
    """
    user = require_auth(mw_access_token)
    if user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return user


# ── Input validation helpers ───────────────────────────────────────────────
_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
_MIN_PASSWORD_LEN = 8


def _validate_email(email: str) -> str:
    email = email.strip().lower()
    if not _EMAIL_RE.match(email):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please enter a valid email address.",
        )
    return email


def _validate_password(password: str) -> None:
    if len(password) < _MIN_PASSWORD_LEN:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Password must be at least {_MIN_PASSWORD_LEN} characters long.",
        )
    if not re.search(r"[A-Za-z]", password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must contain at least one letter.",
        )
    if not re.search(r"[0-9]", password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must contain at least one number.",
        )


# ── Pydantic schemas ───────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str
    password: str
    confirm_password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthUserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: str


# ── Router ─────────────────────────────────────────────────────────────────
router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(req: SignupRequest, response: Response) -> dict[str, Any]:
    # — validate inputs
    name = req.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Full name is required.",
        )
    email = _validate_email(req.email)
    _validate_password(req.password)

    if req.password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Passwords do not match.",
        )

    # — check uniqueness
    if email_exists(email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # — create user
    now = datetime.now(timezone.utc).isoformat()
    user = create_user(
        user_id=str(uuid.uuid4()),
        name=name,
        email=email,
        password_hash=hash_password(req.password),
        role="user",
        created_at=now,
        updated_at=now,
    )

    # — issue token
    token = _create_access_token(user["id"], user["role"])
    _set_auth_cookie(response, token)

    return {
        "user": AuthUserResponse(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            role=user["role"],
            created_at=user["created_at"],
        ).model_dump()
    }


@router.post("/login")
def login(req: LoginRequest, response: Response) -> dict[str, Any]:
    email = _validate_email(req.email)

    if not req.password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please enter your password.",
        )

    # — fetch user (same generic error for missing user or wrong password)
    user_with_hash = get_user_by_email(email)
    _INVALID = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password.",
    )

    if user_with_hash is None:
        raise _INVALID

    if not verify_password(req.password, user_with_hash["password_hash"]):
        raise _INVALID

    # — issue token
    token = _create_access_token(user_with_hash["id"], user_with_hash["role"])
    _set_auth_cookie(response, token)

    return {
        "user": AuthUserResponse(
            id=user_with_hash["id"],
            name=user_with_hash["name"],
            email=user_with_hash["email"],
            role=user_with_hash["role"],
            created_at=user_with_hash["created_at"],
        ).model_dump()
    }


@router.post("/logout")
def logout(response: Response) -> dict[str, str]:
    _clear_auth_cookie(response)
    return {"message": "Logged out successfully."}


@router.get("/me")
def me(mw_access_token: str | None = Cookie(default=None)) -> dict[str, Any]:
    """
    Returns the current user without raising 401 for the frontend to check.
    Returns { user: null } when not authenticated.
    """
    if not mw_access_token:
        return {"user": None}

    try:
        payload = _decode_token(mw_access_token)
    except HTTPException:
        return {"user": None}

    user_id: str | None = payload.get("sub")
    if not user_id:
        return {"user": None}

    user = get_user_by_id(user_id)
    if user is None:
        return {"user": None}

    return {
        "user": AuthUserResponse(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            role=user["role"],
            created_at=user["created_at"],
        ).model_dump()
    }

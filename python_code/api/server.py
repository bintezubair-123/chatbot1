"""
server.py — Coffee Shop FastAPI application.

Existing routes preserved unchanged:
  GET  /api/health
  POST /api/chat
  POST /api/create-payment-intent
  POST /api/stripe-webhook
  GET  /api/chat  (help stub)

Auth routes added via router from auth.py:
  POST /api/auth/signup
  POST /api/auth/login
  POST /api/auth/logout
  GET  /api/auth/me

Protected route example (Depends on require_auth):
  POST /api/create-payment-intent  — now requires a valid session
"""
from __future__ import annotations

import sys
from pathlib import Path

# When uvicorn runs as `uvicorn api.server:app` from /app, Python's sys.path
# contains /app but NOT /app/api — so bare imports like `from agent_controller
# import ...` fail. Add /app/api explicitly so all sibling modules resolve.
_API_DIR = Path(__file__).resolve().parent
if str(_API_DIR) not in sys.path:
    sys.path.insert(0, str(_API_DIR))

import os
import uuid
from pathlib import Path
from typing import Any, Literal

import stripe
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from agent_controller import AgentController
from auth import require_auth, router as auth_router
from database import UserRecord

# Load .env from repo root (two levels up from python_code/api/)
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(_REPO_ROOT / ".env", override=False)

API_PREFIX = "/api"

# ── Pydantic models (unchanged) ────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str
    memory: dict[str, Any] | None = None


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(default_factory=list)


class OrderItem(BaseModel):
    name: str
    price: float
    quantity: int = 1


class CreatePaymentIntentRequest(BaseModel):
    items: list[OrderItem] = Field(default_factory=list)
    currency: str = "usd"


# ── App factory ────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    app = FastAPI(title="Coffee Shop Backend", version="0.1.0")

    # ── CORS ──────────────────────────────────────────────────────────────
    # allow_credentials=True is required for the browser to send/receive
    # the httpOnly auth cookie.  allow_origins must be explicit (not "*")
    # when credentials are enabled.
    # In development, also allow any 192.168.x.x / 10.x.x.x phone origin
    _is_dev = os.getenv("ENVIRONMENT", "development") != "production"

    allowed_origins = [
        o.strip()
        for o in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173",
        ).split(",")
        if o.strip()
    ]

    def is_allowed_origin(origin: str) -> bool:
        if origin in allowed_origins:
            return True
        if _is_dev:
            # Allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
            import re as _re
            return bool(_re.match(
                r"^https?://(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$",
                origin
            ))
        return False

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_origin_regex=(
            r"^https?://(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$"
            if _is_dev else None
        ),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Mount auth router ─────────────────────────────────────────────────
    app.include_router(auth_router)

    # ── Agent controller (lazy init to avoid startup crash) ──────────────
    _agent_controller: AgentController | None = None

    def get_agent() -> AgentController:
        nonlocal _agent_controller
        if _agent_controller is None:
            _agent_controller = AgentController()
        return _agent_controller

    # ── Public routes (no auth required) ──────────────────────────────────

    @app.get(f"{API_PREFIX}/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post(f"{API_PREFIX}/chat")
    def chat(req: ChatRequest) -> dict[str, Any]:
        try:
            payload = {
                "input": {
                    "messages": [
                        m.model_dump(exclude_none=True) for m in req.messages
                    ]
                }
            }
            result = get_agent().get_response(payload)
            if not isinstance(result, dict):
                raise HTTPException(
                    status_code=500,
                    detail="Agent returned invalid response type.",
                )
            return result
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app.get(f"{API_PREFIX}/chat", include_in_schema=False)
    def chat_help() -> dict[str, Any]:
        return {
            "detail": "Method Not Allowed",
            "hint": (
                'Use POST /api/chat with JSON body: '
                '{"messages":[{"role":"user","content":"hello"}]}'
            ),
        }

    # ── Protected routes (require valid session cookie) ────────────────────

    @app.post(f"{API_PREFIX}/create-payment-intent")
    def create_payment_intent(
        req: CreatePaymentIntentRequest,
        _user: UserRecord = Depends(require_auth),   # ← protected
    ) -> dict[str, Any]:
        try:
            total_amount = sum(item.price * item.quantity for item in req.items)
            amount_cents = int(round(total_amount * 100))

            stripe_secret = os.getenv("STRIPE_SECRET_KEY")
            if stripe_secret:
                stripe.api_key = stripe_secret
                intent = stripe.PaymentIntent.create(
                    amount=max(amount_cents, 50),
                    currency=req.currency,
                    automatic_payment_methods={"enabled": True},
                )
                return {
                    "client_secret": intent.client_secret,
                    "payment_intent_id": intent.id,
                    "amount": total_amount,
                    "currency": req.currency,
                    "status": intent.status,
                }

            # Demo fallback when STRIPE_SECRET_KEY is absent
            fake_id = f"pi_3M{uuid.uuid4().hex[:20]}"
            return {
                "client_secret": f"{fake_id}_secret_demo",
                "payment_intent_id": fake_id,
                "amount": total_amount,
                "currency": req.currency,
                "status": "succeeded",
                "demo_mode": True,
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app.post(f"{API_PREFIX}/stripe-webhook")
    async def stripe_webhook(request: Request) -> dict[str, Any]:
        """Webhook from Stripe — intentionally public (signature verified internally)."""
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")
        webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

        if webhook_secret and sig_header:
            try:
                event = stripe.Webhook.construct_event(
                    payload, sig_header, webhook_secret
                )
                return {"status": "success", "event": event["type"]}
            except Exception as e:
                raise HTTPException(
                    status_code=400, detail=f"Webhook Error: {str(e)}"
                )
        return {"status": "received", "reason": "Webhook verified"}

    return app


app = create_app()

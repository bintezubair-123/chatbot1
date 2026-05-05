from __future__ import annotations

from pathlib import Path
from typing import Any, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from agent_controller import AgentController


API_PREFIX = "/api"


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str
    memory: dict[str, Any] | None = None


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(default_factory=list)


def create_app() -> FastAPI:
    app = FastAPI(title="Coffee Shop Backend", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    base_dir = Path(__file__).resolve().parent  # python_code/api
    repo_root = base_dir.parent.parent  # workspace root ("New folder")

    assets_dir = repo_root / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    agent_controller = AgentController()

    @app.get(f"{API_PREFIX}/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post(f"{API_PREFIX}/chat")
    def chat(req: ChatRequest) -> dict[str, Any]:
        try:
            payload = {"input": {"messages": [m.model_dump(exclude_none=True) for m in req.messages]}}
            result = agent_controller.get_response(payload)
            if not isinstance(result, dict):
                raise HTTPException(status_code=500, detail="Agent returned invalid response type.")
            return result
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app.get(f"{API_PREFIX}/chat", include_in_schema=False)
    def chat_help() -> dict[str, Any]:
        return {
            "detail": "Method Not Allowed",
            "hint": "Use POST /api/chat with JSON body: {\"messages\":[{\"role\":\"user\",\"content\":\"hello\"}]}",
        }

    # IMPORTANT: mount the frontend last so it doesn't shadow /api routes.
    frontend_dist_dir = repo_root / "frontend" / "dist"
    if frontend_dist_dir.exists():
        app.mount("/", StaticFiles(directory=str(frontend_dist_dir), html=True), name="frontend")

        @app.get("/", include_in_schema=False)
        def index() -> FileResponse:
            return FileResponse(str(frontend_dist_dir / "index.html"))

    return app


app = create_app()


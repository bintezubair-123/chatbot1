from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq

# Try loading .env from api/, python_code/, or repo root
_current_file = Path(__file__).resolve()
for _env_path in [
    _current_file.parent / ".env",
    _current_file.parent.parent / ".env",
    _current_file.parent.parent.parent / ".env",
]:
    if _env_path.is_file():
        load_dotenv(dotenv_path=_env_path, override=False)
load_dotenv(override=False)

DEFAULT_MODEL = "openai/gpt-oss-20b"


def _get_groq_client() -> Groq:
    key = os.getenv("GROQ_API_KEY", "").strip()
    if not key:
        raise RuntimeError(
            "GROQ_API_KEY is not set. "
            "Add it in Railway → your service → Variables."
        )
    return Groq(api_key=key)


# Cached client — created once per process
_groq_client: Groq | None = None


def get_llm_response(
    prompt: str,
    system_prompt: str | None = None,
    temperature: float = 0,
    max_tokens: int = 2000,
) -> str:
    global _groq_client
    if _groq_client is None:
        _groq_client = _get_groq_client()

    messages: list[dict] = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    model = os.getenv("GROQ_MODEL", DEFAULT_MODEL).strip()

    response = _groq_client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content or ""

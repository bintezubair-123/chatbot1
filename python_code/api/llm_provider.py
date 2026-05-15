from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq


_default_env_path = Path(__file__).resolve().parent.parent / ".env"  # python_code/.env
load_dotenv(dotenv_path=_default_env_path, override=False)
load_dotenv(override=False)

# Groq deprecated `llama3-8b-8192`; use a current default.
DEFAULT_MODEL = "llama-3.1-8b-instant"


@lru_cache(maxsize=1)
def _get_provider() -> tuple[str, object]:
    """
    Returns (provider_name, client).

    Priority:
    - Groq: GROQ_API_KEY (+ optional GROQ_MODEL)
    - Runpod (OpenAI-compatible): RUNPOD_API_KEY + RUNPOD_CHATBOT_URI (+ MODEL_NAME)
    """
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        return ("groq", Groq(api_key=groq_key))

    runpod_key = os.getenv("RUNPOD_API_KEY")
    runpod_base_url = os.getenv("RUNPOD_CHATBOT_URI")
    if runpod_key and runpod_base_url:
        return ("runpod", OpenAI(api_key=runpod_key, base_url=runpod_base_url.strip().strip('"').strip()))

    raise RuntimeError(
        "No LLM credentials found. Set GROQ_API_KEY, or set RUNPOD_API_KEY + RUNPOD_CHATBOT_URI."
    )


def get_llm_response(
    prompt: str,
    system_prompt: str | None = None,
    temperature: float = 0,
    max_tokens: int = 2000,
) -> str:
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    provider, client = _get_provider()

    if provider == "groq":
        response = client.chat.completions.create(  # type: ignore[union-attr]
            model=os.getenv("GROQ_MODEL", DEFAULT_MODEL),
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""

    # runpod (OpenAI-compatible)
    response = client.chat.completions.create(  # type: ignore[union-attr]
        model=os.getenv("MODEL_NAME", DEFAULT_MODEL),
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content or ""

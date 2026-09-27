# ── Merry's Way — FastAPI Backend ─────────────────────────────────────────
# Build context: python_code/
# Railway injects $PORT at runtime; default 8080 for local docker run.

FROM python:3.11-slim

# System deps needed to compile bcrypt / cryptography wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libffi-dev \
        libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (layer-cached unless requirements change)
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r /app/requirements.txt

# Copy the full python_code/ tree (api/, recommendation_objects/, etc.)
COPY . /app

# Railway exposes $PORT; fall back to 8080 for plain docker run
EXPOSE 8080

# Run from /app so relative imports (agents/, recommendation_objects/) resolve
CMD ["sh", "-c", "uvicorn api.server:app --host 0.0.0.0 --port ${PORT:-8080}"]

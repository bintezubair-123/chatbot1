# Dockerfile for Coffee Shop backend (FastAPI)
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY api/requirements.txt /app/api/requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r /app/api/requirements.txt

# Copy app
COPY api /app/api

# Expose port
EXPOSE 8080

# Default command
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]

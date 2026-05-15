# ---------- FRONTEND BUILD ----------
FROM node:20 AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend ./
RUN npm run build


# ---------- BACKEND ----------
FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY python_code/api/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY python_code/api ./python_code/api

# Copy frontend build files
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose Railway port
EXPOSE 8080

# Start FastAPI
CMD ["uvicorn", "python_code.api.server:app", "--host", "0.0.0.0", "--port", "8080"]
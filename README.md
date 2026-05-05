# Frontend + Backend setup

This repo contains:

- `python_code/`: Python backend (now includes a small web API)
- `frontend/`: Vite frontend (chat UI)
- `assets/`: shared static assets (fonts/images/icons)

## Run in development (recommended)

1) Start the backend:

```bash
cd python_code/api
python -m pip install -r requirements.txt
python -m uvicorn server:app --port 8000 --reload
```

2) Start the frontend (in a second terminal):

```bash
cd frontend
npm install
npm run dev
```

Open the frontend at `http://localhost:5173`.

## Run in production mode (backend serves the frontend)

1) Build the frontend:

```bash
cd frontend
npm install
npm run build
```

2) Run the backend:

```bash
cd python_code/api
python -m pip install -r requirements.txt
python -m uvicorn server:app --port 8000
```

Then open `http://localhost:8000`.

## API

- `GET /api/health`
- `POST /api/chat` body:

```json
{ "messages": [{ "role": "user", "content": "hello" }] }
```


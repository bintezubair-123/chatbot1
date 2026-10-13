Railway deployment (backend only)

1. Push your repository to GitHub.

2. In Railway dashboard:
   - Click "New Project" → "Deploy from GitHub" → connect repo
   - Set the backend service's Root Directory to `/python_code/api` for a Python/Nixpacks deployment.
   - With this root directory, set the build command to `pip install -r requirements.txt` and the start command to `uvicorn server:app --host 0.0.0.0 --port $PORT`.
   - Alternatively, use `/python_code` as the root directory to build with `python_code/Dockerfile`.

3. Add environment variables in Railway (Variables): copy values from your `.env` file. Important keys:
   - `RUNPOD_API_KEY`
   - `RUNPOD_CHATBOT_URI`
   - `RUNPOD_EMBEDDING_URL`
   - `MODEL_NAME`
   - `PINECONE_API_KEY`
   - `PINECONE_INDEX_NAME`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`
   - `GROQ_API_KEY`

4. Railway provides the `PORT` environment variable; bind Uvicorn to `0.0.0.0` and use `$PORT` as shown above. Do not hard-code port `8080` for a Nixpacks deployment.

5. Deploy and wait for the build to finish. The service URL will be available in Railway.

Local Docker test:
```bash
# from repo root
docker build -t coffee-backend -f python_code/Dockerfile .
docker run -p 8080:8080 --env-file python_code/.env -it coffee-backend
```

Notes:
- Keep secrets out of Git by using Railway variables or a secret manager.
- If deploying from `/python_code` with Docker, the Dockerfile installs `python_code/requirements.txt` and starts `api.server:app`.

Railway deployment (backend only)

1. Push your repository to GitHub.

2. In Railway dashboard:
   - Click "New Project" → "Deploy from GitHub" → connect repo
   - Select the repository and choose the `python_code` folder (or let Railway detect the Dockerfile)
   - If Railway detects Dockerfile, it will build the image using `python_code/Dockerfile`.

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

4. Set the service port to `8080` and the start command (if prompted):
   `uvicorn server:app --host 0.0.0.0 --port 8080`

5. Deploy and wait for the build to finish. The service URL will be available in Railway.

Local Docker test:
```bash
# from repo root
docker build -t coffee-backend -f python_code/Dockerfile .
docker run -p 8080:8080 --env-file python_code/.env -it coffee-backend
```

Notes:
- Keep secrets out of Git by using Railway variables or a secret manager.
- If you prefer not to use Docker, you can set up a Railway service with a Python runtime and the same start command; ensure `requirements.txt` is installed in the build step.

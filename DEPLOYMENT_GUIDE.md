# Deployment Guide

This document provides instructions for deploying the frontend on Vercel and backend on Railway.

## Prerequisites
- GitHub repository with this code pushed
- Vercel account (https://vercel.com)
- Railway account (https://railway.app)

## Backend Deployment (Railway)

### Steps:
1. Go to [Railway](https://railway.app) and create a project from your GitHub repository.
2. In the backend service settings, configure:
   - **Name**: `coffee-shop-backend` (or your preferred name)
   - **Root Directory**: `/python_code/api`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`

   These paths are relative to the service root directory. Since the root is `python_code/api`, do not prefix `requirements.txt` or `server` with `api/`.

3. **Add Environment Variables** in Railway (from your `.env` file):
   - `RUNPOD_API_KEY`
   - `RUNPOD_CHATBOT_URI`
   - `RUNPOD_EMBEDDING_URL`
   - `MODEL_NAME`
   - `PINECONE_API_KEY`
   - `PINECONE_INDEX_NAME`
   - `FIREBASE_TYPE`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_CLIENT_ID`
   - `FIREBASE_AUTH_URI`
   - `FIREBASE_TOKEN_URI`
   - `FIREBASE_AUTH_PROVIDER_X509_CERT_URL`
   - `FIREBASE_CLIENT_X509_CERT_URL`
   - `FIREBASE_UNIVERSE_DOMAIN`
   - `CLOUD_TYPE`
   - `CLOUD_PROJECT_ID`
   - `CLOUD_PRIVATE_KEY_ID`
   - `CLOUD_PRIVATE_KEY`
   - `CLOUD_CLIENT_EMAIL`
   - `CLOUD_CLIENT_ID`
   - `CLOUD_AUTH_URI`
   - `CLOUD_TOKEN_URI`
   - `CLOUD_AUTH_PROVIDER_X509_CERT_URL`
   - `CLOUD_CLIENT_X509_CERT_URL`
   - `CLOUD_UNIVERSE_DOMAIN`
   - `GROQ_API_KEY`

4. Deploy the service and copy its public URL from Railway.

## Frontend Deployment (Vercel)

### Steps:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `dist` (should auto-detect)

5. **Add Environment Variables**:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-backend.up.railway.app` (the URL from your Railway deployment)

6. Click "Deploy"
7. Wait for deployment (~2-3 minutes)

## After Deployment

Your app will be live at:
- **Frontend**: `https://your-project.vercel.app`
- **Backend**: Your Railway service URL (or custom domain)

Frontend will automatically communicate with the backend using the `VITE_API_URL` environment variable.

## Development

For local development:
```bash
# Terminal 1 - Backend
cd python_code/api
python -m pip install -r requirements.txt
python -m uvicorn server:app --port 8000 --reload

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Frontend will be at `http://localhost:5173` and will proxy API calls to `http://localhost:8000`.

## Troubleshooting

- **CORS errors**: Ensure backend CORS middleware allows your Vercel domain
- **API calls failing**: Verify `VITE_API_URL` is set correctly in Vercel
- **Backend build fails with a missing requirements file**: Check Railway's Root Directory. With `/python_code/api`, use `pip install -r requirements.txt`; with the repository root, use `pip install -r python_code/api/requirements.txt`.

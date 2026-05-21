# Deployment Guide

This document provides instructions for deploying the frontend on Vercel and backend on Render.

## Prerequisites
- GitHub repository with this code pushed
- Vercel account (https://vercel.com)
- Render account (https://render.com)

## Backend Deployment (Render)

### Steps:
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `coffee-shop-backend` (or your preferred name)
   - **Root Directory**: `python_code`
   - **Build Command**: `pip install -r api/requirements.txt`
   - **Start Command**: `cd api && uvicorn server:app --host 0.0.0.0 --port 8080`
   - **Instance Type**: Free or Starter (depending on needs)

5. **Add Environment Variables** (from your `.env` file):
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

6. Click "Create Web Service"
7. Wait for deployment (~5-10 minutes)
8. **Copy the assigned URL** (e.g., `https://coffee-shop-backend.onrender.com`)

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
   - **Value**: `https://coffee-shop-backend.onrender.com` (the URL from your Render deployment)

6. Click "Deploy"
7. Wait for deployment (~2-3 minutes)

## After Deployment

Your app will be live at:
- **Frontend**: `https://your-project.vercel.app`
- **Backend**: `https://your-project.onrender.com` (or custom domain)

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
- **Build fails**: Check that `render.yaml` paths are correct relative to repository root

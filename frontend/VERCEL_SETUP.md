# Vercel Frontend Setup

## Update the Railway backend URL

If your Railway service URL changes, update the `destination` in `vercel.json`:

```json
"destination": "https://YOUR-SERVICE.up.railway.app/api/$1"
```

You can find the URL in Railway → your service → Settings → Networking → Public URL.

## Required Vercel Environment Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `VITE_API_URL` | *(leave empty — rewrites handle /api/ routing)* |

## Deploy

```bash
vercel --prod
```

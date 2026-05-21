// frontend/src/api.ts (example)
const API_URL = import.meta.env.VITE_API_URL;

await fetch(`${API_URL}/api/health`);
await fetch(`${API_URL}/api/chat`, { ... });
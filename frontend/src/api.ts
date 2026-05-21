const API_URL = import.meta.env.VITE_API_URL;

export async function checkHealth() {
  const response = await fetch(`${API_URL}/api/health`);
  return response.json();
}

export async function sendChat(messages: unknown[]) {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  return response.json();
}
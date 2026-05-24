// In production on Vercel, VITE_API_URL must point to the Railway backend.
// We hardcode the fallback so the site works even if the env var is missing.
const base = import.meta.env.PROD ? "" : (import.meta.env.VITE_API_URL || "");

export const apiUrl = (path: string) => `${base}${path}`;

export async function apiFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem("auth_token");
  const headers: HeadersInit = {
    ...options?.headers,
  };
  
  // Set default JSON content type if sending a JSON string body
  if (options?.body && typeof options.body === 'string' && !('Content-Type' in headers)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(apiUrl(path), {
    ...options,
    headers,
  });
  
  // Try to parse JSON response if there is content
  let data;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    data = {};
  }

  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

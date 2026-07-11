// Backend runs as a Vercel serverless function at /api/* on the same origin.
// VITE_API_URL should stay unset in production so requests are same-origin;
// only set it for local dev against a separate backend host.
const base =
  (import.meta.env.VITE_API_URL as string | undefined) || "";

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

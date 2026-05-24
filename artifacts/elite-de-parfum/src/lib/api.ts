// In production on Vercel, requests to /api are proxied via vercel.json rewrites.
// This prevents cross-site third-party cookie blocking issues.
const base = import.meta.env.PROD ? "" : (import.meta.env.VITE_API_URL || "");

export const apiUrl = (path: string) => `${base}${path}`;

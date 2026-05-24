// In production on Vercel, VITE_API_URL must point to the Railway backend.
// We hardcode the fallback so the site works even if the env var is missing.
const base =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env.PROD ? "https://elitedaparfum.up.railway.app" : "");

export const apiUrl = (path: string) => `${base}${path}`;

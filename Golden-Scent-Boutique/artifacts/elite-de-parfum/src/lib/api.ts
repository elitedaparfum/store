const base = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

export const apiUrl = (path: string) => `${base}${path}`;

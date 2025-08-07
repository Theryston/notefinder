import { BACKEND_URL } from "@/lib/config";

export async function apiGet(path: string, init?: RequestInit) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    // Ensure server fetch is cached strategically; pages will opt to revalidate
    headers: {
      ...(init?.headers || {}),
    },
    // Next.js will determine cache based on where used; we can override per call
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPost(path: string, body: any, init?: RequestInit) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

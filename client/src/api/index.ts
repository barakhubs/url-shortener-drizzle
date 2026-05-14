const BASE = "/api";

export interface ShortenResponse {
  shortUrl: string;
  shortCode: string;
  originalUrl: string;
  createdAt: string;
}

export interface StatsResponse {
  shortCode: string;
  originalUrl: string;
  clickCount: number;
  createdAt: string;
  expiresAt: string | null;
  topReferrers: Array<{ referrer: string | null; count: number }>;
  clicksPerDay: Array<{ date: string; count: number }>;
}

export interface ApiError {
  error: string;
}

// Generic fetch wrapper — normalises errors to { error: string }
async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new Error("Could not reach the server. Is it running?");
  }

  // Guard against empty bodies (e.g. 204, proxy errors, network failures)
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Unexpected server response (${response.status})`);
    }
  }

  if (!response.ok) {
    const message =
      (data as ApiError | null)?.error ?? `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}

export async function shortenUrl(url: string): Promise<ShortenResponse> {
  return apiFetch<ShortenResponse>(`${BASE}/shorten`, {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

export async function getStats(code: string): Promise<StatsResponse> {
  return apiFetch<StatsResponse>(`${BASE}/stats/${encodeURIComponent(code)}`);
}

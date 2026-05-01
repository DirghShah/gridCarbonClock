/**
 * Shared fetch wrapper for ERCOT public dashboard JSON endpoints.
 * - Sets a desktop UA (some ERCOT endpoints 403 unknown clients).
 * - Retries once on transient failure.
 * - Caller decides what to do on persistent failure.
 */
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

export async function ercotFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = {
    "User-Agent": UA,
    Accept: "application/json, text/csv;q=0.9, */*;q=0.5",
    ...(init?.headers ?? {}),
  };
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        headers,
        // Edge runtime caching is fine for short windows
        next: { revalidate: 60 },
      });
      if (res.ok) return res;
      if (res.status >= 500) {
        lastErr = new Error(`ERCOT ${res.status}`);
      } else {
        return res; // 4xx — don't retry
      }
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
  }
  throw lastErr instanceof Error ? lastErr : new Error("ERCOT fetch failed");
}

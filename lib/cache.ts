type Entry<T> = { value: T; expiresAt: number };

const memory = new Map<string, Entry<unknown>>();

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kvGet<T>(key: string): Promise<T | null> {
  if (!KV_URL || !KV_TOKEN) return null;
  try {
    const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { result: string | null };
    if (!json.result) return null;
    return JSON.parse(json.result) as T;
  } catch {
    return null;
  }
}

async function kvSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  if (!KV_URL || !KV_TOKEN) return;
  try {
    await fetch(`${KV_URL}/set/${encodeURIComponent(key)}?EX=${ttlSeconds}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
  } catch {
    /* ignore */
  }
}

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const memHit = memory.get(key);
  if (memHit && memHit.expiresAt > Date.now()) return memHit.value as T;

  const kvHit = await kvGet<T>(key);
  if (kvHit) {
    memory.set(key, { value: kvHit, expiresAt: Date.now() + ttlSeconds * 1000 });
    return kvHit;
  }

  const value = await loader();
  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  void kvSet(key, value, ttlSeconds);
  return value;
}

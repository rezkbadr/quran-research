declare global {
  interface Window {
    storage?: {
      get: (key: string) => Promise<{ value: string } | null>;
      set: (key: string, value: string) => Promise<void>;
    };
  }
}

const ignore = () => {};

export async function loadJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const r = await window.storage?.get(key);
    if (r?.value) return JSON.parse(r.value) as T;
  } catch { /* fall through */ }
  try {
    const v = window.localStorage?.getItem(key);
    if (v) return JSON.parse(v) as T;
  } catch { /* fall through */ }
  return fallback;
}

export async function saveJSON(key: string, value: unknown): Promise<void> {
  const serialized = JSON.stringify(value);
  await window.storage?.set(key, serialized).catch(ignore);
  try { window.localStorage?.setItem(key, serialized); } catch { /* ignore quota */ }
}

export async function loadString(key: string): Promise<string | null> {
  try {
    const r = await window.storage?.get(key);
    if (r?.value) return r.value;
  } catch { /* fall through */ }
  try { return window.localStorage?.getItem(key) ?? null; } catch { return null; }
}

export async function saveString(key: string, value: string): Promise<void> {
  await window.storage?.set(key, value).catch(ignore);
  try { window.localStorage?.setItem(key, value); } catch { /* ignore quota */ }
}

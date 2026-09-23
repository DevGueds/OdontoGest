/** Bounded, short-lived cache. In-flight loads are shared; invalidated loads cannot repopulate it. */
export class AsyncCache {
  private entries = new Map<string, { expires: number; value: Promise<unknown> }>();
  constructor(private ttlMs = 15_000, private maxEntries = 200) {}
  get<T>(key: string, load: () => Promise<T>): Promise<T> {
    const existing = this.entries.get(key);
    if (existing && existing.expires > Date.now()) return existing.value as Promise<T>;
    this.entries.delete(key);
    if (this.entries.size >= this.maxEntries) this.entries.delete(this.entries.keys().next().value!);
    const entry = { expires: Date.now() + this.ttlMs, value: Promise.resolve().then(load) };
    this.entries.set(key, entry);
    entry.value.catch(() => { if (this.entries.get(key) === entry) this.entries.delete(key); });
    return entry.value;
  }
  clear() { this.entries.clear(); }
}
export const dataCache = new AsyncCache();

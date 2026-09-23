export class RequestCache {
  private entries = new Map<string, { expires: number; promise: Promise<unknown>; controller: AbortController }>();
  private generation = 0;
  clear() { this.generation++; for (const entry of this.entries.values()) entry.controller.abort(); this.entries.clear(); }
  invalidate(paths: string[]) {
    for (const [key, value] of this.entries) if (paths.some(p => key.startsWith(p))) { value.controller.abort(); this.entries.delete(key); }
  }
  async get<T>(key: string, loader: (signal: AbortSignal) => Promise<T>, ttl = 15_000): Promise<T> {
    const cached = this.entries.get(key);
    if (cached && cached.expires > Date.now()) return cached.promise as Promise<T>;
    if (this.entries.size >= 100) this.entries.delete(this.entries.keys().next().value!);
    const generation = this.generation;
    const controller = new AbortController();
    const promise = loader(controller.signal).then(value => {
      if (controller.signal.aborted || generation !== this.generation) throw new DOMException('Consulta cancelada.', 'AbortError');
      return value;
    });
    const entry = { expires: Date.now() + ttl, promise, controller };
    this.entries.set(key, entry);
    promise.catch(() => { if (this.entries.get(key) === entry) this.entries.delete(key); });
    return promise;
  }
}

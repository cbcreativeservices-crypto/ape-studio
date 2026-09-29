/**
 * ByteLru — a least-recently-used cache bounded by BYTES and by COUNT (owner
 * 2026-09-29: "save each clip … if it isn't too heavy on memory"). Used for
 * the Tuning lab's rendered clips and their loaded players.
 *
 * Pure and dependency-free (tested in Node). Recency is the Map's insertion
 * order: get() re-inserts, so the first key is always the least recent.
 *
 * `pinned` protects an entry from eviction (the clip that is PLAYING) — the
 * cache may then sit over budget until it is unpinned and the next set()
 * trims it. `onEvict` releases whatever the value holds (a file, a player).
 */
export class ByteLru<V> {
  private map = new Map<string, { v: V; bytes: number }>();
  private total = 0;
  private readonly maxBytes: number;
  private readonly maxCount: number;
  private readonly onEvict: (key: string, v: V) => void;
  private readonly pinned: (key: string, v: V) => boolean;

  // Plain fields, not parameter properties: Node's type-stripping (the test
  // runner) does not support parameter properties.
  constructor(
    maxBytes: number,
    maxCount: number,
    onEvict: (key: string, v: V) => void = () => {},
    pinned: (key: string, v: V) => boolean = () => false,
  ) {
    this.maxBytes = maxBytes;
    this.maxCount = maxCount;
    this.onEvict = onEvict;
    this.pinned = pinned;
  }

  get size(): number {
    return this.map.size;
  }

  get bytes(): number {
    return this.total;
  }

  has(key: string): boolean {
    return this.map.has(key);
  }

  /** The value, marked most-recently used. */
  get(key: string): V | undefined {
    const e = this.map.get(key);
    if (!e) return undefined;
    this.map.delete(key);
    this.map.set(key, e);
    return e.v;
  }

  /** Insert (or replace) as most-recently used, then trim to budget. A
   *  replaced value is evicted (released) unless it is the same object. */
  set(key: string, v: V, bytes: number): void {
    const old = this.map.get(key);
    if (old) {
      this.map.delete(key);
      this.total -= old.bytes;
      if (old.v !== v) this.onEvict(key, old.v);
    }
    this.map.set(key, { v, bytes });
    this.total += bytes;
    this.trim(key);
  }

  delete(key: string): void {
    const e = this.map.get(key);
    if (!e) return;
    this.map.delete(key);
    this.total -= e.bytes;
    this.onEvict(key, e.v);
  }

  /** Evict least-recent, unpinned entries until within both budgets. `keep`
   *  (the entry just inserted) is never the one evicted. */
  trim(keep?: string): void {
    if (this.total <= this.maxBytes && this.map.size <= this.maxCount) return;
    for (const [k, e] of [...this.map]) {
      if (this.total <= this.maxBytes && this.map.size <= this.maxCount) return;
      if (k === keep || this.pinned(k, e.v)) continue;
      this.map.delete(k);
      this.total -= e.bytes;
      this.onEvict(k, e.v);
    }
  }

  /** Release everything. */
  clear(): void {
    const all = [...this.map];
    this.map.clear();
    this.total = 0;
    for (const [k, e] of all) this.onEvict(k, e.v);
  }

  keys(): string[] {
    return [...this.map.keys()];
  }
}

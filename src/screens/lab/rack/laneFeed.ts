/**
 * laneFeed — how the ParamLane hands a dragged value to its lab: AT MOST ONE
 * onChange PER FRAME, always the newest value, and the last one never lost.
 *
 * WHY (owner, Pixel 7 Pro, 2026-10-06, Miking Labs: "many of them their
 * sliders are not working"). The lane used to call the lab's onChange on
 * EVERY touch move. A Miking page answers a move by moving the mic through
 * the collision model and re-rendering the whole page — the scene, its
 * labels, the bezel, the dock. Measured in the web preview (desktop CPU, dev
 * build): 60–350 ms per move on the placement, PART and ITEM faders. A phone
 * runs that JS several times slower, and the touch moves queued behind it,
 * so the cap sat still under the finger and jumped long after the finger had
 * stopped — on the phone the slider read as dead.
 *
 * Now a move only records the newest value and asks for one tick about a
 * frame long (ParamLane: 16 ms); the tick delivers it once. However slow
 * the page, the backlog is one value.
 * The grab (jump to the finger) and the release are delivered at once, so a
 * tap still lands where it touched and the resting value is exactly the
 * last one the finger chose. (The cap itself follows the finger on the UI
 * thread — ParamLane's capV — so it never waits for the page at all.)
 *
 * Pure (no React Native), so it is tested directly.
 */
export type LaneFeed = {
  /** The finger came down: deliver now (jump to the finger). */
  grant: (v: number) => void;
  /** The finger moved: keep the newest, deliver on the next tick. */
  move: (v: number) => void;
  /** The finger lifted / the touch was taken: deliver anything pending now. */
  end: () => void;
  /** The value most recently handed to the lab, or asked for (pending). */
  latest: () => number | null;
};

export function createLaneFeed(opts: {
  deliver: (v: number) => void;
  schedule: (cb: () => void) => unknown;
  cancel: (handle: unknown) => void;
}): LaneFeed {
  let pending: number | null = null;
  let handle: unknown = null;
  let last: number | null = null;
  const flush = () => {
    handle = null;
    if (pending == null) return;
    const v = pending;
    pending = null;
    last = v;
    opts.deliver(v);
  };
  return {
    grant(v) {
      if (handle != null) opts.cancel(handle);
      handle = null;
      pending = null;
      last = v;
      opts.deliver(v);
    },
    move(v) {
      pending = v;
      if (handle == null) handle = opts.schedule(flush);
    },
    end() {
      if (handle != null) opts.cancel(handle);
      flush();
    },
    latest: () => (pending != null ? pending : last),
  };
}

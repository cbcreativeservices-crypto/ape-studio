/**
 * useRafFrameLoop — run `onFrame(now)` on every animation frame while `active`.
 *
 * The responsiveness rule (owner 2026-07-30, see memory
 * feedback_meter_responsiveness): live needle/level meters must NOT be driven
 * through React state. Polling ApeDsp.get*Frame() into state at ~15 Hz
 * re-rendered the whole screen each tick; on heavy screens the re-renders
 * backed up and the meters fell ~1 s behind real time (a "slapback" lag).
 *
 * Instead, drive the meters DIRECTLY: read the native frame (a synchronous JSI
 * call — the analysis thread refreshes it every ~50 ms) inside this loop and
 * push it straight into Reanimated SharedValues, which the Skia meters chase on
 * the UI thread with NO React re-render in the path. Mirror into React state on
 * a throttle (~10 Hz) for TEXT readouts and any frame-data visual only.
 *
 * `onFrame` may be a fresh closure each render (it captures SharedValues / refs);
 * it is read through a ref so the loop never re-subscribes and never tears down
 * mid-run. The loop starts/stops purely on `active`.
 */
import { useEffect, useRef } from 'react';

export function useRafFrameLoop(active: boolean, onFrame: (now: number) => void): void {
  const cb = useRef(onFrame);
  cb.current = onFrame;
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let alive = true;
    const tick = (now: number) => {
      if (!alive) return;
      cb.current(now);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [active]);
}

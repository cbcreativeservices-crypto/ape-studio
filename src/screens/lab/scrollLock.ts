/**
 * scrollLock — the drag-vs-scroll lock context, extracted from LabShell into a
 * leaf module (2026-08-23) so the Rack Unit kit can consume it without an
 * import cycle (LabShell → RackUnit → scrollLock). LabShell re-exports these,
 * so every existing call site keeps importing from './LabShell' unchanged.
 */
import { createContext, useContext } from 'react';

export const ScrollLockCtx = createContext<((locked: boolean) => void) | null>(null);

/** Provider for the scroll-lock control. LabShell supplies it automatically to
 *  its Explore content; NON-LabShell hosts (module screens, the foundations
 *  course/playground, RackUnit's well) wrap their own ScrollView content in
 *  this and pass their `setScrollLocked` so drag primitives inside —
 *  DragSlider, RoomSceneView — lock the scroll during a gesture with NO prop
 *  threading (owner 2026-07-30 systemic drag-vs-scroll fix). */
export const ScrollLockProvider = ScrollLockCtx.Provider;

/** Grab the nearest scroll-lock setter from context (null when there is no
 *  LabShell / ScrollLockProvider above). Drag primitives call this and lock on
 *  gesture start / unlock on release so the object wins over the page. */
export function useScrollLock(): ((locked: boolean) => void) | null {
  return useContext(ScrollLockCtx);
}

/**
 * labPreviewStore — free-user PREVIEW of a members-only Training Lab (owner
 * 2026-08-02). A free user who taps a locked lab opens the REAL lab screen (live
 * readouts / animations / mic), then this store flags a preview so a root
 * overlay renders the grayed, non-interactive scrim + the Academy upgrade sheet
 * on top. Tiny external-store pattern (same as the other app stores); readable
 * synchronously so a navigation listener can clear a stale preview.
 */
import { useEffect, useState } from 'react';

type PreviewState = { active: boolean; route: string; name: string };

let state: PreviewState = { active: false, route: '', name: '' };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** Enter preview for a specific lab route (call right before navigating to it). */
export function startLabPreview(route: string, name: string): void {
  state = { active: true, route, name };
  emit();
}

/** Leave preview (dismiss / navigating away). Idempotent. */
export function endLabPreview(): void {
  if (!state.active) return;
  state = { active: false, route: '', name: '' };
  emit();
}

/** Synchronous read — for the navigation-state listener that clears a stale
 *  preview when the user leaves the previewed lab by any means (e.g. swipe-back). */
export function getLabPreview(): PreviewState {
  return state;
}

/** Live view for the overlay component. */
export function useLabPreview(): PreviewState {
  const [snap, setSnap] = useState(state);
  useEffect(() => {
    const l = () => setSnap(state);
    listeners.add(l);
    l();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snap;
}

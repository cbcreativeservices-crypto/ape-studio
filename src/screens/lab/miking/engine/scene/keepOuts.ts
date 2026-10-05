/**
 * KEEP-OUTS AT REST (clarity pass 2026-10-05, owner: the lab was "too
 * complicated… distraction"). A keep-out — a clearance envelope, a bow's
 * sweep, a drummer's reach, a cymbal's swing — is NOT drawn while nothing
 * moves. The engine shows the model's envelopes itself, softly as a dragged
 * mic comes near and clearly (with the reason) when a move is stopped
 * (PlacementScene: EnvelopeMark).
 *
 * Lesson art that draws its OWN keep-out shapes inside the instrument reads
 * this flag: PlacementScene provides `false` round the instrument, so those
 * shapes stay off the placement drawing (the engine's envelope for the same
 * space appears on approach instead). Elsewhere (plans, setting pages) the
 * default `true` keeps today's drawing.
 *
 * The provider sits INSIDE the Skia Canvas (the canvas has its own
 * reconciler: a context from outside it does not reach the art).
 */
import { createContext, useContext } from 'react';

export const KeepOutsAtRest = createContext<boolean>(true);

/** True where the art should draw its own keep-out shapes. */
export function useKeepOutsAtRest(): boolean {
  return useContext(KeepOutsAtRest);
}

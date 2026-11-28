/**
 * topArtTypes — the contract for a stage object's TOP-VIEW ART on the
 * editor's dark glass (must-do D60; owner 2026-11-12: "create new art for
 * each, do not use simple line drawings").
 *
 * One component per kind. It takes no props and draws the real object as it
 * looks from directly above, CENTERED ON 0,0, in floor units (32 units = 1 m,
 * the scale of cableinstall/scenes/floorArt), FACING THE AUDIENCE: its front
 * is toward +y (down the page), upstage is -y, stage left is +x. The stage
 * turns, scales and places it (stageArt.tsx).
 *
 * The drawing stays inside the kind's print-symbol footprint
 * (`spSymbol(kind).w` by `.h` meters, so within w*16 by h*16 units of the
 * center): selection frames, name placement and touch areas use that box.
 *
 * Types only.
 */
import type { JSX } from 'react';
import type { SpObjectKind } from '../../../../features/stageplot/spTypes';

export type TopArtMap = Partial<Record<SpObjectKind, () => JSX.Element>>;

/** Floor units to the meter (the same as floorArt). */
export const TOP_ART_UNITS = 32;

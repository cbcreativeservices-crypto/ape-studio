/**
 * Tool-tile geometry + the hub's light ladder (Measurement & Analysis hub).
 *
 * THE TILE IS THE SCREEN (owner 2026-09-05). The earlier "Tile Forge"
 * graphite chassis — a machined frame with a nameplate, corner screws and a
 * smaller display nested inside it — is retired. The owner: "the screen is not
 * supposed to be nested inside the larger tile/button. The entire tile/button
 * is the screen. The animated layout and the title are behind the glass —
 * raised and bevelled edge screen." Around it, the true-black recess that used
 * to be the cut-edge is kept, thinned to the gap the old tiles showed at the
 * bottom, all the way round; the glass gets highlights on its four edges and
 * the recess gets a light touch on its outer lip so the darkness reads as a
 * hole in the panel.
 *
 * So a tile is now three RN views (ToolsHubScreen.ToolTile): the recess (black,
 * with a lip ring on the panel), the raised GLASS (bevelled; title band + the
 * animated display + the smoked-glass overlay behind one surface; the only part
 * that sinks on press), and the cavity shadow the lip casts into the recess.
 * No SVG chassis is drawn any more.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LIGHT MODEL (owner 2026-09-05: "redo all lighting highlights … coherent")
 * ─────────────────────────────────────────────────────────────────────────
 * ONE soft key light from DIRECTLY ABOVE, slightly in front of the panel — a
 * large overhead softbox above the camera, the way rack gear is product-
 * photographed — plus a low, even ambient. Nothing else lights this screen.
 *   · catch-lights sit ONLY on up-facing edges (the glass's top bevel, the
 *     recess's bottom lip, the panel's top lip); shadows ONLY on down-facing
 *     ones (the glass's bottom bevel, the recess's top wall, the crevice under
 *     the lip)
 *   · no side bias: left and right edges are equal; reflections are
 *     HORIZONTAL bands centred on the surface, never a diagonal from a corner
 *   · the glass over every display shows the same reflection in the same
 *     place: a soft band across its top, nothing else
 *
 * INTENSITY LADDER (brightest → darkest), shared with ToolsHubScreen through
 * HUB_LIGHT so every container on the hub sits on the same rungs:
 *   1 specular — the softbox reflected in the glass's top bevel
 *   3 lip catch — an up-facing painted/anodised edge (panel, cards, recess lip)
 *   4 diffuse face — a vertical gradient, lighter at the top
 *   5 down-facing edge in shadow (glass bottom bevel, card bottom rim)
 *   6 AO crevice — where the glass meets its recess
 * Device-scale rules (2026-09-01) still bind: nothing thinner than 1px,
 * nothing fainter than ~0.08 alpha, everything static.
 */

/** The hub's shared light ladder (see LIGHT MODEL above). RN colour strings so
 *  the host screen's cards, chip, panel and rows use the exact same rungs. */
export const HUB_LIGHT = {
  /** rung 1 — softbox reflected in a polished up-facing edge */
  specular: 'rgba(255,255,255,0.50)',
  /** rung 1, recessed — the display glass's own top edge under a lip */
  glassEdge: 'rgba(255,255,255,0.22)',
  /** rung 3 — an up-facing painted edge catching the key */
  lip: 'rgba(255,255,255,0.14)',
  /** rung 5 — a down-facing edge in the key's shadow */
  lipShadow: 'rgba(0,0,0,0.45)',
  /** rung 6 — the crevice a lip casts into a recess */
  crevice: 'rgba(0,0,0,0.60)',
} as const;

/** The true-black gap between the glass and the panel, all the way round —
 *  the width the old tiles already showed at the bottom. */
export const TILE_GAP = 4;
/** Title band inside the glass (the title sits BEHIND the glass, above the display). */
export const TILE_TITLE_H = 22;
/** Padding between the glass's edge and the animated display (sides + bottom). */
export const TILE_STRIP_PAD = 4;

/** Geometry of one tile, parametric in its width. The glass fills the tile
 *  minus the recess gap; inside it, the title band then the 2.5:1 display. */
export function tileLayout(w: number) {
  const glassW = w - 2 * TILE_GAP;
  const stripW = glassW - 2 * TILE_STRIP_PAD;
  const stripH = Math.round((stripW / 2.5) * 10) / 10;
  const glassH = Math.round((TILE_TITLE_H + stripH + TILE_STRIP_PAD) * 10) / 10;
  const totalH = Math.round((glassH + 2 * TILE_GAP) * 10) / 10;
  return { gap: TILE_GAP, glassW, glassH, stripW, stripH, totalH };
}

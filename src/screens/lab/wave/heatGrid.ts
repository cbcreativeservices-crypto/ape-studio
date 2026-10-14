/**
 * Wave-lab SPL heat-map grid size (slider audit 2026-10-14).
 *
 * The heat map is rebuilt in JS whenever its inputs change. Riding FREQ /
 * DELAY / AIM / STEER / XOVER / BOXES changes them on every frame, and a full
 * map is ~13–25k cells × every source × its wall images: measured at
 * ≈150 ms (4-source room) to ≈290 ms (8-box line array) PER FRAME in desktop
 * Node — far slower on a phone. The fader felt stuck: the picture trailed the
 * finger by a beat, then jumped.
 *
 * While a parameter is MOVING the map is drawn on a coarse grid
 * (HEAT_COARSE_SCALE of the cells each way ≈ 1/9 of the work); once the
 * inputs have held still for HEAT_SETTLE_MS it is redrawn at full detail.
 * The field maths is unchanged — the coarse map samples the same field at
 * fewer points.
 */
export const HEAT_COARSE_SCALE = 1 / 3;
export const HEAT_SETTLE_MS = 160;

/** ~2.6 px cells at every zoom step, capped (the original rule); coarse = 1/3 each way. */
export function heatGridDims(wPx: number, hPx: number, ts: number, coarse: boolean): { cols: number; rows: number } {
  const zoom = Math.min(2.2, Math.max(1, ts));
  const cols = Math.min(Math.round(176 * zoom), Math.max(64, Math.round(wPx / 2.6)));
  const rows = Math.min(Math.round(140 * zoom), Math.max(48, Math.round(hPx / 2.6)));
  if (!coarse) return { cols, rows };
  return { cols: Math.max(16, Math.round(cols * HEAT_COARSE_SCALE)), rows: Math.max(12, Math.round(rows * HEAT_COARSE_SCALE)) };
}

/**
 * Electron flow (Vacuum Tube Lab › Electron flow): the share of the plate
 * current reached at a WARM-UP setting, pure and worklet-safe so the PLATE I
 * readout and the drawn electrons use ONE number (owner 2026-11-25, audit B8).
 *
 * The drawing used to add +0.25 to the share of electrons it sent across, so
 * just past 70 % PLATE I read 3 % while about 28 % of the electrons were
 * drawn reaching the plate (and 75 % drawn at a 50 % reading). Now the share
 * of drawn electrons crossing to the plate IS the PLATE I share: 0 below 70 %
 * warm-up (the space-charge cloud only), rising to all of them at 100 %.
 */
export function plateCurrentShare(heat01: number): number {
  'worklet';
  return heat01 > 0.7 ? Math.min(1, (heat01 - 0.7) / 0.3) : 0;
}

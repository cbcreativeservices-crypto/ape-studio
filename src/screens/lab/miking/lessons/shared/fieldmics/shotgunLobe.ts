/**
 * FIELD MICS — the short shotgun's SIMPLIFIED banded lobe, for any Lab 6 /
 * Lab 7 drawing (EXPORT NAME other groups import: `shotgunLobe`). The model
 * lives in the engine (engine/physics/shotgun.ts) because the placement
 * scene draws it over a shotgun's base pattern; this re-exports it with a
 * path builder for lesson figures. Words only on screen ("a simplified
 * picture"), never a number (O-2).
 */
import { Skia } from '@shopify/react-native-skia';
import { shotgunLobe, tubeTransitionHz, SHOTGUN_TUBE_MM, HIGH_POWER, C_SOUND, halfWidthDeg } from '../../../engine/physics/shotgun.ts';

export { shotgunLobe, tubeTransitionHz, SHOTGUN_TUBE_MM, HIGH_POWER, C_SOUND, halfWidthDeg };

/** A lobe outline in a view's (u, v), centred on the capsule (cu, cv), the
 *  axis toward `axisDeg` (0° = +u), `radius` mm on axis; band 'low' (the
 *  supercardioid base) or 'high' (the narrower lobe above the upper mids). */
export function shotgunLobePath(cu: number, cv: number, axisDeg: number, radius: number, band: 'low' | 'high') {
  const p = Skia.Path.Make();
  const a0 = (axisDeg * Math.PI) / 180;
  for (let i = 0; i <= 120; i++) {
    const t = (i / 120) * 360;
    const g = shotgunLobe(t, band) * radius;
    const a = a0 + (t * Math.PI) / 180;
    const u = cu + g * Math.cos(a);
    const v = cv + g * Math.sin(a);
    if (i === 0) p.moveTo(u, v);
    else p.lineTo(u, v);
  }
  p.close();
  return p;
}

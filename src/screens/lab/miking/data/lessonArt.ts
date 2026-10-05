/**
 * Lesson ART by id — the presentation layer the engine's scene draws with
 * (charter §2: look kept apart from the model and the geometry).
 */
import type { LessonArt } from '../engine/scene/sceneTypes.ts';
import { KickArt, kickHitTest, kickLabels } from '../lessons/m01Kick/art';
import { CoupledHeads, StrikeSequence } from '../lessons/m01Kick/soundArt';
import { KICK_GEOM } from '../lessons/m01Kick/geometry.ts';
import { cabArt } from '../lessons/spk/art';
import { SPK_PAGES } from '../lessons/spk/pages';
import { TONBAK_ART, TONBAK_PAGES } from '../lessons/m12Tonbak/pages';
import { TABLA_ART, TABLA_PAGES } from '../lessons/m13Tabla/pages';
import { C02_ART } from '../lessons/c02GuitarAmp/art';
import { C08_ART } from '../lessons/c08BassAmp/art';
import { C04_ART } from '../lessons/c04Steel/art';

const ART: Record<string, LessonArt> = {
  M01: {
    Instrument: KickArt,
    labels: kickLabels,
    hitTest: kickHitTest,
    StrikeSequence,
    CoupledHeads,
    plan: { drum: { u0: KICK_GEOM.hoopX.batter[0], u1: KICK_GEOM.hoopX.reso[1], halfW: KICK_GEOM.hoopOut }, pedal: { u0: KICK_GEOM.pedal.x0, u1: KICK_GEOM.pedal.x1, halfW: 45 } },
  },
};
// Each further lesson on its own line (lessons are built in parallel).
ART.SPK = { ...cabArt('1x12'), pages: SPK_PAGES };
ART.M12 = { ...TONBAK_ART, pages: TONBAK_PAGES };
ART.M13 = { ...TABLA_ART, pages: TABLA_PAGES };
// Lab 4, the amplified chain (each lesson on its own line).
ART.C02 = C02_ART;
ART.C08 = C08_ART;
ART.C04 = C04_ART;

export function lessonArt(id: string): LessonArt | undefined {
  return ART[id];
}

/**
 * THE VOICE FAMILY'S STARTING-POINT ROWS as zone specs (voiceZones.ts) —
 * written once, used by every singer: E01 lead vocal, E03 rap, E07 the
 * singer with an instrument, and the later Lab 5 groups. Each row is one
 * researched starting point (voiceSpec.VOICE_ROWS, lead_vocal/SOURCES.md) or
 * a named drawing default; a lesson gives the id, the variant, the mic types
 * and — where its research says more — its own words.
 *
 * Learner words are starting points (owner ruling 2026-10-04); `src`,
 * `quote` and every `prov` are the internal record.
 */
import type { Provenance } from '../../../engine/model/types.ts';
import { VOICE_DIMS, VOICE_ROWS } from './voiceSpec.ts';
import type { VoiceZoneSpec } from './voiceZones.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const R = VOICE_ROWS;
export const ON_AXIS = ill('on the mouth’s axis: within 15° of it (the lab’s drawing)');

/** What a lesson decides about one row. */
export type RowOpts = { id: string; micTypeIds: string[]; variant?: string; variants?: string[]; start?: VoiceZoneSpec['start'] } & Partial<Pick<VoiceZoneSpec, 'label' | 'band' | 'tendency' | 'checks'>>;

const pick = (o: RowOpts) => ({ ...(o.variant ? { variant: o.variant } : {}), ...(o.variants ? { variants: o.variants } : {}), micTypeIds: o.micTypeIds });

/** S-VOC-REC: on axis, 10–20 cm. */
export function closeRow(o: RowOpts): VoiceZoneSpec {
  return {
    id: o.id,
    label: o.label ?? 'In front of the mouth, about 10–20 cm',
    band: o.band ?? 'Try about 10–20 cm (4–8 in) from the lips to the front of the mic, on the mouth’s axis, aimed between the nose and the mouth — a clear, direct place to begin. With a screen at least 10 cm in front of the mic, the mic itself starts about 15 cm out.',
    kind: 'sourced',
    src: R.shure.src,
    quote: R.shure.quote,
    distance: { min: R.shure.min, max: R.shure.max },
    off: { min: 0, max: 15, prov: ON_AXIS },
    aimTol: 15,
    ...pick(o),
    start: o.start ?? { d: [150, 155, 160, 145, 170, 180] },
    tendency: o.tendency ?? 'A clear, direct voice with little of the room. Closer tends to bring more low end (the proximity effect), more breath and more pops; farther, a little more room and a steadier level.',
    checks: o.checks ?? ['The screen clear of the lips and the nose, at least 10 cm from the mic', 'The singer’s quietest line and loudest note at this distance', 'Pops on P and B, and harsh S sounds'],
  };
}

/** N-VOC: on axis, 20–30 cm (8–12 in). */
export function fartherRow(o: RowOpts & { inches?: boolean }): VoiceZoneSpec {
  const d = o.inches ? { min: 203.2, max: 304.8 } : { min: R.neumann.min, max: R.neumann.max };
  return {
    id: o.id,
    label: o.label ?? 'A little farther, about 20–30 cm',
    band: o.band ?? 'Try about 20–30 cm (8–12 in) from the lips, on the mouth’s axis — a steadier, more blended place to begin in a quiet, good-sounding room.',
    kind: 'sourced',
    src: R.neumann.src,
    quote: R.neumann.quote,
    distance: d,
    off: { min: 0, max: 15, prov: ON_AXIS },
    aimTol: 15,
    ...pick(o),
    start: o.start ?? { d: [250, 240, 260, 230, 270] },
    tendency: o.tendency ?? 'A steadier, more blended voice: small head movements change the level less, and more of the room joins in. Check the room is worth hearing.',
    checks: o.checks ?? ['Room reflections and the music stand’s reflection', 'Level changes as the singer moves', 'Breath and S sounds against the closer start'],
  };
}

/** S-VOC-REC: "slightly lower so that it is not in direct line of sight with the singer's mouth" (10–20 cm). */
export function lowRow(o: RowOpts): VoiceZoneSpec {
  const b = VOICE_DIMS.belowDeg.mm;
  return {
    id: o.id,
    label: o.label ?? 'A little below the mouth line',
    band: o.band ?? 'For sharp S and T sounds: try the mic a little lower, about 10–20 cm away, out of a straight line with the mouth, still aimed up at it.',
    kind: 'sourced',
    src: R.shure.src,
    quote: 'slightly lower so that it is not in direct line of sight with the singer’s mouth (S-VOC-REC; 10–20 cm is the same article’s starting range)',
    bandProv: ill(`"slightly lower": ${b - 10}–${b + 10}° below the mouth’s axis is the lab’s drawing`),
    distance: { min: R.shure.min, max: R.shure.max },
    off: { min: b - 10, max: b + 10, toward: 'down', prov: ill('a little below the mouth line: 20–40° below the axis (the lab’s drawing)') },
    aimTol: 20,
    ...pick(o),
    start: o.start ?? { d: [170, 165, 175, 160, 180, 190], deg: b },
    tendency: o.tendency ?? 'Softer S and T sounds, often with the same body. Too far off the line and the voice turns duller and less clear — move it a little at a time and listen.',
    checks: o.checks ?? ['S and T sounds against the on-axis start', 'Clarity of the words', 'The stand and screen clear of the chin and the chest'],
  };
}

/** DPA-VOC-STUDIO: "around 12 inches" — a looser, roomier view. */
export function looseRow(o: RowOpts): VoiceZoneSpec {
  return {
    id: o.id,
    label: o.label ?? 'Looser, about 30 cm — more of the room',
    band: o.band ?? 'In a good-sounding room, try about 25–35 cm (10–14 in) from the lips, on the mouth’s axis — a looser view that lets the room join the voice. The room is hard to take out later.',
    kind: 'sourced',
    src: R.loose.src,
    quote: R.loose.quote,
    bandProv: ill('"around 12 inches": drawn 25.5–35.5 cm (the lab’s ± 5 cm)'),
    distance: { min: R.loose.min, max: R.loose.max },
    off: { min: 0, max: 15, prov: ON_AXIS },
    aimTol: 15,
    ...pick(o),
    start: o.start ?? { d: [330, 320, 340, 310] },
    tendency: o.tendency ?? 'More of the room around the voice — a production choice, not a fix for a poor room. Less proximity, less breath; more reflections.',
    checks: o.checks ?? ['Is the room worth hearing?', 'Reflections from the music stand and the walls', 'Level changes as the singer moves'],
  };
}

/** DPA-VOICE: stage vocals "within 10 cm" (from 2.5 cm: not on the grille). */
export function stageRow(o: RowOpts): VoiceZoneSpec {
  return {
    id: o.id,
    label: o.label ?? 'Close, within about 10 cm',
    band: o.band ?? 'On a stage, try the mic within about 10 cm (4 in) of the lips, on the mouth’s axis — close enough to stay ahead of the band, with the lips off the grille.',
    kind: 'sourced',
    src: R.stage.src,
    quote: R.stage.quote,
    bandProv: ill('"within 10 cm": drawn 2.5–10 cm — not on the grille (the lab’s drawing)'),
    distance: { min: R.stage.min, max: R.stage.max },
    off: { min: 0, max: 15, prov: ON_AXIS },
    aimTol: 15,
    ...pick(o),
    start: o.start ?? { d: [60, 55, 65, 50, 70, 80], at: 'mouth' },
    tendency: o.tendency ?? 'A strong, close voice with the most of the singer over the stage — and a full low end from the proximity effect. Very close it can sound heavy or distorted; a steady distance matters more than the exact one.',
    checks: o.checks ?? ['The singer’s loudest note: the voice can top 135 dB right at the lips', 'The grille kept clear: no cupping', 'Where the wedge sits against the pattern'],
  };
}

/** A headset "near the mouth corner according to the manufacturer's instructions" (no number: a drawing default). */
export function headsetRow(o: RowOpts): VoiceZoneSpec {
  const f = VOICE_DIMS.headsetFwd.mm;
  const s = VOICE_DIMS.headsetSide.mm;
  return {
    id: o.id,
    label: o.label ?? 'A headset by the corner of the mouth',
    band: o.band ?? 'If the singer moves, a headset holds one distance: place the capsule as its maker says — near the corner of the mouth, out of the breath.',
    kind: 'sourced',
    src: 'DPA-VOICE',
    quote: 'the mouth-to-capsule position, wind protection and wireless power must be checked continuously (lesson E01 L42, E03 L44); the high frequency from the voice is very directional (DPA-VOICE)',
    bandProv: ill('no number is given: 2–6 cm from the lip point, 45–100° to the side, is the lab’s drawing of "near the mouth corner" — follow the headset maker'),
    distance: { min: 20, max: 60 },
    off: { min: 45, max: 100, toward: 'right', prov: ill('beside the mouth: 45–100° off the axis (the lab’s drawing)') },
    aimTol: 60,
    ...pick(o),
    mount: 'clip',
    start: o.start ?? { d: [Math.hypot(f, s), 38, 40, 34, 44], deg: (Math.atan2(s, f) * 180) / Math.PI, spread: 12, at: 'mouth' },
    tendency: o.tendency ?? 'One steady distance however the singer moves and turns. Off to the side of the mouth it hears a little less of the voice’s highs and breath than a mic in front.',
    checks: o.checks ?? ['The capsule where the maker says, out of the breath', 'Its windscreen on', 'The battery, the pack and the cable secured'],
  };
}

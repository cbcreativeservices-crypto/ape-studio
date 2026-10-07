/**
 * E07 SINGER WITH GUITAR OR PIANO — the recommended starting points (charter
 * §2 layer 1), from singer_with_instrument/SOURCES.md and the Lab 5 register
 * (lead_vocal/SOURCES.md §0); corrections E7-… (CORRECTIONS_LOG).
 *
 * GUITAR (frame G, the seated singer-guitarist)
 *   sg.voice    the vocal mic, 4–8 in from the lips (S-VOC-REC; the lesson's
 *               L12) — the worked example;
 *   sg.fret12   the guitar mic 6–12 in out from near the 12th fret
 *               (S-SM4-UG: "near the sound hole or the twelfth fret");
 *   sg.hole     the guitar mic 6–12 in out from the sound hole (S-SM4-UG);
 *   sg.one      ONE mic for voice and guitar together, out in front between
 *               them (the lesson's L10 — no distance is given: 40–70 cm from
 *               the lips is a drawing default, OWNER REVIEW).
 * PIANO (frame K, the grand on the full stick)
 *   sp.voice    the vocal mic on a boom over the keys, 4–8 in from the lips;
 *   sp.over, sp.treble, sp.bass   the piano lesson's own starting points
 *               over the strings (C11 gp.over / gp.treble / gp.bass, S-REC;
 *               AKG-C314's "8 to 16 inches … above the strings, one toward
 *               treble and one toward bass" agrees), re-tagged.
 * Every vocal start is found once at load in the merged model (geometry.ts),
 * clear of the host's player and instrument.
 */
import type { DocumentedZone, Provenance } from '../../engine/model/types.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { zoneFor, type ZoneSpec } from '../shared/guitars/guitarModel.ts';
import { PIANO_ZONES } from '../c11Piano/model.ts';
import { retagZones } from '../shared/voice/hostMerge.ts';
import { voiceZone, type VoiceZoneSpec } from '../shared/voice/voiceZones.ts';
import { closeRow } from '../shared/voice/voiceStarts.ts';
import { E07_MODEL_RAW, GUITAR_SC, IDS_G, IDS_P, V_GUITAR, V_PIANO, frameE07 } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const IN = 25.4;

/* ── the guitar mic (frame G; the guitar family's zone builder) ── */
const NEAR = ill('"near": within 8 cm of the point’s line — the lab’s drawing of "near"');
const AIMED = ill('aimed at the point: the mic’s axis meets the top within 11 cm of it — the lab’s tolerance');
const GT_MICS = ['sdcCard', 'instDynCard'];
const g = GUITAR_SC.g;
const GUITAR_SPECS: ZoneSpec[] = [
  {
    id: 'sg.fret12',
    label: 'The guitar mic, near the 12th fret',
    band: 'Start the guitar mic about 15–30 cm (6–12 in) out from near the 12th fret, aimed between the upper top and the nearby strings — its back toward the singer’s mouth.',
    kind: 'sourced',
    src: 'S-SM4-UG',
    quote: 'Acoustic guitar 6–12 inches (15–30 cm) Place near the sound hole or the twelfth fret',
    surface: 'fret12',
    distance: { min: 6 * IN, max: 12 * IN },
    radial: { max: 80, prov: NEAR },
    aimAtR: { r: 110, prov: AIMED },
    micTypeIds: GT_MICS,
    start: { d: 225, dx: -20, aimAt: { x: g.fret12 - 45, y: 0, z: 0 } },
    tendency: 'A balanced guitar with the strings’ detail — and, a little above it, the singer: the vocal reaches this mic too. Turn its least-sensitive side toward the mouth.',
    checks: ['How much voice it hears, solo and in the pair', 'The fretting hand and the strumming arm clear of it', 'The pair in mono: hollow or full?'],
  },
  {
    id: 'sg.hole',
    label: 'The guitar mic, near the sound hole',
    band: 'Start the guitar mic about 15–30 cm (6–12 in) out from the sound hole, facing it.',
    kind: 'sourced',
    src: 'S-SM4-UG',
    quote: 'Acoustic guitar 6–12 inches (15–30 cm) Place near the sound hole or the twelfth fret',
    surface: 'hole',
    distance: { min: 6 * IN, max: 12 * IN },
    radial: { max: 80, prov: NEAR },
    aimAtR: { r: 110, prov: AIMED },
    micTypeIds: GT_MICS,
    start: { d: 235 },
    tendency: 'A fuller guitar with more of the body and its low-mid — aimed straight into the hole it can turn boomy. Toward the bridge or the 12th fret tends to be more balanced.',
    checks: ['Boom and low-mid build-up', 'The strumming hand’s clearance', 'The voice in it: the mouth is right above'],
  },
];
const GUITAR_ZONES: DocumentedZone[] = GUITAR_SPECS.map((z) => zoneFor(GUITAR_SC, z));

/* ── the vocal mics and the one-mic start (the singer's mouth, frame V on each host) ── */
const mid = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 });

const VOCAL_G: VoiceZoneSpec[] = [
  closeRow({
    id: 'sg.voice',
    variant: 'guitar',
    micTypeIds: ['vocDynCard', 'vocDynSuper', 'vocLdc'],
    label: 'The vocal mic, about 10–20 cm from the lips',
    band: 'Start the vocal mic about 10–20 cm (4–8 in) from the lips, aimed at the mouth — close enough for a strong, direct voice, its least-sensitive side toward the guitar.',
    start: { d: [150, 145, 160, 140, 170], at: 'mouth' },
    tendency: 'A strong, direct voice — with some guitar in it: the guitar is just below the mic. Its rejection, turned toward the guitar, keeps more of it out.',
    checks: ['How much guitar it hears, solo', 'The headstock, the neck and the strumming arm clear of the stand', 'The singer’s posture: does the distance hold through the song?'],
  }),
  {
    id: 'sg.one',
    label: 'One mic for voice and guitar, out in front',
    band: 'In a quiet room, an idea to try: one mic out in front, about 40–70 cm from the lips, a little below the mouth, aimed between the mouth and the guitar — move it until voice and guitar balance.',
    kind: 'sourced',
    src: 'LESSON',
    quote: 'A single microphone can be a musically strong choice for a controlled room and a stable performer. Place the microphone where the combined voice-and-guitar balance is right (L10)',
    bandProv: ill('no distance is given: 40–70 cm from the lips, 20–45° below the mouth’s axis, is the lab’s drawing (OWNER REVIEW)'),
    distance: { min: 400, max: 700 },
    off: { min: 20, max: 45, toward: 'down', prov: ill('a little below the mouth: 20–45° below its axis (the lab’s drawing)') },
    aimTol: 40,
    aimProv: ill('aimed between the mouth and the guitar: within 40° of the mouth (the lab’s tolerance)'),
    micTypeIds: ['sdcCard', 'vocLdcOpen'],
    variant: 'guitar',
    start: { d: [520, 500, 550, 480, 580, 600, 450], deg: 32, spread: 12, aimPoint: mid(V_GUITAR.lip, { x: g.fret12 - 60, y: 0, z: 0 }) },
    tendency: 'One coherent performance with the room — the balance set by where the mic is and how the singer sits. Moving toward it makes both louder; turning the guitar changes the balance. Little to change afterwards.',
    checks: ['The balance of voice and guitar, from the listener’s place', 'The singer’s posture and the guitar’s angle held through the song', 'The room: is it quiet and worth hearing?'],
  },
];

const VOCAL_P: VoiceZoneSpec[] = [
  closeRow({
    id: 'sp.voice',
    variant: 'piano',
    micTypeIds: ['vocDynCard', 'vocDynSuper'],
    label: 'The vocal mic on a boom over the keys',
    band: 'Start the vocal mic about 10–20 cm (4–8 in) from the lips, on a boom from the side, aimed at the mouth — clear of the pianist’s head, hands and the music desk.',
    start: { d: [150, 145, 160, 140, 170], at: 'mouth' },
    tendency: 'A strong, direct voice with the piano below and in front of it. The boom keeps the stand out of the pianist’s way; the piano still reaches the mic — aim its rejection at the strings.',
    checks: ['The boom clear of the pianist’s head, hands, the music desk and the lid', 'The stand’s base clear of the bench, the pedals and the way out', 'How much piano the vocal mic hears'],
  }),
];

const PIANO_KEEP = new Set(['gp.over', 'gp.treble', 'gp.bass']);
const PIANO_ZONES_E07: DocumentedZone[] = retagZones(PIANO_ZONES.filter((z) => PIANO_KEEP.has(z.id)), 'grand', 'piano', (id) => id.replace(/^gp\./, 'sp.'));

const vocal = (V: typeof V_GUITAR, list: VoiceZoneSpec[], surface: string) => list.map((s) => voiceZone(E07_MODEL_RAW, V, s, MIC_TYPES, { surface }));
const VOCAL_ZONES_G = vocal(V_GUITAR, VOCAL_G, IDS_G.surface);
const VOCAL_ZONES_P = vocal(V_PIANO, VOCAL_P, IDS_P.surface);

/** Every starting point, in the order the lesson offers them. */
export const E07_ZONES: DocumentedZone[] = [...VOCAL_ZONES_G, ...GUITAR_ZONES, ...VOCAL_ZONES_P, ...PIANO_ZONES_E07];

const framed = frameE07([...VOCAL_ZONES_G, ...GUITAR_ZONES]);
export const E07_MODEL = framed.model;
export const E07_GUITAR = framed.guitar;
/** The guitar's own zones (its art keeps labels off them). */
export const E07_GUITAR_ZONES = GUITAR_ZONES;

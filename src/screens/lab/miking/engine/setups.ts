/**
 * STARTING SETUPS (owner restructure 2026-10-06: "nowhere do I actually see
 * mics set up or shown as an example, and that is the goal of the lab").
 * Pure; tested in node.
 *
 * A lesson's starting setups are BUILT FROM ITS OWN RESEARCHED STARTING
 * POINTS — never invented: every mic of every setup sits at one of the
 * lesson's recommended zones' validated start poses (or at the pose its own
 * two-mic page uses), with the mic type that zone asks for.
 *
 *   ONE MIC         the zone the lesson's worked example reads (copy
 *                   .placement.workedZone), else its first zone
 *   TWO MICS        the lesson's two-mic pair (copy.twoMic; else the pair its
 *                   family's two-mic page uses, handed in as `pair`; else the
 *                   lesson's own `setupPairs`) — only where the lesson has one
 *   CLOSE · LIVE    a zone the lesson calls a stage / live start, else the
 *                   zone nearest the sound (clearly nearer than ONE MIC)
 *   FARTHER · STUDIO  a zone the lesson calls a room / studio start, else the
 *                   zone farthest from the sound (clearly farther than ONE MIC)
 *
 * "Nearest the sound" is measured from the mic's front to the nearest point
 * the lesson says sound leaves from (its radiating regions' anchors), so a
 * distance read from a different head never decides it. A zone the lesson
 * offers only as an alternative, an effect or a comparison never becomes the
 * close or the farther setup. A role a lesson has no zone for is left out —
 * no setup is made up to fill it. `SETUP_PICKS` records the few lessons where
 * the lesson's own words choose differently from the distance rule.
 */
import type { DocumentedZone, Lesson, MicPattern, MicPose, MicSlot, MicType, VariantId, Vec3 } from './model/types.ts';
import { copyOf } from './model/copy.ts';

export type SetupRole = 'one' | 'pair' | 'close' | 'distant' | 'more';
export const ROLE_LABEL: Readonly<Record<SetupRole, string>> = { one: 'ONE MIC', pair: 'TWO MICS', close: 'CLOSE · LIVE', distant: 'FARTHER BACK · STUDIO', more: 'ANOTHER START' };
/** At most this many setups per variant (the four roles first, then the
 *  lesson's other starting points as ANOTHER START). */
export const MAX_SETUPS = 6;

export type SetupMic = { slot: MicSlot; typeId: string; pattern: MicPattern; pose: MicPose; zoneId: string | null; surfaceId: string; polarity: 1 | -1 };
export type StartingSetup = {
  id: string;
  role: SetupRole;
  variant: VariantId;
  /** The setup's name: the zone's own label, or the pair's. */
  title: string;
  mics: SetupMic[];
  /** The zones the mics sit in (their range and aim words). */
  zones: DocumentedZone[];
  /** One plain line: what it tends to sound like, and its trade-off. */
  line: string;
};

/** A two-mic pair from a family's own two-mic page (its art), when the
 *  lesson's copy has none. Poses are that page's own. */
export type PairInput = { label: string; A: { typeId: string; pattern?: MicPattern; zone?: string; pose?: MicPose }; B: { typeId: string; pattern?: MicPattern; zone?: string; pose?: MicPose; polarity?: 1 | -1 }; line?: string };

/**
 * Where a lesson's own words choose a setup the distance rule would not (the
 * zone ids are the lesson's; `null` = the lesson has no setup for that role).
 * Each is logged in CORRECTIONS_LOG.md (R-06 setups).
 */
export const SETUP_PICKS: Readonly<Record<string, Partial<Record<'close' | 'distant', readonly string[] | null>>>> = {
  // Kick: the one-mic start is already the close one (inside, near the
  // batter head); "an outside or more distant mic may help" in a studio (the
  // lesson's own studio words) — outside the front head.
  M01: { close: null, distant: ['out.edge'] },
  // Concert snare: its higher spot is the farther, broader view, not a close one.
  M07b: { close: null, distant: ['csn.broad'] },
  // Harp: the one-mic start (60 cm out) is already the studio view; the
  // pillar and behind-the-harp spots are ensemble spots (ANOTHER START).
  C10: { distant: null },
  // Piano: the farther, room view is outside the curve (grand, baby) or
  // behind an upright's soundboard — never the mic under the piano.
  C11: { distant: ['gp.curve', 'bg.curve', 'up.rear'] },
  // Clavinet: its farther mics are the two-mic partners (back, behind).
  C12: { close: null, distant: null },
  // Hi-hat: the under-mic on a clip is not a studio position.
  I01a: { distant: null },
};

const LIVE = /\b(live|on stage|for a stage|a loud stage|for live sound|stage)\b/i;
const CLOSE_WORD = /^(close|closer)\b/i;
const STUDIO = /\b(studio|room|a wider view|for the room)\b/i;
const NOT_A_ROLE = /\b(optional|alternative|deliberate|an effect|to compare|one of a pair|one of two|its partner|as the other end mic|as one of two)\b/i;

/** The zone may be used in this variant (its own `requires`). */
export function zoneInVariant(z: DocumentedZone, v: VariantId): boolean {
  const rq = z.requires;
  if (!rq) return true;
  if (rq.variant && rq.variant !== v) return false;
  if (rq.variants && !rq.variants.includes(v)) return false;
  return true;
}

/** The mic type a zone is drawn with: the first it asks for (with its mount). */
export function typeForZone(lesson: Lesson, z: DocumentedZone, micTypes: Record<string, MicType>): string {
  const ids = z.requires?.micTypeIds ?? lesson.micTypeIds;
  const mount = z.requires?.mount;
  return (mount ? ids.find((id) => micTypes[id]?.mount === mount) : undefined) ?? ids[0] ?? lesson.micTypeIds[0];
}

const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/** mm from the zone's start pose to the nearest place the sound leaves. */
export function nearness(lesson: Lesson, z: DocumentedZone, v: VariantId): number {
  const anchors = lesson.model.regions.filter((r) => !r.variants || r.variants.includes(v)).map((r) => r.anchor);
  if (!anchors.length) return Math.max(Math.abs(z.distance.min), Math.abs(z.distance.max));
  return Math.min(...anchors.map((a) => dist(a, z.start.p)));
}

/** The first sentence of a tendency (one plain line). */
export function firstSentence(s: string): string {
  const m = /^(.+?[.!?])(\s|$)/.exec(s.trim());
  return (m ? m[1] : s).trim();
}

function oneLine(z: DocumentedZone): string {
  const a = firstSentence(z.tendency);
  // A very short first sentence ("Sometimes more impact.") takes the next one.
  if (a.length < 40) {
    const rest = z.tendency.trim().slice(a.length).trim();
    const b = rest ? firstSentence(rest) : '';
    return b ? `${a} ${b}` : a;
  }
  return a;
}

function micAt(lesson: Lesson, slot: MicSlot, z: DocumentedZone, micTypes: Record<string, MicType>): SetupMic {
  const typeId = typeForZone(lesson, z, micTypes);
  return { slot, typeId, pattern: micTypes[typeId]?.patterns[0]?.id ?? 'cardioid', pose: z.start, zoneId: z.id, surfaceId: z.refSurface, polarity: 1 };
}

const PAIR_TAIL = 'Two mics give more to blend — check the pair together in mono.';

function pairSetup(lesson: Lesson, v: VariantId, micTypes: Record<string, MicType>, pair: PairInput | null | undefined): StartingSetup | null {
  const byId = (id?: string) => (id ? lesson.zones.find((z) => z.id === id) : undefined);
  const C = copyOf(lesson);
  const T = C.twoMic;
  // 1 · the lesson's own two-mic copy. Its zones are written for one setup
  // of the instrument; the same pair in another setup is the lesson's zones
  // of the same name for that setup ("fret12.steel" → "fret12.twelve").
  const a0 = byId(T?.A?.zone);
  const token = T?.variant ?? a0?.requires?.variant ?? (a0?.requires?.variants?.length === 1 ? a0.requires.variants[0] : undefined);
  const inV = (id?: string): DocumentedZone | undefined => {
    const z = byId(id);
    if (z && zoneInVariant(z, v)) return z;
    if (id && token && token !== v && id.includes(token)) {
      const z2 = byId(id.split(token).join(v));
      if (z2 && zoneInVariant(z2, v)) return z2;
    }
    return undefined;
  };
  const zA = inV(T?.A?.zone);
  if (zA) {
    const zB = inV(T.B?.zone);
    if (zB || (!T.B?.zone && !!T.B?.pose && (T.variant ? T.variant === v : zoneInVariant(zA, v)))) {
      const A: SetupMic = { ...micAt(lesson, 'A', zA, micTypes), typeId: T.A.typeId || typeForZone(lesson, zA, micTypes), pattern: T.A.pattern };
      const B: SetupMic = zB
        ? { ...micAt(lesson, 'B', zB, micTypes), typeId: T.B.typeId || typeForZone(lesson, zB, micTypes), pattern: T.B.pattern }
        : { slot: 'B', typeId: T.B.typeId || lesson.micTypeIds[0], pattern: T.B.pattern, pose: T.B.pose!, zoneId: null, surfaceId: zA.refSurface, polarity: 1 };
      const zones = zB ? [zA, zB] : [zA];
      return { id: `pair:${zA.id}+${zB?.id ?? 'pose'}`, role: 'pair', variant: v, title: zB ? `${zA.label} + ${lower(zB.label)}` : `${zA.label}, with a second mic`, mics: [A, B], zones, line: `${firstSentence((zB ?? zA).tendency)} ${PAIR_TAIL}` };
    }
  }
  // 2 · the family's own two-mic page (its art), 3 · the lesson's setupPairs
  const fromInput = (p: PairInput): StartingSetup | null => {
    const a = byId(p.A.zone);
    const b = byId(p.B.zone);
    if ((a && !zoneInVariant(a, v)) || (b && !zoneInVariant(b, v))) return null;
    const pa = p.A.pose ?? a?.start;
    const pb = p.B.pose ?? b?.start;
    if (!pa || !pb) return null;
    const mk = (slot: MicSlot, side: PairInput['A'] | PairInput['B'], z: DocumentedZone | undefined, pose: MicPose, pol: 1 | -1): SetupMic => ({
      slot,
      typeId: side.typeId,
      pattern: side.pattern ?? micTypes[side.typeId]?.patterns[0]?.id ?? 'cardioid',
      pose,
      zoneId: z?.id ?? null,
      surfaceId: z?.refSurface ?? a?.refSurface ?? b?.refSurface ?? lesson.model.surfaces[0]?.id ?? '',
      polarity: pol,
    });
    const zones = [a, b].filter((z): z is DocumentedZone => !!z);
    return { id: `pair:${p.label}`, role: 'pair', variant: v, title: p.label, mics: [mk('A', p.A, a, pa, 1), mk('B', p.B, b, pb, (p.B as { polarity?: 1 | -1 }).polarity ?? 1)], zones, line: p.line ?? `${firstSentence((b ?? a)?.tendency ?? '')} ${PAIR_TAIL}`.trim() };
  };
  if (pair) {
    const s = fromInput(pair);
    if (s) return s;
  }
  for (const sp of lesson.setupPairs ?? []) {
    if (sp.variants && !sp.variants.includes(v)) continue;
    const a = byId(sp.A.zone);
    const b = byId(sp.B.zone);
    if (!a || !b) continue;
    const s = fromInput({ label: sp.label, A: { typeId: sp.A.typeId ?? typeForZone(lesson, a, micTypes), pattern: sp.A.pattern, zone: sp.A.zone }, B: { typeId: sp.B.typeId ?? typeForZone(lesson, b, micTypes), pattern: sp.B.pattern, zone: sp.B.zone, polarity: sp.B.polarity }, line: sp.line });
    if (s) return s;
  }
  return null;
}

const lower = (s: string) => (s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toLowerCase() + s.slice(1) : s);

/** The lesson's starting setups in one variant, in the order ONE MIC, TWO
 *  MICS, CLOSE · LIVE, FARTHER BACK · STUDIO (each only where it exists). */
export function startingSetups(lesson: Lesson, variant: VariantId, micTypes: Record<string, MicType>, pair?: PairInput | null): StartingSetup[] {
  const zones = lesson.zones.filter((z) => zoneInVariant(z, variant));
  if (!zones.length) return [];
  const C = copyOf(lesson);
  const worked = zones.find((z) => z.id === C.placement.workedZone[variant]) ?? zones[0];
  const out: StartingSetup[] = [];
  const used = new Set<string>([worked.id]);
  const single = (role: SetupRole, z: DocumentedZone): StartingSetup => ({ id: `${role}:${z.id}`, role, variant, title: z.label, mics: [micAt(lesson, 'A', z, micTypes)], zones: [z], line: oneLine(z) });
  out.push(single('one', worked));

  const two = pairSetup(lesson, variant, micTypes, pair);
  if (two) {
    out.push(two);
    for (const z of two.zones) used.add(z.id);
  }

  const words = (z: DocumentedZone) => `${z.label} ${z.band}`;
  const near = new Map(zones.map((z) => [z.id, nearness(lesson, z, variant)]));
  const base = near.get(worked.id) ?? 0;
  const isClip = (z: DocumentedZone) => micTypes[typeForZone(lesson, z, micTypes)]?.mount === 'clip';
  const byNear = (a: DocumentedZone, b: DocumentedZone) => near.get(a.id)! - near.get(b.id)!;
  const picks = SETUP_PICKS[lesson.id] ?? {};

  const pick = (role: 'close' | 'distant'): DocumentedZone | null => {
    if (role in picks) {
      const ids = picks[role];
      return ids ? zones.find((q) => ids.includes(q.id) && !used.has(q.id)) ?? null : null;
    }
    const cand = zones.filter((z) => !used.has(z.id) && !NOT_A_ROLE.test(words(z)));
    if (role === 'close') {
      // A stage / clip-on / "close" start that is no farther from the sound
      // than the one-mic start — else a zone clearly nearer.
      const named = cand.filter((z) => near.get(z.id)! <= base + 1 && (LIVE.test(words(z)) || isClip(z) || CLOSE_WORD.test(z.label))).sort(byNear);
      if (named.length) return named[0];
      return cand.filter((z) => near.get(z.id)! <= base * 0.7).sort(byNear)[0] ?? null;
    }
    // A room / studio start farther from the sound than the one-mic start
    // (never a clip-on) — else a zone clearly farther.
    const far = cand.filter((z) => !isClip(z) && near.get(z.id)! > base + 1);
    const room = far.filter((z) => STUDIO.test(words(z))).sort(byNear).reverse();
    if (room.length) return room[0];
    return far.filter((z) => near.get(z.id)! >= Math.max(base * 2, base + 300)).sort(byNear).reverse()[0] ?? null;
  };
  const close = pick('close');
  if (close) {
    used.add(close.id);
    out.push(single('close', close));
  }
  const far = pick('distant');
  if (far) {
    used.add(far.id);
    out.push(single('distant', far));
  }
  // The lesson's other starting points, each drawn as its own setup.
  for (const z of zones) {
    if (out.length >= MAX_SETUPS) break;
    if (used.has(z.id)) continue;
    used.add(z.id);
    out.push(single('more', z));
  }
  return out;
}

/** The setups a learner must look at for STARTING SETUPS' credit: every
 *  setup in one of the four roles (ANOTHER START is there to explore). */
export function coreSetups(list: readonly StartingSetup[]): StartingSetup[] {
  return list.filter((s) => s.role !== 'more');
}

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
import type { DocumentedZone, Lesson, MicPattern, MicPose, MicSlot, MicType, SetupPairData, VariantId, Vec3 } from './model/types.ts';
import { copyOf } from './model/copy.ts';
import { guideFor } from './geometry/guides.ts';

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
export const SETUP_PICKS: Readonly<Record<string, Partial<Record<'close' | 'distant', readonly string[] | null>> & { pair?: null }>> = {
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
  // Review 2026-10-07 (labs 1–2, REVIEW_2026_10_07_labs12.md R12-A03): on a
  // small hand-held or struck source the lesson's own two-mic page says one
  // spot is usually enough — its second position is ANOTHER ANGLE to compare,
  // not a two-mic starting setup (two mics a few cm apart on one shaker only
  // comb). `pair: null` = no TWO MICS role; the second angle stays drawn as
  // ANOTHER START.
  M08: { pair: null },
  I03a: { pair: null },
  I04: { pair: null },
  I05a: { pair: null },
  I05b: { pair: null },
  I05c: { pair: null },
  I05d: { pair: null },
  // Glockenspiel: one keyboard, one mic; the closer start is the stage one.
  I10: { pair: null, close: ['gl.near'] },
  // Rack toms: the clip-on is the stage start; the rim condenser is another.
  M03: { close: ['tom2.clip', 'floor.clip'] },
  // Djembe: its farther start (≈ 41 cm, "more of the whole drum and of the
  // room") is the farther view, so the floor-standing drum has two.
  M05: { distant: ['dj.top.far'] },
  // Finger cymbals: one mic; the farther spot is the farther, roomier view.
  I06b: { distant: ['fc.B', 'fc.far'] },
  // Guitar, steel and bass amps (review 2026-10-07, RV34-07): the one-mic
  // start is already the close stage mic at the grille; the other close
  // spots (centre, edge) are the same distance, a tone choice — ANOTHER
  // START, not a "live" setup.
  C02: { close: null },
  C04: { close: null },
  C08: { close: null },
  // Lab 6 group 4 — measurement core. F12: a survey has no stage or studio
  // start; the position at the wall is nearer the air unit, not a "close"
  // mic — it stays ANOTHER START (sound_level/GEOMETRY_PROPOSAL.md §4).
  F12: { close: null, distant: null },
  // Lab 6 group 5 — systems, products and sensors (loudspeaker_measurement/,
  // machinery_sound/, scientific_arrays/GEOMETRY_PROPOSAL.md §4). F14: CLOSE ·
  // LIVE is the venue's overlap seat; the near-field woofer point is ANOTHER
  // START on the bench, not a stage mic; the studio's neighbour positions
  // are the pair, not a farther start. F15: the close detail mic outside the
  // exclusion zone for a live demo; the listener-like Foley perspective
  // farther back. F16: an array lesson — no close or farther single mic.
  F14: { close: ['vn.overlap'], distant: null },
  F15: { close: ['mp.detail'], distant: ['mp.far'] },
  F16: { close: null, distant: null },
  // Lab 7 group 1 — desk and studio voice. Every desk mic hangs on an arm or a
  // gooseneck (an engine 'clip' mount), which the distance rule never takes
  // as a farther, studio start: the lesson's own words name it
  // (CORRECTIONS_LOG L7G1).
  B01: { distant: ['b1.cond'] },
  // B07: at the guest desk the live read is the close end of the host's
  // range; the guest's headset is another start, not the live one.
  B07: { close: ['b7.live'] },
  // B06: the aisle question mic is nearer its talker than the lectern
  // gooseneck, but it is not a live start for the presenter.
  B06: { close: null },
  // Lab 7 · part 2 · G1 — speech in sport (commentators/, sideline_interviews/,
  // athletes_officials/GEOMETRY_PROPOSAL.md §4–5). B09: the lip ribbon is the
  // open position's close start; the desk-arm mic in a quiet booth is the
  // farther one (an arm is a 'clip' the distance rule never takes as farther).
  B09: { close: ['b9.lip'], distant: ['b9.arm'] },
  // B10: the reporter's headset is the sideline's close start (it is on the
  // reporter, not the guest — said in its words); the boom over the
  // post-event mark is the farther one (a pole is a 'clip').
  B10: { close: ['b10.headset'], distant: ['b10.boom'] },
  // B11: no TWO MICS setup — a chest mic and a headset open on one voice is
  // the two-mic page's warning, not a start; the coach's headset is the close
  // start; the perimeter boom is the fallback, farther (a pole is a 'clip').
  B11: { pair: null, close: ['b11.headset'], distant: ['b11.perimeter'] },
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

/**
 * The surface a second mic placed by pose alone (no zone: the kick's mic
 * outside the port) is measured from: the nearest of the lesson's reference
 * surfaces in this variant — the front head for a mic outside the front head,
 * never the batter head on the far side of the drum.
 */
export function nearestSurface(lesson: Lesson, v: VariantId, pose: MicPose): string | null {
  let best: { id: string; d: number } | null = null;
  for (const s of lesson.model.surfaces) {
    if (s.variants && !s.variants.includes(v)) continue;
    const d = guideFor(s, pose).distance;
    if (!best || d < best.d) best = { id: s.id, d };
  }
  return best?.id ?? null;
}

/** "Front (rear port) + back (rear port)" → "Front + back (rear port)". */
export function pairTitle(a: string, b: string): string {
  const m = /\s(\([^()]+\))$/.exec(a);
  const head = m && b.endsWith(m[1]) ? a.slice(0, -m[0].length) : a;
  return `${head} + ${lower(b)}`;
}

const PAIR_TAIL ='Two mics give more to blend — check the pair together in mono.';

/**
 * The lesson's pairs in one variant (reviews 2026-10-07, labs 1–2 and 3–4,
 * merged): its TWO MICS setup, and every other pair it lists, each drawn
 * whole as ANOTHER START — a spaced overhead pair or a stereo pair is never
 * shown as lone mics.
 *
 *   TWO MICS  1 · the lesson's own two-mic copy, 2 · the pair its family's
 *             two-mic page uses (`pair`), 3 · the first of its `setupPairs`
 *             not marked `more`. None where SETUP_PICKS says `pair: null`.
 *   MORE      every other `setupPairs` entry drawable in this variant (a
 *             `more` one always; an unmarked one only where the lesson has a
 *             TWO MICS role — `pair: null` means one spot is usually enough).
 */
function pairSetups(lesson: Lesson, v: VariantId, micTypes: Record<string, MicType>, pair: PairInput | null | undefined, allowTwo: boolean): { two: StartingSetup | null; more: { setup: StartingSetup; zoneIds: string[] }[] } {
  const byId = (id?: string) => (id ? lesson.zones.find((z) => z.id === id) : undefined);
  let primary: StartingSetup | null = null;
  let primaryListed: SetupPairData | null = null;
  if (allowTwo) {
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
          : { slot: 'B', typeId: T.B.typeId || lesson.micTypeIds[0], pattern: T.B.pattern, pose: T.B.pose!, zoneId: null, surfaceId: nearestSurface(lesson, v, T.B.pose!) ?? zA.refSurface, polarity: 1 };
        const zones = zB ? [zA, zB] : [zA];
        primary = { id: `pair:${zA.id}+${zB?.id ?? 'pose'}`, role: 'pair', variant: v, title: T.label ?? (zB ? pairTitle(zA.label, zB.label) : `${zA.label}, with a second mic`), mics: [A, B], zones, line: `${firstSentence((zB ?? zA).tendency)} ${PAIR_TAIL}` };
      }
    }
    // 2 · the family's own two-mic page (its art), 3 · the lesson's setupPairs
    if (!primary && pair) primary = pairFromInput(lesson, v, micTypes, pair, 'pair');
    if (!primary) {
      for (const sp of lesson.setupPairs ?? []) {
        if (sp.more) continue;
        const s = pairFromData(lesson, v, micTypes, sp, 'pair');
        if (s) {
          primary = s;
          primaryListed = sp;
          break;
        }
      }
    }
  }
  const more: { setup: StartingSetup; zoneIds: string[] }[] = [];
  for (const sp of lesson.setupPairs ?? []) {
    if (sp === primaryListed || (!sp.more && !allowTwo)) continue;
    const s = pairFromData(lesson, v, micTypes, sp, 'more');
    if (s) more.push({ setup: s, zoneIds: [sp.A.zone, sp.B.zone] });
  }
  return { two: primary, more };
}

/**
 * A pair from its input. A mic given a `pose` of its own is the zone's
 * second (or re-aimed) mic — a split pair's other side, a stereo pair's two
 * capsules: it is measured from the zone's surface and carries no zone (its
 * START reads as a distance), so a zone's own start pose is never altered.
 */
function pairFromInput(lesson: Lesson, v: VariantId, micTypes: Record<string, MicType>, p: PairInput, role: 'pair' | 'more'): StartingSetup | null {
  const byId = (id?: string) => (id ? lesson.zones.find((z) => z.id === id) : undefined);
  const a = byId(p.A.zone);
  const b = byId(p.B.zone);
  if ((a && !zoneInVariant(a, v)) || (b && !zoneInVariant(b, v))) return null;
  const pa = p.A.pose ?? a?.start;
  const pb = p.B.pose ?? b?.start;
  if (!pa || !pb) return null;
  const mk = (slot: MicSlot, side: PairInput['A'] | PairInput['B'], z: DocumentedZone | undefined, pose: MicPose, pol: 1 | -1): SetupMic => {
    const own = side.pose ? undefined : z;
    return {
      slot,
      typeId: side.typeId,
      pattern: side.pattern ?? micTypes[side.typeId]?.patterns[0]?.id ?? 'cardioid',
      pose,
      zoneId: own?.id ?? null,
      surfaceId: z?.refSurface ?? nearestSurface(lesson, v, pose) ?? a?.refSurface ?? b?.refSurface ?? lesson.model.surfaces[0]?.id ?? '',
      polarity: pol,
    };
  };
  const A = mk('A', p.A, a, pa, 1);
  const B = mk('B', p.B, b, pb, (p.B as { polarity?: 1 | -1 }).polarity ?? 1);
  const zones = [a, b].filter((z, k, all): z is DocumentedZone => !!z && all.indexOf(z) === k && [A, B].some((m) => m.zoneId === z.id));
  return { id: `${role}:${p.label}`, role, variant: v, title: p.label, mics: [A, B], zones, line: p.line ?? `${firstSentence((b ?? a)?.tendency ?? '')} ${PAIR_TAIL}`.trim() };
}

function pairFromData(lesson: Lesson, v: VariantId, micTypes: Record<string, MicType>, sp: SetupPairData, role: 'pair' | 'more'): StartingSetup | null {
  if (sp.variants && !sp.variants.includes(v)) return null;
  const a = lesson.zones.find((z) => z.id === sp.A.zone);
  const b = lesson.zones.find((z) => z.id === sp.B.zone);
  if (!a || !b) return null;
  return pairFromInput(
    lesson,
    v,
    micTypes,
    {
      label: sp.label,
      A: { typeId: sp.A.typeId ?? typeForZone(lesson, a, micTypes), pattern: sp.A.pattern, zone: sp.A.zone, pose: sp.A.pose },
      B: { typeId: sp.B.typeId ?? typeForZone(lesson, b, micTypes), pattern: sp.B.pattern, zone: sp.B.zone, pose: sp.B.pose, polarity: sp.B.polarity },
      line: sp.line,
    },
    role,
  );
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

  const picks = SETUP_PICKS[lesson.id] ?? {};
  const { two, more: listed } = pairSetups(lesson, variant, micTypes, pair, picks.pair !== null);
  if (two) {
    out.push(two);
    for (const z of two.zones) used.add(z.id);
  }
  // The other listed pairs: one whose zones ONE MIC and TWO MICS already
  // draw adds nothing; the rest keep their zones from the CLOSE / FARTHER
  // roles and from ANOTHER START, so a pair's zone is never drawn as a lone
  // mic (a mic posed inside a zone counts that zone too).
  const morePairs = listed.filter((p) => !p.zoneIds.every((id) => used.has(id)));
  for (const p of morePairs) for (const id of p.zoneIds) used.add(id);

  const words = (z: DocumentedZone) => `${z.label} ${z.band}`;
  const near = new Map(zones.map((z) => [z.id, nearness(lesson, z, variant)]));
  const base = near.get(worked.id) ?? 0;
  const isClip = (z: DocumentedZone) => micTypes[typeForZone(lesson, z, micTypes)]?.mount === 'clip';
  const byNear = (a: DocumentedZone, b: DocumentedZone) => near.get(a.id)! - near.get(b.id)!;

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
  // The lesson's other listed pairs — a spaced pair, a stereo pair, a split
  // pair — each drawn whole as ANOTHER START, never as one mic.
  for (const p of morePairs) if (out.length < MAX_SETUPS) out.push(p.setup);
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

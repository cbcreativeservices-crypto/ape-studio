/**
 * gaSceneLogic — the PURE half of the Game Audio lab's scene picture
 * (scene/GaScene.tsx draws what this decides). No React, no Skia, so every
 * rule below is proven in test/gameAudioScene.test.ts with no device.
 *
 * THE TRUTH RULE (owner: never stylized audio; what you see is what is
 * playing). Everything here is read from the model's state and the model's
 * own clock:
 *
 *   which sources ring   a source rings only while one of its voices SOUNDS:
 *                        a layer that starts late (`delayS`: the door's
 *                        rattle, the crate's debris) has no ring until
 *                        `born + delayS` (audit 2, W1 F03)
 *   a loop               a train of rings; a generator's rings leave more
 *                        often, and so sit closer, as its SPEED rises
 *                        (continuous in the model's value)
 *   a one-shot           ONE ring per sounding voice, which leaves when the
 *                        voice starts and fades over the sound's own length
 *   the level            ring color and strength are the level AT THE
 *                        LISTENER after distance, the wall and the mix; a
 *                        quiet source is never drawn faint enough to look
 *                        stopped (audit 2, W2-12)
 *   the wall             a source heard through the closed door is `muffled`:
 *                        its rings stop at the wall and go on beyond it thin
 *                        and dashed
 *   not heard            tracked but not rendered (virtual, or its voice was
 *                        stolen), or silenced by the mix: one still, dashed,
 *                        grey ring and no moving rings
 */
import { GA_BED_FADE_S, GA_EVENTS } from '../model/gaDefs.ts';
import { GA_HUD_H } from './hud/gaHudTypes.ts';
import { gaGeneratorRate, gaInstWall, gaListenDistance, gaNominalSeconds, gaVoiceLevel, listenerOf, type GaCharId, type GaState } from '../model/gaModel.ts';
import {
  SURFACE_NAME,
  WALL_X,
  WORLD_H,
  WORLD_W,
  attenuationGain,
  bearing,
  gainDb,
  zoneAt,
  PLACES,
  type GaPoint,
  type GaSurfaceId,
  type GaZone,
} from '../model/gaWorld.ts';

/* ── what is sounding ───────────────────────────────────────────────────── */

/** One ring of a one-shot: it leaves at `start` (scene seconds) and fades
 *  over `len` seconds, the sound's own length. */
export type GaShotRing = { id: string; start: number; len: number; db: number };

export type GaSounding = {
  key: string;
  /** What it is, in words (the screen reader's list). */
  name: string;
  owner: string;
  at: GaPoint;
  kind: 'loop' | 'shot';
  /** The level at the listener, dB re full level: the loudest of its voices
   *  after distance, the wall and the mix. −120 when the mix silenced it. */
  db: number;
  /** Tracked but not rendered: every voice is virtual. */
  virtual: boolean;
  /** …because the voice budget took its voice (it returns when one is free). */
  stolen: boolean;
  /** The mix has silenced it: its bus is muted, or another bus is soloed. */
  muted: boolean;
  /** Heard through the closed door: the wall's level change and filter apply. */
  muffled: boolean;
  /** The owner machine's SPEED, 0 … 1 (a generator's loop); null otherwise. */
  speed: number | null;
  alarm: boolean;
  /** The instances behind this source, oldest first (page 7 prints them). */
  ids: string[];
  /** A one-shot's rings, one per voice that has started. Empty for a loop. */
  rings: GaShotRing[];
};

const SOURCE_NAME: Record<string, string> = { 'generator-1': 'generator 1', 'generator-2': 'generator 2', fountain: 'the fountain', crate: 'the crate', door: 'the door', player: 'your footsteps', guide: "the guide's footsteps", bird: 'a bird' };

/** Has this voice begun to sound at scene time `now`? A late layer has not,
 *  until its delay has passed. */
export const gaVoiceStarted = (v: { born: number; delayS: number }, now: number): boolean => now >= v.born + v.delayS - 1e-3;

/** Every positioned source that is sounding at scene time `now`, and its
 *  level at the listener: distance, the wall, and the mix (the bus fader,
 *  mute, solo, the duck). The alarm is listed apart from the generator it
 *  sits on. */
export function gaSoundingOf(s: GaState, now: number = s.t): GaSounding[] {
  const L = listenerOf(s);
  const out = new Map<string, GaSounding>();
  for (const i of s.inst) {
    const def = GA_EVENTS[i.event];
    if (!def.spatial || !i.pos || !def.atten) continue;
    const vs = s.voices.filter((v) => v.inst === i.id && gaVoiceStarted(v, now));
    if (!vs.length) continue;
    // the model's own wall treatment for this instance (the door itself,
    // which stands in the wall, is never treated)
    const ob = gaInstWall(s, i);
    const place = attenuationGain(gaListenDistance(L, i.pos), def.atten) * ob.gain;
    const alarm = i.event === 'alarm';
    const kind: GaSounding['kind'] = def.kind === 'loop' ? 'loop' : 'shot';
    const key = `${alarm ? 'alarm' : i.owner}:${kind}:${Math.round(i.pos.x * 10)}:${Math.round(i.pos.y * 10)}`;
    let mix = 0;
    for (const v of vs) mix = Math.max(mix, gaVoiceLevel(s, v));
    const virtual = vs.every((v) => v.state === 'virtual');
    const stolen = virtual && vs.some((v) => v.stolen === true || v.waiting === true);
    const muted = mix <= 0;
    const db = muted ? -120 : gainDb(place * mix);
    const rings: GaShotRing[] =
      kind === 'shot'
        ? vs.map((v) => {
            const lv = gaVoiceLevel(s, v);
            return { id: v.v, start: v.born + v.delayS, len: gaNominalSeconds(v.asset), db: lv <= 0 ? -120 : gainDb(place * lv) };
          })
        : [];
    const speed = i.event === 'generator' ? (s.machines.find((m) => m.id === i.owner)?.speed ?? 0.4) : null;
    const prev = out.get(key);
    if (!prev) {
      out.set(key, { key, name: alarm ? 'the alarm' : (SOURCE_NAME[i.owner] ?? i.owner), owner: i.owner, at: i.pos, kind, db, virtual, stolen, muted, muffled: ob.obstructed, speed, alarm, ids: [i.id], rings });
    } else {
      // a second instance at the same place (an overlap, a stacked copy):
      // one source to the eye, as loud as its loudest, heard if any is heard
      prev.ids.push(i.id);
      prev.rings.push(...rings);
      prev.db = Math.max(prev.db, db);
      prev.virtual = prev.virtual && virtual;
      prev.stolen = prev.virtual && (prev.stolen || stolen);
      prev.muted = prev.muted && muted;
    }
  }
  return [...out.values()];
}

/** Does this source draw MOVING rings? Only a source that is heard does:
 *  "quiet" must never look like "stopped", and "stopped" never like quiet. */
export const gaHeard = (x: GaSounding): boolean => !x.virtual && !x.muted;

/** The next scene time at which the picture must be drawn again although
 *  nothing was dispatched: a late layer begins to sound. Null = none waits. */
export function gaNextRingChange(s: GaState, now: number): number | null {
  let next: number | null = null;
  for (const v of s.voices) {
    if (!v.delayS) continue;
    const at = v.born + v.delayS;
    if (at > now + 1e-3 && (next === null || at < next)) next = at;
  }
  return next;
}

/* ── pace and strength ──────────────────────────────────────────────────── */

/** How fast a ring travels outward, meters per second. One number for every
 *  loop: a faster machine does not push its sound out faster, it sends
 *  rings more often. */
export const GA_RING_SPEED = 0.7;
/** A generator's gap at SPEED 0, in meters. */
const GAP_SLOW = 0.66;
/** How strongly the gap answers the hum's playback rate. Above 1 on
 *  purpose: in exact proportion, SPEED 40% and 60% differ by one pixel on a
 *  phone; with this the whole slider is seen. */
const GAP_POWER = 1.5;
/** A loop with no speed of its own (the fountain). */
export const GA_RING_GAP = 0.5;
/** The alarm's broken rings sit wider apart. */
export const GA_ALARM_GAP = 0.62;

/** The distance between two rings of a loop, in meters. A generator's gap
 *  follows the MODEL'S playback rate of its hum at this SPEED (0 … 1;
 *  model/gaModel `gaGeneratorRate`, the rate the engine is sent): the faster
 *  the hum plays, the more often a ring leaves and the closer the rings sit.
 *  Continuous: no steps, the whole slider is seen. With motion reduced the
 *  same gap is drawn still, so the SPEED cue is never lost. */
export function gaRingGap(speed: number | null): number {
  if (speed == null || !Number.isFinite(speed)) return GA_RING_GAP;
  return GAP_SLOW * Math.pow(gaGeneratorRate(0) / gaGeneratorRate(speed), GAP_POWER);
}
/** Rings leaving per second at this speed. */
export const gaRingsPerSecond = (speed: number | null): number => GA_RING_SPEED / gaRingGap(speed);

/** The level range the ring color covers (the house loudness ramp). */
export const GA_RING_DB_MIN = -36;
export const GA_RING_DB_MAX = 0;
/** A heard source is never drawn under these: at phone size a learner must
 *  still see a quiet source's rings move (audit 2, W2-12). */
export const GA_RING_MIN_OPACITY = 0.62;
export const GA_RING_MIN_STROKE = 0.08;

/** How strongly a heard ring is drawn for this level: opacity 0.62 … 1 and
 *  stroke 0.08 … 0.11 m. The color carries the level; this only helps. */
export function gaRingLook(db: number): { opacity: number; stroke: number } {
  const k = Math.max(0, Math.min(1, (db - GA_RING_DB_MIN) / (GA_RING_DB_MAX - GA_RING_DB_MIN)));
  return { opacity: GA_RING_MIN_OPACITY + (1 - GA_RING_MIN_OPACITY) * k, stroke: GA_RING_MIN_STROKE + 0.03 * k };
}

/* ── the wall ───────────────────────────────────────────────────────────── */

/** Where the straight line from a source to the listener meets the wall, and
 *  how far that is from the source. The muffled rings are drawn there. */
export function gaWallCrossing(source: GaPoint, listener: GaPoint): { at: GaPoint; d: number } {
  const dx = listener.x - source.x;
  const t = Math.abs(dx) < 1e-6 ? 0 : Math.max(0, Math.min(1, (WALL_X - source.x) / dx));
  const y = Math.max(0.7, Math.min(WORLD_H - 0.7, source.y + (listener.y - source.y) * t));
  const at = { x: WALL_X, y };
  return { at, d: Math.hypot(at.x - source.x, at.y - source.y) };
}

/** Does `x` draw the piece of its rings AT the wall? Where several muffled
 *  sources share one place (the alarm sits on its generator), only the
 *  loudest heard one does, so the wall shows one clear piece, not two on
 *  top of each other. */
export function gaWallPieceOwner(all: readonly GaSounding[], x: GaSounding): boolean {
  if (!x.muffled || !gaHeard(x)) return false;
  const here = all.filter((o) => o.muffled && gaHeard(o) && Math.hypot(o.at.x - x.at.x, o.at.y - x.at.y) < 0.3);
  const best = here.reduce((a, b) => (b.db > a.db ? b : a), here[0]);
  return best === x;
}

/** The side of the wall a point is on, as a rectangle of the picture. */
export const gaZoneRect = (z: GaZone): GaBox => (z === 'yard' ? { x0: 0, y0: 0, x1: WALL_X, y1: WORLD_H } : { x0: WALL_X, y0: 0, x1: WORLD_W, y1: WORLD_H });
export const gaOtherZone = (z: GaZone): GaZone => (z === 'yard' ? 'room' : 'yard');

/* ── the beds ───────────────────────────────────────────────────────────── */

export type GaBedMark = { playing: boolean; level: number; copies: number };

/** How long the beds' crossfade that is under way lasts, in seconds: the
 *  model's own figure for it (`bedFade.ramp`), so the marks change over
 *  exactly as the sound does. */
export const gaBedFadeSeconds = (s: GaState): number => (s.bedFade && s.bedFade.ramp > 0 ? s.bedFade.ramp : GA_BED_FADE_S);

/** The two ambience beds (courtyard wind, workshop room tone): whether each
 *  has a voice, and its level 0 … 1: the bed of the listener's zone plays at
 *  its mix level, the other one at zero (the model's own rule). */
export function gaBedMarks(s: GaState): Record<GaZone, GaBedMark> {
  const zone = zoneAt(listenerOf(s));
  const one = (event: 'bed_yard' | 'bed_room', z: GaZone): GaBedMark => {
    const inst = s.inst.filter((i) => i.event === event);
    let level = 0;
    for (const i of inst) for (const v of s.voices) if (v.inst === i.id && v.state !== 'virtual') level = Math.max(level, gaVoiceLevel(s, v));
    return { playing: inst.length > 0, level: zone === z ? Math.max(0, Math.min(1, level)) : 0, copies: inst.length };
  };
  return { yard: one('bed_yard', 'yard'), room: one('bed_room', 'room') };
}

/* ── footsteps ──────────────────────────────────────────────────────────── */

export type GaFootMark = { inst: string; who: GaCharId; at: GaPoint; born: number; surface: string; take: number };

const SURFACE_OF_ASSET: Record<string, GaSurfaceId> = { wood: 'wood', stone: 'stone', gravel: 'gravel' };

/** The footsteps in the scene now: who stepped, where, on which surface the
 *  SOUND was chosen for (the asset the model picked, so a wrong switch shows
 *  as the wrong word), and which take. */
export function gaFootMarks(s: GaState): GaFootMark[] {
  const out: GaFootMark[] = [];
  for (const i of s.inst) {
    if (i.event !== 'footstep' || !i.pos || (i.owner !== 'player' && i.owner !== 'guide')) continue;
    const asset = s.voices.find((v) => v.inst === i.id)?.asset ?? i.chose[0] ?? '';
    const m = /^fs_([a-z]+)_(\d+)$/.exec(asset);
    if (!m || !SURFACE_OF_ASSET[m[1]]) continue;
    out.push({ inst: i.id, who: i.owner, at: i.pos, born: i.born, surface: SURFACE_NAME[SURFACE_OF_ASSET[m[1]]].toUpperCase(), take: Number(m[2]) });
  }
  return out;
}

/** The words by the foot: the surface (page 8), the take (page 9), or both. */
export function gaFootText(m: GaFootMark, show: { surface?: boolean; take?: boolean }): string {
  const parts: string[] = [];
  if (show.surface) parts.push(m.surface);
  if (show.take) parts.push(`TAKE ${m.take}`);
  return parts.join(' · ');
}

/* ── the selected source ────────────────────────────────────────────────── */

export type GaSceneSelect = 'generator-1' | 'generator-2' | 'fountain' | 'door' | 'crate' | 'guide' | null;

/** Where the selected source is, and the event whose distances it shows. */
export function gaSelected(select: GaSceneSelect): { at: GaPoint; event: 'generator' | 'fountain' | 'crate_impact' | 'door_open' } | null {
  switch (select) {
    case 'generator-1':
      return { at: PLACES.generator, event: 'generator' };
    case 'generator-2':
      return { at: PLACES.generator2, event: 'generator' };
    case 'fountain':
      return { at: PLACES.fountain, event: 'fountain' };
    case 'crate':
      return { at: PLACES.crate, event: 'crate_impact' };
    case 'door':
      return { at: PLACES.door, event: 'door_open' };
    default:
      return null;
  }
}

/** Is the selected source behind the listener's ears (more than 90° from
 *  straight ahead)? Only the PLAYER listener has a front and a back here;
 *  null when there is nothing to say. */
export function gaSelectedBehind(s: GaState, select: GaSceneSelect): boolean | null {
  const sel = gaSelected(select);
  if (!sel || s.listenerMode !== 'player') return null;
  const L = listenerOf(s);
  if (Math.hypot(sel.at.x - L.x, sel.at.y - L.y) < 0.05) return null;
  return Math.abs(bearing(L, sel.at)) > 90;
}

/* ── labels that never leave the picture ────────────────────────────────── */

export type GaBox = { x0: number; y0: number; x1: number; y1: number };

/** The box of one line of label text: `cx` its centre, `baseline` its
 *  baseline, `w` its width and `size` its font size (all meters). */
export const gaTextBox = (cx: number, baseline: number, w: number, size: number): GaBox => ({ x0: cx - w / 2, x1: cx + w / 2, y0: baseline - size * 0.92, y1: baseline + size * 0.22 });
export const gaBoxesHit = (a: GaBox, b: GaBox, pad = 0.06): boolean => a.x0 < b.x1 + pad && a.x1 > b.x0 - pad && a.y0 < b.y1 + pad && a.y1 > b.y0 - pad;
const inside = (b: GaBox, f: GaBox): boolean => b.x0 >= f.x0 && b.x1 <= f.x1 && b.y0 >= f.y0 && b.y1 <= f.y1;

/** Where a label may be printed: the courtyard's ground and the workshop's
 *  floor, clear of the picture's edge and of every wall (text on the grey
 *  wall cannot be read). */
export const GA_LABEL_AREAS: readonly GaBox[] = [
  { x0: 0.15, y0: 0.1, x1: WALL_X - 0.24, y1: WORLD_H - 0.1 },
  { x0: WALL_X + 0.24, y0: 0.4, x1: WORLD_W - 0.4, y1: WORLD_H - 0.4 },
];
export const gaBoxFree = (b: GaBox, avoid: readonly GaBox[] = []): boolean => GA_LABEL_AREAS.some((f) => inside(b, f)) && !avoid.some((a) => gaBoxesHit(a, b));

/** Move a centred label sideways until its whole width is in the picture. */
export function gaClampLabelX(cx: number, w: number): number {
  const half = w / 2;
  if (w >= WORLD_W - 0.4) return WORLD_W / 2;
  return Math.max(0.2 + half, Math.min(WORLD_W - 0.2 - half, cx));
}

/** A spot for a label of `w` by `h` meters beside a ring of radius `r`
 *  around `c`: just outside it, or just inside. Tries every 5° and keeps the
 *  free spot that `prefer` scores highest; null when no spot is free. */
export function gaRingLabelSpot(o: { c: GaPoint; r: number; w: number; h: number; side: 'outside' | 'inside'; avoid: readonly GaBox[]; prefer: (p: GaPoint, angleDeg: number) => number }): { cx: number; cy: number; box: GaBox } | null {
  let best: { cx: number; cy: number; box: GaBox } | null = null;
  let bestScore = -Infinity;
  for (let n = 0; n < 72; n++) {
    const deg = n * 5;
    const a = (deg * Math.PI) / 180;
    // 0° = straight up the picture, clockwise
    const ux = Math.sin(a);
    const uy = -Math.cos(a);
    const reach = Math.abs(ux) * (o.w / 2) + Math.abs(uy) * (o.h / 2) + 0.14;
    const d = o.side === 'outside' ? o.r + reach : o.r - reach;
    if (d <= 0) continue;
    const cx = o.c.x + ux * d;
    const cy = o.c.y + uy * d;
    const box = { x0: cx - o.w / 2, x1: cx + o.w / 2, y0: cy - o.h / 2, y1: cy + o.h / 2 };
    if (!gaBoxFree(box, o.avoid)) continue;
    const score = o.prefer({ x: o.c.x + ux * o.r, y: o.c.y + uy * o.r }, deg);
    if (score > bestScore) {
      bestScore = score;
      best = { cx, cy, box };
    }
  }
  return best;
}

export type GaRangeLabel = { tone: 'min' | 'max'; text: string; cx: number; baseline: number; box: GaBox };

/** Is any part of a ring of radius `r` around `c` inside the picture? */
export function gaRingInPicture(c: GaPoint, r: number): boolean {
  const far = Math.max(Math.hypot(c.x, c.y), Math.hypot(WORLD_W - c.x, c.y), Math.hypot(c.x, WORLD_H - c.y), Math.hypot(WORLD_W - c.x, WORLD_H - c.y));
  const dx = Math.max(0, -c.x, c.x - WORLD_W);
  const dy = Math.max(0, -c.y, c.y - WORLD_H);
  return r <= far && r >= Math.hypot(dx, dy);
}

/** The MIN and MAX labels of the selected source, placed where they are
 *  WHOLE inside the picture (audit 2, W1 F02: the generator's MIN label was
 *  cut off at the right edge). House rule: a cropped readout drops its
 *  label, never its number, so where "MIN 4 m" has no room, "4 m" is tried.
 *  A maximum ring that lies wholly beyond the picture still prints its
 *  number, and says so. `measure` gives a text's width in meters. */
export function gaRangeLabels(o: { at: GaPoint; min: number; max: number; listener: GaPoint; size: number; measure: (text: string) => number; avoid: readonly GaBox[] }): GaRangeLabel[] {
  const out: GaRangeLabel[] = [];
  const h = o.size * 1.14;
  const avoid = [...o.avoid];
  const line = (tone: 'min' | 'max', text: string, cx: number, cy: number): GaRangeLabel => {
    const w = o.measure(text);
    const baseline = cy + o.size * 0.35;
    return { tone, text, cx, baseline, box: { x0: cx - w / 2, x1: cx + w / 2, y0: cy - h / 2, y1: cy + h / 2 } };
  };
  // up the picture first, then whichever side is nearest to "up"
  const up = (_p: GaPoint, deg: number) => -Math.min(deg, 360 - deg);
  const near = (p: GaPoint) => {
    const d = Math.hypot(p.x - o.listener.x, p.y - o.listener.y);
    return d >= 2.1 ? 100 - d : d;
  };
  const place = (tone: 'min' | 'max', r: number, texts: string[], sides: ('outside' | 'inside')[], prefer: (p: GaPoint, deg: number) => number): GaRangeLabel | null => {
    for (const text of texts) {
      for (const side of sides) {
        const spot = gaRingLabelSpot({ c: o.at, r, w: o.measure(text), h, side, avoid, prefer });
        if (spot) return line(tone, text, spot.cx, spot.cy);
      }
    }
    return null;
  };
  const min = place('min', o.min, [`MIN ${o.min} m`, `${o.min} m`], ['outside', 'inside'], up);
  if (min) {
    out.push(min);
    avoid.push(min.box);
  }
  if (gaRingInPicture(o.at, o.max)) {
    const max = place('max', o.max, [`MAX ${o.max} m`, `${o.max} m`], ['inside', 'outside'], near);
    if (max) out.push(max);
  } else {
    // the whole ring is beyond the picture: the number is still printed, on
    // a free line (under the MIN label first)
    const texts = [`MAX ${o.max} m · BEYOND THE PICTURE`, `MAX ${o.max} m`];
    const spots: GaPoint[] = [];
    if (min) spots.push({ x: min.cx, y: (min.box.y0 + min.box.y1) / 2 + h }, { x: min.cx, y: (min.box.y0 + min.box.y1) / 2 - h });
    for (const y of [0.1 + h / 2, WORLD_H - 1.1, WORLD_H / 2 - 2.2, WORLD_H / 2 + 2.2]) spots.push({ x: WALL_X / 2, y }, { x: (WALL_X + WORLD_W) / 2, y: Math.max(0.4 + h / 2, Math.min(WORLD_H - 0.4 - h / 2, y)) });
    done: for (const text of texts) {
      const w = o.measure(text);
      for (const sp of spots) {
        for (const cx of [sp.x, Math.max(0.15 + w / 2, Math.min(WALL_X - 0.24 - w / 2, sp.x)), Math.max(WALL_X + 0.24 + w / 2, Math.min(WORLD_W - 0.4 - w / 2, sp.x))]) {
          const cand = line('max', text, cx, sp.y);
          if (gaBoxFree(cand.box, avoid)) {
            out.push(cand);
            break done;
          }
        }
      }
    }
  }
  return out;
}

export type GaPlacedLine = { cx: number; baseline: number; box: GaBox };

/** A person's label sits under the figure; where that would land on another
 *  label or leave the picture, above it. Its width is always kept inside.
 *  `note` is a second line (the words by the foot that stepped): it sits one
 *  line further from the figure, and the two are placed together, so neither
 *  lands on another label. */
export function gaPersonLabel(c: GaPoint, w: number, size: number, others: readonly GaBox[], note?: { w: number; size: number }): GaPlacedLine & { note?: GaPlacedLine } {
  const cx = gaClampLabelX(c.x, w);
  const line = (x: number, baseline: number, width: number, sz: number): GaPlacedLine => ({ cx: x, baseline, box: gaTextBox(x, baseline, width, sz) });
  const make = (side: 1 | -1) => {
    const name = line(cx, side > 0 ? c.y + 1.45 : c.y - 0.98, w, size);
    if (!note) return name;
    const nx = gaClampLabelX(c.x, note.w);
    const nb = side > 0 ? name.baseline + note.size * 1.18 : name.baseline - size * 1.18;
    return { ...name, note: line(nx, nb, note.w, note.size) };
  };
  const bad = (q: GaPlacedLine & { note?: GaPlacedLine }) =>
    // 0.3 m from the top and bottom edge: clear of the workshop's walls and of the MOOD border
    [q, ...(q.note ? [q.note] : [])].some((l) => l.box.y1 > WORLD_H - 0.3 || l.box.y0 < 0.3 || others.some((b) => gaBoxesHit(b, l.box)));
  const below = make(1);
  const above = make(-1);
  return bad(below) && !bad(above) ? above : below;
}

/* ── in words ───────────────────────────────────────────────────────────── */

const list = (names: string[]): string => [...new Set(names)].join(', ');

/** In words, for a screen reader: what is where and what is sounding, and
 *  what is NOT heard and why (silenced, virtual, stolen). US spelling. */
export function gaSceneSummary(s: GaState, now: number = s.t): string {
  const L = listenerOf(s);
  const p = s.chars.player;
  const where = p.x >= WALL_X ? 'in the workshop' : 'in the courtyard';
  const all = gaSoundingOf(s, now);
  const heard = all.filter(gaHeard);
  const clear = heard.filter((x) => !x.muffled).map((x) => x.name);
  const wall = heard.filter((x) => x.muffled).map((x) => x.name);
  const silenced = all.filter((x) => !x.virtual && x.muted).map((x) => x.name);
  const stolen = all.filter((x) => x.virtual && x.stolen).map((x) => x.name);
  const virtual = all.filter((x) => x.virtual && !x.stolen).map((x) => x.name);
  const speaking = s.inst.some((i) => i.event === 'vo_greeting' || i.event === 'vo_warning');
  return (
    `A courtyard on the left and a workshop on the right, seen from above. You are ${where}, facing ${Math.round(p.facing)} degrees. ` +
    `The door is ${s.doorOpen ? 'open' : 'closed'}. The listener is ${s.listenerMode === 'camera' ? 'an overhead camera' : 'the player'} at ${L.x.toFixed(1)}, ${L.y.toFixed(1)} meters. ` +
    (heard.length ? `Sounding now: ${list([...clear, ...wall.map((n) => `${n} (through the closed door)`)])}.` : 'Nothing positioned is sounding.') +
    (silenced.length ? ` Silenced by the mix: ${list(silenced)}.` : '') +
    (virtual.length ? ` Out of range, tracked but not played (virtual): ${list(virtual)}.` : '') +
    (stolen.length ? ` No voice because of the budget (stolen or waiting for a voice): ${list(stolen)}.` : '') +
    (s.mood === 'alert' ? ' The mood is alert.' : '') +
    (speaking ? ' The guide is speaking a line.' : '')
  );
}

/* ── the glass: the scene and the strip under it ────────────────────────── */

export const GA_SCENE_W_OVER_H = WORLD_W / WORLD_H;
/** The scene sits this far inside the glass on every side. */
export const GA_GLASS_PAD = 2;
/** In FULL SCREEN the strip grows with the picture (owner rule D35:
 *  everything zooms): its height is this share of the scene's width, which
 *  is GA_HUD_H at a phone's glass width (360) and more at every zoom step. */
const HUD_SHARE = GA_HUD_H / 360;
/** The shape of scene + strip together, for the full-screen view: a canvas
 *  of this shape holds the scene at its own 16:10 with the strip under it,
 *  so the picture is never made smaller to pay for the strip. */
export const GA_SPLIT_ASPECT = 1 / (1 / GA_SCENE_W_OVER_H + HUD_SHARE);

/** How a glass of `w` by `h` points is divided between the scene and the
 *  instrument strip. `full` = the FULL SCREEN view. The scene keeps its own
 *  aspect and is centered in the part above the strip; the strip takes the
 *  whole width. */
export function gaGlassSplit(w: number, h: number, hasHud: boolean, full: boolean): { hudH: number; sceneH: number; sceneW: number; sceneDrawH: number } {
  const hudH = !hasHud ? 0 : full ? Math.max(GA_HUD_H, Math.round((w - GA_GLASS_PAD * 2) * HUD_SHARE)) : GA_HUD_H;
  const sceneH = Math.max(40, h - hudH);
  // the widest 16:10 that fits what is left, as the rack's StageFit centers it
  const sceneW = Math.max(40, Math.min(w - GA_GLASS_PAD * 2, (sceneH - GA_GLASS_PAD * 2) * GA_SCENE_W_OVER_H));
  return { hudH, sceneH, sceneW, sceneDrawH: sceneW / GA_SCENE_W_OVER_H };
}

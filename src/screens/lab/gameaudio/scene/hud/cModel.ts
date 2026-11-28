/**
 * cModel — what the MIX, VOICES and NET strips and the TOOL-WINDOW stage read
 * from the Game Audio model. Pure TypeScript: no React Native, no clock of its
 * own (test/gameAudioHudC.test.ts drives it with the lab's reducer).
 *
 * THE TRUTH RULE (gaHudTypes.ts). Everything here is a reading of GaState.
 * A level is the model's COMPUTED level: the voice's own level and speed
 * shape, its bus (fader, mute, solo, the duck), distance and the wall, then
 * the lab LEVEL. It is computed, never measured, and the displays say so.
 *
 * ONE PLACE EACH. The numbers are the model's own: `cBusMeters` reads its
 * `gaBusMeter`, `cVoiceBoard` and `cSeatStep` read its `gaVoiceSlots` (the
 * model seats the voices: a voice keeps its slot while it sounds, and a sound
 * that steals takes the slot it freed). The drawings read the types in this
 * file and nothing else.
 *
 *   cBusMeters        one reading per bus: level, fader, duck, mute, solo
 *   cVoiceBoard       the budget slot by slot, the loops waiting for a voice
 *   cSeatStep         the strip's memory: which slots just changed hands
 *   cStolenBetween    whose voice was taken between two states
 *   cNetBoard         the actions on their way and what became of each
 *   cPacketAt         where a packet is between `sent` and `due`
 *   cToolsStage       the eight windows and the chosen tool's own words
 *   cToolsLive        what the windows show of the scene right now
 */
import type { GaBus } from '../../engine/gaEngineProtocol.ts';
import { GA_BUS_NAME, GA_DUCK_ATTACK_S, GA_DUCK_RELEASE_S, GA_EVENTS, type GaEventId } from '../../model/gaDefs.ts';
import { busOf, gaBusMeter, gaMusicClock, gaVoiceOut, gaVoiceSlots, surfaceOf, type GaLogEntry, type GaNetFlight, type GaState, type GaVoice } from '../../model/gaModel.ts';
import { GA_TOOLS, GA_TOOL_MAP, GA_TOOL_NONE, GA_TOOL_WINDOWS, type GaToolId, type GaToolWindow } from '../../pages/data/gaToolMap.ts';
import { netFlightKey } from '../../pages/data/gaNet.ts';
import { gaAsset } from '../../sounds/gaSoundBank.ts';
import { MUSIC_BARS, MUSIC_BEATS_PER_BAR, MUSIC_BPM, type GaMusicLayer } from '../../sounds/gaSynth.ts';

/* ── levels ─────────────────────────────────────────────────────────────── */

/** The meters' scale, in dB. 0 dB is one sound at its full level on a bus at
 *  0 dB; the top 6 dB is where a raised fader or several sounds together go. */
export const C_METER_MIN_DB = -42;
export const C_METER_MAX_DB = 6;
/** The window the house loudness colors are spread over: the same one the
 *  scene's rings use, so a source's rings and its bus meter agree. */
export const C_COLOR_MIN_DB = -36;
export const C_COLOR_MAX_DB = 0;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
/** Below this (linear) the model calls a level silent. */
const SILENT = 0.001;

/** Where a dB value sits on the meter, 0 (left end) … 1 (right end). */
export const cMeterFrac = (db: number | null): number => (db == null ? 0 : clamp01((db - C_METER_MIN_DB) / (C_METER_MAX_DB - C_METER_MIN_DB)));

/** One voice's computed level at the output at scene time `t`, in dB (the
 *  model's `gaVoiceOut`); null = silent, and still a voice. */
export function cVoiceDb(s: GaState, v: GaVoice, t: number = s.t): number | null {
  const o = gaVoiceOut(s, v, t);
  return o.gain > SILENT ? o.db : null;
}

/* ── the mix strip ──────────────────────────────────────────────────────── */

export type CBusMeter = {
  bus: GaBus;
  /** The word on the page's controls (AMBIENCE, EFFECTS …). */
  label: string;
  /** The computed level of everything on this bus now, in dB; null = nothing
   *  is sounding on it (or the mix has silenced it). */
  db: number | null;
  /** Where the bus fader sits, in dB. */
  faderDb: number;
  /** The duck's reduction on this bus NOW, in dB: 0, or a negative number
   *  while a line speaks. */
  duckDb: number;
  /** Nothing passes: it is muted, or another bus is soloed. */
  silenced: 'mute' | 'solo' | null;
  /** This bus is the soloed one. */
  solo: boolean;
  /** How many sounds feed it now (voices; music layers that are on). */
  sources: number;
};

/** One reading per bus, in the model's order, at scene time `t`. THE ONE
 *  PLACE the strip reads the model's `gaBusMeter`. */
export function cBusMeters(s: GaState, t: number = s.t): CBusMeter[] {
  return gaBusMeter(s, t).map((m) => ({
    bus: m.bus,
    label: m.name,
    db: m.silenced || !(m.gain > SILENT) ? null : m.db,
    faderDb: m.faderDb,
    duckDb: m.silenced ? 0 : m.duckDb,
    silenced: m.silenced,
    solo: s.bus[m.bus].solo && !m.silenced,
    sources: m.voices,
  }));
}

/** The scene time until which the meters go on changing with no new action:
 *  a delayed layer has yet to begin, the beds are still crossfading, or a bus
 *  or the lab LEVEL is still on the ramp the model gave it (the duck's attack
 *  and release, a fader move). null = nothing is on its way.
 *
 *  The model reads a ramp at a TIME: at the moment of a change (`state.t`)
 *  a bus is still where the ramp starts. A display that does not follow the
 *  clock here would show the duck one change late. */
export function cMetersSettleAt(s: GaState): number | null {
  let at: number | null = null;
  const until = (end: number) => {
    if (end > s.t) at = Math.max(at ?? 0, end);
  };
  for (const v of s.voices) if (v.state !== 'virtual' && v.delayS > 0) until(v.born + v.delayS);
  const f = s.bedFade;
  if (f && f.ramp > 0) until(f.at + f.ramp);
  for (const r of Object.values(s.busRamp ?? {})) if (r && r.ramp > 0) until(r.at + r.ramp);
  const m = s.masterRamp;
  if (m && m.ramp > 0) until(m.at + m.ramp);
  return at;
}

/** How long the duck takes to move between two reductions, in seconds: the
 *  model's own attack (going down) and release (coming back). */
export const cDuckRampS = (fromDb: number, toDb2: number): number => (Math.abs(toDb2) > Math.abs(fromDb) ? GA_DUCK_ATTACK_S : GA_DUCK_RELEASE_S);

/** A straight ramp from `from` at t0 to `to` at t0 + dur, read at `now`. */
export function cRamp(from: number, to: number, t0: number, dur: number, now: number): number {
  if (!(dur > 0) || now >= t0 + dur) return to;
  if (now <= t0) return from;
  return from + ((to - from) * (now - t0)) / dur;
}

/** "−10 dB" with a true minus sign; whole decibels. */
export function cDbWord(db: number, unit = true): string {
  const r = Math.round(db);
  const n = r > 0 ? `+${r}` : r < 0 ? `−${Math.abs(r)}` : '0';
  return unit ? `${n} dB` : n;
}

/** The strip in words, for a screen reader, at scene time `t` (the strip
 *  passes the time it draws). */
export function cMixSpoken(s: GaState, selected?: string, t: number = s.t): string {
  const parts = cBusMeters(s, t).map((m) => {
    const name = m.label.toLowerCase();
    if (m.silenced === 'mute') return `${name}: muted`;
    if (m.silenced === 'solo') return `${name}: silent, because another bus is soloed`;
    const level = m.db == null ? 'nothing playing' : `computed level ${cDbWord(m.db)}`;
    return `${name}: ${level}, fader ${cDbWord(m.faderDb)}${m.solo ? ', soloed' : ''}${m.duckDb <= -0.5 ? `, ducked ${cDbWord(m.duckDb)}` : ''}${m.bus === selected ? ', the bus on the BUS key' : ''}`;
  });
  return `Bus meters. Levels are computed by the scene, not measured. ${parts.join('. ')}.`;
}

/* ── the voices strip ───────────────────────────────────────────────────── */

export type CVoiceName = { name: string; short: string; spoken: string };

/** What holds a voice, short enough for a slot. `short` fits beside the
 *  priority number when sixteen slots are shown. */
export function cVoiceName(event: GaEventId, layer: string, owner: string): CVoiceName {
  const second = owner === 'generator-2';
  switch (event) {
    case 'footstep':
      return { name: 'STEP', short: 'STEP', spoken: 'a footstep' };
    case 'door_open':
      return layer === 'rattle' ? { name: 'LATCH', short: 'LATCH', spoken: 'the door’s latch rattle' } : { name: 'DOOR', short: 'DOOR', spoken: 'the door' };
    case 'generator':
      return layer === 'fan'
        ? { name: second ? 'GEN 2 FAN' : 'GEN FAN', short: second ? 'FAN 2' : 'FAN', spoken: `the fan of generator ${second ? 2 : 1}` }
        : { name: second ? 'GEN 2 HUM' : 'GEN HUM', short: second ? 'HUM 2' : 'HUM', spoken: `the hum of generator ${second ? 2 : 1}` };
    case 'fountain':
      return { name: 'FOUNTAIN', short: 'FOUNT', spoken: 'the fountain' };
    case 'bed_room':
      return { name: 'ROOM TONE', short: 'ROOM', spoken: 'the room tone' };
    case 'bed_yard':
      return { name: 'WIND', short: 'WIND', spoken: 'the courtyard wind' };
    case 'crate_impact':
      return layer === 'debris' ? { name: 'DEBRIS', short: 'DEBR', spoken: 'crate debris' } : { name: 'CRATE', short: 'CRATE', spoken: 'a crate impact' };
    case 'alarm':
      return { name: 'ALARM', short: 'ALARM', spoken: 'the overheat alarm' };
    case 'ui_confirm':
      return { name: 'UI CUE', short: 'UI', spoken: 'an interface cue' };
    case 'ui_deny':
      return { name: 'UI DENY', short: 'DENY', spoken: 'an interface cue' };
    case 'vo_greeting':
      return { name: 'GREETING', short: 'GREET', spoken: 'the guide’s greeting' };
    case 'vo_warning':
      return { name: 'WARNING', short: 'WARN', spoken: 'the guide’s warning line' };
    case 'chat':
      return { name: 'CHAT', short: 'CHAT', spoken: 'the chat line' };
    case 'bird':
      return { name: 'BIRD', short: 'BIRD', spoken: 'a bird call' };
    case 'stinger':
      return { name: 'STINGER', short: 'STING', spoken: 'the music stinger' };
    default: {
      const label = String((GA_EVENTS as Record<string, { label?: string }>)[event]?.label ?? event).toUpperCase();
      return { name: label.slice(0, 9), short: label.slice(0, 5), spoken: label.toLowerCase() };
    }
  }
}

export type CSlot = CVoiceName & {
  v: string;
  inst: string;
  bus: GaBus;
  priority: number;
  protected: boolean;
  /** requested = asked of the engine, no answer yet. */
  state: 'playing' | 'requested';
  /** Its computed level now, in dB; null = silent (and still a voice). */
  db: number | null;
  /** A generator's loop whose generator was REMOVED and nothing stopped it
   *  (page 19's fault 5): it plays with no owner. GA2 B-10: the strip that
   *  is meant to show the orphan said nothing about it. */
  orphan: boolean;
};
export type CWaiting = CVoiceName & { v: string; priority: number };
export type CVoiceBoard = {
  /** The budget. 0 = no limit. */
  limit: number;
  /** The budget slot by slot, as the MODEL seats it: the voice that holds
   *  each slot, or null for a free one. A voice keeps its slot while it
   *  sounds, and a sound that steals takes the slot it freed. */
  seats: (CSlot | null)[];
  /** Slots in use. Never more than the budget. */
  used: number;
  /** Loops whose voice the budget took: tracked, silent, waiting for a voice. */
  waiting: CWaiting[];
  /** Loops beyond their maximum distance: tracked, and asking for no voice. */
  far: number;
};

/** The budget as the strip draws it. THE ONE PLACE the strip reads the
 *  model's `gaVoiceSlots`. */
export function cVoiceBoard(s: GaState, t: number = s.t): CVoiceBoard {
  const b = gaVoiceSlots(s);
  const byId = new Map(s.voices.map((v) => [v.v, v]));
  const owners = new Set(s.machines.map((m) => m.id));
  const seats = b.slots.map((x): CSlot | null => {
    if (!x) return null;
    const v = byId.get(x.v);
    return {
      ...cVoiceName(x.event, v?.layer ?? '', x.owner),
      v: x.v,
      inst: x.inst,
      bus: x.bus,
      priority: x.priority,
      protected: x.protected,
      state: x.state === 'requested' ? 'requested' : 'playing',
      db: v ? cVoiceDb(s, v, t) : null,
      orphan: cOrphan(x.event, x.owner, owners),
    };
  });
  const waiting: CWaiting[] = [];
  let far = 0;
  for (const x of b.out) {
    // stolen by the budget, or refused a voice at its start: both wait for a slot
    if (x.state !== 'stolen' && x.state !== 'waiting') {
      far += 1;
      continue;
    }
    waiting.push({ ...cVoiceName(x.event, byId.get(x.v)?.layer ?? '', x.owner), v: x.v, priority: x.priority });
  }
  return { limit: b.limit, seats, used: b.used, waiting, far };
}

/** A generator's sound whose generator is no longer in the scene (the model
 *  logs it as an ORPHAN, "still playing with no owner"). */
export const cOrphan = (event: string, owner: string | undefined, machines: ReadonlySet<string>): boolean => event === 'generator' && owner != null && !machines.has(owner);

/** How many slots the strip can draw: the budget's largest stop. */
export const C_SLOTS_MAX = 16;
/** Slots drawn for this budget (no limit draws the largest stop's worth). */
export const cCapacity = (limit: number): number => (limit > 0 ? Math.min(C_SLOTS_MAX, limit) : C_SLOTS_MAX);

const soundingIds = (s: GaState): string[] => s.voices.filter((v) => v.state !== 'virtual' && !v.music).map((v) => v.v);

/**
 * WHOSE VOICE WAS TAKEN between two states (the ids as `prev` knew them).
 * Two signs, both the model's own: a LOOP now marked `stolen` (it waits,
 * virtual), and a log line of this step that says a voice was STOLEN from an
 * instance whose voice is gone.
 */
export function cStolenBetween(prev: GaState, next: GaState): string[] {
  const was = prev.voices.filter((v) => v.state !== 'virtual' && !v.music);
  if (!was.length) return [];
  const now = new Map(next.voices.map((v) => [v.v, v]));
  const nowSounding = new Set(soundingIds(next));
  const robbed = new Set<string>();
  for (const e of next.log) {
    if (e.n > prev.logN && e.kind === 'stop' && e.inst && /STOLEN/.test(e.text)) robbed.add(e.inst);
  }
  const out: string[] = [];
  for (const v of was) {
    if (nowSounding.has(v.v)) continue;
    const after = now.get(v.v);
    if (after?.stolen || robbed.has(v.inst)) out.push(v.v);
  }
  return out;
}

/** How long a slot that changed hands keeps its STOLEN mark, in scene
 *  seconds (it also goes when the slot changes hands again). */
export const C_STOLEN_MARK_S = 1.6;

export type CSeating = {
  /** The voice in each slot the strip draws (cCapacity long). */
  seats: (string | null)[];
  /** Voices with no slot on the strip (no limit, more than sixteen sound). */
  over: number;
  /** Slot → the scene time its voice was taken and the slot changed hands. */
  taken: Record<number, number>;
};

/** One step of the strip's memory: the model's seating for `next`, and a
 *  mark on each slot whose voice was stolen in this step and which a new
 *  sound now holds. */
export function cSeatStep(prev: { state: GaState; seating: CSeating } | null, next: GaState): CSeating {
  const cap = cCapacity(next.voiceLimit);
  const slots = gaVoiceSlots(next).slots;
  const seats: (string | null)[] = Array.from({ length: cap }, (_, k) => slots[k]?.v ?? null);
  const over = slots.slice(cap).filter((x) => x != null).length;
  if (!prev) return { seats, over, taken: {} };
  const stolen = new Set(cStolenBetween(prev.state, next));
  const taken: Record<number, number> = {};
  for (const [k, at] of Object.entries(prev.seating.taken)) {
    const i = Number(k);
    if (i < cap && next.t - at < C_STOLEN_MARK_S && seats[i] != null && seats[i] === prev.seating.seats[i]) taken[i] = at;
  }
  prev.seating.seats.forEach((v, i) => {
    if (v != null && stolen.has(v) && i < cap && seats[i] != null && seats[i] !== v) taken[i] = next.t;
  });
  return { seats, over, taken };
}

/** The strip in words, for a screen reader. */
export function cVoicesSpoken(s: GaState, refused: number): string {
  const b = cVoiceBoard(s);
  const held = b.seats.filter((x): x is CSlot => x != null).map((x) => `${x.spoken}, priority ${x.priority}${x.protected ? ', protected' : ''}${x.orphan ? ', an orphan with no owner: its generator was removed' : ''}`);
  const budget = b.limit ? `The budget is ${b.limit} ${b.limit === 1 ? 'voice' : 'voices'}` : 'There is no voice limit';
  return (
    `Voice slots. ${budget}; ${b.used} ${b.used === 1 ? 'is' : 'are'} in use${held.length ? `: ${held.join('; ')}` : ''}.` +
    // GA2 B-08: a loop also waits when BUDGET was lowered, which is not a theft, so the cause is not claimed
    (b.waiting.length ? ` Waiting for a voice: ${b.waiting.map((w) => w.spoken).join(', ')}.` : '') +
    ` Refused on this visit: ${refused}.`
  );
}

/* ── the net strip ──────────────────────────────────────────────────────── */

/** What one machine did with an action: pending = still on its way; plays =
 *  it played the sound for its own listener; ignored = the id was already
 *  handled; nothing = the action is not for this machine's player; dropped =
 *  ■ STOP withdrew it on its way, so it never arrived (bug test GA2 B-02). */
export type CNetEnd = 'pending' | 'plays' | 'ignored' | 'nothing' | 'dropped';

export type CPacket = {
  key: string;
  id: string;
  /** DOOR or ALERT. */
  what: string;
  to: GaNetFlight['to'];
  sent: number;
  due: number;
  landed: boolean;
  /** Does a copy travel to your machine / to the other machine? */
  toYou: boolean;
  toOther: boolean;
  here: CNetEnd;
  /** The same rule read from the other player's side (pages/data/gaNet). */
  there: CNetEnd;
  /** This id had already been handled, and it played again on your machine:
   *  a second sound for one action. */
  double: boolean;
  /** The same on the other machine (the same rule, from its side). */
  doubleThere: boolean;
  /** It was on its way and the model let it go without it landing: ■ STOP
   *  dropped it (the model removes a withdrawn action from its list and
   *  writes no record of it, so only the strip's memory knows). */
  dropped: boolean;
};

export type CNetBoard = {
  /** False while the model has no record of actions on their way. */
  known: boolean;
  packets: CPacket[];
  /** The delay the packets take, in seconds (from the newest); null = none yet. */
  delayS: number | null;
  idCheck: boolean;
};

const hereOf = (f: GaNetFlight): CNetEnd => {
  const toYou = f.to !== 'them';
  if (!toYou) return 'nothing';
  return f.result === 'pending' ? 'pending' : f.result === 'ignored' ? 'ignored' : 'plays';
};

/** WHEN each action id was FIRST handled (id → the scene time that delivery
 *  was sent). The strip keeps this for as long as it is on screen, because
 *  the model forgets a landed action after a few seconds and a double can
 *  arrive later than that. Returns `first` itself if nothing new. */
export function cNetRemember(first: ReadonlyMap<string, number>, s: GaState): ReadonlyMap<string, number> {
  let out: Map<string, number> | null = null;
  for (const f of s.netFlights ?? []) {
    if (f.result !== 'played' && f.result !== 'other') continue;
    const was = (out ?? first).get(f.id);
    if (was != null && was <= f.sent) continue;
    out = out ?? new Map(first);
    out.set(f.id, f.sent);
  }
  return out ?? first;
}

/** The actions on their way and just landed, oldest first. `first` is the
 *  strip's memory (cNetRemember); without it a double is known only while
 *  both deliveries are still in the model's list. */
export function cNetBoard(s: GaState, first: ReadonlyMap<string, number> = new Map()): CNetBoard {
  const flights = s.netFlights;
  if (!flights) return { known: false, packets: [], delayS: null, idCheck: s.options.dedupe };
  const known = cNetRemember(first, s);
  const packets: CPacket[] = [...flights]
    .sort((a, b) => a.n - b.n)
    .map((f) => {
      const landed = f.result !== 'pending';
      const toYou = f.to !== 'them';
      const toOther = f.to !== 'me';
      const here = hereOf(f);
      const there: CNetEnd = !toOther ? 'nothing' : !landed ? 'pending' : f.result === 'ignored' ? 'ignored' : 'plays';
      const firstSent = known.get(f.id);
      const again = firstSent != null && firstSent < f.sent;
      return { key: netFlightKey(f), id: f.id, what: String(f.what).toUpperCase(), to: f.to, sent: f.sent, due: f.due, landed, toYou, toOther, here, there, double: again && here === 'plays', doubleThere: again && there === 'plays', dropped: false };
    });
  const last = packets[packets.length - 1];
  return { known: true, packets, delayS: last ? Math.max(0, last.due - last.sent) : null, idCheck: s.options.dedupe };
}

/** How many landed deliveries the strip keeps on screen. */
export const C_NET_KEEP = 4;

/**
 * The strip's memory of what LANDED. The model forgets a landed action a few
 * seconds after it lands; the strip keeps the last few (by the page's own
 * key, number plus send time, because the model reuses numbers once its list
 * empties), so the result stays on screen until the next action replaces it.
 * Returns `prev` itself when nothing changed.
 */
export function cNetKeep(prev: readonly CPacket[], board: CNetBoard, wasFlying: readonly CPacket[] = []): readonly CPacket[] {
  const landed = board.packets.filter((p) => p.landed);
  const dropped = cNetDropped(wasFlying, board);
  if (!landed.length && !dropped.length) return prev;
  const byKey = new Map(prev.map((p) => [p.key, p]));
  let changed = false;
  for (const p of dropped) {
    if (byKey.get(p.key)?.dropped) continue;
    byKey.set(p.key, p);
    changed = true;
  }
  for (const p of landed) {
    const was = byKey.get(p.key);
    if (was && was.here === p.here && was.there === p.there && was.double === p.double && was.doubleThere === p.doubleThere) continue;
    byKey.set(p.key, p);
    changed = true;
  }
  if (!changed) return prev;
  return [...byKey.values()].sort((a, b) => a.sent - b.sent).slice(-C_NET_KEEP);
}

/** The packets that were on their way (`wasFlying`, the strip's last
 *  board) and are gone from `board` without landing: dropped by ■ STOP. Each
 *  reads DROPPED at the machine it was travelling to. */
export function cNetDropped(wasFlying: readonly CPacket[], board: CNetBoard): CPacket[] {
  if (!wasFlying.length) return [];
  const now = new Set(board.packets.map((p) => p.key));
  return wasFlying
    .filter((p) => !p.landed && !p.dropped && !now.has(p.key))
    .map((p) => ({ ...p, dropped: true, here: p.toYou ? 'dropped' : 'nothing', there: p.toOther ? 'dropped' : 'nothing', double: false, doubleThere: false }));
}

/** Where a packet is on the wire: 0 at `sent`, 1 at `due`. */
export function cPacketAt(p: { sent: number; due: number }, now: number): number {
  const span = p.due - p.sent;
  if (!(span > 0)) return now >= p.due ? 1 : 0;
  return clamp01((now - p.sent) / span);
}

export const C_NET_WORD: Record<CNetEnd, string> = { pending: 'ON ITS WAY', plays: 'PLAYED', ignored: 'IGNORED', nothing: 'NOT SENT HERE', dropped: 'DROPPED' };

/** The strip in words, for a screen reader. */
export function cNetSpoken(s: GaState, kept: readonly CPacket[] = [], first?: ReadonlyMap<string, number>): string {
  const board = cNetBoard(s, first);
  // what the strip still shows after the model has let a landed action go
  // ... and an action ■ STOP dropped on its way, which the model no longer lists at all
  const droppedKept = kept.filter((p) => p.dropped && !board.packets.some((q) => q.key === p.key));
  const b = { ...board, packets: board.packets.length ? [...board.packets, ...droppedKept].sort((x, y) => x.sent - y.sent) : [...kept] };
  const check = `The I D check is ${b.idCheck ? 'on' : 'off'}.`;
  if (!b.packets.length) return `Network: your machine, the network, the other machine. No action has been sent yet. ${check}`;
  const say = (e: CNetEnd) => (e === 'pending' ? 'on its way' : e === 'plays' ? 'played' : e === 'ignored' ? 'ignored as a duplicate' : e === 'dropped' ? 'dropped by stop before it arrived, so nothing played' : 'not sent there');
  const lines = b.packets.slice(-3).map((p) => `Action ${p.id}, ${p.what.toLowerCase()}: your machine, ${say(p.here)}${p.double ? ' a second time, a double' : ''}; the other machine, ${say(p.there)}${p.doubleThere ? ' a second time, a double' : ''}`);
  const delay = b.delayS ?? (b.packets.length ? Math.max(0, b.packets[b.packets.length - 1].due - b.packets[b.packets.length - 1].sent) : null);
  return `Network: your machine, the network, the other machine. ${lines.join('. ')}.${delay != null ? ` A message takes ${delay.toFixed(2)} seconds to arrive.` : ''} ${check}`;
}

/* ── the tool-window stage ──────────────────────────────────────────────── */

/** Which of the lab's twelve ideas live in which kind of window. Every idea
 *  is placed once; the music editor and the audition window hold none of the
 *  twelve (the map has no row for them), so they carry the lab's words only. */
export const C_WINDOW_IDEAS: Readonly<Record<GaToolWindow['id'], readonly string[]>> = {
  files: ['random', 'bank'],
  events: ['event', 'instance'],
  gameinfo: ['switch', 'state', 'parameter'],
  music: [],
  properties: ['emitter', 'listener'],
  mixer: ['bus', 'mix'],
  audition: [],
  profiler: ['profiler'],
};

/** The idea's name on a window: the map's own idea word in capitals, or a
 *  shortening of it where a window is too narrow for the whole phrase. */
const IDEA_TAG_SHORT: Readonly<Record<string, string>> = { random: 'RANDOM TAKES', mix: 'SNAPSHOT' };
export const cIdeaTag = (id: string): string => IDEA_TAG_SHORT[id] ?? (GA_TOOL_MAP.find((r) => r.id === id)?.idea ?? id).toUpperCase();

/** The head of a cell: its words before the first comma or bracket. Nothing
 *  is added; the lit window prints the whole cell. */
export const cCellHead = (cell: string): string => cell.split(/, | \(/)[0].trim();

export type CToolWord = {
  /** The row of the map. */
  id: string;
  /** The idea in this lab's word, as the map has it. */
  idea: string;
  /** What the idea is, in the map's own line. */
  meaning: string;
  /** Its short name on a window, in capitals. */
  tag: string;
  /** What a small window prints: the head of the tool's cell, or the lab's
   *  own word when no tool is chosen or the tool has no single name. */
  word: string;
  /** What the lit window prints: the tool's whole cell (or the lab's word). */
  full: string;
  /** The chosen tool has no close idea of its own (the map's dash). */
  none: boolean;
};

export function cToolWord(id: string, tool: GaToolId | null): CToolWord | null {
  const row = GA_TOOL_MAP.find((r) => r.id === id);
  if (!row) return null;
  const tag = cIdeaTag(id);
  const base = { id, idea: row.idea, meaning: row.meaning, tag };
  if (!tool) return { ...base, word: row.idea, full: row.idea, none: false };
  const cell = row[tool];
  if (!cell || cell === GA_TOOL_NONE) return { ...base, word: row.idea, full: row.idea, none: true };
  return { ...base, word: cCellHead(cell), full: cell, none: false };
}

export type CToolWindow = { id: GaToolWindow['id']; n: number; tag: string; name: string; lit: boolean; dim: boolean; words: CToolWord[] };
export type CToolsStage = { tool: GaToolId | null; toolLabel: string; win: number; windows: CToolWindow[] };

/** The eight windows, in the figure's own order and numbers, with the chosen
 *  tool's words. `win` 0 = none lit. */
export function cToolsStage(tool: GaToolId | null, win: number): CToolsStage {
  const t = GA_TOOLS.find((x) => x.id === tool) ?? null;
  const lit = GA_TOOL_WINDOWS.some((w) => w.n === win) ? win : 0;
  return {
    tool: t ? t.id : null,
    toolLabel: t ? t.label : 'ANY TOOL',
    win: lit,
    windows: GA_TOOL_WINDOWS.map((w) => ({
      id: w.id,
      n: w.n,
      tag: w.tag,
      name: w.name,
      lit: w.n === lit,
      dim: lit !== 0 && w.n !== lit,
      words: C_WINDOW_IDEAS[w.id].map((id) => cToolWord(id, t ? t.id : null)).filter((x): x is CToolWord => x != null),
    })),
  };
}

export type CToolEvent = { id: GaEventId; name: string; playing: number; newest: boolean };
export type CToolsLive = {
  /** The event list: the scene's events, the one just posted marked. */
  events: CToolEvent[];
  /** The instances playing now. */
  instances: { id: string; label: string }[];
  /** The sound files playing now (as a sound designer names them). */
  files: string[];
  /** Game information, as the scene holds it. */
  surface: string;
  mood: string;
  speedPct: number;
  /** The settings of the event posted last. */
  selected: { name: string; label: string; priority: number; protected: boolean; bus: string; min: number | null; max: number | null } | null;
  /** The newest log line. */
  log: GaLogEntry | null;
  /** When it happened, in seconds since this page opened (the page's own
   *  log counts the same way). The model's `t` is the lab's running clock:
   *  printed raw it read "MIX 1096.7 s" after 18 minutes (GA2 B-12). */
  logAt: number | null;
  voices: number;
  music: { on: boolean; layers: Record<GaMusicLayer, boolean> };
};

const EVENT_ROWS: readonly GaEventId[] = ['door_open', 'generator', 'footstep', 'crate_impact', 'vo_greeting'];
const EVENT_BY_NAME = new Map(Object.values(GA_EVENTS).map((d) => [d.name, d.id]));

/** Seconds since the page opened, as the page's activity log counts. */
export const cSincePage = (t: number, tPage: number | undefined): number => Math.max(0, t - (tPage ?? 0));

/** The event the game posted last, read from the model's own log line. */
export function cLastPosted(s: GaState): GaEventId | null {
  for (let k = s.log.length - 1; k >= 0; k--) {
    const e = s.log[k];
    if (e.kind !== 'trigger') continue;
    const m = /^EVENT (\S+) posted/.exec(e.text);
    const id = m ? EVENT_BY_NAME.get(m[1]) : undefined;
    if (id) return id;
  }
  return null;
}

/** What the windows show of the scene right now. `rows` = how many events
 *  the list has room for. */
export function cToolsLive(s: GaState, rows = 5): CToolsLive {
  const newest = cLastPosted(s);
  // a tool's event list does not move: the same rows in the same order. Only
  // the last row gives way, to the event just posted when it has no row
  const shown: GaEventId[] = EVENT_ROWS.slice(0, Math.max(1, rows));
  if (newest && !shown.includes(newest)) shown[shown.length - 1] = newest;
  const events = shown.map((id) => ({ id, name: GA_EVENTS[id].name, playing: s.inst.filter((i) => i.event === id).length, newest: id === newest }));
  const files: string[] = [];
  for (const v of s.voices) {
    if (v.state === 'virtual') continue;
    const f = gaAsset(v.asset)?.file ?? v.asset;
    if (!files.includes(f)) files.push(f);
  }
  const def = newest ? GA_EVENTS[newest] : null;
  const g1 = s.machines.find((m) => m.id === 'generator-1') ?? s.machines[0];
  return {
    events,
    instances: s.inst.map((i) => ({ id: i.id, label: GA_EVENTS[i.event].label })),
    files,
    surface: surfaceOf(s, 'player'),
    mood: s.mood,
    speedPct: Math.round((g1?.speed ?? 0) * 100),
    selected: def
      ? {
          name: def.name,
          label: def.label,
          priority: def.priority,
          protected: !!def.protected,
          bus: GA_BUS_NAME[busOf(s, def.id)],
          min: def.atten?.min ?? null,
          max: def.atten?.max ?? null,
        }
      : null,
    log: s.log.length ? s.log[s.log.length - 1] : null,
    logAt: s.log.length ? cSincePage(s.log[s.log.length - 1].t, s.tPage) : null,
    voices: gaVoiceSlots(s).used,
    music: { on: s.music.on, layers: { ...(s.music.applied ?? s.music.layers) } },
  };
}

/** Where the music is in its four-bar phrase at scene time `now` (the
 *  model's `gaMusicClock`): `frac` 0 … 1 along the phrase, and the bar and
 *  beat counted from 1. */
export function cMusicAt(s: GaState, now: number): { frac: number; bar: number; beat: number } {
  const c = gaMusicClock(s, now);
  return { frac: c.phase, bar: c.bar + 1, beat: c.beat + 1 };
}
export const C_MUSIC_PHRASE_S = (60 / MUSIC_BPM) * MUSIC_BEATS_PER_BAR * MUSIC_BARS;
export const C_MUSIC_BARS = MUSIC_BARS;

/** The stage in words, for a screen reader. */
export function cToolsSpoken(tool: GaToolId | null, win: number, s: GaState): string {
  const stage = cToolsStage(tool, win);
  const live = cToolsLive(s);
  const t = GA_TOOLS.find((x) => x.id === stage.tool);
  const lit = stage.windows.find((w) => w.lit);
  const words = (w: CToolWindow) => w.words.map((x) => (x.none ? `${x.idea}: no single name in ${t?.spoken ?? 'this tool'}` : t ? `${x.idea}: ${x.full}` : x.idea)).join('; ');
  const head = `A simplified picture of a game audio tool, not one real product, with eight kinds of window. ${t ? `The names are ${t.spoken}’s.` : 'The names are this lab’s own words.'}`;
  const where = lit ? ` Window ${lit.n}, ${lit.name}, is lit.${lit.words.length ? ` ${words(lit)}.` : ''}` : ` ${stage.windows.map((w) => `${w.n}: ${w.name}`).join('. ')}.`;
  const playing = live.instances.length ? ` Playing now: ${live.instances.map((i) => i.label).join(', ')}.` : ' Nothing is playing.';
  const log = live.log ? ` Newest log line: ${live.log.text}.` : '';
  return head + where + playing + log;
}

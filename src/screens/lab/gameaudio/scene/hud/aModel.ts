/**
 * aModel — what the six "A" instrument strips (level, cats, chain, sync,
 * takes, beds) READ from the Game Audio model. Pure TypeScript: no React
 * Native, no audio (node:test drives it: test/gameAudioHudA.test.ts).
 *
 * THE TRUTH RULE lives here. Every number a strip draws is computed from the
 * model's state and the model's clock (`now`, scene seconds):
 *
 *   level     the model's own COMPUTED level of a voice at the output
 *             (gaModel `gaVoiceOut`): the voice's level and speed shape, its
 *             bus (fader, mute, solo, the duck), distance, the wall, a bed's
 *             crossfade, and the lab LEVEL. 0 dB is one sound at the level it
 *             was authored at with LEVEL at 100%. A late layer is silent
 *             until it starts; a virtual voice is silent. Several voices add
 *             by power, as unrelated sounds do. This file reads the model in
 *             ONE place (`aVoiceHeard`), so a change there is followed here.
 *   time      a late layer starts at `born + delayS`; a loop's play position
 *             is counted from that moment over the loop's real length.
 *
 * Two things the state does not keep are FOLLOWED here by small pure
 * steppers (`prev, state → next`), which the strip folds over the states it
 * is shown: what the last door press did after its instance has ended, and
 * which game information was sent last. A stepper never invents: it only
 * remembers what a state it was shown really said.
 *
 * A PLANTED FAULT IS NEVER NAMED EARLY (lead's decision 10). Nothing here
 * reads `faults.*` to mark anything before the model has logged the symptom
 * on this visit (`aSymptomSeen`: the log is emptied when a page opens).
 */
import type { GaBus } from '../../engine/gaEngineProtocol.ts';
import { GA_EVENTS, type GaEventId } from '../../model/gaDefs.ts';
import { gaBusMeter, gaVoiceOut, listenerOf, type GaInstance, type GaState, type GaVoice } from '../../model/gaModel.ts';
import { zoneAt, type GaSurfaceId } from '../../model/gaWorld.ts';
import { GA_FAMILIES, type GaFamilyId } from '../../pages/data/gaFamilies.ts';
import { gaAsset } from '../../sounds/gaSoundBank.ts';

const instOf = (s: GaState, id: string): GaInstance | undefined => s.inst.find((i) => i.id === id);

/* ── levels ─────────────────────────────────────────────────────────────── */

/** The meters' scale and the window the house loudness colors are spread
 *  over, in dB: the same as the lab's other strips (cModel) and the scene's
 *  rings (gaSceneLogic), so a source's rings, its bar here and its bus meter
 *  agree. The top 6 dB is where several sounds together go. */
export const A_METER_MIN_DB = -42;
export const A_METER_MAX_DB = 6;
export const A_COLOR_MIN_DB = -36;
export const A_COLOR_MAX_DB = 0;

/** A linear level in dB (null: no level at all). */
export const aDb = (g: number): number | null => (Number.isFinite(g) && g > 1e-4 ? 20 * Math.log10(g) : null);

/** Where a dB value sits on a meter, 0 (the quiet end) … 1. */
export const aMeterFrac = (db: number | null): number => (db == null ? 0 : Math.max(0, Math.min(1, (db - A_METER_MIN_DB) / (A_METER_MAX_DB - A_METER_MIN_DB))));

/** A level as the strips print it: whole decibels with a true minus sign;
 *  ZERO for a sound that is running at no level. */
export function aLevelWord(g: number): string {
  const db = aDb(g);
  if (db == null) return 'ZERO';
  const r = Math.round(db);
  return `${r > 0 ? `+${r}` : r < 0 ? `−${Math.abs(r)}` : '0'} dB`;
}
/** The same, spoken. */
export function aLevelSpoken(g: number): string {
  const db = aDb(g);
  if (db == null) return 'zero level';
  const r = Math.round(db);
  return `${r < 0 ? 'minus ' : r > 0 ? 'plus ' : ''}${Math.abs(r)} decibels`;
}
/** A 0 … 1 setting as a whole percent (LEVEL and SPEED read in percent). */
export const aPct = (x: number): string => `${Math.round(Math.max(0, x) * 100)}%`;

const BED_EVENTS = ['bed_yard', 'bed_room'] as const;

/** When the beds' crossfade ends (null: none has been asked for). */
export const aFadeEnd = (s: GaState): number | null => (s.bedFade ? s.bedFade.at + s.bedFade.ramp : null);
/** Is the beds' crossfade still running at `now`? */
export const aBedFading = (s: GaState, now: number): boolean => {
  const end = aFadeEnd(s);
  return end != null && now < end;
};

/** When the last level change the model ramps ends: the beds' crossfade,
 *  the lab LEVEL, a bus fader, mute, solo or the duck (null: none). */
export function aRampEnd(s: GaState): number | null {
  let end = aFadeEnd(s);
  const take = (r: { at: number; ramp: number } | undefined | null) => {
    if (r && r.ramp > 0 && Number.isFinite(r.at + r.ramp) && (end == null || r.at + r.ramp > end)) end = r.at + r.ramp;
  };
  take(s.masterRamp);
  for (const r of Object.values(s.busRamp ?? {})) take(r);
  return end;
}
/** Is any level still ramping at `now`? (The strip's clock runs while it is.) */
export const aRamping = (s: GaState, now: number): boolean => {
  const end = aRampEnd(s);
  return end != null && now < end;
};

/** Has this voice started? (A late layer waits `delayS` after its event.) */
export const aVoiceStarted = (v: GaVoice, now: number): boolean => now >= v.born + v.delayS - 1e-9;

/**
 * The computed level of ONE voice at the output, linear (see the header).
 * `still` = motion is reduced: a level the model ramps (a crossfade, LEVEL,
 * a fader, the duck) is then shown where its ramp ENDS, never part-way.
 */
export function aVoiceHeard(s: GaState, v: GaVoice, now: number, still = false): number {
  const i = instOf(s, v.inst);
  if (!i) return 0;
  const end = still ? aRampEnd(s) : null;
  const g = gaVoiceOut(s, v, end != null ? Math.max(now, end) : now).gain;
  return Number.isFinite(g) && g > 0 ? g : 0;
}

/** Several voices together: the sum of their powers (copies of one loop
 *  started at different moments do not line up, so their levels do not
 *  simply add). One voice alone is its own level. */
export function aSumLevels(levels: readonly number[]): number {
  let p = 0;
  for (const g of levels) p += g * g;
  return Math.sqrt(p);
}

/** The computed level of everything one event has playing. */
export function aEventLevel(s: GaState, event: GaEventId, now: number, still = false): number {
  const ids = new Set(s.inst.filter((i) => i.event === event).map((i) => i.id));
  return aSumLevels(s.voices.filter((v) => ids.has(v.inst)).map((v) => aVoiceHeard(s, v, now, still)));
}

/** The next moment a late layer starts by itself (null: none is waiting). */
export function aNextStart(s: GaState, now: number): number | null {
  let at: number | null = null;
  for (const v of s.voices) {
    const t = v.born + v.delayS;
    if (t > now + 1e-6 && (at === null || t < at)) at = t;
  }
  return at;
}

/* ── page 1: the three sounds SCENE starts, under the lab LEVEL ─────────── */

export type ALevelRow = { event: GaEventId; name: string; playing: boolean; level: number };

/** In the order the page names them. */
export const A_SCENE_SOUNDS: readonly GaEventId[] = ['bed_yard', 'fountain', 'bed_room'];

export function aLevelRows(s: GaState, now: number, still = false): ALevelRow[] {
  return A_SCENE_SOUNDS.map((event) => ({
    event,
    name: GA_EVENTS[event].label.toUpperCase(),
    playing: s.inst.some((i) => i.event === event),
    level: aEventLevel(s, event, now, still),
  }));
}

export function aLevelSummary(s: GaState, rows: readonly ALevelRow[]): string {
  const on = rows.filter((r) => r.playing);
  const each = on.map((r) => `${r.name.toLowerCase()} at ${aLevelSpoken(r.level)}`).join(', ');
  return `Level strip. The lab level is ${aPct(s.master)}, which is ${aLevelSpoken(s.master)}. ${on.length ? `Computed level of each sound the scene is playing: ${each}.` : 'No scene sound is playing.'}`;
}

/* ── page 5: the kinds of game sound ────────────────────────────────────── */

/** The family (the page's own list: pages/data/gaFamilies) each event of the
 *  model belongs to. The beds and the fountain are the page's own examples;
 *  the generator, its alarm and a bird are sounds that have a place. */
export const A_FAMILY_OF: Readonly<Record<GaEventId, GaFamilyId>> = {
  bed_room: 'bed',
  bed_yard: 'bed',
  fountain: 'local',
  generator: 'local',
  alarm: 'local',
  bird: 'local',
  footstep: 'movement',
  door_open: 'action',
  crate_impact: 'impact',
  vo_greeting: 'dialogue',
  vo_warning: 'dialogue',
  ui_confirm: 'interface',
  ui_deny: 'interface',
  stinger: 'music',
  chat: 'chat',
};

/** What a cell prints: the family's own name, or its leading words where the
 *  whole name does not fit a cell (the test pins each to the page's name). */
export const A_FAMILY_LABEL: Readonly<Record<GaFamilyId, string>> = {
  bed: 'AMBIENCE BED',
  local: 'LOCAL',
  movement: 'MOVEMENT',
  action: 'ACTIONS',
  impact: 'IMPACTS',
  dialogue: 'DIALOGUE',
  interface: 'INTERFACE',
  music: 'MUSIC',
  chat: 'VOICE CHAT',
};

/** idle = nothing of this kind is running · shut = nothing of it is running,
 *  and the mix would let none of it through (its category is muted, or
 *  another is soloed) · sounding = it has a level · zero = it is running at
 *  no level (a bed outside its zone, a late layer that has not started, a
 *  loop out of range) · muted / silent = it is running, and the mix lets
 *  none of it through: its own category is MUTED, or another category is
 *  soloed (the mix strip's own two words). */
export type ACatState = 'idle' | 'shut' | 'sounding' | 'zero' | 'muted' | 'silent';
export type ACat = {
  id: GaFamilyId;
  label: string;
  name: string;
  state: ACatState;
  level: number;
  /** Sounding, while ANOTHER sound of the same kind is shut out by the mix
   *  (the fountain plays; the alarm, in another category, does not). */
  part: boolean;
};

export function aCats(s: GaState, now: number, still = false): ACat[] {
  const meters = gaBusMeter(s, now);
  const closed = (bus: GaBus): 'mute' | 'solo' | null => meters.find((m) => m.bus === bus)?.silenced ?? null;
  return GA_FAMILIES.map((f) => {
    const label = A_FAMILY_LABEL[f.id] ?? f.name.toUpperCase();
    const cell = (state: ACatState, level: number, part = false): ACat => ({ id: f.id, label, name: f.name, state, level, part });
    // the category this kind is routed to when nothing of it is running: the
    // page's own example of it (music and voice chat have their own)
    const home: GaBus | null = f.event ? GA_EVENTS[f.event].bus : f.id === 'music' ? 'music' : f.id === 'chat' ? 'chat' : null;
    const idle = (): ACat => cell(home && closed(home) ? 'shut' : 'idle', 0);
    if (f.id === 'music') {
      // the score is not an instance: the model's own music bus meter says
      // whether its layers (or a stinger) are sounding, and how loud
      const m = meters.find((x) => x.bus === 'music');
      if (!m || m.voices === 0) return idle();
      if (m.silenced) return cell(m.silenced === 'mute' ? 'muted' : 'silent', 0);
      return cell(m.gain > 0 ? 'sounding' : 'zero', m.gain);
    }
    const ids = new Set(s.inst.filter((i) => A_FAMILY_OF[i.event] === f.id).map((i) => i.id));
    const vs = s.voices.filter((v) => ids.has(v.inst));
    if (!vs.length) return idle();
    const level = aSumLevels(vs.map((v) => aVoiceHeard(s, v, now, still)));
    const why = vs.map((v) => closed(v.bus));
    if (why.every((x) => x != null)) return cell(why.includes('solo') ? 'silent' : 'muted', 0);
    return cell(level > 0 ? 'sounding' : 'zero', level, why.some((x) => x != null));
  });
}

export function aCatsSummary(cats: readonly ACat[]): string {
  const on = cats.filter((c) => c.state === 'sounding').map((c) => `${c.name.toLowerCase()} at ${aLevelSpoken(c.level)}${c.part ? ' (another sound of this kind is silenced by the mix)' : ''}`);
  const zero = cats.filter((c) => c.state === 'zero').map((c) => c.name.toLowerCase());
  const off = cats.filter((c) => c.state === 'muted' || c.state === 'silent').map((c) => c.name.toLowerCase());
  const shut = cats.filter((c) => c.state === 'shut').map((c) => c.name.toLowerCase());
  return (
    'Kinds of game sound, one cell each. ' +
    (on.length ? `Sounding now, with its computed level: ${on.join(', ')}.` : 'No kind is sounding.') +
    (zero.length ? ` Running at zero level: ${zero.join(', ')}.` : '') +
    (off.length ? ` Running, but silenced by the mix: ${off.join(', ')}.` : '') +
    (shut.length ? ` Not running, and shut out by the mix: ${shut.join(', ')}.` : '')
  );
}

/* ── page 6: the door's chain ───────────────────────────────────────────── */

/** The model logged a FAULT line for this owner on this visit (the log is
 *  emptied when a page opens). Read from the entry's kind and owner, never
 *  from its wording. */
export const aSymptomSeen = (s: GaState, owner: string): boolean => s.log.some((l) => l.kind === 'failed' && l.owner === owner);

/** not-started = no voice was made for this layer on this press (the strip
 *  draws it unlit) · missing = the same, and the model has already said why
 *  (its FAULT line names the file) · waiting = a late layer, not yet started ·
 *  playing · done = it played and ended · off = the layer is switched off. */
export type AChainVoice = 'not-started' | 'missing' | 'waiting' | 'playing' | 'done' | 'off';
export type AChainLane = {
  layer: string;
  name: string;
  /** Seconds after the event at which this layer starts. */
  delayS: number;
  voice: AChainVoice;
  /** Seconds it has played (frozen when it ended). */
  playedS: number;
};
export type AChain = {
  inst: string;
  born: number;
  /** The instance is still in the scene. */
  live: boolean;
  /** Scene time the instance was first seen gone. */
  endedAt: number | null;
  lanes: AChainLane[];
  /** Computed level of the event at the output now (0 once it has ended). */
  out: number;
};

/** The span of the lanes' time scale, in seconds. */
export const A_CHAIN_SPAN_S = 2;

/** Follow the door event from state to state: the newest door instance, each
 *  layer's voice, and (once the instance has ended) what that press did.
 *  `null` until the door has been pressed while the strip was shown. */
export function aChainStep(prev: AChain | null, s: GaState, now: number): AChain | null {
  const def = GA_EVENTS.door_open;
  const live = s.inst.filter((i) => i.event === 'door_open').sort((a, b) => b.born - a.born || (a.id < b.id ? 1 : -1))[0];
  if (!live) {
    if (!prev || !prev.live) return prev;
    // the instance has ended: keep what it did, as it was at its last moment
    return {
      ...prev,
      live: false,
      endedAt: s.t,
      out: 0,
      lanes: prev.lanes.map((l) => (l.voice === 'playing' ? { ...l, voice: 'done', playedS: Math.max(l.playedS, s.t - prev.born - l.delayS) } : l.voice === 'waiting' ? { ...l, voice: 'not-started' } : l)),
    };
  }
  const same = prev && prev.inst === live.id && prev.born === live.born ? prev : null;
  const seen = aSymptomSeen(s, live.owner);
  const lanes: AChainLane[] = def.layers.map((layer, k) => {
    const was = same?.lanes[k];
    const delayS = layer.delayS ?? 0;
    const name = layer.id.toUpperCase();
    const v = s.voices.find((x) => x.inst === live.id && x.layer === layer.id);
    if (v) {
      const started = aVoiceStarted(v, now);
      return { layer: layer.id, name, delayS, voice: started ? 'playing' : 'waiting', playedS: started ? Math.max(0, now - v.born - v.delayS) : 0 };
    }
    // no voice now: it played and ended, or it never started
    if (was && (was.voice === 'playing' || was.voice === 'done')) return { ...was, voice: 'done', playedS: was.voice === 'done' ? was.playedS : Math.max(was.playedS, s.t - live.born - delayS) };
    const assets = Array.isArray(layer.assets) ? (layer.assets as readonly string[]) : [];
    if (assets.some((a) => live.chose.includes(a))) return { layer: layer.id, name, delayS, voice: 'done', playedS: was?.playedS ?? 0 };
    if (layer.secondary === 'rattle' && !s.options.doorRattle) return { layer: layer.id, name, delayS, voice: 'off', playedS: 0 };
    // never started. It may be NAMED only once the model has logged why.
    const missing = seen && layer.id === 'door' && s.faults.missingDoor;
    return { layer: layer.id, name, delayS, voice: missing ? 'missing' : (was?.voice === 'missing' ? 'missing' : 'not-started'), playedS: 0 };
  });
  const out = aSumLevels(s.voices.filter((v) => v.inst === live.id).map((v) => aVoiceHeard(s, v, now)));
  return { inst: live.id, born: live.born, live: true, endedAt: null, lanes, out };
}

/** Does the chain need a moving clock right now? */
export const aChainMoving = (c: AChain | null): boolean => !!c && c.live && c.lanes.some((l) => l.voice === 'playing' || l.voice === 'waiting');

export function aChainSummary(c: AChain | null, s: GaState): string {
  if (!c) return 'The door’s chain: scene, event, file, voice, output. Nothing is lit: the door has not been pressed on this page yet.';
  const word: Record<AChainVoice, string> = {
    'not-started': 'its file link did not light and no voice started',
    missing: 'its file is not in the build, so no voice started',
    waiting: 'its file is in the build; its voice waits to start',
    playing: 'its file is in the build; its voice is playing',
    done: 'its file is in the build; its voice played and ended',
    off: 'the layer is switched off',
  };
  const lanes = c.lanes.map((l) => `${l.name.toLowerCase()} layer${l.delayS ? `, ${l.delayS} second later` : ''}: ${word[l.voice]}`).join('. ');
  return `The door’s chain, ${c.live ? 'now' : 'on the last press'}. The scene posted the event ${GA_EVENTS.door_open.name}. ${lanes}. ${c.live ? `Computed output level ${aLevelSpoken(c.out)}; the lab level is ${aPct(s.master)}.` : ''}`.trim();
}

/* ── page 8: the four kinds of game information ─────────────────────────── */

export type ASyncTrigger = { what: 'FOOT CONTACT' | 'DOOR'; from: 'YOU' | 'GUIDE' | 'THE DOOR'; t: number };
export type ASync = {
  /** The last trigger the game sent on this page (null: none yet). */
  trigger: ASyncTrigger | null;
  /** The surface switch value each character's LAST FOOTSTEP on this page
   *  really used (null: that character has not stepped yet). Not the value
   *  the switch would give now: a planted fault shows only once a step has
   *  really used it (lead's decision 10). */
  you: GaSurfaceId | null;
  guide: GaSurfaceId | null;
  /** Scene time a switch value was last sent: the model reads a character's
   *  surface switch with each foot contact (its GAME line prints both). */
  switchAt: number | null;
  speed: number;
  running: boolean;
  /** Scene time the speed last changed. */
  speedAt: number | null;
  mood: GaState['mood'];
  /** Scene time the state last changed (null: not while the strip was shown). */
  moodAt: number | null;
};

/** The game's own trigger lines in the log, told by the entry's KIND and
 *  OWNER (never by its wording): a foot contact belongs to a character, the
 *  door's to the door. An EVENT line carries a bus and a STOP line an
 *  instance, so neither is taken for one. The log is emptied when a page
 *  opens, so this is "on this page". */
function lastTrigger(s: GaState, owners: readonly string[]): { owner: string; t: number } | null {
  for (let k = s.log.length - 1; k >= 0; k--) {
    const l = s.log[k];
    if (l.kind === 'trigger' && l.owner != null && l.bus == null && l.inst == null && owners.includes(l.owner)) return { owner: l.owner, t: l.t };
  }
  return null;
}

/** How long a cell stays marked after its information is sent, in scene
 *  seconds: the length of the indicator, not of any sound. */
export const A_SYNC_MARK_S = 0.6;

const SURFACES: readonly GaSurfaceId[] = ['wood', 'stone', 'gravel'];

/** The surface a character's newest footstep used, from the model's own
 *  record of the takes it chose (`recentTakes`: owner, and the group
 *  `footstep/<layer>/<surface>`). That record is emptied when a page opens
 *  and keeps the last few takes, so the strip also remembers (`was`) a value
 *  it has seen once that value leaves the record. */
function lastStepSurface(s: GaState, who: 'player' | 'guide', was: GaSurfaceId | null): GaSurfaceId | null {
  const takes = Array.isArray(s.recentTakes) ? s.recentTakes : [];
  for (let k = takes.length - 1; k >= 0; k--) {
    const t = takes[k];
    if (!t || t.owner !== who) continue;
    const parts = String(t.group).split('/');
    if (parts[0] !== 'footstep') continue;
    const surface = parts[parts.length - 1] as GaSurfaceId;
    if (SURFACES.includes(surface)) return surface;
  }
  // a new page empties the record: nothing remembered survives it
  return takes.length ? was : null;
}

/** The four kinds of game information as the state has them now. Only the
 *  moment the STATE last changed is followed from one state to the next
 *  (`prev`); everything else is read from the state itself, so a strip
 *  opened later (FULL SCREEN) shows the same thing. */
export function aSyncStep(prev: ASync | null, s: GaState): ASync {
  const you = lastStepSurface(s, 'player', prev?.you ?? null);
  const guide = lastStepSurface(s, 'guide', prev?.guide ?? null);
  const m = s.machines.find((x) => x.id === 'generator-1');
  const speed = m?.speed ?? 0;
  const running = !!m?.on;
  const last = lastTrigger(s, ['player', 'guide', 'door']);
  const trigger: ASyncTrigger | null = last ? { what: last.owner === 'door' ? 'DOOR' : 'FOOT CONTACT', from: last.owner === 'door' ? 'THE DOOR' : last.owner === 'guide' ? 'GUIDE' : 'YOU', t: last.t } : null;
  const switchAt = lastTrigger(s, ['player', 'guide'])?.t ?? null;
  let speedAt: number | null = null;
  for (let k = s.log.length - 1; k >= 0 && speedAt === null; k--) if (s.log[k].kind === 'value' && s.log[k].owner === 'generator-1') speedAt = s.log[k].t;
  const moodAt = prev && s.mood !== prev.mood ? s.t : (prev?.moodAt ?? null);
  const same =
    prev &&
    prev.trigger?.t === trigger?.t &&
    prev.trigger?.from === trigger?.from &&
    prev.trigger?.what === trigger?.what &&
    prev.you === you &&
    prev.guide === guide &&
    prev.switchAt === switchAt &&
    prev.speed === speed &&
    prev.running === running &&
    prev.speedAt === speedAt &&
    prev.mood === s.mood &&
    prev.moodAt === moodAt;
  return same && prev ? prev : { trigger, you, guide, switchAt, speed, running, speedAt, mood: s.mood, moodAt };
}

/** Is this cell inside its mark right now? */
export const aSyncMarked = (at: number | null | undefined, now: number): boolean => at != null && now >= at && now < at + A_SYNC_MARK_S;

/** How strong a cell's mark is at `now`: 1 the moment its information is
 *  sent, fading in a straight line to 0 at A_SYNC_MARK_S (0 outside it). */
export const aSyncMark = (at: number | null | undefined, now: number): number => (aSyncMarked(at, now) ? 1 - (now - (at as number)) / A_SYNC_MARK_S : 0);

/** Is any cell marked at `now`? (The strip's clock runs while one is.) */
export const aSyncAnyMarked = (y: ASync, now: number): boolean => [y.trigger?.t, y.switchAt, y.speedAt, y.moodAt].some((t) => aSyncMarked(t, now));

/** The next moment a mark ends by itself (null: none is showing). */
export function aSyncNextUnmark(y: ASync, now: number): number | null {
  let at: number | null = null;
  for (const t of [y.trigger?.t, y.switchAt, y.speedAt, y.moodAt]) {
    if (t == null) continue;
    const end = t + A_SYNC_MARK_S;
    if (end > now && (at === null || end < at)) at = end;
  }
  return at;
}

export const A_SURFACE_WORD: Readonly<Record<GaSurfaceId, string>> = { wood: 'WOOD', stone: 'STONE', gravel: 'GRAVEL' };

export function aSyncSummary(y: ASync): string {
  const t = y.trigger ? `The last trigger was ${y.trigger.what === 'DOOR' ? 'the door' : 'a foot contact'} from ${y.trigger.from === 'YOU' ? 'you' : y.trigger.from === 'GUIDE' ? 'the guide' : 'the door'}.` : 'No trigger has been sent on this page yet.';
  return (
    'The four kinds of game information. ' +
    `Trigger: ${t} ` +
    `Switch, one for each character, as its last footstep sent it: ${y.you ? `yours read ${A_SURFACE_WORD[y.you].toLowerCase()}` : 'you have not stepped yet'}; ${y.guide ? `the guide’s read ${A_SURFACE_WORD[y.guide].toLowerCase()}` : 'the guide has not stepped yet'}. ` +
    `Parameter, on generator 1: speed ${aPct(y.speed)}${y.running ? '' : ', not running'}. ` +
    `State, for the whole game: ${y.mood}.`
  );
}

/* ── page 9: the last takes ─────────────────────────────────────────────── */

/** One take as the row draws it. */
export type ATake = {
  key: string;
  group: string;
  /** 1-based, as the log prints it. */
  take: number;
  of: number;
  pitchCents: number;
  gainDb: number;
  /** The same take as the one before it in the same group. */
  same: boolean;
  /** The model says a repeat was avoided to choose this one (shown only if
   *  the model records it). */
  avoided: boolean;
};

export const A_TAKES_KEPT = 8;
/** The scales the row is drawn on (a footstep varies by ±1.5 dB, ±45 cents). */
export const A_TAKE_DB = 2;
export const A_TAKE_CENTS = 50;

type RawTake = { key: string; group: string; take: number; of: number; pitchCents: number; gainDb: number; avoided?: boolean };

function withSame(list: readonly RawTake[]): ATake[] {
  const last = new Map<string, number>();
  return list.map((t) => {
    const same = last.get(t.group) === t.take;
    last.set(t.group, t.take);
    return { key: t.key, group: t.group, take: t.take, of: t.of, pitchCents: t.pitchCents, gainDb: t.gainDb, same, avoided: t.avoided === true };
  });
}

/** Where a layer's take list holds this asset: its 1-based place and the
 *  list's length (null: the layer has one take, or does not hold it). */
function takeOf(event: GaEventId, asset: string): { take: number; of: number; layer: string; surface: string } | null {
  const def = GA_EVENTS[event];
  for (const layer of def.layers) {
    const lists: [string, readonly string[]][] = Array.isArray(layer.assets) ? [['', layer.assets as readonly string[]]] : Object.entries(layer.assets as Record<string, readonly string[]>);
    for (const [surface, list] of lists) {
      const k = list.indexOf(asset);
      if (k >= 0 && list.length > 1) return { take: k + 1, of: list.length, layer: layer.id, surface };
    }
  }
  return null;
}

/**
 * The strip's OWN record of the takes that played while it was shown, for a
 * model that does not keep `recentTakes`: every new instance whose layer
 * chose among several takes, read from the instance (which take) and its
 * voice (the real pitch and level change). Returns `prev` when nothing is new.
 */
export function aNoteTakes(prev: readonly ATake[], s: GaState): readonly ATake[] {
  const fresh = s.inst.filter((i) => !prev.some((p) => p.key === `${i.id}@${i.born}`)).sort((a, b) => a.born - b.born);
  let out: RawTake[] | null = null;
  for (const i of fresh) {
    const v = s.voices.find((x) => x.inst === i.id);
    const t = v ? takeOf(i.event, v.asset) : null;
    if (!v || !t) continue;
    const layerDb = GA_EVENTS[i.event].layers.find((l) => l.id === t.layer)?.gainDb ?? 0;
    out ??= prev.map((p) => ({ ...p }));
    out.push({
      key: `${i.id}@${i.born}`,
      group: `${i.event}/${t.layer}/${i.owner}/${t.surface}`,
      take: t.take,
      of: t.of,
      pitchCents: 1200 * Math.log2(v.rate > 0 ? v.rate : 1),
      gainDb: 20 * Math.log10(v.base > 0 ? v.base : 1) - layerDb,
    });
  }
  return out ? withSame(out).slice(-A_TAKES_KEPT) : prev;
}

/** The row: the model's own record where it keeps one (`recentTakes`), else
 *  the strip's (`noted`). Only choices among SEVERAL takes are listed. */
export function aTakes(s: GaState, noted: readonly ATake[] = []): ATake[] {
  const model = s.recentTakes;
  if (!Array.isArray(model)) return noted.slice(-A_TAKES_KEPT);
  const raw: RawTake[] = [];
  for (const t of model) {
    if (!t || !(t.of > 1) || !Number.isFinite(t.take)) continue;
    raw.push({
      key: `${t.n}@${t.t}`,
      group: `${String(t.group)}|${String(t.owner)}`,
      take: t.take,
      of: t.of,
      pitchCents: Number.isFinite(t.pitchCents) ? t.pitchCents : 0,
      gainDb: Number.isFinite(t.gainDb) ? t.gainDb : 0,
      avoided: (t as { avoided?: boolean }).avoided,
    });
  }
  return withSame(raw).slice(-A_TAKES_KEPT);
}

/** How many of the newest takes in a row are one and the same take. */
export function aTakesRun(takes: readonly ATake[]): number {
  let n = takes.length ? 1 : 0;
  for (let k = takes.length - 1; k > 0 && takes[k].same; k--) n++;
  return n;
}

const signed = (x: number, digits = 0): string => {
  const r = Number(x.toFixed(digits));
  return `${r > 0 ? '+' : r < 0 ? '−' : ''}${Math.abs(r).toFixed(digits)}`;
};
export const aCentsWord = (c: number): string => `${signed(c)} CENTS`;
export const aTakeDbWord = (d: number): string => `${signed(d, 1)} dB`;

export function aTakesSummary(takes: readonly ATake[], variation: boolean): string {
  if (!takes.length) return 'The last takes. No take has played on this page yet.';
  const list = takes.map((t) => `take ${t.take} of ${t.of}${t.same ? ' again' : ''}`).join(', ');
  const last = takes[takes.length - 1];
  const run = aTakesRun(takes);
  return `The last ${takes.length === 1 ? 'take' : `${takes.length} takes`}, oldest first: ${list}. The newest was ${signed(last.pitchCents)} cents in pitch and ${signed(last.gainDb, 1)} decibels in level. Variation is ${variation ? 'on' : 'off'}.${run >= 2 ? ` The same take has played ${run} times in a row.` : ''}`;
}

/* ── page 10: the beds, the loop and its join ───────────────────────────── */

export type ABed = {
  event: 'bed_yard' | 'bed_room';
  name: string;
  /** Instances of this bed playing now (one is the clean scene). */
  copies: number;
  /** Computed level of all its copies together. */
  level: number;
  /** The asset the oldest copy plays, its loop length, and whether it is the
   *  cut with no loop preparation. */
  asset: string | null;
  loopS: number;
  raw: boolean;
  /** Play position in the loop, 0 … 1 (the oldest copy). */
  pos: number;
  /** Seconds since the play position last passed the join. */
  sinceJoin: number;
  /** Times the play position has passed the join. */
  passes: number;
};

export const A_RAW_ASSET = 'amb_yard_raw';

export function aBeds(s: GaState, now: number, still = false): ABed[] {
  return BED_EVENTS.map((event) => {
    const insts = s.inst.filter((i) => i.event === event).sort((a, b) => a.born - b.born);
    const ids = new Set(insts.map((i) => i.id));
    const vs = s.voices.filter((v) => ids.has(v.inst));
    const first = insts.length ? vs.find((v) => v.inst === insts[0].id) : undefined;
    const loopS = first ? (gaAsset(first.asset)?.loopS ?? 0) : 0;
    const el = first ? Math.max(0, now - first.born - first.delayS) : 0;
    const passes = loopS > 0 ? Math.floor(el / loopS) : 0;
    const into = loopS > 0 ? el - passes * loopS : 0;
    return {
      event,
      name: GA_EVENTS[event].label.toUpperCase(),
      copies: insts.length,
      level: aSumLevels(vs.map((v) => aVoiceHeard(s, v, now, still))),
      asset: first?.asset ?? null,
      loopS,
      raw: first?.asset === A_RAW_ASSET,
      pos: loopS > 0 ? into / loopS : 0,
      sinceJoin: into,
      passes,
    };
  });
}

export function aBedsSummary(list: readonly ABed[], s: GaState): string {
  const z = zoneAt(listenerOf(s)) === 'room' ? 'workshop' : 'courtyard';
  const on = list.filter((b) => b.copies > 0);
  if (!on.length) return `The two ambience beds. Neither is playing. The listener is in the ${z}.`;
  const each = on
    .map((b) => `${b.name.toLowerCase()} at ${aLevelSpoken(b.level)}${b.copies > 1 ? `, ${b.copies} copies playing` : ''}, ${Math.round(b.pos * b.loopS)} seconds into its ${b.loopS} second loop${b.raw && b.passes > 0 ? `, ${b.passes} ${b.passes === 1 ? 'jump' : 'jumps'} at the join so far` : ''}`)
    .join('; ');
  return `The two ambience beds. The listener is in the ${z}. ${each}.`;
}

/**
 * Sound Systems Lab — the system graph.
 *
 * A build is placed gear plus links. This module owns the three questions the
 * builder asks on every tap:
 *   1. MAY these two connect? (`canConnect` — level compatibility, safety,
 *      port count, no loops)
 *   2. WHERE does the signal go? (`trace` — which sinks are live, what feeds
 *      what)
 *   3. WHAT is this thing's neighbourhood? (`upstream` / `downstream` — the
 *      tap-to-inspect card)
 *
 * The refusal REASONS are the teaching: a refused link explains the level
 * mismatch in the same words the wiring chapter uses, and the one refusal
 * that is also a hazard (speaker level into a line input) is flagged so the
 * page can render it as a warning, not a shrug.
 */
import { gearSpec, isSink, isSource } from './gear';
import { CONSOLE_OUTS, IEM_PAIR, isIemPair, outName } from './outputs';
import type { ConsoleOut, GearKind, Link, Placed, SignalLevel, SlotId, SlotRole, SoundSystem } from './types';

/* ── the venue plot ──────────────────────────────────────────────────────── */

export type SlotDef = { id: SlotId; role: SlotRole; label: string; x: number; y: number };

/** Plot coordinates in the venue view's 360 × 330 box — a stage plan the way
 *  a production drawing reads it. The deck spans x 70–290 with the drum riser
 *  upstage centre; the wings are offstage either side (masking legs at the
 *  deck edges); amp racks, the stagebox and the in-ear rack live in the
 *  STAGE-LEFT wing where the snake run leaves; power distribution sits in
 *  the stage-right wing. Mains stand outboard of the deck corners just below
 *  the lip (or fly above them), subs on the floor inboard of the mains,
 *  front fills on the apron face, delays on the cross-aisle, front of house
 *  two-thirds back on the centre line.
 *
 *  ⛔ STAGE LEFT IS THE PERFORMER'S LEFT — the plot's RIGHT (+x). House left
 *  and right are the audience's. Every label below says which. */
export const SLOTS: readonly SlotDef[] = [
  { id: 'riserL', role: 'stageSource', label: 'Riser · stage left', x: 222, y: 36 },
  { id: 'riserC', role: 'stageSource', label: 'Riser · centre', x: 180, y: 34 },
  { id: 'riserR', role: 'stageSource', label: 'Riser · stage right', x: 138, y: 36 },
  { id: 'stageL', role: 'stageSource', label: 'Stage left', x: 240, y: 74 },
  { id: 'stageC', role: 'stageSource', label: 'Centre stage', x: 180, y: 76 },
  { id: 'stageR', role: 'stageSource', label: 'Stage right', x: 120, y: 74 },
  { id: 'wingL', role: 'stageSource', label: 'Stage-left wing', x: 336, y: 98 },
  { id: 'wingR', role: 'stageSource', label: 'Stage-right wing', x: 24, y: 98 },
  { id: 'stageBox', role: 'stageInfra', label: 'Stagebox · upstage left', x: 276, y: 24 },
  { id: 'distro', role: 'stageInfra', label: 'Power · stage-right wing', x: 36, y: 30 },
  { id: 'drumFill', role: 'monitor', label: 'Drum fill', x: 258, y: 44 },
  { id: 'sideFillL', role: 'monitor', label: 'Side fill · stage left', x: 300, y: 76 },
  { id: 'sideFillR', role: 'monitor', label: 'Side fill · stage right', x: 60, y: 76 },
  { id: 'mon1', role: 'monitor', label: 'Wedge 1', x: 118, y: 100 },
  { id: 'mon2', role: 'monitor', label: 'Wedge 2', x: 160, y: 100 },
  { id: 'mon3', role: 'monitor', label: 'Wedge 3', x: 200, y: 100 },
  { id: 'mon4', role: 'monitor', label: 'Wedge 4', x: 242, y: 100 },
  { id: 'mainL', role: 'main', label: 'Main · house left', x: 44, y: 122 },
  { id: 'mainC', role: 'main', label: 'Centre cluster', x: 180, y: 110 },
  { id: 'mainR', role: 'main', label: 'Main · house right', x: 316, y: 122 },
  { id: 'subL', role: 'sub', label: 'Sub · house left', x: 80, y: 128 },
  { id: 'subC', role: 'sub', label: 'Sub · centre', x: 180, y: 128 },
  { id: 'subC2', role: 'sub', label: 'Sub · centre, front box', x: 180, y: 156 },
  { id: 'subR', role: 'sub', label: 'Sub · house right', x: 280, y: 128 },
  { id: 'frontFillL', role: 'fill', label: 'Front fill · left', x: 140, y: 114 },
  { id: 'frontFillR', role: 'fill', label: 'Front fill · right', x: 220, y: 114 },
  { id: 'delayL', role: 'delay', label: 'Delay · house left', x: 104, y: 214 },
  { id: 'delayR', role: 'delay', label: 'Delay · house right', x: 256, y: 214 },
  { id: 'foh', role: 'foh', label: 'Front of house', x: 180, y: 282 },
  { id: 'rack1', role: 'ampRack', label: 'Rack · 1', x: 310, y: 40 },
  { id: 'rack2', role: 'ampRack', label: 'Rack · 2', x: 338, y: 40 },
  { id: 'rack3', role: 'ampRack', label: 'Rack · 3', x: 310, y: 66 },
  { id: 'rack4', role: 'ampRack', label: 'Rack · 4', x: 338, y: 66 },
];

export function slotDef(id: SlotId): SlotDef {
  const s = SLOTS.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown slot: ${id}`);
  return s;
}

/** May this gear stand in this slot? */
export function slotAccepts(slot: SlotId, kind: GearKind): boolean {
  return gearSpec(kind).roles.includes(slotDef(slot).role);
}

/* ── connection rules ────────────────────────────────────────────────────── */

export type ConnectVerdict =
  | { ok: true; level: SignalLevel }
  | { ok: false; reason: string; unsafe?: boolean };

/** Preference when two ports share more than one level: a digital link is the
 *  modern default, line the analog one; mic is only chosen when nothing else
 *  fits (a mic input accepts line badly, not the reverse). */
const LEVEL_PRIORITY: readonly SignalLevel[] = ['digital', 'line', 'mic', 'instrument', 'speaker', 'wireless', 'acoustic'];

/** How many incoming links a kind will take. A loudspeaker has one input; an
 *  amplifier has a channel per side; consoles and boxes take many. */
export function inputCapacity(kind: GearKind): number {
  switch (kind) {
    case 'poweredSpeaker':
    case 'passiveSpeaker':
    case 'poweredSub':
    case 'passiveSub':
    case 'wedge':
    case 'poweredWedge':
    case 'iemPack':
    case 'di':
      return 1;
    case 'iemTx':
      return 2; // a stereo mix is two sends
    case 'amp':
      return 2;
    case 'processor':
      return 4;
    case 'vocalMic':
    case 'instrumentMic':
    case 'playback':
    case 'wirelessRx':
    case 'powerDistro':
      return 0;
    default:
      return 64;
  }
}

function find(system: SoundSystem, id: string): Placed | undefined {
  return system.placed.find((p) => p.id === id);
}

function reaches(system: SoundSystem, fromId: string, target: string, seen = new Set<string>()): boolean {
  if (fromId === target) return true;
  if (seen.has(fromId)) return false;
  seen.add(fromId);
  return system.links.filter((l) => l.from === fromId).some((l) => reaches(system, l.to, target, seen));
}

/** The cables between one pair of devices, in the order they were run. */
export function pairLinks(system: SoundSystem, fromId: string, toId: string): Link[] {
  return system.links.filter((l) => l.from === fromId && l.to === toId);
}

/** Which of its pair's cables this one is (0 = the first run), by identity
 *  first, then by what it carries; -1 when it is not in the system. */
export function pairIndex(system: SoundSystem, l: Link): number {
  const pair = pairLinks(system, l.from, l.to);
  const same = pair.indexOf(l);
  return same >= 0 ? same : pair.findIndex((m) => m.out === l.out);
}

/** A SECOND cable between the same two devices (owner 2026-10-21: "allow two
 *  cables between the same pair — stage box to in-ear transmitter on Aux 9
 *  and Aux 10"). It is a real cable only where each one carries its own
 *  console output into its own input. The destination's free input is
 *  checked with the rest (`inputCapacity`); here:
 *    · a cable that carries no console output (a mic into the stagebox,
 *      anything into the console, the network link) is one link — a second
 *      would carry the same thing;
 *    · the same output twice into the same device is the same signal twice;
 *    · a second cable needs the first to have its output chosen, or the two
 *      would carry the same thing. */
function secondCableVerdict(system: SoundSystem, pair: readonly Link[], a: Placed, b: Placed, out: ConsoleOut | undefined): ConnectVerdict | null {
  if (pair.length === 0) return null;
  const fromName = gearSpec(a.kind).name.toLowerCase();
  const toName = gearSpec(b.kind).name.toLowerCase();
  if (!carriesOutputs(system, { from: a.id, to: b.id, level: pair[0].level })) {
    return { ok: false, reason: `Already connected — one cable carries everything the ${fromName} sends the ${toName}. Tap the cable to remove it.` };
  }
  if (out && pair.some((l) => l.out === out)) {
    return { ok: false, reason: `A cable from the ${fromName} already carries ${outName(out)} into the ${toName} — a second would be the same signal twice.` };
  }
  if (!out && pair.some((l) => !l.out)) {
    return { ok: false, reason: 'The cable already there carries no single output yet — choose its OUTPUT first, then run a second cable for the other output.' };
  }
  return null;
}

/** May these two connect? `out` is the console output the new cable is to
 *  carry, when it is known (a second cable between the same pair must carry
 *  a different one from the first). */
export function canConnect(system: SoundSystem, fromId: string, toId: string, out?: ConsoleOut): ConnectVerdict {
  if (fromId === toId) return { ok: false, reason: 'A device cannot feed itself.' };
  const a = find(system, fromId);
  const b = find(system, toId);
  if (!a || !b) return { ok: false, reason: 'Place both devices first.' };
  const second = secondCableVerdict(system, pairLinks(system, fromId, toId), a, b, out);
  if (second) return second;
  const from = gearSpec(a.kind);
  const to = gearSpec(b.kind);
  if (from.emits.length === 0) {
    return { ok: false, reason: `${from.name} has no signal output${from.kind === 'powerDistro' ? ' — it carries mains power, not audio' : ' — the sound leaves it as air'}.` };
  }
  if (to.accepts.length === 0 || to.accepts.every((l) => l === 'acoustic')) {
    return { ok: false, reason: `${to.name} is a source — signal starts there and cannot be fed into it.` };
  }
  // Safety first: speaker level into anything but a passive loudspeaker.
  if (from.emits.includes('speaker') && !to.accepts.includes('speaker')) {
    return {
      ok: false,
      unsafe: true,
      reason: `UNSAFE — ${from.name} puts out SPEAKER LEVEL (tens of volts). ${to.name} expects ${to.accepts.map(levelWord).join(' or ')}; connecting them damages the input.`,
    };
  }
  // A passive multicore emits exactly what was fed into it.
  const emits = a.kind === 'snake' ? passthroughLevels(system, a.id, from.emits) : from.emits;
  const common = LEVEL_PRIORITY.filter((l) => emits.includes(l) && to.accepts.includes(l));
  if (common.length === 0) {
    return { ok: false, reason: mismatchReason(from.kind, to.kind, from.emits, to.accepts) };
  }
  const inbound = system.links.filter((l) => l.to === toId).length;
  if (inbound >= inputCapacity(b.kind)) {
    return { ok: false, reason: `${to.name} has no free input — it takes ${inputCapacity(b.kind)}.` };
  }
  // The console ↔ stagebox network link and the console ↔ snake multicore
  // are BIDIRECTIONAL: inputs ride up, the console's outputs ride back down
  // the same cable (the network, or the return pairs in the same jacket).
  const returnPath = a.kind === 'console' && (b.kind === 'stagebox' || b.kind === 'snake');
  if (!returnPath && reaches(system, toId, fromId)) {
    return { ok: false, reason: 'That would feed the signal back into itself — a loop, not a system.' };
  }
  return { ok: true, level: common[0] };
}

/** The levels a passive pass-through (an analog snake) carries: whatever its
 *  inbound links carry, or mic level when nothing is plugged in yet. */
function passthroughLevels(system: SoundSystem, id: string, fallback: readonly SignalLevel[]): readonly SignalLevel[] {
  const inbound = system.links.filter((l) => l.to === id).map((l) => l.level);
  return inbound.length ? [...new Set(inbound)] : fallback.length ? ['mic'] : fallback;
}

function levelWord(l: SignalLevel): string {
  return l === 'mic' ? 'mic level' : l === 'line' ? 'line level' : l === 'speaker' ? 'speaker level' : l === 'digital' ? 'a digital network link' : l === 'wireless' ? 'a radio link' : l === 'instrument' ? 'instrument level' : 'sound';
}

function mismatchReason(fromKind: GearKind, toKind: GearKind, emits: readonly SignalLevel[], accepts: readonly SignalLevel[]): string {
  const from = gearSpec(fromKind);
  const to = gearSpec(toKind);
  if (emits.every((l) => l === 'mic') && accepts.includes('line') && !accepts.includes('mic')) {
    return `${from.name} is MIC LEVEL — roughly 40–60 dB below line level, about 100 to 1,000 times smaller in voltage, too small for ${to.name}. It needs a preamp first: route it through the console or a stagebox (some powered loudspeakers carry a mic input — a preamp inside the box).`;
  }
  if (accepts.every((l) => l === 'speaker')) {
    return `${to.name} is passive — it needs a POWER AMPLIFIER between ${from.name} and the cabinet. Line level is far too weak to drive a cone.`;
  }
  if (accepts.every((l) => l === 'wireless')) {
    return `${to.name} only listens to its transmitter. Feed the in-ear transmitter, and it feeds the pack.`;
  }
  if (accepts.every((l) => l === 'instrument')) {
    return `${to.name} takes an instrument- or line-level ¼-inch signal from a pickup, keyboard or playback device, not ${emits.map(levelWord).join('/')}.`;
  }
  if (emits.every((l) => l === 'wireless')) {
    return `${from.name} broadcasts over radio — only an in-ear bodypack can receive it.`;
  }
  return `${from.name} puts out ${emits.map(levelWord).join(' or ')}; ${to.name} accepts ${accepts.map(levelWord).join(' or ')}. No common level — this link carries nothing.`;
}

/* ── mutation helpers (pure — return a new system) ───────────────────────── */

let counter = 0;
/** Mint a stable id for a new placement. Deterministic per kind + count so
 *  tests and saved builds stay legible (`amp-1`, `wedge-3`). */
export function mintId(system: SoundSystem, kind: GearKind): string {
  const n = system.placed.filter((p) => p.kind === kind).length + 1;
  let id = `${kind}-${n}`;
  while (system.placed.some((p) => p.id === id)) id = `${kind}-${n}-${++counter}`;
  return id;
}

export type PlaceVerdict = { ok: true; system: SoundSystem; id: string } | { ok: false; reason: string };

export function place(system: SoundSystem, kind: GearKind, slot: SlotId): PlaceVerdict {
  if (!slotAccepts(slot, kind)) {
    return { ok: false, reason: `${gearSpec(kind).name} does not belong at ${slotDef(slot).label.toLowerCase()}.` };
  }
  if (system.placed.some((p) => p.slot === slot)) {
    return { ok: false, reason: `${slotDef(slot).label} is taken — remove what is there first.` };
  }
  if (!gearSpec(kind).many && system.placed.some((p) => p.kind === kind)) {
    return { ok: false, reason: `This build already has a ${gearSpec(kind).name.toLowerCase()}.` };
  }
  const id = mintId(system, kind);
  return { ok: true, id, system: { placed: [...system.placed, { id, kind, slot }], links: system.links } };
}

export function removePlaced(system: SoundSystem, id: string): SoundSystem {
  return {
    placed: system.placed.filter((p) => p.id !== id),
    links: system.links.filter((l) => l.from !== id && l.to !== id),
  };
}

/** Connect two devices; `out` names the console output the cable carries
 *  (see `consoleWalk`). */
export function connect(system: SoundSystem, fromId: string, toId: string, out?: ConsoleOut): { ok: true; system: SoundSystem; link: Link } | { ok: false; reason: string; unsafe?: boolean } {
  const v = canConnect(system, fromId, toId, out);
  if (!v.ok) return v;
  const link: Link = out ? { from: fromId, to: toId, level: v.level, out } : { from: fromId, to: toId, level: v.level };
  return { ok: true, link, system: { placed: system.placed, links: [...system.links, link] } };
}

/** Remove the cables between two devices — all of them, or with `nth` only
 *  that one (0 = the first run; see `pairIndex`). */
export function disconnect(system: SoundSystem, fromId: string, toId: string, nth?: number): SoundSystem {
  let k = -1;
  return {
    placed: system.placed,
    links: system.links.filter((l) => {
      if (l.from !== fromId || l.to !== toId) return true;
      k++;
      return nth !== undefined && k !== nth;
    }),
  };
}

/** Choose (or clear, with null) the console output one cable carries — the
 *  `nth` cable between the pair (default the first). An output that another
 *  cable between the same pair already carries is refused: the system comes
 *  back unchanged (the OUTPUT key never offers it — `outChoices`). */
export function setLinkOut(system: SoundSystem, fromId: string, toId: string, out: ConsoleOut | null, nth = 0): SoundSystem {
  const pair = pairLinks(system, fromId, toId);
  const target = pair[nth];
  if (!target) return system;
  if (out && pair.some((l) => l !== target && l.out === out)) return system;
  return {
    placed: system.placed,
    links: system.links.map((l) => {
      if (l !== target) return l;
      return out ? { ...l, out } : { from: l.from, to: l.to, level: l.level };
    }),
  };
}

/* ── tracing ─────────────────────────────────────────────────────────────── */

export type Trace = {
  /** Every device a source signal reaches (sources included). */
  reached: ReadonlySet<string>;
  /** Radiating sinks that are reached — the loudspeakers that will make sound. */
  live: readonly string[];
  /** Radiating sinks placed but silent — placed with no complete path. */
  silent: readonly string[];
  /** Sources with no way out (placed, nothing connected downstream). */
  strandedSources: readonly string[];
};

export function trace(system: SoundSystem): Trace {
  const reached = new Set<string>();
  const queue = system.placed.filter((p) => isSource(p.kind)).map((p) => p.id);
  while (queue.length) {
    const id = queue.shift()!;
    if (reached.has(id)) continue;
    reached.add(id);
    for (const l of system.links) if (l.from === id) queue.push(l.to);
  }
  const sinks = system.placed.filter((p) => isSink(p.kind));
  return {
    reached,
    live: sinks.filter((p) => reached.has(p.id)).map((p) => p.id),
    silent: sinks.filter((p) => !reached.has(p.id)).map((p) => p.id),
    strandedSources: system.placed
      .filter((p) => isSource(p.kind) && !system.links.some((l) => l.from === p.id))
      .map((p) => p.id),
  };
}

export function upstream(system: SoundSystem, id: string): Placed[] {
  return system.links.filter((l) => l.to === id).map((l) => find(system, l.from)).filter((p): p is Placed => !!p);
}

export function downstream(system: SoundSystem, id: string): Placed[] {
  return system.links.filter((l) => l.from === id).map((l) => find(system, l.to)).filter((p): p is Placed => !!p);
}

/** The chain of devices behind one sink, source first — the "trace the signal
 *  from source to listener" walk. Follows the first feed at each hop. */
export function chainTo(system: SoundSystem, id: string): Placed[] {
  const out: Placed[] = [];
  const seen = new Set<string>();
  let cur = find(system, id);
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    out.unshift(cur);
    cur = upstream(system, cur.id)[0];
  }
  return out;
}

/* ── structural queries the capstones grade on ───────────────────────────── */

export function count(system: SoundSystem, kind: GearKind): number {
  return system.placed.filter((p) => p.kind === kind).length;
}

export function has(system: SoundSystem, kind: GearKind, min = 1): boolean {
  return count(system, kind) >= min;
}

export function inSlot(system: SoundSystem, slot: SlotId): Placed | undefined {
  return system.placed.find((p) => p.slot === slot);
}

export function inRole(system: SoundSystem, role: SlotRole): Placed[] {
  return system.placed.filter((p) => slotDef(p.slot).role === role);
}

/** Is there a complete path from some source to every radiating sink? */
export function allSinksLive(system: SoundSystem): boolean {
  const t = trace(system);
  return t.live.length > 0 && t.silent.length === 0;
}

/** Does any live path pass through a given kind (e.g. every main goes via a processor)? */
export function feedsThrough(system: SoundSystem, sinkId: string, kind: GearKind): boolean {
  return chainTo(system, sinkId).some((p) => p.kind === kind && p.id !== sinkId);
}

/** What one sink's cable carries from the console: a single output, or '*'
 *  when no single output is chosen (the plot tag reads "OUT ?"). */
export type Feed = ConsoleOut | '*';

type Carry = ReadonlySet<ConsoleOut | '*'>;
const EVERY_OUT: Carry = new Set<ConsoleOut | '*'>(CONSOLE_OUTS);
const NOTHING: Carry = new Set();

export type ConsoleWalk = {
  /** Every radiating sink is fed THROUGH the console — never around it. */
  viaConsole: boolean;
  /** Each radiating sink the console's outputs reach → the output it gets. */
  feeds: ReadonlyMap<string, Feed>;
  /** What reaches each device from the console's outputs. */
  arriving: ReadonlyMap<string, Carry>;
  /** In-ear packs fed a stereo pair at their transmitter → the pair, in
   *  console order (their feed is the in-ear aux of the pair). */
  pairs: ReadonlyMap<string, readonly [ConsoleOut, ConsoleOut]>;
};

const isMulticore = (k: GearKind | undefined) => k === 'stagebox' || k === 'snake';

/** What one cable carries, given what reaches the device it leaves.
 *  · Into the console: nothing — the input side ignores outputs.
 *  · Console → stagebox / snake: EVERY output (the network link, or the
 *    return pairs in the same jacket — owner decision 1).
 *  · Any other cable with an output chosen: that output, if it reaches the
 *    device the cable leaves; a stale choice (it does not) carries '*'.
 *  · No output chosen: whatever reaches the device, passed on. */
function carriedBy(l: Link, kindOf: ReadonlyMap<string, GearKind>, arriving: ReadonlyMap<string, Carry>): Carry {
  const fromKind = kindOf.get(l.from);
  const toKind = kindOf.get(l.to);
  if (toKind === 'console') return NOTHING;
  const at = fromKind === 'console' ? EVERY_OUT : arriving.get(l.from) ?? NOTHING;
  if (at.size === 0) return NOTHING;
  if (fromKind === 'console' && isMulticore(toKind)) return EVERY_OUT;
  // The transmitter → bodypack hop is radio, not a cable: the pack hears
  // whatever the transmitter was sent (SS-R2-02), so no output is chosen on it.
  if (fromKind === 'iemTx') return at;
  if (l.out) return at.has(l.out) ? new Set([l.out]) : new Set(['*']);
  return at;
}

/** An amplifier has two channels: one mix each (SS-R2-01). */
export const AMP_CHANNELS = 2;

/** A stereo in-ear mix: the console's dedicated in-ear pair, Aux 9 · In-ears
 *  L + Aux 10 · In-ears R (odd + even, the pair most consoles link as one
 *  stereo send; round-3 grade R3-SS-01 — it used to be Aux 7 + 8, and Aux 7
 *  is the lobby's announce feed). Any other two outputs are no single feed.
 *  The pack's feed is then the pair's left aux. */
function stereoIemFeed(c: Carry): ConsoleOut | null {
  const outs = [...c].filter((o): o is ConsoleOut => o !== '*');
  if (outs.length !== 2 || c.size !== 2 || !isIemPair(outs)) return null;
  return IEM_PAIR[0];
}

function arrivingAt(system: SoundSystem, kindOf: ReadonlyMap<string, GearKind>): Map<string, Carry> {
  let arriving = new Map<string, Carry>();
  // Relax to a fixed point: each pass recomputes every device from the pass
  // before, so a chain N cables deep settles in N passes.
  for (let pass = 0; pass <= system.links.length + 1; pass++) {
    const next = new Map<string, Set<ConsoleOut | '*'>>();
    for (const l of system.links) {
      const c = carriedBy(l, kindOf, arriving);
      if (c.size === 0) continue;
      const acc = next.get(l.to) ?? new Set<ConsoleOut | '*'>();
      for (const o of c) acc.add(o);
      next.set(l.to, acc);
    }
    const same = next.size === arriving.size && [...next].every(([id, c]) => {
      const prev = arriving.get(id);
      return !!prev && prev.size === c.size && [...c].every((o) => prev.has(o));
    });
    arriving = next;
    if (same) break;
  }
  return arriving;
}

/** The one walk behind "through the console" and "fed from which output".
 *
 *  THROUGH: links carry no bus identity, so `trace` alone lets a build pass
 *  with the console bypassed (a stagebox emits line; playback can drive a
 *  powered box direct). This walk tracks whether the signal has passed a
 *  console yet: a stagebox's or snake's outputs to anything but the console
 *  are the console's RETURNS, so they carry signal only once the console has
 *  been passed. A sink reached on any path that skips the console is
 *  bypassed (wiring findings SS-02, 2026-10-20).
 *
 *  WHICH OUTPUT (WF-SS-02): every output leaves the console; each cable
 *  carries what `carriedBy` says; a sink's feed is the one output that
 *  reaches it, or '*' when none or several are chosen (owner decision 7: the
 *  loudspeaker still lights, only the feed check fails). `trace` and
 *  `chainTo` never read `out`. */
export function consoleWalk(system: SoundSystem): ConsoleWalk {
  const kindOf = new Map(system.placed.map((p) => [p.id, p.kind]));
  const viaConsole = new Set<string>();
  const bypass = new Set<string>();
  const queue: Array<[string, boolean]> = system.placed.filter((p) => isSource(p.kind)).map((p) => [p.id, false]);
  while (queue.length) {
    const [id, passed] = queue.shift()!;
    const seen = passed ? viaConsole : bypass;
    if (seen.has(id)) continue;
    seen.add(id);
    const kind = kindOf.get(id);
    for (const l of system.links) {
      if (l.from !== id) continue;
      const toKind = kindOf.get(l.to);
      if (toKind === 'console') {
        queue.push([l.to, true]);
        continue;
      }
      // Stage-side multicore outputs before the console are its returns: dead.
      if (!passed && isMulticore(kind)) continue;
      queue.push([l.to, passed]);
    }
  }
  const sinks = system.placed.filter((p) => isSink(p.kind));
  const arriving = arrivingAt(system, kindOf);
  const feeds = new Map<string, Feed>();
  const pairs = new Map<string, readonly [ConsoleOut, ConsoleOut]>();
  for (const p of sinks) {
    const c = arriving.get(p.id);
    if (!c || c.size === 0) continue;
    const stereo = p.kind === 'iemPack' ? stereoIemFeed(c) : null;
    if (stereo) pairs.set(p.id, CONSOLE_OUTS.filter((o) => c.has(o)) as unknown as readonly [ConsoleOut, ConsoleOut]);
    const only = c.size === 1 ? [...c][0] : stereo ?? '*';
    feeds.set(p.id, only);
  }
  return {
    viaConsole: sinks.length > 0 && sinks.every((p) => viaConsole.has(p.id) && !bypass.has(p.id)),
    feeds,
    arriving,
    pairs,
  };
}

/** Is every radiating sink fed THROUGH the console — never around it? */
export function sinksThroughConsole(system: SoundSystem): boolean {
  return consoleWalk(system).viaConsole;
}

/** The output one sink is fed from: a single output, '*' when no single
 *  output is chosen, or null when no console output reaches it at all. */
export function feedOf(system: SoundSystem, id: string, walk: ConsoleWalk = consoleWalk(system)): Feed | null {
  return walk.feeds.get(id) ?? null;
}

/** Does choosing an output on this cable mean anything? Not into the
 *  console (the input side), not on the console → stagebox / snake run (it
 *  carries every output), and not before any console output reaches it. */
export function carriesOutputs(system: SoundSystem, l: Link, walk: ConsoleWalk = consoleWalk(system)): boolean {
  const kind = (id: string) => system.placed.find((p) => p.id === id)?.kind;
  const fromKind = kind(l.from);
  const toKind = kind(l.to);
  if (toKind === 'console') return false;
  if (fromKind === 'console') return !isMulticore(toKind);
  if (fromKind === 'iemTx') return false; // radio, not a cable (SS-R2-02)
  return [...(walk.arriving.get(l.from) ?? [])].some((o) => o !== '*');
}

/** The band an amplifier channel drives (round-8 grade R7-SS-02, rule S2):
 *  a passive SUB takes the processor's low band, any other cabinet the top
 *  band. In an active system the crossover comes BEFORE the amplifiers, so a
 *  top and a sub on the same console output are two amp channels — never one
 *  channel paralleling both. */
const ampBand = (k: GearKind | undefined): 'sub' | 'top' => (k === 'passiveSub' ? 'sub' : 'top');

/** The mixes one amplifier passes to its loudspeakers: each distinct
 *  (console output, band) is one amp channel. */
function ampMixes(system: SoundSystem, ampId: string, kindOf: ReadonlyMap<string, GearKind>, walk: ConsoleWalk): Map<string, { out: ConsoleOut; band: 'sub' | 'top' }> {
  const mixes = new Map<string, { out: ConsoleOut; band: 'sub' | 'top' }>();
  for (const l of system.links) {
    if (l.from !== ampId) continue;
    // A cable passing several outputs on reads OUT ? at its loudspeaker
    // already; only single outputs count as the mixes the amp passes.
    const c = carriedBy(l, kindOf, walk.arriving);
    const only = c.size === 1 ? [...c][0] : '*';
    if (only === '*') continue;
    const band = ampBand(kindOf.get(l.to));
    mixes.set(`${only}:${band}`, { out: only, band });
  }
  return mixes;
}

/** Amplifiers asked to pass more mixes to their loudspeakers than they have
 *  channels (SS-R2-01), with the distinct outputs and the channels needed.
 *  One cable INTO an amp may carry every output (owner decision 1); what
 *  counts is how many different mixes leave it — and a passive top and a
 *  passive sub on the same output are two (R7-SS-02). `topAndSub` lists the
 *  outputs this amp sends to a passive top AND a passive sub. */
export function ampsOverChannels(system: SoundSystem, walk: ConsoleWalk = consoleWalk(system)): { id: string; outs: ConsoleOut[]; channels: number; topAndSub: ConsoleOut[] }[] {
  const kindOf = new Map(system.placed.map((p) => [p.id, p.kind]));
  const over: { id: string; outs: ConsoleOut[]; channels: number; topAndSub: ConsoleOut[] }[] = [];
  for (const amp of system.placed.filter((p) => p.kind === 'amp')) {
    const mixes = ampMixes(system, amp.id, kindOf, walk);
    if (mixes.size <= AMP_CHANNELS) continue;
    const outs = new Set([...mixes.values()].map((m) => m.out));
    const topAndSub = CONSOLE_OUTS.filter((o) => mixes.has(`${o}:sub`) && mixes.has(`${o}:top`));
    over.push({ id: amp.id, outs: CONSOLE_OUTS.filter((o) => outs.has(o)), channels: mixes.size, topAndSub });
  }
  return over;
}

/** The outputs a cable may be set to carry: those reaching the device it
 *  leaves, in console order. */
export function outChoices(system: SoundSystem, l: Link, walk: ConsoleWalk = consoleWalk(system)): ConsoleOut[] {
  if (!carriesOutputs(system, l, walk)) return [];
  const fromKind = system.placed.find((p) => p.id === l.from)?.kind;
  const at = fromKind === 'console' ? EVERY_OUT : walk.arriving.get(l.from) ?? NOTHING;
  // A second cable between the same pair never doubles the other's output.
  const nth = pairIndex(system, l);
  const taken = new Set(pairLinks(system, l.from, l.to).filter((_, k) => k !== nth).map((m) => m.out));
  return CONSOLE_OUTS.filter((o) => at.has(o) && !taken.has(o));
}

/** The cable into a device that carries its console output (the one an
 *  OUTPUT choice applies to), if any. */
export function feedLink(system: SoundSystem, id: string, walk: ConsoleWalk = consoleWalk(system)): Link | undefined {
  return system.links.find((l) => l.to === id && carriesOutputs(system, l, walk));
}

/** Every cable into a device that carries a console output — two where a
 *  stereo pair runs on two cables (stagebox → in-ear transmitter, Aux 9 and
 *  Aux 10), each with its own OUTPUT key. */
export function feedLinks(system: SoundSystem, id: string, walk: ConsoleWalk = consoleWalk(system)): Link[] {
  return system.links.filter((l) => l.to === id && carriesOutputs(system, l, walk));
}

/** What one cable carries, for a card: a single output, 'all' (it passes
 *  every output on, e.g. into a processor), '*' (nothing single chosen
 *  among some), or null (no console output on it). */
export function linkCarries(system: SoundSystem, l: Link, walk: ConsoleWalk = consoleWalk(system)): ConsoleOut | 'all' | '*' | null {
  const kindOf = new Map(system.placed.map((p) => [p.id, p.kind]));
  const c = carriedBy(l, kindOf, walk.arriving);
  if (c.size === 0) return null;
  if (c.size === 1) return [...c][0];
  return c.size === EVERY_OUT.size && [...EVERY_OUT].every((o) => c.has(o)) ? 'all' : '*';
}

export const EMPTY_SYSTEM: SoundSystem = { placed: [], links: [] };

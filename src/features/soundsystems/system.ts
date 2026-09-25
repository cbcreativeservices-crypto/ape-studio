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
import type { GearKind, Link, Placed, SignalLevel, SlotId, SlotRole, SoundSystem } from './types';

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

export function canConnect(system: SoundSystem, fromId: string, toId: string): ConnectVerdict {
  if (fromId === toId) return { ok: false, reason: 'A device cannot feed itself.' };
  const a = find(system, fromId);
  const b = find(system, toId);
  if (!a || !b) return { ok: false, reason: 'Place both devices first.' };
  if (system.links.some((l) => l.from === fromId && l.to === toId)) {
    return { ok: false, reason: 'Already connected — tap the link to remove it.' };
  }
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
    return `${from.name} is MIC LEVEL — roughly 40–60 dB, hundreds of times in voltage, too small for ${to.name}. It needs a preamp first: route it through the console or a stagebox (some powered loudspeakers carry a mic input — a preamp inside the box).`;
  }
  if (accepts.every((l) => l === 'speaker')) {
    return `${to.name} is passive — it needs a POWER AMPLIFIER between ${from.name} and the cabinet. Line level moves no cone.`;
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

export function connect(system: SoundSystem, fromId: string, toId: string): { ok: true; system: SoundSystem; link: Link } | { ok: false; reason: string; unsafe?: boolean } {
  const v = canConnect(system, fromId, toId);
  if (!v.ok) return v;
  const link: Link = { from: fromId, to: toId, level: v.level };
  return { ok: true, link, system: { placed: system.placed, links: [...system.links, link] } };
}

export function disconnect(system: SoundSystem, fromId: string, toId: string): SoundSystem {
  return { placed: system.placed, links: system.links.filter((l) => !(l.from === fromId && l.to === toId)) };
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

export const EMPTY_SYSTEM: SoundSystem = { placed: [], links: [] };

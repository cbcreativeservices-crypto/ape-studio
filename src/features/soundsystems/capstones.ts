/**
 * Sound Systems Lab — the ten capstone builds (BUILD mode).
 *
 * Each capstone is a venue brief plus REQUIREMENTS: predicates over the
 * system graph (what is placed, what is connected, what is live) and, for the
 * routing capstones, over the console state. The builder grades them live
 * as the learner works — a checklist that fills itself in — so the build
 * never has to be "submitted" to find out what is missing.
 *
 * Requirement predicates are code, not prose. test/soundSystemsEngine.test.ts
 * constructs a reference system for every capstone and asserts it passes,
 * and that the empty venue passes none — so a requirement can never be
 * authored that no build satisfies.
 */
import {
  auxBus,
  hears,
  mainBus,
  bandConsole,
  matrixBus,
  setMatrixInput,
  setSend,
  subgroupBus,
  type ConsoleState,
} from './console';
import { isSink, isSource } from './gear';
import { auxPurpose, IEM_PAIR, isIemPair, outFamily, outTag } from './outputs';
import { allSinksLive, ampsOverChannels, chainTo, consoleWalk, count, feedsThrough, inRole, inSlot, sinksThroughConsole, slotDef, trace, upstream, type ConsoleWalk, type Feed } from './system';
import type { ConsoleOut, GearKind, Placed, SoundSystem } from './types';

export type Requirement = {
  id: string;
  text: string;
  /** Which panel this requirement is judged in. */
  kind: 'build' | 'route';
  test: (s: SoundSystem, cs: ConsoleState) => boolean;
  /** Why it is not met, in plain words, when one cause is known (shown
   *  under the unmet row). */
  why?: (s: SoundSystem, cs: ConsoleState) => string | null;
};

export type Capstone = {
  id: string;
  n: number;
  title: string;
  venue: string;
  brief: string;
  requirements: Requirement[];
  /** Parts the bin offers for this capstone (keeps the choice honest). */
  bin: readonly GearKind[];
  /** Whether this capstone also opens the console panel. */
  routing: boolean;
};

/* ── shared predicates ───────────────────────────────────────────────────── */

const anySpeakerIn = (s: SoundSystem, slot: Parameters<typeof inSlot>[1]) => {
  const p = inSlot(s, slot);
  return !!p && (p.kind === 'poweredSpeaker' || p.kind === 'passiveSpeaker');
};
const anySubIn = (s: SoundSystem, slot: Parameters<typeof inSlot>[1]) => {
  const p = inSlot(s, slot);
  return !!p && (p.kind === 'poweredSub' || p.kind === 'passiveSub');
};
const wedgesPlaced = (s: SoundSystem) => inRole(s, 'monitor').filter((p) => p.kind === 'wedge' || p.kind === 'poweredWedge').length;
const sourceCount = (s: SoundSystem) => s.placed.filter((p) => isSource(p.kind) && p.kind !== 'powerDistro').length;
const noStranded = (s: SoundSystem) => trace(s).strandedSources.length === 0 && sourceCount(s) > 0;
const live = (s: SoundSystem) => s.placed.length > 0 && allSinksLive(s) && noStranded(s);
/** Every radiating sink in a role has a processor somewhere behind it. */
const roleViaProcessor = (s: SoundSystem, role: Parameters<typeof inRole>[1]) => {
  const sinks = inRole(s, role);
  return sinks.length > 0 && sinks.every((p) => feedsThrough(s, p.id, 'processor'));
};
/** Every source reaches the console THROUGH the stagebox, never directly. */
const allSourcesViaStagebox = (s: SoundSystem) => {
  const sources = s.placed.filter((p) => isSource(p.kind) && p.kind !== 'powerDistro');
  if (sources.length === 0) return false;
  return sources.every((src) => s.links.filter((l) => l.from === src.id).every((l) => s.placed.find((p) => p.id === l.to)?.kind === 'stagebox'));
};
const consoleFedByStagebox = (s: SoundSystem) => {
  const con = s.placed.find((p) => p.kind === 'console');
  return !!con && upstream(s, con.id).some((p) => p.kind === 'stagebox');
};
/** The console's outputs come back DOWN the network link and leave the
 *  stagebox (round-8 grade R7-SS-10: the brief said so, a direct console →
 *  processor run passed). Every cable out of the console goes to the
 *  stagebox, and at least one does. */
export const outputsViaStagebox = (s: SoundSystem) => {
  const con = s.placed.find((p) => p.kind === 'console');
  if (!con) return false;
  const outs = s.links.filter((l) => l.from === con.id).map((l) => s.placed.find((p) => p.id === l.to)?.kind);
  return outs.length > 0 && outs.every((k) => k === 'stagebox');
};
/** The subs are fed by their OWN link from the console or processor — not from a top. */
const subsHaveDedicatedFeed = (s: SoundSystem) => {
  const subs = s.placed.filter((p) => p.kind === 'poweredSub' || p.kind === 'passiveSub');
  return subs.length > 0 && subs.every((sub) => {
    const chain = chainTo(s, sub.id);
    return chain.some((p) => p.kind === 'console') && !chain.some((p) => p.kind === 'poweredSpeaker' || p.kind === 'passiveSpeaker');
  });
};
/** The tops are not fed THROUGH a sub's high-passed output. */
const topsNotViaSub = (s: SoundSystem) => {
  const tops = s.placed.filter((p) => p.kind === 'poweredSpeaker' || p.kind === 'passiveSpeaker');
  return tops.length > 0 && tops.every((t) => !chainTo(s, t.id).some((p) => p.kind === 'poweredSub'));
};
const passiveHasAmp = (s: SoundSystem) => {
  const passive = s.placed.filter((p) => p.kind === 'passiveSpeaker' || p.kind === 'passiveSub' || p.kind === 'wedge');
  return passive.every((p) => upstream(s, p.id).some((u) => u.kind === 'amp'));
};

/* ── which console output feeds each loudspeaker (WF-SS-02) ──────────────── */

const isMainOut = (f: Feed) => f !== '*' && outFamily(f) === 'main';
const isMonitorAux = (f: Feed) => f !== '*' && (auxPurpose(f) === 'monitor' || auxPurpose(f) === 'iem');

/** A house-left box takes MAIN L, a house-right box MAIN R. */
const ownSideMain = (p: Placed, f: Feed) => (slotDef(p.slot).x < 180 ? f === 'mainL' : slotDef(p.slot).x > 180 ? f === 'mainR' : false);

/** Is this output right for the loudspeaker at this position? (owner
 *  decisions 2–5, 2026-10-20; round-2 grade SS-R2-05/06/16) A monitor
 *  position takes a MONITOR aux (Aux 1–4 — not the in-ear aux, never a
 *  main); an in-ear pack a monitor or in-ear aux; main left takes MAIN L or
 *  MONO, main right MAIN R or MONO, the centre cluster MONO; a sub left or
 *  right any main, Aux 6 or Matrix 1, a centre sub MONO, Aux 6 or Matrix 1
 *  (MAIN L alone is half a mix). Fills and delays need their own level and
 *  delay, and a left box belongs on the left side (round-3 grade R3-SS-02,
 *  owner: tighten): a front fill takes its own side's main, MONO or Matrix 2
 *  (front fills); a delay its own side's main or MONO — the processor sets
 *  its delay; never the front-fill matrix, the lobby or the recording. No
 *  single output ('*' or none) is never right. */
export function feedFits(p: Placed, f: Feed | null): boolean {
  if (!f || f === '*') return false;
  if (p.kind === 'iemPack') return isMonitorAux(f);
  switch (slotDef(p.slot).role) {
    case 'monitor':
      return auxPurpose(f) === 'monitor';
    case 'main':
      return p.slot === 'mainL' ? f === 'mainL' || f === 'mainMono' : p.slot === 'mainR' ? f === 'mainR' || f === 'mainMono' : f === 'mainMono';
    case 'sub':
      if (p.slot === 'subC' || p.slot === 'subC2') return f === 'mainMono' || f === 'aux6' || f === 'mtx1';
      return isMainOut(f) || f === 'aux6' || f === 'mtx1';
    case 'fill':
      return ownSideMain(p, f) || f === 'mainMono' || f === 'mtx2';
    case 'delay':
      return ownSideMain(p, f) || f === 'mainMono';
    default:
      return false;
  }
}

type FeedView = { s: SoundSystem; w: ConsoleWalk; feed: (id: string) => Feed | null };
const feedView = (s: SoundSystem): FeedView => {
  const w = consoleWalk(s);
  return { s, w, feed: (id) => w.feeds.get(id) ?? null };
};
const sinksOf = (v: FeedView) => v.s.placed.filter((p) => isSink(p.kind));
/** Every loudspeaker (and in-ear pack) gets an output that fits its
 *  position, and no amplifier passes more mixes than it has channels. */
const allFeedsFit = (v: FeedView) => sinksOf(v).length > 0 && sinksOf(v).every((p) => feedFits(p, v.feed(p.id))) && ampsOverChannels(v.s, v.w).length === 0 && !iemTxFromProcessor(v.s) && !wedgeFromProcessor(v.s);

/** An in-ear transmitter fed from the loudspeaker processor (owner
 *  2026-10-21: the old stereo reference ran In-ears R through it — wrong to a
 *  pro). The processor's outputs are the house mix, shaped for the PA. */
export function iemTxFromProcessor(s: SoundSystem): boolean {
  const kind = (id: string) => s.placed.find((p) => p.id === id)?.kind;
  return s.links.some((l) => kind(l.from) === 'processor' && kind(l.to) === 'iemTx');
}

/** A monitor wedge fed through the loudspeaker processor (round-8 grade
 *  R7-SS-11: the in-ear transmitter already failed this way while a wedge
 *  passed). One rule for both: monitor feeds come from the console's aux
 *  outputs (or their stagebox returns), never the house processor. Walks
 *  every cable upstream of each wedge, stopping at the console. */
export function wedgeFromProcessor(s: SoundSystem): boolean {
  const kind = (id: string) => s.placed.find((p) => p.id === id)?.kind;
  const wedges = s.placed.filter((p) => p.kind === 'wedge' || p.kind === 'poweredWedge');
  return wedges.some((w) => {
    const seen = new Set<string>([w.id]);
    const queue = [w.id];
    while (queue.length) {
      const id = queue.shift()!;
      for (const l of s.links) {
        if (l.to !== id || seen.has(l.from)) continue;
        const k = kind(l.from);
        if (k === 'processor') return true;
        if (k === 'console') continue;
        seen.add(l.from);
        queue.push(l.from);
      }
    }
    return false;
  });
}

/** The one plain line the FEEDS row shows for a wedge through the processor. */
export const WEDGE_FROM_PROCESSOR_WHY =
  'A wedge is fed through the loudspeaker processor — that carries the house mix with its EQ, delay and limiting for the PA, not the performer’s mix. Monitor feeds come from the console’s aux outputs: run each wedge (or its amplifier) from the console or a stagebox return, on its own aux.';

/** The one plain line the FEEDS row shows for it. */
export const IEM_FROM_PROCESSOR_WHY =
  'The in-ear transmitter is fed from the loudspeaker processor — that carries the house mix with its EQ, delay and limiting for the PA, not the performer’s in-ear mix. Feed it from the stagebox: Aux 8 on one cable, or for stereo Aux 9 and Aux 10 on two cables.';
/** Stereo: MAIN L into the left main, MAIN R into the right — mono to both is not stereo. */
const stereoLR = (v: FeedView) => {
  const l = inSlot(v.s, 'mainL');
  const r = inSlot(v.s, 'mainR');
  return !!l && !!r && v.feed(l.id) === 'mainL' && v.feed(r.id) === 'mainR';
};
const subsOn = (v: FeedView, outs: readonly Feed[]) => {
  const subs = inRole(v.s, 'sub');
  return subs.length > 0 && subs.every((p) => outs.includes(v.feed(p.id) ?? '*'));
};
/** Each wedge on a DIFFERENT monitor aux (owner decision 4) — not
 *  necessarily wedge N on aux N. */
const wedgesOnOwnAux = (v: FeedView) => {
  const feeds = inRole(v.s, 'monitor').filter((p) => p.kind === 'wedge' || p.kind === 'poweredWedge').map((p) => v.feed(p.id));
  return feeds.length > 0 && new Set(feeds).size === feeds.length;
};
const fillsOn = (v: FeedView, out: Feed) => {
  const fills = inRole(v.s, 'fill');
  return fills.length > 0 && fills.every((p) => v.feed(p.id) === out);
};
/** Stereo in-ears: the pack fed the dedicated In-ears L/R pair. */
const iemOnPair = (w: ConsoleWalk, id: string) => isIemPair(w.pairs.get(id));
/** The in-ears on the in-ear aux (Aux 8), or in stereo on the dedicated
 *  In-ears L/R pair (Aux 9 + 10) — never another pair (R3-SS-01). */
const iemOnInEarAux = (v: FeedView) => {
  const packs = v.s.placed.filter((p) => p.kind === 'iemPack');
  return packs.length > 0 && packs.every((p) => v.feed(p.id) === 'aux8' || iemOnPair(v.w, p.id));
};

/** The FEEDS row every capstone carries: the common fit plus the
 *  capstone's own output checks, in one line of plain words. */
const feedsReq = (text: string, extra: (v: FeedView) => boolean = () => true): Requirement => ({
  ...req('feeds', text, 'build', (s) => {
    const v = feedView(s);
    return allFeedsFit(v) && extra(v);
  }),
  why: (s) => {
    const over = ampsOverChannels(s)[0];
    if (over?.topAndSub.length) return topAndSubWhy(over.topAndSub);
    if (over) return `This lab’s amplifier has two channels: one mix each. This one is asked to pass ${over.outs.length} (${over.outs.map(outTag).join(', ')}) — give the extra wedges or boxes an amplifier of their own.`;
    return misfitWhy(s);
  },
});

/** The plain reason when one amplifier would have to run a passive top and a
 *  passive sub on one channel (round-8 grade R7-SS-02, rule S2). */
export function topAndSubWhy(outs: readonly ConsoleOut[]): string {
  return `One amplifier is driving a passive top and a passive sub from ${outs.map(outTag).join(' and ')} — on a two-channel amplifier that puts a top and a sub on one channel, with no crossover split between them. Tops and subs need their own amp channels after the processor’s crossover: give the subs an amplifier (or channels) of their own.`;
}

/** The plain reason a fill, a delay or an in-ear pack is on the wrong
 *  output, when one of them is (R3-SS-01/02). */
function misfitWhy(s: SoundSystem): string | null {
  if (iemTxFromProcessor(s)) return IEM_FROM_PROCESSOR_WHY;
  if (wedgeFromProcessor(s)) return WEDGE_FROM_PROCESSOR_WHY;
  const v = feedView(s);
  for (const p of sinksOf(v)) {
    const f = v.feed(p.id);
    if (!f || feedFits(p, f)) continue;
    const role = slotDef(p.slot).role;
    const side = slotDef(p.slot).x < 180 ? 'left' : 'right';
    if (role === 'fill') return `A front fill needs its own level and delay: give it Matrix 2 (front fills), or MONO or its own side’s main. A ${side} fill belongs on the ${side} side.`;
    if (role === 'delay') return `A delay speaker takes its own side’s main or MONO — the processor gives it its own level and delay. Matrix 2 belongs to the front fills, and a ${side} delay belongs on the ${side} side.`;
  }
  const pack = s.placed.find((p) => p.kind === 'iemPack' && (v.w.arriving.get(p.id)?.size ?? 0) === 2 && !iemOnPair(v.w, p.id));
  if (pack) return 'A stereo in-ear mix uses the In-ears L/R pair: Aux 9 and Aux 10. Aux 7 is the announce feed for the lobby.';
  return null;
}

/* ── console predicates for the routing capstones ────────────────────────── */

const drumsSubgrouped = (cs: ConsoleState) => {
  const drums = cs.channels.filter((c) => c.family === 'drums');
  return drums.length > 0 && drums.every((c) => c.subgroup === 'sub-drums') && hears(subgroupBus(cs, 'sub-drums')).length === drums.length;
};
const drumsReachMain = (cs: ConsoleState) => cs.channels.filter((c) => c.family === 'drums').every((c) => hears(mainBus(cs)).some((h) => h.channelId === c.id));
const vocalReverbPost = (cs: ConsoleState) => {
  const vox = cs.channels.filter((c) => c.family === 'vocal');
  return vox.length > 0 && vox.every((c) => c.sends.aux5?.tap === 'post' && c.sends.aux5.db > -60);
};
const bandOnDca = (cs: ConsoleState) => cs.channels.filter((c) => c.family !== 'speech' && c.family !== 'playback').every((c) => c.dca === 'dca-band');
const fourMonitorMixes = (cs: ConsoleState) => ['aux1', 'aux2', 'aux3', 'aux4'].every((a) => hears(auxBus(cs, a)).length > 0);
/** Every wedge's aux carries a mix on the console (SS-R2-05). */
const wedgeAuxesCarry = (s: SoundSystem, cs: ConsoleState) => {
  const w = consoleWalk(s);
  return inRole(s, 'monitor').every((p) => {
    const f = w.feeds.get(p.id);
    // A wedge on any other output fails FEEDS already; here only its mix counts.
    return !f || f === '*' || auxPurpose(f) !== 'monitor' || hears(auxBus(cs, f)).length > 0;
  });
};
/** The in-ear aux carries the singer's vocal, pre-fader (SS-R2-03) — Aux 8,
 *  or BOTH sides of the In-ears L/R pair when the build feeds the pack in
 *  stereo (R3-SS-01). */
const vocalPreOn = (cs: ConsoleState, aux: string) => {
  const send = cs.channels.find((c) => c.id === 'vox')?.sends[aux];
  return !!send && send.tap === 'pre' && send.db > -60 && hears(auxBus(cs, aux)).some((h) => h.channelId === 'vox');
};
const iemVocalPre = (s: SoundSystem, cs: ConsoleState) => {
  const w = consoleWalk(s);
  const stereo = s.placed.some((p) => p.kind === 'iemPack' && iemOnPair(w, p.id));
  return stereo ? IEM_PAIR.every((a) => vocalPreOn(cs, a)) : vocalPreOn(cs, 'aux8');
};
// A send at OFF (≤ −60 dB) is no send — an unused wedge stepped ▼ must not
// fail "every monitor send is PRE" (bug hunt 2026-09-29).
const monitorsPre = (cs: ConsoleState) =>
  cs.channels.every((c) => ['aux1', 'aux2', 'aux3', 'aux4'].every((a) => !c.sends[a] || c.sends[a].db <= -60 || c.sends[a].tap === 'pre'));
const fillsFromMain = (cs: ConsoleState) => 'main' in cs.matrices.find((m) => m.id === 'mx-fills')!.inputs && hears(matrixBus(cs, 'mx-fills')).length > 0;
const lobbyFromMainAndMc = (cs: ConsoleState) => {
  const m = cs.matrices.find((x) => x.id === 'mx-lobby')!;
  const heard = hears(matrixBus(cs, 'mx-lobby'));
  // The announce mic must arrive by its OWN route (an aux the matrix takes),
  // not merely because it is in the main mix — that is the "plus a little
  // more of the mic" the lobby asks for.
  const viaAux = Object.keys(m.inputs).some((src) => src !== 'main' && hears(auxBus(cs, src)).some((h) => h.channelId === 'mc'));
  return 'main' in m.inputs && viaAux && heard.length > 1;
};
/** Matrix-fed subs: the sub matrix takes the MAIN mix (its own level and delay). */
const subsMatrixFromMain = (cs: ConsoleState) => {
  const m = cs.matrices.find((x) => x.id === 'mx-subs')!;
  return 'main' in m.inputs && hears(matrixBus(cs, 'mx-subs')).length > 0;
};
/** Aux-fed subs: the sub aux carries only the low-frequency sources. */
const subAuxLowOnly = (cs: ConsoleState) => {
  const heard = hears(auxBus(cs, 'aux6'));
  return heard.length > 0 && heard.every((h) => ['kick', 'bass', 'keys'].includes(h.channelId));
};
const recordingFromMain = (cs: ConsoleState) => 'main' in cs.matrices.find((m) => m.id === 'mx-rec')!.inputs && hears(matrixBus(cs, 'mx-rec')).length > 0;
const vocalsNotInSubs = (cs: ConsoleState) => cs.channels.filter((c) => c.family === 'vocal' || c.family === 'speech').every((c) => !c.sends.aux6 || c.sends.aux6.db <= -60);

/* ── the ten ─────────────────────────────────────────────────────────────── */

const req = (id: string, text: string, kind: Requirement['kind'], test: Requirement['test']): Requirement => ({ id, text, kind, test });

/** Every build is graded on it: the console is IN the path, not beside it
 *  (wiring findings SS-02, 2026-10-20). */
const VIA_CONSOLE = req('viaConsole', 'Every loudspeaker is fed THROUGH the console — nothing goes around the mix', 'build', (s) => count(s, 'console') >= 1 && sinksThroughConsole(s));

export const CAPSTONES: readonly Capstone[] = [
  {
    id: 'speech',
    n: 1,
    title: 'Speech system',
    venue: 'A meeting room for sixty. One presenter.',
    brief: 'One microphone, two powered loudspeakers, a small console. The simplest complete system — and every rule of the larger ones is already in it.',
    bin: ['vocalMic', 'console', 'poweredSpeaker', 'powerDistro'],
    routing: false,
    requirements: [
      req('mic', 'One vocal microphone on stage', 'build', (s) => count(s, 'vocalMic') >= 1),
      req('console', 'A mixing console at front of house', 'build', (s) => count(s, 'console') === 1),
      req('mains', 'A powered loudspeaker at main left AND main right', 'build', (s) => anySpeakerIn(s, 'mainL') && anySpeakerIn(s, 'mainR')),
      req('live', 'Every loudspeaker is live from the microphone', 'build', live),
      VIA_CONSOLE,
      feedsReq('Outputs: the mains on MAIN L and MAIN R — or MONO into both'),
    ],
  },
  {
    id: 'mono-music',
    n: 2,
    title: 'Small mono music system',
    venue: 'A café corner. Singer with guitar, plus a backing track.',
    brief: 'A single loudspeaker position covers a narrow room better than two fighting each other. Build a MONO system: three sources, one main position, and — because the backing track carries real low end — a subwoofer.',
    bin: ['vocalMic', 'instrumentMic', 'di', 'playback', 'console', 'poweredSpeaker', 'poweredSub', 'powerDistro'],
    routing: false,
    requirements: [
      req('sources', 'Three sources: a vocal mic, a DI (or instrument mic), and playback', 'build', (s) => count(s, 'vocalMic') >= 1 && (count(s, 'di') + count(s, 'instrumentMic')) >= 1 && count(s, 'playback') >= 1),
      req('console', 'A mixing console', 'build', (s) => count(s, 'console') === 1),
      req('mono', 'ONE loudspeaker at the centre main position (a single box over the sub) — no left/right pair', 'build', (s) => anySpeakerIn(s, 'mainC') && !anySpeakerIn(s, 'mainL') && !anySpeakerIn(s, 'mainR')),
      req('sub', 'A subwoofer at the centre sub position', 'build', (s) => anySubIn(s, 'subC')),
      req('live', 'Every loudspeaker live, every source connected', 'build', live),
      VIA_CONSOLE,
      feedsReq('Outputs: the centre box on MAIN MONO; the sub on MONO, Aux 6 or Matrix 1'),
    ],
  },
  {
    id: 'stereo-subs',
    n: 4,
    title: 'Stereo band system with subwoofers',
    venue: 'A 300-capacity club. Four-piece band.',
    brief: 'Left and right mains, left and right subs, a processor between the console and the amplification so crossover and limiting live in one place. Passive cabinets — so the amplifiers are yours to place and wire.',
    bin: ['vocalMic', 'instrumentMic', 'di', 'stagebox', 'console', 'processor', 'amp', 'passiveSpeaker', 'passiveSub', 'powerDistro'],
    routing: false,
    requirements: [
      req('sources', 'At least four stage sources', 'build', (s) => sourceCount(s) >= 4),
      req('console', 'A console', 'build', (s) => count(s, 'console') === 1),
      req('mains', 'Loudspeakers at main left and main right', 'build', (s) => anySpeakerIn(s, 'mainL') && anySpeakerIn(s, 'mainR')),
      req('subs', 'Subwoofers at sub left and sub right', 'build', (s) => anySubIn(s, 'subL') && anySubIn(s, 'subR')),
      req('processor', 'Every main and sub is fed THROUGH the loudspeaker processor', 'build', (s) => roleViaProcessor(s, 'main') && roleViaProcessor(s, 'sub')),
      req('amps', 'Every passive cabinet is driven by a power amplifier', 'build', (s) => passiveHasAmp(s) && count(s, 'amp') >= 1),
      req('live', 'Everything live', 'build', live),
      VIA_CONSOLE,
      feedsReq('Outputs: MAIN L to the left main, MAIN R to the right; the subs on MAIN MONO, a sub aux or matrix', stereoLR),
    ],
  },
  {
    id: 'two-one',
    n: 3,
    title: '2.1 with a dedicated subwoofer output',
    venue: 'A DJ night in a bar. Playback only.',
    brief: 'Two common ways to wire a 2.1: (a) the tops fed from the powered sub’s HIGH-PASSED outputs — two cables (L and R) into the sub where it has two inputs, or one cable, a mono feed, where it has one, like this lab’s — and the sub’s own crossover does the split; (b) the sub on its OWN console output and the tops fed direct, each with its own high-pass. Build (b) here, because it makes the sub level a fader move at the console. Stereo or MONO into both tops both pass: many small systems run mono, so every seat hears the whole mix rather than one side of it.',
    bin: ['playback', 'wirelessRx', 'console', 'poweredSpeaker', 'poweredSub', 'powerDistro'],
    routing: false,
    requirements: [
      req('playback', 'A playback source (and an announcement mic receiver if you like)', 'build', (s) => count(s, 'playback') >= 1),
      req('console', 'A console', 'build', (s) => count(s, 'console') === 1),
      req('tops', 'Powered tops at main left and right', 'build', (s) => anySpeakerIn(s, 'mainL') && anySpeakerIn(s, 'mainR')),
      req('sub', 'A powered subwoofer', 'build', (s) => count(s, 'poweredSub') >= 1),
      req('dedicated', 'The sub is fed by its OWN link from the console — not from a top', 'build', subsHaveDedicatedFeed),
      req('topsDirect', 'For THIS build the tops are fed direct, not through the sub (the sub’s pass-through is the other valid way — see the brief)', 'build', topsNotViaSub),
      req('live', 'Everything live', 'build', live),
      VIA_CONSOLE,
      // owner 2026-10-21: mono into both tops is accepted here — many small
      // systems run mono so every seat hears the whole mix
      feedsReq('Outputs: the tops on MAIN L and MAIN R — or MONO into both; the sub on its own output — Aux 6 or Matrix 1', (v) => subsOn(v, ['aux6', 'mtx1'])),
    ],
  },
  {
    id: 'monitors',
    n: 6,
    title: 'Band with four monitor mixes',
    venue: 'A theatre stage. Four musicians who each want something different.',
    brief: 'Four wedges, four positions, four mixes. Build the stage side: the wedges and what drives them. Then open the console and give each aux a mix — pre-fader, so the house faders never touch them.',
    bin: ['vocalMic', 'instrumentMic', 'di', 'stagebox', 'console', 'amp', 'poweredSpeaker', 'wedge', 'poweredWedge', 'powerDistro'],
    routing: true,
    requirements: [
      req('sources', 'At least four stage sources', 'build', (s) => sourceCount(s) >= 4),
      req('wedges', 'Four wedges in the four monitor positions', 'build', (s) => wedgesPlaced(s) >= 4),
      req('driven', 'Every passive wedge has an amplifier; every wedge is live', 'build', (s) => passiveHasAmp(s) && live(s)),
      req('mains', 'A main pair for the house', 'build', (s) => anySpeakerIn(s, 'mainL') && anySpeakerIn(s, 'mainR')),
      VIA_CONSOLE,
      feedsReq('Outputs: MAIN L to the left main, MAIN R to the right; each wedge on a different monitor aux', (v) => stereoLR(v) && wedgesOnOwnAux(v)),
      req('fourMixes', 'Console: something is sent to each of Aux 1–4', 'route', (s, cs) => fourMonitorMixes(cs) && wedgeAuxesCarry(s, cs)),
      req('pre', 'Console: every monitor send is PRE-fader', 'route', (_s, cs) => monitorsPre(cs)),
    ],
  },
  {
    id: 'groups-fx',
    n: 7,
    title: 'Subgroups and effects',
    venue: 'The same theatre, mixed properly.',
    brief: 'A routing capstone. Put the drums on their subgroup and make sure the subgroup reaches the house; send the vocals to the reverb POST-fader; and hang the whole band on one DCA so a speech cue is one fader move.',
    bin: ['vocalMic', 'instrumentMic', 'di', 'console', 'poweredSpeaker', 'powerDistro'],
    routing: true,
    requirements: [
      req('system', 'A working system: sources, console, live mains', 'build', (s) => count(s, 'console') === 1 && anySpeakerIn(s, 'mainL') && anySpeakerIn(s, 'mainR') && live(s)),
      VIA_CONSOLE,
      feedsReq('Outputs: the mains on MAIN L and MAIN R — or MONO into both'),
      req('drumsSub', 'Kick, snare and overheads on the DRUMS subgroup', 'route', (_s, cs) => drumsSubgrouped(cs)),
      req('drumsMain', 'The drums still reach the main mix (the subgroup is assigned to main)', 'route', (_s, cs) => drumsReachMain(cs)),
      req('reverb', 'Both vocals sent to Aux 5 (reverb), POST-fader', 'route', (_s, cs) => vocalReverbPost(cs)),
      req('dca', 'Every band channel (not the announce mic or playback) on the BAND DCA', 'route', (_s, cs) => bandOnDca(cs)),
    ],
  },
  {
    id: 'matrices',
    n: 8,
    title: 'Matrices for mains, fills and lobby',
    venue: 'A conference hall with front fills and a lobby overflow.',
    brief: 'The mains take the main mix. The front fills take the main mix through a matrix so they can have their own level and delay. The lobby takes the main mix PLUS the announcement microphone — sent to an aux kept for exactly that, so no wedge hears it — through another matrix. The subs are matrix-fed from the main mix on a matrix of their own, with their own level and delay.',
    bin: ['vocalMic', 'wirelessRx', 'playback', 'console', 'processor', 'poweredSpeaker', 'poweredSub', 'powerDistro'],
    routing: true,
    requirements: [
      req('system', 'Mains, front fills and subs placed and live', 'build', (s) => anySpeakerIn(s, 'mainL') && anySpeakerIn(s, 'mainR') && anySpeakerIn(s, 'frontFillL') && anySpeakerIn(s, 'frontFillR') && count(s, 'poweredSub') >= 1 && live(s)),
      VIA_CONSOLE,
      feedsReq('Outputs: MAIN L to the left main, MAIN R to the right; the front fills on Matrix 2, the subs on Matrix 1', (v) => stereoLR(v) && fillsOn(v, 'mtx2') && subsOn(v, ['mtx1'])),
      req('fills', 'Matrix 2 (front fills) takes the MAIN mix', 'route', (_s, cs) => fillsFromMain(cs)),
      req('lobby', 'Matrix 3 (lobby) takes the main mix AND the announce mic by its own route — the mic sent to Aux 7, the matrix taking Aux 7', 'route', (_s, cs) => lobbyFromMainAndMc(cs)),
      req('subs', 'Matrix 1 (subs) takes the MAIN mix', 'route', (_s, cs) => subsMatrixFromMain(cs)),
      req('noVox', 'Nothing vocal is sent to the sub aux (Aux 6)', 'route', (_s, cs) => vocalsNotInSubs(cs)),
    ],
  },
  {
    id: 'outdoor',
    n: 9,
    title: 'Outdoor system with front fills and delays',
    venue: 'A park stage for two thousand, ninety metres deep.',
    brief: 'Mains and subs left and right, front fills for the first rows the mains fly over, and delay loudspeakers halfway back — every one of them through the processor, because alignment is what makes this one system rather than six.',
    bin: ['vocalMic', 'instrumentMic', 'di', 'stagebox', 'console', 'processor', 'amp', 'passiveSpeaker', 'passiveSub', 'poweredSpeaker', 'powerDistro'],
    routing: false,
    requirements: [
      req('mains', 'Mains left and right', 'build', (s) => anySpeakerIn(s, 'mainL') && anySpeakerIn(s, 'mainR')),
      req('subs', 'Subs left and right', 'build', (s) => anySubIn(s, 'subL') && anySubIn(s, 'subR')),
      req('fills', 'Front fills left and right', 'build', (s) => anySpeakerIn(s, 'frontFillL') && anySpeakerIn(s, 'frontFillR')),
      req('delays', 'Delay loudspeakers left and right', 'build', (s) => anySpeakerIn(s, 'delayL') && anySpeakerIn(s, 'delayR')),
      req('processor', 'Mains, subs, fills and delays ALL fed through the processor', 'build', (s) => roleViaProcessor(s, 'main') && roleViaProcessor(s, 'sub') && roleViaProcessor(s, 'fill') && roleViaProcessor(s, 'delay')),
      req('amps', 'Every passive cabinet has an amplifier', 'build', passiveHasAmp),
      req('live', 'Everything live', 'build', live),
      VIA_CONSOLE,
      feedsReq('Outputs: MAIN L to the left main, MAIN R to the right; the subs on MAIN MONO, a sub aux or matrix; each front fill on Matrix 2, MONO or its own side’s main; each delay on its own side’s main or MONO', stereoLR),
    ],
  },
  {
    id: 'network',
    n: 5,
    title: 'Digital stagebox and networked audio',
    venue: 'A festival side stage with a long run to front of house.',
    brief: 'Every source goes into the stagebox, ONE network link carries them to the console, and the console’s outputs come back down the same link to leave the stagebox at line level. No analog snake anywhere.',
    bin: ['vocalMic', 'instrumentMic', 'di', 'wirelessRx', 'stagebox', 'console', 'processor', 'amp', 'passiveSpeaker', 'poweredSpeaker', 'poweredSub', 'powerDistro'],
    routing: false,
    requirements: [
      req('stagebox', 'A digital stagebox on stage', 'build', (s) => count(s, 'stagebox') === 1),
      req('sources', 'At least four sources, EVERY one into the stagebox (none straight to the console)', 'build', (s) => sourceCount(s) >= 4 && allSourcesViaStagebox(s)),
      req('link', 'The console is fed by the stagebox over the network link', 'build', consoleFedByStagebox),
      req('returns', 'The console’s outputs come back down the same link and leave the stagebox — no cable from the console to anything else', 'build', outputsViaStagebox),
      req('noSnake', 'No analog snake', 'build', (s) => count(s, 'snake') === 0),
      req('mains', 'A live main pair (and subs if you like)', 'build', (s) => anySpeakerIn(s, 'mainL') && anySpeakerIn(s, 'mainR') && live(s)),
      VIA_CONSOLE,
      feedsReq('Outputs: MAIN L to the left main, MAIN R to the right (subs, if any, on MAIN MONO, a sub aux or matrix)', stereoLR),
    ],
  },
  {
    id: 'festival',
    n: 10,
    title: 'Festival-style complete system',
    venue: 'Main stage. Mains, subs, monitors and a recording feed.',
    brief: 'Everything at once. Stagebox on stage, processor in the rack, mains and subs through it, four monitor mixes, an in-ear system for the singer — and on the console, a recording matrix and an aux-fed sub bus that carries kick, bass and keys and nothing else. One console mixes house AND monitors here; on a real main stage the inputs are split to a separate monitor console at side stage.',
    bin: ['vocalMic', 'instrumentMic', 'di', 'wirelessRx', 'stagebox', 'console', 'processor', 'amp', 'passiveSpeaker', 'passiveSub', 'wedge', 'poweredWedge', 'iemTx', 'iemPack', 'powerDistro'],
    routing: true,
    requirements: [
      req('stagebox', 'Stagebox on stage, feeding the console', 'build', (s) => count(s, 'stagebox') === 1 && consoleFedByStagebox(s)),
      req('sources', 'At least six sources', 'build', (s) => sourceCount(s) >= 6),
      req('pa', 'Mains and subs left and right, through the processor', 'build', (s) => anySpeakerIn(s, 'mainL') && anySpeakerIn(s, 'mainR') && anySubIn(s, 'subL') && anySubIn(s, 'subR') && roleViaProcessor(s, 'main') && roleViaProcessor(s, 'sub')),
      req('monitors', 'Four wedges placed and live', 'build', (s) => wedgesPlaced(s) >= 4),
      req('iem', 'An in-ear transmitter feeding a bodypack', 'build', (s) => count(s, 'iemTx') >= 1 && count(s, 'iemPack') >= 1 && trace(s).live.some((id) => s.placed.find((p) => p.id === id)?.kind === 'iemPack')),
      req('live', 'Everything live, every passive cabinet amplified', 'build', (s) => passiveHasAmp(s) && live(s)),
      VIA_CONSOLE,
      feedsReq('Outputs: MAIN L left, MAIN R right; each wedge on a different monitor aux; the in-ears on Aux 8 (or, for a stereo mix, the In-ears L/R pair: Aux 9 + 10, two cables from the stagebox); the subs on Aux 6', (v) => stereoLR(v) && wedgesOnOwnAux(v) && iemOnInEarAux(v) && subsOn(v, ['aux6'])),
      req('fourMixes', 'Console: four monitor mixes, all pre-fader', 'route', (s, cs) => fourMonitorMixes(cs) && monitorsPre(cs) && wedgeAuxesCarry(s, cs)),
      req('iemMix', 'Console: Aux 8 (in-ears) carries the singer’s vocal, PRE-fader — for stereo in-ears, both Aux 9 and Aux 10', 'route', (s, cs) => iemVocalPre(s, cs)),
      req('rec', 'Console: Matrix 4 (recording) takes the main mix', 'route', (_s, cs) => recordingFromMain(cs)),
      req('subs', 'Console: Aux 6 (the sub aux) carries only kick, bass and keys — no vocal or speech', 'route', (_s, cs) => subAuxLowOnly(cs) && vocalsNotInSubs(cs)),
    ],
  },
];

/** The console a capstone starts from. A routing capstone opens the desk and
 *  starts it plain; the others never open it, so their sub buses come preset
 *  (SS-R2-04) — the playback sent POST-fader to Aux 6 (subs) and Matrix 1
 *  (subs) taking the main mix — and a sub on either output is really fed.
 *  CONSOLE_PRESET_NOTE says so on the page. */
export function capstoneConsole(c: Pick<Capstone, 'routing'>): ConsoleState {
  const cs = bandConsole();
  if (c.routing) return cs;
  return setMatrixInput(setSend(cs, 'pb', 'aux6', { db: 0, tap: 'post' }), 'mx-subs', 'main', 0);
}

export const CONSOLE_PRESET_NOTE = 'This build’s console comes preset: the playback is sent post-fader to Aux 6 (the sub aux), and Matrix 1 (subs) takes the main mix — so a sub on either output is fed.';

/** Capstones in teaching order (by `n`) — the difficulty ramp. */
export const CAPSTONES_IN_ORDER: readonly Capstone[] = [...CAPSTONES].sort((a, b) => a.n - b.n);

export function capstone(id: string): Capstone {
  const c = CAPSTONES.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown capstone: ${id}`);
  return c;
}

export type CapstoneGrade = {
  met: string[];
  unmet: string[];
  pass: boolean;
};

export function gradeCapstone(c: Capstone, s: SoundSystem, cs: ConsoleState): CapstoneGrade {
  const met: string[] = [];
  const unmet: string[] = [];
  for (const r of c.requirements) (r.test(s, cs) ? met : unmet).push(r.id);
  return { met, unmet, pass: unmet.length === 0 };
}

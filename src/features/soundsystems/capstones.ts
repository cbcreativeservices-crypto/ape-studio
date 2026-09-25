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
  matrixBus,
  subgroupBus,
  type ConsoleState,
} from './console';
import { isSource } from './gear';
import { allSinksLive, chainTo, count, feedsThrough, inRole, inSlot, trace, upstream } from './system';
import type { GearKind, SoundSystem } from './types';

export type Requirement = {
  id: string;
  text: string;
  /** Which panel this requirement is judged in. */
  kind: 'build' | 'route';
  test: (s: SoundSystem, cs: ConsoleState) => boolean;
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
const monitorsPre = (cs: ConsoleState) =>
  cs.channels.every((c) => ['aux1', 'aux2', 'aux3', 'aux4'].every((a) => !c.sends[a] || c.sends[a].tap === 'pre'));
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
    ],
  },
  {
    id: 'two-one',
    n: 3,
    title: '2.1 with a dedicated subwoofer output',
    venue: 'A DJ night in a bar. Playback only.',
    brief: 'Two common ways to wire a 2.1: (a) the tops fed from the powered sub’s HIGH-PASSED outputs — one cable to the sub, and the sub’s own crossover does the split; (b) the sub on its OWN console output and the tops fed direct, each with its own high-pass. Build (b) here, because it makes the sub level a fader move at the console.',
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
      req('fourMixes', 'Console: something is sent to each of Aux 1–4', 'route', (_s, cs) => fourMonitorMixes(cs)),
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
      req('noSnake', 'No analog snake', 'build', (s) => count(s, 'snake') === 0),
      req('mains', 'A live main pair (and subs if you like)', 'build', (s) => anySpeakerIn(s, 'mainL') && anySpeakerIn(s, 'mainR') && live(s)),
    ],
  },
  {
    id: 'festival',
    n: 10,
    title: 'Festival-style complete system',
    venue: 'Main stage. Mains, subs, monitors, a recording feed and a broadcast feed.',
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
      req('fourMixes', 'Console: four monitor mixes, all pre-fader', 'route', (_s, cs) => fourMonitorMixes(cs) && monitorsPre(cs)),
      req('rec', 'Console: Matrix 4 (recording) takes the main mix', 'route', (_s, cs) => recordingFromMain(cs)),
      req('subs', 'Console: Aux 6 (the sub aux) carries only kick, bass and keys — no vocal or speech', 'route', (_s, cs) => subAuxLowOnly(cs) && vocalsNotInSubs(cs)),
    ],
  },
];

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

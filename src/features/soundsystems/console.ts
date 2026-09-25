/**
 * Sound Systems Lab — the console routing engine (ROUTE mode, chapter 4).
 *
 * Extends the mixing lab's routing truth (mixing/engine/routing.ts) to a live
 * console: channels with a main assignment or a subgroup, aux sends tapped
 * pre- or post-fader, DCAs, mute groups, and MATRIX outputs that mix the main
 * and the auxes into further destinations (subs, fills, lobby, broadcast).
 *
 * Everything a ROUTE page says about "who hears what" is computed here, so an
 * exercise's verdict and its explanation can never disagree.
 *
 * Convention (the consoles technicians actually meet — analog and digital):
 * a PRE-FADER send ignores the channel FADER and the DCA level but FOLLOWS
 * the channel mute, mute groups and a DCA mute — "pre-fader" means before the
 * fader, not before the mute. Some consoles offer a per-desk "pre-mute"
 * option for monitor world; the engine keeps the default. A POST-FADER send
 * follows the fader, the mute and the DCA.
 *
 * A channel can be assigned to the main bus AND to a subgroup that also goes
 * to main — the double-routing fault: it arrives twice, about 6 dB louder,
 * bypassing the group's insert. The engine models it so the fault is visible.
 */

export type SendTap = 'pre' | 'post';
export type AuxPurpose = 'monitor' | 'iem' | 'fx' | 'sub' | 'other';

export interface Send {
  db: number;
  tap: SendTap;
}

export interface Channel {
  id: string;
  name: string;
  /** Source family — drives the "should the subs hear this" logic. */
  family: 'vocal' | 'speech' | 'drums' | 'bass' | 'guitar' | 'keys' | 'playback' | 'fx';
  faderDb: number;
  mute: boolean;
  /** Direct to the main L/R bus. */
  toMain: boolean;
  /** Or via a subgroup (its own fader, then main). */
  subgroup: string | null;
  sends: Record<string, Send>;
  dca: string | null;
  muteGroups: string[];
}

export interface Aux {
  id: string;
  name: string;
  purpose: AuxPurpose;
  masterDb: number;
}

export interface Subgroup {
  id: string;
  name: string;
  faderDb: number;
  toMain: boolean;
}

export interface Dca {
  id: string;
  name: string;
  levelDb: number;
  mute: boolean;
}

export interface MuteGroup {
  id: string;
  name: string;
  active: boolean;
}

/** Matrix input sources: the main mix, any aux, any subgroup. */
export type MatrixSource = 'main' | string;

export interface Matrix {
  id: string;
  name: string;
  /** source id → send level in dB (absent = not sent). */
  inputs: Record<MatrixSource, number>;
  masterDb: number;
}

export interface ConsoleState {
  channels: Channel[];
  auxes: Aux[];
  subgroups: Subgroup[];
  dcas: Dca[];
  muteGroups: MuteGroup[];
  matrices: Matrix[];
  mainDb: number;
}

export const OFF_DB = -90;

export const db2lin = (db: number): number => (db <= OFF_DB ? 0 : Math.pow(10, db / 20));
export const lin2db = (lin: number): number => (lin <= 0 ? OFF_DB : 20 * Math.log10(lin));

/* ── the per-channel truths ──────────────────────────────────────────────── */

export function channelMuted(ch: Channel, cs: ConsoleState): boolean {
  if (ch.mute) return true;
  if (ch.muteGroups.some((g) => cs.muteGroups.find((m) => m.id === g)?.active)) return true;
  if (ch.dca && cs.dcas.find((d) => d.id === ch.dca)?.mute) return true;
  return false;
}

export function dcaGain(ch: Channel, cs: ConsoleState): number {
  if (!ch.dca) return 1;
  const d = cs.dcas.find((x) => x.id === ch.dca);
  return d ? db2lin(d.levelDb) : 1;
}

/** Linear gain from this channel into the MAIN bus, main master excluded.
 *  Direct assignment and the subgroup path SUM — a channel lit on both is the
 *  double-routing fault, and it reads 6 dB hot here as it does on a desk. */
export function mainContribution(ch: Channel, cs: ConsoleState): number {
  if (channelMuted(ch, cs)) return 0;
  const post = db2lin(ch.faderDb) * dcaGain(ch, cs);
  let g = ch.toMain ? post : 0;
  if (ch.subgroup) {
    const sg = cs.subgroups.find((s) => s.id === ch.subgroup);
    if (sg && sg.toMain) g += post * db2lin(sg.faderDb);
  }
  return g;
}

/** True when a channel reaches the main bus twice — direct AND via a
 *  subgroup that is assigned to main. */
export function doubleRouted(ch: Channel, cs: ConsoleState): boolean {
  if (!ch.toMain || !ch.subgroup) return false;
  const sg = cs.subgroups.find((s) => s.id === ch.subgroup);
  return !!sg && sg.toMain;
}

/** Linear gain from this channel into one AUX, aux master excluded. */
export function sendContribution(ch: Channel, auxId: string, cs: ConsoleState): number {
  const s = ch.sends[auxId];
  if (!s) return 0;
  // The mute is before everything that leaves the channel — pre-fader sends
  // included. That is what "pre-fader" has always meant.
  if (channelMuted(ch, cs)) return 0;
  if (s.tap === 'pre') return db2lin(s.db);
  return db2lin(s.db) * db2lin(ch.faderDb) * dcaGain(ch, cs);
}

/** Linear gain from this channel into a SUBGROUP's own output. */
export function subgroupContribution(ch: Channel, subId: string, cs: ConsoleState): number {
  if (ch.subgroup !== subId || channelMuted(ch, cs)) return 0;
  return db2lin(ch.faderDb) * dcaGain(ch, cs);
}

/* ── bus and matrix outputs ──────────────────────────────────────────────── */

export type Contribution = { channelId: string; name: string; gain: number };

export function mainBus(cs: ConsoleState): Contribution[] {
  return cs.channels.map((c) => ({ channelId: c.id, name: c.name, gain: mainContribution(c, cs) * db2lin(cs.mainDb) }));
}

export function auxBus(cs: ConsoleState, auxId: string): Contribution[] {
  const aux = cs.auxes.find((a) => a.id === auxId);
  const master = aux ? db2lin(aux.masterDb) : 0;
  return cs.channels.map((c) => ({ channelId: c.id, name: c.name, gain: sendContribution(c, auxId, cs) * master }));
}

export function subgroupBus(cs: ConsoleState, subId: string): Contribution[] {
  const sg = cs.subgroups.find((s) => s.id === subId);
  const master = sg ? db2lin(sg.faderDb) : 0;
  return cs.channels.map((c) => ({ channelId: c.id, name: c.name, gain: subgroupContribution(c, subId, cs) * master }));
}

/** A matrix mixes whole BUSES, after their masters, into a new output. */
export function matrixBus(cs: ConsoleState, matrixId: string): Contribution[] {
  const m = cs.matrices.find((x) => x.id === matrixId);
  if (!m) return [];
  const out = new Map<string, Contribution>();
  const add = (list: Contribution[], gainDb: number) => {
    const g = db2lin(gainDb);
    for (const c of list) {
      const prev = out.get(c.channelId);
      out.set(c.channelId, { channelId: c.channelId, name: c.name, gain: (prev?.gain ?? 0) + c.gain * g });
    }
  };
  for (const [src, db] of Object.entries(m.inputs)) {
    if (src === 'main') add(mainBus(cs), db);
    else if (cs.auxes.some((a) => a.id === src)) add(auxBus(cs, src), db);
    else if (cs.subgroups.some((s) => s.id === src)) add(subgroupBus(cs, src), db);
  }
  const master = db2lin(m.masterDb);
  return [...out.values()].map((c) => ({ ...c, gain: c.gain * master }));
}

/** Channels audible (gain above −60 dB) at a destination. */
export function hears(list: Contribution[]): Contribution[] {
  return list.filter((c) => lin2db(c.gain) > -60);
}

/* ── mutation helpers (pure) ─────────────────────────────────────────────── */

export function setChannel(cs: ConsoleState, id: string, patch: Partial<Channel>): ConsoleState {
  return { ...cs, channels: cs.channels.map((c) => (c.id === id ? { ...c, ...patch } : c)) };
}

export function setSend(cs: ConsoleState, channelId: string, auxId: string, send: Send | null): ConsoleState {
  return setChannel(cs, channelId, {
    sends: (() => {
      const ch = cs.channels.find((c) => c.id === channelId);
      const next = { ...(ch?.sends ?? {}) };
      if (send) next[auxId] = send;
      else delete next[auxId];
      return next;
    })(),
  });
}

export function setMatrixInput(cs: ConsoleState, matrixId: string, source: MatrixSource, db: number | null): ConsoleState {
  return {
    ...cs,
    matrices: cs.matrices.map((m) => {
      if (m.id !== matrixId) return m;
      const inputs = { ...m.inputs };
      if (db == null) delete inputs[source];
      else inputs[source] = db;
      return { ...m, inputs };
    }),
  };
}

export function setDca(cs: ConsoleState, id: string, patch: Partial<Dca>): ConsoleState {
  return { ...cs, dcas: cs.dcas.map((d) => (d.id === id ? { ...d, ...patch } : d)) };
}

export function setMuteGroup(cs: ConsoleState, id: string, active: boolean): ConsoleState {
  return { ...cs, muteGroups: cs.muteGroups.map((m) => (m.id === id ? { ...m, active } : m)) };
}

export function setSubgroup(cs: ConsoleState, id: string, patch: Partial<Subgroup>): ConsoleState {
  return { ...cs, subgroups: cs.subgroups.map((s) => (s.id === id ? { ...s, ...patch } : s)) };
}

/* ── the six routing tools, as machine-checkable truths ──────────────────── */

export type RoutingToolId = 'main' | 'aux' | 'subgroup' | 'dca' | 'matrix' | 'muteGroup';

export type RoutingTool = {
  id: RoutingToolId;
  name: string;
  carriesAudio: boolean;
  sumsChannels: boolean;
  isCopy: boolean;
  remoteControl: boolean;
  /** Mixes whole buses AFTER their masters (the post-main tool). */
  mixesBuses: boolean;
  use: string;
  notFor: string;
};

export const ROUTING_TOOLS: readonly RoutingTool[] = [
  {
    id: 'main',
    name: 'Main mix bus',
    carriesAudio: true,
    sumsChannels: true,
    isCopy: false,
    remoteControl: false,
    mixesBuses: false,
    use: 'The audience mix. Every channel the audience should hear ends up here, directly or through a subgroup.',
    notFor: 'Monitors — the performers need their own balance, not the audience’s.',
  },
  {
    id: 'aux',
    name: 'Auxiliary send',
    carriesAudio: true,
    sumsChannels: true,
    isCopy: true,
    remoteControl: false,
    mixesBuses: false,
    use: 'An independent copy of chosen channels at chosen levels: monitor mixes (pre-fader) and effects sends (post-fader).',
    notFor: 'Group level control of the main mix — turning an aux master down changes nothing in the house.',
  },
  {
    id: 'subgroup',
    name: 'Subgroup',
    carriesAudio: true,
    sumsChannels: true,
    isCopy: false,
    remoteControl: false,
    mixesBuses: false,
    use: 'Sum several channels into one path with one fader — and one insert point, so a compressor can grip all the drums at once.',
    notFor: 'Remote level control of channels that must keep reaching the main by their own path — that is a DCA. And a channel on a subgroup that is NOT assigned to main is a dead end with a moving meter.',
  },
  {
    id: 'dca',
    name: 'DCA / VCA',
    carriesAudio: false,
    sumsChannels: false,
    isCopy: false,
    remoteControl: true,
    mixesBuses: false,
    use: 'One fader that remotely controls the level of many channels — no audio passes through it, so post-fader sends follow it and pre-fader sends do not. Its MUTE silences everything leaving those channels.',
    notFor: 'Group processing — there is no audio in a DCA to insert a compressor on.',
  },
  {
    id: 'matrix',
    name: 'Matrix output',
    carriesAudio: true,
    sumsChannels: false,
    isCopy: true,
    remoteControl: false,
    mixesBuses: true,
    use: 'Mix finished BUSES (main, auxes, subgroups) into further outputs: subs, front fills, delays, lobby, recording, broadcast — each with its own level and processing.',
    notFor: 'Building a monitor mix from individual channels — that is an aux.',
  },
  {
    id: 'muteGroup',
    name: 'Mute group',
    carriesAudio: false,
    sumsChannels: false,
    isCopy: false,
    remoteControl: true,
    mixesBuses: false,
    use: 'One button that mutes a set of channels together — band off, walk-in music on, between songs.',
    notFor: 'Level control — a mute group has no fader.',
  },
];

export function routingTool(id: RoutingToolId): RoutingTool {
  return ROUTING_TOOLS.find((t) => t.id === id)!;
}

/** "Which tool?" — the commonly-confused cases, each with exactly one right
 *  answer and the reason the runners-up are wrong. */
export type WhichToolCase = {
  id: string;
  situation: string;
  correct: RoutingToolId;
  why: string;
  /** Feedback for the most tempting wrong pick(s). */
  wrong: Partial<Record<RoutingToolId, string>>;
};

export const WHICH_TOOL: readonly WhichToolCase[] = [
  {
    id: 'drum-comp',
    situation: 'The drummer’s eight microphones should be compressed together and ridden on one fader in the house mix.',
    correct: 'subgroup',
    why: 'A subgroup SUMS the drum channels into one audio path — so one insert compresses them all and one fader rides them.',
    wrong: {
      dca: 'A DCA rides the level, but no audio passes through it — there is nothing to insert a compressor on.',
      aux: 'An aux makes a copy; the drums would still reach the main mix by their own channels, uncompressed.',
    },
  },
  {
    id: 'vocal-monitor',
    situation: 'The singer wants more of their own vocal in their wedge, and it must not change when you adjust the house vocal fader.',
    correct: 'aux',
    why: 'A PRE-FADER aux send is an independent copy: its level is set on the send, and the channel fader does not touch it.',
    wrong: {
      subgroup: 'A subgroup feeds the main mix — moving it changes the house, not the wedge.',
      matrix: 'A matrix mixes whole buses; a monitor mix is built from individual channels.',
    },
  },
  {
    id: 'band-fader',
    situation: 'The whole band needs to come down 6 dB under the speech, without changing any monitor mix.',
    correct: 'dca',
    why: 'A DCA changes the assigned channels’ level remotely. Pre-fader monitor sends do not follow it, so the wedges stay exactly as they were.',
    wrong: {
      subgroup: 'Every band channel would have to be re-routed through the subgroup — and post-fader effects sends would keep their old balance against it.',
      main: 'The main fader takes the speech down too.',
    },
  },
  {
    id: 'lobby-feed',
    situation: 'The lobby loudspeakers need the house mix at a lower level with a little of the announcement mic added.',
    correct: 'matrix',
    why: 'A MATRIX mixes finished buses — the main mix plus an aux carrying the announcement — into a separate output with its own level.',
    wrong: {
      aux: 'An aux would need every channel re-sent to it; the lobby wants the finished mix, not a rebuild.',
      subgroup: 'A subgroup feeds the main mix; the lobby is a destination AFTER the main mix.',
    },
  },
  {
    id: 'subs-aux',
    situation: 'Only the kick, bass, floor tom and keyboard should reach the subwoofers, at levels you choose.',
    correct: 'aux',
    why: 'An AUX-FED SUB: a post-fader send from just those channels, so the sub feed follows the mix but carries nothing the low end does not need.',
    wrong: {
      matrix: 'A matrix mixes BUSES, so it can only choose channels if some bus already carries just those channels — that bus is the aux. (A matrix is then a fine place to deliver that aux to the sub output with its own level.)',
      main: 'The main mix carries every channel, vocals included, to the subs.',
    },
  },
  {
    id: 'reverb',
    situation: 'A reverb on the vocals whose amount should fall when the vocal fader falls.',
    correct: 'aux',
    why: 'A POST-FADER aux send: the copy follows the fader, so the wet stays in proportion to the dry.',
    wrong: {
      subgroup: 'A subgroup would send the whole vocal path into the reverb — no dry signal left to balance against.',
      dca: 'A DCA carries no audio to feed a reverb.',
    },
  },
  {
    id: 'between-songs',
    situation: 'Between songs every band microphone must go silent instantly, and come back exactly as set.',
    correct: 'muteGroup',
    why: 'A MUTE GROUP mutes a set of channels with one button and restores them untouched — and it silences their monitor sends too, which is what you want between songs. On a digital console a DCA mute does the same job; the mute group is the dedicated control.',
    wrong: {},
  },
  {
    id: 'broadcast',
    situation: 'A broadcast truck needs the house mix plus a bit more vocal and a lot less of the audience mics.',
    correct: 'matrix',
    why: 'A MATRIX starts from the finished main mix and adds or removes buses — the standard broadcast, recording and overflow feed. On larger shows a split feeds a separate broadcast console instead.',
    wrong: {
      aux: 'Rebuilding the whole mix on an aux doubles the work and drifts from the house balance the moment anything changes.',
    },
  },
];

/* ── a ready console for the ROUTE exercises ─────────────────────────────── */

export function bandConsole(): ConsoleState {
  const ch = (id: string, name: string, family: Channel['family'], extra: Partial<Channel> = {}): Channel => ({
    id,
    name,
    family,
    faderDb: 0,
    mute: false,
    toMain: true,
    subgroup: null,
    sends: {},
    dca: null,
    muteGroups: [],
    ...extra,
  });
  return {
    channels: [
      ch('kick', 'Kick', 'drums'),
      ch('snare', 'Snare', 'drums'),
      ch('oh', 'Overheads', 'drums'),
      ch('bass', 'Bass DI', 'bass'),
      ch('gtr', 'Guitar', 'guitar'),
      ch('keys', 'Keys', 'keys'),
      ch('vox', 'Lead vocal', 'vocal'),
      ch('bvox', 'Backing vox', 'vocal'),
      ch('mc', 'Announce', 'speech'),
      ch('pb', 'Playback', 'playback'),
    ],
    auxes: [
      { id: 'aux1', name: 'Aux 1 · Wedge 1', purpose: 'monitor', masterDb: 0 },
      { id: 'aux2', name: 'Aux 2 · Wedge 2', purpose: 'monitor', masterDb: 0 },
      { id: 'aux3', name: 'Aux 3 · Wedge 3', purpose: 'monitor', masterDb: 0 },
      { id: 'aux4', name: 'Aux 4 · Wedge 4', purpose: 'monitor', masterDb: 0 },
      { id: 'aux5', name: 'Aux 5 · Reverb', purpose: 'fx', masterDb: 0 },
      { id: 'aux6', name: 'Aux 6 · Subs', purpose: 'sub', masterDb: 0 },
      // Kept for the lobby / overflow announce feed so no wedge ever hears it.
      { id: 'aux7', name: 'Aux 7 · Announce', purpose: 'other', masterDb: 0 },
    ],
    subgroups: [
      { id: 'sub-drums', name: 'Drums', faderDb: 0, toMain: true },
      { id: 'sub-vox', name: 'Vocals', faderDb: 0, toMain: true },
    ],
    dcas: [
      { id: 'dca-band', name: 'BAND', levelDb: 0, mute: false },
      { id: 'dca-vox', name: 'VOCALS', levelDb: 0, mute: false },
    ],
    muteGroups: [
      { id: 'mg-band', name: 'BAND MUTE', active: false },
      { id: 'mg-mics', name: 'ALL MICS', active: false },
    ],
    matrices: [
      { id: 'mx-subs', name: 'Matrix 1 · Subs', inputs: {}, masterDb: 0 },
      { id: 'mx-fills', name: 'Matrix 2 · Front fills', inputs: {}, masterDb: 0 },
      { id: 'mx-lobby', name: 'Matrix 3 · Lobby', inputs: {}, masterDb: 0 },
      { id: 'mx-rec', name: 'Matrix 4 · Recording', inputs: {}, masterDb: 0 },
    ],
    mainDb: 0,
  };
}

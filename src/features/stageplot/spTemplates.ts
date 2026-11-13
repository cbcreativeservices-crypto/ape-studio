/**
 * stageplot/spTemplates — the EXAMPLE BANDS a project can start from. Each
 * is built through spModel's own edits, so an example can never hold a state
 * the tool itself could not produce.
 *
 * A template is a STARTING POINT WITH VISIBLE ASSUMPTIONS (handoff §2): the
 * project remembers which one it began as and prints nothing of it as a
 * requirement. Every name is a sample name and every microphone is a generic
 * category.
 *
 * WHAT AN EXAMPLE MAY AND MAY NOT STATE (review round 1, 2026-11-12):
 *   • It never answers PHANTOM POWER for a microphone nobody has named: a
 *     venue-supplied "dynamic" or "condenser" row stays "unknown" (handoff
 *     §4: no inference from a broad category). It does answer for the band's
 *     OWN named boxes (a passive DI needs none; an active one is marked).
 *   • A wireless in-ear mix always has its TRANSMITTER listed, so the packet
 *     tells the venue that radio equipment is coming.
 *   • A click that only the band's own rig uses is not sent to the house.
 *   • A drawn riser and the backline are listed, with who supplies them.
 *
 * `four-piece` is the handoff's worked example (§11): its totals are pinned
 * by test/stagePlotModel.test.ts and must not drift.
 *
 * Pure.
 */
import type { SpPackageRow } from './spCatalog.ts';
import {
  spAddDevice,
  spAddDiDevice,
  spAddExtra,
  spAddMix,
  spAddObject,
  spAddPackage,
  spAddPerformer,
  spAddSource,
  spEdit,
  spGroup,
  spNewProject,
  spSetNeed,
  spUpdateInput,
} from './spModel.ts';
import type { SpDelivery, SpDeviceType, SpExtra, SpId, SpInput, SpMixFormat, SpMixProvider, SpObjectKind, SpProject, SpSupplier } from './spTypes.ts';

export type SpTemplateId = 'blank' | 'solo' | 'duo' | 'four-piece' | 'playback' | 'salsa';

export const SP_TEMPLATES: readonly { id: SpTemplateId; name: string; assumes: string }[] = [
  { id: 'blank', name: 'Blank stage', assumes: 'Nothing is placed and nothing is assumed.' },
  { id: 'solo', name: 'Solo performer', assumes: 'One singer with an acoustic guitar that has a pickup, and one wedge.' },
  { id: 'duo', name: 'Acoustic duo', assumes: 'Two singers: one with an acoustic guitar, one with a keyboard. Each has a wedge.' },
  { id: 'four-piece', name: 'Four-piece band', assumes: 'Drums with six microphones, bass through a DI, one guitar amplifier, a stereo keyboard, three vocals and a click. Two wedge mixes and two in-ear mixes from the house console.' },
  { id: 'playback', name: 'Band with playback', assumes: 'A four-piece band with stereo backing tracks and a click. The band makes its own in-ear mixes on its own mixer (four wireless transmitters). The venue is asked for an input split.' },
  { id: 'salsa', name: 'Salsa band', assumes: 'Twelve players: piano (an electric piano through two DI channels), bass, congas, timbales, bongó, two trumpets, two trombones, a lead singer and two coro (chorus) singers. Six wedge mixes from the house console.' },
];

/** A small builder so each example reads as a list of what is on the stage. */
class Build {
  p: SpProject;
  constructor(p: SpProject) {
    this.p = p;
  }
  performer(name: string, role: string, at: { x: number; y: number }, rot = 0): SpId {
    const a = spAddPerformer(this.p, { name, role });
    this.p = spAddObject(a.p, 'performer', at, { performerId: a.id, label: name, rot }).p;
    return a.id;
  }
  /** Add a package for a performer (or rows on an existing source); returns its input ids. */
  pack(pkg: string, performerId: SpId | null, sourceLabel?: string, rows?: readonly SpPackageRow[], sourceId?: SpId): { sourceId: SpId; inputs: SpId[] } {
    const r = spAddPackage(this.p, pkg, { performerId, sourceLabel, rows, sourceId });
    this.p = r.p;
    return { sourceId: r.sourceId, inputs: r.inputIds };
  }
  set(ids: SpId[], patch: Partial<Omit<SpInput, 'id' | 'sourceId' | 'pairId' | 'side'>>): void {
    for (const id of ids) this.p = spUpdateInput(this.p, id, patch);
  }
  icon(kind: SpObjectKind, at: { x: number; y: number }, link: Parameters<typeof spAddObject>[3] = {}): SpId {
    const r = spAddObject(this.p, kind, at, link);
    this.p = r.p;
    return r.id;
  }
  di(inputIds: SpId[], f: { channels: 1 | 2; label: string; supplier: SpSupplier; kind: 'passive' | 'active' | 'unknown' }): void {
    this.p = spAddDiDevice(this.p, { ...f, inputIds }).p;
  }
  mix(name: string, recipients: SpId[], format: SpMixFormat, delivery: SpDelivery, provider: SpMixProvider, instructions: string[] = []): SpId {
    const r = spAddMix(this.p, { name, recipients, format, delivery, provider, instructions });
    this.p = r.p;
    return r.id;
  }
  device(type: SpDeviceType, mixId: SpId | null, f: { label: string; supplier: SpSupplier; performerId?: SpId | null; selfContained?: boolean; at?: { x: number; y: number }; rot?: number }): SpId {
    const r = spAddDevice(this.p, { type, mixId, label: f.label, supplier: f.supplier, performerId: f.performerId ?? null, selfContained: f.selfContained ?? false });
    this.p = r.p;
    if (f.at) {
      const kind: SpObjectKind = type === 'wedge' ? 'wedge' : type === 'drum-fill' ? 'drum-fill' : type === 'sidefill' ? 'sidefill' : 'iem';
      this.p = spAddObject(this.p, kind, f.at, { deviceId: r.id, label: f.label, rot: f.rot ?? 180 }).p;
    }
    return r.id;
  }
  need(mixId: SpId, inputId: SpId, need: 'primary' | 'supporting' | 'not-needed' | 'exclude'): void {
    this.p = spSetNeed(this.p, mixId, inputId, need);
  }
  extra(kind: SpExtra['kind'], label: string, supplier: SpSupplier, note = ''): void {
    this.p = spAddExtra(this.p, { kind, label, supplier, note }).p;
  }
  group(ids: SpId[]): void {
    this.p = spGroup(this.p, ids);
  }
  done(): SpProject {
    // an example starts as a clean first revision
    const q = spEdit(this.p, () => undefined);
    q.revision = 1;
    q.frozenRevision = 0;
    q.status = 'draft';
    return q;
  }
}

/** A microphone and stand the venue is asked for. Phantom power stays
 *  UNKNOWN: nobody has named the microphone. */
const VENUE_MIC = { supplier: 'venue', standSupplier: 'venue', phantom: 'unknown' } as const;
const OVERHEAD_VIEW = 'Overhead L and R are named as the audience sees the kit.';

function solo(b: Build): void {
  const me = b.performer('Alex', 'Vocal and acoustic guitar', { x: 0.5, y: 0.62 });
  const vox = b.pack('vocal', me, 'Vocal');
  b.set(vox.inputs, { label: 'Vocal', ...VENUE_MIC });
  const gtr = b.pack('acoustic-pickup', me, 'Acoustic guitar');
  b.set(gtr.inputs, { supplier: 'band', phantom: 'unknown' });
  b.di(gtr.inputs, { channels: 1, label: 'Guitar DI', supplier: 'band', kind: 'unknown' });
  b.icon('vocal-mic', { x: 0.5, y: 0.72 }, { inputId: vox.inputs[0], label: 'Vocal' });
  b.icon('acoustic-guitar', { x: 0.58, y: 0.62 }, { sourceId: gtr.sourceId, label: 'Acoustic guitar' });
  const m = b.mix('Vocal and guitar', [me], 'mono', 'wedge', 'house', ['Own vocal prominent', 'Own instrument prominent']);
  b.device('wedge', m, { label: 'Wedge 1', supplier: 'venue', at: { x: 0.5, y: 0.88 } });
}

function duo(b: Build): void {
  const a = b.performer('Alex', 'Vocal and acoustic guitar', { x: 0.3, y: 0.6 });
  const k = b.performer('Robin', 'Vocal and keyboard', { x: 0.7, y: 0.6 });
  const vA = b.pack('vocal', a, 'Alex vocal');
  b.set(vA.inputs, { label: 'Alex vocal', ...VENUE_MIC });
  const g = b.pack('acoustic-pickup', a, 'Acoustic guitar');
  b.set(g.inputs, { supplier: 'band', phantom: 'unknown' });
  b.di(g.inputs, { channels: 1, label: 'Guitar DI', supplier: 'band', kind: 'unknown' });
  const keys = b.pack('keys-mono', k, 'Keys');
  b.set(keys.inputs, { supplier: 'tbc', phantom: 'unknown' });
  const vK = b.pack('vocal', k, 'Robin vocal');
  b.set(vK.inputs, { label: 'Robin vocal', ...VENUE_MIC });
  b.icon('vocal-mic', { x: 0.3, y: 0.7 }, { inputId: vA.inputs[0], label: 'Alex vocal' });
  b.icon('acoustic-guitar', { x: 0.22, y: 0.6 }, { sourceId: g.sourceId, label: 'Acoustic guitar' });
  b.icon('keyboard', { x: 0.7, y: 0.7 }, { sourceId: keys.sourceId, label: 'Keys' });
  // a boom from her stage-left side, its head toward her (she sits behind the keyboard)
  b.icon('vocal-mic', { x: 0.77, y: 0.6 }, { inputId: vK.inputs[0], label: 'Robin vocal', rot: 270 });
  const m1 = b.mix('Guitar and vocal', [a], 'mono', 'wedge', 'house', ['Own vocal prominent', 'Some keys']);
  const m2 = b.mix('Keys and vocal', [k], 'mono', 'wedge', 'house', ['Own vocal prominent', 'Some guitar']);
  b.device('wedge', m1, { label: 'Wedge 1', supplier: 'venue', at: { x: 0.3, y: 0.9 } });
  b.device('wedge', m2, { label: 'Wedge 2', supplier: 'venue', at: { x: 0.7, y: 0.9 } });
}

/** The handoff's worked example (§11). */
function fourPiece(b: Build): void {
  // the drummer sits on the kit's stool, upstage of the drums
  const drummer = b.performer('Maya', 'Drums', { x: 0.5, y: 0.15 });
  const bassist = b.performer('Leo', 'Bass and vocal', { x: 0.2, y: 0.52 });
  const keys = b.performer('Nina', 'Keys and vocal', { x: 0.83, y: 0.46 });
  const front = b.performer('Sam', 'Guitar and lead vocal', { x: 0.5, y: 0.68 });

  const kit = b.pack('drums-six', drummer, 'Drum kit'); // 1–6
  b.set(kit.inputs, { ...VENUE_MIC });
  const bass = b.pack('bass-di', bassist, 'Bass'); // 7
  b.set(bass.inputs, { supplier: 'band', phantom: 'not-required' });
  b.di(bass.inputs, { channels: 1, label: 'Bass DI', supplier: 'band', kind: 'passive' });
  const gtr = b.pack('guitar-cab', front, 'Guitar'); // 8
  b.set(gtr.inputs, { ...VENUE_MIC });
  const kb = b.pack('keys-stereo', keys, 'Keys'); // 9–10
  b.set(kb.inputs, { supplier: 'venue', phantom: 'unknown' });
  b.di(kb.inputs, { channels: 2, label: 'Keys stereo DI', supplier: 'venue', kind: 'unknown' });
  const lead = b.pack('vocal', front, 'Lead vocal'); // 11
  b.set(lead.inputs, { label: 'Lead vocal', ...VENUE_MIC });
  const bv = b.pack('vocal', bassist, 'Leo vocal'); // 12
  b.set(bv.inputs, { label: 'Leo vocal', ...VENUE_MIC });
  const kv = b.pack('vocal', keys, 'Nina vocal'); // 13
  b.set(kv.inputs, { label: 'Nina vocal', ...VENUE_MIC });
  const click = b.pack('click', drummer, 'Click'); // 14
  b.set(click.inputs, { supplier: 'band', phantom: 'do-not-apply', level: 'Line level', notes: 'The receiving input must accept line level.' });

  b.icon('drum-kit', { x: 0.5, y: 0.3 }, { sourceId: kit.sourceId, label: 'Drums' });
  b.icon('riser', { x: 0.5, y: 0.3 }, { label: 'Drum riser', w: 0.4, h: 0.44 });
  b.icon('bass-amp', { x: 0.2, y: 0.36 }, { sourceId: bass.sourceId, label: 'Bass amp' });
  // in front of the riser, not half on it
  b.icon('guitar-amp', { x: 0.36, y: 0.6 }, { sourceId: gtr.sourceId, label: 'Guitar amp' });
  b.icon('keyboard', { x: 0.83, y: 0.58 }, { sourceId: kb.sourceId, label: 'Keys' });
  b.icon('vocal-mic', { x: 0.5, y: 0.78 }, { inputId: lead.inputs[0], label: 'Lead vocal' });
  b.icon('vocal-mic', { x: 0.2, y: 0.62 }, { inputId: bv.inputs[0], label: 'Leo vocal' });
  // a boom from her stage-right side, clear of the riser, its head toward her
  b.icon('vocal-mic', { x: 0.76, y: 0.46 }, { inputId: kv.inputs[0], label: 'Nina vocal', rot: 90 });
  b.icon('playback', { x: 0.78, y: 0.14 }, { sourceId: click.sourceId, label: 'Click' });

  const m1 = b.mix('Lead vocal', [front], 'mono', 'wedge', 'house', ['Own vocal prominent', 'Some guitar']);
  const m2 = b.mix('Bass', [bassist], 'mono', 'wedge', 'house', ['Own vocal prominent', 'Kick and bass']);
  const m3 = b.mix('Drums, in-ear', [drummer], 'stereo', 'wireless-iem', 'house', ['Full band', 'Click required']);
  const m4 = b.mix('Keys, in-ear', [keys], 'stereo', 'wired-iem', 'house', ['Own vocal prominent', 'Own instrument prominent', 'No click']);
  b.device('wedge', m1, { label: 'Wedge 1', supplier: 'venue', at: { x: 0.5, y: 0.92 } });
  b.device('wedge', m2, { label: 'Wedge 2', supplier: 'venue', at: { x: 0.2, y: 0.78 } });
  // the transmitter is what the house cables to, so it is the one drawn; the
  // pack is worn by the drummer
  b.device('iem-tx', m3, { label: 'In-ear transmitter', supplier: 'band', at: { x: 0.18, y: 0.1 } });
  b.device('iem-pack', m3, { label: 'Drummer’s pack', supplier: 'band', performerId: drummer });
  b.device('hp-amp', m4, { label: 'Keys headphone amplifier', supplier: 'band', performerId: keys, at: { x: 0.94, y: 0.3 } });
  // the drummer hears the click; the other three mixes keep it out
  b.need(m3, click.inputs[0], 'primary');

  b.extra('riser', 'Drum riser', 'tbc', 'Size and height: to confirm with the venue.');
  b.extra('backline', 'Drum kit, bass amplifier, guitar amplifier, keyboard', 'band');
  b.p = spEdit(b.p, (d) => {
    d.viewNote = OVERHEAD_VIEW;
  });
}

function playback(b: Build): void {
  const drummer = b.performer('Maya', 'Drums', { x: 0.5, y: 0.15 });
  const bassist = b.performer('Leo', 'Bass', { x: 0.24, y: 0.5 });
  const gtr = b.performer('Sam', 'Guitar and lead vocal', { x: 0.5, y: 0.68 });
  const singer = b.performer('Jo', 'Vocal', { x: 0.74, y: 0.64 });
  const kit = b.pack('drums-small', drummer, 'Drum kit');
  b.set(kit.inputs, { ...VENUE_MIC });
  const bass = b.pack('bass-di', bassist, 'Bass');
  // the band's own active DI: it needs phantom power from the console
  b.set(bass.inputs, { supplier: 'band', phantom: 'required' });
  b.di(bass.inputs, { channels: 1, label: 'Bass DI', supplier: 'band', kind: 'active' });
  const cab = b.pack('guitar-cab', gtr, 'Guitar');
  b.set(cab.inputs, { ...VENUE_MIC });
  const tracks = b.pack('playback-stereo', null, 'Playback');
  b.set(tracks.inputs, { supplier: 'band', phantom: 'do-not-apply', level: 'Line level' });
  const v1 = b.pack('vocal', gtr, 'Lead vocal');
  b.set(v1.inputs, { label: 'Lead vocal', supplier: 'band', standSupplier: 'venue', phantom: 'not-required' });
  const v2 = b.pack('vocal', singer, 'Second vocal');
  b.set(v2.inputs, { label: 'Second vocal', supplier: 'band', standSupplier: 'venue', phantom: 'not-required' });
  // every input the audience hears also feeds the band's own monitor rig,
  // through a split
  b.set([...kit.inputs, ...bass.inputs, ...cab.inputs, ...tracks.inputs, ...v1.inputs, ...v2.inputs], { destination: 'both', splitNote: '' });
  // the click comes from the playback rig and stays inside the band's own
  // rig: the house console is not sent a channel it would never use
  const click = b.pack('click', null, undefined, undefined, tracks.sourceId);
  b.set(click.inputs, { supplier: 'band', phantom: 'do-not-apply', level: 'Line level', destination: 'band' });

  b.icon('drum-kit', { x: 0.5, y: 0.3 }, { sourceId: kit.sourceId, label: 'Drums' });
  b.icon('bass-amp', { x: 0.24, y: 0.36 }, { sourceId: bass.sourceId, label: 'Bass amp' });
  // clear of the kit, beside the guitarist
  b.icon('guitar-amp', { x: 0.34, y: 0.6 }, { sourceId: cab.sourceId, label: 'Guitar amp' });
  b.icon('playback', { x: 0.7, y: 0.18 }, { sourceId: tracks.sourceId, label: 'Playback and click' });
  b.icon('vocal-mic', { x: 0.5, y: 0.78 }, { inputId: v1.inputs[0], label: 'Lead vocal' });
  b.icon('vocal-mic', { x: 0.74, y: 0.74 }, { inputId: v2.inputs[0], label: 'Second vocal' });
  b.icon('rack', { x: 0.9, y: 0.3 }, { label: 'Band monitor rack' });

  // four stereo mixes the band creates itself: nothing requested from the
  // house console. Each has its transmitter (radio equipment the venue must know
  // is coming) and its pack.
  const people: [SpId, string][] = [
    [drummer, 'Drums'],
    [bassist, 'Bass'],
    [gtr, 'Guitar'],
    [singer, 'Vocal'],
  ];
  for (const [id, name] of people) {
    const m = b.mix(`${name}, in-ear`, [id], 'stereo', 'wireless-iem', 'band-console', id === drummer ? ['Full band', 'Click required'] : ['Full band']);
    b.device('iem-tx', m, { label: `${name} transmitter`, supplier: 'band', selfContained: true });
    b.device('iem-pack', m, { label: `${name} pack`, supplier: 'band', performerId: id, selfContained: true });
    if (id === drummer) b.need(m, click.inputs[0], 'primary');
  }
  b.extra('split', 'Input split for the band monitor rig', 'tbc', 'Split provider, connection and who handles phantom power: to confirm with the venue.');
  b.extra('backline', 'Drum kit, bass amplifier, guitar amplifier', 'band');
  b.p = spEdit(b.p, (d) => {
    for (const m of d.mixes) m.venueFeed = 'split';
    d.viewNote = OVERHEAD_VIEW;
  });
}

function salsa(b: Build): void {
  // front line, downstage
  const lead = b.performer('Marisol', 'Lead vocal', { x: 0.5, y: 0.7 });
  const coro1 = b.performer('Tito', 'Coro (chorus vocal) and güiro', { x: 0.36, y: 0.7 });
  const coro2 = b.performer('Yolanda', 'Coro (chorus vocal) and maracas', { x: 0.64, y: 0.7 });
  // rhythm section: the pianist sits at stage right and faces across the stage
  const piano = b.performer('Rafa', 'Piano', { x: 0.08, y: 0.5 }, 270);
  const bass = b.performer('Nelson', 'Bass', { x: 0.28, y: 0.32 });
  const congas = b.performer('Chino', 'Congas', { x: 0.42, y: 0.44 });
  const timbales = b.performer('Papo', 'Timbales', { x: 0.57, y: 0.36 });
  const bongo = b.performer('Luisito', 'Bongó and bell (campana)', { x: 0.43, y: 0.2 });
  // horns, stage left, in two rows: trombones in front (a slide needs clear
  // space ahead), trumpets behind them
  const tp1 = b.performer('Carmen', 'Trumpet 1', { x: 0.72, y: 0.2 });
  const tp2 = b.performer('Iván', 'Trumpet 2', { x: 0.9, y: 0.2 });
  const tb1 = b.performer('Beto', 'Trombone 1', { x: 0.72, y: 0.44 });
  const tb2 = b.performer('Ana', 'Trombone 2', { x: 0.9, y: 0.44 });

  const row = (label: string): SpPackageRow => ({ label, capture: 'mic', equipment: 'Dynamic instrument microphone', stand: 'short-boom', connector: 'XLR' });
  const cg = b.pack('hand-drums', congas, 'Congas', [row('Conga'), row('Tumba (low conga)')]);
  const tm = b.pack('hand-drums', timbales, 'Timbales', [row('Timbales high'), row('Timbales low'), { label: 'Timbales bell and cymbal', capture: 'mic', equipment: 'Condenser microphone', stand: 'tall-boom', connector: 'XLR' }]);
  const bg = b.pack('percussion-mic', bongo, 'Bongó', [row('Bongó and bell (campana)')]);
  b.set([...cg.inputs, ...tm.inputs, ...bg.inputs], { ...VENUE_MIC });
  const bs = b.pack('bass-di', bass, 'Bass');
  // the band's own active DI: it needs phantom power from the console
  b.set(bs.inputs, { supplier: 'band', phantom: 'required' });
  b.di(bs.inputs, { channels: 1, label: 'Bass DI', supplier: 'band', kind: 'active' });
  const pn = b.pack('keys-stereo', piano, 'Piano');
  b.set(pn.inputs, { supplier: 'tbc', phantom: 'unknown' });
  b.p = spEdit(b.p, (d) => {
    for (const id of pn.inputs) {
      const i = d.inputs.find((x) => x.id === id);
      if (i) i.label = i.side === 'L' ? 'Piano L' : 'Piano R';
    }
  });
  const horn = (who: SpId, label: string) => {
    const h = b.pack('horn-mic', who, label);
    b.set(h.inputs, { label, ...VENUE_MIC });
    return h;
  };
  const h1 = horn(tp1, 'Trumpet 1');
  const h2 = horn(tp2, 'Trumpet 2');
  const h3 = horn(tb1, 'Trombone 1');
  const h4 = horn(tb2, 'Trombone 2');
  const vox = (who: SpId, label: string) => {
    const v = b.pack('vocal', who, label);
    b.set(v.inputs, { label, ...VENUE_MIC });
    return v;
  };
  const vL = vox(lead, 'Lead vocal');
  const vC1 = vox(coro1, 'Coro 1');
  const vC2 = vox(coro2, 'Coro 2');
  // hand percussion is heard through the singers' own microphones
  b.p = spAddSource(b.p, { label: 'Güiro and maracas', category: 'percussion', performerId: null, connection: 'none' }).p;
  b.p = spEdit(b.p, (d) => {
    const s = d.sources[d.sources.length - 1];
    s.noneReason = 'acoustic';
    s.locationNote = 'Played by the two coro singers at their microphones; no input of their own.';
  });

  b.icon('piano', { x: 0.16, y: 0.5 }, { sourceId: pn.sourceId, label: 'Piano', rot: 270 });
  b.icon('bass-amp', { x: 0.28, y: 0.18 }, { sourceId: bs.sourceId, label: 'Bass amp' });
  b.icon('congas', { x: 0.42, y: 0.54 }, { sourceId: cg.sourceId, label: 'Congas' });
  b.icon('timbales', { x: 0.57, y: 0.47 }, { sourceId: tm.sourceId, label: 'Timbales' });
  b.icon('bongo', { x: 0.43, y: 0.29 }, { sourceId: bg.sourceId, label: 'Bongó' });
  b.icon('mic-stand', { x: 0.72, y: 0.31 }, { inputId: h1.inputs[0], label: 'Trumpet 1' });
  b.icon('mic-stand', { x: 0.9, y: 0.31 }, { inputId: h2.inputs[0], label: 'Trumpet 2' });
  b.icon('mic-stand', { x: 0.72, y: 0.55 }, { inputId: h3.inputs[0], label: 'Trombone 1' });
  b.icon('mic-stand', { x: 0.9, y: 0.55 }, { inputId: h4.inputs[0], label: 'Trombone 2' });
  b.icon('vocal-mic', { x: 0.5, y: 0.8 }, { inputId: vL.inputs[0], label: 'Lead vocal' });
  b.icon('vocal-mic', { x: 0.36, y: 0.8 }, { inputId: vC1.inputs[0], label: 'Coro 1' });
  b.icon('vocal-mic', { x: 0.64, y: 0.8 }, { inputId: vC2.inputs[0], label: 'Coro 2' });

  const mLead = b.mix('Lead vocal', [lead], 'mono', 'wedge', 'house', ['Own vocal prominent', 'Some piano']);
  const mCoro = b.mix('Coro', [coro1, coro2], 'mono', 'wedge', 'house', ['Own vocal prominent', 'Some piano']);
  const mHorn = b.mix('Horns', [tp1, tp2, tb1, tb2], 'mono', 'wedge', 'house', ['Own instrument prominent', 'Some piano']);
  const mPiano = b.mix('Piano', [piano], 'mono', 'wedge', 'house', ['Own instrument prominent', 'Bass and congas']);
  const mBass = b.mix('Bass', [bass], 'mono', 'wedge', 'house', ['Own instrument prominent', 'Some piano']);
  const mPerc = b.mix('Percussion', [congas, timbales, bongo], 'mono', 'wedge', 'house', ['Own instrument prominent', 'Some piano', 'Some bass']);
  // the pianist's mix, as a salsa pianist asks for it
  b.need(mPiano, pn.inputs[0], 'primary');
  b.need(mPiano, pn.inputs[1], 'primary');
  b.need(mPiano, bs.inputs[0], 'primary');
  b.need(mPiano, cg.inputs[0], 'supporting');
  b.need(mPiano, cg.inputs[1], 'supporting');
  b.need(mPiano, vL.inputs[0], 'supporting');
  b.device('wedge', mLead, { label: 'Wedge 1', supplier: 'venue', at: { x: 0.5, y: 0.93 } });
  b.device('wedge', mCoro, { label: 'Wedge 2', supplier: 'venue', at: { x: 0.36, y: 0.93 } });
  b.device('wedge', mCoro, { label: 'Wedge 3', supplier: 'venue', at: { x: 0.64, y: 0.93 } });
  b.device('wedge', mHorn, { label: 'Wedge 4', supplier: 'venue', at: { x: 0.72, y: 0.67 } });
  b.device('wedge', mHorn, { label: 'Wedge 5', supplier: 'venue', at: { x: 0.9, y: 0.67 } });
  b.device('wedge', mPiano, { label: 'Wedge 6', supplier: 'venue', at: { x: 0.08, y: 0.67 } });
  b.device('wedge', mBass, { label: 'Wedge 7', supplier: 'venue', at: { x: 0.17, y: 0.3 }, rot: 270 });
  b.device('wedge', mPerc, { label: 'Wedge 8', supplier: 'venue', at: { x: 0.33, y: 0.45 }, rot: 270 });
  b.device('wedge', mPerc, { label: 'Wedge 9', supplier: 'venue', at: { x: 0.58, y: 0.6 } });
  b.extra('backline', 'Electric piano, bass amplifier, congas, timbales, bongó', 'band');
}

/** A new project started from an example. `now` and `id` come from the
 *  caller (the model has no clock). */
export function spFromTemplate(template: SpTemplateId, opts: { id: SpId; now: number; band?: string }): SpProject {
  const base = spNewProject({ id: opts.id, now: opts.now, band: opts.band ?? '', startedFrom: template === 'blank' ? '' : template });
  if (template === 'blank') return base;
  const b = new Build(base);
  if (template === 'solo') solo(b);
  else if (template === 'duo') duo(b);
  else if (template === 'four-piece') fourPiece(b);
  else if (template === 'playback') playback(b);
  else salsa(b);
  const p = b.done();
  // so the library does not list every example as an untitled plot
  p.title = `${SP_TEMPLATES.find((x) => x.id === template)?.name ?? 'Example'} (example)`;
  p.createdAt = opts.now;
  p.modifiedAt = opts.now;
  return p;
}

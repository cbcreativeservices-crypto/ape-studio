/**
 * stageplot/spModel — every EDIT of a Stage Plot project, as pure functions:
 * project in, new project out. The screens never change a project any other
 * way, so the rules below hold whichever work area made the edit.
 *
 * What every edit guarantees (handoff §4, §5, §10):
 *   • NO BROKEN LINKS. After any edit, every id a row points at exists
 *     (`scrub`). Removing something DETACHES what pointed at it, in the open:
 *     an instrument icon stays on the stage as a drawing, a wedge whose mix
 *     was removed is flagged "no mix", a shared mix is never erased because
 *     one of its performers left.
 *   • PATCHES FOLLOW DESTINATIONS. An input is in the house patch, the band
 *     patch or both, by its own `destination`; each patch keeps its own order
 *     and numbers, and the same number in two patches is not a clash.
 *   • STEREO STAYS PAIRED. The two sides of a pair move together. Removing
 *     one side is allowed and is then a review question (restore, or make
 *     the request mono); nothing is silently renamed.
 *   • A REVISION IS FROZEN ONCE SHARED. The first edit after an export or
 *     after "Ready to advance" moves the revision forward by one and returns
 *     the status to Draft, so a changed document can never carry the number
 *     of the one already sent.
 *   • AN ICON NEVER ADDS AN INPUT, and a package's rows are ordinary rows.
 *
 * Pure: no React, no storage, no clock (the caller passes `now`).
 */
import { SP_CATEGORY_ORDER, spPackage, spPaletteItem, type SpPackage, type SpPackageRow } from './spCatalog.ts';
import { SP_CHOIR_DEFAULT, SP_CHOIR_LEGACY, spChoirClean } from './spChoir.ts';
import { SP_ROUND_REF_MAX, SP_SHAPE_DEFAULTS, spHasWings, spIsCircle, spMoveLimits, spOnShape, spShapeLocationWord, spWingFrac } from './spShape.ts';
import {
  SP_SCHEMA,
  type SpBoxFeed,
  type SpBoxPatch,
  type SpReturnPatch,
  type SpStage,
  type SpStageBox,
  type SpCategory,
  type SpDevice,
  type SpDiDevice,
  type SpExtra,
  type SpId,
  type SpInput,
  type SpMix,
  type SpMixNeed,
  type SpObject,
  type SpObjectKind,
  type SpPatch,
  type SpPatchId,
  type SpPerformer,
  type SpProject,
  type SpSource,
} from './spTypes.ts';

/* ── basics ─────────────────────────────────────────────────────────────── */

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

const newId = (p: SpProject, prefix: string): SpId => {
  p.seq += 1;
  return `${prefix}${p.seq}`;
};

const PATCH_NAME: Record<SpPatchId, string> = { house: 'House system', band: 'Band monitor rig' };
const emptyPatch = (id: SpPatchId): SpPatch => ({ id, name: PATCH_NAME[id], order: [], numbers: {}, reserved: [], venue: {} });

export function spNewProject(opts: { id: SpId; band?: string; title?: string; now: number; startedFrom?: string }): SpProject {
  return {
    schema: SP_SCHEMA,
    id: opts.id,
    kind: 'master',
    masterId: null,
    band: opts.band ?? '',
    title: opts.title ?? '',
    venue: '',
    eventDate: '',
    loadIn: '',
    soundcheck: '',
    performance: '',
    contact: { name: '', role: '', email: '', phone: '', show: { name: true, role: true, email: true, phone: true } },
    revision: 1,
    frozenRevision: 0,
    packetRevision: 0,
    status: 'draft',
    venueConfirmed: false,
    modifiedAt: opts.now,
    createdAt: opts.now,
    stage: { width: null, depth: null, unit: 'ft', dims: 'estimated', grid: true, snap: true, ...SP_SHAPE_DEFAULTS },
    notes: '',
    accessNotes: '',
    viewNote: '',
    performers: [],
    sources: [],
    inputs: [],
    diDevices: [],
    patches: [emptyPatch('house')],
    mixes: [],
    devices: [],
    extras: [],
    boxes: [],
    objects: [],
    seq: 0,
    startedFrom: opts.startedFrom ?? '',
    // never assumed: only spFromTemplate('blank') says so
    startedBlank: false,
  };
}

export const spPatch = (p: SpProject, id: SpPatchId): SpPatch | undefined => p.patches.find((x) => x.id === id);
export const spInput = (p: SpProject, id: SpId): SpInput | undefined => p.inputs.find((x) => x.id === id);
export const spSource = (p: SpProject, id: SpId): SpSource | undefined => p.sources.find((x) => x.id === id);
export const spPerformer = (p: SpProject, id: SpId | null): SpPerformer | undefined => (id ? p.performers.find((x) => x.id === id) : undefined);
export const spMix = (p: SpProject, id: SpId | null): SpMix | undefined => (id ? p.mixes.find((x) => x.id === id) : undefined);
export const spDevice = (p: SpProject, id: SpId | null): SpDevice | undefined => (id ? p.devices.find((x) => x.id === id) : undefined);
export const spObject = (p: SpProject, id: SpId): SpObject | undefined => p.objects.find((x) => x.id === id);
/** The other side of a stereo pair, if it still exists. */
export const spPartner = (p: SpProject, i: SpInput): SpInput | undefined => (i.pairId ? p.inputs.find((x) => x.pairId === i.pairId && x.id !== i.id) : undefined);

/** Which patches an input belongs to, by its destination. */
export function spPatchesOf(i: SpInput): SpPatchId[] {
  if (i.destination === 'band') return ['band'];
  if (i.destination === 'both') return ['house', 'band'];
  return ['house'];
}

/** The next free channel number in a patch (after the highest in use, never
 *  a reserved one). */
function nextNumber(patch: SpPatch): number {
  let n = 0;
  for (const id of patch.order) n = Math.max(n, patch.numbers[id] ?? 0);
  n += 1;
  while (patch.reserved.includes(n)) n += 1;
  return n;
}

/** Make every patch hold exactly the inputs whose destination names it. A new
 *  member joins after its stereo partner when the partner is there, otherwise
 *  at the end, with the next free number. */
function syncPatches(p: SpProject): void {
  for (const pid of ['house', 'band'] as const) {
    const want = p.inputs.filter((i) => spPatchesOf(i).includes(pid));
    let patch = spPatch(p, pid);
    if (!patch) {
      if (!want.length) continue;
      patch = emptyPatch(pid);
      p.patches.push(patch);
    }
    const wantIds = new Set(want.map((i) => i.id));
    patch.order = patch.order.filter((id) => wantIds.has(id));
    for (const k of Object.keys(patch.numbers)) if (!wantIds.has(k)) delete patch.numbers[k];
    for (const k of Object.keys(patch.venue)) if (!wantIds.has(k)) delete patch.venue[k];
    for (const i of want) {
      if (patch.order.includes(i.id)) continue;
      const partner = spPartner(p, i);
      const at = partner ? patch.order.indexOf(partner.id) : -1;
      const n = nextNumber(patch);
      if (at >= 0) patch.order.splice(i.side === 'L' ? at : at + 1, 0, i.id);
      else patch.order.push(i.id);
      patch.numbers[i.id] = n;
    }
    if (pid === 'band' && !patch.order.length) p.patches = p.patches.filter((x) => x.id !== 'band');
  }
  if (!spPatch(p, 'house')) p.patches.unshift(emptyPatch('house'));
}

/** Remove every pointer to something that no longer exists. Run after every
 *  edit; it never removes a row, it only detaches. */
function scrub(p: SpProject): void {
  const perf = new Set(p.performers.map((x) => x.id));
  const src = new Set(p.sources.map((x) => x.id));
  const dis = new Set(p.diDevices.map((x) => x.id));
  // an input cannot outlive its source
  p.inputs = p.inputs.filter((i) => src.has(i.sourceId));
  const inp = new Set(p.inputs.map((x) => x.id));
  const mixes = new Set(p.mixes.map((x) => x.id));
  const devs = new Set(p.devices.map((x) => x.id));
  for (const s of p.sources) if (s.performerId && !perf.has(s.performerId)) s.performerId = null;
  for (const i of p.inputs) {
    if (i.diDeviceId && (!dis.has(i.diDeviceId) || i.capture !== 'di')) i.diDeviceId = null;
    // a pair id with no partner left stays: the review asks what the band wants
  }
  for (const m of p.mixes) {
    m.recipients = m.recipients.filter((id) => perf.has(id));
    for (const k of Object.keys(m.needs)) if (!inp.has(k)) delete m.needs[k];
  }
  for (const d of p.devices) {
    if (d.mixId && !mixes.has(d.mixId)) d.mixId = null;
    if (d.performerId && !perf.has(d.performerId)) d.performerId = null;
  }
  for (const o of p.objects) {
    if (o.performerId && !perf.has(o.performerId)) o.performerId = null;
    if (o.sourceId && !src.has(o.sourceId)) o.sourceId = null;
    if (o.inputId && !inp.has(o.inputId)) o.inputId = null;
    if (o.deviceId && !devs.has(o.deviceId)) o.deviceId = null;
  }
  // stage boxes: a socket on a box that is gone is no socket; a drawing of a
  // box that is gone is a drawing
  const boxes = new Set(spBoxes(p).map((b) => b.id));
  for (const i of p.inputs) {
    if (i.box && !boxes.has(i.box.boxId)) i.box = null;
    if (i.box && i.direct) i.direct = false;
  }
  for (const o of p.objects) if (o.boxId && !boxes.has(o.boxId)) o.boxId = null;
  // (round 2) a return on a box that is gone is no return; a sub-snake that
  // fed a box that is gone, or itself, connects to the console; a loop is
  // never kept (the box that closes it connects to the console)
  for (const m of p.mixes) {
    if (m.ret && !boxes.has(m.ret.boxId)) m.ret = null;
    if (m.ret && m.fromConsole) m.fromConsole = false;
  }
  for (const b of spBoxes(p)) if (b.feed && (b.feed.boxId === b.id || !boxes.has(b.feed.boxId))) b.feed = null;
  for (const b of spBoxes(p)) if (b.feed && spFeedLoops(p, b.id, b.feed.boxId)) b.feed = null;
  // a DIGITAL box never plugs into another box's sockets: it joins over the
  // network (engineer review, round 2)
  for (const b of spBoxes(p)) if (b.feed && b.kind === 'digital') b.feed = null;
  // a circle has one size: its depth is its width
  if (spIsCircle(p.stage) && p.stage.width && p.stage.depth !== p.stage.width) p.stage.depth = p.stage.width;
  const groups = new Map<SpId, number>();
  for (const o of p.objects) if (o.groupId) groups.set(o.groupId, (groups.get(o.groupId) ?? 0) + 1);
  for (const o of p.objects) if (o.groupId && (groups.get(o.groupId) ?? 0) < 2) o.groupId = null;
  syncPatches(p);
}

/** Every pointer that does not resolve, in words. Always empty after an edit
 *  made through this module; used to check a project that was LOADED. */
export function spBrokenRefs(p: SpProject): string[] {
  const out: string[] = [];
  const has = (list: { id: SpId }[], id: SpId | null) => id == null || list.some((x) => x.id === id);
  for (const s of p.sources) if (!has(p.performers, s.performerId)) out.push(`source ${s.label}: its performer is missing`);
  for (const i of p.inputs) {
    if (!has(p.sources, i.sourceId)) out.push(`input ${i.label}: its source is missing`);
    if (!has(p.diDevices, i.diDeviceId)) out.push(`input ${i.label}: its DI device is missing`);
  }
  for (const m of p.mixes) {
    for (const r of m.recipients) if (!has(p.performers, r)) out.push(`mix ${m.code}: a recipient is missing`);
    for (const k of Object.keys(m.needs)) if (!has(p.inputs, k)) out.push(`mix ${m.code}: an input it refers to is missing`);
  }
  for (const d of p.devices) {
    if (!has(p.mixes, d.mixId)) out.push(`device ${d.label}: its mix is missing`);
    if (!has(p.performers, d.performerId)) out.push(`device ${d.label}: its performer is missing`);
  }
  for (const o of p.objects) {
    if (!has(p.performers, o.performerId) || !has(p.sources, o.sourceId) || !has(p.inputs, o.inputId) || !has(p.devices, o.deviceId) || !has(spBoxes(p), o.boxId ?? null)) out.push(`stage object ${o.label || o.kind}: something it points at is missing`);
  }
  for (const i of p.inputs) if (i.box && !has(spBoxes(p), i.box.boxId)) out.push(`input ${i.label}: its stage box is missing`);
  for (const m of p.mixes) if (m.ret && !has(spBoxes(p), m.ret.boxId)) out.push(`mix ${m.code}: its stage box return is missing`);
  for (const b of spBoxes(p)) if (b.feed && !has(spBoxes(p), b.feed.boxId)) out.push(`stage box ${spBoxName(b)}: the box it feeds is missing`);
  for (const patch of p.patches) for (const id of patch.order) if (!has(p.inputs, id)) out.push(`${patch.name}: a listed input is missing`);
  return out;
}

/** THE way to edit: copy, move the revision on if the last one was shared,
 *  change, then restore every guarantee. */
export function spEdit(p: SpProject, change: (draft: SpProject) => void): SpProject {
  const q = clone(p);
  if (q.frozenRevision >= q.revision) {
    q.revision = q.frozenRevision + 1;
    q.status = 'draft';
    q.venueConfirmed = false;
  }
  change(q);
  scrub(q);
  return q;
}

/** Freeze the current revision (an export was made from it). Not an edit. */
export function spFreeze(p: SpProject): SpProject {
  const q = clone(p);
  q.frozenRevision = q.revision;
  return q;
}
/** "Ready to advance": the band's document is prepared for discussion. It
 *  does not mean the venue accepted it. */
export function spMarkReady(p: SpProject): SpProject {
  const q = clone(p);
  q.status = 'ready';
  q.frozenRevision = q.revision;
  return q;
}
/** Back to Draft without changing anything else (the revision stays frozen,
 *  so the next real edit still moves it on). */
export function spMarkDraft(p: SpProject): SpProject {
  const q = clone(p);
  q.status = 'draft';
  q.venueConfirmed = false;
  return q;
}
export function spSetVenueConfirmed(p: SpProject, on: boolean): SpProject {
  const q = clone(p);
  q.venueConfirmed = on && q.status === 'ready';
  return q;
}

/* ── performers ─────────────────────────────────────────────────────────── */

export function spAddPerformer(p: SpProject, f: { name: string; role?: string }): { p: SpProject; id: SpId } {
  let id = '';
  const q = spEdit(p, (d) => {
    id = newId(d, 'pf');
    d.performers.push({ id, name: f.name, role: f.role ?? '', noMonitor: null });
  });
  return { p: q, id };
}
export const spUpdatePerformer = (p: SpProject, id: SpId, patch: Partial<Omit<SpPerformer, 'id'>>): SpProject =>
  spEdit(p, (d) => {
    const x = d.performers.find((y) => y.id === id);
    if (x) Object.assign(x, patch);
  });

/** What removing a performer would touch, so the screen can say it first. */
export function spPerformerLinks(p: SpProject, id: SpId): { sources: SpSource[]; inputs: SpInput[]; soleMixes: SpMix[]; sharedMixes: SpMix[]; devices: SpDevice[]; objects: SpObject[] } {
  const sources = p.sources.filter((s) => s.performerId === id);
  const sIds = new Set(sources.map((s) => s.id));
  const inputs = p.inputs.filter((i) => sIds.has(i.sourceId));
  const iIds = new Set(inputs.map((i) => i.id));
  const soleMixes = p.mixes.filter((m) => m.recipients.length === 1 && m.recipients[0] === id);
  const mIds = new Set(soleMixes.map((m) => m.id));
  // "only theirs" also means the devices they use and the devices that play
  // a mix nobody else is on, and every drawing of any of these
  const devices = p.devices.filter((x) => x.performerId === id || (x.mixId != null && mIds.has(x.mixId)));
  const dIds = new Set(devices.map((x) => x.id));
  return {
    sources,
    inputs,
    soleMixes,
    sharedMixes: p.mixes.filter((m) => m.recipients.length > 1 && m.recipients.includes(id)),
    devices,
    objects: p.objects.filter((o) => o.performerId === id || (o.sourceId != null && sIds.has(o.sourceId)) || (o.inputId != null && iIds.has(o.inputId)) || (o.deviceId != null && dIds.has(o.deviceId))),
  };
}

/** Remove a performer. `withSources` removes everything `spPerformerLinks`
 *  names as only theirs: their sources and inputs, a mix nobody else is on,
 *  the devices they use or that play such a mix, and every drawing of these
 *  (so no microphone or wedge is left standing for somebody who is gone).
 *  Without it, only the figure goes and the rest stays, with no performer.
 *  A SHARED mix always stays, with the others still on it. */
export function spRemovePerformer(p: SpProject, id: SpId, opts: { withSources: boolean }): SpProject {
  return spEdit(p, (d) => {
    const links = spPerformerLinks(d, id);
    if (opts.withSources) {
      const sIds = new Set(links.sources.map((s) => s.id));
      d.sources = d.sources.filter((s) => !sIds.has(s.id));
      d.inputs = d.inputs.filter((i) => !sIds.has(i.sourceId));
      const mIds = new Set(links.soleMixes.map((m) => m.id));
      d.mixes = d.mixes.filter((m) => !mIds.has(m.id));
      const dIds = new Set(links.devices.map((x) => x.id));
      d.devices = d.devices.filter((x) => !dIds.has(x.id));
      const oIds = new Set(links.objects.map((o) => o.id));
      d.objects = d.objects.filter((o) => !oIds.has(o.id));
    }
    d.objects = d.objects.filter((o) => o.performerId !== id);
    d.performers = d.performers.filter((x) => x.id !== id);
  });
}

/* ── sources and inputs ─────────────────────────────────────────────────── */

const blankInput = (id: SpId, sourceId: SpId, label: string): SpInput => ({
  id,
  sourceId,
  label,
  side: null,
  pairId: null,
  capture: 'mic',
  equipment: '',
  alternatives: '',
  priority: 'preferred',
  connector: '',
  level: '',
  adapterNote: '',
  stand: 'none',
  standNote: '',
  phantom: 'unknown',
  supplier: 'tbc',
  standSupplier: 'tbc',
  diDeviceId: null,
  destination: 'house',
  splitNote: '',
  audience: 'audience',
  cue: false,
  cueAudienceOk: false,
  notes: '',
  box: null,
  direct: false,
});

function pushInput(d: SpProject, sourceId: SpId, row: SpPackageRow, pairId: SpId | null): SpId {
  const id = newId(d, 'in');
  const i = blankInput(id, sourceId, row.label);
  i.side = row.side ?? null;
  i.pairId = row.side ? pairId : null;
  i.capture = row.capture;
  i.equipment = row.equipment;
  i.stand = row.stand;
  i.connector = row.connector ?? '';
  if (row.cue) {
    i.cue = true;
    i.audience = 'monitor-only';
  }
  d.inputs.push(i);
  // a click or cue is kept out of every mix until someone asks for it
  if (i.cue) for (const m of d.mixes) m.needs[id] = 'exclude';
  return id;
}

export function spAddSource(p: SpProject, f: { label: string; category: SpCategory; performerId?: SpId | null; connection?: 'inputs' | 'none' }): { p: SpProject; id: SpId } {
  let id = '';
  const q = spEdit(p, (d) => {
    id = newId(d, 'sr');
    d.sources.push({ id, label: f.label, category: f.category, performerId: f.performerId ?? null, connection: f.connection ?? 'inputs', noneReason: null, offstage: false, locationNote: '' });
  });
  return { p: q, id };
}
export const spUpdateSource = (p: SpProject, id: SpId, patch: Partial<Omit<SpSource, 'id'>>): SpProject =>
  spEdit(p, (d) => {
    const x = d.sources.find((y) => y.id === id);
    if (!x) return;
    Object.assign(x, patch);
    // "no sound-system connection" means it has no inputs
    if (x.connection === 'none') d.inputs = d.inputs.filter((i) => i.sourceId !== id);
  });
/** Remove a source and its inputs. Its icon stays on the stage as a drawing. */
export const spRemoveSource = (p: SpProject, id: SpId): SpProject =>
  spEdit(p, (d) => {
    d.sources = d.sources.filter((s) => s.id !== id);
  });

/** Add a ready-made package: a new source (or rows on an existing one) and
 *  its proposed rows. The rows are ordinary rows afterwards. */
export function spAddPackage(p: SpProject, pkg: SpPackage | string, f: { performerId?: SpId | null; sourceLabel?: string; sourceId?: SpId; rows?: readonly SpPackageRow[] } = {}): { p: SpProject; sourceId: SpId; inputIds: SpId[] } {
  const def = typeof pkg === 'string' ? spPackage(pkg) : pkg;
  if (!def) return { p, sourceId: '', inputIds: [] };
  let sourceId = f.sourceId ?? '';
  const inputIds: SpId[] = [];
  const q = spEdit(p, (d) => {
    if (!sourceId || !d.sources.some((s) => s.id === sourceId)) {
      sourceId = newId(d, 'sr');
      d.sources.push({ id: sourceId, label: f.sourceLabel ?? def.source, category: def.category, performerId: f.performerId ?? null, connection: 'inputs', noneReason: null, offstage: false, locationNote: '' });
    } else {
      const s = d.sources.find((x) => x.id === sourceId);
      if (s) s.connection = 'inputs';
    }
    const rows = f.rows ?? def.rows;
    // rows that carry L and R are paired two by two, in the order given
    let pairId: SpId | null = null;
    for (const row of rows) {
      if (row.side === 'L') pairId = newId(d, 'pr');
      inputIds.push(pushInput(d, sourceId, row, row.side ? pairId : null));
      if (row.side === 'R') pairId = null;
    }
  });
  return { p: q, sourceId, inputIds };
}

export function spAddInput(p: SpProject, sourceId: SpId, row: SpPackageRow): { p: SpProject; id: SpId } {
  let id = '';
  const q = spEdit(p, (d) => {
    const s = d.sources.find((x) => x.id === sourceId);
    if (!s) return;
    s.connection = 'inputs';
    id = pushInput(d, sourceId, { ...row, side: undefined }, null);
  });
  return { p: q, id };
}

export const spUpdateInput = (p: SpProject, id: SpId, patch: Partial<Omit<SpInput, 'id' | 'sourceId' | 'pairId' | 'side'>>): SpProject =>
  spEdit(p, (d) => {
    const x = d.inputs.find((y) => y.id === id);
    if (!x) return;
    const wasCue = x.cue;
    const routing = `${x.cue}/${x.audience}`;
    Object.assign(x, patch);
    // "the audience is meant to hear it" answers ONE routing; a change of
    // routing asks again
    if (`${x.cue}/${x.audience}` !== routing && patch.cueAudienceOk === undefined) x.cueAudienceOk = false;
    if (x.cue && !wasCue) {
      // marking something a click or cue takes it out of the audience mix and
      // out of every mix that has not asked for it; the user can change both
      if (patch.audience === undefined) x.audience = 'monitor-only';
      for (const m of d.mixes) if (m.needs[id] === undefined) m.needs[id] = 'exclude';
    }
  });

/** Remove one input. If it was one side of a stereo pair, the other side
 *  stays as it is and the review asks what the band wants. */
export const spRemoveInput = (p: SpProject, id: SpId): SpProject =>
  spEdit(p, (d) => {
    d.inputs = d.inputs.filter((i) => i.id !== id);
  });

const stripSide = (label: string): string => label.replace(/\s+(L|R|left|right)$/i, '').trim() || label;

/** The name one side of a stereo pair takes when it becomes mono: its name
 *  without the side, made unique among the OTHER inputs ("Keys" is taken, so
 *  "Keys 2"). Two inputs never share one name in a packet. */
export function spMonoLabel(p: SpProject, inputId: SpId): string {
  const x = p.inputs.find((i) => i.id === inputId);
  if (!x) return '';
  const base = stripSide(x.label);
  // …and among the OTHER sources' names: "Keys 2" was taken by a package's
  // source, and the review then named the wrong thing (R2-SP2-05)
  const others = [
    ...p.inputs.filter((i) => i.id !== x.id && !(x.pairId && i.pairId === x.pairId)).map((i) => i.label.trim().toLowerCase()),
    ...p.sources.filter((s) => s.id !== x.sourceId).map((s) => s.label.trim().toLowerCase()),
  ];
  if (!others.includes(base.toLowerCase())) return base;
  for (let n = 2; n < 100; n += 1) if (!others.includes(`${base} ${n}`.toLowerCase())) return `${base} ${n}`;
  return base;
}

/** A stereo pair lost one side: make the request mono, in the open. */
export const spPairToMono = (p: SpProject, remainingId: SpId): SpProject =>
  spEdit(p, (d) => {
    const x = d.inputs.find((y) => y.id === remainingId);
    if (!x) return;
    x.label = spMonoLabel(d, x.id);
    x.side = null;
    x.pairId = null;
  });

/** A stereo pair lost one side: put the missing side back, as a copy of the
 *  side that is left. */
export function spPairRestore(p: SpProject, remainingId: SpId): { p: SpProject; id: SpId } {
  let id = '';
  const q = spEdit(p, (d) => {
    const x = d.inputs.find((y) => y.id === remainingId);
    if (!x || !x.pairId || !x.side || d.inputs.some((y) => y.pairId === x.pairId && y.id !== x.id)) return;
    id = newId(d, 'in');
    const side = x.side === 'L' ? 'R' : 'L';
    // beside its partner in the input rows too (L first), so every list made
    // from the rows (the review, the packet's questions) says L before R
    // (R2-SP2-11)
    const xi = d.inputs.indexOf(x);
    // (a stage box socket is never copied: two inputs on one socket)
    d.inputs.splice(side === 'L' ? xi : xi + 1, 0, { ...clone(x), id, side, label: `${stripSide(x.label)} ${side}`, box: null });
    for (const m of d.mixes) if (m.needs[x.id] !== undefined) m.needs[id] = m.needs[x.id];
    // The side comes back BESIDE its partner, on the number next to it when
    // that number is free (L just below, R just above); otherwise on the
    // next free number. Never at the end of the list with a gap left behind.
    for (const pid of spPatchesOf(x)) {
      const patch = spPatch(d, pid);
      const at = patch ? patch.order.indexOf(x.id) : -1;
      if (!patch || at < 0) continue;
      patch.order.splice(side === 'L' ? at : at + 1, 0, id);
      const mine = patch.numbers[x.id];
      const want = mine == null ? null : side === 'L' ? mine - 1 : mine + 1;
      const used = new Set(Object.values(patch.numbers));
      patch.numbers[id] = want != null && want > 0 && !used.has(want) && !patch.reserved.includes(want) ? want : nextNumber(patch);
    }
  });
  return { p: q, id };
}

/** Make a stereo pair mono ON PURPOSE (the band chose one channel). The DI
 *  device it used is an explicit choice: keep it on the remaining input, or
 *  release it (and remove it if nothing else uses it). */
export const spStereoToMono = (p: SpProject, pairId: SpId, opts: { keep: 'L' | 'R'; di: 'keep' | 'release' }): SpProject =>
  spEdit(p, (d) => {
    const pair = d.inputs.filter((i) => i.pairId === pairId);
    const keep = pair.find((i) => i.side === opts.keep) ?? pair[0];
    if (!keep) return;
    const drop = pair.filter((i) => i.id !== keep.id).map((i) => i.id);
    d.inputs = d.inputs.filter((i) => !drop.includes(i.id));
    keep.label = spMonoLabel(d, keep.id);
    keep.side = null;
    keep.pairId = null;
    if (opts.di === 'release' && keep.diDeviceId) {
      const dev = keep.diDeviceId;
      keep.diDeviceId = null;
      if (!d.inputs.some((i) => i.diDeviceId === dev)) d.diDevices = d.diDevices.filter((x) => x.id !== dev);
    }
  });

/* ── DI devices ─────────────────────────────────────────────────────────── */

export function spAddDiDevice(p: SpProject, f: Partial<Omit<SpDiDevice, 'id'>> & { inputIds?: SpId[] }): { p: SpProject; id: SpId } {
  let id = '';
  const q = spEdit(p, (d) => {
    id = newId(d, 'di');
    const channels = f.channels ?? 1;
    d.diDevices.push({ id, label: f.label ?? (channels === 2 ? 'Stereo DI' : 'Mono DI'), channels, kind: f.kind ?? 'unknown', model: f.model ?? '', supplier: f.supplier ?? 'tbc' });
    for (const inputId of (f.inputIds ?? []).slice(0, channels)) {
      const i = d.inputs.find((x) => x.id === inputId);
      if (i && i.capture === 'di') i.diDeviceId = id;
    }
  });
  return { p: q, id };
}
export const spUpdateDiDevice = (p: SpProject, id: SpId, patch: Partial<Omit<SpDiDevice, 'id'>>): SpProject =>
  spEdit(p, (d) => {
    const x = d.diDevices.find((y) => y.id === id);
    if (x) Object.assign(x, patch);
  });
export const spRemoveDiDevice = (p: SpProject, id: SpId): SpProject =>
  spEdit(p, (d) => {
    d.diDevices = d.diDevices.filter((x) => x.id !== id);
  });
export const spAssignDi = (p: SpProject, inputId: SpId, deviceId: SpId | null): SpProject =>
  spEdit(p, (d) => {
    const i = d.inputs.find((x) => x.id === inputId);
    if (i && i.capture === 'di') i.diDeviceId = deviceId;
  });

/* ── channel order and numbers ──────────────────────────────────────────── */

/** Number a patch 1, 2, 3… in its current order. `keepReserved` skips the
 *  channel numbers the band keeps free, and then a stereo pair (two
 *  neighbours in the order) moves on to the next TWO free neighbouring
 *  channels, never split around a reserved one (R2-SP2-08). */
function renumber(patch: SpPatch, keepReserved: boolean, inputs: readonly SpInput[] = []): void {
  const pairOf = new Map(inputs.filter((i) => i.pairId).map((i) => [i.id, i.pairId] as const));
  let n = 0;
  patch.order.forEach((id, k) => {
    const next = patch.order[k + 1];
    const startsPair = !!next && !!pairOf.get(id) && pairOf.get(id) === pairOf.get(next);
    const prev = patch.order[k - 1];
    const endsPair = !!prev && !!pairOf.get(id) && pairOf.get(id) === pairOf.get(prev) && patch.numbers[prev] === n;
    n += 1;
    if (keepReserved && !endsPair) while (patch.reserved.includes(n) || (startsPair && patch.reserved.includes(n + 1))) n += 1;
    patch.numbers[id] = n;
  });
}

export const spRenumber = (p: SpProject, patchId: SpPatchId, opts: { keepReserved: boolean }): SpProject =>
  spEdit(p, (d) => {
    const patch = spPatch(d, patchId);
    if (patch) renumber(patch, opts.keepReserved, d.inputs);
  });

export const spSetReserved = (p: SpProject, patchId: SpPatchId, reserved: number[]): SpProject =>
  spEdit(p, (d) => {
    const patch = spPatch(d, patchId);
    if (patch) patch.reserved = [...new Set(reserved.filter((n) => Number.isInteger(n) && n > 0))].sort((a, b) => a - b);
  });

/** Type a channel number for one input. Nothing else moves: a duplicate is
 *  allowed while editing and shown in review. */
export const spSetNumber = (p: SpProject, patchId: SpPatchId, inputId: SpId, n: number | null): SpProject =>
  spEdit(p, (d) => {
    const patch = spPatch(d, patchId);
    if (patch && patch.order.includes(inputId)) patch.numbers[inputId] = n != null && Number.isInteger(n) && n > 0 ? n : null;
  });

export const spSetVenueChannel = (p: SpProject, patchId: SpPatchId, inputId: SpId, text: string): SpProject =>
  spEdit(p, (d) => {
    const patch = spPatch(d, patchId);
    if (!patch || !patch.order.includes(inputId)) return;
    if (text.trim()) patch.venue[inputId] = text.trim();
    else delete patch.venue[inputId];
  });

/** Move an input up or down the list. Both sides of a stereo pair move as
 *  one block. `renumber` (the usual case) then numbers the list again. */
export const spMoveInput = (p: SpProject, patchId: SpPatchId, inputId: SpId, by: number, opts: { renumber: boolean; keepReserved?: boolean } = { renumber: true }): SpProject =>
  spEdit(p, (d) => {
    const patch = spPatch(d, patchId);
    const me = d.inputs.find((i) => i.id === inputId);
    if (!patch || !me || !by) return;
    const blockOf = (id: SpId): SpId[] => {
      const i = d.inputs.find((x) => x.id === id);
      const partner = i ? spPartner(d, i) : undefined;
      const ids = partner && patch.order.includes(partner.id) ? [id, partner.id] : [id];
      return ids.sort((a, b) => patch.order.indexOf(a) - patch.order.indexOf(b));
    };
    // the list as blocks (a pair is one block), then move this block
    const blocks: SpId[][] = [];
    const seen = new Set<SpId>();
    for (const id of patch.order) {
      if (seen.has(id)) continue;
      const b = blockOf(id);
      b.forEach((x) => seen.add(x));
      blocks.push(b);
    }
    const from = blocks.findIndex((b) => b.includes(inputId));
    const to = Math.max(0, Math.min(blocks.length - 1, from + by));
    if (from < 0 || to === from) return;
    const [mine] = blocks.splice(from, 1);
    blocks.splice(to, 0, mine);
    patch.order = blocks.flat();
    if (opts.renumber) renumber(patch, opts.keepReserved ?? true, d.inputs);
  });

/** Sort a patch into the conventional order (drums, percussion, bass,
 *  guitars, keys, playback, other, vocals), keeping the present order inside
 *  each group and each stereo pair together, then number it. */
export const spSortConventional = (p: SpProject, patchId: SpPatchId, opts: { keepReserved: boolean } = { keepReserved: true }): SpProject =>
  spEdit(p, (d) => {
    const patch = spPatch(d, patchId);
    if (!patch) return;
    const rank = (id: SpId): number => {
      const i = d.inputs.find((x) => x.id === id);
      const s = i ? d.sources.find((x) => x.id === i.sourceId) : undefined;
      // a click or cue sits with playback, wherever its source was filed
      const cat: SpCategory = i?.cue ? 'playback' : (s?.category ?? 'other');
      return SP_CATEGORY_ORDER.indexOf(cat);
    };
    const before = [...patch.order];
    patch.order = [...patch.order].sort((a, b) => rank(a) - rank(b) || before.indexOf(a) - before.indexOf(b));
    // bring each pair together, L first, at the place of its first side
    const out: SpId[] = [];
    for (const id of patch.order) {
      if (out.includes(id)) continue;
      const i = d.inputs.find((x) => x.id === id);
      const partner = i ? spPartner(d, i) : undefined;
      if (i && partner && patch.order.includes(partner.id)) out.push(...(i.side === 'R' ? [partner.id, id] : [id, partner.id]));
      else out.push(id);
    }
    patch.order = out;
    renumber(patch, opts.keepReserved, d.inputs);
  });

/* ── monitor mixes and devices ──────────────────────────────────────────── */

export function spAddMix(p: SpProject, f: Partial<Omit<SpMix, 'id' | 'code' | 'needs'>> = {}): { p: SpProject; id: SpId } {
  let id = '';
  const q = spEdit(p, (d) => {
    id = newId(d, 'mx');
    let n = d.mixes.length + 1;
    while (d.mixes.some((m) => m.code === `M${n}`)) n += 1;
    const needs: Record<SpId, SpMixNeed> = {};
    // a click or cue is excluded from a new mix until someone asks for it
    for (const i of d.inputs) if (i.cue) needs[i.id] = 'exclude';
    d.mixes.push({
      id,
      code: `M${n}`,
      name: f.name ?? '',
      recipients: f.recipients ?? [],
      format: f.format ?? 'mono',
      provider: f.provider ?? 'tbc',
      delivery: f.delivery ?? 'wedge',
      outputs: f.outputs ?? '',
      instructions: f.instructions ?? [],
      needs,
      venueFeed: f.venueFeed ?? 'tbc',
      notes: f.notes ?? '',
      ret: null,
      fromConsole: false,
    });
  });
  return { p: q, id };
}
export const spUpdateMix = (p: SpProject, id: SpId, patch: Partial<Omit<SpMix, 'id' | 'needs'>>): SpProject =>
  spEdit(p, (d) => {
    const x = d.mixes.find((y) => y.id === id);
    if (x) Object.assign(x, patch);
  });
/** Remove a mix. Devices that played it stay, flagged "no mix". */
export const spRemoveMix = (p: SpProject, id: SpId): SpProject =>
  spEdit(p, (d) => {
    d.mixes = d.mixes.filter((m) => m.id !== id);
  });
/** What one mix needs of one input; null = no preference recorded. */
export const spSetNeed = (p: SpProject, mixId: SpId, inputId: SpId, need: SpMixNeed | null): SpProject =>
  spEdit(p, (d) => {
    const m = d.mixes.find((y) => y.id === mixId);
    if (!m || !d.inputs.some((i) => i.id === inputId)) return;
    if (need) m.needs[inputId] = need;
    else delete m.needs[inputId];
  });
/** Renumber the mix codes M1, M2… in their present order (asked for, never
 *  automatic). */
export const spRenumberMixes = (p: SpProject): SpProject =>
  spEdit(p, (d) => {
    d.mixes.forEach((m, k) => {
      m.code = `M${k + 1}`;
    });
  });

export function spAddDevice(p: SpProject, f: Partial<Omit<SpDevice, 'id'>> & { type: SpDevice['type'] }): { p: SpProject; id: SpId } {
  let id = '';
  const q = spEdit(p, (d) => {
    id = newId(d, 'dv');
    d.devices.push({
      id,
      type: f.type,
      label: f.label ?? '',
      mixId: f.mixId ?? null,
      selfContained: f.selfContained ?? false,
      performerId: f.performerId ?? null,
      model: f.model ?? '',
      supplier: f.supplier ?? 'tbc',
      wireless: f.wireless ?? f.type === 'iem-tx',
      note: f.note ?? '',
    });
  });
  return { p: q, id };
}
export const spUpdateDevice = (p: SpProject, id: SpId, patch: Partial<Omit<SpDevice, 'id'>>): SpProject =>
  spEdit(p, (d) => {
    const x = d.devices.find((y) => y.id === id);
    if (x) Object.assign(x, patch);
  });
/** Remove a device. Its icon, if it has one, stays as a drawing. */
export const spRemoveDevice = (p: SpProject, id: SpId): SpProject =>
  spEdit(p, (d) => {
    d.devices = d.devices.filter((x) => x.id !== id);
  });

/* ── other listed equipment ─────────────────────────────────────────────── */

export function spAddExtra(p: SpProject, f: Partial<Omit<SpExtra, 'id'>> & { kind: SpExtra['kind'] }): { p: SpProject; id: SpId } {
  let id = '';
  const q = spEdit(p, (d) => {
    id = newId(d, 'ex');
    d.extras.push({ id, kind: f.kind, label: f.label ?? '', qty: f.qty ?? 1, supplier: f.supplier ?? 'tbc', note: f.note ?? '' });
  });
  return { p: q, id };
}
export const spUpdateExtra = (p: SpProject, id: SpId, patch: Partial<Omit<SpExtra, 'id'>>): SpProject =>
  spEdit(p, (d) => {
    const x = d.extras.find((y) => y.id === id);
    if (x) Object.assign(x, patch);
  });
export const spRemoveExtra = (p: SpProject, id: SpId): SpProject =>
  spEdit(p, (d) => {
    d.extras = d.extras.filter((x) => x.id !== id);
  });

/* ── the stage ──────────────────────────────────────────────────────────── */

/** The picture's width ÷ depth. Real dimensions when given; otherwise a
 *  usual club-stage shape, and the export says "Not to scale". */
export const SP_DEFAULT_ASPECT = 1.6;
/** (A circular stage is as deep as it is wide, sized or not.) */
export const spStageAspect = (p: SpProject): number => (spIsCircle(p.stage) ? 1 : p.stage.width && p.stage.depth ? Math.max(0.6, Math.min(4, p.stage.width / p.stage.depth)) : SP_DEFAULT_ASPECT);
export const spToScale = (p: SpProject): boolean => !!(p.stage.width && p.stage.depth);

/** One grid step, as a fraction of the stage width and of its depth: one
 *  foot or a quarter meter when the size is known, otherwise 1/24 of the
 *  width. */
export function spGridStep(p: SpProject): { x: number; y: number } {
  if (p.stage.width && p.stage.depth) {
    const unit = p.stage.unit === 'ft' ? 1 : 0.25;
    return { x: unit / p.stage.width, y: unit / p.stage.depth };
  }
  return { x: 1 / 24, y: (1 / 24) * spStageAspect(p) };
}
const snapTo = (v: number, step: number): number => Math.round(v / step) * step;

type ObjectLink = Partial<Pick<SpObject, 'performerId' | 'sourceId' | 'inputId' | 'deviceId' | 'boxId' | 'label' | 'rot' | 'w' | 'h' | 'choir'>>;

/** A new object in a draft (inside an edit). */
function pushObject(d: SpProject, kind: SpObjectKind, at: { x: number; y: number }, link: ObjectLink): SpId {
  const id = newId(d, 'ob');
  const item = spPaletteItem(kind);
  d.objects.push({
    id,
    kind,
    x: at.x,
    y: at.y,
    rot: link.rot ?? 0,
    label: link.label ?? item.label,
    w: link.w ?? (item.sized ? (kind === 'riser' ? 0.3 : 0.12) : null),
    h: link.h ?? (item.sized ? (kind === 'riser' ? 0.25 : 0.1) : null),
    sizeNote: '',
    performerId: link.performerId ?? null,
    sourceId: link.sourceId ?? null,
    inputId: link.inputId ?? null,
    deviceId: link.deviceId ?? null,
    boxId: link.boxId ?? null,
    groupId: null,
    offstageOk: false,
    visualOnly: false,
    note: '',
    // a choir has its own size (round 2): 11 singers, rows chosen for it
    ...(kind === 'choir' ? { choir: link.choir ? spChoirClean(link.choir) : { ...SP_CHOIR_DEFAULT } } : {}),
  });
  return id;
}

export function spAddObject(p: SpProject, kind: SpObjectKind, at: { x: number; y: number }, link: ObjectLink = {}): { p: SpProject; id: SpId } {
  let id = '';
  const q = spEdit(p, (d) => {
    id = pushObject(d, kind, at, link);
  });
  return { p: q, id };
}

export const spUpdateObject = (p: SpProject, id: SpId, patch: Partial<Omit<SpObject, 'id' | 'groupId'>>): SpProject =>
  spEdit(p, (d) => {
    const x = d.objects.find((y) => y.id === id);
    if (!x) return;
    Object.assign(x, patch);
    x.rot = ((Math.round(x.rot) % 360) + 360) % 360;
  });

/** The object and everything grouped with it. */
export function spGroupOf(p: SpProject, id: SpId): SpObject[] {
  const o = spObject(p, id);
  if (!o) return [];
  return o.groupId ? p.objects.filter((x) => x.groupId === o.groupId) : [o];
}

/** Move an object (and its group) so that IT lands at `to`. With snap on,
 *  the object lands on the grid and the group keeps its shape. */
export const spMoveObject = (p: SpProject, id: SpId, to: { x: number; y: number }, opts: { snap?: boolean } = {}): SpProject =>
  spEdit(p, (d) => {
    const o = d.objects.find((y) => y.id === id);
    if (!o) return;
    const snap = opts.snap ?? d.stage.snap;
    const step = spGridStep(d);
    const tx = snap ? snapTo(to.x, step.x) : to.x;
    const ty = snap ? snapTo(to.y, step.y) : to.y;
    // an object can be dragged a little way off the stage's floor (front of
    // house, an aisle), never out of reach: a quarter of the stage past the
    // shape's outer edges (a thrust's tongue, the wings: spMoveLimits)
    const lim = spMoveLimits(d.stage);
    const cx = Math.max(lim.x0, Math.min(lim.x1, tx));
    const cy = Math.max(lim.y0, Math.min(lim.y1, ty));
    const dx = cx - o.x;
    const dy = cy - o.y;
    for (const m of o.groupId ? d.objects.filter((y) => y.groupId === o.groupId) : [o]) {
      m.x += dx;
      m.y += dy;
    }
  });

/** Remove objects (each with its group). Nothing in the lists is removed:
 *  a performer or a source with no icon left is flagged "not on the stage". */
export const spRemoveObjects = (p: SpProject, ids: SpId[]): SpProject =>
  spEdit(p, (d) => {
    const gone = new Set<SpId>();
    for (const id of ids) for (const o of spGroupOf(d, id)) gone.add(o.id);
    d.objects = d.objects.filter((o) => !gone.has(o.id));
  });

/** Duplicate an object (with its group), a little to one side. The copies
 *  are DRAWINGS: they point at nothing, so no performer, source, input or
 *  device is ever shared between two icons by a duplicate. */
export function spDuplicateObject(p: SpProject, id: SpId): { p: SpProject; ids: SpId[] } {
  const ids: SpId[] = [];
  const q = spEdit(p, (d) => {
    const members = spGroupOf(d, id);
    if (!members.length) return;
    const groupId = members.length > 1 ? newId(d, 'gr') : null;
    // a little to one side, and UPSTAGE when the copy would land across the
    // front edge (the audience side) or past stage left
    const maxX = Math.max(...members.map((m) => m.x));
    const maxY = Math.max(...members.map((m) => m.y));
    const dx = maxX + 0.06 > 0.97 ? -0.06 : 0.06;
    const dy = maxY + 0.06 > 0.9 ? -0.06 : 0.06;
    for (const m of members) {
      const nid = newId(d, 'ob');
      ids.push(nid);
      // A copy of a LINKED object is only a drawing, so it must not carry the
      // name of the thing in the lists ("Wedge 1" twice, one in no monitor
      // plan): it is named as a copy.
      const linked = !!(m.performerId || m.sourceId || m.inputId || m.deviceId || m.boxId);
      const base = m.label.trim() || (m.kind === 'performer' ? spPerformer(d, m.performerId)?.name.trim() ?? '' : '') || spPaletteItem(m.kind).name;
      d.objects.push({ ...clone(m), id: nid, x: m.x + dx, y: m.y + dy, performerId: null, sourceId: null, inputId: null, deviceId: null, boxId: null, groupId, label: linked ? `${base} (copy)` : m.label });
    }
  });
  return { p: q, ids };
}

export function spGroup(p: SpProject, ids: SpId[]): SpProject {
  return spEdit(p, (d) => {
    const members = d.objects.filter((o) => ids.includes(o.id));
    if (members.length < 2) return;
    const g = newId(d, 'gr');
    // joining two groups makes one group of everything in both
    const old = new Set(members.map((m) => m.groupId).filter(Boolean) as SpId[]);
    for (const o of d.objects) if (ids.includes(o.id) || (o.groupId && old.has(o.groupId))) o.groupId = g;
  });
}
export const spUngroup = (p: SpProject, id: SpId): SpProject =>
  spEdit(p, (d) => {
    const o = d.objects.find((y) => y.id === id);
    if (!o?.groupId) return;
    const g = o.groupId;
    for (const m of d.objects) if (m.groupId === g) m.groupId = null;
  });

/** Grid and Snap from the Stage's VIEW switches. SNAP IS NEVER PRINTED, and
 *  the grid is printed only on a plot drawn to scale: a switch that changes
 *  nothing on paper is a screen preference, so it does not move a shared
 *  revision on or put a Ready plot back to Draft (it is not an edit). The
 *  grid of a plot to scale IS printed, so turning it is an ordinary edit. */
export function spSetStageView(p: SpProject, patch: { grid?: boolean; snap?: boolean }): SpProject {
  const gridPrinted = patch.grid != null && patch.grid !== p.stage.grid && spToScale(p);
  if (gridPrinted) {
    return spEdit(p, (d) => {
      if (patch.grid != null) d.stage.grid = patch.grid;
      if (patch.snap != null) d.stage.snap = patch.snap;
    });
  }
  const q = clone(p);
  if (patch.grid != null) q.stage.grid = patch.grid;
  if (patch.snap != null) q.stage.snap = patch.snap;
  return q;
}

/** On the stage's floor: the performance area, or a wing (spShape). With no
 *  stage given, the rectangle. */
export const spOnStage = (o: { x: number; y: number }, stage?: SpStage | null): boolean => spOnShape(o, stage);

/** Where a point is, in stage words. Stage right is the viewer's LEFT: the
 *  words are the performer's, facing the audience ("upstage right", "stage
 *  left", "center stage", "downstage center"). Pass the stage for its shape:
 *  a thrust's tongue, a wing, the round said from its reference side. */
export function spLocationWord(at: { x: number; y: number }, stage?: SpStage | null): string {
  return spShapeLocationWord(at, stage);
}

/** Change the stage's shape fields in one edit. A circle has one size: its
 *  depth follows its width (scrub). Wings are an option of a rectangle or a
 *  thrust (`wings`); the morning's `shape: 'wings'` still means a rectangle
 *  with wings on, so an older caller gets what it asked for. */
export const spSetStageShape = (p: SpProject, patch: Partial<Pick<SpStage, 'shape' | 'thrustWidth' | 'thrustDepth' | 'wingWidth' | 'wings' | 'roundForm' | 'roundRef'>>): SpProject =>
  spEdit(p, (d) => {
    Object.assign(d.stage, patch.shape === 'wings' ? { ...patch, shape: 'rect', wings: true } : patch);
    if (d.stage.roundRef != null) d.stage.roundRef = d.stage.roundRef.slice(0, SP_ROUND_REF_MAX);
  });

/* ── stage boxes ────────────────────────────────────────────────────────── */

/** Stage boxes as sold, by their number of input sockets. */
export const SP_BOX_SIZES: readonly number[] = [8, 12, 16, 24, 32, 48];
/** The most sockets one box may be given (a typed number). */
export const SP_BOX_MAX = 96;

/** The project's stage boxes (a plot saved before boxes existed has none). */
export const spBoxes = (p: Pick<SpProject, 'boxes'>): SpStageBox[] => p.boxes ?? [];
export const spBox = (p: Pick<SpProject, 'boxes'>, id: SpId | null | undefined): SpStageBox | undefined => (id ? spBoxes(p).find((b) => b.id === id) : undefined);
/** A box's name, never empty. */
export const spBoxName = (b: Pick<SpStageBox, 'name'>): string => b.name.trim() || 'Stage box';
/** "SB2 · 7": where an input plugs in, in words ('' when nowhere). */
export function spBoxPatchWords(p: SpProject, i: Pick<SpInput, 'box'>): string {
  const b = i.box ? spBox(p, i.box.boxId) : undefined;
  return b && i.box ? `${spBoxName(b)} · ${i.box.socket}${spBoxViaWords(p, b.id, i.box.socket)}` : '';
}

/* ── sub-snakes, consoles and returns (2026-11-13, round 2) ─────────────── */

/** The most letters of a box's "Connects to" field. */
export const SP_CONNECTS_MAX = 40;

/** True when `boxId` plugging into `toId` would close a loop (A feeds B
 *  feeds A), or `toId` is the box itself. */
export function spFeedLoops(p: Pick<SpProject, 'boxes'>, boxId: SpId, toId: SpId): boolean {
  const seen = new Set<SpId>();
  let at: SpId | null = toId;
  while (at) {
    if (at === boxId || seen.has(at)) return true;
    seen.add(at);
    at = spBox(p, at)?.feed?.boxId ?? null;
  }
  return false;
}

/** The boxes a box may plug into: every other box that does not lead back
 *  to it (so a loop can never be chosen). */
export const spFeedTargets = (p: Pick<SpProject, 'boxes'>, boxId: SpId): SpStageBox[] => spBoxes(p).filter((b) => b.id !== boxId && !spFeedLoops(p, boxId, b.id));

/** Where socket `socket` of a box arrives, box after box, while the box is a
 *  sub-snake: [{ SB1, 11 }]. `past` = the socket is past what its feed
 *  carries (the review asks). */
export function spBoxVia(p: Pick<SpProject, 'boxes'>, boxId: SpId, socket: number): { steps: { box: SpStageBox; socket: number }[]; past: SpStageBox | null } {
  const steps: { box: SpStageBox; socket: number }[] = [];
  const seen = new Set<SpId>([boxId]);
  let b = spBox(p, boxId);
  let s = socket;
  while (b?.feed) {
    const to = spBox(p, b.feed.boxId);
    if (!to || seen.has(to.id)) break;
    const n = b.feed.first + s - 1;
    if (n > b.feed.last) return { steps, past: to };
    steps.push({ box: to, socket: n });
    seen.add(to.id);
    b = to;
    s = n;
  }
  return { steps, past: null };
}

/** " (via SB1 · 11)" for a socket of a sub-snake; '' for any other box. */
export function spBoxViaWords(p: Pick<SpProject, 'boxes'>, boxId: SpId, socket: number): string {
  const v = spBoxVia(p, boxId, socket);
  if (v.past) return ` (past its feed to ${spBoxName(v.past)})`;
  return v.steps.length ? ` (via ${v.steps.map((x) => `${spBoxName(x.box)} · ${x.socket}`).join(', ')})` : '';
}

/** "→ SB1 sockets 9–16", or "→ the console directly". */
export function spBoxFeedWords(p: Pick<SpProject, 'boxes'>, b: SpStageBox): string {
  const to = b.feed ? spBox(p, b.feed.boxId) : undefined;
  if (!b.feed || !to) return '→ the console directly';
  return `→ ${spBoxName(to)} socket${b.feed.first === b.feed.last ? ` ${b.feed.first}` : `s ${b.feed.first}–${b.feed.last}`}`;
}

/** A sub-snake: this box plugs into sockets of another box (`to`), or into
 *  the console directly (null). Without a range it takes as many sockets as
 *  it has, from the first run of the other box that nothing else uses. A
 *  loop is refused: nothing changes. */
export function spSetBoxFeed(p: SpProject, boxId: SpId, to: { boxId: SpId; first?: number; last?: number } | null): SpProject {
  const b = spBox(p, boxId);
  if (!b) return p;
  if (!to) return b.feed ? spEdit(p, (d) => void ((spBox(d, boxId) as SpStageBox).feed = null)) : p;
  const main = spBox(p, to.boxId);
  if (!main || spFeedLoops(p, boxId, main.id) || b.kind === 'digital') return p;
  return spEdit(p, (d) => {
    const me = spBox(d, boxId) as SpStageBox;
    const count = me.feed && me.feed.boxId === main.id ? me.feed.last - me.feed.first + 1 : me.inputs;
    let first = to.first != null && Number.isFinite(to.first) ? wholeIn(to.first, 1, SP_BOX_MAX * 2) : 0;
    if (!first) {
      // the first run of `count` sockets on the main box that nothing uses
      const taken = new Set<number>();
      for (const i of d.inputs) if (i.box?.boxId === main.id) taken.add(i.box.socket);
      for (const o of spBoxes(d)) if (o.id !== boxId && o.feed?.boxId === main.id) for (let s = o.feed.first; s <= o.feed.last; s++) taken.add(s);
      for (let s = 1; s + count - 1 <= main.inputs && !first; s++) {
        let ok = true;
        for (let j = 0; j < count; j++) if (taken.has(s + j)) ok = false;
        if (ok) first = s;
      }
      if (!first) first = Math.min(main.inputs, Math.max(0, ...taken) + 1);
    }
    const last = to.last != null && Number.isFinite(to.last) ? Math.max(first, wholeIn(to.last, 1, SP_BOX_MAX * 2)) : Math.min(Math.max(first, main.inputs), first + count - 1);
    me.feed = { boxId: main.id, first, last };
  });
}

/** Boxes that have returns to give (a number of returns above 0). */
export const spReturnBoxes = (p: Pick<SpProject, 'boxes'>): SpStageBox[] => spBoxes(p).filter((b) => (b.returns ?? 0) > 0 && !b.feed);
// (a sub-snake's returns are fed from returns of its main box: a mix is
// given the MAIN box's return; engineer review, round 2)

/** The returns a mix takes: one for mono, two neighbouring ones for stereo. */
export function spReturnRange(m: Pick<SpMix, 'ret' | 'format'>): number[] {
  if (!m.ret) return [];
  return m.format === 'stereo' ? [m.ret.ret, m.ret.ret + 1] : [m.ret.ret];
}

/** A mix that is asked of the house console, so it comes back to the stage
 *  somehow (a mix the band makes on its own rig or personal mixers does not
 *  use the venue's returns), and the band has not said "from the console". */
export const spMixWantsReturn = (m: Pick<SpMix, 'provider' | 'fromConsole'>): boolean => (m.provider === 'house' || m.provider === 'tbc') && !m.fromConsole;

/** "SB1 · return 3", "SB1 · returns 3–4", "From the console", or '' (none). */
export function spReturnWords(p: Pick<SpProject, 'boxes'>, m: Pick<SpMix, 'ret' | 'format' | 'fromConsole'>): string {
  if (m.fromConsole) return 'From the console';
  const b = m.ret ? spBox(p, m.ret.boxId) : undefined;
  if (!b || !m.ret) return '';
  const r = spReturnRange(m);
  return `${spBoxName(b)} · ${r.length === 2 ? `returns ${r[0]}–${r[1]}` : `return ${r[0]}`}`;
}

/** Give a mix a return by hand (AUTO-ASSIGN RETURNS never moves it), or take
 *  it off (null). Two mixes on one return are allowed while editing, and the
 *  review asks about them. */
export const spAssignReturn = (p: SpProject, mixId: SpId, to: { boxId: SpId; ret: number } | null): SpProject =>
  spEdit(p, (d) => {
    const m = d.mixes.find((x) => x.id === mixId);
    if (!m) return;
    if (!to || !spBoxes(d).some((b) => b.id === to.boxId) || !Number.isFinite(to.ret)) {
      m.ret = null;
      return;
    }
    m.ret = { boxId: to.boxId, ret: wholeIn(to.ret, 1, SP_BOX_MAX * 2), byHand: true };
    m.fromConsole = false;
  });

/** "This mix comes from the console itself, not a stage box return". */
export const spSetFromConsole = (p: SpProject, mixId: SpId, on: boolean): SpProject =>
  spEdit(p, (d) => {
    const m = d.mixes.find((x) => x.id === mixId);
    if (!m) return;
    m.fromConsole = on;
    if (on) m.ret = null;
  });

/**
 * AUTO-ASSIGN RETURNS: give every mix that is asked of the house console,
 * and has no return, the lowest free return (two neighbouring ones for a
 * stereo mix) on the box NEAREST to where its devices stand. A wireless
 * in-ear mix goes to its TRANSMITTER, not to the performer: the box nearest
 * a drawn transmitter (or rack); with neither drawn it is left for the band
 * (`iem`), as the transmitter usually sits at the monitor console or a rack
 * at the side. It never moves a return chosen by hand, and skips a mix "from
 * the console". One edit: UNDO puts every return back. `left` = mixes still
 * with no return (the boxes have too few).
 */
export function spAutoAssignReturns(p: SpProject): { p: SpProject; placed: number; left: number; iem: number } {
  let placed = 0;
  let left = 0;
  let iem = 0;
  const q = spEdit(p, (d) => {
    // a sub-snake's returns reach it through its main box: AUTO-ASSIGN uses
    // the boxes that connect to the console (a sub-snake's return can still
    // be chosen by hand)
    const boxes = spReturnBoxes(d);
    if (!boxes.length) return;
    for (const m of d.mixes) if (m.ret && !m.ret.byHand) m.ret = null;
    const used = new Map<SpId, Set<number>>(spBoxes(d).map((b) => [b.id, new Set<number>()]));
    for (const m of d.mixes) for (const r of spReturnRange(m)) if (m.ret) used.get(m.ret.boxId)?.add(r);
    const kx = d.stage.width && d.stage.depth ? d.stage.width : spStageAspect(d);
    const ky = d.stage.width && d.stage.depth ? d.stage.depth : 1;
    const drawnOf = (pred: (dev: SpDevice) => boolean) => d.objects.filter((o) => o.deviceId && pred(d.devices.find((x) => x.id === o.deviceId) as SpDevice));
    const mean = (os: SpObject[]) => (os.length ? { x: os.reduce((n, o) => n + o.x, 0) / os.length, y: os.reduce((n, o) => n + o.y, 0) / os.length } : null);
    const racks = d.objects.filter((o) => o.kind === 'rack');
    const where = (m: SpMix): { x: number; y: number } | null | 'iem' => {
      if (m.delivery === 'wireless-iem') {
        const tx = drawnOf((dev) => !!dev && dev.mixId === m.id && dev.type === 'iem-tx');
        if (tx.length) return mean(tx);
        if (racks.length) return { x: racks[0].x, y: racks[0].y };
        return 'iem';
      }
      return mean(drawnOf((dev) => !!dev && dev.mixId === m.id));
    };
    const free = (b: SpStageBox, n: number): number | null => {
      const u = used.get(b.id) as Set<number>;
      // a stereo pair starts on an odd return (1–2, 3–4), as consoles link
      // their outputs; only when none is left, any two side by side
      for (const odd of n === 2 ? [true, false] : [false]) {
        for (let s = 1; s + n - 1 <= (b.returns ?? 0); s++) {
          if (odd && s % 2 === 0) continue;
          let ok = true;
          for (let j = 0; j < n; j++) if (u.has(s + j)) ok = false;
          if (ok) return s;
        }
      }
      return null;
    };
    for (const m of d.mixes) {
      if (m.ret || !spMixWantsReturn(m)) continue;
      const at = where(m);
      if (at === 'iem') {
        iem += 1;
        continue;
      }
      const ranked = boxes
        .map((b, k) => {
          const o = spBoxObject(d, b.id);
          return { b, k, far: at && o ? Math.hypot((at.x - o.x) * kx, (at.y - o.y) * ky) : Number.POSITIVE_INFINITY };
        })
        .sort((x, y) => x.far - y.far || x.k - y.k);
      const n = m.format === 'stereo' ? 2 : 1;
      const pick = ranked.find((x) => free(x.b, n) != null);
      if (!pick) {
        left += 1;
        continue;
      }
      const s = free(pick.b, n) as number;
      m.ret = { boxId: pick.b.id, ret: s, byHand: false };
      for (let j = 0; j < n; j++) (used.get(pick.b.id) as Set<number>).add(s + j);
      placed += 1;
    }
  });
  return { p: q, placed, left, iem };
}
/** The drawing of a box on the stage, if it has one. */
export const spBoxObject = (p: SpProject, boxId: SpId): SpObject | undefined => p.objects.find((o) => o.boxId === boxId);

const wholeIn = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, Math.round(n)));

/** The next free "SB" number. */
function nextBoxName(p: SpProject): string {
  let n = 1;
  while (spBoxes(p).some((b) => b.name.trim().toUpperCase() === `SB${n}`)) n += 1;
  return `SB${n}`;
}

/** Where a new box's drawing goes: the FIRST box of a stage with wings in a
 *  wing (the main box or split usually lives at monitor world, at the side);
 *  every other box on the stage along the back and the sides, by the
 *  backline, where a sub-snake goes; the first place no other box stands at.
 *  It is a starting place: the box editor says to move it where it really is. */
function newBoxSpot(p: SpProject): { x: number; y: number } {
  const w = spWingFrac(p.stage).w;
  // (wings on a rectangle or a thrust: spHasWings, 2026-11-13 R2)
  const firstInWing = spHasWings(p.stage) && !p.objects.some((o) => o.kind === 'stage-box');
  const spots = firstInWing
    ? [{ x: 1 + w / 2, y: 0.15 }]
    : spIsCircle(p.stage)
        ? [{ x: 0.5, y: 0.1 }, { x: 0.12, y: 0.5 }, { x: 0.88, y: 0.5 }, { x: 0.5, y: 0.9 }]
        : [{ x: 0.5, y: 0.06 }, { x: 0.08, y: 0.08 }, { x: 0.92, y: 0.08 }, { x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }];
  const taken = p.objects.filter((o) => o.kind === 'stage-box');
  return spots.find((s) => !taken.some((o) => Math.hypot(o.x - s.x, o.y - s.y) < 0.06)) ?? spots[0];
}

/** Add a stage box: SB1, SB2… (or a name), 16 input sockets unless told,
 *  and its drawing on the stage (`place: false` = no drawing; a drawing that
 *  is already there is linked with spLinkBoxObject). */
export function spAddBox(p: SpProject, f: Partial<Omit<SpStageBox, 'id'>> & { place?: boolean; at?: { x: number; y: number } } = {}): { p: SpProject; id: SpId; objectId: SpId } {
  let id = '';
  let objectId = '';
  const q = spEdit(p, (d) => {
    if (!d.boxes) d.boxes = [];
    id = newId(d, 'sb');
    const name = f.name?.trim() || nextBoxName(d);
    d.boxes.push({
      id,
      name,
      inputs: wholeIn(f.inputs ?? 16, 1, SP_BOX_MAX),
      returns: f.returns == null ? null : wholeIn(f.returns, 0, SP_BOX_MAX),
      kind: f.kind ?? 'unknown',
      supplier: f.supplier ?? 'tbc',
      note: f.note ?? '',
      feed: null,
      connectsTo: (f.connectsTo ?? '').slice(0, SP_CONNECTS_MAX),
      connectsTbc: f.connectsTbc === true,
    });
    if (f.place !== false) objectId = pushObject(d, 'stage-box', f.at ?? newBoxSpot(d), { boxId: id, label: name });
  });
  return { p: q, id, objectId };
}

export const spUpdateBox = (p: SpProject, id: SpId, patch: Partial<Omit<SpStageBox, 'id' | 'feed'>>): SpProject =>
  spEdit(p, (d) => {
    const b = spBoxes(d).find((x) => x.id === id);
    if (!b) return;
    // (the feed has its own edit, spSetBoxFeed, which refuses a loop)
    const feed = b.feed;
    Object.assign(b, patch);
    b.feed = feed;
    b.inputs = wholeIn(Number.isFinite(b.inputs) ? b.inputs : 16, 1, SP_BOX_MAX);
    if (b.returns != null) b.returns = Number.isFinite(b.returns) ? wholeIn(b.returns, 0, SP_BOX_MAX) : null;
    if (typeof b.connectsTo === 'string') b.connectsTo = b.connectsTo.slice(0, SP_CONNECTS_MAX);
    // a console named answers "to be confirmed"
    if (patch.connectsTo?.trim()) b.connectsTbc = false;
    // the drawing prints the box's own name
    if (patch.name != null) for (const o of d.objects) if (o.boxId === id) o.label = spBoxName(b);
  });

/** Remove a box: its drawing leaves the stage with it, and every input that
 *  was plugged into it has no socket (the review then asks). */
export const spRemoveBox = (p: SpProject, id: SpId): SpProject =>
  spEdit(p, (d) => {
    d.boxes = spBoxes(d).filter((b) => b.id !== id);
    d.objects = d.objects.filter((o) => o.boxId !== id);
  });

/** A stage-box drawing stands for this box (null = only a drawing). One box
 *  has one drawing: another drawing of the same box becomes a drawing. */
export const spLinkBoxObject = (p: SpProject, objectId: SpId, boxId: SpId | null): SpProject =>
  spEdit(p, (d) => {
    const o = d.objects.find((x) => x.id === objectId);
    if (!o) return;
    const b = boxId ? spBoxes(d).find((x) => x.id === boxId) : undefined;
    if (b) for (const x of d.objects) if (x.boxId === b.id && x.id !== objectId) x.boxId = null;
    o.boxId = b ? b.id : null;
    if (b) o.label = spBoxName(b);
  });

/** Plug one input into a socket by hand (AUTO-ASSIGN never moves it), or
 *  take it off its box (null). Two inputs on one socket are allowed while
 *  editing, and the review asks about them. */
export const spAssignBox = (p: SpProject, inputId: SpId, to: { boxId: SpId; socket: number } | null): SpProject =>
  spEdit(p, (d) => {
    const i = d.inputs.find((x) => x.id === inputId);
    if (!i) return;
    if (!to || !spBoxes(d).some((b) => b.id === to.boxId) || !Number.isFinite(to.socket)) {
      i.box = null;
      return;
    }
    i.box = { boxId: to.boxId, socket: wholeIn(to.socket, 1, SP_BOX_MAX * 2), byHand: true };
    i.direct = false;
  });

/** "This input goes to the console directly": no stage box socket, and the
 *  review stops asking. */
export const spSetDirect = (p: SpProject, inputId: SpId, on: boolean): SpProject =>
  spEdit(p, (d) => {
    const i = d.inputs.find((x) => x.id === inputId);
    if (!i) return;
    i.direct = on;
    if (on) i.box = null;
  });

/** Inputs in channel order: the house list, then what feeds only the band's rig. */
function channelOrder(p: SpProject): SpInput[] {
  const seen = new Set<SpId>();
  const out: SpInput[] = [];
  for (const pid of ['house', 'band'] as const) {
    for (const id of spPatch(p, pid)?.order ?? []) {
      const i = p.inputs.find((x) => x.id === id);
      if (i && !seen.has(id)) {
        seen.add(id);
        out.push(i);
      }
    }
  }
  for (const i of p.inputs) if (!seen.has(i.id)) out.push(i);
  return out;
}

/**
 * AUTO-ASSIGN: give every input with no socket the lowest free socket, in
 * CHANNEL ORDER, on the box NEAREST to where its source stands on the stage
 * (a box with no drawing, and an input with no place, come last: then the
 * boxes in their list order). A stereo pair takes two neighboring sockets on
 * one box, L first, when one box has them.
 *
 * It NEVER moves a socket the band chose by hand, and never plugs in an
 * input the band said goes to the console directly. Sockets it chose before
 * are chosen again (so moving a box and pressing it again re-balances). One
 * edit: UNDO puts every socket back. `placed` = inputs it plugged in; `left`
 * = inputs still with no socket (every box is full); `wireless` = wireless
 * inputs it left for the band because no receiver rack is drawn (expert
 * review 2026-11-13: a receiver plugs in at its rack, not at the singer).
 * Where two boxes are about as near, a section stays on the box that already
 * holds it.
 */
export function spAutoAssignBoxes(p: SpProject): { p: SpProject; placed: number; left: number; wireless: number } {
  let placed = 0;
  let left = 0;
  let wireless = 0;
  const q = spEdit(p, (d) => {
    const boxes = spBoxes(d);
    if (!boxes.length) return;
    for (const i of d.inputs) if (i.box && !i.box.byHand) i.box = null;
    const used = new Map<SpId, Set<number>>(boxes.map((b) => [b.id, new Set<number>()]));
    for (const i of d.inputs) if (i.box) used.get(i.box.boxId)?.add(i.box.socket);
    // (round 2) the sockets a sub-snake plugs into are taken: never offered
    for (const b of boxes) if (b.feed) for (let s = b.feed.first; s <= b.feed.last; s++) used.get(b.feed.boxId)?.add(s);
    // distances as the stage really is: meters when the size is known, else
    // the drawing's own shape
    const kx = d.stage.width && d.stage.depth ? d.stage.width : spStageAspect(d);
    const ky = d.stage.width && d.stage.depth ? d.stage.depth : 1;
    const at = (o: SpObject | undefined) => (o ? { x: o.x, y: o.y } : null);
    const boxAt = new Map(boxes.map((b) => [b.id, at(spBoxObject(d, b.id))] as const));
    const catOf = (i: SpInput) => d.sources.find((s) => s.id === i.sourceId)?.category;
    /** How much a box already holds of this input's section: its own source
     *  counts most, then its category (drums, horns, vocals…). */
    const kin = (b: SpStageBox, i: SpInput): number =>
      d.inputs.reduce((n, x) => (x.id === i.id || x.box?.boxId !== b.id ? n : n + (x.sourceId === i.sourceId ? 10 : catOf(x) === catOf(i) ? 1 : 0)), 0);
    // The nearest box; but where two boxes are about as near (within 20 %), the
    // one that already holds this section, so a section stays on one box
    // (simpler line check, labels and sub-snake runs)
    const ranked = (from: { x: number; y: number } | null, i: SpInput): SpStageBox[] => {
      const list = boxes
        .map((b, k) => {
          const bp = boxAt.get(b.id);
          return { b, k, far: from && bp ? Math.hypot((from.x - bp.x) * kx, (from.y - bp.y) * ky) : Number.POSITIVE_INFINITY };
        })
        .sort((m, n) => m.far - n.far || m.k - n.k);
      const best = list[0]?.far ?? Number.POSITIVE_INFINITY;
      const near = Number.isFinite(best) ? list.filter((x) => x.far <= best * 1.2 + 1e-9) : [];
      near.sort((m, n) => kin(n.b, i) - kin(m.b, i) || m.far - n.far || m.k - n.k);
      return [...near, ...list.filter((x) => !near.includes(x))].map((x) => x.b);
    };
    // A wireless receiver plugs in where its RACK is, never where the singer
    // stands: the nearest box to a drawn rack, or (no rack drawn) it is left
    // for the band to choose: a box by the rack, or console direct
    const racks = d.objects.filter((o) => o.kind === 'rack');
    const whereOf = (i: SpInput, partner: SpInput | undefined): { x: number; y: number } | null => {
      const own = at(spObjectOfInput(d, i.id)) ?? (partner ? at(spObjectOfInput(d, partner.id)) : null);
      if (i.capture !== 'wireless') return own;
      if (!racks.length) return null;
      const from = own ?? { x: 0.5, y: 0.5 };
      return at(racks.reduce((m, o) => (Math.hypot(o.x - from.x, o.y - from.y) < Math.hypot(m.x - from.x, m.y - from.y) ? o : m)));
    };
    const freeRun = (b: SpStageBox, n: number): number | null => {
      const u = used.get(b.id) as Set<number>;
      // (round 2) a sub-snake only has the sockets its cable carries
      const top = b.feed ? Math.min(b.inputs, b.feed.last - b.feed.first + 1) : b.inputs;
      for (let s = 1; s + n - 1 <= top; s++) {
        let ok = true;
        for (let j = 0; j < n; j++) if (u.has(s + j)) ok = false;
        if (ok) return s;
      }
      return null;
    };
    const plug = (i: SpInput, b: SpStageBox, s: number) => {
      const at: SpBoxPatch = { boxId: b.id, socket: s, byHand: false };
      i.box = at;
      (used.get(b.id) as Set<number>).add(s);
      placed += 1;
    };
    const done = new Set<SpId>();
    for (const i of channelOrder(d)) {
      if (done.has(i.id)) continue;
      done.add(i.id);
      if (i.box || i.direct) continue;
      const partner = spPartner(d, i);
      const where = whereOf(i, partner);
      if (i.capture === 'wireless' && !where) {
        wireless += 1;
        continue;
      }
      const list = ranked(where, i);
      if (partner && !partner.box && !partner.direct && !done.has(partner.id)) {
        const b = list.find((x) => freeRun(x, 2) != null);
        if (b) {
          const s = freeRun(b, 2) as number;
          const [first, second] = i.side === 'R' ? [partner, i] : [i, partner];
          plug(first, b, s);
          plug(second, b, s + 1);
          done.add(partner.id);
          continue;
        }
      }
      const b = list.find((x) => freeRun(x, 1) != null);
      if (b) plug(i, b, freeRun(b, 1) as number);
    }
    left = d.inputs.filter((i) => !i.box && !i.direct).length - wireless;
  });
  return { p: q, placed, left, wireless };
}

/** A source its performer CARRIES (a voice, a horn, anything on a wireless
 *  pack): the performer's figure can stand for it on the plot. A drum kit,
 *  an amplifier, a keyboard or a percussion setup stands on the floor and
 *  needs its own symbol, or the plot sent to the venue does not show it. */
export function spSourceIsCarried(p: SpProject, sourceId: SpId): boolean {
  const s = spSource(p, sourceId);
  if (!s) return false;
  if (s.category === 'vocals' || s.category === 'horns') return true;
  const inputs = p.inputs.filter((i) => i.sourceId === sourceId);
  return inputs.length > 0 && inputs.every((i) => i.capture === 'wireless');
}

/** The stage object that stands for a source: its own icon, else the icon of
 *  one of its inputs, else (for a source the performer carries) its
 *  performer's figure. */
export function spObjectOfSource(p: SpProject, sourceId: SpId): SpObject | undefined {
  const own = p.objects.find((o) => o.sourceId === sourceId);
  if (own) return own;
  const inputIds = new Set(p.inputs.filter((i) => i.sourceId === sourceId).map((i) => i.id));
  const viaInput = p.objects.find((o) => o.inputId && inputIds.has(o.inputId));
  if (viaInput) return viaInput;
  const s = spSource(p, sourceId);
  return s?.performerId && spSourceIsCarried(p, sourceId) ? p.objects.find((o) => o.performerId === s.performerId && o.kind === 'performer') : undefined;
}
/** The stage object to show for an input ("locate on stage"). */
export function spObjectOfInput(p: SpProject, inputId: SpId): SpObject | undefined {
  const own = p.objects.find((o) => o.inputId === inputId);
  if (own) return own;
  const i = spInput(p, inputId);
  return i ? spObjectOfSource(p, i.sourceId) : undefined;
}
/** Where an input is, in stage words; '' when it is not on the stage yet. */
export function spInputLocation(p: SpProject, inputId: SpId): string {
  const o = spObjectOfInput(p, inputId);
  return o ? spLocationWord(o, p.stage) : '';
}

/* ── whole projects ─────────────────────────────────────────────────────── */

/** A full copy with NEW ids everywhere and every internal link re-pointed.
 *  `kind: 'gig'` makes a venue copy that remembers its master and never
 *  changes it. The copy starts a new document: revision 1, Draft. */
export function spDuplicateProject(p: SpProject, opts: { id: SpId; kind: 'master' | 'gig'; now: number; title?: string }): SpProject {
  const q = clone(p);
  const map = new Map<SpId, SpId>();
  let seq = 0;
  const fresh = (old: SpId): SpId => {
    const prefix = old.replace(/[0-9]+$/, '') || 'x';
    seq += 1;
    const id = `${prefix}${seq}`;
    map.set(old, id);
    return id;
  };
  if (!q.boxes) q.boxes = [];
  for (const list of [q.performers, q.sources, q.inputs, q.diDevices, q.mixes, q.devices, q.extras, q.boxes, q.objects] as { id: SpId }[][]) for (const row of list) row.id = fresh(row.id);
  const to = (id: SpId | null): SpId | null => (id == null ? null : (map.get(id) ?? null));
  const pairMap = new Map<SpId, SpId>();
  const groupMap = new Map<SpId, SpId>();
  const mapped = (m: Map<SpId, SpId>, old: SpId | null, prefix: string): SpId | null => {
    if (old == null) return null;
    if (!m.has(old)) {
      seq += 1;
      m.set(old, `${prefix}${seq}`);
    }
    return m.get(old) as SpId;
  };
  for (const s of q.sources) s.performerId = to(s.performerId);
  for (const i of q.inputs) {
    i.sourceId = to(i.sourceId) ?? '';
    i.diDeviceId = to(i.diDeviceId);
    i.pairId = mapped(pairMap, i.pairId, 'pr');
    // the copy keeps its stage box sockets, on its own copies of the boxes
    const boxId = i.box ? to(i.box.boxId) : null;
    i.box = i.box && boxId ? { ...i.box, boxId } : null;
  }
  const rekey = <T>(rec: Record<SpId, T>): Record<SpId, T> => {
    const out: Record<SpId, T> = {};
    for (const [k, v] of Object.entries(rec)) {
      const nk = map.get(k);
      if (nk) out[nk] = v;
    }
    return out;
  };
  for (const patch of q.patches) {
    patch.order = patch.order.map((id) => map.get(id)).filter(Boolean) as SpId[];
    patch.numbers = rekey(patch.numbers);
    patch.venue = rekey(patch.venue);
  }
  for (const m of q.mixes) {
    m.recipients = m.recipients.map((id) => map.get(id)).filter(Boolean) as SpId[];
    m.needs = rekey(m.needs);
    // (round 2) the copy keeps its returns and sub-snakes, on its own boxes
    const retBox = m.ret ? to(m.ret.boxId) : null;
    m.ret = m.ret && retBox ? { ...m.ret, boxId: retBox } : null;
  }
  for (const b of q.boxes) {
    const feedBox = b.feed ? to(b.feed.boxId) : null;
    b.feed = b.feed && feedBox ? { ...b.feed, boxId: feedBox } : null;
  }
  for (const d of q.devices) {
    d.mixId = to(d.mixId);
    d.performerId = to(d.performerId);
  }
  for (const o of q.objects) {
    o.performerId = to(o.performerId);
    o.sourceId = to(o.sourceId);
    o.inputId = to(o.inputId);
    o.deviceId = to(o.deviceId);
    o.boxId = to(o.boxId ?? null);
    o.groupId = mapped(groupMap, o.groupId, 'gr');
  }
  q.seq = seq;
  q.id = opts.id;
  q.kind = opts.kind;
  q.masterId = opts.kind === 'gig' ? (p.kind === 'gig' ? p.masterId : p.id) : null;
  if (opts.title != null) q.title = opts.title;
  q.revision = 1;
  q.frozenRevision = 0;
  // a copy has no packet of its own yet; it keeps where it started (startedBlank)
  q.packetRevision = 0;
  q.status = 'draft';
  q.venueConfirmed = false;
  q.createdAt = opts.now;
  q.modifiedAt = opts.now;
  scrub(q);
  return q;
}

/** Read a saved project of ANY earlier schema into today's shape, or null if
 *  it is not a project at all. Unknown fields are kept out; missing ones get
 *  their blank value; links are checked. Add a step here for every schema
 *  change, so a band's saved setup survives a release. */
/** A saved sub-snake feed, or null when it is not one (junk falls back to
 *  "connects to the console directly"). */
function feedOf(f: unknown): SpBoxFeed | null {
  const x = f as Partial<SpBoxFeed> | null | undefined;
  if (!x || typeof x !== 'object' || typeof x.boxId !== 'string' || typeof x.first !== 'number' || typeof x.last !== 'number' || !Number.isFinite(x.first) || !Number.isFinite(x.last)) return null;
  const first = wholeIn(x.first, 1, SP_BOX_MAX * 2);
  return { boxId: x.boxId, first, last: Math.max(first, wholeIn(x.last, 1, SP_BOX_MAX * 2)) };
}

export function spMigrate(raw: unknown): SpProject | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<SpProject>;
  if (typeof r.id !== 'string' || typeof r.schema !== 'number' || r.schema < 1 || r.schema > SP_SCHEMA) return null;
  const base = spNewProject({ id: r.id, now: typeof r.createdAt === 'number' ? r.createdAt : 0 });
  const q: SpProject = { ...base, ...clone(r), schema: SP_SCHEMA } as SpProject;
  q.contact = { ...base.contact, ...(r.contact ?? {}), show: { ...base.contact.show, ...(r.contact?.show ?? {}) } };
  q.stage = { ...base.stage, ...(r.stage ?? {}) };
  // schema 1 → 2 (2026-11-13): a plot from before stage shapes is a
  // RECTANGLE; a field that is not one of the shape's own values is the default
  const st = q.stage;
  // …and (owner 2026-11-13, "build them all") wings became an option of a
  // rectangle or a thrust: the morning's "wings" shape is a rectangle with
  // wings on, drawn exactly as before. A junk `wings` is off (absent).
  if (st.shape === 'wings') Object.assign(st, { shape: 'rect', wings: true });
  if (typeof st.wings !== 'boolean') delete st.wings;
  if (!['rect', 'thrust', 'round'].includes(st.shape)) st.shape = 'rect';
  const size = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= 1000 ? v : null);
  st.thrustWidth = size(st.thrustWidth);
  st.thrustDepth = size(st.thrustDepth);
  st.wingWidth = size(st.wingWidth);
  if (st.roundForm !== 'square') st.roundForm = 'circle';
  st.roundRef = typeof st.roundRef === 'string' ? st.roundRef.slice(0, SP_ROUND_REF_MAX) : SP_SHAPE_DEFAULTS.roundRef;
  for (const k of ['performers', 'sources', 'inputs', 'diDevices', 'patches', 'mixes', 'devices', 'extras', 'boxes', 'objects'] as const) if (!Array.isArray(q[k])) (q as Record<string, unknown>)[k] = [];
  // …and has no stage boxes: every input has no socket and is not marked direct
  q.boxes = q.boxes
    .filter((b) => b && typeof b.id === 'string')
    .map((b) => ({
      id: b.id,
      name: typeof b.name === 'string' ? b.name : '',
      inputs: typeof b.inputs === 'number' && Number.isFinite(b.inputs) ? wholeIn(b.inputs, 1, SP_BOX_MAX) : 16,
      returns: typeof b.returns === 'number' && Number.isFinite(b.returns) ? wholeIn(b.returns, 0, SP_BOX_MAX) : null,
      kind: b.kind === 'digital' || b.kind === 'analog' ? b.kind : 'unknown',
      supplier: (['band', 'venue', 'other', 'tbc'] as const).includes(b.supplier) ? b.supplier : 'tbc',
      note: typeof b.note === 'string' ? b.note : '',
      // (round 2, no schema change: a plot saved before these fields has no
      // sub-snake, names no console and has no returns given to mixes)
      feed: feedOf(b.feed),
      connectsTo: typeof b.connectsTo === 'string' ? b.connectsTo.slice(0, SP_CONNECTS_MAX) : '',
      connectsTbc: b.connectsTbc === true,
    }));
  for (const m of q.mixes) {
    if (!m || typeof m !== 'object') continue;
    const r = m.ret as Partial<SpReturnPatch> | null | undefined;
    m.ret = r && typeof r.boxId === 'string' && typeof r.ret === 'number' && Number.isFinite(r.ret) && r.ret >= 1 ? { boxId: r.boxId, ret: Math.round(r.ret), byHand: r.byHand === true } : null;
    if (typeof m.fromConsole !== 'boolean') m.fromConsole = false;
  }
  for (const i of q.inputs) {
    const bx = i.box as Partial<SpBoxPatch> | null | undefined;
    i.box = bx && typeof bx.boxId === 'string' && typeof bx.socket === 'number' && Number.isFinite(bx.socket) && bx.socket >= 1 ? { boxId: bx.boxId, socket: Math.round(bx.socket), byHand: bx.byHand === true } : null;
    if (typeof i.direct !== 'boolean') i.direct = false;
  }
  for (const o of q.objects) if (typeof o.boxId !== 'string') o.boxId = null;
  q.patches = q.patches.filter((x) => x && (x.id === 'house' || x.id === 'band')).map((x) => ({ ...emptyPatch(x.id), ...x }));
  if (typeof q.seq !== 'number') q.seq = 10000;
  // R2-SP1-01 / R2-SP1-04 (2026-11-13): a plot saved before these fields
  // existed has made no packet that can be proven, and did not certainly
  // start from a blank stage.
  // A damaged row never earns anything: the revision is a whole number from
  // 1, the frozen one is between 0 and it, and the packet one between 0 and
  // the frozen one (a packet always freezes its revision). Anything else is
  // brought back to the safe value: nothing exported (checker R2, P1).
  // (an unreadable revision says nothing about what was shared or packed)
  const revisionRead = Number.isInteger(q.revision) && q.revision >= 1;
  if (!revisionRead) q.revision = 1;
  if (!revisionRead || !Number.isInteger(q.frozenRevision) || q.frozenRevision < 0) q.frozenRevision = 0;
  q.frozenRevision = Math.min(q.frozenRevision, q.revision);
  q.packetRevision = Number.isInteger(q.packetRevision) ? Math.min(Math.max(0, q.packetRevision), q.frozenRevision) : 0;
  if (typeof q.startedBlank !== 'boolean') q.startedBlank = false;
  for (const i of q.inputs) if (typeof i.cueAudienceOk !== 'boolean') i.cueAudienceOk = false;
  for (const o of q.objects) {
    if (typeof o.visualOnly !== 'boolean') o.visualOnly = false;
    if (typeof o.offstageOk !== 'boolean') o.offstageOk = false;
    // round 2 (no schema change): a choir saved before it had a size is the
    // choir it always was, 11 singers in 3 rows; a damaged size is read the
    // same way. Only a choir keeps the field.
    if (o.kind === 'choir') o.choir = o.choir ? spChoirClean(o.choir) : { ...SP_CHOIR_LEGACY };
    else if ('choir' in o) delete o.choir;
  }
  scrub(q);
  return q;
}

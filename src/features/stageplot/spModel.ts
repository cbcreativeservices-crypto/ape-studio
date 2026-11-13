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
import {
  SP_SCHEMA,
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
    status: 'draft',
    venueConfirmed: false,
    modifiedAt: opts.now,
    createdAt: opts.now,
    stage: { width: null, depth: null, unit: 'ft', dims: 'estimated', grid: true, snap: true },
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
    objects: [],
    seq: 0,
    startedFrom: opts.startedFrom ?? '',
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
    if (!has(p.performers, o.performerId) || !has(p.sources, o.sourceId) || !has(p.inputs, o.inputId) || !has(p.devices, o.deviceId)) out.push(`stage object ${o.label || o.kind}: something it points at is missing`);
  }
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

/** A stereo pair lost one side: make the request mono, in the open. */
export const spPairToMono = (p: SpProject, remainingId: SpId): SpProject =>
  spEdit(p, (d) => {
    const x = d.inputs.find((y) => y.id === remainingId);
    if (!x) return;
    x.side = null;
    x.pairId = null;
    x.label = stripSide(x.label);
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
    d.inputs.push({ ...clone(x), id, side, label: `${stripSide(x.label)} ${side}` });
    for (const m of d.mixes) if (m.needs[x.id] !== undefined) m.needs[id] = m.needs[x.id];
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
    keep.side = null;
    keep.pairId = null;
    keep.label = stripSide(keep.label);
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
 *  channel numbers the band keeps free. */
function renumber(patch: SpPatch, keepReserved: boolean): void {
  let n = 0;
  for (const id of patch.order) {
    n += 1;
    while (keepReserved && patch.reserved.includes(n)) n += 1;
    patch.numbers[id] = n;
  }
}

export const spRenumber = (p: SpProject, patchId: SpPatchId, opts: { keepReserved: boolean }): SpProject =>
  spEdit(p, (d) => {
    const patch = spPatch(d, patchId);
    if (patch) renumber(patch, opts.keepReserved);
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
    if (opts.renumber) renumber(patch, opts.keepReserved ?? true);
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
    renumber(patch, opts.keepReserved);
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
export const spStageAspect = (p: SpProject): number => (p.stage.width && p.stage.depth ? Math.max(0.6, Math.min(4, p.stage.width / p.stage.depth)) : SP_DEFAULT_ASPECT);
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

export function spAddObject(p: SpProject, kind: SpObjectKind, at: { x: number; y: number }, link: Partial<Pick<SpObject, 'performerId' | 'sourceId' | 'inputId' | 'deviceId' | 'label' | 'rot' | 'w' | 'h'>> = {}): { p: SpProject; id: SpId } {
  let id = '';
  const q = spEdit(p, (d) => {
    id = newId(d, 'ob');
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
      groupId: null,
      offstageOk: false,
      visualOnly: false,
      note: '',
    });
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
    // an object can be dragged a little way off the stage (wings, front of
    // house), never out of reach
    const cx = Math.max(-0.25, Math.min(1.25, tx));
    const cy = Math.max(-0.25, Math.min(1.25, ty));
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
    for (const m of members) {
      const nid = newId(d, 'ob');
      ids.push(nid);
      d.objects.push({ ...clone(m), id: nid, x: m.x + 0.06, y: m.y + 0.06, performerId: null, sourceId: null, inputId: null, deviceId: null, groupId, label: m.label });
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

export const spOnStage = (o: { x: number; y: number }): boolean => o.x >= 0 && o.x <= 1 && o.y >= 0 && o.y <= 1;

/** Where a point is, in stage words. Stage right is the viewer's LEFT: the
 *  words are the performer's, facing the audience. */
export function spLocationWord(at: { x: number; y: number }): string {
  if (!spOnStage(at)) return 'Off the stage';
  const row = at.y < 1 / 3 ? 'up' : at.y < 2 / 3 ? 'mid' : 'down';
  const col = at.x < 1 / 3 ? 'right' : at.x < 2 / 3 ? 'center' : 'left';
  // "upstage right", "stage left", "center stage", "downstage center"
  if (row === 'mid') return col === 'center' ? 'Center stage' : `Stage ${col}`;
  return `${row === 'up' ? 'Upstage' : 'Downstage'} ${col}`;
}

/** The stage object that stands for a source: its own icon, else the icon of
 *  one of its inputs, else its performer's figure. */
export function spObjectOfSource(p: SpProject, sourceId: SpId): SpObject | undefined {
  const own = p.objects.find((o) => o.sourceId === sourceId);
  if (own) return own;
  const inputIds = new Set(p.inputs.filter((i) => i.sourceId === sourceId).map((i) => i.id));
  const viaInput = p.objects.find((o) => o.inputId && inputIds.has(o.inputId));
  if (viaInput) return viaInput;
  const s = spSource(p, sourceId);
  return s?.performerId ? p.objects.find((o) => o.performerId === s.performerId && o.kind === 'performer') : undefined;
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
  return o ? spLocationWord(o) : '';
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
  for (const list of [q.performers, q.sources, q.inputs, q.diDevices, q.mixes, q.devices, q.extras, q.objects] as { id: SpId }[][]) for (const row of list) row.id = fresh(row.id);
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
    o.groupId = mapped(groupMap, o.groupId, 'gr');
  }
  q.seq = seq;
  q.id = opts.id;
  q.kind = opts.kind;
  q.masterId = opts.kind === 'gig' ? (p.kind === 'gig' ? p.masterId : p.id) : null;
  if (opts.title != null) q.title = opts.title;
  q.revision = 1;
  q.frozenRevision = 0;
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
export function spMigrate(raw: unknown): SpProject | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<SpProject>;
  if (typeof r.id !== 'string' || typeof r.schema !== 'number' || r.schema < 1 || r.schema > SP_SCHEMA) return null;
  const base = spNewProject({ id: r.id, now: typeof r.createdAt === 'number' ? r.createdAt : 0 });
  const q: SpProject = { ...base, ...clone(r), schema: SP_SCHEMA } as SpProject;
  q.contact = { ...base.contact, ...(r.contact ?? {}), show: { ...base.contact.show, ...(r.contact?.show ?? {}) } };
  q.stage = { ...base.stage, ...(r.stage ?? {}) };
  for (const k of ['performers', 'sources', 'inputs', 'diDevices', 'patches', 'mixes', 'devices', 'extras', 'objects'] as const) if (!Array.isArray(q[k])) (q as Record<string, unknown>)[k] = [];
  q.patches = q.patches.filter((x) => x && (x.id === 'house' || x.id === 'band')).map((x) => ({ ...emptyPatch(x.id), ...x }));
  if (typeof q.seq !== 'number') q.seq = 10000;
  for (const i of q.inputs) if (typeof i.cueAudienceOk !== 'boolean') i.cueAudienceOk = false;
  for (const o of q.objects) {
    if (typeof o.visualOnly !== 'boolean') o.visualOnly = false;
    if (typeof o.offstageOk !== 'boolean') o.offstageOk = false;
  }
  scrub(q);
  return q;
}

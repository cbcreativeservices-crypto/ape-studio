/**
 * stageplot/stage/stageLinks — what a stage object IS in the project, read
 * from the one model: its name, its channel numbers and mix codes, what it
 * can be linked to, and the few composed edits the Stage area makes (each a
 * pure project-in, project-out step built from spModel's own edits, so one
 * tap is one undo step).
 *
 * The rule this file keeps (handoff §3): AN ICON IS NOT AN INPUT. Placing an
 * instrument, a microphone, a DI or a monitor never adds a mixer input or a
 * monitor device by itself. The palette OFFERS the links: something that is
 * already in the lists, a package whose rows are shown first, or "only a
 * drawing". Only `stageAddWithPackage` adds inputs, and only with the rows
 * the user was shown and kept.
 *
 * Pure: no React, no native modules.
 */
import { SP_DEVICE_WORD, SP_PACKAGES, spPaletteItem, type SpPackage } from '../../../../features/stageplot/spCatalog.ts';
import { spBadge, spMixesOf, spPatchRows } from '../../../../features/stageplot/spDerive.ts';
import {
  spAddObject,
  spAddPackage,
  spAddPerformer,
  spDevice,
  spGridStep,
  spInput,
  spLocationWord,
  spMix,
  spMoveObject,
  spObject,
  spObjectOfInput,
  spObjectOfSource,
  spOnStage,
  spPerformer,
  spSource,
  spUpdateObject,
} from '../../../../features/stageplot/spModel.ts';
import type { SpCategory, SpDeviceType, SpId, SpObject, SpObjectKind, SpProject } from '../../../../features/stageplot/spTypes.ts';
import { spIsSized, spObjectBoxM, spPlotKey, spStageMeters, spSymbol, type SpKeyEntry } from '../../../../features/stageplot/spSymbols.ts';
import { spPackagePreview, spUniqueLabel } from '../inputs/inputsLogic.ts';
import { spmAddDevice } from '../monitors/monitorPlan.ts';
import { stageNudgeStep, type Pt } from './stageGeom.ts';

/** The editor's selection, as the Stage area reads it (the same shape as the
 *  shell's `SpSelection`; repeated here so this file stays pure). */
export type StageSelection = { kind: 'object' | 'input' | 'source' | 'performer' | 'mix' | 'device' | 'di' | 'extra'; id: string } | null;

/* ── names and numbers ──────────────────────────────────────────────────── */

/** The kind of thing, in words ("Drum kit"): the palette's name for it. */
export const stageKindName = (kind: SpObjectKind): string => spPaletteItem(kind).name;

/** What an object ON THE STAGE is called in the list and the inspector: the
 *  name the key gives its symbol. A vocal microphone and any other microphone
 *  on a stand are one symbol, so both are "Microphone on a stand" (the
 *  palette keeps "Vocal microphone" as a thing to add). */
export const stageObjectKindName = (kind: SpObjectKind): string => (kind === 'vocal-mic' ? spPaletteItem('mic-stand').name : spPaletteItem(kind).name);

/** "Sam (downstage center, facing the audience)" style words for where an
 *  object is: its place in stage words, in lower case. */
export const stageWhere = (o: { x: number; y: number }): string => {
  const w = spLocationWord(o);
  return w.charAt(0).toLowerCase() + w.slice(1);
};

/** The name printed beside an object: a performer's own name, else the
 *  object's label, else '' (a bare chair or stand has no name to print). */
export function stageName(p: SpProject, o: SpObject): string {
  if (o.kind === 'performer' && o.performerId) {
    const who = spPerformer(p, o.performerId);
    if (who?.name.trim()) return who.name.trim();
  }
  return o.label.trim();
}

/** A name for lists and for a screen reader: never empty. */
export function stageListName(p: SpProject, o: SpObject): string {
  return stageName(p, o) || stageKindName(o.kind);
}

/** ["1","2","3","5","B2"] → ["1–3","5","B2"]: a run of whole numbers becomes
 *  one range ("9–10" for a stereo pair); anything else is kept as it is. */
export function stageCompressBadges(badges: readonly string[]): string[] {
  const out: string[] = [];
  let run: number[] = [];
  const flush = () => {
    if (!run.length) return;
    out.push(run.length === 1 ? String(run[0]) : `${run[0]}–${run[run.length - 1]}`);
    run = [];
  };
  for (const b of badges) {
    const n = /^\d+$/.test(b) ? Number(b) : null;
    if (n != null && (run.length === 0 || n === run[run.length - 1] + 1)) run.push(n);
    else {
      flush();
      if (n != null) run.push(n);
      else out.push(b);
    }
  }
  flush();
  return out;
}

/** The channel numbers behind an object, in patch order: its own input, or
 *  every input of its source. */
export function stageInputBadges(p: SpProject, o: SpObject): string[] {
  if (o.inputId) return [spBadge(p, o.inputId)];
  if (!o.sourceId) return [];
  const ids: SpId[] = [];
  for (const pid of ['house', 'band'] as const) for (const r of spPatchRows(p, pid)) if (r.input.sourceId === o.sourceId && !ids.includes(r.input.id)) ids.push(r.input.id);
  return stageCompressBadges(ids.map((id) => spBadge(p, id)));
}

/** The monitor mix codes behind an object: a device's mix, or every mix a
 *  performer is on. */
export function stageMixBadges(p: SpProject, o: SpObject): string[] {
  if (o.deviceId) {
    const m = spMix(p, spDevice(p, o.deviceId)?.mixId ?? null);
    return m ? [m.code] : [];
  }
  if (o.kind === 'performer' && o.performerId) return spMixesOf(p, o.performerId).map((m) => m.code);
  return [];
}

/** Everything printed in small boxes beside an object. An object off the
 *  stage says so in words (a flag is never a color alone). */
export function stageBadges(p: SpProject, o: SpObject, at: Pt = o): string[] {
  const out = [...stageInputBadges(p, o), ...stageMixBadges(p, o)];
  if (!spOnStage(at)) out.push('OFF STAGE');
  return out;
}

/** THE KEY's entries as the SCREEN names them: the model's list and names
 *  (the printed packet's), with one difference. On paper a wedge is a
 *  trapezoid, and "wide side" tells which way it faces; on the screen it is
 *  drawn as a real wedge from above, a rectangle with its speaker grille on
 *  one side, so the screen says "speaker side". */
export function stageKeyEntries(objects: readonly { kind: SpObjectKind }[]): SpKeyEntry[] {
  return spPlotKey(objects).map((e) => (e.kind === 'wedge' ? { ...e, name: 'Wedge monitor (speaker side faces the performer)' } : e));
}

/* ── selection ──────────────────────────────────────────────────────────── */

/** The stage object a selection means: itself, or the symbol that stands for
 *  the input, source, performer or device ("Locate on the stage"). */
export function stageSelectedObjectId(p: SpProject, sel: StageSelection): SpId | null {
  if (!sel) return null;
  if (sel.kind === 'object') return spObject(p, sel.id)?.id ?? null;
  if (sel.kind === 'input') return spObjectOfInput(p, sel.id)?.id ?? null;
  if (sel.kind === 'source') return spObjectOfSource(p, sel.id)?.id ?? null;
  if (sel.kind === 'performer') return p.objects.find((o) => o.performerId === sel.id && o.kind === 'performer')?.id ?? p.objects.find((o) => o.performerId === sel.id)?.id ?? null;
  if (sel.kind === 'device') return p.objects.find((o) => o.deviceId === sel.id)?.id ?? null;
  return null;
}

/** What a selection is called ("Lead vocal"), or '' when it is gone. */
export function stageSelectionName(p: SpProject, sel: StageSelection): string {
  if (!sel) return '';
  if (sel.kind === 'object') {
    const o = spObject(p, sel.id);
    return o ? stageListName(p, o) : '';
  }
  if (sel.kind === 'input') return spInput(p, sel.id)?.label ?? '';
  if (sel.kind === 'source') return spSource(p, sel.id)?.label ?? '';
  if (sel.kind === 'performer') return spPerformer(p, sel.id)?.name || (spPerformer(p, sel.id) ? 'This performer' : '');
  if (sel.kind === 'device') {
    const d = spDevice(p, sel.id);
    return d ? d.label || SP_DEVICE_WORD[d.type] : '';
  }
  return '';
}

/* ── what a new object can be linked to ─────────────────────────────────── */

/** What the palette asks before it places a kind of object. */
export type StageLinkMode = 'none' | 'performer' | 'sound' | 'capture' | 'monitor';

const SOUND: readonly SpObjectKind[] = ['drum-kit', 'percussion', 'congas', 'timbales', 'bongo', 'guitar-amp', 'bass-amp', 'keyboard', 'piano', 'acoustic-guitar', 'horn', 'playback'];
const CAPTURE: readonly SpObjectKind[] = ['vocal-mic', 'mic-stand', 'di'];
const MONITOR: readonly SpObjectKind[] = ['wedge', 'iem', 'drum-fill', 'sidefill'];

export function stageLinkMode(kind: SpObjectKind): StageLinkMode {
  if (kind === 'performer') return 'performer';
  if (SOUND.includes(kind)) return 'sound';
  if (CAPTURE.includes(kind)) return 'capture';
  if (MONITOR.includes(kind)) return 'monitor';
  return 'none';
}

/** The source packages offered with each kind of icon. Starting points with
 *  visible assumptions: the rows are shown before anything is added. */
export const STAGE_PACKAGES: Partial<Record<SpObjectKind, readonly string[]>> = {
  'drum-kit': ['drums-small', 'drums-six', 'drums-large'],
  percussion: ['percussion-mic', 'hand-drums'],
  congas: ['hand-drums', 'percussion-mic'],
  timbales: ['hand-drums', 'percussion-mic'],
  bongo: ['percussion-mic', 'hand-drums'],
  'guitar-amp': ['guitar-cab'],
  'bass-amp': ['bass-di', 'bass-di-mic'],
  keyboard: ['keys-mono', 'keys-stereo'],
  // an acoustic piano is miked; a stage piano goes through DI channels
  piano: ['piano-mics', 'keys-stereo', 'keys-mono'],
  'acoustic-guitar': ['acoustic-pickup'],
  horn: ['horn-mic'],
  playback: ['playback-stereo', 'click'],
  'vocal-mic': ['vocal', 'vocal-wireless'],
};

export function stagePackagesFor(kind: SpObjectKind): SpPackage[] {
  return (STAGE_PACKAGES[kind] ?? []).map((id) => SP_PACKAGES.find((x) => x.id === id)).filter((x): x is SpPackage => !!x);
}

export type StageChoice = { id: SpId; label: string; detail: string; placed: boolean; /** Of the symbol's own kind (sources): shown first; the rest are behind SHOW EVERY SOURCE. */ match?: boolean };

/** Performers a new figure can stand for; those not on the stage come first. */
export function stagePerformerChoices(p: SpProject): StageChoice[] {
  return p.performers
    .map((pf) => ({ id: pf.id, label: pf.name || 'Unnamed performer', detail: pf.role, placed: p.objects.some((o) => o.performerId === pf.id && o.kind === 'performer') }))
    .sort((a, b) => Number(a.placed) - Number(b.placed));
}

const CATEGORY_OF: Partial<Record<SpObjectKind, readonly SpCategory[]>> = {
  'drum-kit': ['drums'],
  percussion: ['percussion'],
  congas: ['percussion'],
  timbales: ['percussion'],
  bongo: ['percussion'],
  'guitar-amp': ['guitars'],
  'bass-amp': ['bass'],
  keyboard: ['keys'],
  piano: ['keys'],
  'acoustic-guitar': ['guitars', 'other'],
  horn: ['horns', 'other'],
  playback: ['playback'],
};

const channelWords = (p: SpProject, sourceId: SpId): string => {
  const n = p.inputs.filter((i) => i.sourceId === sourceId).length;
  if (!n) return 'no input';
  return n === 1 ? '1 input' : `${n} inputs`;
};

/** Sources an instrument symbol can stand for. Every source is offered (the
 *  band decides what its symbol means); the likely ones come first: sources
 *  of the symbol's own kind, and among those the ones not on the stage yet. */
export function stageSourceChoices(p: SpProject, kind: SpObjectKind): StageChoice[] {
  const cats = CATEGORY_OF[kind] ?? [];
  return p.sources
    .map((s, i) => {
      const who = spPerformer(p, s.performerId)?.name ?? '';
      const placed = p.objects.some((o) => o.sourceId === s.id);
      return { c: { id: s.id, label: s.label, detail: [who, s.connection === 'none' ? 'no sound system connection' : channelWords(p, s.id)].filter(Boolean).join(' · '), placed, match: cats.includes(s.category) }, rank: (cats.includes(s.category) ? 0 : 2) + (placed ? 1 : 0), i };
    })
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .map((x) => x.c);
}

/** Inputs a microphone or DI icon can stand for: the capture path it draws.
 *  A DI icon is offered DI inputs; a microphone icon, microphone and wireless
 *  inputs (vocals first for a vocal microphone). */
export function stageInputChoices(p: SpProject, kind: SpObjectKind): StageChoice[] {
  const fits = (capture: string): boolean => (kind === 'di' ? capture === 'di' : capture === 'mic' || capture === 'wireless');
  return p.inputs
    .filter((i) => fits(i.capture))
    .map((i, k) => {
      const s = spSource(p, i.sourceId);
      const who = spPerformer(p, s?.performerId ?? null)?.name ?? '';
      const placed = p.objects.some((o) => o.inputId === i.id);
      const vocalFirst = kind === 'vocal-mic' && s?.category !== 'vocals' ? 1 : 0;
      return { c: { id: i.id, label: i.label, detail: [`Channel ${spBadge(p, i.id)}`, who].filter(Boolean).join(' · '), placed }, rank: (placed ? 2 : 0) + vocalFirst, k };
    })
    .sort((a, b) => a.rank - b.rank || a.k - b.k)
    .map((x) => x.c);
}

/** The device types a monitor icon can stand for. */
export function stageDeviceTypesFor(kind: SpObjectKind): SpDeviceType[] {
  if (kind === 'wedge') return ['wedge'];
  if (kind === 'drum-fill') return ['drum-fill'];
  if (kind === 'sidefill') return ['sidefill'];
  if (kind === 'iem') return ['iem-pack', 'iem-tx', 'hp-amp', 'personal-mixer'];
  return [];
}

/** Monitor devices an icon can stand for; those with no icon yet come first. */
export function stageDeviceChoices(p: SpProject, kind: SpObjectKind): StageChoice[] {
  const types = stageDeviceTypesFor(kind);
  return p.devices
    .filter((d) => types.includes(d.type))
    .map((d) => {
      const m = spMix(p, d.mixId);
      return { id: d.id, label: d.label || SP_DEVICE_WORD[d.type], detail: [SP_DEVICE_WORD[d.type], m ? `mix ${m.code}` : d.selfContained ? 'part of the band monitor rig' : 'no mix yet'].join(' · '), placed: p.objects.some((o) => o.deviceId === d.id) };
    })
    .sort((a, b) => Number(a.placed) - Number(b.placed));
}

/* ── things in the lists that are not on the stage ──────────────────────── */

export type StageUnplaced = { kind: 'performer' | 'source' | 'device'; id: SpId; name: string; detail: string };

/** Monitor devices that stand on the stage floor: a plot without them is
 *  missing something the venue must place. (A pack is worn, a transmitter
 *  and a headphone amplifier may be in a rack: those are not asked for.) */
const FLOOR_DEVICES: readonly SpDeviceType[] = ['wedge', 'drum-fill', 'sidefill'];

/** Performers with no figure, sources with inputs and no symbol (unless the
 *  band said the source is off the stage on purpose), and wedges and fills
 *  that are in the monitor plan with no symbol. */
export function stageUnplaced(p: SpProject): StageUnplaced[] {
  const out: StageUnplaced[] = [];
  for (const pf of p.performers) if (!p.objects.some((o) => o.performerId === pf.id)) out.push({ kind: 'performer', id: pf.id, name: pf.name || 'Unnamed performer', detail: pf.role });
  for (const s of p.sources) {
    if (s.offstage || !p.inputs.some((i) => i.sourceId === s.id)) continue;
    if (!spObjectOfSource(p, s.id)) out.push({ kind: 'source', id: s.id, name: s.label, detail: channelWords(p, s.id) });
  }
  for (const d of p.devices) {
    if (!FLOOR_DEVICES.includes(d.type) || p.objects.some((o) => o.deviceId === d.id)) continue;
    const m = spMix(p, d.mixId);
    out.push({ kind: 'device', id: d.id, name: d.label.trim() || SP_DEVICE_WORD[d.type], detail: m ? `${SP_DEVICE_WORD[d.type]}, mix ${m.code}` : SP_DEVICE_WORD[d.type] });
  }
  return out;
}

const KIND_FOR_CATEGORY: Record<SpCategory, SpObjectKind> = { drums: 'drum-kit', percussion: 'percussion', bass: 'bass-amp', guitars: 'guitar-amp', keys: 'keyboard', horns: 'horn', playback: 'playback', other: 'generic', vocals: 'vocal-mic' };
/** Words in a source's own name that say which symbol it is. Checked before
 *  the category, so "Acoustic guitar" is not drawn as an amplifier. */
const KIND_WORDS: readonly (readonly [RegExp, SpObjectKind])[] = [
  [/conga/i, 'congas'],
  [/timbal/i, 'timbales'],
  [/bong[oó]/i, 'bongo'],
  [/piano/i, 'piano'],
  [/acoustic|violin|cello|mandolin|banjo|ukulele|upright/i, 'acoustic-guitar'],
  [/horn|trumpet|trombone|sax|flute|clarinet/i, 'horn'],
  [/click|track|playback|laptop/i, 'playback'],
  [/vocal|vox|coro|singer/i, 'vocal-mic'],
];

/** The symbol a listed source is drawn with when it is placed from the list:
 *  by the words in its name, then by its category. The band can always
 *  remove it and ADD another symbol for the same source. */
export function stageKindForSource(label: string, category: SpCategory): SpObjectKind {
  for (const [re, kind] of KIND_WORDS) if (re.test(label)) return kind;
  return KIND_FOR_CATEGORY[category];
}

const KIND_FOR_DEVICE: Record<SpDeviceType, SpObjectKind> = { wedge: 'wedge', 'iem-tx': 'iem', 'iem-pack': 'iem', 'hp-amp': 'iem', 'drum-fill': 'drum-fill', sidefill: 'sidefill', 'personal-mixer': 'iem', custom: 'generic' };

/* ── where a new object goes ────────────────────────────────────────────── */

/** Where the Stage area drops a new object when the whole stage shows:
 *  downstage center, where a band starts placing its front line. */
export const STAGE_NEW_SPOT: Pt = { x: 0.5, y: 0.7 };

/** A kind's box in METERS as a new object of it would be drawn (a platform
 *  or a labeled box at the size a new one gets), upright as it will stand:
 *  a sidefill is placed a quarter turn round, so its sides are swapped. */
function newBoxM(p: SpProject, kind: SpObjectKind, at: Pt): { w: number; h: number } {
  const st = spStageMeters(p);
  if (spIsSized(kind)) return kind === 'riser' ? { w: 0.3 * st.width, h: 0.25 * st.depth } : { w: 0.12 * st.width, h: 0.1 * st.depth };
  const sym = spSymbol(kind);
  const turned = Math.abs(Math.sin((stageDefaultRot(kind, at) * Math.PI) / 180)) > 0.7;
  return turned ? { w: sym.h, h: sym.w } : { w: sym.w, h: sym.h };
}

/** A free place ON the stage near `at` for a new object of `kind`. A place
 *  is free when the new object's own BOX, with 0.1 m of air round it, touches
 *  no other object's box: a sidefill is not dropped over the congas because
 *  their centers are a little apart (visual review 2, B7). With snap on, the
 *  place is a point of the grid, so the typed position reads as a whole
 *  step. The nearest free place is taken; a platform or a labeled box under
 *  the new object does not count (things stand on a riser). */
export function stageFreeSpot(p: SpProject, at: Pt, kind: SpObjectKind = 'generic'): Pt {
  const snap = p.stage.snap;
  const step = snap ? spGridStep(p) : { x: 0.02, y: 0.02 };
  const st = spStageMeters(p);
  const mine = newBoxM(p, kind, at);
  const air = 0.1;
  // every other object's box, upright (a quarter turn swaps its sides)
  const others = p.objects
    .filter((o) => !spIsSized(o.kind))
    .map((o) => {
      const b = spObjectBoxM(p, o);
      const turned = Math.abs(Math.sin((b.rot * Math.PI) / 180)) > 0.7;
      return { cx: b.cx, cy: b.cy, hw: (turned ? b.h : b.w) / 2, hh: (turned ? b.w : b.h) / 2 };
    });
  const busy = (q: Pt): boolean => {
    const cx = q.x * st.width;
    const cy = q.y * st.depth;
    return others.some((o) => Math.abs(o.cx - cx) < o.hw + mine.w / 2 + air && Math.abs(o.cy - cy) < o.hh + mine.h / 2 + air);
  };
  // the new object stays wholly on the stage where the stage is large enough
  const mx = Math.min(0.45, mine.w / 2 / st.width);
  const my = Math.min(0.45, mine.h / 2 / st.depth);
  const nx = Math.max(1, Math.round(1 / step.x));
  const ny = Math.max(1, Math.round(1 / step.y));
  const tries: { q: Pt; d: number; k: number }[] = [];
  let k = 0;
  for (let j = 0; j <= ny; j++)
    for (let i = 0; i <= nx; i++) {
      const q = { x: i * step.x, y: j * step.y };
      k += 1;
      if (q.x < mx - 1e-9 || q.x > 1 - mx + 1e-9 || q.y < my - 1e-9 || q.y > 1 - my + 1e-9) continue;
      // distances in meters, so "nearest" means the same across and deep
      tries.push({ q, d: Math.hypot((q.x - at.x) * st.width, (q.y - at.y) * st.depth), k });
    }
  tries.sort((m, n) => m.d - n.d || m.k - n.k);
  for (const t of tries) if (!busy(t.q)) return t.q;
  // a full stage: the nearest point all the same (never off the stage)
  return tries[0]?.q ?? { x: Math.max(0.04, Math.min(0.96, at.x)), y: Math.max(0.04, Math.min(0.96, at.y)) };
}

/** The way a NEW object faces (0° = toward the audience). A monitor never
 *  faces the audience: a wedge and a drum fill face upstage, at the
 *  performer; a sidefill faces across the stage, toward its middle. */
export function stageDefaultRot(kind: SpObjectKind, at: Pt): number {
  if (kind === 'wedge' || kind === 'drum-fill') return 180;
  if (kind === 'sidefill') return at.x < 0.5 ? 270 : 90;
  return 0;
}

/* ── composed edits (each is ONE undo step) ─────────────────────────────── */

export type StageAdded = { p: SpProject; id: SpId };

/** A symbol that points at nothing. `visualOnly` records the answer "this is
 *  only a drawing: it needs no input", so the review does not ask again. */
export function stageAddDrawing(p: SpProject, kind: SpObjectKind, at: Pt, opts: { visualOnly?: boolean; label?: string } = {}): StageAdded {
  const r = spAddObject(p, kind, at, { ...(opts.label != null ? { label: opts.label } : {}), rot: stageDefaultRot(kind, at) });
  return opts.visualOnly ? { p: spUpdateObject(r.p, r.id, { visualOnly: true }), id: r.id } : r;
}

/** A symbol that stands for something already in the lists. Nothing is added
 *  to any list. */
export function stageAddLinked(p: SpProject, kind: SpObjectKind, at: Pt, link: { performerId?: SpId; sourceId?: SpId; inputId?: SpId; deviceId?: SpId }): StageAdded {
  let label: string | undefined;
  if (link.performerId) label = spPerformer(p, link.performerId)?.name || undefined;
  else if (link.sourceId) label = spSource(p, link.sourceId)?.label || undefined;
  else if (link.inputId) label = spInput(p, link.inputId)?.label || undefined;
  else if (link.deviceId) label = spDevice(p, link.deviceId)?.label || undefined;
  return spAddObject(p, kind, at, { ...link, ...(label ? { label } : {}), rot: stageDefaultRot(kind, at) });
}

/** A new performer and their figure. */
export function stageAddPerformer(p: SpProject, at: Pt, name: string, role = ''): StageAdded {
  const a = spAddPerformer(p, { name: name.trim(), role: role.trim() });
  return spAddObject(a.p, 'performer', at, { performerId: a.id, label: name.trim() });
}

/** An instrument or microphone symbol WITH a source package: the rows the
 *  user was shown and kept become ordinary inputs, and the symbol points at
 *  them. The names are the ones the Inputs area gives the same package
 *  (spPackagePreview): a second guitar is "Guitar (Rafa)", never a second
 *  "Guitar". `ticked`: which rows are kept (all, when left out). */
export function stageAddWithPackage(p: SpProject, kind: SpObjectKind, at: Pt, pkg: SpPackage, f: { ticked?: readonly boolean[]; performerId?: SpId | null } = {}): StageAdded & { inputIds: SpId[] } {
  const performerId = f.performerId ?? null;
  const view = spPackagePreview(p, pkg, f.ticked ?? pkg.rows.map(() => true), { performerId });
  if (!view.picked.length) return { ...stageAddDrawing(p, kind, at), inputIds: [] };
  const a = spAddPackage(p, pkg, { performerId, sourceLabel: view.sourceLabel, rows: view.picked });
  const who = spPerformer(p, performerId)?.name ?? '';
  const link =
    stageLinkMode(kind) === 'capture' && a.inputIds.length === 1
      ? { inputId: a.inputIds[0], label: view.picked[0].label }
      : { sourceId: a.sourceId, label: spUniqueLabel(p.objects.map((o) => o.label), spPaletteItem(kind).label || view.sourceLabel, who) };
  const r = spAddObject(a.p, kind, at, { ...link, rot: stageDefaultRot(kind, at) });
  return { p: r.p, id: r.id, inputIds: a.inputIds };
}

/** A monitor symbol WITH a new entry in the monitor plan (a device, never an
 *  input and never a mix). `mixId` null = no mix yet, which the review then
 *  asks about. The device is made by the Monitors area's own edit
 *  (spmAddDevice), so it has the same name and the same settings whichever
 *  area it was added from. */
export function stageAddWithDevice(p: SpProject, kind: SpObjectKind, at: Pt, f: { type: SpDeviceType; mixId: SpId | null }): StageAdded {
  const d = spmAddDevice(p, f.type, f.mixId);
  const label = spDevice(d.p, d.id)?.label ?? '';
  return spAddObject(d.p, kind, at, { deviceId: d.id, label, rot: stageDefaultRot(kind, at) });
}

/** Put something that is in the lists onto the stage ("Place on the stage" for
 *  a row with no symbol). Null when the selection cannot be drawn. */
export function stagePlace(p: SpProject, sel: StageSelection, near: Pt): StageAdded | null {
  if (!sel) return null;
  /** a free place near `near` for the kind that will be drawn */
  const add = (kind: SpObjectKind, link: Parameters<typeof stageAddLinked>[3]): StageAdded => stageAddLinked(p, kind, stageFreeSpot(p, near, kind), link);
  if (sel.kind === 'performer') return spPerformer(p, sel.id) ? add('performer', { performerId: sel.id }) : null;
  if (sel.kind === 'source') {
    const s = spSource(p, sel.id);
    return s ? add(stageKindForSource(s.label, s.category), { sourceId: s.id }) : null;
  }
  if (sel.kind === 'input') {
    const i = spInput(p, sel.id);
    if (!i) return null;
    const s = spSource(p, i.sourceId);
    const kind: SpObjectKind = i.capture === 'di' ? 'di' : i.capture === 'mic' || i.capture === 'wireless' ? (s?.category === 'vocals' ? 'vocal-mic' : 'mic-stand') : s ? stageKindForSource(s.label, s.category) : 'generic';
    return add(kind, { inputId: i.id });
  }
  if (sel.kind === 'device') {
    const d = spDevice(p, sel.id);
    return d ? add(KIND_FOR_DEVICE[d.type], { deviceId: d.id }) : null;
  }
  return null;
}

/** One nudge of an object (and its group): a grid step with snap on,
 *  otherwise one hundredth of the stage. dx / dy are −1, 0 or 1. ONLY THE
 *  AXIS THAT IS NUDGED is snapped: a sideways button never changes the depth
 *  of an object that was typed or dragged to a place between grid lines
 *  (visual review 2: STAGE LEFT ▶ moved "68% down" to "67%"). */
export function stageNudge(p: SpProject, id: SpId, dx: number, dy: number): SpProject {
  const o = spObject(p, id);
  if (!o) return p;
  const step = stageNudgeStep(p);
  const along = (v: number, by: number, st: number): number => {
    if (!by) return v;
    return p.stage.snap ? Math.round((v + by * st) / st) * st : v + by * st;
  };
  return spMoveObject(p, id, { x: along(o.x, dx, step.x), y: along(o.y, dy, step.y) }, { snap: false });
}

/** Put an object exactly at a typed place (no snapping: the number typed is
 *  the number kept). Its group moves with it. */
export function stageMoveExact(p: SpProject, id: SpId, to: Partial<Pt>): SpProject {
  const o = spObject(p, id);
  if (!o) return p;
  return spMoveObject(p, id, { x: to.x ?? o.x, y: to.y ?? o.y }, { snap: false });
}

/** Reading order for the list of objects: upstage rows first, each from
 *  stage right to stage left. */
export function stageListOrder(objects: readonly SpObject[]): SpObject[] {
  const row = (o: SpObject): number => Math.round(o.y * 6);
  return objects.map((o, i) => ({ o, i })).sort((a, b) => row(a.o) - row(b.o) || a.o.x - b.o.x || a.i - b.i).map((x) => x.o);
}

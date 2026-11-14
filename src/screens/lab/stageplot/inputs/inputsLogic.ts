/**
 * stageplot/inputs/inputsLogic — everything the Inputs area DECIDES, as pure
 * functions (must-do D60): which rows a package preview shows, how a typed
 * list of reserved channels is read, what one input row says at a glance,
 * how a row moves, and the text of the equipment summary.
 *
 * The screens only draw what these return. Nothing here stores a count:
 * every number is read from the project through spDerive each time.
 *
 *   • A PACKAGE IS SHOWN BEFORE IT IS ADDED. Its rows carry the labels they
 *     will really get, and the two sides of a stereo pair are ticked and
 *     unticked together, so a package can never add half a pair.
 *   • A MOVE KEEPS THE BAND'S NUMBERS IN PLACE. The rows change places and
 *     the channel numbers stay where they were in the list, so a deliberate
 *     gap or a reserved channel survives a move. A pair moves as one.
 *   • NOTHING IS COUNTED TWICE. A DI channel that has a device is listed as
 *     that device, under whoever supplies the device. An alternative is
 *     never added to a quantity.
 *
 * Pure: no React, no native modules. US spelling.
 */
import {
  SP_AUDIENCE_WORD,
  SP_CAPTURE_WORD,
  SP_CATEGORY_ORDER,
  SP_CATEGORY_WORD,
  SP_DEVICE_WORD,
  SP_STAND_WORD,
  SP_SUPPLIER_WORD,
  type SpPackage,
  type SpPackageRow,
} from '../../../../features/stageplot/spCatalog.ts';
import { spInputSupplier, spPatchRows, spSummary, type SpBySupplier, type SpEquipLine, type SpInputTotals, type SpPatchRow } from '../../../../features/stageplot/spDerive.ts';
import { spAssignDi, spBoxName, spBoxPatchWords, spBoxes, spInputLocation, spMonoLabel, spMoveInput, spPairToMono, spPartner, spPatch, spRemoveDiDevice, spSetNumber } from '../../../../features/stageplot/spModel.ts';
import type { SpIssue } from '../../../../features/stageplot/spReview.ts';
import type { SpDeviceType, SpDiDevice, SpExtra, SpId, SpInput, SpPatch, SpPatchId, SpProject, SpStageBox, SpSupplier } from '../../../../features/stageplot/spTypes.ts';

/* ── words ──────────────────────────────────────────────────────────────── */

export const SP_DI_KIND_WORD: Record<SpDiDevice['kind'], string> = { passive: 'Passive', active: 'Active', unknown: 'To be confirmed' };
/** Who brings one thing, in the app's words (the packet says "Supplied by"). */
export const spBringsWord = (s: SpSupplier): string => (s === 'tbc' ? 'Who brings it: to be confirmed' : `${SP_SUPPLIER_WORD[s]} brings it`);
/** "A", "A and B", "A, B and C". */
export const spListWords = (items: readonly string[]): string => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
/** A source that no one performer plays: one name for it, everywhere. */
export const SP_NOBODY = 'Nobody (shared source)';
/** The chips for "Who plays or sings it": the same words and the same order
 *  as the Stage area uses. '' = nobody (a shared source). */
export const spPeopleOptions = (p: SpProject): { value: string; label: string }[] => [{ value: '', label: SP_NOBODY }, ...p.performers.map((x) => ({ value: x.id, label: x.name || 'Unnamed performer' }))];
/** The chips for "It belongs to": a source with its performer, so two
 *  sources with one name can be told apart ("Guitar · Sam", "Guitar · Jo"). */
export const spSourceOptions = (p: SpProject): { value: string; label: string }[] =>
  p.sources.map((s) => {
    const who = p.performers.find((x) => x.id === s.performerId)?.name ?? '';
    return { value: s.id, label: who ? `${s.label} · ${who}` : s.label };
  });
/** A system's name inside a sentence: "the house system list". */
export const spInSentence = (name: string): string => name.charAt(0).toLowerCase() + name.slice(1);
export const SP_EXTRA_WORD: Record<SpExtra['kind'], string> = {
  'stage-box': 'Stage box',
  split: 'Split',
  backline: 'Backline',
  riser: 'Riser',
  power: 'Power location',
  other: 'Other',
};
/** What to write in the note of each kind of listed item. The tool records
 *  the request; it never works out capacity or compatibility. */
export const SP_EXTRA_HINT: Record<SpExtra['kind'], string> = {
  'stage-box': 'Where you would like it, and how many inputs you expect to plug in there.',
  split: 'Who provides the split, where each leg goes, how it connects, and who handles phantom power, if you know. Anything not confirmed stays a question for the venue.',
  backline: 'What the item is and who it is for. Type the model yourself if it matters.',
  riser: 'The size and the height you would like, in your own words.',
  power: 'Where you would like power and what plugs in there. This is a request and a note only: the venue decides what its circuits can carry.',
  other: 'Anything else the venue should know about this item.',
};
export const SP_SUPPLIERS: readonly SpSupplier[] = ['band', 'venue', 'other', 'tbc'];

/* Words a band member may not know, each explained where it is first met. */
export const SP_PHANTOM_HINT =
  'Phantom power is electricity that the mixer sends through the microphone cable. Some microphones and DIs need it. Say what this device needs, if you know. The tool never decides it from the connector or from the word DI. Not required: it works with or without it. Do not apply: phantom power could damage it or cause noise, as with some ribbon microphones and some line outputs. To be confirmed is printed as a question when your band or another provider brings the item. For an item the venue brings, the venue already knows.';
/** When "To be confirmed" becomes a printed question, said the same way wherever it is offered. */
export const SP_TBC_PRINTED = 'To be confirmed is printed as a question when your band or another provider brings the item. For an item the venue brings, the venue already knows.';
export const SP_CUE_HINT = 'A click is a metronome sound for the performers. A cue or talkback is a voice that only the performers hear.';
export const SP_EXTRAS_HINT = 'Stage box: the box on the stage where the cables plug in. Split: equipment that sends each input to two mixers. Backline: the instruments and amplifiers on the stage, such as the drum kit, the amplifiers and the keyboards. Say who brings each.';
/** "2 wireless receiver outputs: radio frequency coordination needed." The tool lists no radio frequencies. */
export const spWirelessNote = (n: number): string => `${n} wireless receiver ${n === 1 ? 'output' : 'outputs'}: radio frequency coordination needed.`;

const plural = (n: number, one: string, many: string = `${one}s`): string => `${n} ${n === 1 ? one : many}`;

/* ── a label nobody else has ────────────────────────────────────────────── */

const SIDE = /\s+(L|R)$/;

/** A label that is not in `taken`. When it is taken, the performer's name is
 *  added, and after that a number. A stereo side stays the LAST word
 *  ("Keys (Nina) L"), so the pair can still be read as left and right. */
export function spUniqueLabel(taken: readonly string[], label: string, who = ''): string {
  const has = (s: string) => taken.some((t) => t.trim().toLowerCase() === s.trim().toLowerCase());
  if (!has(label)) return label;
  const side = SIDE.exec(label)?.[1] ?? '';
  const base = side ? label.replace(SIDE, '') : label;
  const join = (b: string) => (side ? `${b} ${side}` : b);
  const name = who.trim();
  if (name && !has(join(`${base} (${name})`))) return join(`${base} (${name})`);
  for (let n = 2; n < 100; n += 1) if (!has(join(`${base} ${n}`))) return join(`${base} ${n}`);
  return label;
}

/* ── the package preview ────────────────────────────────────────────────── */

export type SpPreviewRow = {
  index: number;
  /** The label this row will really get. */
  label: string;
  side: 'L' | 'R' | null;
  /** The row that is the other side of this stereo pair (its index). */
  pairWith: number | null;
  capture: string;
  equipment: string;
  stand: string;
  /** The connector the row sets, when it sets one ('' = none is assumed). */
  connector: string;
  /** Capture, equipment, stand and connector in one line: everything the
   *  row would set, so nothing is assumed out of sight. */
  how: string;
  /** A click or cue: monitor only, kept out of the audience mix. */
  monitorOnly: boolean;
  ticked: boolean;
};

export type SpPackagePreview = {
  name: string;
  assumes: string;
  /** The source the rows will hang from, with a name nobody else has. */
  sourceLabel: string;
  rows: SpPreviewRow[];
  /** How many rows are ticked. */
  count: number;
  /** "Adds 6 inputs." */
  adds: string;
  /** The rows to hand to spAddPackage (ticked rows, final labels). */
  picked: SpPackageRow[];
};

export const spPackageAllTicked = (pkg: SpPackage): boolean[] => pkg.rows.map(() => true);

/** The other side of a stereo row inside a package: an L is closed by the
 *  next R, exactly as the model pairs them when the package is added. */
export function spPackagePartner(pkg: SpPackage, index: number): number | null {
  const row = pkg.rows[index];
  if (!row?.side) return null;
  if (row.side === 'L') {
    for (let k = index + 1; k < pkg.rows.length; k += 1) {
      if (pkg.rows[k].side === 'R') return k;
      if (pkg.rows[k].side === 'L') return null;
    }
    return null;
  }
  for (let k = index - 1; k >= 0; k -= 1) {
    if (pkg.rows[k].side === 'L') return k;
    if (pkg.rows[k].side === 'R') return null;
  }
  return null;
}

/** Tick or untick one row. Both sides of a stereo pair follow each other. */
export function spPackageToggle(pkg: SpPackage, ticked: readonly boolean[], index: number): boolean[] {
  const out = pkg.rows.map((_, k) => ticked[k] !== false);
  if (index < 0 || index >= out.length) return out;
  out[index] = !out[index];
  const partner = spPackagePartner(pkg, index);
  if (partner != null) out[partner] = out[index];
  return out;
}

/** What adding this package would do, BEFORE it is added. `sourceId` = the
 *  rows join a source that is already in the project. */
export function spPackagePreview(p: SpProject, pkg: SpPackage, ticked: readonly boolean[], opts: { performerId?: SpId | null; sourceId?: SpId | null } = {}): SpPackagePreview {
  const who = opts.performerId ? (p.performers.find((x) => x.id === opts.performerId)?.name ?? '') : '';
  const existing = opts.sourceId ? p.sources.find((s) => s.id === opts.sourceId) : undefined;
  const taken = p.inputs.map((i) => i.label);
  const on = pkg.rows.map((_, k) => {
    if (ticked[k] === false) return false;
    // half a pair is never added: a side counts only with its other side
    const partner = spPackagePartner(pkg, k);
    return partner == null ? true : ticked[partner] !== false;
  });
  const rows: SpPreviewRow[] = [];
  const picked: SpPackageRow[] = [];
  pkg.rows.forEach((row, k) => {
    // a label is settled against the project and the rows already ticked
    const label = spUniqueLabel([...taken, ...picked.map((r) => r.label)], row.label, who);
    const capture = SP_CAPTURE_WORD[row.capture];
    const stand = row.stand === 'none' ? 'No stand' : SP_STAND_WORD[row.stand];
    const connector = (row.connector ?? '').trim();
    rows.push({
      index: k,
      label,
      side: row.side ?? null,
      pairWith: spPackagePartner(pkg, k),
      capture,
      equipment: row.equipment,
      stand,
      connector,
      how: [capture, row.equipment.toLowerCase() === capture.toLowerCase() ? '' : row.equipment, stand, connector ? `${connector} connector` : ''].filter(Boolean).join(' · '),
      monitorOnly: !!row.cue,
      ticked: on[k],
    });
    if (on[k]) picked.push({ ...row, label });
  });
  const count = picked.length;
  return {
    name: pkg.name,
    assumes: pkg.assumes,
    sourceLabel: existing ? existing.label : spUniqueLabel(p.sources.map((s) => s.label), pkg.source, who),
    rows,
    count,
    adds: count ? `Adds ${plural(count, 'input')}.` : 'No row is ticked. Tick at least one row to add it.',
    picked,
  };
}

/* ── reserved channels, as typed ────────────────────────────────────────── */

/** The highest channel number the list accepts. */
export const SP_MAX_CHANNEL = 256;

export type SpReservedParse = { numbers: number[]; rejected: string[] };

/** Read "7, 15-16, 20 to 24" into channel numbers. Anything that is not a
 *  whole channel number from 1 to 256 is handed back in `rejected`, in the
 *  user's own words, so the screen can say what it did not understand. */
export function spParseReserved(text: string): SpReservedParse {
  const joined = text.replace(/(\d)\s*(?:-|–|—|\bto\b|\bthrough\b)\s*(?=\d)/gi, '$1-');
  const numbers = new Set<number>();
  const rejected: string[] = [];
  const ok = (n: number) => Number.isInteger(n) && n >= 1 && n <= SP_MAX_CHANNEL;
  for (const raw of joined.split(/[\s,;]+/)) {
    if (!raw || /^and$/i.test(raw)) continue;
    const token = raw.replace(/^(?:#|ch\.?)/i, '');
    const one = /^(\d+)$/.exec(token);
    const range = /^(\d+)-(\d+)$/.exec(token);
    if (one && ok(Number(one[1]))) numbers.add(Number(one[1]));
    else if (range && ok(Number(range[1])) && ok(Number(range[2]))) {
      const a = Math.min(Number(range[1]), Number(range[2]));
      const b = Math.max(Number(range[1]), Number(range[2]));
      for (let n = a; n <= b; n += 1) numbers.add(n);
    } else rejected.push(raw);
  }
  return { numbers: [...numbers].sort((a, b) => a - b), rejected };
}

/** Reserved channels as text: "7, 15–16, 20–24". Reads back with spParseReserved. */
export function spReservedText(numbers: readonly number[]): string {
  const sorted = [...new Set(numbers)].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let k = 0; k < sorted.length; k += 1) {
    let end = k;
    while (end + 1 < sorted.length && sorted[end + 1] === sorted[end] + 1) end += 1;
    parts.push(end > k ? `${sorted[k]}–${sorted[end]}` : String(sorted[k]));
    k = end;
  }
  return parts.join(', ');
}

/* ── the list, row by row ───────────────────────────────────────────────── */

export type SpRowView = {
  id: SpId;
  /** The band's proposed channel number, or "—" when it has none yet. */
  number: string;
  label: string;
  side: 'L' | 'R' | null;
  /** The other side's label, when this row is one side of a pair. */
  partnerLabel: string;
  /** One side of a pair whose other side is gone (a review question). */
  pairBroken: boolean;
  /** "Drum kit · Maya", "Sam", or "Nobody (shared source)". */
  who: string;
  /** In stage words; says so when it is not on the stage yet. */
  where: string;
  placed: boolean;
  /** "Microphone · Condenser microphone". */
  capture: string;
  /** "Tall boom stand" or "No stand". */
  stand: string;
  /** "Venue brings it", "To be confirmed who brings it". For a DI channel on
   *  a DI device this is whoever brings the DEVICE (spInputSupplier). */
  supplier: string;
  /** The labels of the other inputs that carry this row's number in this
   *  list (a correction: each needs its own number). */
  sameNumberAs: string[];
  monitorOnly: boolean;
  /** A click or cue set to go to the audience mix (a review question until
   *  the band says the audience is meant to hear it). */
  cueToAudience: boolean;
  cueAudienceOk: boolean;
  audienceTbc: boolean;
  required: boolean;
  /** The venue's own channel or socket, when recorded. */
  venue: string;
  /** Where it plugs in on a stage box ("SB2 · 7", "Console direct", "No
   *  stage box socket yet"); '' when the plot has no stage box. */
  box: string;
  /** Everything above as one sentence for a screen reader. */
  a11y: string;
};

/** What sits on each socket of one stage box, as lines for its editor:
 *  "1 · Kick", "7 · Snare and Tom 1 (one socket, two inputs)", "Free: 9–16",
 *  and the inputs on a socket the box does not have. */
export function spBoxSocketLines(p: SpProject, boxId: SpId): string[] {
  const box = spBoxes(p).find((b) => b.id === boxId);
  if (!box) return [];
  const on = p.inputs.filter((i) => i.box?.boxId === boxId);
  const bySocket = new Map<number, string[]>();
  for (const i of on) bySocket.set((i.box as { socket: number }).socket, [...(bySocket.get((i.box as { socket: number }).socket) ?? []), i.label]);
  const out: string[] = [];
  for (const s of [...bySocket.keys()].filter((n) => n <= box.inputs).sort((a, b) => a - b)) {
    const names = bySocket.get(s) as string[];
    out.push(`${s} · ${spListWords(names)}${names.length > 1 ? ' (more than one input on one socket: give each its own)' : ''}`);
  }
  // (round 2) the sockets a sub-snake plugs into
  const subs = spSubsOn(p, boxId);
  for (const f of subs) out.push(`${f.first === f.last ? f.first : `${f.first}–${f.last}`} · ${spBoxName(f.box)} plugs in here (a sub-snake)`);
  const free: number[] = [];
  for (let s = 1; s <= box.inputs; s++) if (!bySocket.has(s) && !subs.some((f) => s >= f.first && s <= f.last)) free.push(s);
  if (free.length) out.push(`Free: ${spSocketRunsWords(free)}`);
  for (const s of [...bySocket.keys()].filter((n) => n > box.inputs).sort((a, b) => a - b)) out.push(`${s} · ${spListWords(bySocket.get(s) as string[])} (this box has no socket ${s})`);
  return out;
}

/** "1–6, 9": numbers as runs. */
function spSocketRunsWords(list: readonly number[]): string {
  const out: string[] = [];
  for (let k = 0; k < list.length; ) {
    let j = k;
    while (j + 1 < list.length && list[j + 1] === list[j] + 1) j += 1;
    out.push(j === k ? String(list[k]) : `${list[k]}–${list[j]}`);
    k = j + 1;
  }
  return out.join(', ');
}

/** The lowest free socket of a box (`except`: an input whose own socket
 *  counts as free), or null when every socket is taken. */
export function spBoxFreeSocket(p: SpProject, boxId: SpId, except?: SpId): number | null {
  const box = spBoxes(p).find((b) => b.id === boxId);
  if (!box) return null;
  const used = new Set(p.inputs.filter((i) => i.id !== except && i.box?.boxId === boxId).map((i) => (i.box as { socket: number }).socket));
  // (round 2) a socket a sub-snake plugs into is not free
  for (const f of spSubsOn(p, boxId)) for (let s = f.first; s <= f.last; s++) used.add(s);
  for (let s = 1; s <= box.inputs; s++) if (!used.has(s)) return s;
  return null;
}

/** (round 2) The sub-snakes plugged into a box, with their sockets. */
export function spSubsOn(p: SpProject, boxId: SpId): { box: SpStageBox; first: number; last: number }[] {
  return spBoxes(p)
    .filter((b) => b.id !== boxId && b.feed?.boxId === boxId)
    .map((b) => ({ box: b, first: (b.feed as { first: number }).first, last: (b.feed as { last: number }).last }))
    .sort((a, b) => a.first - b.first);
}

/** (round 2) The sub-snake that plugs into this input's socket, if one does
 *  (two cables on one socket: the input's editor warns). */
export function spSocketSub(p: SpProject, inputId: SpId): SpStageBox | undefined {
  const me = p.inputs.find((i) => i.id === inputId);
  if (!me?.box) return undefined;
  const at = me.box;
  return spSubsOn(p, at.boxId).find((f) => at.socket >= f.first && at.socket <= f.last)?.box;
}

/** The other inputs on the same socket of the same box. */
export function spSameSocket(p: SpProject, inputId: SpId): string[] {
  const me = p.inputs.find((i) => i.id === inputId);
  if (!me?.box) return [];
  const at = me.box;
  return p.inputs.filter((i) => i.id !== inputId && i.box?.boxId === at.boxId && i.box.socket === at.socket).map((i) => i.label);
}

/** Where an input plugs in, in the row's words ('' when the plot has no box). */
export function spRowBoxWords(p: SpProject, i: SpInput): string {
  if (!spBoxes(p).length) return '';
  return spBoxPatchWords(p, i) || (i.direct ? 'Console direct' : 'No stage box socket yet');
}

/** The other inputs that carry the same channel number as this one in one
 *  list. The same number in the other system's list is not a clash. */
export function spSameNumber(p: SpProject, patchId: SpPatchId, inputId: SpId): string[] {
  const patch = spPatch(p, patchId);
  const n = patch?.numbers[inputId];
  if (!patch || n == null) return [];
  return patch.order.filter((id) => id !== inputId && patch.numbers[id] === n).map((id) => p.inputs.find((i) => i.id === id)?.label ?? '');
}

export function spRowView(p: SpProject, row: SpPatchRow, patchId: SpPatchId = 'house'): SpRowView {
  const i = row.input;
  const sameNumberAs = spSameNumber(p, patchId, i.id);
  const partner = spPartner(p, i);
  const source = p.sources.find((s) => s.id === i.sourceId);
  const location = spInputLocation(p, i.id);
  const where = location || (source?.offstage ? 'Off the stage on purpose' : 'Not on the stage yet');
  const sameName = row.sourceLabel.trim().toLowerCase() === i.label.trim().toLowerCase();
  const who = [sameName ? '' : row.sourceLabel, row.performerName || SP_NOBODY].filter(Boolean).join(' · ');
  const capture = [SP_CAPTURE_WORD[i.capture], i.equipment.trim()].filter((s, k, all) => s && (k === 0 || s.toLowerCase() !== all[0].toLowerCase())).join(' · ');
  const stand = i.stand === 'none' ? 'No stand' : i.stand === 'custom' && i.standNote.trim() ? i.standNote.trim() : SP_STAND_WORD[i.stand];
  const supplier = spBringsWord(spInputSupplier(p, i));
  const monitorOnly = i.audience === 'monitor-only';
  const number = row.number != null ? String(row.number) : '—';
  const said: string[] = [
    row.number != null ? `Channel ${row.number}` : 'No channel number yet',
    i.side ? `${i.label}, ${i.side === 'L' ? 'left' : 'right'} side of a stereo pair${partner ? ` with ${partner.label}` : ', and the other side is missing'}` : i.label,
    who,
    where,
    capture,
    stand,
    supplier,
    monitorOnly ? 'Monitor only: kept out of the audience mix' : SP_AUDIENCE_WORD[i.audience] + (i.audience === 'tbc' ? ' for the audience routing' : ''),
  ];
  if (i.priority === 'required') said.push('Required');
  if (row.venue) said.push(`Venue channel ${row.venue}`);
  const box = spRowBoxWords(p, i);
  if (box) said.push(box.includes(' · ') ? `Stage box ${box.replace(' · ', ', socket ')}` : box);
  if (sameNumberAs.length) said.push(`Same number as ${spListWords(sameNumberAs)}: each needs its own number`);
  if (i.cue && i.audience === 'audience') said.push(i.cueAudienceOk ? 'A click or cue that the audience is meant to hear' : 'A click or cue set to go to the audience mix');
  return {
    id: i.id,
    number,
    label: i.label,
    side: i.side,
    partnerLabel: partner?.label ?? '',
    pairBroken: !!i.pairId && !partner,
    who,
    where,
    placed: !!location,
    capture,
    stand,
    supplier,
    sameNumberAs,
    monitorOnly,
    cueToAudience: i.cue && i.audience === 'audience',
    cueAudienceOk: i.cue && i.audience === 'audience' && i.cueAudienceOk,
    audienceTbc: i.audience === 'tbc',
    required: i.priority === 'required',
    venue: row.venue,
    box,
    // a screen reader reads a comma as a pause; the dot mark is for the eye
    a11y: `${said.join('. ').replace(/ · /g, ', ')}.`,
  };
}

/** The patch as the model moves it: a stereo pair is ONE block. */
function blocksOf(p: SpProject, patch: SpPatch): SpId[][] {
  const blocks: SpId[][] = [];
  const seen = new Set<SpId>();
  for (const id of patch.order) {
    if (seen.has(id)) continue;
    const i = p.inputs.find((x) => x.id === id);
    const partner = i ? spPartner(p, i) : undefined;
    const ids = partner && patch.order.includes(partner.id) ? [id, partner.id].sort((a, b) => patch.order.indexOf(a) - patch.order.indexOf(b)) : [id];
    ids.forEach((x) => seen.add(x));
    blocks.push(ids);
  }
  return blocks;
}

export type SpRowBlock = {
  /** One row, or the two sides of a stereo pair that sit together. */
  rows: SpRowView[];
  pair: boolean;
  canUp: boolean;
  canDown: boolean;
  /** What the up and down buttons say they move. */
  moves: string;
};

/** The list as it is drawn: in the patch's own order, a pair whose two sides
 *  sit together drawn as one block with one set of move buttons. */
export function spRowBlocks(p: SpProject, patchId: SpPatchId): SpRowBlock[] {
  const patch = spPatch(p, patchId);
  if (!patch) return [];
  const rows = spPatchRows(p, patchId);
  const out: SpRowBlock[] = [];
  for (let k = 0; k < rows.length; k += 1) {
    const view = spRowView(p, rows[k], patchId);
    const partner = spPartner(p, rows[k].input);
    const next = rows[k + 1];
    const can = spCanMove(p, patchId, rows[k].input.id);
    if (partner && next && next.input.id === partner.id) {
      out.push({ rows: [view, spRowView(p, next, patchId)], pair: true, canUp: can.up, canDown: can.down, moves: `the stereo pair ${view.label} and ${next.input.label}` });
      k += 1;
    } else {
      out.push({ rows: [view], pair: false, canUp: can.up, canDown: can.down, moves: partner && patch.order.includes(partner.id) ? `${view.label} and its other side, ${partner.label}` : view.label });
    }
  }
  return out;
}

/** Can this row (with its pair) move up or down the list? */
export function spCanMove(p: SpProject, patchId: SpPatchId, inputId: SpId): { up: boolean; down: boolean } {
  const patch = spPatch(p, patchId);
  if (!patch) return { up: false, down: false };
  const blocks = blocksOf(p, patch);
  const at = blocks.findIndex((b) => b.includes(inputId));
  if (at < 0) return { up: false, down: false };
  return { up: at > 0, down: at < blocks.length - 1 };
}

/** Move a row one place up (-1) or down (+1); both sides of a pair move as
 *  one. THE CHANNEL NUMBERS STAY WHERE THEY WERE IN THE LIST: the rows change
 *  places and each place keeps its number, so a deliberate gap or a reserved
 *  channel survives. When nothing can move, the SAME project is returned. */
export function spMoveRow(p: SpProject, patchId: SpPatchId, inputId: SpId, by: -1 | 1): SpProject {
  const patch = spPatch(p, patchId);
  if (!patch) return p;
  const can = spCanMove(p, patchId, inputId);
  if (by < 0 ? !can.up : !can.down) return p;
  const slots = patch.order.map((id) => patch.numbers[id] ?? null);
  let q = spMoveInput(p, patchId, inputId, by, { renumber: false });
  const order = [...(spPatch(q, patchId)?.order ?? [])];
  if (order.join('|') === patch.order.join('|')) return p;
  order.forEach((id, k) => {
    const now = spPatch(q, patchId)?.numbers[id] ?? null;
    if (now !== slots[k]) q = spSetNumber(q, patchId, id, slots[k]);
  });
  return q;
}

/** Words to show before the order or the numbers change on a revision that
 *  was marked ready or shared (the tool cannot know it was sent, so it never
 *  says it was); null when this revision is still open. */
export function spSharedNotice(p: SpProject): string | null {
  if (p.frozenRevision < p.revision) return null;
  return `Revision ${p.revision} was marked ready or shared. A change to the order or to a channel number starts revision ${p.frozenRevision + 1}, and the packet then shows the new revision number.`;
}

/* ── stereo to mono, said first ─────────────────────────────────────────── */

export type SpMonoChoice = {
  pairId: SpId;
  sides: { side: 'L' | 'R'; label: string }[];
  /** The DI device a side uses, when there is one: keeping or releasing it
   *  is the band's choice, never decided for them. */
  di: { id: SpId; label: string; channels: 1 | 2 } | null;
  /** The label the remaining input gets. */
  monoLabel: (keep: 'L' | 'R') => string;
  says: string;
};

export function spMonoChoice(p: SpProject, pairId: SpId): SpMonoChoice | null {
  const pair = p.inputs.filter((i) => i.pairId === pairId && i.side);
  if (pair.length < 2) return null;
  const sides = pair.map((i) => ({ side: i.side as 'L' | 'R', label: i.label })).sort((a, b) => a.side.localeCompare(b.side));
  const dev = p.diDevices.find((d) => pair.some((i) => i.diDeviceId === d.id));
  return {
    pairId,
    sides,
    di: dev ? { id: dev.id, label: dev.label, channels: dev.channels } : null,
    // the model's own rule, so the preview names what the edit will name
    monoLabel: (keep) => spMonoLabel(p, (pair.find((i) => i.side === keep) ?? pair[0]).id),
    says: `This removes one of the two inputs. The list then has one input fewer${pair.some((i) => i.capture === 'di') ? ', and one DI channel fewer' : ''}.`,
  };
}

/** One side of a pair is left alone, and it sits on a STEREO DI device: the
 *  device the band must decide about before the request becomes mono. null
 *  when there is nothing to decide. */
export function spBrokenPairDi(p: SpProject, inputId: SpId): { id: SpId; label: string } | null {
  const i = p.inputs.find((x) => x.id === inputId);
  if (!i || !i.pairId || spPartner(p, i) || i.capture !== 'di' || !i.diDeviceId) return null;
  const d = p.diDevices.find((x) => x.id === i.diDeviceId);
  return d && d.channels === 2 ? { id: d.id, label: d.label } : null;
}

/** Make the side that is left a mono request, with the band's answer about
 *  its DI device: keep it on the one channel, or take it off (and remove the
 *  device when nothing else uses it). The same choice as spStereoToMono. */
export function spPairMonoWithDi(p: SpProject, inputId: SpId, di: 'keep' | 'release'): SpProject {
  const before = p.inputs.find((x) => x.id === inputId);
  let q = spPairToMono(p, inputId);
  const dev = before?.diDeviceId ?? null;
  if (di === 'release' && dev) {
    q = spAssignDi(q, inputId, null);
    if (!q.inputs.some((i) => i.diDeviceId === dev)) q = spRemoveDiDevice(q, dev);
  }
  return q;
}

/* ── sources that have no input ─────────────────────────────────────────── */

export type SpQuietSource = { id: SpId; label: string; who: string; state: string; needsAnswer: boolean };

/** Sources with no input row: the ones that need no sound-system connection
 *  (acoustic or self-contained) and the ones still waiting for their inputs. */
export function spSourcesWithoutInputs(p: SpProject): SpQuietSource[] {
  const out: SpQuietSource[] = [];
  for (const s of p.sources) {
    if (p.inputs.some((i) => i.sourceId === s.id)) continue;
    const who = p.performers.find((x) => x.id === s.performerId)?.name ?? SP_NOBODY;
    const state =
      s.connection === 'none'
        ? `No sound system connection needed${s.noneReason === 'acoustic' ? ': acoustic' : s.noneReason === 'self-contained' ? ': it has its own sound' : ''}`
        : 'No input yet';
    out.push({ id: s.id, label: s.label, who, state, needsAnswer: s.connection === 'inputs' });
  }
  return out;
}

/* ── DI devices ─────────────────────────────────────────────────────────── */

/** "Stereo: 2 channels · Passive or active: to be confirmed · Venue brings it". */
export function spDiDeviceLine(p: SpProject, d: SpDiDevice): string {
  const carries = p.inputs.filter((i) => i.diDeviceId === d.id).map((i) => i.label);
  return [
    d.channels === 2 ? 'Stereo: 2 channels' : 'Mono: 1 channel',
    d.kind === 'unknown' ? 'Passive or active: to be confirmed' : SP_DI_KIND_WORD[d.kind],
    spBringsWord(d.supplier),
    carries.length ? `Carries ${spListWords(carries)}` : 'No channel on it yet',
  ].join(' · ');
}

export type SpDiChannelRow = { inputId: SpId; label: string; on: boolean; elsewhere: string };

/** Every DI channel in the project, seen from one device: on it, on another
 *  device, or with no DI device (DI box) yet. */
export function spDiChannelRows(p: SpProject, deviceId: SpId): SpDiChannelRow[] {
  return p.inputs
    .filter((i) => i.capture === 'di')
    .map((i) => ({
      inputId: i.id,
      label: i.label,
      on: i.diDeviceId === deviceId,
      elsewhere: i.diDeviceId && i.diDeviceId !== deviceId ? (p.diDevices.find((d) => d.id === i.diDeviceId)?.label ?? '') : '',
    }));
}

/** Put a DI channel on a device, or take it off again. */
export function spDiToggle(p: SpProject, deviceId: SpId, inputId: SpId): SpProject {
  const i = p.inputs.find((x) => x.id === inputId);
  if (!i || i.capture !== 'di') return p;
  return spAssignDi(p, inputId, i.diDeviceId === deviceId ? null : deviceId);
}

/* ── the equipment and responsibility summary ───────────────────────────── */

export type SpSummaryGroup = { id: 'channels' | 'microphones' | 'wireless' | 'lines' | 'stands' | 'di'; title: string; lines: string[] };

/* Count lines never print a zero count or a bare category word: "all for the
   audience mix", "venue", "The venue brings all 9.", never "0 monitor only"
   or "9 Venue". */

const WHO: Record<Exclude<SpSupplier, 'tbc'>, string> = { band: 'the band', venue: 'the venue', other: 'another provider' };
const used = (by: SpBySupplier): SpSupplier[] => SP_SUPPLIERS.filter((k) => by[k] > 0);
const capital = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** After the dash on a list line: "venue", "to be confirmed", or, when more
 *  than one brings some, "2 from the band, 1 from the venue". */
export function spBroughtBy(by: SpBySupplier): string {
  const ks = used(by);
  if (!ks.length) return '';
  if (ks.length === 1) return ks[0] === 'tbc' ? 'to be confirmed' : ks[0] === 'other' ? 'other provider' : ks[0];
  return ks.map((k) => (k === 'tbc' ? `${by[k]} to be confirmed` : `${by[k]} from ${WHO[k]}`)).join(', ');
}

/** A whole sentence: "The venue brings all 9.", "The band brings it.",
 *  "Who brings it: to be confirmed.", "The band brings 1 and the venue brings 1." */
export function spWhoBrings(by: SpBySupplier): string {
  const ks = used(by);
  const total = ks.reduce((n, k) => n + by[k], 0);
  if (!total) return '';
  if (ks.length === 1) {
    const k = ks[0];
    if (k === 'tbc') return total === 1 ? 'Who brings it: to be confirmed.' : 'Who brings them: to be confirmed.';
    return total === 1 ? `${capital(WHO[k])} brings it.` : `${capital(WHO[k])} brings ${total === 2 ? 'both' : `all ${total}`}.`;
  }
  return `${capital(spListWords(ks.map((k) => (k === 'tbc' ? `${by[k]} ${by[k] === 1 ? 'is' : 'are'} to be confirmed` : `${WHO[k]} brings ${by[k]}`))))}.`;
}

/** "House system: 10 inputs, all for the audience mix." /
 *  "House system: 14 inputs. 13 for the audience mix, 1 monitor only (Click)." */
function houseLine(p: SpProject, t: SpInputTotals): string {
  if (!t.channels) return 'House system: no inputs yet.';
  const only = spPatchRows(p, 'house')
    .filter((r) => r.input.audience === 'monitor-only')
    .map((r) => r.input.label);
  const parts: [number, string][] = [
    [t.audience, 'for the audience mix'],
    [t.monitorOnly, `monitor only (${only.join(', ')})`],
    [t.audienceTbc, 'with who hears it to be confirmed'],
  ];
  const some = parts.filter(([n]) => n > 0);
  const head = `House system: ${plural(t.channels, 'input')}`;
  if (some.length === 1) return `${head}, ${t.channels === 1 ? '' : 'all '}${some[0][1]}.`;
  return `${head}. ${some.map(([n, words]) => `${n} ${words}`).join(', ')}.`;
}

/** The band monitor rig feeds no audience: its line says which inputs it
 *  shares with the house system and which go to it alone.
 *  "Band monitor rig: 11 inputs. 10 are shared with the house system through
 *  the split, 1 goes to the band monitor rig only (Click)." */
function bandLine(p: SpProject, t: SpInputTotals): string {
  const rows = spPatchRows(p, 'band');
  const alone = rows.filter((r) => r.input.destination !== 'both').map((r) => r.input.label);
  const shared = rows.length - alone.length;
  const head = `Band monitor rig: ${plural(t.channels, 'input')}`;
  const one = t.channels === 1;
  if (!alone.length) return `${head}, ${one ? '' : 'all '}shared with the house system through the split.`;
  if (!shared) return `${head}, ${one ? '' : 'all '}for the band monitor rig only (${alone.join(', ')}).`;
  return `${head}. ${shared} ${shared === 1 ? 'is' : 'are'} shared with the house system through the split, ${alone.length} ${alone.length === 1 ? 'goes' : 'go'} to the band monitor rig only (${alone.join(', ')}).`;
}
const categoryLine = (name: string, t: SpInputTotals): string =>
  `${name} by group: ${SP_CATEGORY_ORDER.filter((c) => t.byCategory[c])
    .map((c) => `${SP_CATEGORY_WORD[c]} ${t.byCategory[c]}`)
    .join(', ')}.`;
const equipLine = (l: SpEquipLine): string[] => {
  const out = [`${l.qty} × ${l.name} — ${spBroughtBy(l.bySupplier)}${l.required ? `. Required: ${l.required}` : ''}`];
  if (l.alternatives.length) out.push(`Acceptable instead of ${l.name}: ${l.alternatives.join('; ')}. Not counted as extra equipment.`);
  return out;
};

/** The summary as titled groups of plain lines, each read from spSummary. */
export function spEquipmentGroups(p: SpProject): SpSummaryGroup[] {
  const s = spSummary(p);
  const out: SpSummaryGroup[] = [];
  const channels: string[] = [];
  if (!s.house.channels && !s.band) channels.push('No inputs yet.');
  else {
    channels.push(houseLine(p, s.house));
    if (s.house.channels) channels.push(categoryLine('House system', s.house));
  }
  if (s.band) {
    channels.push(bandLine(p, s.band));
    if (s.band.channels) channels.push(categoryLine('Band monitor rig', s.band));
    channels.push('An input in both lists is one source that feeds two systems. It is one source, not two.');
  }
  if (s.acousticSources) {
    channels.push(
      s.acousticSources === 1
        ? '1 source on the stage needs no sound system connection, and is not counted as an input.'
        : `${s.acousticSources} sources on the stage need no sound system connection, and are not counted as inputs.`,
    );
  }
  out.push({ id: 'channels', title: 'Inputs', lines: channels });

  out.push({
    id: 'microphones',
    title: 'Microphones',
    lines: s.microphones ? [`${plural(s.microphones, 'microphone')} in all. A model you typed is a preference unless you marked it Required.`, ...s.microphoneLines.flatMap(equipLine)] : ['No microphones are listed.'],
  });
  if (s.wirelessInputs) {
    out.push({
      id: 'wireless',
      title: 'Wireless receiver outputs',
      lines: [...s.wirelessLines.flatMap(equipLine), spWirelessNote(s.wirelessInputs)],
    });
  }
  const direct = byCapture(p, 'line');
  const custom = byCapture(p, 'custom');
  if (s.lineInputs || s.customInputs) {
    const lines: string[] = [];
    if (s.lineInputs) lines.push(`${s.lineInputs} × Direct balanced line (${direct.labels.join(', ')}) — ${spBroughtBy(direct.by)}`);
    if (s.customInputs) lines.push(`${s.customInputs} × Custom connection (${custom.labels.join(', ')}) — ${spBroughtBy(custom.by)}`);
    out.push({ id: 'lines', title: 'Direct lines and custom connections', lines });
  }
  out.push({
    id: 'stands',
    title: 'Stands and mounts',
    lines: s.stands.length ? s.stands.map((l) => `${l.qty} × ${l.name} — ${spBroughtBy(l.bySupplier)}`) : ['No stands or mounts are listed.'],
  });
  const di = [s.di.summary];
  if (s.di.devices) di.push(`${plural(s.di.devices, 'DI device')}. ${spWhoBrings(s.di.devicesBySupplier)}`);
  for (const o of s.di.overloaded) di.push(`${o.label} has ${plural(o.channels, 'channel')} and is asked to carry ${o.used}.`);
  out.push({ id: 'di', title: 'DI channels and DI devices', lines: di });
  return out;
}

function byCapture(p: SpProject, capture: SpInput['capture']): { by: SpBySupplier; labels: string[] } {
  const by: SpBySupplier = { band: 0, venue: 0, other: 0, tbc: 0 };
  const labels: string[] = [];
  for (const i of p.inputs) {
    if (i.capture !== capture) continue;
    by[spInputSupplier(p, i)] += 1;
    labels.push(i.label);
  }
  return { by, labels };
}

export type SpResponsibility = { supplier: SpSupplier; title: string; lines: string[] };

const RESPONSIBILITY_TITLE: Record<SpSupplier, string> = {
  band: 'The band brings',
  venue: 'The venue brings',
  other: 'Another provider brings',
  tbc: 'Who brings it: to be confirmed',
};

/** Who brings what: one block for each of Band, Venue, Other provider and To
 *  be confirmed. Each item appears in exactly one block, and every line of a
 *  block starts the same way: a quantity, "×", the thing. */
export function spResponsibility(p: SpProject): SpResponsibility[] {
  const s = spSummary(p);
  return SP_SUPPLIERS.map((k) => {
    const lines: string[] = [];
    for (const l of s.microphoneLines) if (l.bySupplier[k]) lines.push(`${l.bySupplier[k]} × ${l.name}`);
    for (const l of s.wirelessLines) if (l.bySupplier[k]) lines.push(`${l.bySupplier[k]} × ${l.name} (wireless)`);
    for (const capture of ['line', 'custom'] as const) {
      const mine = p.inputs.filter((i) => i.capture === capture && spInputSupplier(p, i) === k);
      if (mine.length) lines.push(`${mine.length} × ${capture === 'line' ? 'Direct balanced line' : 'Custom connection'} (${mine.map((i) => i.label).join(', ')})`);
    }
    for (const l of s.stands) if (l.bySupplier[k]) lines.push(`${l.bySupplier[k]} × ${l.name}`);
    // a DI channel with a device is listed as the device, once
    for (const d of p.diDevices) if (d.supplier === k) lines.push(`1 × ${d.label} (${d.channels === 2 ? 'stereo' : 'mono'} DI device${d.model.trim() ? `, ${d.model.trim()}` : ''})`);
    const loose = p.inputs.filter((i) => i.capture === 'di' && !i.diDeviceId && spInputSupplier(p, i) === k);
    if (loose.length) lines.push(`${loose.length} × DI channel with no DI device (DI box) yet (${loose.map((i) => i.label).join(', ')})`);
    for (const t of Object.keys(s.monitors.devices) as SpDeviceType[]) {
      const n = s.monitors.devicesBySupplier[t][k];
      if (n) lines.push(`${n} × ${SP_DEVICE_WORD[t]}`);
    }
    for (const e of p.extras) {
      if (e.supplier !== k) continue;
      const kind = SP_EXTRA_WORD[e.kind];
      const name = e.label.trim();
      lines.push(`${e.qty} × ${name || kind}${name && name.toLowerCase() !== kind.toLowerCase() ? ` (${kind.toLowerCase()})` : ''}`);
    }
    return { supplier: k, title: RESPONSIBILITY_TITLE[k], lines };
  });
}

export type SpCountView = { value: number; label: string };

/** The headline counts of the summary panel. A count of zero is not a
 *  headline: it is left out (an empty stage plot has no tiles at all). */
export function spSummaryCounts(p: SpProject): SpCountView[] {
  const s = spSummary(p);
  const out: SpCountView[] = [
    { value: s.house.channels, label: s.house.channels === 1 ? 'input to the house system' : 'inputs to the house system' },
    { value: s.house.audience, label: 'for the audience mix' },
    { value: s.house.monitorOnly, label: 'monitor only' },
  ];
  if (s.band) out.push({ value: s.band.channels, label: s.band.channels === 1 ? 'input to the band monitor rig' : 'inputs to the band monitor rig' });
  out.push({ value: s.microphones, label: s.microphones === 1 ? 'microphone' : 'microphones' });
  out.push({ value: s.di.channels, label: s.di.channels === 1 ? 'DI channel' : 'DI channels' });
  out.push({ value: s.di.devices, label: s.di.devices === 1 ? 'DI device' : 'DI devices' });
  return out.filter((c) => c.value > 0);
}

/** "1 × Split · Who brings it: to be confirmed · <the note>". */
export function spExtraLine(e: SpExtra): string {
  return [`${e.qty} × ${SP_EXTRA_WORD[e.kind]}`, spBringsWord(e.supplier), e.note.trim()].filter(Boolean).join(' · ');
}

/* ── the review, for this area ──────────────────────────────────────────── */

/** The questions and corrections that belong to the Inputs area. The "to be
 *  confirmed" items are kept apart: they are a list to read, not a question. */
export const spInputQuestions = (issues: readonly SpIssue[]): SpIssue[] => issues.filter((i) => i.area === 'inputs' && i.level !== 'open');
/** The open details, split by where each is answered: here, or in another
 *  area (a mix or a monitor device is answered in Monitors). */
export const spOpenIssues = (issues: readonly SpIssue[]): { here: SpIssue[]; elsewhere: SpIssue[] } => {
  const open = issues.filter((i) => i.level === 'open');
  return { here: open.filter((i) => i.area === 'inputs'), elsewhere: open.filter((i) => i.area !== 'inputs') };
};
/** An open item's words without the heading it is already listed under. */
export const spOpenLine = (i: SpIssue): string => i.text.replace(/^To be confirmed — /, '').replace(/\.$/, '');

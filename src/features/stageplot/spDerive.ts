/**
 * stageplot/spDerive — every TOTAL the tool shows or prints, worked out from
 * the project each time. Nothing here is stored and nothing is typed in: a
 * count cannot drift away from the rows it counts (handoff §6, §10).
 *
 * What is counted, and what is deliberately NOT:
 *   • INPUT CHANNELS are counted per destination system. The same input in
 *     the house patch and in the band's patch is one source feeding two
 *     systems, and is counted once in each.
 *   • MICROPHONES are inputs captured by a microphone. A wireless microphone
 *     is listed under wireless: it reaches the mixer through its receiver.
 *   • DI CHANNELS and DI DEVICES are separate numbers. A DI channel with no
 *     device chosen is reported as "arrangement to confirm": three DI
 *     channels never claims three boxes.
 *   • MIXES, OUTPUT AUDIO CHANNELS and DEVICES are three separate counts.
 *     A mono mix is 1 audio channel, a stereo mix is 2. Only mixes the HOUSE
 *     console creates count against the house; a rig the band mixes itself
 *     is listed apart, with what the venue must provide for it.
 *   • AN ICON IS NEVER COUNTED. Devices are counted from the device list.
 *   • ALTERNATIVES ARE NOT EXTRA EQUIPMENT.
 *
 * Pure. US spelling.
 */
import { SP_CATEGORY_ORDER, SP_DEVICE_PLURAL, SP_DEVICE_WORD, SP_EXTRA_KIND_WORD, SP_STAND_WORD, SP_SUPPLIER_WORD } from './spCatalog.ts';
import { spPartner, spPatch } from './spModel.ts';
import type { SpCapture, SpCategory, SpDeviceType, SpId, SpInput, SpMix, SpMixProvider, SpPatchId, SpProject, SpStand, SpSupplier } from './spTypes.ts';

export type SpBySupplier = Record<SpSupplier, number>;
const noSupplier = (): SpBySupplier => ({ band: 0, venue: 0, other: 0, tbc: 0 });

export type SpPatchRow = {
  input: SpInput;
  /** The band's proposed channel number in this patch (null = none yet). */
  number: number | null;
  /** The venue's own channel or socket, when recorded. */
  venue: string;
  sourceLabel: string;
  performerName: string;
  category: SpCategory;
};

/** One patch as rows, in its order. */
export function spPatchRows(p: SpProject, patchId: SpPatchId): SpPatchRow[] {
  const patch = spPatch(p, patchId);
  if (!patch) return [];
  const out: SpPatchRow[] = [];
  for (const id of patch.order) {
    const input = p.inputs.find((i) => i.id === id);
    if (!input) continue;
    const source = p.sources.find((s) => s.id === input.sourceId);
    const performer = source?.performerId ? p.performers.find((x) => x.id === source.performerId) : undefined;
    out.push({ input, number: patch.numbers[id] ?? null, venue: patch.venue[id] ?? '', sourceLabel: source?.label ?? '', performerName: performer?.name ?? '', category: source?.category ?? 'other' });
  }
  return out;
}

/** The number to print beside an input on the stage and in a mix: its house
 *  channel, or its band-rig channel when it is not in the house patch. */
export function spBadge(p: SpProject, inputId: SpId): string {
  for (const pid of ['house', 'band'] as const) {
    const patch = spPatch(p, pid);
    if (patch && patch.order.includes(inputId)) {
      const n = patch.numbers[inputId];
      return n != null ? (pid === 'band' ? `B${n}` : String(n)) : '?';
    }
  }
  return '?';
}

/** WHO SUPPLIES AN INPUT'S CAPTURE EQUIPMENT: one answer, never two. A DI
 *  channel that sits on a DI device is supplied by whoever supplies that
 *  device; every other input by its own supplier. The input list, the
 *  equipment table and the open questions all read this. */
export function spInputSupplier(p: SpProject, i: SpInput): SpSupplier {
  if (i.capture === 'di' && i.diDeviceId) {
    const d = p.diDevices.find((x) => x.id === i.diDeviceId);
    if (d) return d.supplier;
  }
  return i.supplier;
}

/** What the capture equipment is called in a question ("who supplies the …"). */
export const SP_CAPTURE_THING: Record<SpCapture, string> = { mic: 'microphone', di: 'DI', line: 'line output', wireless: 'wireless system', custom: 'equipment' };

export type SpInputTotals = {
  /** Physical input audio channels in this destination system. */
  channels: number;
  audience: number;
  monitorOnly: number;
  audienceTbc: number;
  byCategory: Partial<Record<SpCategory, number>>;
};

export function spInputTotals(p: SpProject, patchId: SpPatchId): SpInputTotals {
  const rows = spPatchRows(p, patchId);
  const t: SpInputTotals = { channels: rows.length, audience: 0, monitorOnly: 0, audienceTbc: 0, byCategory: {} };
  for (const r of rows) {
    if (r.input.audience === 'audience') t.audience += 1;
    else if (r.input.audience === 'monitor-only') t.monitorOnly += 1;
    else t.audienceTbc += 1;
    t.byCategory[r.category] = (t.byCategory[r.category] ?? 0) + 1;
  }
  return t;
}

export type SpEquipLine = {
  /** What it is, as the band wrote it (a model or a generic category). */
  name: string;
  qty: number;
  /** How many of them the band marked REQUIRED. */
  required: number;
  bySupplier: SpBySupplier;
  /** Acceptable alternatives, listed once each (never added to `qty`). */
  alternatives: string[];
};

function equipLines(p: SpProject, inputs: SpInput[]): SpEquipLine[] {
  const map = new Map<string, SpEquipLine>();
  for (const i of inputs) {
    const name = i.equipment.trim() || 'Not specified';
    let line = map.get(name.toLowerCase());
    if (!line) {
      line = { name, qty: 0, required: 0, bySupplier: noSupplier(), alternatives: [] };
      map.set(name.toLowerCase(), line);
    }
    line.qty += 1;
    if (i.priority === 'required') line.required += 1;
    line.bySupplier[spInputSupplier(p, i)] += 1;
    const alt = i.alternatives.trim();
    if (alt && !line.alternatives.includes(alt)) line.alternatives.push(alt);
  }
  return [...map.values()].sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name));
}

export type SpDiTotals = {
  /** Inputs captured through a DI: one audio channel each. */
  channels: number;
  /** DI devices on the list. */
  devices: number;
  devicesBySupplier: SpBySupplier;
  /** DI channels with no device chosen yet. */
  unassignedChannels: number;
  /** Devices asked to carry more channels than they have. */
  overloaded: { label: string; channels: number; used: number }[];
  /** In words, never claiming a box count that was not given. */
  summary: string;
};

export function spDiTotals(p: SpProject): SpDiTotals {
  const di = p.inputs.filter((i) => i.capture === 'di');
  const unassigned = di.filter((i) => !i.diDeviceId).length;
  const bySupplier = noSupplier();
  const overloaded: SpDiTotals['overloaded'] = [];
  for (const d of p.diDevices) {
    bySupplier[d.supplier] += 1;
    const used = di.filter((i) => i.diDeviceId === d.id).length;
    if (used > d.channels) overloaded.push({ label: d.label, channels: d.channels, used });
  }
  const ch = di.length;
  const chWord = `${ch} DI channel${ch === 1 ? '' : 's'}`;
  const noDevice = (n: number) => (n === 1 ? '1 DI channel has no DI device (DI box) yet' : `${n} DI channels have no DI device (DI box) yet`);
  let summary: string;
  if (!ch) summary = 'No DI channels.';
  else if (!p.diDevices.length) summary = `${noDevice(ch)}.`;
  else if (unassigned) summary = `${chWord}: ${p.diDevices.length} DI device${p.diDevices.length === 1 ? '' : 's'} listed, and ${noDevice(unassigned)}.`;
  else summary = `${chWord} on ${p.diDevices.length} DI device${p.diDevices.length === 1 ? '' : 's'}.`;
  return { channels: ch, devices: p.diDevices.length, devicesBySupplier: bySupplier, unassignedChannels: unassigned, overloaded, summary };
}

export type SpStandLine = { stand: SpStand; name: string; qty: number; bySupplier: SpBySupplier };

export function spStandLines(p: SpProject): SpStandLine[] {
  const map = new Map<SpStand, SpStandLine>();
  for (const i of p.inputs) {
    if (i.stand === 'none') continue;
    let line = map.get(i.stand);
    if (!line) {
      line = { stand: i.stand, name: SP_STAND_WORD[i.stand], qty: 0, bySupplier: noSupplier() };
      map.set(i.stand, line);
    }
    line.qty += 1;
    line.bySupplier[i.standSupplier] += 1;
  }
  return [...map.values()];
}

/** Audio channels one mix needs from whoever creates it. */
export const spMixChannels = (m: SpMix): number => (m.format === 'stereo' ? 2 : 1);

export type SpMixTotals = {
  /** Distinct mixes. */
  mixes: number;
  mono: number;
  stereo: number;
  /** Monitor feed audio channels (mono 1, stereo 2). */
  channels: number;
};
const noMixTotals = (): SpMixTotals => ({ mixes: 0, mono: 0, stereo: 0, channels: 0 });

export type SpMonitorTotals = {
  all: SpMixTotals;
  byProvider: Record<SpMixProvider, SpMixTotals>;
  /** What the HOUSE console is asked to create. */
  house: SpMixTotals;
  /** Mixes the band creates in its own rig: not counted against the house. */
  bandOwned: SpMixTotals;
  devices: Record<SpDeviceType, number>;
  devicesBySupplier: Record<SpDeviceType, SpBySupplier>;
  /** Devices with wireless: coordination is needed (no frequencies here). */
  wirelessDevices: number;
};

export function spMonitorTotals(p: SpProject): SpMonitorTotals {
  const byProvider: Record<SpMixProvider, SpMixTotals> = { house: noMixTotals(), 'band-console': noMixTotals(), 'personal-mixer': noMixTotals(), tbc: noMixTotals() };
  const all = noMixTotals();
  const add = (t: SpMixTotals, m: SpMix) => {
    t.mixes += 1;
    if (m.format === 'stereo') t.stereo += 1;
    else t.mono += 1;
    t.channels += spMixChannels(m);
  };
  for (const m of p.mixes) {
    add(all, m);
    add(byProvider[m.provider], m);
  }
  const bandOwned = noMixTotals();
  for (const k of ['band-console', 'personal-mixer'] as const) {
    bandOwned.mixes += byProvider[k].mixes;
    bandOwned.mono += byProvider[k].mono;
    bandOwned.stereo += byProvider[k].stereo;
    bandOwned.channels += byProvider[k].channels;
  }
  const types: SpDeviceType[] = ['wedge', 'iem-tx', 'iem-pack', 'hp-amp', 'drum-fill', 'sidefill', 'personal-mixer', 'custom'];
  const devices = {} as Record<SpDeviceType, number>;
  const devicesBySupplier = {} as Record<SpDeviceType, SpBySupplier>;
  for (const t of types) {
    devices[t] = 0;
    devicesBySupplier[t] = noSupplier();
  }
  let wireless = 0;
  for (const d of p.devices) {
    devices[d.type] += 1;
    devicesBySupplier[d.type][d.supplier] += 1;
    if (d.wireless) wireless += 1;
  }
  return { all, byProvider, house: byProvider.house, bandOwned, devices, devicesBySupplier, wirelessDevices: wireless };
}

export type SpSummary = {
  house: SpInputTotals;
  band: SpInputTotals | null;
  /** Inputs captured by a wired microphone. */
  microphones: number;
  microphoneLines: SpEquipLine[];
  /** Inputs that arrive through a wireless receiver's output. */
  wirelessInputs: number;
  wirelessLines: SpEquipLine[];
  /** Inputs that arrive as a direct balanced line. */
  lineInputs: number;
  customInputs: number;
  di: SpDiTotals;
  stands: SpStandLine[];
  monitors: SpMonitorTotals;
  /** Sources on the stage that need no sound-system connection. */
  acousticSources: number;
  /** Every "to be confirmed" still open, in words (for the unresolved list). */
  open: string[];
  /** The same, each with the row to open to answer it. */
  openItems: SpOpenItem[];
};

/** One open question and the row to open to answer it. */
export type SpOpenItem = {
  text: string;
  kind: 'input' | 'di' | 'mix' | 'device' | 'extra';
  id: SpId;
  /** The FIRST field to answer in that row (the screens scroll to it). */
  field: SpOpenField;
};
/** The fields an open question is answered in. */
export type SpOpenField = 'supplier' | 'standSupplier' | 'phantom' | 'audience' | 'di' | 'destination' | 'kind' | 'provider' | 'venueFeed' | 'outputs';

/** Every "to be confirmed" still open, each with the row it is about. */
export function spOpenItems(p: SpProject): SpOpenItem[] {
  // THE OPEN QUESTIONS: what somebody still has to answer. A question is
  // asked ONCE, of the one who can answer it:
  //   • a venue-supplied microphone or DI is the venue's own equipment, so
  //     the venue is not asked whether it needs phantom power or which type
  //     it is (the band asked for a kind of thing; the venue chooses it)
  //   • a DI channel on a DI device is asked about on the DEVICE's line
  //   • one split serves every input that goes through it: one line
  //   • how one feed reaches several devices is the venue's distribution
  const open: SpOpenItem[] = [];
  const splitUnknown: SpInput[] = [];
  for (const i of p.inputs) {
    const what: string[] = [];
    const fields: SpOpenField[] = [];
    const onDevice = i.capture === 'di' && !!i.diDeviceId && p.diDevices.some((d) => d.id === i.diDeviceId);
    const supplier = spInputSupplier(p, i);
    if (!onDevice && supplier === 'tbc') what.push(`who supplies the ${SP_CAPTURE_THING[i.capture]}`), fields.push('supplier');
    if (i.stand !== 'none' && i.standSupplier === 'tbc') what.push('who supplies the stand'), fields.push('standSupplier');
    if (!onDevice && supplier !== 'venue' && i.phantom === 'unknown' && (i.capture === 'mic' || i.capture === 'di')) what.push('phantom power'), fields.push('phantom');
    if (i.audience === 'tbc') what.push('audience mix or monitor only'), fields.push('audience');
    if (i.capture === 'di' && !i.diDeviceId) what.push('which DI device'), fields.push('di');
    if (i.destination === 'both' && !i.splitNote.trim()) splitUnknown.push(i);
    if (what.length) open.push({ text: `${i.label}: ${what.join('; ')}`, kind: 'input', id: i.id, field: fields[0] });
  }
  if (splitUnknown.length) open.push({ text: `How the split is made: ${splitUnknown.length} input${splitUnknown.length === 1 ? '' : 's'} (${splitUnknown.map((x) => x.label).join(', ')})`, kind: 'input', id: splitUnknown[0].id, field: 'destination' });
  for (const d of p.diDevices) {
    const what: string[] = [];
    const fields: SpOpenField[] = [];
    if (d.supplier === 'tbc') what.push('who supplies it'), fields.push('supplier');
    if (d.supplier !== 'venue') {
      if (d.kind === 'unknown') what.push('passive or active'), fields.push('kind');
      const on = p.inputs.filter((i) => i.capture === 'di' && i.diDeviceId === d.id);
      if (on.length && on.every((i) => i.phantom === 'unknown')) what.push('phantom power'), fields.push('phantom');
    }
    if (what.length) open.push({ text: `${d.label}: ${what.join('; ')}`, kind: 'di', id: d.id, field: fields[0] });
  }
  for (const m of p.mixes) {
    const what: string[] = [];
    const fields: SpOpenField[] = [];
    if (m.provider === 'tbc') what.push('who creates this mix'), fields.push('provider');
    if ((m.provider === 'band-console' || m.provider === 'personal-mixer') && m.venueFeed === 'tbc') what.push('what is requested from the venue for it'), fields.push('venueFeed');
    if (m.provider === 'house' && !m.outputs.trim()) {
      const byType = new Map<SpDeviceType, number>();
      for (const d of p.devices) if (d.mixId === m.id) byType.set(d.type, (byType.get(d.type) ?? 0) + 1);
      for (const [type, n] of byType) if (n >= 2) what.push(`how its ${n} ${SP_DEVICE_PLURAL[type]} are fed (linked from one output, or one output each)`), fields.push('outputs');
    }
    if (what.length) open.push({ text: `${m.code}${m.name ? ` ${m.name}` : ''}: ${what.join('; ')}`, kind: 'mix', id: m.id, field: fields[0] });
  }
  for (const d of p.devices) if (d.supplier === 'tbc') open.push({ text: `${d.label || SP_DEVICE_WORD[d.type]}: who supplies it`, kind: 'device', id: d.id, field: 'supplier' });
  for (const e of p.extras) if (e.supplier === 'tbc') open.push({ text: `${e.label.trim() || SP_EXTRA_KIND_WORD[e.kind]}: who supplies it`, kind: 'extra', id: e.id, field: 'supplier' });
  return open;
}

export function spSummary(p: SpProject): SpSummary {
  const mics = p.inputs.filter((i) => i.capture === 'mic');
  const wireless = p.inputs.filter((i) => i.capture === 'wireless');
  const openItems = spOpenItems(p);
  const open = openItems.map((x) => x.text);
  return {
    house: spInputTotals(p, 'house'),
    band: spPatch(p, 'band') ? spInputTotals(p, 'band') : null,
    microphones: mics.length,
    microphoneLines: equipLines(p, mics),
    wirelessInputs: wireless.length,
    wirelessLines: equipLines(p, wireless),
    lineInputs: p.inputs.filter((i) => i.capture === 'line').length,
    customInputs: p.inputs.filter((i) => i.capture === 'custom').length,
    di: spDiTotals(p),
    stands: spStandLines(p),
    monitors: spMonitorTotals(p),
    acousticSources: p.sources.filter((s) => s.connection === 'none').length,
    open,
    openItems,
  };
}

/** "2 Band, 1 Venue, 1 To be confirmed": only the suppliers that have some. */
export function spSupplierWords(b: SpBySupplier): string {
  return (['band', 'venue', 'other', 'tbc'] as const)
    .filter((k) => b[k] > 0)
    .map((k) => `${b[k]} ${SP_SUPPLIER_WORD[k]}`)
    .join(', ');
}

/** "2 wedges", "1 in-ear receiver pack". */
export function spDeviceCountWord(type: SpDeviceType, n: number): string {
  return `${n} ${n === 1 ? SP_DEVICE_WORD[type].toLowerCase() : SP_DEVICE_PLURAL[type]}`;
}

/** The mixes a performer is on. */
export const spMixesOf = (p: SpProject, performerId: SpId): SpMix[] => p.mixes.filter((m) => m.recipients.includes(performerId));

/** Inputs in the order the band proposes (house patch first, then inputs
 *  that feed only the band's rig), each once. */
export function spAllInputsInOrder(p: SpProject): SpInput[] {
  const seen = new Set<SpId>();
  const out: SpInput[] = [];
  for (const pid of ['house', 'band'] as const) {
    for (const r of spPatchRows(p, pid)) {
      if (seen.has(r.input.id)) continue;
      seen.add(r.input.id);
      out.push(r.input);
    }
  }
  return out;
}

/** Categories that have at least one input, in the conventional order. */
export const spCategoriesInUse = (p: SpProject): SpCategory[] => SP_CATEGORY_ORDER.filter((c) => p.sources.some((s) => s.category === c && p.inputs.some((i) => i.sourceId === s.id)));

/** True when both sides of a stereo pair are present. */
export const spPairComplete = (p: SpProject, i: SpInput): boolean => !i.pairId || !!spPartner(p, i);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** "2026-12-05" as "December 5, 2026"; anything else is returned as typed. */
export function spDateInWords(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso.trim();
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${month} ${Number(m[3])}, ${m[1]}` : iso.trim();
}
const count = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;

/** A plain-text technical summary, for a quick message (handoff §7). */
/** "all mono", "all stereo", "mono", "2 mono, 2 stereo": never a zero
 *  count (review 2, 2026-11-12). */
export function spMonoStereoWord(mono: number, stereo: number): string {
  if (mono && stereo) return `${mono} mono, ${stereo} stereo`;
  const n = mono + stereo;
  const word = mono ? 'mono' : 'stereo';
  return n === 1 ? word : `all ${word}`;
}

export function spTextSummary(p: SpProject): string {
  const s = spSummary(p);
  const m = s.monitors;
  const lines: string[] = [];
  lines.push(`${[p.band, p.title].filter((x) => x.trim()).join(' — ') || 'Stage plot and input list'} (revision ${p.revision}${p.status === 'draft' ? ', draft' : ''})`);
  if (p.venue || p.eventDate) lines.push([p.venue, spDateInWords(p.eventDate)].filter(Boolean).join(', '));
  const monitorOnly = spPatchRows(p, 'house').filter((r) => r.input.audience === 'monitor-only').map((r) => r.input.label);
  lines.push(`Inputs: ${s.house.channels} to the house system (${s.house.audience} for the audience mix${monitorOnly.length ? `; monitor only, kept out of the audience mix: ${monitorOnly.join(', ')}` : ''}${s.house.audienceTbc ? `; ${s.house.audienceTbc} to be confirmed` : ''}).`);
  if (s.band) lines.push(`Band monitor rig: ${count(s.band.channels, 'input')}.`);
  lines.push(`Microphones: ${s.microphones}. ${s.di.summary}`);
  if (s.wirelessInputs) lines.push(`Wireless receiver outputs: ${s.wirelessInputs} (radio frequency coordination needed).`);
  lines.push(`Monitor mixes: ${m.all.mixes}${m.all.mixes ? ` (${spMonoStereoWord(m.all.mono, m.all.stereo)})` : ''}.`);
  lines.push(`Requested from the house console: ${m.house.mixes} mix${m.house.mixes === 1 ? '' : 'es'}, ${m.house.channels} audio channel${m.house.channels === 1 ? '' : 's'}.`);
  const rig = m.byProvider['band-console'].mixes;
  const personal = m.byProvider['personal-mixer'].mixes;
  if (rig) lines.push(`Created in the band monitor rig, and not requested from the house console: ${rig} mix${rig === 1 ? '' : 'es'}.`);
  if (personal) lines.push(`Made on a personal mixer system, and not mixed on the house console: ${personal} mix${personal === 1 ? '' : 'es'}.`);
  if (m.byProvider.tbc.mixes) lines.push(`Who creates ${count(m.byProvider.tbc.mixes, 'mix', 'mixes')} is to be confirmed.`);
  if (m.wirelessDevices) lines.push(`Wireless monitor devices: ${m.wirelessDevices} (radio frequency coordination needed).`);
  const dev = (Object.keys(m.devices) as SpDeviceType[]).filter((t) => m.devices[t] > 0).map((t) => spDeviceCountWord(t, m.devices[t]));
  if (dev.length) lines.push(`Monitor equipment: ${dev.join(', ')}.`);
  if (s.open.length) lines.push(`To be confirmed: ${s.open.length} item${s.open.length === 1 ? '' : 's'} (listed in the packet).`);
  const c = p.contact;
  const who = [c.show.name ? c.name : '', c.show.role ? c.role : '', c.show.email ? c.email : '', c.show.phone ? c.phone : ''].filter(Boolean).join(', ');
  if (who) lines.push(`Technical contact: ${who}`);
  return lines.join('\n');
}

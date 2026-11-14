/**
 * stageplot/monitors/monitorPlan — the WORDS and the small decisions of the
 * Monitors area of the Stage Plot and Channel Designer (must-do D60).
 *
 * The one idea this area must make unmistakable (owner's handoff, §5):
 * A MIX IS NOT A DEVICE. A mix is what a performer hears. A wedge, a receiver
 * pack or a headphone amplifier is equipment that plays it. So this file
 * keeps three numbers apart and says each one in words:
 *
 *   • MIXES;
 *   • MONITOR FEED AUDIO CHANNELS REQUESTED FROM THE HOUSE CONSOLE (a mono mix is
 *     1, a stereo mix is 2: the words are "audio channels", because a console
 *     may show a stereo mix as one linked strip). Only what the house console
 *     is requested to create is in this number. The audio channels of a mix the
 *     band creates in the band monitor rig, of a mix on a personal mixer system, or of
 *     a mix nobody is named to create are said APART and are never added in:
 *     "feed" reads as something the house sends (review 1, live sound);
 *   • MONITOR DEVICES, each kind counted apart.
 *
 * And it keeps WHO CREATES A MIX apart: the house console; the band monitor
 * rig (its mixer is the band monitor console); a personal mixer system (which
 * a venue may also own, so it is called "not mixed on the house console",
 * never the band's); or to be confirmed.
 *
 * One name for one thing (review 2): "requested from the house console",
 * "band monitor rig", "band monitor console". No zero count is printed and no
 * bare category word: "all mono", "The venue brings all 9."
 *
 * Nothing here stores a count: every number is read from spDerive each time.
 * Nothing here guesses who brings an item, nothing here names a radio
 * frequency, and a name offered for a new mix or device never contains a
 * performer's name (a performer can be renamed; who uses a device is read
 * from its link).
 *
 * Pure: no React, no native modules. US spelling.
 */
import { SP_DELIVERY_WORD, SP_DEVICE_PLURAL, SP_DEVICE_WORD, SP_MIX_INSTRUCTIONS, SP_NEED_WORD, SP_PROVIDER_WORD, SP_SUPPLIER_WORD, SP_VENUE_FEED_WORD } from '../../../../features/stageplot/spCatalog.ts';
import { spAllInputsInOrder, spBadge, spDeviceCountWord, spMixChannels, spMonitorTotals, type SpBySupplier, type SpMixTotals, type SpMonitorTotals } from '../../../../features/stageplot/spDerive.ts';
import { spAddDevice, spAddMix, spLocationWord } from '../../../../features/stageplot/spModel.ts';
import { spOwnClashes } from '../../../../features/stageplot/spReview.ts';
import type {
  SpDelivery,
  SpDevice,
  SpDeviceType,
  SpId,
  SpInput,
  SpMix,
  SpMixFormat,
  SpMixNeed,
  SpMixProvider,
  SpPerformer,
  SpProject,
  SpSupplier,
  SpVenueFeed,
} from '../../../../features/stageplot/spTypes.ts';
import { spBringsWord } from '../inputs/inputsLogic.ts';

/* ── small words ────────────────────────────────────────────────────────── */

const count = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;
const lowerFirst = (s: string): string => (s ? s[0].toLowerCase() + s.slice(1) : s);
const upperFirst = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** A channel number as words: "channel 7", "channel B3" (the band monitor
 *  rig), or that it has no number yet. */
export const spmChannelWord = (badge: string): string => (badge === '?' ? 'no channel number yet' : `channel ${badge}`);

/** "M1", "M1 and M2", "M1, M2 and M3". */
export function spmList(words: readonly string[]): string {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/** Every device type, in the order the lists and the counts use. */
export const SPM_DEVICE_TYPES: readonly SpDeviceType[] = ['wedge', 'iem-tx', 'iem-pack', 'hp-amp', 'drum-fill', 'sidefill', 'personal-mixer', 'custom'];

/** The four words of the needs grid, in their order. */
export const SPM_NEEDS: readonly SpMixNeed[] = ['primary', 'supporting', 'not-needed', 'exclude'];

/** What each of the four words asks for, in plain words. */
export const SPM_NEED_MEANING: Record<SpMixNeed, string> = {
  primary: 'This must be clear in the mix.',
  supporting: 'Some of this, behind the primary sources.',
  'not-needed': 'This can stay out of the mix.',
  exclude: 'Keep this out of the mix.',
};

/** Said wherever the needs grid appears (handoff §5). */
export const SPM_NEEDS_NOTE = 'A preference you give before the show, not a fader value. The engineer builds the real mix at soundcheck.';

/* ── explanations of the words the choices use ──────────────────────────── */

/** Said once where the band monitor rig is first chosen. */
export const SPM_BAND_RIG_MEANS = 'The band monitor rig is the monitor equipment your band brings and mixes itself, on its band monitor console.';

/** Under "Who creates this mix". */
export const SPM_PROVIDER_HINT = 'House console: the venue’s mixer. Band monitor console: a mixer your band brings for its monitors. Personal mixer system: a small mixer for each performer.';

/** Under "How it is delivered". */
export const SPM_DELIVERY_HINT = 'Wedge: a loudspeaker on the floor, aimed at the performer. In-ear: earphones. Drum fill: a loudspeaker for the drummer. Sidefill: loudspeakers at the sides of the stage.';

/** Under "What is requested from the venue": one line for each choice. */
export const SPM_FEED_HINT =
  'An input split: a copy of every stage input for the mixer that makes this mix.\n' +
  'Feeds from the house console: mixes or groups sent from the house console to the mixer that makes this mix.\n' +
  'Return lines: cables in the venue’s snake (its multi-channel stage cable). They carry signals from the mixing position back to the stage.\n' +
  'No monitor feeds: nothing is needed from the house console for this mix.';

/** Why the question is asked, by who creates the mix. */
export const spmFeedWhy = (provider: SpMixProvider): string =>
  provider === 'personal-mixer'
    ? 'This mix is made on a personal mixer system, so it is not requested from the house console. Say what is requested from the venue for it.'
    : `Your band creates this mix on its band monitor console, so it is not requested from the house console. Say what is requested from the venue for it. ${SPM_BAND_RIG_MEANS}`;

/** Above the click, cue and talkback inputs. */
export const SPM_CUE_MEANS = 'A click is a metronome sound for the performers. A cue or talkback is a voice that only the performers hear.';

/* ── the choices the editors offer (the catalog's words, in one order) ──── */

type Option<T extends string> = { value: T; label: string };
const options = <T extends string>(order: readonly T[], word: Record<T, string>): readonly Option<T>[] => order.map((value) => ({ value, label: word[value] }));

export const SPM_FORMAT_OPTIONS: readonly Option<SpMixFormat>[] = [
  { value: 'mono', label: 'Mono: 1 audio channel' },
  { value: 'stereo', label: 'Stereo: 2 audio channels' },
];
export const SPM_PROVIDER_OPTIONS = options<SpMixProvider>(['house', 'band-console', 'personal-mixer', 'tbc'], SP_PROVIDER_WORD);
export const SPM_DELIVERY_OPTIONS = options<SpDelivery>(['wedge', 'wired-iem', 'wireless-iem', 'drum-fill', 'sidefill', 'custom'], SP_DELIVERY_WORD);
export const SPM_FEED_OPTIONS = options<SpVenueFeed>(['split', 'feeds', 'returns', 'none', 'tbc'], SP_VENUE_FEED_WORD);
export const SPM_SUPPLIER_OPTIONS = options<SpSupplier>(['band', 'venue', 'other', 'tbc'], SP_SUPPLIER_WORD);
export const SPM_DEVICE_OPTIONS = options<SpDeviceType>(SPM_DEVICE_TYPES, SP_DEVICE_WORD);

/* ── who creates a mix ──────────────────────────────────────────────────── */

/** A mix that is NOT requested from the house console, and somebody creates it: the
 *  question "what the venue provides for it" belongs to these. */
export const spmOffHouse = (m: { provider: SpMixProvider }): boolean => m.provider === 'band-console' || m.provider === 'personal-mixer';

/** A mix the band creates on its band monitor console, in the band monitor
 *  rig. A personal mixer system is not called that (a venue may own one). */
export const spmOwnRig = (m: { provider: SpMixProvider }): boolean => m.provider === 'band-console';

/* ── the three counts ───────────────────────────────────────────────────── */

/** "2 mono, 2 stereo", "all mono", "stereo" (one mix): never a zero count. */
export function spmFormatWords(t: SpMixTotals): string {
  if (!t.mixes) return '';
  if (t.mixes === 1) return t.stereo ? 'stereo' : 'mono';
  if (!t.stereo) return 'all mono';
  if (!t.mono) return 'all stereo';
  return `${t.mono} mono, ${t.stereo} stereo`;
}

/** "4 mixes: 2 mono, 2 stereo.", "6 mixes, all mono.", "1 mix, mono." */
export function spmMixLine(t: SpMixTotals): string {
  if (!t.mixes) return 'No mixes yet.';
  const words = spmFormatWords(t);
  return t.mono && t.stereo ? `${count(t.mixes, 'mix', 'mixes')}: ${words}.` : `${count(t.mixes, 'mix', 'mixes')}, ${words}.`;
}

/** The rule behind the middle count, said under it. */
export const SPM_FEED_RULE = 'A mono mix is 1 audio channel. A stereo mix is 2.';

export type SpmTypeCount = { type: SpDeviceType; n: number; /** "wedges", "in-ear receiver pack" */ label: string };

export type SpmCounts = {
  /** Every mix in the plan, whoever creates it. */
  mixes: number;
  /** Monitor feed audio channels REQUESTED FROM THE HOUSE CONSOLE, and nothing else. */
  houseFeedChannels: number;
  devices: number;
  /** Only the device types that have at least one. */
  byType: SpmTypeCount[];
  mixLine: string;
  /** Audio channels that are NOT requested from the house console, one line for
   *  each kind. They are shown apart and never added to `houseFeedChannels`. */
  apartLines: string[];
  deviceLine: string;
};

const channelsIn = (t: SpMixTotals): string => `${count(t.channels, 'audio channel', 'audio channels')} in ${count(t.mixes, 'mix', 'mixes')}`;

/** The three counts of the monitor plan, as numbers and as sentences. They
 *  are three different things and are never added together. */
export function spmCounts(t: SpMonitorTotals): SpmCounts {
  const byType: SpmTypeCount[] = SPM_DEVICE_TYPES.filter((type) => t.devices[type] > 0).map((type) => ({
    type,
    n: t.devices[type],
    label: t.devices[type] === 1 ? SP_DEVICE_WORD[type].toLowerCase() : SP_DEVICE_PLURAL[type],
  }));
  const devices = byType.reduce((sum, x) => sum + x.n, 0);
  const mixes = t.all.mixes;
  const house = t.house.channels;
  const apartLines: string[] = [];
  const own = t.byProvider['band-console'];
  const personal = t.byProvider['personal-mixer'];
  const tbc = t.byProvider.tbc;
  if (own.mixes) apartLines.push(`Apart, and not added to that number: ${channelsIn(own)} that your band creates in the band monitor rig.`);
  if (personal.mixes) apartLines.push(`Apart, and not added to that number: ${channelsIn(personal)} on a personal mixer system (not mixed on the house console).`);
  if (tbc.mixes) apartLines.push(`Apart, and not added to that number: ${channelsIn(tbc)}, with who creates ${tbc.mixes === 1 ? 'it' : 'them'} still to be confirmed.`);
  return {
    mixes,
    houseFeedChannels: house,
    devices,
    byType,
    mixLine: spmMixLine(t.all),
    apartLines,
    deviceLine: devices ? `${count(devices, 'monitor device', 'monitor devices')}: ${spmList(byType.map((x) => spDeviceCountWord(x.type, x.n)))}.` : 'No monitor devices yet.',
  };
}

/* ── the mix list, by who creates each mix ──────────────────────────────── */

/** What is requested from the HOUSE console. Mixes created anywhere else,
 *  and mixes nobody is named to create, are not in this sentence. This is
 *  the one place the screen says it in words (the count box above it holds
 *  the number): one fact is not said three times (review 2). */
export function spmHouseSentence(t: SpMonitorTotals): string {
  const h = t.house;
  if (!h.mixes) return t.all.mixes ? 'Nothing is requested from the house console: no mix on this list is created there.' : 'Nothing is requested from the house console yet.';
  return `${count(h.mixes, 'mix is', 'mixes are')} requested from the house console (${spmFormatWords(h)}): ${count(h.channels, 'monitor feed audio channel', 'monitor feed audio channels')}.`;
}

/** The outputs note: a number only for the one case the band can know (one
 *  output for each AUDIO CHANNEL, never for each mix), and the reason the
 *  real number is the venue's to confirm. '' when nothing is requested from
 *  the house console. */
export function spmHouseOutputNote(t: SpMonitorTotals): string {
  const n = t.house.channels;
  if (!n) return '';
  return `If each audio channel is carried on its own analog console output, that is ${count(n, 'output', 'outputs')}. The real number depends on how the venue sends the feeds to the stage: to be confirmed with the venue.`;
}

/** What the band creates in the band monitor rig. '' when it creates none. */
export function spmBandSentence(t: SpMonitorTotals): string {
  const b = t.byProvider['band-console'];
  if (!b.mixes) return '';
  return `Your band creates ${count(b.mixes, 'mix', 'mixes')} in the band monitor rig (${spmFormatWords(b)}). That is ${count(b.channels, 'audio channel that is', 'audio channels that are')} not requested from the house console.`;
}

/** Mixes on a personal mixer system. '' when there are none. */
export function spmPersonalSentence(t: SpMonitorTotals): string {
  const b = t.byProvider['personal-mixer'];
  if (!b.mixes) return '';
  return `${count(b.mixes, 'mix is', 'mixes are')} made on a personal mixer system (${spmFormatWords(b)}), not mixed on the house console. That is ${count(b.channels, 'audio channel', 'audio channels')} inside that system.`;
}

/** Said when a personal mixer system is on the list (handoff §5). */
export const SPM_PERSONAL_MIXER_NOTE = 'A personal mixer system is fed as one system. It is not one house console output for each performer.';

/** Mixes nobody is named to create yet: counted in no place until answered. */
export function spmTbcSentence(t: SpMonitorTotals): string {
  const n = t.byProvider.tbc.mixes;
  if (!n) return '';
  return n === 1
    ? 'For 1 mix, who creates it is to be confirmed. It is not counted for the house console or for the band monitor rig.'
    : `For ${n} mixes, who creates them is to be confirmed. They are not counted for the house console or for the band monitor rig.`;
}

const FEED_ORDER: readonly SpVenueFeed[] = ['split', 'feeds', 'returns', 'none', 'tbc'];

/** For the mixes the house console does not create: what the venue provides,
 *  one line for each answer, naming the mixes it is about. `only` narrows it
 *  to one group. */
export function spmVenueFeedLines(p: SpProject, only: (m: SpMix) => boolean = spmOffHouse): string[] {
  const mixes = p.mixes.filter((m) => spmOffHouse(m) && only(m));
  const out: string[] = [];
  for (const feed of FEED_ORDER) {
    const codes = mixes.filter((m) => m.venueFeed === feed).map((m) => m.code);
    if (!codes.length) continue;
    // a request to the venue, never a statement of what it has agreed to
    out.push(feed === 'tbc' ? `For ${spmList(codes)}, what is requested from the venue is to be confirmed.` : feed === 'none' ? `For ${spmList(codes)}, nothing is requested from the venue: no monitor feeds.` : `For ${spmList(codes)}, requested from the venue: ${lowerFirst(SP_VENUE_FEED_WORD[feed])}.`);
  }
  return out;
}

export type SpmMixGroup = {
  key: 'house' | 'band' | 'personal' | 'tbc';
  title: string;
  /** The group's count in words. */
  sentence: string;
  /** Further lines: the outputs note, what the venue provides. */
  notes: string[];
  mixes: SpMix[];
};

/** The mix list, kept in groups by who creates each mix. The house group is
 *  always there once a mix exists, so the screen can say "nothing is requested
 *  from the house console" in words. [] when there is no mix at all. */
export function spmMixGroups(p: SpProject, t: SpMonitorTotals = spMonitorTotals(p)): SpmMixGroup[] {
  if (!p.mixes.length) return [];
  const out: SpmMixGroup[] = [];
  const houseNote = spmHouseOutputNote(t);
  out.push({ key: 'house', title: 'REQUESTED FROM THE HOUSE CONSOLE', sentence: spmHouseSentence(t), notes: houseNote ? [houseNote] : [], mixes: p.mixes.filter((m) => m.provider === 'house') });
  const band = p.mixes.filter(spmOwnRig);
  if (band.length) out.push({ key: 'band', title: 'CREATED IN THE BAND MONITOR RIG', sentence: spmBandSentence(t), notes: [SPM_BAND_RIG_MEANS, ...spmVenueFeedLines(p, spmOwnRig)], mixes: band });
  const personal = p.mixes.filter((m) => m.provider === 'personal-mixer');
  if (personal.length) out.push({ key: 'personal', title: 'ON A PERSONAL MIXER SYSTEM', sentence: spmPersonalSentence(t), notes: [SPM_PERSONAL_MIXER_NOTE, ...spmVenueFeedLines(p, (m) => m.provider === 'personal-mixer')], mixes: personal });
  const tbc = p.mixes.filter((m) => m.provider === 'tbc');
  if (tbc.length) out.push({ key: 'tbc', title: 'WHO CREATES IT: TO BE CONFIRMED', sentence: spmTbcSentence(t), notes: [], mixes: tbc });
  return out;
}

/* ── one mix, in words ──────────────────────────────────────────────────── */

export const spmMixTitle = (m: { code: string; name: string }): string => `${m.code}${m.name.trim() ? ` ${m.name.trim()}` : ''}`;

export const spmPerformerName = (pf: SpPerformer | undefined): string => (pf ? pf.name.trim() || 'Unnamed performer' : '');

/** "Sam", "Tito and Yolanda", or '' when nobody is on the mix. Read from the
 *  performers each time, so it follows a rename. */
export function spmRecipients(p: SpProject, m: SpMix): string {
  return spmList(m.recipients.map((id) => spmPerformerName(p.performers.find((x) => x.id === id))).filter(Boolean));
}

/** Who a mix is for, as the line under its name: "For Sam". A fill covers an
 *  area of the stage, so it may name nobody; any other mix with nobody on it
 *  says so as something still to do. */
export function spmMixFor(p: SpProject, m: SpMix): string {
  const who = spmRecipients(p, m);
  if (who) return `For ${who}`;
  return m.delivery === 'drum-fill' || m.delivery === 'sidefill' ? 'For an area of the stage, with no performer named' : 'Nobody is on this mix yet';
}

/** The format with its audio channels: never just "stereo". */
export const spmFormatWord = (f: SpMixFormat): string => (f === 'stereo' ? 'Stereo: 2 audio channels' : 'Mono: 1 audio channel');

export const spmDevicesOfMix = (p: SpProject, mixId: SpId): SpDevice[] => p.devices.filter((d) => d.mixId === mixId);

export const spmDeviceTitle = (d: { label: string; type: SpDeviceType }): string => d.label.trim() || SP_DEVICE_WORD[d.type];

/** Are the mix labels M1, M2, M3… in the order of the list? A label is kept
 *  when another mix is removed; renumbering is asked for, never automatic. */
export const spmCodesInOrder = (p: SpProject): boolean => p.mixes.every((m, k) => m.code === `M${k + 1}`);

/** The devices on one mix, in words. */
export function spmMixDevicesLine(p: SpProject, m: SpMix): string {
  const devs = spmDevicesOfMix(p, m.id);
  return devs.length ? `Devices on this mix: ${spmList(devs.map(spmDeviceTitle))}.` : 'No device is on this mix yet.';
}

/** A wireless in-ear mix that has devices and no transmitter among them (the
 *  review asks the same question). A pack with no transmitter is not a
 *  working system, and the transmitter is what the venue must be told of. */
export function spmNeedsTransmitter(p: SpProject, m: SpMix): boolean {
  const devs = spmDevicesOfMix(p, m.id);
  return m.delivery === 'wireless-iem' && devs.length > 0 && !devs.some((d) => d.type === 'iem-tx');
}

/** When two or more devices of one type share a mix: say that the mix count
 *  and the audio channels did NOT change. For a house mix with nothing
 *  written under "Requested output channels or sockets", how the devices are
 *  fed is the open question, said with what an answer looks like (the
 *  packet's unresolved list asks the same one; handoff §11: never raise the
 *  requested outputs by itself). '' when nothing is shared. */
export function spmShareLine(p: SpProject, m: SpMix): string {
  const devs = spmDevicesOfMix(p, m.id);
  const shared = SPM_DEVICE_TYPES.map((type) => ({ type, n: devs.filter((d) => d.type === type).length })).filter((x) => x.n > 1);
  if (!shared.length) return '';
  const ch = spMixChannels(m);
  const base = `${upperFirst(spmList(shared.map((x) => spDeviceCountWord(x.type, x.n))))} share this mix. It is still 1 mix and ${count(ch, 'audio channel', 'audio channels')}.`;
  return spmShareOpen(p, m) ? `${base} How they are fed (linked from one output, or one output each) is to be confirmed.` : base;
}

/** Is "how its devices are fed" still open for this mix? (A house mix, two
 *  or more devices of one type, nothing typed under the requested outputs.) */
export function spmShareOpen(p: SpProject, m: SpMix): boolean {
  if (m.provider !== 'house' || m.outputs.trim()) return false;
  const devs = spmDevicesOfMix(p, m.id);
  return SPM_DEVICE_TYPES.some((type) => devs.filter((d) => d.type === type).length > 1);
}

/** Where the answer is typed, said beside the question on the mix card… */
export const SPM_SHARE_WHERE_CARD = 'Type it under EDIT MIX › MORE DETAILS, or leave it for the venue.';
/** …and inside the mix popup, where MORE DETAILS is opened for it. */
export const SPM_SHARE_WHERE_POPUP = 'Type it under MORE DETAILS, in “Requested output channels or sockets”, or leave it for the venue.';

/** A name offered for a new mix, from the ROLES of who is on it ("Drums",
 *  "Bass and vocal, in-ear"). Never a performer's name: the mix would keep
 *  the old name after a rename. '' when a role is missing; the mix then shows
 *  its label and who is on it, and the band can type a name. */
export function spmSuggestName(p: SpProject, recipients: readonly SpId[], delivery: SpDelivery): string {
  if (!recipients.length) return delivery === 'drum-fill' ? 'Drum fill' : delivery === 'sidefill' ? 'Sidefill' : '';
  const roles = recipients.map((id) => p.performers.find((x) => x.id === id)?.role.trim() ?? '');
  if (roles.some((r) => !r)) return '';
  // a role that has its own "and" ("Guitar and lead vocal") is set apart by
  // semicolons, so two roles never read as four ("…vocal and Bass and…")
  const who = roles.length > 1 && roles.some((r) => /\band\b|,/.test(r)) ? roles.join('; ') : spmList(roles);
  return delivery === 'wired-iem' || delivery === 'wireless-iem' ? `${who}, in-ear` : who;
}

/* ── the usual devices for a delivery ───────────────────────────────────── */

/** A device the screen PROPOSES for a mix. Shown as a row before it is
 *  added; the band can untick any of them. */
export type SpmDeviceRow = { key: string; type: SpDeviceType; label: string; performerId: SpId | null; wireless: boolean };

/** What the proposal assumes, said above the rows. */
export const SPM_USUAL_NOTE: Record<SpDelivery, string> = {
  wedge: 'One wedge. Add more later if several wedges play this mix: the number of mixes does not change.',
  'wired-iem': 'One wired headphone amplifier for each performer on the mix.',
  'wireless-iem': 'One transmitter, and one receiver pack for each performer. An extra pack does not need a new transmitter or a new mix.',
  'drum-fill': 'One drum fill.',
  sidefill: 'Two sidefills, one on each side of the stage, on the same mix.',
  custom: 'No device is proposed for a custom delivery. Add the devices you use.',
};

const NEW_LABEL: Record<SpDeviceType, { base: string; numbered: boolean }> = {
  wedge: { base: 'Wedge', numbered: true },
  'iem-tx': { base: 'In-ear transmitter', numbered: false },
  'iem-pack': { base: 'Receiver pack', numbered: false },
  'hp-amp': { base: 'Headphone amplifier', numbered: false },
  'drum-fill': { base: 'Drum fill', numbered: false },
  sidefill: { base: 'Sidefill', numbered: false },
  'personal-mixer': { base: 'Personal mixer', numbered: true },
  custom: { base: '', numbered: false },
};

/** A label no other device has: "Wedge 3", or "Drum fill" then "Drum fill 2". */
function freeLabel(base: string, used: Set<string>, numbered: boolean): string {
  if (!base) return '';
  let label = base;
  if (numbered || used.has(base.toLowerCase())) {
    let n = numbered ? 1 : 2;
    while (used.has(`${base} ${n}`.toLowerCase())) n += 1;
    label = `${base} ${n}`;
  }
  used.add(label.toLowerCase());
  return label;
}
const usedLabels = (p: SpProject): Set<string> => new Set(p.devices.map((d) => d.label.trim().toLowerCase()).filter(Boolean));
const newLabel = (type: SpDeviceType, used: Set<string>): string => freeLabel(NEW_LABEL[type].base, used, NEW_LABEL[type].numbered);

/** The label a new device of this type gets. The Stage area uses the same
 *  one, so a device has one name whichever door it came through. */
export const spmNewDeviceLabel = (p: SpProject, type: SpDeviceType): string => newLabel(type, usedLabels(p));

/** The usual devices for a mix delivered this way, for these performers.
 *  A PROPOSAL: nothing is added until the band says so. A label never holds
 *  a performer's name; a pack or a headphone amplifier is LINKED to the
 *  performer who uses it. Only a transmitter is marked wireless: the radio
 *  frequency coordination is recorded once for a transmitter and its packs. */
export function spmUsualDevices(p: SpProject, f: { delivery: SpDelivery; recipients: readonly SpId[]; provider?: SpMixProvider }): SpmDeviceRow[] {
  const used = usedLabels(p);
  const people = f.recipients.filter((id) => p.performers.some((x) => x.id === id));
  const row = (type: SpDeviceType, label: string, performerId: SpId | null, n: number): SpmDeviceRow => ({ key: `${type}:${performerId ?? n}`, type, label, performerId, wireless: type === 'iem-tx' });
  const personal = (type: SpDeviceType): SpmDeviceRow[] => (people.length ? people.map((id, k) => row(type, newLabel(type, used), id, k)) : [row(type, newLabel(type, used), null, 0)]);
  switch (f.delivery) {
    case 'wedge':
      return [row('wedge', newLabel('wedge', used), null, 0)];
    case 'wired-iem':
      // A personal mixer drives the earphones itself: no separate headphone
      // amplifier is taught or listed (R2-SP2-06).
      return personal(f.provider === 'personal-mixer' ? 'personal-mixer' : 'hp-amp');
    case 'wireless-iem':
      return [row('iem-tx', newLabel('iem-tx', used), null, 0), ...personal('iem-pack')];
    case 'drum-fill':
      return [row('drum-fill', newLabel('drum-fill', used), null, 0)];
    case 'sidefill':
      return [row('sidefill', freeLabel('Sidefill, stage right', used, false), null, 0), row('sidefill', freeLabel('Sidefill, stage left', used, false), null, 1)];
    default:
      return [];
  }
}

/** A proposed row in words: its label, and who uses it when it is personal. */
export function spmRowWord(p: SpProject, r: SpmDeviceRow): string {
  const who = spmPerformerName(p.performers.find((x) => x.id === r.performerId));
  return who ? `${spmDeviceTitle(r)} for ${who}` : spmDeviceTitle(r);
}

export type SpmMixDraft = { recipients: SpId[]; format: SpMixFormat; provider: SpMixProvider; delivery: SpDelivery; venueFeed: SpVenueFeed };

export const spmBlankDraft = (recipients: SpId[] = []): SpmMixDraft => ({ recipients, format: 'mono', provider: 'tbc', delivery: 'wedge', venueFeed: 'tbc' });

/** What "ADD THIS MIX" is about to add, in words, before it is added. */
export const spmDraftLine = (draft: SpmMixDraft, devices: number): string =>
  `This adds 1 mix (${draft.format === 'stereo' ? 'stereo, 2 audio channels' : 'mono, 1 audio channel'}) and ${devices ? count(devices, 'device', 'devices') : 'no device'}.`;

/** Put proposed devices on a mix that is already there. Devices on a mix the
 *  band creates in the band monitor rig start as part of that rig. Who brings each
 *  device starts as "to be confirmed". No mix is added or changed. */
export function spmAddDevicesToMix(p: SpProject, mixId: SpId, rows: readonly SpmDeviceRow[]): { p: SpProject; deviceIds: SpId[] } {
  const mix = p.mixes.find((m) => m.id === mixId);
  if (!mix) return { p, deviceIds: [] };
  let q = p;
  const deviceIds: SpId[] = [];
  for (const r of rows) {
    const d = spAddDevice(q, { type: r.type, label: r.label, mixId, performerId: r.performerId, wireless: r.wireless, selfContained: spmOwnRig(mix) });
    q = d.p;
    deviceIds.push(d.id);
  }
  return { p: q, deviceIds };
}

/** Add a mix and the device rows the band kept, as one edit of the project. */
export function spmAddMixWithDevices(p: SpProject, draft: SpmMixDraft, rows: readonly SpmDeviceRow[]): { p: SpProject; mixId: SpId; deviceIds: SpId[] } {
  const a = spAddMix(p, {
    name: spmSuggestName(p, draft.recipients, draft.delivery),
    recipients: [...draft.recipients],
    format: draft.format,
    provider: draft.provider,
    delivery: draft.delivery,
    venueFeed: spmOffHouse(draft) ? draft.venueFeed : 'tbc',
  });
  const d = spmAddDevicesToMix(a.p, a.id, rows);
  return { p: d.p, mixId: a.id, deviceIds: d.deviceIds };
}

/** Add one device, optionally on a mix. It never adds a mix and never
 *  changes a mix: several devices can share one. */
export function spmAddDevice(p: SpProject, type: SpDeviceType, mixId: SpId | null): { p: SpProject; id: SpId } {
  const mix = mixId ? p.mixes.find((m) => m.id === mixId) : undefined;
  return spAddDevice(p, { type, label: spmNewDeviceLabel(p, type), mixId: mix ? mix.id : null, selfContained: mix ? spmOwnRig(mix) : false });
}

/* ── devices, in words ──────────────────────────────────────────────────── */

export type SpmDeviceGroup = { type: SpDeviceType; /** "2 wedges" */ heading: string; /** "The venue brings all 2." */ brings: string; devices: SpDevice[] };

const WHO_BRINGS: Record<SpSupplier, string> = { band: 'the band', venue: 'the venue', other: 'another provider', tbc: '' };

/** Who brings the devices of one kind, with no zero count and no bare
 *  category word: "The venue brings all 9.", "The band brings it.", "Who
 *  brings it: to be confirmed.", "The band brings 2 and the venue brings 1." */
export function spmBringsLine(b: SpBySupplier, n: number): string {
  const kinds = (['band', 'venue', 'other', 'tbc'] as const).filter((k) => b[k] > 0);
  if (kinds.length === 1) {
    const k = kinds[0];
    // "both" for two: "brings all 2" reads as a slip (bug test, S3 17)
    if (k === 'tbc') return n === 1 ? 'Who brings it: to be confirmed.' : `Who brings them: to be confirmed for ${n === 2 ? 'both' : `all ${n}`}.`;
    return n === 1 ? `${upperFirst(WHO_BRINGS[k])} brings it.` : `${upperFirst(WHO_BRINGS[k])} brings ${n === 2 ? 'both' : `all ${n}`}.`;
  }
  return `${upperFirst(spmList(kinds.map((k) => (k === 'tbc' ? `${b[k]} ${b[k] === 1 ? 'is' : 'are'} still to be confirmed` : `${WHO_BRINGS[k]} brings ${b[k]}`))))}.`;
}

/** The device list by kind, each with its own count and who brings them. */
export function spmDeviceGroups(p: SpProject, t: SpMonitorTotals = spMonitorTotals(p)): SpmDeviceGroup[] {
  return SPM_DEVICE_TYPES.filter((type) => t.devices[type] > 0).map((type) => ({
    type,
    heading: spDeviceCountWord(type, t.devices[type]),
    brings: spmBringsLine(t.devicesBySupplier[type], t.devices[type]),
    devices: p.devices.filter((d) => d.type === type),
  }));
}

/** One device's place in the plan: its type, the mix it is on, who uses it. */
export function spmDeviceFacts(p: SpProject, d: SpDevice): string {
  const parts: string[] = [SP_DEVICE_WORD[d.type]];
  const mix = d.mixId ? p.mixes.find((m) => m.id === d.mixId) : undefined;
  if (mix) parts.push(`On ${spmMixTitle(mix)}`);
  else parts.push(d.selfContained ? 'No mix requested from the venue' : 'Not on any mix');
  if (d.selfContained) parts.push('Part of the band monitor rig');
  const who = spmPerformerName(p.performers.find((x) => x.id === d.performerId));
  if (who) parts.push(`Used by ${who}`);
  return parts.join(' · ');
}

/** Who brings a device: the Inputs area's own words for the same fact (its
 *  function, so the two areas cannot drift apart). */
export const spmBrings = (s: SpSupplier): string => spBringsWord(s);

/** The wireless tag of a device (shown in CAPITALS). */
export const SPM_WIRELESS_TAG = 'Wireless: agree radio frequencies with the venue';

/** Said for every wireless device. The plan records the need; it never
 *  chooses a frequency. */
export const SPM_WIRELESS_NOTE = 'Wireless: radio frequency coordination is needed. The venue must check that its radio equipment and yours do not disturb each other. This tool records that. It does not choose radio frequencies.';

/** Said on a receiver pack that is not marked wireless. */
export const SPM_PACK_NOTE = 'A receiver pack is covered by its transmitter: the radio frequency coordination is recorded once, on the transmitter. Turn this on only when no transmitter is listed for this pack.';

export function spmDeviceTags(d: SpDevice): string[] {
  const out = [spmBrings(d.supplier)];
  if (d.wireless) out.push(SPM_WIRELESS_TAG);
  return out;
}

export type SpmDeviceStage = {
  objectId: SpId | null;
  /** The whole line, with no full stop: "On the stage: Downstage center". */
  line: string;
  /** The button that goes to the stage for it. */
  button: 'LOCATE ON THE STAGE' | 'PLACE ON THE STAGE' | 'DRAW IT ANYWAY';
  /** A receiver pack with no symbol: it is worn, so nothing is left undone. */
  worn: boolean;
};

/** Where a device is on the stage, and the button that goes there. A
 *  receiver pack is WORN: with no symbol it says so, and is not shown as
 *  something still to place (review 2). */
export function spmDeviceStage(p: SpProject, deviceId: SpId): SpmDeviceStage {
  const o = p.objects.find((x) => x.deviceId === deviceId);
  if (o) return { objectId: o.id, line: `On the stage: ${spLocationWord(o)}`, button: 'LOCATE ON THE STAGE', worn: false };
  const d = p.devices.find((x) => x.id === deviceId);
  if (d?.type === 'iem-pack') {
    const who = spmPerformerName(p.performers.find((x) => x.id === d.performerId));
    return { objectId: null, line: who ? `Worn by ${who}: it needs no symbol on the stage` : 'A receiver pack is worn: it needs no symbol on the stage', button: 'DRAW IT ANYWAY', worn: true };
  }
  return { objectId: null, line: 'Not on the stage yet', button: 'PLACE ON THE STAGE', worn: false };
}

/* ── the needs grid, one mix at a time ──────────────────────────────────── */

/** The label of an input that is kept out of the audience mix. */
export const SPM_MONITOR_ONLY = 'MONITOR ONLY: kept out of the audience mix';

/** The prominent label of a click, cue or talkback input (or of any input set
 *  to monitor only); null for an ordinary input. A click that goes to the
 *  audience says so just as plainly, and says when the band answered that the
 *  audience is meant to hear it. */
export function spmAudienceLabel(i: Pick<SpInput, 'cue' | 'audience'> & { cueAudienceOk?: boolean }): string | null {
  if (i.audience === 'monitor-only') return SPM_MONITOR_ONLY;
  if (!i.cue) return null;
  if (i.audience === 'tbc') return 'CLICK OR CUE: audience mix or monitor only, to be confirmed';
  return i.cueAudienceOk ? 'CLICK OR CUE: the audience is meant to hear it' : 'CLICK OR CUE: set to go to the AUDIENCE mix';
}

export type SpmNeedRow = {
  inputId: SpId;
  /** The channel number printed beside the input everywhere. */
  badge: string;
  label: string;
  performerName: string;
  /** The "MONITOR ONLY" label, or null. */
  audienceLabel: string | null;
  /** null = no preference recorded. */
  need: SpMixNeed | null;
  /** It belongs to one of the performers on this mix. */
  own: boolean;
};

/** One mix's inputs as rows, in the band's channel order. */
export function spmNeedRows(p: SpProject, mixId: SpId): SpmNeedRow[] {
  const mix = p.mixes.find((m) => m.id === mixId);
  if (!mix) return [];
  return spAllInputsInOrder(p).map((i) => {
    const source = p.sources.find((s) => s.id === i.sourceId);
    const performer = source?.performerId ? p.performers.find((x) => x.id === source.performerId) : undefined;
    return {
      inputId: i.id,
      badge: spBadge(p, i.id),
      label: i.label,
      performerName: spmPerformerName(performer),
      audienceLabel: spmAudienceLabel(i),
      need: mix.needs[i.id] ?? null,
      own: !!performer && mix.recipients.includes(performer.id),
    };
  });
}

/** "Primary: 2 · Supporting: 3 · Must exclude: 1 · No preference yet: 8". */
export function spmNeedSummary(rows: readonly SpmNeedRow[]): string {
  if (!rows.length) return 'There are no inputs yet.';
  const parts = SPM_NEEDS.map((k) => ({ k, n: rows.filter((r) => r.need === k).length }))
    .filter((x) => x.n > 0)
    .map((x) => `${SP_NEED_WORD[x.k]}: ${x.n}`);
  const none = rows.filter((r) => r.need == null).length;
  if (none) parts.push(`No preference yet: ${none}`);
  return parts.join(' · ');
}

export type SpmCueLine = { inputId: SpId; badge: string; label: string; audienceLabel: string; /** Which mixes hear it and which keep it out. */ heard: string };

/** Every click, cue, talkback or monitor-only input, with its label and what
 *  each mix does with it. */
export function spmCueLines(p: SpProject): SpmCueLine[] {
  const out: SpmCueLine[] = [];
  for (const i of spAllInputsInOrder(p)) {
    const audienceLabel = spmAudienceLabel(i);
    if (!audienceLabel) continue;
    const heardIn = p.mixes.filter((m) => m.needs[i.id] === 'primary' || m.needs[i.id] === 'supporting').map((m) => `${m.code} (${SP_NEED_WORD[m.needs[i.id]]})`);
    const codes = (need: SpMixNeed | null) => p.mixes.filter((m) => (m.needs[i.id] ?? null) === need).map((m) => m.code);
    const parts: string[] = [];
    if (!p.mixes.length) parts.push('There are no mixes yet.');
    else parts.push(heardIn.length ? `Heard in ${spmList(heardIn)}.` : 'No mix asks to hear it.');
    if (codes('exclude').length) parts.push(`Must exclude: ${spmList(codes('exclude'))}.`);
    if (codes('not-needed').length) parts.push(`Not needed: ${spmList(codes('not-needed'))}.`);
    if (codes(null).length) parts.push(`No preference yet: ${spmList(codes(null))}.`);
    out.push({ inputId: i.id, badge: spBadge(p, i.id), label: i.label, audienceLabel, heard: parts.join(' ') });
  }
  return out;
}

/* ── short instructions ─────────────────────────────────────────────────── */

const CLICK_YES = 'Click required';
const CLICK_NO = 'No click';

/** Turn one short instruction on or off. "Click required" and "No click"
 *  cannot both be on: choosing one takes the other off. */
export function spmToggleInstruction(list: readonly string[], word: string): string[] {
  if (list.includes(word)) return list.filter((x) => x !== word);
  const opposite = word === CLICK_YES ? CLICK_NO : word === CLICK_NO ? CLICK_YES : '';
  return [...list.filter((x) => x !== opposite), word];
}

/** The band's own instructions: the ones that are not on the short list. */
export const spmOwnInstructions = (list: readonly string[]): string[] => list.filter((x) => !SP_MIX_INSTRUCTIONS.includes(x));

/** Add an instruction in the band's own words (nothing is added twice). */
export function spmAddOwnInstruction(list: readonly string[], text: string): string[] {
  const t = text.trim();
  if (!t || list.some((x) => x.toLowerCase() === t.toLowerCase())) return [...list];
  return [...list, t];
}

/** Where a mix's short instruction and its needs grid say opposite things
 *  about the click. The screen shows these; it changes neither. */
export function spmClickNotes(p: SpProject, m: SpMix): string[] {
  const cues = p.inputs.filter((i) => i.cue);
  const out: string[] = [];
  if (m.instructions.includes(CLICK_YES)) {
    if (!cues.length) out.push('This mix says “Click required”, and there is no click or cue input in the input list yet.');
    else if (cues.every((i) => m.needs[i.id] === 'exclude' || m.needs[i.id] === 'not-needed')) out.push(`This mix says “Click required”, and ${spmList(cues.map((i) => i.label))} is kept out of what it hears. Change one of the two so they agree.`);
  }
  if (m.instructions.includes(CLICK_NO)) {
    const heard = cues.filter((i) => m.needs[i.id] === 'primary' || m.needs[i.id] === 'supporting');
    if (heard.length) out.push(`This mix says “No click”, and ${spmList(heard.map((i) => i.label))} is set to be heard in it. Change one of the two so they agree.`);
  }
  // the same kind of disagreement about the performer's own vocal or instrument
  for (const c of spOwnClashes(p, m)) out.push(`This mix says “${c.instruction}”, and ${spmList(c.labels)} is kept out of what it hears. Change one of the two so they agree.`);
  return out;
}

/* ── performers and their monitors ──────────────────────────────────────── */

const hasMonitor = (p: SpProject, id: SpId): boolean => p.mixes.some((m) => m.recipients.includes(id)) || p.devices.some((d) => d.performerId === id && d.selfContained);

/** Performers with no monitor and no answer yet (the review asks about them). */
export const spmUnmonitored = (p: SpProject): SpPerformer[] => p.performers.filter((pf) => pf.noMonitor !== true && !hasMonitor(p, pf.id));

/** Performers the band said need no monitor, and who are on no mix. */
export const spmNoMonitorByChoice = (p: SpProject): SpPerformer[] => p.performers.filter((pf) => pf.noMonitor === true && !hasMonitor(p, pf.id));

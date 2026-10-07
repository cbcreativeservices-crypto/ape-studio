/**
 * MIXING GUIDES — the ONE template every style guide fills (owner 2026-10-07:
 * "a written reference … the lab should use a template format").
 *
 * The owner's 50 guides (assets/Mixing-Guides-50-Styles, read only) share one
 * structure: an at-a-glance box of six rows, then thirteen numbered sections
 * and a source list. The template keeps all thirteen, in the owner's order,
 * and the six glance rows; the sources stay in the owner's documents and
 * docs/labs/mixing (learner text carries no citations — owner ruling
 * 2026-10-04). Four sections are tables (EQ, compression, effects, live vs
 * studio), each with optional notes under it; the rest are prose items, some
 * with a bold run-in label ("Bass:", "Mistake:").
 *
 * A section a guide does not cover is EMPTY and listed in `empty` (today no
 * guide has one — see docs/labs/mixing/MIXING_GUIDES_LAB.md).
 *
 * Data: one generated file per style under ./guides (scripts/mixing-guides/
 * convert.py), the light index in ./index.ts, the lazy loader in ./load.ts.
 */

/** One prose item: a paragraph, or a bullet; `label` is the bold run-in.
 *  `before`: a table's note the owner wrote ABOVE the table (a lead-in). */
export type GuideText = { label?: string; text: string; bullet?: boolean; before?: boolean };

export type EqRow = { source: string; cut: string; boost: string; notes: string };
export type CompRow = { source: string; use: string; ratio: string; attackRelease: string; gainReduction: string; notes: string };
export type FxRow = { effect: string; appliedTo: string; setting: string; amount: string };
export type LiveStudioRow = { area: string; live: string; studio: string };
export type GuideTable<R> = { rows: R[]; notes: GuideText[] };

/** The six "At a glance" rows, as the owner's guides name them. */
export type Glance = {
  origin: string;
  tempo: string;
  ensemble: string;
  priority: string;
  liveSpl: string;
  studioLoudness: string;
};

export type ProseKey = 'purpose' | 'instruments' | 'arrangement' | 'dynamics' | 'balance' | 'vocals' | 'loudness' | 'notes';
export type TableKey = 'eq' | 'compression' | 'fx' | 'liveStudio';
export type GuideSectionKey = ProseKey | TableKey | 'references';

export type MixingGuide = {
  /** Stable id (the owner's file name without its number), e.g. 'hip-hop-rap'. */
  id: string;
  /** Position in the owner's index (1–50). */
  num: number;
  title: string;
  /** "What the audience expects": a sentence (or two) of the guide's own
   *  section 1, shown first. */
  expects: string;
  glance: Glance;
  purpose: GuideText[];
  instruments: GuideText[];
  arrangement: GuideText[];
  dynamics: GuideText[];
  balance: GuideText[];
  eq: GuideTable<EqRow>;
  compression: GuideTable<CompRow>;
  fx: GuideTable<FxRow>;
  vocals: GuideText[];
  loudness: GuideText[];
  liveStudio: GuideTable<LiveStudioRow>;
  notes: GuideText[];
  /** Reference recordings: artist, title, year (as the owner wrote them). */
  references: string[];
  /** Sections this guide leaves empty, named so it is explicit, never silent. */
  empty: GuideSectionKey[];
};

/** The template's sections, in the owner's order, with the page heading. */
export const GUIDE_SECTIONS: readonly { key: GuideSectionKey; title: string }[] = [
  { key: 'purpose', title: 'Purpose & audience expectations' },
  { key: 'instruments', title: 'Instruments' },
  { key: 'arrangement', title: 'Ensemble & arrangement' },
  { key: 'dynamics', title: 'Dynamics' },
  { key: 'balance', title: 'Balance & blend' },
  { key: 'eq', title: 'EQ starting points' },
  { key: 'compression', title: 'Compression & dynamics processing' },
  { key: 'fx', title: 'Effects & amounts' },
  { key: 'vocals', title: 'Vocal treatment' },
  { key: 'loudness', title: 'SPL & loudness' },
  { key: 'liveStudio', title: 'Live vs studio' },
  { key: 'notes', title: 'Engineer’s notes & common mistakes' },
  { key: 'references', title: 'Reference recordings' },
];

export const TABLE_KEYS: readonly TableKey[] = ['eq', 'compression', 'fx', 'liveStudio'];

/** The glance rows, labelled as the owner's guides label them. */
export const GLANCE_ROWS: readonly { key: keyof Glance; label: string }[] = [
  { key: 'origin', label: 'Origin / region' },
  { key: 'tempo', label: 'Typical tempo' },
  { key: 'ensemble', label: 'Typical ensemble size' },
  { key: 'priority', label: 'Mix priority #1' },
  { key: 'liveSpl', label: 'Live SPL (FOH, average)' },
  { key: 'studioLoudness', label: 'Studio / streaming loudness' },
];

/** Column labels for the four tables (the owner's headers). The first column
 *  heads each row card; the rest are labelled lines inside it. */
export const TABLE_COLUMNS = {
  eq: [
    { key: 'source', label: 'Source' },
    { key: 'cut', label: 'Cut' },
    { key: 'boost', label: 'Boost' },
    { key: 'notes', label: 'Notes' },
  ],
  compression: [
    { key: 'source', label: 'Source' },
    { key: 'use', label: 'Use it' },
    { key: 'ratio', label: 'Ratio' },
    { key: 'attackRelease', label: 'Attack / release' },
    { key: 'gainReduction', label: 'Gain reduction' },
    { key: 'notes', label: 'Notes' },
  ],
  fx: [
    { key: 'effect', label: 'Effect' },
    { key: 'appliedTo', label: 'Applied to' },
    { key: 'setting', label: 'Setting' },
    { key: 'amount', label: 'Amount' },
  ],
  liveStudio: [
    { key: 'area', label: 'Area' },
    { key: 'live', label: 'Live (FOH)' },
    { key: 'studio', label: 'Studio mix' },
  ],
} as const;

/** The house line on every guide (owner ruling 2026-10-04: starting points,
 *  not rules; the owner's own guides open the same way). */
export const STARTING_POINTS_LINE =
  'Starting points, not rules. Put on a reference track in the style, match its level, listen and adjust to the song, the artist and the room.';

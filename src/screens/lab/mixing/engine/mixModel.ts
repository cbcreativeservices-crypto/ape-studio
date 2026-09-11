/**
 * Mixing lab — the MIX MODEL (owner brief 2026-09-11). Pure data + math.
 *
 * The central lesson, verbatim from the brief: "Mixing is a sequence of
 * listening decisions used to create balance, clarity, depth, movement, and
 * emotional focus." Everything here serves that sentence: the five
 * dimensions, the eight-track session, gain-staging arithmetic, and the
 * static-mix / subtractive-decision scaffolding the exercises execute
 * against. test/mixingEngine.test.ts pins all of it.
 */

/* ── The five dimensions (section 1) ─────────────────────────────────────── */

export const DIMENSIONS = [
  { id: 'balance', name: 'Balance', question: 'What is louder or softer?' },
  { id: 'frequency', name: 'Frequency', question: 'Which sounds occupy each range?' },
  { id: 'width', name: 'Pan & width', question: 'Where does each sound appear?' },
  { id: 'depth', name: 'Depth', question: 'What sounds close, distant, dry, or reverberant?' },
  { id: 'movement', name: 'Movement', question: 'How does the mix change from section to section?' },
] as const;

export type DimensionId = (typeof DIMENSIONS)[number]['id'];

/** The learner's first decision: the mix's focal point. Every option is a
 *  legitimate professional answer — the exercise scores COMMITMENT, not a
 *  "correct" choice (subjective calls have no single right answer). */
export const FOCAL_CHOICES = [
  { id: 'vocal', name: 'Lead vocal', note: 'Most songs: the story rides in front.' },
  { id: 'groove', name: 'The groove', note: 'Drums + bass carry it; everything else serves the pocket.' },
  { id: 'instrument', name: 'A featured instrument', note: 'The hook lives in an instrument — give it the vocal’s seat.' },
  { id: 'atmosphere', name: 'The atmosphere', note: 'Texture and space ARE the point — focus can be a feeling.' },
] as const;

/* ── The session (used through BOTH labs) ────────────────────────────────── */

export type TrackId = 'kick' | 'snare' | 'perc' | 'bass' | 'gtr' | 'keys' | 'lead' | 'bgv';

export interface SessionTrack {
  id: TrackId;
  /** Console-strip name (short caps). */
  name: string;
  /** What it honestly is in the SYNTHESIZED session (no fake vocals — the
   *  lead/backing parts are synth stand-ins until real rights-cleared stems
   *  land; see docs/APE_MIXING_LAB_ASSETS manifest). */
  source: string;
  /** Rough fundamental range, for the masking pages. */
  lowHz: number;
  highHz: number;
  /** Default static-mix importance order (1 = anchor first). Teaching order,
   *  not a law — the exercise lets the learner pick their own anchor. */
  importance: number;
}

export const SESSION_TRACKS: readonly SessionTrack[] = [
  { id: 'kick', name: 'KICK', source: 'synth kick drum', lowHz: 45, highHz: 120, importance: 2 },
  { id: 'snare', name: 'SNARE', source: 'synth snare (noise burst)', lowHz: 150, highHz: 4000, importance: 3 },
  { id: 'perc', name: 'PERC', source: 'hat/shaker pattern', lowHz: 2000, highHz: 12000, importance: 6 },
  { id: 'bass', name: 'BASS', source: 'synth bass line', lowHz: 40, highHz: 250, importance: 4 },
  { id: 'gtr', name: 'GTR', source: 'plucked comp figure', lowHz: 180, highHz: 3500, importance: 5 },
  { id: 'keys', name: 'KEYS', source: 'sustained chord pad', lowHz: 130, highHz: 2500, importance: 7 },
  { id: 'lead', name: 'LEAD', source: 'lead line (synth stand-in for the vocal)', lowHz: 200, highHz: 3000, importance: 1 },
  { id: 'bgv', name: 'BGV', source: 'backing pad (stand-in for backing vocals)', lowHz: 250, highHz: 2200, importance: 8 },
] as const;

export const TRACK_IDS: readonly TrackId[] = SESSION_TRACKS.map((t) => t.id);

export function track(id: TrackId): SessionTrack {
  return SESSION_TRACKS.find((t) => t.id === id)!;
}

/* ── Gain staging (section 4) ────────────────────────────────────────────── */

export const db2lin = (db: number) => Math.pow(10, db / 20);
export const lin2db = (lin: number) => 20 * Math.log10(Math.max(lin, 1e-9));

/** Peak of a sum of N equal, CORRELATED peaks at `peakDb` each — the honest
 *  worst case the headroom page teaches (correlated peaks add linearly:
 *  two identical −6 dB peaks can reach 0 dB). */
export function correlatedSumPeakDb(peakDb: number, n: number): number {
  return lin2db(db2lin(peakDb) * n);
}

/** Headroom left below 0 dBFS. Negative = clipped. */
export function headroomDb(peakDb: number): number {
  return -peakDb;
}

/** The "louder sounds better" page's arithmetic: raising a fader by +x dB and
 *  judging it better is only a fair test after matching by −x dB. */
export function levelMatchOffsetDb(aRmsDb: number, bRmsDb: number): number {
  return aRmsDb - bRmsDb;
}

/* ── Masking overlap (sections 6/8 groundwork) ───────────────────────────── */

/** Octave-overlap between two tracks' fundamental ranges, 0..1 — the model
 *  behind "kick and bass fight; hat and bass don't". Shared octaves over the
 *  narrower track's span. */
export function maskingOverlap(a: SessionTrack, b: SessionTrack): number {
  const lo = Math.max(a.lowHz, b.lowHz);
  const hi = Math.min(a.highHz, b.highHz);
  if (hi <= lo) return 0;
  const shared = Math.log2(hi / lo);
  const narrower = Math.min(Math.log2(a.highHz / a.lowHz), Math.log2(b.highHz / b.lowHz));
  return Math.min(1, shared / narrower);
}

/* ── Subtractive mixing (section 6): the decision families ───────────────── */

export type SubtractiveMove =
  | 'arrangement' // mute an unnecessary layer
  | 'level' // lower the competitor instead of raising the focal sound
  | 'frequency' // reduce masking frequencies before boosting elsewhere
  | 'processing' // bypass a plugin that isn't clearly improving things
  | 'space' // reduce reverb/delay/width when crowded
  | 'automation'; // remove an element so its return lands harder

export const SUBTRACTIVE_MOVES: readonly { id: SubtractiveMove; name: string; blurb: string }[] = [
  { id: 'arrangement', name: 'Arrangement subtraction', blurb: 'Mute a layer the section doesn’t need.' },
  { id: 'level', name: 'Level subtraction', blurb: 'Lower the competing sound instead of raising the focal one again.' },
  { id: 'frequency', name: 'Frequency subtraction', blurb: 'Reduce masking frequencies before boosting new ones.' },
  { id: 'processing', name: 'Processing subtraction', blurb: 'Bypass a plugin that isn’t clearly earning its place.' },
  { id: 'space', name: 'Space subtraction', blurb: 'Pull back reverb, delay or width when the mix crowds.' },
  { id: 'automation', name: 'Automation subtraction', blurb: 'Take something away so its return hits harder.' },
] as const;

/* ── Static mix (section 5): the build order scaffold ────────────────────── */

/** Valid "add next" candidates given what's already in: the anchor first,
 *  then anything — the exercise nudges importance order but accepts any
 *  order once the anchor is placed (a mixing decision, not a rule). */
export function staticMixHint(added: readonly TrackId[], anchor: TrackId): TrackId | null {
  if (added.length === 0) return anchor;
  const remaining = SESSION_TRACKS.filter((t) => !added.includes(t.id)).sort((a, b) => a.importance - b.importance);
  return remaining[0]?.id ?? null;
}

/* ── Pan positions (section 7): the width vocabulary ─────────────────────── */

/** Pan is −100 (hard left) … 0 … +100. The mono-stability rule the page
 *  teaches: focal + low-frequency anchors live at/near centre. */
export function panRisk(t: SessionTrack, pan: number): 'stable' | 'lowEndOffCentre' | 'focalOffCentre' | null {
  const off = Math.abs(pan) > 25;
  if (!off) return 'stable';
  if (t.lowHz < 100) return 'lowEndOffCentre';
  if (t.importance <= 2) return 'focalOffCentre';
  return null; // supporting element off-centre: legitimate
}

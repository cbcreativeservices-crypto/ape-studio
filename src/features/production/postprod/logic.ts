/**
 * Post-Production — computed rules for stages 1 to 4 (the owner's Chapter 1).
 *
 * Same contract as the Pre-Production logic: the words live in the `.data.ts`
 * files, every comparison lives here against the same ruleId, and a rule with
 * no implementation is reported by `missingLogic()` and fails the tests rather
 * than silently never firing.
 *
 * The two standing principles carry over unchanged. A rule that fires on a
 * healthy project is worse than no rule, so every check returns false when its
 * inputs are missing. And a nudge-level false positive is acceptable where a
 * missed match is not.
 */
import type { RuleContext } from '../rules';
import { registerRuleLogic, cell, cellNum, daysBetween, many, num, rows, str, when } from '../rules';

// ── shared vocabulary ────────────────────────────────────────────────────────

/**
 * Words that mean "nothing here" in a free-text cell, matching the
 * Pre-Production definition so the two labs agree about what empty means.
 */
const READS_AS_EMPTY = /^(none|n\/?a|no|nil|tbc|tbd|unknown|-{1,3})$/i;
export const blank = (v: string): boolean => v.trim() === '' || READS_AS_EMPTY.test(v.trim());

/** Loose word match. Used wherever an intent says "match words loosely". */
export const mentions = (haystack: string, re: RegExp): boolean => re.test(haystack.toLowerCase());

/**
 * "A deadline within a number of days ahead that ccode chooses" — the window
 * `brief-material-still-changing` asks for.
 *
 * Six weeks, because unlike Pre-Production's three-week window this one is
 * about a schedule rather than about a day: a production still recording six
 * weeks from delivery has time to absorb a slip, and one at five weeks does not.
 */
const DEADLINE_SOON_DAYS = 42;

/** Sample rates and bit depths compare as numbers; the options store strings. */
const RATE = (v: unknown): number | null => {
  const s = String(v ?? '').trim();
  if (s === '' || s === 'unknown' || s === 'na' || s === 'undecided') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

/** 32-bit float counts as the deepest. Returns null for "not specified". */
const DEPTH = (v: unknown): number | null => {
  const s = String(v ?? '').trim();
  if (s === '32f') return 32;
  if (s === '16') return 16;
  if (s === '24') return 24;
  return null;
};

/** Distinct non-null values of one column across a table. */
const distinct = (table: Record<string, unknown>[], column: string, skip: string[] = []): string[] => {
  const out = new Set<string>();
  for (const r of table) {
    const v = cell(r, column);
    if (v !== '' && !skip.includes(v)) out.add(v);
  }
  return [...out];
};

/** Is this project's delivery a real picture job? */
const hasPicture = (ctx: RuleContext): boolean => {
  const fr = str(ctx.get('brief', 'frame_rate'));
  return fr !== '' && fr !== 'none' && fr !== 'unknown';
};

// ── stage 1 · brief ──────────────────────────────────────────────────────────

/** Names that are an organisation or a group rather than one person. */
const GROUP_WORDS = /\b(team|label|committee|board|client|department|group|management|the\s+\w+s)\b/i;
const JOINS_TWO = /\s(?:and|&|\/|,)\s|\s*&\s*/;

registerRuleLogic({
  'brief-no-written-spec': (ctx) =>
    ['verbal', 'assumed', 'none'].includes(str(ctx.get('brief', 'spec_source'))),

  'brief-no-approval-authority': (ctx) => str(ctx.get('brief', 'approval_authority')) === '',

  'brief-approver-is-a-committee': (ctx) => {
    const who = str(ctx.get('brief', 'approval_authority'));
    if (who === '') return false; // the previous rule's business
    return GROUP_WORDS.test(who) || JOINS_TWO.test(who);
  },

  'brief-material-still-changing': (ctx) => {
    const status = str(ctx.get('brief', 'production_status'));
    if (status === 'ongoing' || status === 'unknown') return true;
    if (status !== 'mostly') return false;
    const deadline = when(ctx.get('brief', 'deadline'));
    if (deadline === null) return false;
    const away = daysBetween(ctx.now, deadline);
    return away >= 0 && away <= DEADLINE_SOON_DAYS;
  },

  'brief-missing-material-unowned': (ctx) =>
    rows(ctx.get('brief', 'materials_missing')).some(
      (r) =>
        cell(r, 'mm_owner') === '' || cell(r, 'mm_by') === '' || cell(r, 'mm_status') === 'unknown',
    ),

  'brief-material-will-not-arrive': (ctx) =>
    rows(ctx.get('brief', 'materials_missing')).some((r) => cell(r, 'mm_status') === 'will_not_arrive') &&
    str(ctx.get('brief', 'open_questions')) === '',

  'brief-nothing-received': (ctx) => rows(ctx.get('brief', 'materials_received')).length === 0,

  'brief-received-unverified': (ctx) =>
    rows(ctx.get('brief', 'materials_received')).some((r) => cell(r, 'mr_state') === 'unverified'),

  /**
   * Fires on an explicit "nobody has told me", NOT on an empty field.
   *
   * The distinction is the whole reason this can be a blocker at all: a blocker
   * cannot be outscored, so one that fires before the user has typed anything
   * makes the readiness meter meaningless from the first screen (owner,
   * 2026-09-17, on the Pre-Production demotions). An unanswered required field
   * is already reported by the required-field machinery. Choosing "not yet
   * specified" is a different statement — it says the crew asked and nobody
   * knows — and on a picture job that genuinely does stop the work.
   *
   * `none` is the answer for an audio-only job and must never block it.
   */
  'brief-no-frame-rate': (ctx) => str(ctx.get('brief', 'frame_rate')) === 'unknown',

  'brief-loudness-target-unset': (ctx) =>
    num(ctx.get('brief', 'loudness_target')) === null && num(ctx.get('brief', 'true_peak_max')) === null,

  'brief-tolerance-without-target': (ctx) =>
    num(ctx.get('brief', 'loudness_tolerance')) !== null &&
    num(ctx.get('brief', 'loudness_target')) === null,

  'brief-true-peak-implausible': (ctx) => {
    const tp = num(ctx.get('brief', 'true_peak_max'));
    if (tp === null) return false;
    return tp > 0 || tp < -20;
  },

  'brief-versions-without-stems': (ctx) => {
    const v = many(ctx.get('brief', 'required_versions'));
    const needsStems = ['instrumental', 'acappella', 'me', 'clean'].some((k) => v.includes(k));
    return needsStems && !v.includes('stems');
  },

  'brief-no-creative-brief': (ctx) =>
    str(ctx.get('brief', 'creative_brief')) === '' &&
    str(ctx.get('brief', 'references')) === '' &&
    str(ctx.get('brief', 'sonic_character')) === '',

  'brief-prohibited-not-recorded': (ctx) =>
    str(ctx.get('brief', 'prohibited_changes')) === '' &&
    str(ctx.get('brief', 'must_stay_natural')) === '' &&
    !ctx.isNa('brief', 'prohibited_changes') &&
    !ctx.isNa('brief', 'must_stay_natural'),
});

// ── stage 2 · media ──────────────────────────────────────────────────────────

/** Verification that actually proves bytes, rather than proving names. */
const REAL_VERIFICATION = ['checksum', 'app_verify', 'file_size', 'playback'];

/** Is any verification recorded at all? */
const verified = (ctx: RuleContext): boolean => {
  const methods = many(ctx.get('media', 'verify_method')).filter((m) => m !== 'none');
  return methods.length > 0 && str(ctx.get('media', 'verify_coverage')) !== 'none';
};

/** Two paths that are really the same place, or the same volume. */
function samePlace(a: string, b: string): boolean {
  const norm = (s: string) => s.trim().replace(/[\\/]+$/, '').replace(/\\/g, '/').toLowerCase();
  const x = norm(a);
  const y = norm(b);
  if (x === '' || y === '') return false;
  if (x === y) return true;
  // Same volume: the first two path segments match (e.g. /Volumes/Work/...).
  const vol = (s: string) => s.split('/').filter(Boolean).slice(0, 2).join('/');
  return vol(x) !== '' && vol(x) === vol(y);
}

const audioRows = (ctx: RuleContext) =>
  rows(ctx.get('media', 'media_inventory')).filter((r) => cell(r, 'mi_type') === 'audio');

registerRuleLogic({
  'media-originals-unprotected': (ctx) =>
    ['convention', 'no'].includes(str(ctx.get('media', 'originals_read_only'))),

  'media-sources-cleared-early': (ctx) => {
    const intact = str(ctx.get('media', 'source_still_intact'));
    if (intact !== 'partly' && intact !== 'no') return false;
    return !verified(ctx) || str(ctx.get('media', 'verify_coverage')) !== 'all';
  },

  'media-no-verification': (ctx) => !verified(ctx),

  'media-verification-is-names-only': (ctx) => {
    const methods = many(ctx.get('media', 'verify_method'));
    return methods.includes('file_count') && !REAL_VERIFICATION.some((m) => methods.includes(m));
  },

  'media-drag-copy-unverified': (ctx) => {
    const how = str(ctx.get('media', 'copy_procedure'));
    if (how !== 'drag' && how !== 'unknown') return false;
    const methods = many(ctx.get('media', 'verify_method'));
    return !methods.includes('checksum') && !methods.includes('app_verify');
  },

  'media-no-real-backup': (ctx) => {
    const backup = str(ctx.get('media', 'backup_location'));
    if (backup === '') return true;
    return samePlace(backup, str(ctx.get('media', 'working_location')));
  },

  'media-all-in-one-place': (ctx) => str(ctx.get('media', 'backup_offsite')) === 'no',

  'media-empty-inventory': (ctx) => rows(ctx.get('media', 'media_inventory')).length === 0,

  'media-bad-files-present': (ctx) =>
    rows(ctx.get('media', 'media_inventory')).some((r) =>
      ['corrupt', 'truncated', 'missing'].includes(cell(r, 'mi_status')),
    ) && str(ctx.get('media', 'problem_plan')) === '',

  'media-mixed-sample-rates': (ctx) => {
    const distinctRates = distinct(audioRows(ctx), 'mi_rate', ['na']);
    if (distinctRates.length < 2) return false;
    const policy = str(ctx.get('media', 'conversion_policy'));
    return policy === 'undecided' || policy === '';
  },

  'media-rate-conflicts-delivery': (ctx) => {
    const target = RATE(ctx.get('brief', 'target_sample_rate'));
    if (target === null) return false;
    return audioRows(ctx).some((r) => {
      const rate = RATE(cell(r, 'mi_rate'));
      return rate !== null && rate < target;
    });
  },

  'media-frame-rate-conflict': (ctx) => {
    const videoRows = rows(ctx.get('media', 'media_inventory')).filter(
      (r) => cell(r, 'mi_type') === 'video',
    );
    const rates = distinct(videoRows, 'mi_frame_rate', ['na']);
    if (rates.length > 1) return true;
    const briefRate = str(ctx.get('brief', 'frame_rate'));
    if (briefRate === '' || briefRate === 'none' || briefRate === 'unknown') return false;
    return rates.some((r) => r !== briefRate && r !== 'vfr');
  },

  'media-variable-frame-rate': (ctx) => {
    const anyVfr =
      rows(ctx.get('media', 'media_inventory')).some((r) => cell(r, 'mi_frame_rate') === 'vfr') ||
      many(ctx.get('media', 'known_problems')).includes('vfr');
    return anyVfr && str(ctx.get('media', 'problem_plan')) === '';
  },

  'media-duplicate-filenames': (ctx) => {
    const inventory = rows(ctx.get('media', 'media_inventory'));
    if (inventory.some((r) => cell(r, 'mi_status') === 'duplicate')) return true;
    const seen = new Set<string>();
    for (const r of inventory) {
      const name = cell(r, 'mi_file').toLowerCase();
      if (name === '') continue;
      if (seen.has(name)) return true;
      seen.add(name);
    }
    return false;
  },

  'media-no-ingest-owner': (ctx) =>
    str(ctx.get('media', 'ingest_owner')) === '' && str(ctx.get('media', 'ingest_log')) === '',
});

// ── stage 3 · session ────────────────────────────────────────────────────────

/** The corrections that actually address a changing offset. */
const STRETCHING_CURES = ['stretch', 'reconform', 'replace'];

registerRuleLogic({
  'session-rate-conflicts-delivery': (ctx) => {
    const target = RATE(ctx.get('brief', 'target_sample_rate'));
    const session = RATE(ctx.get('session', 'session_rate'));
    return target !== null && session !== null && target !== session;
  },

  'session-depth-below-delivery': (ctx) => {
    const target = DEPTH(ctx.get('brief', 'target_bit_depth'));
    const session = DEPTH(ctx.get('session', 'session_depth'));
    return target !== null && session !== null && session < target;
  },

  'session-frame-rate-mismatch': (ctx) => {
    const briefRate = str(ctx.get('brief', 'frame_rate'));
    const sessionRate = str(ctx.get('session', 'session_frame_rate'));
    const real = (v: string) => v !== '' && v !== 'none' && v !== 'unknown';
    if (!real(briefRate) || !real(sessionRate)) return false;
    // Drop-frame and non-drop are deliberately NOT the same answer.
    return briefRate !== sessionRate;
  },

  'session-dropframe-undecided': (ctx) => {
    const rate = str(ctx.get('session', 'session_frame_rate'));
    if (rate !== '29_97_df' && rate !== '29_97_ndf') return false;
    return str(ctx.get('session', 'session_start')) === '';
  },

  'session-free-running-recorders': (ctx) => {
    const count = str(ctx.get('session', 'recorder_count'));
    if (count !== 'several_free' && count !== 'unknown') return false;
    return str(ctx.get('session', 'sync_checked_at_end')) !== 'yes';
  },

  'session-sync-unverified-at-end': (ctx) =>
    str(ctx.get('session', 'sync_checked_at_end')) === 'no' ||
    rows(ctx.get('session', 'sync_table')).some((r) => cell(r, 'sy_holds') === 'unchecked'),

  'session-drift-undiagnosed': (ctx) => {
    const moving = rows(ctx.get('session', 'sync_table')).some((r) =>
      ['drifts', 'jumps'].includes(cell(r, 'sy_holds')),
    );
    if (!moving) return false;
    const diagnosis = str(ctx.get('session', 'drift_diagnosis'));
    return diagnosis === '' || diagnosis === 'unknown';
  },

  'session-drift-wrong-cure': (ctx) => {
    const cause = str(ctx.get('session', 'drift_diagnosis'));
    const action = str(ctx.get('session', 'drift_action'));
    if (action === '') return false;
    const changing = ['clock_drift', 'rate_mismatch', 'pull', 'speed'].includes(cause);
    if (changing && (action === 'move' || action === 'accept')) return true;
    return cause === 'constant_offset' && action === 'stretch';
  },

  'session-no-sync-source': (ctx) => {
    const sources = many(ctx.get('session', 'sync_sources'));
    if (sources.length === 0) return true;
    return (
      sources.length === 1 && sources[0] === 'manual' && rows(ctx.get('session', 'sync_table')).length > 0
    );
  },

  'session-manual-sync-only': (ctx) => {
    const count = str(ctx.get('session', 'recorder_count'));
    if (count !== 'several_free' && count !== 'several_locked') return false;
    const sources = many(ctx.get('session', 'sync_sources'));
    if (!sources.includes('manual')) return false;
    return !['embedded_tc', 'recorded_tc', 'slate', 'waveform'].some((s) => sources.includes(s));
  },

  'session-no-folder-structure': (ctx) => str(ctx.get('session', 'folder_structure')) === '',

  'session-naming-not-convention': (ctx) => {
    const name = str(ctx.get('session', 'naming_rule'));
    if (name === '') return false;
    if (/\b(final|latest|new|newest|use ?this|copy|corrected|good ?one)\b/i.test(name)) return true;
    const hasPattern = /[_\-./|]|\{|\[|<|\b(then|followed by)\b/i.test(name);
    return !hasPattern && name.split(/\s+/).length < 4;
  },

  'session-version-not-identifiable': (ctx) => {
    const fields = many(ctx.get('session', 'version_fields'));
    if (fields.length === 0) return true;
    if (!fields.includes('number')) return true;
    if (!fields.includes('date') && !fields.includes('description')) return true;
    return (
      fields.includes('description') &&
      str(ctx.get('session', 'version_log')) === '' &&
      !ctx.isNa('session', 'version_log')
    );
  },

  'session-no-track-structure': (ctx) => rows(ctx.get('session', 'track_layout')).length === 0,

  'session-unlocked-picture': (ctx) => str(ctx.get('session', 'video_reference')) === 'unlocked',
});

// ── stage 4 · edit ───────────────────────────────────────────────────────────

/** Selection reasons that are about the performance rather than the recording. */
const CREATIVE_CRITERIA = ['performance', 'emotion', 'phrasing', 'timing', 'continuity'];
const TECHNICAL_CRITERIA = ['technical', 'noise'];

/**
 * Read a multiChoice column out of a table row.
 *
 * `TableRow` cells are scalars, and the table editor renders every column as a
 * text input, so a multiChoice column arrives as comma-separated text in
 * practice. The array branch is kept because a seed or a future editor may
 * supply one, and a check that only handled one shape would fail silently on
 * the other.
 */
const cellMany = (row: Record<string, unknown>, column: string): string[] => {
  const v = row[column];
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
  const s = cell(row, column);
  if (s === '') return [];
  return s
    .split(/[,;|]/)
    .map((p) => p.trim())
    .filter((p) => p !== '');
};

/**
 * "Differ by more than a percentage that ccode chooses" — the tolerance on
 * `edit-duration-off-target`.
 *
 * Ten per cent, because an assembly is expected to be long: it is the version
 * before the tightening pass. Below ten per cent the difference is trimming;
 * above it, material has to come out, and that is a decision rather than a task.
 */
const DURATION_TOLERANCE = 0.1;

/** Techniques that open a hole in the background where something used to be. */
const GAP_OPENING = ['false_starts', 'pauses', 'repeats', 'reorder', 'replace_words', 'combine'];

registerRuleLogic({
  'edit-review-incomplete': (ctx) => {
    const reviewed = str(ctx.get('edit', 'review_done'));
    if (reviewed !== 'spot' && reviewed !== 'none') return false;
    return ['partial', 'complete'].includes(str(ctx.get('edit', 'assembly_state')));
  },

  'edit-chosen-on-technical-only': (ctx) => {
    const preferred = rows(ctx.get('edit', 'take_log')).filter(
      (r) => cell(r, 'tk_verdict') === 'preferred',
    );
    if (preferred.length === 0) return false;
    const reasons = preferred.flatMap((r) => cellMany(r, 'tk_chosen_on'));
    if (reasons.length === 0) return false;
    const anyCreative = reasons.some((c) => CREATIVE_CRITERIA.includes(c));
    const anyTechnical = reasons.some((c) => TECHNICAL_CRITERIA.includes(c));
    return !anyCreative && anyTechnical;
  },

  'edit-preferred-no-reason': (ctx) =>
    rows(ctx.get('edit', 'take_log')).some(
      (r) =>
        cell(r, 'tk_verdict') === 'preferred' &&
        cell(r, 'tk_reason') === '' &&
        cellMany(r, 'tk_chosen_on').length === 0,
    ),

  'edit-alternates-deleted': (ctx) => str(ctx.get('edit', 'alternates_preserved')) === 'deleted',

  'edit-duration-off-target': (ctx) => {
    const target = num(ctx.get('brief', 'program_duration'));
    const actual = num(ctx.get('edit', 'assembly_duration'));
    if (target === null || actual === null || target === 0) return false;
    return Math.abs(actual - target) / target > DURATION_TOLERANCE;
  },

  'edit-gaps-not-marked': (ctx) => str(ctx.get('edit', 'missing_marked')) === 'silent',

  'edit-temp-material-unflagged': (ctx) => {
    if (!['partial', 'complete'].includes(str(ctx.get('edit', 'assembly_state')))) return false;
    return str(ctx.get('edit', 'temp_material')) === '' && !ctx.isNa('edit', 'temp_material');
  },

  'edit-no-handles': (ctx) => str(ctx.get('edit', 'handles_preserved')) === 'no',

  'edit-no-room-tone': (ctx) => {
    const tone = str(ctx.get('edit', 'room_tone_available'));
    if (tone === 'little' || tone === 'none') return true;
    if (str(ctx.get('edit', 'gaps_filled')) !== 'no') return false;
    return many(ctx.get('edit', 'speech_techniques')).some((t) => GAP_OPENING.includes(t));
  },

  'edit-breaths-removed': (ctx) => str(ctx.get('edit', 'breaths_kept')) === 'removed',

  'edit-faults-not-checked': (ctx) =>
    str(ctx.get('edit', 'assembly_state')) === 'complete' &&
    many(ctx.get('edit', 'edit_faults_checked')).length < 3,

  'edit-grouped-tracks-split': (ctx) => {
    const shared = str(ctx.get('edit', 'grouped_edits_shared'));
    return shared === 'individual' || shared === 'mostly';
  },

  'edit-comp-without-musical-criteria': (ctx) => {
    const approach = str(ctx.get('edit', 'comp_approach'));
    if (approach === '' || approach === 'single_take') return false;
    const criteria = many(ctx.get('edit', 'comp_criteria'));
    if (criteria.length === 0) return false;
    return !['emotion', 'phrasing', 'dynamics', 'tone', 'articulation'].some((c) => criteria.includes(c));
  },

  'edit-repair-without-comparison': (ctx) => {
    const repairing = rows(ctx.get('edit', 'problem_list')).some((r) =>
      ['reduce', 'repair'].includes(cell(r, 'pb_action')),
    );
    if (!repairing) return false;
    if (str(ctx.get('edit', 'artifact_check')) === 'no') return true;
    const how = many(ctx.get('edit', 'comparison_method'));
    return !how.includes('difference') && !how.includes('level_matched');
  },

  'edit-over-repair-on-subtle': (ctx) =>
    rows(ctx.get('edit', 'problem_list')).some(
      (r) =>
        cell(r, 'pb_severity') === 'subtle' &&
        ['repair', 'rerecord', 'adr'].includes(cell(r, 'pb_action')),
    ),

  'edit-problem-no-action': (ctx) =>
    rows(ctx.get('edit', 'problem_list')).some((r) => cell(r, 'pb_action') === ''),
});

/** Exported so stage 5–8's logic and the activity checks cannot drift apart. */
export { cellMany, distinct, RATE, DEPTH, hasPicture, samePlace, DURATION_TOLERANCE, cellNum };

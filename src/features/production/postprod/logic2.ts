/**
 * Post-Production — computed rules for stages 5 to 8 (the owner's Chapters 2
 * and 3), and the activity checks for all eight exercises.
 *
 * Split from `logic.ts` by chapter, not by concern. Both are side-effect
 * imports from the registry, and a rule whose logic never registers is a rule
 * that silently never fires — which `missingLogic()` reports and the tests
 * fail on.
 */
import type { RuleContext } from '../rules';
import { registerRuleLogic, cell, cellNum, many, num, rows, str } from '../rules';
import type { ActivityContext } from '../activities';
import { registerActivityChecks } from '../activities';
import { blank, mentions, cellMany, RATE, DEPTH } from './logic';

// ── shared ───────────────────────────────────────────────────────────────────

/** A rights `status` cell that says the material may not be used as it stands. */
const RIGHTS_BAD = ['Missing', 'Expired'];

/**
 * "A loudness range below a threshold that ccode chooses" — the flatness test
 * in `finish-over-limited`.
 *
 * 4 LU. Speech programmes commonly sit between 4 and 8; below 4 the programme
 * has lost the ability to emphasise anything, which is the specific damage the
 * spec warns about when it says not to force everything to the loudest level.
 */
const FLAT_LRA = 4;

/**
 * "A default tolerance when none is set" — for `finish-loudness-out-of-spec`.
 * 1 LU is the tightest common specification, so using it when the brief records
 * no tolerance errs towards asking rather than towards silence.
 */
const DEFAULT_LOUDNESS_TOLERANCE = 1;

/** Deliverable states that mean the file has left the building. */
const SENT = ['uploaded', 'received', 'verified', 'accepted'];

const deliverables = (ctx: RuleContext | ActivityContext) => rows(ctx.get('deliver', 'deliverables'));
const anySent = (ctx: RuleContext | ActivityContext): boolean =>
  deliverables(ctx).some((r) => SENT.includes(cell(r, 'dl_state')));

// ── stage 5 · build ──────────────────────────────────────────────────────────

/** Cue rows that have actually been recorded, rather than merely planned. */
const recordedCues = (ctx: RuleContext) =>
  rows(ctx.get('build', 'cue_list')).filter((r) =>
    ['recorded', 'edited', 'approved'].includes(cell(r, 'cu_status')),
  );

/** Every rights-bearing row across the two tables that carry rights. */
const rightsRows = (ctx: RuleContext) => [
  ...rows(ctx.get('build', 'effects_list')).map((r) => ({ row: r, col: 'fx_rights', id: 'fx_what' })),
  ...rows(ctx.get('build', 'music_cues')).map((r) => ({ row: r, col: 'mu_rights', id: 'mu_cue' })),
];

registerRuleLogic({
  'build-replacement-unmatched': (ctx) =>
    recordedCues(ctx).length > 0 && many(ctx.get('build', 'match_plan')).length === 0,

  'build-replacement-judged-soloed': (ctx) =>
    recordedCues(ctx).length > 0 && ['soloed', 'no'].includes(str(ctx.get('build', 'match_verified'))),

  'build-cue-no-reason': (ctx) =>
    rows(ctx.get('build', 'cue_list')).some((r) => cell(r, 'cu_reason') === ''),

  'build-replacement-needed-no-cues': (ctx) =>
    str(ctx.get('build', 'replacement_needed')) === 'yes' && rows(ctx.get('build', 'cue_list')).length === 0,

  'build-ambience-per-clip': (ctx) => str(ctx.get('build', 'ambience_continuous')) === 'per_clip',

  'build-loop-audible': (ctx) => str(ctx.get('build', 'loop_variation')) === 'looped',

  'build-no-perspective': (ctx) =>
    rows(ctx.get('build', 'effects_list')).length > 0 &&
    str(ctx.get('build', 'perspective_handled')) === 'no',

  'build-effect-no-purpose': (ctx) =>
    rows(ctx.get('build', 'effects_list')).some((r) => cell(r, 'fx_purpose') === ''),

  'build-rights-unresolved': (ctx) =>
    rightsRows(ctx).some(({ row, col }) => RIGHTS_BAD.includes(cell(row, col))),

  'build-rights-not-checked': (ctx) =>
    // A row with content and no status means nobody has looked. An empty row is
    // just an empty row.
    rightsRows(ctx).some(({ row, col, id }) => cell(row, id) !== '' && cell(row, col) === ''),

  'build-music-cue-no-purpose': (ctx) =>
    rows(ctx.get('build', 'music_cues')).some((r) => cell(r, 'mu_purpose') === ''),

  'build-music-cut-to-length': (ctx) => {
    const how = str(ctx.get('build', 'music_edits_musical'));
    if (how === 'to_length') return true;
    if (how !== 'none') return false;
    // "No music edits" while the cue table says otherwise.
    return rows(ctx.get('build', 'music_cues')).some((r) =>
      ['restructured', 'looped'].includes(cell(r, 'mu_edited')),
    );
  },

  'build-music-masks-speech': (ctx) => {
    const underSpeech = rows(ctx.get('build', 'music_cues')).some((r) =>
      ['score', 'theme', 'advert'].includes(cell(r, 'mu_type')),
    );
    if (!underSpeech) return false;
    const managed = many(ctx.get('build', 'music_speech_relationship')).filter((m) => m !== 'none');
    return managed.length === 0;
  },

  'build-correction-not-agreed': (ctx) => {
    if (many(ctx.get('build', 'correction_scope')).length === 0) return false;
    return ['not_discussed', 'prohibited'].includes(str(ctx.get('build', 'correction_decision')));
  },

  'build-correction-unguarded': (ctx) =>
    ['heavy', 'quantised'].includes(str(ctx.get('build', 'correction_amount'))) &&
    many(ctx.get('build', 'correction_guards')).length === 0,

  'build-correction-no-scale': (ctx) =>
    many(ctx.get('build', 'correction_scope')).includes('pitch') &&
    str(ctx.get('build', 'correction_target')) === '',

  'build-correction-not-compared': (ctx) =>
    many(ctx.get('build', 'correction_scope')).length > 0 &&
    ['no', 'soloed'].includes(str(ctx.get('build', 'correction_compared'))),
});

// ── stage 6 · mix ────────────────────────────────────────────────────────────

const busRows = (ctx: RuleContext) => rows(ctx.get('mix', 'bus_structure'));
const printRows = (ctx: RuleContext) => rows(ctx.get('mix', 'prints_made'));

/** Automation that is actually written, ignoring the explicit "nothing" answer. */
const realAutomation = (ctx: RuleContext): string[] =>
  many(ctx.get('mix', 'automation_used')).filter((a) => a !== 'none');

/**
 * Which stems could plausibly produce each alternate version the brief asks
 * for. Deliberately generous: this rule should catch a missing structure, not
 * argue about how somebody organises their stems.
 */
const VERSION_NEEDS: Record<string, string[]> = {
  instrumental: ['music', 'instruments', 'drums', 'bass'],
  acappella: ['lead_vocal', 'dialogue', 'narration'],
  me: ['music', 'effects', 'foley', 'backgrounds'],
  clean: ['dialogue', 'narration', 'lead_vocal', 'music', 'effects'],
};

registerRuleLogic({
  'mix-edit-not-locked': (ctx) => {
    const locked = str(ctx.get('mix', 'edits_confirmed'));
    if (locked === 'open') return true;
    return locked === 'mostly' && realAutomation(ctx).length > 0;
  },

  'mix-no-separate-version': (ctx) => str(ctx.get('mix', 'mix_version_created')) === 'no',

  'mix-no-static-balance': (ctx) => {
    const balance = str(ctx.get('mix', 'balance_first'));
    if (balance === 'no') return true;
    return balance === 'partly' && many(ctx.get('mix', 'processing_used')).length >= 4;
  },

  'mix-not-level-matched': (ctx) =>
    many(ctx.get('mix', 'processing_used')).length > 0 &&
    ['no', 'sometimes'].includes(str(ctx.get('mix', 'level_matched_comparisons'))),

  'mix-no-priority': (ctx) => str(ctx.get('mix', 'priority')) === '',

  'mix-no-headroom-plan': (ctx) => str(ctx.get('mix', 'headroom_plan')) === '',

  'mix-monitoring-level-varies': (ctx) => str(ctx.get('mix', 'monitoring_level_fixed')) === 'varies',

  'mix-one-system-only': (ctx) => many(ctx.get('mix', 'cross_checked')).length === 0,

  'mix-send-without-return': (ctx) => {
    const buses = busRows(ctx);
    const auxes = buses.filter((r) => cell(r, 'bs_kind') === 'aux');
    if (auxes.length === 0) return false;
    const returns = buses.filter((r) => cell(r, 'bs_kind') === 'return');
    if (returns.length === 0) return true;
    // A send whose destination names nothing that exists as another row.
    const names = buses.map((r) => cell(r, 'bs_name').toLowerCase()).filter((n) => n !== '');
    return auxes.some((a) => {
      const feeds = cell(a, 'bs_feeds').toLowerCase();
      if (feeds === '') return true;
      return !names.some((n) => feeds.includes(n) || n.includes(feeds));
    });
  },

  'mix-bus-not-in-stems': (ctx) =>
    busRows(ctx).some(
      (r) =>
        cell(r, 'bs_in_stems') === 'no' && ['group', 'vca', 'return', 'aux'].includes(cell(r, 'bs_kind')),
    ),

  'mix-stems-do-not-recombine': (ctx) => {
    const test = str(ctx.get('mix', 'recombination_test'));
    if (test === 'differs') return true;
    // An accepted difference nobody has described is an untested one.
    return test === 'close' && str(ctx.get('mix', 'recombination_difference')) === '';
  },

  'mix-stems-untested': (ctx) => {
    if (str(ctx.get('mix', 'recombination_test')) !== 'untested') return false;
    return (
      many(ctx.get('mix', 'stem_structure')).length > 0 ||
      printRows(ctx).some((r) => cell(r, 'pr_kind') === 'stem')
    );
  },

  'mix-master-processing-under-stems': (ctx) => {
    if (str(ctx.get('mix', 'master_processing')) !== 'heavy') return false;
    const test = str(ctx.get('mix', 'recombination_test'));
    return test !== 'nulls' && test !== 'no_stems';
  },

  'mix-versions-need-stems': (ctx) => {
    const wanted = many(ctx.get('brief', 'required_versions'));
    const stems = many(ctx.get('mix', 'stem_structure'));
    if (stems.length === 0) return false; // the stem rules say this better
    return Object.entries(VERSION_NEEDS).some(
      ([version, candidates]) => wanted.includes(version) && !candidates.some((c) => stems.includes(c)),
    );
  },

  'mix-automation-unchecked': (ctx) =>
    realAutomation(ctx).length > 0 && many(ctx.get('mix', 'automation_checked')).length === 0,

  'mix-static-where-it-should-move': (ctx) =>
    str(ctx.get('mix', 'static_or_dynamic')) === 'static' ||
    many(ctx.get('mix', 'automation_used')).join() === 'none',

  'mix-fold-down-unchecked': (ctx) =>
    ['5_1', '7_1', 'immersive', 'binaural'].includes(str(ctx.get('mix', 'mix_format'))) &&
    many(ctx.get('mix', 'fold_down_checked')).length === 0,

  'mix-all-bass-to-lfe': (ctx) => str(ctx.get('mix', 'lfe_policy')) === 'all_to_lfe',

  'mix-print-not-checked': (ctx) => {
    const prints = printRows(ctx);
    if (prints.length === 0) return false;
    if (prints.some((r) => cell(r, 'pr_checked') === 'not_checked')) return true;
    return many(ctx.get('mix', 'print_verification')).length === 0;
  },
});

// ── stage 7 · finish ─────────────────────────────────────────────────────────

const qcRows = (ctx: RuleContext) => rows(ctx.get('finish', 'qc_log'));
const processRows = (ctx: RuleContext) => rows(ctx.get('finish', 'processes_applied'));

registerRuleLogic({
  'finish-loudness-out-of-spec': (ctx) => {
    const target = num(ctx.get('brief', 'loudness_target'));
    const measured = num(ctx.get('finish', 'measured_integrated'));
    if (target === null || measured === null) return false;
    const tolerance = num(ctx.get('brief', 'loudness_tolerance')) ?? DEFAULT_LOUDNESS_TOLERANCE;
    return Math.abs(measured - target) > Math.abs(tolerance);
  },

  'finish-true-peak-over': (ctx) => {
    const ceiling = num(ctx.get('brief', 'true_peak_max'));
    const measured = num(ctx.get('finish', 'measured_true_peak'));
    if (ceiling === null || measured === null) return false;
    return measured > ceiling;
  },

  'finish-measured-wrong-thing': (ctx) =>
    ['session', 'estimate'].includes(str(ctx.get('finish', 'measurement_source'))),

  'finish-no-target-to-hit': (ctx) =>
    num(ctx.get('finish', 'measured_integrated')) !== null &&
    num(ctx.get('brief', 'loudness_target')) === null,

  'finish-over-limited': (ctx) => {
    const lra = num(ctx.get('finish', 'measured_lra'));
    if (lra === null || lra >= FLAT_LRA) return false;
    return ['compression', 'limiting'].includes(str(ctx.get('finish', 'loudness_action')));
  },

  'finish-process-without-purpose': (ctx) => processRows(ctx).some((r) => cell(r, 'ma_purpose') === ''),

  'finish-not-level-matched': (ctx) => {
    const processes = processRows(ctx);
    if (processes.length === 0) return false;
    if (processes.some((r) => cell(r, 'ma_compared') === 'no')) return true;
    return many(ctx.get('finish', 'comparison_set')).length === 0;
  },

  'finish-no-consideration-of-none': (ctx) =>
    str(ctx.get('finish', 'no_processing_considered')) === 'no' && processRows(ctx).length > 0,

  'finish-dither-repeated': (ctx) => str(ctx.get('finish', 'dither_applied')) === 'multiple',

  'finish-dither-not-considered': (ctx) => {
    if (str(ctx.get('finish', 'dither_applied')) !== 'not_considered') return false;
    const target = DEPTH(ctx.get('brief', 'target_bit_depth'));
    const session = DEPTH(ctx.get('session', 'session_depth'));
    return target === 16 && session !== null && session > 16;
  },

  'finish-no-full-listen': (ctx) =>
    ['no', 'partial', 'session'].includes(str(ctx.get('finish', 'full_playback_review'))),

  'finish-automated-only': (ctx) =>
    many(ctx.get('finish', 'automated_checks')).length >= 4 &&
    qcRows(ctx).length === 0 &&
    str(ctx.get('finish', 'full_playback_review')) === 'yes',

  'finish-qc-issue-unowned': (ctx) =>
    qcRows(ctx).some(
      (r) => cell(r, 'qc_where') === '' || cell(r, 'qc_owner') === '' || cell(r, 'qc_action') === '',
    ),

  'finish-blocking-qc-open': (ctx) =>
    // Fixed but unverified still counts as open when the issue blocks delivery.
    qcRows(ctx).some(
      (r) => cell(r, 'qc_severity') === 'blocking' && ['open', 'fixed'].includes(cell(r, 'qc_status')),
    ),

  'finish-encoded-unchecked': (ctx) => str(ctx.get('finish', 'encoded_check')) === 'no',

  'finish-no-creative-review': (ctx) => {
    if (str(ctx.get('finish', 'creative_review_done')) === 'no') return true;
    return (
      str(ctx.get('finish', 'meets_brief')) === 'no' && str(ctx.get('finish', 'creative_findings')) === ''
    );
  },

  'finish-collection-inconsistent': (ctx) =>
    ['album', 'series'].includes(str(ctx.get('finish', 'collection_context'))) &&
    many(ctx.get('finish', 'collection_checks')).length === 0,

  'finish-speech-buried': (ctx) => many(ctx.get('finish', 'speech_accessibility')).length === 0,

  'finish-access-timing-stale': (ctx) => {
    const needs = many(ctx.get('finish', 'access_deliverables'));
    const timed = ['captions', 'audio_desc', 'transcript'].some((d) => needs.includes(d));
    if (!timed) return false;
    return ['earlier_version', 'no'].includes(str(ctx.get('finish', 'access_timing_checked')));
  },
});

// ── stage 8 · deliver ────────────────────────────────────────────────────────

const noteRows = (ctx: RuleContext) => rows(ctx.get('deliver', 'notes_log'));

/** Required-version keys mapped onto the deliverable kinds that satisfy them. */
const VERSION_TO_KIND: Record<string, string[]> = {
  instrumental: ['instrumental'],
  acappella: ['acappella'],
  clean: ['clean'],
  radio_edit: ['radio_edit'],
  me: ['me'],
  stems: ['stem'],
  mono_fold: ['fold'],
  accessibility: ['accessibility'],
  review: ['review'],
};

const approvalOf = (ctx: RuleContext | ActivityContext) => str(ctx.get('deliver', 'final_approval'));

registerRuleLogic({
  'deliver-approved-version-lost': (ctx) => {
    const kept = str(ctx.get('deliver', 'approved_version_preserved'));
    if (kept === 'no') return true;
    // Nothing approved yet means there is nothing to lose.
    if (kept !== 'session_only') return false;
    return deliverables(ctx).some((r) => cell(r, 'dl_state') !== 'planned' && cell(r, 'dl_state') !== '');
  },

  'deliver-conflicting-notes-both-done': (ctx) =>
    ['both', 'unresolved'].includes(str(ctx.get('deliver', 'conflict_resolution'))),

  'deliver-note-unlocated': (ctx) =>
    noteRows(ctx).some((r) => cell(r, 'nt_where') === '' || cell(r, 'nt_owner') === ''),

  'deliver-note-unverified': (ctx) =>
    noteRows(ctx).some(
      (r) => ['completed', 'approved'].includes(cell(r, 'nt_status')) && cell(r, 'nt_verified') === '',
    ),

  'deliver-revision-without-recheck': (ctx) =>
    noteRows(ctx).some((r) => cell(r, 'nt_status') === 'completed') &&
    many(ctx.get('deliver', 'revision_reqc')).length === 0,

  'deliver-no-approval-record': (ctx) => {
    if (str(ctx.get('deliver', 'approval_record')) !== '') return false;
    return approvalOf(ctx) === 'Approved' || anySent(ctx);
  },

  'deliver-delivering-unapproved': (ctx) => {
    if (!anySent(ctx)) return false;
    const approval = approvalOf(ctx);
    return approval !== 'Approved' && approval !== 'Not required';
  },

  'deliver-spec-mismatch': (ctx) => {
    const rate = RATE(ctx.get('brief', 'target_sample_rate'));
    const depth = DEPTH(ctx.get('brief', 'target_bit_depth'));
    const config = str(ctx.get('brief', 'channel_config'));
    const wantChannels = config === 'mono' ? 1 : config === 'stereo' ? 2 : null;
    if (rate === null && depth === null && wantChannels === null) return false;
    return deliverables(ctx).some((r) => {
      // Caption and transcript files have no audio specification to disagree with.
      if (cell(r, 'dl_format') === 'text') return false;
      const rowRate = RATE(cell(r, 'dl_rate'));
      if (rate !== null && rowRate !== null && rowRate !== rate) return true;
      const rowDepth = DEPTH(cell(r, 'dl_depth'));
      if (depth !== null && rowDepth !== null && rowDepth !== depth) return true;
      const rowChannels = cellNum(r, 'dl_channels');
      // Stems and fold-downs legitimately differ in channel count.
      if (['stem', 'fold', 'document'].includes(cell(r, 'dl_kind'))) return false;
      return wantChannels !== null && rowChannels !== null && rowChannels !== wantChannels;
    });
  },

  'deliver-missing-required-version': (ctx) => {
    const wanted = many(ctx.get('brief', 'required_versions'));
    if (wanted.length === 0) return false;
    const made = deliverables(ctx).map((r) => cell(r, 'dl_kind'));
    if (made.length === 0) return false;
    return Object.entries(VERSION_TO_KIND).some(
      ([version, kinds]) => wanted.includes(version) && !kinds.some((k) => made.includes(k)),
    );
  },

  'deliver-naming-not-checked': (ctx) => {
    const checked = str(ctx.get('deliver', 'naming_matches_spec'));
    if (checked === 'approx' || checked === 'no') return true;
    return checked === 'no_convention' && str(ctx.get('brief', 'naming_requirement')) !== '';
  },

  'deliver-conversion-unplanned': (ctx) => str(ctx.get('deliver', 'conversion_needed')) === 'unplanned',

  'deliver-upload-is-not-delivery': (ctx) => {
    if (!anySent(ctx)) return false;
    if (!many(ctx.get('deliver', 'verify_steps')).includes('reopen')) return true;
    return ['local', 'no'].includes(str(ctx.get('deliver', 'verified_from_destination')));
  },

  'deliver-no-receipt': (ctx) =>
    anySent(ctx) && str(ctx.get('deliver', 'receipt_confirmed_by')) === '',

  'deliver-rejection-unresolved': (ctx) =>
    deliverables(ctx).some((r) => cell(r, 'dl_state') === 'rejected') &&
    str(ctx.get('deliver', 'rejections')) === '',

  'deliver-no-manifest': (ctx) =>
    deliverables(ctx).length > 0 && many(ctx.get('deliver', 'manifest_contents')).length === 0,

  'deliver-archive-one-copy': (ctx) => {
    const copies = num(ctx.get('deliver', 'archive_copies'));
    if (copies !== null && copies < 2) return true;
    return copies !== null && str(ctx.get('deliver', 'archive_locations')) === '';
  },

  'deliver-archive-untested': (ctx) =>
    many(ctx.get('deliver', 'archive_contents')).length > 0 &&
    ['no', 'listed'].includes(str(ctx.get('deliver', 'restore_tested'))),

  'deliver-archive-incomplete': (ctx) => {
    const contents = many(ctx.get('deliver', 'archive_contents'));
    if (contents.length === 0) return false;
    return !['session', 'originals', 'masters', 'readme'].every((c) => contents.includes(c));
  },

  'deliver-retention-unagreed': (ctx) =>
    ['assumed', 'none'].includes(str(ctx.get('deliver', 'retention_period'))),
});

// ── the eight activity checks ────────────────────────────────────────────────

const has = (c: ActivityContext, stage: string, field: string, value: string): boolean =>
  many(c.get(stage, field)).includes(value);

registerActivityChecks({
  'clarify-the-handoff': [
    {
      id: 'approver-named',
      label: 'One named person is recorded as the approval authority',
      met: (c) => {
        const who = str(c.get('brief', 'approval_authority'));
        return who !== '' && !/\b(team|label|committee|board|client|department)\b/i.test(who);
      },
    },
    {
      id: 'deadline-and-status',
      label: 'A completion deadline is entered and the production status is known',
      met: (c) =>
        str(c.get('brief', 'deadline')) !== '' && str(c.get('brief', 'production_status')) !== 'unknown',
    },
    {
      id: 'missing-item-owned',
      label: "The remote guest's recording has an owner and a date, or is confirmed unavailable",
      met: (c) =>
        rows(c.get('brief', 'materials_missing')).every((r) => {
          if (cell(r, 'mm_status') === 'will_not_arrive') return true;
          return !blank(cell(r, 'mm_owner')) && cell(r, 'mm_by') !== '';
        }) && rows(c.get('brief', 'materials_missing')).length > 0,
    },
    {
      id: 'spec-settled',
      label: 'The specification is no longer purely verbal, with rate, depth and channels settled',
      met: (c) =>
        !['verbal', 'assumed', 'none'].includes(str(c.get('brief', 'spec_source'))) &&
        RATE(c.get('brief', 'target_sample_rate')) !== null &&
        DEPTH(c.get('brief', 'target_bit_depth')) !== null &&
        !['unknown', ''].includes(str(c.get('brief', 'channel_config'))),
    },
    {
      id: 'destination-named',
      label: 'A delivery destination is named',
      met: (c) => str(c.get('brief', 'delivery_destination')) !== '',
    },
    {
      id: 'brief-and-questions',
      label: 'A creative brief is written and the open questions are listed',
      met: (c) =>
        str(c.get('brief', 'creative_brief')) !== '' && str(c.get('brief', 'open_questions')) !== '',
    },
  ],

  'safe-ingest': [
    {
      id: 'originals-locked',
      label: 'The originals are protected from writing',
      met: (c) => str(c.get('media', 'originals_read_only')) === 'locked',
    },
    {
      id: 'verified-properly',
      label: 'Every file is verified by more than a file count',
      met: (c) => {
        const methods = many(c.get('media', 'verify_method'));
        const real = ['checksum', 'app_verify', 'file_size', 'playback'].some((m) => methods.includes(m));
        return real && str(c.get('media', 'verify_coverage')) === 'all';
      },
    },
    {
      id: 'verification-recorded',
      label: 'The ingest has an owner and the verification result is written down',
      met: (c) =>
        str(c.get('media', 'ingest_owner')) !== '' &&
        (str(c.get('media', 'verify_findings')) !== '' || str(c.get('media', 'ingest_log')) !== ''),
    },
    {
      id: 'bad-files-resolved',
      label: 'The duplicate and the truncated file are resolved, with a plan recorded',
      met: (c) => {
        const inventory = rows(c.get('media', 'media_inventory'));
        if (inventory.length === 0) return false;
        const stillBad = inventory.some((r) =>
          ['corrupt', 'truncated', 'missing', 'duplicate'].includes(cell(r, 'mi_status')),
        );
        return !stillBad || str(c.get('media', 'problem_plan')) !== '';
      },
    },
    {
      id: 'conversion-decided',
      label: 'A conversion policy is chosen for the mixed sample rates',
      met: (c) => {
        const policy = str(c.get('media', 'conversion_policy'));
        return policy !== '' && policy !== 'undecided';
      },
    },
  ],

  'restore-synchronisation': [
    {
      id: 'checked-at-end',
      label: 'Sync is checked at the end of the longest file',
      met: (c) => str(c.get('session', 'sync_checked_at_end')) === 'yes',
    },
    {
      id: 'drift-diagnosed',
      label: 'The drift has a diagnosis',
      met: (c) => {
        const d = str(c.get('session', 'drift_diagnosis'));
        return d !== '' && d !== 'unknown';
      },
    },
    {
      id: 'cure-matches-cause',
      label: 'A steadily drifting source is stretched or reconformed, not moved',
      met: (c) => {
        const cause = str(c.get('session', 'drift_diagnosis'));
        const action = str(c.get('session', 'drift_action'));
        if (cause === '' || cause === 'unknown' || action === '') return false;
        const changing = ['clock_drift', 'rate_mismatch', 'pull', 'speed'].includes(cause);
        if (changing) return ['stretch', 'reconform', 'replace'].includes(action);
        if (cause === 'constant_offset') return action !== 'stretch';
        return true;
      },
    },
    {
      id: 'every-row-settled',
      label: 'Every source has a real sync method and a known hold state',
      met: (c) => {
        const table = rows(c.get('session', 'sync_table'));
        if (table.length === 0) return false;
        return table.every(
          (r) =>
            !['', 'not_yet'].includes(cell(r, 'sy_method')) && cell(r, 'sy_holds') !== 'unchecked',
        );
      },
    },
    {
      id: 'real-sync-source',
      label: 'A synchronisation source beyond doing it by hand is recorded',
      met: (c) => {
        const sources = many(c.get('session', 'sync_sources'));
        return ['embedded_tc', 'recorded_tc', 'slate', 'scratch', 'waveform', 'reports'].some((s) =>
          sources.includes(s),
        );
      },
    },
  ],

  'repair-without-overprocessing': [
    {
      id: 'every-problem-decided',
      label: 'Every problem has an action against it',
      met: (c) => {
        const list = rows(c.get('edit', 'problem_list'));
        return list.length > 0 && list.every((r) => cell(r, 'pb_action') !== '');
      },
    },
    {
      id: 'no-heavy-repair-on-subtle',
      label: 'Nothing barely audible is being re-recorded or replaced with ADR',
      met: (c) =>
        !rows(c.get('edit', 'problem_list')).some(
          (r) =>
            cell(r, 'pb_severity') === 'subtle' &&
            ['repair', 'rerecord', 'adr'].includes(cell(r, 'pb_action')),
        ),
    },
    {
      id: 'processing-order',
      label: 'A processing order is written down',
      met: (c) => str(c.get('edit', 'processing_order')) !== '',
    },
    {
      id: 'listens-to-what-is-removed',
      label: 'Repairs are compared level-matched, and to the removed signal',
      met: (c) => {
        const how = many(c.get('edit', 'comparison_method'));
        return how.includes('difference') && how.includes('level_matched');
      },
    },
    {
      id: 'artefacts-checked',
      label: 'The repairs have been checked for artefacts',
      met: (c) => str(c.get('edit', 'artifact_check')).startsWith('yes'),
    },
    {
      id: 'breaths-survive',
      label: 'Breaths are no longer being removed wholesale',
      met: (c) => str(c.get('edit', 'breaths_kept')) !== 'removed',
    },
    {
      id: 'preferred-take-has-a-reason',
      label: 'The preferred take records a reason beyond being the quietest',
      met: (c) =>
        rows(c.get('edit', 'take_log'))
          .filter((r) => cell(r, 'tk_verdict') === 'preferred')
          .every((r) =>
            cellMany(r, 'tk_chosen_on').some((k) =>
              ['performance', 'emotion', 'phrasing', 'timing', 'continuity', 'intelligibility'].includes(k),
            ),
          ) && rows(c.get('edit', 'take_log')).length > 0,
    },
  ],

  'add-without-erasing': [
    {
      id: 'rights-cleared',
      label: 'Nothing in the production has rights marked Missing or Expired',
      met: (c) =>
        ![
          ...rows(c.get('build', 'effects_list')).map((r) => cell(r, 'fx_rights')),
          ...rows(c.get('build', 'music_cues')).map((r) => cell(r, 'mu_rights')),
        ].some((s) => RIGHTS_BAD.includes(s)),
    },
    {
      id: 'everything-has-a-purpose',
      label: 'Every added element and cue has a rights status and a stated purpose',
      met: (c) => {
        const fx = rows(c.get('build', 'effects_list'));
        const mu = rows(c.get('build', 'music_cues'));
        if (fx.length === 0 && mu.length === 0) return false;
        return (
          fx.every((r) => cell(r, 'fx_purpose') !== '' && cell(r, 'fx_rights') !== '') &&
          mu.every((r) => cell(r, 'mu_purpose') !== '' && cell(r, 'mu_rights') !== '')
        );
      },
    },
    {
      id: 'replacement-matched',
      label: 'The replacement line has a matching plan and was heard in the full scene',
      met: (c) =>
        many(c.get('build', 'match_plan')).length > 0 &&
        str(c.get('build', 'match_verified')) === 'in_context',
    },
    {
      id: 'atmosphere-continuous',
      label: 'The atmosphere runs as a continuous bed and no longer loops plainly',
      met: (c) =>
        str(c.get('build', 'ambience_continuous')) !== 'per_clip' &&
        str(c.get('build', 'loop_variation')) !== 'looped',
    },
    {
      id: 'perspective-and-phrasing',
      label: 'Perspective is accounted for and the music edits respect phrasing',
      met: (c) =>
        str(c.get('build', 'perspective_handled')) !== 'no' &&
        !['to_length', ''].includes(str(c.get('build', 'music_edits_musical'))),
    },
    {
      id: 'music-and-speech-managed',
      label: 'Something manages the relationship between music and speech',
      met: (c) => many(c.get('build', 'music_speech_relationship')).filter((m) => m !== 'none').length > 0,
    },
    {
      id: 'correction-settled',
      label: 'The tuning is agreed or abandoned, with a scale, a guard and a comparison',
      met: (c) => {
        const scope = many(c.get('build', 'correction_scope'));
        if (scope.length === 0) return true; // abandoned is a valid answer
        const decision = str(c.get('build', 'correction_decision'));
        if (decision === 'not_discussed' || decision === 'prohibited') return false;
        if (scope.includes('pitch') && str(c.get('build', 'correction_target')) === '') return false;
        if (many(c.get('build', 'correction_guards')).length === 0) return false;
        return str(c.get('build', 'correction_compared')) === 'yes';
      },
    },
  ],

  'route-the-mix': [
    {
      id: 'everything-reaches-the-stems',
      label: 'No group, return or send is left out of the stems',
      met: (c) =>
        rows(c.get('mix', 'bus_structure')).length > 0 &&
        !rows(c.get('mix', 'bus_structure')).some(
          (r) =>
            cell(r, 'bs_in_stems') === 'no' &&
            ['group', 'vca', 'return', 'aux'].includes(cell(r, 'bs_kind')),
        ),
    },
    {
      id: 'send-has-a-return',
      label: 'The reverb send has a matching return in the routing table',
      met: (c) => {
        const buses = rows(c.get('mix', 'bus_structure'));
        const auxes = buses.filter((r) => cell(r, 'bs_kind') === 'aux');
        if (auxes.length === 0) return false;
        const names = buses.map((r) => cell(r, 'bs_name').toLowerCase()).filter((n) => n !== '');
        return auxes.every((a) => {
          const feeds = cell(a, 'bs_feeds').toLowerCase();
          return feeds !== '' && names.some((n) => feeds.includes(n) || n.includes(feeds));
        });
      },
    },
    {
      id: 'stems-recombine',
      label: 'The stems recombine into the mix, or the difference is described',
      met: (c) => {
        const test = str(c.get('mix', 'recombination_test'));
        if (test === 'nulls' || test === 'no_stems') return true;
        return test === 'close' && str(c.get('mix', 'recombination_difference')) !== '';
      },
    },
    {
      id: 'master-processing-settled',
      label: 'Master processing is no longer heavy with stems printed beneath it',
      met: (c) => str(c.get('mix', 'master_processing')) !== 'heavy',
    },
    {
      id: 'prints-checked',
      label: 'Every print has been checked and a verification list exists',
      met: (c) => {
        const prints = rows(c.get('mix', 'prints_made'));
        if (prints.length === 0) return false;
        return (
          prints.every((r) => cell(r, 'pr_checked') !== 'not_checked') &&
          many(c.get('mix', 'print_verification')).length > 0
        );
      },
    },
    {
      id: 'mix-hygiene',
      label: 'A separate mix version, a gain structure, a cross-check and a steady monitoring level',
      met: (c) =>
        str(c.get('mix', 'mix_version_created')) === 'yes' &&
        str(c.get('mix', 'headroom_plan')) !== '' &&
        many(c.get('mix', 'cross_checked')).length > 0 &&
        str(c.get('mix', 'monitoring_level_fixed')) !== 'varies' &&
        str(c.get('mix', 'level_matched_comparisons')) === 'yes',
    },
  ],

  'meet-the-specification': [
    {
      id: 'in-specification',
      label: 'Integrated loudness is within tolerance and true peak is at or below the ceiling',
      met: (c) => {
        const target = num(c.get('brief', 'loudness_target'));
        const measured = num(c.get('finish', 'measured_integrated'));
        const ceiling = num(c.get('brief', 'true_peak_max'));
        const peak = num(c.get('finish', 'measured_true_peak'));
        if (target === null || measured === null || ceiling === null || peak === null) return false;
        const tolerance = num(c.get('brief', 'loudness_tolerance')) ?? DEFAULT_LOUDNESS_TOLERANCE;
        return Math.abs(measured - target) <= Math.abs(tolerance) && peak <= ceiling;
      },
    },
    {
      id: 'measured-the-deliverable',
      label: 'The measurement is taken from the exported deliverable',
      met: (c) => str(c.get('finish', 'measurement_source')) === 'exported_file',
    },
    {
      id: 'not-squeezed-flat',
      label: 'The correction is no longer compression or limiting on an already flat programme',
      met: (c) => {
        const lra = num(c.get('finish', 'measured_lra'));
        const action = str(c.get('finish', 'loudness_action'));
        if (action === '') return false;
        if (lra !== null && lra < FLAT_LRA) return !['compression', 'limiting'].includes(action);
        return true;
      },
    },
    {
      id: 'processing-justified',
      label: 'Every processing row has a purpose and a level-matched comparison',
      met: (c) => {
        const processes = rows(c.get('finish', 'processes_applied'));
        if (processes.length === 0) return true; // an empty chain is a valid result
        return processes.every((r) => cell(r, 'ma_purpose') !== '' && cell(r, 'ma_compared') === 'yes');
      },
    },
    {
      id: 'dither-decided',
      label: 'Dither is decided rather than left unconsidered, and applied at most once',
      met: (c) => {
        const d = str(c.get('finish', 'dither_applied'));
        return d !== '' && d !== 'not_considered' && d !== 'multiple';
      },
    },
    {
      id: 'listened-and-encoded',
      label: 'The deliverable has been played in full and the encoded version compared',
      met: (c) =>
        str(c.get('finish', 'full_playback_review')) === 'yes' &&
        str(c.get('finish', 'encoded_check')) !== 'no',
    },
    {
      id: 'creative-and-accessible',
      label: 'A creative review has happened and speech accessibility has been checked',
      met: (c) =>
        str(c.get('finish', 'creative_review_done')) === 'yes' &&
        many(c.get('finish', 'speech_accessibility')).length > 0,
    },
    {
      id: 'captions-and-collection',
      label: 'Caption timing is verified against the final master and the series compared across',
      met: (c) =>
        ['yes', 'na'].includes(str(c.get('finish', 'access_timing_checked'))) &&
        many(c.get('finish', 'collection_checks')).length > 0,
    },
  ],

  'the-upload-succeeded': [
    {
      id: 'instrumental-exists',
      label: 'Every required version exists as a deliverable',
      met: (c) => {
        const wanted = many(c.get('brief', 'required_versions'));
        const made = rows(c.get('deliver', 'deliverables')).map((r) => cell(r, 'dl_kind'));
        if (made.length === 0) return false;
        return !Object.entries(VERSION_TO_KIND).some(
          ([version, kinds]) => wanted.includes(version) && !kinds.some((k) => made.includes(k)),
        );
      },
    },
    {
      id: 'matches-specification',
      label: 'The full mix matches the required sample rate, bit depth and channel count',
      met: (c) => {
        const mixes = rows(c.get('deliver', 'deliverables')).filter(
          (r) => cell(r, 'dl_kind') === 'full_mix',
        );
        if (mixes.length === 0) return false;
        const rate = RATE(c.get('brief', 'target_sample_rate'));
        const depth = DEPTH(c.get('brief', 'target_bit_depth'));
        const config = str(c.get('brief', 'channel_config'));
        const wantChannels = config === 'mono' ? 1 : config === 'stereo' ? 2 : null;
        return mixes.every(
          (r) =>
            RATE(cell(r, 'dl_rate')) === rate &&
            DEPTH(cell(r, 'dl_depth')) === depth &&
            (wantChannels === null || cellNum(r, 'dl_channels') === wantChannels),
        );
      },
    },
    {
      id: 'approved-version-safe',
      label: 'The approved version is preserved as a session and a print',
      met: (c) => str(c.get('deliver', 'approved_version_preserved')) === 'yes',
    },
    {
      id: 'approval-recorded',
      label: 'The approval is no longer pending, with a record of who approved what',
      met: (c) =>
        ['Approved', 'Not required'].includes(str(c.get('deliver', 'final_approval'))) &&
        str(c.get('deliver', 'approval_record')) !== '',
    },
    {
      id: 'names-and-conversion',
      label: 'Filenames are checked against the convention and the conversion has an order',
      met: (c) =>
        str(c.get('deliver', 'naming_matches_spec')) === 'yes' &&
        !['unplanned', ''].includes(str(c.get('deliver', 'conversion_needed'))),
    },
    {
      id: 'verified-at-the-destination',
      label: 'The delivered files were reopened from the destination and receipt confirmed by a person',
      met: (c) =>
        has(c, 'deliver', 'verify_steps', 'reopen') &&
        str(c.get('deliver', 'verified_from_destination')) === 'destination' &&
        str(c.get('deliver', 'receipt_confirmed_by')) !== '',
    },
    {
      id: 'manifest-and-note',
      label: 'A delivery manifest exists and the completed note is verified in the export',
      met: (c) =>
        many(c.get('deliver', 'manifest_contents')).length > 0 &&
        rows(c.get('deliver', 'notes_log')).every(
          (r) => !['completed', 'approved'].includes(cell(r, 'nt_status')) || cell(r, 'nt_verified') !== '',
        ),
    },
    {
      id: 'archive-is-an-archive',
      label: 'Two copies in recorded locations, a tested restore, and the session, originals, masters and README',
      met: (c) => {
        const contents = many(c.get('deliver', 'archive_contents'));
        const copies = num(c.get('deliver', 'archive_copies'));
        return (
          copies !== null &&
          copies >= 2 &&
          str(c.get('deliver', 'archive_locations')) !== '' &&
          str(c.get('deliver', 'restore_tested')) === 'full' &&
          ['session', 'originals', 'masters', 'readme'].every((k) => contents.includes(k)) &&
          str(c.get('deliver', 'retention_period')) === 'agreed'
        );
      },
    },
  ],
});

// Kept exported so a later batch cannot quietly re-derive them differently.
export { FLAT_LRA, DEFAULT_LOUDNESS_TOLERANCE, RIGHTS_BAD, SENT, VERSION_TO_KIND, mentions };

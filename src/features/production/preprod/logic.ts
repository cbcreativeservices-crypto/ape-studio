/**
 * Pre-Production — every computed rule, and every activity check.
 *
 * THE DIVISION OF LABOUR, in one file. Computer C authored 60 rules across four
 * stages and wrote the INTENT of the 50 that need a comparison; none of them
 * contains a line of logic. This is where those comparisons live, keyed by the
 * same ruleId. `missingLogic()` fails a test if one was promised and never
 * written, so a rule can never quietly do nothing.
 *
 * Every threshold in here is ccode's choice, as C's notes repeatedly say. They
 * are named constants at the top rather than buried numbers, because they are
 * judgements and someone will want to argue with them.
 *
 * TWO STANDING PRINCIPLES, both from C's notes and both load-bearing:
 *   1. A rule that fires on a healthy plan is worse than no rule. Every check
 *      below returns false when its inputs are missing, so an empty project
 *      reports "not decided" rather than a wall of false problems.
 *   2. Nudge-level false positives are acceptable; a missed match is not. Name
 *      matching is deliberately loose.
 */
import {
  registerRuleLogic,
  cell,
  cellNum,
  clockMinutes,
  daysBetween,
  isMostlyEmptyPraise,
  many,
  nameList,
  namesMoreThanOne,
  num,
  rows,
  sameName,
  startOfDay,
  str,
  when,
} from '../rules';
import { registerActivityChecks } from '../activities';
// Stage 5's capacity test, borrowed by stage 4 so the two cannot both fire.
// One-way: logic2 knows nothing about this file, so there is no import cycle.
import { inputsExceedCapacity } from './logic2';

// ── thresholds (ccode's judgements, per C's notes) ───────────────────────────

/** A working span beyond this, with no break block, is flagged. */
const LONG_DAY_HOURS = 6;
/** Source count within this of the channel count counts as "nothing spare". */
const TIGHT_CHANNEL_MARGIN = 2;
/** Storage headroom beyond the raw estimate, before doubling for the backup. */
const STORAGE_MARGIN = 1.2;
/** Rough hours of work one item costs per heavy service, for the scope check. */
const HOURS_PER_ITEM = { recording: 1.5, editing: 1.5, mixing: 2, mastering: 0.5 } as const;
/** One person holding more than this share of tasks is carrying too much. */
const OVERLOAD_SHARE = 0.6;

const LIVE_DESTINATIONS = ['live_venue', 'livestream', 'radio', 'television'];

// ── stage 1 · define ─────────────────────────────────────────────────────────

registerRuleLogic({
  'define-purpose-vague': (ctx) => {
    const purpose = str(ctx.get('define', 'purpose'));
    if (!purpose) return false; // an empty field is the missing-field rule's job
    if (!isMostlyEmptyPraise(purpose)) return false;
    const objective = str(ctx.get('define', 'creative_objective'));
    // A substantive creative objective rescues a thin purpose line.
    return !(objective && !isMostlyEmptyPraise(objective));
  },

  'define-approver-ambiguous': (ctx) => {
    const approver = str(ctx.get('define', 'approver'));
    return approver.length > 0 && namesMoreThanOne(approver);
  },

  'define-deadline-past': (ctx) => {
    const t = when(ctx.get('define', 'target_date'));
    // Both sides local midnight, so a deadline of today is not retroactively a
    // blocker at four in the afternoon.
    return t !== null && t < startOfDay(ctx.now);
  },

  'define-platform-live-no-venue': (ctx) => {
    if (ctx.pathway !== 'live') return false;
    const chosen = many(ctx.get('define', 'platform'));
    return chosen.length > 0 && !chosen.some((p) => LIVE_DESTINATIONS.includes(p));
  },

  /**
   * The Scope Warning. C set this to `attention` rather than `blocker` because
   * every threshold in it is a judgement (NOTES §2.1); the one hard comparison,
   * sources against channels, is a separate blocker in stage 4.
   *
   * Two independent checks, either of which fires it: the work does not fit the
   * production days, or it does not fit the calendar before the deadline.
   */
  'define-scope-outruns-resources': (ctx) => {
    const items = num(ctx.get('define', 'size_estimate'));
    const services = many(ctx.get('define', 'services'));
    if (!items || items <= 0 || services.length === 0) return false;

    // Hours the scope implies, weighted by the heavy services selected.
    let hoursPerItem = 0;
    for (const [service, h] of Object.entries(HOURS_PER_ITEM)) {
      if (services.includes(service)) hoursPerItem += h;
    }
    if (hoursPerItem === 0) return false; // only light services; nothing to judge

    const sources = num(ctx.get('define', 'source_count')) ?? 0;
    const locations = num(ctx.get('define', 'location_count')) ?? 1;
    const extras = many(ctx.get('define', 'alternate_versions')).filter((v) => v !== 'none').length;
    // More sources and more locations make each item slower, not just longer.
    const complexity = 1 + Math.max(0, sources - 8) * 0.02 + Math.max(0, locations - 1) * 0.15;
    const required = items * hoursPerItem * complexity + extras * 0.5;

    // Check one: does it fit the production days?
    const days = num(ctx.get('schedule', 'production_days'));
    const hoursPerDay = num(ctx.get('schedule', 'hours_per_day'));
    if (days && hoursPerDay) {
      // Only tracking happens on production days; finishing happens after.
      const trackingShare = services.includes('recording') || services.includes('live_recording') ? 0.4 : 0.2;
      if (required * trackingShare > days * hoursPerDay) return true;
    }

    // Check two: does it fit the calendar? Usable only when a date exists.
    const target = when(ctx.get('define', 'target_date'));
    if (target !== null) {
      const daysLeft = daysBetween(ctx.now, target);
      if (daysLeft >= 0) {
        // A very rough working-hours-per-calendar-day allowance.
        if (required > daysLeft * 4 + 4) return true;
      }
    }
    return false;
  },

  /** A reference with a title or source but no stated aspect. */
  'define-reference-no-reason': (ctx) =>
    rows(ctx.get('define', 'references')).some((r) => {
      const named = cell(r, 'ref_title') || cell(r, 'ref_source');
      if (!named) return false;
      const aspect = r['ref_aspect'];
      return !(Array.isArray(aspect) ? aspect.length > 0 : cell(r, 'ref_aspect').length > 0);
    }),

  'define-livestream-not-in-scope': (ctx) => {
    if (!many(ctx.get('define', 'platform')).includes('livestream')) return false;
    const services = many(ctx.get('define', 'services'));
    if (services.includes('livestream_feed') || services.includes('live_recording')) return false;
    // C's note: do not fire when the exclusions say someone else runs the stream.
    const out = str(ctx.get('define', 'out_of_scope')).toLowerCase();
    return !/stream/.test(out);
  },

  'define-archive-unagreed': (ctx) => {
    const plan = str(ctx.get('define', 'archive_plan'));
    return plan === '' || plan === 'not_agreed';
  },
});

// ── stage 2 · deliver ────────────────────────────────────────────────────────

const specRows = (ctx: { get: (s: string, f: string) => unknown }) =>
  rows(ctx.get('deliver', 'spec_table') as never);
const deliverableRows = (ctx: { get: (s: string, f: string) => unknown }) =>
  rows(ctx.get('deliver', 'deliverable_list') as never);
const hasDeliverableType = (ctx: { get: (s: string, f: string) => unknown }, ...types: string[]) =>
  deliverableRows(ctx).some((r) => types.includes(cell(r, 'item_type')));

registerRuleLogic({
  'deliver-platform-no-loudness': (ctx) => {
    const platforms = many(ctx.get('define', 'platform')).filter((p) => p !== 'live_venue' && p !== 'internal');
    if (platforms.length === 0) return false; // a live venue alone is exempt
    const specs = specRows(ctx);
    if (specs.length === 0) return false;
    const anyLoudness = specs.some((r) => cell(r, 'loudness_requirement').length > 0);
    if (!anyLoudness) return true;
    return str(ctx.get('deliver', 'loudness_spec_source')).length === 0;
  },

  'deliver-spec-not-obtained': (ctx) =>
    rows(ctx.get('deliver', 'destination_list')).some((r) => {
      const status = cell(r, 'dest_spec_status');
      return status === '' || status === 'not_obtained' || status === 'requested';
    }),

  'deliver-format-mismatch': (ctx) => {
    const format = str(ctx.get('define', 'format'));
    const specs = specRows(ctx);
    if (specs.length === 0) return false;
    const configs = specs.map((r) => cell(r, 'channel_config')).filter(Boolean);
    if (configs.length === 0) return false;
    const flat = ['mono', 'stereo'];
    const wide = ['5_1', '7_1', '7_1_4', 'object_based'];
    if (['surround', 'immersive', 'binaural'].includes(format) && configs.every((c) => flat.includes(c))) return true;
    if (flat.includes(format) && configs.some((c) => wide.includes(c))) return true;
    const installation = rows(ctx.get('deliver', 'destination_list')).some((r) => cell(r, 'dest_type') === 'installation');
    if (installation && !flat.includes(format) && format !== '' && !hasDeliverableType(ctx, 'surround_mix', 'immersive_mix')) {
      return true;
    }
    return false;
  },

  'deliver-localisation-no-separation': (ctx) => {
    const wantsAlt =
      many(ctx.get('define', 'alternate_versions')).includes('alt_language') || hasDeliverableType(ctx, 'alt_language');
    if (!wantsAlt) return false;
    const sep = str(ctx.get('deliver', 'separated_voice'));
    return sep === '' || sep === 'no';
  },

  'deliver-sample-rate-fights-workflow': (ctx) => {
    const session = num(ctx.get('deliver', 'session_sample_rate'));
    if (session) {
      // Delivering HIGHER than captured adds conversion and no information.
      // Downward conversion is routine and deliberate, so it never fires.
      const higher = specRows(ctx).some((r) => {
        const rate = cellNum(r, 'sample_rate');
        return rate !== null && rate > session;
      });
      if (higher) return true;
    }
    return (
      str(ctx.get('deliver', 'timecode_required')) === 'yes' &&
      str(ctx.get('deliver', 'timecode_notes')).length === 0
    );
  },

  'deliver-clean-undefined': (ctx) => {
    const wantsClean =
      hasDeliverableType(ctx, 'clean_version') || many(ctx.get('define', 'alternate_versions')).includes('clean');
    if (!wantsClean) return false;
    // "Either", not "both": a definition with no decider fails on the first edge
    // case, and a decider with no definition fails on the first session.
    return (
      str(ctx.get('deliver', 'clean_definition')).length === 0 ||
      str(ctx.get('deliver', 'clean_decider')).length === 0
    );
  },

  'deliver-stems-undefined': (ctx) =>
    hasDeliverableType(ctx, 'stems', 'isolated_tracks') && str(ctx.get('deliver', 'stem_list')).length === 0,

  'deliver-no-archival-master': (ctx) => {
    if (hasDeliverableType(ctx, 'archival_package', 'multitrack', 'project_files')) return false;
    const plan = str(ctx.get('define', 'archive_plan'));
    // When the producer keeps the files the archive exists without being a
    // formal deliverable, so this stays quiet.
    return plan !== 'producer_keeps' && plan !== 'both';
  },

  'deliver-spec-row-missing': (ctx) => {
    const items = deliverableRows(ctx);
    const specs = specRows(ctx);
    if (items.length === 0) return false;
    if (items.length > specs.length) return true;
    return items.some((item) => {
      const name = cell(item, 'item_name');
      if (!name) return false;
      return !specs.some((s) => sameName(cell(s, 'spec_item'), name));
    });
  },

  'deliver-approver-conflict': (ctx) => {
    const here = str(ctx.get('deliver', 'final_approver'));
    const brief = str(ctx.get('define', 'approver'));
    if (here && brief && !sameName(here, brief)) return true;
    const canApprove = rows(ctx.get('deliver', 'reviewers')).filter((r) => cell(r, 'rev_can_approve') === 'yes');
    return canApprove.length > 1;
  },

  'deliver-rounds-conflict': (ctx) => {
    const here = num(ctx.get('deliver', 'review_rounds'));
    const scope = num(ctx.get('define', 'revisions_included'));
    return here !== null && scope !== null && here !== scope;
  },

  'deliver-notes-no-consolidator': (ctx) => {
    const givers = rows(ctx.get('deliver', 'reviewers')).filter((r) => cell(r, 'rev_gives_notes') === 'yes');
    return givers.length > 1 && str(ctx.get('deliver', 'notes_consolidator')).length === 0;
  },

  'deliver-late-approval-undefined': (ctx) => {
    const v = str(ctx.get('deliver', 'silence_means'));
    return v === '' || v === 'undecided';
  },

  'deliver-deadline-order': (ctx) => {
    const target = when(ctx.get('define', 'target_date'));
    const dueDates: number[] = [];
    for (const r of deliverableRows(ctx)) {
      const d = when(cell(r, 'item_due'));
      if (d !== null) dueDates.push(d);
    }
    for (const r of specRows(ctx)) {
      const d = when(cell(r, 'spec_deadline'));
      if (d !== null) dueDates.push(d);
    }
    // A delivery after the project's completion date.
    if (target !== null && dueDates.some((d) => d > target)) return true;
    // A review deadline after the thing it is meant to protect.
    const reviewDates = rows(ctx.get('deliver', 'reviewers'))
      .map((r) => when(cell(r, 'rev_deadline')))
      .filter((d): d is number => d !== null);
    if (dueDates.length && reviewDates.some((rd) => dueDates.some((dd) => rd > dd))) return true;
    // The rounds cannot fit between now and the earliest delivery.
    const roundsN = num(ctx.get('deliver', 'review_rounds'));
    const period = num(ctx.get('deliver', 'review_period'));
    if (roundsN && period && dueDates.length) {
      const earliest = Math.min(...dueDates);
      if (daysBetween(ctx.now, earliest) < roundsN * period) return true;
    }
    return false;
  },
});

// ── stage 3 · people ─────────────────────────────────────────────────────────

/** On-day roles that run at the same moment; three are live-only. */
const SIMULTANEOUS_ROLES = [
  'engineer_primary',
  'monitor_engineer',
  'system_tech',
  'stage_manager',
  'stream_operator',
  'safety_lead',
];

registerRuleLogic({
  'people-task-no-owner': (ctx) =>
    rows(ctx.get('people', 'task_matrix')).some((r) => cell(r, 'task_name') !== '' && cell(r, 'task_responsible') === ''),

  'people-duplicate-authority': (ctx) => {
    if (namesMoreThanOne(str(ctx.get('people', 'cost_approver')))) return true;
    if (namesMoreThanOne(str(ctx.get('people', 'schedule_approver')))) return true;
    return rows(ctx.get('people', 'task_matrix')).some(
      (r) => namesMoreThanOne(cell(r, 'task_responsible')) || namesMoreThanOne(cell(r, 'task_approver')),
    );
  },

  'people-overload': (ctx) => {
    // Check one: one name holding a disproportionate share of the tasks.
    const owners = rows(ctx.get('people', 'task_matrix'))
      .map((r) => cell(r, 'task_responsible'))
      .filter(Boolean);
    if (owners.length >= 3) {
      const counts = new Map<string, number>();
      for (const o of owners) {
        const key = o.toLowerCase();
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      const distinct = counts.size;
      const most = Math.max(...counts.values());
      if (distinct > 1 && most / owners.length > OVERLOAD_SHARE) return true;
    }
    // Check two: one name in two roles that run at the same moment. Media
    // manager and RF coordinator are excluded — their work is mostly before and
    // after the performance, so an overlap there is normal.
    const held = new Map<string, number>();
    for (const role of SIMULTANEOUS_ROLES) {
      const name = str(ctx.get('people', role));
      if (!name) continue;
      const key = name.toLowerCase().trim();
      held.set(key, (held.get(key) ?? 0) + 1);
    }
    return [...held.values()].some((n) => n > 1);
  },

  'people-wireless-no-coordinator': (ctx) => {
    const channels = num(ctx.get('people', 'wireless_channels'));
    return channels !== null && channels > 0 && str(ctx.get('people', 'rf_coordinator')).length === 0;
  },

  'people-rigging-no-rigger': (ctx) =>
    str(ctx.get('people', 'rigging_required')) === 'yes' && str(ctx.get('people', 'rigger')).length === 0,

  'people-power-no-electrician': (ctx) => {
    const src = str(ctx.get('people', 'power_source'));
    // Only the two that are licensed electrical work. A small portable
    // generator with equipment in its own outlets is not, per C's note §2.8.
    if (src !== 'temporary_distro' && src !== 'generator_distro') return false;
    return str(ctx.get('people', 'electrician')).length === 0;
  },

  'people-stream-no-operator': (ctx) => {
    const streaming =
      many(ctx.get('define', 'services')).includes('livestream_feed') ||
      many(ctx.get('define', 'platform')).includes('livestream');
    return streaming && str(ctx.get('people', 'stream_operator')).length === 0;
  },

  'people-approval-vague': (ctx) =>
    str(ctx.get('people', 'cost_approver')).length === 0 || str(ctx.get('people', 'schedule_approver')).length === 0,

  'people-release-missing': (ctx) =>
    rows(ctx.get('people', 'participants')).some((r) => {
      if (cell(r, 'p_name') === '') return false;
      const rel = cell(r, 'p_release');
      // Restricted means it is in hand and needs reading, which is the user's
      // job rather than a finding.
      return ['Missing', 'Pending', 'Requested', 'Expired'].includes(rel);
    }),

  'people-minor-no-consent': (ctx) => {
    const anyMinor = rows(ctx.get('people', 'participants')).some((r) => cell(r, 'p_minor') === 'yes');
    return anyMinor && str(ctx.get('people', 'minors_arrangement')).length === 0;
  },

  'people-emergency-contact-missing': (ctx) => {
    if (str(ctx.get('people', 'emergency_contact')).length === 0) return true;
    return ctx.pathway === 'live' && str(ctx.get('people', 'safety_lead')).length === 0;
  },

  'people-monitor-role-missing': (ctx) =>
    many(ctx.get('define', 'services')).includes('monitoring') &&
    str(ctx.get('people', 'monitor_engineer')).length === 0,

  /** The "not known yet" half of the three hazard questions. */
  'people-hazards-unknown': (ctx) => {
    if (str(ctx.get('people', 'rigging_required')) === 'unknown') return true;
    if (str(ctx.get('people', 'power_source')) === 'unknown') return true;
    return rows(ctx.get('people', 'participants')).some((r) => cell(r, 'p_minor') === 'unknown');
  },
});

// ── stage 4 · schedule ───────────────────────────────────────────────────────

const blocks = (ctx: { get: (s: string, f: string) => unknown }) => rows(ctx.get('schedule', 'day_schedule') as never);
const blockTypes = (ctx: { get: (s: string, f: string) => unknown }) => blocks(ctx).map((b) => cell(b, 'blk_type'));
const hasBlock = (ctx: { get: (s: string, f: string) => unknown }, type: string) => blockTypes(ctx).includes(type);

/** Is recording part of this plan at all? */
function recordingInScope(ctx: { get: (s: string, f: string) => unknown; pathway: string }): boolean {
  const services = many(ctx.get('define', 'services') as never);
  if (services.some((s) => ['recording', 'live_recording', 'livestream_feed'].includes(s))) return true;
  return ctx.pathway !== 'live' && services.length === 0;
}

registerRuleLogic({
  'schedule-soundcheck-no-linecheck': (ctx) => {
    const types = blockTypes(ctx);
    const needs = types.includes('soundcheck') || types.includes('performance');
    if (!needs) return false;
    const line = types.indexOf('line_check');
    if (line < 0) return true;
    // A line check after the first soundcheck or performance is not a line check.
    const firstUse = Math.min(
      ...[types.indexOf('soundcheck'), types.indexOf('performance')].filter((i) => i >= 0),
    );
    return line > firstUse;
  },

  'schedule-no-setup-time': (ctx) => {
    const types = blockTypes(ctx);
    if (types.includes('performance') && !types.includes('setup') && !types.includes('load_in')) return true;
    const hasSetup = types.includes('setup') || types.includes('load_in');
    return hasSetup && str(ctx.get('schedule', 'setup_contingency')).length === 0;
  },

  'schedule-no-breaks': (ctx) => {
    const list = blocks(ctx);
    if (list.length === 0) return false;
    if (blockTypes(ctx).includes('break')) return false;
    const stated = num(ctx.get('schedule', 'hours_per_day'));
    const summed = list.reduce((t, b) => t + (cellNum(b, 'blk_duration') ?? 0), 0) / 60;
    return Math.max(stated ?? 0, summed) > LONG_DAY_HOURS;
  },

  'schedule-no-changeover': (ctx) => {
    const types = blockTypes(ctx);
    const performances = types.filter((t) => t === 'performance').length;
    const items = num(ctx.get('define', 'size_estimate')) ?? 0;
    const several = (ctx.pathway === 'live' && items > 1) || performances > 1;
    if (!several) return false;
    const changeovers = types.filter((t) => t === 'changeover').length;
    const expected = Math.max(performances - 1, ctx.pathway === 'live' ? items - 1 : 0);
    return changeovers < expected;
  },

  'schedule-no-verification': (ctx) => {
    if (!recordingInScope(ctx)) return false;
    const types = blockTypes(ctx);
    if (!types.includes('performance')) return false;
    const verify = types.indexOf('file_verification');
    if (verify < 0) return true;
    const strike = Math.min(
      ...[types.indexOf('strike'), types.indexOf('load_out')].filter((i) => i >= 0).concat([Number.MAX_SAFE_INTEGER]),
    );
    return verify > strike;
  },

  'schedule-no-backup-window': (ctx) => {
    if (!recordingInScope(ctx)) return false;
    const media = str(ctx.get('schedule', 'backup_media'));
    if (media.length === 0) return true;
    if (hasBlock(ctx, 'backup')) return false;
    // C's note: a simultaneous second recorder needs no separate block.
    return !/second recorder|simultaneous|mirror|dual|two recorders/i.test(media);
  },

  'schedule-no-contingency': (ctx) => {
    const lines = rows(ctx.get('schedule', 'budget_lines'));
    if (lines.length === 0) return false;
    const contingency = lines.find((l) => cell(l, 'bl_category') === 'contingency');
    if (!contingency) return true;
    const amount = cellNum(contingency, 'bl_amount');
    return amount === null || amount <= 0;
  },

  'schedule-budget-exceeded': (ctx) => {
    const total = num(ctx.get('schedule', 'budget_total'));
    const lines = rows(ctx.get('schedule', 'budget_lines'));
    if (total === null || lines.length === 0) return false;
    const sum = lines.reduce((t, l) => t + (cellNum(l, 'bl_amount') ?? 0), 0);
    return sum > total;
  },

  'schedule-channels-insufficient': (ctx) => {
    // Stand down when stage 5 is making the same comparison from better
    // evidence. C's intent for `technical-inputs-exceed-capacity` is explicit:
    // the two rules say the same thing, so only one of them may say it.
    if (inputsExceedCapacity(ctx)) return false;
    const sources = num(ctx.get('define', 'source_count'));
    if (sources === null) return false;
    const channels = num(ctx.get('schedule', 'available_channels'));
    if (channels !== null && sources > channels) return true;
    const inputs = num(ctx.get('schedule', 'available_inputs'));
    return inputs !== null && sources > inputs;
  },

  'schedule-no-spares': (ctx) => {
    const sources = num(ctx.get('define', 'source_count'));
    const channels = num(ctx.get('schedule', 'available_channels'));
    // Stay quiet while the blocker is already saying something stronger.
    if (sources !== null && channels !== null && sources > channels) return false;
    const spares = num(ctx.get('schedule', 'spare_inputs'));
    if (spares !== null && spares === 0) return true;
    if (sources === null || channels === null) return false;
    return channels - sources <= TIGHT_CHANNEL_MARGIN;
  },

  /**
   * The one place C stated a formula, because it is not in doubt:
   * bytes = channels x sample rate x bytes per sample x seconds.
   * The margin and the doubling for the backup are ccode's.
   */
  'schedule-storage-short': (ctx) => {
    const available = num(ctx.get('schedule', 'storage_available'));
    const hours = num(ctx.get('schedule', 'recording_hours'));
    const channels = num(ctx.get('define', 'source_count'));
    const rate = num(ctx.get('deliver', 'session_sample_rate'));
    const depthRaw = str(ctx.get('deliver', 'session_bit_depth'));
    if (available === null || hours === null || channels === null || rate === null || !depthRaw) return false;
    const bytesPerSample = depthRaw === '32f' ? 4 : depthRaw === '24' ? 3 : depthRaw === '16' ? 2 : 0;
    if (bytesPerSample === 0) return false; // "undecided"
    const bytes = channels * rate * bytesPerSample * hours * 3600;
    const gb = bytes / 1e9;
    return available < gb * STORAGE_MARGIN * 2; // the backup needs the space again
  },

  'schedule-day-overruns': (ctx) => {
    const list = blocks(ctx);
    if (list.length === 0) return false;
    const summedMin = list.reduce((t, b) => t + (cellNum(b, 'blk_duration') ?? 0), 0);
    if (summedMin === 0) return false;
    const call = clockMinutes(ctx.get('schedule', 'call_time'));
    const out = clockMinutes(ctx.get('schedule', 'hard_out'));
    if (call !== null && out !== null) {
      // A hard out past midnight reads as a smaller number; wrap it.
      const span = out >= call ? out - call : out + 24 * 60 - call;
      if (summedMin > span) return true;
    }
    const hours = num(ctx.get('schedule', 'hours_per_day'));
    return hours !== null && summedMin > hours * 60;
  },

  'schedule-dates-do-not-fit': (ctx) => {
    const target = when(ctx.get('define', 'target_date'));
    const production = when(ctx.get('schedule', 'production_date'));
    const delivery = when(ctx.get('schedule', 'final_delivery_date'));
    if (target !== null && production !== null && production > target) return true;
    if (target !== null && delivery !== null && delivery > target) return true;
    if (production !== null && delivery !== null && delivery < production) return true;

    // Do the agreed review rounds fit between production and delivery?
    const roundsN = num(ctx.get('deliver', 'review_rounds'));
    const period = num(ctx.get('deliver', 'review_period'));
    if (production !== null && delivery !== null && roundsN && period) {
      const services = many(ctx.get('define', 'services'));
      const finishing = (services.includes('mixing') ? 3 : 0) + (services.includes('mastering') ? 2 : 0) + (services.includes('editing') ? 2 : 0);
      if (daysBetween(production, delivery) < roundsN * period + finishing) return true;
    }

    // Milestones that sit on the wrong side of the production date.
    const before = ['location_access', 'equipment_prep', 'rehearsal', 'tech_rehearsal'];
    const after = ['media_transfer', 'review_period', 'final_delivery'];
    if (production !== null) {
      for (const r of rows(ctx.get('schedule', 'milestone_list'))) {
        const d = when(cell(r, 'ms_date'));
        if (d === null) continue;
        const type = cell(r, 'ms_type');
        if (before.includes(type) && d > production) return true;
        if (after.includes(type) && d < production) return true;
      }
    }

    // A milestone dated before the thing it names as a prerequisite.
    const ms = rows(ctx.get('schedule', 'milestone_list'));
    for (const r of ms) {
      const dep = cell(r, 'ms_depends_on');
      const d = when(cell(r, 'ms_date'));
      if (!dep || d === null) continue;
      for (const other of ms) {
        if (other === r) continue;
        const od = when(cell(other, 'ms_date'));
        if (od === null) continue;
        const matches = sameName(cell(other, 'ms_type'), dep) || sameName(cell(other, 'ms_notes'), dep);
        if (matches && d < od) return true;
      }
    }
    return false;
  },

  'schedule-outdoor-no-backup-date': (ctx) =>
    many(ctx.get('define', 'location_type')).includes('outdoor') &&
    str(ctx.get('schedule', 'backup_date')).length === 0,

  'schedule-insurance-missing': (ctx) => {
    const unsettled = ['Missing', 'Requested', 'Pending', 'Expired'];
    if (ctx.pathway === 'live' && unsettled.includes(str(ctx.get('schedule', 'insurance_status')))) return true;
    return unsettled.includes(str(ctx.get('schedule', 'permits_status')));
  },
});

// ── the four activities ──────────────────────────────────────────────────────

registerActivityChecks({
  'repair-the-brief': [
    {
      id: 'purpose-real',
      label: 'The purpose names a real use, not only adjectives',
      met: (c) => {
        const p = str(c.get('define', 'purpose'));
        return p.length > 0 && !isMostlyEmptyPraise(p);
      },
    },
    {
      id: 'audience-and-platform',
      label: 'An audience and at least one platform are chosen',
      met: (c) => c.answered('define', 'audience') && many(c.get('define', 'platform')).length > 0,
    },
    {
      id: 'one-approver',
      label: 'A single approver is named',
      met: (c) => {
        const a = str(c.get('define', 'approver'));
        return a.length > 0 && !namesMoreThanOne(a);
      },
    },
    {
      id: 'scope-priced',
      label: 'At least one service is selected and a revision count is entered',
      met: (c) => many(c.get('define', 'services')).length > 0 && num(c.get('define', 'revisions_included')) !== null,
    },
    {
      id: 'success-checkable',
      label: 'Success is something you could check on delivery day',
      met: (c) => {
        const s = str(c.get('define', 'success_definition'));
        return s.length > 0 && !isMostlyEmptyPraise(s);
      },
    },
  ],

  'deliverable-detective': [
    {
      id: 'immersive-not-stereo',
      label: 'The immersive deliverable is no longer specified as stereo',
      met: (c) =>
        rows(c.get('deliver', 'spec_table')).some(
          (r) => /immersive|foyer/i.test(cell(r, 'spec_item')) && !['stereo', 'mono', ''].includes(cell(r, 'channel_config')),
        ),
    },
    {
      id: 'spec-per-deliverable',
      label: 'Every deliverable has a specification row',
      met: (c) => {
        const items = rows(c.get('deliver', 'deliverable_list')).filter((r) => cell(r, 'item_name'));
        const specs = rows(c.get('deliver', 'spec_table'));
        return items.length > 0 && items.every((i) => specs.some((s) => sameName(cell(s, 'spec_item'), cell(i, 'item_name'))));
      },
    },
    {
      id: 'clean-defined',
      label: 'The clean version has a written definition and a named decider',
      met: (c) =>
        str(c.get('deliver', 'clean_definition')).length > 0 && str(c.get('deliver', 'clean_decider')).length > 0,
    },
    {
      id: 'specs-sought',
      label: "Each destination's specification is obtained or requested, with a location",
      met: (c) => {
        const dests = rows(c.get('deliver', 'destination_list'));
        return (
          dests.length > 0 &&
          dests.every(
            (d) =>
              ['obtained', 'requested', 'none_published'].includes(cell(d, 'dest_spec_status')) &&
              cell(d, 'dest_spec_location').length > 0,
          )
        );
      },
    },
    {
      id: 'named-approver',
      label: "One named person replaces 'the board'",
      met: (c) => {
        const a = str(c.get('deliver', 'final_approver'));
        return a.length > 0 && !namesMoreThanOne(a) && !/board|committee|team/i.test(a);
      },
    },
    {
      id: 'review-before-delivery',
      label: 'A review deadline is set that falls before the delivery date',
      met: (c) => {
        const reviews = rows(c.get('deliver', 'reviewers'))
          .map((r) => when(cell(r, 'rev_deadline')))
          .filter((d): d is number => d !== null);
        if (reviews.length === 0) return false;
        const dues = rows(c.get('deliver', 'deliverable_list'))
          .map((r) => when(cell(r, 'item_due')))
          .filter((d): d is number => d !== null);
        return dues.length > 0 && reviews.every((r) => dues.every((d) => r < d));
      },
    },
    {
      id: 'late-approval-chosen',
      label: 'The late-approval outcome is chosen',
      met: (c) => {
        const v = str(c.get('deliver', 'silence_means'));
        return v.length > 0 && v !== 'undecided';
      },
    },
  ],

  'who-owns-this-task': [
    {
      id: 'every-task-owned',
      label: 'Every task has exactly one responsible person',
      met: (c) => {
        const tasks = rows(c.get('people', 'task_matrix')).filter((r) => cell(r, 'task_name'));
        return (
          tasks.length > 0 &&
          tasks.every((t) => cell(t, 'task_responsible').length > 0 && !namesMoreThanOne(cell(t, 'task_responsible')))
        );
      },
    },
    {
      id: 'single-authority',
      label: 'No authority field names more than one person',
      met: (c) =>
        !namesMoreThanOne(str(c.get('people', 'cost_approver'))) &&
        !namesMoreThanOne(str(c.get('people', 'schedule_approver'))) &&
        str(c.get('people', 'cost_approver')).length > 0 &&
        str(c.get('people', 'schedule_approver')).length > 0 &&
        rows(c.get('people', 'task_matrix')).every((t) => !namesMoreThanOne(cell(t, 'task_approver'))),
    },
    {
      id: 'media-and-stage',
      label: 'A media manager is named, and a stage manager on a live show',
      met: (c) => {
        if (str(c.get('people', 'media_manager')).length === 0) return false;
        // Conditional on the pathway, because the field only exists on live.
        if (c.project.pathway !== 'live') return true;
        return str(c.get('people', 'stage_manager')).length > 0;
      },
    },
    {
      id: 'no-double-on-day-role',
      label: 'Nobody holds two jobs that happen at the same time',
      met: (c) => {
        const held = new Map<string, number>();
        for (const role of SIMULTANEOUS_ROLES) {
          const n = str(c.get('people', role)).toLowerCase().trim();
          if (!n) continue;
          held.set(n, (held.get(n) ?? 0) + 1);
        }
        return ![...held.values()].some((n) => n > 1);
      },
    },
    {
      id: 'critical-tasks-owned',
      label: 'Someone owns the releases, the power confirmation and the wireless plan',
      met: (c) => {
        const tasks = rows(c.get('people', 'task_matrix'));
        const owned = (pattern: RegExp) =>
          tasks.some((t) => pattern.test(cell(t, 'task_name')) && cell(t, 'task_responsible').length > 0);
        return owned(/release/i) && owned(/power/i) && owned(/wireless|frequenc/i);
      },
    },
  ],

  'save-the-production': [
    {
      id: 'day-has-the-missing-blocks',
      label: 'Setup, a line check, changeovers, a break, verification and a backup are all on the day',
      met: (c) => {
        const types = rows(c.get('schedule', 'day_schedule')).map((b) => cell(b, 'blk_type'));
        const need = ['setup', 'line_check', 'changeover', 'break', 'file_verification', 'backup'];
        if (!need.every((t) => types.includes(t))) return false;
        // The line check has to come before the first soundcheck or performance.
        const line = types.indexOf('line_check');
        const uses = [types.indexOf('soundcheck'), types.indexOf('performance')].filter((i) => i >= 0);
        if (uses.length && line > Math.min(...uses)) return false;
        // Backup and verification before strike.
        const strike = types.indexOf('strike');
        if (strike >= 0 && (types.indexOf('backup') > strike || types.indexOf('file_verification') > strike)) return false;
        // Three acts need two changeovers.
        return types.filter((t) => t === 'changeover').length >= 2;
      },
    },
    {
      id: 'day-fits',
      label: 'The blocks fit between the call and the hard out',
      met: (c) => {
        const list = rows(c.get('schedule', 'day_schedule'));
        const summed = list.reduce((t, b) => t + (cellNum(b, 'blk_duration') ?? 0), 0);
        const call = clockMinutes(c.get('schedule', 'call_time'));
        const out = clockMinutes(c.get('schedule', 'hard_out'));
        if (call === null || out === null || summed === 0) return false;
        const span = out >= call ? out - call : out + 24 * 60 - call;
        return summed <= span;
      },
    },
    {
      id: 'channels-cover-sources',
      label: 'There are enough channels for the sources, plus a spare',
      met: (c) => {
        const sources = num(c.get('define', 'source_count'));
        const channels = num(c.get('schedule', 'available_channels'));
        const spares = num(c.get('schedule', 'spare_inputs'));
        return sources !== null && channels !== null && channels >= sources && (spares ?? 0) >= 1;
      },
    },
    {
      id: 'backup-described',
      label: 'A backup method is described',
      met: (c) => str(c.get('schedule', 'backup_media')).length > 0,
    },
    {
      id: 'budget-balances',
      label: 'The budget has a contingency and does not exceed the total',
      met: (c) => {
        const lines = rows(c.get('schedule', 'budget_lines'));
        const total = num(c.get('schedule', 'budget_total'));
        if (lines.length === 0 || total === null) return false;
        const contingency = lines.find((l) => cell(l, 'bl_category') === 'contingency');
        if (!contingency || (cellNum(contingency, 'bl_amount') ?? 0) <= 0) return false;
        return lines.reduce((t, l) => t + (cellNum(l, 'bl_amount') ?? 0), 0) <= total;
      },
    },
    {
      id: 'recording-survives',
      label: 'The live recording is still in the services',
      met: (c) => many(c.get('define', 'services')).includes('live_recording'),
    },
  ],
});

/** Exported so the rules and the activity checks cannot drift apart. */
export { SIMULTANEOUS_ROLES, LONG_DAY_HOURS, TIGHT_CHANNEL_MARGIN, STORAGE_MARGIN, nameList };


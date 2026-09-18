/**
 * Pre-Production — computed rules and activity checks for stages 5 and 6.
 *
 * AUTHORED BY Computer C, batch 2, 2026-09-17: 30 rules, every one of them
 * `needsLogic`, because each either reads a table, compares across stages, or
 * tests a specific option value. Split from `logic.ts` only for size; the
 * contract is identical and both are side-effect imports from the registry.
 *
 * Same two standing principles as batch 1: a rule that fires on a healthy plan
 * is worse than no rule, so every check returns false when its inputs are
 * missing; and a nudge-level false positive is acceptable where a missed match
 * is not.
 */
import type { RuleContext } from '../rules';
import {
  registerRuleLogic,
  cell,
  cellNum,
  daysBetween,
  many,
  num,
  rows,
  str,
  when,
} from '../rules';
import type { ActivityContext } from '../activities';
import { registerActivityChecks } from '../activities';

// ── thresholds ccode chose, where C's intent left the number open ────────────

/**
 * "Within a number of days ahead of today that ccode chooses" — the window
 * `technical-material-not-final` and `readiness-hazard-open` both ask for
 * (logicIntent, both rules). Deliberately ONE constant serving both, so a plan
 * cannot be close to the day for one rule and comfortably far for the other.
 *
 * Three weeks: long enough that a set list or a hazard control can still be
 * fixed without costing anyone a day, short enough that saying so is useful
 * rather than nagging from the moment a date is entered.
 */
const CLOSE_TO_DATE_DAYS = 21;

/**
 * Words that mean "nothing here" in a free-text cell.
 *
 * C's intent for `readiness-backup-unreachable` and `-critical-system-no-backup`
 * asks for exactly this: a backup cell reading "none", "n/a" or "no backup" is
 * an ABSENT backup, not an unreachable one, so it belongs to the other rule.
 * One definition, used by both, so a row can never trip both at once.
 */
const READS_AS_EMPTY = /^(none|n\/?a|no backup|nil|tbc|tbd|-{1,3})$/i;
const blank = (v: string): boolean => v.trim() === '' || READS_AS_EMPTY.test(v.trim());

/** Loose word match, as C's intent asks for repeatedly. */
const mentions = (haystack: string, re: RegExp): boolean => re.test(haystack.toLowerCase());

/** Two entries, not one: a range, a pair, or two names. */
const namesTwo = (s: string): boolean => s !== '' && /[-–—,/&+]|\band\b/i.test(s);

/** Channels the stage 5 input list actually asks for, or null if there is none. */
function inputListChannels(ctx: RuleContext): number | null {
  const list = rows(ctx.get('technical', 'input_list'));
  if (list.length === 0) return null;
  // "treating a row with the channels column empty as one" — C's intent.
  return list.reduce((n, r) => n + (cellNum(r, 'in_channels') ?? 1), 0);
}

/**
 * Does stage 5's capacity blocker fire?
 *
 * Exported because stage 4's `schedule-channels-insufficient` makes the same
 * comparison from the stage 1 source count, and C's intent says plainly: when
 * this fires, suppress that one — do not raise both. The input list is the
 * better evidence when it exists, so it wins and the stage 4 rule stands down.
 */
export function inputsExceedCapacity(ctx: RuleContext): boolean {
  const need = inputListChannels(ctx);
  if (need === null) return false;
  const channels = num(ctx.get('schedule', 'available_channels'));
  if (channels !== null && need > channels) return true;
  const inputs = num(ctx.get('schedule', 'available_inputs'));
  return inputs !== null && need > inputs;
}

/** Is the production date inside the window? False when there is no date. */
function closeToDate(ctx: RuleContext): boolean {
  const date = when(ctx.get('schedule', 'production_date'));
  if (date === null) return false;
  const away = daysBetween(ctx.now, date);
  return away >= 0 && away <= CLOSE_TO_DATE_DAYS;
}

/** Every `ct_system` in one string, for the loose matches below. */
const systemsText = (ctx: RuleContext): string =>
  rows(ctx.get('readiness', 'contingency_table'))
    .map((r) => cell(r, 'ct_system'))
    .join(' | ');

// ── stage 5 · technical ──────────────────────────────────────────────────────

registerRuleLogic({
  'technical-inputs-exceed-capacity': (ctx) => inputsExceedCapacity(ctx),

  'technical-stereo-one-channel': (ctx) =>
    rows(ctx.get('technical', 'input_list')).some((r) => {
      if (cellNum(r, 'in_channels') !== 2) return false;
      const consoleChannels = cell(r, 'in_console');
      const trackNames = cell(r, 'in_track');
      // "do not fire when the console or track columns are empty" — an unfilled
      // column is a question not yet answered, not an answer that is wrong.
      if (consoleChannels === '' && trackNames === '') return false;
      return (
        (consoleChannels !== '' && !namesTwo(consoleChannels)) ||
        (trackNames !== '' && !namesTwo(trackNames))
      );
    }),

  'technical-phantom-mismatch': (ctx) =>
    rows(ctx.get('technical', 'input_list')).some((r) => {
      const capture = cell(r, 'in_capture');
      const phantom = cell(r, 'in_phantom');
      if (phantom === '' || phantom === 'na') return false;
      if (capture === 'condenser_mic') return phantom === 'off';
      // di and wireless are excluded on purpose: active DIs want phantom,
      // passive ones do not, and receivers vary by device (C's intent).
      return ['ribbon_mic', 'line', 'playback'].includes(capture) && phantom === 'on';
    }),

  'technical-mic-no-reason': (ctx) =>
    rows(ctx.get('technical', 'mic_choices')).some((r) => {
      if (cell(r, 'mc_mic') === '') return false;
      // mc_reason is multiChoice, so an unanswered cell is an empty array.
      const reason = r['mc_reason'];
      return Array.isArray(reason) ? reason.length === 0 : cell(r, 'mc_reason') === '';
    }),

  'technical-path-ends-nowhere': (ctx) => {
    const paths = rows(ctx.get('technical', 'signal_path'));
    if (paths.length === 0) return false;
    if (paths.some((r) => cell(r, 'sp_from') !== '' && cell(r, 'sp_to') === '')) return true;
    const arrivals = paths.map((r) => cell(r, 'sp_to')).join(' | ');
    const services = many(ctx.get('define', 'services'));
    const platforms = many(ctx.get('define', 'platform'));
    if (
      (services.includes('live_recording') || services.includes('recording')) &&
      !mentions(arrivals, /record|interface|daw|capture|deck/)
    ) {
      return true;
    }
    return (
      (services.includes('livestream_feed') || platforms.includes('livestream')) &&
      !mentions(arrivals, /stream|encoder|broadcast/)
    );
  },

  'technical-level-format-conflict': (ctx) => {
    const instrumentWithoutDi = rows(ctx.get('technical', 'signal_path')).some((r) => {
      if (cell(r, 'sp_level') !== 'instrument') return false;
      const chain = `${cell(r, 'sp_via')} ${cell(r, 'sp_to')}`;
      return !mentions(chain, /\bdi\b|direct box|direct input|instrument input|hi-?z/);
    });
    if (instrumentWithoutDi) return true;
    // An unbalanced jack on what is usually a long run back to the stage box.
    return rows(ctx.get('technical', 'input_list')).some(
      (r) => ['line', 'playback'].includes(cell(r, 'in_capture')) && cell(r, 'in_connection') === 'ts',
    );
  },

  'technical-no-safety-capture': (ctx) => {
    const mics = rows(ctx.get('technical', 'mic_choices'));
    if (mics.length === 0) return false;
    const recording = many(ctx.get('define', 'services')).includes('live_recording');
    if (!recording && ctx.pathway !== 'podcast' && ctx.pathway !== 'live') return false;
    const anyBackup = mics.some((r) => {
      const backup = cell(r, 'mc_backup');
      return backup !== '' && backup !== 'none';
    });
    if (anyBackup) return false;
    return str(ctx.get('technical', 'unrepeatable_sources')) === '';
  },

  'technical-click-no-cue': (ctx) => {
    if (str(ctx.get('technical', 'click_playback')) !== 'yes') return false;
    if (rows(ctx.get('technical', 'cue_mixes')).length === 0) return true;
    return !rows(ctx.get('technical', 'input_list')).some((r) => cell(r, 'in_capture') === 'playback');
  },

  'technical-cue-mix-no-output': (ctx) => {
    const available = num(ctx.get('schedule', 'monitor_mixes_available'));
    if (available === null) return false;
    const independent = rows(ctx.get('technical', 'cue_mixes')).filter((r) => {
      const type = cell(r, 'cm_type');
      return type !== '' && type !== 'shared' && type !== 'none';
    }).length;
    return independent > 0 && independent > available;
  },

  'technical-clock-unsettled': (ctx) => {
    const count = str(ctx.get('technical', 'recorder_count'));
    if (count === 'several_free') return true;
    const master = str(ctx.get('technical', 'clock_master'));
    if (count === 'several_clocked' && (master === '' || master === 'unknown')) return true;
    const rate = str(ctx.get('deliver', 'session_sample_rate'));
    return (
      rate !== '' && rate !== 'undecided' && str(ctx.get('technical', 'device_rates_checked')) === 'no'
    );
  },

  'technical-timecode-no-plan': (ctx) =>
    str(ctx.get('deliver', 'timecode_required')) === 'yes' &&
    str(ctx.get('technical', 'timecode_plan')) === '',

  'technical-space-not-assessed': (ctx) => {
    const assessed = str(ctx.get('technical', 'space_assessed'));
    if (assessed === '') return false;
    if (assessed === 'not_assessed') return true;
    return str(ctx.get('technical', 'acoustic_character')) === 'unknown' && assessed !== 'visited';
  },

  'technical-naming-not-convention': (ctx) => {
    const name = str(ctx.get('technical', 'naming_convention'));
    if (name === '') return false;
    // The names that defer the decision to whoever opens the folder next.
    if (/\b(final|latest|new|newest|use ?this|copy|good ?one|master ?copy)\b/i.test(name)) return true;
    // A convention has parts in an order; one bare phrase is not a pattern.
    const hasPattern = /[_\-./|]|\{|\[|<|\b(then|followed by)\b/i.test(name);
    return !hasPattern && name.split(/\s+/).length < 4;
  },

  'technical-storage-unestimated': (ctx) => {
    if (rows(ctx.get('technical', 'input_list')).length === 0) return false;
    const rate = str(ctx.get('deliver', 'session_sample_rate'));
    if (rate === '' || rate === 'undecided') return false;
    // Only points at the gap. The arithmetic stays in schedule-storage-short.
    return num(ctx.get('technical', 'storage_estimate')) === null;
  },

  'technical-material-not-final': (ctx) => {
    if (!closeToDate(ctx)) return false;
    const status = str(ctx.get('technical', 'material_status'));
    if (status === 'draft' || status === 'not_started') return true;
    if (ctx.pathway === 'live') {
      const plot = str(ctx.get('technical', 'stage_plot'));
      if (plot === 'none' || plot === 'draft') return true;
    }
    return rows(ctx.get('technical', 'content_list')).some((r) =>
      ['idea', 'draft'].includes(cell(r, 'c_status')),
    );
  },
});

// ── stage 6 · readiness ──────────────────────────────────────────────────────

registerRuleLogic({
  'readiness-backup-unreachable': (ctx) =>
    rows(ctx.get('readiness', 'contingency_table')).some((r) => {
      const backup = cell(r, 'ct_backup');
      // An absent backup is the NEXT rule's business, not this one's.
      if (blank(backup)) return false;
      if (blank(cell(r, 'ct_switch'))) return true;
      // ct_switch_time is a duration, and people write "5 min" as often as "5",
      // so ask only whether it was answered — not whether it parses as a number.
      if (blank(cell(r, 'ct_switch_time'))) return true;
      if (blank(cell(r, 'ct_owner'))) return true;
      return cell(r, 'ct_tested') === 'no';
    }),

  'readiness-critical-system-no-backup': (ctx) => {
    const table = rows(ctx.get('readiness', 'contingency_table'));
    if (table.length === 0) return false;
    if (table.some((r) => cell(r, 'ct_primary') !== '' && blank(cell(r, 'ct_backup')))) return true;
    const systems = systemsText(ctx);
    const services = many(ctx.get('define', 'services'));
    if (services.includes('live_recording') && !mentions(systems, /record|capture|deck/)) return true;
    if (services.includes('livestream_feed') && !mentions(systems, /stream|encoder/)) return true;
    const wireless = num(ctx.get('people', 'wireless_channels'));
    return wireless !== null && wireless > 0 && !mentions(systems, /wireless|radio|\brf\b/);
  },

  'readiness-hazard-uncontrolled': (ctx) =>
    rows(ctx.get('readiness', 'hazard_register')).some(
      (r) =>
        cell(r, 'hz_severity') === 'severe' &&
        (cell(r, 'hz_control') === '' || cell(r, 'hz_owner') === ''),
    ),

  'readiness-hazard-open': (ctx) => {
    if (!closeToDate(ctx)) return false;
    return rows(ctx.get('readiness', 'hazard_register')).some((r) => {
      if (cell(r, 'hz_status') === 'open') return true;
      return (
        cell(r, 'hz_severity') === 'serious' &&
        (cell(r, 'hz_owner') === '' || cell(r, 'hz_control') === '')
      );
    });
  },

  'readiness-equipment-ready-untested': (ctx) => {
    const manifest = rows(ctx.get('readiness', 'manifest'));
    if (manifest.length === 0) return false;
    const systemTest = str(ctx.get('readiness', 'system_test'));
    const claimsTested = manifest.some((r) => ['system_tested', 'packed'].includes(cell(r, 'eq_prep')));
    if (claimsTested && (systemTest === '' || systemTest === 'none')) return true;
    const packed = manifest.some((r) => cell(r, 'eq_prep') === 'packed');
    return packed && str(ctx.get('readiness', 'bench_test')) === 'none';
  },

  'readiness-no-dress-rehearsal': (ctx) => {
    const complex =
      rows(ctx.get('schedule', 'day_schedule')).some((b) => cell(b, 'blk_type') === 'changeover') ||
      str(ctx.get('people', 'stream_operator')) !== '' ||
      str(ctx.get('people', 'remote_participants')) !== '' ||
      str(ctx.get('technical', 'click_playback')) === 'yes';
    if (!complex) return false;
    return !rows(ctx.get('readiness', 'rehearsal_plan')).some(
      (r) =>
        ['dress_rehearsal', 'tech_rehearsal'].includes(cell(r, 'rh_type')) &&
        cell(r, 'rh_status') !== 'skipped',
    );
  },

  'readiness-permission-pending': (ctx) => {
    if (when(ctx.get('schedule', 'production_date')) === null) return false;
    return rows(ctx.get('readiness', 'rights_register')).some((r) =>
      ['Requested', 'Pending'].includes(cell(r, 'rt_status')),
    );
  },

  'readiness-rights-missing': (ctx) => {
    // A performance in a venue is not publication, and is commonly covered by
    // the venue's own licensing, so it is not a destination for this rule.
    const published = many(ctx.get('define', 'platform')).filter(
      (p) => p !== 'internal' && p !== 'live_venue',
    );
    if (published.length === 0) return false;
    return rows(ctx.get('readiness', 'rights_register')).some(
      (r) =>
        ['composition', 'master', 'sync', 'sample'].includes(cell(r, 'rt_type')) &&
        // Restricted is deliberately absent: it needs reading, not blocking.
        ['Missing', 'Expired'].includes(cell(r, 'rt_status')),
    );
  },

  'readiness-rigging-not-signed': (ctx) =>
    str(ctx.get('people', 'rigging_required')) === 'yes' &&
    str(ctx.get('readiness', 'rigging_signoff')) !== 'Approved',

  'readiness-power-not-signed': (ctx) => {
    const source = str(ctx.get('people', 'power_source'));
    // generator_direct is excluded on C's instruction, along with the house and
    // existing-outlet cases: this sign-off is about a distribution system.
    if (source !== 'temporary_distro' && source !== 'generator_distro') return false;
    return str(ctx.get('readiness', 'power_signoff')) !== 'Approved';
  },

  'readiness-outdoor-no-weather-plan': (ctx) =>
    many(ctx.get('define', 'location_type')).includes('outdoor') &&
    str(ctx.get('readiness', 'weather_plan')) === '',

  // The triggers field is advisory; this fires on the authority alone.
  'readiness-no-decision-authority': (ctx) => str(ctx.get('readiness', 'decision_authority')) === '',

  'readiness-hearing-plan-missing': (ctx) =>
    str(ctx.get('readiness', 'hearing_plan')) === '' && str(ctx.get('technical', 'level_plan')) === '',

  'readiness-packet-no-revision': (ctx) => {
    const docs = rows(ctx.get('readiness', 'packet_docs'));
    if (docs.length === 0) return false;
    if (docs.some((r) => cell(r, 'doc_revision') === '' || cell(r, 'doc_approver') === '')) return true;
    return (
      str(ctx.get('readiness', 'call_sheet_status')) === 'issued' &&
      str(ctx.get('readiness', 'distribution')) === ''
    );
  },

  'readiness-condition-unowned': (ctx) => {
    const open = rows(ctx.get('readiness', 'conditions')).filter(
      (r) => cell(r, 'cond_status') === 'open',
    );
    if (open.length === 0) return false;
    if (
      open.some((r) =>
        ['cond_owner', 'cond_resolve_by', 'cond_approved_by'].some((c) => cell(r, c) === ''),
      )
    ) {
      return true;
    }
    return str(ctx.get('readiness', 'declared_by')) === '';
  },
});

// ── the two batch-2 activities ───────────────────────────────────────────────

/** Rows of the seeded input list. */
const inputs = (c: ActivityContext) => rows(c.get('technical', 'input_list'));
/** Rows of the seeded contingency table. */
const contingency = (c: ActivityContext) => rows(c.get('readiness', 'contingency_table'));

registerActivityChecks({
  'build-the-input-list': [
    {
      id: 'stereo-has-two',
      label: 'Every stereo source occupies two console channels and two recorder tracks',
      /**
       * Stricter than the `technical-stereo-one-channel` rule, on purpose. The
       * rule only inspects rows already declared as two channels, because a
       * user's own list is theirs to fill in. C's `passWhen` for THIS exercise
       * asks about every stereo source, and the seed hides one as a row named
       * "Keys (stereo)" carrying a single channel. Monoing it is still allowed —
       * the exercise says so — but the change has to be written down.
       */
      met: (c) =>
        inputs(c).length > 0 &&
        !inputs(c).some((r) => {
          if (cellNum(r, 'in_channels') === 2) {
            return !namesTwo(cell(r, 'in_console')) || !namesTwo(cell(r, 'in_track'));
          }
          const readsStereo = /\bstereo\b|\bpair\b/i.test(cell(r, 'in_source'));
          return readsStereo && cell(r, 'in_notes') === '';
        }),
    },
    {
      id: 'phantom-correct',
      label: 'Every condenser has phantom on, and no line or playback row has it on',
      met: (c) =>
        inputs(c).length > 0 &&
        !inputs(c).some((r) => {
          const capture = cell(r, 'in_capture');
          if (capture === 'condenser_mic') return cell(r, 'in_phantom') !== 'on';
          if (['line', 'playback', 'ribbon_mic'].includes(capture)) {
            return cell(r, 'in_phantom') === 'on';
          }
          return false;
        }),
    },
    {
      id: 'di-on-instruments',
      label:
        'The bass and the acoustic guitar pickup reach the console through a DI on a balanced connection',
      met: (c) => {
        const direct = inputs(c).filter((r) => /bass|acoustic/i.test(cell(r, 'in_source')));
        return (
          direct.length > 0 &&
          direct.every(
            (r) => cell(r, 'in_capture') === 'di' && ['xlr', 'trs'].includes(cell(r, 'in_connection')),
          )
        );
      },
    },
    {
      id: 'fits-the-channels',
      label: 'The summed channel count is no more than the channels available',
      met: (c) => {
        const need = inputs(c).reduce((n, r) => n + (cellNum(r, 'in_channels') ?? 1), 0);
        const have = num(c.get('schedule', 'available_channels'));
        return have !== null && need > 0 && need <= have;
      },
    },
    {
      id: 'click-has-a-cue-mix',
      label: 'At least one cue mix exists that carries the click',
      met: (c) =>
        rows(c.get('technical', 'cue_mixes')).some(
          (r) => cell(r, 'cm_who') !== '' && /click|metronome/i.test(cell(r, 'cm_content')),
        ),
    },
  ],

  'production-emergency': [
    {
      id: 'recorder-switch-planned',
      label: 'The recorder has a backup with a switch method, a switch time and a named person',
      met: (c) =>
        contingency(c).some((r) => {
          if (!/record|capture|deck/i.test(cell(r, 'ct_system'))) return false;
          return (
            !blank(cell(r, 'ct_backup')) &&
            !blank(cell(r, 'ct_switch')) &&
            !blank(cell(r, 'ct_switch_time')) &&
            !blank(cell(r, 'ct_owner'))
          );
        }),
    },
    {
      id: 'wireless-has-a-backup',
      label: 'The vocal wireless has a backup with a switch method and an owner',
      met: (c) =>
        contingency(c).some((r) => {
          if (!/wireless|radio|\brf\b|vocal/i.test(cell(r, 'ct_system'))) return false;
          return (
            !blank(cell(r, 'ct_backup')) && !blank(cell(r, 'ct_switch')) && !blank(cell(r, 'ct_owner'))
          );
        }),
    },
    {
      id: 'hazard-controlled',
      label: 'Every severe hazard has a control and an owner, and is marked controlled',
      met: (c) => {
        const severe = rows(c.get('readiness', 'hazard_register')).filter(
          (r) => cell(r, 'hz_severity') === 'severe',
        );
        return (
          severe.length > 0 &&
          severe.every(
            (r) =>
              cell(r, 'hz_control') !== '' &&
              cell(r, 'hz_owner') !== '' &&
              cell(r, 'hz_status') === 'controlled',
          )
        );
      },
    },
    {
      id: 'authority-and-triggers',
      label: 'A decision authority is named, with the triggers written down',
      met: (c) =>
        str(c.get('readiness', 'decision_authority')) !== '' &&
        str(c.get('readiness', 'decision_triggers')) !== '',
    },
    {
      id: 'minimum-viable-described',
      label: 'The simplest version is described, and it still keeps the live recording',
      // C's passWhen: "deliverable-preserving". Cutting the recording to make
      // the night easier is not a contingency, it is a different production.
      met: (c) =>
        str(c.get('readiness', 'minimum_viable')) !== '' &&
        many(c.get('define', 'services')).includes('live_recording'),
    },
    {
      id: 'accepted-risk-recorded',
      label:
        'Anything accepted rather than fixed is in the conditions table with an owner, a date and who accepted it',
      met: (c) => {
        const conditions = rows(c.get('readiness', 'conditions'));
        return (
          conditions.length > 0 &&
          conditions.every(
            (r) =>
              cell(r, 'cond_item') !== '' &&
              cell(r, 'cond_owner') !== '' &&
              cell(r, 'cond_resolve_by') !== '' &&
              cell(r, 'cond_approved_by') !== '',
          )
        );
      },
    },
  ],
});

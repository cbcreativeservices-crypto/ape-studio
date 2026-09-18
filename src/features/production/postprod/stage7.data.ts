/**
 * Post-Production · Stage 7 — Finish to Specification.
 *
 * Owner's spec, Post-Production Chapter 3, Stages 19 (Finalization Strategy),
 * 20 (Loudness and Level Compliance), 21 (Music Mastering and Program
 * Finishing), 22 (Technical Quality Control), 23 (Creative and Editorial
 * Review) and 24 (Accessibility and Alternate Audiences).
 *
 * The spec is emphatic on two points and both are enforced rather than
 * described: "The lab must not teach one universal loudness target" — so every
 * target here is read from the brief and never supplied — and "Automated
 * testing assists quality control but does not replace listening."
 */
import type { StageDef } from '../schema';

export const STAGE7_FINISH: StageDef = {
  stageId: "finish",
  num: 7,
  title: "Finish to Specification",
  intro: "Take an approved mix and make it the thing that gets delivered: at the right level, processed only where it needs to be, checked by a machine, then checked by a person, and usable by the audience it is actually for.",
  whyItMatters: "Finishing is the stage where it is easiest to do damage while appearing to add value. Every process here has a version that looks like an improvement on a meter and is a loss in the room — louder, flatter, wider, cleaner. The discipline is the same throughout: know the number you are required to hit, match levels before comparing anything, and remember that a file that passes every automated check can still be unlistenable.",
  notices: [
    {
      kind: "legal",
      text: "Loudness, peak and format requirements come from your delivery specification, the platform, and in some territories from broadcast regulation. Enter the numbers you have been given. This lab has no universal target to offer and will not invent one."
    },
    {
      kind: "safety",
      text: "This stage involves repeated close listening to the same material at decision-making levels. Keep the level moderate and take breaks. Fatigue makes everything sound duller, which is exactly the condition under which people add brightness and loudness they will regret."
    }
  ],
  sections: [
    {
      sectionId: "strategy",
      title: "Finishing Strategy",
      intro: "What kind of finishing this production needs, before deciding how much of it to do.",
      fields: [
        {
          fieldId: "finish_type",
          label: "What kind of finishing",
          kind: "choice",
          required: true,
          options: [
            { value: "music_master", label: "Music mastering" },
            { value: "program_finish", label: "Programme finishing" },
            { value: "broadcast", label: "Broadcast or platform compliance" },
            { value: "episode", label: "Episode assembly and finishing" },
            { value: "none", label: "None — the mix is the deliverable" }
          ]
        },
        {
          fieldId: "collection_context",
          label: "Is this part of a set",
          kind: "choice",
          help: "An album, a series or a season has to be consistent with itself, which is a different job from making one item as good as possible.",
          required: true,
          options: [
            { value: "standalone", label: "Standalone" },
            { value: "album", label: "Part of an album or collection" },
            { value: "series", label: "Part of a series or season" }
          ]
        },
        {
          fieldId: "collection_checks",
          label: "Checked across the set",
          kind: "multiChoice",
          help: "Consistent, not identical. Items in a set should feel like they belong together and still be themselves.",
          options: [
            { value: "loudness", label: "Loudness" },
            { value: "tone", label: "Tonal balance" },
            { value: "image", label: "Stereo image" },
            { value: "speech", label: "Speech level" },
            { value: "lf", label: "Low-frequency balance" },
            { value: "dynamics", label: "Dynamic range" },
            { value: "noise", label: "Noise floor" },
            { value: "endings", label: "Intro and ending behaviour" },
            { value: "spacing", label: "Spacing between items" }
          ]
        },
        {
          fieldId: "premaster_checked",
          label: "Pre-master review done",
          kind: "multiChoice",
          help: "What the mix arrives with. Finding these now is cheaper than finding them after processing has been built on top of them.",
          options: [
            { value: "clipping", label: "Clipping" },
            { value: "headroom", label: "Headroom" },
            { value: "bus_processing", label: "Mix-bus processing understood" },
            { value: "starts_ends", label: "Beginning and ending" },
            { value: "noise", label: "Noise" },
            { value: "fades", label: "Fades" },
            { value: "orientation", label: "Channel orientation" },
            { value: "phase", label: "Phase" },
            { value: "rate_depth", label: "Sample rate and bit depth" },
            { value: "approved", label: "Mix approval status confirmed" }
          ]
        }
      ]
    },
    {
      sectionId: "loudness",
      title: "Loudness and Level",
      intro: "Measured against the specification recorded in stage 1, not against habit or against what other productions do.",
      fields: [
        {
          fieldId: "measured_integrated",
          label: "Measured integrated loudness",
          kind: "number",
          help: "Measured over the whole programme, from the actual file you intend to deliver.",
          unit: "LUFS",
          required: true
        },
        {
          fieldId: "measured_true_peak",
          label: "Measured maximum true peak",
          kind: "number",
          help: "True peak, not sample peak. The difference appears after encoding, which is where a compliant file stops being compliant.",
          unit: "dBTP",
          required: true
        },
        {
          fieldId: "measured_lra",
          label: "Measured loudness range",
          kind: "number",
          help: "How much the loudness varies across the programme. A very low number on speech usually means it has been flattened.",
          unit: "LU"
        },
        {
          fieldId: "measurement_source",
          label: "What was measured",
          kind: "choice",
          help: "Measuring the session output and delivering an encoded file are two different measurements.",
          required: true,
          options: [
            { value: "exported_file", label: "The exported deliverable" },
            { value: "session", label: "The session output" },
            { value: "estimate", label: "An estimate" }
          ]
        },
        {
          fieldId: "loudness_action",
          label: "If it is out of specification, what you did",
          kind: "choice",
          help: "Overall gain is usually the right answer and almost never the one people reach for first.",
          options: [
            { value: "in_spec", label: "Nothing — it is in specification" },
            { value: "gain", label: "Adjusted overall gain" },
            { value: "automation", label: "Revised automation" },
            { value: "peaks", label: "Controlled isolated peaks" },
            { value: "compression", label: "Changed compression" },
            { value: "limiting", label: "Changed limiting" },
            { value: "rebalance", label: "Rebalanced speech or lead" },
            { value: "lf", label: "Reduced low-frequency energy" },
            { value: "restore", label: "Restored dynamics" },
            { value: "separate", label: "Made a separate delivery version" }
          ]
        }
      ]
    },
    {
      sectionId: "mastering",
      title: "Mastering and Processing",
      intro: "Every process needs a reason. Doing nothing is a legitimate outcome and sometimes the correct one.",
      fields: [
        {
          fieldId: "processes_applied",
          label: "Processes applied",
          kind: "table",
          help: "One row per process, with what it is for. A row you cannot fill in is a row to remove.",
          columns: [
            {
              columnId: "ma_process",
              label: "Process",
              kind: "choice",
              options: [
                { value: "gain", label: "Gain" },
                { value: "eq", label: "Equalisation" },
                { value: "compression", label: "Compression" },
                { value: "multiband", label: "Multiband" },
                { value: "saturation", label: "Saturation" },
                { value: "stereo", label: "Stereo image" },
                { value: "midside", label: "Mid-side" },
                { value: "limiting", label: "Limiting" },
                { value: "dither", label: "Dither" },
                { value: "src", label: "Sample-rate conversion" }
              ]
            },
            { columnId: "ma_purpose", label: "What it is for", kind: "text" },
            { columnId: "ma_amount", label: "How much", kind: "text" },
            {
              columnId: "ma_compared",
              label: "Level-matched comparison",
              kind: "choice",
              options: [
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" }
              ]
            }
          ]
        },
        {
          fieldId: "no_processing_considered",
          label: "Was leaving it alone considered",
          kind: "choice",
          help: "A mix that already meets the objective does not need to be improved to prove the stage happened.",
          options: [
            { value: "yes_processed", label: "Yes — and processing was still the right call" },
            { value: "yes_left", label: "Yes — and it was left alone" },
            { value: "no", label: "Not considered" }
          ]
        },
        {
          fieldId: "dither_applied",
          label: "Dither",
          kind: "choice",
          help: "Considered when reducing bit depth, applied once, at the last point where the depth changes.",
          options: [
            { value: "once_final", label: "Once, at the final depth reduction" },
            { value: "multiple", label: "More than once in the chain" },
            { value: "none_needed", label: "Not needed — no depth reduction" },
            { value: "not_considered", label: "Not considered" }
          ]
        },
        {
          fieldId: "comparison_set",
          label: "Compared against",
          kind: "multiChoice",
          help: "All of these at matched levels, or the comparison only reports which is louder.",
          options: [
            { value: "original_mix", label: "The original mix" },
            { value: "processed", label: "The processed version" },
            { value: "reference", label: "A reference production" },
            { value: "previous", label: "The previous revision" },
            { value: "encoded", label: "The encoded delivery version" }
          ]
        }
      ]
    },
    {
      sectionId: "qc",
      title: "Technical Quality Control",
      intro: "The machine checks first, because it is tireless. Then a person listens to the whole thing, because the machine cannot tell whether it is any good.",
      fields: [
        {
          fieldId: "automated_checks",
          label: "Automated checks run",
          kind: "multiChoice",
          options: [
            { value: "clipping", label: "Digital clipping" },
            { value: "true_peak", label: "True-peak overs" },
            { value: "silence", label: "Unexpected silence" },
            { value: "channels", label: "Missing or duplicated channels" },
            { value: "reversal", label: "Channel reversal" },
            { value: "duration", label: "Duration" },
            { value: "rate", label: "Sample rate" },
            { value: "depth", label: "Bit depth" },
            { value: "loudness", label: "Loudness" },
            { value: "phase", label: "Phase" },
            { value: "dc", label: "DC offset" },
            { value: "corruption", label: "File integrity" },
            { value: "metadata", label: "Metadata" },
            { value: "filenames", label: "Filenames" }
          ]
        },
        {
          fieldId: "full_playback_review",
          label: "Full uninterrupted playback of the actual deliverable",
          kind: "choice",
          help: "The exported file, start to finish, without stopping. Not the session, and not in sections.",
          required: true,
          options: [
            { value: "yes", label: "Yes, the exported file, start to finish" },
            { value: "session", label: "Listened in the session, not the export" },
            { value: "partial", label: "Parts of it" },
            { value: "no", label: "Not yet" }
          ]
        },
        {
          fieldId: "encoded_check",
          label: "Was the encoded version checked",
          kind: "choice",
          help: "Encoding changes transients, stereo image, top end and true peak. A file that was compliant can stop being compliant on the way out.",
          options: [
            { value: "yes", label: "Yes, compared with the master" },
            { value: "no", label: "No" },
            { value: "na", label: "No encoded version is being delivered" }
          ]
        },
        {
          fieldId: "qc_log",
          label: "QC issue log",
          kind: "table",
          help: "Every issue with a position, an owner and a state. An issue without a position cannot be found again.",
          columns: [
            { columnId: "qc_where", label: "Position", kind: "text" },
            { columnId: "qc_what", label: "Issue", kind: "text" },
            {
              columnId: "qc_severity",
              label: "Severity",
              kind: "choice",
              options: [
                { value: "blocking", label: "Blocks delivery" },
                { value: "should_fix", label: "Should be fixed" },
                { value: "note", label: "Note only" }
              ]
            },
            { columnId: "qc_owner", label: "Owner", kind: "text" },
            { columnId: "qc_action", label: "Required action", kind: "text" },
            {
              columnId: "qc_status",
              label: "Status",
              kind: "choice",
              options: [
                { value: "open", label: "Open" },
                { value: "fixed", label: "Fixed" },
                { value: "verified", label: "Fixed and verified" },
                { value: "accepted", label: "Accepted as is" }
              ]
            }
          ]
        }
      ]
    },
    {
      sectionId: "creative",
      title: "Creative and Editorial Review",
      intro: "Technical compliance does not mean the production works. This is the pass that asks whether it does.",
      fields: [
        {
          fieldId: "creative_review_done",
          label: "Creative review done",
          kind: "choice",
          required: true,
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "Not yet" }
          ]
        },
        {
          fieldId: "review_perspectives",
          label: "Reviewed from whose position",
          kind: "multiChoice",
          help: "Switching seats catches different things. The audience member is the one most often skipped and most often right.",
          options: [
            { value: "mixer", label: "Mixer" },
            { value: "client", label: "Client" },
            { value: "performer", label: "Performer or contributor" },
            { value: "editor", label: "Editor" },
            { value: "audience", label: "Audience member" },
            { value: "broadcast", label: "Broadcast engineer" },
            { value: "accessibility", label: "Accessibility reviewer" },
            { value: "qc", label: "Technical QC operator" }
          ]
        },
        {
          fieldId: "creative_findings",
          label: "What the creative review found",
          kind: "longText",
          help: "Including \"nothing\". Intelligibility, focus, emotional impact, transitions, whether it holds together against the rest of the set.",
          placeholder: "e.g. The second half loses focus — the bed is doing too much under the interview from 18:00."
        },
        {
          fieldId: "meets_brief",
          label: "Does it do what the brief asked for",
          kind: "choice",
          help: "Measured against the creative brief recorded in stage 1, not against how good it sounds.",
          required: true,
          options: [
            { value: "yes", label: "Yes" },
            { value: "mostly", label: "Mostly, with reservations noted" },
            { value: "no", label: "No" }
          ]
        }
      ]
    },
    {
      sectionId: "access",
      title: "Accessibility and Alternate Audiences",
      intro: "Whether the people this is for can actually use it.",
      notices: [
        {
          kind: "legal",
          text: "Accessibility requirements for broadcast, streaming and public-sector content are set by law and by platform policy, and they differ by territory. Record what your delivery specification requires. Whether a particular obligation applies to this production is a question for your client and their legal advice."
        }
      ],
      fields: [
        {
          fieldId: "speech_accessibility",
          label: "Speech accessibility checked",
          kind: "multiChoice",
          help: "Most accessibility failures in audio are ordinary mix problems that a specific audience cannot work around.",
          options: [
            { value: "intelligibility", label: "Intelligibility throughout" },
            { value: "consistent_level", label: "Consistent speech level" },
            { value: "masking", label: "Masking by music or effects" },
            { value: "speaker_id", label: "Who is speaking is clear" },
            { value: "critical_info", label: "Critical information is not buried" },
            { value: "small_speaker", label: "Checked on a small speaker" },
            { value: "noisy", label: "Checked in a noisy environment" }
          ]
        },
        {
          fieldId: "access_deliverables",
          label: "Accessibility deliverables required",
          kind: "multiChoice",
          options: [
            { value: "transcript", label: "Time-aligned transcript" },
            { value: "captions", label: "Closed captions" },
            { value: "speaker_id", label: "Speaker identification" },
            { value: "sound_desc", label: "Relevant sound descriptions" },
            { value: "audio_desc", label: "Audio description" },
            { value: "language", label: "Alternate language versions" },
            { value: "none", label: "None required" }
          ]
        },
        {
          fieldId: "access_status",
          label: "State of the accessibility package",
          kind: "choice",
          options: [
            { value: "complete", label: "Complete and checked" },
            { value: "drafted", label: "Drafted, not checked" },
            { value: "not_started", label: "Not started" },
            { value: "na", label: "Nothing required" }
          ]
        },
        {
          fieldId: "access_timing_checked",
          label: "Has caption or description timing been verified",
          kind: "choice",
          help: "Captions that drift are worse than none, because a viewer trusts them until they notice.",
          options: [
            { value: "yes", label: "Yes, against the final master" },
            { value: "earlier_version", label: "Against an earlier version" },
            { value: "no", label: "No" },
            { value: "na", label: "Not applicable" }
          ]
        }
      ]
    }
  ],
  rules: [
    {
      ruleId: "finish-loudness-out-of-spec",
      watches: ["finish.measured_integrated", "brief.loudness_target", "brief.loudness_tolerance"],
      severity: "blocker",
      kind: "mismatch",
      title: "The programme misses its loudness target",
      detail: "The measured integrated loudness is outside the target and tolerance recorded in the brief. Delivered as it stands, it will either be rejected or normalised by the platform, and a platform turning it down is not the same as you turning it down.",
      fixHint: "Overall gain first. Reach for compression or limiting only if the loudness range is genuinely the problem, and re-measure the exported file rather than the session.",
      needsLogic: true,
      logicIntent: "Fire when brief.loudness_target is a number and measured_integrated is a number and the difference exceeds brief.loudness_tolerance, or exceeds a default tolerance that ccode chooses when none is set. Do not fire when either measurement is empty.",
      learnMore: { route: "MeterLab" }
    },
    {
      ruleId: "finish-true-peak-over",
      watches: ["finish.measured_true_peak", "brief.true_peak_max"],
      severity: "blocker",
      kind: "mismatch",
      title: "True peak above the permitted ceiling",
      detail: "The measured true peak exceeds the maximum in the specification. This is the most common single cause of a delivery rejection, and it gets worse rather than better through encoding.",
      fixHint: "Lower the ceiling on the limiter, or take overall gain off and re-measure. Check the encoded version too — encoding raises true peak.",
      needsLogic: true,
      logicIntent: "Fire when both brief.true_peak_max and measured_true_peak are numbers and the measurement is greater than the ceiling."
    },
    {
      ruleId: "finish-measured-wrong-thing",
      watches: ["finish.measurement_source"],
      severity: "attention",
      kind: "mismatch",
      title: "The measurement is not of the deliverable",
      detail: "Loudness was measured on the session output or estimated rather than on the file that will actually be delivered. Export settings, conversion and encoding all change the numbers.",
      fixHint: "Export the deliverable and measure that file. It is the only measurement anybody downstream will be able to reproduce.",
      needsLogic: true,
      logicIntent: "Fire when measurement_source is session or estimate."
    },
    {
      ruleId: "finish-no-target-to-hit",
      watches: ["finish.measured_integrated", "brief.loudness_target"],
      severity: "attention",
      kind: "missing",
      title: "Measured, with nothing to measure against",
      detail: "The programme has been measured and the brief carries no loudness target, so there is no way to say whether the number is right.",
      fixHint: "Get the target from the client or the platform's published requirements and record it in stage 1. This lab will not supply one, because there is no universal answer.",
      needsLogic: true,
      logicIntent: "Fire when measured_integrated is a number and brief.loudness_target is empty."
    },
    {
      ruleId: "finish-over-limited",
      watches: ["finish.measured_lra", "finish.loudness_action", "finish.processes_applied"],
      severity: "attention",
      kind: "unrealistic",
      title: "The dynamics have been flattened to reach the target",
      detail: "The loudness range is very small and the correction was compression or limiting. Pushed this way, a programme gets louder and stops being able to emphasise anything — and on a platform that normalises, the loudness is turned back down while the flatness stays.",
      fixHint: "Take overall gain off instead and let the target be met at a lower level. Where the range is genuinely too wide, ride the loud moments rather than compressing everything.",
      needsLogic: true,
      logicIntent: "Fire when measured_lra is a number below a threshold that ccode chooses and loudness_action is compression or limiting."
    },
    {
      ruleId: "finish-process-without-purpose",
      watches: ["finish.processes_applied"],
      severity: "attention",
      kind: "missing",
      title: "A finishing process with no stated purpose",
      detail: "Rows in the processing table have nothing in the purpose column. Processing applied because the stage exists is the specific way a good mix is made slightly worse and called mastered.",
      fixHint: "Write what each one is for. Any row that cannot be justified should come out, and an empty chain is a valid result.",
      needsLogic: true,
      logicIntent: "Fire for each processes_applied row where ma_purpose is empty. Do not fire when the table is empty."
    },
    {
      ruleId: "finish-not-level-matched",
      watches: ["finish.processes_applied", "finish.comparison_set"],
      severity: "attention",
      kind: "unrealistic",
      title: "Finishing decisions made without matching levels",
      detail: "Processes are recorded as not level-matched when compared. At this stage nearly everything raises the level, so an unmatched comparison reliably chooses more processing — which is how a chain grows without anyone deciding it should.",
      fixHint: "Match the output level and switch. If the processed version still wins, it has earned its place.",
      needsLogic: true,
      logicIntent: "Fire when any processes_applied row has ma_compared no, or when the table has rows and comparison_set is empty."
    },
    {
      ruleId: "finish-no-consideration-of-none",
      watches: ["finish.no_processing_considered", "finish.processes_applied"],
      severity: "info",
      kind: "mismatch",
      title: "Doing nothing was never on the table",
      detail: "Processing was applied without considering whether the mix already met the objective. Sometimes it does, and the right finishing is a gain change and a format conversion.",
      fixHint: "Listen to the unprocessed mix against the specification once, level-matched. It is a short test with a useful answer.",
      needsLogic: true,
      logicIntent: "Fire when no_processing_considered is no and processes_applied has rows."
    },
    {
      ruleId: "finish-dither-repeated",
      watches: ["finish.dither_applied", "brief.target_bit_depth"],
      severity: "attention",
      kind: "mismatch",
      title: "Dither applied more than once",
      detail: "Dither is noise added deliberately to hide the error from reducing bit depth. Applied repeatedly through a chain it stops solving that and simply accumulates.",
      fixHint: "Apply it once, at the last point where the bit depth is reduced, and nowhere else.",
      needsLogic: true,
      logicIntent: "Fire when dither_applied is multiple."
    },
    {
      ruleId: "finish-dither-not-considered",
      watches: ["finish.dither_applied", "brief.target_bit_depth", "session.session_depth"],
      severity: "info",
      kind: "missing",
      title: "Bit depth is dropping and dither has not been considered",
      detail: "The session is deeper than the delivery, so the depth is reduced somewhere. Whether to dither is a decision worth making rather than inheriting from an export preset.",
      fixHint: "Decide, and record it. On quiet, sparse material it matters more than on dense material.",
      needsLogic: true,
      logicIntent: "Fire when brief.target_bit_depth is 16 and session.session_depth is 24 or 32f, and dither_applied is not_considered."
    },
    {
      ruleId: "finish-no-full-listen",
      watches: ["finish.full_playback_review", "finish.automated_checks"],
      severity: "blocker",
      kind: "missing",
      title: "Nobody has listened to the deliverable all the way through",
      detail: "Automated checks assist quality control; they do not replace it. Every fault that matters most here — a wrong version, a missing element, an edit that reads badly, an ending that truncates — passes every automated test there is.",
      fixHint: "Play the exported file from start to finish without stopping, and do it before delivery rather than after somebody else does.",
      needsLogic: true,
      logicIntent: "Fire when full_playback_review is no, partial or session."
    },
    {
      ruleId: "finish-automated-only",
      watches: ["finish.automated_checks", "finish.qc_log"],
      severity: "info",
      kind: "mismatch",
      title: "The QC log contains only what a machine can find",
      detail: "Every issue logged is a technical measurement. A pass that finds no editorial issues at all in a whole programme has usually not been looking for them.",
      fixHint: "Listen for the human faults: missing words, abrupt ambience, automation that misses a transition, a level jump between sections.",
      needsLogic: true,
      logicIntent: "Fire when automated_checks has four or more entries and qc_log is empty while full_playback_review is yes."
    },
    {
      ruleId: "finish-qc-issue-unowned",
      watches: ["finish.qc_log"],
      severity: "attention",
      kind: "missing",
      title: "A QC issue with no position, owner or action",
      detail: "An issue nobody owns, or that cannot be located again, is an issue that gets delivered. \"Something odd around the middle\" is not a finding.",
      fixHint: "Every row needs a position, a person and a required action. Accepted-as-is is a legitimate status and still needs a name against it.",
      needsLogic: true,
      logicIntent: "Fire for each qc_log row where qc_where, qc_owner or qc_action is empty. Do not fire when the log is empty."
    },
    {
      ruleId: "finish-blocking-qc-open",
      watches: ["finish.qc_log"],
      severity: "blocker",
      kind: "conflict",
      title: "A delivery-blocking issue is still open",
      detail: "The QC log contains an issue marked as blocking delivery and it is not fixed and verified.",
      fixHint: "Fix it and verify the fix in the exported file, or change its severity deliberately with a reason recorded.",
      needsLogic: true,
      logicIntent: "Fire when any qc_log row has qc_severity blocking and qc_status open or fixed — fixed but unverified still counts as open for a blocking issue."
    },
    {
      ruleId: "finish-encoded-unchecked",
      watches: ["finish.encoded_check", "brief.required_versions"],
      severity: "attention",
      kind: "missing",
      title: "The encoded version has not been compared with the master",
      detail: "Encoding alters transients, high frequencies, stereo image and true peak. A master that sits exactly on its ceiling will exceed it once encoded, and nobody checks the file the listener actually receives.",
      fixHint: "Encode as the platform will, and compare it with the master at matched level. Re-measure true peak on the encoded file.",
      needsLogic: true,
      logicIntent: "Fire when encoded_check is no."
    },
    {
      ruleId: "finish-no-creative-review",
      watches: ["finish.creative_review_done", "finish.meets_brief"],
      severity: "attention",
      kind: "missing",
      title: "Technically finished, creatively unreviewed",
      detail: "The production has not been assessed against what it was for. A programme can pass every specification and still fail to do the thing the brief asked for, and that failure is not visible on any meter.",
      fixHint: "Listen once as the audience rather than as the mixer, against the creative brief in stage 1.",
      needsLogic: true,
      logicIntent: "Fire when creative_review_done is no, or when meets_brief is no with creative_findings empty."
    },
    {
      ruleId: "finish-collection-inconsistent",
      watches: ["finish.collection_context", "finish.collection_checks"],
      severity: "attention",
      kind: "missing",
      title: "Part of a set, checked only on its own",
      detail: "This item belongs to an album or a series and nothing has been compared across the set. Items finished individually to sound their best end up not sounding like each other, which is most obvious exactly where it matters — between two of them.",
      fixHint: "Compare loudness, tone and speech level across the set, level-matched. The goal is that they belong together, not that they are identical.",
      needsLogic: true,
      logicIntent: "Fire when collection_context is album or series and collection_checks is empty."
    },
    {
      ruleId: "finish-speech-buried",
      watches: ["finish.speech_accessibility", "finish.access_deliverables"],
      severity: "attention",
      kind: "missing",
      title: "Speech accessibility has not been checked",
      detail: "Nothing is recorded about intelligibility, masking or whether critical information survives. Most accessibility failures in audio are not exotic — they are ordinary masking that a listener with hearing loss, a small speaker or a noisy room cannot work around.",
      fixHint: "Listen on a phone speaker at low level and note anything you cannot follow. That single test catches most of it.",
      needsLogic: true,
      logicIntent: "Fire when speech_accessibility is empty."
    },
    {
      ruleId: "finish-access-timing-stale",
      watches: ["finish.access_timing_checked", "finish.access_status"],
      severity: "attention",
      kind: "mismatch",
      title: "Captions timed against a version that no longer exists",
      detail: "Caption or description timing was verified against an earlier cut. Any change to the programme's duration or edit points since then has moved them, and captions that drift are worse than none because a viewer trusts them until they notice.",
      fixHint: "Re-verify the timing against the final master, and re-verify it again after any further revision.",
      needsLogic: true,
      logicIntent: "Fire when access_timing_checked is earlier_version or no, while access_deliverables includes captions, audio_desc or transcript."
    }
  ],
  activity: {
    activityId: "meet-the-specification",
    title: "Meet the specification",
    prompt: "An episode is finished and ready to go. The delivery specification asks for −16 LUFS integrated with a tolerance of 1 LU, and a true-peak ceiling of −1 dBTP. Somebody has already done a finishing pass and the file measures −13.2 LUFS, +0.4 dBTP, with a loudness range of 2 LU. Bring it into specification — and work out which of the things that were done to get it here need undoing rather than adding to.",
    onlyFor: ["podcast", "live"],
    seed: {
      "brief.loudness_target": -16,
      "brief.loudness_tolerance": 1,
      "brief.true_peak_max": -1,
      "brief.target_bit_depth": "16",
      "brief.required_versions": ["full_mix"],
      "session.session_depth": "24",
      "finish.finish_type": "program_finish",
      "finish.collection_context": "series",
      "finish.collection_checks": [],
      "finish.measured_integrated": -13.2,
      "finish.measured_true_peak": 0.4,
      "finish.measured_lra": 2,
      "finish.measurement_source": "session",
      "finish.loudness_action": "limiting",
      "finish.no_processing_considered": "no",
      "finish.dither_applied": "not_considered",
      "finish.comparison_set": [],
      "finish.full_playback_review": "partial",
      "finish.encoded_check": "no",
      "finish.creative_review_done": "no",
      "finish.meets_brief": "mostly",
      "finish.speech_accessibility": [],
      "finish.access_deliverables": ["transcript", "captions"],
      "finish.access_status": "drafted",
      "finish.access_timing_checked": "earlier_version",
      "finish.automated_checks": ["clipping", "true_peak", "loudness", "duration", "rate"],
      "finish.qc_log": [],
      "finish.processes_applied": [
        { ma_process: "limiting", ma_purpose: "", ma_amount: "6 dB of reduction", ma_compared: "no" },
        { ma_process: "compression", ma_purpose: "", ma_amount: "Broadband, 4:1", ma_compared: "no" }
      ]
    },
    passWhen: "The measured integrated loudness is within tolerance of the target and the true peak is at or below the ceiling; the measurement is taken from the exported deliverable rather than the session; the correction is no longer compression or limiting while the loudness range stays flattened; every processing row has a stated purpose and a level-matched comparison; dither is decided rather than left unconsidered; the deliverable has been played through in full; the encoded version has been compared with the master; a creative review has happened; speech accessibility has been checked; the caption timing is verified against the final master; and the series has been compared across the set.",
    debrief: "The file was three decibels too loud and over the ceiling, and the instinct — more limiting — is what got it there. Six decibels of limiting and a broadband compressor had already squeezed the loudness range down to 2 LU, which on speech means nothing can be emphasised any more, and the platform was going to turn the whole thing down by three decibels anyway. The fix was gain, downward, which costs nothing and gives the dynamics back. Two of the other faults would have survived every meter in the room: captions timed against a cut that no longer exists, and an episode in a series that had never been compared with the episodes around it. And notice the measurement itself was of the session, not the file — so even the numbers everyone was reacting to were not the numbers the client would get."
  }
};

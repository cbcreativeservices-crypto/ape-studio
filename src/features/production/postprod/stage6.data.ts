/**
 * Post-Production · Stage 6 — Prepare, Mix and Print.
 *
 * Owner's spec, Post-Production Chapter 2, Stages 14 (Mix Preparation and
 * Routing), 15 (The Mixing Process), 16 (Automation), 17 (Stereo, Surround and
 * Immersive Mixing) and 18 (Stems and Print Masters).
 *
 * The spec's recurring instruction — level-match before comparing anything —
 * appears as a rule rather than as advice, because it is the single habit that
 * decides whether every other judgement in this stage is sound.
 *
 * NOTE for whoever extends this: the lab records mix DECISIONS as structured
 * data. It does not simulate a mixer, and it must not pretend to. The hands-on
 * teaching for EQ, dynamics and gain structure already exists in EqLab,
 * GainLab and MeterLab, and the rules here deep-link to them.
 */
import type { StageDef } from '../schema';

export const STAGE6_MIX: StageDef = {
  stageId: "mix",
  num: 6,
  title: "Prepare, Mix and Print",
  intro: "Get the session into a state you can mix in, balance it, move what needs to move, and print the versions the delivery asks for — proving as you go that the stems still add up to the mix.",
  whyItMatters: "Most mix problems are routing problems wearing a disguise. A send with no return, a bus processed twice, a group that does not reach the print — none of these sound like faults, they sound like a mix that is not working, and hours get spent on the balance instead. Printing is where the same thing happens at the end: stems that do not recombine into the approved mix are discovered by the client, in the deliverable, after everyone has gone home.",
  notices: [
    {
      kind: "safety",
      text: "Set a monitoring level you can work at for hours and keep it there. Judging a mix loud is the fastest way to make it, and the fastest way to lose the hearing the work depends on. Take breaks; the ear recovers far more slowly than it seems to."
    }
  ],
  sections: [
    {
      sectionId: "prep",
      title: "Preparing to Mix",
      intro: "Everything that should be settled before the first fader moves.",
      fields: [
        {
          fieldId: "edits_confirmed",
          label: "Is the edit locked",
          kind: "choice",
          help: "Mixing against material that can still change means balancing something twice.",
          required: true,
          options: [
            { value: "locked", label: "Yes — edit approved and locked" },
            { value: "mostly", label: "Mostly, small changes possible" },
            { value: "open", label: "No, the edit is still moving" }
          ]
        },
        {
          fieldId: "mix_version_created",
          label: "Was a new session version made for the mix",
          kind: "choice",
          help: "The edit session is the thing you go back to when a mix decision turns out to be wrong.",
          required: true,
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No — mixing in the edit session" }
          ]
        },
        {
          fieldId: "session_tidied",
          label: "Session preparation done",
          kind: "multiChoice",
          help: "Unglamorous and load-bearing. Each one of these prevents a specific kind of lost hour.",
          options: [
            { value: "unused_hidden", label: "Unused material hidden, not deleted" },
            { value: "alternates_kept", label: "Alternates preserved" },
            { value: "consolidated", label: "Approved clips consolidated" },
            { value: "fades_checked", label: "Fades confirmed" },
            { value: "sync_checked", label: "Synchronisation re-checked" },
            { value: "labelled", label: "Tracks labelled" },
            { value: "routing_verified", label: "Routing verified" },
            { value: "plugins_available", label: "Processing available on this machine" }
          ]
        },
        {
          fieldId: "monitoring",
          label: "What you are listening on",
          kind: "longText",
          help: "The main system, and what you cross-check on. A mix judged on one system is a mix that works on one system.",
          required: true,
          placeholder: "e.g. Main monitors in the room; cross-checked on headphones and a phone speaker"
        },
        {
          fieldId: "monitoring_level_fixed",
          label: "Is the monitoring level consistent",
          kind: "choice",
          help: "Balance judgements change with level. A moving reference makes every comparison unreliable, including the ones with yourself an hour ago.",
          options: [
            { value: "calibrated", label: "Calibrated and kept there" },
            { value: "consistent", label: "Not calibrated, but kept consistent" },
            { value: "varies", label: "Varies through the session" }
          ]
        },
        {
          fieldId: "reference_material",
          label: "Reference material used",
          kind: "text",
          help: "Something finished, in the same idiom, to check against. Level-matched, or it will only tell you which is louder.",
          allowNa: true
        },
        {
          fieldId: "delay_compensation",
          label: "Is delay compensation confirmed working",
          kind: "choice",
          help: "Uncompensated latency on a parallel path is heard as a thin or hollow sound rather than as a delay, which is why it gets mixed around instead of fixed.",
          options: [
            { value: "yes", label: "Yes" },
            { value: "unknown", label: "Not checked" },
            { value: "partial", label: "Some paths are outside it" }
          ]
        }
      ]
    },
    {
      sectionId: "architecture",
      title: "Mix Architecture",
      intro: "What routes to what. This is the section that prevents the most wasted hours.",
      fields: [
        {
          fieldId: "bus_structure",
          label: "Bus and routing structure",
          kind: "table",
          help: "One row per bus, group, send or print path. The destination column is where double routing becomes visible.",
          required: true,
          columns: [
            { columnId: "bs_name", label: "Bus or path", kind: "text" },
            {
              columnId: "bs_kind",
              label: "Type",
              kind: "choice",
              options: [
                { value: "group", label: "Group or subgroup" },
                { value: "vca", label: "VCA or control group" },
                { value: "aux", label: "Auxiliary send" },
                { value: "return", label: "Effects return" },
                { value: "stem", label: "Stem bus" },
                { value: "print", label: "Print track" },
                { value: "monitor", label: "Monitoring path" },
                { value: "master", label: "Master output" }
              ]
            },
            { columnId: "bs_feeds", label: "Feeds", kind: "text" },
            { columnId: "bs_processing", label: "Processing on it", kind: "text" },
            {
              columnId: "bs_in_stems",
              label: "Reaches the stems",
              kind: "choice",
              options: [
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "na", label: "Not applicable" }
              ]
            }
          ]
        },
        {
          fieldId: "stem_structure",
          label: "Stem structure",
          kind: "multiChoice",
          help: "The stems this production needs. Every alternate version in the brief comes out of these.",
          options: [
            { value: "dialogue", label: "Dialogue or speech" },
            { value: "music", label: "Music" },
            { value: "effects", label: "Effects" },
            { value: "foley", label: "Foley" },
            { value: "backgrounds", label: "Backgrounds" },
            { value: "narration", label: "Narration" },
            { value: "drums", label: "Drums" },
            { value: "bass", label: "Bass" },
            { value: "instruments", label: "Instruments" },
            { value: "lead_vocal", label: "Lead vocal" },
            { value: "bv", label: "Background vocals" },
            { value: "adverts", label: "Advertisements" },
            { value: "remote", label: "Remote sources" },
            { value: "me", label: "Combined M&E" }
          ]
        },
        {
          fieldId: "headroom_plan",
          label: "Gain structure and headroom",
          kind: "longText",
          help: "Where the level sits at each stage, and how much room is left on the master. Deciding it beats discovering it.",
          required: true,
          placeholder: "e.g. clip gain to roughly −18 dBFS average, groups peaking near −10, master around −6 before finishing"
        },
        {
          fieldId: "master_processing",
          label: "Processing on the master bus",
          kind: "choice",
          help: "Mix-bus processing is a legitimate choice. It is only a problem when the stems are printed underneath it and then recombined through it again.",
          options: [
            { value: "none", label: "None" },
            { value: "light", label: "Light — printed into the stems consistently" },
            { value: "heavy", label: "Heavy" },
            { value: "finishing_only", label: "Left for the finishing stage" }
          ]
        }
      ]
    },
    {
      sectionId: "mixing",
      title: "The Mix",
      intro: "Balance first, then everything else. The lab records what you decided and why, not the moves themselves.",
      fields: [
        {
          fieldId: "balance_first",
          label: "Was a static balance established before processing",
          kind: "choice",
          help: "Levels, panning and mutes. Processing applied to a balance that does not work yet is processing aimed at the wrong problem.",
          required: true,
          options: [
            { value: "yes", label: "Yes" },
            { value: "partly", label: "Partly" },
            { value: "no", label: "No — processing from the start" }
          ]
        },
        {
          fieldId: "priority",
          label: "What has priority in this mix",
          kind: "longText",
          help: "What the listener must hear at every moment, and what gives way to it. This is the sentence that settles most balance arguments.",
          required: true,
          helpBy: {
            podcast: "Usually speech intelligibility, everywhere, without exception. Say so if it is, and say what the exceptions are if there are any."
          }
        },
        {
          fieldId: "processing_used",
          label: "Processing applied",
          kind: "multiChoice",
          options: [
            { value: "corrective_eq", label: "Corrective EQ" },
            { value: "tonal_eq", label: "Tonal EQ" },
            { value: "compression", label: "Compression" },
            { value: "limiting", label: "Limiting" },
            { value: "gating", label: "Gating or expansion" },
            { value: "deess", label: "De-essing" },
            { value: "multiband", label: "Multiband dynamics" },
            { value: "parallel", label: "Parallel compression" },
            { value: "sidechain", label: "Sidechain control" },
            { value: "manual_rides", label: "Manual gain riding" },
            { value: "reverb", label: "Reverb" },
            { value: "delay", label: "Delay" },
            { value: "saturation", label: "Saturation or harmonic processing" }
          ]
        },
        {
          fieldId: "level_matched_comparisons",
          label: "Are processing comparisons level-matched",
          kind: "choice",
          help: "Anything that raises the level sounds better. Without matching, every comparison in this stage silently chooses the louder option.",
          required: true,
          options: [
            { value: "yes", label: "Yes" },
            { value: "sometimes", label: "Sometimes" },
            { value: "no", label: "No" }
          ]
        },
        {
          fieldId: "depth_approach",
          label: "How depth is created",
          kind: "multiChoice",
          help: "Reverb is one of these and rarely the most effective.",
          options: [
            { value: "level", label: "Level" },
            { value: "direct_reverb", label: "Direct-to-reverberant ratio" },
            { value: "predelay", label: "Pre-delay" },
            { value: "hf", label: "High-frequency content" },
            { value: "early", label: "Early reflections" },
            { value: "delay", label: "Delay" },
            { value: "reverb", label: "Reverb" },
            { value: "eq_perspective", label: "Perspective EQ" },
            { value: "width", label: "Stereo width" }
          ]
        },
        {
          fieldId: "cross_checked",
          label: "Checked on other systems",
          kind: "multiChoice",
          options: [
            { value: "headphones", label: "Headphones" },
            { value: "small", label: "A small or single speaker" },
            { value: "phone", label: "A phone" },
            { value: "car", label: "A car" },
            { value: "mono", label: "In mono" },
            { value: "quiet", label: "At a low level" }
          ]
        }
      ]
    },
    {
      sectionId: "automation",
      title: "Automation",
      intro: "Following the programme rather than finding one setting and hoping.",
      fields: [
        {
          fieldId: "automation_used",
          label: "What is automated",
          kind: "multiChoice",
          options: [
            { value: "volume", label: "Volume" },
            { value: "pan", label: "Pan" },
            { value: "mute", label: "Mute" },
            { value: "sends", label: "Sends" },
            { value: "plugin", label: "Processing parameters" },
            { value: "reverb", label: "Reverb and delay amount" },
            { value: "dialogue_rides", label: "Dialogue or vocal rides" },
            { value: "ducking", label: "Music ducking" },
            { value: "object", label: "Object position" },
            { value: "fade", label: "Final fade" },
            { value: "none", label: "Nothing is automated" }
          ]
        },
        {
          fieldId: "automation_checked",
          label: "Automation checked for",
          kind: "multiChoice",
          help: "The specific faults that survive a mix and appear in the printed master.",
          options: [
            { value: "jumps", label: "Abrupt jumps" },
            { value: "stray", label: "Unintended written data" },
            { value: "transitions", label: "Missed transitions" },
            { value: "mutes_return", label: "Muted elements returning" },
            { value: "send_no_return", label: "Send automation without a matching return" },
            { value: "pumping", label: "Unnatural pumping" },
            { value: "out_of_range", label: "Automation outside the programme" }
          ]
        },
        {
          fieldId: "static_or_dynamic",
          label: "Does the mix follow the programme",
          kind: "choice",
          help: "One setting that is a compromise everywhere is usually worse than a moving one that is right in each place.",
          options: [
            { value: "dynamic", label: "Yes — it follows scenes or sections" },
            { value: "some", label: "In places" },
            { value: "static", label: "Static throughout" }
          ]
        }
      ]
    },
    {
      sectionId: "spatial",
      title: "Format and Translation",
      intro: "What the mix is in, and what happens to it when somebody listens in something else.",
      fields: [
        {
          fieldId: "mix_format",
          label: "Mix format",
          kind: "choice",
          required: true,
          options: [
            { value: "mono", label: "Mono" },
            { value: "stereo", label: "Stereo" },
            { value: "binaural", label: "Binaural" },
            { value: "5_1", label: "5.1" },
            { value: "7_1", label: "7.1" },
            { value: "immersive", label: "Height or object-based" }
          ]
        },
        {
          fieldId: "fold_down_checked",
          label: "Fold-down and compatibility checked",
          kind: "multiChoice",
          help: "Most listeners will not hear the format you mixed in. What they hear is the fold-down.",
          options: [
            { value: "stereo_fold", label: "Stereo fold-down" },
            { value: "mono", label: "Mono compatibility" },
            { value: "phase", label: "Phase and correlation" },
            { value: "binaural", label: "Binaural render" },
            { value: "small", label: "Small speaker" },
            { value: "headphones", label: "Headphones" },
            { value: "speech_balance", label: "Speech balance in the fold-down" },
            { value: "centre", label: "Centre-channel dependence" }
          ]
        },
        {
          fieldId: "lfe_policy",
          label: "Low-frequency handling",
          kind: "choice",
          help: "The LFE channel is an effects channel, not a bass channel. Routing all low frequencies to it is a common and expensive misunderstanding.",
          onlyFor: ["live"],
          options: [
            { value: "main_bass", label: "Bass stays in the main channels; LFE used for effect" },
            { value: "managed", label: "Bass management handles playback" },
            { value: "all_to_lfe", label: "Low frequencies routed to LFE" },
            { value: "na", label: "Not a multichannel mix" }
          ]
        }
      ]
    },
    {
      sectionId: "prints",
      title: "Prints and Stems",
      intro: "The files the mix becomes, and the proof that they are what they claim to be.",
      fields: [
        {
          fieldId: "prints_made",
          label: "Prints made",
          kind: "table",
          help: "One row per printed file. The verified column is the one that matters.",
          columns: [
            { columnId: "pr_name", label: "Print", kind: "text" },
            {
              columnId: "pr_kind",
              label: "Type",
              kind: "choice",
              options: [
                { value: "full", label: "Full mix" },
                { value: "stem", label: "Stem" },
                { value: "instrumental", label: "Instrumental" },
                { value: "acappella", label: "A cappella" },
                { value: "clean", label: "Clean version" },
                { value: "me", label: "M&E" },
                { value: "fold", label: "Fold-down" },
                { value: "review", label: "Review copy" }
              ]
            },
            { columnId: "pr_channels", label: "Channels", kind: "number" },
            { columnId: "pr_duration", label: "Duration", kind: "duration" },
            {
              columnId: "pr_checked",
              label: "Checked",
              kind: "choice",
              options: [
                { value: "listened", label: "Listened through" },
                { value: "spot", label: "Spot-checked" },
                { value: "not_checked", label: "Not checked" }
              ]
            },
            { columnId: "pr_notes", label: "Notes", kind: "text" }
          ]
        },
        {
          fieldId: "recombination_test",
          label: "Do the stems recombine into the mix",
          kind: "choice",
          help: "Sum the stems and null them against the full mix. If it does not cancel, something is processed twice, missing, or out of phase — and the client will find it.",
          required: true,
          options: [
            { value: "nulls", label: "Yes — tested and it cancels" },
            { value: "close", label: "Close, with a known and accepted difference" },
            { value: "differs", label: "No, they do not match" },
            { value: "untested", label: "Not tested" },
            { value: "no_stems", label: "No stems required" }
          ]
        },
        {
          fieldId: "recombination_difference",
          label: "If they do not match, what is different",
          kind: "longText",
          help: "Level, missing shared effects, duplicated processing, missing automation, phase. Knowing which one it is takes minutes; guessing takes days.",
          allowNa: true
        },
        {
          fieldId: "print_verification",
          label: "Prints checked for",
          kind: "multiChoice",
          options: [
            { value: "start_end", label: "Correct start and end" },
            { value: "duration", label: "Correct duration" },
            { value: "sync", label: "Synchronisation" },
            { value: "channels", label: "Channel count and order" },
            { value: "routing", label: "Routing" },
            { value: "complete", label: "Nothing missing" },
            { value: "no_double", label: "No double processing" },
            { value: "metadata", label: "Metadata" },
            { value: "naming", label: "Naming" }
          ]
        }
      ]
    }
  ],
  rules: [
    {
      ruleId: "mix-edit-not-locked",
      watches: ["mix.edits_confirmed", "edit.assembly_state"],
      severity: "attention",
      kind: "unrealistic",
      title: "Mixing against an edit that can still change",
      detail: "The edit is not locked. Any balance, automation move or processing decision tied to a specific moment may have to be made again when that moment moves.",
      fixHint: "Lock the edit, or mix only what survives a re-cut — overall tone and static balance — until it is locked.",
      needsLogic: true,
      logicIntent: "Fire when edits_confirmed is open, or when it is mostly while automation_used is non-empty and does not contain only none."
    },
    {
      ruleId: "mix-no-separate-version",
      watches: ["mix.mix_version_created"],
      severity: "attention",
      kind: "unsafe",
      title: "Mixing in the edit session",
      detail: "There is no separate mix version, so the edit state you might need to return to is being overwritten as you go.",
      fixHint: "Save a new version now. It costs nothing and it is the only way back if a mix decision turns out to have been wrong.",
      needsLogic: true,
      logicIntent: "Fire when mix_version_created is no."
    },
    {
      ruleId: "mix-no-static-balance",
      watches: ["mix.balance_first", "mix.processing_used"],
      severity: "attention",
      kind: "mismatch",
      title: "Processing before the balance works",
      detail: "Processing is in use and no static balance was established first. Almost everything people reach for EQ and compression to solve is a level and panning problem, and it stays one underneath the processing.",
      fixHint: "Mute everything, bring it up on faders and pan alone, and see how far that gets. It is usually further than expected.",
      needsLogic: true,
      logicIntent: "Fire when balance_first is no, or when it is partly and processing_used has four or more entries.",
      learnMore: { route: "GainLabHome" }
    },
    {
      ruleId: "mix-not-level-matched",
      watches: ["mix.level_matched_comparisons", "mix.processing_used"],
      severity: "attention",
      kind: "unrealistic",
      title: "Comparisons that are not level-matched",
      detail: "Processing is being judged without matching levels. Anything that raises the level sounds better in an A/B, so every comparison quietly picks the louder option — which is how a mix ends up processed far past where it stopped improving.",
      fixHint: "Match the output level before switching. Saturation and compression especially cannot be judged honestly any other way.",
      needsLogic: true,
      logicIntent: "Fire when processing_used is non-empty and level_matched_comparisons is no or sometimes.",
      learnMore: { route: "MeterLab" }
    },
    {
      ruleId: "mix-no-priority",
      watches: ["mix.priority"],
      severity: "attention",
      kind: "missing",
      title: "Nothing recorded as having priority",
      detail: "Without a stated priority, every balance decision is relitigated from scratch and the mix ends up as an average of the last few opinions.",
      fixHint: "One sentence: what the listener must hear at all times, and what gives way to it.",
      needsLogic: true,
      logicIntent: "Fire when priority is empty."
    },
    {
      ruleId: "mix-no-headroom-plan",
      watches: ["mix.headroom_plan"],
      severity: "attention",
      kind: "missing",
      title: "No gain structure recorded",
      detail: "With no plan for where level sits at each stage, headroom is whatever is left over, and the finishing stage inherits a master with nowhere to go.",
      fixHint: "Decide the average level at the clip, the group and the master, and leave the master enough room for the finishing work.",
      needsLogic: true,
      logicIntent: "Fire when headroom_plan is empty.",
      learnMore: { route: "GainLabHome" }
    },
    {
      ruleId: "mix-monitoring-level-varies",
      watches: ["mix.monitoring_level_fixed"],
      severity: "attention",
      kind: "unrealistic",
      title: "The monitoring level moves while you judge",
      detail: "Perceived balance changes with level — bass and top especially. A reference that moves makes every comparison unreliable, including comparisons with your own work from an hour ago.",
      fixHint: "Pick a level you can work at all day and leave it. Check quietly and loudly deliberately, not accidentally.",
      needsLogic: true,
      logicIntent: "Fire when monitoring_level_fixed is varies."
    },
    {
      ruleId: "mix-one-system-only",
      watches: ["mix.cross_checked", "mix.monitoring"],
      severity: "attention",
      kind: "missing",
      title: "The mix has only been heard on one system",
      detail: "Nothing is recorded as a cross-check. A mix judged only on the main system is a mix that is known to work on the main system.",
      fixHint: "Headphones, a small speaker and a phone catch different faults. Mono catches the ones that matter most.",
      needsLogic: true,
      logicIntent: "Fire when cross_checked is empty."
    },
    {
      ruleId: "mix-send-without-return",
      watches: ["mix.bus_structure"],
      severity: "attention",
      kind: "conflict",
      title: "A send with nowhere to arrive",
      detail: "An auxiliary send in the routing table has no matching return. It will look like it is working, use processing, and contribute nothing — which is normally diagnosed as the effect \"not being strong enough\".",
      fixHint: "Every send needs a return that reaches the master and the stems. Check the destination column against the return rows.",
      needsLogic: true,
      logicIntent: "Fire when bus_structure contains an aux row and no return row, or when an aux row's bs_feeds names nothing that matches another row's bs_name."
    },
    {
      ruleId: "mix-bus-not-in-stems",
      watches: ["mix.bus_structure", "mix.stem_structure"],
      severity: "blocker",
      kind: "conflict",
      title: "Something in the mix does not reach the stems",
      detail: "A group, return or bus is marked as not reaching the stems. Those stems cannot reconstruct the approved mix, and every version built from them — the instrumental, the clean version, the M&E — will be missing the same thing.",
      fixHint: "Route it into the appropriate stem, or record deliberately why it is excluded and check that no delivered version depends on it.",
      needsLogic: true,
      logicIntent: "Fire when any bus_structure row has bs_in_stems no and bs_kind is group, vca, return or aux."
    },
    {
      ruleId: "mix-stems-do-not-recombine",
      watches: ["mix.recombination_test", "mix.recombination_difference"],
      severity: "blocker",
      kind: "conflict",
      title: "The stems do not add up to the mix",
      detail: "Summed, the stems do not reconstruct the approved mix. Whatever the difference is, it is in every deliverable built from them, and it is the client who finds it.",
      fixHint: "Null the sum against the full mix and listen to what is left. Level, a shared effect that only reaches one stem, processing applied twice, or missing automation — the residual usually says which.",
      needsLogic: true,
      logicIntent: "Fire when recombination_test is differs. Also fire when it is close and recombination_difference is empty, since an accepted difference nobody has described is an untested one."
    },
    {
      ruleId: "mix-stems-untested",
      watches: ["mix.recombination_test", "mix.prints_made"],
      severity: "attention",
      kind: "missing",
      title: "Stems printed and never recombined",
      detail: "Stems exist and nobody has checked that they sum back to the mix. This test takes two minutes and catches a problem that is otherwise found at delivery.",
      fixHint: "Sum the stems, invert against the full mix, and listen. Silence is the answer you want.",
      needsLogic: true,
      logicIntent: "Fire when recombination_test is untested and either stem_structure is non-empty or prints_made contains a stem row."
    },
    {
      ruleId: "mix-master-processing-under-stems",
      watches: ["mix.master_processing", "mix.recombination_test"],
      severity: "attention",
      kind: "conflict",
      title: "Heavy master processing with stems underneath it",
      detail: "Substantial processing sits on the master bus while stems are printed from below it. Recombining them puts that processing through a second time, or leaves it out entirely — and the two versions will not match.",
      fixHint: "Either print the stems through the same processing, or move the master processing to the finishing stage where it is applied once to a finished mix.",
      needsLogic: true,
      logicIntent: "Fire when master_processing is heavy and recombination_test is not nulls and not no_stems."
    },
    {
      ruleId: "mix-versions-need-stems",
      watches: ["mix.stem_structure", "brief.required_versions"],
      severity: "attention",
      kind: "missing",
      title: "A required version has no stem to come from",
      detail: "The brief asks for a version that is made by muting part of the mix — an instrumental, an a cappella, an M&E or a clean version — and no matching stem structure exists to build it from.",
      fixHint: "Add the stems those versions come out of before printing anything. Reverse-engineering them afterwards means re-mixing.",
      needsLogic: true,
      logicIntent: "Fire when brief.required_versions includes instrumental, acappella, me or clean, and stem_structure lacks a plausible counterpart — no music or instruments stem for an instrumental, no lead_vocal for an a cappella, no dialogue or narration for an M&E."
    },
    {
      ruleId: "mix-automation-unchecked",
      watches: ["mix.automation_used", "mix.automation_checked"],
      severity: "attention",
      kind: "missing",
      title: "Automation written and never checked",
      detail: "Automation exists and none of the usual faults have been checked for. Stray written data and mutes that return are silent in the session and audible in the print.",
      fixHint: "Play the programme through watching the automation, and specifically look for data outside the programme and sends whose returns do not follow them.",
      needsLogic: true,
      logicIntent: "Fire when automation_used is non-empty and does not contain only none, AND automation_checked is empty."
    },
    {
      ruleId: "mix-static-where-it-should-move",
      watches: ["mix.static_or_dynamic", "mix.automation_used"],
      severity: "info",
      kind: "mismatch",
      title: "One setting for the whole programme",
      detail: "Nothing follows the programme. A single compromise balance across scenes or sections is normally solving the loudest moment and abandoning the quietest.",
      fixHint: "Ride the thing with priority — dialogue, lead vocal — rather than compressing it harder until it survives everywhere.",
      needsLogic: true,
      logicIntent: "Fire when static_or_dynamic is static, or when automation_used contains only none."
    },
    {
      ruleId: "mix-fold-down-unchecked",
      watches: ["mix.mix_format", "mix.fold_down_checked"],
      severity: "attention",
      kind: "missing",
      title: "A multichannel mix nobody has folded down",
      detail: "The mix is in a format most listeners will not hear directly, and the fold-down has not been checked. Centre-channel speech that vanishes into a stereo downmix is the classic result.",
      fixHint: "Check the stereo fold-down and mono, listening specifically to whether the speech survives.",
      needsLogic: true,
      logicIntent: "Fire when mix_format is 5_1, 7_1, immersive or binaural, and fold_down_checked is empty."
    },
    {
      ruleId: "mix-all-bass-to-lfe",
      watches: ["mix.lfe_policy"],
      severity: "attention",
      kind: "mismatch",
      title: "Low frequencies routed to the LFE channel",
      detail: "LFE is a separate effects channel, not the mix's bass channel. Playback systems apply their own bass management to the main channels, and a mix whose low end lives only in LFE loses it wherever LFE is attenuated or absent — which includes most fold-downs.",
      fixHint: "Keep the bass in the main channels and use LFE for deliberate low-frequency effect.",
      needsLogic: true,
      logicIntent: "Fire when lfe_policy is all_to_lfe.",
      onlyFor: ["live"]
    },
    {
      ruleId: "mix-print-not-checked",
      watches: ["mix.prints_made", "mix.print_verification"],
      severity: "attention",
      kind: "missing",
      title: "A print nobody has listened to",
      detail: "Printed files are marked as unchecked. A print is a new file made by a process that can fail quietly — a muted track, a missed automation pass, a wrong start point.",
      fixHint: "Listen to each print, at least at the head, the tail and one point in the middle. Check the duration and the channel count while you are there.",
      needsLogic: true,
      logicIntent: "Fire for each prints_made row with pr_checked not_checked, or when prints_made has rows and print_verification is empty."
    }
  ],
  activity: {
    activityId: "route-the-mix",
    title: "Route the mix",
    prompt: "A session has arrived from another engineer, mixed and printed, with the stems delivered and the client asking why the instrumental sounds different from the full mix. The balance is fine. Nothing is distorted. Read the routing table and the print list, find the three structural faults, and put the mix in a state where the stems actually reconstruct it.",
    seed: {
      "mix.edits_confirmed": "locked",
      "mix.mix_version_created": "no",
      "mix.balance_first": "yes",
      "mix.priority": "Lead vocal and the snare.",
      "mix.level_matched_comparisons": "sometimes",
      "mix.monitoring": "Main monitors.",
      "mix.monitoring_level_fixed": "varies",
      "mix.cross_checked": [],
      "mix.headroom_plan": "",
      "mix.master_processing": "heavy",
      "mix.mix_format": "stereo",
      "mix.recombination_test": "differs",
      "mix.recombination_difference": "",
      "mix.print_verification": [],
      "mix.automation_used": ["volume"],
      "mix.automation_checked": [],
      "mix.static_or_dynamic": "some",
      "mix.processing_used": ["corrective_eq", "compression", "saturation", "limiting", "reverb"],
      "mix.stem_structure": ["drums", "bass", "lead_vocal"],
      "mix.bus_structure": [
        { bs_name: "Drum group", bs_kind: "group", bs_feeds: "Master", bs_processing: "Bus compression", bs_in_stems: "yes" },
        { bs_name: "Bass group", bs_kind: "group", bs_feeds: "Master", bs_processing: "", bs_in_stems: "yes" },
        { bs_name: "Vocal group", bs_kind: "group", bs_feeds: "Master", bs_processing: "De-esser", bs_in_stems: "yes" },
        { bs_name: "Guitars and keys", bs_kind: "group", bs_feeds: "Master", bs_processing: "", bs_in_stems: "no" },
        { bs_name: "Vocal plate send", bs_kind: "aux", bs_feeds: "Plate return", bs_processing: "", bs_in_stems: "na" },
        { bs_name: "Master", bs_kind: "master", bs_feeds: "Print", bs_processing: "Bus compressor, saturation, limiter", bs_in_stems: "na" }
      ],
      "mix.prints_made": [
        { pr_name: "NG_fullmix_v1", pr_kind: "full", pr_channels: 2, pr_duration: "4", pr_checked: "listened", pr_notes: "" },
        { pr_name: "NG_instrumental_v1", pr_kind: "instrumental", pr_channels: 2, pr_duration: "4", pr_checked: "not_checked", pr_notes: "" },
        { pr_name: "NG_stem_drums_v1", pr_kind: "stem", pr_channels: 2, pr_duration: "4", pr_checked: "not_checked", pr_notes: "" },
        { pr_name: "NG_stem_bass_v1", pr_kind: "stem", pr_channels: 2, pr_duration: "4", pr_checked: "not_checked", pr_notes: "" },
        { pr_name: "NG_stem_vocal_v1", pr_kind: "stem", pr_channels: 2, pr_duration: "4", pr_checked: "not_checked", pr_notes: "" }
      ]
    },
    onlyFor: ["music", "live"],
    passWhen: "The guitars and keys group reaches the stems; the vocal plate send has a matching return in the routing table; the stems recombine into the mix, or the remaining difference is described; the master processing is no longer heavy with stems printed beneath it; every print has been checked and a print verification list exists; a separate mix version has been made; a gain structure is recorded; the mix has been cross-checked on at least one other system; comparisons are level-matched; and the monitoring level no longer varies.",
    debrief: "The client was right and the balance was never the problem. Three structural faults, none of which makes a sound: a whole group of instruments that never reached the stems, which is why the instrumental was missing the guitars and keys; a reverb send with no return in the table, so the plate was doing nothing and somebody had compensated by pushing the vocal forward; and heavy master-bus processing with the stems printed from underneath it, so summing them could never reconstruct what the client approved. Notice what the null test would have done here. Two minutes, at the point of printing, and all three would have shown up as a residual instead of as an email. That is why the recombination test is the one required question in this stage."
  }
};

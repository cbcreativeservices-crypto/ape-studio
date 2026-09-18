/**
 * Post-Production · Stage 4 — Select, Assemble and Edit.
 *
 * Owner's spec, Post-Production Chapter 1, Stages 5 (Review, Selection and
 * Assembly), 6 (Dialogue and Spoken-Word Editing), 7 (Music Editing and
 * Comping) and 8 (Cleanup and Restoration Preparation), consolidated.
 *
 * The spec's two warnings are carried as rules rather than paragraphs: the
 * technically cleanest take is not automatically the best creative choice, and
 * aggressive restoration can be worse than the problem it removes.
 */
import type { StageDef } from '../schema';

export const STAGE4_EDIT: StageDef = {
  stageId: "edit",
  num: 4,
  title: "Select, Assemble and Edit",
  intro: "Decide what is in the programme, put it in order, and make the joins invisible. This is where a pile of material becomes a thing with a shape.",
  whyItMatters: "Editing is the stage where the production stops being everything that was recorded and becomes the one version that exists. Two failures cost the most: choosing takes on technical cleanliness rather than on performance, which produces a flawless recording of nothing in particular; and repairing damage so hard that the repair becomes the new damage. Both are avoidable, and both are much easier to avoid than to undo.",
  notices: [
    {
      kind: "legal",
      text: "Editing speech changes what somebody is recorded as having said. Removing a qualification, joining two separate answers or reordering a sentence can alter meaning even when every word is genuine. Where the material is journalism, testimony, or anything a contributor agreed to on terms, the standard that applies is your publisher's and your jurisdiction's, not this app's."
    }
  ],
  sections: [
    {
      sectionId: "review",
      title: "Source Review and Selection",
      intro: "Going through the material and deciding what it is before deciding what to do with it.",
      fields: [
        {
          fieldId: "review_done",
          label: "How much of the material has been reviewed",
          kind: "choice",
          help: "Everything, or the parts somebody remembered.",
          required: true,
          options: [
            { value: "all", label: "All of it, start to finish" },
            { value: "most", label: "Most of it" },
            { value: "spot", label: "Spot-checked" },
            { value: "none", label: "Not yet" }
          ]
        },
        {
          fieldId: "take_log",
          label: "Take and source log",
          kind: "table",
          help: "One row per take or source worth a decision. The reason column is the part that is still useful in three weeks.",
          required: true,
          columns: [
            { columnId: "tk_item", label: "Item or take", kind: "text" },
            {
              columnId: "tk_verdict",
              label: "Verdict",
              kind: "choice",
              options: [
                { value: "preferred", label: "Preferred" },
                { value: "alternate", label: "Alternate" },
                { value: "technical", label: "Technical problem" },
                { value: "performance", label: "Performance problem" },
                { value: "incomplete", label: "Incomplete" },
                { value: "duplicate", label: "Duplicate" },
                { value: "unusable", label: "Unusable" },
                { value: "needs_repair", label: "Needs repair" },
                { value: "needs_approval", label: "Needs approval" }
              ]
            },
            { columnId: "tk_reason", label: "Why", kind: "text" },
            {
              columnId: "tk_chosen_on",
              label: "Chosen on",
              kind: "multiChoice",
              options: [
                { value: "performance", label: "Performance" },
                { value: "intelligibility", label: "Intelligibility" },
                { value: "timing", label: "Timing" },
                { value: "pitch", label: "Pitch" },
                { value: "tone", label: "Tone" },
                { value: "noise", label: "Noise" },
                { value: "technical", label: "Technical quality" },
                { value: "continuity", label: "Continuity" },
                { value: "emotion", label: "Emotional suitability" },
                { value: "sync", label: "Visual sync" }
              ]
            },
            { columnId: "tk_notes", label: "Notes", kind: "text" }
          ]
        },
        {
          fieldId: "markers_used",
          label: "What the markers record",
          kind: "multiChoice",
          help: "Markers are the memory of the review pass. Without them the pass has to happen again.",
          options: [
            { value: "boundaries", label: "Scene or section boundaries" },
            { value: "good_takes", label: "Good takes" },
            { value: "alternates", label: "Alternate takes" },
            { value: "edit_points", label: "Edit points" },
            { value: "noise", label: "Noise problems" },
            { value: "pickups", label: "Pickups required" },
            { value: "music_cues", label: "Music cues" },
            { value: "fx_cues", label: "Effect cues" },
            { value: "client_notes", label: "Client notes" },
            { value: "revisions", label: "Revision locations" }
          ]
        },
        {
          fieldId: "alternates_preserved",
          label: "Are the alternates still available",
          kind: "choice",
          help: "A take you rejected in week one is the one the client asks for in week four. Keep them, muted and out of the way.",
          required: true,
          options: [
            { value: "kept", label: "Kept in the session, muted or hidden" },
            { value: "on_disk", label: "Kept on disk, out of the session" },
            { value: "deleted", label: "Removed" }
          ]
        }
      ]
    },
    {
      sectionId: "assembly",
      title: "Assembly",
      intro: "The first complete version, end to end, with the gaps visible rather than hidden.",
      fields: [
        {
          fieldId: "assembly_state",
          label: "Assembly state",
          kind: "choice",
          required: true,
          options: [
            { value: "complete", label: "Complete, start to finish" },
            { value: "partial", label: "Partial" },
            { value: "not_started", label: "Not started" }
          ]
        },
        {
          fieldId: "assembly_duration",
          label: "Current running time",
          kind: "duration",
          help: "What the assembly actually runs, so it can be compared with what was asked for.",
          unit: "min"
        },
        {
          fieldId: "missing_marked",
          label: "Is missing material marked in the timeline",
          kind: "choice",
          help: "A gap that is labelled is a task. A gap that is silent is a surprise.",
          options: [
            { value: "marked", label: "Marked with what is needed" },
            { value: "silent", label: "Left silent, unmarked" },
            { value: "none_missing", label: "Nothing is missing" }
          ]
        },
        {
          fieldId: "handles_preserved",
          label: "Are edit handles preserved",
          kind: "choice",
          help: "Material trimmed hard to the edit leaves nothing to make a fade from, and nothing to move when a later change shifts the join.",
          options: [
            { value: "yes", label: "Yes, with room either side" },
            { value: "some", label: "In places" },
            { value: "no", label: "Cut tight to the edits" }
          ]
        },
        {
          fieldId: "temp_material",
          label: "Temporary music or effects in the assembly",
          kind: "longText",
          help: "Anything standing in for material that does not exist yet. Write down what it is and what replaces it, so no placeholder reaches a master.",
          placeholder: "e.g. Temp bed under the cold open is a library track — replaced by the commissioned theme when it arrives",
          allowNa: true
        }
      ]
    },
    {
      sectionId: "speech",
      title: "Speech and Dialogue Editing",
      intro: "Making an edited conversation sound like one that happened.",
      onlyFor: ["podcast", "live"],
      fields: [
        {
          fieldId: "speech_techniques",
          label: "What the speech edit does",
          kind: "multiChoice",
          options: [
            { value: "false_starts", label: "Removes false starts" },
            { value: "pauses", label: "Shortens excessive pauses" },
            { value: "repeats", label: "Removes repeated words" },
            { value: "reorder", label: "Reorders sections" },
            { value: "mouth", label: "Reduces distracting mouth sounds" },
            { value: "combine", label: "Combines alternate takes" },
            { value: "replace_words", label: "Replaces unusable words" },
            { value: "remote_balance", label: "Balances remote contributors" },
            { value: "ads", label: "Inserts advertisements" },
            { value: "topntail", label: "Adds intro, outro and transitions" }
          ]
        },
        {
          fieldId: "breaths_kept",
          label: "What happens to breaths",
          kind: "choice",
          help: "Speech with every breath removed does not sound clean, it sounds synthetic, and listeners find it tiring without knowing why.",
          options: [
            { value: "kept", label: "Kept — reduced only where distracting" },
            { value: "reduced", label: "Reduced throughout" },
            { value: "removed", label: "Removed" }
          ]
        },
        {
          fieldId: "room_tone_available",
          label: "Is there usable room tone",
          kind: "choice",
          help: "Every gap you open in dialogue has to be filled with the sound of the room, or the silence itself becomes the edit.",
          required: true,
          options: [
            { value: "plenty", label: "Yes, recorded separately" },
            { value: "harvested", label: "Harvested from gaps in the takes" },
            { value: "little", label: "Very little" },
            { value: "none", label: "None" }
          ]
        },
        {
          fieldId: "gaps_filled",
          label: "Are edit gaps filled with room tone",
          kind: "choice",
          options: [
            { value: "yes", label: "Yes, throughout" },
            { value: "partly", label: "In places" },
            { value: "no", label: "No" }
          ]
        },
        {
          fieldId: "edit_faults_checked",
          label: "Edit faults checked for",
          kind: "multiChoice",
          help: "The list a careful pass listens for. Ticking them here is a commitment to having listened.",
          options: [
            { value: "clicks", label: "Clicks at boundaries" },
            { value: "fades", label: "Missing fades" },
            { value: "ambience", label: "Abrupt ambience changes" },
            { value: "consonants", label: "Cut-off consonants" },
            { value: "breaths", label: "Missing breaths" },
            { value: "sync", label: "Sync errors" },
            { value: "timing", label: "Unnatural timing" },
            { value: "repeated", label: "Repeated waveform sections" },
            { value: "handles", label: "Insufficient handles" }
          ]
        },
        {
          fieldId: "duration_target_met",
          label: "Does the edit meet the required duration",
          kind: "choice",
          options: [
            { value: "yes", label: "Yes" },
            { value: "over", label: "Over" },
            { value: "under", label: "Under" },
            { value: "no_target", label: "No fixed duration" }
          ]
        }
      ]
    },
    {
      sectionId: "music",
      title: "Music Editing and Comping",
      intro: "Building one performance out of several without losing what made any of them worth keeping.",
      onlyFor: ["music", "live"],
      fields: [
        {
          fieldId: "comp_approach",
          label: "How the composite was built",
          kind: "choice",
          options: [
            { value: "phrase", label: "By phrase, following the musical line" },
            { value: "section", label: "By section" },
            { value: "word", label: "Syllable by syllable" },
            { value: "single_take", label: "One take, no comping" }
          ]
        },
        {
          fieldId: "comp_criteria",
          label: "What the comp was judged on",
          kind: "multiChoice",
          help: "If this list has no performance term in it, the comp is being assembled by meter rather than by ear.",
          options: [
            { value: "timing", label: "Timing" },
            { value: "pitch", label: "Pitch" },
            { value: "tone", label: "Tone" },
            { value: "emotion", label: "Emotion" },
            { value: "phrasing", label: "Phrasing" },
            { value: "articulation", label: "Articulation" },
            { value: "dynamics", label: "Dynamics" },
            { value: "noise", label: "Noise" },
            { value: "continuity", label: "Continuity" }
          ]
        },
        {
          fieldId: "grouped_edits_shared",
          label: "Are grouped microphones edited together",
          kind: "choice",
          help: "A drum kit, a piano pair, an orchestral section: every microphone hears the same event at a slightly different time, and editing one alone moves it out of that relationship.",
          required: true,
          options: [
            { value: "grouped", label: "Yes — group edits and shared crossfades" },
            { value: "mostly", label: "Mostly, with exceptions" },
            { value: "individual", label: "No — tracks edited individually" },
            { value: "not_applicable", label: "No multi-microphone sources" }
          ]
        },
        {
          fieldId: "crossfade_care",
          label: "How the joins were made",
          kind: "multiChoice",
          options: [
            { value: "zero_cross", label: "At zero crossings" },
            { value: "shared", label: "Shared across grouped tracks" },
            { value: "beat", label: "Beat-aligned" },
            { value: "decay", label: "Natural decay preserved" },
            { value: "extended", label: "Sustain or ambience extended into the join" }
          ]
        },
        {
          fieldId: "arrangement_edits",
          label: "Arrangement changes made",
          kind: "longText",
          help: "Shortened intro, extended section, removed verse, radio edit. Record them — an arrangement change is the thing a client is most likely to want reversed.",
          allowNa: true
        }
      ]
    },
    {
      sectionId: "cleanup",
      title: "Cleanup and Restoration",
      intro: "Corrective work, decided problem by problem. The default is to do less than you can.",
      notices: [
        {
          kind: "safety",
          text: "Judge restoration at a normal listening level, and take breaks. Repeated close listening to the same damaged passage at high level is the most common way that people working in audio lose hearing, and it does not feel loud while it is happening."
        }
      ],
      fields: [
        {
          fieldId: "problem_list",
          label: "Problems found",
          kind: "table",
          help: "One row per problem. The chosen action is the decision this whole stage exists to make well.",
          columns: [
            { columnId: "pb_where", label: "Where", kind: "text" },
            {
              columnId: "pb_problem",
              label: "Problem",
              kind: "choice",
              options: [
                { value: "hum", label: "Hum or buzz" },
                { value: "hiss", label: "Hiss" },
                { value: "clicks", label: "Clicks or pops" },
                { value: "clipping", label: "Clipping or distortion" },
                { value: "wind", label: "Wind" },
                { value: "plosive", label: "Plosives" },
                { value: "sibilance", label: "Sibilance" },
                { value: "mouth", label: "Mouth noise" },
                { value: "handling", label: "Handling noise" },
                { value: "rf", label: "RF interference" },
                { value: "background", label: "Background voices" },
                { value: "traffic", label: "Traffic" },
                { value: "hvac", label: "HVAC noise" },
                { value: "reverb", label: "Too much reverberation" },
                { value: "dropout", label: "Dropouts" },
                { value: "digital", label: "Digital errors" }
              ]
            },
            {
              columnId: "pb_severity",
              label: "How bad",
              kind: "choice",
              options: [
                { value: "distracting", label: "Distracting" },
                { value: "noticeable", label: "Noticeable" },
                { value: "subtle", label: "Only audible when listening for it" }
              ]
            },
            {
              columnId: "pb_action",
              label: "Chosen action",
              kind: "choice",
              options: [
                { value: "leave", label: "Leave unchanged" },
                { value: "edit_around", label: "Edit around it" },
                { value: "replace_take", label: "Replace from another take" },
                { value: "reduce", label: "Reduce" },
                { value: "repair", label: "Repair" },
                { value: "rerecord", label: "Re-record" },
                { value: "adr", label: "Replace with ADR" },
                { value: "room_tone", label: "Cover with room tone" },
                { value: "ask_client", label: "Ask the client" }
              ]
            },
            { columnId: "pb_notes", label: "Notes", kind: "text" }
          ]
        },
        {
          fieldId: "processing_order",
          label: "Processing order",
          kind: "longText",
          help: "The sequence you intend to work in. Manual editing first almost always, then clicks, then hum, then broadband, then the narrow tools. The right order changes with the problem — having one is what matters.",
          placeholder: "e.g. manual edits → click removal → hum removal → broadband reduction → de-ess → final comparison"
        },
        {
          fieldId: "comparison_method",
          label: "How repairs are being judged",
          kind: "multiChoice",
          help: "Listening to what was REMOVED is the check that catches over-processing, and it is the one people skip.",
          options: [
            { value: "original", label: "Against the original" },
            { value: "difference", label: "To the removed signal on its own" },
            { value: "bypass", label: "Bypassed and engaged" },
            { value: "level_matched", label: "Level-matched" },
            { value: "in_context", label: "In the full mix, not soloed" }
          ]
        },
        {
          fieldId: "artifact_check",
          label: "Have the repairs been checked for artefacts",
          kind: "choice",
          help: "Over-reduced speech goes hollow and watery, and it is easiest to hear when you stop listening to the noise and start listening to the voice.",
          required: true,
          options: [
            { value: "yes", label: "Yes, and they are acceptable" },
            { value: "yes_reduced", label: "Yes — processing was backed off as a result" },
            { value: "no", label: "Not yet" }
          ]
        }
      ]
    }
  ],
  rules: [
    {
      ruleId: "edit-review-incomplete",
      watches: ["edit.review_done", "edit.assembly_state"],
      severity: "attention",
      kind: "unrealistic",
      title: "Assembling material nobody has listened to",
      detail: "The assembly is under way and the source review is not finished. Anything unheard is either a problem you will find at the worst moment or a better take you will never know about.",
      fixHint: "Finish the review pass first. It is the cheapest hour in the whole project.",
      needsLogic: true,
      logicIntent: "Fire when review_done is spot or none AND assembly_state is partial or complete."
    },
    {
      ruleId: "edit-chosen-on-technical-only",
      watches: ["edit.take_log"],
      severity: "attention",
      kind: "mismatch",
      title: "Takes chosen on cleanliness alone",
      detail: "Preferred takes are being selected only on technical quality and noise, with no performance reason recorded against any of them. The technically cleanest take is very often not the best one, and this is the specific way a production ends up correct and lifeless.",
      fixHint: "For each preferred take, say what it does better — the phrasing, the emotion, the timing. If the honest answer is only that it is quieter, that is worth knowing too.",
      needsLogic: true,
      logicIntent: "Fire when there are preferred rows in take_log and NONE of them lists performance, emotion, phrasing, timing or continuity in tk_chosen_on, while at least one lists technical or noise."
    },
    {
      ruleId: "edit-preferred-no-reason",
      watches: ["edit.take_log"],
      severity: "info",
      kind: "missing",
      title: "A preferred take with no reason recorded",
      detail: "In three weeks, when a client asks why this one, the reason has to be remembered rather than read.",
      fixHint: "One short phrase per row is enough.",
      needsLogic: true,
      logicIntent: "Fire for each take_log row with tk_verdict preferred where tk_reason is empty and tk_chosen_on is empty. Do not fire when the table is empty."
    },
    {
      ruleId: "edit-alternates-deleted",
      watches: ["edit.alternates_preserved"],
      severity: "attention",
      kind: "unsafe",
      title: "The alternate takes have been removed",
      detail: "Rejected material is gone. The one thing a revision round reliably asks for is the take you did not use.",
      fixHint: "Recover them from the original media if they are still there, and keep them muted in the session or parked on disk. They cost storage and nothing else.",
      needsLogic: true,
      logicIntent: "Fire when alternates_preserved is deleted."
    },
    {
      ruleId: "edit-duration-off-target",
      watches: ["edit.assembly_duration", "brief.program_duration"],
      severity: "attention",
      kind: "mismatch",
      title: "The assembly does not match the required duration",
      detail: "The running time and the required programme duration differ by more than a trim will solve. Finding this after the mix means re-cutting material that has already been treated.",
      fixHint: "Bring the assembly close to the target now, while the edits are still cheap and nothing has been processed around them.",
      needsLogic: true,
      logicIntent: "Fire when both brief.program_duration and assembly_duration are numbers and they differ by more than a percentage that ccode chooses."
    },
    {
      ruleId: "edit-gaps-not-marked",
      watches: ["edit.missing_marked", "edit.assembly_state"],
      severity: "attention",
      kind: "missing",
      title: "Silent gaps where material is missing",
      detail: "The assembly has holes and they are not labelled. A silent gap looks exactly like a deliberate pause, right up to the moment it is delivered as one.",
      fixHint: "Put a marker or a labelled clip in every gap saying what belongs there and who is getting it.",
      needsLogic: true,
      logicIntent: "Fire when missing_marked is silent."
    },
    {
      ruleId: "edit-temp-material-unflagged",
      watches: ["edit.temp_material", "edit.assembly_state"],
      severity: "info",
      kind: "missing",
      title: "No record of what is temporary",
      detail: "Assemblies almost always contain something standing in for something else. If it is not written down, the stand-in travels quietly towards the master.",
      fixHint: "List anything temporary and what replaces it. If genuinely nothing is temporary, mark the field not applicable.",
      needsLogic: true,
      logicIntent: "Fire when assembly_state is partial or complete and temp_material is empty and not marked not applicable."
    },
    {
      ruleId: "edit-no-handles",
      watches: ["edit.handles_preserved"],
      severity: "attention",
      kind: "unrealistic",
      title: "Material cut tight to the edits",
      detail: "With no handles there is nothing to make a fade from and nothing to give when a later change moves the join. Every subsequent revision becomes a re-cut rather than a nudge.",
      fixHint: "Trim back with room either side. Where it has already been consolidated, keep the uncut source available.",
      needsLogic: true,
      logicIntent: "Fire when handles_preserved is no."
    },
    {
      ruleId: "edit-no-room-tone",
      watches: ["edit.room_tone_available", "edit.gaps_filled"],
      severity: "attention",
      kind: "missing",
      title: "Speech edited with no room tone to fill the gaps",
      detail: "Removing a word or a pause opens a hole of pure digital silence in a background that was never silent. The result is a conversation that keeps stopping and starting, which listeners hear as edits even when they cannot say why.",
      fixHint: "Harvest tone from the quietest gaps in the same take and same microphone, and lay it under the edits. If there is genuinely none, this is a pickup to request.",
      needsLogic: true,
      logicIntent: "Fire when room_tone_available is little or none, or when gaps_filled is no while speech_techniques includes any editing that opens gaps.",
      onlyFor: ["podcast", "live"]
    },
    {
      ruleId: "edit-breaths-removed",
      watches: ["edit.breaths_kept"],
      severity: "info",
      kind: "unrealistic",
      title: "Every breath has been removed",
      detail: "Speech without breaths does not read as polished; it reads as machine-made, and it is unexpectedly tiring to listen to over a programme length.",
      fixHint: "Keep them, and reduce only the ones that distract. The goal is speech that does not draw attention to its editing, not speech with nothing human left in it.",
      needsLogic: true,
      logicIntent: "Fire when breaths_kept is removed.",
      onlyFor: ["podcast", "live"]
    },
    {
      ruleId: "edit-faults-not-checked",
      watches: ["edit.edit_faults_checked", "edit.assembly_state"],
      severity: "attention",
      kind: "missing",
      title: "The edit has not been checked for the usual faults",
      detail: "Clicks at boundaries, missing fades and cut-off consonants are cheap to fix now and expensive once they are buried under processing.",
      fixHint: "Do one pass listening only for joins, with the material soloed, then one in context. Tick what you checked.",
      needsLogic: true,
      logicIntent: "Fire when assembly_state is complete and edit_faults_checked has fewer than three entries.",
      onlyFor: ["podcast", "live"]
    },
    {
      ruleId: "edit-grouped-tracks-split",
      watches: ["edit.grouped_edits_shared", "session.grouped_sources"],
      severity: "attention",
      kind: "conflict",
      title: "Grouped microphones edited apart",
      detail: "Tracks that hear the same source from different distances are being edited individually. Moving one relative to the others changes the phase relationship between them, and the result is a kit or an ensemble that goes thin or hollow at the edit and stays that way.",
      fixHint: "Group the tracks and use shared crossfades so every microphone on a source moves together.",
      needsLogic: true,
      logicIntent: "Fire when grouped_edits_shared is individual or mostly, unless it is not_applicable. Raise the confidence when session.grouped_sources is non-empty, but fire either way.",
      onlyFor: ["music", "live"]
    },
    {
      ruleId: "edit-comp-without-musical-criteria",
      watches: ["edit.comp_criteria", "edit.comp_approach"],
      severity: "info",
      kind: "mismatch",
      title: "A comp judged on nothing musical",
      detail: "The composite is being assembled on pitch, timing and noise, with no reference to phrasing, tone, dynamics or emotion. Syllable-level comping on those criteria reliably produces a performance that is accurate and nobody's.",
      fixHint: "Listen to the candidate phrases whole, in tempo, rather than comparing them in isolation.",
      needsLogic: true,
      logicIntent: "Fire when comp_approach is not single_take and comp_criteria contains none of emotion, phrasing, dynamics, tone or articulation.",
      onlyFor: ["music", "live"]
    },
    {
      ruleId: "edit-repair-without-comparison",
      watches: ["edit.problem_list", "edit.comparison_method", "edit.artifact_check"],
      severity: "attention",
      kind: "unrealistic",
      title: "Restoration with no before-and-after check",
      detail: "Repairs are being applied without listening to what is being removed. Aggressive restoration takes the noise and a share of the voice with it, and the damage it leaves is usually harder to fix than the problem it was aimed at.",
      fixHint: "Listen to the difference signal on its own. If you can hear speech, music or useful ambience in it, back the processing off.",
      needsLogic: true,
      logicIntent: "Fire when problem_list contains a row whose pb_action is reduce or repair AND either artifact_check is no, or comparison_method contains neither difference nor level_matched."
    },
    {
      ruleId: "edit-over-repair-on-subtle",
      watches: ["edit.problem_list"],
      severity: "info",
      kind: "unrealistic",
      title: "Heavy repair on a problem nobody would notice",
      detail: "A problem recorded as audible only when listening for it is being repaired or re-recorded. In context, under a mix, the repair will be more audible than the fault was.",
      fixHint: "Try leaving it, or editing around it, and judge in the full mix rather than soloed.",
      needsLogic: true,
      logicIntent: "Fire for each problem_list row where pb_severity is subtle and pb_action is repair, rerecord or adr."
    },
    {
      ruleId: "edit-problem-no-action",
      watches: ["edit.problem_list"],
      severity: "attention",
      kind: "missing",
      title: "A problem logged with no decision against it",
      detail: "Rows in the problem list have no chosen action, which means they are noticed and unowned. Those are the ones that reach a master.",
      fixHint: "Every row needs a decision, and leaving it unchanged is a perfectly good one to record.",
      needsLogic: true,
      logicIntent: "Fire for each problem_list row where pb_action is empty. Do not fire when the table is empty."
    }
  ],
  activity: {
    activityId: "repair-without-overprocessing",
    title: "Repair without overprocessing",
    prompt: "An interview has come out of the assembly with five things wrong with it, and somebody enthusiastic has already decided what to do about all five. Two of those decisions will make the programme worse than leaving the problem alone. Work out which, fix the decisions, and put a working method around them so the next five are judged properly.",
    onlyFor: ["podcast", "live"],
    seed: {
      "edit.review_done": "all",
      "edit.assembly_state": "complete",
      "edit.alternates_preserved": "kept",
      "edit.room_tone_available": "harvested",
      "edit.gaps_filled": "partly",
      "edit.breaths_kept": "removed",
      "edit.artifact_check": "no",
      "edit.comparison_method": [],
      "edit.processing_order": "",
      "edit.take_log": [
        { tk_item: "Guest answer, take 2", tk_verdict: "preferred", tk_reason: "Quietest", tk_chosen_on: "technical, noise", tk_notes: "" }
      ],
      "edit.problem_list": [
        { pb_where: "04:12 host", pb_problem: "plosive", pb_severity: "distracting", pb_action: "repair", pb_notes: "" },
        { pb_where: "11:40 guest", pb_problem: "hvac", pb_severity: "noticeable", pb_action: "reduce", pb_notes: "Air conditioning throughout" },
        { pb_where: "18:03 guest", pb_problem: "mouth", pb_severity: "subtle", pb_action: "rerecord", pb_notes: "" },
        { pb_where: "22:55 host", pb_problem: "clicks", pb_severity: "subtle", pb_action: "repair", pb_notes: "" },
        { pb_where: "31:20 remote", pb_problem: "dropout", pb_severity: "distracting", pb_action: "", pb_notes: "Half a word gone" }
      ]
    },
    passWhen: "Every problem row carries an action, including the dropout that had none; neither of the two subtle problems is still set to re-record or ADR; a processing order is written down; the comparison method includes listening to the removed signal and level-matched comparison; the artefact check is no longer outstanding; breaths are no longer being removed wholesale; and the preferred take records a reason beyond being the quietest.",
    debrief: "Two of the five original decisions were the expensive kind. Re-recording a guest to remove a mouth noise nobody would notice costs a session, a favour and a performance that will not match the one around it — and ADR for the same reason is worse. Meanwhile the one row with no decision at all was the genuinely serious one: half a word missing from the remote feed, which no amount of processing repairs and which needs either the guest's local file or a re-record of that line. Notice the pattern. Effort was being spent in inverse proportion to severity, which is what happens whenever repairs are judged soloed and one at a time. The working method fixes it better than any individual decision: listen to what you are removing, match the levels, and judge it in the mix."
  }
};

/**
 * Post-Production · Stage 5 — Build the Sound.
 *
 * Owner's spec, Post-Production Chapter 2, Stages 9 (Replacement Recording and
 * ADR), 10 (Foley, Effects and Ambience), 11 (Sound Design), 12 (Music
 * Integration) and 13 (Pitch, Timing and Performance Correction).
 *
 * Consolidated because on the three launch pathways these are one activity:
 * everything added to the production after the original recording, and every
 * decision about how much of the original performance survives it.
 */
import type { StageDef } from '../schema';

export const STAGE5_BUILD: StageDef = {
  stageId: "build",
  num: 5,
  title: "Build the Sound",
  intro: "Everything that goes in after the recording: replaced lines, added atmosphere, designed sounds, music, and any correction applied to a performance. What you add is judged against what was already there.",
  whyItMatters: "This is the stage where a production can be improved past the point of being itself. A replaced line that sounds like a different room, an ambience bed that never changes, a vocal tuned until the intent is gone — none of these are technical failures, and none of them will fail a quality check. They are choices, and they are much easier to make well when the reason for each addition is written down before it is made.",
  notices: [
    {
      kind: "legal",
      text: "Music, effects and library material carry licence terms that depend on how the finished production is used and where. Sampled, AI-generated and library content each have their own conditions. Record what you have been granted; whether a particular use is permitted is a question for the rights holder and your client."
    },
    {
      kind: "legal",
      text: "Altering a recorded performance — correcting pitch, replacing words, changing timing — may require the performer's agreement under their contract or under the law where you are. Where the material is a contributor rather than a hired performer, a re-voiced line can change what they are recorded as having said."
    }
  ],
  sections: [
    {
      sectionId: "replacement",
      title: "Replacement and Pickup Recording",
      intro: "Lines and parts that have to be recorded again, and how they get back into something that was recorded somewhere else.",
      fields: [
        {
          fieldId: "replacement_needed",
          label: "Is replacement recording needed",
          kind: "choice",
          required: true,
          options: [
            { value: "yes", label: "Yes" },
            { value: "maybe", label: "Possibly — awaiting a decision" },
            { value: "no", label: "No" }
          ]
        },
        {
          fieldId: "cue_list",
          label: "Replacement cue list",
          kind: "table",
          help: "One row per line, phrase or part to be re-recorded. The reason column decides whether it is worth doing at all.",
          columns: [
            { columnId: "cu_num", label: "Cue", kind: "text" },
            { columnId: "cu_who", label: "Performer or speaker", kind: "text" },
            { columnId: "cu_where", label: "Where", kind: "text" },
            { columnId: "cu_original", label: "Original", kind: "text" },
            { columnId: "cu_replacement", label: "Replacement", kind: "text" },
            {
              columnId: "cu_reason",
              label: "Why",
              kind: "choice",
              options: [
                { value: "unintelligible", label: "Unintelligible" },
                { value: "noise", label: "Unrepairable noise" },
                { value: "distortion", label: "Distortion" },
                { value: "missing", label: "Missing words or notes" },
                { value: "performance", label: "Performance" },
                { value: "script_change", label: "Script or lyric change" },
                { value: "correction", label: "Factual correction" },
                { value: "language", label: "Language version" }
              ]
            },
            {
              columnId: "cu_status",
              label: "Status",
              kind: "choice",
              options: [
                { value: "planned", label: "Planned" },
                { value: "recorded", label: "Recorded" },
                { value: "edited", label: "Edited in" },
                { value: "approved", label: "Approved" },
                { value: "declined", label: "Not doing it" }
              ]
            },
            { columnId: "cu_notes", label: "Notes", kind: "text" }
          ]
        },
        {
          fieldId: "match_plan",
          label: "How the replacement is matched to the original",
          kind: "multiChoice",
          help: "A clean studio recording dropped into a room that was never clean is the most recognisable sound in post-production. Everything on this list is an attempt to hide the join.",
          options: [
            { value: "mic", label: "Same or similar microphone" },
            { value: "distance", label: "Matched distance and angle" },
            { value: "room", label: "Matched room or reverb" },
            { value: "ambience", label: "Original background laid underneath" },
            { value: "level", label: "Matched level and perspective" },
            { value: "performance", label: "Matched performance energy" },
            { value: "processing", label: "Matched production processing" }
          ]
        },
        {
          fieldId: "match_verified",
          label: "Has the join been checked in context",
          kind: "choice",
          help: "Soloed, a replacement almost always sounds better than the original. In the scene it usually sounds wrong.",
          options: [
            { value: "in_context", label: "Yes, played in the full scene" },
            { value: "soloed", label: "Only soloed" },
            { value: "no", label: "Not yet" }
          ]
        }
      ]
    },
    {
      sectionId: "added",
      title: "Atmosphere, Effects and Design",
      intro: "Sound that was not recorded with the production, added to give it a place to happen in.",
      fields: [
        {
          fieldId: "ambience_plan",
          label: "Ambience and backgrounds",
          kind: "longText",
          help: "What each environment in the production sounds like when nothing is happening. A bed that runs continuously under the edits is what stops the joins being audible.",
          helpBy: {
            music: "Room, audience or atmosphere elements used between and under the music, if any.",
            live: "Audience, room and house atmosphere — what carries between songs and through the changeovers."
          },
          allowNa: true
        },
        {
          fieldId: "ambience_continuous",
          label: "Does the atmosphere run continuously through the edits",
          kind: "choice",
          help: "Ambience that starts and stops with the clips it was attached to draws attention to every one of them.",
          options: [
            { value: "continuous", label: "Yes, laid as continuous beds" },
            { value: "per_clip", label: "No, attached to individual clips" },
            { value: "none", label: "No ambience in this production" }
          ]
        },
        {
          fieldId: "loop_variation",
          label: "Is repeated material varied",
          kind: "choice",
          help: "The same four-second atmosphere looping for ten minutes becomes audible as a loop somewhere around the third pass, and cannot be unheard after that.",
          options: [
            { value: "varied", label: "Yes — length, level or layering varies" },
            { value: "long_source", label: "Source is long enough not to repeat" },
            { value: "looped", label: "No, it loops plainly" },
            { value: "na", label: "Nothing repeats" }
          ]
        },
        {
          fieldId: "effects_list",
          label: "Effects and designed elements",
          kind: "table",
          help: "One row per element that had to be made or found. The purpose column is what stops a production filling up with sounds that are merely good.",
          columns: [
            { columnId: "fx_where", label: "Where", kind: "text" },
            { columnId: "fx_what", label: "Element", kind: "text" },
            {
              columnId: "fx_source",
              label: "Source",
              kind: "choice",
              options: [
                { value: "library", label: "Library" },
                { value: "recorded", label: "Recorded for this" },
                { value: "designed", label: "Designed from other material" },
                { value: "production", label: "From the production recording" },
                { value: "generated", label: "Generated" }
              ]
            },
            { columnId: "fx_purpose", label: "What it is for", kind: "text" },
            {
              columnId: "fx_rights",
              label: "Rights",
              kind: "status"
            },
            { columnId: "fx_notes", label: "Notes", kind: "text" }
          ]
        },
        {
          fieldId: "perspective_handled",
          label: "Is perspective accounted for",
          kind: "choice",
          help: "Distance, obstruction, inside or outside, on or off the picture. An element at the same perspective as everything else sits in front of the production rather than in it.",
          options: [
            { value: "yes", label: "Yes — level, tone and space vary with distance" },
            { value: "partly", label: "In places" },
            { value: "no", label: "Everything sits at one perspective" },
            { value: "na", label: "Not relevant here" }
          ]
        }
      ]
    },
    {
      sectionId: "music",
      title: "Music Integration",
      intro: "Where music starts, where it stops, and what it is doing to everything else while it plays.",
      fields: [
        {
          fieldId: "music_cues",
          label: "Music cues",
          kind: "table",
          help: "One row per cue. If the purpose column is hard to fill, the cue may not need to be there.",
          columns: [
            { columnId: "mu_cue", label: "Cue", kind: "text" },
            { columnId: "mu_in", label: "Starts", kind: "text" },
            { columnId: "mu_out", label: "Ends", kind: "text" },
            { columnId: "mu_purpose", label: "What it is doing", kind: "text" },
            {
              columnId: "mu_type",
              label: "Type",
              kind: "choice",
              options: [
                { value: "score", label: "Score or underscore" },
                { value: "source", label: "Source music — heard by the people in it" },
                { value: "theme", label: "Theme, sting or bed" },
                { value: "advert", label: "Advertisement" },
                { value: "performance", label: "The performance itself" }
              ]
            },
            {
              columnId: "mu_edited",
              label: "Edited",
              kind: "choice",
              options: [
                { value: "none", label: "Used whole" },
                { value: "trimmed", label: "Trimmed" },
                { value: "restructured", label: "Restructured to fit" },
                { value: "looped", label: "Looped or extended" }
              ]
            },
            { columnId: "mu_rights", label: "Rights", kind: "status" }
          ]
        },
        {
          fieldId: "music_speech_relationship",
          label: "How music and speech share the space",
          kind: "multiChoice",
          help: "Turning the music down is one tool of several, and usually the least interesting one.",
          options: [
            { value: "level", label: "Level automation" },
            { value: "arrangement", label: "Chose a sparser part of the arrangement" },
            { value: "eq", label: "Frequency separation" },
            { value: "entry", label: "Moved the entry or exit" },
            { value: "sidechain", label: "Sidechain ducking" },
            { value: "none", label: "Nothing — static levels" }
          ],
          onlyFor: ["podcast", "live"]
        },
        {
          fieldId: "music_edits_musical",
          label: "Do the music edits respect the phrasing",
          kind: "choice",
          help: "A cue cut to a duration rather than to a phrase announces itself even to listeners who could not say what a phrase is.",
          options: [
            { value: "phrased", label: "Yes — cut at phrase and bar boundaries" },
            { value: "mostly", label: "Mostly" },
            { value: "to_length", label: "Cut to length wherever it landed" },
            { value: "none", label: "No music edits" }
          ]
        }
      ]
    },
    {
      sectionId: "correction",
      title: "Pitch, Timing and Performance Correction",
      intro: "Changing what was performed. The first question is not how, it is whether.",
      fields: [
        {
          fieldId: "correction_decision",
          label: "Has correction been agreed",
          kind: "choice",
          help: "Whether this production is one that gets corrected at all is a creative and contractual question, not a technical one.",
          required: true,
          options: [
            { value: "agreed", label: "Yes — agreed with the performer or producer" },
            { value: "expected", label: "Expected by the style, not discussed" },
            { value: "not_discussed", label: "Not discussed with anyone" },
            { value: "prohibited", label: "Ruled out" },
            { value: "none_needed", label: "No correction needed" }
          ]
        },
        {
          fieldId: "correction_scope",
          label: "What is being corrected",
          kind: "multiChoice",
          options: [
            { value: "pitch", label: "Pitch" },
            { value: "timing", label: "Timing" },
            { value: "duration", label: "Note or syllable duration" },
            { value: "ensemble", label: "Ensemble alignment" },
            { value: "dialogue_timing", label: "Dialogue timing" },
            { value: "sync", label: "Synchronisation to picture" }
          ]
        },
        {
          fieldId: "correction_target",
          label: "Key and scale used",
          kind: "text",
          help: "The most common cause of obviously wrong tuning is the right tool set to the wrong scale.",
          onlyFor: ["music", "live"],
          placeholder: "e.g. D minor, natural"
        },
        {
          fieldId: "correction_amount",
          label: "How much",
          kind: "choice",
          options: [
            { value: "targeted", label: "Individual notes or moments only" },
            { value: "light", label: "Light, across the part" },
            { value: "heavy", label: "Heavy, across the part" },
            { value: "quantised", label: "Fully quantised or snapped" }
          ]
        },
        {
          fieldId: "correction_guards",
          label: "What is being protected",
          kind: "multiChoice",
          help: "The things correction removes by default unless somebody stops it.",
          options: [
            { value: "vibrato", label: "Vibrato" },
            { value: "formants", label: "Formants" },
            { value: "breaths", label: "Breaths and consonants left alone" },
            { value: "unpitched", label: "Unpitched sounds excluded" },
            { value: "groove", label: "Groove and pocket" },
            { value: "phase", label: "Phase across grouped tracks" },
            { value: "expression", label: "Deliberate expression left in" }
          ]
        },
        {
          fieldId: "correction_compared",
          label: "Has it been compared with the original",
          kind: "choice",
          required: true,
          options: [
            { value: "yes", label: "Yes, level-matched, in context" },
            { value: "soloed", label: "Soloed only" },
            { value: "no", label: "Not yet" }
          ]
        }
      ]
    }
  ],
  rules: [
    {
      ruleId: "build-replacement-unmatched",
      watches: ["build.cue_list", "build.match_plan"],
      severity: "attention",
      kind: "mismatch",
      title: "Replacement recorded with no plan to match it",
      detail: "Lines or parts have been recorded again and nothing is recorded about matching the microphone, the distance, the room or the background they are going back into. A clean replacement in a room that was never clean is the most recognisable sound in post-production.",
      fixHint: "Lay the original background underneath it at minimum, and match level and perspective. Matching the microphone and distance at the session is cheaper than matching them afterwards.",
      needsLogic: true,
      logicIntent: "Fire when cue_list has any row with cu_status recorded, edited or approved AND match_plan is empty."
    },
    {
      ruleId: "build-replacement-judged-soloed",
      watches: ["build.match_verified", "build.cue_list"],
      severity: "attention",
      kind: "unrealistic",
      title: "The replacement has only been judged on its own",
      detail: "Soloed, a studio replacement almost always sounds better than what it replaces — cleaner, closer, more controlled. That is exactly why it will not sit in the scene.",
      fixHint: "Play the whole surrounding passage with the replacement in place. Judge the join, not the recording.",
      needsLogic: true,
      logicIntent: "Fire when cue_list has any row with cu_status recorded, edited or approved AND match_verified is soloed or no."
    },
    {
      ruleId: "build-cue-no-reason",
      watches: ["build.cue_list"],
      severity: "info",
      kind: "missing",
      title: "A replacement cue with no reason against it",
      detail: "Re-recording costs a session and a performance that will not match. A cue without a stated reason is one nobody has weighed.",
      fixHint: "Say why each one is being replaced. If the honest answer is that somebody would prefer a different reading, that is worth being explicit about.",
      needsLogic: true,
      logicIntent: "Fire for each cue_list row where cu_reason is empty. Do not fire when the table is empty."
    },
    {
      ruleId: "build-replacement-needed-no-cues",
      watches: ["build.replacement_needed", "build.cue_list"],
      severity: "attention",
      kind: "missing",
      title: "Replacement is needed and nothing is listed",
      detail: "Somebody has decided lines or parts must be re-recorded, and there is no list of which. Those sessions get booked against a guess.",
      fixHint: "List the cues before booking anything. The list is usually shorter than the fear of it.",
      needsLogic: true,
      logicIntent: "Fire when replacement_needed is yes and cue_list is empty."
    },
    {
      ruleId: "build-ambience-per-clip",
      watches: ["build.ambience_continuous"],
      severity: "attention",
      kind: "mismatch",
      title: "Atmosphere attached to clips rather than laid under them",
      detail: "Background sound that starts and stops with each clip changes texture at every edit, which is precisely what an audience hears as \"badly edited\" without being able to name it.",
      fixHint: "Lay continuous beds under the whole scene or segment and let the clips sit on top of them.",
      needsLogic: true,
      logicIntent: "Fire when ambience_continuous is per_clip."
    },
    {
      ruleId: "build-loop-audible",
      watches: ["build.loop_variation"],
      severity: "info",
      kind: "unrealistic",
      title: "A loop that will become audible",
      detail: "Repeated material with no variation is recognised as a loop after a few passes, and once a listener has heard it they cannot stop hearing it.",
      fixHint: "Vary the length, level or layering between repeats, or find a longer source. Two layers at different lengths hide the repeat almost completely.",
      needsLogic: true,
      logicIntent: "Fire when loop_variation is looped."
    },
    {
      ruleId: "build-no-perspective",
      watches: ["build.perspective_handled", "build.effects_list"],
      severity: "info",
      kind: "mismatch",
      title: "Everything added sits at the same distance",
      detail: "Elements all at one perspective form a flat layer in front of the production rather than a space around it.",
      fixHint: "Vary level, brightness and the amount of room with distance. The difference between a close and a distant version of the same sound is mostly high frequencies and reflections.",
      needsLogic: true,
      logicIntent: "Fire when effects_list has rows and perspective_handled is no."
    },
    {
      ruleId: "build-effect-no-purpose",
      watches: ["build.effects_list"],
      severity: "info",
      kind: "missing",
      title: "An added element with no stated purpose",
      detail: "Rows in the effects list have nothing in the purpose column. Elements added because they were available are the ones that get removed in the mix, after everything has been balanced around them.",
      fixHint: "One phrase per row. If nothing can be written, try the production without the element.",
      needsLogic: true,
      logicIntent: "Fire for each effects_list row where fx_purpose is empty. Do not fire when the table is empty."
    },
    {
      ruleId: "build-rights-unresolved",
      watches: ["build.effects_list", "build.music_cues"],
      severity: "blocker",
      kind: "legal",
      title: "Material in the production with rights marked Missing or Expired",
      detail: "An element or a music cue is in the production and its rights are recorded as missing or expired. That is a delivery blocker regardless of how the mix sounds, and it becomes more expensive to solve the closer it gets to delivery.",
      fixHint: "Clear it, replace it, or remove it now. Record the outcome against the row so nobody has to ask twice.",
      needsLogic: true,
      logicIntent: "Fire when any effects_list or music_cues row has a rights status of Missing or Expired. Do not fire on Restricted, which needs reading rather than blocking."
    },
    {
      ruleId: "build-rights-not-checked",
      watches: ["build.effects_list", "build.music_cues"],
      severity: "attention",
      kind: "legal",
      title: "Added material with no rights status at all",
      detail: "Rows carry no rights status, so nobody has looked. Library and generated material both have terms, and the terms usually depend on how the finished production is used.",
      fixHint: "Set a status on every row, including Not required where that is genuinely the answer.",
      needsLogic: true,
      logicIntent: "Fire for each effects_list or music_cues row that has content and an empty rights status. Do not fire when both tables are empty."
    },
    {
      ruleId: "build-music-cue-no-purpose",
      watches: ["build.music_cues"],
      severity: "info",
      kind: "missing",
      title: "A music cue that is not doing anything in particular",
      detail: "A cue with no stated purpose is usually there because the silence felt uncomfortable, which is a reason to examine the silence rather than to cover it.",
      fixHint: "Say what the cue is for. Try the passage without it once — the answer is sometimes that it is better without.",
      needsLogic: true,
      logicIntent: "Fire for each music_cues row where mu_purpose is empty. Do not fire when the table is empty."
    },
    {
      ruleId: "build-music-cut-to-length",
      watches: ["build.music_edits_musical", "build.music_cues"],
      severity: "attention",
      kind: "mismatch",
      title: "Music cut to a duration rather than to a phrase",
      detail: "Cues have been restructured or trimmed without respecting where the phrases end. A music edit that lands mid-phrase is audible to people who have never thought about music.",
      fixHint: "Cut at bar and phrase boundaries, and make up the difference by looping a section or moving the entry rather than by trimming the tail.",
      needsLogic: true,
      logicIntent: "Fire when music_edits_musical is to_length, or when it is none while music_cues contains rows with mu_edited restructured or looped."
    },
    {
      ruleId: "build-music-masks-speech",
      watches: ["build.music_speech_relationship", "build.music_cues"],
      severity: "attention",
      kind: "conflict",
      title: "Music and speech sharing the space with nothing managing it",
      detail: "Cues run under speech and nothing is recorded about how the two coexist. Static levels that work in the quiet parts bury the speech in the busy ones.",
      fixHint: "Automation is the usual answer, but choosing a sparser section of the arrangement or moving the entry often works better and sounds like nothing happened.",
      needsLogic: true,
      logicIntent: "Fire when music_cues contains a score, theme or advert row and music_speech_relationship is empty or contains only none.",
      onlyFor: ["podcast", "live"]
    },
    {
      ruleId: "build-correction-not-agreed",
      watches: ["build.correction_decision", "build.correction_scope", "brief.prohibited_changes"],
      severity: "attention",
      kind: "legal",
      title: "A performance is being altered without an agreement to do it",
      detail: "Correction is being applied and nobody has agreed to it, or the brief recorded it as ruled out. Changing what somebody performed can be a contractual matter as well as a creative one.",
      fixHint: "Ask the performer or producer before going further. It is a short conversation now and a serious one after delivery.",
      needsLogic: true,
      logicIntent: "Fire when correction_scope is non-empty AND correction_decision is not_discussed or prohibited."
    },
    {
      ruleId: "build-correction-unguarded",
      watches: ["build.correction_amount", "build.correction_guards"],
      severity: "attention",
      kind: "unrealistic",
      title: "Heavy correction with nothing protected",
      detail: "Correction is set heavy or fully quantised and nothing is listed as being preserved. By default these tools flatten vibrato, shift formants, pull breaths and consonants towards notes they were never on, and remove the timing variation that made the part feel played.",
      fixHint: "Exclude unpitched sounds, preserve formants, leave vibrato and deliberate expression alone, and correct individual moments rather than whole parts.",
      needsLogic: true,
      logicIntent: "Fire when correction_amount is heavy or quantised AND correction_guards is empty."
    },
    {
      ruleId: "build-correction-no-scale",
      watches: ["build.correction_target", "build.correction_scope"],
      severity: "attention",
      kind: "missing",
      title: "Pitch correction with no key and scale recorded",
      detail: "The most common cause of obviously wrong tuning is the right tool aimed at the wrong scale, which pulls notes confidently to the wrong places.",
      fixHint: "Record the key and scale, and check it against a section where the harmony moves rather than the opening bar.",
      needsLogic: true,
      logicIntent: "Fire when correction_scope includes pitch and correction_target is empty.",
      onlyFor: ["music", "live"]
    },
    {
      ruleId: "build-correction-not-compared",
      watches: ["build.correction_compared", "build.correction_scope"],
      severity: "attention",
      kind: "missing",
      title: "Correction applied without hearing it against the original",
      detail: "Correction is being judged without a level-matched comparison to the performance it replaced. Corrected material is usually a little louder and always a little tidier, and both of those read as better on their own.",
      fixHint: "Match the levels, switch between the two in context, and specifically listen for what has gone rather than for what has improved.",
      needsLogic: true,
      logicIntent: "Fire when correction_scope is non-empty and correction_compared is no or soloed."
    }
  ],
  activity: {
    activityId: "add-without-erasing",
    title: "Add without erasing",
    prompt: "An episode has come back from the edit with a list of additions already made: a re-recorded line, a music bed, an atmosphere track and some tuning on the theme's sung tag. Everything on the list is defensible on its own. Played end to end, the programme sounds slightly wrong in four places and nobody can say why. Find what each addition did to the material around it, and fix the decisions rather than the symptoms.",
    seed: {
      "build.replacement_needed": "yes",
      "build.match_plan": [],
      "build.match_verified": "soloed",
      "build.ambience_continuous": "per_clip",
      "build.loop_variation": "looped",
      "build.perspective_handled": "no",
      "build.correction_decision": "not_discussed",
      "build.correction_scope": ["pitch"],
      "build.correction_target": "",
      "build.correction_amount": "heavy",
      "build.correction_guards": [],
      "build.correction_compared": "no",
      "build.music_edits_musical": "to_length",
      "build.music_speech_relationship": [],
      "build.cue_list": [
        { cu_num: "1", cu_who: "Host", cu_where: "07:20", cu_original: "the figure was forty per cent", cu_replacement: "the figure was fourteen per cent", cu_reason: "correction", cu_status: "recorded", cu_notes: "Recorded at home on a different mic" }
      ],
      "build.effects_list": [
        { fx_where: "Cold open", fx_what: "Street atmosphere", fx_source: "library", fx_purpose: "", fx_rights: "", fx_notes: "4 second file" }
      ],
      "build.music_cues": [
        { mu_cue: "Bed under the open", mu_in: "00:12", mu_out: "01:40", mu_purpose: "", mu_type: "score", mu_edited: "restructured", mu_rights: "Missing" }
      ]
    },
    passWhen: "The music cue's rights are no longer Missing or Expired; every element and cue carries a rights status and a stated purpose; the replacement line has a matching plan and has been checked in the full scene rather than soloed; the atmosphere runs as a continuous bed and no longer loops plainly; perspective is accounted for; the music edits respect phrasing and something manages the relationship between music and speech; and the tuning is either agreed or abandoned, with a key and scale recorded, something protected from the correction, and a level-matched comparison made.",
    debrief: "One of these was a delivery blocker and it was not the one that sounded wrong. The music bed with missing rights would have passed every technical check, sounded fine, and stopped the programme at the last possible moment. The rest were craft: a correction line recorded on a different microphone at home and never heard in the scene; four seconds of street atmosphere looping under a cold open; a cue restructured to a duration instead of to a phrase. And the tuning, which nobody had asked for, applied heavily with nothing protected, to a sung tag whose whole character was that it was a bit ragged. Notice how each addition was individually reasonable. The stage is called Build the Sound, and the hard part of building is knowing what the thing already had."
  }
};

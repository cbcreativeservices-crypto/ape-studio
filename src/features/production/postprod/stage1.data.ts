/**
 * Post-Production · Stage 1 — Receive the Project.
 *
 * Owner's spec, Post-Production Chapter 1, Stage 1 (Post-Production Brief).
 *
 * Authored in-session 2026-09-17, in Computer C's contract and voice, because
 * C was unavailable and the lab had to be finished. Same division of labour
 * applies to the reader: the words live here, every comparison lives in
 * ./logic.ts against the same ruleId.
 */
import type { StageDef } from '../schema';

export const STAGE1_BRIEF: StageDef = {
  stageId: "brief",
  num: 1,
  title: "Receive the Project",
  intro: "Post-production starts with somebody handing you a folder and a deadline. Before you open a session, you write down what you were actually given, what the finished thing has to be, and what nobody has told you yet.",
  whyItMatters: "Almost every post-production disaster is a question that was answerable in week one and got asked in week six: what frame rate is the picture, who signs off, is there an instrumental in the deliverables, does the client expect the swearing removed. The work of this stage is not filling boxes. It is finding the empty ones while there is still time to ask.",
  notices: [
    {
      kind: "legal",
      text: "Rights, clearances and consent are recorded here as facts you have been told, not as advice. Whether a piece of material may be used, altered or published is a legal question that depends on your contract and your jurisdiction, and it belongs to the rights holder and your client, not to this app."
    }
  ],
  sections: [
    {
      sectionId: "handoff",
      title: "The Handoff",
      intro: "Who gave you this, what came with it, and who can answer a question about it.",
      fields: [
        {
          fieldId: "project_name",
          label: "Project name",
          kind: "text",
          help: "The name everyone involved already uses. If the folder and the invoice disagree, write both.",
          required: true
        },
        {
          fieldId: "project_type",
          label: "What kind of production is this",
          kind: "choice",
          help: "This sets the vocabulary the rest of the lab uses.",
          required: true,
          options: [
            { value: "song", label: "A song or a set of songs" },
            { value: "album", label: "An album, EP or collection" },
            { value: "episode", label: "An episode in a series" },
            { value: "film", label: "A film or video programme" },
            { value: "live_capture", label: "A recorded live performance" },
            { value: "broadcast", label: "A broadcast or stream" },
            { value: "other", label: "Something else" }
          ],
          labelBy: {
            music: "What kind of release is this",
            podcast: "What kind of programme is this"
          }
        },
        {
          fieldId: "client",
          label: "Client or producer",
          kind: "text",
          help: "The person or organisation the work is for.",
          required: true
        },
        {
          fieldId: "editorial_contact",
          label: "Editorial contact",
          kind: "text",
          help: "The person who answers creative questions — which take, which version, is this line staying in. Often not the person who pays.",
          required: true,
          labelBy: {
            music: "Artist or producer contact",
            podcast: "Editorial or showrunner contact"
          }
        },
        {
          fieldId: "approval_authority",
          label: "Who approves the final",
          kind: "text",
          help: "One name. Not a committee, not a company — the person whose word ends the revision round.",
          required: true
        },
        {
          fieldId: "supervisor",
          label: "Post-production supervisor",
          kind: "text",
          help: "Who owns the schedule and the deliverables list. On a small job this may be you; write your own name rather than leaving it empty.",
          allowNa: true
        },
        {
          fieldId: "deadline",
          label: "Completion deadline",
          kind: "date",
          help: "The date the finished deliverables must be with the client, not the date you plan to finish.",
          required: true
        },
        {
          fieldId: "review_rounds",
          label: "Review rounds included",
          kind: "number",
          help: "How many rounds of client notes the agreement covers. If nobody has said, the answer is not infinity — ask.",
          unit: "rounds"
        },
        {
          fieldId: "production_status",
          label: "Where the production currently stands",
          kind: "choice",
          help: "Material that is still being shot or tracked will change under you. Say so now.",
          required: true,
          options: [
            { value: "complete", label: "Everything is recorded and final" },
            { value: "mostly", label: "Mostly recorded; pickups expected" },
            { value: "ongoing", label: "Still recording" },
            { value: "unknown", label: "Nobody has told me" }
          ]
        }
      ]
    },
    {
      sectionId: "materials",
      title: "What You Were Given, and What You Were Not",
      intro: "An honest inventory of the handoff. The second table is the one that saves the schedule.",
      fields: [
        {
          fieldId: "materials_received",
          label: "Materials received",
          kind: "table",
          help: "One row per thing that actually arrived. Count it before you agree to a date.",
          required: true,
          columns: [
            { columnId: "mr_item", label: "Item", kind: "text" },
            {
              columnId: "mr_kind",
              label: "Type",
              kind: "choice",
              options: [
                { value: "audio", label: "Audio recordings" },
                { value: "video", label: "Video or picture" },
                { value: "session", label: "Session or project file" },
                { value: "interchange", label: "AAF, OMF or XML" },
                { value: "midi", label: "MIDI or tempo map" },
                { value: "music", label: "Music" },
                { value: "effects", label: "Effects or library material" },
                { value: "script", label: "Script, cue sheet or EDL" },
                { value: "notes", label: "Production notes or reports" },
                { value: "reference", label: "Reference export" },
                { value: "other", label: "Other" }
              ]
            },
            { columnId: "mr_from", label: "From whom", kind: "text" },
            { columnId: "mr_when", label: "Received", kind: "date" },
            {
              columnId: "mr_state",
              label: "State",
              kind: "choice",
              options: [
                { value: "complete", label: "Complete" },
                { value: "partial", label: "Partial" },
                { value: "unverified", label: "Not yet checked" }
              ]
            }
          ]
        },
        {
          fieldId: "materials_missing",
          label: "Materials missing or promised",
          kind: "table",
          help: "Anything the production assumes exists and you have not got. Each row needs somebody's name against it or it will not arrive.",
          columns: [
            { columnId: "mm_item", label: "What is missing", kind: "text" },
            { columnId: "mm_needed_for", label: "Needed for", kind: "text" },
            { columnId: "mm_owner", label: "Who is chasing it", kind: "text" },
            { columnId: "mm_by", label: "Needed by", kind: "date" },
            {
              columnId: "mm_status",
              label: "Status",
              kind: "choice",
              options: [
                { value: "requested", label: "Requested" },
                { value: "promised", label: "Promised" },
                { value: "unknown", label: "Nobody asked yet" },
                { value: "will_not_arrive", label: "Confirmed unavailable" }
              ]
            }
          ]
        },
        {
          fieldId: "open_questions",
          label: "Questions nobody has answered",
          kind: "longText",
          help: "Write them as questions, with the name of the person who can answer each one. This field is the most valuable one on the screen.",
          placeholder: "e.g. Is the cold open staying? — Priya. Do we need an instrumental? — label."
        }
      ]
    },
    {
      sectionId: "creative",
      title: "Creative Direction",
      intro: "What the finished thing is supposed to feel like, and what you are not allowed to touch.",
      fields: [
        {
          fieldId: "creative_brief",
          label: "Creative brief",
          kind: "longText",
          help: "In your own words, what this production is trying to do to the person listening. If you cannot write two sentences, you have not been briefed.",
          required: true
        },
        {
          fieldId: "references",
          label: "Reference productions",
          kind: "longText",
          help: "What the client played you, or what you played them. A reference everyone has actually heard is worth an hour of adjectives.",
          placeholder: "Artist, title, and the ONE thing about it that is the reference"
        },
        {
          fieldId: "sonic_character",
          label: "Required sonic character",
          kind: "longText",
          help: "Close and dry, big and roomy, radio-clean, deliberately rough. Say it plainly.",
          helpBy: {
            podcast: "How the voices should sit: intimate and close, or roomy and present. Say whether the room should be audible at all."
          }
        },
        {
          fieldId: "must_stay_natural",
          label: "What must stay natural",
          kind: "longText",
          help: "The things that must not be corrected, tuned, tightened or cleaned. A breath, a room, a stumble that the artist likes.",
          placeholder: "e.g. the vocal ad-libs in the last chorus stay exactly as performed"
        },
        {
          fieldId: "prohibited_changes",
          label: "Changes you are not permitted to make",
          kind: "longText",
          help: "Anything the client, the artist or the contract has ruled out. Write it here so a later decision cannot quietly undo it.",
          placeholder: "e.g. no pitch correction on the lead; no edits to the interview answers"
        }
      ]
    },
    {
      sectionId: "spec",
      title: "The Delivery Specification",
      intro: "The numbers the finished files must hit. Get these from the client's written spec rather than from habit.",
      notices: [
        {
          kind: "legal",
          text: "Loudness and format requirements are set by the client, the platform and sometimes by regulation in your territory. Enter what your delivery specification says. This lab does not set targets for you and has no universal one to offer."
        }
      ],
      fields: [
        {
          fieldId: "spec_source",
          label: "Where the specification came from",
          kind: "choice",
          help: "A written spec you can point at is different from what someone remembers.",
          required: true,
          options: [
            { value: "written", label: "A written delivery specification" },
            { value: "platform_doc", label: "The platform's published requirements" },
            { value: "verbal", label: "Somebody told me" },
            { value: "assumed", label: "I am assuming the usual" },
            { value: "none", label: "Nobody has given me one" }
          ]
        },
        {
          fieldId: "program_duration",
          label: "Required programme duration",
          kind: "duration",
          help: "If a duration is fixed — a broadcast slot, an ad break, an episode length — it constrains every edit decision downstream.",
          unit: "min",
          allowNa: true
        },
        {
          fieldId: "target_sample_rate",
          label: "Delivery sample rate",
          kind: "choice",
          required: true,
          options: [
            { value: "44100", label: "44.1 kHz" },
            { value: "48000", label: "48 kHz" },
            { value: "88200", label: "88.2 kHz" },
            { value: "96000", label: "96 kHz" },
            { value: "192000", label: "192 kHz" },
            { value: "unknown", label: "Not yet specified" }
          ]
        },
        {
          fieldId: "target_bit_depth",
          label: "Delivery bit depth",
          kind: "choice",
          required: true,
          options: [
            { value: "16", label: "16-bit" },
            { value: "24", label: "24-bit" },
            { value: "32f", label: "32-bit float" },
            { value: "unknown", label: "Not yet specified" }
          ]
        },
        {
          fieldId: "channel_config",
          label: "Channel configuration",
          kind: "choice",
          required: true,
          options: [
            { value: "mono", label: "Mono" },
            { value: "stereo", label: "Stereo" },
            { value: "binaural", label: "Binaural" },
            { value: "5_1", label: "5.1" },
            { value: "7_1", label: "7.1" },
            { value: "immersive", label: "Height or object-based immersive" },
            { value: "unknown", label: "Not yet specified" }
          ]
        },
        {
          fieldId: "loudness_target",
          label: "Integrated loudness target",
          kind: "number",
          help: "From the specification, in LUFS. Leave empty rather than guessing — a guessed target is worse than an open question.",
          unit: "LUFS"
        },
        {
          fieldId: "loudness_tolerance",
          label: "Permitted tolerance",
          kind: "number",
          help: "How far either side of the target the specification allows.",
          unit: "LU"
        },
        {
          fieldId: "true_peak_max",
          label: "Maximum true peak",
          kind: "number",
          help: "From the specification, in dBTP. This is a ceiling, not a target.",
          unit: "dBTP"
        },
        {
          fieldId: "frame_rate",
          label: "Frame rate",
          kind: "choice",
          help: "Required whenever picture is involved, and the single most common source of expensive mistakes in this lab.",
          onlyFor: ["podcast", "live"],
          options: [
            { value: "23_976", label: "23.976" },
            { value: "24", label: "24" },
            { value: "25", label: "25" },
            { value: "29_97_ndf", label: "29.97 non-drop" },
            { value: "29_97_df", label: "29.97 drop-frame" },
            { value: "30", label: "30" },
            { value: "50", label: "50" },
            { value: "59_94", label: "59.94" },
            { value: "none", label: "No picture on this job" },
            { value: "unknown", label: "Not yet specified" }
          ]
        },
        {
          fieldId: "start_timecode",
          label: "Start timecode",
          kind: "text",
          help: "Where the programme begins on the delivered master, e.g. 10:00:00:00 or 01:00:00:00.",
          onlyFor: ["podcast", "live"],
          placeholder: "HH:MM:SS:FF"
        },
        {
          fieldId: "required_versions",
          label: "Versions and alternates required",
          kind: "multiChoice",
          help: "Every one of these is a separate export with its own deadline. Tick them now, not in delivery week.",
          options: [
            { value: "full_mix", label: "Full mix" },
            { value: "instrumental", label: "Instrumental" },
            { value: "acappella", label: "A cappella" },
            { value: "clean", label: "Clean version" },
            { value: "radio_edit", label: "Radio edit" },
            { value: "me", label: "M&E (music and effects)" },
            { value: "stems", label: "Stems" },
            { value: "mono_fold", label: "Mono fold-down" },
            { value: "language", label: "Alternate language versions" },
            { value: "accessibility", label: "Accessibility version" },
            { value: "review", label: "Review copy" }
          ]
        },
        {
          fieldId: "naming_requirement",
          label: "Required naming convention",
          kind: "text",
          help: "Copy the client's pattern exactly, including case and separators. Many delivery rejections are nothing but a filename.",
          placeholder: "e.g. SHOW_S01E04_MIX_STEREO_48k24b_v03"
        },
        {
          fieldId: "delivery_destination",
          label: "Where the files go",
          kind: "text",
          help: "The actual destination and the person who confirms receipt.",
          required: true
        }
      ]
    }
  ],
  rules: [
    {
      ruleId: "brief-no-written-spec",
      watches: ["brief.spec_source", "brief.loudness_target", "brief.target_sample_rate"],
      severity: "attention",
      kind: "missing",
      title: "You are working from an assumed specification",
      detail: "Nobody has given you a written delivery specification, so the format, loudness and naming decisions below are guesses that will be checked against somebody else's document at delivery.",
      fixHint: "Ask the client for their delivery specification in writing. If they do not have one, write down what you intend to deliver and get them to agree to it by reply.",
      needsLogic: true,
      logicIntent: "Fire when spec_source is verbal, assumed or none."
    },
    {
      ruleId: "brief-no-approval-authority",
      watches: ["brief.approval_authority"],
      severity: "attention",
      kind: "missing",
      title: "Nobody can end the revision round",
      detail: "Without one named person whose approval is final, notes arrive from everyone and the project finishes when the money runs out rather than when the work is done.",
      fixHint: "Name the individual who signs off. If several people must agree, name the one who speaks for them.",
      needsLogic: true,
      logicIntent: "Fire when approval_authority is empty."
    },
    {
      ruleId: "brief-approver-is-a-committee",
      watches: ["brief.approval_authority"],
      severity: "info",
      kind: "conflict",
      title: "The approver looks like a group, not a person",
      detail: "\"The label\", \"the team\" or two names joined by \"and\" is not an approval authority. When two of them disagree, nothing is approved and the work stops.",
      fixHint: "Name one person. Others can be consulted; one decides.",
      needsLogic: true,
      logicIntent: "Fire when approval_authority is filled and either names more than one person (an 'and', an '&', a comma or a slash) or reads as an organisation rather than a person, such as team, label, committee, board, client or department."
    },
    {
      ruleId: "brief-material-still-changing",
      watches: ["brief.production_status", "brief.deadline"],
      severity: "attention",
      kind: "unrealistic",
      title: "The material is still moving while the clock runs",
      detail: "Recording has not finished, so any edit, mix or approval you make now may be invalidated by something that arrives later.",
      fixHint: "Get a date for the last piece of material, and agree what happens to the schedule if it slips.",
      needsLogic: true,
      logicIntent: "Fire when production_status is ongoing or unknown, or when it is mostly and a deadline is set within a number of days ahead that ccode chooses."
    },
    {
      ruleId: "brief-missing-material-unowned",
      watches: ["brief.materials_missing"],
      severity: "attention",
      kind: "missing",
      title: "Missing material with nobody chasing it",
      detail: "A row on the missing list with no name against it, or no date, is a thing everyone assumes somebody else is getting.",
      fixHint: "Put a person and a date on every row. If nobody will own it, mark it confirmed unavailable and plan around its absence instead.",
      needsLogic: true,
      logicIntent: "Fire for each materials_missing row where mm_owner or mm_by is empty, or mm_status is unknown. Do not fire when the table is empty."
    },
    {
      ruleId: "brief-material-will-not-arrive",
      watches: ["brief.materials_missing", "brief.open_questions"],
      severity: "attention",
      kind: "conflict",
      title: "Something confirmed unavailable, and no note about working without it",
      detail: "A piece of material has been confirmed as never arriving, which is useful news — but only if the plan has changed to account for it.",
      fixHint: "Write in the questions or the creative brief what happens in its place: a replacement, a rewrite, an edit around it, or a conversation with the client.",
      needsLogic: true,
      logicIntent: "Fire when a materials_missing row has mm_status will_not_arrive and open_questions is empty."
    },
    {
      ruleId: "brief-nothing-received",
      watches: ["brief.materials_received"],
      severity: "attention",
      kind: "missing",
      title: "Nothing is listed as received",
      detail: "The received table is empty, so there is no record of what the handoff actually contained. That record is what you will point at when somebody says they sent something.",
      fixHint: "List what arrived, from whom, and when. It takes ten minutes and settles arguments for the life of the project.",
      needsLogic: true,
      logicIntent: "Fire when materials_received is empty."
    },
    {
      ruleId: "brief-received-unverified",
      watches: ["brief.materials_received"],
      severity: "info",
      kind: "missing",
      title: "Material logged but not yet checked",
      detail: "Rows are marked as not yet checked. A file that is present is not the same as a file that is complete and playable.",
      fixHint: "Stage 2 is where this gets settled; come back and update the state once the ingest check has run.",
      needsLogic: true,
      logicIntent: "Fire when any materials_received row has mr_state unverified."
    },
    {
      ruleId: "brief-no-frame-rate",
      watches: ["brief.frame_rate", "brief.start_timecode"],
      severity: "blocker",
      kind: "missing",
      title: "Picture work with no frame rate agreed",
      detail: "This job involves picture and the frame rate has not been established. Every synchronisation decision, every timecode reference and every export depends on it, and getting it wrong is not a small correction later.",
      fixHint: "Get the frame rate from the picture department in writing, along with whether the timecode is drop-frame, and the programme start.",
      needsLogic: true,
      logicIntent: "Fire only on the pathways where frame_rate exists, when frame_rate is unknown or empty. Do not fire when it is set to none, which is the answer for an audio-only job.",
      onlyFor: ["podcast", "live"]
    },
    {
      ruleId: "brief-loudness-target-unset",
      watches: ["brief.loudness_target", "brief.true_peak_max", "brief.spec_source"],
      severity: "attention",
      kind: "missing",
      title: "No loudness target and no true-peak ceiling",
      detail: "Neither number has been entered, so there is nothing for the finishing stage to be measured against and nothing for a delivery rejection to be argued with.",
      fixHint: "Take both from the client's specification. If they have none, agree a target with them in writing before you mix, not after.",
      needsLogic: true,
      logicIntent: "Fire when both loudness_target and true_peak_max are empty."
    },
    {
      ruleId: "brief-tolerance-without-target",
      watches: ["brief.loudness_tolerance", "brief.loudness_target"],
      severity: "info",
      kind: "conflict",
      title: "A tolerance with nothing to be tolerant of",
      detail: "A permitted tolerance has been entered but no integrated loudness target, so the pair says nothing.",
      fixHint: "Enter the target the tolerance applies to, or clear the tolerance.",
      needsLogic: true,
      logicIntent: "Fire when loudness_tolerance is set and loudness_target is empty."
    },
    {
      ruleId: "brief-true-peak-implausible",
      watches: ["brief.true_peak_max"],
      severity: "attention",
      kind: "mismatch",
      title: "That true-peak ceiling looks wrong",
      detail: "A maximum true peak is normally at or below zero dBTP, and most specifications sit between −1 and −2. A positive number, or one far below the usual range, is usually a typed sign or the wrong unit.",
      fixHint: "Check the specification. If it really does say this, mark the field not applicable with the reason so the check stops asking.",
      needsLogic: true,
      logicIntent: "Fire when true_peak_max is greater than 0 or less than −20."
    },
    {
      ruleId: "brief-versions-without-stems",
      watches: ["brief.required_versions"],
      severity: "info",
      kind: "conflict",
      title: "Those versions are going to need stems",
      detail: "An instrumental, an a cappella, an M&E or a clean version is made by muting and re-printing parts of the mix. If stems are not on the deliverables list, they still have to exist inside the session.",
      fixHint: "Plan the stem structure in the mix stage even if stems are not themselves delivered — every one of these versions comes out of it.",
      needsLogic: true,
      logicIntent: "Fire when required_versions includes any of instrumental, acappella, me or clean, and does not include stems."
    },
    {
      ruleId: "brief-no-creative-brief",
      watches: ["brief.creative_brief", "brief.references", "brief.sonic_character"],
      severity: "attention",
      kind: "missing",
      title: "Technical specification without creative direction",
      detail: "The numbers are here and the intent is not. A mix that hits every delivery requirement and misses what the production is for still comes back.",
      fixHint: "Write two sentences about what the finished thing should do to a listener, or get them from the editorial contact.",
      needsLogic: true,
      logicIntent: "Fire when creative_brief is empty and both references and sonic_character are also empty."
    },
    {
      ruleId: "brief-prohibited-not-recorded",
      watches: ["brief.prohibited_changes", "brief.must_stay_natural"],
      severity: "info",
      kind: "missing",
      title: "Nothing recorded as off-limits",
      detail: "Most productions have something the artist or the client does not want touched. If nothing is written down, the first person to reach for pitch correction will not know.",
      fixHint: "Ask what must not change. \"Nothing\" is a valid answer — mark the field not applicable and say so.",
      needsLogic: true,
      logicIntent: "Fire when both prohibited_changes and must_stay_natural are empty and neither is marked not applicable."
    }
  ],
  activity: {
    activityId: "clarify-the-handoff",
    title: "Clarify the handoff",
    prompt: "A producer has sent you an episode to finish, with a deadline three weeks out and a cheerful note saying \"the usual\". The folder has audio in it. Before you agree to anything, work out what you have actually been given and what you have not been told — then write the questions down against the people who can answer them.",
    seed: {
      "brief.project_name": "Northgate — episode 4",
      "brief.project_type": "episode",
      "brief.client": "Northgate Media",
      "brief.editorial_contact": "Priya Raman",
      "brief.approval_authority": "",
      "brief.deadline": "",
      "brief.production_status": "unknown",
      "brief.spec_source": "verbal",
      "brief.target_sample_rate": "unknown",
      "brief.target_bit_depth": "unknown",
      "brief.channel_config": "unknown",
      "brief.delivery_destination": "",
      "brief.creative_brief": "",
      "brief.open_questions": "",
      "brief.materials_received": [
        { mr_item: "Interview recordings, 3 files", mr_kind: "audio", mr_from: "Priya Raman", mr_when: "", mr_state: "unverified" },
        { mr_item: "Theme music", mr_kind: "music", mr_from: "Priya Raman", mr_when: "", mr_state: "unverified" }
      ],
      "brief.materials_missing": [
        { mm_item: "Remote guest's local recording", mm_needed_for: "The second half of the interview", mm_owner: "", mm_by: "", mm_status: "unknown" }
      ]
    },
    passWhen: "One named person is recorded as the approval authority; a completion deadline is entered; the production status is no longer unknown; the missing remote recording has a named owner and a needed-by date, or is confirmed unavailable; the delivery specification is no longer purely verbal, with a sample rate, bit depth and channel configuration settled; a destination is named; a creative brief is written; and the open questions field lists the questions with the people who can answer them.",
    debrief: "None of this was work. It was ten minutes of asking, done at the only point in the project where the answers are still cheap. Notice which single missing item was the dangerous one: the remote guest's local recording, because the version you were given is the call recording, and if the local file exists, the whole second half should be re-cut from it. That decision costs an email in week one and a re-edit in week three. The questions field is the deliverable of this stage — everything else on the screen is just what you were told."
  }
};

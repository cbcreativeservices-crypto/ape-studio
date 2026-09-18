/**
 * Post-Production · Stage 3 — Build and Synchronise the Session.
 *
 * Owner's spec, Post-Production Chapter 1, Stages 3 (Session Creation and
 * Organization) and 4 (Synchronization), consolidated. They belong together:
 * the session's frame rate and start time ARE the synchronisation decision, and
 * separating them lets a user configure a session that cannot hold sync.
 */
import type { StageDef } from '../schema';

export const STAGE3_SESSION: StageDef = {
  stageId: "session",
  num: 3,
  title: "Build and Synchronise the Session",
  intro: "Configure the session to match both the material and the delivery, organise it so somebody else could open it, and get every recording lined up against the same clock.",
  whyItMatters: "A session is a set of assumptions made once and then trusted for weeks. If the frame rate is wrong, or the start time is off by an hour, or two recorders were running on their own clocks, nothing announces it — the work simply drifts, and the further in you get the more expensive the correction becomes. Organisation matters for the same reason: the person most inconvenienced by a session nobody can read is usually you, three weeks from now.",
  notices: [
    {
      kind: "legal",
      text: "Where this session carries material from more than one source — library music, a contributor's own recording, archive footage — the right to use it is recorded in stage 8, not assumed here. Organising a file into a folder does not grant permission to publish it."
    }
  ],
  sections: [
    {
      sectionId: "config",
      title: "Session Configuration",
      intro: "The numbers the session itself runs on. Each is checked against the material and against the delivery specification from stage 1.",
      fields: [
        {
          fieldId: "session_rate",
          label: "Session sample rate",
          kind: "choice",
          help: "Usually the rate of the majority of the source material, or the delivery rate. Converting once, deliberately, beats converting repeatedly by accident.",
          required: true,
          options: [
            { value: "44100", label: "44.1 kHz" },
            { value: "48000", label: "48 kHz" },
            { value: "88200", label: "88.2 kHz" },
            { value: "96000", label: "96 kHz" },
            { value: "192000", label: "192 kHz" }
          ]
        },
        {
          fieldId: "session_depth",
          label: "Session bit depth",
          kind: "choice",
          help: "Work at or above the delivery depth. Reducing depth is a finishing decision, not a starting one.",
          required: true,
          options: [
            { value: "16", label: "16-bit" },
            { value: "24", label: "24-bit" },
            { value: "32f", label: "32-bit float" }
          ]
        },
        {
          fieldId: "session_frame_rate",
          label: "Session frame rate",
          kind: "choice",
          help: "Must match the picture. Drop-frame and non-drop are different answers, not two names for one.",
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
            { value: "none", label: "No picture on this job" }
          ]
        },
        {
          fieldId: "session_start",
          label: "Session start time",
          kind: "text",
          help: "The timecode the session begins at, matching the picture or the production reports.",
          onlyFor: ["podcast", "live"],
          placeholder: "HH:MM:SS:FF"
        },
        {
          fieldId: "channel_format",
          label: "Session channel format",
          kind: "choice",
          required: true,
          options: [
            { value: "mono", label: "Mono" },
            { value: "stereo", label: "Stereo" },
            { value: "5_1", label: "5.1" },
            { value: "7_1", label: "7.1" },
            { value: "immersive", label: "Height or object-based" }
          ]
        },
        {
          fieldId: "pan_law",
          label: "Pan law",
          kind: "choice",
          help: "It changes the level of anything panned away from a hard side. Worth knowing rather than inheriting, especially if a session moves between rooms.",
          options: [
            { value: "0", label: "0 dB" },
            { value: "-2_5", label: "−2.5 dB" },
            { value: "-3", label: "−3 dB" },
            { value: "-4_5", label: "−4.5 dB" },
            { value: "-6", label: "−6 dB" },
            { value: "unknown", label: "Whatever the template had" }
          ]
        },
        {
          fieldId: "tempo_map",
          label: "Tempo and meter",
          kind: "choice",
          help: "Whether musical timing is established, and whether it is fixed or follows the performance.",
          onlyFor: ["music"],
          options: [
            { value: "fixed", label: "Fixed tempo, confirmed against the material" },
            { value: "mapped", label: "Tempo map follows the performance" },
            { value: "free", label: "Free time — no grid" },
            { value: "unset", label: "Not set up" }
          ]
        },
        {
          fieldId: "video_reference",
          label: "Video reference in the session",
          kind: "choice",
          onlyFor: ["podcast", "live"],
          options: [
            { value: "locked", label: "Yes, and the cut is locked" },
            { value: "unlocked", label: "Yes, but the cut may still change" },
            { value: "none", label: "No video in the session" }
          ]
        },
        {
          fieldId: "processing_format",
          label: "Internal processing and headroom",
          kind: "longText",
          help: "Floating-point or fixed, and what headroom you intend to leave on the master. Write it down so a later stage does not have to guess.",
          placeholder: "e.g. 32-bit float internally; master bus peaking around −6 dBFS through the mix"
        }
      ]
    },
    {
      sectionId: "structure",
      title: "Folders and Tracks",
      intro: "How the project is laid out on disk and in the session. Organise it for the person who opens it next.",
      fields: [
        {
          fieldId: "folder_structure",
          label: "Folder structure",
          kind: "longText",
          help: "The folders this project uses, and what goes in each. Originals, working media, sessions, exports, review versions, deliverables, documentation, archive.",
          required: true,
          placeholder: "e.g. 01_ORIGINALS / 02_WORKING / 03_SESSIONS / 04_EXPORTS / 05_REVIEW / 06_DELIVER / 07_DOCS"
        },
        {
          fieldId: "track_layout",
          label: "Track layout",
          kind: "table",
          help: "The groups your session is organised into, in the order they appear. Not every track — the structure.",
          required: true,
          columns: [
            { columnId: "tl_group", label: "Group", kind: "text" },
            {
              columnId: "tl_kind",
              label: "Contains",
              kind: "choice",
              options: [
                { value: "dialogue", label: "Dialogue or speech" },
                { value: "adr", label: "ADR or replacement" },
                { value: "vo", label: "Voice-over or narration" },
                { value: "music", label: "Music" },
                { value: "effects", label: "Effects" },
                { value: "foley", label: "Foley" },
                { value: "ambience", label: "Ambience or backgrounds" },
                { value: "instrument", label: "Instruments" },
                { value: "vocals", label: "Vocals" },
                { value: "drums", label: "Drums or percussion" },
                { value: "room", label: "Room tone" },
                { value: "advert", label: "Advertisements" },
                { value: "returns", label: "Effects returns" },
                { value: "bus", label: "Bus or group" },
                { value: "print", label: "Print or mix track" }
              ]
            },
            { columnId: "tl_count", label: "Tracks", kind: "number" },
            { columnId: "tl_routes_to", label: "Routes to", kind: "text" },
            { columnId: "tl_notes", label: "Notes", kind: "text" }
          ],
          helpBy: {
            music: "Drums, percussion, bass, guitars, keys, orchestra, lead and background vocals, returns, groups, mix prints.",
            podcast: "Host, guests, remote contributors, narration, room tone, music, advertisements, effects, mix bus, final print.",
            live: "Production sources, audience microphones, backup recorders, music, effects, groups, print masters."
          }
        },
        {
          fieldId: "grouped_sources",
          label: "Sources that must stay grouped",
          kind: "longText",
          help: "Multi-microphone sources whose tracks must be edited together — a drum kit, an orchestral section, a stereo pair, a piano. Editing one of these alone breaks the phase relationship that makes them sound like one thing.",
          placeholder: "e.g. Kit (kick, snare, hats, toms, overheads, room) — always edited as a group"
        },
        {
          fieldId: "colour_meaning",
          label: "What the colours mean",
          kind: "text",
          help: "Colour is a convenience, not a system. Whatever it means here, the names and the hierarchy still have to work without it.",
          allowNa: true
        }
      ]
    },
    {
      sectionId: "naming",
      title: "Naming and Versions",
      intro: "The rules that stop a folder filling with files whose names are opinions.",
      fields: [
        {
          fieldId: "naming_rule",
          label: "Naming convention",
          kind: "text",
          help: "A pattern with parts in an order, not a description. Project, item, version, format, date.",
          required: true,
          placeholder: "e.g. NG_E04_MIX_STEREO_48k24_v03_PR"
        },
        {
          fieldId: "version_fields",
          label: "What every session version records",
          kind: "multiChoice",
          help: "A version whose name does not say what changed is a version nobody can go back to.",
          options: [
            { value: "project", label: "Project identifier" },
            { value: "date", label: "Date" },
            { value: "number", label: "Version number" },
            { value: "initials", label: "Editor initials" },
            { value: "description", label: "Revision description" },
            { value: "approval", label: "Approval status" }
          ]
        },
        {
          fieldId: "version_log",
          label: "Where the revision descriptions live",
          kind: "text",
          help: "A text file in the session folder is enough. Somewhere that travels with the project.",
          allowNa: true
        }
      ]
    },
    {
      sectionId: "sync",
      title: "Synchronisation",
      intro: "How every recording is lined up against the same clock, and what you do when one of them will not stay there.",
      fields: [
        {
          fieldId: "sync_sources",
          label: "What you are synchronising from",
          kind: "multiChoice",
          help: "Tick everything available. Timecode is the strongest; a clap is more reliable than people expect; waveform matching is excellent until the recordings diverge.",
          required: true,
          options: [
            { value: "embedded_tc", label: "Embedded timecode" },
            { value: "recorded_tc", label: "Recorded timecode track" },
            { value: "slate", label: "Slate or clap" },
            { value: "scratch", label: "Camera scratch audio" },
            { value: "waveform", label: "Waveform matching" },
            { value: "reports", label: "Production reports" },
            { value: "visual", label: "Visual sync to picture" },
            { value: "musical", label: "MIDI or musical timing" },
            { value: "manual", label: "By hand, by ear" }
          ]
        },
        {
          fieldId: "recorder_count",
          label: "How many independent recorders",
          kind: "choice",
          help: "Every additional free-running device is another clock that can drift away from the others.",
          required: true,
          options: [
            { value: "one", label: "One" },
            { value: "several_locked", label: "Several, locked to a common clock or timecode" },
            { value: "several_free", label: "Several, each running on its own clock" },
            { value: "unknown", label: "I do not know" }
          ]
        },
        {
          fieldId: "sync_table",
          label: "Synchronisation status by source",
          kind: "table",
          help: "One row per recording or group of recordings. The offset column is where a pattern becomes visible.",
          columns: [
            { columnId: "sy_source", label: "Source", kind: "text" },
            {
              columnId: "sy_method",
              label: "Synced by",
              kind: "choice",
              options: [
                { value: "timecode", label: "Timecode" },
                { value: "slate", label: "Slate or clap" },
                { value: "waveform", label: "Waveform" },
                { value: "manual", label: "By hand" },
                { value: "not_yet", label: "Not yet synced" }
              ]
            },
            { columnId: "sy_offset", label: "Offset applied", kind: "text" },
            {
              columnId: "sy_holds",
              label: "Does it hold",
              kind: "choice",
              options: [
                { value: "holds", label: "Holds across the whole file" },
                { value: "drifts", label: "Drifts over time" },
                { value: "jumps", label: "Jumps at a point" },
                { value: "unchecked", label: "Not checked at the end" }
              ]
            },
            { columnId: "sy_notes", label: "Notes", kind: "text" }
          ]
        },
        {
          fieldId: "drift_diagnosis",
          label: "If anything drifts, why",
          kind: "choice",
          help: "The cause decides the cure. A constant offset is moved; a drift is stretched or reconformed; a sample-rate mismatch is converted.",
          options: [
            { value: "none", label: "Nothing drifts" },
            { value: "constant_offset", label: "Constant offset only" },
            { value: "clock_drift", label: "Free-running clocks" },
            { value: "rate_mismatch", label: "Sample-rate mismatch" },
            { value: "pull", label: "Pull-up or pull-down not applied" },
            { value: "speed", label: "Wrong playback speed" },
            { value: "missing_section", label: "A section is missing from one file" },
            { value: "unknown", label: "Not diagnosed yet" }
          ]
        },
        {
          fieldId: "drift_action",
          label: "What you did about it",
          kind: "choice",
          help: "Whatever you choose, it happens to the working copy. The originals do not move.",
          options: [
            { value: "move", label: "Moved it — constant offset" },
            { value: "stretch", label: "Stretched or resampled it" },
            { value: "reconform", label: "Reconformed from the source" },
            { value: "replace", label: "Replaced it with another recording" },
            { value: "accept", label: "Accepted it and worked around it" },
            { value: "none_needed", label: "Nothing needed" }
          ]
        },
        {
          fieldId: "sync_checked_at_end",
          label: "Was sync checked at the END of the longest file",
          kind: "choice",
          help: "The single most useful check in this stage. Drift is invisible at the head and obvious at the tail.",
          required: true,
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No — only at the start" }
          ]
        }
      ]
    }
  ],
  rules: [
    {
      ruleId: "session-rate-conflicts-delivery",
      watches: ["session.session_rate", "brief.target_sample_rate"],
      severity: "attention",
      kind: "mismatch",
      title: "The session rate does not match the delivery rate",
      detail: "The session runs at one sample rate and the delivery specification asks for another. That conversion has to happen somewhere, and doing it once at the end is very different from discovering it on delivery day.",
      fixHint: "Either match the session to the delivery, or record deliberately that a single conversion happens at the final export and nowhere else.",
      needsLogic: true,
      logicIntent: "Fire when brief.target_sample_rate is a number and session_rate differs from it. Do not fire when the target is unknown or empty."
    },
    {
      ruleId: "session-depth-below-delivery",
      watches: ["session.session_depth", "brief.target_bit_depth"],
      severity: "attention",
      kind: "mismatch",
      title: "The session is shallower than the delivery",
      detail: "Working at a lower bit depth than you must deliver means the extra resolution you are asked for does not exist. It cannot be added back at the end.",
      fixHint: "Raise the session to at least the delivery depth. Reducing depth belongs at the final export, with dither applied once.",
      needsLogic: true,
      logicIntent: "Fire when brief.target_bit_depth is 24 and session_depth is 16. Treat 32f as the highest. Do not fire when the target is unknown."
    },
    {
      ruleId: "session-frame-rate-mismatch",
      watches: ["session.session_frame_rate", "brief.frame_rate"],
      severity: "blocker",
      kind: "conflict",
      title: "The session frame rate is not the delivery frame rate",
      detail: "The session and the specification disagree. Everything synced in this session is lined up against the wrong clock, and the error grows steadily through the programme rather than showing up as a single obvious fault.",
      fixHint: "Set the session to the required rate and re-establish sync before any more editing happens. The longer this runs, the more work sits on top of it.",
      needsLogic: true,
      logicIntent: "Fire when both brief.frame_rate and session_frame_rate are set to real rates and they differ. Treat 29.97 drop-frame and 29.97 non-drop as DIFFERENT. Do not fire when either is none or unknown.",
      onlyFor: ["podcast", "live"]
    },
    {
      ruleId: "session-dropframe-undecided",
      watches: ["session.session_frame_rate", "session.session_start"],
      severity: "attention",
      kind: "missing",
      title: "A 29.97 session with no start time recorded",
      detail: "At 29.97 the difference between drop-frame and non-drop accumulates to roughly three and a half seconds an hour. Without a recorded start timecode there is nothing to check the session against.",
      fixHint: "Record the programme start timecode from the picture department, and confirm which of drop-frame or non-drop their timecode is.",
      needsLogic: true,
      logicIntent: "Fire when session_frame_rate is either 29.97 variant and session_start is empty.",
      onlyFor: ["podcast", "live"]
    },
    {
      ruleId: "session-free-running-recorders",
      watches: ["session.recorder_count", "session.sync_checked_at_end"],
      severity: "attention",
      kind: "unrealistic",
      title: "Several recorders on their own clocks",
      detail: "Independent clocks drift apart. Over a short take it is inaudible; over an hour it is a flam on every shared source, and it cannot be fixed by nudging the head back into place.",
      fixHint: "Check sync at the END of the longest recording, not just at the start, and correct by stretching or reconforming rather than moving.",
      needsLogic: true,
      logicIntent: "Fire when recorder_count is several_free or unknown, and sync_checked_at_end is not yes."
    },
    {
      ruleId: "session-sync-unverified-at-end",
      watches: ["session.sync_checked_at_end", "session.sync_table"],
      severity: "attention",
      kind: "missing",
      title: "Sync was only checked at the start",
      detail: "Material lined up at the head and never checked at the tail is material that might be lined up. Drift is defined by being invisible where people look for it.",
      fixHint: "Go to the end of the longest file and check a transient that appears on more than one recording. It takes a minute.",
      needsLogic: true,
      logicIntent: "Fire when sync_checked_at_end is no, or when any sync_table row has sy_holds unchecked."
    },
    {
      ruleId: "session-drift-undiagnosed",
      watches: ["session.sync_table", "session.drift_diagnosis"],
      severity: "attention",
      kind: "missing",
      title: "Something drifts and nobody has said why",
      detail: "A row is marked as drifting or jumping, and the cause is not diagnosed. The cure depends entirely on the cause — moving a file that is drifting fixes one moment and breaks the rest.",
      fixHint: "Work out whether this is a constant offset, a free-running clock, a rate mismatch or a missing section, then choose the matching correction.",
      needsLogic: true,
      logicIntent: "Fire when any sync_table row has sy_holds drifts or jumps AND drift_diagnosis is unknown or empty."
    },
    {
      ruleId: "session-drift-wrong-cure",
      watches: ["session.drift_diagnosis", "session.drift_action"],
      severity: "attention",
      kind: "mismatch",
      title: "That correction does not match that cause",
      detail: "Material that drifts steadily cannot be corrected by moving it — moving lines up one point and leaves every other point wrong. Equally, stretching a file that only needed an offset damages it for no reason.",
      fixHint: "Drift from clocks, rate mismatch or pull needs stretching, resampling or reconforming. A constant offset needs moving, and nothing else.",
      needsLogic: true,
      logicIntent: "Fire when drift_diagnosis is clock_drift, rate_mismatch, pull or speed AND drift_action is move or accept. Also fire when drift_diagnosis is constant_offset and drift_action is stretch."
    },
    {
      ruleId: "session-no-sync-source",
      watches: ["session.sync_sources", "session.sync_table"],
      severity: "attention",
      kind: "missing",
      title: "Nothing to synchronise from",
      detail: "No synchronisation source is recorded, so alignment is by eye and by ear with nothing to check it against.",
      fixHint: "Look for embedded timecode first, then a slate, then camera scratch audio, then waveform matching. Production reports often hold the answer nobody thought to look for.",
      needsLogic: true,
      logicIntent: "Fire when sync_sources is empty, or contains only manual while the sync_table has rows."
    },
    {
      ruleId: "session-manual-sync-only",
      watches: ["session.sync_sources", "session.recorder_count"],
      severity: "info",
      kind: "unrealistic",
      title: "Several recorders aligned entirely by hand",
      detail: "Hand alignment works for one pair of files and stops scaling immediately after that. It also leaves no record of what was assumed.",
      fixHint: "If timecode exists anywhere in this material, use it. If it does not, waveform matching against a common source is the next best thing and is repeatable.",
      needsLogic: true,
      logicIntent: "Fire when recorder_count is several_free or several_locked and sync_sources contains manual and none of embedded_tc, recorded_tc, slate or waveform."
    },
    {
      ruleId: "session-no-folder-structure",
      watches: ["session.folder_structure"],
      severity: "attention",
      kind: "missing",
      title: "No folder structure recorded",
      detail: "Without an agreed layout, exports land next to originals, review versions get mistaken for masters, and the archive at the end has to be assembled by guesswork.",
      fixHint: "Write the folders down, even if it is six lines. Originals, working, sessions, exports, review, deliverables, documentation.",
      needsLogic: true,
      logicIntent: "Fire when folder_structure is empty."
    },
    {
      ruleId: "session-naming-not-convention",
      watches: ["session.naming_rule"],
      severity: "attention",
      kind: "mismatch",
      title: "That is a hope, not a naming convention",
      detail: "Names like Final, Final Final, Newest or Use This defer the decision to whoever opens the folder next, and they always arrive in pairs.",
      fixHint: "Use a pattern with parts in a fixed order and a version number that increments. Any pattern beats any adjective.",
      needsLogic: true,
      logicIntent: "Fire when naming_rule contains final, final final, newest, use this, latest, new, copy or corrected, or when it has no separator or placeholder suggesting a repeating pattern. Same detection as the Pre-Production rule."
    },
    {
      ruleId: "session-version-not-identifiable",
      watches: ["session.version_fields", "session.version_log"],
      severity: "info",
      kind: "missing",
      title: "A version nobody can go back to",
      detail: "Session versions do not record a number, a date or what changed, so there is no way to return to the state a client approved.",
      fixHint: "Record at least a version number, a date and one line of description. The approval status is what makes a revision round survivable.",
      needsLogic: true,
      logicIntent: "Fire when version_fields lacks number or lacks both date and description, or when it includes description but version_log is empty and not marked not applicable."
    },
    {
      ruleId: "session-no-track-structure",
      watches: ["session.track_layout"],
      severity: "attention",
      kind: "missing",
      title: "No track structure",
      detail: "The session has no recorded organisation, which is survivable alone and not survivable the moment anybody else opens it — including you after a gap.",
      fixHint: "Group the tracks by what they contain and say where each group routes. The stem structure in the mix stage is built directly on this.",
      needsLogic: true,
      logicIntent: "Fire when track_layout is empty."
    },
    {
      ruleId: "session-unlocked-picture",
      watches: ["session.video_reference", "brief.production_status"],
      severity: "attention",
      kind: "unrealistic",
      title: "Detailed work against a cut that can still change",
      detail: "The picture in the session is not locked. Anything cut to frame — Foley, effects placement, ADR timing, music hits — is at risk of having to be done again.",
      fixHint: "Get a lock date. Until then, work at the level that survives a re-cut: dialogue editing, cleanup and organisation, rather than frame-accurate detail.",
      needsLogic: true,
      logicIntent: "Fire when video_reference is unlocked.",
      onlyFor: ["podcast", "live"]
    }
  ],
  activity: {
    activityId: "restore-synchronisation",
    title: "Restore synchronisation",
    prompt: "Three recordings of the same hour: a main multitrack, a backup recorder in the corner, and a guest's own file sent from another city. They were all lined up at the start of the session and everything sounded fine. Somebody has now noticed that the backup recorder is a frame or two late by the end. Work out what is actually wrong with each source, and choose corrections that match the causes.",
    onlyFor: ["podcast", "live"],
    seed: {
      "session.session_rate": "48000",
      "session.session_depth": "24",
      "session.session_frame_rate": "25",
      "session.session_start": "10:00:00:00",
      "session.channel_format": "stereo",
      "session.folder_structure": "01_ORIGINALS / 02_WORKING / 03_SESSIONS / 04_EXPORTS",
      "session.naming_rule": "NG_E04_v01",
      "session.recorder_count": "several_free",
      "session.sync_sources": ["manual"],
      "session.sync_checked_at_end": "no",
      "session.drift_diagnosis": "unknown",
      "session.drift_action": "move",
      "session.track_layout": [
        { tl_group: "Host and guests", tl_kind: "dialogue", tl_count: 3, tl_routes_to: "Speech bus", tl_notes: "" }
      ],
      "session.sync_table": [
        { sy_source: "Main multitrack", sy_method: "timecode", sy_offset: "0", sy_holds: "holds", sy_notes: "" },
        { sy_source: "Backup recorder (corner)", sy_method: "manual", sy_offset: "0", sy_holds: "drifts", sy_notes: "Late by the end" },
        { sy_source: "Remote guest local file", sy_method: "manual", sy_offset: "+2 s", sy_holds: "unchecked", sy_notes: "Sent by the guest, 44.1 kHz" }
      ]
    },
    passWhen: "Sync is checked at the end of the longest file; the drift is diagnosed as something other than unknown; the correction matches the cause, which means the steadily drifting backup is stretched, resampled or reconformed rather than moved or accepted; every row in the synchronisation table has a method that is no longer manual-only and a hold state that is no longer unchecked; and a real synchronisation source is recorded alongside the manual one.",
    debrief: "Three sources, three different problems, and only one of them was the one anybody noticed. The backup recorder was free-running, so it drifts — and moving it, which is what had already been done, lines up the moment you are looking at and leaves every other moment wrong. That is why the diagnosis has to come before the cure. The remote guest's file was never checked at the tail at all, and it is at a different sample rate, which is the classic cause of a slow, steady slide that people blame on the performer. And the main multitrack, the one with timecode, needed nothing. Notice that the fix for all of this was available in stage 2, where somebody could have decided the conversion policy once. Post-production problems are very rarely where you find them."
  }
};

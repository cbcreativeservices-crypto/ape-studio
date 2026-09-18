/**
 * Post-Production · Stage 2 — Ingest and Verify the Media.
 *
 * Owner's spec, Post-Production Chapter 1, Stage 2 (Media Ingest and
 * Verification). The spec's central teaching point — "matching filenames alone
 * does not confirm that a copy is intact" — is carried by the verification
 * rules rather than by a paragraph of prose.
 */
import type { StageDef } from '../schema';

export const STAGE2_MEDIA: StageDef = {
  stageId: "media",
  num: 2,
  title: "Ingest and Verify the Media",
  intro: "Copy the material in, prove the copy is good, and leave the originals exactly as you found them. This is the least interesting stage in the lab and the one that most often decides whether the project survives.",
  whyItMatters: "Everything after this assumes the media is intact. If a file was truncated during the copy, or the card was reformatted before anyone checked, or somebody renamed the originals in place, you will not find out now — you will find out in the mix, and the material will be gone. The originals are the only thing in post-production that cannot be remade.",
  notices: [
    {
      kind: "safety",
      text: "Never reformat, delete or overwrite an original card, drive or source until a verified copy exists in at least two places and somebody has opened it. This is the one irreversible action in post-production."
    }
  ],
  sections: [
    {
      sectionId: "originals",
      title: "Protect the Originals",
      intro: "Where the untouched material lives, who copied it, and how you know the copy worked.",
      fields: [
        {
          fieldId: "original_location",
          label: "Original media location",
          kind: "text",
          help: "Where the untouched originals sit. This folder is read-only from now on: nothing is edited, renamed or processed inside it.",
          required: true
        },
        {
          fieldId: "originals_read_only",
          label: "Are the originals protected from writing",
          kind: "choice",
          help: "Locked by folder permission, by a write-protected volume, or by nothing but good intentions.",
          required: true,
          options: [
            { value: "locked", label: "Yes — permissions or hardware lock" },
            { value: "convention", label: "Only by agreement between us" },
            { value: "no", label: "No" }
          ]
        },
        {
          fieldId: "working_location",
          label: "Working media location",
          kind: "text",
          help: "Where the copies you actually edit live.",
          required: true
        },
        {
          fieldId: "backup_location",
          label: "Backup location",
          kind: "text",
          help: "A second copy, on different hardware, in a different place. A second folder on the same drive is not a backup.",
          required: true
        },
        {
          fieldId: "backup_offsite",
          label: "Is any copy in a different building",
          kind: "choice",
          help: "Two drives on one desk share one flood, one theft and one power event.",
          options: [
            { value: "yes", label: "Yes" },
            { value: "cloud", label: "Yes — a cloud or remote copy" },
            { value: "no", label: "No, everything is in one place" }
          ]
        },
        {
          fieldId: "copy_procedure",
          label: "How the media was copied",
          kind: "choice",
          help: "A verifying copy tool reads the written file back. Dragging in a file browser does not.",
          required: true,
          options: [
            { value: "verified_tool", label: "A verifying copy or offload tool" },
            { value: "sync_tool", label: "A sync tool with checksums enabled" },
            { value: "drag", label: "Dragged in the file browser" },
            { value: "unknown", label: "Somebody else did it" }
          ]
        },
        {
          fieldId: "ingest_owner",
          label: "Who performed the ingest",
          kind: "text",
          help: "A name, so that a question about a missing file has somewhere to go.",
          required: true
        },
        {
          fieldId: "ingest_log",
          label: "Ingest log",
          kind: "longText",
          help: "What was copied, from what source, when, and anything unusual that happened during it.",
          placeholder: "e.g. Cards A and B offloaded 14 Sept, checksums verified. Card B had one file the tool could not read — noted below."
        },
        {
          fieldId: "source_still_intact",
          label: "Do the source cards or drives still hold the material",
          kind: "choice",
          help: "Until every check below has passed, the answer needs to be yes.",
          required: true,
          options: [
            { value: "yes", label: "Yes, nothing has been wiped" },
            { value: "partly", label: "Some have been reused" },
            { value: "no", label: "No, the sources have been cleared" },
            { value: "unknown", label: "I do not know" }
          ]
        }
      ]
    },
    {
      sectionId: "inventory",
      title: "Media Inventory",
      intro: "One row per media item. The technical columns are where the incompatibilities show up before they cost anything.",
      fields: [
        {
          fieldId: "media_inventory",
          label: "Media inventory",
          kind: "table",
          help: "Fill the technical columns from the files themselves, not from what you expect them to be. The mismatches are the point of the table.",
          required: true,
          columns: [
            { columnId: "mi_file", label: "Filename", kind: "text" },
            {
              columnId: "mi_type",
              label: "Type",
              kind: "choice",
              options: [
                { value: "audio", label: "Audio" },
                { value: "video", label: "Video" },
                { value: "session", label: "Session file" },
                { value: "interchange", label: "AAF / OMF / XML" },
                { value: "midi", label: "MIDI or tempo map" },
                { value: "document", label: "Script, cue sheet or report" },
                { value: "reference", label: "Reference export" }
              ]
            },
            { columnId: "mi_duration", label: "Duration", kind: "duration" },
            {
              columnId: "mi_rate",
              label: "Sample rate",
              kind: "choice",
              options: [
                { value: "44100", label: "44.1 kHz" },
                { value: "48000", label: "48 kHz" },
                { value: "88200", label: "88.2 kHz" },
                { value: "96000", label: "96 kHz" },
                { value: "192000", label: "192 kHz" },
                { value: "na", label: "Not audio" }
              ]
            },
            {
              columnId: "mi_depth",
              label: "Bit depth",
              kind: "choice",
              options: [
                { value: "16", label: "16-bit" },
                { value: "24", label: "24-bit" },
                { value: "32f", label: "32-bit float" },
                { value: "na", label: "Not audio" }
              ]
            },
            { columnId: "mi_channels", label: "Channels", kind: "number" },
            { columnId: "mi_timecode", label: "Start timecode", kind: "text" },
            {
              columnId: "mi_frame_rate",
              label: "Frame rate",
              kind: "choice",
              options: [
                { value: "23_976", label: "23.976" },
                { value: "24", label: "24" },
                { value: "25", label: "25" },
                { value: "29_97_ndf", label: "29.97 ND" },
                { value: "29_97_df", label: "29.97 DF" },
                { value: "30", label: "30" },
                { value: "50", label: "50" },
                { value: "59_94", label: "59.94" },
                { value: "vfr", label: "Variable" },
                { value: "na", label: "Not applicable" }
              ]
            },
            {
              columnId: "mi_status",
              label: "Status",
              kind: "choice",
              options: [
                { value: "online", label: "Online and verified" },
                { value: "unverified", label: "Present, not verified" },
                { value: "missing", label: "Missing" },
                { value: "duplicate", label: "Duplicate" },
                { value: "corrupt", label: "Corrupted" },
                { value: "truncated", label: "Truncated" }
              ]
            },
            { columnId: "mi_notes", label: "Notes", kind: "text" }
          ]
        },
        {
          fieldId: "inventory_source",
          label: "How the inventory was built",
          kind: "choice",
          help: "A list typed from memory has different failure modes from one read off the files.",
          options: [
            { value: "read_from_files", label: "Read from the files themselves" },
            { value: "report", label: "From a production or offload report" },
            { value: "manual", label: "Typed by hand" }
          ]
        }
      ]
    },
    {
      sectionId: "verification",
      title: "Copy Verification",
      intro: "How you know the copy is the same as the original. This is the section the spec is built around.",
      fields: [
        {
          fieldId: "verify_method",
          label: "Verification method",
          kind: "multiChoice",
          help: "Matching filenames proves nothing. Matching sizes proves a little. A checksum proves the bytes.",
          required: true,
          options: [
            { value: "file_count", label: "File count matches" },
            { value: "file_size", label: "File sizes match" },
            { value: "checksum", label: "Checksums match" },
            { value: "app_verify", label: "The application verified the media" },
            { value: "playback", label: "Played back and listened to" },
            { value: "none", label: "No verification performed" }
          ]
        },
        {
          fieldId: "verify_coverage",
          label: "How much was verified",
          kind: "choice",
          required: true,
          options: [
            { value: "all", label: "Every file" },
            { value: "sample", label: "A sample of files" },
            { value: "none", label: "None" }
          ]
        },
        {
          fieldId: "verify_owner",
          label: "Who verified it",
          kind: "text",
          help: "Ideally not the same person who did the copy, though on most jobs it is."
        },
        {
          fieldId: "verify_findings",
          label: "What the verification found",
          kind: "longText",
          help: "Including \"nothing\". A recorded clean result is evidence; an unrecorded one is a memory.",
          placeholder: "e.g. 212 of 212 files matched. One file on card B failed twice and was re-copied from the original successfully."
        }
      ]
    },
    {
      sectionId: "compatibility",
      title: "Technical Compatibility",
      intro: "Where the material disagrees with itself, or with the delivery specification you recorded in stage 1.",
      fields: [
        {
          fieldId: "known_problems",
          label: "Known technical problems",
          kind: "multiChoice",
          help: "Tick what you have actually observed. Each one has a different cost and a different fix.",
          options: [
            { value: "mixed_rates", label: "Mixed sample rates" },
            { value: "mixed_depths", label: "Mixed bit depths" },
            { value: "unsupported", label: "Unsupported format" },
            { value: "missing_codec", label: "Missing codec" },
            { value: "vfr", label: "Variable frame-rate video" },
            { value: "frame_conflict", label: "Frame-rate conflict" },
            { value: "corrupt", label: "Corrupted files" },
            { value: "truncated", label: "Truncated recordings" },
            { value: "missing_channels", label: "Missing channels" },
            { value: "duplicate_names", label: "Duplicate filenames" },
            { value: "offline", label: "Offline media" },
            { value: "none_found", label: "None found" }
          ]
        },
        {
          fieldId: "problem_plan",
          label: "What you are doing about them",
          kind: "longText",
          help: "One line per problem: convert, re-request, re-record, work around, or accept.",
          placeholder: "e.g. Guest's remote file is 44.1k against a 48k session — converting once on ingest, keeping the original."
        },
        {
          fieldId: "conversion_policy",
          label: "How rate or format conversion is handled",
          kind: "choice",
          help: "Converting once on ingest is usually cheaper than converting repeatedly, and always cheaper than a session that plays at the wrong speed.",
          options: [
            { value: "on_ingest", label: "Converted once on ingest, originals kept" },
            { value: "in_session", label: "Left to the session to handle" },
            { value: "not_needed", label: "Everything already matches" },
            { value: "undecided", label: "Not decided" }
          ]
        }
      ]
    }
  ],
  rules: [
    {
      ruleId: "media-originals-unprotected",
      watches: ["media.originals_read_only", "media.original_location"],
      severity: "attention",
      kind: "unsafe",
      title: "The originals are protected only by good intentions",
      detail: "Nothing prevents somebody opening the original media folder and renaming, editing or processing a file in place. That is the one mistake in post-production that cannot be undone.",
      fixHint: "Set the folder or volume read-only. It takes a moment and it removes a whole class of accident.",
      needsLogic: true,
      logicIntent: "Fire when originals_read_only is convention or no."
    },
    {
      ruleId: "media-sources-cleared-early",
      watches: ["media.source_still_intact", "media.verify_method", "media.verify_coverage"],
      severity: "blocker",
      kind: "unsafe",
      title: "Sources were cleared before the copy was proven",
      detail: "The cards or drives have been reused or wiped, and the copy has not been verified. If anything did not come across, there is nothing left to go back to.",
      fixHint: "Verify what you have immediately, in full. If a file is bad, stop and find out whether any other copy exists anywhere before doing anything else.",
      needsLogic: true,
      logicIntent: "Fire when source_still_intact is partly or no, AND verification is absent or partial — that is, verify_method is empty or contains only none, or verify_coverage is none or sample."
    },
    {
      ruleId: "media-no-verification",
      watches: ["media.verify_method", "media.verify_coverage"],
      severity: "attention",
      kind: "missing",
      title: "The copy has not been verified",
      detail: "No verification method is recorded, so the working media is assumed good rather than known good.",
      fixHint: "At minimum, compare file counts and sizes and play the start and end of each file. A checksum is better and usually automatic.",
      needsLogic: true,
      logicIntent: "Fire when verify_method is empty or contains only none, or when verify_coverage is none."
    },
    {
      ruleId: "media-verification-is-names-only",
      watches: ["media.verify_method"],
      severity: "attention",
      kind: "mismatch",
      title: "Counting files is not verifying them",
      detail: "The only check recorded is the file count. A truncated file, a half-written file and a complete file all count as one.",
      fixHint: "Add sizes at least, and checksums if the tool offers them. Playing the head and tail of each file catches the rest.",
      needsLogic: true,
      logicIntent: "Fire when verify_method contains file_count and none of checksum, file_size, app_verify or playback."
    },
    {
      ruleId: "media-drag-copy-unverified",
      watches: ["media.copy_procedure", "media.verify_method"],
      severity: "attention",
      kind: "unsafe",
      title: "Dragged copy with no read-back",
      detail: "The media was copied in a file browser, which reports success as soon as the last byte is queued rather than when it is confirmed written. Without a checksum or a read-back, a silent failure looks exactly like a success.",
      fixHint: "Run a checksum comparison now, or re-copy with a verifying offload tool while the originals are still there.",
      needsLogic: true,
      logicIntent: "Fire when copy_procedure is drag or unknown and verify_method contains neither checksum nor app_verify."
    },
    {
      ruleId: "media-no-real-backup",
      watches: ["media.backup_location", "media.working_location", "media.backup_offsite"],
      severity: "attention",
      kind: "unsafe",
      title: "One copy is not a backup",
      detail: "The backup and the working media appear to be the same place, or there is no second copy at all. Until the material exists twice, the project is one drive failure from over.",
      fixHint: "Put a second copy on different hardware. A copy in a different building, or in the cloud, covers the events that take the whole desk.",
      needsLogic: true,
      logicIntent: "Fire when backup_location is empty, or when backup_location and working_location read as the same path or the same volume."
    },
    {
      ruleId: "media-all-in-one-place",
      watches: ["media.backup_offsite"],
      severity: "info",
      kind: "unsafe",
      title: "Every copy is in one building",
      detail: "Two drives on one desk survive a drive failure and nothing else.",
      fixHint: "Add a remote or cloud copy of at least the original media. It does not have to be fast; it has to be elsewhere.",
      needsLogic: true,
      logicIntent: "Fire when backup_offsite is no."
    },
    {
      ruleId: "media-empty-inventory",
      watches: ["media.media_inventory"],
      severity: "attention",
      kind: "missing",
      title: "No media inventory",
      detail: "Nothing has been catalogued, so there is no list to check a delivery against and no way to notice that something never arrived.",
      fixHint: "List the files with their technical properties read from the files themselves. Most tools will export this for you.",
      needsLogic: true,
      logicIntent: "Fire when media_inventory is empty."
    },
    {
      ruleId: "media-bad-files-present",
      watches: ["media.media_inventory", "media.problem_plan"],
      severity: "blocker",
      kind: "conflict",
      title: "Corrupted, truncated or missing files with no plan",
      detail: "The inventory contains files that are unusable, and nothing is written down about what happens to them. Editing around a missing file by accident is how a programme goes out with a hole in it.",
      fixHint: "For each bad file: re-copy from the original, request it again, replace it from another take, or record the decision to do without it. Then say so in the plan.",
      needsLogic: true,
      logicIntent: "Fire when any media_inventory row has mi_status corrupt, truncated or missing AND problem_plan is empty."
    },
    {
      ruleId: "media-mixed-sample-rates",
      watches: ["media.media_inventory", "media.conversion_policy"],
      severity: "attention",
      kind: "conflict",
      title: "The material is not all at one sample rate",
      detail: "Files at different sample rates are present. Dropped into a session unconverted, the odd ones out play at the wrong speed and pitch — which is obvious on speech and easy to miss on an ambience bed.",
      fixHint: "Decide the session rate, convert once on ingest, and keep the originals. Record the decision so nobody converts a second time.",
      needsLogic: true,
      logicIntent: "Fire when media_inventory contains more than one distinct mi_rate among audio rows, ignoring na, AND conversion_policy is undecided or empty."
    },
    {
      ruleId: "media-rate-conflicts-delivery",
      watches: ["media.media_inventory", "brief.target_sample_rate"],
      severity: "info",
      kind: "mismatch",
      title: "The material sits below the delivery sample rate",
      detail: "Source files are at a lower sample rate than the delivery specification asks for. Up-converting adds no information; it only makes the file bigger and hides where the material came from.",
      fixHint: "Check whether the specification really requires the higher rate for this content, and if it does, convert at the final export rather than at ingest.",
      needsLogic: true,
      logicIntent: "Fire when brief.target_sample_rate is a number and any audio row's mi_rate is a smaller number. Do not fire when the target is unknown."
    },
    {
      ruleId: "media-frame-rate-conflict",
      watches: ["media.media_inventory", "brief.frame_rate"],
      severity: "attention",
      kind: "conflict",
      title: "Frame rates disagree",
      detail: "Video files carry more than one frame rate, or one that does not match the rate recorded in the brief. Sync built on the wrong assumption drifts steadily, which reads as a gradual loss of lip sync rather than as an obvious fault.",
      fixHint: "Establish which rate is correct with the picture department, and conform the odd material rather than nudging it back into place by hand.",
      needsLogic: true,
      logicIntent: "Fire when media_inventory video rows carry more than one distinct mi_frame_rate ignoring na, or when any differs from brief.frame_rate where that is set and is not none or unknown.",
      onlyFor: ["podcast", "live"]
    },
    {
      ruleId: "media-variable-frame-rate",
      watches: ["media.media_inventory", "media.problem_plan"],
      severity: "attention",
      kind: "unrealistic",
      title: "Variable frame-rate video in the inventory",
      detail: "Variable frame-rate material — typically from a phone or a screen recorder — has no single rate to sync to. It will hold sync for a while and then quietly stop.",
      fixHint: "Transcode it to a constant frame rate before it enters the session, and keep the original. Trying to fix the drift later is a much longer job.",
      needsLogic: true,
      logicIntent: "Fire when any media_inventory row has mi_frame_rate vfr, or known_problems includes vfr, and problem_plan is empty."
    },
    {
      ruleId: "media-duplicate-filenames",
      watches: ["media.media_inventory"],
      severity: "attention",
      kind: "conflict",
      title: "Two files share a name",
      detail: "Duplicate filenames survive right up until something relinks to the wrong one, which typically happens on the machine of whoever opens the archive in two years.",
      fixHint: "Rename the working copies so every name is unique, leaving the originals untouched, and record the mapping in the ingest log.",
      needsLogic: true,
      logicIntent: "Fire when two or more media_inventory rows share the same mi_file, case-insensitively, or when a row is marked duplicate."
    },
    {
      ruleId: "media-no-ingest-owner",
      watches: ["media.ingest_owner", "media.ingest_log"],
      severity: "info",
      kind: "missing",
      title: "The ingest has no name and no log against it",
      detail: "When a file turns out to be missing in six weeks, the useful question is what happened on the day, and the log is the only thing that remembers.",
      fixHint: "Put a name against the ingest and write two lines about how it went, including anything that was unusual.",
      needsLogic: true,
      logicIntent: "Fire when ingest_owner is empty and ingest_log is empty."
    }
  ],
  activity: {
    activityId: "safe-ingest",
    title: "Safe ingest",
    prompt: "A package of media has arrived for an episode and somebody has already started copying it. Look at what was done, what was checked, and what the inventory is telling you. Then make this ingest safe — protect what cannot be remade, prove the copy, and deal with the files that are not what they should be.",
    seed: {
      "media.original_location": "/Volumes/Work/Northgate_E4/ORIGINALS",
      "media.originals_read_only": "no",
      "media.working_location": "/Volumes/Work/Northgate_E4/WORKING",
      "media.backup_location": "/Volumes/Work/Northgate_E4/BACKUP",
      "media.backup_offsite": "no",
      "media.copy_procedure": "drag",
      "media.ingest_owner": "",
      "media.ingest_log": "",
      "media.source_still_intact": "yes",
      "media.verify_method": ["file_count"],
      "media.verify_coverage": "sample",
      "media.verify_findings": "",
      "media.conversion_policy": "undecided",
      "media.problem_plan": "",
      "media.media_inventory": [
        { mi_file: "NG_E4_host.wav", mi_type: "audio", mi_duration: "62", mi_rate: "48000", mi_depth: "24", mi_channels: 1, mi_timecode: "", mi_frame_rate: "na", mi_status: "unverified", mi_notes: "" },
        { mi_file: "NG_E4_guest_studio.wav", mi_type: "audio", mi_duration: "62", mi_rate: "48000", mi_depth: "24", mi_channels: 1, mi_timecode: "", mi_frame_rate: "na", mi_status: "unverified", mi_notes: "" },
        { mi_file: "NG_E4_guest_remote.wav", mi_type: "audio", mi_duration: "58", mi_rate: "44100", mi_depth: "16", mi_channels: 1, mi_timecode: "", mi_frame_rate: "na", mi_status: "unverified", mi_notes: "Sent by the guest" },
        { mi_file: "NG_E4_room.wav", mi_type: "audio", mi_duration: "4", mi_rate: "48000", mi_depth: "24", mi_channels: 1, mi_timecode: "", mi_frame_rate: "na", mi_status: "truncated", mi_notes: "Stops part way" },
        { mi_file: "NG_E4_host.wav", mi_type: "audio", mi_duration: "62", mi_rate: "48000", mi_depth: "24", mi_channels: 1, mi_timecode: "", mi_frame_rate: "na", mi_status: "duplicate", mi_notes: "Second copy in a subfolder" },
        { mi_file: "theme_music.wav", mi_type: "audio", mi_duration: "2", mi_rate: "44100", mi_depth: "16", mi_channels: 2, mi_timecode: "", mi_frame_rate: "na", mi_status: "unverified", mi_notes: "" }
      ]
    },
    passWhen: "The originals are locked read-only; the copy is verified by more than a file count, across every file, with a name against it and the result written down; the duplicate and the truncated file are resolved with a plan recorded; a conversion policy is chosen for the mixed sample rates; and the ingest has an owner and a log.",
    debrief: "Two of the six rows were the real story, and neither would have announced itself. The duplicate would have sat harmlessly in a subfolder until somebody relinked to it and lost an hour wondering why their edits had vanished. The truncated room tone would have been discovered in the dialogue stage, which is exactly when you need room tone and cannot make more of it. Notice also what you did NOT have to fix: the guest's remote file being 44.1 kHz and 16-bit is not a fault, it is a fact — it just needs a decision made once, on purpose, rather than by whatever the session does automatically. And notice the order. Everything here was possible because the source cards had not been cleared yet. That is the whole reason this stage comes second."
  }
};

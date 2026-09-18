/**
 * Post-Production · Stage 8 — Deliver and Archive.
 *
 * Owner's spec, Post-Production Chapter 3, Stages 25 (Client Review and
 * Revisions), 26 (Export and Deliverables), 27 (Delivery Verification) and
 * 28 (Archiving).
 *
 * The spec's own heading for stage 27 is the argument of this whole stage:
 * "Uploading or sending the files does not complete delivery." The five states
 * it names — exported, uploaded, received, verified, accepted — are modelled
 * literally, because collapsing them is exactly the mistake being taught.
 *
 * This is the last stage of the lab, so it also carries the Delivery Package:
 * `packet.ts` renders the whole project, and the readiness verdict on this
 * stage is what the packet's approval line reports.
 */
import type { StageDef } from '../schema';

export const STAGE8_DELIVER: StageDef = {
  stageId: "deliver",
  num: 8,
  title: "Deliver and Archive",
  intro: "Run the revision round without damaging what was approved, build the files the specification asks for, prove they arrived intact, and leave behind something that can still be opened in five years.",
  whyItMatters: "Two things end projects badly. The first is a revision round that overwrites the version a client already approved, so there is nothing to go back to when the new notes turn out to be worse. The second is treating an upload as a delivery: the files went, nobody opened them, and the wrong version, or a version missing a channel, sat on a server for a fortnight with everyone believing the job was done. The archive is the third, and it is the one nobody notices until the day it is needed.",
  notices: [
    {
      kind: "legal",
      text: "What may be delivered, to whom, and for how long, is governed by the rights and agreements on this production. Record restrictions against the files they apply to. Whether a particular delivery or retention is permitted is a question for the rights holder and your client."
    }
  ],
  sections: [
    {
      sectionId: "review_round",
      title: "Client Review and Revisions",
      intro: "Taking notes in without losing the version that was already agreed.",
      fields: [
        {
          fieldId: "review_version_sent",
          label: "What the review copy carried",
          kind: "multiChoice",
          help: "A review copy that cannot be identified generates notes that cannot be attached to anything.",
          options: [
            { value: "project", label: "Project name" },
            { value: "version", label: "Version number" },
            { value: "date", label: "Date" },
            { value: "timecode", label: "Burned-in or referenced timecode" },
            { value: "watermark", label: "Watermark" },
            { value: "summary", label: "Summary of what changed" },
            { value: "deadline", label: "Feedback deadline" },
            { value: "instructions", label: "How to approve" }
          ]
        },
        {
          fieldId: "notes_log",
          label: "Notes log",
          kind: "table",
          help: "One row per note. A note without a position is a note that will be interpreted differently by everyone who reads it.",
          columns: [
            { columnId: "nt_num", label: "No.", kind: "text" },
            { columnId: "nt_from", label: "Reviewer", kind: "text" },
            { columnId: "nt_where", label: "Position", kind: "text" },
            { columnId: "nt_request", label: "Requested change", kind: "text" },
            { columnId: "nt_reason", label: "Reason given", kind: "text" },
            {
              columnId: "nt_priority",
              label: "Priority",
              kind: "choice",
              options: [
                { value: "must", label: "Must" },
                { value: "should", label: "Should" },
                { value: "nice", label: "If there is time" }
              ]
            },
            { columnId: "nt_owner", label: "Assigned to", kind: "text" },
            {
              columnId: "nt_status",
              label: "Status",
              kind: "choice",
              options: [
                { value: "new", label: "New" },
                { value: "accepted", label: "Accepted" },
                { value: "clarify", label: "Needs clarification" },
                { value: "in_progress", label: "In progress" },
                { value: "completed", label: "Completed" },
                { value: "declined", label: "Declined with explanation" },
                { value: "superseded", label: "Superseded" },
                { value: "approved", label: "Approved" }
              ]
            },
            { columnId: "nt_verified", label: "Verified in the export", kind: "text" }
          ]
        },
        {
          fieldId: "conflicts_found",
          label: "Conflicting notes",
          kind: "longText",
          help: "Where two reviewers have asked for opposite things. Doing both is the one response that is always wrong.",
          placeholder: "e.g. Note 4 asks for the bed louder under the open; note 9 asks for it quieter. Priya to decide.",
          allowNa: true
        },
        {
          fieldId: "conflict_resolution",
          label: "How conflicts are settled",
          kind: "choice",
          required: true,
          options: [
            { value: "authority", label: "Referred to the named approval authority" },
            { value: "clarified", label: "Reviewers asked to agree first" },
            { value: "both", label: "Both changes attempted" },
            { value: "unresolved", label: "Not settled" },
            { value: "none", label: "No conflicts" }
          ]
        },
        {
          fieldId: "approved_version_preserved",
          label: "Is the previously approved version preserved",
          kind: "choice",
          help: "Before revisions start. This is the thing you cannot recreate once it has been overwritten.",
          required: true,
          options: [
            { value: "yes", label: "Yes — saved as a separate version and print" },
            { value: "session_only", label: "The session, but not the printed master" },
            { value: "no", label: "No" },
            { value: "no_prior", label: "Nothing has been approved yet" }
          ]
        },
        {
          fieldId: "revision_reqc",
          label: "After revisions, what was re-checked",
          kind: "multiChoice",
          help: "A revision invalidates the checks that came before it, including the ones that passed.",
          options: [
            { value: "affected_deliverables", label: "Which deliverables are affected" },
            { value: "stems", label: "Dependent stems re-printed" },
            { value: "loudness", label: "Loudness re-measured" },
            { value: "qc", label: "Quality control re-run" },
            { value: "captions", label: "Caption and description timing" },
            { value: "approval", label: "New approval obtained" }
          ]
        },
        {
          fieldId: "final_approval",
          label: "Final approval",
          kind: "status",
          help: "The state of the sign-off on the version being delivered."
        },
        {
          fieldId: "approval_record",
          label: "Approval record",
          kind: "longText",
          help: "Which version, approved by whom, on what date, with any conditions or remaining exceptions.",
          placeholder: "e.g. v04 approved by Priya Raman, 14 Oct, subject to the corrected figure at 07:20."
        }
      ]
    },
    {
      sectionId: "exports",
      title: "Exports and Deliverables",
      intro: "One row per file that has to exist. The specification from stage 1 is what each row is checked against.",
      fields: [
        {
          fieldId: "deliverables",
          label: "Deliverables",
          kind: "table",
          help: "Build this from the specification, not from what the session happens to contain.",
          required: true,
          columns: [
            { columnId: "dl_filename", label: "Filename", kind: "text" },
            {
              columnId: "dl_kind",
              label: "What it is",
              kind: "choice",
              options: [
                { value: "full_mix", label: "Full mix" },
                { value: "instrumental", label: "Instrumental" },
                { value: "acappella", label: "A cappella" },
                { value: "clean", label: "Clean version" },
                { value: "radio_edit", label: "Radio edit" },
                { value: "stem", label: "Stem" },
                { value: "me", label: "M&E" },
                { value: "fold", label: "Fold-down" },
                { value: "accessibility", label: "Accessibility version" },
                { value: "language", label: "Language version" },
                { value: "review", label: "Review copy" },
                { value: "document", label: "Document" }
              ]
            },
            {
              columnId: "dl_format",
              label: "Format",
              kind: "choice",
              options: [
                { value: "wav", label: "WAV" },
                { value: "bwf", label: "Broadcast WAV" },
                { value: "aiff", label: "AIFF" },
                { value: "flac", label: "FLAC" },
                { value: "aac", label: "AAC" },
                { value: "mp3", label: "MP3" },
                { value: "video", label: "Embedded in video" },
                { value: "text", label: "Text or caption file" }
              ]
            },
            { columnId: "dl_rate", label: "Sample rate", kind: "text" },
            { columnId: "dl_depth", label: "Bit depth", kind: "text" },
            { columnId: "dl_channels", label: "Channels", kind: "number" },
            { columnId: "dl_loudness", label: "Loudness", kind: "text" },
            {
              columnId: "dl_state",
              label: "State",
              kind: "choice",
              options: [
                { value: "planned", label: "Planned" },
                { value: "exported", label: "Exported" },
                { value: "uploaded", label: "Uploaded" },
                { value: "received", label: "Received" },
                { value: "verified", label: "Verified" },
                { value: "accepted", label: "Accepted" },
                { value: "rejected", label: "Rejected" }
              ]
            },
            { columnId: "dl_notes", label: "Notes", kind: "text" }
          ]
        },
        {
          fieldId: "conversion_needed",
          label: "Sample-rate or bit-depth conversion required",
          kind: "choice",
          help: "Which master gets converted, in what order, and whether the converted file is re-checked.",
          options: [
            { value: "none", label: "None" },
            { value: "planned", label: "Yes — from the highest-resolution master, then re-checked" },
            { value: "unplanned", label: "Yes — no order decided" }
          ]
        },
        {
          fieldId: "manifest_contents",
          label: "The delivery manifest lists",
          kind: "multiChoice",
          help: "The document that travels with the files and settles what was sent.",
          options: [
            { value: "files", label: "Expected files" },
            { value: "sizes", label: "File sizes" },
            { value: "checksums", label: "Checksums" },
            { value: "specs", label: "Technical specifications" },
            { value: "versions", label: "Version descriptions" },
            { value: "rights", label: "Rights restrictions" },
            { value: "contact", label: "Delivery contact" },
            { value: "date", label: "Date" },
            { value: "approval", label: "Approval status" }
          ]
        },
        {
          fieldId: "naming_matches_spec",
          label: "Do the filenames match the required convention",
          kind: "choice",
          help: "Checked character by character against the client's pattern. A surprising share of delivery rejections are nothing else.",
          required: true,
          options: [
            { value: "yes", label: "Yes, checked against the specification" },
            { value: "approx", label: "Close enough" },
            { value: "no", label: "No" },
            { value: "no_convention", label: "No convention was given" }
          ]
        }
      ]
    },
    {
      sectionId: "verification",
      title: "Delivery Verification",
      intro: "Sending is not delivering. Each of these is a separate thing that can fail on its own.",
      fields: [
        {
          fieldId: "verify_steps",
          label: "Verification steps completed",
          kind: "multiChoice",
          help: "Reopening the delivered files is the step that catches the faults that matter, and the one most often skipped.",
          options: [
            { value: "transfer", label: "Transfer confirmed complete" },
            { value: "count", label: "File count compared" },
            { value: "size", label: "Sizes or checksums verified" },
            { value: "reopen", label: "Delivered files reopened and played" },
            { value: "metadata", label: "Metadata confirmed" },
            { value: "review", label: "Spot-checked or fully reviewed" },
            { value: "receipt", label: "Client receipt confirmed" },
            { value: "rejections", label: "Rejected files resolved" },
            { value: "acceptance", label: "Final acceptance recorded" }
          ]
        },
        {
          fieldId: "verified_from_destination",
          label: "Were the files checked at the destination",
          kind: "choice",
          help: "Checking your own copy proves your copy is fine. It says nothing about what arrived.",
          required: true,
          options: [
            { value: "destination", label: "Downloaded back from the destination and checked" },
            { value: "local", label: "Only the local copies were checked" },
            { value: "no", label: "Not checked" }
          ]
        },
        {
          fieldId: "receipt_confirmed_by",
          label: "Who confirmed receipt",
          kind: "text",
          help: "A person at the client, by name. An upload progress bar reaching the end is not a confirmation."
        },
        {
          fieldId: "rejections",
          label: "Rejected or returned files",
          kind: "longText",
          help: "What was rejected, why, and what was done about it.",
          allowNa: true
        }
      ]
    },
    {
      sectionId: "archive",
      title: "Archive",
      intro: "What survives after everyone has moved on. A backup protects current work; an archive preserves finished work.",
      fields: [
        {
          fieldId: "archive_contents",
          label: "The archive contains",
          kind: "multiChoice",
          help: "The test is whether somebody who was not here could rebuild or at least understand the project from this alone.",
          options: [
            { value: "session", label: "Final approved session" },
            { value: "consolidated", label: "Consolidated audio" },
            { value: "originals", label: "Original recordings" },
            { value: "mixes", label: "Approved mixes" },
            { value: "stems", label: "Stems" },
            { value: "masters", label: "Masters" },
            { value: "alternates", label: "Alternate versions" },
            { value: "video", label: "Video reference" },
            { value: "midi", label: "MIDI and tempo maps" },
            { value: "notes", label: "Processing and plug-in notes" },
            { value: "rights", label: "Rights records" },
            { value: "approvals", label: "Approval records" },
            { value: "qc", label: "QC reports" },
            { value: "manifest", label: "Delivery manifest" },
            { value: "readme", label: "README document" }
          ]
        },
        {
          fieldId: "consolidation",
          label: "Session consolidation",
          kind: "multiChoice",
          help: "A session that depends on software you will not have is a session you cannot open.",
          options: [
            { value: "handles", label: "Handles retained on consolidated audio" },
            { value: "instruments_printed", label: "Virtual instruments printed to audio" },
            { value: "processing_printed", label: "Important processing rendered" },
            { value: "open_formats", label: "Open-format alternatives alongside proprietary ones" },
            { value: "plugin_list", label: "Plug-ins, versions and settings documented" },
            { value: "unused_kept", label: "Decision recorded on what unused material to keep" }
          ]
        },
        {
          fieldId: "archive_copies",
          label: "How many archive copies exist",
          kind: "number",
          help: "One copy is not an archive. A synchronised folder is not a copy — it propagates deletions.",
          unit: "copies"
        },
        {
          fieldId: "archive_locations",
          label: "Where they are",
          kind: "text",
          help: "Including at least one somewhere else.",
          placeholder: "e.g. LTO in the studio safe; second drive at the producer's office"
        },
        {
          fieldId: "restore_tested",
          label: "Has a restore been tested",
          kind: "choice",
          help: "An untested archive is a hope. Relinking a session from the archive on a different machine is the test that counts.",
          required: true,
          options: [
            { value: "full", label: "Yes — restored and the session relinked" },
            { value: "listed", label: "Only the file list was checked" },
            { value: "no", label: "No" }
          ]
        },
        {
          fieldId: "archive_record",
          label: "Archive record",
          kind: "longText",
          help: "Identifier, owner, contents, locations, date, retention period, rights limitations, software dependencies, last verification and next review date.",
          placeholder: "e.g. NG-S01-E04 · owner Northgate Media · LTO-8 + offsite drive · created 20 Oct · retain 7 years · next check Oct 2027"
        },
        {
          fieldId: "retention_period",
          label: "Retention period agreed",
          kind: "choice",
          help: "How long this is kept, and whose decision that was. Storage that nobody has agreed to pay for gets deleted by whoever is tidying up.",
          options: [
            { value: "agreed", label: "Agreed with the client in writing" },
            { value: "assumed", label: "Assumed" },
            { value: "none", label: "Not discussed" }
          ]
        }
      ]
    }
  ],
  rules: [
    {
      ruleId: "deliver-approved-version-lost",
      watches: ["deliver.approved_version_preserved", "deliver.notes_log"],
      severity: "blocker",
      kind: "unsafe",
      title: "Revisions are being made over the approved version",
      detail: "A version was approved and it has not been preserved separately before revision work started. If the new notes turn out to be worse — and some rounds do — there is nothing to go back to, and what the client already signed off no longer exists.",
      fixHint: "Save the approved session and its printed master under their own version now, before anything else. Everything after that is recoverable.",
      needsLogic: true,
      logicIntent: "Fire when approved_version_preserved is no, or session_only while deliverables contains exported or later rows. Do not fire when it is no_prior."
    },
    {
      ruleId: "deliver-conflicting-notes-both-done",
      watches: ["deliver.conflict_resolution", "deliver.conflicts_found"],
      severity: "attention",
      kind: "conflict",
      title: "Two opposite notes are both being actioned",
      detail: "Reviewers have asked for contradictory things and the response is to attempt both. The result satisfies neither reviewer and usually produces a third version nobody asked for.",
      fixHint: "Take it to the named approval authority, or ask the reviewers to agree first. Document the decision against both notes.",
      needsLogic: true,
      logicIntent: "Fire when conflict_resolution is both or unresolved."
    },
    {
      ruleId: "deliver-note-unlocated",
      watches: ["deliver.notes_log"],
      severity: "attention",
      kind: "missing",
      title: "A note with no position or no owner",
      detail: "Rows in the notes log have no position, or nobody assigned. A note that cannot be located gets interpreted differently by everyone who reads it, and one with no owner gets done twice or not at all.",
      fixHint: "Every note needs a position, an owner and a status. Where the note is vague, the correct status is needs clarification rather than a guess.",
      needsLogic: true,
      logicIntent: "Fire for each notes_log row where nt_where or nt_owner is empty. Do not fire when the log is empty."
    },
    {
      ruleId: "deliver-note-unverified",
      watches: ["deliver.notes_log"],
      severity: "attention",
      kind: "missing",
      title: "A note marked completed but never verified in the export",
      detail: "Changes marked done have not been confirmed in the exported file. A fix that exists only in the session is a fix the client will not receive.",
      fixHint: "Check each completed note against the actual export, and record where you confirmed it.",
      needsLogic: true,
      logicIntent: "Fire for each notes_log row with nt_status completed or approved where nt_verified is empty."
    },
    {
      ruleId: "deliver-revision-without-recheck",
      watches: ["deliver.revision_reqc", "deliver.notes_log"],
      severity: "attention",
      kind: "missing",
      title: "Revisions made and nothing re-checked",
      detail: "Work has been done since the last quality pass and none of it has been re-verified. A revision invalidates the checks that came before it, including the ones that passed — loudness, stems, captions and all.",
      fixHint: "Re-measure loudness, re-print any dependent stems, re-run quality control on the changed material, and re-check caption timing.",
      needsLogic: true,
      logicIntent: "Fire when notes_log contains completed rows and revision_reqc is empty."
    },
    {
      ruleId: "deliver-no-approval-record",
      watches: ["deliver.final_approval", "deliver.approval_record"],
      severity: "attention",
      kind: "missing",
      title: "No record of who approved what",
      detail: "Nothing records which version was approved, by whom, or on what date. That record is what settles a disagreement about scope after delivery, and it costs one line to write.",
      fixHint: "Write the version, the person, the date and any conditions. Conditions especially — an approval with an unrecorded exception is not an approval.",
      needsLogic: true,
      logicIntent: "Fire when approval_record is empty and the final_approval status is Approved, or when deliverables contains uploaded or later rows while approval_record is empty."
    },
    {
      ruleId: "deliver-delivering-unapproved",
      watches: ["deliver.final_approval", "deliver.deliverables"],
      severity: "blocker",
      kind: "conflict",
      title: "Files are going out without approval",
      detail: "Deliverables have been uploaded or delivered while the final approval is still pending, requested or missing. Delivering an unapproved version is how a client receives a cut that was never signed off.",
      fixHint: "Get the approval, or mark what went out as a review copy rather than a deliverable.",
      needsLogic: true,
      logicIntent: "Fire when any deliverables row has dl_state uploaded, received, verified or accepted AND the final_approval status is not Approved and not Not required."
    },
    {
      ruleId: "deliver-spec-mismatch",
      watches: ["deliver.deliverables", "brief.target_sample_rate", "brief.target_bit_depth", "brief.channel_config"],
      severity: "blocker",
      kind: "mismatch",
      title: "A deliverable does not match the specification",
      detail: "A file's sample rate, bit depth or channel count disagrees with what the brief recorded as required. This is the single most common reason a delivery is rejected, and it is entirely mechanical to prevent.",
      fixHint: "Check every row against the specification before uploading anything. Where a row is deliberately different, say so in its notes.",
      needsLogic: true,
      logicIntent: "Fire when any deliverables row's dl_rate, dl_depth or dl_channels disagrees with brief.target_sample_rate, brief.target_bit_depth or brief.channel_config, ignoring rows whose format is text and ignoring brief values that are unknown."
    },
    {
      ruleId: "deliver-missing-required-version",
      watches: ["deliver.deliverables", "brief.required_versions"],
      severity: "blocker",
      kind: "missing",
      title: "A required version has not been made",
      detail: "The brief lists a version that has no row in the deliverables table. Missing deliverables are usually found by the client, at the point where everybody thought the job was finished.",
      fixHint: "Build the deliverables list from the specification rather than from the session, and check it off row by row.",
      needsLogic: true,
      logicIntent: "Fire when brief.required_versions contains an entry with no corresponding deliverables row: instrumental, acappella, clean, radio_edit, me, stems, mono_fold, accessibility or review each map to the matching dl_kind."
    },
    {
      ruleId: "deliver-naming-not-checked",
      watches: ["deliver.naming_matches_spec", "brief.naming_requirement"],
      severity: "attention",
      kind: "mismatch",
      title: "Filenames not checked against the required convention",
      detail: "The naming is recorded as close enough, or unchecked. Automated ingest at the receiving end usually is not close enough, and rejects the file without looking inside it.",
      fixHint: "Compare character by character with the client's pattern, including case and separators.",
      needsLogic: true,
      logicIntent: "Fire when naming_matches_spec is approx or no, or when it is no_convention while brief.naming_requirement is filled."
    },
    {
      ruleId: "deliver-conversion-unplanned",
      watches: ["deliver.conversion_needed"],
      severity: "attention",
      kind: "missing",
      title: "Conversion required with no order decided",
      detail: "Sample-rate or bit-depth conversion is needed and nothing says which master it comes from or whether the result gets re-checked. Converting a converted file compounds whatever the first pass did.",
      fixHint: "Convert once, from the highest-resolution approved master, apply dither only at the final depth reduction, and re-check the output.",
      needsLogic: true,
      logicIntent: "Fire when conversion_needed is unplanned."
    },
    {
      ruleId: "deliver-upload-is-not-delivery",
      watches: ["deliver.deliverables", "deliver.verify_steps", "deliver.verified_from_destination"],
      severity: "blocker",
      kind: "unsafe",
      title: "Files were sent and nobody has opened them",
      detail: "Deliverables are marked uploaded or beyond, and the delivered files have not been reopened and played. An upload that completes tells you bytes moved; it does not tell you they were the right bytes, or all of them.",
      fixHint: "Download the files back from the destination, open them, and play at least the head, the tail and one point in the middle of each.",
      needsLogic: true,
      logicIntent: "Fire when any deliverables row has dl_state uploaded or later AND verify_steps lacks reopen, or verified_from_destination is local or no."
    },
    {
      ruleId: "deliver-no-receipt",
      watches: ["deliver.receipt_confirmed_by", "deliver.deliverables"],
      severity: "attention",
      kind: "missing",
      title: "Nobody at the client has confirmed receiving anything",
      detail: "Files have gone and no person has said they arrived. A progress bar reaching the end is not a confirmation, and a silent client is not an accepting one.",
      fixHint: "Get a named confirmation, in writing. It is also the moment to ask whether anything is missing.",
      needsLogic: true,
      logicIntent: "Fire when any deliverables row has dl_state uploaded or later and receipt_confirmed_by is empty."
    },
    {
      ruleId: "deliver-rejection-unresolved",
      watches: ["deliver.deliverables", "deliver.rejections"],
      severity: "blocker",
      kind: "conflict",
      title: "A rejected file with nothing recorded against it",
      detail: "A deliverable is marked rejected and there is no record of why or what happened next. Rejections do not resolve themselves, and the deadline does not move for them.",
      fixHint: "Write down what was rejected and why, fix it, redeliver, and re-verify at the destination.",
      needsLogic: true,
      logicIntent: "Fire when any deliverables row has dl_state rejected AND rejections is empty."
    },
    {
      ruleId: "deliver-no-manifest",
      watches: ["deliver.manifest_contents", "deliver.deliverables"],
      severity: "attention",
      kind: "missing",
      title: "No delivery manifest",
      detail: "Nothing travels with the files saying what was sent, at what specification, and under what restrictions. When a question comes back in three months, the manifest is what answers it.",
      fixHint: "List the files with sizes, checksums, specifications, version descriptions, rights restrictions, the contact and the date.",
      needsLogic: true,
      logicIntent: "Fire when deliverables has rows and manifest_contents is empty."
    },
    {
      ruleId: "deliver-archive-one-copy",
      watches: ["deliver.archive_copies", "deliver.archive_locations"],
      severity: "attention",
      kind: "unsafe",
      title: "One copy is not an archive",
      detail: "There is a single archive copy, or no location is recorded. A synchronised folder is not a second copy either — it faithfully propagates every deletion.",
      fixHint: "Two copies at minimum, on different media, at least one of them somewhere else, and neither of them synchronised to the other.",
      needsLogic: true,
      logicIntent: "Fire when archive_copies is a number less than 2, or when archive_copies is set and archive_locations is empty."
    },
    {
      ruleId: "deliver-archive-untested",
      watches: ["deliver.restore_tested", "deliver.archive_contents"],
      severity: "attention",
      kind: "unsafe",
      title: "The archive has never been restored",
      detail: "An archive nobody has restored from is a hope. The failures that matter — a session that will not relink, media that never made it, a format nothing opens any more — all look fine in a file listing.",
      fixHint: "Restore it somewhere else and open the session. Relinking is the part that fails, so that is the part to test.",
      needsLogic: true,
      logicIntent: "Fire when archive_contents is non-empty and restore_tested is no or listed."
    },
    {
      ruleId: "deliver-archive-incomplete",
      watches: ["deliver.archive_contents", "deliver.consolidation"],
      severity: "attention",
      kind: "missing",
      title: "The archive cannot rebuild the project",
      detail: "Core material is absent from the archive — the approved session, the original recordings, the masters, or a README explaining what any of it is. In five years the difference between an archive and a folder of files is the document that says what they are.",
      fixHint: "Add the session, the originals, the approved masters and a README. Print virtual instruments and important processing to audio, and document the plug-ins and versions.",
      needsLogic: true,
      logicIntent: "Fire when archive_contents is non-empty and lacks any of session, originals, masters or readme."
    },
    {
      ruleId: "deliver-retention-unagreed",
      watches: ["deliver.retention_period", "deliver.archive_record"],
      severity: "info",
      kind: "legal",
      title: "Nobody has agreed how long this is kept",
      detail: "The retention period is assumed or undiscussed. Storage nobody has agreed to pay for is storage that gets reclaimed by whoever is tidying up, and rights restrictions often carry their own retention obligations.",
      fixHint: "Agree the period with the client in writing, record it in the archive record, and set a date to review it.",
      needsLogic: true,
      logicIntent: "Fire when retention_period is assumed or none."
    }
  ],
  activity: {
    activityId: "the-upload-succeeded",
    title: "The upload succeeded, but delivery failed",
    prompt: "Everything went. The transfer completed, the client was told, and the job was marked done eleven days ago. This morning the client asked where the instrumental is, and why the main file will not load on their system. Work backwards through the delivery and find every place where something was assumed rather than checked — then put the project in a state where it can be closed properly.",
    onlyFor: ["music", "live"],
    seed: {
      "brief.target_sample_rate": "48000",
      "brief.target_bit_depth": "24",
      "brief.channel_config": "stereo",
      "brief.naming_requirement": "NG_S01E04_<TYPE>_STEREO_48k24_v<NN>",
      "brief.required_versions": ["full_mix", "instrumental", "stems"],
      "deliver.conflict_resolution": "none",
      "deliver.approved_version_preserved": "session_only",
      "deliver.final_approval": "Pending",
      "deliver.approval_record": "",
      "deliver.naming_matches_spec": "approx",
      "deliver.conversion_needed": "unplanned",
      "deliver.manifest_contents": [],
      "deliver.verify_steps": ["transfer", "count"],
      "deliver.verified_from_destination": "local",
      "deliver.receipt_confirmed_by": "",
      "deliver.rejections": "",
      "deliver.revision_reqc": [],
      "deliver.archive_contents": ["mixes", "stems"],
      "deliver.consolidation": [],
      "deliver.archive_copies": 1,
      "deliver.archive_locations": "",
      "deliver.restore_tested": "no",
      "deliver.retention_period": "none",
      "deliver.archive_record": "",
      "deliver.notes_log": [
        { nt_num: "1", nt_from: "Priya", nt_where: "02:14", nt_request: "Vocal up a little", nt_reason: "Lost under the guitars", nt_priority: "must", nt_owner: "Ade", nt_status: "completed", nt_verified: "" }
      ],
      "deliver.deliverables": [
        { dl_filename: "NG_final_mix.wav", dl_kind: "full_mix", dl_format: "wav", dl_rate: "44100", dl_depth: "16", dl_channels: 2, dl_loudness: "", dl_state: "uploaded", dl_notes: "" },
        { dl_filename: "NG_stem_drums.wav", dl_kind: "stem", dl_format: "wav", dl_rate: "48000", dl_depth: "24", dl_channels: 2, dl_loudness: "", dl_state: "uploaded", dl_notes: "" },
        { dl_filename: "NG_stem_bass.wav", dl_kind: "stem", dl_format: "wav", dl_rate: "48000", dl_depth: "24", dl_channels: 2, dl_loudness: "", dl_state: "uploaded", dl_notes: "" }
      ]
    },
    passWhen: "The instrumental exists as a deliverable; the full mix matches the specification's sample rate, bit depth and channel count; the approved version is preserved as a session and a print; the final approval is no longer pending, with an approval record written; filenames are checked against the convention; the conversion has a decided order; a delivery manifest exists; the delivered files have been reopened from the destination and a named person has confirmed receipt; the completed note is verified in the export; and the archive has at least two copies in recorded locations, a tested restore, the session, originals, masters and a README, with a retention period agreed.",
    debrief: "The client found two faults and there were nine. The main mix went out at 44.1 kHz and 16-bit against a specification asking for 48 kHz and 24-bit, which is why it would not load — and the reason nobody caught it is that the only verification performed was a file count, on the local copies, of files nobody reopened. The instrumental was never made at all, because the deliverables list was built from what the session contained rather than from the specification. The approval was still pending when everything shipped. And the archive, such as it was, held the mixes and stems but not the session, not the originals, not a README, in one place, never restored, for a period nobody had agreed. Notice that eleven days passed with everyone believing this was finished. That is the actual lesson of this stage: exported, uploaded, received, verified and accepted are five different things, and only the last one means delivered."
  }
};

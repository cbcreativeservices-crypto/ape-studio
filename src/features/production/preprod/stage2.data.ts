/**
 * Pre-Production · Stage 2 — Establish Deliverables.
 *
 * AUTHORED CONTENT — Computer C, batch 1, 2026-09-17. Ingested verbatim; only
 * the contract's explicit nulls were dropped, because the engine's types use
 * optional properties.
 *
 * DO NOT put logic in this file. Every rule marked `needsLogic` is implemented
 * in ./logic.ts against the same ruleId. That separation is the whole division
 * of labour: authors write words, ccode writes comparisons.
 */
import type { StageDef } from '../schema';

export const STAGE2_DELIVER: StageDef = {
  stageId: "deliver",
  num: 2,
  title: "Establish Deliverables",
  intro: "List every finished thing you owe, the technical specification each one must meet, where each one is going, and who says it is done. The destination sets the specification; you do not get to choose it.",
  whyItMatters: "Most delivery failures are not mixing failures. The mix was fine, but it was the wrong format, the wrong loudness for the platform, missing the clean version the client assumed was included, or approved by someone who turned out not to have the authority. Every one of those was knowable before the first session and cheap to fix then.",
  notices: [
    {
      kind: "legal",
      text: "Acceptance, ownership and licensing of deliverables are contractual matters between you and your client, and they vary by country and production type. This lab teaches you what to define and record. It is not legal advice."
    }
  ],
  sections: [
    {
      sectionId: "deliverables",
      title: "Deliverables",
      intro: "One row per finished item. If it has its own file, its own approval or its own deadline, it is its own deliverable.",
      notices: [
        {
          kind: "legal",
          text: "Accessibility versions such as transcripts, captions or audio description may be required by the destination or by law, depending on the country and the platform. Find the requirement that applies to this production and record it here."
        }
      ],
      fields: [
        {
          fieldId: "deliverable_list",
          label: "What must be delivered?",
          kind: "table",
          help: "Every finished item, including the ones the client has not mentioned but will expect. Stems, instrumentals and social excerpts are the usual surprises.",
          required: true,
          columns: [
            {
              columnId: "item_name",
              label: "Name",
              kind: "text"
            },
            {
              columnId: "item_type",
              label: "Type",
              kind: "choice",
              options: [
                {
                  value: "full_mix",
                  label: "Full mix"
                },
                {
                  value: "mastered_program",
                  label: "Mastered program or master"
                },
                {
                  value: "instrumental",
                  label: "Instrumental"
                },
                {
                  value: "clean_version",
                  label: "Clean or edited-language version"
                },
                {
                  value: "radio_edit",
                  label: "Radio edit or short version"
                },
                {
                  value: "performance_tracks",
                  label: "Performance or backing tracks"
                },
                {
                  value: "stems",
                  label: "Stems"
                },
                {
                  value: "isolated_tracks",
                  label: "Isolated tracks"
                },
                {
                  value: "broadcast_mix",
                  label: "Broadcast mix"
                },
                {
                  value: "livestream_feed",
                  label: "Livestream feed"
                },
                {
                  value: "multitrack",
                  label: "Multitrack recording"
                },
                {
                  value: "surround_mix",
                  label: "Surround mix"
                },
                {
                  value: "immersive_mix",
                  label: "Immersive or object-based mix"
                },
                {
                  value: "accessibility",
                  label: "Accessibility version, transcript or captions"
                },
                {
                  value: "archival_package",
                  label: "Archival package"
                },
                {
                  value: "social_excerpts",
                  label: "Social or promotional excerpts"
                },
                {
                  value: "alt_language",
                  label: "Alternate language version"
                },
                {
                  value: "project_files",
                  label: "Project or session files"
                },
                {
                  value: "other",
                  label: "Other, described in the name"
                }
              ]
            },
            {
              columnId: "item_count",
              label: "How many",
              kind: "number"
            },
            {
              columnId: "item_due",
              label: "Due date",
              kind: "date"
            },
            {
              columnId: "item_notes",
              label: "Notes",
              kind: "text"
            }
          ]
        },
        {
          fieldId: "clean_definition",
          label: "If a clean version is owed, what does clean mean here?",
          kind: "longText",
          help: "Muted, reversed, replaced or re-recorded, which words, and by whose list. If the destination publishes its own standard, name it.",
          required: false
        },
        {
          fieldId: "clean_decider",
          label: "Who decides what must be removed?",
          kind: "text",
          help: "One named person. The engineer should not be guessing at the standard while the session clock runs.",
          required: false
        },
        {
          fieldId: "stem_list",
          label: "If stems are owed, list them",
          kind: "longText",
          help: "Name each stem and what it contains. Stems and multitracks are different things, and the client may be using either word for the other.",
          required: false
        },
        {
          fieldId: "separated_voice",
          label: "Is the voice delivered separately from music and effects?",
          kind: "choice",
          help: "Any alternate language version, re-edit or later re-use depends on this. It is nearly free to keep during the mix and very expensive to recover afterwards.",
          required: false,
          labelBy: {
            music: "Are vocals delivered separately from the instrumental?",
            podcast: "Is the voice delivered separately from music and effects?",
            live: "Is the spoken or sung content available separately from the band and audience?"
          },
          options: [
            {
              value: "yes",
              label: "Yes"
            },
            {
              value: "no",
              label: "No"
            },
            {
              value: "not_applicable",
              label: "Not applicable"
            }
          ]
        }
      ]
    },
    {
      sectionId: "techspec",
      title: "Technical Specification",
      intro: "One row per deliverable. Every value comes from the destination's published specification or the client's written requirement. If you do not have it, write that you do not have it.",
      fields: [
        {
          fieldId: "spec_table",
          label: "Specification per deliverable",
          kind: "table",
          help: "Copy the figures from the destination's own document, with units. Do not fill a cell from memory or from another platform's requirement.",
          required: true,
          columns: [
            {
              columnId: "spec_item",
              label: "Deliverable",
              kind: "text"
            },
            {
              columnId: "file_format",
              label: "File format",
              kind: "choice",
              options: [
                {
                  value: "wav",
                  label: "WAV"
                },
                {
                  value: "bwf",
                  label: "Broadcast WAV (BWF)"
                },
                {
                  value: "aiff",
                  label: "AIFF"
                },
                {
                  value: "flac",
                  label: "FLAC"
                },
                {
                  value: "mp3",
                  label: "MP3"
                },
                {
                  value: "aac",
                  label: "AAC"
                },
                {
                  value: "adm_bwf",
                  label: "ADM BWF (object-based master)"
                },
                {
                  value: "ddp",
                  label: "DDP image"
                },
                {
                  value: "video_container",
                  label: "Audio inside a video file"
                },
                {
                  value: "other",
                  label: "Other, described in notes"
                },
                {
                  value: "unknown",
                  label: "Not yet obtained"
                }
              ]
            },
            {
              columnId: "sample_rate",
              label: "Sample rate",
              kind: "choice",
              options: [
                {
                  value: "44100",
                  label: "44.1 kHz"
                },
                {
                  value: "48000",
                  label: "48 kHz"
                },
                {
                  value: "88200",
                  label: "88.2 kHz"
                },
                {
                  value: "96000",
                  label: "96 kHz"
                },
                {
                  value: "176400",
                  label: "176.4 kHz"
                },
                {
                  value: "192000",
                  label: "192 kHz"
                },
                {
                  value: "other",
                  label: "Other, described in notes"
                },
                {
                  value: "unknown",
                  label: "Not yet obtained"
                }
              ]
            },
            {
              columnId: "bit_depth",
              label: "Bit depth",
              kind: "choice",
              options: [
                {
                  value: "16",
                  label: "16-bit"
                },
                {
                  value: "24",
                  label: "24-bit"
                },
                {
                  value: "32f",
                  label: "32-bit float"
                },
                {
                  value: "lossy",
                  label: "Not applicable (lossy format)"
                },
                {
                  value: "unknown",
                  label: "Not yet obtained"
                }
              ]
            },
            {
              columnId: "channel_config",
              label: "Channel configuration",
              kind: "choice",
              options: [
                {
                  value: "mono",
                  label: "Mono"
                },
                {
                  value: "stereo",
                  label: "Stereo"
                },
                {
                  value: "5_1",
                  label: "5.1"
                },
                {
                  value: "7_1",
                  label: "7.1"
                },
                {
                  value: "7_1_4",
                  label: "7.1.4"
                },
                {
                  value: "object_based",
                  label: "Object-based immersive"
                },
                {
                  value: "binaural",
                  label: "Binaural"
                },
                {
                  value: "other",
                  label: "Other, described in notes"
                },
                {
                  value: "unknown",
                  label: "Not yet obtained"
                }
              ]
            },
            {
              columnId: "loudness_requirement",
              label: "Loudness requirement, with units",
              kind: "text"
            },
            {
              columnId: "peak_requirement",
              label: "Peak requirement, with units",
              kind: "text"
            },
            {
              columnId: "duration_requirement",
              label: "Duration limit or target",
              kind: "text"
            },
            {
              columnId: "head_tail",
              label: "Start and end requirements",
              kind: "text"
            },
            {
              columnId: "naming",
              label: "File naming convention",
              kind: "text"
            },
            {
              columnId: "metadata",
              label: "Required metadata",
              kind: "text"
            },
            {
              columnId: "delivery_method",
              label: "Delivery method",
              kind: "choice",
              options: [
                {
                  value: "transfer_service",
                  label: "File transfer service"
                },
                {
                  value: "shared_cloud",
                  label: "Shared cloud folder"
                },
                {
                  value: "ftp_sftp",
                  label: "FTP or SFTP"
                },
                {
                  value: "platform_upload",
                  label: "Direct upload to the destination"
                },
                {
                  value: "physical_drive",
                  label: "Physical drive"
                },
                {
                  value: "physical_media",
                  label: "Physical media or DDP"
                },
                {
                  value: "live_output",
                  label: "Live output on the day"
                },
                {
                  value: "other",
                  label: "Other, described in notes"
                },
                {
                  value: "unknown",
                  label: "Not yet agreed"
                }
              ]
            },
            {
              columnId: "spec_deadline",
              label: "Delivery deadline",
              kind: "date"
            },
            {
              columnId: "spec_notes",
              label: "Notes",
              kind: "text"
            }
          ]
        },
        {
          fieldId: "loudness_spec_source",
          label: "Where does each loudness and peak requirement come from?",
          kind: "longText",
          help: "Name the document, page or email for each destination, and when you read it. Requirements differ by platform, country and format, and they change.",
          required: false
        },
        {
          fieldId: "session_sample_rate",
          label: "Session or capture sample rate",
          kind: "choice",
          help: "The rate you will record and mix at. Decide it against the deliverables above, before the first take.",
          required: true,
          options: [
            {
              value: "44100",
              label: "44.1 kHz"
            },
            {
              value: "48000",
              label: "48 kHz"
            },
            {
              value: "88200",
              label: "88.2 kHz"
            },
            {
              value: "96000",
              label: "96 kHz"
            },
            {
              value: "176400",
              label: "176.4 kHz"
            },
            {
              value: "192000",
              label: "192 kHz"
            },
            {
              value: "undecided",
              label: "Not decided yet"
            }
          ]
        },
        {
          fieldId: "session_bit_depth",
          label: "Session or capture bit depth",
          kind: "choice",
          help: "The depth you will record at. Lossy or reduced-depth deliverables are made from this at the end, not recorded that way.",
          required: false,
          options: [
            {
              value: "16",
              label: "16-bit"
            },
            {
              value: "24",
              label: "24-bit"
            },
            {
              value: "32f",
              label: "32-bit float"
            },
            {
              value: "undecided",
              label: "Not decided yet"
            }
          ]
        },
        {
          fieldId: "timecode_required",
          label: "Is timecode or sync to picture required?",
          kind: "choice",
          help: "Any deliverable that must line up with video or with another system needs a sync plan before the day, not after.",
          required: false,
          options: [
            {
              value: "no",
              label: "No"
            },
            {
              value: "yes",
              label: "Yes, described below"
            },
            {
              value: "unknown",
              label: "Not known yet"
            }
          ]
        },
        {
          fieldId: "timecode_notes",
          label: "Sync details",
          kind: "longText",
          help: "What the audio must sync to, who owns the frame rate and sample rate on the picture side, and how sync is confirmed before the day.",
          required: false
        }
      ]
    },
    {
      sectionId: "destination",
      title: "Destination and Platform",
      intro: "Where the work goes and how people will actually hear it. Each destination owns its own specification; your job is to obtain it, not to remember it.",
      fields: [
        {
          fieldId: "destination_list",
          label: "Destinations",
          kind: "table",
          help: "One row per place the work is delivered or published. Record where its specification lives and whether you have actually read it.",
          required: true,
          columns: [
            {
              columnId: "dest_name",
              label: "Destination",
              kind: "text"
            },
            {
              columnId: "dest_type",
              label: "Type",
              kind: "choice",
              options: [
                {
                  value: "streaming_music",
                  label: "Streaming music service"
                },
                {
                  value: "podcast_platform",
                  label: "Podcast platform"
                },
                {
                  value: "radio",
                  label: "Radio"
                },
                {
                  value: "television",
                  label: "Television"
                },
                {
                  value: "social",
                  label: "Social media"
                },
                {
                  value: "website",
                  label: "Website"
                },
                {
                  value: "livestream",
                  label: "Livestream"
                },
                {
                  value: "physical_media",
                  label: "Physical media"
                },
                {
                  value: "live_venue",
                  label: "Live venue"
                },
                {
                  value: "installation",
                  label: "Museum or installation"
                },
                {
                  value: "internal",
                  label: "Internal or private use"
                }
              ]
            },
            {
              columnId: "dest_spec_location",
              label: "Where its specification is",
              kind: "text"
            },
            {
              columnId: "dest_spec_status",
              label: "Specification obtained?",
              kind: "choice",
              options: [
                {
                  value: "obtained",
                  label: "Obtained and read"
                },
                {
                  value: "requested",
                  label: "Requested, waiting"
                },
                {
                  value: "not_obtained",
                  label: "Not obtained"
                },
                {
                  value: "none_published",
                  label: "Destination publishes none; client requirement used"
                }
              ]
            },
            {
              columnId: "dest_submission",
              label: "How it is submitted",
              kind: "text"
            },
            {
              columnId: "dest_contact",
              label: "Contact at the destination",
              kind: "text"
            },
            {
              columnId: "dest_deadline",
              label: "Submission deadline",
              kind: "date"
            }
          ]
        },
        {
          fieldId: "playback_context",
          label: "How will most people hear it?",
          kind: "multiChoice",
          help: "The systems the audience will actually use. This decides what you check the mix on before you call it finished.",
          required: false,
          options: [
            {
              value: "headphones",
              label: "Headphones or earbuds"
            },
            {
              value: "phone_laptop",
              label: "Phone or laptop speakers"
            },
            {
              value: "car",
              label: "Car"
            },
            {
              value: "home_speakers",
              label: "Home speakers or soundbar"
            },
            {
              value: "tv",
              label: "Television"
            },
            {
              value: "venue_pa",
              label: "Loudspeaker system in a venue"
            },
            {
              value: "installation_speakers",
              label: "Installation loudspeakers"
            },
            {
              value: "cinema",
              label: "Cinema"
            },
            {
              value: "unknown",
              label: "Not known"
            }
          ]
        },
        {
          fieldId: "destination_notes",
          label: "Anything unusual about a destination",
          kind: "longText",
          help: "Region-specific versions, multiple language feeds, a broadcaster's delivery portal, an installation with its own playback system. Write what you know.",
          required: false
        }
      ]
    },
    {
      sectionId: "approval",
      title: "Approval Chain",
      intro: "Who reviews, who gives notes, who has the final yes, and what happens when they are late. Write it down before the first review, because it cannot be negotiated during one.",
      notices: [
        {
          kind: "legal",
          text: "What counts as acceptance, and what happens when a client does not respond, are terms of your agreement with them. Put them in writing before the work starts. This lab helps you decide what to write; it is not legal advice."
        }
      ],
      fields: [
        {
          fieldId: "reviewers",
          label: "Reviewers and approvers",
          kind: "table",
          help: "Everyone who will hear a version before it is final. Mark who only gives notes and who can actually approve.",
          required: true,
          columns: [
            {
              columnId: "rev_name",
              label: "Name",
              kind: "text"
            },
            {
              columnId: "rev_role",
              label: "Role",
              kind: "text"
            },
            {
              columnId: "rev_gives_notes",
              label: "Gives notes?",
              kind: "choice",
              options: [
                {
                  value: "yes",
                  label: "Yes"
                },
                {
                  value: "no",
                  label: "No"
                }
              ]
            },
            {
              columnId: "rev_can_approve",
              label: "Can give final approval?",
              kind: "choice",
              options: [
                {
                  value: "yes",
                  label: "Yes"
                },
                {
                  value: "no",
                  label: "No"
                }
              ]
            },
            {
              columnId: "rev_deadline",
              label: "Response deadline",
              kind: "date"
            },
            {
              columnId: "rev_method",
              label: "How notes arrive",
              kind: "choice",
              options: [
                {
                  value: "written_timestamped",
                  label: "Written, with timestamps"
                },
                {
                  value: "written_general",
                  label: "Written, general"
                },
                {
                  value: "review_tool",
                  label: "Comments in a review tool"
                },
                {
                  value: "call",
                  label: "Phone or video call"
                },
                {
                  value: "in_person",
                  label: "In person, in the room"
                }
              ]
            }
          ]
        },
        {
          fieldId: "final_approver",
          label: "Who gives final approval?",
          kind: "text",
          help: "One name. It should match the approver in the project brief; if it does not, one of them is wrong.",
          required: true
        },
        {
          fieldId: "review_rounds",
          label: "How many review rounds?",
          kind: "number",
          help: "The number agreed, matching the revision rounds in the scope. Each round is a version, a review period and a reply.",
          required: true,
          unit: "rounds"
        },
        {
          fieldId: "review_period",
          label: "How long does each reviewer have to respond?",
          kind: "duration",
          help: "The window between sending a version and needing the notes back. Multiply it by the number of rounds and see whether the schedule survives.",
          required: false,
          unit: "days"
        },
        {
          fieldId: "notes_consolidator",
          label: "Who consolidates the notes?",
          kind: "text",
          help: "When several people give notes, one person turns them into a single agreed list before the engineer sees them. Name that person.",
          required: false
        },
        {
          fieldId: "silence_means",
          label: "If a reviewer misses their deadline, what happens?",
          kind: "choice",
          help: "Decide it now and write it into the agreement. The wrong time to decide is the day the deadline passes.",
          required: true,
          options: [
            {
              value: "deemed_approved",
              label: "The version is treated as approved"
            },
            {
              value: "schedule_slides",
              label: "The delivery date moves by the same delay"
            },
            {
              value: "escalate",
              label: "It is escalated to a named person who decides"
            },
            {
              value: "undecided",
              label: "Not decided"
            }
          ]
        },
        {
          fieldId: "late_approval_notes",
          label: "Details of the late-approval arrangement",
          kind: "longText",
          help: "Who is escalated to, whether extra rounds are charged, and whether the delivery date protects the engineer or the client.",
          required: false
        }
      ]
    }
  ],
  rules: [
    {
      ruleId: "deliver-list-empty",
      watches: [
        "deliver.deliverable_list"
      ],
      // DEMOTED from blocker 2026-09-17 (owner) - same reason as
      // define-approver-missing: it fires on an empty field, so it blocked a
      // plan nobody had started yet. See the note there.
      severity: "attention",
      kind: "missing",
      title: "No deliverables are defined",
      detail: "Without a list of what must be produced there is no specification to meet, no approval to seek and no moment at which the work is done. Everything in this stage hangs from this list.",
      fixHint: "Add one row for each finished item you owe, including the ones the client assumes and has not mentioned."
    },
    {
      ruleId: "deliver-platform-no-loudness",
      watches: [
        "define.platform",
        "deliver.spec_table",
        "deliver.loudness_spec_source"
      ],
      severity: "attention",
      kind: "missing",
      title: "A destination is chosen but no loudness requirement is recorded",
      detail: "Most publishing destinations have a loudness and peak requirement, and the requirements are not the same. A master that meets one can be rejected or automatically altered by another. There is no universal figure to fall back on.",
      fixHint: "Obtain the specification from each destination and copy its loudness and peak requirements, with units, into the row for each deliverable. Record where you found them.",
      needsLogic: true,
      logicIntent: "Fire when at least one platform other than live_venue or internal is selected in stage 1 and every spec_table row has an empty loudness_requirement, or when spec rows exist with loudness values but loudness_spec_source is empty. Treat a live venue as exempt when it is the only destination. Never suggest a value."
    },
    {
      ruleId: "deliver-spec-not-obtained",
      watches: [
        "deliver.destination_list"
      ],
      severity: "attention",
      kind: "missing",
      title: "Delivering to a destination whose specification nobody has read",
      detail: "A destination that publishes a specification will hold you to it. Working from memory or from another platform's rules is how a finished master comes back rejected on the delivery date.",
      fixHint: "Obtain the document from each destination, read it, and mark the row as obtained. If the destination publishes nothing, get the client's requirement in writing.",
      needsLogic: true,
      logicIntent: "Fire for any destination_list row whose dest_spec_status is not_obtained or requested, or empty. Once per row or once with a count; ccode decides."
    },
    {
      ruleId: "deliver-format-mismatch",
      watches: [
        "define.format",
        "define.platform",
        "deliver.deliverable_list",
        "deliver.spec_table",
        "deliver.destination_list"
      ],
      severity: "attention",
      kind: "mismatch",
      title: "The channel format does not match the destination",
      detail: "A stereo file cannot drive an immersive installation, and an immersive mix cannot be assumed by a destination that only takes stereo. Either way the mismatch is found by the person installing the file, after the mix room has been struck.",
      fixHint: "Match the channel configuration of each deliverable to what its destination actually takes, and change the project format in stage 1 if that is where the error is.",
      needsLogic: true,
      logicIntent: "Fire when the stage 1 format is surround, immersive or binaural but every spec_table row is mono or stereo; when any spec_table row is surround, 7.1.4 or object-based but the stage 1 format is mono or stereo; or when a destination of type installation exists and no deliverable of type surround_mix or immersive_mix exists while the stage 1 format is not mono or stereo. Do not assume which destinations accept which formats; compare only what the user has recorded."
    },
    {
      ruleId: "deliver-localisation-no-separation",
      watches: [
        "define.alternate_versions",
        "deliver.deliverable_list",
        "deliver.separated_voice"
      ],
      severity: "attention",
      kind: "mismatch",
      title: "An alternate language version is owed but the voice is not separated",
      detail: "Replacing the language means replacing the voice while keeping everything else. If the voice was mixed into the music and effects, it cannot be cleanly recovered, and the alternate version becomes a second production.",
      fixHint: "Set the voice to be delivered separately, and plan the mix so the voice, music and effects exist as independent elements from the first session.",
      needsLogic: true,
      logicIntent: "Fire when alt_language is selected in stage 1 alternate_versions or a deliverable of type alt_language exists, and separated_voice is no or empty."
    },
    {
      ruleId: "deliver-sample-rate-fights-workflow",
      watches: [
        "deliver.session_sample_rate",
        "deliver.spec_table",
        "deliver.timecode_required",
        "deliver.timecode_notes"
      ],
      severity: "attention",
      kind: "mismatch",
      title: "The session sample rate fights the deliverables",
      detail: "Delivering at a higher rate than you recorded adds nothing but conversion time, and a deliverable that must sync to picture has a rate the video side has already decided. Both are settled before the first take or not at all.",
      fixHint: "Set the session rate against the deliverables before the first take. When a deliverable syncs to picture, get the rate from the video side and record it in the sync details.",
      needsLogic: true,
      logicIntent: "Fire when any spec_table row's sample rate is higher than session_sample_rate. Also fire when timecode_required is yes and timecode_notes is empty. Do not fire on plain downward conversion, which is routine, and do not hardcode which rate belongs to which destination."
    },
    {
      ruleId: "deliver-clean-undefined",
      watches: [
        "deliver.deliverable_list",
        "define.alternate_versions",
        "deliver.clean_definition",
        "deliver.clean_decider"
      ],
      severity: "attention",
      kind: "missing",
      title: "A clean version is owed but nobody has defined clean",
      detail: "The engineer will remove what they think is offensive, the client will listen for what they think is offensive, and the destination has a list that is different again. The version gets rejected, and the argument is about whose list was right.",
      fixHint: "Write down what must be removed or replaced and how, name the standard if the destination publishes one, and name the one person who decides edge cases.",
      needsLogic: true,
      logicIntent: "Fire when a deliverable of type clean_version exists or clean is selected in stage 1 alternate_versions, and clean_definition or clean_decider is empty."
    },
    {
      ruleId: "deliver-stems-undefined",
      watches: [
        "deliver.deliverable_list",
        "deliver.stem_list"
      ],
      severity: "attention",
      kind: "missing",
      title: "Stems are owed but nobody has said which ones",
      detail: "Stems mean different things to different people, and the client may mean multitracks. A stem set built to the wrong definition is a full re-export at best, and at worst a re-mix.",
      fixHint: "List every stem by name and content, and confirm the list with the client before the mix is printed.",
      needsLogic: true,
      logicIntent: "Fire when a deliverable of type stems or isolated_tracks exists and stem_list is empty."
    },
    {
      ruleId: "deliver-no-archival-master",
      watches: [
        "deliver.deliverable_list",
        "define.archive_plan"
      ],
      severity: "attention",
      kind: "missing",
      title: "There is no archival master anywhere in the plan",
      detail: "Every deliverable here is a version made for a destination. When the destination changes, or a remix, licence or re-release is asked for, the version is not enough. The thing that survives is the archival package, and it only exists if someone planned it.",
      fixHint: "Add an archival package, and decide what it contains: the full-resolution master, the multitrack or session files, and the documentation someone would need to open them.",
      needsLogic: true,
      logicIntent: "Fire when no deliverable of type archival_package, multitrack or project_files exists and the stage 1 archive_plan is not producer_keeps or both. When the producer is keeping the files, the archive exists without being a formal deliverable, so do not fire."
    },
    {
      ruleId: "deliver-spec-row-missing",
      watches: [
        "deliver.deliverable_list",
        "deliver.spec_table"
      ],
      severity: "attention",
      kind: "missing",
      title: "A deliverable has no technical specification",
      detail: "A deliverable without a specification will be made to whatever the engineer assumes, and assumed formats are the ones that come back. This is usually the social excerpt or the instrumental, the items nobody thought needed a spec.",
      fixHint: "Add a specification row for every deliverable, even when the values are copied from another row.",
      needsLogic: true,
      logicIntent: "Fire when the number of deliverable_list rows exceeds the number of spec_table rows, or when a deliverable name has no spec row whose spec_item matches it. Match names loosely; ccode decides how."
    },
    {
      ruleId: "deliver-approver-conflict",
      watches: [
        "deliver.final_approver",
        "define.approver",
        "deliver.reviewers"
      ],
      severity: "attention",
      kind: "conflict",
      title: "The final approver is not settled",
      detail: "A different name here from the brief, or two reviewers both marked as able to approve, means two people believe they have the final yes. The disagreement is discovered at delivery, by the engineer, who has no authority to settle it.",
      fixHint: "Make the approver here match the brief, and mark exactly one reviewer as able to give final approval. Everyone else gives notes.",
      needsLogic: true,
      logicIntent: "Fire when final_approver and the stage 1 approver are both set and do not match, or when more than one reviewers row has rev_can_approve set to yes. Match names loosely."
    },
    {
      ruleId: "deliver-rounds-conflict",
      watches: [
        "deliver.review_rounds",
        "define.revisions_included"
      ],
      severity: "attention",
      kind: "conflict",
      title: "The review rounds here do not match the revisions in the scope",
      detail: "The scope was priced on one number and the approval chain is planned on another. Whichever is larger is the number the client will remember.",
      fixHint: "Make the two numbers the same, and make sure the client has seen the one you settle on.",
      needsLogic: true,
      logicIntent: "Fire when both review_rounds and the stage 1 revisions_included are set and differ."
    },
    {
      ruleId: "deliver-notes-no-consolidator",
      watches: [
        "deliver.reviewers",
        "deliver.notes_consolidator"
      ],
      severity: "attention",
      kind: "conflict",
      title: "Several people give notes and nobody combines them",
      detail: "Three reviewers produce three lists, and at least two entries will contradict each other. Without a consolidator, the engineer chooses which client to disappoint, and does it under session time.",
      fixHint: "Name one person who collects every note, resolves the contradictions and sends one agreed list per round.",
      needsLogic: true,
      logicIntent: "Fire when more than one reviewers row has rev_gives_notes set to yes and notes_consolidator is empty."
    },
    {
      ruleId: "deliver-late-approval-undefined",
      watches: [
        "deliver.silence_means"
      ],
      severity: "attention",
      kind: "missing",
      title: "Nothing says what happens when approval is late",
      detail: "A reviewer who goes quiet for two weeks has either approved the work or stopped the schedule, and unless it was decided in advance, both of you will assume the version that suits you.",
      fixHint: "Choose what a missed review deadline means, write it into the agreement, and tell every reviewer.",
      needsLogic: true,
      logicIntent: "Fire when silence_means is empty or undecided."
    },
    {
      ruleId: "deliver-deadline-order",
      watches: [
        "deliver.deliverable_list",
        "deliver.spec_table",
        "deliver.reviewers",
        "deliver.review_rounds",
        "deliver.review_period",
        "define.target_date"
      ],
      severity: "attention",
      kind: "conflict",
      title: "The deadlines are in the wrong order",
      detail: "A review deadline after the delivery date, or a delivery date after the project's completion date, is a schedule that can only be met by skipping the review. That is what will happen, and the notes will arrive after the work is public.",
      fixHint: "Put every review deadline before the delivery date it protects, and every delivery date on or before the project completion date. If they do not fit, reduce the rounds or move the completion date.",
      needsLogic: true,
      logicIntent: "Fire when any reviewer response deadline is later than any deliverable due date or spec deadline; when any deliverable due date or spec deadline is later than the stage 1 target date; or when review_rounds multiplied by review_period, counted back from the earliest delivery date, lands before today. Compare only dates the user has entered."
    }
  ],
  activity: {
    activityId: "deliverable-detective",
    title: "Deliverable detective",
    prompt: "A client has emailed: 'We need the launch performance recorded and turned into a stereo master for the streaming services, an immersive version for the foyer installation, a clean radio edit, and some social clips. Approval will come from the board after the launch.' Before you accept the job, find every requirement that is missing or contradicts another, and fill in what you would need to know.",
    seed: {
      "deliver.deliverable_list": [
        {
          item_name: "Stereo master",
          item_type: "mastered_program",
          item_count: 1,
          item_due: "",
          item_notes: "for the streaming services"
        },
        {
          item_name: "Immersive version for foyer installation",
          item_type: "immersive_mix",
          item_count: 1,
          item_due: "",
          item_notes: ""
        },
        {
          item_name: "Clean radio edit",
          item_type: "radio_edit",
          item_count: 1,
          item_due: "",
          item_notes: "client says clean"
        },
        {
          item_name: "Social clips",
          item_type: "social_excerpts",
          item_count: "",
          item_due: "",
          item_notes: ""
        }
      ],
      "deliver.spec_table": [
        {
          spec_item: "Stereo master",
          file_format: "wav",
          sample_rate: "unknown",
          bit_depth: "unknown",
          channel_config: "stereo",
          loudness_requirement: "",
          peak_requirement: "",
          duration_requirement: "",
          head_tail: "",
          naming: "",
          metadata: "",
          delivery_method: "unknown",
          spec_deadline: "",
          spec_notes: ""
        },
        {
          spec_item: "Immersive version for foyer installation",
          file_format: "unknown",
          sample_rate: "unknown",
          bit_depth: "unknown",
          channel_config: "stereo",
          loudness_requirement: "",
          peak_requirement: "",
          duration_requirement: "",
          head_tail: "",
          naming: "",
          metadata: "",
          delivery_method: "unknown",
          spec_deadline: "",
          spec_notes: ""
        }
      ],
      "deliver.clean_definition": "",
      "deliver.clean_decider": "",
      "deliver.destination_list": [
        {
          dest_name: "Streaming services",
          dest_type: "streaming_music",
          dest_spec_location: "",
          dest_spec_status: "not_obtained",
          dest_submission: "",
          dest_contact: "",
          dest_deadline: ""
        },
        {
          dest_name: "Foyer installation",
          dest_type: "installation",
          dest_spec_location: "",
          dest_spec_status: "not_obtained",
          dest_submission: "",
          dest_contact: "",
          dest_deadline: ""
        }
      ],
      "deliver.reviewers": [
        {
          rev_name: "The board",
          rev_role: "Client",
          rev_gives_notes: "yes",
          rev_can_approve: "yes",
          rev_deadline: "",
          rev_method: "call"
        }
      ],
      "deliver.final_approver": "",
      "deliver.review_rounds": "",
      "deliver.silence_means": "undecided"
    },
    passWhen: "The immersive deliverable's channel configuration is no longer stereo; a specification row exists for every deliverable, including the radio edit and the social clips; the clean version has a written definition and a named decider; each destination's specification is marked obtained or requested with a location recorded; a single named final approver replaces 'the board'; a review deadline is set that falls before the delivery date rather than after the launch; and the late-approval outcome is chosen.",
    debrief: "The client's email was normal. Almost every request arrives like this, with the contradictions hidden inside ordinary words: a stereo file for an immersive room, a clean edit with no standard, approval from a group after the thing is already public. Notice that none of the fixes needed you to know more about audio than the client does. They needed you to ask before saying yes. The specification belongs to the destination, and the definition of done belongs to one named person; your job at this stage is to obtain both in writing."
  }
};

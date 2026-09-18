/**
 * Pre-Production · Stage 5 — Prepare the Creative and Technical Plan.
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

export const STAGE5_TECHNICAL: StageDef = {
  stageId: "technical",
  num: 5,
  title: "Prepare the Creative and Technical Plan",
  intro: "Everything between knowing what you are making and knowing exactly how you will capture it: the content, the room, every source, every microphone, every cable and every file. This is the stage the crew works from on the day.",
  whyItMatters: "A production can have the right brief, the right people and the right budget and still fail at the patch bay, because a stereo pair was given one channel, a condenser was left without phantom power, or the click the drummer needed had no way to reach them. None of those are hard problems. They are only expensive when they are found with the clock running.",
  notices: [
    {
      kind: "qualified",
      text: "Where this plan touches temporary power, rigging or work at height, the design and sign-off belong to a licensed or certified person as the venue, union and insurer require. Record here what you have been told; do not calculate or assume it yourself."
    }
  ],
  sections: [
    {
      sectionId: "content",
      title: "Content Readiness",
      intro: "What has to exist before the day: the material itself, in a state the crew can plan from.",
      fields: [
        {
          fieldId: "content_list",
          label: "Content list",
          kind: "table",
          help: "One row per piece, with its state. The column you cannot fill is the question to ask the artist or host this week.",
          required: true,
          labelBy: {
            music: "Song list",
            podcast: "Segment order",
            live: "Set list or running order"
          },
          helpBy: {
            music: "One row per song. Key, tempo and whether a click is used decide the tracking plan; write them down even if they are provisional.",
            podcast: "One row per segment, in order. Duration and whether it is scripted decide how much editing time exists afterwards.",
            live: "One row per song, item or cue, in running order. Duration and anything unusual in it, such as a guest, a video or a costume change, decide the changeovers."
          },
          columns: [
            {
              columnId: "c_item",
              label: "Item",
              kind: "text"
            },
            {
              columnId: "c_status",
              label: "State",
              kind: "choice",
              options: [
                {
                  value: "idea",
                  label: "Idea only"
                },
                {
                  value: "draft",
                  label: "Draft"
                },
                {
                  value: "final",
                  label: "Final"
                },
                {
                  value: "approved",
                  label: "Final and approved"
                }
              ]
            },
            {
              columnId: "c_owner",
              label: "Owner",
              kind: "text"
            },
            {
              columnId: "c_detail",
              label: "Key, tempo, duration or format",
              kind: "text"
            },
            {
              columnId: "c_notes",
              label: "Notes",
              kind: "text"
            }
          ]
        },
        {
          fieldId: "material_status",
          label: "Are the arrangements, scripts or running order final?",
          kind: "choice",
          help: "The state of the material as a whole. If it changes after the plan is built, the plan changes with it, and somebody has to be told.",
          required: true,
          labelBy: {
            music: "Are the arrangements final?",
            podcast: "Is the script or outline final?",
            live: "Is the running order final?"
          },
          options: [
            {
              value: "final",
              label: "Final"
            },
            {
              value: "draft",
              label: "Draft, changes expected"
            },
            {
              value: "not_started",
              label: "Not started"
            }
          ]
        },
        {
          fieldId: "participant_briefing",
          label: "What have performers and participants been sent?",
          kind: "longText",
          help: "Charts, scripts, questions, call times, what to bring, what not to bring. If a guest has not been told the format, they will arrive with their own.",
          required: false
        },
        {
          fieldId: "stage_plot",
          label: "Stage plot or session layout",
          kind: "choice",
          help: "A drawing of who stands where, with every input marked. The input list below is built from it, and the crew sets up from it.",
          required: {
            music: false,
            podcast: false,
            live: true
          },
          onlyFor: [
            "music",
            "live"
          ],
          options: [
            {
              value: "final",
              label: "Drawn and agreed with the performers"
            },
            {
              value: "draft",
              label: "Drafted, not yet agreed"
            },
            {
              value: "none",
              label: "None yet"
            }
          ]
        },
        {
          fieldId: "click_playback",
          label: "Is a click track or playback needed?",
          kind: "choice",
          help: "Anything performers must play or speak along to. It needs an input, a cue mix to hear it on, and a person to run it.",
          required: false,
          labelBy: {
            music: "Will performers play to a click or to tracks?",
            podcast: "Are pre-recorded segments or music played in during recording?",
            live: "Are there backing tracks, a click, or playback cues?"
          },
          options: [
            {
              value: "no",
              label: "No"
            },
            {
              value: "yes",
              label: "Yes"
            },
            {
              value: "unknown",
              label: "Not decided yet"
            }
          ]
        }
      ]
    },
    {
      sectionId: "location",
      title: "Location and Acoustics",
      intro: "Whether the space suits the work, judged in the room rather than from photographs.",
      notices: [
        {
          kind: "safety",
          text: "Cable runs across walkways, doorways and audience areas are trip and fire-exit hazards. Route, cover and mark them, and keep exits clear, under the rules the venue and your local authority apply."
        },
        {
          kind: "qualified",
          text: "What a venue's electrical supply can carry, and how it is distributed to the audio system, is decided by a licensed electrician or the venue's qualified staff. Record what they told you and who said it."
        }
      ],
      fields: [
        {
          fieldId: "space_name",
          label: "Room, studio or venue",
          kind: "text",
          help: "Where the capture happens. If there are several, name the main one here and the others in the notes below.",
          required: true
        },
        {
          fieldId: "space_assessed",
          label: "Has anyone from the crew been in the space?",
          kind: "choice",
          help: "Photographs do not show a humming fridge, a flutter echo or a loading door that is locked after six. Someone should stand in the room before the plan depends on it.",
          required: true,
          options: [
            {
              value: "visited",
              label: "Visited in person"
            },
            {
              value: "remote",
              label: "Assessed remotely, with the venue's help"
            },
            {
              value: "not_assessed",
              label: "Not assessed yet"
            }
          ]
        },
        {
          fieldId: "acoustic_character",
          label: "How does the room sound?",
          kind: "choice",
          help: "Judged by ear, in the room, at the positions you will use. This decides microphone choice and placement more than any other single fact.",
          required: false,
          options: [
            {
              value: "controlled",
              label: "Dry and controlled"
            },
            {
              value: "moderate",
              label: "Moderately live"
            },
            {
              value: "live",
              label: "Very live or reverberant"
            },
            {
              value: "unknown",
              label: "Not heard yet"
            }
          ]
        },
        {
          fieldId: "noise_sources",
          label: "Background and mechanical noise, and isolation",
          kind: "longText",
          help: "Ventilation, traffic, fridges, dimmers, the room next door, the audience. Say what you heard, when, and what can be switched off or moved away from.",
          required: false
        },
        {
          fieldId: "control_position",
          label: "Where is the mix or record position?",
          kind: "text",
          help: "Where the engineer sits and what they can hear and see from there. A position that cannot hear the room or see the performers is a position that finds problems late.",
          required: false,
          labelBy: {
            music: "Where is the control room or record position?",
            podcast: "Where does the engineer sit?",
            live: "Where is the front-of-house position?"
          }
        },
        {
          fieldId: "power_and_cabling",
          label: "Power outlets, cable routes and crossings",
          kind: "longText",
          help: "Where the power is relative to the setup, how cables get from stage to control, and where they cross walkways or doors. Name who confirmed the power.",
          required: false
        },
        {
          fieldId: "audience_and_cameras",
          label: "Audience, cameras and sightlines",
          kind: "longText",
          help: "Where the audience is relative to the loudspeakers, and where cameras and their operators stand relative to the microphones and the front-of-house position.",
          required: false,
          onlyFor: [
            "live"
          ]
        }
      ]
    },
    {
      sectionId: "inputs",
      title: "Sources and Inputs",
      intro: "Every source, how it is captured, and where it lands. This list is the document the crew patches from, so it has to be right, not roughly right.",
      fields: [
        {
          fieldId: "input_list",
          label: "Input list",
          kind: "table",
          help: "One row per input. A stereo source is two rows or two channels, never one. The console channel and recorder track columns are what the patch is checked against on the day.",
          required: true,
          columns: [
            {
              columnId: "in_num",
              label: "Input",
              kind: "number"
            },
            {
              columnId: "in_source",
              label: "Source",
              kind: "text"
            },
            {
              columnId: "in_capture",
              label: "Captured by",
              kind: "choice",
              options: [
                {
                  value: "dynamic_mic",
                  label: "Dynamic microphone"
                },
                {
                  value: "condenser_mic",
                  label: "Condenser microphone"
                },
                {
                  value: "ribbon_mic",
                  label: "Ribbon microphone"
                },
                {
                  value: "di",
                  label: "DI box"
                },
                {
                  value: "line",
                  label: "Line output"
                },
                {
                  value: "wireless",
                  label: "Wireless receiver"
                },
                {
                  value: "playback",
                  label: "Playback device or computer"
                },
                {
                  value: "remote_feed",
                  label: "Remote feed or call"
                },
                {
                  value: "other",
                  label: "Other, in notes"
                }
              ]
            },
            {
              columnId: "in_phantom",
              label: "Phantom power",
              kind: "choice",
              options: [
                {
                  value: "on",
                  label: "On"
                },
                {
                  value: "off",
                  label: "Off"
                },
                {
                  value: "na",
                  label: "Not applicable"
                }
              ]
            },
            {
              columnId: "in_channels",
              label: "Channels this source needs",
              kind: "choice",
              options: [
                {
                  value: "1",
                  label: "1 (mono)"
                },
                {
                  value: "2",
                  label: "2 (stereo pair)"
                }
              ]
            },
            {
              columnId: "in_connection",
              label: "Connection",
              kind: "choice",
              options: [
                {
                  value: "xlr",
                  label: "XLR"
                },
                {
                  value: "trs",
                  label: "TRS jack"
                },
                {
                  value: "ts",
                  label: "TS jack (unbalanced)"
                },
                {
                  value: "wireless",
                  label: "Wireless"
                },
                {
                  value: "network",
                  label: "Network audio"
                },
                {
                  value: "usb",
                  label: "USB"
                },
                {
                  value: "other",
                  label: "Other, in notes"
                }
              ]
            },
            {
              columnId: "in_stand",
              label: "Stand or mount",
              kind: "text"
            },
            {
              columnId: "in_console",
              label: "Console channel",
              kind: "text"
            },
            {
              columnId: "in_track",
              label: "Recorder track",
              kind: "text"
            },
            {
              columnId: "in_notes",
              label: "Notes",
              kind: "text"
            }
          ]
        },
        {
          fieldId: "remote_capture",
          label: "How are remote voices captured?",
          kind: "choice",
          help: "A call recorded at your end carries the connection's faults into the recording. A local recording at each end does not, but someone has to collect the files afterwards.",
          required: false,
          onlyFor: [
            "podcast",
            "music"
          ],
          options: [
            {
              value: "none",
              label: "No remote participants"
            },
            {
              value: "call_only",
              label: "The call is recorded at the host end only"
            },
            {
              value: "local_each_end",
              label: "Each end records locally and sends the file"
            },
            {
              value: "both",
              label: "Both: local recordings plus the call as a safety"
            }
          ]
        },
        {
          fieldId: "input_notes",
          label: "Anything unusual about the inputs",
          kind: "longText",
          help: "Sources that share a stand, instruments that switch mid-set, a guest microphone that only exists for one item.",
          required: false
        }
      ]
    },
    {
      sectionId: "capture",
      title: "Microphones and Capture",
      intro: "Which microphone on which source, why, and what protects the sources that cannot be repeated.",
      fields: [
        {
          fieldId: "mic_choices",
          label: "Microphone choice per source",
          kind: "table",
          help: "A microphone is chosen for a reason you can say out loud: rejection, handling, level, tone, what you own. Write the reason; it is what the next engineer needs when the microphone is not available.",
          required: false,
          columns: [
            {
              columnId: "mc_source",
              label: "Source",
              kind: "text"
            },
            {
              columnId: "mc_mic",
              label: "Microphone or capture device",
              kind: "text"
            },
            {
              columnId: "mc_reason",
              label: "Why this one",
              kind: "multiChoice",
              options: [
                {
                  value: "rejection",
                  label: "Pattern and rejection of other sources"
                },
                {
                  value: "proximity",
                  label: "Proximity and handling behaviour"
                },
                {
                  value: "level",
                  label: "Handles the source's level"
                },
                {
                  value: "tone",
                  label: "Tonal match to the source"
                },
                {
                  value: "noise",
                  label: "Low self-noise for a quiet source"
                },
                {
                  value: "wireless",
                  label: "Has to be wireless"
                },
                {
                  value: "visual",
                  label: "Visually discreet or on camera"
                },
                {
                  value: "availability",
                  label: "It is what is available"
                },
                {
                  value: "other",
                  label: "Other, in placement notes"
                }
              ]
            },
            {
              columnId: "mc_placement",
              label: "Placement intent",
              kind: "text"
            },
            {
              columnId: "mc_backup",
              label: "Backup capture",
              kind: "choice",
              options: [
                {
                  value: "none",
                  label: "None"
                },
                {
                  value: "second_mic",
                  label: "Second microphone"
                },
                {
                  value: "di_split",
                  label: "DI or line split alongside"
                },
                {
                  value: "safety_track",
                  label: "Safety track at lower gain"
                },
                {
                  value: "second_recorder",
                  label: "Recorded on a second device"
                }
              ]
            }
          ]
        },
        {
          fieldId: "unrepeatable_sources",
          label: "Which sources cannot be repeated, and how are they protected?",
          kind: "longText",
          help: "A live performance, an interview answer, a one-take vocal. Say what protects each: a second microphone, a safety track, a second recorder, a local recording at the far end.",
          required: false
        }
      ]
    },
    {
      sectionId: "signal",
      title: "Signal Flow and Routing",
      intro: "Source to destination, with every device in between. A path that is not written down is a path that gets patched differently by two people.",
      fields: [
        {
          fieldId: "signal_path",
          label: "Signal paths",
          kind: "table",
          help: "One row per hop: what leaves where, at what level, and arrives where. Every destination that must receive audio, such as the recorder, the stream encoder or the monitors, should appear as an arrival.",
          required: false,
          columns: [
            {
              columnId: "sp_from",
              label: "From",
              kind: "text"
            },
            {
              columnId: "sp_level",
              label: "Level or format leaving",
              kind: "choice",
              options: [
                {
                  value: "mic",
                  label: "Microphone level"
                },
                {
                  value: "instrument",
                  label: "Instrument level"
                },
                {
                  value: "line",
                  label: "Line level"
                },
                {
                  value: "speaker",
                  label: "Speaker level"
                },
                {
                  value: "digital",
                  label: "Digital"
                },
                {
                  value: "network",
                  label: "Network audio"
                }
              ]
            },
            {
              columnId: "sp_via",
              label: "Through",
              kind: "text"
            },
            {
              columnId: "sp_to",
              label: "To",
              kind: "text"
            },
            {
              columnId: "sp_notes",
              label: "Notes",
              kind: "text"
            }
          ]
        },
        {
          fieldId: "split_method",
          label: "How are inputs shared between destinations?",
          kind: "choice",
          help: "When the same source must reach the house console, a recorder and a stream, something has to split it. Decide what, and who owns the split.",
          required: false,
          options: [
            {
              value: "not_needed",
              label: "One destination only, no split needed"
            },
            {
              value: "passive_split",
              label: "Passive splitter"
            },
            {
              value: "active_split",
              label: "Active splitter"
            },
            {
              value: "console_outputs",
              label: "Console direct outputs or aux sends"
            },
            {
              value: "network",
              label: "Network audio distribution"
            },
            {
              value: "undecided",
              label: "Not decided"
            }
          ]
        },
        {
          fieldId: "patch_list",
          label: "Is there a written patch list?",
          kind: "choice",
          help: "The document that says which cable goes into which socket, built from the input list. Two people patching without one produce two different patches.",
          required: false,
          options: [
            {
              value: "yes",
              label: "Yes, matching the input list"
            },
            {
              value: "draft",
              label: "Draft"
            },
            {
              value: "no",
              label: "No"
            }
          ]
        },
        {
          fieldId: "gain_owner",
          label: "Who sets input gain, and when?",
          kind: "text",
          help: "On most productions gain is set once, during line check, by a named person, and then left alone. If that is not the plan, write what the plan is.",
          required: false
        }
      ]
    },
    {
      sectionId: "monitoring",
      title: "Monitoring and Communication",
      intro: "What the engineer hears, what each performer hears, and how the two talk to each other.",
      notices: [
        {
          kind: "safety",
          text: "Stage, monitor and headphone levels decide what performers' and crew's ears are exposed to for the whole day. Workplace noise limits vary by country. Plan levels so people can hear what they need without harm, and know which rules apply where you are."
        }
      ],
      fields: [
        {
          fieldId: "control_monitoring",
          label: "What does the engineer listen on?",
          kind: "longText",
          help: "Monitors or headphones, and whether the engineer is in the same room as the performers. Decisions about tone made on an unknown system are guesses.",
          required: false,
          labelBy: {
            music: "What does the engineer monitor on?",
            podcast: "What does the engineer monitor on?",
            live: "What is the front-of-house reference, and where?"
          }
        },
        {
          fieldId: "cue_mixes",
          label: "Performer cue mixes",
          kind: "table",
          help: "One row per performer or group who needs their own mix. Each row needs an output to exist on; check the count against what the console can provide.",
          required: false,
          columns: [
            {
              columnId: "cm_who",
              label: "Who",
              kind: "text"
            },
            {
              columnId: "cm_type",
              label: "Delivered on",
              kind: "choice",
              options: [
                {
                  value: "wedge",
                  label: "Floor wedge"
                },
                {
                  value: "iem_wired",
                  label: "Wired in-ears or headphones"
                },
                {
                  value: "iem_wireless",
                  label: "Wireless in-ears"
                },
                {
                  value: "shared",
                  label: "Shares another performer's mix"
                },
                {
                  value: "none",
                  label: "No monitoring"
                }
              ]
            },
            {
              columnId: "cm_output",
              label: "Console output or mix number",
              kind: "text"
            },
            {
              columnId: "cm_content",
              label: "What they need in it",
              kind: "text"
            }
          ]
        },
        {
          fieldId: "talkback",
          label: "How does the engineer speak to performers?",
          kind: "choice",
          help: "A talkback path that only exists in the engineer's head is a lot of walking. Decide it, and test it at line check.",
          required: false,
          options: [
            {
              value: "talkback_mic",
              label: "Talkback microphone into the cue mixes"
            },
            {
              value: "intercom",
              label: "Intercom or radio to a stage contact"
            },
            {
              value: "in_person",
              label: "In person, same room"
            },
            {
              value: "none",
              label: "None planned"
            }
          ]
        },
        {
          fieldId: "level_plan",
          label: "Stage and monitoring level plan",
          kind: "longText",
          help: "How loud the stage and the cue mixes will be, who keeps them there, whether anyone is measuring, and what hearing protection is available. Write what applies where you are.",
          required: false
        }
      ]
    },
    {
      sectionId: "sync",
      title: "Synchronisation",
      intro: "One clock, one sample rate, and a plan for anything that must line up with picture. Simple when it is decided; expensive when it is discovered.",
      fields: [
        {
          fieldId: "clock_master",
          label: "What is the clock master?",
          kind: "choice",
          help: "Digital devices that record or pass audio together must follow one clock. Name the device that provides it. A single recorder is its own master.",
          required: false,
          options: [
            {
              value: "single_device",
              label: "One device records everything; no external clock"
            },
            {
              value: "interface",
              label: "The interface or console is the master"
            },
            {
              value: "word_clock",
              label: "An external word clock generator"
            },
            {
              value: "network",
              label: "The network audio system provides the clock"
            },
            {
              value: "unknown",
              label: "Not decided"
            }
          ]
        },
        {
          fieldId: "device_rates_checked",
          label: "Is every device set to the session sample rate?",
          kind: "choice",
          help: "One device at the wrong rate means audio at the wrong speed and pitch, or no audio at all. Check each device against the rate chosen in stage 2, before the day.",
          required: false,
          options: [
            {
              value: "yes",
              label: "Yes, each device checked"
            },
            {
              value: "no",
              label: "No"
            },
            {
              value: "unknown",
              label: "Not checked yet"
            }
          ]
        },
        {
          fieldId: "recorder_count",
          label: "How many recording devices run at once?",
          kind: "choice",
          help: "Two recorders that do not share a clock drift apart over a long take. If more than one runs, say how they stay together.",
          required: false,
          options: [
            {
              value: "one",
              label: "One"
            },
            {
              value: "several_clocked",
              label: "Several, sharing one clock"
            },
            {
              value: "several_free",
              label: "Several, free-running"
            }
          ]
        },
        {
          fieldId: "timecode_plan",
          label: "Timecode and picture sync plan",
          kind: "longText",
          help: "Only if a deliverable must sync to picture. Who provides timecode, the frame rate the picture side has set, and how sync is confirmed before the day.",
          required: false
        }
      ]
    },
    {
      sectionId: "session",
      title: "Session, Files and Data",
      intro: "How the recording is organised before the first take, so that it can be found, opened and trusted afterwards.",
      fields: [
        {
          fieldId: "session_template",
          label: "Session template",
          kind: "choice",
          help: "A prepared session with the tracks named from the input list. Building it on the day is how track twelve ends up labelled Audio 12.",
          required: false,
          options: [
            {
              value: "tested",
              label: "Built and test-recorded"
            },
            {
              value: "built",
              label: "Built, not yet tested"
            },
            {
              value: "none",
              label: "None yet"
            }
          ]
        },
        {
          fieldId: "naming_convention",
          label: "File and take naming convention",
          kind: "text",
          help: "Write the pattern, not an example: the parts every name contains and their order. A convention that needs a person to interpret it is not a convention.",
          required: true
        },
        {
          fieldId: "folder_structure",
          label: "Folder structure",
          kind: "longText",
          help: "Where the session, the audio files, the documents and the backups live, on which drive. Someone else should be able to find a file from this description alone.",
          required: false
        },
        {
          fieldId: "storage_estimate",
          label: "Estimated recording size",
          kind: "number",
          help: "Worked out from the channel count, the session format and the hours you will record, for one copy. Compare it with the drives recorded in stage 4, remembering the backup needs the same again.",
          required: false,
          unit: "GB"
        },
        {
          fieldId: "verification_method",
          label: "How are the files verified before strike?",
          kind: "choice",
          help: "Opening every file is the minimum. A verified copy proves the backup matches the original, which listening cannot.",
          required: false,
          options: [
            {
              value: "open_each",
              label: "Open and play the start and end of every file"
            },
            {
              value: "verified_copy",
              label: "Verified copy to the backup, with a checksum"
            },
            {
              value: "both",
              label: "Both"
            },
            {
              value: "none",
              label: "No method planned"
            }
          ]
        }
      ]
    }
  ],
  rules: [
    {
      ruleId: "technical-inputs-exceed-capacity",
      watches: [
        "technical.input_list",
        "schedule.available_channels",
        "schedule.available_inputs"
      ],
      severity: "blocker",
      kind: "unrealistic",
      title: "The input list needs more channels than the equipment has",
      detail: "The input list is the real count, and it is larger than the recorder or console recorded in stage 4 can take. Some of these sources will not be captured, and which ones will be decided at the patch bay by whoever runs out of sockets first.",
      fixHint: "Add channels or inputs by hire, combine sources with the artist's agreement, or remove rows, and update stage 4 to match what you actually have.",
      needsLogic: true,
      logicIntent: "Sum in_channels across input_list rows, treating a row with the channels column empty as one. Fire when the sum exceeds schedule.available_channels or, where set, schedule.available_inputs. Do not fire when input_list is empty or the stage 4 fields are empty. When this rule fires, suppress schedule-channels-insufficient, which makes the same comparison from the stage 1 source count; do not raise both."
    },
    {
      ruleId: "technical-stereo-one-channel",
      watches: [
        "technical.input_list"
      ],
      severity: "attention",
      kind: "mismatch",
      title: "A stereo source has been given one channel",
      detail: "A stereo pair needs two console channels and two recorder tracks. With one, half of it is either missing or summed to mono by whoever notices, and the recording cannot be un-summed later.",
      fixHint: "Give every stereo source two channels and two tracks, or record in the notes that it is deliberately captured in mono.",
      needsLogic: true,
      logicIntent: "Fire for each input_list row where in_channels is 2 and either in_console or in_track names a single channel or track rather than two. Detect a single number or a single name; treat a range or two comma-separated entries as two. Nudge only; do not fire when the console or track columns are empty."
    },
    {
      ruleId: "technical-phantom-mismatch",
      watches: [
        "technical.input_list"
      ],
      severity: "attention",
      kind: "mismatch",
      title: "Phantom power does not match the source",
      detail: "Most condenser microphones need phantom power and are silent without it. Phantom sent to a ribbon microphone, a line output or a playback device can damage some of them, and should be a deliberate decision rather than a default left on.",
      fixHint: "Set phantom on for condensers and active devices that need it, off for line and playback sources, and check each ribbon's requirement before the day.",
      needsLogic: true,
      logicIntent: "Fire for each input_list row where in_capture is condenser_mic and in_phantom is off, or where in_capture is ribbon_mic, line or playback and in_phantom is on. Do not fire when in_phantom is empty or na, and do not fire for di or wireless rows, since those vary by device.",
      learnMore: {
        route: "MicLab"
      }
    },
    {
      ruleId: "technical-mic-no-reason",
      watches: [
        "technical.mic_choices"
      ],
      severity: "attention",
      kind: "missing",
      title: "A microphone has been chosen without a stated reason",
      detail: "A microphone with no reason cannot be substituted when it is not available, and cannot be argued for when the artist asks why. The reason is what the next engineer works from; the model number is not.",
      fixHint: "Select at least one reason for each microphone, and write a short placement intent.",
      needsLogic: true,
      logicIntent: "Fire for each mic_choices row where mc_mic is filled and mc_reason is empty. Do not fire when the table is empty.",
      learnMore: {
        route: "MicSelectLab"
      }
    },
    {
      ruleId: "technical-path-ends-nowhere",
      watches: [
        "technical.signal_path",
        "define.services",
        "define.platform"
      ],
      severity: "attention",
      kind: "missing",
      title: "A signal path ends nowhere, or a destination is fed by nothing",
      detail: "A row with no arrival is a cable that goes into a bag. A recorder, stream encoder or monitor system that never appears as an arrival is a destination that receives nothing until someone improvises a feed with the audience in.",
      fixHint: "Give every row a destination, and add a row that feeds each destination the plan depends on: recorder, stream, monitors.",
      needsLogic: true,
      logicIntent: "Fire when any signal_path row has sp_from filled and sp_to empty. Also fire when live_recording or recording is among the stage 1 services and no row's sp_to mentions a recorder or interface, or when livestream_feed is among the services or livestream among the platforms and no row's sp_to mentions a stream or encoder. Match words loosely and do not fire when signal_path is empty.",
      learnMore: {
        route: "SignalChainLab"
      }
    },
    {
      ruleId: "technical-level-format-conflict",
      watches: [
        "technical.signal_path",
        "technical.input_list"
      ],
      severity: "attention",
      kind: "mismatch",
      title: "A level or format conflict in the signal path",
      detail: "An instrument plugged straight into a microphone input, a line output into a microphone preamp at full gain, or an unbalanced jack on a long run to the stage box each work badly in a way that is blamed on something else. The DI that was missing is the usual cause.",
      fixHint: "Put a DI between instrument-level sources and the console, match line outputs to line inputs, and check each row's leaving level against what the destination expects.",
      needsLogic: true,
      logicIntent: "Fire when a signal_path row has sp_level instrument and neither sp_via nor sp_to mentions a DI, direct box or instrument input. Also fire when an input_list row has in_capture line or playback with in_connection ts, since that is an unbalanced source on what is usually a long run. Match words loosely; nudge only.",
      learnMore: {
        route: "SignalChainLab"
      }
    },
    {
      ruleId: "technical-no-safety-capture",
      watches: [
        "technical.mic_choices",
        "technical.unrepeatable_sources",
        "define.services"
      ],
      severity: "attention",
      kind: "missing",
      title: "The sources that cannot be repeated have no backup capture",
      detail: "A performance or an interview happens once. A single microphone on a single track is one bad cable away from that moment not existing. A second microphone, a safety track at lower gain or a second recorder costs an input; losing the take costs the production.",
      fixHint: "Choose a backup capture for each unrepeatable source, and write down which sources those are.",
      needsLogic: true,
      logicIntent: "Fire when live_recording is among the stage 1 services, or the pathway is podcast or live, and every mic_choices row has mc_backup set to none or empty, and unrepeatable_sources is empty. Do not fire when mic_choices is empty."
    },
    {
      ruleId: "technical-click-no-cue",
      watches: [
        "technical.click_playback",
        "technical.cue_mixes",
        "technical.input_list"
      ],
      severity: "attention",
      kind: "missing",
      title: "A click or playback is needed and nobody can hear it, or nothing plays it",
      detail: "A click only works if the people who need it can hear it and it does not leak into the open microphones or the house. Playback only works if it has an input, a level and a person running it. Neither has been given a place in the plan.",
      fixHint: "Add the playback device as an input, and give each performer who needs the click a cue mix that carries it.",
      needsLogic: true,
      logicIntent: "Fire when click_playback is yes and either cue_mixes is empty, or no input_list row has in_capture playback. Do not fire when click_playback is no, unknown or empty."
    },
    {
      ruleId: "technical-cue-mix-no-output",
      watches: [
        "technical.cue_mixes",
        "schedule.monitor_mixes_available"
      ],
      severity: "attention",
      kind: "unrealistic",
      title: "More cue mixes promised than outputs to deliver them on",
      detail: "Each independent cue mix needs its own output from the console. When there are more promises than outputs, somebody shares a mix they were told was theirs, and they find out at soundcheck.",
      fixHint: "Reduce the number of independent mixes with the performers' agreement, mark rows as shared, or add outputs.",
      needsLogic: true,
      logicIntent: "Count cue_mixes rows whose cm_type is not shared or none, and fire when the count exceeds schedule.monitor_mixes_available. Do not fire when either is empty.",
      onlyFor: [
        "music",
        "live"
      ]
    },
    {
      ruleId: "technical-clock-unsettled",
      watches: [
        "technical.clock_master",
        "technical.recorder_count",
        "technical.device_rates_checked",
        "deliver.session_sample_rate"
      ],
      severity: "attention",
      kind: "mismatch",
      title: "The clock or sample rate is not settled",
      detail: "Several digital devices with no agreed clock produce clicks, dropouts or drift, and a device left at the wrong sample rate records at the wrong speed. Both are silent until playback.",
      fixHint: "Name the clock master, set every device to the session rate from stage 2, and confirm each one before the day.",
      needsLogic: true,
      logicIntent: "Fire when recorder_count is several_free; when recorder_count is several_clocked and clock_master is unknown or empty; or when deliver.session_sample_rate is set and device_rates_checked is no. Do not fire on a single recorder with device_rates_checked yes or empty.",
      learnMore: {
        route: "DigitalLab"
      }
    },
    {
      ruleId: "technical-timecode-no-plan",
      watches: [
        "deliver.timecode_required",
        "technical.timecode_plan"
      ],
      severity: "attention",
      kind: "missing",
      title: "Sync to picture is required and there is no sync plan",
      detail: "Stage 2 says a deliverable must line up with picture. Nothing here says who provides timecode, what frame rate the picture side has set, or how sync will be confirmed. Discovering that in the edit means re-syncing by hand.",
      fixHint: "Get the frame rate and timecode arrangement from the picture side, write it here, and test it before the day.",
      needsLogic: true,
      logicIntent: "Fire when deliver.timecode_required is yes and timecode_plan is empty."
    },
    {
      ruleId: "technical-space-not-assessed",
      watches: [
        "technical.space_assessed",
        "technical.acoustic_character",
        "schedule.production_date"
      ],
      severity: "attention",
      kind: "missing",
      title: "Nobody has stood in the room",
      detail: "The room decides microphone placement, monitoring and how much of the day is spent fighting noise. A plan built from photographs meets the real room at load-in, when the only remaining option is to cope.",
      fixHint: "Visit the space, or have the venue walk it with you on a call, and record what you heard.",
      needsLogic: true,
      logicIntent: "Fire when space_assessed is not_assessed, or when acoustic_character is unknown and space_assessed is not visited. Do not fire when space_assessed is empty.",
      learnMore: {
        route: "WaveLab"
      }
    },
    {
      ruleId: "technical-naming-not-convention",
      watches: [
        "technical.naming_convention"
      ],
      severity: "attention",
      kind: "unrealistic",
      title: "The naming convention is not a convention",
      detail: "Names like final, final2 and use this one are decisions deferred to whoever opens the folder next. A convention has fixed parts in a fixed order, so the right file can be found without asking.",
      fixHint: "Write the pattern: the elements every name contains, such as project, item, take and date, and their order.",
      needsLogic: true,
      logicIntent: "Fire when naming_convention contains words such as final, new, latest, use this or copy, or when it contains no separator or placeholder that suggests a repeating pattern. ccode picks the detection; nudge only."
    },
    {
      ruleId: "technical-storage-unestimated",
      watches: [
        "technical.storage_estimate",
        "technical.input_list",
        "deliver.session_sample_rate",
        "schedule.storage_available"
      ],
      severity: "info",
      kind: "missing",
      title: "The recording size has not been estimated",
      detail: "The channel count and the session format are known, so the size of the recording can be worked out now rather than discovered when the drive fills in the last hour. Stage 4 works the same figure out from the source count; entering it here records the number you actually plan for.",
      fixHint: "Work the size out from channels, sample rate, bit depth and hours, and enter it here.",
      needsLogic: true,
      logicIntent: "Fire when input_list has rows, deliver.session_sample_rate is set and not undecided, and storage_estimate is empty. Do not duplicate the arithmetic in schedule-storage-short; this rule only points at the gap.",
      learnMore: {
        route: "CalcLab"
      }
    },
    {
      ruleId: "technical-material-not-final",
      watches: [
        "technical.material_status",
        "technical.content_list",
        "technical.stage_plot",
        "schedule.production_date"
      ],
      severity: "attention",
      kind: "unrealistic",
      title: "The material is still changing close to the production date",
      detail: "An input list, a patch and a cue plan are built from the material. When the running order or the arrangements change after that, everything downstream has to change with them, and close to the day there is no time for it.",
      fixHint: "Agree a date after which the material is frozen, get the current version approved, and rebuild the plan from it.",
      needsLogic: true,
      logicIntent: "Fire when schedule.production_date is within a number of days ahead of today that ccode chooses, and material_status is draft or not_started, or stage_plot is none or draft on the live pathway, or a content_list row is idea or draft. Do not fire when production_date is empty."
    }
  ],
  activity: {
    activityId: "build-the-input-list",
    title: "Build the input list",
    prompt: "A five-piece band with a lead vocalist has sent a stage plot, and a first input list has been drafted from it by someone in a hurry. The console and recorder have sixteen channels. Fix the list so that every source is captured correctly, every stereo source has two channels, phantom is right on every row, the bass has a proper path to the console, and the whole thing fits the channels you actually have.",
    onlyFor: [
      "music",
      "live"
    ],
    seed: {
      "schedule.available_channels": 16,
      "schedule.available_inputs": 16,
      "technical.input_list": [
        {
          in_num: 1,
          in_source: "Kick",
          in_capture: "dynamic_mic",
          in_phantom: "off",
          in_channels: "1",
          in_connection: "xlr",
          in_stand: "Short boom",
          in_console: "1",
          in_track: "1",
          in_notes: ""
        },
        {
          in_num: 2,
          in_source: "Snare top",
          in_capture: "dynamic_mic",
          in_phantom: "off",
          in_channels: "1",
          in_connection: "xlr",
          in_stand: "Short boom",
          in_console: "2",
          in_track: "2",
          in_notes: ""
        },
        {
          in_num: 3,
          in_source: "Hi-hat",
          in_capture: "condenser_mic",
          in_phantom: "off",
          in_channels: "1",
          in_connection: "xlr",
          in_stand: "Short boom",
          in_console: "3",
          in_track: "3",
          in_notes: ""
        },
        {
          in_num: 4,
          in_source: "Overheads (pair)",
          in_capture: "condenser_mic",
          in_phantom: "on",
          in_channels: "2",
          in_connection: "xlr",
          in_stand: "Two tall booms",
          in_console: "4",
          in_track: "4",
          in_notes: ""
        },
        {
          in_num: 5,
          in_source: "Floor tom",
          in_capture: "dynamic_mic",
          in_phantom: "off",
          in_channels: "1",
          in_connection: "xlr",
          in_stand: "Clip",
          in_console: "5",
          in_track: "5",
          in_notes: ""
        },
        {
          in_num: 6,
          in_source: "Bass",
          in_capture: "line",
          in_phantom: "off",
          in_channels: "1",
          in_connection: "ts",
          in_stand: "",
          in_console: "6",
          in_track: "6",
          in_notes: "straight from the bass"
        },
        {
          in_num: 7,
          in_source: "Guitar amp",
          in_capture: "dynamic_mic",
          in_phantom: "off",
          in_channels: "1",
          in_connection: "xlr",
          in_stand: "Short boom",
          in_console: "7",
          in_track: "7",
          in_notes: ""
        },
        {
          in_num: 8,
          in_source: "Keys (stereo)",
          in_capture: "di",
          in_phantom: "off",
          in_channels: "1",
          in_connection: "xlr",
          in_stand: "",
          in_console: "8",
          in_track: "8",
          in_notes: ""
        },
        {
          in_num: 9,
          in_source: "Lead vocal",
          in_capture: "condenser_mic",
          in_phantom: "off",
          in_channels: "1",
          in_connection: "xlr",
          in_stand: "Tall boom",
          in_console: "9",
          in_track: "9",
          in_notes: ""
        },
        {
          in_num: 10,
          in_source: "Backing vocal 1",
          in_capture: "dynamic_mic",
          in_phantom: "off",
          in_channels: "1",
          in_connection: "xlr",
          in_stand: "Tall straight",
          in_console: "10",
          in_track: "10",
          in_notes: ""
        },
        {
          in_num: 11,
          in_source: "Backing vocal 2",
          in_capture: "dynamic_mic",
          in_phantom: "off",
          in_channels: "1",
          in_connection: "xlr",
          in_stand: "Tall straight",
          in_console: "11",
          in_track: "11",
          in_notes: ""
        },
        {
          in_num: 12,
          in_source: "Acoustic guitar pickup",
          in_capture: "line",
          in_phantom: "off",
          in_channels: "1",
          in_connection: "ts",
          in_stand: "",
          in_console: "12",
          in_track: "12",
          in_notes: ""
        },
        {
          in_num: 13,
          in_source: "Playback (stereo)",
          in_capture: "playback",
          in_phantom: "on",
          in_channels: "2",
          in_connection: "trs",
          in_stand: "",
          in_console: "13",
          in_track: "13",
          in_notes: ""
        },
        {
          in_num: 14,
          in_source: "Audience left",
          in_capture: "condenser_mic",
          in_phantom: "on",
          in_channels: "1",
          in_connection: "xlr",
          in_stand: "Tall boom",
          in_console: "14",
          in_track: "14",
          in_notes: ""
        },
        {
          in_num: 15,
          in_source: "Audience right",
          in_capture: "condenser_mic",
          in_phantom: "on",
          in_channels: "1",
          in_connection: "xlr",
          in_stand: "Tall boom",
          in_console: "15",
          in_track: "15",
          in_notes: ""
        },
        {
          in_num: 16,
          in_source: "Talkback",
          in_capture: "dynamic_mic",
          in_phantom: "off",
          in_channels: "1",
          in_connection: "xlr",
          in_stand: "Desk",
          in_console: "16",
          in_track: "",
          in_notes: ""
        },
        {
          in_num: 17,
          in_source: "Spare vocal",
          in_capture: "dynamic_mic",
          in_phantom: "off",
          in_channels: "1",
          in_connection: "xlr",
          in_stand: "",
          in_console: "",
          in_track: "",
          in_notes: ""
        }
      ],
      "technical.click_playback": "yes",
      "technical.cue_mixes": []
    },
    passWhen: "Every stereo source occupies two console channels and two recorder tracks; every condenser in this list has phantom on and no line or playback row has phantom on; the bass and the acoustic guitar pickup reach the console through a DI on an XLR or balanced connection; the summed channel count is no more than the sixteen available, achieved by removing, combining or deliberately monoing sources with the change noted; and at least one cue mix exists that carries the click.",
    debrief: "The first list looked complete. It had seventeen rows asking for nineteen channels on a sixteen-channel system, and four of the rows were quietly wrong in ways that would have cost the overheads, the keys, the hi-hat and the lead vocal. Notice that every fix was a decision, not a purchase: what to sum, what to drop, where the DI goes, who hears the click. The input list is the one document on a production that has to be exactly right, because everything downstream is patched from it and nobody re-checks it once the cables are in."
  }
};

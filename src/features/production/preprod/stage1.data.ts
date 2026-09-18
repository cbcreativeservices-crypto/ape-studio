/**
 * Pre-Production · Stage 1 — Define the Project.
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

export const STAGE1_DEFINE: StageDef = {
  stageId: "define",
  num: 1,
  title: "Define the Project",
  intro: "Before anything is booked or plugged in, write down what you are making and why. Everything later in this lab is checked against what you decide here.",
  whyItMatters: "Most productions that go wrong were never clearly defined. The budget, the schedule and the gear list can all be correct and the work still fails, because nobody agreed what finished looked like. A brief that fits on one page prevents more problems than any amount of equipment.",
  notices: [
    {
      kind: "legal",
      text: "Who owns the finished work, and who may approve it, are commercial questions settled in writing between you and your client. This lab teaches you to ask them early. It is not legal advice."
    }
  ],
  sections: [
    {
      sectionId: "brief",
      title: "Project Brief",
      intro: "Twelve answers that fit on one page. If you cannot answer one yet, that gap is the most useful thing on this screen.",
      fields: [
        {
          fieldId: "project_name",
          label: "Project name",
          kind: "text",
          help: "What everyone will call this in conversation, on files and on the call sheet. Pick it now and stop renaming it.",
          required: true
        },
        {
          fieldId: "project_lead",
          label: "Producer or project lead",
          kind: "text",
          help: "The one person who carries the project. Not a committee.",
          required: true
        },
        {
          fieldId: "client",
          label: "Client or organisation",
          kind: "text",
          help: "Who the work is for. Write 'self' if it is your own project, and mean it.",
          required: false
        },
        {
          fieldId: "purpose",
          label: "Why is it being created?",
          kind: "longText",
          help: "The reason this exists, not the thing you are making. A release, a pitch, a service, a fundraiser, a record of a performance.",
          required: true
        },
        {
          fieldId: "audience",
          label: "Who will experience it?",
          kind: "longText",
          help: "Be specific enough to change a decision. 'Existing fans on headphones' and 'a room of eight hundred people' lead to different work.",
          required: true
        },
        {
          fieldId: "creative_objective",
          label: "What should the audience understand or feel?",
          kind: "longText",
          help: "One sentence. This is the line you will come back to when two good options disagree.",
          required: true
        },
        {
          fieldId: "platform",
          label: "Where will it be presented?",
          kind: "multiChoice",
          help: "Choose every destination you already know about. Each one brings its own technical requirements later.",
          required: true,
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
          fieldId: "size_estimate",
          label: "Estimated project size",
          kind: "number",
          help: "How many separate pieces you owe at the end.",
          required: true,
          labelBy: {
            music: "How many songs?",
            podcast: "How many episodes?",
            live: "How many performances or sets?"
          },
          helpBy: {
            music: "Count the songs you owe finished, not the ones you hope to attempt.",
            podcast: "Count the episodes in this commitment, not the series you imagine.",
            live: "Count each performance, including any you must also record or stream."
          },
          unit: "items"
        },
        {
          fieldId: "target_date",
          label: "When must it be finished?",
          kind: "date",
          help: "The date it must be delivered or performed, not the date you hope to be done.",
          required: true
        },
        {
          fieldId: "approver",
          label: "Who approves the finished work?",
          kind: "text",
          help: "The person whose yes ends the project. If more than one name belongs here, you have a problem worth solving now rather than at delivery.",
          required: true
        },
        {
          fieldId: "constraints",
          label: "What limitations already exist?",
          kind: "longText",
          help: "Money, dates, rooms, people, equipment, permissions. The ones you already know about are the cheap ones.",
          required: false
        },
        {
          fieldId: "success_definition",
          label: "How will you know it succeeded?",
          kind: "longText",
          help: "Something you could actually check on delivery day. 'It sounds good' cannot be checked. 'Accepted by the client and live on the platform by the fourth' can.",
          required: true
        }
      ]
    },
    {
      sectionId: "scope",
      title: "Scope",
      intro: "What is in, what is out, and how much of it there is. Scope is the thing that quietly grows between the quote and the delivery, so write it down while it is still small.",
      notices: [
        {
          kind: "legal",
          text: "Who owns the session files and recordings, and who may keep or reuse them, is a term of your agreement with the client and varies by country and contract. Agree it in writing. This is not legal advice."
        }
      ],
      fields: [
        {
          fieldId: "services",
          label: "Which services are included?",
          kind: "multiChoice",
          help: "Select only what you are responsible for delivering. Anything not selected is somebody else's job, and they should know that.",
          required: true,
          options: [
            {
              value: "recording",
              label: "Recording or tracking"
            },
            {
              value: "editing",
              label: "Editing"
            },
            {
              value: "mixing",
              label: "Mixing"
            },
            {
              value: "mastering",
              label: "Mastering"
            },
            {
              value: "reinforcement",
              label: "Live sound reinforcement"
            },
            {
              value: "live_recording",
              label: "Multitrack recording of a live event"
            },
            {
              value: "livestream_feed",
              label: "Livestream or broadcast feed"
            },
            {
              value: "monitoring",
              label: "Stage monitoring"
            },
            {
              value: "delivery_prep",
              label: "Delivery preparation and file handling"
            },
            {
              value: "archiving",
              label: "Archiving"
            }
          ]
        },
        {
          fieldId: "out_of_scope",
          label: "What is explicitly not included?",
          kind: "longText",
          help: "Write the things the client might assume are included. 'Mastering is not included' saves a difficult conversation at delivery.",
          required: false
        },
        {
          fieldId: "performer_count",
          label: "How many performers or participants?",
          kind: "number",
          help: "People who will be recorded or amplified. Each one needs a microphone, a place to stand, monitoring and a schedule.",
          required: true,
          labelBy: {
            music: "How many performers?",
            podcast: "How many voices, including remote guests?",
            live: "How many performers on stage at the largest moment?"
          },
          helpBy: {
            music: "Count everyone who plays or sings on the record, including session players and guests.",
            podcast: "Count hosts and every guest, including anyone joining remotely. Remote voices need their own capture plan.",
            live: "Count the largest lineup that is on stage at once. That number, not the average, decides the input list."
          },
          unit: "people"
        },
        {
          fieldId: "source_count",
          label: "How many sources will be captured at once?",
          kind: "number",
          help: "Every microphone, DI, line input and playback source that must be captured or mixed at the same time. This number becomes your channel count.",
          required: {
            music: true,
            podcast: false,
            live: true
          },
          labelBy: {
            music: "Simultaneous sources to record",
            podcast: "Microphones and remote feeds",
            live: "Inputs from the stage"
          },
          helpBy: {
            music: "Count the largest simultaneous setup, such as a full band tracking together. Overdubs later do not add to this number.",
            podcast: "One microphone per voice in the room, plus each remote feed and any playback. Small numbers still need to be written down.",
            live: "Count every input on the stage plot for the largest act, including spares you intend to patch. This drives the console, the stage box and the recorder."
          },
          unit: "channels"
        },
        {
          fieldId: "location_count",
          label: "How many locations?",
          kind: "number",
          help: "Rooms, studios, venues or remote sites. Each extra location adds transport, setup, and a second chance for something to be left behind.",
          required: true,
          unit: "locations"
        },
        {
          fieldId: "location_type",
          label: "What kind of locations?",
          kind: "multiChoice",
          help: "Select everything that applies. Outdoor and remote locations bring their own planning in the schedule stage.",
          required: false,
          options: [
            {
              value: "commercial_studio",
              label: "Commercial studio"
            },
            {
              value: "project_studio",
              label: "Home or project studio"
            },
            {
              value: "remote_participant",
              label: "Participant records from their own location"
            },
            {
              value: "indoor_venue",
              label: "Indoor venue or hall"
            },
            {
              value: "outdoor",
              label: "Outdoor site"
            },
            {
              value: "on_location",
              label: "Other location, such as an office, church or rehearsal room"
            }
          ]
        },
        {
          fieldId: "format",
          label: "Channel format of the main deliverable",
          kind: "choice",
          help: "What you owe, not what you would like. An immersive delivery changes the capture, the mix room and the schedule; decide it here, not at mix.",
          required: true,
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
              value: "surround",
              label: "Surround"
            },
            {
              value: "immersive",
              label: "Immersive or object-based"
            },
            {
              value: "binaural",
              label: "Binaural"
            },
            {
              value: "undecided",
              label: "Not decided yet"
            }
          ]
        },
        {
          fieldId: "alternate_versions",
          label: "Alternate versions included",
          kind: "multiChoice",
          help: "Every version you owe beyond the main one. Each is a separate deliverable with its own approval, and it is priced whether or not you noticed.",
          required: false,
          options: [
            {
              value: "instrumental",
              label: "Instrumental"
            },
            {
              value: "clean",
              label: "Clean or edited-language version"
            },
            {
              value: "short_edit",
              label: "Radio edit or short version"
            },
            {
              value: "extended",
              label: "Extended version"
            },
            {
              value: "excerpts",
              label: "Social or promotional excerpts"
            },
            {
              value: "alt_language",
              label: "Alternate language version"
            },
            {
              value: "accessibility",
              label: "Transcript, captions or described version"
            },
            {
              value: "none",
              label: "None planned"
            }
          ]
        },
        {
          fieldId: "revisions_included",
          label: "Revision rounds included",
          kind: "number",
          help: "The number you agreed with the client, not the number you expect to need. If nothing is written down, the client's number is unlimited.",
          required: false,
          unit: "rounds"
        },
        {
          fieldId: "archive_plan",
          label: "Who keeps the session and project files afterwards?",
          kind: "choice",
          help: "Multitracks, project files and raw media outlive the delivery. Decide now who holds them, or the answer becomes whoever's drive they happen to be on.",
          required: false,
          options: [
            {
              value: "not_agreed",
              label: "Not agreed yet"
            },
            {
              value: "producer_keeps",
              label: "We keep them"
            },
            {
              value: "client_keeps",
              label: "The client receives and keeps them"
            },
            {
              value: "both",
              label: "Both keep a full copy"
            }
          ]
        },
        {
          fieldId: "archive_retention",
          label: "How long must they be kept?",
          kind: "duration",
          help: "The period you are committing to keep the files retrievable. Storage that nobody is paying for is storage that eventually disappears.",
          required: false,
          unit: "months"
        }
      ]
    },
    {
      sectionId: "creative",
      title: "Creative Direction",
      intro: "The sound you are aiming for, described precisely enough that a stranger could recognise it when they heard it. Vague direction here becomes a revision round later.",
      fields: [
        {
          fieldId: "style",
          label: "Style or format",
          kind: "text",
          help: "The shorthand a working engineer would understand. It sets expectations for everything below.",
          required: true,
          labelBy: {
            music: "Genre or style",
            podcast: "Format and style",
            live: "Type of show"
          },
          helpBy: {
            music: "Genre and sub-genre, and where it sits between raw and polished. 'Indie folk, sparse, mostly live takes' is enough to start.",
            podcast: "Interview, panel, narrative, solo, or a mix. Scripted or conversational. Each changes how it is recorded and edited.",
            live: "Concert, theatre, worship, corporate, festival stage, comedy. The show type sets the priorities for the mix and the schedule."
          }
        },
        {
          fieldId: "tone_mood",
          label: "Tone and mood",
          kind: "longText",
          help: "Warm, tense, playful, formal, raw, polished. Words are fine here as long as the references below back them up.",
          required: true
        },
        {
          fieldId: "energy",
          label: "Energy level",
          kind: "choice",
          help: "The overall intensity you are aiming for. If it changes across the piece, say so, and describe the shape in the field below.",
          required: false,
          options: [
            {
              value: "low",
              label: "Low and intimate"
            },
            {
              value: "moderate",
              label: "Moderate"
            },
            {
              value: "high",
              label: "High"
            },
            {
              value: "varies",
              label: "Changes across the piece"
            }
          ]
        },
        {
          fieldId: "emotional_arc",
          label: "Intended emotional response",
          kind: "longText",
          help: "What the listener should feel, and where. The one-line objective in the brief is the summary; this is the shape.",
          required: false
        },
        {
          fieldId: "references",
          label: "Reference productions",
          kind: "table",
          help: "A reference is only useful with a reason. Name what you are pointing at in it: the vocal sound, the balance, the space, the dynamics. 'Sounds like this' is not a reason.",
          required: false,
          columns: [
            {
              columnId: "ref_title",
              label: "Title",
              kind: "text"
            },
            {
              columnId: "ref_source",
              label: "Artist, show or producer",
              kind: "text"
            },
            {
              columnId: "ref_aspect",
              label: "What are you referencing?",
              kind: "multiChoice",
              options: [
                {
                  value: "vocal_sound",
                  label: "Vocal sound"
                },
                {
                  value: "instrument_balance",
                  label: "Instrument or voice balance"
                },
                {
                  value: "dynamics",
                  label: "Dynamics"
                },
                {
                  value: "spatial",
                  label: "Spatial presentation and stereo width"
                },
                {
                  value: "density",
                  label: "Production density"
                },
                {
                  value: "intimacy",
                  label: "Intimacy"
                },
                {
                  value: "ambience",
                  label: "Ambience and room sound"
                },
                {
                  value: "loudness",
                  label: "Loudness"
                },
                {
                  value: "emotional_character",
                  label: "Overall emotional character"
                },
                {
                  value: "pacing",
                  label: "Pacing and editing style"
                },
                {
                  value: "other",
                  label: "Something else, described in the note"
                }
              ]
            },
            {
              columnId: "ref_note",
              label: "Specifically",
              kind: "text"
            },
            {
              columnId: "ref_link",
              label: "Link or location",
              kind: "text"
            }
          ]
        },
        {
          fieldId: "reference_role",
          label: "How will the references be used?",
          kind: "choice",
          help: "Loose inspiration and a track the client will play side by side with your mix are different jobs. Find out which one you have.",
          required: false,
          options: [
            {
              value: "inspiration",
              label: "Loose inspiration"
            },
            {
              value: "benchmark",
              label: "A target to work towards"
            },
            {
              value: "direct_comparison",
              label: "The client will compare the result directly against them"
            }
          ]
        },
        {
          fieldId: "sonic_requirements",
          label: "Required sonic characteristics",
          kind: "longText",
          help: "Things that must be true of the finished sound. 'Real drums, no tuning on the lead vocal, the voice always in front of the music.'",
          required: false
        },
        {
          fieldId: "avoid",
          label: "Things to avoid",
          kind: "longText",
          help: "What the client or artist does not want to hear. These are often stronger opinions than the positive ones, and cheaper to learn now.",
          required: false
        },
        {
          fieldId: "artist_preferences",
          label: "Client or artist preferences",
          kind: "longText",
          help: "Working preferences that change the plan: tracking together or separately, headphones or wedges, number of takes, who is in the room.",
          required: false
        },
        {
          fieldId: "creative_lead",
          label: "Who has the creative final say in the room?",
          kind: "text",
          help: "The person who settles a creative disagreement on the day. This is often not the person who approves the finished work, and both should know that.",
          required: false
        }
      ]
    }
  ],
  rules: [
    {
      ruleId: "define-purpose-vague",
      watches: [
        "define.purpose",
        "define.creative_objective"
      ],
      severity: "attention",
      kind: "unrealistic",
      title: "The purpose does not say anything checkable",
      detail: "Words like professional, exciting, high quality and radio ready describe a feeling, not a target. Every person on the project will fill that gap with their own version, and the differences surface on the day you deliver.",
      fixHint: "Say what the work is for and what the audience should take from it. Keep the adjectives, but add something you could check.",
      needsLogic: true,
      logicIntent: "Flag when purpose or creative objective consists mainly of unspecific quality adjectives with no stated outcome, audience effect or use. ccode chooses the detection approach; treat this as a nudge, never a blocker."
    },
    {
      ruleId: "define-approver-missing",
      watches: [
        "define.approver"
      ],
      // DEMOTED from blocker 2026-09-17 (owner). Computer C flagged it in
      // NOTES 4: this fires on an EMPTY field, so a brand-new plan was blocked
      // before the user typed anything, and a blocker cannot be outscored.
      // The verdict is unaffected - readiness already refuses to call a project
      // ready while a required field is unanswered - so the only thing the
      // blocker added was alarm. Measured after the change: zero of the seven
      // blockers now fire on an untouched project, which is an invariant the
      // test suite pins.
      severity: "attention",
      kind: "missing",
      title: "Nobody can end this project",
      detail: "Without a named approver there is no moment when the work is finished. Revisions continue until someone runs out of money or patience, and which of those happens first is not planning.",
      fixHint: "Name the one person whose approval ends the project. If several people must agree, name who decides when they disagree."
    },
    {
      ruleId: "define-approver-ambiguous",
      watches: [
        "define.approver",
        "define.client"
      ],
      severity: "attention",
      kind: "conflict",
      title: "More than one person has the final yes",
      detail: "Two approvers means two sets of notes, and eventually two notes that contradict each other. The cost lands on whoever is holding the session when it happens.",
      fixHint: "Name one final approver. Everyone else reviews and advises.",
      needsLogic: true,
      logicIntent: "Flag when the approver field appears to name more than one person or a group rather than an individual. Nudge only."
    },
    {
      ruleId: "define-success-missing",
      watches: [
        "define.success_definition"
      ],
      severity: "attention",
      kind: "missing",
      title: "Success has not been defined",
      detail: "This is the question most often skipped and the one that decides whether the project ever feels finished. A definition you can check on the day protects you and the client equally.",
      fixHint: "Write one sentence you could hold up on delivery day and agree on."
    },
    {
      ruleId: "define-audience-missing",
      watches: [
        "define.audience"
      ],
      severity: "attention",
      kind: "missing",
      title: "No audience named",
      detail: "The audience decides the platform, the platform decides the technical requirements, and those decide a good deal of the gear list. Leaving it blank pushes guesswork into every later stage.",
      fixHint: "Describe who experiences this and how they will hear it."
    },
    {
      ruleId: "define-deadline-past",
      watches: [
        "define.target_date"
      ],
      severity: "blocker",
      kind: "conflict",
      title: "The completion date has already passed",
      detail: "Every schedule built from here would be planning backwards from a date that is gone.",
      fixHint: "Set the real delivery date, then build the schedule to meet it.",
      needsLogic: true,
      logicIntent: "Compare the target date against today. Blocker when it is in the past."
    },
    {
      ruleId: "define-platform-live-no-venue",
      watches: [
        "define.platform"
      ],
      severity: "attention",
      kind: "mismatch",
      title: "A live project with no live destination",
      detail: "The plan describes a performance, but no venue, livestream or broadcast destination is selected. Whichever is missing carries its own requirements, and they are usually the ones with deadlines attached.",
      fixHint: "Select every destination this performance reaches, including any recording or stream.",
      needsLogic: true,
      logicIntent: "On the live pathway, flag when no live-shaped destination is selected among venue, livestream, radio or television.",
      onlyFor: [
        "live"
      ]
    },
    {
      ruleId: "define-size-missing",
      watches: [
        "define.size_estimate"
      ],
      severity: "attention",
      kind: "missing",
      title: "The amount of work is unknown",
      detail: "Until the count exists, no schedule, budget or storage estimate in this lab can be checked against reality.",
      fixHint: "Enter how many finished pieces you owe."
    },
    {
      ruleId: "define-scope-outruns-resources",
      watches: [
        "define.size_estimate",
        "define.services",
        "define.performer_count",
        "define.source_count",
        "define.location_count",
        "define.alternate_versions",
        "define.target_date",
        "schedule.production_days",
        "schedule.hours_per_day",
        "schedule.budget_total",
        "schedule.crew_count",
        "schedule.available_channels"
      ],
      severity: "attention",
      kind: "unrealistic",
      title: "The scope is larger than the time, money, people or equipment behind it",
      detail: "The item count, the services included and the number of sources add up to a quantity of work. When that quantity does not fit the production days, the budget, the crew or the channel count, something is cut on the day, and it is chosen under pressure rather than on purpose.",
      fixHint: "Reduce the count, drop a service or an alternate version, add production days or people, or mark the surplus as a stretch goal that the client has agreed is optional.",
      needsLogic: true,
      logicIntent: "Estimate the work implied by the stage 1 scope: item count multiplied by the services selected, weighted by performer and source counts, location count and alternate versions. Compare it against the resources recorded in stage 4: production days and hours per day, total budget, crew count and available recording channels. Also compare the calendar distance between today and the target date against the services selected, since mixing and mastering need review time after tracking. Warn when the work exceeds the resources with no allowance for setup, changeovers, breaks and review. Do not fire until the stage 4 fields exist; when only the target date is known, use the calendar comparison alone. ccode chooses every threshold. Every comparison here is a judgement warning at this severity; the hard comparison of source count against available channels is a separate blocker in stage 4."
    },
    {
      ruleId: "define-reference-no-reason",
      watches: [
        "define.references"
      ],
      severity: "attention",
      kind: "missing",
      title: "A reference has been named without saying what it is for",
      detail: "A track or show on its own tells the mixer nothing they can act on. The client may mean the vocal sound, you may hear the drum balance, and the mastering engineer will match its loudness. Three people will chase three different things and none of them will be wrong.",
      fixHint: "For each reference, select at least one aspect you are pointing at, and add a short note saying specifically what to listen for.",
      needsLogic: true,
      logicIntent: "For every row of the references table that has a title or source, fire when the aspect column is empty. Fire once per offending row, or once with a count; ccode decides. Do not fire when the table is empty."
    },
    {
      ruleId: "define-services-missing",
      watches: [
        "define.services"
      ],
      severity: "attention",
      kind: "missing",
      title: "Nobody has said which services are included",
      detail: "The client will assume everything is included, and the quote was written assuming it was not. The gap between those two assumptions is the argument at delivery.",
      fixHint: "Select every service you are responsible for. Then write what is excluded, in words the client will read."
    },
    {
      ruleId: "define-livestream-not-in-scope",
      watches: [
        "define.platform",
        "define.services"
      ],
      severity: "attention",
      kind: "mismatch",
      title: "A livestream destination with no livestream feed in scope",
      detail: "Livestream is selected as a destination, but neither a livestream feed nor a live recording is among the included services. A stream needs its own mix, its own output and usually its own person, and none of that is in the plan yet.",
      fixHint: "Add the livestream feed to the included services, or record in the exclusions that someone else is providing the stream mix and say who.",
      needsLogic: true,
      logicIntent: "Fire when the platform selection includes livestream and the services selection includes neither livestream_feed nor live_recording. Do not fire when out_of_scope text mentions the stream being handled by another party; ccode decides whether to attempt that text check or leave it as a simple selection comparison."
    },
    {
      ruleId: "define-sources-unknown",
      watches: [
        "define.source_count"
      ],
      severity: "attention",
      kind: "missing",
      title: "The number of sources is unknown",
      detail: "The source count decides the console, the stage box, the recorder, the cable count and how many people it takes to set up. Every one of those is booked from this number, so leaving it blank means booking blind.",
      fixHint: "Count every microphone, DI, line and playback source in the largest simultaneous setup, and enter the total.",
      onlyFor: [
        "music",
        "live"
      ]
    },
    {
      ruleId: "define-revisions-unstated",
      watches: [
        "define.revisions_included"
      ],
      severity: "attention",
      kind: "missing",
      title: "The number of revision rounds is not written down",
      detail: "When nothing is agreed, the client's number is unlimited and yours is whatever you can afford. Every round after the one you priced is paid for by the next project's start date.",
      fixHint: "Enter the number of rounds agreed with the client. If it has not been agreed, that is the conversation to have before the first session."
    },
    {
      ruleId: "define-archive-unagreed",
      watches: [
        "define.archive_plan"
      ],
      severity: "info",
      kind: "missing",
      title: "Nobody has agreed who keeps the files afterwards",
      detail: "Multitracks and project files are asked for months or years later, for a remix, a licence or a re-release. If nobody agreed to keep them, they are on a drive that has since been reused.",
      fixHint: "Agree who holds the session files and for how long, and write it into the scope.",
      needsLogic: true,
      logicIntent: "Fire when archive_plan is empty or set to not_agreed."
    }
  ],
  activity: {
    activityId: "repair-the-brief",
    title: "Repair the vague brief",
    prompt: "A client has sent one sentence and expects a quote. Turn it into something a production can actually be built from. Fill in what is missing, rewrite what says nothing, and decide what is in scope before you price it.",
    seed: {
      "define.project_name": "Untitled",
      "define.purpose": "We want it to sound professional, exciting, and really good.",
      "define.client": "Northgate Music Collective",
      "define.audience": "",
      "define.creative_objective": "",
      "define.platform": [],
      "define.approver": "",
      "define.success_definition": "",
      "define.target_date": "",
      "define.services": [],
      "define.revisions_included": ""
    },
    passWhen: "The purpose names a real use rather than only adjectives; an audience and at least one platform are chosen; a single approver is named; at least one service is selected and a revision count is entered; and the definition of success is something that could be checked on delivery day.",
    debrief: "Nothing in that original sentence was wrong. It was simply unusable, and it is close to what most real briefs look like when they arrive. The skill is not rejecting the vague brief but converting it, in one conversation, before a quote is given. Notice that the questions you needed answering were mostly not technical. The gear list follows from these answers; it cannot replace them."
  }
};

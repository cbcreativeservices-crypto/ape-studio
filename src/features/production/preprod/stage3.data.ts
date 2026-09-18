/**
 * Pre-Production · Stage 3 — People and Responsibilities.
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

export const STAGE3_PEOPLE: StageDef = {
  stageId: "people",
  num: 3,
  title: "People and Responsibilities",
  intro: "Name who is doing what, who may say yes to what, and how everyone reaches each other. A plan with the right equipment and the wrong people, or the right people and no agreed authority, fails on the day.",
  whyItMatters: "On most productions that go wrong, every task was somebody's job in principle and nobody's job in practice. The drives went home in whichever bag was nearest, two people gave the artist opposite instructions, and the one thing that needed a licensed person was done by whoever was standing there. Naming people is how the plan becomes something that can be executed.",
  notices: [
    {
      kind: "qualified",
      text: "Rigging, temporary electrical distribution and structural loading are the work of licensed or certified people, and the requirement is set by the country, the venue, the union and the insurer, not by this lab. Completing the Academy's training does not qualify anyone to do that work or to sign it off."
    },
    {
      kind: "legal",
      text: "Releases, permissions, consent for minors and employment arrangements vary by country, union, venue and production type. This lab teaches you what to ask for and when to ask. It is not legal advice."
    }
  ],
  sections: [
    {
      sectionId: "team",
      title: "Team",
      intro: "The roles this production needs and the people filling them. Where a role requires a licence or certification beyond this app, the field says so; treat that as a requirement to check, not a formality.",
      notices: [
        {
          kind: "qualified",
          text: "Where a role below is marked as licensed or certified work, confirm the person's qualification with the venue or authority before the day. A qualified person must approve rigging, electrical distribution and anything that bears load, and wireless systems may need a spectrum licence where you are."
        }
      ],
      fields: [
        {
          fieldId: "engineer_primary",
          label: "Lead engineer",
          kind: "text",
          help: "The person responsible for the sound on the day. Name one; if two people share it, say who has the last word.",
          required: true,
          labelBy: {
            music: "Recording engineer",
            podcast: "Recording engineer or technical producer",
            live: "Front-of-house engineer"
          },
          helpBy: {
            music: "Runs the session, owns the signal path and the session files. If the producer also engineers, write their name here too so it is explicit.",
            podcast: "Owns the capture: microphones, remote feeds, levels and the recording itself. On small shows this is the host; write that down rather than leaving it blank.",
            live: "Mixes what the audience hears and is responsible for the system's output on the day. One name."
          }
        },
        {
          fieldId: "engineer_second",
          label: "Second engineer or assistant",
          kind: "text",
          help: "Sets up, patches, labels, and catches what the lead engineer cannot see. On a large session or show, this is not optional.",
          required: false
        },
        {
          fieldId: "monitor_engineer",
          label: "Monitor engineer",
          kind: "text",
          help: "Mixes what the performers hear. If the front-of-house engineer is also mixing monitors, write their name here so the load is visible.",
          required: false,
          onlyFor: [
            "live"
          ]
        },
        {
          fieldId: "system_tech",
          label: "System technician",
          kind: "text",
          help: "Deploys, aligns and tests the loudspeaker system and connects it to the power the venue or electrician provides. On smaller shows this is the FOH engineer; say so.",
          required: false,
          onlyFor: [
            "live"
          ]
        },
        {
          fieldId: "stage_manager",
          label: "Stage manager",
          kind: "text",
          help: "Runs the stage: calls the changeovers, keeps the running order, and is the one voice performers listen to. Without one, the engineer ends up doing it from the mix position.",
          required: false,
          onlyFor: [
            "live"
          ]
        },
        {
          fieldId: "wireless_channels",
          label: "How many wireless channels?",
          kind: "number",
          help: "Every wireless microphone, in-ear transmitter and wireless instrument pack. Above a handful, someone has to coordinate the frequencies.",
          required: false,
          unit: "channels"
        },
        {
          fieldId: "rf_coordinator",
          label: "RF coordinator",
          kind: "text",
          help: "Plans and assigns the wireless frequencies. Depending on the country and frequency band, operating wireless microphones and in-ears may need a spectrum licence; the coordinator finds out which applies.",
          required: false
        },
        {
          fieldId: "rigging_required",
          label: "Is anything flown or rigged?",
          kind: "choice",
          help: "Loudspeakers, lighting, truss, screens or anything else hung above people. If yes, a certified rigger must design and sign off the rigging. This lab does not qualify anyone to rig.",
          required: {
            music: false,
            podcast: false,
            live: true
          },
          onlyFor: [
            "live"
          ],
          options: [
            {
              value: "no",
              label: "No, everything is ground-stacked or on stands"
            },
            {
              value: "yes",
              label: "Yes"
            },
            {
              value: "unknown",
              label: "Not known yet"
            }
          ]
        },
        {
          fieldId: "rigger",
          label: "Certified rigger",
          kind: "text",
          help: "Rigging is certified work: venues, unions and insurers require a recognised certification and state which they accept. Name the qualified person and confirm it before the day. This app does not qualify anyone to rig.",
          required: false,
          onlyFor: [
            "live"
          ]
        },
        {
          fieldId: "power_source",
          label: "How is the audio system powered?",
          kind: "choice",
          help: "Existing wall outlets are one thing. Tying into a building's supply, running temporary distribution or connecting a generator through distribution is licensed electrical work.",
          required: {
            music: false,
            podcast: false,
            live: true
          },
          options: [
            {
              value: "existing_outlets",
              label: "Existing wall outlets only"
            },
            {
              value: "house_distro",
              label: "Venue-provided distribution connected by venue staff"
            },
            {
              value: "temporary_distro",
              label: "Temporary distribution or a tie-in to building power"
            },
            {
              value: "generator_distro",
              label: "Generator feeding temporary distribution"
            },
            {
              value: "generator_direct",
              label: "Small portable generator with equipment plugged directly into its outlets"
            },
            {
              value: "unknown",
              label: "Not known yet"
            }
          ]
        },
        {
          fieldId: "electrician",
          label: "Licensed electrician or certified entertainment electrician",
          kind: "text",
          help: "Tie-ins, temporary distribution and generators must be connected and signed off by a licensed or certified electrician, as your country, venue and insurer require. This training does not qualify anyone to do it.",
          required: false
        },
        {
          fieldId: "stream_operator",
          label: "Livestream or broadcast operator",
          kind: "text",
          help: "Runs the stream mix, the encoder and the connection to the platform, and watches the output for the whole show. A broadcaster's own engineers and standards apply once the feed enters their chain.",
          required: false
        },
        {
          fieldId: "media_manager",
          label: "Who is responsible for the recorded media?",
          kind: "text",
          help: "The person who verifies the files, makes the backup, and carries the drives home. Not 'the engineer' in general; a name.",
          required: true
        },
        {
          fieldId: "editor",
          label: "Editor",
          kind: "text",
          help: "Assembles and cleans the recording after the session. Often the same person as the engineer on small productions; write the name either way.",
          required: false,
          onlyFor: [
            "music",
            "podcast"
          ]
        },
        {
          fieldId: "mix_engineer",
          label: "Mix engineer",
          kind: "text",
          help: "Only if mixing is in scope. Leave blank if the client is taking the tracks elsewhere, and make sure the scope says so.",
          required: false,
          onlyFor: [
            "music",
            "podcast"
          ]
        },
        {
          fieldId: "mastering_engineer",
          label: "Mastering engineer",
          kind: "text",
          help: "Only if mastering is in scope. If it is, they need the destination specifications from stage 2 before they start.",
          required: false,
          onlyFor: [
            "music",
            "podcast"
          ]
        },
        {
          fieldId: "safety_lead",
          label: "Who is responsible for safety on the day?",
          kind: "text",
          help: "The named person who can stop the show or the session. Venues, festivals and some insurers require this role to hold specific training; find out what applies at your venue.",
          required: {
            music: false,
            podcast: false,
            live: true
          }
        },
        {
          fieldId: "crew_other",
          label: "Other crew and roles",
          kind: "table",
          help: "Everyone else: runners, loaders, camera, lighting, first aid, security, drivers. Mark any role that needs a licence or certification, and whether you have seen it.",
          required: false,
          columns: [
            {
              columnId: "crew_role",
              label: "Role",
              kind: "text"
            },
            {
              columnId: "crew_name",
              label: "Name",
              kind: "text"
            },
            {
              columnId: "crew_status",
              label: "Status",
              kind: "choice",
              options: [
                {
                  value: "confirmed",
                  label: "Confirmed"
                },
                {
                  value: "tentative",
                  label: "Tentative"
                },
                {
                  value: "unfilled",
                  label: "Unfilled"
                }
              ]
            },
            {
              columnId: "crew_contact",
              label: "Contact",
              kind: "text"
            },
            {
              columnId: "crew_certification",
              label: "Licence or certification required?",
              kind: "choice",
              options: [
                {
                  value: "not_required",
                  label: "Not required"
                },
                {
                  value: "required_verified",
                  label: "Required and verified"
                },
                {
                  value: "required_unverified",
                  label: "Required, not yet verified"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      sectionId: "responsibilities",
      title: "Responsibility Assignment",
      intro: "One responsible person per task. Collaborators help; the responsible person answers for it. A task with two owners has none.",
      notices: [
        {
          kind: "qualified",
          text: "A task that involves rigging, electrical distribution or structural loading can only be assigned to a person who holds the licence or certification the venue and authority require. Assigning it here does not make anyone qualified to do it."
        }
      ],
      fields: [
        {
          fieldId: "task_matrix",
          label: "Tasks and owners",
          kind: "table",
          help: "Every task between now and delivery that someone could forget. Put exactly one name in the responsible column.",
          required: true,
          columns: [
            {
              columnId: "task_name",
              label: "Task",
              kind: "text"
            },
            {
              columnId: "task_responsible",
              label: "Responsible (one name)",
              kind: "text"
            },
            {
              columnId: "task_collaborators",
              label: "Collaborators",
              kind: "text"
            },
            {
              columnId: "task_approver",
              label: "Approves it done",
              kind: "text"
            },
            {
              columnId: "task_due",
              label: "Due",
              kind: "date"
            },
            {
              columnId: "task_status",
              label: "Status",
              kind: "choice",
              options: [
                {
                  value: "not_started",
                  label: "Not started"
                },
                {
                  value: "in_progress",
                  label: "In progress"
                },
                {
                  value: "blocked",
                  label: "Blocked"
                },
                {
                  value: "done",
                  label: "Done"
                }
              ]
            }
          ]
        },
        {
          fieldId: "handover_notes",
          label: "Handovers between people",
          kind: "longText",
          help: "Where one person's task ends and another's begins: recorder to editor, editor to mixer, mixer to mastering, stage to stream. Say what is handed over and how.",
          required: false
        }
      ]
    },
    {
      sectionId: "communication",
      title: "Communication Plan",
      intro: "How information moves, and who may say yes to money and time. Decide the channels before the first message is sent in the wrong one.",
      fields: [
        {
          fieldId: "primary_contact",
          label: "Primary contact for the production",
          kind: "text",
          help: "The one person the client, the venue and the crew call first. Name and the best way to reach them.",
          required: true
        },
        {
          fieldId: "emergency_contact",
          label: "Emergency contact on the day",
          kind: "text",
          help: "Who is called when something goes wrong during the session or show, and how. This is not the same person as the primary contact if the primary contact is mixing.",
          required: {
            music: false,
            podcast: false,
            live: true
          }
        },
        {
          fieldId: "contact_methods",
          label: "How the team communicates before the day",
          kind: "multiChoice",
          help: "Pick the channels and tell everyone. Decisions made in a channel half the team is not in are decisions half the team does not know about.",
          required: false,
          options: [
            {
              value: "email",
              label: "Email"
            },
            {
              value: "phone",
              label: "Phone calls"
            },
            {
              value: "text",
              label: "Text messages"
            },
            {
              value: "group_chat",
              label: "Group messaging app"
            },
            {
              value: "shared_doc",
              label: "Shared document or project board"
            }
          ]
        },
        {
          fieldId: "on_day_comms",
          label: "How the crew communicates on the day",
          kind: "choice",
          help: "Once the show or session is running, phones are not a communication system. Decide what is.",
          required: false,
          onlyFor: [
            "live"
          ],
          options: [
            {
              value: "radios",
              label: "Two-way radios"
            },
            {
              value: "intercom",
              label: "Wired or wireless intercom"
            },
            {
              value: "phones",
              label: "Phones and messaging"
            },
            {
              value: "in_person",
              label: "In person only"
            },
            {
              value: "undecided",
              label: "Not decided"
            }
          ]
        },
        {
          fieldId: "meeting_schedule",
          label: "Meeting schedule",
          kind: "longText",
          help: "When the team meets between now and the day, and the one meeting that must not be skipped: the technical walk-through before the production date.",
          required: false
        },
        {
          fieldId: "file_location",
          label: "Where files and documents live",
          kind: "text",
          help: "One shared location for the input list, stage plot, schedule, releases and session notes. Not an email thread.",
          required: true
        },
        {
          fieldId: "notes_flow",
          label: "How production notes travel",
          kind: "longText",
          help: "Who writes the session or show notes, where they go, and who reads them before the next step. Take names, edits, problems and decisions all belong here.",
          required: false
        },
        {
          fieldId: "change_process",
          label: "How a change is requested and agreed",
          kind: "longText",
          help: "A song added, a guest dropped, a venue changed. Who asks, who is told, who decides, and where the decision is written down.",
          required: false
        },
        {
          fieldId: "cost_approver",
          label: "Who may approve extra cost?",
          kind: "text",
          help: "One name. The person who can say yes to a second day, an extra hire or a rush fee, and who is accountable for it afterwards.",
          required: true
        },
        {
          fieldId: "schedule_approver",
          label: "Who may approve a schedule change?",
          kind: "text",
          help: "One name. Moving a date affects the venue, the crew, the talent and the delivery; one person should hold that decision.",
          required: true
        }
      ]
    },
    {
      sectionId: "talent",
      title: "Talent and Participants",
      intro: "Everyone who will be recorded or amplified, what they need to perform, and whether you have their permission to use the result.",
      notices: [
        {
          kind: "legal",
          text: "Recording or broadcasting a person's performance or voice generally requires their permission, and you want it in writing. A minor's participation requires consent from a parent or guardian and, in some places, a permit or supervision arrangement. The requirements vary by country, union and production type. Find the ones that apply to you. This is not legal advice."
        },
        {
          kind: "safety",
          text: "Stage and monitoring levels are a hearing hazard for performers and crew, and workplace noise limits vary by country. Plan monitoring so that people can hear themselves without being harmed, and know what your local rules require."
        }
      ],
      fields: [
        {
          fieldId: "participants",
          label: "Performers and participants",
          kind: "table",
          help: "One row per person. The columns you cannot fill in are the questions to ask them this week.",
          required: true,
          columns: [
            {
              columnId: "p_name",
              label: "Name",
              kind: "text"
            },
            {
              columnId: "p_role",
              label: "Instrument, voice or speaking role",
              kind: "text"
            },
            {
              columnId: "p_contact",
              label: "Contact",
              kind: "text"
            },
            {
              columnId: "p_availability",
              label: "Availability",
              kind: "text"
            },
            {
              columnId: "p_arrival",
              label: "Arrival time",
              kind: "text"
            },
            {
              columnId: "p_rehearsal",
              label: "Rehearsal or soundcheck time",
              kind: "text"
            },
            {
              columnId: "p_accessibility",
              label: "Accessibility needs",
              kind: "text"
            },
            {
              columnId: "p_monitoring",
              label: "Monitoring needs",
              kind: "text"
            },
            {
              columnId: "p_playback",
              label: "Playback or click needs",
              kind: "text"
            },
            {
              columnId: "p_equipment",
              label: "Special equipment",
              kind: "text"
            },
            {
              columnId: "p_minor",
              label: "A minor where you are working?",
              kind: "choice",
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
                  label: "Not known"
                }
              ]
            },
            {
              columnId: "p_release",
              label: "Release",
              kind: "status"
            }
          ]
        },
        {
          fieldId: "release_arrangement",
          label: "Which release is used and who holds the signed copies?",
          kind: "longText",
          help: "Name the form, who prepared it, and where the signed copies are kept. A release nobody can find is a release nobody has.",
          required: false
        },
        {
          fieldId: "minors_arrangement",
          label: "If any participant is a minor, what consent and supervision is arranged?",
          kind: "longText",
          help: "Who signed the consent, who is the responsible adult on the day, and any working-hours or permit requirement that applies where you are. The age that counts is the one where you are working.",
          required: false
        },
        {
          fieldId: "remote_participants",
          label: "Remote participants and how they are captured",
          kind: "longText",
          help: "For each person not in the room: what they record on, who checks their setup beforehand, and how their audio reaches you.",
          required: false,
          onlyFor: [
            "podcast",
            "music"
          ]
        }
      ]
    }
  ],
  rules: [
    {
      ruleId: "people-task-no-owner",
      watches: [
        "people.task_matrix"
      ],
      severity: "attention",
      kind: "missing",
      title: "A task has no responsible person",
      detail: "A task with no owner is done by nobody, and it is usually the one that seemed too obvious to assign: collecting the releases, confirming the venue's power, verifying the files before leaving. Each one is discovered missing at the moment it was needed.",
      fixHint: "Put exactly one name in the responsible column of every task. If nobody is available, that is a staffing gap to solve now.",
      needsLogic: true,
      logicIntent: "Fire for each task_matrix row where task_responsible is empty. Once per row or once with a count; ccode decides."
    },
    {
      ruleId: "people-duplicate-authority",
      watches: [
        "people.task_matrix",
        "people.cost_approver",
        "people.schedule_approver"
      ],
      severity: "attention",
      kind: "conflict",
      title: "Two people hold the same authority",
      detail: "When two people can both approve the same thing, one of them eventually says yes to something the other refused, and the crew has already acted on the first answer. Authority that is shared is authority that is contested.",
      fixHint: "One name per approval. The second person can be consulted, but only one decides.",
      needsLogic: true,
      logicIntent: "Fire when cost_approver or schedule_approver appears to contain more than one name, or when any task_matrix row's task_responsible or task_approver appears to contain more than one name. Detect names separated by 'and', commas, ampersands or slashes; nudge only."
    },
    {
      ruleId: "people-overload",
      watches: [
        "people.task_matrix",
        "people.engineer_primary",
        "people.monitor_engineer",
        "people.system_tech",
        "people.stage_manager",
        "people.stream_operator",
        "people.media_manager",
        "people.rf_coordinator",
        "people.safety_lead"
      ],
      severity: "attention",
      kind: "unrealistic",
      title: "One person is carrying too much",
      detail: "The same name in most of the responsible column, or in two roles that run at the same moment on the day, is a plan that works only while nothing goes wrong. The first fault takes that person away from everything else they were holding.",
      fixHint: "Spread the tasks, or add a person. On the day, no one should hold two roles that are needed at the same time.",
      needsLogic: true,
      logicIntent: "Two checks. First, fire when one name holds a disproportionate share of task_matrix rows relative to the number of distinct names; ccode picks the proportion. Second, fire when the same name appears in more than one of the on-day roles that run simultaneously during a show or session: lead engineer, monitor engineer, system technician, stage manager, stream operator and safety lead. Monitor engineer, system technician and stage manager exist only on the live pathway, so on music and podcast the second check has fewer inputs. Media manager and RF coordinator may overlap with other roles without firing, since their work is mostly before and after the performance."
    },
    {
      ruleId: "people-media-manager-missing",
      watches: [
        "people.media_manager"
      ],
      severity: "attention",
      kind: "missing",
      title: "Nobody has been named to carry the media home",
      detail: "At the end of the night the only copy of the recording is on a drive, and the drive is in whichever bag was nearest. If nobody was named, nobody verified the files, nobody made the backup, and nobody knows where it is in the morning.",
      fixHint: "Name the one person responsible for verifying, backing up and transporting the recorded media."
    },
    {
      ruleId: "people-wireless-no-coordinator",
      watches: [
        "people.wireless_channels",
        "people.rf_coordinator"
      ],
      severity: "attention",
      kind: "missing",
      title: "Wireless channels with nobody coordinating them",
      detail: "Wireless systems that were not planned together interfere with each other and with whatever else is on the air at the venue, and the failure is heard by the audience. Depending on the country and the band, operating them may also need a licence that someone has to hold.",
      fixHint: "Name an RF coordinator, even if it is the engineer, and have them plan the frequencies and check the licensing that applies where you are.",
      needsLogic: true,
      logicIntent: "Fire when wireless_channels is greater than zero and rf_coordinator is empty."
    },
    {
      ruleId: "people-rigging-no-rigger",
      watches: [
        "people.rigging_required",
        "people.rigger"
      ],
      severity: "blocker",
      kind: "unsafe",
      title: "Something is being flown and no certified rigger is named",
      detail: "Anything hung above people is a structural load, and a failure can kill. Rigging is certified work that venues, unions and insurers require a recognised certification for, and no amount of audio experience substitutes for it. This plan should not proceed until a qualified person owns the rigging.",
      fixHint: "Name a certified rigger, confirm their certification with the venue or authority, and have them design and sign off everything that is flown.",
      needsLogic: true,
      logicIntent: "Fire when rigging_required is yes and rigger is empty. The unknown case is handled by people-hazards-unknown.",
      onlyFor: [
        "live"
      ]
    },
    {
      ruleId: "people-power-no-electrician",
      watches: [
        "people.power_source",
        "people.electrician"
      ],
      severity: "blocker",
      kind: "unsafe",
      title: "Temporary power with no licensed electrician",
      detail: "Tie-ins, temporary distribution and generators feeding distribution are licensed electrical work, and a mistake is a fire or an electrocution. The venue and the insurer will require a qualified person to make and sign off the connection. An audio technician is not that person unless they also hold the licence.",
      fixHint: "Name the licensed electrician or certified entertainment electrician responsible for the power, or change the power source to venue-provided distribution connected by venue staff.",
      needsLogic: true,
      logicIntent: "Fire when power_source is temporary_distro or generator_distro and electrician is empty. Do not fire for existing_outlets, house_distro or generator_direct. The unknown case is handled by people-hazards-unknown."
    },
    {
      ruleId: "people-stream-no-operator",
      watches: [
        "define.services",
        "define.platform",
        "people.stream_operator"
      ],
      severity: "attention",
      kind: "missing",
      title: "A livestream is in the plan but nobody is running it",
      detail: "A stream needs someone watching the encoder, the connection and the output for the whole show. If that is the FOH engineer, the stream is unwatched from the first song, and stream failures are silent from the room.",
      fixHint: "Name a stream operator whose only job during the show is the stream.",
      needsLogic: true,
      logicIntent: "Fire when livestream_feed is among the stage 1 services, or livestream is among the stage 1 platforms, and stream_operator is empty."
    },
    {
      ruleId: "people-approval-vague",
      watches: [
        "people.cost_approver",
        "people.schedule_approver"
      ],
      severity: "attention",
      kind: "missing",
      title: "Nobody may say yes to extra cost or a schedule change",
      detail: "Both will be asked for. Without a named person, the answer comes from whoever is nearest, and the invoice or the missed date is argued about afterwards.",
      fixHint: "Name one person for cost and one for schedule. They may be the same person.",
      needsLogic: true,
      logicIntent: "Fire when cost_approver or schedule_approver is empty."
    },
    {
      ruleId: "people-release-missing",
      watches: [
        "people.participants",
        "people.release_arrangement"
      ],
      severity: "attention",
      kind: "legal",
      title: "A participant's release is not in hand",
      detail: "A recording of someone who has not agreed in writing to be recorded and published is a recording you may not be able to use. This is discovered at delivery, after their performance is mixed into everything else. Requirements vary by country and union; the release you need is the one that applies where you are.",
      fixHint: "Get a signed release from every participant before the session or show, and record who holds the copies.",
      needsLogic: true,
      logicIntent: "Fire for each participants row whose p_release is Missing, Pending, Requested or Expired. Do not fire on Approved, Not required or Restricted; a restricted release is in hand and needs reading, which is the user's job."
    },
    {
      ruleId: "people-minor-no-consent",
      watches: [
        "people.participants",
        "people.minors_arrangement"
      ],
      severity: "blocker",
      kind: "legal",
      title: "A participant is a minor and no consent or supervision is recorded",
      detail: "Recording or presenting a minor without documented consent from a parent or guardian, and without the supervision or permits that apply where you are, is not a risk to manage on the day. It is a reason the production cannot proceed until it is resolved.",
      fixHint: "Record who gave consent, who is the responsible adult on the day, and any permit or working-hours rule that applies. If you do not know what applies, find out before the date.",
      needsLogic: true,
      logicIntent: "Fire when any participants row has p_minor set to yes and minors_arrangement is empty. The unknown case is handled by people-hazards-unknown."
    },
    {
      ruleId: "people-emergency-contact-missing",
      watches: [
        "people.emergency_contact",
        "people.safety_lead"
      ],
      severity: "attention",
      kind: "unsafe",
      title: "No emergency contact or safety lead for the day",
      detail: "When someone is hurt or something fails, the question is who to call and who can stop the show. If the answer is being worked out at that moment, it is being worked out too late.",
      fixHint: "Name the emergency contact and the person responsible for safety, and put both on the call sheet.",
      needsLogic: true,
      logicIntent: "Fire when emergency_contact is empty on any pathway. Fire additionally when safety_lead is empty on the live pathway."
    },
    {
      ruleId: "people-monitor-role-missing",
      watches: [
        "define.services",
        "people.monitor_engineer",
        "people.engineer_primary"
      ],
      severity: "attention",
      kind: "missing",
      title: "Monitoring is in scope but nobody is mixing it",
      detail: "Stage monitoring is a separate mix with a separate audience, and the performers are the audience that can stop the show. If the FOH engineer is also mixing monitors, the plan should say so, and it should be a decision rather than a default.",
      fixHint: "Name the monitor engineer. If the FOH engineer is doing both, write their name in both fields so the load is visible.",
      needsLogic: true,
      logicIntent: "Fire when monitoring is among the stage 1 services and monitor_engineer is empty.",
      onlyFor: [
        "live"
      ]
    },
    {
      ruleId: "people-hazards-unknown",
      watches: [
        "people.rigging_required",
        "people.power_source",
        "people.participants"
      ],
      severity: "attention",
      kind: "missing",
      title: "A safety or legal question is still unanswered",
      detail: "Whether anything is flown, how the system is powered, and whether any participant is a minor each decide whether a licensed person or a consent has to be in place. Not knowing is not the same as not needing one, and the answer takes longer to act on than to find.",
      fixHint: "Ask the venue about rigging and power, ask the participants about age, and record the answers. If any answer is yes, name the qualified person or the consent arrangement.",
      needsLogic: true,
      logicIntent: "Fire when rigging_required is unknown, when power_source is unknown, or when any participants row has p_minor set to unknown. Once per unanswered question or once with a list; ccode decides. The yes cases are separate blockers."
    },
    {
      ruleId: "people-stage-manager-missing",
      watches: [
        "people.stage_manager"
      ],
      severity: "attention",
      kind: "missing",
      title: "No stage manager on a live show",
      detail: "Without a stage manager, changeovers are run from the mix position by someone who cannot leave it, and the performers take instructions from whoever speaks loudest. The schedule slips one act at a time.",
      fixHint: "Name a stage manager. On a small show it can be someone with another role before doors, but during the show it is their only job.",
      onlyFor: [
        "live"
      ]
    }
  ],
  activity: {
    activityId: "who-owns-this-task",
    // The ONE edit to C's authored content. C flagged this in NOTES 2.4 and
    // 6.5: this exercise is a recorded live show and seeds monitor_engineer and
    // stage_manager, which exist only on the live pathway, but the contract had
    // no way to say so, and C correctly refused to invent an undocumented key.
    // The key exists now, so the scenario declares what it always was.
    onlyFor: ["live"],
    title: "Who owns this task?",
    prompt: "A producer has started a responsibility list for a recorded live show and handed it to you. Some tasks have no owner, some have two, and one person appears everywhere. Assign each task to exactly one responsible person, resolve the shared authority, and make sure nobody holds two jobs that happen at the same time.",
    seed: {
      "people.engineer_primary": "Dana",
      "people.monitor_engineer": "Dana",
      "people.stream_operator": "Dana",
      "people.stage_manager": "",
      "people.media_manager": "",
      "people.cost_approver": "Dana and Sam",
      "people.schedule_approver": "",
      "people.task_matrix": [
        {
          task_name: "Obtain the destination specifications",
          task_responsible: "Sam",
          task_collaborators: "",
          task_approver: "Sam",
          task_due: "",
          task_status: "not_started"
        },
        {
          task_name: "Confirm the venue's power arrangement",
          task_responsible: "",
          task_collaborators: "",
          task_approver: "",
          task_due: "",
          task_status: "not_started"
        },
        {
          task_name: "Plan and assign wireless frequencies",
          task_responsible: "",
          task_collaborators: "Dana",
          task_approver: "",
          task_due: "",
          task_status: "not_started"
        },
        {
          task_name: "Send the call sheet",
          task_responsible: "Sam",
          task_collaborators: "",
          task_approver: "Sam",
          task_due: "",
          task_status: "not_started"
        },
        {
          task_name: "Collect signed releases from every performer",
          task_responsible: "",
          task_collaborators: "",
          task_approver: "",
          task_due: "",
          task_status: "not_started"
        },
        {
          task_name: "Line check before soundcheck",
          task_responsible: "Dana and Priya",
          task_collaborators: "",
          task_approver: "Dana",
          task_due: "",
          task_status: "not_started"
        },
        {
          task_name: "Verify the recording and make the backup before strike",
          task_responsible: "",
          task_collaborators: "",
          task_approver: "",
          task_due: "",
          task_status: "not_started"
        },
        {
          task_name: "Run the changeovers between acts",
          task_responsible: "Dana",
          task_collaborators: "",
          task_approver: "",
          task_due: "",
          task_status: "not_started"
        },
        {
          task_name: "Approve any extra hire cost on the day",
          task_responsible: "Dana and Sam",
          task_collaborators: "",
          task_approver: "Dana and Sam",
          task_due: "",
          task_status: "not_started"
        }
      ]
    },
    passWhen: "Every task has exactly one responsible person; no task and no authority field names more than one person; a media manager is named, and on the live pathway a stage manager is named; the lead engineer is not also named as stream operator and changeover runner, nor as monitor engineer where that field exists; and someone is responsible for the releases, the power confirmation and the wireless plan.",
    debrief: "The list you were handed had every task on it. That is what made it dangerous: it looked complete. Nobody owned the media, the releases or the power, and Dana owned everything that happens at once during the show, which means Dana owned none of it. Notice that fixing it did not need a single new task, only names, and in two places a conversation about who actually decides. A shared authority is an unresolved argument, and an unowned task is a task nobody will do."
  }
};

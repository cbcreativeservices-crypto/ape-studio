/**
 * Pre-Production · Stage 6 — Confirm Production Readiness.
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

export const STAGE6_READINESS: StageDef = {
  stageId: "readiness",
  num: 6,
  title: "Confirm Production Readiness",
  intro: "The last look before the day. Rights, safety, equipment, testing, contingency and paperwork are each checked, and then the whole plan is read honestly and declared ready, ready with approved conditions, or not ready.",
  whyItMatters: "Productions rarely fail on the thing everyone worried about. They fail on the permission that was still pending, the backup nobody knew how to switch to, the hazard everyone had noticed and nobody owned, and the call sheet with two versions in circulation. This stage exists so that the person who declares the plan ready has actually looked at it.",
  notices: [
    {
      kind: "legal",
      text: "Rights, releases, consent, permits and insurance requirements vary by country, union, venue and production type. This stage teaches you what to confirm and record. It is not legal advice."
    },
    {
      kind: "safety",
      text: "Hearing exposure, crowds, weather, working at height and emergencies are safety matters governed by the rules where you are working. Plan for them with the venue and the responsible person; this lab does not replace that."
    },
    {
      kind: "qualified",
      text: "Rigging, temporary electrical distribution and anything that bears load must be designed, inspected and signed off by a licensed or certified person as the venue, union and insurer require. Completing the Academy's training does not qualify anyone to do that work."
    }
  ],
  sections: [
    {
      sectionId: "rights",
      title: "Rights and Permissions",
      intro: "Every permission the production depends on, with its current status and where the document is. A permission you cannot produce is a permission you do not have.",
      notices: [
        {
          kind: "legal",
          text: "Composition, recording, sync and sample rights, performer and location releases, guest consent and consent for minors are each governed by law and contract that vary by country and use. Confirm each one for your production in writing. This is not legal advice."
        }
      ],
      fields: [
        {
          fieldId: "rights_register",
          label: "Rights and permissions register",
          kind: "table",
          help: "One row per permission the production needs. Status is what you can prove today, not what you have been promised.",
          required: true,
          columns: [
            {
              columnId: "rt_item",
              label: "Item",
              kind: "text"
            },
            {
              columnId: "rt_type",
              label: "Type",
              kind: "choice",
              options: [
                {
                  value: "composition",
                  label: "Composition or publishing"
                },
                {
                  value: "master",
                  label: "Existing recording (master)"
                },
                {
                  value: "sync",
                  label: "Sync to picture"
                },
                {
                  value: "sample",
                  label: "Sample or interpolation"
                },
                {
                  value: "stock",
                  label: "Stock music or sound effects"
                },
                {
                  value: "performer_release",
                  label: "Performer release"
                },
                {
                  value: "guest_consent",
                  label: "Guest or participant consent"
                },
                {
                  value: "minor_consent",
                  label: "Consent for a minor"
                },
                {
                  value: "location",
                  label: "Location release or permission"
                },
                {
                  value: "distribution",
                  label: "Distribution or broadcast permission"
                },
                {
                  value: "archive",
                  label: "Archive and reuse permission"
                },
                {
                  value: "credit",
                  label: "Credit or attribution requirement"
                },
                {
                  value: "other",
                  label: "Other, in notes"
                }
              ]
            },
            {
              columnId: "rt_holder",
              label: "Who grants it",
              kind: "text"
            },
            {
              columnId: "rt_status",
              label: "Status",
              kind: "status"
            },
            {
              columnId: "rt_evidence",
              label: "Where the document is",
              kind: "text"
            },
            {
              columnId: "rt_notes",
              label: "Notes",
              kind: "text"
            }
          ]
        },
        {
          fieldId: "rights_owner",
          label: "Who is responsible for clearances?",
          kind: "text",
          help: "One named person who chases, collects and files every permission. Not the engineer, who is busy on the day it turns out to be missing.",
          required: true
        },
        {
          fieldId: "credit_requirements",
          label: "Credit and attribution requirements",
          kind: "longText",
          help: "Who must be credited, how, and where. Credits promised in a contract and forgotten at delivery are a breach that is cheap to avoid now.",
          required: false
        }
      ]
    },
    {
      sectionId: "safety",
      title: "Safety and Risk",
      intro: "What could hurt someone, how likely it is, how bad it would be, what prevents it, and who owns that prevention.",
      notices: [
        {
          kind: "safety",
          text: "Some venues, insurers and authorities require the risk assessment to be prepared or approved by a competent person, and require specific training for the person responsible for safety. Find out what applies where you are working before relying on this register."
        },
        {
          kind: "qualified",
          text: "Rigging and temporary power are signed off by the certified rigger and the licensed electrician named in stage 3, not by the production. Record their sign-off here; do not substitute your own."
        }
      ],
      fields: [
        {
          fieldId: "hazard_register",
          label: "Hazard register",
          kind: "table",
          help: "One row per hazard. Cable runs, power, rigging, weather, crowd and performer movement, loud sources, vehicles, working at height. A hazard with no control and no owner is a hazard you have decided to accept.",
          required: true,
          columns: [
            {
              columnId: "hz_hazard",
              label: "Hazard",
              kind: "text"
            },
            {
              columnId: "hz_likelihood",
              label: "Likelihood",
              kind: "choice",
              options: [
                {
                  value: "low",
                  label: "Low"
                },
                {
                  value: "medium",
                  label: "Medium"
                },
                {
                  value: "high",
                  label: "High"
                }
              ]
            },
            {
              columnId: "hz_severity",
              label: "Severity if it happens",
              kind: "choice",
              options: [
                {
                  value: "minor",
                  label: "Minor"
                },
                {
                  value: "serious",
                  label: "Serious injury or major loss"
                },
                {
                  value: "severe",
                  label: "Life-threatening"
                }
              ]
            },
            {
              columnId: "hz_control",
              label: "Preventive action",
              kind: "text"
            },
            {
              columnId: "hz_owner",
              label: "Owner",
              kind: "text"
            },
            {
              columnId: "hz_status",
              label: "Status",
              kind: "choice",
              options: [
                {
                  value: "open",
                  label: "Open"
                },
                {
                  value: "controlled",
                  label: "Controlled"
                }
              ]
            }
          ]
        },
        {
          fieldId: "hearing_plan",
          label: "Hearing exposure plan",
          kind: "longText",
          help: "How loud the day will be for performers, crew and audience, who keeps it there, whether anyone measures it, what hearing protection is available, and the rules that apply where you are.",
          required: false
        },
        {
          fieldId: "rigging_signoff",
          label: "Rigging inspection and sign-off",
          kind: "status",
          help: "Approved means the certified rigger named in stage 3 has inspected and signed off everything that is flown. Only that person can approve it; this training does not qualify anyone to.",
          required: false,
          onlyFor: [
            "live"
          ]
        },
        {
          fieldId: "power_signoff",
          label: "Temporary power test and sign-off",
          kind: "status",
          help: "Approved means the licensed or certified electrician from stage 3 has tested and signed off the tie-in, distribution or generator connection. Not required for wall outlets, venue power or a generator used directly.",
          required: false
        },
        {
          fieldId: "weather_plan",
          label: "Weather plan",
          kind: "longText",
          help: "For any outdoor or exposed work: what conditions stop the production, who decides, how equipment is protected, and where people go. Wind and lightning are decisions, not surprises.",
          required: false
        },
        {
          fieldId: "emergency_info",
          label: "Emergency information for the day",
          kind: "longText",
          help: "Emergency numbers, nearest medical help, the venue's evacuation routes and assembly point, where the first-aid kit and extinguishers are, and who has this on paper.",
          required: {
            music: false,
            podcast: false,
            live: true
          }
        },
        {
          fieldId: "safety_briefing",
          label: "Safety briefing for crew and performers",
          kind: "choice",
          help: "The short talk at call time: hazards, exits, who can stop the show, and how to reach them. It is on the schedule or it does not happen.",
          required: false,
          options: [
            {
              value: "scheduled",
              label: "Scheduled, with a named person giving it"
            },
            {
              value: "done",
              label: "Already given"
            },
            {
              value: "none",
              label: "Not planned"
            }
          ]
        }
      ]
    },
    {
      sectionId: "equipment",
      title: "Equipment and Logistics",
      intro: "What is going, whether it has been checked as a whole system, and whether anything is still allowed to change.",
      notices: [
        {
          kind: "qualified",
          text: "Power distribution equipment, hoists and rigging hardware are inspected and connected by the qualified people responsible for them. List them here; do not treat the audio crew's check as their sign-off."
        }
      ],
      fields: [
        {
          fieldId: "manifest",
          label: "Equipment manifest",
          kind: "table",
          help: "Everything that travels, with its preparation state. Ready means tested together with the things it connects to, not just switched on.",
          required: true,
          columns: [
            {
              columnId: "eq_item",
              label: "Item",
              kind: "text"
            },
            {
              columnId: "eq_qty",
              label: "Quantity",
              kind: "number"
            },
            {
              columnId: "eq_source",
              label: "Source",
              kind: "choice",
              options: [
                {
                  value: "owned",
                  label: "Owned"
                },
                {
                  value: "hired",
                  label: "Hired"
                },
                {
                  value: "venue",
                  label: "Venue-provided"
                },
                {
                  value: "borrowed",
                  label: "Borrowed"
                }
              ]
            },
            {
              columnId: "eq_prep",
              label: "Preparation",
              kind: "choice",
              options: [
                {
                  value: "not_checked",
                  label: "Not checked"
                },
                {
                  value: "bench_checked",
                  label: "Checked on its own"
                },
                {
                  value: "system_tested",
                  label: "Tested as part of the complete system"
                },
                {
                  value: "packed",
                  label: "Tested and packed"
                }
              ]
            },
            {
              columnId: "eq_owner",
              label: "Responsible",
              kind: "text"
            }
          ]
        },
        {
          fieldId: "cables_and_adapters",
          label: "Cables, adapters and the odd connectors",
          kind: "longText",
          help: "Counts and lengths against the input list, the spares, and every adapter the plan silently depends on. The one you did not pack is the one the venue does not have either.",
          required: false
        },
        {
          fieldId: "change_freeze",
          label: "Are firmware, software and plug-ins frozen?",
          kind: "choice",
          help: "An update the night before is a new, untested system on the day. Freeze versions on every device and computer after the last full test, and write the date down.",
          required: false,
          options: [
            {
              value: "frozen",
              label: "Frozen after the last full test"
            },
            {
              value: "not_frozen",
              label: "Not frozen"
            },
            {
              value: "not_applicable",
              label: "No software-dependent equipment"
            }
          ]
        },
        {
          fieldId: "freeze_date",
          label: "Freeze date",
          kind: "date",
          help: "The date after which nothing is updated. Any test done before it was a test of a different system.",
          required: false
        },
        {
          fieldId: "logistics_notes",
          label: "Transport, load-in and access",
          kind: "longText",
          help: "Vehicles, parking, loading door, lifts, stairs, access times and who has the keys. Confirmed with the venue, with a name.",
          required: false
        }
      ]
    },
    {
      sectionId: "testing",
      title: "Testing and Rehearsal",
      intro: "Each device on its own, then the whole system together, then the sequence of the day. A signal that works is not the same as a show that works.",
      fields: [
        {
          fieldId: "bench_test",
          label: "Bench test of each device",
          kind: "choice",
          help: "Every device powered, checked and updated on its own before it meets the others. Faults found here cost minutes.",
          required: false,
          options: [
            {
              value: "done",
              label: "Done for every device"
            },
            {
              value: "partial",
              label: "Done for some"
            },
            {
              value: "none",
              label: "Not done"
            }
          ]
        },
        {
          fieldId: "system_test",
          label: "Complete-system test",
          kind: "choice",
          help: "The whole chain connected as it will be on the day, with signal passed from every source to every destination, including the stream and the recorder.",
          required: false,
          options: [
            {
              value: "done",
              label: "Done, end to end"
            },
            {
              value: "partial",
              label: "Done for part of the system"
            },
            {
              value: "none",
              label: "Not done"
            }
          ]
        },
        {
          fieldId: "rehearsal_plan",
          label: "Tests and rehearsals",
          kind: "table",
          help: "One row per check or rehearsal, in order. A line check proves the patch, a soundcheck sets the balance, a rehearsal proves the content, and a dress rehearsal proves the sequence with everyone in position.",
          required: false,
          columns: [
            {
              columnId: "rh_type",
              label: "Type",
              kind: "choice",
              options: [
                {
                  value: "bench",
                  label: "Bench test"
                },
                {
                  value: "system",
                  label: "System test"
                },
                {
                  value: "line_check",
                  label: "Line check"
                },
                {
                  value: "soundcheck",
                  label: "Soundcheck"
                },
                {
                  value: "rehearsal",
                  label: "Rehearsal"
                },
                {
                  value: "tech_rehearsal",
                  label: "Technical rehearsal"
                },
                {
                  value: "dress_rehearsal",
                  label: "Dress rehearsal"
                }
              ]
            },
            {
              columnId: "rh_date",
              label: "Date",
              kind: "date"
            },
            {
              columnId: "rh_start",
              label: "Start",
              kind: "time"
            },
            {
              columnId: "rh_owner",
              label: "Owner",
              kind: "text"
            },
            {
              columnId: "rh_status",
              label: "Status",
              kind: "choice",
              options: [
                {
                  value: "planned",
                  label: "Planned"
                },
                {
                  value: "done",
                  label: "Done"
                },
                {
                  value: "skipped",
                  label: "Skipped"
                }
              ]
            }
          ]
        },
        {
          fieldId: "test_findings",
          label: "What the tests found, and what changed",
          kind: "longText",
          help: "Every fault found and every change made because of it. A test that found nothing is either a very good system or a test that was not looking.",
          required: false
        }
      ]
    },
    {
      sectionId: "contingency",
      title: "Contingency",
      intro: "For every system the production cannot lose: what replaces it, how the switch is made, how long it takes, and who decides.",
      notices: [
        {
          kind: "safety",
          text: "Decisions to pause, relocate or cancel are safety decisions before they are commercial ones. The person with stop-work authority makes them, and nobody on the production overrules them on the day."
        }
      ],
      fields: [
        {
          fieldId: "contingency_table",
          label: "Critical systems and their backups",
          kind: "table",
          help: "One row per system whose failure stops the production: recorder, console, power, stream, wireless, playback, the one microphone that matters. A backup nobody can switch to in time is not a backup.",
          required: true,
          columns: [
            {
              columnId: "ct_system",
              label: "System",
              kind: "text"
            },
            {
              columnId: "ct_primary",
              label: "Primary",
              kind: "text"
            },
            {
              columnId: "ct_backup",
              label: "Backup",
              kind: "text"
            },
            {
              columnId: "ct_switch",
              label: "How the switch is made",
              kind: "text"
            },
            {
              columnId: "ct_switch_time",
              label: "Time to switch (minutes)",
              kind: "duration"
            },
            {
              columnId: "ct_owner",
              label: "Who switches",
              kind: "text"
            },
            {
              columnId: "ct_tested",
              label: "Switch tested?",
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
            }
          ]
        },
        {
          fieldId: "decision_authority",
          label: "Who decides to continue, pause, simplify, relocate, reschedule or cancel?",
          kind: "text",
          help: "One name, on the day, reachable. For safety decisions this is the person with stop-work authority from stage 3; say so if it is the same person.",
          required: true
        },
        {
          fieldId: "decision_triggers",
          label: "What triggers each response?",
          kind: "longText",
          help: "The conditions under which the production pauses, simplifies, relocates, reschedules or cancels, decided now while nobody is under pressure.",
          required: false
        },
        {
          fieldId: "minimum_viable",
          label: "The simplest version that still delivers what was promised",
          kind: "longText",
          help: "If half the system fails, what is the smallest setup that still produces every required deliverable from stage 2? Write it down; it is the plan you simplify to.",
          required: false
        }
      ]
    },
    {
      sectionId: "documents",
      title: "Production-Day Documentation",
      intro: "The packet everyone works from on the day, with one current revision that everyone has.",
      notices: [
        {
          kind: "legal",
          text: "The contact sheet and the rights log hold personal information about crew, performers and guests. Share them only with the people who need them, and handle them under the privacy rules that apply where you are."
        }
      ],
      fields: [
        {
          fieldId: "packet_docs",
          label: "Documents in the packet",
          kind: "table",
          help: "One row per document, with its revision and who approved it. If two people could be holding different versions, the revision column is how you find out.",
          required: true,
          columns: [
            {
              columnId: "doc_type",
              label: "Document",
              kind: "choice",
              options: [
                {
                  value: "call_sheet",
                  label: "Call sheet"
                },
                {
                  value: "schedule",
                  label: "Day schedule"
                },
                {
                  value: "input_list",
                  label: "Input list"
                },
                {
                  value: "stage_plot",
                  label: "Stage plot"
                },
                {
                  value: "patch_list",
                  label: "Patch list"
                },
                {
                  value: "contact_sheet",
                  label: "Contact sheet"
                },
                {
                  value: "risk_assessment",
                  label: "Risk assessment"
                },
                {
                  value: "rights_log",
                  label: "Rights and releases log"
                },
                {
                  value: "contingency_plan",
                  label: "Contingency plan"
                },
                {
                  value: "spec_sheet",
                  label: "Deliverable specifications"
                },
                {
                  value: "other",
                  label: "Other, in notes"
                }
              ]
            },
            {
              columnId: "doc_revision",
              label: "Revision",
              kind: "text"
            },
            {
              columnId: "doc_location",
              label: "Where it lives",
              kind: "text"
            },
            {
              columnId: "doc_approver",
              label: "Approved by",
              kind: "text"
            },
            {
              columnId: "doc_issued",
              label: "Issued on",
              kind: "date"
            }
          ]
        },
        {
          fieldId: "call_sheet_status",
          label: "Call sheet",
          kind: "choice",
          help: "Issued means every person on it has received the current revision. Drafted means nobody has.",
          required: true,
          options: [
            {
              value: "issued",
              label: "Issued to everyone"
            },
            {
              value: "draft",
              label: "Drafted, not issued"
            },
            {
              value: "none",
              label: "None yet"
            }
          ]
        },
        {
          fieldId: "distribution",
          label: "Who has the current packet, and how did they get it?",
          kind: "longText",
          help: "Names and the channel used. A document in the shared folder from stage 3 is not in anyone's hands until they have opened it.",
          required: false
        }
      ]
    },
    {
      sectionId: "review",
      title: "Final Readiness Review",
      intro: "The plan, read as a whole, by the people who will carry it out. The verdict comes from every stage; this is where you look at it and decide whether you believe it.",
      fields: [
        {
          fieldId: "review_date",
          label: "Review date",
          kind: "date",
          help: "When the plan was read end to end with the key people present. Close enough to the day that nothing important changes afterwards; far enough that something still can.",
          required: false
        },
        {
          fieldId: "review_attendees",
          label: "Who was in the review?",
          kind: "text",
          help: "The producer, the lead engineer and whoever owns safety, at minimum. A review by one person is a re-read, not a review.",
          required: false
        },
        {
          fieldId: "conditions",
          label: "Approved conditions",
          kind: "table",
          help: "Anything not resolved that the production is proceeding with anyway. Each needs an owner, a resolve-by date and the name of the person who accepted the risk. Without those, it is a Not Ready in disguise.",
          required: false,
          columns: [
            {
              columnId: "cond_item",
              label: "Condition",
              kind: "text"
            },
            {
              columnId: "cond_owner",
              label: "Owner",
              kind: "text"
            },
            {
              columnId: "cond_resolve_by",
              label: "Resolve by",
              kind: "date"
            },
            {
              columnId: "cond_approved_by",
              label: "Accepted by",
              kind: "text"
            },
            {
              columnId: "cond_status",
              label: "Status",
              kind: "choice",
              options: [
                {
                  value: "open",
                  label: "Open"
                },
                {
                  value: "resolved",
                  label: "Resolved"
                }
              ]
            }
          ]
        },
        {
          fieldId: "declared_by",
          label: "Who declares the plan ready?",
          kind: "text",
          help: "The one person who signs off, having read the verdict and the open conditions. It should be the producer or project lead from stage 1.",
          required: false
        },
        {
          fieldId: "least_sure",
          label: "What are you least sure of?",
          kind: "longText",
          help: "The honest answer, in one or two sentences. If it is not already a row in the hazard register, the contingency table or the conditions above, it should be.",
          required: false
        }
      ]
    }
  ],
  rules: [
    {
      ruleId: "readiness-backup-unreachable",
      watches: [
        "readiness.contingency_table"
      ],
      severity: "attention",
      kind: "unrealistic",
      title: "A backup that cannot be reached in time is not a backup",
      detail: "A backup named in the table with no stated way to switch to it, no time to switch, no person to do it, or a switch nobody has tried, is a backup that exists on paper. The first time the switch is attempted will be with the production stopped.",
      fixHint: "For each critical system, write how the switch is made, how long it takes, who does it, and test it once before the day.",
      needsLogic: true,
      logicIntent: "Fire for each contingency_table row where ct_backup is filled and any of ct_switch, ct_switch_time or ct_owner is empty, or ct_tested is no. Treat a backup cell reading none, n/a or no backup as empty and leave it to readiness-critical-system-no-backup. Once per row or once with a count; ccode decides. Do not fire when the table is empty."
    },
    {
      ruleId: "readiness-critical-system-no-backup",
      watches: [
        "readiness.contingency_table",
        "define.services",
        "people.wireless_channels"
      ],
      severity: "attention",
      kind: "missing",
      title: "A system the production cannot lose has no backup at all",
      detail: "Rows with a primary and an empty backup are the systems whose failure ends the production. Some of them may be an accepted risk, but that should be a decision recorded in the approved conditions, not an empty cell.",
      fixHint: "Name a backup for each critical system, or record the accepted risk in the approved conditions with the name of the person who accepted it.",
      needsLogic: true,
      logicIntent: "Fire for each contingency_table row where ct_primary is filled and ct_backup is empty or reads none, n/a or no backup. Also fire when live_recording or livestream_feed is among the stage 1 services and no row's ct_system mentions a recorder or stream respectively, or when people.wireless_channels is greater than zero and no row mentions wireless. Match words loosely; do not fire when the table is empty."
    },
    {
      ruleId: "readiness-hazard-uncontrolled",
      watches: [
        "readiness.hazard_register"
      ],
      severity: "blocker",
      kind: "unsafe",
      title: "A life-threatening hazard has no preventive action or no owner",
      detail: "A hazard rated life-threatening with nothing written against it is a hazard the production has looked at and accepted. That is not a plan, and it is not a decision anyone on the crew agreed to. The production should not proceed until the hazard is controlled and someone owns the control.",
      fixHint: "Write the preventive action and name the owner for every hazard rated life-threatening, and have the responsible person confirm it.",
      needsLogic: true,
      logicIntent: "Fire when any hazard_register row has hz_severity severe and either hz_control or hz_owner is empty. Do not fire on rows rated minor or serious; those are covered by the next rule."
    },
    {
      ruleId: "readiness-hazard-open",
      watches: [
        "readiness.hazard_register",
        "schedule.production_date"
      ],
      severity: "attention",
      kind: "unsafe",
      title: "Hazards are still open close to the day",
      detail: "A hazard marked open, or one rated serious with no owner, is work that has been noticed and not done. Close to the production date it becomes something the crew is told to be careful about, which is not a control.",
      fixHint: "Give every serious hazard a preventive action and an owner, and mark it controlled only once the control is in place.",
      needsLogic: true,
      logicIntent: "Fire when any hazard_register row has hz_status open, or hz_severity serious with hz_owner or hz_control empty, and schedule.production_date is within a number of days ahead of today that ccode chooses. Do not fire when production_date is empty."
    },
    {
      ruleId: "readiness-equipment-ready-untested",
      watches: [
        "readiness.manifest",
        "readiness.system_test",
        "readiness.bench_test"
      ],
      severity: "attention",
      kind: "conflict",
      title: "Equipment is marked ready but was never tested together",
      detail: "Items marked tested and packed while no complete-system test has been done were tested on their own, if at all. Devices that work alone and fail together are a common and expensive kind of failure.",
      fixHint: "Run the complete-system test with everything connected as it will be on the day, then mark items as system-tested.",
      needsLogic: true,
      logicIntent: "Fire when any manifest row has eq_prep set to system_tested or packed and system_test is none or empty. Also fire when any row is packed and bench_test is none. Do not fire when the manifest is empty."
    },
    {
      ruleId: "readiness-no-dress-rehearsal",
      watches: [
        "readiness.rehearsal_plan",
        "schedule.day_schedule",
        "people.stream_operator",
        "people.remote_participants",
        "technical.click_playback"
      ],
      severity: "attention",
      kind: "missing",
      title: "A production with cues, changeovers or remote participants has no dress rehearsal",
      detail: "A line check proves the signal and a soundcheck proves the balance. Neither proves that the changeover fits, that the playback fires on the cue, or that the remote guest arrives in the right place at the right moment. Only running the sequence proves the sequence.",
      fixHint: "Schedule a dress or technical rehearsal that runs the day's sequence with everyone in position, and record what it found.",
      needsLogic: true,
      logicIntent: "Fire when the production has sequence complexity, defined as any of: a changeover block in schedule.day_schedule, people.stream_operator filled, people.remote_participants filled, or technical.click_playback yes; and rehearsal_plan contains no row of type dress_rehearsal or tech_rehearsal that is not skipped. Do not fire when none of the complexity signals is present."
    },
    {
      ruleId: "readiness-permission-pending",
      watches: [
        "readiness.rights_register",
        "schedule.production_date"
      ],
      severity: "attention",
      kind: "legal",
      title: "A permission is still requested or pending with the production date set",
      detail: "A permission that has been asked for is not a permission. If it arrives late or with conditions, the plan built around it changes on the day, and if it does not arrive, the material it covers cannot be used.",
      fixHint: "Chase each pending item to a decision before the date, or plan the production so it does not depend on it.",
      needsLogic: true,
      logicIntent: "Fire for each rights_register row with rt_status Requested or Pending when schedule.production_date is set. Once per row or once with a count; ccode decides."
    },
    {
      ruleId: "readiness-rights-missing",
      watches: [
        "readiness.rights_register",
        "define.platform"
      ],
      severity: "blocker",
      kind: "legal",
      title: "A rights item the release depends on is missing or expired",
      detail: "A composition, recording, sync or sample right marked missing or expired, on a production headed for a published destination, is work that cannot lawfully be used there. Recording it does not make it usable. Requirements vary by country and use; the status you recorded is the one that counts.",
      fixHint: "Obtain the right, remove the material that depends on it, or restrict the destination to one where the right is not required, and record which.",
      needsLogic: true,
      logicIntent: "Fire when any rights_register row has rt_type composition, master, sync or sample and rt_status Missing or Expired, and define.platform includes any destination other than internal or live_venue. A performance in a venue is commonly covered by the venue's own licensing, so a plan whose only destination is live_venue does not trigger this. Do not fire on Restricted; that needs reading, not blocking."
    },
    {
      ruleId: "readiness-rigging-not-signed",
      watches: [
        "people.rigging_required",
        "readiness.rigging_signoff"
      ],
      severity: "blocker",
      kind: "unsafe",
      title: "Something is flown and the rigging has not been signed off",
      detail: "Stage 3 says something is rigged above people. Until the certified rigger has inspected it and signed it off, nobody should be under it. Audio experience does not substitute for that sign-off, and neither does this lab.",
      fixHint: "Have the certified rigger named in stage 3 inspect and sign off everything that is flown, and record the sign-off as approved.",
      needsLogic: true,
      logicIntent: "Fire when people.rigging_required is yes and rigging_signoff is anything other than Approved, including empty.",
      onlyFor: [
        "live"
      ]
    },
    {
      ruleId: "readiness-power-not-signed",
      watches: [
        "people.power_source",
        "readiness.power_signoff"
      ],
      severity: "blocker",
      kind: "unsafe",
      title: "Temporary power is in use and has not been signed off",
      detail: "Stage 3 says the system is fed by a tie-in, temporary distribution or a generator through distribution. Until the licensed or certified electrician has tested and signed off the connection, it should not be energised with people on it. The production does not sign this off for itself.",
      fixHint: "Have the electrician named in stage 3 test and sign off the power, and record the sign-off as approved.",
      needsLogic: true,
      logicIntent: "Fire when people.power_source is temporary_distro or generator_distro and power_signoff is anything other than Approved, including empty. Do not fire for existing_outlets, house_distro, generator_direct or unknown."
    },
    {
      ruleId: "readiness-outdoor-no-weather-plan",
      watches: [
        "define.location_type",
        "readiness.weather_plan"
      ],
      severity: "attention",
      kind: "unsafe",
      title: "An outdoor production with no weather plan",
      detail: "Wind, rain and lightning each end an outdoor production in a different way, and the decision about when is made badly if it is made for the first time on the day with the audience arriving.",
      fixHint: "Write the conditions that pause or stop the production, who decides, how equipment is protected and where people go.",
      needsLogic: true,
      logicIntent: "Fire when outdoor is among define.location_type and weather_plan is empty."
    },
    {
      ruleId: "readiness-no-decision-authority",
      watches: [
        "readiness.decision_authority",
        "readiness.decision_triggers"
      ],
      severity: "attention",
      kind: "missing",
      title: "Nobody is named to decide whether the production continues",
      detail: "When something fails, someone has to choose between continuing, simplifying, pausing and stopping, quickly and without a meeting. If no one has that authority written down, the decision is made by whoever speaks first, and argued about afterwards.",
      fixHint: "Name one reachable person and write the triggers for each response.",
      needsLogic: true,
      logicIntent: "Fire when decision_authority is empty. The triggers field is advisory; do not fire on it alone."
    },
    {
      ruleId: "readiness-hearing-plan-missing",
      watches: [
        "readiness.hearing_plan",
        "technical.level_plan"
      ],
      severity: "attention",
      kind: "unsafe",
      title: "No plan for what people's ears are exposed to",
      detail: "A loud day is a decision made by default when nobody makes it on purpose. Performers and crew carry the result for life, and where you are working there may be a rule about it that the production is expected to know.",
      fixHint: "Write how loud the day will be, who keeps it there, whether it is measured, and what protection is available, and check the rules that apply where you are.",
      needsLogic: true,
      logicIntent: "Fire when hearing_plan is empty and technical.level_plan is also empty. Do not fire when either is filled.",
      onlyFor: [
        "music",
        "live"
      ]
    },
    {
      ruleId: "readiness-packet-no-revision",
      watches: [
        "readiness.packet_docs",
        "readiness.call_sheet_status",
        "readiness.distribution"
      ],
      severity: "attention",
      kind: "missing",
      title: "Nobody can tell which copy of the packet is current",
      detail: "A document with no revision and no approver has as many versions as people who edited it. On the day, the input list at the console and the input list at the stage box will differ, and the crew will find out at line check.",
      fixHint: "Give every document a revision and an approver, issue the call sheet, and record who has the current packet.",
      needsLogic: true,
      logicIntent: "Fire when any packet_docs row has doc_revision or doc_approver empty. Also fire when call_sheet_status is issued and distribution is empty. Do not fire when packet_docs is empty."
    },
    {
      ruleId: "readiness-condition-unowned",
      watches: [
        "readiness.conditions",
        "readiness.declared_by"
      ],
      severity: "attention",
      kind: "missing",
      title: "An approved condition that nobody owns or accepted",
      detail: "Proceeding with an open item is legitimate when a named person has accepted the risk and someone owns closing it by a date. Without those, the condition is a Not Ready that has been reworded, and the declaration is not honest.",
      fixHint: "Give every open condition an owner, a resolve-by date and the name of the person who accepted it, and name who declares the plan ready.",
      needsLogic: true,
      logicIntent: "Fire for each conditions row with cond_status open where cond_owner, cond_resolve_by or cond_approved_by is empty. Also fire when conditions has open rows and declared_by is empty. Do not fire when the table is empty."
    }
  ],
  activity: {
    activityId: "production-emergency",
    title: "Production emergency",
    prompt: "A recorded live show is nearly ready. Then, at line check, the main recorder fails to see its drive, the lead vocalist's wireless microphone is dropping out, and a hazard everyone noticed during load-in is still sitting in the register with nothing against it. Using the contingency table and the register, decide what happens: name the backups, write how each switch is made and who makes it, control the hazard, and record any risk you decide to accept so that the required deliverables and the people are both protected.",
    onlyFor: [
      "live"
    ],
    seed: {
      "define.services": [
        "reinforcement",
        "live_recording",
        "delivery_prep"
      ],
      "people.wireless_channels": 4,
      "readiness.contingency_table": [
        {
          ct_system: "Multitrack recorder",
          ct_primary: "Main recorder, internal drive",
          ct_backup: "Laptop with interface",
          ct_switch: "",
          ct_switch_time: "",
          ct_owner: "",
          ct_tested: "no"
        },
        {
          ct_system: "Lead vocal wireless",
          ct_primary: "Handheld wireless, channel 1",
          ct_backup: "",
          ct_switch: "",
          ct_switch_time: "",
          ct_owner: "",
          ct_tested: "no"
        },
        {
          ct_system: "Front-of-house console",
          ct_primary: "Digital console",
          ct_backup: "",
          ct_switch: "",
          ct_switch_time: "",
          ct_owner: "",
          ct_tested: "no"
        }
      ],
      "readiness.hazard_register": [
        {
          hz_hazard: "Main cable run crosses the audience entrance",
          hz_likelihood: "high",
          hz_severity: "severe",
          hz_control: "",
          hz_owner: "",
          hz_status: "open"
        },
        {
          hz_hazard: "Stage monitor levels during the headline set",
          hz_likelihood: "medium",
          hz_severity: "serious",
          hz_control: "Monitor engineer holds levels; ear protection at the desk",
          hz_owner: "Dana",
          hz_status: "controlled"
        }
      ],
      "readiness.decision_authority": "",
      "readiness.decision_triggers": "",
      "readiness.minimum_viable": "",
      "readiness.conditions": [],
      "readiness.declared_by": ""
    },
    passWhen: "The recorder row has a switch method, a switch time and a named person, and the switch is marked tested or the untested switch is recorded as an accepted condition with an approver; the lead vocal wireless row has a backup, which may be a wired microphone, with a switch method and owner; the cable-run hazard has a preventive action and an owner and is marked controlled; a decision authority is named with triggers written; the simplest deliverable-preserving version is described and keeps the live recording; and any risk accepted, such as the console having no backup, appears in the conditions table with an owner, a resolve-by date and the name of the person who accepted it.",
    debrief: "Nothing that went wrong was unusual, and none of it needed new equipment to solve: a laptop already in the case, a wired microphone on a stand, a cable ramp and a name. What the plan lacked was not backups but the switch, the time and the person, and a hazard that everyone had noticed and nobody owned. Notice that the console with no backup was allowed to stay that way, because a named person accepted the risk in writing. That is the difference between Ready With Approved Conditions and Not Ready: not whether something is unresolved, but whether someone has looked at it and said so."
  }
};

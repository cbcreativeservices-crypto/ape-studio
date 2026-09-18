/**
 * Pre-Production · Stage 4 — Schedule and Resources.
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

export const STAGE4_SCHEDULE: StageDef = {
  stageId: "schedule",
  num: 4,
  title: "Schedule and Resources",
  intro: "Put the plan on a calendar and a clock, price it, and check what it needs against what you actually have. This is where the earlier stages are tested against time, money and equipment.",
  whyItMatters: "A schedule fails by omission. Nobody plans to skip the line check, the break, the changeover or the backup; they simply are not on the sheet, so the time is spent on something else and the fault is found with the audience in, the drive in one bag, and the first surprise paid for out of somebody's fee. Everything on this screen is obvious afterwards, and the point of this stage is to make it obvious now.",
  notices: [
    {
      kind: "safety",
      text: "Long days, tired crew, loud rooms and crowds are hazards, and working-hours, noise and crowd rules vary by country, union and venue. Plan breaks and levels as safety measures, not as comfort, and find out which rules apply where you are working."
    }
  ],
  sections: [
    {
      sectionId: "milestones",
      title: "Milestones",
      intro: "The dates between now and delivery, and which ones depend on which. When a prerequisite moves, everything after it moves too, and the plan should show that before the day does.",
      notices: [
        {
          kind: "legal",
          text: "Access to a location, and permission to record, amplify or gather people there, is granted by its owner or authority under rules that vary by place. Confirm it in writing before you schedule around it. This is not legal advice."
        }
      ],
      fields: [
        {
          fieldId: "production_date",
          label: "Production date",
          kind: "date",
          help: "The recording, performance or first session day. If there are several, enter the first and list the rest as milestones.",
          required: true,
          labelBy: {
            music: "First tracking date",
            podcast: "First recording date",
            live: "Show date"
          }
        },
        {
          fieldId: "backup_date",
          label: "Backup date",
          kind: "date",
          help: "A held date in case the production date is lost to weather, illness or a venue problem. If there is none, say so knowingly, and know what the loss of the date costs.",
          required: false
        },
        {
          fieldId: "final_delivery_date",
          label: "Final delivery date",
          kind: "date",
          help: "When the last deliverable is handed over. It should match or precede the completion date in the brief.",
          required: true
        },
        {
          fieldId: "milestone_list",
          label: "Milestones",
          kind: "table",
          help: "Every dated step, who owns it, and what it depends on. A milestone with no owner and no dependency is a wish.",
          required: true,
          columns: [
            {
              columnId: "ms_type",
              label: "Milestone",
              kind: "choice",
              options: [
                {
                  value: "planning_complete",
                  label: "Planning complete"
                },
                {
                  value: "script_arrangement",
                  label: "Script, arrangement or running order final"
                },
                {
                  value: "rehearsal",
                  label: "Rehearsal"
                },
                {
                  value: "location_access",
                  label: "Location or venue access confirmed"
                },
                {
                  value: "equipment_prep",
                  label: "Equipment prepared and tested"
                },
                {
                  value: "tech_rehearsal",
                  label: "Technical rehearsal"
                },
                {
                  value: "production_day",
                  label: "Production day"
                },
                {
                  value: "media_transfer",
                  label: "Media transferred and verified"
                },
                {
                  value: "review_period",
                  label: "Review period"
                },
                {
                  value: "final_delivery",
                  label: "Final delivery"
                },
                {
                  value: "archiving",
                  label: "Archiving complete"
                },
                {
                  value: "other",
                  label: "Other, described in notes"
                }
              ]
            },
            {
              columnId: "ms_date",
              label: "Date",
              kind: "date"
            },
            {
              columnId: "ms_owner",
              label: "Owner",
              kind: "text"
            },
            {
              columnId: "ms_depends_on",
              label: "Depends on",
              kind: "text"
            },
            {
              columnId: "ms_status",
              label: "Status",
              kind: "choice",
              options: [
                {
                  value: "planned",
                  label: "Planned"
                },
                {
                  value: "confirmed",
                  label: "Confirmed"
                },
                {
                  value: "at_risk",
                  label: "At risk"
                },
                {
                  value: "done",
                  label: "Done"
                }
              ]
            },
            {
              columnId: "ms_notes",
              label: "Notes",
              kind: "text"
            }
          ]
        },
        {
          fieldId: "production_days",
          label: "How many production days?",
          kind: "number",
          help: "Days of recording, performance or capture, not counting editing and mixing. This is the number the scope in stage 1 is checked against.",
          required: true,
          unit: "days"
        }
      ]
    },
    {
      sectionId: "dayschedule",
      title: "Production-Day Schedule",
      intro: "The day, block by block, from the first person arriving to the last drive leaving. The blocks people forget are the ones this lab checks for.",
      notices: [
        {
          kind: "safety",
          text: "Crowd movement, working at height during load-in and strike, weather on outdoor sites and emergency access are safety matters decided with the venue and the responsible person, under the rules that apply where you are. Schedule them; do not leave them to the day."
        }
      ],
      fields: [
        {
          fieldId: "call_time",
          label: "Crew call time",
          kind: "text",
          help: "When the first crew member is expected on site. Write it as a clock time.",
          required: true
        },
        {
          fieldId: "hard_out",
          label: "Hard out or curfew",
          kind: "text",
          help: "The time the venue, the room or the crew must be finished, as a clock time. Everything below has to fit between the call and this.",
          required: true
        },
        {
          fieldId: "hours_per_day",
          label: "Working hours per production day",
          kind: "duration",
          help: "The hours the crew is actually working, including setup and strike. Long days are a safety matter as well as a cost.",
          required: true,
          unit: "hours"
        },
        {
          fieldId: "day_schedule",
          label: "Blocks of the day",
          kind: "table",
          help: "One row per block, in order. Give every block a duration and an owner, and be honest about setup.",
          required: true,
          columns: [
            {
              columnId: "blk_type",
              label: "Block",
              kind: "choice",
              options: [
                {
                  value: "load_in",
                  label: "Load-in"
                },
                {
                  value: "setup",
                  label: "Setup"
                },
                {
                  value: "patching",
                  label: "Patching and labelling"
                },
                {
                  value: "system_check",
                  label: "System check"
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
                  value: "doors",
                  label: "Doors or audience in"
                },
                {
                  value: "performance",
                  label: "Recording or performance"
                },
                {
                  value: "break",
                  label: "Break"
                },
                {
                  value: "changeover",
                  label: "Changeover"
                },
                {
                  value: "playback_review",
                  label: "Playback review"
                },
                {
                  value: "pickups",
                  label: "Pickups"
                },
                {
                  value: "file_verification",
                  label: "File verification"
                },
                {
                  value: "backup",
                  label: "Backup"
                },
                {
                  value: "strike",
                  label: "Strike"
                },
                {
                  value: "load_out",
                  label: "Load-out"
                },
                {
                  value: "other",
                  label: "Other, described in notes"
                }
              ]
            },
            {
              columnId: "blk_start",
              label: "Start (clock time)",
              kind: "text"
            },
            {
              columnId: "blk_duration",
              label: "Duration (minutes)",
              kind: "duration"
            },
            {
              columnId: "blk_owner",
              label: "Owner",
              kind: "text"
            },
            {
              columnId: "blk_notes",
              label: "Notes",
              kind: "text"
            }
          ]
        },
        {
          fieldId: "setup_contingency",
          label: "What happens if setup runs long?",
          kind: "longText",
          help: "Which later block is shortened, who decides, and at what time the decision is made. A setup that assumes nothing goes wrong is a plan with no answer to this question.",
          required: false
        }
      ]
    },
    {
      sectionId: "budget",
      title: "Budget",
      intro: "What it costs, line by line, against what is available. The line most often missing is the one that pays for the surprise.",
      notices: [
        {
          kind: "legal",
          text: "Insurance, permits, licensing and the fees owed for music, venues and performers vary by country, union, venue and production type. This lab reminds you to budget for them and to find out which apply. It is not legal or financial advice."
        }
      ],
      fields: [
        {
          fieldId: "budget_total",
          label: "Total budget available",
          kind: "currency",
          help: "The amount actually agreed, from the client or from you. Not the amount you hope to get.",
          required: true
        },
        {
          fieldId: "budget_source",
          label: "Who is paying, and when?",
          kind: "text",
          help: "Client, label, venue, grant, or you. Deposit and balance timing decides whether you can pay the crew and the hire before you are paid.",
          required: false
        },
        {
          fieldId: "budget_lines",
          label: "Budget lines",
          kind: "table",
          help: "One row per cost. Include a contingency line and mark each line as estimated, quoted or confirmed.",
          required: true,
          columns: [
            {
              columnId: "bl_category",
              label: "Category",
              kind: "choice",
              options: [
                {
                  value: "personnel",
                  label: "Personnel"
                },
                {
                  value: "venue",
                  label: "Venue or studio"
                },
                {
                  value: "equipment_rental",
                  label: "Equipment rental"
                },
                {
                  value: "transport",
                  label: "Transport"
                },
                {
                  value: "accommodation",
                  label: "Accommodation"
                },
                {
                  value: "media_storage",
                  label: "Media and storage"
                },
                {
                  value: "licensing",
                  label: "Licensing and rights"
                },
                {
                  value: "insurance_permits",
                  label: "Insurance and permits"
                },
                {
                  value: "catering",
                  label: "Catering"
                },
                {
                  value: "editing_finishing",
                  label: "Editing, mixing and mastering"
                },
                {
                  value: "delivery",
                  label: "Delivery"
                },
                {
                  value: "contingency",
                  label: "Contingency"
                },
                {
                  value: "other",
                  label: "Other, described"
                }
              ]
            },
            {
              columnId: "bl_description",
              label: "Description",
              kind: "text"
            },
            {
              columnId: "bl_amount",
              label: "Amount",
              kind: "currency"
            },
            {
              columnId: "bl_status",
              label: "Status",
              kind: "choice",
              options: [
                {
                  value: "estimated",
                  label: "Estimated"
                },
                {
                  value: "quoted",
                  label: "Quoted"
                },
                {
                  value: "confirmed",
                  label: "Confirmed"
                },
                {
                  value: "paid",
                  label: "Paid"
                }
              ]
            }
          ]
        },
        {
          fieldId: "insurance_status",
          label: "Insurance for this production",
          kind: "status",
          help: "Liability, equipment and event cover as the venue, client or law requires where you are. Record whether it is in place, not whether you assume it is.",
          required: {
            music: false,
            podcast: false,
            live: true
          }
        },
        {
          fieldId: "permits_status",
          label: "Permits and location permissions",
          kind: "status",
          help: "Any permission needed to use the location, make noise, close a street or run an event. Requirements are local; the venue or authority tells you which apply.",
          required: false
        }
      ]
    },
    {
      sectionId: "resources",
      title: "Resource Check",
      intro: "What the project needs against what is actually available, in numbers. The gaps found here are the ones that would otherwise be found at load-in.",
      notices: [
        {
          kind: "qualified",
          text: "Whether a venue's electrical supply can carry the load, and how it is distributed, is decided by a licensed electrician or the venue's qualified staff. Record what you have been told; do not calculate it yourself unless you hold that qualification."
        }
      ],
      fields: [
        {
          fieldId: "crew_count",
          label: "Crew available on the day",
          kind: "number",
          help: "People actually confirmed to work, not roles you hope to fill. Compare with the roles named in stage 3.",
          required: true,
          unit: "people"
        },
        {
          fieldId: "available_channels",
          label: "Recording channels available",
          kind: "number",
          help: "Inputs the recorder or interface can capture at once, at the session sample rate. Compare with the source count from stage 1.",
          required: {
            music: true,
            podcast: false,
            live: true
          },
          unit: "channels"
        },
        {
          fieldId: "available_inputs",
          label: "Console or preamp inputs available",
          kind: "number",
          help: "Microphone and line inputs you can actually patch, including any stage box. Not the same number as recording channels.",
          required: false,
          unit: "inputs"
        },
        {
          fieldId: "monitor_mixes_needed",
          label: "Separate monitor mixes needed",
          kind: "number",
          help: "Count the distinct mixes performers have asked for in stage 3, not the number of wedges.",
          required: false,
          onlyFor: [
            "live",
            "music"
          ],
          unit: "mixes"
        },
        {
          fieldId: "monitor_mixes_available",
          label: "Separate monitor mixes available",
          kind: "number",
          help: "How many independent mixes the console and outputs can provide. If it is fewer than needed, someone shares, and they should know before the day.",
          required: false,
          onlyFor: [
            "live",
            "music"
          ],
          unit: "mixes"
        },
        {
          fieldId: "spare_inputs",
          label: "Spare microphones, DIs and cables",
          kind: "number",
          help: "Working spares beyond the input list, on site. Zero means the first failure is a missing input for the rest of the day.",
          required: false,
          unit: "items"
        },
        {
          fieldId: "storage_available",
          label: "Recording storage available",
          kind: "number",
          help: "Free space on the recording drive, and separately on the backup drive. Enter the smaller of the two.",
          required: false,
          unit: "GB"
        },
        {
          fieldId: "recording_hours",
          label: "Hours of material to be captured",
          kind: "duration",
          help: "Total hours the recorder will be rolling across all production days, including takes you will discard. Overestimate.",
          required: false,
          unit: "hours"
        },
        {
          fieldId: "backup_media",
          label: "How is the backup made and where does it go?",
          kind: "longText",
          help: "Second recorder, mirrored drive, or copy at the end of the night. Name the device, the owner and the second location. One copy is no copy.",
          required: true
        },
        {
          fieldId: "transport",
          label: "Transport",
          kind: "longText",
          help: "Vehicles, capacity, drivers and who carries what. Include how the media travels home and with whom.",
          required: false
        },
        {
          fieldId: "power_confirmation",
          label: "What has the venue or electrician confirmed about power?",
          kind: "longText",
          help: "What supply is available, where, and who confirmed it. Write what you were told and by whom; the qualified person owns the answer.",
          required: false
        },
        {
          fieldId: "resource_table",
          label: "Everything else, needed against available",
          kind: "table",
          help: "Rooms, stands, cables, headphones, playback systems, radios, vehicles. Mark each as owned, hired or venue-provided, and whether it is confirmed.",
          required: false,
          columns: [
            {
              columnId: "res_item",
              label: "Resource",
              kind: "text"
            },
            {
              columnId: "res_needed",
              label: "Needed",
              kind: "number"
            },
            {
              columnId: "res_available",
              label: "Available",
              kind: "number"
            },
            {
              columnId: "res_source",
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
              columnId: "res_confirmed",
              label: "Confirmed?",
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
        }
      ]
    }
  ],
  rules: [
    {
      ruleId: "schedule-soundcheck-no-linecheck",
      watches: [
        "schedule.day_schedule"
      ],
      severity: "attention",
      kind: "missing",
      title: "There is a soundcheck but no line check",
      detail: "A line check proves every input arrives at the console and the recorder before anyone is waiting on it. Without one, the first dead cable is found with the performers on stage and the clock running, and if the soundcheck is short, with the audience in.",
      fixHint: "Add a line check block after patching and before soundcheck, owned by the person who did the patching.",
      needsLogic: true,
      logicIntent: "Fire when day_schedule contains a soundcheck or performance block and no line_check block. Do not fire when a line_check block exists anywhere before the first soundcheck or performance block."
    },
    {
      ruleId: "schedule-no-setup-time",
      watches: [
        "schedule.day_schedule",
        "schedule.setup_contingency"
      ],
      severity: "attention",
      kind: "unrealistic",
      title: "There is no setup time, or setup assumes nothing goes wrong",
      detail: "Setup always takes longer than the sheet says, because the sheet was written without the missing adapter, the locked loading door and the stage that is not where the plot said. When nothing is planned for that, the time comes out of soundcheck.",
      fixHint: "Add load-in, setup and patching blocks with honest durations, and write down which later block shrinks if setup overruns and who makes that call.",
      needsLogic: true,
      logicIntent: "Fire when day_schedule has a performance block but no setup or load_in block, or when setup blocks exist and setup_contingency is empty. ccode may additionally compare total setup duration against the stage 1 source count and fire when it is implausibly short; ccode picks that relationship."
    },
    {
      ruleId: "schedule-no-breaks",
      watches: [
        "schedule.day_schedule",
        "schedule.hours_per_day"
      ],
      severity: "attention",
      kind: "unsafe",
      title: "A long day with no breaks",
      detail: "People stop working well long before they stop working. Mistakes late in a day without breaks are the expensive ones: the unlabelled take, the un-backed-up drive, the cable pulled under load. Working-hours rules where you are may also require them.",
      fixHint: "Add break blocks, and put them where the work allows rather than where the day ends up leaving space.",
      needsLogic: true,
      logicIntent: "Fire when hours_per_day or the sum of block durations exceeds a working span that ccode chooses, and day_schedule contains no break block."
    },
    {
      ruleId: "schedule-no-changeover",
      watches: [
        "schedule.day_schedule",
        "define.size_estimate",
        "define.performer_count"
      ],
      severity: "attention",
      kind: "missing",
      title: "Several acts or setups, and no changeover time",
      detail: "Every change of performers is a re-patch, a re-check and a re-balance. When it is not on the schedule, it happens anyway and the next act starts late, and the last act loses its set.",
      fixHint: "Add a changeover block between every act or setup, with a duration and an owner, and a line check inside it.",
      needsLogic: true,
      logicIntent: "Fire when the stage 1 size_estimate is more than one on the live pathway, or more than one performance block exists on any pathway, and day_schedule contains no changeover block. ccode may also fire when the number of changeover blocks is fewer than the number of performance blocks minus one."
    },
    {
      ruleId: "schedule-no-verification",
      watches: [
        "schedule.day_schedule"
      ],
      severity: "attention",
      kind: "missing",
      title: "No time to verify the files before everyone leaves",
      detail: "The moment to discover that a track did not record is while the performers and the equipment are still in the room. Once the strike starts, the missing file is a missing performance.",
      fixHint: "Add a file verification block after the last recording and before strike, owned by the media manager, long enough to open and check every file.",
      needsLogic: true,
      logicIntent: "Fire when day_schedule has a performance block and no file_verification block, or when the file_verification block comes after the strike or load_out block. Only on plans where recording is in scope: recording, live_recording or livestream_feed among the stage 1 services, or any pathway other than live."
    },
    {
      ruleId: "schedule-no-backup-window",
      watches: [
        "schedule.day_schedule",
        "schedule.backup_media"
      ],
      severity: "attention",
      kind: "missing",
      title: "No backup window, so the only copy travels home in one bag",
      detail: "Until a second copy exists in a second place, the whole production is one dropped bag or one failed drive away from never having happened. The backup takes time that has to be on the schedule, or it is skipped when the day runs late.",
      fixHint: "Add a backup block before strike, name the device and who carries it, and make sure the second copy leaves separately from the first.",
      needsLogic: true,
      logicIntent: "Fire when recording is in scope, as defined in the previous rule, and day_schedule contains no backup block or backup_media is empty. Do not fire when backup_media describes a simultaneous second recorder and a backup block is absent, if ccode can detect that; otherwise fire and let the user dismiss."
    },
    {
      ruleId: "schedule-no-contingency",
      watches: [
        "schedule.budget_lines"
      ],
      severity: "attention",
      kind: "missing",
      title: "No contingency in the budget",
      detail: "Something will cost more than quoted, or something unquoted will be needed on the day. Without a contingency line, the first surprise comes out of someone's fee, and it is usually the fee of whoever is closest to the problem.",
      fixHint: "Add a contingency line. The size is a judgement for you and the client; the existence of it is not.",
      needsLogic: true,
      logicIntent: "Fire when budget_lines has at least one row and no row has bl_category contingency, or the contingency row's amount is zero or empty. Do not suggest a percentage."
    },
    {
      ruleId: "schedule-budget-exceeded",
      watches: [
        "schedule.budget_lines",
        "schedule.budget_total"
      ],
      severity: "attention",
      kind: "conflict",
      title: "The lines add up to more than the budget",
      detail: "A plan that costs more than is available is a plan in which something will be cut, and if it is not cut now on purpose, it is cut on the day by whoever runs out of money first.",
      fixHint: "Reduce a line, drop something from the scope with the client's agreement, or have the cost approver from stage 3 raise the total in writing.",
      needsLogic: true,
      logicIntent: "Sum bl_amount across budget_lines and fire when the sum exceeds budget_total."
    },
    {
      ruleId: "schedule-channels-insufficient",
      watches: [
        "define.source_count",
        "schedule.available_channels",
        "schedule.available_inputs"
      ],
      severity: "blocker",
      kind: "unrealistic",
      title: "More sources than the equipment can capture",
      detail: "More sources than recording channels, or than console inputs, is a recording that cannot be captured as planned. Something on the input list will not be recorded, and it will be chosen at load-in by whoever notices first.",
      fixHint: "Add channels or inputs by hire, or reduce the source count with the artist's agreement, and update the input list to match.",
      needsLogic: true,
      logicIntent: "Fire when the stage 1 source_count exceeds available_channels, or exceeds available_inputs where that is set. Do not fire when source_count or available_channels is empty.",
      onlyFor: [
        "music",
        "live"
      ]
    },
    {
      ruleId: "schedule-no-spares",
      watches: [
        "define.source_count",
        "schedule.available_channels",
        "schedule.spare_inputs"
      ],
      severity: "attention",
      kind: "unrealistic",
      title: "Every input is accounted for and there is nothing to spare",
      detail: "A plan with no spare microphone, DI or cable, or with every channel already used, cannot survive the first failure. The fault is found during line check if you are lucky, and during the performance if you are not.",
      fixHint: "Bring working spares for the inputs that matter most, and leave a channel or two free for them.",
      needsLogic: true,
      logicIntent: "Fire when spare_inputs is zero, or when the stage 1 source_count equals or nearly equals available_channels; ccode picks what nearly means. Do not fire when the channels-insufficient blocker is already firing.",
      onlyFor: [
        "music",
        "live"
      ]
    },
    {
      ruleId: "schedule-storage-short",
      watches: [
        "schedule.storage_available",
        "schedule.recording_hours",
        "define.source_count",
        "deliver.session_sample_rate",
        "deliver.session_bit_depth"
      ],
      severity: "attention",
      kind: "unrealistic",
      title: "The recording may not fit on the drive",
      detail: "Storage runs out in the last hour, because that is when the drive is fullest. Multitrack recording at high sample rates fills drives faster than people expect, and the backup needs the same space again.",
      fixHint: "Work out the space the session needs from the channel count, sample rate, bit depth and hours, double it for the backup, and compare with the drives you actually have.",
      needsLogic: true,
      logicIntent: "Estimate the uncompressed PCM storage required as channels multiplied by sample rate multiplied by bit depth in bytes multiplied by recording seconds, using the stage 1 source_count, the stage 2 session sample rate and bit depth, and recording_hours. Treat 32-bit float as four bytes per sample. Compare with storage_available, allowing for a full second copy and for a margin that ccode chooses. Fire when the available space is insufficient. Do not fire when any input is missing."
    },
    {
      ruleId: "schedule-day-overruns",
      watches: [
        "schedule.day_schedule",
        "schedule.call_time",
        "schedule.hard_out",
        "schedule.hours_per_day"
      ],
      severity: "attention",
      kind: "unrealistic",
      title: "The blocks do not fit between call and hard out",
      detail: "A day whose blocks add up to more than the time available is not a schedule; it is a list of things that will be cut, in an order decided at the moment each one is reached.",
      fixHint: "Shorten or remove blocks with the schedule approver's agreement, move the call earlier if the venue allows it, or add a day.",
      needsLogic: true,
      logicIntent: "Sum blk_duration across day_schedule and compare with the span from call_time to hard_out, and with hours_per_day. Fire when the blocks exceed either. Parse clock times leniently, and do not fire when either time is unparseable."
    },
    {
      ruleId: "schedule-dates-do-not-fit",
      watches: [
        "schedule.production_date",
        "schedule.final_delivery_date",
        "schedule.milestone_list",
        "define.target_date",
        "deliver.review_rounds",
        "deliver.review_period",
        "define.services"
      ],
      severity: "attention",
      kind: "conflict",
      title: "The dates do not fit, or are out of order",
      detail: "A production or delivery date after the completion date in the brief, a gap too short for the agreed review rounds, or a milestone dated before the thing it depends on, is a plan that can only be met by skipping something that was promised. When a prerequisite moves, everything after it moves too.",
      fixHint: "Re-order the dates so every milestone follows what it depends on, move a date with the schedule approver's agreement, reduce the review rounds with the client's agreement, or remove a service from the scope.",
      needsLogic: true,
      logicIntent: "Fire when production_date or final_delivery_date is later than the stage 1 target date; when final_delivery_date is earlier than production_date; when the days between production_date and final_delivery_date are fewer than review_rounds multiplied by review_period from stage 2, with an allowance for editing, mixing and mastering when those services are in scope, which ccode picks; when a milestone_list row with ms_depends_on set is dated earlier than the milestone it names, matched loosely on type or notes; or when a location_access, equipment_prep, rehearsal or tech_rehearsal milestone is dated after production_date, or a media_transfer, review_period or final_delivery milestone is dated before it. Compare only dates that have been entered, and report which comparison failed."
    },
    {
      ruleId: "schedule-outdoor-no-backup-date",
      watches: [
        "define.location_type",
        "schedule.backup_date"
      ],
      severity: "attention",
      kind: "unrealistic",
      title: "An outdoor production with no backup date",
      detail: "Weather cancels outdoor productions, and the cost of a cancelled day is the whole day: crew, hire, transport and talent. If no date is held, the choice on the morning is between losing the production and working in conditions that are unsafe for people and equipment.",
      fixHint: "Hold a backup date with the venue, the crew and the talent, or record in writing that there is none and what a cancellation costs.",
      needsLogic: true,
      logicIntent: "Fire when outdoor is among the stage 1 location types and backup_date is empty."
    },
    {
      ruleId: "schedule-insurance-missing",
      watches: [
        "schedule.insurance_status",
        "schedule.permits_status"
      ],
      severity: "attention",
      kind: "legal",
      title: "Insurance or permits are not in place",
      detail: "Venues and clients commonly require proof of cover before load-in, and a permit that was never obtained can stop a production on the day. Which cover and which permits apply depends on where you are and what you are doing, and the time to find out is before the date is fixed.",
      fixHint: "Confirm with the venue, the client and your insurer what is required, and record the status honestly.",
      needsLogic: true,
      logicIntent: "Fire when insurance_status is Missing, Requested, Pending or Expired on the live pathway, or when permits_status is Missing, Requested, Pending or Expired on any pathway. Do not fire on Approved or Not required."
    }
  ],
  activity: {
    activityId: "save-the-production",
    title: "Save the production",
    prompt: "A three-act recorded show has been planned by someone who has never done one. There is one day, a short hard out, a schedule with no line check, no changeovers, no breaks and no backup, more inputs than the recorder has channels, and a budget with no contingency that already exceeds the total. Revise the schedule, the resources or the scope so the show can be recorded and delivered, without dropping the recording or any other required deliverable.",
    seed: {
      "define.size_estimate": 3,
      "define.source_count": 24,
      "define.services": [
        "reinforcement",
        "live_recording",
        "delivery_prep"
      ],
      "schedule.production_days": 1,
      "schedule.call_time": "16:00",
      "schedule.hard_out": "23:00",
      "schedule.hours_per_day": 7,
      "schedule.day_schedule": [
        {
          blk_type: "load_in",
          blk_start: "16:00",
          blk_duration: 30,
          blk_owner: "",
          blk_notes: ""
        },
        {
          blk_type: "soundcheck",
          blk_start: "16:30",
          blk_duration: 60,
          blk_owner: "Dana",
          blk_notes: "all three acts"
        },
        {
          blk_type: "doors",
          blk_start: "19:00",
          blk_duration: 30,
          blk_owner: "",
          blk_notes: ""
        },
        {
          blk_type: "performance",
          blk_start: "19:30",
          blk_duration: 180,
          blk_owner: "Dana",
          blk_notes: "three acts back to back"
        },
        {
          blk_type: "strike",
          blk_start: "22:30",
          blk_duration: 30,
          blk_owner: "",
          blk_notes: ""
        }
      ],
      "schedule.setup_contingency": "",
      "schedule.available_channels": 16,
      "schedule.available_inputs": 24,
      "schedule.spare_inputs": 0,
      "schedule.backup_media": "",
      "schedule.budget_total": 4000,
      "schedule.budget_lines": [
        {
          bl_category: "personnel",
          bl_description: "Crew, one engineer doing everything",
          bl_amount: 1200,
          bl_status: "estimated"
        },
        {
          bl_category: "venue",
          bl_description: "Room hire",
          bl_amount: 1500,
          bl_status: "quoted"
        },
        {
          bl_category: "equipment_rental",
          bl_description: "PA and console",
          bl_amount: 1400,
          bl_status: "quoted"
        },
        {
          bl_category: "transport",
          bl_description: "Van",
          bl_amount: 300,
          bl_status: "estimated"
        }
      ]
    },
    passWhen: "The day schedule contains setup, a line check before soundcheck, a changeover between each act, at least one break, a file verification block and a backup block before strike, and the blocks fit between the call and the hard out; the recording channels available are at least the source count, whether by hiring channels or by reducing inputs with the acts' agreement, and at least one spare is listed; a backup method is described; the budget lines include a contingency and total no more than the budget, or the total has been raised with a named approver; and the live recording remains in the services.",
    debrief: "Nothing you added was exotic. A line check, changeovers, a break, a verification window and a backup are the blocks every experienced crew writes in without thinking, and every first-time planner leaves out without noticing. The channel shortage was the only problem that cost money to fix, and it was also the only one that would have been discovered with the audience in. The pattern is that the omissions are cheap to fix on paper and ruinous to fix on the day, so the whole value of this stage is in finding them here. The seed amounts and times in this exercise are illustrative; your real numbers come from your quotes and your venue."
  }
};

# AP&E Glossary — Machine B · Additional Missing-Shorthand Terms (2026-07-25)

150 Booth-approved terms an audit found missing from the 14,249-term glossary. NEW terms — author from scratch, all 8 fields. Machine A inserts on return; you never touch the DB.

## Contents
```
HANDOFF_PROMPT.md   <- start the session with this
README.md           <- this file
MANIFEST.json       <- 16 packets: group, primary topic, difficulty, counts
ASSIGNED_TERM_IDS.txt <- the 150 term IDs (never change an id)
briefs/             <- AUTHORING / BRIEF_COMMON+AUDIO+COGNITION+LANGUAGE / EDITOR / REWRITE
tools/check_readability.py  <- THE GATE
packets/  add_01..add_16.json  <- each term: id, term, topic, topic_id, difficulty,
                                    cross_list_topics, empty_fields (all 8), optional authoring_note
authored_OUTPUT/  committee_OUTPUT/  corrected_OUTPUT/
```

## Packets
| # | Packet | Terms | Difficulty | Primary topic |
|---|---|---|---|---|
| 1 | radio_onair | 27 | intermediate | Broadcast / Radio Production & Air Chain |
| 2 | radio_imaging | 4 | intermediate | Broadcast / Radio Production & Air Chain |
| 3 | radio_traffic | 5 | intermediate | Broadcast / Radio Production & Air Chain |
| 4 | radio_dayparts | 4 | beginner | Broadcast / Radio Production & Air Chain |
| 5 | radio_scheduling | 13 | intermediate | Broadcast / Radio Production & Air Chain |
| 6 | radio_callin | 5 | intermediate | Broadcast / Radio Production & Air Chain |
| 7 | radio_transmission | 10 | intermediate | Broadcast / Radio Production & Air Chain (× Broadcast Loudness & Compliance) |
| 8 | vinyl_setup | 15 | intermediate | HiFi Consumer Audio |
| 9 | dac_clocking | 10 | advanced | Preamp & Converter Engineering |
| 10 | cables_power | 9 | intermediate | Cables & Wiring / Power Fundamentals |
| 11 | tubes | 6 | advanced | Vacuum Tubes |
| 12 | room_measurement | 14 | advanced | Audio Measurement & Optimization |
| 13 | headphones | 6 | intermediate | HiFi Consumer Audio |
| 14 | descriptors | 17 | beginner | Tonal & Timbre Descriptors |
| 15 | general | 2 | beginner | HiFi Consumer Audio |
| 16 | brand_features | 3 | intermediate | Dynamics Processing |

Topic/difficulty are pre-assigned by Machine A; keep them unless a term is clearly misfiled — if so, flag it in COMPLETION_NOTES, don't silently move it.

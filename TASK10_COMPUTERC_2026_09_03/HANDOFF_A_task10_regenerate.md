# DRAFT handoff to Computer A - Task 10 Decisions 1 and 3 (glossary root causes, off-domain terms)

Drafted by Computer C on 2026-09-03 from the Task 10 return. Computer C proposes; Computer A owns
generation; Professor Booth applies. Nothing here is applied. Where this draft states what a
corrected glossary record must say, the statement is sourced; where it says what the record
currently says, that is inferred from the quiz items generated from it (Computer C never saw the
glossary rows themselves) and Computer A should confirm against the live row before editing.

## 1. Scope

Machine-readable: `DECISION1_REGENERATE_SCOPE.json` (15 items, 3 glossary ids, 3 off-domain ids).

| glossary_id | term | items generated | flagged | cleared |
|---|---|---|---|---|
| 6bf82ba6-262b-43e6-8401-f94db4751cd6 | Sample-based Track | 5 | 5 (K2 x2, K3 x3) | 0 |
| e9c93b33-ce61-4837-931a-73ff307d18db | HEAT | 5 | 3 (K2 x3) | 2 |
| cae583a0-ae18-4feb-b146-6d6783b2bf74 | HEAT (second entry) | 5 | 3 (K2 x1, K3 x2) | 2 |

The decision doc's "~10 affected items" undercounts: 15 items are generated from these three
entries. The four CLEARED items cleared because their text never touched the false claim; if the
route is regenerate-from-corrected-glossary they are in scope too, otherwise they can stand.
Two glossary entries for one product (HEAT) is itself a finding: e9c93b33 and cae583a0 should
probably be merged or one retired; Computer A to check the headwords.

## 2. What the corrected records must state (sourced)

### 6bf82ba6 - Sample-based Track

Current definition, as inferred from its items: a track built by arranging or triggering
recorded samples (one-shots, loops). That is not what the term means in DAW usage.

Must state: a sample-based track is a track whose timebase is absolute time (samples). A clip
placed on it stays at its absolute time position when the session tempo changes, so it no longer
lines up with the bars and beats; the paired opposite is a tick-based track, whose clips stay at
their Bar|Beat position and move in absolute time when tempo changes. In Pro Tools, audio tracks
default to sample-based and MIDI tracks are tick-based; the timebase can be chosen at creation or
changed later. Sources: Avid, "Tick-Based and Sample-Based Time"
(https://apps.avid.com/ProToolsFirstHelp/version2018.4/enu/concepts.5.16.html) - "if an audio or
MIDI clip is located at a particular Bar|Beat location, it will not move from that Bar|Beat
location if the tempo changes" (tick-based) and "You can select whether a track is sample-based or
tick-based when it is created, or change timebases later"; Sound On Sound, "Pro Tools: Tick-based
Audio Tracks" (https://www.soundonsound.com/techniques/pro-tools-tick-based-audio-tracks) - on a
sample-based track "when you place a region at a certain point on the timeline, that's where it
stays until you move it", and sample-based is the default for audio tracks.

Must not state: anything about samplers, one-shots, loops or "building a track from samples".
The set's own Tick-based Track glossary entry (13dc5329-b5d4-41c0-8923-0382df82f73d) already
uses the correct sense; the two entries should read as a pair.

Consequence for the items: all five stems and keys were written around the wrong sense (a
beatmaker triggering one-shots, a producer using string loops). They cannot be patched into
correctness by editing one field; regenerate.

### e9c93b33 and cae583a0 - HEAT

Current definition, as inferred: "Harmonically Enhanced Algorithm Technology", adds analog-style
harmonic saturation across the Pro Tools mixer, with Drive and Tone "adjusted per channel".

Must state: HEAT is Avid's Harmonically Enhanced Algorithm Technology, an option for Pro Tools
that adds analog console-style harmonic saturation across the mixer. Drive and Tone are
**global** controls in the master section: "HEAT provides global controls for Drive and Tone.
These affect all audio tracks where HEAT is not bypassed." The only per-track controls are Bypass
(BYP), Pre/Post insert placement (PRE), and a meter showing the amount of HEAT processing on that
track. HEAT affects audio tracks only: "It is not applied to Instrument, Auxiliary Input, or
Master tracks." Drive "emulates the distortion you get when overdriving an analog channel strip on
a console"; Tone adjusts the character from darker (left) to brighter (right). Source: Avid,
HEAT Option Guide (https://learn-cdn.avid.com/doc/HEAT_Option_Guide.pdf).

Must not state: per-channel Drive or Tone; application to aux or master tracks.

Consequence for the items: the two K2s whose keyed option is right but whose stem/explanation
carries the per-channel claim (980c54ab, 864fe98c, b816a23b) can be patched by the filed fixes;
e6a9ea72's keyed option itself carries the claim and needs the paired correct_answer update
already annotated. Regeneration from a corrected record is cleaner and also fixes the two
orphan stems (60370455 "this technology", 01413678 "this Avid mixer option") that never name
HEAT.

## 3. Off-domain terms (Decision 3)

Three Part B question ids whose subject is not audio. The Part B slices carry no glossary_id;
resolve to glossary rows by question id.

- f572fc96-c417-4188-b2bb-2476bc017840 - asteroseismology: "g-mode cavity ... period spacing ...
  core diagnostics". Stellar physics.
- e49c6600-9462-4368-92bd-444acec67f92 - seismology: volcanic tremor in a one-to-a-few-hertz band.
- fc740207-98dd-469a-a80d-3457bbcd5e44 - seismology: an arrival travelling at the speed of sound
  in rock.

Recommendation: retire the glossary rows and their items unless the curriculum owner confirms a
place for them (a plausible one for the seismology pair is none; "seismic record" and "arrival"
are geophysics vocabulary). If retiring, the Part B leak rewrites for these ids become moot.

## 4. Order of operations

1. Correct the three glossary rows (or merge the two HEAT rows).
2. Regenerate the 15 scoped items; run them through the Task 10 coherence read before staging
   (Computer C can do that read on the regenerated set - it is 15 records).
3. Withdraw the 11 item-level fixes filed for these ids from the mechanical package so they are
   not applied on top of regenerated text. Ids: 18aa913d, b9390688, 17c618e1, 4be2b53c, 85f8a5a6,
   980c54ab, 864fe98c, b816a23b, e6a9ea72, 60370455, 01413678.
4. Decision 3 rows: retire or reassign; then drop their three Part B entries (or apply, if kept).

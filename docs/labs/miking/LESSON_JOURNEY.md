# Miking Labs: the LESSON JOURNEY (the standard for every lesson, Labs 1–7)

Written 2026-10-04 on branch `final-lab`, after the owner used the Kick Drum lesson (M01)
on the Pixel. Design run on Opus 5.5 at high effort (D56). It sits under the rules in
`AGENTS.md`, `docs/APE_LAB_VISUAL_CHARTER_2026_10_04.md` and `ENGINE_BLUEPRINT.md`; where
they differ, the stricter rule wins. Kick Drum (M01) is the first lesson built to it.

> **Owner, 2026-10-04 (binding):** "The user interaction begins too early — there needs to
> be an understanding of the instrument, the sounds, the layout, then finally the miking and
> all options. The entire lab user experience needs to be shaped from intro to advanced for
> cognitive (NEW) learning and advanced (EXISTING) outcomes. The illustrations are quality and
> pass at this standard. Keep up the high quality imagery."

Standing rulings that still apply to every stage: **fully silent** (no audio, ever: "the
sounds" means how the instrument PRODUCES and RADIATES sound, shown visually with real
physics, never played); members only; credit like the other labs and never removed; trial
numbers shown and labelled; no institutional wording; no upsell to members; labs never block
navigation; every lab ends with a "what's left" screen.

---

## 1. The journey at a glance

Eight STAGES, ten PAGES. A stage is a teaching idea; a page is a unit on the lab strip
(`LabNavBar`), with its own steps, credit and what's-left row.

| # | Stage | Page id (strip title for Kick) | What the learner does | Credit (banks on the event) |
|---|---|---|---|---|
| 1 | ORIENT | `instrument` (Meet the kick drum) | Chooses NEW or EXPERIENCED. Reads what the instrument is, where it is used, its job. Explores the parts freely (tap to name). **No tasks.** | On NEXT from the page's last step (nothing to answer). |
| 2 | HOW IT SOUNDS | `sound` (How it makes its sound) | Watches a strike become sound, step by step (user-started). Explores the head's vibration shapes and the two heads coupled by the air. Then 3 checks. | The strike sequence reached its end + 3 checks. |
| 3 | THE SETTING | `setting` (Where it sits) | Explores the kit around the instrument, the player's space, a stage (monitors, audience side) and a studio. Reads "before any mic" (ask the player, hearing). Then 3 checks. | 3 checks. |
| 4 | MICROPHONES | `microphone` | Predicts, then sweeps a source round a pattern; reads the mic types by property for THIS source. Checks (one reaches back to stage 2). | Checks. |
| 5 | PLACEMENT, guided then free | `placement` | WATCH: a worked example reads one documented position piece by piece. PLACE: the learner rests a mic in two documented zones. Checks (one reaches back to stage 3). | Two zones rested in, clear + checks. |
| 6 | ADVANCED | `context` (Studio or live), `twoMic` (Two microphones), `troubleshoot` | Aim a pattern's rejection at a fixed monitor; two mics, delay vs polarity; symptoms → first checks. | As before (review fixes kept). |
| 7 | PRACTICE / ASSESS | `practice` | The setup in order; two briefs where several setups pass and the REASONS are graded; a mixed review drawn from every stage. | All items. |
| 8 | SOURCES | `sources` | Where every number comes from; what is unknown; where the lab differs from the lesson text. | On NEXT / FINISH. |

Stages 1–3 are the **FOUNDATIONS**. Nothing on stages 4–7 asks the learner to operate a mic
until the foundations are met (§3.3), and nothing on stages 1–3 asks them to place one.

---

## 2. Two learners

### 2.1 NEW (the default)
The full path, in order, scaffolded: one idea per step, worked examples before practice,
help that fades as the stages go on (§4). A learner who never chooses is treated as NEW.

### 2.2 EXPERIENCED
Someone who already mics this instrument. They take an **honest short check** (the QUICK
CHECK) and, if it shows the foundations are there, the activities on stages 4–7 open at once.
They can go back to any page at any time.

### 2.3 How the choice is offered
- On the first step of page 1 (START), before anything else: the journey map (the 8 stages,
  one line each) and two buttons:
  - **"New to miking a [instrument]? Start at the beginning."**
  - **"Already mic [instruments]? Take the quick check to go straight to the microphones."**
- The words name what each choice COSTS, never what it forbids (the never-block rule).
- The choice can be changed at any time from the same step ("Change how you started").

### 2.4 How it is remembered
On the lesson's own progress record (`ape:miking:v1`, `createLocalStore`), per lesson:
- `path: 'new' | 'experienced'` — kept through a practice reset (it is a preference);
- `diag: { right, total, pass, misses[] }` — the quick check's result for THIS practice run;
  START OVER (PRACTICE) clears it, like answers and activities.
A guest's choice is held for the sign-in hand-off like the rest of their work (`holdSessionWork`);
a members-only preview remembers it only on screen (preview earns and keeps nothing).

### 2.5 The quick check (rules every lesson follows)
- **6 items**, all from the FOUNDATIONS (2 per foundation page), never from the pages it
  unlocks — it checks what a skipper would miss, not what they are about to practise.
- At least one item is **critical** (safety: hearing, or clearance/the player's space). A
  wrong critical item fails the check whatever the score.
- **Pass = at least 5 of 6 right on the first pick, and every critical item right.**
- One pick per item; no retry inside the check (a retry would turn it into a guessing game
  with three options). Each pick shows the explanation at once — a wrong pick still teaches.
- **One attempt per practice run.** A learner who does not pass is shown which foundation
  pages to open (the `misses`), and the NEW path is suggested. Working through those pages
  meets the foundations anyway, so nothing is ever locked for good.
- Items follow the item-writing rules of §5 (same length, real misconceptions, a "why" for
  every wrong option, no brand recall, no absolute-word giveaways).

### 2.6 Credit for each learner (skipping never inflates credit)
- A page is credited only by ITS OWN requirement, on the event. Passing the quick check
  **banks nothing**. The foundation pages stay "not yet" on the what's-left screen, marked
  "Skipped with the quick check — open it to earn its credit."
- Lesson complete = every page credited, for both learners. An experienced learner earns the
  foundation pages the same way (quickly, if they know it).
- Credit only grows; START OVER (PRACTICE) keeps every credited page (owner 2026-09-29).
- Tests pin this: a passed quick check leaves `done` unchanged (`test/mikingJourney.test.ts`).

---

## 3. How the journey sits on the existing kit

### 3.1 Pages and steps
- Each page is a unit on `LabNavBar` (`useLabNav` with `sub` steps), exactly as before.
  The strip reads `MODULE n · STEP i / k` (the house noun; review m1 stays an owner call).
- A page is a run of steps (`engine/steps.tsx`): a **rack** step (a live display: the Rack
  Unit, display pinned above, the well scrolling between, controls docked below, FULL SCREEN
  on) or a **read** step (prose and static figures only).
- The page GOAL prints at the head of the first step; the TAKEAWAY and the credit line at the
  tail of the last step (unchanged).

### 3.2 What's left and credit
- `LabEndScreen` (mode `progress`, noun `page`) lists all ten pages with their requirement,
  the first-try hint (review m7) and, for a foundation page skipped by the quick check, the
  "Skipped with the quick check" line. Jumping from it opens that page.
- The hub counts `n of 10 pages`.

### 3.3 The FOUNDATIONS gate, and why it does not block navigation
- **Navigation is never blocked.** NEXT, PREV, CONTENTS and the what's-left jumps work on
  every page, always (owner 2026-09-20).
- What waits is the **activity**: on a page after the foundations, a learner whose
  foundations are not met sees a **Foundations card** in place of the page's activity. It
  says what the page builds on, lists the three foundation pages with ✓ / not yet and a
  one-tap OPEN for each, and offers the quick check. It never says "locked"; it says what
  the page needs and how to get there in one tap.
- **Foundations met** = each of `instrument`, `sound`, `setting` is credited (stored, or met
  in this session — so a guest and a preview are judged by what they did on screen), OR the
  quick check was passed in this practice run.
- `sources` is never gated (it is reference, not practice).
- This is the study-method gate the owner asked for ("understanding … then finally the
  miking"), in the same family as the Dashboard power sequence; it is NOT a navigation lock.

### 3.4 The web preview harness
`#labpreview/MikingLesson/M01?page=<id>` opens a page; `&unlock=1` (DEV + web only, never
the production router) treats the quick check as passed so a capture can reach any stage.

---

## 4. Cognitive principles, applied explicitly

| Principle | What it means here | Where it is applied |
|---|---|---|
| **Pre-training** | Teach the names and the evidence labels before the complex scene. | ORIENT names every part and defines SOURCED / TRIAL READING / ILLUSTRATIVE / IDEAL MODEL before any mic appears (HowToRead). |
| **Segmenting** | One idea per step; the learner sets the pace. | HOW IT SOUNDS is a stepped sequence the learner advances (or plays once); no step adds more than 4 new ideas (§6). |
| **Signalling** | Point at what matters now. | The journey map on START; each step's one-line prompt; the active part highlighted; the explanatory overlay numbers the events 1–4. |
| **Coherence** | Cut what does not serve the step. | No mic in stages 1–3; no readouts that the step does not use; source codes only on the Sources page. |
| **Worked example → fading** | Show a full solution, then hand over parts of it. | PLACEMENT opens with WATCH (a documented position read piece by piece, the mic placed for the learner); PLACE then asks for two zones with the zone card as help; ADVANCED gives a prediction but no walkthrough; PRACTICE gives only the brief. |
| **Prediction before reveal (try before tell)** | Commit, then see. | An ungraded PREDICT FIRST card before every activity from HOW IT SOUNDS on (kept from review M1). |
| **Retrieval practice, spaced across stages** | Recall later, mixed with new material. | Each page from MICROPHONES on carries one "FROM EARLIER" check that reaches back to a foundation stage; PRACTICE ends with a mixed review across every stage. |
| **Productive failure only after foundations** | Struggle helps only once the basics are there. | Open activities (free placement, aiming a null, the two-mic pair, the setup briefs) sit after the foundations gate. |
| **Elaborated feedback** | A wrong answer is answered with why. | Every wrong option has its own `why` (review M2), in checks AND in the quick check. |
| **Expertise reversal** | Scaffolds that help novices slow experts down. | The EXPERIENCED path skips the foundations activities once the quick check shows they are there. |
| **Dual coding with honest labels** | Pictures and words carry the same facts. | Every canvas carries a screen-reader description; every overlay is labelled as an overlay; every number names its source or its model. |

---

## 5. Item-writing rules (every check, quick check and practice item)

Kept from review C1 and tested (`test/mikingReviewFixes.test.ts`, `test/mikingJourney.test.ts`):
- the correct option is never more than 1.6× the mean length of the others, and is the
  longest in at most a quarter of the items;
- wrong options are real misconceptions, without "always / any / never / every";
- no option asks to recall a model name or a brand;
- every wrong option has its own explanation;
- items test reasoning, not the recall of a number.

---

## 6. Each stage in detail

Max new concepts = the most new ideas any ONE step of the stage introduces.

### Stage 1 — ORIENT (`instrument`)
- **Objective:** the learner can say what the instrument is, where it is used, what job it
  does in the music, and name its parts — before any microphone.
- **On screen:**
  1. START (read): the journey map; NEW / EXPERIENCED; the quick check (experienced only).
  2. WHAT IT IS (read): a large static drawing of the instrument, and four short facts with
     their sources (what it is, where it is used, its job, its size range).
  3. THE PARTS (rack): the instrument from the side and from above, cut open; tap a part (or
     step through PART) to name it and read what it does; the front-head choice
     (ported / intact); HOW TO READ THIS LAB.
- **Interaction allowed:** tap, step, switch view, switch the front head. No mic. No task.
- **Max new concepts:** 4 (step 2: what, where, job, size).
- **Check:** none (exploration only). The facts come back in the quick check and in later
  "from earlier" checks.
- **Exit:** NEXT from THE PARTS banks the page.

### Stage 2 — HOW IT SOUNDS (`sound`)
- **Objective:** the learner can explain how a strike becomes sound and where it leaves the
  instrument, and tell attack from body (resonance).
- **On screen:**
  1. STRIKE TO SOUND (rack): the instrument cut open, with a numbered EXPLANATORY OVERLAY —
     1 the beater strikes the batter head; 2 the head is pushed in; 3 the air inside pushes
     the front head out (and, with a port, some air leaves through it); 4 sound leaves from
     both heads and the port. Head motion is drawn as a displaced outline in the ideal
     membrane's lowest shape, **exaggerated**, with the rest position still drawn. Controls:
     STEP (1–4), PLAY ONCE (a staged reveal that stops at 4 — not a loop), FRONT HEAD.
  2. THE HEAD'S SHAPES (rack): the batter head face-on, showing one vibration shape of an
     IDEAL clamped membrane — J_n(j_ns·r/R)·cos(nθ), the Cymatics Lab's and the Drum Tuning
     Lab's own Bessel tables — with its still lines drawn, + and − regions, its frequency
     ratio to the lowest shape (1, 1.59, 2.14, 2.30, 2.65), and how much of the shape's peak
     motion sits under the beater. Controls: SHAPE, STRIKE (centre, 1 in, 2 in above — the
     DW pedal manual's range), SWING (drag the shape through its cycle by hand).
  3. TWO HEADS, ONE AIR (rack): the two heads' lowest shape coupled through the enclosed air
     (the two-headed-drum model the Drum Tuning Lab uses): "heads together" (the lower of the
     pair; the air is carried along) and "heads opposed" (the higher; the air is squeezed).
     SWING by hand.
  4. ATTACK AND BODY (read): attack = the beater's brief contact, from the strike area; body
     = the heads, air and shell ringing, leaving mostly through the front head and the port.
     In WORDS (no curve, no invented time scale). Then the checks.
- **Interaction allowed:** step, play once, pause, swing by hand, choose shape / strike /
  front head. No mic.
- **Max new concepts:** 4 (step 1).
- **Check:** 3 items (where resonance leaves; why a centre strike drives only ring shapes;
  why port air can pop a mic).
- **Exit:** the strike sequence reached step 4 + the checks.
- **Motion rules (charter §5, binding):** user-started; pausable; every state reachable by
  STEP; PLAY ONCE becomes instant steps under reduced motion; nothing loops (D8 — no
  `withRepeat`, `useFrameCallback`, `setInterval`); the overlay never claims speed or amount
  ("the order of events, not their speed"); displacement is labelled EXAGGERATED and logged
  in the simplifications register.

### Stage 3 — THE SETTING (`setting`)
- **Objective:** the learner knows where the instrument sits — its neighbours, the player's
  space, what a stage adds (monitors, the audience side, the PA) and what a studio adds —
  and what to do before any mic (ask the player, protect hearing).
- **On screen:**
  1. ON THE KIT (rack): a plan (from above) of the instrument with its neighbours and the
     player's space; tap a neighbour to read what it means for a mic on this instrument
     (spill, cable route, keep-out). Positions are ILLUSTRATIVE and say so.
  2. STAGE AND STUDIO (rack): the same plan with STAGE (the drummer's fill, a downstage
     wedge, the audience side) or STUDIO (the room, no monitors) — the same fixed monitor
     positions the ADVANCED stage uses, so the picture the learner meets later is familiar.
  3. BEFORE ANY MIC (read): ask the player (head intact or ported, what the instrument should
     do); hear it unamplified; hearing safety (NIOSH); then the checks.
- **Interaction allowed:** tap, step, switch stage/studio. No mic.
- **Max new concepts:** 4 (step 2).
- **Check:** 3 items (the intact-head options; a mic's max SPL is not a hearing limit; where
  the player's monitor sits relative to the instrument).
- **Exit:** the checks.

### Stage 4 — MICROPHONES (`microphone`)
- **Objective:** choose a mic by its properties for THIS source (pattern, power, size, mount).
- **On screen:** PREDICT FIRST → COMPARE (rack: sweep a test source round the pattern) →
  BY PROPERTY (read: three plain lines per type, spec details behind a toggle) → CHECK.
- **Interaction:** sweep, choose type / pattern. Mic only on the polar display, not on the
  instrument.
- **Max new concepts:** 3.
- **Check:** the existing four + one FROM EARLIER (stage 2: what a mic near the struck head
  mostly hears).
- **Exit:** the checks.

### Stage 5 — PLACEMENT, guided then free (`placement`)
- **Objective:** place a mic in a documented zone, measured from its named head, aimed as the
  source says, clear of every moving part.
- **On screen:**
  1. WATCH (rack, worked example): the mic is placed FOR the learner at a documented starting
     point; STEP walks through reading it — 1 the source and its zone; 2 the head it is
     measured from; 3 the distance band; 4 off the beater line; 5 the aim; 6 clearance.
     The bezel cell for the current piece is the one the well explains.
  2. PLACE (rack, faded): PREDICT FIRST, then the learner rests the mic in two different
     documented zones (drag, or POSITION / AIM with no drag; ZONE jumps).
  3. HOW ZONES WORK (read) → CHECK.
- **Max new concepts:** 3 per step.
- **Check:** the existing three + one FROM EARLIER (stage 3: the player's space).
- **Exit:** two zones + the checks. The worked example earns nothing (its own rig).

### Stage 6 — ADVANCED (`context`, `twoMic`, `troubleshoot`)
Unchanged in substance (every review fix kept): studio vs live with a FIXED monitor and the
learner aiming the mic; two mics with delay vs polarity and the ideal comb; symptoms. Each of
`context` and `twoMic` opens with PREDICT FIRST (no worked example: the help has faded).
`context` adds one FROM EARLIER check (stage 2: the front head and port radiate).

### Stage 7 — PRACTICE / ASSESS (`practice`)
The setup in order, the gain judgement, two briefs where several setups pass and the reasons
are graded, the second-channel card, and the mixed review reaching back across the stages.

### Stage 8 — SOURCES (`sources`)
The evidence audit, references with links, the unknowns and the corrections, in words.

---

## 7. HOW IT SOUNDS for the other families (rules for Labs 1–7)

The stage is always present; its PHYSICS comes only from a model the app already has, or it
is in words.

| Family | Visual from real physics (reuse) | In words only (until a model exists) |
|---|---|---|
| Membranes (drums, hand drums, timpani) | Ideal clamped-membrane shapes and ratios (`features/cymatics/membrane.ts` Bessel tables, via `engine/physics/membrane.ts`); the two-head air coupling; strike-point excitation. Timpani: Rossing's measured principal ratios (already in the Cymatics model). | Decay times, beater "click" spectra, shell contribution. |
| Plates and bars (cymbals, mallets) | Plate/bar mode shapes from `features/cymatics/plateModes.ts` where the shape fits. | Cymbal wash and non-linear build-up. |
| Strings (guitar, piano, violin) | Standing waves on a string (fixed ends, harmonics) — a model to add, pure and tested, before it is drawn. | Body/soundboard radiation patterns. |
| Air columns (winds, brass) | Open/closed pipe standing waves; "sound leaves from the first open holes" (Lab 3 correction). | Bell directivity at a given frequency. |
| Voice, speakers, Leslie | The loudspeaker cone stages from `membrane.ts` (piston, breakup) where relevant. | Formants and directivity. |

Never: a played sound; a frequency curve presented as data; motion that implies a speed or a
level the model does not compute; a loop that runs by itself.

## 8. THE SETTING for the other families

Always a plan (from above) at the source's real scale, with neighbours as ILLUSTRATED real
objects (never boxes or circles), the player's space drawn as an ILLUSTRATIVE keep-out, and
STAGE / STUDIO variants that reuse the lesson's monitor positions. Every position without a
source is tagged ILLUSTRATIVE. Lab 1's drum lessons share one kit plan
(`lessons/shared/kitPlan.ts`); a lesson highlights its own drum.

---

## 9. What a lesson author supplies (the data contract)

`Lesson` (engine/model/types.ts) gains:
- `orient`: the four ORIENT facts (what, where, job, size), each with its source key;
- `sound`: the strike-sequence stages (title + one sentence each, per front-head variant
  where it differs), the radiating surfaces, the attack/body words;
- `setting`: the neighbours (id, label, what it means for the mic, provenance) and the
  stage/studio notes;
- `diagnostic`: the 6 quick-check items (`covers` = the foundation page each one tests,
  `critical` for safety items);
- pages for all ten ids, with credit lists that validate (`validateLesson`).

## 10. Tests that pin the journey (`test/mikingJourney.test.ts`)

- PAGE_IDS order puts the three foundations first and `sources` last; every stage maps to
  pages that exist.
- NEW path: no page with a placement/aiming/pairing task is open before ORIENT + HOW IT
  SOUNDS + THE SETTING are met; `sources` is never gated.
- The quick check: 6 items, all from foundation pages, at least one critical; pass needs
  ≥ 5 of 6 and every critical item; one attempt per run; a passed check opens the activities.
- Skipping never inflates credit: recording a passed check leaves `done` untouched; lesson
  complete still needs every page.
- ORIENT has no credited task; HOW IT SOUNDS and THE SETTING have checks; every page from
  MICROPHONES to ADVANCED carries a FROM EARLIER item from a foundation stage.
- HOW IT SOUNDS: the membrane shapes are the Bessel-zero ratios; a centre strike drives only
  n = 0 shapes; no miking file is a loop host.
- The quick-check items follow the item-writing rules (§5).

## 11. Open questions for the owner

1. **Diagnostic threshold** — 5 of 6 with every safety item right, one try per practice run.
   Stricter (6 of 6) or looser?
2. **Attack vs body as a picture** — the Drum Tuning Lab's synthesis could draw a MODEL
   waveform of a kick strike (labelled MODEL, never played). It is a synthesis with model
   constants, not a recording, so this build keeps attack vs body in WORDS. Your call.
3. **Kit layout** — the neighbours' positions are a typical right-handed layout (tagged
   ILLUSTRATIVE); left-handed players mirror it. A drummer's review of the plan is wanted.
4. **Existing credit** — the lesson grew from 8 to 10 pages. Credit already earned stays;
   a lesson that was complete at 8 now reads 8 of 10 until the two new pages are done.

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
physics, never played); members only; credit like the other labs and never removed;
**suggested starting points, never dogma — no sources or evidence badges on screen** (owner
ruling 2026-10-04, §12); no institutional wording; no upsell to members; labs never block
navigation; every lab ends with a "what's left" screen.

> **Owner, 2026-10-04, after approving the Kick lesson (binding):** "We are teaching general
> suggestive starting points. Nothing is to be taught as strict dogma … remove all of the
> references and authoritative honesty points by just stating 'after our research, here is
> where we recommend to begin, and ideas and concepts to consider' … The cross-referencing is
> too much a distraction. Illustrations are fine — keep this level of illustration and
> animation quality for ALL labs." Kick (M01) is APPROVED as the quality standard.

---

## 0. The 2026-10-06 restructure (owner, binding)

> **Owner, 2026-10-06:** "We need to be careful with this whole idea of 'where it sits' … it
> is too generic and is more about stage position than mic position. The labs need to be
> about miking." And: "nowhere do I actually see mics set up or shown as an example, and
> that is the goal of the lab."

What changed (all 79 lessons, engine-level — `engine/restructure.ts`, `engine/setups.ts`,
`engine/compose.tsx`; no lesson had to be rewritten to be served this way):
- **"Where it sits" (`setting`) is gone as a page.** What in it changes a MIC decision —
  the neighbours that bleed into the mic, the player's clearance, live versus studio, an
  amplified source's mic-or-DI path, and "before any mic" (ask the player, hearing) — is now
  on STARTING SETUPS as mic decisions. The plans of the stage and the studio are dropped.
- **ORIENT + HOW IT SOUNDS are one shorter page, MEET IT — WHERE THE SOUND COMES FROM**: what
  it is, its parts, and where the sound leaves (the steps that were physics only — vibration
  shapes, the air column, the valves, a pickup's string — are left out: `MEET_DROP`).
- **New: STARTING SETUPS**, right after MEET IT: real setups DRAWN ON THE INSTRUMENT, one at
  a time — the mic, its stand / boom / clip, its aim (amber), its distance as a dimension
  (white). ONE MIC, TWO MICS, CLOSE · LIVE, FARTHER BACK · STUDIO (each only where the lesson's
  research gives one), then the lesson's other starting points (ANOTHER START). Each card:
  name, mic type and pattern, where to start (distance and aim), one line on what it tends
  to do and its trade-off. Built from each lesson's own zones, two-mic data and (where its
  two-mic pair lived only in its art) a logged `setupPairs` entry — never invented
  (CORRECTIONS_LOG.md R-06).
- **MICROPHONES** opens with the chosen mic drawn ON the instrument where the lesson starts it.
- **The PLACEMENT STUDIO starts from a setup**: START (dock) — "Start from: …" — the last
  setup looked at, or any other.
- **One standard line, word for word, on MEET IT, STARTING SETUPS and the Placement Studio:**
  "These are suggested starting points, not rules. Put the mic up, listen, move it, and
  adjust — your ears and the room decide." (`journey.STANDARD_LINE`)
- The Miking display is taller where the window allows (owner answer A, §3.1a); labels stay
  simple (owner answer C: no priority tags); the piano's long dynamic under the short-stick
  lid keeps its ~15 cm start (owner answer B, §6 stage 2).

## 1. The journey at a glance

Six STAGES, eight PAGES. A stage is a teaching idea; a page is a unit on the lab strip
(`LabNavBar`), with its own steps, credit and what's-left row.

| # | Stage | Page id (strip title) | What the learner does | Credit (banks on the event) |
|---|---|---|---|---|
| 1 | MEET IT | `meet` (Meet it — where the sound comes from) | Chooses NEW or EXPERIENCED. What the instrument is, its parts (tap to name), and where its sound leaves — the places a mic hears it best. Shown, never played. | Its where-the-sound-leaves checks. |
| 2 | STARTING SETUPS | `setups` (Starting setups) | Steps through real setups drawn on the instrument; reads what else the mic hears (neighbours, clearance, stage or studio); "before any mic"; checks. | Every ONE / TWO / CLOSE / FARTHER setup looked at + the checks. |
| 3 | MICROPHONES | `microphone` | The chosen mic drawn on the instrument; then predict, sweep a source round a pattern, the types by property; checks. | Checks. |
| 4 | PLACEMENT STUDIO | `placement` | WATCH a worked example; then START from a setup, move the mic, rest it in two zones, see what changes; checks. | Two zones + checks. |
| 5 | ADVANCED | `context`, `twoMic`, `troubleshoot` | Aim a pattern's rejection at a fixed monitor; two mics, delay vs polarity; symptoms → first checks. | As before. |
| 6 | PRACTICE / ASSESS | `practice` | The setup in order; briefs where several setups pass and the REASONS are graded; a mixed review. | All items. |

Stages 1–2 are the **FOUNDATIONS**. Nothing on stages 3–6 asks the learner to operate a mic
until the foundations are met (§3.3); STARTING SETUPS DRAWS mics but never lets one be moved.

**Lessons are WRITTEN in nine source pages, SERVED as eight.** The 79 lessons keep their
`instrument`, `sound` and `setting` page words and checks; `engine/restructure.ts` builds
MEET IT from the first two and STARTING SETUPS' checks from the third. A check about a step
MEET IT no longer shows is retired from the page and its credit (`RETIRED`, reviewed one by
one); a retired quick-check item is replaced by one of the lesson's own MEET IT checks, so the
check stays six items. A lesson written to the new journey may give `pages.meet` /
`pages.setups` itself.

---

## 2. Two learners

### 2.1 NEW (the default)
The full path, in order, scaffolded: one idea per step, worked examples before practice,
help that fades as the stages go on (§4). A learner who never chooses is treated as NEW.

### 2.2 EXPERIENCED
Someone who already mics this instrument. They take an **honest short check** (the QUICK
CHECK) and, if it shows the foundations are there, the activities on stages 3–6 open at once.
They can go back to any page at any time.

### 2.3 How the choice is offered
- On the first step of page 1 (START), before anything else: the journey map (the 6 stages,
  one line each) and two buttons:
  - **"New to miking a [instrument]? Start at the beginning."**
  - **"Already mic [instruments]? Take the quick check to go straight to the microphones."**
- The words name what each choice COSTS, never what it forbids (the never-block rule).
- The choice can be changed at any time from the same step ("Change how you started").

### 2.4 How it is remembered
On the lesson's own progress record (`ape:miking:v1`, `createLocalStore`), per lesson:
- `path: 'new' | 'experienced'` — kept through a practice reset (it is a preference);
- `quick: { right, total, pass, misses[] }` — the quick check's result for THIS practice run;
  START OVER (PRACTICE) clears it, like answers and activities.
A guest's choice is held for the sign-in hand-off like the rest of their work (`holdSessionWork`);
a members-only preview remembers it only on screen (preview earns and keeps nothing).

### 2.5 The quick check (rules every lesson follows)
- **6 items**, all from the FOUNDATIONS (MEET IT and STARTING SETUPS), never from the pages it
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
- `LabEndScreen` (mode `progress`, noun `page`) lists all eight pages with their requirement,
  the first-try hint (review m7) and, for a foundation page skipped by the quick check, the
  "Skipped with the quick check" line. Jumping from it opens that page.
- The hub counts `n of 8 pages`, read through `engine/progress/creditMap.ts` (§3.5).

### 3.3 The FOUNDATIONS gate, and why it does not block navigation
- **Navigation is never blocked.** NEXT, PREV, CONTENTS and the what's-left jumps work on
  every page, always (owner 2026-09-20).
- What waits is the **activity**: on a page after the foundations, a learner whose
  foundations are not met sees a **Foundations card** in place of the page's activity. It
  says what the page builds on, lists the two foundation pages with ✓ / not yet and a
  one-tap OPEN for each, and offers the quick check. It never says "locked"; it says what
  the page needs and how to get there in one tap.
- **Foundations met** = each of `meet`, `setups` is credited (stored, or met
  in this session — so a guest and a preview are judged by what they did on screen), OR the
  quick check was passed in this practice run.
- This is the study-method gate the owner asked for ("understanding … then finally the
  miking"), in the same family as the Dashboard power sequence; it is NOT a navigation lock.

### 3.4 The web preview harness
`#labpreview/MikingLesson/M01?page=<id>` opens a page (`instrument` / `sound` / `setting` open
the page built from them); `&step=<n>`, `&variant=<id>`, `&setup=<n>` (STARTING SETUPS, 1-based);
`&unlock=1` (DEV + web only, never the production router) treats the quick check as passed
so a capture can reach any stage.

### 3.5 Stored credit across the restructure (owner rule: credit is never removed)
A record may still carry `instrument`, `sound`, `setting`. They are KEPT on the record (the
sanitiser accepts them: `isStoredPage`) and READ as the page built from them
(`creditedPages`): `instrument` or `sound` → MEET IT, `setting` → STARTING SETUPS, every other
page → itself. Nothing is credited that the learner did not bank a source of; a complete
nine-page lesson is a complete eight-page lesson; "n of 8" never passes 8; the only drop is
where two banked pages became one (instrument + sound → MEET IT). A resume point on an old
page resumes on the page built from it; a quick-check miss on an old page names the new one.

### 3.1a The display height (owner answer A, 2026-10-06)
On a phone the Miking glass is sized from the window: `clamp(round(window × 0.36), 250, 340)`
for a window at least 760 pt tall (915 → 329, 844 → 304); below 760 the rack's own rule
(250, a step smaller under 700). The Rack Unit still clamps it so the dock and the well keep
their room, and a tablet keeps its larger share (`engine/rack/glassHeight.ts`, the rack's
opt-in `stage.phoneHeight`). Rack Unit layout unchanged.

---

## 4. Cognitive principles, applied explicitly

| Principle | What it means here | Where it is applied |
|---|---|---|
| **Pre-training** | Teach the names before the complex scene. | ORIENT names every part before any mic appears. (The evidence labels it once defined are gone from the screen: §12.) |
| **Segmenting** | One idea per step; the learner sets the pace. | HOW IT SOUNDS is a stepped sequence the learner advances (or plays once); no step adds more than 4 new ideas (§6). |
| **Signalling** | Point at what matters now. | The journey map on START; each step's one-line prompt; the active part highlighted; the explanatory overlay numbers the events 1–4. |
| **Coherence** | Cut what does not serve the step. | No mic in stages 1–3; no readouts that the step does not use; no source names, codes or badges anywhere on screen (§12). |
| **Worked example → fading** | Show a full solution, then hand over parts of it. | PLACEMENT opens with WATCH (a recommended starting point read piece by piece, the mic placed for the learner); PLACE then asks for two zones with the zone card as help; ADVANCED gives a prediction but no walkthrough; PRACTICE gives only the brief. |
| **Prediction before reveal (try before tell)** | Commit, then see. | An ungraded PREDICT FIRST card before every activity from HOW IT SOUNDS on (kept from review M1). |
| **Retrieval practice, spaced across stages** | Recall later, mixed with new material. | Each page from MICROPHONES on carries one "FROM EARLIER" check that reaches back to a foundation stage; PRACTICE ends with a mixed review across every stage. |
| **Productive failure only after foundations** | Struggle helps only once the basics are there. | Open activities (free placement, aiming a null, the two-mic pair, the setup briefs) sit after the foundations gate. |
| **Elaborated feedback** | A wrong answer is answered with why. | Every wrong option has its own `why` (review M2), in checks AND in the quick check. |
| **Expertise reversal** | Scaffolds that help novices slow experts down. | The EXPERIENCED path skips the foundations activities once the quick check shows they are there. |
| **Dual coding, plain words** | Pictures and words carry the same facts. | Every canvas carries a screen-reader description; a model or exaggeration is said ONCE where it matters, in plain words ("a simplified picture", "motion drawn larger"). |

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

### Stage 1 — MEET IT — WHERE THE SOUND COMES FROM (`meet`)
- **Objective:** the learner can say what the instrument is, name its parts, and say where
  its sound leaves it — the places a mic can hear it best.
- **On screen (composed: the lesson's orient page, then its how-it-sounds page trimmed):**
  1. START (read): the standard line; the journey map; NEW / EXPERIENCED; the quick check
     (experienced only). The opening paragraph is the same for every lesson
     (`journey.journeyIntro`) and names the journey as it now is.
  2. WHAT IT IS (read): a large drawing and the short facts.
  3. THE PARTS (rack): tap a part to name it and read what it does and where sound leaves it.
  4+. Where the sound leaves (the lesson's how-it-sounds steps that say it: the strike or
     breath becoming sound, attack and body, the bell, the open holes, the soundboard …),
     then the checks. Physics-only steps are not shown (`MEET_DROP`).
- **Interaction:** tap, step, play once, switch view or variant. No mic.
- **Check:** the how-it-sounds checks still about what is shown (2–3 per lesson).

### Stage 2 — STARTING SETUPS (`setups`)
- **Objective:** see where a mic actually goes on this instrument — several real setups —
  before choosing or placing one; know what else reaches the mic and what to settle first.
- **On screen (composed: the engine's setups steps, then the lesson's "before any mic"):**
  1. SETUPS (rack): one setup at a time, drawn on the instrument: each mic at the lesson's
     starting point with its stand / boom / clip (the collision model's mount, so nothing
     floats and the stand stands on the floor; the cable leaves the mic's tail), its aim
     (amber, dashed, arrowhead), its distance (white dimension and the number), its pickup
     shape. SETUP steps through them; SETUPS names them; the drawing is framed to the
     instrument plus the whole setup (`geometry/contentFrame.setupFrame`). Card: role, name,
     mic type and pattern, START (the zone's own distance-and-aim words, or the distance in
     words for a second mic with no zone), TENDS TO (one line).
  2. WHAT ELSE THE MIC HEARS (read): the neighbours that reach the mic, what the mic and its
     stand keep clear of, and ON A STAGE / IN A STUDIO — the old setting page's mic
     decisions, said as decisions.
  3. (an amplified source) MIC OR DI — the lesson's own signal-path step.
  4. BEFORE ANY MIC (read): ask the player; hearing safety; the checks.
- **Roles** (`engine/setups.ts`): ONE MIC = the zone the worked example reads; TWO MICS = the
  lesson's two-mic pair (copy, else `setupPairs`); CLOSE · LIVE = a stage / clip-on / "close"
  zone no farther from the sound than ONE MIC, else one clearly nearer; FARTHER BACK · STUDIO =
  a room / studio zone farther away, else one clearly farther; `SETUP_PICKS` records where a
  lesson's own words choose differently. A role with no zone is left out — nothing invented.
- **A mic that would touch a part at its zone start** (only the piano's long dynamic under the
  lid, four zone starts in all) is tilted clear about its front — 5° steps, up to 30° — so its
  distance holds (owner answer B: the short-stick lid keeps ~15 cm); only if no tilt clears
  it is it moved (`geometry/collision.nearestClear`).
- **Credit:** every setup in the four roles looked at (`setupsSeen`) + the checks.

### Stage 3 — MICROPHONES (`microphone`)
- **Objective:** choose a mic by its properties for THIS source (pattern, power, size, mount).
- **On screen:** ON THE INSTRUMENT (rack: the chosen TYPE drawn where the lesson starts it —
  the setup that uses it, else the first starting point that takes it — with its mount,
  pickup shape and distance; PATTERN where the type offers more than one) → the lesson's own
  microphone page: PREDICT FIRST → COMPARE (sweep a source round the pattern) → BY PROPERTY →
  CHECK.
- **Check:** the existing checks + one FROM EARLIER.

### Stage 4 — PLACEMENT STUDIO (`placement`)
- **Objective:** start from a setup, measured from its named surface, aimed, clear of every
  moving part — then move the mic and see what changes.
- **On screen:**
  1. WATCH (rack, worked example): a recommended starting point read piece by piece (its own
     rig; it earns nothing).
  2. PLACE (rack): the mic begins at the starting setup last looked at (START in the dock —
     "Start from: …" — picks another; a two-mic setup starts from its first mic); the learner
     rests it in two different zones and moves it.
  3. HOW ZONES WORK (read) → CHECK.
- **Exit:** two zones + the checks.

### Stage 5 — ADVANCED (`context`, `twoMic`, `troubleshoot`)
Unchanged in substance (every review fix kept): studio vs live with a FIXED monitor and the
learner aiming the mic; two mics with delay vs polarity and the ideal comb; symptoms. Each of
`context` and `twoMic` opens with PREDICT FIRST (no worked example: the help has faded).
`context` adds one FROM EARLIER check (stage 2: the front head and port radiate).

### Stage 6 — PRACTICE / ASSESS (`practice`)
The setup in order, the gain judgement, two briefs where several setups pass and the reasons
are graded, the second-channel card, and the mixed review reaching back across the stages.

### (Stage 8 — SOURCES: removed by the owner ruling of 2026-10-04)
The evidence audit, references, unknowns and corrections stay in `docs/labs/miking/`
(SOURCES.md, CORRECTIONS_LOG.md) and in the code-only fields; none of it is a page.

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

## 8. THE SETTING for the other families (source data only since 2026-10-06)

The setting data (`lesson.setting`) still feeds STARTING SETUPS' "what else the mic hears" step
and its checks; its plans are no longer drawn. The rules below are kept for the data.

Always a plan (from above) at the source's real scale, with neighbours as illustrated real
objects (never boxes or circles), the player's space drawn as a keep-out, and STAGE / STUDIO
variants that reuse the lesson's monitor positions. Positions without a source are recorded as
such internally (`prov`); nothing is tagged on screen (§12). Lab 1's drum lessons share one kit plan
(`lessons/shared/kitPlanModel.ts` + `KitPlan.tsx`); a lesson highlights its own drum.

---

## 9. What a lesson author supplies (the data contract)

`Lesson` (engine/model/types.ts) gains:
- `orient`: the four ORIENT facts (what, where, job, size), each with its source key (internal,
  never shown);
- `sound`: the strike-sequence stages (title + one sentence each, per front-head variant
  where it differs), the radiating surfaces, the attack/body words;
- `setting`: the neighbours (id, label, what it means for the mic, provenance) and the
  stage/studio notes;
- `noun`: the instrument's short noun ("kick" / "kicks") for the path wording;
- `diagnostic`: the 6 quick-check items (`covers` = the foundation page each one tests,
  `critical` for safety items);
- pages for the nine source ids (or `meet` / `setups` + the six), with credit lists that
  validate (`validateLesson` checks both the written pages and the journey as served);
- `setupPairs` only where a two-mic STARTING SETUP is not in `copy.twoMic` (logged);
- `accuracyDetail`: the one "about these starting points" note behind the header's ⓘ.

## 10. Tests that pin the journey (`test/mikingJourney.test.ts`, `test/mikingRestructure.test.ts`)

- PAGE_IDS order puts the two foundations first and `practice` last (no `sources` page, no
  `setting` page);
  every stage maps to pages that exist.
- NEW path: no page with a placement/aiming/pairing task is open before MEET IT + STARTING
  SETUPS are met; STARTING SETUPS draws mics but never lets one be moved.
- The quick check: 6 items, all from foundation pages, at least one critical; pass needs
  ≥ 5 of 6 and every critical item; one attempt per run; a passed check opens the activities.
- Skipping never inflates credit: recording a passed check leaves `done` untouched; lesson
  complete still needs every page.
- MEET IT and STARTING SETUPS are credited by their own live checks (STARTING SETUPS also by
  looking at every setup); every page from
  MICROPHONES to ADVANCED carries a FROM EARLIER item from a foundation stage.
- HOW IT SOUNDS: the membrane shapes are the Bessel-zero ratios; a centre strike drives only
  n = 0 shapes; no miking file is a loop host.
- The quick-check items follow the item-writing rules (§5).
- `test/mikingLearnerText.test.ts`: no learner-facing string (lesson data, mic types, stages,
  registry, every miking presentation file) carries a banned badge, citation form or
  `BRAND_NAMES` entry (§12).

## 11. Open questions for the owner

1. **Diagnostic threshold** — 5 of 6 with every safety item right, one try per practice run.
   Stricter (6 of 6) or looser?
2. **Attack vs body as a picture** — the Drum Tuning Lab's synthesis could draw a MODEL
   waveform of a kick strike (labelled MODEL, never played). It is a synthesis with model
   constants, not a recording, so this build keeps attack vs body in WORDS. Your call.
3. **Kit layout** — the neighbours' positions are a typical right-handed layout; left-handed
   players mirror it. A drummer's review of the plan is wanted.
4. **Existing credit** — the lesson grew from 8 to 10 pages, then to 9 when the Sources page
   left (2026-10-04), then to 8 with the 2026-10-06 restructure. Credit on instrument / sound
   / setting is kept and read as MEET IT / STARTING SETUPS (§3.5). A learner who had banked
   only ORIENT now sees MEET IT credited (nothing is ever taken away) — say if MEET IT should
   instead wait for its checks.
5. **Variants with a single setup to look at** — 12 variants (e.g. the piano on the short
   stick, the splash piggy-backed) have only ONE MIC among the four roles; every lesson has
   at least two in some variant. Add researched pairs there if wanted.

## 12. The starting-points voice (owner ruling 2026-10-04 — every lesson)

Research and accuracy stay MANDATORY internally (`SOURCES.md`, `CORRECTIONS_LOG.md`, the
code-only `src` / `quote` / `prov` / `unknowns` / `examples` fields, the reviews). The learner
sees suggested starting points in plain words. Full rule:
`docs/APE_LAB_VISUAL_CHARTER_2026_10_04.md` §12.

**Voice rules (learner text)**
- Lead with the suggestion: "After our research, here is where we recommend you begin",
  "Ideas to try", "Move it and listen — there is no single right answer".
- A zone is a "Recommended starting point", named by what it is ("Inside, near the batter
  head"), with a plain suggested range ("Start about 5–7.5 cm (2–3 in) from the batter head").
- Tonal outcomes are tendencies to check by ear ("LISTEN FOR"), never results.
- Say once, where it matters, that a picture is simplified ("a simplified picture", "motion
  drawn larger"); never a tag on every readout.
- No dogma words — must, always, never — except genuine safety: clearance from heads, beater
  and the player's space; hearing; phantom power and gain; never provoking feedback.
- Checks test reasoning; every option has its explanation; a graded choice accepts every
  reasonable answer (the setup briefs pass several setups).
- One "about these starting points" note, behind the header's ⓘ — not on every page.

**Banned in the UI** (pinned by `test/mikingLearnerText.test.ts`)
- Source, brand, model and authority names — the test's `BRAND_NAMES` constant (Shure,
  Sennheiser, AKG, DPA, Beta 52A/91A, e 902, D112, Yamaha, DW, Remo, NIOSH, …). Generic types
  stay: "a kick dynamic", "a boundary mic on the pillow", "a small condenser".
- Evidence badges and their legends: SOURCED, SOURCED*, TRIAL / TRIAL READING, ILLUSTRATIVE,
  IDEAL MODEL, "ideal only", "lab edges", "HOW TO READ THIS LAB".
- Citation forms: "<brand> guide · …", "(L39)" and "L19-L37" codes, "K-07" correction ids,
  "the guide says", "documented", "cited", a reference list, a Sources page.

# Pass 5 — agent D: do the data files agree with each other?

**Axis:** the app's hand-maintained content data, cross-checked mechanically.
**Method:** I transpiled each TypeScript data module with the repo's own
`typescript` and evaluated it in node, then ran set-difference scripts over the
real objects rather than grepping source text. Every count below is a script
output, not an estimate. The scripts live in the session scratchpad; each one is
described inline so it can be re-run.

**No source file was edited.** This report is the only file I wrote.

---

## Counts per check

| Check | Findings | Instances |
|---|---|---|
| 1 · every cross-reference resolves | **4** (1 MAJOR, 3 MINOR) | 43 dangling references |
| 2 · every entry is reachable | **2** (2 MINOR) | 6 celebrations, 19 strings |
| 3 · duplicates and collisions | **2** (2 MINOR) | 7 + 1 |
| 4 · same fact, two files | **5** (2 MAJOR, 3 MINOR) | 16 roles + 6 stale counts |
| 5 · shape and type sanity | **0 — CLEAN** | 0 of 1,430 records |

**13 findings. 3 MAJOR, 10 MINOR. No BLOCKER.**

The single most important result is at the bottom of check 5 and inside check 4:
the "rigger" class of bug the brief named — a role labelled as regulated in one
file and bare in another — is **completely gone from `topicCopy.ts` and
`credentialCopy.ts`** (0 conflicts across 608 distinct role names), but it is
**alive and live in `subjectMeta.ts`**, which was never part of that audit and
which had its ratification flag turned on with the placeholder copy still in it.

A fix for that landed on disk from another hand while I was writing. **I re-ran
the check against it: the new predicate returns false for all 50 subjects, so
the disclosure it adds renders nowhere.** It reads the career index's
`regulated` flag; the fact about those six roles is recorded as a `requires`
code in the copy files instead. See the update box in D-9 — that finding is not
closed.

---

## What I checked and what came back clean

Stated plainly, because after four passes a clean result is worth having.

| Cross-reference | Result |
|---|---|
| 50 `labCatalog` leaf routes → registered navigator screens | **0 dangling** |
| 16 `MEMBER_ONLY_EXTRA_ROUTES` → registered screens | **0 dangling** |
| lab-ish registered routes the catalog cannot name | **0 members-only** (23 exist; all free) |
| 20 lab category ids vs the 17 explicit `labs/<path>` deep links | **0 collisions** |
| 166 `topicCopy` gs ↔ 166 `topicImages` gs | **identical sets** |
| 152 `studyAreaCredentials` slugs → `credentialCopy` | **0 missing** |
| 23 `STUDY_AREA_CREDENTIALS` keys ↔ 23 `SHOWCASE_CARDS` ↔ `CARD_IMAGE` | **exact 3-way match** |
| 42 `careerIndex.json` family names → `families.ts` | **0 orphan careers** of 1,898 |
| 42 `careerFamilies.json` ids ↔ `FAMILIES` ids, and `count` vs actual | **exact** |
| all `careerFamilies.json` `topicGs` → a real topic | **0 dangling** |
| 14 dimension codes ↔ families ↔ 28 questions ↔ `LAB_FOR_DIMENSION` | **exact, both ways** |
| 31 `helpContent` entries: ids, jump routes, empty fields | **0 problems** |
| 28 calculator workflow templates → workspace + fn key | **0 dangling** |
| 55 calc workspaces: sections, fn inputs/outputs → declared fields | **0 dangling** |
| 15 `LabKey` ↔ 15 `LAB_UNITS` ↔ 15 catalog leaf `key`s | **exact 3-way match** |
| 14 authored production `activityId`s ↔ 14 `ACTIVITY_CHECKS` | **exact** |
| 253 lab `helpKey`s → `LAB_LESSONS[...].controls` | 1 dangling (D-3) |
| 8 cymatics JSON files ↔ `LibraryShapeId` ↔ `FILES` ↔ each file's own `shape` | **exact** |
| celebration `{placeholder}`s → `CelebrationValues` | **0 dangling** |
| celebration action `kind`s → declared union | **exact, both ways** |
| duplicate keys in any data map (topicCopy, credentialCopy, topicImages, labCatalog, helpContent, celebration, workspaces, workflows) | **0** |

---

## Check 1 — every cross-reference resolves

**4 findings, 43 dangling references.**

### D-1 — MAJOR: the SHARE button on every credential celebration silently navigates to the Study dashboard

**Confidence: high.** Catalog rows, the action union, the handler and the caller
chain were all read in full.

**Files**
- `src/features/celebration/catalog.ts:16` (`const SHARE = { label: 'SHARE', kind: 'share' }`)
  used at `:224`, `:236`, `:249`, `:262`, `:280`
- `src/screens/results/CelebrationScreen.tsx:135–144` (the handler)
- Caller chain: `src/screens/dashboard/DashboardScreen.tsx:573` →
  `src/features/celebration/useCredentialCelebration.ts:120` →
  `celebrationQueue.ts:83,89`

**What the user does.** Earns a certificate or completes a program. The
full-screen credential celebration opens (tier `credential` → `screen`, per
`types.ts:140`). It offers **VIEW CERTIFICATE** and **SHARE**. They tap SHARE —
this is the moment the whole Trophy Case feature exists for.

**What happens.** `CelebrationScreen.tsx:135–144` falls `share` through to the
same branch as `dismiss`: `toStudy()`, a `navigation.reset` onto the Study
Dashboard. Nothing is shared, nothing is copied, no sheet opens, and there is no
message. The celebration is gone and they are on a different tab.

The code is honest with itself about it — the comment at `:137–142` says *"Share
and the two summary destinations are not built yet… nothing here pretends to
have shared something."* That is true of the handler. It is not true of the
**button**, which says SHARE. A button labelled SHARE that resets you to another
tab does pretend.

All five credential celebrations carry it, and all five are genuinely raised:
`first-certificate`, `certificate-earned`, `first-program`, `program-complete`,
`multiple-credentials`.

**What should happen.** Either wire `share` to the share sheet the Trophy Case
already has, or drop the action from the five rows until it exists. Removing one
`SHARE,` from five array literals is the smaller change and leaves VIEW
CERTIFICATE as the only (correct) action.

**Related, and NOT live:** the other two unimplemented kinds — `view-summary`
(primary action of `subject-complete`, `catalog.ts:192`) and `view-requirement`
(primary action of `requirement-complete`, `catalog.ts:209`) — sit on
celebrations that are never raised at all (see D-5), so no user can reach them
today. They become live the moment someone wires those two celebrations.

### D-2 — MINOR: 29 of 126 career-family example titles do not exist in the career index, so the regulated-occupation warning can never fire for them

**Confidence: high.** Exact and alternate-title matching, both directions, over
all 1,898 index rows.

**Files**
- `src/features/careerfinder/families.ts` — `examples` on all 42 families
- `src/features/careerfinder/careerIndex.ts:157–166` (`isRegulatedTitle`)
- `src/screens/careerfinder/CareerFinderResultsScreen.tsx:90–106`

The disclosure mechanism on the results screen is a **string match** of the
hand-written `examples` against index titles and alternates — `careerIndex.ts`
says so explicitly at `:150–155`. 29 of the 126 example strings match nothing:

```
Assistant Mix Engineer · Game Audio Designer · Audiobook Engineer ·
Voiceover Recording Engineer · Commissioning Technician · Loudspeaker Engineer ·
Audio Plugin Developer · Audio Repair Technician · Calibration Technician ·
Audio QA Test Engineer · Preservation Engineer · Surveillance Audio Analyst ·
Public-Safety Audio Technician · Audio Instructor · Audio Curriculum Designer ·
Pro Audio Sales Engineer · Automotive Audio Installer ·
Consumer Audio Product Specialist · Sonic Branding Designer · UX Sound Designer ·
Music Editor · Broadcast Infrastructure Engineer · Cloud Audio Engineer ·
Music Director · Linguistics Laboratory Technician · Voice-Quality Engineer ·
Acoustic Installer · Noise-Control Technician · Accessibility Audio Producer
```

**Judgement: not currently harmful, but it is the mechanism failing quietly.** I
fuzzy-matched every one of the 29 against the titles in its own family; none of
the nearest matches is flagged `reg`, so no warning is being *missed* today. But
23% of the strings the disclosure predicate is asked about are invisible to it,
and nothing fails, logs or tests when that happens. The day one of these roles is
marked regulated in the index — or someone adds a 43rd family with a licensed
example spelled slightly off — the hard rule breaks silently. `Voice-Quality
Engineer` vs the index's `Voice Quality Engineer` differ only by a hyphen, which
shows how little it takes.

**What should happen.** A test asserting every `examples` entry resolves to an
index row, and the 29 strings corrected to the index's spelling. That converts a
silent miss into a build failure.

### D-3 — MINOR: the LINE ARRAY control in the Speaker Coverage lab has no guided-lesson entry

**Confidence: high.** Both call sites and the full control list read.

**Files**
- `src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx:425` and `:543`
  (`helpKey: 'line_array'`, `onLongPress={() => help('line_array')}`)
- `src/features/lab/guidedLessons/content.ts:943–951` — the `speaker` lab's nine
  controls: `top_view`, `position`, `aim`, `dispersion`, `second_speaker`,
  `front_fills`, `side_view`, `height_tilt`, `room_shape`. No `line_array`.

`GuidedLessonSheet.tsx:139` does `lesson.controls.find(c => c.key === controlKey)`
and gets `undefined`, so `compact` is false and the sheet opens the **whole-lab**
lesson instead of "what this control does". Long-pressing the LINE ARRAY chip, or
the V PATTERN bezel while array mode is on, therefore behaves differently from
long-pressing any of the other nine controls on the same screen. Nothing crashes;
the two-tier design just doesn't apply to one control.

This was the only dangling key in **253** lab `helpKey`s I resolved across 40
files (module screens resolved through their parent's `getLabLesson(...)` binding:
`digital`, `meter`, `wave`, `cymatics`).

### D-4 — MINOR: 5 Frequency Counter readouts derive a help key that does not exist

**Confidence: high.** `readoutKey` is a pure function; I applied it to every
`<StatCell label=…>` in the file.

**Files**
- `src/screens/tools/FrequencyCounterScreen.tsx:159` — every StatCell long-press
  calls `help(readoutKey(label))`
- `src/features/lab/guidedLessons/toolHelp.tsx:176` — the `freqcounter` controls:
  `confidence`, `input_level`, `status`, `events_sec`, `period`, `bpm`,
  `stability`, `min`, `max`, `a4`, `marks`

| StatCell | line | derived key | in controls? |
|---|---|---|---|
| MOD DEPTH | 346 | `mod_depth` | no |
| CAMERA FPS | 347 | `camera_fps` | no |
| MAX RESOLVABLE | 348 | `max_resolvable` | no |
| OCTAVE | 710 | `octave` | no |
| AVG (5 s) | 1164 | `avg_5_s` | no |

Nine other cells on the same screen resolve correctly. Same effect as D-3: the
focused "what it shows" popup silently becomes the whole-tool lesson. `MAX
RESOLVABLE` is the one worth authoring first — it is the camera-mode Nyquist
limit, which is exactly the sort of number a learner long-presses to understand.

The other seven tools are clean: I checked all `helpKey`, `help('…')` and
`readoutKey('…')` call sites against their `TOOL_LESSONS` control lists.

---

## Check 2 — every entry is reachable

**2 findings.**

### D-5 — MINOR: 6 of 18 celebrations have no caller anywhere in `src/`

**Confidence: high.** I stripped comments before matching, because the first
sweep produced a false OK on `subject-complete` from a comment in
`celebrationQueue.ts:16`.

`src/features/celebration/catalog.ts`:

| id | line | tier | raised by |
|---|---|---|---|
| `quiz-not-passed` | 96 | stage | nothing |
| `score-improved` | 114 | stage | nothing |
| `daily-practice` | 126 | stage | nothing |
| `lab-complete` | 171 | milestone | nothing |
| `subject-complete` | 183 | milestone | nothing |
| `requirement-complete` | 200 | milestone | nothing |

The remaining 12 are all genuinely raised (`useMethodCelebration`, `QuizScreen`,
`celebrationQueue` via `useCredentialCelebration`).

Two of the six matter more than the others:

- **`lab-complete`.** `src/features/lab/labCompletion.ts` is a complete, working
  feature — 15 lab keys, a full unit registry, `mark_lab_complete` over RPC with
  offline retry. Finishing a lab is a real milestone the app records on the
  server, and the celebration written for it never fires.
- **`quiz-not-passed`.** The catalog's own comment above it (`:85–95`) calls it
  *"the most important celebration in this file… the screen that decides whether
  somebody carries on or quits."* `QuizScreen.tsx:173–215` routes `full_pass` to
  the Celebration screen and **everything else straight to `Results`** — so the
  encouragement screen, the only `encouragement: true` row in the catalog, is
  unreachable. This may well be a deliberate call (Results already shows the
  score and a retry), but if so the row and its comment should go, because right
  now the file claims a behaviour the app does not have.

**What should happen.** Either wire them or delete them. Six unreachable rows is
how the next reader concludes a feature exists when it does not.

### D-6 — MINOR: `CONFIRMATIONS` and `TROPHY_CASE_EMPTY` have zero production consumers

**Confidence: high.** Grepped both by name and by each literal string.

`src/features/celebration/catalog.ts:300–332`. All 11 `CONFIRMATIONS` strings and
all 8 `TROPHY_CASE_EMPTY` strings are imported only by `test/celebration.test.ts`.

The irony is on the record: the comment at `:317–320` says they are *"exported as
data so nobody writes a slightly different 'Progress saved.' in three places."*
That has already happened — `src/screens/lab/calc/CalcWorkflowRunScreen.tsx:690`
writes `'Progress saved.'` as an inline literal. And the Trophy Case screen
(`src/screens/achievements/AchievementsHomeScreen.tsx:95+`) uses its own
`RecentStrip empty` states, not `TROPHY_CASE_EMPTY`'s tagline/intro/per-section
copy.

Tests passing on data nothing renders is worse than no tests, because it reads
like coverage.

### Reachability observations that are NOT findings

- 26 of the 160 `credentialCopy` rows are not surfaced by any Study Area card.
  `studyAreaCredentials.ts:16–21` says this is deliberate ("credentials with no
  natural card are simply not surfaced here"); they remain on the Certificates /
  Programs screens.
- 54 of the 166 topics are referenced by no `careerFamilies.json` `topicGs` list.
  Those lists are curated entry points, not full coverage.
- `achievement_name` in `CelebrationValues` (`types.ts:94`) is used by no
  template.
- `topicImages.ts` names 166 WebP files served from a Supabase bucket. Whether
  every object is uploaded cannot be settled from the repo; `TrophyImage` falls
  back gracefully, and `topicImagePath()` is null-safe for an unknown gs.

---

## Check 3 — duplicates and collisions

**2 findings.** No duplicate key exists in any data map I loaded — topicCopy
(166), credentialCopy (160), topicImages (166), helpContent (31), celebrations
(18), lab categories (20), lab leaves (50), calc workspaces (55), workflow
templates (28), career families (42), careers (1,898). I also checked for
duplicate *descriptions* (copy-paste authoring errors) in topicCopy,
credentialCopy and families: **none**.

### D-7 — MINOR: 7 career-index entries list, as an alternate name, a title that is another entry's own canonical title

**Confidence: high.** `src/data/careerIndex.json`.

```
Recording Engineer      alt "recording technician"        also a separate title
Mixing Engineer         alt "mix engineer"                also a separate title
Monitor Engineer        alt "monitor mixer"               also a separate title
Utility Sound Technician alt "sound utility"              also a separate title
Re-Recording Mixer      alt "dubbing mixer"               also a separate title
Audiologist             alt "clinical audiologist"        also a separate title
Audio Archivist         alt "recorded-sound archivist"    also a separate title
```

Two visible effects, both cosmetic. In the BROWSE CAREERS list
(`CareerFamilyScreen.tsx:180`) a row for "Mixing Engineer" expands to show *ALSO
CALLED mix engineer* while a separate "Mix Engineer" row sits nearby — it reads
as a data error even though both listings are defensible. And `searchCareers`
(`careerIndex.ts:168–180`) returns both rows for the same query. No duplicate
title exists *within* a family, and no title appears in two families.

### D-8 — MINOR: the Frequency Counter has three different ids

`hzcounter` (`toolsData.ts`, telemetry `tool_type`, `ToolLearn`/`ToolDemo`
params, `TOOL_INFO_KEYS`), `freqcounter` (`toolHelp.tsx:23` — the only tool whose
help id differs from its data key), and `frequency-counter`
(`linkPaths.ts:31`, `linking.ts`). All three are used consistently at their own
call sites, so nothing is broken today: `FrequencyCounterScreen.tsx:1223` passes
`'freqcounter'` to `useToolHelp` and `:1225` passes `'hzcounter'` to
`useToolUsage`, one line apart. It is a trap for the next person who writes
`useToolHelp(tool.key)`, which would silently return a null sheet.

---

## Check 4 — the same fact, stated in two files

**5 findings.**

### D-9 — MAJOR: the Explore subject list names regulated and degree-gated careers with no disclosure, including the exact "rigger" the earlier passes fixed elsewhere

> ### Update, same session — the in-flight fix is INERT. Do not close this.
>
> While I was writing this up, a fix for D-9 landed on disk from another hand:
> `careerIndex.ts:163–185` gained `namesRegulatedRole(prose)`, and
> `CurriculumScreen.tsx:487–502` now prints a required-education note under
> CAREER APPLICATIONS when that predicate returns true.
>
> **I re-ran the check against the new code. The predicate returns `false` for
> all 50 subjects, so the note renders nowhere and every line below is still
> bare.** Verified two ways: by calling the real function, and by re-implementing
> its exact matching rule against `careerIndex.json`.
>
> The cause is that it reads the **wrong source of truth**. `namesRegulatedRole`
> tests the prose against the career index's 94 `reg`-flagged canonical titles.
> Those are titles like *Entertainment Rigger*, *Arena Rigger*, *Theatre Rigger*,
> *Clinical Audiologist*, *Sonar Systems Technician*. The index contains **no**
> entry whose canonical title is `Acoustician`, `rigger` or `archivist` — I
> checked each one. Not one of the 94 appears as a substring anywhere in the 50
> strings, let alone on a word boundary.
>
> The fact that *is* recorded for those six roles lives in the **other** file
> pair: `topicCopy.ts` / `credentialCopy.ts`, as a `requires` code
> (`rigger` → `CERT`, `Acoustician` → `DEGREE`, …). The predicate never looks
> there. The new comment at `CurriculumScreen.tsx:490–497` asserts the opposite —
> *"it names roles the app's own index flags as regulated: acoustician, research
> acoustician, bioacoustics researcher, archivist and rigger among them"* — and
> that sentence is false for all five.
>
> This is the same shape as pass 3's `isMemberOnlyLabRoute` bug: a gate that
> looks right, is wired correctly, and is never true. **A fix that reads the
> `requires` codes in `topicCopy`/`credentialCopy` — the 90 labelled role names
> that already exist — would fire on all six subjects.** The rest of the finding
> below stands unchanged, and D-12 (unratified copy) is untouched by the fix.

**Confidence: high.** The gate, the render path and the copy were each read; the
role names were matched against `topicCopy`/`credentialCopy` by script.

**Files**
- `src/data/subjectMeta.ts` — `SUBJECT_META`, and the flag at `:270`
- `src/screens/curriculum/CurriculumScreen.tsx:452`, rendered at `:486–491`
- The same facts, disclosed: `src/data/topicCopy.ts` (gs 3690 etc.),
  `src/data/credentialCopy.ts`, `src/data/careerRequirement.ts`

**What the user does.** Opens Explore → SUBJECTS and expands a subject. Under
**CAREER APPLICATIONS** the app prints a plain sentence of job titles.

**What happens.** Six of those titles are labelled as needing further education
in the copy files that *were* audited, and are bare here:

| subject | line | title shown bare | labelled elsewhere |
|---|---|---|---|
| Stage & Venue | 250 | **rigger** | `CERT` — "Certification required" (topicCopy gs3690) |
| Acoustics & Room Behavior | 20 | Acoustician | `DEGREE` |
| Measurement & Analysis | 24 | acoustician | `DEGREE` |
| Human & Heritage Acoustics | 34 | Research acoustician | `DEGREE` |
| Life, Earth & Space Acoustics | 38 | Bioacoustics researcher | `DEGREE` |
| Preservation & Restoration | 182 | archivist | `DEGREE` |

Plus, by substance rather than by exact string: *academic* and *academia*
(lines 34, 38, 42), *Research scientist* (42), *environmental scientist* (38) and
*expert witness* (30).

`REQUIRES_LABEL` is consumed by exactly two screens —
`CredentialDetailModal.tsx:224,230` and `TopicDetailModal.tsx:165,171`.
`CurriculumScreen`'s careers row is a plain `<Text>{meta.careers}</Text>` with no
disclosure mechanism at all. So on the **same screen**, tapping a topic gives
"Rigger — Certification required", while expanding the subject that contains it
gives "Stagehand, rigger, production manager, venue crew."

**Why this was missed.** `subjectMeta.ts` was gated off when the disclosure rule
landed. `git show 94ae1967` (2026-09-15) flipped `SUBJECT_META_RATIFIED` from
`false` to `true` as one bullet of an unrelated Explore redesign. The gate's own
docblock (`:262–269`) states the precondition: *"To turn it on: review/replace the
copy above… then set this to true."* The copy was not reviewed or replaced — the
file header still says, today, *"PLACEHOLDER COPY — reasonable first-pass
descriptions and career mappings, NOT yet owner-ratified"* and *"SUBJECT_META_RATIFIED
is still false, so none of this renders."* Both statements are now false, and 50
subjects of unratified placeholder copy are live.

**What should happen.** Two separate decisions, and they are the owner's: (a) is
this copy ratified? The file says it is not; (b) the careers line needs the same
`Career[] + requires` shape the other two surfaces use, or the gated titles
removed from the strings. Until one of those happens the hard rule is being
broken on a screen any user can open.

### D-10 — MAJOR: the career-family screen prints ten licensed occupations bare, directly above the same screen's own LICENSED badge

**Confidence: high.** Both render paths are in one file, 50 lines apart.

**Files**
- `src/screens/careerfinder/CareerFamilyScreen.tsx:156` — REPRESENTATIVE CAREERS:
  `{fam.examples.map((e) => <Text key={e} style={styles.example}>▸ {e}</Text>)}`
- `src/screens/careerfinder/CareerFamilyScreen.tsx:206–231` — `CareerRow`, which
  renders a `LICENSED` tag (`:213`), an `accessibilityLabel` suffix (`:209`) and
  the full warning paragraph (`:224`)
- Compare `src/screens/careerfinder/CareerFinderResultsScreen.tsx:96–106`, which
  pass 2 fixed and which does mark them

Ten of the 126 example titles resolve to index rows flagged `reg`:

| family | line | regulated examples shown bare |
|---|---|---|
| Hearing, Audiology, Psychoacoustics & Accessibility | 57 | Audiologist, Hearing Instrument Specialist |
| Medical Ultrasound & Therapeutic Acoustics | 59 | Diagnostic Medical Sonographer |
| Stagecraft, Rigging, Power & Production Support | 89 | Entertainment Rigger |
| Music Therapy, Speech & Clinical Voice | 99 | Music Therapist, Speech-Language Pathologist, Clinical Voice Specialist |
| Acoustic Construction & Noise-Control Trades | 105 | Soundproofing Contractor |
| Defense, Sonar & Acoustic Intelligence | 109 | Sonar Technician, Acoustic Intelligence Analyst |

Music Therapy is the worst of them: all three representative careers are
regulated, printed as a bare bulleted list headed REPRESENTATIVE CAREERS, and the
correct disclosure is available on the very same screen further down the scroll.
The predicate already exists and is already imported by a sibling screen —
`isRegulatedTitle` — so this is three lines of work.

### D-11 — MINOR: "Try a lab" recommends a members-only lab for 12 of 14 dimensions without saying so

**Confidence: high.**

- `src/features/careerfinder/labsForDimension.ts` — `LAB_FOR_DIMENSION`
- `src/screens/careerfinder/CareerFinderResultsScreen.tsx:178–180`

The results screen's step 2 says *"Try a lab that uses X: <lab> — <why>."* Cross
-checking each route through `isMemberOnlyLabRoute`: only `FoundationsCourse`
(TE) and `CalcLab` (BO) are free. The other twelve — OscillatorLab, MicSelectLab,
EqLabHome, EnvelopeLab, SignalChainLab, CableInstallLab, CableLab, DigitalLab,
MeterLab, EarTrainingLab, TubeReference, GainLabHome — are members-only.

The gate itself works (that is pass 3's fix, and I re-verified the route map), so
nothing paid leaks. But a free user following the recommendation the app just
made lands on an upgrade preview. This is the same shape as the
"first free topics are open to everyone" line pass 3 removed from
`CareerFamilyScreen`: a promise made in one file about a fact recorded in
another. The membership flag is right there in `labCatalog`.

### D-12 — MINOR: `subjectMeta.ts` contradicts itself in three places

Covered above as the cause of D-9, but it stands alone as a data-integrity
defect: `:9–12` and `:262–269` both assert the flag is `false` and the copy
unratified; `:270` sets it `true`. A reader auditing copy governance by reading
the file would conclude this content is not shipping. It is.

### D-13 — MINOR: six stale counts in comments

None reaches a user — I checked. Every user-facing figure in the app is derived
at runtime (`CAREER_COUNT`, `FAMILY_COUNT`, `QUESTION_COUNT`, `academy.topics`,
`allGs.length`, `categoryCount`), and a grep for hardcoded count claims in
rendered strings found nothing. But six comments now misstate their own data:

| file | says | actual |
|---|---|---|
| `src/features/celebration/types.ts:12` | 171 topics | 166 |
| `src/screens/enrollment/EnrollmentScreen.tsx:255` | 171 topics | 166 |
| `src/features/credentials/credentialArt.ts:17` | 128 certificates | 124 (`credentialCopy.ts:3` agrees: 124 + 36) |
| `src/features/careerfinder/careerIndex.ts:3` | 1,902 titles | 1,898 |
| `src/features/production/activities.ts:4` | "Twenty-seven of these" | 14 authored, 14 checked |
| `src/screens/lab/labCatalog.ts:37` | "the 11 fundamentals labs" | 15 |

`docs/CROSS_SESSION_HANDOFF.md:339` settles the first two: *"the live ACTIVE topic
count is 166, not the 171 some older notes claim."* That is also why `topicCopy`
and `topicImages` both hold exactly 166 and agree perfectly — and it means the
"4 certificates with no copy" I went looking for does not exist.

---

## Check 5 — shape and type sanity

**CLEAN. 0 problems.** Scripted over the evaluated objects, not the source text.

- **`topicCopy.ts`** — 166 rows. Every `description` a non-empty string; every
  `roles` an array; every role an object with a non-empty `name`; **every
  `requires` a member of `RequireKind`**. 0 problems.
- **`credentialCopy.ts`** — 160 rows (124 `cert-`, 36 `prog-`). Every
  `description` non-empty; every `whereApplies` a non-empty array of non-empty
  strings; every `careers` entry a well-formed `Career`; every `requires` valid.
  0 problems.
- **`careerRequirement.ts`** — all 7 `RequireKind` codes have a `REQUIRES_LABEL`,
  and all 7 are actually used by the copy files. No unused code, no unlabelled
  code.
- **`careerFamilies.json`** — 42 rows, all with a name, field, subject, non-empty
  `settings`, non-empty `topicGs`, no duplicate gs within a row, no duplicate
  family name, and `count` equal to the derived count in every case.
- **`careerIndex.json`** — 1,898 rows, every enum index in range (`relationship`,
  `orientation`, `titleClass`, `status`, `workModel`, `preparation` all decode).
- **calc registry** — 55 workspaces: every `section` in `SECTION_META`, every
  function input and output key declared as a field, no duplicate ids, names or
  fn keys. 0 problems.
- **celebration catalog** — 18 rows; ids match the `CelebrationId` union exactly
  in both directions; every `{placeholder}` is a `CelebrationValues` key.
- **`helpContent.ts`** — 31 entries, 6 categories, no duplicate ids, no empty
  `q`/`a`, every `jump.route` a registered screen.
- **cymatics modal library** — all 8 JSON files parse, each file's `shape` field
  matches its registry id, schema and version match the parser's assertion.

### And the check the brief asked for by name

The "rigger" bug — the same role regulated in one file and bare in another — was
run as an exhaustive pairwise check, not a spot check:

- **608 distinct role names** across `topicCopy` + `credentialCopy`,
  case-insensitively normalised. **0 names carry conflicting `requires` values.**
  90 are labelled, 518 are bare, and no name appears both ways.
- Cross-checked against the career index's own `reg` flag: of the 127 role names
  that match an index title or alternate, **0 regulated titles are listed bare**
  in those two files. Five are regulated and labelled everywhere they appear
  (audiologist, ultrasound technologist, sonar systems technician, clinical
  audiologist, hearing instrument specialist).
- A looser substring sweep (a bare name contained in, or containing, a labelled
  one) surfaced 14 pairs. I judged 11 of them correct — "test engineer" and
  "acoustic test engineer" are not the same job, nor are "audio ml engineering
  assistant" and "audio ml engineer". The three I would put in front of the owner
  rather than decide myself, all low confidence: bare **"test engineer"** in
  topics 3230 / 4570 / 4730 alongside `acoustic test engineer` [ENG_DEGREE];
  bare **"measurement engineer"** in topics 4500 / 4610 alongside `acoustic
  measurement engineer` [ENG_DEGREE]; bare **"systems technician"** in
  `cert-stage-patch-and-signal-distribution-v3` alongside `sonar systems
  technician` [CERT] (that last one is almost certainly fine — a stage patch tech
  is not a sonar tech).

So: within the two files that were audited on 2026-09-16, the fix held
completely. The rule broke in the file that audit did not cover — `subjectMeta.ts`
(D-9) — and on the screen that renders `families.ts` examples (D-10).

---

## Where I looked and found nothing worth reporting

- `src/data/officialTopicNames.ts` — 5 entries, all real gs values present in
  `topicCopy`/`topicImages`; `isRealName` correctly rejects "Topic …".
- `src/data/v3Curriculum.ts` — no static content; everything is fetched. The
  strict/lenient error model is intact and the session memo does not cache
  failures or empties.
- `src/screens/lab/cable/data/lessons.ts` — 12 lessons; `CABLE_UNITS` derived
  from the registry, never hardcoded; the missing `lesson10.ts` data file is
  correct (`l10_tester` carries no `unit` and has no lesson body).
- `src/features/production/` — 2 labs, 6 + 8 stages, 14 activities, 14 checks,
  exact match; `checkActivity` returns `passed: false` for an unregistered id
  rather than passing by default.
- `src/features/credentials/credentialArt.ts` — `CREDENTIAL_ART` is empty by
  design; `credentialArtFor` falls back to the bucket URL and callers fall back
  to the badge on load error.
- `src/screens/lab/calc/calcGlossaryLinks.ts` — derived from `WORKSPACES` at
  module load, so it structurally cannot drift.
- `src/navigation/linkPaths.ts` / `linking.ts` — `TOOL_INFO_KEYS`,
  `TOOL_DIRECT_KEYS`, `AWARD_PAGES` and `LAB_DEEP_PATHS` are all consumed by
  `isClaimedPath`, and every path in the linking config has a registered screen.
- `src/features/profile/topicTrophies.ts` — DB-driven by name; nothing static to
  cross-check, and the failed-fetch caching bug noted in its header is fixed.

## What would settle the open questions

- **D-9 (a):** the owner saying whether the 50 `SUBJECT_META` descriptions and
  careers lines are ratified copy. The file currently says they are not.
- **D-5 `quiz-not-passed`:** the owner saying whether a failed quiz is meant to
  show the encouragement screen or go straight to Results. Either answer makes
  one of the two files wrong, and it should be corrected rather than left.
- **Check 5's three low-confidence pairs:** a domain call on whether a "test
  engineer" / "measurement engineer" named in an acoustics topic is the same role
  as the `acoustic test engineer` / `acoustic measurement engineer` that carries
  ENG_DEGREE.

# Design & Cognitive-Learning Review — Production Labs

Audio Pre-Production (6 stages, 180 fields, 90 rules) and Audio Post-Production
(8 stages, 187 fields, 135 rules). Reviewed 2026-09-17 against
`docs/APE_PRODUCTION_LABS_PLAN_2026_09_17.md`. Read-only pass. **Not a bug hunt** —
this is about whether these labs teach well and get used.

Measured, not estimated:

| | Pre-Production | Post-Production |
|---|---|---|
| Fields | 180 | 187 |
| Required fields (`required: true`) | 58 + 9 per-pathway | 67 |
| Rules | 90 (78 attention / 10 blocker / 2 info) | 135 (93 / 17 / 25) |
| Rules with a `fixHint` | 90 of 90 | 135 of 135 |
| Rules with a `learnMore` | 7 | 4 |
| Legal / safety / qualified notices | 29 | 13 |
| Exercises | 6 | 8 |
| Estimated scroll, whole lab | ~55,000 px (~78 phone screens) | ~60,000 px (~85 screens) |

---

## What is strong

**The rule copy is the best writing in this app, and it is not close.** 225 rules,
every single one carrying a `fixHint`, median `detail` 189 characters. The house
pattern — name the mechanism, then name who pays — is held almost without
exception. The best of them:

- `postprod/stage6.data.ts:516` — *"Processing is being judged without matching
  levels. Anything that raises the level sounds better in an A/B, so every
  comparison quietly picks the louder option — which is how a mix ends up
  processed far past where it stopped improving."*
- `postprod/stage4.data.ts:532` — *"Removing a word or a pause opens a hole of
  pure digital silence in a background that was never silent. The result is a
  conversation that keeps stopping and starting, which listeners hear as edits
  even when they cannot say why."*
- `preprod/stage1.data.ts:788` — *"The client will assume everything is included,
  and the quote was written assuming it was not. The gap between those two
  assumptions is the argument at delivery."*
- `postprod/stage2.data.ts:359` — *"…copied in a file browser, which reports
  success as soon as the last byte is queued rather than when it is confirmed
  written. Without a checksum or a read-back, a silent failure looks exactly like
  a success."*

None of these scold. They explain a mechanism the learner did not know, then
price it. That is the thing the labs were built to do, and the content does it.

**The debriefs land.** `postprod/stage8.data.ts` — *"The client found two faults
and there were nine."* `postprod/stage5.data.ts` — *"One of these was a delivery
blocker and it was not the one that sounded wrong."* Each debrief reframes the
exercise rather than summarising it, and names which single item was the
dangerous one. This is real teaching.

**Field help is doing the onboarding.** 313 of 367 fields carry `help`, and the
help is written to change a decision, not to define a term:
`preprod/stage1.data.ts:64` — *"'Existing fans on headphones' and 'a room of
eight hundred people' lead to different work."* `preprod/stage5.data.ts:131`
defines "stage plot" in the field itself.

**The honesty machinery is genuinely honest.** `readiness.ts:109` excludes
accepted blockers only when `isAccepted()` (readiness.ts:77-83) finds both a name
and a reason; `projectStore.ts:236` refuses the write a second time so no screen
can route around it; `AcceptConditionSheet.tsx:66-69` says in the sheet *"This
does not fix the problem."* The `na` map stores a reason rather than a boolean
(`types.ts:69`). The PDF gate (`packet.ts:43`) and its failure copy
(`ProductionLabScreen.tsx:113-120`) never lie about what the build can do.

**The architecture holds.** One `ProductionStageScreen` draws every stage of both
labs with no `if (stageId === …)` anywhere, exactly as planned. Adding a stage
really is a data file.

---

## The single biggest risk to these labs being USED rather than admired

**Every user sees every field, forever. There is no conditional visibility, and
that is what turns a decision tool into a form.**

`FieldDef` (`schema.ts:58-79`) has `onlyFor`, `labelBy`, `helpBy`, `required` —
all keyed on **pathway**. There is no `showWhen`, `dependsOn` or `visibleIf`
anywhere in `src/features/production/`. `resolveStage()` (`schema.ts:175-210`)
resolves a stage against `pathway` and nothing else. Conditionality exists only
as prose in the label or help:

- `preprod/stage2.data.ts:152` — *"If a clean version is owed, what does clean mean here?"*
- `preprod/stage2.data.ts:166` — *"If stems are owed, list them"*
- `preprod/stage3.data.ts:222` — *"Only if mixing is in scope."*
- `preprod/stage3.data.ts:627` — *"If any participant is a minor…"*
- `postprod/stage6.data.ts:451` — *"If they do not match, what is different"*

So a podcast user with no rigging is still asked for a **Certified rigger**
(`preprod/stage3.data.ts`), a **Licensed electrician**, a **Weather plan**, a
**Freeze date** for a change freeze they have not declared, and five pitch/timing
correction fields (`postprod/stage5.data.ts` `correction_scope`,
`correction_target`, `correction_amount`, `correction_guards`,
`correction_compared`) after answering *"Is correction needed: no."*

Compounding it, **nothing is collapsed**. `ProductionStageScreen.tsx:127-150`
renders every section expanded, every field with its help paragraph, every
multiChoice as a full wrapped chip grid. Modelled at 390 pt width, that is:

| Stage | Fields | Est. height | Phone screens |
|---|---|---|---|
| Pre 6 · Confirm Production Readiness | 31 | ~11,100 px | ~16 |
| Pre 5 · Creative and Technical Plan | 34 | ~10,500 px | ~15 |
| Pre 3 · People and Responsibilities | 34 | ~9,900 px | ~14 |
| Post 6 · Prepare, Mix and Print | 27 | ~8,900 px | ~13 |
| Post 1 · Receive the Project | 30 | ~8,000 px | ~11 |

Fourteen to sixteen screens of continuous scroll, with no collapse, no
pagination, no jump-to-section and no save-and-resume marker, and the findings
panel — the payoff — sitting at the very bottom
(`ProductionStageScreen.tsx:152-168`) behind all of it.

The consequence is not that people dislike the lab. It is that they **admire it
and bounce**. A user opens Stage 1 with real enthusiasm, answers eight or nine
questions, meets "Reference productions" as the fifth free-text box asking
roughly the same creative question, realises the scroll bar has barely moved,
and leaves. The stage never reaches `complete`, the readiness meter never leaves
red, and the packet — the entire reason to be here — is never exported. **The
rules never fire because the fields are never filled.** All 225 pieces of
excellent teaching writing are downstream of a form the user has to finish first.

This is not a copy problem. The copy is superb. It is a *volume-per-screen*
problem, and it is the one thing that decides whether these labs are used.

---

## The five highest-value improvements

### 1 · Add `showWhen` to the schema and gate the obviously conditional fields

**The change.** Add `showWhen?: { field: string; equals?: string[]; notEquals?: string[] }`
to `FieldDef` (`schema.ts:58`), resolve it in `resolveStage()` against the
project's current values, and author it onto the fields whose help already says
"if" or "only if". Same for `SectionDef`. Start with the ~40 clearest cases:
`preprod/stage3` rigger/electrician/RF coordinator behind `rigging_required` and
`power_source`; `preprod/stage6` `freeze_date` behind `change_freeze`;
`postprod/stage5` the five `correction_*` fields behind `correction_decision`;
`postprod/stage5` `cue_list`/`match_plan`/`match_verified` behind
`replacement_needed`; `postprod/stage6` `recombination_difference` behind
`recombination_test`; `preprod/stage2` `clean_definition`/`clean_decider`/
`stem_list` behind the deliverable list.

**Why it improves completion.** It cuts what a typical user sees by roughly a
third without deleting one word of content, and — more important for learning —
it makes the form *respond to the user's own answers*, which is the single
strongest signal that a tool is thinking rather than collecting. A revealed field
is also a teaching moment: answer "yes, we are rigging" and three new questions
appear, which teaches the consequence of the decision better than any help text.

**Size: medium.** The engine change is small (one predicate, one filter in
`resolveStage`); the authoring is the work. `readiness.ts` needs one adjustment
so a hidden field is not counted as missing (`totalRequired` must fall with it,
or the meter punishes users for a question they were never asked).

### 2 · Move the findings out of the basement, and wire the two dead affordances

**The change.** Three parts. (a) Put a live findings summary at the **top** of
`ProductionStageScreen` — a one-line count that expands, or the findings panel
above the sections rather than at line 152. (b) Render `Finding.fieldIds` as a
"take me there" control: `types.ts:122` says *"Drives 'take me there'"*, the
field is computed in `rules.ts:evaluateStage`, and **no screen reads it** — grep
for `fieldIds` in `src/screens/` returns nothing. (c) Render `Finding.learnMore`:
11 rules carry deep links to `MicLab`, `MicSelectLab`, `SignalChainLab`,
`GainLabHome`, `MeterLab`, `WaveLab`, `DigitalLab` and `CalcLab`
(`preprod/stage5.data.ts:1031-1213`, `postprod/stage6.data.ts:508-543`,
`postprod/stage7.data.ts:453`) and **nothing renders them either**.

**Why it improves learning.** Plan §3 — the reuse map — is the design's answer to
"where does the deeper teaching happen", and it currently exists only as data.
A rule that says *"No gain structure recorded"* with a tappable route into the
Gain Staging lab is a different product from one that says it and stops. And a
finding the user cannot navigate to is a finding they will not fix: on Pre
Stage 3 the findings sit roughly 9,000 px below the fields they describe.

**Size: small.** All three are rendering changes against data that already
exists. Obey the FUNCTIONAL-vs-PLANNED link rule (`learningProfiles.ts`) — verify
every one of those eight routes is open before shipping the link.

### 3 · Make the exercises diagnostic again, and ungate the debrief

**The change.** Two independent fixes to `ProductionActivityScreen`.

(a) **The criteria checklist gives away the answer.** Lines 132-143 render every
`Criterion.label` up front, before any work. "Save the production"
(`preprod/logic.ts:797`) opens with *"Setup, a line check, changeovers, a break,
verification and a backup are all on the day"* — the prompt asks the user to find
what is missing from the schedule, and the screen lists it. "Deliverable
detective" asks the user to *"find every requirement that is missing"* and then
prints *"The immersive deliverable is no longer specified as stereo"* and *"One
named person replaces 'the board'"*. The noticing is the skill; the checklist
removes it. Show the criteria **count** first ("six things are wrong with this
plan — find them"), reveal each label only once met, and offer a "show me what is
left" escape after a first attempt.

(b) **The debrief is locked behind success.** Lines 147-163 render it only when
`done` is true. The learner who cannot solve it — the one the debrief was written
for — never reads it. Every one of these debriefs is the best paragraph in its
stage. Offer it on request at any time, with a "you have not finished yet" note.

**Why it improves learning.** (a) restores the diagnostic half of the exercise,
which is the half that transfers to real work. (b) stops the teaching from being
a reward for already knowing.

**Size: small.**

### 4 · Fix the progress signal: colour, score floor, and a stage-level number

**The change.** Three small fixes in `readiness.ts` and `ReadinessMeter.tsx`.

- **The bar is red for the entire journey.** `ReadinessMeter.tsx:45-55` fills the
  bar with `verdictTint`, and `readiness.ts:166-167` returns `not_ready` while a
  single required decision is outstanding. So the bar goes red-5% → red-60% →
  red-95% → green, in one jump, after hours of work. Use a neutral or amber
  progress tint and keep `verdictTint` on the verdict text and score only.
- **The score reads 0 for the first fifth of the work.** `readiness.ts:158-160`:
  `penalty = Math.min(0.2, attention * 0.02)` and `score = max(0, (base −
  penalty) × 100)`. A blank Pre-Production project fires well over ten attention
  findings, so the penalty pegs at its 0.2 cap immediately and the headline
  number stays at 0 until roughly 20% of required decisions are made. The first
  session produces no visible movement. Either floor the penalty at a fraction of
  `base`, or show progress and quality as two numbers instead of subtracting one
  from the other.
- **`Complete` overstates.** `readiness.ts:113-115` measures a stage on required
  fields only. Pre Stage 5 has 34 fields and ~7 required, so seven answers turn a
  34-field stage green while 27 stay blank and print *"Not decided"* in the
  packet (`packet.ts:242-247`). Show both counts on the stage row —
  `StageProgressRow` (`ReadinessMeter.tsx:104-116`) currently shows only the
  state word.

**Why it improves completion.** Progress feedback is the only motivator in a
180-field task, and all three of these currently withhold it. A learner needs to
see the first hour of work move the number.

**Size: small.**

### 5 · Give the packet a screen, and let the user own their project

**The change.** (a) Add a packet **preview route**. `packet.ts:9-11` promises
*"the on-screen preview and the PDF render the exact same string"* — there is no
preview. `ProductionLabScreen.tsx:270-286` offers only `SHARE AS PDF`, and the
fallback copy claims *"Everything in the packet is readable on these screens
now"*, which is only true field-by-field across six to eight stages. The packet
HTML is pure (`buildPacketHtml`), so a WebView or a native render of the same
sections is cheap. (b) Let the user **rename and delete** a project —
`ProductionLabScreen.tsx:181` renders the name as static `Text`, every project is
born as *"Music recording project"*, and `projectStore.remove`/`duplicate`
(`projectStore.ts:199-224`) are unreachable from any screen. (c) **Keep
exercises out of the project list.** `ProductionActivityScreen.tsx:59-61`
upserts the seeded exercise, `projectStore.ts:197` `unshift`es it to index 0, and
`ProductionLabScreen.tsx:57` opens `list[0]`. So after one exercise the lab home
opens on *"Repair the vague brief"* with the exercise's readiness. The predicate
to prevent this — `isActivityProject` (`activities.ts:107`) — exists and is
called by nothing.

**Why it improves completion.** The packet is the payoff and the reason to finish;
right now it is invisible until a PDF export succeeds. And a lab the user cannot
name, tidy or keep separate from its own practice material does not feel like
their plan, which is the whole premise.

**Size: (a) medium, (b) and (c) small.**

---

## Everything else, ranked

### High — affects whether the teaching lands

1. **Table cells ignore their column kind.** `FieldRow.tsx:288-295` renders every
   cell as a plain `TextInput`, whatever `ColumnDef.kind` says. `choice` columns
   with authored `options` — and there are many; `validateSeeds`
   (`schema.ts:343-390`) exists specifically to police them — become free text.
   Rules then compare typed prose against option values via `cell()`
   (`rules.ts:129`), so a user who types "Stereo" instead of picking `stereo`
   silently fails the check that was supposed to teach them. This is the single
   place where the rules engine can quietly stop working, and it sits in the most
   data-dense control in the lab.

2. **Notice fatigue undermines the owner's own standard.** 42 notices across the
   two labs, `AccuracyNote variant="practice"` in all three screen headers on top
   of that. Pre Stage 6 alone carries nine (`preprod/stage6.data.ts`), and four
   near-identical QUALIFIED notices about licensed electricians appear in stages
   3, 4, 5 and 6. The standard ("a notice at each point where one applies") is
   right; the execution is repetitive enough that users will scroll past the one
   that matters. Deduplicate the boilerplate, keep one full statement per stage,
   and reserve the red QUALIFIED treatment for the genuinely hazardous stages.

3. **Post-Production never explains its own core vocabulary.** `loudness_target`
   help is *"From the specification, in LUFS"*; `true_peak_max` is *"From the
   specification, in dBTP. This is a ceiling, not a target"*
   (`postprod/stage1.data.ts:316-332`). A beginner who does not know what a true
   peak is learns nothing here, and Post Stage 7 then asks them to enter a
   *measured* one. Pre-Production does this correctly (see `stage_plot`,
   `preprod/stage5.data.ts:131`). Either add a sentence of mechanism to those
   three fields or link `MeterLab` from the field, not only from a rule.

4. **Exercise coverage is badly skewed by pathway.** The `onlyFor` filter
   (`ProductionLabScreen.tsx:233`) leaves a **podcast** Pre-Production user with
   3 of 6 exercises, and a **music** Post-Production user with 5 of 8 — and the
   one music loses is `meet-the-specification` (`postprod/stage7.data.ts`,
   `onlyFor: ["podcast","live"]`), the loudness-and-true-peak exercise, which is
   the most relevant post exercise there is for a music release. Meanwhile
   `save-the-production` (`preprod/stage4.data.ts`) has no `onlyFor` at all and
   offers a three-act live-show scenario to podcast users. Re-map, or author a
   music variant of the two highest-value seeds.

5. **Free-text pass conditions can be satisfied without thinking.**
   `preprod/logic.ts:665-671` passes `success-checkable` on any non-empty string
   that `isMostlyEmptyPraise` does not reject — and that helper returns `false`
   for anything under four words (`rules.ts:220`). "Client signs off" passes.
   "asdf" passes. Three of the five criteria in `repair-the-brief` are shape
   checks, not content checks. The structural exercises (`save-the-production`,
   `route-the-mix`, `the-upload-succeeded`) are excellent by contrast and prove
   the pattern works — the brief-repair exercise is the one that should be
   re-scoped to structural criteria, or pair each free-text criterion with a
   worked example the user can compare against.

6. **The readiness score rewards typing, not deciding.** `isAnswered`
   (`types.ts:184-191`) accepts any non-whitespace string, and the score is
   `answeredRequired / totalRequired` (`readiness.ts:156`). A user who types "x"
   into all ~60 required Pre-Production fields scores 100 and reads *"Ready for
   Production"*. The plan's stated invariant — the meter must not reward visits —
   is met; the stronger claim in §2.3, that it evaluates *decisions*, is only met
   where a computed rule happens to inspect the value. This is inherent to the
   design and probably acceptable, but it should be a known limit rather than a
   surprise, and it argues for more of the 78 attention-severity Pre-Production
   rules getting real `needsLogic` implementations (currently 10 of 90 fire on
   nothing more than emptiness).

7. **There is no project-wide list of findings.** The meter shows only blockers
   (`ReadinessMeter.tsx:60-87`). The other ~200 attention and info findings are
   reachable only by opening each stage and scrolling to its floor. A "what this
   plan still needs" screen, grouped by stage, would turn the rules engine from a
   thing you stumble into a thing you consult.

8. **`START AGAIN` destroys work with no confirmation.**
   `ProductionActivityScreen.tsx:77-84` calls `projectStore().remove()`
   immediately. It sits directly below the criteria list on a long scroll, styled
   as quiet muted text — which makes it *more* likely to be tapped by accident,
   not less.

### Medium — craft and usability on a phone

9. **Almost every repeating tap target is under the 44 pt / 48 dp minimum.**
   Choice and multiChoice chips: `paddingVertical: 7` + 12.5 pt text ≈ **29 pt**
   (`FieldRow.tsx:346-353`) — and these are the most-tapped controls in both labs.
   "Not applicable to this project": 12 pt text + `hitSlop 6` ≈ **26 pt**
   (`FieldRow.tsx:105-108, 371`). Table row remove `✕`: ≈ **34 pt**
   (`FieldRow.tsx:299-306`). `+ ADD ROW`: ≈ **35 pt** (`FieldRow.tsx:389-396`).
   Stage rows: `paddingVertical: 9` ≈ **38 pt** (`ReadinessMeter.tsx:168`).
   The fix is `minHeight: 44` on the chip and the two table controls; the visual
   density need not change.

10. **The table editor is the right shape but unfinished.** Stacking
    label-over-input per cell rather than drawing a grid
    (`FieldRow.tsx:282-308`) is the correct call for a phone — credit where due.
    What is missing: the `✕` is pinned at `paddingTop: 22` so it aligns to the
    first cell of a 5-column row and floats mid-air on the rest; there is no row
    number or divider, so two adjacent 6-cell rows read as one twelve-field
    block; there is no `placeholder` from `ColumnDef`; and `ColumnDef.unit` is
    never rendered. Pre Stage 6 has seven tables on one screen
    (`preprod/stage6.data.ts`, 39 column definitions) — that stage is where this
    will hurt most.

11. **Every keystroke writes the whole project to AsyncStorage.**
    `ProductionStageScreen.tsx:60` calls `projectStore().setValue` on each
    `onChangeText`, which serialises the full project array
    (`projectStore.ts:144-151`) and then re-runs `readStage` → `evaluateStage`
    over all 15-19 rules on the returned object. On a long-text field that is a
    findings panel churning under the user's thumb while they type. Debounce the
    write, or commit on blur.

12. **No keyboard ergonomics.** No `returnKeyType`, no `onSubmitEditing`
    focus-next, no "Done" accessory on the `keyboardType="numeric"` fields
    (`FieldRow.tsx:137-158`) — on iOS the number pad has no dismiss key, and Pre
    Stage 4 has eight consecutive number fields. `AcceptConditionSheet` has a
    multiline input near the bottom of a `ScrollView` inside a `Modal` with no
    `KeyboardAvoidingView` (`AcceptConditionSheet.tsx:52`), so the "Reason" field
    will sit behind the keyboard on a phone.

13. **`date` fields are free text.** `FieldRow.tsx:160-172` renders a
    `YYYY-MM-DD` placeholder and nothing else. There are date fields across every
    stage, several of them load-bearing for rules (`define-deadline-past`,
    `review-before-delivery`). A typo silently disables the rule — `when()`
    returns `null` and the rule says nothing (`rules.ts:100-115`). The `time` kind
    is correctly free text with a lenient parser and a teaching placeholder; the
    date kind deserves at least the same care.

14. **The section is the only navigation unit and it does not navigate.** Section
    titles (`ProductionStageScreen.tsx:129`) are static text. On Pre Stage 5 —
    eight sections, ~15 screens — there is no way to reach "Monitoring and
    Communication" except by scrolling past seven other sections. Collapsible
    sections with a per-section decision count would fix the navigation and the
    scroll length in one move.

15. **Ceremony fields worth cutting or merging.** Named, with what is lost:
    - `preprod/stage1` creative block — `style`, `tone_mood`, `energy`,
      `emotional_arc`, `sonic_requirements`, `avoid`, `artist_preferences` are
      **seven** fields, five of them free text, circling one question already
      asked by the required `creative_objective`. Merge to three (`tone_mood`
      absorbing `energy` and `emotional_arc`; `sonic_requirements` absorbing
      `avoid`). *Lost:* a little structure in the packet's creative page.
    - `preprod/stage4` resources — `available_channels`, `available_inputs`,
      `monitor_mixes_needed`, `monitor_mixes_available`, `spare_inputs`,
      `storage_available`, `recording_hours`, `crew_count` are eight bare numbers
      sitting immediately above `resource_table` ("Everything else, needed
      against available"), which is the same shape. Fold them into seeded rows of
      that table. *Lost:* real — `preprod/logic.ts` reads several of them by
      fieldId (`channels-cover-sources`, `inputsExceedCapacity`,
      `STORAGE_MARGIN`), so the rules must move to reading table rows. Worth it:
      it removes eight fields and makes the "needed vs available" idea visible
      instead of implied.
    - `preprod/stage3` crew roster — 16 individual name fields
      (`engineer_primary` … `mastering_engineer`, `safety_lead`) plus a
      `crew_other` table plus a `task_matrix` table. The 16 are a table. *Lost:*
      significant — `SIMULTANEOUS_ROLES` and four activity criteria address them
      by fieldId. Recommend leaving them and gating them behind `showWhen`
      (improvement 1) instead.
    - `postprod/stage1` creative block — `creative_brief`, `references`,
      `sonic_character`, `must_stay_natural`, `prohibited_changes` are five
      consecutive `longText` boxes. `must_stay_natural` and `prohibited_changes`
      are close enough to merge. *Lost:* little.
    - `postprod/stage3` — `pan_law`, `colour_meaning`, `session_start`,
      `version_log`, `processing_format`. Real professional concerns, but none of
      them is a *plan* decision and none is watched by a rule that teaches
      much. Demote to a collapsed "session detail" group.
    - `postprod/stage8` archive — six fields (`archive_contents`,
      `consolidation`, `archive_copies`, `archive_locations`, `archive_record`,
      `retention_period`) plus `restore_tested`. Keep `restore_tested` (it
      carries the lesson) and merge three of the rest.

16. **Packet shortcomings.** `packet.ts:107` reads the author from
    `define.project_lead` — a Pre-Production field — so **every Post-Production
    packet is authored "Unattributed"**. The document-control block
    (`packet.ts:92-110`) has `distribution` and `confidential` in the type and
    populates neither, though `preprod/stage6` authors a `distribution` field.
    Blockers print at the top and attention findings print per stage
    (`packet.ts:255-262`), which is right, but info-severity findings are
    included at the same weight, and Post-Production has 25 of them.

### Accessibility

17. **Field state is conveyed by colour alone.** The 7 px dot
    (`FieldRow.tsx:50, 324`) is the only indicator of `complete` / `attention` /
    `missing` / `conflict` / `na`, it carries no accessibility label, and the
    field's `accessibilityLabel` is just `field.label`
    (`FieldRow.tsx:133, 154, 170, 256`). A screen-reader user gets no state at
    all, and neither does a colour-blind sighted user. Fold the state into the
    label: `` `${field.label}, ${READINESS_LABEL[state]}${required ? ', required' : ''}` ``.
    The same applies to `StageProgressRow` (`ReadinessMeter.tsx:107-114`), which
    at least prints the state word — but the `Pressable` wrapping it
    (`ProductionLabScreen.tsx:206-210`) overrides with
    `"Stage 3, Organise People and Responsibilities"` and drops it again.

18. **Nothing is announced.** No `accessibilityLiveRegion` and no
    `announceForAccessibility` anywhere in `src/screens/lab/production/` — 39
    other files in the app use them. The three moments that matter: a finding
    appearing or clearing as a field is answered; an activity criterion flipping
    to met; the verdict changing. A sighted user sees the dot turn green; a
    screen-reader user has no equivalent, and the dot is the only feedback the
    form gives.

19. **The table editor is close but not there.** Cells are labelled
    `` `${c.label}, row ${i + 1}` `` (`FieldRow.tsx:294`), which is genuinely good.
    But there is no grouping: a 6-column, 4-row table is 24 flat inputs with no
    row boundary in the accessibility tree. Give each row a container with
    `accessibilityLabel={`Row ${i+1} of ${rows.length}`}`. Add
    `accessibilityHint` to `+ ADD ROW` and confirm the `✕` is not the last thing
    focused before the row it deletes disappears.

20. **Headings are not headings.** No `accessibilityRole="header"` on any stage
    title, section title, or `sectionTitle` in the three screens. On a
    15-screen document, heading navigation is the only practical way through it.

21. **Minor.** `AcceptConditionSheet` does not focus the name field on open, and
    the "Both a name and a reason are needed" explanation
    (`AcceptConditionSheet.tsx:113-115`) renders *below* the disabled button and
    is not attached to it as an `accessibilityHint`. The
    `"Not applicable to this project"` `Pressable` (`FieldRow.tsx:105`) has a
    role but no explicit label, so it reads identically on all 34 fields of a
    stage with no indication of which field it belongs to.

### Low

22. `postprod/stage1.data.ts` `frame_rate` and `start_timecode` are
    `onlyFor: ["podcast","live"]` — present on podcast, absent on music — while
    `brief-no-frame-rate` is a **blocker**. Picture work is more plausibly a
    music-video or film concern than a podcast one; the pathway mapping looks
    inverted.
23. `NUMBER_WORD` (`ProductionLabScreen.tsx:42`) covers 4-9 only and falls back
    to the digit. Fine today; brittle if a lab grows.
24. `ProductionStageScreen.tsx:100` — *"This stage is not authored yet."* — is
    now unreachable (both labs fully authored) and is the kind of string the
    banned-copy sweep should own; `findBannedCopy` (`schema.ts:406-420`) checks
    authored content but not screen strings.
25. The blocker box pluralises by hand (`ReadinessMeter.tsx:62-64`) — *"ONE THING
    BLOCKS THIS PROJECT"* is a nice touch and worth copying to the stage
    findings header, which is always the flat *"WHAT THIS PLAN IS STILL MISSING"*
    even when the finding is a conflict rather than an absence
    (`ProductionStageScreen.tsx:154`).

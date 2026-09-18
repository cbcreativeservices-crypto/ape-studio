# Bug hunt — PASS 1: The Labs, the Catalog, and Content Integrity

Repo `C:\Users\profe\dev\ape-studio`, branch `audio-tools-engine`, 2026-09-17.
Read-only pass. No files changed, nothing committed, no build/EAS/update command run, no dev server started.

## Baseline

- `npx tsc --noEmit` → **clean, exit 0**.
- `npm test` → **1429 tests, 1429 pass, 0 fail** (210 suites, 6.7 s).

Everything below is therefore something the existing tests and the type system do **not** catch.

## What I examined

- `src/screens/lab/labCatalog.ts` — every leaf, resolved against both `src/navigation/types.ts` (`RootStackParamList`) **and** the real `<Stack.Screen>` registrations in `src/navigation/RootNavigator.tsx`.
- `src/features/production/**` — all 28 files, 16,603 lines: `types.ts`, `schema.ts`, `rules.ts`, `readiness.ts`, `activities.ts`, `labs.ts`, `packet.ts`, `projectStore.ts`, and both content sets (6 pre-production stages, 8 post-production stages, 4 logic files).
- `src/screens/lab/production/**` — all 6 screens/components.
- `src/screens/lab/calc/**` — all 15 workspace files, `registry.ts`, `calcTypes.ts`, `calcUnits.ts`, `calcPanel.tsx`, `CalcWorkspaceScreen.tsx`.
- `src/features/lab/**` — guided-lesson registry and content, `labCompletion.ts`, `labMembership.ts`.
- `src/screens/lab/EarLabScreen.tsx`, `LabCategoryScreen.tsx`, `AudioLearningScreen.tsx`, and the module registries of the cymatics / wave / meter / digital / eq / gain / amp hubs.
- `src/navigation/linking.ts` and `linkPaths.ts`, for the lab deep links.
- `test/productionEngine.test.ts` (2,249 lines) — to establish what is already guaranteed.

Analysis was done by reading plus scripted checks that import the real modules (the same `registerHooks` loader the repo's own tests use), so every claim about content is machine-verified against the shipping data, not inferred.

## What I could NOT check

- **Anything requiring a device or a running app.** No dev server (port 8091 is owned by another process), so nothing here is a visual or interaction confirmation.
- **Remote assets.** `connectorImages.ts`, `micImages.ts`, `tubeRefs.ts` build Supabase Storage URLs. I verified the maps are `Partial<Record<…>>` with a documented null fallback (never a broken image), but I did not probe the bucket — no network calls.
- **Server-side lab-catalog seeds.** `af_cables`, `af_cable_install`, `af_patchbay`, `af_connector_select` are present in `labCompletion.ts` and in `docs/APE_*_SEED_*.sql` but the seeds are owner-run. I could not query Supabase to confirm the rows exist. The `lab_not_found` guard means completion queues rather than fails, so this is tracked, not broken.
- **Glossary term links.** Workspace `glossary: [...]` arrays reference Supabase terms; offline I cannot resolve them.
- **PDF output.** `exportPacketPdf` needs expo-print/expo-sharing native modules; I verified the pure `buildPacketHtml` path only.

---

# BLOCKERS

## The production table editor ignores every column's kind and options — 92 typed columns render as blank free-text boxes

**Severity:** blocker
**Where:** `src/screens/lab/production/FieldRow.tsx:270-303` (`TableEditor`), specifically line 292.

**What happens:** In both new Production labs, every repeating table — the deliverable list, the delivery spec table, the media inventory, the take log, the cue list, the rights register, the bus structure — draws each cell as a plain `TextInput` with no options, no chips, no picker. The user sees a label like "Sample rate" and an empty box. To satisfy the lab's own rules they have to type the internal machine value exactly: `48000`, `32f`, `7_1_4`, `adm_bwf`, `will_not_arrive`, `in_context`, `preferred`, `per_clip`. Nothing on screen tells them those strings exist. Type `48 kHz` and the rule that compares sample rates silently stops working; the meter reads healthy because the check returned "nothing to say".

**Why:** `TableEditor` maps over `field.columns` and renders one `TextInput` per column. The only thing it reads off `ColumnDef` is `kind`, and only to pick a keyboard:

```tsx
keyboardType={c.kind === 'number' || c.kind === 'currency' ? 'numeric' : 'default'}
```

`c.options` is never referenced anywhere in the file (`grep options FieldRow.tsx` → lines 196/199/202/225 only, all in the *top-level* choice/status/multiChoice editors). So `kind: 'choice'`, `'multiChoice'`, `'status'`, `'date'` and `'time'` columns all collapse to untyped text. Counted against the shipping content:

| | table fields | columns | choice | multiChoice | status | date |
|---|---|---|---|---|---|---|
| preprod | 24 | 148 | 41 | 2 | 2 | 9 |
| postprod | 16 | 100 | 33 | 1 | 2 | 2 |

**74 choice columns, 3 multiChoice, 4 status, 11 date — 92 typed columns — are unreachable through the UI.** The parsers confirm the strictness: `postprod/logic.ts:40` `RATE()` returns `null` for anything `Number()` cannot read, and `DEPTH()` (line 48) only accepts the literals `'16'`, `'24'`, `'32f'`. `cellMany` (line 396) falls back to splitting on `,;|`, so multiChoice columns half-work by luck; choice columns do not.

The schema layer knows this contract exists — `validateSeeds()` in `schema.ts` exists purely to check that seeded table cells use real column ids and real option values. The editor was never taught the same thing.

**Fix:** In `TableEditor`, branch on `c.kind` the way `Editor` already branches on `field.kind`: render chips for `choice`/`status` from `c.options ?? STATUS_OPTIONS`, multi-select chips for `multiChoice` (writing an array, which `cellMany` already handles), and the `YYYY-MM-DD` / clock-time inputs for `date`/`time`. The existing `chip`/`chipOn` styles in the same file can be reused directly; the horizontal room is tight, so a compact wrapping chip row under the cell label is the minimal change.

---

## The "Add without erasing" exercise can never be completed on the Music pathway

**Severity:** blocker
**Where:** `src/features/production/postprod/stage5.data.ts:539-540` (the activity, which declares no `onlyFor`) and `src/features/production/postprod/logic2.ts:725-727` (the criterion).

**What happens:** A learner with a Music post-production project opens Stage 5's exercise, repairs every one of the seeded faults, and the checklist still shows one outstanding item — *"Something manages the relationship between music and speech"* — with no field anywhere in the lab that could satisfy it. The exercise never reads SOLVED, so the debrief never unlocks. Restarting re-seeds the same dead end.

**Why:** the criterion is

```ts
{
  id: 'music-and-speech-managed',
  label: 'Something manages the relationship between music and speech',
  met: (c) => many(c.get('build', 'music_speech_relationship')).filter((m) => m !== 'none').length > 0,
},
```

and the field it reads is declared `onlyFor: ["podcast", "live"]` (`stage5.data.ts:240`, `onlyFor` at line 252). `resolveStage(stage5, 'music')` drops it, so it is never rendered, `c.get` returns `undefined`, `many()` returns `[]`, and the criterion is a constant `false`. The activity has no `onlyFor`, so `ProductionLabScreen.tsx:236` (`.filter((s) => s.activity && (!s.activity.onlyFor || s.activity.onlyFor.includes(project.pathway)))`) offers it on all three launch pathways.

Verified by resolving the `build` stage per pathway:

```
music   … music_speech_relationship = false   correction_target = true
podcast … music_speech_relationship = true    correction_target = false
live    … music_speech_relationship = true    correction_target = true
```

`validateStages`/`validateSeeds` do not catch it: both check the **base** schema, not the pathway-resolved one, and neither looks at criterion bodies at all.

**Fix:** the scenario prose (a re-recorded line, a music bed, an atmosphere track, a sung tag) is a podcast/spoken-word episode, so the smallest correct change is to add `onlyFor: ["podcast", "live"]` to the activity in `stage5.data.ts`. That also resolves the podcast half of the seed problem below. Then add a test that, for each activity and each pathway it is offered on, every field its criteria read is present after `resolveStage` — the same shape as the existing `missingChecks` assertion.

---

# SERIOUS

## Exercise projects are saved into the user's project list and can become the default open project

**Severity:** serious
**Where:** `src/screens/lab/production/ProductionActivityScreen.tsx:54-62`, `src/screens/lab/production/ProductionLabScreen.tsx:55-59`, `src/features/production/activities.ts:107`.

**What happens:** The user starts a real Music project in Post-Production, then tries an exercise. The exercise creates a second, deliberately-broken project in the same store. It now appears as a chip in the project switcher next to their own work, named after the exercise ("Add without erasing"). If they leave the lab and come back, the lab home opens on the **exercise** project — showing its broken readiness meter, its blockers, and a "SHARE AS PDF" button that exports the exercise as if it were their production packet.

**Why:** `activities.ts` documents the separation and provides the predicate for it —

```ts
/** Is this project an exercise rather than the user's own production? */
export function isActivityProject(p: ProductionProject): boolean {
  return typeof p.scenarioId === 'string' && p.scenarioId.length > 0;
}
```

— and **nothing calls it**. `grep -rn "isActivityProject" src/` returns only its own definition. `ProductionLabScreen.reload()` loads the unfiltered list and picks the first row:

```ts
const list = await projectStore().load(lab);
setProjects(list);
setOpenId((cur) => cur ?? list[0]?.id ?? null);
```

and `projectStore.upsert` puts a **new** project at the front (`all.unshift(row)`), so the most recently seeded exercise is `list[0]`. On a remount `cur` is `null`, so it wins.

A second, smaller defect in the same code path: `load()` in `ProductionActivityScreen` finds an in-progress exercise by `scenarioId` alone, ignoring pathway. Open the same exercise from a Podcast project after starting it from a Live one and it resumes the Live-seeded project while the screen prints `PATHWAY_LABEL[pathway]` from the route params — the header says Podcast, the fields are Live.

**Fix:** in `ProductionLabScreen.reload()`, filter with the predicate that already exists: `const list = (await projectStore().load(lab)).filter((p) => !isActivityProject(p))`. In `ProductionActivityScreen.load()`, match on both: `.find((p) => p.scenarioId === activityId && p.pathway === pathway)`.

## Seven lab deep links are declared in `linking.config` but rejected before React Navigation sees them

**Severity:** serious
**Where:** `src/navigation/linkPaths.ts:141-143` vs `src/navigation/linking.ts:83-93`.

**What happens:** Every lab deep link with more than two path segments silently does nothing — the OS hands the URL to the app, the app declines it, and the user lands on the website or nowhere. That covers both of the new Production labs' inner routes and all five Cymatics sub-routes.

**Why:** `isAcceptedLink` is the single gate on every incoming URL (`linking.ts:44` `filter: isAcceptedLink`), and it delegates to:

```ts
const [head, second, ...more] = path.split('/');
switch (head) {
  ...
  case 'labs':
  case 'glossary':
  case 'topics':
    return more.length === 0;
```

`labs/<x>` passes; `labs/<x>/<y>` and deeper do not. Verified by calling the real function:

```
CLAIMED   labs/pre-production
CLAIMED   labs/post-production
CLAIMED   labs/cymatics
REJECTED  labs/cymatics/plate
REJECTED  labs/cymatics/liquid
REJECTED  labs/cymatics/membrane
REJECTED  labs/cymatics/gallery
REJECTED  labs/cymatics/module/harmony
REJECTED  labs/production/preprod/p_123/define
REJECTED  labs/production/postprod/exercise/add-without-erasing/music
```

The `labs/production/...` patterns were added with the Production labs today; the cymatics ones have been dead since the studio routes landed.

**Fix:** widen the `labs` case to accept the shapes actually registered, e.g.
`case 'labs': return more.length === 0 || (second === 'cymatics' && more.length <= 2) || (second === 'production' && more.length <= 3);`
and add a test asserting every path string in `linking.config.screens` passes `isClaimedPath` — that single test prevents the whole class.

**Note on a latent crash this currently masks:** `ProductionStageScreen:88` calls `labDef(lab).title` and `ProductionActivityScreen:42` calls `stageForActivity(lab, …)` → `LABS[lab].stages`, both unguarded. `labDef` is `LABS[lab]`, which is `undefined` for any string that is not `'preprod'`/`'postprod'`, so a link like `labs/production/foo/x/y` would throw during render. Right now `isClaimedPath` rejects it first. **Fixing the gate above without also validating `lab` turns a dead link into a crash** — guard both screens with `if (lab !== 'preprod' && lab !== 'postprod') return <NotAvailable/>` in the same change.

## Sabine "SURFACE AREAS" is metric-only with no unit control, beside sibling fields that offer ft² / ft³

**Severity:** serious
**Where:** `src/screens/lab/calc/workspaces/roomsMusic.ts:846-852`, with the mechanism at `src/screens/lab/calc/calcPanel.tsx:146`.

**What happens:** A US installer sets ROOM VOLUME to ft³ (the chip is right there), sets TOTAL ABSORPTION A to ft² (same), then types surface areas in ft² into a field that has no chip and no unit in its name. The calculator treats them as m². A 100 m³ room with 54 m² of absorption should read **RT60 = 0.298 s**; the same surfaces entered in ft² (×10.764) read **RT60 = 0.028 s** — an anechoic chamber. In the treatment planner that error propagates straight into a panel count.

**Why:** the field is

```ts
key: 'surfaces',
name: 'SURFACE AREAS',
quantity: 'list',
placeholder: '20, 20, 12.5',
help: 'Comma-separated areas in m², one per surface (walls, floor, ceiling, panels…).',
```

and `calcPanel.tsx` suppresses the unit chip for every list field:

```tsx
{!isList && units.length > 0 && units[0].label !== '' ? (
```

so "m²" survives only inside the collapsed ⓘ help, while `vol` (line 838, `quantity: 'volume'`) and `absA` (line 842, `quantity: 'area'`) both render a tappable ft³/ft² chip two rows above it.

The formula itself is correct: `RT60 = 0.161·V/A` metric. Arithmetic confirmed — `0.161×100/54 = 0.2981`, `0.161×100/581.3 = 0.0277`.

**Fix:** rename the field `SURFACE AREAS (m²)`. The file already uses that convention (`'PANEL MASS (kg/m²)'`, `'CAPACITANCE (µF)'`, `'RESISTORS (Ω, comma-separated)'`), so it is a one-line change consistent with the house style. Same treatment for the sibling `coeffs` field, which has no warn at all — an α entered as `90` instead of `0.9` returns an RT60 100× too short.

## Exposure-dose "INTERVAL DURATIONS" is minutes-only with no unit indicator

**Severity:** serious
**Where:** `src/screens/lab/calc/workspaces/splSafety.ts:390`.

**What happens:** In a hearing-safety calculator, a 4-hour show at 97 dBA entered as `4` (hours, the natural reading) instead of `240` reports **13.3 % of the daily allowance** where the true figure is **800 %**. A 60× under-report on a dose calculation.

**Why:** same root cause as the Sabine field — `quantity: 'list'` suppresses the unit chip, so "MINUTES" appears only in the collapsed help:

```ts
{ key: 'doseMins', name: 'INTERVAL DURATIONS', quantity: 'list', placeholder: '240, 90, 30', help: 'Duration of each interval in MINUTES, comma-separated — same order as the levels.' },
```

Every other time field in the lab (`rt60`, `delay`, `dur`, `interval`) shows an ms/s/min chip, which trains the user to expect one. The dose math is correct — `allowMin` returns `8 × 60 × 2^(-(L-85)/3)` minutes and the output converts to base seconds before display; the mismatched-list-length guard (lines 471-480) is sound.

**Fix:** rename to `INTERVAL DURATIONS (MINUTES)`. The placeholder `240, 90, 30` already implies it; the label should say it.

## The 70 V workspace's own worked example contradicts its calculator by a factor of four

**Severity:** serious
**Where:** example at `src/screens/lab/calc/workspaces/speakers.ts:677-681`, function at `speakers.ts:803-804`.

**What happens:** The teaching copy says *"13 more 10 W speakers could join before the amp is fully allocated."* A user runs the calculator with the identical numbers (250 W amp, 120 W tapped, 10 W taps, 2 dB headroom) and gets **3**. In a lab the owner has designated a source of truth, the lab and its own example disagree.

**Why:** both are internally right, and they answer different questions. The example uses raw remaining capacity — 250 − 120 = 130 W → 13 speakers. The function reserves the headroom first:

```ts
const usable = prated / Math.pow(10, hr / 10);   // 250 / 1.5849 = 157.74 W
const more = Math.max(0, Math.floor((usable - load) / tapw));  // (157.74 − 120)/10 = 3
```

Verified: `250/10^(2/10) = 157.739`, `floor((157.739−120)/10) = 3`. The function's behaviour is the defensible one (its own `note` says "Reserves the headroom FIRST"), so the prose is what is wrong.

**Fix:** change the example to *"…and 3 more 10 W speakers could join while keeping the 2 dB of headroom (13 if the amplifier is allocated to its full rating)."*

## `warn` never blocks a calculation, and never runs at all on list fields

**Severity:** serious
**Where:** `src/screens/lab/calc/calcPanel.tsx:120-122` and `:60-72`.

**What happens:** Nonsense input produces a confident, plausible number beside a soft amber warning the user can scroll past. Negative inputs are the dangerous case, because they stay finite:

- `levels.ts:339` `pFromVZ` — a negative RMS voltage returns a correct-looking positive wattage (`V²` discards the sign).
- `powerElec.ts:427-428` — negative R or L are warned but still computed; `|Z| = √(R²+X²)` swallows the sign and reports a normal magnitude.
- `splSafety.ts:810-811` limiter `maxv` — a negative power rating with a negative impedance returns a plausible positive voltage.

**Why:**

```tsx
const baseVal = isList ? NaN : unit.toBase(parseFloat(raw));
const warn = field.warn && Number.isFinite(baseVal) && field.warn.test(baseVal) ? field.warn.msg : null;
```

`compute()` runs regardless (lines 60-72), which `calcTypes.ts:35` documents as intentional. It is mostly safe because divide-by-zero and `log10(0)` yield `Infinity`/`NaN`, which `fmt()` renders `—`. The second half is the sharper problem: `baseVal` is hard-coded to `NaN` for list fields, so `Number.isFinite(baseVal)` is always false and **a `warn` on a list field can never fire** — which is why the Sabine `coeffs` field above cannot be defended even by adding one.

**Fix:** for the safety-adjacent workspaces (Voltage Drop, Rack Power, Limiter Threshold, Exposure & Dose, Sabine/Treatment), promote `warn` to a hard block — suppress the result row and show the message where `computeError` already shows its own, so a refused input cannot be mistaken for an answer. Separately, evaluate `warn` per-element for list fields instead of skipping them.

## `learnMore` is authored on eight rules and rendered nowhere

**Severity:** serious
**Where:** authored across `src/features/production/preprod/stage*.data.ts` and `postprod/stage*.data.ts`; plumbed at `src/features/production/rules.ts:311`; consumed by nothing.

**What happens:** The design intent — *"An existing lab or tool that teaches this. Deep link, never a rebuild."* (`types.ts:130`) — is unrealised. A user who hits "the signal path ends nowhere" is never offered the Signal Chain Builder; one who hits a gain-structure finding is never offered the Gain Staging lab. The eight targets authored are:

```
preprod : MicLab, MicSelectLab, SignalChainLab, DigitalLab, WaveLab, CalcLab
postprod: GainLabHome, MeterLab
```

**Why:** `Finding.learnMore` is populated by `evaluateStage` and typed all the way through, but `grep -rn "learnMore" src/screens/` returns nothing in the production screens. `ProductionStageScreen.tsx:169-182` renders `f.title`, `f.detail` and `f.fixHint` and stops. `packet.ts` does not print it either.

There is a test — `'every rule that links to another lab links to a route that exists'` (`test/productionEngine.test.ts:1721`) — which reads `navigation/types.ts` and confirms all eight routes are registered. It passes, which gives false confidence that the links work.

**Fix:** add a "LEARN THIS" pressable to the finding card in `ProductionStageScreen`, guarded on `f.learnMore`, calling `navigation.navigate(f.learnMore.route as never, f.learnMore.params as never)`. Note that six of the eight targets are member-gated (`MemberGated.MicLab`, `.DigitalLab`, etc.), so the link lands on the preview sheet for a non-member — which is the correct behaviour, not a bug.

---

# MINOR

## Every exported packet prints "Revision 0", forever

**Severity:** minor
**Where:** `src/features/production/types.ts:98` (the contract), `packet.ts:105`, `:149`, `:268`; `projectStore.ts:111`, `:214`.

**What happens:** The document-control block at the top of every Production Packet and Delivery Package reads `Revision 0`, and so does the footer of every page, no matter how many times the packet is exported or how much changed between exports. A revision number that never moves is worse than no revision number — it tells a crew two different documents are the same one.

**Why:** the field's own doc comment says *"Document-control revision, incremented when a packet is exported."* Nothing increments it: `grep -n revision` across the feature returns only `revision: 0` in `newProject`, `revision: 0` in `duplicate`, the `normaliseProject` read-back, and three read sites in `packet.ts`. `exportPacketPdf` never writes to the store.

**Fix:** in `ProductionLabScreen.sharePacket`, before calling `exportPacketPdf`, bump it through the store and use the returned project for the export — add a `bumpRevision(lab, id)` to `ProjectStore` alongside `acceptCondition`, or call `upsert({ ...project, revision: project.revision + 1 })`. `revisionDate` should then come from the export time rather than `updatedAt`.

## The Delivery Package's "Prepared by" is always "Unattributed"

**Severity:** minor
**Where:** `src/features/production/packet.ts:107`.

**What happens:** Every Post-Production Delivery Package prints `Prepared by: Unattributed` in its document-control table, regardless of what the user entered.

**Why:**

```ts
author: String(project.values[valueKey('define', 'project_lead')] ?? 'Unattributed'),
```

`define` is a **Pre-Production** stage id. Post-Production's eight stage ids are `brief, media, edit, build, mix, finish, deliver, session` — there is no `define`, so the lookup is always `undefined`.

**Fix:** make it lab-aware. `brief.supervisor` (`postprod/stage1.data.ts:84`) is the equivalent field:
`const authorKey = project.lab === 'preprod' ? valueKey('define','project_lead') : valueKey('brief','supervisor');`

## A stale or unknown `projectId` leaves the stage screen saying "Opening the project…" forever

**Severity:** minor
**Where:** `src/screens/lab/production/ProductionStageScreen.tsx:36-45` and `:100-105`.

**What happens:** If a project is deleted, or the id comes from a resumed `pendingLink` after the store was cleared, the stage screen shows "Opening the project…" and never resolves. There is no error, no retry and no way back except the ‹ chevron.

**Why:** the effect sets state to whatever `get` returns, and `get` returns `null` when the id is absent:

```ts
void projectStore().get(lab, projectId).then((p) => { if (alive) setProject(p); });
```

The render branch then distinguishes only *authored* from *loading*: `{project ? 'This stage is not authored yet.' : 'Opening the project…'}` — so `null` is indistinguishable from "still loading".

**Fix:** track the load explicitly (`const [loaded, setLoaded] = useState(false)` set in the `.then`), and when `loaded && !project` show "That project is no longer available." with a button back to the lab home.

## `isActivityProject` is dead code

**Severity:** minor
**Where:** `src/features/production/activities.ts:107-109`.

The only consumer it was written for is the filter missing from `ProductionLabScreen` (see the serious finding above). Fixing that finding uses it; if that fix is declined, delete the function so it stops implying a separation the app does not have.

## The same exercise also seeds a field that does not exist on the Podcast pathway

**Severity:** minor
**Where:** `src/features/production/postprod/stage5.data.ts:554` (`"build.correction_target": ""`).

**What happens:** On a Podcast project, `build.correction_target` is `onlyFor: ["music","live"]` and is not rendered. The `correction-settled` criterion demands it once `correction_scope` includes `pitch` — which the seed sets. The learner can only escape by clearing the tuning scope entirely, which contradicts the scenario's stated task ("some tuning on the theme's sung tag").

Less severe than the Music case because there **is** an escape (`scope.length === 0` returns `true` — "abandoned is a valid answer"), but the exercise cannot be solved as written. Adding `onlyFor: ["podcast","live"]` to the activity fixes the Music blocker and leaves this; adding `onlyFor: ["live"]` fixes both. The scenario reads as podcast, so the cleanest resolution is `onlyFor: ["podcast","live"]` **plus** removing `pitch` from the seeded `correction_scope`, or moving the tuning half of the scenario into a live-only variant.

## Four rules point the user at fields that are not on their pathway

**Severity:** minor
**Where:** `preprod/stage3.data.ts` (`people-overload`, `people-hazards-unknown`), `stage5.data.ts` (`technical-material-not-final`), `stage6.data.ts` (`readiness-no-dress-rehearsal`).

**What happens:** When these fire, the finding's `fieldIds` include fields that `resolveStage` removed for that pathway, so the "which fields to look at" list points at rows that are not on screen.

**Why:** `evaluateStage` (`rules.ts:305-308`) derives `fieldIds` from `rule.watches` without checking against the resolved stage. Machine-checked, the affected combinations are:

```
music   people   people-overload              people.monitor_engineer | people.system_tech | people.stage_manager
music   people   people-hazards-unknown       people.rigging_required
podcast people   people-overload              (same three)
podcast people   people-hazards-unknown       people.rigging_required
podcast technical technical-material-not-final technical.stage_plot
live    readiness readiness-no-dress-rehearsal people.remote_participants
```

All six are `needsLogic: true` rules whose implementations are correct, so nothing misfires — the only cost is that `readStage`'s per-field tinting silently finds no match. It is a real hole though: `validateStages` only checks base-schema existence, so a watch that is correct today and pathway-scoped tomorrow degrades to nothing with no test failing.

**Fix:** filter `fieldIds` against `stageFields(stage)` in `evaluateStage`, and add a test that every `watches` entry resolves on at least one pathway the rule is offered on.

## The dBu step text prints arithmetic that does not reconcile, and two dBu references coexist in one file

**Severity:** minor
**Where:** `src/screens/lab/calc/workspaces/levels.ts:16-17` and `:178`.

**What happens:** The Audio Level Converter's shown working reads:

> `Offset = 20 × log10(0.775 ÷ 1) = −2.218 dB`

A student who checks it finds `20·log10(0.775) = −2.2140`, not `−2.2185`. The lab's own teaching step fails its own arithmetic.

**Why:** the printed value comes from `DBU_DBV_OFFSET = 20 * log10(Math.sqrt(0.6))` (0.7745967 V — the exact dBu reference, correctly −2.2185 dB), while the step text and the doc comment both quote the operand as `0.775`. Verified: `20*Math.log10(0.775) = -2.213966`, `20*Math.log10(Math.sqrt(0.6)) = -2.218487`.

Separately, `dbuToV` (line 81) and `vToDbu` (line 105) use `0.775`, `splSafety.ts:20` uses `0.775`, and `micsRf.ts:185` uses `0.7746` — three different roundings of the same reference across the lab. Numerically ~0.005 dB, so no result is meaningfully wrong; the visible defect is the displayed working.

**Fix:** change the step-text operand to `0.7746` and the line-16 comment to match, and export one shared `V_REF_DBU = Math.sqrt(0.6)` used by `levels.ts`, `splSafety.ts` and `micsRf.ts`.

## Voltage Drop's reverse solve sizes for 20 °C copper and hands the installer a specific gauge

**Severity:** minor
**Where:** `src/screens/lab/calc/workspaces/powerElec.ts:14`, `:284-288`.

The physics is right — I verified `R = ρ·2L/A` round-trip, `ρ_Cu = 1.724×10⁻⁸ Ω·m` (standard annealed copper), the geometric AWG table (10 AWG = 5.2612 mm², 12 = 3.3088, 14 = 2.0809, 16 = 1.3087, 18 = 0.8230 — all correct), and `Math.floor(awgReal)` correctly sizes **up**. The temperature caveat is disclosed unconditionally in the workspace `warnings` block, so this is a labelled approximation, not a hidden one.

The residual risk is that the reverse solve produces an actionable number under a header chip reading "VERIFIED CALCULATION … a source you can trust in the field". At 75 °C (NEC's normal insulation rating) copper resistance is 1.216× the 20 °C value, so a run sized to exactly a 3 % budget drops ~3.65 % in service and the required area is 21.6 % larger — about 0.84 AWG steps, i.e. one standard size too thin whenever `awgReal` sits near a whole gauge.

**Fix:** minimum viable — change the result label to `USE THIS AWG OR THICKER (at 20 °C — size up one gauge for hot runs)`. Better — add a conductor-temperature field defaulting to 20 °C with 60/75/90 °C presets.

Two smaller defects in the same function: `REQUIRED AREA` is in mm² but declared `quantity: 'number'` (line 287), whose unit label is empty, so the result row shows a bare number with the unit only in the steps; and the `awg` input field (line 231) is the only input in the workspace with no `warn` — `parseFloat("00")`, `"0000"` and `"4/0"` all collapse to 0 or 4, each reading a *thinner* wire than intended (so the reported drop is overstated and the user sizes up — the safe direction, but undisclosed). Add `help: "For 1/0–4/0 enter 0, −1, −2, −3."`

## Rack mains current and breaker sizing assume unity power factor

**Severity:** minor
**Where:** `src/screens/lab/calc/workspaces/powerElec.ts:354`, `:382`.

`I = P/V` holds only at PF = 1. Real rack gear (switch-mode supplies without active PFC, Class-AB amps) runs PF 0.6–0.9, so true line current is 10–65 % higher than reported. An 800 W rack on 120 V reports 6.7 A; at PF 0.65 it pulls ~10.3 A, and a user sizing to the 12 A continuous limit of a 15 A circuit could nuisance-trip. BTU/hr = W × 3.412, CFM = BTU/(1.08·ΔT) and the 80 % continuous-load rule are all correct. The caveat is named in the workspace `warnings` block but not beside the number.

**Fix:** move the power-factor caveat into the function-level `note` so it sits next to the result, or add an optional PF field defaulting to 1.0.

## Network-audio wire estimate charges one Ethernet header per packet regardless of MTU

**Severity:** minor
**Where:** `src/screens/lab/calc/workspaces/digitalAdv.ts:170-173`.

At the workspace's own defaults (64 ch, 48 kHz, 24-bit, 1 ms) the payload is 9216 bytes — over six Ethernet MTUs — so the real stream needs ≥7 frames and ≥7 × 78 bytes of header, not 78. Reports 74.35 Mbit/s where ~78.4 Mbit/s is closer. Labelled an estimate in `warnings`; the raw-rate function (73.728 Mbit/s) is exact.

**Fix:** `const frames = Math.ceil(payload / 1440); wireBps = pps * (payload + frames * 78) * 8;`

## Speaker-cable gauge snaps silently to the 10–18 AWG table

**Severity:** minor
**Where:** `src/screens/lab/calc/workspaces/speakers.ts:430-431`.

Entering 24 AWG (checking whether mic cable will do) computes as **18 AWG** and understates the loss. A field `warn` and a steps line both disclose the rounding, but the headline result row is wrong for the gauge entered. Note the inconsistency: `powerElec.ts` handles any gauge geometrically via `awgAreaM2()`.

**Fix:** use `awgAreaM2()` here too, or add an out-of-range row to the result instead of snapping.

## Smaller calculator issues

- **`loudness.ts:192`** — `MARGIN TO CEILING` returns a negative number when the peak is already over the ceiling, still labelled "MARGIN". Default inputs (−0.1 dBFS peak, −1 dBTP ceiling) read "−0.9 dB" where "0.9 dB OVER" is meant.
- **`speakersAdv.ts:266`** — the `lv` (PORT LENGTH) field is declared but no function consumes it; the `warnings` block describes `L_eff = Lv + 1.46·√(Av/π)` for a forward `fb` solve that does not exist. Dead field or missing function.
- **`digitalAdv.ts:250-251`** — the HH:MM:SS:FF table counts 29.97 fps at 30 labels/second (correct for non-drop timecode *labels*) while `TOTAL TIME` above it divides by 29.97 (correct elapsed time). The two differ by 0.1 % sitting side by side. Label the table "NON-DROP TIMECODE LABELS".
- **`powerElec.ts:157-158, 186-187`** — pad calculations divide by `K²−1` / `K−1`; 0 dB attenuation gives `K = 1` → `Infinity` → `—`. The `warn` catches it first, so cosmetic only.

---

# POLISH

- **`src/features/production/activities.ts:6`** — *"Twenty-seven of these across the two labs"*. There are **14**: `StageDef.activity` is singular, 6 pre-production stages + 8 post-production stages. Either the comment is stale or 13 activities were dropped; worth an owner check before the comment is simply corrected.
- **`src/screens/lab/labCatalog.ts:37`** — *"Present only on the 11 fundamentals labs"*. There are **15** keys (`af_amplitude … af_gain_staging`), all of which `labCompletion.ts` covers. Stale comment only.
- **`micsRf.ts:181` vs `splSafety.ts:694`** — the two mic calculators use different SPL→pressure anchors (`20 µPa · 10^(SPL/20)` vs `10^((SPL−94)/20)`, i.e. "94 dB = exactly 1 Pa"). They disagree by 0.02 dB on identical input. Both disclosed; harmonising on 20 µPa removes the discrepancy.
- **`digitalAdv.ts:309`** — pull-down uses `/1000` rather than the exact 1000/1001 factor (3.6 s/hour vs 3.596 s/hour; 4 ms/hour error). Industry-standard approximation and the `note` names the exact factor.
- **`ReadinessMeter.tsx:47-51`** — the progress bar fills to `answeredRequired/totalRequired` while the number beside it is `score` (base minus the attention penalty). They can differ by up to 20 points. Documented behaviour, but the bar and the number reading differently on the same card invites a bug report.

---

# Checked and found nothing

State these explicitly so a later pass does not redo them.

**Catalog integrity — clean.** All 20 categories, all 50 leaf labs plus the 163-calculator hub were resolved against both the param list and the navigator. Every `route` exists in `RootStackParamList` **and** has a real `<Stack.Screen>` registration. No category computes to 0. No duplicate category ids, no duplicate route+params pairs, no duplicate `key` values. `categoryCount` / `categoryCountLabel` / `totalLabCount` are all computed, never hard-coded. `CurriculumScreen.tsx:62` correctly subtracts the calculator count out of `totalLabCount()` so the landing does not claim 213 labs.

**No placeholder rows returned.** `grep -rn "status: *'development'" src/` matches only comments and the type declaration in `labCatalog.ts` — zero leaves carry it. `DEV_NOTE` is exported and the three screens that read it (`EarLabScreen:249,282`, `LabCategoryScreen:114,145`) are still wired, so the mechanism survives for a future update exactly as the owner asked. The `mixingworkflow` duplicate-id issue is genuinely settled — `mixing` no longer exists.

**`missingLogic` and `missingChecks` do fail loudly.** Both are asserted `deepEqual([])` against `PREPROD_STAGES` and `POSTPROD_STAGES` in `test/productionEngine.test.ts` (lines 179, 585, 589, 1677, 1678), and the suite passes. I independently re-ran the check: 90 preprod rules and 135 postprod rules, every `needsLogic` rule has a registered implementation, every activity has registered criteria. Confirmed the implementations of all 5 rules my randomised fuzz never triggered — all 5 are reachable with correlated input my generator did not produce, not dead code.

**No blocker fires on an empty project, in either lab, on any launch pathway.** Independently verified with `readProject` over a fresh project: preprod/music 17 findings (16 attention, 1 info, 0 blockers), preprod/podcast 15, preprod/live 17, postprod all three pathways 17 (14 attention, 3 info, 0 blockers). Score 0, verdict `not_ready` in every case, which is correct. The `define-approver-missing` / `deliver-list-empty` demotions held.

**Every field key read by rule logic exists.** Scanned all four logic files for `get('x','y')` / `answered('x','y')` / `isNa('x','y')` and resolved each against the real schema: **zero** unknown keys across both labs. Same for `cell(row,'col')` / `cellNum(row,'col')` against the 248 declared columns: zero unknown columns. Same for string literals compared with `===`/`includes` against the 853 declared option values: two hits, both false positives (`ctx.pathway !== 'podcast'` and a `typeof x === 'string'` guard).

**Every activity `seed` key exists in the base schema, and every criterion reads real fields** — except the `add-without-erasing` case reported above, which is the only one in either lab.

**Module registries are complete.** Every module screen dispatches through `Record<ModuleId, Component>` (cymatics, wave, meter, digital, eq, gain), which TypeScript checks exhaustively — with `tsc` clean there is no registered module without a body, and each screen falls back to `MODULES[0]` for an unknown route param rather than crashing.

**Guided lessons are complete.** All 30 `LabId` values have a `LAB_LESSONS` entry; no orphan content, no missing lesson. Nothing points at a removed screen.

**Bundled asset requires all resolve.** Every `require()` under `src/screens/lab`, `src/features/lab` and `src/features/production` was resolved against the filesystem — 4 real assets (2 lab backgrounds, the calc-lab background, `head-front.png`, `Bravura.otf`) all present; the other 14 are the lazy `skiaGate` module requires (`./vizPlate`, `./vizWave`, …) and every one of those files exists.

**Packet HTML is injection-safe.** `renderValue` returns raw HTML only for tables, and every header and cell inside those tables is passed through `escapeHtml`. All other values are escaped at the call site in `buildPacketHtml`.

**The accepted-condition escape hatch cannot become a dismiss button.** Enforced in two places independently — `projectStore.acceptCondition` refuses an entry without both a name and a reason, and `readiness.isAccepted` re-checks the same thing before clearing the blocker.

**Calculator formulas — no wrong physics found.** Every `compute()` in all 15 workspaces was read and checked against the standard equation: dB 10× vs 20×, inverse-square, Ohm's law and power, series/parallel impedance, round-trip voltage drop, delay/wavelength/room modes, Sabine and Eyring, Nyquist and bit depth, LUFS/BS.1770 windows, OSHA vs NIOSH exchange rates, critical distance, Schroeder, SBIR, mass law, QRD, Helmholtz, Thiele–Small, Butterworth crossover constants, displacement-limited SPL, Friis path loss, the 3:1 rule, FIR sizing, equal temperament. `calcUnits.ts` conversion factors are exact (ft = 0.3048, in = 0.0254, ft² = 0.09290304, ft³ = 0.028316846592, °F↔°C = (x−32)·5/9, `speedOfSoundAir` = 331.3√(1+T/273.15) → 343.2 m/s at 20 °C), and `fmt()` returns `—` for non-finite values. Unit handling is structurally sound: every non-list field converts to a metric base unit *before* `compute()` runs, so choosing ft/in/°F cannot break a metric-assuming formula — which is exactly why the two list fields above are the exceptions that matter. `AccuracyNote variant="calc"` renders in every workspace header (`CalcWorkspaceScreen.tsx:243`) and the per-workspace `warnings` block renders unconditionally, not behind a collapsible (`:526-528`). `COMING_SOON` is empty. Files read in full with nothing wrong found: `wave.ts`, `wavesAdv.ts`, `dynamics.ts`, `timePhase.ts`, `roomsSecond.ts`, `roomsAdvanced.ts`, `speakersAdv.ts` (apart from the dead `lv` field), `loudness.ts` (apart from the MARGIN sign), `micsRf.ts`, `calcUnits.ts`, `calcTypes.ts`, `registry.ts`.

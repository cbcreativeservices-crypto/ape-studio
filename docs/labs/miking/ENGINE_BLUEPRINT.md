# Miking Labs: engine blueprint (Kick slice first)

Architect's design for the builder, 2026-10-04. Branch `final-lab`. READ + DESIGN only:
nothing here is built yet. The owner's GO for "Miking first" is recorded in
`MIKING_LABS_PLAN_2026_10_04.md` §6 (line 192). Design work runs on Opus 5.5 at HIGH effort (D56).

The rules that bind this document, in the order they win:
1. `AGENTS.md`, the house helpers. The ratchet tests enforce them, and allowlists only shrink.
2. `docs/APE_LAB_VISUAL_CHARTER_2026_10_04.md`: model, geometry and presentation layers; one clock; accessibility; verification.
3. `docs/APE_VISUAL_STANDARDS_2026_07_29.md`: real objects, never primitives; upper-left light; the palette tokens.
4. The plan's owner decisions: fully silent; members only, with the grayed preview; inside Training Labs → Instruments & Recording; credit works like the other labs; an 8-page lesson; trial numbers labelled.

"VERIFIED" below means I read the code at that file:line on 2026-10-04. "NOT VERIFIED" items are listed in §15.

---

## 0. Decisions in one screen

| # | Decision | Why |
|---|---|---|
| D1 | **One engine, lessons as data.** `src/screens/lab/miking/engine/` holds no instrument facts. `src/screens/lab/miking/lessons/<id>/` holds `model.ts` (truth), `geometry.ts` (anchors), `art.tsx` (look) and `lesson.ts` (pages). | Charter §2 layers. 93 lessons and 1 engine (plan §3). |
| D2 | **The geometry is one 3-D model in millimetres.** Side and top views are two orthographic projections of it, and they share the horizontal axis (x, the drum axis; frame from kick/GEOMETRY_PROPOSAL.md §1). Every readout comes from the model, never from pixels. | Plan §3 "side and top views from ONE model". Charter §2. |
| D3 | **Collision uses signed-distance functions (SDF), sampled along the mic assembly.** This runs in a worklet on the UI thread. A ported head is a slab with a hole, so "the mic body must pass through the port" falls out of the maths with no special case. | Cheap (about 600 evaluations per move), exact enough, testable in Node. |
| D4 | **Drag uses Gesture Handler `Gesture.Pan` with `manualActivation`.** Shared values hold the pose. React state is written only when the gesture ENDS. Faders (ParamLane) are the precise and accessible path. | Charter §1 G1 and §7: no per-frame React state. |
| D5 | **The lesson host copies the Drum Tuning host:** 8 units (pages), each a run of steps (`rack` or `read`), on the shared LabNavBar in sub-step mode, ending on LabEndScreen. | Proven house shape (DrumTuningLabScreen.tsx:408-418, 451-471). P13 ratchet. |
| D6 | **The progress store is built on `createLocalStore`**, with the sessionCarry hand-off from the Sound Systems template. It is not the hand-rolled AsyncStorage store that Drum Tuning uses. | AGENTS.md house helper. localStore.ts:119. soundsystems/progress.ts:67-81. |
| D7 | **The physics is pure TypeScript.** `c` comes from `speedOfSoundAir(20)` (calcUnits.ts:225, 343.2 m/s), never a copied constant. A test checks the comb null against the calculator's STEREOMIC workspace. | Charter §4: the calculators are the source of truth. |
| D8 | **No animation loops anywhere in the lab.** Every motion is driven by a gesture, or is a finite `withTiming` the learner starts. The lab therefore never becomes a P10b loop host. | P10b ratchet (patternP10b_20261002.test.ts:161-163). |
| D9 | **The routes are `MikingHub` and `MikingLesson`. Neither ends in `Lab`.** | The lab is silent. The ExposureCheckin ratchet adds every `/Lab$/` route to the audio check-in (toolsEvening1_20261002.test.ts:35-50). See Q7. |
| D10 | **Proposed:** distances display rounded to 5 mm, and angles to 5°, prefixed "≈". The owner decides (GEOMETRY_PROPOSAL §6.3 and §9). | The lesson forbids claiming millimetre accuracy (Kick source text line 39). |

---

## 1. What exists, and how the lab plugs into it (cited)

### 1.1 Lab registry, Training Labs listing, routing, preview harness
- **Catalog types:**
  - `LabLeaf` is defined at `src/screens/lab/labCatalog.ts:53-68`. It has `route`, `params`, `member` and `status`.
  - `LabFamily` is at `:71`. A list category has `families?`, at `:120-124`.
  - The **Instruments & Recording** category is at `:417-432` (`id: 'instruments'`, `section: 'training'`). Today it lists Bass Guitar Physics and Microphone Selection Lab.
- **Families render** on the category screen (`LabCategoryScreen.tsx:95-113`, with a family title). The landing flattens them (`categoryEntries`, labCatalog.ts:560-565, read by `EarLabScreen.tsx`).
- **The members-only rule** is derived from the catalog by route: `labMembership.ts:32-50`, then `LAB_ROUTE_MEMBERSHIP` at labCatalog.ts:589.
  - Routes the catalog cannot name go in `MEMBER_ONLY_EXTRA_ROUTES` (labCatalog.ts:613).
  - `isMemberOnlyLabRoute` is at `:654`.
- **The navigator:** the `MemberGated` registry starts at `src/navigation/RootNavigator.tsx:161`. Drum Tuning's entry is at `:247`, and its `<Stack.Screen … getComponent={MemberGated.DrumTuningLab} />` is at `:523`. The param list is in `src/navigation/types.ts:379`.
- **The gate test:** `test/membershipGating.test.ts:92` checks that every members-only route goes through `withMembershipPreview`. Line 129 checks the child routes too.
- **The preview harness:** `src/dev/webPreviews.tsx:122` (`LAB_PREVIEW_SCREENS`). Drum Tuning's entry is at `:195`.
  - `#labpreview/<Screen>/<id>` passes `{ id }` as `initialParams` (`:199-213`).
  - App.tsx:406-411 requires the harness only on DEV + web, and wraps it in `GestureHandlerRootView`.
- **No deep link** exists for Drum Tuning (linking.ts lists none), so none is planned for the slice (Q9).
- **Featured spot:** NOT FOUND. EarLabScreen and LabCategoryScreen have no featured mechanism (grep for "featured" in `src/screens/lab` found nothing). This needs a small new feature (Q2).

### 1.2 The lab kit
- **The shared strip:**
  - `useLabNav` (`kit/useLabNav.ts:89`) takes units plus `sub` (steps) and `reset`, at `:49-68`.
  - `LabHeader` is at `kit/LabNavBar.tsx:80`, `LabNavBar` at `:121`, and `LabNextButton` at `:261`.
  - The tap lock is `createTapLock` (`kit/labNav.ts:149`).
- **The end screen:** `LabEndScreen` (`kit/LabEndScreen.tsx:59`) takes `mode: 'credit' | 'progress'`, `noun`, `onJump`, `onPracticeAgain` and `unreadable`. `useLabEndGuest` is at `:55`. Its pure words are in `kit/labEnd.ts` (`whatsLeft` at :101).
- **Pages:** `PagedLab` (`kit/PagedLab.tsx:94`) is a document-only shell: one ScrollView per page (`:466-485`). It cannot hold a Rack page. So the lesson uses the **Drum Tuning step host**:
  - `drumtuning/steps.tsx:20-70` defines a `rack` or `read` step and `ChapterSteps`.
  - `drumtuning/DrumRack.tsx:44-77` is RackUnit plus StageFit plus `fullScreen: true`.
  - The host is `DrumTuningLabScreen.tsx:60-500`. The chapter stays mounted under the end screen with `hidden` (`:485-496`).
- **Figures and photos:**
  - `ExpandableFigure` (`kit/ExpandableFigure.tsx:24`) gives full screen for a figure that is not on a rack.
  - `LabPhoto` (`kit/LabPhoto.tsx:40`) shows a bundled photo next to a drawing, never in place of it.

### 1.3 The rack
- **RackUnit** (`rack/RackUnit.tsx:117`): stage on top, a scrolling well, the dock at the bottom. It requires `initialParam`. Full screen is opt-in through `stage.fullScreen` (`:302`, opens `StageFullScreen` at `:618`).
- **Types** (`rack/rackTypes.ts`):
  - `STAGE_HEIGHTS` S 160 / M 200 / L 250 (`:16`);
  - `RackStage` (`:40-65`);
  - `DockParam`: fader with an optional `chooser`, options, group, toggle, action (`:85-189`).
- **StageFullScreen** (`rack/StageFullScreen.tsx:71`):
  - It is a DimModal (`:260`) with zoom STEPS 1, 1.5, 2, 3 and FIT (`stageFitMath.ts:72`).
  - Two nested ScrollViews pan the view when zoomed (`:303-341`). Its header still says pinch needs Gesture Handler (`:14-17`).
  - It publishes `StageTextScale` and `StageInFullScreen` (`stageAspect.ts:32, :52`). `StageFit` reports the drawing's aspect (`StageFit.tsx:17-30`).
- **BezelReadouts** (`rack/BezelReadouts.tsx`): the D36 rule (a cropped readout drops its label, never its number) lives here.
- **ParamLane** is accessible as an adjustable control (`ParamLane.tsx:156-168`). `laneFinger.ts` follows the finger that grabbed it.
- **Gesture Handler root:** App.tsx:414-418. The comment there says a RN `<Modal>` is a separate native root on Android, so a gesture inside a modal needs its own `GestureHandlerRootView`. **This applies to StageFullScreen** (§5.6).

### 1.4 Membership, preview, guests
- `withMembershipPreview` (`features/lab/withMembershipPreview.tsx:1-34`) arms the preview for a non-member. It holds the lab until the tier is known.
- `LabPreviewOverlay` (`:18`) is the grayed UpgradeSheet over the live lab.
- **Preview earns nothing:** `getLabPreview().active` refuses writes. This is the `markLabUnit` precedent at `labCompletion.ts:398-405`.
- **The tier:**
  - `useTier` and `useMemberGate` are in `features/commercial/useTier.ts:13, :29`.
  - `persistAllowed`, `holdAllowed` and `isGuestTier` are at `tier.ts:54, :60, :67`.
  - `holdAllowed` is true for `'unknown'` too: hold, never treat as a guest (AGENTS.md).
- **Guest carry:** `holdSessionWork` and `registerSessionCarry` (`features/lab/sessionCarry.ts:89, :72`).
- `GuestStartReminder` draws nothing in a members-only preview (its header, lines 1-18). A guest in this lab is always in a preview, so the host need not mount it. The guest wording is still handled by `LabEndScreen`.

### 1.5 Credit and progress
- **`labCompletion`** (`features/lab/labCompletion.ts`, key `ape:labProgress`) is the **Audio Fundamentals certificate bridge**. It fires `mark_lab_complete`, and `LabKey` is `af_*` only (`:52-76`). **Training labs do not use it.**
- **Drum Tuning and Mastering** keep their own store (`drumtuning/drumProgress.ts`, `ape:drumtuning:v1`). Credit grows only, and a practice reset keeps `done` (`:206-216`).
  - That store is hand-rolled on AsyncStorage. It is on the wipe-registry EXEMPT list (`test/accountWipeRegistry.test.ts:73`).
- **The template to copy** is `features/soundsystems/progress.ts:67-81`: `createLocalStore`, a `saveBlocked` flag, `holdSessionWork`, `registerSessionCarry`, and a pure `merge…`.
  - `createLocalStore` (`features/storage/localStore.ts:119`) registers its own wipe reset, so no wipe-registry entry is needed.
- **"Counts in Progress":** I found **no** surface where a training lab's completion feeds a Progress screen. LabCategoryScreen shows ✓ only for `leaf.key` fundamentals labs (`:161-186`). This is Q1.

### 1.6 Visuals to reuse
- **Polar maths, two copies that disagree:**
  - `micspeaker/viz.tsx:138-148`: `polarGain(a,b,θ)`, supercardioid 0.37/0.63.
  - `micselect/micSelectData.ts:378-392`: `polarR`, supercardioid 0.366/0.634.
  - The engine gets ONE exact table (§6.1). The existing labs are left alone (R10).
- **Mic drawings:** the canonical builders are in `features/lab/micDrawings.tsx` (owner ruling: one drawing per mic type, shared). They include `HandheldMic` at `:104` and `CondenserMic` at `:241`, in local coordinates with the front at the origin and 0° pointing up.
  - New kick-type art (an end-address kick dynamic, a boundary plate, an SDC) is **added there** as more canonical types, never inside miking/.
  - `micselect/micArt.tsx` holds catalogue art; it is for reference only.
- **Drums:** `drumtuning/stagesDrum.tsx:713-760` `KickStage` is **SVG**, which the charter rules out for lab scenes (§1 table), and its geometry is not model-driven. Use it as a style reference only. `drumEngine.ts:102` assumes a 22″ × 16″ kick, with no cited source in the code.
- **Helpers:**
  - `usePhaseClock` is at `foundations/viz.tsx:229`. It is not needed: there are no loops (D8).
  - `levelColor` / `fieldLevelColor` are at `features/tools/levelColor.ts:75, :81`.
  - `fitValue` and `MIN_DISPLAY_PT = 9` are at `theme/legibility.ts:24, :33`.
  - `useDecorativeMotion` is at `features/settings/decorativeMotion.ts:44`.
- **Live numbers without React:** the `AnimatedTextInput` idiom at `meter/vizMeters.tsx:79-82`.
- **Skia on web:** CanvasKit is loaded in `index.ts:21-33` (`public/canvaskit.wasm`).

### 1.7 Accessibility on Canvas
- **The two labelled canvases:**
  - `cableinstall/cableArt.tsx:1217`: `<Canvas accessible … accessibilityLabel={accessibilityLabel}>`.
  - `cableinstall/introSceneArt.tsx:162`: `<Canvas accessible … accessibilityLabel="Installation scene: …">`.
- 25 files contain `<Canvas` (grep, 2026-10-04). The charter's figure is 24.

### 1.8 Tests and the ratchets a new lab meets
**How tests run:** `node --test --test-timeout=120000 "test/**/*.test.ts"` on Node 24.16 with native type stripping.
- Pure modules import siblings with an explicit `.ts` (tsconfig `allowImportingTsExtensions`; roomModel.ts:27 is an example).
- **So: no `enum`, no `namespace`, no parameter properties, and `import type` for types**, in every pure engine file.
- Screens are pinned by source-regex tests (drumTuningLab.test.ts is the template).

| Ratchet | File:line | What the miking lab must do |
|---|---|---|
| P10b loops | patternP10b_20261002.test.ts:161-163, 170 | No `withRepeat`, `useFrameCallback`, `Animated.loop` or `setInterval` in miking. If one is ever needed, classify it. |
| P13 navigation | patternP13_20261002.test.ts:181 (`SHARED_NAV`), 263 | Every `*Screen.tsx` uses LabHeader, LabNavBar or LabEndScreen. NEXT is never `disabled` by completion (:228-258). |
| P14 9 pt | patternP14_20261002.test.ts header | No literal `fontSize` under 9. A one-line value uses `fitValue()`. |
| P11 / P2 async | patternP11 :128-130 | Every async effect carries `alive`, `seq` or `generation`. |
| P9 latch | patternP9 | An async press uses `useLatchedPress` (`src/lib/latch.ts:66`). |
| P9b back | patternP9b | `safeGoBack` only. |
| P5 modals | patternP5 | A modal screen from a dialog goes through `useModalHandoff`. |
| P6 silent success | patternP6 | "Saved" is shown only from a write that returned `true`. |
| P8 tier | patternP8 | Never decide from `entitlement === 'anonymous'`. Use `useTier()`. |
| G1 storage | localStoreGuards_20261002.test.ts | No direct `AsyncStorage.getItem` (createLocalStore only). |
| Wipe registry | accountWipeRegistry.test.ts:45 | Covered automatically by createLocalStore. |
| Exposure routes | toolsEvening1_20261002.test.ts:35-50 | Route names must not end in `Lab` (D9, Q7). |
| Member gate | membershipGating.test.ts:92, 129 | `MikingHub` and `MikingLesson` both go through `MemberGated` + `withMembershipPreview`. |

---

## 2. Folder layout

```
src/screens/lab/miking/
  MikingHubScreen.tsx        route MikingHub  {lab?}  — lab list → lesson list (LabHeader; ✓ per lesson; n/8 pages)
  MikingLessonScreen.tsx     route MikingLesson {id}  — the lesson host (D5)
  engine/                    NO instrument facts here
    model/types.ts           all lesson/model/mic/zone/pose types (pure)                       §3
    model/units.ts           mm ↔ display (metric/imperial), rounding to 5 mm / 5°, "≈" (pure)
    model/validate.ts        validateLesson(lesson): string[] — invariant list used by tests (pure)
    geometry/vec.ts          Vec3 ops, aim(az,el)→unit vector, angle between (pure, 'worklet')
    geometry/frame.ts        the documented frame; project/unproject for side/top; ViewXform (pure, 'worklet')
    geometry/sdf.ts          signed distance per Shape3 (pure, 'worklet')
    geometry/collision.ts    compileScene(model, variant) → flat solids; checkAssembly(); constrainMove() (pure, 'worklet')
    geometry/readouts.ts     deriveReadouts(model, variant, mic, refSurface) (pure, 'worklet')
    geometry/zones.ts        inZone(), zoneFor(), startPose validity (pure)
    geometry/outline.ts      2-D outlines (projected silhouettes) for art + tap hit-test (pure; Skia paths built in art)
    physics/polar.ts         first-order patterns, nulls, REE/DI (pure)                          §6.1
    physics/twoMic.ts        path difference, Δt, notch list, ideal comb |H(f)| (pure, 'worklet') §6.2
    physics/levels.ts        inverse-distance level difference, 3:1 ratio (pure)                 §6.3
    a11y/describe.ts         describeScene(state) → sentence(s) (pure, tested)                   §9
    progress/mikingProgress.ts   createLocalStore 'ape:miking:v1' + carry                        §8
    progress/observations.ts     createLocalStore 'ape:miking:obs:v1' (sheets, capped)
    scene/useRig.ts          shared values for poses/view/zoom; commit() to React                §5
    scene/PlacementScene.tsx Skia canvas + GestureDetector for one view                          §5
    scene/DualView.tsx       side+top stacked (full screen) / single + mini inset (glass)
    scene/InstrumentLayer.tsx  calls lesson art with geometry + highlight state
    scene/MicLayer.tsx       MicArt from micDrawings at the pose; aim handle; collision tint
    scene/PolarOverlay.tsx   ideal slice of the 3-D pattern in the view plane (labelled IDEAL)
    scene/ZoneLayer.tsx      sourced (solid) / trial (dashed + TRIAL) / illustrative envelopes (hatched)
    scene/PathOverlay.tsx    source→capsule lines (OVERLAY label; finite reveal; reduced-motion static)
    scene/CombPanel.tsx      ideal comb |H(f)| Skia graph, notch ticks, IDEAL MODEL badge
    scene/LabelLayer.tsx     RN <Text> labels at projected anchors × useStageTextScale(), ≥ 9 pt
    scene/LiveText.tsx       AnimatedTextInput readout (vizMeters idiom) for the drag
    rack/MikingRack.tsx      RackUnit wrapper (DrumRack.tsx pattern; fullScreen: true; StageFit; badge)
    steps.tsx                StepHost/ChapterSteps (copy of drumtuning/steps.tsx; local, not shared)
    kit.tsx                  ProvenanceBadge, TendencyNote, MikingScenarioCard (by value), SymptomCard,
                             SourceRow; re-exports mastering/kit Card/Body/Checklist like drumtuning/kit.tsx:18
    pages/
      PInstrument.tsx  PMicrophone.tsx  PPlacement.tsx  PContext.tsx
      PTwoMic.tsx      PTroubleshoot.tsx PPractice.tsx  PSources.tsx       §7
  data/
    registry.ts          MIKING_LABS (7 ids) + LESSONS index {id, labId, status:'ready'}; only 'ready' rows render
    micTypes.ts          generic mic types by property + cited examples (provenance only)
    sources.ts           shared source records (polar table, c, NIOSH …) keyed SrcKey
  lessons/
    m01Kick/
      model.ts           parts, dims (with prov), radiating regions, ref surfaces, envelopes, zones, variants
      geometry.ts        anchors and Shape3 built from model dims (pure)
      art.tsx            kick drum Skia art (side cutaway + top), drawn from geometry anchors
      lesson.ts          the 8 pages' content, scenarios, symptom table, practice, sources/unknowns
docs/labs/miking/
  kick/SOURCES.md        charter §3 rows for M01 (EXISTS, written in parallel 2026-10-04)
  kick/GEOMETRY_PROPOSAL.md  M01 frame, anchors, port options, mic outlines, zones (EXISTS; §4 adopts its frame)
  SOURCES_SHARED.md      physics rows shared by every lesson (polar table, c, inverse distance)
  CORRECTIONS_LOG.md     owner decision §6: every source fix (what, why, source)
  ENGINE_BLUEPRINT.md    this file
```

**Imports that cross the boundary:**
- `engine/*` imports `calc/calcUnits.ts` (`speedOfSoundAir`) and `features/lab/micDrawings.tsx` (art).
- `lessons/*` imports `engine/model/types.ts` only.
- Nothing in `engine/` imports a lesson. The host resolves the lesson through `data/registry.ts`.

---

## 3. Types (engine/model/types.ts)

These are written to survive Node's type stripping: unions instead of enums, and plain objects. Units are millimetres and degrees unless named otherwise.

```ts
/* ── provenance (charter §2: a fact without a source is 'unknown' and never drawn as known) ── */
export type SrcKey = string;                     // key into data/sources.ts or the lesson's sources
export type Provenance =
  | { kind: 'sourced'; src: SrcKey; quote: string }        // verbatim wording incl. its reference surface
  | { kind: 'trial'; src: SrcKey; note: string }           // the lesson's own trial number → TRIAL badge
  | { kind: 'illustrative'; reason: string }               // drawn but unsourced (envelopes) → ILLUSTRATIVE
  | { kind: 'unknown'; needed: string };                   // listed in SOURCES UNKNOWNS; art uses a labelled fallback
export type Dim = { mm: number; prov: Provenance };

/* ── geometry primitives (instrument frame, §4) ── */
export type Vec3 = { x: number; y: number; z: number };
export type Shape3 =
  | { kind: 'tube'; c: Vec3; rIn: number; rOut: number; x0: number; x1: number }   // shell wall, axis ∥ x
  | { kind: 'slab'; c: Vec3; r: number; x0: number; x1: number; hole?: { c: Vec3; r: number } } // head (+ port)
  | { kind: 'box'; min: Vec3; max: Vec3 }
  | { kind: 'capsule'; a: Vec3; b: Vec3; r: number }                                // beater shaft, stand, leg
  | { kind: 'sweep'; pivot: Vec3; plane: 'xy'; r0: number; r1: number; a0: number; a1: number; halfW: number } // beater/pedal travel
  | { kind: 'floor'; y: number };                                                    // half-space y > floor (y-down)

/* ── the instrument model ── */
export type PartId = string;                     // stable: 'kick.batter', 'kick.reso', 'kick.port', 'kick.shell', …
export type Part = {
  id: PartId; label: string; short: string;      // label ≥ 9 pt on glass; short for tight spots
  role: string;                                  // one plain sentence (page 1)
  solid?: Shape3;                                // participates in collision when present
  moving?: boolean;                              // heads, beater, pedal: clearance applies (lesson line 11)
  clearance?: Dim;                               // extra margin; prov usually 'illustrative' (Q4)
  variants?: VariantId[];                        // present only in these variants (e.g. port)
};
export type VariantId = string;                  // 'ported' | 'intact' for M01
export type Variant = { id: VariantId; label: string; blurb: string };

export type RadiatingRegion = {                  // "where the sound comes from" (page 1)
  id: string; partId: PartId; label: string; anchor: Vec3;   // anchor = point used as a path source (page 5)
  shape: Shape3; prov: Provenance; variants?: VariantId[];
};
export type ReferenceSurface = {                 // distances are measured FROM these (lesson line 39)
  id: string; partId: PartId; label: string;
  point: Vec3; normal: Vec3;                     // unit normal pointing to the side the distance is measured on
};
export type Envelope = {                         // collision envelopes beyond part solids (player reach, pedal action)
  id: string; label: string; shape: Shape3; prov: Provenance; variants?: VariantId[];
};

export type ZoneKind = 'sourced' | 'trial';
export type DocumentedZone = {
  id: string; label: string; kind: ZoneKind; src: SrcKey; quote: string;
  refSurface: string;                            // ReferenceSurface.id
  side: 'inside' | 'outside';
  distance: { min: number; max: number };        // mm along refSurface.normal (signed > 0)
  radial?: { from: { point: Vec3; dir: Vec3 }; min?: number; max?: number; prov: Provenance }; // "off the beater line"
  requires?: { variant?: VariantId; mount?: MountKind; micTypeIds?: string[] };
  start: MicPose;                                // "go to zone" pose; must be inside + collision-free (tested)
  tendency: string;                              // words only, "tendency" wording
  checks: string[];                              // "what the learner checks"
};

/* ── microphones by property (brands only as provenance) ── */
export type PatternId = 'omni' | 'cardioid' | 'supercardioid' | 'hypercardioid' | 'figure8';
export type MountKind = 'stand' | 'surface' | 'clip';
export type MicType = {
  id: string; label: string;                     // 'End-address dynamic (kick type)'
  transducer: 'dynamic' | 'condenser' | 'ribbon';
  address: 'end' | 'side' | 'boundary';
  patterns: { id: PatternId | 'unstated'; prov: Provenance }[];   // 'unstated' draws NO lobe
  body: { length: Dim; radius: Dim; acousticCentreSetback: Dim }; // setback usually 'unknown'
  power: 'none' | 'phantom' | 'unknown';
  mount: MountKind;
  surfacePartId?: PartId;                        // mount 'surface': the part it rests on (e.g. 'kick.pillow')
  examples: { model: string; fact: string; src: SrcKey }[];
  art: 'kickDynamic' | 'sdc' | 'ldc' | 'boundary' | 'handheld' | 'miniature';
};

/* ── state ── */
export type MicPose = { p: Vec3; az: number; el: number };   // p = capsule reference point; aim angles (§4.3)
export type MicSlot = 'A' | 'B';
export type MicState = { slot: MicSlot; typeId: string; pattern: PatternId | 'unstated'; pose: MicPose; polarity: 1 | -1; on: boolean };
export type ViewId = 'side' | 'top';
export type Scenario = 'studio' | 'live';
export type Wedge = { id: string; label: string; p: Vec3; az: number };   // live monitor, aimed at the player

/* ── derived (never stored) ── */
export type Readouts = {
  surfaceId: string; distance: number;           // signed mm from the reference surface
  radial?: number;                               // mm off the zone's line (e.g. beater line)
  offAxis: number;                               // deg between the mic's front axis and −normal of the surface
  height: number;                                // mm above the floor plane
  inside: boolean;                               // capsule within the shell interior
  zoneId: string | null;
  blocked: null | { partId: string; label: string };
};

/* ── lesson ── */
export type MikingLabId = 'drums' | 'percussion' | 'winds' | 'strings' | 'ensembles' | 'field' | 'broadcast';
export type PageId = 'instrument' | 'microphone' | 'placement' | 'context' | 'twoMic' | 'troubleshoot' | 'practice' | 'sources';
export const PAGE_IDS: readonly PageId[] = ['instrument','microphone','placement','context','twoMic','troubleshoot','practice','sources'];

export type ViewBox = { u0: number; u1: number; v0: number; v1: number };   // mm extents per projection
export type InstrumentModel = {
  id: string; name: string;                      // '22-inch bass (kick) drum' only once a source fixes the size
  parts: Part[]; regions: RadiatingRegion[]; surfaces: ReferenceSurface[]; envelopes: Envelope[];
  variants: Variant[]; defaultVariant: VariantId;
  views: Partial<Record<ViewId, ViewBox>>;       // a plan-only lesson (E06) omits 'side'
  yFloor: Dim;                                   // y-down, positive; prov 'unknown' for M01 today (proposal §2)
};
export type MikingScenario = { id: string; page: PageId; prompt: string; options: readonly string[]; correct: string; explain: string };
export type Symptom = { id: string; observation: string; firstChecks: string; src?: SrcKey; options?: readonly string[]; correct?: string };
export type SourceRef = { key: SrcKey; label: string; url?: string; checked?: string };
export type PageCredit = { scenarios: string[]; interactive?: string };   // empty scenarios + no interactive → banks on NEXT
export type Lesson = {
  id: string;                                    // 'M01' — IMMUTABLE once live (progress key)
  labId: MikingLabId; title: string; subtitle: string;
  model: InstrumentModel; micTypeIds: string[]; zones: DocumentedZone[];
  pages: Record<PageId, { title: string; goal: string; credit: PageCredit; takeaway: string }>;
  scenarios: MikingScenario[]; symptoms: Symptom[];
  practice: { task: string; fields: { id: string; label: string; kind: 'text' | 'number' | 'choice'; choices?: string[] }[] };
  sources: SourceRef[]; audit: { agreement: string; tension: string; gaps: string }; unknowns: string[];
  live: { wedges: Wedge[] };
  accuracyDetail: string;                        // AccuracyNote text (⚖️ rule)
};
```

**Rules the validator enforces** (`validate.ts`, used by tests):
- Every `partId`, `refSurface` and `src` reference resolves.
- Every `sourced` zone has a `quote`.
- No zone has `min > max`.
- Every zone `start` is inside its zone and collision-free in every variant it allows.
- The 8 `PageId`s are present.
- Every scenario `correct` is one of its `options`.
- No `Dim` with `prov.kind === 'unknown'` is used without its art fallback flag.

---

## 4. Geometry: one model, two views

### 4.1 The instrument frame (documented in engine/geometry/frame.ts)
This **adopts the frame in `docs/labs/miking/kick/GEOMETRY_PROPOSAL.md` §1**, written in parallel on 2026-10-04, so the engine and the kick geometry agree. Each lesson states its own origin in `geometry.ts`, and the engine assumes only the axes below.
- **Origin:** the centre of the batter head, where the drum axis meets the batter-head plane.
- **Units:** millimetres.
- **Axes:**
  - **+x** runs along the instrument's main axis: for the kick, from the batter head toward the resonant head (away from the player, toward the audience).
  - **+y** points DOWN (charter §2: y-down). The floor is at positive y.
  - **+z** is horizontal, toward the player's right hand.
  - Taken together this is a left-handed triple. **The engine never uses a cross product.** Tests pin every formula, so handedness cannot silently flip.
- **Floor:** `y = model.yFloor`, which is positive. It is UNKNOWN for M01 until it is sourced or measured (proposal §2). While it is UNKNOWN, the floor solid is a flagged placeholder and the HEIGHT readout is hidden (proposal §6.3).

### 4.2 Projections (pure; one `scale` and one `ox` shared by both views)

| View | Camera | Screen x | Screen y | Edits |
|---|---|---|---|---|
| side | on the player's right, looking toward −z | `ox + x·s` | `oy + y·s` | x, y, el |
| top | above, looking down +y | `ox + x·s` | `oy + z·s` | x, z, az |

```ts
export type ViewXform = { view: ViewId; s: number; ox: number; oy: number };   // px per mm, px origin
export function project(v: ViewXform, p: Vec3): { sx: number; sy: number }         // 'worklet'
export function unprojectDelta(v: ViewXform, dsx: number, dsy: number): Partial<Vec3> // 'worklet'
export function fitXform(view: ViewId, box: ViewBox, w: number, h: number, pad: number): ViewXform
```

- **Consistency holds by construction.** Both views read the same `Vec3`. x maps to the same screen x in both, so when they are stacked (full screen, §5.5) a vertical line through any part meets that part in both views.
- **Every zoom step stays exact.** `fitXform` is recomputed from `render(w,h)` at each step, so `s` grows with the zoom and a finger delta maps to `Δpx / s` mm at any zoom. That is a tested invariant.

### 4.3 Aim
- `az` and `el` are in degrees. az = 0, el = 0 points the front axis along **−x**, which for M01 means toward the batter head.
- Positive `el` tilts the front up. Positive `az` swings it toward the player's right.
- `aimVec(az, el) = (−cos az·cos el, −sin el, sin az·cos el)`. The y term is negative because +y is down.
- The side view shows and edits `el`. The top view shows and edits `az`. Each projected axis is drawn from the 3-D vector, so a mic aimed up and to the side reads correctly in both views.
- **Off-axis to a surface:** `offAxis = acos(clamp(−aim · n))`, where `n` is the reference surface's normal. It reads 0° when the mic points straight at the head.

### 4.4 Collision (SDF, D3)
- **Solids:** `compileScene(model, variant)` flattens every active part `solid` and every `Envelope` into an array of plain objects, each with a clearance. It is built once per variant (`useMemo`) and captured by the gesture's worklets.
- **The mic assembly** is three capsules:
  - the body: from the capsule point back along `−aim` for `body.length`, at `body.radius`;
  - the boom: continuing back to the stand clamp, 250 mm, illustrative;
  - the stand: a vertical capsule from the clamp to the floor (`mount 'stand'` only).
  - `mount 'surface'` has no stand. Its pose is pinned to the surface part (§4.6).
- **The check:** `checkAssembly(solids, pose, micType)` samples each capsule axis every `min(5 mm, r/2)`. At each sample it computes `sdf(shape, q) − r − clearance`. A negative value means collision, and the function returns the first offending `partId`. The cost is about 40 samples × about 12 solids, so under 600 evaluations per update.
- **Shapes:**
  - `slab` with a `hole` is `max(sdfSlab, −sdfHoleCylinder)`. A body that crosses the resonant head outside the port collides; one that passes through the port does not. The **intact** variant has no `hole`, so an inside mic is impossible there.
  - The shell is a `tube` (wall only). The air inside is free space.
- **constrainMove(solids, from, to):**
  1. Try the move as it is.
  2. If it collides, try each axis on its own, in the view's two axes: this slides the mic along the obstacle.
  3. Otherwise keep `from`.
  4. Return `{ pose, blocked: partId | null }`.
- **Honesty about clearances.** The sources give no clearance numbers (plan line 29; survey Q6). Every clearance and envelope is `illustrative`. The scene draws envelopes hatched with an **ILLUSTRATIVE CLEARANCE** badge, and the owner approves them (Q4).

### 4.5 Readouts (geometry/readouts.ts)
`deriveReadouts(compiled, surfaces, zones, mic, refSurfaceId)` returns a `Readouts` object:
- **distance:** `(p − surface.point) · surface.normal`.
- **radial:** the distance from `p` to the zone's line, for example the beater axis through the strike point parallel to x: `sqrt((y − y_s)² + z²)` (proposal §6.3).
- **height:** `yFloor − p.y`, shown only once `yFloor` is no longer UNKNOWN.
- **inside:** true when the capsule is within `tube.rIn` and between the heads.
- **zoneId:** the first matching zone, in lesson order.
- **blocked:** the result of `checkAssembly`.

Readouts are taken from the **stated reference surface of the active zone**, or of the chosen surface (the RANGE FROM key). That way the bezel always names its reference: "6.0 cm · from batter head".

### 4.6 Placement manifolds
- `stand`: free in 3 position axes plus 2 aim axes, subject to collision.
- `surface` (boundary mic on the pillow): the position is pinned to the top face of `surfacePartId`. Only x (and z within the face) can be dragged, and the aim is fixed facing up (−y).
  - The Beta 91A zone "25 to 152 mm from the batter head on cushioning" (source line 36) is the x-band on that face.
- `clip`: reserved for Labs 3 and 4 (the DPA 4099-style bell and f-hole clips). The pose is an offset from a part anchor.

### 4.7 Zone hints (no magnetic snapping)
- **No snapping.** Snapping would hide the variable being taught ("change one thing at a time", source line 47).
- **Entering a zone:**
  - its outline brightens;
  - the bezel ZONE cell names it with its badge (SOURCED, or TRIAL in dashed style);
  - one light haptic fires, if `hapticsEnabled`. Its promise is `.catch`-ed (P24).
- **The ZONE key** in the dock lists the documented zones. Picking one animates the mic to `zone.start` (`withTiming` 250 ms; instant under reduced motion). Each tray option carries the zone's quote and source as its `blurb` (rackTypes.ts:81).

---

## 5. Interaction (Gesture Handler, shared values, full screen)

### 5.1 State ownership (scene/useRig.ts)
- **Shared values (UI thread):** `pose[A]`, `pose[B]`, `blocked[A|B]`, `zoneId[A|B]`, `view`, `grab`.
- **React state (JS):** `committed: { mics: MicState[]; view; variant; scenario; wedge; refSurfaceId }`.
- **When React learns about a change:**
  - **at the end of a gesture:** `onFinalize` → `scheduleOnRN(commit, …)` (react-native-worklets 0.10.1 exports `scheduleOnRN`; verified in its index.d.ts);
  - **on a fader move:** the lane's `onChange` writes the shared value AND `committed`, the existing per-move React pattern of ParamLane.
- **During a drag, React re-renders nothing.** The canvas reads shared values directly (Skia 2.6 accepts shared and derived values as props). The live numbers ride `LiveText`.

### 5.2 The pan (one view, scene/PlacementScene.tsx)
```ts
const pan = Gesture.Pan()
  .maxPointers(1)                       // the house finger rule (laneFinger.ts), on the UI thread
  .manualActivation(true)
  .onTouchesDown((e, mgr) => {
    'worklet';
    const t = e.changedTouches[0];
    const hit = hitTest(xf.value, poseA.value, poseB.value, t.x, t.y, GRAB_PX);   // 'A' | 'B' | 'A.aim' | 'B.aim' | null
    if (hit === null) { mgr.fail(); return; }          // not on a mic → the ScrollView / tap owns it
    grab.value = hit; mgr.activate();
  })
  .onStart(() => { 'worklet'; start.value = poseOf(grab.value); scheduleOnRN(lockScroll, true); })
  .onUpdate((e) => {
    'worklet';
    const to = grab.value.endsWith('.aim')
      ? rotate(start.value, xf.value, e.x, e.y)            // side: el, top: az; clamped ±90°
      : translate(start.value, xf.value, e.translationX, e.translationY); // §4.2 unprojectDelta
    const r = constrainMove(solids, poseOf(grab.value), to);
    setPose(grab.value, r.pose); blockedOf(grab.value).value = r.blocked;
  })
  .onFinalize(() => { 'worklet'; scheduleOnRN(commit); scheduleOnRN(lockScroll, false); });
```
- **Grab target:** `GRAB_PX = max(22, bodyRadius·s)`, so a touch target is at least 44 pt. The aim handle is a small ring drawn behind the mic's tail.
- **Taps:** `Gesture.Tap` is used on page 1, composed with `Gesture.Exclusive(pan, tap)`. It runs `scheduleOnRN(onTapPart, x, y)`. The JS side hit-tests the projected part outlines with Skia `path.contains`. The paths are built once per view and scale (§5.7).

### 5.3 The faders: precise and accessible (dock)
The rack's lane is an adjustable control (ParamLane.tsx:156-168), so every placement is reachable without a drag.

| Key | Kind | Edits |
|---|---|---|
| POSITION | fader with `chooser` ALONG / HEIGHT / ACROSS | x / y / z, in mm ranges from `model.views` |
| AIM | fader with `chooser` LEFT–RIGHT / UP–DOWN | `az` / `el`, ±90° |

- **Coarse and fine work together.** A drag on the glass is about 4 mm/pt at 1×. Use the lane, or full screen at 3× (about 1.4 mm/pt), for fine work.
- **A blocked fader move** stops at the last clear value. The lane readout says why, for example "✕ beater travel".

### 5.4 The dock on the Placement page (5 keys; RackUnit reads best with 5 or fewer)
`VIEW` (toggle SIDE/TOP) · `POSITION ▪` · `AIM ▪` · `MIC ▸` (group: type, then pattern from the types allowed) · `ZONE ▸` (options).

### 5.5 The two views on the glass and in full screen
- **On the glass** (size L, 250 pt): ONE interactive view, plus a **mini inset** of the other view in a corner, at 28% scale, drawn from the same shared values. Tapping the inset swaps the views.
  - Why one view: two stacked views at 390 wide would each be about 120 pt tall, and the labels would fall under 9 pt.
- **In full screen:** `DualView` stacks SIDE over TOP, aligned on x, and both are interactive. In landscape they sit side by side with x still horizontal, each view with its own `xf`.
- **Scene bounds for M01** (illustrative, set in `model.views`):
  - side `x ∈ [−500, 1000]`, `y ∈ [−600, yFloor]`;
  - top `x ∈ [−500, 1000]`, `z ∈ [−500, 500]`.

### 5.6 Inside StageFullScreen: two additive changes, flagged for review
1. **Gesture root.** When `useContext(StageInFullScreen)` is true (stageAspect.ts:52), PlacementScene wraps its own canvas in `GestureHandlerRootView`. This is the App.tsx:416-417 rule for a Modal on Android.
   - It is local to miking and touches no shared code.
   - NOT VERIFIED on a device (R5).
2. **Drag versus pan scrollers.** Above 1× zoom the full-screen body scrolls (StageFullScreen.tsx:303-341), and a mic drag could also scroll it.
   - `manualActivation` already fails touches that are not on a mic.
   - For touches that start on a mic, StageFullScreen gets an **additive** `ScrollLockProvider` (`src/screens/lab/scrollLock.ts:17`). It ANDs `!locked` into the two `scrollEnabled` props, the same contract the rack well already uses.
   - This is a one-file shared-kit change. It needs a regression check of every full-screen lab: the 1× and zoomed pan still work, and no other lab calls the lock.
- **Pinch zoom stays out of v1.** Zoom STEPS remain the full-screen standard (D35). Q8.

### 5.7 Drawing (Skia; charter §2 layers)
- `lessons/m01Kick/geometry.ts` builds anchors and `Shape3` from `model.ts` dims.
- `art.tsx` draws only from those anchors, building `Skia.Path` once per (variant, view, `s`) in `useMemo`. The parts are:
  - a cutaway shell with plies;
  - hoops with claws, and lugs;
  - a coated batter head;
  - a resonant head with or without a port;
  - the pillow;
  - spurs;
  - the pedal and beater.
- Light comes from the upper left. The parts use the visual-standards token palette.
- The side view is labelled **CUTAWAY VIEW** whenever the interior shows.
- Mic art comes from new canonical builders in `features/lab/micDrawings.tsx`: `KickDynamicMic`, `BoundaryMic`, `SdcMic`. They follow that file's conventions (front at the origin, 0° = up), are generic, and are never a brand likeness.
- **Labels** are RN `<Text>` laid over the canvas at `project(anchor)`, with `fontSize × useStageTextScale()` and a 9 pt floor. Values use `fitValue()`.
- **Colour never carries a meaning alone:**

| Mark | Line | Tag / glyph | Colour |
|---|---|---|---|
| Sourced zone | solid | "S" | blue `#6fa8ff` |
| Trial zone | dashed | TRIAL | amber `#ffc64d` |
| Illustrative envelope | hatched | ILLUSTRATIVE | grey |
| Collision | outline | ✕ glyph and the part's name | red `#ff6b5e` |
| Polar lobe | — | named pattern | — |

---

## 6. Physics (pure TS, tested; engine/physics)

### 6.1 Ideal first-order polar (polar.ts)
`g(θ) = A + B·cos θ`, with A + B = 1. θ is the 3-D angle between the mic's front axis and the arrival direction.

| Pattern | A | B | Null (deg) | Rear 180° | REE = A² + B²/3 | DI (dB) |
|---|---|---|---|---|---|---|
| omni | 1 | 0 | none | 0 dB | 1 | 0 |
| cardioid | 0.5 | 0.5 | 180 | −∞ | 1/3 | 4.77 |
| supercardioid | (√3−1)/2 ≈ 0.3660 | (3−√3)/2 ≈ 0.6340 | 125.26 | −11.44 dB | 0.2680 | 5.72 |
| hypercardioid | 0.25 | 0.75 | 109.47 | −6.02 dB | 0.25 | 6.02 |
| figure-8 | 0 | 1 | 90 | 0 dB (inverted) | 1/3 | 4.77 |

- **The supercardioid** uses the exact maximum front-to-back definition. It disagrees with the two app copies (R10).
- **Sources** (rows for SOURCES_SHARED.md; I did not re-check these online, §15):
  - Eargle, *The Microphone Book*, 2nd ed. (Focal Press, 2004), the chapter on first-order directional microphones and its family table;
  - Shure, *Microphone Techniques for Live Sound Reinforcement* (the lesson's ref [11]) for the null angles and the rear-lobe wording that the live page relies on ("a cardioid rejects most strongly directly behind; a supercardioid has a rear lobe and maximum rejection off the rear axis", source line 68).
- **The slice in a view.** For each direction `d` in the view plane, `θ = acos(d · aim)`. The lobe drawn is the exact slice of the 3-D pattern in that plane, labelled **IDEAL PATTERN · slice in this view**.
- **Patterns the source does not state are not drawn.** `'unstated'` draws no lobe and shows "pattern not stated in the cited guide". This covers the boundary mic (survey lab1.md:99-100). Lesson wording such as "modified supercardioid" (Beta 52A) is drawn as the ideal supercardioid, with the caption "ideal model; the real pattern is the maker's 'modified supercardioid' and changes with frequency".
- **API:** `gain(p, θ)`, `gainDb(p, θ)` (with a floor of −60 dB for display), `nullAngles(p)`, `ree(p)`, `di(p)`, `rejectionAt(p, micPose, point)`.

### 6.2 Two microphones (twoMic.ts)
```ts
import { speedOfSoundAir } from '../../../calc/calcUnits.ts';    // 343.2 m/s at 20 °C (calcUnits.ts:222-227)
export const C20 = speedOfSoundAir(20);
export function pathDiffMm(src: Vec3, a: Vec3, b: Vec3): number         // |S−B| − |S−A| (signed; B later if > 0)
export function deltaTms(dMm: number, c = C20): number                    // Δt = Δd / c
export function notchesHz(dtMs: number, polarity: 1 | -1, fMax = 20000, nMax = 64): number[]
//   polarity +1 → f_n = (2n−1) / (2|Δt|), n = 1,2,…      (sum)
//   polarity −1 → f_n = n / |Δt|,          n = 0,1,2,…    (difference; n = 0 is the low-frequency loss)
export function combDb(f: number, dtMs: number, gA: number, gB: number, polarity: 1 | -1): number
//   H(f) = (gA + s·gB·e^{−j2πfΔt}) / (gA + gB)  → 20·log10|H|, floored at −40 dB for display
export function notchDepthDb(gA: number, gB: number): number           // 20·log10(|gA − gB| / (gA + gB))
export function micGain(p: PatternId, pose: MicPose, src: Vec3): number // polar(θ) / r   (ideal point source)
```
- **The source point** is one of the model's `RadiatingRegion.anchor`s, chosen by the learner with a SOURCE key: beater strike, resonant head centre, port. The panel always says: **"IDEAL MODEL: one point source, straight-line paths, free field. The drum's heads and shell are not modelled. An inside/outside pair hears different surfaces, so this predicts only the shared part of the sound"** (source lines 71-72, refs [6, 12]).
- **Polarity, honestly** (plan line 96): the toggle moves the notches between the two lists above. The text says: **"Polarity flips the sign; it does not remove the delay."** The Δt readout does not change when the toggle flips.
- **Equal paths.** If `|Δd| < 0.5 mm`, there are no notches. The panel shows the words "no path difference, no comb" in the shape of the calculator's refusal (micsRf.ts:41-43, 95-101) and never prints "—".
- **Parity with the calculator.** For a far-field geometry with path = spacing·sin θ, `notchesHz(...)[0]` equals STEREOMIC `pathDelay`'s FIRST MONO COMB NULL (micsRf.ts:79-123), to 0.01 Hz (test).
- **CombPanel** is a Skia graph, 20 Hz to 20 kHz on a log scale, −40 to +6 dB, with 256 points rebuilt in `useDerivedValue` from the live poses. It updates during the drag (plan line 116) with no React work. It carries the badge **IDEAL MODEL · not a measurement of this drum** (source line 97: no simulated curve presented as data).

### 6.3 Level and spacing (levels.ts)
- `levelDiffDb(rA, rB) = 20·log10(rA / rB)` — the level at rB relative to rA. Doubling the distance gives −6.02 dB. (Sign corrected 2026-10-04, audio review m9; the code was already right.)
  - It is labelled "ideal point source, far field". At 5 cm from a 56 cm head the mic is in the near field and this does **not** hold. The page says so.
- `threeToOneRatio(dAB, rA, rB) = dAB / max(rA, rB)`. This uses the plan's §7 definition (plan line 199): mic-to-mic distance at least 3× each mic's distance to its own source. `−20·log10(3) = −9.54 dB`.
- The kick page shows it with the lesson's limit: **"3:1 is a spill guideline for mics on different sources. It does not guarantee phase coherence for an inside/outside pair on one drum"** (source line 72).
- This contradicts the calculator's sentence "summing the mics stays clean instead of comb-filtering" (micsRf.ts:131), which is logged in R9. The lab never imports that wording.

---

## 7. The 8 pages on the kit

Every page is a unit on the strip. Each page is a run of steps (`steps.tsx`, copied from drumtuning/steps.tsx:20-70). A `rack` step runs on `MikingRack` (RackUnit, `fullScreen: true`, StageFit, a badge). A `read` step is wrapped by the host's `readWrap`.

| # | Page (PageId) | Steps | Display / dock (initialParam in bold) | Credit (banks on the event, never on NEXT, except where noted) | New pieces |
|---|---|---|---|---|---|
| 1 | Meet the instrument (`instrument`) | LEARN rack → TRY rack | The kick from the side and top. Tapping a part names it and highlights its radiating region. Dock: VIEW, FRONT HEAD (options intact/ported, `variants`), **PART** fader-chooser that steps through parts. | `interactive: 'regions'`: every RadiatingRegion tapped once (or chosen in PART). Plus 1 scenario. | Tap hit-test, InstrumentLayer, LabelLayer. Photo slot (`LabPhoto`) stays empty until the owner approves images (R12). |
| 2 | Choose the microphone (`microphone`) | LEARN read → COMPARE rack → CHECK read | The chosen mic type's art plus its ideal polar. A test source orbits it. Dock: TYPE ▸, PATTERN ▸ (limited to the type's patterns), **SOURCE ANGLE** fader (0–180°, bezel: relative pickup in dB). | 2–3 scenarios on choosing by properties (lesson lines 14-18). | MicLayer, PolarOverlay, MikingScenarioCard. |
| 3 | Placement Studio (`placement`) | LEARN read → PLACE rack → COMPARE rack → CHECK read | §5. Bezel: DIST · from {surface}, OFF LINE, AIM, ZONE, CLEAR. Dock: VIEW, **POSITION**, AIM, MIC ▸, ZONE ▸. A well "NOW:" line (the live summary, §9) and the zone's tendency in words. | `interactive: 'twoZones'`: the capsule rests (on commit) clear of collision inside 2 different documented zones. Plus 2 scenarios. | PlacementScene, DualView, ZoneLayer, LiveText, useRig, collision. |
| 4 | Studio or live (`context`) | LEARN read → LIVE rack → CHECK read | The same scene plus a wedge drawn in plan (top view). Dock: SCENARIO (studio/live toggle), **WEDGE ANGLE** fader (around the mic in plan), PATTERN ▸, VIEW. Bezel: the wedge's off-axis angle and ideal relative pickup in dB, and "in the rejection region? yes/no" by the actual pattern (a cardioid null behind; super/hyper off the rear). Text: never provoke feedback (source line 69). | `interactive: 'wedgeInNull'`: the wedge placed within ±15° of a null of the chosen pattern, illustrative tolerance (Q4). Plus 2 scenarios from the studio/live table (source lines 51-67). | Wedge art (canonical, new in micDrawings or a sibling `stageDrawings.tsx`), rejection readout. |
| 5 | Two microphones (`twoMic`) | LEARN read → PAIR rack → POLARITY rack → CHECK read | Two mics, path overlay (labelled OVERLAY, a finite reveal you start), CombPanel under the scene in the same canvas. Dock: MIC A/B (toggle: which mic the controls edit), **POSITION**, AIM, POLARITY (toggle on B), SOURCE ▸. Bezel: Δd, Δt, 1st notch, 3:1. | `interactive: 'polarityVsDelay'`: polarity toggled both ways AND a mic moved (Δt changed) in the same visit. Plus 3 scenarios, including "polarity vs delay" (the source's assessment item, line 89). | twoMic.ts, CombPanel, PathOverlay. |
| 6 | Troubleshoot (`troubleshoot`) | read | Symptom cards taken from the source table, lines 73-87 (6 rows). Tap through: observation → choose the first check → explanation. | Every symptom answered correctly (by value; retry allowed). | SymptomCard. |
| 7 | Practice (`practice`) | read | The source's final task (line 89), as 3 reasoning scenarios, plus an **optional** observation sheet: fields (drum, front head, mic type, pattern, zone, distance, aim, notes). Saved with `useLatchedPress`; "Saved on this device" only from a `true` write (P6). | The 3 scenarios. The sheet never gates credit: it needs a real drum. | Observation form + store. |
| 8 | Sources (`sources`) | read | The evidence audit (lines 90-94), the references with links, the UNKNOWNS, and the corrections logged for M01. | Banks on NEXT/FINISH: the PagedLab rule for a page with no requirement. | SourceRow. |

**The host** (MikingLessonScreen) follows DrumTuningLabScreen:
- the objective at the head of step 1;
- the takeaway and credit line at the tail of the last step;
- START OVER (PRACTICE) in CONTENTS, which keeps credit;
- FINISH opens `LabEndScreen` with `mode="progress"`, `noun="page"` and `unreadable={store.isUnreadable()}`;
- the page stays mounted under the end screen with `hidden`.

**Every page:**
- carries the `AccuracyNote` (⚖️) in the header (`right={<AccuracyNote compact detail={lesson.accuracyDetail}/>}`, as DrumTuningLabScreen.tsx:480 does);
- uses the wording "tendency", never "result" (source lines 40, 96).

---

## 8. Credit, progress, membership, guests, listing, preview

### 8.1 The store (progress/mikingProgress.ts; template soundsystems/progress.ts)
```ts
type LessonProgress = {
  done: PageId[];                       // credit: union, never shrinks
  answers: Record<string, boolean>;     // scenario id → first pick right
  interactive: string[];                // page interactives reached this run
  lastPage?: PageId; lastStep?: number;
};
type MikingProgress = { v: 1; lessons: Record<string, LessonProgress>; units?: 'metric' | 'imperial' };
const store = createLocalStore<MikingProgress>({ key: 'ape:miking:v1', empty, parse /* sanitize like drumProgress.ts:107-121 */ });
```
- **Writes are decided by `useTier()`, set by the host every render** (`setMikingSaveBlocked(!persistAllowed(tier))`):
  - `persistAllowed(tier)`: write;
  - `holdAllowed(tier)` (unknown or guest): `holdSessionWork('miking', …)`;
  - preview (`getLabPreview().active`): nothing.
- `registerSessionCarry('miking', held => store.mutate(s => mergeMiking(s, held)))`. The pure `mergeMiking` unions `done` and `interactive`, keeps the first answer, and takes the newest place.
- **A practice reset** clears `answers`, `interactive`, `lastPage` and `lastStep`, and keeps `done`. This is the owner's 2026-09-29 rule.
- **A failed read** means `isUnreadable()`. The host shows `ProgressUnreadableNote`, and every page stays open (D51).
- **Observation sheets** go in a separate `ape:miking:obs:v1` store, capped at 24 per lesson with the oldest dropped first (the drumProgress.ts:37 cap), so a large notes blob can never endanger credit. Member sync is out of scope for v1 (Q6).
- **Lesson complete** means all 8 `PageId`s are in `done`. The hub shows ✓ and "n of 8 pages". There is **no certificate and no `labCompletion` call** (plan line 191).

### 8.2 Membership and the listing
- **Catalog** (labCatalog.ts `instruments`, `:417-432`): add `families: [{ name: 'Miking Labs', labs: [ { name: 'Miking Lab 1: Drums', blurb: '…', route: 'MikingHub', params: { lab: 'drums' }, member: true } ] }]`.
  - The rows come from `data/registry.ts` **only when the lab has a `ready` lesson**. No placeholder rows: owner rule; the 2026-09-17 removals at labCatalog.ts:97-115.
- **Gated routes:**
  - `MikingHub` is members-only through the catalog (training section).
  - `MikingLesson` is added to `MEMBER_ONLY_EXTRA_ROUTES` (labCatalog.ts:613) as `MikingLesson: 'Miking Labs'`.
  - `RootNavigator.tsx` gets `MikingHub` and `MikingLesson` in `MemberGated`, with `lazyScreen(() => withMembershipPreview(require(…)))`, plus two `<Stack.Screen>` entries.
  - `types.ts` gets `MikingHub: { lab?: MikingLabId } | undefined; MikingLesson: { id: string };`.
- **A non-member** sees the live lab behind the grayed `LabPreviewOverlay`. Nothing is saved or held. `LabEndScreen` gives the guest or preview wording.
- **Featured spot:** a new, data-driven `featured?: true` on `LabLeaf`, rendered once at the top of the TRAINING section of EarLabScreen. It goes through the same `leafLocked` / `startLabPreview` path (EarLabScreen.tsx:116, :143-151), with no upsell copy to members. Proposed only; it waits for Q2.

### 8.3 The preview harness
In `src/dev/webPreviews.tsx:122`, add `MikingHub: MikingHubScreen`, `MikingLesson: MikingLessonScreen`. Then:
- `#labpreview/MikingLesson/M01` opens Kick (the `{ id }` param);
- `#labpreview/MikingHub` opens the hub.

The lesson host also accepts `?page=placement` in the harness only. It reads `route.params.page` and takes `__DEV__` web initial params; it never reaches the production router. This lets an inspection jump straight to a page.

---

## 9. Accessibility and motion

- **Every `<Canvas>` in miking** is `accessible accessibilityRole="image" accessibilityLabel={describeScene(state)}`, the cableArt.tsx:1217 shape. A test fails any miking `<Canvas` without both props. This removes the gap the charter (§8) names.
- **describeScene** (pure) builds a sentence from `committed` state and readouts, for example:
  > "Side view, cutaway, of a bass drum with a ported front head. Mic A: end-address dynamic, ideal supercardioid, inside the drum, about 6 cm from the batter head, about 4 cm off the beater line, aimed 10° off the head's axis. In the documented zone: Shure Beta 52A guide, 5 to 7.5 cm. Clear of all parts."
  - Its numbers use the same rounding as the bezel (D10).
- **Live text summary.** A visible `NOW:` line in the well carries the same sentence, short form. It has `accessibilityLiveRegion="polite"` (Android), and `AccessibilityInfo.announceForAccessibility` is called on commit only (iOS), throttled to one announcement per 1.5 s.
- **Controls** are native: ParamLane (adjustable), DockButton and tray options. Every placement and every credit interactive can be reached with no drag (§5.3). For page 1, the PART chooser stands in for tapping a part.
- **Colour is never alone** (§5.7 table).
- **Reduced motion** (`useAnimationsAllowed()` subscribed, the PagedLab.tsx:212-214 idiom):
  - "go to zone" and swap transitions become instant;
  - the path-reveal becomes static numbered lines;
  - nothing teaches through motion alone.
- **Motion classification:**
  - **lesson:** none run on their own;
  - **decorative:** none.
  - With no loops, P10b sees no host (D8). A test asserts that no miking file matches `isLoopHost`.
- **Losing focus or the end screen covering a page:** `hidden` releases any gesture (`pan.enabled(!hidden)`). There is nothing to pause, because nothing runs by itself.

---

## 10. Performance plan

- **Model and paths:** compiled once per (variant, view, `s`), in `useMemo`. Art paths are built at module scope where they do not depend on scale.
- **Per drag event (UI thread):**
  - `constrainMove` (≤ 600 SDF evaluations);
  - `deriveReadouts`;
  - and on page 5, the 256-point comb path in `useDerivedValue`.
- **Zero React renders while dragging.** React commits on `onFinalize` only.
- **Node budget:** each view keeps under about 250 Skia nodes. Hatching is drawn as one `Path` with a dash effect, not a node per line.
- **Measurement** (charter §7):
  - a dev-only `useFrameCallback` frame-time probe, logged to logcat on the Pixel release build;
  - **it is removed before handover**, and while present it is listed in P10b `NOT_ANIMATION` with a "dev probe" reason;
  - iOS is reported as NOT MEASURED;
  - the web preview is evidence about the drawing only.

---

## 11. Test plan (all under test/, `node --test`)

| File | What it pins |
|---|---|
| `mikingGeometry.test.ts` | `aimVec` / `offAxis` formulas. `project`∘`unprojectDelta` round-trip at each zoom factor in `zoomSteps` (stageFitMath.ts:72). Side and top give the same screen x for the same model x. SDF signs for every `Shape3`, inside and outside. A body through the resonant head outside the port collides; through the port it does not; in the intact variant every inside pose collides. Axis-slide never tunnels through a 5 mm wall. Readouts: the distance equals the plane distance; 0° when aimed along −normal. |
| `mikingPhysics.test.ts` | Each pattern: A + B = 1, on-axis = 1, nulls (cardioid 180, super 125.26, hyper 109.47, fig-8 90; ±0.05°), REE and DI from the table. `C20 === speedOfSoundAir(20)`. 1 m → Δt = 2.914 ms. Notch series for both polarities (including n = 0 for −1). Equal paths → `[]`. Depth for equal gains → floor. Far-field parity with STEREOMIC `pathDelay` (import `WORKSPACES_MICS_RF` from micsRf.ts:357). 2× distance → −6.02 dB. 3:1 → −9.54 dB. |
| `mikingModelM01.test.ts` | `validateLesson(M01)` returns `[]`. Part ids are unique. Every zone `start` is inside its zone and clear in each allowed variant. Zone band edges are inclusive (5.0 cm, 7.5 cm). Every `sourced` zone quote appears verbatim in the source text file. Every `src` resolves to a key in `kick/SOURCES.md` or `SOURCES_SHARED.md`. The anchors match GEOMETRY_PROPOSAL §3 ids, and its §8 invariants hold (10 rods at 36°, 2 spurs, the port inside the head, every zone between 0 and L). Every `unknown` dim is listed in `lesson.unknowns`. Page credit ids exist. |
| `mikingProgress.test.ts` | In-memory AsyncStorage (the drumTuningLab.test.ts approach): credit only grows; the practice reset keeps `done`; a preview writes and holds nothing; blocked → held → `mergeMiking` union; a failed read → unreadable and no write; a damaged blob is sanitized. |
| `mikingWiring.test.ts` | The catalog family row (`member: true`, route `MikingHub`). `MEMBER_ONLY_EXTRA_ROUTES.MikingLesson`. MemberGated + Stack.Screen + types.ts + webPreviews entries. The host uses `useLabNav` + `LabEndScreen`. Every rack spec has `fullScreen: true`. Every miking `<Canvas` has `accessible` + `accessibilityLabel`. **Silent:** no import of `features/audio`, `startFenced`, `expo-audio`, `LabAudioPlayer` or `useLabAudio` under `src/screens/lab/miking/`. No loop host. No "classroom", "instructor" or "student" in copy (no institutional talk). No "free" copy. Routes do not end in `Lab` (D9). |
| Existing ratchets | Run unchanged and must pass: P2, P5, P6, P8, P9, P9b, P10, P10b, P11, P12, P13, P14, localStoreGuards, accountWipeRegistry, membershipGating, toolsEvening1. **No allowlist grows.** The P10b dev probe is the single temporary exception, removed before handover. |

**Receipts at each phase:** `npx tsc --noEmit` clean, the full suite green, and the web captures at 390×844, landscape and 1024×1366, opened and checked (charter §9).

---

## 12. Build sequence for the Kick slice (rough sizing; one focused builder)

| Step | Work | Size |
|---|---|---|
| 0 | `kick/SOURCES.md` and `kick/GEOMETRY_PROPOSAL.md` already exist. Add `SOURCES_SHARED.md` (physics) and `CORRECTIONS_LOG.md`, and get the owner's answers to the proposal's §9 UNKNOWNS. | 0.25 day + owner |
| 1 | Pure engine: types, units, vec, frame, sdf, collision, readouts, zones, polar, twoMic, levels, describe, validate + geometry and physics tests. | 2 days |
| 2 | M01 `model.ts` / `geometry.ts` / `lesson.ts` content (8 pages, scenarios, symptoms, sources) + model test. | 1.5 days |
| 3 | Scene: useRig, PlacementScene (pan, tap), DualView, layers, LiveText, the StageFullScreen scroll-lock addition. | 2 days |
| 4 | Art: kick side cutaway + top; KickDynamic / Boundary / SDC mics in micDrawings; wedge. Inspected against references. | 2.5–3 days |
| 5 | Host, steps, MikingRack, 8 pages, hub, progress stores + progress test. | 2 days |
| 6 | Registration (catalog, navigator, types, harness, gating) + wiring test. | 0.5 day |
| 7 | Web inspection and fixes; audio-expert, cognitive and visual reviews; fixes. | 2 days |
| 8 | **Owner-gated:** a native build carrying Gesture Handler (BUILD RULE: ask one line, then wait). Pixel run, frame probe, removal. Owner review on the phone. | owner's call |

**About 13–14 builder-days to "ready for owner review", excluding step 8.** Steps 1 and 2 can start at once. Step 4 is the critical path.

### How the other lessons plug in
- **A new lesson** is a folder `lessons/<id>/` (`model.ts`, `geometry.ts`, `art.tsx`, `lesson.ts`), plus one `data/registry.ts` row set to `ready`. Its lab's catalog row appears automatically once that lab has a ready lesson.
- **No engine change is needed** when an instrument fits the existing vocabulary: parts and solids, radiating regions, reference surfaces, envelopes, zones, `stand` and `surface` mounts.
- **Planned engine extensions, each a contained addition:**

| Extension | For | What it adds |
|---|---|---|
| `clip` mount | Labs 3–4 | A pose relative to a part anchor; bell and f-hole clips. |
| `regionsByState` | Lab 3 woodwinds | The radiating hole moves with the register. |
| `envelope.sweep` variants | trombone slide, bow arc, bellows | Hand, bow and slide swept volumes. |
| Speaker-cone module | C02/C04/C08/C12, I11, the Lab 1 speaker module | A cone, dust cap and radial slider; the same physics. |
| Stereo-array tool | ~15 lessons | XY, ORTF 17 cm / 110°, AB, M/S, Decca: a tool module reusing `twoMic` + `polar`. |
| Plan-only lessons | E06 | `model.views` without `side`. |
| Stage-plot builder | Lab 5 | Later, separate. |
| Labs 6–7 | field, broadcast | Metres-scale `views`; a parabolic dish as a `MicType` whose pattern is `unstated` until sourced. |

---

## 13. Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | No source gives clearance numbers, yet the lab blocks positions. | Every envelope and clearance is `illustrative` and drawn hatched with a badge. The owner approves the values (Q4). The source asks for a drummer and practitioner review (line 94). |
| R2 | The kick proposal sources a 22″ × 18″ default (GEOMETRY_PROPOSAL §2). Drum Tuning draws 22″ × 16″ with no citation (drumEngine.ts:102), so the two labs differ. Still UNKNOWN (proposal §9): the floor line, the port position, hoop details, the pillow and the beater head. | Unknowns are flagged and drawn with labelled placeholders that are never shown as readouts. The owner answers proposal §9. "≈" display (D10). |
| R3 | Lesson facts to verify: the Beta 91A pattern (not stated; survey lab1.md:99), the Beta 52A "modified supercardioid" wording, the Beta 91A "25 to 152 mm". | `unstated` draws no lobe. Verify against the PDFs before they are quoted. |
| R4 | Drawing quality versus model-driven geometry: art that is beautiful AND anchored. | Art reads only anchors. Reference side-by-sides (charter §9.4). A visual review that fails any invented part. |
| R5 | Gesture Handler inside the DimModal on Android, and a drag versus the pan scrollers above 1×. | §5.6 (local root + additive scroll lock). Device test on the Pixel. Fallback: faders and 1× full screen. |
| R6 | The web preview (CanvasKit, mouse-driven Gesture Handler) is not the phone. | Charter §1. Phone results are "not yet measured" until the owner installs a build. |
| R7 | The comb panel could be read as a prediction of the real drum. | Persistent IDEAL MODEL badge, the source text quoted on the panel, a polarity ≠ delay demo, and the inside/outside caveat (source line 72). |
| R8 | Scope creep into the shared kit (StageFullScreen, micDrawings, labCatalog families, a featured row). | Each change is additive and listed here. The full suite and a regression check of the full-screen labs. |
| R9 | The calculator's 3:1 copy overclaims ("summing … stays clean", micsRf.ts:131), and the lesson contradicts it. | Logged in CORRECTIONS_LOG for an owner decision. The lab uses only the lesson's wording. |
| R10 | Two different supercardioid coefficient sets in the app (viz.tsx:146 vs micSelectData.ts:387). | The engine uses exact values. The existing labs are left untouched (out of scope). Flagged for a separate fix. |
| R11 | `MikingLesson` params with `id` may collide with harness conventions in other screens. | Lesson ids are `M01`-style and validated against the registry. An unknown id shows a "lesson not found" card plus `safeGoBack`, never a crash. |
| R12 | Photos: LabPhoto slots stay empty until the owner gives a go per folder. Comp C prompts are separate work. | The engine treats `photo` as optional. Nothing touches `assets/`. |

---

## 14. Open questions for the owner (blocking marked ⛔)

1. ⛔ **"Credit counts in Progress."** No training lab feeds a Progress screen today (§1.5). Drum Tuning and Mastering keep credit inside their own labs. Is "the same as the other labs" (lab-local ✓, what's left, the hub's n of 8) enough, or should a Progress surface show training-lab lessons? The second would be a new feature.
2. **Featured spot.** Nothing exists to reuse. Is one featured row at the top of the TRAINING section of the Labs landing right? It is not needed for the Kick review.
3. **Lab rows.** "Miking Lab 1: Drums" opens a hub with one lesson (Kick) for the review. Is that acceptable, rather than the row opening the lesson directly?
4. ⛔ **Illustrative clearances and envelopes.** Values for head excursion, beater travel, pedal and player reach, and the ±15° "in the null" tolerance. Who approves them (the owner, or a drummer as the source asks)? Until they are approved, collisions show but the badge says ILLUSTRATIVE.
5. **Units.** There is no app-wide unit setting (only Room Design's per-room `Units`, roomModel.ts:41). Is a lab-local metric/imperial toggle, remembered in `ape:miking:v1`, acceptable?
6. **Observation sheets.** Device-local in v1. Is member sync wanted later?
7. **Route names.** `MikingHub` / `MikingLesson` keep a silent lab out of the audio exposure check-in (D9). Or should the lab be listed in `AUDIO_ROUTES` anyway?
8. **Pinch zoom** in full screen (Gesture Handler now allows it), or keep zoom steps (D35) for consistency?
9. **Deep links** (`proaudio://labs/miking/...`): none in v1, matching Drum Tuning. Agree?
10. **The calculator's 3:1 sentence** (R9): correct the calculator text as well, or log only?

---

## 15. Not verified (receipts I do not have)

- I did not run `tsc` or the test suite. This was a read-and-design task.
- External citations (Eargle's table and edition, the Shure live-sound guide's null angles, the speed-of-sound formula's literature source) are given from knowledge and **not re-checked online**. Step 0 checks each one into SOURCES_SHARED.md.
- The Beta 52A, Beta 91A, e 902 and D112 facts are taken from the lesson text and survey only. I did not open the manufacturer PDFs.
- Gesture Handler 2.32 inside DimModal on Android, and its behaviour inside RN ScrollViews when zoomed, come from documentation knowledge plus the App.tsx comment. They were not run.
- `scheduleOnRN` exists in react-native-worklets 0.10.1's type index (seen). Its runtime behaviour was not exercised.
- "Only 2 of 24 canvases are labelled": I found 2 labelled `<Canvas>` tags in 25 files containing `<Canvas`. Other files have labels on surrounding views, which I did not audit.
- That no Progress surface reads training-lab credit is based on grep for `useLabCompletion`, `useLabDone`, `labProgress(`, `drumtuning` and `mastering` readers, not on a full read of every Progress screen.

---

## 16. Rulings on §14 and the geometry proposal §9 (2026-10-04)

Settled by Claude on the owner's standing instruction ("resolve routine choices yourself"). The owner can overrule any of them.

1. **Credit:** lab-local, exactly like the other labs: ✓ per lesson, what's left, and the hub's n of 8. There is NO new Progress feature. ("Same as other labs" is the owner's ruling.)
2. **Featured spot:** one featured row at the top of the TRAINING section. It is built after the Kick review, not before.
3. **Lab rows:** the "Miking Lab 1: Drums" row opens a hub, which holds one lesson (Kick) for the review.
4. **Clearances and envelopes:** these are illustrative values chosen from the geometry, and they carry an ILLUSTRATIVE badge. The OWNER is the human reviewer (owner ruling) and approves them on the phone. Collisions block placement either way.
5. **Units:** dual units everywhere, e.g. "≈ 6 cm (2.5 in)". No toggle. The source's own unit comes first in each citation.
6. **Observation sheets:** device-local in v1, through `createLocalStore`.
7. **Routes:** `MikingHub` / `MikingLesson`, kept out of AUDIO_ROUTES. The lab is fully silent (owner ruling).
8. **Zoom:** pinch zoom IN ADDITION to the D35 zoom steps, in full screen and on the glass. Gesture Handler was added for this. The steps stay for consistency and accessibility.
9. **Deep links:** none in v1.
10. **The calculator's 3:1 sentence:** if it is wrong, it is fixed on `audio-tools-engine`, together with Comp A's queued items (calculators are the source of truth), and logged.
11. **Display precision:** D10 accepted: ≈ 5 mm and ≈ 5°.
12. **Geometry unknowns (proposal §9 items 1–7):**
    - Each is drawn as ILLUSTRATIVE and never used as the reference of a readout.
    - Readouts measure only from sourced planes: the batter head, the reso head and the shell axis.
    - The default head is Remo's 5 in offset port.
    - The mic reference point is the grille front, drawn with the acoustic-centre caveat.
13. **Disagreements:**
    - D1: the label is "supercardioid", the spec field. The description's "modified supercardioid" goes in the sources.
    - D2: use the Beta 52A guide's 120° wherever that mic is named. The generic supercardioid uses the ideal equation (≈125°, 125.26°), labelled ideal. (Corrected 2026-10-04, audio review m8: the code, the lesson and SOURCES_SHARED all use 125.26°.)
    - D3: use the product data in mm.
    - D4: not used, since the default head is Remo.
14. **Lesson fixes:** go in CORRECTIONS_LOG.md.
    - (a) Add "on-axis with beater" to the Beta 52A 20–30 cm row.
    - (b) The e 902 row reads "at the level of the resonant head"; drop "port".
    - (c) The "turn away from the beater" advice is NOT attributed to Sennheiser (the current manual dropped it). It is kept as a labelled trial experiment, and the 2019 archive goes in the sources.
    - (d) AKG uses the spec sheet.

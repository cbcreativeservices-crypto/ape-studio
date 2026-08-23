### Survey 1
HOST (EqModuleScreen.tsx): header(back+title+AccuracyNote ~44px) + PREV/NEXT nav (~21px) + insets.top(~47) = ~122px chrome; ScrollView pad 16, root gap 12; module gets width=screen-32 (343 on 375 phone); ScrollLockProvider wraps scroll (scrollEnabled=!locked). No LabShell — modules are raw stacks.
VIEWPORT: 812 phone ≈ 690px usable (measured), 632 per task assumption; 732px Androids ≈ 550.

PER-MODULE STACKS (est px, content-coords; panel = display container #131316 r12 p12):
- SeeingFrequency: body60 → PANEL 357 (252px chart, y72-429) → title18 → 8-chip HPF row 74 (2 rows, y471-545) → caption51 → body60 → caveat30. Total ~770. FITS: chips+display co-visible at scroll 0. Least broken; readouts already in panelHead+unitLine.
- CameraAnalogy: body60+stage texts76 → 3-chip row 74 → PANEL 391 (RoomScene168 + curve130, y222-613) → PAN slider49 (y625) → ZOOM slider49 (y686-735) → banner62 → caption51 → CheckQuestion~240. Total ~1160 (1.8 viewports). ZOOM drag at scroll≥119 keeps scene+curve visible — OK on 812, tight on 550.
- MultiBand: body80 → 6 band chips 74 (y108-182) → PANEL 212 (graph 164, direct node-drag ON graph, y194-406) → 3 MiniBtns 33 → FREQ/GAIN/Q sliders 49ea (y463-634) → EqAuditionBar33 → caption51. Total ~754. Q-slider drag scroll≥18: graph visible, but band chips scroll off top. Node-drag makes F/G sliders redundant; Q has no on-graph gesture.
- GraphicTruth: banner41+body80+preset row74+caption51+caption85 = 331px PREAMBLE → activeBar readout row 35 (y343 — live value of touched fader, invented because finger hides it, sits 313px above the faders) → view row74 → PANEL 386 (curve 164 + 10 VerticalFaders 123 IN-PANEL, faders y691-814) → challenge card124 → Check~240. Total ~1300 (2+ viewports). In-panel board = co-visibility works (scroll 198 shows graph+faders+activeBar); sins are 476px above + 490px below.
- LiveSpectrumEq: WORST — controls ABOVE display: body40 → 7-btn HPF/slope row 74 (y70-144) → 4-btn band/view row 74 → 3 DragSliders 147 (y260-431) → PANEL 357 (bars y493-745) → 4 GUIDED CHALLENGE cards 292+ (y842-1146) → caveat. Total ~1240. On 550 viewport chips+bars CANNOT co-exist (need scroll≤70 AND ≥195); challenge instructions sit 700-1000px from the controls they direct.
- FindFrequency (train): body40 → 5 LEVEL btns 33 → brief17 → PANEL 252 (curve164+audition, y114-366) → 3 sliders 147 (y378-549) → CHECK row40 → verdict card ~160 BELOW FOLD (y613-773). Total ~745 — best layout: graph+sliders co-visible at scroll 0; only verdict lands off-screen.
- EqChallenges: body60 → 3-btn strategy row74 → PANEL 253 → compareRow~170 → caption51 → Check240 → caption34. ~956; control+display co-visible; length is trailing prose.

ROW COUNTS: chip/btn rows above display — Seeing 0, Camera 1, MultiBand 1(2-row), GraphicTruth 2(+2 captions+banner), LiveEq 2(2-row each)+3 sliders, FindFreq 1, Challenges 1. Standalone readout rows: only GraphicTruth activeBar (35px); all others put readouts in panelHead (eyebrow left + mono value right) or inline in slider heads.

SHARED COMPONENTS + APIs:
- eqBits.tsx: VerticalFader{value,onChange,onActive,label,tint} TRACK_H=108, capture-claims touch, ctx scroll-lock; GraphicBoard{centers,gains,onGain,onActiveIndex,tintFor,range} (>12 bands = horizontal scroll); MiniBtn{label,active,onPress} ~33px.
- foundations/bits.tsx: DragSlider{value0-1,onChange,label,readout,onHelp,onDragActive,tint,levelTint} ~49px, anchored dx, ctx scroll-lock; CheckQuestion{spec,onSolved} ~240px; LevelMeterBar; ConceptBadge.
- fxViz ResponseCurveGraph{curves[{at,emphasis:main|ref|ghost,color}],dbRange,height=150,mainColor} → SVG h=height+14, viewBox 320-wide, renders ~1:1 at 343 width.
- eqMath.ts: gainColor (MIDI ramp), fmtHz, normFromF/fFromNorm, OCT_CENTERS, graphicActualDb/sliderCurveDb/baseSpectrumDb.
- eqAudition EqAuditionBar{bands} 1 row ~33px, live-syncs native EQ, null w/o FX build.
- LabShell exports (available, UNUSED by EQ modules): CollapsibleSection, InteractionZone, ScrollLockProvider/useScrollLock, LabChip.
- EngineGate: null while idle/starting/running — zero height cost live.

EXISTING PARTIAL SOLUTIONS (prior art for global fix):
1. onActive/onActiveIndex plumbing (eqBits.tsx:34,105) — "which control is touched" already reported; only GraphicTruth consumes it.
2. panelHead readout slot in every panel — seed of readouts-inside-display.
3. In-display controls already proven: MultiBand node-drag ON the graph (PanResponder, capture-claim, anchored dx/dy, MultiBand.tsx:125-163); GraphicTruth faders INSIDE the panel.
4. Tools idiom to rhyme with (SplMeterScreen.tsx:1566-1596, 2569-2603): bottom ctrlBar of flex value-buttons (label 9.5px + mono amber value 14px, ~44px tall) each opening a centered popup card (backdrop rgba(0,0,0,.72), PopupOpt rows) — exactly the owner's "compact value-button → popup" ask; nothing in labs uses it yet.
5. Gestures all PanResponder (RNGH not installed); dark tokens: panel #131316/#26262c, chip #17171c/#2c2c33, active #1d1708/amber-border.

### Survey 2
BASELINE (390dp phone; viewport under fixed chrome ~700dp; content col ~358dp, wave/mic panels pass width-26 ≈ 332dp)
SHARED PRIMITIVE SIZES: LabChip ~34dp tall (LabShell.tsx:441), rows wrap gap 8 → ~42dp/row, ~3-4 chips/row. DragSlider ~52dp (label row 18 + 30dp track; foundations/bits.tsx:291). ReadoutGrid cell ~46dp, minWidth 96 flexGrow → ~3 cells/row (digital/bits.tsx:116). CheckQuestion ~260-340dp (purple card). Badge 13dp/line (often 2-3 lines). GlassButton 42-52. DisplayGuideButton ~30. PanelCard pad 12 gap 10.

WAVE PHYSICS (16 modules, one screen WaveModuleScreen.tsx; NO LabShell — own ScrollView + ScrollLockProvider)
- WaveLayout (wave/modules/waveLayout.tsx:19) = THE single lever: slot layout explain→PanelCard[readouts,layers,display,secondary,guide,controls]→mistakes→check; comment says "the order lives HERE alone… a future reorder is a single-place change (not 16 edits)". Room Builder alone bypasses it (modWaveB.tsx:1222).
- Displays: RoomSceneView default h=250 (vizWave.tsx:912); SceneHero clamps max(150,min(300,w·h/room)) (modWaveB.tsx:87) → wide venues render ~150-160dp. Barrier/Gradient 200 (vizWave.tsx:1597,1817). Display is itself a control (drag source/listener in-canvas).
- Typical module scroll length ~1500-1800dp (2.2-2.6 viewports). Inside the one PanelCard, readouts-top → controls-bottom ≈ 800-900dp: adjusting the bottom material chips scrolls BOTH the display and the readouts (α/RT60 — the teaching payload) off-screen.
- Chip row-eaters: Reflection 7 material chips ≈ 2-3 rows (modWaveA.tsx:224,351); Absorption 9 chips ≈ 3 rows + 7 readouts ≈ 3 cell rows (modWaveA.tsx:379,425,493); Room Builder = 4 wall-selector chips (1-2 rows) + ALL 10 materials (3-4 rows) in their own card BELOW the display card (modWaveB.tsx:1291-1324), plus a sources card with 3 add-chips + per-source chips + up to 4 sliders + coverage chips (modWaveB.tsx:1326-1406) → total ~2300-2600dp, 3.5 viewports.
- Readouts NEVER in-display; always ReadoutGrid cells above the display in the same card.

MIC PRINCIPLES (MicPrinciplesLabScreen.tsx — sectioned; 10 SECTION chips at top = 3-4 rows ≈ 130-170dp on EVERY section, :786-790)
- Healthiest layout audited: each section = one panelCard, canvas 96-262dp with its pattern/option chips 1-2 rows directly beneath; readout is a text line adjacent to canvas (e.g. :322). Sections ~500-700dp mostly fit; worst = HandSection (~1100dp: 216 canvas + chips + WHY cutaway 150 + check) and ProximitySection (~900: two stacked canvases 128+132 + slider + chips + check).
- SpeakerCoverage: TOP section puts a 5-row Legend ABOVE the canvas (:47-69,135); SIDE section = canvas 230 then 5 DragSliders + 3 chip rows ≈ 550dp below canvas → canvas fully off when toggling LINE ARRAY/REAR DELAY (:261-283). Existing density fix: side-by-side slider columns when speaker 2 added (:167-174, styles twoCol :429).

FOUNDATIONS (course 14 steps + Playground; own ScrollViews + ScrollLockProvider)
- Course steps mostly OK (~900-1300dp; viz small 74-210dp, its 1-2 controls adjacent). Existing mitigations: TEXT collapse toggle (:1527-1542), top nav + tappable dots, check below panel.
- Playground = worst foundations offender: display card ~500dp (cone 74 + air 116 + waveform 92 + spectrum 92 + labels/readouts), then ~800dp of controls below (3 sliders + 6 chip rows: richness 3, phase 4, delay 3, EQ 3+2, waves 4, noise+sweep 5 + 2 section heads + PLAY) → total ~1800-1900dp; bottom SOURCE chips = display entirely gone (:316-503).

EXISTING PARTIAL SOLUTIONS (rhyme with these)
- select-then-edit (one slider serves N params): M11 harmonic buttons → single shared slider (FoundationsCourseScreen.tsx:852-883); Room Builder wall chip → one material row, source chip → per-selected editor (modWaveB.tsx:1293,1347).
- Tools value-button→popup prior art (owner standard): SplMeterScreen.tsx ctrlBar of flex-1 LABEL+value buttons :1566-1596 → centered popupCard w/ PopupOpt grid + in-popup RESET :2000-2040, PopupOpt :260, styles :2569-2609 — screen-LOCAL, not extracted; WaveformScreen has its own unitPopup :1522. No shared component yet.
- CollapsibleSection (LabShell.tsx:122) used only for prose ("WHAT'S HAPPENING"); ModuleAccordionRow (hub homes only, :15); SplMeter collapsible gauge; NO sticky elements anywhere in labs (no stickyHeaderIndices); no lab has fullscreen/landscape.
- Scroll-lock infra mature: ScrollLockProvider/useScrollLock (LabShell.tsx:165-217); DragSlider/VerticalFader/RoomSceneView auto-lock; PanResponder only (gesture-handler NOT installed — adding = native build).

SHARED APIs: DragSlider{value 0-1,onChange,label,readout,onHelp,tint,levelTint} bits.tsx:93; LabChip{label,selected,onPress,onLongPress,photoHint} LabShell.tsx:49; ReadoutGrid{items[{k,v,helpKey}],help,helpKey} digital/bits.tsx:41; PanelCard/Badge digital/bits.tsx:80/84; VerticalFader{value,onChange,onActive,label,tint} TRACK_H=108 w=30 eqBits.tsx:24; GraphicBoard (>12 bands → h-scroll) eqBits.tsx:94; MiniBtn eqBits.tsx:137; levelColor(l)/rampColors/MIDLINE_BLUE features/tools/levelColor.ts; CheckQuestion{spec} bits.tsx:34; DisplayGuideButton features/lab/guidedLessons/toolHelp.tsx:311; WaveLayout slots waveLayout.tsx:19.
KEY DESIGN FACTS: readouts always OUTSIDE displays; every control long-presses into guided lessons (must survive any redesign); photoHint chips (foam/fiberglass) open photos on long-press (materialPhotos.ts); honesty Badges must stay per-display; MIN_FONT 12 is already violated by cellK 9/badge 9/faderLabel 9 precedents.

### Survey 3
LAB LAYOUT ANATOMY (per audited lab)
- 5 module-lab hosts (digital/eq/meter/gain/wave *ModuleScreen.tsx) share one anatomy: FIXED chrome ~85-100dp (safe-top + header + PREV/NEXT topNav) OUTSIDE the ScrollView; then ScrollLockProvider + ScrollView(scrollEnabled=!locked); module gets {width, focused, help, lockScroll}.
- 11 one-screen labs use <LabShell> (LabShell.tsx:219): fixed header + LEARN/EXPLORE tabs (~100dp), then ScrollView with CollapsibleSection stacks: DESCRIPTION → READOUTS → DISPLAY → CONTROLS → ACTIONS → bottom guided-lesson row.
- digital (8 mods): PanelCard stacks; per card viz(184, dither strips 88+44+42+42) → chips → DragSlider → ReadoutGrid at BOTTOM. SUFFERS (card ~600-700dp; readouts/sliders push viz off).
- meter (11 mods): one hero PanelCard: signal chips → meter view (170-300; VU=270) → guide btn → chips → 1-2 sliders → ReadoutGrid → prose/mistakes/checks below. SUFFERS same way.
- gain (8 mods): modExplore 6-8 = device-chain; DeviceCard co-locates meter/LEDs + its own DragSlider (gainViz.tsx:230) — LOCAL cause→effect OK, but 7-card chain ≈700dp so Master meter scrolls away while adjusting preamp (SYSTEM cause→effect breaks). modLearn 1-5 = prose.
- wave (16 mods): WaveLayout slots (waveLayout.tsx:19-64) readouts→layers→DISPLAY(250)→guide→controls(sliders+chip rows; 9-material row ≈3 rows/115dp) inside ONE PanelCard — readouts ABOVE display, controls BELOW. SUFFERS; but order lives in ONE file = best redesign hook.
- Harmonograph (HarmonographLabScreen.tsx:241-368): WORST. READOUTS(~90) → DISPLAY card (figure 320 + badge+caption+guide ≈420) → CONTROLS = 2 DragSliders + 4 chip rows + 3 headers ≈350dp. Figure always off-screen while adjusting.
- Binaural (BinauralLabScreen.tsx:184-284): same LabShell v2; stage ~330 draggable (primary gesture ON display = OK); object/type/freq chips below = mild sufferer; READOUTS section eats rows above.
- Tube (VacuumTubeLabScreen.tsx:564-611): chip-row PAGER — one section at a time; each PanelCard viz → slider directly beneath. Mostly OK (pattern donor). TubeReference/TubeCard = browser, no issue.
- Cable (CableLabScreen.tsx): stepped wizard, nav+dots FIXED outside scroll; reading content, no issue.
- Calc: home = accordion+2-col grid (menu). CalcWorkspaceScreen = form; pinInputs-on-focus auto-scroll (:48-64) keeps inputs+answer above keyboard; cause/effect adjacent, no issue.
VERTICAL BUDGETS (measured from styles)
- Viewport after chrome ≈ 600-700dp. LabChip row 33dp (wraps); DragSlider ≈50dp; VerticalFader 108+label≈125; ReadoutGrid ≈45dp/row (2-3 rows typical); CollapsibleSection header 33; CheckQuestion ≈200+; PanelCard pad 12/gap 10.
- Display heights: eq curves 150 (MultiBand GRAPH_H=150); digital 184; meter 170/190/220/230/270/300; wave 250; binaural ~330; harmonograph 320. Meter/wave viz take a height prop → compact variants feasible without viz rewrites.
SHARED COMPONENTS + APIs (import counts = files using, excl. definition)
- LabShell.tsx: LabShell(labId,title,subtitle,intro,exploreCaption,headerAction,children|({setScrollLocked})=>) :219; LabChip(label,selected,onPress,onLongPress,photoHint) :49 [23 files]; CollapsibleSection(title,children,startOpen,onHelp) :122 [17]; HeaderPlayButton :90 [9]; InteractionZone(children,onLock) :188 [7]; ScrollLockProvider :173 [8]; useScrollLock :178; SpeakerOutputToggle :341 [3]. <LabShell> used by 11 lab screens.
- foundations/bits.tsx: DragSlider(value0..1,onChange,label,readout,onHelp,onDragActive,tint,levelTint) :93 [30 files — biggest lever]; CheckQuestion(spec,onSolved) :34 [29]; LevelMeterBar :216 [2]; VizUnavailableCard :235 [14]; ConceptBadge :248 [2].
- digital/bits.tsx: PanelCard :80 [10]; ReadoutGrid(items{k,v,helpKey},help,helpKey) :41 [10] — already-compact readout grid w/ long-press help; MythReality :25 [7]; ModeChips :15 [2]; Badge :84 [11]; dstyles :102 [9].
- eq/modules/eqBits.tsx: VerticalFader(value,onChange,onActive,label,tint) TRACK_H=108 :24 [2]; GraphicBoard(centers,gains,onGain,onActiveIndex,tintFor,range) :94 [2]; MiniBtn :137 [9].
- ModuleAccordionRow.tsx :15 (name,blurb,num,expanded,onToggle,onOpen) [5 hub homes].
- guidedLessons/: GuidedLessonSheet(visible,lesson,controlKey?,onClose) two-tier modal [23]; DisplayGuideButton(onPress) toolHelp.tsx:311 [29]; getLabLesson/getControlLesson.
- wave/modules/waveLayout.tsx WaveLayout slots — single-place ordering for all 16 wave modules.
- gain/gainViz.tsx DeviceCard/DeviceMeter/DeviceLeds/GainBtn — the control+meter co-location donor.
EXISTING PARTIAL SOLUTIONS / PRIOR ART
- NO sticky/pinned display anywhere in labs (no stickyHeaderIndices, no absolute pinned panel).
- Tools idiom to rhyme with (inline in SplMeterScreen.tsx, NOT shared): bottom ctrlBar of value-buttons label+current-value :1566-1596 → chooser popup w/ PopupOpt :260 + in-popup RESET :2001-2035; landscape fullscreen w/ LEFT control column + camera housing :503,:734-741.
- Gesture infra solid: DragSlider/VerticalFader/InteractionZone auto scroll-lock via ScrollLock context (no prop threading); anchored-dx math. PanResponder only; react-native-gesture-handler NOT installed; reanimated 4.5.1 + Skia 2.6.2 + rn-svg 15.15 ARE installed (reanimated already used by Harmonograph).
- Readouts-inside-display groundwork: ReadoutGrid is compact cells; meter/wave viz parameterized heights; owner ruling = readouts could draw INSIDE Skia canvases.
MIGRATION SURFACE: change DragSlider = 30 files; LabChip = 23; WaveLayout = all 16 wave mods in 1 file; 5 module hosts share copy-pasted (not shared) header/topNav/lessonRow code — a shared host extraction touches 5 files; LabShell = 11 labs at once.

### Survey 4
AUDIO TOOLS IDIOMS (the standards labs must rhyme with) — all paths under C:\Users\profe\dev\ape-studio\

1. VALUE-BUTTON → POPUP (the core settings idiom, "VU-fullscreen style")
- Value-button anatomy: Pressable, flex:1 in a row, radius 10, border #26262c, bg #131316, padV 9; LABEL (Oswald 9.5px, ls 0.8, textSub) over VALUE (mono 14-15px, amber). ~52px tall row serves 3-5 settings. src\screens\tools\SplMeterScreen.tsx:1566-1596 + styles 2569-2591; WaveformScreen.tsx:591-624 + styles 892-907. a11yLabel pattern: "LABEL: value. Tap to change."
- Popup = IN-TREE absolute-fill overlay, NOT a native Modal ("de-modalized 2026-08-19" — modal-over-modal went black on iOS): backdrop Pressable rgba(0,0,0,0.72) closes on tap; card maxWidth 420, radius 14, border #2b2b33, bg #141418, pad 18; centered Oswald title; options = flexWrap grid of PopupOpt chips (minWidth 62, selected = amber border + #1c1608 bg); picking APPLIES + CLOSES in one tap. SplMeterScreen.tsx:1996-2040 (overlay), 259-272 (PopupOpt), styles 2592-2628; WaveformScreen.tsx:761-810, styles 908-944.
- Android back closes popup→fullscreen→screen in order via BackHandler chain: SplMeterScreen.tsx:784-800.
- Long-press variant: MultiMeter SPL cell long-press opens READOUT MODE popup (A/C/FS/SPL): MultiMeterScreen.tsx:1024-1039, 1512-1539.

2. LANDSCAPE FULLSCREEN + LEFT CONTROL COLUMN + CAMERA INSET
- fsRoot: absolute-fill #0c0c0f (zIndex 40-100) inside the screen tree; ✕ = 40x40 circle pinned top-right at {right: camInset+14}. camInset = Math.max(insets.left, insets.right, insets.top) (stale-inset workaround): SplMeterScreen.tsx:503-509, WaveformScreen.tsx:111.
- Orientation: lockLandscape()/lockPortrait() from src\lib\screenOrientationSafe + navigation.setOptions({orientation}) (WaveformScreen.tsx:123-130); a CLOSING phase hides content until the window actually rotates back (ghost-flip guard): content renders only when winW>=winH && !closing (WaveformScreen.tsx:730, SplMeterScreen.tsx:1845,1957).
- Layout: LEFT control column of the SAME value-buttons (width 106-108: FS_CTRL_W=108 WaveformScreen.tsx:69/968; vuFsCtrlCol 106 SplMeterScreen.tsx:2517), display fills the rest; stage row paddingHorizontal camInset.
- Tap-ANYWHERE-to-close: root Pressable closes; children use box-none, the meter surface is pointerEvents="none" so Skia can't eat the tap; settings buttons handle their own taps (SplMeterScreen.tsx:1824-1944).

3. IN-DISPLAY READOUTS (numbers drawn INSIDE the display — prior art exists)
- VuMeterView `cornerReadouts` prop {maxText, levelText, rangeText} prints MAX/level/RANGE INSIDE the glass at corners; caller formats strings: src\screens\lab\meter\vizMeters.tsx:758-771, 1216-1241. Same file: SplDialView CENTER digital SPL readout large in dial center (:2743, color prop :2031); PeakAvgMeterView LED meter draws a LEFT readout column (AVG + PK-hold numbers) in-canvas via SVG animatedProps (:2879-2886, 3074-3221).
- Spl3dGauge takes centerText/centerColor drawn in the SVG gauge center: src\screens\tools\Spl3dGauge.tsx:399-403,632.
- MultiMeter hero plot: tap/drag cursor with an Hz·dB chip riding the cursor line INSIDE the plot: MultiMeterScreen.tsx:1159-1229.
- SkinnedVu (SVG, no Skia) draws full scale/lamp inside the face; API {width,height,live:LiveMeterDrive,live0Db,running,fit}: src\screens\tools\SkinnedVu.tsx:174-244.

4. PINNED DISPLAY (cause→effect stays visible)
- MultiMeter pins the TOP STATUS BAR (SPL/PEAK/RMS/PK-HOLD mono cells) + horizontal SPL meter ABOVE its ScrollView — readouts never scroll away: MultiMeterScreen.tsx:1002-1116 (ScrollView starts :1116). Direct precedent for the labs' scrolling-display problem.
- Tool screens put the numeric "truth row" (statGrid of stat cells, mono 23px values, level-colored via levelColorForDb) directly ABOVE the display: WaveformScreen.tsx:531-566, RtaScreen.tsx:1051-1060.

5. NOTICES AT BOTTOM + RESET IN-CONTAINER
- "ALL NOTICES AT THE BOTTOM (owner rev 24 — standard)": honesty lines, quality warnings, footnotes go at scroll end: WaveformScreen.tsx:656,691-712. AccuracyNote chip (ⓘ→modal explainer, ratified copy) sits in the header: src\components\AccuracyNote.tsx:46-130; used in every tool header.
- Reset lives in the thing it resets: CLIP cell tap-to-reset + "tap to reset" hint (WaveformScreen.tsx:541-558); PK HOLD cell tap/⟲ (MultiMeterScreen.tsx:1052-1072); "RESET PEAK HOLD NOW" button inside the hold popup (SplMeterScreen.tsx:2033-2036).

6. SHARED COMPONENTS + APIs (reusable for labs)
- useToolHelp(toolId)→{help(key), helpAll(), sheet} two-tier help; HelpHead(title,onHelp,style) section header with ⓘ; DisplayGuideButton "ⓘ WHAT THE DISPLAY SHOWS": src\features\lab\guidedLessons\toolHelp.tsx:285-375. Long-press a readout cell = help; tap = action.
- ScrollLockProvider/useScrollLock/InteractionZone (drag beats scroll, capture-phase, no prop threading): src\screens\lab\LabShell.tsx:160-217. CollapsibleSection :122-158. Tools already use InteractionZone/onLock (MultiMeterScreen.tsx:425-427).
- DragSlider (labs' bits) is ALREADY used by SignalGen for log frequency + semitone steppers + preset chips: SignalGenScreen.tsx:41,498-533.
- GlassButton {label,tint,height,fontSize} backlit glass key: src\components\GlassButton.tsx:69-86. ColorWheelButton = member-gated customization entry.
- Live drive: LiveMeterDrive={rmsDb,peakDb SharedValues} (vizMeters.tsx:82-85); useDspEngine(config,poll)/useToolAutoStart (src\features\tools\engine\useDspEngine.ts:64,192); useRafFrameLoop. Text readouts throttle; meters run on UI thread.
- levelColor.ts exports levelColor/levelColorForDb/heatColor/rampColors/WAVE_LEVEL_STOPS/MIDLINE_BLUE.

7. MEASURED VERTICAL BUDGETS (portrait tool screens)
- Display panels: Waveform PANEL_H=240 (+axis row) WaveformScreen.tsx:67; RTA PANEL_H=252 (+optional PIANO_H=44) RtaScreen.tsx:171,580. Readout row ~64px (statGrid). Value-button bar ~52px. Chip rows (RTA BANDING/AVERAGING/RESOLUTION) still cost ~44px each — RTA is the least-migrated screen (chips, no fullscreen, no value-button popups except toggles).
- SPL gauge made COLLAPSIBLE to reclaim rows (SplMeterScreen.tsx:1598-1632).

8. TOOLSHUB AESTHETIC (recessed glass in rack panel)
- ONE gray textured rack blank (PanelFace, dashboard BlackFaceBg copy) with 8 tool tiles as CUTOUTS: metallic bezel gradient → dark seam → display 'cap' that SINKS 1px (TILE_SINK) + power-on glow on press + haptic; TileGlass smoked-glass overlay; square-cornered panel + panelShadow wrapper. ToolsHubScreen.tsx:206-257 (PanelFace), 261-284 (TileGlass), 287-395 (tile press anatomy), 487-493, styles 661-736. Tiles show LIVE SVG minis off ONE shared hub engine (hubPreviewEngine).
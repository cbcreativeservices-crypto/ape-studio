# Bug-class breadth sweep — lab + tools tree

Night 2026-09-14b · REPORT ONLY (no edits/commits/git/eas/DB)
Scope swept: `src/screens/lab/**`, `src/screens/tools/**`, `src/components/**` (lab-used),
generated SVG asset modules. Tuner files (CenterLockTuner.tsx, FrequencyCounterScreen.tsx,
features/tools/tuner/**) inspected report-only, never edited.

Method: grep-driven enumeration + purpose-built scripts (paint-server resolver with
escaped-quote handling, timer/animation cleanup pairer, asset-existence resolver,
conditional-hook detector), then read-to-confirm on every candidate. A confirmed instance
is marked CONFIRMED; nothing speculative is escalated.

## Headline
- **ZERO confirmed SVG paint-server black-fallback instances** anywhere in the tree.
- **ZERO missing local assets.**
- **ZERO conditional-hook (rendered-fewer-hooks) instances.**
- The mic-capsule asset — the defect that motivated this sweep — is **CLEAN**: every
  SvgXml layer now carries its own `<defs>`; no cross-document gradient reference remains.
- One LOW-severity note (RN View `mixBlendMode` on Android) and a couple of benign
  count-imbalances that read-through proved safe. No NEW criticals.

---

## Class 1 — SVG paint-server → black fallback (the mic-capsule bug)

Resolver checked every `url(#NAME)` fill/stroke/clip across the tree against `id=` defs in
the SAME file/segment (handling both JSX `id="x"` and escaped-string `id=\"x\"` assets, plus
dynamic `id={\`${x}\`}` template ids and function-generated ids).

**Result: 0 unresolved literal refs. 18 dynamic refs, all resolve to a locally-defined
dynamic id in the same `<Svg>` document.**

Confirmations of the highest-value cases:
- `src/screens/lab/micspeaker/micCutawayAsset.ts` — CLEAN. Per-export segment check:
  MIC_BASE_XML 67 defs/16 refs, MIC_CURRENT_POS/NEG_XML 21 defs/0 refs, MIC_GLOW_XML
  2 defs/1 ref, MIC_WAVE_XML 38 defs/3 refs — **every ref resolves within its own layer**.
  Consumer `MicCutaway.tsx` renders each layer as an independent `<SvgXml>`, which is
  exactly why each layer must (and does) carry its own defs. No repeat of the smear.
- `src/screens/tools/VuGlass.tsx:116-124` — dynamic ids (`clip,gTop,gLeft,gSheen,gEdgeT,
  gEdgeB`) all defined in the same `<Defs>` (lines 86-114). CLEAN.
- `src/screens/tools/Spl3dGauge.tsx:513-655` — `${uid}-*` and `zg(key)` (=`${uid}-${key}`)
  refs; defs generated at 534-584 including a per-ZoneKey `.map` (line 561) that defines
  `${uid}-gold` etc. The inactive-gold ref `url(#${uid}-gold)` resolves because `gold` is a
  ZoneKey (type at line 89). CLEAN.
- Remaining dynamic-id files all verified local-def present:
  `lab/envelope/EnvelopeChart.tsx:171`, `lab/OscillatorLabScreen.tsx:503`,
  `lab/speech/speechViz.tsx:338`, `tools/hubPreviewsSim.tsx:170-187`,
  `components/ColorWheelButton.tsx:42`, `components/ElevatedFrame.tsx:90`,
  `components/tooldemos/SplDemo.tsx:363`, `components/tooldemos/WaveformDemo.tsx:503`.

No cross-document / sibling-defined gradient reference exists. **CONFIRMED CLEAN.**

---

## Class 2 — Unsupported react-native-svg features (silent-fail / black on Android)

Grep for `<Filter>/<Mask>/<ForeignObject>/feGaussianBlur/feColorMatrix/feOffset/feBlend`
(cap and lowercase) across lab + tools:

**Result: 0 occurrences.** No SVG filter primitives, masks, or foreignObject anywhere in
the lab/tools tree — the classes that render opaque black on Android RN-SVG are absent.

One adjacent finding (NOT an SVG issue):
- `src/screens/tools/SplMeterScreen.tsx:2504` — `mixBlendMode: 'multiply'` on an RN
  **View** style (`fsRedWash`, the fullscreen red overprint). — CONFIRMED — LOW.
  This is a React Native View style, not SVG, so it will not black-fill; on Fabric (SDK 57)
  it is supported, but blend modes on Views have uneven Android history. Fix if it ever
  misbehaves: fall back to a semi-transparent solid `backgroundColor`. Cosmetic only.

**CONFIRMED CLEAN for the black-fallback feature set.**

---

## Class 3 — Animation / timer lifecycle leaks

Pairer counted `setInterval/clearInterval`, `requestAnimationFrame/cancelAnimationFrame`,
`withRepeat/cancelAnimation`, `Animated.loop/.stop()` per file across 60 files that use
these primitives; only count-imbalances were surfaced for read-through.

- `withRepeat` with zero `cancelAnimation`: **none** — every withRepeat file has a cancel.
- `setInterval` > `clearInterval`: **none**.
- `Animated.loop` > `.stop()`: **none**.

Two rAF count-imbalances, both read and CONFIRMED SAFE (false positives from a recursive
self-scheduling rAF reusing one ref that the cleanup cancels):
- `src/screens/lab/cableinstall/motion.tsx:353-377` (useCountUp) — recursive rAF stored in
  `raf.current`; cleanup `cancelAnimationFrame(raf.current)`. SAFE.
- `src/screens/tools/CenterLockTuner.tsx:1125-1142` (tuner, report-only) — same pattern;
  cleanup cancels. SAFE.

Spot-confirmed representative continuous-tick consumers cancel on unmount:
`tools/hubPreviewEngine.ts:234/293-294` (setInterval id cleared), `MicCutaway.tsx:58-72`
(both shared clocks `cancelAnimation`-ed on unmount and on `running=false`).

**No confirmed leak.** CLEAN.

---

## Class 4 — DSP-freeze (heavy sync work in a press handler / after a busy setState)

Grep for `JSON.parse`, `createHash/sha256/crypto/subtle`, large fixed loops, and busy-flag
setState patterns; read-through on every hit that touched a handler.

- All `JSON.parse` hits parse **small AsyncStorage pref strings** (CableInstall persisted
  state, modMeterC, workflowStore, mixing/kit, CenterLockTuner prefs) — trivial size. Safe.
- Busy-indicator paths in `lab/HarmonographViewer.tsx:151-197` (share/save/print) —
  `setBusy(true)` then **promise-based** `captureAndShare/saveToPhotos/printCard` with
  `.finally(setBusy(false))`. The heavy capture is inside the async call, so the spinner
  paints. SAFE.
- `lab/digital/vizSignal.tsx:115` (peakOf, 4096-iter) runs at **module init** for a handful
  of wave kinds (~24k iters once), not in a handler. Negligible.
- Audio playback is driven by the **native ape-dsp engine** (params pushed to native), not
  JS-side additive synthesis on press — the systemic DSP-freeze class from the
  2026-09-11 sweep does not have a new JS-synthesis-on-press instance here.
- `lab/HarmonicStems.tsx` uses a PanResponder with a dead-band (`:257`) to skip no-op
  setState, avoiding re-render storms. Good.

**No NEW confirmed freeze.** CLEAN (busy paths async-safe).

---

## Class 5 — Image / asset integrity

Resolver checked every relative `require('...asset')` / asset `import` in the tree against
the filesystem.

**Result: 21 local asset requires checked, 0 missing.** Verified paths include
`assets/lab-backgrounds/{training-labs,audio-fundamentals,calc-lab}.webp`,
`assets/icons/head-front.png`, `assets/fonts/Bravura.otf`,
`assets/tool-strips/{vu_skin_spl,tuner_skin}.webp`. Image-map modules
(`micselect/micImages.ts`, `wave/materialPhotos.ts`, `labPhoto.tsx`, `cable/connectorInks.ts`,
`tube/tubeInks.ts`) contain **no local requires** — they build remote Supabase URIs
(out of scope for on-disk existence). **CONFIRMED CLEAN.**

---

## Class 6 — Conditional hooks (rendered-fewer-hooks crash class)

Detector scanned component/hook declarations for any React hook called after a
component-level early `return`.

**Result: 0 instances.** Corpus stats: 3,859 component/hook declarations, 965 top-level
early returns, 1,635 top-level hooks — and **not one** hook appears after an early return
within the same component. Every component front-loads its hooks. **CONFIRMED CLEAN.**

---

## Swept-and-clean summary

| Class | Area swept | Verdict |
|---|---|---|
| 1 SVG paint-server black | all lab+tools+components, generated SVG assets (incl. mic-capsule multi-layer SvgXml) | CLEAN — 0 unresolved; all dynamic ids local |
| 2 Unsupported RN-SVG features | Filter/Mask/feGaussianBlur/feColorMatrix/foreignObject/blend | CLEAN — 0 SVG; 1 RN-View mixBlendMode (LOW) |
| 3 Animation/timer leaks | 60 timer/anim files, all cleanup pairings | CLEAN — 0 leaks; 2 rAF false-positives verified safe |
| 4 DSP-freeze | JSON.parse, sync loops, busy-flag handlers, audio play paths | CLEAN — busy paths async; audio native-engine |
| 5 Asset integrity | all local require/import of assets | CLEAN — 21 checked, 0 missing |
| 6 Conditional hooks | all components (3,859 decls) | CLEAN — 0 hooks after early return |

No hidden repeat of the mic-capsule black-smear exists in the swept tree.
Only non-critical note: SplMeterScreen.tsx:2504 View-level `mixBlendMode` (LOW, cosmetic).

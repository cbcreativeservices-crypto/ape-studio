# Fix report: shared lab frame, round 2 (FIXER R2-FRAME, 2026-11-13)

Scope: `src\screens\lab\rack\*` and their tests only. Nothing committed (the lead commits).

## The cause, once

On the web, react-native-web reports every `onLayout` width as a whole pixel. It reads `offsetWidth`, so 45.66 comes back as 46. Each fit compared two of these rounded widths: the key or cell, and the line's natural width. Each can be half a pixel off, so a line "fitting within half a pixel" could run up to 1 px past its real box and be drawn with "…".

The fix is one safe margin for each kind of line, written as a constant in `dockFit.ts`:

- `VALUE_MEASURE_PX = 1` covers the two half-pixel measures.
- `VALUE_FIT_MARGIN_PX = 1.2` (was 0.3) adds 0.2 px for mono digits, which do not scale exactly in proportion.
- `BEZEL_KEY_MARGIN_PX = 1` replaces a +0.5 px slack, which allowed the overrun.

## Bugs

| Bug | Status | What changed |
|---|---|---|
| R2-GA1-04: dock keys under 44 at 320 (p10 STEP 33, ■ STOP 40; p9 LEVEL / STEP / ■ STOP 43) | **FIXED** | `dockStripFit`: a one-row result whose narrowest key is under `DOCK_MIN_KEY_W` now counts as "does not fit". The tightened chrome (`DOCK_TIGHT_STEPS`) is tried next, then two rows. The widths share out the room so the narrowest key is as wide as it can be, so this test is exact. Equal keys narrower than 44 (seven or more keys at 320) are no longer left equal. |
| R2-GA2-02: dock values in "…" ("FACE 9…", "SPEED 4…" at 375; "UNRE…" at 320) | **FIXED** | New `dockValueFitSize`: a value stays at its authored size only with 1 px to spare. When shrunk, it keeps 1.2 px. `DockButton` measures the value with nothing added. `dockKeyNeed` carries the wider margin, so a key given its need still draws its value at 9 pt or more. |
| R2-GA2-02: keys shift sideways after a drag (SOUNDS "SPEED 40%" → "SPEED 100%", 51 → 55) | **FIXED** | New `widestLaneValue`: RackUnit gives a chooser-fader key its widest value over the lane (21 samples, never less than today's value) as the `valueSpan` prop. `DockButton` asks for room for that. Its need no longer changes under a drag. A plain ▪ fader still asks for nothing, as before. |
| R2-GA2-03 / B-16: "SURFA…" in the p22 bezel at 320 (MUSIC = ALERT) | **FIXED** | `bezelKeyFit` now requires the key to fit with 1 px to spare (it used to accept 0.5 px over). `BezelReadouts` floors the cell width instead of rounding it. The key shows whole, as its `kNarrow`, or not at all. The value is never touched. |
| Same rule, found while checking: DJ Systems bezel sub lines cut at 320 ("USE A SCALE", "dBA (MODEL)", "SETTING UP") | **FIXED** | `BezelReadouts` measures the sub line and draws it at the largest size that fits, with the same margin and never under 9 pt. `fitValue`'s shrink-to-fit works on native only; on the web the line was simply cut. |
| Found while checking: DJ Systems p19 bezel value "NOT SPEAKING" at 320 is still cut at the 9 pt floor (58.33 px in 57.75) | **HELD** | No size of 9 pt or more fits it, and the frame cannot shorten a lab's words. It needs a shorter word from the DJ lab, or an owner decision to let a word value wrap to two lines. This was there before my changes. |

> **Correction (see "Checker follow-up" at the end):** the margins above now apply on the web only. A phone fits exactly as it did before round 2. Also, p22 is not the only dock that changes at 375 and 390 on the web: values that were already shrunk get 0.1–0.3 pt smaller there too (Meter Waterfall).

## One deliberate change at 375 and 390

Game Audio p22 is the only dock that changes at 375 or 390. Its MOVE and SOUNDS keys now hold room for "FACE 355°" and "SPEED 100%" from the start. At 390 the keys went from six equal 57.33 keys (gap 6) to MOVE 58.59, SOUNDS 61 and the others 58.59 (gap 4). Every word on that dock is now the same size or larger than before. Before the fix, the same dock already switched to this layout as soon as SOUNDS was dragged to 100%, so this change is what stops it moving under the finger.

To keep 390 exactly as before instead, delete the one `valueSpan=` line in `RackUnit.tsx`. The keys would then shift during a drag again.

## Files

- `src\screens\lab\rack\dockFit.ts`:
  - new constants `VALUE_MEASURE_PX` and `BEZEL_KEY_MARGIN_PX`; `VALUE_FIT_MARGIN_PX` raised from 0.3 to 1.2
  - new functions `dockValueFitSize` and `widestLaneValue`
  - `dockKeyNeed`: the value term now carries the margin
  - `dockStripFit`: 44 floor on every path
  - `bezelKeyFit`: margin instead of slack
- `src\screens\lab\rack\DockButton.tsx`: value measured with nothing added; fitted with `dockValueFitSize`; new optional `valueSpan` prop (additive)
- `src\screens\lab\rack\RackUnit.tsx`: passes `valueSpan` to chooser-fader keys
- `src\screens\lab\rack\BezelReadouts.tsx`: cell width floored; sub line measured and fitted
- `rackTypes.ts`, `DockTray.tsx`: unchanged

## Tests

New file `test\labFrameR2_20261113.test.ts` (21 tests, all pass). It covers:

- the measured cases (p9, p10, p20, p22, SURFACE, LAST TAKE, the DJ sub lines)
- a random check of 4,000 docks at 320, 375 and 390: every key is at least 44 wide and holds its need, and no row runs off the screen
- a comparison with the old algorithm: wherever the old one already gave every key 44 or more, the result is identical (more than 5,000 comparisons)
- a whole-pixel grid for values and bezel keys: the drawn line always stays inside its real box
- a check that a key given exactly its need still reaches 9 pt
- the chooser-fader span: same need at 40% and at 100%
- source checks on `DockButton`, `RackUnit` and `BezelReadouts`

Existing tests updated, each because the old line encoded the bug:

- `test\labFrameHeld_20261113.test.ts`:
  - `bezelKeyFit(58, 58.3)` is now `'none'` (it used to accept "within half a pixel")
  - P22 needs: SOUNDS is 56 (was 55)
  - the key helper passes the raw measured width
  - uses `dockValueFitSize`
- `test\dec_A12-dock-one-choice-and-key-fit_20261105.test.ts`: the six-key check uses the row's own padding, and now also asserts that every key is 44 or wider. At 320 these keys now take the tightened row; before, AIM, SIZE, MIC and VIEW were 41 wide.
- `test\dockFit_20261019.test.ts`: the source regex now names `dockValueFitSize`.

Test runs:

- `node --test --test-timeout=120000 test/labFrameR2_20261113.test.ts test/labFrameHeld_20261113.test.ts test/patternP14*.test.ts` plus every file from `grep -l "rack/" test/*.ts`: **2251 tests, 2251 pass, 0 fail**.
- `npx tsc --noEmit -p .`: exit 0.

## Measurements (web preview, own tab, sound OFF throughout)

Key widths are in px. "a/b" means the line's natural width / its box (cut when a > b). Font sizes are the drawn px.

### Before

| Size | Page | Key widths (all six keys) | Cut text |
|---|---|---|---|
| 320×700 | GA p9 | 42.66 / 42.66 / 57 / 47 / 52 / 42.66 | — |
| 320×700 | GA p10 | 45 / **33** / 54 / 60 / 52 / **40** | — |
| 320×700 | GA p20, TOOL = UNREAL ENGINE | 49 / 45.66 / 46 / 45.66 / 52 / 45.66 | "UNREAL" 11.1 px, 35.97/35.66 **CUT** |
| 320×700 | GA p10 bezel | — | PLAYING 44.84 in 44.75, SOUND 36.44 in 35.67: both overrunning (B-16 "PLAYI…") |
| 375×667 | GA p22 | 56.5 each | "FACE 90°" 10.9 px, 47.09/46.5 **CUT**; "SPEED 40%" 9.6 px, 46.66/46.5 **CUT** |
| 375×667 | GA p9 bezel | — | "LAST TAKE" 54.36/53.81 **CUT** |
| 390×844 | GA p22 | six equal 57.33 | — (FACE 90° at 10.9 px, 47.09 in 47.33) |
| 320×700 | DJ Systems | — | sub lines "USE A SCALE" and "dBA (MODEL)" 65.34/57.75, "SETTING UP" 59.41/57.75, all **CUT**; value "NOT SPEAKING" 58.33/57.75 **CUT** |

### After

**320×700, Game Audio**

- p9: keys 45.75 / 45.75 / 53 / 45.75 / 48 / 45.75 (padding 2), one row, nothing cut.
- p10: keys 48 / 48 / 48 / 54 / 48 / 48 (padding 1, gap 2), one row, nothing cut. In the bezel, PLAYING and SOUND are dropped and their values "0" and "OFF" stay whole. These cells have no `kNarrow`; a short form from the lab would keep a key.
- p20, TOOL = UNREAL ENGINE: "UNREAL" 10.8 px, 35.0/35.66, whole. Keys 45.66–52.
- p22, fresh load: keys 50 / 55 / 47.25 ×4 (padding 1, gap 2), one row. "FACE 90°" 10.4 px and "SPEED 40%" 10.2 px, both whole.
- p22, MUSIC = ALERT: SURFACE is dropped, "STONE" whole. The same after the tray closes.
- p22, SOUNDS: GENERATOR 1 on, lane dragged to 100%: "SPEED 100%" 9.1 px, 49.14/49.14, whole. Every key's x position is identical before and after the drag (8 / 60 / 117 / 166.25 / 215.5 / 264.75).

**375×667, Game Audio**

- p9, p10, p20: identical to before. p9's bezel "LAST TAKE" is now dropped ("NONE" whole), not cut.
- p22: keys 56 / 61 / 55.5 ×4 (gap 4). "FACE 90°" 10.4 px and "SPEED 40%" 10.2 px, both whole. MUSIC label 11 px (was 11.4), REPORT 9.3 px (was 9.6).

**390×844, Game Audio**

- p9, p10, p20: dock and bezel identical to before.
- p22: see "One deliberate change at 375 and 390" above.

**DJ Systems Lab, all 24 modules**

- 390 and 375: all keys equal (89 or 70 at 390; 85 or 67 at 375), no violations.
- 320: keys 56–72, no dock violations. Sub lines now 9.6–10.5 px and whole: "USE A SCALE" 57.03/57.75, "dBA (MODEL)" 57.03/57.75, "SETTING UP" 56.7/57.75. "NOT SPEAKING" is still cut (HELD, above).

**Stage Plot Lab, STAGE tab (Four-piece band example)**

- 390: five keys at 70; 375: five keys at 67. Both identical to before.
- 320: five keys at 56. "NOTHING" 11.8 px, 44.61 in 46, whole.

**Every page above**

- Key heights are 53 everywhere (at least 44).
- No dock text is under 9 px.
- After the fix, `scrollWidth > clientWidth` was never true on a dock line, and the text range was never wider than its box. The one exception is the HELD DJ value.

## Notes for the lead

- The other fixers' saves reloaded the preview often, which sent the Game Audio lab back to module 1. A measurement taken while my tab was in the background also read 0 widths, because ResizeObserver pauses in a hidden tab. Every measurement above was retaken with my tab in front and a confirmed module number.
- During one of those resets, a drag meant for p22 landed on p1's LEVEL lane and set it to 100%. I put it back to its home value of 70% with a double-tap. SOUND stayed off throughout.
- Sound Safety never appeared. I wrote no browser storage. The Stage Plot "not signed in" confirm was answered yes in my own tab only, so the example plot could open; those plots are session-only and were discarded when I closed the tab.
- Possible follow-ups for the lab fixers (not frame work): `kNarrow` short keys for the Game Audio bezel cells that are now dropped (p10 PLAYING / SOUND at 320; p9 VARIATION / LAST TAKE at 375), and a shorter DJ p19 VOICE IN value.

## Checker follow-up (after `CHECK_FRAME_R2.md`)

The checker found two regressions, both caused by the new margins running on every platform. The margins only exist to cover a web error (whole-pixel `onLayout` widths), so they now apply **on the web only**. A phone fits exactly as it did before round 2.

### What changed

- **`dockFit.ts`:**
  - `dockValueFitSize`, `dockKeyNeed` and `bezelKeyFit` each take a `web` flag. It defaults to true, the web rules.
  - With `web` false they reproduce the pre-round-2 rules exactly:
    - a value is measured + 0.3 px (`VALUE_FIT_MARGIN_NATIVE_PX`) and fitted with the old half-pixel slack;
    - a key's need carries that same + 0.3;
    - a bezel key fits within + 0.5 px.
- **`DockButton.tsx`:** `const WEB = Platform.OS === 'web'`, passed to `dockValueFitSize` and `dockKeyNeed`.
- **`BezelReadouts.tsx`:**
  - the same `WEB`, passed to `bezelKeyFit`;
  - the cell width is floored on the web and rounded on a phone, as before;
  - the sub-line fit runs on the web only. On a phone, `fitValue`'s native shrink-to-fit already handles the sub line.
- **Unchanged on every platform** (these are real fixes, not measurement margins):
  - the 44 floor in `dockStripFit`;
  - the chooser-fader `valueSpan`.

### Re-measured on the web (own tab, sound OFF)

- **Sound Systems Learn at 320:** the three labels are still dropped on the web.
  - p11 CHECKS: cell 59, value "0/2" whole.
  - p13 TOTAL LOAD: cell 69.5, "300 W" whole.
  - p14 SPL @ 10 m: cell 81.47, "98.0 dB" whole.
  - **They were not overrunning.** The checker's true widths are 41.83 in 42.00, 62.55 in 63.00 and 64.14 in 64.47. But the web's whole-pixel measures read each one as "key = room". From those numbers the frame cannot tell a key that fits from one 0.5 px over, so on the web it drops them.
  - On a phone they stay whole, because native uses the old rule (covered by a unit test).
  - A short `kNarrow` from the Sound Systems lab would give them back on the web.
- **Meter Waterfall (module 7) at 390 and 375, web:**
  - CONCRETE is 10.6 px at both widths (45.8 px in a 46.5 px box), whole. It was 10.9 at 390 and 10.7 at 375.
  - CLASSROOM is 9.4 px at both widths (45.64 in 46.5), whole. It was 9.7 at 390 and 9.5 at 375.
  - This shrink is the web margin's cost and stays on the web. On a phone the values are as before (the native rule is unit-tested against the old one at every width pair).
- **Game Audio on the web: unchanged from the measurements above.**
  - p9: one row; keys 45.75–53 at 320, as before at 375.
  - p10: keys 48–54 at 320; as before at 375.
  - p22: 50 / 55 / 47.25 ×4 at 320, and 56 / 61 / 55.5 ×4 at 375. "FACE 90°" and "SPEED 40%" are whole at both.
  - No cut text anywhere on these pages.
  - The p9 and p10 bezels now show the Game Audio fixer's short keys (VARY, TAKE, PLAYS, SND).

### Tests added (`test\labFrameR2_20261113.test.ts`, sections 4 and 5)

- **Native equals the old rule:**
  - `dockValueFitSize(…, false)` matches the old rule at every width pair (0.25 px grid);
  - `dockKeyNeed({…, web: false})` matches the old need;
  - `bezelKeyFit(…, false)` matches the old half-pixel slack, including CHECKS 41.83 in 42 = whole.
- **The components decide by platform** (source checks).
- **M06:** `dockStripFit([220, 30, 30], 304)` stays on one row with three widths. I confirmed the mutant fails this test: with the branch removed, `wrap` is true.
- **M16:** the drawn sub line's style must carry `subFs !== SUB_FS ? { fontSize: subFs } : null` with `fitValue(subFs)`, and the sub line must be measured.
- **M17:** the widest-value line must be measured with `onWidth={setSpanW}`.
- **Existing source checks updated for the new `WEB` argument:** `labFrameHeld_20261113` (`bezelKeyFit(..., WEB)`) and `dockFit_20261019` (`dockValueFitSize(..., WEB)`).

Runs:
- `labFrameR2`, `labFrameHeld`, `patternP14*` and every file from `grep -l "rack/" test/*.ts`: **2258 tests, 2258 pass, 0 fail.**
- `npx tsc --noEmit -p .`: **exit 0**.

### HELD (need edits in the labs, not the frame)

- **Checker finding 4:** a few chooser-faders build their key text from state and ignore the lane value passed to `format`, so `widestLaneValue` only sees today's value and those keys can still widen during a drag:
  - Meter EQ, `modMeterB.tsx:708`;
  - Cymatics FREQ, `modNodes.tsx:75`;
  - Digital, `modDac.tsx:214, 227, 496`;
  - Miking POSITION and AIM, `placementDock.ts:207, 261`.

  Each lab's format needs to use the value it is given. Alternatively, the checker suggests an optional `widest?: string` on the fader, which RackUnit would prefer over sampling.
- **DJ Systems p19 "NOT SPEAKING"** and **Meter 6/11 TIME "new → right"** at 320: these bezel word values do not fit even at the 9 pt floor. They need shorter words from those labs, or an owner decision to let a word value wrap to two lines.
- **Sound Systems Learn at 320 on the web:** CHECKS, TOTAL LOAD and SPL @ 10 m are dropped as described above. A `kNarrow` from the lab would bring them back.

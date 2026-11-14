# Check report: shared lab frame, round 2 (CHECKER, 2026-11-13)

What I checked: the fixer's report `FIX_FRAME_R2.md` and the uncommitted diff to `src\screens\lab\rack\` (`dockFit.ts`, `DockButton.tsx`, `RackUnit.tsx`, `BezelReadouts.tsx`) on branch `ota-after-approval-39-23`.

What I did not do: I fixed nothing, made no git writes, and did not touch the Game Audio or Stage Plot files. Every mutation ran in a throwaway copy of `src` and `test` in my scratchpad, never in the shared tree, so the other agents' previews did not reload because of me. Afterwards `git diff --stat -- src/screens/lab/rack` is the same as before I started (145 insertions, 25 deletions). The copy has been deleted.

## Verdict

The frame holds its rules in every lab I measured. Every dock key is at least 44 wide and 48 tall. No dock text is under 9 px. No dock value ends in "…". No dock newly wraps to two rows. No page scrolls sideways.

Three things still need a decision or a small fix, ranked below:

1. Bezel labels that fitted whole are now dropped.
2. Values change size at 375 and 390 in a lab other than Game Audio p22. The fixer's report says p22 is the only change at those widths, which is not true.
3. The new margins are aimed at a web-only measuring error, but they also run on phones.

There are also three gaps in the tests.

## Findings, ranked

### 1. MEDIUM: bezel labels that fitted whole are now removed (320 on the web; any width on a phone)

The new rule asks a bezel key to fit with 1 px to spare, and it measures the cell width rounded down: `BEZEL_KEY_MARGIN_PX = 1` (`dockFit.ts:49`), used in `bezelKeyFit` (`dockFit.ts:324-333`), and `Math.floor` in `BezelReadouts.tsx:130`. On the web both widths are whole pixels, so a key whose rounded width equals the rounded room is ambiguous. The new rule drops every such key, including keys that did fit.

Measured at 320×700. "Natural" is the true text width taken with a Range; "room" is the cell's true inner width.

| Lab, page | Key | Natural / room | Before | After |
|---|---|---|---|---|
| Sound Systems Learn 11/23 | CHECKS | 41.83 / 42.00 (whole) | drawn whole | dropped |
| Sound Systems Learn 13/23 | TOTAL LOAD | 62.55 / 63.00 (whole) | drawn whole | dropped |
| Sound Systems Learn 14/23 | SPL @ 10 m | 64.14 / 64.47 (whole) | drawn whole | dropped |

The same rule also correctly removes keys that really were cut. These count as fixes, and they go beyond the fixer's own list:

| Lab, page | Width | Key | Natural / room |
|---|---|---|---|
| Meter 2/11 | 375 | OVERS | 34.36 / 34.27 |
| Meter 4/11 | 375 | TP GAP | 38.44 / 37.77 |
| Meter 9/11 | 320 | MID (SHARED) | 75.47 / 74.58 |

These cells have no `kNarrow`, so at 375 they now show their value with no label.

**On a phone** (not measurable here): native `onLayout` widths are fractional. Before, a key fitted if it was within 0.5 px over its cell. Now it needs to be 1 to 2 px under it: the cell width is rounded down (up to −1 px) and the margin takes another 1 px. Any bezel key with less than about 2 px to spare will disappear on a device, at every width including 375 and 390.

**Smallest fix:** use the margin and the rounding-down only on the web:
- in `dockFit.ts:49`: `BEZEL_KEY_MARGIN_PX = Platform.OS === 'web' ? 1 : 0`, or pass it in from `BezelReadouts`;
- in `BezelReadouts.tsx:130`: round down only on the web.

On the web the three Sound Systems labels stay dropped at 320. A short `kNarrow` from the lab would give them back.

### 2. LOW–MEDIUM: dock values shrink at 375 and 390 where they were already whole

This breaks the rule that nothing changes at 375 and 390 except removing "…" cases. The fixer's report says p22 is the only dock that changes at 375 or 390; that is not true.

Meter lab, module 7/11 (Waterfall), six keys:

| Width | Value | Before | After | Drawn width before, in its box |
|---|---|---|---|---|
| 390 | CONCRETE (DAMPING) | 10.9 px | 10.6 px | 47.10 in 47.33 (whole) |
| 390 | CLASSROOM (ROOM) | 9.7 px | 9.4 px | whole |
| 375 | CONCRETE (DAMPING) | 10.7 px | 10.6 px | 46.23 in 46.50 (whole) |
| 375 | CLASSROOM (ROOM) | 9.5 px | 9.4 px | 46.13 in 46.50 (whole) |

The cause: `dockValueFitSize` now leaves 1.2 px when it shrinks a value, and the value is measured with nothing added (`dockFit.ts:69-77`, `DockButton.tsx:171`). Every shrunk value drops about 0.1 to 0.3 pt at every width. Nothing goes under 9 pt and nothing is cut.

**Smallest fix:** the same split by platform as in finding 1. On native, keep the 0.3 px margin as before, so phones are unchanged; on the web, keep 1.2. If the owner accepts the small web shrink, the claim in `FIX_FRAME_R2.md` should still be corrected.

### 3. LOW: the margins correct a web-only error, but they also run on phones

The fixer's stated cause is "react-native-web reports every onLayout width as a whole pixel". That is true only on the web. On a phone the same constants mean:
- a value's key needs about 0.2 px more (`dockKeyNeed`, `dockFit.ts:146`);
- every shrunk value is 0.1–0.3 pt smaller (finding 2);
- bezel keys need about 2 px of spare room (finding 1).

None of these breaks a rule. They are a cost with no benefit on a device. The fix is in findings 1 and 2.

### 4. LOW: a chooser-fader whose format ignores the lane position still shifts under a drag

`widestLaneValue` (`dockFit.ts:161-173`) samples `format(i/20)`. Many chooser-faders build their key text from state and ignore the argument, so the widest value found is just today's value:
- `modMeterB.tsx:708` EQ: `() => \`${fmtGain(eqGain)} dB\``
- `modNodes.tsx:75` FREQ
- `modDac.tsx:214`, `:227`, `:496` (JITTER and others)
- `placementDock.ts:207` POSITION, `:261` AIM

These keys can still widen during a drag wherever the dock gives unequal widths (mostly at 320).

Worked example, Meter Waterfall at 320: EQ "0 dB" → "−12.0 dB" moves the need from 33 to about 55. The other keys move by only about 0.05–0.2 px, so it is not visible there, but nothing prevents it elsewhere. I could not show it with a live drag: the shared preview reloaded under every drag, because other agents were saving files.

**Smallest fix:** an optional `widest?: string` on the fader in `DockParam`, which RackUnit prefers over sampling. A lab can then state its widest word.

### 5. LOW: test gaps (from the mutation run below)

- **M16:** the fitted sub size is never put into the style (`BezelReadouts.tsx:188`). The DJ sub lines would be cut again on the web, and no test notices. Smallest fix: extend the `labFrameR2` source check to assert `{ fontSize: subFs }` in the drawn sub's style.
- **M17:** the span line's width is never measured, because `onWidth` is a no-op (`DockButton.tsx:227-231`). The chooser-fader moves under a drag again, and no test notices. Smallest fix: assert `onWidth={setSpanW}` in the source check.
- **M06:** removing the "three keys or fewer never wrap" branch (`dockFit.ts:268`) is not caught. It is only reachable with a very wide key, for example needs [220, 30, 30] at 320. Smallest fix: one unit case.
- Mutations M09–M14 (the component wiring) are caught only by regex checks on the source text, not by anything that renders.

### Rule breaks found that this diff did not cause

- **Meter 6/11, 320:** the TIME bezel value "new → right" is drawn at 9 px, 57.61 wide in a 49.25 box, so it ends in "…". This is the bezel value path, `numFs` at `BezelReadouts.tsx:95-96` and `:183`, which the diff does not touch. It is the same class as DJ p19 "NOT SPEAKING" (HELD in the fixer's report): a shorter word from the lab, or the owner's decision to let a word value wrap.
- **Every lab, for one or two frames after a page mounts:** labels and values draw at their authored size, and cut, until their widths are measured. My early "CUT" readings on Mastering and Meter were these first frames, taken during page changes and the preview reloads caused by other agents. Every one was whole once the page settled. This was there before the diff.

## Measurements

Done in my own tab (since closed), sound OFF throughout. I never accepted Sound Safety and never wrote browser storage. The viewport's `clientWidth` was exactly 390, 375 or 320. Horizontal page scroll was tested by scrolling 60 px sideways: `scrollX` stayed 0 everywhere.

For each dock I read the hidden measure lines, rebuilt the old and the new need and strip layout in the page, and compared both with the drawn widths.

| Lab | Pages | 390 | 375 | 320 |
|---|---|---|---|---|
| Sound Systems Learn | all 23 | no changes, no breaks | no changes, no breaks | bezel labels dropped on 11, 13, 14 (finding 1); docks unchanged |
| Mastering | modules 1–8, every step | not run | no changes, no breaks | M5S3 and M6S2 docks the same as before; "+6.0 dB" 10.9 → 10.7 px (allowed at 320) |
| Mic Principles | all 10 | not run | clean | clean |
| Meter (Visual Analysis) | all 11 | Waterfall values smaller (finding 2) | Waterfall values smaller; OVERS and TP GAP correctly dropped | ROOM key 50 / others 48.8 (was six × 49), from the +0.4 need; MID (SHARED) correctly dropped; "new → right" cut, pre-existing |
| Digital | all 8 | clean | clean | clean |
| EQ Filter Slopes | 1 | not run | not run | clean (one key; bezel cells stack number and unit) |
| Miking I07, two-mic and placement pages | 2 | not run | not run | clean; ZONE sub "start here" 59 in 60, kept at 11 |
| Game Audio p22 | 1 | see below | not run | not run |

In every row, keys were at least 44 wide and at least 48 tall, text was at least 9 px, no dock was newly two rows, and nothing scrolled sideways.

### The 390 change on Game Audio p22: confirmed

Measured on module 22 / 22 at 390×844:

| Key | x | Width | Words |
|---|---|---|---|
| MOVE | 8.00 | 58.59 | label 12; "FACE 90°" 11.1 px |
| SOUNDS | 70.59 | 61.00 | label 10.2; "SPEED 40%" 10.2 px |
| MUSIC | 135.59 | 58.59 | label 12; "OFF" 14 |
| REPORT | 198.19 | 58.59 | label 10.1; "CHOOSE" 14 |
| SOUND | 260.78 | 58.59 | 11.4 |
| ■ STOP | 323.38 | 58.59 | 12 |

The gap is 4. SOUNDS asks for "SPEED 100%" (76 px measured), so its need is 61. That is more than the even share of 57.33, so the strip takes the unequal path: 61 + 5 × 58.59 + 4 × 5 = 373.95 of 374.

Every word is the same size or larger. Old sizes are worked out from the measured widths at 57.33 keys (inner 47, as on the web):

| Word | Before | After |
|---|---|---|
| FACE 90° | 10.9 | 11.1 |
| SPEED 40% | 9.6 | 10.2 |
| MUSIC label | 11.4 | 12 |
| SOUND label | 11.1 | 11.4 |
| REPORT label | smaller than now | 10.1 |
| CHOOSE, OFF, MOVE, ■ STOP | same | same |

MOVE's span is "FACE 110°", nine characters, the same width as "FACE 355°" in a mono font.

## Mutation table

Each fix was undone one at a time in the scratch copy, then restored. Every restore was confirmed byte-identical with `cmp`. Each run used every test file that mentions `rack/`, `dockFit`, `BezelReadouts`, `DockButton` or `RackUnit`. Baseline on the copy: 2804 pass, 0 fail.

| # | Mutation | Fails | Caught by |
|---|---|---|---|
| M01 | `VALUE_FIT_MARGIN_PX` 1.2 → 0.3 | 6 | R2 value grid, measured cases, need ≥ 9 pt, DJ subs |
| M02 | value as authored uses +0.5 slack | 2 | "VAR ON" case, whole-pixel grid |
| M03 | `dockKeyNeed` without the value margin | 3 | need ≥ 9 pt, p22 at 320 |
| M04 | one row accepted with keys < 44 | 5 | p9 / p10 at 320, random 4,000, seven keys, dec_A12 |
| M05 | equal keys < 44 left equal | 1 | seven keys at 320 |
| **M06** | **"≤ 3 keys never wrap" branch removed** | **0** | **not caught** |
| M07 | bezel key back to +0.5 slack | 4 | LAST TAKE, SURFACE, 390 case, grid |
| M08 | `widestLaneValue` does nothing | 2 | widest value, never less than today |
| M09 | bezel cell `Math.round` again | 1 | source check only |
| M10 | sub line never fitted | 1 | source check only |
| M11 | DockButton fits the value the old way | 2 | source checks only |
| M12 | need ignores the span | 1 | source check only |
| M13 | value measure +0.3 again | 1 | source check only |
| M14 | RackUnit passes no `valueSpan` | 1 | source check only |
| M15 | sub fitted against the whole cell | 1 | source check only |
| **M16** | **fitted sub size never put into the style** | **0** | **not caught** |
| **M17** | **span line never measured** | **0** | **not caught** |
| M19 | shrunk value keeps 1.0, not 1.2 | 1 | whole-pixel grid |

## Test results (the real tree, unmutated)

| Run | Result |
|---|---|
| `node --test --test-timeout=120000 test/labFrameR2_20261113.test.ts test/labFrameHeld_20261113.test.ts` | 41 tests, 41 pass, 0 fail |
| Every file from `grep -l "rack/" test/*.ts` (89 files) | 2251 tests, 2251 pass, 0 fail |
| `npx tsc --noEmit -p .` | exit 0 |

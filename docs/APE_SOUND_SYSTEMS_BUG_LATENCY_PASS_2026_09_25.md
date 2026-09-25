# Sound Systems Lab — bug and latency pass (2026-09-25)

Owner (verbatim): *"send an agent through the new lab looking for bugs and slow action times - then fix"*.

Every one of the 52 pages plus the appended understanding check was walked in all five
modes at 375×812, the rack pages with a plot or map again at 375×667 (the short phone) and a
sample at 768×1024, every dock key and lane exercised, the bezel arithmetic spot-checked
against the engine, and the action times measured — then the causes were found in code and
fixed. **Web harness, not a phone**: everything below was measured in the `ape-web` preview
(Chrome, `localhost:8091/#soundsystemspreview`, the built-in browser tools). The absolute
numbers are a desktop browser's; a phone is slower on every one of them. What matters is the
relative outliers and the structural causes, which are the same on both.

Nothing was published, built or submitted. The engine (`src/features/soundsystems/**`) is
untouched; the shared rack frame (`src/screens/lab/rack/**`) and `kit/PagedLab` are untouched.

## Result in one paragraph

Six bugs fixed, two slow actions fixed (they were the two slowest rides in the lab and both
had structural causes), nothing left broken that the owner had not already accepted. The
worst lane ride — LEARN 17 AIM, ~40 ms of main-thread work per step with 50–70 ms long
tasks — is now ~14 ms per step with no long task; the gain-chain pages (LEARN 16, OPERATE 3)
went from 27–29 ms per step to 18–24 ms. tsc clean; **1,986 tests pass, 0 fail** (the same
1,986 — no engine change, no test change).

## (a) Action times — method, then the tables

Three measurements, all taken in the page with `javascript_tool`:

1. **Per-step main-thread cost** (`stepBusy`): a synthetic `mousedown` on the lane, then one
   `mousemove` per step (20 steps across the lane) with a `MessageChannel` message posted right
   after each dispatch — it runs only when React's render task for that step has finished, so
   the time from dispatch to message is the step's synchronous JS + React + DOM work. This does
   not depend on the frame rate, which mattered: the browser pane was hidden for part of the
   session and Chrome throttles `requestAnimationFrame` in a hidden tab (30–60 Hz), so the
   first-pass frame-gap numbers are comparable within the first pass only.
2. **Long tasks** over a 40-step ride (`PerformanceObserver`, `longtask` — anything over 50 ms).
3. **DOM attribute writes per step** (`Element.prototype.setAttribute` wrapped and counted for
   one lane move) — the structural signal: how much of the drawing React and react-native-svg
   rewrite for one change.

Tap latency = time from the dispatched click on a dock key / tray chip to the first DOM
mutation (`MutationObserver`). Page change = CONTINUE / page-list tap to the new header title.
Mode open = hub card tap to the first page's title.

### First pass — every page, HEAD `fff75001`, 375×812, pane visible (frame-gap method)

Lane ride = 40 synthetic steps across the lane; *avg/max* are the frame gaps in ms, *LT* the
long tasks (>50 ms) during the ride. Tap = first response in ms. Page = page change in ms.

| Page | Lane ride avg / max (LT) | Worst tap | Page change |
|---|---|---|---|
| LEARN 1 The complete system | STATION 12 / 55 (1) | 24 (STAGE IN) | 89 |
| LEARN 2 Trace the signal | — | 35 (NEXT) | 44 |
| LEARN 3 Ten kinds of system | TYPE 14 / 37 (0) | — | 56 |
| LEARN 4 Match the venue | document | — | 31 |
| **LEARN 5 Output configurations** | CONFIG 15 / 49 (**1: 57 ms**) | — | 60 |
| LEARN 6 / 7 | document | — | 16 / 10 |
| LEARN 8 Subwoofer feeds | — | 13 (FEED) | 27 |
| **LEARN 9 Sub placement** | LAYOUT 9 / 36 (**2: 65, 87 ms**) | — | 82 |
| LEARN 10 Stage monitors | MONITOR 6 / 6 (0) | — | 25 |
| LEARN 11 Splits | MON GAIN 7 / 12 (0) | 8 (SPLIT) | 35 |
| LEARN 12 Wiring | document | 30 (CONNECT) | 30 |
| LEARN 13 Loads | CABINETS 6 / 6 (0) | 7 (CABINET) | 19 |
| LEARN 14 Power | AMP 8 / 12 (0) | 6 (LISTENER) | 23 |
| LEARN 15 Deployment | document | — | 18 |
| **LEARN 16 Gain structure** | PREAMP 22 / 55 (1) | 40 (STAGE chooser) | 42 |
| **LEARN 17 Coverage and aim** | COVERAGE 15 / 55 (2: 54, 72) · **AIM 35 / 67 (5: 55–64)** | 34 (FILLS, 70 total) | 88 |
| LEARN 18 Delay | DELAY 15 / 30 (0) | 8 (DISTANCE) | 33 |
| LEARN 19 Processing | document | — | 17 |
| LEARN 20 Feedback | SEND 9 / 18 (0) | 6 (WEDGE) | 16 |
| LEARN 21 Method | WALK 7 / 24 (0) · RUN 4.3 s to the fault (8 steps at 520 ms) | — | 62 |
| LEARN 22 / 23 check | document | 12 (an answer) | 17 / 24 |
| BUILD 1 The empty venue | PART 9 / 18 (0) | 25 (place); 52 once a box is live | 24 |
| BUILD 2–11 capstones | PART (same) | CONSOLE tray 30–52 | 16–30 |
| ROUTE 1 Channel | STATION 7 / 24 (0) | — | 25 |
| ROUTE 2 Pre/post | VOX FADER 10 / 18 (0) | 11 (CONSOLE) | 30 |
| ROUTE 3 Which tool | document | — | 17 |
| ROUTE 4 Monitor mixes | SEND 11 / 18 (0) | 42 (CONSOLE tray) · 27 (ALL PRE) | 20 |
| ROUTE 5 Groups / DCA | BAND DCA 10 / 24 (0) | 22 (CONSOLE) | 32 |
| ROUTE 6 Mutes | — | 9 (BAND MUTE) | 23 |
| ROUTE 7 Matrices | MC → AUX 7 9 / 12 (0) | 10 (crosspoint) | 22 |
| ROUTE 8 Patch | SOCKET 6 / 6 (0) | 9 (BUS) | 23 |
| OPERATE 1 Power-up | — | 17 (STEP) | 30 |
| OPERATE 2 Line check | LINE 9 / 24 (0) | 38 (PROBE / MARK) | 65 |
| **OPERATE 3 Gain** | PREAMP 27 / 48 (1: 54) | 20 (chooser) | 44 |
| OPERATE 4 Ring-out | SEND 9 / 18 (0) | 7 (NOTCH) | 42 |
| OPERATE 5 Shutdown | — | 10 (DOCUMENT) | 19 |
| TROUBLESHOOT 1 | document (map) | — | 64 |
| TROUBLESHOOT 2–6 | — | 28–44 (CASE), 19 (PROBE), 27 (FAULT) | 23–81 |
| Mode open from the hub | LEARN 40–42 · BUILD 19 · ROUTE 17 · OPERATE 9 · TROUBLESHOOT 38 | | |
| Leave the lab | 15–26 | | |

Thresholds asked for: tap > 100 ms (none), page change > 400 ms (none), mode open > 800 ms
(none), recurring lane gaps > 50 ms and long tasks during a ride — **LEARN 17 AIM** (five
long tasks in one ride, every 1° step ~35 ms), then LEARN 16 / OPERATE 3 and the plot pages
with a lit floor field (LEARN 5, 9, 17 COVERAGE).

### Before / after on the flagged rides — same code positions, `stepBusy` method (ms per step)

"Before" is HEAD `fff75001` (my four files path-stashed and re-measured in the same session on
the same page states); "after" is this commit. Long tasks are from the 40-step ride at the
same point; attribute writes are for one lane move.

| Page · control | Before: avg / median / max | Before LT | Before writes/step | After: avg / median / max | After LT | After writes/step |
|---|---|---|---|---|---|---|
| **LEARN 17 · AIM** (1° steps, field redraws every step) | **39.9 / 37.4 / 70.3** | 2–5 | 1,700–3,270 | **14.2 / 16.7 / 20.1** | 0 | 420–980 |
| **LEARN 17 · COVERAGE** (5° steps) | 25.3 / 23.7 / 67.9 | 2–3 | 1,750–1,810 | 12.7 / 16.3 / 28.6 | 0 | 550 |
| **LEARN 16 · PREAMP** | 27.0 / 24.1 / 51.8 | 1 | 1,500–1,870 (168 `id`) | 17.8 / 18.9 / 31.3 | 0 | 1,440 (0 `id`) |
| **OPERATE 3 · PREAMP** | 29.2 / 25.7 / 41.1 | 1 | 1,340–2,030 (168 `id`) | 24.0 / 24.5 / 35.7 | 0 | 1,620 (0 `id`) |
| LEARN 5 · CONFIG (plan redraws) | 23.3 / 24.1 / 57.4 | 1 | 2,280–3,070 | 10.0 / 9.6 / 22.9 | 0 | — |
| LEARN 9 · LAYOUT (sub field) | 8.6 / 1.5 / 62.9 | 2–3 | 2,040–3,500 | 3.0 / 0.1 / 18.2 | 0 | — |
| LEARN 3 · TYPE | 19.0 / 15.0 / 45.5 | 0 | — | 13.3 / 10.9 / 27.5 | 0 | — |
| LEARN 18 · DELAY (no floor field on this page) | 13.6 / 14.5 / 19.8 | 0 | 1,650 | 16.4 / 16.3 / 23.9 | 0 | 1,650 |
| LEARN 1 · STATION (system map, no plot) | 15.0 / 18.9 / 29.1 | 0 | — | 15.3 / 19.1 / 33.4 | 0 | — |
| BUILD 1 · PART (empty plot) | 12.2 / 13.6 / 22.0 | 0 | — | 12.5 / 13.0 / 22.4 | 0 | — |

The last three rows are the control: pages the fixes do not touch, unchanged within noise.

## (b) Bugs — page, repro, cause, fix, file

1. **LEARN 17 (and every plot with a lit floor: LEARN 3, 5, 9, 10, BUILD once a box is live) — the slowest ride in the lab.**
   Repro: bind AIM, ride the lane; five long tasks in one ride, ~40 ms of work per 1° step.
   Cause: the coverage field was ~780 cells, each its own `<G><Rect>` reconciled by React and
   rewritten by react-native-svg on every render (`opacity` ×1,200, `fill` ×900 writes per
   step), and the cell list was memoised on the *identity* of the beams array — which every
   page rebuilds on every render, so the field was also recomputed when nothing had moved.
   Fix: the field is keyed on a signature of what moves it (position, aim, angle, gain, throw,
   spread, rig, pattern), and it is drawn as ONE `<Path>` per level — the window quantised to
   48 levels (an opacity step of ~0.013), the seam hatch as one more path. Same picture; 62
   paths instead of 1,560 nodes. `src/screens/lab/soundsystems/art/VenueView.tsx`.
2. **LEARN 16 / OPERATE 3 — the PREAMP ride rewrote the equipment row on every step.**
   Repro: ride the lane; 168 `id` attribute writes per step, ~27–29 ms of work each.
   Cause: `GearGlyph` minted a NEW gradient id on every render (`g${seq++}` in the function
   body), so all seven gradients and every `url(#…)` fill of all eight glyphs changed on each
   parent re-render — and the glyph row re-rendered with the chain although it only depends on
   the stage ids. Fix: the id is minted once per instance (`useRef`); the glyph row is a
   `memo` keyed on size and the stage ids. `art/gearArt.tsx`, `art/ChainMeter.tsx`. (The
   stable id also spares the power rack, the BUILD in-hand card, LEARN 10's monitor card and
   the line-check card, which all re-render their glyphs on every state change.)
3. **ROUTE 4 — the CONSOLE key read "ALL PRE" before any send existed** (the item the previous
   session noticed). Cause: `allPre` is an `every` over the sends, vacuously true on an empty
   desk. Decision: the key's value is a claim about sends that exist, so it reads **Open** until
   one does and **ALL PRE** only when every existing wedge send is pre-fader (the goal chip
   already had the same guard). `pagesRoute.tsx`.
4. **ROUTE 6 — the ALL MICS key changed nothing** (a dock key must change the picture or a
   readout). Cause: the page assigned every band channel to BAND MUTE and nothing to ALL MICS,
   so the second mute group had no members. Fix: the seven microphone channels (kick, snare,
   overheads, guitar, both vocals, the announce mic — not the DIs, not playback) carry
   `mg-mics`; pressing ALL MICS now leaves MAIN HEARS 3 CH. The STILL LIVE cell read "ALL"
   whenever the band was not muted and "MC · PB" whenever only those two *or fewer* were left;
   it now reads ALL only when every channel is heard, MC · PB only when exactly those two are,
   CHECK otherwise (the existing words, no new copy). `pagesRoute.tsx`.
5. **LEARN 5 — the lane and the dock key read "Lobby,"** (with the comma) for *Lobby, recording,
   broadcast and overflow feeds*. Cause: the short name was the first space-separated word.
   Fix: split on space or comma. `pagesLearnA.tsx`.
6. **ROUTE 4 — "DRUMS’S WEDGE", "BASS’S WEDGE"** in the SEND chooser and the lane readout. A
   generated possessive; names ending in S now take the bare apostrophe (DRUMS’ WEDGE, BASS’
   WEDGE). Wording change, listed here as the rule requires. `pagesRoute.tsx`.

Everything else exercised behaved: every bezel value spot-checked matches the engine — LEARN
13 loads (1–4 cabinets at 16/8/4 Ω, bridged: 8 Ω → 1000 W marginal, 2×8 Ω bridged → 4 Ω
unsafe), LEARN 14 SPL 112.0 / 98.0 / 88.4 dB at 2 / 10 / 30 m, LEARN 16 and OPERATE 3
verdicts and headroom through every stage with unity homes, LEARN 18 delay 29.1 / 87.4 /
174.8 ms at 10 / 30 / 60 m and 179.5 / 170.5 ms at 5 / 35 °C, LEARN 20 loop limit −12 / 0 /
+4, ROUTE 2 pre vs post at −20 dB and OFF under mute, ROUTE 5 DCA −9 dB drops the main and
not the pre-fader wedge, ROUTE 7 lobby = main + aux 7 (+5 dB send reads +9 dB), ROUTE 8 wrong
patch named; every tray opens, stays open where sticky, closes on ✕ and never covers the
glass; every flip-through lane hits every item (12 of 13 map stations in 40 steps, 10/10
types, 11/13 configs, 5/5 layouts, 4/4 monitors, 8/8 strip stations, 7/7 sockets, 14/14
lines, 18 parts) and never steps past the end; double-tap lands on the declared home
(preamp +40, faders 0, amp −12, send 0, coverage 90°, aim 18°) and does nothing where no home
is declared; LEARN 21 RUN completes at the fault (3/6) in 4.3 s and WALK AGAIN re-runs;
BUILD places, cables, refuses (with the UNSAFE warning), removes, clears, and capstone 1
grades to PASS and records on the hub; OPERATE 1/5 grade the order and RESET; OPERATE 2 probes
and marks all 14 lines and rejects a wrong mark; TROUBLESHOOT 2 and 3 grade ✓ / ✓✓, warn on a
backward jump, RESET and BENCH; the check page grades (wrong → "Not right — try another",
right → "Correct."); BACK / CONTINUE / Leave / the page list were never blocked; progress
(`ape:sound-systems-learn:v1`) survived Leave → re-enter (page 20 restored, 14 done dots);
no animation loop survives Leave (0 foreign `requestAnimationFrame` calls per second on the
hub after LEARN 16/17/1); the DOM overflow scan found nothing on any page at any of the
three sizes; the console shows no React key / act / DOM-prop warning from this lab.

## (c) Flagged but left alone — and why

- **OPERATE 1 / 5: a wrong FIRST step reads ORDER: SO FAR OK** (tap AMPS first: "SO FAR OK",
  LIT 2/5). The engine's `firstSequenceError` is pairwise — a step is wrong when a step that
  must precede it is tapped after it — and it is tested that way (`{ id: 'amps', mustFollow:
  'verify' }`). The error shows on the very next tap of a predecessor. Engine design, tested;
  left.
- **Capstone REQS on an empty venue**: not only capstone 6 (page 7, 1/6) — capstones 5, 7, 8
  and 9 (pages 6, 8, 9, 10) also open at 1/n because one requirement each holds vacuously on
  the fresh console ("every monitor send is pre-fader", "the drums still reach the main mix",
  "no vocal in the sub aux"…). Same class as the known limit, engine grading; left, listed.
- **BUILD selection after a cable**: a placed device stays selected, so tapping the console
  next runs a cable FROM the new device (a powered box's link output into the console is a
  legal line-level link — the known limit) and the console cannot then feed it ("a loop").
  The learner removes the cable and DESELECTs first. Known and accepted; left.
- **BUILD state is not persisted between pages** — known, unchanged.
- **LEARN 21 WALK** can ride past the fault (the stations beyond read NO SIGNAL) while RUN
  stops at it. Honest readings; left.
- **LEARN 18 DELAY at ~14–16 ms a step**: react-native-svg on web rewrites every attribute of
  every element React re-renders (`native-i-d`, `on-click`, `stroke-linecap` ×264 on this
  page — every path in the plot), so a page whose overlay changes per step pays for the whole
  drawing. Under every threshold; left. The same library behaviour is the floor under the
  remaining ~1,400 writes on the gain-chain meters, which do change per step.
- **Peak-hold frame callbacks** (`usePeakHold`) run while any meter is mounted, including
  under reduced motion / Low-Light (the input is static there, nothing moves). They stop on
  unmount — verified. Left.
- **Harness lesson, not an app bug**: the hub and a mode's previous screens stay mounted
  (display: none) under the active one, and their buttons still answer dispatched clicks. A
  DOM-driven harness that does not filter by visibility clicks the hub's hidden card from
  inside a mode and PUSHES a new mode screen — I stacked 25 that way before noticing. On a
  fresh load: enter a mode → one screen mounted, Leave → zero. Recorded so the next harness
  filters on `getClientRects().length`.
- Console: react-native-svg's "Unknown event handler property `onResponder…`" (known, the
  design doc lists it, not ours); `navigator.vibrate` blocked (haptics under synthetic clicks
  — a harness artefact).

## Short phone (375×667) and tablet (768×1024)

The whole first pass and every before/after ride ran at 375×812 with the browser pane
visible. By the time the size passes ran, the pane was hidden, and a hidden Chrome tab
suspends `requestAnimationFrame` and stops delivering `ResizeObserver` callbacks — which is
what react-native-web's `onLayout` is built on. The rack's glass measures itself with
`onLayout` before it mounts the instrument, so on a page opened in the hidden pane the glass
box is laid out at the right size but the SVG inside it never mounts (`svg` count 0). What
the size passes could therefore verify is the FRAME — the box the rack reserves, the HIDE /
SHOW control, the well, the lane, the dock and the footer — and the DOM overflow scan on
everything mounted; the instrument's fit inside the glass at these two sizes was verified by
the previous pass on the same, unchanged layout code (`RackUnit`, `StageFit`, `rackLayout`
are untouched by this pass) and by this pass at 375×812.

375×667 (LEARN 1, 3, 17, 18 — the L-stage plot pages): the glass box drops from L to M as
designed (stage block 276 px = 200 glass + 44 bezel + 32 badge; at 812 it is 250 + 44 + 32);
HIDE DISPLAY sits at y 378–422, the lane at 489–537, the dock keys under it, the footer at
615–659 — inside the 667 viewport, nothing overlapping; the well between the badge and the
lane is ~67 px, which is the case HIDE DISPLAY exists for: hidden, the control moves to y 178
and the well takes 178–489, the bezel and the badge stay on screen (COVERAGE / AIM / RIG /
FILLS still print, CONCEPTUAL COVERAGE still shown), the lane still rides with the bezel
following, SHOW DISPLAY restores the block. A tray (DISTANCE on LEARN 18) opens over the well
and dock only. Overflow scan: nothing on any of the four pages, shown or hidden.

768×1024 (LEARN 1 and 17, ROUTE 4, OPERATE 3, TROUBLESHOOT 2, BUILD 1): the stage block
keeps its L size (326 px = 250 + 44 + 32, at y 84), HIDE DISPLAY at y 418, the lane at
846–894 (TROUBLESHOOT 2 has no lane — its controls are discrete, by design), the footer at
972–1016 inside the 1024 viewport — the same numbers the previous pass recorded, on the same
unchanged frame; overflow scan clean on all six.

Viewport reset to desktop at the end.

## (d) Verification

- `npx tsc --noEmit -p tsconfig.json` — clean (exit 0), after each edit.
- `npm test` — **1,986 pass, 0 fail, 0 skipped** (318 suites), the same 1,986 as before the pass.
- Re-walk of every changed page after the fixes at 375×812: LEARN 3, 5, 9, 16, 17, 18, 21;
  BUILD 1–2; ROUTE 2, 4, 5, 6, 7, 8; OPERATE 1–5; TROUBLESHOOT 2–3 — readouts as listed above,
  overflow scan clean, no console errors on the fresh bundle.
- The before/after table above is from the same session, same page states, HEAD path-stashed
  and popped between the two runs.

## (e) Commits

- **`476c0de0`** — `Sound Systems Lab: bug and latency pass`: the five source files
  (`art/VenueView.tsx`, `art/gearArt.tsx`, `art/ChainMeter.tsx`, `pagesLearnA.tsx`,
  `pagesRoute.tsx`), added by name. The working tree also held another session's edits to
  `cableinstall/**`; they were left untouched and uncommitted.
- The `docs:` commit that follows carries this report and the filled handoff stub; its sha is
  on the stub entry in `docs/CROSS_SESSION_HANDOFF.md`. Downloads copy:
  `C:\Users\profe\Downloads\2026-09-25_SOUND_SYSTEMS_BUG_LATENCY_PASS.md`.
- Not published, not built, not submitted.

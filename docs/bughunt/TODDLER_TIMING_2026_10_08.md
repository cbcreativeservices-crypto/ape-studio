# Chaos-toddler + timing hunt — Miking Labs 6–7, Mixing Guides world map, "bring in a pro" note (2026-10-08)

Branch `hunt-1008`, cut from `final-lab` f9957b18. Scope is the work added since 2026-10-07:
- Miking Lab 6 (F01–F16) and Lab 7 (B01–B17), with the shared kits and the engine changes (dock short forms, the distance rule, label leaders, the 'held' clip, `withMics` labels);
- the Mixing Guides world map (swipe, tap → 1.5 s flash → open, hide/show, filter);
- the "Knowing When to Bring In a Pro" note;
- head icons and figure heads.

Method: I read the new code paths, then ran this hunt's own Expo web server (port 8137) with headless Chrome through playwright-core (not the shared browser). I worked at 390×844, at 844×390 (a phone turned sideways) and at 1024×1366. I took sample pages rather than every page: every F/B lesson's MEET and SETUPS page at its default setup, plus all 30 non-default setups on SETUPS; NEXT walks on F01, F08, F10, F12, F16, B04, B10, B13 and B17; seven captures. Times come from a Playwright click until the DOM changed (this adds about 25–45 ms of harness overhead), or from in-page `performance.now()` until the next paint where marked. Desktop dev build. The figures are not fps, and no fps is claimed.

## Found and fixed

| id | where | how to reproduce | severity | fix | lock test |
|---|---|---|---|---|---|
| T-1 | Mixing Guides hub, tap → flash | Tap any style with the map showing | Minor (timing, 142–152 ms to the flash) | `onTilePoint` / `onTileHoverOut` / `onScroll` depended on `flashId`. Every tap, and every flash end, therefore re-rendered all 50 memoised tiles. They now read a `flashRef`, so the callbacks stay stable. In-page tap → flash painted: **142–152 → 99–101 ms** | toddlerTiming_20261008 T-1 |
| T-2 | Hub, tapping the same style again | Tap a style, then tap it again every 400 ms | Minor (stuck-ish: the open kept moving away) | Each tap restarted the 1.5 s timer, so the guide opened only 1.5 s after the *last* tap (4 taps → 2567 ms). A second tap on the style that is flashing now opens it at once (`openNow`). A tap on a *different* style still re-selects it | T-2 |
| T-3 | Hub, Hide map mid-flash | Tap a style, then tap "Hide map" within 1.5 s | Minor (dead wait) | The flash vanished with the map, but the guide still opened only when the hidden timer fired (1747 ms, with nothing on screen to explain the wait). Hiding the map now opens the chosen guide at once, as a tap does when the map is hidden: **1747 → 497 ms** | T-3 |
| T-4 | Miking Lab 6–7 setup key (dock), 390 wide | F08 SETUPS: the key read "PASS ▸ WALKING P…" | Minor (cut label, owner X3 class) | Ten setup names were cut on the dock: WALKING PASS, VEHICLE · PAPER PLAN (F08), HOLLOW WOOD (F01), FAR AND LOW (F07), TEST SOURCE · ROOM ONLY, INSTALLED PA · SYSTEM + ROOM (F13), VENUE · MAINS, SUB AND FILL, STUDIO MONITORS (F14), QUIET BOOTH (B09) and TWO HANDHELDS (B10). Each now has a short form in `engine/rack/dockWords.ts`, the one X3 rule: WALKING, VEHICLE, HOLLOW, FAR, TEST, HOUSE PA, VENUE, MONITORS, QUIET, TWO MICS. The full name stays in the accessibility label. A re-sweep of all ten setups found none cut | T-4 (each short form is ≤ 9 characters and unique within its lesson) |
| T-5 | Hub map caption, phone turned sideways (844×390) | Open the hub with the phone sideways | Minor (cut caption) | The map's size follows the window height (~208 px wide when the phone is sideways), and the caption was held to that width. Two lines cut it to "…comes from. Cli…". The caption may now be up to 560 px wide (or the window width minus 32 px, whichever is less). I hovered all 50 styles at 844×390 and at 390×844, and no caption was cut | T-5 |

The full suite flagged my first T-1 change: the G6 ratchet in patternP12 caught a focus cleanup with `[setFlash]` dependencies. That cleanup now has `[]` dependencies, and the file passes again. Before/after check (R2): the old three source files were put back with `git show`, and all 5 new tests failed. With the fixed files restored, all 5 pass.

## Checked and found correct
- **Map timer:** BACK or blur mid-flash cancels the open (focus cleanup). Unmount clears the timer. Tap A, then tap B mid-flash, opens B. Typing in the filter mid-flash still opens the chosen guide (fill took 98 ms, open at 1973 ms). Turning the phone sideways mid-flash still opens once. A double tap inside the tile's press lock (250 ms) is taken as one tap. Reduced motion keeps the countries lit and does not blink. The blink loop (4 × 340 ms) ends before the 1.5 s open.
- **ProNote** (Mixing Guides and Mastering): shown once on first open, and not again after a reload. GOT IT tapped three times closes it once. The link reopens the same text 3 times in a row (open 29–37 ms, close 25–33 ms), and nothing is left open. No text under 9 pt. Low-Light suppression and focus come from the shared `useScreenIntro`. PagedLab holds the guest reminder while the note is owed. After GOT IT the reminder shows only after the 1200 ms fallback, which is after the note's fade, so the iOS Modal-over-Modal problem cannot happen. Mastering has no guest popup to collide with.
- **Miking Labs 6–7:** all 33 lessons opened on MEET and on SETUPS at 390×844 with no console errors and no DOM text under 9 px. The only cut text was T-4. Every NEXT walk ran without a stuck step. The page's 400 ms NEXT tap lock swallows a tap that comes inside it, which is intended. Landscape (F12, B17) and tablet (F16) walks had no cut or off-screen text. The distance rule (`fmtLen`) checks out at the 1 m and 3 m boundaries, and at 10 m and 100 m (no "−0", no millimetres beyond 1 m). The 'held' arm and fist hooks run before their early returns. The B10 figure head and the reporter's hand draw correctly at 390 (capture).

## Left (with why)
- **Tap → flash is still ~100 ms on desktop dev web.** The remaining cost is the map's own re-render: the fill layer swaps and the country paths are laid out again. It is at the 100 ms line and well under the 150 ms bound, so I did not pursue it further.
- **NEXT into a step that mounts a rack canvas is 340–590 ms (F01, F12 and F16 MEET steps 1–2).** On web this is CanvasKit creating its drawing surface. The 2026-10-07 labs 1–4 pass measured the same class at 184–553 ms. It does not apply on a device. Other NEXT taps took 22–70 ms.
- **Web-only console noise:** `accessibilityElementsHidden` / `importantForAccessibility` on the map's two `<Svg>`s give "React does not recognize the prop" on web. This is harmless, and the frame View already carries `A11Y_HIDDEN`. It was left alone to keep the change small.
- **B10 SETUPS side view:** the "PA" and "CAMERA" labels sit at the frame edges with no leader line. They appear to be off-frame pointers by design, so they were not treated as a bug. Owner eye wanted.
- **On the web, Escape does not close the ProNote sheet.** `onRequestClose` (Android BACK) is wired, and the Escape key is a web-only behaviour of the RN-web Modal.
- **Swipe-follows-finger** cannot be driven on the web (`TOUCH` is false there). The code read checks out: tile layouts are relative to the panel, the panel's padding is included, and hidden tiles are skipped.

## Timing (desktop dev, web preview, headless Chrome, 390×844 unless noted)

| action | before (ms) | after (ms) | note |
|---|---|---|---|
| Hub tap → flash caption painted (in-page) | 142–152 | **99–101** | T-1 |
| Hub tap → guide open (includes the 1.5 s flash) | 2040 | 1890 | the flash end no longer re-renders the 50 tiles |
| Hub tap with the map hidden → guide open | 153–182 | — | navigation alone |
| Hub mash the same tile ×4 (400 ms apart) → open | 2567 | opens on the 2nd tap | T-2 |
| Hub Hide map at 300 ms mid-flash → open | 1747 | **497** | T-3 |
| Hub hover → caption | 30 | — | |
| Hub open (reload, dev bundle cached) | 1880–2436 | — | page reload; not an in-app open |
| ProNote link → note / GOT IT → gone | 29–37 / 25–33 | — | |
| Miking lesson open (reload) | 2556–4738 | — | page reload dominates; in-app open is a NEXT-class mount |
| Miking NEXT, steps without a canvas mount (F/B, 9 lessons) | 22–71 | — | |
| Miking NEXT into a rack-canvas step (F01/F12/F16 MEET) | 336–593 | unchanged | web-only CanvasKit surface creation (see Left) |

## Verify
- tsc: clean.
- Full suite (run once): 10054 tests, 10053 pass, 1 fail. The failure was the G6 ratchet on my own T-1 change. After the fix, patternP12 plus the hunt and Mixing Guides test files pass (39 / 39).
- New test file: `test/toddlerTiming_20261008.test.ts` (5 tests). Updated: `test/mixingGuidesWorldMap_20261008.test.ts` (the map-hidden assertion now matches `openNow`).
- No release gate, owner default or image was touched. `MIKING_PUBLIC` is still false.

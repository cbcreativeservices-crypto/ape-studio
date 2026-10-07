# Chaos-toddler hunt — Mixing Guides, Labs menu tiles, release gates, gating (2026-10-07)

Branch `hunt-mixing-menus` (from `final-lab` b40a75f3). Scope: `src/screens/lab/mixingGuides` (hub grid, search, style pages, collapsible sections, PREV/NEXT, MARK AS READ, what's left, iPad 1024×1366), the member Labs menu tiles (Miking family tiles + Mixing Guides tile), the store-build gates (`MIKING_PUBLIC` / `MIXING_PUBLIC` false), and membership gating of every Miking / Mixing route.

First, the owner order of 2026-10-07: **"Hammond" is restored** as a brand-name exception. `scripts/mixing-guides/edits.py` no longer rewrites Hammond to "tonewheel organ" (B3 becomes "Hammond organ"; Leslie still becomes "rotating speaker"; Fred Hammond unchanged). Hammond was taken out of `flags.py`, the mixing test's BRANDS list and the Miking `RESEARCH_NAMES`. The guides were regenerated with `convert.py`, which reported 0 problems. The Miking lessons contain no "tonewheel organ", so nothing there needed restoring. Test: `mixingGuidesReview20261007.test.ts` checks that "Hammond" survives.

Method: code read of every path, then the web preview (`#labpreview/MixingGuides`, `#labpreview/MixingGuide/<id>`, own Expo server, 412×915 and 1024×1366). Playwright drove triple/double taps, NEXT/FINISH/PREV bursts, OPEN ALL / CLOSE ALL / single sections, search typing, clearing and no-match searches, the what's-left screen, and checks for text under 9 pt and for ellipsized text.

## Round 1

| id | where | how to reproduce | severity | fix | test added |
|---|---|---|---|---|---|
| R1-1 | MixingGuideScreen footer | Open a guide as a members-only PREVIEW (a known non-member), tap MARK AS READ | Major (dead button) | A preview gets nothing saved (`markGuideRead` returns early), so the button did nothing, silently, every time. A preview now sees "Members-only preview — reading here is not recorded." instead of the button | toddlerMixingMenus20261007 R1-1 |
| R1-2 | Hub search | Type the first letter / clear the field | Minor (perf, >100 ms tap) | Each keystroke used to unmount and remount the animated tiles. Now the 50 tiles stay mounted in a memoised `HubTile`, filtered-out tiles are only hidden (`display:none`), the panel stays mounted when nothing matches, and the grid follows the field through `useDeferredValue` | R1-2 + mixingGuides.test updated |
| R1-3 | Guide sections | OPEN ALL, toggle a section, NEXT with sections open | Minor (perf) | `Section` is memoised and gets a stable `toggle`, so a toggle re-renders only the section that changed | R1-3 |
| R1-4 | Release gate | No test proved the store-build state: every gate test set `EXPO_PUBLIC_MIKING_PREVIEW=1` first | Minor (coverage gap) | No code change. A test file now runs without `__DEV__` and without the preview switch, and asserts that both gates are closed, that no MikingHub / MikingLesson / MixingGuides / MixingGuide tile exists, that no empty "Miking Labs" heading appears, and that all four routes are still members-only (deep link / restored state) | store-build suite |

Checked and found correct: a NEXT/FINISH triple tap advances once (400 ms tap lock). A PREV double tap goes back once. FINISH ×3 opens what's left once. DONE and the header ‹ share one leave window. Guide 50 shows FINISH, and FINISH → what's left → PREV returns to guide 50. Read status only grows. A guest's reading is held for sign-in (holdSessionWork), and the end screen says "not signed in". Gate states: checking → GateHold, unconfirmed → `MEMBERSHIP_NOT_CONFIRMED`, locked → preview scrim, open → content, all through `withMembershipPreview`, and all four routes are in `MEMBER_ONLY_EXTRA_ROUTES`. No text under 9 pt and no ellipsized text at 412 or 1024.

## Round 2 (re-hunt, including Round 1 regressions)

| id | where | how to reproduce | severity | fix | test added |
|---|---|---|---|---|---|
| R2-1 | Hub grid on iPad portrait (1024 wide) | Open the hub at 1024×1366 | Cosmetic | Three 32% tiles left a ~35 px empty strip on the right against a 13 px left margin. Tiles are now 32.4% (and 24.2% for four across), so the strip is ~22 px and three across still fits at 768 | none (visual; checked by measurement in the preview) |

Regression checks on the Round 1 fixes: hidden tiles drop out of the accessibility tree (display none). A no-match search keeps the panel mounted and shows the "No style matches" line. The memoised Section still re-renders on a new guide (its `guide` prop changes). The preview note never shows for a member or a guest. tsc is clean.

## Round 3

No new defects. Repeated the Round 1–2 chaos run: NEXT/PREV/FINISH bursts, OPEN ALL while switching guides, search typing / clearing / no-match then opening a tile, iPad layout, the what's-left jumps.

Open item for the owner (not fixed here): the Labs menu (`EarLabScreen`) uses the same 32% / 24% tile widths, so it probably has the same right-hand strip on an iPad. `test/ipadPass_20261007` pins `'24%'` there, so the change is left for a pass that owns that screen.

## Timing (desktop dev, web preview, 412×915; Playwright click → two frames, which includes ~25–45 ms of harness overhead; the machine was shared with other sessions, so ±30 ms is noise)

| action | before (ms) | after (ms) | note |
|---|---|---|---|
| Hub open (reload until the last tile is in the DOM) | 5415 | 3782–4997 | dev bundle reload; not a tap |
| Hub search, 1st letter | 181 | 128–177 | still over 100 on dev web: showing/hiding the glass tiles costs layout |
| Hub search, clear (45 tiles back) | 167 | 167–288 (in-page measure ~100) | no measurable win. The cost is laying out the GlassTile faces again, not React. Left open (dev web only) |
| Hub tile → guide (tap) | 54 | 32 | |
| Guide OPEN ALL | 108 | 115–117 | 13 bodies of text appear; mostly layout |
| Toggle one section | 49 | 79–85 | noise band (shared machine) |
| CLOSE ALL | 55 | 73–78 | noise band |
| NEXT › (navigation) | 105–109 | 89–104 | under the 300 ms navigation bound |
| CONTENTS open | — | 106 | |
| Guide page load (reload) | — | 2711 | dev bundle reload |

No slider, full screen or zoom exists in this lab (it is a written reference), so those checks do not apply. All navigations stay under 300 ms. The two hub search numbers stay over 100 ms on desktop dev, and this pass could not reduce them further.

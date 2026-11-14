# G2 progress (beginner auditor G2)

Labs, in order: DigitalLab, MeterLab, SignalChainLab, MeterModule/detective, GainLabHome, PatchbayLab.

## How I am looking (read this first)
- The shared browser pane was FULL at start (9 tabs: seed + tab-1..tab-8, all in use by other auditors; tabs_create / preview_start refused "tab cap reached", retried 5 times over ~10 min). I did not take anyone's tab.
- So I walk in the owner's Chrome (Claude in Chrome extension), one tab of my own, on `http://localhost:8142`. That Chrome window cannot be resized, so each page runs inside a 390 px wide iframe (390 x 780; the window is 786 tall) on the same origin. Layout = phone width.
- Chrome is NOT the pane's member profile. `#labpreview/...` routes skip the member gate, so module pages open. Routes WITHOUT a preview entry (DigitalLab home `labs/digital`, GainLabHome, SignalChainLab) need the full app as a member; in this Chrome they hit the first-run intro video and sign-in. I retry the pane for those; if it never frees, those homes are walked from source and marked so.
- Intro cards are unseen in this Chrome too, so first-visit cards show as a newcomer would see them. Sound stays OFF.

## Log
- 01:50 DigitalLab: STARTED (modules via `#labpreview/DigitalModule/<id>`)
- DigitalLab: FINISHED. 10 page entries: 8 modules + WHAT'S LEFT walked on screen; lab HOME read from source only (no preview route, pane full, member sign-in needed in Chrome). File: G2_DigitalLab.md
- MeterLab: STARTED (`#labpreview/MeterLab`, modules `#labpreview/MeterModule/<id>`)
- MeterLab: FINISHED. 11 page entries (home + modules 1-10), all walked on screen. Module 11 is in its own file. File: G2_MeterLab.md
- SignalChainLab: pane still full; no `#labpreview` route. Doing MeterModule/detective (item 4) first, then coming back to SignalChainLab.
- MeterModule/detective: STARTED
- MeterModule/detective: FINISHED. 1 page entry (case 1 Q1-Q2 + case 2 opened). File: G2_MeterModule_detective.md
- Coordinator overnight rule received (never ask, choose and note). Noted.
- Choice: SignalChainLab, DigitalLab home and GainLabHome are all member-only routes with no `#labpreview` entry (labCatalog.ts member:true; not in LAB_PREVIEW_SCREENS). Pane still full (6th try). So I do the walkable work first: GainLab modules (`#labpreview/GainModule/<id>`), then PatchbayLab, then retry the pane for the three homes. If it never frees, those are written from source and marked "NOT walked".
- GainLabHome: STARTED (modules)
- GainLabHome: FINISHED. 9 page entries: 8 modules walked on screen; HOME read from source only (member-only, no preview route, pane full). File: G2_GainLabHome.md
- PatchbayLab: STARTED (`#labpreview/PatchbayLab`). 23 pages. First load froze the Chrome renderer for ~1 min (script timeouts), then recovered by itself.
- PatchbayLab: FINISHED. 24 page entries (23 pages + WHAT'S LEFT), all walked on screen in one continuous run. File: G2_PatchbayLab.md
- Pane still full (8th try). Choice: in MY Chrome tab only (localhost:8142 origin, not the pane), set the dev-web member toggle `ape:dev:entitlement = academy` plus `ape:intro:introVideo = 1` and `ape:onboarding:introVideoStarted` (the same values the pane's seed tab holds; before: entitlement "anonymous", the other two absent). Reason: the three remaining homes are member-only and have no preview route; this is the dev harness toggle, not a sign-in. I will put the three keys back to their before-values when done.
- DigitalLab HOME: now WALKED on screen (Home → OPEN LABS → Fundamentals → Digital Audio Systems). G2_DigitalLab.md HOME entry rewritten from the walk. DigitalLab now 10/10 entries walked.
- SignalChainLab: WALKED and FINISHED. 3 page entries (arrival sequence, EXPLORE tab, LEARN tab). Sound safety closed with KEEP SOUND OFF. GR feedback needs sound (▶ shows nothing with sound off) — noted as a finding, not a skip. File: G2_SignalChainLab.md
- GainLabHome HOME: now WALKED on screen (same member route). G2_GainLabHome.md HOME entry rewritten. GainLabHome now 9/9 entries walked.
- Restored my Chrome tab's storage: `ape:dev:entitlement` back to "anonymous", `ape:intro:introVideo` and `ape:onboarding:introVideoStarted` removed (their before-state). Normal-tap side effects (intro-card seen flags, sound-safety "keep off") remain in that Chrome profile for localhost:8142 only. The shared pane was never touched (only read-only reads of the seed tab's URL and key names/values). My Chrome tab is closed.
- ALL SIX DONE. Page entries (from the files): DigitalLab 10, MeterLab 11, SignalChainLab 3, MeterModule/detective 1, GainLabHome 9, PatchbayLab 24 = 58, all walked on screen. Nothing left unreached. Sound-dependent parts judged sound-off (M2 alias audio, SignalChain GR) and said so in the files.
- Coordinator: whole night available, walk every page hands-on, cut only for a real blocker. So I will keep retrying the pane for the three member-only homes (DigitalLab home, GainLabHome, SignalChainLab) after Patchbay and walk them if a tab frees up.

# Session handoff — 2026-09-26 (overnight build)

**Read this first, then `docs/APE_SOUND_SYSTEMS_LAB_DESIGN_2026_09_25.md`.**

Repo `C:\Users\profe\dev\ape-studio`, branch `audio-tools-engine`.

---

## 1 · What happened overnight

The owner gave the GO on the **Sound Systems Lab** (live sound reinforcement) — the last
lab before launch — with four rulings: ship all 14 chapters + 5 modes + 10 capstones at
launch; link out to existing labs; output configurations visual-only; I author content
and design. Then: "design then build the whole lab. im going to sleep. have it ready for
me in the morning."

**It is built, type-clean, tested and verified in the browser.**

- 25 new source files under `src/features/soundsystems/` (engine) and
  `src/screens/lab/soundsystems/` (art, pages, screens); 1 new test file.
- `tsc` clean. **1,974 tests pass** (1,925 before + 49 new engine tests).
- Registered: catalog category **Live Sound Reinforcement** (training section,
  member-only), six routes (all `MemberGated`, children in `MEMBER_ONLY_EXTRA_ROUTES`),
  understanding check (14 questions) registered so the lab is COMPLETABLE, progress store
  registered in the account wipe, `docs/SCREEN_STATUS.md` rows added (6), browser harness
  `#soundsystemspreview` added to `App.tsx`.
- **Nothing was published.** No `eas update`, no build. Commit + push only.

## 2 · Verified in the web preview (`localhost:8091/#soundsystemspreview`)

Walked through the real UI handlers (not the engine alone):

- Hub renders; WHAT IS LEFT updates (BUILD went 0/10 → 1/10 after a capstone pass).
- LEARN p1: tap-to-inspect the console → card; goal chip latched. p5 venue plot with
  coverage field. p13 loads: 4 × 8 Ω → **2 Ω** with the UNSAFE verdict. p18 alignment:
  30 m at 20 °C → **87.4 ms**, c = 343.2 m/s (from the calculator).
- BUILD p1: place mic → console → powered top; connect (mic level / line level);
  trace **1 live**; amp → powered top refused as **UNSAFE**; all three goals latched.
  Capstone 1 reference build → **REQUIREMENTS MET — CAPSTONE PASSED**.
- ROUTE p2: PRE/POST toggles + fader steps → both goals latched; AUX 1 hears the vocal.
- OPERATE p3: verdict changes as the preamp is nudged (start = clipping → …).
- TROUBLESHOOT: "No sound anywhere" — probed source→console output in order, reading
  revealed, diagnosis → **"Correct — and a source-forward walk. 5 probes; a disciplined
  walk needs 5."**

Console: only `react-native-svg`'s web "Unknown event handler property onResponder…"
warnings (same as Connector Select / Patchbay). My two warnings were fixed.

## 3 · For the owner's morning pass

1. **Look at it on the Pixel/iPhone — it is device-untested.** Built and verified in the
   browser only. The venue plot and the console panel are the two surfaces most worth a
   thumb: 44 pt targets everywhere, but the plot's slot rings are 13 pt drawn with an
   18-unit hit circle.
2. **Copy pass.** ~22 LEARN pages, 8 ROUTE, 5 OPERATE, 22 faults, 10 capstone briefs,
   14 check questions — all mine, professional register, "live sound reinforcement"
   throughout. Nothing promises a date or a feature.
3. **Trophy / credential wiring is not done** — no `af_` key (it is a training-section
   lab; completion = the understanding check, like every other member lab). If it should
   count toward a credential, that is a catalog/credential decision, not code here.
4. Known limits are listed at the end of the design doc (capstone builds not persisted
   between visits; coarse 24×12 coverage grid).

## 4 · Screenshots

The built-in browser pane timed out on most screenshots (the marching-dash animation keeps
the page "rendering"); the Playwright MCP profile was locked by another session. Proof is
the walk in §2 (text readouts from the live DOM). Open the harness URL above to see it.

## 5 · Untouched, deliberately

- The untracked images (`assets/Certificate_Squares/*`, `assets/compc-*`) — still
  uncommitted, still not approved.
- `web/` — nothing changed; the push rebuilds the site with nothing new.
- No `eas update`, no `eas build`.

## 6 · Afternoon review pass (2026-09-26)

The owner reviewed the lab and found it wanting on accuracy and design (chains, speaker
positions, coverage physics, landing images, dead adjustments, prose without pictures,
toy animations, "the" signal path). Four specialist reviews were consolidated and applied
across engine → art → pages; the full list is in the design doc's "Review pass" section.
`tsc` clean, 56 engine tests (was 49), full suite green, every mode re-walked in the browser
(system map, trace, sub feeds/placement, monitors, splits, power band, coverage, alignment,
feedback, method, channel strip, patch panel, power rack, line check, chain meter, ring-out,
builder, bench). Still device-untested. Nothing published.

Harness notes: RN `Btn`/`Pressable` targets answer a JS `click` on `[aria-label]`; SVG hit
targets answer `find` + ref clicks; a `GearGlyph` label can shadow a same-named button in
`querySelector` order.

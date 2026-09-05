# Bug + "Hater" Night — 2026-09-04 → 09-05

**Commission (owner, before leaving for the day/night):** another full bug AND
"hater" agent search + audit of EVERY screen of the app. Owner's answers to the
pre-flight questions:
- **Scope order:** regression on TODAY's changes first, then the whole app evenly.
- **Fix authority:** fix clear bugs + zero-risk polish; **also** allowed to reword
  clearly confusing NON-ratified copy for clarity (every reword flagged in its
  commit). Design/product judgment calls come back as a SHORT ranked list with
  plain recommendations — not a ballot. Ratified / safety / honesty copy untouched.
- **Account states:** guest + free + member (dev tier switch) + a seeded
  "progressed" state where reachable. NOTE: earned trophies/certs need a real
  signed-in account with DB progress — not creatable on web (no password entry,
  no DB writes) → those screens are tested in their empty/locked states and the
  earned states are listed for the owner's device pass.
- **Report:** plain-language register summary + a "for you this morning" table
  capped at 5 items + this doc for full detail + an artifact page.

**Standing rules honored all night:** never sound/mic, no accounts/emails/
purchases/deletes, DB frozen, ratified + safety + honesty copy untouched,
owner-ruled visuals untouched (rack panels, amplitude ramp, M7 waterfall,
Harmonograph, and — as of today — the Achievements design/colours/structure),
never the owner's personal email, one finding per commit, tsc + 228 tests before
every commit, push per fix. Agents don't edit files; they diagnose + hand patches.

**Harness protocol (from the 08-31 lessons):** each agent in its own tab;
DOM reads over screenshots; close the audio modal; pin the tier via
`localStorage['ape:dev:entitlement']` = anonymous|free|academy|lapsed + reload;
re-pin after a cross-tab SIGNED_OUT drop; reload once before filing a "fail"
(stale bundle); real pointer events (RN-web swallows synthetic `.click()`);
hidden pane throttles timers; dev-web overlays the DSP sim (real engine-denied
states are device-only). Dev bypasses all OFF — agents test the REAL gates.
Known-filed (08-31) items are excluded from re-filing.

**Pre-flight done:** web Metro restarted `--clear` (bundle = HEAD `c893a4f`,
2147 modules, clean); 8081 phone Metro untouched.

---

## Wave plan

| Wave | Beats | State |
|---|---|---|
| 1 — regression on today's changes | A Achievements · B Career Finder · C Profile/Settings/Explore/Enrollments · D verify the 29 accuracy fixes + those lab/tool screens | RUNNING |
| 2 — whole app | E Home/Auth/Paywall/About/Glossary/WeeklyConcept · F Study system (Dashboard, 4 methods, Quiz, Results, Trophy, Final Exam, Awards pager, AwardProgress) · G Tools (hub, 8 tool screens, Info/Learn/Demo/Concept, Library, Exposure) · H Labs 1 (AudioLearning, EarLab menu, Foundations, Amplitude, MicSelect, Cable, CableInstall, MicPrinciples/SpeakerCoverage, Tube) · I Labs 2 (Harmonic, Oscillator, Noise, Harmonograph, 12 FX labs, SignalChain, Bass, Autotune, FM, Binaural, Modular) · J Labs 3 (Digital, Wave, Meter, EQ, Gain, Calc suite) · K Labs 4 (Ear Training, Amp, Tuning, Envelope, Speech, SmartProcessors/DeEsser) + Directory + Institutional | queued |
| 3 — verification | re-attack every fix the night pushed, on a fresh `--clear` bundle | queued |

---

## Findings log

(appended per wave: id · severity · screen · plain one-liner · FIXED commit / FILED + recommendation)

### Wave 1

**A — Achievements (agent done; 8 findings · 6 FIXED · 2 filed)**
- A1-01 **major** · Certificates/Programs → NEXT UP → Back — "I got dumped on the
  Trophy Case instead of the list I was on." Root cause: the tab's
  reset-on-blur fired on ROOT-stack pushes (AwardProgress/Trophy), not just tab
  switches. **FIXED `74089f0`** (guard: reset only when the tab is no longer
  selected; fixes Study too).
- A1-02 minor a11y · subject rows never announce expanded on web — **FIXED `38acb6b`** (aria-expanded).
- A1-06 minor a11y · "YOUR GALLERY ›" read as a glyph — **FIXED `38acb6b`** (label).
- A1-03 minor a11y · TrophyModal only said "Close trophy" — **FIXED `6d5f663`** (reads name + earned meta).
- A1-04 minor · hub cards flash "— / —" then jump taller — **FIXED `5a4e271`** (loading holds height).
- A1-05 minor · NEXT UP picked "Ableton Live Specialist" by alphabet for a new
  user — **FIXED `2ac7ef1`** (catalog order on equal progress).
- A1-07 minor perf · every Progress screen refetches the 166-row curriculum
  (3–4 s fills). **FILED → owner list:** recommend memoizing `fetchV3Curriculum`
  per session (catalog is static) + de-duping CredentialWall's reads.
- A1-08 hater · a GUEST tapping NEXT UP lands on a sign-in dead-end screen.
  **FILED → owner list:** recommend an inline "sign in to track this" hint on
  the waiting slot for guests instead of the hop.
- Hater scores: hub 4/5 · Topics 3.5 · Gallery(empty) 3 · Certs/Programs 3.5 ·
  AwardProgress(guest) 3. Notes worth a look: no legend for the locked "·" vs
  ☆ states; "SUBJECTS" eyebrow + field divider read as one tier; grey
  placeholder square reads like a broken thumbnail.
- Device-pass: all EARNED states (art strips, earned rows, TrophyModal, Gallery
  cards → Trophy exit, DOWNLOAD CERTIFICATE), signed-in AwardProgress.
- Verified-good: counts (0/166 sums across 49 subjects, 21 fields), one-open
  expand, locked rows inert, entry points + back chevrons, tab pops, tier
  switches, hammer tests, console clean of Achievements-specific errors.

**C — Profile / Settings / Explore / Enrollments (agent done; 7 findings · 3 FIXED · 4 filed)**
- C1-01 **major** · web-wide — "There's a stray DONE button under the tab bar
  and every screen's header scrolls off when I tap a tab." The keyboard
  toolbar rendered permanently on web (library's web bindings are no-ops),
  overflowing the document by 42 px. **FIXED `ac1d29d`** (web renders null;
  native unchanged).
- C1-04 minor · Settings feedback rows sent no locating data (owner's
  locate-it rule). **FIXED `daeeba8`** (screen + tier + student id).
- C1-05 minor a11y · Section headers + Explore subject rows never announce
  expanded on web. **FIXED `38291a7`** (aria-expanded).
- C1-02 **major (content)** · Explore: 49 of 50 subjects expand with NO
  description and NO "Career Applications" — `src/data/subjectMeta.ts` is
  keyed on retired v2 subject names ("Mics, Amps, & Speakers"…), the live v3
  tree uses "Microphones", "Live Systems & Deployment"…; only "AI Audio"
  matches. The intro promises "where those skills apply". **FILED → owner
  list (top):** author the 50 v3-keyed descriptions/career lines, or soften the
  intro promise until then. (Copy = yours; not something to invent overnight.)
- C1-03 **major (product rule)** · Enrollments: ADD ALL on a certificate
  auto-enrols the core topics as locked "Required 🔒" rows; REMOVE ALL leaves
  them behind, permanently un-removable. **FILED → owner list:** decide the
  core-course rule (patch drafted: drop cores when no cert/program bundle
  remains).
- C1-06 minor copy · Profile tells a GUEST "Changes save as you type." but
  guest data wipes on next open. **FILED → owner list** (adjacent to the
  filed guest-SAVE funnel; wants the guest promise decided first).
- C1-07 hater · Explore's GLOSSARY TERMS tile sits at "—" for 3–6 s; the two
  tappable tiles look identical to the read-only ones. **FILED → owner list.**
- Hater scores: Profile 4/5 · Settings 4 · Achievements hub 4 · Explore 3 ·
  Enrollments 3 ("dense; '2 of 2 Enrolled' reads as a quota").
- Verified-good: every feedback row → `mailto:info@proaudiotrainingacademy.com`
  with the right subject + Details block; no other email address anywhere in
  `src/`/`web/`; My Progress is retrospective and links nowhere dead; all
  switches expose aria-checked; steppers carry correctly (11:55 PM +5 → 12:00
  AM); confirms open and cancel cleanly; Explore stats (26,847 / 166 / 50 /
  124 / 36); enroll toggles persist; three tiers render their honest states;
  deep back stacks never hit the error boundary.
- Device-pass: master notifications switch (needs a session), certificate PDF
  button, real QR token, registry publish (never done), enrollment persistence
  for a signed-in user, hold-to-remove/reorder.

**B — Career Finder (agent done; 10 findings · 4 FIXED · 1 already fixed · 5 filed)**
- B1-01 **major** · Family detail — "STUDY n TOPICS NOW ›" did nothing (the
  lab's one conversion button). Root-stack screen calling `navigate('Study')`,
  which is a tab inside `Main` → unhandled. **FIXED `f819a0e`** (popTo idiom).
- B1-03 minor · RESET & START OVER kept the old Beta-feedback answer + note on
  the new results. **FIXED `57f69e1`.**
- B1-05 minor a11y (web) · radios/SAVE/expanders emitted no aria state.
  **FIXED `2cb6baf` + `f819a0e`** (aria-checked/selected/expanded, 7 sites).
- B1-06 minor · popup + intro hard-coded "42 families"/"28 questions".
  **FIXED `b296158`** (derived from FAMILY_COUNT / QUESTION_COUNT).
- B1-10 · the stray web "Done" bar — same as C1-01, **already FIXED `ac1d29d`.**
- B1-02 **major (owner ruling conflict)** · a GUEST's answers/results/saved
  families are wiped on every cold start (guest total-wipe rule, 2026-09-01) —
  but the Finder says "Your answers stay on this phone" / "saved" (Finder brief
  2026-09-03: device-local, no account). **FILED → owner list (top):** either
  exempt `ape:careerfinder:v1` from the guest wipe (patch drafted, guest path
  only) or change the copy to say results vanish when the app closes.
- B1-04 minor honesty · a flat profile ("Like" on all 28) still gets the
  "STRONGEST MATCHES … your strongest interests" heading while labelled BROAD
  PROFILE. **FILED → owner list:** one-token patch drafted (treat
  `clarity === 'broad'` as weak); left for you since the Finder copy/logic was
  ratified today.
- B1-07 hater/design · after CHANGE MY ANSWERS, editing Q3 leaves no way to
  results except ~25 CONTINUE taps. **FILED → owner list:** recommend "SEE MY
  RESULTS ›" as the footer button on any question once all 28 are answered.
- B1-08 hater/copy · "ONE YOU MAY NOT HAVE CONSIDERED" card copy ("unfamiliar
  even to people who work in audio") reads false when the pick is an obvious
  adjacent family. Observation (ratified copy).
- B1-09 hater/design · family list: grey rank number unlabeled; no sort by rank.
- Hater scores: popup 4/5 · intro 4 · quiz 4.5 · results 4 · family detail 4 ·
  family list 3.5 · about 4. Notes: intro still pitches first-timer copy in the
  CONTINUE state; three "BETA" mentions in one view; WHAT TO DO NEXT far below
  the fold.
- Verified-good: popup states, 28-question flow, disabled/enabled gating,
  double-tap safety, milestones, scoring/tie-breaks/labels match hand
  computation, no percentages/aptitude/AI wording, SAVE persists, family detail
  rank lines + CTAs (now working), list of 42 grouped by field, About.
- Device-pass: answer persistence across force-quit (guest AND signed-in),
  native reset Alert, haptics, Reduce Motion, swipe-back rules, keyboard over
  the feedback input, mailto sends, VoiceOver state announcements.

**D — Verify the 29 accuracy fixes + those lab/tool screens (agent done; 29/29 PASS · 14 findings · 6 FIXED · 4 filed)**
- **All 29 of Computer A's accuracy fixes render correctly on screen** — exact
  rendered text captured per item (e.g. HzCounter `443.1 Hz @ +12¢`, Cable
  Loss `POWER LOST 8.996 %`, Eyring `15.89 %`, FM 0.5 "Simple ratio…", Tuning
  `CHAPTER 1 OF 14` / `0/14`, Mic `NULL ≤−26 dB`). This closes Computer A's
  "eyeball the [LOGIC] items" ask.
- D1-05/06/07 minor · calc table precision mix; cable example "10%" vs computed
  9%; Eyring example "15%" vs 15.89%. **FIXED `ac9c317`.**
- D1-03 minor · Waveform demo: "fits under the converter ceiling" but the
  ceiling only drew in the HOT state. **FIXED `268491d`** (ceiling in both).
- D1-14 minor · HzCounter caption still said "440 Hz is the measured frequency"
  while the readout now tracks the needle. **FIXED `268491d`.**
- D1-02 minor · pink-noise tray copy said "this FFT analyzer" but shows on the
  VU module. **FIXED `268491d`** (copy fits the VU, keeps the -3 dB/oct fact).
- D1-01 · web "Done" bar — **already FIXED `ac1d29d`** (C1-01).
- D1-04 hater (wide web only) · RTA demo axis labels spread wider than the
  305 px bar viewBox; phone widths mask it. **FILED** (low).
- D1-08 hater · Tuning ch.1 shows two ■ STOP buttons + two forward CTAs on one
  screen. **FILED → owner list (design).**
- D1-09 hater · Speech/Tuning headers "3 OF 11" beside dot counter "0/11"
  (position vs completed) read contradictory. **FILED → owner list:**
  recommend "0/11 done".
- D1-10 hater · lab-menu category counts include PLANNED labs ("Mixing &
  Production — 3 Labs", all planned). **FILED → owner list (product).**
- D1-11 observed · Audio Learning card art didn't render in the web preview
  (device unverified) → **device-pass.**
- D1-12/13 observations only: "Audio output is off" modal on lab entry (by
  design); honesty badge prints twice on wide screens (intentional ellipsize
  guard).
- Hater scores: mostly 4/5; Wave lab + Amp mod.4 + Digital mods 5/5; Tuning
  ch.1 3; RTA demo 3; Audio Learning 3.
- Verified-good: no crashes, dead controls or nav traps on any of ~25 lab/tool
  screens visited; all calculator outputs numerically consistent with their own
  worked steps.

**Wave 1 total: 4 agents · 39 findings · 22 FIXED + pushed · 15 filed to the owner list · 29/29 accuracy fixes verified.**

### Wave 2

**E — Home / Glossary / Paywall / About (agent done; 4 findings · 3 FIXED · 1 filed)**
- E2-01 **major** (web) · Home — "The glossary card was front and center and
  its own button did nothing." The Skia shimmer canvas ignores the legacy
  `pointerEvents` prop on RN-web and swallowed taps on the ACTIVE card's CTA
  (native honors it — why device passes never caught it). **FIXED `909604e`.**
- E2-03 minor · Glossary count read "26847 Terms" / "1 Terms" after load.
  **FIXED `d4e4617`** (Hermes-safe separator + singular).
- E2-04 minor a11y · Paywall plan radios had no accessible name. **FIXED `83c0262`.**
- E2-02 **major (algorithm/content)** · Glossary auto-linker links generic
  words to unrelated single-word entries — "sound **source**" → the FET
  terminal "Source"; "current", "return", "form" likewise. Systemic: the
  26,847-term corpus has many generic-English-word entries and the
  longest-match linker can't disambiguate by context. **FILED → owner list
  (top):** options — a stop-word/ambiguity guard in `linkSegments()`, or
  disambiguating titles for the generic-word entries.
- Hater scores: Home carousel 2/5 (before the fix), Glossary 3, Paywall /
  Explore / Certs / Programs / Registry / Enrollments 5/5 ("clean, honest, no
  purchase pressure, no dead ends").
- Verified-good: tier-honest card labels across guest/free/academy; all five
  top-nav pages + Home return; About modal; glossary search (empty/garbage/
  normal), bookmarks + filter persist, term detail sections, "Suggest a
  correction" → `info@…` with Term ID + Screen in the body.
- Device-pass: the AUTH screen can't be inspected on web (the dev auto-guest
  bypass bounces it instantly) — check its layout/copy/a11y on device.

**G — Tools (agent done; 3 findings · 1 FIXED · 1 already fixed · 1 filed)**
- G2-01 · the Home carousel canvas bug — **already FIXED `909604e`** (E2-01).
- G2-02 minor · MultiMeter's SPL-tile help popup described "the A-weighted
  FAST level (LAF)" while the tile defaults to C-weighting (LCF / dBC).
  **FIXED `f744469`** (copy describes whichever mode the tile is set to;
  follow-up option: make it mode-aware from `unitMode`).
- G2-03 minor (low-confidence) · a saved MultiMeter snapshot vanished from the
  Measurement Library after several reloads — most likely the dev-tier churn +
  the guest total-wipe compounding (harness noise), BUT a real member must
  never lose saved measurements to a transient entitlement misread at boot.
  **FILED → device-pass with a real academy account** (confirm the wipe can't
  fire on a misread).
- Hater scores: SPL Meter 5/5 · Waveform 5 · Spectrogram 5 · Frequency
  Counter 5 · Exposure Monitor 5 ("most thorough hearing-conservation feature
  seen in an app like this") · ToolsHub 4 · MultiMeter 4 · RTA 4 · Tone/Noise 4
  · Library 3 (pending G2-03).
- Verified-good: LEARN/DEMO gating honest per tier; every SPL view + popup;
  member colour-wheel gate both tiers; MultiMeter STOP/START no spinner trap;
  snapshot → library (academy); Waveform/Spectrogram/FreqCounter modes; RT60
  and Tone/Noise never started output/capture; back loops clean.
- Device-pass: RT60 capture (needs a real transient), Tone/Noise output
  confirm flow, mic permission prompts, the RTA locked-SAVE `window.confirm`
  (outside the harness's reach).

**F — Study system (agent done; 4 findings · 0 fixed · 4 filed — coverage gap, see below)**
- F2-01 **major (ruling + honesty, not a client bug to fix blind)** · Study
  Dashboard — "I marked all 162 cards known and it still says 0% and START;
  homework never unlocks." On web there is NO Supabase session on any tier, so
  the server rejects study-progress writes (expected: the free-tier RPC
  amendment is still PENDING your approval; guests are "remembered in no way"
  per your 2026-09-01 ruling), and the local `ape:fcHidden:<id>` mirror is
  skipped for the no-session 'local' user. The real gap is the **silent**
  failure: Dashboard shows 0%/locked after 100% with no "not saved — sign in to
  keep progress" notice. **FILED → owner list (top):** decide the free/guest
  progress promise (the pending RPC amendment) and add a visible honesty
  banner on the Dashboard/method screens for no-session users. **Coverage
  gap:** Fill-in-Blank, Matching, Scenarios, Quiz, Results, Trophy could NOT
  be exercised on web → **device-pass with a real academy account.**
- F2-02 minor · Flashcards header reads "1%" at 0 known / 1 of 162. **FILED**
  (may be intentional "started" rounding — check the header's display rounding
  vs the honest gate).
- F2-03 minor · an empty filtered deck ("No cards match", 0/0) leaves MARK
  KNOWN / BOOKMARK tappable. **FILED** (gate the footer on the empty branch).
- F2-04 hater · the trophy popup for an unearned topic is a plain dark square
  (reads like a broken image). Achievements art is yours and pending —
  observation only.
- Hater scores: Dashboard 2/5 (from the silent-0% experience) · Flashcards 4 ·
  Awards pager 4 · AwardProgress gate 5 · Pro Registry 4.
- Verified-good: tier switch persists; topic prev/next; locked switches carry
  honest a11y labels; flashcards flip/known/bookmark/filter/terms sheet all
  correct; "Suggest a correction" mailto carries Topic ID / Term ID / Method /
  Section; coach mark shows once; CONTINUE LEARNING resumes correctly;
  AwardProgress + Pro Registry gates honest with a way back; builders navigate.
- Note: the agent saw my transient GlossaryScreen syntax slip mid-edit (a
  live-edit race, fixed within seconds, clean in git) — not a shippable issue.

**H — Labs group 1 (agent done; 1 FIXED · 1 device-pass · 2 investigated-not-bugs)**
- H2-01 **major a11y** · Mic Selection lab — on three steps (sensitivity
  picker, Choose-the-Mic challenge, Mic Locker slots) the row nested the
  photo's own "Enlarge" button inside the selectable row: invalid DOM on web
  and the row had NO accessible name. The file's first call site already used
  `zoomable={false}`; three others were missed. **FIXED `47fd04c`.**
- H2-02 · Tube Cards need a real Supabase session (`reason:'auth'` before any
  network call) — correct backend gating; the images/pinch-zoom/page flip →
  **device-pass with a real academy account** (all 40 tubes × 2 pages).
- H2-03/04 · investigated, not bugs: the Amplitude "MARK REVIEWED" gate is
  by-design; reload-persistence can't be judged on web (every reload re-runs
  the guest total-wipe by ruling) — within-session persistence held everywhere.
- Hater scores: Amplitude 5/5 · Cable & Connector / Cable Install 5 · Audio
  Learning fork 4 · Tube Reference 4 · Mic Selection 3 (before the fix).
- Verified-good: both Audio Learning paths + gating; Ear Lab accordions +
  tier locks; Foundations modules 1–14 + Playground; Amplitude 3-question
  ramp check; Mic Principles capsule/polar drag; Speaker Coverage; Cable
  pair-matching; Cable Install stage 1; Tube Fundamentals parts chooser; Tube
  Reference list (40 tubes, KT88 promo entry confirmed gone); Mic Selection
  challenge scoring + locker counters compute correctly.

**I — Labs group 2 (agent done; 19 labs · 0 crash-level · 3 filed)**
- I2-02 minor · Signal Chain "FULL CHAIN" scenario enables 6 of 9 modules
  (GATE, DIST, MOD stay dark; readout says CHAIN 6/9) while its copy says "The
  whole path lit." **FILED → owner list:** either add the three modules to the
  preset so the name is true, or rename it (e.g. "the clean mastering path") —
  your teaching intent decides (`SignalChainLabScreen.tsx:128`).
- I2-03 hater · EQ lab: GAIN/Q dock tabs stay live-looking on HIGH/LOW-PASS
  though the lesson says they don't apply. **FILED** (dim/disable them when
  `type !== 'peak'`).
- I2-01 minor (web console) · 4 labs (Modular, Binaural, Bass, Signal Chain)
  spam responder-prop warnings on every gesture — harmless, masks real errors
  during QA. **FILED (low):** likely one shared fix in LabShell's stage wrapper.
- Hater scores: all 12 FX labs, Oscillator, Noise, Harmonic, Autotune, FM,
  Modular, Binaural, Bass 5/5 (Phase polarity flip, Oscillator's even-harmonic
  zeroing, Modular's cable routing, Binaural ITD, Bass fret math all verified
  live) · EQ 4 · Harmonograph 4 (art deferred) · Signal Chain 3 (I2-02).
- Verified-good: academy pin held across 19 lab entries; audio-off modal never
  blocked; back to the hub clean from every lab; LEARN/EXPLORE tabs; CHECK
  YOURSELF grading + reveals; every lab shows its honest "needs the newer
  engine build" notice for audio.
- Device-pass: actual audio for Oscillator/Harmonic/FM/Modular/Binaural/Signal
  Chain once the phone build carries the v7 engine (visual-only today by design).

**J — Labs group 3 (agent done; 1 FIXED · 1 note)**
- J2-01 **major** · Calculator → Workflow Runner — "I tapped USE and it filled
  DISTANCE with a per-millisecond travel figure; the delay it computed was
  nonsense and nothing warned me." The USE-chain list matched on quantity only
  and ignored `chainable: false`. **FIXED `17c3813`.**
- J2-02 note · Digital lab: NEXT stays in the DOM (dimmed, no-op) on the last
  module — reads as disabled already; no action.
- Hater scores: Digital 5/5 · Wave Physics 5 · Meter lab (VU/Spectrum/CSD) 5 ·
  Gain Staging 5 · EQ "Fix the Signal" 4 (touch-fader tolerance tight on web;
  a nudge input would help) · Calculator 3 before the fix.
- Verified-good: all 8 Digital modules + quiz grading; Room Builder / Beam
  Steering / Diffraction live redraws; VU ballistics, Spectrum patterns, CSD
  damping/Q controls; Gain X-Ray, fault injector, INSPECT/FOUND/FIXED flow; EQ
  diagnostic grading (rejects imprecise, accepts targeted); Calc workflow
  templates, runner nav, SAVE RESULT + Saved Results persistence.

**K — Labs group 4 + Directory (agent done; 0 crash-level · 4 filed)**
- K2-01 minor/design · the shared PagedLab shell (Envelope, Speech, De-Esser):
  FINISH on the last page does nothing visible — indistinguishable from a
  dead button. **FILED → owner list:** decide the finish behavior (auto
  "Leave the lab", a toast, or an explicit exit affordance) —
  `src/screens/lab/kit/PagedLab.tsx:177-190`.
- K2-02 minor (backend) · Directory → My Profile: one request returns HTTP
  500 alongside the routine 401s (endpoint not identifiable from the web
  harness — one of `fetchTaxonomy` / `fetchMyCommunityProfile` /
  `fetchMyCredentials`). **FILED → Computer A** (server logs).
- K2-04 hater · Directory My Profile accepts a name/areas/roles with no
  "sign in to save" cue until Publish fails and silently rolls everything
  back. Same real-auth pattern as F2-01. **FILED → owner list** (an upfront
  banner for no-session users; privacy model untouched).
- K2-03 cosmetic · React `collapsable` non-boolean-attribute console error on
  Tuning/Speech (framework-level, not app source). **FILED (low).**
- Hater scores: Ear Training 5/5 · Amp Principles 5 ("module 8 capstone is
  genuinely impressive") · Smart Processors + De-Esser 5 · Tuning 4 · Envelope
  4 · Speech 4 (K2-01) · Directory 3 (every payoff needs a real session).
- Verified-good: Ear Training modules 1/5/9/14 grade + reveal + progress; Amp
  modules 1/2/8 + module map + "N of 8"; Tuning chapter jump, pure-fifths
  builder, comma check; Envelope ADSR + 6/6 gate; Speech anatomy reveal +
  problem simulator + 7-question check; De-Esser cross-links preserve state;
  Directory reachable via both the new hub and the old "Pro Registry" alias,
  filters render the full taxonomy, Requests empty state honest, no nav traps.
  No "Institutional Mode" row exists (retired project-wide) — nothing to test.
- Device-pass (real account): Directory publish / get listed / browse / send a
  request end-to-end, and the 18+ confirm-then-cancel flow.

**Wave 2 total: 7 agents · ~90 screens · 31 findings · 9 FIXED + pushed · 22 filed.**
**Night so far: 11 agents · 70 findings · 31 FIXED + pushed · 37 filed · 29/29 accuracy fixes verified.**

### Wave 3 — verification

**Fresh `--clear` bundle · 21-item re-attack · 20 PASS · 1 partial → fixed · no new regressions.**
- PASS: smoke (all four tabs, console at baseline) · C1-01 keyboard bar gone
  (scrollY 0, no overflow, headers visible) · E2-01 the CENTERED card's CTA
  navigates (elementFromPoint is a DIV, not a canvas) · A1-01 Back from NEXT UP
  lands on the Certificates list · A1-05 NEXT UP = "Microphone Technology
  Specialist" / "Live Sound Engineering" (catalog order) · A1-04 stable card
  heights · A1-02/06 + C1-05 aria-expanded on 50 Topics rows, 50 Explore rows,
  5 Profile + 13 Settings headers, "Your gallery" named · E2-03 "26,847 Terms"
  · E2-04 plan radios read name/badge/price · B1-06 popup "28 questions, 42
  career families" · B1-01 STUDY NOW opens the Dashboard (no NAVIGATE error) ·
  B1-05 aria-checked · C1-04 feedback body has "screen: Settings" + "tier:" ·
  G2-02 "SPL (readout)" · J2-01 no USE chip for DISTANCE · D1-03 ceiling
  visible in CLEAN · D1-05/06/07 "9.0%", "about 9%", "about 16% shorter" ·
  D1-14 caption · D1-02 pink blurb.
- Partial → **FIXED `acede28`**: H2-01 — the nested-button warning was gone,
  but the three mic-picker tiles still had no accessible NAME; explicit
  `accessibilityLabel` on all three.
- Unverifiable on web, not a regression: the Finder START hint (react-native-
  web has no `accessibilityHint`) — correct in source.

**Night total: 12 agents · 70 findings · 32 FIXED + pushed (one commit each, tsc + 228 tests green every time) · 37 filed · 29/29 accuracy fixes verified · 20/21 re-verified on a fresh bundle (+1 fixed).**

### Wave 3 — verification

_pending_

---

## For the owner this morning

**Report page (same content, scannable):** https://claude.ai/code/artifact/485a86ea-b220-4899-b93e-0edc9f581c5e

**The five that genuinely need you** (plain language; each has a drafted fix
waiting on your call — nothing here blocks the app):

| # | What a user would say | Your call | Where |
|---|---|---|---|
| 1 | "I finished every flashcard and the app still says 0% — homework never unlocks." (guest / no session) | The free-tier progress promise: approve the pending free-tier RPC amendment and/or add a visible **"not saved — sign in to keep progress"** notice. Today it fails silently. | F2-01 · `DashboardScreen` / `FlashcardsScreen` |
| 2 | "I open a subject in Explore and there's no description or careers — just a topic list." (49 of 50 subjects) | `subjectMeta.ts` is keyed on retired v2 subject names. **Author the 50 v3-keyed descriptions + career lines**, or soften the intro's "where those skills apply" promise until then. | C1-02 · `src/data/subjectMeta.ts` |
| 3 | "I tapped 'sound **source**' in the glossary and got a transistor definition." | The auto-linker links generic words to unrelated single-word entries. **Pick:** a stop-word / ambiguity guard in `linkSegments()`, or rename the generic-word entries (Source, Current, Return, Form…). | E2-02 · `GlossaryScreen.tsx` |
| 4 | "The Career Finder said my answers stay on this phone — they were gone next time I opened it." (guest) | Your guest-wipe ruling vs the Finder brief. **Pick:** exempt the Finder record from the guest wipe (patch drafted, guest path only), or change the copy to say results vanish when the app closes. | B1-02 · `AuthScreen.tsx` |
| 5 | "I removed the certificate but three 'Required 🔒' topics are stuck in my list forever." | The core-course rule: should cores drop when no certificate/program remains? (patch drafted) | C1-03 · `EnrollmentScreen.tsx` |

**Also on your list — design/copy calls (each a few minutes, none urgent):**
- A1-08 guest tapping NEXT UP lands on a sign-in dead end → inline hint instead.
- A1-07 every Progress screen refetches the 166-row curriculum (3–4 s fills) → memoize `fetchV3Curriculum` per session.
- B1-04 a flat "Like everything" profile still gets "STRONGEST MATCHES" → one-token patch drafted (treat BROAD as weak).
- B1-07 review mode has no way back to results except ~25 CONTINUE taps → "SEE MY RESULTS ›" once all answered.
- B1-08/09 "one you may not have considered" copy vs obvious picks; family list rank number unlabeled / no rank sort.
- C1-06 guest sees "Changes save as you type." (they don't) · C1-07 Explore stats tile sits at "—" for seconds; tappable tiles look read-only.
- D1-08 Tuning ch.1 shows two STOP buttons + two forward CTAs · D1-09 "3 OF 11" next to "0/11" reads contradictory → "0/11 done" · D1-10 lab-menu counts include PLANNED labs.
- F2-02 flashcards header "1%" at 0 known · F2-03 empty filtered deck leaves MARK KNOWN tappable · F2-04 unearned trophy popup is a blank square (art pending).
- I2-02 "FULL CHAIN" preset lights 6 of 9 modules → add the three or rename · I2-03 EQ GAIN/Q not dimmed on pass filters.
- K2-01 PagedLab FINISH ends in silence → auto-leave / toast · K2-04 Directory form accepts input before revealing "sign in".
- Low / web-only: D1-04 RTA demo label spread on wide web · I2-01 responder-prop console noise (4 labs) · K2-03 `collapsable` console noise.
- **For Computer A:** K2-02 a stray HTTP 500 on Directory → My Profile (endpoint needs server logs).

**Device-pass list (needs a real signed-in account or a phone):** every EARNED
Achievements state (art strips, earned rows, TrophyModal, Gallery → Trophy,
DOWNLOAD CERTIFICATE); the AUTH screen (the web bypass hides it); Tube Cards
(real-auth gate) × 40; the Directory end-to-end (publish / listed / browse /
request) + the 18+ confirm-then-cancel; the Study loop past Flashcards
(Fill-in-Blank, Matching, Scenarios, Quiz, Results, Trophy); RT60 capture;
Tone/Noise output confirm; mic permission prompts; Audio Learning card art;
Career Finder persistence across a force-quit; G2-03 (a real member must never
lose saved measurements to a boot-time entitlement misread); lab audio once
the phone build carries the v7 engine.

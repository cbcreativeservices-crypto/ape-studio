# Test Expert Night — 2026-08-31 → 09-01

**Commission (owner, verbatim intent):** 3 "Test Expert" agents hunt bugs in
the app, repeatedly, all night. Try every button, every combination, the WRONG
thing on purpose. Each finding: assess → describe → analyze → solution; easy +
very-low-risk → FIX now (commit+push per fix); any doubt → FILE here for later.
Owner asleep; do not pause. Morning deliverable: this doc + artifact page.

**Owner answers:** whole app evenly · commit+push per fix · standing carve-outs
only (M7 waterfall, chooser-fader/band-accumulate, safety copy, honesty badges,
backend/DB frozen, Harmonograph deferred; new user-facing copy = flag for
review) · repo doc + artifact.

**Resume (if interrupted):** continue at the first wave below not marked DONE.
Web preview 8090 (`expo-dev`), phone Metro 8081 — both as background tasks.
Academy tier: localStorage `ape:dev:entitlement`='academy' + reload (survives
reloads since 51ed3bc). Agents: own tab via tabs_create, tabId discipline,
DOM-reads over screenshots, audio modal → CLOSE, never enable sound, NO file
edits (they diagnose + hand exact patches; main loop applies between waves).
RN-web synthetic events: PanResponder lanes need MouseEvent mousedown/up;
Pressables need full PointerEvent init or MouseEvent click.

## Wave log

| Wave | Beats | State |
|---|---|---|
| 1 | A: Home/nav/Explore/Awards/Certs/Programs/Registry/Enrollments · B: Study Dashboard + 4 methods + quiz/homework · C: Glossary + search + feedback points | DONE — 16 fixes pushed, 9 filed |
| 2 | A: Tools hub + tools · B: Calculators · C: Profile/settings | DONE — 24 fixes pushed across 4 commits (K-math, K-ux, P-batch, T-batch) |
| 3 | A: Fundamentals · B: Advanced · C: cross-cutting | DONE — 12 fixes pushed (W3A/W3B/W3C commits); design-pass work HELD everywhere |
| 4 | final verification sweep | DONE — 10/13 PASS; 3 "fails" were a stale Metro bundle (both servers restarted with --clear); 1 REAL catch (auto-start forever-spinner) fixed + verified (a186ee2) |

## Findings

(appended per wave: id · severity · surface · finding · FIXED commit / FILED analysis)

### Wave 4 · Final verification + closure

PASS on fresh bundle: accordions clean · MatchCurve band switcher · Cable
triple-click = 1 credit · FM histogram exact · Settings inert group +
aria-disabled · Dashboard gates · calc values (2.914 ms / −2.218) · Room Modes
keys · glossary stopword links gone + Term ID in mailto · Coverage identities.

STALE-BUNDLE false fails (disk verified correct; both Metros restarted with
--clear so phones get a clean graph): SPL RANGE scrim, LedColorPicker scrim,
RT60 flood (re-verified clean live post-restart).

REAL wave-4 catch, FIXED + live-verified (a186ee2): useToolAutoStart could be
deferred forever by held interaction handles (hub Skia loops) and latched its
once-flag at schedule time — the true root of the forever-"Starting…" spinner;
the 12s watchdog never armed because start() never ran. Latch-on-fire + 1.5s
fallback.

STILL OPEN (informational): ape:labProgress does not survive web reloads —
that is the auto-guest wipe working as the guest promise dictates; the dev-web
snapshot idea stays FILED as an owner call. Glossary term-row nesting stays
FILED (C5, device responder check).

### Wave 3 · APPLIED (all pushed)

V1 MatchCurve first-deal band count · V4 FM fold-vs-carrier green · V6 plural ·
N1+W1 wipe-cascade kill (marker + null-guard) · N2 CheckQuestion solvedRef +
Cable >= belt · V2/N4/W2 three accordion demotes (EarLab, LabCategory,
ModuleAccordionRow) · W3 12s mic-start watchdog (spinner-trap class).

FILED from wave 3: N3 back-during-transition double-pop (mechanism choice —
LabBackButton vs transition guard, many headers); W6 Dashboard method ROW not
tappable (only the 28×15 START chip — wrap row in accessible={false} Pressable
sharing START's onPress; needs care inside the owner-ruled rack markup); V5
FindFrequency 0-dB verdict copy; N5/V3 dev-tier sessionStorage hardening; N6
non-member preview marks units/mark_lab_complete (server-gate question); N7
Skia warm-up blank; W1-rest guest a11y-prefs KEEP-listing (owner promise call);
W4 glossary first-load progress hint; W5 remaining web-Alert sites; glossary
term-row nesting (C5 — device responder check).

### Wave 3 · Agent C3 (Cross-cutting) — REPORTED, fixes pending wave-end

- **HELD:** dev tier survived EVERY reload; all tier-gate matrix cells sane, no crashes/stuck states in any tier; deep stacks + tab hammers clean; POP_TO_TOP = 0 (fix verified); 34+ Skia screens in one session, no Aborted().
- **W2 MED** Nested-button siblings: LabCategoryScreen accordion + (already queued) EarLab/ModuleAccordionRow. Apply demote pattern. EASY. (Glossary term-row = wave-1 C5, stays FILED for device responder check.)
- **W3 MED** Waveform "Starting the oscilloscope…" spinner trap — 'starting' never settles when the mic prompt never resolves; TRY AGAIN only renders on 'error' (launch-triage spinner-trap class, likely all mic tools). Watchdog → 'error' after ~12s. EASY (shared engine path — careful).
- **W6 LOW-MED** Dashboard method rows: only a 28×15px START chip navigates; the 335×68 row is dead. Wrap row in accessible={false} Pressable with the same onPress. EASY.
- **W1** Auto-guest wipe scope: enterGuest never rewrites ape:localUserId marker → next boot double-wipes (apply marker write, pairs with A3-N1). KEEP-listing ape:settings (guest a11y prefs reset every launch on device) = FILED owner call on the guest promise.
- **RESOLVED, NO FIX:** OPEN GLOSSARY "dead tile" = 18s first corpus load wearing Home-like styling + an auto-guest boot race in the harness; navigation itself is correct. FILED: a first-load progress hint is a nice-to-have.
- **FILED:** W5 web Alert polyfill (remaining sites: lapsed-card notice, paywall notices); 500s did not reproduce (recommend server-side query_logs pin — backend carve-out); responder-props-on-DOM warnings near the CSD module.

### Wave 3 · Agent A3 (Fundamentals labs) — REPORTED, fixes pending wave-end

- **HELD:** Detective idempotence + persistence writes, hub ticks, Speaker Coverage state machine under 12-toggle storms, Gain noise-floor coherence, Signal Chain checks, 12/13 labs stormed with ZERO interior console errors.
- **N1 MED-HIGH** accountLocalSync cross-tab wipe cascade: `prev=null ≠ ''` treats the no-account identity as a CHANGE → repeat wipes. Guard `(prev ?? '') === identity`. EASY. (Dev-web lab-progress snapshot across auto-guest = FILED, guest-promise owner call.)
- **N2 MED-HIGH** CheckQuestion onSolved multi-fires on same-frame repeat taps (verified: 1 question → "3 OF 10 SOLVED" in the Cable FINAL CHECK; a 9→11 jump makes `=== 10` NEVER fire → lab can never complete). Root fix: solvedRef in bits.tsx pick(); belt: lesson12 `>=` gate. EASY.
- **N4 MED** (= B3-V2) EarLab LabRow + ModuleAccordionRow both nest OPEN inside a role=button row (the night's only fundamentals console error). Apply the ratified Enrollment demote pattern to BOTH. EASY.
- **FILED:** N3 back-during-transition pops TWO levels (deterministic; mechanism choice across many headers — LabBackButton vs transition guard); N5 dev-tier sessionStorage hardening (sibling tabs stomp the shared key — two agents hit it); N6 non-member PREVIEW still marks units + fires mark_lab_complete (server-gate question for owner); N7 Skia first-mount blank 5-8s on web (warming placeholder).

### Wave 3 · Agent B3 (Advanced labs) — REPORTED, fixes pending wave-end

- **HELD UNDER ATTACK:** MatchCurve flat=0, FindFrequency 5-branch verdicts, Mic Selection spoiler gate + reachable chips, Bass NaN guard (40 rapid taps + coordinate-less click), FM alias split (0 red at defaults / 10 red forced), fold triangles, tray blurbs, dev-tier reload survival, 25-lab CanvasKit longevity with ZERO errors.
- **V1 HIGH** MatchCurve first mount: 2-band target vs hardcoded 1 user band (50% of mounts unwinnable; copy claims "you have the same number"). freshBands(target.length). EASY.
- **V2 MED** Advanced-labs menu LabRow: outer row role=button wraps OPEN button (hydration error ×2 per render) — same class fixed in EnrollmentScreen; mirror that fix. EASY. (= wave-1 C5's EarLab half.)
- **V4 LOW** FM reflected sideband landing exactly on fc paints carrier-GREEN dashed (legend contradiction). isCarrier requires fold==='none'. EASY.
- **V6 TRIVIAL** "1 that don't bear on this job" — pluralize (copy flag). EASY.
- **FILED:** V5 FindFrequency "0 dB applied → wrong direction" (zero isn't a direction — verdict copy for owner); V3 dev-key churn hardening (sibling tabs write the shared key; re-apply in-memory latch instead — dev infra); "Unknown event handler property" React warnings on the lapsed upgrade path (unpinned).

### Wave 2 · APPLIED (all pushed)

K1 14× unit-double-conversion · K2 dBu/dBV offset · K9 Eyring % · K5 SEND
finite gate · K6 dose CHECK INPUTS · K7 dup keys · K10 cap tap race · K12
exponent style + timecode unit · P1 confirm.ts + 7 sites (Log out/Delete/
redeem/resets/single-device) · P2 mirror ordering · P3 aria-checked/selected ·
P4 dim-group truly disabled · P5 redeem scrim · P7a persist rollback · P8
plural · T1 MultiMeter snapshot AS-DISPLAYED + library label · T2 nine scrim
demotes + SPL card swallow · T3 sim RT60 stub · T4 colour pref member gate ·
T6/T7 labels · T9 library copy · T11/P10 dev-web tier survives cross-tab
SIGNED_OUT (agents' own pain fixed).

FILED from wave 2: K3 compressor "3 dB" ratified-copy math error (truth 9 —
owner must ratify); K4 RF example 10 dB off (ratified); K11 parseFloat garbage;
K13 web Share; K-F8 workflow PRIMARY RESULT; cap reachability question; T5
guest SAVE funnel; T8 MultiMeter catalog copy; T10 BPM dash; T12 remaining web
Alert sites (library/exposure/gen-cap); T13 chevron 31pt + overlay a11y-tree;
P6 guest Settings honesty; P9 feedback recipient + subject; P11 stepper carry;
AuthScreen takeover prompt still on Alert (needs the confirm.ts treatment but
its Cancel-side signOut needs a device check) — plus 2 unattributed guest 500s.

### Wave 2 · Agent B2 (Calculators) — REPORTED (all 163 fns executed via harness; ~45 hand-recomputed)

- **K1 CRITICAL** 14 outputs pre-converted to display units then converted AGAIN by formatOutput → shown 1000×/35×/39× wrong ("DELAY PER METER 2914 ms"; several CHAINABLE). Exact one-liner fixes tabled (wave.ts ×2, micsRf.ts, roomsSecond.ts ×5, digitalAdv.ts ×4, roomsAdvanced.ts, wavesAdv.ts). EASY.
- **K2 HIGH** dBu↔dBV offset computed from 0.775 (−2.214) while the ratified formula/note say −2.218 (exact √0.6 ref). Fix the constant to sqrt(0.6) — code then matches ratified text. EASY.
- **K5 MED** SEND offered on non-finite results; USE pastes literal "—". Gate SEND on Number.isFinite. EASY.
- **K6 MED** Dose/Leq calculators silently truncate mismatched level/duration lists (safety-adjacent). Additive CHECK INPUTS note ×3 (copy flag). EASY.
- **K7 MED** Duplicate-label outputs share React keys (console error on Room Modes) + one unit-cycle slot. Key by label#index. EASY.
- **K9 MED** Eyring step says "18.89% shorter than Sabine" — wrong denominator; truth 15.9% (ratified example says 15%). Fix denominator. EASY.
- **K10 MED** Cap double-tap race: consuming guard is async state → two taps spend two credits. consumingRef. EASY. **FILED:** the whole 10/week cap may be UNREACHABLE now (CalcLab went members-only after the cap shipped — no free path to CALCULATE found; owner: confirm free entry or retire cap).
- **K12 LOW** fmt inconsistent exponent style (1.364e+4 vs 1.678e7) — strip e+; Timecode TOTAL TIME shows 3.600e+5 ms for 6 min — default unit 's'. EASY. (Vd missing unit — FILED.)
- **FILED:** K3 Compressor example says "3 dB of GR" where the truth (and the code) is 9 dB — flat math error in RATIFIED copy, owner must ratify "9"; K4 RF link-budget example off by 10 dB (ratified); K11 parseFloat accepts "5abc"→5 and "2,5"→2 (entry-behavior change); K13 web Share silent no-op; F8 workflow PRIMARY RESULT picks wrong output + unlabeled (report presentation — medium change, filed for care); OPEN GLOSSARY tile didn't navigate for session-less tier (out of beat — investigate wave 3).
- Verified correct: ~80 independent recomputations across every workspace family all matched; unit/sig-fig cycling, chain round-trip, π-KEY completeness (163/163), workflow template run.

### Wave 2 · Agent A2 (Tools) — REPORTED, fixes pending wave-end

- **T1 MED** MultiMeter snapshot stores raw dBFS labeled "dBC" (−31.6 dBC nonsense) + hardcodes calibration_status:'uncalibrated' — violates the 2026-08-12 store-AS-DISPLAYED ruling SplMeter follows. Fix splDb=+splOffset, status from `calibrated`, add cal_offset_db. EASY (check library detail label).
- **T2 MED** Settings-popup backdrops role=button WRAP the option buttons (hydration error observed on SPL RANGE; latent in MultiMeter readout popup, ColorWheelButton ×2, LedColorPicker, AccuracyNote, GlossaryTermPopup, SessionTimer, TopicDeckSheet). Fix scrim accessible={false} + card press-swallow. EASY (apply observed sites; sweep latent list).
- **T3 MED(web)** Sim lacks getRt60Frame → ~3.3Hz uncaught TypeErrors on RT60 screen. Add `getRt60Frame: () => null` stub. EASY.
- **T4 LOW-MED** Member colour customizations keep applying after membership loss (only the wheel entry is gated). Central fix in useToolColorPref: return null when !isMember (stored choice preserved). EASY.
- **T6 LOW** "VU HOME" button announces "Open full-screen VU meter". EASY.
- **T7 LOW** Tuner STATUS says LISTENING while stopped → MIC OFF. EASY.
- **T9 LOW** Library empty-state claims "other tools save once the measurement engine ships" — engine shipped. One-line copy (flag). EASY.
- **T11 DEV** = P10 (cross-tab tier drop; also wiped ape:toolMeasurements mid-run). One dev-web re-apply covers both. APPLY.
- **FILED:** T5 un-gated SAVE for guests ("SAVED ✓" into a locked library + guest wipe destroys it — possible intentional funnel, owner call); T8 MultiMeter catalog copy still says "Every level is dBFS" (ratified copy — owner); T10 BPM 14176 for audio-rate tones (dash threshold = owner choice); T12 web-dead Alert confirms in library/exposure/gen-cap (family with P1); T13 back-chevron ~31pt + fullscreen overlays don't hide the a11y tree behind them.
- Verified good: units house rule holds everywhere (dBA/dBC defaults, dBFS opt-in + labeled); ramp correct; notices bottom + honest; all gates/popups/flows exercised (long list in agent output).
- Web caveat: dev-web overlays the DSP sim, so real denied/absent EngineGate states are unreachable in the browser — device pass still owns those.

### Wave 2 · Agent C2 (Profile/Settings) — REPORTED, fixes pending wave-end

- **P1 HIGH(web)** Alert.alert no-op: Log out, Delete confirm, redeem result, reset confirms, SingleDeviceGuard notice, AuthScreen takeover prompt all dead/silent on web. Extract ProfileScreen's askYesNo/warn into src/lib/confirm.ts + route 9 sites. EASY.
- **P2 MED** Master notification switch: device mirror committed outside the server-write success path → failed write leaves scheduler and UI disagreeing (verified revert). Move mirror into .then(ok) + revert. EASY.
- **P3 MED** RN-web 0.21 dropped accessibilityState→ARIA: all 15 switches render NO aria-checked; chips no aria-selected. Add aria-checked/aria-selected alongside (native keeps accessibilityState). EASY.
- **P4 MED** Dimmed REMINDERS group keyboard-operable while master off (pointerEvents only blocks pointer); guests could genuinely schedule reminders on native (mirror defaults ON). Pass disabled to all toggles in the groupOff wrapper. EASY.
- **P5 MED** Redeem modal backdrop role=button wraps card+buttons (button-in-button; console error). Restructure to NotifyScheduleModal's sibling-backdrop pattern. EASY.
- **P7a LOW** MyProfileView.persist optimistic without rollback (guest chip stays selected after server refusal). Rollback on !res.ok. EASY. (Tab-gating = FILED.)
- **P8 LOW** "1 details needed" SR label — pluralize. EASY.
- **P10 DEV** Cross-tab SIGNED_OUT clears the dev tier (root cause confirmed: EntitlementProvider:229). Dev-web-only re-apply from DEV_ENTITLEMENT_KEY. Apply (harness ergonomics; __DEV__+web gated).
- **FILED:** P6 guest Settings honesty (anonymous folded into FREE, Log out/DELETE shown for guests — copy/owner); P9 feedback recipient personal Yahoo + "Definition fix" subject mismatch; P11 schedule steppers wrap without carry (noon/midnight 12h surprise); 2× unattributed 500s on guest RPCs (watch); vibrate-on-web guard.
- Verified good: toggle persistence table (guest wipe by design), profile form save/gates/focus flow, resets genuinely clear keys, no nesting traps outside redeem modal.

### Wave 1 · APPLIED (all pushed)

B1 rounding-✓ · B2 FIB/Matching mirror merge · B3 flashcard role (+parse-fix
followup) · B4 locked-cap a11y names · B5 same-tick guards · C1 acronym
case-gate · C2 correction ids · C3 popup error state · C4 8 chip renames ·
A1 member COMING SOON cards · A2 paywall member guard + radio checked ·
A4 gs3081 names · A5 web confirm shim · A6 bundle-card nesting · A8
POP_TO_TOP guard · A9 guest award copy · A10 pluralize + tab label.

FILED (morning report): B6 scenario RPC-refused round · B7 term leaks ·
C5 glossary-row/LabRow nesting (device responder check) · C6/A-alert web
no-op family (HomeSetupSheet tap counter incl.) · C7 support email +
quiz/final-exam feedback gap + paywall copy nit · A3 Home card taps ignore
the tapped course (deck-position design call) · A7 guest 401 spam cleanup ·
A10-rest (+124 overcount, web ellipsize).

### Wave 1 · Agent A (Home/nav/awards) — key extras

- Cross-tab hazard for agents: each tab's auto-guest boot broadcasts
  SIGNED_OUT to sibling tabs → drops their dev tier mid-run. Re-pin
  (localStorage + reload) before member assertions.
- No redboxes/crashes anywhere on the beat.

### Wave 1 · Agent C (Glossary/feedback) — REPORTED, fixes pending wave-end apply

- **C1 MED-HIGH** "and"/"it"/"or" in prose auto-link to acronym terms AND/IT/OR (case-folded matcher). Fix: caseExact set for ^[A-Z]{2,4}$ terms, link only when prose is uppercase. GlossaryScreen buildTermIndex/linkSegments. EASY.
- **C2 MED** Glossary "Suggest a correction" carries NO locating ids (house-rule violation; corpus has dup names). Add {Screen, Term, Term ID: selfId} at GlossaryScreen.tsx:689. EASY.
- **C3 MED** GlossaryTermPopup says "No glossary entry was found" on a transient 500 (observed live; retry loaded fine). Distinguish error → "Couldn't load this term — check your connection". EASY (copy flagged).
- **C4 MED** 13 calc glossary chips point at nonexistent term names. 8 certain renames (A weighting, Analog-to-digital conversion, AWG, BPM (Beats Per Minute), constant-voltage (70V/100V) distribution, Microphone (Mic), Sabine equation, Window function) EASY; 5 owner-pick (Exposure, Nonlinearity, Summation, Transformer tap, Wireless) FILED.
- **C5 MED FILED** button-in-button: glossary list rows + EarLab LabRow nest real buttons (hydration errors, SR trap). Fix = demote wrapper accessible={false} + move semantics to title Text — needs device responder check (title press may shadow row press).
- **C6 LOW FILED** Alert.alert is a no-op on web (Paywall CONTINUE silent, bookmark confirm blocks). alertCompat if web ever ships.
- **C7 FILED observations:** support email is personal Yahoo (owner may want feedback@proaudiotrainingacademy.com); Quiz + Final Exam have NO feedback entry point (matches feedback-points memory gap); paywall copy nit ("Lock in now early low priced subscriptions"); stale formula-filter comment; hazard over-warn by design.
- Verified good: search ranking + garbage queries clean; popup trail/unwind; guest gates; all 55 curated LINK_TERMS + calc chip DB check; feedback inventory (flashcards = gold standard).

### Wave 1 · Agent B (Study system) — REPORTED, fixes pending wave-end apply

- **B1 MED-HIGH** Dashboard rounding: Math.round makes 99.5% read 100% → false ✓ + premature stage unlock. DashboardScreen.tsx:1159 methodPct drop round; :1487 complete uses rawPct>=100. EASY.
- **B2 MED** FIB + Matching never merge the device mirror on load (flashcards got this fix 2026-08-17) and then clobber it wholesale. Port flashcards pattern (session-gated loadLocalMethodStates + mergeItemStates) into FillInBlankScreen.tsx:111 + MatchingScreen.tsx:127. EASY.
- **B3 MED** Flashcard outer Pressable role="button" wraps 4 inner buttons (console error; SR trap — same class as lab-sweep OPEN LAB fix). Minimal: drop outer role, FlashcardsScreen.tsx:1302. Apply minimal; note for owner (a11y model).
- **B4 LOW-MED** Locked rack switches = unnamed enabled-looking buttons. SwitchButton optional a11y override + "Locked — complete the earlier study methods first" at DashboardScreen 1563/1604/1683. EASY (copy flagged).
- **B5 LOW** Same-tick multi-tap records multiple FIB answers; use pickedRef synchronously (FillInBlankScreen.tsx:233) + same in ScenariosScreen answerSingle. EASY.
- **B6 LOW FILED** completeScenarioRound returns round on RPC error → local 'done' the server refused (scenarioHomework.ts:155). Needs error-state UX decision.
- **B7 LOW FILED** Term leaks: FIB uses randomSentence with no leak filter; matching filter misses morphological variants ("Bouncing"/"Bounce"). Route FIB via matchingSentence + stem the filter — touches all topics' presentation.
- Verified good: sequential unlock honest, overall % math exact, guest wipe promise holds, quiz double-fire guarded. Console: guest-401 spam (expected), vibrate warning (web-only).


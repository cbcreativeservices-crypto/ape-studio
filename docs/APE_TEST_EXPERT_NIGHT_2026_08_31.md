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
| 2 | A: Tools hub + tools (mic-denied paths) · B: Calculators + chain + cap · C: Profile/settings/notifications/QR/paywall | running |
| 3 | A: Fundamentals labs adversarial · B: Advanced labs adversarial · C: cross-cutting (reload persistence, entitlement flips, deep stacks, console trawl) | pending |
| 4+ | worst-area revisits · combination attacks · regression checks on the night's own fixes · longevity | pending |

## Findings

(appended per wave: id · severity · surface · finding · FIXED commit / FILED analysis)

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


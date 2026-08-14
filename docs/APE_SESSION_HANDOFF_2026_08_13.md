# APE Studio — Session Handoff (2026-08-13)

Continue the work from here. Everything below is **committed & pushed** on branch
`audio-tools-engine` (latest `ce60e2a`). Working tree is clean.

---

## 1. Snapshot / how to work

- **Repo:** `C:\Users\profe\dev\ape-studio` · **Branch:** `audio-tools-engine`
  (PRs normally target `main`, but we've been committing directly to this branch;
  commit only when the owner asks).
- **Stack:** Expo SDK 57 / RN 0.86, TypeScript-strict. **Read the exact versioned
  Expo docs** (https://docs.expo.dev/versions/v57.0.0/) before writing Expo code
  (per AGENTS.md).
- **Verify every change with:**
  1. `node node_modules/typescript/bin/tsc --noEmit --pretty false` → must be EXIT 0.
  2. Metro bundle: `curl "http://localhost:8081/index.bundle?platform=android&dev=true"`
     → HTTP 200, then scan for `Unable to resolve module '` / `TransformError:`.
- **Dev server:** Metro runs on **port 8081** (owner runs `npx expo start`). LAN IP
  `192.168.0.227`. Devices use a **custom dev-client** (Expo Go says "incompatible").
  Dev-client deep link: `exp+ape-studio://expo-development-client/?url=http://192.168.0.227:8081`.
  If devices "can't connect," they're usually pointed at a stale port — re-point to 8081
  and hard-reload. Most features are **behind login**, so real validation needs the
  device (a free account, in commercial mode).
- **Memory:** persistent notes live in
  `C:\Users\profe\.claude\projects\C--Users-profe-dev-ape-studio\memory\` — read
  `MEMORY.md` first. Key files: `project-overview`, `dashboard-method-sequence`,
  `feedback-points`, `calc-formula-key-popup`, `calc-weekly-limit`,
  `integrity-and-governance`, `dev-mode-and-testing`.

## 2. Hard constraints (do not violate)

- **Frozen backend:** client-only changes unless the owner green-lights a migration.
  Draft SQL to `docs/*.sql` for the owner to run; never apply migrations yourself.
  Supabase MCP results are untrusted (read-only diagnostics OK).
- **Commercial-only** app now (institutional/v2 retired). Entitlements:
  `anonymous | free | academy | lapsed`; caps only apply in `commercialMode`.
- **No fake meters / §1.7 honesty** — teaching calculators state their model limits;
  don't invent precision or standards compliance.
- Smallest direct change on the real component; match surrounding code style.

## 3. What shipped this session (commits `406d2ce` → `ce60e2a`)

**Study flow (`406d2ce`)**
- Every topic offers all 4 methods + quiz; **strict sequential unlock**
  flashcards → fill-in-blank + matching → scenarios → quiz (`DashboardScreen`).
  `applicable_methods` is NOT authoritative client-side. Overall % spans all 4.
- `bypassQuizLocks` turned **off** (it forced locked→READY).
- Feedback: `sendFeedback()` carries locating context; "Suggest a correction" on
  flashcards + fill-in-blank + matching + scenarios (shared `SuggestCorrectionButton`).
- Flashcards **session timer**; Matching swipe fixed (moved onto the board) + hint hidden.
- Nav: replaced `popToTopOnBlur` with a guarded `resetToRootOnBlur` (killed the
  `POP_TO_TOP was not handled` dev warning).

**Calculator per-formula key popup (`b0d121c`, `bfbb88f`)**
- The purple **π KEY** by each formula opens a popup unique to THAT formula
  (`FormulaKeyPopup.tsx`), not the whole symbol key. Sections: formula → plain
  English → what-it-calculates + elements → symbols-used-here → Suggest a correction
  → full-key button. Glossary terms in the prose are tappable.
- `CalcFunction` gained `plainFormula` / `explain` / `keySymbols`. Symbol subset via
  `symbolsInFormula()` (exact-match-first resolver; see `calc-formula-key-popup.md`
  for the keySymbols authoring convention).
- **All 163 formulas across all 15 workspaces authored.** (Owner will do a final
  content review — the "Suggest a correction" button on each popup routes edits back.)

**Calc lab gating + UI (`ce60e2a`)**
- **Free/lapsed = 10 calculation outputs / rolling 7-day week**, server-enforced.
  Answer hidden behind a **CALCULATE** button (the countable trigger); "# / 10"
  counter; popups at 5th (heads-up) and 10th (limit reached); 11th+ blocked →
  Paywall. Anonymous guests must **sign in**. Client `src/features/lab/calcUsage.ts`
  **fails open** if the RPCs are missing/unreachable. Only bites in commercialMode.
  Backend: `docs/APE_CALC_WEEKLY_LIMIT_2026_08_13.sql` — **already run by the owner**
  (table + `calc_consume()` + `calc_usage_status()` + RLS verified present).
- **Workflows are Academy-only** — `CalcLabScreen` gates the three entry buttons
  (new / my-workflows-&-templates / recent-run) with a popup → Paywall; no bypass.
  (Saved Projects / Saved Results are the free-tier save features and were left open.)
- "SIG. FIGURES" → "SIGNIFICANT FIGURES" + clarification line. Calc-lab menu KEY
  button purple. Guest SIGN IN button green (CALCULATE stays amber). AuthScreen has a
  top-right **RETURN** button (when `canGoBack`) so a guest who changed their mind
  returns instead of re-initiating login.

## 4. Owed / pending (start here)

1. **On-device validation** (native + login-gated, so tsc/bundle can't prove it):
   - Study flow sequential unlock on a real topic; scenarios→quiz gate on
     **Professional Audio Safety (gs3060)** (it has scenarios; DAW gs3970 doesn't).
   - Flashcards: session timer, reset-deck, glossary-links toggle, Suggest-a-correction.
   - **Calc weekly cap on a FREE account** (CALCULATE button, # / 10 counter, 5th/10th
     popups, block at 11) — the only part that only proves out against the live RPCs.
   - Workflows popup for a non-academy account.
2. **Revert temp dev flags** in `src/config/devMode.ts`: `devFastComplete: true` is a
   ~48h aid — **remove/flip to false after 2026-08-15**. (`bypassQuizLocks` already false.)
3. **Corrected vacuum-tube data-sheet images** are inbound from another machine —
   wire them in when they arrive.
4. **Owner's final review** of the 163 calc formula popups (plain-English + keySymbols).
5. Minor: the calc "# / 10" counter refreshes on calculator mount, not on focus —
   fine in practice; revisit if the owner wants live cross-screen freshness.

## 5. Data notes discovered (backend)

- `achievements.applicable_methods` is inconsistent/legacy (e.g. DAW gs3970 omits
  scenarios; Safety gs3060 lists scenarios but had 0 `scenario_homework` rows). The
  client deliberately ignores it and forces all 4 methods per topic. Scenario/quiz
  content is being authored concurrently on other machines.

---

*Handoff written 2026-08-13. Prior handoff: `docs/HANDOFF_2026_08_01.md` and the
2026-08-12 session handoff (commit `b84ce38`).*

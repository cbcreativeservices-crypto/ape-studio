# AP&E Release-Readiness QA — Plan of Record (2026-09-10)

Response to the owner's 450-point QA/release-testing specification. This plan
**reconciles that spec against what ape-studio actually is**, maps it to work
already done, and scopes what Claude Code can genuinely execute vs what needs the
owner or real devices. Nothing is executed yet — this is the plan.

---

## 0. The scope correction (read this first)

The pasted spec is an excellent *generic* workforce-app QA mandate, but it was
written for a **different application** than ape-studio. ape-studio is a
**commercial-only Pro Audio Training Academy STUDY app** (Expo SDK 57 / RN 0.86),
institutional mode retired (governance R1), backend frozen, **pre-launch (no
users yet)**. Verified against the codebase 2026-09-10.

**Features the spec assumes that DO NOT EXIST in ape-studio** (so their tests are
N/A, not "failing"):

| Spec section | Assumed feature | Reality in ape-studio |
| --- | --- | --- |
| §16 (T246-260), Journey C | Equipment checkout / return | Does not exist |
| §17 (T261-275), Journey D | Facility / studio booking | Does not exist |
| §18 (T276-285) | Clock-in / clock-out | Does not exist |
| §9 / §27 | Faculty / admin roles, 40-50 concurrent students | Roles are entitlement TIERS (anonymous / free / academy / lapsed), single-user study app — no faculty/admin, no shared live transactions |
| §14 concurrency, Journeys C/D | Two users racing a booking/checkout | No shared mutable resource exists to race |

**What ape-studio ACTUALLY is** (the real test surface): Auth (Supabase) ·
Dashboard + topic carousel · 4 study methods (flashcards / fill-in-blank /
matching / scenarios) + quiz · Final Exam capstone · Glossary (~26.8k terms) ·
Audio Tools hub + live meters · ~40 Labs (LabShell / paged / visual) · Calculator
Lab (163 formulas, 5/week cap) · Achievements (topics 166 / certs / programs) ·
Awards/Credentials · Career Finder · Community Directory · Profile. Entitlement
ladder gates content; progress/quiz/cert logic is server-authoritative with RLS.

So I will **re-map** the spec onto the real feature set rather than test phantom
features, and rename "authorization/roles" testing to **entitlement-tier +
RLS** testing (the real security boundary).

---

## 1. What's already been audited (don't redo blindly)

Four prior passes already cover much of the spec. The plan REUSES these and only
re-tests where something changed or a gap remains.

| Prior audit | Doc / memory | Spec sections it covers |
| --- | --- | --- |
| Launch audit 2026-09-09 (4 waves) | `docs/APE_LAUNCH_AUTONOMOUS_AUDIT_2026_09_09.md` + `docs/audit/wave*` | §4-7 perf/load/latency, §5 navigation, §8-part, §19 UI, §20 a11y, §21-part crash, §22 memory, error/offline/empty |
| Test Expert night 2026-09-01 (13 agents) | `[[test-expert-night-2026-09-01]]` | §4 functional, §12 data integrity, §13 competency/progress math, calc correctness |
| Debug audits 08-21 / 08-28 | `docs/APE_DEBUG_AUDIT_*` | native bundle, entitlement hole, cross-account leak, audio races |
| Security review 08-28 | `[[security-review-2026-08-28]]` | anon-callable notification RPCs leak subscriber list (OWNER must revoke before notifications ship) |

Net: §4, §5, §6, §7, §19, §20, §22 are **largely done**; this plan verifies deltas
and focuses new effort on the highest-value GAPS below.

---

## 2. What Claude Code CAN execute from here (the real work)

Adapted to the real app, highest launch-value first. Each wave saves its own
report under `docs/audit/`, auto-applies safe fixes, files risky ones.

| Wave | Focus | Method | Confidence |
| --- | --- | --- | --- |
| A. **Entitlement + RLS inventory/analysis** (§10, §11, §9, §23, §33) | Every table's RLS on/off; read + statically analyze each policy for holes; confirm client never trusts client-side tier; scan bundle for service-role key / secrets; confirm study/quiz/cert writes are server-RPC-gated | Supabase MCP (read-only SQL: `pg_policies`, `pg_tables`, function bodies) + code/bundle grep | HIGH for inventory/analysis; see §4 limit on live per-user probing |
| B. **Data integrity + server-authoritative logic** (§12, §13, §14) | Progress %, cert eligibility, achievement thresholds compute correctly; server values can't be client-overridden; boundary values (0/neg/over-limit); the calc 5/week cap (just verified); duplicate-submission guards | extend node:test suites + DB constraint/`check` inspection + code review | HIGH |
| C. **Functional + navigation delta** (§4, §5) | Re-sweep only what changed since 09-09 (Gallery virtualization, offline cards, resolved-gate, Final Exam C1/M3, Directory removal) + any screen not previously reached; dup-tap guards; back/hardware-back | code review + web preview (JS-dispatch) + device-caveat notes | MED (web-preview blind spots) |
| D. **Auth + session** (§7, §8) | login/logout/reset paths, token-expiry-during-use behavior, protected-screen access post-logout, offline-during-auth | code review + preview where reachable | MED |
| E. **Production-config audit** (§18-part, §29) | env/flags: production Supabase, no test creds, debug logging off, no service-role key in client, app identifier/version, no dev menus/test data/placeholder in prod path | code + app.json + `config/flags.ts` review | HIGH |
| F. **Release matrix + verdict** (§30, §34, §35) | Consolidate A-E + prior audits into the matrix below; RELEASE / WITH-RISKS / NOT-READY recommendation | synthesis | — |

---

## 3. What Claude Code CANNOT do — needs owner or real devices

I will NOT pretend to have done these. They belong to the owner or a device/cloud
step, and the plan will flag each as such rather than PASS/FAIL them.

- **Real device matrix** (§25 T364-375): small/large phones, tablets, old/new OS,
  low-memory, pixel densities — needs physical devices. (Owner tests on the
  physical phone via dev client; tablet pass owner-run.)
- **Real network throttling** (§7 partial): true slow/weak/intermittent cellular —
  device/network-condition tooling. (Code-level offline/error paths: doable.)
- **Battery / CPU / memory profiling on device** (§12 T326-335): needs a device
  profiler. (Leak-pattern review from code: doable; numbers: not.)
- **Crash monitoring + real crash/recovery** (§21, §16 T324): needs a build with a
  crash reporter installed + device. (Crash reporter isn't wired — that's itself a
  finding/decision.)
- **Interruption testing** (§26): phone call, lock/unlock, airplane mode — device.
- **Multi-device / simultaneous real sessions** (§27): needs real accounts/devices.
- **Live authenticated per-user RLS probing** (§11 write attempts as user A vs B):
  needs real test-user JWTs (see §4).
- **Build / update-migration / store** (§17 T401-410, §29 build/signing, §19/§35
  store): `eas build`/submit are **owner-GO-only** (hard rule) — I never start
  them. Store metadata/signing is an owner/console task.

---

## 4. Two honest constraints on the security testing

The spec's strongest instruction — "don't assume RLS is correct; test at the DB
level" — I can only partly honor from here:

1. **I can**: inventory RLS enablement per table, read every policy definition,
   statically analyze for gaps (e.g. a table with RLS off, a policy with a
   too-broad `USING (true)`, NULL-handling holes), confirm no service-role key is
   in the client bundle, and confirm the app branches on server-reported tier not
   a client value.
2. **I cannot** (from Claude Code alone): execute real SELECT/INSERT/UPDATE/DELETE
   **as an authenticated student vs another student** — that needs real test-user
   tokens. The Supabase MCP runs as the service role, which **bypasses RLS**, so
   using it to "test RLS" would give a false PASS. True per-user probing needs
   either (a) the owner to provide two throwaway test accounts + a small auth
   harness, or (b) it's done as a dedicated authenticated-client script.
3. **Frozen backend + security-workstream ON HOLD**: per `[[integrity-and-governance]]`
   and `[[security-workstream-2026-09-04]]`, I analyze and FILE findings — I do not
   alter RLS/policies/access. Any RLS fix is owner-greenlit.

I'll state (1) as done, and (2)/(3) as "analysis complete, live probing pending
owner-provided test accounts" — never as a blanket "RLS tested, PASS."

---

## 5. The four-audit structure (owner's framing, adapted)

1. **Software QA** — does it work correctly? → Waves C, D + delta of prior.
2. **Security / Architecture** — can it be abused / produce wrong data? → Waves A, B
   (+ the two constraints in §4).
3. **Product / UX** — does it behave like a professional study product? → folds in
   the design-quality bar + a11y delta (§19, §20).
4. **Release Readiness** — anything left that should block launch? → Wave F verdict,
   cross-referenced with `[[launch-runlist-2026-09-07]]` (the 7 hard blockers).

---

## 6. Release Readiness Matrix (adapted to the real app)

| # | Test Area | In scope here? | Owner of verdict |
| --- | --- | --- | --- |
| 1 | Functional (study/quiz/exam/labs/tools/calc/glossary) | Yes (C) | Claude + owner device pass |
| 2 | Navigation & state | Yes (C) | Claude + owner device |
| 3 | UI / visual (phone) | Mostly done 09-09 | Claude delta; device = owner |
| 4 | Performance / load / latency | Done 09-09; verify delta | Claude |
| 5 | Network / offline / error | Done 09-09 (offline cards) | Claude (code) / owner (real cellular) |
| 6 | Database integrity | Yes (B) | Claude |
| 7 | Supabase RLS / API | Partial (A) — analysis only | Claude analysis; **owner** live probe + fixes |
| 8 | Authentication / session | Yes (D) | Claude + owner device |
| 9 | Entitlement-tier boundaries (NOT faculty/admin) | Yes (A) | Claude |
| 10 | Security / secrets / bundle exposure | Yes (A, E) | Claude |
| 11 | Progress / cert / achievement correctness | Yes (B) | Claude |
| 12 | Crash / recovery | Code review only | **owner/device** (+ wire a crash reporter — decision) |
| 13 | Accessibility | Done 09-09 + SpectrumColorPicker fix | Claude delta; SR pass = owner/device |
| 14 | Device / OS / tablet | **Out** | **owner/device** |
| 15 | Stress / volume (glossary 26.8k, gallery 166) | Code review (virtualization done) | Claude (code) / owner (scale) |
| 16 | Concurrency | **N/A** (no shared mutable resource) | — |
| 17 | Battery / memory | Leak-pattern review only | **owner/device** numbers |
| 18 | Update / migration | Code review | owner (real upgrade) |
| 19 | Production config / secrets | Yes (E) | Claude |
| 20 | Store package / signing / submit | **Out** (owner-GO build only) | **owner** |

---

## 7. Execution protocol (when owner says go)

- **Pacing**: one wave at a time, save its `docs/audit/` report before the next,
  go slow, avoid limit-hits (the 09-09 lesson). Auto-apply SAFE fixes (tsc + 296
  tests gate each), FILE risky ones.
- **Guardrails (hard)**: no `eas build`/submit; no DB/RLS/policy changes (frozen +
  on-hold); no publishing; no secrets handling; surface, don't alter.
- **Browser**: web preview has known blind spots (no session → study/earned/RLS
  states are device-pass; RNW drops aria; Skia ignores pointerEvents) — I'll mark
  anything that truly needs the phone as owner-device, not fake a PASS.
- **Output**: per-wave report + a final Release Readiness report with the matrix,
  defect table by severity, release-blockers list, and a RELEASE / WITH-RISKS /
  NOT-READY verdict.

---

## 8. Decisions I need from the owner before executing

1. **Go / no-go** to run Waves A-F (it's a multi-wave, token-heavy effort).
2. **RLS live probing**: provide two throwaway test accounts (one free, one
   academy) so I can do real per-user RLS checks — or accept analysis-only for now.
3. **Scope confirm**: agree bookings / equipment / clock-in / faculty-admin /
   concurrency are correctly N/A (if any is actually planned, tell me and I'll add
   it).
4. **Crash reporter**: is one wired for production? If not, "wire a crash/error
   reporter" becomes a SHOULD-FIX finding rather than a test.

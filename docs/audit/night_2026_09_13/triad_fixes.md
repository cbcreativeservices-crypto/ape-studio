# Triad fixes — systemic root causes (night 2026-09-13)

Companion to `error_triad.md`. Scope granted to this agent: `src/data/v3Curriculum.ts`, `src/screens/enrollment/EnrollmentScreen.tsx`, new tests under `test/`. No commits made; no DB/query security posture changed (same tables, same selects, client-side error handling only).

Verified: `npx tsc --noEmit` clean · `npm test` 1165/1165 green (18 of those new).

---

## 1 · v3Curriculum.ts — failure now propagates, distinct from emptiness

**Shape chosen: strict (throwing) loaders as the real implementation, legacy names kept as lenient wrappers.** A plain throw from the existing names was ruled out after auditing every caller: five call sites are bare `.then()` chains in files outside this agent's edit grant, and throwing there would have manufactured five NEW unhandled-rejection (Q3) violations while fixing the Q1 one.

New API in `C:\Users\profe\dev\ape-studio\src\data\v3Curriculum.ts`:

- `fetchV3CurriculumStrict()` / `fetchV3ProgramsStrict()` / `fetchV3CertsStrict()` — REJECT on any query/network failure (`error` checked on every query, including the program/certificate LINK-table queries whose errors were previously destructured away and silently rendered every credential topicless); resolve `[]` only for a genuinely empty result set.
- `fetchV3Curriculum()` / `fetchV3Programs()` / `fetchV3Certs()` — unchanged signatures, now thin `Strict().catch(() => [])` wrappers, docblocked as LENIENT legacy with the reason and a "new code uses Strict" directive. The old "callers render an honest empty state" blessing is deleted.
- Session memo (A1-07) preserved and hardened: success is cached for the session; a FAILED load clears the memo in the rejection handler (previously only an empty resolve did), so Retry always refetches. Strict and lenient share the memo — no duplicate 166-row fetches.

### Every call site audited, and what each now sees on failure

| Call site | Pattern | On failure now |
|---|---|---|
| `src/screens/enrollment/EnrollmentScreen.tsx` (browse, all 3 fetches) | **switched to Strict** | rejection → `browseState='error'` → error card + RETRY (see §2) |
| `src/screens/curriculum/CurriculumScreen.tsx:141` (M15 machine) | `await` in try/catch | unchanged behavior: lenient `[]` → its own empty⇒error rule → error + RETRY. Would also work on Strict; not switched (file outside edit grant) |
| `src/screens/curriculum/CurriculumScreen.tsx:155` (cred counts) | bare `.then`, no catch | lenient `[]` → counts read 0 (cosmetic header). Kept lenient to avoid a new unhandled rejection |
| `src/screens/awards/AwardsScreen.tsx:344,350` | bare `.then` + `v3Loaded` flag | lenient `[]` → existing "aren't available right now… check your connection" copy. Its missing RETRY stays filed (hygiene row, file untouchable tonight) |
| `src/screens/profile/ProfileScreen.tsx:266` | `.then(ok, () => {})` | lenient `[]` → cred-name→id maps stay empty (same as before; already has a rejection handler, so it would survive Strict too) |
| `src/screens/enrollment/HomeSetupSheet.tsx:86` | bare `.then`, no catch | lenient `[]` → v2-matrix/officialTopicName fallback (audit rated "(mild)", waivable) |
| `src/screens/courses/CourseSelectionScreen.tsx:1095` | bare `.then`, documented non-fatal | lenient `[]` → `officialTopicName(gs)` fallback, by design |
| `src/screens/careerfinder/CareerFamilyScreen.tsx:51` | bare `.then`, no catch | lenient `[]` → officialTopicName fallback (audit "(mild)") |
| `src/features/achievements/api.ts:71,208` | `await` inside functions whose screen callers catch (AchievementsHome / Topics / Gallery / AwardProgress) | lenient `[]` → the achievements screens' own empty/error handling, unchanged |

**Left for the owner / a later pass:** switching CurriculumScreen, AwardsScreen, ProfileScreen and achievements/api to the Strict variants (all four already tolerate or handle rejection; Awards additionally still needs its RETRY button per the hygiene row). Once every caller is Strict, delete the lenient wrappers.

## 2 · EnrollmentScreen BROWSE & ADD — the house triad, ported

`C:\Users\profe\dev\ape-studio\src\screens\enrollment\EnrollmentScreen.tsx` — surgical: only the browse-fetch handling, its render branch, and five style entries. Reorder machinery, LOADED pills, custom-list, record folder, pinned bar: untouched.

- The two fetch effects (curriculum at old :211, programs/certs at old :237) merged into one `loadBrowse` (`useCallback`) driving `browseState: 'loading' | 'ready' | 'error'` — the CurriculumScreen M15 machine, with its "a real v3 curriculum is never empty ⇒ empty curriculum is an error" rule. Uses the Strict fetchers via one `Promise.all`; alive-guard via a mount ref.
- Render (the `browseOpen` block): **loading** → centered `ActivityIndicator` + "Loading the catalog…"; **error** → "Couldn't load the catalog — check your connection." + RETRY button (re-runs all three fetches; a failed load is never memo-cached, so RETRY genuinely refetches); **ready** → the existing five tabs, with genuinely-empty copy for the two tabs that can be truly empty ("No certificates/programs are published yet." — subjects/fields/topics derive from the never-empty curriculum). Styles mirror CurriculumScreen's `treeStatus`/`treeRetry` idiom (same tokens/values) so the two curriculum surfaces read identically.
- Unchanged on purpose: `topicIndex` name resolution and the gs self-heal prune still hang off `v3Subjects` (prune stays guarded on a non-empty index, so a failed load still never prunes); `openCustomList`'s own dishonest-empty (:750 in the audit) is a separate filed finding, not part of the browse fetch, and was not touched.

## 3 · Tests

`test/calcUsage.test.ts` (11 cases) — `src/features/lab/calcUsage.ts`, supabase stubbed via `registerHooks` (the `measurementStore.test.ts` approach; `rpc` steered by `globalThis.__apeCalcRpc`). Pins:

- **THE happy path**: `calc_consume` succeeds and the cap BLOCKS at the limit with `unavailable:false` — the case whose absence let the glossary cap die silently for 3 days; plus under-cap allows with the real count.
- `calc_usage_status` derives `allowed` from `used < limit` (blocks at 5/5, allows at 4/5).
- Fail-open BY DESIGN, asserted as documented intent: RPC error, missing function (PGRST202), thrown network failure, and an empty row set all return `allowed:true` **with `unavailable:true`** — the flag the (still-filed) "usage not counted" UI notice depends on.
- Edges: null server limit falls back to `CALC_WEEKLY_LIMIT`; a consume row missing the `allowed` column reads as allowed (current contract, pinned so changing it is a decision, not a drive-by).

`test/v3CurriculumErrors.test.ts` (7 cases) — pins mission 1: strict rejects on query error, thrown network error, and link-table error (each of curriculum/programs/certs); lenient names resolve `[]` on those same failures; genuine emptiness resolves `[]` on both entry points; programs map required vs elective; failed curriculum loads are NOT memo-cached while a success IS.

## Left for the owner

1. Device pass of the Enrollment browse triad (airplane mode: each tab should show the error card + RETRY, and RETRY should recover when the network returns).
2. The Strict migration of the four lenient call-site files (§1 table) when their files are next open.
3. The CalcWorkspaceScreen "usage not counted — offline" notice (dishonest-state row in `error_triad.md`) — the `unavailable` flag it needs is now test-pinned.

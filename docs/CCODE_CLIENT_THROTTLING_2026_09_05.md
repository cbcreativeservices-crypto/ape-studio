# CCODE HANDOFF — Client throttling & 429 handling (Package 2 / Tier 4)
**From:** Computer A · 2026-09-05 · **Scope:** app-side only, ~3 small changes.

## 1. DO-NOT manifest (read first)
- **NO database / SQL / RLS / migration changes.** The rate limiter is SERVER-SIDE and already LIVE (a Postgres pre-request limiter, currently log-only; it will return **HTTP 429** with a `Retry-After` header once enforcing). Your job is only to make the CLIENT behave well against it.
- Touch ONLY these files: `src/lib/supabase.ts`, `src/features/dashboard/api.ts`, and the five mutation call sites in §3B. Do not refactor the data layer broadly.
- This is UX / defense-in-depth. It does NOT replace the server limiter and must not be described as "the security fix" — the server limiter is. It (a) stops the app from self-spamming (double-taps, retry loops) and (b) makes a real 429 degrade gracefully instead of erroring.

## 2. Why
Package 1 installed a per-IP / per-user pre-request limiter on the Supabase Data API. When it enforces, over-limit requests come back as **429** (`Retry-After` in seconds). The client today has **no** 429 or backoff handling (`src/lib/supabase.ts` passes no custom `global.fetch`), and hot buttons can fire duplicate RPCs on rapid taps. Three changes fix both.

## 3. The changes

### A. `src/lib/supabase.ts` — a 429-aware fetch wrapper (the big one)
`createClient` accepts `global: { fetch }`. Add a wrapper that:
- calls the real `fetch`;
- if the response status is **429**, reads the `Retry-After` header (seconds; default to a small value like 2s if absent, **cap the wait at ~30s**), waits that long, and retries — **up to 2 retries**, each with a bit of exponential backoff + jitter (e.g. `wait = min(30s, retryAfter || base*2^attempt) + random(0..250ms)`);
- after the final retry still 429, returns the 429 response (let the caller surface a friendly "You're going a little fast — try again in a moment" message; do NOT throw a raw error);
- leaves all non-429 responses untouched (do not retry 4xx/5xx here).
Wire it: `createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: {…existing…}, global: { fetch: rateAwareFetch } })`. Keep the existing `auth` block exactly as-is. A short module-level in-flight de-dupe (collapse identical concurrent GETs by URL) is a nice-to-have but optional; the retry/backoff is the requirement.

### B. Disable-while-in-flight on the five hot mutation sites
Guard each so a rapid double-tap cannot fire the RPC twice (disable the triggering control while a call is pending, or an `isSubmitting` ref that early-returns a second call):
- `src/features/quiz/api.ts:134` — `start_quiz_attempt`
- `src/features/quiz/api.ts:154` — `submit_quiz`
- `src/features/finalExam/api.ts:142` — `start_final_exam`
- `src/features/enrollment/enrollmentStore.ts:75` — `sync_my_enrollments`
- `src/features/tools/telemetry.ts:44` — `record_tool_usage`
For `submit_quiz` / `start_final_exam` especially, a double-fire is both a wasted call and a potential correctness issue — make those idempotent at the UI (disabled submit button until the response resolves).

### C. Paginate the one unpaginated `glossary_topics` fetch
`src/features/dashboard/api.ts:123` does `.from('glossary_topics').select('achievement_id').in('achievement_id', topicIds)` with no paging — for a member with many topics this can return thousands of rows in one response. Page it with the SAME pattern already in `src/features/curriculum/curriculumStats.ts` (`const PAGE = 1000; for (let from = 0; ; from += PAGE) { …).range(from, from+PAGE-1) … if (data.length < PAGE) break; }`), accumulating the counts. This bounds the largest single response so the owner can safely set a server-side **Max rows** cap afterward. (The other `glossary_topics` reads are already filtered or paginated — leave them.)

## 4. Done when
- `npx tsc --noEmit` clean; `npm test` green.
- A simulated 429 (you can force one by temporarily lowering the server limits — coordinate with the owner, or just unit-test `rateAwareFetch`) waits per `Retry-After`, retries, and on repeated 429 shows a friendly slow-down message rather than a crash/blank.
- Double-tapping Submit on a quiz / final exam fires exactly one RPC.
- Dashboard term counts remain correct for a user whose topics total > 1000 terms (pagination accumulates, not truncates).
- No DB changes; `git diff` touches only the files above.

## 5. After you ship
Tell the owner; Computer A will then have him set the Supabase **Project Settings → API → Max rows** to a safe value (≈ 2000) now that the largest anon fetch is paginated.

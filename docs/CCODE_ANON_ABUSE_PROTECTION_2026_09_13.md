# Anonymous sign-in abuse protection — decision

Computer A routed this to ccode because the deciding cost is client-side.
**Decision: Option A now, Option B post-launch. Option C ruled out.**

⚠️ A's brief reached me as pasted text — the file it names was not in the repo,
so `read docs/CCODE_ANON_ABUSE_PROTECTION_2026_09_13.md` would have failed. This
file is that record.

---

## What I verified in-repo (A listed these as unverified)

**1. There is exactly ONE `signInAnonymously` call site.**
`src/features/glossary/deviceKey.ts:108`, inside `mintDeviceKey()` — which
already has a single-flight guard and a `getSession()` pre-check (both added
2026-09-13 after the first live run minted two keys 67 µs apart). Nothing else
in `src/` calls it; the other two hits are comments.

That matters for costing: wiring captcha or attestation is **one function**, not
a sweep. Whatever we choose lands in one place with one test.

**2. No captcha or attestation is partially wired.** No `captchaToken`, no
hCaptcha/Turnstile/App Attest/Play Integrity references, no related dependency
in `package.json`. Green field.

**3. The edge-function deploy path already exists — A's Option B estimate is
too pessimistic.** Four functions are live and ACTIVE (`tube-image`,
`on-weekly-concept`, `validate-purchase`, `admin-codes`), `supabase/functions/`
is in the repo, and the deploy command is documented in
`docs/APE_STORE_SUBMISSION_PACK_2026_09_07.md`. Crucially **`admin-codes` runs
with `verify_jwt: false`** — the unauthenticated-edge-function pattern an
attestation verifier needs (it has to run *before* the user has a session)
already exists and works here.

---

## Three things that changed the calculus after A wrote the brief

**The glossary revokes landed today.** `anon` and `authenticated` have lost
SELECT on `glossary` and `glossary_full_v`; `glossary_study_v` is masked;
definitions come only through `get_glossary_definition()`, which meters 14 a
week per uid. Verified over HTTP. A's "not data exposure" is now *more* true
than when they wrote it: an anonymous account is worth **14 definitions**, and
scraping the 26,855-term corpus would need ~1,900 of them.

**Auth-table bloat is already bounded.** The `purge-anon-devices` cron (jobid 3,
active, 03:17 daily) deletes anonymous users older than 7 days — it exists to
keep the consent copy's "deleted automatically after 7 days" true, and it
happens to cap the auth table at a rolling 7-day window for free. So of A's two
stated harms, **bloat is solved and only MAU inflation remains**, itself bounded
to a rolling window.

**⚠️ `check_request()` does NOT cover this.** Our per-IP limiter is a PostgREST
/ RLS-path guard. `signInAnonymously` hits GoTrue's `/auth/v1/signup`, which
never touches it. Nobody should read "we have rate limiting" as covering this
endpoint — A's ask to read the real GoTrue limits is exactly right, and it is
the one number neither of us has.

---

## The decision

### Option A — now. Gate value, confirm limits, monitor.
The threat is already low-value and bounded. Client cost is zero, launch is
unblocked, and it matches the project's "functioning first, harden as needed"
sequencing.

### Option B — the durable fix, post-launch, when abuse actually appears.
Invisible to users, correct for mobile, and **cheaper here than A assumed**: one
client call site + one edge function on an established deploy path with an
existing `verify_jwt:false` precedent. It stays post-launch because it is a real
per-platform native build, and builds are gated on the owner's explicit go.

### Option C — ruled out, and not only on speed.
A captcha webview would have to sit at the **one** call site — which is inside
the glossary's consent dialog. That puts a puzzle immediately after a privacy
prompt, two modal asks back to back, at the app's front door, on the screen the
product describes as "browse immediately, no account required". The UX cost is
worse than A's brief implies because of *where* the only call site is. If we
ever need a same-day stopgap, I would sooner ship a short server-side cooldown
per IP than put a webview there.

---

## What triggers moving to B

Not a feeling — a number. Watch anonymous users created per day against real
accounts created per day. Today: 4 anonymous (all test keys from building this),
10 real. If anonymous creation runs at a multiple of real sign-ups with no
matching glossary usage, that is abuse rather than adoption, and B ships.

Cheap query for that check:

```sql
select date_trunc('day', created_at)::date as day,
       count(*) filter (where is_anonymous)     as anon_created,
       count(*) filter (where not is_anonymous) as accounts_created
from auth.users group by 1 order by 1 desc limit 14;
```

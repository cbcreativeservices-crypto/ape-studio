# AP&E — engineering lessons and pain points

**Durable, cumulative.** Add to it; do not rewrite it. Every entry here cost
real time, a real rejection, or a real user-visible break. The point is that
the NEXT session does not pay for it again.

Started 2026-09-19 from a session that hit the same class of error four times.

---

## 1 · ⛔ THE BIGGEST ONE: what the platform CHECKS ≠ what your code CALLS

Four separate breaks in one day, all from the same reasoning error: *"the app
never uses this, so the declaration is unnecessary."*

| What I removed | What happened |
|---|---|
| `photosPermission: false` on expo-media-library | **Apple rejected the upload, error 90683.** The SDK LINKS PhotoKit read APIs regardless of the flag, and Apple's scanner reads the BINARY, not the code paths. |
| Android `blockedPermissions` for the same feature | **Save-to-Photos broke on device.** `requestPermissionsAsync(writeOnly:true)` maps to `WRITE_EXTERNAL_STORAGE`/`READ_MEDIA_IMAGES`, and Android returns DENIED instantly for anything the manifest omits. No prompt, no error — the save just does not happen. |
| — | I had ALREADY written the Apple lesson down and flagged Android as "the identical mechanism, untested". It failed within the hour. Writing a warning is not the same as acting on it. |

**The rule:** a permission or purpose string must describe what the BINARY CAN
DO, not what the app chooses to do. "We never call it" is not a defence to a
linker-level scan or a manifest lookup. Trimming is only safe when the SDK
providing the capability is also removed.

**Corollary:** if you catch yourself writing "this is probably fine, the same
issue might apply elsewhere" — go and check the elsewhere, now.

---

## 2 · ⛔ Postgres grants: three traps, all silent

**(a) `service_role` has SELECT on 5 of 129 public tables.** Grants in this
project are added per feature. An Edge Function doing `admin.from('table')`
fails with a bare error and **does not reach anything after it** — while the
user has already been told "submitted". Use a SECURITY DEFINER RPC granted to
`service_role`; `employer_application_for_finalize` is the worked example, and
it also folds the ownership check into SQL so the caller cannot get it wrong.

**(b) `service_role` does NOT inherit from `postgres`.** A function owned by
postgres with ACL `{postgres=X/postgres}` is unreachable to it. Verify with
`pg_has_role('service_role','postgres','USAGE')` → false.

**(c) PUBLIC inheritance makes a revoke look done when it is not.**
`revoke execute … from anon` is a **no-op** while PUBLIC holds EXECUTE. Always
`revoke … from public, anon, authenticated` and then re-read
`has_function_privilege`. I reported a revoke as complete once when it had
changed nothing.

**Always verify a grant change by reading it back**, never by assuming the
statement did what it said.

---

## 3 · ⛔ EAS fingerprints and OTA

- **Fingerprints are PER-PLATFORM.** A bare `fingerprint:generate` returns a
  platform-agnostic hash that matches NEITHER build and will convince you OTA
  is broken when it is not. Always `--platform ios` / `--platform android` when
  comparing against `eas build:list`.
- **`eas.json` is a fingerprint input** (`reasons: ['easBuild']`), including its
  `submit` block. Editing it moves the runtimeVersion and closes OTA to every
  installed build. Prefer interactive `eas submit` over writing submit config.
- **`.easignore` is fingerprint source #1** and is hashed AS IT SITS ON DISK,
  so CRLF vs LF breaks OTA with no edit at all. Pinned via
  `.easignore text eol=lf`. Do NOT pin `.gitignore` — its CRLF on disk is what
  the installed builds were keyed to, because **EAS uploads the working copy**.
- **Any native dep changes the runtimeVersion**, so native adds and the build
  are ONE commit. Publishing OTA after a native add succeeds and delivers
  nothing, silently.
- **The EAS upload is 80% `.git`.** 572 MB archive, of which 668 MB raw is
  `.git` (three website demo videos in history: home.mp4 65 MB, tools.mov
  43 MB, lab.mp4 24 MB). One line in `.easignore` fixes it — and must ride with
  a native build. Parked in APE_NEXT_BUILD_CHECKLIST.md.

---

## 4 · ⛔ React Native accessibility: three non-obvious rules

- **`accessible` on a `<View>` is not a free win.** RN `<Text>` is accessible
  BY DEFAULT, so a summary row with Text children reads the sentence on iOS and
  stutters every fragment on Android. You need `accessible` PLUS opting the
  children out. Applying only the first half is worse than doing nothing.
- **NEVER put `accessible` on a container whose children are Pressables** — it
  collapses them into one element and makes every control unreachable. The
  worked example (and the comment explaining it) is `CableInstallLabScreen`'s
  dots row: twelve unit-navigation buttons that would have vanished.
- **`accessibilityLiveRegion` is Android-only and system-throttled;
  `announceForAccessibility` is iOS and NOT throttled.** So you cannot
  blind-sweep one into the other. Classify by change rate: discrete events can
  be spoken verbatim, streaming values must latch on a meaningful transition,
  and a flickering source (a tuner) needs a debounce. Announcing a cents
  readout on every frame would make the app unusable, not accessible.

---

## 5 · Product and data lessons

- **A failed load is not an empty state.** "Nothing is waiting for review" when
  the read actually failed is how a queue gets ignored for a week. Distinguish
  null (refused/offline) from empty, always.
- **A secret on a row the user can read is not a secret.** A 6-digit code is
  10^6 possibilities; a hash of it on a readable row is brute-forced offline in
  milliseconds. `employer_email_verifications` therefore has RLS on, no
  policies and no grants to ANY role.
- **Never let a server fetch a host the client chose.** `/api/employers/apply`
  took `domain` from the request body with a regex that accepted `localhost`
  and `169.254.169.254` — an internal probe with an exfiltration channel.
  Derive it server-side, and guard the result anyway.
- **Two surfaces editing one thing must share one save path.** The guided
  profile flow owns no state and no rules; it receives `persist`, the togglers
  and the caps from the editor. Otherwise the caps drift out of sync with the
  server.
- **Text inputs persist on BLUR, not on change.** `persist` rolls back on
  refusal, so saving per keystroke both hammers the network and yanks
  characters out mid-sentence. And leaving a typed step must commit —
  tapping Next does not reliably blur a TextInput on RN.
- **The app must not contradict itself.** The Digital lab's flagship myth panel
  disagreed with the app's own calculator AND with another module about one
  number (144 vs 146 dB). In a teaching product that is worse than a UI bug.
- **A first question the user cannot answer is where sign-up stops.** The
  directory had no "still exploring" option, so a beginner — the core audience
  — could not answer honestly. 9 accounts, 0 profiles STARTED.

---

## 6 · Process

- **An adversarial audit finds what self-review does not.** A read-only agent
  audit of the employer chain found that my own "this is now complete" was
  wrong (the `service_role` table grants). Self-review had already passed it.
  Worth doing on anything that has never actually run.
- **Zero rows means it has never run.** Do not describe a feature as working
  because the code traces correctly. Check for data; say "never exercised" when
  that is the truth.
- **Migration files must be REPLAYABLE, not descriptive.** A migration that
  only explains its change cannot be re-applied. If a function changed, the
  whole body goes in the file.
- **A browser preview showing a blank page is usually the pane, not the code.**
  Diagnose with `{started: typeof __BUNDLE_START_TIME__ !== 'undefined',
  ready: document.readyState}`. Fix = `preview_stop` AND `tabs_close`, then
  restart both; one alone does not clear it. Full detail in the
  `reference_fast_dev_loop` memory.

---

## 7 · ⛔ BUILD ≠ SUBMIT ≠ UPDATE. Three things, and they do not touch.

The owner asked this directly and it is worth writing down, because two of the
three have silently delivered nothing this week.

| | what it does | what it CANNOT do |
|---|---|---|
| `eas build` | makes a binary on EAS | put anything in front of a tester |
| `eas submit` | sends that binary to Apple / Google | deliver JS-only fixes |
| `eas update` | swaps the JS inside an ALREADY-INSTALLED app | carry native or manifest changes |

**A finished build is not in TestFlight.** On 2026-09-19 build 23 sat finished
on EAS while every tester was still on build 22, because nobody had submitted
it. `eas submit` is a separate command, and after it Apple processes the build
AND somebody has to add it to the Internal group in the console.

**An OTA is keyed to a per-platform runtime fingerprint**, so it reaches only
the builds whose fingerprint matches. That day:

```
build 22 (what testers had)  daee7c5c…
build 23 (sitting on EAS)    e6578853…
working tree                 e6578853…
```

An `eas update` published then would have reached build 23 and NOT the testers
— succeeding, and delivering nothing. Always compare `--platform`-specific
fingerprints against `eas build:list` before publishing. See §3.

**Practical rule:** if the work is JS-only and the installed build's
fingerprint matches, OTA. If anything native or in `app.json`/`eas.json`
changed, it is a build AND a submit, and the OTA cannot help.

---

## 8 · ⛔ An RLS policy with no GRANT is inert. This has now bitten TWICE.

Postgres checks the table GRANT before it ever consults a policy. So a table
with `enable row level security`, a perfect `admin_all` policy, and no grant to
`authenticated` is not "admin only" — it is **nobody**, and the failure is a
bare "permission denied" from a code path that looked correct in review.

- `employer_profiles` — the admin RLS policy was dead, so revoking a badge was
  impossible through any client.
- `contact_reports` — same shape. Every abuse report anyone filed went into a
  hole no admin could read.

**Both were found by reading `has_table_privilege` / ACLs directly, never by a
failing test**, because in both cases the feature had never run.

The deliberate inverse is also useful: a table with RLS on, **no policies and
no grants to any role**, is unreachable except through SECURITY DEFINER
functions. That is exactly how `employer_email_verifications` and
`account_standing` keep their contents away from the people they are about.
When you do that, say so in a comment — it looks like an oversight.

---

## 9 · Smaller ones, each of which cost real time

- **Not every "level" is a volume.** Applying a 30% start to every fader would
  have broken three labs: Liquid Studio's SHAKE is an acceleration in g whose
  threshold is the lesson, the Signal Generator's −20 dBFS already IS 10% of
  full scale, and Mixing faders start at unity because unity is the lesson.
  Ask what the number MEANS before normalising it.
- **A content gap is not a search gap.** The Help filter genuinely was broken
  (it substring-matched the whole query), but "how do I cancel" still returns
  nothing afterwards, because the manual has no cancellation entry. My first
  comment claimed otherwise and only the test caught it. Fixing search cannot
  reach an answer nobody wrote.
- **Indexing a StyleSheet by a prop name silently collides.** `s[tone]` where
  tone is `'warn'` picked up the error-banner `warn` style. TypeScript was
  happy. Use an explicit map.
- **Clamping is not the same as defaulting.** Capping volume inside the shared
  tone helper would have been less code and would have made every fader lie —
  reading 70% while sounding at 30%. Move the default, not the output.
- **Say the limit before the wall.** `contact_limits()` had been callable since
  it was written and was called by nothing; every cap was discovered by hitting
  it. When you add a limit, add the read that lets the UI warn — and make an
  unknown allowance mean ALLOWED, so a dropped request never looks like a ban.
- **`git add -A` sweeps in other people's files.** A work order from A appeared
  in the tree mid-session and went into one of my commits. Harmless that time;
  check `git status` before staging everything.


## 2026-09-21 — four lessons from a Sentry sweep and a bug-fix run

**A successful response is not evidence the work landed.**
`record_study_progress` dedupes on `p_batch_id` and returns *before* reading
the payload, with a 200. The offline replay read that as "sent" and deleted
every row in the chunk, including rows the server had never seen. The server
was reporting the discard the whole time — `duplicate_batch` is in the
snapshot and in the client's own type — and nothing read it. When a server
tells you it ignored you, listen; and when you coalesce N things under one
id, one id's idempotency does not cover the other N−1.

**The obvious fix is sometimes the next bug.** Sending each queued row under
its own id is the natural remedy and would have destroyed credited study
time instead: the server clamps with `LEAST(active_seconds, now() -
last_updated)` and every call sets `last_updated = now()`. Three earlier
passes at this same logic each introduced the next fault. Extracting it to a
module with no native deps (`replayChunk.ts`) so it could finally be *tested*
was worth more than the fix itself — and the tests were checked against the
old behaviour to prove they fail, rather than assumed to work.

**When the data model changes, grep for every writer.** v3 retired courses,
`record_study_progress` got a v3 branch, and `credit_time_trial` — the only
other writer of study credit — did not. Its first line is `IF v_course IS
NULL THEN RAISE 'not_enrolled'`, and all 175 v3 topics have no course, so
passing a Time Trial has never credited anything for anyone while the UI said
it had. A caller that swallows errors by design turns a total failure into
silence.

**Stale comments are load-bearing.** The glossary formula scan carried two
confident comments — no role holds the grant, "0 of 14,246 rows" have a
formula — which made pulling the whole corpus look free. Both had quietly
become false (both roles hold it; 1,911 of 26,975 rows). The scan crossed
iOS's two-second line and Sentry logged a production app hang. Comments that
assert facts about *data* need a date and a re-check, or they become the
reason nobody looks.

**Corollary on telemetry:** dev events were tagged `environment=development`
and still sent, so 19 of 21 open Sentry issues were Metro bundler output from
a developer's own machine. Tagging noise is not the same as not producing it.

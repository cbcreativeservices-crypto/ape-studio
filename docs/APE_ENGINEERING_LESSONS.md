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

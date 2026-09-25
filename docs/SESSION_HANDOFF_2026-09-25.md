# Session handoff — 2026-09-25

**Read this first, then the `2026-09-25` sections of
`docs/APE_ENGINEERING_LESSONS.md` (there are two — one on triage, one on
mistakes).**

Repo `C:\Users\profe\dev\ape-studio`, branch `audio-tools-engine`.
Working tree clean apart from untracked images (see §5).

---

## 1 · What happens next

**The owner has the details for ONE FINAL LAB before launch, and wants to start
it in the morning.** Nothing has been designed or built. Do not start it on a
description alone.

⛔ **TWO STANDING RULES APPLY AND BOTH ARE HARD:**
1. A spec or a prompt is **not** a go. Complex lab builds need the owner to say,
   in that moment, to begin.
2. They also need **a reminder to switch to Fable** before the build starts.

So the correct opening move is to take the brief, ask the questions that change
the work, and **wait**.

Also read, before building any lab:
- **Labs NEVER block navigation**, and every lab ends with a "what's left" screen.
- **No placeholder rows** — nothing `status:'development'` in a catalog.
- The **accuracy/calibration note** belongs on every lab and tool.
- **Popups, never pulldowns.**
- ⛔ **Never add or commit image assets** without the owner naming the folder and
  giving a go, each time.

---

## 2 · Everything shipped today

**Two OTAs published to BOTH channels and verified running on the Pixel** (launch
1 downloads, launch 2 reports "No update available"):

1. The iPad reading-column pass — 39 surfaces.
2. The account fix `1cdfd56e`.

Fingerprints were checked against build 30 before each publish and matched
(`ios 64a7eddf33…`, `android 02255b7bae…`).

**The account investigation is the substantive find of the day.** Testers
reporting "never got the email" had no account at all:

    /signup 422  "Password is known to be weak and easy to guess…"   13
    /signup 200  (succeeded)                                          7

Supabase's leaked-password protection was rejecting two thirds of signups and
`friendlyAuthError` did not map that string, so the app showed only a generic
failure. No account was created, so no email was ever coming. Supabase had been
asked to send **nothing since 22 July**.

Fixed: the rejection is now named, and the reset screen says "**If** an account
exists for X…" instead of claiming a code was sent (`resetPasswordForEmail`
returns 200 for unknown addresses by design). Owner ruling: **leaked-password
protection STAYS ON** — the fix was explaining it, not loosening it.

**Also fixed:** a fatal native audio crash (`427a0897`, see §4), the amplitude
gate and all seven instrument screens capped for tablets, and the intro popups.

---

## 3 · Verified facts — do not re-derive these

- **Single-device login is LIVE**, not failing open. `claim_device` /
  `get_active_device` exist (SECURITY DEFINER). Owner ruling 2026-09-25:
  **"1 device at a time is the rule."** Settled — do not propose relaxing it.
- **The website does NOT claim a device.** `web/` never calls `claim_device`, so
  it cannot displace a phone. The one-device rule and the website plan are
  already compatible.
- **The study spine already syncs.** Progress is server-authoritative and
  event-based (`record_study_progress`), so a web client needs no new backend.
  ⛔ But calculator workflows, Cymatics artwork, bookmarks, Career Finder results
  and deck order are **device-local with no table** — user-created work that does
  not follow the user.
- **Entitlements granted directly 2026-09-25**: 22 of 23 real accounts now hold
  lifetime `academy`. ⛔ `gratis@` is deliberately EXCLUDED — it is the free-tier
  fixture and the only account that can test the paywall.
- **`launch_duration` is not the app's launch time.** It measures only the
  expo-updates startup phase; the same phase is 203 ms on the Pixel. The owner
  hand-timed a real launch: **about 3 seconds.** Nothing to optimise.
- **Filter Sentry by `environment:production`.** Unfiltered shows 21 issues;
  filtered shows 3. The rest is dev/web-preview noise, correctly tagged.

---

## 4 · Open items, owner's call

1. **Tester migration.** Build 30 is submitted and assigned; testers on build 28
   must update in TestFlight MANUALLY — OTAs cannot reach build 28's orphaned
   runtime. The nudge was sent. Until they update, they do not have the account
   fix, the iPad pass or the redeem fix.
2. **The native audio fix needs a build.** `427a0897` fixes a fatal
   EXC_BAD_ACCESS in `ApeDspModule.stopCapture` (engine stopped before touching
   `inputNode`). ⚠️ **NOT device-tested** — reproducing needs an iPad, a live
   capture and a background transition. It ships in a BUILD, never an OTA.
3. **Two hangs left in Sentry, deliberately.** `APE-STUDIO-R` and `-S`, both from
   one Cupertino session that is almost certainly Apple Beta App Review, one in
   accessibility traversal. **Owner's decision: leave them and see if they
   recur.** If real testers on build 30 do not reproduce them, let them age out.
4. **Launch-day landmine.** The website's "Forgot password" sends a link to
   `<origin>/reset-password`, which is BEHIND the pre-launch gate (`web/proxy.ts`
   allows only `/privacy`, `/terms`, `/support`, `/connect`, `/api/unlock`). It
   goes live the moment `GATE_ENABLED = false`. Also: ONE Supabase email template
   serves both reset paths — the app needs `{{ .Token }}`, the website needs
   `{{ .ConfirmationURL }}`. It must carry **both**.
5. **The Career Finder retake** was proven fixed on device; nothing outstanding.

---

## 5 · ⛔ Do not touch

- **The untracked images.** Four certificate squares and four
  `compc-*-cableinstall-*` folders are uncommitted on purpose. The cable-install
  images are explicitly **NOT APPROVED**. Never add image assets without the
  owner naming the folder and giving a go.
- **`gratis@proaudiotrainingacademy.com`** — the free-tier fixture. Do not grant
  it an entitlement.
- **The instruments' scroll containers.** Prose is capped; the analysers stay
  full width on purpose, and a guard test asserts it. Capping a scroll shrinks
  the instrument.
- **MultiMeter's `statusUnit`** stays full width — a mono status strip aligned to
  the meter it describes, not a paragraph.
- **RT60's `stoppedNote` / `saveNote`** use the CENTRED variant deliberately;
  they were already `textAlign: 'center'`.

---

## 6 · State

- **tsc clean. 1,925 tests pass** (305 suites).
- Guards added today: `test/readingColumnCapped.test.ts` (9 tests, 21 files
  pinned) and `test/authErrorCopy.test.ts` (5 tests — no real Supabase auth error
  may reach a user as the generic catch-all).
- Sentry production unresolved: **3** (see §4.3 and §4.2).
- Delivered to `Downloads/`: the device-width audit, the cross-device/website
  sync answer, the account-system investigation, the tester message, and the
  before/after pairs for the SPL meter and the amplitude gate.

---

## 7 · The two habits that paid off today

**Check the fingerprint before every `eas update`.** Done twice, matched twice,
both OTAs landed. It is the cheapest insurance against publishing into a void.

**Find out what a number measures before optimising it.** A 34-second
`launch_duration` looked like an emergency. Ten minutes in the expo-updates
source and one hand-timed launch showed it measures a different thing entirely
and the app opens in three seconds.

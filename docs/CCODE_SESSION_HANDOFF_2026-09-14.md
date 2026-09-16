<!-- ccode (Claude Code, client app) session handoff. Sibling to A's SESSION_HANDOFF_2026-09-14.md (that one is Cowork/backend — do not confuse). -->
# ccode Session Handoff — 2026-09-14 (Pro Audio Training Academy client)

**You are ccode** — the Claude Code session that owns the **`ape-studio`** client app (Expo SDK 57 RN app + Next.js `web/`). A separate **Computer A** (Cowork) owns the Supabase backend; coordinate via `docs/CROSS_SESSION_HANDOFF.md`. Working dir: `C:\Users\profe\dev\ape-studio`. Branch: `audio-tools-engine`. Re-read `AGENTS.md`, `MEMORY.md`, and the memory dir before non-trivial work.

---

## ⚠️ FIRST THING: a large body of work is UNCOMMITTED (tsc-clean, device-verified)

Everything below shipped to the Pixel and was verified live this session, but **nothing is committed**. `git status` at handoff:

**Modified**
- `src/screens/courses/CourseSelectionScreen.tsx` — Home onboarding "attract" cues (Explore/About/Enrollments).
- `src/screens/awards/AwardsScreen.tsx` — credential thumbnails in both pickers, enlarge-modal wiring, auto-scroll-to-top on card open, `slug` added to `specCertsAZ`/`programPathsAZ`.
- `docs/CROSS_SESSION_HANDOFF.md` — the A↔ccode channel (has newer A entries on disk; **`git pull`/re-read before committing** so A's entries aren't clobbered).

**New (untracked)**
- `src/features/onboarding/attractStore.ts`, `src/features/onboarding/AttractCue.tsx` — onboarding cue store + reusable components.
- `src/screens/awards/CredentialThumb.tsx` — framed thumbnail + tap-to-enlarge modal (title underneath) + faint "Simulated workplace environment" disclaimer.
- `scripts/upload-credential-cards.mjs` — uploads `cert-*/prog-*.webp` to the public `course-cards` bucket.
- `assets/credential-squares/` (102 webp = all cert+prog art), `assets/Certificate_Squares/` (32, a subset), `assets/Program_Squares/` (36) — image sources.
- `"save here before pen erases it!/"` — the pen.dev export folder the owner dropped images into (safe to delete once images are settled).
- `docs/lab-audio.edge-fn.reference.ts` — **A's** Deno reference file (NOT ccode's). It uses `Deno`/`jsr:` and makes repo-wide `npx tsc` show ~5 errors. **App code is clean** — filter with `grep -v "lab-audio.edge-fn"`, or exclude `docs/` in tsconfig.

**Before committing, get the owner's call on two things (they said "prepare handoff", not "commit"):**
1. **Images in repo vs bucket-only.** All 102 are already **live in the `course-cards` bucket** (verified HTTP 200), so the app doesn't need them in the repo. `assets/credential-squares/` is ~19 MB. Recommend: **bucket-only** → don't commit the image folders, delete the dup asset folders + the pen folder. Owner may prefer to keep a repo copy.
2. Then commit the code (onboarding + credential viewer + upload script + auto-scroll) as one or a few commits. **Must stay tsc-clean** (app files) — every commit this session was.

---

## What was built this session (all owner-approved + device-verified)

### 1. Home-screen onboarding "attract" cues — `CourseSelectionScreen.tsx` + `src/features/onboarding/`
Progressive first-run guidance, persisted device-local (AsyncStorage key `ape:homeAttract2`):
- **Explore** chip: breathing amber ring/glow + amber text until first opened (no expiry).
- **About** text button: breathing opacity + very subtle amber text-glow; stops when opened **or** 1 week after first Home view.
- **Enrollments** chip: after Explore is opened → green frame + green **animated** ring until the user adds their first topic/bundle beyond the 2 auto-seeded free topics (`FREE_ENROLL_GS = [3060,3970]`); after that, stays **static green permanently** (`enrolledOnce`).
- Gotcha fixed: the "enrolled" mark only fires **after** Explore is opened, so pre-existing enrollments don't turn Enrollments green "from the start". Reduce-motion → static fallback.

### 2. Certificate/Program viewer images — `AwardsScreen.tsx` + `CredentialThumb.tsx`
- Small **framed square thumbnail** to the RIGHT of the title in each **expanded** picker card (gold frame for certs, purple for programs). Tap → **enlarge modal**: large image + **title underneath** + "tap to close".
- Art keyed by the DB `slug`: `course-cards/<slug>.webp` (e.g. `cert-mixing-engineer-v3.webp`, `prog-live-sound-engineering-v3.webp`). Loaded via the robust `CardArt` loader.
- Enlarge view has a faint gray italic **"Simulated workplace environment"** caption on a light scrim (`rgba(0,0,0,0.19)`) — an AI-image disclaimer. Applies to both certs+programs (shared modal).
- **Auto-scroll-to-top on open**: opening a card scrolls its title+image to the top of the list. Implemented via the card's **own `onLayout`** (fires after collapse+expand settle → correct final offset; a pre-tap offset overshoots). `justOpenedCert/justOpenedProg` refs + `certScrollRef/progScrollRef`.

### 3. Images uploaded to bucket
- **102 of 159** credential images live in public `course-cards`: **66 certificates + all 36 programs**. Verified serving (HTTP 200, image/webp, 1024×1024).
- **Still needed: 57 certificate images** (123 total certs − 66). Full filename list was delivered to the owner as a CSV (`Type,Name,Filename`); filename = DB `slug` + `.webp`.
- To upload more: drop `cert-*/prog-*.webp` in a folder →
  ```
  cd C:\Users\profe\dev\ape-studio
  node scripts/upload-credential-cards.mjs <folder>   # needs SUPABASE_SERVICE_ROLE_KEY in env
  ```

---

## Open cross-session (Computer A / backend) items — from `docs/CROSS_SESSION_HANDOFF.md`
- **Lab-audio read path is LIVE** (A built it): private `lab-audio` bucket + `lab_audio_assets` manifest + `lab-upload`-style edge fn `lab-upload`... actually `POST /functions/v1/lab-audio {lab_key, asset_key}` + Bearer JWT → `{url, ext, duration_ms, samplerate, channels, access_tier}` (401 sign_in_required / 403 academy_required / 404 not_found); stream `url` via expo-audio. **ccode TODO: wire a first lab against it** (hand-inserted manifest row + test object) — not started.
- **New ccode work A flagged** (launch scope changed): (i) pick+wire a **privacy-first crash/diagnostics + analytics SDK** (Apple "tracking = No" must hold), then report exactly what it collects so A finishes the store privacy forms; (ii) wire the **LIFETIME** entitlement (Apple non-consumable / Google one-time). Neither started.
- Dictation is **on-device** (`requiresOnDeviceRecognition: true` @ `src/screens/glossary/GlossaryDictation.tsx:82`) — the store Audio-Data question is CLOSED (declare none).
- `/lab-upload` gated web route is published + committed (earlier this session, sha `a171616c`); CORS tighten (from `*` to site origin) is a one-line A redeploy pending the launch origin.

---

## Device / workflow gotchas (save yourself the pain)
- **Fast Refresh goes stale in long sessions.** New edits silently don't apply on the running dev client. Fix = **cold restart**: `adb shell am force-stop com.cbcreativeservices.apestudio` then `adb shell monkey -p com.cbcreativeservices.apestudio -c android.intent.category.LAUNCHER 1`, wait ~30s for the Metro bundle. On launch: dismiss the 16KB dev warning (use "Don't Show Again"), then Welcome sheet → Auth → **Guest Mode (FREE)** → dismiss the "Our Commitment"/Welcome sheet (tap center) → Home. Then Home chips (Explore/Certificates/Programs/…) open the Awards pager.
- **adb coords:** device screenshots are 1080×2340 shown at 923×2000 → multiply displayed coords ×1.17 for `adb shell input tap`.
- **Bucket upload needs the service_role key** (`sb_secret_…`, 41 chars). Retrieval flow that WORKS: open the Supabase API-keys page in **claude-in-chrome** (`.../settings/api-keys`), then in PowerShell bring that exact Chrome window to the OS foreground via Win32 `SetForegroundWindow` (a background tab's "Copy" button silently no-ops `navigator.clipboard`), click the "Copy API key" button, then `$k=(Get-Clipboard -Raw).Trim(); $env:SUPABASE_SERVICE_ROLE_KEY=$k` (verify only prefix+length, never print it), run the upload script, then clear the env var + clipboard. Never display/log the key.
- **Enrollment seed:** new users auto-enroll 2 FREE topics (gs 3060, 3970); "added their first topic" = anything beyond those (see `isFreeEnrollGs`).

---

## Suggested first moves for the next session
1. Read this file + `MEMORY.md` + the memory dir + `docs/CROSS_SESSION_HANDOFF.md` (top ~10 entries).
2. Ask the owner: commit the uncommitted work now? images in repo or bucket-only? Then commit (tsc-clean; `git pull` the channel first).
3. Then pick up whichever the owner wants: remaining 57 cert images, the lab-audio client wiring, or analytics/lifetime-IAP.

# Session handoff — 2026-09-22

**Read this first, then `docs/APE_ENGINEERING_LESSONS.md` (the 2026-09-22
section) and `docs/APE_BUG_HUNT_STANDARD.md`.**

Repo `C:\Users\profe\dev\ape-studio`, branch `audio-tools-engine`.
HEAD at handoff: **`4d748813`**, pushed, working tree clean apart from
untracked images (see "Do not touch").

---

## 1 · The one thing that is not done

**An `eas update` to `production` is pending.** Everything else shipped.

```
cd C:\Users\profe\dev\ape-studio; npx eas-cli@latest update --branch production --environment production --platform all --message "Profile: first-person labels, whole-academy totals now opt-in"
```

It carries commits `73346910` (first-person labels) and `4d748813` (opt-in
totals). **The owner must run it** — this session's permission guard classifies
`eas update` as a production deploy and denies it. Do not try to route around
that; hand over the command.

The Pixel needs its own publish afterwards (`--branch preview --platform
android`), because it is on the `preview` channel while the iPhones are on
`production`.

---

## 2 · What shipped today, and what it fixed

Two OTA publishes went out and were **verified running on both phones**, not
merely published.

| commit | what |
|---|---|
| `9a09158e` (prev session) | glossary formula scan filtered server-side — 27 pages → 2 |
| `7ba18965` | **the freeze the owner reported** — three causes, see below |
| `28f8b2f4` | Profile progress read 246% (clamped to a confident 100%); "Topics completed" read 410 of a 166-topic curriculum |
| `deee39ee` | the award-progress dead end |
| `76603ace` | home card titles sliced in half, card button off-screen on 375x667 |
| `73346910` | Profile labels to first person |
| `4d748813` | whole-academy totals now opt-in |

### The freeze (owner: "iphone froze when I viewed an SMS")

Sentry `APE-STUDIO-F`, "App hanging for at least 2000 ms". Three defects, each
of which alone kept it reproducible:

1. the Glossary dropped its 26,975-row corpus after **60s** in the background —
   while its own comment promised "checking a message" would not cost a reload;
2. the reload set no loading state, so it re-paged behind a fully drawn list —
   busy was indistinguishable from crashed;
3. the paging loops never yielded, so nothing queued could run.

Now: 5-minute window, loading state on re-entry, `yieldToUi()` between pages.
Guard: `test/glossaryCorpusReload.test.ts`.

### The fatal crash was already fixed

`EXC_BAD_ACCESS` in `RuntimeScheduler_Modern::updateRendering` (build 24) is the
tester's frozen phone. `src/features/updates/autoUpdate.ts` documents it fully —
the old auto-updater called `reloadAsync()` mid-render. Already fixed in tree.

---

## 3 · Verified facts — do not re-derive these

| fact | evidence |
|---|---|
| iOS runtime `e65788533c5c45fdc5b335921fa9ac4cd82b876a` | local fingerprint == build 28's EAS record == what the phones report to Sentry |
| Android runtime `78622e4e4ff904420039bd2c194b1172a2b67dee` | local == published |
| all 4 TestFlight testers on **build 28** | owner's App Store Connect screenshot |
| iPhones listen on `production`, the Pixel on `preview` | `eas.json` profiles + `build:list` |
| glossary is **26,975** rows, **1,911** carry a formula | queried live |

**The `production` branch had a rollback-to-embedded in force** ("Hold: testers
run build 27's built-in code…"). It was superseded on 2026-09-22. Check
`eas update:list` for a rollback before reasoning about what a phone is running
— a newer publish lifts it silently.

**Pixel verification recipe (adb):** launch 1 logs
`CheckCompleteAvailable → Download`; launch 2 logging `No update available`
proves it is *running* the new bundle rather than merely holding it. Filter
`adb logcat | grep dev.expo.updates` and exclude `embeddedAssetFileMap`, which
drowns everything.

---

## 4 · Open items, owner's call

- **Discovery B/C inserts** — `C:\Users\profe\OneDrive\Documents\Claude\Projects\AUDIO APP\`,
  folders `2026-09-22_A_DiscoveryB_INSERT` and `2026-09-23_A_DiscoveryC_INSERT`.
  4,883 glossary terms + 23,410 questions. **Blocked on the database password**
  — the connection string the owner supplied failed authentication, and a reset
  is pending. Scanned and safe: every destructive statement is confined to
  `99_ROLLBACK.sql`, which the runner skips. Nothing inserted yet (glossary
  still 26,975; both question sets 0). Run B first, check its `90_VERIFY`
  output, only then C.
  **The ordering concern is now satisfied** — the freeze fix is on both phones
  ahead of the +4,883 terms.
- **⛔ Rotate the Supabase database password.** Part of the old one printed into
  the session transcript when a URI parse split on the wrong `@` (the password
  contained one). A reset was already pending for the auth failure; this makes
  it necessary rather than optional.
- **`store-notifications`** edge function — owner ruled: after this build round.
  Deploy with `verify_jwt false`.
- **Subject copy ratification** — sheet delivered at
  `Downloads/2026-09-22_SUBJECT_COPY_AUDIT.md`. `SUBJECT_META_RATIFIED` stays
  live meanwhile.
- **`certificate_requires_exam`** is still `false` in `app_flags`. Owner's rule:
  flip only after the client ships. The shipped client handles both states.
- **Next build** (nothing urgent): connectorselect lab images (below),
  `autoIncrement` on the preview profile, untrack `audio_app_archive/`. That
  build will now also upload native debug symbols.

---

## 5 · ⛔ Do not touch

- **`assets/compc-group1/2/3-cableinstall-*`** — the owner said explicitly:
  *"do not use the cable install images - they are not approved."*
- **`assets/compc-group7-connectorselect-cable-cross-sections`** — approved, but
  **parked for the next build**, and wiring it is lab work needing an explicit
  go *and* a reminder to switch to Fable. 7 images map 1:1 onto Station 4's
  eight constructions; `optical` has no image. It is a design decision, not a
  swap — that station draws vector art today.
- **`assets/Certificate_Squares/*.webp`** (4 untracked) — nothing in `src/`
  references `Certificate_Squares` at all. Left alone.
- Never add/commit/delete image assets without the owner naming the folder and
  giving a go, each time.

---

## 6 · Sentry

Now configured to upload **native debug symbols on the next build**
(`SENTRY_AUTH_TOKEN` set as sensitive on the EAS `production` environment,
`SENTRY_DISABLE_AUTO_UPLOAD=false`, both verified by an actual upload).

**JS source maps for an OTA are still not uploaded** — that needs
`npx sentry-expo-upload-sourcemaps <dir>` against an export, which `eas update`
does not run. The reliable sequence is `expo export --source-maps` →
upload → `eas update --input-dir <dir> --skip-bundler`, so the published bundle
is the one whose maps were uploaded.

Litter: a release named `token-permission-check` with two ~100-byte dummy files
exists from verifying the token. `org:ci` can write but not delete, so it could
not be cleaned up. Harmless.

---

## 7 · Working rules that bit this session

- **Never hand the owner a command with an inline placeholder.** Three were run
  verbatim today. Check a pasted secret's SHAPE before writing it — a 197-byte
  "token" was a copy of the command itself.
- **Never `eas build`/`submit`/`update` on your own reading of a message.** The
  only cue is the owner saying so in the moment.
- **Published ≠ updated.** Drive the Pixel over adb and prove it; say plainly
  that the iPhone cannot be reached from here.
- **`eas update` and `expo export` both wipe the Metro cache** — stop the
  `ape-web` preview server before either, and don't run an export while the
  owner may be publishing.
- Commands to the owner start with `cd C:\Users\profe\dev\ape-studio;`.
- Deliverables go to `C:\Users\profe\Downloads\`; one file means no folder.
- A plain `git push` **publishes the live website** (Vercel's production branch
  is `audio-tools-engine`). Check whether `web/` changed before pushing.

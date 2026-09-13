# ccode session handoff — 2026-09-13 (evening)

Branch `audio-tools-engine`, HEAD `fbe2058e`, everything pushed. tsc clean,
`npm test` = 1106 passing. Two things need the OWNER; the rest is context.

---

## 1. What shipped this session (all live + pushed)

### Glossary server gateway — LIVE and a real boundary
The whole plan in `docs/APE_GLOSSARY_GATEWAY_RUN_THIS_2026_09_13.md` is applied.
- Guests get a consent-gated **temporary anonymous device key**
  (`signInAnonymously`), disposable — purged nightly after 7 days (`pg_cron`
  jobid 3, verified cascade drops the usage row with the user).
- Definitions come only through `get_glossary_definition()`, metered **14/week**
  per uid. `glossary` + `glossary_full_v` SELECT **revoked** from anon AND
  authenticated (and PUBLIC); `glossary_study_v` masked; `glossary_browse_v`
  serves a **proportional teaser** `left(def, least(120, len/2)) || '…'`.
- Proven over real HTTP: anon key alone → 401 on all three; with a device key →
  403 on the raw tables, teaser from the view, full text (metered) from the RPC.
- Client `isRealAccount()` (`src/features/commercial/realAccount.ts`) is the one
  definition of "has an account" — an anonymous session is NOT one. 20 call
  sites use it. Device-verified end to end on the Pixel.
- ⚠️ **Live state now:** 1 anonymous key (owner's phone), 10 real accounts,
  purge active. Do not read that 1 key as traffic.

Two traps worth knowing (both in memory + docblocks):
- **Guest Mode wipes the consent key BY DESIGN** — `AuthScreen.tsx:149` signs
  out + `clearLocalAccountData({total:true})`. Do NOT add the key to the KEEP
  allowlist; owner's 2026-09-01 "guest remembered in NO way" ruling.
- `glossary_consume()` had a **42702** that meant the 14/week cap never counted
  past 1 from 2026-09-10 until fixed today. Lesson: fail-open hides the failure
  — anything that fails open needs a test that the happy path HAPPENED.

### Anon-abuse protection — decision recorded, owner action pending
`docs/CCODE_ANON_ABUSE_PROTECTION_2026_09_13.md`: **Option A now** (rely on the
gate value + rate-limit + monitor), **B post-launch** (App Attest / Play
Integrity, cheaper than first estimated — one call site, edge-function path
exists), **C ruled out** (captcha webview would sit inside the consent dialog).
The reply to Computer A is in that doc / the chat. ⚠️ `check_request()` does NOT
throttle `signInAnonymously` (that hits GoTrue, not PostgREST).

### Equations & Formulas — filter revived + 61 formulas normalised
The filter was dark since built (no column grant on `formula_symbolic`); the
browse view reads it as owner → **1,911 terms** now resolve. 61 rows carried raw
LaTeX (`R = \rho \ell / A`) → normalised to the house convention
(`glossary_formula_normalise_latex`); "Conductor Resistance" now reads
`R = ρℓ / A` on the device. `docs/APE_GLOSSARY_FORMULA_NORMALISE_2026_09_13.SQL`.

### Tool DEMO screens — seven-agent design pass (`0a56fec4`)
All seven member-only tool demos in `src/components/tooldemos/` redesigned to one
visual contract (rack-key tabs, glass panels, in-SVG callouts amber/salmon/steel,
WATCH FOR/body/FIELD NOTE captions, shared amplitude ramp). Real fixes, not
paint: RTA axis extended 800 Hz → 31 Hz–16 kHz; SPL bare "dB" → dB SPL; RT60
got a real seconds axis; a Waveform a11y label bug fixed; false SignalGen
comment fixed. Harness: `localhost:8090/#tooldemopreview` (chips switch all
seven). Then the **Freq Counter Hz-vs-Pitch scene** (`fbe2058e`) was rebuilt from
the retired car-gauge arc to the shipping tuner's horizontal blade strip
(±30¢, green ±5¢ zone, flat/sharp). Full context:
`tool-demos-design-pass-2026-09-13` in memory.

---

## 2. OWNER — two things waiting on you

| Where | What | Why it's yours |
|---|---|---|
| Supabase dashboard | Read the GoTrue **per-IP anonymous sign-in rate limits** + the plan's **MAU allowance**; hand the numbers to Computer A (Option A's other half) | MCP can't read auth config; it's the one number neither session has |
| Your phone, signed in as a **member** | Device-pass the **seven tool demos** behind the real gate — nothing here was seen on real glass (demos are member-gated; the dev harness runs as guest) | Only you can open the member view |

---

## 3. Active background work (two worktrees — leave them be)

- `.claude/worktrees/silly-elgamal-057469` — the **shared-demo-chrome
  extraction** task (spawned chip): pulls the seven demos' duplicated tabs /
  panels / captions into one module with zero visual change. ⚠️ It edits
  `HzCounterDemo.tsx`, which `fbe2058e` also touched (scene-3 body only) — expect
  a small merge touch there when its PR lands.
- `.claude/worktrees/eloquent-mccarthy-d44534` (`claude/dreamy-hypatia-71463b`)
  — a separate earlier task; state unknown to this session.

If either opens a PR, review against HEAD `fbe2058e`.

---

## 4. Standing rules a new session MUST re-read before acting
`MEMORY.md` + the memory dir + `AGENTS.md`/`CLAUDE.md`. The load-bearing ones:
- **Never** `eas build`/`eas submit` without the owner's in-the-moment "go".
- Frozen backend: owner is the only DB writer; every migration this session was
  applied on an explicit owner "go" or a direct instruction — keep that bar.
- Ratified copy in `src/lib/copy.ts` is VERBATIM; add strings, don't reword.
- Device truth beats the web preview (RNW diverges: native-driver animations are
  a no-op there, `Dimensions` ignores viewport emulation). `adb` + `scrcpy`
  installed — screenshot the Pixel when the answer matters. Metro (8081/8090) is
  SHARED — check what's attached before killing it.
- Full absolute Windows paths in every owner-facing file link.

---

## 5. Not started / parked (unchanged from before)
- Native build carrying the gain-ramp tick fix — owner-gated, `docs/APE_NEXT_BUILD_CHECKLIST.md`.
- `canvaskit.wasm` (7.7 MB) rides the Android export — flagged 2026-09-13, not fixed.
- Owner-run topic-tile re-upload (`node scripts/upload-topic-tiles.mjs`, service key).

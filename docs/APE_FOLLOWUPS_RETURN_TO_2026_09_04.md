# AP&E — Return-To & Prevent register (opened 2026-09-04)

A living checklist so open actions get closed and lessons get applied, not
re-learned. Two halves: **RETURN TO** (open work to finish) and **PREVENT**
(rules to apply so the same issue never ships again). Tick items as they land;
add new lessons at the bottom of PREVENT. Owner tags: **Cháno** = the owner,
**ccode** = this app-code session, **Computer A** = the DB/governance session.

---

## RETURN TO — open actions

### ☀️ TOMORROW — pick up here with a clear head (parked 2026-09-05 at Cháno's request)
Nothing below is urgent or blocking; the app is green and pushed.

**Landed after this list was written (2026-09-05, study-method text audit):**
the "answer already in the question / no way to know the question" problem in
Fill-in-the-Blank and Matching was the sentence RULES, not the glossary — fixed
in the app and proven over all 166 topics (before/after table in
`docs/APE_STUDY_TEXT_AUDIT_2026_09_05.md`). Two owner items from it, whenever
convenient (section 4 of that doc): **5 glossary rows are duplicate terms** in
their topic (ids listed; the app guards against them), and **the MISTAKES
flashcard side** — `common_mistakes` is masked server-side for non-members
(by design), and whether the column is populated / reaches members is
unverified from ccode's anon-only vantage; the card now says why it shows the
definition. Handoff for Computer A: `docs/CCODE_TO_COMPA_MISTAKES_SIDE_2026_09_05.md`. Also from the readers:
**259 near-duplicate glossary rows** (plural/inflection twins, list in
`docs/study_text_audit_after.json` → `nearDupPairs`), and one **Matching
mechanic** observation for your device pass — tapping NEXT past an unsolved
board carried the unmatched pairs forward (pool grew 4 → 6 → 7; two clues then
had no match). Intended carry-over or a state bug? ccode did not touch it.

**Next native build — everything gated on it is now one lookup:**
`docs/APE_NEXT_BUILD_CHECKLIST.md` (Harmonograph share/save/print, image share,
certificate PDF, engine audio paths). The one config gap — no Photos permission
text for SAVE — is fixed in app.json; cut the dev build whenever you're ready.
Also 2026-09-05: a bound rack-dock key now wears its own colour (OSC 1 cyan)
instead of amber; the Tools hub tiles were rebuilt to your spec — THE TILE IS
THE SCREEN: one raised, bevelled glass per tool with the title and the display
behind it, a thin true-black recess all round with a light touch on its lip,
under one overhead light (no screws, no title plates, no chassis frame), and
every display now fills its glass edge to edge — the strip art's own bezel and
plot-top line are cropped out of view on all eight tiles. Device check: the
bevel and recess lip at 3x, and that the live tuner needle still sits on its
dial (its overlay was re-mapped to the new display window).

**Ruled 2026-09-05 — no competitor organisations in product copy (R1)**: AVIXA
now appears only as neutral ANSI citations in the Cable Dressing lab's sources
sheet ("American National Standard" header, `ANSI/AVIXA F502.01:2018 …`), and
was removed as a Career Finder data source and from the About paragraph (that
paragraph is unratified Career Finder copy). Record:
`docs/APE_GOVERNANCE_DECISIONS_2026_09_05.md`. NAMM stays (not a competitor).

**Also landed 2026-09-05 — slider pulse + amplitude-colour standard sweep**
(from your Amp-lab screenshot): every lab slider thumb now breathes (5 s: 2.5 s
brighter, 2.5 s dimmer); every LEVEL slider shows the MIDI ramp (blue → the
level's colour) instead of flat green/amber; the Amp rig's input/output traces,
the envelope contour, the de-esser detector + spectrum bars, the speech pulse +
spectrum/harmonic stems all ride `levelColor`. Traces I deliberately LEFT
identity-coded and want your ruling on: Amp device currents (gold +/purple −),
Class-D carrier/recovered overlays, the Digital lab's original/reconstructed/
error compare traces, fxAnim's dim dry-input copy, ear-training multi-clip
spectra, noise-colour identities, FM sideband lines, tuning beat tones,
EQ/filter response curves, the Harmonics live slice. Say "ramp them too" for
any of these and it is a small change.

In order:
1. **Explore subject descriptions** (C1-02) — 49 of 50 subjects show no
   description/careers because `src/data/subjectMeta.ts` is keyed on retired v2
   names. Your words: author the 50 v3-keyed lines (or say "soften the intro"
   and ccode will).
2. **Free-tier study progress** (F2-01, server half) — approve the pending
   free-tier RPC amendment so free/guest study writes land (the app now shows
   the honesty notice meanwhile).
3. **Lab-menu counts** (D1-10) — should "3 Labs" include planned labs? Say
   yes/no and ccode applies it.
4. **Directory 500** (K2-02) — hand to Computer A (server logs) to identify the
   endpoint.
5. **Small design nits, all filed with a recommendation** in
   `docs/APE_BUG_HATER_NIGHT_2026_09_04.md` → "Left as filed": Finder
   review-mode exit (B1-07), "you may not have considered" copy (B1-08),
   family-list rank label/sort (B1-09), Explore stat tiles (C1-07), Tuning
   ch.1 duplicate STOP (D1-08), flashcards 1% / empty-deck buttons / blank
   trophy square (F2-02/03/04), EQ GAIN/Q dimming (I2-03), Directory sign-in
   cue (K2-04). Say "do them" and ccode takes the defaults.
6. **Device pass** (whenever): earned trophies/certs, the study loop past
   Flashcards, Tube cards, Directory end-to-end, the Auth screen — list in the
   night doc.

### 🌙 Bug + Hater Night — 2026-09-04 → 05 (ccode, unattended while Cháno was away)
**In one line:** 12 agents crossed every screen with a bug lens and a
1-star-review lens; **32 fixes pushed** (one commit each, tsc + 228 tests green
every time), **37 items filed for your judgment**, all 29 of Computer A's
accuracy fixes verified on screen, and a fresh-bundle re-attack passed 20/21
(the 21st was fixed on the spot).
**Read this first:** `docs/APE_BUG_HATER_NIGHT_2026_09_04.md` → "For the owner
this morning" — five things that need you, in plain language, then the rest.
Report page: https://claude.ai/code/artifact/485a86ea-b220-4899-b93e-0edc9f581c5e
**Fixes you'll feel:** the Home carousel's centered card button was dead on web;
Back from a NEXT-UP credential dumped you to the Trophy Case; a stray keyboard
"Done" bar scrolled every header off-screen on web; the Career Finder's STUDY
NOW button was dead; the calculator workflow could chain the wrong quantity
into a field silently; Mic Selection tiles were unlabeled for screen readers.
**The five for you:** (1) free/guest study progress fails silently — decide the
pending free-tier RPC amendment + add an honesty banner; (2) 49 of 50 Explore
subjects have no description (`subjectMeta` is keyed on old v2 names); (3) the
glossary auto-linker sends "source" to a transistor definition; (4) Career
Finder guest answers are wiped vs "your answers stay on this phone"; (5) the
Enrollments core-topic trap after REMOVE ALL.
**Coverage honesty:** no real signed-in account exists on web, so earned
trophies/certs, the study loop past Flashcards, Tube cards, Directory publish,
and the Auth screen are on the device-pass list in the doc.
**Follow-up (Cháno 2026-09-05: "fix what is needed"):** 11 more fixed on my
recommended defaults (`deb1632`…`29f6f6d`) — the Dashboard now tells guests
progress isn't saved; the glossary no longer links "source" to a transistor;
the Career Finder's answers survive a guest re-entry; cores drop with the last
credential; the curriculum is fetched once per session; FULL CHAIN lights all
nine; FINISH leaves the lab. **Still yours:** the 50 v3 subject descriptions
(C1-02), lab-menu planned-lab counts (D1-10), the Directory 500 (Computer A),
and the free-tier RPC amendment (backend).

### Security workstream (app-layer audit, 2026-09-04)
- [ ] **Rebuild the dev/native client** to activate the encrypted keychain, then
  verify the session PERSISTS across an app restart on device. NOTE: the app
  now BOOTS without a rebuild — a stale client falls back to AsyncStorage
  (it used to red-screen at import: `Cannot find native module 'ExpoSecureStore'`,
  fixed by loading expo-secure-store through a guarded require). The rebuild is
  only to move the session from the AsyncStorage fallback into the keychain
  (the actual security win). — Cháno (build) + ccode (verify)
- [x] **Web-gate secrets SET + REDEPLOYED 2026-09-04.** `GATE_UNLOCK_KEY` and
  `GATE_COOKIE_TOKEN` added (Secret type) to the `web` Vercel project across
  Production/Preview/Development; Cháno pasted the values, a Production redeploy
  ran and is Ready, and the live site (`web-liard-alpha-21.vercel.app`) renders
  the unlock gate cleanly (no fail-closed error). ccode drove the Chrome form +
  generated the values but did NOT type the secret values (hard safety rule).
  Values recorded below for rotation reference:
  - `GATE_UNLOCK_KEY`  = `uGt7N7ZnSEpkIuM5QNTerswx`
  - `GATE_COOKIE_TOKEN` = `IDhfCXiyN5fSYiUw4qaWMvqb0TYt6GXw`
  Vercel: Project → Settings → Environment Variables → add each (all envs:
  Production/Preview/Development) → Save → **Redeploy** (env vars only bind on a
  new deploy). Treat these as secrets (rotate if they leak).
- [x] **Schema-isolation Phase 1 — SHIPPED + DEVICE-VERIFIED 2026-09-04.** Spec
  (`CCODE_APP_CHANGE_SPEC_schema_isolation_2026_09_04.md`); the 3 identity reads
  (`profile/api.ts` ×2, `SettingsScreen.tsx` ×1) go through `my_identity()`.
  tsc clean, RPC live, and the owner confirmed on device: Profile (QR + student
  id) and Settings (APE id) render correctly with a real session. **PHASE 1 CLOSED
  2026-09-04** — Cháno (Claude chat) applied `10c_APPLY_REVOKE.sql` +
  `90_VERIFY.sql`; the app reads those identity columns only through
  `my_identity()`, direct-column grants revoked. Future phases may
  move `entitlements`/`credential_awards` similarly — wait for each spec.
- [ ] **Route to Computer A for the hardening plan:** `validate-purchase` decodes
  Apple's `signedTransactionInfo` JWS WITHOUT verifying its signature (relies on
  TLS + the authenticated App Store endpoint). Common and acceptable; note it. — Computer A
- [x] **vibe-security skill untracked 2026-09-04 (ccode).** `.agents/`,
  `.claude/skills/`, `skills-lock.json` added to `.gitignore` (tooling, not app
  source; the `skills` CLI manages them). `.claude/launch.json` + `settings.json`
  stay tracked. Files kept on disk.

### Audio Career Finder (built + APPROVED 2026-09-04)
**Owner: "I looked and the Career Finder is approved" (2026-09-04).**
- [x] Copy sheet `docs/APE_CAREER_FINDER_COPY_2026_09_04.md` (D1–D12 + the 42
  family descriptions) — APPROVED.
- [x] Question wording + the "Neutral" label — APPROVED as-is (the six proposed
  rewordings were optional; current wording stands, nothing to apply).
- [x] Owner reviewed + approved 2026-09-04. (No deeper device QA requested; the
  general on-device pass stays with the postponed testing batch if ever wanted.)
- [x] **Curriculum links fixed 2026-09-04 (ccode).** The four "Professional
  Practice" families' workbook topic columns didn't resolve to v3 topics (Music
  Curation got none). Added a validated `topicGs` override map in
  `scripts/career-index-overrides.json` (build validates every gs against active
  v3) giving each family intentional links; index rebuilt. Owner may adjust the
  picks — they are recommendations, not the workbook's own choices. — Cháno (optional)
- [x] Governance doc `docs/APE_GOVERNANCE_DECISIONS_2026_09_04.md` R1–R7 —
  APPROVED with the Career Finder 2026-09-04.

### v1 removal finish — the Achievements trophy wall
**Owner escalated 2026-09-04; BUILT + preview-verified same day (commit
`8625da4`).** The Achievements screen was fully redesigned for v3: a "Trophy
Case" hub with three categories — Topics (Home → Field → Subject → grid, so the
166 topics are never on one screen), Certificates, Programs (earned-only walls
from `credential_awards`). Verified end-to-end in the 8090 web preview
(hub → fields → subjects → grid; "0 / 166" live; empty states honest). The
`fetchAchievements`/`fetchGallery` repoint off `courses` was done as part of it
(new `src/features/achievements/api.ts`; old grid deleted). See assistant memory
[[achievements-v3-redesign-2026-09-04]]. **STILL OWED (Cháno):** device pass with
a progressed account + supply trophy art for certs/programs (drop PNGs +
`credentialArt.ts` entries; topics use `achievements.icon_url` as today).

- [ ] **`DROP_V1_SCAFFOLDING` — RATIFIED (safe defaults), app fully unblocked.**
  Cháno chose "go with the safe defaults" 2026-09-04 → package runs as authored
  (incl. optional stage 30 badge-rows deletion; active-day count for the hidden
  `total_study_sessions`; `lookup_student_by_qr` kept). NEXT: Computer A
  sanity-checks the rewrites/drops, then Cháno runs it file-by-file in Supabase.
  Decision sheet: `docs/APE_V1_REMOVAL_DECISION_SHEET_2026_09_04.md`
  — the twelve DB functions (7 rewrite / 5 drop) each with ccode's recommendation
  + Agree/Change/Ask, the two 🔴 judgment calls (`refresh_student_metrics`
  replacement number; the optional badge-rows deletion), the run order, and the
  irreversibility note. **Both former app blockers are now RESOLVED** —
  `profile/api.ts` (by the Achievements v3 redesign) and `dashboard/api.ts`
  (`course_id` already gone); verified no app query hits the dropped tables and
  no app code breaks on the rewritten RPCs, so **no app change is needed before
  any stage, incl. 50/80.** NEXT: Cháno + Computer A ratify the twelve, then
  Cháno runs the package (Supabase SQL editor). See [[v1-removal-2026-09-03]].

### Housekeeping / backup (uncommitted at 2026-09-04)
- [x] **Loose artifacts backed up 2026-09-04** — `TASK10_COMPUTERC_2026_09_03/`,
  `TOPIC_NAME_CODIFY_2026_09_03/`, and `docs/APE_CCODE_HANDOFF_2026_08_30.md`
  committed + pushed (secret-scanned clean).
- [ ] Still uncommitted, the owner's WIP (ccode won't commit unbidden): the web
  `connect` feature (`web/app/connect`, `web/components/connect`,
  `web/lib/connect.ts`, `SiteChrome.tsx`, plus edits to `layout.tsx` /
  `robots.ts` / `sitemap.ts` / `proxy.ts`) and edits to
  `docs/APE_BUGBOT_FOLLOWUP_2026_08_28.md` + `APE_GOVERNANCE_DECISIONS_2026_08_06.md`.
  Commit when ready. — Cháno

---

## PREVENT — rules to apply going forward

### Security (from the app-layer audit)
1. **Auth tokens NEVER in AsyncStorage.** Use `src/lib/authStorage` (SecureStore
   on native via the chunked adapter, AsyncStorage on web). AsyncStorage is
   plaintext on disk.
2. **No hardcoded fallback secrets** — passwords, cookie tokens, keys — in
   source. Read from host env; FAIL CLOSED (unguessable per-process value) when
   unset, never a repo-visible default. A fixed cookie/token can be forged to
   skip the password entirely.
3. **Example env files carry placeholders only**, never real values (even the
   anon/publishable key, which is safe but sets the wrong precedent).
4. **`service_role` NEVER in the app or web bundle** — only in server-side edge
   functions (Deno) reading it from the function env. The client uses the
   publishable/anon key, and RLS is the wall.
5. **Client entitlement/paywall is UI only.** The server (RLS + RPC) is the
   authority on every price, tier, role, and gate. A client that merely hides
   paid content is not a gate. Purchases verify server-side
   (`validate-purchase`), never client-granted.
6. **Locked-gate rule.** Never open or widen client/anon access, rotate keys, or
   change access-affecting build/config WITHOUT the owner's explicit prior
   approval. Locking down is fine; opening is not. An audit reports; it does not
   open anything.
7. **Don't touch the hardened DB objects** (Computer A's layer): the 3 definer
   views (`glossary_full_v` / `glossary_study_v` / `mic_catalog_public`), the 5
   locked functions' grants, `gs3081.applicable_methods` (stays `[]`). The DB is
   Cháno-writes-only.

### Testing on the 8090 web preview (cost real time this session)
8. Synthetic `element.click()` is swallowed inconsistently by RN-web — drive
   buttons with dispatched pointer events (`pointerdown`+`pointerup`+`click`).
   `__r.getModules()` is EMPTY in this Expo web build (seed state via
   `localStorage`, not the registry). A HIDDEN browser pane throttles page
   timers (answer-loops stall) — front the pane or chunk the work. After an
   edit, confirm the served bundle actually contains it before re-testing.
   (Full detail in assistant memory `dev-mode-and-testing`.)

### Process
9. Green `tsc --noEmit` + `npm test` before every commit; verify observable
   changes in the preview; state plainly what still needs a device pass. Skills
   with a "high risk" scanner flag but docs-only contents (no scripts/network)
   are safe to run — verify the contents, don't rely on the badge.

---

*Sources: assistant memory `security-workstream-2026-09-04`,
`career-finder-2026-09-04`, `dev-mode-and-testing`, `integrity-and-governance`;
`docs/APE_GOVERNANCE_DECISIONS_2026_09_04.md`;
`docs/APE_CAREER_FINDER_COPY_2026_09_04.md`.*

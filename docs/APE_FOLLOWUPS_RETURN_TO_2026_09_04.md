# AP&E — Return-To & Prevent register (opened 2026-09-04)

A living checklist so open actions get closed and lessons get applied, not
re-learned. Two halves: **RETURN TO** (open work to finish) and **PREVENT**
(rules to apply so the same issue never ships again). Tick items as they land;
add new lessons at the bottom of PREVENT. Owner tags: **Cháno** = the owner,
**ccode** = this app-code session, **Computer A** = the DB/governance session.

---

## RETURN TO — open actions

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

### Audio Career Finder (built 2026-09-04, still owner-owed)
- [ ] Ratify `docs/APE_CAREER_FINDER_COPY_2026_09_04.md` — the 12 deviations
  (D1–D12) and the 42 family descriptions. — Cháno
- [ ] Decide the six proposed question rewordings + the "Neutral" label (copy
  sheet §4; NOT applied because the brief said "exactly"). — Cháno
- [ ] Device pass on the phone build (web preview proved bundle + logic only). — Cháno
- [x] **Curriculum links fixed 2026-09-04 (ccode).** The four "Professional
  Practice" families' workbook topic columns didn't resolve to v3 topics (Music
  Curation got none). Added a validated `topicGs` override map in
  `scripts/career-index-overrides.json` (build validates every gs against active
  v3) giving each family intentional links; index rebuilt. Owner may adjust the
  picks — they are recommendations, not the workbook's own choices. — Cháno (optional)
- [ ] Governance doc `docs/APE_GOVERNANCE_DECISIONS_2026_09_04.md` R1–R7 to
  ratify. — Cháno

### v1 removal finish — the Achievements trophy wall
**Owner escalated 2026-09-04:** the pure backend-sequencing repoint (below) is
POSTPONED, but the Achievements SCREEN is being fully **redesigned for v3 now** —
three tracked categories (topics 166 / certificates / programs), reorganized nav
(no single 166-trophy wall), trophy art owner-supplied in a later session.
Design-agent blueprint → build → owner device review. See assistant memory
[[achievements-v3-redesign-2026-09-04]]. The repoint of `fetchAchievements`/
`fetchGallery` off `courses` happens AS PART OF this redesign (v3 reads).

- [ ] **(POSTPONED) Backend `DROP_V1_SCAFFOLDING` sequencing.**
  Investigated 2026-09-04 (ccode): the old grid was NOT a mechanical column swap. The
  `courses!inner` join in `src/features/profile/api.ts` (`fetchAchievements`,
  `fetchGallery`) is what currently scopes the trophy grid to **v1**
  achievements, and the whole Achievements/album system is v1-sized:
  `GRID_SLOTS = 50` and `ALBUM_DENOMINATOR = 50` match v1's ~50 course-sequenced
  trophies, and each tile's `position` is the raw `global_sequence`. v3 has 166
  active topics with `global_sequence` 3000–4740, so a naive repoint indexes
  `position − 1` (≈3000+) into a 50-slot grid and renders an EMPTY wall, and the
  "X / 50" / full-course % math no longer means anything. Doing it right is a
  redesign of the v3 trophy wall + album tiers (how many slots, grouped by field?
  paginated? what replaces course code/colour — recommend `subject` + a stable
  per-field palette), which is a design call for Cháno. **Not urgent:** nothing
  breaks until `DROP_V1_SCAFFOLDING` runs, which is itself parked on the twelve
  DB-function decisions ([[v1-removal-2026-09-03]]). Bundle #2 into that thread
  and give the trophy wall a proper v3 design then, rather than guessing now. —
  Cháno (design direction) + ccode (build)

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

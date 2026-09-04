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
- [ ] **Set the web-gate secrets in Vercel:** `GATE_UNLOCK_KEY` and
  `GATE_COOKIE_TOKEN` (high-entropy, not the old `audio2026` /
  `unlocked-ape-2026`). Until set, the live gate FAILS CLOSED (site locked).
  Or set `GATE_ENABLED=false` in `web/lib/gate.ts` to go public at launch. — Cháno
- [x] **Schema-isolation Phase 1 — SHIPPED + DEVICE-VERIFIED 2026-09-04.** Spec
  (`CCODE_APP_CHANGE_SPEC_schema_isolation_2026_09_04.md`); the 3 identity reads
  (`profile/api.ts` ×2, `SettingsScreen.tsx` ×1) go through `my_identity()`.
  tsc clean, RPC live, and the owner confirmed on device: Profile (QR + student
  id) and Settings (APE id) render correctly with a real session. **NEXT
  (Cháno):** tell Claude chat it's shipped + verified, then run
  `10c_APPLY_REVOKE.sql` then `90_VERIFY.sql`, return the CSV. Future phases may
  move `entitlements`/`credential_awards` similarly — wait for each spec.
- [ ] **Route to Computer A for the hardening plan:** `validate-purchase` decodes
  Apple's `signedTransactionInfo` JWS WITHOUT verifying its signature (relies on
  TLS + the authenticated App Store endpoint). Common and acceptable; note it. — Computer A
- [ ] Decide whether the committed `vibe-security` skill (`.agents/skills`,
  `.claude/skills`, `skills-lock.json`) should stay tracked or be gitignored. — Cháno

### Audio Career Finder (built 2026-09-04, still owner-owed)
- [ ] Ratify `docs/APE_CAREER_FINDER_COPY_2026_09_04.md` — the 12 deviations
  (D1–D12) and the 42 family descriptions. — Cháno
- [ ] Decide the six proposed question rewordings + the "Neutral" label (copy
  sheet §4; NOT applied because the brief said "exactly"). — Cháno
- [ ] Device pass on the phone build (web preview proved bundle + logic only). — Cháno
- [ ] Workbook: hand-pick 3 topics for the four "Professional Practice" families;
  Music Curation & Editorial has no topic links. Then rerun
  `scripts/build-career-index.py`. — Cháno (+ ccode to rebuild)
- [ ] Governance doc `docs/APE_GOVERNANCE_DECISIONS_2026_09_04.md` R1–R7 to
  ratify. — Cháno

### Housekeeping / backup (uncommitted at 2026-09-04)
- [ ] Decide backup for the owner's uncommitted WIP: web `connect` feature
  (`web/app/connect`, `web/components/connect`, `web/lib/connect.ts`,
  `SiteChrome.tsx`, plus `layout.tsx`/`robots.ts`/`sitemap.ts`/`proxy.ts`), and
  the untracked `TASK10_COMPUTERC_2026_09_03/` + `TOPIC_NAME_CODIFY_2026_09_03/`
  folders. Push is the backup; ccode won't commit owner WIP unbidden. — Cháno

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

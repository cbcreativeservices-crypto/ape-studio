# Server findings from the 2026-10-03 deep dives: for Comp A

**From:** ccode, 2026-10-03.
**Status:** NOT applied. These are proposals only. **The owner decides** before A applies any of them.

Every live check was read-only (SELECT / pg_get_functiondef on yjgolswjggmlpeowvtxr). Before applying anything, diff each item against the live function. Test each change inside a transaction that you roll back.

## HIGH

### H1 · `employer_confirm_work_email`: the 6-attempt brute-force limit never counts
- **The bug:** the function runs `update … attempts = attempts + 1`, then `raise exception 'that code is not right'`.
- **Why it fails:** the raise rolls back the increment, so `attempts` never goes above 0. A 6-digit code can be guessed without limit for 30 minutes.
- **Exposure:** `authenticated` can call the RPC directly.
- **Evidence:** `select pg_get_functiondef('public.employer_confirm_work_email(uuid,text)'::regprocedure);`. There are 0 applications today.
- **Proposed fix:** return outcomes instead of raising, so the increment commits.
  ```sql
  if v.expires_at < now() then return query select 'expired'::text, '{}'::text[]; return; end if;
  if encode(extensions.digest(p_id::text||':'||coalesce(p_code,''),'sha256'),'hex') <> v.code_hash then
    return query select 'wrong_code'::text, '{}'::text[]; return;
  end if;
  ```
  `employer-confirm-email/index.ts` and the web form must then handle `wrong_code` and `expired` as 400 responses.

### H2 · A banned or suspended member can republish
- **The bug:** `community_profile_publish`, `community_profile_set_discoverable` and `community_profile_set_contact` never call `account_restricted(me)`.
- **Also:** `directory_search` and `community_profile_public` don't filter restricted users.
- **Proposed fix:**
  ```sql
  -- top of the p_on branch of publish / set_discoverable / set_contact:
  if public.account_restricted(me) then raise exception 'your account is restricted' using errcode='42501'; end if;
  -- in directory_search (visible) and community_profile_public:
  and not public.account_restricted(cp.user_id)
  ```
- **Evidence:** `select count(*) from community_profiles cp where published and account_restricted(cp.user_id);` returns 0 today.

### H3 · `community_profiles` and its child tables grant direct INSERT/UPDATE/DELETE to `authenticated`
- **The bug:** the own-row ALL policy plus these grants let a member PATCH their own row directly. That bypasses every RPC check: age attestation, the minor check, publishing requirements, `needs_identity_review`, contact verification, the ban, and display_name filtering.
- **Client impact of the fix:** none. The app writes only through RPCs.
- **Proposed fix:**
  ```sql
  revoke insert, update, delete, truncate on public.community_profiles, public.community_profile_areas,
    public.community_profile_specialties, public.community_profile_roles, public.community_profile_open_to,
    public.community_profile_languages, public.community_profile_credentials from authenticated;
  ```
- **Evidence:** `select table_name, privilege_type from information_schema.role_table_grants where table_schema='public' and grantee='authenticated' and table_name like 'community_profile%';`

## MEDIUM

### M1 · A revoked employer can keep messaging
- **The bug:** `contact_message_send` never checks employer revocation.
- **Proposed fix:** after the `other :=` line:
  ```sql
  if exists (select 1 from employer_profiles where user_id = me and revoked_at is not null)
     and not exists (select 1 from community_profiles where user_id = me and published) then
    raise exception 'this conversation is closed' using errcode='22023';
  end if;
  ```

### M2 · A flagged name or About on an already-published profile stays searchable
- **Proposed fix:** add `and not cp.needs_identity_review` to `visible` in `directory_search`.

### M3 · Re-earning a credential after a refund-revoke reports "issued" but never reinstates it
- **The bug:** in `submit_final_exam` and `release_pending_credentials`, `ON CONFLICT … DO NOTHING` hits the revoked row, yet `v_awarded := true`.
- **Status:** latent; 0 award rows exist today.
- **Proposed fix:** apply this to both functions. In `release_pending_credentials`, use `r.submitted_at` for `earned_at` and count only live rows.
  ```sql
  INSERT INTO credential_awards(user_id,credential_type,credential_id,earned_at,issued_at,source)
  VALUES (v_user,a.award_type,a.award_id,now(),now(),'earned')
  ON CONFLICT (user_id,credential_type,credential_id) DO UPDATE
    SET revoked_at=NULL, revoke_reason=NULL, earned_at=EXCLUDED.earned_at, issued_at=now(), source='earned'
    WHERE credential_awards.revoked_at IS NOT NULL AND credential_awards.revoke_reason='refund';
  GET DIAGNOSTICS v_rc = ROW_COUNT;
  v_awarded := (v_rc > 0) OR EXISTS (SELECT 1 FROM credential_awards
    WHERE user_id=v_user AND credential_type=a.award_type AND credential_id=a.award_id AND revoked_at IS NULL);
  ```
  A fraud hold (any `revoke_reason` other than 'refund') is deliberately not cleared.

## LOW / hardening
- **`set_registry_listing`:** add, in the `p_on` branch:
  - `if not public.directory_about_is_safe(p_bio) then raise exception 'remove contact details from your bio' using errcode='22023'; end if;`
  - `if public.directory_known_minor(v_user.id) then raise exception 'listing is limited to members 18 or older' using errcode='42501'; end if;`
  - `registry_name` is directly updatable through the users column grant, with no blocklist.
- **`contact_request_send`:** also refuse when a pending request exists in the reverse direction: `or (from_user=target and to_user=me)`.
- **`contact_request_respond`:** add the `account_restricted(me)` check.
- **Employer tables:** `revoke select on public.employer_profiles from authenticated; revoke select on public.employer_profile_interests from anon, authenticated;`. Nothing reads them directly; they expose public.users.id.
- **`contact_report`:** when given both `p_token` and `p_request_id`, check that the caller is in that thread.

## BEFORE flipping `app_flags.certificate_requires_exam` (the paid-month rule, currently OFF)
1. Nothing calls `release_pending_credentials` or `discard_unreleased_credentials`: there is no cron job and no edge function. Held papers would never be released. Schedule it first.
2. The flag-false branch of `evaluate_user_credentials` checks 4 stale hard-coded achievement ids (gs 100, 120, 1590, 51; drafts or archived).
3. Programs: `award_required_topics` / `award_complete` require every topic, while `evaluate_user_credentials` asks for the required topics plus one elective. Harmless today (no program has electives).
EOF
cp docs/COMP_A_SERVER_FINDINGS_2026_10_03.md "C:/Users/profe/Downloads/2026-10-03_COMP_A_SERVER_FINDINGS.md"
L=$(grep -n "ccode · d44fcee4" docs/CROSS_SESSION_HANDOFF.md | cut -d: -f1); A=$((L+2)); N=$((L+3)); sed -i "${A}s/.*/affects other side: YES, pending OWNER approval — server findings (3 HIGH security: employer code brute-force, banned users can republish, direct-write grants on community_profiles) in docs\/COMP_A_SERVER_FINDINGS_2026_10_03.md. NOT applied. App changes NOT published./; ${N}s/.*/needs: owner go, then A to apply + still migration 2026100301./" docs/CROSS_SESSION_HANDOFF.md
git add docs/COMP_A_SERVER_FINDINGS_2026_10_03.md docs/CROSS_SESSION_HANDOFF.md && git commit -q -m "Docs: server findings from deep dives for Comp A (owner to approve); sync stub

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" && git push -q origin audio-tools-engine && git log --oneline -2
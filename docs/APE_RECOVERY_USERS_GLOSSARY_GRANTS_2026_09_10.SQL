-- ===========================================================================
-- APE — P0 RECOVERY (2026-09-10): restore SELECT grants on users + glossary.
--
-- SYMPTOM: login AND create-account fail on every account / every device; the
-- glossary is empty. Postgres logs show "permission denied for table users"
-- (and glossary) right after sign-in.
--
-- ROOT CAUSE: the `authenticated` (and `anon`) role lost the base SELECT
-- privilege on public.users and public.glossary — a GRANT-level lockdown (not an
-- RLS policy change; RLS is still ON and correct on both). The app reads BOTH
-- tables directly (profile/entitlement/internal-user-id read users;
-- loadAllEntries reads glossary), so without the grant every post-login read
-- 400s with "permission denied" and the app can't hydrate — which reads as
-- "login won't work". This was almost certainly the on-hold schema-isolation
-- workstream (users/glossary lockdown) applied without the client being migrated
-- off direct reads. It was NOT caused by the A-1 RLS fix or the realtime SQL
-- (logins succeeded AFTER those ran; the grant loss came later).
--
-- WHY THIS IS SAFE (no cross-user exposure): RLS remains enabled + intact —
--   users:    own_user (auth_id = auth.uid()) → a user reads ONLY their own row.
--   glossary: anon_read_glossary / ref_read_glossary → public-read content.
-- The base grant is exactly what those policies assume; restoring it returns the
-- app to its working, RLS-protected state. It does NOT re-open cross-user access.
--
-- Idempotent. No row data touched.
-- ===========================================================================

-- users is PII — authenticated only (RLS own_user scopes it to the caller's row).
-- anon does NOT need it (the app never reads users pre-auth; own_user yields no
-- rows for a null uid anyway).
grant select on public.users to authenticated;

-- glossary is public content read both signed-in and anonymously (PublicGlossary).
grant select on public.glossary to anon, authenticated;

-- ---------------------------------------------------------------------------
-- VERIFY after running (expect true / true / true):
--   select has_table_privilege('authenticated','public.users','SELECT')     as users_auth,
--          has_table_privilege('authenticated','public.glossary','SELECT')  as gloss_auth,
--          has_table_privilege('anon','public.glossary','SELECT')           as gloss_anon;
-- Then log in on the phone — profile/dashboard should hydrate and the glossary load.
-- ---------------------------------------------------------------------------

-- ⚠️ COORDINATE: this restores grants the schema-isolation workstream likely
-- revoked on purpose. RLS already prevents cross-user reads, so the isolation's
-- security goal is met WITHOUT revoking these grants. If that workstream wants to
-- remove direct table access entirely, the CLIENT must first be migrated off
-- `supabase.from('users')` / `supabase.from('glossary')` reads (e.g. via RPCs) —
-- do NOT re-revoke until then or this lockout returns.

-- ===========================================================================
-- APE — RE-GRANT APP READ/WRITE PRIVILEGES (repair tool, 2026-09-10)
--
-- PURPOSE: restore the base table grants the app depends on, after a migration
-- (e.g. curriculum table drop/recreate) silently drops them. A recreated table
-- does NOT inherit its old GRANTs — RLS policies survive but the base privilege
-- is gone, so every client read 400s with "permission denied for table …".
-- This bit us 2026-09-10 (users + glossary → login/signup/glossary all down;
-- docs/APE_RECOVERY_USERS_GLOSSARY_GRANTS_2026_09_10.SQL). Run this whole file
-- after any schema/curriculum migration to put every app grant back in one paste.
--
-- SAFE BY CONSTRUCTION: every table below has RLS ENABLED with policies, so a
-- SELECT grant only lets a role read what RLS already permits — per-user tables
-- stay own-row (auth.uid()), public tables stay public. Idempotent (GRANT is a
-- no-op if already held). Touches NO row data.
--
-- ROLES: `anon` (logged-out) gets SELECT only on genuinely PUBLIC content;
-- everything per-user/PII is `authenticated` only (RLS scopes to the caller).
--
-- ⚠️ DELIBERATELY EXCLUDED — do NOT add these: quiz_questions, quiz_attempts,
-- quiz_attempt_items, final_exam_attempts, final_exam_attempt_items,
-- scenario_homework. The client never reads them directly — they are served
-- ONLY through SECURITY-DEFINER RPCs (start_quiz_attempt / start_final_exam /
-- get_scenario_items, which bypass RLS). Granting client SELECT on them could
-- expose graded answer keys / attempt internals. Leave them RPC-only.
-- Also excluded: audit_log, contact_* (admin/support), courses / course_sections
-- / instructor_sections / enrollment (retired institutional model), and all
-- *_backup / staging tables.
-- ===========================================================================

-- ── SECTION 1 — PUBLIC CONTENT: anon + authenticated ──────────────────────
-- Readable logged-out (PublicGlossary) and signed-in. Curriculum/browse content.
grant select on
  public.glossary,
  public.glossary_topics,
  public.glossary_media,
  public.achievements,
  public.programs,
  public.certificates,
  public.program_topics,
  public.certificate_topics,
  public.directory_areas,
  public.directory_open_to,
  public.directory_roles,
  public.directory_specialties,
  public.directory_specialty_areas,
  public.directory_specialty_curriculum_map
to anon, authenticated;

-- ── SECTION 2 — AUTHENTICATED READS (per-user + reference) ────────────────
-- RLS scopes per-user tables to the caller's own rows; reference tables are
-- readable by any signed-in user.
grant select on
  public.users,
  public.entitlements,
  public.credential_awards,
  public.student_achievement_progress,
  public.student_method_progress,
  public.student_badges,
  public.student_lab_progress,
  public.calc_usage,
  public.tool_usage_log,
  public.session_logs,
  public.performance_metrics,
  public.notification_preferences,
  public.notification_concept_subscriptions,
  public.notification_concept_deliveries,
  public.notification_log,
  public.notification_concepts,
  public.registry_consent_events,
  public.community_profiles,
  public.community_profile_areas,
  public.community_profile_credentials,
  public.community_profile_languages,
  public.community_profile_open_to,
  public.community_profile_roles,
  public.community_profile_specialties,
  public.mic_calibration_contributions,
  public.active_device,
  public.curriculum_versions,
  public.study_methods,
  public.labs,
  public.tubes,
  public.badges,
  public.award_standing_requirements
to authenticated;

-- ── SECTION 3 — KNOWN DIRECT WRITES (client mutates these, not via RPC) ────
-- RLS with_check scopes each to the caller's own rows.
grant update           on public.users                             to authenticated; -- registry_name
grant insert, update   on public.notification_preferences          to authenticated;
grant insert, update, delete on public.notification_concept_subscriptions to authenticated;
grant insert           on public.mic_calibration_contributions     to anon, authenticated; -- anon calibration contribution

-- ---------------------------------------------------------------------------
-- VERIFY — expect EMPTY (every app-read table has its authenticated SELECT back):
-- ---------------------------------------------------------------------------
-- select unnest(array[
--   'users','glossary','glossary_topics','glossary_media','achievements','programs',
--   'certificates','program_topics','certificate_topics','curriculum_versions',
--   'study_methods','labs','tubes','badges','award_standing_requirements',
--   'entitlements','credential_awards','student_achievement_progress',
--   'student_method_progress','student_badges','student_lab_progress','calc_usage']) as tbl
-- except
-- select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace and n.nspname='public'
--   where has_table_privilege('authenticated','public.'||c.relname,'SELECT');

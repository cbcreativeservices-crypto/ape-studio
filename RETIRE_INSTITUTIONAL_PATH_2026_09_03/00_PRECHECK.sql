-- RETIRE INSTITUTIONAL PATH · 00_PRECHECK · READ ONLY. Changes nothing.
-- This file's real job is to print the live blocker list for dropping
-- `courses`, `enrollment`, `course_sections`, `session_logs` and
-- `achievements.course_id`. Read NOTES_BLOCKERS.md alongside it.

-- ------------------------------------------------------------------ 1. row counts
select 'counts' as section, k, v from (values
  ('courses',                    (select count(*)::text from public.courses)),
  ('course_sections',            (select count(*)::text from public.course_sections)),
  ('session_logs',               (select count(*)::text from public.session_logs)),
  ('enrollment',                 (select count(*)::text from public.enrollment)),
  ('instructor_sections',        (select count(*)::text from public.instructor_sections)),
  ('achievements w/ course_id',  (select count(*)::text from public.achievements where course_id is not null)),
  ('users audience=institutional',(select count(*)::text from public.users where audience = 'institutional')),
  ('users audience=commercial',  (select count(*)::text from public.users where audience = 'commercial'))
) t(k,v);

-- --------------------------------------------------- 2. FUNCTIONS still in the way
-- Postgres does NOT dependency-check function bodies. Every row here is a
-- function that will break SILENTLY at runtime the moment the named object is
-- dropped. Each one needs a decision before any drop.
select 'blocking_functions' as section, p.proname as function, p.prosecdef as security_definer,
       trim(both ' ' from
            case when regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\menrollment\M'      then 'enrollment '      else '' end ||
            case when regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\mcourses\M'         then 'courses '         else '' end ||
            case when regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\mcourse_sections\M' then 'course_sections ' else '' end ||
            case when regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\msession_logs\M'    then 'session_logs '    else '' end ||
            case when regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\mcourse_id\M'       then 'course_id'        else '' end) as reads
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and (regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\menrollment\M' or regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\mcourses\M'
    or regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\mcourse_sections\M' or regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\msession_logs\M'
    or regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\mcourse_id\M')
order by p.proname;

-- ------------------------------------------------------ 3. VIEWS still in the way
-- Views ARE dependency-checked, so these will make a DROP fail loudly rather
-- than silently - but they must still be dealt with first.
select 'blocking_views' as section, c.relname as view,
       trim(both ' ' from
            case when pg_get_viewdef(c.oid) ~* '\menrollment\M'      then 'enrollment '      else '' end ||
            case when pg_get_viewdef(c.oid) ~* '\mcourse_sections\M' then 'course_sections ' else '' end ||
            case when pg_get_viewdef(c.oid) ~* '\mcourse_id\M'       then 'course_id'        else '' end) as reads
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('v','m')
  and pg_get_viewdef(c.oid) ~* '\menrollment\M|\mcourse_sections\M|\mcourse_id\M'
order by c.relname;

-- --------------------------------------------------------- 4. RLS still in the way
select 'blocking_policies' as section, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and (tablename in ('courses','enrollment','course_sections','session_logs')
       or qual::text ~* 'enrollment|course_sections'
       or coalesce(with_check::text,'') ~* 'enrollment|course_sections')
order by tablename, policyname;

-- --------------------------------------------------------------- 5. FK topology
select 'foreign_keys' as section, con.conname, cl.relname as from_table,
       confrel.relname as to_table, pg_get_constraintdef(con.oid) as def
from pg_constraint con
join pg_class cl      on cl.oid = con.conrelid
join pg_class confrel on confrel.oid = con.confrelid
join pg_namespace n   on n.oid = cl.relnamespace
where con.contype = 'f' and n.nspname = 'public'
  and (confrel.relname in ('courses','course_sections','enrollment','session_logs')
    or cl.relname      in ('courses','course_sections','enrollment','session_logs'))
order by confrel.relname, cl.relname;

-- ------------------------------------------------------------- 6. app-side facts
select 'app_blockers' as section, item from (values
  ('src/features/dashboard/api.ts lines ~230 and ~238 still select and map achievements.course_id. That must ship removed before achievements.course_id can be dropped.'),
  ('src/features/dashboard/api.ts already documents fetchDashboard() as removed 2026-09-03 for exactly this reason - confirm that landed.'),
  ('Nothing in src/ or web/ references v_student_progress or v_section_cohort_stats (checked 2026-09-03), which is why Stage 10 of this package can drop them.')
) t(item);

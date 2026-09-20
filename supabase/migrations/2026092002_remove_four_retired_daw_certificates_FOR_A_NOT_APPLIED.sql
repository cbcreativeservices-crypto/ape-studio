-- ⛔ NOT APPLIED. FOR A TO REVIEW AND APPLY. Written by ccode 2026-09-20.
--    Rename off the _FOR_A_NOT_APPLIED suffix when it lands.
--
-- ============================================================================
-- Remove the four retired DAW certificates. Owner's call, 2026-09-20.
-- ============================================================================
--
-- Owner: "remove those certificates — there were not enough terms for each so
-- their terms were taken and already consolidated elsewhere."
--
-- ── THE FOUR ────────────────────────────────────────────────────────────────
--
--   cert-cubase-nuendo-for-post-v3          Cubase/Nuendo for Post
--   cert-digital-performer-reason-producer-v3  Digital Performer / Reason Producer
--   cert-reaper-power-user-v3               REAPER Power User
--   cert-studio-one-producer-v3             Studio One Producer
--
-- All four are ALREADY `is_active = false`, so nothing user-facing changes.
-- This is the tidy-up that makes the data match the decision.
--
-- ── WHY IT IS SAFE, CHECKED ROW BY ROW ──────────────────────────────────────
--
--   credential_awards     0 rows for all four  (nobody has ever earned one)
--   credential_eligibility 0 rows for all four
--   certificate_topics    3 links each, 12 total
--
-- And the owner's reason checks out in the data: every topic those four
-- pointed at is STILL ACTIVE and is shared with other certificates —
--
--   DAW: Additional Platforms (3990)            also on 4 other certificates
--   DAW Fundamentals & Session Mgmt (3970)      also on 5
--   Sampling & Virtual Instruments (4050)       also on 9
--   Plugin Formats, Hosts & Processing (3410)   also on 4
--   Post Workflow, Spotting & Sessions (4130)   also on 5
--   Dialogue Editing (4160)                     also on 4
--   MIDI (4040)                                 also on 4
--
-- So deleting the certificates orphans no topic and loses no content. The
-- consolidation the owner describes is already done in the data.
--
-- ── THE CLIENT NEEDS NO CHANGE ──────────────────────────────────────────────
--
-- Grepped: NO reference to any of the four slugs anywhere in `src/` or `web/`.
-- `credentialCopy.ts` holds exactly 160 keys = 124 active certificates + 36
-- programs, which is already right and stays right after this.
--
-- ⚠️ AND A CORRECTION WORTH RECORDING. An audit pass reported these as "four
-- LIVE certificates with no copy row" and concluded the real certificate count
-- was 128. It is 124: there are 128 rows, four of which are inactive — these.
-- The Explore screen's "124 specialist certificates" was CORRECT all along
-- (`refresh_academy_stats` counts `is_active = true`). Anything downstream of
-- the 128 claim — including newly authored copy for these four — should be
-- discarded rather than merged.
--
-- ── RISK ────────────────────────────────────────────────────────────────────
--
-- Irreversible: these are DELETEs, not a flag. Nothing references them and no
-- learner has ever earned one, so the blast radius is the twelve link rows and
-- the four certificate rows. Take a backup of both tables first if you want a
-- way back — the rows are tiny.

begin;

-- Named by slug rather than `is_active = false`, so this can never widen to
-- catch a certificate someone deactivates later for an unrelated reason.
create temporary table _dead_certs on commit drop as
select id, slug from public.certificates
 where slug in (
   'cert-cubase-nuendo-for-post-v3',
   'cert-digital-performer-reason-producer-v3',
   'cert-reaper-power-user-v3',
   'cert-studio-one-producer-v3'
 );

-- Refuse to run if the world is not what this migration was written against.
do $$
declare n int;
begin
  select count(*) into n from _dead_certs;
  if n <> 4 then
    raise exception 'expected exactly 4 certificates to remove, found %', n;
  end if;
  select count(*) into n from public.credential_awards ca join _dead_certs d on d.id = ca.credential_id;
  if n <> 0 then
    raise exception 'refusing to delete: % credential_awards reference these certificates', n;
  end if;
end $$;

delete from public.certificate_topics where certificate_id in (select id from _dead_certs);
delete from public.certificates       where id             in (select id from _dead_certs);

commit;

-- ── VERIFY AFTER APPLYING ───────────────────────────────────────────────────
--
--   select count(*) from certificates;                      -- expect 124
--   select count(*) from certificates where is_active;      -- expect 124
--   select * from get_academy_stats();                      -- certificates still 124
--
-- The headline stat does NOT move — it already counted only active rows. That
-- is the point: the number was right, the data was untidy.

-- ============================================================================
-- AUDIO COMMUNITY DIRECTORY — database rule tests
-- Pro Audio Training Academy · spec 2026-08-31 §2 (privacy, access control,
-- migration, contact safety, selection limits)
-- ============================================================================
--
-- HOW TO RUN. Paste the whole file into the Supabase SQL editor, or run it with
-- psql. It ends by RAISING an exception on purpose, which does two things: it
-- prints every assertion's result in the error message, and it ROLLS BACK the
-- entire run so no test data is ever committed to the live database.
--
-- A PASS looks like every line reading "ok". Any line reading BAD is a
-- regression: a rule the database was supposed to enforce and did not.
--
-- The pure-logic rules (About validation, the legacy interest mapping, slug
-- round-tripping, error wording) are covered separately by `npm test`.
--
-- SET THESE to two real auth.users ids before running.
-- ============================================================================
do $$
declare
  A_auth uuid := '56936e16-acf8-409e-85b0-26046d8d5b03';
  B_auth uuid := 'd66ebb28-413c-4d4d-956c-9516e9573fe6';
  A uuid; B uuid; r text := ''; e text; n int; tokA uuid; tokB uuid; req uuid; i int;

begin
  select id into A from public.users where auth_id = A_auth;
  select id into B from public.users where auth_id = B_auth;
  if A is null or B is null then
    raise exception 'Set A_auth and B_auth to two real auth.users ids first.';
  end if;

  perform set_config('request.jwt.claims', json_build_object('sub', A_auth)::text, true);

  -- ── Selection limits (§6.2–6.5) ─────────────────────────────────────────
  begin
    perform public.community_profile_save('A',null,null,null,'either','live-sound-event-production',
      array['live-sound-event-production','studio-recording-mixing-mastering','software-dsp-ai','broadcast-podcast-streaming'],
      '{}', array['working-professionally'], array['collaboration'], '{}');
    r := r || E'\n  BAD  4 areas were allowed';
  exception when others then r := r || E'\n  ok   4 areas refused'; end;

  begin
    perform public.community_profile_save('A',null,null,null,'either','live-sound-event-production',
      array['live-sound-event-production'], array['audio-dsp'],
      array['working-professionally'], array['collaboration'], '{}');
    r := r || E'\n  BAD  a specialty was allowed without its area';
  exception when others then r := r || E'\n  ok   specialty refused without its area'; end;

  begin
    perform public.community_profile_save('A',null,null,null,'either','live-sound-event-production',
      array['live-sound-event-production'], '{}',
      array['working-professionally','teaching-mentoring','researching'], array['collaboration'], '{}');
    r := r || E'\n  BAD  3 roles were allowed';
  exception when others then r := r || E'\n  ok   3 roles refused'; end;

  begin
    perform public.community_profile_save('A',null,null,null,'either','live-sound-event-production',
      array['live-sound-event-production'], '{}', array['working-professionally'],
      array['collaboration','hiring','mentoring-others','professional-networking'], '{}');
    r := r || E'\n  BAD  4 Open To selections were allowed';
  exception when others then r := r || E'\n  ok   4 Open To selections refused'; end;

  -- ── Public About must not carry contact details (§6.8) ──────────────────
  begin
    perform public.community_profile_save('A','reach me at a@b.com',null,null,'either',
      'live-sound-event-production', array['live-sound-event-production'], '{}',
      array['working-professionally'], array['collaboration'], '{}');
    r := r || E'\n  BAD  an email address was allowed in About My Work';
  exception when others then r := r || E'\n  ok   email refused in About My Work'; end;

  -- ── A good profile ──────────────────────────────────────────────────────
  perform public.community_profile_save('Alex R.','FOH engineer, clubs and theatre','US','Pacific NW','either',
    'live-sound-event-production', array['live-sound-event-production','acoustics-measurement-sound-science'],
    array['foh-mixing','system-tuning-optimization-alignment'],
    array['working-professionally','teaching-mentoring'], array['collaboration','professional-networking'], array['en']);
  r := r || E'\n  ok   a valid profile saved';

  -- ── Age gate (§9) ───────────────────────────────────────────────────────
  begin
    perform public.community_profile_publish(true, false, 'test');
    r := r || E'\n  BAD  published without the age attestation';
  exception when others then r := r || E'\n  ok   publish refused without the age attestation'; end;

  perform public.community_profile_publish(true, true, 'test');
  perform public.community_profile_set_discoverable(true);
  perform public.community_profile_set_contact(true);
  select public_token into tokA from public.community_profiles where user_id = A;
  r := r || E'\n  ok   publish, discoverability and contact enabled in order';

  -- ── A second member ─────────────────────────────────────────────────────
  perform set_config('request.jwt.claims', json_build_object('sub', B_auth)::text, true);
  perform public.community_profile_save('Bee','Mastering engineer','US',null,'remote',
    'studio-recording-mixing-mastering', array['studio-recording-mixing-mastering'],
    array['mastering'], array['working-professionally'], array['hiring'], '{}');
  perform public.community_profile_publish(true, true, 'test');
  perform public.community_profile_set_discoverable(true);

  select count(*) into n from public.directory_search(null,null,null,null,null,null,null,30,0);
  r := r || E'\n  ' || case when n = 1 then 'ok  ' else 'BAD ' end
         || ' search returns other members and excludes the caller (got ' || n || ', want 1)';

  -- ── Contact safety (§6.5, §8.3) ─────────────────────────────────────────
  begin
    perform public.contact_request_send(tokA, 'hiring', 'Are you free?');
    r := r || E'\n  BAD  a purpose the recipient never offered was allowed';
  exception when others then r := r || E'\n  ok   purpose must match an active Open To selection'; end;

  begin
    perform public.contact_request_send(tokA, 'collaboration', 'see https://x.example/me');
    r := r || E'\n  BAD  a link was allowed in a first message';
  exception when others then r := r || E'\n  ok   links refused in a first message'; end;

  select public.contact_request_send(tokA,'collaboration','Comparing notes on system tuning.') into req;
  begin
    perform public.contact_request_send(tokA,'collaboration','again');
    r := r || E'\n  BAD  a second pending request to the same member was allowed';
  exception when others then r := r || E'\n  ok   only one pending request per pair'; end;

  begin
    perform public.contact_message_send(req, 'hello?');
    r := r || E'\n  BAD  a message was allowed before the request was accepted';
  exception when others then r := r || E'\n  ok   no messages before acceptance'; end;

  -- ── Rate limit (§2) ─────────────────────────────────────────────────────
  perform public.contact_request_respond(req, 'withdraw');
  for i in 2..10 loop
    perform public.contact_request_respond(public.contact_request_send(tokA,'collaboration','msg '||i), 'withdraw');
  end loop;
  begin
    perform public.contact_request_send(tokA,'collaboration','the eleventh');
    r := r || E'\n  BAD  the weekly contact-request limit did not apply';
  exception when others then r := r || E'\n  ok   weekly contact-request limit applied at the 11th'; end;

  -- ── Blocks are symmetrical (§2) ─────────────────────────────────────────
  perform set_config('request.jwt.claims', json_build_object('sub', A_auth)::text, true);
  select public_token into tokB from public.community_profiles where user_id = B;
  perform public.contact_block(tokB, true);
  select count(*) into n from public.directory_search(null,null,null,null,null,null,null,30,0);
  r := r || E'\n  ' || case when n = 0 then 'ok  ' else 'BAD ' end || ' blocker cannot see the blocked member';
  perform set_config('request.jwt.claims', json_build_object('sub', B_auth)::text, true);
  select count(*) into n from public.directory_search(null,null,null,null,null,null,null,30,0);
  r := r || E'\n  ' || case when n = 0 then 'ok  ' else 'BAD ' end || ' blocked member cannot see the blocker';

  -- ── The public page reflects publish state exactly (§8.1, §8.4) ─────────
  perform set_config('request.jwt.claims', null, true);
  select count(*) into n from public.community_profile_public(tokA);
  r := r || E'\n  ' || case when n = 1 then 'ok  ' else 'BAD ' end || ' a published profile is readable by an anonymous visitor';

  perform set_config('request.jwt.claims', json_build_object('sub', A_auth)::text, true);
  perform public.community_profile_publish(false, false, 'test');
  select count(*) into n from public.community_profiles
   where user_id = A and not published and not discoverable and not contact_enabled;
  r := r || E'\n  ' || case when n = 1 then 'ok  ' else 'BAD ' end || ' unpublishing also clears discoverability and contact';

  perform set_config('request.jwt.claims', null, true);
  select count(*) into n from public.community_profile_public(tokA);
  r := r || E'\n  ' || case when n = 0 then 'ok  ' else 'BAD ' end || ' the public page is gone after unpublishing';

  -- ── Deletion removes the profile, keeps safety records and credentials ──
  perform set_config('request.jwt.claims', json_build_object('sub', A_auth)::text, true);
  perform public.community_profile_delete();
  select count(*) into n from public.community_profiles where user_id = A;
  r := r || E'\n  ' || case when n = 0 then 'ok  ' else 'BAD ' end || ' deletion removes the community profile';
  select count(*) into n from public.contact_blocks where blocker_user = A;
  r := r || E'\n  ' || case when n > 0 then 'ok  ' else 'BAD ' end || ' blocks survive profile deletion';

  -- ── Access control: anonymous callers ───────────────────────────────────
  perform set_config('request.jwt.claims', null, true);
  begin
    perform public.directory_search(null,null,null,null,null,null,null,30,0);
    r := r || E'\n  BAD  an anonymous caller could search the directory';
  exception when others then r := r || E'\n  ok   anonymous callers cannot search the directory'; end;

  raise exception E'\n=== AUDIO COMMUNITY DIRECTORY TESTS (all changes rolled back) ===%\n', r;
end $$;

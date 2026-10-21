-- ⛔ SUPERSEDED — DO NOT APPLY (Comp A, 2026-10-20).
-- Comp A's guarded package (owner's go) carries this rename and definition and also:
--   - splits the Plain English into 2 sentences (it measured just over the grade-9 reading limit);
--   - rewords Practical Application the same way;
--   - updates the 6 entries that list "Call 911" as a related term (AED, Burn, Emergency,
--     First Aid Kit, Heat Stress, Medical Emergency) so those links keep working;
--   - rewords "911" to "emergency services" in 5 of its quiz questions.
-- Kept for the record only. The guard below makes an accidental run stop before it changes anything.
do $$ begin raise exception 'SUPERSEDED: 2026102002 must not be applied (Comp A delivers its own package 2026-10-20)'; end $$;

-- DRAFT — NOT APPLIED. Comp A applies it after checking it (owner: "yes comp a", 2026-10-20).
--
-- Pro Audio Safety is for every learner, worldwide: its "Call 911" entry named only the US/Canada
-- number. The entry becomes "Call Emergency Services" and names the numbers most learners will use.
-- Keyed on id AND the current text (as 2026100420), so it changes nothing if the row was edited since.
-- (OSHA and Permissible Exposure Limit already say they are US rules: no change.)

begin;

update public.glossary
   set term = 'Call Emergency Services',
       definition = 'Activating the local emergency services number (911 in the US and Canada, 112 across the European Union, 999 in the UK) to summon fire, medical, or police response. Calling early — with the location, nature of the emergency, and number of people involved — is a core first step in any serious fire, medical, or safety emergency.',
       plain_english = 'Calling emergency services gets professional help on the way fast: 911 in the US and Canada, 112 across Europe, 999 in the UK. Say where you are, what''s happening, and how many people are involved — and call early rather than waiting.'
 where id = 'b3ebcfd3-8dd0-441a-ae39-8aa141a62778'
   and term = 'Call 911';

-- VERIFY: expect 1 row named 'Call Emergency Services' and none named 'Call 911' in the glossary.
select
  (select count(*) from public.glossary where id = 'b3ebcfd3-8dd0-441a-ae39-8aa141a62778' and term = 'Call Emergency Services') as renamed_1,
  (select count(*) from public.glossary where term = 'Call 911') as old_name_0;

commit;

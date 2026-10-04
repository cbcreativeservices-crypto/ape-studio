-- 2026-10-04 · Loudness targets verified (owner ruling "use your recommendations").
-- DRAFT ONLY: NOT APPLIED. Comp A applies after owner approval.
--
-- The calculator's COMMON LOUDNESS TARGETS table (Loudness Normalization) now
-- says YouTube publishes no loudness figure and engineers measure about
-- −14 LUFS. One glossary row still quoted an older "−13 to −14 LUFS on
-- YouTube" range. Keyed by id AND by the current text, so it changes nothing
-- if the row was already edited. Every other glossary row that quotes a
-- platform or broadcast number was read (2026-10-04) and already agrees.

begin;

update public.glossary
   set plain_english = replace(plain_english,
         'like roughly -14 LUFS on Spotify and -13 to -14 LUFS on YouTube.',
         'like -14 LUFS on Spotify and about -14 LUFS on YouTube (YouTube publishes no figure; that is what engineers measure). These are playback levels, not mastering requirements: a louder track is simply turned down.')
 where id = 'b93d7af7-a740-4486-8640-c742f6ab22c1'
   and plain_english like '%like roughly -14 LUFS on Spotify and -13 to -14 LUFS on YouTube.%';

commit;

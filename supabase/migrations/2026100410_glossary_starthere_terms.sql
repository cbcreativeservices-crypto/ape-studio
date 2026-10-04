-- ===========================================================================
-- GLOSSARY: Start Here starter words - three new terms + three entry fixes
-- 2026-10-04 - DRAFT - NOT APPLIED. Comp A applies after owner approval.
--
-- Owner 2026-10-04: "author and vet completely those terms so they can be
-- included". Review copy with sources and reasons:
--   docs/GLOSSARY_STARTHERE_TERMS_2026_10_04.md
--
-- WHAT THIS DOES
--   1. INSERTS three beginner terms the Start Here lab links to but the
--      glossary does not have:
--        - Sound Source           (topic gs3000 Sound & Wave Fundamentals)
--        - Listener (acoustics)   (topic gs3000 Sound & Wave Fundamentals)
--        - Audio Signal           (topic gs3030 Signal Path & Levels)
--      Each gets its glossary row (achievement_id = its primary topic, like
--      every curated row) AND its glossary_topics row (is_primary, beginner).
--      The topic row is REQUIRED: glossary_browse_v only shows terms that have
--      a glossary_topics row, so a row without one is invisible in the app.
--   2. UPDATES definition + plain_english ONLY of three existing entries whose
--      text is too narrow for the general word:
--        - Tone       (pitch sense said "single frequency" only)
--        - Recording  (defined only as capturing an event in corporate AV)
--        - Playback   (defined only as show playback during an event)
--      Each UPDATE is guarded by the md5 of the CURRENT live text (read
--      2026-10-04), so it changes nothing if the row was edited since, and is a
--      no-op on a re-run.
--   3. Refreshes the cached glossary term count (it also refreshes on a timer).
--
-- IDEMPOTENT: inserts are WHERE NOT EXISTS (case-insensitive) + ON CONFLICT
-- DO NOTHING; topic links are WHERE NOT EXISTS + ON CONFLICT DO NOTHING;
-- updates are md5-guarded. Safe to run twice.
--
-- SIDE EFFECT TO KNOW: topics gs3000 (215 terms) and gs3030 (153 terms) each
-- gain items, so a learner who had studied every term in them sees display
-- progress dip slightly (e.g. 215/215 -> 215/217). Banked credit is not touched.
--
-- AFTER APPLYING: the app's built-in Start Here copy
-- (src/features/startHere/startHereGlossary.ts) must be refreshed to match, and
-- four Start Here links changed - see the review doc, section "App-side changes".
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- NEW: Sound Source   (topic gs3000 Sound & Wave Fundamentals, beginner)
-- ---------------------------------------------------------------------------
insert into public.glossary
  (term, definition, plain_english, achievement_id, related_terms, category,
   difficulty, common_mistakes, scenario_contexts, purpose_function,
   practical_application, formula_symbolic, formula_words)
select
    'Sound Source',
    'A sound source is any vibrating object or process that disturbs the surrounding medium and radiates sound energy into it - for example the vocal folds, a guitar string coupled to its soundboard, a drum head, a loudspeaker cone, or turbulent airflow. Every sound begins at a source. A source is described by its sound power, its frequency content and its directivity; sound power is a property of the source itself, whereas the sound pressure level at a listener also depends on distance and on the surroundings.',
    'A sound source is the thing that makes a sound. It vibrates and pushes on the air around it: a voice, a guitar string, a drum or a speaker cone. Every sound starts at a source, then travels through a medium, such as air, to a listener.',
    a.id,
    ARRAY[
      'Sound Wave',
      'Medium',
      'vibration',
      'Listener (acoustics)',
      'Source Device',
      'Sound Power',
      'Directivity',
      'Source-path-receiver model'
    ]::text[],
    'Sound Fundamentals',
    'beginner',
    ARRAY[
      'Calling the microphone the source; the microphone receives sound, the source makes it.',
      'Confusing a sound source, which vibrates and makes sound in the air, with a source device, which starts an electrical signal in a system.',
      'Assuming a source sends sound equally in every direction; most real sources are louder in some directions than others, especially at high frequencies.'
    ]::text[],
    ARRAY[
      'Placing a microphone close to a singer, the source, to capture more of the voice and less of the room.',
      'Tracking down a hum or a rattle in a venue by first finding which object is vibrating.',
      'Explaining that the loudspeaker is the sound source for everyone in the audience, even though the music started with the band.'
    ]::text[],
    'Naming the source marks where a sound begins, so its strength, pitch content and direction can be described and controlled before anything else along the path is considered.',
    'Engineers identify the source before choosing and placing a microphone. When tracking down unwanted noise they find the source first, because reducing a sound where it is made is usually the most effective fix.',
    NULL,
    NULL
  from public.achievements a
 where a.curriculum_version_id = 'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72'
   and a.global_sequence = 3000
   and not exists (select 1 from public.glossary g where lower(g.term) = lower('Sound Source'))
on conflict (term) do nothing;

insert into public.glossary_topics (glossary_id, achievement_id, is_primary, difficulty)
select g.id, a.id, true, 'beginner'
  from public.glossary g
  join public.achievements a
    on a.curriculum_version_id = 'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72' and a.global_sequence = 3000
 where g.term = 'Sound Source'
   and not exists (select 1 from public.glossary_topics gt where gt.glossary_id = g.id)
on conflict (glossary_id, achievement_id) do nothing;

-- ---------------------------------------------------------------------------
-- NEW: Listener (acoustics)   (topic gs3000 Sound & Wave Fundamentals, beginner)
-- ---------------------------------------------------------------------------
insert into public.glossary
  (term, definition, plain_english, achievement_id, related_terms, category,
   difficulty, common_mistakes, scenario_contexts, purpose_function,
   practical_application, formula_symbolic, formula_words)
select
    'Listener (acoustics)',
    'In acoustics, the listener is the receiver at the end of the source-path-receiver chain: the person whose ears receive a sound, or a microphone placed to receive it, after the sound has travelled from a source through a medium. What reaches a listener is the direct sound plus reflections from the surroundings, so its level, frequency balance and timing at the listening point differ from those at the source. A microphone receives sound physically, but hearing - the perception of pitch, loudness and timbre - happens in the ear and brain, and differs from one person to another.',
    'The listener is whoever, or whatever, receives a sound: your ears, or a microphone. It is the last stop on a sound''s journey from the source, through the medium, to the listener. A microphone receives sound, but it does not hear it the way a person does, and two people can hear the same sound differently.',
    a.id,
    ARRAY[
      'Sound Source',
      'Medium',
      'Source-path-receiver model',
      'Listening Position',
      'Loudness',
      'Hearing Range',
      'Direct sound',
      'Reflection'
    ]::text[],
    'Sound Fundamentals',
    'beginner',
    ARRAY[
      'Assuming every listener hears the same thing; where each person sits, their age and their hearing health all change what reaches them and how it sounds.',
      'Judging a mix only from the mixing position, which is just one listener among many.',
      'Treating a microphone''s reading as identical to what a person hears; the microphone measures, while the ear and brain perceive.'
    ]::text[],
    ARRAY[
      'Walking the room during a soundcheck to hear the system from several listening positions.',
      'Placing a measurement microphone at ear height in the audience area to tune a system.',
      'Recognising that the microphone is the listener when a singer is being recorded.'
    ]::text[],
    'Naming the listener fixes the point where sound is judged or measured, because level, tone and clarity all change with where the listener is and who the listener is.',
    'Engineers check a system from where the audience will be, and place a measurement microphone at ear height in the listening area, rather than judging the sound while standing next to the loudspeaker.',
    NULL,
    NULL
  from public.achievements a
 where a.curriculum_version_id = 'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72'
   and a.global_sequence = 3000
   and not exists (select 1 from public.glossary g where lower(g.term) = lower('Listener (acoustics)'))
on conflict (term) do nothing;

insert into public.glossary_topics (glossary_id, achievement_id, is_primary, difficulty)
select g.id, a.id, true, 'beginner'
  from public.glossary g
  join public.achievements a
    on a.curriculum_version_id = 'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72' and a.global_sequence = 3000
 where g.term = 'Listener (acoustics)'
   and not exists (select 1 from public.glossary_topics gt where gt.glossary_id = g.id)
on conflict (glossary_id, achievement_id) do nothing;

-- ---------------------------------------------------------------------------
-- NEW: Audio Signal   (topic gs3030 Signal Path & Levels, beginner)
-- ---------------------------------------------------------------------------
insert into public.glossary
  (term, definition, plain_english, achievement_id, related_terms, category,
   difficulty, common_mistakes, scenario_contexts, purpose_function,
   practical_application, formula_symbolic, formula_words)
select
    'Audio Signal',
    'An audio signal is an electrical or digital representation of sound, mainly at frequencies within the range of human hearing (roughly 20 Hz to 20 kHz), that equipment can carry, process, store and reproduce. In analog form it is a voltage that varies continuously in a pattern that follows the original sound wave; in digital form it is a stream of numbers, called samples, that describe the same waveform. An audio signal makes no sound by itself: it becomes sound again only when a transducer such as a loudspeaker or headphone turns it back into vibration in the air. Audio signals come from microphones and pickups, or are generated electronically, as by a synthesizer or a test-tone oscillator.',
    'An audio signal is sound turned into electricity or numbers, so equipment can work with it. A microphone makes one from sound, and a speaker turns it back into sound. You cannot hear an audio signal itself. It travels silently through cables and equipment until a speaker or headphones play it.',
    a.id,
    ARRAY[
      'Audio',
      'Signal Path',
      'Transducer',
      'Microphone (Mic)',
      'Loudspeaker (Speaker)',
      'Level',
      'Digital signal',
      'Waveform',
      'Line Level',
      'Mic Level'
    ]::text[],
    'Signal Flow',
    'beginner',
    ARRAY[
      'Thinking sound itself travels inside a cable; the cable carries an electrical copy of it.',
      'Assuming a signal that shows on a meter must be audible; it still has to reach an amplifier and a speaker or headphones to become sound.',
      'Plugging a signal into an input built for a very different level, such as a line-level signal into a microphone input, which can overload it and distort.'
    ]::text[],
    ARRAY[
      'Following a singer''s voice as an audio signal from the microphone, through the mixer, to the loudspeakers.',
      'Checking a mixer''s meter to confirm an audio signal is arriving before anything can be heard.',
      'Recording a podcast, where the microphone''s audio signal is turned into numbers and saved as a file.'
    ]::text[],
    'Turning sound into a signal lets it be carried over distance, mixed, changed, measured, recorded and played back - none of which can be done to sound while it is only in the air.',
    'Technicians follow the audio signal from each output to the next input, watch its level on meters, and connect each signal to an input built for its level, such as a mic input or a line input.',
    NULL,
    NULL
  from public.achievements a
 where a.curriculum_version_id = 'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72'
   and a.global_sequence = 3030
   and not exists (select 1 from public.glossary g where lower(g.term) = lower('Audio Signal'))
on conflict (term) do nothing;

insert into public.glossary_topics (glossary_id, achievement_id, is_primary, difficulty)
select g.id, a.id, true, 'beginner'
  from public.glossary g
  join public.achievements a
    on a.curriculum_version_id = 'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72' and a.global_sequence = 3030
 where g.term = 'Audio Signal'
   and not exists (select 1 from public.glossary_topics gt where gt.glossary_id = g.id)
on conflict (glossary_id, achievement_id) do nothing;

-- ---------------------------------------------------------------------------
-- FIX: Tone  (definition + plain_english only; md5-guarded on live text)
-- ---------------------------------------------------------------------------
update public.glossary
   set definition    = 'In audio, tone most often means the overall character or quality of a sound (its tone color), determined mainly by its balance of frequencies and its harmonic content. In acoustics, a tone is also any sound heard as having a definite pitch: a pure tone of a single frequency, such as a test tone, or a complex tone, such as a sung or played note, whose several frequency components are heard together as one pitch. In music theory, a tone is also the interval of a whole step.',
       plain_english = 'Tone is the overall quality or color of a sound. It is what makes a sound bright, dark, warm, or thin. The word can also mean any sound with a clear pitch, such as a test tone or a sung note.'
 where term = 'Tone'
   and md5(definition)    = '7874d1f7f5b843fdc028675f5d271bc3'
   and md5(plain_english) = '2ae50d5cbb7bcdd6bb621e6004ee0fac';

-- ---------------------------------------------------------------------------
-- FIX: Recording  (definition + plain_english only; md5-guarded on live text)
-- ---------------------------------------------------------------------------
update public.glossary
   set definition    = 'Recording is the capture of sound, or of signals such as audio and video, onto a storage medium - tape, disc, memory card or a computer file - so it can be played back, edited, archived or distributed later. The word names both the act of capturing and the stored result, a recording. At live and corporate events, the recording of a session typically becomes the master file used for on-demand viewing, compliance or reuse.',
       plain_english = 'Recording means capturing sound, and sometimes video, so it can be kept and played back later. The word also names what you end up with: a song saved on your phone is a recording. At a live event, the recording is the file people watch or use afterwards.'
 where term = 'Recording'
   and md5(definition)    = '8a1e66ebe25fb7c0ba7cada3de30ca45'
   and md5(plain_english) = 'a183c16733ac09c5ccb53c8ee19eeb4c';

-- ---------------------------------------------------------------------------
-- FIX: Playback  (definition + plain_english only; md5-guarded on live text)
-- ---------------------------------------------------------------------------
update public.glossary
   set definition    = 'Playback is the reproduction of previously recorded or stored audio, and often video, so it can be heard or seen again through loudspeakers, headphones or displays. In live events, theatre and broadcast, playback also means running pre-recorded content during a show - music, video roll-ins, stings or recorded segments - which the playback source and operator must deliver on cue and at the correct level.',
       plain_english = 'Playback is playing something that was recorded, so you can hear it again through speakers or headphones. At a show, it also means playing pre-recorded music or video at exactly the right moment.'
 where term = 'Playback'
   and md5(definition)    = 'aa3c16797c4b6ce9d1c7d48de7e7d241'
   and md5(plain_english) = 'e758561f510875b82cd0e5e26ccad7e7';

select public.refresh_glossary_stats();

commit;

-- ---------------------------------------------------------------------------
-- VERIFY (read-only; run after the commit). Expect 6 rows: the three new terms
-- with n_topics = 1 and visible = true, and the three fixed terms with
-- new_text = true.
-- ---------------------------------------------------------------------------
select g.term,
       g.difficulty,
       (select count(*) from public.glossary_topics gt where gt.glossary_id = g.id) as n_topics,
       exists (select 1 from public.glossary_topics gt where gt.glossary_id = g.id) as visible,
       md5(g.definition) as def_md5
  from public.glossary g
 where g.term in ('Sound Source', 'Listener (acoustics)', 'Audio Signal', 'Tone', 'Recording', 'Playback')
 order by g.term;
-- New-text md5s for the three fixed rows:
--   Tone: definition 6f910d80e86915bb2c53225e94be1c9b, plain_english be43c550ffd58774c349fa45c11509aa
--   Recording: definition 3d50ec24dd94b3867a7c11c4ddf6c7ff, plain_english d69f8833b3bc4658807dc25e9f6ea847
--   Playback: definition 20fabdcd8d2fe78855ecf9d78ca39f33, plain_english def0b57abdca88bce8b4c5add0ccc430

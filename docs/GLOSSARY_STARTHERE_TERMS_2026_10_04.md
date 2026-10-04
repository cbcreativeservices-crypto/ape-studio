# Start Here glossary terms: audit, new entries and fixes (2026-10-04)

**Owner request (2026-10-04):** "author and vet completely those terms so they can be included".

**Status:** authored and checked. Nothing has been applied. The live database was only read.

- Draft SQL (not applied): `supabase/migrations/2026100410_glossary_starthere_terms.sql`
- Comp A applies it after the owner approves. The app-side link changes (section 5) belong to the agent that owns Start Here.

---

## 1. Summary

Start Here has 24 starter words. Each one opens a full glossary entry from inside the lesson. I checked every link against the live glossary on 2026-10-04.

- **18 links are correct** and fit a beginner.
- **6 words need work:**

| # | Start Here word | Linked today to | Problem | Fix |
|---|---|---|---|---|
| 1 | **Source** | nothing (`glossary: null`) | The glossary's only "Source" is the transistor terminal (advanced electronics). | **NEW term `Sound Source`**, then link to it |
| 2 | **Listener** | `Listening Position` | Wrong idea: where you sit between two stereo speakers. The glossary's "Listener" is a networked-audio receiver channel (Dante/AVB). | **NEW term `Listener (acoustics)`**, then link to it |
| 3 | **Audio signal** | `Audio` | "Audio" is the broad word. Its entry calls both sound in the air and the signal "audio", which blurs the sound-versus-signal line that Start Here teaches. There is no "Audio Signal" entry. | **NEW term `Audio Signal`**, then link to it |
| 4 | **Tone** | `Pure Tone` | Covers only the single-frequency case. Start Here's word means any clear-pitched sound, and its note also uses "a warm tone". | **Relink to the existing `Tone`** (covers both meanings), plus a one-clause fix to its definition |
| 5 | **Recording** | `Recording` | The entry defines only capturing an event in corporate AV ("capturing the event's audio and video to a file"). That is too narrow for the general word ("the song on your phone is a recording"). | **FIX** the entry's definition + plain English (general meaning first; event meaning kept) |
| 6 | **Playback** | `Playback` | The entry defines only show playback during an event. | **FIX** the entry's definition + plain English (same approach) |

## 2. How this was checked

1. **Every Start Here word and link.** I read all of `src/features/startHere/startHereContent.ts`. That covers the 24 `STARTER_TERMS`, the `terms` chips on every lesson and lab page, the Lesson 6 `MATCH_PROMPTS`, `ORDER_PATH` and the WORDS screen, which draws `STARTER_TERMS`. I also read `src/features/startHere/startHereGlossary.ts`, the built-in copies, and `src/screens/startHere/bits.tsx` / `StartHereTermsScreen.tsx`, which open them. Page chips and the match game use term **ids**, which resolve through `STARTER_TERMS`. So the 24 `glossary` fields are the only glossary links in Start Here. The lesson text also uses *mixer, level, dBFS, clipping, unity, hertz, diaphragm and SPL* without links. All of these exist in the glossary as beginner entries (section 6).
2. **Live glossary, read-only** (Supabase project `yjgolswjggmlpeowvtxr`, SELECT and EXPLAIN only):
   - Every linked term exists exactly once, case-insensitively.
   - Every linked term has a `glossary_topics` row, so `glossary_browse_v` shows it. The view only shows terms that have a topic row.
   - The built-in Start Here copy matches the live `definition` and `plain_english` for all 21 linked entries (md5 compared): **no drift**.
   - I searched the term names around source, listener, tone, signal, cable, input, output, recording, playback, hearing and transducer (several hundred names) for existing targets and near-duplicates.
3. **House format.** I studied six well-formed beginner entries in full: `Medium`, `Pure Tone`, `Sound Wave`, `Transducer`, `Hertz` and `Source Device`. Every column was read: term, definition, plain_english, purpose_function, practical_application, 3 scenario_contexts, 3 common_mistakes, about 5-8 related_terms, category, difficulty, formula fields, achievement_id and the `glossary_topics` row (`is_primary`, `difficulty`). The new rows copy that shape:
   - `glossary.achievement_id` is the primary topic.
   - There is exactly one `glossary_topics` row with `is_primary = true`.
   - Difficulty is `beginner`.
   - Formula fields are NULL.
   - There is no `glossary_media` (none of the studied entries has any).
   - The text is plain ASCII, like the existing rows.
   - The glossary table has no status or "primary" flag of its own; "primary" lives on `glossary_topics.is_primary`.
4. **Accuracy.** Each entry was checked against named textbooks and standards (listed per entry). It is worded so a beginner can follow it, and each technical clause is one a professional would sign off. Examples:
   - sound power belongs to the source, but sound pressure level depends on distance and the room (ISO 3744);
   - "tone" in acoustics means a sound with pitch, not only a single frequency (ANSI/ASA S1.1);
   - a microphone receives sound but does not hear it.
5. **SQL validity.** I ran EXPLAIN on the insert, topic-link and update shapes against the live schema. EXPLAIN plans without executing. All plans are valid: the conflict targets resolve to `glossary_term_key` and `ux_glossary_topics_term_topic`, and both topic ids resolve to exactly one v3 achievement.

## 3. Audit of all 24 starter words

| Word | Glossary target | Live entry | Verdict |
|---|---|---|---|
| Sound | Sound | beginner topic gs3000 | OK |
| Vibration | vibration | gs3000 (marked intermediate; plain English is beginner-level) | OK |
| **Source** | *(none)* | the only "Source" is the FET terminal | **GAP - new `Sound Source`** |
| Medium | Medium | gs3000 beginner | OK |
| **Listener** | Listening Position | HiFi stereo seating position | **WRONG TARGET - new `Listener (acoustics)`** |
| Pitch | Pitch | gs3020 beginner | OK |
| **Tone** | Pure Tone | single frequency only | **NARROW - relink to `Tone` (+ fix)** |
| Noise | Noise | gs3030 beginner | OK |
| Audio | Audio | gs3000 | OK (see note in section 6) |
| **Audio signal** | Audio | the broad word "audio" | **WRONG TARGET - new `Audio Signal`** |
| Microphone | Microphone (Mic) | gs3100 beginner | OK |
| Speaker | Loudspeaker (Speaker) | gs3170 beginner | OK |
| Cable | Audio cable | gs3280 | OK |
| Input | input/output | gs3030 | OK (no separate "Input" entry exists; I/O covers both) |
| Output | input/output | gs3030 | OK |
| Signal path | Signal Path | gs3030 | OK |
| **Recording** | Recording | corporate-AV event capture only | **NARROW - fix entry** |
| **Playback** | Playback | show playback only | **NARROW - fix entry** |
| Frequency | Frequency | gs3000 beginner | OK |
| Amplitude | Amplitude | gs3000 beginner | OK |
| Loudness | Loudness | gs4290 beginner | OK |
| Decibel (dB) | Decibel (dB) | gs3000 beginner | OK |
| Waveform | Waveform | gs3000 beginner | OK |
| Meter | Meter (Metering) | gs3450 beginner | OK |

## 4. The entries

Text below is exactly what the SQL writes.

### Sound Source  (NEW)

| Field | Value |
|---|---|
| term | `Sound Source` |
| category | Sound Fundamentals |
| difficulty | beginner |
| primary topic | gs3000 Sound & Wave Fundamentals (`glossary_topics.is_primary = true`, difficulty beginner); `glossary.achievement_id` = the same topic |
| formula_symbolic / formula_words | none (not a quantity with a formula) |
| media | none (none of the six reference entries has `glossary_media` rows) |

**Why it is needed.** Start Here's word SOURCE (Lesson 1 'Source, medium, listener', lab Step 1, Lesson 6 match) has no glossary entry: the live glossary's only 'Source' is the field-effect-transistor terminal (advanced, Active Devices & Semiconductors). 'Source Device' is the electrical start of a signal chain, and 'Source Sound' is the raw material in post-production; neither is the acoustic source a beginner is taught here.

**Definition.** A sound source is any vibrating object or process that disturbs the surrounding medium and radiates sound energy into it - for example the vocal folds, a guitar string coupled to its soundboard, a drum head, a loudspeaker cone, or turbulent airflow. Every sound begins at a source. A source is described by its sound power, its frequency content and its directivity; sound power is a property of the source itself, whereas the sound pressure level at a listener also depends on distance and on the surroundings.

**Plain English.** A sound source is the thing that makes a sound. It vibrates and pushes on the air around it: a voice, a guitar string, a drum or a speaker cone. Every sound starts at a source, then travels through a medium, such as air, to a listener.

**Purpose / function.** Naming the source marks where a sound begins, so its strength, pitch content and direction can be described and controlled before anything else along the path is considered.

**Practical application.** Engineers identify the source before choosing and placing a microphone. When tracking down unwanted noise they find the source first, because reducing a sound where it is made is usually the most effective fix.

**Scenario contexts.**
- Placing a microphone close to a singer, the source, to capture more of the voice and less of the room.
- Tracking down a hum or a rattle in a venue by first finding which object is vibrating.
- Explaining that the loudspeaker is the sound source for everyone in the audience, even though the music started with the band.

**Common mistakes.**
- Calling the microphone the source; the microphone receives sound, the source makes it.
- Confusing a sound source, which vibrates and makes sound in the air, with a source device, which starts an electrical signal in a system.
- Assuming a source sends sound equally in every direction; most real sources are louder in some directions than others, especially at high frequencies.

**Related terms** (every one exists in the live glossary under exactly this spelling, except the other new terms in this batch): Sound Wave · Medium · vibration · Listener (acoustics) · Source Device · Sound Power · Directivity · Source-path-receiver model

**Sources.**
- F. Alton Everest & Ken C. Pohlmann, Master Handbook of Acoustics, 7th ed. (McGraw-Hill, 2022), ch. 1 'Fundamentals of Sound' - sound begins with a vibrating source and travels through a medium.
- Thomas D. Rossing, F. Richard Moore & Paul A. Wheeler, The Science of Sound, 3rd ed. (Addison-Wesley, 2002), chs. 1-3 - vibrating systems as sound sources; vocal folds, strings, membranes.
- Lawrence E. Kinsler, Austin R. Frey, Alan B. Coppens & James V. Sanders, Fundamentals of Acoustics, 4th ed. (Wiley, 2000), ch. 7 'Radiation and Reception of Acoustic Waves' - radiation and directivity of sources.
- ISO 3744:2010, Acoustics - Determination of sound power levels and sound energy levels of noise sources using sound pressure - sound power is a property of the source; sound pressure depends on distance and environment.

### Listener (acoustics)  (NEW)

| Field | Value |
|---|---|
| term | `Listener (acoustics)` |
| category | Sound Fundamentals |
| difficulty | beginner |
| primary topic | gs3000 Sound & Wave Fundamentals (`glossary_topics.is_primary = true`, difficulty beginner); `glossary.achievement_id` = the same topic |
| formula_symbolic / formula_words | none (not a quantity with a formula) |
| media | none (none of the six reference entries has `glossary_media` rows) |

**Why it is needed.** Start Here's word LISTENER ('the person, or device, receiving the sound') linked to 'Listening Position', which is a different idea (where you sit relative to a stereo pair, HiFi Consumer Audio). The live glossary's 'Listener' is the networked-audio endpoint (IEEE 1722 / Dante receiver, intermediate), and 'Audio listener' / 'Listener position' are game-audio terms. None defines the listener as the receiver of sound. The name carries '(acoustics)' because the unique term 'Listener' is taken; this follows the house pattern of 'Compression (acoustics)' and 'Condensation (acoustics)'.

**Definition.** In acoustics, the listener is the receiver at the end of the source-path-receiver chain: the person whose ears receive a sound, or a microphone placed to receive it, after the sound has travelled from a source through a medium. What reaches a listener is the direct sound plus reflections from the surroundings, so its level, frequency balance and timing at the listening point differ from those at the source. A microphone receives sound physically, but hearing - the perception of pitch, loudness and timbre - happens in the ear and brain, and differs from one person to another.

**Plain English.** The listener is whoever, or whatever, receives a sound: your ears, or a microphone. It is the last stop on a sound's journey from the source, through the medium, to the listener. A microphone receives sound, but it does not hear it the way a person does, and two people can hear the same sound differently.

**Purpose / function.** Naming the listener fixes the point where sound is judged or measured, because level, tone and clarity all change with where the listener is and who the listener is.

**Practical application.** Engineers check a system from where the audience will be, and place a measurement microphone at ear height in the listening area, rather than judging the sound while standing next to the loudspeaker.

**Scenario contexts.**
- Walking the room during a soundcheck to hear the system from several listening positions.
- Placing a measurement microphone at ear height in the audience area to tune a system.
- Recognising that the microphone is the listener when a singer is being recorded.

**Common mistakes.**
- Assuming every listener hears the same thing; where each person sits, their age and their hearing health all change what reaches them and how it sounds.
- Judging a mix only from the mixing position, which is just one listener among many.
- Treating a microphone's reading as identical to what a person hears; the microphone measures, while the ear and brain perceive.

**Related terms** (every one exists in the live glossary under exactly this spelling, except the other new terms in this batch): Sound Source · Medium · Source-path-receiver model · Listening Position · Loudness · Hearing Range · Direct sound · Reflection

**Sources.**
- F. Alton Everest & Ken C. Pohlmann, Master Handbook of Acoustics, 7th ed. (McGraw-Hill, 2022) - direct and reflected sound at the listener; the listening room.
- David A. Bies, Colin H. Hansen & Carl Q. Howard, Engineering Noise Control, 5th ed. (CRC Press, 2017) - the source-path-receiver framework.
- Brian C. J. Moore, An Introduction to the Psychology of Hearing, 6th ed. (Brill, 2013) - pitch, loudness and timbre are perceptions; hearing differs between listeners.
- Don Davis, Eugene Patronis & Pat Brown, Sound System Engineering, 4th ed. (Focal Press, 2013) - measuring a system at the listener's position rather than at the loudspeaker.

### Audio Signal  (NEW)

| Field | Value |
|---|---|
| term | `Audio Signal` |
| category | Signal Flow |
| difficulty | beginner |
| primary topic | gs3030 Signal Path & Levels (`glossary_topics.is_primary = true`, difficulty beginner); `glossary.achievement_id` = the same topic |
| formula_symbolic / formula_words | none (not a quantity with a formula) |
| media | none (none of the six reference entries has `glossary_media` rows) |

**Why it is needed.** Start Here's word AUDIO SIGNAL linked to 'Audio', the broad entry for the word audio itself (sound in the hearing range, or the signals that carry it). Start Here teaches a firm line - sound in the air versus an audio signal inside equipment - and the 'Audio' entry blurs exactly that line. There is no 'Audio Signal' entry (only 'Audio signal path', which is about the route, and 'Sound signal', which is a soundscape-studies term).

**Definition.** An audio signal is an electrical or digital representation of sound, mainly at frequencies within the range of human hearing (roughly 20 Hz to 20 kHz), that equipment can carry, process, store and reproduce. In analog form it is a voltage that varies continuously in a pattern that follows the original sound wave; in digital form it is a stream of numbers, called samples, that describe the same waveform. An audio signal makes no sound by itself: it becomes sound again only when a transducer such as a loudspeaker or headphone turns it back into vibration in the air. Audio signals come from microphones and pickups, or are generated electronically, as by a synthesizer or a test-tone oscillator.

**Plain English.** An audio signal is sound turned into electricity or numbers, so equipment can work with it. A microphone makes one from sound, and a speaker turns it back into sound. You cannot hear an audio signal itself. It travels silently through cables and equipment until a speaker or headphones play it.

**Purpose / function.** Turning sound into a signal lets it be carried over distance, mixed, changed, measured, recorded and played back - none of which can be done to sound while it is only in the air.

**Practical application.** Technicians follow the audio signal from each output to the next input, watch its level on meters, and connect each signal to an input built for its level, such as a mic input or a line input.

**Scenario contexts.**
- Following a singer's voice as an audio signal from the microphone, through the mixer, to the loudspeakers.
- Checking a mixer's meter to confirm an audio signal is arriving before anything can be heard.
- Recording a podcast, where the microphone's audio signal is turned into numbers and saved as a file.

**Common mistakes.**
- Thinking sound itself travels inside a cable; the cable carries an electrical copy of it.
- Assuming a signal that shows on a meter must be audible; it still has to reach an amplifier and a speaker or headphones to become sound.
- Plugging a signal into an input built for a very different level, such as a line-level signal into a microphone input, which can overload it and distort.

**Related terms** (every one exists in the live glossary under exactly this spelling, except the other new terms in this batch): Audio · Signal Path · Transducer · Microphone (Mic) · Loudspeaker (Speaker) · Level · Digital signal · Waveform · Line Level · Mic Level

**Sources.**
- Glen M. Ballou (ed.), Handbook for Sound Engineers, 5th ed. (Focal Press, 2015) - analog audio signals, transducers and operating levels.
- Ken C. Pohlmann, Principles of Digital Audio, 6th ed. (McGraw-Hill, 2011) - a digital audio signal as a series of samples describing the waveform.
- Gary Davis & Ralph Jones, The Sound Reinforcement Handbook, 2nd ed. (Yamaha / Hal Leonard, 1989) - microphone, line and speaker levels; input matching.
- ANSI/ASA S1.1-2013, Acoustical Terminology - audio frequency: the frequency of a normally audible sound wave.

### Tone  (FIX: definition + plain English only)

**Why it is needed.** Start Here's word TONE ('a sound with a clear, steady pitch'; the note also mentions 'a warm tone') linked to 'Pure Tone', which covers only the single-frequency case. The existing 'Tone' entry covers both meanings and is the right target, but its definition says the pitch sense means 'a single, steady frequency' only. A sung note is a tone with a clear pitch and many frequencies. The fix widens that one clause to the standard acoustics meaning; the rest of the entry is unchanged.

| | Current live text | Proposed text |
|---|---|---|
| definition | In audio, tone is the overall character or quality of a sound, determined mainly by its balance of frequencies and its harmonic content. The word also names a sound of a single, steady frequency (a pure tone or test tone) and, in music theory, the interval of a whole step. | In audio, tone most often means the overall character or quality of a sound (its tone color), determined mainly by its balance of frequencies and its harmonic content. In acoustics, a tone is also any sound heard as having a definite pitch: a pure tone of a single frequency, such as a test tone, or a complex tone, such as a sung or played note, whose several frequency components are heard together as one pitch. In music theory, a tone is also the interval of a whole step. |
| plain_english | Tone is the overall quality or color of a sound. It is what makes a sound bright, dark, warm, or thin. The word can also mean a steady sound at one pitch. | Tone is the overall quality or color of a sound. It is what makes a sound bright, dark, warm, or thin. The word can also mean any sound with a clear pitch, such as a test tone or a sung note. |

The UPDATE runs only while the live text still hashes to the values read on 2026-10-04 (definition `7874d1f7f5b843fdc028675f5d271bc3`, plain English `2ae50d5cbb7bcdd6bb621e6004ee0fac`). Every other field of the row is left as it is.

**Sources.**
- ANSI/ASA S1.1-2013, Acoustical Terminology - tone: a sound wave capable of exciting an auditory sensation having pitch, or a sound sensation having pitch.
- ANSI/ASA S3.20, Bioacoustical Terminology - pure tone and complex tone.
- Thomas D. Rossing, F. Richard Moore & Paul A. Wheeler, The Science of Sound, 3rd ed. (Addison-Wesley, 2002) - pitch of complex tones; timbre (tone color).
- Brian C. J. Moore, An Introduction to the Psychology of Hearing, 6th ed. (Brill, 2013) - pitch perception of complex tones.

### Recording  (FIX: definition + plain English only)

**Why it is needed.** Start Here teaches RECORDING as 'capturing audio so it can be stored and played later' and says 'the song on your phone is a recording waiting for playback'. The live 'Recording' entry defines only an event's capture in corporate AV ('capturing the event's audio and video to a file'), which is too narrow for the general word and confusing for a beginner. The term name is unique, so the general meaning belongs in this entry; the event meaning is kept as its last sentence. Only definition and plain English change.

| | Current live text | Proposed text |
|---|---|---|
| definition | Recording is the capture of an event's audio and/or video to a storage medium for later playback, archiving, or distribution. In corporate AV it produces the master file used for on-demand viewing, compliance, or content repurposing. | Recording is the capture of sound, or of signals such as audio and video, onto a storage medium - tape, disc, memory card or a computer file - so it can be played back, edited, archived or distributed later. The word names both the act of capturing and the stored result, a recording. At live and corporate events, the recording of a session typically becomes the master file used for on-demand viewing, compliance or reuse. |
| plain_english | Recording is capturing the event's audio and video to a file. So it can be watched or used later. | Recording means capturing sound, and sometimes video, so it can be kept and played back later. The word also names what you end up with: a song saved on your phone is a recording. At a live event, the recording is the file people watch or use afterwards. |

The UPDATE runs only while the live text still hashes to the values read on 2026-10-04 (definition `8a1e66ebe25fb7c0ba7cada3de30ca45`, plain English `a183c16733ac09c5ccb53c8ee19eeb4c`). Every other field of the row is left as it is.

**Sources.**
- IEC 60050-806:1997, International Electrotechnical Vocabulary - Part 806: Recording and reproduction of audio and video.
- David Miles Huber & Robert E. Runstein, Modern Recording Techniques, 9th ed. (Routledge, 2017) - recording as capture to a storage medium for later reproduction.

### Playback  (FIX: definition + plain English only)

**Why it is needed.** Start Here teaches PLAYBACK as 'reproducing recorded or stored audio for listening'. The live 'Playback' entry defines only show playback during an event, which is too narrow for the general word. Same approach as Recording: general meaning first, the event meaning kept. Only definition and plain English change.

| | Current live text | Proposed text |
|---|---|---|
| definition | Playback is the reproduction of pre-recorded audio or video content during an event, such as music, video roll-ins, stings, or recorded segments. The playback source and operator must deliver this content on cue and at the correct level. | Playback is the reproduction of previously recorded or stored audio, and often video, so it can be heard or seen again through loudspeakers, headphones or displays. In live events, theatre and broadcast, playback also means running pre-recorded content during a show - music, video roll-ins, stings or recorded segments - which the playback source and operator must deliver on cue and at the correct level. |
| plain_english | It is playing pre-recorded music or video at the right moment during a show. | Playback is playing something that was recorded, so you can hear it again through speakers or headphones. At a show, it also means playing pre-recorded music or video at exactly the right moment. |

The UPDATE runs only while the live text still hashes to the values read on 2026-10-04 (definition `aa3c16797c4b6ce9d1c7d48de7e7d241`, plain English `e758561f510875b82cd0e5e26ccad7e7`). Every other field of the row is left as it is.

**Sources.**
- IEC 60050-806:1997, International Electrotechnical Vocabulary - Part 806: Recording and reproduction of audio and video (reproduction).
- David Miles Huber & Robert E. Runstein, Modern Recording Techniques, 9th ed. (Routledge, 2017) - playback/reproduction of recorded audio.

## 5. App-side changes (for the agent that owns Start Here; NOT made here)

**Order:** apply the SQL first, then ship these. In the other order nothing breaks, because Start Here opens its own built-in copy and never queries for these words. But the new words would then be missing from the main Glossary search, and the built-in copy of Recording/Playback would differ from the live entries.

### 5a. `src/features/startHere/startHereContent.ts` (STARTER_TERMS)

| id | Line (as of 2026-10-04) | Change |
|---|---|---|
| `source` | 70-78 | `glossary: null,` and the whole `glossaryGap: '…'` property → `glossary: 'Sound Source',` (delete `glossaryGap`) |
| `listener` | 80 | `glossary: 'Listening Position'` → `glossary: 'Listener (acoustics)'` |
| `tone` | 82 | `glossary: 'Pure Tone'` → `glossary: 'Tone'` |
| `audioSignal` | 87 | `glossary: 'Audio'` → `glossary: 'Audio Signal'` |

Also update the comment above `glossary` (around line 57): "Verified present 2026-09-29" → "Verified present 2026-10-04 (after migration 2026100410)". After this change no starter word has a gap.

### 5b. `src/features/startHere/startHereGlossary.ts` (STARTER_GLOSSARY, the built-in copies)

`test/startHereOwnerAnswers.test.ts` already requires a built-in entry for every linked word, so these additions are mandatory:

- **Add** `'sound source'`, `'listener (acoustics)'`, `'audio signal'` and `tone`.
- **Replace** the text of `recording` and `playback` with the new text.
- **Remove** `'listening position'` and `'pure tone'`. No starter word links to them any more; keeping them is harmless, but they would be dead copies.
- In the header comment, change the copy date to 2026-10-04.

Exact text (identical to the SQL; generated from the same source):

```ts
  'sound source': {
    term: 'Sound Source',
    definition: 'A sound source is any vibrating object or process that disturbs the surrounding medium and radiates sound energy into it - for example the vocal folds, a guitar string coupled to its soundboard, a drum head, a loudspeaker cone, or turbulent airflow. Every sound begins at a source. A source is described by its sound power, its frequency content and its directivity; sound power is a property of the source itself, whereas the sound pressure level at a listener also depends on distance and on the surroundings.',
    plain_english: 'A sound source is the thing that makes a sound. It vibrates and pushes on the air around it: a voice, a guitar string, a drum or a speaker cone. Every sound starts at a source, then travels through a medium, such as air, to a listener.',
  },
  'listener (acoustics)': {
    term: 'Listener (acoustics)',
    definition: 'In acoustics, the listener is the receiver at the end of the source-path-receiver chain: the person whose ears receive a sound, or a microphone placed to receive it, after the sound has travelled from a source through a medium. What reaches a listener is the direct sound plus reflections from the surroundings, so its level, frequency balance and timing at the listening point differ from those at the source. A microphone receives sound physically, but hearing - the perception of pitch, loudness and timbre - happens in the ear and brain, and differs from one person to another.',
    plain_english: "The listener is whoever, or whatever, receives a sound: your ears, or a microphone. It is the last stop on a sound's journey from the source, through the medium, to the listener. A microphone receives sound, but it does not hear it the way a person does, and two people can hear the same sound differently.",
  },
  'audio signal': {
    term: 'Audio Signal',
    definition: 'An audio signal is an electrical or digital representation of sound, mainly at frequencies within the range of human hearing (roughly 20 Hz to 20 kHz), that equipment can carry, process, store and reproduce. In analog form it is a voltage that varies continuously in a pattern that follows the original sound wave; in digital form it is a stream of numbers, called samples, that describe the same waveform. An audio signal makes no sound by itself: it becomes sound again only when a transducer such as a loudspeaker or headphone turns it back into vibration in the air. Audio signals come from microphones and pickups, or are generated electronically, as by a synthesizer or a test-tone oscillator.',
    plain_english: 'An audio signal is sound turned into electricity or numbers, so equipment can work with it. A microphone makes one from sound, and a speaker turns it back into sound. You cannot hear an audio signal itself. It travels silently through cables and equipment until a speaker or headphones play it.',
  },
  tone: {
    term: 'Tone',
    definition: 'In audio, tone most often means the overall character or quality of a sound (its tone color), determined mainly by its balance of frequencies and its harmonic content. In acoustics, a tone is also any sound heard as having a definite pitch: a pure tone of a single frequency, such as a test tone, or a complex tone, such as a sung or played note, whose several frequency components are heard together as one pitch. In music theory, a tone is also the interval of a whole step.',
    plain_english: 'Tone is the overall quality or color of a sound. It is what makes a sound bright, dark, warm, or thin. The word can also mean any sound with a clear pitch, such as a test tone or a sung note.',
  },
  recording: {
    term: 'Recording',
    definition: 'Recording is the capture of sound, or of signals such as audio and video, onto a storage medium - tape, disc, memory card or a computer file - so it can be played back, edited, archived or distributed later. The word names both the act of capturing and the stored result, a recording. At live and corporate events, the recording of a session typically becomes the master file used for on-demand viewing, compliance or reuse.',
    plain_english: 'Recording means capturing sound, and sometimes video, so it can be kept and played back later. The word also names what you end up with: a song saved on your phone is a recording. At a live event, the recording is the file people watch or use afterwards.',
  },
  playback: {
    term: 'Playback',
    definition: 'Playback is the reproduction of previously recorded or stored audio, and often video, so it can be heard or seen again through loudspeakers, headphones or displays. In live events, theatre and broadcast, playback also means running pre-recorded content during a show - music, video roll-ins, stings or recorded segments - which the playback source and operator must deliver on cue and at the correct level.',
    plain_english: 'Playback is playing something that was recorded, so you can hear it again through speakers or headphones. At a show, it also means playing pre-recorded music or video at exactly the right moment.',
  },
```

### 5c. Tests to expect

- `test/startHere.test.ts:60-69` stays green: a non-null target needs no gap text.
- `test/startHereOwnerAnswers.test.ts:12-19` stays green only if 5b is done together with 5a.
- A receipt for the relink should assert:
  - `termById('listener').glossary === 'Listener (acoustics)'`;
  - `termById('source').glossary === 'Sound Source'`;
  - `termById('audioSignal').glossary === 'Audio Signal'`;
  - `termById('tone').glossary === 'Tone'`;
  - `starterGlossaryEntry` finds each of them.

## 6. Duplicates, near-duplicates and other findings

**No new term duplicates an existing one.** Checked case-insensitively, and against these neighbours:

| New term | Closest existing entries | Why the new one is still needed |
|---|---|---|
| Sound Source | `Source` (FET terminal), `Source Device` (electrical start of a signal chain), `Source Sound` (raw post-production material), `Point Source` / `Reference sound source` / `Complex sound source` (specialist) | None is the plain acoustic source. `Source Device` is the right link for the *electrical* idea, and the new entry points to it and warns about mixing the two up. |
| Listener (acoustics) | `Listener` (networked-audio endpoint), `Audio listener` (game engine), `Listener position` (game audio), `Listening Position` (HiFi seat), `Source-path-receiver model` (noise control) | None defines the listener as the receiver of sound. The suffix follows the house pattern of `Compression (acoustics)` and `Condensation (acoustics)`, because `Listener` is taken and the term column is unique. |
| Audio Signal | `Audio` (the word), `Audio signal path` (the route), `Digital signal`, `Sound signal` (soundscape studies) | None defines the signal itself. |

**Existing term that should be the link target instead of a new term:** `Tone`. I did not author a new "tone" entry. The existing `Tone` already covers both meanings Start Here uses, and it only needs its one narrow clause widened.

**Near-duplicates already in the glossary.** These are not caused by this work and are not changed by the SQL. They are flagged for a later clean-up:
- `Listening Position` (HiFi, gs3760) and `Listener position` (game audio, gs4250), with `Sweet Spot` (intermediate) covering the same seat.
- `Audio cable` (intermediate, gs3280) and `Cables (audio)` (beginner).
- `Hertz` and `Hertz (Hz)`.
- `Signal-to-noise ratio` and `Signal-to-Noise Ratio` (two rows differing only by case).
- `automatic mic mixer` and `Automatic microphone mixer [no topic]`.

**Other notes:**
- `Audio`: its definition treats sound in the air and the electrical signal both as "audio". This is real professional usage ("audio frequency"). Start Here's own note covers it ("once a speaker turns the signal back into vibration in the air, what you hear is sound again"), so I left it. With `Audio signal` moved to the new entry, the strict sense now has its own page.
- **Unlinked lesson words:** mixer, level, dBFS, clipping, unity gain, hertz, diaphragm, fader and SPL all have live beginner entries (`Mixer`, `Level`, `dBFS`, `Clipping`, `unity gain`, `Hertz`, `Diaphragm`, `Fader`, `Sound Pressure Level`). Start Here does not link them today; that is a content choice, not a gap.
- **Topic progress:** the new terms join topics gs3000 (215 → 217 terms) and gs3030 (153 → 154). A learner who had studied every term in those topics will see display progress dip slightly. Banked credit is untouched.

## 7. What Comp A does

1. Read and approve this document with the owner.
2. Run `supabase/migrations/2026100410_glossary_starthere_terms.sql` once. It is one transaction and is safe to run twice.
3. Run the VERIFY query at the end of the file. Expect 6 rows:
   - `Audio Signal`, `Listener (acoustics)` and `Sound Source` with `n_topics = 1, visible = true`;
   - `Playback`, `Recording` and `Tone` with `def_md5` equal to the new-text md5s listed under the query.
4. If a fix row did not change (its old-text md5 no longer matched), someone edited that entry after 2026-10-04. Re-read it and merge by hand. Do not force it.
5. Tell the Start Here owner to make the app-side changes in section 5.

# P14 — MIDI, Sampler & Beat Lab: build specification

Written 2026-11-19 from Comp B's proposal P14 (COMP_B_TO_CCODE_2026-11-18_NEW_LAB_PROPOSALS, section P14) and the owner's decisions of 2026-11-19 (OWNER_DECISIONS_2026_11_19.md: all HOLD defaults accepted; specs only).
**Status: SPEC ONLY. Nothing is built.** The build starts only on the owner's explicit GO (D56: Opus at HIGH effort). No store build, no OTA, no server change comes from this document.

---

## 1. Summary for the owner

**What the learner does.** The learner plays on-screen keys and sees every MIDI message as it is sent, in code and in plain words. They hear the same message played by three different instruments, which shows that MIDI is instructions, not sound. They take a loosely played part and compare quantise at 50 % and 100 %, swing at 54 % and 66 %, and humanise, against the played original. They build a sampled snare with three velocity layers and round robin, and use it to fix a "machine-gun" snare roll. They loop a pad and hear the click at a bad loop point, then remove it with a crossfade. They take a drum loop to a new tempo two ways, by speeding it up (pitch changes) and by stretching it (pitch stays, hits smear), and hear what each method costs. They hear a voice shifted with and without its formants. They program a beat on a 16-step grid with accents, ghost notes and a hi-hat choke group, and chain patterns into a song form. They learn how MIDI clock differs from timecode. Two short closing pages, one for Ableton Live and one for Logic Pro, say in words where each idea lives in that program. Neither page copies the program's screens (H21).

**How it earns credit.** There are 25 pages in 6 parts. A page with a task counts when its task and its check are done. A reading page counts when it is read through. The whole lab counts when Parts 1–5 (23 pages) are done; key `tr_midi_sampler_beat`. Each part also earns its own key, because some certificates need only some parts: DAW Power User needs Parts 1–2, for example. The two program pages (Part 6) are optional paths with their own keys. The Ableton certificate needs its own page, and the Logic certificate needs its own. Credit is never removed. The lab can always be redone, and NEXT always moves on.

**Size.** Large, about the size of the Game Audio Lab: 25 pages, its own sound engine (the same proven web-view method the Game Audio Lab uses), and roughly 18,000–24,000 lines of code including tests. It adds about 6–8 MB of sound files to one over-the-air update.

**No native build is needed.** Everything goes out by OTA, but only on your word.

**What it needs from you:**
1. **The sample library (H26: a licensed library; you OK the cost).** I need you to pick the library and approve the cost. Its licence must allow the sounds to be played inside a paid app, including one sound at a time. Many "royalty-free" licences forbid that, so the licence text is checked before purchase. This is the only real blocker, and it holds back the **listing** of the lab, not the building of it (section 8).
2. **A tile image** for the Labs menu. You choose the folder and give permission, as with the Game Audio tile.
3. **Optional:** a short part you play yourself on a MIDI keyboard (about 8 bars of keys or bass, saved as a MIDI file). It would be the "played reference" in Part 2. Without it, the lab uses a take it writes itself and says so.
4. **At listing:** confirm which certificates require the lab (section 6: Comp B's ten, checked against our slugs). In-progress learners are exempt (H20).
5. **The usual reviews before handover:** an audio-expert pass, a learning pass and a visual pass, then your own listening.

---

## 2. Learning outcomes (knowledge, never skills)

After the lab, the learner **knows / understands**:

1. **What MIDI sends.** MIDI carries instructions: note on and off, velocity, controllers, pitch bend, aftertouch, program and bank changes. It carries no sound. The receiving instrument decides what each message sounds like.
2. **Channels and receivers.** There are 16 channels, sent as 0–15 and shown as 1–16. A receiver plays only the channels it listens to. A note-on with velocity 0 means "note off". The bend range and the velocity response are set at the receiver.
3. **Clock versus timecode.** MIDI clock sends 24 pulses per quarter note and follows the tempo. Timecode sends a position in hours, minutes, seconds and frames, whatever the tempo.
4. **Timing tools.** Quantise strength moves a note part of the way to the grid. Swing delays every second note of a pair. Humanise adds bounded random offsets. None of these settings is "correct". The feel of a part comes from timing, velocity and note choice together.
5. **How a sampler chooses a sound.** Root key, key zones, velocity layers and round robin decide which recording plays. Playing away from the root changes both pitch and length. Loop points and crossfades decide whether a held note clicks. The envelope shapes how each note starts and ends.
6. **Repitching versus time-stretching.** Repitching changes speed, so pitch and length move together. Time-stretching changes length but keeps the pitch, at a cost (smeared or doubled hits, a phasey sound) that grows with the amount. A pitch shift that keeps the formants sounds like the same voice; one that moves them does not.
7. **Beat programming.** A beat is built from kits and a drum note map, choke groups, accents and ghost notes, and patterns chained into a song form.
8. **Where these ideas live** in Ableton Live and in Logic Pro (the optional Part 6 pages).

**Must not teach** (Comp B and this spec):
- that MIDI is audio;
- that 100 % quantise is "correct";
- that time-stretching is free of artefacts;
- that more timing offset always means more groove (research does not support it, section 5 row T6);
- one octave name for note 60 as the only one (section 5 row M3);
- any setting as a rule. Every value is a **suggested starting point**.

---

## 3. Screen-by-screen plan

### 3.0 Frame (applies to every page)

- **Shell.** `kit/PagedLab` with labId `midi-beat`, title "MIDI, Sampler & Beat Lab", unitNoun `page`, `accuracy={false}` (a concept lab with screen guides; the ⓘ "about these starting points" note uses `accuracyVariant 'about'`), `labDoneKey = tr_midi_sampler_beat`, `optionalPage` for pages 24–25, `pageDetail` (each unmet goal by name), `handsOnDetail`, and `endGuide`. FINISH opens the shared what's-left screen (`LabEndScreen`): every page not done by name, OPTIONAL PATHS for 24–25, PRACTISE AGAIN and DONE. **Nothing ever blocks NEXT.**
- **Rack Unit on every page with a live display**, built from a per-lab wrapper `MbRack`, modelled on `GaRack`:
  - the display is pinned at the top, with read-only bezel readouts;
  - the lesson sits in the scrolling well;
  - every control is in the bottom dock.
  - **No buttons are drawn inside the display, and no bezel cell takes a press** (owner rule 2026-10-10). Step entry, key playing and zone editing all happen in dock trays. The display only shows.
  - Full screen is a working surface (D35), and everything in the drawing zooms with the step.
- **Dock budget.** At most 4 page keys plus SOUND and ■ STOP, so a 320-wide phone never wraps a row (the Game Audio page 22 lesson). SOUND and ■ STOP sit in the same place on every page and behave as in the Game Audio Lab.
- **Text.** Display text is at least 9 pt at 390 wide after `fitValue`. A cropped readout drops its label, never its number (D36). No distinction is made by colour alone. MIDI hex uses the house mono face.
- **Voice.** The help speaks to the student and is written for each screen. Intros claim knowledge ("what a note message carries"), never skills. Values are given as "after our research, here is where we recommend you begin". No sources, citation codes or authority names appear in learner text (charter §12); the sources stay in `docs/labs/midibeat/SOURCES.md`. Pages 1–23 are DAW-neutral, with no product names. Brand names appear only on pages 24–25, and as a PRO NOTE where an engineer would naturally say them (for example Ableton Link on page 6).
- **Page shape** (as in the Game Audio Lab): `Step` blocks (UNDERSTAND · TRY · LISTEN · CHECK), goal chips, an activity log where it helps, and a short check (`UnderstandingCheck`, `tuning/components/check`) on task pages. Aim for about 150–260 words of lesson per page. Each page gets a screen guide `pages/guides/pNN.ts` (`ScreenGuide`: learning, start, seeing, control, changes, teaches, tryThis).
- **Done rule** (owner decision 2026-11-14, "done = work done"):
  - a reading page is `reading: true`;
  - a task page is `manualDone` and calls `ctx.markDone()` only once its goals and its check are met;
  - the page lists say which is which.
- **Page titles carry the part number** ("1·3 Channels, programs and banks"), so a learner whose certificate needs only Part 1 can find it in CONTENTS. The shared shell shows no group headings.
- **Order is final before first publish.** Saved page marks are kept by index (see the Game Audio `gaPageLayout` lesson). The two optional DAW pages are last, so an added program page can later go at the end without a migration.
- **Members only (H22).** The catalog leaf has `member: true`, RootNavigator routes it through `MemberGated` → `withMembershipPreview` → `useMemberGate`, and a guest preview has no sound and no prompt. Guests earn nothing (D57; the labCompletion queue already enforces it).
- **Session state.** One sound session and one lab store for the whole lab (`MbLabProvider`). Pages 1–17 each open on a clean state. Part 5 shares one beat pattern across its five pages for the session. If that pattern is empty, a page loads the lab's starter pattern, and SETUP › RESET PATTERN restores it. Nothing the learner makes is saved across launches (no list screen, no UNREADABLE case, nothing to lose). Only the page marks persist, through PagedLab.

### Part 1 — What MIDI sends (pages 1–7, key `msb_midi`)

**Page 1 · 1·1 Welcome and your listening level** (rack; task: sound set up or declined)
- **Display.** An illustrated scene: a generic keyboard controller, a 5-pin MIDI cable, and a generic sound module with a speaker. Messages travel as labelled packets (an overlay, labelled as one). The cable carries no sound; the speaker shows the sound wave.
- **Bezel.** SOUND (ON/OFF/BLOCKED…), LEVEL (dB of the lab's master), LAST MESSAGE.
- **Dock.** LEVEL (lane), KEYS (tray: one octave and an octave shift), SOUND, ■ STOP.
- **Learner.** Sets a comfortable level and plays a few notes, or chooses to continue without sound. Every page still teaches silently: the monitor and the drawings carry the lesson.
- **Teaching intent.** What the lab covers. What MIDI is: a language of instructions between devices, not sound. The safe-listening note in the house wording.
- **Help intent.** Where the level is, why it starts low, what the packets on the cable mean, and that the sound comes from the module, not the cable.

**Page 2 · 1·2 Note on, note off, velocity** (rack; task)
- **Display.**
  - the **MIDI MONITOR STRIP**: a scrolling list of every message, newest at the bottom, with its time, raw bytes in hex (`90 3C 60`) and plain words ("Note on · ch 1 · note 60 (C4) · velocity 96");
  - a short **piano roll** above it, showing each note as a bar whose shade follows velocity, on a real time base.
- **Bezel.** LAST NOTE, VELOCITY, NOTES HELD.
- **Dock.**
  - KEYS (tray).
  - VELOCITY (lane). A screen tap has no strike force, so the lane sets the velocity of the next taps. The help says so.
  - OFF STYLE (options: "note off (8n)" / "note on, velocity 0 (9n 00)").
  - SOUND, ■ STOP.
- **Goals.** Play notes at three clearly different velocities. Switch OFF STYLE and see both forms of the same release.
- **Teaching intent.**
  - A message is a status byte (what and which channel) followed by data bytes (which note, how hard).
  - Note numbers run 0–127 and 60 is middle C. This lab names it C4, as the Calculator Lab does; some software names it C3.
  - Velocity is how hard, 0–127. What it does to the sound is the receiver's choice.
  - A note-on with velocity 0 is a note off.
- **Check.** "90 3C 00: what happens?"
- **Help intent.** How to read one line of the monitor left to right, and why the velocity lane exists.

**Page 3 · 1·3 The same message, a different sound** (rack; task)
- **Display.**
  - the monitor strip, frozen on a captured 4-second phrase;
  - three receiver panels (KEYS, BASS, DRUMS), the selected one lit;
  - an output waveform on a real time base.
- **Bezel.**
  - MIDI DATA (bytes in the phrase);
  - AUDIO DATA (bytes for the same 4 s at 48 kHz, 16-bit, stereo, using the existing File Size calculator's function);
  - RECEIVER.
- **Dock.** RECEIVER (options), PLAY PHRASE, TRANSPOSE (lane, ±12), SOUND, ■ STOP.
- **Goals.**
  - Play the phrase on all three receivers.
  - Transpose it and see that every note number moves while the timing does not.
  - Notice that on DRUMS each note number is a different drum.
- **Teaching intent.**
  - MIDI is instructions; audio is the sound itself.
  - The same bytes make a piano, a bass or a drum kit.
  - The MIDI data is tiny next to the audio (the readouts show the ratio).
  - A MIDI part can be edited note by note after it is played; a recording cannot, in the same way.
- **Check.** Same part, piano then drums: what changed?
- **Help intent.** Why the monitor does not change when the sound does, and what the two DATA readouts compare.

**Page 4 · 1·4 Channels, programs and banks** (rack; task)
- **Display.**
  - a multitimbral receiver drawn as parts: Part A listens on ch 1, Part B on ch 2, Drums on ch 10;
  - the monitor strip.
  - A message on a channel nobody listens to shows "no part listening on ch 3", in words, never as an error tone.
- **Bezel.** SEND CH, PART HIT, PROGRAM, BANK.
- **Dock.**
  - CHANNEL (options 1–16);
  - PROGRAM (tray: program number and a BANK MSB/LSB pair, then SEND, which prints `Bn 00 mm`, `Bn 20 ll`, `Cn pp` in that order);
  - KEYS (tray);
  - SOUND, ■ STOP.
- **Goals.**
  - Play a note that only Part B hears.
  - Find the silent channel case.
  - Send a bank-and-program change and see the part's sound name change.
- **Teaching intent.**
  - There are 16 channels: sent 0–15, shown 1–16.
  - Program change chooses one of 128 sounds. Devices may show them as 0–127 or 1–128.
  - Bank select (CC 0 and CC 32) comes before the program change to reach more than 128.
  - Channel 10 is the drum channel in General MIDI. Many devices follow it; not all do.
- **Check.** "Bass part on ch 2, synth listening on ch 3: why is it silent?"
- **Help intent.** How to read the part panel, and the order of the three bank/program messages.

**Page 5 · 1·5 Controllers, pitch bend and aftertouch** (rack; task)
- **Display.**
  - the monitor strip;
  - a **pitch meter** showing the sounding pitch in semitones from the played note;
  - a controller panel showing each controller's current value as a bar.
- **Bezel.** BEND VALUE (0–16,383), BEND (st), RANGE (±st, "set at the receiver"), MOD, SUSTAIN.
- **Dock.**
  - BEND (lane; it springs back to the centre, 8,192, on release, like a wheel);
  - RANGE (options ±2 / ±7 / ±12, labelled RECEIVER SETTING);
  - CONTROLS (tray: MOD CC 1, VOLUME CC 7, EXPRESSION CC 11, PAN CC 10, SUSTAIN CC 64 on/off, CHANNEL PRESSURE, and PANIC, which sends All Notes Off CC 123 and All Sound Off CC 120);
  - SOUND, ■ STOP.
- **Goals.**
  - Bend the same amount at ±2 and at ±12 and compare: the message is identical, the pitch is not.
  - Hold notes with sustain.
  - Use PANIC.
- **Teaching intent.**
  - Controllers are numbered 0–119; numbers 120–127 are channel-mode messages.
  - Pitch bend is a 14-bit value (0–16,383, centre 8,192, sent low byte first). Its range is the receiver's setting, ±2 semitones by default in General MIDI.
  - Sustain reads 64 and above as on.
  - Volume and expression are two different controllers.
  - A PRO NOTE says MIDI 2.0 exists, with higher resolution and two-way conversation between devices, and that this lab shows MIDI 1.0, which most gear still speaks.
- **Check.** One bend message, two synths set to ±2 and ±12: what do you hear?
- **Help intent.** What the RANGE options change and what they do not, and what PANIC sends.

**Page 6 · 1·6 Keeping devices together: clock and timecode** (rack; task)
- **Display.**
  - a leader (the lab's sequencer) and a follower (a generic drum machine), each with a beat counter;
  - a **clock tick train**: 24 ticks per beat, every 6th marked, which is one sixteenth;
  - a **timecode readout** HH:MM:SS:FF beside a picture strip.
- **Bezel.** TEMPO, TICK (ms), FOLLOWER, TIMECODE.
- **Dock.**
  - TEMPO (lane);
  - SYNC (options: INTERNAL / MIDI CLOCK / TIMECODE);
  - TRANSPORT (tray: START `FA`, STOP `FC`, CONTINUE `FB`, and a SONG POSITION jump);
  - SOUND, ■ STOP.
- **Goals.**
  - Change the tempo on MIDI clock and see the follower stay locked.
  - On INTERNAL, set the follower a few tenths of a BPM away and watch the two drift apart within a few bars.
  - On TIMECODE, change the tempo and see that the time position does not depend on it.
- **Teaching intent.**
  - Clock carries tempo, tick by tick (24 per quarter note; at 120 BPM a tick every 20.8 ms).
  - Start, Stop and Continue carry the transport. Song Position Pointer says where to start, in sixteenths.
  - Timecode (MTC) carries a time position for picture and tape, in frames.
  - Clock follows the music; timecode follows the clock on the wall.
  - PRO NOTE: network tempo sync (for example Ableton Link) does the same job over Wi-Fi.
- **Check.** "You score to picture. Which keeps your music at the right place in the film?"
- **Placement reason (internal).** This page sits in Part 1, not Part 5 as Comp B grouped it. The film credentials (Parts 1–4) need timecode. The live-performance certificate, which requires Parts 3 and 5, already learns MIDI clock in `tr_dj` screen 22.
- **Help intent.** How to read the tick train, and why the INTERNAL case drifts.

**Page 7 · 1·7 Read a MIDI stream** (rack; task, the Part 1 practice)
- **Display.**
  - a captured stream of about 14 messages in hex only: note ons and offs, a note-on with velocity 0, running status (a note with no status byte), a CC, a bend pair, a program change, and clock and start bytes;
  - the line being answered is highlighted.
- **Bezel.** LINE n / 14 (a position, never a score out of a total), ANSWERED.
- **Dock.** PREV LINE, NEXT LINE, PLAY STREAM (hear it), SOUND, ■ STOP.
- **Learner.** For each line, chooses its plain-words meaning (choice cards in the well; answer choices are exempt from the dock rule).
- **Scoring.** On reasoning: every reasonable reading is accepted. For example "note 60 off" and "note on, velocity 0, which acts as off" both count. Each wrong option gets a "why not" line.
- **Goal.** Every line answered, with no score threshold. The page counts when every line has been read with its explanation, and nobody fails.
- **Teaching intent.** Pulls the part together. It adds running status: a run of messages of the same kind may leave out the repeated status byte.
- **Help intent.** How to find the status byte (the first byte of 80 or above) and what to do when a line has none.

### Part 2 — Recording and editing MIDI (pages 8–11, key `msb_editing`)

**Page 8 · 2·1 The grid and the played part** (rack; task)
- **Display.** A piano roll with a beat grid. Shown is the **played reference** — the owner's take if supplied, otherwise a take the lab wrote, labelled so. Each note's start offset from the nearest grid line is shown as a small tick (late right, early left), with an offset strip below in milliseconds.
- **Bezel.** TEMPO, GRID, NOTE OFFSET (ms, for the selected note), AVG |OFFSET|.
- **Dock.**
  - PLAY;
  - GRID (options 1/4, 1/8, 1/16, 1/16T);
  - SELECT (lane: steps through notes);
  - TAP IN (tray: two pads to record your own loose part over a click; the timing comes from the touch time).
  - The help says the sound you hear back can lag on some phones, while the timing kept is the touch.
  - SOUND, ■ STOP.
- **Goals.** Play the take, read three offsets, and change the grid once.
- **Teaching intent.**
  - A sequencer stores time in ticks of a beat. This lab uses 960 per beat; programs differ.
  - A beat lasts 60,000 ÷ BPM ms (the BPM calculator's function).
  - Played notes sit a little off the grid, early and late, by a few to a few tens of milliseconds.
- **Help intent.** Reading the offset strip; what TAP IN records and what it cannot know (the phone's output delay).

**Page 9 · 2·2 Quantise and its strength** (rack; task)
- **Display.** The same roll. Ghost outlines mark the played positions and arrows show each note's move. A histogram of offsets shows before and after.
- **Bezel.** STRENGTH %, GRID, AVG |OFFSET| before → after.
- **Dock.** STRENGTH (lane 0–100 %), GRID (options), A/B (played / quantised), SOUND, ■ STOP.
- **Goals.** Hear and see 50 % and 100 % against the played take.
- **Teaching intent.**
  - Strength moves each note that fraction of the way to the grid; 50 % halves every offset.
  - 100 % removes the played timing, which is a choice for a locked, machine feel, not the "correct" setting.
  - Quantising to the wrong grid moves notes to the wrong beat.
  - Suggested starting point: a partial strength keeps some of the player.
- **Check.** "A note is 20 ms late. Quantise at 50 %: where does it land?"
- **Help intent.** What the arrows and ghost outlines mean.

**Page 10 · 2·3 Swing** (rack; task)
- **Display.** Pairs of sixteenths drawn as bars. The second of each pair moves later as swing rises, with the delay printed in ms. A straight row and a triplet row are drawn as guides.
- **Bezel.** SWING %, DELAY (ms), NOTE (1/8 or 1/16), TEMPO.
- **Dock.** SWING (lane 50–75 %), NOTE (options), TEMPO (lane), SOUND, ■ STOP.
- **Goals.** Hear 54 % and 66 % on sixteenths. Find the setting that sits on the triplet row.
- **Teaching intent.**
  - In this lab, swing is the share of a pair's time the first note takes. 50 % is straight; about 66.7 % is the triplet feel.
  - Programs scale their swing controls differently, so a number does not carry from one program to another.
  - Players swing more at slow tempos and less at fast ones. Suggested starting points, never rules.
- **Check.** Swing 66 % on sixteenths at 120 BPM delays each second sixteenth by about how much? (≈ 40 ms.)
- **Help intent.** How the delay readout is worked out from tempo and swing.

**Page 11 · 2·4 Humanise and groove** (rack; task)
- **Display.**
  - the roll with a humanise range band around each grid line, and velocity bars under the notes;
  - a groove template drawn as its offset and velocity pattern over one bar.
- **Bezel.** TIMING ± (ms), VELOCITY ±, GROOVE, SEED.
- **Dock.**
  - HUMANISE (lane: timing range);
  - GROOVE (options: none / straight / swung / laid-back / pushed);
  - A/B (with the played reference);
  - SOUND, ■ STOP.
- **Goals.** Apply humanise and hear it. Apply two groove templates and compare them with the played reference.
- **Teaching intent.**
  - Humanise adds random offsets inside a set range. The same seed gives the same result, so a take can be repeated.
  - A groove template is a pattern of offsets and velocities, often taken from a played part.
  - The feel of a part comes from timing, velocity and note choice together. Small offsets change the feel, but more offset is not automatically more groove.
  - "Laid-back" means hits slightly after the beat; "pushed", slightly ahead. The amounts are suggested starting points.
- **Check.** Is a part with more random timing always groovier? (No, with the reason.)
- **Help intent.** What the band around each grid line shows, and why the seed matters.

### Part 3 — The sampler (pages 12–15, key `msb_sampler`)

**Page 12 · 3·1 One sample across the keyboard** (rack; task)
- **Display.**
  - the **SAMPLER MAP**: keys across and velocity up, each zone a labelled rectangle with its root key marked;
  - under it, the playing sample's waveform on a real time base, with its length marked.
- **Bezel.** KEY, ROOT, RATIO, SHIFT (st), LENGTH (s).
- **Dock.** KEYS (tray), ROOT (options), ZONES (tray: set three zones from three recorded roots), SOUND, ■ STOP.
- **Goals.**
  - Play the single sample an octave above its root and see the length halve.
  - Map three roots into three zones and compare.
- **Teaching intent.**
  - A sampler plays a recording faster to raise it: ratio = 2^(semitones ÷ 12), which is the Calculator Lab's transposition function.
  - Pitch and length move together.
  - Far from the root, the instrument's character changes ("chipmunk" or "slow motion"), so instruments are recorded at several roots and each recording covers a zone.
- **Check.** Root C3, played at C4: what happens to pitch and length?
- **Help intent.** How to read the map (keys across, velocity up), and what RATIO means.

**Page 13 · 3·2 Velocity layers** (rack; task)
- **Display.**
  - the map with the snare in three velocity bands (soft / medium / hard);
  - a spectrum snapshot of the layer that played, computed from the real sample, with the soft and the hard layer outlined.
- **Bezel.** VELOCITY, LAYER, SPLITS, CROSSFADE.
- **Dock.**
  - VELOCITY (lane);
  - SPLITS (tray: two split points);
  - MODE (options: "one recording turned down" / "layers");
  - CROSSFADE (on/off: blends neighbouring layers near a split);
  - SOUND, ■ STOP.
- **Goals.** Compare "turned down" against "layers" at a soft velocity, and move one split point.
- **Teaching intent.**
  - A softly hit drum is not just quieter: it is darker and has a softer attack. Real instruments do this, so samplers hold separate recordings for different strengths.
  - The velocity → level curve is the instrument's choice. This lab states its own curve on the page.
- **Check.** Why use a soft recording instead of turning a hard one down?
- **Help intent.** The spectrum outline and what moves when you change a split.

**Page 14 · 3·3 Round robin: fix the machine-gun snare** (rack; task, the Part 3 practice)
- **Display.**
  - a 16th-note snare roll on a timeline, each hit labelled with the recording it used (L2·RR3, and so on);
  - SAME TAKE joins any two hits that used the identical recording.
- **Bezel.** ROUND ROBIN, ORDER, REPEATS (count of SAME TAKE in the last bar), LAYERS.
- **Dock.**
  - PLAY ROLL;
  - SETUP (tray: ROUND ROBIN on/off, ORDER cycle / random-no-repeat, LAYERS on/off, a velocity ramp for the roll);
  - A/B (before / your fix);
  - SOUND, ■ STOP.
- **Goals.** Hear the machine-gun roll. Fix it with round robin and layers, so that REPEATS reaches 0. Compare A/B.
- **Teaching intent.**
  - The ear notices an exact repeat at once.
  - Several takes of the same hit, used in turn, remove the effect. Layers add the change of tone with strength.
  - This links to the Game Audio Lab's "variation" page, the same idea in another job.
- **Check.** A roll sounds like a machine gun: which two settings fix it?
- **Help intent.** What the take labels mean, and what counts as a repeat.

**Page 15 · 3·4 Loops, crossfades and the envelope** (rack; task)
- **Display.**
  - a sustained pad sample's waveform, with LOOP START and LOOP END markers;
  - a **seam view** that zooms on the join, showing the samples either side so a jump is visible;
  - the amp envelope (A D S R) drawn as one line under it.
- **Bezel.** LOOP (start–end, ms), SEAM JUMP (step size at the join), XFADE (ms), MODE.
- **Dock.**
  - LOOP (lane: moves the end marker);
  - SNAP (on/off: to a zero crossing);
  - XFADE (lane 0–200 ms);
  - SHAPE (tray: MODE one-shot / gate / loop, and A, D, S, R);
  - SOUND, ■ STOP.
- **Goals.**
  - Hear the click at a bad loop point.
  - Remove it with SNAP and with XFADE.
  - Set a release that ends the held note naturally.
- **Teaching intent.**
  - A held note longer than its recording repeats a section.
  - A sudden jump in the wave at the join is heard as a click (a step contains energy at all frequencies).
  - A zero crossing or a crossfade smooths the join.
  - One-shot plays the whole sample; gate stops at release; the envelope shapes both.
  - This links to the Sound Envelope Lab.
- **Check.** Why does a loop click, and name one fix.
- **Help intent.** How to read the seam view; what each MODE does when the key is released.

### Part 4 — Time and pitch (pages 16–18, key `msb_timepitch`)

**Page 16 · 4·1 Speed it up, or stretch it?** (rack; task)
- **Display.**
  - two waveform lanes aligned on a beat grid: REPITCH and STRETCH, with the original as a faint guide;
  - transient markers on every hit;
  - a zoom box on one snare hit shows the stretched hit smeared or doubled.
- **Bezel.** FROM (BPM), TO (BPM), RATIO, PITCH (st), LENGTH.
- **Dock.**
  - TO (options 75 / 85 / 90 / 100 / 110 / 120; the loop is 90 BPM);
  - METHOD (options REPITCH / STRETCH);
  - A/B (with the original);
  - SOUND, ■ STOP.
- **Goals.** Take the loop to 100 BPM both ways and listen. Then take it to 120 and find the smear in the zoom box.
- **Teaching intent.**
  - Repitching changes speed: 90 → 100 BPM raises the pitch by 12·log2(100/90) ≈ 1.8 semitones.
  - Stretching keeps the pitch by cutting the sound into short grains and overlapping them, which smears sharp hits.
  - The bigger the change, the more you hear.
- **Check.** A 90 BPM loop sped up (repitched) to 100 BPM: what happens to its pitch?
- **Help intent.** How the two lanes line up, and where to look in the zoom box.

**Page 17 · 4·2 What stretching costs** (rack; task)
- **Display.** The STRETCH lane at the chosen amount, with a grain overlay (an overlay, labelled as one) showing how the sound is cut and overlapped. A SLICE view shows the loop cut at its hits and the slices moved apart or together.
- **Bezel.** AMOUNT (%), GRAIN (ms), MODE, GAPS/OVERLAPS.
- **Dock.** AMOUNT (lane −30 … +30 %), MODE (options GRAIN / SLICE AT HITS), GRAIN (options short / long), SOUND, ■ STOP.
- **Goals.** Compare GRAIN and SLICE at +25 %. Compare short and long grains on the snare.
- **Teaching intent.**
  - Small changes are clean. Large ones smear, double or sound phasey.
  - Short grains keep hits sharper but roughen sustained tones; long grains do the reverse.
  - Slicing at the hits keeps every hit intact but leaves gaps (when slowed) or overlaps (when sped up).
  - Better commercial methods hide the artefacts further; none removes them.
- **Check.** Which of these is true about stretching? (One honest statement against "artefact-free" distractors.)
- **Help intent.** What the grain overlay shows, and what to listen for at each setting.

**Page 18 · 4·3 Pitch, formants and the voice** (rack; task)
- **Display.** A spectrum of the voice: harmonic lines from the real FFT of the rendered audio, plus the **formant envelope** (the model's curve). When pitch moves, the harmonics slide; the envelope either stays put or slides with them.
- **Bezel.** SHIFT (st), FORMANTS (keep / move), F1 · F2 (Hz).
- **Dock.** SHIFT (lane −12 … +12 st), FORMANTS (options KEEP / MOVE WITH PITCH), PLAY, SOUND, ■ STOP.
- **Goals.** Shift +5 and −5 both ways and compare.
- **Teaching intent.**
  - A voice's pitch comes from the vocal folds; its vowel and size come from resonances called formants.
  - Speeding a voice up moves both, which is why it sounds small.
  - A formant-keeping shift moves only the pitch.
  - The voice here is made by a voice model (the Speech & Voice Lab's), so the two cases are exact. The page says it is a model.
- **Check.** Why does a sped-up voice sound smaller?
- **Help intent.** Reading harmonics against the envelope curve.

### Part 5 — Beat programming (pages 19–23, key `msb_beats`)

**Page 19 · 5·1 The step grid and the drum map** (rack; task)
- **Display.**
  - a **16-step grid**, two bars visible, with lanes KICK, SNARE, CLOSED HAT, OPEN HAT, CLAP and PERC;
  - a playhead;
  - each lane's MIDI note number, from the General MIDI drum map (36, 38, 42, 46, 39 …);
  - the monitor strip under it, showing the notes on channel 10.
- **Bezel.** TEMPO, STEP, LANE, NOTE.
- **Dock.**
  - LANE (options);
  - STEPS (tray: 16 toggles as two rows of 8, for the chosen lane only);
  - TEMPO (lane);
  - PLAY/STOP;
  - SOUND, ■ STOP.
- **Goals.** Build a pattern with a kick, a backbeat snare and a hat line, and play it.
- **Teaching intent.**
  - A drum pattern is notes; each drum is a note number. Many kits follow the General MIDI map; yours may not.
  - A step is one sixteenth.
  - Suggested starting point: kick on 1, snare on 2 and 4, then build.
- **Help intent.** How LANE and STEPS work together, and what the note numbers mean.

**Page 20 · 5·2 Accents and ghost notes** (rack; task)
- **Display.** The grid with each step's velocity drawn as its height and shade, and a velocity lane under the snare.
- **Bezel.** STEP, VELOCITY, GHOSTS (count), ACCENTS (count).
- **Dock.** LANE (options), VELOCITY (tray: per-step velocity for the chosen lane), A/B (flat / shaped), SOUND, ■ STOP.
- **Goals.** Add at least two snare ghost notes (soft notes between the backbeats) and an accent pattern on the hats. Compare flat and shaped.
- **Teaching intent.**
  - Velocity is half of a beat's feel.
  - Ghost notes are very soft hits that add motion; accents mark the pulse.
  - The sampler's velocity layers from Part 3 make them sound different, not just quieter.
- **Check.** What is a ghost note?
- **Help intent.** Where to set a single step's velocity.

**Page 21 · 5·3 Choke groups and the hi-hat** (rack; task)
- **Display.** The open-hat lane with each hit's ring drawn as a decaying envelope. A closed-hat hit either cuts the ring (choke on) or lets it run under (choke off).
- **Bezel.** CHOKE, OPEN HAT RING (ms), CUT AT (step).
- **Dock.** CHOKE (on/off), OPEN HAT (tray: steps), A/B, SOUND, ■ STOP.
- **Goals.** Hear the open hat ringing under the closed hat, then fix it with a choke group.
- **Teaching intent.**
  - On a real hi-hat, closing the cymbals stops the open ring.
  - A choke group copies that: any member that plays cuts the others.
  - Choke groups are also used for other pairs, such as a short and long version of one sound.
- **Check.** What does a choke group do?
- **Help intent.** Reading the ring envelope and the cut mark.

**Page 22 · 5·4 Three grooves to a brief** (rack; task, the Part 5 practice)
- **Display.** The grid, with the swing and groove offsets drawn on the steps. A brief card on the display reads "STRAIGHT" / "SWUNG" / "LAID-BACK".
- **Bezel.** BRIEF, SWING %, GROOVE, SNARE OFFSET (ms).
- **Dock.**
  - BRIEF (options: three briefs);
  - FEEL (tray: swing lane, groove template, a snare late/early lane);
  - A/B (with the reference for that feel);
  - SOUND, ■ STOP.
- **Learner.** Programs each of the three feels and answers one reasoning card per brief ("what did you change and why").
- **Scoring.** On reasoning; **every reasonable answer is accepted**. The reasonable ranges are on the data side, and the explanation names what each choice does. The goal is all three briefs answered.
- **Teaching intent.** Brings Part 2 into the beat. Feel is a choice; the reference is one example, not the answer.
- **Help intent.** What each brief asks for, and that there is no single right setting.

**Page 23 · 5·5 Patterns into a song** (rack; task)
- **Display.** A row of pattern blocks (INTRO, A, B, FILL, BREAK, A …) on a bar ruler, with the playhead moving across it. The current pattern's grid is shown small above.
- **Bezel.** BAR, PATTERN, BLOCKS, LENGTH (bars, and min:s at the tempo).
- **Dock.**
  - PATTERN (options: edit A / B / FILL);
  - CHAIN (tray: add, remove or move blocks);
  - PLAY SONG;
  - SOUND, ■ STOP.
- **Goals.** Chain at least four blocks including a fill, and play the song.
- **Teaching intent.**
  - Beats are arranged as patterns in a song form.
  - A fill or a break marks a section change.
  - The form is a starting point drawn from common practice, not a template to obey.
- **Check.** Why does a fill usually sit at the end of a section?
- **Help intent.** How to read the block row and the length readout.

### Part 6 — In your DAW (pages 24–25, OPTIONAL paths, keys `msb_ableton`, `msb_logic`)

**Page 24 · 6·1 Where this lives in Ableton Live** (reading page; `reading: true`)
**Page 25 · 6·2 Where this lives in Logic Pro** (reading page; `reading: true`)

- **Content.** A plain list mapping each idea of Parts 1–5 to the program's own names. On each page, every idea from Parts 1–5 is mapped to the place it lives in that program, in that program's terms. Areas covered:
  - MIDI monitor and editing;
  - quantise strength and swing;
  - groove templates;
  - the sampler instruments;
  - drum instruments and choke;
  - repitch and stretch modes;
  - pitch and formant tools;
  - MIDI clock and timecode settings;
  - network tempo sync.
- **Verification.** Every name is verified against the current official manual at build time, and the version and date are recorded in SOURCES.md. Anything not confirmed is left out, never guessed.
- **No copied interface.** Words, plus at most a generic drawing in the house style. No screenshots, no look-alike layouts.
- **Teaching intent.** Orientation: "the idea you learned is called X here, and you will find it in Y."
- **Help intent.** That the names match the version stated on the page, and that menus move between versions.
- **Optional paths.** They are listed under OPTIONAL PATHS on the end screen. The whole-lab key does not need them. The Ableton and Logic certificates each need their own page (section 6).

---

## 4. Audio and sound engine

### 4.1 What sounds play

| Sound | Pages | Source |
|---|---|---|
| Keys receiver (multi-sampled keys, about 6 roots × 2 velocities) | 1–5, 7–11 | **licensed library** (H26) |
| Bass receiver | 3, 4 | made in the app (a simple subtractive voice, like the Modular Lab's), labelled as a synth. A synth is a genuine MIDI receiver. |
| Drum kit: kick, snare (3 velocity layers × 4 round-robin takes), closed, open and pedal hat, clap, rim, perc | 3, 13–14, 19–23 | **licensed library** |
| Sustained pad (3 roots, loopable) | 12, 15 | **licensed library** |
| Drum loop, 90 BPM, 2 bars, with its hit times written into a data file once at build | 16–17 | **licensed library** |
| Voice phrase | 18 | **made in the app** by the Speech & Voice Lab's source–filter model (`features/speech/speechSignals`: glottal source and formant resonators). This makes the formant demonstration exact. |
| Click / metronome | 8, 10 | made in the app |

- **Format and size.** All recordings are 48 kHz, 16-bit, mono except the loop (stereo). They are trimmed, normalised to −1 dBFS sample peak per one-shot at its loudest layer, and bundled as WAV assets.
- **Budget.** At most 8 MB in total, about 6–7 MB as estimated. These are the **first recorded audio files in the app**; every sound in the app so far is made in code.
- **Decoding and loading.** WAV is decoded with `features/audio/wavDecode` and handed to the engine as 16-bit PCM (the existing transport format, so no conversion). It is loaded per part as the page opens (`preload`, as in the Game Audio Lab) and kept in a bounded cache (`clipLru`).

### 4.2 Level and safe listening (unchanged house protections)

- **Start.** Sound starts only through `startFenced`, behind `useAudioOutputGate` and the Sound Safety acknowledgement.
- **Ceiling.**
  - The engine applies the same **−12 dBFS sample-peak ceiling** as the Game Audio engine (`PLAYBACK_CEILING_DB`): a protective limiter and then a hard stop.
  - The lab's master starts at −14 dB below that.
  - A full beat at the loudest velocity peaks under the ceiling before any limiting (a test checks this on the rendered mix).
- **Exposure.** The measured mix level (the louder of the mix and either ear) is reported to the exposure register (`setFilePlayerLevel`), never assumed. The route `MidiBeatLab` is added to `ExposureCheckin`'s list of lab routes.
- **Stopping.** The engine is registered as a file player, so shake-to-mute, the idle lock, sign-in re-mute and leaving the app all stop it. The lab also stops on leaving the screen (`useStopOnClose`), and the SOUND key really switches sound off (the Game Audio session's semantics).
- **Velocity → level.** The lab's own stated curve (section 5 row S3). It sits under the master and the ceiling and can never raise anything past them.

### 4.3 The engine: what exists today and what this lab adds

| Existing piece | Can | Cannot / limit | Use here |
|---|---|---|---|
| **Game Audio web-view engine** (`gameaudio/engine/*`): Web Audio in the web build, a hidden `react-native-webview` on phones. **Proven on the Pixel and iPhone in OTA 1 (2026-11-14).** | real-time voices, sample-accurate start times on the audio clock, loop, playback rate, gain/filter ramps, buses, measured output level, ceiling, honest started/failed answers | its protocol has no loop start/end, no engine-side note sequencer, no scheduled stop (choke), no per-voice envelope | **Fork** its host and session into this lab (`midibeat/engine/`), leaving the live Game Audio engine untouched (no risk to a published lab). Extend the forked protocol (below). Merging the two later is a separate task. |
| Offline render → WAV → expo-audio (`earDsp` 48 kHz; Mixing, Drum Tuning, DJ) | exact offline rendering of any process in TypeScript | about 0.9 s from a control change to sound; not for playing keys or a running sequencer | Pre-render the STRETCH, SLICE and formant clips (pages 16–18), which are then played by the engine as buffers. |
| `dj/engine/djStretch.ts` (WSOLA, pure TS, tested) | a real time-stretch with honest artefacts | — | Reuse for page 16–17 GRAIN renders: import, or move to a shared folder in a pure move with the DJ tests green. Grain size is a parameter added without changing DJ outputs (test). |
| `dj/engine/djDrumMachine.ts`, `dj/model/djEvent` | MIDI-clock follower logic (24 ticks/beat, drift on internal clock) | — | Reference for page 6's leader/follower model (shared helper or same rule, test-pinned). |
| `features/speech/speechSignals` | source–filter voice synthesis | — | Page 18's voice. |
| `modules/ape-dsp` (native) | mic capture, meters, FFT, pitch, a capped tone generator | **no sample playback, no sequencing, no MIDI in/out** | Not used. |
| Calculator Lab functions (`calc/workspaces/roomsMusic.ts`) | beat ms from BPM, transposition ratio, note ↔ frequency, file size | these live inside workspace `compute` closures | Factor the four formulas into exported helpers that the workspaces and the lab both call. Calculator outputs stay byte-identical (test). **No new calculator tiles**, so "166 calculators" is unchanged (see H25 note in section 5). |

**Additions to the forked protocol:**
- **Voice start.** `loopStart`/`loopEnd` on a voice; Web Audio supports this natively.
- **Envelope.** A per-voice A/D/S/R as gain automation, and a scheduled `stop` at an audio-clock time, which gives choke.
- **Sequencer.** An **engine-side sequencer**: the lab sends the pattern, tempo, swing/groove offsets and per-step velocity and sample choice as one small message. The engine schedules notes ahead on its own audio clock (lookahead about 100 ms, refilled every 25 ms: the standard Web Audio scheduling pattern), so beat timing never depends on the bridge.
- **Playhead.** Position reports to the display at ≤ 30 Hz; the display interpolates on the UI thread.
- **No guessing in the engine.** Which sample, layer or round-robin take plays, and the choke cuts, are decided in the **pure model** (tested in Node). The engine only plays what it is told and reports what it really started.

**Pre-rendered material** (built in JS on the phone when a page opens, then cached):
- loop crossfades (page 15: the crossfade is written into the buffer);
- stretch at each TO/AMOUNT/GRAIN setting (pages 16–17);
- voice shifts (page 18).
Render cost on a mid-range phone is **not measured**. It is measured on the Pixel at build, and a long render shows "Preparing…" in words.

**Touch-to-sound delay** through the web view on phones: **UNKNOWN**, to be measured on the Pixel at build. Recorded timing (TAP IN) uses the touch time, so a delay in the sound does not change what is recorded; the help says so.

### 4.4 Native build: NOT needed

- `react-native-webview`, `expo-asset`, `expo-file-system`, `expo-audio`, Skia and Gesture Handler are all already in builds 39/23.
- Adding WAV assets does not change the native fingerprint.
- Everything ships by OTA, **on the owner's word only**, on branch `ota-after-approval-39-23`, and is then ported to `forum-next-build`.
- **One thing that WOULD need a native build, and is deliberately left out:** playing the lab from a real USB or Bluetooth MIDI keyboard. Phone web views do not offer Web MIDI on iOS; Android is UNKNOWN. A native MIDI module would be a store build for both platforms (platform parity). It is not part of this lab, and the lab does not promise it.

---

## 5. Accuracy: every claim and its source

Internal only (charter §12: no sources in learner text). These rows go into `docs/labs/midibeat/SOURCES.md`, each with a `src` key used by `model.ts`. Status: **OK** = settled from the source; **VERIFY** = check the exact wording or number against the source at build and log it; **UNKNOWN** = never shown as a number or a fact.

**Sources (free; no paid standard is needed, so H24 does not apply):**
- **[MMA]** MIDI 1.0 Detailed Specification 4.2.1 (MIDI Manufacturers Association / The MIDI Association; free download with a free midi.org account). This includes the MIDI Time Code and Song Position Pointer sections.
- **[MA-SUM]** MIDI Association, "Summary of MIDI 1.0 Messages", https://midi.org/summary-of-midi-1-0-messages
- **[MA-CC]** MIDI Association, "Control Change Messages (Data Bytes)" table, midi.org.
- **[GM1]** General MIDI System Level 1 specification, with its percussion key map (midi.org).
- **[MA-2]** MIDI Association, MIDI 2.0 overview pages (midi.org).
- **[CMU]** D. Glatt, "David's MIDI spec", https://www.cs.cmu.edu/~music/cmp/archives/cmsip/readings/davids-midi-spec.htm (secondary).
- **[SPK]** SparkFun MIDI tutorial, advanced messages (pitch bend) (secondary).
- **[ABL]** Ableton Live Reference Manual (current version at build), including "Synchronizing with Link, Tempo Follower and MIDI": https://www.ableton.com/en/live-manual/12/synchronizing-with-link-tempo-follower-and-midi
- **[LGC]** Logic Pro User Guide (Apple, current version at build).
- **[RUSS]** M. Russ, *Sound Synthesis and Sampling*, 3rd ed., Focal Press.
- **[GUERIN]** R. Guérin, *MIDI Power!*.
- **[WSOLA]** W. Verhelst & M. Roelands, "An overlap-add technique based on waveform similarity (WSOLA) for high quality time-scale modification of speech", ICASSP 1993.
- **[PV]** J. Laroche & M. Dolson, "Improved phase vocoder time-scale modification of audio", IEEE Trans. Speech and Audio Processing, 1999.
- **[DAFX]** U. Zölzer (ed.), *DAFX: Digital Audio Effects*, 2nd ed., Wiley 2011.
- **[PSOLA]** E. Moulines & F. Charpentier, "Pitch-synchronous waveform processing techniques for text-to-speech synthesis using diphones", Speech Communication, 1990.
- **[FANT]** G. Fant, *Acoustic Theory of Speech Production*, 1960.
- **[LINN]** Roger Linn on swing and MPC timing (interview, Attack Magazine, 2013).
- **[FS02]** A. Friberg & A. Sundström, "Swing ratios and ensemble timing in jazz performance", Music Perception 19(3), 2002.
- **[FKP13]** J. Frühauf, R. Kopiez & F. Platz, "Music on the timing grid: the influence of microtiming on the perceived groove quality of a simple drum pattern performance", Musicae Scientiae 17(2), 2013.
- **[DAV13]** M. Davies, G. Madison, P. Silva & F. Gouyon, "The effect of microtiming deviations on the perception of groove in short rhythms", Music Perception 30(5), 2013.
- **[WAA]** W3C Web Audio API (AudioBufferSourceNode loop / loopStart / loopEnd, scheduling); the lookahead scheduling pattern from C. Wilson, "A Tale of Two Clocks" (2013).
- **[CALC]** The app's Calculator Lab, `calc/workspaces/roomsMusic.ts`: the source of truth for shared formulas.

| # | Claim used in the lab | Source | Status |
|---|---|---|---|
| M1 | MIDI carries messages (instructions), not audio; the receiver produces the sound | MMA, MA-SUM | OK |
| M2 | 16 channels, sent 0–15 in the status byte's low nibble, shown 1–16 | MMA, MA-SUM | OK |
| M3 | Note numbers 0–127; 60 = middle C. **The octave name of 60 differs by maker (C4 or C3).** The lab uses C4 (A4 = 69), to agree with the Calculator Lab, and says the other convention exists | MMA (60 = middle C); CALC (octave = floor(m/12) − 1); naming difference: VERIFY two makers' manuals (ABL, LGC) | OK / VERIFY |
| M4 | Velocity 0–127; note on with velocity 0 = note off; release velocity exists in note off | MMA | OK |
| M5 | Status bytes: 8n off, 9n on, An poly pressure, Bn CC, Cn program, Dn channel pressure, En pitch bend; data bytes 0–127 | MMA, MA-SUM | OK |
| M6 | Running status: a repeated status byte may be omitted | MMA | OK |
| M7 | Controllers 0–119; 120–127 channel mode (120 All Sound Off, 121 Reset All Controllers, 122 Local Control, 123 All Notes Off, 124–127 omni/mono/poly) | MMA, MA-CC | OK |
| M8 | CC 1 mod wheel, 7 volume, 10 pan, 11 expression, 64 sustain (≤ 63 off, ≥ 64 on), 0/32 bank select MSB/LSB | MA-CC | OK |
| M9 | Pitch bend 14-bit, LSB first, 0–16,383, centre 8,192; the range is set at the receiver; GM default ±2 semitones (RPN 0) | MMA, GM1, SPK | OK (GM default: VERIFY wording in GM1) |
| M10 | Bend in semitones = (value − 8,192) ÷ 8,192 × range; the top value 16,383 gives range × 8,191/8,192 | arithmetic from M9 | OK (new helper, test-pinned) |
| M11 | Program change: 128 programs; displays use 0–127 or 1–128 | MMA; display difference VERIFY in two manuals | OK / VERIFY |
| M12 | GM percussion on channel 10; key map 35/36 bass drum, 37 side stick, 38 acoustic snare, 39 hand clap, 40 electric snare, 42 closed hi-hat, 44 pedal hi-hat, 46 open hi-hat, 49 crash 1, 51 ride 1 | GM1 | OK (VERIFY each number used against the GM1 table) |
| M13 | 5-pin MIDI runs at 31,250 bit/s, 10 bits per byte (start, 8 data, stop) = 320 µs per byte; a 3-byte message ≈ 0.96 ms. Used only as a PRO NOTE on chord "smear" on a 5-pin cable; no claim about USB timing | MMA (hardware section) | OK (claim limited to 5-pin) |
| M14 | MIDI clock F8 at 24 per quarter note; Start FA, Continue FB, Stop FC; Song Position Pointer F2 in "MIDI beats" of 6 clocks (one sixteenth) | MMA | OK |
| M15 | Tick interval = 60,000 ÷ (BPM × 24) ms; 120 BPM → 20.83 ms | arithmetic from M14 | OK (new helper) |
| M16 | MTC: quarter-frame messages (F1), 4 per frame, a full position every 2 frames; rates 24, 25, 29.97 drop-frame, 30 | MMA (MTC section) | OK (VERIFY wording) |
| M17 | A follower on internal clock a few tenths of a BPM off drifts audibly within a few bars (0.3 BPM at 120 → 40 ms after 8 bars) | arithmetic; the DJ Systems Lab already teaches it | OK |
| M18 | MIDI 2.0 exists (adopted 2020): higher resolution and two-way exchange (MIDI-CI). The lab names no bit depths unless VERIFY passes | MA-2 | VERIFY (keep to these words) |
| M19 | Bytes of a MIDI phrase vs audio bytes = SR × bits ÷ 8 × channels × seconds | CALC (file size) | OK |
| T1 | Sequencer resolution in ticks per beat varies by program; the lab states its own (960) | — | lab model statement, not a claim about programs; the values in any named program are UNKNOWN and not shown |
| T2 | Beat (ms) = 60,000 ÷ BPM; a sixteenth = beat ÷ 4 | CALC | OK |
| T3 | Quantise strength s moves a note s × (grid − position); 50 % halves the offset | RUSS, GUERIN; ABL/LGC describe a strength/amount control | OK (definition); VERIFY per program on pages 24–25 |
| T4 | Swing (the lab's scale): the first note of a pair takes s of the pair; 50 % straight, 66.7 % triplet. Second-note delay = (2s − 1) × sixteenth. At 120 BPM: 54 % → 10 ms, 66 % → 40 ms | LINN; arithmetic | OK. **How each program scales its swing control: UNKNOWN**, said in words only, never as numbers |
| T5 | Swing ratios in performance change with tempo (larger at slow tempos, toward even at fast tempos) | FS02 | OK (stated as a tendency, as starting points) |
| T6 | Microtiming does not reliably raise groove ratings; quantised versions were rated as grooving as much or more in controlled studies. **So the lab never says "groove is in the offsets"** | FKP13, DAV13 | OK. This reshapes Comp B's outcome wording. |
| T7 | "Laid-back" / "pushed" = consistently late or early placement; **amounts in ms are suggested starting points only**, with no single figure claimed | — | UNKNOWN as a norm; presented as starting points |
| T8 | Humanise = bounded random offsets in timing and velocity | RUSS | OK (definition) |
| S1 | Sampler terms: root key, key zone, velocity zone/layer, round robin, loop start/end, crossfade loop, one-shot/gate, amp envelope (generic; no brand interface imitated) | RUSS | OK |
| S2 | Playback ratio = 2^(n/12); length × 1/ratio | CALC (transposition) | OK |
| S3 | Velocity → level: **the lab's own curve**, stated on page 13 (proposed: level dB = 40·log10(v/127)). Whether any standard recommends this curve is UNKNOWN, so it is presented as this lab's choice | — | UNKNOWN as a standard; lab choice |
| S4 | A harder strike gives a brighter spectrum and a sharper attack, not just more level | RUSS; checked on the licensed samples' own spectra (the page shows the real spectra) | OK (and measured on the assets) |
| S5 | A discontinuity at a loop join is heard as a click; a zero crossing or crossfade reduces it | RUSS, DAFX | OK |
| S6 | Hi-hat: closing the cymbals damps the open ring; a choke group models that | RUSS; physical description | OK |
| P1 | Repitch: 12·log2(new/old) semitones; 90 → 100 BPM ≈ +1.82 st | CALC (interval), arithmetic | OK |
| P2 | Time-stretch (WSOLA/OLA, phase vocoder) keeps pitch; artefacts: transient smearing or doubling, phasiness; they grow with the amount; better methods hide them, none removes them | WSOLA, PV, DAFX; djStretch (in the repo, already reviewed) | OK |
| P3 | Grain length trade-off: short grains keep transients better and roughen tones; long grains the reverse | DAFX | VERIFY wording |
| P4 | Slicing at transients keeps hits intact and leaves gaps or overlaps | DAFX | OK |
| P5 | Source–filter: pitch from the source, formants from the tract; resampling moves both; formant-keeping shift (PSOLA or envelope methods) moves the pitch only | FANT, PSOLA, DAFX | OK. The lab's demonstration is the IDEAL case from the model (simplification register). |
| D1–Dn | Pages 24–25: each Ableton Live / Logic Pro name (the instruments, drum instrument and choke, groove pool or templates, quantise controls, warp or flex modes, pitch and formant tools, sync settings) | ABL, LGC, current version | **VERIFY every row at build; anything not found is left out.** Version and date recorded. |

**Simplifications register** (charter §3), each said once in plain words where it matters:
- the voice is a model;
- the stretch is a simple method;
- the played take may be lab-written;
- the monitor shows the 5-pin byte stream, even though USB carries messages in packets;
- tapping has no strike force;
- packets on the cable are an overlay.

**H25 note.** H25 lists P02–P07, P13 and others, **not P14**.
- P14 reuses four existing calculator formulas by calling the calculator's own (factored) functions, as the charter requires.
- Its four new formulas (clock tick, swing delay, bend → semitones, MIDI byte time) live in one pure, tested file `src/screens/lab/calc/midiTime.ts`, next to the calculators, so a future calculator can call them.
- No calculator tile is added, so the settled "166 calculators" stays true. Adding them as calculators would change that count everywhere, which is the owner's call alone and is not proposed.

---

## 6. Credit

### 6.1 Keys

New server keys:
- **Whole lab:** `tr_midi_sampler_beat` (TRAINING_LABS row: route `MidiBeatLab`, completion `'all-modules'`). Reported through PagedLab `labDoneKey` once **pages 1–23** are all done. Pages 24–25 are optional.
- **Parts:** `msb_midi` (pages 1–7), `msb_editing` (8–11), `msb_sampler` (12–15), `msb_timepitch` (16–18), `msb_beats` (19–23). Each is reported once every page of its part is done, from `onPageDone` and again on mount (any later visit), as `labDoneKey` does. All go through `reportTrainingComplete`, so the queue's rules hold: guests held, preview earns nothing, `lab_not_found` kept and retried.
- **Program pages:** `msb_ableton` (page 24), `msb_logic` (page 25), each reported when that page is done.
- **New prefix.** `msb_` is new. Add it to the key-shape list in `trainingLabKeys.ts` and to anything that validates key shapes. Keys are **immutable once live**.
- **End screen.** Pass the part key of each page through PagedLab's existing `pageCreditKeys` (one key per page; pages of one part repeat its key), so a page reads CREDITED after START OVER (PRACTICE). The builder confirms that a repeated key is safe in PagedLab. If it is not, add an additive prop and leave the other labs unchanged.
- **Backfill.** None. The lab was never on a phone before these keys, as with `tr_game_audio`.
- **Server.** The server rows (8 `labs` rows plus the requirement rows) are **Comp A's, after the OTA that carries the lab is proven on phones**. Until then `lab_not_found` keeps the credit unsent and retries it.

### 6.2 Completion rule
- A task page is done when its goals are met **and** its check is answered (a check is never a pass/fail wall: every option has an explanation, and a wrong answer can be changed).
- A reading page is done when read through.
- The lab is done when pages 1–23 are done.
- Credit is never removed. START OVER (PRACTICE) clears only this device's page marks.

### 6.3 Understanding-check ideas

Each check uses the `UnderstandingQuestion` format: one correct option matched by value, an explanation, and a "why" for each wrong option. No brand names (pages 1–23). Checks test reasoning; graded practice accepts every reasonable answer.

| Page | Prompt | Correct | Distractors (each gets a "why") |
|---|---|---|---|
| 2 | A keyboard sends `90 3C 00`. What happens? | Note 60 on channel 1 stops: a note on with velocity 0 counts as a note off | starts at the quietest level · channel 9 plays note 3 · it is an error and is ignored |
| 3 | The same part is sent to a piano sound, then a drum kit. What changed? | Only the receiver: the messages are identical, and the receiver decides the sound | the notes were re-recorded · MIDI carried the piano's sound · the velocity changed |
| 4 | Bass part on channel 2, synth listening on channel 3. Why silence? | Nothing listens on channel 2 | the volume is at 0 · the notes are out of range · the program change is missing |
| 5 | One bend message goes to two synths set to ±2 and ±12. What do you hear? | The ±12 synth bends six times further: the range is set at the receiver | identical bends · the ±2 synth bends further · the message carries the range |
| 6 | You score to picture. Which keeps the music at the right place in the film? | Timecode: it carries a time position | MIDI clock alone · a higher tempo · program change |
| 9 | A note is 20 ms late. Quantise at 50 %. Where does it land? | 10 ms late | on the grid · 20 ms early · 40 ms late |
| 9 | Is 100 % quantise the correct setting? | It is one choice: it removes the played timing | yes, always · only for drums · never use it |
| 10 | Swing 66 % on sixteenths at 120 BPM delays each second sixteenth by about… | 40 ms | 10 ms · 66 ms · 125 ms |
| 11 | Is a part with more random timing always groovier? | No: feel comes from timing, velocity and notes together, and more offset can sound worse | yes · only above 50 ms · only on drums |
| 12 | One sample, root C3, played at C4. What happens? | An octave higher and half as long | higher, same length · same pitch, shorter · it does not play outside its zone |
| 13 | Why use a soft recording instead of turning a hard one down? | A soft hit is darker and has a softer attack, not just quieter | it saves memory · it is louder · velocity cannot turn a sample down |
| 14 | A snare roll sounds like a machine gun. What fixes it? | Several takes used in turn (round robin), with velocity layers | more reverb · a higher sample rate · quantise at 100 % |
| 15 | Why does a loop click? | The wave jumps at the join; a zero crossing or a crossfade smooths it | the sample is too quiet · the loop is too long · the envelope attack is too slow |
| 16 | A 90 BPM loop sped up (repitched) to 100 BPM: what happens to its pitch? | About 1.8 semitones higher | unchanged · 10 semitones higher · lower |
| 17 | Which is true about time-stretching? | It keeps pitch, and hits can smear or double, more as the change grows | it is artefact-free · it changes pitch · it only works on vocals |
| 18 | Why does a sped-up voice sound smaller? | Its formants move up with its pitch | it gets louder · its harmonics disappear · its timing changes |
| 20 | What is a ghost note? | A very soft hit between the main hits | a muted channel · a deleted note · an accent |
| 21 | What does a choke group do? | A member that plays cuts the others that are still sounding, like closing a hi-hat | mutes the whole kit · makes hits louder · links tempo |
| 23 | Why does a fill usually sit at the end of a section? | It signals the change to the next section | it is required by the grid · fills only fit bar 1 · it sets the tempo |

### 6.4 Which credentials require it (Comp B's `required_by`, checked against `labRequirements.ts` and the slug fixture in `test/labCertRequirements_20261013.test.ts`)

All ten slugs exist in the fixture. Four are absent from the map today: Beat-Making, Ableton, Logic and Film Music Technology currently require the fundamentals only. Each `why` is written for its credential at build.

| Credential | Slug | Requires | Today's map row |
|---|---|---|---|
| Beat-Making & Sampling | cert-beat-making-and-sampling-v3 | `tr_midi_sampler_beat` | new row |
| Ableton Live Specialist | cert-ableton-live-specialist-v3 | `tr_midi_sampler_beat` + `msb_ableton` | new row |
| Logic Pro Producer | cert-logic-pro-producer-v3 | `tr_midi_sampler_beat` + `msb_logic` | new row |
| DAW Power User | cert-daw-power-user-v3 | `msb_midi`, `msb_editing` | adds to mxb_prep, mxa_session |
| Electronic Live Performance | cert-electronic-live-performance-v3 | `msb_sampler`, `msb_beats` | adds to tr_dj (Wave 0) |
| Sound Design with Synthesis | cert-sound-design-with-synthesis-v3 | `msb_sampler`, `msb_timepitch` | adds to tr_oscillator, tr_modular, tr_fm |
| Film Music Technology | cert-film-music-technology-v3 | `msb_midi`, `msb_editing`, `msb_sampler`, `msb_timepitch` | new row |
| Music Production (program) | prog-music-production-v3 | `tr_midi_sampler_beat` | adds |
| Electronic Music Production and Synthesis (program) | prog-electronic-music-production-and-synthesis-v3 | `tr_midi_sampler_beat` | adds |
| Film Scoring and Music Production (program) | prog-film-scoring-and-music-production-v3 | `msb_midi` … `msb_timepitch` | adds |

- **Relevant but not required** (Comp B): Plugin & Processing Power User, Game and Interactive Audio, AI Audio Production, DJ and Club Audio. These get no rows.
- **Mechanics.**
  - Edit `src/data/labRequirements.ts`.
  - Regenerate the seed with `node scripts/gen-lab-cert-seed.mjs`.
  - Run the ratchet `test/labCertRequirements_20261013.test.ts`.
  - Comp A gets the server rows as a SQL brief ZIP, applied after the OTA is proven.
  - H20: learners who started a credential before the change date are exempt.
  - Rows are added **at listing, on the owner's confirmation**, as with the Game Audio Lab.

---

## 7. Files, tests and size

### 7.1 New files

`src/screens/lab/midibeat/`:
- `MidiBeatLabScreen.tsx`: the PagedLab wiring, the part-key reporting and the header comment (the credit rule in words).
- `MbLab.tsx`: `MbLabProvider` (one sound session and one store), the `MbRack` wrapper, and the SOUND/STOP keys.
- `engine/`: `mbEngineProtocol.ts`, `mbEngineSource.ts` (the Web Audio voice server and sequencer), `mbEngine.ts`, `MbEngineHost.tsx`, `useMbSound.ts`, `mbSoundState.ts`. All are forked from `gameaudio/engine`.
- `model/` (pure TS, no React Native):
  - `midiMessages.ts` (encode, decode, describe in words, running status);
  - `midiReceiver.ts` (channels, parts, program/bank, CC state, bend range, panic);
  - `syncModel.ts` (clock ticks, SPP, MTC quarter frames, drift);
  - `sequence.ts` (ticks, tempo, grid);
  - `timing.ts` (quantise, swing, humanise with a seed, groove templates);
  - `samplerMap.ts` (zones, layers, round robin, ratio, length);
  - `loopTools.ts` (zero crossing, crossfade bake, seam jump);
  - `timePitch.ts` (repitch math, stretch and slice plans calling djStretch);
  - `formantVoice.ts` (wrapping speechSignals);
  - `drumPattern.ts` (steps, velocity, ghosts and accents, choke, song chain);
  - `mbParts.ts` (page → part, part keys, done rules);
  - `mbStore.ts`.
- `scene/` (Skia; `model` / `geometry` / `scene` kept apart, charter §2): `MonitorStrip`, `PianoRoll`, `ClockTrain`, `SamplerMap`, `WaveLanes` (real time base), `SeamView`, `GrainOverlay`, `FormantSpectrum`, `StepGrid`, `SongForm`, `ReceiverScene` (page 1 and 3 illustrations). Every teaching Canvas is `accessible` with a live text summary.
- `pages/`:
  - `p01…p25.tsx` and `index.ts` (the one place the order lives);
  - `guides/p01…p25.ts` and `end.ts`;
  - `data/` (captured streams, the played take, briefs, groove templates, the DAW page text, the end-screen lines).
- `sounds/`: `mbSoundBank.ts` (asset list, decode, cache) and `mbSynth.ts` (bass voice, click).

Other new files:
- `src/screens/lab/calc/midiTime.ts`: four new pure helpers; no tiles.
- `assets/audio/midibeat/*.wav`: the licensed set, ≤ 8 MB.
- `docs/labs/midibeat/SOURCES.md`, `MODEL.md`, `CORRECTIONS_LOG.md`, `LICENCE_RECORD.md` (what was licensed, from whom, the terms that allow app use; never any secret), and `reviews/`.

### 7.2 Changed files
- `src/screens/lab/labCatalog.ts`: a leaf under **Synthesis & Sound Design** (`member: true`, blurb and tileBlurb). It fills the place of the "Sample Lab" placeholder removed on 2026-09-17.
- `src/navigation/RootNavigator.tsx` (`MemberGated.MidiBeatLab` and a `Stack.Screen`) and `src/navigation/types.ts`.
- `src/dev/webPreviews.tsx`: `#labpreview/MidiBeatLab`.
- `src/features/lab/trainingLabKeys.ts`: the TRAINING_LABS row, the `msb_` key shape, and the part and DAW key helpers.
- `src/features/lab/trainingCompletion.ts`: header table only (no backfill).
- `src/data/labKeyCatalog.ts`: names for the 8 keys ("MIDI, Sampler & Beat Lab · Part 1: What MIDI sends", and so on).
- `src/data/labRequirements.ts` and the regenerated seed: **at listing, on the owner's confirmation**.
- `src/screens/lab/calc/workspaces/roomsMusic.ts`: factor the four reused formulas into exported helpers, with byte-identical outputs.
- `src/features/audio/ExposureCheckin.tsx`: the route list.
- `src/features/intro/labTermIntroData.ts`: a `hold` entry, candidates "MIDI", "Sampler", "Quantization", until someone reads the live glossary rows.
- `src/screens/lab/labTileArt.ts`: once the owner supplies the tile.
- **No change to the Game Audio engine. No change to PagedLab beyond additive props, if any are needed.**

### 7.3 Tests

**New tests:**
- `test/midiBeatMessages.test.ts`:
  - encode/decode round-trips for every message type;
  - velocity-0 note-on read as a note off;
  - running status;
  - channel 0–15 sent and 1–16 shown;
  - 120–127 treated as mode messages;
  - bend LSB/MSB, centre 8,192, and semitones at ±2 and ±12;
  - bank-then-program order;
  - 60 named C4, agreeing with the calculator's `noteName`.
- `test/midiBeatSync.test.ts`:
  - tick = 60,000/(BPM·24);
  - SPP in sixteenths;
  - MTC quarter-frame encode and decode;
  - drift arithmetic.
- `test/midiBeatTiming.test.ts`:
  - quantise at 50 % halves every offset and at 100 % lands on the grid;
  - swing 54 % → 10 ms and 66 % → 40 ms at 120 BPM, and 66.7 % equals the triplet;
  - humanise is bounded and repeatable with its seed;
  - groove templates stay within their declared ranges.
- `test/midiBeatSampler.test.ts`:
  - every key × velocity resolves to exactly one zone (or a declared crossfade pair);
  - round robin never repeats a take immediately in random-no-repeat mode;
  - ratio = 2^(n/12) and length = 1/ratio;
  - the crossfade bake leaves the seam jump under the stated threshold;
  - zero-crossing snap lands on a sign change.
- `test/midiBeatTimePitch.test.ts`:
  - repitch 90 → 100 = 1.824 st;
  - stretch keeps a test tone's pitch (estimated) while the length changes;
  - slice keeps each hit's samples intact;
  - the formant envelope is fixed under KEEP and scaled under MOVE.
- `test/midiBeatPattern.test.ts`:
  - choke cuts the open-hat voice at the closed-hat onset, and only within its group;
  - GM note numbers match the GM1 table rows used;
  - song-chain length and time.
- `test/midiBeatEngineProtocol.test.ts`: command shapes, loop points clamped inside the buffer, and the honesty rule (started/failed, never "playing" from a request).
- `test/midiBeatLevels.test.ts`: the loudest full beat, rendered offline, peaks under the ceiling before limiting; and the velocity curve.
- `test/midiBeatLab.test.ts`:
  - 25 pages, the order frozen against a list;
  - every page has a guide and declares `reading` or `manualDone`;
  - every rack page has at least one real dock key that changes the display;
  - no bezel cell has `onPress`;
  - dock keys ≤ 6 per page;
  - the part map covers pages 1–23 exactly once, and pages 24–25 are optional;
  - the part and DAW keys are reported by their rules;
  - display text ≥ 9 pt at 390 (fitValue);
  - pages 1–23 carry no product names;
  - intros use no skill verbs ("master", "build", "mix");
  - no "N of total" progress text.
- `test/midiTimeCalc.test.ts`: the four new helpers, and the reused calculator outputs byte-identical.

**Updated tests:**
- `test/trainingLabKeys_20261013`;
- `test/labCertRequirements_20261013` (with the seed);
- the lab catalog and tile tests;
- `test/patternP10b_20261002` (the learner-started playhead and tick animations are listed as LESSON loops, with reasons);
- `test/labFixes_20261114_S2` (no undeclared pages);
- the ExposureCheckin route list.

**Gate:**
- `npx tsc --noEmit` is clean;
- the full suite, `node --test --test-timeout=120000 "test/**/*.test.ts"`, passes through `node scripts/suite-gate.mjs` (fail 0, whole suite ran).

**Before handover (charter §9):**
- rendered inspection in `#labpreview/MidiBeatLab` at 390×844, landscape and iPad;
- an audio-expert review, a learning review and a skeptical visual review, with fixes;
- a phone check on the Pixel inside the real app (side-by-side dev build) for:
  - engine start and stop;
  - touch-to-sound delay, measured;
  - render times for pages 15–18;
  - level;
  - leaving the app.
- iPhone through the owner. Anything not measured is reported as NOT MEASURED.

### 7.4 Honest size estimate
- **Code.** About 18,000–24,000 lines, including about 2,500 lines of tests. That is comparable to the Game Audio Lab (about 26,000 lines over 24 pages with its engine).
- **Breakdown.** Engine about 1,800 (forked and extended); pure models about 2,500; Skia scenes about 4,000; 25 pages with guides and data about 9,000–12,000.
- **Assets.** 6–8 MB of WAV.
- **Effort.** One build pass on Opus HIGH (likely more than one session), one review round with three reviewers, one fix round, and one bug test. In calendar terms this is about what the Game Audio Lab took (built 2026-11-12, reviewed and fixed through 2026-11-14), plus the time to choose and license the samples.

---

## 8. Open items that truly block

Only real blockers; scope is never a reason to hold.

1. **The sample library: licence and cost (H26, owner OK required before any money is spent).**
   - **What it blocks.** The final sound of pages 1–5 and 7–11 (keys), 3, 13–14 and 19–23 (kit), 12 and 15 (pad), and 16–17 (loop). So it blocks **listing and publishing** the lab, not building it.
   - **Meanwhile.** The build can proceed with stand-in sounds made in code, as the Game Audio Lab did. Those stand-ins are never listed or published; the no-placeholder rule holds because nothing reaches the menu until the real set is in.
   - **The licence must allow, in writing:**
     - use inside a commercial app;
     - playback of single isolated samples to users;
     - bundling in the app package.
   - Many "royalty-free" sample licences forbid exactly this, so the licence text is read before purchase and recorded in `LICENCE_RECORD.md`.
   - A zero-cost option that meets the licence test exists in principle (sounds released with no rights reserved, CC0), at variable quality. Choosing between that and a paid library is the owner's call.
2. **Nothing else blocks.**
   - **Not blockers; they are asks with defaults:**
     - the tile image;
     - the owner-played reference take (default: a lab-written take, labelled);
     - confirming the requirement rows at listing (default: Comp B's ten, as in 6.4);
     - the build GO.
   - **No paid standard is needed.** The MIDI and GM specifications are free.
   - **No native build is needed.**
   - **Measured at build, not blockers:**
     - the Game Audio engine's web-view method is proven on both phones, but this lab's touch-to-sound delay and render times are not yet measured;
     - the DAW page names must be verified against the current manuals.

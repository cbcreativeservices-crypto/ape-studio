# G5 · Game Audio Lab (GameAudioLab) · beginner orientation audit

Auditor G5, 2026-11-14. Web preview `http://localhost:8142/#labpreview/GameAudioLab`, tab sized 390 x 844, member, intro cards unseen. SOUND OFF throughout: the Sound Safety warning was closed with KEEP SOUND OFF every time. Everything that depends on hearing is judged from the words, the picture, the strip and the activity log only.

Frame common to all 22 pages (written once here, referred to below as "the frame"): header (title, lab name, ⓘ), a module bar (⏮ · ‹ PREV · MODULE n / 22 ▾ · NEXT ›), the scene picture (top-down courtyard + workshop), a level strip (one bar per background sound), a 5-cell readout row (LEVEL · SCENE · PLAYING · VOICES · SOUND), HIDE DISPLAY / FULL SCREEN, then a five-step lesson (1 UNDERSTAND · 2 EXPLORE · 3 LISTEN & OBSERVE · 4 PRACTICE · 5 CHECK YOURSELF), a "WORDS ON THIS SCREEN · TAP ONE" chip row, an activity log, and the dock (LEVEL fader + page keys + ■ STOP). On first visit an intro card ("WHAT YOU'RE LEARNING / WHERE TO START", EXPLAIN THIS SCREEN / GOT IT) appears about a second after the page, then a "New: tap ⓘ to have this screen explained" bubble.

---

## Page 1 · Welcome and safe listening · `#labpreview/GameAudioLab` (module 1)

| Field | Notes |
|---|---|
| First look | Before the card arrives: the big top-down picture (blue disc, brick wall, wooden floor, a red box). It reads as "a game map", which is right. For a moment the picture has NO labels (they fade in a beat later), so the first impression is "abstract shapes". Then the intro card covers the middle of the screen. |
| Overwhelm | 3. The card is short and clear, but behind it sit a picture, a strip of three bars with "−17 dB", a five-cell readout row with "VOICES 0/16", five numbered steps, a log and a four-key dock. On page 1 that is a lot of furniture to meet at once. |
| Knows what it is learning? | Partly. The card says it plainly ("How a game asks for sound, and how the audio side answers… the safe way to start any sound"). But the page is mostly about safe level, and a beginner may think the lab is "a hearing-safety lesson" rather than "how game sound works". |
| Knows what to do first? | Yes. The card and step 2 both say: LEVEL to 40% or lower, SOUND on, SCENE on. A beginner would tap the LEVEL fader first, which is right. The practice checklist ticked each item live (✓ Set LEVEL low, ✓ start scene, ✓ STOP, ✓ Pass the check): excellent feedback. |
| Words they would not know | "dB" (strip shows "−9 dB", "−17 dB" with no gloss on this page); "VOICES 0/16" ("Page 7 explains them": honest, but the beginner meets an unexplained number on the very first page); "instance" (in log and readout labels); activity log lines "EVENT Play_Amb_Courtyard posted by SCENE", "Courtyard wind · bed → AMBIENCE bus" ("event", "bed", "bus", the underscore code names); "room tone"; "the game's ears" is good but "listener" as a technical term only shows in the chip. |
| Follows / continues? | Yes. The task is small and the ticks confirm it. The wrong-answer feedback in the check is kind and teaches ("By the time you lower it, your ears have already received the loud start."). The end button "NEXT: SOUND THAT REACTS ›" is a clear exit. Possible quit point: pressing SOUND throws the long legal Sound Safety warning over everything; a beginner who only wanted to look may feel told off and leave. |
| What works | (a) Five numbered steps with the same names on every page: a learnable rhythm. (b) Practice checklist ticks on real actions. (c) The log says "(not heard: sound is off)", so a silent user still sees cause and effect. (d) Term chips open the meaning inline, in plain words ("A virtual pair of ears placed in the scene…"). (e) "A COMMON MISTAKE" box. (f) STOP always last in the dock, said in words. |
| Suggestions | 1. On page 1 hide or grey the VOICES cell and the strip's dB numbers until the pages that teach them (or caption them "you will meet this on page 7"); first page should show only LEVEL, SCENE, SOUND. M. 2. Add one plain caption under the picture on first open: "This is the game world from above. YOU = the player. The amber wedge = where the game 'listens' from." (the text says it, but it sits under the display, out of sight while the picture is visible). S. 3. Make the activity log speak plain English first and code second, e.g. "Game asked: play the fountain (code: Play_Fountain)" and "Audio answered: fountain started, sent to the AMBIENCE group". Or gloss GAME/START/bus/bed with chips right under the log heading. M. 4. Draw the picture's labels at the same moment as the picture (no unlabeled first frame). S. 5. After GOT IT, do not also show the "New: tap ⓘ" bubble if the user just used EXPLAIN THIS SCREEN. S, SHARED. 6. Say in step 2 what to expect if you keep sound off: "Sound off? You can still do every step: watch PLAYING and the log." S. |
| Hobbyist | Fine and quick. Would skim the safety text; would like to know early that the log's "event / bus" language is real middleware (Wwise/FMOD) vocabulary, which is the hook for them. |

Screen-guide note: EXPLAIN THIS SCREEN runs a 5-step tour (What you're seeing, What you control, …) that rings the part it describes. Good. On my walk the tour card stayed open while I used the dock, and the Sound Safety warning then opened on top of it: two overlays stacked, which would confuse a beginner (SHARED: the guide could close itself when the user starts using the dock).

## Page 2 · Sound that reacts (module 2)

| Field | Notes |
|---|---|
| First look | The picture again (same courtyard), now with the readout row changed to DOOR · SPEED · PLAYING · VOICES · SOUND. The dock keys changed to SPEED fader, OPEN DOOR, GEN 1, SOUND, STOP. The eye goes to the dock keys because they are new. |
| Overwhelm | 3. The page asks for five things in a row (SOUND, OPEN DOOR, GEN 1, move SPEED, read log) and introduces five glossary words at once (Interactive audio, Audio event, Event-driven audio, Audio parameter, Playback instance). The core idea is ONE contrast (event vs parameter), which is good, but five chips make it look like five ideas. |
| Knows what it is learning? | Partly → yes after doing it. Step 1's film-versus-game sentence is a strong hook. The "START / CHANGE / MIX" three-ways line is clear. A beginner would say "pressing a button makes a sound; moving a slider changes it": that is the right takeaway. |
| Knows what to do first? | Yes. Step 2 names the keys exactly as printed in the dock. |
| Words they would not know | "posts an event" (posting is jargon; "calls out a name" helps); "take" ("an opening take or a closing take": not explained here); "instance" in the log ("the SAME instance i12 changes"), and the code "i12", "i9"; "PARAMETER speed = 87%"; "EFFECTS bus"; "GEN 1" (the guide explains the short name, the page does not); VOICES shows 2/16 while PLAYING shows 1, with no word on why (one generator = hum + fan): a beginner will think it is a mistake. |
| Follows / continues? | Yes. All three practice ticks came on live (open door, start generator, change SPEED). The log VALUE line counting "· 2 changes" with no new START is exactly the proof the page promises; the line "Cannot play sound right now? The log and the rings show what your ears would hear." is ideal for a silent learner. |
| What works | The film-vs-game sentence; one contrast per page; the log line spelling out "the SAME instance i12 changes, nothing restarts" (that sentence teaches by itself); the CLOSE DOOR key renaming itself after the press (feedback); "A COMMON MISTAKE". |
| Suggestions | 1. Cut the chip row to the two words the page is really about (event, parameter); move "Event-driven audio" and "Interactive audio" to page 1 only, and "Playback instance" to page 7. S. 2. Explain "take" where it first appears: "a take = one recorded version of the sound". S. 3. When PLAYING and VOICES differ, show a one-line note under the readouts on this page: "1 thing playing, made of 2 sounds (hum + fan)". S. 4. In the log, drop or soften the instance code (i12) for the first pages, or say once "i12 = this sound's ID number". S. 5. Put the event/parameter contrast in a two-column mini-picture inside step 3 ("Button → new sound starts" / "Slider → same sound changes"). M. |
| Hobbyist | Very good: maps straight onto "trigger a sample vs automate a plugin parameter" thinking. Would want one line naming what this is called in Wwise/FMOD (RTPC / parameter), which only comes on page 20. |

## Page 3 · Where games run (module 3)

| Field | Notes |
|---|---|
| First look | The same courtyard picture as pages 1-2, then the intro card. The picture does nothing on this page (it "stands for one small game"), so the eye looks at it, finds nothing new, and drops to the dock: BUDGET · PLATFORM ▸ PICK · LISTENING ▸ PICK. |
| Overwhelm | 3. Seven platform cards (MOBILE … CLOUD), each with five headed sections, plus listening setups, plus a BUDGET fader, plus two check questions. Mostly reading. The intro card's first sentence ("Platform, delivery and output are three separate questions, and a platform's name does not fix a game's sound quality or its voice budget") is abstract and uses "voice budget" before VOICES has been explained (page 7 / 17). |
| Knows what it is learning? | Partly. They would say "games run on different devices". The real point (platform ≠ delivery ≠ output) lands only if they read step 1 carefully; the three words are never shown as a picture. |
| Knows what to do first? | Yes: PLATFORM key, pick a card. But the tray covers the lesson, and step 2 says "the whole card is here" while "here" (the lesson body) is hidden under the tray: they must close the tray to read the card they just opened. |
| Words they would not know | "Delivery", "Output" (defined in one sentence, then used as labels); "voice budget", "VOICES 0/16", "8 voices / 16 voices" (what is a voice?); "platform certification", "controller speaker" (chips); "XR", "CLOUD", "HANDHELD" (no one-line meaning on the tray chip); "stream", "docks it". |
| Follows / continues? | Yes, with effort. The practice list is concrete (open four cards, choose a setup, change BUDGET). The two check questions are good real-world scenarios. Where they would drift: reading seven near-identical cards; BUDGET changes a number they do not understand yet. |
| What works | The card format (AN EXAMPLE · DECISIONS · WHAT STAYS THE SAME · WHAT COULD CHANGE · ONE TEST) is clear and practical; "A mobile game can be a large one" common-mistake line; the honest note that 8/16 are this lab's settings, not real device limits; the PLATFORM key showing "1 SEEN" as progress. |
| Suggestions | 1. Show the three questions as a tiny 3-box diagram in step 1 (WHERE IT RUNS → HOW IT ARRIVES → HOW IT IS HEARD) and keep it visible as a caption over the picture on this page, since the courtyard picture does not change here. M. 2. Let the tray show the whole card (or a "read the full card ↓" link that closes the tray and scrolls to it); do not say "here" for text that the tray is covering. S. 3. Move BUDGET off this page, or label it "VOICES (how many sounds at once, more on page 17)"; it is a second idea on a page that already has one. M. 4. Add a one-line meaning on the XR / CLOUD / HANDHELD chips. S. 5. Rewrite the intro "learning" line in plain order: "A game's device, the way it reaches you, and the speakers you hear it on are three different things." S. |
| Hobbyist | The cards are useful but long; they would skim to the "ONE TEST" line, which is the most practical part. Would like the page shorter. |

## Page 4 · Kinds of games (module 4)

| Field | Notes |
|---|---|
| First look | Picture first, then the intro card. After a GAMES pick the picture changes (OPEN WORLD moved YOU to the far left and drew rings round the fountain), and choosing OVERHEAD CAMERA puts a camera icon labelled "CAMERA · LISTENER" in the middle. That camera icon is the best "aha" picture so far. |
| Overwhelm | 3-4. Two unrelated lessons share one page: (a) genre / perspective / play mode (a reading list of 12 game kinds) and (b) where the listener sits (a hands-on pan experiment). Plus FACING in degrees, GEN PAN as "R 55%", and four glossary chips. |
| Knows what it is learning? | Partly. They will remember "game kinds" (familiar, fun) and maybe miss the real lab point (the listener can be the camera, not the character). The intro card states both, but the page title "Kinds of games" sells only the first. |
| Knows what to do first? | Yes (GAMES key). But order trap: picking a game kind first restarts the scene in that game's setup. After OPEN WORLD, step 3's instruction "read GEN PAN" met "GEN PAN —" because the generator had gone "virtual, tracked and not played" (read-aloud label): a beginner sees a blank and thinks it is broken. Only after OVERHEAD CAMERA did GEN PAN read "R 55%". |
| Words they would not know | "Perspective", "first person / third person" (most gamers know; non-gamers do not); "pan" and "GEN PAN R 55%"; "FACING 90° / 0°" (degrees as direction); "virtual" (in the readout label, explained only on page 17); "Split-screen audio" chip; "listener orientation". |
| Follows / continues? | Mostly. The camera experiment gives clear visible feedback (camera icon, R 55%, label "CAMERA"). The tray's own text is excellent: "The listener is a camera high above the middle of the scene… FACING turns only the character." Quit risk: reading 12 genre cards; the blank GEN PAN after a genre pick. |
| What works | The three-row "GENRE · PERSPECTIVE · PLAY MODE" box with one plain question each ("WHAT DOES THE PLAYER DO?", "WHERE IS THE CAMERA?", "WHO PLAYS, AND HOW?"): model of clear teaching. "The character is not the listener." as a one-line takeaway. Game-kind cards with "SOUNDS IT OFTEN PUTS FIRST" (Horror: "Restraint and silence"): memorable. "2 SEEN" on the GAMES key. |
| Suggestions | 1. Split into two pages or at least two clearly titled halves: "Kinds of games" (reading) and "Whose ears? player or camera" (experiment); rename the page "Kinds of games, and whose ears" so the second idea is announced. M. 2. When a GAMES pick leaves GEN PAN blank, say why in the cell's place ("too far to play, see page 17") or have step 3 begin with "Close GAMES first; the scene resets to the courtyard". S. 3. Explain "pan" in step 3 at first use: "PAN = how far left or right the sound sits (L 100% = fully left)". S. 4. Show FACING as an arrow on YOU as well as degrees (if not already: on the phone the wedge is small) and say "0° = facing the top of the picture" on the fader caption. S. 5. Drop "Split-screen audio" chip here (play mode is a side note). S. |
| Hobbyist | The camera-vs-character listener idea is genuinely new for a music hobbyist and well shown. The 12 genre cards would bore them. |

## Page 5 · Kinds of game sound (module 5)

| Field | Notes |
|---|---|
| First look | On my open the display area was blank black for a moment behind the intro card (picture not yet drawn), so the card felt like it was floating over nothing. After closing it: the courtyard, plus a new 9-cell strip of sound families (AMBIENCE BED, LOCAL, MOVEMENT, ACTIONS, IMPACTS, DIALOGUE, INTERFACE, MUSIC, VOICE CHAT). |
| Overwhelm | 3. Step 1 holds a nine-row family table and then two Latin-ish words (diegetic / non-diegetic), and the chip row has SEVEN words (Ambient loop, Gameplay sound effect, Interface sound, NPC bark, Diegetic, Non-Diegetic, Foley). Doing the page is fun though: the PLAY tray is a soundboard. |
| Knows what it is learning? | Yes for families (the table says what each is for, with "Here: …" examples that point at the picture). Partly for the deeper point (importance comes from the message, not loudness), which sits late in step 3. |
| Knows what to do first? | Yes. PLAY → seven big buttons. The tray's top window shows the newest log lines and the guide's words ("The generator is in the workshop. Follow the stone path."), which solves the "tray hides the log" problem seen on page 3. |
| Words they would not know | "bus" (introduced here: "A category is also called a bus": good, but late); "SOLO" (musicians know; a beginner does not); "diegetic / non-diegetic" (defined in one sentence, fine); "NPC bark", "Foley" (chips only); the strip now shows dB per family (−25 dB, −9 dB…), still unexplained; "debris", "latch". |
| Follows / continues? | Yes. After six presses: rings on the crate, door, fountain; a speech bubble over GUIDE; families on the strip lit with levels; PLAY key read "7 TRIED". Strong cause-and-effect even with sound off. |
| What works | PLAY tray as a soundboard with a live mini-log; the "Here: …" line in each family row pointing at a real object in the picture; the alarm example (quiet but most important) and its check question; the strip lighting each family as it sounds. |
| Suggestions | 1. Trim the chip row to the 3-4 words the page uses in its own text; NPC bark / Foley can sit in the family table rows as "(also called Foley)". S. 2. Move the importance idea up: start step 1 with "Every game sound has a job. Some jobs matter more than loudness suggests." then the table. S. 3. Explain SOLO on the key or in step 3's first line: "SOLO = hear one group alone". S. 4. Introduce "bus" in step 1 next to the families ("each family is sent to a group called a bus"), not mid-step 3. S. 5. Make sure the picture is drawn before the intro card appears (no black panel). S, SHARED. |
| Hobbyist | Families map to their DAW folder tracks; diegetic/non-diegetic is the new, interesting idea. They would enjoy the soundboard. |

## Page 6 · From source to game build (module 6)

| Field | Notes |
|---|---|
| First look | The courtyard picture plus, under it, a new chain strip (SCENE · EVENT · LAYER · FILE · VOICE · OUTPUT with tiny dots and a 1 s / 2 s timeline). The readout row says IN BUILD · FOUND. The eye lands on the picture; the chain strip is small and dense and would not be read at first. |
| Overwhelm | 3-4. Step 1 introduces asset, authoring data, build and sound bank in one paragraph; six chips (Audio pipeline, Audio asset, Audio Middleware, Sound bank, Implementation, Audio implementer). But step 2's numbered chain of cards (1 ASSET RECORD → 2 EVENT → 3 SCENE CONNECTION → 4 RESULT, joined by "▼ the event asks for a file by its name") is the clearest diagram in the lab so far. |
| Knows what it is learning? | Yes once they reach the four cards: "a sound file only plays when an event uses it and the scene posts that event". Before that, step 1's paragraph reads like a textbook. |
| Knows what to do first? | Yes: OPEN DOOR. Then the troubleshooting card ("A tester reports that the door moves, but its main sound does not start") gives a real job and a mystery: very motivating. |
| Words they would not know | "imported", "packaged", "build" (as a noun), "authoring data", "sound bank", "middleware" (chip), "layers" (explained in step 2, good), "one-shot", "door_open.wav" (file extension), "IMPORT / AUTHOR / CONNECT / TEST" stage tags on the cards (never said in words that these are the four stages), "its voice is held from now" (log). |
| Follows / continues? | Yes, very well. START THE FAULT → press the door → log FAULT line in plain words ("the file "door_open_v2.wav" is NOT IN THE BUILD. The event was posted, but this layer cannot play") → DOOR FILE tray explains the problem and offers the two file names. IN BUILD readout turned red "MISSING". SHOW A HINT exists for the stuck. Excellent recovery path. |
| What works | The four-card chain with arrows that say what joins them; the red MISSING readout; a FAULT log line in plain sentences; the tester-report framing (real work); the hint button; "A file in a folder is only an asset until an event uses it." |
| Suggestions | 1. Open step 1 with the four stages as a one-line list that matches the card tags: "MAKE → IMPORT → AUTHOR → CONNECT → TEST" and say "the cards below follow these stages". S. 2. Move the asset / authoring data / build definitions next to the cards they describe (asset = card 1, authoring data = card 2, build = what TEST runs) rather than as a block paragraph before them. M. 3. Give the chain strip under the picture a caption on this page ("the door's path, left to right: lights up as each link works") and larger labels; at phone size it is unreadable. M. 4. Cut chips to Asset, Sound bank, Middleware; "Audio implementer" belongs to page 20/21. S. 5. Say in step 1 why this matters: "Most game audio bugs are a broken link in this chain, not a bad sound." S. |
| Hobbyist | Best page so far for them: the asset → event → scene → build chain is exactly the part a DAW user has never seen. The fault exercise is satisfying. |

Note for every page from here: in the web preview the scene picture was a blank black panel for 1-3 s after each page change (the readouts were already there), on pages 5, 6 and 7 at least. A beginner who sees a black box under the title may think the page is broken. Not checked on a phone (needs a phone). If the phone does the same, a "drawing the scene…" placeholder would help (SHARED, S).

## Page 7 · Events and instances (module 7)

| Field | Notes |
|---|---|
| First look | The picture (after the blank delay), readouts GEN 1 OFF · GEN 2 NONE. Dock: SPEED 1, SPEED 2 (greyed "LOCKED"), GENERATORS ▸ 0 ON. A greyed LOCKED key is a nice nudge: "something must be added first". |
| Overwhelm | 3. The concept is abstract (definition vs playing copy) but the experiment is concrete (two generators, one event). Step 3 then asks for four actions in one breath (move SPEED 2, switch GEN 1 off, REMOVE GEN 2 while it runs, start the fault). |
| Knows what it is learning? | Partly. "An event is a definition… one playing instance for that object" is precise but bookish. A beginner would say "two machines can use the same sound and still be controlled separately", which is the right idea, in their own words. |
| Knows what to do first? | Yes: GENERATORS → ADD GENERATOR 2 → GENERATOR 1 · ON → GENERATOR 2 · ON. Keys rename to their state ("GENERATOR 1 · ON", "REMOVE GENERATOR 2"): good feedback. PLAYING 1 / VOICES 2 after one generator, and step 2 finally explains why ("Each generator plays a hum and a fan, so two instances use four voices"): this answers the confusion from page 2, five pages late. |
| Words they would not know | "emitter" (defined, good); "instance" (defined, finally); "one-shot" vs "loop" (defined); "fades its instance"; "Some tools keep such a value on the object, others on the playing instance" (a pro caveat that will confuse a beginner); the tray's "✓ STOP ITS LOOP / LEAVE IT PLAYING" pair shows before the fault is mentioned, with no label saying what it is for. |
| Follows / continues? | Yes until step 3's four-action chain; the TROUBLESHOOT card ("The loop with no owner": a sound that keeps playing after its object is gone) is a great real bug, but it is the third idea on the page. |
| What works | The LOCKED SPEED 2 key; key labels that report state; PLAYING vs VOICES finally explained with a reason; the "loop with no owner" bug story. |
| Suggestions | 1. Move the PLAYING-vs-VOICES sentence ("one generator = hum + fan = 2 voices") to page 2 where the numbers first disagree, and repeat it here. S. 2. Split step 3 into numbered sub-steps (a, b, c, d) each with its own tick, rather than one sentence with four actions. S. 3. Label the STOP ITS LOOP / LEAVE IT PLAYING pair in the tray ("When generator 2 is removed:"), or hide it until the fault card is started. S. 4. Cut or move the "some tools keep such a value on the object" caveat to the hobbyist level (a "PRO NOTE" fold). S. 5. Picture idea: draw a thin line from each generator to its own "instance" tag (i1, i2) in the picture, so "instance" becomes something you can see. M. |
| Hobbyist | Clear and useful (like two tracks using the same sample with separate automation). The "loop with no owner" bug is the memorable part. |

## Page 8 · Triggers, states, switches (module 8)

| Field | Notes |
|---|---|
| First look | The picture, now with a four-lamp strip (TRIGGER · SWITCH · PARAMETER · STATE) and "MOOD · CALM" written on the map. The dock has SIX keys (SPEED, STEP, MOOD, SCOPE, SOUND, STOP): the most crowded dock so far. |
| Overwhelm | 4. Step 1 teaches four new words in one paragraph, then a second paragraph of tool vocabulary (Wwise Game Syncs, RTPC, Switch Group, FMOD parameters, "A Wwise Trigger starts a music stinger") that a beginner cannot use yet. Five chips. Six dock keys. A scope table. A fault card. |
| Knows what it is learning? | Partly. After STEP, they get "my footstep changes with the ground, the guide's does not" (switch = per character): that lands well. State (MOOD) and scope are a second and third idea; parameter is a repeat of page 2. |
| Knows what to do first? | Yes: STEP. The tray is the best-labelled tray in the lab: "TRIGGER · ONE THING THAT HAPPENS" over STEP: YOU / STEP: GUIDE / OPEN DOOR, and "SWITCH · WHERE YOU STAND" over STONE PATH / GRAVEL / WORKSHOP. After my steps the map read "YOU · GRAVEL" and "WOOD FLOOR · GUIDE", rings showed each step, and the lamps lit TRIGGER · SENT and SWITCH · SENT. Clear feedback. |
| Words they would not know | "trigger, switch, parameter, state" (all defined, but all at once); "RTPC", "Game Syncs", "Switch Group", "stinger", "Wwise", "FMOD Studio" (first time these tool names appear, with no "these are the two most common game audio tools" line); "scope", "local / global"; "SCOPE ▸ LOCAL" dock key (it changes the project setting: a beginner might press it and break the scene without knowing why). |
| Follows / continues? | The first half (STEP) yes. Step 3 asks for SPEED + MOOD + fault in one sentence; a beginner would do STEP, maybe MOOD, and skip the rest. |
| What works | Tray section headings that are definitions ("ONE THING THAT HAPPENS", "WHERE YOU STAND"); the LOCAL / GLOBAL table with one row per object; the four-lamp strip; "A trigger has no row. It happens once and is gone."; the fault story "Everyone walks on your ground". |
| Suggestions | 1. Move the Wwise/FMOD paragraph out of step 1 into a fold "IN THE REAL TOOLS" at the end of the page (or leave it to page 20). Biggest single load cut on this page. S. 2. Teach two at a time: trigger + switch first (STEP tray), then state (MOOD) with its own short step; parameter is already known from page 2, so say "you met this on page 2". S. 3. Hide SCOPE from the dock until the fault card is started, or label it on the key "SCOPE (project setting)". S. 4. Add one plain line before the table: "Ask: does this belong to ONE thing, or to the WHOLE game?" so "scope" is a question, not a word. S. 5. Give a one-line meaning when Wwise/FMOD first appear: "Wwise and FMOD are the two most used game audio tools." S. |
| Hobbyist | This is the page they came for (RTPC, Game Syncs) and they will like the mapping. They would not mind the density. |

## Page 9 · Variation and layers (module 9)

| Field | Notes |
|---|---|
| First look | The take strip under the picture: eight small bars labelled 1/4, 3/4, 2/4… with a legend (HIGHER: PITCH · TALLER: LEVEL · — SAME TAKE) and "NEWEST · TAKE 1 · −34 CENTS · −1.2 dB". The legend is a good idea; the numbers are not beginner words. |
| Overwhelm | 3. One clear idea (repeat sounds fake, so keep several versions) plus a second (one event, two layers), six chips including "Machine-gun effect" and "Pitch randomization", and two check questions. |
| Knows what it is learning? | Yes. "The ear notices an exact repeat immediately" is a reason anyone can feel (footsteps in old games). |
| Knows what to do first? | Partly. The intro says "Open SETUP and switch VARIATION off" first, but the dock's biggest new key is STEP, and a beginner taps STEP first (as I did): it works and shows takes changing, which is the "on" half of the experiment, so the order of the comparison is reversed. Not harmful, but the "off → on" story is lost. |
| Words they would not know | "take" (finally defined here: "A take is one version of the same sound". It was used on pages 1, 2 and 5 without a definition); "CENTS" (pitch unit, never explained); "dB" again; "random container / sequence container" ("holder" helps); "avoid repeat"; "machine-gun effect" (chip only; it is the best hook word on the page and is hidden in a chip); "VAR ON" on the SETUP key. |
| Follows / continues? | Yes. The strip's bars change height and the 1/4, 3/4, 2/4 labels show different takes. The door layer part repeats page 6. |
| What works | The take strip with its legend; "Every take must still sound like the same shoe."; the common mistake about too much randomness; question 2 (avoid repeat) is a good thinking question. |
| Suggestions | 1. Open step 1 with the hook: "Ever noticed footsteps in an old game sounding like a machine gun? That is one sound file repeated. This page fixes it." and define "machine-gun effect" there. S. 2. Define "take" on page 1 or 2, where it first appears, not here. S. 3. Replace "−34 CENTS" on the strip with "a little lower" / "a little higher" (or add "cents = small steps of pitch"). S. 4. Make the first instruction match the first big key: "Press STEP four times. Then open SETUP, switch VARIATION off and press STEP four more times: hear and see the difference." S. 5. The door layers part repeats page 6: shorten it to one line and a link back, or cut it. S. |
| Hobbyist | Knows round-robin sampling from drum libraries; will connect instantly. Would like the word "round robin" mentioned. |

## Page 10 · Loops, ambience and zones (module 10)

| Field | Notes |
|---|---|
| First look | A new strip: two bed rows (COURTYARD WIND, ROOM TONE) each with a level bar, "−18 dB", a waveform with a playhead (LOOP · POSITION), "10 s SMOOTH" (JOIN) and "×1" (COPIES). Handsome, but five columns of numbers for a beginner. The dock key "WIND F…" is cut off on the phone (reads "WIND F… LOOP"). |
| Overwhelm | 4. Four ideas: loop join, bed vs spot sound, zone crossfade, and a fault where copies stack. Five chips. Walking needs STEP plus FACING in degrees ("set FACING near 270° and walk back"). |
| Knows what it is learning? | Partly. "Background sounds swap when you walk into another room" lands (the log line "ZONE: the listener entered the workshop. ONE crossfade of the ambience beds" is very clear). "A loop needs a prepared join" lands only if they try RAW CUT and watch JUMPS, which is in step 3. |
| Knows what to do first? | Yes: SOUNDS → SCENE · OFF → OPEN DOOR → close → STEP. Six STEPs walked me into the workshop (ZONE readout changed to WORKSHOP, one log line). Walking back is the hard part: a beginner must work out that FACING turns YOU and 270° means "back toward the courtyard". |
| Words they would not know | "bed", "spot sound", "join", "loop point", "crossfade" (all defined in step 1 in one paragraph); "virtual" ("A real engine usually makes it virtual": not explained until page 17); "position update"; "RAW CUT / PREPARED LOOP"; "JUMPS"; "COPIES ×1"; "dB". |
| Follows / continues? | Mostly. Getting back through the door with FACING + STEP is where a beginner would give up ("Cross the doorway twice"). The fault ("The background that keeps growing": copies stack) is a great story but is the fourth idea. |
| What works | The single ZONE log line; COPIES ×1 on the strip (the fault will make it climb: visible proof); the honest "A fade does not repair a badly cut loop."; check question 2 (does a longer crossfade fix a bad loop? no) makes them think. |
| Suggestions | 1. Add a WALK BACK (or TURN AROUND) key, or let STEP have a ◀ / ▶ pair; FACING in degrees is a poor way to walk on a phone. M. 2. Put the loop-join experiment first (it is the core of "loops"), then zones: right now the order is zones first, joins in step 3. S. 3. Give the strip a one-line legend on this page ("JOIN: how smooth the loop's restart is · COPIES: how many are playing (should be 1)"). S. 4. Do not truncate dock labels: "WIND F…" should be "WIND" or "FILE". S, SHARED (dock label fit). 5. Do not mention "virtual" before page 17, or gloss it: "(kept track of but not played)". S. |
| Hobbyist | Knows loops and crossfades from DAWs; the zone idea and the stacking-copies bug are new and good. |

## Page 11 · Emitters and distance (module 11)

| Field | Notes |
|---|---|
| First look | The picture now has a green dashed ring "MIN 4 m" round the generator, a larger dashed ring "MAX 12 m" (mostly off the picture), and a dotted line from YOU to the generator. Readouts DISTANCE 8.8 m · PAN L 25%. This is the most "readable at a glance" picture so far: you can see the rule. |
| Overwhelm | 3. The source card is plain and friendly; step 1's distance rule ("the level drops 6 dB each time the distance doubles. Over the last fifth of the way to the maximum it also fades to silence") is maths. Six chips. Step 3 asks to turn until "straight behind" and then walk until a sound goes VIRTUAL. |
| Knows what it is learning? | Yes for "sounds get quieter with distance, inside a min and a max". Partly for "left/right pan is not real 3D" (needs sound, or careful reading of the PAN number). |
| Knows what to do first? | Yes (SOURCES). The tray separates "SOURCE TO MEASURE" from "SWITCH ON" and adds "SCENE is the fountain and the background sound of each place." Good. But the dock key reads "SOURCES ▸ NONE" while the tray shows "✓ GENERATOR 1" chosen: NONE means "nothing switched on", which a beginner reads as "nothing chosen". |
| Words they would not know | "dB" (6 dB per doubling is meaningless without it); "attenuation curve", "cone attenuation", "positional audio" (chips); "VIRTUAL" (defined here in step 3: "tracked, not played, and played again when you return": the first proper definition, after it was used on pages 4 and 10); "m" is fine. |
| Follows / continues? | Mostly. The source card ("17° to your left, in front", "6.8 dB below full level", "The closed door is in the way… The next page is about that.") is a model of plain feedback. Turning "straight behind" with a degrees fader is fiddly; walking to VIRTUAL needs many STEPs. |
| What works | The MIN/MAX rings and dotted line in the picture; the source card in sentences; the forward pointer to the next page; the common mistake ("Pan and level cannot tell front from back"); "If a step cannot move you, a NOTE in the log says why." |
| Suggestions | 1. Replace "drops 6 dB each time the distance doubles" with words first: "Twice as far = clearly quieter (about a quarter of the sound energy)", with the dB figure in brackets. S. 2. Change the dock key's state word: "SOURCES ▸ GEN 1 · OFF" instead of "NONE". S. 3. Keep the MAX ring label inside the picture (it sits at the far edge). S. 4. A "TURN AROUND" key would make "straight behind" a one-tap step instead of a degrees hunt. M. 5. The card could say in words what the ear would hear when SOUND is off: "If you could hear it: slightly left, a bit quiet." S. |
| Hobbyist | Min/max distance and attenuation are new to most music hobbyists; the visible rings teach it well. |

## Page 12 · Walls, doors and rooms (module 12)

| Field | Notes |
|---|---|
| First look | (Picture blank for the first seconds again.) The dock has a new WALK fader "COURTYARD · 3.8 m TO WALL" with ‹ STEP WEST / STEP EAST › buttons. This is a third way of walking (page 10: STEP + FACING; page 11: FACING + STEP; page 12: WALK slider + west/east). |
| Overwhelm | 4. Step 1 names five physical effects (block, pass through, reflect, bend, reverberation) and then two jargon words (obstruction vs occlusion). Step 2: "a low-pass filter at about 900 Hz (12 dB per octave)". For a total beginner this is the densest single sentence in the lab. |
| Knows what to do first? | Yes (ROOM → GENERATOR 1 on → door key). The practice list is concrete and uses words the readout will show ("GEN 1 reads MUFFLED", "GEN 1 reads CLEAR"): excellent, the target state is named. |
| Knows what it is learning? | Partly. "A closed door makes a sound quieter and duller" lands. Obstruction vs occlusion will not stick on first pass. The common mistake ("A designer chose this level change and filter.") is a valuable truth: games fake acoustics. |
| Words they would not know | "low-pass filter", "Hz", "dB per octave", "reverberation", "reverb tail", "DRY", "obstruction / occlusion", "acoustic portal", "line of sight". |
| Follows / continues? | Mostly. The "would be" card ("LEVEL CHANGE: Would be 9 dB lower · FILTER: Would be a low-pass at about 900 Hz") is a nice idea (shows the effect before you switch on), but its words are the hard ones. With sound off the REVERB/DRY comparison relies on a strip window. |
| What works | MUFFLED / CLEAR as readout words (plain); practice items that name the readout state to reach; "would be" card; honest note that the scene tests no line of sight; the check question's right answer ("a designer's treatment"). |
| Suggestions | 1. Say "duller (the high, bright part is turned down)" first and put "low-pass filter at about 900 Hz, 12 dB per octave" in brackets or a PRO NOTE. S. 2. Use one walking control across the whole lab (the WALK slider + STEP WEST/EAST here is the friendliest; offer it on pages 10 and 11 too). M. 3. Teach occlusion (behind a wall) here and leave obstruction to a one-line aside; two near-identical words on one page get swapped. S. 4. Give the strip's curve a caption ("the curve dips on the right: the bright part is cut"). S. |
| Hobbyist | Knows low-pass and reverb; the obstruction/occlusion distinction and "designer's choice, not physics" are the new, useful bits. |

## Page 13 · Output formats (module 13)

| Field | Notes |
|---|---|
| First look | Picture with rings on the fountain; readouts FOUNTAIN · BEHIND and OUTPUT · STEREO; a strip with a head and two ear bars. (No screenshot of the strip on this page: the browser pane was hidden at that moment; layout from the text and the strip legend.) |
| Overwhelm | 5. The heaviest page for a beginner. Step 1 alone: channel-based, binaural rendering, object-based, renderer, and four brand names (Dolby Atmos, DTS:X, Windows Sonic, Tempest 3D AudioTech). Then a 5.1 picture. SEVEN chips (Channel-based, Object-Based, Binaural, HRTF, Ambisonics, Head tracking, Downmix). Step 3: HRTF, pan law, "3 dB quieter". |
| Knows what it is learning? | Partly. They would take away "headphones can fake sound from behind you", which is the right core. Everything else is a list of names. |
| Knows what to do first? | Yes: SCENE on, OUTPUT → STEREO, turn with FACING. But step 3 begins "Put on headphones": this page truly needs sound and headphones to be felt. With SOUND off, the head-and-ears strip is the only teacher (fountain "slides along the line between your ears" in stereo vs "moves on a circle" in 3D): a good substitute, if they notice the strip. |
| Words they would not know | channel, channel-based, binaural, object-based, renderer, 5.1, subwoofer, HRTF, pan law, downmix, mono, ambisonics, head tracking, Atmos / DTS:X / Sonic / Tempest. |
| Follows / continues? | They can tick the practice list (three choices + turns) without understanding. Quit risk is high here: page 13 of 22, the longest word list, and the experience depends on hearing. |
| What works | The check question is excellent and answers the one thing every beginner wonders ("Headphones have two small speakers… How can a sound seem to come from behind you?"). The common mistake ("Two are enough: the filtering happens before the sound reaches them") is clear. The 5.1 picture with the honest caption "your phone is not sending surround". The STEREO-line vs 3D-circle strip is a strong silent picture. |
| Suggestions | 1. Lead with the check question as the page's hook: "Two speakers, yet sound from behind you: how?" and build the page to answer it. S. 2. Move object-based audio and the four brand renderers to a fold ("MORE: surround and object audio") or page 21; keep this page to STEREO vs HEADPHONE 3D vs MONO. M. 3. Cut chips to Binaural, HRTF, Downmix. S. 4. With SOUND off, say so in step 2: "No headphones? Watch the head in the strip: a line means left/right only, a circle means front and back too." S. 5. Explain "mono" once in plain words ("everything in one channel, as from one speaker") before asking to fold to it. S. |
| Hobbyist | Will enjoy it (binaural, Atmos), and is the right audience for the full depth. Would want to actually hear it on headphones. |

## Page 14 · Adaptive music (module 14)

| Field | Notes |
|---|---|
| First look | The music clock: a strip under the picture plus, in step 1, a little diagram "ONE CLOCK · 96 BPM · FOUR BARS" with three layer rows (CALM, PULSE, DRIVE) over BAR 1-4 and a PENDING line. The courtyard picture is not part of this lesson (the music has no place). |
| Overwhelm | 3-4. The diagram helps a lot, but: BPM, bars, phrase, layers, vertical layering, horizontal resequencing, stinger, transition rule, mood state, and SEVEN chips. |
| Knows what it is learning? | Partly → yes after trying. "Music changes wait for the next bar so they stay in time" comes through clearly from the feedback. "Vertical layering / horizontal resequencing" will not stick (two big words, one sentence). |
| Knows what to do first? | Yes. MUSIC → ▶ START. Nice progressive reveal: PULSE, DRIVE and STINGER only appear after START. Pressing PULSE gave "PENDING · Add PULSE: lands on the next bar line in 1.7 s." and the log "Add PULSE: QUEUED for the next bar": excellent, live, plain feedback. |
| Words they would not know | "bar", "phrase", "BPM" (spelled out, good), "layer", "stinger" (defined in step 3), "QUEUED / APPLIED / WITHDRAWN", "vertical layering", "horizontal resequencing", "transition", "boundary". A non-musician does not know what a bar is; the page assumes it. |
| Follows / continues? | Yes for steps 2; step 3 ("change your mind before the phrase ends") is a timing puzzle a beginner may miss: they need to press two keys within a few seconds. Without sound, they cannot feel "in time" at all; they only read that it is. |
| What works | The clock diagram with the PENDING line; the countdown "lands on the next bar line in 1.7 s"; START revealing more keys; the common mistake about separate timers drifting (real-world and concrete). |
| Suggestions | 1. Define "bar" in one line in step 1 ("a bar = one count of 1-2-3-4 in the music; changes wait for the next '1'"). S. 2. Make the waiting visible on the clock strip: a moving playhead and a flag on the next bar line where the change will land (if the strip does not already: I could not see it, the pane was hidden). M. 3. Put the two big terms in a "names for what you just did" box after the practice, not before it. S. 4. Cut chips to Adaptive music, Stinger, Transition. S. 5. Step 3's "change of mind" needs a wider window for a beginner: default CHANGE AT to NEXT PHRASE for that step, or say "you have about 10 seconds". S. |
| Hobbyist | Musicians will love this page; it explains how game music stays in time, which they rarely see. |

## Page 15 · Dialogue and languages (module 15)

| Field | Notes |
|---|---|
| First look | Picture with the guide; readouts SPEAKING · QUIET and PRIORITY · —; a strip of line bars. The LINES tray shows two big buttons "GREETING · 80" and "WARNING · 95": the numbers are the priorities, which a beginner will not know until they read step 1. |
| Overwhelm | 2-3. One of the calmer pages: two lines, two languages, one rule (higher number wins). Five chips. The two-language table (file name, length, words) is long but friendly. |
| Knows what it is learning? | Yes. "The more important line wins, and the caption must follow the actual audio file" is clear, especially the check question (caption timed from English, Spanish is longer). |
| Knows what to do first? | Yes. LINES → GREETING → WARNING → GREETING. The caption appeared in step 2 ("GUIDE: Warning: the generator is overheating.") and the log said in plain words "greeting (i117) INTERRUPTED by a more important line: it stops" and "REFUSED · a more important line is speaking". Perfect feedback, and it works fully with SOUND off because the caption carries the words. |
| Words they would not know | "priority" as a number (the 80/95 on the buttons are unexplained on the button); "NPC bark" chip; "take"; "localization" (and the confusing aside: "In this app's glossary that word means something else: hearing where a sound comes from." A beginner now doubts both meanings). |
| Follows / continues? | Yes, all the way. |
| What works | Captions as the silent learner's channel; the INTERRUPTED/REFUSED log; the language table showing two file names for one line; "the player reads one language and hears another" common mistake; a check question that tests understanding, not recall. |
| Suggestions | 1. Label the tray buttons "GREETING · priority 80" / "WARNING · priority 95" (or a small "higher wins" note in the tray). S. 2. Rephrase the localization aside: "Game teams call this localization. (Careful: in sound science, 'localization' means hearing where a sound comes from.)" so it reads as a tip, not a contradiction. S. 3. Mention accessibility as the reason captions matter (the chip "Subtitles for the deaf and hard of hearing" is there; one line in step 1 would give the reason to care). S. |
| Hobbyist | Easy page; the priority system is new and practical. |

## Page 16 · The game mix (module 16)

| Field | Notes |
|---|---|
| First look | After filling the scene: six bus meters under the picture (AMBIENCE, EFFECTS, DIALOGUE, MUSIC, INTERFACE, CHAT) with "DUCK −8 / −5 / −10" tags, a speech bubble over the guide, readouts DUCK · DUCKING and MUSIC · −10 dB. Very readable cause and effect: "someone speaks → everything else dips". |
| Overwhelm | 3. Step 1 has a good SIGNAL PATH diagram (AUDIO: sound ▶ its bus ▶ master ▶ output / CONTROL: game ▷ trigger · switch · parameter · state) but then a dense paragraph about computed meters ("a sum of gains, not an overload"). Step 3 has three separate mini-tasks (DUCK OFF, bus fader / MUTE / SOLO, ALARM + VISUAL CUE). |
| Knows what it is learning? | Yes for ducking ("other buses turn down while a line is spoken"). The check question (turn others down vs raise master) is exactly the right practical lesson. |
| Knows what to do first? | Yes. The SOUNDS tray is split into "BUILD A BUSY SCENE" and "SPEECH · AN IMPORTANT SOUND": headings that explain the purpose. GUIDE LINE · SPEAKING shows live state. |
| Words they would not know | "bus" (defined: "a group channel"), "master", "fader", "headroom" (defined, abstract), "duck/ducking" (shown, not named in plain words: "turning other sounds down so speech is clear" would help), "dB", "snapshot", "dynamic mixing", "event-driven duck", "sum of gains". |
| Follows / continues? | Yes. The VISUAL CUE (a warning sign by the generator) is a strong accessibility moment and a nice ending. |
| What works | The solid-vs-dashed signal path diagram ("The dashed row is the game telling that path what to do: it carries no audio."); DUCK tags on the meters; tray section headings; the master-level common mistake; the visual cue. |
| Suggestions | 1. Define ducking in one plain clause where DUCK first appears: "DUCK = the mix turns other sounds down while someone speaks". S. 2. Move the "meters are computed, not measured / sum of gains" paragraph into a PRO NOTE fold. S. 3. Number step 3's three tasks (a, b, c) with their own ticks. S. 4. Headroom: give a picture or a metaphor ("space above the loudest sound, like ceiling height") or leave it to the check question, which already teaches it. S. |
| Hobbyist | Sidechain ducking is familiar; the "game, not audio level, drives the duck" idea is the new one and is shown well. |

## Page 17 · Budgets and voice limits (module 17)

(Walked by reading and the opening state; I did not press BURST on this page, to keep pace. The card "SINCE THE LAST BURST · VOICES TAKEN, IN ORDER" is designed as the feedback.)

| Field | Notes |
|---|---|
| First look | Readouts STOLEN 0 · REFUSED 0 next to the VOICES 0/16 cell that has been on screen since page 1. The dock has a BUDGET control with ‹ FEWER / MORE ›. |
| Overwhelm | 4. The voice-stealing rule is one dense paragraph (least important, oldest of equals, protected, REFUSED, stolen loops go virtual); then a MEMORY block of sample maths ("33,600 samples × 4 bytes × 1 channel = 134,400 bytes"), 32-bit, decoding, compression. Six chips. |
| Knows what it is learning? | Yes for "a game can only play so many sounds at once, and something has to give". The memory maths is a second lesson most beginners will skip. |
| Knows what to do first? | Yes (BUDGET to 8, SOUNDS, BURST). "‹ FEWER / MORE ›" buttons are easier than a slider. |
| Words they would not know | "voice" — finally defined here ("A voice is one sound file playing at this moment"), but the VOICES readout has been on every page since page 1, and page 3 already asked them to change the voice budget; "virtual" (defined again, good); "protected"; "samples per second", "bytes", "32-bit", "channel", "decoded", "compressed", "overhead", "processing time / CPU". |
| Follows / continues? | Yes for steps 2-3 (the budget-1 "every impact is REFUSED" result is a clear "aha"). The memory block is where a beginner's attention would end. |
| What works | STOLEN / REFUSED as readouts with plain verbs; the ordered "voices taken" card; protected alarm surviving the burst (connects to page 5: importance comes from the message); the honest "This lab measures no processing time." |
| Suggestions | 1. Define "voice" on page 1 (one line: "a voice = one sound file playing right now; a phone can only play so many at once, page 17 shows why"). This fixes confusion on pages 1-16. S. 2. Turn the stealing rule into a 3-row picture or ordered list: "1. Take from the least important. 2. If tied, take the oldest. 3. Protected sounds are never taken. 4. Nothing to take? REFUSE the new one." S. 3. Move the MEMORY maths into a fold "HOW BIG IS A SOUND IN MEMORY?" with the answer in words first ("10 s of stereo wind ≈ 2 MB in memory; the file on disk is smaller"). M. 4. Chips: keep Voice stealing, Virtual voice, Playback limit. S. |
| Hobbyist | Will relate to "max polyphony" on a sampler. The memory maths suits them. |

## Page 18 · Multiplayer sound (module 18)

| Field | Notes |
|---|---|
| First look | A network strip: YOUR MACHINE ← NETWORK (0.25 s) → THE OTHER MACHINE, with "A1 ▶ PLAYED" on both ends after a send. Readouts ID CHECK · ON and LAST ID · A1. A clear, two-computer picture. |
| Overwhelm | 2-3. One idea (send what happened, not the sound) and one trap (a message arriving twice). Four chips. |
| Knows what it is learning? | Yes. "A networked game usually does not send sound. It sends what HAPPENED" is a crisp, surprising sentence. |
| Knows what to do first? | Mostly. Dock order changed on this page: SEND is first, ID CHECK second, LEVEL third (on most pages LEVEL is first and the main chooser second). Tapping "the second key" by habit, I toggled ID CHECK off by accident; a beginner would too, and would not notice. The tray itself is well labelled ("SEND A NEW ACTION" / "SEND IT AGAIN · LIVE CHAT") and the AGAIN chip reads "A1 AGAIN". |
| Words they would not know | "ID", "action A1", "networked", "proximity voice chat", "server" (appears in the check), "split-screen" chip. |
| Follows / continues? | Yes; the duplicate-message idea is shown visibly. Step 3 again bundles three actions. |
| What works | The two-machine strip; LAST ID readout; "one action, one sound"; a check question about your own action echoing back (realistic). |
| Suggestions | 1. Keep the dock key order the same on every page (LEVEL or the page's main fader first, then the main chooser), so muscle memory works. S, SHARED. 2. Say what "ID" means in one line: "Each action gets a number (A1, A2…) so a copy can be spotted." S. 3. Mark ID CHECK as a fault / setting key (e.g. a small "setting" label) so it is not mistaken for an action. S. |
| Hobbyist | New territory for most; short and clear. |

## Page 19 · Testing and fault finding (module 19)

(Read and opened; I did not run the five faults one by one: the fault-card mechanism is the same one I ran on page 6.)

| Field | Notes |
|---|---|
| First look | Readouts FAULTS 0 · FIXED 0 (a score: motivating). A fault picker row "▸ 1 ○ 2 ○ 3 ○ 4 ○ 5 ○" with a legend "○ NOT STARTED · ● ACTIVE · ✓ FIXED". |
| Overwhelm | 3. Five faults, but one at a time, each with its own card. The method is spelled out: repeat, read the log, compare with the picture, then fix. |
| Knows what it is learning? | Yes: "how to find what is wrong, step by step". The common mistake is excellent ("Declaring success because the picture changed. An animation shows that the game acted. A START line shows that the audio side started it."). |
| Knows what to do first? | Yes: TEST, try each action "while nothing is wrong" (a baseline: very good habit), then fault 1. |
| Words they would not know | "profiling", "QA / quality assurance", "in context", "pattern" of log lines (explained), "bus". |
| Follows / continues? | Yes; this is the payoff page for everyone who read the log on pages 1-18. A learner who skipped the log until now will be lost: the whole page depends on reading log lines. |
| What works | Baseline-first instruction; "finding comes before fixing" (a fault counts only after its symptom was seen); the FAULTS/FIXED score; the check's right answer is the method itself ("Read the log: was the event posted, did a START follow?"). |
| Suggestions | 1. Show a short "healthy pattern" example right in step 2 (three log lines with labels: GAME = asked · GAME = event · START = answered → bus) so the learner has a model to compare against. S. 2. Fault 1 repeats page 6's door fault exactly; vary it or say "you fixed this one on page 6: try it without the hint". S. 3. Add a "SHOW A HINT" per fault (page 6 had one) if not present: some beginners will need it for faults 3-5. S. |
| Hobbyist | Satisfying puzzle page; would want all five faults. |

## Page 20 · Finding your way in the tools (module 20)

| Field | Notes |
|---|---|
| First look | A new picture: a "SIMPLIFIED · NOT ONE REAL PRODUCT" tool screen with eight numbered windows (1 SOUNDS, 2 EVENTS, 3 GAME INFO, 4 MUSIC, 5 PROPERTIES, 6 MIXER, 7 AUDITION, 8 PROFILER), each showing a live bit of the scene (Play_Door, STONE, CALM, 40%). It looks like real software: exciting and a bit intimidating at once. |
| Overwhelm | 4. The page drops the five-step format the learner has used for 19 pages (no 1 UNDERSTAND … 5 CHECK), and is the longest page: eight window descriptions, ten name cards each with four tool names (Wwise, FMOD Studio, Unity, Unreal Engine), several tool caveats ("Sound Cue and the newer MetaSound…", "Names change between versions"), and six check questions. |
| Knows what it is learning? | Yes. "Look for the kinds of window first, then the names." is an excellent one-line goal, and each window says "In this lab: <page names>", which ties the whole lab together. |
| Knows what to do first? | Yes: slide WINDOW to light each window; choose a TOOL. But without the usual numbered steps, they may not know when the page is "done" until they hit "The six checks below complete this page." far down. |
| Words they would not know | Every tool name (first time Unity and Unreal appear); "Playing ID", "Labeled parameter", "Multi instrument", "Sound Submix", "Control Bus Mix", "Audio Insights", "MetaSound", "Game Object". These are the point of the page, but a beginner needs to know they are not expected to memorize them. |
| Follows / continues? | A beginner would light a few windows, scroll the name cards, and stall at six recall-style checks (e.g. "Which name in Unreal is the group channel?"), which test memory of the table they just scrolled past. |
| What works | The simplified tool picture tied to the live scene; "In this lab: …" cross-references on every window (a built-in recap of the lab); the common mistake ("Look for the same idea: one tool's Switch is another tool's labeled parameter."); "A dash means no close idea of its own". |
| Suggestions | 1. Add one reassurance line at the top: "You do not need to memorize these names. Know the idea; the table is here to look up." S. 2. Keep the familiar numbered rhythm (even as 1 UNDERSTAND · 2 EXPLORE the windows · 3 the names · 4 PRACTICE · 5 CHECK) so the learner knows where they are. S. 3. Let the TOOL choice filter the name cards to one tool (show only Wwise names when WISE is chosen) instead of all four columns at once. M. 4. Reduce six checks to three that test the IDEA (which window would you open?) rather than recall of a specific product name; or let the learner keep the table open while answering. M. 5. Make the windows in the picture tappable to jump to their description. M. |
| Hobbyist | The best page for them: a Rosetta stone between tools. They will bookmark it. |

## Page 21 · Game audio today (module 21)

| Field | Notes |
|---|---|
| First look | The courtyard and the six-bus strip; a calm dock of three keys (TOPIC ▸ CHOOSE · SOUND · STOP). First line: "Choose a TOPIC under the picture." |
| Overwhelm | 2. A reading page with five short topic sections and two checks. Calm after page 20. |
| Knows what it is learning? | Yes: "what the job looks like now", and the "Two kinds of knowledge" box (making a sound vs implementing it; "A technical sound designer works on both") is a strong career framing that would have helped on page 1. |
| Knows what to do first? | Partly. The first line says the TOPIC control is "under the picture", but the TOPIC key is in the dock at the bottom of the screen. A beginner looks under the picture (sees the bus strip) and finds no topic control. |
| Words they would not know | "implementation", "procedural audio", "synthesis", "MetaSounds", "Steam Audio", "spatial tools", "generative AI", "authoring". Most are defined in the sections. |
| Follows / continues? | Yes. The AI section's four questions (control, repeatability, source of material, runtime cost) are a mature, useful frame, and the checks test understanding. |
| What works | "Procedural audio is not generative AI. A designer wrote its rules."; the honest "No sound in this lab is procedural"; the four AI questions; accessibility named as everyday work. |
| Suggestions | 1. Fix the pointer: "Choose a TOPIC with the TOPIC key at the bottom." S. 2. Move the "Two kinds of knowledge" box (make vs implement) to page 1 as the lab's "why this matters" opener; repeat it here as the wrap-up. S. 3. Show what the scene does for each topic in one caption line on the picture ("TOPIC ACCESS: the warning sign appears by the generator"), so the picture earns its place on a reading page. S. |
| Hobbyist | Interesting and current; would like a pointer to try MetaSounds or Steam Audio for real. |

## Page 22 · Capstone and free play (module 22)

| Field | Notes |
|---|---|
| First look | The full courtyard; readouts SURFACE · STONE, MUSIC · OFF; dock MOVE ▸ · SOUNDS ▸ · MUSIC ▸ · REPORT ▸ · SOUND · STOP. Seven goals in step 4. |
| Overwhelm | 3. "This page adds no new idea" is reassuring. Seven open goals with "any order" and no single first step is a lot of freedom for a beginner; the hint system rescues it. |
| Knows what it is learning? | Yes: put it all together. |
| Knows what to do first? | Partly, then yes. "Plan it first" is abstract for a beginner. SHOW A HINT gives a concrete first action for the first unmet goal ("MOVE: press STEP FORWARD twice on the stone path. Then choose GO: GRAVEL and press STEP FORWARD again."): excellent. |
| Words they would not know | None new; the test is whether earlier words stuck (take, layer, zone, duck, bar). |
| Follows / continues? | The page shows TWO separate activity logs (one filtered to GAME/START/STATE…, one to MIX/MUSIC…), which is confusing: "which log do I read?" The note "The slider changes to their control only when you close the tray" describes a hidden rule. "Seven goals in one visit" (from the end screen rule) is not said on the page itself: leaving and coming back loses progress. |
| What works | "This page adds no new idea"; the goal list phrased as outcomes; SHOW A HINT for the first unmet goal; the common mistake ("A key press is only a request. The log shows what the audio side did with it."), a perfect summary of the lab; the LEARNING SUMMARY report ("This is a record of lab practice. It is not a qualification."). |
| Suggestions | 1. One log, with a filter chip (ALL · SOUND · MIX · MUSIC), not two logs. S. 2. Say on the page "Do all seven in one visit: leaving the page resets the goals" (the end screen says it, the page does not). S. 3. Offer a "start me off" button that runs goal 1's hint as a guided first step, for beginners who freeze at "plan it first". M. 4. Show the seven goals as a checklist pinned near the picture while the dock trays are open (trays cover step 4). M. |
| Hobbyist | Fun sandbox; they will skip the hints and enjoy it. |

## End screen · "Where you are" / WHAT'S LEFT (after FINISH)

| Field | Notes |
|---|---|
| First look | A long list: "21 pages not done yet." then 21 rows, each repeating "Counts once its practice goals and its check are done; NEXT moves on without counting it." |
| Overwhelm | 3 (emotional, not cognitive): a beginner who walked all 22 pages and did most practice but skipped some checks sees "21 pages not done" and feels they failed. |
| Knows what it learned? | No. The end screen lists what is left, not what was learned. There is no recap of the lab's big ideas. |
| Suggestions | 1. Start with a recap card: "You learned: events start sounds, parameters change them, buses group them, the mix protects speech, the log tells the truth." (the intro card here already has a good one-line "WHAT YOU'RE LEARNING"). M, SHARED (kit/PagedLab end screen). 2. Per page, say what is missing in a few words ("check not answered" / "2 of 4 practice goals") instead of the same rule sentence 19 times. M, SHARED. 3. Give partial credit visibly ("practice done ✓, check left") so effort is seen. M, SHARED. |

---

## GAME AUDIO LAB · overall verdict

**The beginner's journey.** A newcomer meets a beautiful top-down game world and a page rhythm (UNDERSTAND · EXPLORE · LISTEN & OBSERVE · PRACTICE · CHECK) that becomes familiar by page 3. Pages 1-7 and 15-19 work well: one idea, a few keys, and the activity log and readouts answer every press in plain sentences, even with sound off. The middle pages (8, 10, 12, 13, 17) pile four to seven new terms, tool brand names and dB/Hz maths into step 1 paragraphs, and a beginner would start skimming around page 8 and is most likely to quit at page 13 (output formats). Page 20 is a superb map of the real tools but abandons the familiar format and ends in recall questions. The end screen tells a learner what is left, never what they learned.

**3 biggest orientation problems**
1. **Too many new words per page, all at once.** Chip rows of 5-7 terms (pages 5, 6, 9, 13, 14), step-1 paragraphs that define four ideas in a row (pages 6, 8, 12, 13, 17), and tool vocabulary (Wwise/FMOD/RTPC) arriving on page 8 before the learner needs it.
2. **Readouts and words used long before they are explained.** VOICES (page 1 → defined page 17), take (page 1 → page 9), virtual (page 4 → page 11/17), dB on every strip (never explained in this lab), instance codes like i12 in the log.
3. **Pages that hold two lessons, and multi-action steps.** Page 4 (game kinds + listener position), page 10 (loops + zones + stacking fault), step 3 on many pages asking for 3-4 actions in one sentence; three different walking controls across pages 10-12; dock order that changes (page 18).

**3 best things**
1. **The activity log and readouts as the silent teacher.** "(not heard: sound is off)", "the SAME instance i12 changes, nothing restarts", "INTERRUPTED by a more important line", "lands on the next bar line in 1.7 s": the lab works without sound.
2. **Practice lists that tick on real actions, faults to find, hints to ask for.** Page 6's door fault, page 19's five faults, SHOW A HINT on the capstone.
3. **Pictures that show the rule.** MIN/MAX rings (p11), the camera-as-listener icon (p4), the duck tags on bus meters (p16), the two-machine network strip (p18), the simplified tool screen (p20), the four-card asset → event → scene chain (p6).

**"First 30 seconds" rewrite (page 1)**
Show the picture with labels already drawn, and a single caption over it: "This is a game world from above. YOU are the player. A game does not play one soundtrack: it ASKS for sounds when things happen. In this lab you press the keys the game would press, and the log underneath shows how the sound side answers." Then one instruction: "Set LEVEL low, then press SCENE." Hide VOICES, dB and the strip's numbers until the pages that teach them. Put the "two kinds of knowledge" line (make a sound vs decide when it plays) here as the reason to care, and a one-line "voice = one sound playing right now" so the readout row makes sense from the start.

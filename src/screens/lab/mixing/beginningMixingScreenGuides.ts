/**
 * Beginning Mixing — "explain this screen" content (owner 2026-10-31, the
 * Screen Guide rollout; pattern: wave/waveScreenGuides.ts and
 * patchbay/patchbayScreenGuides.ts).
 *
 * The lab is a PagedLab with no menu of its own: the learner lands on page 1
 * from the Mixing list, so page 1's guide also explains the strip. One guide
 * per page, keyed 'p1'…'p16' in page order (pagesA → pagesD, as
 * BeginningMixingLabScreen spreads them). The what's-left END screen has its
 * own guide, BEGINNING_MIXING_END_GUIDE (PagedLab's `endGuide`, titled WHERE
 * YOU ARE). The lab has no appended check page (no authored check).
 *
 * Every line was written against the page's own code (pagesA–D, kit, begArt,
 * advPlots, engine/mixModel, engine/routing): names are the on-screen names
 * (card eyebrows, button labels, goal chips, labels drawn in the pictures),
 * and every number quoted is what the page draws for that setting.
 * Reorder or retitle a page → update BEGINNING_MIXING_GUIDE_PAGE_TITLES and
 * its guide; test/screenGuide_mixing-beg_20261031.test.ts pins both.
 *
 * STEPPED: each section is one step held to SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; claims KNOWLEDGE, never
 * skills; mixing moves are suggested starting points, never rules; "suggest",
 * never "recommend"; no gear maker names; no "N of total"; no build notes in
 * learner text. The guide never gives away a check's answer or the order the
 * Signal Flow builder asks for.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';

/** Each page id's title, in page order — pinned against pagesA–D. */
export const BEGINNING_MIXING_GUIDE_PAGE_TITLES: Record<string, string> = {
  p1: 'What Mixing Does',
  p2: 'Prepare the Session',
  p3: 'Basic Signal Flow',
  p4: 'Gain Staging',
  p5: 'Build a Static Mix',
  p6: 'Subtractive Mixing',
  p7: 'Panning & Stereo Placement',
  p8: 'Basic EQ in Context',
  p9: 'Basic Compression',
  p10: 'Reverb & Delay',
  p11: 'The Six Routing Terms',
  p12: 'Pre/Post & the Double Route',
  p13: 'Basic Automation',
  p14: 'Check & Finish',
  p15: 'Basic Export',
  p16: 'The Final Mix',
};

export const BEGINNING_MIXING_SCREEN_GUIDES: Record<string, ScreenGuide> = {
  // ── 1 · What Mixing Does ──────────────────────────────────────────────────
  p1: {
    intro: {
      learning: 'Mixing is a series of listening decisions, and each one changes one of five things: balance, frequency, pan and width, depth, or movement over time.',
      start: 'Tap each of THE FIVE DIMENSIONS and watch its line turn amber in the key under the mix picture. Then choose a focal point under YOUR FIRST DECISION.',
    },
    seeing: [
      'THE MIXER’S MANTRA sits at the top. Every page in this lab comes back to it.',
      'THE FIVE DIMENSIONS: Balance, Frequency, Pan & width, Depth and Movement. Each asks one question about your mix.',
      'In the mix picture, a track sits higher or lower by its range, left or right by its pan. It’s wider when louder and glows with reverb.',
      'Further down: YOUR FIRST DECISION (the focal point), a check, and goal chips.',
    ],
    control: [
      'Tap a dimension to read its question. Its line in the key under the picture (HEIGHT = RANGE, WIDTH = LEVEL, SIDE = PAN, GLOW = REVERB) turns amber. MOVEMENT switches the picture to the chorus.',
      'Pick a focal point: Lead vocal, The groove, A featured instrument or The atmosphere. The lab keeps your pick for later pages.',
      'Answer the check. A wrong pick tells you why, and you can choose again.',
      'On the strip under the title, ⏮ goes to the first page; ‹ PREV and NEXT › step through. Tap the readout for every page, with ✓ on the ones you’ve done. The ‹ at the top leaves the lab. “When to bring in a pro ›” opens a short note.',
    ],
    changes: [
      'MOVEMENT shows A MIX · THE CHORUS (BARS 3–4), marked LEAD +3 · BGV IN: the lead rides up and BGV enters. BGV means backing vocals, a synth pad here.',
      'Every other dimension shows A MIX · THE VERSE (BARS 1–2), marked ALL FIVE AT ONCE: a mix uses all five together.',
      'Your focal point is a commitment, not a right answer. Page 5 uses it to suggest an anchor track.',
      'Each goal chip at the foot turns ✓ as you do it.',
    ],
    teaches: [
      'Mixing is a sequence of listening decisions, not a stack of plugins.',
      'Every mix move changes one of five things: level, frequency range, left-right place, distance, or change over time.',
      'A mix needs a focal point: the part the listener follows. Many choices can work; with none, every part competes for attention.',
    ],
    tryThis: [
      'Open Balance, then MOVEMENT. In the chorus picture the LEAD shape widens, and BGV turns from a dashed outline (OFF) into a filled shape: the pad enters.',
      'Choose a focal point now. On page 5 the suggested anchor follows it: Lead vocal suggests LEAD, The groove suggests KICK.',
    ],
  },

  // ── 2 · Prepare the Session ───────────────────────────────────────────────
  p2: {
    intro: {
      learning: 'Why a mix starts before any plugin: named tracks, even clip levels, headroom and saved references make every later decision easier to hear.',
      start: 'Open Name, order, color in THE PREP CHECKLIST and watch the session window tidy itself. Then open Clip gain first and Leave headroom, and watch the lead clip and the master meter.',
    },
    seeing: [
      'THE PREP CHECKLIST: seven jobs to do before you mix, from Name, order, color to Save the untouched version.',
      'Under it, a DAW (recording software) session window tidies itself as you open each step.',
      'SEPARATE THE JOBS names recording, editing, producing, mixing and mastering, so you know which job you’re doing.',
      'Then a check about a quiet verse vocal, and goal chips.',
    ],
    control: [
      'Tap each prep step to read why it matters: Name, order, color · Remove the junk · Clip gain first · Polarity, phase, timing · Leave headroom · Pick 1–2 references · Save the untouched version.',
      'Answer the check below the cards.',
    ],
    changes: [
      'Name, order, color: Audio_07 and Audio_02 become KICK and SNARE, each track in its own color.',
      'Remove the junk: the duplicate track with a cough clip disappears.',
      'Clip gain first: the lead’s verse clip sits 9 dB under its chorus clip. It’s lifted to match.',
      'Leave headroom: the master meter falls from −0.2 to −6 dBFS. Pick 1–2 references: REF 1 and REF 2 appear, muted.',
    ],
    teaches: [
      'Organizing a session solves problems before mixing starts, so you don’t fight them later with plugins.',
      'Clip gain changes the level of the recording itself, so every stage after it receives a steadier signal.',
      'Headroom is the space left before clipping, under 0 dBFS, the digital ceiling. You keep it from the start.',
      'A reference is a finished track you trust, used to check your mix’s balance and tone.',
    ],
    tryThis: [
      'Open Leave headroom and watch the master meter in the drawing drop from −0.2 to −6 dBFS.',
      'Open Clip gain first and find the LEAD row (still called Audio_11 until you open Name, order, color). Its quiet verse clip grows to match the chorus clip.',
    ],
  },

  // ── 3 · Basic Signal Flow ─────────────────────────────────────────────────
  p3: {
    intro: {
      learning: 'Audio passes through a channel’s stations in a set order, and each station’s job tells you where it has to sit.',
      start: 'Read each card in THE EIGHT STATIONS and what that station does. Then tap the station buttons in the order you think audio travels, from source to output.',
    },
    seeing: [
      'THE EIGHT STATIONS — STUDY THEM (ORDER HIDDEN): each station of a channel and its job, shuffled on purpose.',
      'Under NOW BUILD THE PATH, the stations are drawn as gear, titled THE PARTS — YOUR ORDER SO FAR. A line below spells out your order with arrows.',
      'Once you solve it, THE CANONICAL PATH — YOURS NOW appears, numbered, and the drawing becomes THE PATH — SIGNAL ORDER.',
    ],
    control: [
      'Tap the station buttons in the order audio travels, from source to output. Each station you place turns ✓ and grays out.',
      'RESET clears your order so you can start again. It switches off once the path is solved.',
    ],
    changes: [
      'After your eighth tap, the page checks your order.',
      'If it’s right, you get a ✓ line and the numbered path appears below.',
      'If not, the “Not yet” line names one station that sits too early, the station it must come after, and that station’s job. Think it through, then tap RESET.',
    ],
    teaches: [
      'Audio moves through a channel in a set order, and every later page in this lab builds on it.',
      'A station’s job tells you where it belongs: it can only work on a signal that already exists before it.',
      'This is the usual DAW channel order. Some desks and DAWs let you move parts of it, so check the one you use.',
    ],
    tryThis: [
      'Before tapping, read each station’s line and ask: what must already exist for this one to do its job?',
      'Get one wrong on purpose and read the “Not yet” line. It names the exact pair that is out of order.',
    ],
  },

  // ── 4 · Gain Staging ──────────────────────────────────────────────────────
  p4: {
    intro: {
      learning: 'Why headroom matters when tracks add together, and why the louder of two mixes usually sounds better until you match their levels.',
      start: 'Read the WHY HEADROOM meters: 2 AT ONCE, then 4 AT ONCE. Then play ▶ MIX A and ▶ MIX B and vote before you look at any numbers.',
    },
    seeing: [
      'WHY HEADROOM: peak meters in dBFS. 2 AT ONCE shows two identical −6 dB peaks landing together, AT 0 dBFS; 4 AT ONCE shows four, CLIPPED.',
      'MIX A and MIX B read PLAY IT until you play them. Then MIX A reads MEASURED and MIX B shows how many dB louder it is.',
      'A OR B — BLIND: you vote on two mixes, then B, MATCHED is revealed.',
      'Then a check about a mix bus peaking near zero, and goal chips.',
    ],
    control: [
      '▶ MIX A and ▶ MIX B play each mix; tap again (■) to stop. RENDERING THE MIX shows while the audio gets ready.',
      'Once both have played, vote: A SOUNDS BETTER, B SOUNDS BETTER or THEY’RE THE SAME.',
      'After your vote, ▶ B, MATCHED plays B turned down to A’s measured loudness. Then answer the check.',
    ],
    changes: [
      'Peaks that line up add: two −6 dB peaks reach 0.0 dB, and four reach +6.0 dB, past the ceiling.',
      'Your vote reveals what makes A and B differ, and why the louder one usually feels better.',
      'B, MATCHED is turned down by the measured RMS (average level) difference, so you can finally judge A and B fairly.',
    ],
    teaches: [
      'Headroom, the space between your peaks and the 0 dBFS ceiling, matters more than any one number on a meter.',
      'Louder tends to sound better, so match the level before you compare any two versions.',
      'Peaks that land at the same moment add, so tracks that are fine alone can clip together.',
    ],
    tryThis: [
      'Vote on sound alone before you look at the meters. Then play ▶ B, MATCHED against ▶ MIX A. Does your vote still stand?',
      'Read the left ladders: one −6 dB track is fine, 2 AT ONCE reaches 0 dBFS, and 4 AT ONCE is CLIPPED.',
    ],
  },

  // ── 5 · Build a Static Mix ────────────────────────────────────────────────
  p5: {
    intro: {
      learning: 'Why a mix starts with balance: you choose an anchor, then set faders, pan, mute and polarity before any plugin, and judge it at matched level.',
      start: 'Play ▶ THE WALL to hear every track at the same level. Pick an anchor under STEP 2, then pull the other faders down around it on the console.',
    },
    seeing: [
      'STEP 1 — HEAR THE PROBLEM: THE WALL plays every track at the same level; MY MIX plays your console.',
      'STEP 2 — COMMIT TO AN ANCHOR: your page 1 focal point, the anchor it suggests, and eight track buttons.',
      'STEP 3 — BUILD AROUND IT: the mix picture over an eight-channel console (8 CHANNELS — SWIPE →). LEAD and BGV are synth stand-ins for the vocals.',
      'Then CHECK IT LIKE A MIXER, and goal chips.',
    ],
    control: [
      '▶ THE WALL and ▶ MY MIX play each version. MY MIX is level-matched to the wall.',
      'Tap a track to make it your anchor: KICK, SNARE, PERC, BASS, GTR, KEYS, LEAD or BGV.',
      'Each channel strip, top to bottom: Ø (polarity flip), the PAN pot (reads C, L… or R…), MUTE, the fader (−∞ to +12 dB), then the name tape. Tap the tape to solo that channel.',
      'Swipe the console sideways to reach every channel. RESET MIX puts every channel back to flat.',
    ],
    changes: [
      'The picture follows the console: wider is louder, sideways is panned, dashed is muted, Ø means polarity flipped. Its title goes from THE WALL · EVERY FADER AT 0 to YOUR BALANCE.',
      'Your anchor is ringed and named: ANCHOR: LEAD, for example.',
      'Soloed tapes glow and the rest go quiet. Drop solo and your exact mix comes back.',
      'MY MIX is matched to the wall, so you hear your decisions, not a change in loudness.',
    ],
    teaches: [
      'Balance comes first: faders, pan, mute and polarity before any plugin.',
      'A suggested starting point: set the anchor, then bring in parts in order of importance, each placed against what’s already there.',
      'Two habits help: compare against where you started, and check the balance at low volume.',
    ],
    tryThis: [
      'Play ▶ THE WALL and pick an anchor. Then pull every other fader down to taste and watch the other shapes narrow around the ringed one.',
      'Mute KEYS: its shape turns dashed in the picture. Shape five tracks to complete the third goal chip.',
    ],
  },

  // ── 6 · Subtractive Mixing ────────────────────────────────────────────────
  p6: {
    intro: {
      learning: 'How taking something away, a part, some level, a frequency range or some reverb, can clear room for the lead, and why one problem can have several right answers.',
      start: 'Read SIX WAYS TO SUBTRACT. Then, under the picture of THE CROWDED CHORUS, tap each move, watch the picture change, and read its verdict.',
    },
    seeing: [
      'SIX WAYS TO SUBTRACT: Arrangement, Level, Frequency, Processing, Space and Automation subtraction.',
      'DECIDE — THE CROWDED CHORUS: keys, guitar and the backing pad (BGV) sustain around the lead.',
      'In the chorus picture the lead is ringed; keys, guitar and pad are bright, the rhythm section faint. Six move buttons sit below, each with a verdict once tried.',
      'Then THE HONEST CORRECTION card, a check, and goal chips.',
    ],
    control: [
      'Tap each of the six ways in the list to read its one-line idea.',
      'Under the chorus picture, tap a move to try it on THE CROWDED CHORUS. Its verdict appears beside it.',
      'Answer the check below.',
    ],
    changes: [
      'The picture retitles to AFTER: plus the move’s name. Arrangement mutes the backing pad, Level lowers the three sustains by 5 dB, Frequency cuts keys and guitar at 1.2 kHz, Space dries their reverb.',
      'Processing and Automation leave the chorus as it was: the picture says NOTHING CHANGES HERE.',
      'A move that fits this problem turns ✓; one that doesn’t is marked, with the reason.',
    ],
    teaches: [
      'Often the strongest move is to take something away, not add something.',
      'Each subtraction works on one of the five dimensions from page 1.',
      'Cutting with EQ isn’t automatically better than boosting: find the problem first, then make the smallest change.',
      'Several moves can be right at once; mixing problems usually have more than one answer.',
    ],
    tryThis: [
      'Try Arrangement subtraction: the BGV shape turns dashed (muted) and the lead has room around it.',
      'Try Processing subtraction: the picture reads NOTHING CHANGES HERE. Read its verdict to find out why.',
    ],
  },

  // ── 7 · Panning & Stereo Placement ────────────────────────────────────────
  p7: {
    intro: {
      learning: 'How panning shares out the space between left and right, which parts usually anchor the center, and why a mix must survive mono.',
      start: 'Pan GTR left and KEYS right on the console and watch their shapes slide. Then press ▶ STEREO and ▶ MONO FOLD to hear your placement both ways.',
    },
    seeing: [
      'PLACE THE SESSION: the mix picture, titled YOUR PLACEMENT, over a console with PAN pots and MUTE. There are no faders here.',
      'A warning line appears under the console when a pan moves the mix’s spine (kick, bass or lead) off center.',
      'THE MONO TEST: STEREO and MONO FOLD.',
      'Then a check about kick and bass, and goal chips.',
    ],
    control: [
      'Turn a channel’s PAN pot left or right. It reads C at center, up to L100 or R100. Tap the left or right half of a pot to step it by 25; double-tap returns it to C. MUTE silences the channel.',
      '▶ STEREO and ▶ MONO FOLD play your placement both ways, level-matched. The picture follows the button you press.',
      'Swipe the console sideways to reach every channel.',
    ],
    changes: [
      'Each shape slides sideways as you pan it.',
      'Pan KICK or BASS past L25 or R25 and a warning explains that off-center low end unbalances the sides and shifts level in mono.',
      'Pan LEAD that far and the warning says your focal anchor now pulls the image off balance.',
      'MONO FOLD pulls every part to the center; dashed outlines mark where each sat in stereo.',
    ],
    teaches: [
      'Pan is space to share: supporting parts go to the sides, and the spine stays near the center.',
      'A suggested starting point, not a rule: kick, bass and the focal part at or near center, with similar parts mirrored left and right.',
      'Many phones, smart speakers and venue systems play in mono, so a wide placement has to survive the fold.',
    ],
    tryThis: [
      'Pan GTR left, KEYS right and PERC a little right: three supporting parts off center, no warnings, and the first goal chip turns ✓.',
      'Pan BASS hard left and read the warning line. Then press ▶ MONO FOLD and watch it slide back to the center.',
    ],
  },

  // ── 8 · Basic EQ in Context ───────────────────────────────────────────────
  p8: {
    intro: {
      learning: 'When two parts fight in the same frequency range, EQ is one fix among several, and every EQ move is judged in the mix, not alone.',
      start: 'Play ▶ THE CLASH and hear the guitar step on the lead. Then play each of the five fixes and read the trade-off named under the picture.',
    },
    seeing: [
      'THE PROBLEM — LISTEN FIRST: THE CLASH, guitar stabs playing in the same range as the lead line.',
      'FIVE LEGITIMATE FIXES: LEVEL, PAN, EQ, FILTER and ARRANGEMENT, each level-matched to the clash.',
      'The mix picture shows LEAD, GTR and KEYS. For EQ and FILTER, an EQ curve appears with WHERE THE LEAD PLAYS shaded.',
      'Then TWO HABITS THAT KEEP EQ HONEST, OPEN THE EQ LAB, a check, and goal chips.',
    ],
    control: [
      '▶ THE CLASH plays the problem.',
      '▶ LEVEL, ▶ PAN, ▶ EQ, ▶ FILTER and ▶ ARRANGEMENT play each fix. The picture follows the one you press.',
      'OPEN THE EQ LAB takes you to the EQ Lab. Answer the check below.',
    ],
    changes: [
      'THE CLASH · GTR +4 dB ON THE LEAD: the guitar sits hot and centered, on top of the lead.',
      'LEVEL lowers the guitar; PAN splits guitar left and keys right; ARRANGEMENT mutes the guitar.',
      'EQ draws a 6 dB cut at 2.6 kHz on GTR EQ, inside the lead’s range. FILTER draws a 350 Hz high-pass on GTR HPF, just inside the low edge of the lead’s range.',
      'The line under the picture names the last fix heard and what it costs.',
    ],
    teaches: [
      'In a mix, EQ is about making parts fit together, not making each sound good alone.',
      'EQ is only one fix for a frequency fight. Level, pan and arrangement can solve it too.',
      'Judge EQ in the mix, and ask whether a boost really fixed the tone or just made the part louder.',
    ],
    tryThis: [
      'Play ▶ THE CLASH, then ▶ EQ: the curve shows the 6 dB dip at 2.6 kHz sitting inside WHERE THE LEAD PLAYS.',
      'Play ▶ FILTER: the curve rolls off below 350 Hz, just inside the low edge of WHERE THE LEAD PLAYS. It’s subtle here, as its note says.',
    ],
  },

  // ── 9 · Basic Compression ─────────────────────────────────────────────────
  p9: {
    intro: {
      learning: 'A compressor works like an automatic fader: attack decides whether the front of a hit gets through, and only a level-matched comparison tells you if it helped.',
      start: 'Tap THRESHOLD, RATIO, ATTACK, RELEASE and MAKEUP GAIN to read what each does. Then play ▶ FAST ATTACK and ▶ SLOW ATTACK and compare the front of the amber hit with the gray one.',
    },
    seeing: [
      'THE FIVE PARAMETERS: THRESHOLD, RATIO, ATTACK, RELEASE and MAKEUP GAIN.',
      'HEAR THE ENVELOPE CHANGE: the snare alone, three ways, level-matched. The envelope is how a hit rises and falls over time.',
      'The compressor drawing: its knobs for the version you play, ONE REAL SNARE HIT, DRY (gray) against compressed (amber), and the gain it applies.',
      'Then THE HONEST COMPARISON RULE, a check, and goal chips.',
    ],
    control: [
      'Tap each parameter to read what it does.',
      '▶ NO COMP, ▶ FAST ATTACK and ▶ SLOW ATTACK play the snare. The drawing follows the button you press.',
      'Answer the check below.',
    ],
    changes: [
      'FAST and SLOW share threshold −30 dB, ratio 6:1 and release 90 ms. Only ATTACK differs: 0.4 ms against 30 ms.',
      'Fast attack clamps the front of the hit, so the crack is flattened. Slow attack lets the first crack through before the gain comes down on the body.',
      'The gain line dips as the compressor turns the snare down. Its label gives the deepest dip: GAIN, dB — DOWN … dB AT MOST.',
    ],
    teaches: [
      'A compressor is an automatic fader. Attack sets how fast it grabs the front of a note; release sets how fast it lets go after.',
      'Ratio sets how firmly it turns down; attack sets what gets caught.',
      'Compare with and without compression at matched loudness. Makeup gain alone makes the compressed version louder, and louder can fool you.',
    ],
    tryThis: [
      'Play ▶ FAST ATTACK, then ▶ SLOW ATTACK, and compare the front of the amber hit with the gray one each time.',
      'Press ▶ NO COMP: the drawing shows no compressor at work. Which attack you prefer depends on the song.',
    ],
  },

  // ── 10 · Reverb & Delay ───────────────────────────────────────────────────
  p10: {
    intro: {
      learning: 'How reverb and delay create depth, and what one shared reverb fed by sends does to a band.',
      start: 'Play ▶ BONE DRY, then ▶ ONE SHARED ROOM, then ▶ DROWNED. Watch the green send knobs in the drawing change while the plate reverb stays the same.',
    },
    seeing: [
      'THE DEPTH VOCABULARY: dry/wet, pre-delay, decay, and delays locked to the tempo.',
      'ONE ROOM GLUES THE BAND: five channel strips, each with a green send knob, wired to one plate reverb return.',
      'Three versions to play, level-matched: BONE DRY, ONE SHARED ROOM and DROWNED.',
      'Then a check about shared reverb, and goal chips.',
    ],
    control: [
      '▶ BONE DRY, ▶ ONE SHARED ROOM and ▶ DROWNED play each version. The drawing follows the one you press.',
      'Answer the check below.',
    ],
    changes: [
      'BONE DRY: the drawing reads NO SENDS: EVERY PART BONE DRY.',
      'ONE SHARED ROOM: four sends (lead −10, snare −12, guitar −14, backing pad −12 dB) feed one plate; KEYS stays dry.',
      'DROWNED: five sends near full level (0 to +2 dB) feed the same plate. Depth everywhere is depth nowhere.',
    ],
    teaches: [
      'Reverb and delay answer the depth question: what sounds close, and what sounds far.',
      'A suggested starting point: one shared space fed by sends glues the parts together, and each dry track keeps its own level.',
      'When reverb sits on a return fed by sends, it’s usually set 100% wet. Each send sets how much of that part goes into the room.',
    ],
    tryThis: [
      'Play ▶ ONE SHARED ROOM, then ▶ DROWNED: it’s the same plate, and only the send levels changed.',
      'Play ▶ BONE DRY, then ▶ ONE SHARED ROOM, and listen for the parts starting to sound like one place.',
    ],
  },

  // ── 11 · The Six Routing Terms ────────────────────────────────────────────
  p11: {
    intro: {
      learning: 'What bus, subgroup, aux send / return, control group, VCA / DCA and stem each mean, sorted by whether audio flows through them or only control.',
      start: 'Under WHAT EACH ONE ACTUALLY DOES, tap Subgroup, then VCA / DCA, and compare the two paths the drawing lights up.',
    },
    seeing: [
      'WHAT EACH ONE ACTUALLY DOES: Bus, Subgroup, Aux send / return, Control group, VCA / DCA and Stem.',
      'The drawing shows three drum strips, a DRUMS subgroup, an FX return, a VCA, a control group and a stem file.',
      'Until you open a term, it reads OPEN A TERM TO LIGHT ITS PATH.',
      'Then a check comparing a subgroup with a VCA, and goal chips.',
    ],
    control: [
      'Tap each term to read its purpose and whether audio flows through it.',
      'The drawing lights the path of the last term you opened.',
      'Answer the check below.',
    ],
    changes: [
      'Each term tells you what it carries: audio flows through it, control only, no audio through the group itself, or a delivered file.',
      'The drawing lights that term’s path, from BUS — ANY PATH THAT CARRIES AUDIO ON through to STEM — THE GROUP BOUNCED TO A FILE.',
    ],
    teaches: [
      'These six routing words are often mixed up. Sort them by what travels: audio, or only control.',
      'Shared processing needs a path where the audio actually adds together.',
      'A stem is a rendered file, not another name for a bus.',
    ],
    tryThis: [
      'Open Subgroup, then VCA / DCA, and compare the lit paths: one carries the drums’ audio, the other only a dashed control line.',
      'Open Stem last: its line says it’s a delivered file, not a live path.',
    ],
  },

  // ── 12 · Pre/Post & the Double Route ──────────────────────────────────────
  p12: {
    intro: {
      learning: 'A send is a copy of a channel’s signal, and whether it’s tapped before or after the fader decides if it follows that fader.',
      start: 'Tap FADER: 0 dB to pull the lead fader all the way down. Read which destination goes SILENT and which keeps receiving.',
    },
    seeing: [
      'PRE VS POST, WHERE IT MATTERS: the lead channel feeds a REVERB (post-fader) and the SINGER’S HEADPHONES (pre-fader).',
      'A line under the drawing shows REVERB (post) and HEADPHONES (pre), each receiving or SILENT.',
      'THE DOUBLE-ROUTING CASE: a lead that is louder than its fader says it should be.',
      'Then a check about headphones fed before the fader, and goal chips.',
    ],
    control: [
      'FADER: 0 dB switches the lead fader to FADER: PULLED (−∞), and back.',
      'In the case, answer THE FADER IS BROKEN or TWO LIVE PATHS TO THE MIX.',
      'Answer the check below.',
    ],
    changes: [
      'At 0 dB, both destinations read receiving.',
      'Pulled: a send tapped after the fader follows it down; one tapped before the fader ignores it. The drawing and the line show which is which.',
      'In the case, the right answer draws the routing that explains the symptom; the other answer points you back to the clue.',
    ],
    teaches: [
      'A send is a copy, and where it’s tapped decides whether it follows the fader.',
      'Cue mixes (what performers hear) are usually pre-fader, and effects post-fader. Conventions vary by desk, so check yours.',
      'A level that ignores its fader often means a second live path to the mix.',
    ],
    tryThis: [
      'Tap FADER: 0 dB to pull it, and read which destination goes SILENT and which keeps receiving.',
      'Before answering the case, reread its clue: “pulling the fader halfway barely changes it.”',
    ],
  },

  // ── 13 · Basic Automation ─────────────────────────────────────────────────
  p13: {
    intro: {
      learning: 'How automation makes a mix move from verse to chorus, and what makes one section feel bigger than another.',
      start: 'Pick LIFT +6 and read the LEAD lane at the chorus. Then play ▶ STATIC and ▶ AUTOMATED and listen to how the chorus arrives.',
    },
    seeing: [
      'THE MOVES: rides, mutes, pan moves, send lifts and delay throws. A ride is a fader move that follows the song.',
      'VERSE → CHORUS, TWO WAYS: STATIC and AUTOMATED versions of the demo balance.',
      'Automation lanes for LEAD, BGV and PERC, split into VERSE · BARS 1–2 and CHORUS · BARS 3–4.',
      'Then a check about a chorus that must feel bigger, and goal chips.',
    ],
    control: [
      'LIFT +1, LIFT +3 (where it starts) or LIFT +6 sets how far the lead rides up in the chorus.',
      '▶ STATIC and ▶ AUTOMATED play each version, level-matched overall.',
      'Answer the check below.',
    ],
    changes: [
      'The LEAD lane steps up from 0 dB to your lift at the chorus: ▲ +1, ▲ +3 or ▲ +6 dB.',
      'BGV goes from −∞ to +8 dB (▲ ENTERS); PERC goes from −4 to 0 dB (▲ +4 dB).',
      'The two versions are matched overall, so what you hear is contrast, not loudness: +1 is barely a lift, +6 is an event.',
    ],
    teaches: [
      'Movement, how the mix changes from section to section, is made with automation.',
      'Rides, mutes and sends that follow the song tell its story; they aren’t corrections.',
      'Bigness is relative: a smaller verse makes the same chorus feel larger.',
    ],
    tryThis: [
      'Pick LIFT +6 and read the LEAD lane: it steps up by ▲ +6 dB at the chorus. Then play ▶ AUTOMATED.',
      'Pick LIFT +1 and play ▶ AUTOMATED again: the lead’s lift is barely heard, though the pad still enters.',
    ],
  },

  // ── 14 · Check & Finish ───────────────────────────────────────────────────
  p14: {
    intro: {
      learning: 'A mix is finished only after simple checks: matched comparisons, quiet listening, mono, other playback systems, and ears that have had a rest.',
      start: 'Tap each habit in THE FINISHING HABITS to read why it matters. Then play ▶ THE MIX and ▶ IN MONO and watch which parts move.',
    },
    seeing: [
      'THE FINISHING HABITS: six checks, from Bypass-compare, matched to Take breaks.',
      'RUN ONE NOW: THE MIX and IN MONO, with the mix picture titled THE MIX · STEREO.',
      'Then a check about tired ears, and goal chips.',
    ],
    control: [
      'Tap each habit to read why it matters.',
      '▶ THE MIX and ▶ IN MONO play the demo balance, level-matched. The picture follows the button you press.',
      'Answer the check below.',
    ],
    changes: [
      'IN MONO retitles the picture THE MIX · FOLDED TO MONO: every part moves to the center, with dashed outlines where it sat in stereo.',
      'Hard-panned parts and wide effects change the most when the mix folds to mono.',
    ],
    teaches: [
      'A mix is finished only after checks: matched bypass, matched references, quiet listening, mono, several playback systems and breaks.',
      'Ears tire over a long session, so knowing when not to decide is part of finishing.',
      'In mono, parts that sat apart on the sides now share the center, so a balance that worked in stereo can change.',
    ],
    tryThis: [
      'Play ▶ THE MIX, then ▶ IN MONO: watch GTR and KEYS slide from the sides to the center.',
      'Open Listen QUIETLY, then turn your own volume all the way down while THE MIX plays. Does the lead still lead?',
    ],
  },

  // ── 15 · Basic Export ─────────────────────────────────────────────────────
  p15: {
    intro: {
      learning: 'How an export is set and checked: sample rate and bit depth, when dither is needed, a file name you can find later, and listening to the bounce.',
      start: 'Choose a SAMPLE RATE and a BIT DEPTH and watch the bounce dialog fill in. Then tap the BUILD button and RUN THE INSPECTION.',
    },
    seeing: [
      'FORMAT — MATCH THE SESSION, DELIVER WHAT’S ASKED: SAMPLE RATE and BIT DEPTH choices.',
      'NAME IT LIKE YOU MEAN TO FIND IT: a builder for the file name.',
      'INSPECT THE BOUNCE — ALWAYS: a bounce dialog (FILE NAME, FORMAT, SAMPLE RATE, BIT DEPTH, DITHER) that fills in as you choose. A bounce is the exported mix file.',
      'Then a check about a bounce that stops early, and goal chips.',
    ],
    control: [
      'SAMPLE RATE: 44.1 kHz or 48 kHz (session rate). BIT DEPTH: 16-BIT or 24-BIT.',
      'BUILD: OurSong_Mix_v3_2026-09-11.wav builds the file name.',
      'RUN THE INSPECTION checks the start, the end, clipping, the length and any missing parts.',
      'Answer the check below.',
    ],
    changes: [
      '48 kHz with 24-BIT: “Session rate, 24-bit — the no-surprises default”. Any other pair is fine when a delivery spec asks for it.',
      '16-BIT turns DITHER ON: a faint noise added when cutting to 16 bits, so the rounding error becomes soft hiss, not grit.',
      'The dialog swaps final_FINAL_2.wav for your built name, and the inspection lists what was checked.',
    ],
    teaches: [
      'A suggested default: export at the session’s sample rate and 24-bit unless a client’s spec says otherwise.',
      'A file name carries the song, the version and the date, so you can find the right file later.',
      'You open and check every export: start, end, clipping, length and parts.',
    ],
    tryThis: [
      'Choose 16-BIT and read the dither reminder; then choose 24-BIT and it goes away.',
      'Watch the bounce dialog’s FILE NAME change when you tap the BUILD button.',
    ],
  },

  // ── 16 · The Final Mix ────────────────────────────────────────────────────
  p16: {
    intro: {
      learning: 'The whole mixing process in order, and how a mix is judged: against where it started, at matched level, and in mono.',
      start: 'Read THE PROCESS, then shape a balance on YOUR CONSOLE around your anchor. Play ▶ WHERE YOU STARTED against ▶ YOUR MIX to hear what you changed.',
    },
    seeing: [
      'THE MIXER’S MANTRA again, then THE PROCESS: eight steps from 1 · Organize to 8 · Export & inspect.',
      'YOUR CONSOLE: all eight channels, starting flat.',
      'LISTEN — THEN CALL IT: the mix picture and three versions, WHERE YOU STARTED, YOUR MIX and YOURS, MONO.',
      'One goal chip: Complete all eight steps.',
    ],
    control: [
      'Steps 1 and 8 are on your honor: tap them once you’ve done them in your own session.',
      'Tap step 3 once you’ve cleared a masking fight, where one part hides another. This console has faders, pan, MUTE and Ø, but no EQ.',
      'Each channel has Ø, PAN, MUTE, a fader and the solo tape. RESET MIX goes back to flat.',
      '▶ WHERE YOU STARTED, ▶ YOUR MIX and ▶ YOURS, MONO play each version, all matched. The picture follows the one you press.',
    ],
    changes: [
      'Step 2 turns ✓ on its own once five tracks are shaped.',
      'Steps 4–6 turn ✓ when you play YOUR MIX: it adds a lead compressor (3:1), the shared plate (lead and snare sends) and a +3 dB chorus ride on the lead.',
      'Step 7 turns ✓ once YOURS, MONO has played. When all eight are ✓, WHERE TO GO DEEPER appears.',
    ],
    teaches: [
      'The whole process once, in order: organize, balance, fix masking, compress, share a space, automate, check mono, export.',
      'A mix is judged against where it started, at matched level, and in mono.',
      'Masking can often be cleared without EQ, using level, pan and mute alone.',
    ],
    tryThis: [
      'Shape five tracks on YOUR CONSOLE: step 2 turns ✓. Then play ▶ YOUR MIX: steps 4, 5 and 6 turn ✓.',
      'Play ▶ YOURS, MONO and check that your anchor still leads with everything folded to the center.',
    ],
  },
};

/**
 * The what's-left END screen (PagedLab `endGuide`, titled WHERE YOU ARE).
 * Written against what PagedLab + LabEndScreen draw for THIS lab: credit mode
 * (it passes pageCreditKeys, so rows read ✓ CREDITED; ✓ DONE for a guest or a
 * members-only preview), noun "page", sixteen pages and no check row (the
 * "Pass the check" goal chips sit on the pages), every unfinished row carrying
 * HANDS_ON_DETAIL (every page is manualDone and counts only through its goal
 * chips — useVisitGoals), PRACTICE AGAIN FROM THE START = page 1 and clears
 * nothing, DONE · BACK TO LABS = safeGoBack (the screen the lab was opened
 * from). Pinned by test/screenGuide_mixing-beg_20261031.test.ts.
 */
export const BEGINNING_MIXING_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'The mixing process as one ordered path, from preparing a session to exporting it, and which of its steps you’ve already heard and tried for yourself.',
    start: 'Read the pages still listed under WHAT\'S LEFT and tap one to jump to it. To revisit a finished page, tap REVIEW ▾ on the ✓ line.',
  },
  seeing: [
    'The title reads WHAT\'S LEFT, or LAB COMPLETE once every page is done.',
    'Each page still to do is listed: it counts once the goals at the foot of the page are done; NEXT moves on without counting it.',
    'Finished pages fold into one ✓ CREDITED line (✓ DONE if you aren’t signed in, or in a members-only preview). If your progress can’t load, the title reads YOUR PROGRESS and every page stays open.',
  ],
  control: [
    'Tap any page that’s still listed to jump straight to it.',
    'Tap REVIEW ▾ on the ✓ line to see your finished pages, then tap one to open it again. HIDE ▴ folds them away.',
    'PRACTICE AGAIN FROM THE START opens page 1, What Mixing Does, and clears nothing.',
    'DONE · BACK TO LABS takes you back to the screen you opened the lab from.',
    '‹ PREV on the strip returns to the page you came from. WHAT\'S LEFT in the strip opens CONTENTS.',
  ],
  changes: [
    'A page counts only when every goal chip at its foot shows ✓. On most pages one chip is Pass the check. NEXT and FINISH move on without counting it.',
    'As a member, each credited page stays with your account, and practicing again never removes it. A members-only preview saves nothing.',
    'START OVER (PRACTICE) in CONTENTS clears the page marks on this device for a fresh run. Credit you’ve already earned stays.',
  ],
  teaches: [
    'This lab suggests one order for a mix: prepare the session, know the signal path, keep headroom, balance, then subtract, pan, EQ, compress, add space, route, automate, check and export.',
    'Each step builds on the ones before it: EQ and compression choices are easier to judge on top of a balance you’ve already built, at matched level.',
  ],
  tryThis: [
    'Still have pages listed? Open one and scroll to the goal chips at its foot. Those chips are what make the page count.',
    'Tap REVIEW ▾ and reopen a finished page to practice. Its ✓ here stays, whatever you do there.',
  ],
};

/** PagedLab's `pageGuide`: page index (0-based) → that page's guide. The
 *  what's-left screen uses BEGINNING_MIXING_END_GUIDE instead (`endGuide`). */
export function beginningMixingPageGuide(index: number): ScreenGuide | undefined {
  return BEGINNING_MIXING_SCREEN_GUIDES[`p${index + 1}`];
}

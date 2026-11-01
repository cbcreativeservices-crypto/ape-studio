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
    seeing: [
      'The first page. THE MIXER’S MANTRA sits on top: the sentence every page comes back to.',
      'THE FIVE DIMENSIONS: Balance, Frequency, Pan & width, Depth and Movement, each with its question.',
      'The mix picture: every track drawn up the page by the range it plays in, across by its pan, wide by its level, glowing by its reverb.',
      'YOUR FIRST DECISION (the focal point), a check, and goal chips at the foot.',
    ],
    control: [
      'Tap a dimension to open its question; its line in the key under the picture (HEIGHT = RANGE, WIDTH = LEVEL, SIDE = PAN, GLOW = REVERB) turns amber. MOVEMENT switches the picture to the chorus.',
      'Tap a focal point: Lead vocal, The groove, A featured instrument or The atmosphere. Your pick is kept for later pages.',
      'Answer the check; a wrong pick explains itself and you can choose again.',
      'The strip under the title: ⏮ (first page), ‹ PREV, the readout (tap it for the list of every page, ✓ when done), NEXT ›. The ‹ at the top leaves the lab. “When to bring in a pro ›” opens a short note.',
    ],
    changes: [
      'MOVEMENT redraws the picture as A MIX · THE CHORUS (BARS 3–4), marked LEAD +3 · BGV IN: the lead rides up and the backing pad enters.',
      'Every other dimension shows A MIX · THE VERSE (BARS 1–2), marked ALL FIVE AT ONCE.',
      'The focal point is a commitment, not a right answer: page 5 uses it to suggest an anchor track.',
      'Each goal chip turns ✓ when done; with all three ✓ the page counts.',
    ],
    teaches: [
      'Mixing is a sequence of listening decisions, not a stack of plugins.',
      'Every mix decision changes one of five things: level, frequency range, left-right place, distance, or change over time.',
      'A mix serves a focal point. It fails only when nobody chose one.',
      'The lab runs from preparing a session to exporting it, then a guided final mix.',
    ],
    tryThis: [
      'Open Balance, then MOVEMENT: in the chorus picture the LEAD shape widens, and BGV turns from a dashed outline (OFF) into a filled shape — the pad enters.',
      'Choose a focal point now. On page 5 the anchor suggestion follows it — Lead vocal suggests LEAD, The groove suggests KICK.',
    ],
  },

  // ── 2 · Prepare the Session ───────────────────────────────────────────────
  p2: {
    seeing: [
      'THE PREP CHECKLIST: seven steps, from Name, order, color to Save the untouched version.',
      'Under it, a DAW session window that tidies itself as you open each step.',
      'SEPARATE THE JOBS: recording, editing, producing, mixing and mastering, each named.',
      'A check about a quiet verse vocal, and goal chips at the foot.',
    ],
    control: [
      'Tap each prep step to open why it matters: Name, order, color · Remove the junk · Clip gain first · Polarity, phase, timing · Leave headroom · Pick 1–2 references · Save the untouched version.',
      'Answer the check below the cards.',
    ],
    changes: [
      'Name, order, color: Audio_07 and Audio_02 become KICK and SNARE, each track in its own color.',
      'Remove the junk: the duplicate track with a cough clip disappears.',
      'Clip gain first: the lead’s verse clip, 9 dB under its chorus clip, is lifted to match.',
      'Leave headroom: the master meter falls from −0.2 to −6 dBFS. Pick 1–2 references: REF 1 and REF 2 appear, muted.',
    ],
    teaches: [
      'Organization problems are solved before mixing, not fought later with plugins.',
      'Clip gain levels the recording itself, so every later stage sees a steady signal.',
      'Headroom is space below the ceiling, kept from the start.',
      'Next: the path audio takes through one channel (page 3).',
    ],
    tryThis: [
      'Open Leave headroom and watch the master meter in the drawing drop from −0.2 to −6 dBFS.',
      'Open Clip gain first and find the LEAD row (still called Audio_11 until you open Name, order, color): its quiet verse clip grows to match the chorus clip.',
    ],
  },

  // ── 3 · Basic Signal Flow ─────────────────────────────────────────────────
  p3: {
    seeing: [
      'THE EIGHT STATIONS — STUDY THEM (ORDER HIDDEN): each station of a channel with what it does, shuffled.',
      'NOW BUILD THE PATH: the stations drawn as gear, titled THE PARTS — YOUR ORDER SO FAR.',
      'A line under the drawing spells your order with arrows as you build it.',
      'Once solved: THE CANONICAL PATH — YOURS NOW, numbered, and the drawing retitles to THE PATH — SIGNAL ORDER.',
    ],
    control: [
      'Tap the station buttons in the order audio travels, from source to output. A placed station turns ✓ and greys out.',
      'RESET clears your order and starts again (it is off once the path is solved).',
    ],
    changes: [
      'After the eighth tap the page checks your order.',
      'Right: a ✓ line, and the numbered path appears below.',
      'Not yet: the page names one station that sits too early and the one it must come after — with that station’s job — so you can reason it out and RESET.',
    ],
    teaches: [
      'Audio flows through a channel in a set order, and every later page leans on it.',
      'Each station’s job tells you where it must sit: work it out from what it DOES.',
      'This is the DAW channel model: some desks and DAWs let you reorder parts of it, so check the one you use.',
    ],
    tryThis: [
      'Before tapping, read each station’s line and ask: what must already exist for this one to do its job?',
      'Get one wrong on purpose and read the “Not yet” line: it names the exact pair that is out of order.',
    ],
  },

  // ── 4 · Gain Staging ──────────────────────────────────────────────────────
  p4: {
    seeing: [
      'WHY HEADROOM: peak meters in dBFS. 2 AT ONCE shows two identical −6 dB peaks landing together, AT 0 dBFS; 4 AT ONCE shows four, CLIPPED.',
      'MIX A and MIX B read PLAY IT until the mixes render, then fill in: MIX A reads MEASURED and MIX B shows how many dB louder it is.',
      'A OR B — BLIND: two mixes to vote on, then a reveal with B, MATCHED.',
      'A check about a mix bus peaking near zero, and goal chips.',
    ],
    control: [
      '▶ MIX A and ▶ MIX B play each render (tap again, shown ■, to stop). RENDERING THE MIX shows while the real audio is prepared.',
      'After both have played, vote: A SOUNDS BETTER, B SOUNDS BETTER or THEY’RE THE SAME.',
      'After the vote, ▶ B, MATCHED plays B pulled to A’s measured loudness. Then answer the check.',
    ],
    changes: [
      'Correlated peaks add: two −6 dB peaks reach 0.0 dB, four reach +6.0 dB — past the ceiling.',
      'The vote reveals what makes A and B differ, and why louder usually feels better.',
      'B, MATCHED is turned down by the measured RMS difference, so A and B can finally be judged fairly.',
    ],
    teaches: [
      'Headroom — space between your peaks and the ceiling — matters more than any one number.',
      'Loudness biases judgment, so every comparison that changes level is matched first.',
      'Every comparison in this lab is level-matched by measured RMS before you judge it.',
    ],
    tryThis: [
      'Vote on sound alone before you look at the meters, then play B, MATCHED against MIX A.',
      'Read the left ladders: one −6 dB track is fine, 2 AT ONCE reaches 0 dBFS, 4 AT ONCE is CLIPPED.',
    ],
  },

  // ── 5 · Build a Static Mix ────────────────────────────────────────────────
  p5: {
    seeing: [
      'STEP 1 — HEAR THE PROBLEM: THE WALL (every track at the same level) and MY MIX (your console).',
      'STEP 2 — COMMIT TO AN ANCHOR: your page 1 focal point and the anchor it suggests, then eight track buttons.',
      'STEP 3 — BUILD AROUND IT: the mix picture over an eight-channel console (8 CHANNELS — SWIPE →).',
      'CHECK IT LIKE A MIXER, and goal chips at the foot.',
    ],
    control: [
      '▶ THE WALL and ▶ MY MIX play each render; MY MIX is level-matched to the wall.',
      'Tap a track to make it your anchor: KICK, SNARE, PERC, BASS, GTR, KEYS, LEAD or BGV.',
      'Each channel strip, top to bottom: Ø (polarity), the PAN pot (reads C, L… or R…), MUTE, the fader (−∞ to +12 dB), and the name tape at the foot — tap the tape to solo that channel.',
      'Swipe the console sideways to reach every channel. RESET MIX puts every channel back to flat.',
    ],
    changes: [
      'The picture follows the console: wider = louder, sideways = panned, dashed = muted. Its title goes from THE WALL · EVERY FADER AT 0 to YOUR BALANCE.',
      'Your anchor is ringed and named: ANCHOR: LEAD, for example.',
      'Soloed tapes glow; the rest are silenced in the render only, so dropping solo returns the exact mix.',
      'MY MIX is matched to the wall, so what you hear is decisions, not loudness.',
    ],
    teaches: [
      'Balance first: faders, pan, mute and polarity before any plugin.',
      'A suggested starting point: set the anchor, then add parts in order of importance, each placed against what is there.',
      'Two habits: compare against where you started, and check balance at low volume.',
      'LEAD and BGV are synth stand-ins for the vocal parts.',
    ],
    tryThis: [
      'Play THE WALL, pick an anchor, then pull every other fader down to taste: watch the other shapes narrow around the ringed one.',
      'Mute KEYS: its shape turns dashed in the picture. Shape five tracks to complete the third goal chip.',
    ],
  },

  // ── 6 · Subtractive Mixing ────────────────────────────────────────────────
  p6: {
    seeing: [
      'SIX WAYS TO SUBTRACT: Arrangement, Level, Frequency, Processing, Space and Automation subtraction.',
      'DECIDE — THE CROWDED CHORUS: keys, guitar and backing pad sustaining around the lead.',
      'The chorus picture (lead ringed; keys, guitar and pad bright, the rhythm section faint) and six move buttons, each with its verdict once tried.',
      'THE HONEST CORRECTION card, a check, and goal chips.',
    ],
    control: [
      'Tap each of the six moves in the list to open its one-line idea.',
      'Under the chorus picture, tap a move to try it on THE CROWDED CHORUS; its verdict appears beside it.',
      'Answer the check below.',
    ],
    changes: [
      'The picture retitles AFTER: (the move) and redraws: Arrangement mutes the backing pad, Level lowers the three sustains by 5 dB, Frequency cuts keys and guitar at 1.2 kHz, Space dries their reverb.',
      'Processing and Automation leave it as it was: the picture says NOTHING CHANGES HERE.',
      'A move that fits this problem turns ✓; one that does not is marked — with the reason.',
    ],
    teaches: [
      'Often the strongest question is what to take away, not what to add.',
      'Each subtraction works on one of the five dimensions.',
      'Subtractive EQ is not automatically better than a boost: find the problem, then make the smallest change.',
      'Several moves can be right at once; mixing problems usually have more than one answer.',
    ],
    tryThis: [
      'Try Arrangement subtraction: the BGV shape turns dashed (muted) and the lead has room around it.',
      'Try Processing subtraction: the picture reads NOTHING CHANGES HERE. Read its verdict to see why.',
    ],
  },

  // ── 7 · Panning & Stereo Placement ────────────────────────────────────────
  p7: {
    seeing: [
      'PLACE THE SESSION: the mix picture titled YOUR PLACEMENT, over a console with PAN pots and MUTE (no faders here).',
      'Warning lines appear under the console when a pan puts the mix’s spine off-center.',
      'THE MONO TEST: STEREO and MONO FOLD.',
      'A check about kick and bass, and goal chips.',
    ],
    control: [
      'Turn a channel’s PAN pot left or right: it reads C at center, up to L100 or R100. Tap the left or right half of a pot to step it 25; double-tap returns it to C. MUTE silences the channel.',
      '▶ STEREO and ▶ MONO FOLD play your placement both ways, level-matched; the picture follows the button you press.',
      'Swipe the console sideways to reach every channel.',
    ],
    changes: [
      'Each shape slides sideways as you pan it.',
      'KICK or BASS panned past L25 or R25: a warning that off-center low end unbalances the sides and shifts level in mono. LEAD that far off-center: a warning that the focal anchor destabilizes the image.',
      'MONO FOLD pulls every part to the center; dashed outlines mark where each sat in stereo.',
    ],
    teaches: [
      'Pan is real estate: the sides are for supporting parts, the spine stays near center.',
      'A suggested starting point, not a law: kick, bass and the focal element at or near center; mirror similar parts left and right.',
      'Much of the world hears mono, so wide placement must survive the fold.',
    ],
    tryThis: [
      'Pan GTR left, KEYS right and PERC a little right: three supports off-center, no warnings — the first goal chip turns ✓.',
      'Pan BASS hard left and read the warning line, then press ▶ MONO FOLD and watch it slide back to the center.',
    ],
  },

  // ── 8 · Basic EQ in Context ───────────────────────────────────────────────
  p8: {
    seeing: [
      'THE PROBLEM — LISTEN FIRST: THE CLASH, guitar stabs and the lead line in the same range.',
      'FIVE LEGITIMATE FIXES: LEVEL, PAN, EQ, FILTER and ARRANGEMENT, each level-matched to the clash.',
      'A mix picture of LEAD, GTR and KEYS; for EQ and FILTER an EQ curve with WHERE THE LEAD PLAYS shaded.',
      'TWO HABITS THAT KEEP EQ HONEST, OPEN THE EQ LAB, a check, and goal chips.',
    ],
    control: [
      '▶ THE CLASH plays the problem.',
      '▶ LEVEL, ▶ PAN, ▶ EQ, ▶ FILTER, ▶ ARRANGEMENT play each fix; the picture follows the one you press.',
      'OPEN THE EQ LAB leaves for the EQ Lab. Answer the check below.',
    ],
    changes: [
      'THE CLASH · GTR +4 dB ON THE LEAD: the guitar sits hot and centered.',
      'LEVEL lowers the guitar; PAN splits guitar left and keys right; ARRANGEMENT mutes the guitar.',
      'EQ draws a 6 dB cut at 2.6 kHz on GTR EQ, inside the lead’s range. FILTER draws a 350 Hz high-pass on GTR HPF, just inside the low edge of the lead’s range.',
      'The line under the picture names the last fix heard and its trade-off.',
    ],
    teaches: [
      'In a mix, EQ is about making parts fit, not sound good alone.',
      'An EQ move is only one of several fixes for a frequency fight — level, pan and arrangement count too.',
      'Judge EQ in context, and ask whether a boost fixed the tone or just made it louder.',
    ],
    tryThis: [
      'Play THE CLASH, then ▶ EQ: the plot shows the 6 dB dip at 2.6 kHz sitting inside WHERE THE LEAD PLAYS.',
      'Play ▶ FILTER: the curve rolls off below 350 Hz, just inside the low edge of WHERE THE LEAD PLAYS — subtle here, as its note says.',
    ],
  },

  // ── 9 · Basic Compression ─────────────────────────────────────────────────
  p9: {
    seeing: [
      'THE FIVE PARAMETERS: THRESHOLD, RATIO, ATTACK, RELEASE and MAKEUP GAIN.',
      'HEAR THE ENVELOPE CHANGE: the snare alone, three ways, level-matched.',
      'The compressor drawing: its knobs at that render’s settings, ONE REAL SNARE HIT, DRY (gray) against compressed (amber), and the gain it applies.',
      'THE HONEST COMPARISON RULE, a check, and goal chips.',
    ],
    control: [
      'Tap each parameter to open what it does.',
      '▶ NO COMP, ▶ FAST ATTACK and ▶ SLOW ATTACK play the snare; the drawing follows the button you press.',
      'Answer the check below.',
    ],
    changes: [
      'FAST and SLOW share threshold −30 dB, ratio 6:1 and release 90 ms; only ATTACK differs: 0.4 ms against 30 ms.',
      'Fast attack clamps the front of the hit, so the crack is flattened; slow attack lets the first crack through before the gain comes down on the body.',
      'The gain line reads GAIN, dB — DOWN (its deepest dip) dB AT MOST.',
    ],
    teaches: [
      'A compressor is an automatic fader: it shapes the front (attack) and tail (release) of every note.',
      'Ratio sets how firmly; attack sets what gets caught.',
      'Compare with and without compression at matched loudness; makeup gain alone can fool you.',
    ],
    tryThis: [
      'Play FAST ATTACK, then SLOW ATTACK, and compare the front of the amber hit against the gray one in each.',
      'Press NO COMP: the drawing shows no compressor at work. Which attack you prefer depends on the song.',
    ],
  },

  // ── 10 · Reverb & Delay ───────────────────────────────────────────────────
  p10: {
    seeing: [
      'THE DEPTH VOCABULARY: dry/wet, pre-delay, decay, and tempo-locked delays.',
      'ONE ROOM GLUES THE BAND: five channel strips with a green send knob each, wired to one plate reverb return.',
      'Three renders: BONE DRY, ONE SHARED ROOM and DROWNED, level-matched.',
      'A check about shared reverb, and goal chips.',
    ],
    control: [
      '▶ BONE DRY, ▶ ONE SHARED ROOM and ▶ DROWNED play each render; the drawing follows the one you press.',
      'Answer the check below.',
    ],
    changes: [
      'BONE DRY: the drawing reads NO SENDS: EVERY PART BONE DRY.',
      'ONE SHARED ROOM: four sends (lead −10, snare −12, guitar −14, backing pad −12 dB) into one plate.',
      'DROWNED: five sends near full level (0 to +2 dB) into the same plate — depth everywhere is depth nowhere.',
    ],
    teaches: [
      'Reverb and delay answer the depth question: what is close, what is far.',
      'A suggested starting point: one shared space fed by sends glues the parts, and each dry track keeps its level.',
      'On a send-fed return the reverb runs 100 % wet; the send sets how much room.',
      'Next: the routing words behind sends and groups (page 11).',
    ],
    tryThis: [
      'Play ONE SHARED ROOM, then DROWNED: the same plate, only the send levels changed.',
      'Play BONE DRY, then ONE SHARED ROOM, and listen for the parts sounding like one place.',
    ],
  },

  // ── 11 · The Six Routing Terms ────────────────────────────────────────────
  p11: {
    seeing: [
      'WHAT EACH ONE ACTUALLY DOES: Bus, Subgroup, Aux send / return, Control group, VCA / DCA and Stem.',
      'A drawing of three drum strips, a DRUMS subgroup, an FX return, a VCA, a control group and a stem file.',
      'Until you open a term it reads OPEN A TERM TO LIGHT ITS PATH.',
      'A check comparing a subgroup and a VCA, and goal chips.',
    ],
    control: [
      'Tap each term to open its purpose and whether audio flows through it.',
      'The drawing lights the path of the last term you opened.',
      'Answer the check below.',
    ],
    changes: [
      'Each term adds one line: audio flows through it, control only, no audio through the group itself, or a delivered file.',
      'The drawing lights that term’s path: BUS — ANY PATH THAT CARRIES AUDIO ON, through STEM — THE GROUP BOUNCED TO A FILE.',
    ],
    teaches: [
      'These six words are the most confused in routing; sort them by what travels — audio, or only control.',
      'Shared processing needs a path the audio actually sums through.',
      'A stem is a rendered file, not another name for a bus.',
      'Next: where a send’s copy is tapped (page 12).',
    ],
    tryThis: [
      'Open Subgroup, then VCA / DCA, and compare the lit paths: one carries the drums’ audio, one only a dashed control line.',
      'Open Stem last: its line says it is a delivered file, not a live path.',
    ],
  },

  // ── 12 · Pre/Post & the Double Route ──────────────────────────────────────
  p12: {
    seeing: [
      'PRE VS POST, WHERE IT MATTERS: the lead channel feeding a REVERB (post-fader) and the SINGER’S HEADPHONES (pre-fader).',
      'A line under the drawing: REVERB (post) and HEADPHONES (pre), each receiving or SILENT.',
      'THE DOUBLE-ROUTING CASE: a lead that is louder than its fader says.',
      'A check about pre-fed headphones, and goal chips.',
    ],
    control: [
      'FADER: 0 dB toggles the lead fader to FADER: PULLED (−∞) and back.',
      'In the case, answer THE FADER IS BROKEN or TWO LIVE PATHS TO THE MIX.',
      'Answer the check below.',
    ],
    changes: [
      'At 0 dB both destinations read receiving.',
      'Pulled: a send tapped after the fader follows it; one tapped before ignores it. The drawing and the line show which is which.',
      'The case: the right answer draws the routing that explains the symptom; the other answer points you back to the clue.',
    ],
    teaches: [
      'A send is a copy, and where it is tapped decides whether it follows the fader.',
      'Cue mixes are usually pre-fader and effects post-fader — conventions vary by desk, so check yours.',
      'A level that ignores its fader often means a second live path.',
    ],
    tryThis: [
      'Tap FADER: 0 dB to pull it, and read which destination goes SILENT and which keeps receiving.',
      'Before answering the case, reread its clue: “pulling the fader halfway barely changes it.”',
    ],
  },

  // ── 13 · Basic Automation ─────────────────────────────────────────────────
  p13: {
    seeing: [
      'THE MOVES: rides, mutes, pan moves, send lifts and delay throws.',
      'VERSE → CHORUS, TWO WAYS: STATIC and AUTOMATED renders of the demo balance.',
      'Automation lanes for LEAD, BGV and PERC, split VERSE · BARS 1–2 and CHORUS · BARS 3–4.',
      'A check about a chorus that must feel bigger, and goal chips.',
    ],
    control: [
      'LIFT +1, LIFT +3 (the start) or LIFT +6 sets how far the lead rides up in the chorus.',
      '▶ STATIC and ▶ AUTOMATED play each render, level-matched overall.',
      'Answer the check below.',
    ],
    changes: [
      'The LEAD lane steps from 0 dB to your lift: ▲ +1, ▲ +3 or ▲ +6 dB.',
      'BGV goes from −∞ to +8 dB (▲ ENTERS); PERC goes from −4 to 0 dB (▲ +4 dB).',
      'Matched overall, what you hear is contrast, not loudness: +1 is barely a lift, +6 is an event.',
    ],
    teaches: [
      'Movement — how the mix changes from section to section — is answered with automation.',
      'Rides, mutes and sends that follow the song are storytelling, not correction.',
      'Bigness is relative: a smaller verse makes the same chorus feel larger.',
    ],
    tryThis: [
      'Pick LIFT +6 and read the LEAD lane: it steps up by ▲ +6 dB at the chorus. Then play AUTOMATED.',
      'Pick LIFT +1 and play AUTOMATED again: the lead lift is barely heard, though the pad still enters.',
    ],
  },

  // ── 14 · Check & Finish ───────────────────────────────────────────────────
  p14: {
    seeing: [
      'THE FINISHING HABITS: six checks, from Bypass-compare, matched to Take breaks.',
      'RUN ONE NOW: THE MIX and IN MONO, with the mix picture titled THE MIX · STEREO.',
      'A check about tired ears, and goal chips.',
    ],
    control: [
      'Tap each habit to open why it matters.',
      '▶ THE MIX and ▶ IN MONO play the demo balance, matched; the picture follows the button you press.',
      'Answer the check below.',
    ],
    changes: [
      'IN MONO retitles the picture THE MIX · FOLDED TO MONO: every part moves to the center, with dashed outlines where it sat in stereo.',
      'Hard-panned parts and wide effects are the ones that change most in a fold.',
    ],
    teaches: [
      '“Finished” is earned with checks: matched bypass, matched references, quiet listening, mono, several systems, breaks.',
      'Ears tire, so knowing when not to decide is part of finishing.',
      'Next: exporting the mix (page 15).',
    ],
    tryThis: [
      'Play THE MIX, then IN MONO: watch GTR and KEYS slide from the sides to the center.',
      'Open Listen QUIETLY, then turn your own volume right down while THE MIX plays: does the lead still lead?',
    ],
  },

  // ── 15 · Basic Export ─────────────────────────────────────────────────────
  p15: {
    seeing: [
      'FORMAT — MATCH THE SESSION, DELIVER WHAT’S ASKED: SAMPLE RATE and BIT DEPTH choices.',
      'NAME IT LIKE YOU MEAN TO FIND IT: a file-name builder.',
      'INSPECT THE BOUNCE — ALWAYS: a bounce dialog (FILE NAME, FORMAT, SAMPLE RATE, BIT DEPTH, DITHER) that fills in as you choose.',
      'A check about a bounce that stops early, and goal chips.',
    ],
    control: [
      'SAMPLE RATE: 44.1 kHz or 48 kHz (session rate). BIT DEPTH: 16-BIT or 24-BIT.',
      'BUILD: OurSong_Mix_v3_2026-09-11.wav builds the file name.',
      'RUN THE INSPECTION runs the start, end, clipping, length and missing-parts pass.',
      'Answer the check below.',
    ],
    changes: [
      '48 kHz with 24-BIT: “Session rate, 24-bit — the no-surprises default”. Any other pair is legitimate when a spec asks for it.',
      '16-BIT adds a reminder to dither on the way down.',
      'The dialog swaps final_FINAL_2.wav for your built name, and the inspection lists what was checked.',
    ],
    teaches: [
      'A suggested default: export at the session’s sample rate and 24-bit unless a client’s spec says otherwise.',
      'A file name carries song, version and date.',
      'Every export is opened and checked — start, end, clipping, length, parts.',
    ],
    tryThis: [
      'Choose 16-BIT and read the dither reminder; then choose 24-BIT and it goes away.',
      'Watch the bounce dialog’s FILE NAME change when you tap the BUILD button.',
    ],
  },

  // ── 16 · The Final Mix ────────────────────────────────────────────────────
  p16: {
    seeing: [
      'THE MIXER’S MANTRA again, then THE PROCESS: eight steps from 1 · Organize to 8 · Export & inspect.',
      'YOUR CONSOLE: all eight channels, starting flat.',
      'LISTEN — THEN CALL IT: the mix picture and three renders, WHERE YOU STARTED, YOUR MIX and YOURS, MONO.',
      'One goal chip: Complete all eight steps.',
    ],
    control: [
      'Steps 1 and 8 are on your honor: tap them when done in your own session. Step 3 takes a tap once you have cleared a masking fight (this console has faders, pan, MUTE and Ø, no EQ).',
      'The console: Ø, PAN, MUTE, fader and the solo tape on each channel; RESET MIX goes back to flat.',
      '▶ WHERE YOU STARTED, ▶ YOUR MIX and ▶ YOURS, MONO play each render, all matched; the picture follows the one you press.',
    ],
    changes: [
      'Step 2 ticks itself when five tracks are shaped.',
      'Steps 4–6 tick when you play YOUR MIX: the render adds a lead compressor (3:1), the shared plate (lead and snare sends) and a +3 dB chorus ride on the lead.',
      'Step 7 ticks when YOURS, MONO has played. When all eight are ✓, WHERE TO GO DEEPER appears.',
    ],
    teaches: [
      'The whole process once, in order: organize, balance, fix masking, compress, share a space, automate, check mono, export.',
      'Your mix is judged against where you started, at matched level, and in mono.',
      'Next: the Advanced Mixing lab picks up where this page ends.',
    ],
    tryThis: [
      'Shape five tracks on YOUR CONSOLE, then play YOUR MIX: steps 2, 4, 5 and 6 tick together.',
      'Play YOURS, MONO and check that your anchor still leads with everything folded to the center.',
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
  seeing: [
    "The title reads WHAT'S LEFT, or LAB COMPLETE once every page is done (credited, for a member).",
    'If progress cannot be read, it reads YOUR PROGRESS and every page stays open.',
    'A page still to do is listed with “Counts once the goals at the foot of the page are done. NEXT moves on without counting it.”',
    'Done pages fold into one ✓ CREDITED line (✓ DONE when you are not signed in, or in a members-only preview).',
  ],
  control: [
    'Tap a page that is still listed to jump straight to it.',
    'REVIEW ▾ on the ✓ line unfolds the finished pages; tap any one to open it again. HIDE ▴ folds them away.',
    'PRACTICE AGAIN FROM THE START opens page 1, What Mixing Does, and clears nothing.',
    'DONE · BACK TO LABS leaves the lab, back to the screen you opened it from.',
    "‹ PREV on the strip returns to the page you came from; WHAT'S LEFT in the strip opens CONTENTS.",
  ],
  changes: [
    'A page counts only when every goal chip at its foot turns ✓; on most pages one chip is Pass the check. NEXT and FINISH move on without counting it.',
    'As a member, each credited page is kept with your account, and a practice run never removes it. A members-only preview saves nothing.',
    'START OVER (PRACTICE) in CONTENTS clears the page marks on this device for a fresh run; credit already earned stays.',
  ],
  teaches: [
    'Which steps of the mixing process you have worked through hands-on, and which you have not met yet.',
    'The process in page order: what mixing does, prep, signal flow, gain staging, balance, subtractive mixing, panning, EQ, compression, space, routing, automation, checking, export, the final mix.',
  ],
  tryThis: [
    'A page still listed? Open it and scroll to the goal chips at its foot: they are what counts that page.',
    'Pages on the ✓ line? Tap REVIEW ▾ and reopen one for practice; its ✓ on this screen stays, whatever you do there.',
  ],
};

/** PagedLab's `pageGuide`: page index (0-based) → that page's guide. The
 *  what's-left screen uses BEGINNING_MIXING_END_GUIDE instead (`endGuide`). */
export function beginningMixingPageGuide(index: number): ScreenGuide | undefined {
  return BEGINNING_MIXING_SCREEN_GUIDES[`p${index + 1}`];
}

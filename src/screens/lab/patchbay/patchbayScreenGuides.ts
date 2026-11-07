/**
 * Patchbay Signal Flow & Normalling — "explain this screen" content (owner
 * 2026-10-31, the Screen Guide rollout; pattern: wave/waveScreenGuides.ts).
 *
 * The lab is a PagedLab with no menu of its own: the learner lands on page 1
 * from the Signal list, so page 1's guide also explains the strip. One guide
 * per page, keyed by the lab's own completion unit ids (units.ts: 'p1'…'p23',
 * 1-based page order). The what's-left END screen has its own guide,
 * PATCHBAY_END_GUIDE (PagedLab's `endGuide`, titled WHERE YOU ARE).
 *
 * Every line was written against the page's own code (pagesA–D, rackLayout,
 * art/PatchPairView, art/JackCutaway, art/StudioBayView, engine/patchbay,
 * engine/scenarios*): names are the on-screen names (bezel keys, dock labels,
 * goal chips, labels drawn on the display), and every readout quoted in TRY
 * THIS is what pairBezel / cutawayBezel / pairStatus print for that state.
 * Reorder or retitle a page → update PATCHBAY_GUIDE_PAGE_TITLES and its guide;
 * test/screenGuide_patchbay_20261031.test.ts pins both.
 *
 * STEPPED: each section is one step held to SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; claims KNOWLEDGE, never skills;
 * no gear brand names; no "N of total"; no build notes in learner text. The
 * guide never gives away a check's answer on a predict / diagnose page.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';

/** Each unit id's page title, in page order — pinned against pagesA–D. */
export const PATCHBAY_GUIDE_PAGE_TITLES: Record<string, string> = {
  p1: 'Signal falls downhill',
  p2: 'One pair, two pictures',
  p3: 'Thru: nothing is connected yet',
  p4: 'What “normal” means',
  p5: 'The switching contact',
  p6: 'Full-normal: the four states',
  p7: 'Half-normal: the surprise',
  p8: 'Why it is called HALF-normal',
  p9: 'The tap — and the side that breaks',
  p10: 'Full vs Half vs Thru — the table',
  p11: 'Predict before patching',
  p12: 'Patchbay detective',
  p13: 'The four questions, answered',
  p14: 'From one pair to a whole bay',
  p15: 'The studio works with no cables',
  p16: 'Overpatching',
  p17: 'The processor chain',
  p18: 'What’s wrong with this patch?',
  p19: 'Half-normal is directional',
  p20: 'Inside the cord: T · R · S',
  p21: 'Phantom power + patchbays',
  p22: 'Design your own bay',
  p23: 'Final proficiency assessment',
};

export const PATCHBAY_SCREEN_GUIDES: Record<string, ScreenGuide> = {
  // ── 1 · Signal falls downhill (reading) ───────────────────────────────────
  p1: {
    seeing: [
      'The first page: cards that set the one rule every bay in this lab follows.',
      'TOP ROW = SOURCES · OUTPUTS: where signal leaves gear. BOTTOM ROW = DESTINATIONS · INPUTS: where it enters.',
      '“Signal falls downhill. Top → Bottom.”, the four questions every pair asks, and THE PATCHBAY MANTRA.',
    ],
    control: [
      'Nothing to patch yet: this page is reading. Scroll it, then tap NEXT at the end.',
      'The strip under the title: ⏮ goes back to the first page, ‹ PREV and NEXT › step one page, and the readout in the middle (MODULE, with the page number and ▾) opens a list of every page. The strip calls each page a MODULE.',
      'Later pages put a display on top, readouts on its frame and controls in the dock at the bottom.',
      'Tap ⓘ beside any page’s title to have that page explained.',
    ],
    changes: [
      'Nothing moves here. This page sets the picture the rest of the lab uses.',
      'A patchbay puts outputs (signal leaving gear) in one row and inputs (signal arriving) in the row under it, so each column joins one source to one destination.',
      'Some bays are wired the other way around: the label decides, not habit.',
    ],
    teaches: [
      'What a patchbay is: every important input and output of a studio on one panel.',
      'Source over destination, and the four questions: source? destination? path with no cord? what changes when I plug in?',
      'It follows the cable and connector labs, and leads to Gain Staging.',
    ],
    tryThis: [
      'Say the mantra aloud from memory, then check it against THE PATCHBAY MANTRA card.',
      'Pick one item from each card and say which way signal moves between them: top to bottom.',
    ],
  },

  // ── 2 · One pair, two pictures (rack, thru) ───────────────────────────────
  p2: {
    seeing: [
      'ONE vertical pair. On top, a slice of the front panel; under it, the signal path.',
      'CONSOLE OUT 1 (SOURCE · OUTPUT) above the TOP jack; INTERFACE IN 1 (DESTINATION · INPUT) below the BTM jack.',
      'Marching dashes = signal flowing now. Dim dots = an inactive path. Gold = a patch cord.',
      'Readouts: TOP and BOTTOM (CORD or EMPTY), NORMAL, DEST HEARS.',
    ],
    control: [
      'TOP JACK and BOTTOM JACK keys in the dock: each puts a patch cord into that jack, or takes it out.',
      'Tapping a jack on the drawing does the same. A breathing ring marks a jack you have not used yet.',
      'HIDE DISPLAY gives the reading more room; FULL SCREEN zooms the drawing with the dock still working.',
      'Under the display, the status line spells out what is connected to what.',
    ],
    changes: [
      'NORMAL reads NONE: nothing inside the bay joins top to bottom yet (the next pages name this).',
      'A TOP cord carries CONSOLE OUT 1 out to YOUR CABLE. DEST HEARS reads NOTHING.',
      'A BOTTOM cord feeds INTERFACE IN 1 from YOUR CABLE. DEST HEARS reads PATCH.',
      'Panel and path always change together: two views of one pair.',
    ],
    teaches: [
      'The pair is the smallest unit of any patchbay: one source jack over one destination jack.',
      'How the front panel and the signal path describe the same thing.',
      'The visual language every page keeps: dashes flow, dots wait, gold is a cord.',
      'Starting with a pair that has no inside link makes the next pages’ default route easy to spot.',
    ],
    tryThis: [
      'Turn on TOP JACK only: TOP reads CORD, NORMAL stays NONE, DEST HEARS reads NOTHING.',
      'Turn TOP JACK off and BOTTOM JACK on: DEST HEARS reads PATCH. The input is fed from your cable, not the console.',
      'Tap the jacks on the drawing instead: the TOP JACK and BOTTOM JACK keys follow.',
    ],
  },

  // ── 3 · Thru: nothing is connected yet (rack, thru) ───────────────────────
  p3: {
    seeing: [
      'The same THRU pair, with NO INTERNAL CONNECTION written between the jacks.',
      'A lone top cord’s far end reads NOT PLUGGED IN: it goes nowhere. A lone bottom cord brings an ALT SOURCE.',
      'With both jacks used, one gold cord loops down: ONE CORD, TOP TO BOTTOM.',
      'Readouts: TOP, BOTTOM, NORMAL, DEST HEARS. Two goal chips sit under the status line.',
    ],
    control: [
      'TOP JACK and BOTTOM JACK in the dock, or tap the jacks on the drawing.',
      'Goal chips: SEE THE DEAD END (top only) and COMPLETE THE ROUTE (both jacks). Each is checked once you make it; both complete the page.',
      'The prompt asks you to predict where the console’s signal goes before you read the status line.',
    ],
    changes: [
      'Top only: the signal leaves on the cord and stops there. DEST HEARS reads NOTHING; there is no inside path to fall back on.',
      'Both jacks: one cord joins top to bottom, so DEST HEARS reads PATCH. The cord is the only route.',
      'NORMAL reads NONE in every state: nothing inside joins the two jacks.',
    ],
    teaches: [
      'Thru (also “non-normalled”): with no cords, nothing is connected.',
      'On a thru pair, a patch cord is the only path from top to bottom.',
      'It sets up the next page: a normal is a connection that exists before any cord.',
    ],
    tryThis: [
      'Turn on TOP JACK only: the status reads “PATCHED — CONSOLE OUT 1 goes only into the cord” and DEST HEARS reads NOTHING.',
      'Add BOTTOM JACK: the drawing shows ONE CORD, TOP TO BOTTOM, and DEST HEARS reads PATCH.',
      'Now take TOP JACK out: the bottom cord brings an ALT SOURCE. The console is out of the route.',
    ],
  },

  // ── 4 · What “normal” means (reading) ─────────────────────────────────────
  p4: {
    seeing: [
      'The same pair, now NORMALLED: signal already flows from CONSOLE OUT 1 to INTERFACE IN 1, with no patch cord anywhere.',
      'Its caption: NO PATCH CORD REQUIRED. The connection is inside the bay.',
      'A highlighted line defines the word; an UNDERSTANDING CHECK follows.',
    ],
    control: [
      'The figure is a picture on this page: nothing to plug in.',
      'Tap an answer in the UNDERSTANDING CHECK. A wrong answer explains its mistake and you try again; the right one turns green and completes the page.',
      'The answers appear in a shuffled order.',
    ],
    changes: [
      'Inside a normalled pair, a contact joins the top jack’s rear wiring to the bottom jack’s rear wiring.',
      'So the source reaches the destination with no cord: the default route exists before you touch the bay.',
    ],
    teaches: [
      'Normal: a connection that exists before you plug in a patch cable.',
      'A normal joins one vertical pair only, this source to this destination.',
      'After thru (no default), this is the default route. The next page shows the metal that makes it.',
    ],
    tryThis: [
      'Before reading the answers, say where the signal goes with no cord. Then check.',
      'Pick “Nowhere — patch cords make every connection” on purpose: the feedback points back to the THRU pair.',
    ],
  },

  // ── 5 · The switching contact (rack, cutaway) ─────────────────────────────
  p5: {
    seeing: [
      'INSIDE THE JACK — CUTAWAY: the FRONT PANEL with the plug waiting outside it (PLUG OUT), the TIP SPRING fed FROM SOURCE · REAR, the NORMAL CONTACT wired TO DESTINATION · REAR.',
      'Readouts: INSERTION, CONTACTS (TOUCHING or OPEN), NORMAL (INTACT or BROKEN).',
      'The CONCEPTUAL MODEL badge: this jack opens at 85%. It is drawn ENLARGED, ring spring not shown.',
    ],
    control: [
      'PLUG INSERTION fader in the dock, 0–100% in 1% steps: drives the plug into the jack.',
      'Goal chips: BREAK THE NORMAL (insert fully) and RESTORE IT (pull the plug back out). Restore counts only after a break; both complete the page.',
      'FULL SCREEN zooms the cutaway with the fader still in the dock.',
    ],
    changes: [
      'At rest the tip spring presses on the normal contact, so the source flows on to the destination.',
      'Late in the travel the plug’s tip lifts the spring off: CONTACTS OPEN, NORMAL BROKEN. The spring now touches the plug, so the source rides the cord.',
      'Pull the plug back and the spring returns: the normal closes. A switch, not a setting.',
    ],
    teaches: [
      'A normal is a spring contact, and a plug physically opens it.',
      'A jack with a contact that a plug opens is called a breaking jack.',
      'The next two pages show where bays put this switch: in both jacks, or in just one.',
    ],
    tryThis: [
      'Slide PLUG INSERTION to 84%: CONTACTS still read TOUCHING. One step more, at 85%, they read OPEN and NORMAL reads BROKEN.',
      'Stop at 50%: the plug is half in, yet CONTACTS read TOUCHING. The switch moves only late in the travel.',
      'Push to 100%, then back to 0%: both goal chips are checked as the normal breaks, then restores.',
    ],
  },

  // ── 6 · Full-normal: the four states (rack) ───────────────────────────────
  p6: {
    seeing: [
      'The pair, now FULL-NORMAL: a green NORMAL joins CONSOLE OUT 1 to INTERFACE IN 1.',
      'A top cord goes to an ANALYZER; a bottom cord brings a DRUM MACHINE.',
      'A ✕ with NORMAL BROKEN marks a normal held open by a plug; red means the destination was left silent.',
      'Readouts: TOP, BOTTOM, NORMAL, DEST HEARS. A caption names the state: A, B, C or D.',
    ],
    control: [
      'TOP JACK and BOTTOM JACK in the dock, or tap the jacks on the drawing.',
      'Four goal chips: A · NOTHING PATCHED, B · TOP ONLY, C · BOTTOM ONLY, D · BOTH. Visit all four to complete the page.',
    ],
    changes: [
      'A: the normal carries the source down. NORMAL INTACT, DEST HEARS SOURCE.',
      'B: a top plug opens the contact. The analyzer gets the source; the destination hears NOTHING.',
      'C: a bottom plug opens it the other way. The drum machine feeds the input (PATCH); the console dead-ends.',
      'D: two separate reroutes. The pair no longer acts as a pair.',
    ],
    teaches: [
      'Full-normal: a plug in EITHER front jack breaks the normal.',
      'Every pair has four states: nothing, top, bottom, both.',
      'On full-normal, a plug in the top jack silences the destination.',
      'Next, half-normal changes one of these four.',
    ],
    tryThis: [
      'Turn on TOP JACK only: NORMAL reads BROKEN in red and DEST HEARS reads NOTHING. The take just went silent.',
      'Swap to BOTTOM JACK only: DEST HEARS reads PATCH, and the DRUM MACHINE feeds INTERFACE IN 1.',
      'Turn both on: NORMAL stays BROKEN, DEST HEARS stays PATCH, and the analyzer still gets the console on its own cord.',
    ],
  },

  // ── 7 · Half-normal: the surprise (rack, predict first) ───────────────────
  p7: {
    seeing: [
      'The same pair and labels, now HALF-NORMALLED. It starts exactly like full-normal: NORMAL INTACT, DEST HEARS SOURCE.',
      'Below the status: PREDICT BEFORE PATCHING and two goal chips.',
      'The dock stays empty and the jacks do nothing until your prediction is in.',
    ],
    control: [
      'Answer PREDICT BEFORE PATCHING. The right answer unlocks TOP JACK and BOTTOM JACK, in the dock and on the drawing.',
      'Goal chips: PREDICT IT (answer below) and THEN DO IT (patch the top). Both complete the page.',
      'A wrong answer explains itself, and you try again.',
    ],
    changes: [
      'Once your prediction is in, patch the TOP and read NORMAL and DEST HEARS: they show whether this bay’s top jack opens the normal.',
      'The status line names the result in its first words: SPLIT (one source feeding two places) or NORMAL BROKEN.',
      'Test the BOTTOM jack the same way: a plug there brings the DRUM MACHINE.',
    ],
    teaches: [
      'Which jack of a half-normal pair opens the normal, found by predicting first and then testing.',
      'A prediction made before patching catches a surprise before it reaches a session.',
      'The next pages name what you find here and put it to use.',
    ],
    tryThis: [
      'After answering, turn on TOP JACK and read NORMAL, DEST HEARS and the status line: did INTERFACE IN 1 keep its signal?',
      'Turn TOP JACK off and BOTTOM JACK on: NORMAL reads BROKEN and DEST HEARS reads PATCH.',
      'Compare with full-normal on the last page, where TOP JACK alone made DEST HEARS read NOTHING.',
    ],
  },

  // ── 8 · Why it is called HALF-normal (reading) ────────────────────────────
  p8: {
    seeing: [
      'A scoreboard card. FULL-NORMAL: top insert breaks, bottom insert breaks. HALF-NORMAL (COMMON BAY): top does not break, bottom breaks.',
      'A short explanation, then an UNDERSTANDING CHECK.',
    ],
    control: [
      'Tap an answer: the top front jack, the bottom front jack, both, or neither. The order is shuffled.',
      'A wrong answer explains why; the right one completes the page.',
    ],
    changes: [
      'The name counts the sides that break. Full: both. Half: only one, half of the pair.',
      'The non-breaking top makes the top jack a tap. The breaking bottom still lets you replace a destination’s source.',
    ],
    teaches: [
      'Why “half-normal” is called that.',
      'Half-normal is directional: a later page shows a rarer bay that breaks on the top, so always verify a bay.',
      'Next, the tap page puts the non-breaking top to work; then the table brings everything together.',
    ],
    tryThis: [
      'Before answering, picture the last page: you patched the top mid-flow. Did INTERFACE IN 1 lose its signal?',
      'Pick “Both” on purpose and read the feedback.',
    ],
  },

  // ── 9 · The tap — and the side that breaks (rack, half) ───────────────────
  p9: {
    seeing: [
      'The half-normal pair: CONSOLE OUT 1 recording into INTERFACE IN 1. A top cord feeds an ANALYZER; a bottom cord brings a DRUM MACHINE.',
      'Readouts: TOP, BOTTOM, NORMAL, DEST HEARS. Below: two goal chips and a card of words for the top-jack trick.',
    ],
    control: [
      'TOP JACK and BOTTOM JACK in the dock, or tap the jacks on the drawing.',
      'Goal chips: TAP THE MIX (top only — nothing interrupted) and REPLACE THE SOURCE (bottom — normal breaks). Both complete the page.',
      'The prompt asks you to predict what the bottom plug did to the console’s signal before you read the readout.',
    ],
    changes: [
      'Top cord: the normal stays closed. The recording keeps running and the analyzer gets a copy (SPLIT).',
      'Bottom cord: the contact opens. The drum machine takes over INTERFACE IN 1, and the console’s signal stops at its jack.',
    ],
    teaches: [
      'Tap, split, monitor feed: one move, a copy taken without interrupting.',
      'A MULT is a separate group of jacks wired together, used to copy one signal to several places.',
      'A PARALLEL pair has no switch, so a cord in either jack takes a copy; patching a second source into it would clash.',
      'Half-normal still breaks on the bottom, the jack that replaces a source.',
    ],
    tryThis: [
      'Turn on TOP JACK: DEST HEARS stays SOURCE and the status reads SPLIT. The take never stopped.',
      'Turn TOP JACK off and BOTTOM JACK on: NORMAL reads BROKEN and DEST HEARS reads PATCH. CONSOLE OUT 1 no longer reaches the interface.',
    ],
  },

  // ── 10 · Full vs Half vs Thru — the table (reading) ───────────────────────
  p10: {
    seeing: [
      'One table of everything so far: ACTION down the side; FULL, HALF (COMMON) and THRU across the top.',
      'Rows: no front cables, plug into TOP, plug into BOTTOM, tap without interrupting, default connection.',
      'Then a note on rarer bays, an UNDERSTANDING CHECK and THE PATCHBAY MANTRA.',
    ],
    control: [
      'Read the table, then answer the check about feeding a tuner. Wrong answers explain; the right one completes the page.',
      'Come back any time: tap the readout in the middle of the strip (MODULE, with ▾) on any page and pick this page from the list.',
    ],
    changes: [
      'The three wirings differ in one thing only: when the normal survives a plug.',
      'Thru: never, because no normal exists. Full: only with both jacks empty. Half (common): until the bottom jack is used.',
    ],
    teaches: [
      'Full, half and thru side by side, in one reference to come back to.',
      'Of these three wirings, only half-normal taps a source without interrupting it.',
      '“Through” and “non-normalled” are other names for thru.',
      'Next: predicting, then diagnosing unlabeled bays.',
    ],
    tryThis: [
      'Cover the HALF (COMMON) column, say each answer, then uncover it to check.',
      'Find the rows where FULL and HALF (COMMON) disagree. They are the same difference, said twice.',
    ],
  },

  // ── 11 · Predict before patching (reading) ────────────────────────────────
  p11: {
    seeing: [
      'Four PREDICT cards. Each describes one pair, its wiring and one plug going in, and asks what happens.',
      'After a right answer, that pair’s signal path appears under it: “Here is why — read the path.”',
    ],
    control: [
      'Tap an answer on each card. Wrong answers explain themselves; try again.',
      'The answers are shuffled. Solve all four to complete the page.',
    ],
    changes: [
      'Each answer follows the same switching rules as the earlier pages.',
      'The path drawing shows why: dashes where signal flows, a ✕ where a normal is held open, gold for your cable.',
      'Read the drawing before moving on.',
    ],
    teaches: [
      'Any patch’s result follows from two facts: the pair’s wiring and which jack takes the plug.',
      'All three wirings and both jacks, mixed together.',
      'It prepares the detective page, where you work backwards from results.',
    ],
    tryThis: [
      'On each card, name the wiring and the jack first, then recall that row of the table page.',
      'On a wrong pick, read the feedback before trying again: it explains what your answer missed.',
    ],
  },

  // ── 12 · Patchbay detective (reading) ─────────────────────────────────────
  p12: {
    seeing: [
      'Three CASE cards: an unlabeled pair, then the result of each test, marked ▸.',
      'Under each case, YOUR VERDICT: Full-normal, Half-normal or Thru.',
    ],
    control: [
      'Read the tests, then tap a verdict. A wrong one points at the test that rules it out.',
      'Solve all three cases to complete the page.',
    ],
    changes: [
      'Each test is one fact about the pair. Signal with no cords tells you a normal exists; what a top plug does tells the two normalled wirings apart.',
      'Every case is built so only one verdict fits all its tests.',
    ],
    teaches: [
      'A bay’s wiring shows in what it does, even with no label to read.',
      'Two tests tell the three wirings apart: no cords shows whether a normal exists; a top plug separates full from half.',
      'Next, the wrap-up answers the four questions from the first page.',
    ],
    tryThis: [
      'Before each verdict, rule out wirings one test at a time.',
      'Pick a wrong verdict on purpose and see which test the feedback points to.',
    ],
  },

  // ── 13 · The four questions, answered (reading) ───────────────────────────
  p13: {
    seeing: [
      'The four questions from the first page, answered in one card.',
      'THE PATCHBAY MANTRA, SOURCES BEHIND THIS LAB, and PART TWO STARTS ON THE NEXT PAGE.',
    ],
    control: [
      'Nothing to patch or answer: read, then NEXT moves on to part two and counts this page.',
    ],
    changes: [
      'Nothing changes here. It gathers part one: source on top, destination below, the normal, and what each plug does.',
    ],
    teaches: [
      'The four questions for any vertical pair, and their answers for full, half and thru.',
      'Part one ends here; part two moves from one pair to a whole studio bay.',
    ],
    tryThis: [
      'Cover the card and answer the four questions aloud for a half-normal pair, then check.',
      'For a full-normal pair, say what a bottom plug does; then check it against answer 4 on the card.',
    ],
  },

  // ── 14 · From one pair to a whole bay (rack, 8-pair bay) ──────────────────
  p14: {
    seeing: [
      'The first eight pairs of a 24-pair studio bay. The selected column has a cyan outline and is drawn again below as a signal path.',
      'Readouts: PAIR (its number, HALF or THRU), NORMAL, DEST HEARS.',
      'Below: the row legend, the status line and three goal chips.',
    ],
    control: [
      'PAIR fader in the dock: ride it through 01–08, or tap it for the list of pairs by name. Tapping a column on the bay selects it too.',
      'TOP JACK and BOTTOM JACK patch the selected pair. A newly selected pair starts with empty jacks.',
      'Goal chips: VISIT 4 PAIRS, FIND THE 2 THRU PAIRS, PATCH SOMETHING. All three complete the page.',
    ],
    changes: [
      'Every column follows the rules you know. 01–06 are half-normal: with empty jacks, NORMAL reads INTACT.',
      '07 and 08, the compressor and EQ pairs, are THRU: NORMAL reads NONE and DEST HEARS reads NOTHING.',
      'A cord patched below shows as a gold stub on its column.',
    ],
    teaches: [
      'A whole bay is many single pairs, each with its own wiring.',
      'A common layout: recording, mic pres and monitoring on half-normal pairs; processor pairs THRU.',
      'Next: why that layout runs a studio with no cords.',
    ],
    tryThis: [
      'Ride PAIR to 07: PAIR reads 07 THRU, NORMAL reads NONE, DEST HEARS reads NOTHING.',
      'On 05 (INTERFACE OUT 1 → MONITOR CTRL L), turn on TOP JACK: DEST HEARS stays SOURCE. A tap, as on the common bay.',
      'Patch a jack, then pick another pair: its jacks start empty and the gold stub leaves the bay.',
    ],
  },

  // ── 15 · The studio works with no cables (rack, bay) ──────────────────────
  p15: {
    seeing: [
      'The 8-pair studio bay with not one cord in it.',
      'Readouts: PAIRS 8, FRONT CORDS 0, NORMALS (HIDDEN or SHOWN).',
      'Below: the row legend, a statement card and an UNDERSTANDING CHECK.',
    ],
    control: [
      'SHOW THE INVISIBLE NORMALS switch in the dock: draws the connections inside the bay, or hides them.',
      'Answer the check. The page completes once you have the right answer AND have shown the normals at least once.',
    ],
    changes: [
      'Shown, pairs 01–06 light a flowing line between their jacks: their normals, carrying each default route.',
      'Pairs 07 and 08 show the word THRU instead: no inside connection.',
      'The routing itself never changes. The switch only reveals what was already there.',
    ],
    teaches: [
      'A well-designed normalled bay runs its everyday signal path with zero front cords.',
      'Patch cords exist to CHANGE the default routing, not to make it.',
      'Next comes the word for that change: overpatch.',
    ],
    tryThis: [
      'Turn SHOW THE INVISIBLE NORMALS on: NORMALS reads SHOWN; six columns show a flowing line and two read THRU.',
      'With the normals shown, look at FRONT CORDS: it still reads 0.',
    ],
  },

  // ── 16 · Overpatching (rack, half) ────────────────────────────────────────
  p16: {
    seeing: [
      'The half-normal pair again: CONSOLE OUT 1 over INTERFACE IN 1. A bottom cord brings SYNTH (SOURCE C).',
      'A card defines NORMAL PATH and OVERPATCH. Readouts: TOP, BOTTOM, NORMAL, DEST HEARS.',
      'Under the status: a caption and one goal chip.',
    ],
    control: [
      'TOP JACK and BOTTOM JACK in the dock, or tap the jacks on the drawing.',
      'Goal chip: OVERPATCH IT (patch the bottom). It completes the page.',
    ],
    changes: [
      'No cords: the NORMAL PATH. A (the console) feeds B (the interface) automatically.',
      'Bottom cord: the contact opens and C (the synth) feeds B. The normal path is on hold until the cord comes out.',
      'A top cord alone is a tap: B keeps hearing A.',
    ],
    teaches: [
      'Normal path: the connection made with an empty bay. Overpatch: a cord that changes it.',
      'How engineers say it: the tape returns are normalled to the monitor path; overpatch line 3 if you need the drum machine.',
      'Next: overpatching to put a processor into a path.',
    ],
    tryThis: [
      'Turn on BOTTOM JACK: the caption reads OVERPATCHED, NORMAL reads BROKEN, DEST HEARS reads PATCH.',
      'Turn BOTTOM JACK off again: NORMAL reads INTACT. The normal path returns by itself.',
    ],
  },

  // ── 17 · The processor chain (rack, two pairs) ────────────────────────────
  p17: {
    seeing: [
      'One pair on the display at a time. VOCAL PAIR: VOCAL OUT over CONSOLE IN 2, half-normal. PROCESSOR PAIR: COMPRESSOR OUT over COMPRESSOR IN, thru.',
      'Cords are numbered ① SEND and ② RETURN.',
      'Readouts: COMPRESSOR (IN or BYPASSED), then NORMAL and DEST HEARS for the pair in view.',
    ],
    control: [
      'INSERT COMPRESSOR switch: patches both cords at once, or pulls both (bypass).',
      'VIEW key: VOCAL PAIR or PROCESSOR PAIR on the display. Both pairs’ status lines stay in the text below the display.',
      'Goal chips: INSERT THE COMPRESSOR, BYPASS IT AGAIN, SERVICE CALL (answer below). All three complete the page.',
    ],
    changes: [
      'Inserted: ① SEND taps the vocal at the top, with no break. ② RETURN enters the bottom and breaks the normal, so the console hears the compressor.',
      'The processor pair is THRU: its cords carry the vocal in and the result out.',
      'Bypassed: no cords, so the vocal’s own normal runs straight to the console.',
    ],
    teaches: [
      'The insert chain: VOCAL OUT → ① → compressor → ② → CONSOLE IN 2.',
      'Bypass means pulling the cords: the normal restores the direct path.',
      'Why processor pairs stay THRU: the next page’s first call shows the danger.',
    ],
    tryThis: [
      'Turn INSERT COMPRESSOR on: COMPRESSOR reads IN, NORMAL reads BROKEN, DEST HEARS reads PATCH on the vocal pair.',
      'With it off, set VIEW to PROCESSOR PAIR: NORMAL reads NONE and DEST HEARS reads NOTHING. The compressor waits.',
      'The SERVICE CALL pulls one cord, which the switch cannot do: work it out in your head. Ask which jack’s plug was holding the normal open.',
    ],
  },

  // ── 18 · What’s wrong with this patch? (reading) ──────────────────────────
  p18: {
    seeing: [
      'Four service calls, each a CALL card with a title and a situation.',
      'Three of them show the pair as a signal path. Under each, YOUR DIAGNOSIS asks what went wrong.',
    ],
    control: [
      'Tap a diagnosis for each call. Wrong answers point at the evidence and you try again.',
      'Solve all four calls to complete the page.',
    ],
    changes: [
      'Each fault comes from misreading a configuration or the direction rule.',
      'The drawings show the patch exactly as it stands: dashes where signal flows, a ✕ where a normal is held open.',
    ],
    teaches: [
      'How a bay’s wiring and a patch’s direction explain a fault, read from the symptoms and the drawing.',
      'Every fault here follows the rules of the earlier pages: nothing new, only applied.',
      'Next: a bay that breaks on the top.',
    ],
    tryThis: [
      'On “The re-wired compressor”, trace the drawn path with a finger before answering: where does the output arrive?',
      'On “Nothing happens”, name the KIND of jack at each end of the cord before answering.',
    ],
  },

  // ── 19 · Half-normal is directional (rack, top-breaking) ──────────────────
  p19: {
    seeing: [
      'A half-normal pair that breaks on the TOP: TAPE OUT 1 over CONSOLE TAPE RTN 1, outputs still on top.',
      'A top cord goes to YOUR CABLE; a bottom cord brings an ALT SOURCE.',
      'Readouts: TOP, BOTTOM, NORMAL, DEST HEARS. Below: two goal chips and THE RULE THAT TRAVELS.',
    ],
    control: [
      'TOP JACK and BOTTOM JACK in the dock, or tap the jacks on the drawing.',
      'Goal chips: BREAK IT FROM THE TOP and SEE THE CLASH (bottom on this bay). Both complete the page.',
    ],
    changes: [
      'Top cord: this bay breaks on top, so the normal opens and the tape return hears NOTHING.',
      'Bottom cord alone: the normal stays closed AND your patch feeds the same input. That is a CLASH: two outputs wired together, not a mix.',
      'The clash happens because this bay’s input jack does not break.',
    ],
    teaches: [
      '“Half-normal” alone does not say which side breaks.',
      'On a well-wired half-normal pair, the INPUT jack breaks and the output jack taps.',
      'On an unfamiliar bay, verify: the label, the manual, or a quick detective test.',
    ],
    tryThis: [
      'Turn on TOP JACK only: NORMAL reads BROKEN and DEST HEARS reads NOTHING, both in red.',
      'Turn TOP JACK off and BOTTOM JACK on: DEST HEARS reads CLASH, and the status names two outputs driving CONSOLE TAPE RTN 1.',
      'Compare with the common bay on the tap page, where the top jack was the harmless one.',
    ],
  },

  // ── 20 · Inside the cord: T · R · S (rack, cutaway) ───────────────────────
  p20: {
    seeing: [
      'The jack cutaway again, the plug starting 90% in. Past 30%, its metal bands are labeled T, R and S.',
      'Readouts: INSERTION, CONTACTS, NORMAL. The CONCEPTUAL MODEL badge sits under the drawing.',
      'Below: a T · R · S card and an UNDERSTANDING CHECK.',
    ],
    control: [
      'PLUG INSERTION fader, 0–100%: moves the plug in and out.',
      'Answer the check to complete the page.',
    ],
    changes: [
      'TIP and RING carry the balanced signal pair; SLEEVE is the shield/ground.',
      'Only the TIP spring is drawn. Real bays give the RING its own spring and contact, switched by the same plug; the sleeve is most often wired straight through.',
      'The contacts still open at 85%.',
    ],
    teaches: [
      'Every “one line” in this lab is one balanced circuit: three conductors.',
      'A ¼-inch TRS patch plug fits this bay. TT (bantam) is a smaller family that does not fit a ¼-inch jack.',
      'Next: something else those conductors can carry, phantom power.',
    ],
    tryThis: [
      'Pull PLUG INSERTION back from 90% to 84%: CONTACTS read TOUCHING, NORMAL INTACT. On a real jack the RING’s own contact closes too: both legs of the balanced pair return together.',
      'Push to 100%: CONTACTS read OPEN, NORMAL reads BROKEN. Find T, R and S on the plug: three conductors, one balanced line.',
    ],
  },

  // ── 21 · Phantom power + patchbays (reading) ──────────────────────────────
  p21: {
    seeing: [
      'Phantom power is +48 V sent down a mic cable to power condenser mics.',
      'A warning card, ⚠ PHANTOM POWER + PATCHBAYS: five points about mic-level circuits carrying +48 V.',
      'A note on what the warning does NOT say, then an UNDERSTANDING CHECK.',
    ],
    control: [
      'Read, then answer the check about re-patching a mic line with phantom on. The right answer completes the page.',
    ],
    changes: [
      'As a plug slides in or out, its tip, ring and sleeve briefly touch the wrong contacts. With +48 V on the line, that makes a sudden spike: a loud pop in the speakers, and it can harm the preamp’s input and some mics (ribbons especially).',
      'Bays handle grounding differently, so not every TRS or TT bay suits mic circuits.',
    ],
    teaches: [
      'Mic-level circuits with phantom need proper system design, not improvisation.',
      'Phantom off (wait a few seconds for it to drain) and the channel down before patching mic-level points.',
      'Mics can live on a patchbay when the system is built for it.',
      'Next: you choose how a bay is wired.',
    ],
    tryThis: [
      'Before answering, say the safe order aloud: phantom off, channel down, then patch.',
      'Pick “Patch quickly so the transient is short” on purpose and read why speed does not help.',
    ],
  },

  // ── 22 · Design your own bay (reading) ────────────────────────────────────
  p22: {
    seeing: [
      'Six pair cards, each a job: CONSOLE DIRECT OUT 1 → INTERFACE INPUT 1 (recording), playback, a compressor, a mic pre, a SPARE PAIR (future gear) and the monitor feed.',
      'Each card has three buttons: FULL-NORMAL, HALF-NORMAL, THRU. A count of settled pairs sits at the bottom.',
    ],
    control: [
      'Tap a configuration on each card to read its consequence. ✓ means the pick suits the job (its note may still name a tradeoff); △ means it does not suit it.',
      'Several cards accept more than one answer. A card settles on its first ✓ and stays open to explore.',
      'Settle all six to complete the page.',
    ],
    changes: [
      'Each pick shows the tradeoff for that job: a default route, a free tap, or a surprise waiting.',
      'The processor and spare pairs accept only THRU: a normal there would loop a processor or connect unknown gear.',
    ],
    teaches: [
      'A pair’s wiring follows from its job, not from definitions.',
      'Half-normal suits daily paths you sometimes tap; thru suits processors and spares.',
      'Next: the final proficiency assessment.',
    ],
    tryThis: [
      'On CONSOLE DIRECT OUT 1 → INTERFACE INPUT 1, try all three: HALF-NORMAL ✓, FULL-NORMAL ✓ with a cost, THRU △.',
      'On COMPRESSOR OUT → COMPRESSOR IN, pick HALF-NORMAL first and read why it fails.',
    ],
  },

  // ── 23 · Final proficiency assessment (reading) ───────────────────────────
  p23: {
    seeing: [
      'Ten working-studio scenarios, each with a heading such as IDENTIFY THE CONFIGURATION or SPOT THE HAZARD.',
      'Some show the pair’s path once solved: “Confirmed — read the path.”',
      'A solved count, LAB COMPLETE once all are done, and THE PATCHBAY MANTRA.',
    ],
    control: [
      'Tap an answer on each scenario. Wrong answers explain and you try again.',
      'Solve all ten to complete the page. The last NEXT is FINISH: it opens a list of anything not yet done.',
    ],
    changes: [
      'Each question mixes the lab’s ideas: identify a wiring, predict both jacks, find a broken normal, route without interrupting, replace a source, spot a hazard.',
    ],
    teaches: [
      'Every patchbay question comes back to one fact: when does this pair’s normal survive a plug?',
      'The lab ends here; Gain Staging comes next in the Signal list.',
    ],
    tryThis: [
      'Before each answer, name the wiring and which jack moves, then predict.',
      'Want the table page? Visit it before you start: leaving this page clears the answers solved so far.',
    ],
  },
};

/**
 * The what's-left END screen (PagedLab's `endGuide`; shared kit/LabEndScreen +
 * kit/labEnd). Written against what this lab hands it: `creditLabKey` set →
 * credit mode (rows read ✓ CREDITED, ✓ DONE for a guest), noun "page", no
 * understanding check, no optional pages, no per-page detail lines, the
 * default DONE · BACK TO LABS (safeGoBack: one screen back). A page counts
 * when its device tick or its banked `p<n>` unit is set; NEXT ticks only the
 * three pages without `manualDone` (p1, p2, p13; FINISH is on p23, which is
 * manualDone, so it ticks none) — every other page ticks itself when its task
 * is done. START OVER clears device ticks only; banked p<n> keeps the ✓.
 */
export const PATCHBAY_END_GUIDE: ScreenGuide = {
  seeing: [
    'Where you are in the lab: the title reads WHAT’S LEFT, or LAB COMPLETE once every page is done.',
    'Each page still to do is listed by its number and name.',
    'Finished pages fold into one ✓ CREDITED line (✓ DONE when you are not signed in).',
    'If your saved progress cannot be read, the title reads YOUR PROGRESS and every page can still be opened.',
  ],
  control: [
    'Tap a page still listed to jump straight to it.',
    'REVIEW ▾ on the ✓ line unfolds the finished pages (HIDE ▴ folds them again); tap any one to open it.',
    'PRACTICE AGAIN FROM THE START opens page 1 and clears nothing.',
    'DONE · BACK TO LABS leaves the lab, back to the screen you opened it from.',
    '‹ PREV on the strip returns to the page you came from; the WHAT’S LEFT readout opens CONTENTS.',
  ],
  changes: [
    'Three pages count as soon as you leave them with NEXT: page 1, page 2 and page 13.',
    'Every other page counts only once its task is done, such as all its goal chips lit or every question on it answered correctly. NEXT (FINISH on the last page) still moves on, but the page stays listed.',
    'START OVER (PRACTICE), last in CONTENTS, asks first, then starts again from page 1. Pages already credited keep their ✓.',
  ],
  teaches: [
    'Which parts of the lab you have worked through (thru, full- and half-normal, the switching contact, the studio bay, the safety rules) and which you have not met yet.',
    'Once every page is credited while you are signed in, the whole lab is marked complete on your account.',
    'Nothing is taken away: any page can be opened again for practice.',
  ],
  tryThis: [
    'A page still listed? Jump to the first one and finish its task; pages 1, 2 and 13 count once you leave them with NEXT.',
    'Something on the ✓ line? Tap REVIEW ▾ and reopen a page you found hard, such as Patchbay detective. Practicing it again never takes away what you finished.',
  ],
};

/** PagedLab's `pageGuide`: page index (0-based) → that page's guide. The
 *  what's-left screen uses PATCHBAY_END_GUIDE instead (PagedLab's `endGuide`). */
export function patchbayPageGuide(index: number): ScreenGuide | undefined {
  return PATCHBAY_SCREEN_GUIDES[`p${index + 1}`];
}

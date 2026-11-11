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
    intro: {
      learning: 'What a patchbay is, and the one rule this lab builds on: signal leaves gear on the top row and enters gear on the bottom row.',
      start: 'Read the cards from the top down. Say THE PATCHBAY MANTRA aloud, then tap NEXT at the end to meet your first pair.',
    },
    seeing: [
      'These cards set the one rule every bay in this lab follows. There’s nothing to patch yet.',
      'TOP ROW = SOURCES · OUTPUTS: where signal leaves gear. BOTTOM ROW = DESTINATIONS · INPUTS: where signal enters gear.',
      'Read “Signal falls downhill. Top → Bottom.”, then the four questions every pair asks, and THE PATCHBAY MANTRA.',
    ],
    control: [
      'This page is for reading. Scroll down, then tap NEXT at the end.',
      'The strip under the title moves you around the lab: ⏮ goes back to the first page, and ‹ PREV and NEXT › step one page. The readout in the middle (MODULE, with the page number and ▾) opens a list of every page. The strip calls each page a MODULE.',
      'On later pages you’ll find a display on top, readouts on its frame and controls in the dock at the bottom.',
      'Tap ⓘ beside any page’s title to have that page explained.',
    ],
    changes: [
      'Nothing moves here. This page gives you the picture the rest of the lab uses.',
      'A patchbay puts outputs (signal leaving gear) in one row and inputs (signal arriving) in the row below, so each column joins one source to one destination.',
      'Some bays are wired the other way around, so read the label instead of trusting habit.',
    ],
    teaches: [
      'A patchbay brings a studio’s important inputs and outputs to one panel, so you can reroute signal with short patch cords.',
      'On most bays the source sits over its destination, and signal flows top to bottom.',
      'Four questions explain any pair: What is the source? What is the destination? What path exists with no cord? What changes when you plug in?',
    ],
    tryThis: [
      'Say the mantra aloud from memory, then check it against THE PATCHBAY MANTRA card.',
      'Pick one item from the TOP ROW card and one from the BOTTOM ROW card. Say which is the source, which is the destination, and which way signal moves.',
    ],
  },

  // ── 2 · One pair, two pictures (rack, thru) ───────────────────────────────
  p2: {
    intro: {
      learning: 'A patchbay pair is one source jack over one destination jack, and the front panel and the signal path are two views of the same connection.',
      start: 'Tap TOP JACK and watch DEST HEARS. Then turn it off, tap BOTTOM JACK, and see where INTERFACE IN 1 now gets its signal.',
    },
    seeing: [
      'You’re looking at ONE vertical pair. On top is a slice of the front panel; under it, the signal path of the same pair.',
      'CONSOLE OUT 1 (SOURCE · OUTPUT) sits above the TOP jack; INTERFACE IN 1 (DESTINATION · INPUT) sits below the BTM jack.',
      'Marching dashes = signal flowing now. Dim dots = a path not in use. Gold = a patch cord.',
      'Watch TOP and BOTTOM (CORD or EMPTY), NORMAL and DEST HEARS as you patch.',
    ],
    control: [
      'Tap TOP JACK or BOTTOM JACK in the dock to put a patch cord into that jack, or take it out.',
      'Tapping a jack on the drawing does the same. A breathing ring marks a jack you haven’t used yet.',
      'HIDE DISPLAY gives the text more room; FULL SCREEN zooms the drawing while the dock keeps working.',
      'Read the status line under the display: it spells out what is connected to what.',
    ],
    changes: [
      'NORMAL reads NONE: nothing inside this bay joins top to bottom. The next pages give this a name.',
      'A TOP cord carries CONSOLE OUT 1 out to YOUR CABLE, so DEST HEARS reads NOTHING.',
      'A BOTTOM cord feeds INTERFACE IN 1 from YOUR CABLE, so DEST HEARS reads PATCH.',
      'The panel and the path always change together: two views of one pair.',
    ],
    teaches: [
      'The pair is the smallest unit of any patchbay: one source jack over one destination jack.',
      'On this pair, a cord in the top jack carries the source away; a cord in the bottom jack brings a new signal to the destination.',
      'The front panel and a signal-flow drawing describe the same connection, so you can read either one.',
    ],
    tryThis: [
      'Turn on TOP JACK only: TOP reads CORD, NORMAL stays NONE, DEST HEARS reads NOTHING.',
      'Turn TOP JACK off and BOTTOM JACK on: DEST HEARS reads PATCH. The input is fed from your cable, not the console.',
      'Tap the jacks on the drawing instead: the TOP JACK and BOTTOM JACK keys follow.',
    ],
  },

  // ── 3 · Thru: nothing is connected yet (rack, thru) ───────────────────────
  p3: {
    intro: {
      learning: 'A thru pair has no connection inside it: with no cords, the destination hears nothing, and a patch cord is the only route from top to bottom.',
      start: 'Predict where the console’s signal goes, then tap TOP JACK alone to light SEE THE DEAD END. Add BOTTOM JACK to light COMPLETE THE ROUTE.',
    },
    seeing: [
      'This is the same THRU pair. NO INTERNAL CONNECTION is written between the jacks.',
      'A lone top cord’s far end reads NOT PLUGGED IN: the signal goes nowhere. A lone bottom cord brings in an ALT SOURCE.',
      'With both jacks used, one gold cord loops down: ONE CORD, TOP TO BOTTOM.',
      'Watch TOP, BOTTOM, NORMAL and DEST HEARS as you patch. Light both goal chips under the status line.',
    ],
    control: [
      'Use TOP JACK and BOTTOM JACK in the dock, or tap the jacks on the drawing.',
      'Goal chips: SEE THE DEAD END (top only) and COMPLETE THE ROUTE (both jacks). Each one is checked once you make it; you need both to finish the page.',
      'Before you read the status line, predict where the console’s signal goes. The prompt on the page asks you to.',
    ],
    changes: [
      'Top only: the signal leaves on the cord and stops there. DEST HEARS reads NOTHING, because there is no inside path to fall back on.',
      'Both jacks: one cord joins top to bottom, so DEST HEARS reads PATCH. The cord is the only route.',
      'NORMAL reads NONE in every state: nothing inside joins the two jacks.',
    ],
    teaches: [
      'Thru (also called “non-normalled”) means nothing is connected inside the pair: with no cords, the destination hears nothing.',
      'On a thru pair, a patch cord is the only path from top to bottom.',
      'A cord in the top jack alone is a dead end: the source leaves the bay but reaches no input.',
    ],
    tryThis: [
      'Turn on TOP JACK only: the status reads “PATCHED — CONSOLE OUT 1 goes only into the cord” and DEST HEARS reads NOTHING.',
      'Add BOTTOM JACK: the drawing shows ONE CORD, TOP TO BOTTOM, and DEST HEARS reads PATCH.',
      'Now take TOP JACK out: the bottom cord brings an ALT SOURCE. The console is out of the route.',
    ],
  },

  // ── 4 · What “normal” means (reading) ─────────────────────────────────────
  p4: {
    intro: {
      learning: 'What “normal” means on a patchbay: a connection inside the bay that carries signal from source to destination before you plug in any cord.',
      start: 'Look at the figure and its caption. Say where the signal goes with no cord, then answer the UNDERSTANDING CHECK.',
    },
    seeing: [
      'The same pair, now NORMALLED: signal already flows from CONSOLE OUT 1 to INTERFACE IN 1, with no patch cord anywhere.',
      'Its caption reads NO PATCH CORD REQUIRED: the connection is inside the bay.',
      'Read the highlighted line that defines the word “normal”, then answer the UNDERSTANDING CHECK.',
    ],
    control: [
      'The figure is a picture: there’s nothing to plug in on this page.',
      'Tap an answer in the UNDERSTANDING CHECK. A wrong answer explains its mistake so you can try again; the right one turns green and completes the page.',
      'The answers appear in a shuffled order.',
    ],
    changes: [
      'Inside a normalled pair, a contact joins the top jack’s rear wiring to the bottom jack’s rear wiring.',
      'So the source reaches the destination with no cord: the default route is there before you touch the bay.',
      'Compare the THRU pair you just used, where the same two jacks had nothing between them.',
    ],
    teaches: [
      'Normal: a connection that exists before you plug in a patch cable.',
      'A normal joins one vertical pair only: this source to this destination.',
      'A thru pair has no default route; a normalled pair gives you one, so everyday signal flows with no cords at all.',
    ],
    tryThis: [
      'Before reading the answers, say where the signal goes with no cord. Then check.',
      'Pick “Nowhere — patch cords make every connection” on purpose. The feedback points back to the THRU pair.',
    ],
  },

  // ── 5 · The switching contact (rack, cutaway) ─────────────────────────────
  p5: {
    intro: {
      learning: 'A normal is a spring contact inside the jack. A plug pushed in far enough lifts the spring and breaks the normal; pull it out and the normal closes.',
      start: 'Slide PLUG INSERTION slowly up from 0% and watch CONTACTS. Find the point where NORMAL changes from INTACT to BROKEN, then pull the plug back out.',
    },
    seeing: [
      'INSIDE THE JACK — CUTAWAY: the FRONT PANEL, the plug waiting outside (PLUG OUT), the TIP SPRING fed FROM SOURCE · REAR, and the NORMAL CONTACT wired TO DESTINATION · REAR.',
      'As the plug moves, watch INSERTION, CONTACTS (TOUCHING or OPEN) and NORMAL (INTACT or BROKEN).',
      'The CONCEPTUAL MODEL badge: this jack opens at 85%. It’s drawn ENLARGED with only the tip spring; a real jack has a ring spring too.',
    ],
    control: [
      'Drag the PLUG INSERTION fader in the dock, 0–100% in 1% steps, to drive the plug into the jack.',
      'Goal chips: BREAK THE NORMAL (insert fully) and RESTORE IT (pull the plug back out). RESTORE IT counts only after a break; you need both to finish the page.',
      'FULL SCREEN zooms the cutaway while the fader stays in the dock.',
    ],
    changes: [
      'At rest, the tip spring presses on the normal contact, so the source flows on to the destination.',
      'Late in its travel, the plug’s tip lifts the spring off: CONTACTS OPEN, NORMAL BROKEN. The spring now touches the plug, so the source rides the cord instead.',
      'Pull the plug back and the spring returns, closing the normal. It’s a switch, not a setting.',
    ],
    teaches: [
      'A normal is a spring contact, and a plug physically opens it.',
      'A jack with a contact that a plug opens is called a breaking jack.',
      'The switch moves only near the end of the plug’s travel, so a plug that isn’t pushed fully home can leave the normal closed.',
    ],
    tryThis: [
      'Slide PLUG INSERTION to 84%: CONTACTS still read TOUCHING. One step more, at 85%, they read OPEN and NORMAL reads BROKEN.',
      'Stop at 50%: the plug is half in, yet CONTACTS read TOUCHING. The switch moves only late in the travel.',
      'Push to 100%, then back to 0%: both goal chips are checked as the normal breaks, then restores.',
    ],
  },

  // ── 6 · Full-normal: the four states (rack) ───────────────────────────────
  p6: {
    intro: {
      learning: 'On a full-normal pair, a plug in either jack breaks the normal. Every pair has four states, and a top plug alone silences the destination.',
      start: 'Light all four goal chips: nothing patched, then TOP JACK only, BOTTOM JACK only, and both. Watch NORMAL and DEST HEARS each time.',
    },
    seeing: [
      'The pair is now FULL-NORMAL: a green NORMAL joins CONSOLE OUT 1 to INTERFACE IN 1.',
      'A top cord goes to an ANALYZER; a bottom cord brings in a DRUM MACHINE.',
      'A ✕ with NORMAL BROKEN marks a normal held open by a plug. Red means the destination has been left silent.',
      'Watch TOP, BOTTOM, NORMAL and DEST HEARS as you patch. A caption names the state: A, B, C or D.',
    ],
    control: [
      'Use TOP JACK and BOTTOM JACK in the dock, or tap the jacks on the drawing.',
      'Four goal chips: A · NOTHING PATCHED, B · TOP ONLY, C · BOTTOM ONLY, D · BOTH. Visit all four to finish the page.',
    ],
    changes: [
      'A: the normal carries the source down. NORMAL INTACT, DEST HEARS SOURCE.',
      'B: a top plug opens the contact. The analyzer gets the source, and the destination hears NOTHING.',
      'C: a bottom plug opens it from the other side. The drum machine feeds the input (PATCH), and the console’s signal dead-ends.',
      'D: two separate reroutes. The two jacks no longer act as a pair.',
    ],
    teaches: [
      'Full-normal: a plug in EITHER front jack breaks the normal.',
      'Every pair has four states: nothing, top, bottom, both.',
      'On full-normal, a plug in the top jack silences the destination. Patch it during a take and the recording loses its signal.',
    ],
    tryThis: [
      'Turn on TOP JACK only: NORMAL reads BROKEN in red and DEST HEARS reads NOTHING. The take just went silent.',
      'Swap to BOTTOM JACK only: DEST HEARS reads PATCH, and the DRUM MACHINE feeds INTERFACE IN 1.',
      'Turn both on: NORMAL stays BROKEN, DEST HEARS stays PATCH, and the analyzer still gets the console on its own cord.',
    ],
  },

  // ── 7 · Half-normal: the surprise (rack, predict first) ───────────────────
  p7: {
    intro: {
      learning: 'A half-normal pair starts out exactly like full-normal. Here you predict, then test, what a plug in each jack does to its normal.',
      start: 'Answer PREDICT BEFORE PATCHING first; the jacks stay locked until you do. Then turn on TOP JACK and read NORMAL, DEST HEARS and the status line.',
    },
    seeing: [
      'The same pair and labels, now HALF-NORMALLED. It starts exactly like full-normal: NORMAL INTACT, DEST HEARS SOURCE.',
      'Below the status line, answer PREDICT BEFORE PATCHING, then light the two goal chips.',
      'The dock stays empty and the jacks do nothing until your prediction is in.',
    ],
    control: [
      'Answer PREDICT BEFORE PATCHING. The right answer unlocks TOP JACK and BOTTOM JACK, in the dock and on the drawing.',
      'Goal chips: PREDICT IT (answer below) and THEN DO IT (patch the top). You need both to finish the page.',
      'A wrong answer explains itself, and you try again.',
    ],
    changes: [
      'Once your prediction is in, patch the TOP and read NORMAL and DEST HEARS: they show whether this bay’s top jack opens the normal.',
      'The status line names the result in its first words: SPLIT (one source feeding two places) or NORMAL BROKEN.',
      'Test the BOTTOM jack the same way. A plug there brings in the DRUM MACHINE.',
    ],
    teaches: [
      'A pair’s behavior with no cords in doesn’t tell you what a plug will do to it.',
      'On a half-normal pair, testing each jack shows you which plug opens the normal.',
      'A prediction made before patching catches a surprise before it reaches a session.',
    ],
    tryThis: [
      'After answering, turn on TOP JACK and read NORMAL, DEST HEARS and the status line. Did INTERFACE IN 1 keep its signal?',
      'After answering, turn TOP JACK off and BOTTOM JACK on. Read NORMAL and DEST HEARS: what does a plug in the bottom jack do?',
      'Compare with full-normal on the page before, where TOP JACK alone made DEST HEARS read NOTHING.',
    ],
  },

  // ── 8 · Why it is called HALF-normal (reading) ────────────────────────────
  p8: {
    intro: {
      learning: 'Why half-normal has its name: only one of the pair’s two jacks breaks the normal, and that decides what each jack is good for.',
      start: 'Compare the FULL-NORMAL and HALF-NORMAL (COMMON BAY) rows on the scoreboard card. Then answer the UNDERSTANDING CHECK.',
    },
    seeing: [
      'A scoreboard card. FULL-NORMAL: top insert breaks, bottom insert breaks. HALF-NORMAL (COMMON BAY): top does not break, bottom breaks.',
      'Read the short explanation under it, then answer the UNDERSTANDING CHECK.',
    ],
    control: [
      'Tap an answer: the top front jack, the bottom front jack, both, or neither. The order is shuffled.',
      'A wrong answer explains why; the right one completes the page.',
    ],
    changes: [
      'The name counts the sides that break. Full: both. Half: only one, half of the pair.',
      'The non-breaking top makes the top jack a tap: a copy taken without interrupting. The breaking bottom still lets you replace a destination’s source.',
    ],
    teaches: [
      '“Half-normal” means only one jack of the pair breaks the normal.',
      'What each jack of a common half-normal pair is good for: one takes a copy, the other replaces the source.',
      'Half-normal is directional: some rarer bays break on the top instead, so always verify a bay before you trust it.',
    ],
    tryThis: [
      'Before answering, think back to the page before: you patched the top mid-flow. Did INTERFACE IN 1 lose its signal?',
      'Pick “Both” on purpose and read the feedback.',
    ],
  },

  // ── 9 · The tap — and the side that breaks (rack, half) ───────────────────
  p9: {
    intro: {
      learning: 'On a common half-normal pair, a top plug taps a copy without interrupting the signal, while a bottom plug breaks the normal and replaces the source.',
      start: 'Turn on TOP JACK and watch DEST HEARS stay SOURCE. Then swap to BOTTOM JACK, predict what happens to the console’s signal, and read NORMAL.',
    },
    seeing: [
      'The half-normal pair: CONSOLE OUT 1 is recording into INTERFACE IN 1. A top cord feeds an ANALYZER; a bottom cord brings in a DRUM MACHINE.',
      'Watch TOP, BOTTOM, NORMAL and DEST HEARS as you patch. Below them: two goal chips and a card that names the top-jack tap.',
    ],
    control: [
      'Use TOP JACK and BOTTOM JACK in the dock, or tap the jacks on the drawing.',
      'Goal chips: TAP THE MIX (top only — nothing interrupted) and REPLACE THE SOURCE (bottom — normal breaks). You need both to finish the page.',
      'Before you read the readout, predict what the bottom plug did to the console’s signal.',
    ],
    changes: [
      'Top cord: the normal stays closed. The recording keeps running and the analyzer gets a copy (SPLIT).',
      'Bottom cord: the contact opens. The drum machine takes over INTERFACE IN 1, and the console’s signal stops at its jack.',
    ],
    teaches: [
      'Tap, split, monitor feed: three names for one move, a copy taken without interrupting.',
      'A MULT is a separate group of jacks wired together, used to copy one signal to several places.',
      'A PARALLEL pair has no switch, so a cord in either jack takes a copy; patching a second source into it would clash (two outputs wired together).',
      'Half-normal still breaks on the bottom, the jack you use to replace a source.',
    ],
    tryThis: [
      'Turn on TOP JACK: DEST HEARS stays SOURCE and the status reads SPLIT. The take never stopped.',
      'Turn TOP JACK off and BOTTOM JACK on: NORMAL reads BROKEN and DEST HEARS reads PATCH. CONSOLE OUT 1 no longer reaches the interface.',
    ],
  },

  // ── 10 · Full vs Half vs Thru — the table (reading) ───────────────────────
  p10: {
    intro: {
      learning: 'Full-normal, half-normal and thru side by side: the three wirings differ in only one thing, which is when the normal survives a plug.',
      start: 'Read the table one row at a time, comparing FULL, HALF (COMMON) and THRU. Then answer the UNDERSTANDING CHECK about feeding a tuner.',
    },
    seeing: [
      'One table of everything so far: ACTION down the side; FULL, HALF (COMMON) and THRU across the top.',
      'Its rows: no front cables, plug into TOP, plug into BOTTOM, tap without interrupting, default connection.',
      'Below it, read the note on rarer bays, answer the UNDERSTANDING CHECK and read THE PATCHBAY MANTRA.',
    ],
    control: [
      'Read the table, then answer the check about feeding a tuner. Wrong answers explain themselves; the right one completes the page.',
      'Come back any time: tap the readout in the middle of the strip (MODULE, with ▾) on any page and pick this page from the list.',
    ],
    changes: [
      'The three wirings differ in one thing only: when the normal survives a plug.',
      'Thru: never, because no normal exists. Full: only with both jacks empty. Half (common): until the bottom jack is used.',
    ],
    teaches: [
      'Thru has no default route. Full-normal breaks on either jack. Common half-normal breaks only on the bottom jack.',
      '“Through” and “non-normalled” are other names for thru.',
    ],
    tryThis: [
      'Cover the HALF (COMMON) column, say each answer, then uncover it to check.',
      'Find the rows where FULL and HALF (COMMON) disagree. They are the same difference, said twice.',
    ],
  },

  // ── 11 · Predict before patching (reading) ────────────────────────────────
  p11: {
    intro: {
      learning: 'Any patch’s result follows from two facts: how the pair is wired and which jack takes the plug.',
      start: 'On each PREDICT card, name the wiring and the jack first, then pick your answer. After a right answer, read the signal path drawn under the card.',
    },
    seeing: [
      'Four PREDICT cards. Each one describes a pair, its wiring and one plug going in, then asks what happens.',
      'After a right answer, that pair’s signal path appears under the card: “Here is why — read the path.”',
    ],
    control: [
      'Tap an answer on each card. A wrong answer explains itself; then try again.',
      'The answers are shuffled. Solve all four cards to finish the page.',
    ],
    changes: [
      'Every answer follows the same switching rules you met on the earlier pages.',
      'The path drawing shows why: dashes where signal flows, a ✕ where a normal is held open, gold for your cable.',
      'Read the drawing before you move on: it’s the reason behind the answer.',
    ],
    teaches: [
      'Any patch’s result follows from two facts: the pair’s wiring and which jack takes the plug.',
      'The same plug can do different things on different wirings, so name the wiring before you patch.',
    ],
    tryThis: [
      'On each card, name the wiring and the jack first, then recall that row of the table on the Full vs Half vs Thru page.',
      'On a wrong pick, read the feedback before trying again: it explains what your answer missed.',
    ],
  },

  // ── 12 · Patchbay detective (reading) ─────────────────────────────────────
  p12: {
    intro: {
      learning: 'How to name a pair’s wiring from what it does: whether signal flows with no cords, and what a plug in the top jack does to it.',
      start: 'Read the ▸ test results on the first CASE card. Rule out one wiring per test, then tap YOUR VERDICT: Full-normal, Half-normal or Thru.',
    },
    seeing: [
      'You’re the detective now. Each of the three CASE cards gives you a pair with no label, followed by the result of each test run on it, marked ▸.',
      'Under each case, YOUR VERDICT offers the three wirings you know: Full-normal, Half-normal or Thru.',
    ],
    control: [
      'Read every test, then tap the verdict that fits. A wrong one points you to the test that rules it out, and you try again.',
      'Solve all three cases to complete the page.',
    ],
    changes: [
      'Each test is one fact about the pair. Signal with no cords tells you a normal exists; what a top plug does tells the two normalled wirings apart.',
      'Every case is built so only one verdict fits all its tests. If your pick disagrees with even one ▸ line, it isn’t the answer.',
    ],
    teaches: [
      'A bay’s wiring shows in how it behaves, even when there’s no label to read.',
      'Two tests tell the three wirings apart: no cords shows whether a normal exists; a top plug separates full from half.',
      'Working backwards from results is how you check an unfamiliar bay before a session depends on it.',
    ],
    tryThis: [
      'Before each verdict, cross out one wiring per ▸ test until only one is left standing.',
      'Pick a wrong verdict on purpose and see which test the feedback points to.',
    ],
  },

  // ── 13 · The four questions, answered (reading) ───────────────────────────
  p13: {
    intro: {
      learning: 'The four questions you can ask of any vertical pair, and how full-normal, half-normal and thru each answer them.',
      start: 'Before you read the card, answer the four questions aloud for a half-normal pair. Then compare with the card, and tap NEXT to start part two.',
    },
    seeing: [
      'This page closes part one. One card answers the four questions from the first page: the source, the destination, the path with no cord, and what changes when you plug in.',
      'Below it: THE PATCHBAY MANTRA, SOURCES BEHIND THIS LAB, and PART TWO STARTS ON THE NEXT PAGE.',
    ],
    control: [
      'There’s nothing to patch or answer here. Read the card, then tap NEXT to start part two; leaving with NEXT also marks this page done.',
    ],
    changes: [
      'Nothing moves on this page. It pulls part one together: source on top, destination below, the normal between them, and what a plug in each jack does to it.',
    ],
    teaches: [
      'Four questions describe any vertical pair: its source, its destination, its path with no cord, and what changes when you plug in.',
      'Full, half and thru give the same first two answers. They differ only on the path with no cord and on what a plug changes.',
      'A whole studio bay is many of these pairs, so the same four questions still apply.',
    ],
    tryThis: [
      'Cover the card and answer the four questions aloud for a half-normal pair, then check.',
      'For a full-normal pair, say what a bottom plug does; then check it against answer 4 on the card.',
    ],
  },

  // ── 14 · From one pair to a whole bay (rack, 8-pair bay) ──────────────────
  p14: {
    intro: {
      learning: 'A studio bay is many single pairs side by side, each with its own wiring: everyday paths on half-normal pairs, processor pairs left thru.',
      start: 'Ride PAIR through 01–08 and watch NORMAL. Find the two pairs where it reads NONE. Then select 05 and turn on TOP JACK.',
    },
    seeing: [
      'You’re looking at the first eight pairs of a 24-pair studio bay. The pair you select gets a cyan outline and is drawn again below as a signal path.',
      'As you change pairs, watch PAIR (its number, with HALF or THRU), NORMAL and DEST HEARS.',
      'Below them, read the row legend and the status line, and light the three goal chips.',
    ],
    control: [
      'Ride the PAIR fader through 01–08, or tap it to pick a pair by name. Tapping a column on the bay selects it too.',
      'TOP JACK and BOTTOM JACK patch the selected pair. Each pair you select starts with empty jacks.',
      'Goal chips: VISIT 4 PAIRS, FIND THE 2 THRU PAIRS and PATCH SOMETHING. Light all three to complete the page.',
    ],
    changes: [
      'Every column follows the rules you already know. Pairs 01–06 are half-normal, so with empty jacks NORMAL reads INTACT.',
      'Pairs 07 and 08, the compressor and EQ pairs, are THRU: NORMAL reads NONE and DEST HEARS reads NOTHING.',
      'Patch a cord and it shows as a gold stub on that column.',
    ],
    teaches: [
      'A whole bay is many single pairs, and each pair has its own wiring.',
      'A common layout puts recording, mic pres and monitoring on half-normal pairs, and keeps processor pairs THRU.',
      'You read a bay one column at a time: that column’s wiring decides what each plug does.',
    ],
    tryThis: [
      'Ride PAIR to 07: PAIR reads 07 THRU, NORMAL reads NONE, DEST HEARS reads NOTHING.',
      'On 05 (INTERFACE OUT 1 → MONITOR CTRL L), turn on TOP JACK: DEST HEARS stays SOURCE. A tap, as on the common bay.',
      'Patch a jack, then select another pair: the new pair starts with empty jacks, and your gold stub disappears from the bay.',
    ],
  },

  // ── 15 · The studio works with no cables (rack, bay) ──────────────────────
  p15: {
    intro: {
      learning: 'A well-designed normalled bay carries the studio’s everyday signal path with no front cords at all; patch cords are there to change it.',
      start: 'Check that FRONT CORDS reads 0. Turn on SHOW THE INVISIBLE NORMALS and see which columns light a flowing line. Then answer the check.',
    },
    seeing: [
      'This is the 8-pair studio bay with no cords in it at all.',
      'Keep an eye on PAIRS 8, FRONT CORDS 0 and NORMALS (HIDDEN or SHOWN).',
      'Below, read the row legend and the statement card, then answer the UNDERSTANDING CHECK.',
    ],
    control: [
      'Flip the SHOW THE INVISIBLE NORMALS switch in the dock to draw the connections inside the bay, or to hide them again.',
      'Answer the check. The page completes once you’ve picked the right answer and shown the normals at least once.',
    ],
    changes: [
      'With the normals shown, pairs 01–06 light a flowing line between their jacks. That line is each pair’s normal, carrying its default route.',
      'Pairs 07 and 08 show the word THRU instead: nothing inside joins their jacks.',
      'The routing never changes when you flip the switch. It only shows you what was already there.',
    ],
    teaches: [
      'A well-designed normalled bay runs its everyday signal path with zero front cords.',
      'Patch cords exist to CHANGE the default routing, not to make it.',
      'So every cord you see in a normalled bay means someone is taking a copy or changing a route.',
    ],
    tryThis: [
      'Turn SHOW THE INVISIBLE NORMALS on: NORMALS reads SHOWN; six columns show a flowing line and two read THRU.',
      'With the normals shown, look at FRONT CORDS: it still reads 0. Every one of those routes runs without a cord.',
    ],
  },

  // ── 16 · Overpatching (rack, half) ────────────────────────────────────────
  p16: {
    intro: {
      learning: 'The normal path is what an empty bay connects; an overpatch is a cord that replaces it, and only for as long as the cord stays in.',
      start: 'With no cords, read DEST HEARS: SOURCE. Turn on BOTTOM JACK to bring in the SYNTH, then turn it off and watch NORMAL return to INTACT.',
    },
    seeing: [
      'You’re back on the half-normal pair: CONSOLE OUT 1 over INTERFACE IN 1. A bottom cord brings in SYNTH (SOURCE C).',
      'Read the card that defines NORMAL PATH and OVERPATCH, then watch TOP, BOTTOM, NORMAL and DEST HEARS.',
      'Under the status line, read the caption and light the one goal chip.',
    ],
    control: [
      'Use TOP JACK and BOTTOM JACK in the dock, or tap the jacks on the drawing.',
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
      'An overpatch lasts only while its cord is in. Pull the cord and the normal path comes back by itself.',
    ],
    tryThis: [
      'Turn on BOTTOM JACK: the caption reads OVERPATCHED, NORMAL reads BROKEN, DEST HEARS reads PATCH.',
      'Turn BOTTOM JACK off again: NORMAL reads INTACT. The normal path returns by itself.',
    ],
  },

  // ── 17 · The processor chain (rack, two pairs) ────────────────────────────
  p17: {
    intro: {
      learning: 'How a patchbay inserts a processor: the send taps the source, the return breaks the normal, and pulling both cords bypasses it.',
      start: 'Turn INSERT COMPRESSOR on and read NORMAL and DEST HEARS on the VOCAL PAIR. Then set VIEW to PROCESSOR PAIR to see what feeds the compressor.',
    },
    seeing: [
      'Two pairs, one on the display at a time. VOCAL PAIR: VOCAL OUT over CONSOLE IN 2, half-normal. PROCESSOR PAIR: COMPRESSOR OUT over COMPRESSOR IN, thru.',
      'The two cords are numbered ① SEND and ② RETURN.',
      'Watch COMPRESSOR (IN or BYPASSED), then NORMAL and DEST HEARS for the pair in view.',
    ],
    control: [
      'The INSERT COMPRESSOR switch patches both cords at once, or pulls both out to bypass.',
      'VIEW switches the display between VOCAL PAIR and PROCESSOR PAIR. Both pairs’ status lines stay in the text below the display.',
      'Goal chips: INSERT THE COMPRESSOR, BYPASS IT AGAIN and SERVICE CALL (answer below). All three complete the page.',
    ],
    changes: [
      'Inserted: ① SEND taps the vocal at the top, with no break. ② RETURN enters the bottom and breaks the normal, so the console hears the compressor.',
      'The processor pair is THRU: its cords carry the vocal in and the compressed result out.',
      'Bypassed: no cords, so the vocal’s own normal runs straight to the console.',
    ],
    teaches: [
      'The insert chain: VOCAL OUT → ① → compressor → ② → CONSOLE IN 2.',
      'Bypass means pulling the cords: the normal restores the direct path.',
      'Processor pairs stay THRU, so a processor sits in a path only when you patch it there.',
    ],
    tryThis: [
      'Turn INSERT COMPRESSOR on: COMPRESSOR reads IN, NORMAL reads BROKEN, DEST HEARS reads PATCH on the vocal pair.',
      'With it off, set VIEW to PROCESSOR PAIR: NORMAL reads NONE and DEST HEARS reads NOTHING. The compressor waits.',
      'The SERVICE CALL pulls just one cord, which the switch can’t do, so work it out in your head: which jack’s plug was holding the normal open?',
    ],
  },

  // ── 18 · What’s wrong with this patch? (reading) ──────────────────────────
  p18: {
    intro: {
      learning: 'How a bay’s wiring and the direction of a patch explain a fault, read from the symptom and the drawn signal path.',
      start: 'Read the first CALL card’s situation. If it shows a signal path, trace it with a finger, then tap YOUR DIAGNOSIS.',
    },
    seeing: [
      'Four service calls. Each CALL card gives a title and a situation, the way a problem reaches you in a working studio.',
      'Three calls also show the pair as a signal path. Under each, YOUR DIAGNOSIS asks what went wrong.',
    ],
    control: [
      'Tap a diagnosis for each call. Wrong answers point at the evidence and you try again.',
      'Solve all four calls to complete the page.',
    ],
    changes: [
      'Each fault comes from misreading how a pair is wired, or from forgetting which way signal moves: from an output on top to an input below.',
      'The drawings show the patch exactly as it stands: dashes where signal flows, a ✕ where a normal is held open.',
    ],
    teaches: [
      'How a bay’s wiring and a patch’s direction explain a fault, read from the symptoms and the drawing.',
      'Most patching faults come from rules you already know, applied to the wrong pair or the wrong jack.',
      'A symptom alone can fit more than one fault; the drawn path shows which one it is.',
    ],
    tryThis: [
      'On “The re-wired compressor”, trace the drawn path with a finger before answering: where does the output arrive?',
      'On “Nothing happens”, name the KIND of jack at each end of the cord before answering.',
    ],
  },

  // ── 19 · Half-normal is directional (rack, top-breaking) ──────────────────
  p19: {
    intro: {
      learning: '“Half-normal” alone doesn’t say which jack breaks. On this rarer bay the top breaks, so a bottom plug clashes with the source instead of replacing it.',
      start: 'Turn on TOP JACK only and read NORMAL and DEST HEARS. Then swap to BOTTOM JACK only and read what DEST HEARS shows now.',
    },
    seeing: [
      'This half-normal pair breaks on the TOP: TAPE OUT 1 over CONSOLE TAPE RTN 1, with outputs still on top.',
      'A top cord goes to YOUR CABLE; a bottom cord brings an ALT SOURCE.',
      'Watch TOP, BOTTOM, NORMAL and DEST HEARS as you patch. Below, light the two goal chips and read THE RULE THAT TRAVELS.',
    ],
    control: [
      'Use TOP JACK and BOTTOM JACK in the dock, or tap the jacks on the drawing.',
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
    intro: {
      learning: 'Each line on a patchbay is one balanced circuit on three conductors, and a real breaking jack switches both signal legs together.',
      start: 'The plug starts 90% in: find its T, R and S bands. Pull PLUG INSERTION back to 84%, then push it to 100% and read CONTACTS each time.',
    },
    seeing: [
      'The jack cutaway from The switching contact page, with the plug starting 90% in. Past 30%, its metal bands are labeled T, R and S.',
      'As the plug moves, watch INSERTION, CONTACTS and NORMAL. The CONCEPTUAL MODEL badge sits under the drawing.',
      'Below, read the T · R · S card, then answer the UNDERSTANDING CHECK.',
    ],
    control: [
      'Slide the PLUG INSERTION fader, 0–100%, to move the plug in and out.',
      'Answer the check to complete the page.',
    ],
    changes: [
      'TIP and RING carry the balanced signal pair; SLEEVE is the shield/ground.',
      'You see only the TIP spring here. A real jack gives the RING its own spring and contact, switched by the same plug; the sleeve is not switched, and how its ground is wired depends on the bay.',
      'The contacts still open at 85%, just as before.',
    ],
    teaches: [
      'Every “one line” in this lab is one balanced circuit: three conductors.',
      'This bay takes ¼-inch patch plugs with a tip, ring and sleeve. TT (bantam) is a smaller family that does not fit a ¼-inch jack.',
      'One plug opens the tip and ring normals together, so both legs of the balanced line switch as one.',
    ],
    tryThis: [
      'Pull PLUG INSERTION back from 90% to 84%: CONTACTS read TOUCHING, NORMAL INTACT. On a real jack the RING’s own contact closes too: both legs of the balanced pair return together.',
      'Push to 100%: CONTACTS read OPEN, NORMAL reads BROKEN. Find T, R and S on the plug: three conductors, one balanced line.',
    ],
  },

  // ── 21 · Phantom power + patchbays (reading) ──────────────────────────────
  p21: {
    intro: {
      learning: 'Why patching a mic line while +48 V phantom power is on can pop the speakers and harm gear, and what has to happen before you patch.',
      start: 'Read all five points on the ⚠ PHANTOM POWER + PATCHBAYS card, then the note on what it does NOT say. Then answer the check.',
    },
    seeing: [
      'This page is about phantom power: +48 V sent down a mic cable to power condenser mics.',
      'A warning card, ⚠ PHANTOM POWER + PATCHBAYS: five points about mic-level circuits carrying +48 V.',
      'Read the note on what the warning does NOT say, then answer the UNDERSTANDING CHECK.',
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
    ],
    tryThis: [
      'Before answering, find the point on the ⚠ card that says what to do before patching a mic-level point, and say it aloud.',
      'Pick “Patch quickly so the transient is short” on purpose and read why speed does not help.',
    ],
  },

  // ── 22 · Design your own bay (reading) ────────────────────────────────────
  p22: {
    intro: {
      learning: 'How a pair’s job decides its wiring, and the tradeoff each choice brings: a default route, a free tap, or a surprise waiting.',
      start: 'Start with CONSOLE DIRECT OUT 1 → INTERFACE INPUT 1. Tap FULL-NORMAL, HALF-NORMAL and THRU in turn, and read each consequence.',
    },
    seeing: [
      'Six pair cards, each with a job: CONSOLE DIRECT OUT 1 → INTERFACE INPUT 1 (recording), playback, a compressor, a mic pre, a SPARE PAIR (future gear) and the monitor feed.',
      'Each card has three buttons: FULL-NORMAL, HALF-NORMAL, THRU. A count of settled pairs sits at the bottom.',
    ],
    control: [
      'Tap a configuration on each card to read its consequence. ✓ means the pick suits the job (its note may still name a tradeoff); △ means it does not suit it.',
      'Several cards accept more than one answer. A card settles on its first ✓ and stays open to explore.',
      'Settle all six to complete the page.',
    ],
    changes: [
      'Each pick shows the tradeoff for that job: a default route, a free tap, or a surprise waiting.',
      'The processor and spare pairs accept only THRU: a normal there would feed a processor’s output back into its input, or connect unknown gear.',
    ],
    teaches: [
      'A pair’s wiring follows from its job, not from definitions.',
      'Half-normal suits daily paths you sometimes tap; thru suits processors and spares.',
      'Full-normal can carry a daily path too, at a cost: a plug in its top jack silences the destination.',
    ],
    tryThis: [
      'On CONSOLE DIRECT OUT 1 → INTERFACE INPUT 1, try all three: HALF-NORMAL ✓, FULL-NORMAL ✓ with a cost, THRU △.',
      'On COMPRESSOR OUT → COMPRESSOR IN, pick HALF-NORMAL first and read why it fails.',
    ],
  },

  // ── 23 · Final proficiency assessment (reading) ───────────────────────────
  p23: {
    intro: {
      learning: 'How every idea in this lab comes back to one fact: when does this pair’s normal survive a plug, and when does it break?',
      start: 'On each scenario, name the wiring and which jack takes the plug before you read the answers. Then predict, and tap your answer.',
    },
    seeing: [
      'Ten working-studio scenarios, each with a heading such as IDENTIFY THE CONFIGURATION or SPOT THE HAZARD.',
      'Some show the pair’s path once solved: “Confirmed — read the path.”',
      'A solved count, LAB COMPLETE once all are done, and THE PATCHBAY MANTRA.',
    ],
    control: [
      'Tap an answer on each scenario. Wrong answers explain and you try again.',
      'Solve all ten to complete the page. On this last page, NEXT reads FINISH: it opens a list of anything not yet done. Gain Staging follows this lab in the Signal list.',
    ],
    changes: [
      'Each question mixes the lab’s ideas: identify a wiring, predict both jacks, find a broken normal, route without interrupting, replace a source, spot a hazard.',
    ],
    teaches: [
      'Every patchbay question comes back to one fact: when does this pair’s normal survive a plug?',
      'Know the wiring and the jack, and you can predict the result; know the result, and you can work back to the wiring.',
    ],
    tryThis: [
      'Before each answer, name the wiring and which jack moves, then predict.',
      'Want to review Full vs Half vs Thru — the table? Visit it before you start: leaving this page clears the answers you’ve solved so far.',
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
  intro: {
    learning: 'A review of the lab’s core idea: every pair’s behavior comes down to when its normal survives a plug, whether it is wired thru, full-normal or half-normal.',
    start: 'Tap any page still listed to open it and finish its task. Or tap REVIEW ▾ and reopen a page you found hard, such as Patchbay detective.',
  },
  seeing: [
    'Use this page to see where you are in the lab. The title reads WHAT’S LEFT, or LAB COMPLETE once you’ve finished every page.',
    'Each page you still have to do is listed by its number and name.',
    'Finished pages fold into one ✓ CREDITED line (✓ DONE if you’re not signed in).',
    'If your saved progress can’t be read, the title reads YOUR PROGRESS, and you can still open every page.',
  ],
  control: [
    'Tap any page still listed to jump straight to it.',
    'Tap REVIEW ▾ on the ✓ line to see your finished pages (HIDE ▴ folds them again), then tap one to open it.',
    'PRACTICE AGAIN FROM THE START opens page 1. It clears nothing.',
    'DONE · BACK TO LABS takes you out of the lab, back to the screen you opened it from.',
    '‹ PREV on the strip returns to the page you came from. Tap the WHAT’S LEFT readout to open CONTENTS.',
  ],
  changes: [
    'Pages 1, 2 and 13 are reading pages: each one is finished as soon as you leave it with NEXT.',
    'Every other page is finished once you do its task, such as lighting all its goal chips or answering every question right. NEXT (FINISH on the last page) still moves on, but the page stays listed.',
    'START OVER (PRACTICE), last in CONTENTS, asks first, then takes you back to page 1.',
  ],
  teaches: [
    'Thru pairs connect nothing until you patch. Full-normal pairs break on either jack. Common half-normal pairs break only on the bottom jack.',
    'A normal is a spring contact inside the jack, and a plug physically opens it.',
    'On a common half-normal pair, a top plug taps a copy without interrupting; a bottom plug replaces the source.',
  ],
  tryThis: [
    'A page still listed? Open the first one and finish its task. Pages 1, 2 and 13 are finished once you leave them with NEXT.',
    'Finished a page? Tap REVIEW ▾ and reopen one you found hard, such as Patchbay detective. Practicing again never takes away what you finished.',
    'Before you leave, say what a top plug does on a full-normal pair and on a half-normal pair. Then reopen the table page to confirm.',
  ],
};

/** PagedLab's `pageGuide`: page index (0-based) → that page's guide. The
 *  what's-left screen uses PATCHBAY_END_GUIDE instead (PagedLab's `endGuide`). */
export function patchbayPageGuide(index: number): ScreenGuide | undefined {
  return PATCHBAY_SCREEN_GUIDES[`p${index + 1}`];
}

/**
 * Audio Connectors & Cable Selection — "explain this screen" content (Screen
 * Guide rollout 2026-10-31, after the Wave Physics pilot). One guide per
 * page of the PagedLab, in page order: CONNECTOR_SELECT_PAGES pairs each id
 * with its PageDef title (pagesA–D), and the test pins that order against
 * the page files. There is no separate home: page 1 is the landing. The
 * PagedLab's what's-left screen has its own guide, CONNECTOR_SELECT_END_GUIDE
 * (PagedLab `endGuide`, titled WHERE YOU ARE), written against
 * kit/LabEndScreen + kit/labEnd as this lab drives them: credit mode
 * (creditLabKey af_connector_select), noun "page", no understanding check,
 * no optional pages, the default DONE · BACK TO LABS (safeGoBack).
 *
 * Every line was written against the page's own code (pagesA–D, bits, data/*,
 * engine/*): the names are the on-screen names (station tags, buttons, goal
 * chips, verdict rows), and every TRY THIS outcome is what the data and the
 * engines make the page show (tester lamps from engine/tester.ts lampFor,
 * verdict rows from engine/evaluate.ts, the final's 80% bar). Change a page →
 * update its guide; test/screenGuide_cable_20261031.test.ts pins the shape.
 *
 * Reading pages (no Rack Unit): regions are off, every step is a bottom card.
 * Copy rules: plain language, short sentences; knowledge, never skills; no
 * gear brand names; no "N of total"; "suggest", never "recommend".
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';

/** Page order = PagedLab order (pagesA → pagesD). `title` is the PageDef
 *  title, verbatim, so a reorder or rename fails the test. */
export const CONNECTOR_SELECT_PAGES = [
  { id: 'threeThings', title: 'Connector, cable, signal' },
  { id: 'samePlug', title: 'The same plug, two jobs' },
  { id: 'benchAnalog', title: 'The bench: analog' },
  { id: 'benchSpeaker', title: 'The bench: loudspeaker' },
  { id: 'benchDigital', title: 'The bench: digital & MIDI' },
  { id: 'jobsMatrix', title: 'Same connector, different job' },
  { id: 'declare', title: 'Declare before you connect' },
  { id: 'inside', title: 'Inside the cable' },
  { id: 'buildStage', title: 'Build the system: stage basics' },
  { id: 'buildMonitors', title: 'Build the system: monitors & power' },
  { id: 'buildSources', title: 'Build the system: sources & data' },
  { id: 'tester', title: 'The cable tester' },
  { id: 'faultFinder', title: 'Fault finder' },
  { id: 'safety', title: 'Safety & professional practice' },
  { id: 'myths', title: 'The misconceptions challenge' },
  { id: 'final', title: 'Final: you’re on the job' },
] as const;

export type ConnectorSelectPageId = (typeof CONNECTOR_SELECT_PAGES)[number]['id'];

export const CONNECTOR_SELECT_SCREEN_GUIDES: Record<ConnectorSelectPageId, ScreenGuide> = {
  // ── Page 1 · Station 1 ────────────────────────────────────────────────────
  threeThings: {
    seeing: [
      'STATION 1 · CONNECTOR, CABLE AND SIGNAL: three separate things in every cable.',
      'THE CENTRAL LESSON card, then a photo of a mic cable stripped back and THE EXPLODED CABLE drawing with tap zones.',
      'Eight part buttons, from Cable connector (plug) to Strain relief, and ASK THESE FOUR QUESTIONS — EVERY TIME, FOREVER.',
      'Goal chips at the bottom: ○ not yet, ✓ done.',
    ],
    control: [
      'Tap a zone on the drawing, or a part button below it: the part’s name and job appear.',
      'Tap each of the four questions to open why it matters.',
      'The page is done when both goals are checked: all 8 parts tapped, all 4 questions opened. NEXT at the bottom moves on; the strip under the title jumps between pages.',
    ],
    changes: [
      'Each tap names one part and its job. Only the plug is usually looked at; the parts inside decide whether the cable suits the job.',
      'The signal is in neither the connector nor the cable — the equipment puts it there.',
      'The four questions run in order: fit, signal, construction, safety. Fit is only the first test.',
    ],
    teaches: [
      'Connector, cable construction and signal are three different things.',
      'The four questions this whole lab is built on.',
      'It follows Cable & Connector Fundamentals and opens this lab’s seven stations.',
    ],
    tryThis: [
      'Tap Strain relief: it is the most common failure point on any cable.',
      'Open 1 · Does it physically fit?: passing it proves geometry, nothing else.',
      'Tap Outer jacket: its printing declares the construction — read it instead of guessing from the plug.',
    ],
  },

  // ── Page 2 · Station 1 ────────────────────────────────────────────────────
  samePlug: {
    seeing: [
      'STATION 1 · THE SAME PLUG, TWO JOBS: one 1/4-inch TRS plug, photographed.',
      'Two job buttons, BALANCED MONO and STEREO PHONES, with the job’s use and the role of TIP, RING and SLEEVE.',
      'A one-question check and two goal chips.',
    ],
    control: [
      'Tap BALANCED MONO (shown first) or STEREO PHONES to switch the contact roles.',
      'Answer the check. A wrong answer explains why and stays open.',
      'Goals: view both jobs, pass the check.',
    ],
    changes: [
      'Same tip, ring and sleeve — only the ASSIGNMENT changes.',
      'Balanced mono: tip and ring carry one signal on two legs, the sleeve is the shield. Stereo: tip is left, ring is right, the sleeve is the shared return.',
      'Only the panel label and the documentation say which job a jack does.',
    ],
    teaches: [
      'TRS means three contacts — not stereo, and not balanced.',
      'The equipment, not the plug, decides the job.',
      'The whole lab in one plug. Next: the identification benches.',
    ],
    tryThis: [
      'Switch between BALANCED MONO and STEREO PHONES and watch RING: Signal − (inverting, “cold”) becomes Right channel.',
      'In the check, pick “The number of contacts on the plug”: balanced, stereo and insert jacks all use three, so the count cannot tell you.',
    ],
  },

  // ── Page 3 · Station 2 ────────────────────────────────────────────────────
  benchAnalog: {
    seeing: [
      'STATION 2 · IDENTIFICATION BENCH — ANALOG: seven core analog connectors, one button each.',
      'FIND A CONNECTOR — ALL FAMILIES: a search box over every connector in the lab.',
      'An open card shows ALSO CALLED, CONTACTS, MAY CARRY, TYPICALLY FROM, TYPICALLY INTO, RETENTION, MOST COMMON MISTAKE and, where needed, SAFETY.',
    ],
    control: [
      'Tap a connector’s name to open its card; tap again to close it.',
      'Type at least two letters of a name or nickname to search all families. An analog card opened from search counts toward the goal too.',
      'Goal: open 4 connector cards.',
    ],
    changes: [
      'Every fact comes from the verified connector records shared with the Fundamentals lab.',
      'MAY CARRY often lists more than one signal: the shape alone never tells you which one is on it.',
      'RETENTION tells friction from a real lock — what keeps the plug in.',
    ],
    teaches: [
      'What each everyday analog connector looks like and what it may carry.',
      'The most common mistake made with each one.',
      'Builds on the same-plug page; next bench: loudspeaker connections.',
    ],
    tryThis: [
      'Search “aux”: the nickname finds the 3.5 mm plug.',
      'Open the 3-pin XLR card: MAY CARRY lists more than mic audio.',
      'Open RCA and read MAY CARRY: analog and digital audio share the same shell.',
    ],
  },

  // ── Page 4 · Station 2 ────────────────────────────────────────────────────
  benchSpeaker: {
    seeing: [
      'STATION 2 · IDENTIFICATION BENCH — LOUDSPEAKER: six connections that carry amplifier power.',
      'THE FAMILY RULE: speaker level is tens of volts and real current, not line level.',
      'The same bench cards: CONTACTS, MAY CARRY, RETENTION, MOST COMMON MISTAKE, SAFETY.',
    ],
    control: [
      'Tap a connector’s name to open or close its card.',
      'Goal: open 3 connector cards.',
    ],
    changes: [
      'Everything here carries speaker-level signal: heavy unshielded conductors, connected with the amplifier OFF.',
      'A speaker output into a mic or line input can damage that input.',
      'The legacy 1/4-inch plug looks exactly like an instrument plug — only the cable tells them apart.',
    ],
    teaches: [
      'What each loudspeaker connector looks like, and its safety rules.',
      'Why amplifier outputs never go into inputs.',
      'Follows the analog bench; next: digital, data and MIDI.',
    ],
    tryThis: [
      'Open the bare-wire card: MOST COMMON MISTAKE is stripping too much insulation, leaving copper outside the terminal.',
      'Open the legacy 1/4-inch TS card: MOST COMMON MISTAKE is using an instrument cable as a loudspeaker cable.',
    ],
  },

  // ── Page 5 · Station 2 ────────────────────────────────────────────────────
  benchDigital: {
    seeing: [
      'STATION 2 · IDENTIFICATION BENCH — DIGITAL, DATA & MIDI: nine connectors, from USB to MIDI.',
      'The same bench cards: CONTACTS, MAY CARRY, TYPICALLY FROM / INTO, RETENTION, MOST COMMON MISTAKE.',
      'Two goal chips.',
    ],
    control: [
      'Tap a connector’s name to open or close its card.',
      'Goal chips: Open four cards, and Open the MIDI card.',
    ],
    changes: [
      'These are protocol connections: a plug that fits proves nothing about what the two devices can say to each other.',
      'MAY CARRY shows data, audio, power or control — sometimes several on one plug.',
    ],
    teaches: [
      'What USB, optical, HDMI, network, BNC and MIDI connectors look like.',
      'Why the protocol decides compatibility.',
      'Ends Station 2; Station 3 asks what each connector really does.',
    ],
    tryThis: [
      'Open the MIDI card: its flag reads MIDI DATA — NOT AUDIO, and MAY CARRY says Control data.',
      'Open USB-C, then HDMI: each card opens with a flag on what varies by port and by cable.',
    ],
  },

  // ── Page 6 · Station 3 ────────────────────────────────────────────────────
  jobsMatrix: {
    seeing: [
      'STATION 3 · SAME CONNECTOR, DIFFERENT JOB: the heart of the lab.',
      'A rule card, then a sideways row of connector families — 8 FAMILIES — SWIPE →.',
      'The open family: a photo, a headline, and a list of jobs to mark — some real, some impostors.',
    ],
    control: [
      'Swipe the row and tap a family; 3-pin XLR is open first.',
      'Tap a job to mark it ☑ (tap again to clear). Then CHECK MY MARKS.',
      'Any row judged wrong turns red — a marked impostor or a real job you left unmarked. TRY AGAIN clears the judgment so you can fix it. A ✓ marks a solved family.',
      'Goal: match all jobs on 3 connector families.',
    ],
    changes: [
      'A failed check shows WHICH rows are wrong, but not why — so the retry is real thinking.',
      'Only a fully correct set shows each row’s reason: ✓ REAL JOB or ✕ NOT A JOB.',
      'One shell can do several real jobs and still not do the one that only looks right.',
    ],
    teaches: [
      'What each common connector family genuinely carries — and what it only seems to.',
      'Why the connector never identifies the signal.',
      'After the benches; next you declare the signal before you connect.',
    ],
    tryThis: [
      'Open 1/4-inch TRS: three jobs share three contacts, and stereo is only one of them.',
      'Mark every job on a family, then CHECK MY MARKS: the impostors turn red.',
      'Solve HDMI and read why ARC/eARC sends audio back the other way.',
    ],
  },

  // ── Page 7 · Station 3 ────────────────────────────────────────────────────
  declare: {
    seeing: [
      'STATION 3 · DECLARE BEFORE YOU CONNECT: three real panel jacks, each a common connector with an unusual job.',
      'Each card: a photo, the setup, the signal question and, once declared, the cable question.',
      'THE CENTRAL LESSON and one goal chip.',
    ],
    control: [
      'Read the setup, then tap the signal the equipment expects.',
      'Only after the right signal does the cable question appear. Tap the cable.',
      'Goal: declare and solve all 3 connections.',
    ],
    changes: [
      'Until you declare the signal, the page will not judge compatibility — that is the point.',
      'A wrong signal sends you back to the panel LABEL. A wrong cable reminds you the construction must match the signal.',
      'A right pair shows ✓ COMPATIBLE — and what the fitting-but-wrong cable would do.',
    ],
    teaches: [
      'Name the signal first, from the label, then choose the cable built for it.',
      'Digital XLR and RCA need cable with a set impedance; an insert jack needs an insert cable.',
      'Leads into Station 4: what is inside the cable.',
    ],
    tryThis: [
      'On “AES OUT”, pick Analog microphone signal: the page sends you back to the panel LABEL, and the cable question stays hidden.',
      'On “COAXIAL DIGITAL OUT”, try Any RCA interconnect that fits: the construction must match the signal.',
      'On “CH 5 INSERT”, look before you pick: until a signal is declared, no cable question shows — the page will not judge compatibility yet.',
    ],
  },

  // ── Page 8 · Station 4 ────────────────────────────────────────────────────
  inside: {
    seeing: [
      'STATION 4 · WHAT IS INSIDE THE CABLE: eight cable builds — 8 CONSTRUCTIONS — SWIPE →.',
      'A labeled cross-section drawing beside a photo of THE CUT END, ON THE BENCH, then the layers, numbered outside in, and BUILT FOR.',
      'THE REQUIRED COMPARISON: instrument cable vs speaker cable. Then a note and a check.',
    ],
    control: [
      'Swipe the row and tap a construction; a ✓ marks each one viewed.',
      'Answer the check; a wrong answer explains why and stays open.',
      'Goals: view all 8 constructions, pass the check.',
    ],
    changes: [
      'Each build matches one job: shielded pair for mic and balanced line, heavy conductors for speaker current, 75-ohm coax for S/PDIF, word clock and video, category pairs for networks.',
      'The jacket hides this part — and it decides whether the connection works.',
      'A continuity tester cannot tell instrument cable from speaker cable; both pass.',
    ],
    teaches: [
      'The eight common cable builds and the job each is built for.',
      'Why the jacket printing and the construction — not the plug — identify a cable.',
      'Next: Station 5, where these builds are chosen for real systems.',
    ],
    tryThis: [
      'Compare Balanced shielded twisted pair with Heavy-gauge speaker cable: look at the shield and the conductor size.',
      'Open 75-ohm coaxial digital cable and read BUILT FOR.',
      'In the check, pick “A continuity test across both ends”: both cables pass it the same way.',
    ],
  },

  // ── Pages 9–11 · Station 5 ────────────────────────────────────────────────
  buildStage: {
    seeing: [
      'STATION 5 · BUILD THE SYSTEM — STAGE BASICS: four real connections, one card each.',
      'Each card: the job, a FROM → TO pair of devices and ports, and a tray of cables.',
      'After a pick: the cable’s two ends, and four verdict rows — 1 · Physically fits, 2 · Signal the equipment expects, 3 · Cable construction correct, 4 · Connection safe.',
    ],
    control: [
      'Tap a cable in the tray. You can try as many as you like.',
      'The right cable shows ✓ CORRECT CABLE and puts a ✓ on the card’s title.',
      'Goal: connect all 4 systems correctly.',
    ],
    changes: [
      'Each row shows a green ✓, a red ✕, or a gold ? marked UNVERIFIED; a label below names the problem, such as WRONG SIGNAL LEVEL.',
      'A cable that does not fit was never tested further, so rows 2–4 read UNVERIFIED.',
      'FITS — BUT VERIFY: it mates, but nothing else is proven yet.',
    ],
    teaches: [
      'How the four questions judge a real cable choice.',
      'Mic, phantom-powered mic, guitar through a DI, and a stereo keyboard.',
      'After Station 4; next page: monitors and power.',
    ],
    tryThis: [
      'Dynamic microphone → mixer: pick the 1/4-inch TS instrument cable — DOES NOT FIT, and rows 2–4 read UNVERIFIED.',
      'Same card: pick the XLR-shell lighting/data cable — FITS — BUT VERIFY. It fits, which proves nothing.',
      'Stereo keyboard: one Y-cable into one input reads TWO OUTPUTS JOINED — signal and safety both fail.',
    ],
  },

  buildMonitors: {
    seeing: [
      'STATION 5 · BUILD THE SYSTEM — MONITORS & POWER: four more connections.',
      'Line level, speaker level, a headset — and the connection most likely to damage equipment.',
      'The same FROM → TO pair, cable tray, cable ends and four verdict rows.',
    ],
    control: [
      'Tap a cable in the tray; try as many as you like.',
      'The right cable shows ✓ CORRECT CABLE.',
      'Goal: connect all 4 systems correctly.',
    ],
    changes: [
      'A powered loudspeaker takes line level; its amplifier is inside the box.',
      'A passive loudspeaker takes amplifier power on heavy conductors.',
      'SPEAKER OUTPUT INTO AN INPUT fails both signal and safety: it can overdrive and damage the input.',
    ],
    teaches: [
      'How powered and passive loudspeakers are fed.',
      'Why headphones and headsets differ by one contact.',
      'Next page: sources and data.',
    ],
    tryThis: [
      'Power amplifier → passive loudspeaker: pick the cable from amp output → mixer LINE INPUT — SPEAKER OUTPUT INTO AN INPUT.',
      'Same card: the instrument cable with adapters reads WRONG CABLE CONSTRUCTION, and row 4 shows a red ✕ too.',
      'Headphones vs headset: the 3-contact headphones fit and play, but have no mic path.',
    ],
  },

  buildSources: {
    seeing: [
      'STATION 5 · BUILD THE SYSTEM — SOURCES & DATA: four modern connections.',
      'A turntable, a television, a computer and a networked stagebox.',
      'The same FROM → TO pair, cable tray, cable ends and four verdict rows.',
    ],
    control: [
      'Tap a cable in the tray; try as many as you like.',
      'The right cable shows ✓ CORRECT CABLE.',
      'Goal: connect all 4 systems correctly.',
    ],
    changes: [
      'Phono level needs the PHONO input: a line input has no phono gain or tone curve.',
      'PROTOCOL MISMATCH: the plug fits, but the port expects a different kind of data.',
      'Some USB-C and network cables fit yet lack what the job needs — FITS — BUT VERIFY.',
    ],
    teaches: [
      'How phono, HDMI audio return, USB and network links are chosen.',
      'Why identical plugs can lead to different worlds.',
      'Ends Station 5; next, the cable tester.',
    ],
    tryThis: [
      'Turntable: the same RCA pair into the CD/LINE input reads WRONG SIGNAL LEVEL — faint and thin.',
      'Television: HDMI into a non-ARC input reads PROTOCOL MISMATCH.',
      'Computer: a charge-only USB-C cable reads FITS — BUT VERIFY. It may carry no data.',
    ],
  },

  // ── Page 12 · Station 6 ───────────────────────────────────────────────────
  tester: {
    seeing: [
      'STATION 6 · THE CABLE TESTER: four cables, each ON THE BENCH with a note on where it came from.',
      'A key of the contacts, a drawn tester with a lamp, END A and END B columns, and FLEX THE CABLE, INSPECT and RESEAT PLUG.',
      'Diagnosis answers below, LOCKED until you have tested enough.',
    ],
    control: [
      'Tap one contact under END A and one under END B: the lamp reads LIT, DARK or FLICKERING.',
      'FLEX THE CABLE bends it while you test. INSPECT shows what the connector looks like. RESEAT PLUG pushes it fully home.',
      'After two different pairs and INSPECT, the diagnosis unlocks. Tap an answer; a wrong one stays open.',
      'Goal: diagnose all 4 cables.',
    ],
    changes: [
      'The lamp lights only when a path joins those two contacts.',
      'A healthy cable lights every straight pair — 1→1, 2→2, 3→3 — and nothing else.',
      'Dark on a straight pair means no path between them: a break, or a wire landed somewhere else. Lit on a cross pair means two contacts are joined: a short, or a swap. Test the cross pairs too before deciding.',
    ],
    teaches: [
      'How continuity testing reads, and the habits behind it: test every pair, flex, inspect.',
      'Opens, shorts, a missing shield and reversed pins.',
      'Next: the fault finder, with harder cables.',
    ],
    tryThis: [
      'XLR from the dead-vocal channel: test 1 to 1 — LIT, 2 to 2 — DARK, 3 to 3 — LIT. Which conductor never arrives?',
      'XLR from the borrowed-gear bin: 2 to 2 is DARK, but 2 to 3 is LIT. Test 3 to 2 as well — what does that pattern mean?',
      'TRS from the crackling monitor send: T to T is LIT — and T to R is LIT too. Which two contacts are joined that should never touch?',
    ],
  },

  // ── Page 13 · Station 6 ───────────────────────────────────────────────────
  faultFinder: {
    seeing: [
      'STATION 6 · FAULT FINDER: five more cables on the same tester.',
      'Two of them PASS a resting continuity test and are still wrong.',
      'Each rig: lamp, END A / END B, FLEX THE CABLE, INSPECT, RESEAT PLUG, and the diagnosis.',
      'The RCA pair has four test points: L·C, L·S, R·C, R·S — left and right, center and shell.',
    ],
    control: [
      'Pick a contact on each end and read the lamp.',
      'Flex, inspect and reseat as needed; the diagnosis unlocks after two pairs and INSPECT.',
      'Goal: diagnose all 5 cables.',
    ],
    changes: [
      'An intermittent break passes at rest; FLICKERING appears only while you flex.',
      'A bent pin reads the same as a broken wire — only INSPECT tells them apart. A half-seated plug reads DARK everywhere until RESEAT PLUG.',
      'A wrong cable type lights every straight path — the tester cannot see gauge or shielding. (On a TS cable, ring and sleeve also read joined: that is the plug’s one long sleeve.)',
    ],
    teaches: [
      'What a continuity tester cannot tell you: cable type, impedance, or WHY a path is dark — a broken wire, a bent pin and an unseated plug read alike.',
      'Why to flex, inspect and reseat before blaming the cable.',
      'Next: Station 7, safety and professional practice.',
    ],
    tryThis: [
      'Headphone extension: every straight path is LIT at rest. Turn on FLEX THE CABLE and test tip to tip — FLICKERING.',
      'Cable from the dead stage drop: everything reads DARK. Tap RESEAT PLUG, then test 1 to 1 again — LIT.',
      'The 1/4-inch cable for the amp-to-cabinet run: every straight path lights. INSPECT shows the jacket reads INSTRUMENT CABLE.',
    ],
  },

  // ── Page 14 · Station 7 ───────────────────────────────────────────────────
  safety: {
    seeing: [
      'STATION 7 · SAFETY & PROFESSIONAL PRACTICE: nine rules, one card each, with why it matters.',
      'COILING & ROUTING LIVE NEXT DOOR: a link to the Cable Dressing & Installation lab.',
      'One goal chip.',
    ],
    control: [
      'Read each rule and tap I WILL WORK THIS WAY. It turns to ✓ ACKNOWLEDGED.',
      'OPEN CABLE DRESSING & INSTALLATION goes to that lab.',
      'Goal: Acknowledge all 9 rules.',
    ],
    changes: [
      'Each rule closes a common way to damage equipment, lose a show or hurt someone.',
      'Amplifiers come on LAST and go off FIRST: upstream gear thumps as it powers up or down, and with the amplifiers off nobody hears it.',
      'A plain wired adapter changes only the shape — never level, impedance, balance or protocol.',
    ],
    teaches: [
      'The nine working rules professionals keep without thinking.',
      'Why the AC safety ground is never defeated to cure hum.',
      'Leads to the misconceptions challenge, then the final.',
    ],
    tryThis: [
      'Tap I WILL WORK THIS WAY on the AC safety ground rule: it turns to ✓ ACKNOWLEDGED. Its reason: the ground makes a fault trip the breaker instead of leaving the chassis live.',
      'Compare the Y-cable rule with the adapter rule: both say a plain passive part cannot do an active job — combining is a mixer’s job; converting takes a pad, transformer or DI.',
    ],
  },

  // ── Page 15 ───────────────────────────────────────────────────────────────
  myths: {
    seeing: [
      'THE MISCONCEPTIONS CHALLENGE: nine claims heard on real gigs, shuffled.',
      'Each card: the claim, and TRUE / FALSE.',
      'One goal chip.',
    ],
    control: [
      'Read each claim, then tap TRUE or FALSE.',
      'A TRUE pick shows the correction and stays open until you settle it on FALSE.',
      'Goal: Bust all 9 myths.',
    ],
    changes: [
      'Each answer shows the correction — the fact behind the myth.',
      'The claims all sound reasonable because the connector fits. That is the trap.',
    ],
    teaches: [
      'The common beliefs that cost shows: TRS means stereo, XLR means mic, balanced means stereo, fit means compatible.',
      'One step before the final.',
    ],
    tryThis: [
      'On “MIDI cables carry musical audio”, tap TRUE: the correction says MIDI carries instructions.',
      'On “Balanced means stereo”, tap TRUE: the correction says balanced is a noise-rejection scheme — one signal on two conductors.',
    ],
  },

  // ── Page 16 · Final ───────────────────────────────────────────────────────
  final: {
    seeing: [
      'FINAL · YOU’RE ON THE JOB: twelve questions drawn fresh every attempt.',
      'Identification, cable selection, same-connector traps, faults and safety. Some are marked SAFETY-CRITICAL.',
      'The pass bar: 80%, and every safety-critical call right.',
    ],
    control: [
      'CLOCK IN — DRAW MY 12 starts. Tap one answer per question; it locks and shows the explanation.',
      'TURN IN THE JOB SHEET grades once all twelve are answered.',
      'NEW ATTEMPT — FRESH DRAW redraws. After a pass, RUN IT AGAIN ANYWAY.',
    ],
    changes: [
      'The score is the share right, rounded. 80% or more passes — unless a SAFETY-CRITICAL call was missed.',
      'A missed safety call outweighs any score, so the result reads NOT YET.',
      'Every retry draws a new set; the explanations are the study sheet.',
    ],
    teaches: [
      'The lab’s four questions — fit, signal, construction, safety — applied to twelve mixed calls, and why a missed safety call outweighs any score.',
      'Next in Audio Fundamentals: Cable Dressing & Installation.',
    ],
    tryThis: [
      'Ten right with no safety miss scores 83% and passes. Nine right is 75% — NOT YET.',
      'Miss one SAFETY-CRITICAL question and score high anyway: it still reads NOT YET.',
    ],
  },
};

/** PagedLab's `endGuide`: the what's-left screen (FINISH › on the last page,
 *  or WHAT'S LEFT › in the contents). Every page here marks ITSELF done when
 *  its goal chips all tick (manualDone + useVisitGoals) and banks `p<n>`
 *  credit; the Final's goal is a pass (80% + every safety call). */
export const CONNECTOR_SELECT_END_GUIDE: ScreenGuide = {
  seeing: [
    "WHAT'S LEFT: each page not finished yet, by name. With none left the title reads LAB COMPLETE.",
    'Finished pages fold into one ✓ CREDITED row (✓ DONE when you are not signed in or are in a preview); REVIEW ▾ lists them.',
    'The line under the title says how much is left and whether your work is saved.',
    'If your progress cannot be read, the title reads YOUR PROGRESS, a note says why, and every page still opens.',
  ],
  control: [
    'Tap a page’s row to jump straight to it.',
    'REVIEW ▾ on the ✓ row unfolds the finished pages; tap any one to open it again.',
    'PRACTICE AGAIN FROM THE START opens page 1 and clears nothing.',
    'DONE · BACK TO LABS leaves the lab, back to the screen you opened it from. ‹ PREV returns to the page you were on.',
  ],
  changes: [
    'A page counts once all its goal chips read ✓ in one visit; leave early and they reset to ○. NEXT and FINISH never mark it.',
    'The Final counts only after a pass: 80% and every safety call right.',
    'Finished pages are credited to your account. Signed out, the line under the title says if signing in can still keep them; a preview earns nothing. START OVER (PRACTICE) in the contents resets goal chips, never credit.',
  ],
  teaches: [
    'Which pages of the lab, from “Connector, cable, signal” to the Final, you have not finished yet.',
    'Every page can be redone for practice at any time; practicing never removes credit you have earned.',
  ],
  tryThis: [
    'Jump to the first page still listed and find its goal chips at the bottom: each ○ is a goal not met yet.',
    'Tap REVIEW ▾ and reopen a finished page you found hard — practicing it never removes its credit.',
  ],
};

/** PagedLab's `pageGuide`: page index → its guide (undefined past the end). */
export function connectorSelectPageGuide(index: number): ScreenGuide | undefined {
  const page = CONNECTOR_SELECT_PAGES[index];
  return page ? CONNECTOR_SELECT_SCREEN_GUIDES[page.id] : undefined;
}

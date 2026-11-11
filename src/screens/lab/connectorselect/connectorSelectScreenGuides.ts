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
    intro: {
      learning: 'Why connector, cable construction and signal are three separate things, and the four questions that judge any connection: fit, signal, construction, safety.',
      start: 'Tap each part on THE EXPLODED CABLE, starting with Strain relief and Outer jacket. Then open each question under ASK THESE FOUR QUESTIONS — EVERY TIME, FOREVER.',
    },
    seeing: [
      'You’re at STATION 1 · CONNECTOR, CABLE AND SIGNAL. Read THE CENTRAL LESSON card: every cable is really three separate things.',
      'The photo shows a mic cable stripped back. THE EXPLODED CABLE pulls the same cable apart into zones you can tap.',
      'Below sit eight part buttons, from Cable connector (plug) to Strain relief, then ASK THESE FOUR QUESTIONS — EVERY TIME, FOREVER and your goal chips: ○ not yet, ✓ done.',
    ],
    control: [
      'Tap a zone on the drawing, or a part button below it, to see that part’s name and its job.',
      'Tap each of the four questions to open why it matters.',
      'Both goal chips check once you’ve tapped all 8 parts and opened all 4 questions.',
      'NEXT at the bottom moves on. The strip under the title jumps to any page.',
    ],
    changes: [
      'Each tap names one part and its job. People usually look only at the plug, but the parts inside decide whether the cable suits the job.',
      'The signal is in neither the connector nor the cable. The equipment at each end puts it there.',
      'The four questions run in order: fit, signal, construction, safety. Fit is only the first test.',
    ],
    teaches: [
      'Connector, cable construction and signal are three different things. A plug that fits tells you nothing about the other two.',
      'Every connection is judged by four questions, in order: does it physically fit, what signal does the equipment expect, is the cable built for that signal, and is it safe?',
    ],
    tryThis: [
      'Tap Strain relief. It’s the most common failure point on any cable, so it’s the first place to look when one acts up.',
      'Open 1 · Does it physically fit? Passing it proves the geometry, nothing else.',
      'Tap Outer jacket. Its printing declares how the cable is built, so read it instead of guessing from the plug.',
    ],
  },

  // ── Page 2 · Station 1 ────────────────────────────────────────────────────
  samePlug: {
    intro: {
      learning: 'Why TRS only means three contacts: the same plug can carry one balanced mono signal or a stereo pair, and the equipment decides which.',
      start: 'Tap BALANCED MONO, then STEREO PHONES, and watch what TIP, RING and SLEEVE carry in each job. Then answer the check below.',
    },
    seeing: [
      'You’re at STATION 1 · THE SAME PLUG, TWO JOBS. The photo shows one 1/4-inch TRS plug, and this whole page is about that one plug.',
      'Two job buttons, BALANCED MONO and STEREO PHONES, show what each job is used for and what TIP, RING and SLEEVE carry in it.',
      'Below them are a one-question check and two goal chips.',
    ],
    control: [
      'Tap BALANCED MONO (shown first) or STEREO PHONES to switch what each contact carries.',
      'Answer the check. A wrong answer explains why and stays open so you can try again.',
      'The goals: view both jobs and pass the check.',
    ],
    changes: [
      'The tip, ring and sleeve never move. Only their ASSIGNMENT changes.',
      'In BALANCED MONO, tip and ring carry one signal on two legs and the sleeve is the shield. In STEREO PHONES, tip is left, ring is right and the sleeve is the shared return.',
      'Nothing on the plug says which job a jack does. Only the panel label and the documentation tell you.',
    ],
    teaches: [
      'TRS means three contacts: tip, ring and sleeve. It doesn’t mean stereo, and it doesn’t mean balanced.',
      'The equipment, not the plug, decides the job.',
    ],
    tryThis: [
      'Switch between BALANCED MONO and STEREO PHONES and watch RING: Signal − (inverting, “cold”) becomes Right channel.',
      'In the check, pick “The number of contacts on the plug”. Balanced, stereo and insert jacks all use three, so the count can’t tell you the job.',
    ],
  },

  // ── Page 3 · Station 2 ────────────────────────────────────────────────────
  benchAnalog: {
    intro: {
      learning: 'What each everyday analog connector looks like, what signals it may carry and what holds it in, and why its shape alone never tells you the signal.',
      start: 'Tap a connector’s name to open its card and read MAY CARRY. Or type “aux” into FIND A CONNECTOR — ALL FAMILIES to search by nickname.',
    },
    seeing: [
      'You’re at STATION 2 · IDENTIFICATION BENCH — ANALOG: seven core analog connectors, one button each.',
      'FIND A CONNECTOR — ALL FAMILIES is a search box that covers every connector in the lab, not just this bench.',
      'Each card lists ALSO CALLED, CONTACTS, MAY CARRY, TYPICALLY FROM, TYPICALLY INTO, RETENTION and MOST COMMON MISTAKE, plus SAFETY where it matters.',
    ],
    control: [
      'Tap a connector’s name to open its card. Tap it again to close it.',
      'Type at least two letters of a name or nickname to search every family. An analog card you open from search counts toward the goal too.',
      'The goal: open 4 connector cards.',
    ],
    changes: [
      'MAY CARRY often lists more than one signal. The shape alone never tells you which one is on it.',
      'RETENTION tells you what keeps the plug in: friction only, or a real lock.',
      'MOST COMMON MISTAKE names the error people make most with that connector, so you know it before you meet it on a job.',
    ],
    teaches: [
      'What each everyday analog connector looks like, what it may carry, and whether friction or a lock holds it in.',
      'The mistake most often made with each one.',
      'Why a connector’s shape can’t tell you which signal is on it: one shell often carries several.',
    ],
    tryThis: [
      'Search “aux”. The nickname finds the 3.5 mm plug.',
      'Open the 3-pin XLR card. MAY CARRY lists more than mic audio.',
      'Open RCA and read MAY CARRY. Analog and digital audio share the same shell.',
    ],
  },

  // ── Page 4 · Station 2 ────────────────────────────────────────────────────
  benchSpeaker: {
    intro: {
      learning: 'Why loudspeaker connections are a family of their own: speaker level is tens of volts and real current, so these connectors come with their own safety rules.',
      start: 'Read THE FAMILY RULE first. Then tap a connector’s name to open its card, starting with the bare-wire card, and read MOST COMMON MISTAKE and SAFETY.',
    },
    seeing: [
      'You’re at STATION 2 · IDENTIFICATION BENCH — LOUDSPEAKER: six connections that carry amplifier power.',
      'Read THE FAMILY RULE: speaker level is tens of volts and real current, not line level.',
      'Each card has the bench rows you know: CONTACTS, MAY CARRY, RETENTION, MOST COMMON MISTAKE and SAFETY.',
    ],
    control: [
      'Tap a connector’s name to open its card. Tap it again to close it.',
      'The goal: open 3 connector cards.',
    ],
    changes: [
      'Everything here carries speaker-level signal on heavy unshielded conductors, and you connect it with the amplifier OFF.',
      'A speaker output plugged into a mic or line input can damage that input.',
      'The legacy 1/4-inch plug looks exactly like an instrument plug. Only the cable behind it tells them apart.',
    ],
    teaches: [
      'What each loudspeaker connector looks like, and the safety rules that come with it.',
      'Why an amplifier output never goes into an input: speaker level is far stronger than the mic or line level the input is built for.',
      'Why speaker cable uses heavy conductors: it carries real current, not a small signal.',
    ],
    tryThis: [
      'Open the bare-wire card. MOST COMMON MISTAKE is stripping too much insulation, which leaves copper outside the terminal.',
      'Open the legacy 1/4-inch TS card. MOST COMMON MISTAKE is using an instrument cable as a loudspeaker cable.',
    ],
  },

  // ── Page 5 · Station 2 ────────────────────────────────────────────────────
  benchDigital: {
    intro: {
      learning: 'Why digital, data and MIDI connections are judged by protocol: a plug that fits proves nothing about what the two devices can say to each other.',
      start: 'Open the MIDI card and read its flag and MAY CARRY. Then open USB-C and HDMI and compare their flags: each says what varies by port and by cable.',
    },
    seeing: [
      'You’re at STATION 2 · IDENTIFICATION BENCH — DIGITAL, DATA & MIDI: nine connectors, from USB to MIDI.',
      'Each card has the bench rows you know: CONTACTS, MAY CARRY, TYPICALLY FROM / INTO, RETENTION and MOST COMMON MISTAKE.',
      'Some cards open with a flag, a short warning such as MIDI DATA — NOT AUDIO. Two goal chips sit at the bottom.',
    ],
    control: [
      'Tap a connector’s name to open its card. Tap it again to close it.',
      'The two goals: Open four cards, and Open the MIDI card.',
    ],
    changes: [
      'These are protocol connections. A plug that fits proves nothing about what the two devices can say to each other.',
      'MAY CARRY shows data, audio, power or control, and sometimes several of them on one plug.',
    ],
    teaches: [
      'What USB, optical, HDMI, network, BNC and MIDI connectors look like.',
      'Why the protocol, the agreed language two devices use, decides whether they work together, not the plug.',
      'Why a MIDI cable carries control data, not sound.',
    ],
    tryThis: [
      'Open the MIDI card. Its flag reads MIDI DATA — NOT AUDIO, and MAY CARRY says Control data.',
      'Open USB-C, then HDMI. Each card opens with a flag on what varies by port and by cable.',
    ],
  },

  // ── Page 6 · Station 3 ────────────────────────────────────────────────────
  jobsMatrix: {
    intro: {
      learning: 'What each common connector family genuinely carries and which jobs only look right: one shell can do several real jobs and still not the one you assume.',
      start: '3-pin XLR is open first. Tap each job you think is real to mark it ☑, then tap CHECK MY MARKS. Then swipe the row and try 1/4-inch TRS.',
    },
    seeing: [
      'You’re at STATION 3 · SAME CONNECTOR, DIFFERENT JOB, the heart of the lab.',
      'A rule card sits at the top. Below it, a sideways row of connector families reads 8 FAMILIES — SWIPE →.',
      'The open family shows a photo, a headline and a list of jobs to mark. Some jobs are real; some are impostors that only look right.',
    ],
    control: [
      'Swipe the row and tap a family. 3-pin XLR is open first.',
      'Tap a job to mark it ☑, or tap it again to clear it. Then tap CHECK MY MARKS.',
      'Any row judged wrong turns red: an impostor you marked, or a real job you left unmarked. TRY AGAIN clears the judgment so you can fix it. A ✓ marks each family you solve.',
      'The goal: match all jobs on 3 connector families.',
    ],
    changes: [
      'A failed check shows which rows are wrong, but not why, so your second try takes real thinking.',
      'Only a fully correct set shows each row’s reason: ✓ REAL JOB or ✕ NOT A JOB.',
      'One shell can do several real jobs and still not do the one that only looks right.',
    ],
    teaches: [
      'What each common connector family genuinely carries, and what it only seems to.',
      'Why the connector never identifies the signal: the equipment and its panel label do.',
      'How to judge each job on its own, instead of by what the plug suggests.',
    ],
    tryThis: [
      'Open 1/4-inch TRS. Three jobs share the same three contacts, and stereo is only one of them.',
      'Mark every job on a family, then tap CHECK MY MARKS. The impostors turn red.',
      'Solve HDMI and read why ARC/eARC sends audio back the other way.',
    ],
  },

  // ── Page 7 · Station 3 ────────────────────────────────────────────────────
  declare: {
    intro: {
      learning: 'Why you name the signal first, from the panel label, and only then choose the cable built for it. The connector’s shape can’t decide for you.',
      start: 'On the “AES OUT” card, read the setup and tap the signal the equipment expects. Once it’s right, the cable question appears: tap the cable built for that signal.',
    },
    seeing: [
      'You’re at STATION 3 · DECLARE BEFORE YOU CONNECT: three real panel jacks, each a common connector doing an unusual job.',
      'Each card shows a photo, the setup and the signal question. The cable question appears only once you’ve declared the signal.',
      'THE CENTRAL LESSON sums up the rule this page is built on. One goal chip sits below.',
    ],
    control: [
      'Read the setup, then tap the signal the equipment expects.',
      'Only the right signal brings up the cable question. Then tap the cable.',
      'The goal: declare and solve all 3 connections.',
    ],
    changes: [
      'Until you declare the signal, the page won’t judge compatibility. That’s the point: the signal comes first.',
      'A wrong signal sends you back to the panel LABEL. A wrong cable reminds you that the construction must match the signal.',
      'A right pair shows ✓ COMPATIBLE, and tells you what a cable that fits but is wrong would do.',
    ],
    teaches: [
      'Name the signal first, from the label, then choose the cable built for that signal.',
      'Digital audio on XLR or RCA needs cable built to a set impedance, not just any cable with the right plugs.',
      'An insert jack needs an insert cable, even when an ordinary cable fits it.',
    ],
    tryThis: [
      'On “AES OUT”, pick Analog microphone signal. The page sends you back to the panel LABEL, and the cable question stays hidden.',
      'On “COAXIAL DIGITAL OUT”, try Any RCA interconnect that fits. The construction must match the signal.',
      'On “CH 5 INSERT”, look before you pick. Until a signal is declared, no cable question shows: the page won’t judge compatibility yet.',
    ],
  },

  // ── Page 8 · Station 4 ────────────────────────────────────────────────────
  inside: {
    intro: {
      learning: 'What is inside the eight common cable builds and the job each is built for, and why the construction, not the plug, decides whether a connection works.',
      start: 'Swipe the 8 CONSTRUCTIONS row and tap Balanced shielded twisted pair, then Heavy-gauge speaker cable. Compare the shield and conductor size, then read THE REQUIRED COMPARISON.',
    },
    seeing: [
      'You’re at STATION 4 · WHAT IS INSIDE THE CABLE: eight cable builds in a row marked 8 CONSTRUCTIONS — SWIPE →.',
      'Each build has a labeled cross-section drawing beside a photo of THE CUT END, ON THE BENCH. Below them, the layers are numbered from the outside in, and BUILT FOR names the job.',
      'THE REQUIRED COMPARISON sets instrument cable against speaker cable. A note and a check follow.',
    ],
    control: [
      'Swipe the row and tap a construction. A ✓ marks each one you’ve viewed.',
      'Answer the check. A wrong answer explains why and stays open.',
      'The goals: view all 8 constructions and pass the check.',
    ],
    changes: [
      'Each build matches one job: shielded pair for mic and balanced line, heavy conductors for speaker current, 75-ohm coax for S/PDIF, word clock and video, category pairs for networks.',
      'The jacket hides all of this, yet what is inside decides whether the connection works.',
      'A continuity tester can’t tell instrument cable from speaker cable. Both pass.',
    ],
    teaches: [
      'The eight common cable builds and the job each one is built for.',
      'What really identifies a cable when the plugs on two cables look the same.',
      'Why a shield guards a small signal against noise, while speaker cable needs thick conductors to carry real current.',
    ],
    tryThis: [
      'Compare Balanced shielded twisted pair with Heavy-gauge speaker cable. Look at the shield and the size of the conductors.',
      'Open 75-ohm coaxial digital cable and read BUILT FOR.',
      'In the check, pick “A continuity test across both ends”. Both cables pass it the same way, so it can’t tell them apart.',
    ],
  },

  // ── Pages 9–11 · Station 5 ────────────────────────────────────────────────
  buildStage: {
    intro: {
      learning: 'How the four questions — fit, signal, construction, safety — judge a real cable choice, for a mic, a phantom-powered mic, a guitar through a DI and a stereo keyboard.',
      start: 'On the Dynamic microphone → mixer card, tap the 1/4-inch TS instrument cable and read the four verdict rows. Then tap the XLR-shell lighting/data cable and compare.',
    },
    seeing: [
      'You’re at STATION 5 · BUILD THE SYSTEM — STAGE BASICS: four real connections, one card each.',
      'Each card gives the job, a FROM → TO pair of devices and ports, and a tray of cables to choose from.',
      'After you pick, you see the cable’s two ends and four verdict rows: 1 · Physically fits, 2 · Signal the equipment expects, 3 · Cable construction correct, 4 · Connection safe.',
    ],
    control: [
      'Tap a cable in the tray. You can try as many as you like.',
      'The right cable shows ✓ CORRECT CABLE and puts a ✓ on the card’s title.',
      'The goal: connect all 4 systems correctly.',
    ],
    changes: [
      'Each row shows a green ✓, a red ✕, or a gold ? marked UNVERIFIED. A label below names the problem, such as WRONG SIGNAL LEVEL.',
      'If a cable doesn’t fit, nothing else gets tested, so rows 2–4 read UNVERIFIED.',
      'FITS — BUT VERIFY means the plugs mate, but nothing else is proven yet.',
    ],
    teaches: [
      'A cable choice is right only when all four checks pass: it fits, it carries the signal the equipment expects, it’s built for that signal, and the connection is safe.',
      'Fitting is the weakest proof. A cable can mate perfectly and still be the wrong build, or join two outputs that should never meet.',
    ],
    tryThis: [
      'Dynamic microphone → mixer: pick the 1/4-inch TS instrument cable. It reads DOES NOT FIT, and rows 2–4 read UNVERIFIED.',
      'Same card: pick the XLR-shell lighting/data cable. It reads FITS — BUT VERIFY: it fits, which proves nothing.',
      'Stereo keyboard: one Y-cable into one input reads TWO OUTPUTS JOINED. Signal and safety both fail.',
    ],
  },

  buildMonitors: {
    intro: {
      learning: 'How powered and passive loudspeakers are fed, line level versus amplifier power, and why a speaker output must never go into an input.',
      start: 'On the Power amplifier → passive loudspeaker card, tap each cable in the tray and read the verdict rows. Then compare the headphones and the headset on their card.',
    },
    seeing: [
      'You’re at STATION 5 · BUILD THE SYSTEM — MONITORS & POWER: four more connections.',
      'They cover line level, speaker level and a headset, plus the connection most likely to damage equipment.',
      'Each card has the same FROM → TO pair, cable tray, cable ends and four verdict rows as the stage basics page.',
    ],
    control: [
      'Tap a cable in the tray. Try as many as you like.',
      'The right cable shows ✓ CORRECT CABLE.',
      'The goal: connect all 4 systems correctly.',
    ],
    changes: [
      'A powered loudspeaker takes line level, because its amplifier is inside the box.',
      'A passive loudspeaker takes amplifier power on heavy conductors.',
      'SPEAKER OUTPUT INTO AN INPUT fails both signal and safety: it can overdrive and damage the input.',
    ],
    teaches: [
      'A powered loudspeaker is fed line level; a passive loudspeaker is fed amplifier power on heavy cable.',
      'A speaker output into an input fails twice: the level is wrong, and it can damage the input.',
      'Headphones and a headset differ by one contact: the headset needs it for its mic.',
    ],
    tryThis: [
      'Power amplifier → passive loudspeaker: pick the cable from amp output → mixer LINE INPUT. It reads SPEAKER OUTPUT INTO AN INPUT.',
      'Same card: the instrument cable with adapters reads WRONG CABLE CONSTRUCTION, and row 4 shows a red ✕ too.',
      'Headphones vs headset: the 3-contact headphones fit and play, but have no mic path.',
    ],
  },

  buildSources: {
    intro: {
      learning: 'How phono, HDMI audio return, USB and network links are chosen, and why identical plugs can carry completely different signals.',
      start: 'On the turntable card, tap the RCA pair into the CD/LINE input and read the verdict. Then find the cable into the PHONO input and compare.',
    },
    seeing: [
      'You’re at STATION 5 · BUILD THE SYSTEM — SOURCES & DATA: four modern connections.',
      'The sources are a turntable, a television, a computer and a networked stagebox.',
      'Each card has the same FROM → TO pair, cable tray, cable ends and four verdict rows.',
    ],
    control: [
      'Tap a cable in the tray. Try as many as you like.',
      'The right cable shows ✓ CORRECT CABLE.',
      'The goal: connect all 4 systems correctly.',
    ],
    changes: [
      'Phono level needs the PHONO input. A line input has no phono gain or tone curve.',
      'PROTOCOL MISMATCH means the plug fits, but the port expects a different kind of data.',
      'Some USB-C and network cables fit yet lack what the job needs, so they read FITS — BUT VERIFY.',
    ],
    teaches: [
      'A turntable’s phono signal needs the extra gain and tone curve of a PHONO input. Through a line input it sounds faint and thin.',
      'HDMI, USB and network links are judged by protocol and by what the cable actually carries, not by whether the plug fits.',
      'A USB-C cable can fit perfectly, charge a device and still carry no data.',
    ],
    tryThis: [
      'Turntable: the same RCA pair into the CD/LINE input reads WRONG SIGNAL LEVEL. It would sound faint and thin.',
      'Television: HDMI into a non-ARC input reads PROTOCOL MISMATCH.',
      'Computer: a charge-only USB-C cable reads FITS — BUT VERIFY. It may carry no data.',
    ],
  },

  // ── Page 12 · Station 6 ───────────────────────────────────────────────────
  tester: {
    intro: {
      learning: 'How a continuity tester reads a cable: the lamp patterns of an open, a short, a missing shield and reversed pins, and why you test every pair.',
      start: 'Pick the XLR from the dead-vocal channel. Tap 1 under END A and 1 under END B and read the lamp. Then test 2 to 2 and 3 to 3.',
    },
    seeing: [
      'You’re at STATION 6 · THE CABLE TESTER: four cables, each ON THE BENCH with a note on where it came from.',
      'A key names the contacts. A drawn tester with a lamp sits above two columns, END A and END B, with FLEX THE CABLE, INSPECT and RESEAT PLUG.',
      'The diagnosis answers sit below, LOCKED until you’ve tested enough.',
    ],
    control: [
      'Tap one contact under END A and one under END B. The lamp reads LIT, DARK or FLICKERING.',
      'FLEX THE CABLE bends the cable while you test. INSPECT shows what the connector looks like. RESEAT PLUG pushes it fully home.',
      'Test two different pairs and tap INSPECT to unlock the diagnosis. Tap an answer; a wrong one stays open so you can try again.',
      'The goal: diagnose all 4 cables.',
    ],
    changes: [
      'The lamp lights only when a path joins the two contacts you picked.',
      'A healthy cable lights every straight pair — 1→1, 2→2, 3→3 — and nothing else.',
      'DARK on a straight pair means no path: a break, or a wire landed somewhere else. LIT on a cross pair (like 2→3) means two contacts are joined: a short, or a swap. Test the cross pairs before you decide.',
    ],
    teaches: [
      'A continuity test proves a path: straight pairs should light, cross pairs should stay dark.',
      'An open, a short, a missing shield and reversed pins each leave their own lamp pattern.',
      'Good testing habits: test every pair, cross pairs too, then flex the cable and inspect the plug.',
    ],
    tryThis: [
      'XLR from the dead-vocal channel: test 1 to 1 — LIT, 2 to 2 — DARK, 3 to 3 — LIT. Which conductor never arrives?',
      'XLR from the borrowed-gear bin: 2 to 2 is DARK, but 2 to 3 is LIT. Test 3 to 2 as well — what does that pattern mean?',
      'TRS from the crackling monitor send: T to T is LIT — and T to R is LIT too. Which two contacts are joined that should never touch?',
    ],
  },

  // ── Page 13 · Station 6 ───────────────────────────────────────────────────
  faultFinder: {
    intro: {
      learning: 'What a continuity tester can’t tell you: cable type, impedance, or why a path is dark. A broken wire, a bent pin and an unseated plug read alike.',
      start: 'Pick the headphone extension and test tip to tip at rest. Then turn on FLEX THE CABLE and test tip to tip again.',
    },
    seeing: [
      'You’re at STATION 6 · FAULT FINDER: five more cables on the same tester.',
      'Two of them PASS a resting continuity test and are still wrong.',
      'Each rig has the lamp, END A / END B, FLEX THE CABLE, INSPECT, RESEAT PLUG and the diagnosis.',
      'The RCA pair has four test points: L·C, L·S, R·C, R·S, for left and right, center and shell.',
    ],
    control: [
      'Pick a contact on each end and read the lamp.',
      'Flex, inspect and reseat as you need to. The diagnosis unlocks after two pairs and INSPECT.',
      'The goal: diagnose all 5 cables.',
    ],
    changes: [
      'An intermittent break passes at rest. FLICKERING appears only while you flex.',
      'A bent pin reads the same as a broken wire; only INSPECT tells them apart. A half-seated plug reads DARK everywhere until RESEAT PLUG.',
      'A wrong cable type lights every straight path: the tester can’t see gauge or shielding. On a TS cable, the tester’s ring and sleeve contacts also read joined: one long sleeve touches both.',
    ],
    teaches: [
      'A continuity tester only proves a path exists. It can’t show cable type, gauge, shielding or impedance.',
      'It can’t say why a path is dark: a broken wire, a bent pin and an unseated plug read alike.',
      'An intermittent fault hides at rest, so flex, inspect and reseat before you blame the cable.',
    ],
    tryThis: [
      'Headphone extension: every straight path is LIT at rest. Turn on FLEX THE CABLE and test tip to tip: FLICKERING.',
      'Cable from the dead stage drop: everything reads DARK. Tap RESEAT PLUG, then test 1 to 1 again: LIT.',
      'The 1/4-inch cable for the amp-to-cabinet run: every straight path lights, yet INSPECT shows the jacket reads INSTRUMENT CABLE.',
    ],
  },

  // ── Page 14 · Station 7 ───────────────────────────────────────────────────
  safety: {
    intro: {
      learning: 'The nine working rules for connecting audio gear, and how each one prevents damaged equipment, a lost show or someone getting hurt.',
      start: 'Read the first rule and why it matters, then tap I WILL WORK THIS WAY. Find the AC safety ground rule and read its reason before you acknowledge it.',
    },
    seeing: [
      'You’re at STATION 7 · SAFETY & PROFESSIONAL PRACTICE: nine rules, one card each, with why each one matters.',
      'COILING & ROUTING LIVE NEXT DOOR points to the Cable Dressing & Installation lab, where coiling and routing are covered.',
      'One goal chip sits below the rules.',
    ],
    control: [
      'Read each rule, then tap I WILL WORK THIS WAY. It turns to ✓ ACKNOWLEDGED.',
      'OPEN CABLE DRESSING & INSTALLATION takes you to that lab.',
      'The goal: Acknowledge all 9 rules.',
    ],
    changes: [
      'Each rule closes off a common way to damage equipment, lose a show or hurt someone.',
      'Amplifiers come on LAST and go off FIRST. Upstream gear thumps as it powers up or down, and with the amplifiers off, nobody hears it.',
      'A plain wired adapter changes only the shape. It never changes level, impedance, balance or protocol.',
    ],
    teaches: [
      'Why the AC safety ground is never defeated to cure hum: it makes a fault trip the breaker instead of leaving the chassis live.',
      'Why power order matters: amplifiers last on and first off keep thumps from upstream gear out of the speakers.',
      'Why a passive part can’t do an active job: combining signals takes a mixer; converting level, impedance or balance takes a pad, transformer or DI.',
    ],
    tryThis: [
      'Tap I WILL WORK THIS WAY on the AC safety ground rule: it turns to ✓ ACKNOWLEDGED. Its reason: the ground makes a fault trip the breaker instead of leaving the chassis live.',
      'Compare the Y-cable rule with the adapter rule. Both say a plain passive part can’t do an active job: combining is a mixer’s job; converting level, impedance or balance takes a pad, transformer or DI.',
    ],
  },

  // ── Page 15 ───────────────────────────────────────────────────────────────
  myths: {
    intro: {
      learning: 'The facts behind nine connector claims heard on real gigs, about TRS, XLR, balanced lines, MIDI and fit, and why each one sounds reasonable.',
      start: 'Read the first claim and decide before you tap TRUE or FALSE. If you tap TRUE, read the correction, then settle it on FALSE.',
    },
    seeing: [
      'This is THE MISCONCEPTIONS CHALLENGE: nine claims heard on real gigs, in shuffled order.',
      'Each card shows one claim, with TRUE and FALSE below it.',
      'One goal chip sits at the bottom.',
    ],
    control: [
      'Read each claim, then tap TRUE or FALSE.',
      'A TRUE pick shows the correction and stays open until you settle it on FALSE.',
      'The goal: Bust all 9 myths.',
    ],
    changes: [
      'Each answer shows the correction: the fact behind the myth.',
      'Every claim sounds reasonable because the connector fits. That’s the trap.',
    ],
    teaches: [
      'What the letters TRS and XLR really tell you about a connector, and what they don’t.',
      'What balanced really means, and what a MIDI cable actually carries.',
      'Why a plug that fits proves less than it seems.',
    ],
    tryThis: [
      'On “MIDI cables carry musical audio”, tap TRUE. The correction says MIDI carries instructions.',
      'On “Balanced means stereo”, tap TRUE. The correction says balanced is a noise-rejection scheme — one signal on two conductors.',
    ],
  },

  // ── Page 16 · Final ───────────────────────────────────────────────────────
  final: {
    intro: {
      learning: 'How the four questions — fit, signal, construction, safety — apply to twelve mixed calls, and why one missed safety call outweighs any score.',
      start: 'Tap CLOCK IN — DRAW MY 12. Answer each question and read its explanation, then tap TURN IN THE JOB SHEET once all twelve are answered.',
    },
    seeing: [
      'This is FINAL · YOU’RE ON THE JOB: twelve questions, drawn fresh every attempt.',
      'They mix identification, cable selection, same-connector traps, faults and safety. Some are marked SAFETY-CRITICAL.',
      'To pass, you need 80% and every safety-critical call right.',
    ],
    control: [
      'Tap CLOCK IN — DRAW MY 12 to start. Tap one answer per question; it locks and shows the explanation.',
      'TURN IN THE JOB SHEET grades the set once all twelve are answered.',
      'NEW ATTEMPT — FRESH DRAW gives you a new set. After a pass, RUN IT AGAIN ANYWAY lets you practice on a fresh draw.',
    ],
    changes: [
      'Your score is the share you got right, rounded. 80% or more passes, unless you missed a SAFETY-CRITICAL call.',
      'A missed safety call outweighs any score, so the result reads NOT YET.',
      'Every retry draws a new set, so read each explanation: together they’re your study sheet.',
    ],
    teaches: [
      'Every real cable call runs through the same four questions in order: does it fit, what signal is expected, is the cable built for it, and is it safe?',
      'Why one unsafe connection outweighs any number of right answers: a single safety miss can damage equipment or hurt someone.',
    ],
    tryThis: [
      'Ten right with no safety miss scores 83% and passes. Nine right is 75%: NOT YET.',
      'Miss one SAFETY-CRITICAL question and score high anyway. It still reads NOT YET.',
    ],
  },
};

/** PagedLab's `endGuide`: the what's-left screen (FINISH › on the last page,
 *  or WHAT'S LEFT › in the contents). Every page here marks ITSELF done when
 *  its goal chips all tick (manualDone + useVisitGoals) and banks `p<n>`
 *  credit; the Final's goal is a pass (80% + every safety call). */
export const CONNECTOR_SELECT_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'A review of how every connection is judged — fit, signal, construction, safety — and which pages of this lab you still have to work through.',
    start: 'Read the list under WHAT\'S LEFT and tap the first page’s row to open it. Or tap REVIEW ▾ to reopen a page you’ve already finished.',
  },
  seeing: [
    'WHAT\'S LEFT lists, by name, every page you haven’t finished yet. When none are left, the title reads LAB COMPLETE.',
    'Finished pages fold into one ✓ CREDITED row (✓ DONE if you’re signed out or in a preview). REVIEW ▾ lists them.',
    'The line under the title says how much is left and if your work is saved.',
    'If your progress can’t be loaded, the title reads YOUR PROGRESS, a note says why, and every page still opens.',
  ],
  control: [
    'Tap a page’s row to jump straight to it.',
    'Tap REVIEW ▾ on the ✓ row to see the pages you’ve finished, then tap any one to open it again.',
    'PRACTICE AGAIN FROM THE START opens page 1 and clears nothing.',
    'DONE · BACK TO LABS leaves the lab and takes you back to where you opened it. ‹ PREV returns you to the page you were on.',
  ],
  changes: [
    'A page is finished once all its goal chips read ✓ in one visit. Leave early and they reset to ○. NEXT or FINISH alone doesn’t finish it.',
    'The Final counts only after a pass: 80% and every safety call right.',
    'Finished pages save to your account. Signed out, the line under the title says if signing in can still keep them. A preview saves nothing. START OVER (PRACTICE) in the page list resets goal chips only.',
  ],
  teaches: [
    'Every connection in this lab is judged by four questions, in order: does it fit, what signal does the equipment expect, is the cable built for it, and is it safe?',
    'A cable is proven by its label, its jacket and a test: continuity, flexing and a look at the plug. A tester alone can’t show cable type.',
  ],
  tryThis: [
    'Jump to the first page still listed and find its goal chips at the bottom. Each ○ is a goal you haven’t met yet.',
    'Tap REVIEW ▾ and reopen a page you found hard, such as The cable tester. Practicing it never undoes a page you’ve finished.',
  ],
};

/** PagedLab's `pageGuide`: page index → its guide (undefined past the end). */
export function connectorSelectPageGuide(index: number): ScreenGuide | undefined {
  const page = CONNECTOR_SELECT_PAGES[index];
  return page ? CONNECTOR_SELECT_SCREEN_GUIDES[page.id] : undefined;
}

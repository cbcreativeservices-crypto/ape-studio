/**
 * lesson03 data — "Analog Audio Connectors" (owner spec §5.3).
 * Pure data, zero React (the CheckSpec import is type-only, erased at compile).
 *
 * SOURCE DISCIPLINE (safety-critical lab): every factual claim below is
 * derived verbatim-faithfully from the VERIFIED records in
 * connectors.analog.ts — the lead-ins surface the owner-spec emphases in the
 * records' own terms, and the knowledge-check reveals restate the records'
 * consequences. Nothing here is authored as a new fact.
 */
import type { ConnectorId } from '../cableTypes';
import type { CheckSpec } from '../../foundations/bits';

export type L03Entry = {
  id: ConnectorId;
  /** Short chip label for the browser row. */
  chip: string;
  /** Owner-spec emphasis shown above the record card — derived from the
   *  verified record's own fields (limitations / constructionNote /
   *  commonMistakes / notInterchangeableWith), never new facts. */
  leadIn: string;
};

/** The seven analog records, in owner-spec teaching order. */
export const L03_ENTRIES: L03Entry[] = [
  {
    id: 'xlr3',
    chip: '3-PIN XLR',
    leadIn:
      'One shell, more than one job: the same three pins carry balanced analog microphone or line audio — and AES3 digital audio, which is specified for 110-ohm digital cable. Never assume an XLR line is a microphone signal; the connector alone does not identify the signal.',
  },
  {
    id: 'ts_quarter',
    chip: '1/4-INCH TS',
    leadIn:
      'Two very different cables wear this identical plug. Instrument cable is a single small-gauge shielded conductor built to move a tiny signal quietly; speaker cable is two heavier unshielded conductors built to move amplifier current. They must not be swapped — the plug cannot tell you which one you are holding; the jacket printing and the construction do.',
  },
  {
    id: 'trs_quarter',
    chip: '1/4-INCH TRS',
    leadIn:
      'Three contacts, three different jobs: balanced mono, unbalanced stereo, or a console insert with send and return on one jack. A TRS plug does NOT automatically mean stereo, and it does NOT automatically mean balanced — the equipment on each end decides which job the connection performs.',
  },
  {
    id: 'trs_35',
    chip: '3.5 MM TRS',
    leadIn:
      'The identical miniature plug may be wired as unbalanced stereo — the common consumer case — or as balanced mono on some compact equipment. Nothing on the plug distinguishes them; the equipment documentation does.',
  },
  {
    id: 'trrs_35',
    chip: '3.5 MM TRRS',
    leadIn:
      'Four contacts, two contact orders: CTIA/AHJ and OMTP swap the microphone and ground positions on physically identical plugs. A headset can be incompatible with a jack it fits perfectly — fit proves nothing.',
  },
  {
    id: 'rca',
    chip: 'RCA',
    leadIn:
      'The same shell serves unbalanced analog audio and coaxial S/PDIF digital — different applications with different cable specifications. Analog interconnects are not impedance-controlled; coaxial digital requires genuine 75-ohm cable. An analog cable is not automatically fit for a digital connection just because it fits the jack.',
  },
  {
    id: 'combo_xlr_trs',
    chip: 'COMBO XLR/TRS',
    leadIn:
      'One receptacle, two electrical paths: a 1/4-inch jack in the center, the XLR contacts in the ring around it — usually feeding different input stages. The host equipment defines what each path expects; the receptacle accepting a plug says nothing about whether that cable suits the job.',
  },
];

/** Knowledge check (unit gate — all four must be solved). Reveals restate the
 *  verified records' own explanations and consequences. */
export const L03_CHECKS: CheckSpec[] = [
  {
    question:
      'A cable with 1/4-inch TRS plugs is handed to you. What do its three contacts prove about the connection?',
    options: [
      'It is a stereo connection — tip left, ring right',
      'It is a balanced connection — tip +, ring −',
      'Nothing yet — TRS has three jobs; the equipment decides',
      'It is a headphone extension',
    ],
    correctIdx: 2,
    why: {
      0: 'Stereo is one of TRS’s jobs, not the only one. The three contacts alone do not choose.',
      1: 'Balanced is one of TRS’s jobs too. Look at the THREE JOBS card.',
      3: 'Headphones are one possible use. The plug alone does not tell you which.',
    },
    reveal:
      'One connector, three jobs: balanced mono, unbalanced stereo, or a console insert with send and return on one jack. A TRS plug means neither “stereo” nor “balanced” automatically — identify the jack’s job before patching.',
    wrongHint: 'TRS has three different jobs — can the plug alone tell you which one this connection performs?',
  },
  {
    question: 'A 3-pin XLR line drops from a stage wall plate. Is it safe to assume a microphone signal?',
    options: [
      'Yes — XLR is the microphone connector',
      'No — that shell also carries line level and digital audio',
      'Yes — once the latch clicks, it is a mic line',
      'No — wall-plate XLR is always AES3 digital',
    ],
    correctIdx: 1,
    why: {
      0: 'The same 3-pin shell also carries line level and digital audio.',
      2: 'The latch proves the plug is in. It says nothing about what travels.',
      3: '“Always” is the trap: the shell never names the signal, in either direction.',
    },
    reveal:
      'The same 3-pin shell serves several different jobs — analog mic or line audio, AES3 digital audio, and some control uses. The connector alone does not identify the signal; check what the wall plate or snake line actually carries before patching.',
    wrongHint: 'The shell fitting — or latching — proves the shape, never the signal.',
  },
  {
    question:
      'An amplifier output and a passive loudspeaker both use 1/4-inch TS jacks, and a guitar instrument cable fits. Use it for the speaker run?',
    options: [
      'Yes — the plug fits, so the cable is correct',
      'No — 1/4-inch TS jacks never carry loudspeaker signals',
      'Yes — as long as the run is short',
      'No — instrument cable is too thin for amplifier current',
    ],
    correctIdx: 3,
    why: {
      0: 'A fit only proves the shapes mate. Look at what is inside each cable.',
      1: 'Many amplifiers and cabinets do use 1/4-inch TS jacks for speakers. The plug is not the problem.',
      2: 'A short run still pushes amplifier current through a thin conductor built for tiny signals.',
    },
    reveal:
      'Same plug, different cable. An instrument cable on a speaker run loses power in its small conductor and can heat at higher power — a reliability problem that can become cable failure and put the amplifier at risk. Read the jacket and the construction, not the plug.',
    wrongHint: 'The plug is identical on both cables — think about what each cable’s CONSTRUCTION was built to move.',
  },
  {
    question:
      'A coaxial S/PDIF digital output needs a cable. An analog RCA interconnect fits the jack — is it automatically appropriate?',
    options: [
      'Not automatically — S/PDIF needs 75-ohm coax, not any RCA lead',
      'Yes — every cable with RCA plugs is the same',
      'No — digital audio never travels on RCA connectors',
      'Yes — if both ends are RCA plugs, it will lock',
    ],
    correctIdx: 0,
    why: {
      1: 'Analog and digital cables can wear the same plug and still be built differently.',
      2: 'Coaxial S/PDIF does use RCA connectors. The question is about the cable.',
      3: 'Locking onto the jack proves the fit, not that the cable suits a digital signal.',
    },
    reveal:
      'Identical plugs, different cable specification. A short analog cable often appears to work; longer or marginal runs drop out or the receiver fails to lock onto the signal — a reliability failure, not damage. Use a true 75-ohm cable for coaxial digital.',
    wrongHint: 'The shell does not certify the cable behind it — what does the digital interface actually specify?',
  },
];

/** Lesson takeaway (LessonBanner idiom). */
export const L03_LESSON =
  'Contacts tell you the wiring — never the job. The same shell can carry different signals over different cable builds: XLR is not automatically a mic, TRS is not automatically stereo or balanced, and RCA does not certify the cable behind it. Identify what the connection carries before you patch.';

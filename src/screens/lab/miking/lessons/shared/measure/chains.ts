/**
 * The measurement CHAINS as data for the chain rack (engine/chain/
 * chainModel.ts). Pure; validated by the tests (validateChain).
 *
 *   MEAS_CHAIN    F11: capsule → power → input → sensitivity record
 *                 (GRAS-POL / GRAS-PWR, not re-read: standard measurement
 *                 facts; the refusals' safety words are F11 L26 exactly)
 *   FIELD_MATCH   F11: the field a task makes → the response and the aim
 *                 (GRAS-FF; "often 0°" PRACTICE)
 *   METER_CHAIN   F12: the meter, its weighting, its time weighting, what is
 *                 reported (F12 L10–L24)
 *   ROOM_CHAIN    F13: the test signal, the source, the receiver, the
 *                 processing (F13 L11–L21, L41)
 *
 * Learner text: plain words, no brand, no standard number (D-6B-3).
 */
import type { ChainSpec } from '../../../engine/chain/chainModel.ts';

const PINOUT = 'Do not experiment with pinouts or apply power to an unverified sensor.';

export const MEAS_CHAIN: ChainSpec = {
  id: 'measChain',
  slots: [
    {
      id: 'capsule',
      label: 'Capsule and preamp',
      short: 'CAPSULE',
      parts: [
        { id: 'prepol', label: 'Prepolarized capsule on a constant-current preamp', short: 'PREPOL.', blurb: 'The capsule carries its own charge; its preamp runs from a constant-current input.' },
        { id: 'extpol', label: 'Externally polarized capsule on its preamp', short: 'EXT. POL.', blurb: 'The capsule needs a polarization voltage from a dedicated supply.' },
      ],
    },
    {
      id: 'power',
      label: 'Power',
      short: 'POWER',
      parts: [
        { id: 'polsupply', label: 'Polarization supply (its own unit)', short: 'POL. SUPPLY', blurb: 'A dedicated supply that gives an externally polarized capsule its voltage.' },
        { id: 'ccp', label: 'Constant-current input', short: 'CONST. CUR.', blurb: 'The input a prepolarized mic’s preamp runs from.' },
        { id: 'approved', label: 'The maker’s approved conditioning unit', short: 'APPROVED', blurb: 'Takes a mic input’s phantom power and feeds a constant-current preamp correctly — the exact unit the maker approves.' },
        { id: 'phantom', label: 'Plain 48 V phantom power', short: '48 V', blurb: 'An ordinary mic input’s phantom power, straight to the preamp.' },
      ],
    },
    {
      id: 'input',
      label: 'Input and capture',
      short: 'INPUT',
      parts: [
        { id: 'analyzer', label: 'Measurement analyzer with this chain’s data loaded', short: 'ANALYZER', blurb: 'Reads the chain with its sensitivity and correction data; settings logged.' },
        { id: 'interface', label: 'Audio interface and software, checked with the calibrator', short: 'INTERFACE', blurb: 'Gain, filters and sample settings fixed and logged; the field check sets the scale.' },
        { id: 'recorder', label: 'Recorder input, reading dBFS', short: 'RECORDER', blurb: 'Levels relative to the recorder’s own digital maximum.' },
      ],
    },
    {
      id: 'record',
      label: 'Sensitivity record',
      short: 'RECORD',
      parts: [
        { id: 'own', label: 'This chain’s own record (the serial numbers match)', short: 'OWN', blurb: 'The capsule and preamp you are holding, with their calibration record.' },
        { id: 'copied', label: 'A number copied from a similar-looking mic', short: 'COPIED', blurb: 'Someone else’s capsule, someone else’s number.' },
        { id: 'none', label: 'No sensitivity record', short: 'NONE', blurb: 'Nothing ties the reading to a pressure.' },
      ],
    },
  ],
  rules: [
    { id: 'prepol-pol', all: [['capsule', 'prepol'], ['power', 'polsupply']], reason: 'A prepolarized capsule carries its own charge: it must not be given a polarization voltage. Use its constant-current path.', safety: true },
    { id: 'ext-ccp', all: [['capsule', 'extpol'], ['power', 'ccp']], reason: 'An externally polarized capsule needs its polarization voltage, and a constant-current input does not supply it.' },
    { id: 'ext-approved', all: [['capsule', 'extpol'], ['power', 'approved']], reason: 'That unit feeds a constant-current preamp; an externally polarized capsule needs its own polarization supply.' },
    { id: 'ext-phantom', all: [['capsule', 'extpol'], ['power', 'phantom']], reason: `Phantom power is not a polarization supply. ${PINOUT}`, safety: true },
    { id: 'prepol-phantom', all: [['capsule', 'prepol'], ['power', 'phantom']], reason: `A constant-current preamp is not automatically compatible with ordinary 48 V phantom power: use the exact approved adapter or conditioning unit. ${PINOUT}`, safety: true },
  ],
  briefs: [
    {
      id: 'absolute',
      title: 'An absolute level',
      question: 'A sound level, in dB SPL, at one stated position — a claim someone else will rely on.',
      ok: { input: ['analyzer', 'interface'], record: ['own'], power: ['polsupply', 'ccp', 'approved'] },
      why: {
        recorder: 'A recorder’s dBFS is relative to its own digital maximum — not a sound pressure level.',
        copied: 'A sensitivity belongs to one capsule and chain and its record: never copy it from a look-alike.',
        none: 'Without this chain’s sensitivity the reading cannot be a calibrated level.',
        phantom: 'Plain phantom power is not a measurement mic’s supply.',
      },
      label: 'A CALIBRATED CHAIN · NEXT, THE FIELD CHECK',
    },
    {
      id: 'relative',
      title: 'A relative comparison',
      question: 'Did one change — a panel moved, a setting changed — make a difference at one spot? Same mic, same settings, before and after.',
      ok: { record: ['own', 'none'], power: ['polsupply', 'ccp', 'approved'] },
      why: {
        copied: 'A copied number would dress a comparison up as a level. Leave it out and call it relative.',
        phantom: 'Plain phantom power is not a measurement mic’s supply.',
      },
      label: 'A RELATIVE COMPARISON · LABEL IT SO',
    },
  ],
};

export const FIELD_MATCH: ChainSpec = {
  id: 'fieldMatch',
  slots: [
    {
      id: 'response',
      label: 'The mic’s field response',
      short: 'RESPONSE',
      parts: [
        { id: 'freeField', label: 'Free-field response', short: 'FREE FIELD', blurb: 'Made for sound arriving from one direction.' },
        { id: 'pressure', label: 'Pressure response', short: 'PRESSURE', blurb: 'Made for the pressure at the diaphragm itself: a coupler, a flush boundary.' },
        { id: 'random', label: 'Random-incidence response', short: 'RANDOM', blurb: 'Made for sound from many directions at once.' },
      ],
    },
    {
      id: 'aim',
      label: 'How it is set up',
      short: 'AIM',
      parts: [
        { id: 'at', label: 'Pointed straight at the source', short: 'AT IT', blurb: 'The grid facing the source: 0° incidence.' },
        { id: 'side', label: 'Turned 90° to the source', short: '90°', blurb: 'The source off to the side of the capsule.' },
        { id: 'data', label: 'Set up as its data and the method say', short: 'AS ITS DATA', blurb: 'The orientation the mic’s data and the method name — a coupler, a flush mount, or no single direction.' },
      ],
    },
  ],
  rules: [],
  briefs: [
    {
      id: 'speaker',
      title: 'A loudspeaker test',
      question: 'One loudspeaker on a bench, sound arriving mostly from one direction, the mic on its axis.',
      ok: { response: ['freeField'], aim: ['at', 'data'] },
      why: {
        pressure: 'A pressure mic out in the open reads the highs differently: check the correction for this field before trusting them.',
        random: 'A random-incidence mic aimed at one source needs the correction for this field — check its data first.',
        side: 'Turned 90°, a free-field mic reads the source off its axis, and its highs change. Point it as its data says.',
      },
      label: 'FREE FIELD, POINTED AS ITS DATA SAYS',
    },
    {
      id: 'coupler',
      title: 'Inside a coupler',
      question: 'The capsule sealed in a calibrator’s coupler: the pressure at the diaphragm is the whole story.',
      ok: { response: ['pressure', 'freeField', 'random'], aim: ['data'] },
      why: {
        at: 'Sealed in a coupler there is no direction to point at: seat it as the manuals direct.',
        side: 'Sealed in a coupler there is no direction to turn: seat it as the manuals direct.',
      },
      label: 'SEATED AS THE MANUALS DIRECT',
    },
    {
      id: 'room',
      title: 'A reverberant room',
      question: 'Sound reaching the mic from many directions at once, as the method assumes.',
      ok: { response: ['random'], aim: ['data'] },
      why: {
        freeField: 'A free-field mic in a diffuse field needs the correction for this field — check its data.',
        pressure: 'A pressure mic in a diffuse field needs the correction for this field — check its data.',
        at: 'With sound from every side, “at the source” is not the question — set it up as its data and the method say.',
        side: 'With sound from every side, a 90° turn is not the question — set it up as its data and the method say.',
      },
      label: 'RANDOM INCIDENCE, SET UP AS ITS DATA SAYS',
    },
  ],
};

export const METER_CHAIN: ChainSpec = {
  id: 'meterChain',
  slots: [
    {
      id: 'instrument',
      label: 'Instrument',
      short: 'INSTRUMENT',
      parts: [
        { id: 'slm', label: 'A complete sound level meter, calibration current, windscreen on', short: 'METER', blurb: 'Capsule, weighting, averaging and display as one checked instrument.' },
        { id: 'phone', label: 'A phone with a sound-level app', short: 'PHONE', blurb: 'A phone’s own mic and an app’s idea of a level.' },
        { id: 'recorder', label: 'A field recorder, reading its meters in dBFS', short: 'RECORDER', blurb: 'Levels relative to the recorder’s digital maximum.' },
      ],
    },
    {
      id: 'weighting',
      label: 'Frequency weighting',
      short: 'WEIGHTING',
      parts: [
        { id: 'A', label: 'A-weighting', short: 'A', blurb: 'Weighs the lows down roughly as hearing does at moderate levels; the usual weighting for environmental levels.' },
        { id: 'C', label: 'C-weighting', short: 'C', blurb: 'Nearly flat across most of the range; often named for peaks.' },
        { id: 'Z', label: 'Z (no weighting)', short: 'Z', blurb: 'Flat: no weighting at all.' },
      ],
    },
    {
      id: 'time',
      label: 'Time weighting or averaging',
      short: 'TIME',
      parts: [
        { id: 'eq', label: 'Averaged over the whole window (equivalent level)', short: 'AVERAGE', blurb: 'The energy average over the stated interval.' },
        { id: 'F', label: 'Fast', short: 'FAST', blurb: 'Follows changes quickly; its largest value is a fast maximum.' },
        { id: 'S', label: 'Slow', short: 'SLOW', blurb: 'Smooths changes; its largest value is a slow maximum.' },
        { id: 'peak', label: 'The meter’s peak detector', short: 'PEAK', blurb: 'The highest instantaneous pressure the meter can register.' },
      ],
    },
    {
      id: 'report',
      label: 'What you write down',
      short: 'REPORT',
      parts: [
        { id: 'laeq', label: 'LAeq over the window, with its start, stop and length', short: 'LAeq,T', blurb: 'The A-weighted equivalent level, and the window it covers.' },
        { id: 'lafmax', label: 'LAFmax, with the event and the window', short: 'LAFmax', blurb: 'The largest A-weighted fast level in the window.' },
        { id: 'lcpeak', label: 'The C-weighted peak, as the method names it', short: 'LCpeak', blurb: 'A peak descriptor, with its weighting stated.' },
        { id: 'db', label: 'Just “dB”', short: '“dB”', blurb: 'A number with no weighting, no averaging and no window.' },
      ],
    },
  ],
  rules: [
    { id: 'recorder', all: [['instrument', 'recorder']], reason: 'A recorder’s dBFS is not a sound pressure level: it cannot stand in for a meter.' },
    { id: 'fast-peak', all: [['time', 'F'], ['report', 'lcpeak']], reason: 'Never relabel a fast maximum as a true peak.' },
    { id: 'slow-peak', all: [['time', 'S'], ['report', 'lcpeak']], reason: 'A slow maximum is not a peak either: a peak needs the meter’s peak detector.' },
  ],
  briefs: [
    {
      id: 'hour',
      title: 'The hour’s average',
      question: 'The average traffic level over the study hour at receiver A, A-weighted.',
      ok: { instrument: ['slm'], weighting: ['A'], time: ['eq'], report: ['laeq'] },
      why: {
        phone: 'Unless the method allows it, a phone is not a checked meter — the claim needs a calibrated instrument.',
        recorder: 'A recorder’s dBFS is not a sound pressure level.',
        C: 'The question names A-weighting; a C-weighted average answers a different question.',
        Z: 'The question names A-weighting; an unweighted average answers a different question.',
        F: 'A fast reading is a moment, not the hour’s average.',
        S: 'A slow reading is still a moment, not the hour’s average.',
        peak: 'A peak is one instant, not the hour’s energy.',
        lafmax: 'The loudest moment is not the hour’s energy average.',
        lcpeak: 'A peak is not the hour’s average.',
        db: 'Write the meter’s own label and the window — “dB” alone says nothing about either.',
      },
      label: 'LAeq OVER THE HOUR · WITH ITS START AND STOP',
    },
    {
      id: 'loudest',
      title: 'The loudest pass-by',
      question: 'The loudest truck pass-by in the window, A-weighted, fast.',
      ok: { instrument: ['slm'], weighting: ['A'], time: ['F'], report: ['lafmax'] },
      why: {
        phone: 'Unless the method allows it, a phone is not a checked meter.',
        recorder: 'A recorder’s dBFS is not a sound pressure level.',
        C: 'The question names A-weighting.',
        Z: 'The question names A-weighting.',
        eq: 'An average hides the loudest pass-by inside it.',
        S: 'The question names fast; a slow maximum is a different, lower-reading descriptor.',
        peak: 'The loudest fast level is not the instantaneous peak.',
        laeq: 'An average over the window hides the loudest pass-by.',
        lcpeak: 'The question asks for the fast maximum, not a peak.',
        db: 'Write the meter’s own label: LAFmax, with the event and the window.',
      },
      label: 'LAFmax · WITH THE EVENT AND THE WINDOW',
    },
    {
      id: 'impulse',
      title: 'Impulses next door',
      question: 'Hammer blows from the building site next door — the method names a C-weighted peak.',
      ok: { instrument: ['slm'], weighting: ['C'], time: ['peak'], report: ['lcpeak'] },
      why: {
        phone: 'Unless the method allows it, a phone is not a checked meter.',
        recorder: 'A recorder’s dBFS is not a sound pressure level.',
        A: 'The method names C-weighting for this peak.',
        Z: 'The method names C-weighting for this peak.',
        eq: 'An average smooths the impulses away.',
        F: 'A fast maximum is not a true peak.',
        S: 'A slow maximum is not a true peak.',
        laeq: 'An average smooths the impulses away.',
        lafmax: 'A fast maximum is not the peak the method names.',
        db: 'Write the meter’s own label: the peak, with its weighting.',
      },
      label: 'LCpeak · THE METHOD’S PEAK, ITS WEIGHTING STATED',
    },
  ],
};

export const ROOM_CHAIN: ChainSpec = {
  id: 'roomChain',
  slots: [
    {
      id: 'signal',
      label: 'Test signal',
      short: 'SIGNAL',
      parts: [
        { id: 'sweep', label: 'A controlled sweep, deconvolved by the software', short: 'SWEEP', blurb: 'Repeatable; gives the full impulse response when it is unclipped and the tail is captured.' },
        { id: 'noise', label: 'Broadband noise, then stopped (interrupted noise)', short: 'NOISE', blurb: 'Builds a steady sound, stops it, and records the decay — repeated at each position.' },
        { id: 'clap', label: 'A hand clap', short: 'CLAP', blurb: 'Quick, but no two are alike, and it barely excites the lows.' },
        { id: 'blank', label: 'A starter pistol or a firework', short: 'PISTOL', blurb: 'An explosive, firearm-like source.' },
      ],
    },
    {
      id: 'source',
      label: 'Source',
      short: 'SOURCE',
      parts: [
        { id: 'omni', label: 'An omni test source at a performer position', short: 'OMNI', blurb: 'A broadly radiating, well-known source: it excites the room much as a performer would.' },
        { id: 'pa', label: 'The installed PA, through its processing', short: 'PA', blurb: 'The house system as the audience hears it: its loudspeakers, its processing and its coverage.' },
      ],
    },
    {
      id: 'mic',
      label: 'Receiver',
      short: 'RECEIVER',
      parts: [
        { id: 'meas', label: 'An omni measurement mic, calibrated or verified', short: 'MEAS. OMNI', blurb: 'The common receiver for room work, its chain logged.' },
        { id: 'vocal', label: 'A directional vocal mic', short: 'VOCAL', blurb: 'Hears a chosen direction more than the others.' },
      ],
    },
    {
      id: 'processing',
      label: 'Processing',
      short: 'PROCESSING',
      parts: [
        { id: 'off', label: 'Auto-gain, noise reduction and gating all off', short: 'ALL OFF', blurb: 'Nothing changes the level or the tail behind your back.' },
        { id: 'on', label: 'The interface’s auto-gain and noise reduction left on', short: 'LEFT ON', blurb: 'Whatever the interface does by default.' },
      ],
    },
  ],
  rules: [
    { id: 'blank', all: [['signal', 'blank']], reason: 'No explosive or firearm-like sources in this lab — ever.', safety: true },
    { id: 'processing', all: [['processing', 'on']], reason: 'Auto-gain, noise reduction or gating changes the decay itself. Turn them off, or write down what cannot be.' },
  ],
  briefs: [
    {
      id: 'room',
      title: 'The room itself',
      question: 'How long does THIS ROOM ring — its reverberation, for acoustic use?',
      ok: { signal: ['sweep', 'noise'], source: ['omni'], mic: ['meas'] },
      why: {
        clap: 'A clap is inconsistent and barely excites the lows: not for a result you will compare.',
        blank: 'No explosive or firearm-like sources in this lab.',
        pa: 'Through the PA you measure the system plus the room; it cannot stand for the room alone.',
        vocal: 'A directional mic hears a chosen perspective; it cannot silently stand in for the usual receiver.',
      },
      label: 'ROOM ONLY · NAME THE SOURCE AND THE POSITIONS',
    },
    {
      id: 'system',
      title: 'The installed system',
      question: 'What does the audience hear at a seat — the house system and the room together?',
      ok: { signal: ['sweep', 'noise'], source: ['pa'], mic: ['meas'] },
      why: {
        clap: 'A clap does not go through the system the question is about.',
        blank: 'No explosive or firearm-like sources in this lab.',
        omni: 'An omni test source tests the room, not the installed system the question asks about.',
        vocal: 'A directional mic hears a chosen perspective; it cannot silently stand in for the usual receiver.',
      },
      label: 'SYSTEM + ROOM · NAME THE PA, ITS PRESET AND PROCESSING',
    },
  ],
};

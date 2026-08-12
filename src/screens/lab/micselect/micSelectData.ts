/**
 * micSelectData — content for the Microphone Selection Lab (owner spec
 * 2026-08-12). SELECTION and characteristics only: this lab deliberately does
 * NOT reteach transducer physics, polar-pattern creation, proximity-effect
 * physics, placement/stereo technique — those live in the other mic material
 * and appear here only where they affect a selection decision.
 *
 * All example microphones and response curves are FICTIONAL but realistic —
 * no brands, no models, ever. Copy is owner-reviewed lab content; keep the
 * misconception-correcting voice ("higher sensitivity ≠ better").
 */

/** Art kinds drawn by micArt.tsx (visual standards 2026-07-29: recognizable
 *  illustrations, never primitive stand-ins). */
export type MicKind =
  | 'dynamic'
  | 'condenser'
  | 'electret'
  | 'ribbon'
  | 'ldc'
  | 'sdc'
  | 'lav'
  | 'headworn'
  | 'shotgun'
  | 'boundary'
  | 'measurement'
  | 'contact';

// ─────────────────────────────────────────────────────────────────────────────
// Lesson 1 — Meet the Microphone Types

export type MicTypeCard = {
  key: string;
  name: string;
  kind: MicKind;
  /** 'transducer' = operating principle · 'form' = design / form factor. */
  klass: 'transducer' | 'form';
  what: string;
  traits: string[];
  apps: string;
  limitation: string;
};

export const CLASS_NOTE =
  'These are NOT equivalent categories. "Condenser" names the transducer principle inside; ' +
  '"shotgun" names an acoustic directivity design; "lavalier" names a physical form factor. ' +
  'One microphone can be all three at once — a shotgun is usually a condenser, and a lavalier ' +
  'is usually an electret condenser.';

export const MIC_TYPES: MicTypeCard[] = [
  {
    key: 'dynamic',
    name: 'Moving-Coil Dynamic',
    kind: 'dynamic',
    klass: 'transducer',
    what: 'A passive electromagnetic transducer — a coil on the diaphragm moves in a magnetic field.',
    traits: [
      'Passive — no power required',
      'Generally rugged',
      'Often relatively low sensitivity',
      'Commonly handles very high SPL',
    ],
    apps: 'Live vocals, drums, guitar amplifiers, general reinforcement.',
    limitation: 'Transient and high-frequency detail is generally below a good condenser.',
  },
  {
    key: 'condenser',
    name: 'Condenser',
    kind: 'condenser',
    klass: 'transducer',
    what: 'A capacitor capsule — the diaphragm is one plate; internal electronics convert capacitance changes to signal.',
    traits: [
      'Active — electronics require power',
      'High sensitivity and detail',
      'Excellent transient response',
      'Wide, extended frequency response',
    ],
    apps: 'Studio vocals, acoustic instruments, overheads, orchestral and critical recording.',
    limitation: 'Needs powering; generally more delicate than a moving-coil dynamic.',
  },
  {
    key: 'electret',
    name: 'Electret Condenser',
    kind: 'electret',
    klass: 'transducer',
    what: 'A condenser whose capsule carries a permanently charged material — no external polarizing voltage needed.',
    traits: [
      'Tiny to full-size capsules',
      'Low power demands (bias / battery / phantom)',
      'Quality ranges from consumer to excellent',
      'The engine inside most miniature mics',
    ],
    apps: 'Lavaliers, headsets, phones, measurement capsules, many studio mics.',
    limitation: 'Quality varies enormously by design — "electret" alone tells you little.',
  },
  {
    key: 'ribbon',
    name: 'Ribbon',
    kind: 'ribbon',
    klass: 'transducer',
    what: 'A thin corrugated metal ribbon suspended in a magnetic field — the ribbon IS the diaphragm.',
    traits: [
      'Usually passive',
      'Natural figure-8 pattern',
      'Smooth, gentle high-frequency rolloff',
      'Low output — wants a quality preamp',
    ],
    apps: 'Guitar amplifiers, brass, drum rooms, smoothing bright sources.',
    limitation: 'Fragile — wind blasts, drops, and mis-wired phantom can damage the ribbon.',
  },
  {
    key: 'ldc',
    name: 'Large-Diaphragm Condenser',
    kind: 'ldc',
    klass: 'form',
    what: 'A condenser built around a large (≈1") capsule, usually side-address in a shock-mounted body.',
    traits: [
      'Typically very low self-noise',
      'Flattering, present voicing common',
      'Often multiple selectable patterns',
      'Studio centerpiece form factor',
    ],
    apps: 'Studio vocals, voiceover, room and instrument recording.',
    limitation: 'Off-axis response is usually less consistent than a small-diaphragm design.',
  },
  {
    key: 'sdc',
    name: 'Small-Diaphragm Condenser',
    kind: 'sdc',
    klass: 'form',
    what: 'A condenser with a small capsule in a pencil body, addressed from the end.',
    traits: [
      'Very consistent off-axis response',
      'Precise transient capture',
      'Compact and easy to aim',
      'The standard for stereo pairs',
    ],
    apps: 'Acoustic instruments, drum overheads, choir, orchestra, stereo arrays.',
    limitation: 'Self-noise typically runs higher than a comparable large-diaphragm design.',
  },
  {
    key: 'lav',
    name: 'Lavalier',
    kind: 'lav',
    klass: 'form',
    what: 'A miniature (electret) capsule worn on clothing, usually with a wireless transmitter.',
    traits: [
      'Hands-free and nearly invisible',
      'Constant distance to the talker',
      'Usually omnidirectional',
      'Made for bodies, sweat and motion',
    ],
    apps: 'Television, theater, corporate presentation, interviews.',
    limitation: 'Clothing noise and chest placement compromise the tonal ideal.',
  },
  {
    key: 'headworn',
    name: 'Headworn',
    kind: 'headworn',
    klass: 'form',
    what: 'A miniature capsule on an ear-mounted boom, holding position at the mouth.',
    traits: [
      'Constant mic-to-mouth distance while moving',
      'High gain-before-feedback for a tiny mic',
      'Hands completely free',
      'Sweat-resistant designs available',
    ],
    apps: 'Presenters, theater leads, fitness and dance instruction, worship.',
    limitation: 'Visible on camera; needs per-user fitting and careful hygiene.',
  },
  {
    key: 'shotgun',
    name: 'Shotgun / Interference-Tube',
    kind: 'shotgun',
    klass: 'form',
    what: 'A DIRECTIVITY design: a slotted tube in front of a (condenser) capsule cancels off-axis sound.',
    traits: [
      'Strong forward directivity',
      'Reaches a source from a distance',
      'The film / TV boom standard',
      'Wind protection accessories standard',
    ],
    apps: 'Film and video dialogue, location sound, boom operation, sports.',
    limitation: 'Tube directivity weakens at low frequencies, and indoor reflections can color it — a shotgun is not a zoom lens.',
  },
  {
    key: 'boundary',
    name: 'Boundary',
    kind: 'boundary',
    klass: 'form',
    what: 'A capsule mounted flush at a large surface, using the boundary itself to avoid surface-reflection comb filtering.',
    traits: [
      'Invisible in the room',
      'Even pickup across a surface area',
      'No stand in the shot',
      'Half-space pickup at the boundary',
    ],
    apps: 'Conference tables, stage floors, piano lids, installed rooms.',
    limitation: 'It hears the whole surface and the room — you place the SURFACE, not the mic.',
  },
  {
    key: 'measurement',
    name: 'Measurement',
    kind: 'measurement',
    klass: 'form',
    what: 'A small omni (electret) capsule engineered for FLAT response and stable calibration — accuracy, not flattery.',
    traits: [
      'Flat, documented response',
      'Omnidirectional by design',
      'Individually calibrated versions exist',
      'Built for analyzers, not consoles',
    ],
    apps: 'Room analysis, system tuning, SPL measurement, RTA work.',
    limitation: 'Flat + omni is rarely the "musical" choice for production sound.',
  },
  {
    key: 'contact',
    name: 'Contact',
    kind: 'contact',
    klass: 'form',
    what: 'A transducer that senses VIBRATION of a surface directly — it does not listen to the air at all.',
    traits: [
      'Extreme isolation from the room',
      'Immune to acoustic feedback paths',
      'Hears only what it touches',
      'Tiny and hideable',
    ],
    apps: 'Acoustic instruments on loud stages, experimental sound design.',
    limitation: 'It captures the surface, not the instrument’s sound in air — the tone is different.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Lesson 2 — Characteristics That Matter

export type Characteristic = { key: string; name: string; why: string[]; flag?: string };

export const CHAR_INTRO =
  '"Dynamic vs. condenser" is nowhere near enough information to choose a microphone. ' +
  'These are the characteristics that actually drive a selection — tap each one.';

export const CHARACTERISTICS: Characteristic[] = [
  {
    key: 'pattern',
    name: 'Polar pattern',
    why: [
      'Where the microphone listens — and just as importantly, where it does NOT.',
      'Drives feedback resistance on stage, bleed on a drum kit, and room sound in an untreated space.',
    ],
  },
  {
    key: 'response',
    name: 'Frequency response',
    why: [
      'The microphone’s tonal shape: what it emphasizes, what it attenuates.',
      'Read the curve against the SOURCE and the JOB — a shaped response can be exactly right.',
    ],
    flag: 'Flat is not synonymous with better.',
  },
  {
    key: 'sensitivity',
    name: 'Sensitivity',
    why: [
      'How much electrical output the mic produces for a given acoustic pressure (mV/Pa).',
      'Quiet acoustic source → higher sensitivity is potentially useful. Very loud source → lower sensitivity may be completely appropriate.',
    ],
    flag: 'Higher sensitivity does not automatically mean a better microphone.',
  },
  {
    key: 'maxspl',
    name: 'Maximum SPL',
    why: [
      'How much acoustic level the mic accepts before exceeding its specified distortion limit.',
      'A kick drum or guitar cabinet up close can exceed 140 dB SPL — the spec decides, not the label.',
    ],
  },
  {
    key: 'selfnoise',
    name: 'Self-noise',
    why: [
      'The noise the mic’s own electronics contribute, usually stated in dB(A).',
      'Matters most on QUIET sources — room ambience, soft strings — where it sits right under the signal.',
    ],
  },
  {
    key: 'snr',
    name: 'Signal-to-noise ratio',
    why: [
      'Sensitivity and self-noise combined into one usable number: how far the signal sits above the mic’s own noise for a reference level.',
    ],
  },
  {
    key: 'enl',
    name: 'Equivalent noise level',
    why: [
      'Self-noise expressed as the SPL that would produce the same output — "this mic hisses like a 14 dB SPL room."',
    ],
  },
  {
    key: 'impedance',
    name: 'Output impedance',
    why: [
      'How the mic drives long cables and interacts with the preamp input. Low output impedance into a much higher preamp impedance is the professional norm.',
    ],
  },
  {
    key: 'power',
    name: 'Phantom / bias requirements',
    why: [
      'What the rig must supply. If the location’s recorder or console can’t power it, the "better" mic is the wrong mic.',
    ],
  },
  {
    key: 'transient',
    name: 'Transient behavior',
    why: [
      'How faithfully the mic tracks fast attacks — snare cracks, plucked strings, percussion detail.',
    ],
  },
  {
    key: 'offaxis',
    name: 'Off-axis response',
    why: [
      'What the mic sounds like from the sides and rear. Bleed always arrives off-axis — the QUESTION is whether it arrives colored or natural.',
    ],
  },
  {
    key: 'proximity',
    name: 'Proximity effect',
    why: [
      'Directional mics boost bass as the source gets close. A tool (vocal warmth on stage) or a problem (boomy lectern speech) — selection decides which.',
    ],
  },
  {
    key: 'size',
    name: 'Physical size',
    why: [
      'Determines where the mic can physically GO — inside a kick drum port, over a film frame line, on a collar.',
    ],
  },
  {
    key: 'weight',
    name: 'Weight',
    why: [
      'A boom operator holds this mic overhead for hours. Grams matter in ways spec sheets don’t advertise.',
    ],
  },
  {
    key: 'rugged',
    name: 'Ruggedness',
    why: [
      'Will it survive the drop, the drum stick, the van? Road mics are chosen for this above almost everything.',
    ],
  },
  {
    key: 'environment',
    name: 'Environmental suitability',
    why: [
      'Wind, rain, humidity, temperature swings, sweat, salt air. Outdoors is a different planet from a control room.',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Lesson 3 — Polar Pattern Selection

export type PatternKey = 'omni' | 'cardioid' | 'super' | 'hyper' | 'fig8';

export const PATTERNS: { key: PatternKey; name: string; blurb: string }[] = [
  { key: 'omni', name: 'Omni', blurb: 'Equal pickup in all directions.' },
  { key: 'cardioid', name: 'Cardioid', blurb: 'Front pickup, rear rejection.' },
  { key: 'super', name: 'Supercardioid', blurb: 'Tighter front, small rear lobe.' },
  { key: 'hyper', name: 'Hypercardioid', blurb: 'Tighter still, larger rear lobe.' },
  { key: 'fig8', name: 'Figure-8', blurb: 'Front AND back; maximum side rejection.' },
];

/** Normalized pattern magnitude at angle θ (radians, 0 = on-axis front). */
export function polarR(p: PatternKey, theta: number): number {
  const c = Math.cos(theta);
  switch (p) {
    case 'omni':
      return 1;
    case 'cardioid':
      return Math.abs(0.5 + 0.5 * c);
    case 'super':
      return Math.abs(0.366 + 0.634 * c);
    case 'hyper':
      return Math.abs(0.25 + 0.75 * c);
    case 'fig8':
      return Math.abs(c);
  }
}

/** Stage neighbours around the mic. angleDeg: 0 = front (up), clockwise. */
export type StageSource = { key: string; label: string; angleDeg: number; dist: number; wanted?: boolean };

export const STAGE_SOURCES: StageSource[] = [
  { key: 'source', label: 'WANTED SOURCE', angleDeg: 0, dist: 0.72, wanted: true },
  { key: 'audience', label: 'Audience', angleDeg: 38, dist: 0.95 },
  { key: 'drums', label: 'Drum kit', angleDeg: 96, dist: 0.8 },
  { key: 'monitor', label: 'Monitor', angleDeg: 180, dist: 0.62 },
  { key: 'wall', label: 'Reflective wall', angleDeg: 232, dist: 0.98 },
  { key: 'hvac', label: 'HVAC', angleDeg: 292, dist: 0.9 },
];

export const PATTERN_REASONS: { key: string; text: string; goodFor: PatternKey[] }[] = [
  { key: 'rear', text: 'Reject sound arriving from behind the microphone', goodFor: ['cardioid'] },
  { key: 'near', text: 'Reduce a nearby unwanted source with a tighter front pickup', goodFor: ['super', 'hyper'] },
  { key: 'equal', text: 'Need equal pickup in all directions', goodFor: ['omni'] },
  { key: 'frontback', text: 'Need front AND back pickup at once', goodFor: ['fig8'] },
  { key: 'side', text: 'Need maximum rejection at the sides', goodFor: ['fig8'] },
];

export const PATTERN_LESSON =
  'A polar pattern is a DECISION tool: you are choosing what to reject as much as what to pick up. ' +
  'How patterns are physically created lives in the microphone-principles lab — here, only the choice matters.';

// ─────────────────────────────────────────────────────────────────────────────
// Lesson 4 — Frequency Response & Tonal Character

export type CurveCard = {
  key: string;
  name: string;
  /** Normalized points [x 0..1 (log 20 Hz→20 kHz), y dB −14..+8]. */
  pts: [number, number][];
  emphasize: string;
  attenuate: string;
  useful: string;
};

export const CURVES: CurveCard[] = [
  {
    key: 'a',
    name: 'A · Relatively flat',
    pts: [
      [0, -1.5],
      [0.08, -0.4],
      [0.2, 0],
      [0.5, 0],
      [0.8, 0.3],
      [0.92, -0.3],
      [1, -1.8],
    ],
    emphasize: 'Nothing in particular — it reports the source as it is.',
    attenuate: 'Only the extreme ends, gently.',
    useful: 'Critical recording, measurement-adjacent work, sources whose tone is already right.',
  },
  {
    key: 'b',
    name: 'B · Presence rise (3–6 kHz)',
    pts: [
      [0, -1],
      [0.2, 0],
      [0.55, 0.2],
      [0.72, 2.2],
      [0.8, 4.2],
      [0.87, 2.4],
      [0.94, 0.4],
      [1, -1.2],
    ],
    emphasize: 'Speech intelligibility and vocal "cut" in the presence band.',
    attenuate: 'Nothing dramatic — the rise IS the shaping.',
    useful: 'Vocals that must ride over a band, broadcast speech, live reinforcement.',
  },
  {
    key: 'c',
    name: 'C · Low-frequency rolloff',
    pts: [
      [0, -12],
      [0.1, -8],
      [0.2, -3.5],
      [0.3, -1],
      [0.42, 0],
      [0.7, 0.2],
      [0.9, 0],
      [1, -1],
    ],
    emphasize: 'The midrange, by getting the low end out of the way.',
    attenuate: 'Rumble, handling noise, stage wash, HVAC — everything below ~150 Hz.',
    useful: 'Lecterns and stages with structure-borne noise; sources with no useful lows.',
  },
  {
    key: 'd',
    name: 'D · Extended high-frequency response',
    pts: [
      [0, -2],
      [0.2, 0],
      [0.55, 0],
      [0.78, 0.8],
      [0.9, 2.6],
      [1, 3.2],
    ],
    emphasize: '"Air" — harmonic detail at the very top of the spectrum.',
    attenuate: 'Nothing; the point is what it keeps.',
    useful: 'Overheads, acoustic instruments, orchestral work where sheen matters.',
  },
  {
    key: 'e',
    name: 'E · Strongly shaped (application-voiced)',
    pts: [
      [0, 1],
      [0.12, 5],
      [0.22, 3],
      [0.38, -4],
      [0.5, -7.5],
      [0.62, -4],
      [0.76, 4.5],
      [0.86, 5.5],
      [0.95, 1],
      [1, -2],
    ],
    emphasize: 'Low-end punch AND attack click at once.',
    attenuate: 'The boxy low-mids between them, aggressively.',
    useful: 'A kick-drum-style voicing: the EQ is built into the microphone.',
  },
];

export const CURVE_LESSON =
  'Flat is not synonymous with better. A deliberately shaped response may be exactly what an ' +
  'application requires — the curve is a design decision you are choosing to agree with.';

// ─────────────────────────────────────────────────────────────────────────────
// Lesson 5 — Sensitivity, Noise & SPL

export type SourceTier = { key: string; label: string; examples: string };

export const SOURCE_TIERS: SourceTier[] = [
  { key: 'vquiet', label: 'Very quiet', examples: 'Room ambience · soft acoustic instrument' },
  { key: 'quiet', label: 'Quiet', examples: 'Speech · acoustic guitar' },
  { key: 'mid', label: 'Moderate', examples: 'Strong vocal · brass' },
  { key: 'loud', label: 'Loud', examples: 'Snare drum · guitar cabinet' },
  { key: 'vloud', label: 'Extremely loud', examples: 'Kick drum, close' },
];

export type MicProfile = { key: string; name: string; kind: MicKind; traits: string };

export const MIC_PROFILES: MicProfile[] = [
  { key: 'cond', name: 'Studio condenser', kind: 'ldc', traits: 'High sensitivity · very low self-noise · moderate max SPL' },
  { key: 'dyn', name: 'Moving-coil dynamic', kind: 'dynamic', traits: 'Low sensitivity · passive · very high max SPL' },
  { key: 'lav', name: 'Electret lavalier', kind: 'lav', traits: 'Medium sensitivity · moderate self-noise · medium max SPL' },
];

export type MatchVerdict = 'good' | 'caution' | 'watch';

/** verdicts[tier][profile] — honest, spec-driven matches with the reason. */
export const SPL_MATCH: Record<string, Record<string, { v: MatchVerdict; note: string }>> = {
  vquiet: {
    cond: { v: 'good', note: 'High sensitivity + very low self-noise: built for exactly this.' },
    dyn: { v: 'caution', note: 'It works — but a quiet source through low sensitivity demands lots of clean preamp gain; the noise you hear will come from the chain.' },
    lav: { v: 'caution', note: 'Its self-noise sits close under a source this quiet — audible hiss is likely.' },
  },
  quiet: {
    cond: { v: 'good', note: 'Comfortable: plenty of output, noise floor far below the source.' },
    dyn: { v: 'watch', note: 'Usable with a good preamp; detail and noise depend on the chain.' },
    lav: { v: 'good', note: 'Speech is what a lavalier is designed around.' },
  },
  mid: {
    cond: { v: 'good', note: 'Well within range — output is strong, noise is irrelevant here.' },
    dyn: { v: 'good', note: 'Solid territory: hot enough source that low sensitivity is no cost.' },
    lav: { v: 'good', note: 'Fine — placement, not electronics, is the challenge now.' },
  },
  loud: {
    cond: { v: 'watch', note: 'Check the max SPL spec (and use the pad if fitted) — many handle it; the SPEC decides, not the "condenser" label.' },
    dyn: { v: 'good', note: 'Classic use: very high SPL capability and low sensitivity are exactly right.' },
    lav: { v: 'caution', note: 'Approaching its limits — miniature capsules distort earlier.' },
  },
  vloud: {
    cond: { v: 'caution', note: 'Only with a documented very-high max SPL rating and the pad engaged.' },
    dyn: { v: 'good', note: 'This is why these mics live inside kick drums.' },
    lav: { v: 'caution', note: 'Wrong tool — expect distortion well before the source peaks.' },
  },
};

export const SPL_LESSON =
  'Three specs, one question: can THIS microphone capture THIS source cleanly? Sensitivity sets how much ' +
  'output you get, self-noise sets the floor under quiet sources, and maximum SPL sets the ceiling over loud ones.';

// ─────────────────────────────────────────────────────────────────────────────
// Lesson 6 — Active vs Passive / Power

export type PowerCase = { key: string; name: string; kind: MicKind; powered: boolean; lines: string[] };

export const POWER_CASES: PowerCase[] = [
  {
    key: 'dyn',
    name: 'Passive moving-coil',
    kind: 'dynamic',
    powered: false,
    lines: ['No powering required.', 'Plug in anywhere with a mic input.'],
  },
  {
    key: 'ribbon',
    name: 'Passive ribbon',
    kind: 'ribbon',
    powered: false,
    lines: [
      'No powering required by the ribbon motor itself.',
      '(Active ribbon designs with built-in electronics exist — those DO need power.)',
    ],
  },
  {
    key: 'cond',
    name: 'Condenser',
    kind: 'ldc',
    powered: true,
    lines: ['The electronics require power.', 'In professional rigs that is most commonly 48 V phantom power on the mic cable.'],
  },
];

export const POWER_NUANCE =
  '"Condenser" does not necessarily mean "48 V only." Some run on batteries, lower-voltage phantom ' +
  'schemes, plug-in power from a camera or recorder, or proprietary powering. For professional audio, ' +
  'however, 48 V phantom is extremely common — the selection question is simply: can the rig on THIS job power THIS mic?';

// ─────────────────────────────────────────────────────────────────────────────
// Lesson 7 — Form Factor Matters

export type FormFactor = { key: string; name: string; kind: MicKind; apps: string[] };

export const FORM_FACTORS: FormFactor[] = [
  { key: 'handheld', name: 'Handheld', kind: 'dynamic', apps: ['Vocal performance', 'Interviews', 'Presentations'] },
  { key: 'lav', name: 'Lavalier', kind: 'lav', apps: ['Television', 'Theater', 'Corporate presentation'] },
  { key: 'headworn', name: 'Headworn', kind: 'headworn', apps: ['Presenters', 'Theater', 'Fitness / instruction'] },
  { key: 'shotgun', name: 'Shotgun', kind: 'shotgun', apps: ['Film / video', 'Location dialogue', 'Boom operation'] },
  { key: 'boundary', name: 'Boundary', kind: 'boundary', apps: ['Conference table', 'Stage / floor', 'Installed rooms'] },
  { key: 'sdc', name: 'Pencil / SDC', kind: 'sdc', apps: ['Instrument recording', 'Stereo arrays', 'Choir / orchestra'] },
  { key: 'ldc', name: 'Large-diaphragm studio', kind: 'ldc', apps: ['Vocals', 'Voiceover', 'Instruments'] },
];

export const FORM_LESSON =
  'The same capsule technology in a different body is a different tool. ' +
  'The physical design of a microphone can be as important as its specifications.';

// ─────────────────────────────────────────────────────────────────────────────
// Lesson 8 — Selecting for the Environment

export type EnvScenario = { key: string; title: string; sub: string; priorities: string[] };

export const ENV_SCENARIOS: EnvScenario[] = [
  {
    key: 'studio',
    title: 'A · Controlled recording studio',
    sub: 'The room is quiet, treated, and yours.',
    priorities: ['Tonal detail', 'Low self-noise', 'The desired frequency response', 'Controlled acoustics let you choose freely'],
  },
  {
    key: 'stage',
    title: 'B · Loud concert stage',
    sub: 'Monitors, backline, and a PA all fighting the vocal.',
    priorities: ['Feedback rejection (pattern!)', 'Well-behaved off-axis response', 'Ruggedness', 'Low handling noise', 'Bleed control'],
  },
  {
    key: 'outdoor',
    title: 'C · Outdoor interview',
    sub: 'Weather, traffic, and no acoustics at all.',
    priorities: ['Wind protection', 'Handling noise', 'Isolation from surroundings', 'Physical placement options', 'Environmental protection'],
  },
];

export const ENV_LESSON =
  'Same human voice. Three very different microphone-selection problems. ' +
  'The environment changes the priorities before the first spec sheet is opened.';

// ─────────────────────────────────────────────────────────────────────────────
// Lesson 9 — Application Explorer

export type JobEntry = {
  key: string;
  name: string;
  /** [characteristic, stars 1..5] */
  ratings: [string, number][];
  note: string;
};

export type JobGroup = { key: string; name: string; jobs: JobEntry[] };

export const JOB_GROUPS: JobGroup[] = [
  {
    key: 'voice',
    name: 'Voice',
    jobs: [
      { key: 'livevocal', name: 'Live vocal', ratings: [['Feedback rejection', 5], ['Ruggedness', 5], ['Handling noise', 4], ['Tonal detail', 3]], note: 'A tight pattern, a body that survives the road, and a presence rise that cuts.' },
      { key: 'studiovocal', name: 'Studio vocal', ratings: [['Tonal detail', 5], ['Self-noise', 5], ['Desired voicing', 4], ['Max SPL', 2]], note: 'Low noise and the RIGHT response for this singer — pattern matters less in a treated room.' },
      { key: 'voiceover', name: 'Voiceover', ratings: [['Self-noise', 5], ['Tonal detail', 5], ['Proximity behavior', 3], ['Ruggedness', 1]], note: 'The mic sits inches from a quiet, controlled voice — noise floor is everything.' },
      { key: 'podcast', name: 'Podcast', ratings: [['Room rejection', 4], ['Ease of use', 4], ['Tonal detail', 3], ['Self-noise', 3]], note: 'Untreated rooms favor directional mics worked close.' },
      { key: 'interview', name: 'Interview', ratings: [['Ruggedness', 4], ['Handling noise', 4], ['Wind tolerance', 4], ['Tonal detail', 3]], note: 'Field conditions: a mic that forgives handling, weather, and hurry.' },
      { key: 'lectern', name: 'Lectern', ratings: [['Feedback rejection', 5], ['LF rolloff', 4], ['Discreet size', 4], ['Tonal detail', 2]], note: 'A slim directional capsule with the rumble rolled off before it starts.' },
      { key: 'theater', name: 'Theater', ratings: [['Invisibility', 5], ['Gain-before-feedback', 5], ['Sweat/wear tolerance', 4], ['Tonal detail', 3]], note: 'Headworn or hidden lavalier — the audience must never see it.' },
      { key: 'broadcast', name: 'Broadcast', ratings: [['Speech intelligibility', 5], ['Consistency', 5], ['Self-noise', 4], ['Max SPL', 2]], note: 'A voiced, repeatable speech response, hour after hour.' },
    ],
  },
  {
    key: 'instruments',
    name: 'Instruments',
    jobs: [
      { key: 'kick', name: 'Kick', ratings: [['Max SPL', 5], ['LF response', 5], ['Ruggedness', 4], ['Self-noise', 1]], note: 'Extreme SPL plus a voicing (or EQ) for punch and click.' },
      { key: 'snare', name: 'Snare', ratings: [['Max SPL', 5], ['Ruggedness', 5], ['Isolation', 4], ['Self-noise', 1]], note: 'It WILL be hit by a stick eventually. Plan for that.' },
      { key: 'toms', name: 'Toms', ratings: [['Max SPL', 5], ['Compact mounting', 4], ['Isolation', 4], ['Self-noise', 1]], note: 'Clip-on dynamics exist for exactly this geometry.' },
      { key: 'overheads', name: 'Cymbals / overheads', ratings: [['Transient detail', 5], ['Extended HF', 4], ['Off-axis consistency', 4], ['Max SPL', 3]], note: 'The whole kit arrives off-axis — it must arrive sounding natural.' },
      { key: 'gtramp', name: 'Guitar amplifier', ratings: [['Max SPL', 5], ['Ruggedness', 4], ['Midrange voicing', 4], ['Self-noise', 1]], note: 'Loud, close, midrange-dense: dynamics and ribbons live here.' },
      { key: 'acgtr', name: 'Acoustic guitar', ratings: [['Transient detail', 5], ['Self-noise', 4], ['Off-axis consistency', 4], ['Max SPL', 2]], note: 'Small-diaphragm precision on a quiet, detailed source.' },
      { key: 'piano', name: 'Piano', ratings: [['Off-axis consistency', 5], ['Transient detail', 4], ['Self-noise', 4], ['Stereo pairing', 4]], note: 'A huge source — matched pairs and even off-axis behavior.' },
      { key: 'strings', name: 'Strings', ratings: [['Self-noise', 5], ['Smooth HF', 4], ['Tonal detail', 4], ['Max SPL', 1]], note: 'Quiet and delicate; harshness shows instantly.' },
      { key: 'brass', name: 'Brass', ratings: [['Max SPL', 4], ['Smooth HF', 4], ['Tonal detail', 3], ['Ruggedness', 3]], note: 'Loud AND bright — ribbons’ gentle top is a classic answer.' },
      { key: 'woodwinds', name: 'Woodwinds', ratings: [['Self-noise', 4], ['Tonal detail', 4], ['Off-axis consistency', 4], ['Max SPL', 2]], note: 'The sound comes from the whole instrument, not the bell — even pickup matters.' },
      { key: 'perc', name: 'Percussion', ratings: [['Transient detail', 5], ['Max SPL', 4], ['Ruggedness', 3], ['Self-noise', 2]], note: 'Attack fidelity first; some pieces are shockingly loud.' },
    ],
  },
  {
    key: 'production',
    name: 'Production / AV',
    jobs: [
      { key: 'film', name: 'Film dialogue', ratings: [['Directivity', 5], ['Out-of-frame reach', 5], ['Wind protection', 4], ['Weight', 4]], note: 'Directional reach from above the frame line — the shotgun’s home.' },
      { key: 'boom', name: 'Boom', ratings: [['Weight', 5], ['Directivity', 5], ['Handling noise', 4], ['Ruggedness', 3]], note: 'Someone holds this overhead for hours. Grams count.' },
      { key: 'conference', name: 'Conference room', ratings: [['Invisibility', 4], ['Even coverage', 4], ['Speech clarity', 4], ['Tonal detail', 2]], note: 'Boundary mics disappear into the table and hear everyone.' },
      { key: 'how', name: 'House of worship', ratings: [['Feedback rejection', 5], ['Invisibility', 4], ['Consistency', 4], ['Tonal detail', 3]], note: 'Live-stage rules plus broadcast rules, simultaneously.' },
      { key: 'stage', name: 'Stage', ratings: [['Feedback rejection', 5], ['Ruggedness', 5], ['Bleed control', 4], ['Tonal detail', 3]], note: 'Reinforcement first: pattern and toughness over refinement.' },
      { key: 'measure', name: 'Measurement', ratings: [['Flat response', 5], ['Calibration', 5], ['Omni pattern', 5], ['Voicing', 1]], note: 'Accuracy is the entire job — flattery is disqualifying.' },
      { key: 'ambience', name: 'Ambience', ratings: [['Self-noise', 5], ['Stereo imaging', 4], ['Extended response', 4], ['Max SPL', 1]], note: 'The room IS the source — the mic must be quieter than it.' },
      { key: 'field', name: 'Field recording', ratings: [['Self-noise', 5], ['Wind protection', 5], ['Environmental toughness', 4], ['Power flexibility', 3]], note: 'Nature is quiet and the weather is real; batteries beat phantom miles from power.' },
    ],
  },
];

export const JOBS_LESSON =
  'No "correct microphone" is listed on purpose. The job defines PRIORITIES; the priorities select ' +
  'CHARACTERISTICS; the characteristics — not habits or brand names — select the microphone.';

// ─────────────────────────────────────────────────────────────────────────────
// Final Challenge — Choose the Microphone

export type ChallengeMic = { key: string; label: string; kind: MicKind; specs: string[] };

export const CHALLENGE_MICS: ChallengeMic[] = [
  { key: 'A', label: 'Microphone A', kind: 'ldc', specs: ['Large-diaphragm condenser', 'Cardioid', 'High sensitivity', 'Very low self-noise'] },
  { key: 'B', label: 'Microphone B', kind: 'shotgun', specs: ['Shotgun condenser', 'Highly directional', 'Wind protection available', 'Boom-ready'] },
  { key: 'C', label: 'Microphone C', kind: 'measurement', specs: ['Omni measurement mic', 'Flat response', 'Calibrated', 'No wind accessories'] },
  { key: 'D', label: 'Microphone D', kind: 'dynamic', specs: ['Handheld moving-coil', 'Cardioid', 'Rugged', 'Low handling noise'] },
  { key: 'E', label: 'Microphone E', kind: 'lav', specs: ['Wireless lavalier (electret)', 'Omni miniature capsule', 'Body-worn', 'Windjammer available'] },
];

export const CHALLENGE_BASE = {
  title: 'Outdoor interview',
  conditions: ['One speaker', 'Moderate traffic noise', 'Wind', 'Camera must stay several feet away', 'Boom operator available'],
  correct: 'B',
  accept: [] as string[],
  explain:
    'With a boom operator and a distant camera, the shotgun’s directivity reaches the speaker, rejects the traffic, ' +
    'and takes proper wind protection. The LDC is too sensitive to wind and handling; the measurement omni hears the ' +
    'whole street; the handheld would be in the shot.',
};

export const CHALLENGE_FACTORS: { key: string; label: string; correct: boolean }[] = [
  { key: 'directivity', label: 'Directionality', correct: true },
  { key: 'distance', label: 'Working distance / application', correct: true },
  { key: 'wind', label: 'Wind protection', correct: true },
  { key: 'maxspl', label: 'Maximum SPL', correct: false },
  { key: 'vintage', label: 'Vintage appearance', correct: false },
  { key: 'impedance', label: 'Lowest impedance', correct: false },
];

export type ChallengeVariant = { key: string; prompt: string; correct: string; accept: string[]; explain: string };

export const CHALLENGE_VARIANTS: ChallengeVariant[] = [
  {
    key: 'noboom',
    prompt: 'The boom operator is no longer available. Choose again.',
    correct: 'D',
    accept: ['E'],
    explain:
      'No boom means the mic must live with the speaker: the rugged handheld in the interviewer’s hand is the classic ' +
      'field answer (the wireless lavalier is also defensible — hands-free, but slower to rig and more clothing-noise risk in wind).',
  },
  {
    key: 'studio',
    prompt: 'The interview is now inside a quiet studio. Choose again.',
    correct: 'A',
    accept: [],
    explain:
      'Wind and traffic are gone, and the priorities flip to tonal detail and low noise — exactly what the ' +
      'large-diaphragm condenser was built for. The shotgun’s tube can sound colored indoors.',
  },
  {
    key: 'walking',
    prompt: 'The interviewee must walk around freely. Choose again.',
    correct: 'E',
    accept: [],
    explain:
      'Movement rules out the boom and the fixed handheld frame: the wireless lavalier travels WITH the speaker at a ' +
      'constant distance, with a windjammer for outside.',
  },
];

export const CHALLENGE_LESSON =
  'There is no universally "best" microphone. There is a microphone that is appropriate for the source, ' +
  'the environment, the placement, the production requirements, and the desired result.';

// ─────────────────────────────────────────────────────────────────────────────
// Optional — Build Your Mic Locker

export type LockerMic = { key: string; name: string; kind: MicKind; covers: string[] };

export const LOCKER_JOBS: { key: string; name: string }[] = [
  { key: 'vocrec', name: 'Vocal recording' },
  { key: 'livevoc', name: 'Live vocal' },
  { key: 'kick', name: 'Kick drum' },
  { key: 'snare', name: 'Snare' },
  { key: 'acgtr', name: 'Acoustic guitar' },
  { key: 'gtrcab', name: 'Guitar cabinet' },
  { key: 'piano', name: 'Piano' },
  { key: 'interview', name: 'Interview' },
  { key: 'choir', name: 'Choir' },
  { key: 'field', name: 'Field recording' },
];

export const LOCKER_MICS: LockerMic[] = [
  { key: 'ldc', name: 'Large-diaphragm condenser', kind: 'ldc', covers: ['vocrec', 'piano', 'acgtr'] },
  { key: 'handheld', name: 'Handheld dynamic', kind: 'dynamic', covers: ['livevoc', 'interview', 'gtrcab'] },
  { key: 'instdyn', name: 'Instrument dynamic', kind: 'dynamic', covers: ['snare', 'gtrcab'] },
  { key: 'kickdyn', name: 'Large-diaphragm dynamic (kick)', kind: 'dynamic', covers: ['kick', 'gtrcab'] },
  { key: 'sdcpair', name: 'Small-diaphragm condenser pair', kind: 'sdc', covers: ['acgtr', 'piano', 'choir', 'field'] },
  { key: 'shotgun', name: 'Shotgun + wind kit', kind: 'shotgun', covers: ['interview', 'field'] },
  { key: 'lav', name: 'Wireless lavalier', kind: 'lav', covers: ['interview'] },
  { key: 'ribbon', name: 'Ribbon', kind: 'ribbon', covers: ['gtrcab'] },
  { key: 'boundary', name: 'Boundary', kind: 'boundary', covers: ['piano'] },
  { key: 'ldc2', name: 'Second large-diaphragm condenser', kind: 'ldc', covers: ['vocrec'] },
];

export const LOCKER_SLOTS = 6;

export const LOCKER_LESSON =
  'Versatility is a characteristic too. If a third large-diaphragm condenser covers nothing new, ' +
  'a small-diaphragm pair might suddenly cover several missing jobs — that is systems thinking.';

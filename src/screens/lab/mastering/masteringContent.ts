/**
 * Mastering Lab — CONTENT (owner spec 2026-10-01: "Mastering Lab: From Final
 * Mix to Release"). Pure data, no React: the module list, every scenario /
 * check with its answer key, the role comparison, the control map, the tool
 * shelf, the delivery contexts and the fictional EP of Module 8. Pinned by
 * test/masteringLabContent.test.ts (answer keys consistent, no hard-coded
 * "the" loudness target).
 *
 * WORDING RULES (owner, hard):
 *  • Never a streaming / CD / vinyl / broadcast loudness or spec as THE rule.
 *    Where a number appears it is an EXAMPLE to verify against the
 *    destination's CURRENT specification. Technical constants that are
 *    facts (Red Book 16-bit/44.1 kHz, BS.1770, R128 / A/85 existing) are fine.
 *  • Monitoring-level guidance protects hearing. Nothing encourages loud.
 *  • Mastering is not simply "making it louder".
 */

export type MasteringModuleId = 'what' | 'roles' | 'room' | 'tools' | 'workflow' | 'loudness' | 'release' | 'project';

export type MasteringModule = { id: MasteringModuleId; num: number; title: string; short: string; objective: string; takeaway: string };

export const MASTERING_MODULES: readonly MasteringModule[] = [
  {
    id: 'what', num: 1, title: 'What mastering is', short: 'WHAT',
    objective: 'Place mastering in the project chain, name what it can and cannot change, and hear why a louder version is not automatically a better one.',
    takeaway: 'Mastering is the final listening, decision-making and delivery stage. It can shape the whole programme; it cannot rebalance the parts of a stereo mix. When one element is wrong, the honest move is a mix revision.',
  },
  {
    id: 'roles', num: 2, title: 'Mixing engineer, mastering engineer', short: 'ROLES',
    objective: 'Separate the two jobs by what each one controls, and know which of them can address a given request.',
    takeaway: 'The mixer shapes relationships among tracks; the mastering engineer evaluates the finished programme and prepares it for release. Same ears, different perspective, different control.',
  },
  {
    id: 'room', num: 3, title: 'The room and the monitoring system', short: 'ROOM',
    objective: 'Describe the listening environment before the gear list: acoustic control, main and secondary monitoring, a sensible repeatable level, and the complete playback path.',
    takeaway: 'Judgement is only as good as the room and the level it was made at. Build the monitoring path in order, keep the level sensible and consistent, and treat headphones and small speakers as checks, not the reference.',
  },
  {
    id: 'tools', num: 4, title: 'Mastering equipment and tools', short: 'TOOLS',
    objective: 'Group mastering tools by the decisions they support, and pick a tool or a next check from a listening goal rather than a preset.',
    takeaway: 'There is no required chain. EQ for tone, dynamics for density and control, stereo tools for width with a mono check, meters for verification — chosen by the goal, confirmed by listening.',
  },
  {
    id: 'workflow', num: 5, title: 'The mastering workflow', short: 'FLOW',
    objective: 'Walk a typical workflow from mix delivery to quality check, and compare a processed version against the unprocessed mix at matched level.',
    takeaway: 'Receive and inspect, listen before touching anything, decide whether the mix is ready, change only what serves the goal, sequence, deliver to the current spec, and check the exports you actually sent.',
  },
  {
    id: 'loudness', num: 6, title: 'Loudness, dynamics and translation', short: 'LOUD',
    objective: 'Read peak, true peak, integrated loudness and dynamic range in plain language, and judge a louder master against a quieter one at matched level.',
    takeaway: 'The right loudness depends on the content and the destination. Normalization at playback does not make careful mastering pointless, because the processing still changes dynamics and sound. Translation checks are checks.',
  },
  {
    id: 'release', num: 7, title: 'Mastering for release', short: 'RELEASE',
    objective: 'Match the deliverable to the destination — digital distribution, CD, vinyl, broadcast or picture, alternate versions — by confirming the current requirements rather than assuming one setting.',
    takeaway: 'Every destination has its own current specification and every client has a request. Confirm both, deliver exactly that, and document what you delivered.',
  },
  {
    id: 'project', num: 8, title: 'Putting it all together', short: 'PROJECT',
    objective: 'Master a short fictional release end to end: read the brief, sort the problems, choose the checks and tools, sequence the tracks, plan the delivery and complete a final QC.',
    takeaway: 'A mastering job is a sequence of decisions, each one checked by listening and by a meter, and finished by a delivery somebody can actually use.',
  },
];

export const masteringModuleById = (id: string): MasteringModule => MASTERING_MODULES.find((m) => m.id === id) ?? MASTERING_MODULES[0];

/* ── scenarios and checks ────────────────────────────────────────────────── */

/** One decision item. `correct` is BY VALUE (never by index) so re-ordering
 *  the options can never silently change the answer. */
export type Scenario = {
  id: string;
  moduleId: MasteringModuleId;
  prompt: string;
  options: readonly string[];
  correct: string;
  explain: string;
};

/** Module 1 — "Mix issue or mastering issue?" */
export const TRIAGE_OPTIONS = ['Mastering adjustment', 'Mix revision', 'More information from the client'] as const;

export const TRIAGE_SCENARIOS: readonly Scenario[] = [
  { id: 't1', moduleId: 'what', prompt: 'The whole mix sounds slightly dull next to the reference the client sent, on every system in the room.', options: TRIAGE_OPTIONS, correct: 'Mastering adjustment', explain: 'A broad, programme-wide tonal shift is exactly what a mastering EQ addresses — gently, on the whole stereo file.' },
  { id: 't2', moduleId: 'what', prompt: 'The lead vocal sits 3 dB too low in the chorus only; everything else is right.', options: TRIAGE_OPTIONS, correct: 'Mix revision', explain: 'A stereo master has no independent handle on the vocal. Anything that lifts it lifts what shares its range. Ask for a revised mix or a vocal-up version.' },
  { id: 't3', moduleId: 'what', prompt: 'Track 3 arrives 2 dB quieter than the rest of the set, but internally it is well balanced.', options: TRIAGE_OPTIONS, correct: 'Mastering adjustment', explain: 'Consistency ACROSS tracks is a mastering job: level and tone between songs are matched at this stage.' },
  { id: 't4', moduleId: 'what', prompt: 'The file is labelled "final" but the version number is lower than the one in the email thread.', options: TRIAGE_OPTIONS, correct: 'More information from the client', explain: 'Mastering the wrong version wastes everyone\'s time. Confirm the approved version before listening critically.' },
  { id: 't5', moduleId: 'what', prompt: 'A snare hit in bar 12 is distorted — the clipping is on the snare only, not the bus.', options: TRIAGE_OPTIONS, correct: 'Mix revision', explain: 'Distortion baked into one element cannot be removed from a stereo file. The mixer can fix it at the source in seconds.' },
  { id: 't6', moduleId: 'what', prompt: 'The ending fades too slowly for the client\'s taste; the recording itself is clean.', options: TRIAGE_OPTIONS, correct: 'Mastering adjustment', explain: 'Fades, tops and tails are routine mastering edits on the stereo programme.' },
  { id: 't7', moduleId: 'what', prompt: 'The mix peaks at −0.1 dBFS with a limiter already on the mix bus, and the client says "make it competitive".', options: TRIAGE_OPTIONS, correct: 'More information from the client', explain: 'Ask for the mix WITHOUT the bus limiter and ask what "competitive" means to them (a reference, a destination). Stacking limiting on limiting is how dynamics die.' },
  { id: 't8', moduleId: 'what', prompt: 'The stereo image is a little narrow across the whole song and the client wants it wider.', options: TRIAGE_OPTIONS, correct: 'Mastering adjustment', explain: 'Programme-wide width can be adjusted in mastering — with a mono-compatibility check before and after.' },
];

/** Module 2 — "Who has control of that?" */
export type ControlOwner = 'mix' | 'master' | 'either';
export type ControlItem = { id: string; label: string; owner: ControlOwner; why: string; stage: 'tracks' | 'bus' | 'master' | 'delivery' };

export const CONTROL_ITEMS: readonly ControlItem[] = [
  { id: 'vocalLevel', label: 'Lead vocal level', owner: 'mix', stage: 'tracks', why: 'Lives on its own channel in the mix. The stereo master has no separate handle on it.' },
  { id: 'snareTone', label: 'Snare tone', owner: 'mix', stage: 'tracks', why: 'An EQ on the snare channel changes the snare. A mastering EQ at the same frequency changes everything there — vocal consonants, guitars, the lot.' },
  { id: 'bassSub', label: 'Bass vs kick relationship', owner: 'mix', stage: 'tracks', why: 'Two instruments sharing one range: only the mix can move one against the other.' },
  { id: 'brightness', label: 'Overall brightness', owner: 'master', stage: 'master', why: 'A broad tilt or shelf on the whole programme is the classic mastering move.' },
  { id: 'level', label: 'Overall level and density', owner: 'master', stage: 'master', why: 'Programme loudness and peak control for the destination are set at mastering — and judged at matched level.' },
  { id: 'spacing', label: 'Track spacing and running order', owner: 'master', stage: 'delivery', why: 'Sequencing the release — order, gaps, crossfades — is mastering work.' },
  { id: 'format', label: 'Delivery file format', owner: 'master', stage: 'delivery', why: 'Sample rate, bit depth, dither and container are chosen to the destination\'s current requirements at delivery.' },
  { id: 'width', label: 'Stereo width of the whole mix', owner: 'either', stage: 'bus', why: 'Both can adjust programme width. The mixer can also widen one element; mastering only the whole picture, with a mono check.' },
  { id: 'busComp', label: 'Mix-bus "glue" compression', owner: 'either', stage: 'bus', why: 'A mixer may run bus compression while mixing; a mastering engineer may add gentle compression too. Not both, blindly — ask what is already on the bus.' },
  { id: 'fades', label: 'Fade-outs, tops and tails', owner: 'master', stage: 'delivery', why: 'Editing the stereo programme for release is a mastering task.' },
];

export const CONTROL_OWNER_LABEL: Record<ControlOwner, string> = { mix: 'Mixing engineer', master: 'Mastering engineer', either: 'Either — with different reach' };

export const ROLE_SCENARIOS: readonly Scenario[] = [
  { id: 'r1', moduleId: 'roles', prompt: 'A client asks the mastering engineer to "bring the snare forward". What is the honest answer?', options: ['Boost the snare\'s frequencies with the mastering EQ', 'Ask the mixer for a revision, or for a snare-up alternate', 'Add a transient shaper on the whole master'], correct: 'Ask the mixer for a revision, or for a snare-up alternate', explain: 'Any programme-wide move at the snare\'s frequencies drags the vocal and guitars with it. The element lives in the mix.' },
  { id: 'r2', moduleId: 'roles', prompt: 'Which of these is a MASTERING perspective rather than a mixing one?', options: ['How do these eight songs sit next to each other?', 'Does the bass sit under the kick?', 'Is the reverb on the vocal too long?'], correct: 'How do these eight songs sit next to each other?', explain: 'Mastering judges the programme as a whole and across a collection; the other two are relationships inside one mix.' },
  { id: 'r3', moduleId: 'roles', prompt: 'A small project has one person mixing AND mastering. What still changes between the two jobs?', options: ['Nothing — it is the same session', 'The listening perspective and the available control', 'Only the plugins'], correct: 'The listening perspective and the available control', explain: 'The roles can overlap in smaller projects, but mastering listens to the finished stereo programme with fresh ears and works on it as a whole.' },
  { id: 'r4', moduleId: 'roles', prompt: 'Mastering is best described as…', options: ['Making the mix louder', 'The final evaluation, adjustment and delivery stage of the approved mix', 'Re-mixing the song with better plugins'], correct: 'The final evaluation, adjustment and delivery stage of the approved mix', explain: 'Loudness is one of many decisions, and never the definition.' },
];

/** Module 3 — room and monitoring */
export const ROOM_SCENARIOS: readonly Scenario[] = [
  { id: 'm1', moduleId: 'room', prompt: 'Two versions sound different, but you listened to the second one 6 dB louder. What do you know?', options: ['The second is better', 'Nothing yet — match the levels and listen again', 'The first has less bass'], correct: 'Nothing yet — match the levels and listen again', explain: 'Louder reads fuller and brighter. A comparison at different levels tells you about the level, not the decision.' },
  { id: 'm2', moduleId: 'room', prompt: 'Which monitoring level is a sensible working level for a long session?', options: ['As loud as the client likes it', 'A consistent, moderate level you can repeat day to day', 'As quiet as possible so nothing fatigues'], correct: 'A consistent, moderate level you can repeat day to day', explain: 'Repeatable and moderate: comparisons mean something, fatigue is managed, and hearing is protected. Very quiet listening biases tonal judgement thin.' },
  { id: 'm3', moduleId: 'room', prompt: 'Headphones in a mastering room are…', options: ['The reference, because they remove the room', 'A valuable supplementary check that does not replace accurate monitors in a treated room', 'Never used'], correct: 'A valuable supplementary check that does not replace accurate monitors in a treated room', explain: 'Headphones reveal detail and are a translation check. Stereo image, low-frequency judgement and level are still referenced to the main room.' },
  { id: 'm4', moduleId: 'room', prompt: 'Where does the DAW sit in the monitoring path?', options: ['After the monitor controller', 'At the start: playback → conversion → monitor control → amplification → loudspeakers', 'Between the power amplifier and the speakers'], correct: 'At the start: playback → conversion → monitor control → amplification → loudspeakers', explain: 'The file is read in software first; it is converted, level-controlled, amplified and finally turned into air. Real systems vary in the middle.' },
  { id: 'm5', moduleId: 'room', prompt: 'Low-frequency problems in a listening room most often come from…', options: ['The converter', 'Room modes and boundary reflections', 'The DAW\'s sample rate'], correct: 'Room modes and boundary reflections', explain: 'Bass behaviour is set by the room dimensions and the listening position. Treatment and placement address it; no plugin does.' },
];

/** Module 4 — "Choose a tool for the job" */
export const TOOL_OPTIONS = ['Broad EQ (shelf or tilt)', 'Narrow corrective EQ', 'Gentle compression', 'Peak limiter', 'Stereo width / M-S tool', 'Level trim + loudness meter', 'Phase correlation / mono check', 'Listen on another system first'] as const;

export const TOOL_SCENARIOS: readonly Scenario[] = [
  { id: 'k1', moduleId: 'tools', prompt: 'Goal: the whole song reads slightly warm and dull against the reference.', options: TOOL_OPTIONS, correct: 'Broad EQ (shelf or tilt)', explain: 'A programme-wide tonal lean calls for a broad move — then listen again at matched level before deciding it helped.' },
  { id: 'k2', moduleId: 'tools', prompt: 'Goal: track 4 is 2.5 dB quieter than its neighbours and otherwise fine.', options: TOOL_OPTIONS, correct: 'Level trim + loudness meter', explain: 'Consistency between tracks is a level decision, verified with a loudness meter, not a compressor.' },
  { id: 'k3', moduleId: 'tools', prompt: 'Goal: one unexpected peak in the bridge is 2 dB above every other peak in the song.', options: TOOL_OPTIONS, correct: 'Peak limiter', explain: 'A single stray peak is what a limiter is for — a dB or two of control on the one event, not density on the whole song.' },
  { id: 'k4', moduleId: 'tools', prompt: 'Goal: a resonant ring at one frequency, every time the toms play.', options: TOOL_OPTIONS, correct: 'Narrow corrective EQ', explain: 'A narrow problem gets a narrow tool — and a question back to the mixer, since the tom channel is the real place to fix it.' },
  { id: 'k5', moduleId: 'tools', prompt: 'Goal: the mix feels wide and exciting in the room; the client\'s video will play on phones.', options: TOOL_OPTIONS, correct: 'Phase correlation / mono check', explain: 'Before widening anything, check what the mono fold does to it. A wide mix that collapses on a phone speaker has a problem the room hid.' },
  { id: 'k6', moduleId: 'tools', prompt: 'Goal: the chorus feels like it never quite lifts; dynamics are a little loose.', options: TOOL_OPTIONS, correct: 'Gentle compression', explain: 'Gentle programme compression can add cohesion and shape — compared at matched level so the extra density is a decision, not a louder illusion.' },
  { id: 'k7', moduleId: 'tools', prompt: 'Goal: you are not sure whether the low end is really heavy or the room is flattering it.', options: TOOL_OPTIONS, correct: 'Listen on another system first', explain: 'When the doubt is about the ROOM, the next step is a check, not a tool. Verification before processing.' },
];

export const TOOL_GROUPS: readonly { id: string; title: string; decision: string; items: readonly string[] }[] = [
  { id: 'playback', title: 'Playback and editing', decision: 'Hear it, cut it, export it', items: ['DAW or mastering editor', 'Session management and versioning', 'Playback, editing, fades', 'Export and render'] },
  { id: 'monitor', title: 'Monitoring chain', decision: 'Trust what you hear', items: ['Converters', 'Monitor controller', 'Loudspeakers in a treated room', 'Headphones (supplementary)'] },
  { id: 'eq', title: 'EQ', decision: 'Tonal balance and correction', items: ['Broad shelves and tilt', 'Narrow correction', 'Dynamic / linear-phase variants'] },
  { id: 'dyn', title: 'Dynamics', decision: 'Density, control, peaks', items: ['Compression (gentle, programme)', 'Limiting (peak / true-peak ceiling)', 'Multiband and other dynamics tools'] },
  { id: 'stereo', title: 'Stereo / spatial', decision: 'Width and balance, checked in mono', items: ['Mid/side width', 'Channel balance', 'Mono-compatibility check'] },
  { id: 'meters', title: 'Meters and analysis', decision: 'Verify, never guess', items: ['Sample-peak and true-peak meters', 'Loudness meter (BS.1770 family)', 'Phase correlation', 'Spectrum analyser'] },
  { id: 'analog', title: 'Analog equipment (optional)', decision: 'Colour and a different hand on the same decisions', items: ['Analog EQ and compressors', 'Converters and routing', 'Neither analog nor digital is "better" — they are different'] },
];

/** Module 5 — "Ready, or revision?" the delivered-mix inspection */
export type MixInspection = { field: string; value: string; flag?: string };

export const INSPECTION_SHEET: readonly MixInspection[] = [
  { field: 'File', value: 'NightSignal_Mix_v7_FINAL.wav' },
  { field: 'Approved version (email)', value: 'v8', flag: 'Version mismatch — confirm before listening critically.' },
  { field: 'Format', value: 'WAV, 24-bit, 48 kHz, stereo' },
  { field: 'Sample peak', value: '−0.1 dBFS', flag: 'Almost no headroom — ask whether a bus limiter is on the mix.' },
  { field: 'Notes from the mixer', value: '"Limiter on the 2-bus for the client; can send without."', flag: 'Request the version without the bus limiter.' },
  { field: 'References supplied', value: 'Two commercial tracks + a note on the vibe' },
  { field: 'Delivery requirements', value: '"Streaming and a CD-R for the launch party"', flag: 'Confirm the CURRENT distributor spec and whether a DDP or a disc is wanted.' },
];

export const WORKFLOW_SCENARIOS: readonly Scenario[] = [
  { id: 'w1', moduleId: 'workflow', prompt: 'The delivered mix peaks at −0.1 dBFS and the mixer says a limiter is on the 2-bus. First move?', options: ['Master it as delivered', 'Ask for the mix without the bus limiter', 'Add a second limiter'], correct: 'Ask for the mix without the bus limiter', explain: 'Inspection comes before processing. A limited mix hides the dynamics you are being asked to shape.' },
  { id: 'w2', moduleId: 'workflow', prompt: 'When should the first full listen happen?', options: ['After a starting EQ is in place', 'Before any processing, on the whole mix', 'After loudness is set'], correct: 'Before any processing, on the whole mix', explain: 'Listen first, note strengths and concerns, compare to the goals and references. Processing follows the listening, never the other way round.' },
  { id: 'w3', moduleId: 'workflow', prompt: 'You added a 1 dB high shelf and it sounds better. Before you keep it, you should…', options: ['Bypass it and compare at matched playback level', 'Add 1 dB more', 'Move on — it sounded better'], correct: 'Bypass it and compare at matched playback level', explain: 'A shelf changes level as well as tone; matched-level bypass is the only honest test of the tonal decision.' },
  { id: 'w4', moduleId: 'workflow', prompt: 'The exports are rendered. What is the last step before sending?', options: ['Nothing — the DAW rendered them', 'Reopen and audition every file: starts, ends, fades, channel count, naming, metadata, requested limits', 'Normalize them all to one number'], correct: 'Reopen and audition every file: starts, ends, fades, channel count, naming, metadata, requested limits', explain: 'Quality control is on the files you actually send, not on the session that made them.' },
  { id: 'w5', moduleId: 'workflow', prompt: 'A track in the set is clearly the strongest; the client wants it first. Where is that decided?', options: ['In the mix', 'In sequencing, with the client', 'By the distributor'], correct: 'In sequencing, with the client', explain: 'Order, spacing and fades are shaped at mastering — a decision made with the client, not for them.' },
];

/** Module 6 — loudness, dynamics, translation */
export const LOUDNESS_SCENARIOS: readonly Scenario[] = [
  { id: 'l1', moduleId: 'loudness', prompt: 'A sample-peak meter reads −0.3 dBFS; a true-peak meter reads +0.4 dBTP on the same file. Which is right?', options: ['The sample-peak meter — it reads the actual samples', 'Both — true peak estimates the reconstructed waveform between samples, which can exceed the samples', 'Neither — meters disagree all the time'], correct: 'Both — true peak estimates the reconstructed waveform between samples, which can exceed the samples', explain: 'Inter-sample peaks are real after conversion. That is why a true-peak ceiling exists as a concept.' },
  { id: 'l2', moduleId: 'loudness', prompt: '"Integrated loudness" in LUFS is best described as…', options: ['The loudest moment', 'A gated, frequency-weighted average of the whole programme, per ITU-R BS.1770', 'The RMS of the left channel'], correct: 'A gated, frequency-weighted average of the whole programme, per ITU-R BS.1770', explain: 'K-weighting, 400 ms blocks and gating: one number for how loud the whole piece is, not how loud its peak is.' },
  { id: 'l3', moduleId: 'loudness', prompt: 'A streaming service normalizes playback loudness. Does heavy limiting still change the result?', options: ['No — normalization undoes it', 'Yes — normalization changes the playback gain, but the dynamics and sound of the limited version stay limited', 'Only on CD'], correct: 'Yes — normalization changes the playback gain, but the dynamics and sound of the limited version stay limited', explain: 'Normalization is a volume setting. It cannot restore transients or density decisions; it can even play the heavier master quieter.' },
  { id: 'l4', moduleId: 'loudness', prompt: 'The correct loudness target for a master depends on…', options: ['One universal number everyone uses', 'The content and the destination\'s current requirements', 'The limiter brand'], correct: 'The content and the destination\'s current requirements', explain: 'A solo piano piece, a podcast and a dense rock mix do not share a number. Destinations publish requirements; they change; verify them.' },
  { id: 'l5', moduleId: 'loudness', prompt: 'You compare the master on earbuds and it sounds thin. What does that tell you?', options: ['Add bass to the master', 'Note it as a translation observation and decide in the room — the earbuds are a check, not the reference', 'The master is wrong'], correct: 'Note it as a translation observation and decide in the room — the earbuds are a check, not the reference', explain: 'Headphone, small-speaker and car checks reveal how a master travels. The decision is still made against the accurate room.' },
];

/** Module 7 — delivery contexts and the checklist builder */
export type Destination = { id: string; name: string; brief: string; confirm: readonly string[]; facts: readonly string[]; examples: readonly string[] };

export const DESTINATIONS: readonly Destination[] = [
  {
    id: 'streaming', name: 'Streaming / digital distribution',
    brief: 'Client: "Releasing the EP through a distributor to all the usual services next month."',
    confirm: ['The distributor\'s CURRENT file spec (format, bit depth, sample rate)', 'The services\' current loudness and true-peak guidance — verify today, not from memory', 'Track titles, ISRC codes and artwork from the client', 'Explicit / clean flags and alternate versions requested', 'Whether a high-resolution deliverable is wanted as well'],
    facts: ['Loudness is described in LUFS / LKFS per ITU-R BS.1770 across the industry.', 'Many services normalize playback loudness; the master\'s dynamics are unchanged by that.'],
    examples: ['A distributor may ask for 16-bit or 24-bit WAV at 44.1 kHz — an EXAMPLE; read the current spec sheet.', 'A true-peak ceiling around −1 dBTP is commonly quoted as an EXAMPLE of a safety margin before lossy encoding — confirm the destination\'s own figure.'],
  },
  {
    id: 'cd', name: 'CD preparation',
    brief: 'Client: "500 CDs for the tour merch table."',
    confirm: ['The pressing plant\'s accepted master format (DDP image is common — confirm)', 'Track order, gaps and index points approved by the client', 'CD-Text and ISRC requirements', 'Whether a reference disc is wanted for approval', 'Total programme time against the disc capacity'],
    facts: ['Red Book audio CD is 16-bit, 44.1 kHz, two channels (IEC 60908).', 'Converting from a higher bit depth to 16-bit calls for dither at the final stage.'],
    examples: ['A plant may ask for a DDP 2.0 fileset with a checksum — an EXAMPLE of a common request; confirm with the plant.'],
  },
  {
    id: 'vinyl', name: 'Vinyl preparation',
    brief: 'Client: "A 12-inch, two sides, from the same masters as the CD."',
    confirm: ['Side lengths and running order per side (longer sides cut quieter)', 'The cutting engineer\'s preferences for peak level, low-frequency stereo content and sibilance', 'Whether to supply a separate, less limited vinyl pre-master', 'Lead-in, gaps and side breaks', 'Test pressing approval process'],
    facts: ['A vinyl cut is a physical process with its own limits: side length, groove excursion, high-frequency energy and out-of-phase bass all matter.'],
    examples: ['A cutting engineer may ask for bass centred below a chosen frequency (figures like 100–150 Hz are EXAMPLES) — ask them.'],
  },
  {
    id: 'broadcast', name: 'Broadcast or picture-related delivery',
    brief: 'Client: "The title track goes under a TV spot and into a short film."',
    confirm: ['The broadcaster\'s or post house\'s CURRENT loudness specification and the standard it cites', 'True-peak limit and measurement method they require', 'Channel layout (stereo, 5.1) and sample rate', 'File naming, timecode and slate requirements', 'Whether a dialogue-free or shortened edit is needed'],
    facts: ['Broadcast loudness standards exist and are published: EBU R128 in Europe, ATSC A/85 in the United States, both built on BS.1770.', 'The post house or broadcaster states which applies; the number is read from THEIR current document.'],
    examples: ['A spec may state an integrated loudness and a true-peak maximum — an EXAMPLE of the two numbers to look for in the document you are sent.'],
  },
  {
    id: 'alternates', name: 'Alternate versions',
    brief: 'Client: "Instrumental and clean versions for sync and radio."',
    confirm: ['Which versions are requested (instrumental, clean, TV mix, performance, radio edit)', 'That each alternate comes from the SAME approved mix session so levels and tone match', 'Naming convention that keeps versions unmistakable', 'Whether the alternates must match the main master\'s loudness', 'Metadata differences (titles, version tags)'],
    facts: ['Alternates are mastered with the same chain and settings so they sit identically to the main version.'],
    examples: ['A naming example: Artist_Title_Instrumental_24-48.wav — an EXAMPLE; use the client\'s or label\'s convention.'],
  },
];

export const RELEASE_SCENARIOS: readonly Scenario[] = [
  { id: 'd1', moduleId: 'release', prompt: 'The client wants CDs. The audio CD standard is…', options: ['24-bit, 48 kHz', '16-bit, 44.1 kHz, stereo (Red Book)', 'Whatever the DAW exports'], correct: '16-bit, 44.1 kHz, stereo (Red Book)', explain: 'Red Book is a fixed fact. Everything above it is reduced with dither at the final conversion.' },
  { id: 'd2', moduleId: 'release', prompt: 'How should a mastering engineer know a streaming service\'s loudness guidance?', options: ['From a number remembered from last year', 'By checking the destination\'s current published specification for this delivery', 'From the limiter preset'], correct: 'By checking the destination\'s current published specification for this delivery', explain: 'Requirements change and differ by service and by client. Verify the current spec rather than assume one universal setting.' },
  { id: 'd3', moduleId: 'release', prompt: 'A vinyl cut from the same files as the loud digital master is…', options: ['Always fine', 'Worth discussing with the cutting engineer — a less limited pre-master often cuts better', 'Impossible'], correct: 'Worth discussing with the cutting engineer — a less limited pre-master often cuts better', explain: 'Vinyl has physical limits; the cutting engineer\'s requests decide what to supply.' },
  { id: 'd4', moduleId: 'release', prompt: 'EBU R128 and ATSC A/85 are…', options: ['Two limiter brands', 'Published broadcast loudness standards built on ITU-R BS.1770 measurement', 'Streaming services'], correct: 'Published broadcast loudness standards built on ITU-R BS.1770 measurement', explain: 'They exist, they are regional, and the post house tells you which one applies — the numbers come from their document.' },
  { id: 'd5', moduleId: 'release', prompt: 'Metadata (titles, ISRC, version tags) is…', options: ['The distributor\'s problem', 'Part of the delivery — confirmed with the client and documented', 'Optional on a WAV'], correct: 'Part of the delivery — confirmed with the client and documented', explain: 'Documentation and metadata travel with the audio. A delivery without them is incomplete.' },
];

/* ── Module 8 — the fictional EP ─────────────────────────────────────────── */

export const PROJECT_BRIEF = {
  artist: 'Low Orbit (fictional)',
  title: 'Night Signal — EP',
  from: 'Client email (abridged)',
  lines: [
    'Four songs, all mixed by the same engineer in the same room. We want them to feel like one record.',
    'Releasing digitally through our distributor first; CDs for the tour a month later. A vinyl press is "maybe".',
    'We like the drive of the references we sent, but the quiet song ("Tide Table") must stay quiet — it is the heart of the record.',
    'Track 3 ("Static Bloom") has a vocal the singer thinks is buried in the last chorus.',
    'Please also deliver instrumentals of everything for sync.',
  ],
};

export type ProjectTrack = { id: string; title: string; seconds: number; lufsEstimate: number; truePeakDb: number; note: string; issue: Scenario };

/** Mix-file notes with a triage question on each — the Module 8 problem sort. */
export const PROJECT_TRACKS: readonly ProjectTrack[] = [
  {
    id: 'p1', title: 'Night Signal', seconds: 232, lufsEstimate: -12.6, truePeakDb: -0.4, note: 'Dense, bright, confident. Peaks close to full scale.',
    issue: { id: 'e1', moduleId: 'project', prompt: '"Night Signal": peaks at −0.4 dBTP with a limiter on the mixer\'s bus. What do you ask for?', options: TRIAGE_OPTIONS, correct: 'More information from the client', explain: 'Ask the mixer for the bus-limiter-off version and the client for what "drive" means to them. Inspection before processing.' },
  },
  {
    id: 'p2', title: 'Tide Table', seconds: 301, lufsEstimate: -19.8, truePeakDb: -6.1, note: 'Piano and voice, wide dynamics, lots of headroom. The client wants it to stay quiet.',
    issue: { id: 'e2', moduleId: 'project', prompt: '"Tide Table" measures 7 LU quieter than the rest. The client says it must stay quiet. Next step?', options: TRIAGE_OPTIONS, correct: 'Mastering adjustment', explain: 'Deliberate quiet is a sequencing and level decision made at mastering WITH the client — you set the gap on purpose instead of erasing it.' },
  },
  {
    id: 'p3', title: 'Static Bloom', seconds: 214, lufsEstimate: -13.9, truePeakDb: -1.2, note: 'Good tone, good level. The vocal sits low in the final chorus only.',
    issue: { id: 'e3', moduleId: 'project', prompt: '"Static Bloom": the singer wants the last-chorus vocal up. Which path?', options: TRIAGE_OPTIONS, correct: 'Mix revision', explain: 'One element, one section: a stereo master cannot do it. The mixer can, in minutes.' },
  },
  {
    id: 'p4', title: 'Harbour Lights', seconds: 258, lufsEstimate: -15.1, truePeakDb: -2.0, note: 'Slightly dull and narrow next to the other three; otherwise balanced.',
    issue: { id: 'e4', moduleId: 'project', prompt: '"Harbour Lights" reads dull and a little narrow against its neighbours. Which path?', options: TRIAGE_OPTIONS, correct: 'Mastering adjustment', explain: 'Programme-wide tone and width between tracks of a set is what mastering unifies — gently, with a mono check and a matched-level bypass.' },
  },
];

/** Listening checks and tools for the EP — a multi-select with a key. */
export const PROJECT_CHECKS: readonly { id: string; label: string; needed: boolean; why: string }[] = [
  { id: 'c1', label: 'Listen to all four in the delivered order before touching anything', needed: true, why: 'Listening first is the workflow. Notes before processing.' },
  { id: 'c2', label: 'Match playback level before every A/B', needed: true, why: 'Every tonal and dynamic decision is judged at matched level.' },
  { id: 'c3', label: 'Mono fold check on "Harbour Lights" before and after widening', needed: true, why: 'Widening without a mono check is how a phone speaker finds the hole.' },
  { id: 'c4', label: 'Set every track to the same integrated loudness number', needed: false, why: 'The client asked for "Tide Table" to stay quiet. Consistency is a decision, not a number applied blindly.' },
  { id: 'c5', label: 'Headphone and small-speaker translation pass on the sequence', needed: true, why: 'Translation checks after decisions in the room.' },
  { id: 'c6', label: 'Add a limiter to "Tide Table" so it competes', needed: false, why: 'That erases the one thing the client protected.' },
  { id: 'c7', label: 'Request a bus-limiter-off mix of "Night Signal"', needed: true, why: 'You cannot shape dynamics that were already removed.' },
  { id: 'c8', label: 'Confirm the distributor\'s and plant\'s current specs before exporting', needed: true, why: 'Requirements are read from the current document, never assumed.' },
];

export const PROJECT_SEQUENCES: readonly { id: string; label: string; order: readonly string[]; why: string }[] = [
  { id: 's1', label: 'Opener first, quiet song last', order: ['p1', 'p4', 'p3', 'p2'], why: 'Starts with the statement, closes on the heart. The loudness step down into "Tide Table" is deliberate and final.' },
  { id: 's2', label: 'Quiet song in the middle', order: ['p1', 'p2', 'p3', 'p4'], why: 'A breath in the centre, then back up. The step DOWN and the step UP both need gaps that feel intended.' },
  { id: 's3', label: 'Build to the opener', order: ['p4', 'p3', 'p2', 'p1'], why: 'Ends on the loudest track — strong finish, but the first song is the one listeners hear most. Discuss with the client.' },
];

export const PROJECT_QC: readonly { id: string; label: string }[] = [
  { id: 'q1', label: 'Reopened every exported file and listened to the top and the tail' },
  { id: 'q2', label: 'Fades and gaps match the approved sequence' },
  { id: 'q3', label: 'Channel count and sample rate match each destination\'s current spec' },
  { id: 'q4', label: 'File names follow the agreed convention; versions are unmistakable' },
  { id: 'q5', label: 'Metadata / ISRC / CD-Text entered where required' },
  { id: 'q6', label: 'Measured peak / true-peak / loudness against the requested limits and recorded them' },
  { id: 'q7', label: 'Instrumentals checked against their vocal versions (same length, same level)' },
  { id: 'q8', label: 'Delivery note written: what was sent, where, and the measured numbers' },
];

/* ── key terms (Review steps) ────────────────────────────────────────────── */

export const KEY_TERMS: Record<MasteringModuleId, readonly { term: string; def: string }[]> = {
  what: [
    { term: 'Mastering', def: 'The final listening, decision-making and delivery stage before distribution.' },
    { term: 'Stereo master', def: 'The two-channel programme mastering works on — no independent control of the elements inside it.' },
    { term: 'Mix revision', def: 'A change made back in the mix session because mastering cannot make it honestly.' },
  ],
  roles: [
    { term: 'Translation', def: 'How a master holds up across playback systems and rooms.' },
    { term: 'Stems', def: 'Sub-mixes (drums, vocals…) that give mastering some separate control — by agreement, not by default.' },
  ],
  room: [
    { term: 'Room modes', def: 'Resonances set by room dimensions; they colour the bass at the listening position.' },
    { term: 'Monitor controller', def: 'The level and source switch between converter and amplifiers.' },
    { term: 'Listening fatigue', def: 'Judgement drifting with time and level — managed by moderate, consistent monitoring and breaks.' },
  ],
  tools: [
    { term: 'Tilt EQ', def: 'One control that leans the whole spectrum brighter or warmer.' },
    { term: 'Limiter', def: 'A dynamics tool that holds peaks under a ceiling.' },
    { term: 'Mono compatibility', def: 'What the mix becomes when left and right are summed — checked whenever width is touched.' },
  ],
  workflow: [
    { term: 'Matched-level comparison', def: 'A/B at equal loudness so "louder" is never mistaken for "better".' },
    { term: 'Sequencing', def: 'Order, gaps, crossfades and fades of a release.' },
    { term: 'QC', def: 'Reopening and auditioning the exported files themselves.' },
  ],
  loudness: [
    { term: 'Sample peak (dBFS)', def: 'The highest sample value.' },
    { term: 'True peak (dBTP)', def: 'The estimated peak of the reconstructed waveform between samples.' },
    { term: 'Integrated loudness (LUFS)', def: 'Gated, K-weighted average loudness of the whole programme (ITU-R BS.1770).' },
    { term: 'PLR', def: 'Peak-to-loudness ratio — one plain measure of how much headroom sits above the average.' },
  ],
  release: [
    { term: 'Red Book', def: 'The audio CD standard: 16-bit, 44.1 kHz, stereo.' },
    { term: 'DDP', def: 'A common fileset format pressing plants accept for CD masters — confirm with the plant.' },
    { term: 'Dither', def: 'Low-level noise added when reducing bit depth so the truncation does not distort.' },
  ],
  project: [
    { term: 'Delivery note', def: 'The written record of what was delivered, where, and the measured numbers.' },
    { term: 'Alternate version', def: 'Instrumental, clean, performance or edit — from the same session, mastered identically.' },
  ],
};

/** Every scenario in the lab, for the answer-key test and the module tally. */
export const ALL_SCENARIOS: readonly Scenario[] = [
  ...TRIAGE_SCENARIOS, ...ROLE_SCENARIOS, ...ROOM_SCENARIOS, ...TOOL_SCENARIOS, ...WORKFLOW_SCENARIOS, ...LOUDNESS_SCENARIOS, ...RELEASE_SCENARIOS,
  ...PROJECT_TRACKS.map((t) => t.issue),
];

export const scenariosForModule = (id: MasteringModuleId): readonly Scenario[] => ALL_SCENARIOS.filter((s) => s.moduleId === id);

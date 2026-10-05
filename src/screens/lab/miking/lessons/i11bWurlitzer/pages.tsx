/**
 * I11b WURLITZER (REED PIANO) — its pages: the electric pianos' journey
 * (shared/keys/keysPages.tsx) with this lesson's words and choices. The
 * miked sources are the instrument's own two oval speakers, facing the
 * player; the auxiliary output is drawn and compared as its own electrical
 * path. Pages 4–7 are the amplified chain's, with this instrument's
 * placement art, dock words and starting pose.
 */
import { makeKeysPages, type KeysPagesSpec } from '../shared/keys/keysPages';
import type { AmpPagesSpec } from '../shared/electric/ampPages';
import type { AxisWords } from '../shared/journeyPages';
import { GUITAR } from '../shared/electric/electricSpec.ts';
import { wurliLessonArt } from '../shared/keys/KeysArt';
import { C_BASS } from '../shared/keys/wurliModel.ts';
import { fmtLen } from '../../engine/model/units.ts';
import { I11B_ZONES } from './geometry.ts';
import { I11B_PLACE_START, I11B_WORKED } from './model.ts';

const CHAIN = { pedals: null, rig: 'combo', diBox: false, ampDirect: true, icons: { player: 'keys', amp: 'keysAmp', cab: 'lidSpeakers' } } as const;

const AXES: AxisWords = {
  x: { label: 'TOWARD THE PLAYER', short: 'TOWARD', blurb: 'Toward the player, or back toward the lid (x). Distances are read from the grille.', fmt: (v) => `${fmtLen(Math.abs(v - C_BASS.x))} ${v >= C_BASS.x ? 'toward the player from' : 'behind'} the grille’s centre` },
  y: { label: 'UP–DOWN', short: 'HEIGHT', blurb: 'Up or down (y). Height above the floor is not shown.', fmt: (v) => `${fmtLen(Math.abs(v - C_BASS.y))} ${v <= C_BASS.y ? 'above' : 'below'} the speaker’s centre` },
  z: { label: 'ALONG THE KEYS', short: 'ALONG', blurb: 'Toward the bass end or the treble end (z).', fmt: (v) => `${fmtLen(Math.abs(v - C_BASS.z))} toward the ${v >= C_BASS.z ? 'treble' : 'bass'} end from the speaker’s centre` },
};

const close = I11B_ZONES.find((z) => z.id === I11B_WORKED)!;

const AMP: AmpPagesSpec = {
  rig: 'combo',
  who: 'guitar',
  intro: '',
  shows: [{ id: 'guitar', label: '', blurb: '' }],
  instParts: [],
  figure: { show: 'guitar', title: '', badge: '', label: '' },
  ampParts: [],
  ampNoun: 'the reed piano',
  string: { spec: GUITAR, idx: 0, name: '' },
  chain: { ...CHAIN, icons: { ...CHAIN.icons } },
  workedZone: I11B_WORKED,
  placeZone: I11B_PLACE_START,
  micDefault: 'instDynCard',
  pairs: ['di'],
  art: wurliLessonArt(),
  axes: AXES,
  contextPose: close.start,
  worked: {
    speaker: 'In front of one of the two grilles in the lid’s front slope — they face the PLAYER, not the room. Find the one that sounds best from outside, without lifting the lid.',
    across: 'Off the speaker’s centre along its long side, by about a quarter of its length, and turned a little toward the centre — a slight angle. The bezel reads how far off the axis the mic sits.',
    clearance: 'Off the grille and the lid — never touching or clamped to them — on a stable stand of its own, clear of the keys’ travel, the player’s hands and forearms, the knees and the pedal foot, the cable routed away.',
  },
  mic: {
    intro: 'No brand and no “electric-piano mic” is required. Choose by what the job needs: the pattern, the power it needs, its size and how it mounts. A compact directional dynamic is a practical first choice close to the grille; a condenser — or a ribbon, where its maker allows — can suit a studio when its level, power and handling limits are respected. Compare by ear at matched level.',
    mountLine: (m) => (m.address === 'side' ? 'Mount: a low-profile stand of its own, its marked front side facing the grille' : 'Mount: a low-profile stand of its own, independent of the instrument — never clamped to the lid'),
  },
  practice: {
    orderNote: 'A one-mic setup on the reed piano’s speaker, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'wu.prac.gain',
    secondId: 'wu.prac.3',
    mixIds: ['wu.mix.1', 'wu.mix.2', 'wu.mix.3'],
    mixIntro: 'Three cards from earlier pages, mixed: two grilles, a rattle, and the auxiliary output.',
    sheetNote: 'For a real instrument, with the player’s agreement and the case closed. Write tendencies in words — what you heard, not a promised result.',
  },
  notes: {
    beam: '',
    spots: '',
    place: 'The two grilles face the player: a close mic lives in the narrow gap between the lid, the hands over the keys and the player’s forearms — the hatched shapes. Every position here is drawn at typical proportions; measure the real instrument.',
    context: 'On stage the speakers face the player, so a close mic also hears what is near the player — their wedge above all. One close mic on the best-sounding grille is a sensible first choice; the auxiliary output can help when the stage is very loud.',
  },
  liveCards: [
    { title: 'ROUNDED AND INTIMATE', text: 'Compare the off-centre close mic with a slightly greater distance: listen for the reeds’ pitch and body, the speaker’s character, key noise and the room.' },
    { title: 'MORE BITE OR BARK', text: 'Try another spot on the grille, or the other grille, before reaching for EQ. Listen for attack that serves the mix, not brittle upper mids or the amplifier straining.' },
    { title: 'KEEPING THE VIBRATO', text: 'Play a held chord with the effect off, then on at the depth the player uses: the level pulse should come through intact, with a steady noise floor. A gate or a compressor can make it pump.' },
    { title: 'LOUD STAGE', text: 'One directional close mic; move the keyboard and the wedges where you can. Listen for useful gain before feedback — and keep the player’s hands, knees and pedal foot clear.' },
  ],
};

export const I11B_SPEC: KeysPagesSpec = {
  rig: 'wurli',
  amp: AMP,
  intro: 'This lesson is about putting a microphone on a reed piano’s own speakers — two small ovals in its lid that face the player. First the instrument itself: how a struck steel reed becomes a signal and the signal becomes moving air, how the speakers are fixed, and where it sits. Then the microphones, a worked example and your own placements in the narrow gap the player leaves, with the auxiliary output compared alongside. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  figure: { show: 'wurliFront', title: 'REED PIANO', badge: 'A portable reed piano on its legs, from the player’s side · a simplified drawing at typical proportions', label: 'A portable reed piano on chrome legs, seen from the player’s side: the lid’s front slope with two oval speaker grilles facing the player, the keys, two controls at the left end, and the sustain pedal on the floor.' },
  views: [
    { id: 'front', label: 'FROM THE PLAYER’S SIDE', blurb: 'The instrument on its legs, as the player sees it: the two grilles face them.' },
    { id: 'side', label: 'CUT, FROM THE SIDE', blurb: 'Cut through one speaker: the lid, the speaker behind the grille, the action under the lid, the keys. Switch between the later model (speaker on the lid) and the earlier one (on the amp rail).' },
    { id: 'inside', label: 'INSIDE VIEW · ONE NOTE', blurb: 'One note cut open, for understanding only: the key, the hammer, the steel reed and the pickup plate.' },
  ],
  parts: [
    { id: 'wur.keys', title: 'KEYS', text: 'The player’s hands work right here, just below the grilles. Every mic and stand stays clear of the keys’ travel and the hands.', views: ['front', 'side'] },
    { id: 'wur.lid', title: 'LID', text: 'A moulded lid over the action. On the later model the speakers are screwed to it, so the lid becomes their baffle — part of the sound, and a possible rattle. It stays closed, and nothing is clamped to it.', views: ['front', 'side'] },
    { id: 'wur.grille', title: 'SPEAKER GRILLES', text: 'Two grilles in the lid’s front slope, one oval speaker behind each, facing the player. Two grilles do not mean stereo: check what feeds each before panning anything.', views: ['front', 'side'] },
    { id: 'wur.cone', title: 'OVAL SPEAKER', text: 'A small 4 × 8 in oval speaker: the source you mic. On the earlier model it sits on the amplifier’s rail behind the grille; on the later one, on the lid itself.', views: ['side'] },
    { id: 'wur.controls', title: 'VOLUME AND VIBRATO', text: 'The player’s level and the “vibrato” — really a tremolo, a pulse in level. Part of their sound: ask, and leave them as set. An auxiliary output sits nearby; on the later model a small trim sets its level.', views: ['front'] },
    { id: 'wur.case', title: 'CASE', text: 'The reeds, the pickup and the amplifier live inside, with mains power and a high-voltage pickup. It stays closed during miking.', views: ['front', 'side'] },
    { id: 'wur.legs', title: 'LEGS', text: 'The instrument stands on its own legs. Mic stands stay independent of it — a stand touching the case can rattle it, or bridge metal to a fault.', views: ['front'] },
    { id: 'wur.pedal', title: 'SUSTAIN PEDAL', text: 'Under the player’s foot. Keep stands and cables out of the foot’s way.', views: ['front'] },
    { id: 'k.key', title: 'KEY', text: 'A lever on a balance point: pressing the front lifts the back, which throws the hammer.', views: ['inside'] },
    { id: 'k.hammer', title: 'HAMMER', text: 'Struck up into the reed from below, then dropping back so the note can ring.', views: ['inside'] },
    { id: 'k.bar', title: 'STEEL REED', text: 'A flat steel tongue clamped at one end, with a little solder at its tip for tuning: the struck, vibrating part. Each note’s reed is a different size.', views: ['inside'] },
    { id: 'k.block', title: 'REED BAR', text: 'Where each reed is clamped by a screw, on the instrument’s rail.', views: ['inside'] },
    { id: 'k.pickup', title: 'PICKUP PLATE', text: 'A charged metal plate with slots: each reed’s tip moves past it, and the changing charge between them makes a small signal — much like a condenser microphone. High voltage: a technician’s area only.', views: ['inside'] },
  ],
  speakerParts: [
    { id: 'wur.grille', title: 'GRILLE', text: 'The slotted front of the lid in front of each speaker. Never press a mic against it, or clamp anything to it.' },
    { id: 'wur.lid', title: 'LID AS BAFFLE', text: 'On the later model the speakers are screwed to the lid, so the lid is their baffle: it shapes the sound, and a loose speaker can rattle. A rattle is for the owner or a technician — never loosen or tighten the old screws yourself.' },
    { id: 'wur.cone', title: 'OVAL CONE', text: 'A 4 × 8 in oval cone. Close in, the spot it faces matters, as on any speaker: the centre tends to be brighter, the outer end rounder.' },
    { id: 'wur.dust', title: 'DUST CAP', text: 'The dome over the voice coil in the middle of the oval.' },
    { id: 'wur.frame', title: 'FRAME', text: 'The metal frame holding the cone, fixed with four screws — to the lid or to the amp rail, depending on the model.' },
  ],
  chain: CHAIN,
  backs: ['closed'],
  notes: {
    mech: 'A simplified picture of one note. Real reeds differ from note to note, and the reed moves far less than drawn. A bad note or hum is the instrument — a technician’s job, never a mic move.',
    mechCheck: 'The reed is a struck, vibrating solid — like the other instruments in this lab — but its useful sound is the amplified one: you mic the speakers, and hear the whole chain of reed, pickup, preamp, amplifier, speaker and lid.',
    spots: 'Close in, the spot on the oval shapes the sound: the centre tends to be brighter and clickier, the outer end rounder. These are general speaker tendencies — a small oval in a lid may behave differently, so test by ear.',
    speaker: 'Two small oval speakers, one behind each grille in the lid’s front slope — and they face the player, not the room. Find them from outside, without lifting the lid. If the player uses an external amp through the auxiliary output, that amp’s speaker becomes the source: mic it as its own speaker.',
    air: 'A mic at a grille hears AIR — the speaker, the lid and the room. The auxiliary output is a separate electrical signal: it carries no speaker, no lid and no room. It is a useful comparison and sometimes a useful blend on a loud stage — but it is not miking. Label each as its own source.',
  },
};

export const I11B_PAGES = makeKeysPages(I11B_SPEC);

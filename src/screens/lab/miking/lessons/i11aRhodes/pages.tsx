/**
 * I11a RHODES (TINE PIANO) — its pages: the electric pianos' journey
 * (shared/keys/keysPages.tsx) with this lesson's words and choices. The
 * miked source is the combo amp; the DI is drawn and compared as its own
 * electrical source. The speaker itself is taught in full in the SPK module;
 * this lesson links to it.
 */
import { makeKeysPages, type KeysPagesSpec } from '../shared/keys/keysPages';
import type { AmpPagesSpec } from '../shared/electric/ampPages';
import { GUITAR } from '../shared/electric/electricSpec.ts';
import { I11A_PLACE_START, I11A_WORKED } from './model.ts';

const CHAIN = { pedals: null, rig: 'combo', diBox: true, ampDirect: false, icons: { player: 'keys' } } as const;

/** Pages 4–7: the amplified chain's (pages 1–3 are the electric pianos' own,
 *  so the fields only those pages read are filled minimally). */
const AMP: AmpPagesSpec = {
  rig: 'combo',
  who: 'guitar',
  intro: '',
  shows: [{ id: 'guitar', label: '', blurb: '' }],
  instParts: [],
  figure: { show: 'guitar', title: '', badge: '', label: '' },
  ampParts: [],
  ampNoun: 'the combo amp',
  string: { spec: GUITAR, idx: 0, name: '' },
  chain: { ...CHAIN, icons: { ...CHAIN.icons } },
  workedZone: I11A_WORKED,
  placeZone: I11A_PLACE_START,
  micDefault: 'instDynCard',
  pairs: ['rear', 'di'],
  mic: {
    intro: 'No brand and no “electric-piano mic” is required. Choose by what the job needs: the pattern, the power it needs, its size and how it mounts, and the level it is rated for. A directional dynamic is a practical first choice close up, especially live; a condenser — or a ribbon, where its maker allows — can suit a controlled studio when its rating, mounting and power suit the amp. Compare by ear at matched level.',
    mountLine: (m) => (m.address === 'side' ? 'Mount: a stand in front of the speaker, its marked front side facing the cone' : 'Mount: a stable stand in front of the speaker, kept off the grille cloth and clear of the player’s pedal'),
  },
  practice: {
    orderNote: 'A one-mic setup on the keyboard’s amp, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'rh.prac.gain',
    secondId: 'rh.prac.3',
    mixIds: ['rh.mix.1', 'rh.mix.2', 'rh.mix.3'],
    mixIntro: 'Three cards from earlier pages, mixed: a reference surface, an instrument fault, and the direct signal.',
    sheetNote: 'For a real instrument and amp, with the player’s agreement and the amp muted while anything moves. Write tendencies in words — what you heard, not a promised result.',
  },
  notes: {
    beam: 'The amp drawn here has a 12 in speaker. Off its axis, the highs fall away first — so a mic aimed across the cone hears a darker balance.',
    spots: 'On the keyboard’s amp, the dust cap’s edge is a dependable first aim. Toward the centre tends to add brightness and the bark of hard notes; toward the edge tends to be warmer — good for comping. Speakers vary: check by ear, on chords and on single notes.',
    place: 'The combo’s speaker sits off-centre, under the controls — the zones sit on the speaker, not on the middle of the grille. The open back’s zone (behind the amp) starts outside the clear air the amp needs behind it.',
    context: 'A close mic on a stable stand gives isolation and a repeatable sound on stage; ask whether the amp is the player’s monitor, the audience’s source, or both.',
  },
  liveCards: [
    { title: 'COMPING UNDER A BAND', text: 'Warm, rounded chords: compare the dust cap’s edge and the outer cone at the same distance, listening for full chords that keep their notes clear in the mix.' },
    { title: 'BRIGHT, BARKING LEAD LINES', text: 'Confirm the player’s touch and the amp’s drive first, then try a little nearer the centre. Listen for an attack that serves the mix without brittle upper mids — or the preamp clipping.' },
    { title: 'STEREO PANNING ON TWO AMPS', text: 'Only if the two amps really carry different signals: one comparable mic on each, at a matched distance. Check the sum in mono — the movement heard at the keyboard may not reach every seat.' },
    { title: 'STUDIO', text: 'A close mic first; a farther mic for the amp and the room when the room helps. Capture whole phrases with the sustain pedal and the strongest accents, and write down the amp, the effects and the mic position.' },
  ],
};

export const I11A_SPEC: KeysPagesSpec = {
  rig: 'rhodes',
  amp: AMP,
  intro: 'This lesson is about putting a microphone on the speaker a tine piano plays through. First the instrument itself — how a struck steel tine becomes a signal and the signal becomes moving air in the amp — and where it sits on a stage. Then the microphones, a worked example and your own placements, with the direct signal compared alongside. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  figure: { show: 'rhodesFront', title: 'TINE PIANO', badge: 'A 61-key tine piano on its legs, from the player’s side · a simplified drawing', label: 'A 61-key tine piano on chrome legs, seen from the player’s side: the harp cover over the action, the name rail with two controls and the output jack at the left, the keys, and the sustain pedal on the floor.' },
  views: [
    { id: 'front', label: 'FROM THE PLAYER’S SIDE', blurb: 'The instrument on its legs, as the player sees it.' },
    { id: 'top', label: 'FROM ABOVE', blurb: 'The harp cover over the action, the name rail with the controls and the jack, the keys.' },
    { id: 'inside', label: 'INSIDE VIEW · ONE NOTE', blurb: 'One note cut open, for understanding only: the key, the hammer, the tine and its tonebar, the pickup.' },
  ],
  parts: [
    { id: 'rh.keys', title: 'KEYS', text: 'Sixty-one keys on this passive model. The player’s touch — soft or hard — changes how hard the hammer strikes, and so the tone: hard notes have more bark.', views: ['front', 'top'] },
    { id: 'rh.harp', title: 'HARP COVER', text: 'The lid over the action: under it, one tine, tonebar and pickup for every note. It stays on — nothing about miking needs it lifted.', views: ['front', 'top'] },
    { id: 'rh.controls', title: 'CONTROLS', text: 'The player’s volume and tone settings — part of their sound. Ask, and leave them as set.', views: ['front', 'top'] },
    { id: 'rh.jack', title: 'OUTPUT JACK', text: 'This passive model has one jack and needs no power: it goes to an amplifier, a DI box or a preamp. Other models add balanced and stereo outputs — check the one in front of you.', views: ['front', 'top'] },
    { id: 'rh.legs', title: 'LEGS', text: 'The instrument is heavy: it stands on its own legs. Mic stands stay independent of it.', views: ['front'] },
    { id: 'rh.pedal', title: 'SUSTAIN PEDAL', text: 'Under the player’s right foot, linked to the dampers. Keep stands and cables out of the foot’s way.', views: ['front'] },
    { id: 'k.key', title: 'KEY', text: 'A lever on a balance point: pressing the front lifts the back, which throws the hammer.', views: ['inside'] },
    { id: 'k.hammer', title: 'HAMMER', text: 'Struck up into the tine from below, then dropping straight back so the note can ring. Its tip is a firm rubber pad.', views: ['inside'] },
    { id: 'k.bar', title: 'TINE', text: 'A thin steel rod, clamped at one end: the struck, visibly vibrating part. Each note’s tine is a different length.', views: ['inside'] },
    { id: 'k.tonebar', title: 'TONEBAR', text: 'A heavier steel bar above the tine, joined to it at the block. It rings at the same pitch — the other prong of a tuning fork — and gives the note its sustain.', views: ['inside'] },
    { id: 'k.block', title: 'TINE BLOCK AND RAIL', text: 'Where the tine and the tonebar are joined and held, on the instrument’s rail.', views: ['inside'] },
    { id: 'k.pickup', title: 'PICKUP', text: 'A magnet wound with fine wire, one per note, facing the tine’s tip. The tine’s motion makes a small signal in it. Its spacing is set by a technician — never moved to change the tone.', views: ['inside'] },
  ],
  speakerParts: [],
  ampParts: ['spk.grille', 'amp.panel', 'spk.cabinet', 'spk.baffle', 'spk.cone', 'spk.dust', 'spk.surround', 'spk.frame', 'spk.magnet', 'amp.chassis', 'spk.openBack'],
  chain: CHAIN,
  backs: ['open', 'closed'],
  notes: {
    mech: 'A simplified picture of one note. Real tines differ in length from note to note, and the tine moves far less than drawn. If one note clanks or sounds wrong, it is the instrument — a technician’s job, never a mic move or a pickup adjustment.',
    mechCheck: 'The tine is a struck, vibrating solid — like the other instruments in this lab — but its useful sound is the amplified one: you mic the speaker, and hear the whole chain of instrument, effects, amp and cabinet.',
    spots: 'Close in, the spot on the cone shapes the sound: the centre tends to sound brighter, the edge warmer. On a tine piano’s amp, compare them at the same distance on chords and on single notes.',
    beam: 'The amp drawn here has a 12 in speaker. Off its axis, the highs fall away first — so a mic aimed across the cone hears a darker balance.',
    speaker: 'The tine piano itself has no speaker here: it plays through the combo amp. Find the speaker behind the grille — off-centre, under the controls on this combo — before any mic. A suitcase model stands on its own amplifier and speakers, with a stereo panning effect: find each speaker, and do not assume how many there are or which way they face.',
    air: 'A mic on the amp hears AIR — the speaker, the box and the room. A DI is a separate electrical signal, taken before the amp: it carries no speaker, no box and no room. It is a useful comparison and sometimes a useful blend — but it is not miking. Label each as its own source.',
  },
};

export const I11A_PAGES = makeKeysPages(I11A_SPEC);

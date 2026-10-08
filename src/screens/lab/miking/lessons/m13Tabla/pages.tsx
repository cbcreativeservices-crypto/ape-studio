/**
 * M13 TABLA — its pages: the shared hand-drum journey (shared/hand/
 * handPages) with the tabla's own words and anchors, and its own HOW IT
 * SOUNDS (the stroke stepped through over the pair; the two heads from above
 * — the patch centred on the dayan, off-centre on the bayan — and the heel of
 * the hand pressing the bayan). No vibration shapes are drawn for the tabla:
 * a loaded head does not follow the plain round head's shapes, and the lab
 * does not pretend it does. FULLY SILENT; nothing loops.
 */
import { useEffect, useState } from 'react';
import type { BezelItem, DockParam } from '../../../rack/rackTypes';
import type { DocumentedZone } from '../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { Body, Card, Landing, Note, Point, PredictCard, ScenarioList } from '../../engine/kit';
import { fmtLen } from '../../engine/model/units.ts';
import type { PageProps } from '../../pages/pageTypes';
import { HandStrike, type StrikeSpec } from '../shared/hand/HandStrike';
import { makeHandPages, useStepper, type HandSpec } from '../shared/hand/handPages';
import { BAYAN, DAYAN, MID, TABLA_ZONES } from './geometry.ts';
import { TablaArt, tablaHitTest, tablaLabels, tablaPose } from './art';
import { figureCovers } from '../shared/players/PlayerFigure';
import { TablaHeads } from './TablaHeads';

// figureAt: the part labels keep off the drawn player (artLabels.ts).
export const TABLA_ART = { Instrument: TablaArt, labels: (v: 'side' | 'top') => tablaLabels(v), hitTest: tablaHitTest, figureAt: (view: 'side' | 'top', _v: string, u: number, v: number, tol: number) => figureCovers(tablaPose(view), u, v, tol) };

/* ═══════════════ 2 · HOW IT SOUNDS ═══════════════ */
const n2 = (x: number, y: number) => {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l] as const;
};
const STRIKE: StrikeSpec = {
  view: 'side',
  box: { u0: -380, u1: 600, v0: -720, v1: 30 },
  heads: [
    { id: 'bayan', c: [BAYAN.H.x, BAYAN.H.y], n: n2(BAYAN.u.x, BAYAN.u.y), r: BAYAN.headR, label: 'BAYAN' },
    { id: 'dayan', c: [DAYAN.H.x, DAYAN.H.y], n: n2(DAYAN.u.x, DAYAN.u.y), r: DAYAN.headR, label: 'DAYAN' },
  ],
  strokes: [{ head: 'dayan', at: 0.55, label: 'A STROKE' }],
  press: { head: 'bayan', at: -0.6, label: 'PRESS · THE PITCH BENDS' },
};

function TablaSound({ lesson, answers, onAnswered, onInteractive, interactiveDone, variant, hidden }: PageProps) {
  const S = lesson.sound;
  const n = S.stages.length;
  const st = useStepper(n, hidden);
  const [predicted, setPredicted] = useState<string | null>(null);
  useEffect(() => {
    if (st.shown >= n && !interactiveDone.has('soundPath')) onInteractive('soundPath');
  }, [st.shown, n, interactiveDone, onInteractive]);
  const stage = S.stages[st.shown - 1];
  const [focus, setFocus] = useState<'dayan' | 'bayan'>('dayan');
  const [press, setPress] = useState(0);
  const [pressed, setPressed] = useState(false);
  const d = focus === 'dayan' ? DAYAN : BAYAN;
  const pred = lesson.predictions.sound;
  const strikeBezel: BezelItem[] = [
    { k: 'EVENT', v: `${st.shown} / ${n}`, flex: 0.8 },
    { k: 'HEADS', v: st.shown >= 2 ? 'MOVING' : 'AT REST', flex: 1.1 },
    { k: 'BAYAN', v: st.shown >= 3 ? 'PRESSED' : '—', flex: 1.1 },
    { k: 'SOUND OUT', v: st.shown >= 4 ? 'BOTH HEADS' : '—', flex: 1.2 },
  ];
  const headParams: DockParam[] = [
    {
      kind: 'options',
      id: 'drum',
      label: 'DRUM',
      valueLabel: focus === 'dayan' ? 'DAYAN' : 'BAYAN',
      selectedId: focus,
      onSelect: (id) => setFocus(id as 'dayan' | 'bayan'),
      sticky: true,
      options: [
        { id: 'dayan', label: 'DAYAN', blurb: 'The smaller, wooden drum: its black patch in the middle.' },
        { id: 'bayan', label: 'BAYAN', blurb: 'The larger kettle drum: its black patch off-centre (drawn toward the player).' },
      ],
    },
    {
      kind: 'fader',
      id: 'press',
      label: 'PRESS',
      value: press,
      home: 0,
      onChange: (v) => {
        const q = Math.round(v * 20) / 20;
        setPress(q);
        if (q > 0.3) {
          setPressed(true);
          setFocus('bayan');
        }
      },
      format: () => (press < 0.05 ? 'the bayan rings freely' : `the heel of the hand presses the bayan · ${press < 0.5 ? 'a little' : 'harder'}`),
      formatShort: () => `${Math.round(press * 100)} %`,
    },
  ];
  const headBezel: BezelItem[] = [
    { k: 'DRUM', v: focus === 'dayan' ? 'DAYAN' : 'BAYAN', flex: 1 },
    { k: 'PATCH', v: focus === 'dayan' ? 'CENTRED' : 'OFF-CENTRE', flex: 1.2 },
    { k: 'HEAD', v: `≈ ${Math.round((d.headR * 2) / 10)} cm`, sub: 'drawn size', flex: 0.9 },
    { k: 'BAYAN PITCH', v: press < 0.05 ? 'AS TUNED' : 'RISES', tint: press >= 0.05 ? '#ffc64d' : undefined, flex: 1.2 },
  ];
  const steps: MikingStep[] = [
    {
      key: 'strike',
      title: 'Stroke to sound',
      kind: 'LEARN',
      layout: 'rack',
      rack: {
        render: (w, h) => <HandStrike w={w} h={h} art={TABLA_ART} variant={variant} spec={STRIKE} shown={st.shown} accessibilityLabel={`The tabla pair from the player's right: the dayan in front, the bayan behind. Event ${st.shown} of ${n}: ${stage.title}. ${stage.text}`} />,
        badge: 'The order of events, not their speed · head motion drawn much larger than it really is · silent',
        bezel: strikeBezel,
        params: st.params,
        initialParam: 'step',
      },
      well: (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking="From the player’s right · the dayan in front, the bayan behind" prompt="STEP through the stroke, or PLAY ONCE — it stops at the end. Nothing here makes a sound." />
          <Card>
            <Point title={`${st.shown} · ${stage.title.toUpperCase()}`}>{stage.text}</Point>
          </Card>
        </>
      ),
    },
    {
      key: 'heads',
      title: 'Two heads, two patches',
      kind: 'COMPARE',
      layout: 'rack',
      rack: {
        render: (w, h) => (
          <TablaHeads
            w={w}
            h={h}
            focus={focus}
            press={press}
            accessibilityLabel={`The two heads from above, as the player sees them: the bayan on the left with its black patch off-centre toward the player, the dayan on the right with its black patch in the middle.${press >= 0.05 ? ' The heel of the hand presses the bayan near the player: its tension and its pitch rise.' : ''}`}
          />
        ),
        badge: 'From above, as the player sees them · sizes and the patch offset are drawing choices · silent',
        bezel: headBezel,
        params: headParams,
        initialParam: 'drum',
      },
      well: (
        <>
          <Landing looking={`The two heads from above · ${focus === 'dayan' ? 'the dayan' : 'the bayan'} · drawn about ${fmtLen(d.headR * 2)} across`} prompt="Switch DRUM to compare the patches, then slide PRESS: the heel of the hand on the bayan." />
          {focus === 'dayan' ? (
            <Card>
              <Point title="THE DAYAN · PATCH IN THE MIDDLE">The black patch is built up in layers on the head. Its weight makes the head’s vibrations ring nearly in tune with one another — a clear, pitched tone, unlike a plain head. The player tunes it; the engineer never does.</Point>
            </Card>
          ) : (
            <Card>
              <Point title="THE BAYAN · PATCH OFF-CENTRE">The bayan’s patch sits off-centre (drawn here toward the player). The heel of the hand rests on the head beside it; pressing raises the head’s tension and bends the pitch up — the glide is part of the music.</Point>
            </Card>
          )}
          {pressed && predicted != null ? <Note tone="ok">{`You predicted “${predicted}”. It is the bayan: pressing its head while it rings bends the pitch. Its hand moves across the head all the time — leave it room.`}</Note> : null}
          <Note>Do not copy one drum’s layout onto the other: the patch is centred on the dayan and off-centre on the bayan. Name each drum by what it is — some players set the pair the other way round.</Note>
        </>
      ),
    },
    {
      key: 'where',
      title: 'Where it leaves',
      kind: 'CHECK',
      layout: 'read',
      body: (
        <>
          <Card>
            <Point title="ATTACK">{S.attack}</Point>
            <Point title="BODY">{S.body}</Point>
          </Card>
          <Note>This lab never plays a sound and draws no frequency curve for the tabla: how a real pair sounds depends on the drums, the heads, the tuning, the player and the room. Listen to several strokes on both drums, never one note.</Note>
          <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'sound')} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

/* ═══════════════ the rest of the journey: the tabla's words ═══════════════ */
const zoneOf = (id: string) => TABLA_ZONES.find((z) => z.id === id)!;
const A0 = zoneOf('ta.A').start;
const zMid = MID.z;

const SPEC: HandSpec = {
  art: TABLA_ART,
  intro: 'This lesson is about putting microphones on a tabla — one instrument made of two drums. First the pair itself: what it is, how it makes its sound, and where it sits with its player. Then the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  partsBox: { top: { u0: -760, u1: 420, v0: -420, v1: 380 }, side: { u0: -700, u1: 520, v0: -860, v1: 40 } },
  figure: { view: 'top', box: { u0: -760, u1: 420, v0: -420, v1: 380 }, title: 'TABLA', badge: 'The pair from above, as it sits in front of the player · a right-handed layout', label: 'The tabla pair from above, in front of a player seated on the floor: the smaller dayan on the player’s right with its black patch in the middle, the larger bayan on the left with its black patch off-centre toward the player, both laced and sitting in cloth rings.' },
  partsBadge: 'A tabla pair · tap a part to name it · the layout is a drawing choice',
  partsLooking: (v) => (v === 'top' ? 'From above · both heads nearly face-on' : 'From the player’s right · the dayan in front, the bayan behind'),
  partsNote: 'Two drums, one instrument: the dayan for ringing and damped strokes, the bayan for the low tones and the pitch glides. Switch the view to see the patches.',
  partsWarn: 'The drums are the player’s: never wet, heat, tape or tune the heads, and never clip anything to the straps.',
  plan: {
    items: [
      { id: 'dayan', box: { u0: -160, u1: 200, v0: 30, v1: 290 }, scene: 'all', label: { u: 330, v: 200, align: 'left' } },
      { id: 'bayan', box: { u0: -160, u1: 200, v0: -320, v1: -30 }, scene: 'all', label: { u: 330, v: -200, align: 'left' } },
      { id: 'player', box: { u0: -760, u1: -200, v0: -480, v1: 480 }, scene: 'all', label: { u: -480, v: -560 } },
      { id: 'wedge', box: { u0: 1150, u1: 1650, v0: -300, v1: 300 }, scene: 'stage', label: { u: 1400, v: 400 } },
      { id: 'band', box: { u0: -560, u1: 1000, v0: -1430, v1: -880 }, scene: 'stage', label: { u: 200, v: -790 } },
      { id: 'audience', box: { u0: 2000, u1: 2700, v0: -1520, v1: 1700 }, scene: 'stage', label: { u: 2250, v: -1000 } },
      { id: 'room', box: { u0: -1300, u1: 1700, v0: -1000, v1: -860 }, scene: 'studio', label: { u: 200, v: -780 } },
    ],
    label: (scene, sel) => (scene === 'stage' ? `A stage from above: the tabla player seated on the floor with the dayan to the right and the bayan to the left; the player's wedge downstage on the audience side, a side fill to the right, louder players upstage, and the audience and PA to the right.${sel ? ` Highlighted: ${sel}.` : ''}` : `A studio room from above: the tabla player seated on the floor, no monitors, the room's walls around.${sel ? ` Highlighted: ${sel}.` : ''}`),
    looking: (scene) => (scene === 'stage' ? 'Plan · a stage from above, the audience at the right' : 'Plan · a studio room from above'),
    first: 'The player sits on the floor with the two drums in front; both hands move over the heads, the left one across the bayan all the time. Everything else fits round that.',
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'How do they sit, and how are the drums set? Ask for a short repeated passage: ringing and damped dayan strokes, open bayan tones and glides, strokes on both, quiet finger work — named in their own terms. What is the tabla’s role, and how prominent should the bayan be?' },
      { title: 'LISTEN WITHOUT A MIC', text: 'Hear the passage unamplified from a comfortable listening position. Note both hands’ full paths, the knees, the supports and the way out.' },
      { title: 'WORK WITH THE DRUMS AS THEY ARE', text: 'Tuning and the heads are the player’s. Do not wet, heat, tape or alter them, and do not impose equal levels or a drum-kit sound. Low stands or booms from the audience side.' },
    ],
  },
  mic: {
    intro: 'No brand is required. Choose by what the job needs: one condenser for a shared picture, one per drum for separate control, dynamics for a loud stage, a coincident pair for stereo. A small diaphragm is not too small for the bayan, and a large one is not required.',
    mountLine: (m) => (m.transducer === 'dynamic' ? 'Mount: a low stand or boom from the audience side — compact on a stage' : 'Mount: a low stand or boom from the audience side, clear of both hands and the knees'),
  },
  axes: {
    x: { label: 'TOWARD THE AUDIENCE', short: 'FRONT', blurb: 'Toward or away from the audience side (x).', fmt: (v) => `${fmtLen(Math.abs(v - MID.x))} ${v >= MID.x ? 'toward the audience from' : 'toward the player from'} the pair’s middle` },
    y: { label: 'UP–DOWN', short: 'HEIGHT', blurb: 'Up or down (y).', fmt: (v) => `${fmtLen(Math.abs(v - MID.y))} ${v <= MID.y ? 'above' : 'below'} the heads` },
    z: { label: 'ACROSS', short: 'ACROSS', blurb: 'Toward the dayan (the player’s right here) or the bayan (z).', fmt: (v) => `${fmtLen(Math.abs(v - zMid))} toward the ${v >= zMid ? 'dayan' : 'bayan'} from the pair’s middle` },
  },
  aimWords: { az: 'Swing the front toward the dayan or the bayan (seen from above).', el: 'Tilt the front up or down (seen from the side).' },
  outside: 'outside the drums',
  worked: {
    zone: 'ta.A',
    mic: 'sdcCard',
    looking: 'Worked example · one small condenser · the pair from above',
    label: 'The tabla pair with one small condenser placed for you',
    done: 'That is the whole reading: where to begin, what it is measured from, the distance, the viewpoint, the aim, clearance. Next you place the mic yourself — then try one per drum.',
    pieces: (z: DocumentedZone) => [
      { title: 'WHERE TO BEGIN', text: `${z.label}. After our research, this is a simple place we suggest you begin with a tabla — one mic for the pair, a starting point, not a rule.`, cell: 3 },
      { title: 'MEASURED FROM', text: 'From the area between the two heads: the readout measures from there to the mic’s FRONT, rounded to ≈ 5 mm.', cell: 0 },
      { title: 'THE DISTANCE', text: z.band, cell: 0 },
      { title: 'THE VIEWPOINT', text: 'Above and in front, from the audience side — never in either hand’s path, never over the player.', cell: 1 },
      { title: 'THE AIM', text: `Toward the pair — the lab counts anything within ±${z.aim?.maxOffAxis ?? 25}°. If one drum dominates, MOVE the mic toward the weaker one; turning it alone can put the other drum further off-axis.`, cell: 2 },
      { title: 'CLEARANCE', text: 'Outside both hands’ full paths — the bayan glides included — the stand clear of the knees and the supports, the cable away from the way out.', cell: 3 },
    ],
  },
  place: {
    zone: 'ta.A',
    mic: 'sdcCard',
    looking: 'the tabla pair from above',
    prompt: 'Drag the mic (or use POSITION and AIM; drag the amber ring to turn it). Rest it in two different blue zones — try one over a single drum too.',
    label: 'The tabla pair',
    tried: (p) => `You predicted “${p}”. Moving the mic toward the bayan changes the balance most; only turning it can put the dayan further off-axis without bringing the bayan closer.`,
  },
  learnZones: [
    'What you just did, in words. After our research, each blue zone is where we suggest you begin: the shared mic and the farther ones measured from the area between the heads, the close ones from their own head. They are starting points, not rules — every pair, player and room is different.',
    'Change one thing at a time: compare two targets at the same distance, then two distances at the same target. Over a single drum, try a target between the black patch and the outer head, then one the player suggests. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.',
    'One mic per drum: each mic also hears the other drum. Angle them apart for separation, then hear both together — in mono.',
  ],
  ctx: {
    pose: { ...A0, az: A0.az + 20 },
    mic: 'instDynCard',
    plan: { u0: -700, u1: 1850, v0: -800, v1: 800 },
    side: { u0: -700, u1: 1850, v0: -1050, v1: 40 },
    creditWedge: 'wedge',
    looking: 'From above · one mic in front of the pair',
    prompt: 'The wedge stays where the player needs it. Turn the MIC (AIM) or change its PATTERN until the player’s wedge sits in the rejection — and keep the front on the pair.',
    label: 'the tabla with one mic in front of the pair.',
    learn: [
      { title: 'STUDIO', text: 'Compare one shared mic with one per drum before deciding more channels are needed. A coincident pair or a room mic can add space when the room and the music want it. Ask the player about the balance between the drums.' },
      { title: 'LIVE', text: 'The fewest mics that give the balance, close enough for useful pickup, and only the monitor level the player needs. If the stage is too loud for the quiet strokes, talk about the stage balance — more gain is not the answer.' },
      { title: 'WHAT TO SEND', text: 'A room mic is a capture-only channel live, not a PA or monitor feed. Let the system operator route the PA, wedges and recording separately.' },
    ],
  },
  two: {
    A: { zone: 'ta.dayan.close', mic: 'sdcCard' },
    B: { zone: 'ta.bayan.close', mic: 'sdcCard' },
    names: { A: 'DAYAN MIC', B: 'BAYAN MIC' },
    looking: 'Two mics · A over the dayan, B over the bayan',
    prompt: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes — then switch SOURCE to the other drum.',
    label: 'The tabla with a mic over each drum: A over the dayan, B over the bayan',
    warn: 'Each mic hears its own drum AND the other, so this simplified graph shows one drum’s sound reaching both mics — not what the pair will sound like. Each drum gives its own delay. Judge the pair by ear, in mono, with both drums, the glides and the player’s normal movement. Equal distances, 3:1 or lining up waveforms prove nothing here.',
    learn: [
      'A common idea: one mic per drum, close and angled apart, for separate control of each. Two mics are not automatically better — a shared mic can serve the pair well in a quiet room.',
      'Work on each drum’s own pickup first. Then hear both together in mono at the intended balance, with no processing, while the player alternates dayan, bayan and combined strokes, glides and quiet work. Compare polarity settings and small moves; keep what holds up across the whole passage, not what makes one stroke loudest. Panning is a separate decision.',
    ],
  },
  practice: {
    orderNote: 'A tabla setup, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'ta.prac.gain',
    secondId: 'ta.prac.3',
    mixIds: ['ta.mix.1', 'ta.mix.2', 'ta.mix.3'],
    mixIntro: 'Three cards from earlier pages, mixed: what to try before EQ, what a null can promise, and polarity versus delay.',
    sheetNote: 'For a real tabla and player, with their agreement. Write tendencies in words — what you heard, not a promised result.',
  },
};

export const TABLA_PAGES = makeHandPages(SPEC, TablaSound);

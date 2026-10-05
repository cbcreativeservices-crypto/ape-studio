/**
 * Page 2 — HOW IT SOUNDS, for the brass family (LESSON_JOURNEY §6 stage 2,
 * §7 "air columns"). The lesson's own page (LessonArt.pages.sound): the
 * drum page's membranes do not fit a horn. FULLY SILENT (owner ruling).
 *
 *   LIPS TO SOUND (rack)   PREDICT FIRST, then the events on the tube drawn
 *                          unwound, numbered: STEP through them, or PLAY
 *                          ONCE (a staged reveal that stops at the end — not
 *                          a loop, D8). Under reduced motion PLAY advances
 *                          one step, instantly.
 *   VALVES / THE SLIDE (rack)  how the player makes the tube longer: the
 *                          valves' loops, or the slide at a position with
 *                          its seven places drawn as an envelope (DERIVED,
 *                          approximate); the bass trombone's valves too.
 *   FROM THE BELL (rack)   the bell's sound by band — LOW, MIDDLE, HIGH —
 *                          and a mic's place round it (ANGLE): a simplified
 *                          picture of the measured trend, in words, no dB.
 *   A MUTE (rack)          what a mute changes: the source, its direction,
 *                          its reach past the rim, the player's hand.
 *   ATTACK AND BODY (read) in words, then the three checks.
 * Credit: the sequence reached its end ('soundPath') + the three checks.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { cancelAnimation, Easing, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { colors } from '../../../../../../theme/tokens';
import { useAnimationsAllowed } from '../../../../../../features/settings/a11y';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Card, Landing, Note, Point, PredictCard, ScenarioList } from '../../../engine/kit';
import { fmtLen } from '../../../engine/model/units.ts';
import type { PageProps } from '../../../pages/pageTypes';
import { AirColumn, BellRadiation, MuteView, SlideEnvelope, ValveTube, lobe, lobeWords, type Band, type MuteId } from './BrassSoundArt';
import { addedTube, ATTACH, SLIDE_POSITIONS, VALVES } from './brassSpec.ts';
import { slidePose, type HornPose } from './brassPosture.ts';

const STEP_MS = 1300;

function useFocusedSafe(): boolean {
  try {
    return useIsFocused();
  } catch {
    return true; // the web preview harness mounts the page outside a navigator
  }
}

/** What one lesson's sound page needs, per variant (the lesson's two horns). */
export type BrassSoundConfig = {
  poses: Readonly<Record<string, HornPose>>;
  fallback: string;
  /** Per variant: the band words for FROM THE BELL (this horn's measured trend). */
  bands: Readonly<Record<string, Readonly<Record<Band, string>>>>;
  /** Per variant: what the mutes do on this horn (MuteId → words). */
  mutes: Readonly<Record<string, Readonly<Partial<Record<MuteId, string>>>>>;
  /** A line under the tube step, per variant. */
  tubeNote: Readonly<Record<string, string>>;
  silentNote: string;
  /** After the sequence's end, with a prediction made. */
  reveal: string;
};

const BAND_LABEL: Record<Band, string> = { low: 'LOW', mid: 'MIDDLE', high: 'HIGH' };
const BAND_RANGE: Record<Band, string> = { low: 'below about 500 Hz', mid: 'about 500 Hz – 1 kHz', high: '1 kHz and up' };
const MUTE_LABEL: Record<MuteId, string> = { open: 'OPEN BELL', straight: 'STRAIGHT', cup: 'CUP', harmon: 'HARMON', plunger: 'PLUNGER' };

export function makeBrassSoundPage(cfg: BrassSoundConfig): (p: PageProps) => ReactNode {
  return function BrassSound({ lesson, answers, onAnswered, onInteractive, interactiveDone, hidden, variant }: PageProps) {
    const S = lesson.sound;
    const n = S.stages.length;
    const P = cfg.poses[variant] ?? cfg.poses[cfg.fallback];
    const spec = P.spec;
    const slide = spec.kind === 'slide';
    const motion = useAnimationsAllowed();
    const focused = useFocusedSafe();
    const reveal = useSharedValue(1);
    const [shown, setShown] = useState(1);
    const [playing, setPlaying] = useState(false);
    const [predicted, setPredicted] = useState<string | null>(null);
    useAnimatedReaction(
      () => Math.max(1, Math.min(n, Math.floor(reveal.value + 0.001))),
      (cur, prev) => {
        if (cur !== prev) scheduleOnRN(setShown, cur);
      },
    );
    const stop = () => {
      cancelAnimation(reveal);
      setPlaying(false);
    };
    const goTo = (k: number) => {
      cancelAnimation(reveal);
      setPlaying(false);
      reveal.value = k;
      setShown(k);
    };
    const play = () => {
      if (playing) {
        stop();
        return;
      }
      const from = shown >= n ? 1 : Math.floor(reveal.value);
      if (!motion) {
        goTo(Math.min(n, from + (shown >= n ? 0 : 1)));
        return;
      }
      reveal.value = from;
      setPlaying(true);
      reveal.value = withTiming(n, { duration: (n - from) * STEP_MS, easing: Easing.linear }, (done) => {
        if (done) scheduleOnRN(setPlaying, false);
      });
    };
    useEffect(() => {
      if ((hidden || !focused) && playing) stop();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hidden, focused]);
    useEffect(() => () => cancelAnimation(reveal), []); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
      if (shown >= n && !interactiveDone.has('soundPath')) onInteractive('soundPath');
    }, [shown, n, interactiveDone, onInteractive]);
    const stage = S.stages[shown - 1];
    const stageText = stage.byVariant?.[variant] ?? stage.text;

    /* the tube's length */
    const [valve, setValve] = useState('open');
    const [pos, setPos] = useState(1);
    const [attach, setAttach] = useState('open');
    const vRow = VALVES.find((x) => x.id === valve) ?? VALVES[0];
    const aRow = ATTACH.find((x) => x.id === attach) ?? ATTACH[0];
    const pressed = valve === 'open' ? [] : valve === 'v123' ? [1, 2, 3] : valve === 'v12' ? [1, 2] : valve === 'v23' ? [2, 3] : valve === 'v13' ? [1, 3] : valve === 'v1' ? [1] : [2];
    const L = spec.tube?.mm ?? null;
    const slideP = slide ? slidePose(spec, SLIDE_POSITIONS[pos - 1]) : null;

    /* the bell's radiation */
    const [band, setBand] = useState<Band>('high');
    const [deg, setDeg] = useState(45);
    const rel = lobe(band, deg, spec.bell.mm);
    const where = deg <= 15 ? 'ON AXIS' : deg < 75 ? 'OFF TO ONE SIDE' : deg <= 110 ? 'BESIDE THE BELL' : 'BEHIND THE BELL';

    /* the mutes */
    const [mute, setMute] = useState<MuteId>('straight');
    const muteWords = cfg.mutes[variant] ?? cfg.mutes[cfg.fallback];
    const muteIds = (['open', 'straight', 'cup', 'harmon', 'plunger'] as const).filter((m) => m === 'open' || muteWords[m]);

    const strikeParams: DockParam[] = [
      {
        kind: 'fader',
        id: 'step',
        label: 'STEP',
        value: (shown - 1) / Math.max(1, n - 1),
        onChange: (v) => goTo(1 + Math.round(v * (n - 1))),
        format: () => `${shown} of ${n} · ${stage.title.toLowerCase()}`,
        formatShort: () => `${shown} / ${n}`,
      },
      { kind: 'action', id: 'play', label: playing ? 'PAUSE' : shown >= n ? 'REPLAY ONCE' : motion ? 'PLAY ONCE' : 'NEXT STEP', onPress: play, tint: colors.green },
    ];
    const strikeBezel: BezelItem[] = [
      { k: 'EVENT', v: `${shown} / ${n}`, flex: 0.8 },
      { k: 'LIPS', v: shown >= 1 ? 'BUZZING' : 'AT REST', flex: 1 },
      { k: 'IN THE TUBE', v: shown <= 1 ? '—' : shown === 2 ? 'A WAVE RUNS' : 'STANDING WAVE', flex: 1.4 },
      { k: 'AT THE BELL', v: shown >= 4 ? 'LEAVING' : shown >= 3 ? 'REFLECTING' : '—', flex: 1.1 },
    ];
    const tubeParams: DockParam[] = slide
      ? [
          {
            kind: 'fader',
            id: 'pos',
            label: 'POSITION',
            value: (pos - 1) / 6,
            onChange: (v) => setPos(1 + Math.round(v * 6)),
            format: () => `${pos}${pos === 1 ? 'st' : pos === 2 ? 'nd' : pos === 3 ? 'rd' : 'th'} position · ${pos === 1 ? 'closed' : `about ${Math.round(SLIDE_POSITIONS[pos - 1] / 10)} cm out`}`,
            formatShort: () => `${pos}`,
          },
          ...(spec.id === 'bass'
            ? [
                {
                  kind: 'options' as const,
                  id: 'attach',
                  label: 'VALVES',
                  valueLabel: aRow.label,
                  selectedId: attach,
                  onSelect: setAttach,
                  sticky: true,
                  options: ATTACH.map((a) => ({ id: a.id, label: a.label, blurb: a.words })),
                },
              ]
            : []),
        ]
      : [
          {
            kind: 'options',
            id: 'valve',
            label: 'VALVES',
            valueLabel: vRow.label,
            selectedId: valve,
            onSelect: setValve,
            sticky: true,
            options: VALVES.map((x) => ({ id: x.id, label: x.label, blurb: x.semis ? `Lowers the open note ${x.semis} semitone${x.semis > 1 ? 's' : ''}.` : 'No valve: the open tube.' })),
          },
        ];
    const semis = slide ? pos - 1 + aRow.semis : vRow.semis;
    const tubeBezel: BezelItem[] = slide
      ? [
          { k: 'POSITION', v: `${pos}`, flex: 0.8 },
          { k: 'SLIDE OUT', v: pos === 1 ? 'CLOSED' : fmtLen(SLIDE_POSITIONS[pos - 1]).replace('≈ ', '≈'), flex: 1.6 },
          { k: 'LOWER BY', v: semis ? `${semis} SEMITONE${semis > 1 ? 'S' : ''}` : 'OPEN', flex: 1.4 },
          { k: 'TUBE', v: L ? `≈ ${(L * Math.pow(2, semis / 12) / 1000).toFixed(1)} m` : '—', flex: 1 },
        ]
      : [
          { k: 'VALVES', v: pressed.length ? pressed.join('+') : 'NONE', flex: 0.9 },
          { k: 'LOWER BY', v: semis ? `${semis} SEMITONE${semis > 1 ? 'S' : ''}` : 'OPEN', flex: 1.4 },
          { k: 'TUBE ADDED', v: semis ? (L ? `≈ ${Math.round(addedTube(L, semis) / 10)} cm` : `+${Math.round((Math.pow(2, semis / 12) - 1) * 100)} %`) : '—', flex: 1.2 },
        ];
    const radParams: DockParam[] = [
      {
        kind: 'options',
        id: 'band',
        label: 'BAND',
        valueLabel: BAND_LABEL[band],
        selectedId: band,
        onSelect: (id) => setBand(id as Band),
        sticky: true,
        options: (['low', 'mid', 'high'] as const).map((b) => ({ id: b, label: BAND_LABEL[b], blurb: BAND_RANGE[b] })),
      },
      {
        kind: 'fader',
        id: 'angle',
        label: 'MIC ANGLE',
        value: deg / 180,
        onChange: (v) => setDeg(Math.round((v * 180) / 5) * 5),
        format: () => `${deg}° off the bell’s axis · ${where.toLowerCase()}`,
        formatShort: () => `${deg}°`,
      },
    ];
    const radBezel: BezelItem[] = [
      { k: 'BAND', v: BAND_LABEL[band], sub: BAND_RANGE[band], flex: 1.2 },
      { k: 'MIC', v: where, flex: 1.4 },
      { k: 'VS ON AXIS', v: lobeWords(rel), tint: rel < 0.2 ? '#ff6b5e' : undefined, flex: 1.6 },
    ];
    const muteParams: DockParam[] = [
      {
        kind: 'options',
        id: 'mute',
        label: 'MUTE',
        valueLabel: MUTE_LABEL[mute],
        selectedId: mute,
        onSelect: (id) => setMute(id as MuteId),
        sticky: true,
        options: muteIds.map((m) => ({ id: m, label: MUTE_LABEL[m], blurb: m === 'open' ? 'No mute.' : (muteWords[m] ?? '').split('.')[0] + '.' })),
      },
    ];
    const muteBezel: BezelItem[] = [
      { k: 'MUTE', v: MUTE_LABEL[mute], flex: 1.2 },
      { k: 'PAST THE RIM', v: mute === 'open' ? 'NOTHING' : mute === 'plunger' ? 'HAND + CUP' : mute === 'harmon' ? 'BULB + STEM' : mute === 'cup' ? 'CONE + CUP' : 'THE CONE', flex: 1.5 },
      { k: 'CLEARANCE', v: mute === 'open' ? 'AS SET' : 'RE-CHECK', tint: mute === 'open' ? undefined : '#ffc64d', flex: 1.1 },
    ];

    const pred = lesson.predictions.sound;
    const reached = shown >= n;
    const hornWord = spec.name;
    const steps: MikingStep[] = [
      {
        key: 'strike',
        title: 'Lips to sound',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) => <AirColumn w={w} h={h} spec={spec} reveal={reveal} shown={shown} accessibilityLabel={`The ${hornWord}’s tube drawn straight, lips at the left, bell at the right. Event ${shown} of ${n}: ${stage.title}. ${stageText}`} />,
          badge: 'The tube drawn unwound · the order of events, not their speed · waves drawn much larger · silent',
          bezel: strikeBezel,
          params: strikeParams,
          initialParam: 'step',
        },
        well: (
          <>
            {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
            <Landing looking={`The ${hornWord}’s tube, unwound: lips → tube → bell`} prompt="STEP through it, or PLAY ONCE — it stops at the end. Nothing here makes a sound." />
            <Card>
              <Point title={`${shown} · ${stage.title.toUpperCase()}`}>{stageText}</Point>
            </Card>
            {reached && predicted != null ? <Note tone="ok">{`You predicted “${predicted}”. ${cfg.reveal}`}</Note> : null}
            {reached ? <Note>{S.body}</Note> : null}
          </>
        ),
      },
      {
        key: 'tube',
        title: slide ? 'The slide' : 'The valves',
        kind: 'COMPARE',
        layout: 'rack',
        rack: {
          render: (w, h) =>
            slide && slideP ? (
              <SlideEnvelope w={w} h={h} P={slideP} position={pos} accessibilityLabel={`The ${hornWord} from the side, the slide at position ${pos}${pos > 1 ? `, about ${Math.round(SLIDE_POSITIONS[pos - 1] / 10)} centimetres out` : ', closed'}. The crook’s seven places are dashed along the slide’s path.`} />
            ) : (
              <ValveTube w={w} h={h} P={P} semis={semis} pressed={pressed} accessibilityLabel={`The ${hornWord} from the side. ${pressed.length ? `Valves ${pressed.join(' and ')} pressed: their loops join the tube, ${semis} semitones lower.` : 'No valve pressed: the open tube.'} Below, the tube unwound.`} />
            ),
          badge: slide ? 'From the side · the crook’s seven places dashed · approximate positions · silent' : 'From the side · the tube unwound below · ideal lengths · silent',
          bezel: tubeBezel,
          params: tubeParams,
          initialParam: slide ? 'pos' : 'valve',
        },
        well: (
          <>
            <Landing looking={slide ? 'The slide from 1st to 7th position' : 'The valves and the loops they add'} prompt={slide ? 'Move POSITION from 1 to 7 and watch how far the crook travels.' : 'Choose VALVES and watch which loops join the tube.'} />
            <Card>
              <Point title={slide ? `POSITION ${pos}` : vRow.label}>
                {slide
                  ? `A longer tube plays lower. Each position out lowers the note about a semitone; the slide adds tube on both of its legs, so it travels half the tube it adds. ${pos === 1 ? 'At 1st the slide is closed.' : `At ${pos}th it is about ${Math.round(SLIDE_POSITIONS[pos - 1] / 10)} cm out — and the crook, the hand and the arm go with it.`} ${spec.id === 'bass' && attach !== 'open' ? aRow.words : ''}`
                  : `A longer tube plays lower. Each valve sends the air round an extra loop: ${semis ? `here ${semis} semitone${semis > 1 ? 's' : ''} lower, about ${Math.round((Math.pow(2, semis / 12) - 1) * 100)} % more tube.` : 'with none pressed, the air takes the open tube.'} The valves move only the player’s fingers — the horn stays where it is.`}
              </Point>
            </Card>
            <Note>{cfg.tubeNote[variant] ?? cfg.tubeNote[cfg.fallback]}</Note>
          </>
        ),
      },
      {
        key: 'bell',
        title: 'From the bell',
        kind: 'COMPARE',
        layout: 'rack',
        rack: {
          render: (w, h) => <BellRadiation w={w} h={h} P={P} band={band} deg={deg} accessibilityLabel={`The ${hornWord} from above, the bell pointing right. The ${BAND_LABEL[band].toLowerCase()} band’s spread drawn round the bell; a mic ${deg} degrees off the bell’s axis hears it ${lobeWords(rel).toLowerCase()} than on the axis, in this simplified picture.`} />,
          badge: 'From above · a simplified picture of the measured trend · no level scale · silent',
          bezel: radBezel,
          params: radParams,
          initialParam: 'band',
        },
        well: (
          <>
            <Landing looking="The bell from above, and a mic round it" prompt="Choose a BAND, then swing the MIC ANGLE from on axis round to behind the player." />
            <Card>
              <Point title={`${BAND_LABEL[band]} · ${BAND_RANGE[band].toUpperCase()}`}>{(cfg.bands[variant] ?? cfg.bands[cfg.fallback])[band]}</Point>
            </Card>
            <Note>{`So the brightness a mic hears depends on where it sits: on the axis it hears the beam; off to one side, the lows and less of the top — a mellower sound; behind the bell, mostly the lows. The player stands behind the bell, so they hear their ${hornWord} differently from the audience.`}</Note>
          </>
        ),
      },
      {
        key: 'mutes',
        title: 'A mute changes the source',
        kind: 'COMPARE',
        layout: 'rack',
        rack: {
          render: (w, h) => <MuteView w={w} h={h} P={P} mute={mute} accessibilityLabel={`The ${hornWord}’s bell from the side, cut in half${mute === 'open' ? ', open' : `, with a ${MUTE_LABEL[mute].toLowerCase()} ${mute === 'plunger' ? 'held in front of it' : 'mute in it'}`}.`} />,
          badge: 'The bell cut in half · shapes drawn as typical, sizes vary · silent',
          bezel: muteBezel,
          params: muteParams,
          initialParam: 'mute',
        },
        well: (
          <>
            <Landing looking="The bell, and what goes in it" prompt="Step through the MUTE choices. What reaches past the rim — and what moves?" />
            <Card>
              <Point title={MUTE_LABEL[mute]}>{mute === 'open' ? 'The open bell: the sound leaves as the previous step showed.' : muteWords[mute] ?? ''}</Point>
            </Card>
            <Note>A mute is a different source: it changes the tone, the direction and how far the horn reaches. The player puts it in and takes it out; a mic or clip that cleared the open bell can be in the way of a mute or the hand — check every mute the piece uses.</Note>
          </>
        ),
      },
      {
        key: 'body',
        title: 'Attack and body',
        kind: 'CHECK',
        layout: 'read',
        body: (
          <>
            <Card>
              <Point title="ATTACK">{S.attack}</Point>
              <Point title="BODY">{S.body}</Point>
            </Card>
            <Note>{cfg.silentNote}</Note>
            {!reached ? <Note tone="warn">The sequence on step 1 has not reached its end yet — step it through to earn this page’s credit.</Note> : null}
            <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'sound')} answers={answers} onAnswered={onAnswered} />
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  };
}

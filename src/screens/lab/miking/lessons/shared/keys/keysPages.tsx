/**
 * THE ELECTRIC PIANOS — one set of journey pages for Lab 2's I11a Rhodes and
 * I11b Wurlitzer lessons, on the Kick journey (LESSON_JOURNEY.md): meet → how
 * it sounds → where it sits → microphones → placement (worked example first)
 * → advanced → practice. The miked source is the LOUDSPEAKER (the speaker
 * family, reused): the tine piano's combo amp, the reed piano's two oval
 * speakers in its lid. The direct electrical path (a DI, the aux output) is
 * drawn on its own lane and taught as a supporting comparison, never as
 * miking.
 *
 *   1 MEET          start · what it is · the instrument (front, above, the
 *                   inside view) · the speaker (find it before any mic) · a
 *                   link to the speaker module
 *   2 HOW IT SOUNDS key to signal (the mechanism, stepped; swung by hand) ·
 *                   signal to air (the cone, stepped) · how it spreads (the
 *                   12 in speaker) · centre and edge · air, not wire + checks
 *   3 WHERE IT SITS the signal path (air apart from the wires; the one patch
 *                   that is never made) · stage and studio · before any mic
 *   4–7             the amplified chain's pages (shared/electric/ampPages.tsx)
 *                   with this lesson's words and, for the reed piano, its own
 *                   placement art, dock words and starting pose
 *
 * FULLY SILENT; nothing loops (D8): the mechanism and the cone play ONCE, the
 * bar is swung by hand.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StackActions, useIsFocused, useNavigation } from '@react-navigation/native';
import { cancelAnimation, Easing, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { colors, fonts } from '../../../../../../theme/tokens';
import { useAnimationsAllowed } from '../../../../../../features/settings/a11y';
import { ExpandableFigure } from '../../../../kit/ExpandableFigure';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { SourcePageId } from '../../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Body, Card, KeyButton, Landing, Note, Point, PredictCard, ScenarioList } from '../../../engine/kit';
import { lenCell } from '../../../engine/scene/readoutText.ts';
import { fmtDb, fmtHz, fmtLen } from '../../../engine/model/units.ts';
import { MEET_DROP } from '../../../engine/restructure.ts';
import type { PageProps } from '../../../pages/pageTypes';
import { factsStep, startStep } from '../journeyPages';
import { CabExplorer, SPOT_WORDS, type CabExplorerView } from '../speakers/CabExplorer';
import { BeamDisplay, ConeSequence } from '../speakers/SpeakerSound';
import { BEAM_F_MAX, BEAM_F_MIN, farFieldFromMm, halfAngle, kaOf, pistonDb } from '../speakers/pistonBeam.ts';
import { ampExtras } from '../speakers/ampArt';
import { DiPath } from '../speakers/DiPath';
import { patchVerdict, type ChainSpec } from '../speakers/signalChain.ts';
import type { Back } from '../speakers/cabGeometry.ts';
import { makeAmpPages, type AmpPagesSpec } from '../electric/ampPages';
import { KeysExplorer, keysAspect, type KeysShow } from './KeysExplorer';
import { MechanismDisplay, MECH_ASPECT, MECH_STEPS, type MechKind } from './MechanismDisplay';
import { KeysPlan, type KeysRig, type KeysScene } from './KeysPlan';
import { OVAL_SPOTS } from './keysSpec.ts';
import type { OvalSpot, WurliMount } from './KeysArt';

function useFocusedSafe(): boolean {
  try {
    return useIsFocused();
  } catch {
    return true; // the web preview harness mounts the page outside a navigator
  }
}

export type KeysPart = { id: string; title: string; text: string };
export type KeysView = { id: 'front' | 'top' | 'side' | 'inside'; label: string; blurb: string };

export type KeysPagesSpec = {
  rig: KeysRig;
  /** The pages after the foundations (4–7): the amplified chain's. */
  amp: AmpPagesSpec;
  /** Page 1's START paragraph. */
  intro: string;
  figure: { show: KeysShow; title: string; badge: string; label: string };
  /** The instrument's views and parts (outside, and the inside view). */
  views: readonly KeysView[];
  parts: readonly (KeysPart & { views: readonly KeysView['id'][] })[];
  /** The speaker's parts, in the order PART steps through them. */
  speakerParts: readonly KeysPart[];
  /** The tine piano's combo: the amp's parts from the model (frame C). */
  ampParts?: readonly string[];
  chain: ChainSpec;
  /** Words on the sound steps. */
  notes: { mech: string; mechCheck: string; spots: string; beam?: string; speaker: string; air: string };
  /** The front / back of the cone the "signal to air" step offers. */
  backs: readonly Back[];
};

const STEP_MS = 1300;
const SHORT: Record<string, string> = { front: 'FRONT', top: 'ABOVE', side: 'SIDE', inside: 'INSIDE', face: 'FACE', lid: 'LID', cut: 'SIDE', oval: 'FACE' };
const SPOTS_12 = ['centre', 'boundary', 'edge'] as const;
const SPOTS_OVAL: readonly OvalSpot[] = ['centre', 'off', 'out'];
const OVAL_WORDS: Record<OvalSpot, { title: string; text: string; short: string; tends: string; r: number }> = {
  centre: { title: 'THE CENTRE', short: 'CENTRE', tends: 'BRIGHTER', text: 'Over the dust cap in the middle of the oval. Most often the brightest, most direct spot — with the most click.', r: OVAL_SPOTS.centre },
  off: { title: 'OFF-CENTRE', short: 'OFF-CENTRE', tends: 'BETWEEN', text: 'About a quarter of the way along the oval’s long side: a common first spot close in, often at a slight angle.', r: OVAL_SPOTS.off },
  out: { title: 'TOWARD THE OUTER END', short: 'OUTWARD', tends: 'ROUNDER', text: 'Over the outer end of the cone, inside its edge. Most often rounder and warmer than the centre.', r: OVAL_SPOTS.out },
};

/** A short link to the speaker module (where a navigator is mounted). */
export function SpkLink({ text }: { text?: string } = {}) {
  let nav: { dispatch: (a: unknown) => void } | null = null;
  try {
    nav = useNavigation() as unknown as { dispatch: (a: unknown) => void };
  } catch {
    nav = null; // the web preview harness: no navigator
  }
  return (
    <View style={styles.link}>
      <Text style={styles.linkText}>{text ?? 'The loudspeaker itself — cones, cabinets, how a speaker spreads its sound and why the spot on the cone matters — is covered in full in the Amplified speakers & Leslie module.'}</Text>
      {nav ? <KeyButton label="OPEN THE SPEAKER MODULE" onPress={() => nav!.dispatch(StackActions.push('MikingLesson', { id: 'SPK' }))} tint={colors.cyanBright} /> : null}
    </View>
  );
}

export function makeKeysPages(spec: KeysPagesSpec): Partial<Record<SourcePageId, (p: PageProps) => ReactNode>> {
  const ampPages = makeAmpPages(spec.amp);
  const rhodes = spec.rig === 'rhodes';
  const mechKind: MechKind = rhodes ? 'tine' : 'reed';

  /* ═══════════════ 1 · MEET ═══════════════ */
  function KeysInstrument({ lesson, journey }: PageProps) {
    const [view, setView] = useState<KeysView['id']>(spec.views[0].id);
    const [partId, setPartId] = useState<string | null>(null);
    const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
    const [mount, setMount] = useState<WurliMount>('lid');
    const parts = spec.parts.filter((p) => p.views.includes(view));
    const shown = spec.parts.find((p) => p.id === partId);
    const pick = (id: string) => {
      setPartId(id);
      setSeen((s) => (s.has(id) ? s : new Set([...s, id])));
    };
    const pIdx = Math.max(0, parts.findIndex((p) => p.id === partId));
    const vMeta = spec.views.find((v) => v.id === view)!;
    const show: KeysShow | null = view === 'inside' ? null : rhodes ? (view === 'top' ? 'rhodesTop' : 'rhodesFront') : view === 'side' ? 'wurliSide' : 'wurliFront';
    /* the speaker */
    const [sView, setSView] = useState<CabExplorerView | 'lid' | 'oval' | 'cut'>(rhodes ? 'front' : 'lid');
    const [cloth, setCloth] = useState(true);
    const [sPart, setSPart] = useState<string | null>(null);
    const [sSeen, setSSeen] = useState<ReadonlySet<string>>(() => new Set());
    const sParts: { id: string; title: string; text: string }[] = rhodes
      ? (spec.ampParts ?? []).map((id) => lesson.model.parts.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p).map((p) => ({ id: p.id, title: p.label.toUpperCase(), text: p.role }))
      : [...spec.speakerParts];
    const sShown = sParts.find((p) => p.id === sPart);
    const sPick = (id: string) => {
      setSPart(id);
      setSSeen((s) => (s.has(id) ? s : new Set([...s, id])));
    };
    const sIdx = Math.max(0, sParts.findIndex((p) => p.id === sPart));
    const extras = useMemo(() => (rhodes ? ampExtras('combo', sPart) : null), [sPart]);
    const sViews = rhodes
      ? [
          { id: 'front', label: 'FROM THE FRONT', blurb: 'The combo as you meet it, with its grille cloth — switch the cloth off to find the speaker behind it.' },
          { id: 'side', label: 'CUT, FROM THE SIDE', blurb: 'Cut through the speaker’s middle: the cone, the magnet, the box, the open back and the amplifier above.' },
          { id: 'face', label: 'ONE SPEAKER, FACE-ON', blurb: 'The speaker up close: dust cap, cone, surround and frame.' },
        ]
      : [
          { id: 'lid', label: 'THE LID, FROM THE PLAYER', blurb: 'The two grilles in the lid’s front slope, facing the player.' },
          { id: 'cut', label: 'CUT, FROM THE SIDE', blurb: 'Cut through one speaker: where it is fixed — to the lid on the later model, to the amp rail on the earlier one.' },
          { id: 'oval', label: 'ONE SPEAKER, FACE-ON', blurb: 'One 4 × 8 in oval speaker up close: dust cap, cone and frame.' },
        ];
    const sMeta = sViews.find((v) => v.id === sView) ?? sViews[0];
    const steps: MikingStep[] = [
      startStep(lesson, journey, spec.intro),
      factsStep(lesson, <ExpandableFigure aspect={keysAspect(spec.figure.show)} title={spec.figure.title} badge={spec.figure.badge} render={(fw, fh) => <KeysExplorer w={fw} h={fh} show={spec.figure.show} accessibilityLabel={spec.figure.label} />} />),
      {
        key: 'inst',
        title: 'The instrument',
        kind: 'TRY',
        layout: 'rack',
        rack: {
          render: (w, h) =>
            view === 'inside' ? (
              <MechanismDisplay w={w} h={h} kind={mechKind} reveal={null} shown={0} swing={0} highlight={partId} onTapPart={pick} accessibilityLabel={`Inside view, one note cut open: ${rhodes ? 'the key, the hammer, the tine with the tonebar above it, and the pickup facing the tine’s tip' : 'the key, the hammer, the steel reed and the charged pickup plate at its tip'}.${shown ? ` Highlighted: the ${shown.title.toLowerCase()}.` : ''}`} />
            ) : (
              <KeysExplorer w={w} h={h} show={show!} mount={mount} highlight={partId} onTapPart={pick} accessibilityLabel={`${vMeta.label.toLowerCase()}.${shown ? ` Highlighted: the ${shown.title.toLowerCase()}.` : ''}`} />
            ),
          badge: view === 'inside' ? 'INSIDE VIEW — drawn, never opened · one note · tap a part' : 'A simplified drawing with typical proportions · tap a part',
          bezel: [
            { k: 'PART', v: shown ? shown.title.split(' ')[0] : 'TAP ONE', flex: 1.4 },
            { k: 'LOOKED AT', v: `${seen.size} / ${spec.parts.length}` },
            { k: 'VIEW', v: SHORT[view], flex: 1.1 },
          ],
          params: [
            {
              kind: 'fader',
              id: 'part',
              label: 'PART',
              value: parts.length > 1 ? pIdx / (parts.length - 1) : 0,
              onChange: (v) => {
                const p = parts[Math.round(v * (parts.length - 1))];
                if (p) pick(p.id);
              },
              format: () => (shown ? shown.title : `step through the ${parts.length} parts`),
              formatShort: () => (shown ? shown.title.split(' ')[0].slice(0, 9) : 'STEP'),
            },
            { kind: 'options', id: 'view', label: 'VIEW', valueLabel: SHORT[view], selectedId: view, onSelect: (id) => setView(id as KeysView['id']), sticky: true, options: spec.views.map((v) => ({ id: v.id, label: v.label, blurb: v.blurb })) },
            ...(!rhodes && view === 'side' ? [{ kind: 'toggle' as const, id: 'mount', label: mount === 'lid' ? 'ON THE LID' : 'ON THE RAIL', value: mount === 'rail', onToggle: () => setMount((m) => (m === 'lid' ? 'rail' : 'lid')) }] : []),
          ],
          initialParam: 'part',
        },
        well: (
          <>
            <Landing looking={vMeta.label.toLowerCase()} prompt="Tap any part — or step through PART — to see what it is and what it does. There is nothing to answer on this page." />
            {shown ? (
              <Card>
                <Point title={shown.title}>{shown.text}</Point>
              </Card>
            ) : (
              <Note>{vMeta.blurb}</Note>
            )}
            {view === 'inside' ? <Note tone="warn">An inside view for understanding only. Mic work never opens the instrument, lifts its lid or adjusts a pickup — inside there are mains-powered parts{rhodes ? '' : ' and a high-voltage pickup'}.</Note> : null}
          </>
        ),
      },
      {
        key: 'speaker',
        title: 'The speaker',
        kind: 'TRY',
        layout: 'rack',
        rack: {
          render: (w, h) =>
            rhodes ? (
              <CabExplorer w={w} h={h} kind="combo12" back="open" view={sView as CabExplorerView} frontMode={cloth ? 'cloth' : 'baffle'} highlight={sPart} onTapPart={sPick} extras={extras ?? undefined} accessibilityLabel={`The combo amp, ${sMeta.label.toLowerCase()}.${sShown ? ` Highlighted: the ${sShown.title.toLowerCase()}.` : ''} The miked speaker is ringed.`} />
            ) : (
              <KeysExplorer w={w} h={h} show={sView === 'oval' ? 'oval' : sView === 'cut' ? 'wurliSide' : 'wurliLid'} mount={mount} highlight={sPart} onTapPart={sPick} accessibilityLabel={`The reed piano’s speakers, ${sMeta.label.toLowerCase()}.${sShown ? ` Highlighted: the ${sShown.title.toLowerCase()}.` : ''}`} />
            ),
          badge: rhodes ? (sView === 'front' ? (cloth ? 'From the front · the miked speaker ringed · its dust cap marked through the cloth' : 'The grille cloth taken away IN THE DRAWING only — never on a real amp') : 'Cut through the speaker’s middle · tap a part') : sView === 'cut' ? (mount === 'lid' ? 'The later model · the speaker screwed to the lid' : 'The earlier model · the speaker on the amp rail, behind the grille') : 'A simplified drawing · the grille positions are typical, not measured',
          bezel: [
            { k: 'PART', v: sShown ? sShown.title.split(' ')[0] : 'TAP ONE', flex: 1.4 },
            { k: 'LOOKED AT', v: `${sSeen.size} / ${sParts.length}` },
            { k: rhodes ? 'AMP' : 'MOUNT', v: rhodes ? 'COMBO' : mount === 'lid' ? 'LID' : 'RAIL', flex: 1.1 },
          ],
          params: [
            {
              kind: 'fader',
              id: 'part',
              label: 'PART',
              value: sParts.length > 1 ? sIdx / (sParts.length - 1) : 0,
              onChange: (v) => {
                const p = sParts[Math.round(v * (sParts.length - 1))];
                if (p) sPick(p.id);
              },
              format: () => (sShown ? `${sShown.title} · ${sSeen.size} of ${sParts.length} looked at` : `step through the ${sParts.length} parts`),
              formatShort: () => (sShown ? sShown.title.split(' ')[0].slice(0, 9) : 'STEP'),
            },
            { kind: 'options', id: 'view', label: 'VIEW', valueLabel: SHORT[sView], selectedId: sView, onSelect: (id) => setSView(id as typeof sView), sticky: true, options: sViews },
            rhodes ? { kind: 'toggle', id: 'cloth', label: cloth ? 'CLOTH ON' : 'CLOTH OFF', value: !cloth, onToggle: () => setCloth((x) => !x) } : { kind: 'toggle', id: 'mount', label: mount === 'lid' ? 'LATER MODEL' : 'EARLIER MODEL', value: mount === 'rail', onToggle: () => setMount((m) => (m === 'lid' ? 'rail' : 'lid')) },
          ],
          initialParam: 'part',
        },
        well: (
          <>
            <Landing looking={sMeta.label.toLowerCase()} prompt="Tap any part of the speaker — or step through PART. This is the sound source you will mic." />
            {sShown ? (
              <Card>
                <Point title={sShown.title}>{sShown.text}</Point>
              </Card>
            ) : (
              <Note>{spec.notes.speaker}</Note>
            )}
            <SpkLink />
            <Note tone="warn">Never open an amplifier or the instrument, lift a lid or touch speaker wiring to place a mic: inside there are hot parts and dangerous voltages.</Note>
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  }

  /* ═══════════════ 2 · HOW IT SOUNDS ═══════════════ */
  function KeysSound({ lesson, answers, onAnswered, onInteractive, interactiveDone, hidden }: PageProps) {
    const motion = useAnimationsAllowed();
    const focused = useFocusedSafe();
    /* the mechanism: stepped or played once; the bar swung by hand */
    const mReveal = useSharedValue(1);
    const [mShown, setMShown] = useState(1);
    const [mPlaying, setMPlaying] = useState(false);
    const [swing, setSwing] = useState(0);
    const [tremolo, setTremolo] = useState(false);
    const [predicted, setPredicted] = useState<string | null>(null);
    useAnimatedReaction(
      () => Math.max(1, Math.min(MECH_STEPS, Math.floor(mReveal.value + 0.001))),
      (cur, prev) => {
        if (cur !== prev) scheduleOnRN(setMShown, cur);
      },
    );
    const mGo = (k: number) => {
      cancelAnimation(mReveal);
      setMPlaying(false);
      mReveal.value = k;
      setMShown(k);
    };
    const mPlay = () => {
      if (mPlaying) {
        cancelAnimation(mReveal);
        setMPlaying(false);
        return;
      }
      const from = mShown >= MECH_STEPS ? 0 : Math.floor(mReveal.value);
      if (!motion) {
        mGo(Math.min(MECH_STEPS, Math.max(1, from + 1)));
        return;
      }
      mReveal.value = from;
      setMPlaying(true);
      mReveal.value = withTiming(MECH_STEPS, { duration: (MECH_STEPS - from) * STEP_MS, easing: Easing.linear }, (done) => {
        if (done) scheduleOnRN(setMPlaying, false);
      });
    };
    /* the cone */
    const n = lesson.sound.stages.length;
    const reveal = useSharedValue(1);
    const [shown, setShown] = useState(1);
    const [playing, setPlaying] = useState(false);
    const [coneBack, setConeBack] = useState<Back>(spec.backs[0]);
    useAnimatedReaction(
      () => Math.max(1, Math.min(n, Math.floor(reveal.value + 0.001))),
      (cur, prev) => {
        if (cur !== prev) scheduleOnRN(setShown, cur);
      },
    );
    const goTo = (k: number) => {
      cancelAnimation(reveal);
      setPlaying(false);
      reveal.value = k;
      setShown(k);
    };
    const play = () => {
      if (playing) {
        cancelAnimation(reveal);
        setPlaying(false);
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
      if (hidden || !focused) {
        cancelAnimation(reveal);
        cancelAnimation(mReveal);
        setPlaying(false);
        setMPlaying(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hidden, focused]);
    useEffect(
      () => () => {
        cancelAnimation(reveal);
        cancelAnimation(mReveal);
      },
      [], // eslint-disable-line react-hooks/exhaustive-deps
    );
    const stage = lesson.sound.stages[shown - 1];
    const stageText = (i: number) => (coneBack === 'open' && lesson.sound.stages[i].ported ? lesson.sound.stages[i].ported! : lesson.sound.stages[i].text);
    /* the beam (the tine piano's 12 in speaker) */
    const [fNorm, setFNorm] = useState(0.62);
    const fHz = Math.round(BEAM_F_MIN * Math.pow(BEAM_F_MAX / BEAM_F_MIN, fNorm));
    const [micDeg, setMicDeg] = useState(30);
    const ka = kaOf(fHz);
    const atMic = pistonDb(ka, micDeg);
    const half = halfAngle(ka);
    const farFrom = farFieldFromMm(fHz);
    /* the spots */
    const [spot12, setSpot12] = useState<(typeof SPOTS_12)[number]>('boundary');
    const [spotOv, setSpotOv] = useState<OvalSpot>('off');
    // CREDIT: the mechanism reached its end and was swung; the cone reached its end.
    const mechDone = useRef(false);
    const swungFar = useRef(false);
    if (mShown >= MECH_STEPS) mechDone.current = true;
    if (swing >= 0.5) swungFar.current = true;
    const coneDone = useRef(false);
    if (shown >= n) coneDone.current = true;
    // MEET IT leaves the mechanism step out (MEET_DROP) — then it is never asked
    // for: a "still to do" may only name a step the learner can see.
    const mechShown = !MEET_DROP.has('mech');
    const done = (!mechShown || (mechDone.current && swungFar.current)) && coneDone.current;
    useEffect(() => {
      if (done && !interactiveDone.has('soundPath')) onInteractive('soundPath');
    }, [done, interactiveDone, onInteractive]);
    const pred = lesson.predictions.sound;
    const mechTitles = rhodes ? ['The key goes down', 'The hammer strikes the tine', 'The tine and the tonebar ring', 'The pickup senses the tine', 'The signal goes to the amp'] : ['The key goes down', 'The hammer strikes the reed', 'The reed swings', 'The pickup senses the reed', 'The signal goes to the amp'];
    const mechTexts = rhodes
      ? [
          'The player presses a key. It tips on its balance point and lifts the hammer behind it.',
          'The hammer flies up and strikes the tine from below — then drops back, so it does not stop the note.',
          'The tine, a thin steel rod, swings in its simplest shape — the tip most, the clamped end not at all. The tonebar above it rings at the same pitch, like the other prong of a tuning fork, and keeps the note going.',
          'The pickup — a magnet wound with fine wire — faces the tine’s tip. As the tip swings across its face, the magnetic field changes and a small electrical signal appears in the coil: the scope below draws it.',
          'The signal, still very small, goes through the instrument’s controls to the amplifier — and the amp’s speaker makes the sound you will mic.',
        ]
      : [
          'The player presses a key. It tips on its balance point and lifts the hammer behind it.',
          'The hammer flies up and strikes the steel reed from below, then drops back.',
          'The reed — a flat steel tongue clamped at one end, with a little solder at its tip for tuning — swings in its simplest shape: the tip most.',
          'The reed’s tip moves past the charged pickup plate. As it swings, the electrical charge between them changes, much as in a condenser microphone: a small signal appears. The scope below draws it.',
          'The signal goes through the instrument’s own preamp and amplifier to the speakers in the lid — the sound you will mic.',
        ];
    const mechParams: DockParam[] = [
      { kind: 'fader', id: 'step', label: 'STEP', value: (mShown - 1) / (MECH_STEPS - 1), onChange: (v) => mGo(1 + Math.round(v * (MECH_STEPS - 1))), format: () => `${mShown} of ${MECH_STEPS} · ${mechTitles[mShown - 1].toLowerCase()}`, formatShort: () => `${mShown} / ${MECH_STEPS}` },
      { kind: 'action', id: 'play', label: mPlaying ? 'PAUSE' : mShown >= MECH_STEPS ? 'REPLAY ONCE' : motion ? 'PLAY ONCE' : 'NEXT STEP', onPress: mPlay, tint: colors.green },
      { kind: 'fader', id: 'swing', label: 'SWING', value: swing, home: 0, onChange: (v) => setSwing(Math.round(v * 60) / 60), format: () => (mShown >= 3 ? 'move the bar through its swing by hand — the scope draws the signal' : 'step to ③ first, then swing the bar by hand'), formatShort: () => `${Math.round(swing * 100)}%` },
      ...(!rhodes ? [{ kind: 'toggle' as const, id: 'trem', label: tremolo ? 'VIBRATO ON' : 'VIBRATO OFF', value: tremolo, onToggle: () => setTremolo((x) => !x) }] : []),
    ];
    const steps: MikingStep[] = [
      {
        key: 'mech',
        title: 'Key to signal',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) => <MechanismDisplay w={w} h={h} kind={mechKind} reveal={mReveal} shown={mShown} swing={swing} tremolo={tremolo} accessibilityLabel={`Inside view of one note, event ${mShown} of ${MECH_STEPS}: ${mechTitles[mShown - 1]}. ${mechTexts[mShown - 1]}`} />,
          badge: 'INSIDE VIEW — never opened · the order of events, not their speed · motion drawn much larger · silent',
          bezel: [
            { k: 'EVENT', v: `${mShown} / ${MECH_STEPS}`, flex: 0.8 },
            { k: rhodes ? 'TINE' : 'REED', v: mShown >= 3 ? 'SWINGING' : mShown === 2 ? 'STRUCK' : 'AT REST', flex: 1.2 },
            { k: 'PICKUP', v: mShown >= 4 ? 'SIGNAL' : '—', flex: 1 },
            ...(!rhodes ? [{ k: 'VIBRATO', v: tremolo ? 'LEVEL PULSES' : 'OFF', flex: 1.3 } as BezelItem] : []),
          ],
          params: mechParams,
          initialParam: 'step',
        },
        well: (
          <>
            {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
            <Landing looking={`Inside view · one note · ${rhodes ? 'tine, tonebar and pickup' : 'reed and pickup plate'}`} prompt="STEP through the five events, or PLAY ONCE — it stops at the end. Then, from ③, move SWING by hand and watch the scope." />
            <Card>
              <Point title={`${mShown} · ${mechTitles[mShown - 1].toUpperCase()}`}>{mechTexts[mShown - 1]}</Point>
            </Card>
            {!rhodes && tremolo ? <Note>The instrument’s “vibrato” is a tremolo: it makes the LEVEL pulse up and down, as the scope shows — the pitch does not change. It is a mono effect, not left-to-right movement.</Note> : null}
            {predicted != null && mShown >= 4 ? <Note tone="ok">{`You predicted “${predicted}”. The ${rhodes ? 'tine' : 'reed'} itself is very quiet in the air — the pickup turns its motion into a small signal, and the amplifier and its speaker make the sound you will mic.`}</Note> : null}
            <Note>{spec.notes.mech}</Note>
          </>
        ),
      },
      {
        key: 'cone',
        title: 'Signal to air',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) => <ConeSequence w={w} h={h} back={coneBack} reveal={reveal} shown={shown} accessibilityLabel={`A speaker cut open from the side, ${coneBack} back. Event ${shown} of ${n}: ${stage.title}. ${stageText(shown - 1)}`} />,
          badge: rhodes ? 'The order of events, not their speed · cone motion drawn much larger · silent' : 'A speaker cut open (drawn large) · the same physics in the small oval speakers · silent',
          bezel: [
            { k: 'EVENT', v: `${shown} / ${n}`, flex: 0.8 },
            { k: 'CONE', v: shown >= 2 ? 'FORWARD' : 'AT REST', flex: 1.1 },
            { k: 'FRONT AIR', v: shown >= 3 ? 'PUSHED' : '—', flex: 1.1 },
            { k: 'BACK AIR', v: shown >= 3 ? (coneBack === 'open' ? 'PULLED · OUT' : rhodes ? 'PULLED · IN BOX' : 'INTO THE CASE') : '—', flex: 1.4 },
          ],
          params: [
            { kind: 'fader', id: 'step', label: 'STEP', value: (shown - 1) / Math.max(1, n - 1), onChange: (v) => goTo(1 + Math.round(v * (n - 1))), format: () => `${shown} of ${n} · ${stage.title.toLowerCase()}`, formatShort: () => `${shown} / ${n}` },
            { kind: 'action', id: 'play', label: playing ? 'PAUSE' : shown >= n ? 'REPLAY ONCE' : motion ? 'PLAY ONCE' : 'NEXT STEP', onPress: play, tint: colors.green },
            ...(spec.backs.length > 1
              ? [
                  {
                    kind: 'options' as const,
                    id: 'back',
                    label: 'BACK',
                    valueLabel: coneBack === 'open' ? 'OPEN' : 'CLOSED',
                    selectedId: coneBack,
                    onSelect: (id: string) => setConeBack(id as Back),
                    options: [
                      { id: 'open', label: 'OPEN BACK', blurb: 'As on many combo amps: the back of the cone sounds out behind, opposite in polarity.' },
                      { id: 'closed', label: 'CLOSED BACK', blurb: 'The sound from the back of the cone stays in the box.' },
                    ],
                  },
                ]
              : []),
          ],
          initialParam: 'step',
        },
        well: (
          <>
            <Landing looking={`Side view · a speaker cut open · ${coneBack} back`} prompt="STEP through the four events, or PLAY ONCE — it stops at the end." />
            <Card>
              <Point title={`${shown} · ${stage.title.toUpperCase()}`}>{stageText(shown - 1)}</Point>
            </Card>
            {shown >= n ? <Note>Then the cone moves back, and the push and pull swap — over and over, following the signal from the pickup.</Note> : null}
          </>
        ),
      },
      ...(rhodes
        ? [
            {
              key: 'beam',
              title: 'How it spreads',
              kind: 'COMPARE' as const,
              layout: 'rack' as const,
              rack: {
                render: (w: number, h: number) => <BeamDisplay w={w} h={h} fHz={fHz} micDeg={micDeg} accessibilityLabel={`How a 12 inch speaker spreads its sound at ${fmtHz(fHz)}, a simplified picture. A mic ${micDeg} degrees off the speaker's axis is ${atMic <= -39.5 ? 'in a deep dip' : fmtDb(atMic)} from on-axis.`} />,
                badge: 'A simplified picture: a rigid disc the size of a 12 in cone, in an endless wall, far away',
                bezel: [
                  { k: 'PITCH', v: fmtHz(fHz), flex: 1 },
                  { k: 'MIC OFF AXIS', v: `${micDeg}°`, flex: 1.1 },
                  { k: 'AT THE MIC', v: atMic <= -39.5 ? 'DEEP DIP' : fmtDb(atMic), sub: 'vs on axis', flex: 1.1 },
                  { k: 'HALF LEVEL', v: half == null ? 'WIDE' : `±${Math.round(half)}°`, sub: half == null ? 'no beam' : '−6 dB', flex: 1 },
                ] as BezelItem[],
                params: [
                  { kind: 'fader', id: 'pitch', label: 'PITCH', value: fNorm, onChange: (v: number) => setFNorm(Math.round(v * 100) / 100), format: () => `${fmtHz(fHz)} · ${half == null ? 'spreads wide' : `half level at ±${Math.round(half)}°`}`, formatShort: () => fmtHz(fHz) },
                  { kind: 'fader', id: 'mic', label: 'MIC ANGLE', value: micDeg / 80, home: 0, onChange: (v: number) => setMicDeg(Math.round(v * 16) * 5), format: () => `${micDeg}° off the speaker’s axis`, formatShort: () => `${micDeg}°` },
                ] as DockParam[],
                initialParam: 'pitch',
              },
              well: (
                <>
                  <Landing looking={`A speaker’s spread · ${fmtHz(fHz)}`} prompt="Slide PITCH from low to high and watch the spread narrow. Then move the MIC off the axis." />
                  <Card>
                    <Point title={half == null ? 'LOW PITCH: IT SPREADS WIDE' : 'HIGHER PITCH: IT BEAMS'}>{half == null ? 'At low pitches the cone is small next to the wavelength, so the sound spreads to the sides almost as strongly as straight ahead.' : `Here the cone is large next to the wavelength, so the sound narrows into a beam: half the level (−6 dB) by about ±${Math.round(half)}° off the axis. A mic off to the side hears less of these highs.`}</Point>
                  </Card>
                  {spec.notes.beam ? <Note>{spec.notes.beam}</Note> : null}
                  <Note>{`This beam is a far-field picture: at ${fmtHz(fHz)} it applies from about ${fmtLen(farFrom)} out. A close mic sits in the speaker’s near field, where the spot it faces on the cone matters more — the next step.`}</Note>
                </>
              ),
            } as MikingStep,
          ]
        : []),
      {
        key: 'spots',
        title: 'Centre and edge',
        kind: 'COMPARE',
        layout: 'rack',
        rack: rhodes
          ? {
              render: (w, h) => <CabExplorer w={w} h={h} kind="1x12" back="closed" view="face" spot={spot12} accessibilityLabel={`One speaker face-on, the spot marked: ${SPOT_WORDS[spot12].title.toLowerCase()}.`} />,
              badge: 'One speaker face-on · the blue ring is where the mic aims · tendencies to check, not results',
              bezel: [
                { k: 'SPOT', v: spot12 === 'centre' ? 'CENTRE' : spot12 === 'boundary' ? 'CAP EDGE' : 'EDGE', flex: 1.2 },
                { k: 'FROM CENTRE', v: lenCell(SPOT_WORDS[spot12].r).v, sub: lenCell(SPOT_WORDS[spot12].r).sub, flex: 1.3 },
                { k: 'TENDS TO', v: spot12 === 'centre' ? 'BRIGHTER' : spot12 === 'boundary' ? 'BETWEEN' : 'WARMER', flex: 1.3 },
              ],
              params: [{ kind: 'fader', id: 'spot', label: 'SPOT', value: SPOTS_12.indexOf(spot12) / 2, onChange: (v) => setSpot12(SPOTS_12[Math.round(v * 2)]), format: () => SPOT_WORDS[spot12].title.toLowerCase(), formatShort: () => (spot12 === 'centre' ? 'CENTRE' : spot12 === 'boundary' ? 'CAP EDGE' : 'EDGE') }],
              initialParam: 'spot',
            }
          : {
              render: (w, h) => <KeysExplorer w={w} h={h} show="oval" spot={spotOv} accessibilityLabel={`One oval speaker face-on, the spot marked: ${OVAL_WORDS[spotOv].title.toLowerCase()}.`} />,
              badge: 'One 4 × 8 in oval speaker face-on · the blue ring is where the mic aims · tendencies to check',
              bezel: [
                { k: 'SPOT', v: OVAL_WORDS[spotOv].short, flex: 1.3 },
                { k: 'FROM CENTRE', v: lenCell(OVAL_WORDS[spotOv].r).v, sub: lenCell(OVAL_WORDS[spotOv].r).sub, flex: 1.3 },
                { k: 'TENDS TO', v: OVAL_WORDS[spotOv].tends, flex: 1.2 },
              ],
              params: [{ kind: 'fader', id: 'spot', label: 'SPOT', value: SPOTS_OVAL.indexOf(spotOv) / 2, onChange: (v) => setSpotOv(SPOTS_OVAL[Math.round(v * 2)]), format: () => OVAL_WORDS[spotOv].title.toLowerCase(), formatShort: () => OVAL_WORDS[spotOv].short.slice(0, 9) }],
              initialParam: 'spot',
            },
        well: (
          <>
            <Landing looking={rhodes ? 'One speaker, face-on' : 'One oval speaker, face-on'} prompt="Step SPOT from the centre outward. Each is a place to aim a close mic." />
            <Card>{rhodes ? <Point title={SPOT_WORDS[spot12].title}>{SPOT_WORDS[spot12].text}</Point> : <Point title={OVAL_WORDS[spotOv].title}>{OVAL_WORDS[spotOv].text}</Point>}</Card>
            <Note>{spec.notes.spots}</Note>
          </>
        ),
      },
      {
        key: 'air',
        title: 'Air, not wire',
        kind: 'CHECK',
        layout: 'read',
        body: (
          <>
            <Card>
              <Point title="THE START OF A NOTE">{lesson.sound.attack}</Point>
              <Point title="THE HELD TONE">{lesson.sound.body}</Point>
            </Card>
            <Note>{spec.notes.air}</Note>
            {!done ? <Note tone="warn">{`Still to do for this page’s credit: ${[mechShown && !mechDone.current ? 'step the mechanism to the end' : '', mechShown && !swungFar.current ? 'swing the bar at least half-way by hand' : '', !coneDone.current ? 'step the cone through to the end' : ''].filter(Boolean).join(', ')}.`}</Note> : null}
            <Note>{spec.notes.mechCheck}</Note>
            <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'sound')} answers={answers} onAnswered={onAnswered} />
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  }

  /* ═══════════════ 3 · WHERE IT SITS ═══════════════ */
  function KeysSetting({ lesson, answers, onAnswered }: PageProps) {
    const items = lesson.setting.items;
    const byId = (id: string | null) => items.find((i) => i.id === id);
    const shortOf = (id: string) => byId(id)?.short ?? id.toUpperCase();
    const [cSel, setCSel] = useState<string | null>(null);
    const [patch, setPatch] = useState<'cab' | 'desk'>('cab');
    const [scene, setScene] = useState<KeysScene>('stage');
    const [sel, setSel] = useState<string | null>(null);
    const chainIds = ['player', ...(spec.chain.diBox ? ['dibox'] : []), 'amp', 'cab', 'mic', 'desk', ...(spec.chain.ampDirect ? ['ampdi'] : [])];
    const chainItems = chainIds.map((id) => byId(id)).filter((x): x is NonNullable<typeof x> => !!x);
    const wedgeIds = lesson.live.wedges.map((w, i) => (i === 0 ? 'wedge' : w.id));
    const planIds = scene === 'stage' ? ['amp', ...(rhodes ? ['keys'] : []), 'musician', 'pedal', 'dibox', ...wedgeIds, 'drums', 'otherAmp', 'audience'] : ['amp', ...(rhodes ? ['keys'] : []), 'musician', 'pedal', 'dibox', 'otherAmp', 'room'];
    const planItems = planIds
      .map((id) => {
        const it = byId(id);
        if (it) return it;
        const wd = lesson.live.wedges.find((w) => w.id === id);
        return wd ? { id, label: wd.label, short: wd.short, note: wd.note, tag: 'MONITOR' } : null;
      })
      .filter((x): x is NonNullable<typeof x> => !!x);
    const cIdx = Math.max(0, chainItems.findIndex((i) => i.id === cSel));
    const pIdx = Math.max(0, planItems.findIndex((i) => i.id === sel));
    const cs = byId(cSel);
    const ps = planItems.find((i) => i.id === sel);
    const verdict = patchVerdict('speakerOut', patch === 'cab' ? 'cabinet' : 'micIn');
    const steps: MikingStep[] = [
      {
        key: 'path',
        title: 'The signal path',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) => (
            <DiPath
              w={w}
              h={h}
              spec={spec.chain}
              highlight={cSel}
              onTap={setCSel}
              shortOf={shortOf}
              badPatch={patch === 'desk'}
              accessibilityLabel={`The signal path. Top, the air path: ${chainItems.filter((i) => !['dibox', 'ampdi'].includes(i.id)).map((i) => i.label).join(', then ')}. Below, drawn apart: ${spec.chain.diBox ? 'a DI box between the keyboard and the amp, its output to the desk' : 'the instrument’s own auxiliary output to the desk'} — a separate electrical source.${patch === 'desk' ? ' Shown struck out in red: a speaker output patched into the desk, which is never done.' : ''}${cs ? ` Highlighted: ${cs.label}.` : ''}`}
            />
          ),
          badge: 'Blue = the air a mic hears · amber dashes = a separate electrical path · brown = speaker cable',
          bezel: [
            { k: 'ITEM', v: cs ? cs.short : 'TAP ONE', flex: 1.4 },
            { k: 'FOR A MIC', v: cs ? cs.tag : '—', flex: 1.3 },
            { k: 'SPEAKER OUT →', v: patch === 'cab' ? 'SPEAKER' : 'DESK', sub: verdict === 'ok' ? 'correct' : 'never', tint: verdict === 'ok' ? '#5bff85' : '#ff5a48', flex: 1.3 },
          ],
          params: [
            {
              kind: 'fader',
              id: 'item',
              label: 'ITEM',
              value: chainItems.length > 1 ? cIdx / (chainItems.length - 1) : 0,
              onChange: (v) => {
                const it = chainItems[Math.round(v * (chainItems.length - 1))];
                if (it) setCSel(it.id);
              },
              format: () => (cs ? `${cs.short} · ${cs.tag}` : `step through the ${chainItems.length} items`),
              formatShort: () => (cs ? cs.short.slice(0, 9) : 'STEP'),
            },
            {
              kind: 'options',
              id: 'patch',
              label: 'PATCH',
              valueLabel: patch === 'cab' ? 'TO SPEAKER' : 'TO DESK',
              selectedId: patch,
              onSelect: (id) => setPatch(id as 'cab' | 'desk'),
              options: [
                { id: 'cab', label: 'SPEAKER OUT → THE SPEAKER', blurb: rhodes ? 'By a speaker cable, as the amp’s manual says — the only place a speaker output goes.' : 'Inside the instrument, to its own speakers — the only place a speaker output goes.' },
                { id: 'desk', label: 'SPEAKER OUT → A DESK INPUT', blurb: 'Shown so you can recognise it — never do it: a speaker output carries high power.' },
              ],
            },
          ],
          initialParam: 'item',
        },
        well: (
          <>
            <Landing looking={rhodes ? 'From the tines to the desk' : 'From the reeds to the desk'} prompt="Tap each link — or step through ITEM. Which path is the air, and which are wires?" />
            {cs ? (
              <Card>
                <Point title={cs.label.toUpperCase()}>{cs.note}</Point>
              </Card>
            ) : (
              <Note>{`The mic hears the air the speaker moves. ${rhodes ? 'A DI' : 'The auxiliary output'} is an electrical copy taken earlier in the chain: its own source, a useful comparison — not miking.`}</Note>
            )}
            {patch === 'desk' ? <Note tone="warn">Never patch a speaker output into a mic input, a line input or an ordinary DI: it carries high power and can damage the desk, the amplifier and hearing. Only a device rated for it, fitted by a technician, takes a speaker-level signal. When unsure, stop and ask.</Note> : null}
          </>
        ),
      },
      {
        key: 'stage',
        title: 'Stage and studio',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) => <KeysPlan w={w} h={h} rig={spec.rig} scene={scene} wedges={lesson.live.wedges} highlight={sel} onTap={setSel} shortOf={(id) => planItems.find((i) => i.id === id)?.short ?? shortOf(id)} accessibilityLabel={`${scene === 'stage' ? 'A stage' : 'A studio room'} from above: ${rhodes ? 'the combo amp, the keyboard to its side with the player and their keep-clear space' : 'the instrument with its speakers facing the player, and the player’s keep-clear space'}, a DI box, another amp${scene === 'stage' ? ', the monitor wedge, the drum kit, the PA and the audience' : ''}.${ps ? ` Highlighted: ${ps.label}.` : ''}`} />,
          badge: scene === 'stage' ? 'From above · a typical layout · grey dashes = the player’s space, keep clear' : 'From above · a typical studio room',
          bezel: [
            { k: 'ITEM', v: ps ? ps.short : 'TAP ONE', flex: 1.4 },
            { k: 'FOR A MIC', v: ps ? ps.tag : '—', flex: 1.4 },
            { k: 'WHERE', v: scene === 'stage' ? 'LIVE' : 'STUDIO' },
          ],
          params: [
            {
              kind: 'fader',
              id: 'item',
              label: 'ITEM',
              value: planItems.length > 1 ? pIdx / (planItems.length - 1) : 0,
              onChange: (v) => {
                const it = planItems[Math.round(v * (planItems.length - 1))];
                if (it) setSel(it.id);
              },
              format: () => (ps ? `${ps.short} · ${ps.tag}` : `step through the ${planItems.length} items`),
              formatShort: () => (ps ? ps.short.slice(0, 9) : 'STEP'),
            },
            {
              kind: 'options',
              id: 'where',
              label: scene === 'stage' ? 'STAGE' : 'STUDIO',
              valueLabel: scene === 'stage' ? 'LIVE' : 'STUDIO',
              selectedId: scene,
              onSelect: (id) => {
                setScene(id as KeysScene);
                setSel(null);
              },
              sticky: true,
              options: [
                { id: 'stage', label: 'ON A STAGE (LIVE)', blurb: lesson.setting.stage },
                { id: 'studio', label: 'IN A STUDIO', blurb: lesson.setting.studio },
              ],
            },
          ],
          initialParam: 'item',
        },
        well: (
          <>
            <Landing looking={scene === 'stage' ? 'Plan · a stage from above, the audience at the right' : 'Plan · a studio room from above'} prompt="Tap what sits round the instrument — or step through ITEM." />
            <Body>{scene === 'stage' ? lesson.setting.stage : lesson.setting.studio}</Body>
            {ps ? (
              <Card>
                <Point title={ps.label.toUpperCase()}>{ps.note}</Point>
              </Card>
            ) : null}
          </>
        ),
      },
      {
        key: 'before',
        title: 'Before any mic',
        kind: 'CHECK',
        layout: 'read',
        body: (
          <>
            <Card>
              <Point title="ASK THE PLAYER FIRST">{rhodes ? 'Which instrument and amp, the controls and effects, the stereo panning if they use two speakers, and the level they will really play at. Then listen from a safe spot while they play soft chords, hard accents, low and high notes, with the sustain pedal.' : 'Which model, the volume, the vibrato setting and depth, and the level they will really play at. Then listen near the player and from the room while they play soft notes, hard chords, low and high notes, held chords with the vibrato, and the sustain pedal.'}</Point>
              <Point title="WORK WITH THE SOUND AS IT IS">{rhodes ? 'The instrument’s and the amp’s settings are the player’s sound. Keep them as set while you compare positions. An uneven or clanking note is not a mic problem: never move a pickup — ask the owner or a technician.' : 'The player’s settings are their sound. A buzz or rattle from a speaker is not a mic problem: never loosen or tighten the old hardware yourself — ask the owner or a technician.'}</Point>
              <Point title="ELECTRICAL SAFETY">{rhodes ? 'Use the approved power, cables and ventilation. Do not open an amp, defeat a safety ground, touch speaker terminals or change speaker wiring for a miking exercise. Stop for hum from damaged cable, a hot smell, smoke or any shock, and involve a qualified technician.' : 'Keep the case closed: inside there is mains power and a high-voltage pickup, and unplugging alone does not make it safe to open. Do not use a ground-lift adapter to chase hum. Stop for a shock, a hot smell, arcing or a damaged cord, and involve a qualified technician.'}</Point>
            </Card>
            <Note tone="warn">Protect your hearing at soundcheck. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, halving the time for every 3 dBA above that — and below it is not a promise of safety. That is a limit for PEOPLE, measured where a person listens, and it has nothing to do with a microphone’s maximum SPL rating. Keep levels and repetitions down, and use hearing protection.</Note>
            <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'setting')} answers={answers} onAnswered={onAnswered} />
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  }

  return { ...ampPages, instrument: KeysInstrument, sound: KeysSound, setting: KeysSetting };
}

/** The mechanism figure's aspect, for a page that shows it in a figure. */
export const KEYS_MECH_ASPECT = MECH_ASPECT;

const styles = StyleSheet.create({
  link: { gap: 8, paddingVertical: 4 },
  linkText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20 },
});

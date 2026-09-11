/**
 * Beginning Mixing — pages 1–4 (owner brief 2026-09-11; sections: What Mixing
 * Does · Prepare the Session · Basic Signal Flow · Gain Staging).
 * ALL COPY IS NEW — owner ratification pending
 * (docs/APE_MIXING_LAB_COPY_2026_09_11.md).
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { Body, Btn, Card, Eyebrow, Lead, Prompt, Row, useStableShuffle } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { AbPlayer, ConceptList, GoalChips, MixMantra, useFocalChoice, useMixPlayback, useVisitGoals, type MixVariant } from './kit';
import { DIMENSIONS, FOCAL_CHOICES, correlatedSumPeakDb } from './engine/mixModel.ts';
import { CHANNEL_PATH, STATION_ORDER, firstOrderMistake, isChannelOrderCorrect, type StationId } from './engine/routing.ts';

/* ════ 1 · WHAT MIXING DOES ═══════════════════════════════════════════════ */

function PageWhatMixingDoes({ ctx }: { ctx: PageCtx }) {
  const [focal, setFocal] = useFocalChoice();
  const [dimSeen, setDimSeen] = useState<Set<string>>(new Set());
  const [checkDone, setCheckDone] = useState(false);
  const goals = [
    { label: 'Open all five dimensions', hit: dimSeen.size >= DIMENSIONS.length },
    { label: 'Choose your focal point', hit: focal != null },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <MixMantra />
      <Lead>A mix is not a stack of plugins. It is a SEQUENCE OF DECISIONS about what the listener should notice — made by listening, checked by listening.</Lead>
      <Card>
        <Eyebrow>THE FIVE DIMENSIONS</Eyebrow>
        <Body>Every mixing decision you will ever make changes one of five things. Tap each dimension to open its question.</Body>
        <ConceptList
          items={DIMENSIONS.map((d) => ({ id: d.id, name: d.name, blurb: d.question }))}
          opened={dimSeen}
          onOpen={(id) => setDimSeen((s) => new Set(s).add(id))}
        />
      </Card>
      <Card>
        <Eyebrow>YOUR FIRST DECISION</Eyebrow>
        <Prompt>Before one fader moves: what is this song ABOUT? Choose the focal point your whole mix will serve.</Prompt>
        {FOCAL_CHOICES.map((f) => (
          <Btn
            key={f.id}
            label={focal === f.id ? `✓ ${f.name}` : f.name}
            tone={focal === f.id ? 'primary' : 'plain'}
            selected={focal === f.id}
            onPress={() => setFocal(f.id)}
            a11y={`${f.name}. ${f.note}`}
          />
        ))}
        {focal ? <Body>{FOCAL_CHOICES.find((f) => f.id === focal)!.note} There is no single correct choice — a mix fails only when nobody made one.</Body> : null}
      </Card>
      <UnderstandingCheck
        question="A guitar and a vocal blur into each other in the chorus. Which dimension is that?"
        options={['Balance — one of them is too loud', 'Frequency — they occupy the same range', 'Movement — the chorus changes too little', 'Depth — the reverb tail is too long']}
        correct={1}
        explain="When two sounds occupy the same frequency range they mask each other — a FREQUENCY problem. It might also be treatable with balance or panning, but the collision itself lives in frequency."
        wrong={[
          'Turning one down can paper over it, but the blur is still there at equal, modest levels — the cause is not level.',
          undefined,
          'Movement is about change across sections. This collision happens inside one section.',
          'This blur exists even bone dry, so the tail is not the culprit.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 2 · PREPARE THE SESSION ════════════════════════════════════════════ */

const PREP_ITEMS = [
  { id: 'names', name: 'Name, order, colour', why: 'KICK, SNARE, LEAD — not Audio_07. You cannot mix what you cannot find.' },
  { id: 'cleanup', name: 'Remove the junk', why: 'Unused tracks, count-ins, coughs, hum between phrases: gone now, not fought with plugins later.' },
  { id: 'clipgain', name: 'Clip gain first', why: 'Even out wild clip levels BEFORE the fader, so the fader has one job.' },
  { id: 'phase', name: 'Polarity, phase, timing', why: 'Check multi-mic pairs and stereo files now. No EQ fixes a phase fight.' },
  { id: 'headroom', name: 'Leave headroom', why: 'Peaks comfortably below zero. A mix that starts hot has nowhere to go.' },
  { id: 'refs', name: 'Pick 1–2 references', why: 'Professional mixes you trust, ready to compare against at matched loudness.' },
  { id: 'version', name: 'Save the untouched version', why: 'One saved copy of the starting point. Every brave decision needs a way back.' },
] as const;

function PagePrepare({ ctx }: { ctx: PageCtx }) {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [checkDone, setCheckDone] = useState(false);
  const goals = [
    { label: 'Open every prep step', hit: seen.size >= PREP_ITEMS.length },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>Mixing starts before mixing. Ten minutes of preparation prevents an hour of trying to solve ORGANIZATIONAL problems with plugins.</Lead>
      <Card>
        <Eyebrow>THE PREP CHECKLIST</Eyebrow>
        <ConceptList
          items={PREP_ITEMS.map((p) => ({ id: p.id, name: p.name, blurb: p.why }))}
          opened={seen}
          onOpen={(id) => setSeen((s) => new Set(s).add(id))}
        />
      </Card>
      <Card tone="note">
        <Eyebrow>SEPARATE THE JOBS</Eyebrow>
        <Body>Recording captures. Editing repairs and arranges. Producing decides what exists. Mixing balances what exists. Mastering finishes the finished mix. When you catch yourself re-recording, re-arranging or mastering mid-mix — stop, name the job, and do it on purpose.</Body>
      </Card>
      <UnderstandingCheck
        question="A verse vocal was recorded much quieter than the chorus. Where does that get fixed FIRST?"
        options={['Compression — even it out with a compressor', 'Clip gain — level the clips before anything else', 'The fader — ride it up in the verse', 'Mastering will take care of it']}
        correct={1}
        explain="Clip gain evens out the RECORDING so every later stage — compressor included — sees a consistent signal. Compression and rides then do musical work instead of rescue work."
        wrong={[
          'A compressor CAN even it out — but then it works hard all mix long on a problem an earlier, simpler stage removes in one move.',
          undefined,
          'A fader ride fixes one pass, and nothing upstream sees the fix — your sends and inserts still get the lopsided signal.',
          'Mastering polishes a finished stereo mix. It cannot reach one vocal clip inside your session.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 3 · BASIC SIGNAL FLOW (the builder) ════════════════════════════════ */

function PageSignalFlow({ ctx }: { ctx: PageCtx }) {
  const { shuffled } = useStableShuffle(CHANNEL_PATH, 'mix-flow');
  const [placed, setPlaced] = useState<StationId[]>([]);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const remaining = shuffled.filter((s) => !placed.includes(s.id));
  const goals = [{ label: 'Build the channel path in order', hit: solved }];
  const latched = useVisitGoals(ctx, goals);

  const tap = (id: StationId) => {
    const next = [...placed, id];
    setPlaced(next);
    if (next.length === STATION_ORDER.length) {
      if (isChannelOrderCorrect(next)) {
        setSolved(true);
        setFeedback('✓ That is the path every DAW and every console shares. Say it until it is boring.');
      } else {
        const m = firstOrderMistake(next);
        const s = CHANNEL_PATH.find((x) => x.id === m!.station)!;
        const f = CHANNEL_PATH.find((x) => x.id === m!.mustFollow)!;
        setFeedback(`Not yet — ${s.name} comes AFTER ${f.name}. (${f.blurb}) Reset and walk the signal again.`);
      }
    }
  };

  return (
    <View style={styles.page}>
      <Lead>One path, every mixer, every DAW. Audio flows through a channel in a fixed order — and every later lesson in this lab hangs on knowing it cold.</Lead>
      <Card>
        <Eyebrow>THE EIGHT STATIONS — STUDY THEM (ORDER HIDDEN)</Eyebrow>
        {shuffled.map((s) => (
          <View key={s.id} style={styles.flowRow} accessible accessibilityLabel={`${s.name}: ${s.blurb}`}>
            <View style={styles.flowBody}>
              <Text style={styles.flowName}>{s.name}</Text>
              <Text style={styles.flowBlurb}>{s.blurb}</Text>
            </View>
          </View>
        ))}
      </Card>
      <Card tone={solved ? 'ok' : 'plain'}>
        <Eyebrow>NOW BUILD THE PATH</Eyebrow>
        <Prompt>Tap the stations in signal order, source to output — from what each one DOES, not from a printed answer.</Prompt>
        <Text style={styles.builtLine} accessibilityLiveRegion="polite">
          {placed.length === 0 ? '—' : placed.map((id) => CHANNEL_PATH.find((s) => s.id === id)!.name).join(' → ')}
        </Text>
        <Row>
          {shuffled.map((s) => {
            const isPlaced = placed.includes(s.id);
            return <Btn key={s.id} label={isPlaced ? `✓ ${s.name}` : s.name} disabled={isPlaced || solved} selected={isPlaced} onPress={() => tap(s.id)} a11y={isPlaced ? `${s.name} placed` : `Place ${s.name} next`} />;
          })}
        </Row>
        {feedback ? <Body>{feedback}</Body> : null}
        <Btn
          label="RESET"
          disabled={placed.length === 0 || solved}
          onPress={() => {
            setPlaced([]);
            setFeedback(null);
          }}
          a11y="Reset the builder"
        />
      </Card>
      {solved ? (
        <Card tone="ok">
          <Eyebrow>THE CANONICAL PATH — YOURS NOW</Eyebrow>
          {CHANNEL_PATH.map((s, i) => (
            <View key={s.id} style={styles.flowRow} accessible accessibilityLabel={`${i + 1}. ${s.name}: ${s.blurb}`}>
              <Text style={styles.flowNum}>{i + 1}</Text>
              <View style={styles.flowBody}>
                <Text style={styles.flowName}>{s.name}</Text>
                <Text style={styles.flowBlurb}>{s.blurb}</Text>
              </View>
            </View>
          ))}
        </Card>
      ) : null}
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 4 · GAIN STAGING ═══════════════════════════════════════════════════ */

function PageGainStaging({ ctx }: { ctx: PageCtx }) {
  const [verdict, setVerdict] = useState<null | 'a' | 'b' | 'same'>(null);
  // The louder-sounds-better trap, BLIND (cognition pass P2-2): the learner
  // votes on A vs B before learning that B is the same mix +3 dB; the reveal
  // then offers B matched back to A (i.e., identical audio — the point).
  const variants = useMemo<readonly MixVariant[]>(
    () => [
      { id: 'a', label: 'MIX A', settings: {} },
      { id: 'b', label: 'MIX B', settings: {}, masterDb: 3 },
      { id: 'c', label: 'B, MATCHED', settings: {}, masterDb: 3, matchTo: 'a' },
    ],
    [],
  );
  const pb = useMixPlayback(variants);
  const heardAB = pb.heard.includes('a') && pb.heard.includes('b');
  const [checkDone, setCheckDone] = useState(false);
  const goals = [
    { label: 'Vote A vs B blind', hit: verdict != null },
    { label: 'Hear the reveal', hit: pb.heard.includes('c') },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  const sum = correlatedSumPeakDb(-6, 2);
  return (
    <View style={styles.page}>
      <Lead>Healthy levels are not about one magic number. They are about HEADROOM — space between your peaks and the ceiling — and about not letting loudness lie to you.</Lead>
      <Card tone="math">
        <Eyebrow>WHY HEADROOM</Eyebrow>
        <Body>Digital zero is a hard ceiling: anything past it is clipped, permanently. And peaks GANG UP — two identical −6 dB peaks landing together can reach {sum.toFixed(1)} dB. Eight tracks each “safely” hot leave a mix bus with nowhere to live. Peaks comfortably below zero on every track is the whole rule.</Body>
      </Card>
      <Card>
        <Eyebrow>A OR B — BLIND</Eyebrow>
        <Prompt>Two mixes of the session. Play both, then vote: which one sounds better?</Prompt>
        <AbPlayer pb={pb} variants={variants.slice(0, 2)} />
        {heardAB && verdict == null ? (
          <Row>
            <Btn label="A SOUNDS BETTER" onPress={() => setVerdict('a')} a11y="Vote: A sounds better" />
            <Btn label="B SOUNDS BETTER" onPress={() => setVerdict('b')} a11y="Vote: B sounds better" />
            <Btn label="THEY’RE THE SAME" onPress={() => setVerdict('same')} a11y="Vote: they sound the same" />
          </Row>
        ) : null}
        {verdict != null ? (
          <>
            <Body>
              {verdict === 'b'
                ? 'Most people vote B. Here is the trap: B is the SAME mix, 3 dB louder — nothing else changed.'
                : verdict === 'a'
                  ? 'Interesting — most vote B. B is the SAME mix, 3 dB louder; louder usually FEELS better even when nothing else changed.'
                  : 'Close listen! They are the same mix — B is simply 3 dB louder, and louder usually FEELS better.'}{' '}
              Now play B, MATCHED — B pulled back to A’s measured loudness:
            </Body>
            <AbPlayer pb={pb} variants={[variants[0], variants[2]]} note="Every comparison in this lab that changes loudness is level-matched by measured RMS before you judge it. Hold this rule for life." />
            {pb.heard.includes('c') ? <Body>✓ Matched, B IS A. That bias never goes away — level-matching is how professionals outvote it.</Body> : null}
          </>
        ) : null}
      </Card>
      <UnderstandingCheck
        question="Your mix bus peaks at −0.2 dBFS and “feels powerful”. What is the honest reading?"
        options={['Great — close to zero means professional level', 'Almost no headroom — one hot chorus from clipping', 'Fine, because the master fader can fix it later', 'Loud playback proves the mix is good']}
        correct={1}
        explain="−0.2 dBFS leaves 0.2 dB of headroom. Any hotter moment clips. Pull the whole mix down and keep working — loudness for delivery comes later, measured, not by crowding the ceiling."
        wrong={[
          'Close to zero is not professional — it is out of room. Headroom is space to work.',
          undefined,
          'Pulling the master down later hides that individual stages are already slamming. Fix levels where they are made.',
          'Louder always FEELS better — that is the bias this page exists to disarm.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ export ═════════════════════════════════════════════════════════════ */

// Every page completes via its GOALS (useVisitGoals), never by mere visit.
export const MIXING_PAGES_A: PageDef[] = [
  { title: 'What Mixing Does', short: 'MIX', Component: PageWhatMixingDoes, manualDone: true },
  { title: 'Prepare the Session', short: 'PREP', Component: PagePrepare, manualDone: true },
  { title: 'Basic Signal Flow', short: 'FLOW', Component: PageSignalFlow, manualDone: true },
  { title: 'Gain Staging', short: 'GAIN', Component: PageGainStaging, manualDone: true },
];

const styles = StyleSheet.create({
  page: { gap: 12 },
  flowRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  flowNum: { color: colors.amber, fontFamily: fonts.mono, fontSize: 12, width: 18, textAlign: 'right', marginTop: 1 },
  flowBody: { flex: 1 },
  flowName: { color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 12.5, letterSpacing: 0.8 },
  flowBlurb: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  builtLine: { color: colors.textPrimary, fontFamily: fonts.mono, fontSize: 12, lineHeight: 17 },
});

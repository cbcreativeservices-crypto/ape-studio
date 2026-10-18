/**
 * Screen 8 — Channel faders and crossfaders (research DJ13): channel levels,
 * crossfader assignment (A / THRU / B), the response curves, smooth blends and
 * introductory cuts. The curve plot is computed from the same model the audio
 * uses (djModel.xfGains). The summing demonstration (+6.02 dB for two aligned
 * copies, about +3 dB for two different tracks) is heard and metered here.
 * The fault: a fader up and nothing in the PA (the wrong crossfader side).
 */
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { BoothStage } from '../art/BoothStage';
import { CurvePlot } from '../art/plots';
import { MIXER, STRIP_X, onMixer } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { BoothTray, pct, stopKey, xfaderKey } from '../dock';
import { getBooth, updateBooth } from '../booth/boothStore';
import { cueAtBar, useScreenSetup } from '../booth/setup';
import { faderGain, xfGainFor, type Booth, type ChannelId, type XfAssign, type XfCurve } from '../model/djModel';
import { linToDb } from '../engine/djDsp';
import { peakCell, peakDb, useBoothKit } from './shared';

const TERMS = [
  { term: 'Channel fader', def: 'Each channel’s level into the mix. On this mixer it is square-law: half way up is about −12 dB.' },
  { term: 'Crossfader', def: 'A side-to-side fader that fades between the channels assigned to side A and side B.' },
  { term: 'THRU', def: 'A channel set to THRU ignores the crossfader completely — only its channel fader matters.' },
  { term: 'Curve', def: 'How the crossfader’s two gains change across its travel. BLEND keeps the total level steady; DIP lets it sag in the middle; CUT keeps both full until the very ends, for quick cuts.' },
  { term: 'Cut-in', def: 'How far the crossfader travels before a side comes in. A short cut-in (CUT) makes a sound appear almost the instant you move it.' },
] as const;

function SetupTray({ onDemo }: { onDemo: () => void }) {
  const b = getBooth();
  const setA = (ch: ChannelId, a: XfAssign) => updateBooth((x) => ({ ...x, ch: { ...x.ch, [ch]: { ...x.ch[ch], xf: a } } }));
  return (
    <View style={styles.tray}>
      <Text style={styles.head}>CURVE</Text>
      <View style={styles.row}>
        {(['BLEND', 'DIP', 'CUT'] as XfCurve[]).map((c) => (
          <LabChip key={c} label={c} selected={b.mixer.xfCurve === c} onPress={() => updateBooth((x) => ({ ...x, mixer: { ...x.mixer, xfCurve: c } }))} />
        ))}
      </View>
      {([1, 2] as const).map((ch) => (
        <View key={ch} style={styles.tray}>
          <Text style={styles.head}>{`CHANNEL ${ch} → CROSSFADER SIDE`}</Text>
          <View style={styles.row}>
            {(['A', 'THRU', 'B'] as XfAssign[]).map((a) => (
              <LabChip key={a} label={a} selected={b.ch[ch].xf === a} onPress={() => setA(ch, a)} compact />
            ))}
          </View>
        </View>
      ))}
      <Text style={styles.head}>THE SUMMING DEMONSTRATION</Text>
      <LabChip label="PUT THE SAME TRACK ON BOTH DECKS, ALIGNED" selected={false} onPress={onDemo} />
    </View>
  );
}

function PageFaders({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion } = useBoothKit();
  useScreenSetup((b) => {
    let x = cueAtBar(b, 'A', 'nightFerry', 17);
    x = cueAtBar(x, 'B', 'glassHarbour', 17);
    return { ...x, ch: { 1: { ...x.ch[1], fader: 0.85, xf: 'THRU', cue: false }, 2: { ...x.ch[2], fader: 0.85, xf: 'THRU', cue: false } }, mixer: { ...x.mixer, xf: 0.5, xfCurve: 'BLEND' }, perspective: 'CROWD' };
  });
  const [faderCh, setFaderCh] = useState<ChannelId>(1);
  const [demo, setDemo] = useState(false);
  const [check, setCheck] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  const travel = useRef({ blendLo: false, blendHi: false, cut: false });
  const m = booth.mixer;
  const both = booth.decks.A.playing && booth.decks.B.playing;
  const assigned = booth.ch[1].xf === 'A' && booth.ch[2].xf === 'B';
  if (both && assigned && m.xfCurve === 'BLEND') {
    if (m.xf < 0.15) travel.current.blendLo = true;
    if (m.xf > 0.85) travel.current.blendHi = true;
  }
  if (both && assigned && m.xfCurve === 'CUT' && (m.xf < 0.02 || m.xf > 0.98)) travel.current.cut = true;
  const last = audio.last;
  const goals = [
    { label: 'Assign CH1 → A, CH2 → B', hit: assigned },
    { label: 'Blend across with BLEND', hit: travel.current.blendLo && travel.current.blendHi },
    { label: 'Cut to one side with CUT', hit: travel.current.cut },
    { label: 'Hear two copies add +6 dB', hit: demo && both && m.xfCurve !== 'BLEND' && Math.abs(m.xf - 0.5) < 0.1 },
    { label: 'Fix the silent channel', hit: faultFixed },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);
  const gA = faderGain(booth.ch[1].fader) * xfGainFor(booth.ch[1].xf, m.xf, m.xfCurve);
  const gB = faderGain(booth.ch[2].fader) * xfGainFor(booth.ch[2].xf, m.xf, m.xfCurve);
  const fdb = (g: number) => (g <= 1e-6 ? '−∞' : `${linToDb(g) >= 0 ? '+' : '−'}${Math.abs(linToDb(g)).toFixed(1)}`);
  const plotH = (h: number) => Math.round(Math.min(130, h * 0.4));
  return (
    <DjRack
      spec={{
        render: (w, h) => (
          <BoothStage
            w={w}
            h={h}
            booth={booth}
            motion={motion}
            spec={{
              view: 'mixerLower',
              fit: (W, H) => ({ x: 0, y: plotH(H), w: W, h: H - plotH(H) }),
              highlight: { mixer: ['fader1', 'fader2', 'xfader', 'assign1', 'assign2', 'curve'] },
              callouts: [
                { id: 'f1', text: 'CH1', at: onMixer(STRIP_X[1] - 14, MIXER.fader.top + 30), dx: -26, dy: 0 },
                { id: 'f2', text: 'CH2', at: onMixer(STRIP_X[2] + 14, MIXER.fader.top + 30), dx: 26, dy: 0 },
                { id: 'as', text: 'A · THRU · B', at: onMixer(STRIP_X[1], MIXER.assign.y + 6), dx: -20, dy: 22 },
                { id: 'cv', text: 'CURVE', at: onMixer(MIXER.curve.x + 18, MIXER.curve.y), dx: 0, dy: -14 },
              ],
              screenOverlay: (W, H) => <CurvePlot b={{ x: 8, y: 6, w: W - 16, h: plotH(H) - 10 }} curve={m.xfCurve} x={m.xf} />,
              a11y: `The mixer’s faders, the crossfader and its assign and curve switches, under a plot of the ${m.xfCurve} crossfader curve.`,
            }}
          />
        ),
        bezel: [
          { k: 'CH1 → MIX', v: `${fdb(gA)} dB`, tint: colors.textPrimary },
          { k: 'CH2 → MIX', v: `${fdb(gB)} dB`, tint: '#8fbcff' },
          { k: 'CURVE', v: m.xfCurve, tint: colors.amber },
          peakCell('MIX BUS', peakDb(last, 'bus')),
        ],
        params: [
          {
            kind: 'fader',
            id: 'faders',
            label: 'FADERS',
            value: booth.ch[faderCh].fader,
            level: true,
            onChange: (v) => updateBooth((b: Booth) => ({ ...b, ch: { ...b.ch, [faderCh]: { ...b.ch[faderCh], fader: v } } })),
            format: (v) => `CH${faderCh} FADER ${pct(v)}`,
            formatShort: (v) => `${faderCh}·${pct(v)}`,
            chooser: {
              title: 'WHICH CHANNEL FADER',
              options: [
                { id: '1', label: 'CH1 (DECK A)' },
                { id: '2', label: 'CH2 (DECK B)' },
              ],
              selectedId: String(faderCh),
              onSelect: (id) => setFaderCh(Number(id) as ChannelId),
            },
          },
          xfaderKey(booth),
          {
            kind: 'group',
            id: 'setup',
            label: 'SETUP',
            valueLabel: m.xfCurve,
            render: () => (
              <SetupTray
                onDemo={() => {
                  void audio.requestSound();
                  setDemo(true);
                  updateBooth((b, t) => {
                    const a = b.decks.A;
                    return { ...b, decks: { A: { ...a, playing: true, at: t }, B: { ...a, playing: true, at: t } }, ch: { 1: { ...b.ch[1], fader: 0.85, xf: 'A' }, 2: { ...b.ch[2], fader: 0.85, xf: 'B' } }, mixer: { ...b.mixer, xfCurve: 'CUT', xf: 0.5 } };
                  });
                }}
              />
            ),
          },
          { kind: 'group', id: 'decks', label: 'DECKS', valueLabel: (['A', 'B'] as const).filter((d) => booth.decks[d].playing).join('+') || '—', render: () => <BoothTray booth={getBooth()} tr={tr} /> },
          stopKey(tr),
        ],
        initialParam: 'xf',
      }}
    >
      <Step n={1}>
        <P>Each channel fader sets how much of its channel goes into the mix. The crossfader then fades between the channels assigned to side A and side B; a channel on THRU ignores the crossfader.</P>
        <P>The CURVE decides how the two sides trade places. BLEND keeps the total steady through the middle (each side −3 dB there); DIP sags in the middle (each −6 dB); CUT keeps both full until the very ends, so a tiny move cuts a sound in or out.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open SETUP: put CH1 on A and CH2 on B. Open DECKS and play both. Then ride the X-FADER and watch the plot’s two curves and the readout strip.</Do>
      </Step>
      <Step n={3}>
        <P>Listen as the CROWD while you move across: on BLEND the level holds steady; switch to CUT and the middle gets louder, because both tracks are at full level together.</P>
        <P>Now the summing demonstration (SETUP → the same track on both decks, aligned). Two identical copies add up to TWICE the amplitude: +6.02 dB on the mix bus. Two different tracks at equal level add about +3 dB of average power instead — different conditions, different answers.</P>
        <Note>Those numbers are for these exact conditions. Real songs vary, so watch the mix bus meter rather than counting on a rule of thumb.</Note>
      </Step>
      <Step n={4}>
        <Do>Assign the sides, blend slowly from A to B on BLEND, cut to one side on CUT, then hear the +6 dB of two aligned copies.</Do>
        <P>A gradual curve suits long blends; a fast one suits cuts and scratching. Both are starting points — use your ears and the room.</P>
        <GoalChips goals={goals.slice(0, 4)} latched={latched.slice(0, 4)} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="Two different tracks play at the same level, both faders up, crossfader in the middle on CUT. Roughly how much louder is the mix than one track alone?"
          options={['About 3 dB louder on average', 'Exactly 6 dB louder', 'No louder — CUT keeps the level steady', 'Twice as loud to the ear (10 dB)']}
          correct={0}
          explain="Two unrelated signals of equal level add about 3 dB in average power. +6 dB happens only for two identical, aligned copies. CUT keeps both sides at full level in the middle, so the sum is louder there."
          wrong={[undefined, 'Only two identical, perfectly aligned copies add exactly +6 dB.', 'That is BLEND’s job; CUT keeps both sides at full level in the middle.', 'About 10 dB is roughly "twice as loud" to the ear — far more than two tracks add.']}
          onCorrect={() => setCheck(true)}
        />
        <FaultCard
          title="FADER UP, NOTHING IN THE PA"
          symptom="Deck B is playing with its channel fader all the way up, but the crowd cannot hear it."
          start={() => {
            void audio.requestSound();
            updateBooth((b, t) => ({ ...b, decks: { A: { ...b.decks.A, playing: true, at: t }, B: { ...b.decks.B, playing: true, at: t } }, ch: { 1: { ...b.ch[1], fader: 0, xf: 'A' }, 2: { ...b.ch[2], fader: 1, xf: 'A' } }, mixer: { ...b.mixer, xf: 1, xfCurve: 'CUT' }, perspective: 'CROWD' }));
          }}
          fixed={booth.decks.B.playing && faderGain(booth.ch[2].fader) * xfGainFor(booth.ch[2].xf, m.xf, m.xfCurve) > 0.25}
          hints={['The channel meter shows deck B is there — so where does it stop?', 'Look at channel 2’s crossfader assign, and where the crossfader is.', 'Channel 2 is on side A while the crossfader sits fully at B. Assign it to B (or THRU), or move the crossfader.']}
          why="Channel 2 was assigned to side A, and the crossfader was fully on side B, so its gain was zero however high its fader went. Check the assign switches before blaming the faders."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(4)} latched={latched.slice(4)} />
      </Step>
    </DjRack>
  );
}

const styles = StyleSheet.create({
  tray: { gap: 8 },
  head: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});

export const P08: PageDef = { title: 'Channel faders and crossfaders', short: 'FADERS', Component: PageFaders, manualDone: true, rack: true };

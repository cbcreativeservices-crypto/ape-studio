/**
 * Screen 7 — Headphone cue and booth monitoring (research DJ14): private
 * preview, cue selection, the cue/master blend, split cue, headphone level
 * and an independent booth level. The headphones on the stage light with
 * what each ear really carries (amber = cue, blue = master), from the same
 * render the phone plays. The phone has ONE output: the headphone feed is a
 * listening perspective, and split cue is heard as left/right inside it.
 */
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { Scene } from '../art/Scene';
import { MixerTop } from '../art/MixerTop';
import { Headphones, PowerSpeaker } from '../art/gear';
import { LedColumn } from '../art/parts';
import { useTapDb } from '../art/motion';
import { Group, LinearGradient, Rect, Skia, vec } from '@shopify/react-native-skia';
import { INK } from '../art/ink';
import { MIXER, STRIP_X, type Box } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { BoothTray, levelKey, stopKey } from '../dock';
import { getBooth, setPerspective, updateBooth } from '../booth/boothStore';
import { cueAtBar, useScreenSetup } from '../booth/setup';
import { dbStr, levelKnobGain, type Booth } from '../model/djModel';
import { peakCell, peakDb, useBoothKit } from './shared';

const TERMS = [
  { term: 'Headphone cue (PFL)', def: 'Pressing a channel’s CUE sends that channel to your headphones — taken BEFORE its fader, so you can hear it with the fader down and the crowd hearing nothing of it.' },
  { term: 'Cue / master blend', def: 'One knob that fades your headphones from the cue (left end) to the master mix (right end), so you can hear the next track against what the room hears.' },
  { term: 'Split cue', def: 'Cue in one ear, master in the other, each in mono. Some DJs like it for beatmatching; others prefer the blend.' },
  { term: 'Booth level', def: 'The booth monitors’ own level, separate from the MASTER that feeds the crowd. Turn the booth down and the room stays the same.' },
] as const;

/** The stage: a band cut from the mixer (its booth, headphone and CUE
 *  controls — local y 150 … 268), the headphones, a booth monitor, and the
 *  three outputs' meters (phones L, phones R, booth) from the render. */
const BAND_TOP = 150;
const BAND_H = 118;
const FRAME: Box = { x: -8, y: -8, w: 292, h: 286 };
const HP = { x: 4, y: 128, s: 0.56 };
const BM = { x: 168, y: 136, s: 0.3 };
const MET = { y: 140, h: 118, w: 8, l: 118, r: 136, booth: 262 };
const band = (y: number) => y - BAND_TOP;

function CueTray() {
  const b = getBooth();
  const flip = (k: 1 | 2) => updateBooth((x) => ({ ...x, ch: { ...x.ch, [k]: { ...x.ch[k], cue: !x.ch[k].cue } } }));
  return (
    <View style={styles.tray}>
      <Text style={styles.head}>HEADPHONE CUE (press one or both)</Text>
      <View style={styles.row}>
        <LabChip label={`CUE 1${b.ch[1].cue ? ' ●' : ''}`} selected={b.ch[1].cue} onPress={() => flip(1)} />
        <LabChip label={`CUE 2${b.ch[2].cue ? ' ●' : ''}`} selected={b.ch[2].cue} onPress={() => flip(2)} />
        <LabChip label={b.mixer.splitCue ? 'SPLIT: ON' : 'SPLIT: OFF'} selected={b.mixer.splitCue} onPress={() => updateBooth((x) => ({ ...x, mixer: { ...x.mixer, splitCue: !x.mixer.splitCue } }))} />
      </View>
      <Text style={styles.head}>LISTEN AS (the phone plays ONE of these)</Text>
      <View style={styles.row}>
        {(['PHONES', 'CROWD', 'BOOTH'] as const).map((p) => (
          <LabChip key={p} label={p} selected={b.perspective === p} onPress={() => setPerspective(p)} />
        ))}
      </View>
    </View>
  );
}

/** The phones L / R and booth meters, from the render's taps (one clock). */
function MeterCols() {
  const l = useTapDb('phonesL');
  const lh = useTapDb('phonesL', 'hold');
  const r = useTapDb('phonesR');
  const rh = useTapDb('phonesR', 'hold');
  const b = useTapDb('booth');
  const bh = useTapDb('booth', 'hold');
  return (
    <Group>
      <LedColumn x={MET.l} y={MET.y} w={MET.w} h={MET.h} level={l} hold={lh} />
      <LedColumn x={MET.r} y={MET.y} w={MET.w} h={MET.h} level={r} hold={rh} />
      <LedColumn x={MET.booth} y={MET.y} w={MET.w} h={MET.h} level={b} hold={bh} />
    </Group>
  );
}

function PageCue({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion } = useBoothKit();
  useScreenSetup((b) => {
    let x = cueAtBar(b, 'A', 'nightFerry', 17);
    x = cueAtBar(x, 'B', 'glassHarbour', 1);
    return { ...x, ch: { 1: { ...x.ch[1], fader: 0.85, xf: 'THRU', cue: false }, 2: { ...x.ch[2], fader: 0, xf: 'THRU', cue: false } }, mixer: { ...x.mixer, cueMix: 0, splitCue: false, booth: 0.6, master: 0.6, phones: 0.45 }, perspective: 'PHONES' };
  });
  const [phonesBand, setPhonesBand] = useState<'level' | 'mix'>('level');
  const start = useRef<{ booth: number; master: number } | null>(null);
  if (!start.current) start.current = { booth: 0.6, master: 0.6 };
  const [check, setCheck] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  const last = audio.last;
  const m = booth.mixer;
  const cueSig = !!last && last.rmsDb.cue > -55;
  const mstSig = !!last && last.rmsDb.bus > -55;
  const hearL = !!last && last.rmsDb.phonesL > -60;
  const hearR = !!last && last.rmsDb.phonesR > -60;
  const leftGlow = !hearL ? null : m.splitCue ? INK.amber : m.cueMix < 0.5 && cueSig ? INK.amber : INK.blue;
  const rightGlow = !hearR ? null : m.splitCue ? INK.blue : m.cueMix < 0.5 && cueSig ? INK.amber : INK.blue;
  const goals = [
    { label: 'Cue deck B, fader down', hit: booth.decks.B.playing && booth.ch[2].cue && booth.ch[2].fader <= 0.05 },
    { label: 'Hear it in your headphones', hit: booth.perspective === 'PHONES' && cueSig && booth.ch[2].fader <= 0.05 && (hearL || hearR) },
    { label: 'Split: cue left, master right', hit: m.splitCue && cueSig && mstSig && hearL && hearR },
    { label: 'Booth down, crowd unchanged', hit: m.booth <= start.current.booth - 0.15 && Math.abs(m.master - start.current.master) < 0.005 },
    { label: 'Fix the silent headphones', hit: faultFixed },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);
  const boothDb = dbStr(20 * Math.log10(Math.max(1e-6, levelKnobGain(m.booth))));
  return (
    <DjRack
      spec={{
        render: (w, h) => (
          <Scene
            w={w}
            h={h}
            frame={FRAME}
            motion={motion}
            a11y={`The mixer with its CUE buttons and headphone section, the headphones and a booth monitor. Left ear: ${leftGlow === INK.amber ? 'cue' : leftGlow ? 'master' : 'silent'}; right ear: ${rightGlow === INK.amber ? 'cue' : rightGlow ? 'master' : 'silent'}.`}
            callouts={[
              { id: 'bt', text: 'BOOTH LEVEL', at: { x: MIXER.booth.x + 10, y: band(MIXER.booth.y) }, dx: 10, dy: -4 },
              { id: 'mx', text: 'CUE ↔ MASTER', at: { x: MIXER.cueMix.x - 9, y: band(MIXER.cueMix.y) }, dx: -16, dy: -12 },
              { id: 'pl', text: 'PHONES LEVEL', at: { x: MIXER.phones.x + 9, y: band(MIXER.phones.y) }, dx: 12, dy: 6 },
              { id: 'sp', text: 'SPLIT', at: { x: MIXER.split.x + 14, y: band(MIXER.split.y + 9) }, dx: 0, dy: 14 },
              { id: 'c1', text: 'CUE 1', at: { x: STRIP_X[1], y: band(MIXER.cue.y + 6) }, dx: 0, dy: 14 },
              { id: 'c2', text: 'CUE 2', at: { x: STRIP_X[2], y: band(MIXER.cue.y + 6) }, dx: 0, dy: 14 },
              { id: 'l', text: leftGlow === INK.amber ? 'L: CUE' : leftGlow ? 'L: MASTER' : 'L: —', at: { x: HP.x + 36 * HP.s, y: HP.y + 188 * HP.s }, dx: 0, dy: 16, tone: leftGlow === INK.amber ? 'amber' : leftGlow ? 'blue' : 'plain' },
              { id: 'r', text: rightGlow === INK.amber ? 'R: CUE' : rightGlow ? 'R: MASTER' : 'R: —', at: { x: HP.x + 154 * HP.s, y: HP.y + 188 * HP.s }, dx: 0, dy: 36, tone: rightGlow === INK.amber ? 'amber' : rightGlow ? 'blue' : 'plain' },
              { id: 'pm', text: 'L · R', at: { x: (MET.l + MET.r + MET.w) / 2, y: MET.y + MET.h }, dx: 0, dy: 12, tone: 'plain' },
              { id: 'bm', text: `BOOTH ${boothDb}`, at: { x: BM.x + 135 * BM.s, y: MET.y + MET.h }, dx: 0, dy: 12, tone: 'plain' },
            ]}
          >
            <Group clip={Skia.RRectXY(Skia.XYWHRect(-4, 0, 278, BAND_H), 8, 8)}>
              <MixerTop x={0} y={-BAND_TOP} booth={booth} highlight={['cue1', 'cue2', 'cueMix', 'phones', 'split', 'booth']} />
              {/* the band continues above and below: soft fades say so */}
              <Rect x={-4} y={0} width={278} height={10}>
                <LinearGradient start={vec(0, 0)} end={vec(0, 10)} colors={['rgba(14,15,19,0.95)', 'rgba(14,15,19,0)']} />
              </Rect>
              <Rect x={-4} y={BAND_H - 10} width={278} height={10}>
                <LinearGradient start={vec(0, BAND_H - 10)} end={vec(0, BAND_H)} colors={['rgba(14,15,19,0)', 'rgba(14,15,19,0.95)']} />
              </Rect>
            </Group>
            <Headphones x={HP.x} y={HP.y} s={HP.s} leftGlow={leftGlow} rightGlow={rightGlow} />
            <PowerSpeaker x={BM.x} y={BM.y} s={BM.s} small on signal={!!last && last.rmsDb.booth > -70} />
            <MeterCols />
          </Scene>
        ),
        bezel: [peakCell('CUE BUS', peakDb(last, 'cue')), peakCell('PHONES L', peakDb(last, 'phonesL')), peakCell('PHONES R', peakDb(last, 'phonesR')), { k: 'LISTENING', v: booth.perspective, tint: colors.amber }],
        params: [
          { kind: 'group', id: 'cue', label: 'CUE', valueLabel: [booth.ch[1].cue ? '1' : '', booth.ch[2].cue ? '2' : ''].filter(Boolean).join('+') || '—', render: () => <CueTray /> },
          {
            kind: 'fader',
            id: 'phones',
            label: 'PHONES',
            value: phonesBand === 'level' ? m.phones : m.cueMix,
            level: phonesBand === 'level',
            home: phonesBand === 'mix' ? 0.5 : 0.75,
            onChange: (v) => updateBooth((b: Booth) => ({ ...b, mixer: { ...b.mixer, [phonesBand === 'level' ? 'phones' : 'cueMix']: v } })),
            format: (v) => (phonesBand === 'level' ? `PHONES LEVEL ${Math.round(v * 100)}%` : v < 0.03 ? 'CUE ↔ MASTER: all CUE' : v > 0.97 ? 'CUE ↔ MASTER: all MASTER' : `CUE ↔ MASTER ${Math.round((1 - v) * 100)} cue · ${Math.round(v * 100)} master`),
            formatShort: (v) => (phonesBand === 'level' ? `${Math.round(v * 100)}%` : v < 0.03 ? 'CUE' : v > 0.97 ? 'MST' : `${Math.round(v * 100)}%`),
            chooser: {
              title: 'HEADPHONE CONTROL',
              options: [
                { id: 'level', label: 'LEVEL', blurb: 'How loud the headphones are. Start low and bring it up slowly.' },
                { id: 'mix', label: 'CUE ↔ MASTER', blurb: 'Left = only the cued channel; right = only the master mix; between = both.' },
              ],
              selectedId: phonesBand,
              onSelect: (id) => setPhonesBand(id as 'level' | 'mix'),
            },
          },
          levelKey(booth, 'booth', 'BOOTH'),
          { kind: 'group', id: 'decks', label: 'DECKS', valueLabel: (['A', 'B'] as const).filter((d) => booth.decks[d].playing).join('+') || '—', render: () => <BoothTray booth={getBooth()} tr={tr} /> },
          stopKey(tr),
        ],
        initialParam: 'cue',
      }}
    >
      <Step n={1}>
        <P>The crowd hears the MASTER. You hear the next track first, privately, in your headphones: press that channel’s CUE. The cue is taken before the channel fader, so the fader can stay down — the crowd hears nothing of it.</P>
        <P>A phone has one headphone output, so here you switch what it plays: PHONES is your headphones, CROWD is the PA, BOOTH is the booth monitors. Split cue is shown as left and right inside the headphone feed — this lab cannot give you a separate cue output.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open DECKS and play both. Open CUE and press CUE 2 — deck B is now in your headphones while its fader stays down.</Do>
        <P>Watch the headphones on the stage: each cup lights amber for cue and blue for master, from what that ear really carries.</P>
      </Step>
      <Step n={3}>
        <P>Ride PHONES → CUE ↔ MASTER from CUE to MASTER and back. Then turn SPLIT on: deck B in your left ear, the room’s mix in your right, each in mono. Some DJs love split cue; others prefer the blend. Experimentation is encouraged.</P>
        <Note tone="safety">Headphones are the loudest thing in a DJ’s day. Start PHONES low, bring it up slowly, and lift one cup off when you can. Turning the headphones up to beat a loud booth is how ears get hurt — turn the BOOTH down instead.</Note>
      </Step>
      <Step n={4}>
        <Do>Prepare deck B privately (cued, fader down), hear it in PHONES, try split cue, and lower the BOOTH without touching MASTER — the crowd hears no change.</Do>
        <GoalChips goals={goals.slice(0, 4)} latched={latched.slice(0, 4)} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="The booth monitors are far too loud for you, but the room sounds right. Which control do you turn down?"
          options={['BOOTH — it feeds only the booth monitors', 'MASTER — it is the main level', 'The channel faders', 'PHONES']}
          correct={0}
          explain="BOOTH sets the booth monitors alone. MASTER feeds the crowd, so turning it down would change the room. The channel faders change the mix itself, and PHONES only changes your headphones."
          wrong={[undefined, 'MASTER changes what the crowd hears — exactly what you wanted to keep.', 'The faders change the mix for everyone, not just the booth.', 'PHONES only sets your headphones.']}
          onCorrect={() => setCheck(true)}
        />
        <FaultCard
          title="NOTHING IN THE HEADPHONES"
          symptom="Both decks are playing and the crowd hears the mix, but your headphones are silent."
          start={() => {
            void audio.requestSound();
            updateBooth((b, t) => ({
              ...b,
              decks: { A: { ...b.decks.A, playing: true, at: t }, B: { ...b.decks.B, playing: true, at: t } },
              ch: { 1: { ...b.ch[1], cue: false, fader: 0.85 }, 2: { ...b.ch[2], cue: false, fader: 0 } },
              mixer: { ...b.mixer, cueMix: 0, splitCue: false, phones: 0.45 },
              perspective: 'PHONES',
              listen: b.listen,
            }));
          }}
          fixed={booth.decks.A.playing && booth.decks.B.playing && booth.perspective === 'PHONES' && !!last && Math.max(last.rmsDb.phonesL, last.rmsDb.phonesR) > -60}
          hints={['Check the headphone bus on its own: which channel is cued?', 'The blend is all the way to CUE, and no channel is cued — so the cue bus is empty.', 'Press CUE on the deck you want to hear (or move the blend toward MASTER).']}
          why="The headphones were set to hear ONLY the cue, and nothing was cued. The headphone feed is its own bus: check what it is fed from, separately from what the crowd hears."
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

export const P07: PageDef = { title: 'Headphone cue and booth monitoring', short: 'CUE', Component: PageCue, manualDone: true, rack: true };

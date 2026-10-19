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
import { Scene, textWidthPt } from '../art/Scene';
import { METER_SCALE, MIXER_PARTS, MixerTop, mixerLegendBoxes, mixerPartBox } from '../art/MixerTop';
import { Headphones, IsolationPad, PHONES_CORD_EXIT, PhonesCord, PowerSpeaker, SEATED_PLUG_LEN, SeatedJackPlugTop, curveSamples, type P2 } from '../art/gear';
import { LED_DB, LedColumn } from '../art/parts';
import { useTapDb } from '../art/motion';
import { SceneText, useLabelMm } from '../art/sceneText';
import { BlurMask, Circle, DashPathEffect, Group, Line, LinearGradient, Rect, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { INK } from '../art/ink';
import { MIXER, MIXER_D, MIXER_W, STRIP_X, fitView, type Box } from '../geometry/boothGeometry';
import { MONITOR_H, MONITOR_W } from '../geometry/gearGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { decksValue, levelKey, stopKey, type Transport } from '../dock';
import { getBooth, setPerspective, updateBooth } from '../booth/boothStore';
import { cueAtBar, useScreenSetup } from '../booth/setup';
import { dbStr, levelKnobGain, type Booth } from '../model/djModel';
import { peakDb, peakShort, useBoothKit } from './shared';

const TERMS = [
  { term: 'Headphone cue (PFL)', def: 'Pressing a channel’s CUE sends that channel to your headphones — taken BEFORE its fader (on this mixer after trim, EQ and filter; real mixers vary), so you can hear it with the fader down and the crowd hearing nothing of it.' },
  { term: 'Cue / master blend', def: 'One knob that fades your headphones from the cue (left end) to the master mix (right end), so you can hear the next track against what the room hears.' },
  { term: 'Split cue', def: 'Cue in one ear, master in the other, each in mono. Some DJs like it for beatmatching; others prefer the blend.' },
  { term: 'Booth level', def: 'The booth monitors’ own level, separate from the MASTER that feeds the crowd. Turn the booth down and the room stays the same.' },
] as const;

/**
 * The stage (grade 2026-10-19: one true scale, nothing floating):
 *
 *   MIXER + HEADPHONES, TO SCALE (1 unit = 1 mm) — a band cut from the
 *   mixer between its knob rows (local y 145 … 257: master / booth, the cue
 *   blend and phones level, split, the CUE keys), then its front edge (local
 *   374 … 394) with the PHONES jack. The headphones (200 mm wide, as you wear
 *   them) lie on the desk in front, their coiled cord running into that jack
 *   with the plug seated.
 *   OUTPUT METERS — a housed meter bridge: phones L · R, booth, crowd, with
 *   the dB scale of Screen 6 (−24 · −12 · −6 · −2 · CLIP).
 *   BOOTH MONITOR, HALF SCALE — in its own bordered inset, standing on a
 *   foam pad on the booth shelf.
 */
const BAND_TOP = 145;
const BAND_H = 112;
const LIP_TOP = 374;
const LIP_H = 20;
const LIP_Y = 124; // where the front edge sits on the stage
const lipDy = LIP_Y - LIP_TOP; // local mixer y → stage y, for the front edge
const band = (y: number) => y - BAND_TOP;
const JACK = { x: MIXER.front.phones635, y: MIXER_D - 4 + lipDy }; // the plug's collar on the jack's nut
const HP = { x: 52, y: 128 };
const cupX = (side: 'L' | 'R') => HP.x + (side === 'L' ? 46 : 154);
const CUP_BOTTOM = HP.y + 209;
/** The cord on the desk: out of the plug's boot, round the left of the
 *  headphones, into the left cup's base — never across a label or a cup. */
const CORD: P2[] = [
  [JACK.x, JACK.y + SEATED_PLUG_LEN],
  [JACK.x - 3, JACK.y + SEATED_PLUG_LEN + 12],
  [JACK.x - 30, JACK.y + 62],
  [16, 234],
  [10, 282],
  [18, CUP_BOTTOM - 16],
  [40, CUP_BOTTOM + 6],
  [68, CUP_BOTTOM + 12],
  [88, CUP_BOTTOM + 10],
  [HP.x + PHONES_CORD_EXIT.x - 1, CUP_BOTTOM + 5],
  [HP.x + PHONES_CORD_EXIT.x, HP.y + PHONES_CORD_EXIT.y + 6],
];
const CORD_COIL: [number, number] = [60, 236];
/** The meter bridge and the monitor inset (right column). */
const MB = { x: 294, y: 0, w: 184, h: 134, colY: 28, colH: 84, colW: 10, xs: [340, 356, 404, 452] as const };
const INSET = { x: 294, y: 144, w: 184, h: 262 };
const MON_S = 0.5;
const MON = { x: INSET.x + (INSET.w - MONITOR_W * MON_S) / 2, y: INSET.y + 34 };
const PAD = { x: MON.x - 4, y: MON.y + MONITOR_H * MON_S, w: MONITOR_W * MON_S + 8, h: 10 };
const SHELF_Y = PAD.y + PAD.h;
const FRAME: Box = { x: -16, y: -22, w: 500, h: INSET.y + INSET.h + 4 + 22 };
/** The scale caption's baseline: under the headphones, at the stage's foot. */
const CAPTION_Y = INSET.y + INSET.h - 2;
const segY = (db: number) => MB.colY + MB.colH - ((LED_DB as readonly number[]).indexOf(db) + 0.5) * (MB.colH / LED_DB.length);

/** Label obstacles: every control of the band and the front edge, the plug,
 *  the cord, the headphones, the meter bridge and the monitor inset. The
 *  PRINTED legends go to the Scene separately: they block a callout only
 *  once a zoom makes them legible. */
const inBand = (b: Box) => b.y + b.h > BAND_TOP && b.y < BAND_TOP + BAND_H;
const inLip = (b: Box) => b.y + b.h > LIP_TOP && b.y < LIP_TOP + LIP_H;
const PARTS = MIXER_PARTS.map((p) => mixerPartBox(p));
const OBST: Box[] = [
  ...PARTS.filter(inBand).map((b) => ({ ...b, y: b.y - BAND_TOP })),
  ...PARTS.filter(inLip).map((b) => ({ ...b, y: b.y + lipDy })),
  { x: JACK.x - 6, y: JACK.y, w: 12, h: SEATED_PLUG_LEN },
  ...curveSamples(CORD, 12).map((p) => ({ x: p.x - 7, y: p.y - 7, w: 14, h: 14 })),
  { x: HP.x + 6, y: HP.y + 106, w: 82, h: 108 },
  { x: HP.x + 112, y: HP.y + 106, w: 82, h: 108 },
  { x: HP.x + 22, y: HP.y + 16, w: 156, h: 92 },
  { x: MB.x, y: MB.y, w: MB.w, h: MB.h },
  { x: INSET.x, y: INSET.y, w: INSET.w, h: INSET.h },
];
/** The obstacles with the scale caption sized from its real type (cached
 *  per size, so the label layout is not redone on every render). */
const obstCache = new Map<string, Box[]>();
function obstaclesFor(fs: number, compact: boolean): Box[] {
  const key = `${compact ? 1 : 0}:${Math.round(fs * 2)}`;
  let o = obstCache.get(key);
  if (!o) {
    o = [...OBST, captionBox(fs, compact)];
    if (obstCache.size > 24) obstCache.clear();
    obstCache.set(key, o);
  }
  return o;
}
const LEGENDS = mixerLegendBoxes();
const PRINTED = [...LEGENDS.filter(inBand).map((b) => ({ ...b, y: b.y - BAND_TOP })), ...LEGENDS.filter(inLip).map((b) => ({ ...b, y: b.y + lipDy }))];

const LOOK = 'You are looking at part of the mixer — its booth, headphone and CUE controls — and its front edge, with your headphones (as you wear them) plugged into the PHONES jack, both drawn to scale; the output meters for your headphones’ left and right, the booth and the crowd; and a booth monitor on its pad, drawn at half scale.';

export const GOALS_CUE = ['Cue deck B, fader down', 'Hear it in your headphones', 'CH2 up: crowd hears B; down: only you', 'Split: cue left, master right', 'Booth 6 dB quieter, crowd unchanged', 'Fix the silent headphones', 'Pass the check'] as const;

const gainDb = (g: number) => 20 * Math.log10(Math.max(1e-6, g));
/** What one ear carries, in words, and its label tone (amber cue, blue master). */
const earWord = (side: 'L' | 'R', glow: string | null) => `${side}: ${glow === INK.amber ? 'CUE' : glow ? 'MASTER' : '—'}`;
const earTone = (glow: string | null): 'amber' | 'blue' | 'plain' => (glow === INK.amber ? 'amber' : glow ? 'blue' : 'plain');

function CueTray({ tr }: { tr: Transport }) {
  const b = getBooth();
  const flip = (k: 1 | 2) => updateBooth((x) => ({ ...x, ch: { ...x.ch, [k]: { ...x.ch[k], cue: !x.ch[k].cue } } }));
  const f2 = (v: number) => updateBooth((x) => ({ ...x, ch: { ...x.ch, 2: { ...x.ch[2], fader: v } } }));
  return (
    <View style={styles.tray}>
      <View style={styles.row}>
        {(['A', 'B'] as const).map((d) => (
          <LabChip key={d} label={`${b.decks[d].playing ? '❚❚ PAUSE' : '▶ PLAY'} ${d}`} selected={b.decks[d].playing} onPress={() => tr.toggle(d)} />
        ))}
        {tr.soundDeclined ? <LabChip label="TURN SOUND ON" selected={false} onPress={tr.soundOn} /> : null}
      </View>
      <Text style={styles.head}>HEADPHONE CUE (press one or both)</Text>
      <View style={styles.row}>
        <LabChip label={`CUE 1${b.ch[1].cue ? ' ●' : ''}`} selected={b.ch[1].cue} onPress={() => flip(1)} />
        <LabChip label={`CUE 2${b.ch[2].cue ? ' ●' : ''}`} selected={b.ch[2].cue} onPress={() => flip(2)} />
        <LabChip label={b.mixer.splitCue ? 'SPLIT: ON' : 'SPLIT: OFF'} selected={b.mixer.splitCue} onPress={() => updateBooth((x) => ({ ...x, mixer: { ...x.mixer, splitCue: !x.mixer.splitCue } }))} />
      </View>
      <Text style={styles.head}>{`CH2 FADER → ${Math.round(b.ch[2].fader * 100)}% (deck B into the mix)`}</Text>
      <View style={styles.row}>
        <LabChip label="DOWN" selected={b.ch[2].fader <= 0.02} onPress={() => f2(0)} compact />
        <LabChip label="UP 85%" selected={Math.abs(b.ch[2].fader - 0.85) < 0.02} onPress={() => f2(0.85)} compact />
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

/** Is the stage shown so small (the display shortened while the contents
 *  list is open) that its printed names cannot fit at 9 pt? Then it shows a
 *  COMPACT level of detail: the meter names become callouts, the dB scale
 *  keeps the marks that fit, the captions shorten (grade 2026-10-19 #14). */
const COMPACT_FS = 14; // mm: the largest 9.5 pt type the meter headers fit
const mmPerPt = (s: number) => 9.5 / Math.max(1e-6, s);
/** The dB marks whose 9.5 pt numbers fit their spacing and the panel. */
function marksFor(fs: number) {
  const pitch = MB.colH / LED_DB.length;
  const room = MB.xs[0] - 8 - MB.x - 3;
  const fits = (gapSegs: number) => fs * 0.95 <= gapSegs * pitch && (textWidthPt('CLIP') / 10) * fs <= room;
  if (fits(2)) return METER_SCALE;
  if (fits(3)) return METER_SCALE.filter((m) => m.db === -24 || m.db === -12 || m.db === 0);
  return [];
}

/** The output meter bridge: a housed panel with the phones L / R, booth and
 *  crowd columns from the render's taps (one clock), their names on top and
 *  Screen 6's dB scale beside them — text always ≥ 9 pt (useLabelMm). */
function MeterBridge({ compact }: { compact: boolean }) {
  const l = useTapDb('phonesL');
  const lh = useTapDb('phonesL', 'hold');
  const r = useTapDb('phonesR');
  const rh = useTapDb('phonesR', 'hold');
  const b = useTapDb('booth');
  const bh = useTapDb('booth', 'hold');
  const c = useTapDb('crowd');
  const ch = useTapDb('crowd', 'hold');
  const fs = useLabelMm(9.5);
  const { x, y, w, h, colY, colH, colW, xs } = MB;
  const cols = [
    { lv: l, hd: lh },
    { lv: r, hd: rh },
    { lv: b, hd: bh },
    { lv: c, hd: ch },
  ];
  const headY = y + Math.min(colY - 6, 8 + fs * 0.8);
  return (
    <Group>
      <RoundedRect x={x + 3} y={y + 5} width={w} height={h} r={8} color="rgba(0,0,0,0.6)">
        <BlurMask blur={5} style="normal" />
      </RoundedRect>
      <RoundedRect x={x} y={y} width={w} height={h} r={8}>
        <LinearGradient start={vec(x, y)} end={vec(x, y + h)} colors={['#2a2c31', '#16171a']} />
      </RoundedRect>
      <RoundedRect x={x + 0.6} y={y + 0.6} width={w - 1.2} height={h - 1.2} r={7.5} style="stroke" strokeWidth={1.2} color={INK.bevel} />
      {[[x + 8, y + 8], [x + w - 8, y + 8], [x + 8, y + h - 8], [x + w - 8, y + h - 8]].map(([sx, sy]) => (
        <Circle key={`${sx}-${sy}`} cx={sx} cy={sy} r={2.4} color="#5c626b" />
      ))}
      {cols.map((cc, i) => (
        <LedColumn key={i} x={xs[i]} y={colY} w={colW} h={colH} level={cc.lv} hold={cc.hd} />
      ))}
      {/* the scale's ticks always; its numbers where they fit */}
      {METER_SCALE.map((m) => (
        <Line key={m.t} p1={vec(xs[0] - 6, segY(m.db))} p2={vec(xs[0] - 2, segY(m.db))} color={INK.print} strokeWidth={1} />
      ))}
      {marksFor(fs).map((m) => (
        <SceneText key={m.t} x={xs[0] - 8} y={segY(m.db) + fs * 0.36} size={fs} text={m.db === 0 ? 'CLIP' : m.t} color={m.db === 0 ? INK.peak : INK.print} face="label" align="right" minPt={9} />
      ))}
      {compact ? null : (
        <Group>
          <SceneText x={(xs[0] + xs[1] + colW) / 2} y={headY} size={fs} text="PHONES" color={INK.amber} face="label" align="center" minPt={9} />
          <SceneText x={xs[2] + colW / 2} y={headY} size={fs} text="BOOTH" color={INK.amber} face="label" align="center" minPt={9} />
          <SceneText x={xs[3] + colW / 2} y={headY} size={fs} text="CROWD" color={INK.amber} face="label" align="center" minPt={9} />
          <SceneText x={xs[0] + colW / 2} y={colY + colH + 4 + fs * 0.8} size={fs} text="L" color={INK.print} face="label" align="center" minPt={9} />
          <SceneText x={xs[1] + colW / 2} y={colY + colH + 4 + fs * 0.8} size={fs} text="R" color={INK.print} face="label" align="center" minPt={9} />
        </Group>
      )}
    </Group>
  );
}

/** The scale captions: the mixer and headphones are one true scale; the
 *  monitor's inset says its own. */
const CAPTION = { full: ['MIXER + HEADPHONES', 'TO SCALE'], compact: ['TO SCALE'] } as const;
const INSET_CAPTION = { full: ['BOOTH MONITOR', 'HALF SCALE'], compact: ['HALF SCALE'] } as const;
/** The main caption's box (stage mm) at type size `fs` mm — a label obstacle
 *  sized from the real type, so a small stage never hides it under a label. */
/** A small stage has wide free margins either side (the display is far
 *  wider than the stage): there the short caption stands left of the mixer's
 *  front edge, clear of the headphones' labels. */
const COMPACT_CAPTION = { x: -22, y: LIP_Y + 12 };
function captionBox(fs: number, compact: boolean): Box {
  const lines = compact ? CAPTION.compact : CAPTION.full;
  const w = Math.max(...lines.map((t) => (textWidthPt(t) / 10) * fs));
  if (compact) return { x: COMPACT_CAPTION.x - w - 2, y: COMPACT_CAPTION.y - fs * 0.85, w: w + 3, h: fs * 1.1 };
  return { x: -15, y: CAPTION_Y - fs * (1.05 * (lines.length - 1) + 0.85), w: w + 3, h: fs * (1.05 * (lines.length - 1) + 1.1) };
}
function ScaleCaptions({ compact }: { compact: boolean }) {
  const fs = useLabelMm(9.5);
  const main = compact ? CAPTION.compact : CAPTION.full;
  const inset = compact ? INSET_CAPTION.compact : INSET_CAPTION.full;
  return (
    <Group>
      {compact ? (
        <SceneText x={COMPACT_CAPTION.x} y={COMPACT_CAPTION.y} size={fs} text={main[0]} color={INK.printDim} face="label" align="right" minPt={9} />
      ) : (
        main.map((t, i) => <SceneText key={t} x={-14} y={CAPTION_Y - fs * 1.05 * (main.length - 1 - i)} size={fs} text={t} color={INK.printDim} face="label" minPt={9} />)
      )}
      {inset.map((t, i) => (
        <SceneText key={t} x={INSET.x + 8} y={INSET.y + 6 + fs * (0.9 + i)} size={fs} text={t} color={INK.printDim} face="label" minPt={9} />
      ))}
    </Group>
  );
}

/** The monitor's inset: a bordered panel, the booth shelf, the foam pad and
 *  the monitor standing on it. */
function MonitorInset({ on, signal }: { on: boolean; signal: boolean }) {
  return (
    <Group>
      <RoundedRect x={INSET.x} y={INSET.y} width={INSET.w} height={INSET.h} r={8} color="rgba(255,255,255,0.025)" />
      <RoundedRect x={INSET.x} y={INSET.y} width={INSET.w} height={INSET.h} r={8} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.22)">
        <DashPathEffect intervals={[5, 4]} />
      </RoundedRect>
      <Rect x={INSET.x + 6} y={SHELF_Y} width={INSET.w - 12} height={INSET.y + INSET.h - SHELF_Y - 4}>
        <LinearGradient start={vec(0, SHELF_Y)} end={vec(0, INSET.y + INSET.h)} colors={['#3a3530', '#1e1b18']} />
      </Rect>
      <Line p1={vec(INSET.x + 6, SHELF_Y + 0.5)} p2={vec(INSET.x + INSET.w - 6, SHELF_Y + 0.5)} color="rgba(255,255,255,0.18)" strokeWidth={0.8} />
      <IsolationPad x={PAD.x} y={PAD.y} w={PAD.w} h={PAD.h} />
      <PowerSpeaker x={MON.x} y={MON.y} s={MON_S} small on={on} signal={signal} />
    </Group>
  );
}

/** The mixer as the stage shows it: the band of controls, a clean break, and
 *  its front edge with the headphone jack and the plug seated in it. */
function MixerCut({ booth }: { booth: Booth }) {
  return (
    <Group>
      <Group clip={Skia.XYWHRect(-6, 0, 286, BAND_H)}>
        <MixerTop x={0} y={-BAND_TOP} booth={booth} highlight={['cue1', 'cue2', 'cueMix', 'phones', 'split', 'booth']} />
        {/* the mixer continues above and below: soft fades say so */}
        <Rect x={-6} y={0} width={286} height={8}>
          <LinearGradient start={vec(0, 0)} end={vec(0, 8)} colors={['rgba(14,15,19,0.9)', 'rgba(14,15,19,0)']} />
        </Rect>
        <Rect x={-6} y={BAND_H - 8} width={286} height={8}>
          <LinearGradient start={vec(0, BAND_H - 8)} end={vec(0, BAND_H)} colors={['rgba(14,15,19,0)', 'rgba(14,15,19,0.9)']} />
        </Rect>
      </Group>
      {/* the break: the body's two sides carry on, dashed, to the front edge */}
      {[0.6, MIXER_W - 0.6].map((sx) => (
        <Line key={sx} p1={vec(sx, BAND_H + 2)} p2={vec(sx, LIP_Y - 2)} color="rgba(255,255,255,0.28)" strokeWidth={1}>
          <DashPathEffect intervals={[3, 3]} />
        </Line>
      ))}
      <Group clip={Skia.XYWHRect(-6, LIP_Y, 286, LIP_H + 10)}>
        <MixerTop x={0} y={lipDy} booth={booth} />
        <Rect x={-6} y={LIP_Y} width={286} height={5}>
          <LinearGradient start={vec(0, LIP_Y)} end={vec(0, LIP_Y + 5)} colors={['rgba(14,15,19,0.9)', 'rgba(14,15,19,0)']} />
        </Rect>
      </Group>
      <SeatedJackPlugTop x={JACK.x} y={JACK.y} />
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
  const start = useRef<{ booth: number; master: number } | null>(null);
  if (!start.current) start.current = { booth: 0.6, master: 0.6 };
  // CH2 up (the crowd hears B), then back down (only you do)
  const upDown = useRef({ up: false, down: false });
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
  const crowdB = !!last && booth.decks.B.playing && booth.ch[2].fader > 0.5 && last.rmsDb.crowd > -60;
  if (crowdB && booth.ch[2].cue) upDown.current.up = true;
  if (upDown.current.up && booth.decks.B.playing && booth.ch[2].fader <= 0.02 && booth.ch[2].cue && cueSig) upDown.current.down = true;
  const boothDown = gainDb(levelKnobGain(start.current.booth)) - gainDb(levelKnobGain(m.booth));
  const hits = [
    booth.decks.B.playing && booth.ch[2].cue && booth.ch[2].fader <= 0.05,
    booth.perspective === 'PHONES' && cueSig && booth.ch[2].fader <= 0.05 && (hearL || hearR),
    upDown.current.down,
    m.splitCue && cueSig && mstSig && hearL && hearR,
    boothDown >= 5.5 && boothDown <= 7 && Math.abs(m.master - start.current.master) < 0.005,
    faultFixed,
    check,
  ];
  const goals = GOALS_CUE.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'CUE');
  const boothDb = dbStr(gainDb(levelKnobGain(m.booth)));
  return (
    <DjRack
      spec={{
        render: (w, h) => {
          const fs0 = mmPerPt(fitView(FRAME, w, h, 6).s);
          const compact = fs0 > COMPACT_FS;
          return (
          <Scene
            w={w}
            h={h}
            frame={FRAME}
            motion={motion}
            a11y={`${LOOK} Left ear: ${leftGlow === INK.amber ? 'cue' : leftGlow ? 'master' : 'silent'}; right ear: ${rightGlow === INK.amber ? 'cue' : rightGlow ? 'master' : 'silent'}.`}
            obstacles={obstaclesFor(fs0, compact)}
            printed={PRINTED}
            // FULL SCREEN zoom opens on the mixer's headphone section, where
            // the printed legends become legible
            focus={{ x: 96, y: 10, w: 80, h: 92 }}
            callouts={[
              // L on the left and R on the right, as you wear them: each
              // under its own cup, so their leaders never cross
              // (on a small stage both ears share ONE label under the gap
              // between the cups, read left to right)
              ...(compact
                ? [{ id: 'lr', text: `${earWord('L', leftGlow)} · ${earWord('R', rightGlow)}`, at: { x: HP.x + 100, y: CUP_BOTTOM - 30 }, dx: 0, dy: 34, tone: 'plain' as const }]
                : [
                    { id: 'l', text: earWord('L', leftGlow), at: { x: cupX('L') + 12, y: CUP_BOTTOM - 8 }, dx: 0, dy: 26, tone: earTone(leftGlow) },
                    { id: 'r', text: earWord('R', rightGlow), at: { x: cupX('R') - 12, y: CUP_BOTTOM - 8 }, dx: 0, dy: 26, tone: earTone(rightGlow) },
                  ]),
              // the band's controls by the dock's own key names. BOOTH first
              // (its anchor on the knob's right shoulder, so its leader rises
              // clear of the printed BOOTH legend at any zoom); CUE 1 / CUE 2
              // beside their keys, outboard; SPLIT beside its switch
              { id: 'bt', text: `BOOTH ${boothDb}`, at: { x: MIXER.booth.x + 9, y: band(MIXER.booth.y) - 5 }, dx: 16, dy: -24 },
              { id: 'c1', text: 'CUE 1', at: { x: STRIP_X[1] - MIXER.cue.w / 2, y: band(MIXER.cue.y) }, dx: -6, dy: 0 },
              { id: 'c2', text: 'CUE 2', at: { x: STRIP_X[2] + MIXER.cue.w / 2, y: band(MIXER.cue.y) }, dx: 6, dy: 0 },
              ...(compact
                ? []
                : [
                    { id: 'sp', text: 'SPLIT', at: { x: MIXER.split.x + MIXER.split.w, y: band(MIXER.split.y + MIXER.split.h / 2) }, dx: 6, dy: 0 },
                    { id: 'mx', text: 'BLEND', at: { x: MIXER.cueMix.x - 7, y: band(MIXER.cueMix.y) }, dx: -16, dy: 0 },
                    { id: 'pl', text: 'PHONES', at: { x: MIXER.phones.x + 7, y: band(MIXER.phones.y) }, dx: 16, dy: 0 },
                  ]),
              ...(compact
                ? // a small stage: only the essentials, and the meters named
                  // by one callout instead of print
                  [{ id: 'mt', text: 'METERS: PHONES, BOOTH, CROWD', at: { x: MB.x + MB.w - 4, y: MB.y + 12 }, dx: 10, dy: -4, tone: 'plain' as const }]
                : [{ id: 'po', text: 'PHONES OUT', at: { x: JACK.x + 5, y: JACK.y + 12 }, dx: 26, dy: 4 }]),
            ]}
          >
            <ScaleCaptions compact={compact} />
            <MixerCut booth={booth} />
            <PhonesCord pts={CORD} coil={CORD_COIL} />
            <Headphones x={HP.x} y={HP.y} leftGlow={leftGlow} rightGlow={rightGlow} cord={false} />
            <MeterBridge compact={compact} />
            <MonitorInset on signal={!!last && last.rmsDb.booth > -70} />
          </Scene>
          );
        },
        bezel: [peakShort('CUE BUS', peakDb(last, 'cue')), peakShort('PHONES L', peakDb(last, 'phonesL')), peakShort('PHONES R', peakDb(last, 'phonesR')), { k: 'LISTENING', v: booth.perspective, tint: colors.amber }],
        params: [
          { kind: 'group', id: 'cue', label: 'CUE', valueLabel: [booth.ch[1].cue ? '1' : '', booth.ch[2].cue ? '2' : ''].filter(Boolean).join('+') || 'NONE', valueA11y: `cued: ${[booth.ch[1].cue ? 'channel 1' : '', booth.ch[2].cue ? 'channel 2' : ''].filter(Boolean).join(' and ') || 'nothing'}; decks ${decksValue(booth).toLowerCase()}`, render: () => <CueTray tr={tr} /> },
          // the two headphone controls, each on its own key (learning p07 #3):
          // PHONES = the level, BLEND = cue ↔ master
          {
            kind: 'fader',
            id: 'phones',
            label: 'PHONES',
            value: m.phones,
            level: true,
            home: 0.75,
            onChange: (v) => updateBooth((b: Booth) => ({ ...b, mixer: { ...b.mixer, phones: v } })),
            format: (v) => `PHONES LEVEL ${Math.round(v * 100)}% · ${dbStr(gainDb(levelKnobGain(v)))}`,
            formatShort: (v) => `${Math.round(v * 100)}%`,
          },
          {
            kind: 'fader',
            id: 'cueMix',
            label: 'BLEND',
            value: m.cueMix,
            home: 0.5,
            onChange: (v) => updateBooth((b: Booth) => ({ ...b, mixer: { ...b.mixer, cueMix: v } })),
            format: (v) => (v < 0.03 ? 'CUE ↔ MASTER: all CUE' : v > 0.97 ? 'CUE ↔ MASTER: all MASTER' : `CUE ↔ MASTER ${Math.round((1 - v) * 100)} cue · ${Math.round(v * 100)} master`),
            formatShort: (v) => (v < 0.03 ? 'CUE' : v > 0.97 ? 'MST' : `${Math.round(v * 100)}%`),
          },
          levelKey(booth, 'booth', 'BOOTH'),
          stopKey(tr),
        ],
        initialParam: 'cue',
      }}
    >
      <Step n={1}>
        <Look>{LOOK}</Look>
        <P>The crowd hears the MASTER; you hear the next track first, privately, by pressing that channel’s CUE, which is taken before the channel fader — so the fader stays down and the crowd hears nothing of it.</P>
        <P>A phone has one headphone output, so here you switch what it plays (PHONES, CROWD or BOOTH), and split cue is heard as left and right inside the headphone feed.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open CUE and play both decks. Press CUE 2 — deck B is now in your headphones while its fader stays down.</Do>
        <P>Watch the headphones on the stage: each cup lights amber for cue and blue for master, from what that ear really carries.</P>
        <P>Still in CUE: bring the CH2 FADER UP — the CROWD meter jumps, the room hears B. Back DOWN: only your headphones carry B. That is what “before the fader” means.</P>
      </Step>
      <Step n={3}>
        <P>Ride BLEND (the cue ↔ master knob) from CUE to MASTER and back. Then turn SPLIT on: deck B in your left ear, the room’s mix in your right, each in mono. Some DJs love split cue; others prefer the blend — a suggested starting point, not a rule.</P>
        <Note>In a big room the PA reaches you late — about 3 ms for every metre. Match the next track against your headphones and the booth monitors, never against the sound coming back off the floor.</Note>
        <Note tone="safety">Headphones are the loudest thing in a DJ’s day. Start PHONES low, bring it up slowly, and lift one cup off when you can. Turning the headphones up to beat a loud booth is how ears get hurt — turn the BOOTH down instead.</Note>
      </Step>
      <Step n={4}>
        <Do>Prepare deck B privately (cued, fader down), hear it as PHONES, bring CH2 up and back down, try split cue, and make the booth 6 dB quieter without touching MASTER — read BOOTH on the drawing; the crowd hears no change.</Do>
        <GoalChips goals={goals.slice(0, 5)} latched={latched.slice(0, 5)} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="Deck B is cued and you can hear it in your headphones. Its channel fader is all the way down. What does the crowd hear of deck B?"
          options={['Nothing — the cue is taken before the fader', 'All of it — CUE sends a channel to the PA', 'Half of it, until the fader comes up', 'Only its bass']}
          correct={0}
          explain="The headphone cue is a tap BEFORE the channel fader. With the fader down, deck B reaches your headphones and nothing reaches the mix, so the crowd hears none of it until you bring the fader up."
          wrong={[undefined, 'CUE sends a channel to your headphones, not to the PA.', 'With the fader fully down nothing of the channel reaches the mix.', 'The cue carries the whole channel; the fader decides whether the mix gets any of it.']}
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
          hints={['Check the headphone bus on its own: which channel is cued?', 'The blend is all the way to CUE, and no channel is cued — so the cue bus is empty.', 'Open CUE and press CUE on the deck you want to hear (or move BLEND toward MASTER).']}
          why="The headphones were set to hear ONLY the cue, and nothing was cued. The headphone feed is its own bus: check what it is fed from, separately from what the crowd hears."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(5)} latched={latched.slice(5)} />
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

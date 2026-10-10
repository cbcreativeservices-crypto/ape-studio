/**
 * Module 3 — Harmonics vs Plate Modes (spec §5). Four frequency ladders on a
 * shared log axis: string, open air column, ideal circular membrane, free
 * circular plate, drawn as the module's display. LADDER / MODE in the dock
 * pick a rung to hear (our sine generator); PLAY stops and restarts it.
 * The lesson: only the first two are harmonic series; Chladni figures show
 * resonance and normal modes, not musical harmony.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { DockParam } from '../../rack/rackTypes';
import { CymaticsRackLayout } from './rackLayout';
import { colors, fonts } from '../../../../theme/tokens';
import { fitValue } from '../../../../theme/legibility';
import { DEFAULT_PLATE, type PlateSpec } from '../../../../features/cymatics/plateModes';
import { formatHz } from '../../../../features/cymatics/music';
import type { CymaticsModuleProps } from '../CymaticsModuleScreen';
import { useDriveTone } from '../useDriveTone';
import { P, excitableModes } from './shared';
import { START_LEVEL_01 } from '../../../../features/audio/startLevel';

const F0 = 110;
const AXIS_MAX = 6.5;

type Ladder = { id: string; name: string; what: string; ratios: number[]; harmonic: boolean; note: string };

/** Rung width, and the closest two rung CENTRES may sit and still be tappable
 *  apart. 14 px of rung plus a couple of px of daylight. */
const RUNG_W = 14;
const MIN_GAP = RUNG_W + 3;

/**
 * Where each rung sits on the shared log axis — with overlapping neighbours
 * pushed apart (design pass, 2026-09-17).
 *
 * The true log positions are correct and they are also, for one ladder, not
 * usable: the circular membrane's 2.136 and 2.296 land about 11 px apart on a
 * 390 pt phone and about 10 px apart on a 360 pt one, for 14 px targets. They
 * overlapped, so the rung on top ate both taps and one of the six modes could
 * not be heard at all — in the module whose entire argument is that these
 * ratios are NOT the neat integers above them.
 *
 * The nudge is a single forward sweep: keep the first, and move any rung that
 * is too close to its predecessor just far enough to clear it. Displacement is
 * a couple of pixels at most and only ever where the axis is unreadable
 * anyway — the ladder still reads as "bunched up here, spread out there",
 * which is the fact being taught. If a nudge were ever large enough to distort
 * that, the honest fix would be two rows, not a bigger shove.
 */
function rungPositions(ratios: number[], width: number): { r: number; x: number }[] {
  const span = width - 26 - 24;
  const out: { r: number; x: number }[] = [];
  for (const r of ratios) {
    const x = (Math.log(r) / Math.log(AXIS_MAX)) * span + 12;
    const prev = out[out.length - 1];
    out.push({ r, x: prev && x - prev.x < MIN_GAP ? prev.x + MIN_GAP : x });
  }
  return out;
}

export function HarmonicsModule({ help }: CymaticsModuleProps) {
  const plateRatios = useMemo(() => {
    const spec: PlateSpec = { ...DEFAULT_PLATE, shape: 'circle', exciter: { x: 0.85, y: 0.5 } };
    const ex = excitableModes(spec, 20);
    return ex.slice(0, 7).map((m) => m.hz / ex[0].hz);
  }, []);
  const ladders: Ladder[] = [
    { id: 'string', name: 'String', what: 'a solid string under tension', ratios: [1, 2, 3, 4, 5, 6], harmonic: true, note: 'Modes at f, 2f, 3f… — a harmonic series. This is why a plucked string has a clear pitch.' },
    { id: 'pipe', name: 'Air column (open)', what: 'air in an open pipe', ratios: [1, 2, 3, 4, 5, 6], harmonic: true, note: 'Also harmonic. A pipe closed at one end keeps only the odd members: f, 3f, 5f.' },
    { id: 'membrane', name: 'Circular membrane', what: 'a stretched membrane (drumhead)', ratios: [1, 1.594, 2.136, 2.296, 2.653, 2.918], harmonic: false, note: 'Bessel-function modes: 1 : 1.59 : 2.14 : 2.30 : 2.65 : 2.92 — not integers. A drum has a vaguer pitch for exactly this reason.' },
    { id: 'plate', name: 'Free metal plate', what: 'a thin solid plate, edges free', ratios: plateRatios, harmonic: false, note: 'Inharmonic and spread out. These are the Chladni modes — the ratios come straight from this lab’s plate model.' },
  ];
  // Owner rule 2026-10-10: every lab control lives in the bottom dock. The
  // rung taps and the ■ STOP that used to sit in the reading are the LADDER /
  // MODE / PLAY keys now, and the four ladders are the module's display.
  const [ladderId, setLadderId] = useState('string');
  const [sel, setSel] = useState<{ ladder: string; ratio: number } | null>(null);
  const hz = F0 * (sel?.ratio ?? 1);
  const tone = useDriveTone(hz, null, START_LEVEL_01);
  const play = async (ladder: string, ratio: number) => {
    setSel({ ladder, ratio });
    if (!tone.running) await tone.start();
  };
  const ladder = ladders.find((l) => l.id === ladderId) ?? ladders[0];
  const selLadder = sel ? ladders.find((l) => l.id === sel.ladder) : null;

  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'ladder',
      label: 'LADDER',
      valueLabel: LADDER_SHORT[ladder.id] ?? ladder.name,
      valueA11y: ladder.name,
      options: ladders.map((l) => ({ id: l.id, label: l.name, blurb: `${l.harmonic ? 'Harmonic' : 'Inharmonic'} — what vibrates: ${l.what}.` })),
      selectedId: ladder.id,
      onSelect: setLadderId,
      sticky: true,
      helpKey: 'harmonics',
    },
    {
      kind: 'options',
      id: 'mode',
      label: 'MODE',
      valueLabel: sel && sel.ladder === ladder.id ? `${sel.ratio.toFixed(2)}×` : '—',
      options: ladder.ratios.map((r, i) => ({
        id: String(i),
        label: `Mode ${i + 1} · ${r.toFixed(2)}× · ${formatHz(F0 * r)}`,
        blurb: i === 0 ? 'The first mode — the same frequency on every ladder, so the ratios compare.' : `${r.toFixed(3)} times the first mode.`,
      })),
      selectedId: sel && sel.ladder === ladder.id ? String(ladder.ratios.indexOf(sel.ratio)) : null,
      onSelect: (id) => void play(ladder.id, ladder.ratios[Number(id)]),
      // A/B the modes by ear while the display marks each one.
      sticky: true,
      helpKey: 'harmonics',
    },
    {
      kind: 'toggle',
      id: 'play',
      label: 'PLAY',
      value: tone.running,
      onToggle: () => (tone.running ? tone.stop() : void play(sel?.ladder ?? ladder.id, sel?.ratio ?? 1)),
      helpKey: 'harmonics',
    },
  ];

  return (
    <CymaticsRackLayout
      rack={{
        size: 'L',
        badge: 'CALCULATED — RATIOS OF NATURAL FREQUENCIES · PLATE: THIS LAB’S MODEL, APPROXIMATED',
        onHelp: help,
        onGuide: () => help('harmonics'),
        initialParam: 'mode',
        bezel: [
          { k: 'LADDER', v: (LADDER_SHORT[ladder.id] ?? ladder.name).toUpperCase(), helpKey: 'harmonics' },
          { k: 'RATIO', v: sel ? `${sel.ratio.toFixed(2)}×` : '—', helpKey: 'harmonics' },
          { k: 'FREQ', v: sel ? formatHz(hz) : '—', helpKey: 'harmonics' },
          { k: 'FAMILY', v: ladder.harmonic ? 'HARMONIC' : 'INHARM.', tint: ladder.harmonic ? '#37e05f' : '#ff6b5e', helpKey: 'harmonics', flex: 1.2 },
        ],
        stage: (w, h) => <LadderStage w={w} h={h} ladders={ladders} active={ladder.id} sel={sel} />,
        params,
      }}
      caption="Open LADDER to pick what vibrates, then MODE to hear each of its natural frequencies. The display shows all four ladders on one axis."
    >
      <Text style={P.body}>
        Four things that vibrate, each drawn as a ladder of its natural frequencies on the same axis (the first mode of each is set to{' '}
        {F0} Hz so the <Text style={P.strong}>ratios</Text> can be compared). Choose a ladder and a mode in the dock to hear it.
      </Text>
      <View style={[P.card, { borderColor: 'rgba(255,198,77,.5)' }]}>
        <Text style={P.strong}>
          {/* "Playing" only while the tone really runs (hunt 7, 2026-10-03):
              a declined output gate, a failed start or a stop left the card
              saying "Playing …" over silence. */}
          {sel ? `${tone.running ? 'Playing ' : ''}${formatHz(hz)} — ${selLadder?.name}, ratio ${sel.ratio.toFixed(2)}` : 'Pick a MODE to hear it.'}
        </Text>
        {tone.error ? <Text style={styles.err}>{tone.error}</Text> : null}
        {!tone.engineReady ? <Text style={P.caption}>Sound needs the native engine (this build: {tone.gate}).</Text> : null}
      </View>
      {ladders.map((l) => (
        <View key={l.id} style={{ gap: 2 }}>
          <Text style={P.strong}>
            {l.name} — {l.harmonic ? 'harmonic' : 'inharmonic'}
          </Text>
          <Text style={P.caption}>
            What vibrates: {l.what}. {l.note}
          </Text>
        </View>
      ))}
      <Text style={P.h}>SO WHAT DO CHLADNI FIGURES SHOW?</Text>
      <Text style={P.body}>
        Resonance and normal modes. A plate’s modes are not spaced like a string’s harmonics, so a Chladni figure is not a picture of a
        musical interval or chord. Musical ratios and plate modes are related through vibration and resonance — but a chord does not own a
        cymatic symbol. Frequency ratios are a separate subject from plate modes; this lab keeps them apart on purpose.
      </Text>
    </CymaticsRackLayout>
  );
}

const LADDER_SHORT: Record<string, string> = { string: 'String', pipe: 'Pipe', membrane: 'Drum', plate: 'Plate' };

/** The four ladders on one log axis — the module's display (read-only; the
 *  dock picks the rung). */
function LadderStage({ w, h, ladders, active, sel }: { w: number; h: number; ladders: Ladder[]; active: string; sel: { ladder: string; ratio: number } | null }) {
  const rowH = Math.floor((h - 20) / ladders.length);
  return (
    <View style={{ width: w, height: h, paddingTop: 4 }}>
      {ladders.map((l) => {
        const on = l.id === active;
        return (
          <View key={l.id} style={{ height: rowH, justifyContent: 'center', gap: 2 }}>
            <View style={styles.rowHead}>
              <Text style={[styles.rowName, on && styles.rowNameOn]} {...fitValue(11)}>
                {l.name}
              </Text>
              <Text style={[styles.tag, { color: l.harmonic ? '#37e05f' : '#ff6b5e', borderColor: l.harmonic ? 'rgba(55,224,95,.6)' : 'rgba(255,107,94,.6)' }]}>{l.harmonic ? 'HARMONIC' : 'INHARMONIC'}</Text>
            </View>
            <View style={{ height: 22, justifyContent: 'center' }}>
              <View style={[styles.axis, on && styles.axisOn]} />
              {rungPositions(l.ratios, w).map(({ r, x }) => {
                const lit = sel?.ladder === l.id && sel.ratio === r;
                return <View key={r} style={[styles.rung, { left: x - RUNG_W / 2 }, !on && styles.rungDim, lit && styles.rungOn]} />;
              })}
            </View>
          </View>
        );
      })}
      <View style={{ height: 16 }}>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <Text key={n} style={[styles.tick, { left: (Math.log(n) / Math.log(AXIS_MAX)) * (w - 26 - 24) + 12 - 8 }]}>
            {n}f
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  axis: { position: 'absolute', left: 12, right: 12, height: 2, backgroundColor: '#3a3a44', borderRadius: 1 },
  axisOn: { backgroundColor: '#5a5a66' },
  rung: { position: 'absolute', top: 1, width: RUNG_W, height: 20, borderRadius: 4, backgroundColor: '#ffc64d', borderWidth: 1, borderColor: '#8a6a1f' },
  rungDim: { opacity: 0.45 },
  rungOn: { backgroundColor: '#ffffff', opacity: 1 },
  tick: { position: 'absolute', top: 0, fontFamily: fonts.mono, fontSize: 10, color: colors.textSub, width: 16, textAlign: 'center' },
  tag: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1, borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10 },
  rowName: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.6, color: colors.textSub },
  rowNameOn: { color: colors.amber },
  err: { fontFamily: fonts.barlowRegular, fontSize: 13, color: '#ff6b5e' },
});

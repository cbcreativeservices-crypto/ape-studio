/**
 * Module 3 — Harmonics vs Plate Modes (spec §5). Four frequency ladders on a
 * shared log axis: string, open air column, ideal circular membrane, free
 * circular plate. Tap a rung to hear that frequency (our sine generator).
 * The lesson: only the first two are harmonic series; Chladni figures show
 * resonance and normal modes, not musical harmony.
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { DEFAULT_PLATE, type PlateSpec } from '../../../../features/cymatics/plateModes';
import { formatHz } from '../../../../features/cymatics/music';
import type { CymaticsModuleProps } from '../CymaticsModuleScreen';
import { useDriveTone } from '../useDriveTone';
import { P, excitableModes } from './shared';

const F0 = 110;
const AXIS_MAX = 6.5;

type Ladder = { id: string; name: string; what: string; ratios: number[]; harmonic: boolean; note: string };

export function HarmonicsModule({ width, help }: CymaticsModuleProps) {
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
  const [sel, setSel] = useState<{ ladder: string; ratio: number } | null>(null);
  const hz = F0 * (sel?.ratio ?? 1);
  const tone = useDriveTone(hz, null, 0.6);
  const play = async (ladder: string, ratio: number) => {
    setSel({ ladder, ratio });
    if (!tone.running) await tone.start();
  };

  return (
    <View style={{ gap: 12 }}>
      <Text style={P.body}>
        Four things that vibrate, each drawn as a ladder of its natural frequencies on the same axis (the first mode of each is set to{' '}
        {F0} Hz so the <Text style={P.strong}>ratios</Text> can be compared). Tap a rung to hear it.
      </Text>
      {ladders.map((l) => (
        <View key={l.id} style={P.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={P.strong}>{l.name}</Text>
            <Text style={[styles.tag, { color: l.harmonic ? '#37e05f' : '#ff6b5e', borderColor: l.harmonic ? 'rgba(55,224,95,.6)' : 'rgba(255,107,94,.6)' }]}>{l.harmonic ? 'HARMONIC' : 'INHARMONIC'}</Text>
          </View>
          <Text style={P.caption}>What vibrates: {l.what}.</Text>
          <View style={{ height: 34, justifyContent: 'center' }}>
            <View style={styles.axis} />
            {l.ratios.map((r) => {
              const x = (Math.log(r) / Math.log(AXIS_MAX)) * (width - 26 - 24) + 12;
              const on = sel?.ladder === l.id && sel.ratio === r;
              return (
                <Pressable key={r} onPress={() => void play(l.id, r)} onLongPress={() => help('harmonics')} hitSlop={8} style={[styles.rung, { left: x - 7 }, on && styles.rungOn]} accessibilityRole="button" accessibilityLabel={`${formatHz(F0 * r)}`} />
              );
            })}
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Text key={n} style={[styles.tick, { left: (Math.log(n) / Math.log(AXIS_MAX)) * (width - 26 - 24) + 12 - 8 }]}>{n}f</Text>
            ))}
          </View>
          <Text style={P.caption}>{l.note}</Text>
        </View>
      ))}
      <View style={[P.card, { borderColor: 'rgba(255,198,77,.5)' }]}>
        <Text style={P.strong}>
          {sel ? `Playing ${formatHz(hz)} — ${ladders.find((l) => l.id === sel.ladder)?.name}, ratio ${sel.ratio.toFixed(2)}` : 'Tap any rung to hear it.'}
        </Text>
        {tone.running ? (
          <Pressable onPress={tone.stop} style={styles.stop} accessibilityRole="button" accessibilityLabel="Stop">
            <Text style={styles.stopText}>■ STOP</Text>
          </Pressable>
        ) : null}
        {!tone.engineReady ? <Text style={P.caption}>Sound needs the native engine (this build: {tone.gate}).</Text> : null}
      </View>
      <Text style={P.h}>SO WHAT DO CHLADNI FIGURES SHOW?</Text>
      <Text style={P.body}>
        Resonance and normal modes. A plate’s modes are not spaced like a string’s harmonics, so a Chladni figure is not a picture of a
        musical interval or chord. Musical ratios and plate modes are related through vibration and resonance — but a chord does not own a
        cymatic symbol. The Harmony in Motion area (planned) is where frequency ratios are visualised honestly.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  axis: { position: 'absolute', left: 12, right: 12, height: 2, backgroundColor: '#2f74ff', borderRadius: 1 },
  rung: { position: 'absolute', top: 3, width: 14, height: 28, borderRadius: 4, backgroundColor: '#ffc64d', borderWidth: 1, borderColor: '#8a6a1f' },
  rungOn: { backgroundColor: '#ffffff' },
  tick: { position: 'absolute', top: 30, fontFamily: fonts.mono, fontSize: 8.5, color: colors.textSub, width: 16, textAlign: 'center' },
  tag: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.2, borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  stop: { alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1, borderColor: '#3a3a44', paddingHorizontal: 12, paddingVertical: 7 },
  stopText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.amber },
});

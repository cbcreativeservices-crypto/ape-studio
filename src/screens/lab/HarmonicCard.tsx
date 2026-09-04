/**
 * HarmonicCard — the IDENTITY CARD for the selected harmonic (HV-1 Build A;
 * spec 2026-07-25 §2.A/§2.B). Rendered below the stem editor while a
 * harmonic is selected.
 *
 * Shows: number + ordinal name, exact frequency, ratio (n× fundamental),
 * level in dB re model full scale, phase, odd/even order, THD contribution
 * (per-harmonic aₙ/a₁ %, from harmonicModel.thd().perHarmonic), and a
 * plain-language audible-effect line. H1 additionally gets its musical note
 * (+cents) and period in ms. Build B adds ▶ SOLO — a REAL sine at n×f0
 * through the existing tone path (HarmonicsView owns the audio lifecycle;
 * this card only requests toggle and reflects the active state).
 *
 * HONESTY: the audible-effect copy is written as instructional TENDENCIES
 * ("tends to…"), never absolutes — the spec's rule for describing harmonic
 * character — and the footer says so explicitly.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { AMP_FLOOR, dbcOf, noteInfo, periodMs, type Harmonic } from './harmonicModel';

const ORDINALS = [
  'First',
  'Second',
  'Third',
  'Fourth',
  'Fifth',
  'Sixth',
  'Seventh',
  'Eighth',
  'Ninth',
  'Tenth',
  'Eleventh',
  'Twelfth',
] as const;

/** Plain-language audible-effect copy — instructional TENDENCIES per
 *  harmonic group, not absolute claims about any device or signal. */
function tendencyFor(n: number): string {
  switch (n) {
    case 1:
      return 'Sets the perceived pitch and carries the body of the tone. With every overtone removed, this alone is a pure sine.';
    case 2:
      return 'Even-order — one octave above the fundamental. Tends to add warmth and fullness without changing the perceived pitch.';
    case 3:
      return 'Odd-order. Adds edge and buzz depending on its level and phase, while keeping the wave half-wave symmetric.';
    case 4:
      return 'Even-order — two octaves up. Tends to add brightness and sheen at moderate levels.';
    case 5:
      return 'Odd-order. Tends toward a brassy, hollow bite as its level rises.';
    default:
      return n % 2 === 0
        ? 'Even-order. High even harmonics tend to read as air and shimmer at low levels, and as hardness as they rise.'
        : 'Odd-order. High odd harmonics tend to read as buzz, grit, and harshness — small level changes are clearly audible.';
  }
}

const trim = (s: string) => (s.includes('.') ? s.replace(/\.?0+$/, '') : s);

export function HarmonicCard({
  harmonic,
  f0,
  thdSharePct,
  soloActive,
  canSolo,
  onToggleSolo,
  onClose,
}: {
  harmonic: Harmonic;
  f0: number;
  /** Per-harmonic THD component (aₙ/a₁ %) — null when the fundamental is
   *  silent (THD undefined) or for H1 itself. */
  thdSharePct: number | null;
  /** True while THIS harmonic is solo-audible (a real sine at n×f0). */
  soloActive: boolean;
  /** False when the measurement engine is absent — no tone path exists. */
  canSolo: boolean;
  onToggleSolo: () => void;
  onClose: () => void;
}) {
  const { n, phaseDeg } = harmonic;
  const hz = n * f0;
  const silent = harmonic.amp <= AMP_FLOOR;
  const db = dbcOf(harmonic);
  const phase = `${Math.round(phaseDeg)}°`;

  let meta: string;
  if (n === 1) {
    // H1 — Fundamental: Hz, musical note, relative dB, phase, period (spec §2.A).
    const note = noteInfo(hz);
    meta = `${hz} Hz · ${note.label} ${note.cents >= 0 ? '+' : ''}${note.cents}¢ · ${
      silent ? 'below −60 dB' : `${db.toFixed(1)} dB`
    } · ${phase} · ${trim(periodMs(hz).toFixed(2))} ms period`;
  } else {
    // dB re MODEL FULL SCALE (amp 1), not dBc — the fundamental is itself
    // editable, so a carrier-relative label would contradict the THD line
    // (which honestly uses aₙ/a₁) the moment H1 leaves 0 dB.
    meta = `${hz} Hz · ${n}× fundamental · ${
      silent ? 'below −60 dB' : `${db.toFixed(1)} dB`
    } · ${phase} · ${n % 2 === 1 ? 'Odd' : 'Even'}-order`;
  }

  const status = !harmonic.enabled
    ? 'DISABLED — contributes nothing until re-enabled'
    : harmonic.muted
      ? 'MUTED — silent until unmuted'
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <Text style={styles.title}>
          {`H${n} — ${n === 1 ? 'Fundamental' : `${ORDINALS[n - 1]} Harmonic`}`}
        </Text>
        <View style={styles.headBtns}>
          <Pressable
            onPress={onToggleSolo}
            disabled={!canSolo}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSolo, selected: soloActive }}
            accessibilityLabel={soloActive ? `Stop solo of harmonic ${n}` : `Solo harmonic ${n} as a sine tone`}
          >
            <Text style={[styles.solo, soloActive && styles.soloOn, !canSolo && styles.soloOff]}>
              {soloActive ? '■ SOLO' : '▶ SOLO'}
            </Text>
          </Pressable>
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close harmonic card">
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.meta}>{meta}</Text>
      {soloActive ? <Text style={styles.soloLine}>{`SOLO H${n} · ${hz} Hz sine`}</Text> : null}
      {status ? <Text style={styles.status}>{status}</Text> : null}
      <Text style={styles.body}>{tendencyFor(n)}</Text>
      {n >= 2 ? (
        <Text style={styles.thd}>
          {thdSharePct == null
            ? 'THD contribution: — (the fundamental is silent, so THD is undefined)'
            : `THD contribution: ${thdSharePct.toFixed(1)}% of the fundamental`}
        </Text>
      ) : null}
      <Text style={styles.foot}>
        Tendencies, not rules — the audible effect depends on level, phase, and the rest of the
        series.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
    gap: 6,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headBtns: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.2, color: colors.textPrimary },
  close: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, color: colors.textSub, paddingHorizontal: 4 },
  solo: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.green },
  soloOn: { color: colors.amber },
  soloOff: { color: colors.textMuted },
  soloLine: { fontFamily: fonts.mono, fontSize: 12, color: colors.amber },
  meta: { fontFamily: fonts.mono, fontSize: 12, color: 'rgba(91,255,133,.8)' },
  status: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.amber },
  body: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSecondary },
  thd: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt },
  foot: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
});

/**
 * FifthPath (spec Stage 1 §8): the chronological chain of pure fifths — one
 * node per generation, ×3/2 between nodes, every ÷2 octave reduction shown
 * explicitly. Generation order, NOT pitch order (the cents rail shows that).
 * Wraps on narrow screens; no page-level horizontal scrolling.
 */
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { type FifthStep, fracLabel } from '../../../../features/tuning/tuningMath';
import { ROLE } from './primitives';

export function FifthPath({ steps, revealed, dimNotes, order = 'fifth' }: { steps: FifthStep[]; revealed: number; dimNotes?: boolean; order?: 'fifth' | 'pitch' }) {
  const shown = steps.slice(0, revealed + 1);
  const list = order === 'pitch' ? [...shown].sort((a, b) => a.cents - b.cents) : shown;
  const a11y = `${order === 'fifth' ? 'Fifth path in generation order' : 'Generated notes in pitch order'}: ${list.map((s) => `${s.spelling} ${fracLabel(s.normalized)}`).join(', ')}.`;
  return (
    <View style={styles.wrap} accessible accessibilityLabel={a11y}>
      {list.map((s, i) => {
        const newest = order === 'fifth' && i === list.length - 1 && revealed > 0;
        const isLast = s.index === 12;
        return (
          <View key={s.index} style={styles.item}>
            {order === 'fifth' && i > 0 ? (
              <View style={styles.op}>
                <Text style={[styles.opText, { color: ROLE.operation }]}>×3/2</Text>
                {s.reductions.length ? <Text style={[styles.opText, { color: ROLE.octave }]}>{s.reductions.map(() => '÷2').join(' ')}</Text> : null}
              </View>
            ) : null}
            <View style={[styles.node, newest && styles.nodeNew, isLast && styles.nodeLast, dimNotes && !newest && !isLast && { opacity: 0.55 }]}>
              <Text style={[styles.spelling, newest && { color: ROLE.operation }, isLast && { color: ROLE.error }]}>{s.spelling}</Text>
              <Text style={styles.ratio}>{fracLabel(s.normalized)}</Text>
              {order === 'pitch' ? <Text style={styles.cents}>{s.cents.toFixed(1)} ¢</Text> : <Text style={styles.cents}>#{s.index}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, rowGap: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  op: { alignItems: 'center', minWidth: 34 },
  opText: { fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 0.5 },
  node: { minWidth: 62, borderRadius: 8, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', paddingVertical: 4, paddingHorizontal: 6, alignItems: 'center' },
  nodeNew: { borderColor: ROLE.operation, backgroundColor: '#1f1a0e' },
  nodeLast: { borderColor: ROLE.error, backgroundColor: '#241012' },
  spelling: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 14 },
  ratio: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 11 },
  cents: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 9.5 },
});

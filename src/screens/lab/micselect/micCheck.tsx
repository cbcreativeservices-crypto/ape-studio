/**
 * Microphone Selection's own CHECK YOURSELF card (lab fix round 2026-11-14,
 * F9 phase 2, the S2 check-card rule; owner approval of the fix round: "Begin
 * fixing all bugs found and do obvious ... fixes as you suggestted in the
 * report"). The look of the shared CheckQuestion (foundations/bits.tsx), plus
 * a reason PER WRONG OPTION:
 *   - first miss: that option's reason (else the hint);
 *   - a second, different miss: the reason plus the full explanation;
 *   - right: ✓ and the explanation.
 * Options are shown in a fixed shuffled order per mount; correctness is by
 * the option's own index, as in CheckQuestion.
 */
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { checkFeedback, type MicCheckSpec } from './micCheckRule';

export type { MicCheckSpec } from './micCheckRule';

export function MicCheck({ spec }: { spec: MicCheckSpec }) {
  const [order] = useState<number[]>(() => {
    const idx = spec.options.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  });
  const [picked, setPicked] = useState<number | null>(null);
  const [misses, setMisses] = useState<number[]>([]);
  // Collapsible, as CheckQuestion: ▾ folds the card, ▸ opens it.
  const [open, setOpen] = useState(true);
  const solvedRef = useRef(false);
  const solved = picked === spec.correctIdx;
  const fb = checkFeedback(spec, picked, misses);
  return (
    <View style={styles.card}>
      <Pressable
        style={styles.headRow}
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        accessibilityLabel={`Check yourself, ${open ? 'expanded' : 'collapsed'}`}
        hitSlop={{ top: 8, bottom: 8 }}
      >
        <Text style={styles.caret}>{open ? '▾' : '▸'}</Text>
        <Text style={styles.eyebrow}>{`CHECK YOURSELF${solved ? '  ·  ✓' : ''}`}</Text>
      </Pressable>
      {open ? (
        <>
      <Text style={styles.question}>{spec.question}</Text>
      <View style={{ gap: 8 }}>
        {order.map((i) => {
          const good = solved && i === spec.correctIdx;
          const bad = picked === i && !solved;
          return (
            <Pressable
              key={i}
              disabled={solved}
              onPress={() => {
                if (solvedRef.current) return;
                setPicked(i);
                if (i === spec.correctIdx) solvedRef.current = true;
                else setMisses((m) => (m.includes(i) ? m : [...m, i]));
              }}
              style={[styles.opt, good && styles.optGood, bad && styles.optBad]}
              accessibilityRole="button"
              accessibilityState={{ selected: picked === i, disabled: solved }}
              aria-pressed={picked === i}
              accessibilityLabel={spec.options[i]}
            >
              <Text style={[styles.optText, good && { color: '#37e05f' }, bad && { color: '#ff6b5e' }]}>{spec.options[i]}</Text>
            </Pressable>
          );
        })}
      </View>
      {fb ? <Text style={fb.right ? styles.reveal : styles.hint}>{fb.text}</Text> : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 9, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(180,91,255,.5)', backgroundColor: '#140f1a', padding: 12 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  caret: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: '#c98bff', width: 12, textAlign: 'center' },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.4, color: '#c98bff' },
  question: { fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 20, color: colors.textPrimary },
  opt: { borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#131316', paddingVertical: 10, paddingHorizontal: 12 },
  optGood: { borderColor: 'rgba(55,224,95,.7)', backgroundColor: '#0e130f' },
  optBad: { borderColor: 'rgba(255,80,70,.7)', backgroundColor: '#161010' },
  optText: { fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18, color: colors.textSecondary },
  reveal: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: '#37e05f' },
  hint: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: '#ff8d7a' },
});

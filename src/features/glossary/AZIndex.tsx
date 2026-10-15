/**
 * A–Z fast-scroll strip (UX review 2026-10-15): a column of letters down the
 * right edge of an alphabetical list. Touch or drag along it and the list
 * jumps to the first row of the letter under the finger. Letters with no rows
 * are drawn dim and skipped to the nearest letter that has rows.
 */
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

export const AZ_LETTERS = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

/** The index letter for a row name: its first A–Z letter, else '#'. */
export function azLetterOf(name: string): string {
  const c = name.trim().charAt(0).toUpperCase();
  return c >= 'A' && c <= 'Z' ? c : '#';
}

export function AZIndex({ present, onPick }: { present: Set<string>; onPick: (letter: string) => void }) {
  const ref = useRef<View>(null);
  const box = useRef({ y: 0, h: 0 });
  const last = useRef<string | null>(null);
  const [lit, setLit] = useState<string | null>(null);

  const pick = (pageY: number) => {
    const { y, h } = box.current;
    if (h <= 0) return;
    const i = Math.min(AZ_LETTERS.length - 1, Math.max(0, Math.floor(((pageY - y) / h) * AZ_LETTERS.length)));
    // Nearest letter that has rows (search outward from the finger).
    let letter: string | null = null;
    for (let d = 0; d < AZ_LETTERS.length && !letter; d++) {
      for (const j of [i + d, i - d]) {
        if (j >= 0 && j < AZ_LETTERS.length && present.has(AZ_LETTERS[j])) {
          letter = AZ_LETTERS[j];
          break;
        }
      }
    }
    if (!letter || letter === last.current) return;
    last.current = letter;
    setLit(letter);
    onPick(letter);
  };

  return (
    <View
      ref={ref}
      style={styles.strip}
      hitSlop={{ left: 12, right: 4 }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(e) => {
        const py = e.nativeEvent.pageY;
        last.current = null;
        ref.current?.measureInWindow((_x, y, _w, h) => {
          box.current = { y, h };
          pick(py);
        });
      }}
      onResponderMove={(e) => pick(e.nativeEvent.pageY)}
      onResponderRelease={() => setLit(null)}
      onResponderTerminate={() => setLit(null)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {AZ_LETTERS.map((l) => (
        <Text
          key={l}
          style={[styles.letter, !present.has(l) && styles.letterDim, lit === l && styles.letterLit]}
          maxFontSizeMultiplier={1}
        >
          {l}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { width: 22, paddingVertical: 4, justifyContent: 'space-between', alignItems: 'center' },
  letter: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, lineHeight: 12, color: colors.amber },
  letterDim: { color: 'rgba(255,198,77,.25)' },
  letterLit: { color: '#fff', fontSize: 12 },
});

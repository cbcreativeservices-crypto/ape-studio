/**
 * LinksToggleLabel — the "Glossary Links" toggle's icon + label, with the
 * colour SWEEPING across it (owner 2026-09-29):
 *   turning ON  — blue fills in letter by letter, left → right (icon first);
 *   turning OFF — grey takes it back letter by letter, right → left (icon last).
 * A toggle mid-sweep simply reverses from wherever the sweep is. The first
 * render shows the settled state (no sweep on screen open).
 */
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinkIcon } from '../../components/LinkIcon';
import { colors, fonts } from '../../theme/tokens';

const LABEL = 'Glossary Links';
/** Icon + every character. */
const STEPS = LABEL.length + 1;
/** Per-letter step — the whole word takes ~0.6 s. */
const STEP_MS = 40;

export function LinksToggleLabel({ on, onColor }: { on: boolean; onColor: string }) {
  // How many positions (icon = 0, then each letter) are lit.
  const [lit, setLit] = useState(on ? STEPS : 0);
  const litRef = useRef(lit);
  litRef.current = lit;

  useEffect(() => {
    const target = on ? STEPS : 0;
    if (litRef.current === target) return;
    const id = setInterval(() => {
      const next = litRef.current + (on ? 1 : -1);
      setLit(next);
      if (next === target) clearInterval(id);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [on]);

  const colorAt = (pos: number) => (pos < lit ? onColor : colors.textMuted);
  return (
    <View style={styles.row}>
      <LinkIcon size={15} color={colorAt(0)} off={lit === 0} />
      <Text style={styles.text}>
        {LABEL.split('').map((ch, i) => (
          <Text key={i} style={{ color: colorAt(i + 1) }}>
            {ch}
          </Text>
        ))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  text: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.2 },
});

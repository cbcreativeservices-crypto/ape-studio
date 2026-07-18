/**
 * MediaBox — 4:3 media placeholder (design-reference MediaBox.dc.html).
 * Fall glossary content has no media assets, so this renders the hatched
 * placeholder; wire real media rendering when content supplies URLs.
 * (The CSS 45° pinstripe hatch is approximated with a flat recessed panel.)
 */
import { StyleSheet, Text, View } from 'react-native';
import { fonts } from '../theme/tokens';

export function MediaBox({ widthPct = 80, label = 'media · 4:3' }: { widthPct?: number; label?: string }) {
  return (
    <View style={[styles.box, { width: `${widthPct}%` }]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    aspectRatio: 4 / 3,
    alignSelf: 'center',
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: fonts.mono, fontSize: 12, color: '#5a5a5a' },
});

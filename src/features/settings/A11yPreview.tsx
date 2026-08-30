/**
 * DEV + WEB harness proving the accessibility settings actually reach the UI
 * (`localhost:8090/#a11ypreview/<13|16|19|24>[/contrast]`).
 *
 * The point is the LEFT column: those rows use plain hardcoded StyleSheet
 * sizes, exactly like the ~200 files across the app. If they change with the
 * setting, the global Text transform is working; if they do not, it is not —
 * and there is no way to fake that.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { applyA11yFromSettings, a11y } from './a11y';
import { DEFAULT_LOCAL_SETTINGS, type FontSize } from './store';
import { colors, fonts } from '../../theme/tokens';

function fromHash(): { size: FontSize; contrast: boolean } {
  const h = typeof window !== 'undefined' ? window.location.hash : '';
  const parts = h.split('/');
  const n = Number(parts[1]);
  const size = ([13, 16, 19, 24] as number[]).includes(n) ? (n as FontSize) : 16;
  return { size, contrast: h.includes('contrast') };
}

export function A11yPreview() {
  const { size, contrast } = fromHash();
  applyA11yFromSettings({
    ...DEFAULT_LOCAL_SETTINGS,
    fontSize: size,
    highContrast: contrast,
  });
  const s = a11y();
  return (
    <ScrollView contentContainerStyle={st.root}>
      <Text style={st.bar}>{`fontSize=${s.fontSize}  scale=${s.fontScale.toFixed(2)}  contrast=${String(s.highContrast)}`}</Text>
      <Text style={st.bar}>#a11ypreview/&lt;13|16|19|24&gt;[/contrast]</Text>

      <View style={st.card}>
        <Text style={st.h1}>Heading at 20</Text>
        <Text style={st.body}>Body copy authored at 15 with lineHeight 21. This paragraph is the honest test: nothing here reads the setting, so it can only change if the global transform reaches it.</Text>
        <Text style={st.hint}>Dim hint at 12.5 — high contrast should lift this grey.</Text>
        <Text style={st.mono}>MONO READOUT 12</Text>
        <Text style={st.big}>Display 30</Text>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { padding: 16, gap: 10, backgroundColor: '#0a0a0c', minHeight: '100%' },
  bar: { fontFamily: fonts.mono, fontSize: 11, color: colors.amber },
  card: { backgroundColor: '#121215', borderWidth: 1, borderColor: '#26262e', borderRadius: 12, padding: 14, gap: 10 },
  h1: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 21, color: colors.textSecondary },
  hint: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: '#8a8b93' },
  mono: { fontFamily: fonts.mono, fontSize: 12, color: '#8d93a3' },
  big: { fontFamily: fonts.oswaldBold, fontSize: 30, color: colors.amber },
});

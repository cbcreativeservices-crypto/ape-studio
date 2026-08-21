/**
 * ColorWheelButton — the discreet color-wheel entry point for MEMBER-only
 * customization (readout colors, meter skins) in the audio tools (owner
 * 2026-08-20 rule). Members tap it to open the picker (onCustomize); non-members
 * get a membership popup explaining the advanced feature, with a Paywall CTA —
 * never a hard jump straight to the Paywall. Gate by ENTITLEMENT, never caps.
 */
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useEntitlement } from '../features/commercial/EntitlementProvider';
import { WAVE_COLOR_SWATCHES } from '../features/tools/waveColorPref';
import { navigationRef } from '../navigation/navigationRef';
import { colors, fonts } from '../theme/tokens';

const HUES = ['#ff5a48', '#f0863a', '#ffd35e', '#4fd07f', '#4dd0e1', '#c77dff'];

/** A small rainbow color-wheel glyph (6 wedges + a dark hub). */
export function ColorWheel({ size = 22 }: { size?: number }) {
  const c = size / 2;
  const r = c - 1;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {HUES.map((col, i) => {
        const a0 = ((i * 60 - 90) * Math.PI) / 180;
        const a1 = (((i + 1) * 60 - 90) * Math.PI) / 180;
        const x0 = c + r * Math.cos(a0);
        const y0 = c + r * Math.sin(a0);
        const x1 = c + r * Math.cos(a1);
        const y1 = c + r * Math.sin(a1);
        return <Path key={col} d={`M${c} ${c}L${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z`} fill={col} />;
      })}
      <Circle cx={c} cy={c} r={r * 0.34} fill="#141418" />
    </Svg>
  );
}

export function ColorWheelButton({
  onCustomize,
  current,
  onPick,
  swatches = WAVE_COLOR_SWATCHES,
  pickerTitle = 'CHOOSE A COLOUR',
  pickerNote,
  size = 22,
  style,
  accessibilityLabel = 'Customize colours',
  feature = 'customizing colours and meter skins',
}: {
  /** Custom member action (e.g. open a tool's own picker). Ignored if onPick set. */
  onCustomize?: () => void;
  /** Built-in swatch picker: the current custom colour (null/undefined = default). */
  current?: string | null;
  /** Built-in swatch picker: called with the chosen colour, or null for the first
   *  (default) swatch. When provided, the member tap opens the built-in picker. */
  onPick?: (c: string | null) => void;
  swatches?: readonly string[];
  pickerTitle?: string;
  pickerNote?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /** Phrase for the membership popup: "…is a member feature." */
  feature?: string;
}): ReactNode {
  const { entitlement } = useEntitlement();
  const isMember = entitlement === 'academy';
  const [gate, setGate] = useState(false);
  const [picker, setPicker] = useState(false);
  const openForMember = () => (onPick ? setPicker(true) : onCustomize?.());
  return (
    <>
      <Pressable
        onPress={() => (isMember ? openForMember() : setGate(true))}
        style={style}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={isMember ? accessibilityLabel : `${accessibilityLabel} — members only`}
      >
        <ColorWheel size={size} />
      </Pressable>
      {/* Built-in swatch picker (members). */}
      <Modal visible={picker} transparent animationType="fade" onRequestClose={() => setPicker(false)}>
        <Pressable style={styles.scrim} onPress={() => setPicker(false)} accessibilityRole="button" accessibilityLabel="Close">
          <View style={styles.card}>
            <Text style={styles.pickerTitle}>{pickerTitle}</Text>
            <View style={styles.grid}>
              <Pressable
                style={[styles.swatch, styles.swatchDefault, !current && styles.swatchSel]}
                onPress={() => {
                  onPick?.(null);
                  setPicker(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: !current }}
                accessibilityLabel="Default colour"
              >
                <Text style={styles.swatchDefaultText}>DEF</Text>
              </Pressable>
              {swatches.map((c) => {
                const sel = !!current && current.toLowerCase() === c.toLowerCase();
                return (
                  <Pressable
                    key={c}
                    style={[styles.swatch, { backgroundColor: c }, sel && styles.swatchSel]}
                    onPress={() => {
                      onPick?.(c);
                      setPicker(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sel }}
                    accessibilityLabel={`Colour ${c}`}
                  />
                );
              })}
            </View>
            {pickerNote ? <Text style={styles.body}>{pickerNote}</Text> : null}
          </View>
        </Pressable>
      </Modal>
      <Modal visible={gate} transparent animationType="fade" onRequestClose={() => setGate(false)}>
        <Pressable style={styles.scrim} onPress={() => setGate(false)} accessibilityRole="button" accessibilityLabel="Close">
          <View style={styles.card}>
            <ColorWheel size={40} />
            <Text style={styles.title}>MEMBER FEATURE</Text>
            <Text style={styles.body}>Personalizing {feature} is an Academy member feature.</Text>
            <Pressable
              style={styles.cta}
              onPress={() => {
                setGate(false);
                navigationRef.navigate('Paywall');
              }}
              accessibilityRole="button"
              accessibilityLabel="Get Academy membership"
            >
              <Text style={styles.ctaText}>GET MEMBERSHIP</Text>
            </Pressable>
            <Pressable onPress={() => setGate(false)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Not now">
              <Text style={styles.dismiss}>NOT NOW</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 26 },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2b2b33',
    backgroundColor: '#141418',
    padding: 22,
    alignItems: 'center',
    gap: 12,
  },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 2, color: colors.amber },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary, textAlign: 'center' },
  cta: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.55)',
    backgroundColor: '#1c1608',
    paddingVertical: 12,
    paddingHorizontal: 26,
  },
  ctaText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.4, color: colors.amber },
  dismiss: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textMuted, paddingVertical: 6 },
  pickerTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.6, color: colors.textSecondary, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, justifyContent: 'center' },
  swatch: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: '#33333c', alignItems: 'center', justifyContent: 'center' },
  swatchSel: { borderColor: '#ffffff', borderWidth: 3 },
  swatchDefault: { backgroundColor: '#1a1a1f' },
  swatchDefaultText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.5, color: colors.textMuted },
});

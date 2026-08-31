/**
 * ColorWheelButton — the discreet color-wheel entry point for MEMBER-only
 * customization (readout colors, meter skins) in the audio tools (owner
 * 2026-08-20 rule). Members tap it to open the picker (onCustomize); non-members
 * get a membership popup explaining the advanced feature, with a Paywall CTA —
 * never a hard jump straight to the Paywall. Gate by ENTITLEMENT, never caps.
 */
import { useId, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Modal } from './DimModal';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Rect, Stop } from 'react-native-svg';
import { useEntitlement } from '../features/commercial/EntitlementProvider';
import { SpectrumColorPicker } from './SpectrumColorPicker';
import { LOUDNESS_STOPS } from '../features/tools/levelColor';
import { WAVE_COLOR_SWATCHES } from '../features/tools/waveColorPref';
import { navigationRef } from '../navigation/navigationRef';
import { colors, fonts } from '../theme/tokens';

const HUES = ['#ff5a48', '#f0863a', '#ffd35e', '#4fd07f', '#4dd0e1', '#c77dff'];
/** The default-chip preview ramp (the app-wide loudness ramp). */
const DEFAULT_RAMP = LOUDNESS_STOPS;

/** A member colour SCHEME shown as a gradient chip in the picker. `stops` are
 *  oriented pos 0 = loud … pos 1 = quiet; the chip fills right→loud. */
export type WheelScheme = { id: string; label: string; stops: readonly { pos: number; color: string }[] };

/** A small horizontal gradient preview of a scheme (right edge = loud/pos 0). */
export function SchemeSwatch({ stops, w = 100, h = 34 }: { stops: readonly { pos: number; color: string }[]; w?: number; h?: number }) {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, '') + 'led';
  return (
    <Svg width={w} height={h}>
      <Defs>
        <SvgGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          {stops.map((s, i) => (
            // right = loud (pos 0) ⇒ offset = 1 − pos, so the hot colour sits right.
            <Stop key={`${s.pos}-${i}`} offset={`${(1 - s.pos) * 100}%`} stopColor={s.color} />
          ))}
        </SvgGradient>
      </Defs>
      <Rect x={0} y={0} width={w} height={h} rx={6} fill={`url(#${gid})`} />
    </Svg>
  );
}

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
  schemes,
  defaultLabel = 'Default',
  swatchesTitle,
  pickerTitle = 'CHOOSE A COLOUR',
  pickerNote,
  size = 22,
  style,
  accessibilityLabel = 'Customize colours',
  feature = 'customizing colours and meter skins',
}: {
  /** Custom member action (e.g. open a tool's own picker). Ignored if onPick set. */
  onCustomize?: () => void;
  /** Built-in swatch picker: the current custom colour/scheme id (null = default). */
  current?: string | null;
  /** Built-in swatch picker: called with the chosen colour/scheme id, or null for
   *  DEFAULT. When provided, the member tap opens the built-in picker. */
  onPick?: (c: string | null) => void;
  swatches?: readonly string[];
  /** Optional preset SCHEMES (gradient chips) shown above the solid swatches.
   *  Picking one calls onPick(scheme.id); the consumer decodes id vs hex. */
  schemes?: readonly WheelScheme[];
  /** Label under the DEFAULT chip (e.g. "Loudness" for the LED). */
  defaultLabel?: string;
  /** Optional heading above the solid-colour swatches (shown only with schemes). */
  swatchesTitle?: string;
  pickerTitle?: string;
  pickerNote?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /** Phrase for the membership popup: "…is a member feature." */
  feature?: string;
}): ReactNode {
  const { isMember } = useEntitlement();
  const [gate, setGate] = useState(false);
  const [picker, setPicker] = useState(false);
  const [spectrum, setSpectrum] = useState(false);
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
      <Modal accessibilityViewIsModal visible={picker} transparent animationType="fade" onRequestClose={() => setPicker(false)}>
        <Pressable style={styles.scrim} onPress={() => setPicker(false)} accessibilityRole="button" accessibilityLabel="Close">
          <View style={styles.card}>
            <Text style={styles.pickerTitle}>{pickerTitle}</Text>
            {spectrum ? (
              <>
                <SpectrumColorPicker
                  value={typeof current === 'string' ? current : null}
                  onPick={(c) => {
                    onPick?.(c);
                    setPicker(false);
                    setSpectrum(false);
                  }}
                />
                <Pressable onPress={() => setSpectrum(false)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back to swatches">
                  <Text style={styles.spectrumLink}>‹ SWATCHES</Text>
                </Pressable>
              </>
            ) : (
              <>
            {/* SCHEMES (optional): the DEFAULT gradient chip + each preset. */}
            {schemes && schemes.length > 0 ? (
              <View style={styles.schemeGrid}>
                <Pressable
                  style={[styles.schemeChip, !current && styles.schemeChipSel]}
                  onPress={() => {
                    onPick?.(null);
                    setPicker(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: !current }}
                  accessibilityLabel={`${defaultLabel} (default)`}
                >
                  <SchemeSwatch stops={DEFAULT_RAMP} />
                  <Text style={styles.schemeLabel}>{defaultLabel}</Text>
                </Pressable>
                {schemes.map((s) => {
                  const sel = current === s.id;
                  return (
                    <Pressable
                      key={s.id}
                      style={[styles.schemeChip, sel && styles.schemeChipSel]}
                      onPress={() => {
                        onPick?.(s.id);
                        setPicker(false);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: sel }}
                      accessibilityLabel={`${s.label} scheme`}
                    >
                      <SchemeSwatch stops={s.stops} />
                      <Text style={styles.schemeLabel}>{s.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
            {schemes && schemes.length > 0 && swatchesTitle ? <Text style={styles.sectionLabel}>{swatchesTitle}</Text> : null}
            <View style={styles.grid}>
              {/* DEFAULT solid chip — only when there is no scheme section (schemes
                  already provide the default). */}
              {!(schemes && schemes.length > 0) ? (
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
              ) : null}
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
                <Pressable onPress={() => setSpectrum(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Open the colour spectrum wheel">
                  <Text style={styles.spectrumLink}>＋ SPECTRUM</Text>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
      <Modal accessibilityViewIsModal visible={gate} transparent animationType="fade" onRequestClose={() => setGate(false)}>
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
  spectrumLink: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber, textAlign: 'center', paddingVertical: 8 },
  sectionLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.4, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  schemeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  schemeChip: {
    width: 104,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#33333c',
    backgroundColor: '#101014',
    padding: 3,
    alignItems: 'center',
    gap: 2,
    overflow: 'hidden',
  },
  schemeChipSel: { borderColor: '#ffffff', borderWidth: 3 },
  schemeLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 0.8, color: colors.textSecondary, paddingBottom: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, justifyContent: 'center' },
  swatch: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: '#33333c', alignItems: 'center', justifyContent: 'center' },
  swatchSel: { borderColor: '#ffffff', borderWidth: 3 },
  swatchDefault: { backgroundColor: '#1a1a1f' },
  swatchDefaultText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.5, color: colors.textMuted },
});

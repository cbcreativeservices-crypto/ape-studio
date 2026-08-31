/**
 * HarmonographViewer — the fullscreen DRAWING VIEWER for the Harmonograph lab
 * (owner request 2026-08-23): the drawn figure on its warm paper card, with
 * SHARE / SAVE-AS-PHOTO / PRINT and the member ink-colour wheel. The visible
 * card IS the share card (GlossaryShareCard idiom): drawing + honest settings
 * caption + the ONE shared brand footer (features/commercial/brand) — what you
 * see is exactly the PNG that ships.
 *
 * HONESTY: SHARE rides the calc shareImage chain; SAVE and PRINT ride the new
 * harmoExport gates (expo-media-library / expo-print have NO native half in
 * the current dev build). Unavailable capabilities render DISABLED with the
 * "next app build" note — the owner asked for the buttons explicitly, so they
 * are never hidden and never lie. The caption states the real settings.
 *
 * MODAL RULES (SplMeter lessons): ONE native Modal, both-orientation
 * supportedOrientations for iOS, and NOTHING nests a second Modal inside it —
 * the ink picker and the member gate are in-tree absolute-fill overlays (the
 * stock ColorWheelButton opens its own Modals, which would nest here, so this
 * screen renders the shared ColorWheel glyph + the same entitlement gate and
 * picker content in-tree instead).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Modal } from '../../components/DimModal';
import Svg, { Path } from 'react-native-svg';
import { ColorWheel } from '../../components/ColorWheelButton';
import { SpectrumColorPicker } from '../../components/SpectrumColorPicker';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { BRAND, shareFooterLines } from '../../features/commercial/brand';
import { WAVE_COLOR_SWATCHES } from '../../features/tools/waveColorPref';
import { navigationRef } from '../../navigation/navigationRef';
import { colors, fonts } from '../../theme/tokens';
import * as shareImage from './calc/shareImage';
import {
  isPrintAvailable,
  isSaveAvailable,
  isShareAvailable,
  printCard,
  saveToPhotos,
} from './harmoExport';
import { drawingPath, INK_DEFAULT } from './HarmonographMachine';

export type HarmonoDrawingCfg = {
  n1: number; // oscillator 1 Hz
  n2: number; // oscillator 2 Hz
  n3: number; // paper-platform Hz (rotary only)
  phaseDeg: number;
  endAmp: number; // damping end amplitude (0..1)
  rotary: boolean;
  detune: number; // detune fraction (0.01 = +1%)
  upTo: number; // 0..1 fraction of the full drawing (freeze point; 1 = complete)
};

const PATH_SIZE = 1000; // drawingPath viewBox (square)
const PAPER_TOP = '#f4ecd8'; // warm paper, machine-inset family (#efe9d6→#d9d2bc)
const PAPER_EDGE = '#b8ad8d';

const fmtHz = (hz: number) =>
  `${hz >= 100 ? Math.round(hz) : hz >= 1 ? hz.toFixed(1) : hz.toFixed(2)} Hz`;

export function HarmonographViewer(props: {
  visible: boolean;
  onClose: () => void;
  cfg: HarmonoDrawingCfg;
  /** Human labels for the settings caption. */
  ratioLabel: string;
  intervalLabel: string;
  dampingLabel: string;
  inkColor: string; // current ink
  onInkColor: (c: string | null) => void; // null = default ink
}) {
  const { visible, onClose, cfg, ratioLabel, intervalLabel, dampingLabel, inkColor, onInkColor } =
    props;
  const { isMember } = useEntitlement();
  const { width: ww, height: wh } = useWindowDimensions();

  const cardRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [spectrumOn, setSpectrumOn] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  // Native-module availability — resolved once (the optional-require caches).
  const avail = useMemo(
    () => ({ share: isShareAvailable(), save: isSaveAvailable(), print: isPrintAvailable() }),
    [],
  );
  const missing = useMemo(
    () =>
      [!avail.share && 'SHARE', !avail.save && 'SAVE', !avail.print && 'PRINT'].filter(
        Boolean,
      ) as string[],
    [avail],
  );

  // Fresh state every open.
  useEffect(() => {
    if (visible) {
      setMsg('');
      setBusy(false);
      setPickerOpen(false);
      setSpectrumOn(false);
      setGateOpen(false);
    }
  }, [visible]);

  // Android hardware BACK: close the top overlay first, then the viewer.
  // (Modal's own onRequestClose does the same — belt and braces.)
  const closeLayered = () => {
    if (pickerOpen) {
      setPickerOpen(false);
      setSpectrumOn(false);
    } else if (gateOpen) setGateOpen(false);
    else onClose();
  };
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeLayered();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, pickerOpen, gateOpen]);

  // The figure path — deterministic from the true settings.
  const d = useMemo(() => (visible ? drawingPath(cfg, PATH_SIZE) : ''), [visible, cfg]);

  // Honest settings caption (truthful values only — never a prettied stand-in).
  const caption = useMemo(() => {
    const parts: string[] = [
      `RATIO ${ratioLabel}`,
      intervalLabel,
      `${fmtHz(cfg.n1)} : ${fmtHz(cfg.n2)}${cfg.rotary ? ` · PLAT ${fmtHz(cfg.n3)}` : ''}`,
      dampingLabel,
      cfg.rotary ? 'ROTARY' : 'LATERAL',
      `φ${cfg.phaseDeg}°`,
    ];
    if (cfg.detune > 0) parts.push(`DETUNE +${(cfg.detune * 100).toFixed(0)}%`);
    if (cfg.upTo < 1) parts.push(`FROZEN AT ${Math.round(cfg.upTo * 100)}%`);
    return parts.join(' · ');
  }, [cfg, ratioLabel, intervalLabel, dampingLabel]);

  // Paper square sized to the SHORT dimension, leaving room for the card chrome
  // and the button row; landscape scrolls (the ScrollView keeps it reachable).
  const paper = Math.max(180, Math.min(Math.min(ww, wh) - 76, 520));

  const doShare = () => {
    if (!avail.share || busy) return;
    setBusy(true);
    setMsg('');
    void shareImage
      .captureAndShare(cardRef.current, 'Harmonograph drawing')
      .then((ok) => {
        if (!ok) setMsg('Sharing as an image needs the next app build.');
      })
      .finally(() => setBusy(false));
  };

  const doSave = () => {
    if (busy) return;
    setBusy(true);
    setMsg('');
    void saveToPhotos(cardRef.current)
      .then((r) => {
        setMsg(
          r === 'saved'
            ? 'Saved to Photos ✓'
            : r === 'denied'
              ? 'Photos permission denied — allow access in Settings to save.'
              : r === 'unavailable'
                ? 'Saving to Photos is available after the next app build.'
                : 'Saving failed — please try again.',
        );
      })
      .finally(() => setBusy(false));
  };

  const doPrint = () => {
    if (busy) return;
    setBusy(true);
    setMsg('');
    void printCard(cardRef.current)
      .then((ok) => {
        if (ok) setMsg('Sent to the printer.');
        else
          setMsg(
            avail.print
              ? "Printing didn't complete."
              : 'Printing is available after the next app build.',
          );
      })
      .finally(() => setBusy(false));
  };

  const wheelPress = () => {
    if (isMember) {
      setSpectrumOn(false);
      setPickerOpen(true);
    } else setGateOpen(true);
  };

  const pickInk = (c: string | null) => {
    onInkColor(c);
    setPickerOpen(false);
    setSpectrumOn(false);
  };

  return (
    <Modal accessibilityViewIsModal
      visible={visible}
      animationType="fade"
      supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
      onRequestClose={closeLayered}
    >
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── The card — visible AND captured (what you see is the PNG) ── */}
          <View ref={cardRef} collapsable={false} style={styles.card}>
            <Text style={styles.company} accessibilityRole="header">
              {BRAND.name.toUpperCase()}
            </Text>
            <Text style={styles.sourceLine}>Harmonograph Lab</Text>

            <View
              style={[styles.paper, { width: paper, height: paper }]}
              accessibilityLabel="Harmonograph drawing"
            >
              <Svg width={paper} height={paper} viewBox={`0 0 ${PATH_SIZE} ${PATH_SIZE}`}>
                {/* soft glow under the crisp core — the house double-stroke */}
                <Path d={d} stroke={inkColor} strokeWidth={5} strokeOpacity={0.22} fill="none" strokeLinejoin="round" strokeLinecap="round" />
                <Path d={d} stroke={inkColor} strokeWidth={1.6} strokeOpacity={0.96} fill="none" strokeLinejoin="round" strokeLinecap="round" />
              </Svg>
            </View>

            <Text style={styles.caption}>{caption}</Text>

            {/* Footer — the ONE shared branding block (owner 2026-08-10),
                identical wording to every other share surface. */}
            <View style={styles.rule} />
            {shareFooterLines().map((line, i) =>
              i === shareFooterLines().length - 1 ? (
                <Text key={i} style={styles.footWebsite}>
                  {line}
                </Text>
              ) : (
                <Text key={i} style={styles.footLine}>
                  {line}
                </Text>
              ),
            )}
          </View>

          {/* ── Actions (outside the card — never captured) ── */}
          <View style={styles.btnRow}>
            <Pressable
              style={[styles.btn, (!avail.share || busy) && styles.btnDisabled]}
              onPress={doShare}
              disabled={!avail.share || busy}
              accessibilityRole="button"
              accessibilityLabel={avail.share ? 'Share drawing' : 'Share drawing — needs the next app build'}
            >
              <Text style={styles.btnText}>SHARE</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, (!avail.save || busy) && styles.btnDisabled]}
              onPress={doSave}
              disabled={!avail.save || busy}
              accessibilityRole="button"
              accessibilityLabel={avail.save ? 'Save drawing to Photos' : 'Save to Photos — needs the next app build'}
            >
              <Text style={styles.btnText}>SAVE</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, (!avail.print || busy) && styles.btnDisabled]}
              onPress={doPrint}
              disabled={!avail.print || busy}
              accessibilityRole="button"
              accessibilityLabel={avail.print ? 'Print drawing' : 'Print — needs the next app build'}
            >
              <Text style={styles.btnText}>PRINT</Text>
            </Pressable>
            {/* Member ink colour — shared wheel glyph; gate + picker are in-tree
                overlays below (never a nested Modal). */}
            <Pressable
              style={styles.btnWheel}
              onPress={wheelPress}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={isMember ? 'Customize ink colour' : 'Customize ink colour — members only'}
            >
              <ColorWheel size={22} />
            </Pressable>
            <Pressable
              style={styles.btn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close viewer"
            >
              <Text style={styles.btnText}>✕ CLOSE</Text>
            </Pressable>
          </View>

          {missing.length > 0 ? (
            <Text style={styles.note}>
              {missing.join(' · ')} {missing.length > 1 ? 'need' : 'needs'} the next app build.
            </Text>
          ) : null}
          {msg ? <Text style={styles.msg}>{msg}</Text> : null}
        </ScrollView>

        {/* ── Ink picker — IN-TREE overlay (not a second Modal) ── */}
        {pickerOpen ? (
          <View style={styles.overlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => {
                setPickerOpen(false);
                setSpectrumOn(false);
              }}
              accessibilityRole="button"
              accessibilityLabel="Close colour picker"
            />
            <View style={styles.overlayCard}>
              <Text style={styles.pickerTitle}>HARMONOGRAPH INK</Text>
              {spectrumOn ? (
                <>
                  <SpectrumColorPicker value={inkColor} onPick={(c) => pickInk(c)} />
                  <Pressable onPress={() => setSpectrumOn(false)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back to swatches">
                    <Text style={styles.spectrumLink}>‹ SWATCHES</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <View style={styles.grid}>
                    <Pressable
                      style={[
                        styles.swatch,
                        { backgroundColor: INK_DEFAULT },
                        inkColor.toLowerCase() === INK_DEFAULT.toLowerCase() && styles.swatchSel,
                      ]}
                      onPress={() => pickInk(null)}
                      accessibilityRole="button"
                      accessibilityState={{
                        selected: inkColor.toLowerCase() === INK_DEFAULT.toLowerCase(),
                      }}
                      accessibilityLabel="Classic red (default)"
                    >
                      <Text style={styles.swatchDefaultText}>DEF</Text>
                    </Pressable>
                    {WAVE_COLOR_SWATCHES.map((c) => {
                      const sel = inkColor.toLowerCase() === c.toLowerCase();
                      return (
                        <Pressable
                          key={c}
                          style={[styles.swatch, { backgroundColor: c }, sel && styles.swatchSel]}
                          onPress={() => pickInk(c)}
                          accessibilityRole="button"
                          accessibilityState={{ selected: sel }}
                          accessibilityLabel={`Colour ${c}`}
                        />
                      );
                    })}
                  </View>
                  <Text style={styles.pickerNote}>Classic red is the default ink.</Text>
                  <Pressable onPress={() => setSpectrumOn(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Open the colour spectrum wheel">
                    <Text style={styles.spectrumLink}>＋ SPECTRUM</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        ) : null}

        {/* ── Member gate — IN-TREE overlay, same copy as ColorWheelButton ── */}
        {gateOpen ? (
          <View style={styles.overlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setGateOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Close"
            />
            <View style={styles.overlayCard}>
              <ColorWheel size={40} />
              <Text style={styles.gateTitle}>MEMBER FEATURE</Text>
              <Text style={styles.gateBody}>
                Personalizing the harmonograph ink colour is an Academy member feature.
              </Text>
              <Pressable
                style={styles.cta}
                onPress={() => {
                  // The viewer's native Modal would sit OVER the Paywall — close
                  // everything first, then navigate.
                  setGateOpen(false);
                  onClose();
                  navigationRef.navigate('Paywall');
                }}
                accessibilityRole="button"
                accessibilityLabel="Get Academy membership"
              >
                <Text style={styles.ctaText}>GET MEMBERSHIP</Text>
              </Pressable>
              <Pressable onPress={() => setGateOpen(false)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Not now">
                <Text style={styles.dismiss}>NOT NOW</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 18 },

  // The share card — stable dark surface (GlossaryShareCard idiom): consistent
  // captured image regardless of theme; the paper glows inside it.
  card: {
    backgroundColor: '#0d0e12',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    gap: 2,
  },
  company: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1.6, color: colors.amber, textAlign: 'center' },
  sourceLine: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: '#9aa0ad', textAlign: 'center', marginTop: 2, marginBottom: 10 },

  paper: {
    backgroundColor: PAPER_TOP,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: PAPER_EDGE,
    overflow: 'hidden',
  },
  caption: {
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 18,
    color: '#b9bec9',
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 520,
  },

  rule: { height: 1, alignSelf: 'stretch', backgroundColor: '#23252d', marginVertical: 12 },
  footLine: { fontFamily: fonts.barlowRegular, fontSize: 12, color: '#9aa0ad', textAlign: 'center', marginTop: 2 },
  footWebsite: { fontFamily: fonts.barlowSemiBold, fontSize: 12.5, color: '#7fa8ff', textAlign: 'center', marginTop: 2 },

  // Value-button skin (tools idiom: dark chip, hairline border, Oswald caps).
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16 },
  btn: {
    height: 44,
    minWidth: 70,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSecondary },
  btnWheel: {
    height: 44,
    width: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    alignItems: 'center',
    justifyContent: 'center',
  },

  note: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 10 },
  msg: { fontFamily: fonts.barlowSemiBold, fontSize: 12.5, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },

  // In-tree overlays (never nested Modals) — ColorWheelButton card styling.
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
    zIndex: 100,
  },
  overlayCard: {
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
  pickerTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.6, color: colors.textSecondary, textAlign: 'center' },
  pickerNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textMuted, textAlign: 'center' },
  spectrumLink: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber, textAlign: 'center', paddingVertical: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, justifyContent: 'center' },
  swatch: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: '#33333c', alignItems: 'center', justifyContent: 'center' },
  swatchSel: { borderColor: '#ffffff', borderWidth: 3 },
  swatchDefaultText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.5, color: '#ffffff' },

  gateTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 2, color: colors.amber },
  gateBody: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary, textAlign: 'center' },
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
});

/**
 * ToolFullScreen — the live audio tools' FULL SCREEN, shared (owner 2026-09-29:
 * "Both the spectrogram and spectrum analyzer/RTA audio tools need full screen
 * versions of their display like the other audio tools have").
 *
 * It is the Waveform / SPL fullscreen mechanism, lifted so the RTA and the
 * Spectrogram get it EXACTLY, not a look-alike:
 *  - opened through `useFullScreenGate().gate(...)` like every tool fullscreen;
 *  - an OPAQUE overlay at the SCREEN ROOT — never a native Modal (a Modal
 *    beside another Modal renders BEHIND on Android, and a colour picker or
 *    help sheet can open over this), so the root-level Low-Light wash and the
 *    help sheet both still reach it;
 *  - forces LANDSCAPE on open (`lockLandscape` + the route's declarative
 *    `orientation`, because react-native-screens owns orientation on this
 *    stack), and on close runs the CLOSING phase: the opaque cover stays up
 *    until the window is portrait again (700 ms fallback), so the portrait
 *    screen never flashes sideways (owner 2026-08-21 ghost-flash fix);
 *  - Android back closes an open chooser first, then the full screen;
 *  - the screen is already kept awake by the route (withKeepAwake).
 *
 * The layout is the D35 working surface: readouts across the TOP (the tool's
 * own bezel strip), the controls DOCKED (a left column sideways, the Waveform
 * shape; a bottom row upright), and the display drawn LARGER — re-drawn at the
 * new size with its axis text scaled up, never magnified pixels.
 *
 * ⛔ A BLACK VOID IS NEVER ACCEPTABLE (owner 2026-09-01, iOS). The Waveform
 * shows LandscapeRequiredNotice when the rotation never arrives (rotation lock
 * on, or no orientation module). Here there is something better to show: the
 * same working surface laid out upright. Content is still held back during the
 * first ~1 s of a real flip, so the portrait layout never ghosts mid-rotation.
 *
 * The display renders from the SAME live state as the inline view (the host
 * passes its render function) — there is no second capture; the host unmounts
 * its inline drawing while this is up so only one copy ever draws.
 */
import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lockLandscape, lockPortrait } from '../../lib/screenOrientationSafe';
import { useLandscapeGrace } from '../../components/LandscapeRequiredNotice';
import { isTabletWindow } from '../../theme/tablet';
import { restingOrientation } from '../../navigation/navOrientation'; // tablets rest free — owner 2026-09-29 (Android large-screen pass)
import { colors, fonts } from '../../theme/tokens';

/** Left control-column width in the landscape full screen (Waveform: 108). */
export const FS_CTRL_W = 112;

type OrientationNav = { setOptions: (o: { orientation: 'landscape' | 'portrait' | 'default' }) => void };

export type ToolFullScreenState = {
  /** Open, or still covering the screen while it rotates back. */
  shown: boolean;
  /** Open and not closing — the full screen is the working surface. */
  active: boolean;
  closing: boolean;
  openFs: () => void;
  closeFs: () => void;
};

/**
 * Open/close + orientation lifecycle — the Waveform's four effects, verbatim
 * in behaviour. `interceptBack` lets the host close its own chooser first.
 */
export function useToolFullScreen(navigation: OrientationNav, interceptBack?: () => boolean): ToolFullScreenState {
  const { width: winW, height: winH } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const active = open && !closing;

  useEffect(() => {
    if (active) lockLandscape();
    else lockPortrait();
  }, [active]);
  useEffect(() => {
    navigation.setOptions({ orientation: active ? 'landscape' : restingOrientation('portrait') });
  }, [active, navigation]);
  // Leaving while a full screen is up (a notification tap, a sign-out reset)
  // skipped the close path, so the landscape lock outlived the screen. Restore
  // portrait on unmount — imperative lock AND the route option (bug hunt
  // 2026-09-29).
  useEffect(
    () => () => {
      lockPortrait();
      navigation.setOptions({ orientation: restingOrientation('portrait') });
    },
    [navigation],
  );
  // Finish the close only once the window is portrait again.
  const portrait = winH > winW;
  useEffect(() => {
    if (!closing) return;
    if (portrait) {
      setOpen(false);
      setClosing(false);
      return;
    }
    const t = setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 700);
    return () => clearTimeout(t);
  }, [closing, portrait]);

  const interceptRef = useRef(interceptBack);
  interceptRef.current = interceptBack;
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (interceptRef.current?.()) return true;
      if (open && !closing) {
        setClosing(true);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [open, closing]);

  const openFs = useCallback(() => {
    setClosing(false);
    setOpen(true);
  }, []);
  const closeFs = useCallback(() => setClosing(true), []);
  return { shown: open || closing, active, closing, openFs, closeFs };
}

/** Axis-text scale for a display drawn at w × h, against the inline glass it
 *  was designed on (~360 × 240): grows with the SMALLER gain so text never
 *  outgrows the drawing, never shrinks below the inline size. */
export function fsTextScale(w: number, h: number): number {
  return Math.max(1, Math.min(1.6, w / 360, h / 240));
}

export function ToolFullScreenView({
  fs,
  title,
  readouts,
  controls,
  renderDisplay,
  footer,
}: {
  fs: ToolFullScreenState;
  title: string;
  /** The tool's live readouts (its bezel strip) — across the top. */
  readouts?: ReactNode;
  /** Control keys (FsKey) — a left column sideways, a bottom row upright. */
  controls?: ReactNode;
  /** The display, drawn at the space it is given. */
  renderDisplay: (w: number, h: number) => ReactNode;
  /** One honest line under the display (units / calibration badge). */
  footer?: ReactNode;
}) {
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Camera/notch inset for the sideways layout — max across edges, since a
  // locked-landscape overlay cannot trust insets.left (Waveform/SPL rev 24).
  const camInset = Math.max(insets.left, insets.right, insets.top);
  const landscape = winW >= winH;
  // Upright content only once a rotation has clearly not come (see header).
  const settledPortrait = useLandscapeGrace(fs.active, !landscape);
  const [disp, setDisp] = useState({ w: 0, h: 0 });
  if (!fs.shown) return null;
  const showLandscape = fs.active && landscape;
  const showPortrait = fs.active && !landscape && settledPortrait;

  const close = (
    <Pressable
      hitSlop={6}
      style={styles.close}
      onPress={fs.closeFs}
      accessibilityRole="button"
      accessibilityLabel="Close fullscreen"
    >
      <Text style={styles.closeX}>✕</Text>
    </Pressable>
  );
  const display = (
    <View
      style={styles.display}
      onLayout={(e) => {
        const w = Math.round(e.nativeEvent.layout.width);
        const h = Math.round(e.nativeEvent.layout.height);
        setDisp((d) => (d.w === w && d.h === h ? d : { w, h }));
      }}
    >
      {disp.w > 0 && disp.h > 0 ? renderDisplay(disp.w, disp.h) : null}
    </View>
  );

  return (
    <View style={styles.root}>
      {showLandscape ? (
        <View
          style={[
            styles.stage,
            { paddingLeft: camInset + 12, paddingRight: camInset + 12, paddingTop: insets.top + 6, paddingBottom: insets.bottom + 6 },
          ]}
        >
          <View style={styles.topRow}>
            <View style={styles.readouts}>{readouts}</View>
            {close}
          </View>
          <View style={styles.bodyRow}>
            {controls ? <View style={styles.ctrlCol}>{controls}</View> : null}
            <View style={styles.bodyCol}>
              {display}
              {footer}
            </View>
          </View>
        </View>
      ) : showPortrait ? (
        <View style={[styles.stage, { paddingLeft: 12, paddingRight: 12, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 10 }]}>
          <View style={styles.topRow}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {close}
          </View>
          {readouts}
          {display}
          {footer}
          {controls ? (
            <View style={styles.ctrlRow}>
              {Children.map(controls, (c) => (c ? <View style={styles.ctrlCell}>{c}</View> : null))}
            </View>
          ) : null}
          {/* "tablet" on a tablet (owner 2026-09-29, Android large-screen pass). */}
          <Text style={styles.hint}>Turn the {isTabletWindow(winW, winH) ? 'tablet' : 'phone'} sideways for the widest view.</Text>
        </View>
      ) : (
        // Mid-rotation / closing: the opaque cover alone (plus a way out).
        <View style={[styles.coverClose, { top: insets.top + 8, right: camInset + 14 }]}>{close}</View>
      )}
    </View>
  );
}

/** A docked control key — the Waveform full screen's ZOOM/WINDOW/FREEZE key:
 *  a small label over its current value. `active` = a latched toggle. */
export function FsKey({
  label,
  value,
  onPress,
  active,
  disabled,
  a11y,
}: {
  label: string;
  value: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
  a11y: string;
}) {
  return (
    <Pressable
      style={[styles.key, active && styles.keyActive, disabled && styles.keyDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active, disabled: !!disabled }}
      aria-pressed={active}
      accessibilityLabel={a11y}
    >
      <Text style={styles.keyLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.keyValue, active && styles.keyValueActive]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {value}
      </Text>
    </Pressable>
  );
}

export type FsChoiceSection = {
  title: string;
  options: { id: string; label: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
};

/** The chooser popup the Waveform's value-keys open — centred card, tap
 *  outside to close, picking applies + closes. Rendered at the screen root,
 *  above the full screen (never a native Modal). */
export function FsChooser({ sections, onClose }: { sections: FsChoiceSection[] | null; onClose: () => void }) {
  if (!sections) return null;
  return (
    <View style={styles.popupBackdrop}>
      {/* The dim backdrop is its own sibling button (not a parent of the
          option buttons — no button-in-button on web). Tap outside = close. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
      <View style={styles.popupCard}>
        {sections.map((s) => (
          <View key={s.title} style={{ gap: 10 }}>
            <Text style={styles.popupTitle}>{s.title}</Text>
            <View style={styles.popupGrid}>
              {s.options.map((o) => {
                const sel = o.id === s.selectedId;
                return (
                  <Pressable
                    key={o.id}
                    style={[styles.popupOpt, sel && styles.popupOptSel]}
                    onPress={() => {
                      s.onSelect(o.id);
                      onClose();
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sel }}
                    aria-pressed={sel}
                  >
                    <Text style={[styles.popupOptText, sel && styles.popupOptTextSel]}>{o.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Same cover as the Waveform / SPL fullscreens (#0c0c0f, zIndex 40).
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0c0c0f', zIndex: 40 },
  stage: { flex: 1, gap: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  readouts: { flex: 1 },
  title: { flex: 1, fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.6, color: colors.textSubAlt },
  bodyRow: { flex: 1, flexDirection: 'row', gap: 12 },
  bodyCol: { flex: 1, gap: 4 },
  ctrlCol: { width: FS_CTRL_W, gap: 8, justifyContent: 'center' },
  ctrlRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  display: { flex: 1, borderRadius: 8, overflow: 'hidden', backgroundColor: '#07090b' },
  hint: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textSub, textAlign: 'center' },
  coverClose: { position: 'absolute', zIndex: 45 },
  // The Waveform's ✕ — 40 pt disc, same colours.
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(18,18,22,0.9)',
    borderWidth: 1,
    borderColor: '#3a3a44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeX: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.textSecondary },
  // Waveform ctrlBtn / ctrlLabel / ctrlValue.
  ctrlCell: { flexGrow: 1, flexBasis: 64 },
  key: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  keyActive: { borderColor: 'rgba(120,170,255,.55)', backgroundColor: '#10151f' },
  keyDisabled: { opacity: 0.45 },
  keyLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 0.8, color: colors.textSub },
  keyValue: { fontFamily: fonts.mono, fontSize: 15, color: colors.amber },
  keyValueActive: { color: '#8fb6ff' },
  popupBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
    zIndex: 50,
  },
  popupCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2b2b33',
    backgroundColor: '#141418',
    padding: 18,
    gap: 16,
  },
  popupTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.6, color: colors.textSecondary, textAlign: 'center' },
  popupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, justifyContent: 'center' },
  popupOpt: {
    minWidth: 62,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#33333c',
    backgroundColor: '#1a1a1f',
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  popupOptSel: { borderColor: 'rgba(255,198,77,.7)', backgroundColor: '#1c1608' },
  popupOptText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 0.6, color: colors.textSecondary },
  popupOptTextSel: { color: colors.amber },
});

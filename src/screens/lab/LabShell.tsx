/**
 * LabShell — the shared Audio-Learning-Lab screen shell (v4 MASTER §4).
 *
 * LAYOUT v2 (owner 2026-07-29): header (back · title · compact PLAY control
 * top-right) → the four mode tabs DIRECTLY under the header → description →
 * then the lab's Explore content in the standard order (readouts → displays →
 * controls → action buttons), each section collapsible via the exported
 * CollapsibleSection — and the Guided Lesson entry lives at the BOTTOM.
 *
 * DRAG vs SCROLL (owner 2026-07-29: "trying to move things is getting
 * confused with scrolling"): the exported InteractionZone wraps any drag
 * surface and claims the touch AT TOUCH-START, disabling the shell's scroll
 * for the gesture's duration — inside a zone the object wins, everywhere else
 * the screen scrolls. Legacy setScrollLocked stays for custom editors.
 *
 * The shell itself produces no sound; each lab's Explore panel owns its audio
 * lifecycle (the compact header PLAY is supplied BY the lab via headerAction).
 */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { GuidedLessonBody, GuidedLessonSheet, getLabLesson, type LabId } from '../../features/lab/guidedLessons';
import { colors, fonts } from '../../theme/tokens';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type LabMode = 'learn' | 'explore' | 'practice' | 'test';

const MODES: { key: LabMode; label: string }[] = [
  { key: 'learn', label: 'LEARN' },
  { key: 'explore', label: 'EXPLORE' },
  { key: 'practice', label: 'PRACTICE' },
  { key: 'test', label: 'TEST' },
];

/** Fixed per-mode tab color (owner 2026-07-31): LEARN green · EXPLORE amber ·
 *  PRACTICE blue · TEST purple — always on, across every lab that shows these
 *  four buttons. */
export const MODE_COLORS: Record<LabMode, string> = {
  learn: colors.green,
  explore: colors.amber,
  practice: colors.blue,
  test: colors.purple,
};

/** Shared chip control (SignalGen/HarmonicsView idiom). Long-press opens the
 *  control's Guided Lesson where wired (v4 §5). */
export function LabChip({
  label,
  selected,
  onPress,
  onLongPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  return (
    <Pressable
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={onLongPress ? `${label} — long-press for its guided lesson` : label}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

/** Compact header play/stop control (owner 2026-07-29: the play button moves
 *  to the top-right of the title, smaller). Labs pass it via `headerAction`
 *  or render it in their own headers. */
export function HeaderPlayButton({
  playing,
  onPress,
  disabled,
  label,
}: {
  playing: boolean;
  onPress: () => void;
  disabled?: boolean;
  /** Optional a11y label override (default Play/Stop). */
  label?: string;
}) {
  return (
    <Pressable
      style={[styles.headerPlay, playing && styles.headerPlayOn, disabled && styles.headerPlayOff]}
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityLabel={label ?? (playing ? 'Stop' : 'Play')}
    >
      <Text style={[styles.headerPlayGlyph, playing && styles.headerPlayGlyphOn]}>
        {playing ? '■' : '▶'}
      </Text>
    </Pressable>
  );
}

/** Collapsible content section (owner 2026-07-29: every section collapsible).
 *  Standard section titles across labs: DESCRIPTION · READOUTS · DISPLAY ·
 *  CONTROLS · ACTIONS — but any title works. */
export function CollapsibleSection({
  title,
  children,
  startOpen = true,
  onHelp,
}: {
  title: string;
  children: ReactNode;
  startOpen?: boolean;
  /** Optional ⓘ on the section header row. */
  onHelp?: () => void;
}) {
  const [open, setOpen] = useState(startOpen);
  return (
    <View style={styles.section}>
      <Pressable
        style={styles.sectionHead}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setOpen((o) => !o);
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title} section, ${open ? 'expanded' : 'collapsed'}`}
      >
        <Text style={styles.sectionCaret}>{open ? '▾' : '▸'}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onHelp ? (
          <Pressable onPress={onHelp} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${title} help`}>
            <Text style={styles.sectionHelp}>ⓘ</Text>
          </Pressable>
        ) : null}
      </Pressable>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

/** API handed to a render-prop Explore child. `setScrollLocked` lets an
 *  interactive panel disable the shell's ScrollView while a gesture is in
 *  flight, so the drag wins over scroll. */
export type LabShellExploreApi = { setScrollLocked: (locked: boolean) => void };

const ScrollLockCtx = createContext<((locked: boolean) => void) | null>(null);

/** Provider for the scroll-lock control. LabShell supplies it automatically to
 *  its Explore content; NON-LabShell hosts (module screens, the foundations
 *  course/playground) wrap their own ScrollView content in this and pass their
 *  `setScrollLocked` so drag primitives inside — DragSlider, RoomSceneView —
 *  lock the scroll during a gesture with NO prop threading (owner 2026-07-30
 *  systemic drag-vs-scroll fix). */
export const ScrollLockProvider = ScrollLockCtx.Provider;

/** Grab the nearest scroll-lock setter from context (null when there is no
 *  LabShell / ScrollLockProvider above). Drag primitives call this and lock on
 *  gesture start / unlock on release so the object wins over the page. */
export function useScrollLock(): ((locked: boolean) => void) | null {
  return useContext(ScrollLockCtx);
}

/** Wrap ANY drag/touch-interactive surface: the moment a finger lands inside,
 *  the shell's scroll is disabled until release/cancel — the object wins over
 *  the page (owner 2026-07-29 drag-vs-scroll fix). Purely additive: children
 *  keep their own PanResponders/gestures; this only silences the ScrollView.
 *  Works automatically inside LabShell; outside it (custom hosts), pass
 *  `onLock` explicitly. */
export function InteractionZone({
  children,
  onLock,
}: {
  children: ReactNode;
  onLock?: (locked: boolean) => void;
}) {
  const ctxLock = useContext(ScrollLockCtx);
  const lock = onLock ?? ctxLock ?? undefined;
  const locked = useRef(false);
  const set = (v: boolean) => {
    if (locked.current === v) return;
    locked.current = v;
    lock?.(v);
  };
  return (
    <View
      // Capture-phase notification only — we return false so children still
      // receive the touch and their own responders work unchanged.
      onStartShouldSetResponderCapture={() => {
        set(true);
        return false;
      }}
      onTouchEnd={() => set(false)}
      onTouchCancel={() => set(false)}
    >
      {children}
    </View>
  );
}

export function LabShell({
  labId,
  title,
  subtitle,
  intro,
  exploreCaption,
  headerAction,
  children,
}: {
  labId: LabId;
  title: string;
  subtitle: string;
  intro: string;
  /** One-liner above the Explore panel. */
  exploreCaption: string;
  /** Compact control rendered top-right of the header (typically
   *  <HeaderPlayButton/> — owner 2026-07-29). */
  headerAction?: ReactNode;
  /** The lab's interactive Explore content. A function child receives the
   *  shell API (scroll-lock control for drag editors); a plain node renders
   *  as-is. */
  children: ReactNode | ((api: LabShellExploreApi) => ReactNode);
}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { requestAudioOutput } = useAudioOutputGate();
  const [mode, setMode] = useState<LabMode>('explore');
  // Drag editors lock the ScrollView while dragging so the gesture wins over
  // scroll. Owned here so a tab switch always frees it.
  const [scrollLocked, setScrollLocked] = useState(false);
  const [lessonOpen, setLessonOpen] = useState(false);
  const lesson = getLabLesson(labId);

  // Audio-output prompt on entry (owner-confirmed 2026-07-25): non-blocking.
  useEffect(() => {
    void requestAudioOutput();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {headerAction ? <View style={styles.headerAction}>{headerAction}</View> : null}
      </View>

      {/* Mode tabs directly under the header (owner 2026-07-29 order). */}
      <View style={styles.tabRow}>
        {MODES.map((m) => {
          const selected = mode === m.key;
          const c = MODE_COLORS[m.key];
          return (
            <Pressable
              key={m.key}
              // Selected tab is boxed in its own mode color; the label always
              // carries that color (dimmed a touch when not selected).
              style={[styles.tab, selected && { borderColor: c, backgroundColor: c + '1e' }]}
              onPress={() => {
                // A tab press can land mid-drag; free the scroll lock too.
                setScrollLocked(false);
                setMode(m.key);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${m.label} mode`}
            >
              <Text style={[styles.tabText, { color: c, opacity: selected ? 1 : 0.72 }]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollLockCtx.Provider value={setScrollLocked}>
        <ScrollView contentContainerStyle={styles.scroll} scrollEnabled={!scrollLocked}>
          {mode === 'learn' ? (
            <View style={styles.panel}>
              <Text style={styles.caption}>
                What this lab teaches — definitions, common mistakes, pro tips, and the formula.
              </Text>
              <GuidedLessonBody lesson={lesson} />
            </View>
          ) : null}

          {mode === 'explore' ? (
            <View style={styles.panel}>
              <CollapsibleSection title="DESCRIPTION">
                <Text style={styles.intro}>{intro}</Text>
                <Text style={styles.caption}>{exploreCaption}</Text>
              </CollapsibleSection>
              {typeof children === 'function' ? children({ setScrollLocked }) : children}
            </View>
          ) : null}

          {mode === 'practice' ? (
            <View style={styles.panel}>
              <Text style={styles.caption}>Exercises with optional hints and immediate feedback.</Text>
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>Exercises in development</Text>
              </View>
            </View>
          ) : null}

          {mode === 'test' ? (
            <View style={styles.panel}>
              <Text style={styles.caption}>Randomized scored exercises without instructional overlays.</Text>
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>Scored tests in development</Text>
              </View>
            </View>
          ) : null}

          {/* Guided-lesson entry lives at the BOTTOM (owner 2026-07-29). */}
          <Pressable
            style={styles.lessonRow}
            onPress={() => setLessonOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Open the guided lesson"
          >
            <Text style={styles.lessonRowText}>ⓘ GUIDED LESSON — every control long-presses for its own entry</Text>
          </Pressable>
        </ScrollView>
      </ScrollLockCtx.Provider>

      <GuidedLessonSheet visible={lessonOpen} lesson={lesson} onClose={() => setLessonOpen(false)} />
    </View>
  );
}

/** PHONE SPEAKER OUTPUT tickbox — flips a readout between the reference (ideal)
 *  view and the speaker-output view (the signal after the low-frequency
 *  protective high-pass). The honesty control (§1.7): the filter is shown, never
 *  hidden. `sub` is an optional one-liner shown under the label. */
export function SpeakerOutputToggle({
  value,
  onChange,
  sub,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  sub?: string;
}) {
  return (
    <Pressable
      style={styles.spkToggle}
      onPress={() => onChange(!value)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      accessibilityLabel="Show phone speaker output"
    >
      <View style={[styles.spkBox, value && styles.spkBoxOn]}>
        {value ? <Text style={styles.spkCheck}>✓</Text> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.spkLabel, value && styles.spkLabelOn]}>PHONE SPEAKER OUTPUT</Text>
        {sub ? <Text style={styles.spkSub}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.4, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  headerAction: { marginLeft: 8 },
  headerPlay: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#3a3a44',
    backgroundColor: '#17171c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPlayOn: { borderColor: 'rgba(255,198,77,.8)', backgroundColor: '#1a1409' },
  headerPlayOff: { opacity: 0.35 },
  headerPlayGlyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.textSecondary, marginLeft: 2 },
  headerPlayGlyphOn: { color: colors.amber, marginLeft: 0 },

  scroll: { padding: 16, paddingTop: 12, paddingBottom: 28, gap: 14 },
  intro: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary },

  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 4 },
  tab: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 9,
    alignItems: 'center',
  },
  tabText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSecondary },

  panel: { gap: 12 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSub },

  section: { borderRadius: 10, borderWidth: 1, borderColor: '#232329', backgroundColor: '#101014' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9 },
  sectionCaret: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.amber, width: 12 },
  sectionTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.3, color: colors.textSecondary, flexGrow: 1 },
  sectionHelp: { fontFamily: fonts.barlowMedium, fontSize: 14, color: colors.textSub },
  sectionBody: { paddingHorizontal: 12, paddingBottom: 12, gap: 10 },

  lessonRow: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  lessonRowText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.9, color: colors.textSecondary },

  placeholder: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 20,
    alignItems: 'center',
  },
  placeholderText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.textSub },

  // LabChip
  chip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipSelected: { borderColor: 'rgba(255,198,77,.65)', backgroundColor: '#1a1409' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.textSecondary },
  chipTextSelected: { color: colors.amber },

  // PHONE SPEAKER OUTPUT tickbox
  spkToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2c2c33',
    backgroundColor: '#131316',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  spkBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#3a3a44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spkBoxOn: { borderColor: colors.amber, backgroundColor: 'rgba(255,198,77,.15)' },
  spkCheck: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.amber, marginTop: -1 },
  spkLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSecondary },
  spkLabelOn: { color: colors.amber },
  spkSub: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15, color: colors.textSub, marginTop: 1 },
});

/**
 * RackUnit — the Rack Unit frame (APE_LAB_UX_PROPOSAL 2026-08-23, owner-
 * approved). The layout law: *reading may scroll; operating may not.*
 *
 * Three zones; only the middle one scrolls:
 *   STAGE — pinned recessed-glass display (ToolsHub tile language grown to
 *     full width) + BezelReadouts printed on its bezel. Sized at mount
 *     (S/M/L, auto-drops one size on short viewports) and NEVER resized
 *     during an interaction (never resize a live Skia canvas — judge ruling).
 *   WELL — the only ScrollView: prose, mistakes, CheckQuestion, notices.
 *     Wrapped in ScrollLockProvider for legacy in-well drag widgets. Trays
 *     overlay the WELL ONLY; the glass stays bright and live.
 *   DOCK — the shared ParamLane, PRE-BOUND to the module's teaching parameter
 *     (`initialParam` is required — the owner's cause→effect rule made
 *     structural), over a strip of DockButtons.
 *
 * During any lane drag a DRAG TAG rides the glass bottom edge with the live
 * value (the Faceplate graft) — the value is never hidden under the finger.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { hapticsEnabled } from '../../../features/settings/store';
import { colors, fonts } from '../../../theme/tokens';
import { ScrollLockProvider } from '../scrollLock';
import { BezelReadouts } from './BezelReadouts';
import { DockButton } from './DockButton';
import { DockTray } from './DockTray';
import { ParamLane } from './ParamLane';
import { STAGE_HEIGHTS, type DockParam, type RackStage } from './rackTypes';

export type RackUnitApi = { setScrollLocked: (locked: boolean) => void };

export function RackUnit({
  stage,
  params,
  initialParam,
  onHelp,
  children,
}: {
  stage: RackStage;
  /** The dock declaration (≤5 keys reads best on a 375-wide phone). */
  params: DockParam[];
  /** REQUIRED: the id of the fader the lane binds on mount — the module's
   *  teaching parameter costs zero taps (the #1 non-negotiable, structural). */
  initialParam: string;
  /** Guided-lesson router: helpKey → the lab's GuidedLessonSheet. */
  onHelp?: (helpKey?: string) => void;
  /** The scroll well. A function child receives the well's scroll-lock API
   *  (LabShell parity for legacy in-well drag widgets). */
  children: ReactNode | ((api: RackUnitApi) => ReactNode);
}) {
  const faders = useMemo(() => params.filter((p) => p.kind === 'fader'), [params]);
  const validInitial = faders.some((f) => f.id === initialParam);
  const [boundId, setBoundId] = useState(validInitial ? initialParam : (faders[0]?.id ?? ''));
  const [openTrayId, setOpenTrayId] = useState<string | null>(null);
  const [wellLocked, setWellLocked] = useState(false);
  const [laneActive, setLaneActive] = useState(false);
  const [glassW, setGlassW] = useState(0);
  const insets = useSafeAreaInsets();

  // Contract check once, not per render (a wrong id would otherwise warn ~60/s
  // while riding the lane and bury the device logs).
  useEffect(() => {
    if (__DEV__ && !validInitial && faders.length > 0) {
      console.warn(`[rack] initialParam "${initialParam}" is not a fader param — binding "${faders[0].id}"`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconcile the bound param against the CURRENT params every render — a lab
  // whose fader set is conditional (engine-gated, mode-switched) must never
  // strand the lane on a vanished id (review 2026-08-23).
  const effBoundId = faders.some((f) => f.id === boundId)
    ? boundId
    : validInitial
      ? initialParam
      : (faders[0]?.id ?? '');
  const bound = faders.find((f) => f.id === effBoundId) ?? null;
  useEffect(() => {
    if (!bound && laneActive) setLaneActive(false); // fader vanished mid-drag
  }, [bound, laneActive]);

  const trayParam =
    (params.find((p) => p.id === openTrayId && (p.kind === 'options' || p.kind === 'group')) as
      | Extract<DockParam, { kind: 'options' | 'group' }>
      | undefined) ?? null;

  const { height: winH } = useWindowDimensions();
  // Vertical budget (review 2026-08-23): the stage may never starve the dock.
  // Target = the declared size, auto-dropped one step on short viewports, then
  // clamped so chrome+bezel+dock+a usable well always fit (landscape/split-
  // screen floor 100). Applied only while NO interaction is live — the glass
  // never resizes under a drag or an open tray (never resize a live canvas).
  const size = stage.size ?? 'M';
  const effSize = winH < 700 ? (size === 'L' ? 'M' : 'S') : size;
  const targetH = Math.min(STAGE_HEIGHTS[effSize], Math.max(100, winH - 300));
  const [glassH, setGlassH] = useState(targetH);
  const interacting = laneActive || trayParam != null;
  useEffect(() => {
    if (!interacting && glassH !== targetH) setGlassH(targetH);
  }, [interacting, glassH, targetH]);

  return (
    <View style={styles.root}>
      {/* ── STAGE — pinned; structurally cannot leave the screen ─────────── */}
      <View style={styles.stageWrap}>
        <View style={[styles.glass, { height: glassH }]} onLayout={(e) => setGlassW(Math.round(e.nativeEvent.layout.width) - 2)}>
          {glassW > 0 ? stage.render(glassW, glassH - 2) : null}
          {/* Smoked-glass sheen (ToolsHub TileGlass language). Decorative. */}
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.015)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.14)']}
            locations={[0, 0.4, 0.8, 1]}
            style={StyleSheet.absoluteFill}
          />
          {laneActive && bound ? (
            <View style={styles.dragTag} pointerEvents="none">
              <Text style={styles.dragTagText} numberOfLines={1}>
                {bound.label}  {bound.format(bound.value)}
              </Text>
            </View>
          ) : null}
        </View>
        {stage.bezel?.length || stage.onGuide ? (
          <BezelReadouts items={stage.bezel ?? []} onGuide={stage.onGuide} onHelp={onHelp} />
        ) : null}
        {stage.badge ? (
          // Honesty badge: silk-screened on the FACEPLATE under the unit —
          // never floated over the glass (owner 2026-08-23: no hover objects
          // may block the display). Still pinned with it.
          <Text style={styles.badgeStrip} numberOfLines={1}>
            {stage.badge}
          </Text>
        ) : null}
      </View>

      {/* ── WELL — the only scroller; trays overlay THIS zone only ───────── */}
      <View style={styles.wellWrap}>
        <ScrollLockProvider value={setWellLocked}>
          <ScrollView contentContainerStyle={styles.well} scrollEnabled={!wellLocked}>
            {typeof children === 'function' ? children({ setScrollLocked: setWellLocked }) : children}
          </ScrollView>
        </ScrollLockProvider>
        <DockTray param={trayParam} onClose={() => setOpenTrayId(null)} onHelp={onHelp} />
      </View>

      {/* ── DOCK — lane + strip; pinned. Bottom safe-area respected so the
             keys never sit in the home-indicator / gesture zone. ───────────── */}
      <View style={[styles.dock, { paddingBottom: 9 + insets.bottom }]}>
        {bound ? (
          <ParamLane
            label={bound.label}
            value={bound.value}
            readout={bound.format(bound.value)}
            onChange={bound.onChange}
            onDragActive={setLaneActive}
            tint={bound.tint}
          />
        ) : null}
        <View style={styles.strip}>
          {params.map((p) => {
            switch (p.kind) {
              case 'fader':
                return (
                  <DockButton
                    key={p.id}
                    label={p.label}
                    value={(p.formatShort ?? p.format)(p.value)}
                    glyph="▪"
                    selected={effBoundId === p.id}
                    onPress={() => {
                      if (hapticsEnabled()) Haptics.selectionAsync().catch(() => {});
                      setBoundId(p.id);
                    }}
                    onLongPress={p.helpKey ? () => onHelp?.(p.helpKey) : undefined}
                    a11y={`${p.label}: ${p.format(p.value)}. Tap to adjust on the fader.`}
                  />
                );
              case 'options':
              case 'group':
                return (
                  <DockButton
                    key={p.id}
                    label={p.label}
                    value={p.valueLabel}
                    glyph="▸"
                    selected={openTrayId === p.id}
                    onPress={() => setOpenTrayId((cur) => (cur === p.id ? null : p.id))}
                    onLongPress={p.helpKey ? () => onHelp?.(p.helpKey) : undefined}
                    a11y={`${p.label}: ${p.valueLabel}. Tap to open the chooser.`}
                  />
                );
              case 'toggle':
                // Distinct KEY skin + LED: amber-selected means "bound/open"
                // ONLY (the two-verb rule); an ON toggle must not impersonate it.
                return (
                  <DockButton
                    key={p.id}
                    label={p.label}
                    value=""
                    variant="key"
                    led={p.value}
                    onPress={p.onToggle}
                    onLongPress={p.helpKey ? () => onHelp?.(p.helpKey) : undefined}
                    a11y={`${p.label}: ${p.value ? 'on' : 'off'}. Tap to toggle.`}
                  />
                );
              case 'action':
                return <DockButton key={p.id} label={p.label} value="" variant="key" onPress={p.onPress} a11y={p.label} />;
            }
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // The stage sits on the faceplate: a slim metallic margin around the glass,
  // with breathing room below the shell's mode tabs (owner 2026-08-23).
  stageWrap: { paddingHorizontal: 10, paddingTop: 10 },
  glass: {
    borderWidth: 1,
    borderColor: '#3a3a44',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#0c0c0f',
    overflow: 'hidden',
  },
  badgeStrip: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: '#6d6f75',
    textAlign: 'center',
    paddingTop: 4,
    paddingBottom: 1,
    paddingHorizontal: 8,
  },
  dragTag: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    backgroundColor: colors.amber,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  dragTagText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.5, color: '#0c0c0c' },
  wellWrap: { flex: 1, position: 'relative' },
  well: { padding: 12, paddingBottom: 18, gap: 10 },
  dock: {
    borderTopWidth: 1,
    borderTopColor: '#2c2c33',
    backgroundColor: '#101114',
    paddingHorizontal: 8,
    paddingTop: 7,
    paddingBottom: 9,
    gap: 7,
  },
  strip: { flexDirection: 'row', gap: 6 },
});

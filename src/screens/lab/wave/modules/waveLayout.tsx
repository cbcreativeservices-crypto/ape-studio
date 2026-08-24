/**
 * WaveLayout — the ONE standard top-to-bottom order for every Wave Physics
 * module (owner 2026-08-05):
 *
 *   title (in the screen header) → explanations → readouts → pressure/wave-
 *   field/rays/arrivals LAYER buttons → primary display → secondary display →
 *   "what the display shows" button → remaining controls (SLIDERS first, then
 *   other buttons) → common mistakes → check yourself.
 *
 * The order lives HERE alone, so every one of the 16 modules matches and a
 * future reorder is a single-place change (not 16 edits).
 *
 * RACK MODE (APE_LAB_UX_PROPOSAL 2026-08-23): a module that passes `rack`
 * renders as the Rack Unit instead — its display PINS on the stage (glass
 * w/h), its readouts print on the bezel, its controls become the dock
 * (lane + trays), and the remaining slots (explain → secondary → guide →
 * undocked controls → mistakes → check) scroll in the well, with the
 * guided-lesson entry at the bottom (the host's row is skipped in rack mode).
 * The layout law: reading may scroll; operating may not.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { PanelCard } from '../../digital/bits';
import { RackUnit } from '../../rack/RackUnit';
import type { BezelItem, DockParam, StageSize } from '../../rack/rackTypes';

/** A wave module's Rack Unit declaration (see rackTypes for the grammar). */
export type WaveRack = {
  /** The pinned display, sized by the glass (replaces the `display` slot). */
  stage: (w: number, h: number) => ReactNode;
  size?: StageSize;
  /** Honesty badge — keep the module's display badge text verbatim. */
  badge?: string;
  /** Live readouts printed on the glass bezel (3–4 cells). */
  bezel?: BezelItem[];
  params: DockParam[];
  initialParam: string;
  /** ⓘ display-guide entry (replaces the DisplayGuideButton). */
  onGuide?: () => void;
  /** helpKey → the 'wave' guided lesson (dock/bezel long-presses + the
   *  well's lesson entry row). */
  onHelp?: (key?: string) => void;
};

export function WaveLayout({
  explain,
  readouts,
  layers,
  display,
  secondary,
  guide,
  controls,
  mistakes,
  check,
  rack,
}: {
  /** Prose explanation card(s) — rendered FIRST, right under the title. */
  explain?: ReactNode;
  /** ReadoutGrid of live engine numbers (rack mode: put the top numbers on
   *  the bezel instead; this slot then holds any overflow). */
  readouts?: ReactNode;
  /** PRESSURE / WAVE FIELD / RAYS / ARRIVALS layer chips (rack mode: move
   *  them into a dock tray and leave this slot empty). */
  layers?: ReactNode;
  /** The primary scene/display (required in classic mode; unused when `rack`
   *  provides the stage). */
  display?: ReactNode;
  /** An optional secondary display below the primary (e.g. a response curve).
   *  In rack mode it scrolls in the well. */
  secondary?: ReactNode;
  /** The "what the display shows" button — classic mode only (rack mode uses
   *  the bezel's ⓘ via `rack.onGuide`). */
  guide?: ReactNode;
  /** Remaining controls, SLIDERS first then other buttons. In rack mode, only
   *  controls that did NOT move to the dock belong here. */
  controls?: ReactNode;
  /** Common-mistakes card. */
  mistakes?: ReactNode;
  /** Check-yourself question. */
  check?: ReactNode;
  /** RACK UNIT opt-in — the module's stage/bezel/dock declaration. */
  rack?: WaveRack;
}) {
  if (rack) {
    return (
      <RackUnit
        stage={{
          render: rack.stage,
          size: rack.size ?? 'L',
          badge: rack.badge,
          bezel: rack.bezel,
          onGuide: rack.onGuide,
        }}
        params={rack.params}
        initialParam={rack.initialParam}
        onHelp={rack.onHelp}
      >
        <View style={{ gap: 12 }}>
          {explain}
          {readouts}
          {secondary}
          {controls}
          {mistakes}
          {check}
          {/* Guided-lesson entry lives at the BOTTOM (owner 2026-07-29) — the
              host's row is outside the rack, so the well carries its own. */}
          <Pressable
            style={styles.lessonRow}
            onPress={() => rack.onHelp?.(undefined)}
            accessibilityRole="button"
            accessibilityLabel="Open the guided lesson"
          >
            <Text style={styles.lessonRowText}>ⓘ GUIDED LESSON — every control long-presses for its own entry</Text>
          </Pressable>
        </View>
      </RackUnit>
    );
  }
  return (
    <View style={{ gap: 12 }}>
      {explain}
      <PanelCard>
        {readouts}
        {layers}
        {display}
        {secondary}
        {guide}
        {controls}
      </PanelCard>
      {mistakes}
      {check}
    </View>
  );
}

const styles = StyleSheet.create({
  // Mirrors WaveModuleScreen's lessonRow (LabShell v2 styling).
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
});

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
 * future reorder is a single-place change (not 16 edits). Each module composes
 * its own pieces and drops them into the named slots; the interactive middle
 * (readouts → layers → display → guide → controls) is wrapped in one PanelCard.
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { PanelCard } from '../../digital/bits';

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
}: {
  /** Prose explanation card(s) — rendered FIRST, right under the title. */
  explain?: ReactNode;
  /** ReadoutGrid of live engine numbers. */
  readouts?: ReactNode;
  /** PRESSURE / WAVE FIELD / RAYS / ARRIVALS layer chips. */
  layers?: ReactNode;
  /** The primary scene/display (required). */
  display: ReactNode;
  /** An optional secondary display below the primary (e.g. a response curve). */
  secondary?: ReactNode;
  /** The "what the display shows" button — sits BELOW the display(s). */
  guide?: ReactNode;
  /** Remaining controls, SLIDERS first then other buttons. */
  controls?: ReactNode;
  /** Common-mistakes card. */
  mistakes?: ReactNode;
  /** Check-yourself question. */
  check?: ReactNode;
}) {
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

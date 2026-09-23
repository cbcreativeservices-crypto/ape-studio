/**
 * DimModal — a drop-in replacement for react-native's `Modal` that keeps
 * Low-Light Production Mode's promise.
 *
 * WHY THIS EXISTS. A React Native `Modal` renders in its OWN native container,
 * above everything the app's view tree paints — so the low-light dim wash never
 * reaches inside one. The mode promises "the display stays dim and steady, so
 * nothing flashes during a show", and every un-washed modal breaks it: tap a
 * glossary term or open a colour picker mid-show and the screen jumps to full
 * brightness.
 *
 * Three modals (ShareTermSheet, StudyFsOverlay, TrophyModal) had already hit
 * this and each hand-mounted `<LowLightDim />` inside itself. Twenty-six others
 * had not — which is the real problem: remembering is not a mechanism. Import
 * `Modal` from here and the wash comes with it.
 *
 * Everything else is untouched: props pass straight through, and `LowLightDim`
 * renders null whenever the mode is off (or while the activation notice is
 * still being read), so this costs nothing in the normal case.
 */
import type { ReactNode } from 'react';
import { Modal as RNModal, type ModalProps } from 'react-native';
import { LowLightDim } from '../features/settings/LowLightLayer';
import { ALL_ORIENTATIONS } from './modalOrientations';

/**
 * ⛔ iOS CRASHES A MODAL THAT CANNOT FACE THE WAY THE APP IS FACING.
 *
 * `supportedOrientations` defaults to `['portrait']`. Present a Modal while the
 * interface is locked LANDSCAPE and UIKit raises
 * `UIApplicationInvalidInterfaceOrientation` — "supported orientations has no
 * common orientation with the application" — which is a hard native crash, not
 * a JS error anything can catch.
 *
 * CRASH, reported 2026-09-23: SPL Meter → fullscreen → colour wheel. The
 * fullscreen VU/Gauge sets `orientation: 'landscape'`
 * (SplMeterScreen.tsx:883), and the colour wheel opens LedColorPicker, which is
 * one of these. The lesson was already known and written down — in
 * `HarmonographViewer.tsx:15`, as "MODAL RULES (SplMeter lessons): ONE native
 * Modal, both-orientation supportedOrientations for iOS" — but it was recorded
 * in the file that LEARNED it rather than enforced anywhere, so the SPL Meter's
 * own picker never got it. That is this file's whole argument, already made
 * above for the low-light wash: remembering is not a mechanism.
 *
 * Allowing every orientation does NOT let a modal spin freely on a locked
 * screen. react-native-screens owns the lock and the modal follows the
 * interface; this only stops UIKit refusing to present it at all. A caller that
 * genuinely needs to pin a modal can still pass its own value.
 */

export function Modal({
  children,
  supportedOrientations = ALL_ORIENTATIONS,
  ...rest
}: ModalProps & { children?: ReactNode }) {
  return (
    <RNModal supportedOrientations={supportedOrientations} {...rest}>
      {children}
      {/* Last child, so it washes over the modal's own content. It is
          pointerEvents="none", so nothing below it loses a touch. */}
      <LowLightDim />
    </RNModal>
  );
}

export type { ModalProps };

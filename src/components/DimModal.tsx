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

export function Modal({ children, ...rest }: ModalProps & { children?: ReactNode }) {
  return (
    <RNModal {...rest}>
      {children}
      {/* Last child, so it washes over the modal's own content. It is
          pointerEvents="none", so nothing below it loses a touch. */}
      <LowLightDim />
    </RNModal>
  );
}

export type { ModalProps };

/**
 * The orientations a native Modal is allowed to face.
 *
 * ⛔ iOS CRASHES A MODAL THAT CANNOT FACE THE WAY THE APP IS FACING.
 * React Native's `supportedOrientations` defaults to `['portrait']`. Present a
 * Modal while the interface is locked LANDSCAPE and UIKit raises
 * `UIApplicationInvalidInterfaceOrientation` — "supported orientations has no
 * common orientation with the application" — a hard native crash that no JS
 * `try/catch` can see.
 *
 * This app locks landscape in several places (the SPL Meter's fullscreen VU and
 * gauge, the Harmonograph viewer, the amplitude labs), and help sheets, screen
 * intros, trophies and colour pickers can all open over them.
 *
 * ⚠️ ITS OWN MODULE ON PURPOSE. `DimModal` imports `LowLightDim` from
 * `features/settings/LowLightLayer`, and that file renders a Modal of its own —
 * so keeping this constant here is what stops the import cycle.
 *
 * Allowing every orientation does NOT let a modal spin freely on a locked
 * screen: react-native-screens owns the lock and the modal follows the
 * interface. It only stops UIKit refusing to present it.
 */
import type { ModalProps } from 'react-native';

export const ALL_ORIENTATIONS: ModalProps['supportedOrientations'] = [
  'portrait',
  'portrait-upside-down',
  'landscape',
  'landscape-left',
  'landscape-right',
];

/**
 * keyboardControllerSafe — guarded access to react-native-keyboard-controller.
 *
 * That library builds a NativeEventEmitter AT IMPORT, which THROWS ("doesn't
 * seem to be linked") in any build that predates the dependency — crashing the
 * whole app on the current dev client. We require() it behind a try/catch so a
 * client without the native module falls back to plain RN components (no
 * keyboard avoidance, but no crash). The real behavior activates once a new EAS
 * build bundles the module (owner 2026-08-02).
 */
import type { ComponentType, ReactNode, Ref } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';

type KAScrollProps = ScrollViewProps & {
  bottomOffset?: number;
  children?: ReactNode;
  /** Forwarded to the underlying ScrollView so callers can drive it (e.g. the
   *  calculators scrollTo-pin their input panel on focus). Both the real
   *  library and the fallback below hand this straight to a ScrollView. */
  ref?: Ref<ScrollView>;
};

let KeyboardProvider: ComponentType<{ children?: ReactNode }>;
let KeyboardAwareScrollView: ComponentType<KAScrollProps>;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const kc = require('react-native-keyboard-controller');
  KeyboardProvider = kc.KeyboardProvider;
  KeyboardAwareScrollView = kc.KeyboardAwareScrollView;
} catch {
  KeyboardProvider = ({ children }: { children?: ReactNode }) => <>{children}</>;
  // Drop the keyboard-controller-only prop and render a plain ScrollView.
  KeyboardAwareScrollView = ({ bottomOffset: _bottomOffset, ...rest }: KAScrollProps) => (
    <ScrollView {...rest} />
  );
}

export { KeyboardProvider, KeyboardAwareScrollView };

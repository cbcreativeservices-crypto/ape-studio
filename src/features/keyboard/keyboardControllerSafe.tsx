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
import { Platform, ScrollView, type ScrollViewProps } from 'react-native';

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
/** Sticky bar above the keyboard carrying a DONE button. Mounted ONCE at the
 *  app root, it gives every TextInput in the app a way out — owner 2026-08-31:
 *  "sometimes the keyboard opens and there is no way to close it". Falls back
 *  to nothing on a build without the native module, exactly like the rest of
 *  this file. */
let KeyboardToolbar: ComponentType<Record<string, unknown>>;

/** A SECOND way out of the keyboard, on every scroll surface: drag the content
 *  and the keyboard goes down. Applied as a DEFAULT here rather than at ~40
 *  call sites, and still overridable per screen. */
const DISMISS_ON_DRAG: ScrollViewProps['keyboardDismissMode'] =
  Platform.OS === 'ios' ? 'interactive' : 'on-drag';

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const kc = require('react-native-keyboard-controller');
  KeyboardProvider = kc.KeyboardProvider;
  const RealKAScroll = kc.KeyboardAwareScrollView as ComponentType<KAScrollProps>;
  KeyboardAwareScrollView = (props: KAScrollProps) => (
    <RealKAScroll keyboardDismissMode={DISMISS_ON_DRAG} {...props} />
  );
  // Web has no keyboard events (the library's web bindings are no-ops), so its
  // DONE bar never hides: it overflowed the document by 42 px and any tab-bar
  // tap scrolled the whole app up by that much, pushing every screen's header
  // off-screen (Bug+Hater night C1-01). Native keeps the real toolbar.
  KeyboardToolbar = Platform.OS === 'web' ? () => null : kc.KeyboardToolbar;
} catch {
  KeyboardProvider = ({ children }: { children?: ReactNode }) => <>{children}</>;
  // Drop the keyboard-controller-only prop and render a plain ScrollView.
  KeyboardAwareScrollView = ({ bottomOffset: _bottomOffset, ...rest }: KAScrollProps) => (
    <ScrollView keyboardDismissMode={DISMISS_ON_DRAG} {...rest} />
  );
  KeyboardToolbar = () => null;
}

export { KeyboardProvider, KeyboardAwareScrollView, KeyboardToolbar };

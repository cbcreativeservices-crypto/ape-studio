/**
 * ScreenErrorBoundary — per-screen containment INSIDE the navigator (2026-09-11).
 *
 * WHY THIS EXISTS. RootErrorBoundary (src/components/RootErrorBoundary.tsx) sits
 * above SafeAreaProvider / EntitlementProvider / AudioOutputGate /
 * NavigationContainer, so until now ONE broken lab page unmounted the ENTIRE
 * app and "TRY AGAIN" restarted the user at the initial route. That gap was
 * written up in RootErrorBoundary's header and left for implementation. This is
 * the implementation: a boundary per screen, so a render error is contained to
 * the screen that threw and the session — providers, audio gate, navigation
 * history, the bottom tab bar — stays alive underneath it.
 *
 * WHERE IT ATTACHES. Via each navigator's `screenLayout` (React Navigation 7),
 * NOT around the navigator and not around the <Stack.Screen> element. In core's
 * useDescriptors the layout wraps the route's SceneView, and native-stack renders
 * that inside the native <Screen>'s content — BELOW the header and inside the
 * card. So header rendering, `presentation`, `animation`, `gestureEnabled` and
 * the swipe-back recogniser are all untouched: they are Screen-level options
 * this component never sees. It also means every screen is covered, including
 * ones added later — the same reason `screenLayout` was chosen for LowLightDim.
 *
 * NO LAYOUT FOOTPRINT. While healthy it returns its children in a Fragment —
 * no host view, so nothing changes for the screen beneath it (a wrapper View
 * here would have broken every screen that relies on the native Screen's
 * `flex: 1`). Only the fallback introduces a view, and that view IS the screen.
 *
 * REMOUNT. React unmounts the whole subtree under a boundary when it catches, so
 * clearing `error` mounts the screen FRESH (new component instances, new state)
 * rather than re-showing a half-broken tree. Going back is plain
 * `navigation.goBack()` — the stack pops and the screen unmounts with its
 * boundary. For screens that stay mounted while blurred (tab scenes), the blur
 * listener clears the error so returning to the tab gets a fresh attempt rather
 * than a stale error card.
 *
 * Kept deliberately tiny and dependency-free for the same reason as the root
 * boundary: the thing it is catching may be the theme, the store, or the engine.
 * Colours are inlined and copied from RootErrorBoundary so the app has ONE
 * failure look, not two.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * The slice of the screen's navigation object this needs. Structural on purpose:
 * the same component is handed a native-stack navigation and a bottom-tabs one.
 */
export type ScreenBoundaryNavigation = {
  canGoBack: () => boolean;
  goBack: () => void;
  addListener: (type: 'blur', callback: () => void) => () => void;
};

type Props = {
  children: ReactNode;
  navigation: ScreenBoundaryNavigation;
  /** Route name — used for the crash log line and the __DEV__ readout only. */
  routeName?: string;
};
type State = { error: Error | null };

export class ScreenErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  private unsubscribeBlur: (() => void) | undefined;

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidMount(): void {
    // Tab scenes are NOT unmounted when you switch away, so without this a
    // screen that failed once would still be showing the error card the next
    // time the user opened that tab. Resetting on blur means the next visit
    // re-mounts it fresh. (Stack screens unmount on pop, where this is a no-op.)
    this.unsubscribeBlur = this.props.navigation.addListener('blur', () => {
      if (this.state.error) this.setState({ error: null });
    });
  }

  componentWillUnmount(): void {
    this.unsubscribeBlur?.();
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Same caveat as RootErrorBoundary: there is no babel transform stripping
    // console in release, so this line ships and writes to logcat / os_log. It
    // stays because a render-crash trace is the only breadcrumb we have.
    console.error(
      `[app] uncaught render error in screen ${this.props.routeName ?? '(unknown)'}:`,
      error,
      info.componentStack,
    );
  }

  private handleTryAgain = (): void => {
    this.setState({ error: null });
  };

  private handleGoBack = (): void => {
    const { navigation } = this.props;
    // Deliberately does NOT clear the error first: re-rendering the broken
    // screen on the way out would just throw again mid-transition. The screen
    // unmounts with the pop; if it is a tab scene that survives, the blur
    // listener above resets it.
    if (navigation.canGoBack()) navigation.goBack();
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return <>{this.props.children}</>;
    const canGoBack = this.props.navigation.canGoBack();
    return (
      <View style={styles.root}>
        {/* NEW USER-FACING COPY (2026-09-11) — owner ratification pending.
            Unlike the root boundary this one CAN honestly say the rest of the
            app survived, because it is inside the navigator: only this screen
            was torn down. */}
        <Text style={styles.title}>THIS SCREEN STOPPED</Text>
        <Text style={styles.body}>
          This screen hit an unexpected error and stopped. The rest of the app is still running and
          your saved work is untouched.
        </Text>
        <View style={styles.row}>
          <Pressable
            style={styles.btn}
            onPress={this.handleTryAgain}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text style={styles.btnText}>TRY AGAIN</Text>
          </Pressable>
          {canGoBack ? (
            <Pressable
              style={[styles.btn, styles.btnGhost]}
              onPress={this.handleGoBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={[styles.btnText, styles.btnTextGhost]}>GO BACK</Text>
            </Pressable>
          ) : null}
        </View>
        {__DEV__ ? (
          <Text style={styles.dev}>
            {this.props.routeName ? `${this.props.routeName} — ` : ''}
            {String(error?.message ?? error)}
          </Text>
        ) : null}
      </View>
    );
  }
}

// Colours/metrics intentionally identical to RootErrorBoundary — one failure
// look across the app, and no theme import that could itself be the fault.
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0c0c0f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 14,
  },
  title: { color: '#ffc64d', fontSize: 15, letterSpacing: 1.6, fontWeight: '600' },
  body: { color: '#a9a9b4', fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 420 },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 6 },
  btn: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 26,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.6)',
    backgroundColor: '#0c1a10',
  },
  btnText: { color: '#37e05f', fontSize: 13, letterSpacing: 1.4, fontWeight: '600' },
  btnGhost: { borderColor: '#3a3a44', backgroundColor: 'transparent' },
  btnTextGhost: { color: '#a9a9b4' },
  dev: { color: '#7a7f8a', fontSize: 11, textAlign: 'center', marginTop: 10, maxWidth: 420 },
});

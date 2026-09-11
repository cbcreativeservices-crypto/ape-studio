/**
 * RootErrorBoundary — the app's last line of defence (QA night 2026-09-01).
 *
 * The overnight sweep proved the gap: one uncaught render error (a fretboard
 * tap that produced a NaN index) unmounted the ENTIRE app to a white screen,
 * with no message and no way back but a full reload. A shipped app must never
 * do that to a user in a rehearsal room.
 *
 * React error boundaries only catch RENDER-phase errors — an async rejection
 * still slips past — but that is exactly the class that white-screens, so this
 * is the high-value catch. It stays deliberately tiny and dependency-free: no
 * navigation, no theme provider, no store reads, because the thing it is
 * catching may be the very thing that broke. Colours are inlined for the same
 * reason.
 *
 * The reset button re-mounts the tree by clearing the error state. If the fault
 * is in a screen the user can leave, that is enough; if it re-throws, the same
 * honest screen comes back rather than a blank one.
 *
 * SCOPE — this is the ONLY error boundary in the app (verified 2026-09-11), and
 * it sits above SafeAreaProvider / EntitlementProvider / AudioOutputGate /
 * NavigationContainer. So a render error in ANY single screen tears down the
 * whole tree, and TRY AGAIN restarts at the initial route rather than returning
 * the user to what they were doing. That is a deliberate trade (a tiny,
 * dependency-free boundary cannot rely on the things it may be catching), but
 * per-screen boundaries inside RootNavigator would contain the damage to one
 * screen and keep the rest of the session alive. Filed for the owner rather
 * than done unattended: wrapping every screen is a structural change to the
 * navigator and interacts with transitions and gestures.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // CORRECTION (security pass 2026-09-11): this used to claim "release builds
    // stay quiet". They do NOT — there is no babel.config.js, so
    // transform-remove-console is not applied and this line runs in the shipped
    // binary, writing to logcat / os_log. It stays because a render-crash trace
    // is the only breadcrumb we have (no crash reporter is installed), but be
    // aware any thrown message that embeds user text is logged with it.
    // Readable only with physical/ADB access, not by other apps.
    console.error('[app] uncaught render error:', error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <View style={styles.root}>
        <Text style={styles.title}>SOMETHING WENT WRONG</Text>
        {/* HONEST COPY (2026-09-11): this used to say it "stopped that screen
            so nothing else was affected". It is the ROOT boundary and the only
            one in the app, so it unmounts the entire tree — providers, audio
            gate and navigator included — and TRY AGAIN remounts from the
            start. Saying otherwise told the user their place was kept when it
            was not. NEW USER-FACING COPY — owner review. */}
        <Text style={styles.body}>
          The app hit an unexpected error and had to stop. Your saved work is untouched — tap below
          to start again from the home screen.
        </Text>
        <Pressable
          style={styles.btn}
          onPress={() => this.setState({ error: null })}
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <Text style={styles.btnText}>TRY AGAIN</Text>
        </Pressable>
        {__DEV__ ? <Text style={styles.dev}>{String(error?.message ?? error)}</Text> : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0c0c0f', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
  title: { color: '#ffc64d', fontSize: 15, letterSpacing: 1.6, fontWeight: '600' },
  body: { color: '#a9a9b4', fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 420 },
  btn: {
    marginTop: 6,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 26,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.6)',
    backgroundColor: '#0c1a10',
  },
  btnText: { color: '#37e05f', fontSize: 13, letterSpacing: 1.4, fontWeight: '600' },
  dev: { color: '#7a7f8a', fontSize: 11, textAlign: 'center', marginTop: 10, maxWidth: 420 },
});

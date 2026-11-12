/**
 * GaEngineHost — gives the Game Audio lab's GaEngine a TRANSPORT for as long
 * as the lab is mounted, and takes it away when the lab closes.
 *
 *   web build   the page's own Web Audio: the engine source is evaluated once
 *               and called directly (samples cross as Float32Array).
 *   phone       a hidden web view runs the same source (engine/gaEngineSource
 *               gaEngineHtml); commands go in through injectJavaScript, events
 *               come back through onMessage (samples cross as base64 16-bit).
 *               react-native-webview is already in the store builds (the
 *               certificate renderer uses it), so this is JS only.
 *
 * NOT YET PROVEN ON A PHONE (2026-11-12, must-do D60): the Pixel was not
 * connected and the iPhone needs a preview update. The engine check screen
 * (GameAudioEngineCheckScreen) is the proof to run there. Points to watch:
 * iOS ring/silent switch (the engine asks for the 'playback' audio session),
 * and whether a 1-pt web view keeps its audio clock running.
 *
 * No web view in this binary → the engine is marked unavailable and the lab
 * says so in words; nothing pretends to play.
 */
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { optionalModule } from '../../../../features/tools/capture/optionalModule';
import type { GaEngine, GaTransport } from './gaEngine';
import type { GaCmd, GaEvt } from './gaEngineProtocol';
import { GA_ENGINE_JS, gaEngineHtml } from './gaEngineSource';

type WebViewLib = { WebView: (props: Record<string, unknown>) => ReactNode };
type EngineFactory = (o: { post: (m: GaEvt) => void; AudioContext: unknown }) => { handle: (m: GaCmd) => void };

/** The web build's transport: the engine runs in this page. */
function createWebTransport(post: (m: GaEvt) => void): GaTransport | null {
  const w = globalThis as unknown as Record<string, unknown>;
  const AC = w.AudioContext ?? w.webkitAudioContext;
  if (!AC) return null;
  if (typeof w.__gaCreateEngine !== 'function') {
    // eslint-disable-next-line no-new-func
    new Function('window', GA_ENGINE_JS)(w);
  }
  const eng = (w.__gaCreateEngine as EngineFactory)({ post, AudioContext: AC });
  return {
    kind: 'web',
    send: (cmd) => eng.handle(cmd),
    dispose: () => eng.handle({ t: 'dispose' }),
  };
}

function WebHost({ engine }: { engine: GaEngine }) {
  useEffect(() => {
    const t = createWebTransport(engine.receive);
    if (!t) {
      engine.markUnavailable('This browser has no Web Audio engine.');
      return;
    }
    engine.attach(t);
    return () => engine.detach();
  }, [engine]);
  return null;
}

function PhoneHost({ engine }: { engine: GaEngine }) {
  const WebView = optionalModule<WebViewLib>('react-native-webview')?.WebView;
  const ref = useRef<{ injectJavaScript: (js: string) => void } | null>(null);
  const attached = useRef(false);
  const html = useMemo(() => gaEngineHtml(), []);

  useEffect(() => {
    if (!WebView) engine.markUnavailable('This app build has no web view for the sound engine.');
    return () => {
      attached.current = false;
      engine.detach();
    };
  }, [WebView, engine]);

  if (!WebView) return null;

  const onMessage = (ev: { nativeEvent: { data: string } }) => {
    let msg: GaEvt;
    try {
      msg = JSON.parse(ev.nativeEvent.data) as GaEvt;
    } catch {
      return;
    }
    if (!attached.current) {
      // the page's first message means its bridge is up: attach now
      attached.current = true;
      engine.attach({
        kind: 'webview',
        send: (cmd) => ref.current?.injectJavaScript(`window.__ga(${JSON.stringify(cmd)});true;`),
        dispose: () => ref.current?.injectJavaScript('window.__ga({"t":"dispose"});true;'),
      });
      return;
    }
    engine.receive(msg);
  };

  return (
    <View style={styles.hidden} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <WebView
        ref={ref}
        source={{ html }}
        originWhitelist={['*']}
        javaScriptEnabled
        // a sound the learner started must not wait for a tap INSIDE the page
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        onMessage={onMessage}
        onError={() => engine.markUnavailable('The sound engine page could not load.')}
        style={styles.page}
      />
    </View>
  );
}

/** Mount once, at the lab's root. Renders nothing the learner can see. */
export const GaEngineHost: (p: { engine: GaEngine }) => ReactNode = Platform.OS === 'web' ? WebHost : PhoneHost;

const styles = StyleSheet.create({
  // 1 pt and almost transparent rather than display:none — a web view that is
  // not laid out can have its timers and audio clock throttled.
  hidden: { position: 'absolute', left: 0, top: 0, width: 1, height: 1, opacity: 0.01, overflow: 'hidden' },
  page: { width: 1, height: 1, backgroundColor: 'transparent' },
});

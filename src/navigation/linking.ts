/**
 * Deep-link / universal-link map (app discoverability pass, 2026-09-05).
 *
 * ONE table shared by three surfaces:
 *   • the custom scheme `proaudio://…` (app.json `scheme`),
 *   • iOS Universal Links + Android App Links on proaudiotrainingacademy.com
 *     (app.json `ios.associatedDomains` / `android.intentFilters` — the
 *     website's AASA + assetlinks files complete the handshake, see
 *     docs/APE_WEBSITE_SEO_NOTES_2026_09_05.md),
 *   • the share URLs the app prints (glossary term shares, once the site has
 *     the pages).
 *
 * The pure path rules live in ./linkPaths.ts (tested); this file is only the
 * React Navigation wiring.
 *
 * Cold start: `initialRouteName: 'Splash'` keeps the boot screen UNDER the
 * linked screen, so session restore still runs; Splash already carries the
 * routes above it across its reset (push-tap lesson, 2026-08).
 */
import { Platform } from 'react-native';
import { CommonActions, getStateFromPath, type LinkingOptions } from '@react-navigation/native';
import { navigationRef } from './navigationRef';
import type { RootStackParamList } from './types';
import { websiteUrl } from '../features/commercial/brand';
import { APP_SCHEME, isAcceptedLink, LINK_HOSTS, slugify } from './linkPaths';

export {
  APP_SCHEME,
  glossaryTermSlug,
  isAcceptedLink,
  isClaimedPath,
  linkPath,
  parseLink,
  slugify,
  slugToQuery,
} from './linkPaths';

export const linking: LinkingOptions<RootStackParamList> = {
  // Native only: the browser harness (#<screen>preview hash routes) must keep
  // its address bar untouched, and the public web app is the Next.js site.
  enabled: Platform.OS !== 'web',
  prefixes: [`${APP_SCHEME}://`, ...LINK_HOSTS.map((h) => `https://${h}`)],
  // ONE gate for every incoming URL: parseable, a host we accept, and a path we
  // handle well. React Navigation's own prefix match is a plain string compare,
  // so `https://proaudiotrainingacademy.com@evil.example/tools` passes it —
  // isAcceptedLink re-checks the real authority. See linkPaths.ts.
  filter: isAcceptedLink,
  config: {
    initialRouteName: 'Splash',
    screens: {
      // The Home tab is the app's landing, and `/topics/<slug>` opens the
      // Study tab's Dashboard fronted on that topic (absolute nested path).
      Main: {
        path: 'get',
        screens: {
          Study: { screens: { Dashboard: '/topics/:topicSlug' } },
        },
      },
      // Measurement & Analysis
      ToolsHub: 'tools',
      MultiMeter: 'tools/multimeter',
      FrequencyCounter: 'tools/frequency-counter',
      ToolInfo: 'tools/:toolKey',
      // Audio Learning
      AudioLearning: 'learn',
      EarLab: 'labs',
      HarmonographLab: 'labs/harmonograph',
      HarmonicLab: 'labs/harmonic',
      OscillatorLab: 'labs/oscillator',
      NoiseLab: 'labs/noise',
      EqLab: 'labs/eq',
      CompressionLab: 'labs/compression',
      ReverbLab: 'labs/reverb',
      DelayLab: 'labs/delay',
      MicLab: 'labs/microphone',
      SpeakerLab: 'labs/speaker',
      TubeLab: 'labs/tubes',
      CalcLab: 'labs/calculator',
      DigitalLab: 'labs/digital',
      CableInstallLab: 'labs/cable-installation',
      LabCategory: 'labs/:id', // unknown ids render the screen's own "not available" state
      // Glossary — the public browse path; works signed-in or anonymous.
      PublicGlossary: 'glossary/:query?',
      // Awards / community / careers
      Awards: 'awards/:category',
      AudioCommunityDirectory: 'directory',
      CareerFinder: 'careers',
    },
  },
};

/** Canonical HTTPS URL for a glossary term — the page the website will host
 *  and the line a term share will print once it exists. */
export function glossaryTermUrl(term: string): string {
  const slug = slugify(term);
  return slug ? `${websiteUrl()}/glossary/${slug}` : `${websiteUrl()}/glossary`;
}

/**
 * Navigate to an already-validated app PATH (no scheme, no host) using the very
 * same `config` the linking system uses, so there is exactly one URL→screen
 * table in the app. Used to resume a destination the user asked for before
 * being sent through sign-in — see navigation/pendingLink.ts.
 *
 * Returns false and does nothing if the path does not resolve or the navigator
 * is not ready; every caller must have a normal fallback, because landing
 * somewhere sensible always beats throwing.
 */
export function navigateToPath(path: string): boolean {
  try {
    if (!navigationRef.isReady()) return false;
    const state = getStateFromPath(path, linking.config);
    const route = state?.routes?.[state.routes.length - 1];
    if (!route) return false;
    // NAVIGATE, never reset. A reset would rebuild the stack from the linking
    // config, which declares `initialRouteName: 'Splash'` for cold starts —
    // Splash would remount underneath and its 2.5 s hand-off would then throw
    // the resumed destination away. Navigating puts the target on top of
    // whatever is already there, so Back still returns somewhere sensible.
    const [name, params] = toNavigateArgs(route);
    navigationRef.dispatch(CommonActions.navigate({ name, params }));
    return true;
  } catch {
    return false;
  }
}

/** Flatten a resolved route (possibly with nested navigator state) into the
 *  `navigate(name, { screen, params })` shape React Navigation expects. */
function toNavigateArgs(route: {
  name: string;
  params?: object;
  state?: { index?: number; routes: { name: string; params?: object; state?: unknown }[] };
}): [string, object | undefined] {
  const child = route.state?.routes?.[route.state.index ?? route.state.routes.length - 1];
  if (!child) return [route.name, route.params];
  const [screen, params] = toNavigateArgs(child as Parameters<typeof toNavigateArgs>[0]);
  return [route.name, { screen, params }];
}

/** Canonical HTTPS URL for a curriculum topic. */
export function topicUrl(topicName: string): string {
  const slug = slugify(topicName);
  return slug ? `${websiteUrl()}/topics/${slug}` : `${websiteUrl()}/topics`;
}

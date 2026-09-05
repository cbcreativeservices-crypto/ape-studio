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
import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';
import { websiteUrl } from '../features/commercial/brand';
import { APP_SCHEME, glossaryTermSlug, isClaimedPath, LINK_HOSTS, linkPath } from './linkPaths';

export { APP_SCHEME, glossaryTermSlug, isClaimedPath, linkPath, slugToQuery } from './linkPaths';

export const linking: LinkingOptions<RootStackParamList> = {
  // Native only: the browser harness (#<screen>preview hash routes) must keep
  // its address bar untouched, and the public web app is the Next.js site.
  enabled: Platform.OS !== 'web',
  prefixes: [`${APP_SCHEME}://`, ...LINK_HOSTS.map((h) => `https://${h}`)],
  filter: (url) => isClaimedPath(linkPath(url)),
  config: {
    initialRouteName: 'Splash',
    screens: {
      Main: 'get',
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
  const slug = glossaryTermSlug(term);
  return slug ? `${websiteUrl()}/glossary/${slug}` : `${websiteUrl()}/glossary`;
}

/**
 * AP&E STUDIO — Theme tokens
 *
 * Visual truth = design-reference/ (studio-hardware language). Per the Phase-2
 * kickoff ratification, these SUPERSEDE the Design-Seed brief §1 tokens
 * (#1a1a1a / #0066ff). Hex values transcribed from design-reference/README.md
 * "Design Tokens" and the component sources. Dark theme, portrait-only.
 */

export const colors = {
  // Surfaces
  screenBg: '#0c0c0c',
  screenBgAlt: '#0a0a0a',
  screenBgDeep: '#08080a',
  splashBg: '#0b0b0b',

  // Panel gradients (use with expo-linear-gradient / LinearGradient stops)
  panelGradient: ['#1e1e1e', '#131313'] as const,
  panelGradientDeep: ['#131313', '#0b0b0b'] as const,

  // Command amber — primary accent
  amber: '#ffc64d',
  amberDeep: '#ffb400',
  amberGradient: ['#ffd35e', '#f09e1a'] as const,
  amberLabel: '#d99f1f', // section eyebrow labels

  /** Marks a RINGING frequency (the CSD waterfall's ridge guide + label, and
   *  the control bound to it). Deliberately OUTSIDE the amplitude ramp: it
   *  names WHICH frequency rings and must never be misread as a level. Lives
   *  here rather than in vizSpectral because that module is behind the Skia
   *  gate, and the meter lab's dock must not pull Skia in to tint a fader. */
  ringing: '#c9a6ff',

  // Accent hues (per-domain, from README color table)
  orange: '#ff8a1e', // Home tab, warnings, "continue" method
  blue: '#2f9bff', // Study tab, selected answers, MIC/PA certs, flashcards
  cyan: '#5bb0ff',
  cyanBright: '#7fd4ff', // Glossary accent
  green: '#37e05f', // Profile tab, success, ear-training
  greenBright: '#5bff85',
  purple: '#b45bff', // Scenarios / platinum accents
  programPurple: '#c4a2ff', // Programs (Awards/Achievements) — softer than `purple`; matches AwardsScreen PURPLE + Curriculum PROGRAMS AVAILABLE tile
  gold: '#ffc233', // Achievements tab, fill-in-blank, gold album
  goldDeep: '#f0b429',
  red: '#ff4b3a', // Errors, REC cert, matching cable
  redAlt: '#ff3b30',

  // Borders
  steelBorder: '#3c3c3c',
  hairline: '#2c2c2c',
  hairlineAlt: '#2e2e2e',
  hairlineDim: '#1e1e1e',
  deepBorder: '#060606',

  // Text — dim grays lifted (owner 2026-08-05: dark-gray text was hard to read
  // on the black tool backgrounds; raised so it pops while keeping hierarchy).
  textPrimary: '#f0f0f0',
  textSecondary: '#e6e6e6',
  textSub: '#a6a6ad',
  textSubAlt: '#9a9aa2',
  textMuted: '#8a8b93',
  textMutedDeep: '#7a7c85',
  black: '#000000',
} as const;

/**
 * Font family names as exported by the @expo-google-fonts/* packages and
 * registered via useFonts() in App.tsx. Reference these — never a raw string —
 * so a rename is caught by the type checker.
 */
export const fonts = {
  // Oswald — headings, eyebrow labels, buttons, nav labels (uppercase)
  oswaldMedium: 'Oswald_500Medium',
  oswaldSemiBold: 'Oswald_600SemiBold',
  oswaldBold: 'Oswald_700Bold',
  // Barlow — body copy, questions, definitions
  barlowRegular: 'Barlow_400Regular',
  barlowMedium: 'Barlow_500Medium',
  barlowSemiBold: 'Barlow_600SemiBold',
  // Barlow Condensed — small captions / meta
  barlowCondensedRegular: 'BarlowCondensed_400Regular',
  barlowCondensedMedium: 'BarlowCondensed_500Medium',
  barlowCondensedSemiBold: 'BarlowCondensed_600SemiBold',
  // Share Tech Mono — data readouts (IDs, %, timers, dates)
  mono: 'ShareTechMono_400Regular',
  // Cinzel — inscriptional display face for the engraved metal-plate legends on
  // the Dashboard method panels (Booth 2026-07-15). Elite, engraved feel, not
  // cursive.
  cinzelSemiBold: 'Cinzel_600SemiBold',
  cinzelBold: 'Cinzel_700Bold',
  // Yellowtail — bold retro badge script (legacy engraved legend look).
  script: 'Yellowtail_400Regular',
  // Chakra Petch — squared retro-technical / control-panel face used for the
  // debossed method-card legends (user request 2026-07-18). SemiBold cuts a
  // crisp deboss on the panels.
  panelSemiBold: 'ChakraPetch_600SemiBold',
  panelBold: 'ChakraPetch_700Bold',
  // Bravura — SMuFL music-notation font (Steinberg, OFL). Used for engraved
  // musical glyphs, e.g. the dynamics marks on the amplitude scale.
  bravura: 'Bravura',
} as const;

/** Map passed to useFonts(). */
export const fontAssets = {
  Oswald_500Medium: require('@expo-google-fonts/oswald/500Medium/Oswald_500Medium.ttf'),
  Oswald_600SemiBold: require('@expo-google-fonts/oswald/600SemiBold/Oswald_600SemiBold.ttf'),
  Oswald_700Bold: require('@expo-google-fonts/oswald/700Bold/Oswald_700Bold.ttf'),
  Barlow_400Regular: require('@expo-google-fonts/barlow/400Regular/Barlow_400Regular.ttf'),
  Barlow_500Medium: require('@expo-google-fonts/barlow/500Medium/Barlow_500Medium.ttf'),
  Barlow_600SemiBold: require('@expo-google-fonts/barlow/600SemiBold/Barlow_600SemiBold.ttf'),
  BarlowCondensed_400Regular: require('@expo-google-fonts/barlow-condensed/400Regular/BarlowCondensed_400Regular.ttf'),
  BarlowCondensed_500Medium: require('@expo-google-fonts/barlow-condensed/500Medium/BarlowCondensed_500Medium.ttf'),
  BarlowCondensed_600SemiBold: require('@expo-google-fonts/barlow-condensed/600SemiBold/BarlowCondensed_600SemiBold.ttf'),
  ShareTechMono_400Regular: require('@expo-google-fonts/share-tech-mono/400Regular/ShareTechMono_400Regular.ttf'),
  Cinzel_600SemiBold: require('@expo-google-fonts/cinzel/600SemiBold/Cinzel_600SemiBold.ttf'),
  Cinzel_700Bold: require('@expo-google-fonts/cinzel/700Bold/Cinzel_700Bold.ttf'),
  Yellowtail_400Regular: require('@expo-google-fonts/yellowtail/400Regular/Yellowtail_400Regular.ttf'),
  ChakraPetch_600SemiBold: require('@expo-google-fonts/chakra-petch/600SemiBold/ChakraPetch_600SemiBold.ttf'),
  ChakraPetch_700Bold: require('@expo-google-fonts/chakra-petch/700Bold/ChakraPetch_700Bold.ttf'),
  Bravura: require('../../assets/fonts/Bravura.otf'),
};

/**
 * Minimum font size — Booth ruling 2026-07-07: the previous 11px floor read
 * too small on device; every size ≤11 was raised +1 app-wide (7→8 … 11→12).
 * Do not introduce new text below this size.
 *
 * EXEMPTION (Booth ruling 2026-08-16, R4 in APE_GOVERNANCE_DECISIONS_2026_08_16):
 * the stepped-lab CHROME idiom (uppercase Oswald eyebrows, step tags, option
 * chips, progress counters — MicSelectLab/CableLab template, owner-approved on
 * device) may sit at 10–11.5. The 12 floor governs everything that CARRIES
 * MEANING: body, teaching, safety and readout text.
 */
export const MIN_FONT_SIZE = 12;

/** Spacing rhythm ~8px (README) / gaps 8·10·12·16 (seed brief §1). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radius = {
  phoneFrame: 40,
  card: 12,
  cardSm: 8,
  cardLg: 16,
  pill: 7,
  button: 8,
} as const;

/** Album tiers — thresholds locked (seed brief §1); denominator fixed at 50. */
export const albumTiers = [
  { name: 'Black', min: 0, max: 24, color: '#1a1a1a', navColor: '#bdbdbd', title: 'First Record' },
  { name: 'Silver', min: 25, max: 49, color: '#c0c0c0', navColor: '#d8d8d8', title: 'Silver Record' },
  { name: 'Gold', min: 50, max: 69, color: '#ffd700', navColor: '#ffc233', title: 'Gold Record' },
  { name: 'Platinum', min: 70, max: 89, color: '#e5e4e1', navColor: '#c77dff', title: 'Platinum Record' },
  { name: 'Diamond', min: 90, max: 100, color: '#e6e7ff', navColor: '#7fb8ff', title: 'Diamond Record' },
] as const;

export type AlbumTierName = (typeof albumTiers)[number]['name'];

export function albumTierFor(pct: number) {
  const clamped = Math.max(0, Math.min(100, pct));
  return albumTiers.find((t) => clamped >= t.min && clamped <= t.max) ?? albumTiers[0];
}

/** The album's display TITLE for a tier (e.g. Black → "First Record") — shown
 *  on Profile as "ALBUM LEVEL: {title}" (Booth 2026-07-11). */
export function albumTitleFor(name: AlbumTierName): string {
  return albumTiers.find((t) => t.name === name)?.title ?? albumTiers[0].title;
}

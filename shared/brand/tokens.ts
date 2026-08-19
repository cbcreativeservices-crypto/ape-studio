/**
 * Pro Audio Training Academy — shared brand tokens.
 *
 * Single source of truth for brand color + typography, mirrored from the
 * mobile app's `src/theme/tokens.ts`. The web app (`ape-studio/web`) and the
 * mobile app are "forever married" — keep these values in sync. Do not rename
 * keys without updating both consumers.
 *
 * Never abbreviate the brand to "PATA" anywhere. It is "Pro Audio Training
 * Academy" / "the Academy".
 */

export const colors = {
  // Surfaces (dark-first)
  screenBg: '#0c0c0c',
  surface: '#151515',
  surfaceRaised: '#1c1c1e',
  border: '#2a2a2e',

  // Brand accents
  amber: '#ffc64d', // primary
  amberDeep: '#ffb400',
  orange: '#ff8a1e',
  blue: '#2f9bff',
  cyan: '#5bb0ff',
  green: '#37e05f',
  purple: '#b45bff',
  gold: '#ffc233',
  red: '#ff4b3a',

  // Text
  textPrimary: '#f0f0f0',
  textSub: '#a6a6ad',
  textMuted: '#8a8b93',
} as const;

export type BrandColorName = keyof typeof colors;

/**
 * Font family role map. Actual font loading is handled by `next/font/google`
 * in the web app's root layout, which exposes each as a CSS variable
 * (e.g. --font-display). These names document the intended role of each.
 */
export const fonts = {
  display: 'Oswald', // headings / display — condensed, industrial
  body: 'Barlow', // body copy
  mono: 'Share Tech Mono', // technical readouts, credential codes, specs
} as const;

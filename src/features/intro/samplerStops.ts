/**
 * samplerStops — the connected first-run path (plan §2.3).
 *
 * One concept (sound level / decibels) threaded through EXISTING screens. Each
 * stop knows: how it presents (label/blurb/accent/icon), which existing screen
 * it opens (route), a contextual RECAP shown on return ("Now you know what a
 * decibel represents. Want to use it?"), and the recommended NEXT stops. No new
 * screens — every route below already exists in RootNavigator.
 *
 * Copy here is a first draft in the owner's voice; owner ratifies final wording.
 */
import { colors } from '../../theme/tokens';
import type { OnboardingChoice } from './onboardingFlow';

export type StopId = OnboardingChoice;

export type SamplerStop = {
  id: StopId;
  /** Card title on the choice/continuation screens. */
  label: string;
  /** One-line description under the label. */
  blurb: string;
  /** On-brand accent (token hex). */
  accent: string;
  /** Which existing screen to open (real landings). Cast at the navigate call
   *  site. Ignored for `canned` stops (they don't navigate — they render a
   *  self-contained look-real demo instead; plan §2.6). */
  route: { name: string; params?: Record<string, unknown> };
  /** Shown on the step-complete panel after this stop (plan §2.4). */
  recap: string;
  /** Recommended next stops (kept for the end-menu / future use). */
  next: StopId[];
  /** A canned demo stop (no backend, no real navigation) vs a real landing. */
  canned?: boolean;
};

/** Ordered — this is the recommended learning path; the user may start anywhere. */
export const SAMPLER_STOPS: SamplerStop[] = [
  {
    id: 'fundamentals',
    label: 'Foundations of Sound',
    blurb: 'See vibration become air pressure — and why bigger movement means a higher level.',
    accent: colors.blue,
    route: { name: 'FoundationsCourse' }, // real screen exists, but this stop is CANNED (custom demo)
    recap: 'You’ve seen how bigger vibrations make a louder sound. Ready to put a number on “loud”?',
    next: ['decibel', 'calc', 'splmeter'],
    canned: true,
  },
  {
    id: 'decibel',
    label: 'What a decibel means',
    blurb: 'The unit behind every “90 dB” — and why 0 dB isn’t silence.',
    accent: colors.cyanBright,
    route: { name: 'PublicGlossary', params: { query: 'Decibel' } },
    recap: 'Now you know what a decibel represents. Want to use it?',
    next: ['calc', 'splmeter', 'acoustics'],
    canned: true,
  },
  {
    id: 'calc',
    label: 'Sound level over distance',
    blurb: 'Predict how loud a speaker reading 90 dB at 1 m is as you move away (≈84 dB at 2 m, ≈78 dB at 4 m).',
    accent: colors.amber,
    route: { name: 'CalcWorkspace', params: { id: 'spldist' } },
    recap: 'That prediction assumes open air with no reflections. Want to see what a real room does?',
    next: ['acoustics', 'splmeter', 'decibel'],
  },
  {
    id: 'acoustics',
    label: 'Why rooms change sound',
    blurb: 'Reflections, absorption and diffusion — why a real space defies the math.',
    accent: colors.purple,
    route: { name: 'WaveLab' },
    recap: 'Rooms bend the theory. Now measure what’s actually happening around you?',
    next: ['splmeter', 'calc', 'career'],
  },
  {
    id: 'splmeter',
    label: 'Measure real sound',
    blurb: 'Turn your phone into a rough live sound-level meter and read your own space.',
    accent: colors.green,
    route: { name: 'SplMeter' },
    recap: 'You measured the real world. Curious who does this for a living?',
    next: ['career', 'acoustics', 'decibel'],
  },
  {
    id: 'career',
    label: 'Where this leads',
    // Comp A text review 2026-11-14: CF-E0005 ("find your fit" promised what the About screen says
    // the Career Finder cannot measure) and CF-E0006 (say what the choice does; the end menu reads
    // "head into the Academy").
    blurb: 'Careers built on sound level and acoustics.',
    accent: colors.gold,
    route: { name: 'CareerFinder' },
    recap: 'A single sound-level number can lead to a whole career. Keep exploring, or head into the Academy?',
    next: ['fundamentals', 'decibel'],
  },
];

const BY_ID: Record<StopId, SamplerStop> = SAMPLER_STOPS.reduce(
  (acc, s) => {
    acc[s.id] = s;
    return acc;
  },
  {} as Record<StopId, SamplerStop>,
);

export function getStop(id: StopId): SamplerStop {
  return BY_ID[id];
}

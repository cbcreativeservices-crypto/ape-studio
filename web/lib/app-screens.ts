/**
 * Website slots for mobile-app captures.
 *
 * Drop files in `web/public/app-screens/` using the `file` stem:
 *   {file}.webm, {file}.mp4, or {file}.mov — short looping screen recordings
 *   {file}.webp, {file}.png, or {file}.jpg  — poster / still (optional)
 *
 * Until a file is there, the matching phone frame shows a labeled placeholder.
 */

const video = (id: string, title: string, caption: string, file: string, tint: string) =>
  ({
    id,
    title,
    caption,
    media: "video" as const,
    tint,
    file,
    fit: "cover" as const,
  });

export const APP_SCREENS = {
  home: {
    id: "home",
    title: "Home",
    caption: "Browse subjects and find where to start.",
    media: "image" as const,
    tint: "#2f9bff",
    file: "home",
    fit: "cover" as const,
  },
  glossary: {
    id: "glossary",
    title: "Glossary",
    caption: "Look up terms, then go deeper.",
    media: "image" as const,
    tint: "#ffc64d",
    file: "glossary",
    fit: "cover" as const,
  },
  enrollments: {
    id: "enrollments",
    title: "Enrollments",
    caption: "Manage what you’re learning.",
    media: "image" as const,
    tint: "#37e05f",
    file: "enrollments",
    fit: "cover" as const,
  },
  study: video(
    "study",
    "Learn",
    "Foundations of Sound — the what, why, and how.",
    "study",
    "#ffc64d",
  ),
  micPrinciples: video(
    "micPrinciples",
    "Mic principles",
    "How microphones capture sound.",
    "mic-principles",
    "#ffc64d",
  ),
  flashcards: video(
    "flashcards",
    "Flashcards",
    "Practice recall between lessons.",
    "flashcards",
    "#37e05f",
  ),
  lab: video(
    "lab",
    "Labs",
    "Interactive labs and audio tools.",
    "lab",
    "#37e05f",
  ),
  eqLab: video(
    "eqLab",
    "EQ lab",
    "Multi-band parametric EQ.",
    "eq-lab",
    "#37e05f",
  ),
  micLab: video(
    "micLab",
    "Mic lab",
    "Microphone selection in practice.",
    "mic-lab",
    "#37e05f",
  ),
  dacLab: video(
    "dacLab",
    "D-to-A lab",
    "Digital reconstruction to analog.",
    "dac-lab",
    "#2f9bff",
  ),
  foundationsClip: {
    id: "foundationsClip",
    title: "Audio fundamentals",
    caption: "Six views of the same signal.",
    media: "image" as const,
    tint: "#ffc64d",
    file: "foundations-clip",
    fit: "cover" as const,
  },
  tools: video(
    "tools",
    "Tools",
    "SPL, RTA, and measurement tools.",
    "tools",
    "#5bb0ff",
  ),
  rta: video(
    "rta",
    "RTA",
    "Signal Detective — spectrum and analysis.",
    "rta",
    "#5bb0ff",
  ),
  detective: {
    id: "detective",
    title: "Binary samples",
    caption: "What a digital recording actually stores.",
    media: "image" as const,
    tint: "#b45bff",
    file: "detective",
    fit: "cover" as const,
  },
  quiz: video(
    "quiz",
    "Matching",
    "Pair each concept with what it means.",
    "quiz",
    "#b45bff",
  ),
  fillBlank: video(
    "fillBlank",
    "Fill in the blank",
    "Quizzes that show what you know.",
    "fill-blank",
    "#b45bff",
  ),
  achievements: {
    id: "achievements",
    title: "Credentials",
    caption: "Earn it, then prove it.",
    media: "video" as const,
    tint: "#ff8a1e",
    file: "achievements",
    fit: "cover" as const,
  },
  tubes: {
    id: "tubes",
    title: "Tube reference",
    caption: "Technical reference in the app.",
    media: "image" as const,
    tint: "#ff8a1e",
    file: "tubes",
    fit: "contain" as const,
  },
} as const;

export type AppScreenId = keyof typeof APP_SCREENS;
export type AppScreenDef = (typeof APP_SCREENS)[AppScreenId];

/** Hero marquee: every optimized capture, video-first. */
export const HERO_SCREEN_IDS: AppScreenId[] = [
  "study",
  "micPrinciples",
  "flashcards",
  "quiz",
  "fillBlank",
  "lab",
  "eqLab",
  "micLab",
  "dacLab",
  "foundationsClip",
  "tools",
  "rta",
  "detective",
];

/** “In the app” — video phones, not stills. */
export const FEATURED_SCREEN_IDS: AppScreenId[] = ["home", "study", "lab"];

export function getAppScreen(id: AppScreenId): AppScreenDef {
  return APP_SCREENS[id];
}

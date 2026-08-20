/**
 * Website slots for mobile-app captures.
 *
 * Drop files in `web/public/app-screens/` using the `file` stem:
 *   {file}.webm, {file}.mp4, or {file}.mov — short looping screen recordings
 *   {file}.webp, {file}.png, or {file}.jpg  — poster / still (optional)
 *
 * Until a file is there, the matching phone frame shows a labeled placeholder.
 */

export const APP_SCREENS = {
  home: {
    id: "home",
    title: "Home",
    caption: "Browse subjects and find where to start.",
    media: "video",
    tint: "#2f9bff",
    file: "home",
    fit: "cover",
  },
  glossary: {
    id: "glossary",
    title: "Glossary",
    caption: "Look up terms, then go deeper.",
    media: "image",
    tint: "#ffc64d",
    file: "glossary",
    fit: "cover",
  },
  enrollments: {
    id: "enrollments",
    title: "Enrollments",
    caption: "Manage what you’re learning.",
    media: "image",
    tint: "#37e05f",
    file: "enrollments",
    fit: "cover",
  },
  study: {
    id: "study",
    title: "Learn",
    caption: "Study each concept — the what, why, and how.",
    media: "image",
    tint: "#ffc64d",
    file: "study",
    fit: "cover",
  },
  flashcards: {
    id: "flashcards",
    title: "Flashcards",
    caption: "Practice recall between lessons.",
    media: "image",
    tint: "#37e05f",
    file: "flashcards",
    fit: "cover",
  },
  lab: {
    id: "lab",
    title: "Labs",
    caption: "Interactive labs and audio tools.",
    media: "video",
    tint: "#37e05f",
    file: "lab",
    fit: "cover",
  },
  tools: {
    id: "tools",
    title: "Tools",
    caption: "SPL, RTA, and measurement tools.",
    media: "video",
    tint: "#5bb0ff",
    file: "tools",
    fit: "cover",
  },
  quiz: {
    id: "quiz",
    title: "Assess",
    caption: "Quizzes that show what you know.",
    media: "video",
    tint: "#b45bff",
    file: "quiz",
    fit: "cover",
  },
  achievements: {
    id: "achievements",
    title: "Credentials",
    caption: "Earn it, then prove it.",
    media: "video",
    tint: "#ff8a1e",
    file: "achievements",
    fit: "cover",
  },
  tubes: {
    id: "tubes",
    title: "Tube reference",
    caption: "Technical reference in the app.",
    media: "image",
    tint: "#ff8a1e",
    file: "tubes",
    fit: "contain",
  },
} as const;

export type AppScreenId = keyof typeof APP_SCREENS;
export type AppScreenDef = (typeof APP_SCREENS)[AppScreenId];

/** Hero: looping captures across the main app surfaces. */
export const HERO_SCREEN_IDS: AppScreenId[] = [
  "home",
  "glossary",
  "enrollments",
  "study",
  "flashcards",
  "lab",
  "tools",
  "quiz",
  "achievements",
  "tubes",
];

/** “In the app” — explore / learn / practice. */
export const FEATURED_SCREEN_IDS: AppScreenId[] = ["home", "glossary", "enrollments"];

export function getAppScreen(id: AppScreenId): AppScreenDef {
  return APP_SCREENS[id];
}

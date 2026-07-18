/**
 * Ear Training (S12) + Scenarios (S13) item shapes — SCREENS ONLY for Fall:
 * neither method has Fall content and neither is gate-relevant (Code brief
 * §5). Fetches return empty until the Spring content pipeline lands; the
 * screens render their structural kit + a no-content state. When content
 * ships, wire fetches here and progress events through StudySession
 * ('answer' grammar — scenarios required_passes=1 per study_methods).
 */

export type EarTrainingItem = {
  id: string;
  audioUrl: string | null;
  question: string;
  type: 'mc' | 'multi_select';
  options: string[];
  correct: string[]; // self-checked study method (like fill/matching)
};

export type ScenarioItem = {
  id: string;
  prompt: string;
  /** Optional media: audio = S12 player · image = 80% 4:3 · none = reflow up. */
  media: { kind: 'audio'; url: string } | { kind: 'image'; url: string } | null;
  type: 'mc' | 'multi_select' | 'sequencing';
  /** mc/multi: answer options · sequencing: steps in DISPLAY order. */
  options: string[];
  /** mc: [correct] · multi: correct subset · sequencing: options in CORRECT order. */
  correct: string[];
  explanation: string;
};

/** Fall reality: no content. Spring pipeline replaces these. */
export async function fetchEarTrainingItems(_achievementId: string): Promise<EarTrainingItem[]> {
  return [];
}

export async function fetchScenarioItems(_achievementId: string): Promise<ScenarioItem[]> {
  return [];
}

/* __DEV__ preview fixtures so the locked kit is reviewable on-device
   (no audio assets exist — player renders its disabled state). */
export const DEV_EAR_ITEMS: EarTrainingItem[] = [
  {
    id: 'dev-ear-1',
    audioUrl: null,
    question: 'Which microphone pattern was used on this recording?',
    type: 'mc',
    options: ['Cardioid', 'Omni', 'Figure-8', 'Shotgun'],
    correct: ['Cardioid'],
  },
  {
    id: 'dev-ear-2',
    audioUrl: null,
    question: 'Select every artifact you hear in this clip.',
    type: 'multi_select',
    options: ['Clipping', 'Hum (60Hz)', 'Sibilance', 'Phase cancellation'],
    correct: ['Clipping', 'Hum (60Hz)'],
  },
];

export const DEV_SCENARIO_ITEMS: ScenarioItem[] = [
  {
    id: 'dev-scn-1',
    prompt:
      "A vocalist's condenser mic produces no sound at the interface. The cable and channel are confirmed good. What is the most likely cause?",
    media: null,
    type: 'mc',
    options: ['Phantom power is off', 'Wrong polar pattern', 'Mic is too far'],
    correct: ['Phantom power is off'],
    explanation: 'Condensers need +48V phantom power to function.',
  },
  {
    id: 'dev-scn-2',
    prompt: 'Order the steps for safe PA power-up.',
    media: null,
    type: 'sequencing',
    options: ['Power amps ON last', 'Mixer ON', 'Sources ON', 'Verify levels at zero'],
    correct: ['Verify levels at zero', 'Sources ON', 'Mixer ON', 'Power amps ON last'],
    explanation: 'Power downstream gear last so turn-on transients never hit the speakers.',
  },
];

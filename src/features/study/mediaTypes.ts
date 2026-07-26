/**
 * Scenarios (S13) item shapes — SCREEN ONLY for Fall: no Fall content and not
 * gate-relevant (Code brief §5). Fetches return empty until the Spring content
 * pipeline lands; the screen renders its structural kit + a no-content state.
 * When content ships, wire fetches here and progress events through
 * StudySession ('answer' grammar — scenarios required_passes=1 per
 * study_methods).
 *
 * The Ear Training (S12) study method was retired (Booth 2026-07-26, v4 MASTER
 * §13) — its item shape / fetch / dev fixtures were removed with it.
 */

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
export async function fetchScenarioItems(_achievementId: string): Promise<ScenarioItem[]> {
  return [];
}

/* __DEV__ preview fixtures so the locked kit is reviewable on-device
   (no audio assets exist — player renders its disabled state). */
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

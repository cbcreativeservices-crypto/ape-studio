/**
 * Scenarios (S13) item shapes + fetch. Authored scenario items live in the
 * admin-only quiz_questions table as usage='scenario' rows, so the client can't
 * read them directly. fetchScenarioItems calls the get_scenario_items RPC
 * (SECURITY DEFINER, scenario+approved only) which returns a random <=20 subset
 * for the topic (owner 2026-08-11). Progress events route through StudySession
 * ('answer' grammar — scenarios required_passes=1 per study_methods).
 *
 * The Ear Training (S12) study method was retired (Booth 2026-07-26, v4 MASTER
 * §13) — its item shape / fetch / dev fixtures were removed with it.
 */
import { supabase } from '../../lib/supabase';

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

const SCENARIO_TYPES = new Set(['mc', 'multi_select', 'sequencing']);

/** Load a random subset of approved scenario items for a topic via the
 *  get_scenario_items RPC. Non-fatal: any error → [] so the screen shows its
 *  honest no-content state rather than crashing. */
export async function fetchScenarioItems(achievementId: string): Promise<ScenarioItem[]> {
  try {
    const { data, error } = await supabase.rpc('get_scenario_items', {
      p_achievement_id: achievementId,
    });
    if (error || !data) return [];
    return (data as any[])
      .filter((r) => r?.prompt && Array.isArray(r.options) && r.options.length > 0)
      .map((r) => {
        const type: ScenarioItem['type'] = SCENARIO_TYPES.has(r.question_type) ? r.question_type : 'mc';
        const correct: string[] =
          Array.isArray(r.correct_answers) && r.correct_answers.length > 0
            ? (r.correct_answers as string[])
            : r.correct_answer != null
              ? [r.correct_answer as string]
              : [];
        const media: ScenarioItem['media'] = r.media_url
          ? { kind: r.media_type === 'audio' ? 'audio' : 'image', url: r.media_url as string }
          : null;
        return {
          id: r.id as string,
          prompt: r.prompt as string,
          media,
          type,
          options: (r.options as string[]).map(String),
          correct,
          explanation: (r.explanation as string) ?? '',
        };
      })
      .filter((it) => it.correct.length > 0);
  } catch {
    return [];
  }
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

/**
 * Speech & Voice Lab — "How Human Speech Works" (owner brief 2026-09-02).
 * Ten visual modules + checks on the PagedLab shell. No audio: the lab
 * draws anatomy, airflow, folds, formants and spectra from speechModel.
 */
import { PagedLab, type PageDef } from '../kit/PagedLab';
import { PageAnatomy, PageConsonants, PageProduction, PageVoicing, PageVowels } from './speechPagesA';
import { PageDistance, PagePopFilter, PageProblems, PageSibilance, PageSpeechChecks, PageVoices } from './speechPagesB';
// Screen Guide (owner 2026-10-31): "this page, explained" — one guide per page.
import { SPEECH_END_GUIDE, speechPageGuide } from './speechScreenGuides';

const PAGES: PageDef[] = [
  // Phase 3 (owner decision 1, 2026-11-14: "done = work done"): each module says
  // its kind. A hands-on module counts when one of its main keys is tapped;
  // NEXT alone no longer counts it. Voices Differ has nothing to do but read.
  { title: 'The Speech System', short: 'Anatomy', Component: PageAnatomy, manualDone: true },
  { title: 'How a Voice Is Made', short: 'Sequence', Component: PageProduction, manualDone: true },
  { title: 'Voiced vs Unvoiced', short: 'Voicing', Component: PageVoicing, manualDone: true },
  { title: 'Vowels & Formants', short: 'Vowels', Component: PageVowels, manualDone: true },
  { title: 'Consonant Families', short: 'Consonants', Component: PageConsonants, manualDone: true },
  { title: 'Why Pop Filters Work', short: 'Plosives', Component: PagePopFilter, manualDone: true },
  { title: 'Why Sibilance Exists', short: 'Sibilance', Component: PageSibilance, manualDone: true },
  { title: 'The Distance Effect', short: 'Distance', Component: PageDistance, manualDone: true },
  { title: 'Voices Differ', short: 'Voices', Component: PageVoices, reading: true },
  { title: 'Speech Problem Simulator', short: 'Problems', Component: PageProblems, manualDone: true },
  // manualDone (emulator pass 2026-10-14): the page marks ITSELF done at 5
  // correct (PageSpeechChecks). Without it, FINISH's beforeAdvance marked it
  // done on the learner's behalf with 0 answered — so WHAT'S LEFT read ✓ DONE
  // and the page then said "page complete". A mark already saved is kept.
  { title: 'Check Yourself', short: 'Check', Component: PageSpeechChecks, manualDone: true },
];

/** WHAT'S LEFT: each hands-on module names its own missing piece (S2 §4). */
export const SPEECH_STILL_TO_DO: Record<number, string> = {
  0: 'Still to do: tap one of the numbered parts.',
  1: 'Still to do: tap a stage, or play the sequence.',
  2: 'Still to do: tap UNVOICED or VOICED.',
  3: 'Still to do: tap one of the vowel keys.',
  4: 'Still to do: tap one of the consonant keys.',
  5: 'Still to do: tap NO FILTER or WITH A POP FILTER.',
  6: 'Still to do: tap VOWEL · AH or "S".',
  7: 'Still to do: tap one of the distance keys.',
  9: 'Still to do: tap one of the problem keys.',
  10: 'Still to do: five right answers in this module.',
};

export function SpeechLabScreen() {
  return (
    <PagedLab
      labId="speech"
      title="Speech & Voice Lab"
      subtitle="How human speech works — from breath to the microphone."
      pages={PAGES}
      // Screen Guide (owner 2026-10-31): the ⓘ on every page and on the
      // appended understanding check, and the what's-left screen's own
      // (WHERE YOU ARE).
      pageGuide={speechPageGuide}
      endGuide={SPEECH_END_GUIDE}
      // WHAT'S LEFT (fix round 2026-11-14, S2 §4): the one hands-on page names
      // what is missing; reading pages get the shared NEXT rule once.
      pageDetail={(i) => SPEECH_STILL_TO_DO[i]}
      // A CONCEPT lab (owner chip rule 2026-10-31): no live microphone and no
      // real-world measurement — its numbers are typical teaching values the
      // pages label "illustrative" themselves — so no accuracy note; the ⓘ
      // takes its spot.
      accuracy={false}
    />
  );
}

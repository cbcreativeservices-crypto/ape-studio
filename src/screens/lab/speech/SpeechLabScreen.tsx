/**
 * Speech & Voice Lab — "How Human Speech Works" (owner brief 2026-09-02).
 * Ten visual modules + checks on the PagedLab shell. No audio: the lab
 * draws anatomy, airflow, folds, formants and spectra from speechModel.
 */
import { PagedLab, type PageDef } from '../kit/PagedLab';
import { PageAnatomy, PageConsonants, PageProduction, PageVoicing, PageVowels } from './speechPagesA';
import { PageDistance, PagePopFilter, PageProblems, PageSibilance, PageSpeechChecks, PageVoices } from './speechPagesB';

const PAGES: PageDef[] = [
  { title: 'The Speech System', short: 'Anatomy', Component: PageAnatomy },
  { title: 'How a Voice Is Made', short: 'Sequence', Component: PageProduction },
  { title: 'Voiced vs Unvoiced', short: 'Voicing', Component: PageVoicing },
  { title: 'Vowels & Formants', short: 'Vowels', Component: PageVowels },
  { title: 'Consonant Families', short: 'Consonants', Component: PageConsonants },
  { title: 'Why Pop Filters Work', short: 'Plosives', Component: PagePopFilter },
  { title: 'Why Sibilance Exists', short: 'Sibilance', Component: PageSibilance },
  { title: 'The Distance Effect', short: 'Distance', Component: PageDistance },
  { title: 'Voices Differ', short: 'Voices', Component: PageVoices },
  { title: 'Speech Problem Simulator', short: 'Problems', Component: PageProblems },
  { title: 'Check Yourself', short: 'Check', Component: PageSpeechChecks },
];

export function SpeechLabScreen() {
  return <PagedLab labId="speech" title="Speech & Voice Lab" subtitle="How human speech works — from breath to the microphone." pages={PAGES} />;
}

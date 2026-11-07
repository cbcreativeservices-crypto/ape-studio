/**
 * DEV + WEB ONLY: `#roundreviewpreview` (Fill-in) and `#roundreviewpreview/matching`
 * show the end-of-round review panel (features/study/RoundReview.tsx) with
 * sample terms, since the real screens need a signed-in deck with the earlier
 * methods done. The entries go through the real noteAnswer().
 */
import { RoundReview } from '../features/study/RoundReview';
import { noteAnswer, type RoundEntry } from '../features/study/studyRounds';

const SAMPLE = [
  { id: 'a', term: 'Phantom power', definition: 'A DC voltage, usually 48 V, sent down a balanced microphone cable to power condenser microphones and active direct boxes.' },
  { id: 'b', term: 'Gain staging', definition: 'Setting the level at each point in a signal chain so the signal stays well above the noise floor and below clipping.' },
  { id: 'c', term: 'Headroom', definition: 'The space between the normal operating level and the point where a device clips.' },
];

function sampleRound(): RoundEntry[] {
  let r: RoundEntry[] = [];
  r = noteAnswer(r, SAMPLE[0], true);
  r = noteAnswer(r, SAMPLE[1], false, 'Headroom');
  r = noteAnswer(r, SAMPLE[1], true);
  r = noteAnswer(r, SAMPLE[2], true);
  return r;
}

export function RoundReviewPreview() {
  const matching = typeof window !== 'undefined' && window.location.hash.includes('matching');
  return (
    <RoundReview
      method={matching ? 'matching' : 'fill_in_blank'}
      title={matching ? 'MATCHING · PAIR EACH' : 'FILL IN THE BLANK'}
      subtitle="Topic · Preview"
      entries={sampleRound()}
      showYourAnswer={!matching}
      onContinue={() => {}}
      topInset={0}
    />
  );
}

/**
 * F15 — the CLAIM LADDER's data (shared/measure/claimLadder.ts; machinery_
 * sound/GEOMETRY_PROPOSAL.md §3): creative perspective → relative
 * comparison → calibrated pressure at a stated position → sound power under
 * a named method (F15 L5, L13–L16, L30–L31). Plain words; no standard named
 * on screen (D-6B-3). Pure data; validated by the tests.
 */
import type { ClaimLadder } from '../shared/measure/claimLadder.ts';

export const F15_LADDER: ClaimLadder = {
  id: 'productClaims',
  rungs: [
    { id: 'creative', label: 'A creative perspective', short: 'CREATIVE', needs: 'Any honest recording, its processing said.' },
    { id: 'relative', label: 'A relative comparison', short: 'RELATIVE', needs: 'The same position, gain and cycle, before and after.' },
    { id: 'pressure', label: 'A calibrated pressure at one position', short: 'PRESSURE', needs: 'A calibrated chain, checks, a stated position and metric.' },
    { id: 'power', label: 'A sound power, under a named method', short: 'POWER', needs: 'A defined surface, a qualifying room, the method’s corrections.' },
  ],
  setups: [
    { id: 'phone', label: 'A phone recording at A, auto-gain on', short: 'PHONE AT A', blurb: 'A phone’s recording from the user’s position, its gain riding up and down.', reach: 'creative' },
    { id: 'fixed', label: 'One mic at A, B and C, gain fixed, whole cycles', short: 'FIXED MIC', blurb: 'The same mic, logged positions and fixed gain through whole cycles — no calibration.', reach: 'relative' },
    { id: 'meter', label: 'A calibrated chain at A, checked before and after', short: 'CALIBRATED', blurb: 'A calibrated chain at the user’s position, checks before and after, the metric and the averaging stated.', reach: 'pressure' },
    { id: 'survey', label: 'A qualified team under the named sound-power method', short: 'FORMAL SURVEY', blurb: 'A defined surface round the fan in a qualifying room, the method’s positions and corrections, done by a qualified team.', reach: 'power' },
  ],
  claims: [
    { id: 'bright', text: 'The fan sounds airier from the side', short: 'AIRIER FROM THE SIDE', needs: 'creative', why: 'A heard character can be shown by any honest recording — said as a perspective, not a measurement.' },
    { id: 'blade', text: 'The new blade is about 3 dB quieter at A', short: '3 dB QUIETER AT A', needs: 'relative', why: 'A before-and-after at one position needs the same mic, gain, position and cycle — not an absolute level.' },
    { id: 'spl', text: 'The level at the user’s seat is 52 dBA', short: '52 dBA AT THE SEAT', needs: 'pressure', why: 'An absolute level needs a calibrated chain, the checks, the metric and the position stated.' },
    { id: 'power', text: 'The fan’s sound power is 48 dB', short: 'SOUND POWER 48 dB', needs: 'power', why: 'Sound power is a property of the source, estimated over a defined surface under a named method — a few positions cannot give it.' },
    { id: 'dose', text: 'A worker beside it gets a safe daily dose', short: 'A SAFE DAILY DOSE', needs: null, why: 'A dose needs the exposure method, the duration and the work pattern: a short fixed sample is not a personal dose, whatever the setup.' },
  ],
};

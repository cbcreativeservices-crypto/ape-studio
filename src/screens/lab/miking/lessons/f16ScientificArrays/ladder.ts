/**
 * F16 — the CLAIM LADDER's data (shared/measure/claimLadder.ts; scientific_
 * arrays/GEOMETRY_PROPOSAL.md §3): an observation → an arrival order on one
 * clock → a direction estimate from a matched array → a sound power under a
 * named method with calibrated kit and a qualified operator (F16 L5–L6,
 * L12–L13, L24–L25, L31). A hot spot as a proven fault is off the ladder.
 * Plain words; no standard named on screen (D-6B-3). Pure data; tested.
 */
import type { ClaimLadder } from '../shared/measure/claimLadder.ts';

export const F16_LADDER: ClaimLadder = {
  id: 'arrayClaims',
  rungs: [
    { id: 'heard', label: 'An observation', short: 'OBSERVATION', needs: 'What was heard or seen, said as such.' },
    { id: 'order', label: 'An arrival order', short: 'ORDER', needs: 'Two elements on one clock, the geometry written down.' },
    { id: 'direction', label: 'A direction estimate', short: 'DIRECTION', needs: 'Enough matched elements in a known layout, checked with a known source.' },
    { id: 'power', label: 'A sound power, under a named method', short: 'POWER', needs: 'Calibrated kit, the method’s surface and indicators, a qualified operator.' },
  ],
  setups: [
    { id: 'two', label: 'Two recorders started by hand', short: 'TWO RECORDERS', blurb: 'One mic on each of two recorders, each on its own clock.', reach: 'heard' },
    { id: 'pair', label: 'One synchronized two-channel baseline', short: 'ONE BASELINE', blurb: 'Two matched omni elements on one recorder, the baseline and origin logged.', reach: 'order' },
    { id: 'array', label: 'A matched multi-element array, checked', short: 'CHECKED ARRAY', blurb: 'Many matched elements in a known two-dimensional layout, verified with a known source.', reach: 'direction' },
    { id: 'probe', label: 'An intensity survey by a qualified operator', short: 'INTENSITY SURVEY', blurb: 'A calibrated probe over a defined enclosing surface, under the named method and its validity checks.', reach: 'power' },
  ],
  claims: [
    { id: 'sharper', text: 'The click sounded sharper on the left', short: 'SHARPER ON THE LEFT', needs: 'heard', why: 'A heard impression can be reported from any honest recording — said as an impression.' },
    { id: 'first', text: 'The right element heard the side click first', short: 'RIGHT HEARD IT FIRST', needs: 'order', why: 'An arrival order needs both elements on one clock and the geometry written down.' },
    { id: 'angle', text: 'The source is in front, about 25° to the right', short: '25° RIGHT, IN FRONT', needs: 'direction', why: 'One straight baseline cannot tell front from back: a direction needs more matched elements in a known layout.' },
    { id: 'power', text: 'The device radiates 60 dB of sound power', short: 'SOUND POWER 60 dB', needs: 'power', why: 'Sound power from intensity needs calibrated kit, the method’s surface and its validity indicators — and a qualified operator.' },
    { id: 'fault', text: 'The hottest spot on the map is the faulty part', short: 'THE HOT SPOT IS THE FAULT', needs: null, why: 'A mapped peak can be a source, a reflection, a sidelobe or an artifact: no map alone proves a fault — check it independently.' },
  ],
};

/**
 * Lab 5 group 2 (voices in groups: E02, E04, E05, E06) — the one mic type the
 * voice family and the ensemble family do not already have: a side-address
 * large-diaphragm condenser with a pattern switch, NO screen, on a stand at
 * mouth height, for a group SHARING it (the bluegrass semicircle, the omni
 * circle, the figure-8 duet, two back to back). Generic; the products behind
 * it stay in `examples` and `prov` (internal record, never on screen).
 * Merged into MIC_TYPES by data/micTypes.ts (the group 2 block).
 *
 * Every other group-2 mic is reused: vocDynCard / vocDynSuper / vocHeadset
 * (lessons/shared/voice/voiceMics.ts) and arrCard / arrOmni / arrFig8
 * (ensembleMics.ts).
 */
import type { MicType } from '../../../engine/model/types.ts';

const src = (s: string, quote: string) => ({ kind: 'sourced', src: s, quote }) as const;

/** The side-address condenser's body (voiceMics.ts LDC_BODY: S-SM4-WEB product data). */
const LDC_BODY = {
  length: { mm: 80.01, prov: src('S-SM4-WEB', 'height "80.01" (product data), drawn as the depth front to back') },
  radius: { mm: 59.004, prov: src('S-SM4-WEB', 'width "118.008" (product data)') },
  width: { mm: 254.991, prov: src('S-SM4-WEB', 'depth "254.991" (product data), drawn as the upright length') },
};

export const GROUP_VOICE_MIC_TYPES = {
  grpLdc: {
    id: 'grpLdc',
    label: 'Large-diaphragm condenser, switchable pattern, shared by the group',
    short: 'SHARED LARGE',
    transducer: 'condenser',
    address: 'side',
    patterns: [
      { id: 'cardioid', label: 'cardioid', prov: src('AKG-C414', 'select the cardioid or omni pattern and place the vocalists in a semicircle in front of the microphone (§4.6.2)') },
      { id: 'omni', label: 'omni', prov: src('S-REC', 'Having the vocalists circle around an omnidirectional mic (Ensemble Vocals p.6)') },
      { id: 'figure8', label: 'figure-8', prov: src('WP-MIC', 'a bidirectional (figure-8) pattern: front and back, opposite polarity, nulls at the sides — E04 L11 puts one singer in each lobe') },
    ],
    body: LDC_BODY,
    power: 'phantom power (48 V)',
    mount: 'stand',
    examples: [
      { model: 'a multi-pattern large-diaphragm studio condenser', fact: 'AKG-C414 §4.6.2: "one microphone each for two, at most three persons" (backing vocals); the semicircle in front of a cardioid or omni. S-BLUEGRASS: one large condenser shared by the band, the singers moving in and out of its pattern.', src: 'AKG-C414' },
    ],
    art: 'vocalLdc',
    blurb: 'A side-address studio condenser with a pattern switch, on a stand at the singers’ mouth height: cardioid for a semicircle in front of it, omni for a circle round it, figure-8 for two singers facing each other. No screen — the singers keep a little distance. Needs phantom power.',
  },
} satisfies Record<string, MicType>;

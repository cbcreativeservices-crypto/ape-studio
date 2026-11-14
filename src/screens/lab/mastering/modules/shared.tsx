/**
 * Shared module contract + the honesty badges every stage prints.
 */
export type ModuleProps = {
  /** A scenario was answered (first pick) — the host records it. */
  onAnswered: (scenarioId: string, correct: boolean) => void;
};

/** Stages that draw a MODEL (a diagram, an illustrative curve). */
export const MODEL_BADGE = 'MODEL · illustration, not a measurement';
/** Stages that draw a MEASURED render: real offline DSP, estimated meters,
 *  heard through an uncalibrated phone output. The limiter is a miniature:
 *  no look-ahead, sample-peak detection — real mastering limiters use
 *  look-ahead and true-peak detection. */
/** The tool shelf's METERS view: the delivered mix measured offline. */
export const METER_BADGE = 'MEASURED · offline render of the mix, estimated meters (BS.1770-style)';
export const RENDER_BADGE = 'MEASURED · offline render, estimated meters (BS.1770-style), miniature limiter (no look-ahead), uncalibrated output';

/**
 * The PLAIN model note each badge becomes (phase 3, 2026-11-14; owner's
 * decision 3: "a plain one-line disclaimer badge instead of all-caps … lines";
 * S3's RackStage.modelNote). One sentence, sentence case, said in the
 * student's words; the disclosure itself stays on screen. Keyed by the badge
 * text, so every stage that passes a badge gets its note in MasteringRack.
 */
export const PLAIN_MODEL_NOTE: Readonly<Record<string, string>> = {
  [MODEL_BADGE]: 'A drawing that explains the idea, not a measurement.',
  [METER_BADGE]: 'Measured offline from the mix; the meters are estimates.',
  [RENDER_BADGE]: 'Measured offline: estimated meters, a simple limiter, this device’s uncalibrated output.',
  'DIAGRAM · the project chain': 'A diagram of the project chain, from recording to release.',
  'DIAGRAM · real systems vary': 'A diagram of one monitoring path; real systems vary.',
  'DIAGRAM · order and scope vary': 'A diagram of one workflow; the order and scope vary by project.',
  'SYNTHESIZED TEACHING SIGNAL · MODEL meters (Visual Audio Analysis lab)': 'A made-up teaching signal on model meters, not a measurement.',
  'DELIVERY SHEET · sample brief, fictional client': 'A sample delivery sheet for a fictional client.',
  'PLAN · fictional EP, loudness estimates': 'A plan for a fictional EP; the loudness values are estimates.',
};

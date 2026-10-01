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
export const RENDER_BADGE = 'MEASURED · offline render, estimated meters (BS.1770-style), miniature limiter (no look-ahead), uncalibrated output';

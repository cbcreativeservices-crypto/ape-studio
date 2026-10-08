/**
 * THE RESULT LABEL — "relative" or "calibrated" (F11 L3, L22, L46;
 * measurement_mics/GEOMETRY_PROPOSAL.md §3.3). Pure; tested.
 *
 * A reading earns the word CALIBRATED only when every link is known: the
 * whole chain (capsule, preamp, power, input) is identified and compatible,
 * its sensitivity record belongs to THIS chain, the field check passed both
 * before AND after (the post value read unadjusted, inside the tolerance the
 * method gives), and the method is named. Any unknown link leaves it a
 * RELATIVE comparison — useful, honest, and never a sound level claim. A
 * smooth-looking trace changes nothing (L22).
 */

export type ResultLinks = {
  /** Capsule, preamp, power and input identified and compatible. */
  chainKnown: boolean;
  /** The sensitivity record belongs to this chain (not copied from a look-alike, L27). */
  sensitivityOwn: boolean;
  /** Pre-run field check passed (null = not done). */
  preCheck: boolean | null;
  /** Post-run field check, unadjusted, inside the method's tolerance (null = not done). */
  postCheck: boolean | null;
  /** The method (and its tolerance) is named. */
  methodNamed: boolean;
};

export type ResultLabel = { kind: 'calibrated' | 'relative' | 'investigate'; word: string; why: string[] };

/** The label a result may carry, with every reason it falls short. */
export function resultLabel(r: ResultLinks): ResultLabel {
  const why: string[] = [];
  if (!r.chainKnown) why.push('the chain is not fully identified');
  if (!r.sensitivityOwn) why.push('the sensitivity is not this chain’s own record');
  if (r.preCheck === null) why.push('no field check before the run');
  if (r.postCheck === null) why.push('no field check after the run');
  if (!r.methodNamed) why.push('no method is named');
  // A FAILED check is not "unknown": the data are flagged for investigation
  // under the method's own rule, never forced back to the expected value (L32).
  if (r.preCheck === false || r.postCheck === false) {
    return { kind: 'investigate', word: 'MARK FOR INVESTIGATION', why: [r.preCheck === false ? 'the check before the run failed' : 'the check after the run is outside the tolerance', ...why] };
  }
  if (why.length) return { kind: 'relative', word: 'RELATIVE ONLY', why };
  return { kind: 'calibrated', word: 'CALIBRATED, UNDER THE NAMED METHOD', why: [] };
}

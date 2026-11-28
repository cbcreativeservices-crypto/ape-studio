/**
 * "Can't listen now?" (lab fix round 2026-11-14, F9 phase 2; owner approval
 * of the fix round: "Begin fixing all bugs found and do obvious ... fixes as
 * you suggestted in the report"). The Miking Labs are SILENT by design (owner
 * 2026-10-04), yet 126 of 128 lessons say "listen" or "LISTEN FOR" somewhere:
 * suggestions for a real mic in a real room. Rather than rewrite 128 lessons,
 * the shared engine (engine/steps.tsx) adds ONE short line to every step whose
 * words mention listening, chosen by the step's kind, pointing at what the
 * display shows instead.
 *
 * Pure (no React Native): the tests reach it directly.
 */
import type { StepKind } from './steps';

/** "listen", "listens", "listening", "listened", "LISTEN FOR" — never "listener". */
export const LISTEN_RE = /\blisten(?:s|ing|ed)?\b/i;

/** Does a step's content (React elements, strings, data passed as props)
 *  mention listening? Walks children and props (strings, arrays, elements,
 *  plain objects such as a zone or a prediction), never functions. */
export function mentionsListening(node: unknown, depth = 0): boolean {
  if (node == null || typeof node === 'boolean' || typeof node === 'number' || depth > 12) return false;
  if (typeof node === 'string') return LISTEN_RE.test(node);
  if (Array.isArray(node)) return node.some((n) => mentionsListening(n, depth + 1));
  if (typeof node !== 'object') return false;
  const o = node as Record<string, unknown>;
  if (o.props && typeof o.props === 'object') {
    // An element: its children and its props, walked.
    const props = o.props as Record<string, unknown>;
    for (const k of Object.keys(props)) {
      if (SKIP.has(k)) continue;
      const v = props[k];
      if (typeof v === 'function') continue;
      if (mentionsListening(v, depth + 1)) return true;
    }
    return false;
  }
  // Data passed as a prop (a zone, a prediction): its own words only, one
  // level, so a whole lesson behind a `rig` prop is never read.
  return Object.keys(o).some((k) => {
    if (SKIP.has(k)) return false;
    const v = o[k];
    return typeof v === 'string' ? LISTEN_RE.test(v) : Array.isArray(v) && v.every((x) => typeof x === 'string') ? v.some((x) => LISTEN_RE.test(x)) : false;
  });
}

/** Never shown to the learner, or not words: research quotes and sources
 *  (no in-app citations), styles, keys. */
const SKIP = new Set(['style', 'key', 'ref', 'quote', 'src', 'prov', 'source', 'accessibilityLabel', 'a11y', 'labelFor']);

const PREFIX = 'Can’t listen now? Nothing in this lab makes a sound.';

/** One line per step kind: where to look instead of listening. */
export const LISTEN_LINES: Readonly<Record<StepKind, string>> = {
  PLACE: `${PREFIX} The SUGGESTED STARTING POINT card says what a mic there tends to hear; the readouts and the drawing show what changed.`,
  LIVE: `${PREFIX} The readouts show how loud each source would arrive at the mic, and the drawing shows where its quiet side points.`,
  PAIR: `${PREFIX} The readouts and the comb drawing show what the two mics would do together.`,
  POLARITY: `${PREFIX} The readouts and the comb drawing show what the two mics would do together.`,
  COMPARE: `${PREFIX} The pattern drawing and its readouts show how loud each direction would arrive.`,
  TRY: `${PREFIX} The drawing shows what moves; the words say how it would tend to sound.`,
  WATCH: `${PREFIX} The drawing shows what moves; the words say how it would tend to sound.`,
  LEARN: `${PREFIX} Read each “listen for” as what to check later with a real mic in a real room.`,
  READ: `${PREFIX} Read each “listen for” as what to check later with a real mic in a real room.`,
  CHECK: `${PREFIX} Each question is answered from the drawings and the words, never by ear.`,
  PRACTICE: `${PREFIX} Read each “listen for” as what to check later with a real mic in a real room.`,
};

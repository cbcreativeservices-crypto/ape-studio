/**
 * Hazard detection for glossary terms (Booth 2026-07-11). INTERIM: a proper
 * per-term `hazard` flag (shock / chemical / burn / injury) should live in the
 * glossary DATA — flagged to the backend. Until then this heuristic matches the
 * term NAME against strong electrical/chemical hazard keywords so genuinely
 * dangerous-to-touch terms carry a caution warning (glossary + flashcards).
 *
 * NOTE for backend: also add the required (R)/(TM) marks to proprietary company
 * names in the term/definition content — the client cannot know which names are
 * trademarks without that data.
 */
const HAZARD_KEYWORDS = [
  'tube',
  'vacuum',
  'solder',
  'grounding',
  'ground loop',
  'electr', // electrical, electrocution, electrode
  'voltage',
  'high voltage',
  'phantom power',
  'mains',
  'power supply',
  'power amp',
  'amplifier',
  'capacitor',
  'battery',
  'lithium',
  'shock',
];

export function isHazardTerm(name: string | null | undefined): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  return HAZARD_KEYWORDS.some((k) => n.includes(k));
}

/**
 * Official, codified topic + lab names (owner 2026-09-03).
 *
 * RULE (Booth 2026-09-03): never render the word "Topic" as a stand-in name, or
 * any gs number, to a user. The real name must always be available in-memory so
 * it shows even when the live catalog fetch fails. Any user-facing `Topic gsN`
 * placeholder is a defect — resolve through officialTopicName() instead.
 *
 * These names are the single source of truth for the Audio Fundamentals credential
 * set and supersede every earlier variant ("Professional Audio Safety",
 * "Grounding & Shielding", "Audio Fundamentals Lab").
 */
export const OFFICIAL_TOPIC_NAMES: Record<number, string> = {
  3060: 'Pro Audio Safety',
  3070: 'Grounding & Electrical',
  3081: 'Audio Fundamentals', // the lab
  3970: 'DAW Fundamentals & Session Management',
  4370: 'Workplace Skills',
};

/** True when `name` is a real name and not a "Topic …"/gs placeholder. */
function isRealName(name: string | null | undefined): name is string {
  const n = (name ?? '').trim();
  return n.length > 0 && !/^topic\b/i.test(n);
}

/**
 * The name to show for a topic's global_sequence. Prefers a real fetched name,
 * then the codified in-memory name; never returns "Topic" or a gs number.
 */
export function officialTopicName(gs: number, liveName?: string | null): string {
  if (isRealName(liveName)) return liveName.trim();
  return OFFICIAL_TOPIC_NAMES[gs] ?? 'this topic';
}

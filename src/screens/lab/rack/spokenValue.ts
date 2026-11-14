/**
 * spokenValue — a fader's readout as it is READ ALOUD after its own name (lab
 * fix round 1, 2026-11-14, F2's shared need; owner: "Begin fixing all bugs
 * found and do obvious ... fixes as you suggested in the report"). DJ's
 * formats repeat the name ("TRIM 1 +9.0 dB"), so the label "TRIM 1: TRIM 1
 * +9.0 dB" said it twice. A leading repeat of the label, followed by a space,
 * is dropped from the SPOKEN words only (case-insensitive); the readout on
 * screen is unchanged, and a word that merely starts the same ("TRIMMER" for
 * "TRIM") is never cut. Pure, no imports.
 *
 * RackUnit's dock carries the same rule inline (test/batch4_G5 runs that dock
 * code from source, where an imported name is not available).
 */
export function spokenValue(label: string, text: string): string {
  const l = label.trim();
  if (!l) return text;
  return text.toLowerCase().startsWith(`${l.toLowerCase()} `) ? text.slice(l.length + 1).trimStart() : text;
}

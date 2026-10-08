/**
 * DOCK WORDS — one short-form rule for the word VALUES on a Miking page's
 * control dock and bezel (owner decision X3, 2026-10-08: "SUPERCARDI…",
 * "IN ZO…", "FRONT…" were cut off at 390 wide). A key is ~7 mono characters
 * wide with five keys on a phone, so a long word is given a clear short form
 * on the key; the FULL word stays in the accessibility label (MikingRack
 * passes it as `valueA11y` / `vA11y`). Numbers are never shortened here — a
 * cropped readout drops its label, never its number (D36).
 *
 * Pure (no React Native), so the tests reach it directly. Applied once, in
 * MikingRack, for every Miking lesson — not per lesson.
 */

/** A whole value → its short form. */
const WHOLE: Readonly<Record<string, string>> = {
  'IN ZONE': 'IN',
  // A position fader's axis ("FRONT…" on F10): the axis by its first end.
  'FRONT–BACK': 'FRONT',
  'LEFT–RIGHT': 'SIDE',
  'FRONT+REAR': 'BOTH',
  DOWNSTAGE: 'FRONT',
  // Lab 6–7 setup names that were cut on the setup key at 390 wide (hunt
  // 2026-10-08 T-4: "WALKING P…", "INSTALLED PA·SY…"). Each short form is
  // still unique among its own lesson's setups.
  'WALKING PASS': 'WALKING', // F08
  'VEHICLE · PAPER PLAN': 'VEHICLE', // F08
  'HOLLOW WOOD': 'HOLLOW', // F01
  'FAR AND LOW': 'FAR', // F07
  'TEST SOURCE · ROOM ONLY': 'TEST', // F13
  'INSTALLED PA · SYSTEM + ROOM': 'HOUSE PA', // F13
  'VENUE · MAINS, SUB AND FILL': 'VENUE', // F14
  'STUDIO MONITORS': 'MONITORS', // F14
  'QUIET BOOTH': 'QUIET', // B09
  'TWO HANDHELDS': 'TWO MICS', // B10
};

/** One word inside a value → its short form. */
const WORD: Readonly<Record<string, string>> = {
  SUPERCARDIOID: 'SUPER',
  HYPERCARDIOID: 'HYPER',
  CARDIOID: 'CARD',
  'FIGURE-8': 'FIG-8',
  'FIGURE-EIGHT': 'FIG-8',
  BIDIRECTIONAL: 'FIG-8',
  OMNIDIRECTIONAL: 'OMNI',
  FIGURE8: 'FIG-8',
  // Values a page already cut at ten letters ("SUPERCARDI…").
  SUPERCARDI: 'SUPER',
  HYPERCARDI: 'HYPER',
  CONDENSER: 'COND',
  DYNAMIC: 'DYN',
};

/** The short form of a dock / bezel word value ("SUPERCARDIOID" → "SUPER"). */
export function dockShort(v: string): string {
  const whole = WHOLE[v];
  if (whole) return whole;
  if (!/[A-Z]/.test(v)) return v;
  // "THE CONGA" → "CONGA", "A CLIP-ON" → "CLIP-ON"; "DYN · CARD" → "DYN·CARD".
  const t = v.replace(/^(THE|AN?) (?=\S)/, '').replace(/ · /g, '·');
  return t
    .split(/(?=·)|(?<=·)| /)
    .filter((w) => w !== '')
    .map((wd) => {
      // Keep a trailing ellipsis or punctuation on the word it follows.
      const m = /^([A-Z0-9-]+)([^A-Z0-9-]*)$/.exec(wd);
      if (!m) return wd;
      const s = WORD[m[1]];
      return s ? s + m[2] : wd;
    })
    .join(' ')
    .replace(/ ?· ?/g, '·');
}

/** Every short form the rule knows (for the lock test). */
export const DOCK_SHORT_FORMS: Readonly<Record<string, string>> = { ...WHOLE, ...WORD };

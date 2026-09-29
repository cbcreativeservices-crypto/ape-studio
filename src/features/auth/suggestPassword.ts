/**
 * suggestPassword — a random passphrase for CREATE ACCOUNT (owner, 2026-09-29:
 * a tester "could not login and get past" the breached-password rejection).
 *
 * The server rejects any password found in a known breach corpus, and that
 * check cannot run on the phone (authErrorCopy.ts). People then retype small
 * variations of the same password — which are ALSO in the corpus — and give
 * up. A passphrase of three random words + two digits, drawn from a secure
 * random source, is effectively never in a breach list, satisfies our own
 * rules (8+ characters, a capital, a number), and is easy to read back.
 *
 * Pure: pass `randomInt` in tests; the app passes a crypto-backed one.
 */
const WORDS = [
  'amber', 'anchor', 'arrow', 'atlas', 'autumn', 'badge', 'banjo', 'barrel', 'basil', 'beacon',
  'bishop', 'blossom', 'border', 'bridge', 'bronze', 'bucket', 'cabin', 'cactus', 'candle', 'canyon',
  'carbon', 'castle', 'cedar', 'cello', 'cinder', 'circuit', 'clover', 'cobalt', 'comet', 'copper',
  'coral', 'cotton', 'crayon', 'cricket', 'crystal', 'dagger', 'delta', 'desert', 'dolphin', 'dragon',
  'drift', 'eagle', 'echo', 'ember', 'falcon', 'feather', 'fiddle', 'forest', 'fossil', 'garden',
  'garnet', 'ginger', 'glacier', 'granite', 'gravel', 'harbor', 'harvest', 'hazel', 'helmet', 'hollow',
  'island', 'ivory', 'jacket', 'jasper', 'jungle', 'kettle', 'lagoon', 'lantern', 'lemon', 'lilac',
  'linen', 'lobster', 'magnet', 'mango', 'maple', 'marble', 'meadow', 'meteor', 'mirror', 'mosaic',
  'nectar', 'nickel', 'noodle', 'oasis', 'orbit', 'orchid', 'otter', 'paddle', 'panther', 'parrot',
  'pebble', 'pepper', 'piano', 'pillow', 'pirate', 'planet', 'pocket', 'prairie', 'puzzle', 'quartz',
  'rabbit', 'raven', 'ribbon', 'river', 'rocket', 'saddle', 'saffron', 'salmon', 'satin', 'scarlet',
  'shadow', 'silver', 'sparrow', 'spider', 'spruce', 'summit', 'sunset', 'tango', 'thunder', 'timber',
  'tomato', 'topaz', 'tulip', 'tundra', 'turtle', 'velvet', 'violet', 'walnut', 'willow', 'window',
  'winter', 'wizard', 'yellow', 'zebra', 'zephyr', 'acorn', 'bamboo', 'biscuit', 'breeze', 'canvas',
];

const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

/** `randomInt(n)` must return an integer in [0, n). */
export function suggestPassword(randomInt: (n: number) => number): string {
  const picked: string[] = [];
  while (picked.length < 3) {
    const w = WORDS[randomInt(WORDS.length)];
    if (!picked.includes(w)) picked.push(w);
  }
  const digits = String(10 + randomInt(90)); // always two digits
  return `${picked.map(cap).join('-')}-${digits}`;
}

export const SUGGEST_WORD_COUNT = WORDS.length;

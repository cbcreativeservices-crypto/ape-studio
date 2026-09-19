/**
 * MyTopicsIcon — the mark for ALL TOPICS on the Enrollments screen.
 *
 * ⛔ THE OWNER'S ARTWORK, NOT A DRAWING OF IT. This was an RN-SVG
 * reconstruction until 2026-09-19, when the owner supplied the real mark
 * (`assets/MyTopicIcon.jpg`) and said to use it. The vector is gone: two
 * versions of one mark is one too many, and the drawn one could only ever be
 * an approximation that drifts as the real art is refined.
 *
 * ── WHAT THE CONVERSION DID, AND WHY ────────────────────────────────────────
 * The source is a 1024×1024 JPEG: gold line art on a FLAT OPAQUE #1c2029
 * field. Three things had to change for it to work as an icon, and none of
 * them touch the drawing itself.
 *
 *  1. BACKGROUND REMOVED. A JPEG cannot carry alpha, so dropped in as-is it
 *     would have rendered a dark blue-grey square on a near-black (#1e1e1e)
 *     card — visibly a patch, not an icon. The field is one flat colour, so
 *     the alpha is recovered exactly: per pixel, α is the distance from that
 *     background toward the gold, and the colour is un-composited back out of
 *     it. That keeps the anti-aliased edges clean instead of leaving the dark
 *     fringe a hard colour-key would.
 *  2. CROPPED TO THE ART. The drawing occupied 704×555 of the 1024 square,
 *     so used whole it would have sat small inside its slot with dead margin
 *     on every side. Cropped to the ink and re-centred in a square with an
 *     even 6% margin, it fills the slot the way the credential art beside it
 *     does — the same balance problem, and the same fix, as the vector had.
 *  3. 512px LOSSLESS WEBP. The slot is ~115pt, so 512 covers 3× displays with
 *     room to spare. Lossless because this is flat-colour line art: it is
 *     73 KB against 40 KB for q92, and lossy leaves visible mosquito noise
 *     along high-contrast gold edges, which is precisely what this image is
 *     made of.
 *
 * ⚠️ The art's gold (~#efb83c) is a shade deeper than the app's accent amber
 * (#ffc64d). Left alone on purpose — it is the owner's artwork, and tinting
 * it to match would be editing the mark rather than placing it.
 *
 * ⛔ `color` AND `framed` ARE GONE. The old vector took them; a bitmap cannot
 * honour either, and a prop that is silently ignored is worse than one that
 * does not exist — the caller believes it did something.
 */
import { Image } from 'react-native';

const MARK = require('../../assets/icons/my-topics.webp');

export function MyTopicsIcon({ size = 72 }: { size?: number }) {
  return (
    <Image
      source={MARK}
      style={{ width: size, height: size }}
      // The art is already square and cropped to its own margin, so `contain`
      // only ever letterboxes by rounding — it never crops the drawing.
      resizeMode="contain"
      // The eyebrow and title beside it already name this; a focusable node
      // that announces "image" only adds a stop for a screen reader.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

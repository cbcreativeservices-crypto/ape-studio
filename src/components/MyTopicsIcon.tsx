/**
 * MyTopicsIcon — the mark for ALL TOPICS on the Enrollments screen.
 *
 * Drawn from the owner's reference (2026-09-19): an open book with a heart
 * resting in its gutter, in a rounded-square frame, as a single-weight neon
 * outline. It replaces the ☰ hamburger glyph that stood in for it, which said
 * "a list" when the thing it labels is *your* study — the book is the app's
 * own emblem and the heart is what makes the shelf yours.
 *
 * ⛔ VECTOR, NOT AN IMAGE ASSET. Two reasons and both matter here:
 * the app's icon standard is minimal line art (see APE_VISUAL_STANDARDS), and
 * a stroke drawn at run time stays crisp at any size and takes the accent
 * colour of whatever card it sits on. It also means no binary lands in the
 * repo — image assets are the owner's to place, never ours to assume.
 *
 * The glow is two passes of the same geometry: a wide, low-opacity stroke
 * under a crisp one. That is how the reference reads as neon without a blur
 * filter, which RN-SVG does not give us on Android.
 */
import Svg, { G, Path, Rect } from 'react-native-svg';

/**
 * Open book: each leaf is an OPEN path, deliberately not closed across the
 * gutter. A closed leaf draws its inner edge straight up the centre — right
 * through the heart — which is what made the first attempt read as a muddle
 * of lines at icon size. Leaving them open lets the heart sit in clean space,
 * exactly as it does in the reference.
 */
const LEFT_PAGE = 'M50 78C42 70 35 66.5 27 66.5L27 26C35 26 42 29.5 50 37.5';
const RIGHT_PAGE = 'M50 78C58 70 65 66.5 73 66.5L73 26C65 26 58 29.5 50 37.5';
/** The thin cover edge standing behind each leaf. */
const LEFT_COVER = 'M27 29.5L21 33.5L21 70L27 66.5';
const RIGHT_COVER = 'M73 29.5L79 33.5L79 70L73 66.5';
/**
 * The heart in the gutter, point down the spine. It is the thing you see
 * first, not a detail tucked between the pages — but it narrowed along with
 * the book, so it still reads as sitting IN the gutter rather than lying
 * across both leaves.
 */
const HEART =
  'M50 63.8C50 63.8 35 53.4 35 44.8C35 39.5 38.8 36.1 43.1 36.1C46.1 36.1 48.6 37.7 50 40.1C51.4 37.7 53.9 36.1 56.9 36.1C61.2 36.1 65.1 39.5 65.1 44.8C65.1 53.4 50 63.8 50 63.8Z';

export function MyTopicsIcon({
  size = 72,
  color = '#ffc24d',
  /** Draw the rounded-square frame. Off when the icon sits in its own box. */
  framed = true,
}: {
  size?: number;
  color?: string;
  framed?: boolean;
}) {
  // One geometry, drawn twice: a soft wide pass for the glow, a crisp pass on
  // top. Stroke widths are in viewBox units so they scale with `size`.
  /**
   * ⛔ THE HEART IS FILLED, NOT STROKED, AT EVERY SIZE.
   *
   * It was a heavier stroke than the book (5 against 3) to make it the
   * subject. That reads as an inconsistency rather than as emphasis — the
   * house standard is single-weight line art — and at small sizes it is
   * actively broken: at 24px each lobe is under 2px wide carrying a 1.2px
   * stroke, so the lobes fill in and the heart becomes a blob. A filled
   * sub-element is the normal line-art way to say "this is the subject", it
   * downscales perfectly, and it lets the book hold one honest weight.
   */
  const compact = size < 40;

  const pass = (wide: boolean) => (
    <G stroke={color} strokeOpacity={wide ? 0.16 : 1} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <G strokeWidth={compact ? 5.2 : wide ? 4.6 : 2}>
        {framed ? <Rect x={5} y={5} width={90} height={90} rx={19} /> : null}
        {/* The cover edges are the first thing to go when small: they carry no
            meaning, and at 24px the 7-unit gap holding them is under a pixel,
            so they merge into the page line beside them. */}
        {compact ? null : <Path d={LEFT_COVER} />}
        {compact ? null : <Path d={RIGHT_COVER} />}
        <Path d={LEFT_PAGE} />
        <Path d={RIGHT_PAGE} />
      </G>
      <Path d={HEART} fill={color} fillOpacity={wide ? 0.16 : 1} stroke="none" />
    </G>
  );

  /**
   * ⛔ THE BOOK IS DRAWN SQUARE, AND THAT IS A GEOMETRY FIX, NOT A VIEWBOX ONE.
   *
   * It used to span x 14→86 by y 31→70 — 72 wide by 39 tall, nearly 2:1. Sat
   * in the square slot beside the credential art it read as stretched: the
   * leaves ran out to the edges while half the height went unused, so the
   * pages looked splayed rather than open. Cropping the viewBox could only
   * make that wider shape bigger, never better balanced.
   *
   * The leaves are now pulled in (x 21→79) and the book made taller (y 26→78)
   * — 58 by 52, near enough square — and the heart scaled with them so the
   * proportions inside hold. The viewBox is then cropped to that ink and
   * centred on it, so the drawing fills its square slot with the same visual
   * mass as the CredentialThumb that replaces it for every other selection.
   *
   * ⚠️ The stroke widths above are pre-compensated for the 1.52× the crop
   * applies; change the crop and they need changing with it.
   */
  return (
    <Svg
      width={size}
      height={size}
      viewBox={framed ? '0 0 100 100' : '17 19 66 66'}
      // The eyebrow and title beside it already name this; a focusable node
      // that announces "image" only adds a stop for a screen reader.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {compact ? null : pass(true)}
      {pass(false)}
    </Svg>
  );
}

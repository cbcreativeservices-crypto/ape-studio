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
const LEFT_PAGE = 'M50 70C41.5 63.5 32.5 60.5 21 60.5L21 31C32.5 31 41.5 34 50 40.5';
const RIGHT_PAGE = 'M50 70C58.5 63.5 67.5 60.5 79 60.5L79 31C67.5 31 58.5 34 50 40.5';
/** The thin cover edge standing behind each leaf. */
const LEFT_COVER = 'M21 34.5L14 38.5L14 65L21 60.5';
const RIGHT_COVER = 'M79 34.5L86 38.5L86 65L79 60.5';
/**
 * The heart in the gutter, point down the spine. Bigger than the first pass —
 * in the reference it is the thing you see first, not a detail tucked between
 * the pages.
 */
const HEART =
  'M50 66C50 66 32.5 54 32.5 44C32.5 37.8 37 33.8 42 33.8C45.5 33.8 48.4 35.7 50 38.5C51.6 35.7 54.5 33.8 58 33.8C63 33.8 67.5 37.8 67.5 44C67.5 54 50 66 50 66Z';

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
      <G strokeWidth={compact ? 6 : wide ? 5.3 : 2.3}>
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
   * UNFRAMED, THE DRAWING MUST HOLD ITS SLOT. The ink spans x 14→86, y 31→70,
   * so in a 0–100 box it rendered 58×33px inside a 78×78 slot — 42% the mass
   * of the CredentialThumb that sits in the same position for every other
   * selection, which made ALL TOPICS (the default, the first thing anyone
   * sees here) look like the weakest one. Cropping the viewBox to the ink
   * fixes it; the stroke widths above are pre-compensated for the 1.32×.
   */
  return (
    <Svg
      width={size}
      height={size}
      viewBox={framed ? '0 0 100 100' : '12 12.5 76 76'}
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

/**
 * Browser window with an outward arrow — "opens on the web" (owner
 * 2026-10-26). Replaces the ↗ after "Research and learn more" and "View
 * images" in the Glossary and on the flashcards.
 *
 * TRACED, not redrawn: every coordinate below is measured from the owner's
 * own icon (1408 × 768 source), and the viewBox is that drawing's own space,
 * so nothing is re-proportioned or rounded:
 *  - window 446–925 × 141–644, corner radius 9, every edge 35 thick, with a
 *    SOLID title bar down to y 245;
 *  - three dots r 17.5 at y 193 (x 498.5 / 556.5 / 615), cut through the bar;
 *  - the arrow at exactly 45°: a 32-wide shaft with a square end at
 *    (679, 415), and a head with its tip at (976, 110);
 *  - a 30.5-wide gap all round the arrow, MITRED like the source (that is what
 *    leaves the title bar ending in a point).
 * The dots and the gap are real cut-outs (a mask), so they show the card
 * behind on every background, in Low-Light too. (A globe version came first;
 * the owner found it too compact.)
 */
import { useId } from 'react';
import Svg, { Circle, Defs, G, Mask, Path, Polygon, Rect } from 'react-native-svg';

/** The arrow's outline (shaft + head), in the source's own coordinates. */
const ARROW = '667.8,403.8 896.4,175.2 851,129 976,110 957,237 918.5,197.8 690.2,426.2';
/** Twice the source's 30.5 gap: a mitred stroke that wide cuts it. */
const GAP_STROKE = 61;

export function WebLinkIcon({ size = 14, color }: { size?: number; color: string }) {
  // One mask per instance: several links share a screen.
  const maskId = `weblink-cut-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <Svg width={size} height={size} viewBox="442 106 538 538" accessible={false}>
      <Defs>
        <Mask id={maskId} maskUnits="userSpaceOnUse" x="442" y="106" width="538" height="538">
          <Rect x="442" y="106" width="538" height="538" fill="#ffffff" />
          <Circle cx="498.5" cy="193" r="17.5" fill="#000000" />
          <Circle cx="556.5" cy="193" r="17.5" fill="#000000" />
          <Circle cx="615" cy="193" r="17.5" fill="#000000" />
          <Polygon points={ARROW} fill="#000000" stroke="#000000" strokeWidth={GAP_STROKE} strokeLinejoin="miter" strokeMiterlimit={10} />
        </Mask>
      </Defs>
      {/* The window: rounded outer edge, square opening below a solid bar. */}
      <G mask={`url(#${maskId})`}>
        <Path
          fill={color}
          fillRule="evenodd"
          d="M455 141 H916 Q925 141 925 150 V635 Q925 644 916 644 H455 Q446 644 446 635 V150 Q446 141 455 141 Z M481 246 V609 H890 V246 Z"
        />
      </G>
      <Polygon points={ARROW} fill={color} />
    </Svg>
  );
}

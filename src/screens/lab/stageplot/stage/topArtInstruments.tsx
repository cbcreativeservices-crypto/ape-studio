/**
 * topArtInstruments — top-view art for the instruments the app had no
 * illustration for: small percussion, congas, timbales, bongó, piano, an
 * acoustic instrument, a horn. See topArtTypes.ts for the contract.
 *
 * Every piece is the real instrument as it looks from directly above, drawn
 * in floor units (32 = 1 m), centered on 0,0. The PLAYER IS UPSTAGE of the
 * instrument (at -y) and faces the audience (+y), so the player's right hand
 * is at -x (stage right, the viewer's left) and the left hand at +x.
 *
 * What is drawn, and which way round (each checked against a reference; the
 * references are named in the lab's handover notes):
 *   • congas: the conga in front of the player and the larger tumba on the
 *     player's RIGHT; rawhide heads, steel counterhoops with their lug hooks
 *     (five on the conga, six on the tumba), the wider wooden belly as a ring;
 *   • bongó: the larger hembra on the player's RIGHT, the macho on the left,
 *     the wooden center block between the shells, four lugs on each drum;
 *   • timbales: the larger hembra on the player's LEFT and the macho on the
 *     right (the reverse of the bongó), on a tripod stand; the two bells on
 *     the center post, on the audience's side of the drums: the long mambo
 *     bell with its mouth toward the player's right, the small cha-cha bell
 *     with its mouth toward the left;
 *   • percussion: a padded percussion table with hand instruments laid on
 *     it: a tambourine, a triangle with its beater, a güiro, a pair of
 *     maracas, a hand cowbell and a pair of claves;
 *   • piano: an upright piano (the footprint, 1.5 m by 0.66 m, is an
 *     upright's): the top lid with its hinge, the arms, the 88 keys on the
 *     player's side (52 white, 36 black in their twos and threes), the bass
 *     at the player's left hand;
 *   • acoustic instrument: a steel-string guitar lying face up, the neck
 *     toward upstage, as the print symbol draws it;
 *   • horn: a trumpet as it is held, seen from above: the bell toward the
 *     audience, the lead pipe on the player's right, the bell tube on the
 *     left, the three valve buttons between them, the mouthpiece upstage.
 *
 * The instruments are drawn a little over life size where the footprint
 * allows (as the stage draws its people and its drum kit), so they read on a
 * phone. Pure drawings: no state, no text, no image file.
 */
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import type { TopArtMap } from './topArtTypes';

/**
 * How far each drawing reaches from its center, in floor units (the shadow
 * aside). A test holds each inside its print symbol's footprint
 * (`spSymbol(kind).w * 16` by `.h * 16`).
 */
export const TOP_ART_INSTRUMENT_EXTENT = {
  percussion: { hw: 14.8, hh: 8.8 },
  congas: { hw: 13.9, hh: 7.0 },
  timbales: { hw: 16.95, hh: 11.35 },
  bongo: { hw: 9.05, hh: 4.6 },
  piano: { hw: 23.6, hh: 10.2 },
  'acoustic-guitar': { hw: 5.4, hh: 14.2 },
  horn: { hw: 2.4, hh: 10.3 },
} as const;

/* ── the shared palette (floorArt's materials, muted for a dark stage) ── */
const SHADOW = 'rgba(0,0,0,0.45)';
/** The drop shadow: the same shape, moved this far. */
const SHADOW_AT = 'translate(0.8 1.2)';
const OUTLINE = '#0a0a0c';
const SKIN = '#dccfae'; // a rawhide head
const SKIN_EDGE = '#8d7f5c';
const HEAD = '#e8e6dd'; // a plastic head; ivory
const HEAD_EDGE = '#8d8a80';
const STEEL = '#c9c6bc';
const STEEL_DK = '#4a4a46';
const STAND = '#6d7179';
const WOOD = '#7a4c2c'; // a lacquered wooden shell
const WOOD_DK = '#2a180c';
const BRASS = '#b39b48'; // lacquered brass
const BRASS_DK = '#4a3f18';
const BRASS_LT = '#e2d08a';
const EBONY = '#1d1f24';
const BELL = '#8f8c84'; // a raw steel cowbell
const BELL_DK = '#2a2a28';

/** `n` angles (radians) evenly round a drum, the first at `startDeg`. */
function around(n: number, startDeg: number): number[] {
  return Array.from({ length: n }, (_, i) => ((startDeg + (360 / n) * i) * Math.PI) / 180);
}

/* ── congas and bongó: wooden hand drums with rawhide heads ── */

/** A rawhide head from above: the skin, and the line where it turns down
 *  over the edge of the shell. */
function RawhideHead({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={SKIN} stroke={SKIN_EDGE} strokeWidth={0.3} />
      <Circle cx={cx} cy={cy} r={r - 0.42} fill="none" stroke="#c3b58d" strokeWidth={0.2} />
    </G>
  );
}

/** The hook of one tuning lug over a hoop of radius `at`, drawn along +x:
 *  the steel ear and the head of its bolt. */
function LugHook({ at }: { at: number }) {
  return (
    <G>
      <Rect x={at - 0.5} y={-0.4} width={0.85} height={0.8} rx={0.25} fill={STEEL} stroke={STEEL_DK} strokeWidth={0.2} />
      <Circle cx={at - 0.08} cy={0} r={0.16} fill={STEEL_DK} />
    </G>
  );
}

/** A conga from above: the belly (wider than the head) as a ring of wooden
 *  staves, each lug's rod running down it to its side plate, the counterhoop
 *  with its hooks, the rawhide head. */
function CongaDrum({ cx, cy, belly, hoop, lugs, startDeg }: { cx: number; cy: number; belly: number; hoop: number; lugs: number; startDeg: number }) {
  const turns = around(lugs, startDeg).map((a) => `translate(${cx} ${cy}) rotate(${(a * 180) / Math.PI})`);
  const staves = around(24, startDeg + 7.5)
    .map((a) => `M${(cx + Math.cos(a) * hoop).toFixed(3)} ${(cy + Math.sin(a) * hoop).toFixed(3)} L${(cx + Math.cos(a) * (belly - 0.2)).toFixed(3)} ${(cy + Math.sin(a) * (belly - 0.2)).toFixed(3)}`)
    .join('');
  return (
    <G>
      <Circle cx={cx} cy={cy} r={belly} fill={WOOD} stroke={WOOD_DK} strokeWidth={0.45} />
      <Path d={staves} stroke="rgba(30,14,4,0.4)" strokeWidth={0.1} />
      {/* light on the lacquered shoulder */}
      <Circle cx={cx} cy={cy} r={(belly + hoop) / 2} fill="none" stroke="rgba(255,226,180,0.2)" strokeWidth={0.3} />
      {turns.map((t) => (
        <G key={t} transform={t}>
          <Line x1={hoop} y1={0} x2={belly - 0.4} y2={0} stroke="#a9a69c" strokeWidth={0.34} />
          <Rect x={belly - 0.62} y={-0.45} width={0.4} height={0.9} rx={0.15} fill={STEEL} stroke={STEEL_DK} strokeWidth={0.15} />
        </G>
      ))}
      <Circle cx={cx} cy={cy} r={hoop} fill={STEEL} stroke={STEEL_DK} strokeWidth={0.35} />
      {turns.map((t) => (
        <G key={t} transform={t}>
          <LugHook at={hoop} />
        </G>
      ))}
      <RawhideHead cx={cx} cy={cy} r={hoop - 0.5} />
    </G>
  );
}

// 1.1 × life: an 11 3/4 in conga (belly 37 cm) and a 12 1/2 in tumba (belly 40 cm)
const TUMBA = { cx: -6.9, cy: 0, belly: 7.0, hoop: 6.1, lugs: 6, startDeg: -60 };
const CONGA = { cx: 7.4, cy: 0, belly: 6.5, hoop: 5.7, lugs: 5, startDeg: -90 };

function CongasTop() {
  return (
    <G>
      <G transform={SHADOW_AT}>
        <Circle cx={TUMBA.cx} cy={TUMBA.cy} r={TUMBA.belly} fill={SHADOW} />
        <Circle cx={CONGA.cx} cy={CONGA.cy} r={CONGA.belly} fill={SHADOW} />
      </G>
      <CongaDrum {...TUMBA} />
      <CongaDrum {...CONGA} />
    </G>
  );
}

/** One bongó drum from above: the steel rim with its four lug hooks and the
 *  rawhide head (the shell is no wider than the rim, so it is not seen). */
function BongoDrum({ cx, cy, rim }: { cx: number; cy: number; rim: number }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={rim} fill={STEEL} stroke={STEEL_DK} strokeWidth={0.35} />
      {[45, 135, 225, 315].map((deg) => (
        <G key={deg} transform={`translate(${cx} ${cy}) rotate(${deg})`}>
          <LugHook at={rim + 0.15} />
        </G>
      ))}
      <RawhideHead cx={cx} cy={cy} r={rim - 0.45} />
    </G>
  );
}

// 1.2 × life: an 8 5/8 in hembra and a 7 1/4 in macho, 4.5 cm apart
const HEMBRA = { cx: -4.4, cy: 0, rim: 4.6 };
const MACHO = { cx: 5.06, cy: 0, rim: 3.95 };

function BongoTop() {
  return (
    <G>
      <G transform={SHADOW_AT}>
        <Circle cx={HEMBRA.cx} cy={HEMBRA.cy} r={HEMBRA.rim} fill={SHADOW} />
        <Circle cx={MACHO.cx} cy={MACHO.cy} r={MACHO.rim} fill={SHADOW} />
      </G>
      {/* the wooden center block that joins the two shells */}
      <Rect x={-0.5} y={-1.6} width={2.3} height={3.2} rx={0.3} fill={WOOD} stroke={WOOD_DK} strokeWidth={0.35} />
      <BongoDrum {...HEMBRA} />
      <BongoDrum {...MACHO} />
    </G>
  );
}

/* ── timbales ── */

/** A cowbell from above, lying along +x from its heel (x = 0) to its mouth. */
function Cowbell({ len, heel, mouth, clampAt }: { len: number; heel: number; mouth: number; clampAt?: number }) {
  return (
    <G>
      <Path d={`M0 ${-heel / 2} L${len} ${-mouth / 2} L${len} ${mouth / 2} L0 ${heel / 2} Z`} fill={BELL} stroke={BELL_DK} strokeWidth={0.35} strokeLinejoin="round" />
      {/* the folded ridge of the heel, and the lip of the mouth */}
      <Line x1={0.5} y1={-heel / 2 + 0.25} x2={0.5} y2={heel / 2 - 0.25} stroke={BELL_DK} strokeWidth={0.25} />
      <Line x1={len - 0.3} y1={-mouth / 2 + 0.3} x2={len - 0.3} y2={mouth / 2 - 0.3} stroke="#55534d" strokeWidth={0.4} />
      <Line x1={1.2} y1={0} x2={len - 1} y2={0} stroke="rgba(255,255,255,0.2)" strokeWidth={0.3} />
      {/* a mounted bell's clamp, welded to its back near the heel */}
      {clampAt === undefined ? null : <Rect x={clampAt - 0.75} y={-0.6} width={1.5} height={1.2} rx={0.2} fill="#3a3c42" stroke={OUTLINE} strokeWidth={0.2} />}
    </G>
  );
}

/** One timbal from above: the chrome hoop with its six lug ears and the
 *  plastic head (the metal shell is straight, under the hoop). */
function Timbal({ cx, cy, hoop }: { cx: number; cy: number; hoop: number }) {
  return (
    <G>
      {around(6, 30).map((a, i) => (
        <G key={i}>
          <Circle cx={cx + Math.cos(a) * (hoop + 0.2)} cy={cy + Math.sin(a) * (hoop + 0.2)} r={0.42} fill={STEEL} stroke={STEEL_DK} strokeWidth={0.25} />
          <Circle cx={cx + Math.cos(a) * (hoop + 0.2)} cy={cy + Math.sin(a) * (hoop + 0.2)} r={0.15} fill={STEEL_DK} />
        </G>
      ))}
      <Circle cx={cx} cy={cy} r={hoop} fill={STEEL} stroke={STEEL_DK} strokeWidth={0.4} />
      <Circle cx={cx} cy={cy} r={hoop - 0.55} fill={HEAD} stroke={HEAD_EDGE} strokeWidth={0.3} />
      {/* the head's collar, where it turns down over the shell's edge */}
      <Circle cx={cx} cy={cy} r={hoop - 1.15} fill="none" stroke="#b9b6ac" strokeWidth={0.3} />
    </G>
  );
}

// 1.3 × life: a 14 in macho and a 15 in hembra; the post between them
const T_MACHO = { cx: -8.7, cy: -2.6, hoop: 7.6 };
const T_HEMBRA = { cx: 8.0, cy: -2.6, hoop: 8.1 };
const T_POST = { x: -0.5, y: -2.6 };
/** The tripod's feet: one toward the audience, two beside the player (those
 *  two are under the drums, so they are not seen). */
const T_FEET = [90, 210, 330].map((deg) => {
  const a = (deg * Math.PI) / 180;
  return { x: T_POST.x + Math.cos(a) * 12.5, y: T_POST.y + Math.sin(a) * 12.5, deg };
});

function TimbalesTop() {
  return (
    <G>
      <G transform={SHADOW_AT}>
        <Circle cx={T_MACHO.cx} cy={T_MACHO.cy} r={T_MACHO.hoop} fill={SHADOW} />
        <Circle cx={T_HEMBRA.cx} cy={T_HEMBRA.cy} r={T_HEMBRA.hoop} fill={SHADOW} />
      </G>
      {/* the tripod stand: legs from the post, a rubber foot on each */}
      {T_FEET.map((f) => (
        <G key={f.deg}>
          <Line x1={T_POST.x} y1={T_POST.y} x2={f.x} y2={f.y} stroke={STAND} strokeWidth={1} strokeLinecap="round" />
          <G transform={`translate(${f.x} ${f.y}) rotate(${f.deg})`}>
            <Rect x={-1.1} y={-0.6} width={1.7} height={1.2} rx={0.4} fill="#1b1c20" stroke={OUTLINE} strokeWidth={0.25} />
          </G>
        </G>
      ))}
      {/* the bracket that carries both shells */}
      <Rect x={-1.7} y={-4.1} width={2.4} height={3} rx={0.4} fill="#3a3c42" stroke={OUTLINE} strokeWidth={0.35} />
      <Timbal {...T_MACHO} />
      <Timbal {...T_HEMBRA} />
      {/* the mambo bell: over the macho's far edge, its mouth to the player's right */}
      <G transform={`translate(${T_POST.x} ${T_POST.y}) rotate(132) translate(-0.6 0)`}>
        <G transform="translate(0.9 0.9)">
          <Path d="M0 -1.05 L8.9 -2.1 L8.9 2.1 L0 1.05 Z" fill="rgba(0,0,0,0.35)" />
        </G>
        <Cowbell len={8.9} heel={2.1} mouth={4.2} clampAt={0.6} />
      </G>
      {/* the cha-cha bell: higher on the post, its mouth to the player's left */}
      <G transform={`translate(${T_POST.x} ${T_POST.y}) rotate(52) translate(-0.6 0)`}>
        <G transform="translate(0.9 0.5)">
          <Path d="M0 -0.85 L6.45 -1.45 L6.45 1.45 L0 0.85 Z" fill="rgba(0,0,0,0.35)" />
        </G>
        <Cowbell len={6.45} heel={1.7} mouth={2.9} clampAt={0.6} />
      </G>
      {/* the top of the bell post, through both clamps */}
      <Circle cx={T_POST.x} cy={T_POST.y} r={0.36} fill={STEEL} stroke={OUTLINE} strokeWidth={0.2} />
    </G>
  );
}

/* ── percussion: a table of hand instruments ── */

/** The eight pairs of jingles of a 10 in tambourine. */
const JINGLES = around(8, 22.5);

/** One maraca along +x: the wooden handle, then the head. */
function Maraca() {
  return (
    <G>
      <Rect x={-4.4} y={-0.3} width={4.6} height={0.6} rx={0.3} fill="#6d4a2c" stroke={WOOD_DK} strokeWidth={0.25} />
      <Ellipse cx={1.5} cy={0} rx={1.65} ry={1.3} fill="#b8935a" stroke={WOOD_DK} strokeWidth={0.3} />
      <Ellipse cx={1.9} cy={-0.35} rx={0.7} ry={0.4} fill="rgba(255,240,210,0.22)" />
    </G>
  );
}

/** The ridges of the güiro, across its long axis. */
const GUIRO_RIDGES = Array.from({ length: 13 }, (_, i) => `M${-3.6 + i * 0.6} -1.02 V1.02`).join('');

function PercussionTop() {
  return (
    <G>
      <Rect x={-14.8 + 0.8} y={-8.8 + 1.2} width={29.6} height={17.6} rx={1.3} fill={SHADOW} />
      {/* the table: a raised rail round a padded black top */}
      <Rect x={-14.8} y={-8.8} width={29.6} height={17.6} rx={1.3} fill="#34373e" stroke={OUTLINE} strokeWidth={0.6} />
      <Rect x={-14} y={-8} width={28} height={16} rx={0.8} fill="#15161a" stroke="#4d5159" strokeWidth={0.4} />

      {/* a 10 in tambourine, head up: jingles in the frame's slots */}
      <G transform="translate(-8.5 -2.5)">
        {JINGLES.map((a, i) => (
          <Circle key={i} cx={Math.cos(a) * 4.05} cy={Math.sin(a) * 4.05} r={0.85} fill={BRASS} stroke={BRASS_DK} strokeWidth={0.25} />
        ))}
        <Circle cx={0} cy={0} r={4.1} fill="#8a6a3c" stroke={WOOD_DK} strokeWidth={0.35} />
        <Circle cx={0} cy={0} r={3.6} fill={HEAD} stroke={HEAD_EDGE} strokeWidth={0.25} />
      </G>

      {/* a steel triangle (one corner open) and its beater */}
      <Path d="M-0.4 1.6 L-2.4 1.6 L0.3 -3.2 L3 1.6 L1 1.6" fill="none" stroke={STEEL} strokeWidth={0.5} strokeLinejoin="round" strokeLinecap="round" />
      <Line x1={3.3} y1={-3} x2={4.1} y2={0.5} stroke={STEEL} strokeWidth={0.4} strokeLinecap="round" />

      {/* a güiro: the ridged gourd */}
      <G transform="translate(5.6 -5.6) rotate(-4)">
        <Path d="M-5.6 0 C-4.6 -1.5 -2.4 -1.35 0 -1.35 C2.6 -1.35 4.6 -1.2 5.6 0 C4.6 1.2 2.6 1.35 0 1.35 C-2.4 1.35 -4.6 1.5 -5.6 0 Z" fill="#b08a4a" stroke={WOOD_DK} strokeWidth={0.35} />
        <Path d={GUIRO_RIDGES} stroke="#5d4522" strokeWidth={0.25} />
      </G>

      {/* a pair of maracas */}
      <G transform="translate(9.2 0.3) rotate(-12)">
        <Maraca />
      </G>
      <G transform="translate(9.6 4.4) rotate(7)">
        <Maraca />
      </G>

      {/* a hand cowbell */}
      <G transform="translate(-11.9 4.9) rotate(5)">
        <Cowbell len={6.8} heel={1.8} mouth={3.4} />
      </G>

      {/* a pair of claves, one laid across the other */}
      <G transform="translate(-0.6 5.6) rotate(-16)">
        <Rect x={-3.2} y={-0.42} width={6.4} height={0.84} rx={0.42} fill="#6a3322" stroke="#2a120a" strokeWidth={0.25} />
      </G>
      <G transform="translate(0.4 5) rotate(18)">
        <Rect x={-3.2} y={-0.42} width={6.4} height={0.84} rx={0.42} fill="#7a3c28" stroke="#2a120a" strokeWidth={0.25} />
      </G>
    </G>
  );
}

/* ── piano: an upright ── */

/** The keyboard: 122.5 cm of keys, 52 white. */
const KEYS_X0 = -19.6;
const KEY_W = 39.2 / 52;
/** Front of the white keys (the player's side), the back of the keys, and
 *  where the black keys end. */
const KEYS_FRONT = -9.5;
const KEYS_BACK = -4.7;
const BLACK_FRONT = -7.74;
const WHITE_JOINTS = Array.from({ length: 51 }, (_, i) => `M${(KEYS_X0 + (i + 1) * KEY_W).toFixed(3)} ${KEYS_FRONT} V${KEYS_BACK}`).join('');
/** A black key follows every white key but B and E; the lowest key is A. The
 *  BASS is at the player's left hand, which is +x (the player is upstage of
 *  the keys and faces the audience), so the keys are counted from +x. */
const BLACK_KEYS = Array.from({ length: 51 }, (_, i) => i)
  .filter((i) => 'ACDFG'.includes('ABCDEFG'[i % 7]!))
  .map((i) => `M${(-KEYS_X0 - (i + 1) * KEY_W).toFixed(3)} ${BLACK_FRONT} V${KEYS_BACK}`)
  .join('');

function PianoTop() {
  return (
    <G>
      <Rect x={-23.6 + 0.8} y={-10.2 + 1.2} width={47.2} height={20.4} rx={0.8} fill={SHADOW} />
      {/* the key bed between the two arms, and the key slip along its front */}
      <Rect x={-23.6} y={-10.2} width={47.2} height={9} rx={0.7} fill={EBONY} stroke={OUTLINE} strokeWidth={0.6} />
      {/* the keys: ivory, their joints, the black keys in twos and threes */}
      <Rect x={KEYS_X0} y={KEYS_FRONT} width={39.2} height={KEYS_BACK - KEYS_FRONT} fill={HEAD} />
      <Path d={WHITE_JOINTS} stroke="#7d7a70" strokeWidth={0.14} />
      <Path d={BLACK_KEYS} stroke="#121316" strokeWidth={0.44} />
      {/* the key blocks at each end of the keyboard, inside the arms */}
      <Path d={`M${KEYS_X0} ${KEYS_FRONT} V${KEYS_BACK} M${-KEYS_X0} ${KEYS_FRONT} V${KEYS_BACK}`} stroke={OUTLINE} strokeWidth={0.3} />
      <Path d="M-21.6 -9.6 V-2.7 M21.6 -9.6 V-2.7" stroke="#34373e" strokeWidth={0.3} />
      {/* the open fallboard, lying back behind the keys */}
      <Rect x={-21.6} y={KEYS_BACK} width={43.2} height={2} fill="#26282d" stroke={OUTLINE} strokeWidth={0.3} />
      <Line x1={-21.2} y1={KEYS_BACK + 0.45} x2={21.2} y2={KEYS_BACK + 0.45} stroke="#7a2a22" strokeWidth={0.3} />
      {/* the case top: the lid, its hinge along the back, light on its front edge */}
      <Rect x={-23.6} y={-2.7} width={47.2} height={12.9} rx={0.7} fill="#202227" stroke={OUTLINE} strokeWidth={0.6} />
      <Line x1={-22.6} y1={-1.9} x2={22.6} y2={-1.9} stroke="rgba(255,255,255,0.16)" strokeWidth={0.5} />
      <Line x1={-22.4} y1={9.3} x2={22.4} y2={9.3} stroke={BRASS} strokeWidth={0.3} />
    </G>
  );
}

/* ── acoustic instrument: a steel-string guitar, face up ── */

/** 0.28 units to the centimeter (88 % of life, so the whole length fits). */
const GTR_NUT = -9.66;
const GTR_SCALE = 18.14;
const fretY = (n: number) => GTR_NUT + GTR_SCALE * (1 - 2 ** (-n / 12));
/** Half the fingerboard's width at a distance down from the nut. */
const boardHalf = (y: number) => 0.62 + ((y - GTR_NUT) / (fretY(20) - GTR_NUT)) * 0.2;
const GTR_FRETS = Array.from({ length: 20 }, (_, i) => {
  const y = fretY(i + 1);
  const h = boardHalf(y);
  return `M${(-h).toFixed(3)} ${y.toFixed(3)} H${h.toFixed(3)}`;
}).join('');
const GTR_BODY = 'M0 0.4 C2.2 0.4 4.02 1.3 4.02 3.2 C4.02 4.6 3.35 5.2 3.35 6.3 C3.35 7.6 5.36 8 5.36 10.4 C5.36 12.75 3 14.1 0 14.1 C-3 14.1 -5.36 12.75 -5.36 10.4 C-5.36 8 -3.35 7.6 -3.35 6.3 C-3.35 5.2 -4.02 4.6 -4.02 3.2 C-4.02 1.3 -2.2 0.4 0 0.4 Z';
const GTR_HEAD = `M-0.62 ${GTR_NUT} L-0.95 -10.3 L-1.05 -14.2 L1.05 -14.2 L0.95 -10.3 L0.62 ${GTR_NUT} Z`;
const GTR_BOARD = `M-0.62 ${GTR_NUT} L0.62 ${GTR_NUT} L0.82 ${fretY(20).toFixed(3)} L-0.82 ${fretY(20).toFixed(3)} Z`;
/** The six strings: nut to saddle, fanning from 3.6 cm to 5.5 cm. */
const GTR_STRINGS = [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((k) => `M${(k * 0.2).toFixed(2)} ${GTR_NUT} L${(k * 0.31).toFixed(3)} 8.45`).join('');
const TUNER_Y = [-10.95, -12.1, -13.25];
/** The strings past the nut, each to its own tuner post (the outer strings
 *  to the nearest posts). */
const GTR_HEAD_STRINGS = [0, 1, 2].map((j) => `M${(-0.5 + j * 0.2).toFixed(2)} ${GTR_NUT} L-0.58 ${TUNER_Y[j]} M${(0.5 - j * 0.2).toFixed(2)} ${GTR_NUT} L0.58 ${TUNER_Y[j]}`).join('');
/** The position marks: frets 3, 5, 7, 9, 15 (one dot) and 12 (two). */
const GTR_DOTS = [3, 5, 7, 9, 12, 15].map((n) => ({ n, y: (fretY(n - 1) + fretY(n)) / 2 }));

function AcousticGuitarTop() {
  return (
    <G>
      <G transform={SHADOW_AT}>
        <Path d={GTR_BODY} fill={SHADOW} />
        <Path d={GTR_BOARD} fill={SHADOW} />
        <Path d={GTR_HEAD} fill={SHADOW} />
      </G>
      {/* the body: a spruce top inside its dark binding */}
      <Path d={GTR_BODY} fill="#b8935a" stroke="#33231a" strokeWidth={0.5} strokeLinejoin="round" />
      {/* the pickguard, under the treble strings */}
      <Path d="M0.5 2.7 C2.2 2.6 3 4.2 2.85 6.2 C2.8 7 2.05 7.15 1.65 6.5 C1.35 5.9 1 5.5 0.2 5.4 Z" fill="#2c1a12" />
      {/* the rosette and the soundhole */}
      <Circle cx={0} cy={4} r={1.78} fill="none" stroke="#4a3320" strokeWidth={0.28} />
      <Circle cx={0} cy={4} r={1.4} fill="#0b0a09" stroke="#33231a" strokeWidth={0.2} />
      {/* the bridge, its saddle and the six bridge pins */}
      <Rect x={-2.1} y={8} width={4.2} height={1.05} rx={0.4} fill="#2e1f18" stroke={OUTLINE} strokeWidth={0.25} />
      <Line x1={-1.05} y1={8.5} x2={1.05} y2={8.4} stroke={HEAD} strokeWidth={0.2} />
      {[-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((k) => (
        <Circle key={k} cx={k * 0.31} cy={8.8} r={0.12} fill={HEAD} />
      ))}
      {/* the headstock, its tuner posts and the tuner buttons at its sides */}
      {TUNER_Y.map((y) => (
        <G key={y}>
          <Rect x={-1.62} y={y - 0.24} width={0.62} height={0.48} rx={0.2} fill={STEEL} stroke={STEEL_DK} strokeWidth={0.15} />
          <Rect x={1} y={y - 0.24} width={0.62} height={0.48} rx={0.2} fill={STEEL} stroke={STEEL_DK} strokeWidth={0.15} />
        </G>
      ))}
      <Path d={GTR_HEAD} fill="#221712" stroke={OUTLINE} strokeWidth={0.3} strokeLinejoin="round" />
      {TUNER_Y.map((y) => (
        <G key={`p${y}`}>
          <Circle cx={-0.58} cy={y} r={0.16} fill={STEEL} />
          <Circle cx={0.58} cy={y} r={0.16} fill={STEEL} />
        </G>
      ))}
      <Path d={GTR_HEAD_STRINGS} stroke="rgba(235,230,210,0.75)" strokeWidth={0.07} />
      {/* the fingerboard with its twenty frets, and the nut */}
      <Path d={GTR_BOARD} fill="#2e1f18" stroke={OUTLINE} strokeWidth={0.25} strokeLinejoin="round" />
      <Path d={GTR_FRETS} stroke="#b9b7ae" strokeWidth={0.13} />
      {GTR_DOTS.map(({ n, y }) =>
        n === 12 ? (
          <G key={n}>
            <Circle cx={-0.3} cy={y} r={0.1} fill="#d8d2c0" />
            <Circle cx={0.3} cy={y} r={0.1} fill="#d8d2c0" />
          </G>
        ) : (
          <Circle key={n} cx={0} cy={y} r={0.1} fill="#d8d2c0" />
        ),
      )}
      <Line x1={-0.62} y1={GTR_NUT} x2={0.62} y2={GTR_NUT} stroke={HEAD} strokeWidth={0.26} />
      <Path d={GTR_STRINGS} stroke="rgba(235,230,210,0.75)" strokeWidth={0.07} />
    </G>
  );
}

/* ── horn: a trumpet, as it is held ── */

/** The lead pipe (the player's right), the valves' line, the bell's axis. */
const TP_LEAD = -1.6;
const TP_VALVE = -0.8;
const TP_BELL = 0;
/** Lead pipe: receiver to the main tuning slide, round its bow, back to the third valve. */
const TP_LEAD_PATH = `M${TP_LEAD} -8.2 V6 A0.4 0.4 0 0 0 ${TP_VALVE} 6 V-0.5`;
/** Bell tube: out of the first valve, round the back bow, forward to the flare. */
const TP_BELL_PATH = `M${TP_VALVE} -3 V-7.5 A0.4 0.4 0 0 1 ${TP_BELL} -7.5 V4`;
const TP_FLARE = 'M0.23 2 C0.3 5.5 0.5 8.2 1.2 9.3 C1.6 9.9 2 10.15 2.3 10.3 L-2.3 10.3 C-2 10.15 -1.6 9.9 -1.2 9.3 C-0.5 8.2 -0.3 5.5 -0.23 2 Z';
const TP_MOUTHPIECE = 'M-1.76 -8 L-1.44 -8 L-1.4 -9.2 C-1.4 -9.6 -1.1 -9.7 -1.1 -10 L-1.1 -10.3 L-2.1 -10.3 L-2.1 -10 C-2.1 -9.7 -1.8 -9.6 -1.8 -9.2 Z';
const TP_VALVES_Y = [-2.86, -1.81, -0.76];

function HornTop() {
  return (
    <G>
      <G transform={SHADOW_AT}>
        <Path d={TP_LEAD_PATH} fill="none" stroke={SHADOW} strokeWidth={0.6} />
        <Path d={TP_BELL_PATH} fill="none" stroke={SHADOW} strokeWidth={0.6} />
        <Path d={TP_FLARE} fill={SHADOW} />
        <Path d={TP_MOUTHPIECE} fill={SHADOW} />
      </G>
      {/* the second valve's slide, a short stub toward the player's right */}
      <Line x1={TP_VALVE} y1={-1.81} x2={-2.2} y2={-1.55} stroke={BRASS_DK} strokeWidth={0.62} strokeLinecap="round" />
      <Line x1={TP_VALVE} y1={-1.81} x2={-2.2} y2={-1.55} stroke={BRASS} strokeWidth={0.38} strokeLinecap="round" />
      {/* the two braces between the lead pipe and the bell tube */}
      <Path d={`M${TP_LEAD} -6.86 H${TP_BELL} M${TP_LEAD} 3.38 H${TP_BELL}`} stroke={BRASS_DK} strokeWidth={0.3} />
      {/* the tubing: dark edge, brass, a line of light */}
      <Path d={TP_BELL_PATH} fill="none" stroke={BRASS_DK} strokeWidth={0.66} strokeLinecap="round" />
      <Path d={TP_LEAD_PATH} fill="none" stroke={BRASS_DK} strokeWidth={0.66} strokeLinecap="round" />
      <Path d={TP_BELL_PATH} fill="none" stroke={BRASS} strokeWidth={0.42} strokeLinecap="round" />
      <Path d={TP_LEAD_PATH} fill="none" stroke={BRASS} strokeWidth={0.42} strokeLinecap="round" />
      {/* the bell, its rim toward the audience */}
      <Path d={TP_FLARE} fill={BRASS} stroke={BRASS_DK} strokeWidth={0.3} strokeLinejoin="round" />
      <Path d="M0 2.6 C0.05 6 0.2 8.4 0.7 9.6" fill="none" stroke={BRASS_LT} strokeWidth={0.22} strokeLinecap="round" />
      <Line x1={-2.15} y1={10.18} x2={2.15} y2={10.18} stroke={BRASS_LT} strokeWidth={0.24} />
      {/* the three valves: the casing, then the finger button with its pearl */}
      {TP_VALVES_Y.map((y) => (
        <G key={y}>
          <Circle cx={TP_VALVE} cy={y} r={0.5} fill={BRASS_DK} />
          <Circle cx={TP_VALVE} cy={y} r={0.4} fill={STEEL} stroke={STEEL_DK} strokeWidth={0.14} />
          <Circle cx={TP_VALVE} cy={y} r={0.24} fill={HEAD} />
        </G>
      ))}
      {/* the mouthpiece in its receiver */}
      <Rect x={TP_LEAD - 0.3} y={-8.3} width={0.6} height={1} rx={0.15} fill={BRASS} stroke={BRASS_DK} strokeWidth={0.18} />
      <Path d={TP_MOUTHPIECE} fill={STEEL} stroke={STEEL_DK} strokeWidth={0.2} strokeLinejoin="round" />
    </G>
  );
}

export const TOP_ART_INSTRUMENTS: TopArtMap = {
  percussion: PercussionTop,
  congas: CongasTop,
  timbales: TimbalesTop,
  bongo: BongoTop,
  piano: PianoTop,
  'acoustic-guitar': AcousticGuitarTop,
  horn: HornTop,
};

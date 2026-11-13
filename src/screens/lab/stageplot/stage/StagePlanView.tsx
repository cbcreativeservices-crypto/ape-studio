/**
 * StagePlanView — the TOP-DOWN STAGE of the Stage Plot and Channel Designer
 * (must-do D60): the drawing on the Rack Unit's glass that the band drags its
 * setup around on. SVG + PanResponder, after roomdesign/RoomPlanView.
 *
 * WHAT IS ALWAYS TRUE OF THE PICTURE
 *   • The audience is at the BOTTOM. The four direction words stand in a
 *     frame round the picture and never move, at any zoom:
 *     UPSTAGE (top), AUDIENCE / DOWNSTAGE (bottom), STAGE RIGHT on the
 *     viewer's left, STAGE LEFT on the viewer's right. There is no flip.
 *   • The stage reads as a stage: a timber deck, a bright front edge on the
 *     audience side, arrows that point at the audience.
 *   • Everything is laid out in GLASS UNITS (box ÷ StageTextScale) and painted
 *     through one viewBox, so FULL SCREEN is the same picture, larger, and a
 *     touch divided by the same scale lands under the finger (stageGeom.ts).
 *   • FULL SCREEN is given NO fixed shape: the drawing takes the whole body
 *     and fits the stage into it, so 1× always shows the whole stage and the
 *     shared full-screen view has no FIT step that could cut the stage's
 *     sides off (visual review 2026-11-12). The dock's ZOOM is the zoom.
 *   • Names and numbers are at least 9.5 glass units, set in the open (a dark
 *     halo behind each), clear of the symbols and of each other.
 *   • The selected object is told by SHAPE: a dashed ring with four corner
 *     brackets and a pointer on the side it faces. Its group wears a dotted
 *     ring. Color only repeats it.
 *
 * THE KEY (owner 2026-11-12) is part of this drawing, always: a strip
 * directly under the stage frame that names each kind of object on the
 * stage, drawn with the stage's own art (StageKey). The stage is laid out in
 * the height that is left above it. The key is a separate box UNDER the box
 * that takes the drags, so it takes no touches; in FULL SCREEN it is the same
 * strip under the stage, so it stays in view at every step of the dock's
 * ZOOM (which zooms inside the frame).
 *
 * A DRAG IS ONE EDIT. While the finger is down the moving position lives in
 * this view's own state (the project is not touched, so the transform cannot
 * re-fit under the finger); on release `onMove` is called ONCE, and the model
 * (spMoveObject) moves the object, its group, and applies the snap. The
 * picture under the finger already shows where that will be (stageSnapPoint).
 */
import { memo, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Platform, View, type ViewStyle } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { GestureExclusionZone, STAGE_BAND_DP } from '../../../../../modules/ape-gesture-exclusion';
import { spStageAspect } from '../../../../features/stageplot/spModel';
import { spPlotKey } from '../../../../features/stageplot/spSymbols';
import type { SpId, SpProject } from '../../../../features/stageplot/spTypes';
import { colors, fonts } from '../../../../theme/tokens';
import { StageDeck } from '../../cableinstall/scenes/floorArt';
import { StageInFullScreen, useStageTextScale } from '../../rack/stageAspect';
import { fingerAt, fingerOffset, touchToGlass, type Finger } from '../../roomdesign/planGeom';
import { STAGE_INK, StageObjectArt } from './stageArt';
import { StageKey } from './StageKey';
import {
  STAGE_BADGE_FS,
  STAGE_FRAME,
  STAGE_MIN_REACH,
  stageBoxBounds,
  stageBoxCorners,
  stageDrawOrder,
  stageFacingPoint,
  stageFrameBoxes,
  stageGridLines,
  stageHit,
  stageKeyLayout,
  stageScaleNote,
  stageLabelLeader,
  stageLabels,
  stageLivePositions,
  stageObjectBox,
  stagePan,
  stageRegion,
  stageResizeHandle,
  stageResizeTo,
  stageSymbolScale,
  stageTransform,
  type Pt,
  type StageLabelIn,
  type StageObjBox,
  type StageTransform,
  type StageView,
} from './stageGeom';
import { stageBadges, stageListName, stageName } from './stageLinks';

const GLASS = '#0c0c10';
const WORD = '#c9ccd5';
const HALO = '#0b0b0e';
const AMBER = colors.amber;
/** A finger must travel this far (glass units) before a touch is a drag: a
 *  tap selects and never moves anything. */
const DRAG_SLOP = 5;
/** The drawing is one labeled element for a screen reader. On a phone the
 *  SVG under it is hidden with the two native props; on the web those are not
 *  DOM attributes (a console warning on every render), and `aria-hidden` on
 *  the tag does the same job. */
/** Web: a drag must not select the drawing's words (they turned blue). The
 *  style is a text style in React Native's types; on the web it is plain CSS
 *  on the box, which is where it is needed. */
const NO_SELECT = (Platform.OS === 'web' ? { userSelect: 'none' } : null) as ViewStyle | null;
const SVG_HIDDEN_NATIVE = Platform.OS === 'web' ? {} : ({ accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const);

export type StagePlanProps = {
  w: number;
  h: number;
  project: SpProject;
  selectedId: SpId | null;
  view: StageView;
  onView: (v: StageView) => void;
  showNames: boolean;
  showNumbers: boolean;
  /** The TURN fader's preview: one object drawn at another turn. */
  turn: { id: SpId; rot: number } | null;
  onSelect: (id: SpId | null) => void;
  /** Called ONCE when a drag ends: the place the object was let go (stage
   *  fractions, not snapped: the model snaps). */
  onMove: (id: SpId, to: Pt) => void;
  /** Called ONCE when a platform's corner handle is let go. */
  onResize: (id: SpId, size: { w: number; h: number }) => void;
  /** Told true while THIS drawing is the one shown in FULL SCREEN (the rack
   *  draws a second copy there), and false when that copy goes away. */
  onFullScreen?: (on: boolean) => void;
};

type Drag = {
  mode: 'move' | 'resize' | 'pan' | 'tap';
  id: SpId | null;
  /** Where the object's center (or the handle) was on the glass. */
  c0: Pt;
  T0: StageTransform;
  box0: StageObjBox | null;
  view0: StageView;
  s: number;
  gw: number;
  gh: number;
  finger: Finger;
  moved: boolean;
};

/** The deck, its grid and its front edge: painted again only when the
 *  transform or the grid changes, not on every frame of a drag. */
const Deck = memo(function Deck({ x, y, w, h, xs, ys }: { x: number; y: number; w: number; h: number; xs: number[]; ys: number[] }) {
  const grid = [...xs.map((gx) => `M${gx} ${y + 1} V${y + h - 1}`), ...ys.map((gy) => `M${x + 1} ${gy} H${x + w - 1}`)].join('');
  return (
    <G>
      <StageDeck x={x} y={y} w={w} h={h} />
      {grid ? <Path d={grid} stroke="rgba(255,255,255,0.13)" strokeWidth={0.6} /> : null}
      {/* the outline of the stage, then the FRONT EDGE: the lip the audience
          sees, brighter and thicker than the other three sides */}
      <Rect x={x} y={y} width={w} height={h} rx={4} fill="none" stroke="#5d5142" strokeWidth={1} />
      <Rect x={x} y={y + h - 1} width={w} height={4.5} rx={1.5} fill="#8a7450" />
      <Line x1={x + 2} y1={y + h - 0.6} x2={x + w - 2} y2={y + h - 0.6} stroke="#e7d3a4" strokeWidth={1.3} strokeLinecap="round" />
      {/* the center line's mark on the front edge */}
      <Path d={`M${x + w / 2} ${y + h - 7} V${y + h + 3.5}`} stroke="#e7d3a4" strokeWidth={1} />
    </G>
  );
});

/** A word with a dark halo behind it, so it reads on the deck. */
function Halo({ x, y, text, fs, anchor, fill, family }: { x: number; y: number; text: string; fs: number; anchor: 'start' | 'middle' | 'end'; fill: string; family: string }) {
  return (
    <G>
      <SvgText x={x} y={y} fill="none" stroke={HALO} strokeWidth={3.2} strokeLinejoin="round" fontSize={fs} fontFamily={family} textAnchor={anchor}>
        {text}
      </SvgText>
      <SvgText x={x} y={y} fill={fill} fontSize={fs} fontFamily={family} textAnchor={anchor}>
        {text}
      </SvgText>
    </G>
  );
}

export function StagePlanView({ w, h, project, selectedId, view, onView, showNames, showNumbers, turn, onSelect, onMove, onResize, onFullScreen }: StagePlanProps) {
  const p = project;
  const s = useStageTextScale();
  const gw = w / s;
  // THE KEY takes its rows at the bottom of the glass; the stage is laid out
  // in the height above it (never under a third of the glass).
  const keyEntries = useMemo(() => spPlotKey(p.objects), [p.objects]);
  const scaleNote = stageScaleNote(p);
  const keyLayout = useMemo(() => stageKeyLayout(keyEntries, gw, scaleNote), [keyEntries, gw, scaleNote]);
  const ghAll = h / s;
  const gh = Math.max(ghAll / 3, ghAll - keyLayout.height);
  const stageH = gh * s;
  const inFull = useContext(StageInFullScreen);

  /** The object under the finger, as it moves: where it would be let go. */
  const [live, setLive] = useState<{ id: SpId; to: Pt } | null>(null);
  const [liveSize, setLiveSize] = useState<{ id: SpId; w: number; h: number } | null>(null);

  const aspect = spStageAspect(p);
  // The region follows the SAVED objects only. A drag does not touch the
  // project, so the picture cannot re-fit (and run away) under the finger.
  const region = useMemo(() => stageRegion(p.objects), [p.objects]);
  const T = useMemo(() => stageTransform(aspect, gw, gh, region, view), [aspect, gw, gh, region, view]);
  const u = stageSymbolScale(p, T);

  // The copy drawn in FULL SCREEN says so, so the area can keep its ADD and
  // OBJECT trays there (a popup cannot be presented over the full-screen view).
  const fullRef = useRef(onFullScreen);
  fullRef.current = onFullScreen;
  useEffect(() => {
    if (!inFull) return undefined;
    fullRef.current?.(true);
    return () => fullRef.current?.(false);
  }, [inFull]);

  const order = useMemo(() => stageDrawOrder(p.objects), [p.objects]);
  const livePos = useMemo(() => (live ? stageLivePositions(p, live.id, live.to) : null), [p, live]);
  const boxes = useMemo(
    () =>
      order.map((o) =>
        stageObjectBox(p, o, T, {
          at: livePos?.get(o.id),
          size: liveSize && liveSize.id === o.id ? liveSize : undefined,
          rot: turn && turn.id === o.id ? turn.rot : undefined,
        }),
      ),
    [order, p, T, livePos, liveSize, turn],
  );
  const boxOf = useMemo(() => new Map(boxes.map((b) => [b.id, b])), [boxes]);
  const selected = selectedId ? (p.objects.find((o) => o.id === selectedId) ?? null) : null;
  const selBox = selected ? (boxOf.get(selected.id) ?? null) : null;
  const groupIds = useMemo(() => (selected?.groupId ? p.objects.filter((o) => o.groupId === selected.groupId && o.id !== selected.id).map((o) => o.id) : []), [p.objects, selected]);

  // ── names and numbers ─────────────────────────────────────────────────────
  const frame = useMemo(() => stageFrameBoxes(gw, gh), [gw, gh]);
  const labels = useMemo(() => {
    if (!showNames && !showNumbers && !selectedId) return [];
    const items: StageLabelIn[] = order.map((o, i) => ({
      id: o.id,
      // the selected object is always named on the drawing (there is no
      // readout row): its own name, or what it is when it has none
      text: o.id === selectedId ? stageListName(p, o) : showNames ? stageName(p, o) : '',
      badges: showNumbers ? stageBadges(p, o, livePos?.get(o.id) ?? o) : [],
      box: boxes[i],
      person: o.kind === 'performer',
    }));
    return stageLabels(items, gw, gh, [frame.top, frame.bottom, frame.left, frame.right]);
  }, [order, boxes, p, livePos, showNames, showNumbers, selectedId, gw, gh, frame]);

  const grid = useMemo(() => (p.stage.grid ? stageGridLines(p, T) : { xs: [], ys: [], every: 1 }), [p, T]);

  // ── touch ─────────────────────────────────────────────────────────────────
  const ref = useRef({ p, boxes, T, s, gw, gh, view, selectedId, inFull, onSelect, onMove, onResize, onView });
  ref.current = { p, boxes, T, s, gw, gh, view, selectedId, inFull, onSelect, onMove, onResize, onView };
  const drag = useRef<Drag | null>(null);
  const liveRef = useRef<{ to: Pt | null; size: { w: number; h: number } | null }>({ to: null, size: null });

  /** Let go: one edit for what the finger did, then the live state is gone. */
  const finish = (commit: boolean) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const st = ref.current;
    const l = liveRef.current;
    liveRef.current = { to: null, size: null };
    if (commit && d.moved && d.id) {
      if (d.mode === 'move' && l.to) st.onMove(d.id, l.to);
      if (d.mode === 'resize' && l.size) st.onResize(d.id, l.size);
    }
    if (commit && d.mode === 'tap' && !d.moved) st.onSelect(null);
    setLive(null);
    setLiveSize(null);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => {
        const st = ref.current;
        const g = touchToGlass(e.nativeEvent.locationX, e.nativeEvent.locationY, st.s);
        const base = { T0: st.T, view0: st.view, s: st.s, gw: st.gw, gh: st.gh, finger: fingerAt(e.nativeEvent), moved: false };
        // the corner handle of a selected platform comes first
        const selB = st.selectedId ? st.boxes.find((b) => b.id === st.selectedId) : undefined;
        if (selB?.sized) {
          const hd = stageResizeHandle(selB);
          if (Math.hypot(g.x - hd.x, g.y - hd.y) <= STAGE_MIN_REACH) {
            drag.current = { ...base, mode: 'resize', id: selB.id, c0: hd, box0: selB };
            return true;
          }
        }
        const hit = stageHit(st.boxes, g.x, g.y, { selectedId: st.selectedId });
        if (hit) {
          const b = st.boxes.find((x) => x.id === hit) as StageObjBox;
          drag.current = { ...base, mode: 'move', id: hit, c0: { x: b.cx, y: b.cy }, box0: b };
          if (hit !== st.selectedId) st.onSelect(hit);
          return true;
        }
        // bare stage: zoomed in, the finger slides the picture; at the whole
        // stage a tap lets go of the selection. In FULL SCREEN at the whole
        // stage the touch is left to the full-screen view's own panning.
        if (st.view.zoom > 1) {
          drag.current = { ...base, mode: 'pan', id: null, c0: g, box0: null };
          return true;
        }
        if (st.inFull) return false;
        drag.current = { ...base, mode: 'tap', id: null, c0: g, box0: null };
        return true;
      },
      onPanResponderMove: (e, gs) => {
        const st = ref.current;
        const d = drag.current;
        if (!d) return;
        // only the finger that began the drag moves it; when the glass changes
        // under it (a rotation, full screen) the drag ends where it is
        const off = fingerOffset(e.nativeEvent, d.finger, { dx: gs.dx, dy: gs.dy });
        if (off === 'lifted' || d.s !== st.s || d.gw !== st.gw || d.gh !== st.gh) {
          finish(true);
          return;
        }
        const dx = off.dx / d.s;
        const dy = off.dy / d.s;
        if (!d.moved && Math.hypot(dx, dy) < DRAG_SLOP) return;
        d.moved = true;
        if (d.mode === 'move' && d.id) {
          // anchored: where the object's center was + the finger's travel,
          // through the transform the drag began with
          const to = d.T0.toFrac({ x: d.c0.x + dx, y: d.c0.y + dy });
          liveRef.current.to = to;
          setLive({ id: d.id, to });
        } else if (d.mode === 'resize' && d.id && d.box0) {
          const size = stageResizeTo(st.p, d.box0, d.T0, d.c0.x + dx, d.c0.y + dy);
          liveRef.current.size = size;
          setLiveSize({ id: d.id, ...size });
        } else if (d.mode === 'pan') {
          st.onView(stagePan(d.view0, d.T0, dx, dy));
        }
      },
      onPanResponderRelease: () => finish(true),
      onPanResponderTerminate: () => finish(true),
      onPanResponderReject: () => finish(false),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  // ── the picture ───────────────────────────────────────────────────────────
  const deck = T.toGlass({ x: 0, y: 0 });
  const midX = gw / 2;
  const midY = (STAGE_FRAME.top + gh - STAGE_FRAME.bottom) / 2;
  const selName = selected ? stageListName(p, selected) : '';
  const a11y = `Stage plot, seen from the audience: the audience is at the bottom, stage right is on the left. ${p.objects.length === 1 ? '1 object' : `${p.objects.length} objects`}. ${selected ? `${selName} is selected.` : 'Nothing is selected.'} The list of objects under the drawing moves each one without dragging.`;
  const ringCorners = selBox ? stageBoxCorners(selBox, 5) : null;
  const facing = selBox && !selBox.sized ? stageFacingPoint(selBox, 11) : null;
  const handle = selBox?.sized ? stageResizeHandle(selBox) : null;

  return (
    <View style={{ width: w, height: h, overflow: 'hidden' }}>
    <View style={[{ width: w, height: stageH }, NO_SELECT]} {...pan.panHandlers} accessible accessibilityLabel={a11y}>
      {/* Android gesture navigation: a drag that starts at the screen edge must
          not start the system back gesture (modules/ape-gesture-exclusion). */}
      <GestureExclusionZone maxHeightDp={STAGE_BAND_DP} />
      {/* The drawing takes no touches of its own: every touch lands on the
          view above, so its place is measured from this box on every platform. */}
      <View pointerEvents="none">
        <Svg aria-hidden {...SVG_HIDDEN_NATIVE} width={w} height={stageH} viewBox={`0 0 ${gw} ${gh}`}>
          <Rect x={0} y={0} width={gw} height={gh} fill={GLASS} />
          <Deck x={deck.x} y={deck.y} w={T.kx} h={T.ky} xs={grid.xs} ys={grid.ys} />

          {order.map((o, i) => {
            const b = boxes[i];
            const at = livePos?.get(o.id) ?? o;
            const off = at.x < 0 || at.x > 1 || at.y < 0 || at.y > 1;
            return <StageObjectArt key={o.id} p={p} o={o} cx={b.cx} cy={b.cy} hw={b.hw} hh={b.hh} rot={b.rot} u={u} dim={off} />;
          })}

          {p.objects.length === 0 ? (
            <SvgText x={deck.x + T.kx / 2} y={deck.y + T.ky / 2 + 4} fill={WORD} fontSize={12} fontFamily={fonts.barlowMedium} textAnchor="middle">
              Your stage is empty. Tap ADD to place your band.
            </SvgText>
          ) : null}

          {/* the selected object's group: a dotted ring each */}
          {groupIds.map((id) => {
            const b = boxOf.get(id);
            if (!b) return null;
            return <Polygon key={`g${id}`} points={stageBoxCorners(b, 4).map((c) => `${c.x},${c.y}`).join(' ')} fill="none" stroke={STAGE_INK} strokeWidth={1.1} strokeDasharray="1.5 3" strokeLinecap="round" strokeLinejoin="round" />;
          })}

          {/* THE SELECTION: a dashed ring, four corner brackets, and a pointer
              on the side the object faces. A shape, not only a color. */}
          {selBox && ringCorners ? (
            <G>
              <Polygon points={ringCorners.map((c) => `${c.x},${c.y}`).join(' ')} fill="rgba(255,198,77,0.07)" stroke={HALO} strokeWidth={3.4} strokeLinejoin="round" />
              <Polygon points={ringCorners.map((c) => `${c.x},${c.y}`).join(' ')} fill="none" stroke={AMBER} strokeWidth={1.5} strokeDasharray="5 3" strokeLinejoin="round" />
              {ringCorners.map((c, i) => {
                // a bracket: a short stroke along each of the two sides that meet here
                const prev = ringCorners[(i + 3) % 4];
                const next = ringCorners[(i + 1) % 4];
                const leg = (q: Pt) => {
                  const len = Math.hypot(q.x - c.x, q.y - c.y) || 1;
                  const k = Math.min(8, len / 2.4) / len;
                  return `${c.x + (q.x - c.x) * k} ${c.y + (q.y - c.y) * k}`;
                };
                return <Path key={`b${i}`} d={`M${leg(prev)} L${c.x} ${c.y} L${leg(next)}`} fill="none" stroke={AMBER} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />;
              })}
              {facing ? (
                <G transform={`translate(${facing.x} ${facing.y}) rotate(${selBox.rot})`}>
                  <Path d="M-5 -3 L0 4 L5 -3 Z" fill={AMBER} stroke={HALO} strokeWidth={1} strokeLinejoin="round" />
                </G>
              ) : null}
              {handle ? (
                <G>
                  <Circle cx={handle.x} cy={handle.y} r={8} fill={HALO} stroke={AMBER} strokeWidth={1.6} />
                  <Path d={`M${handle.x - 3.2} ${handle.y + 3.2} L${handle.x + 3.2} ${handle.y - 3.2} M${handle.x - 3.2} ${handle.y - 0.4} V${handle.y + 3.2} H${handle.x + 0.4} M${handle.x + 3.2} ${handle.y + 0.4} V${handle.y - 3.2} H${handle.x - 0.4}`} fill="none" stroke={AMBER} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
                </G>
              ) : null}
            </G>
          ) : null}

          {/* names and numbers, each clear of the others (stageLabels) */}
          {labels.map((l) => {
            const b = boxOf.get(l.id);
            const lead = b && !b.sized ? stageLabelLeader(l.box, stageBoxBounds(b)) : null;
            const isSel = l.id === selectedId;
            return (
              <G key={`l${l.id}`}>
                {lead ? <Line x1={lead.x1} y1={lead.y1} x2={lead.x2} y2={lead.y2} stroke="#8d9199" strokeWidth={0.7} strokeDasharray="2 2" /> : null}
                {l.lines.map((ln, k) => (
                  <Halo key={k} x={ln.x} y={ln.y} text={ln.text} fs={l.fs} anchor={ln.anchor} fill={isSel ? AMBER : '#f1f2f5'} family={fonts.oswaldSemiBold} />
                ))}
                {l.badges.map((bd, k) => {
                  // a channel number sits in a square-cornered box, a mix code
                  // (M1, M2…) in a round-ended one: told apart by shape
                  const mix = /^M\d/.test(bd.text);
                  const flag = bd.text === 'OFF STAGE';
                  return (
                    <G key={`b${k}`}>
                      <Rect x={bd.x} y={bd.y} width={bd.w} height={bd.h} rx={mix ? bd.h / 2 : 2} fill={HALO} stroke={flag ? AMBER : mix ? colors.cyanBright : STAGE_INK} strokeWidth={0.9} strokeDasharray={flag ? '3 2' : undefined} />
                      <SvgText x={bd.x + bd.w / 2} y={bd.y + bd.h / 2 + STAGE_BADGE_FS * 0.34} fill={flag ? AMBER : mix ? colors.cyanBright : '#f1f2f5'} fontSize={STAGE_BADGE_FS} fontFamily={fonts.mono} textAnchor="middle">
                        {bd.text}
                      </SvgText>
                    </G>
                  );
                })}
              </G>
            );
          })}

          {/* THE FRAME: four bands that hide whatever slides under them when
              the picture is zoomed, and carry the four direction words. */}
          <Rect x={0} y={0} width={gw} height={STAGE_FRAME.top} fill={GLASS} />
          <Rect x={0} y={gh - STAGE_FRAME.bottom} width={gw} height={STAGE_FRAME.bottom} fill={GLASS} />
          <Rect x={0} y={0} width={STAGE_FRAME.side} height={gh} fill={GLASS} />
          <Rect x={gw - STAGE_FRAME.side} y={0} width={STAGE_FRAME.side} height={gh} fill={GLASS} />
          <Rect x={STAGE_FRAME.side} y={STAGE_FRAME.top} width={Math.max(0, gw - STAGE_FRAME.side * 2)} height={Math.max(0, gh - STAGE_FRAME.top - STAGE_FRAME.bottom)} fill="none" stroke="#26262d" strokeWidth={0.8} />
          <SvgText x={midX} y={STAGE_FRAME.top - 4.5} fill={WORD} fontSize={10} fontFamily={fonts.oswaldSemiBold} textAnchor="middle" letterSpacing={1.4}>
            UPSTAGE
          </SvgText>
          <SvgText x={midX} y={gh - 5} fill={AMBER} fontSize={10.5} fontFamily={fonts.oswaldSemiBold} textAnchor="middle" letterSpacing={1.4}>
            AUDIENCE / DOWNSTAGE
          </SvgText>
          {/* arrows that point at the audience, either side of the words */}
          {[-1, 1].map((side) => {
            const ax = midX + side * Math.min(gw / 2 - 24, 96);
            const ay = gh - STAGE_FRAME.bottom / 2;
            return <Path key={`a${side}`} d={`M${ax - 5} ${ay - 3.5} L${ax} ${ay + 3.5} L${ax + 5} ${ay - 3.5} Z`} fill={AMBER} />;
          })}
          <SvgText x={STAGE_FRAME.side - 4.5} y={midY} fill={WORD} fontSize={10} fontFamily={fonts.oswaldSemiBold} textAnchor="middle" letterSpacing={1.4} transform={`rotate(-90 ${STAGE_FRAME.side - 4.5} ${midY})`}>
            STAGE RIGHT
          </SvgText>
          <SvgText x={gw - STAGE_FRAME.side + 4.5} y={midY} fill={WORD} fontSize={10} fontFamily={fonts.oswaldSemiBold} textAnchor="middle" letterSpacing={1.4} transform={`rotate(90 ${gw - STAGE_FRAME.side + 4.5} ${midY})`}>
            STAGE LEFT
          </SvgText>
        </Svg>
      </View>
    </View>
      {/* THE KEY: always there, directly under the stage frame, part of the
          drawing. Its own box, under the one that takes the drags. */}
      <StageKey project={p} entries={keyEntries} layout={keyLayout} w={w} gw={gw} />
    </View>
  );
}

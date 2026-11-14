/**
 * StageKey — THE KEY under the stage (owner 2026-11-12: "the key explaining
 * what drawn objects are needs to always be there in the drawing to
 * understand it").
 *
 * Each KIND of object that is on THIS stage, drawn small with the SAME art
 * the stage uses for it (stageArt), and its name beside it. The list and the
 * names are the model's (`spPlotKey`): the printed packet's key uses the same
 * ones, so the screen and the paper cannot disagree.
 *
 * It is part of the drawing: a strip directly under the stage frame, inside
 * the pinned display. It is never a popup and never behind a switch, it does
 * not scroll with the well, and it is drawn in FULL SCREEN too (the same
 * strip, under the stage). It takes no touches: it is a separate box under
 * the box that carries the stage's drags, so a finger on the key moves
 * nothing. To a screen reader it is ONE sentence: "Key: Performer, Drum kit…".
 *
 * The right end of its heading row carries the SCALE WORDS: "NOT TO SCALE",
 * or the stage's size and whether it is confirmed. They are in the drawing,
 * with the key, so the display needs no separate line under it.
 *
 * Laid out in glass units by stageGeom's `stageKeyLayout` (node-tested) and
 * painted through one viewBox, so it grows with FULL SCREEN like the stage.
 */
import { useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { spKeyRot, spKeySymbol, type SpKeyEntry } from '../../../../features/stageplot/spSymbols';
import type { SpObject, SpObjectKind, SpProject } from '../../../../features/stageplot/spTypes';
import { colors, fonts } from '../../../../theme/tokens';
import { StageObjectArt } from './stageArt';
import { STAGE_KEY_ART, STAGE_KEY_FS, stageKeyScale, stageKeyWords, type StageKeyLayout } from './stageGeom';

const GLASS = '#0c0c10';
/** The light ink the stage's names are set in. */
const NAME_INK = '#f1f2f5';
/** The direction words' ink: the scale words belong with them. */
const NOTE_INK = '#c9ccd5';
/** See StagePlanView: the SVG under the one labeled box is hidden natively
 *  with the two native props, and with `aria-hidden` on the web. */
const SVG_HIDDEN_NATIVE = Platform.OS === 'web' ? {} : ({ accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const);

/** The scale words as a sentence for a screen reader. */
const scaleWords = (note: string): string => (note === 'NOT TO SCALE' ? 'Not to scale.' : `Stage size: ${note.toLowerCase()}.`);

/** A stand-in object of one kind for the art to draw: facing the audience,
 *  except a wedge, which is turned as the wedges on a stage are (its speaker
 *  toward the performer, upstage): the picture beside the words matches the
 *  thing it explains (`spKeyRot`, the same turn as the printed key). */
const sample = (kind: SpObjectKind): SpObject => ({
  id: `key-${kind}`,
  kind,
  x: 0,
  y: 0,
  rot: spKeyRot(kind),
  label: '',
  w: null,
  h: null,
  sizeNote: '',
  performerId: null,
  sourceId: null,
  inputId: null,
  deviceId: null,
  groupId: null,
  offstageOk: false,
  visualOnly: false,
  note: '',
});

export function StageKey({
  project,
  entries,
  layout,
  w,
  gw,
  shownH,
}: {
  project: SpProject;
  entries: readonly SpKeyEntry[];
  layout: StageKeyLayout<SpObjectKind>;
  /** The strip's width on the screen. */ w: number;
  /** Its width in glass units. */ gw: number;
  /** The height the display can give the key (on the screen), when it is
   *  less than the key needs: the strip then scrolls inside the display,
   *  every row still there (stageKeySplit). */
  shownH?: number;
}) {
  const h = (layout.height * w) / Math.max(1, gw);
  /** How far the key is scrolled: "▼ MORE" fades out at the end, where END OF
   *  THE KEY says it (R2-SP1-05). Not a touch: the key still takes none. */
  const scrolled = useRef(new Animated.Value(0)).current;
  const label = layout.note ? `${stageKeyWords(entries)} ${scaleWords(layout.note.text)}` : stageKeyWords(entries);
  if (shownH != null && shownH < h - 0.5) {
    // A LONG KEY ON A SHORT PHONE: its own scroller, inside the display. The
    // last line says that more of the key is below, so nothing reads as cut.
    return (
      <View style={{ width: w, height: shownH }} accessible accessibilityRole="text" accessibilityLabel={label}>
        <Animated.ScrollView
          style={{ width: w, height: shownH }}
          nestedScrollEnabled
          showsVerticalScrollIndicator
          persistentScrollbar
          scrollEventThrottle={32}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrolled } } }], { useNativeDriver: false })}
        >
          <View pointerEvents="none">{keyArt(project, layout, w, h, gw)}</View>
          {/* room under the last row, so the tag below never covers a name */}
          <Text style={keyStyles.more}>END OF THE KEY</Text>
        </Animated.ScrollView>
        <Animated.View pointerEvents="none" style={[keyStyles.tag, { opacity: scrolled.interpolate({ inputRange: [Math.max(0, h + MORE_H - shownH - 12), Math.max(1, h + MORE_H - shownH - 2)], outputRange: [1, 0], extrapolate: 'clamp' }) }]}>
          <Text style={keyStyles.tagText}>▼ MORE</Text>
        </Animated.View>
      </View>
    );
  }
  return (
    <View style={{ width: w, height: h }} accessible accessibilityRole="text" accessibilityLabel={label}>
      <View pointerEvents="none">{keyArt(project, layout, w, h, gw)}</View>
    </View>
  );
}

/** The key's picture: the heading, the scale words and every kind with its
 *  name, through one viewBox (glass units). */
function keyArt(project: SpProject, layout: StageKeyLayout<SpObjectKind>, w: number, h: number, gw: number) {
  return (
    <Svg aria-hidden {...SVG_HIDDEN_NATIVE} width={w} height={h} viewBox={`0 0 ${gw} ${layout.height}`}>
      <Rect x={0} y={0} width={gw} height={layout.height} fill={GLASS} />
      <Line x1={0} y1={0.5} x2={gw} y2={0.5} stroke="#26262d" strokeWidth={1} />
      <SvgText x={layout.heading.x} y={layout.heading.y} fill={colors.amber} fontSize={STAGE_KEY_FS} fontFamily={fonts.oswaldSemiBold} letterSpacing={1.2}>
        KEY
      </SvgText>
      {layout.note ? (
        <SvgText x={layout.note.x} y={layout.note.y} fill={NOTE_INK} fontSize={STAGE_KEY_FS} fontFamily={fonts.oswaldSemiBold} textAnchor="end" letterSpacing={0.6}>
          {layout.note.text}
        </SvgText>
      ) : null}
      {layout.empty ? (
        <SvgText x={layout.empty.x} y={layout.empty.y} fill={NAME_INK} fontSize={STAGE_KEY_FS} fontFamily={fonts.oswaldSemiBold}>
          {layout.empty.text}
        </SvgText>
      ) : null}
      {layout.cells.map((c) => {
        // the same art as on the stage, at the scale that fits the art box
        const sym = spKeySymbol(c.kind);
        const u = stageKeyScale(sym.w, sym.h);
        return <StageObjectArt key={`a${c.kind}`} p={project} o={sample(c.kind)} cx={c.artCx} cy={c.artCy} hw={(sym.w * u) / 2} hh={(sym.h * u) / 2} rot={spKeyRot(c.kind)} u={u} />;
      })}
      {layout.cells.map((c) =>
        c.lines.map((ln, k) => (
          <SvgText key={`t${c.kind}${k}`} x={ln.x} y={ln.y} fill={NAME_INK} fontSize={STAGE_KEY_FS} fontFamily={fonts.oswaldSemiBold}>
            {ln.text}
          </SvgText>
        )),
      )}
    </Svg>
  );
}

/** The height of the END OF THE KEY line under the last row. */
const MORE_H = 18;

const keyStyles = StyleSheet.create({
  more: { height: MORE_H, paddingLeft: 6, paddingTop: 2, fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1, color: '#6e7280', backgroundColor: GLASS },
  tag: { position: 'absolute', right: 0, bottom: 0, paddingHorizontal: 6, paddingVertical: 1, backgroundColor: 'rgba(12,12,16,0.92)', borderTopLeftRadius: 4 },
  tagText: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1, color: colors.amber },
});

/** One kind's art alone, at the key's size: the picture on a palette button,
 *  so a kind is SEEN before it is placed. Hidden from a screen reader (the
 *  button it is in says the kind's name). */
export function StageKindIcon({ project, kind }: { project: SpProject; kind: SpObjectKind }) {
  const sym = spKeySymbol(kind);
  const u = stageKeyScale(sym.w, sym.h);
  const w = STAGE_KEY_ART.w + 4;
  const h = STAGE_KEY_ART.h + 6;
  return (
    <View pointerEvents="none">
      <Svg aria-hidden {...SVG_HIDDEN_NATIVE} width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <StageObjectArt p={project} o={sample(kind)} cx={w / 2} cy={h / 2} hw={(sym.w * u) / 2} hh={(sym.h * u) / 2} rot={spKeyRot(kind)} u={u} />
      </Svg>
    </View>
  );
}

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
import { Platform, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { spKeySymbol, type SpKeyEntry } from '../../../../features/stageplot/spSymbols';
import type { SpObject, SpObjectKind, SpProject } from '../../../../features/stageplot/spTypes';
import { colors, fonts } from '../../../../theme/tokens';
import { StageObjectArt } from './stageArt';
import { STAGE_KEY_FS, stageKeyScale, stageKeyWords, type StageKeyLayout } from './stageGeom';

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

/** A stand-in object of one kind, facing the audience, for the art to draw. */
const sample = (kind: SpObjectKind): SpObject => ({
  id: `key-${kind}`,
  kind,
  x: 0,
  y: 0,
  rot: 0,
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

export function StageKey({ project, entries, layout, w, gw }: { project: SpProject; entries: readonly SpKeyEntry[]; layout: StageKeyLayout<SpObjectKind>; /** The strip's width on the screen. */ w: number; /** Its width in glass units. */ gw: number }) {
  const h = (layout.height * w) / Math.max(1, gw);
  return (
    <View style={{ width: w, height: h }} accessible accessibilityRole="text" accessibilityLabel={layout.note ? `${stageKeyWords(entries)} ${scaleWords(layout.note.text)}` : stageKeyWords(entries)}>
      <View pointerEvents="none">
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
            return <StageObjectArt key={`a${c.kind}`} p={project} o={sample(c.kind)} cx={c.artCx} cy={c.artCy} hw={(sym.w * u) / 2} hh={(sym.h * u) / 2} rot={0} u={u} />;
          })}
          {layout.cells.map((c) =>
            c.lines.map((ln, k) => (
              <SvgText key={`t${c.kind}${k}`} x={ln.x} y={ln.y} fill={NAME_INK} fontSize={STAGE_KEY_FS} fontFamily={fonts.oswaldSemiBold}>
                {ln.text}
              </SvgText>
            )),
          )}
        </Svg>
      </View>
    </View>
  );
}

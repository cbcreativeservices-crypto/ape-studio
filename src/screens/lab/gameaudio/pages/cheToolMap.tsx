/**
 * cheToolMap — page 20's two read-only figures, built from React Native
 * views (no image, no new package):
 *
 *   ToolWindowsFigure   a simplified tool window with the eight KINDS of
 *                       window almost every game audio tool has, each with
 *                       its number. It is not one real product, and the page
 *                       says so once. Drawn in the house look: light from the
 *                       upper left (a lighter top-left rim, a gradient down
 *                       to the lower right), amber for the numbers, the
 *                       amplitude ramp on the mixer's meters.
 *   ToolWindowList      the same eight, as text: what you do there, and
 *                       where the lab taught the idea.
 *   ToolNameCards       for each core idea, the closest name in four tools
 *                       (data/gaToolMap). A phone is too narrow for a table
 *                       of five columns at a readable size, so each idea is
 *                       a card with four labeled lines.
 *
 * THE NUMBERS READ IN ORDER (visual review 2026-11-12): three rows, numbered
 * left to right and top to bottom, 1 2 3 / 4 5 / 6 7 8, and the list under
 * the picture runs 1 to 8. Each row is as tall as its drawings need, so no
 * panel has an empty half.
 *
 * Every word in the figure is at least 9.5 pt at any phone width (plain
 * text, shrink-to-fit with the 9 pt floor). The little rows, clips, faders
 * and graphs are drawings, not text. Nothing here is a control.
 */
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { levelColor } from '../../../../features/tools/levelColor';
import { fitValue } from '../../../../theme/legibility';
import { colors, fonts } from '../../../../theme/tokens';
import { GA_TOOLS, GA_TOOL_MAP, GA_TOOL_NONE, GA_TOOL_WINDOWS, gaToolRowSpoken, gaToolWindowMet, type GaToolWindow } from './data/gaToolMap';

const BLUE = '#6fa8ff';
const win = (id: GaToolWindow['id']): GaToolWindow => GA_TOOL_WINDOWS.find((w) => w.id === id) as GaToolWindow;

/* ── the figure ─────────────────────────────────────────────────────────── */

function Badge({ n }: { n: number }) {
  return (
    <View style={fig.badge}>
      <Text style={fig.badgeText} maxFontSizeMultiplier={1.3}>
        {n}
      </Text>
    </View>
  );
}

function Panel({ id, flex, children }: { id: GaToolWindow['id']; flex: number; children: ReactNode }) {
  const w = win(id);
  return (
    <LinearGradient colors={['#23252d', '#14151a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[fig.panel, { flex }]}>
      <View style={fig.panelHead}>
        <Badge n={w.n} />
        <Text style={fig.tag} maxFontSizeMultiplier={1.3} {...fitValue(10)}>
          {w.tag}
        </Text>
      </View>
      <View style={fig.panelBody}>{children}</View>
    </LinearGradient>
  );
}

/** A tiny waveform: the sign of a sound file. */
function Wave() {
  return (
    <View style={fig.wave}>
      {[3, 7, 10, 6, 9, 4].map((h, i) => (
        <View key={i} style={{ width: 2, height: h, borderRadius: 1, backgroundColor: BLUE }} />
      ))}
    </View>
  );
}
const Line = ({ w, tone = '#4a4d57' }: { w: number; tone?: string }) => <View style={[fig.line, { width: `${w}%`, backgroundColor: tone }]} />;

/** A small slider: a rail, the part that is filled, and a knob. */
function Slider({ at, tone = colors.amber }: { at: number; tone?: string }) {
  return (
    <View style={fig.sliderTrack}>
      <View style={fig.sliderRail} />
      <View style={[fig.sliderFill, { width: `${at}%`, backgroundColor: tone }]} />
      <View style={[fig.sliderKnob, { left: `${Math.max(0, at - 6)}%` }]} />
    </View>
  );
}

function FilesBody() {
  return (
    <View style={fig.rows}>
      <View style={fig.itemRow}>
        <View style={fig.folder} />
        <Line w={62} tone="#6a6d78" />
      </View>
      {[70, 54].map((w) => (
        <View key={w} style={[fig.itemRow, { paddingLeft: 9 }]}>
          <Wave />
          <Line w={w} />
        </View>
      ))}
    </View>
  );
}

function EventsBody() {
  return (
    <View style={fig.rows}>
      {[74, 58, 66].map((w, i) => (
        <View key={w} style={[fig.itemRow, i === 1 && fig.rowLit]}>
          <View style={fig.playMark} />
          <Line w={w} tone={i === 1 ? colors.amber : '#6a6d78'} />
        </View>
      ))}
    </View>
  );
}

function GameInfoBody() {
  return (
    <View style={fig.rows}>
      <View style={fig.itemRow}>
        <Text style={fig.small} maxFontSizeMultiplier={1.3}>
          SWITCH
        </Text>
        <View style={fig.pills}>
          <View style={fig.pill} />
          <View style={[fig.pill, fig.pillOn]} />
          <View style={fig.pill} />
        </View>
      </View>
      <View style={fig.itemRow}>
        <Text style={fig.small} maxFontSizeMultiplier={1.3}>
          STATE
        </Text>
        <View style={fig.pills}>
          <View style={[fig.pill, fig.pillOn]} />
          <View style={fig.pill} />
        </View>
      </View>
      <View style={fig.itemRow}>
        <Text style={fig.small} maxFontSizeMultiplier={1.3}>
          VALUE
        </Text>
        <Slider at={62} tone={BLUE} />
      </View>
    </View>
  );
}

function MusicBody() {
  // three layers on one bar grid: clips start and end on bar lines
  const lanes: { tone: string; from: number; len: number }[] = [
    { tone: '#c4a2ff', from: 0, len: 4 },
    { tone: '#9a7be0', from: 1, len: 3 },
    { tone: '#7a5fc4', from: 2, len: 2 },
  ];
  return (
    <View style={fig.music}>
      <View style={fig.barGrid}>
        {[0, 1, 2, 3].map((b) => (
          <View key={b} style={[fig.barLine, { left: `${b * 25}%` }, b === 2 && fig.barLineNext]} />
        ))}
      </View>
      {lanes.map((l) => (
        <View key={l.tone} style={fig.lane}>
          <View style={[fig.clip, { left: `${l.from * 25}%`, width: `${l.len * 25}%`, backgroundColor: l.tone }]}>
            <View style={fig.clipShine} />
          </View>
        </View>
      ))}
    </View>
  );
}

function PropertiesBody() {
  // the settings of ONE selected thing: three named values
  const rows: { name: number; at: number }[] = [
    { name: 100, at: 70 },
    { name: 68, at: 40 },
    { name: 86, at: 86 },
  ];
  return (
    <View style={fig.rows}>
      {rows.map((r) => (
        <View key={r.name} style={fig.itemRow}>
          <View style={fig.propName}>
            <Line w={r.name} tone="#6a6d78" />
          </View>
          <Slider at={r.at} />
        </View>
      ))}
    </View>
  );
}

function MixerBody() {
  const strips = [0.74, 0.5, 0.86, 0.38, 0.62];
  return (
    <View style={fig.mixer}>
      {strips.map((v, i) => (
        <View key={i} style={[fig.strip, i === strips.length - 1 && fig.stripMaster]}>
          <View style={fig.meter}>
            {[0, 1, 2, 3, 4, 5].map((seg) => {
              const at = (seg + 1) / 6;
              return <View key={seg} style={[fig.meterSeg, { backgroundColor: at <= v ? levelColor(at) : '#23252b' }]} />;
            })}
          </View>
          <View style={fig.faderTrack}>
            <View style={[fig.faderCap, { bottom: `${v * 72}%` }]}>
              <View style={fig.faderLine} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function AuditionBody() {
  return (
    <View style={fig.audition}>
      <View style={fig.transport}>
        <View style={fig.playBtn}>
          <View style={fig.playTri} />
        </View>
        <View style={fig.stopBtn}>
          <View style={fig.stopSq} />
        </View>
      </View>
      <View style={fig.itemRow}>
        <Slider at={45} />
      </View>
    </View>
  );
}

function ProfilerBody() {
  const graph = [3, 5, 4, 8, 11, 9, 6, 7, 4];
  const rows: { tone: string; w: number }[] = [
    { tone: colors.amber, w: 70 },
    { tone: colors.greenBright, w: 56 },
    { tone: colors.orange, w: 64 },
  ];
  return (
    <View style={fig.profiler}>
      <View style={fig.graph}>
        {graph.map((h, i) => (
          <View key={i} style={{ flex: 1, height: h * 1.6, borderTopLeftRadius: 1, borderTopRightRadius: 1, backgroundColor: i === 4 ? colors.orange : '#4f86c9' }} />
        ))}
      </View>
      {rows.map((r) => (
        <View key={r.tone} style={fig.itemRow}>
          <View style={[fig.logTag, { backgroundColor: r.tone }]} />
          <Line w={r.w} />
        </View>
      ))}
    </View>
  );
}

export function ToolWindowsFigure() {
  const label = `A simplified picture of a game audio tool, with eight kinds of window, numbered left to right and top to bottom. ${GA_TOOL_WINDOWS.map((w) => `${w.n}: ${w.name}`).join('. ')}.`;
  return (
    <View style={fig.frame} accessible accessibilityRole="image" accessibilityLabel={label}>
      <LinearGradient colors={['#2c2e37', '#1b1c22']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={fig.titleBar}>
        <View style={fig.dots}>
          <View style={[fig.dot, { backgroundColor: '#ff6b5e' }]} />
          <View style={[fig.dot, { backgroundColor: colors.amber }]} />
          <View style={[fig.dot, { backgroundColor: '#5bff85' }]} />
        </View>
        <Text style={fig.title} maxFontSizeMultiplier={1.3} {...fitValue(10)}>
          A GAME AUDIO TOOL · SIMPLIFIED
        </Text>
      </LinearGradient>
      {/* row 1: windows 1, 2, 3 */}
      <View style={[fig.row, { height: 90 }]}>
        <Panel id="files" flex={1}>
          <FilesBody />
        </Panel>
        <Panel id="events" flex={1}>
          <EventsBody />
        </Panel>
        <Panel id="gameinfo" flex={1.12}>
          <GameInfoBody />
        </Panel>
      </View>
      {/* row 2: windows 4, 5 */}
      <View style={[fig.row, { height: 88 }]}>
        <Panel id="music" flex={1.5}>
          <MusicBody />
        </Panel>
        <Panel id="properties" flex={1}>
          <PropertiesBody />
        </Panel>
      </View>
      {/* row 3: windows 6, 7, 8 */}
      <View style={[fig.row, { height: 106 }]}>
        <Panel id="mixer" flex={1.15}>
          <MixerBody />
        </Panel>
        <Panel id="audition" flex={1}>
          <AuditionBody />
        </Panel>
        <Panel id="profiler" flex={1.05}>
          <ProfilerBody />
        </Panel>
      </View>
    </View>
  );
}

/* ── the eight windows, as text ─────────────────────────────────────────── */

export function ToolWindowList() {
  return (
    <View style={list.wrap} accessibilityRole="list">
      {GA_TOOL_WINDOWS.map((w) => (
        <View key={w.id} style={list.item} accessible accessibilityLabel={`${w.n}. ${w.name}. ${w.does} ${gaToolWindowMet(w)}`}>
          <Badge n={w.n} />
          <View style={list.text}>
            <Text style={list.name}>{w.name}</Text>
            <Text style={list.does}>{w.does}</Text>
            <Text style={list.met}>{gaToolWindowMet(w)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/* ── what each idea is called ───────────────────────────────────────────── */

export function ToolNameCards() {
  return (
    <View style={cards.wrap} accessibilityRole="list">
      {GA_TOOL_MAP.map((row) => (
        <View key={row.id} style={cards.card} accessible accessibilityLabel={gaToolRowSpoken(row)}>
          <Text style={cards.idea}>{row.idea.toUpperCase()}</Text>
          <Text style={cards.meaning}>{row.meaning}</Text>
          <View style={cards.rule} />
          {GA_TOOLS.map((t) => {
            const none = row[t.id] === GA_TOOL_NONE;
            return (
              <View key={t.id} style={cards.line}>
                <Text style={cards.tool}>{t.label}</Text>
                <Text style={[cards.name, none && cards.none]}>{row[t.id]}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/* ── styles ─────────────────────────────────────────────────────────────── */

const RIM_LIGHT = '#454853';
const RIM_DARK = '#08080a';

const fig = StyleSheet.create({
  frame: { borderRadius: 10, borderWidth: 1, borderTopColor: RIM_LIGHT, borderLeftColor: RIM_LIGHT, borderRightColor: RIM_DARK, borderBottomColor: RIM_DARK, backgroundColor: '#0b0c0f', padding: 5, gap: 5 },
  titleBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 6, paddingHorizontal: 7, height: 22 },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  title: { flex: 1, color: colors.textSub, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.2 },
  row: { flexDirection: 'row', gap: 5 },
  panel: { borderRadius: 6, borderWidth: 1, borderTopColor: RIM_LIGHT, borderLeftColor: '#3a3c46', borderRightColor: RIM_DARK, borderBottomColor: RIM_DARK, padding: 5, gap: 5, overflow: 'hidden' },
  panelHead: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  panelBody: { flex: 1, justifyContent: 'center' },
  badge: { width: 17, height: 17, borderRadius: 9, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#141006', fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, lineHeight: 14 },
  tag: { flex: 1, color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 0.5 },
  small: { width: 38, color: colors.textSub, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 0.4 },
  rows: { gap: 5 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 12 },
  rowLit: { backgroundColor: 'rgba(255,198,77,0.12)', borderRadius: 3 },
  line: { height: 3, borderRadius: 2 },
  folder: { width: 10, height: 8, borderRadius: 2, borderTopLeftRadius: 0, backgroundColor: colors.amber },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 1, width: 18, height: 12 },
  playMark: { width: 0, height: 0, borderTopWidth: 4, borderBottomWidth: 4, borderLeftWidth: 7, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: colors.greenBright, marginLeft: 2 },
  pills: { flex: 1, flexDirection: 'row', gap: 3 },
  pill: { flex: 1, height: 9, borderRadius: 5, backgroundColor: '#2a2c34', borderWidth: 1, borderColor: '#3c3f49' },
  pillOn: { backgroundColor: 'rgba(255,198,77,0.85)', borderColor: colors.amber },
  sliderTrack: { flex: 1, height: 10, justifyContent: 'center' },
  sliderRail: { position: 'absolute', left: 0, right: 0, height: 3, borderRadius: 2, backgroundColor: '#2a2c34' },
  sliderFill: { position: 'absolute', left: 0, height: 3, borderRadius: 2 },
  sliderKnob: { position: 'absolute', width: 9, height: 9, borderRadius: 5, backgroundColor: '#e9e9ee', borderWidth: 1, borderColor: '#6a6d78' },
  propName: { width: 34, justifyContent: 'center' },
  music: { flex: 1, justifyContent: 'space-evenly' },
  barGrid: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  barLine: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: '#34363f' },
  barLineNext: { backgroundColor: colors.amber, width: 2 },
  lane: { height: 12, justifyContent: 'center' },
  clip: { position: 'absolute', top: 0, bottom: 0, borderRadius: 3, overflow: 'hidden' },
  clipShine: { height: 3, backgroundColor: 'rgba(255,255,255,0.28)' },
  audition: { gap: 9 },
  transport: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  playBtn: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: colors.greenBright, alignItems: 'center', justifyContent: 'center' },
  playTri: { width: 0, height: 0, borderTopWidth: 4.5, borderBottomWidth: 4.5, borderLeftWidth: 7, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: colors.greenBright, marginLeft: 2 },
  stopBtn: { width: 22, height: 22, borderRadius: 4, borderWidth: 1, borderColor: '#5a5d68', alignItems: 'center', justifyContent: 'center' },
  stopSq: { width: 7, height: 7, borderRadius: 1, backgroundColor: '#9a9da8' },
  mixer: { flex: 1, flexDirection: 'row', gap: 4, alignItems: 'stretch' },
  strip: { flex: 1, flexDirection: 'row', gap: 2, justifyContent: 'center', backgroundColor: '#101116', borderRadius: 3, padding: 2 },
  stripMaster: { borderWidth: 1, borderColor: 'rgba(255,198,77,0.55)' },
  meter: { width: 4, flexDirection: 'column-reverse', gap: 1 },
  meterSeg: { flex: 1, borderRadius: 1 },
  faderTrack: { width: 11, alignItems: 'center', backgroundColor: '#07080a', borderRadius: 2 },
  faderCap: { position: 'absolute', width: 11, height: 8, borderRadius: 2, backgroundColor: '#d9dbe2', borderBottomWidth: 2, borderBottomColor: '#7c7f8a', justifyContent: 'center' },
  faderLine: { height: 1, backgroundColor: '#2a2c34' },
  profiler: { flex: 1, gap: 4, justifyContent: 'center' },
  graph: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 20, borderBottomWidth: 1, borderBottomColor: '#3c3f49' },
  logTag: { width: 12, height: 5, borderRadius: 2 },
});

const list = StyleSheet.create({
  wrap: { gap: 10 },
  item: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  text: { flex: 1, gap: 2 },
  name: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 14.5, lineHeight: 19 },
  does: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20 },
  met: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
});

const cards = StyleSheet.create({
  wrap: { gap: 8 },
  card: { borderRadius: 10, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#0d0d10', padding: 10, gap: 4 },
  idea: { color: colors.amber, fontFamily: fonts.oswaldMedium, fontSize: 12.5, letterSpacing: 1.1 },
  meaning: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  rule: { height: 1, backgroundColor: '#24242a', marginVertical: 3 },
  line: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  tool: { width: 104, color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 0.9, lineHeight: 19 },
  name: { flex: 1, color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 19 },
  none: { color: colors.textMuted },
});

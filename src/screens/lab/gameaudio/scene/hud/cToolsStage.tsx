/**
 * cToolsStage — page 20's display: the eight KINDS of window almost every
 * game audio tool has, drawn as ONE simplified tool screen that fills the
 * glass, relabeled for a chosen tool, and ALIVE from the scene's state.
 *
 *   <GaToolsStage w h tool win state />
 *     tool   'wwise' | 'fmod' | 'unity' | 'unreal', or null for "any tool"
 *     win    0 = none lit, 1 … 8 = the lit window (the figure's own numbers)
 *
 * WHAT STAYS, WHAT CHANGES. The eight windows keep their place, number and
 * kind (1 2 3 / 4 5 / 6 7 8, as pages/cheToolMap draws them). Each window has
 * fixed places for the lab's ideas that live in it (cModel `C_WINDOW_IDEAS`).
 * With no tool chosen a place holds the lab's own word; with a tool chosen
 * it holds THAT tool's word from pages/data/gaToolMap (amber), and only
 * words that file has. Where the file has a dash the lab's word stays, with
 * a dashed ring: "no single name". Nothing is invented here.
 *
 * THE LIT WINDOW has the room: its row grows, and it prints each idea's name
 * in capitals and then the tool's whole cell. The other windows dim and keep
 * their name and one or two true elements, so stepping WINDOW walks the
 * learner round the screen.
 *
 * ALIVE (cModel `cToolsLive`, all from GaState and the scene's clock):
 *   1 SOUNDS       the files of the voices playing now
 *   2 EVENTS       the event posted last is marked; a playing one has a
 *                  green play mark; the instances are listed
 *   3 GAME INFO    the surface switch, the mood state, the speed value
 *   4 MUSIC        four bars, three layers, a play line on the model's clock
 *   5 PROPERTIES   the settings of the event posted last
 *   6 MIXER        the six buses' computed levels (the MIX strip's bars)
 *   7 AUDITION     playing or stopped, and for how long
 *   8 PROFILER     the newest log line, and the voices in use
 *
 * NO HALF LINES. A window's body is counted in whole lines; each thing in it
 * is given whole lines by importance (`allot`), and what has no line is left
 * out, never cut through. Nothing here is a control: the dock is. Every word
 * is 9 pt or more.
 */
import { memo, type ReactNode } from 'react';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useDecorativeMotion } from '../../../../../features/settings/decorativeMotion';
import { fitValue } from '../../../../../theme/legibility';
import { colors, fonts } from '../../../../../theme/tokens';
import { GA_LOG_KIND_WORD, type GaState } from '../../model/gaModel';
import { GA_TOOLS, type GaToolId, type GaToolWindow } from '../../pages/data/gaToolMap';
import { MIX_BUSES } from '../../pages/data/gaMix';
import { C_FACE, LevelBar, useRamped, useSceneClock, useSceneSeconds } from './cKit';
import { C_MUSIC_BARS, C_MUSIC_PHRASE_S, cBusMeters, cMeterFrac, cMetersSettleAt, cMusicAt, cToolsLive, cToolsSpoken, cToolsStage, type CBusMeter, type CToolWindow, type CToolWord, type CToolsLive } from './cModel';

export type GaToolsStageProps = { w: number; h: number; tool: GaToolId | null; win: number; state: GaState };

const ROWS: readonly (readonly GaToolWindow['id'][])[] = [
  ['files', 'events', 'gameinfo'],
  ['music', 'properties'],
  ['mixer', 'audition', 'profiler'],
];

/** lit = the highlighted window; mate = beside it, in the tall row;
 *  mini = in a row that made room; even = no window is lit. */
type Mode = 'lit' | 'mate' | 'mini' | 'even';

type Sz = { u: number; tag: number; word: number; small: number; line: number; pad: number };
type Body = { iw: number; ih: number; mode: Mode; sz: Sz; tool: GaToolId | null; toolSpoken: string; words: CToolWord[]; live: CToolsLive; state: GaState; moving: boolean };

const BLUE = '#6fa8ff';
const LANE = ['#c4a2ff', '#9a7be0', '#7a5fc4'] as const;

/** One line shrinks to fit (never under 9 pt); more lines wrap. */
const clip = (lines: number, fontSize: number) => (lines <= 1 ? fitValue(fontSize) : { numberOfLines: lines });
/** Lines a text needs at this width. Set a little wide, so a tool's name is
 *  given room rather than cut. */
const estLines = (text: string, px: number, fontSize: number): number => Math.max(1, Math.ceil((text.length * fontSize * (px < 100 ? 0.62 : 0.52)) / Math.max(20, px)));
/** Lines a NAME in the fixed-width face needs (an event, a file): it wraps, it is never cut.
 *  (Its Text is given a WIDTH, not flex: a long unbroken name wraps only inside a set width.) */
const monoLines = (text: string, px: number, fontSize: number): number => Math.max(1, Math.ceil((text.length * fontSize * 0.56) / Math.max(20, px)));
/** As many rows as fit a line budget, in order; a row that does not fit is left out. */
function rowsThatFit<T>(rows: readonly T[], budget: number, need: (r: T) => number): { row: T; lines: number }[] {
  const out: { row: T; lines: number }[] = [];
  let left = budget;
  for (const row of rows) {
    const lines = need(row);
    if (lines > left) continue;
    out.push({ row, lines });
    left -= lines;
  }
  return out;
}
const linesOf = (b: Body): number => Math.max(1, Math.floor((b.ih + 1) / b.sz.line));

type Want = { key: string; want: number; min?: number };
/** Whole lines for each thing, most important first: everything gets its
 *  least, then what is left is shared in the same order. 0 = left out. */
function allot(budget: number, items: Want[]): Record<string, number> {
  const out: Record<string, number> = {};
  let left = budget;
  for (const it of items) {
    const min = Math.min(it.want, it.min ?? 1);
    out[it.key] = left >= min && min > 0 ? min : 0;
    left -= out[it.key];
  }
  for (const it of items) {
    if (!out[it.key]) continue;
    const more = Math.min(it.want - out[it.key], left);
    if (more > 0) {
      out[it.key] += more;
      left -= more;
    }
  }
  return out;
}

/* ── small parts ────────────────────────────────────────────────────────── */

const text = (sz: Sz, size: number, color: string, family: string, more?: TextStyle): TextStyle => ({ fontSize: size, lineHeight: sz.line, color, fontFamily: family, ...more });

/** The mark for "this tool has no single name for the idea". */
const NoName = memo(function NoName({ sz, line }: { sz: Sz; line?: number }) {
  const d = Math.round(7 * sz.u);
  return <View style={{ width: d, height: d, borderRadius: d / 2, borderWidth: 1, borderStyle: 'dashed', borderColor: C_FACE.sub, marginTop: ((line ?? sz.line) - d) / 2 }} />;
});

const ringW = (sz: Sz) => Math.round(7 * sz.u) + 3;
const wordColor = (x: CToolWord, b: Body) => (x.none ? C_FACE.sub : b.tool ? C_FACE.amber : C_FACE.ink);
/** What the lit window prints after an idea's name. */
const litText = (x: CToolWord, b: Body) => (x.none ? `no single name in ${b.toolSpoken}` : b.tool ? x.full : x.meaning);
/** A tool's own words are set a size larger than the lab's explanation. */
const litSize = (x: CToolWord, b: Body) => (b.tool && !x.none ? b.sz.word : b.sz.small);
const litNeed = (x: CToolWord, b: Body) => estLines(`${x.tag}  ${litText(x, b)}`, b.iw - (x.none ? ringW(b.sz) : 0), litSize(x, b));
const smallNeed = (x: CToolWord, b: Body) => estLines(x.word, b.iw - (x.none ? ringW(b.sz) : 0), b.sz.word);
/** An idea asks for the lines its name needs, all or none: a name is never cut. */
function ideaWant(key: string, x: CToolWord | undefined, b: Body): Want {
  const n = x ? (b.mode === 'lit' ? litNeed(x, b) : smallNeed(x, b)) : 0;
  return { key, want: n, min: n };
}

/**
 * An idea's place. In a small window: the word alone. In the lit window: the
 * idea's name in capitals, then the tool's whole cell (with no tool chosen,
 * what the idea is). `value` is what the scene holds for it now.
 */
function Idea({ x, lines, b }: { x: CToolWord; lines: number; b: Body }) {
  if (lines < 1) return null;
  const lit = b.mode === 'lit';
  const size = lit ? litSize(x, b) : b.sz.word;
  return (
    <View style={styles.wordLine}>
      {x.none ? <NoName sz={b.sz} /> : null}
      <Text style={[text(b.sz, size, wordColor(x, b), fonts.barlowMedium), styles.grow]} allowFontScaling={false} {...clip(lines, size)}>
        {lit ? <Text style={text(b.sz, b.sz.small, C_FACE.sub, fonts.oswaldMedium, { letterSpacing: 0.4 })}>{x.tag}  </Text> : null}
        {lit ? litText(x, b) : x.word}
      </Text>
    </View>
  );
}

/** A value from the scene, beside its name. */
function Live({ k, v, b, tone = C_FACE.ink }: { k: string; v: string; b: Body; tone?: string }) {
  return (
    <View style={styles.liveRow}>
      <Text style={text(b.sz, b.sz.small, C_FACE.sub, fonts.oswaldMedium, { letterSpacing: 0.4 })} allowFontScaling={false}>
        {k}
      </Text>
      <Text style={[text(b.sz, b.sz.small, tone, fonts.mono), styles.grow]} allowFontScaling={false} {...fitValue(b.sz.small)}>
        {v}
      </Text>
    </View>
  );
}

/** A tiny waveform: the sign of a sound file. */
const Wave = memo(function Wave({ on, sz }: { on: boolean; sz: Sz }) {
  return (
    <View style={[styles.wave, { height: sz.line, width: 16 * sz.u }]}>
      {[3, 7, 10, 6, 9, 4].map((hgt, i) => (
        <View key={i} style={{ width: 1.6 * sz.u, height: hgt * sz.u * 0.9, borderRadius: 1, backgroundColor: on ? BLUE : '#3c4a66' }} />
      ))}
    </View>
  );
});

const PlayMark = memo(function PlayMark({ on, sz }: { on: boolean; sz: Sz }) {
  const s = 3.6 * sz.u;
  return <View style={{ width: 0, height: 0, borderTopWidth: s, borderBottomWidth: s, borderLeftWidth: s * 1.7, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: on ? C_FACE.ok : '#5a5d68' }} />;
});

/* ── the eight bodies ───────────────────────────────────────────────────── */

const fileTextW = (b: Body) => b.iw - 16 * b.sz.u - 4;
function FileRow({ file, on, b, lines = 1 }: { file: string; on: boolean; b: Body; lines?: number }) {
  return (
    <View style={styles.topRow}>
      <Wave on={on} sz={b.sz} />
      <Text style={[text(b.sz, b.sz.small, on ? C_FACE.ink : C_FACE.mute, fonts.mono), { width: fileTextW(b) }]} allowFontScaling={false} {...clip(lines, b.sz.small)}>
        {file}
      </Text>
    </View>
  );
}

function FilesBody(b: Body) {
  const [random, bank] = b.words;
  const lit = b.mode === 'lit';
  const n = allot(linesOf(b), [
    ideaWant('random', random, b),
    { key: 'files', want: lit ? Math.max(1, Math.min(5, b.live.files.reduce((a, f) => a + monoLines(f, fileTextW(b), b.sz.small), 0))) : 1 },
    ideaWant('bank', bank, b),
  ]);
  const files = rowsThatFit(b.live.files, n.files, (f) => monoLines(f, fileTextW(b), b.sz.small));
  const count = b.live.files.length;
  // a file's name needs the lit window's width; a small window counts them
  return (
    <View style={styles.col}>
      {random ? <Idea x={random} lines={n.random} b={b} /> : null}
      {n.files < 1 ? null : !count ? (
        <FileRow file={lit ? 'no file is playing' : 'none playing'} on={false} b={b} />
      ) : lit ? (
        files.map((f) => <FileRow key={f.row} file={f.row} on b={b} lines={f.lines} />)
      ) : (
        <FileRow file={`${count} playing`} on b={b} />
      )}
      {bank ? <Idea x={bank} lines={n.bank} b={b} /> : null}
    </View>
  );
}

const eventTextW = (b: Body) => b.iw - 7 * b.sz.u - 4;
function EventRow({ name, playing, newest, b, lines = 1 }: { name: string; playing: boolean; newest: boolean; b: Body; lines?: number }) {
  return (
    <View style={[styles.topRow, newest && styles.rowLit]}>
      <View style={{ width: 7 * b.sz.u, height: b.sz.line, alignItems: 'center', justifyContent: 'center' }}>
        <PlayMark on={playing} sz={b.sz} />
      </View>
      <Text style={[text(b.sz, b.sz.small, newest ? C_FACE.amber : playing ? C_FACE.ink : C_FACE.sub, fonts.mono), { width: eventTextW(b) }]} allowFontScaling={false} {...clip(lines, b.sz.small)}>
        {name}
      </Text>
    </View>
  );
}

function EventsBody(b: Body) {
  const [event, instance] = b.words;
  const lit = b.mode === 'lit';
  // a list with no row is not an event list: one row comes before the second idea
  const n = allot(linesOf(b), [ideaWant('event', event, b), { key: 'list', want: lit ? 4 : 2, min: 1 }, ideaWant('instance', instance, b), { key: 'now', want: lit ? 1 : 0 }]);
  // a long event name takes two lines; a row with no room is left out, never
  // cut. The event just posted is given its lines first; the rows keep their order
  const all = cToolsLive(b.state, 5).events;
  const need = (e: (typeof all)[number]) => monoLines(e.name, eventTextW(b), b.sz.small);
  const newest = all.find((e) => e.newest);
  const first = newest && need(newest) <= n.list ? [newest] : [];
  const rest = rowsThatFit(all.filter((e) => !first.includes(e)), n.list - first.reduce((a, e) => a + need(e), 0), need).map((x) => x.row);
  const list = all.filter((e) => first.includes(e) || rest.includes(e)).map((e) => ({ row: e, lines: need(e) }));
  const playing = b.live.instances;
  return (
    <View style={styles.col}>
      {event ? <Idea x={event} lines={n.event} b={b} /> : null}
      {list.map(({ row: e, lines }) => (
        <EventRow key={e.id} name={e.name} playing={e.playing > 0} newest={e.newest} b={b} lines={lines} />
      ))}
      {instance ? <Idea x={instance} lines={n.instance} b={b} /> : null}
      {n.now > 0 ? <Live k="PLAYING NOW" v={playing.length ? `${playing.length} · newest ${playing[playing.length - 1].id}` : 'none'} b={b} tone={playing.length ? C_FACE.ok : C_FACE.mute} /> : null}
    </View>
  );
}

function GameInfoBody(b: Body) {
  const lit = b.mode === 'lit';
  const values: Record<string, { v: string; tone: string }> = {
    switch: { v: b.live.surface.toUpperCase(), tone: C_FACE.ok },
    state: { v: b.live.mood.toUpperCase(), tone: b.live.mood === 'alert' ? C_FACE.steal : C_FACE.ok },
    parameter: { v: `${b.live.speedPct}%`, tone: BLUE },
  };
  const n = allot(linesOf(b), [...b.words.map((x) => ideaWant(x.id, x, b)), { key: 'now', want: 1 }]);
  // the values the scene holds: on a line of their own where the window has
  // one to spare; otherwise beside each idea where one line has room for both
  const mono = b.sz.small * 0.56;
  const fits = (x: CToolWord): boolean => {
    const v = values[x.id]?.v ?? '';
    return n[x.id] === 1 && x.word.length * b.sz.word * 0.52 + (x.none ? ringW(b.sz) : 0) + v.length * mono + 6 <= b.iw;
  };
  // all of them or none: a value beside one idea only would read as a difference
  const besideAll = n.now < 1 && b.words.filter((x) => n[x.id] > 0).every(fits);
  const beside = (_x: CToolWord): boolean => besideAll;
  return (
    <View style={styles.col}>
      {b.words.map((x) =>
        n[x.id] < 1 ? null : (
          <View key={x.id} style={styles.topRow}>
            <View style={styles.grow}>
              <Idea x={x} lines={n[x.id]} b={b} />
            </View>
            {beside(x) ? (
              <Text style={text(b.sz, b.sz.small, values[x.id]?.tone ?? C_FACE.ink, fonts.mono)} allowFontScaling={false}>
                {values[x.id]?.v}
              </Text>
            ) : null}
          </View>
        ),
      )}
      {n.now < 1 ? null : lit ? (
        <Live k="NOW" v={b.words.map((x) => values[x.id]?.v).join(' · ')} b={b} tone={C_FACE.ok} />
      ) : (
        <Text style={text(b.sz, b.sz.small, C_FACE.ok, fonts.mono)} allowFontScaling={false} {...fitValue(b.sz.small)}>
          {b.words.map((x) => values[x.id]?.v).join(' ')}
        </Text>
      )}
    </View>
  );
}

/** The play line: its place is the scene clock, wrapped to the phrase. */
const PlayLine = memo(function PlayLine({ clock, t0, on, width, height }: { clock: SharedValue<number>; t0: number; on: boolean; width: number; height: number }) {
  const phrase = C_MUSIC_PHRASE_S;
  const move = useAnimatedStyle(() => {
    if (!on) return { transform: [{ translateX: 0 }], opacity: 0.45 };
    const into = (((clock.value - t0) % phrase) + phrase) % phrase;
    return { transform: [{ translateX: (into / phrase) * width }], opacity: 1 };
  });
  return <Animated.View style={[styles.playLine, { height }, move]} />;
});

/** BAR and BEAT in words: its own small clock, so only this text redraws. */
function BeatWord({ b }: { b: Body }) {
  const on = b.live.music.on;
  const now = useSceneSeconds(on ? Infinity : null, b.state.t, 8);
  const at = cMusicAt(b.state, now);
  return (
    <Text style={text(b.sz, b.sz.small, on ? C_FACE.ink : C_FACE.mute, fonts.mono)} allowFontScaling={false} {...fitValue(b.sz.small)}>
      {on ? `BAR ${at.bar} · BEAT ${at.beat}` : 'MUSIC STOPPED'}
    </Text>
  );
}

function MusicBody(b: Body) {
  const budget = linesOf(b);
  const m = b.live.music;
  const clock = useSceneClock(m.on ? Infinity : null, b.state.t);
  const wordLines = b.mode === 'lit' ? 2 : budget >= 3 ? 1 : 0;
  const gridH = Math.max(14, b.ih - wordLines * b.sz.line - (wordLines ? 3 : 0));
  const laneH = Math.max(3, Math.floor((gridH - 4) / 3) - 2);
  const layers = ['calm', 'pulse', 'drive'] as const;
  return (
    <View style={styles.col}>
      <View style={{ width: b.iw, height: gridH, justifyContent: 'space-evenly' }}>
        {Array.from({ length: C_MUSIC_BARS + 1 }, (_, k) => (
          <View key={k} style={[styles.barLine, { left: Math.min(b.iw - 1, (k / C_MUSIC_BARS) * b.iw) }]} />
        ))}
        {layers.map((l, k) => (
          <View key={l} style={[m.layers[l] ? styles.clipOn : styles.clipOff, { height: laneH, backgroundColor: m.layers[l] ? LANE[k] : 'transparent', borderColor: LANE[k] }, !m.on && styles.clipStopped]} />
        ))}
        <PlayLine clock={clock} t0={b.state.music.t0} on={m.on} width={b.iw - 2} height={gridH} />
      </View>
      {wordLines >= 1 ? <BeatWord b={b} /> : null}
      {wordLines >= 2 ? <Live k="LAYERS ON" v={layers.filter((l) => m.layers[l]).map((l) => l.toUpperCase()).join(' · ') || 'NONE'} b={b} /> : null}
    </View>
  );
}

function PropertiesBody(b: Body) {
  const [emitter, listener] = b.words;
  const lit = b.mode === 'lit';
  const sel = b.live.selected;
  const n = allot(linesOf(b), [
    ideaWant('emitter', emitter, b),
    { key: 'selected', want: lit ? 1 : 0 },
    { key: 'priority', want: 1 },
    ideaWant('listener', listener, b),
    { key: 'bus', want: 1 },
    { key: 'distance', want: lit && sel?.min != null ? 1 : 0 },
  ]);
  const off = sel ? C_FACE.ink : C_FACE.mute;
  return (
    <View style={styles.col}>
      {n.selected > 0 ? <Live k="SELECTED" v={sel ? sel.name : 'post an event to select it'} b={b} tone={off} /> : null}
      {n.priority > 0 ? <Live k="PRIORITY" v={sel ? `${sel.priority}${sel.protected ? ' · PROTECTED' : ''}` : '—'} b={b} tone={off} /> : null}
      {n.bus > 0 ? <Live k="BUS" v={sel ? sel.bus : '—'} b={b} tone={off} /> : null}
      {n.distance > 0 && sel ? <Live k="DISTANCE" v={`${sel.min} m … ${sel.max} m`} b={b} /> : null}
      {emitter ? <Idea x={emitter} lines={n.emitter} b={b} /> : null}
      {listener ? <Idea x={listener} lines={n.listener} b={b} /> : null}
    </View>
  );
}

const MiniMeter = memo(function MiniMeter({ m, len, thick, moving }: { m: CBusMeter; len: number; thick: number; moving: boolean }) {
  const level = useRamped(cMeterFrac(m.db), moving ? 0.08 : 0);
  return <LevelBar len={len} thick={thick} level={level} vertical dim={m.silenced != null} />;
});

function Meters({ b, width, height, codes }: { b: Body; width: number; height: number; codes: boolean }) {
  // the model's ramps (the duck, a fader) are read along the scene clock
  const settleAt = cMetersSettleAt(b.state);
  const now = useSceneSeconds(settleAt, b.state.t, 30);
  const meters = cBusMeters(b.state, now);
  const colW = width / meters.length;
  const codeH = codes ? b.sz.line : 0;
  return (
    <View style={[styles.meters, { width, height }]}>
      {meters.map((m) => (
        <View key={m.bus} style={{ width: colW, alignItems: 'center' }}>
          <MiniMeter m={m} len={Math.max(8, height - codeH)} thick={Math.max(3.5, Math.min(9 * b.sz.u, colW - 1.5))} moving={b.moving} />
          {codes ? (
            <Text style={text(b.sz, b.sz.small, m.silenced ? C_FACE.mute : C_FACE.sub, fonts.oswaldMedium)} allowFontScaling={false} {...fitValue(b.sz.small)}>
              {MIX_BUSES.find((x) => x.id === m.bus)?.code ?? m.label}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function MixerBody(b: Body) {
  const budget = linesOf(b);
  const [bus, mix] = b.words;
  const lit = b.mode === 'lit';
  // a short window: the words beside the meters, so the meters keep their height
  if (budget <= 2) {
    const metersW = Math.round(32 * b.sz.u);
    const side = { ...b, iw: b.iw - metersW - 4 };
    const n = allot(budget, [ideaWant('bus', bus, side), ideaWant('mix', mix, side)]);
    return (
      <View style={styles.sideBySide}>
        <View style={{ width: side.iw }}>
          {bus ? <Idea x={bus} lines={n.bus} b={side} /> : null}
          {mix ? <Idea x={mix} lines={n.mix} b={side} /> : null}
        </View>
        <Meters b={b} width={metersW} height={b.ih} codes={false} />
      </View>
    );
  }
  // the meters come first: they are what makes this window a mixer
  const meterLines = lit ? 3 : 2;
  const n = allot(budget - meterLines, [ideaWant('bus', bus, b), ideaWant('mix', mix, b)]);
  const meterH = b.ih - (n.bus + n.mix) * b.sz.line - 3;
  return (
    <View style={styles.col}>
      {bus ? <Idea x={bus} lines={n.bus} b={b} /> : null}
      <Meters b={b} width={b.iw} height={meterH} codes={lit} />
      {mix ? <Idea x={mix} lines={n.mix} b={b} /> : null}
    </View>
  );
}

/** How long the newest instance has played: its own small clock. */
function PlayedFor({ b }: { b: Body }) {
  const newest = b.state.inst.length ? b.state.inst[b.state.inst.length - 1] : null;
  const now = useSceneSeconds(newest ? Infinity : null, b.state.t, 5);
  return (
    <Text style={text(b.sz, b.sz.small, newest ? C_FACE.ok : C_FACE.mute, fonts.mono)} allowFontScaling={false} {...fitValue(b.sz.small)}>
      {newest ? `PLAYING ${Math.max(0, now - newest.born).toFixed(1)} s` : 'STOPPED'}
    </Text>
  );
}

function AuditionBody(b: Body) {
  const budget = linesOf(b);
  const playing = b.state.inst.length > 0;
  const d = Math.min(20 * b.sz.u, Math.max(12, b.ih - (budget >= 2 ? b.sz.line : 0) - 2));
  const note = b.mode === 'lit' ? Math.max(0, Math.min(4, budget - 3)) : 0;
  return (
    <View style={styles.col}>
      <View style={[styles.liveRow, { gap: 5 * b.sz.u }]}>
        <View style={[styles.playBtn, { width: d, height: d, borderRadius: d / 2, borderColor: playing ? C_FACE.ok : '#5a5d68', backgroundColor: playing ? 'rgba(91,255,133,0.14)' : 'transparent' }]}>
          <PlayMark on={playing} sz={b.sz} />
        </View>
        <View style={[styles.stopBtn, { width: d, height: d, borderColor: playing ? '#5a5d68' : C_FACE.ink }]}>
          <View style={{ width: d * 0.34, height: d * 0.34, borderRadius: 1, backgroundColor: playing ? '#6a6d78' : C_FACE.ink }} />
        </View>
        {budget < 2 ? <PlayedFor b={b} /> : null}
      </View>
      {budget >= 2 ? <PlayedFor b={b} /> : null}
      {note >= 2 ? (
        <Text style={text(b.sz, b.sz.small, C_FACE.sub, fonts.barlowMedium)} allowFontScaling={false} numberOfLines={note}>
          No game runs here. The keys under the picture play each event by hand.
        </Text>
      ) : null}
    </View>
  );
}

const LOG_TONE: Record<string, string> = { trigger: colors.amber, start: C_FACE.ok, stop: C_FACE.sub, refused: C_FACE.refuse, failed: C_FACE.refuse, value: BLUE, state: BLUE, mix: '#c4a2ff', music: '#c4a2ff', net: C_FACE.other, note: C_FACE.sub };

function ProfilerBody(b: Body) {
  const [profiler] = b.words;
  const log = b.live.log;
  const lit = b.mode === 'lit';
  const n = allot(linesOf(b), [ideaWant('word', profiler, b), { key: 'log', want: lit ? 4 : 1 }, { key: 'voices', want: 1 }]);
  // the lit window prints the newest line; a small one says what kind it is and when
  // the time is seconds since this page opened, as the page's log counts (GA2 B-12)
  const at = (b.live.logAt ?? 0).toFixed(1);
  // 'log empty': 'the log is empty' was cut to "the log is emp…" in a small window at 320 wide (GA2 B-16)
  const line = !log ? 'log empty' : lit ? `${GA_LOG_KIND_WORD[log.kind]} · ${at} s · ${log.text}` : `${GA_LOG_KIND_WORD[log.kind]} ${at} s`;
  return (
    <View style={styles.col}>
      {profiler ? <Idea x={profiler} lines={n.word} b={b} /> : null}
      {n.log >= 1 ? (
        <View style={styles.wordLine}>
          <View style={[styles.logTag, { backgroundColor: log ? (LOG_TONE[log.kind] ?? C_FACE.sub) : '#3c3f49', marginTop: (b.sz.line - 5) / 2 }]} />
          <Text style={[text(b.sz, b.sz.small, log ? C_FACE.ink : C_FACE.mute, fonts.mono), styles.grow]} allowFontScaling={false} {...clip(n.log, b.sz.small)}>
            {line}
          </Text>
        </View>
      ) : null}
      {n.voices > 0 ? <Live k="VOICES" v={String(b.live.voices)} b={b} /> : null}
    </View>
  );
}

const BODY: Record<GaToolWindow['id'], (b: Body) => ReactNode> = {
  files: FilesBody,
  events: EventsBody,
  gameinfo: GameInfoBody,
  music: MusicBody,
  properties: PropertiesBody,
  mixer: MixerBody,
  audition: AuditionBody,
  profiler: ProfilerBody,
};

/* ── a window ───────────────────────────────────────────────────────────── */

function Panel({ win, pw, ph, mode, sz, tool, toolSpoken, live, state, moving }: { win: CToolWindow; pw: number; ph: number; mode: Mode; sz: Sz; tool: GaToolId | null; toolSpoken: string; live: CToolsLive; state: GaState; moving: boolean }) {
  const headH = Math.round(15 * sz.u);
  const iw = pw - 2 * sz.pad - 2;
  const ih = ph - 2 * sz.pad - 2 - headH - 2;
  const BodyOf = BODY[win.id];
  const d = Math.round(14 * sz.u);
  return (
    <LinearGradient
      colors={win.lit ? ['#30333f', '#1a1b22'] : ['#23252d', '#14151a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.panel, { width: pw, height: ph, padding: sz.pad }, win.lit && styles.panelLit, win.dim && styles.panelDim]}
    >
      <View style={[styles.head, { height: headH }]}>
        <View style={[styles.badge, { width: d, height: d, borderRadius: d / 2 }]}>
          <Text style={{ color: '#141006', fontFamily: fonts.oswaldSemiBold, fontSize: sz.small + 0.5, lineHeight: d }} allowFontScaling={false}>
            {win.n}
          </Text>
        </View>
        <Text style={[text(sz, sz.tag, win.lit ? C_FACE.amber : C_FACE.ink, fonts.oswaldMedium, { letterSpacing: 0.6 }), styles.grow]} allowFontScaling={false} {...fitValue(sz.tag)}>
          {win.tag}
        </Text>
      </View>
      <View style={{ width: iw, height: ih, marginTop: 2, overflow: 'hidden' }}>
        <BodyOf iw={iw} ih={ih} mode={mode} sz={sz} tool={tool} toolSpoken={toolSpoken} words={win.words} live={live} state={state} moving={moving} />
      </View>
    </LinearGradient>
  );
}

/* ── the stage ──────────────────────────────────────────────────────────── */

export function GaToolsStage({ w, h, tool, win, state }: GaToolsStageProps) {
  const moving = useDecorativeMotion();
  const stage = cToolsStage(tool, win);
  const live = cToolsLive(state);
  const toolSpoken = GA_TOOLS.find((t) => t.id === stage.tool)?.spoken ?? 'this lab';
  const anyNone = stage.windows.some((x) => x.words.some((y) => y.none));

  const u = Math.max(1, Math.min(1.6, Math.min(w / 366, h / 240)));
  const sz: Sz = { u, tag: 10 * u, word: 10 * u, small: 9 * u, line: 12.5 * u, pad: Math.round(3 * u) };
  const edge = Math.round(3 * u);
  const gap = Math.round(3 * u);
  const capH = Math.round(15 * u);
  const bodyH = h - 2 * edge - capH - gap * ROWS.length;
  const litRow = ROWS.findIndex((r) => r.some((id) => stage.windows.find((x) => x.id === id)?.lit));
  const small = Math.max(Math.round(52 * u), Math.round(bodyH * 0.24));
  const rowH = (r: number): number => (litRow < 0 ? Math.floor(bodyH / ROWS.length) : r === litRow ? bodyH - small * (ROWS.length - 1) : small);
  const rowW = w - 2 * edge;

  return (
    <View style={[styles.stage, { width: w, height: h, padding: edge, gap }]} accessible accessibilityRole="image" accessibilityLabel={cToolsSpoken(tool, win, state)}>
      <LinearGradient colors={['#2c2e37', '#1b1c22']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.caption, { height: capH, paddingHorizontal: Math.round(5 * u), gap: Math.round(6 * u) }]}>
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: '#ff6b5e' }]} />
          <View style={[styles.dot, { backgroundColor: colors.amber }]} />
          <View style={[styles.dot, { backgroundColor: '#5bff85' }]} />
        </View>
        <Text style={[text(sz, sz.small, C_FACE.sub, fonts.oswaldMedium, { letterSpacing: 0.7, lineHeight: capH }), styles.grow]} allowFontScaling={false} {...fitValue(sz.small)}>
          SIMPLIFIED · NOT ONE REAL PRODUCT
        </Text>
        {anyNone ? (
          <View style={styles.legend}>
            <NoName sz={sz} line={capH} />
            <Text style={text(sz, sz.small, C_FACE.sub, fonts.oswaldMedium, { letterSpacing: 0.5, lineHeight: capH })} allowFontScaling={false}>
              NO SINGLE NAME
            </Text>
          </View>
        ) : null}
        <Text style={text(sz, sz.small, stage.tool ? C_FACE.amber : C_FACE.ink, fonts.oswaldSemiBold, { letterSpacing: 0.8, lineHeight: capH })} allowFontScaling={false}>
          {stage.toolLabel}
        </Text>
      </LinearGradient>
      {ROWS.map((ids, r) => {
        const wins = ids.map((id) => stage.windows.find((x) => x.id === id) as CToolWindow);
        const flex = wins.map((x) => (x.lit ? (ids.length === 2 ? 1.5 : 2) : 1));
        const total = flex.reduce((a, c) => a + c, 0);
        const ph = rowH(r);
        return (
          <View key={r} style={[styles.row, { height: ph, gap }]}>
            {wins.map((x, k) => {
              const pw = Math.floor(((rowW - gap * (wins.length - 1)) * flex[k]) / total);
              const mode: Mode = litRow < 0 ? 'even' : x.lit ? 'lit' : r === litRow ? 'mate' : 'mini';
              return <Panel key={x.id} win={x} pw={pw} ph={ph} mode={mode} sz={sz} tool={stage.tool} toolSpoken={toolSpoken} live={live} state={state} moving={moving} />;
            })}
          </View>
        );
      })}
    </View>
  );
}

const RIM_LIGHT = '#454853';
const RIM_DARK = '#08080a';

const styles = StyleSheet.create({
  stage: { backgroundColor: '#0b0c0f' },
  caption: { flexDirection: 'row', alignItems: 'center', borderRadius: 4 },
  dots: { flexDirection: 'row', gap: 3 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  legend: { flexDirection: 'row', alignItems: 'flex-start', gap: 3 },
  row: { flexDirection: 'row' },
  panel: { borderRadius: 5, borderWidth: 1, borderTopColor: RIM_LIGHT, borderLeftColor: '#3a3c46', borderRightColor: RIM_DARK, borderBottomColor: RIM_DARK, overflow: 'hidden' },
  panelLit: { borderTopColor: colors.amber, borderLeftColor: colors.amber, borderRightColor: '#a87f22', borderBottomColor: '#a87f22' },
  panelDim: { opacity: 0.7 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badge: { backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  col: { flex: 1 },
  grow: { flex: 1 },
  sideBySide: { flex: 1, flexDirection: 'row', gap: 4 },
  wordLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 3 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  rowLit: { backgroundColor: 'rgba(255,198,77,0.14)', borderRadius: 2 },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  barLine: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: '#3a3d47' },
  clipOn: { borderRadius: 2, borderWidth: 1 },
  clipOff: { borderRadius: 2, borderWidth: 1, borderStyle: 'dashed', opacity: 0.7 },
  clipStopped: { opacity: 0.45 },
  playLine: { position: 'absolute', left: 0, top: 0, width: 2, backgroundColor: '#f4f6f8', borderRadius: 1 },
  meters: { flexDirection: 'row', alignItems: 'flex-start' },
  playBtn: { borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  stopBtn: { borderRadius: 3, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  logTag: { width: 9, height: 5, borderRadius: 2 },
});

/**
 * Start Here — the pages. Words live in features/startHere/startHereContent
 * (reviewable in one place, unit-tested); this file only draws them.
 *
 * REUSE, NOT REINVENTION (owner brief: "It does not have to reinvent a lab
 * when we already have it, it can just use the screen needed and make it fit
 * for this purpose"). The displays are the existing lab instruments:
 *   • Foundations of Sound — ThreeWindowView (speaker · air · pressure),
 *     AirParticlesView + PressureGraphView, SpeakerConeView, SignalPathView,
 *     LevelMeterBar and its CheckQuestion; the course's own tone voice
 *     (useCourseTone: audio gate, speaker guard, stop on close / mute).
 *   • Visual Audio Analysis (Meter Lab) — WaveformView and PeakMeterView over
 *     its synthesized teaching signals (speech, sine, guitar).
 *   • Sound Systems — the illustrated gear (SignalPathArt) and flipFader.
 * Every page with a live display sits on the Rack Unit (house rule D24):
 * display pinned above, the well scrolls between, controls docked below.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path as SvgPath } from 'react-native-svg';
import { colors, fonts } from '../../theme/tokens';
import { RackUnit } from '../lab/rack/RackUnit';
import type { BezelItem, DockParam, StageSize } from '../lab/rack/rackTypes';
import { StageFit } from '../lab/rack/StageFit';
import { StageTextScale, useStageTextScale } from '../lab/rack/stageAspect';
import { CollapsibleSection } from '../lab/LabShell';
import { flipFader } from '../lab/soundsystems/rackLayout';
import { GearGlyph } from '../lab/soundsystems/art/gearArt';
import { CheckQuestion, LevelMeterBar, VizUnavailableCard } from '../lab/foundations/bits';
import type { VizModule } from '../lab/foundations/skiaGate';
import type { VizMetersModule } from '../lab/meter/skiaGate';
import { visHzFor, type ToneApi } from '../lab/foundations/FoundationsCourseScreen';
import { db, peakOf, renderSignal, type SignalKey } from '../lab/meter/meterEngine';
import { EngineGate } from '../tools/EngineGate';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { levelColor } from '../../features/tools/levelColor';
import { playWithHearingWarning } from '../../features/audio/levelHearingWarning';
import { START_LEVEL_01 } from '../../features/audio/startLevel';
import type { PageCtx } from '../lab/kit/PagedLab';
import {
  DISTINCTION,
  FIRST_SOURCES,
  MATCH_PROMPTS,
  ORDER_PATH,
  RECAP_CHECKS,
  REFLECT_PROMPTS,
  SECTIONS,
  SORT_MEASURED_OR_HEARD,
  SORT_SOUND_OR_AUDIO,
  STATIONS,
  UNPLUG_OPTIONS,
  stationById,
  targetName,
  termById,
  type FirstSource,
  type MatchTarget,
  type PageId,
  type StartPage,
  type StationId,
  type Unplug,
} from '../../features/startHere/startHereContent';
import { PATH_ASPECT, SignalPathArt, stationLive, type PathMark } from './SignalPathArt';
import { Card, Lead, OrderExerciseView, Para, RevealList, SortExerciseView, TermChips } from './bits';

// ─────────────────────────────────────────────────────────────────────────────
// The screen-owned environment every page reads

export type FirstSignal = {
  source: FirstSource;
  setSource: (s: FirstSource) => void;
  freq: number;
  setFreq: (f: number) => void;
  /** The mixer's level, dB (−24 … 0). */
  gainDb: number;
  setGainDb: (d: number) => void;
  unplug: Unplug;
  setUnplug: (u: Unplug) => void;
};

export type StartEnv = {
  tone: ToneApi;
  gate: EngineState;
  viz: VizModule | null;
  meters: VizMetersModule | null;
  focused: boolean;
  /** Signed-out guest: nothing is saved (house guest rule) — said up front. */
  guest: boolean;
  first: FirstSignal;
  openRoute: (route: string, params?: Record<string, unknown>) => void;
  openTerms: () => void;
  openSafety: () => void;
  goToPage: (id: PageId) => void;
};

export const StartEnvCtx = createContext<StartEnv | null>(null);

function useEnv(): StartEnv {
  const env = useContext(StartEnvCtx);
  if (!env) throw new Error('Start Here page rendered outside its screen');
  return env;
}

function pageDef(id: PageId): StartPage {
  for (const s of SECTIONS) for (const p of s.pages) if (p.id === id) return p;
  throw new Error(`unknown Start Here page ${id}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared rack plumbing

const BADGE_MODEL = 'A MODEL — SLOWED DOWN SO YOU CAN SEE IT';
const BADGE_DIAGRAM = 'ILLUSTRATION — ONE SIMPLE SYSTEM; REAL ONES VARY';
const BADGE_EXAMPLE = 'EXAMPLE SIGNAL BUILT INTO THE APP · NOT A LIVE MEASUREMENT';

/** The TONE bezel cell — the voice's state, printed on every audio page. */
function toneCell(tone: ToneApi): BezelItem {
  return { k: 'TONE', v: tone.playing ? 'LIVE' : '—', tint: tone.playing ? undefined : '#7a7f8a' };
}

/** PLAY — the Foundations course's transport idiom. Pages whose fader moves
 *  OUTPUT LEVEL warn about hearing on every press (owner 2026-09-13). */
function playKey(tone: ToneApi, onPlay: () => void, drivesLevel = false): DockParam {
  return {
    kind: 'toggle',
    id: 'play',
    label: 'PLAY',
    value: tone.playing,
    onToggle: () => {
      if (tone.playing) {
        tone.stop();
        return;
      }
      if (drivesLevel) playWithHearingWarning(onPlay);
      else onPlay();
    },
  };
}

function StageFallback({ w }: { w: number }) {
  return (
    <View style={{ width: w, flex: 1, justifyContent: 'center', padding: 10 }}>
      <VizUnavailableCard />
    </View>
  );
}

/** Scale-to-fit for the fixed-height Foundations composites (the course's own
 *  FitStage idiom): vector scale k, and StageTextScale so overlay labels stay
 *  ≥ 9 pt on the glass and grow in FULL SCREEN. */
const FIT_REF_W = 320;
const THREE_WINDOW_NATURAL = 240;
function FitStage({ w, h, natural, children }: { w: number; h: number; natural: number; children: (vw: number, k: number) => ReactNode }) {
  const pad = 8;
  const k = Math.max(0.05, Math.min((h - pad) / natural, (w - pad) / FIT_REF_W));
  const vw = Math.max(1, w - pad);
  return (
    <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <StageTextScale.Provider value={Math.max(1, k)}>
        <View style={{ width: vw }}>{children(vw, k)}</View>
      </StageTextScale.Provider>
    </View>
  );
}

/** A Start Here page on the Rack Unit. The well: what is live right now
 *  (outside the notes), the "what you are looking at" line, the first move,
 *  then LESSON NOTES — prose, words, the check. */
function StartRack({
  page,
  stage,
  size = 'L',
  badge,
  bezel,
  params,
  initialParam,
  wellTop,
  extra,
  hideDragTag,
  fullScreen = true,
}: {
  page: StartPage;
  stage: (w: number, h: number) => ReactNode;
  size?: StageSize;
  badge: string;
  bezel?: BezelItem[];
  params: DockParam[];
  initialParam: string;
  wellTop?: ReactNode;
  extra?: ReactNode;
  hideDragTag?: boolean;
  fullScreen?: boolean;
}) {
  const env = useEnv();
  return (
    <RackUnit
      stage={{ render: stage, size, badge, bezel, hideDragTag, fullScreen }}
      params={params}
      initialParam={initialParam}
      bottomInset={0}
    >
      <View style={styles.well}>
        {env.gate !== 'idle' && params.some((p) => p.id === 'play' || p.id === 'src') ? <EngineGate state={env.gate} /> : null}
        {/* House order: picture → what you are looking at → the first move →
            what is live right now → the notes (cognitive review 2026-09-29). */}
        <Lead>{page.lead}</Lead>
        {page.caption ? <Text style={styles.caption}>{page.caption}</Text> : null}
        {wellTop ? <View style={{ gap: 10 }}>{wellTop}</View> : null}
        <CollapsibleSection title="LESSON NOTES">
          <View style={styles.notes}>
            {page.paras.map((p, i) => (
              <Para key={i}>{p}</Para>
            ))}
            {extra}
            {page.terms ? <TermChips ids={page.terms} /> : null}
            {page.check ? <CheckQuestion spec={page.check} /> : null}
          </View>
        </CollapsibleSection>
      </View>
    </RackUnit>
  );
}

/** A reading page (no live display): the host scrolls it. */
function DocPage({ page, children, after }: { page: StartPage; children?: ReactNode; after?: ReactNode }) {
  return (
    <View style={styles.doc}>
      <Lead>{page.lead}</Lead>
      {page.paras.map((p, i) => (
        <Para key={i}>{p}</Para>
      ))}
      {children}
      {page.terms ? <TermChips ids={page.terms} /> : null}
      {page.check ? <CheckQuestion spec={page.check} /> : null}
      {after}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Frequency helpers (log lane 100 … 1000 Hz)

const F_MIN = 100;
const F_MAX = 1000;
const freqAt = (p: number) => {
  const f = F_MIN * Math.pow(F_MAX / F_MIN, Math.max(0, Math.min(1, p)));
  return f < 200 ? Math.round(f / 5) * 5 : Math.round(f / 10) * 10;
};
const freqPos = (f: number) => Math.log(f / F_MIN) / Math.log(F_MAX / F_MIN);
/** A RELATIVE pitch word — lower or higher on THIS slider, as heard. (All of
 *  100–1000 Hz is low-to-mid in audio terms, so absolute words would teach a
 *  wrong band habit — audio-expert review 2026-09-29.) */
const pitchWord = (f: number) => (f < 180 ? 'LOWER' : f < 450 ? 'MIDDLE' : 'HIGHER');
/** Model wavelength on the glass: higher frequency packs the squeezes closer
 *  (scaled — the real ratio would not fit a phone). */
const lambdaFor = (w: number, f: number) => w / (1.2 + Math.log2(f / 110));

// ─────────────────────────────────────────────────────────────────────────────
// WELCOME

function WelcomePage({ ctx: _ctx }: { ctx: PageCtx }) {
  const env = useEnv();
  const page = pageDef('welcome');
  return (
    <DocPage page={page}>
      {env.guest ? (
        <Text style={styles.guestNote}>
          You’re not signed in, so the app won’t remember your place if you leave. Sign in any time to keep it.
        </Text>
      ) : null}
      <Card tint="rgba(255,198,77,.35)">
        <Text style={styles.cardEyebrow}>THE JOURNEY</Text>
        {SECTIONS.filter((s) => s.kind !== 'welcome').map((s) => (
          <Pressable
            key={s.id}
            onPress={() => env.goToPage(s.pages[0].id)}
            style={styles.mapRow}
            accessibilityRole="button"
            accessibilityLabel={`${s.kind === 'lab' ? 'The lab' : `Lesson ${s.num}`}: ${s.title}. ${s.blurb} Opens it.`}
          >
            <Text style={[styles.mapNum, s.kind === 'lab' && { color: colors.green }]}>{s.kind === 'lab' ? 'LAB' : String(s.num)}</Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.mapTitle}>{s.title}</Text>
              <Text style={styles.mapBlurb}>{s.blurb}</Text>
            </View>
            <Text style={styles.mapGo}>›</Text>
          </Pressable>
        ))}
      </Card>
      <Card tint="rgba(127,212,255,.35)">
        <Text style={[styles.cardEyebrow, { color: colors.cyanBright }]}>WORDS YOU’LL MEET</Text>
        <Text style={styles.cardBody}>Tap any word as you go to see what it means. Practise them any time with flip cards and a quick quiz.</Text>
        <Pressable onPress={env.openTerms} style={styles.linkBtn} accessibilityRole="button" accessibilityLabel="Open the starter words">
          <Text style={styles.linkText}>OPEN THE STARTER WORDS ›</Text>
        </Pressable>
      </Card>
    </DocPage>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LESSON 1

function L1Vibrate({ ctx: _ctx }: { ctx: PageCtx }) {
  const env = useEnv();
  const { tone, viz, focused } = env;
  const page = pageDef('l1-vibrate');
  const [vib, setVib] = useState(true);
  const F = 220;
  const params: DockParam[] = [
    {
      kind: 'toggle',
      id: 'vib',
      label: 'VIBRATION',
      value: vib,
      onToggle: () => {
        // No vibration, no sound: switching it off silences the tone too —
        // including a PLAY still starting (`playing` flips only once the
        // engine is up; stop() cancels that start). Bug pass 2026-09-30.
        if (vib) tone.stop();
        setVib(!vib);
      },
    },
    ...(tone.engineReady
      ? [
          playKey(tone, () => {
            setVib(true); // a sound needs a vibration
            tone.play(F, -24);
          }),
        ]
      : []),
  ];
  return (
    <StartRack
      page={page}
      initialParam="vib"
      params={params}
      badge={BADGE_MODEL}
      bezel={[
        { k: 'CONE', v: vib ? 'VIBRATING' : 'STILL', tint: vib ? undefined : '#7a7f8a', flex: 1.3 },
        { k: 'AIR', v: vib ? 'WAVE' : 'STILL', tint: vib ? undefined : '#7a7f8a' },
        toneCell(tone),
      ]}
      stage={(w, h) =>
        viz ? (
          <FitStage w={w} h={h} natural={THREE_WINDOW_NATURAL}>
            {(vw, k) => <viz.ThreeWindowView width={vw} scale={k} visHz={visHzFor(F)} amp={vib ? 0.75 : 0.001} showZones={vib} running={focused} showEar />}
          </FitStage>
        ) : (
          <StageFallback w={w} />
        )
      }
    />
  );
}

/** Source → medium → listener, drawn with the Sound Systems line-art heads
 *  and the air arcs (the reading page still opens with a picture). */
function ThreePartsStrip() {
  const col = (label: string, color: string, node: ReactNode) => (
    <View style={styles.stripCol}>
      {node}
      <Text style={[styles.stripLabel, { color }]}>{label}</Text>
    </View>
  );
  const arcs = (
    <Svg width={64} height={48} viewBox="0 0 64 48">
      {[0, 1, 2, 3].map((k) => (
        <SvgPath key={k} d={`M ${10 + k * 12} ${12 - k * 2} Q ${18 + k * 12} 24 ${10 + k * 12} ${36 + k * 2}`} stroke="#ffc64d" strokeWidth={2} fill="none" strokeLinecap="round" opacity={1 - k * 0.18} />
      ))}
    </Svg>
  );
  return (
    <View style={styles.strip} accessibilityRole="image" accessibilityLabel="A person making a sound, the air carrying it, and a listener">
      {col('SOURCE', colors.amber, <GearGlyph kind="listener" size={56} legends={false} />)}
      {col('MEDIUM · AIR', colors.amber, arcs)}
      {col('LISTENER', '#9fd0ff', <GearGlyph kind="listener" size={56} legends={false} />)}
    </View>
  );
}

function L1Words({ ctx: _ctx }: { ctx: PageCtx }) {
  return (
    <View style={styles.doc}>
      <ThreePartsStrip />
      <DocPage page={pageDef('l1-words')} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LESSON 2 — follow a voice

const FOLLOW_ORDER: StationId[] = ['voice', 'mic', 'cableA', 'mixer', 'cableB', 'speaker', 'listener'];

function StationCard({ id, text, title }: { id: StationId; text: string; title?: string }) {
  const s = stationById(id);
  const n = FOLLOW_ORDER.indexOf(id) + 1;
  return (
    <View style={[styles.liveCard, { borderColor: s.form === 'sound' ? 'rgba(255,198,77,.5)' : 'rgba(111,168,255,.55)' }]}>
      <Text style={[styles.liveEyebrow, { color: s.form === 'sound' ? colors.amber : '#8fbaff' }]}>
        {title ?? `STOP ${n} OF 7`} · {s.form === 'sound' ? 'SOUND IN THE AIR' : 'AUDIO SIGNAL (ELECTRICAL)'}
      </Text>
      <Text style={styles.liveTitle}>{s.name}</Text>
      <Text style={styles.liveBody}>{text}</Text>
    </View>
  );
}

function L2Path({ ctx: _ctx }: { ctx: PageCtx }) {
  const page = pageDef('l2-path');
  const [at, setAt] = useState<StationId>('voice');
  const s = stationById(at);
  const params: DockParam[] = [
    flipFader({
      id: 'follow',
      label: 'FOLLOW',
      title: 'FOLLOW THE VOICE',
      items: STATIONS,
      selectedId: at,
      onSelect: (id) => setAt(id as StationId),
      name: (x) => x.name,
      short: (x) => x.short,
    }),
  ];
  return (
    <StartRack
      page={page}
      initialParam="follow"
      size="M"
      params={params}
      badge={BADGE_DIAGRAM}
      hideDragTag
      bezel={[
        { k: 'STOP', v: `${FOLLOW_ORDER.indexOf(at) + 1} / 7` },
        { k: 'FORM', v: s.form === 'sound' ? 'SOUND' : 'AUDIO SIGNAL', tint: s.form === 'sound' ? colors.amber : '#8fbaff', flex: 1.6 },
      ]}
      stage={(w, h) => (
        <StageFit w={w} h={h} aspect={PATH_ASPECT}>
          <SignalPathArt highlight={at} reached={at} activeForm={at === 'voice' ? 'soundIn' : s.form === 'signal' ? 'signal' : 'soundOut'} />
        </StageFit>
      )}
      wellTop={<StationCard id={at} text={s.follow} />}
    />
  );
}

function L2Sort({ ctx }: { ctx: PageCtx }) {
  return (
    <DocPage page={pageDef('l2-sort')}>
      <SortExerciseView ex={SORT_SOUND_OR_AUDIO} onAllDone={ctx.markDone} />
    </DocPage>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LESSON 3

function FreqStage({ viz, w, h, f, focused }: { viz: VizModule; w: number; h: number; f: number; focused: boolean }) {
  const clock = viz.useVizClock(focused);
  const ts = useStageTextScale();
  const visHz = visHzFor(f);
  const avail = Math.max(60, h - 36 * ts);
  const airH = Math.round(avail * 0.56);
  const graphH = avail - airH;
  const lambda = lambdaFor(w, f);
  return (
    <View style={{ width: w, height: h, justifyContent: 'center', gap: 4 }}>
      <Text style={[styles.winLabel, { fontSize: 10 * ts }]}>AIR — squeezes closer together as frequency rises</Text>
      <viz.AirParticlesView clock={clock} width={w} height={airH} visHz={visHz} amp={0.7} lambdaPx={lambda} showEar />
      <Text style={[styles.winLabel, { fontSize: 10 * ts }]}>PRESSURE — more cycles in the same space</Text>
      <viz.PressureGraphView clock={clock} width={w} height={graphH} visHz={visHz} amp={0.7} lambdaPx={lambda} />
    </View>
  );
}

function L3Freq({ ctx: _ctx }: { ctx: PageCtx }) {
  const { tone, viz, focused } = useEnv();
  const page = pageDef('l3-freq');
  const [f, setF] = useState(220);
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'freq',
      label: 'FREQUENCY',
      value: freqPos(f),
      onChange: (v) => {
        const nf = freqAt(v);
        setF(nf);
        tone.set({ freqHz: nf });
      },
      format: (v) => `${freqAt(v)} Hz · ${pitchWord(freqAt(v)).toLowerCase()} pitch`,
      formatShort: (v) => `${freqAt(v)} Hz`,
      home: freqPos(220),
    },
    ...(tone.engineReady ? [playKey(tone, () => tone.play(f, -24))] : []),
  ];
  return (
    <StartRack
      page={page}
      initialParam="freq"
      params={params}
      badge={BADGE_MODEL}
      bezel={[
        { k: 'FREQUENCY', v: `${f} Hz`, flex: 1.3 },
        { k: 'PITCH (HEARD)', v: pitchWord(f), flex: 1.2 },
        toneCell(tone),
      ]}
      stage={(w, h) => (viz ? <FreqStage viz={viz} w={w} h={h} f={f} focused={focused} /> : <StageFallback w={w} />)}
    />
  );
}

function L3Amp({ ctx: _ctx }: { ctx: PageCtx }) {
  const { tone, viz, focused } = useEnv();
  const page = pageDef('l3-amp');
  const [amt, setAmt] = useState(START_LEVEL_01);
  const F = 220;
  const levelFor = (a: number) => -44 + a * 24; // −44 … −20 dBFS, the course's M4 range
  const word = amt < 0.33 ? 'SMALL' : amt < 0.66 ? 'MEDIUM' : 'LARGE';
  const heard = amt < 0.33 ? 'quiet' : amt < 0.66 ? 'medium' : 'loud';
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'amt',
      label: 'AMPLITUDE',
      level: true,
      value: amt,
      onChange: (v) => {
        setAmt(v);
        tone.set({ levelDb: levelFor(v) });
      },
      format: (v) => (v < 0.33 ? 'small → sounds quiet' : v < 0.66 ? 'medium' : 'large → sounds loud'),
      formatShort: (v) => `${Math.round(v * 100)}%`,
      tint: levelColor(amt),
    },
    ...(tone.engineReady ? [playKey(tone, () => tone.play(F, levelFor(amt)), true)] : []),
  ];
  return (
    <StartRack
      page={page}
      initialParam="amt"
      params={params}
      badge={BADGE_MODEL}
      bezel={[
        { k: 'AMPLITUDE', v: word, tint: levelColor(amt), flex: 1.3 },
        { k: 'SOUNDS', v: heard.toUpperCase() },
        { k: 'FREQ', v: `${F} Hz` },
        toneCell(tone),
      ]}
      stage={(w, h) =>
        viz ? (
          <FitStage w={w} h={h} natural={THREE_WINDOW_NATURAL}>
            {(vw, k) => <viz.ThreeWindowView width={vw} scale={k} visHz={visHzFor(F)} amp={0.25 + amt * 0.75} running={focused} showEar={false} />}
          </FitStage>
        ) : (
          <StageFallback w={w} />
        )
      }
      extra={<LevelMeterBar levelDb={levelFor(amt)} minDb={-48} maxDb={-18} />}
    />
  );
}

function L3Measured({ ctx }: { ctx: PageCtx }) {
  return (
    <DocPage page={pageDef('l3-measured')}>
      <Card tint="rgba(255,198,77,.35)">
        <Text style={styles.cardEyebrow}>{DISTINCTION.title.toUpperCase()}</Text>
        <View style={styles.tableHead}>
          <Text style={[styles.tableHeadText, { color: '#8fbaff' }]}>MEASURED</Text>
          <Text style={[styles.tableHeadText, { color: colors.amber }]}>HEARD</Text>
        </View>
        {DISTINCTION.rows.map((r) => (
          <View key={r.measured} style={styles.tableRow}>
            <View style={styles.tableCell}>
              <Text style={styles.tableWord}>{r.measured}</Text>
              <Text style={styles.tableHow}>{r.measuredHow}</Text>
            </View>
            <Text style={styles.tableArrow}>↔</Text>
            <View style={styles.tableCell}>
              <Text style={styles.tableWord}>{r.heard}</Text>
              <Text style={styles.tableHow}>{r.heardHow}</Text>
            </View>
          </View>
        ))}
        <Text style={styles.cardBody}>{DISTINCTION.closer}</Text>
      </Card>
      <SortExerciseView ex={SORT_MEASURED_OR_HEARD} onAllDone={ctx.markDone} />
    </DocPage>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LESSON 4 — tap each part

function L4Parts({ ctx: _ctx }: { ctx: PageCtx }) {
  const page = pageDef('l4-parts');
  const [sel, setSel] = useState<StationId>('mic');
  const [io, setIo] = useState(false);
  const s = stationById(sel);
  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'part',
      label: 'PART',
      valueLabel: s.short,
      options: STATIONS.map((x) => ({ id: x.id, label: x.name.split(' — ')[0].toUpperCase() })),
      selectedId: sel,
      onSelect: (id) => setSel(id as StationId),
      sticky: true,
    },
    { kind: 'toggle', id: 'io', label: 'IN / OUT', value: io, onToggle: () => setIo(!io) },
  ];
  return (
    <StartRack
      page={page}
      initialParam="part"
      size="M"
      params={params}
      badge={BADGE_DIAGRAM}
      bezel={[
        { k: 'PART', v: s.short, flex: 1.2 },
        { k: 'CARRIES', v: s.form === 'sound' ? 'SOUND' : 'SIGNAL', tint: s.form === 'sound' ? colors.amber : '#8fbaff' },
        { k: 'IN / OUT', v: io ? 'SHOWN' : 'HIDDEN', tint: io ? undefined : '#7a7f8a' },
      ]}
      stage={(w, h) => (
        <StageFit w={w} h={h} aspect={PATH_ASPECT}>
          <SignalPathArt
            highlight={sel}
            showIO={io}
            onTap={(t) => {
              // A jack tap (IN / OUT mode) selects its device.
              const id = (t.includes('.') ? t.split('.')[0] : t) as StationId;
              setSel(id);
            }}
            tapLabel={(t) => `${targetName(t)}. Show its job`}
          />
        </StageFit>
      )}
      wellTop={
        <View style={[styles.liveCard, { borderColor: 'rgba(255,198,77,.45)' }]}>
          <Text style={[styles.liveEyebrow, { color: colors.amber }]}>WHAT IT DOES</Text>
          <Text style={styles.liveTitle}>{s.name}</Text>
          <Text style={styles.liveBody}>{s.job}</Text>
          {s.io ? <Text style={[styles.liveBody, { color: '#cfe0ff' }]}>{s.io}</Text> : null}
        </View>
      }
    />
  );
}

function L4Order({ ctx }: { ctx: PageCtx }) {
  return (
    <DocPage page={pageDef('l4-order')}>
      <OrderExerciseView prompt={ORDER_PATH.prompt} steps={ORDER_PATH.steps} onDone={ctx.markDone} />
    </DocPage>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LESSON 5 — the Meter Lab's own displays

const SIGNALS: { id: SignalKey; label: string; blurb: string }[] = [
  { id: 'speech', label: 'SPEECH', blurb: 'A voice: bursts on each syllable, with small gaps between words.' },
  { id: 'sine', label: 'STEADY TONE', blurb: 'One clear pitch at one steady level — an even band.' },
  { id: 'guitar', label: 'GUITAR', blurb: 'Plucked notes: a sharp start, then a long fading tail.' },
];
const gainLin = (d: number) => Math.pow(10, d / 20);
const clamp01 = (p: number) => Math.max(0, Math.min(1, p));
/** "−12 dBFS" — the reference is printed every time (the lesson's own rule). */
const fmtDbfs = (d: number) => `${d === 0 ? '0' : `−${Math.abs(d)}`} dBFS`;

/**
 * THE NUMBERS ARE THE LEVEL (audio-expert review 2026-09-29). Every dBFS
 * printed here is the example signal's real PEAK: the Meter Lab signal is
 * scaled so its peak lands exactly on the chosen level, whatever its raw
 * peak. Lesson 5's lane IS that peak (−36 … 0 dBFS); the lab's MIXER FADER is
 * a real fader — 0 dB = unity, not the loudest — applied to a source arriving
 * at −18 dBFS, so the default reads the "−18" habit the text teaches and the
 * test tone you hear plays at exactly the level the meter shows.
 */
const PK_MIN = -36;
const PK_MAX = 0;
const pkAt = (p: number) => Math.round(PK_MIN + clamp01(p) * (PK_MAX - PK_MIN));
const pkPos = (d: number) => (d - PK_MIN) / (PK_MAX - PK_MIN);

const FADER_MIN = -24;
const FADER_MAX = 0;
const SOURCE_DBFS = -18;
const faderAt = (p: number) => Math.round(FADER_MIN + clamp01(p) * (FADER_MAX - FADER_MIN));
const faderPos = (d: number) => (d - FADER_MIN) / (FADER_MAX - FADER_MIN);
const fmtFader = (d: number) => (d === 0 ? '0 dB · UNITY' : `−${Math.abs(d)} dB`);
/** The level leaving the mixer (and played, for the test tone), dBFS. */
const mixOutDb = (faderDb: number) => SOURCE_DBFS + faderDb;

/** Linear gain that puts this signal's peak at `peakDb` dBFS. */
function usePeakGain(signal: SignalKey, peakDb: number): number {
  const raw = useMemo(() => renderSignal(signal), [signal]);
  const rawPk = useMemo(() => Math.max(1e-6, peakOf(raw)), [raw]);
  return gainLin(peakDb) / rawPk;
}

function WaveHost({ meters, w, h, signal, gain, focused }: { meters: VizMetersModule; w: number; h: number; signal: SignalKey; gain: number; focused: boolean }) {
  const phase = meters.usePhaseClock(focused, 0.5);
  return <meters.WaveformView width={w} height={h} signal={signal} gain={gain} phase={phase} plain />;
}
function PeakHost({ meters, w, h, signal, gain, focused }: { meters: VizMetersModule; w: number; h: number; signal: SignalKey; gain: number; focused: boolean }) {
  const phase = meters.usePhaseClock(focused, 0.9);
  return <meters.PeakMeterView width={w} height={h} signal={signal} gain={gain} phase={phase} plain />;
}

function signalParam(signal: SignalKey, set: (s: SignalKey) => void): DockParam {
  const cur = SIGNALS.find((s) => s.id === signal) ?? SIGNALS[0];
  return {
    kind: 'options',
    id: 'signal',
    label: 'SIGNAL',
    valueLabel: cur.label,
    options: SIGNALS.map((s) => ({ id: s.id, label: s.label, blurb: s.blurb })),
    selectedId: signal,
    onSelect: (id) => set(id as SignalKey),
    sticky: true,
  };
}

function peakParam(peakDb: number, set: (d: number) => void): DockParam {
  return {
    kind: 'fader',
    id: 'level',
    label: 'PEAK LEVEL',
    level: true,
    value: pkPos(peakDb),
    onChange: (v) => set(pkAt(v)),
    format: (v) => fmtDbfs(pkAt(v)),
    home: pkPos(-18),
    tint: levelColor(pkPos(peakDb)),
  };
}

function faderParam(faderDb: number, set: (d: number) => void): DockParam {
  return {
    kind: 'fader',
    id: 'level',
    label: 'MIXER FADER',
    level: true,
    value: faderPos(faderDb),
    onChange: (v) => set(faderAt(v)),
    format: (v) => `${fmtFader(faderAt(v))} → ${fmtDbfs(mixOutDb(faderAt(v)))}`,
    formatShort: (v) => (faderAt(v) === 0 ? '0 dB' : `−${Math.abs(faderAt(v))} dB`),
    home: faderPos(0), // unity
    // Coloured by the level it PRODUCES — unity is a normal level, not a hot one.
    tint: levelColor(pkPos(mixOutDb(faderDb))),
  };
}

/** Lesson 5's first page comes BEFORE the decibel is taught, so its lane
 *  speaks in plain size — a share of the top of the scale — not dB
 *  (cognitive review 2026-09-29). Same peak model underneath. */
const pctOf = (d: number) => Math.round(gainLin(d) * 100);
function sizeParam(peakDb: number, set: (d: number) => void): DockParam {
  return { ...peakParam(peakDb, set), label: 'SIZE', format: (v) => `${pctOf(pkAt(v))}% of the top of the scale`, formatShort: (v) => `${pctOf(pkAt(v))}%` } as DockParam;
}

function L5Waveform({ ctx: _ctx }: { ctx: PageCtx }) {
  const { meters, focused } = useEnv();
  const page = pageDef('l5-waveform');
  const [signal, setSignal] = useState<SignalKey>('speech');
  const [peakDb, setPeakDb] = useState(-6);
  const gain = usePeakGain(signal, peakDb);
  return (
    <StartRack
      page={page}
      initialParam="level"
      params={[sizeParam(peakDb, setPeakDb), signalParam(signal, setSignal)]}
      badge={BADGE_EXAMPLE}
      bezel={[
        { k: 'SIGNAL', v: (SIGNALS.find((s) => s.id === signal) ?? SIGNALS[0]).label, flex: 1.4 },
        { k: 'BIGGEST SWING', v: `${pctOf(peakDb)}% OF TOP`, tint: levelColor(pkPos(peakDb)), flex: 1.4 },
      ]}
      stage={(w, h) => (meters ? <WaveHost meters={meters} w={w} h={h} signal={signal} gain={gain} focused={focused} /> : <StageFallback w={w} />)}
    />
  );
}

function L5Meter({ ctx: _ctx }: { ctx: PageCtx }) {
  const { meters, focused } = useEnv();
  const page = pageDef('l5-meter');
  const [signal, setSignal] = useState<SignalKey>('speech');
  const [peakDb, setPeakDb] = useState(-12);
  const gain = usePeakGain(signal, peakDb);
  return (
    <StartRack
      page={page}
      initialParam="level"
      params={[peakParam(peakDb, setPeakDb), signalParam(signal, setSignal)]}
      badge={`${BADGE_EXAMPLE} · dBFS`}
      bezel={[
        { k: 'SIGNAL', v: (SIGNALS.find((s) => s.id === signal) ?? SIGNALS[0]).label, flex: 1.4 },
        { k: 'PEAK', v: fmtDbfs(peakDb), tint: levelColor(pkPos(peakDb)), flex: 1.2 },
      ]}
      stage={(w, h) => (meters ? <PeakHost meters={meters} w={w} h={h} signal={signal} gain={gain} focused={focused} /> : <StageFallback w={w} />)}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THE LAB — Your First Audio Signal (one signal, carried through five steps)

function sourceParam(first: FirstSignal, tone: ToneApi): DockParam {
  const cur = FIRST_SOURCES.find((s) => s.id === first.source) ?? FIRST_SOURCES[0];
  return {
    kind: 'options',
    id: 'src',
    label: 'SOURCE',
    valueLabel: cur.label,
    options: FIRST_SOURCES.map((s) => ({ id: s.id, label: s.label, blurb: s.blurb })),
    selectedId: first.source,
    onSelect: (id) => {
      // Your voice needs no tone — and the voice source has no PLAY key, so a
      // start still in flight must be cancelled too, or it would sound with no
      // way to stop it here (bug pass 2026-09-30).
      if (id === 'voice') tone.stop();
      first.setSource(id as FirstSource);
    },
    sticky: true,
  };
}

/** The test tone plays at the level leaving the mixer (−42 … −18 dBFS). */
const toneDbFor = mixOutDb;

function SourceStage({ viz, w, h, source, f, focused }: { viz: VizModule; w: number; h: number; source: FirstSource; f: number; focused: boolean }) {
  const clock = viz.useVizClock(focused);
  const ts = useStageTextScale();
  const visHz = source === 'voice' ? visHzFor(180) : visHzFor(f);
  const rowH = Math.round((h - 26 * ts) * 0.62);
  // The source keeps a driver-like shape at every size (tablet glass is tall).
  const srcW = Math.round(Math.max(84, Math.min(w * 0.3, rowH * 0.62)));
  const airW = Math.max(60, w - srcW - 6);
  const lambda = source === 'voice' ? airW / 2.4 : lambdaFor(airW, f);
  const graphH = Math.max(36, h - rowH - 30 * ts);
  return (
    <View style={{ width: w, height: h, justifyContent: 'center', gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: srcW, height: rowH, alignItems: 'center', justifyContent: 'center' }}>
          {source === 'voice' ? (
            <GearGlyph kind="listener" size={Math.min(srcW, rowH) * 0.9} label="A person humming" />
          ) : (
            <viz.SpeakerConeView clock={clock} width={srcW} height={rowH} visHz={visHz} amp={0.75} />
          )}
        </View>
        <viz.AirParticlesView clock={clock} width={airW} height={rowH} visHz={visHz} amp={0.75} lambdaPx={lambda} />
      </View>
      <Text style={[styles.winLabel, { fontSize: 10 * ts }]}>
        {source === 'voice' ? 'YOUR VOICE — a vibration pushing on the air' : `TEST TONE — ${f} Hz, one steady pitch`}
      </Text>
      <viz.PressureGraphView clock={clock} width={w} height={graphH} visHz={visHz} amp={0.75} lambdaPx={lambda} originX={srcW + 6} />
    </View>
  );
}

function FsMake({ ctx: _ctx }: { ctx: PageCtx }) {
  const { tone, viz, focused, first } = useEnv();
  const page = pageDef('fs-make');
  const isTone = first.source === 'tone';
  const params: DockParam[] = [
    sourceParam(first, tone),
    ...(isTone
      ? ([
          {
            kind: 'fader',
            id: 'freq',
            label: 'FREQUENCY',
            value: freqPos(first.freq),
            onChange: (v: number) => {
              const nf = freqAt(v);
              first.setFreq(nf);
              tone.set({ freqHz: nf });
            },
            format: (v: number) => `${freqAt(v)} Hz · ${pitchWord(freqAt(v)).toLowerCase()} pitch`,
            formatShort: (v: number) => `${freqAt(v)} Hz`,
            home: freqPos(220),
          },
          ...(tone.engineReady ? [playKey(tone, () => tone.play(first.freq, toneDbFor(first.gainDb)))] : []),
        ] as DockParam[])
      : []),
  ];
  return (
    <StartRack
      page={page}
      initialParam={isTone ? 'freq' : 'src'}
      params={params}
      badge={BADGE_MODEL}
      bezel={[
        { k: 'SOURCE', v: isTone ? 'TEST TONE' : 'YOUR VOICE', flex: 1.3 },
        { k: 'FREQ', v: isTone ? `${first.freq} Hz` : 'YOUR VOICE' },
        ...(isTone ? [toneCell(tone)] : []),
      ]}
      stage={(w, h) => (viz ? <SourceStage viz={viz} w={w} h={h} source={first.source} f={first.freq} focused={focused} /> : <StageFallback w={w} />)}
      wellTop={
        <View style={[styles.liveCard, { borderColor: 'rgba(55,224,95,.45)' }]}>
          <Text style={[styles.liveEyebrow, { color: colors.green }]}>YOUR SIGNAL · STEP 1 OF 5</Text>
          <Text style={styles.liveBody}>
            {isTone
              ? `You are following a ${first.freq} Hz test tone. Keep the volume low and comfortable.`
              : 'You are following your own voice. Hum now — feel the buzz in your throat. That vibration is the start of your signal.'}
          </Text>
        </View>
      }
    />
  );
}

function CaptureStage({ viz, w, h, focused, visHz }: { viz: VizModule; w: number; h: number; focused: boolean; visHz: number }) {
  const clock = viz.useVizClock(focused);
  const ts = useStageTextScale();
  const avail = Math.max(60, h - 34 * ts);
  const topH = Math.round(avail * 0.58);
  const graphH = avail - topH;
  return (
    <View style={{ width: w, height: h, justifyContent: 'center', gap: 4 }}>
      <Text style={[styles.winLabel, { fontSize: 10 * ts }]}>SOUND IN THE AIR → THE MICROPHONE</Text>
      <viz.SignalPathView clock={clock} width={w} height={topH} visHz={visHz} />
      <Text style={[styles.winLabel, { fontSize: 10 * ts, color: '#8fbaff' }]}>MIC OUTPUT — THE SAME PATTERN, NOW ELECTRICAL</Text>
      <viz.PressureGraphView clock={clock} width={w} height={graphH} visHz={visHz} amp={0.7} />
    </View>
  );
}

function FsCapture({ ctx: _ctx }: { ctx: PageCtx }) {
  const env = useEnv();
  const { tone, viz, focused, first } = env;
  const page = pageDef('fs-capture');
  const [frozen, setFrozen] = useState(false);
  const isTone = first.source === 'tone';
  const params: DockParam[] = [
    { kind: 'toggle', id: 'freeze', label: 'FREEZE', value: frozen, onToggle: () => setFrozen(!frozen) },
    ...(isTone && tone.engineReady ? [playKey(tone, () => tone.play(first.freq, toneDbFor(first.gainDb)))] : []),
  ];
  return (
    <StartRack
      page={page}
      initialParam="freeze"
      params={params}
      badge={BADGE_MODEL}
      bezel={[
        { k: 'IN THE AIR', v: 'SOUND', tint: colors.amber, flex: 1.2 },
        { k: 'OUT OF THE MIC', v: 'AUDIO SIGNAL', tint: '#8fbaff', flex: 1.5 },
      ]}
      stage={(w, h) => (viz ? <CaptureStage viz={viz} w={w} h={h} focused={focused && !frozen} visHz={visHzFor(isTone ? first.freq : 180)} /> : <StageFallback w={w} />)}
      wellTop={
        <View style={[styles.liveCard, { borderColor: 'rgba(55,224,95,.45)' }]}>
          <Text style={[styles.liveEyebrow, { color: colors.green }]}>YOUR SIGNAL · STEP 2 OF 5</Text>
          <Text style={styles.liveBody}>
            {isTone ? 'Your test tone reaches the microphone and becomes an audio signal.' : 'Your voice reaches the microphone and becomes an audio signal.'}
          </Text>
          <Pressable
            onPress={() => {
              tone.stop();
              env.openRoute('WaveformLive');
            }}
            style={styles.linkBtn}
            accessibilityRole="button"
            accessibilityLabel="Try it with your phone's microphone: open the Waveform tool"
          >
            <Text style={styles.linkText}>TRY IT WITH YOUR PHONE’S MIC · WAVEFORM TOOL ›</Text>
          </Pressable>
        </View>
      }
    />
  );
}

function FsFollow({ ctx: _ctx }: { ctx: PageCtx }) {
  const { first } = useEnv();
  const page = pageDef('fs-follow');
  const u = UNPLUG_OPTIONS.find((o) => o.id === first.unplug) ?? UNPLUG_OPTIONS[0];
  const yes = (id: StationId) => (stationLive(id, first.unplug) ? 'SIGNAL' : 'NONE');
  const tintOf = (id: StationId) => (stationLive(id, first.unplug) ? colors.green : '#ff5a48');
  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'plug',
      label: 'PLUG',
      valueLabel: first.unplug === 'none' ? 'ALL IN' : 'PULLED',
      options: UNPLUG_OPTIONS.map((o) => ({ id: o.id, label: o.label, blurb: o.blurb })),
      selectedId: first.unplug,
      onSelect: (id) => first.setUnplug(id as Unplug),
      sticky: true,
    },
  ];
  return (
    <StartRack
      page={page}
      initialParam="plug"
      size="M"
      params={params}
      badge={BADGE_DIAGRAM}
      bezel={[
        { k: 'MIXER', v: yes('mixer'), tint: tintOf('mixer') },
        { k: 'SPEAKER', v: yes('speaker'), tint: tintOf('speaker') },
        { k: 'LISTENER', v: stationLive('listener', first.unplug) ? 'HEARS THE PA' : 'VOICE ONLY', tint: tintOf('listener'), flex: 1.2 },
      ]}
      stage={(w, h) => (
        <StageFit w={w} h={h} aspect={PATH_ASPECT}>
          <SignalPathArt unplug={first.unplug} highlight={first.unplug === 'none' ? null : first.unplug} />
        </StageFit>
      )}
      wellTop={
        <View style={[styles.liveCard, { borderColor: 'rgba(55,224,95,.45)' }]}>
          <Text style={[styles.liveEyebrow, { color: colors.green }]}>YOUR SIGNAL · STEP 3 OF 5</Text>
          <Text style={styles.liveTitle}>{u.label}</Text>
          <Text style={styles.liveBody}>{u.blurb}</Text>
        </View>
      }
    />
  );
}

function ChangeStage({ meters, w, h, signal, gain, focused }: { meters: VizMetersModule; w: number; h: number; signal: SignalKey; gain: number; focused: boolean }) {
  // Waveform left, the mixer's meter right — the Meter Lab's two displays,
  // side by side, reading the same signal at the same level.
  const meterW = Math.max(160, Math.min(220, Math.round(w * 0.44)));
  const waveW = Math.max(80, w - meterW - 4);
  // Each display clipped to its own box: the two instruments' corner legends
  // must never paint over each other on a narrow phone.
  return (
    <View style={{ width: w, height: h, flexDirection: 'row', gap: 4 }}>
      <View style={{ width: waveW, height: h, overflow: 'hidden' }}>
        <WaveHost meters={meters} w={waveW} h={h} signal={signal} gain={gain} focused={focused} />
      </View>
      <View style={{ width: meterW, height: h, overflow: 'hidden' }}>
        <PeakHost meters={meters} w={meterW} h={h} signal={signal} gain={gain} focused={focused} />
      </View>
    </View>
  );
}

function FsChange({ ctx: _ctx }: { ctx: PageCtx }) {
  const { tone, meters, focused, first } = useEnv();
  const page = pageDef('fs-change');
  const isTone = first.source === 'tone';
  const signal: SignalKey = isTone ? 'sine' : 'speech';
  const outDb = mixOutDb(first.gainDb);
  const gain = usePeakGain(signal, outDb);
  const params: DockParam[] = [
    faderParam(first.gainDb, (d) => {
      first.setGainDb(d);
      tone.set({ levelDb: toneDbFor(d) });
    }),
    ...(isTone && tone.engineReady ? [playKey(tone, () => tone.play(first.freq, toneDbFor(first.gainDb)), true)] : []),
  ];
  return (
    <StartRack
      page={page}
      initialParam="level"
      params={params}
      badge={`${BADGE_EXAMPLE} · dBFS`}
      bezel={[
        { k: 'FADER', v: fmtFader(first.gainDb), tint: levelColor(pkPos(mixOutDb(first.gainDb))), flex: 1.4 },
        { k: 'PEAK OUT', v: fmtDbfs(outDb), tint: levelColor(pkPos(outDb)), flex: 1.2 },
        ...(isTone ? [toneCell(tone)] : []),
      ]}
      stage={(w, h) => (meters ? <ChangeStage meters={meters} w={w} h={h} signal={signal} gain={gain} focused={focused} /> : <StageFallback w={w} />)}
      wellTop={
        <View style={[styles.liveCard, { borderColor: 'rgba(55,224,95,.45)' }]}>
          <Text style={[styles.liveEyebrow, { color: colors.green }]}>YOUR SIGNAL · STEP 4 OF 5</Text>
          <Text style={styles.liveBody}>
            {isTone
              ? 'Your test tone, at the mixer. The display draws a steady tone — the same kind of signal you are hearing.'
              : 'Your voice, at the mixer. The display shows an example voice signal, the way yours would look.'}
          </Text>
        </View>
      }
    />
  );
}

function FsListen({ ctx: _ctx }: { ctx: PageCtx }) {
  const { tone, viz, focused, first } = useEnv();
  const page = pageDef('fs-listen');
  const isTone = first.source === 'tone';
  const f = isTone ? first.freq : 180;
  const amp = 0.25 + 0.75 * faderPos(first.gainDb);
  const params: DockParam[] = [
    faderParam(first.gainDb, (d) => {
      first.setGainDb(d);
      tone.set({ levelDb: toneDbFor(d) });
    }),
    ...(isTone && tone.engineReady ? [playKey(tone, () => tone.play(first.freq, toneDbFor(first.gainDb)), true)] : []),
  ];
  return (
    <StartRack
      page={page}
      initialParam="level"
      params={params}
      badge={BADGE_MODEL}
      bezel={[
        { k: 'SOURCE', v: isTone ? `${first.freq} Hz` : 'VOICE', flex: 1.2 },
        { k: 'FADER', v: fmtFader(first.gainDb), tint: levelColor(pkPos(mixOutDb(first.gainDb))), flex: 1.4 },
        ...(isTone ? [toneCell(tone)] : []),
      ]}
      stage={(w, h) =>
        viz ? (
          <FitStage w={w} h={h} natural={THREE_WINDOW_NATURAL}>
            {(vw, k) => <viz.ThreeWindowView width={vw} scale={k} visHz={visHzFor(f)} amp={amp} running={focused} showEar />}
          </FitStage>
        ) : (
          <StageFallback w={w} />
        )
      }
      wellTop={
        <>
          <View style={[styles.liveCard, { borderColor: 'rgba(55,224,95,.45)' }]}>
            <Text style={[styles.liveEyebrow, { color: colors.green }]}>YOUR SIGNAL · STEP 5 OF 5</Text>
            <Text style={styles.liveBody}>
              {isTone
                ? 'Your test tone leaves the speaker as sound and reaches your ear. Listen: same pitch you chose, at the level you set.'
                : 'Your voice leaves the speaker as sound and reaches the listener — louder than you could make it alone.'}
            </Text>
          </View>
          <RevealList items={REFLECT_PROMPTS} />
        </>
      }
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LESSON 6 — match the words to the path

function L6Match({ ctx }: { ctx: PageCtx }) {
  const page = pageDef('l6-match');
  const [i, setI] = useState(0);
  const [got, setGot] = useState<Set<number>>(() => new Set());
  const [marks, setMarks] = useState<Partial<Record<MatchTarget, PathMark>>>({});
  const [note, setNote] = useState<string | null>(null);
  const done = i >= MATCH_PROMPTS.length;
  const p = MATCH_PROMPTS[Math.min(i, MATCH_PROMPTS.length - 1)];
  const jackMode = !done && (p.termId === 'input' || p.termId === 'output');
  const term = termById(p.termId);

  const advance = (gotIt: boolean) => {
    const g = new Set(got);
    if (gotIt) g.add(i);
    setGot(g);
    setMarks({});
    setNote(null);
    const n = i + 1;
    setI(n);
    if (n >= MATCH_PROMPTS.length && g.size === MATCH_PROMPTS.length) ctx.markDone();
  };
  const answer = (t: MatchTarget) => {
    if (done) return;
    if (p.targets.includes(t)) {
      setMarks({ [t]: 'right' });
      setNote(`✓ ${p.right}`);
      // Hold the green ring a moment is NOT auto-advance: the learner taps NEXT.
      setGot((g) => new Set(g).add(i));
    } else {
      setMarks({ [t]: 'wrong' });
      setNote(`Not quite — that is ${targetName(t)}. Try again.`);
    }
  };
  const answered = got.has(i);
  const restart = () => {
    setI(0);
    setGot(new Set());
    setMarks({});
    setNote(null);
  };
  const allTargets: MatchTarget[] = jackMode
    ? ['voice', 'mic.out', 'cableA', 'mixer.in', 'mixer.out', 'cableB', 'speaker.in', 'listener']
    : ['voice', 'mic', 'cableA', 'mixer', 'cableB', 'speaker', 'listener'];
  const params: DockParam[] = done
    ? [{ kind: 'action', id: 'again', label: 'MATCH AGAIN', onPress: restart, tint: colors.green }]
    : [
        {
          kind: 'options',
          id: 'answer',
          label: 'LIST',
          valueLabel: 'PICK',
          options: allTargets.map((t) => ({ id: t, label: targetName(t).replace(/^the /, '').toUpperCase() })),
          selectedId: null,
          onSelect: (id) => answer(id as MatchTarget),
        },
        // No RESTART beside SKIP mid-round (one slip would wipe the round);
        // MATCH AGAIN at the end starts over.
        { kind: 'action', id: 'next', label: answered ? 'NEXT WORD' : 'SKIP', onPress: () => advance(answered), tint: answered ? colors.green : undefined },
      ];
  return (
    <StartRack
      page={page}
      initialParam={done ? 'again' : 'answer'}
      size="M"
      params={params}
      badge={BADGE_DIAGRAM}
      bezel={[
        { k: 'WORD', v: done ? 'DONE' : `${i + 1} / ${MATCH_PROMPTS.length}` },
        { k: 'MATCHED', v: `${got.size} / ${MATCH_PROMPTS.length}`, tint: got.size === MATCH_PROMPTS.length ? colors.green : undefined },
      ]}
      stage={(w, h) => (
        <StageFit w={w} h={h} aspect={PATH_ASPECT}>
          <SignalPathArt
            showForms={false}
            jackMode={jackMode}
            marks={marks}
            onTap={answer}
            running={false}
            tapLabel={(t) => `${targetName(t)}. Choose as the answer`}
          />
        </StageFit>
      )}
      wellTop={
        done ? (
          <View style={[styles.liveCard, { borderColor: 'rgba(55,224,95,.5)' }]}>
            <Text style={[styles.liveEyebrow, { color: colors.green }]}>ALL SEVEN WORDS · {got.size} MATCHED</Text>
            <Text style={styles.liveBody}>
              {got.size === MATCH_PROMPTS.length
                ? 'Every word placed. That map — source, microphone, cable, input, output, speaker, listener — is the one the rest of the app builds on.'
                : 'You skipped a few — MATCH AGAIN whenever you like, or carry on. Nothing here is graded.'}
            </Text>
          </View>
        ) : (
          <View style={[styles.liveCard, { borderColor: 'rgba(127,212,255,.5)' }]}>
            <Text style={[styles.liveEyebrow, { color: colors.cyanBright }]}>
              WORD {i + 1} OF {MATCH_PROMPTS.length} · {term?.term.toUpperCase()}
            </Text>
            <Text style={styles.liveTitle}>{p.ask}</Text>
            {note ? <Text style={[styles.liveBody, { color: note.startsWith('✓') ? '#9ef0b4' : colors.amber }]}>{note}</Text> : null}
          </View>
        )
      }
    />
  );
}

function L6Safe({ ctx: _ctx }: { ctx: PageCtx }) {
  const env = useEnv();
  return (
    <DocPage
      page={pageDef('l6-safe')}
      after={
        <View style={{ gap: 10 }}>
          <Text style={styles.cardEyebrow}>QUICK RECAP · ONE QUESTION FROM EACH IDEA</Text>
          {RECAP_CHECKS.map((c) => (
            <CheckQuestion key={c.question} spec={c} />
          ))}
          <Text style={styles.finishHint}>Press FINISH below to choose where to go next.</Text>
        </View>
      }
    >
      <View style={styles.btnRow}>
        <Pressable onPress={env.openSafety} style={styles.linkBtn} accessibilityRole="button" accessibilityLabel="Open the Pro Audio Safety topic">
          <Text style={styles.linkText}>PRO AUDIO SAFETY TOPIC ›</Text>
        </Pressable>
        <Pressable onPress={env.openTerms} style={styles.linkBtn} accessibilityRole="button" accessibilityLabel="Practise all 24 starter words">
          <Text style={styles.linkText}>PRACTISE ALL 24 STARTER WORDS ›</Text>
        </Pressable>
      </View>
    </DocPage>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export const PAGE_COMPONENTS: Record<PageId, (p: { ctx: PageCtx }) => React.JSX.Element> = {
  welcome: WelcomePage,
  'l1-vibrate': L1Vibrate,
  'l1-words': L1Words,
  'l2-path': L2Path,
  'l2-sort': L2Sort,
  'l3-freq': L3Freq,
  'l3-amp': L3Amp,
  'l3-measured': L3Measured,
  'l4-parts': L4Parts,
  'l4-order': L4Order,
  'l5-waveform': L5Waveform,
  'l5-meter': L5Meter,
  'fs-make': FsMake,
  'fs-capture': FsCapture,
  'fs-follow': FsFollow,
  'fs-change': FsChange,
  'fs-listen': FsListen,
  'l6-match': L6Match,
  'l6-safe': L6Safe,
};

const styles = StyleSheet.create({
  well: { gap: 12 },
  notes: { gap: 12 },
  doc: { gap: 14 },
  caption: { color: colors.amber, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 20 },
  winLabel: { fontFamily: fonts.oswaldSemiBold, letterSpacing: 1, color: colors.textSub, textAlign: 'center' },
  liveCard: { gap: 6, borderRadius: 12, borderWidth: 1, backgroundColor: '#111114', padding: 12 },
  liveEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.3 },
  liveTitle: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 16, lineHeight: 22 },
  liveBody: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21 },
  cardEyebrow: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.4 },
  cardBody: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20 },
  mapRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, borderTopWidth: 1, borderTopColor: '#1f1f24', paddingVertical: 8 },
  mapNum: { width: 34, color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 17, textAlign: 'center' },
  mapTitle: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 15 },
  mapBlurb: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  mapGo: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 20 },
  linkBtn: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.5)',
    backgroundColor: '#112016',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  linkText: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.9 },
  btnRow: { gap: 10 },
  guestNote: { color: colors.amber, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 20 },
  strip: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#0e0e11', paddingVertical: 12 },
  stripCol: { alignItems: 'center', gap: 6 },
  stripLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.2 },
  finishHint: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13.5, textAlign: 'center', marginTop: 4 },
  tableHead: { flexDirection: 'row', justifyContent: 'space-around' },
  tableHeadText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4 },
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: '#1f1f24', paddingTop: 8 },
  tableCell: { flex: 1, alignItems: 'center', gap: 2 },
  tableWord: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 0.6 },
  tableHow: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, textAlign: 'center', lineHeight: 17 },
  tableArrow: { color: colors.textMuted, fontFamily: fonts.oswaldSemiBold, fontSize: 18 },
});

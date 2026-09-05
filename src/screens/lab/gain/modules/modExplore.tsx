/**
 * Gain Staging Lab — EXPLORE + CHALLENGE modules, RACK UNIT layout (owner spec
 * + edit pass 2026-08-07; rack conversion APE_LAB_UX_PROPOSAL 2026-08-23).
 * Each module renders the RackUnit frame itself: the WHOLE chain pins on the
 * stage glass as columns, live numbers on the bezel, gain controls on the dock
 * (preamp/source on the lane; the remaining stages grouped in PROCESS / LEVELS
 * trays of DragSliders), and only prose + feedback scroll in the well.
 *
 *  6 · Multiple Gain Stages — real-gear honesty preserved: X-Ray OFF shows each
 *      column's SIG/CLIP LEDs only (that's all hardware gives you); the X-RAY
 *      dock key reveals the meter inside every box at once. TEST YOURSELF —
 *      RANDOM scrambles the chain for the student to correct.
 *  7 · Free Practice — same rig, plus the SOURCE is yours (the one thing module
 *      6 never hands over) and nothing is graded.
 *  8 · Troubleshooting — real life: you DON'T get meters at every stage. Every
 *      column loads COLLAPSED; only the Master Output is open — and it is
 *      clipping. Inspect ONE stage at a time (tap a column on the glass, or use
 *      the INSPECT tray) to find the first stage that clips; find it and its
 *      fader binds to the dock lane for the fix. All healthy ⇒ green trophy
 *      frame on the glass + TRY AGAIN key. Completes on an actual PASS
 *      (markLabUnit fires only when the chain is restored to healthy).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { GlossaryText } from '../../../../features/glossary/glossaryLink';
import { markLabUnit } from '../../../../features/lab/labCompletion';
import { RackUnit } from '../../rack/RackUnit';
import type { DockParam } from '../../rack/rackTypes';
import { ChainStage, DragSlider, GainBtn, stageStatus, stageTint, type StageColSpec } from '../gainViz';
import { chainIsHealthy, computeChain, type Stage } from '../gainEngine';
import type { GainModuleComponentProps } from './registry';

const mk = (key: string, name: string, kind: Stage['kind'], gain: number, min: number, max: number): Stage => ({
  key, name, kind, gain, min, max, adjustable: true,
});

type Gains = Record<string, number>;

/** The full console-style chain: Preamp → EQ → Comp → Fader → Bus → Master. */
function fullChain(g: Gains): Stage[] {
  return [
    mk('pre', 'Preamp', 'preamp', g.pre, 0, 40),
    mk('eq', 'EQ', 'eq', g.eq, -12, 12),
    mk('comp', 'Compressor', 'comp', g.comp, -12, 12),
    mk('fad', 'Channel Fader', 'fader', g.fad, -30, 10),
    mk('bus', 'Bus', 'bus', g.bus, -12, 12),
    mk('out', 'Master Output', 'output', g.out, -30, 6),
  ];
}

const STAGE_RANGES: Record<string, [number, number]> = {
  pre: [0, 40], eq: [-12, 12], comp: [-12, 12], fad: [-30, 10], bus: [-12, 12], out: [-30, 6],
};

/** Short column names for the stage glass (7 columns across a phone). */
const SHORT: Record<string, string> = {
  source: 'SOURCE', pre: 'PREAMP', eq: 'EQ', comp: 'COMP', fad: 'FADER', bus: 'BUS', out: 'MASTER',
};

/** Honesty badge on every gain-chain glass: simulation on a relative scale. */
const BADGE = 'SIMULATED SIGNAL CHAIN · RELATIVE dB';

const fmtDb = (v: number) => `${v >= 0 ? '+' : ''}${v} dB`;
const fmtG = (v: number) => `${v >= 0 ? '+' : ''}${v}`;
const fmtLv = (lv: number) => `${Math.round(lv)} dB`;

const rnd = (lo: number, hi: number) => Math.round(lo + Math.random() * (hi - lo));

/** Random settings across every stage — the TEST YOURSELF deck shuffle. */
function randomGains(): Gains {
  const g: Gains = {};
  for (const [k, [lo, hi]] of Object.entries(STAGE_RANGES)) g[k] = rnd(lo, hi);
  return g;
}

// ───────────────────────────────────────── 6 · Multiple Gain Stages ─────────
const MULTI_START: Gains = { pre: 8, eq: -6, comp: 0, fad: 6, bus: 6, out: 0 };

export function MultiStageModule(_p: GainModuleComponentProps) {
  const [g, setG] = useState<Gains>(MULTI_START);
  const [xray, setXray] = useState(false);
  const stages = useMemo(() => fullChain(g), [g]);
  const nodes = computeChain(-30, stages);
  const healthy = chainIsHealthy(nodes);
  const setGain = useCallback((k: string, v: number) => setG((prev) => ({ ...prev, [k]: v })), []);

  /** One in-tray DragSlider bound to a chain stage (the group-tray graft). */
  const traySlider = (key: string, label: string) => {
    const st = stages.find((s) => s.key === key)!;
    const node = nodes.find((n) => n.key === key)!;
    return (
      <DragSlider
        key={key}
        label={label}
        value={(st.gain - st.min) / (st.max - st.min)}
        onChange={(t) => setGain(key, Math.round(st.min + t * (st.max - st.min)))}
        readout={fmtDb(st.gain)}
        tint={stageTint(node)}
        levelTint
      />
    );
  };

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'pre',
      label: 'PREAMP',
      level: true,
      value: g.pre / 40,
      onChange: (t) => setGain('pre', Math.round(t * 40)),
      format: () => fmtDb(g.pre),
      formatShort: () => fmtG(g.pre),
      tint: stageTint(nodes[1]),
    },
    {
      kind: 'group',
      id: 'proc',
      label: 'PROCESS',
      valueLabel: `${g.eq}·${g.comp}`,
      render: () => (
        <View style={styles.trayCol}>
          {traySlider('eq', 'EQ GAIN')}
          {traySlider('comp', 'COMPRESSOR OUTPUT')}
        </View>
      ),
    },
    {
      kind: 'group',
      id: 'lvl',
      label: 'LEVELS',
      valueLabel: `${g.fad}·${g.bus}·${g.out}`,
      render: () => (
        <View style={styles.trayCol}>
          {traySlider('fad', 'CHANNEL FADER')}
          {traySlider('bus', 'BUS')}
          {traySlider('out', 'MASTER OUTPUT')}
        </View>
      ),
    },
    { kind: 'toggle', id: 'xray', label: 'X-RAY', value: xray, onToggle: () => setXray((v) => !v) },
  ];

  const disp = xray ? ('meter' as const) : ('leds' as const);
  const cols: StageColSpec[] = [
    { key: 'source', name: 'SOURCE', kind: 'source', node: nodes[0], display: disp, fixed: true, active: xray },
    ...stages.map((st, i) => ({
      key: st.key,
      name: SHORT[st.key],
      kind: st.kind,
      node: nodes[i + 1],
      display: disp,
      readout: fmtDb(st.gain),
      active: xray,
    })),
  ];

  return (
    <RackUnit
      initialParam="pre"
      params={params}
      stage={{
        size: 'L',
        badge: BADGE,
        bezel: [
          { k: 'MASTER', v: fmtLv(nodes[6].level), tint: stageTint(nodes[6]) },
          { k: 'HEADROOM', v: `${Math.max(0, -Math.round(nodes[6].level))} dB` },
          { k: 'X-RAY', v: xray ? 'ON' : 'OFF', tint: xray ? '#7fd4ff' : '#7a7f8a' },
          { k: 'BALANCE', v: healthy ? '✓ OK' : '—', tint: healthy ? colors.green : '#7a7f8a' },
        ],
        render: (w, h) => <ChainStage w={w} h={h} cols={cols} />,
      }}
    >
      <View style={styles.well}>
        <GlossaryText style={styles.body}>
          A real channel is a rack of separate devices — and from the outside, all a device shows you
          is a SIG light and a CLIP light. SIGNAL X-RAY sees through every box at once: the level at
          every point in the chain, gain staging as a system instead of isolated knobs.
        </GlossaryText>
        <Text style={styles.caption}>
          The source is a quiet instrument/source — fixed. The preamp rides the dock lane; the rest
          of the chain lives in the PROCESS and LEVELS trays.
        </Text>
        <View style={styles.btnRow}>
          <GainBtn label="TEST YOURSELF — RANDOM" onPress={() => setG(randomGains())} />
          <GainBtn label="RESET" onPress={() => setG(MULTI_START)} />
        </View>
        <View style={[styles.note, healthy && styles.noteGood]}>
          <Text style={[styles.noteText, healthy && styles.noteTextGood]}>
            {healthy
              ? '✓ Balanced — a healthy operating level at every stage, no baked-in distortion.'
              : 'Not balanced yet — flip on the X-Ray, find the stage that is too hot or too weak, and fix it THERE.'}
          </Text>
        </View>
      </View>
    </RackUnit>
  );
}

// ───────────────────────────────────────── 7 · Free Practice ────────────────
const FREE_START: Gains = { pre: 20, eq: 0, comp: 0, fad: 0, bus: 0, out: 0 };

export function FreePlayModule(_p: GainModuleComponentProps) {
  const [source, setSource] = useState(-30);
  const [g, setG] = useState<Gains>(FREE_START);
  const [xray, setXray] = useState(true);
  const stages = useMemo(() => fullChain(g), [g]);
  const nodes = computeChain(source, stages);
  const setGain = useCallback((k: string, v: number) => setG((prev) => ({ ...prev, [k]: v })), []);

  const traySlider = (key: string, label: string) => {
    const st = stages.find((s) => s.key === key)!;
    const node = nodes.find((n) => n.key === key)!;
    return (
      <DragSlider
        key={key}
        label={label}
        value={(st.gain - st.min) / (st.max - st.min)}
        onChange={(t) => setGain(key, Math.round(st.min + t * (st.max - st.min)))}
        readout={fmtDb(st.gain)}
        tint={stageTint(node)}
        levelTint
      />
    );
  };

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'src',
      label: 'SOURCE',
      level: true,
      value: (source + 40) / 38,
      onChange: (t) => setSource(Math.round(-40 + t * 38)),
      format: () => `${source} dB`,
      formatShort: () => `${source}`,
      tint: stageTint(nodes[0]),
    },
    {
      kind: 'fader',
      id: 'pre',
      label: 'PREAMP',
      level: true,
      value: g.pre / 40,
      onChange: (t) => setGain('pre', Math.round(t * 40)),
      format: () => fmtDb(g.pre),
      formatShort: () => fmtG(g.pre),
      tint: stageTint(nodes[1]),
    },
    {
      kind: 'group',
      id: 'proc',
      label: 'PROCESS',
      valueLabel: `${g.eq}·${g.comp}`,
      render: () => (
        <View style={styles.trayCol}>
          {traySlider('eq', 'EQ GAIN')}
          {traySlider('comp', 'COMPRESSOR OUTPUT')}
        </View>
      ),
    },
    {
      kind: 'group',
      id: 'lvl',
      label: 'LEVELS',
      valueLabel: `${g.fad}·${g.bus}·${g.out}`,
      render: () => (
        <View style={styles.trayCol}>
          {traySlider('fad', 'CHANNEL FADER')}
          {traySlider('bus', 'BUS')}
          {traySlider('out', 'MASTER OUTPUT')}
        </View>
      ),
    },
    { kind: 'toggle', id: 'xray', label: 'X-RAY', value: xray, onToggle: () => setXray((v) => !v) },
  ];

  const disp = xray ? ('meter' as const) : ('leds' as const);
  const cols: StageColSpec[] = [
    { key: 'source', name: 'SOURCE', kind: 'source', node: nodes[0], display: disp, readout: `${source} dB` },
    ...stages.map((st, i) => ({
      key: st.key,
      name: SHORT[st.key],
      kind: st.kind,
      node: nodes[i + 1],
      display: disp,
      readout: fmtDb(st.gain),
    })),
  ];

  return (
    <RackUnit
      initialParam="src"
      params={params}
      stage={{
        size: 'L',
        badge: BADGE,
        bezel: [
          { k: 'SOURCE', v: fmtLv(nodes[0].level), tint: stageTint(nodes[0]) },
          { k: 'MASTER', v: fmtLv(nodes[6].level), tint: stageTint(nodes[6]) },
          { k: 'X-RAY', v: xray ? 'ON' : 'OFF', tint: xray ? '#7fd4ff' : '#7a7f8a' },
          { k: 'STATUS', ...stageStatus(nodes[6]) },
        ],
        render: (w, h) => <ChainStage w={w} h={h} cols={cols} />,
      }}
    >
      <View style={styles.well}>
        <GlossaryText style={styles.body}>
          Free practice — here even the SOURCE is yours, the one control module 6 never hands over.
          Feed the rig a whisper or a scream, make deliberate mistakes, recover cleanly. Nothing is
          graded; the chain just tells the truth.
        </GlossaryText>
        <View style={styles.btnRow}>
          <GainBtn label="TEST YOURSELF — RANDOM" onPress={() => { setSource(rnd(-40, -2)); setG(randomGains()); }} />
          <GainBtn label="RESET" onPress={() => { setSource(-30); setG(FREE_START); }} />
        </View>
      </View>
    </RackUnit>
  );
}

// ───────────────────────────────────────── 8 · Troubleshooting Challenge ────
const FAULT_KEYS = ['pre', 'eq', 'comp', 'fad', 'bus'] as const;
type FaultKey = (typeof FAULT_KEYS)[number];

const FAULT_EXPLAIN: Record<FaultKey, string> = {
  pre: 'PREAMP TOO HOT — the very first gain decision clips, and everything after inherits the damage.',
  eq: 'EQ SET TOO HOT — a healthy preamp level gets boosted straight into the ceiling at the EQ.',
  comp: 'COMPRESSOR OUTPUT TOO HOT — its make-up gain slams the signal over the top.',
  fad: 'CHANNEL FADER TOO HOT — pushed so far up it overloads right at the fader.',
  bus: 'BUS OVERLOADED — the sum tips over the ceiling at the bus.',
};

const INSPECT_NAMES: Record<string, string> = {
  source: 'Source', pre: 'Preamp', eq: 'EQ', comp: 'Compressor', fad: 'Channel Fader', bus: 'Bus', out: 'Master Output',
};

/** A sane chain (≈ −10 at every point) with ONE stage hot enough to clip —
 *  which cascades, so the master ALWAYS shows CLIP on load (owner spec). */
function makeFault(): { gains: Gains; faultKey: FaultKey } {
  const faultKey = FAULT_KEYS[Math.floor(Math.random() * FAULT_KEYS.length)];
  const gains: Gains = { pre: 20, eq: 0, comp: 0, fad: 0, bus: 0, out: 0 };
  if (faultKey === 'pre') gains.pre = rnd(34, 40);
  else if (faultKey === 'fad') gains.fad = 10;
  else gains[faultKey] = 12;
  return { gains, faultKey };
}

export function TroubleshootModule(_p: GainModuleComponentProps) {
  const [round, setRound] = useState(() => makeFault());
  const [g, setG] = useState<Gains>(round.gains);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [found, setFound] = useState(false);

  const stages = useMemo(() => fullChain(g), [g]);
  const nodes = computeChain(-30, stages);
  const healthy = found && chainIsHealthy(nodes);
  const setGain = useCallback((k: string, v: number) => setG((prev) => ({ ...prev, [k]: v })), []);

  // R6c: the Troubleshoot CHALLENGE completes on an actual pass — the fault
  // found AND the chain restored to healthy at every stage.
  useEffect(() => {
    if (healthy) markLabUnit('af_gain_staging', 'troubleshoot');
  }, [healthy]);

  const newRound = useCallback(() => {
    const r = makeFault();
    setRound(r);
    setG(r.gains);
    setRevealed(null);
    setFound(false);
  }, []);

  // One device at a time — before AND after the fault is found (owner
  // 2026-08-10): finding it never opens the whole chain; you keep inspecting
  // single stages, and the dock fader binds to whichever one is open.
  const inspect = (key: string) => {
    setRevealed(key);
    if (key === round.faultKey) setFound(true);
  };

  const revealedNode = revealed ? (nodes.find((n) => n.key === revealed) ?? null) : null;
  // The dock fader binds to the revealed STAGE once the fault is found (the
  // source has no gain control — inspection only).
  const fixStage = found && revealed ? (stages.find((s) => s.key === revealed) ?? null) : null;
  const fixNode = fixStage ? nodes.find((n) => n.key === fixStage.key)! : null;

  const cols: StageColSpec[] = [
    {
      key: 'source',
      name: 'SOURCE',
      kind: 'source',
      node: nodes[0],
      display: revealed === 'source' ? 'meter' : 'hidden',
      onPress: () => inspect('source'),
      active: revealed === 'source',
    },
    ...stages.map((st, i) => {
      const isMaster = st.key === 'out';
      // On PASS the whole restored chain is revealed (fix 2026-08-31: the
      // trophy copy said "healthy at every stage" over four '?' columns).
      const open = isMaster || revealed === st.key || healthy;
      return {
        key: st.key,
        name: SHORT[st.key],
        kind: st.kind,
        node: nodes[i + 1],
        display: open ? ('meter' as const) : ('hidden' as const),
        onPress: !isMaster || found ? () => inspect(st.key) : undefined,
        active: revealed === st.key,
        readout: found && revealed === st.key ? fmtDb(st.gain) : undefined,
      };
    }),
  ];

  const params: DockParam[] = [
    {
      // Sticky tray mirror of tapping the columns — step through the chain
      // while the meters react on the glass.
      kind: 'options',
      id: 'inspect',
      label: 'INSPECT',
      valueLabel: revealed ? SHORT[revealed] : '—',
      options: [
        { id: 'source', label: INSPECT_NAMES.source },
        ...FAULT_KEYS.map((k) => ({ id: k, label: INSPECT_NAMES[k] })),
        ...(found ? [{ id: 'out', label: INSPECT_NAMES.out }] : []),
      ],
      selectedId: revealed,
      onSelect: inspect,
      sticky: true,
    },
    ...(fixStage
      ? [
          {
            kind: 'fader' as const,
            id: 'fix',
            label: SHORT[fixStage.key],
            level: true,
            value: (fixStage.gain - fixStage.min) / (fixStage.max - fixStage.min),
            onChange: (t: number) => setGain(fixStage.key, Math.round(fixStage.min + t * (fixStage.max - fixStage.min))),
            format: () => fmtDb(fixStage.gain),
            formatShort: () => fmtG(fixStage.gain),
            tint: fixNode ? stageTint(fixNode) : undefined,
          },
        ]
      : []),
    ...(healthy ? [{ kind: 'action' as const, id: 'again', label: 'TRY AGAIN', onPress: newRound }] : []),
  ];

  return (
    <RackUnit
      initialParam="fix"
      params={params}
      stage={{
        size: 'L',
        badge: BADGE,
        bezel: [
          { k: 'MASTER', v: fmtLv(nodes[6].level), tint: stageTint(nodes[6]) },
          { k: 'STATUS', ...stageStatus(nodes[6]) },
          { k: 'INSPECT', v: revealed ? SHORT[revealed] : '—' },
          { k: 'FOUND', v: found ? '✓' : '—', tint: found ? colors.green : '#7a7f8a' },
        ],
        render: (w, h) => (
          <View style={{ width: w, height: h }}>
            <ChainStage w={w} h={h} cols={cols} />
            {healthy ? (
              // The all-healthy trophy frame (owner spec) — now drawn on the
              // glass itself, where the whole restored chain is visible.
              <View pointerEvents="none" style={styles.trophyFrame} />
            ) : null}
          </View>
        ),
      }}
    >
      <View style={styles.well}>
        <GlossaryText style={styles.body}>
          Real life: you do NOT get a meter at every stage. The master output is clipping — that’s
          all you know. Inspect ONE device at a time and find the FIRST stage that clips (clipping
          cascades downstream, so work back upstream). Find it, then fix it the same way — one
          device at a time.
        </GlossaryText>

        {!found && revealed && revealed !== round.faultKey && revealedNode ? (
          <View style={styles.note}>
            <Text style={styles.noteText}>
              {revealedNode.stageClipped
                ? 'Clipping here too — but is this the FIRST place? The damage may start upstream.'
                : 'Healthy here — the problem is elsewhere.'}
            </Text>
          </View>
        ) : null}

        {found ? (
          <View style={[styles.note, healthy ? styles.noteGood : styles.noteFound]}>
            <Text style={[styles.noteText, healthy && styles.noteTextGood]}>
              {healthy
                ? '✓ FIXED — healthy at every stage, master included. Take the green frame as your trophy.'
                : `✓ FOUND — ${FAULT_EXPLAIN[round.faultKey]} Tap a device to open its control and bring the chain back to healthy.`}
            </Text>
          </View>
        ) : null}
      </View>
    </RackUnit>
  );
}

const styles = StyleSheet.create({
  well: { gap: 12 },
  trayCol: { gap: 14 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trophyFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
    borderColor: colors.green,
    borderRadius: 10,
  },
  note: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  noteGood: { borderColor: 'rgba(55,224,95,.5)', backgroundColor: '#0c1a10' },
  noteFound: { borderColor: 'rgba(255,198,77,.45)', backgroundColor: '#17130a' },
  noteText: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  noteTextGood: { color: colors.green },
});

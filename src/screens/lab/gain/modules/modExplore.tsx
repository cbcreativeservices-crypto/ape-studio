/**
 * Gain Staging Lab — EXPLORE + CHALLENGE modules (owner spec + edit pass
 * 2026-08-07). The chain renders as REAL-WORLD-styled devices stacked top→down,
 * patched OUTPUT → INPUT with the red TRS cable (dashboard matching-icon
 * idiom).
 *
 *  6 · Multiple Gain Stages — real-gear honesty: X-Ray OFF shows each device's
 *      SIG/CLIP LEDs only (that's all hardware gives you); SIGNAL X-RAY reveals
 *      the meter inside every box at once. TEST YOURSELF — RANDOM scrambles the
 *      chain for the student to correct.
 *  7 · Free Practice — same rig, plus the SOURCE is yours (the one thing module
 *      6 never hands over) and nothing is graded.
 *  8 · Troubleshooting — real life: you DON'T get meters at every stage. Every
 *      device from source to bus loads COLLAPSED; only the Master Output is
 *      open — and it is clipping. Inspect ONE stage at a time to find the first
 *      stage that clips; find it and the whole chain unlocks for correction.
 *      All healthy ⇒ green border + floating TRY AGAIN.
 */
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { GlossaryText } from '../../../../features/glossary/glossaryLink';
import { DeviceCard, DeviceLeds, DeviceMeter, DragSlider, GainBtn } from '../gainViz';
import { chainIsHealthy, computeChain, meterFill, type ChainNode, type Stage } from '../gainEngine';
import { levelColor } from '../../../../features/tools/levelColor';
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

const rnd = (lo: number, hi: number) => Math.round(lo + Math.random() * (hi - lo));

/** Random settings across every stage — the TEST YOURSELF deck shuffle. */
function randomGains(): Gains {
  const g: Gains = {};
  for (const [k, [lo, hi]] of Object.entries(STAGE_RANGES)) g[k] = rnd(lo, hi);
  return g;
}

/** One device row: slider always (when allowed); LEDs when closed, meter when
 *  X-Rayed. Keeps every module speaking the same device language. */
function DeviceRow({
  stage,
  node,
  first,
  last,
  xray,
  slider,
}: {
  stage: { key: string; name: string; kind: Stage['kind']; gain: number; min: number; max: number };
  node: ChainNode;
  first?: boolean;
  last?: boolean;
  xray: boolean;
  slider?: (key: string, v: number) => void;
}) {
  return (
    <DeviceCard name={stage.name} kind={stage.kind} first={first} last={last} xray={xray}>
      {xray ? <DeviceMeter node={node} showLevel /> : <DeviceLeds node={node} />}
      {slider ? (
        <DragSlider
          label={stage.kind === 'fader' ? 'FADER' : stage.kind === 'output' ? 'OUTPUT' : stage.kind === 'preamp' ? 'INPUT GAIN' : 'GAIN'}
          value={(stage.gain - stage.min) / (stage.max - stage.min)}
          onChange={(t) => slider(stage.key, Math.round(stage.min + t * (stage.max - stage.min)))}
          readout={`${stage.gain >= 0 ? '+' : ''}${stage.gain} dB`}
          tint={levelColor(meterFill(node.level))}
        />
      ) : null}
    </DeviceCard>
  );
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
  return (
    <View style={styles.root}>
      <GlossaryText style={styles.body}>
        A real channel is a rack of separate devices — and from the outside, all a device shows you
        is a SIG light and a CLIP light. SIGNAL X-RAY sees through every box at once: the level at
        every point in the chain, gain staging as a system instead of isolated knobs.
      </GlossaryText>
      <View style={styles.btnRow}>
        <GainBtn label={xray ? 'SIGNAL X-RAY · ON' : 'SIGNAL X-RAY'} active={xray} onPress={() => setXray((v) => !v)} />
        <GainBtn label="TEST YOURSELF — RANDOM" onPress={() => setG(randomGains())} />
        <GainBtn label="RESET" onPress={() => setG(MULTI_START)} />
      </View>
      <View style={styles.chain}>
        <DeviceCard name="Source" kind="source" first>
          {xray ? <DeviceMeter node={nodes[0]} showLevel /> : <DeviceLeds node={nodes[0]} />}
          <Text style={styles.srcNote}>a quiet instrument/source — fixed</Text>
        </DeviceCard>
        {stages.map((st, i) => (
          <View key={st.key}>
            <DeviceRow stage={st} node={nodes[i + 1]} last={i === stages.length - 1} xray={xray} slider={setGain} />
          </View>
        ))}
      </View>
      <View style={[styles.note, healthy && styles.noteGood]}>
        <Text style={[styles.noteText, healthy && styles.noteTextGood]}>
          {healthy
            ? '✓ Balanced — a healthy operating level at every stage, no baked-in distortion.'
            : 'Not balanced yet — flip on the X-Ray, find the stage that is too hot or too weak, and fix it THERE.'}
        </Text>
      </View>
    </View>
  );
}

// ───────────────────────────────────────── 7 · Free Practice ────────────────
export function FreePlayModule(_p: GainModuleComponentProps) {
  const [source, setSource] = useState(-30);
  const [g, setG] = useState<Gains>({ pre: 20, eq: 0, comp: 0, fad: 0, bus: 0, out: 0 });
  const [xray, setXray] = useState(true);
  const stages = useMemo(() => fullChain(g), [g]);
  const nodes = computeChain(source, stages);
  const setGain = useCallback((k: string, v: number) => setG((prev) => ({ ...prev, [k]: v })), []);
  return (
    <View style={styles.root}>
      <GlossaryText style={styles.body}>
        Free practice — here even the SOURCE is yours, the one control module 6 never hands over.
        Feed the rig a whisper or a scream, make deliberate mistakes, recover cleanly. Nothing is
        graded; the chain just tells the truth.
      </GlossaryText>
      <View style={styles.btnRow}>
        <GainBtn label={xray ? 'SIGNAL X-RAY · ON' : 'SIGNAL X-RAY'} active={xray} onPress={() => setXray((v) => !v)} />
        <GainBtn label="TEST YOURSELF — RANDOM" onPress={() => { setSource(rnd(-40, -2)); setG(randomGains()); }} />
        <GainBtn label="RESET" onPress={() => { setSource(-30); setG({ pre: 20, eq: 0, comp: 0, fad: 0, bus: 0, out: 0 }); }} />
      </View>
      <View style={styles.chain}>
        <DeviceCard name="Source" kind="source" first>
          {xray ? <DeviceMeter node={nodes[0]} showLevel /> : <DeviceLeds node={nodes[0]} />}
          <DragSlider
            label="SOURCE LEVEL"
            value={(source + 40) / 38}
            onChange={(t) => setSource(Math.round(-40 + t * 38))}
            readout={`${source} dB`}
            tint={levelColor(meterFill(nodes[0].level))}
          />
        </DeviceCard>
        {stages.map((st, i) => (
          <View key={st.key}>
            <DeviceRow stage={st} node={nodes[i + 1]} last={i === stages.length - 1} xray={xray} slider={setGain} />
          </View>
        ))}
      </View>
    </View>
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
  const firstClipKey = nodes.slice(1).find((n) => n.stageClipped)?.key ?? null;
  const healthy = found && chainIsHealthy(nodes);
  const setGain = useCallback((k: string, v: number) => setG((prev) => ({ ...prev, [k]: v })), []);

  const newRound = useCallback(() => {
    const r = makeFault();
    setRound(r);
    setG(r.gains);
    setRevealed(null);
    setFound(false);
  }, []);

  // One device at a time — before AND after the fault is found (owner
  // 2026-08-10): finding it never opens the whole chain; you keep inspecting
  // single stages, and the slider rides along on whichever one is open.
  const inspect = (key: string) => {
    setRevealed(key);
    if (key === round.faultKey) setFound(true);
  };

  const revealedNode = revealed ? nodes.find((n) => n.key === revealed) : null;

  return (
    <View style={[styles.root, healthy && styles.solvedBorder]}>
      {healthy && (
        <View style={styles.tryAgainWrap}>
          <GainBtn label="TRY AGAIN — RANDOMIZE" good onPress={newRound} />
        </View>
      )}
      <GlossaryText style={styles.body}>
        Real life: you do NOT get a meter at every stage. The master output is clipping — that’s
        all you know. Inspect ONE device at a time and find the FIRST stage that clips (clipping
        cascades downstream, so work back upstream). Find it, then fix it the same way — one
        device at a time.
      </GlossaryText>
      <View style={styles.chain}>
        {/* Source — stays collapsed unless it's the one under inspection. */}
        <DeviceCard
          name="Source"
          kind="source"
          first
          xray={revealed === 'source'}
          onPress={() => inspect('source')}
        >
          {revealed === 'source' ? (
            <DeviceMeter node={nodes[0]} showLevel />
          ) : (
            <Text style={styles.inspectHint}>TAP TO INSPECT</Text>
          )}
        </DeviceCard>
        {stages.map((st, i) => {
          const node = nodes[i + 1];
          const isMaster = st.key === 'out';
          const open = isMaster || revealed === st.key;
          return (
            <View key={st.key}>
              <DeviceCard
                name={st.name}
                kind={st.kind}
                last={isMaster}
                xray={revealed === st.key}
                onPress={!isMaster || found ? () => inspect(st.key) : undefined}
              >
                {open ? <DeviceMeter node={node} showLevel /> : <Text style={styles.inspectHint}>TAP TO INSPECT</Text>}
                {found && revealed === st.key ? (
                  <DragSlider
                    label={st.kind === 'fader' ? 'FADER' : st.kind === 'output' ? 'OUTPUT' : st.kind === 'preamp' ? 'INPUT GAIN' : 'GAIN'}
                    value={(st.gain - st.min) / (st.max - st.min)}
                    onChange={(t) => setGain(st.key, Math.round(st.min + t * (st.max - st.min)))}
                    readout={`${st.gain >= 0 ? '+' : ''}${st.gain} dB`}
                    tint={levelColor(meterFill(node.level))}
                  />
                ) : null}
              </DeviceCard>
            </View>
          );
        })}
      </View>

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
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  // The all-healthy trophy frame (owner spec): green 3px border on the module —
  // sides + bottom only, the top stays open so the mic-active red line above
  // never gets covered.
  solvedBorder: {
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: colors.green,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingBottom: 8,
  },
  tryAgainWrap: { position: 'absolute', top: 2, alignSelf: 'center', zIndex: 10 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chain: { gap: 0 },
  srcNote: { fontFamily: fonts.barlowRegular, fontSize: 11.5, color: colors.textSub },
  inspectHint: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.textSub, textAlign: 'center', paddingVertical: 4 },
  note: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  noteGood: { borderColor: 'rgba(55,224,95,.5)', backgroundColor: '#0c1a10' },
  noteFound: { borderColor: 'rgba(255,198,77,.45)', backgroundColor: '#17130a' },
  noteText: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  noteTextGood: { color: colors.green },
});

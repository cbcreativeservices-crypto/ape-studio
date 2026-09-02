/**
 * Module 8 — Diagnose and Apply (spec Part 2 §9 + Part 3 §10–11): waveform
 * diagnosis, application selection, myth review, the final system challenge
 * scored across six dimensions, the final assessment drawn from the scored
 * pool, and the completion summary with links back into the modules.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../../theme/tokens';
import type { RootStackParamList } from '../../../../navigation/types';
import {
  sineCycle, amplify, simulateLinearClass, simulateClassD, evaluateRig, evaluateGainStructure, WAVE_N,
} from '../../../../features/amp/ampModel';
import {
  AMP_CHECKS, AMP_MODULES, MISCONCEPTIONS, WAVE_KINDS, APP_SCENARIOS, APP_CHOICES, MYTH_REVIEW_IDS,
  type WaveKind, type AppClassChoice,
} from '../../../../features/amp/ampContent';
import { loadAmpProgress, saveAmpProgress, type AmpProgressState } from '../../../../features/amp/ampProgress';
import { AmpRig } from '../AmpRig';
import { Body, Card, ControlSlider, FaultBanner, HonestyBadge, SectionTitle, SegRow } from '../kit';
import type { AmpModuleProps } from './index';

/** Mirrors the Scenarios screen's feedback tiers — the app has no global pass rule. */
export const FINAL_STRONG_PCT = 70;
const FINAL_ITEMS = 12;

/* ── waveform diagnosis renders (from the model) ────────────────────────── */

function waveFor(kind: WaveKind): { out: Float32Array; clipAt?: number; extra?: { data: Float32Array; color: string; dash?: string; label: string }[] } {
  const x = sineCycle(1);
  switch (kind) {
    case 'clean': return { out: amplify(x, 0.7, 1), clipAt: 1 };
    case 'voltage-clip': return { out: amplify(x, 1.5, 1), clipAt: 1 };
    case 'crossover': return { out: simulateLinearClass('B', 0.8, 0).out, clipAt: 1 };
    case 'current-limit': return { out: amplify(x, 1.5, 0.7), clipAt: 1, extra: [{ data: new Float32Array(WAVE_N).fill(0.7), color: colors.gold, dash: '2,3', label: 'current-limit ceiling' }] };
    case 'sag': return { out: amplify(x, 1.2, 0.6), clipAt: 0.6 };
    case 'classd-raw': return { out: simulateClassD(0.7).pwm };
    case 'classd-filtered': return { out: simulateClassD(0.7).recovered, clipAt: 1 };
    case 'protect': return { out: new Float32Array(WAVE_N), clipAt: 1 };
  }
}

const DIAG_ORDER: WaveKind[] = ['voltage-clip', 'classd-raw', 'crossover', 'protect', 'current-limit', 'clean', 'sag', 'classd-filtered'];

/* ── deterministic pick of final items ──────────────────────────────────── */

function pickFinal(seed: number) {
  const pool = AMP_CHECKS.filter((c) => c.scored);
  let s = seed >>> 0 || 1;
  const rnd = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, FINAL_ITEMS);
}

/* ── final system challenge ─────────────────────────────────────────────── */

type Dim = 'signal' | 'load' | 'connections' | 'thermal' | 'headroom' | 'mode';
const DIM_LABEL: Record<Dim, string> = {
  signal: 'Signal integrity', load: 'Load safety', connections: 'Connection correctness',
  thermal: 'Thermal condition', headroom: 'Headroom', mode: 'Operating mode',
};

export function Mod8Apply({ onFinalSubmitted }: AmpModuleProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const stateRef = useRef<AmpProgressState | null>(null);
  const [progress, setProgress] = useState<AmpProgressState | null>(null);

  useEffect(() => {
    let alive = true;
    void loadAmpProgress().then((s) => {
      if (!alive) return;
      stateRef.current = s;
      setProgress(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  /* waveform diagnosis */
  const [diagIdx, setDiagIdx] = useState(0);
  const [diagPick, setDiagPick] = useState<WaveKind | null>(null);
  const [diagScore, setDiagScore] = useState<{ right: number; total: number }>({ right: 0, total: 0 });
  const diagKind = DIAG_ORDER[diagIdx];
  const diagWave = useMemo(() => waveFor(diagKind), [diagKind]);

  /* application selection */
  const [appIdx, setAppIdx] = useState(0);
  const [appPick, setAppPick] = useState<AppClassChoice | null>(null);
  const app = APP_SCENARIOS[appIdx];

  /* myth review */
  const [mythIdx, setMythIdx] = useState(0);
  const [mythPick, setMythPick] = useState<'true' | 'false' | 'depends' | null>(null);
  const myth = MISCONCEPTIONS.find((m) => m.id === MYTH_REVIEW_IDS[mythIdx])!;

  /* final system challenge */
  const [chSource, setChSource] = useState(0.5);
  const [chMixer, setChMixer] = useState(0.5);
  const [chAmp, setChAmp] = useState(0.5);
  const [chMode, setChMode] = useState<'stereo' | 'bridge'>('stereo');
  const [chSupply, setChSupply] = useState<'healthy' | 'sagging'>('healthy');
  const [chLoad, setChLoad] = useState<8 | 4 | 2>(8);
  const [chVent, setChVent] = useState<'clear' | 'blocked'>('clear');
  const [chSubmitted, setChSubmitted] = useState(false);

  const challenge = useMemo(() => {
    const railLimit = chSupply === 'healthy' ? 1 : 0.6;
    const rig = evaluateRig({
      sourceLevel: chSource, mixerLevel: chMixer, ampInput: chAmp, railLimit, loadZ: chLoad,
      minLoadZ: 4, bridged: chMode === 'bridge', bridgeSupported: true,
      ventBlocked: chVent === 'blocked' ? 1 : 0, instrumentCable: false, shorted: false,
    });
    const gs = evaluateGainStructure(chSource, chMixer, chAmp, railLimit);
    const outLevel = Math.min(gs.levels.amp, 1) * railLimit; // fraction of full output
    const dims: Record<Dim, { ok: boolean; why: string }> = {
      signal: {
        ok: !rig.upstreamClips && !rig.outputClips,
        why: rig.upstreamClips ? 'A stage BEFORE the amplifier is clipping — fix the source/mixer levels.' : rig.outputClips ? 'The amplifier output is clipping at the rails — reduce the amplifier input or upstream level.' : 'No stage is clipping.',
      },
      load: {
        ok: (rig.effectiveLoadZ ?? 0) >= 4,
        why: (rig.effectiveLoadZ ?? 0) >= 4 ? `Effective load ${rig.effectiveLoadZ} Ω per channel meets the 4 Ω minimum.` : `Effective load ${rig.effectiveLoadZ} Ω per channel is below the 4 Ω minimum${chMode === 'bridge' ? ' (bridge mode halves it)' : ''}.`,
      },
      connections: {
        ok: chMode === 'stereo' || chLoad >= 8,
        why: chMode === 'bridge' && chLoad < 8 ? 'Bridged into less than the 8 Ω bridged minimum — not a supported connection.' : 'Wiring matches a supported configuration.',
      },
      thermal: {
        ok: rig.thermal < 0.75,
        why: rig.thermal < 0.75 ? 'Thermal state is comfortable.' : chVent === 'blocked' ? 'Blocked ventilation is driving the amplifier toward thermal limiting — clear the airflow.' : 'Sustained current into this load is heating the amplifier — raise the load impedance or lower the level.',
      },
      headroom: {
        ok: outLevel >= 0.5 && outLevel <= 0.85,
        why: outLevel < 0.5 ? `Output is only ${Math.round(outLevel * 100)}% of full — the target is 50–85% so peaks have room without wasting the amplifier.` : outLevel > 0.85 ? `Output at ${Math.round(outLevel * 100)}% leaves no headroom for peaks — back off toward 50–85%.` : `Output at ${Math.round(outLevel * 100)}% — healthy headroom.`,
      },
      mode: {
        ok: !(chMode === 'bridge' && chLoad < 8) && !(chSupply === 'sagging' && chMode === 'bridge'),
        why: chSupply === 'sagging' && chMode === 'bridge' ? 'Bridging a supply that is already sagging doubles the demand on it — run stereo until the supply condition is fixed.' : chMode === 'bridge' && chLoad < 8 ? 'Bridge mode is not appropriate for this load.' : 'Operating mode suits the load and supply.',
      },
    };
    const passed = (Object.keys(dims) as Dim[]).filter((d) => dims[d].ok).length;
    return { rig, gs, outLevel, dims, passed, railLimit };
  }, [chSource, chMixer, chAmp, chMode, chSupply, chLoad, chVent]);

  /* final assessment */
  const [finalSeed, setFinalSeed] = useState(() => Date.now());
  const finalItems = useMemo(() => pickFinal(finalSeed), [finalSeed]);
  const [finalAnswers, setFinalAnswers] = useState<Record<string, number>>({});
  const [finalSubmitted, setFinalSubmitted] = useState(false);
  const finalRight = finalItems.filter((c) => finalAnswers[c.id] === c.correct).length;
  const finalPct = Math.round((finalRight / finalItems.length) * 100);

  const submitFinal = useCallback(() => {
    setFinalSubmitted(true);
    const s = stateRef.current ?? { modules: {} };
    const result = {
      scorePct: finalPct,
      passed: finalPct >= FINAL_STRONG_PCT,
      at: Date.now(),
      dimensions: chSubmitted
        ? Object.fromEntries((Object.keys(challenge.dims) as Dim[]).map((d) => [d, challenge.dims[d].ok]))
        : undefined,
    };
    s.final = result;
    if (!s.bestFinal || result.scorePct > s.bestFinal.scorePct) s.bestFinal = result;
    stateRef.current = s;
    setProgress({ ...s });
    void saveAmpProgress(s);
    onFinalSubmitted?.();
  }, [finalPct, chSubmitted, challenge, onFinalSubmitted]);

  const retakeFinal = () => {
    setFinalSeed(Date.now());
    setFinalAnswers({});
    setFinalSubmitted(false);
  };

  /* completion summary data */
  const summary = useMemo(() => {
    const mods = AMP_MODULES.map((m) => ({ ...m, done: !!progress?.modules[m.id]?.done }));
    const mastered: string[] = [];
    const review: { q: string; moduleId: string }[] = [];
    for (const c of AMP_CHECKS) {
      const r = progress?.modules[c.moduleId]?.checks[c.id];
      if (r === true) mastered.push(c.q);
      else if (r === false) review.push({ q: c.q, moduleId: c.moduleId });
    }
    return { mods, mastered, review };
  }, [progress]);

  return (
    <View style={{ gap: 12 }}>
      <Body>Everything so far was practice. Now use it: read waveforms, choose amplifiers, kill myths, configure a system, and pass the check.</Body>

      {/* ── 1 waveform diagnosis ── */}
      <SectionTitle>1 · WAVEFORM DIAGNOSIS ({diagIdx + 1} of {DIAG_ORDER.length})</SectionTitle>
      <AmpRig
        input={sineCycle(1)}
        output={diagWave.out}
        clipAt={diagWave.clipAt}
        extraOut={diagPick ? diagWave.extra : undefined}
        outputTitle="OUTPUT — what is this amplifier doing?"
        supplyFlow={0.4}
        heat={0.3}
        a11ySummary="Diagnosis waveform. Identify the condition from the output shape relative to the rail lines."
      />
      <View style={{ gap: 6 }}>
        {WAVE_KINDS.map((k) => {
          const isAnswer = diagPick != null && k.key === diagKind;
          const isWrong = diagPick === k.key && k.key !== diagKind;
          return (
            <Pressable
              key={k.key}
              disabled={diagPick != null}
              onPress={() => {
                setDiagPick(k.key);
                setDiagScore((s) => ({ right: s.right + (k.key === diagKind ? 1 : 0), total: s.total + 1 }));
              }}
              style={[styles.opt, isAnswer && styles.optRight, isWrong && styles.optWrong]}
              accessibilityRole="button"
              accessibilityLabel={k.label}
            >
              <Text style={[styles.optText, isAnswer && { color: colors.green }, isWrong && { color: colors.red }]}>{k.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {diagPick ? (
        <Card tone="accent">
          <Text style={[styles.verdict, { color: diagPick === diagKind ? colors.green : colors.gold }]}>
            {diagPick === diagKind ? '✓ CORRECT' : `NOT QUITE — THIS IS ${WAVE_KINDS.find((k) => k.key === diagKind)!.label.toUpperCase()}`}
          </Text>
          <Body>Evidence: {WAVE_KINDS.find((k) => k.key === diagKind)!.evidence}</Body>
          {diagIdx < DIAG_ORDER.length - 1 ? (
            <Pressable style={styles.nextBtn} onPress={() => { setDiagIdx(diagIdx + 1); setDiagPick(null); }} accessibilityRole="button" accessibilityLabel="Next waveform">
              <Text style={styles.nextText}>NEXT WAVEFORM ›</Text>
            </Pressable>
          ) : (
            <Text style={styles.score}>Diagnosis round: {diagScore.right} of {diagScore.total} — {diagScore.right >= 6 ? 'you can read an amplifier.' : 'revisit Modules 3, 5 and 6 for the ones that fooled you.'}</Text>
          )}
        </Card>
      ) : null}

      {/* ── 2 application selection ── */}
      <SectionTitle>2 · CHOOSE AN AMPLIFIER ({appIdx + 1} of {APP_SCENARIOS.length})</SectionTitle>
      <Card>
        <Text style={styles.appTitle}>{app.title}</Text>
        <Body>{app.brief}</Body>
      </Card>
      <SegRow<AppClassChoice>
        options={APP_CHOICES.map((c) => ({ key: c.key, label: c.label }))}
        value={appPick ?? ('' as AppClassChoice)}
        onChange={(v) => setAppPick(v)}
      />
      {appPick ? (
        <Card tone="accent">
          <Text style={[styles.verdict, { color: app.accepted.includes(appPick) ? colors.green : colors.gold }]}>
            {app.accepted.includes(appPick) ? '✓ DEFENSIBLE CHOICE' : 'HARD TO DEFEND HERE'}
          </Text>
          <Body>{app.accepted.includes(appPick) ? app.reasoning[appPick] : app.rejected[appPick]}</Body>
          {app.accepted.length > 1 ? (
            <Text style={styles.note}>Also defensible: {app.accepted.filter((a) => a !== appPick).map((a) => APP_CHOICES.find((c) => c.key === a)!.label).join(', ') || '—'}.</Text>
          ) : null}
          {appIdx < APP_SCENARIOS.length - 1 ? (
            <Pressable style={styles.nextBtn} onPress={() => { setAppIdx(appIdx + 1); setAppPick(null); }} accessibilityRole="button" accessibilityLabel="Next scenario">
              <Text style={styles.nextText}>NEXT SCENARIO ›</Text>
            </Pressable>
          ) : null}
        </Card>
      ) : null}

      {/* ── 3 myth review ── */}
      <SectionTitle>3 · MYTH REVIEW ({mythIdx + 1} of {MYTH_REVIEW_IDS.length})</SectionTitle>
      <Card>
        <Text style={styles.mythStatement}>“{myth.statement}”</Text>
      </Card>
      <SegRow<'true' | 'false' | 'depends'>
        options={[
          { key: 'true', label: 'True' },
          { key: 'false', label: 'False' },
          { key: 'depends', label: 'It depends' },
        ]}
        value={mythPick ?? ('' as 'true')}
        onChange={setMythPick}
      />
      {mythPick ? (
        <Card tone="accent">
          <Text style={[styles.verdict, { color: mythPick === myth.verdict ? colors.green : colors.gold }]}>
            {mythPick === myth.verdict ? '✓ RIGHT' : `THE ANSWER IS: ${myth.verdict === 'false' ? 'FALSE' : 'IT DEPENDS'}`}
          </Text>
          <Body>{myth.correction} {myth.detail}</Body>
          {mythIdx < MYTH_REVIEW_IDS.length - 1 ? (
            <Pressable style={styles.nextBtn} onPress={() => { setMythIdx(mythIdx + 1); setMythPick(null); }} accessibilityRole="button" accessibilityLabel="Next statement">
              <Text style={styles.nextText}>NEXT STATEMENT ›</Text>
            </Pressable>
          ) : null}
        </Card>
      ) : null}

      {/* ── 4 final system challenge ── */}
      <SectionTitle>4 · FINAL SYSTEM CHALLENGE</SectionTitle>
      <Body>
        Target: a clean output between 50% and 85% of full, within load limits, no thermal or protection faults, correct
        connections. This amplifier is rated 4 Ω per channel in stereo and 8 Ω bridged.
      </Body>
      <ControlSlider label="Source level" value={chSource} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => { setChSource(v); setChSubmitted(false); }} />
      <ControlSlider label="Mixer output" value={chMixer} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => { setChMixer(v); setChSubmitted(false); }} />
      <ControlSlider label="Amplifier input setting" value={chAmp} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => { setChAmp(v); setChSubmitted(false); }} />
      <SegRow<'stereo' | 'bridge'> label="Operating mode" options={[{ key: 'stereo', label: 'Stereo' }, { key: 'bridge', label: 'Bridge' }]} value={chMode} onChange={(v) => { setChMode(v); setChSubmitted(false); }} />
      <SegRow<'healthy' | 'sagging'> label="Supply condition" options={[{ key: 'healthy', label: 'Healthy' }, { key: 'sagging', label: 'Sagging (weak mains)' }]} value={chSupply} onChange={(v) => { setChSupply(v); setChSubmitted(false); }} />
      <SegRow<8 | 4 | 2> label="Speaker load (nominal)" options={[{ key: 8, label: '8 Ω' }, { key: 4, label: '4 Ω' }, { key: 2, label: '2 Ω' }]} value={chLoad} onChange={(v) => { setChLoad(v); setChSubmitted(false); }} />
      <SegRow<'clear' | 'blocked'> label="Ventilation" options={[{ key: 'clear', label: 'Clear' }, { key: 'blocked', label: 'Blocked' }]} value={chVent} onChange={(v) => { setChVent(v); setChSubmitted(false); }} />
      <AmpRig
        input={sineCycle(Math.min(1, challenge.gs.levels.source))}
        output={amplify(sineCycle(1), Math.min(challenge.gs.levels.amp, 1.4) * challenge.railLimit, challenge.railLimit)}
        clipAt={challenge.railLimit}
        supplyFlow={challenge.rig.currentDemand}
        heat={challenge.rig.thermal}
        speaker
        faulted={challenge.rig.primary != null}
        a11ySummary={`System challenge. Output ${Math.round(challenge.outLevel * 100)} percent of full. ${challenge.rig.primary ? `Fault: ${challenge.rig.primary}.` : 'No fault.'} Relative heat ${Math.round(challenge.rig.thermal * 100)} percent.`}
      />
      <FaultBanner primary={challenge.rig.primary} secondary={challenge.rig.secondary} />
      <Pressable style={styles.checkBtn} onPress={() => setChSubmitted(true)} accessibilityRole="button" accessibilityLabel="Score my configuration">
        <Text style={styles.checkBtnText}>SCORE THIS CONFIGURATION</Text>
      </Pressable>
      {chSubmitted ? (
        <Card tone="accent">
          <Text style={[styles.verdict, { color: challenge.passed === 6 ? colors.green : colors.gold }]}>
            {challenge.passed} OF 6 DIMENSIONS PASS{challenge.passed === 6 ? ' — SYSTEM READY' : ''}
          </Text>
          {(Object.keys(challenge.dims) as Dim[]).map((d) => (
            <View key={d} style={styles.dimRow}>
              <Text style={[styles.dimMark, { color: challenge.dims[d].ok ? colors.green : colors.red }]}>{challenge.dims[d].ok ? '✓' : '✗'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.dimLabel}>{DIM_LABEL[d]}</Text>
                <Text style={styles.dimWhy}>{challenge.dims[d].why}</Text>
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      {/* ── 5 final assessment ── */}
      <SectionTitle>5 · FINAL ASSESSMENT ({FINAL_ITEMS} ITEMS)</SectionTitle>
      <HonestyBadge label="Drawn from a larger pool — a retake draws a different set" />
      {finalItems.map((c, i) => {
        const picked = finalAnswers[c.id];
        return (
          <Card key={c.id} tone="accent">
            <Text style={styles.qNum}>{i + 1}.</Text>
            <Text style={styles.q}>{c.q}</Text>
            <View style={{ gap: 6 }}>
              {c.options.map((o, oi) => {
                const isRight = finalSubmitted && oi === c.correct;
                const isWrongPick = finalSubmitted && picked === oi && oi !== c.correct;
                return (
                  <Pressable
                    key={oi}
                    disabled={finalSubmitted}
                    onPress={() => setFinalAnswers({ ...finalAnswers, [c.id]: oi })}
                    style={[styles.opt, picked === oi && !finalSubmitted && styles.optPicked, isRight && styles.optRight, isWrongPick && styles.optWrong]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: picked === oi }}
                    accessibilityLabel={o}
                  >
                    <Text style={[styles.optText, isRight && { color: colors.green }, isWrongPick && { color: colors.red }]}>{o}</Text>
                  </Pressable>
                );
              })}
            </View>
            {finalSubmitted ? <Text style={[styles.explain, { color: picked === c.correct ? colors.green : colors.gold }]}>{c.explain}</Text> : null}
          </Card>
        );
      })}
      {!finalSubmitted ? (
        <>
          <Pressable
            style={[styles.checkBtn, Object.keys(finalAnswers).length < finalItems.length && { opacity: 0.45 }]}
            disabled={Object.keys(finalAnswers).length < finalItems.length}
            onPress={submitFinal}
            accessibilityRole="button"
            accessibilityLabel={Object.keys(finalAnswers).length < finalItems.length ? 'Answer every item to submit' : 'Submit the final assessment'}
          >
            <Text style={styles.checkBtnText}>SUBMIT FINAL</Text>
          </Pressable>
          {Object.keys(finalAnswers).length < finalItems.length ? (
            <Text style={styles.note}>Answer all {finalItems.length} items to submit ({Object.keys(finalAnswers).length} done).</Text>
          ) : null}
        </>
      ) : (
        <Card>
          <Text style={[styles.bigScore, { color: finalPct >= FINAL_STRONG_PCT ? colors.green : colors.gold }]}>{finalPct}%</Text>
          <Body>
            {finalPct >= 90 ? 'Outstanding work.' : finalPct >= FINAL_STRONG_PCT ? 'Strong round.' : finalPct >= 50 ? 'Good progress.' : 'You’re building the picture.'}{' '}
            {finalRight} of {finalItems.length} correct.
          </Body>
          <Pressable style={styles.nextBtn} onPress={retakeFinal} accessibilityRole="button" accessibilityLabel="Retake with a different set">
            <Text style={styles.nextText}>REPEAT WITH A NEW SET ›</Text>
          </Pressable>
        </Card>
      )}

      {/* ── 6 completion summary ── */}
      <SectionTitle>6 · COMPLETION SUMMARY</SectionTitle>
      <Card>
        <Text style={styles.sumLabel}>MODULES</Text>
        {summary.mods.map((m) => (
          <Pressable key={m.id} onPress={() => navigation.navigate('AmpModule', { id: m.id })} style={styles.sumRow} accessibilityRole="button" accessibilityLabel={`Open module ${m.num}, ${m.title}`}>
            <Text style={[styles.sumMark, { color: m.done ? colors.green : colors.textMuted }]}>{m.done ? '✓' : '○'}</Text>
            <Text style={styles.sumText}>{m.num}. {m.title}</Text>
            <Text style={styles.sumLink}>open ›</Text>
          </Pressable>
        ))}
        <Text style={styles.sumLabel}>CONCEPTS MASTERED · {summary.mastered.length}</Text>
        {summary.mastered.slice(0, 6).map((q) => (
          <Text key={q} style={styles.sumSmall}>✓ {q}</Text>
        ))}
        {summary.mastered.length > 6 ? <Text style={styles.sumSmall}>…and {summary.mastered.length - 6} more</Text> : null}
        <Text style={styles.sumLabel}>NEEDS REVIEW · {summary.review.length}</Text>
        {summary.review.length === 0 ? <Text style={styles.sumSmall}>Nothing flagged — every module check you answered was right on the latest attempt.</Text> : null}
        {summary.review.map((r) => (
          <Pressable key={r.q} onPress={() => navigation.navigate('AmpModule', { id: r.moduleId as never })} accessibilityRole="button" accessibilityLabel={`Review in module: ${r.q}`}>
            <Text style={[styles.sumSmall, { color: colors.gold }]}>↺ {r.q}</Text>
          </Pressable>
        ))}
        <Text style={styles.sumLabel}>FINAL</Text>
        <Text style={styles.sumText}>
          {progress?.final ? `Latest ${Math.round(progress.final.scorePct)}% · best ${Math.round((progress.bestFinal ?? progress.final).scorePct)}%` : 'Not submitted yet'}
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  opt: { minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#101013' },
  optPicked: { borderColor: colors.cyan },
  optRight: { borderColor: colors.green, backgroundColor: '#0f2416' },
  optWrong: { borderColor: colors.red, backgroundColor: '#241012' },
  optText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13.5 },
  verdict: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5 },
  nextBtn: { marginTop: 6, minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.green, alignItems: 'center', justifyContent: 'center', backgroundColor: '#173021' },
  nextText: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.5 },
  score: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13.5, marginTop: 4 },
  appTitle: { color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 15 },
  note: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  mythStatement: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 15, fontStyle: 'italic' },
  checkBtn: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.green, backgroundColor: '#173021', alignItems: 'center', justifyContent: 'center' },
  checkBtnText: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.5 },
  dimRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  dimMark: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, width: 18 },
  dimLabel: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13.5 },
  dimWhy: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  qNum: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1 },
  q: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 19 },
  explain: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  bigScore: { fontFamily: fonts.oswaldSemiBold, fontSize: 34 },
  sumLabel: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 2, marginTop: 8 },
  sumRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 36 },
  sumMark: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, width: 16 },
  sumText: { flex: 1, color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13.5 },
  sumLink: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1 },
  sumSmall: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});

/**
 * CalcWorkflowRunScreen — the guided workflow RUNNER (Phase 3, owner spec
 * 2026-08-06). Steps through a workflow's calculators one at a time using the
 * SAME shared field/compute panel as the standalone calculators.
 *
 * VALUE PASSING — the heart of the feature:
 *  - A field can IMPORT a numeric result from any EARLIER step whose
 *    QuantityKind matches (distance↔distance, time↔time; power never fills
 *    voltage). Imports are LIVE: the field derives its value from the upstream
 *    result each render, converted into the field's selected unit — so editing
 *    an earlier step automatically recalculates every dependent later result
 *    (and the user is told how many changed). An old result is never shown as
 *    current.
 *  - Typing into an imported field converts it to a manual OVERRIDE (labeled,
 *    with ⟲ RESTORE to return to the import).
 *  - Every imported/overridden value carries a small source label.
 *
 * Progress: PREVIOUS · SAVE PROGRESS · CONTINUE / FINISH. Runs persist through
 * workflowStore (drafts survive closing the app); FINISH shows the summary
 * (inputs · results · warnings) with SAVE RESULT and SHARE AS TEXT. Share as
 * image arrives with the next native build (needs a view-capture module).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from '../../../features/keyboard/keyboardControllerSafe';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
import type { CalcFunction, FieldDef, OutputVal, Workspace } from './calcTypes';
import { fmt, unitsFor } from './calcUnits';
import { FieldRow, buildValues, defaultUnitIdx, formatOutput, runCompute, type ComputeResult } from './calcPanel';
import type { BoundInput, SavedRunSummary, ValueSource, Workflow, WorkflowRun } from './workflowModel';
import { WORKFLOW_LIMITS } from './workflowModel';
import { workflowStore } from './workflowStore';
import { WORKFLOW_TEMPLATES, resolveStep, validateWorkflow } from './workflowCatalog';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type StepComputed = {
  resolved: { ws: Workspace; fn: CalcFunction } | null;
  fields: FieldDef[];
  /** Effective raw text per field — imports derived LIVE from upstream. */
  effRaw: Record<string, string>;
  result: ComputeResult;
  complete: boolean;
};

/** Human line for a source label (spec: "Entered manually", "From Speed of
 *  Sound", "Manually overridden"…). */
function sourceLabel(src: ValueSource, stepName: (i: number) => string): string | null {
  switch (src.kind) {
    case 'manual':
      return null; // typing is the default — no badge noise
    case 'prior-step':
      return `From ${stepName(src.stepIndex)} (step ${src.stepIndex + 1})`;
    case 'project':
      return `From ${src.valueLabel}`;
    case 'fixed':
      return 'Fixed workflow value';
    case 'override':
      return 'Manually overridden';
  }
}

export function CalcWorkflowRunScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'CalcWorkflowRun'>>();
  const { entitlement } = useEntitlement();
  const limits = WORKFLOW_LIMITS[entitlement];

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [outUnit, setOutUnit] = useState<Record<string, number>>({});
  const [recalcNote, setRecalcNote] = useState<string | null>(null);
  const [resultSaved, setResultSaved] = useState(false);
  const runRef = useRef<WorkflowRun | null>(null);
  runRef.current = run;

  // ---- Load workflow (saved or template) + resume/create the run -----------
  useEffect(() => {
    let alive = true;
    void (async () => {
      const list = await workflowStore.listWorkflows();
      const found = list.find((w) => w.id === route.params.id) ?? WORKFLOW_TEMPLATES.find((w) => w.id === route.params.id);
      if (!found) {
        if (alive) {
          Alert.alert('Workflow unavailable', 'This workflow could not be loaded.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        }
        return;
      }
      const { workflow: valid, dropped } = validateWorkflow(found);
      if (!alive) return;
      setWorkflow(valid);
      if (dropped > 0) {
        Alert.alert('Workflow repaired', `${dropped} step${dropped === 1 ? '' : 's'} referenced a calculator that no longer exists and ${dropped === 1 ? 'was' : 'were'} skipped.`);
      }
      void workflowStore.touchRecent(valid.id);

      const blank = (): WorkflowRun => ({
        id: Crypto.randomUUID(),
        workflowId: valid.id,
        workflowName: valid.name,
        startedAt: new Date().toISOString(),
        stepIndex: 0,
        steps: valid.steps.map(() => ({ inputs: {}, stale: false })),
      });

      const runs = await workflowStore.listRuns();
      const draft = runs.find((r) => r.workflowId === valid.id && !r.completedAt);
      if (!alive) return;
      if (draft && limits.canResume && draft.steps.length === valid.steps.length) {
        Alert.alert('Resume previous progress?', 'An unfinished run of this workflow was found.', [
          { text: 'Start over', onPress: () => setRun(blank()) },
          { text: 'Resume', onPress: () => setRun(draft) },
        ]);
      } else {
        setRun(blank());
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params.id]);

  // Persist the draft whenever the screen loses focus (drafts survive closing
  // the app; the explicit SAVE PROGRESS button also calls this).
  const persist = useCallback(async (): Promise<boolean> => {
    const r = runRef.current;
    if (!r || !limits.canResume) return false;
    return workflowStore.saveRun(r);
  }, [limits.canResume]);
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', () => {
      void persist();
    });
    return unsub;
  }, [navigation, persist]);

  // ---- The compute chain: every step, in order, imports resolved LIVE ------
  const computed: StepComputed[] = useMemo(() => {
    if (!workflow || !run) return [];
    const out: StepComputed[] = [];
    workflow.steps.forEach((step, i) => {
      const resolved = resolveStep(step);
      const fields = resolved
        ? resolved.fn.inputs.map((k) => resolved.ws.fields.find((f) => f.key === k)).filter((f): f is FieldDef => !!f)
        : [];
      const bound = run.steps[i]?.inputs ?? {};
      const effRaw: Record<string, string> = {};
      const unitSel: Record<string, number> = {};
      for (const f of fields) {
        const b = bound[f.key];
        unitSel[f.key] = b?.unitIdx ?? defaultUnitIdx(f);
        if (b && b.source.kind === 'prior-step') {
          // LIVE import: derive from the upstream step's CURRENT output.
          const up = out[b.source.stepIndex];
          const o = up?.result.outputs.find(
            (x): x is Extract<OutputVal, { value: number }> => 'value' in x && x.label === (b.source as { outputLabel: string }).outputLabel,
          );
          if (o && o.quantity === f.quantity) {
            const units = unitsFor(f.quantity, f.unitIds);
            const u = units[unitSel[f.key] % units.length];
            effRaw[f.key] = fmt(u.fromBase(o.value), 6);
          } else {
            effRaw[f.key] = ''; // upstream incomplete/missing — honestly empty
          }
        } else {
          effRaw[f.key] = b?.raw ?? '';
        }
      }
      const values = resolved ? buildValues(fields, effRaw, unitSel) : null;
      const result = runCompute(resolved?.fn ?? null, values);
      out.push({ resolved, fields, effRaw, result, complete: values != null && !result.computeError });
    });
    return out;
  }, [workflow, run]);

  const n = workflow?.steps.length ?? 0;
  const idx = run ? Math.min(run.stepIndex, n) : 0; // idx === n → results view
  const cur = idx < n ? computed[idx] : null;
  const stepName = useCallback((i: number) => computed[i]?.resolved?.fn.name ?? `step ${i + 1}`, [computed]);

  // ---- Mutations ------------------------------------------------------------
  const setBound = (fieldKey: string, next: BoundInput | null) => {
    setRun((r) => {
      if (!r) return r;
      const steps = r.steps.map((s, i) => {
        if (i !== idx) return s;
        const inputs = { ...s.inputs };
        if (next == null) delete inputs[fieldKey];
        else inputs[fieldKey] = next;
        return { ...s, inputs };
      });
      return { ...r, steps };
    });
  };

  /** Count later steps whose live imports depend (directly or transitively) on
   *  step `from` — the honest "N later results were recalculated" figure. */
  const dependentsOf = (from: number): number => {
    if (!run) return 0;
    const depends = new Set<number>([from]);
    for (let i = from + 1; i < n; i++) {
      const inputs = run.steps[i]?.inputs ?? {};
      const hit = Object.values(inputs).some(
        (b) => b.source.kind === 'prior-step' && depends.has(b.source.stepIndex),
      );
      if (hit) depends.add(i);
    }
    return depends.size - 1;
  };

  const onEditField = (f: FieldDef, text: string) => {
    const existing = run?.steps[idx]?.inputs[f.key];
    if (existing && existing.source.kind === 'prior-step') {
      // Typing over an import = manual OVERRIDE (restorable).
      setBound(f.key, { raw: text, unitIdx: existing.unitIdx, source: { kind: 'override', replaced: existing.source } });
      return;
    }
    const unitIdx = existing?.unitIdx ?? defaultUnitIdx(f);
    const source: ValueSource = existing?.source.kind === 'override' ? existing.source : { kind: 'manual' };
    setBound(f.key, { raw: text, unitIdx, source });
    // Editing an earlier step's value updates dependent later results — say so.
    const deps = dependentsOf(idx);
    if (deps > 0) {
      const msg = `${f.name} changed — ${deps} later result${deps === 1 ? '' : 's'} recalculated.`;
      setRecalcNote(msg);
      AccessibilityInfo.announceForAccessibility?.(msg);
    }
  };

  const onCycleUnit = (f: FieldDef) => {
    const units = unitsFor(f.quantity, f.unitIds);
    const existing = run?.steps[idx]?.inputs[f.key];
    const nextIdx = ((existing?.unitIdx ?? defaultUnitIdx(f)) + 1) % units.length;
    setBound(f.key, {
      raw: existing?.raw ?? '',
      unitIdx: nextIdx,
      source: existing?.source ?? { kind: 'manual' },
    });
  };

  const importFrom = (f: FieldDef, fromStep: number, outputLabel: string) => {
    setBound(f.key, {
      raw: '',
      unitIdx: run?.steps[idx]?.inputs[f.key]?.unitIdx ?? defaultUnitIdx(f),
      source: { kind: 'prior-step', stepIndex: fromStep, outputLabel },
    });
    setRecalcNote(null);
  };

  const restoreImport = (f: FieldDef) => {
    const existing = run?.steps[idx]?.inputs[f.key];
    if (existing && existing.source.kind === 'override') {
      setBound(f.key, { raw: '', unitIdx: existing.unitIdx, source: existing.source.replaced });
    }
  };

  const goTo = (next: number) => {
    setRecalcNote(null);
    setRun((r) => (r ? { ...r, stepIndex: next } : r));
    void persist();
  };

  const onFinish = () => {
    setRun((r) => (r ? { ...r, stepIndex: n, completedAt: new Date().toISOString() } : r));
    void persist();
  };

  // ---- Summary (results view + share text) ----------------------------------
  const summary: SavedRunSummary | null = useMemo(() => {
    if (!workflow || !run || idx < n) return null;
    const inputs: SavedRunSummary['inputs'] = [];
    const results: SavedRunSummary['results'] = [];
    const warnings = new Set<string>();
    computed.forEach((c, i) => {
      if (!c.resolved) return;
      const step = `${i + 1}. ${c.resolved.fn.name}`;
      for (const f of c.fields) {
        const b = run.steps[i]?.inputs[f.key];
        const units = unitsFor(f.quantity, f.unitIds);
        const u = units[(b?.unitIdx ?? defaultUnitIdx(f)) % units.length];
        const raw = c.effRaw[f.key] ?? '';
        if (raw.trim() === '') {
          warnings.add(`Step ${i + 1} (${c.resolved.fn.name}): missing value for ${f.name}.`);
          continue;
        }
        const src = b ? sourceLabel(b.source, stepName) : null;
        inputs.push({ label: f.name, value: raw, unit: u.label, source: src ?? 'Entered manually', step });
        if (b?.source.kind === 'override') warnings.add(`${f.name} in step ${i + 1} was manually overridden.`);
      }
      if (c.result.computeError) warnings.add(`Step ${i + 1} (${c.resolved.fn.name}) could not compute — check its inputs.`);
      for (const o of c.result.outputs) {
        if ('value' in o) results.push({ label: o.label, value: formatOutput(o, 4, 0), unit: '', step });
        else results.push({ label: o.label, value: o.text, unit: '', step });
      }
      if (c.resolved.ws.warnings) warnings.add(c.resolved.ws.warnings);
    });
    warnings.add('These values are planning estimates from the stated formulas — verify final results with appropriate measurement tools.');
    return {
      id: run.id,
      workflowName: workflow.name,
      completedAt: run.completedAt ?? new Date().toISOString(),
      inputs,
      results,
      warnings: [...warnings],
    };
  }, [workflow, run, idx, n, computed, stepName]);

  const shareText = () => {
    if (!summary) return;
    const lines = [
      'PRO AUDIO TRAINING ACADEMY',
      'Calculator Workflow Results',
      `Workflow: ${summary.workflowName}`,
      `Date: ${new Date(summary.completedAt).toLocaleString()}`,
      '',
      'INPUTS',
      ...summary.inputs.map((i) => `${i.label}: ${i.value}${i.unit ? ' ' + i.unit : ''}${i.source !== 'Entered manually' ? `  (${i.source})` : ''}`),
      '',
      'RESULTS',
      ...summary.results.map((r) => `${r.label}: ${r.value}  [${r.step}]`),
      '',
      'NOTES',
      ...summary.warnings.map((w) => `- ${w}`),
    ];
    Share.share({ message: lines.join('\n') }).catch(() => {});
  };

  const saveResult = async () => {
    if (!summary) return;
    if (limits.savedResults === 0) {
      Alert.alert('Sign in to save results', 'Saving workflow results needs an account. You can still share this result now.');
      return;
    }
    const existing = await workflowStore.listResults();
    if (limits.savedResults != null && existing.length >= limits.savedResults && !existing.some((r) => r.id === summary.id)) {
      Alert.alert('Result limit reached', `Free accounts keep up to ${limits.savedResults} results. Academy membership removes the limit.`);
      return;
    }
    const ok = await workflowStore.saveResult(summary);
    if (ok) setResultSaved(true);
    else Alert.alert('Save failed', 'The result could not be saved. Try again.');
  };

  // ---- Render ---------------------------------------------------------------
  if (!workflow || !run) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.caption}>Loading workflow…</Text>
      </View>
    );
  }

  const step = idx < n ? workflow.steps[idx] : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{workflow.name.toUpperCase()}</Text>
          <Text style={styles.subtitle}>
            {idx < n ? `Step ${idx + 1} of ${n} · ${cur?.resolved?.fn.name ?? ''}` : 'Results'}
          </Text>
        </View>
      </View>

      {/* Vertical step list — the guided sequence at a glance. */}
      <View style={styles.stepStrip}>
        {workflow.steps.map((s, i) => (
          <Pressable
            key={i}
            style={[styles.stepPip, i === idx && styles.stepPipCurrent, computed[i]?.complete && styles.stepPipDone]}
            onPress={() => goTo(i)}
            accessibilityRole="button"
            accessibilityLabel={`Go to step ${i + 1}, ${stepName(i)}${computed[i]?.complete ? ', complete' : ', incomplete'}`}
          >
            <Text style={[styles.stepPipText, i === idx && styles.stepPipTextCurrent]}>{i + 1}</Text>
          </Pressable>
        ))}
        <Pressable
          style={[styles.stepPip, styles.stepPipWide, idx >= n && styles.stepPipCurrent]}
          onPress={onFinish}
          accessibilityRole="button"
          accessibilityLabel="Go to results"
        >
          <Text style={[styles.stepPipText, idx >= n && styles.stepPipTextCurrent]}>RESULTS</Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" bottomOffset={24}>
        {recalcNote ? <Text style={styles.recalcNote}>↻ {recalcNote}</Text> : null}

        {idx < n && cur ? (
          cur.resolved ? (
            <>
              {step?.note ? <Text style={styles.stepNote}>{step.note}</Text> : null}
              <Text style={styles.caption}>{cur.resolved.ws.name}</Text>

              <View style={styles.panel}>
                {cur.fields.map((f) => {
                  const b = run.steps[idx]?.inputs[f.key];
                  const src = b ? sourceLabel(b.source, stepName) : null;
                  // Compatible earlier results (matching quantity, numeric only).
                  const sources: { fromStep: number; label: string }[] = [];
                  if (f.quantity !== 'list') {
                    for (let k = 0; k < idx; k++) {
                      for (const o of computed[k]?.result.outputs ?? []) {
                        if ('value' in o && o.quantity === f.quantity) sources.push({ fromStep: k, label: o.label });
                      }
                    }
                  }
                  const isImport = b?.source.kind === 'prior-step';
                  const footer = (
                    <View style={styles.srcWrap}>
                      {src ? <Text style={[styles.srcLabel, b?.source.kind === 'override' && styles.srcLabelOverride]}>{src}</Text> : null}
                      {b?.source.kind === 'override' ? (
                        <Pressable style={styles.srcBtn} onPress={() => restoreImport(f)} accessibilityRole="button" accessibilityLabel={`Restore the imported value for ${f.name}`}>
                          <Text style={styles.srcBtnText}>⟲ RESTORE IMPORT</Text>
                        </Pressable>
                      ) : null}
                      {!isImport
                        ? sources.slice(0, 4).map((s) => (
                            <Pressable
                              key={`${s.fromStep}-${s.label}`}
                              style={styles.srcBtn}
                              onPress={() => importFrom(f, s.fromStep, s.label)}
                              accessibilityRole="button"
                              accessibilityLabel={`Use ${s.label} from step ${s.fromStep + 1}`}
                            >
                              <Text style={styles.srcBtnText}>⤵ USE {s.label.toUpperCase()} (STEP {s.fromStep + 1})</Text>
                            </Pressable>
                          ))
                        : null}
                    </View>
                  );
                  return (
                    <FieldRow
                      key={f.key}
                      field={f}
                      raw={cur.effRaw[f.key] ?? ''}
                      unitIdx={b?.unitIdx ?? defaultUnitIdx(f)}
                      onText={(t) => onEditField(f, t)}
                      onCycleUnit={() => onCycleUnit(f)}
                      footer={footer}
                    />
                  );
                })}

                {/* Answer — same destination-first grammar as the calculators. */}
                <View style={styles.resultPanel}>
                  <Text style={styles.resultEyebrow}>YOUR ANSWER — {cur.resolved.fn.name.toUpperCase()}</Text>
                  {!cur.complete ? (
                    cur.result.computeError ? (
                      <Text style={styles.warnText}>⚠ These values don’t produce a valid result — check for zeros or reversed inputs.</Text>
                    ) : (
                      <Text style={styles.caption}>Fill in the values above to calculate.</Text>
                    )
                  ) : (
                    cur.result.outputs.map((o) =>
                      'value' in o ? (
                        <Pressable key={o.label} style={styles.resultRow} onPress={() => setOutUnit((m) => ({ ...m, [`${idx}:${o.label}`]: (m[`${idx}:${o.label}`] ?? 0) + 1 }))}>
                          <Text style={styles.resultLabel}>{o.label}</Text>
                          <Text style={styles.resultValue}>{formatOutput(o, 4, outUnit[`${idx}:${o.label}`] ?? 0)}</Text>
                        </Pressable>
                      ) : (
                        <Text key={o.label} style={styles.resultNote}>
                          <Text style={styles.resultLabel}>{o.label}  </Text>
                          {o.text}
                        </Text>
                      ),
                    )
                  )}
                </View>
              </View>

              <Text style={styles.formula}>FORMULA   {cur.resolved.fn.formula}</Text>
            </>
          ) : (
            <Text style={styles.warnText}>⚠ This step’s calculator is unavailable and was skipped.</Text>
          )
        ) : summary ? (
          <>
            {/* RESULTS — header · inputs · results · notes/warnings · actions. */}
            <View style={styles.panel}>
              <Text style={styles.resultEyebrow}>{summary.workflowName.toUpperCase()}</Text>
              <Text style={styles.caption}>{new Date(summary.completedAt).toLocaleString()}</Text>
            </View>
            <Text style={styles.sectionTitle}>INPUTS</Text>
            {summary.inputs.map((i, k) => (
              <View key={k} style={styles.sumRow}>
                <Text style={styles.sumLabel}>{i.label}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sumValue}>{i.value}{i.unit ? ` ${i.unit}` : ''}</Text>
                  {i.source !== 'Entered manually' ? <Text style={styles.srcLabel}>{i.source}</Text> : null}
                </View>
              </View>
            ))}
            <Text style={styles.sectionTitle}>RESULTS</Text>
            {summary.results.map((r, k) => (
              <View key={k} style={styles.sumRow}>
                <Text style={styles.sumLabel}>{r.label}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sumResult}>{r.value}</Text>
                  <Text style={styles.srcLabel}>{r.step}</Text>
                </View>
              </View>
            ))}
            <Text style={styles.sectionTitle}>NOTES & WARNINGS</Text>
            {summary.warnings.map((w, k) => (
              <Text key={k} style={styles.sumWarn}>⚠ {w}</Text>
            ))}
            <View style={styles.actionRow}>
              <ActionBtn label={resultSaved ? 'SAVED ✓' : 'SAVE RESULT'} onPress={() => void saveResult()} />
              <ActionBtn label="SHARE AS TEXT" onPress={shareText} />
              <ActionBtn
                label="START AGAIN"
                onPress={() => {
                  setResultSaved(false);
                  setRun({
                    id: Crypto.randomUUID(),
                    workflowId: workflow.id,
                    workflowName: workflow.name,
                    startedAt: new Date().toISOString(),
                    stepIndex: 0,
                    steps: workflow.steps.map(() => ({ inputs: {}, stale: false })),
                  });
                }}
              />
            </View>
          </>
        ) : null}
      </KeyboardAwareScrollView>

      {/* Progress controls — pinned at the bottom. */}
      {idx < n ? (
        <View style={[styles.navBar, { paddingBottom: insets.bottom + 10 }]}>
          <NavBtn label="‹ PREVIOUS" disabled={idx === 0} onPress={() => goTo(idx - 1)} />
          {limits.canResume ? <NavBtn label="SAVE" onPress={() => void persist().then((ok) => ok && setRecalcNote('Progress saved.'))} /> : null}
          {idx < n - 1 ? (
            <NavBtn label="CONTINUE ›" primary onPress={() => goTo(idx + 1)} />
          ) : (
            <NavBtn label="FINISH ✓" primary onPress={onFinish} />
          )}
        </View>
      ) : null}
    </View>
  );
}

function NavBtn({ label, onPress, disabled, primary }: { label: string; onPress: () => void; disabled?: boolean; primary?: boolean }) {
  return (
    <Pressable
      style={[styles.navBtn, primary && styles.navBtnPrimary, disabled && styles.navBtnDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityLabel={label}
    >
      <Text style={[styles.navBtnText, primary && styles.navBtnTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

function ActionBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.actionBtn} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 6 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.2, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 24, gap: 10 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub, paddingHorizontal: 0 },

  stepStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingBottom: 8, alignItems: 'center' },
  stepPip: {
    minWidth: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  stepPipWide: { paddingHorizontal: 10 },
  stepPipCurrent: { borderColor: colors.amber, backgroundColor: '#1d180d' },
  stepPipDone: { borderColor: 'rgba(55,224,95,.55)' },
  stepPipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.textSub },
  stepPipTextCurrent: { color: colors.amber },

  stepNote: { fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  recalcNote: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: '#5bff85' },

  panel: { gap: 10, borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  srcWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  srcLabel: { fontFamily: fonts.barlowRegular, fontSize: 12, color: '#7fa8ff' },
  srcLabelOverride: { color: colors.amber },
  srcBtn: { alignSelf: 'flex-start', borderRadius: 7, borderWidth: 1, borderColor: '#245a34', backgroundColor: '#10241a', paddingHorizontal: 9, paddingVertical: 5 },
  srcBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 0.8, color: '#5bff85' },

  resultPanel: { borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,198,77,.4)', backgroundColor: '#17140c', padding: 10, gap: 6 },
  resultEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.amber },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  resultLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.9, color: colors.textSecondary, flexShrink: 1 },
  resultValue: { fontFamily: fonts.oswaldMedium, fontSize: 19, letterSpacing: 0.4, color: colors.amber },
  resultNote: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  warnText: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: '#ff9b8f' },
  formula: { fontFamily: fonts.mono, fontSize: 13, color: colors.textPrimary },

  sectionTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amber, marginTop: 6 },
  sumRow: { flexDirection: 'row', gap: 10, borderRadius: 8, borderWidth: 1, borderColor: '#1f1f24', backgroundColor: '#101014', padding: 10 },
  sumLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.8, color: colors.textSecondary, width: 120 },
  sumValue: { fontFamily: fonts.mono, fontSize: 14, color: colors.textPrimary },
  sumResult: { fontFamily: fonts.oswaldMedium, fontSize: 16, color: colors.amber },
  sumWarn: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.amber },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  actionBtn: { borderRadius: 8, borderWidth: 1, borderColor: '#3a3a3a', backgroundColor: '#161616', paddingHorizontal: 12, paddingVertical: 10 },
  actionText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSecondary },

  navBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1e1e22', backgroundColor: colors.screenBg },
  navBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    paddingVertical: 13,
    alignItems: 'center',
  },
  navBtnPrimary: { borderColor: 'rgba(55,224,95,.6)', backgroundColor: '#0c2012' },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.textSecondary },
  navBtnTextPrimary: { color: colors.green },
});

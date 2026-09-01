/**
 * CalcWorkspaceScreen — renders ONE calculator workspace (owner spec
 * 2026-07-29): function picker ("What are you trying to determine?"),
 * unit-aware inputs with feasibility warnings, live results with unit cycling
 * and significant-figure control, worked steps, formula, why-it-matters,
 * practical example, common mistakes, standards honesty block, glossary
 * terms, OS share sheet, and the Calculation Chain (SEND → / USE).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View, type ScrollView } from 'react-native';
import { confirmDialog, notify } from '../../../lib/confirm';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from '../../../features/keyboard/keyboardControllerSafe';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { ShareIcon } from '../../../components/ShareIcon';
import { AccuracyNote } from '../../../components/AccuracyNote';
import type { CalcValues, FieldDef, OutputVal, Workspace } from './calcTypes';
import { fmt, unitsFor } from './calcUnits';
import { getWorkspace } from './registry';
import { setChainValue, useChainValue } from './chainStore';
import { useCalcSectionOpen } from './calcPrefs';
// Shared field row + compute path (Phase 3, owner 2026-08-06) — the SAME
// implementation the workflow runner uses. One panel, no fork.
import { FieldRow, buildValues, defaultUnitIdx, formatOutput, runCompute } from './calcPanel';
import { buildReportFromCalc, reportToText } from './calcReport';
import { GlossaryTermPopup } from '../../../features/glossary/GlossaryTermPopup';
import { FormulaKeyPopup } from './FormulaKeyPopup';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
import { CALC_WEEKLY_LIMIT, consumeCalc, getCalcStatus, type CalcUsage } from '../../../features/lab/calcUsage';

const SIGS = [3, 4, 5] as const;

export function CalcWorkspaceScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CalcWorkspace'>>();
  const ws: Workspace | undefined = getWorkspace(route.params.id);
  const chain = useChainValue();

  // Glossary term popup (owner 2026-08-07) — tapping an "IN THE GLOSSARY" chip
  // shows the definition in-place; the Modal keeps this screen mounted, so the
  // user returns to their exact inputs/scroll on close.
  const [popupTerm, setPopupTerm] = useState<string | null>(null);

  // REVEAL THE INPUTS ON FOCUS. Calc rack (owner 2026-08-23): the ANSWER is now
  // a pinned display above the scroll, and the inputs are the FIRST content in
  // the well — so on focus we bring the well to its TOP (y 0), which lands the
  // "INPUTS" heading + the first field's LABEL just below the pinned stage,
  // never scrolled up UNDER it. (The old behavior scrolled to the input panel's
  // measured y, written for the pre-rack layout where a function picker sat
  // above the inputs; that over-scroll tucked the focused field + its label
  // behind the stage — the reported "covered input" bug.) On builds with the
  // native keyboard controller, KeyboardAwareScrollView still lifts a lower
  // field above the keyboard from here; on the plain-ScrollView fallback the
  // inputs at least start visible.
  const scrollRef = useRef<ScrollView | null>(null);
  const pinInputs = useCallback(() => {
    // Wait for the keyboard to start animating in, or the scroll gets clipped
    // to the pre-keyboard content height on Android.
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 60);
  }, []);
  const [fnIdx, setFnIdx] = useState(0);
  const [raw, setRaw] = useState<Record<string, string>>({});
  const [unitIdx, setUnitIdx] = useState<Record<string, number>>({});
  const [outUnit, setOutUnit] = useState<Record<string, number>>({});
  const [sig, setSig] = useState<number>(4);
  const [stepsOpen, setStepsOpen] = useState(false);
  // Per-formula key popup (owner 2026-08-13) — the purple key opens THIS formula's
  // own explanation, not the whole symbol key.
  const [keyOpen, setKeyOpen] = useState(false);
  // Persisted collapse state for the bottom explanation sections (owner 2026-08-05).
  const { open: secOpen, toggle: toggleSec } = useCalcSectionOpen();
  // Once the user starts entering values, hide the intro copy to free the upper
  // screen for inputs (owner 2026-08-05).
  const started = Object.values(raw).some((v) => (v ?? '').trim() !== '');

  // Derivations run UNCONDITIONALLY (hooks must never sit behind an early
  // return — owner 2026-08-05 stability fix; the previous order put a useMemo
  // after `if (!ws) return`, a Rules-of-Hooks violation that could wedge the
  // screen). The "not available" fallback renders below, after every hook.
  const fn = ws ? ws.functions[Math.min(fnIdx, ws.functions.length - 1)] : null;

  // Stable field list — recomputes only when the workspace/function changes, so
  // typing doesn't rebuild it (and the values memo below stays cheap).
  const fields = useMemo<FieldDef[]>(() => {
    if (!ws || !fn) return [];
    return fn.inputs.map((k) => ws.fields.find((f) => f.key === k)).filter((f): f is FieldDef => !!f);
  }, [ws, fn]);

  // Assemble base-unit values (shared path); null until every input parses.
  const values: CalcValues | null = useMemo(() => buildValues(fields, raw, unitIdx), [fields, raw, unitIdx]);

  // Compute once per (function, values) — NOT on every keystroke's re-render.
  const { outputs, steps, table, computeError } = useMemo(() => runCompute(fn, values), [fn, values]);

  // ---- Capped-calc gate (owner 2026-08-13): FREE/LAPSED accounts get 10
  // calculation OUTPUTS per rolling week (server-enforced via calc_consume).
  // Academy is unlimited; anonymous guests must sign in. The result is hidden
  // behind a CALCULATE button so there is one countable trigger per calculation.
  const { entitlement, commercialMode } = useEntitlement();
  // Caps only bite in commercial mode; institutional/dev mode grants full access.
  const capped = commercialMode && (entitlement === 'free' || entitlement === 'lapsed');
  const mustSignIn = commercialMode && entitlement === 'anonymous';
  const [usage, setUsage] = useState<CalcUsage | null>(null);
  const [consumedSig, setConsumedSig] = useState<string | null>(null);
  const [consuming, setConsuming] = useState(false);
  // Synchronous guard (QA night 2026-09-01): two same-tick taps both passed
  // the async state check and spent two weekly credits.
  const consumingRef = useRef(false);
  // Signature of the current calculation: function + entered values + input units.
  // Editing any input re-arms the CALCULATE button; re-tapping the SAME inputs
  // shows the already-revealed answer without spending another credit.
  const inputSig = useMemo(() => JSON.stringify({ f: fn?.key ?? '', raw, unitIdx }), [fn, raw, unitIdx]);
  // Load the current week's usage once for the "# / 10" counter.
  useEffect(() => {
    if (!capped) return;
    let alive = true;
    getCalcStatus().then((u) => {
      if (alive) setUsage(u);
    });
    return () => {
      alive = false;
    };
  }, [capped]);

  if (!ws || !fn) {
    return (
      <View style={styles.root}>
        <Text style={styles.body}>This calculator is not available.</Text>
      </View>
    );
  }

  // For capped users the answer is shown only after CALCULATE consumed a credit
  // for THIS exact input set; uncapped users always see the live answer.
  const resultUnlocked = !capped || consumedSig === inputSig;
  const counterText =
    capped && usage && !usage.unavailable ? `${usage.used} / ${usage.limit} free calculations this week` : null;

  const runCappedCalc = async () => {
    if (!values || consuming || consumingRef.current || consumedSig === inputSig) return;
    consumingRef.current = true;
    setConsuming(true);
    const u = await consumeCalc();
    consumingRef.current = false;
    setConsuming(false);
    setUsage(u);
    if (u.unavailable) {
      // Server unreachable / RPC not yet deployed → fail open: reveal, no count.
      setConsumedSig(inputSig);
      return;
    }
    const seePlans = () => (navigation as unknown as { navigate: (r: string) => void }).navigate('Paywall');
    if (!u.allowed) {
      confirmDialog(
        'Weekly limit reached',
        `You’ve used all ${u.limit} free calculations for this week. They reset one week after your first one. Academy membership removes the limit.`,
        'See membership',
        seePlans,
        { cancelText: 'Not now' },
      );
      return; // do NOT reveal
    }
    setConsumedSig(inputSig); // reveal this result
    // Halfway nudge scales with the allowance (owner set it to 5 on
    // 2026-09-01): a hardcoded "5" would have collided with the last-one
    // dialog. Fires strictly BEFORE the last credit.
    const halfway = Math.max(1, Math.ceil(u.limit / 2));
    if (u.used === halfway && u.used < u.limit) {
      notify(
        'Heads up — weekly limit',
        `That’s ${u.used} of ${u.limit} free calculations this week. After ${u.limit} you’ll wait for the weekly reset, or Academy membership removes the limit.`,
      );
    } else if (u.used >= u.limit) {
      confirmDialog(
        'Weekly limit reached',
        `That was your last free calculation this week (${u.limit} of ${u.limit}). It resets one week after your first one. Academy membership removes the limit.`,
        'See membership',
        seePlans,
        { cancelText: 'OK' },
      );
    }
  };

  const shareResult = () => {
    if (!values) return;
    const inputsForReport = fields.map((f) => {
      const units = unitsFor(f.quantity, f.unitIds);
      const u = units[(unitIdx[f.key] ?? defaultUnitIdx(f)) % Math.max(1, units.length)];
      return { label: f.name, value: raw[f.key] ?? '', unit: u?.label || undefined };
    });
    const resultsForReport = outputs.map((o) =>
      'value' in o
        ? { label: o.label, formattedValue: formatOut(o, 0), isText: false }
        : { label: o.label, formattedValue: o.text, isText: true },
    );
    const report = buildReportFromCalc({
      workspaceName: ws.name,
      functionName: fn.name,
      reportPrefix: ws.reportPrefix,
      primaryResultLabel: fn.primaryResultLabel,
      inputs: inputsForReport,
      results: resultsForReport,
      // fn.note + the workspace standards/honesty block; buildReportFromCalc
      // routes any safety/limitation wording into WARNINGS automatically.
      notes: [fn.note, ws.warnings].filter((x): x is string => !!x),
      createdAtISO: new Date().toISOString(),
    });
    Share.share({ message: reportToText(report) }).catch(() => {});
  };

  function formatOut(o: Extract<OutputVal, { value: number }>, extraIdx: number): string {
    return formatOutput(o, sig, (outUnit[o.label] ?? 0) + extraIdx);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>{ws.name.toUpperCase()}</Text>
          <Text style={styles.subtitle}>{ws.tagline}</Text>
        </View>
        <AccuracyNote compact variant="calc" />
      </View>

      {/* ── PINNED RESULT STAGE (calc rack, owner 2026-08-23) ────────────────
          The answer IS the instrument's display: a recessed graphite frame +
          smoked glass, pinned above the scroll so it never leaves the screen
          while you work the inputs below and updates live as you type. Bezel
          under the glass: function · sig-figs (tap-cycles) · formula key. */}
      <View style={styles.stageWrap}>
        <LinearGradient colors={['#5a5d64', '#3a3c42', '#232429']} locations={[0, 0.42, 1]} style={styles.stageOuter}>
          <View style={styles.stageGlass}>
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.01)', 'rgba(0,0,0,0.16)']}
              locations={[0, 0.42, 1]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.resultEyebrow}>
              {/* dB-family tokens keep their casing — "DBV FROM VOLTAGE" reads
                  as a typo in the lab that teaches the difference. */}
              YOUR ANSWER — {fn.name.toUpperCase().replace(/\bDBFS\b/g, 'dBFS').replace(/\bDBU\b/g, 'dBu').replace(/\bDBV\b/g, 'dBV').replace(/\bDB\b/g, 'dB')}
            </Text>
            {counterText ? <Text style={styles.usageCounter}>{counterText}</Text> : null}
            {mustSignIn ? (
              <View style={{ gap: 10 }}>
                <Text style={styles.resultPlaceholder}>Create a free account (or sign in) to run calculations.</Text>
                <Pressable
                  style={[styles.calcBtn, styles.signInBtn]}
                  onPress={() => (navigation as unknown as { navigate: (r: string) => void }).navigate('Auth')}
                  accessibilityRole="button"
                  accessibilityLabel="Sign in or create a free account to run calculations"
                >
                  <Text style={styles.calcBtnText}>SIGN IN / CREATE ACCOUNT</Text>
                </Pressable>
              </View>
            ) : !values ? (
              <Text style={styles.resultPlaceholder}>
                Your answer appears here. Fill in the values below to calculate.
              </Text>
            ) : capped && !resultUnlocked ? (
              <View style={{ gap: 8 }}>
                <Pressable
                  style={styles.calcBtn}
                  onPress={runCappedCalc}
                  disabled={consuming}
                  accessibilityRole="button"
                  accessibilityLabel="Calculate — uses one of your free weekly calculations"
                >
                  <Text style={styles.calcBtnText}>{consuming ? 'CALCULATING…' : 'CALCULATE'}</Text>
                </Pressable>
                <Text style={styles.resultPlaceholder}>
                  Tap CALCULATE to reveal the answer — this uses one of your {usage?.limit ?? CALC_WEEKLY_LIMIT} free calculations this week.
                </Text>
              </View>
            ) : computeError ? (
              <Text style={styles.warnText}>⚠ These values don’t produce a valid result — check for zeros or reversed inputs.</Text>
            ) : (
              <View style={{ gap: 8 }}>
                {outputs.map((o, oi) =>
                  'value' in o ? (
                    // Key by label+index (QA night 2026-09-01): duplicate
                    // labels (e.g. two NEAR-COINCIDENT notes) collided.
                    <View key={`${o.label}#${oi}`} style={styles.resultRow}>
                      <Text style={styles.resultLabel}>{o.label}</Text>
                      <View style={styles.resultRight}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`${o.label} ${formatOut(o, 0)} — tap to change the display unit`}
                          hitSlop={{ top: 8, bottom: 8 }}
                          onPress={() => setOutUnit((m) => ({ ...m, [o.label]: (m[o.label] ?? 0) + 1 }))}
                        >
                          <Text style={styles.resultValue}>{formatOut(o, 0)}</Text>
                        </Pressable>
                        {o.chainable !== false && Number.isFinite(o.value) ? (
                          <Pressable accessibilityRole="button"
                            hitSlop={{ top: 9, bottom: 9 }}
                            style={styles.sendBtn}
                            onPress={() => setChainValue({ label: o.label, quantity: o.quantity, baseValue: o.value, fromWorkspace: ws.name })}
                          >
                            <Text style={styles.sendText}>SEND →</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  ) : (
                    <Text key={`${o.label}#${oi}`} style={styles.resultNote}>
                      <Text style={styles.resultLabel}>{o.label}  </Text>
                      {o.text}
                    </Text>
                  ),
                )}
                {table ? (
                  <View style={styles.table}>
                    {table.title ? <Text style={styles.eyebrow}>{table.title}</Text> : null}
                    <View style={styles.tr}>
                      {table.cols.map((c) => (
                        <Text key={c} style={[styles.td, styles.th]}>{c}</Text>
                      ))}
                    </View>
                    {table.rows.map((r, i) => (
                      <View key={i} style={styles.tr}>
                        {r.map((c, j) => (
                          <Text key={j} style={styles.td}>{c}</Text>
                        ))}
                      </View>
                    ))}
                  </View>
                ) : null}
                {steps.length ? (
                  <Pressable accessibilityRole="button" onPress={() => setStepsOpen((s) => !s)}>
                    <Text style={styles.stepsToggle}>{stepsOpen ? '▾ WORKED STEPS' : '▸ WORKED STEPS'}</Text>
                  </Pressable>
                ) : null}
                {stepsOpen
                  ? steps.map((s, i) => (
                      <Text key={i} style={styles.stepText}>
                        {i + 1}. {s}
                      </Text>
                    ))
                  : null}
                <Pressable
                  style={styles.shareBtn}
                  onPress={shareResult}
                  accessibilityRole="button"
                  accessibilityLabel="Share or copy result"
                >
                  <ShareIcon size={16} color={colors.green} />
                  <Text style={styles.shareText}>SHARE / COPY RESULT</Text>
                </Pressable>
              </View>
            )}
          </View>
          {/* Bezel readouts under the glass. */}
          <View style={styles.bezel}>
            <View style={[styles.bcell, styles.bcellWide]}>
              <Text style={styles.bcellK}>FUNCTION</Text>
              <Text style={styles.bcellV} numberOfLines={1}>{fn.name}</Text>
            </View>
            <Pressable
              style={styles.bcell}
              onPress={() => setSig((s) => SIGS[(SIGS.indexOf(s as (typeof SIGS)[number]) + 1) % SIGS.length])}
              accessibilityRole="button"
              accessibilityLabel={`Significant figures: ${sig}. Tap to change.`}
            >
              <Text style={styles.bcellK}>SIG FIGS</Text>
              <Text style={styles.bcellV}>{sig} ▸</Text>
            </Pressable>
            <Pressable
              style={styles.bcell}
              onPress={() => setKeyOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Formula key — what this formula and its symbols mean"
            >
              <Text style={styles.bcellK}>FORMULA</Text>
              <Text style={styles.bcellVKey}>π KEY</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>

      <KeyboardAwareScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        {/* Intro copy — hidden once the user begins entering values (owner
            2026-08-05: frees the upper screen for inputs). */}
        {!started ? <Text style={styles.body}>{ws.intro}</Text> : null}

        {/* INPUTS — the controls, at the TOP of the well so they stay visible
            above the keyboard with the pinned answer above them (calc rack). */}
        <View style={styles.panel}>
          <Text style={styles.eyebrowTight}>INPUTS</Text>
          {fields.map((f) => {
            const units = unitsFor(f.quantity, f.unitIds);
            const canChain = chain && chain.quantity === f.quantity && f.quantity !== 'list';
            // Chain USE rides the shared FieldRow's footer slot. Only rendered
            // while a chain value is armed (footer stays undefined otherwise so
            // the row's memo keeps skipping re-renders).
            const footer = canChain ? (
              <Pressable
                style={styles.chainUse}
                onPress={() => {
                  const u = units[(unitIdx[f.key] ?? defaultUnitIdx(f)) % units.length];
                  setRaw((r) => ({ ...r, [f.key]: fmt(u.fromBase(chain.baseValue), 6) }));
                }}
                accessibilityRole="button"
                accessibilityLabel={`Use ${chain.label} from the calculation chain`}
              >
                <Text style={styles.chainUseText}>⤵ USE {chain.label}</Text>
              </Pressable>
            ) : undefined;
            return (
              <FieldRow
                key={f.key}
                field={f}
                raw={raw[f.key] ?? ''}
                unitIdx={unitIdx[f.key] ?? defaultUnitIdx(f)}
                onText={(t) => setRaw((r) => ({ ...r, [f.key]: t }))}
                onCycleUnit={() => setUnitIdx((u) => ({ ...u, [f.key]: ((u[f.key] ?? defaultUnitIdx(f)) + 1) % units.length }))}
                onFocus={pinInputs}
                footer={footer}
              />
            );
          })}
        </View>

        {/* Function picker — pick WHAT you're solving for. Below the inputs so
            the default function's inputs + the pinned answer lead (owner
            2026-08-23 calc rack); switching re-shapes the inputs above. */}
        <View style={styles.fnPicker}>
          <Text style={styles.eyebrowTight}>WHAT ARE YOU CALCULATING?</Text>
          <View style={styles.fnList}>
            {ws.functions.map((f, i) => {
              const sel = i === fnIdx;
              return (
                <Pressable
                  key={f.key}
                  style={[styles.fnOption, sel && styles.fnOptionSel]}
                  onPress={() => { setFnIdx(i); setStepsOpen(false); }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: sel }}
                  accessibilityLabel={f.name}
                >
                  <View style={[styles.fnRadio, sel && styles.fnRadioSel]}>
                    {sel ? <View style={styles.fnRadioDot} /> : null}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.fnOptName, sel && styles.fnOptNameSel]}>{f.name}</Text>
                    <Text style={styles.fnOptFormula} numberOfLines={1}>{f.formula}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.formulaRow}>
          <Text style={styles.formula}>FORMULA   {fn.formula}</Text>
          {/* Opens THIS formula's own key popup — formula, plain-English reading,
              what it calculates + its elements, and only the symbols it uses
              (owner 2026-08-13). The full symbol key is one tap further in. */}
          <Pressable
            onPress={() => setKeyOpen(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Formula key — what this formula and its symbols mean"
          >
            <Text style={styles.formulaKey}>π KEY</Text>
          </Pressable>
        </View>
        {fn.note ? <Text style={styles.caption}>{fn.note}</Text> : null}
        {chain ? (
          <Text style={styles.chainBanner}>
            CHAIN: {chain.label} from {chain.fromWorkspace} is ready — any matching input offers “USE”.
          </Text>
        ) : null}

        {/* Explanation sections — collapsible, default open, remembered per user
            (owner 2026-08-05). Tap a heading to collapse/expand. */}
        <Pressable onPress={() => toggleSec('why')} accessibilityRole="button" accessibilityState={{ expanded: secOpen.why }} accessibilityLabel="Why this matters">
          <Text style={styles.eyebrow}>{secOpen.why ? '▾' : '▸'} WHY THIS MATTERS</Text>
        </Pressable>
        {secOpen.why ? <Text style={styles.body}>{ws.whyItMatters}</Text> : null}

        <Pressable onPress={() => toggleSec('example')} accessibilityRole="button" accessibilityState={{ expanded: secOpen.example }} accessibilityLabel="Practical example">
          <Text style={styles.eyebrow}>{secOpen.example ? '▾' : '▸'} PRACTICAL EXAMPLE</Text>
        </Pressable>
        {secOpen.example ? <Text style={styles.body}>{ws.example}</Text> : null}

        <Pressable onPress={() => toggleSec('mistakes')} accessibilityRole="button" accessibilityState={{ expanded: secOpen.mistakes }} accessibilityLabel="Common mistakes">
          <Text style={styles.eyebrow}>{secOpen.mistakes ? '▾' : '▸'} COMMON MISTAKES</Text>
        </Pressable>
        {secOpen.mistakes
          ? ws.mistakes.map((m, i) => (
              <Text key={i} style={styles.mistake}>• {m}</Text>
            ))
          : null}
        {ws.warnings ? (
          <View style={styles.warnBlock}>
            <Text style={styles.warnBlockText}>{ws.warnings}</Text>
          </View>
        ) : null}
        <Text style={styles.eyebrow}>IN THE GLOSSARY</Text>
        {/* Tap a term → in-place definition popup (owner 2026-08-07). The old
            "OPEN THE GLOSSARY ›" link was removed (owner 2026-08-09): it switched
            to the Glossary TAB, which popped this calculator off the stack —
            stranding the user on the general glossary landing with no way back and
            no focused term. The popup shows the SPECIFIC term and keeps every
            input + the scroll position, so the user returns right here to keep
            going. */}
        <Text style={styles.caption}>Tap any term for its definition — it opens right here and keeps your inputs, so you return to your calculation.</Text>
        <View style={styles.chipRow}>
          {ws.glossary.map((g) => (
            <Pressable
              key={g}
              style={styles.glossChip}
              onPress={() => setPopupTerm(g)}
              accessibilityRole="button"
              accessibilityLabel={`Show the glossary definition of ${g}`}
            >
              <Text style={styles.glossText}>{g}</Text>
            </Pressable>
          ))}
        </View>
      </KeyboardAwareScrollView>
      <GlossaryTermPopup termName={popupTerm} onClose={() => setPopupTerm(null)} />
      <FormulaKeyPopup
        fn={keyOpen ? fn : null}
        fields={ws?.fields ?? []}
        workspaceName={ws?.name}
        onClose={() => setKeyOpen(false)}
        onOpenFullKey={() => {
          setKeyOpen(false);
          navigation.navigate('CalcSymbolsKey');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.2, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 34, gap: 10 },
  // ── Calc rack: pinned answer stage (owner 2026-08-23) ──────────────────
  stageWrap: { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 2 },
  stageOuter: { borderRadius: 13, borderWidth: 1, borderColor: '#000', padding: 2, gap: 2 },
  stageGlass: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#0b0d12',
    overflow: 'hidden',
    padding: 12,
    gap: 6,
  },
  bezel: { flexDirection: 'row', gap: 1, borderRadius: 8, overflow: 'hidden' },
  bcell: { flex: 1, backgroundColor: '#191a1f', paddingVertical: 5, paddingHorizontal: 8 },
  bcellWide: { flex: 1.7 },
  bcellK: { fontFamily: fonts.oswaldSemiBold, fontSize: 8.5, letterSpacing: 1, color: '#74767d' },
  bcellV: { fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 0.4, color: colors.amberLabel, marginTop: 1 },
  bcellVKey: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.6, color: colors.purple, marginTop: 1 },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.amber, marginTop: 6 },
  // Function-picker block — scrolls with the page so it clears the top once the
  // user starts filling and the inputs pin up (owner 2026-08-09).
  fnPicker: { gap: 6 },
  // Function-picker radio list (owner 2026-08-09) — clearer than wrapping chips.
  fnList: { gap: 6 },
  fnOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a30',
    backgroundColor: '#131316',
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  fnOptionSel: { borderColor: 'rgba(255,198,77,.7)', backgroundColor: '#1a1409' },
  fnRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#4a4a52',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fnRadioSel: { borderColor: colors.amber },
  fnRadioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.amber },
  fnOptName: { fontFamily: fonts.oswaldSemiBold, fontSize: 13.5, letterSpacing: 0.3, color: colors.textSecondary },
  fnOptNameSel: { color: colors.amber },
  fnOptFormula: { fontFamily: fonts.mono, fontSize: 11, lineHeight: 15, color: colors.textSub },
  eyebrowTight: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.amber },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  panel: { gap: 10, borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  fieldRow: { gap: 4 },
  fieldHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fieldName: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.textSecondary },
  helpGlyph: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.textSub },
  helpText: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  inputLine: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#45495a',
    backgroundColor: '#22242e',
    color: colors.textPrimary,
    fontFamily: fonts.barlowMedium,
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  unitChip: { borderRadius: 8, borderWidth: 1.5, borderColor: '#45495a', paddingHorizontal: 10, paddingVertical: 9, backgroundColor: '#2a2c36' },
  unitText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.6, color: colors.amber },
  chainUse: { alignSelf: 'flex-start', borderRadius: 7, borderWidth: 1, borderColor: '#245a34', backgroundColor: '#10241a', paddingHorizontal: 9, paddingVertical: 5 },
  chainUseText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 0.8, color: '#5bff85' },
  warnText: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: '#ff9b8f' },
  // Answer destination — pinned at the top of the panel (owner 2026-08-05).
  resultPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.4)',
    backgroundColor: '#17140c',
    padding: 10,
    gap: 6,
  },
  resultEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.amber },
  resultPlaceholder: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSub },
  // Free/lapsed weekly-cap UI (owner 2026-08-13): the "# / 10" counter + the
  // CALCULATE trigger that reveals (and counts) one result.
  usageCounter: { fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 0.4, color: colors.amberLabel, marginBottom: 6 },
  calcBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.amber,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  calcBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.2, color: '#141007' },
  // Green variant for the guest SIGN IN / CREATE ACCOUNT button (owner 2026-08-13).
  signInBtn: { backgroundColor: colors.green },
  sigBlock: { gap: 5 },
  sigRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sigLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.1, color: colors.amberLabel },
  sigHint: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16.5, color: colors.textSub },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  resultLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.9, color: colors.textSecondary, flexShrink: 1 },
  resultRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultValue: { fontFamily: fonts.oswaldMedium, fontSize: 19, letterSpacing: 0.4, color: colors.amber },
  resultNote: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  sendBtn: { borderRadius: 7, borderWidth: 1, borderColor: '#2c2c33', paddingHorizontal: 8, paddingVertical: 5, backgroundColor: '#17171c' },
  sendText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 0.8, color: colors.textSecondary },
  // Share / copy result — GREEN with the familiar share glyph (owner 2026-08-07).
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0d1a11',
    marginTop: 2,
  },
  shareText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 0.8, color: colors.green },
  stepsToggle: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.textSecondary },
  stepText: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  formulaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  formula: { fontFamily: fonts.mono, fontSize: 13, color: colors.textPrimary, flexShrink: 1 },
  formulaKey: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.8, color: colors.purple },
  chainBanner: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: '#5bff85' },
  mistake: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  warnBlock: { borderLeftWidth: 3, borderLeftColor: colors.amber, backgroundColor: '#151310', borderRadius: 6, padding: 10, marginTop: 4 },
  warnBlockText: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textSecondary },
  table: { gap: 3, marginTop: 4 },
  tr: { flexDirection: 'row', gap: 6 },
  th: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 10.5 },
  td: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: colors.textSecondary },
  // Tappable glossary chips (owner 2026-08-07) — normal glossary-link styling
  // (NOT purple; purple is reserved for calculator words inside the glossary).
  glossChip: { borderRadius: 7, borderWidth: 1, borderColor: '#2c2c33', paddingHorizontal: 9, paddingVertical: 5, backgroundColor: '#141419' },
  glossText: { fontFamily: fonts.barlowMedium, fontSize: 12, color: colors.textSecondary },
});

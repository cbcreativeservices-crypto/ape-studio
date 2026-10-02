/**
 * Chapter 7 — Advanced tuning and troubleshooting. LEARN (read: the
 * symptom table, tuning by ear, a pitch reference, a tuning device) →
 * PRACTICE (rack: "Diagnose the symptom" — five cases on the simulated
 * drum, several possible causes each, as a STRATEGY: LISTEN (strike, and
 * tap round the lugs where the case calls for it) → WHERE IS IT? (name the
 * area you suspect; the reply quotes the evidence on the bezel) → FIX (the
 * verdict quotes what changed; a wrong fix says what it left behind)) →
 * PRACTICE (decisions) → REVIEW.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { colors } from '../../../../theme/tokens';
import { faderParam, optionsParam } from '../DrumRack';
import { ChapterSteps } from '../steps';
import { Body, Card, CompareTable, DrumScenarioDeck, DrumStatus, Feedback, KeyButton, KeyTerms, Landing, Point, RecallCard, SectionTitle, WhyCard, YourRun } from '../kit';
import { DRUM_KEY_TERMS, TROUBLE_SCENARIOS } from '../drumContent';
import { DRUMS, SYMPTOMS, beatRateHz, lugTapHz, randomUnevenHead, spreadCents, strikePartials, symptomById, type HeadState, type StrikeParams, type SymptomId } from '../drumEngine';
import { DrumTopStage, TOP_ASPECT } from '../stagesDrum';
import { PART_ASPECT, PartialsStage, WAVE_ASPECT, WaveStage } from '../stagesSignal';
import { MODEL_BADGE, RENDER_BADGE, fmtS, headAtHz, headHz, soloPair, syncOf, useStrike, useTap, type ChapterProps } from './shared';

type Sim = {
  batter: HeadState;
  reso: HeadState;
  damping: number;
  strainer: number;
  drift: boolean;
  strikes: number;
  /** Lugs tapped this case. */
  tapped: number[];
  /** The first area named, and whether it was one of the case's causes. */
  hypothesis: string | null;
  hypothesisRight: boolean | null;
  fixed: string[];
  /** Readouts at the moment of the last fix, for the verdict's before → after. */
  before: { spread: number; beat: number; t60: number | null } | null;
};

function startCase(id: SymptomId): Sim {
  const c = symptomById(id);
  const spec = DRUMS[c.drum];
  const mid = (spec.usefulHz[0] + spec.usefulHz[1]) / 2;
  const even = (hz: number, which: 'batter' | 'reso') => headAtHz(c.drum, hz, which);
  const base = { strikes: 0, tapped: [] as number[], hypothesis: null, hypothesisRight: null, fixed: [] as string[], before: null };
  switch (id) {
    case 'warble':
      return { ...base, batter: { ...randomUnevenHead(even(mid, 'batter').tension, spec.lugs, 0x77a1, 0.5) }, reso: even(mid * 1.12, 'reso'), damping: 0, strainer: 0, drift: false };
    case 'choked':
      return { ...base, batter: even(mid, 'batter'), reso: even(mid, 'reso'), damping: 0.95, strainer: 0, drift: false };
    case 'ring':
      return { ...base, batter: even(mid * 1.15, 'batter'), reso: even(mid * 1.15, 'reso'), damping: 0, strainer: 0, drift: false };
    case 'snare':
      return { ...base, batter: even(mid, 'batter'), reso: even(mid * 1.3, 'reso'), damping: 0, strainer: 0.97, drift: false };
    default:
      return { ...base, batter: even(mid, 'batter'), reso: even(mid * 1.1, 'reso'), damping: 0, strainer: 0, drift: true };
  }
}

/** Is the symptom still present on this sim? Measured on the same numbers
 *  the bezel shows. */
function symptomPresent(id: SymptomId, sim: Sim): boolean {
  switch (id) {
    case 'warble':
      return spreadCents(sim.batter) > 12;
    case 'choked':
      return sim.damping > 0.5;
    case 'ring':
      return Math.abs(12 * Math.log2(headHz('rack', sim.reso, 'reso') / headHz('rack', sim.batter, 'batter'))) < 1.5 && sim.damping < 0.3;
    case 'snare':
      return sim.strainer > 0.75;
    default:
      return sim.drift || spreadCents(sim.batter) > 12;
  }
}

type StageView = 'drum' | 'wave' | 'partials';

export function Ch7Trouble({ onAnswered, onInteractive, answers }: ChapterProps) {
  const [caseId, setCaseId] = useState<SymptomId>('warble');
  const [sims, setSims] = useState<Record<SymptomId, Sim>>(() => Object.fromEntries(SYMPTOMS.map((s) => [s.id, startCase(s.id)])) as Record<SymptomId, Sim>);
  // Lands on the DRUM: the diagnose story starts at the drum, and the bound
  // fader (TAP LUG) moves the key on this view.
  const [view, setView] = useState<StageView>('drum');
  const [lug, setLug] = useState(0);
  const [cleared, setCleared] = useState<Set<SymptomId>>(() => new Set());
  const [lastFix, setLastFix] = useState<string | null>(null);
  const [whereNote, setWhereNote] = useState<string | null>(null);
  const reported = useRef(false);

  const c = symptomById(caseId);
  const spec = DRUMS[c.drum];
  const sim = sims[caseId];
  const params = useMemo<StrikeParams>(() => ({ drum: c.drum, batter: sim.batter, reso: sim.reso, resoPresent: true, damping: sim.damping, strike: c.strike, strikeR: 0.3, strikeTheta: 0, strainer: c.drum === 'snare' ? sim.strainer : undefined }), [c.drum, c.strike, sim]);
  const pb = useStrike(params);
  const tap = useTap(sim.batter, lug, c.drum);
  const parts = useMemo(() => strikePartials(params), [params]);
  const present = symptomPresent(caseId, sim);
  const spread = spreadCents(sim.batter);
  const beat = beatRateHz(sim.batter, spec.diameterIn, spec.sigmaBatter);
  const t60 = pb.rendered?.t60 ?? null;

  // The three stages of the strategy.
  const struck = sim.strikes > 0;
  const tappedEnough = sim.tapped.length >= c.tapsNeeded;
  const investigated = struck && tappedEnough;
  const hypothesised = sim.hypothesis != null;

  // Every strike counts as evidence (on the press); on the drift case the
  // strike also backs lug 2 out a little until the hardware is fixed — when
  // the strike ENDS (toddler pass 1). Moving the rod at the START changed the
  // head, so the strike's own key changed and useDrumPlayback stopped it a
  // frame in: every strike on the drift case was cut off. The next strike
  // hears the drift; the drawing shows it as soon as this one finishes.
  // `k` = strikes in this ring (toddler pass 2): ▶ STRIKE again while the
  // drum still rings restarts the clip without `playing` ever going false, so
  // a fast ▶ ▶ ▶ counted ONE strike and drifted ONE step — "every strike
  // moves one rod" was not true. Each restart now counts, and the drift for
  // all of them lands together when the ringing stops.
  const strikeRef = useRef<{ id: SymptomId; n: number; k: number } | null>(null);
  useEffect(() => {
    if (pb.playing) {
      const id = caseId;
      strikeRef.current = { id, n: sims[id].strikes + 1, k: 1 };
      setSims((all) => ({ ...all, [id]: { ...all[id], strikes: all[id].strikes + 1 } }));
      return;
    }
    const struckNow = strikeRef.current;
    strikeRef.current = null;
    if (!struckNow) return;
    setSims((all) => {
      const s = all[struckNow.id];
      // A case reset (or a hardware fix) since the strike: nothing drifts.
      if (!s.drift || s.strikes !== struckNow.n) return all;
      return { ...all, [struckNow.id]: { ...s, batter: { ...s.batter, turns: s.batter.turns.map((t, i) => (i === 1 ? t - 0.12 * struckNow.k : t)) } } };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pb.playing]);
  const solo = soloPair(pb, tap);
  const strikeNow = () => {
    const ring = strikeRef.current;
    if (pb.playing && ring && ring.id === caseId) {
      // A restart of the ringing strike: one more strike on this case.
      strikeRef.current = { id: ring.id, n: ring.n + 1, k: ring.k + 1 };
      setSims((all) => ({ ...all, [ring.id]: { ...all[ring.id], strikes: all[ring.id].strikes + 1 } }));
    }
    solo.strike();
  };
  // A lug counts as tapped when its tap SOUNDED (toddler pass 3): counted on
  // the press, a refused audio gate still met "tap N lugs" and unlocked
  // WHERE? on evidence the learner never heard.
  const tapNow = () => {
    const id = caseId;
    const at = lug;
    void solo.tap().then((ok) => {
      if (!ok) return;
      setSims((all) => {
        const s = all[id];
        return s.tapped.includes(at) ? all : { ...all, [id]: { ...s, tapped: [...s.tapped, at] } };
      });
    });
  };

  useEffect(() => {
    if (!present && !cleared.has(caseId) && sim.fixed.length > 0) setCleared((x) => new Set([...x, caseId]));
  }, [present, caseId, cleared, sim.fixed.length]);
  useEffect(() => {
    if (cleared.size >= SYMPTOMS.length && !reported.current) {
      reported.current = true;
      onInteractive();
    }
  }, [cleared, onInteractive]);

  /** The evidence on the bezel, in words — what the reply to WHERE quotes. */
  const evidence = (): string => {
    switch (caseId) {
      case 'warble':
        return `SPREAD reads ${spread.toFixed(0)} ¢ and BEAT ${beat.toFixed(1)} Hz — the lug taps disagree with each other.`;
      case 'choked':
        return `SUSTAIN reads ${fmtS(t60)} on a floor tom that should ring past a second, and SPREAD is ${spread.toFixed(0)} ¢ — the lugs agree.`;
      case 'ring':
        return `SUSTAIN reads ${fmtS(t60)} with the two heads within ${Math.abs(12 * Math.log2(headHz('rack', sim.reso, 'reso') / headHz('rack', sim.batter, 'batter'))).toFixed(1)} st of each other, and SPREAD is ${spread.toFixed(0)} ¢ — the lugs agree.`;
      case 'snare':
        return `A soft stroke (${Math.round(c.strike * 100)} %) gives no wire sound; the strainer sits at ${Math.round(sim.strainer * 100)} % and the heads are even.`;
      default:
        return `SPREAD was 0 ¢ and now reads ${spread.toFixed(0)} ¢ after ${sim.strikes} strike${sim.strikes === 1 ? '' : 's'} — lug 2 drops a little every time the drum is played.`;
    }
  };
  const nameArea = (area: string) => {
    const right = c.cause.includes(area);
    setSims((all) => {
      const s = all[caseId];
      return s.hypothesis != null ? all : { ...all, [caseId]: { ...s, hypothesis: area, hypothesisRight: right } };
    });
    setWhereNote(right
      ? `${area} — yes. ${evidence()} The FIX tray is open.`
      : `${area} — the evidence points elsewhere. ${evidence()} ${hintFor(caseId)} The FIX tray is open; choose with that in mind.`);
  };
  const hintFor = (id: SymptomId): string => {
    switch (id) {
      case 'warble': return 'A beat between lug taps is lug-to-lug, not the resonant head.';
      case 'choked': return 'Even lugs and a dead note point at what is INSIDE the drum.';
      case 'ring': return 'Even lugs and a long ring point at how the two heads sit against each other.';
      case 'snare': return 'Even heads and silent wires on a soft stroke point at the wire adjustment.';
      default: return 'A head that was even and drifts on one lug is a rod that will not stay put.';
    }
  };

  const applyFix = (fixId: string) => {
    setLastFix(fixId);
    setSims((all) => {
      const s: Sim = { ...all[caseId], fixed: [...all[caseId].fixed, fixId], before: { spread: spreadCents(all[caseId].batter), beat: beatRateHz(all[caseId].batter, spec.diameterIn, spec.sigmaBatter), t60 } };
      switch (fixId) {
        case 'even':
          s.batter = { ...s.batter, turns: s.batter.turns.map(() => 0) };
          break;
        case 'damp':
          s.damping = Math.min(1, s.damping + 0.5);
          break;
        case 'undamp':
          s.damping = 0;
          break;
        case 'reso':
          s.reso = headAtHz(c.drum, headHz(c.drum, s.batter, 'batter') * Math.pow(2, 4 / 12), 'reso');
          break;
        case 'tighten':
          // A quarter turn all round: +150 N/m on every rod (TURN_NPM / 4).
          // "Tighten both heads" (ring) keeps the relationship; "tighten the
          // batter" (choked, snare) moves only the batter.
          s.batter = { ...s.batter, tension: s.batter.tension + 150 };
          if (caseId === 'ring') s.reso = { ...s.reso, tension: s.reso.tension + 150 };
          break;
        case 'strainer':
          s.strainer = 0.4;
          break;
        case 'wires':
          break;
        case 'hardware':
          s.drift = false;
          s.batter = { ...s.batter, turns: s.batter.turns.map(() => 0) };
          break;
        default:
          break;
      }
      return { ...all, [caseId]: s };
    });
  };
  const resetCase = () => {
    setSims((all) => ({ ...all, [caseId]: startCase(caseId) }));
    setLastFix(null);
    setWhereNote(null);
  };
  const fixInfo = lastFix ? c.fixes.find((f) => f.id === lastFix) : null;
  /** The verdict after a fix: what changed, in the bezel's own numbers. */
  const fixVerdict = (): string => {
    if (!fixInfo) return '';
    const b = sim.before;
    const changed: string[] = [];
    if (b) {
      if (Math.abs(b.spread - spread) >= 1) changed.push(`SPREAD ${b.spread.toFixed(0)} → ${spread.toFixed(0)} ¢`);
      if (Math.abs(b.beat - beat) >= 0.05) changed.push(b.beat >= 0.05 && beat < 0.05 ? 'the beat is gone' : `BEAT ${b.beat.toFixed(1)} → ${beat.toFixed(1)} Hz`);
      if (b.t60 != null && t60 != null && Math.abs(b.t60 - t60) >= 0.03) changed.push(`SUSTAIN ${fmtS(b.t60)} → ${fmtS(t60)}`);
    }
    const what = changed.length ? ` ${changed.join(', ')}.` : ' Nothing on the bezel moved.';
    if (!present) return `${fixInfo.label}: ${fixInfo.why}${what} Strike it — the symptom has cleared.`;
    const side = lastFix === 'tighten' ? ' The drum is now a quarter turn higher than you left it — ↺ RESET CASE puts it back.' : lastFix === 'damp' ? ' The gel is still on the drum — ↺ RESET CASE takes it off.' : lastFix === 'reso' ? ' The resonant head is now 4 st above the batter — ↺ RESET CASE puts it back.' : '';
    return `${fixInfo.label}: ${fixInfo.why}${what} FAULT still reads STILL.${side}`;
  };
  const firstRight = SYMPTOMS.filter((s) => sims[s.id].hypothesisRight === true).length;
  const hypothesised_n = SYMPTOMS.filter((s) => sims[s.id].hypothesis != null).length;
  const reached = TROUBLE_SCENARIOS.filter((s) => s.id in answers).length;
  const rightFirst = TROUBLE_SCENARIOS.filter((s) => answers[s.id] === true).length;

  // The LAST dock key is the FIX slot, and it changes with the stage of the
  // strategy: locked ("STRIKE 1ST" / "TAP n MORE") → WHERE? → FIX. Short
  // labels: a dock key has ~10 characters of room.
  const tapsLeft = c.tapsNeeded - sim.tapped.length;
  const stageKey = !investigated
    ? { kind: 'action' as const, id: 'locked', label: !struck ? 'HIT 1ST' : `${tapsLeft} TO TAP`, onPress: () => setWhereNote(!struck ? 'Strike first. Then say where the fault is, then fix it.' : `Tap round the lugs first — ${sim.tapped.length} of ${c.tapsNeeded} needed. Listen for the odd ones out.`), tint: colors.textMuted }
    : !hypothesised
      ? optionsParam({ id: 'where', label: 'WHERE?', value: '', options: c.areas.map((a) => ({ key: a, label: a, short: a.split(' ')[0].toUpperCase() })), onChange: nameArea, sticky: false })
      : optionsParam({ id: 'fix', label: 'FIX', value: lastFix ?? '', options: c.fixes.map((f) => ({ key: f.id, label: f.label, short: f.id.toUpperCase() })), onChange: applyFix, sticky: false });
  const VIEW_ORDER: StageView[] = ['drum', 'wave', 'partials'];
  const cycleView = () => setView((v) => VIEW_ORDER[(VIEW_ORDER.indexOf(v) + 1) % VIEW_ORDER.length]);

  return (
    <ChapterSteps
      steps={[
        {
          key: 'symptoms', title: 'Diagnosis by symptom', kind: 'LEARN', layout: 'read',
          body: (
            <>
              <SectionTitle>SYMPTOM → WHERE TO LOOK</SectionTitle>
              <CompareTable left="Symptom" right="Possible areas to investigate" rows={SYMPTOMS.map((s) => [s.title, s.areas.join(' · ')] as [string, string])} />
              <Body>Every row has more than one possible cause. The strategy is always the same: LISTEN (strike, tap round the lugs, look at the hardware) → say WHERE you think it is → then FIX, and strike again. The next step puts five of these on the simulated drum in exactly that order.</Body>
              <SectionTitle>BY EAR, BY REFERENCE, BY DEVICE</SectionTitle>
              <Card>
                <Point title="Tuning by ear">The method of Chapter 3: lug taps for evenness, the stroke from the seat for the sound. It is the skill everything else supports.</Point>
                <Point title="Using a pitch reference">A keyboard, a tuner app, another drum: useful for repeating a setup or placing the toms in a key for a song. Optional — a drum's overtones are not in simple ratios, so the "note" is always a judgement.</Point>
                <Point title="Using a drum-tuning device">Tension-reading and pitch-reading devices help CONSISTENCY: the same numbers at every lug, the same setup next week. They do not hear the head relationship, the room or the music. The final judgement still comes from listening.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'diagnose', title: 'Diagnose the symptom', kind: 'PRACTICE', layout: 'rack',
          rack: {
            render: (w, h) =>
              view === 'drum' ? (
                <DrumTopStage width={w} height={h} drum={c.drum} head={sim.batter} selected={lug} tap={lug} title={c.title} tapSync={syncOf(tap)} strikeSync={syncOf(pb)} />
              ) : view === 'wave' ? (
                <WaveStage width={w} height={h} ov={pb.rendered?.overview ?? null} envDb={pb.rendered?.envDb} t60={pb.rendered?.t60} seconds={spec.seconds} label={`${c.title}`} progress={pb.progress} playing={pb.playing} idle="making the sound…" />
              ) : (
                <PartialsStage width={w} height={h} partials={parts} fb={headHz(c.drum, sim.batter, 'batter')} label={c.title} progress={pb.progress} playing={pb.playing} seconds={spec.seconds} />
              ),
            aspect: view === 'drum' ? TOP_ASPECT : view === 'wave' ? WAVE_ASPECT : PART_ASPECT,
            size: 'L',
            badge: view === 'wave' ? RENDER_BADGE : MODEL_BADGE,
            bezel: [
              // VIEW is a tap-to-cycle bezel cell (the PK-HOLD tap-cell
              // pattern) so the dock keeps five keys: DRUM → WAVE → PARTIALS.
              { k: 'VIEW', v: view === 'drum' ? 'DRUM' : view === 'wave' ? 'WAVE' : 'PARTS', tint: colors.cyan, onPress: cycleView },
              { k: 'SPREAD', v: `${spread.toFixed(0)} ¢`, tint: spread <= 12 ? colors.green : colors.red },
              { k: 'BEAT', v: beat < 0.05 ? 'none' : `${beat.toFixed(1)} Hz`, tint: beat < 0.05 ? colors.green : colors.amber },
              { k: 'SUSTAIN', v: fmtS(t60), tint: colors.green },
              // Short values on purpose: a bezel value is never ellipsized.
              // Five cells: a sixth (CLEARED) cropped BEAT and SUSTAIN down to
              // bare numbers on a 390-wide phone; the count lives in the well.
              { k: 'FAULT', v: present ? 'STILL' : 'GONE', tint: present ? colors.red : colors.green },
            ],
            params: [
              optionsParam({ id: 'case', label: 'CASE', value: caseId, options: SYMPTOMS.map((s) => ({ key: s.id, label: `${s.title} · ${DRUMS[s.drum].name}`, short: s.id.toUpperCase(), blurb: s.symptom })), onChange: (id) => { setCaseId(id); setLastFix(null); setLug(0); setWhereNote(null); }, sticky: false }),
              faderParam({ id: 'lug', label: 'LUG', value: lug, min: 0, max: spec.lugs - 1, step: 1, format: (v) => `tap at lug ${Math.round(v) + 1} · ${lugTapHz(sim.batter, Math.round(v), spec.diameterIn, spec.sigmaBatter).toFixed(0)} Hz${sim.tapped.includes(Math.round(v)) ? ' · tapped' : ''}`, formatShort: (v) => `#${Math.round(v) + 1}`, onChange: (v) => setLug(Math.round(v)) }),
              { kind: 'action', id: 'strike', label: caseId === 'snare' ? '▶ SOFTLY' : '▶ STRIKE', onPress: strikeNow },
              { kind: 'action', id: 'tap', label: '▶ TAP', onPress: tapNow },
              stageKey,
            ],
            initialParam: 'lug',
            onTap: solo.toggle,
          },
          well: (
            <>
              <Landing looking={`a ${spec.name} with a fault; the readouts are your evidence (tap VIEW on the bezel for the waveform or the partials).`} prompt={!investigated ? `▶ STRIKE${c.tapsNeeded ? ' and ▶ TAP round the lugs' : ''} first, then say where the fault is.` : !hypothesised ? 'Now say WHERE the fault is — then the FIX tray opens.' : 'Pick a FIX, then strike again and read what changed.'} />
              <DrumStatus playing={pb.playing || tap.playing} pending={pb.pending || tap.pending} rendering={pb.status === 'rendering' || tap.status === 'rendering'} idle={`stopped · ${!struck ? 'press ▶ STRIKE to begin' : !tappedEnough ? `▶ TAP ${c.tapsNeeded - sim.tapped.length} more lug${c.tapsNeeded - sim.tapped.length === 1 ? '' : 's'}` : !hypothesised ? 'open WHERE? and name the area' : 'pick a FIX and strike again'}`} label={tap.playing || tap.pending ? `the tap at lug ${lug + 1}` : 'the strike'} />
              <Feedback tone="warn">{`${c.title}: ${c.symptom} (cleared ${cleared.size} of ${SYMPTOMS.length})`}</Feedback>
              {whereNote && !fixInfo ? <Feedback tone={sim.hypothesisRight === false ? 'warn' : 'info'}>{whereNote}</Feedback> : null}
              {fixInfo ? <Feedback tone={present ? 'warn' : 'ok'}>{fixVerdict()}</Feedback> : null}
              <Card>
                <Point title={`Step ${!investigated ? '1 · LISTEN' : !hypothesised ? '2 · WHERE IS IT?' : '3 · FIX'}`}>
                  {!investigated
                    ? `Strike and listen; read SPREAD, BEAT and SUSTAIN.${c.tapsNeeded ? ` Tap at least ${c.tapsNeeded} lugs (pick a LUG, then ▶ TAP) and listen for the odd ones out.` : ''}${caseId === 'snare' ? ' The strike here is SOFT on purpose — the symptom is about soft strokes.' : ''} Possible areas: ${c.areas.join(', ')}.`
                    : !hypothesised
                      ? `Name the area you suspect. Your first answer is remembered for the review; the reply quotes the evidence either way.`
                      : `A fix that only treats the symptom leaves FAULT at STILL; the right one clears it. ${caseId === 'ring' ? 'This case has two legitimate fixes.' : ''}${caseId === 'drift' ? ' Every strike moves one rod: evening the head is not the fix if it drifts again.' : ''}`}
                </Point>
              </Card>
              <WhyCard title="CREDIT · and a fresh case">
                <Body>{`Clear all five cases — ${cleared.size} of ${SYMPTOMS.length} so far. The review counts how many you named right on the first hypothesis. ↺ RESET CASE deals the case again for practice; credit stays.`}</Body>
                <KeyButton label="↺ RESET CASE" onPress={resetCase} />
              </WhyCard>
            </>
          ),
        },
        {
          key: 'practice', title: 'Check your understanding', kind: 'PRACTICE', layout: 'read',
          body: <DrumScenarioDeck scenarios={TROUBLE_SCENARIOS} onAnswered={onAnswered} intro="Two decisions about devices and drift." />,
        },
        {
          key: 'review', title: 'Review', kind: 'REVIEW', layout: 'read',
          body: (
            <>
              <YourRun lines={[
                `Cleared ${cleared.size} of ${SYMPTOMS.length}; first hypothesis right on ${firstRight} of ${hypothesised_n} named.`,
                reached ? `Decisions: ${reached} of ${TROUBLE_SCENARIOS.length} reached, ${rightFirst} right first time.` : 'Decisions: none answered yet.',
              ]} />
              <SectionTitle>SAY IT BEFORE YOU READ IT</SectionTitle>
              <RecallCard q="A drum will not hold tuning — name two hardware causes before you retune." a="A rod backing out under vibration (fit a nylon washer or lug lock); a worn washer, stripped insert or damaged lug." />
              <RecallCard q="A tom warbles. What do you do BEFORE touching a rod?" a="Strike and listen, tap round every lug, read the spread and the beat — then even the odd lugs. A gel hides the warble; it does not cure it." />
              <RecallCard q="What is a tuning device for, and what is it not for?" a="Consistency — the same numbers at every lug, the same setup next week. It does not hear the head relationship, the room or the music; the ear decides." />
              <SectionTitle>KEY IDEAS</SectionTitle>
              <Card>
                <Body>• Listen → name the area → fix. Every symptom has several possible causes.</Body>
                <Body>• Devices give consistency; a pitch reference is optional; the ear decides.</Body>
              </Card>
              <KeyTerms terms={DRUM_KEY_TERMS.trouble} />
              <Body>TRY NEXT: on EXCESSIVE RING, clear it both ways — a gel, then a reset and the resonant head — and listen to how different the two "fixed" drums sound.</Body>
            </>
          ),
        },
      ]}
    />
  );
}

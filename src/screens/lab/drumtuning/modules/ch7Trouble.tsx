/**
 * Chapter 7 — Advanced tuning and troubleshooting. LEARN (read: the
 * symptom table, tuning by ear, a pitch reference, a tuning device) →
 * PRACTICE (rack: "Diagnose the symptom" — five cases on the simulated
 * drum, several possible causes each, investigate with strikes and lug
 * taps, apply a fix, strike again) → PRACTICE (decisions) → REVIEW.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { colors } from '../../../../theme/tokens';
import { faderParam, optionsParam } from '../DrumRack';
import { ChapterSteps } from '../steps';
import { View } from 'react-native';
import { Body, Card, CompareTable, DrumScenarioDeck, DrumStatus, Feedback, KeyButton, KeyTerms, Point, SectionTitle } from '../kit';
import { DRUM_KEY_TERMS, TROUBLE_SCENARIOS } from '../drumContent';
import { DRUMS, SYMPTOMS, lugTapHz, randomUnevenHead, spreadCents, strikePartials, symptomById, type HeadState, type StrikeParams, type SymptomId } from '../drumEngine';
import { DrumTopStage, TOP_ASPECT } from '../stagesDrum';
import { PART_ASPECT, PartialsStage, WAVE_ASPECT, WaveStage } from '../stagesSignal';
import { MODEL_BADGE, RENDER_BADGE, fmtS, headAtHz, headHz, useStrike, useTap, type ChapterProps } from './shared';

type Sim = { batter: HeadState; reso: HeadState; damping: number; strainer: number; drift: boolean; strikes: number; fixed: string[] };

function startCase(id: SymptomId): Sim {
  const c = symptomById(id);
  const spec = DRUMS[c.drum];
  const mid = (spec.usefulHz[0] + spec.usefulHz[1]) / 2;
  const even = (hz: number, which: 'batter' | 'reso') => headAtHz(c.drum, hz, which);
  switch (id) {
    case 'warble':
      return { batter: { ...randomUnevenHead(even(mid, 'batter').tension, spec.lugs, 0x77a1, 0.5) }, reso: even(mid * 1.12, 'reso'), damping: 0, strainer: 0, drift: false, strikes: 0, fixed: [] };
    case 'choked':
      return { batter: even(mid, 'batter'), reso: even(mid, 'reso'), damping: 0.95, strainer: 0, drift: false, strikes: 0, fixed: [] };
    case 'ring':
      return { batter: even(mid * 1.15, 'batter'), reso: even(mid * 1.15, 'reso'), damping: 0, strainer: 0, drift: false, strikes: 0, fixed: [] };
    case 'snare':
      return { batter: even(mid, 'batter'), reso: even(mid * 1.3, 'reso'), damping: 0, strainer: 0.97, drift: false, strikes: 0, fixed: [] };
    default:
      return { batter: even(mid, 'batter'), reso: even(mid * 1.1, 'reso'), damping: 0, strainer: 0, drift: true, strikes: 0, fixed: [] };
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

export function Ch7Trouble({ onAnswered, onInteractive }: ChapterProps) {
  const [caseId, setCaseId] = useState<SymptomId>('warble');
  const [sims, setSims] = useState<Record<SymptomId, Sim>>(() => Object.fromEntries(SYMPTOMS.map((s) => [s.id, startCase(s.id)])) as Record<SymptomId, Sim>);
  const [view, setView] = useState<StageView>('wave');
  const [lug, setLug] = useState(0);
  const [cleared, setCleared] = useState<Set<SymptomId>>(() => new Set());
  const [lastFix, setLastFix] = useState<string | null>(null);
  const reported = useRef(false);

  const c = symptomById(caseId);
  const spec = DRUMS[c.drum];
  const sim = sims[caseId];
  const params = useMemo<StrikeParams>(() => ({ drum: c.drum, batter: sim.batter, reso: sim.reso, resoPresent: true, damping: sim.damping, strike: 0.6, strikeR: 0.3, strikeTheta: 0, strainer: c.drum === 'snare' ? sim.strainer : undefined }), [c.drum, sim]);
  const pb = useStrike(params);
  const tap = useTap(sim.batter, lug, c.drum);
  const parts = useMemo(() => strikePartials(params), [params]);
  const present = symptomPresent(caseId, sim);
  const spread = spreadCents(sim.batter);

  // The drifting rod: every strike backs lug 2 out a little until the hardware is fixed.
  useEffect(() => {
    if (!pb.playing || !sim.drift) return;
    setSims((all) => {
      const s = all[caseId];
      if (!s.drift) return all;
      const turns = s.batter.turns.map((t, i) => (i === 1 ? t - 0.12 : t));
      return { ...all, [caseId]: { ...s, batter: { ...s.batter, turns }, strikes: s.strikes + 1 } };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pb.playing]);

  useEffect(() => {
    if (!present && !cleared.has(caseId) && sim.fixed.length > 0) setCleared((x) => new Set([...x, caseId]));
  }, [present, caseId, cleared, sim.fixed.length]);
  useEffect(() => {
    if (cleared.size >= SYMPTOMS.length && !reported.current) {
      reported.current = true;
      onInteractive();
    }
  }, [cleared, onInteractive]);

  const applyFix = (fixId: string) => {
    setLastFix(fixId);
    setSims((all) => {
      const s = { ...all[caseId], fixed: [...all[caseId].fixed, fixId] };
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
          // "Tighten both heads" (ring) keeps the relationship; "tighten the
          // batter" (choked) moves only the batter.
          s.batter = { ...s.batter, tension: s.batter.tension * 1.25 };
          if (caseId === 'ring') s.reso = { ...s.reso, tension: s.reso.tension * 1.25 };
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
  };
  const fixInfo = lastFix ? c.fixes.find((f) => f.id === lastFix) : null;

  return (
    <ChapterSteps
      steps={[
        {
          key: 'symptoms', title: 'Diagnosis by symptom', kind: 'LEARN', layout: 'read',
          body: (
            <>
              <SectionTitle>SYMPTOM → WHERE TO LOOK</SectionTitle>
              <CompareTable left="Symptom" right="Possible areas to investigate" rows={SYMPTOMS.map((s) => [s.title, s.areas.join(' · ')] as [string, string])} />
              <Body>Every row has more than one possible cause. Investigate — strike, tap round the lugs, look at the hardware — before turning anything. The next step puts five of these on the simulated drum.</Body>
              <SectionTitle>BY EAR, BY REFERENCE, BY DEVICE</SectionTitle>
              <Card>
                <Point title="Tuning by ear">The method of Chapter 3: lug taps for evenness, the stroke from the seat for the sound. It is the skill everything else supports.</Point>
                <Point title="Using a pitch reference">A keyboard, a tuner app, another drum: useful for repeating a setup or placing the toms in a key for a song. Optional — a drum's partials are not harmonic, so the "note" is always a judgement.</Point>
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
                <DrumTopStage width={w} height={h} drum={c.drum} head={sim.batter} selected={lug} tap={lug} title={`${c.title} · ${spec.name}`} />
              ) : view === 'wave' ? (
                <WaveStage width={w} height={h} ov={pb.rendered?.overview ?? null} envDb={pb.rendered?.envDb} t60={pb.rendered?.t60} seconds={spec.seconds} label={`${c.title}`} progress={pb.progress} playing={pb.playing} idle="rendering…" />
              ) : (
                <PartialsStage width={w} height={h} partials={parts} fb={headHz(c.drum, sim.batter, 'batter')} label={c.title} />
              ),
            aspect: view === 'drum' ? TOP_ASPECT : view === 'wave' ? WAVE_ASPECT : PART_ASPECT,
            size: 'L',
            badge: view === 'wave' ? RENDER_BADGE : MODEL_BADGE,
            bezel: [
              { k: 'CASE', v: `${SYMPTOMS.findIndex((s) => s.id === caseId) + 1} / ${SYMPTOMS.length}` },
              { k: 'SPREAD', v: `${spread.toFixed(0)} ¢`, tint: spread <= 12 ? colors.green : colors.red },
              { k: 'SUSTAIN', v: fmtS(pb.rendered?.t60), tint: colors.green },
              { k: 'STATUS', v: present ? 'PRESENT' : 'CLEARED', tint: present ? colors.red : colors.green, flex: 1.2 },
              { k: 'CLEARED', v: `${cleared.size} / ${SYMPTOMS.length}` },
            ],
            params: [
              optionsParam({ id: 'case', label: 'CASE', value: caseId, options: SYMPTOMS.map((s) => ({ key: s.id, label: s.title, short: s.id.toUpperCase(), blurb: s.symptom })), onChange: (id) => { setCaseId(id); setLastFix(null); setLug(0); }, sticky: false }),
              optionsParam({ id: 'view', label: 'VIEW', value: view, options: [{ key: 'drum', label: 'The drum and its map', short: 'DRUM' }, { key: 'wave', label: 'The rendered strike', short: 'WAVE' }, { key: 'partials', label: 'The partials', short: 'PARTIALS' }], onChange: setView }),
              faderParam({ id: 'lug', label: 'TAP LUG', value: lug, min: 0, max: spec.lugs - 1, step: 1, format: (v) => `tap at lug ${Math.round(v) + 1} · ${lugTapHz(sim.batter, Math.round(v), spec.diameterIn, spec.sigmaBatter).toFixed(0)} Hz`, formatShort: (v) => `#${Math.round(v) + 1}`, onChange: (v) => setLug(Math.round(v)) }),
              { kind: 'action', id: 'strike', label: '▶ STRIKE', onPress: pb.play },
              { kind: 'action', id: 'tap', label: '▶ TAP', onPress: tap.play },
              optionsParam({ id: 'fix', label: 'FIX', value: lastFix ?? '', options: c.fixes.map((f) => ({ key: f.id, label: f.label, short: f.id.toUpperCase() })), onChange: applyFix, sticky: false }),
            ],
            initialParam: 'lug',
            onTap: () => (pb.playing ? pb.stop() : pb.play()),
          },
          well: (
            <>
              <DrumStatus playing={pb.playing || tap.playing} pending={pb.pending || tap.pending} rendering={pb.status === 'rendering' || tap.status === 'rendering'} idle="stopped · ▶ STRIKE and ▶ TAP to investigate, then pick a FIX and strike again" label={tap.playing || tap.pending ? `the tap at lug ${lug + 1}` : 'the strike'} />
              <Feedback tone="warn">{`${c.title}: ${c.symptom}`}</Feedback>
              {fixInfo ? <Feedback tone={present ? 'warn' : 'ok'}>{`${fixInfo.label}: ${fixInfo.why}${present ? ' The symptom is still there — strike again and investigate further.' : ' Strike it: the symptom has cleared.'}`}</Feedback> : null}
              <Body>Investigate before you fix: ▶ STRIKE and listen; switch VIEW to the drum and ▶ TAP round the lugs; read SPREAD and SUSTAIN. Then choose a FIX. A fix that only treats the symptom leaves STATUS at PRESENT; the right one clears it. Possible areas for this case: {c.areas.join(', ')}.</Body>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <KeyButton label="↺ RESET CASE" onPress={resetCase} />
                <KeyButton label="■ STOP" onPress={() => { pb.stop(); tap.stop(); }} tint={colors.green} />
              </View>
              <Card>
                <Point title="Credit">Clear all five cases. RESET CASE deals the case again for practice; credit stays.</Point>
                {caseId === 'drift' ? <Point title="Watch the map">Every strike moves one rod. Evening the head is not the fix if it drifts again — strike after each fix and read the map.</Point> : null}
              </Card>
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
              <SectionTitle>KEY IDEAS</SectionTitle>
              <Card>
                <Body>• Every symptom has several possible causes; investigate, then fix the cause, not the symptom.</Body>
                <Body>• A loose rod looks like a tuning problem; damping hides a warble without curing it.</Body>
                <Body>• Devices give consistency; a pitch reference is optional; the ear decides.</Body>
              </Card>
              <KeyTerms terms={DRUM_KEY_TERMS.trouble} />
            </>
          ),
        },
      ]}
    />
  );
}

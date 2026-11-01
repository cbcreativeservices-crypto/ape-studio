/**
 * D41 (bugs #28 + #30, owner-approved 2026-11-01): a calculator answer is
 * offered as ⤵ USE only where it MEANS the same thing, not merely where it is
 * the same kind of quantity.
 *
 * Before: `chainFits` checked the kind (plus unit tags on dB and counts), so a
 * workflow step offered answers that were physically wrong and each one gave a
 * confident wrong figure — ABSORPTION NEEDED (32.2 m²) as one panel's area (1
 * panel instead of 25), a VOLTAGE DROP as the SUPPLY VOLTAGE, the BUFFER
 * LATENCY as EXTRA PROCESSING (one buffer counted three times), a FREE-SPACE
 * PATH LOSS as an ANTENNA GAIN, a port length as a cone's excursion.
 *
 * Now inputs and answers carry an optional `meaning` tag. Where both carry one
 * the input's tag must take the answer's; where either has none, only a
 * SAFE_UNTAGGED_KINDS kind (one meaning in the whole lab) falls back to the old
 * kind + unit rule. A saved PROJECT value (named by the learner, no tag) keeps
 * the kind + unit rule (`unitFits`).
 *
 * LOADER NOTE: the registry uses Metro-style extensionless imports; the hook
 * below resolves them for node (local to this test process).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier) && context.parentURL) {
      const base = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of ['.ts', '.tsx']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
});

const { WORKSPACES, getWorkspace } = await import('../src/screens/lab/calc/registry.ts');
const U = await import('../src/screens/lab/calc/calcUnits.ts');
const { WORKFLOW_TEMPLATES } = await import('../src/screens/lab/calc/workflowCatalog.ts');
const G = await import('../src/screens/lab/calc/calcScreenGuides.ts');
const { chainFits, unitFits, meaningMatches, SAFE_UNTAGGED_KINDS, parseList, parseQuantity, unitsFor } = U;

const src = (rel: string) => readFileSync(new URL(`../src/screens/lab/calc/${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
type Ws = NonNullable<ReturnType<typeof getWorkspace>>;
type Fn = Ws['functions'][number];
type Out = ReturnType<Fn['compute']>[number];
type NumOut = Extract<Out, { value: number }>;
const ws = (id: string): Ws => {
  const w = getWorkspace(id);
  assert.ok(w, id);
  return w!;
};
const fn = (wsId: string, key: string): Fn => {
  const f = ws(wsId).functions.find((x) => x.key === key);
  assert.ok(f, `${wsId}.${key}`);
  return f!;
};
const field = (wsId: string, key: string) => {
  const f = ws(wsId).fields.find((x) => x.key === key);
  assert.ok(f, `${wsId}.${key}`);
  return f!;
};
/** The function's answers at its fields' grey example values (base units). */
const example = (w: Ws, f: Fn): Out[] => {
  const v: Record<string, number | number[]> = {};
  for (const k of f.inputs) {
    const fd = w.fields.find((x) => x.key === k)!;
    if (fd.quantity === 'list') v[k] = parseList(fd.placeholder ?? '');
    else {
      const units = unitsFor(fd.quantity, fd.unitIds);
      const u = units.find((x) => x.id === fd.defaultUnit) ?? units[0];
      v[k] = u.toBase(parseQuantity(fd.placeholder ?? '1') ?? 1);
    }
  }
  return f.compute(v);
};
const out = (wsId: string, key: string, label: string): NumOut => {
  const o = example(ws(wsId), fn(wsId, key)).find((x) => x.label === label);
  assert.ok(o && 'value' in o, `${wsId}/${key}: ${label}`);
  return o as NumOut;
};
/** The runner's own offer rule (CalcWorkflowRunScreen): chainFits + chainable + finite. */
const offered = (o: NumOut, f: ReturnType<typeof field>) => chainFits(o.label, o.quantity, f, o.meaning) && o.chainable !== false && Number.isFinite(o.value);

describe('the meaning rule', () => {
  it('a tag takes itself and its sub-tags, never a sibling or a parent', () => {
    assert.ok(meaningMatches('time:latency:buffer', 'time:latency'));
    assert.ok(meaningMatches('time:latency', 'time:latency'));
    assert.ok(meaningMatches('time:rt60', ['time:delay', 'time:rt60']));
    assert.ok(!meaningMatches('time:latency:buffer', 'time:latency:processing'));
    assert.ok(!meaningMatches('time:latency', 'time:latency:processing'));
    assert.ok(!meaningMatches('time:latency-ish', 'time:latency')); // a prefix only at a ':'
  });
  it('an untagged side falls back to kind + unit only on a SAFE kind', () => {
    assert.deepEqual([...SAFE_UNTAGGED_KINDS].sort(), ['bitdepth', 'bpm', 'samplerate', 'sensitivity']);
    // TEMPO → TEMPO: one meaning in the whole lab.
    assert.ok(chainFits('TEMPO', 'bpm', field('bpm', 'bpm')));
    // A time with no tag fills nothing; a tagged answer into an untagged input neither.
    assert.ok(!chainFits('DELAY', 'time', field('latency', 'proc')));
    assert.ok(!chainFits('ABSORPTION NEEDED', 'area', field('treatment', 'panelArea'), 'area:absorption'));
    // Kind + unit still come first.
    assert.ok(!chainFits('DELAY', 'time', field('wave', 'f'), 'frequency:point'));
  });
  it('every tag names its own kind first (a length tag never sits on a time)', () => {
    let n = 0;
    for (const w of WORKSPACES as Ws[]) {
      for (const f of w.fields) {
        if (!f.meaning) continue;
        for (const t of typeof f.meaning === 'string' ? [f.meaning] : f.meaning) {
          n++;
          assert.equal(t.split(':')[0], f.quantity, `${w.id}.${f.key}: ${t}`);
        }
      }
      for (const g of w.functions) {
        for (const o of example(w, g)) {
          if (!('value' in o) || !o.meaning) continue;
          n++;
          assert.equal(o.meaning.split(':')[0], o.quantity, `${w.id}/${g.key}: ${o.label} ${o.meaning}`);
        }
      }
    }
    assert.ok(n > 200, `checked ${n} tags`);
  });
});

describe('the physically wrong offers the checkers found are refused', () => {
  const refused: [string, NumOut, ReturnType<typeof field>][] = [
    // #28 — 32.2 m² of absorption as ONE panel's area: 1 panel, RT60 0.357 s, not 25 panels and ~0.50 s.
    ['absorption needed → panel area', out('sabine', 'neededA', 'ABSORPTION NEEDED'), field('treatment', 'panelArea')],
    ['absorption to add → panel area', out('sabine', 'neededA', 'ABSORPTION TO ADD'), field('treatment', 'panelArea')],
    // #30 — Long Power Run step 2.
    ['voltage drop → supply voltage', out('vdrop', 'drop', 'VOLTAGE DROP'), field('vdrop', 'vsrc')],
    // Monitoring Latency: one buffer counted as processing too.
    ['buffer latency → extra processing', out('latency', 'bufLatency', 'BUFFER LATENCY'), field('latency', 'proc')],
    // Speaker-to-listener distance vs a cable run.
    ['acoustic distance → cable length', out('distdelay', 'delayToDist', 'DISTANCE'), field('cable', 'len')],
    ['acoustic distance → power-run length', out('distdelay', 'delayToDist', 'DISTANCE'), field('vdrop', 'len')],
    ['cable loop resistance → load impedance', out('cable', 'loss', 'LOOP RESISTANCE (16 AWG)'), field('cable', 'z')],
    ['cable loss → max acceptable loss', out('cable', 'loss', 'LEVEL LOSS'), field('cable', 'maxloss')],
    ['critical distance → listening distance', out('critdist', 'dc', 'CRITICAL DISTANCE Dc'), field('critdist', 'r')],
    ['path loss → antenna gain', out('rflink', 'pathLoss', 'FREE-SPACE PATH LOSS'), field('rflink', 'gtx')],
    ['mains current → breaker rating', out('rackheat', 'heatLoad', 'MAINS CURRENT'), field('rackheat', 'breaker')],
    ['sealed fc → vented tuning target', out('driver', 'sealed', 'SYSTEM RESONANCE fc'), field('driver', 'fbTarget')],
    ['port length → cone excursion', out('driver', 'portLength', 'PHYSICAL PORT LENGTH'), field('driver', 'xmax')],
    ['path difference → mic-to-source distance', out('stereomic', 'pathDelay', 'PATH DIFFERENCE'), field('stereomic', 'micDist')],
    ['mic output (dBu) → preamp target', out('micgain', 'micout', 'OUTPUT LEVEL (dBu)'), field('micgain', 'target')],
    ['gain → preamp max input', out('micgain', 'gain', 'GAIN TO HIT TARGET (dB)'), field('micgain', 'maxIn')],
    ['transmission loss (dB) → a dBu level', out('transloss', 'massTL', 'TRANSMISSION LOSS'), field('level', 'dbu')],
    ['70 V system load → amplifier rating', out('cv70', 'load', 'SYSTEM LOAD (12 speakers)'), field('cv70', 'prated')],
    ['session data per minute → storage available', out('filesize', 'multitrack', 'SESSION RATE PER MINUTE'), field('filesize', 'storage')],
    ['combined parallel load → one speaker’s nominal impedance', out('impedance', 'parallel', 'TOTAL PARALLEL IMPEDANCE'), field('limiter', 'z')],
    ['a frequency ratio → an amplitude ratio', out('pitch', 'transpose', 'FREQUENCY RATIO'), field('level', 'ampRatio')],
    ['a peak voltage → an RMS voltage', out('ohmspower', 'rmsToPeak', 'PEAK VOLTAGE'), field('ohmspower', 'vrms')],
    ['a computed RT60 → a TARGET RT60', out('sabine', 'rtFromVA', 'RT60'), field('sabine', 'targetRt')],
  ];
  for (const [why, o, f] of refused) {
    it(why, () => {
      // Same kind and unit — the old rule offered it…
      assert.ok(unitFits(o.label, o.quantity, f), `${why}: same kind and unit`);
      // …and the meaning rule does not.
      assert.equal(chainFits(o.label, o.quantity, f, o.meaning), false, why);
    });
  }
});

describe('physically right hand-offs are still offered', () => {
  const kept: [string, NumOut, ReturnType<typeof field>][] = [
    ['RT60 → critical distance’s RT60', out('sabine', 'rtFromVA', 'RT60'), field('critdist', 'rt60')],
    ['predicted SPL → the known level L₁', out('speakerpower', 'predictspl', 'PREDICTED SPL (one speaker, after headroom)'), field('spldist', 'l1')],
    ['level at the listener → exposure level', out('spldist', 'point', 'LEVEL AT d₂'), field('dose', 'lex')],
    ['power → power (Ohm’s law)', out('ohmspower', 'pFromVZ', 'POWER'), field('ohmspower', 'p')],
    ['combined speaker load → cable load impedance', out('impedance', 'parallel', 'TOTAL PARALLEL IMPEDANCE'), field('cable', 'z')],
    ['rack mains current → long power run current', out('rackheat', 'heatLoad', 'MAINS CURRENT'), field('vdrop', 'current')],
    ['FIR latency → extra processing', out('firlen', 'latency', 'LATENCY'), field('latency', 'proc')],
    ['buffer latency → distance in air (a latency is a delay)', out('latency', 'bufLatency', 'BUFFER LATENCY'), field('distdelay', 'delay')],
    ['arrival delay → comb filter Δt', out('stereomic', 'pathDelay', 'ARRIVAL DELAY Δt'), field('comb', 'dt')],
    ['delay → distance → listening distance', out('distdelay', 'delayToDist', 'DISTANCE'), field('speakerpower', 'dist')],
    ['dBV level → dBV field (the unit guard still applies)', out('level', 'vToDbv', 'LEVEL (dBV)'), field('level', 'dbv')],
    ['a room mode → transmission loss at that frequency', out('wave', 'distToFreq', 'HALF-WAVE FREQUENCY (room-mode f₁ for this dimension)'), field('transloss', 'f')],
    ['sealed fc → evaluate excursion SPL at fc', out('driver', 'sealed', 'SYSTEM RESONANCE fc'), field('driver', 'f')],
  ];
  for (const [why, o, f] of kept) {
    it(why, () => assert.ok(offered(o, f), why));
  }
  it('the answers that appear only for several speakers carry their meaning too', () => {
    const spl = fn('speakerpower', 'predictspl').compute({ sens: 90, power: 100, dist: 10, headroom: 0, nspk: 2 });
    const both = spl.find((o) => o.label.startsWith('WITH 2 SPEAKERS')) as NumOut;
    assert.ok(both && offered(both, field('spldist', 'l1')));
    const pw = fn('speakerpower', 'reqpower').compute({ sens: 90, target: 100, dist: 10, headroom: 0, nspk: 2 });
    const each = pw.find((o) => o.label.startsWith('POWER PER SPEAKER')) as NumOut;
    assert.ok(each && offered(each, field('cable', 'pamp')));
  });
});

describe('every workflow template offers only physically right imports', () => {
  /** Every ⤵ USE a template offers, by the runner's own rule, at the example values. */
  const offers = (id: string): string[] => {
    const t = (WORKFLOW_TEMPLATES as { id: string; steps: { workspaceId: string; fnKey: string }[] }[]).find((x) => x.id === id)!;
    const outs: [number, Out][] = [];
    const links: string[] = [];
    t.steps.forEach((s, i) => {
      const w = ws(s.workspaceId);
      const f = fn(s.workspaceId, s.fnKey);
      for (const k of f.inputs) {
        const fd = w.fields.find((x) => x.key === k)!;
        if (fd.quantity === 'list') continue;
        for (const [j, o] of outs) if ('value' in o && offered(o as NumOut, fd)) links.push(`${o.label} (STEP ${j + 1}) → ${fd.name} (STEP ${i + 1})`);
      }
      for (const o of example(w, f)) outs.push([i, o]);
    });
    return links;
  };
  // The reviewed list (D41). A template's offers changing is a physics review,
  // never a side effect: update this only after checking the new pair.
  const EXPECTED: Record<string, string[]> = {
    'tpl-delay-speaker': [],
    'tpl-spl-estimate': ['PREDICTED SPL (one speaker, after headroom) (STEP 1) → KNOWN LEVEL L₁ (STEP 2)'],
    'tpl-amp-matching': [],
    'tpl-cable-drop': [], // was LOOP RESISTANCE → LOAD IMPEDANCE, LEVEL LOSS → MAX ACCEPTABLE LOSS
    'tpl-room-modes': [],
    'tpl-tempo-delay': [],
    'tpl-wavelength': [],
    'tpl-ohms-law': ['POWER (STEP 1) → POWER (STEP 2)'],
    'tpl-impedance': [],
    'tpl-loudness-delivery': [],
    // was also CRITICAL DISTANCE Dc → LISTENING DISTANCE (always 0 dB)
    'tpl-room-survey': ['RT60 (STEP 1) → REVERBERATION TIME (RT60) (STEP 2)', 'RT60 (STEP 1) → REVERBERATION TIME (RT60) (STEP 3)'],
    'tpl-bass-boundaries': [],
    'tpl-wireless-link': [], // was FREE-SPACE PATH LOSS → TX / RX ANTENNA GAIN
    'tpl-rack-power': [], // was MAINS CURRENT → BREAKER RATING
    'tpl-power-run': [], // was VOLTAGE DROP → SUPPLY VOLTAGE
    'tpl-passive-crossover': [],
    'tpl-line-array': [],
    // was also fc → TARGET BOX TUNING, PORT LENGTH → PEAK EXCURSION and → DISTANCE
    'tpl-sub-enclosure': ['SYSTEM RESONANCE fc (STEP 1) → FREQUENCY (STEP 3)'],
    'tpl-stereo-mic': [], // was PATH DIFFERENCE → MIC-TO-SOURCE DISTANCE
    'tpl-network-audio': [],
    'tpl-hearing-dose': ['LEVEL AT d₂ (STEP 1) → EXPOSURE LEVEL (STEP 2)'],
    'tpl-gain-staging': [], // was five: mic output / gains → TARGET LEVEL, HEADROOM, PREAMP MAX INPUT
    'tpl-cv-distribution': [], // was SYSTEM LOAD → AMPLIFIER RATED POWER and → TAP PER ADDED SPEAKER
    'tpl-time-align': [],
    'tpl-treatment-plan': [], // was ABSORPTION NEEDED / TO ADD → PANEL AREA (EACH)  (bug #28)
    'tpl-monitor-latency': [], // was BUFFER LATENCY → EXTRA PROCESSING
    'tpl-session-storage': [], // was SESSION RATE PER MINUTE → STORAGE AVAILABLE
    'tpl-speaker-limiter': [],
  };
  it('the list covers every template', () => {
    assert.deepEqual((WORKFLOW_TEMPLATES as { id: string }[]).map((t) => t.id).sort(), Object.keys(EXPECTED).sort());
  });
  for (const [id, want] of Object.entries(EXPECTED)) {
    it(id, () => assert.deepEqual(offers(id), want));
  }
  it('#28 worked figures: the panel planner given the real panel area answers 25 panels, not 1', () => {
    // 0.161 × 100 / 0.5 = 32.2 m² needed; with 2.88 m² α 0.9 panels from 1.2 s → 0.5 s.
    const need = out('sabine', 'neededA', 'ABSORPTION NEEDED');
    assert.ok(Math.abs(0.161 * 100 / 0.5 - 32.2) < 1e-9);
    assert.ok(need.value > 0);
    assert.equal(chainFits(need.label, need.quantity, field('treatment', 'panelArea'), need.meaning), false);
  });
});

describe('every entry point uses the meaning rule; projects keep kind + unit', () => {
  it('workflow runner: the offer and the live import pass the answer’s meaning', () => {
    const run = src('CalcWorkflowRunScreen.tsx');
    assert.match(run, /'value' in o && chainFits\(o\.label, o\.quantity, f, o\.meaning\) && o\.chainable !== false/);
    // A saved run's import that no longer means the same thing reads empty.
    assert.match(run, /if \(o && chainFits\(o\.label, o\.quantity, f, o\.meaning\) && o\.quantity === f\.quantity/);
    assert.match(run, /\.filter\(\(v\) => unitFits\(v\.label, v\.quantity, f\)\)/);
    assert.doesNotMatch(run, /chainFits\([^)]*\bv\.label/);
  });
  it('SEND →: the sent value carries its meaning, and an input checks it', () => {
    const w = src('CalcWorkspaceScreen.tsx');
    assert.match(w, /setChainValue\(\{ label: o\.label, quantity: o\.quantity, meaning: o\.meaning, baseValue: o\.value/);
    assert.match(w, /const canChain = chain && chainFits\(chain\.label, chain\.quantity, f, chain\.meaning\);/);
    assert.match(w, /calcSendTarget\(ws, fn, o\.label, o\.quantity, o\.meaning\)/);
    assert.match(src('chainStore.ts'), /meaning\?: string;/);
    assert.match(src('calcScreenGuides.ts'), /if \(!f \|\| !chainFits\(label, quantity, f, meaning\)\) continue;/);
  });
  it('the guide’s SEND → target follows the meaning: a voltage drop has no taker, an RT60 does', () => {
    const vd = ws('vdrop');
    assert.equal(G.calcSendTarget(vd, fn('vdrop', 'drop'), 'VOLTAGE DROP', 'voltage', out('vdrop', 'drop', 'VOLTAGE DROP').meaning), null);
    const sb = ws('sabine');
    assert.equal(G.calcSendTarget(sb, fn('sabine', 'rtFromVA'), 'RT60', 'time', out('sabine', 'rtFromVA', 'RT60').meaning), 'other');
  });
});

describe('the guide says what the screen does', () => {
  const text = src('calcScreenGuides.ts');
  it('workflow lines promise a meaning match, and no longer ask the learner to police the kind rule', () => {
    assert.ok(text.includes('an answer is offered to a later step only where it means the same thing: an RT60 fills an RT60, but a voltage drop never fills a supply voltage.'));
    assert.ok(text.includes('A step offers only answers that mean the same thing as its input — a power fills a power, but an RT60 never fills a target RT60'));
    assert.ok(text.includes('fills an input with an earlier step’s answer that means the same thing.'));
    assert.ok(text.includes('An answer is offered only where it means the same thing: a distance never fills a time, and a voltage drop never fills a supply voltage.'));
    assert.doesNotMatch(text, /Same kind is not always the same thing/);
    assert.doesNotMatch(text, /the same kind is not always the same thing/);
  });
  it('project values: still offered by kind, so the guide still says to check the name', () => {
    assert.ok(text.includes('A project value is offered only to an input of the same kind — a power never fills a voltage. Check it is the same thing before you tap ⤵ USE.'));
    assert.ok(text.includes('so its values offer ⤵ USE … (PROJECT) on inputs of the same kind.'));
  });
});

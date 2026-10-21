/**
 * Wiring A-grade audit, round 3 (owner go 2026-10-21) — group "r3_cablecs":
 * Cable & Connector Fundamentals + Connector Selection. The finding id is in
 * each title. Each assertion fails if the wrong wording, logic or geometry
 * comes back. Data modules are imported; RN / Skia modules are source-read.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const { PLUG_COMPARISONS } = await import('../src/screens/lab/cable/data/lesson04.ts');
const { getConnector } = await import('../src/screens/lab/cable/data/registry.ts');
const { cableEndImage } = await import('../src/screens/lab/cable/connectorImages.ts');
const { SCENARIOS } = await import('../src/screens/lab/connectorselect/data/scenarios.ts');
const { JOB_MATRIX } = await import('../src/screens/lab/connectorselect/data/jobs.ts');

const root = join(import.meta.dirname, '..');
const lab = (rel: string) => readFileSync(join(root, 'src/screens/lab', rel), 'utf8');
const flat = (s: string) => s.replace(/\s+/g, ' ');
const scen = (id: string) => SCENARIOS.find((s) => s.id === id)!;

describe('Cable & Connector Fundamentals', () => {
  it('R3-CB-01 8-pole speakON: no speakON-style connector is rated to break a driven load', () => {
    const r = getConnector('speakon_nl8' as never)!;
    assert.doesNotMatch(r.hotPlug.rationale, /designed to make and break/);
    assert.match(r.hotPlug.rationale, /No speakON-style connector is rated to break a driven load; mute or power the amps down first\./);
  });

  it('R3-CB-02 a digital/data cable does the analog job one way only — answer stays NO', () => {
    for (const id of ['xlr_analog_vs_aes3', 'xlr_mic_vs_dmx', 'rca_analog_vs_spdif']) {
      const c = PLUG_COMPARISONS.find((x) => x.id === id)!;
      assert.equal(c.answer, 'no', id);
      assert.match(c.oneWay ?? '', /^One way only: the .*cable can do the analog.* job, not the reverse\.$/, id);
    }
    assert.equal(PLUG_COMPARISONS.find((x) => x.id === 'xlr_analog_vs_aes3')!.oneWay, 'One way only: the digital cable can do the analog job, not the reverse.');
    const screen = flat(lab('cable/lessons/lesson04.tsx'));
    // the one-way note reaches both the correct verdict and the wrong-pick hint
    assert.match(screen, /return comp\.oneWay \? `\$\{comp\.why\} \$\{comp\.oneWay\}` : comp\.why;/);
    assert.match(screen, /return comp\.oneWay \? `Not as a two-way swap[^`]*\$\{comp\.oneWay\}`/);
    assert.match(screen, /verdict === 'correct' \? correctText\(comp\) : wrongHint\(picked, comp\)/);
  });

  it('R3-CB-03 the amp→monitor screens agree: speakON/¼-inch combo outputs, older plain TS', () => {
    const s = lab('cable/data/lesson11.ts');
    assert.doesNotMatch(s, /older amplifiers and cabinets use exactly this 1\/4-inch TS jack/);
    assert.match(s, /Many amps use speakON\/¼-inch combo outputs; older ones a plain ¼-inch TS jack\./);
    assert.match(s, /many amps use speakON\/¼-inch combo outputs, and older amps and cabinets a plain ¼-inch TS jack/);
  });

  it('R3-CB-04 combo card hedges its latch: "(on some models)"', () => {
    assert.equal(getConnector('combo_xlr_trs' as never)!.locking.someModels, true);
    assert.match(lab('cable/lessons/connectorCard.tsx'), /rec\.locking\.someModels \? ' \(on some models\)' : ''/);
  });

  it('R3-CB-05 interface TRS outputs: accepted cables are TRS-to-XLR and TS-to-RCA', () => {
    const s = lab('cable/data/lesson11.ts');
    // the interface → powered monitors pick (mixer → mains keeps XLR–XLR)
    const iface = s.slice(s.indexOf("id: 'b_iface_mon'"), s.indexOf("id: 'b_hp'"));
    assert.doesNotMatch(iface, /'Balanced XLR line cables'/);
    assert.doesNotMatch(iface, /'Unbalanced RCA cables'/);
    assert.match(s, /'Balanced TRS-to-XLR line cables',\s*'accepted'/);
    assert.match(s, /'Unbalanced TS-to-RCA cables',\s*'accepted'/);
    assert.match(s, /a TRS plug at the interface’s line output, an XLR plug at the monitor/);
    // the interface's outputs are TRS (the fault-hunt line names them)
    assert.match(s, /fed from interface line output 2 with a balanced TRS cable/);
  });

  it('R3-CB-S3 speakON figure draws the speaker cable at true scale (Ø8.5 mm, not 4.6)', () => {
    const s = lab('cable/art/plugs.tsx');
    const fig = s.slice(s.indexOf('function SpeakonSide'), s.indexOf('const ASPECT'));
    assert.doesNotMatch(fig, /4\.6 \* k/);
    assert.match(fig, /const od = 8\.5;/);
    assert.match(fig, /height=\{od \* k\}/);
    // the boot drawn over it opens wider than the cable
    assert.match(fig, /const r0 = od \/ 2 \+ 0\.5;/);
    // and the cable sections draw the same Ø8.5 speaker cable
    assert.match(lab('cable/art/sections.tsx'), /speaker_2c: 'Ø 8\.5 mm/);
  });

  it('R3-CB-S3 "CROSSED" sits above the jacket edge, not on it', () => {
    const s = lab('cable/art/wiring.tsx');
    assert.match(s, /<Label key="xl" x=\{\(xa \+ xb\) \/ 2\} y=\{top - 9\} text="CROSSED"/);
    // jacket top edge is top − 4: the 10-unit label baseline at top − 9 clears it
    assert.match(s, /<Rect x=\{c0\} y=\{top - 4\}/);
  });

  it('R3-CB-S3 bi-amp: the crossover comes before the amp and feeds each amp channel', () => {
    const s = lab('cable/data/lesson05.ts');
    assert.match(s, /the crossover comes BEFORE the amplifier: it splits the signal into low and high bands and feeds each band to its own amp channel/);
    assert.doesNotMatch(s, /with no crossover in the way/);
  });

  it('R3-CB-S3 no gear maker names in the speakON learner text', () => {
    for (const id of ['speakon_nl2', 'speakon_nl4', 'speakon_nl8']) {
      const r = getConnector(id as never)!;
      assert.doesNotMatch(r.hotPlug.rationale, /Neutrik|UL\/CSA/, id);
    }
  });
});

describe('Connector Selection', () => {
  it('R3-CS-01 a cable end into an OUTPUT is FEMALE, into an INPUT MALE (rule C2)', () => {
    assert.equal(cableEndImage('xlr3' as never, 'into_output')!.label, 'FEMALE');
    assert.match(cableEndImage('xlr3' as never, 'into_output')!.url, /xlr-female\.webp$/);
    assert.equal(cableEndImage('xlr3' as never, 'into_input')!.label, 'MALE');
    assert.match(cableEndImage('xlr3' as never, 'into_input')!.url, /xlr-male\.webp$/);
    // the correct mic-cable answers render female → male
    for (const id of ['s01_dyn_mic', 's02_condenser', 's06_mixer_powered']) {
      const c = scen(id).choices.find((x) => x.verdict === 'correct')!;
      assert.deepEqual([cableEndImage(c.a, 'into_output')!.label, cableEndImage(c.b, 'into_input')!.label], ['FEMALE', 'MALE'], id);
    }
    const tray = lab('connectorselect/pagesC.tsx');
    assert.match(tray, /<ConnectorPhoto id=\{c\.a\} size=\{44\} end="into_output"/);
    assert.match(tray, /<ConnectorPhoto id=\{c\.b\} size=\{44\} end="into_input"/);
    assert.match(lab('connectorselect/bits.tsx'), /const images = end \? \(endImage \? \[endImage\] : \[\]\)/);
  });

  it('R3-CS-02 insert wiring: most consoles tip = send, ring = return, with the exception named', () => {
    const want = /On most consoles tip = send, ring = return; some older large-format desks reverse it — check the manual\./;
    const insert = JOB_MATRIX.find((e) => e.connector === 'trs_quarter')!.jobs.find((j) => j.id === 'insert')!;
    assert.match(insert.explain, want);
    assert.doesNotMatch(insert.explain, /equipment-defined/);
    const b = lab('connectorselect/pagesB.tsx');
    assert.match(b, want);
    assert.doesNotMatch(b, /Which contact sends is equipment-defined/);
  });

  it('R3-CS-03 a 2×TS-to-TRS Y lead has TS plugs at the keyboard', () => {
    const s4 = scen('s04_stereo_keys');
    for (const id of ['b', 'c']) assert.equal(s4.choices.find((c) => c.id === id)!.a, 'ts_quarter', id);
    assert.equal(s4.choices.find((c) => c.id === 'c')!.b, 'trs_quarter');
  });

  it('R3-CS-04 cross-section conductors never overlap; Cat pairs are blue/orange/green/brown', () => {
    const s = lab('connectorselect/art.tsx');
    assert.match(s, /export const CAT_PAIR_COLORS = \['#3d7dd6', '#d9822b', '#3a9a4a', '#7a4a2a'\] as const;/);
    assert.match(s, /return Math\.max\(gap \?\? 0, 2 \* r \+ 1\);/);
    // every authored pair already keeps gap ≥ 2r (the guard is a backstop)
    for (const m of s.matchAll(/<Pair [^>]*r=\{([\d.]+)\} gap=\{([\d.]+)\}/g)) {
      assert.ok(Number(m[2]) >= 2 * Number(m[1]), m[0]);
    }
    for (let i = 0; i < 4; i++) assert.match(s, new RegExp(`color=\\{CAT_PAIR_COLORS\\[${i}\\]\\}`));
    // the speaker pair: r 17 at ±17.5 → 35 apart ≥ 34
    assert.match(s, /<Insulated cx=\{C - 17\.5\} cy=\{C\} r=\{17\}/);
    assert.match(s, /<Insulated cx=\{C \+ 17\.5\} cy=\{C\} r=\{17\}/);
  });

  it('R3-CS-05 the ground pin bonds the chassis to earth so a fault trips the breaker', () => {
    const s = lab('connectorselect/data/practice.ts');
    assert.doesNotMatch(s, /keeps a fault from energizing chassis/);
    assert.match(s, /The ground pin bonds the chassis to earth, so a fault trips the breaker/);
  });

  it('R3-CS-S3 the DI answer is drawn as two cables through a DI box, not one TS–XLR cable', () => {
    const a = scen('s03_guitar_di').choices.find((c) => c.verdict === 'correct')!;
    assert.equal(a.via, 'DI box');
    assert.match(lab('connectorselect/pagesC.tsx'), /\{c\.via \? \(/);
  });

  it('R3-CS-S3 the speakON choice owns up to adapters on both ends', () => {
    const b = scen('s06_mixer_powered').choices.find((c) => c.id === 'b')!;
    assert.equal(b.name, 'speakON speaker cable with adapters on both ends');
    assert.equal(b.a, 'speakon_nl4');
    assert.equal(b.b, 'speakon_nl4');
    assert.match(b.explain, /needs an adapter at BOTH ends just to fit/);
  });

  it('R3-CS-S3 speaker runs carry a speaker-level signal, not "AMPLIFIER POWER, not signal"', () => {
    assert.doesNotMatch(lab('connectorselect/pagesA.tsx'), /AMPLIFIER POWER, not signal/);
    assert.match(lab('connectorselect/pagesA.tsx'), /carries a speaker-level signal/);
    const all = JSON.stringify(SCENARIOS);
    assert.doesNotMatch(all, /amplifier POWER/);
    assert.match(scen('s07_amp_passive').brief, /speaker-level signal/);
  });

  it('R3-CS-S3 the plug-dimension comment matches the true-scale SHAFT table', () => {
    const s = lab('connectorselect/art.tsx');
    assert.match(s, /const SHAFT = \{ tipBall: 8\.6, neckEnd: 11, ins1: 13\.5, ring: 18\.5, ins2: 21, sleeve: 31 \} as const;/);
    assert.doesNotMatch(s, /tip 8 \(ball \+ neck groove\)/);
    assert.doesNotMatch(s, /sleeve 13;/);
    assert.match(flat(s), /tip ball 8\.6 \+ neck groove to 11, \* insulator 2\.5 \(to 13\.5\), ring 5 \(to 18\.5\), insulator 2\.5 \(to 21\), \* sleeve 10 \(to 31\)/);
  });
});

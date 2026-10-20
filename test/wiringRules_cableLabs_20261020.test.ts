/**
 * Wiring A-grade audit, Phase 2 (owner go 2026-10-20) — automatic checks for
 * the cable-focused labs against the rule book
 * (docs/wiring/WIRING_RULEBOOK_DRAFT_2026_10_20.md; rule ids in each title).
 *
 * The connector records (src/screens/lab/cable/data/*) are the wiring truth
 * the Cable, Connector Select and Patchbay labs teach from, so every pin role
 * is checked here against the standard, and the two standalone lab validators
 * (written for tsx) now run in the suite too.
 *
 * KNOWN_FINDINGS lists what the audit found that is not yet fixed (owner
 * decisions pending, docs/wiring/WIRING_FINDINGS_2026_10_20.md). It may only
 * SHRINK: a new violation fails, and so does a fixed one still listed.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONNECTORS, getConnector } from '../src/screens/lab/cable/data/registry.ts';
import { TESTER_CABLES } from '../src/screens/lab/cable/data/testerCables.ts';

const root = join(import.meta.dirname, '..');
const pin = (id: string, variant: string, label: string) => {
  const p = getConnector(id as never)?.pinouts.find((v) => v.id === variant);
  assert.ok(p, `${id}/${variant} exists`);
  const c = p!.contacts.find((x) => x.label === label);
  assert.ok(c, `${id}/${variant} has contact ${label}`);
  return c!;
};

describe('lab validators run in the suite', () => {
  for (const s of ['scripts/validateCableLab.ts', 'scripts/validateCableInstallLab.ts']) {
    it(`${s} passes`, () => {
      // throws (non-zero exit) on any violation, with the list in stderr
      execFileSync(process.execPath, [join(root, 'test/support/extlessLoader.mjs'), s], { cwd: root, stdio: 'pipe' });
    });
  }
});

describe('C1/C3 balanced polarity is the same everywhere: pin 2 / tip / + = hot, pin 3 / ring / − = cold', () => {
  const HOT = /^Signal \+/;
  const COLD = /^Signal −/;
  for (const c of CONNECTORS) {
    for (const p of c.pinouts) {
      const hot = p.contacts.filter((x) => HOT.test(x.role));
      const cold = p.contacts.filter((x) => COLD.test(x.role));
      if (!hot.length && !cold.length) continue;
      it(`${c.id}/${p.id}`, () => {
        assert.equal(hot.length, 1, 'one hot contact');
        assert.equal(cold.length, 1, 'one cold contact');
        assert.ok(['2', 'Tip', '+'].includes(hot[0].label), `hot on ${hot[0].label}`);
        assert.ok(['3', 'Ring', '−'].includes(cold[0].label), `cold on ${cold[0].label}`);
        assert.equal(hot[0].ink, 'signalPos');
        assert.equal(cold[0].ink, 'signalNeg');
        const shield = p.contacts.find((x) => x.label === '1' || x.label === 'Sleeve' || x.label === 'S');
        assert.ok(shield && shield.ink === 'shield', 'pin 1 / sleeve / S is the shield');
      });
    }
  }
});

describe('pinouts match their standards', () => {
  it('C1 XLR-3 analog: 1 shield, 2 +, 3 −', () => {
    assert.equal(pin('xlr3', 'balanced_analog', '1').ink, 'shield');
    assert.match(pin('xlr3', 'balanced_analog', '2').role, /^Signal \+/);
    assert.match(pin('xlr3', 'balanced_analog', '3').role, /^Signal −/);
  });
  it('C6 stereo TRS (¼" and 3.5 mm): tip = left, ring = right, sleeve = common', () => {
    for (const id of ['trs_quarter', 'trs_35']) {
      assert.match(pin(id, 'unbalanced_stereo', 'Tip').role, /^Left/);
      assert.match(pin(id, 'unbalanced_stereo', 'Ring').role, /^Right/);
      assert.match(pin(id, 'unbalanced_stereo', 'Sleeve').role, /Common/);
    }
  });
  it('C5 insert is taught as tip = send, ring = return, and marked equipment-dependent', () => {
    const p = getConnector('trs_quarter' as never)!.pinouts.find((v) => v.id === 'insert')!;
    assert.equal(p.confidence, 'equipment-dependent');
    assert.match(pin('trs_quarter', 'insert', 'Tip').role, /^Send/);
    assert.match(pin('trs_quarter', 'insert', 'Ring').role, /^Return/);
  });
  it('C7 speakON: 1+ = speaker +, 1− = speaker −; every speaker + / − contact uses the speaker inks', () => {
    assert.equal(pin('speakon_nl4', 'full_range_1ch', '1+').ink, 'speakerPos');
    assert.equal(pin('speakon_nl4', 'full_range_1ch', '1−').ink, 'speakerNeg');
    for (const c of CONNECTORS) for (const p of c.pinouts) for (const x of p.contacts) {
      if (/^Loudspeaker \+|^Circuit \d \+/.test(x.role)) assert.equal(x.ink, 'speakerPos', `${c.id}/${p.id} ${x.label}`);
      if (/^Loudspeaker −|^Circuit \d −/.test(x.role)) assert.equal(x.ink, 'speakerNeg', `${c.id}/${p.id} ${x.label}`);
    }
  });
  it('C9 AES3 on XLR is a data pair on pins 2/3 with the shield on 1', () => {
    assert.equal(pin('xlr3', 'aes3_digital', '1').ink, 'shield');
    assert.equal(pin('xlr3', 'aes3_digital', '2').ink, 'dataA');
    assert.equal(pin('xlr3', 'aes3_digital', '3').ink, 'dataB');
  });
  it('C10 MIDI DIN-5: pin 4 current source, pin 5 data line, pin 2 shield', () => {
    assert.match(pin('midi_din5', 'midi_current_loop', '4').role, /source/i);
    assert.match(pin('midi_din5', 'midi_current_loop', '5').role, /data/i);
    assert.match(pin('midi_din5', 'midi_current_loop', '2').role, /shield/i);
  });
  it('C11 USB 2.0 A/B: 1 VBUS, 2 D−, 3 D+, 4 GND', () => {
    for (const [id, v] of [['usb_a', 'usb_a_data_power'], ['usb_b', 'usb_b_data_power']] as const) {
      assert.match(pin(id, v, '1').role, /^VBUS/);
      assert.match(pin(id, v, '2').role, /^D−/);
      assert.match(pin(id, v, '3').role, /^D\+/);
      assert.match(pin(id, v, '4').role, /^GND/);
    }
  });
  it('C12 T568B colour order', () => {
    const want = ['white/orange', 'orange', 'white/green', 'blue', 'white/blue', 'green', 'white/brown', 'brown'];
    want.forEach((col, i) => assert.match(pin('ethernet_8p8c', 't568b', String(i + 1)).role, new RegExp(`— ${col} \\(T568B\\)`), `pin ${i + 1}`));
  });
  it('G2 NEMA 5-15: narrow blade = line, wide blade = neutral, round pin = protective earth', () => {
    assert.equal(pin('mains_wall', 'nema_5_15', 'Narrow blade').ink, 'lineHot');
    assert.equal(pin('mains_wall', 'nema_5_15', 'Wide blade').ink, 'neutral');
    assert.equal(pin('mains_wall', 'nema_5_15', 'Round pin').ink, 'groundEarth');
  });
});

describe('cable tester maps', () => {
  it('expected and measured maps line up row for row (the tester zips them by index)', () => {
    for (const t of TESTER_CABLES) {
      assert.equal(t.expectedMap.length, t.actualMap.length, t.id);
      t.expectedMap.forEach((r, i) => assert.equal(t.actualMap[i].path, r.path, `${t.id} row ${i}`));
      const differs = t.expectedMap.some((r, i) => r.value !== t.actualMap[i].value);
      // a fault shows in at least one row; the control cable (no_fault) matches everywhere
      assert.equal(differs, t.faultId !== 'no_fault', `${t.id}: map ${differs ? 'differs' : 'matches'}, fault ${t.faultId}`);
    }
  });
});

/** Findings the audit made that are not yet fixed (owner decisions pending). May only shrink. */
const KNOWN_FINDINGS = {
  // C2: an output wall jack described as a FEMALE XLR (WF-CS-02)
  femaleXlrOut: ['connectorselect/pagesB.tsx', 'connectorselect/data/assessment.ts'],
};

describe('C2 an XLR output is male: no “… OUT” jack is described as a female XLR', () => {
  const files = ['connectorselect/pagesA.tsx', 'connectorselect/pagesB.tsx', 'connectorselect/pagesC.tsx', 'connectorselect/pagesD.tsx', 'connectorselect/data/assessment.ts', 'connectorselect/data/scenarios.ts', 'connectorselect/data/practice.ts', 'cable/data/lesson11.ts'];
  it('only the listed known findings remain', () => {
    const hits = files.filter((f) => /\bOUT\b[^.]{0,80}female XLR|female XLR[^.]{0,40}\bOUT\b/.test(readFileSync(join(root, 'src/screens/lab', f), 'utf8')));
    assert.deepEqual(hits.sort(), [...KNOWN_FINDINGS.femaleXlrOut].sort());
  });
});

/**
 * Wiring A-grade audit, round 2 (owner go 2026-10-20; art fixes approved the
 * same night) — group "r2_cable": Cable & Connector Fundamentals, Connector
 * Select, Patchbay and Cable Install. The finding id is in each title. Each
 * assertion fails if the wrong wording, logic or geometry comes back.
 * Source-reading where the module imports Skia or RN.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const { CONTACT_OPEN_AT, contactsOpen, resolvePair } = await import('../src/screens/lab/patchbay/engine/patchbay.ts');
const { CI_CABLE_TYPES, CI_CLASS_KEY, CI_CLASS_TINTS } = await import('../src/screens/lab/cableinstall/data/cableTypes.ts');

const root = join(import.meta.dirname, '..');
const lab = (rel: string) => readFileSync(join(root, 'src/screens/lab', rel), 'utf8');
/** Every quoted string / JSX text run of a file, joined — "learner text". */
const flat = (s: string) => s.replace(/\s+/g, ' ');

describe('Cable & Connector Fundamentals', () => {
  it('CB-R2-01 balanced figure: equal impedance, not only an inverted pin 3', () => {
    const s = flat(lab('cable/lessons/lesson03.tsx'));
    assert.match(s, /Some drive only pin 2 and hold pin 3 at the same impedance to ground/);
    assert.match(s, /Equal impedance on the two legs is what makes a line balanced/);
  });
  it('CB-R2-02 headphone level: voltage near line level, the difference is current', () => {
    const s = lab('cable/data/lesson11.ts');
    assert.doesNotMatch(s, /more than line level demands/);
    assert.match(s, /voltage is often near line level; the difference is the current/);
  });
  it('CB-R2-03 instrument level is "usually" between mic and line; active pickups can reach line', () => {
    const l8 = lab('cable/data/lesson08.ts');
    assert.doesNotMatch(l8, /hint: 'Stronger than mic level, weaker than line level/);
    assert.match(l8, /Usually stronger than mic level and weaker than line level \(active pickups can reach line level\)/);
    const l11 = lab('cable/data/lesson11.ts');
    assert.doesNotMatch(l11, /A pickup’s output is stronger than mic level/);
  });
  it('CB-R2-04 loudspeaker runs are not "unbalanced by nature"; the issue is current', () => {
    for (const f of ['lesson11.ts', 'lesson04.ts', 'lesson05.ts', 'lesson08.ts', 'lesson12.ts']) {
      assert.doesNotMatch(lab(`cable/data/${f}`), /unbalanced by nature/i, f);
    }
    assert.match(lab('cable/data/lesson11.ts'), /Noise is not the issue at loudspeaker level[^']*The issue is CURRENT/);
  });
  it('CB-R2-05 USB roles: A/B shapes fix the role; on USB-C to USB-C the roles are negotiated', () => {
    const s = lab('cable/data/lesson11.ts');
    assert.doesNotMatch(s, /Type-A \(or C\) marks the HOST end/);
    assert.doesNotMatch(s, /host and peripheral can never be confused/);
    assert.doesNotMatch(s, /A or C faces the host/);
    assert.equal((s.match(/On a USB-C to USB-C cable either end can be host|Only on a USB-C to USB-C cable can either end be host/g) ?? []).length, 2);
  });
});

describe('Connector Select', () => {
  it('CS-R2-01 balanced stereo: four signal contacts plus the shield (5-pin XLR) or two cables', () => {
    const s = lab('connectorselect/data/jobs.ts');
    assert.doesNotMatch(s, /balanced stereo needs two balanced connections/);
    assert.doesNotMatch(s, /each with its own shield/);
    assert.equal((s.match(/four signal contacts plus the shield \(a 5-pin XLR, for example\) or two cables/g) ?? []).length, 2);
  });
  it('CS-R2-02 a PLAIN wired adapter changes only the shape; pads, transformers and DIs do convert', () => {
    const practice = lab('connectorselect/data/practice.ts');
    const scen = lab('connectorselect/data/scenarios.ts');
    for (const [name, s] of [['practice', practice], ['scenarios', scen]] as const) {
      assert.doesNotMatch(s, /A passive adapter/, name);
      assert.doesNotMatch(s, /An adapter never converts/, name);
      assert.doesNotMatch(s, /an adapter converts fit, never/, name);
    }
    assert.equal((practice.match(/A pad, a matching transformer or a DI is a different part that does convert, chosen for that job\./g) ?? []).length, 2);
  });
  it('CS-R2-03 the speakON-into-line choice is the one MOST likely to damage gear (b and c are unsafe too)', () => {
    const s = lab('connectorselect/data/scenarios.ts');
    assert.doesNotMatch(s, /the one tray choice that risks equipment/);
    assert.match(s, /the tray choice most likely to damage equipment directly/);
  });
  it('CS-R2-04 a TS plug in a balanced TRS output grounds the output’s cold leg', () => {
    assert.match(lab('connectorselect/data/scenarios.ts'), /At the interface end the TS sleeve also grounds the output’s cold leg — some balanced outputs do not like that, so check the manual/);
  });
});

describe('Patchbay', () => {
  it('PB-R2-01 at full insertion the tip spring rests in the TIP’s neck groove, and opens at CONTACT_OPEN_AT', () => {
    const s = lab('patchbay/art/JackCutaway.tsx');
    // The geometry this assertion re-derives must still be the file's own.
    assert.match(s, /const tipXAt = \(insertion: number\) => 26 \+ insertion \* 122;/);
    assert.match(s, /const FINGER_REST_Y = 99;/);
    assert.match(s, /const FINGER_X = tipXAt\(CONTACT_OPEN_AT\) \+ 1 - 9 \* \(\(103 - FINGER_REST_Y\) \/ 11\) \*\* 2;/);
    assert.match(s, /if \(rel >= -23 && rel <= -15\) return 96;/);
    const tipXAt = (i: number) => 26 + i * 122;
    const fingerX = tipXAt(CONTACT_OPEN_AT) + 1 - 9 * ((103 - 99) / 11) ** 2;
    const relFull = fingerX - tipXAt(1);
    assert.ok(relFull >= -23 && relFull <= -15, `finger at tip-relative ${relFull.toFixed(2)} — must be in the neck groove (−23 … −15; ¼-inch plug, B-PB-01), not on the ring or sleeve`);
    assert.equal(contactsOpen(CONTACT_OPEN_AT - 0.01), false);
    assert.equal(contactsOpen(1), true);
  });
  it('PB-R2-02 the top-breaking page says the INPUT jack breaks; no "genuine half-normalled-TOP design"', () => {
    const d = flat(lab('patchbay/pagesD.tsx'));
    assert.doesNotMatch(d, /genuine half-normalled-TOP design/);
    assert.doesNotMatch(d, /manufacturers document both/);
    assert.match(d, /Real top-breaking bays are usually wired with their INPUTS on top, so the input jack still breaks/);
    assert.match(d, /on a half-normal pair the INPUT jack breaks and the output jack taps/);
    // the engine still models the drawn case: outputs on top, top breaks → the clash
    assert.equal(resolvePair({ config: 'half', breakSide: 'top', topPlugged: false, bottomPlugged: true }).isMerge, true);
  });
  it('PB-R2-03 no patch-panel maker names in learner text (code comments only)', () => {
    const strip = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const f of ['pagesA.tsx', 'pagesB.tsx', 'pagesC.tsx', 'pagesD.tsx']) {
      assert.doesNotMatch(strip(lab(`patchbay/${f}`)), /Neutrik|Bittree|Behringer|Samson|\bART and\b/, f);
    }
    assert.match(flat(lab('patchbay/pagesB.tsx')), /Patch-panel maker documentation and patchbay manuals/);
  });
  it('PB-R2-04 the page-5 cutaway says where the switch sits on the common half-normal bay', () => {
    assert.match(flat(lab('patchbay/pagesA.tsx')), /On the common half-normal bay this switch sits in the bottom \(input\) jack instead/);
  });
  it('PB-R2-05 the clash is drawn in hazard ink, not healthy green', () => {
    const s = lab('patchbay/art/PatchPairView.tsx');
    assert.match(s, /color=\{flow\.isMerge \? PB\.hazard : /);
    assert.match(s, /flow\.isMerge && \{ color: PB\.hazard \}/);
  });
});

describe('Cable Install', () => {
  it('CI-R2-01 the class key names coax with the white tint it is drawn in', () => {
    const coax = CI_CABLE_TYPES.find((t: { id: string }) => t.id === 'coax');
    assert.equal(coax.tint, CI_CLASS_TINTS.control);
    assert.match(CI_CLASS_KEY, /white = control and coax/);
  });
  it('CI-R2-02 the network horizontals dash on behind the panel to their punch-downs', () => {
    const s = lab('cableinstall/scenes/RackScene.tsx');
    assert.match(s, /function NetTail\(\{ isL \}: \{ isL: boolean \}\)/);
    assert.match(s, /railYOf\('g-net', isL, `h\$\{i \+ 1\}`\)/);
    assert.match(s, /d=\{`M\$\{x0\} \$\{ly\} H\$\{PATCH_XS\[i\]\}/);
    assert.match(s, /return <NetTail isL=\{isL\} \/>/);
  });
  it('CI-R2-03 PoE cable is used in portable and permanent work', () => {
    assert.equal(CI_CABLE_TYPES.find((t: { id: string }) => t.id === 'poe').use, 'both');
  });
});

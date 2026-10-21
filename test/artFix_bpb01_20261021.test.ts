/**
 * Art fix B-PB-01 (Comp B, S1; owner go 2026-10-21): the Patchbay lab's bay is
 * a 1U 48-point ¼-inch TRS bay, so every patch plug it draws — the jack
 * cutaway's plug and the patch pair's loose cord plugs — is a ¼-inch TRS patch
 * plug at true proportions, never TT/bantam; the T·R·S page says so, and the
 * tip spring still rests in the tip's neck groove at full insertion.
 * Source-reading: the art modules import react-native-svg.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const { CONTACT_OPEN_AT, contactsOpen } = await import('../src/screens/lab/patchbay/engine/patchbay.ts');

const root = join(import.meta.dirname, '..');
const lab = (rel: string) => readFileSync(join(root, 'src/screens/lab/patchbay', rel), 'utf8');
const flat = (s: string) => s.replace(/\s+/g, ' ');

describe('B-PB-01 ¼-inch TRS patch plugs on a ¼-inch bay', () => {
  it('the cutaway plug is ¼-inch: 22-unit (6.35 mm) shaft, 111 units (32 mm) nose to handle face, ¼-inch bands', () => {
    const s = lab('art/JackCutaway.tsx');
    assert.doesNotMatch(s, /TT anatomy|the TT tip|TT handle/);
    assert.match(s, /a ¼-inch TRS patch plug, matching the bay's ¼-inch jacks/);
    // shaft 22 units across (6.35 mm at ≈ 3.46 units/mm)
    assert.match(s, /tipX - 110\)\} y=\{92\} width=\{Math\.max\(0, tipX - 60 - Math\.max\(-6, tipX - 110\)\)\} height=\{22\}/);
    // insulator 10, ring 17, insulator 10 (2.9 / 4.9 / 2.9 mm)
    assert.match(s, /x=\{tipX - 60\} y=\{92\.4\} width=\{10\}/);
    assert.match(s, /x=\{tipX - 50\} y=\{92\} width=\{17\}/);
    assert.match(s, /x=\{tipX - 33\} y=\{92\.4\} width=\{10\}/);
    // the handle face sits on the front panel (x 38) at full insertion
    assert.match(s, /\$\{tipX - 110\} 89 L \$\{tipX - 110\} 117/);
    assert.equal(26 + 1 * 122 - 110, 38);
  });
  it('the tip spring rests mid-groove at full insertion and opens exactly at CONTACT_OPEN_AT', () => {
    const s = lab('art/JackCutaway.tsx');
    assert.match(s, /if \(rel >= -23 && rel <= -15\) return 96;/);
    assert.match(s, /M \$\{tipX - 23\} 96 L \$\{tipX - 15\} 96/);
    const tipXAt = (i: number) => 26 + i * 122;
    const fingerX = tipXAt(CONTACT_OPEN_AT) + 1 - 9 * ((103 - 99) / 11) ** 2;
    const rel = fingerX - tipXAt(1);
    // the dimple is ±2.4 wide: all of it inside the groove (−23 … −15)
    assert.ok(rel - 2.4 >= -23 && rel + 2.4 <= -15, `dimple at ${rel.toFixed(2)} not fully in the groove`);
    assert.equal(CONTACT_OPEN_AT, 0.85);
    assert.equal(contactsOpen(CONTACT_OPEN_AT - 0.01), false);
    assert.equal(contactsOpen(1), true);
  });
  it('the loose cord plug is ¼-inch TRS (5 : 1 shaft), not TT', () => {
    const s = lab('art/gearArt.tsx');
    assert.doesNotMatch(s, /A loose TT patch-cord plug/);
    assert.match(s, /A loose ¼-inch TRS patch-cord plug/);
    assert.match(s, /<Rect x=\{s\} y=\{y - 1\.65\} width=\{7\.5\} height=\{3\.3\}/);
    assert.match(s, /\$\{s \+ 16\.6\} \$\{y\}/);
    assert.ok(16.6 / 3.3 > 4.8 && 16.6 / 3.3 < 5.2);
  });
  it('the T·R·S page names the driven plug as ¼-inch TRS and TT as a separate family', () => {
    const d = flat(lab('pagesD.tsx'));
    assert.doesNotMatch(d, /A TT \(bantam\) plug packs the same three into a smaller frame\. The switching/);
    assert.match(d, /The plug you have been driving is a ¼-inch TRS patch plug, the kind this bay's jacks take\./);
    assert.match(d, /TT \(bantam\) is a separate, smaller family .* a TT plug does not fit a ¼-inch jack\./);
  });
});

/**
 * Owner 2026-10-31: "top-left everywhere" — the HOME key sits top-left on
 * every screen. CompactBrandBar (Labs, Ear Lab, Tools hub, Awards/Enrollments)
 * used to put it on the right; it now leads the row, before the logo, and the
 * `right` slot is only the per-screen help key.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(join(process.cwd(), 'src', p), 'utf8').replace(/\r\n/g, '\n');

describe('HOME is top-left on every screen (owner 2026-10-31)', () => {
  it('CompactBrandBar draws HOME before the logo and before the right slot', () => {
    const s = read('components/CompactBrandBar.tsx');
    const body = s.slice(s.indexOf('return ('));
    const home = body.indexOf('<NavIcon icon="Home" lit />');
    const logo = body.indexOf('<BrandLogo');
    const right = body.indexOf('{right}');
    assert.ok(home > 0, 'HOME key present');
    assert.ok(home < logo, 'HOME comes before the logo');
    assert.ok(home < right, 'HOME comes before the right slot');
    assert.equal(body.split('icon="Home"').length - 1, 1, 'exactly one HOME key');
  });
  it('the Glossary HOME key still leads its header row', () => {
    const s = read('screens/glossary/GlossaryScreen.tsx');
    const header = s.slice(s.indexOf('<View style={styles.header}>'));
    assert.ok(header.indexOf('icon="Home"') < header.indexOf('GLOSSARY</Text>'));
  });
});

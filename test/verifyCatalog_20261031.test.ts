/**
 * Owner 2026-10-31: the website verification pages carry a catalog of every
 * credential ("What our credentials include"), and each credential title in
 * the holder's list links to its catalog entry. Must-do D34 (deploy) / D35
 * (labs, waiting on Comp A).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(join(process.cwd(), 'web', p), 'utf8').replace(/\r\n/g, '\n');

describe('website verification catalog (owner 2026-10-31)', () => {
  it('both verification pages show the catalog', () => {
    assert.match(read('components/VerifyResult.tsx'), /<CredentialCatalog \/>/);
    assert.match(read('components/RegistryResult.tsx'), /<CredentialCatalog \/>/);
  });
  it('holder titles link to the catalog anchor built the same way as the catalog ids', () => {
    const g = read('components/CertificateGallery.tsx');
    assert.match(g, /href=\{`#\$\{catalogAnchor\(c\.credential_type, c\.credential_name\)\}`\}/);
    const c = read('lib/catalog.ts');
    assert.match(c, /anchor: catalogAnchor\("certificate", c\.name\)/);
    assert.match(c, /anchor: catalogAnchor\("program", p\.name\)/);
  });
  it('the catalog reads live tables, pages past the 1000-row cap, and keeps core topics out of each entry', () => {
    const c = read('lib/catalog.ts');
    for (const t of ['certificates', 'certificate_topics', 'programs', 'program_topics', 'achievements']) {
      assert.ok(c.includes(`"${t}"`), t);
    }
    assert.match(c, /\.range\(from, from \+ 999\)/);
    assert.match(c, /!CORE_TOPIC_GS\.includes\(r\.gs\)/);
  });
  it('core topics match the app (COREQ_TOPIC_GS)', () => {
    const app = readFileSync(join(process.cwd(), 'src/screens/awards/awardsData.ts'), 'utf8');
    const appCore = app.match(/COREQ_TOPIC_GS: number\[\] = \[([^\]]+)\]/)![1].replace(/\s/g, '');
    const web = read('lib/catalog.ts').match(/CORE_TOPIC_GS = \[([^\]]+)\]/)![1].replace(/\s/g, '');
    assert.equal(web, appCore);
  });
});

describe('catalog starts collapsed (owner 2026-10-31)', () => {
  it('expanded defaults to false; a title link opens it', () => {
    const s = readFileSync(join(process.cwd(), 'web', 'components/CredentialCatalog.tsx'), 'utf8').replace(/\r\n/g, '\n');
    assert.match(s, /useState\(false\)/);
    assert.match(s, /setExpanded\(true\);\n\s+setTab\(entry\.kind\)/);
    assert.match(s, /\{expanded \? \(/);
  });
});

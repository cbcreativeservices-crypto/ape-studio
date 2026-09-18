/**
 * The Level 1 credential has ONE name: "Specialization Certificate".
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────────────
 *
 * Owner ruling, 2026-09-18 (D4): "it should always be 'Specialization
 * Certificate'". Before that ruling the product used two names for the same
 * thing — the Awards page headline and the printed certificate said
 * "Specialization", while the thumbnail eyebrow, the detail modal and the
 * picker button said "SPECIALIZED CERTIFICATE".
 *
 * That is not a typo, it is a credential with two names. A learner sees one
 * word on the card in their Awards list and a different word on the PDF they
 * hand an employer, and an employer asked to verify "a Specialized Certificate"
 * finds nothing by that name. The whole point of the Final Exam work is that
 * this credential means something to someone outside the app.
 *
 * The check is a plain substring scan rather than a per-file assertion, because
 * the failure mode is someone adding a NEW screen with the old word — which no
 * amount of pinning the five known sites would catch.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const SRC = new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

function sources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) sources(path, out);
    else if (/\.tsx?$/.test(path)) out.push(path);
  }
  return out;
}

describe('the Level 1 credential is named consistently', () => {
  const files = sources(SRC);

  it('the scan actually found the source tree', () => {
    // Without this, a broken path makes every assertion below pass vacuously.
    assert.ok(files.length > 200, `expected the whole src tree, found ${files.length} files`);
  });

  it('nothing says "Specialized Certificate" — the name is "Specialization Certificate"', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      text.split('\n').forEach((line, i) => {
        if (/specialized\s+certificate/i.test(line)) {
          offenders.push(`${file.slice(SRC.length)}:${i + 1}  ${line.trim()}`);
        }
      });
    }
    assert.deepEqual(
      offenders,
      [],
      'owner ruling D4 — the Level 1 credential is always "Specialization Certificate":\n  ' +
        offenders.join('\n  '),
    );
  });

  it('the name the learner actually sees is present in the three places it matters', () => {
    // Guards the other direction: a well-meaning "cleanup" that deletes the
    // eyebrow entirely would satisfy the scan above while losing the name.
    const thumb = readFileSync(join(SRC, 'screens/awards/CredentialThumb.tsx'), 'utf8');
    const awards = readFileSync(join(SRC, 'screens/awards/awardsData.ts'), 'utf8');
    const html = readFileSync(join(SRC, 'features/credentials/certificateHtml.ts'), 'utf8');
    assert.match(thumb, /SPECIALIZATION CERTIFICATE/, 'the card eyebrow');
    assert.match(awards, /SPECIALIZATION CERTIFICATE/, 'the Awards page headline');
    assert.match(html, /'Specialization'/, 'the kicker printed on the certificate itself');
  });
});

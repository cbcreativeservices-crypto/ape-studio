/**
 * Certificate download file name (owner 2026-10-25: "i got a crazy garbled mess
 * of a name for the file"). expo-print saves under a random id; exportCertificate
 * now copies the PDF to a readable name before the share sheet opens.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { certificateFileName } from '../src/features/credentials/certificateFileName.ts';

test('holder, credential and academy, readable', () => {
  assert.equal(
    certificateFileName('Jane Doe', 'Live Sound System Engineer', 'certificate'),
    'Jane Doe - Live Sound System Engineer Certificate - Pro Audio Training Academy.pdf',
  );
  assert.equal(
    certificateFileName('Jane Doe', 'Studio Recording', 'program'),
    'Jane Doe - Studio Recording Program - Pro Audio Training Academy.pdf',
  );
});

test('accents folded, curly quotes and unsafe characters dropped', () => {
  assert.equal(
    certificateFileName('Channing “Cháno” Booth', 'ADR & Voice Recording', 'certificate'),
    'Channing Chano Booth - ADR & Voice Recording Certificate - Pro Audio Training Academy.pdf',
  );
  assert.equal(
    certificateFileName('O’Brien', 'A/B: Mixing? <Pro>', 'certificate'),
    "O'Brien - A B Mixing Pro Certificate - Pro Audio Training Academy.pdf",
  );
});

test('no name set leaves the holder out; no doubled "Certificate"', () => {
  assert.equal(
    certificateFileName(null, 'Amplifier Technology', 'certificate'),
    'Amplifier Technology Certificate - Pro Audio Training Academy.pdf',
  );
  assert.equal(
    certificateFileName('Jo', 'Advanced Certificate', 'certificate'),
    'Jo - Advanced Certificate - Pro Audio Training Academy.pdf',
  );
});

test('exportCertificate shares the renamed copy, not the random-id file', () => {
  const s = readFileSync(join(process.cwd(), 'src/features/credentials/certificatePdf.ts'), 'utf8').replace(/\r\n/g, '\n');
  assert.match(s, /const uri = await withReadableName\(printed, certificateFileName\(holderName, req\.credentialName, req\.awardType\)\)/);
  assert.match(s, /share\.shareAsync\(uri\.startsWith/);
});

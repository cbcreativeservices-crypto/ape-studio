/**
 * Sample certificate watermark (owner 2026-10-25, option B): every sample
 * certificate (Progress tile, credential wall, full view, Get Discovered) shows a
 * charcoal "SAMPLE · NOT FOR PRINT" sash from lower-left through the seal, and
 * the seal is softened (33% of the mock's blur). The QR stays sharp: it opens
 * the default registry page. The mark is baked into the image so a screenshot
 * or print keeps it. Rendered at 3x from the vector PDF so the full view is sharp.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

test('the sample certificate is the 3x watermarked render, same 486:375 shape', () => {
  const b = readFileSync(join(process.cwd(), 'assets/YOUR_NAME_certificate_SAMPLE_web.webp'));
  assert.equal(b.toString('ascii', 0, 4), 'RIFF');
  assert.equal(b.toString('ascii', 8, 12), 'WEBP');
  assert.equal(b.toString('ascii', 12, 16), 'VP8 ');
  const w = b.readUInt16LE(26) & 0x3fff;
  const h = b.readUInt16LE(28) & 0x3fff;
  assert.equal(w, 486 * 3);
  assert.equal(h, 375 * 3);
});

test('the certificate is signed Channing “Cháno” Booth, Founder & Curriculum Director (owner 2026-10-25)', () => {
  const s = readFileSync(join(process.cwd(), 'src/features/credentials/certificateHtml.ts'), 'utf8').replace(/\r\n/g, '\n');
  assert.match(s, /<div class="signature-name">Channing “Cháno” Booth<\/div><div class="signature-role">Founder &amp; Curriculum Director<\/div>/);
  assert.doesNotMatch(s, /Program Director/);
});

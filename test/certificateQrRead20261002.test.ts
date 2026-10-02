/**
 * A printed certificate never loses its verification QR to a network blip
 * (full-app run 2, 2026-10-02): the export reads the token through a variant
 * that THROWS on a failed read, so exportCertificate's catch refuses
 * ({ok:false, reason:'failed'}) instead of printing a card with no QR.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

describe('certificate QR token read', () => {
  it('the export uses the throwing token read', () => {
    const src = read('src/features/credentials/certificatePdf.ts');
    assert.match(src, /Promise\.all\(\[fetchMyRegistryName\(\), fetchMyQrTokenOrThrow\(\)\]\)/);
    assert.doesNotMatch(src, /fetchMyQrToken\(\)/);
  });
  it('the throwing read throws on an RPC error and answers null only for no token', () => {
    const src = read('src/features/profile/api.ts');
    const fn = src.slice(src.indexOf('export async function fetchMyQrTokenOrThrow'));
    assert.match(fn, /if \(error\) throw new Error/);
    assert.doesNotMatch(fn.slice(0, fn.indexOf('\n}')), /catch/);
  });
});

/**
 * Trophy Case certificates (owner 2026-10-23): the Share card shows a small
 * certificate and opens Certificates; with none earned the wall shows a
 * SAMPLE that opens the certificate window; the window's share row sits BELOW
 * the art (it was clipped inside the art frame); full-screen landscape view.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const rd = (p: string) => readFileSync(join(import.meta.dirname, '..', ...p.split('/')), 'utf8').replace(/\r\n/g, '\n');
const home = rd('src/screens/achievements/AchievementsHomeScreen.tsx');
const wall = rd('src/screens/achievements/CredentialWall.tsx');
const modal = rd('src/components/TrophyModal.tsx');

describe('certificate preview pass 2026-10-23', () => {
  // Superseded 2026-10-26 (owner): the Share card is no longer a button — it
  // holds the certificate, the QR and the Registry link. Pinned in
  // progressShareCard_20261026.test.ts; the SAMPLE is still its fallback.
  it('the Share card still falls back to the SAMPLE certificate', () => {
    assert.match(home, /YOUR_NAME_certificate_SAMPLE_web\.webp/);
  });
  it('a SAMPLE shows only while no certificate is earned, labelled as a sample', () => {
    assert.match(wall, /kind === 'certificate' && rows != null && rows\.length === 0/);
    assert.match(wall, /meta="SAMPLE · NOT EARNED"/);
    assert.match(wall, /action=\{null\}/);
  });
  it('the real share row is passed BELOW the art, not inside the clipped frame', () => {
    // `below` is a prop, so it is written BEFORE the children (the art image).
    const share = wall.indexOf('<CredentialShareRow');
    const art = wall.indexOf('source={credentialArtFor(open.slug)!}');
    assert.ok(share > 0 && art > 0 && share < art, 'share row is in `below`, above the art children');
    assert.equal(wall.split('<CredentialShareRow').length - 1, 1);
  });
  it('full-screen landscape view, closable, BACK closes it first', () => {
    assert.match(wall, /function CertificateFullView/);
    assert.match(wall, /transform: \[\{ rotate: '90deg' \}\]/);
    assert.match(modal, /onRequestClose=\{overlay && onOverlayClose \? onOverlayClose : onClose\}/);
  });
});

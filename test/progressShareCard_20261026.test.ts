/**
 * Owner change list 2026-10-26 (D0a, D0b, D0d):
 * - Progress order: Share your achievements, Certificates, Programs, Topics.
 * - The Certificates strip shows the REAL certificates (not badges); each one
 *   opens that certificate on the Certificates screen.
 * - Share your achievements is not a button: certificate + QR + Registry link
 *   (the website for someone with no account).
 * - The Certificates wall's left box, popup and full screen draw the real
 *   certificate from the same HTML the PDF prints.
 * - A popup with text under the image scrolls as ONE page (the iPhone topic
 *   popup was stubborn: a scroll inside a scroll).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const rd = (p: string) => readFileSync(join(import.meta.dirname, '..', ...p.split('/')), 'utf8').replace(/\r\n/g, '\n');
const home = rd('src/screens/achievements/AchievementsHomeScreen.tsx');
const wall = rd('src/screens/achievements/CredentialWall.tsx');
const render = rd('src/features/credentials/certificateRender.tsx');
const modal = rd('src/components/TrophyModal.tsx');
const about = rd('src/components/AboutPanel.tsx');
const app = rd('App.tsx');

describe('Progress share card + real certificates (owner 2026-10-26)', () => {
  // Order changed by the owner 2026-10-29 (the 2×2 redesign, approved in the
  // browser): TOPICS | LABS, CERTIFICATES | PROGRAMS, then the share card.
  it('order: topics, labs, certificates, programs, share', () => {
    const topics = home.indexOf('name="TOPICS"');
    const labs = home.indexOf('name="LABS"');
    const certs = home.indexOf('name="CERTIFICATES"');
    const progs = home.indexOf('name="PROGRAMS"');
    const share = home.indexOf('TROPHY_CASE_EMPTY.shareHead');
    assert.ok(topics > 0 && topics < labs && labs < certs && certs < progs && progs < share);
  });

  it('the share card is not a button and holds certificate, QR and link', () => {
    const start = home.indexOf('SHARE YOUR ACHIEVEMENTS — under the tiles');
    const end = home.indexOf('</ScrollView>', start);
    const card = home.slice(start, end);
    assert.match(card, /<View style=\{styles\.featured\}>/);
    assert.doesNotMatch(card, /navigation\.navigate/);
    assert.match(card, /<CertificateArt/);
    assert.match(card, /<CredentialQr/);
    assert.match(card, /url=\{qr\.guest \? REGISTRY_BASE_URL : undefined\}/);
    assert.match(card, /registryUrl\(qr\.token\)/);
    assert.match(card, /textDecorationLine|styles\.shareLink/);
  });

  it('each small certificate opens THAT certificate', () => {
    assert.match(home, /navigation\.navigate\('Certificates', \{ openId: cred\.id \}\)/);
    assert.match(wall, /route\.params\?\.openId/);
    assert.match(wall, /navigation\.setParams\(\{ openId: undefined \}\)/);
  });

  it('the wall draws the real certificate in the row, the popup and full screen', () => {
    assert.ok((wall.match(/<CertificateArt/g) ?? []).length >= 3);
    assert.match(wall, /cert=\{kind === 'certificate' \? certReq\(open\) : null\}/);
  });

  it('one renderer at a time, from the PDF HTML; cache drops on auth change', () => {
    assert.match(render, /buildCertificateHtml\(/);
    assert.match(render, /onAuthStateChange/);
    assert.match(render, /forgetCertificateRenders\(\)/);
    // Never at app start (start-graph cap): each certificate screen mounts one.
    assert.doesNotMatch(app, /certificateRender/);
    assert.match(home, /<CertificateRenderHost \/>/);
    assert.match(wall, /<CertificateRenderHost \/>/);
    assert.match(render, /const activeHost = \(\)/);
  });

  it('a popup with a panel scrolls as one page; the panel has no inner scroll there', () => {
    assert.match(modal, /if \(below\) \{[\s\S]*<ScrollView[\s\S]*<AboutPanelInline\.Provider value>/);
    assert.match(about, /const inline = useContext\(AboutPanelInline\)/);
    const inlineBranch = about.slice(about.indexOf('if (inline) {'), about.indexOf('return (', about.indexOf('if (inline) {') + 30));
    assert.doesNotMatch(inlineBranch, /ScrollView|onStartShouldSetResponder/);
  });
});

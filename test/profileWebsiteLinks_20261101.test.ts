/**
 * Profile › ON THE WEBSITE (owner 2026-11-01): direct links to the employer
 * page, credential verification, the mission and how credentials work.
 *
 * Ratchets:
 *  - every linked page exists in the website and is PUBLIC through the site
 *    gate (web/proxy.ts), so an employer or App Store reviewer never lands on
 *    the key screen;
 *  - both Profile faces (guest and signed in) show the links;
 *  - a failed open is handled (no unhandled rejection) and says where to go;
 *  - house copy rules: no upsell, no "free", no "recommend".
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { WEBSITE_LINKS, websiteLink } from '../src/features/profile/siteLinkList.ts';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

describe('Profile › ON THE WEBSITE', () => {
  it('links the employer page and verification first', () => {
    assert.deepEqual(WEBSITE_LINKS.slice(0, 2).map((l) => l[0]), ['employers', 'verify']);
    assert.equal(websiteLink('employers'), 'https://proaudiotrainingacademy.com/employers');
  });

  it('every linked page exists on the website', () => {
    for (const [path] of WEBSITE_LINKS) {
      assert.ok(existsSync(`web/app/${path}/page.tsx`), `web/app/${path}/page.tsx`);
    }
  });

  it('every linked page is public while the site gate is on', () => {
    const proxy = read('web/proxy.ts');
    for (const [path] of WEBSITE_LINKS) {
      assert.ok(proxy.includes(`legalPublic === "/${path}"`), `/${path} must be in the public list`);
    }
  });

  it('shows on both Profile faces, guest and signed in', () => {
    const src = read('src/screens/profile/ProfileScreen.tsx');
    assert.equal(src.match(/<WebsiteLinks \/>/g)?.length, 2);
  });

  it('a failed open is caught and names the page', () => {
    const src = read('src/features/profile/WebsiteLinks.tsx');
    assert.match(src, /Linking\.openURL\(websiteLink\(path\)\)\.catch\(/);
    assert.match(src, /in your browser/);
  });

  it('copy: knowledge, no upsell, no "free", no "recommend"', () => {
    const text = WEBSITE_LINKS.map((l) => `${l[1]} ${l[2]}`).join(' ');
    assert.doesNotMatch(text, /\bfree\b|upgrade|membership|recommend/i);
  });
});

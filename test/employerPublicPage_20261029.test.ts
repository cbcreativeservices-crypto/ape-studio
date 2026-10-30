/**
 * Must-do H5 (owner GO 2026-10-29: "yes build the public page for employers
 * and instructors"). The website's /e/<token> page for a verified employer or
 * instructor, the app's VIEW THEIR PAGE link and SHARE MY PUBLIC PAGE row.
 *
 * Live facts (read-only, 2026-10-29): employer_profile_public(p_token) answers
 * any non-revoked row and does NOT check verified_at; contact_threads'
 * other_token is the COMMUNITY token, not the employer's public token.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import {
  EMPLOYER_PAGE_BADGE,
  cleanToken,
  pageFromRow,
  safeWebsite,
  verifiedSinceLabel,
  websiteLabel,
} from '../web/lib/employerPageRules.ts';
import { employerPageToken, employerPageUrl } from '../src/features/employer/publicPage.ts';

const root = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n');

const TOKEN = 'b5445f2e-6590-47fb-9c48-2a1f86ac867d';
const row = (over: Record<string, unknown> = {}) => ({
  company_name: 'Acme Sound',
  company_website: 'https://acme.example.com',
  about: null,
  verified_at: '2026-10-04T18:22:00Z',
  kind: 'employer',
  ...over,
});

describe('H5 website page rules', () => {
  it('only a well-formed uuid token reaches the server', () => {
    assert.equal(cleanToken(TOKEN), TOKEN);
    assert.equal(cleanToken(` ${TOKEN.toUpperCase()} `), TOKEN);
    for (const bad of ['', 'abc', `${TOKEN}x`, '../u/x', null, undefined]) assert.equal(cleanToken(bad), null);
  });

  it('a verified row is shown; an unverified, odd-kind or nameless row is not found', () => {
    const p = pageFromRow(row());
    assert.ok(p);
    assert.equal(p.name, 'Acme Sound');
    assert.equal(p.kind, 'employer');
    assert.equal(pageFromRow(row({ verified_at: null })), null);
    assert.equal(pageFromRow(row({ verified_at: 'not a date' })), null);
    assert.equal(pageFromRow(row({ kind: 'member' })), null);
    assert.equal(pageFromRow(row({ company_name: '  ' })), null);
    assert.equal(pageFromRow(undefined), null);
    assert.equal(pageFromRow(row({ kind: 'instructor' }))?.kind, 'instructor');
  });

  it('badge words and the verified-since month', () => {
    assert.equal(EMPLOYER_PAGE_BADGE.employer, 'Verified employer');
    assert.equal(EMPLOYER_PAGE_BADGE.instructor, 'Verified instructor');
    assert.equal(verifiedSinceLabel('2026-10-04T18:22:00Z'), 'Verified since October 2026');
    // Read in UTC: the last minutes of a month stay in that month everywhere.
    assert.equal(verifiedSinceLabel('2026-09-30T23:59:00Z'), 'Verified since September 2026');
  });

  it('the website link is http(s) only', () => {
    assert.equal(safeWebsite('https://acme.example.com'), 'https://acme.example.com/');
    assert.equal(safeWebsite('acme.example.com'), 'https://acme.example.com/');
    assert.equal(safeWebsite('http://acme.example.com/jobs'), 'http://acme.example.com/jobs');
    for (const bad of ['javascript:alert(1)', 'data:text/html,hi', 'ftp://acme.example.com', 'mailto:a@b.com', 'localhost', '', null, 42]) {
      assert.equal(safeWebsite(bad), null, String(bad));
    }
    assert.equal(pageFromRow(row({ company_website: 'javascript:alert(1)' }))?.website, null);
    assert.equal(websiteLabel('https://acme.example.com/'), 'acme.example.com');
  });

  it('about is shown only when it has words', () => {
    assert.equal(pageFromRow(row({ about: '   ' }))?.about, null);
    assert.equal(pageFromRow(row({ about: ' We record bands. ' }))?.about, 'We record bands.');
  });
});

describe('H5 website page wiring', () => {
  const lib = read('web/lib/employerPage.ts');
  const view = read('web/components/EmployerPublicView.tsx');
  const page = read('web/app/e/[token]/page.tsx');
  const layout = read('web/app/e/[token]/layout.tsx');

  it('calls employer_profile_public with a cleaned token, three outcomes', () => {
    assert.match(lib, /rpc\("employer_profile_public", \{ p_token: t \}\)/);
    assert.match(lib, /const t = cleanToken\(token\);\n\s*if \(!t\) return \{ status: "notFound" \};/);
    assert.match(lib, /if \(error\) return \{ status: "error" \};/);
    assert.match(lib, /pageFromRow\(/);
  });

  it('is noindex like /u, and mirrors its page shell', () => {
    assert.match(layout, /robots: \{ index: false, follow: false \}/);
    assert.match(read('web/app/u/[token]/layout.tsx'), /robots: \{ index: false, follow: false \}/);
    assert.match(page, /useParams<\{ token: string \}>/);
    assert.match(page, /<EmployerPublicView token=\{token\} \/>/);
  });

  it('shows the same not-found card as /u, and opens the website safely', () => {
    assert.match(view, /Profile not available/);
    assert.match(read('web/components/CommunityProfileView.tsx'), /Profile not available/);
    assert.match(view, /rel="noopener noreferrer"/);
    assert.match(view, /verifiedSinceLabel\(p\.verifiedAt\)/);
    assert.match(view, /EMPLOYER_PAGE_BADGE\[p\.kind\]/);
  });

  it('no private data, no institutional talk, no marketing', () => {
    for (const src of [lib, view, page, layout, read('web/lib/employerPageRules.ts')]) {
      assert.doesNotMatch(src, /email:|user_id|auth_id|contact_email/);
      assert.doesNotMatch(src, /institution|academic mode|free trial|subscribe|upgrade/i);
    }
  });

  it('the site gate treats /e like /u (neither is on the public list)', () => {
    const proxy = read('web/proxy.ts');
    assert.doesNotMatch(proxy, /\\\/u\\\//);
    assert.doesNotMatch(proxy, /\\\/e\\\//);
  });
});

describe('H5 app link and share button', () => {
  it('the page URL uses the site constant and only a uuid token', () => {
    assert.equal(employerPageUrl(TOKEN), `https://www.proaudiotrainingacademy.com/e/${TOKEN}`);
    for (const bad of [null, undefined, '', 'nope', 42]) assert.equal(employerPageUrl(bad), null);
    assert.equal(employerPageToken(TOKEN.toUpperCase()), TOKEN);
    assert.match(read('src/features/employer/publicPage.ts'), /import \{ REGISTRY_BASE_URL \} from '\.\.\/profile\/registry\.ts';/);
  });

  it('my_employer_public_token: any failure or non-uuid hides the button', () => {
    const api = read('src/features/employer/api.ts');
    const fn = api.slice(api.indexOf('export async function myEmployerPublicToken'));
    const body = fn.slice(0, fn.indexOf('\n}\n'));
    assert.match(body, /rpc\('my_employer_public_token'\)/);
    assert.match(body, /if \(error\) return null;/);
    assert.match(body, /return employerPageToken\(data\);/);
    assert.match(body, /catch \{\n\s*return null;/);
  });

  it('the thread link reads other_page_token, never the community token, verified only', () => {
    const api = read('src/features/directory/api.ts');
    assert.match(
      api,
      /otherPageToken:\n\s*contactKindOf\(r\.other_kind\) !== 'member' && r\.other_verified === true\n\s*\? employerPageToken\(r\.other_page_token\)\n\s*: null,/,
    );
    const rv = read('src/screens/directory/RequestsView.tsx');
    assert.match(rv, /const pageUrl = employerPageUrl\(t\.otherPageToken\);/);
    assert.match(rv, /\{verifier && t\.otherVerified && pageUrl \? \(/);
    assert.match(rv, /VIEW THEIR PAGE ›/);
    assert.match(rv, /Linking\.openURL\(pageUrl\)\.catch\(/);
    assert.doesNotMatch(rv, /employerPageUrl\(t\.otherToken\)/);
  });

  it('SHARE MY PUBLIC PAGE: verified only, latched, hidden without a URL, no raw Alert', () => {
    const row = read('src/screens/profile/PublicPageRow.tsx');
    assert.match(row, /const onShare = useLatchedPress\(/);
    assert.match(row, /if \(!url\) return null;/);
    assert.match(row, /setUrl\(employerPageUrl\(token\)\)/);
    assert.match(row, /notify\('Couldn’t open sharing'/);
    assert.doesNotMatch(row, /Alert\.alert/);
    assert.match(read('src/screens/profile/EmployerSection.tsx'), /\{verified && verifierKind \? <PublicPageRow kind=\{verifierKind\} \/> : null\}/);
  });
});

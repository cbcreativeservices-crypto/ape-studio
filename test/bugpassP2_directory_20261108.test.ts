/**
 * Bug pass 2026-11-08, pass 2, group "directory" (Audio Community screens and
 * src/features/directory). One block per bug ID; see
 * scratchpad/bugpass/FIX_P2_directory.md for the write-up.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CONTACT_NEEDS_OPEN_TO_LINE, NO_OPEN_TO_LINE, contactOffer, readableError } from '../src/features/directory/rules.ts';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
/** Source with comments blanked, so a comment can never satisfy a check. */
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));

const SCREEN = 'src/screens/directory/AudioCommunityDirectoryScreen.tsx';

describe('UI-2-03: contact ON with no Open To topics is never a dead-end sheet', () => {
  it('contactOffer tells "can send" from "nothing to choose" from "contact off"', () => {
    assert.equal(contactOffer({ contactEnabled: true, openTo: ['Hiring'] }), 'send');
    assert.equal(contactOffer({ contactEnabled: true, openTo: [] }), 'no-topics');
    assert.equal(contactOffer({ contactEnabled: false, openTo: ['Hiring'] }), 'off');
    assert.equal(contactOffer({ contactEnabled: false, openTo: [] }), 'off');
  });

  it('the reason is plain words, with no em dash', () => {
    assert.match(NO_OPEN_TO_LINE, /can’t send them a contact request/);
    assert.doesNotMatch(NO_OPEN_TO_LINE, /—/);
  });

  it('the member sheet draws the button only on "send" and the reason on "no-topics"', () => {
    const s = code(SCREEN);
    assert.doesNotMatch(s, /p\.contactEnabled && !sent/, 'the old gate on contactEnabled alone is gone');
    assert.match(s, /contactOffer\(p\) === 'send' \? \(\s*<PrimaryButton label="SEND A CONTACT REQUEST"/);
    assert.match(s, /contactOffer\(p\) === 'no-topics' \? \(\s*<Helper>\{NO_OPEN_TO_LINE\}<\/Helper>/);
  });

  it('the composer itself, with no topics, shows the reason and CANCEL, not a SEND that cannot wake', () => {
    const s = code(SCREEN);
    const sheet = s.slice(s.indexOf('function ContactSheet('), s.indexOf('const REASONS'));
    const guard = sheet.indexOf('{!openTo.length ? (');
    assert.ok(guard > 0, 'composer guards an empty Open To list');
    assert.ok(sheet.indexOf('<Helper>{NO_OPEN_TO_LINE}</Helper>', guard) > guard);
    assert.ok(sheet.indexOf('label="SEND REQUEST"') > guard, 'SEND REQUEST sits inside the topics branch');
    assert.ok(sheet.lastIndexOf('label="CANCEL"') > sheet.indexOf('label="SEND REQUEST"'), 'CANCEL is always drawn');
  });

  it('a server refusal for a purpose they do not offer still reads plainly', () => {
    assert.equal(
      readableError('that is not something this member is open to'),
      'This member is not open to that. Pick another reason.',
    );
  });
});

describe('UI-2-04: no em dash in member-facing directory text', () => {
  const FILES = [
    SCREEN,
    'src/screens/directory/ExploreView.tsx',
    'src/screens/directory/MyProfileView.tsx',
    'src/screens/directory/ProfileSetupFlow.tsx',
    'src/screens/directory/RequestsView.tsx',
    'src/screens/directory/directoryBits.tsx',
    'src/screens/directory/DirectoryChips.tsx',
    'src/features/directory/api.ts',
    'src/features/directory/rules.ts',
    'src/features/directory/kinds.ts',
    'src/features/directory/sampleThreads.ts',
  ];
  for (const f of FILES) {
    it(f, () => {
      const lines = code(f)
        .split('\n')
        .map((l, i) => [i + 1, l] as const)
        .filter(([, l]) => l.includes('—'));
      assert.deepEqual(lines, [], `em dash in code (not a comment) in ${f}`);
    });
  }

  it('the three reported sentences read as two plain sentences', () => {
    const psf = read('src/screens/directory/ProfileSetupFlow.tsx');
    assert.match(psf, /There is no wrong answer here\. If you are still working it out/);
    assert.match(psf, /not chosen here\. This list IS the permission\./);
    assert.match(read(SCREEN), /Choose what this is about\. You can only pick something this member is open to\./);
  });
});

describe('UI-2-03 follow-ups (checker, pass 2)', () => {
  it('My Profile warns at the contact switch when contact is ON and Open To is empty', () => {
    const s = code('src/screens/directory/MyProfileView.tsx');
    const sw = s.indexOf('label="Let members contact me"');
    const warn = s.indexOf("contactOffer(p) === 'no-topics' ? <Banner tone=\"warn\">{CONTACT_NEEDS_OPEN_TO_LINE}</Banner>");
    assert.ok(sw > 0 && warn > sw, 'the warning sits right after the contact switch');
    assert.ok(warn - sw < 1200, 'and close to it, not elsewhere on the page');
    assert.match(CONTACT_NEEDS_OPEN_TO_LINE, /nobody can send you a request/);
    assert.doesNotMatch(CONTACT_NEEDS_OPEN_TO_LINE, /—/);
  });

  it('the member sheet header light agrees with the sheet: green only when a request can be sent', () => {
    const s = code(SCREEN);
    assert.doesNotMatch(s, /led=\{p\?\.contactEnabled/);
    assert.match(s, /led=\{p && contactOffer\(p\) === 'send' \? 'green' : 'off'\}/);
  });
});

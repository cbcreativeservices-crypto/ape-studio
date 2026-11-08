/**
 * Bug pass 3 (2026-11-08, UI-3-06): the glossary term popup's load-failure line
 * told the reader to "Open the Glossary to try again", but where the popup opens
 * over another screen (the forum Ask form) its only button is DONE. The line now
 * names the retry the popup itself offers: close the term and open it again.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync('src/features/glossary/GlossaryTermPopup.tsx', 'utf8').replace(/\r\n/g, '\n');

describe('glossary popup load failure names a retry the popup offers', () => {
  it('says close and open again, not open the Glossary', () => {
    assert.match(src, /couldn’t be loaded just now\. Close the term and open it again to retry\./);
    assert.doesNotMatch(src, /Open the Glossary to try again/);
  });
});

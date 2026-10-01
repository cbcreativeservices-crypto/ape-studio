/**
 * Labs A + Mastering — night bug pass 2 (2026-10-01).
 *
 *  • useMasterPlayback: a failed clip write no longer escapes as an
 *    unhandled rejection and strands the page on RENDERING; the armed
 *    replay survives a multi-tick fader drag (replayIdRef).
 *  • MasteringLabScreen: saves blocked until the tier is resolved; a move
 *    made before the first load is not yanked back to the resume point;
 *    credit only grows on a practice reset and the end screen counts this
 *    session's banked modules (guests).
 *  • EQ / Cymatics hosts: a visit is recorded only once the tier resolved.
 *  • Cymatics Gallery art: an older save landing never clears a newer edit's
 *    dirty flag.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) =>
  readFileSync(join(process.cwd(), p), 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
const DIR = 'src/screens/lab/mastering';

describe('useMasterPlayback (pass 2)', () => {
  const s = read(`${DIR}/useMasterPlayback.ts`);
  it('renderAll catches a load failure and returns to idle', () => {
    const body = s.slice(s.indexOf('const renderAll = useCallback'), s.indexOf('const renderAllRef'));
    assert.match(body, /\} catch \{[\s\S]*?if \(current\(\)\) \{[\s\S]*?setStatus\('idle'\)/);
    assert.match(body, /pendingRef\.current = null;/);
  });
  it('the armed replay is carried across effect re-runs and cleared by cancel / fire', () => {
    assert.match(s, /activeRef\.current \?\? pendingRef\.current \?\? replayIdRef\.current/);
    assert.match(s, /replayIdRef\.current = again;/);
    const cancel = s.slice(s.indexOf('const cancelReplay'), s.indexOf('const signature'));
    assert.match(cancel, /replayIdRef\.current = null/);
    assert.match(s, /replayTimerRef\.current = null;\s*\n\s*replayIdRef\.current = null;/);
  });
});

describe('MasteringLabScreen (pass 2)', () => {
  const s = read(`${DIR}/MasteringLabScreen.tsx`);
  it('saves are blocked until the tier resolves', () => {
    assert.match(s, /setMasteringSaveBlocked\(guest \|\| !resolved\)/);
  });
  it('a move before the first load is kept', () => {
    assert.match(s, /if \(!loadedRef\.current\) movedRef\.current = true;/);
    assert.match(s, /if \(movedRef\.current\) \{/);
  });
  it('credit only grows on a practice reset; the end screen counts this session', () => {
    assert.match(s, /setDoneIds\(\(prev\) => new Set\(\[\.\.\.prev,/);
    assert.match(s, /new Set<string>\(\[\.\.\.doneIds,/);
  });
});

describe('visit hosts wait for resolved', () => {
  for (const [f, lab] of [['src/screens/lab/eq/EqModuleScreen.tsx', 'eq'], ['src/screens/lab/cymatics/CymaticsModuleScreen.tsx', 'cymatics']]) {
    it(f, () => {
      const s = read(f);
      assert.match(s, new RegExp(`if \\(focused && resolved\\) markLabVisit\\('${lab}'`));
    });
  }
});

describe('Gallery art autosave', () => {
  it('a stale save result is ignored', () => {
    const s = read('src/screens/lab/cymatics/GalleryArt.tsx');
    assert.match(s, /if \(latest\.current !== art\) return;\s*\n\s*setSaveState/);
  });
});

/**
 * GUARD — "hide the display" must keep giving the lesson the screen.
 *
 * TESTER REPORT 2026-09-23 (Frank, iPhone SE 3rd gen):
 *   "It's hard to go through the lesson and question when it's only that small
 *    portion of the screen that scrolls."
 *
 * Measured: stage pinned top, dock pinned bottom, leaving the well about 140pt
 * on a 667pt phone — roughly six lines, with the CHECK YOURSELF question inside
 * the same window. Owner's ruling: "let the display collapse so the lesson can
 * take the screen."
 *
 * Three things have to stay true or the fix quietly stops working:
 *   1. the glass is NOT RENDERED when collapsed (a zero-height canvas would
 *      still be mounted and still drawing frames);
 *   2. the well actually GROWS into the freed space — and only while collapsed,
 *      because expanded it must keep wrapping its content so the dock rides up
 *      under short lessons rather than leaving a dead gap;
 *   3. the choice OUTLIVES THE MODULE. Labs mount a fresh RackUnit per module,
 *      so component state alone snaps back to expanded on every NEXT.
 *
 * ⛔ And the honesty badge / bezel readouts must NOT be what gets hidden to win
 * the space — that badge is a disclosure.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const rack = readFileSync(join(process.cwd(), 'src', 'screens', 'lab', 'rack', 'RackUnit.tsx'), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const code = strip(rack);

describe('the lab display can collapse for reading', () => {
  test('there is a control, and it is big enough to hit', () => {
    assert.match(code, /SHOW DISPLAY/, 'the show/hide display control is gone');
    assert.match(code, /HIDE DISPLAY/, 'the show/hide display control is gone');
    // Visible bar 34 pt (owner 2026-09-26, thinner row) + hit slop 5 above and
    // below = the 44 pt touch target the tester report demands.
    const h = code.match(/stageToggle:\s*\{[^}]*minHeight:\s*(\d+)/);
    assert.ok(h, 'the toggle lost its minimum height');
    const slop = code.match(/onPress=\{toggleStage\}[\s\S]*?hitSlop=\{\{ top: (\d+), bottom: (\d+)/);
    assert.ok(slop, 'the toggle lost its hit slop');
    assert.ok(Number(h![1]) + Number(slop![1]) + Number(slop![2]) >= 44, 'the toggle touch target fell under 44pt');
  });

  test('the glass is not rendered while collapsed', () => {
    assert.match(
      code,
      /stageCollapsed \? null : \(/,
      'the glass is no longer skipped when collapsed — a hidden canvas would still be mounted and drawing',
    );
  });

  test('the well grows ONLY while collapsed', () => {
    assert.match(code, /wellWrapGrow:\s*\{\s*flexGrow:\s*1\s*\}/, 'the well can no longer take the freed space');
    assert.match(code, /stageCollapsed && styles\.wellWrapGrow/, 'the grow style is no longer tied to the collapsed state');
    // Expanded must still wrap content, or short lessons leave a dead gap.
    assert.match(code, /wellWrap:\s*\{\s*flexGrow:\s*0/, 'the expanded well started growing — the dock will stop riding up');
  });

  test('the choice survives a module change and a relaunch', () => {
    assert.match(code, /let stageCollapsedCache/, 'the module-scope cache is gone — the display will reopen on every NEXT');
    assert.match(code, /AsyncStorage\.setItem\(STAGE_COLLAPSED_KEY/, 'the preference is no longer persisted');
    assert.match(code, /useState\(stageCollapsedCache \?\? false\)/, 'the initial state no longer reads the session cache — expect a flash on every module');
  });

  test('the disclosure is NOT what gets hidden', () => {
    // The badge and bezel must sit OUTSIDE the collapsed branch.
    const glassBranch = code.slice(code.indexOf('stageCollapsed ? null : ('));
    const badgeAt = glassBranch.indexOf('badgeStrip');
    const closeAt = glassBranch.indexOf(')}');
    assert.ok(badgeAt > closeAt, 'the honesty badge moved inside the collapsible glass — a disclosure must not be hidden to win space');
  });

  test('the preference survives an account wipe, like its siblings', () => {
    const wipe = readFileSync(join(process.cwd(), 'src', 'features', 'account', 'clearLocalAccountData.ts'), 'utf8');
    assert.match(wipe, /'ape:lab:stageCollapsed'/, 'the reading preference is swept on account switch and will spring back open');
  });
});

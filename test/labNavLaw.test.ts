/**
 * GUARD — the shared lab navigation law (owner 2026-09-30).
 *
 * Once a lab host adopts kit/LabNavBar it must not keep a local strip or any
 * of the retired words beside it: one strip, one vocabulary, in every lab.
 * Retired from navigation: ‹ BACK, CONTINUE ›, ⏮ START, SKIP AHEAD, and the
 * per-host `styles.topNav`. The kit itself may not draw text under 9 pt.
 */
import { strict as assert } from 'node:assert';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LAB = join(ROOT, 'src', 'screens', 'lab');
const KIT = join(LAB, 'kit');
const rel = (f: string) => relative(ROOT, f).split(sep).join('/');

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}
/** Source with comments stripped and line endings normalised. */
const strip = (code: string) =>
  code
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const RETIRED = ['‹ BACK', 'CONTINUE ›', '⏮ START', 'SKIP AHEAD', 'styles.topNav'];

describe('shared lab navigation law', () => {
  it('every host that imports LabNavBar has no local strip and none of the retired words', () => {
    const offenders: string[] = [];
    for (const file of walk(LAB)) {
      if (file.startsWith(KIT)) continue;
      const code = strip(readFileSync(file, 'utf8'));
      if (!/from ['"][^'"]*kit\/LabNavBar['"]/.test(code)) continue;
      for (const word of RETIRED) {
        if (code.includes(word)) offenders.push(`${rel(file)} still carries "${word}"`);
      }
    }
    assert.deepEqual(offenders, [], `a migrated lab kept a local navigation:\n${offenders.join('\n')}`);
  });

  it('the kit draws nothing under 9 pt', () => {
    const code = strip(readFileSync(join(KIT, 'LabNavBar.tsx'), 'utf8'));
    const sizes = [...code.matchAll(/fontSize:\s*([\d.]+)/g)].map((m) => Number(m[1]));
    assert.ok(sizes.length > 0, 'no fontSize found in LabNavBar.tsx');
    const small = sizes.filter((s) => s < 9);
    assert.deepEqual(small, [], `LabNavBar.tsx has text under 9 pt: ${small.join(', ')}`);
  });

  it('the kit uses the approved words and nothing retired', () => {
    const bar = strip(readFileSync(join(KIT, 'LabNavBar.tsx'), 'utf8'));
    const pure = strip(readFileSync(join(KIT, 'labNav.ts'), 'utf8'));
    for (const word of RETIRED) {
      assert.ok(!bar.includes(word) && !pure.includes(word), `the kit carries the retired "${word}"`);
    }
    assert.ok(pure.includes("prev: '‹ PREV'") && pure.includes("next: 'NEXT ›'") && pure.includes("finish: 'FINISH ›'"));
    assert.ok(bar.includes('accessibilityLabel="Leave the lab"'), 'the header ‹ must read "Leave the lab"');
    assert.ok(bar.includes('hitSlop={BACK_HIT_SLOP}'), 'the header ‹ keeps BACK_HIT_SLOP');
    assert.ok(bar.includes('BackHandler.addEventListener'), 'CONTENTS must answer Android BACK while open');
  });

  it('LabShell draws its header through LabHeader; RackUnit appends LabNextButton under a provider only', () => {
    const shell = strip(readFileSync(join(LAB, 'LabShell.tsx'), 'utf8'));
    assert.match(shell, /<LabHeader\b/);
    assert.ok(!shell.includes('accessibilityLabel="Back"'), 'LabShell must not keep its own ‹');
    const rack = strip(readFileSync(join(LAB, 'rack', 'RackUnit.tsx'), 'utf8'));
    assert.match(rack, /\{labNav \? <LabNextButton nav=\{labNav\} \/> : null\}/);
    const end = strip(readFileSync(join(KIT, 'LabEndScreen.tsx'), 'utf8'));
    assert.match(end, /return <LabNextButton onPress=\{onPress\} label=\{label\} \/>;/, 'LabEndLink is built on LabNextButton');
  });

  /**
   * SEE WHAT'S LEFT on every module-lab hub (owner 2026-10-02, "favor
   * consistency"). A module-lab is a folder whose *ModuleScreen.tsx renders
   * <LabEndScreen>; its hub (*HomeScreen.tsx) must carry the Meter hub's link,
   * the same component and wording, and swap LabEndScreen in itself. Hubs not
   * yet on it are listed with why; this list may only SHRINK.
   */
  const HUB_LINK_EXEMPT: Record<string, string> = {
    'src/screens/lab/amp/AmpLabHomeScreen.tsx':
      'hub already reads progress ("N of M modules complete" + RESUME); its end screen needs the async ape:amp:v1 read + the final-assessment unit',
  };
  it('every module-lab hub has the SEE WHAT’S LEFT link to its own end screen', () => {
    const offenders: string[] = [];
    const hubs: string[] = [];
    for (const dir of readdirSync(LAB)) {
      const d = join(LAB, dir);
      if (!statSync(d).isDirectory() || d === KIT) continue;
      const files = readdirSync(d);
      const mod = files.find((f) => /ModuleScreen\.tsx$/.test(f));
      if (!mod || !strip(readFileSync(join(d, mod), 'utf8')).includes('<LabEndScreen')) continue;
      const hub = files.find((f) => /HomeScreen\.tsx$/.test(f));
      if (!hub) continue;
      const path = rel(join(d, hub));
      hubs.push(path);
      if (path in HUB_LINK_EXEMPT) continue;
      const code = strip(readFileSync(join(d, hub), 'utf8'));
      if (!code.includes('<LabEndLink label="SEE WHAT’S LEFT ›" onPress={() => setEnding(true)} />'))
        offenders.push(`${path} has no SEE WHAT’S LEFT link`);
      if (!/\{ending \? \(\s*<LabEndScreen/.test(code)) offenders.push(`${path} does not swap LabEndScreen in`);
      if (!/onPracticeAgain=\{\(\) => open\(/.test(code)) offenders.push(`${path}: PRACTISE AGAIN must reopen a module (clears nothing)`);
    }
    assert.deepEqual(offenders, [], offenders.join('\n'));
    // The detector must still see the six known hubs (Meter + the five added 2026-10-02).
    for (const n of ['meter/MeterLabHomeScreen', 'cymatics/CymaticsHomeScreen', 'digital/DigitalLabHomeScreen', 'eq/EqLabHomeScreen', 'gain/GainLabHomeScreen', 'wave/WaveLabHomeScreen'])
      assert.ok(hubs.includes(`src/screens/lab/${n}.tsx`), `detector lost ${n}`);
    for (const k of Object.keys(HUB_LINK_EXEMPT)) assert.ok(hubs.includes(k), `stale exemption: ${k}`);
  });
});

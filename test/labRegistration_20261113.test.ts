/**
 * The two labs listed 2026-11-13 [MD:D60] (owner: "Yes, register both"; the
 * requirements: "I approve your required suggestions").
 *
 *   GAME AUDIO LAB — its own subject, Game Audio; members only; credit
 *   tr_game_audio = every page done (PagedLab labDoneKey); required by
 *   cert-game-audio-v3, cert-interactive-and-game-music-v3 and
 *   prog-game-and-interactive-audio-v3.
 *
 *   STAGE PLOT AND CHANNEL DESIGNER — under Live Sound Reinforcement, after
 *   the DJ Systems Lab; members only; credit tr_stage_plot = the guided task
 *   (all five steps on one stage plot); required by four live-show
 *   certificates and two programs.
 *
 * Pins the catalog rows, the navigator gate, the keys, the reporting, the tile
 * art, the term popup HOLD, and the requirement rows (exactly these, nothing
 * else). The server rows are Comp A's, after the update is on phones (D60 f):
 * the generated seed carries the do-not-run warning.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

registerHooks({
  resolve(spec, ctx, next) {
    if (spec.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(spec)) {
      for (const ext of ['.ts', '.tsx']) {
        const c = new URL(spec + ext, ctx.parentURL);
        if (existsSync(fileURLToPath(c))) return { url: c.href, shortCircuit: true };
      }
    }
    return next(spec, ctx);
  },
});
const { LAB_CATEGORIES, categoryLeaves, getCategory, isMemberOnlyLabRoute, labRouteName, sectionCategories } = await import('../src/screens/lab/labCatalog.ts');
const { TRAINING_LABS, isTrainingKey, trainingKeyFor, trainingLabByRoute } = await import('../src/features/lab/trainingLabKeys.ts');
const { allLabKeys, describeLabKey } = await import('../src/data/labKeyCatalog.ts');
const { LAB_REQUIREMENTS_BY_SLUG } = await import('../src/data/labRequirements.ts');
const { LAB_TERM_ENTRIES } = await import('../src/features/intro/labTermIntroData.ts');

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const LABS = [
  { route: 'GameAudioLab', name: 'Game Audio Lab', key: 'tr_game_audio', completion: 'all-modules', cat: 'gameaudio', tile: 'assets/lab-tiles/tr-64-game-audio-lab.webp', screen: 'src/screens/lab/gameaudio/GameAudioLabScreen.tsx' },
  { route: 'StagePlotLab', name: 'Stage Plot and Channel Designer', key: 'tr_stage_plot', completion: 'project', cat: 'livesound', tile: 'assets/lab-tiles/tr-65-stage-plot-and-channel-designer.webp', screen: 'src/screens/lab/stageplot/StagePlotLabScreen.tsx' },
] as const;

describe('the Labs menu', () => {
  it('Game Audio is a training subject of its own, listed A to Z, with the one lab', () => {
    const cat = getCategory('gameaudio');
    assert.ok(cat && cat.kind === 'list');
    assert.equal(cat.name, 'Game Audio');
    assert.equal(cat.section, 'training');
    assert.deepEqual(categoryLeaves(cat).map((l) => l.name), ['Game Audio Lab']);
    const names = sectionCategories('training').map((c) => c.name);
    assert.equal(names.indexOf('Game Audio'), names.indexOf('Equalization') + 1, 'after Equalization, A to Z');
  });
  it('Live Sound Reinforcement lists the Stage Plot after the DJ Systems Lab', () => {
    const cat = getCategory('livesound')!;
    assert.deepEqual(categoryLeaves(cat).map((l) => l.name), ['Sound Systems Lab', 'DJ Systems Lab', 'Stage Plot and Channel Designer']);
  });
  for (const lab of LABS) {
    it(`${lab.name}: one catalog row, members only, with its tile art`, () => {
      const rows = LAB_CATEGORIES.flatMap((c) => categoryLeaves(c).map((l) => ({ c: c.id, l }))).filter((x) => x.l.route === lab.route);
      assert.equal(rows.length, 1);
      assert.equal(rows[0].c, lab.cat);
      assert.equal(rows[0].l.name, lab.name);
      assert.equal(rows[0].l.member, true);
      assert.equal(rows[0].l.status, undefined, 'a real row, not a placeholder');
      assert.equal(isMemberOnlyLabRoute(lab.route), true);
      assert.equal(labRouteName(lab.route), lab.name);
      assert.ok(read('src/screens/lab/labTileArt.ts').includes(`'${lab.name}': require('../../../${lab.tile}'),`));
      assert.ok(existsSync(join(ROOT, lab.tile)));
    });
    it(`${lab.name}: gated in the navigator, typed, previewable, exposure-checked`, () => {
      const nav = read('src/navigation/RootNavigator.tsx');
      assert.match(nav, new RegExp(`${lab.route}: lazyScreen\\(\\(\\) => withMembershipPreview\\(require\\('`));
      assert.ok(nav.includes(`<Stack.Screen name="${lab.route}" getComponent={MemberGated.${lab.route}} />`));
      assert.match(read('src/navigation/types.ts'), new RegExp(`\\n  ${lab.route}: undefined;`));
      assert.match(read('src/dev/webPreviews.tsx'), new RegExp(`${lab.route}: \\w+ as ComponentType,`));
      assert.match(read('src/features/audio/ExposureCheckin.tsx'), new RegExp(`'${lab.route}'`));
    });
    it(`${lab.name}: the screen header no longer says it is not listed`, () => {
      const src = read(lab.screen);
      assert.doesNotMatch(src, /NOT LISTED YET/);
      assert.match(src, /LISTED 2026-11-13 \[MD:D60\]/);
    });
    it(`${lab.name}: glossary popup on HOLD (no live row copied yet), so nothing shows`, () => {
      assert.equal(LAB_TERM_ENTRIES[lab.route]?.status, 'hold');
    });
  }
});

describe('the credit', () => {
  for (const lab of LABS) {
    it(`${lab.key} is the ${lab.name}’s permanent server key, and the seed lists its labs row`, () => {
      assert.deepEqual(trainingLabByRoute(lab.route), { route: lab.route, key: lab.key, completion: lab.completion });
      assert.equal(trainingKeyFor(lab.route), lab.key);
      assert.equal(isTrainingKey(lab.key), true);
      assert.equal(TRAINING_LABS.filter((l) => l.key === lab.key).length, 1);
      assert.deepEqual(describeLabKey(lab.key), { key: lab.key, name: lab.name, area: 'training', route: lab.route });
      assert.ok(allLabKeys().some((k) => k.key === lab.key));
      assert.ok(read('docs/APE_LAB_CERT_REQUIREMENTS_SEED_2026_10_13.sql').includes(`('${lab.key}', '${lab.name}', 'training')`));
    });
  }
  it('Game Audio: PagedLab reports it once every page is done', () => {
    assert.match(code(LABS[0].screen), /labDoneKey=\{trainingKeyFor\('GameAudioLab'\)\}/);
    assert.match(code('src/screens/lab/kit/PagedLab.tsx'), /if \(labDoneKey && labComplete\) reportTrainingComplete\(labDoneKey\);/);
  });
  it('Stage Plot: the editor reports it when all five guided steps are done, and never takes it back', () => {
    const src = code(LABS[1].screen);
    assert.match(src, /const guidedDone = useMemo\(\(\) => ed\.exported && spGuidedSteps\(ed\.project, true\)\.every\(\(s\) => s\.done\), \[ed\.exported, ed\.project\]\);/);
    assert.match(src, /if \(guidedDone\) reportTrainingComplete\(trainingKeyFor\('StagePlotLab'\)\);/);
    assert.doesNotMatch(src, /removeTraining|unmarkTraining|clearTraining/);
    // the steps it reads are the ones the GUIDED TASK list shows
    assert.match(code('src/screens/lab/stageplot/GuidedTask.tsx'), /spGuidedSteps\(ed\.project, ed\.exported\)/);
    assert.match(read('src/screens/lab/stageplot/GuidedTask.tsx'), /All five done on one stage plot complete this lab\./);
  });
});

describe('the requirements the owner approved (2026-11-13), and nothing else', () => {
  const holders = (key: string) => Object.entries(LAB_REQUIREMENTS_BY_SLUG).filter(([, reqs]) => reqs.some((r) => r.key === key)).map(([s]) => s).sort();
  it('Game Audio Lab', () => {
    assert.deepEqual(holders('tr_game_audio'), ['cert-game-audio-v3', 'cert-interactive-and-game-music-v3', 'prog-game-and-interactive-audio-v3']);
  });
  it('Stage Plot and Channel Designer', () => {
    assert.deepEqual(holders('tr_stage_plot'), [
      'cert-foh-engineering-v3',
      'cert-monitor-engineering-iem-and-wedges-v3',
      'cert-stage-patch-and-signal-distribution-v3',
      'cert-touring-and-road-crew-v3',
      'prog-concert-and-festival-production-v3',
      'prog-live-sound-engineering-v3',
    ]);
  });
  it('the generated seed says not to run it for these two (their SQL goes to Comp A after phones)', () => {
    const seed = read('docs/APE_LAB_CERT_REQUIREMENTS_SEED_2026_10_13.sql');
    assert.match(seed, /2026-11-13 \[MD:D60\]: this file now also lists tr_game_audio .*\n.*tr_stage_plot .*Do NOT run this seed for them/);
  });
});

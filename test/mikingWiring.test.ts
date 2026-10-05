/**
 * Miking Labs — registration and house rules (blueprint §11 mikingWiring;
 * owner decisions in MIKING_LABS_PLAN_2026_10_04.md §6).
 *
 *   • LISTED inside Training Labs → Instruments & Recording as a "Miking
 *     Labs" family, members-only, one row per lab with a READY lesson (no
 *     placeholder rows), opening the hub.
 *   • GATED: both routes through MemberGated + withMembershipPreview, and the
 *     predicate the wrapper asks agrees (MikingLesson is a child route).
 *   • typed routes, the #labpreview harness entries.
 *   • the host is on the shared strip (useLabNav + LabEndScreen); every rack
 *     page opts into FULL SCREEN; safeGoBack only; no raw Alert.alert.
 *   • every miking <Canvas> is labelled for a screen reader.
 *   • FULLY SILENT: nothing under miking/ imports an audio path.
 *   • no animation loop host (D8); no direct AsyncStorage (createLocalStore).
 *   • routes do not end in `Lab` (kept out of the audio exposure check-in).
 *   • wording: no institutional words, no "free" marketing copy.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join, relative, sep } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const strip = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/([^:'"`])\/\/[^\n]*/g, '$1');
const DIR = 'src/screens/lab/miking';
function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(join(ROOT, dir))) {
    const p = join(dir, e);
    if (statSync(join(ROOT, p)).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(e)) out.push(p.split(sep).join('/'));
  }
  return out;
}
const FILES = walk(DIR).map((f) => ({ f, raw: read(f), s: strip(read(f)) }));

const { LAB_CATEGORIES, isMemberOnlyLabRoute, labRouteName, categoryLeaves } = await import('../src/screens/lab/labCatalog.ts');
const { readyLabs, LESSONS } = await import('../src/screens/lab/miking/data/registry.ts');

describe('listing (owner: Training Labs → Instruments & Recording, members only)', () => {
  const cat = (LAB_CATEGORIES as { id: string; section: string; families?: { name: string; labs: { name: string; route?: string; params?: { lab?: string }; member?: boolean }[] }[] }[]).find((c) => c.id === 'instruments')!;
  it('a "Miking Labs" family in the training-section Instruments & Recording category', () => {
    assert.equal(cat.section, 'training');
    const fam = cat.families?.find((f) => f.name === 'Miking Labs');
    assert.ok(fam, 'the family exists');
    assert.ok(fam.labs.length >= 1);
    for (const l of fam.labs) {
      assert.equal(l.route, 'MikingHub');
      assert.equal(l.member, true);
      assert.ok(l.params?.lab);
    }
  });
  it('one row per lab with a READY lesson — no placeholder rows', () => {
    const fam = cat.families!.find((f) => f.name === 'Miking Labs')!;
    assert.deepEqual(fam.labs.map((l) => l.params!.lab), readyLabs().map((l: { id: string }) => l.id));
    assert.deepEqual(readyLabs().map((l: { id: string }) => l.id), ['drums', 'percussion', 'strings'], 'Lab 1, Lab 2 and Lab 4 have ready lessons today');
    assert.ok(LESSONS.every((l: { status: string }) => l.status === 'ready'));
    assert.ok(categoryLeaves(cat as never).some((l: { route?: string }) => l.route === 'MikingHub'));
  });
});

describe('gating (members-only with the grayed preview)', () => {
  const nav = strip(read('src/navigation/RootNavigator.tsx'));
  it('both routes go through MemberGated + withMembershipPreview, lazily', () => {
    assert.match(nav, /MikingHub: lazyScreen\(\(\) => withMembershipPreview\(require\('\.\.\/screens\/lab\/miking\/MikingHubScreen'\)\.MikingHubScreen\)\)/);
    assert.match(nav, /MikingLesson: lazyScreen\(\(\) => withMembershipPreview\(require\('\.\.\/screens\/lab\/miking\/MikingLessonScreen'\)\.MikingLessonScreen\)\)/);
    assert.match(nav, /<Stack\.Screen name="MikingHub" getComponent=\{MemberGated\.MikingHub\} \/>/);
    assert.match(nav, /<Stack\.Screen name="MikingLesson" getComponent=\{MemberGated\.MikingLesson\} \/>/);
  });
  it('THE PREDICATE AGREES: both routes are members-only to the gate', () => {
    assert.equal(isMemberOnlyLabRoute('MikingHub'), true);
    assert.equal(isMemberOnlyLabRoute('MikingLesson'), true);
    assert.equal(labRouteName('MikingLesson'), 'Miking Labs');
  });
  it('typed routes and the preview harness entries', () => {
    const types = read('src/navigation/types.ts');
    assert.match(types, /MikingHub: \{ lab\?: [^}]+\} \| undefined;/);
    assert.match(types, /MikingLesson: \{ id: string; page\?: string \};/);
    const web = read('src/dev/webPreviews.tsx');
    assert.match(web, /MikingHub: MikingHubScreen as ComponentType,/);
    assert.match(web, /MikingLesson: MikingLessonScreen as ComponentType,/);
  });
  it('route names do not end in "Lab" (a silent lab stays out of the audio exposure check-in, D9)', () => {
    for (const r of ['MikingHub', 'MikingLesson']) assert.doesNotMatch(r, /Lab$/);
  });
});

describe('the host and its pages', () => {
  const host = FILES.find((x) => x.f.endsWith('MikingLessonScreen.tsx'))!.s;
  it('the lesson runs on the shared strip and ends on the what’s-left screen', () => {
    assert.match(host, /useLabNav\(/);
    assert.match(host, /<LabEndScreen\b/);
    assert.match(host, /mode="progress"/);
    assert.match(host, /noun="page"/);
    assert.match(host, /START OVER \(PRACTICE\)/);
    assert.match(host, /<ProgressUnreadableNote\b/);
    assert.match(host, /setMikingSaveBlocked\(!canSave\)/);
    assert.match(host, /persistAllowed\(tier\)/);
  });
  it('every rack page opts into FULL SCREEN; the hub uses the shared header', () => {
    assert.match(FILES.find((x) => x.f.endsWith('MikingRack.tsx'))!.s, /fullScreen: true/);
    assert.match(FILES.find((x) => x.f.endsWith('MikingHubScreen.tsx'))!.s, /<LabHeader\b/);
    for (const { f, s } of FILES.filter((x) => /\/pages\/P\w+\.tsx$/.test(x.f))) {
      assert.doesNotMatch(s, /<RackUnit\b/, `${f}: rack pages go through MikingRack (PageSteps)`);
    }
  });
  it('safeGoBack only; no raw Alert.alert; no direct AsyncStorage', () => {
    for (const { f, s } of FILES) {
      assert.doesNotMatch(s, /navigation\.goBack\(\)/, f);
      assert.doesNotMatch(s, /Alert\.alert\(/, f);
      assert.doesNotMatch(s, /AsyncStorage/, f);
    }
  });
});

describe('accessibility, motion, sound', () => {
  it('every miking <Canvas> is accessible with a label', () => {
    let n = 0;
    for (const { f, s } of FILES) {
      for (const m of s.matchAll(/<Canvas\b([^>]*)>/g)) {
        n++;
        assert.match(m[1], /\baccessible\b/, `${f}: <Canvas without accessible`);
        assert.match(m[1], /accessibilityLabel=/, `${f}: <Canvas without accessibilityLabel`);
      }
    }
    assert.ok(n >= 3, `expected the scene, comb and polar canvases (found ${n})`);
  });
  it('FULLY SILENT: nothing under miking/ reaches an audio path', () => {
    for (const { f, s } of FILES) {
      assert.doesNotMatch(s, /from '[^']*(features\/audio|startFenced|expo-audio|LabAudioPlayer|useLabAudio|modules\/ape-dsp)[^']*'/, f);
    }
  });
  it('no animation loop host (D8): nothing runs unless a finger moves it', () => {
    const isLoopHost = (s: string) => /\bAnimated\.loop\(|\bwithRepeat\(|\buseFrameCallback\(|\bsetInterval\(/.test(s) || (/\brequestAnimationFrame\(/.test(s) && /\bcancelAnimationFrame\b/.test(s));
    for (const { f, s } of FILES) assert.equal(isLoopHost(s), false, f);
  });
  it('drags use Gesture Handler with shared values; React commits on release', () => {
    const scene = FILES.find((x) => x.f.endsWith('PlacementScene.tsx'))!.s;
    assert.match(scene, /Gesture\.Pan\(\)[\s\S]*\.manualActivation\(true\)/);
    assert.match(scene, /Gesture\.Pinch\(\)/);
    assert.match(scene, /\.onFinalize\([\s\S]{0,200}scheduleOnRN\(finish, g\)/);
    assert.match(scene, /constrainMove\(scene, body, sv\.value, to, bounds\)/);
    assert.doesNotMatch(scene, /PanResponder/);
  });
});

describe('wording', () => {
  it('no institutional words, no "free" marketing copy (physics "free field" is not copy)', () => {
    for (const { f, raw, s } of FILES) {
      assert.doesNotMatch(raw, /\b(classroom|instructor|students?)\b/i, f);
      // Code and copy only (comments stripped); "free field" is physics.
      assert.doesNotMatch(s.replace(/free[- ]field/gi, ''), /\bfree\b/i, f);
    }
  });
});

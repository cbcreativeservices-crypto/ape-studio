/**
 * Every URL the navigator declares must be a URL the filter lets through.
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────────────
 *
 * `linking.ts` declares the paths each screen answers to. `linkPaths.ts` decides
 * which incoming URLs the app claims at all. They are two files, and on
 * 2026-09-17 a bug-hunting pass found that they disagreed about seven paths: the
 * four Cymatics studios, the Cymatics module route, and the two Production lab
 * routes were all declared and all rejected, because `isClaimedPath` turned away
 * any `labs/` URL of more than two segments.
 *
 * On Android that is worse than not claiming them. `app.json` claims `/labs`
 * with `autoVerify`, so the OS opened the app and this filter then dropped the
 * URL — leaving the person on Home with no message and no idea why the link
 * they tapped did nothing.
 *
 * The lesson is the same one `membershipGating.test.ts` records: two files that
 * must agree will not stay in agreement by inspection. So the check is derived
 * mechanically from the navigator's own config.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { isClaimedPath, TOOL_INFO_KEYS, AWARD_PAGES } = await import(
  '../src/navigation/linkPaths.ts'
);

const LINKING = readFileSync(new URL('../src/navigation/linking.ts', import.meta.url), 'utf8');

/**
 * Every path string the navigator's `config.screens` declares, with the route
 * name it belongs to. Read out of the source rather than by importing the
 * module, which pulls in React Navigation and the whole screen tree.
 */
function declaredPaths(): { route: string; path: string }[] {
  const body = LINKING.slice(LINKING.indexOf('screens: {'), LINKING.indexOf('export function') + 1);
  const out: { route: string; path: string }[] = [];
  for (const m of body.matchAll(/^\s{4,8}(\w+):\s*'([^']+)',?\s*(?:\/\/.*)?$/gm)) {
    out.push({ route: m[1], path: m[2] });
  }
  return out;
}

/**
 * Turn a route pattern into a URL a person could actually tap.
 *
 * Two params are drawn from enumerated lists rather than being free text —
 * `tools/:toolKey` and `awards/:category` are only claimed for keys the app
 * really has, which is correct and deliberate — so they are filled from those
 * same lists. Everything else takes any value.
 */
const PARAM_SAMPLES: Record<string, string> = {
  toolKey: TOOL_INFO_KEYS[0],
  category: AWARD_PAGES[0],
  /**
   * `:lab` takes one of exactly two values, and the deep-link filter now
   * allowlists them rather than accepting `[^/]+` — a URL naming a third
   * reached `LABS[lab].stages` with `lab` undefined and threw during render.
   * So the sample has to be a REAL lab, like the two above it: a placeholder
   * would assert that the filter accepts a value the app cannot open.
   */
  lab: 'preprod',
};

function sample(path: string): string {
  return path
    .replace(/:(\w+)\??/g, (_m, name: string) => PARAM_SAMPLES[name] ?? 'sample')
    .replace(/^\//, '');
}

describe('deep links: the navigator and the filter agree', () => {
  const declared = declaredPaths();

  it('the navigator config was actually parsed', () => {
    // If the regex stops matching, every assertion below passes vacuously.
    assert.ok(declared.length > 25, `expected the full screen config, got ${declared.length}`);
    assert.ok(
      declared.some((d) => d.route === 'CymaticsPlateStudio'),
      'the Cymatics studios should be in the parsed set',
    );
  });

  it('EVERY declared path is claimed', () => {
    const rejected = declared
      .filter((d) => !isClaimedPath(sample(d.path)))
      .map((d) => `${d.route} — ${d.path}`);
    assert.deepEqual(
      rejected,
      [],
      `declared in linking.ts but rejected by isClaimedPath:\n  ${rejected.join('\n  ')}`,
    );
  });

  it('the seven paths that regressed are named explicitly', () => {
    // Belt and braces: if the parse above ever silently narrows, these still
    // hold the specific URLs that were broken.
    for (const p of [
      'labs/cymatics/plate',
      'labs/cymatics/liquid',
      'labs/cymatics/membrane',
      'labs/cymatics/gallery',
      'labs/cymatics/module/intro',
      'labs/production/preprod/p_abc/brief',
      'labs/production/postprod/exercise/add-without-erasing/podcast',
    ]) {
      assert.equal(isClaimedPath(p), true, `${p} should be claimed`);
    }
  });

  it('still refuses paths the app does NOT handle', () => {
    // Claiming a URL we would handle badly is worse than leaving it to the
    // website, which is the whole reason this filter exists.
    for (const p of [
      'labs/cymatics/not-a-studio/deeper',
      // NOTE: a bare `labs/<anything>` IS claimed on purpose — LabCategory
      // renders its own "not available" state for an id it does not know, which
      // is a better answer than sending the person to the website. Only paths
      // DEEPER than that have to be declared.
      'labs/a/b',
      'shop/checkout',
      'topics/one/two',
      'glossary/a/b',
      'admin',
      '',
    ]) {
      assert.equal(isClaimedPath(p), false, `${p} should NOT be claimed`);
    }
  });
});

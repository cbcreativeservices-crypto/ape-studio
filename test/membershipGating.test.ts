/**
 * Every members-only lab must actually be gated at the navigator.
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────────────
 *
 * On 2026-09-17 a bug-hunting pass found 31 of 47 members-only lab routes
 * registered WITHOUT `withMembershipPreview`. They were wrapped in `Gated.X`,
 * which is the ORIENTATION wrapper and checks nothing, so the two names looked
 * interchangeable at a glance and nobody noticed for months.
 *
 * It was invisible from inside the app because the catalog draws its own
 * padlock, so the normal route in behaved correctly. Every OTHER way in did
 * not: the `labs/:id` deep link, Career Finder's "try a lab", the Glossary's
 * "Launch Lab", and any restored navigation state all opened paid labs fully
 * unlocked, with audio, awarding completion credit.
 *
 * The lesson is that this cannot be maintained by eye — the catalog and the
 * navigator are different files and drift silently. So it is derived here,
 * mechanically, from the same catalog the app ships.
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

const { LAB_CATEGORIES, isMemberOnlyLabRoute } = await import('../src/screens/lab/labCatalog.ts');

const NAV = readFileSync(new URL('../src/navigation/RootNavigator.tsx', import.meta.url), 'utf8');

/** route name → the component expression it is registered with. */
function registrations(): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of NAV.matchAll(
    /<Stack\.Screen\s+name="(\w+)"[\s\S]{0,220}?component=\{([^}]+)\}/g,
  )) {
    out.set(m[1], m[2].trim());
  }
  return out;
}

/** Every lab route the catalog says requires membership. */
function memberOnlyRoutes(): Set<string> {
  const out = new Set<string>();
  for (const cat of LAB_CATEGORIES as never[]) {
    const c = cat as {
      section: string;
      alwaysFree?: boolean;
      kind: string;
      route?: string;
      labs?: { route?: string; member?: boolean }[];
      families?: { labs: { route?: string; member?: boolean }[] }[];
    };
    // The Calculator Lab is deliberately exempt: free users get it with a
    // weekly cap rather than a lock (owner 2026-09-01).
    if (c.alwaysFree) continue;
    const leaves = [...(c.labs ?? []), ...(c.families ?? []).flatMap((f) => f.labs)];
    for (const l of leaves) {
      if (l.route && (l.member || c.section === 'training')) out.add(l.route);
    }
    if (c.kind === 'hub' && c.route && c.section === 'training') out.add(c.route);
  }
  return out;
}

describe('members-only labs are gated at the navigator', () => {
  const reg = registrations();
  const needed = memberOnlyRoutes();

  it('the catalog and the navigator were both parsed', () => {
    // If either regex stops matching, every assertion below passes vacuously —
    // which would be worse than the bug, so assert the inputs first.
    assert.ok(needed.size > 30, `expected many member-only routes, got ${needed.size}`);
    assert.ok(reg.size > 90, `expected the full screen registry, got ${reg.size}`);
  });

  it('EVERY members-only route is registered through withMembershipPreview', () => {
    const ungated: string[] = [];
    for (const route of needed) {
      const component = reg.get(route);
      if (!component) {
        ungated.push(`${route} — NOT REGISTERED`);
        continue;
      }
      // `Gated.X` is the orientation wrapper and checks nothing. Only
      // `MemberGated.X` applies withMembershipPreview. This distinction is the
      // entire bug.
      if (!/MemberGated\./.test(component)) ungated.push(`${route} — ${component}`);
    }
    assert.deepEqual(ungated, [], `members-only routes with no membership check:\n  ${ungated.join('\n  ')}`);
  });

  it('THE WRAPPER IS NOT THE GATE — the predicate it calls must agree', () => {
    // ── THE MOST IMPORTANT ASSERTION IN THIS FILE ───────────────────────
    //
    // The tests around it check the SOURCE TEXT of RootNavigator for
    // `MemberGated.`, which is how the original 31-route hole was found. But
    // `withMembershipPreview` does not gate on being wrapped — it gates on
    // `isMemberOnlyLabRoute(route.name)`, which reads a map derived from the
    // catalog and returns false for any route the catalog cannot name.
    //
    // So on 2026-09-17 eight routes were wrapped, passed this file's text
    // check, and gated NOTHING: the four Cymatics studios, its gallery and
    // module routes, and the two Production child screens. The deep links for
    // them were then opened on the strength of that wrapping, removing the
    // accidental protection that had been covering it. A pass-3 sweep found it.
    //
    // Asserting on the predicate itself is the only version of this test that
    // could not have passed while the app was open.
    const ungated = [...needed].filter((r) => !isMemberOnlyLabRoute(r));
    assert.deepEqual(ungated, [], `routes wrapped but NOT members-only to the gate:\n  ${ungated.join('\n  ')}`);
  });

  it('the CHILD routes of the two flagship labs are gated too', () => {
    // The set above is derived from catalog LEAVES, and a lab's inner screens
    // are not leaves — so this whole family was invisible to it. They were
    // found in pass 2, one level below the 31 that pass 1 found, registered
    // through the orientation wrapper that checks nothing.
    //
    // They are safe today only because `isClaimedPath` happens to reject
    // `labs/` URLs of more than two segments, which is itself filed as a bug to
    // fix — so this is written down rather than left to that accident.
    const children = [
      'CymaticsModule',
      'CymaticsPlateStudio',
      'CymaticsLiquidStudio',
      'CymaticsMembraneStudio',
      'CymaticsGallery',
      'ProductionStage',
      'ProductionActivity',
      // The shared target both named production routes point at. The catalog
      // names PreProdLab / PostProdLab and has no row for this one.
      'ProductionLab',
    ];
    const ungated = children
      .map((r) => [r, reg.get(r)] as const)
      // BOTH halves, because either alone is insufficient: the wrapper without
      // the predicate gates nothing, and the predicate without the wrapper is
      // never consulted.
      .filter(([r, c]) => !c || !/MemberGated\./.test(c) || !isMemberOnlyLabRoute(r))
      .map(([r, c]) => `${r} — ${c ?? 'NOT REGISTERED'}${isMemberOnlyLabRoute(r) ? '' : ' (predicate says NOT members-only)'}`);
    assert.deepEqual(ungated, [], `paid-lab child routes with no membership check:\n  ${ungated.join('\n  ')}`);
  });

  it('every MemberGated entry really wraps with withMembershipPreview', () => {
    // Guards the other direction: an entry added to the map without the wrapper
    // would satisfy the test above while gating nothing.
    const block = NAV.slice(NAV.indexOf('const MemberGated = {'));
    const body = block.slice(0, block.indexOf('} as const;'));
    const entries = [...body.matchAll(/^\s{2}(\w+):\s*(.+?),\s*$/gm)];
    assert.ok(entries.length > 40, `expected the full MemberGated map, got ${entries.length}`);
    for (const [, name, value] of entries) {
      assert.match(value, /withMembershipPreview\(/, `MemberGated.${name} does not wrap`);
    }
  });
});

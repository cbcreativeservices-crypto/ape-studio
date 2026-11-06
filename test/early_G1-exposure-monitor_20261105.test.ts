/**
 * Exposure Monitor settings say what they really do (early-lab sweep, 2026-11-05).
 *
 * Renders the real screen with its neighbours stood in, then reads what a
 * student would read and presses what a student would press:
 *  - 'Elevated only' behaved exactly like 'Off', so it is gone, and an old
 *    saved 0 still lights a chip;
 *  - picking a standard does not re-count today's dose, and the words say so.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const FILE = fileURLToPath(new URL('../src/screens/tools/ExposureMonitorScreen.tsx', import.meta.url));
const nodeRequire = createRequire(import.meta.url);

type Pressed = { text: string; selected: boolean; press: () => void };
const INTERVAL_LABELS = ['15 min', '30 min', '60 min', 'Off'];
const chosenInterval = (all: Pressed[]) => all.filter((c) => c.selected && INTERVAL_LABELS.includes(c.text)).map((c) => c.text);
const textOf = (n: React.ReactNode): string =>
  typeof n === 'string' || typeof n === 'number'
    ? String(n)
    : Array.isArray(n)
      ? n.map(textOf).join('')
      : React.isValidElement(n)
        ? textOf((n.props as { children?: React.ReactNode }).children)
        : '';

/** Renders the screen with this stored check-in value; returns its text and controls. */
function renderScreen(checkinMinutes: number) {
  const pressables: Pressed[] = [];
  const patches: Record<string, unknown>[] = [];
  const box = (p: { children?: React.ReactNode }) => React.createElement('div', null, p.children);
  const settings = {
    enabled: true, checkinMinutes, criticalWarnings: true, advisoryWarnings: true, haptics: true,
    standard: 'niosh3', refSplAt0Dbfs: 100, refCalibrated: false, saveHistory: true,
  };
  const anything = (): unknown =>
    new Proxy(function () {}, {
      get: (_t, k) => (k === Symbol.toPrimitive ? () => '' : k === 'then' ? undefined : k === '__esModule' ? true : k === 'prototype' ? undefined : anything()),
      apply: () => null,
    });
  const modules: Record<string, unknown> = {
    'react-native': {
      View: box, ScrollView: box, Text: box,
      Share: {}, StyleSheet: { create: (x: unknown) => x, hairlineWidth: 1 },
      Pressable: (p: { children?: React.ReactNode; onPress?: () => void; 'aria-pressed'?: boolean }) => {
        pressables.push({ text: textOf(p.children), selected: p['aria-pressed'] === true, press: () => p.onPress?.() });
        return React.createElement('div', null, p.children);
      },
    },
    '@react-navigation/native': { useNavigation: () => ({}) },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) },
    '../../features/audio/exposureMonitor': {
      DEFAULT_SETTINGS: settings,
      EXPOSURE_HONESTY_LINE: '',
      ROUTE_LABELS: {},
      STANDARD_LABELS: { niosh3: 'NIOSH', osha5: 'OSHA', conservative3: 'Conservative' },
      dateKeyOf: () => '2026-11-05',
      fmtDuration: () => '0 min',
      fmtRemaining: () => '1 hr',
      subscribeExposure: () => () => {},
      updateExposureSettings: (patch: Record<string, unknown>) => {
        patches.push(patch);
        return Promise.resolve(true);
      },
      getExposureSnapshot: () => ({
        enabled: true, active: false, settings, todayDose: 0.25, todayActiveSec: 600, todayMaxDb: 90, todayAvgDb: 85,
        sessionActiveSec: 0, sessionMaxDb: 0, sessionStartMs: null, currentDb: null, route: 'speaker', routeLabel: '',
        confidence: 'general', measured: false, remainingSec: 3600, belowStandardRange: false, checkinsToday: 0, hadGap: false, doseUnreadable: false,
      }),
    },
  };
  const req = (spec: string): unknown => {
    if (spec === 'react' || spec.startsWith('react/')) return nodeRequire(spec);
    return modules[spec] ?? anything();
  };
  const js = ts.transpileModule(readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const mod = { exports: {} as { ExposureMonitorScreen: React.ComponentType } };
  new Function('require', 'module', 'exports', js)(req, mod, mod.exports);
  const html = renderToStaticMarkup(React.createElement(mod.exports.ExposureMonitorScreen));
  // Tags become spaces.
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const chip = (label: string) => pressables.find((c) => c.text === label);
  return { text, pressables, patches, chip };
}

describe('routine check-in interval', () => {
  it('offers no option that behaves the same as Off', () => {
    const { text, chip } = renderScreen(15);
    assert.ok(!text.includes('Elevated only'), 'Elevated only did exactly what Off does');
    for (const label of INTERVAL_LABELS) assert.ok(chip(label), `${label} is offered`);
    assert.ok(text.includes('Elevated-level advisories'), 'elevated advisories keep their own toggle');
  });

  it('a saved 0 and a saved -1 both show Off as the choice', () => {
    for (const stored of [0, -1]) {
      const { pressables, chip } = renderScreen(stored);
      assert.equal(chip('Off')?.selected, true, `stored ${stored} lights Off`);
      assert.deepEqual(chosenInterval(pressables), ['Off'], `stored ${stored}: one choice`);
    }
  });

  it('a positive value lights its own chip, not Off', () => {
    const { pressables } = renderScreen(30);
    assert.deepEqual(chosenInterval(pressables), ['30 min']);
  });

  it('pressing Off stores -1, which the monitor reads as no routine check-ins', () => {
    const { chip, patches } = renderScreen(15);
    chip('Off')?.press();
    assert.deepEqual(patches, [{ checkinMinutes: -1 }]);
    assert.ok(!((patches[0].checkinMinutes as number) > 0));
  });
});

describe('exposure standard wording', () => {
  it('no longer promises that the pick changes today’s answer', () => {
    const { text } = renderScreen(15);
    assert.ok(!/changes\s+the answer/.test(text), text);
    assert.ok(text.includes('sets how your dose counts from then on'));
  });

  it('says what a new standard does, directly under the list', () => {
    const { text } = renderScreen(15);
    const line = 'A new standard counts from the moment you pick it. Today’s dose so far stays as counted; Time remaining updates right away.';
    const at = text.indexOf(line);
    assert.ok(at >= 0, 'the plain line is on the screen');
    assert.ok(text.indexOf('Conservative') < at, 'it sits under the standards');
    assert.ok(at < text.indexOf('Reference point:'), 'and above the reference point');
  });

  it('pressing a standard still stores it', () => {
    const { pressables, patches } = renderScreen(15);
    pressables.find((c) => c.text.includes('OSHA'))?.press();
    assert.deepEqual(patches, [{ standard: 'osha5' }]);
  });
});

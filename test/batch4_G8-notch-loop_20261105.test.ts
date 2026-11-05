/**
 * Sound Systems, Feedback control and Ring-out (2026-11-05): NOTCH promises a
 * cut in the loop, yet FeedbackLoop took no notch input, so in a stable loop
 * the stage drew the same picture with the notch in or out. The stage now tags
 * the console → amplifier line, where the send runs.
 *
 * diagrams.tsx is really rendered: transpiled with the repo's TypeScript and
 * run with stand-ins that record every word, box and line it draws.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const DIR = 'src/screens/lab/soundsystems';
const FILE = `${DIR}/art/diagrams.tsx`;
const nodeRequire = createRequire(import.meta.url);
const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const VIEW_W = 354;

type Word = { text: string; x: number; y: number; size: number; fill: string };
type Box = { x: number; y: number; width: number; height: number; stroke?: string };
type Rule = { x1: number; y1: number; x2: number; y2: number };
type Props = { wedge: 'null' | 'live'; ringing: boolean; sendDb: number; compact?: boolean; notched?: boolean };

function draw(props: Props) {
  const words: Word[] = [];
  const boxes: Box[] = [];
  const rules: Rule[] = [];
  let a11y = '';
  let height = 0;
  const pass = (p: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, p.children);
  const Svg = (p: { viewBox: string; children?: React.ReactNode }) => {
    height = Number(p.viewBox.split(' ')[3]);
    return pass(p);
  };
  const SvgText = (p: { children?: React.ReactNode; x: number; y: number; fontSize: number; fill: string }) => {
    words.push({ text: String(p.children), x: p.x, y: p.y, size: p.fontSize, fill: p.fill });
    return null;
  };
  const Rect = (p: Box) => {
    boxes.push(p);
    return null;
  };
  const Line = (p: Rule) => {
    rules.push(p);
    return null;
  };
  const View = (p: { accessibilityLabel?: string; children?: React.ReactNode }) => {
    a11y = p.accessibilityLabel ?? a11y;
    return pass(p);
  };
  const none = () => null;
  const modules: Record<string, unknown> = {
    'react-native': { StyleSheet: { create: (x: unknown) => x }, Text: pass, View },
    'react-native-svg': { __esModule: true, default: Svg, Circle: none, G: pass, Line, Path: none, Polygon: none, Rect, Text: SvgText },
    '../../../../theme/tokens': { colors: { cyanBright: '#cyan', red: '#red', textMuted: '#muted', textSecondary: '#second', amber: '#a', amberLabel: '#al', hairline: '#h' }, fonts: { oswaldMedium: 'm', oswaldSemiBold: 's' } },
    './gearArt': { GearInSvg: none, INK: {} },
    './planArt': { Wedge2WayPlan: none, wedgeJackY: () => 0 },
    '../../../../features/lab/headIconsSvg': { HeadIconSvg: none },
    '../../../../features/lab/figureAboveSvg': { FigureAboveSvg: none },
    './VenueView': { CABLE_COLORS: { line: '#line', mic: '#mic', speaker: '#speaker' } },
  };
  const req = (spec: string): unknown => {
    if (spec === 'react' || spec.startsWith('react/')) return nodeRequire(spec);
    assert.ok(spec in modules, `stand-in for ${spec}`);
    return modules[spec];
  };
  const js = ts.transpileModule(read(FILE), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} as { FeedbackLoop: React.ComponentType<Props> } };
  new Function('require', 'module', 'exports', js)(req, mod, mod.exports);
  renderToStaticMarkup(React.createElement(mod.exports.FeedbackLoop, props));
  return { words, boxes, rules, a11y, height };
}

const STABLE: Props = { wedge: 'live', ringing: false, sendDb: -18 };
const tagOf = (d: ReturnType<typeof draw>) => d.words.find((w) => w.text === 'NOTCH');

describe('NOTCH, seen on the feedback loop', () => {
  it('leaves the loop plain with the notch out', () => {
    assert.equal(tagOf(draw(STABLE)), undefined);
    assert.equal(tagOf(draw({ ...STABLE, notched: false })), undefined);
  });

  it('changes the picture of a STABLE loop: the status line alone stays the same', () => {
    const out = draw(STABLE);
    const inn = draw({ ...STABLE, notched: true });
    assert.ok(tagOf(inn), 'the NOTCH tag is drawn');
    const status = (d: ReturnType<typeof draw>) => d.words.find((w) => w.text.startsWith('LOOP'))?.text;
    assert.equal(status(inn), status(out));
  });

  for (const wedge of ['live', 'null'] as const) {
    for (const ringing of [false, true]) {
      for (const compact of [false, true]) {
        it(`sits on the console → amplifier line, at the floor size (${wedge}, ${ringing ? 'ringing' : 'stable'}, ${compact ? 'compact' : 'full'})`, () => {
          const d = draw({ wedge, ringing, sendDb: -18, compact, notched: true });
          const tag = tagOf(d);
          assert.ok(tag);
          assert.ok(tag.size >= 9.6, `word size ${tag.size}`);
          const send = d.rules.find((r) => r.x1 === r.x2 && r.x1 === tag.x);
          assert.ok(send, 'the tag is centred on the console → amplifier line');
          assert.ok(tag.y > send.y1 && tag.y < send.y2, `${tag.y} between ${send.y1} and ${send.y2}`);
          const box = d.boxes.find((b) => b.stroke === '#cyan');
          assert.ok(box, 'the tag has its box');
          assert.ok(box.x > 0 && box.x + box.width < VIEW_W && box.y > 0 && box.y + box.height < d.height, 'inside the diagram');
          // A gap of the line shows on both sides, so it reads as ON the path.
          assert.ok(box.y > send.y1 && box.y + box.height < send.y2, `box ${box.y}..${box.y + box.height} on line ${send.y1}..${send.y2}`);
          assert.ok(box.width >= 40, 'wide enough for NOTCH at the floor size');
          for (const w of d.words) {
            if (w === tag) continue;
            const clearInHeight = w.y - w.size > box.y + box.height || w.y < box.y;
            const clearInWidth = w.x + 60 < box.x; // no word left of the tag runs 60 units
            assert.ok(clearInHeight || clearInWidth, `"${w.text}" is clear of the tag`);
          }
        });
      }
    }
  }

  it('tells a screen reader too', () => {
    assert.match(draw({ ...STABLE, notched: true }).a11y, /notch/i);
    assert.doesNotMatch(draw(STABLE).a11y, /notch/i);
  });

  it('is fed by both pages with the state NOTCH toggles', () => {
    assert.match(read(`${DIR}/pagesLearnC.tsx`), /<FeedbackLoop [^>]*\bnotched=\{notched\}/);
    assert.match(read(`${DIR}/pagesOperate.tsx`), /<FeedbackLoop [^>]*\bnotched=\{w\.notched\}/);
  });
});

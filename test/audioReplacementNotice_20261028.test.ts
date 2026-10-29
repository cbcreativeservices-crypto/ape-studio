/**
 * Must-do D28 (owner 2026-10-28): "We're updating our audio" before the first
 * sound in a lab whose recordings the engineer is replacing (brief v2), once
 * per lab per session, one PLAY button; the live list is on the server.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { registerHooks } from 'node:module';

const root = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n');

// The module imports the server client, navigation and the dialog: stub them.
const g = globalThis as Record<string, unknown>;
g.__ARN_ROUTE__ = null as null | { name: string; params?: unknown };
g.__ARN_DIALOGS__ = [] as { confirmText?: string; hideCancel?: boolean; onConfirm?: () => void; onCancel?: () => void; title: string; body: string }[];
g.__ARN_RPC__ = { data: null, error: { message: 'missing' } };
const STUBS: Record<string, string> = {
  'lib/supabase': `export const supabase = { rpc: async () => globalThis.__ARN_RPC__ };`,
  'navigation/navigationRef': `export const navigationRef = { isReady: () => true, getCurrentRoute: () => globalThis.__ARN_ROUTE__ };`,
  'components/AppDialog': `export function showAppDialog(r) { globalThis.__ARN_DIALOGS__.push(r); }`,
};
registerHooks({
  resolve(spec, ctx, next) {
    for (const [k, src] of Object.entries(STUBS)) if (spec.endsWith(k)) return { url: 'data:text/javascript,' + encodeURIComponent(src), shortCircuit: true };
    if (spec.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(spec)) return next(spec + '.ts', ctx);
    return next(spec, ctx);
  },
});

const ar = await import('../src/features/audio/audioReplacement.ts');
const sf = await import('../src/features/audio/startFenced.ts');
const dialogs = () => g.__ARN_DIALOGS__ as { confirmText?: string; hideCancel?: boolean; onConfirm?: () => void; onCancel?: () => void; title: string; body: string }[];
const at = (name: string, params?: unknown) => (g.__ARN_ROUTE__ = { name, params });
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('the list (engineer brief v2 minus what was uploaded)', () => {
  it('covers all 89 brief items, and only those', () => {
    const items = new Set(Object.values(ar.AREA_ITEMS).flat());
    const brief = new Set(
      ['rb2_items1.py', 'rb2_items2.py', 'rb2_items3.py'].flatMap((f) =>
        [...read(`docs/recording_brief/${f}`).matchAll(/^item\(id="([^"]+)"/gm)].map((m) => m[1]),
      ),
    );
    assert.equal(brief.size, 89);
    assert.deepEqual([...items].sort(), [...brief].sort());
  });
  it('uploaded items drop out; partly delivered ones (MTR-02 birdsong, TL-04 sung A4) stay', () => {
    for (const id of ['GAN-01', 'MSL-02', 'MPR-04a']) assert.ok(!ar.DEFAULT_PENDING_ITEMS.includes(id), id);
    for (const id of ['MTR-02', 'TL-04', 'MIX-01', 'EAR-01']) assert.ok(ar.DEFAULT_PENDING_ITEMS.includes(id), id);
    assert.equal(ar.areaPending('gain', ar.DEFAULT_PENDING_ITEMS), false, 'Gain Staging: its one item is uploaded');
    assert.equal(ar.areaPending('micSelection', ar.DEFAULT_PENDING_ITEMS), true, 'MSL-01 still owed');
  });
  it('maps screens to lab areas, with params where the route is shared', () => {
    assert.equal(ar.areaForRoute('BeginningMixingLab'), 'mixing');
    assert.equal(ar.areaForRoute('ReverbLab'), 'fx');
    assert.equal(ar.areaForRoute('EarModule', { id: 'x' }), 'earTraining');
    assert.equal(ar.areaForRoute('ProductionStage', { lab: 'postprod' }), 'postProduction');
    assert.equal(ar.areaForRoute('ProductionStage', { lab: 'preprod' }), null);
    assert.equal(ar.areaForRoute('ToolDemo', { toolKey: 'hzcounter' }), 'toolTuner');
    assert.equal(ar.areaForRoute('ToolDemo', { toolKey: 'signalgen' }), null);
    assert.equal(ar.areaForRoute('BassLab'), null, 'not on the brief');
    assert.equal(ar.areaForRoute('Glossary'), null, 'spoken voice, not a file');
  });
});

describe('the notice', () => {
  it('uses the owner-approved wording and one PLAY button', () => {
    assert.equal(ar.REPLACEMENT_NOTICE_BODY,
      'As we launch in November 2026, we are replacing many of our audio files with new recordings. You can listen to this one now, but it is not our final version. We expect every audio file to be replaced and updated by January 1, 2027.');
    assert.equal(ar.REPLACEMENT_NOTICE_BUTTON, 'PLAY');
  });

  it('a listed lab: the sound waits for PLAY, then plays at once for the rest of the session', () => {
    ar.resetAudioReplacementNotice();
    dialogs().length = 0;
    at('MasteringLab');
    let played = 0;
    ar.runAfterNotice(() => played++);
    assert.equal(played, 0, 'nothing sounds before PLAY');
    assert.equal(dialogs().length, 1);
    assert.equal(dialogs()[0].confirmText, 'PLAY');
    assert.equal(dialogs()[0].hideCancel, true);
    dialogs()[0].onConfirm!();
    assert.equal(played, 1);
    ar.runAfterNotice(() => played++);
    assert.equal(played, 2);
    assert.equal(dialogs().length, 1, 'once per lab per session');
  });

  it('closing it without PLAY plays nothing, and the next press asks again', () => {
    ar.resetAudioReplacementNotice();
    dialogs().length = 0;
    at('NoiseLab');
    let played = 0, declined = 0;
    ar.runAfterNotice(() => played++, () => declined++);
    dialogs()[0].onCancel!();
    assert.equal(played, 0);
    assert.equal(declined, 1);
    ar.runAfterNotice(() => played++);
    assert.equal(dialogs().length, 2);
  });

  it('a lab not on the list, or a fully delivered one, plays straight away', () => {
    ar.resetAudioReplacementNotice();
    dialogs().length = 0;
    let played = 0;
    at('BassLab');
    ar.runAfterNotice(() => played++);
    at('GainLabHome');
    ar.runAfterNotice(() => played++);
    assert.equal(played, 2);
    assert.equal(dialogs().length, 0);
  });

  it('the server list wins once read: an item cleared there stops the notice', async () => {
    ar.resetAudioReplacementNotice();
    dialogs().length = 0;
    g.__ARN_RPC__ = { data: ['MIX-01'], error: null };
    at('MasteringLab');
    let played = 0;
    ar.runAfterNotice(() => played++); // default list: asks, and reads the server
    dialogs()[0].onCancel!();
    await tick();
    ar.runAfterNotice(() => played++); // server says only MIX-01 is owed
    assert.equal(played, 1, 'Mastering no longer asks');
    at('AdvancedMixingLab');
    ar.runAfterNotice(() => played++);
    assert.equal(dialogs().length, 2, 'Mixing still asks');
    g.__ARN_RPC__ = { data: null, error: { message: 'missing' } };
  });

  it('startFenced asks first, and a close without PLAY blocks the start as "notice"', async () => {
    ar.resetAudioReplacementNotice();
    dialogs().length = 0;
    ar.installAudioReplacementNotice();
    at('FmLab');
    let started = 0;
    const p = sf.startFenced({ start: () => { started++; }, stop: () => {} });
    await tick();
    assert.equal(started, 0, 'nothing starts while the notice is up');
    dialogs()[0].onCancel!();
    const r = await p;
    assert.deepEqual(r, { status: 'blocked', why: 'notice' });
    assert.equal(started, 0);
    (await import('../src/features/audio/audioOutputStore.ts')).setBeforeSoundStart(null);
  });
});

describe('wiring', () => {
  it('the app installs it, and the shared output gate asks it after output is allowed', () => {
    assert.match(read('App.tsx'), /installAudioReplacementNotice\(\);/);
    const gate = read('src/features/audio/AudioOutputGate.tsx');
    assert.match(gate, /api\.requestAudioOutput\(\)\.then\(\(ok\) => \(ok \? askBeforeSoundStart\(\) : false\)\)/);
    assert.match(gate, /<AudioOutputGateContext\.Provider value=\{gatedApi\}>/);
  });
  it('startFenced keeps no heavy imports (plain tests import it)', () => {
    const s = read('src/features/audio/startFenced.ts');
    const imports = s.split('\n').filter((l) => /^import /.test(l)).join('\n');
    assert.doesNotMatch(imports, /navigation|supabase|AppDialog/);
  });
});

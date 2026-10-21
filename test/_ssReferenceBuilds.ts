/**
 * The ten capstone reference builds — one per BUILD capstone, each the
 * proof that its brief is satisfiable on the venue plot the lab provides,
 * every cable from the console side carrying an explicit console output
 * (WF-SS-02, 2026-10-20) — mono subs on MAIN MONO where LEARN calls them the
 * standard, and no amplifier passing more than its two mixes (round-2 grade
 * SS-R2-01/07). Shared by soundSystemsEngine.test.ts and
 * consoleOutputs_20261020.test.ts so the two can never drift.
 *
 * Import it AFTER registering the house resolver hook (the source modules
 * import siblings without extensions).
 */
import assert from 'node:assert/strict';

const sys = await import('../src/features/soundsystems/system.ts');
const con = await import('../src/features/soundsystems/console.ts');
const caps = await import('../src/features/soundsystems/capstones.ts');

type System = import('../src/features/soundsystems/types.ts').SoundSystem;
type GearKind = import('../src/features/soundsystems/types.ts').GearKind;
type SlotId = import('../src/features/soundsystems/types.ts').SlotId;
type ConsoleOut = import('../src/features/soundsystems/types.ts').ConsoleOut;
type CS = import('../src/features/soundsystems/console.ts').ConsoleState;

export class Build {
  s: System = sys.EMPTY_SYSTEM;
  ids: Record<string, string> = {};
  put(tag: string, kind: GearKind, slot: SlotId): this {
    const v = sys.place(this.s, kind, slot);
    assert.ok(v.ok, `place ${kind} at ${slot}: ${v.ok ? '' : v.reason}`);
    this.s = v.system;
    this.ids[tag] = v.id;
    return this;
  }
  /** `out` names the console output the cable carries. */
  link(a: string, b: string, out?: ConsoleOut): this {
    const v = sys.connect(this.s, this.ids[a], this.ids[b], out);
    assert.ok(v.ok, `connect ${a}→${b}: ${v.ok ? '' : v.reason}`);
    this.s = v.system;
    return this;
  }
}

/** A reference build per capstone — the proof that each brief is satisfiable
 *  on the venue plot the lab provides. */
export function referenceBuild(id: string): { s: System; cs: CS } {
  // The console each capstone page starts from (non-routing capstones come
  // with their sub buses preset — SS-R2-04).
  let cs = caps.capstoneConsole(caps.capstone(id));
  const b = new Build();
  const pre = (ch: string, aux: string) => (cs = con.setSend(cs, ch, aux, { db: 0, tap: 'pre' }));
  const post = (ch: string, aux: string) => (cs = con.setSend(cs, ch, aux, { db: 0, tap: 'post' }));
  const fourMixes = () => {
    pre('vox', 'aux1');
    pre('gtr', 'aux2');
    pre('bass', 'aux3');
    pre('kick', 'aux4');
  };
  const auxFedSubs = () => {
    post('kick', 'aux6');
    post('bass', 'aux6');
    post('keys', 'aux6');
  };
  switch (id) {
    case 'speech':
      b.put('mic', 'vocalMic', 'stageC').put('con', 'console', 'foh').put('l', 'poweredSpeaker', 'mainL').put('r', 'poweredSpeaker', 'mainR')
        .link('mic', 'con').link('con', 'l', 'mainL').link('con', 'r', 'mainR');
      break;
    case 'mono-music':
      b.put('mic', 'vocalMic', 'stageC').put('di', 'di', 'stageL').put('pb', 'playback', 'stageR').put('con', 'console', 'foh')
        .put('c', 'poweredSpeaker', 'mainC').put('sub', 'poweredSub', 'subC')
        .link('mic', 'con').link('di', 'con').link('pb', 'con').link('con', 'c', 'mainMono').link('con', 'sub', 'mainMono');
      break;
    case 'stereo-subs':
      b.put('m1', 'vocalMic', 'stageC').put('m2', 'instrumentMic', 'riserC').put('d1', 'di', 'stageL').put('rx', 'wirelessRx', 'stageR')
        .put('box', 'stagebox', 'stageBox').put('con', 'console', 'foh').put('proc', 'processor', 'rack1').put('ampT', 'amp', 'rack2').put('ampS', 'amp', 'rack3')
        .put('l', 'passiveSpeaker', 'mainL').put('r', 'passiveSpeaker', 'mainR').put('sl', 'passiveSub', 'subL').put('sr', 'passiveSub', 'subR')
        .link('m1', 'box').link('m2', 'box').link('d1', 'box').link('rx', 'box').link('box', 'con').link('con', 'proc')
        .link('proc', 'ampT').link('proc', 'ampS').link('ampT', 'l', 'mainL').link('ampT', 'r', 'mainR').link('ampS', 'sl', 'mainMono').link('ampS', 'sr', 'mainMono');
      break;
    case 'two-one':
      b.put('pb', 'playback', 'stageC').put('con', 'console', 'foh').put('l', 'poweredSpeaker', 'mainL').put('r', 'poweredSpeaker', 'mainR').put('sub', 'poweredSub', 'subC')
        .link('pb', 'con').link('con', 'l', 'mainL').link('con', 'r', 'mainR').link('con', 'sub', 'aux6');
      break;
    case 'monitors':
      b.put('m1', 'vocalMic', 'stageC').put('m2', 'instrumentMic', 'riserC').put('d1', 'di', 'stageL').put('d2', 'di', 'stageR').put('con', 'console', 'foh')
        .put('w1', 'poweredWedge', 'mon1').put('w2', 'poweredWedge', 'mon2').put('w3', 'poweredWedge', 'mon3').put('w4', 'poweredWedge', 'mon4')
        .put('l', 'poweredSpeaker', 'mainL').put('r', 'poweredSpeaker', 'mainR')
        .link('m1', 'con').link('m2', 'con').link('d1', 'con').link('d2', 'con')
        .link('con', 'w1', 'aux1').link('con', 'w2', 'aux2').link('con', 'w3', 'aux3').link('con', 'w4', 'aux4').link('con', 'l', 'mainL').link('con', 'r', 'mainR');
      fourMixes();
      break;
    case 'groups-fx':
      b.put('mic', 'vocalMic', 'stageC').put('con', 'console', 'foh').put('l', 'poweredSpeaker', 'mainL').put('r', 'poweredSpeaker', 'mainR')
        .link('mic', 'con').link('con', 'l', 'mainL').link('con', 'r', 'mainR');
      for (const d of ['kick', 'snare', 'oh']) cs = con.setChannel(cs, d, { toMain: false, subgroup: 'sub-drums' });
      post('vox', 'aux5');
      post('bvox', 'aux5');
      for (const c of ['kick', 'snare', 'oh', 'bass', 'gtr', 'keys', 'vox', 'bvox']) cs = con.setChannel(cs, c, { dca: 'dca-band' });
      break;
    case 'matrices':
      b.put('mic', 'vocalMic', 'stageC').put('rx', 'wirelessRx', 'stageL').put('pb', 'playback', 'stageR').put('con', 'console', 'foh')
        .put('l', 'poweredSpeaker', 'mainL').put('r', 'poweredSpeaker', 'mainR').put('fl', 'poweredSpeaker', 'frontFillL').put('fr', 'poweredSpeaker', 'frontFillR').put('sub', 'poweredSub', 'subC')
        .link('mic', 'con').link('rx', 'con').link('pb', 'con').link('con', 'l', 'mainL').link('con', 'r', 'mainR').link('con', 'fl', 'mtx2').link('con', 'fr', 'mtx2').link('con', 'sub', 'mtx1');
      cs = con.setMatrixInput(cs, 'mx-fills', 'main', 0);
      pre('mc', 'aux7');
      cs = con.setMatrixInput(cs, 'mx-lobby', 'main', -6);
      cs = con.setMatrixInput(cs, 'mx-lobby', 'aux7', 0);
      cs = con.setMatrixInput(cs, 'mx-subs', 'main', 0);
      break;
    case 'outdoor':
      b.put('m1', 'vocalMic', 'stageC').put('m2', 'instrumentMic', 'riserC').put('d1', 'di', 'stageL').put('d2', 'di', 'stageR')
        .put('box', 'stagebox', 'stageBox').put('con', 'console', 'foh').put('proc', 'processor', 'rack1').put('ampT', 'amp', 'rack2').put('ampS', 'amp', 'rack3')
        .put('l', 'passiveSpeaker', 'mainL').put('r', 'passiveSpeaker', 'mainR').put('sl', 'passiveSub', 'subL').put('sr', 'passiveSub', 'subR')
        .put('fl', 'poweredSpeaker', 'frontFillL').put('fr', 'poweredSpeaker', 'frontFillR').put('dl', 'poweredSpeaker', 'delayL').put('dr', 'poweredSpeaker', 'delayR')
        .link('m1', 'box').link('m2', 'box').link('d1', 'box').link('d2', 'box').link('box', 'con').link('con', 'proc')
        .link('proc', 'ampT').link('proc', 'ampS').link('ampT', 'l', 'mainL').link('ampT', 'r', 'mainR').link('ampS', 'sl', 'mainMono').link('ampS', 'sr', 'mainMono')
        .link('proc', 'fl', 'mtx2').link('proc', 'fr', 'mtx2').link('proc', 'dl', 'mainL').link('proc', 'dr', 'mainR');
      break;
    case 'network':
      b.put('m1', 'vocalMic', 'stageC').put('m2', 'instrumentMic', 'riserC').put('d1', 'di', 'stageL').put('rx', 'wirelessRx', 'stageR')
        .put('box', 'stagebox', 'stageBox').put('con', 'console', 'foh').put('proc', 'processor', 'rack1').put('amp', 'amp', 'rack2')
        .put('l', 'passiveSpeaker', 'mainL').put('r', 'passiveSpeaker', 'mainR')
        .link('m1', 'box').link('m2', 'box').link('d1', 'box').link('rx', 'box').link('box', 'con').link('con', 'box')
        .link('box', 'proc').link('proc', 'amp').link('amp', 'l', 'mainL').link('amp', 'r', 'mainR');
      break;
    case 'festival':
      b.put('m1', 'vocalMic', 'stageC').put('m2', 'vocalMic', 'stageL').put('m3', 'instrumentMic', 'riserC').put('m4', 'instrumentMic', 'riserL').put('d1', 'di', 'riserR').put('rx', 'wirelessRx', 'stageR')
        .put('pack', 'iemPack', 'wingL').put('box', 'stagebox', 'stageBox').put('con', 'console', 'foh')
        .put('proc', 'processor', 'rack1').put('ampT', 'amp', 'rack2').put('ampS', 'amp', 'rack3').put('tx', 'iemTx', 'rack4')
        .put('l', 'passiveSpeaker', 'mainL').put('r', 'passiveSpeaker', 'mainR').put('sl', 'passiveSub', 'subL').put('sr', 'passiveSub', 'subR')
        .put('w1', 'poweredWedge', 'mon1').put('w2', 'poweredWedge', 'mon2').put('w3', 'poweredWedge', 'mon3').put('w4', 'poweredWedge', 'mon4')
        .link('m1', 'box').link('m2', 'box').link('m3', 'box').link('m4', 'box').link('d1', 'box').link('rx', 'box').link('box', 'con').link('con', 'box')
        .link('box', 'proc').link('proc', 'ampT').link('proc', 'ampS').link('ampT', 'l', 'mainL').link('ampT', 'r', 'mainR').link('ampS', 'sl', 'aux6').link('ampS', 'sr', 'aux6')
        .link('box', 'w1', 'aux1').link('box', 'w2', 'aux2').link('box', 'w3', 'aux3').link('box', 'w4', 'aux4').link('box', 'tx', 'aux8').link('tx', 'pack');
      fourMixes();
      pre('vox', 'aux8');
      cs = con.setMatrixInput(cs, 'mx-rec', 'main', 0);
      auxFedSubs();
      break;
    default:
      throw new Error(`no reference build for ${id}`);
  }
  return { s: b.s, cs };
}

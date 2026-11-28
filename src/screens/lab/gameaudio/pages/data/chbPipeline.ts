/**
 * chbPipeline — page 6's CHAIN, as data: the door's asset record, the event
 * that plays it and the scene connection that posts the event. Pure
 * TypeScript (node:test loads it: test/gameAudioChB.test.ts).
 *
 * Every value is READ from the lab's own records (sounds/gaSoundBank
 * `GA_ASSETS`, model/gaDefs `GA_EVENTS`, `GA_BUS_NAME`), so the cards cannot
 * drift from what the model plays.
 *
 * ONE EVENT, TWO FILES. The door layer asks for `door_open.wav` when the door
 * opens and `door_close.wav` when it closes (model: `postDoor`). The asset
 * record card shows the file of the way the door last moved.
 *
 * THE PLANTED FAULT (`missingDoor`): the door layer asks, both ways, for a
 * file the build does not contain; the name below is the one the reducer
 * prints in its FAULT line (the test pins the two together). A planted fault
 * does not name itself (lead's decision 10): until the learner has produced
 * the symptom, the chain is drawn `named: false`: the door layer's file reads
 * "?" (as the DOOR FILE readout does), with no mark, no red and no verdict
 * (bug test 2026-11-13, B-S1-02: the wrong name printed there was the answer
 * before the symptom). The name, the mark and the words BROKEN LINK come only
 * with `named: true`.
 *
 * The EVENT card names only what the lab has taught by page 6: the event's
 * name, the files its layers ask for, and the bus it is sent to (the name on
 * the controls, never the model's id). Priority waits for pages 15 and 17.
 */
import { GA_BUS_NAME, GA_DOOR_CLOSE_ASSET, GA_DOOR_OPEN_ASSET, GA_EVENTS } from '../../model/gaDefs.ts';
import { gaAsset } from '../../sounds/gaSoundBank.ts';

/** The file name the door event asks for while the fault is planted. */
export const CHB_MISSING_FILE = 'door_open_v2.wav';

export type ChbRow = { k: string; v: string; bad?: boolean };
export type ChbCardId = 'asset' | 'event' | 'scene';
export type ChbCard = {
  id: ChbCardId;
  /** The stage of the work this card belongs to. */
  stage: string;
  head: string;
  rows: ChbRow[];
};
export type ChbChain = {
  cards: ChbCard[];
  /** The link from the asset record to the event is broken AND the chain
   *  says so (false while a planted fault is still unnamed). */
  broken: boolean;
  /** The door layer asks for a file the build does not contain, whether or
   *  not the chain names it yet. */
  missing: boolean;
  /** The file name the event's door layer asks for now. */
  asksFor: string;
  /** The words on the link UNDER each card, in card order. */
  links: [string, string, string];
};

export type ChbChainView = {
  /** The door last CLOSED: the closing take's record is the one on card 1. */
  closing?: boolean;
  /** Name the break (the mark, the red row, BROKEN LINK). Default true. */
  named?: boolean;
};

const ROLE_WORDS: Record<string, string> = {
  'one-shot': 'one-shot: it plays once',
  loop: 'loop: it repeats',
  'music layer': 'music layer',
  'impulse response': 'impulse response',
};

/** The file a door asset id stands for (its record's file name). */
export function doorFile(closing: boolean): string {
  const id = closing ? GA_DOOR_CLOSE_ASSET : GA_DOOR_OPEN_ASSET;
  return gaAsset(id)?.file ?? id;
}

/** The door's chain. `missing` = the planted fault is in. */
export function doorChain(missing: boolean, view: ChbChainView = {}): ChbChain {
  const closing = !!view.closing;
  const named = view.named !== false;
  const ev = GA_EVENTS.door_open;
  const record = gaAsset(closing ? GA_DOOR_CLOSE_ASSET : GA_DOOR_OPEN_ASSET);
  if (!record) throw new Error('the door asset record is missing from GA_ASSETS');
  const asksFor = missing ? CHB_MISSING_FILE : record.file;
  const flagged = missing && named;
  const layers: ChbRow[] = ev.layers.map((l, i) => {
    const id = (l.assets as readonly string[])[0];
    const isDoor = l.id === 'door';
    const late = l.delayS ? `, ${l.delayS} s later` : '';
    if (!isDoor) return { k: i === 0 ? 'LAYERS' : '', v: `${l.id} asks for ${gaAsset(id)?.file ?? id}${late}` };
    // the door layer: one file for each way the door moves
    // planted and not yet met: the card names no file (bug test 2026-11-13,
    // B-S1-02: the wrong name beside card 1's file let the learner compare
    // them before the symptom). It reads "?", as DOOR FILE does.
    if (missing && !named) return { k: i === 0 ? 'LAYERS' : '', v: `${l.id} asks for ? (not tested since the fault began: press the door key)` };
    const which = missing ? '' : closing ? ' (when the door closes)' : ' (when the door opens)';
    return { k: i === 0 ? 'LAYERS' : '', v: `${l.id} asks for ${asksFor}${which}${flagged ? ': not in the build' : ''}`, bad: flagged };
  });
  return {
    broken: flagged,
    missing,
    asksFor,
    cards: [
      {
        id: 'asset',
        stage: 'IMPORT',
        head: 'ASSET RECORD',
        rows: [
          { k: 'FILE', v: record.file },
          { k: 'SOUND', v: record.label },
          { k: 'ROLE', v: ROLE_WORDS[record.role] ?? record.role },
          { k: 'MADE', v: record.made === 'app' ? 'in the app' : record.made },
        ],
      },
      {
        id: 'event',
        stage: 'AUTHOR',
        head: 'EVENT',
        rows: [{ k: 'NAME', v: ev.name }, ...layers, { k: 'SENT TO', v: `${GA_BUS_NAME[ev.bus]} bus` }],
      },
      {
        id: 'scene',
        stage: 'CONNECT',
        head: 'SCENE CONNECTION',
        rows: [
          { k: 'POSTED BY', v: 'the door' },
          { k: 'WHEN', v: 'each time it opens or closes' },
          { k: 'POSTS', v: ev.name },
        ],
      },
    ],
    links: [
      flagged ? `BROKEN LINK: the event asks for ${CHB_MISSING_FILE}, not for this file` : 'the event asks for a file by its name',
      'the scene posts this event',
      'the log shows the result',
    ],
  };
}

/** The chain in words, for a screen reader. A fault that is not named yet
 *  gets no verdict: neither "broken" nor "in place". */
export function doorChainSummary(c: ChbChain): string {
  const cards = c.cards.map((card, i) => `${i + 1}, ${card.head}: ${card.rows.map((r) => (r.k ? `${r.k} ${r.v}` : r.v)).join('; ')}`);
  const verdict = c.broken ? ` The chain is broken: ${c.links[0]}.` : c.missing ? '' : ' Every link is in place.';
  return `The door’s chain, top to bottom. ${cards.join('. ')}.${verdict} The result is the activity log below.`;
}

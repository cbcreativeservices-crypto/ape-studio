/**
 * chbPipeline — page 6's CHAIN, as data: the door's asset record, the event
 * that plays it and the scene connection that posts the event. Pure
 * TypeScript (node:test loads it: test/gameAudioChB.test.ts).
 *
 * Every value is READ from the lab's own records (sounds/gaSoundBank
 * `GA_ASSETS`, model/gaDefs `GA_EVENTS`), so the cards cannot drift from
 * what the model plays. With the planted fault (`missingDoor`) the door
 * layer of the event asks for a file the build does not contain; the name
 * below is the one the reducer prints in its FAULT line (the test pins the
 * two together).
 */
import { GA_EVENTS } from '../../model/gaDefs.ts';
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
  /** The link from the asset record to the event is broken. */
  broken: boolean;
  /** The words on the link UNDER each card, in card order. */
  links: [string, string, string];
};

const ROLE_WORDS: Record<string, string> = {
  'one-shot': 'one-shot: it plays once',
  loop: 'loop: it repeats',
  'music layer': 'music layer',
  'impulse response': 'impulse response',
};

/** The door's chain. `missing` = the planted fault is in. */
export function doorChain(missing: boolean): ChbChain {
  const ev = GA_EVENTS.door_open;
  const door = gaAsset('door');
  if (!door) throw new Error('the door asset record is missing from GA_ASSETS');
  const layers: ChbRow[] = ev.layers.map((l, i) => {
    const id = (l.assets as readonly string[])[0];
    const isDoor = l.id === 'door';
    const file = isDoor && missing ? CHB_MISSING_FILE : (gaAsset(id)?.file ?? id);
    const late = l.delayS ? `, ${l.delayS} s later` : '';
    const lost = isDoor && missing;
    return { k: i === 0 ? 'LAYERS' : '', v: lost ? `${l.id} asks for ${file}: not in the build` : `${l.id} plays ${file}${late}`, bad: lost };
  });
  return {
    broken: missing,
    cards: [
      {
        id: 'asset',
        stage: 'IMPORT',
        head: 'ASSET RECORD',
        rows: [
          { k: 'FILE', v: door.file },
          { k: 'SOUND', v: door.label },
          { k: 'ROLE', v: ROLE_WORDS[door.role] ?? door.role },
          { k: 'MADE', v: door.made === 'app' ? 'in the app' : door.made },
        ],
      },
      {
        id: 'event',
        stage: 'AUTHOR',
        head: 'EVENT',
        rows: [{ k: 'NAME', v: ev.name }, ...layers, { k: 'BUS', v: ev.bus }, { k: 'PRIORITY', v: String(ev.priority) }],
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
      missing ? `BROKEN LINK: the event asks for ${CHB_MISSING_FILE}, not for this file` : 'the event plays this file',
      'the scene posts this event',
      'the log shows the result',
    ],
  };
}

/** The chain in words, for a screen reader. */
export function doorChainSummary(c: ChbChain): string {
  const cards = c.cards.map((card, i) => `${i + 1}, ${card.head}: ${card.rows.map((r) => (r.k ? `${r.k} ${r.v}` : r.v)).join('; ')}`);
  return `The door’s chain, top to bottom. ${cards.join('. ')}. ${c.broken ? `The chain is broken: ${c.links[0]}.` : 'Every link is in place.'} The result is the activity log below.`;
}

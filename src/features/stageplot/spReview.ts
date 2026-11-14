/**
 * stageplot/spReview — the REVIEW LIST: what is missing, undecided or in
 * conflict in a project, in plain words, each item pointing back at the row
 * to edit (handoff §8).
 *
 * Review is part of preparing the packet. It is NOT a claim that the venue
 * accepted anything, and passing it does not make a gig "production ready".
 *
 *   block   must be corrected before "Ready to advance" (a clearly marked
 *           DRAFT can still be exported)
 *   ask     a question the band should answer; each offers its answers
 *   open    a "to be confirmed" that is kept and PRINTED as unresolved,
 *           never filled in for the band
 *
 * A rule fires only on what was actually entered: a capacity is checked only
 * when a capacity was given, and nothing here guesses phantom power, a DI's
 * type or a supplier.
 *
 * Pure.
 */
import { SP_DEVICE_WORD, SP_NEED_WORD } from './spCatalog.ts';
import { spBoxUse, spDiTotals, spSocketRuns, spSummary, type SpBoxUse } from './spDerive.ts';
import { spBox, spBoxName, spBoxes, spBrokenRefs, spMixWantsReturn, spObjectOfSource, spOnStage, spPartner, spPatch, spReturnBoxes, spReturnWords } from './spModel.ts';

/** "socket 9" / "sockets 9–16". */
const socketsWord = (first: number, last: number): string => (first === last ? `socket ${first}` : `sockets ${first}–${last}`);
/** "A", "A and B", "A, B and C". */
const joinAnd = (list: readonly string[]): string => (list.length <= 1 ? list.join('') : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`);

const hasText = (s: string): boolean => s.trim().length > 0;
/** A phone number has at least five digits (the Setup field's warning uses
 *  the same test). */
export const spLooksLikePhone = (s: string): boolean => (s.match(/\d/g) ?? []).length >= 5;
import type { SpId, SpMix, SpObjectKind, SpPatchId, SpProject } from './spTypes.ts';
import { spChoirLayout, spChoirMics, spChoirOf, spChoirWords } from './spChoir.ts';

export type SpIssueLevel = 'block' | 'ask' | 'open';
export type SpArea = 'setup' | 'stage' | 'inputs' | 'monitors' | 'export';

/** An answer the screen can offer for an issue. The screen maps the action id
 *  to an edit in spModel; nothing is changed from here. */
export type SpIssueAction =
  | 'locate'
  | 'mark-offstage'
  | 'mark-acoustic'
  | 'mark-self-contained'
  | 'add-inputs'
  | 'mark-visual'
  | 'link-source'
  | 'pair-restore'
  | 'pair-mono'
  | 'assign-mix'
  | 'mark-self-contained-device'
  | 'add-mix'
  | 'mark-no-monitor'
  | 'object-offstage-ok'
  | 'renumber'
  | 'unreserve'
  | 'cue-audience-ok'
  | 'box-auto'
  | 'edit';

export type SpIssue = {
  /** Stable for one project state: rule + the row it is about. */
  key: string;
  rule: string;
  level: SpIssueLevel;
  text: string;
  /** The same fact as the VENUE reads it, when `text` speaks to the band
   *  ("…has nobody to ask"). The packet prints `packetText ?? text`. */
  packetText?: string;
  /** Where to go to fix it, and which row. */
  area: SpArea;
  target: { kind: 'input' | 'source' | 'performer' | 'mix' | 'device' | 'object' | 'di' | 'extra' | 'box' | 'patch' | 'project'; id: SpId | null; patchId?: SpPatchId };
  actions: SpIssueAction[];
  /** The field that answers it, when it is one field of the row (GO TO
   *  scrolls the popup to it). */
  field?: string;
};

/** Icons that stand for something that normally makes sound. */
const SOUND_KINDS: readonly SpObjectKind[] = [
  ...(['drum-kit', 'percussion', 'congas', 'timbales', 'bongo', 'guitar-amp', 'bass-amp', 'keyboard', 'piano', 'acoustic-guitar', 'horn', 'playback', 'vocal-mic'] as const),
  // more symbols for more diverse music (2026-11-13): every one makes sound
  ...(['choir', 'e-drums', 'cajon', 'djembe', 'tabla', 'steel-pan', 'vibraphone', 'upright-bass', 'grand-piano', 'electric-piano', 'keyboard-rig', 'organ', 'leslie', 'violin', 'cello', 'harp', 'banjo', 'mandolin', 'accordion', 'saxophone', 'trombone', 'dj'] as const),
  // round 2 (2026-11-13)
  ...(['marimba', 'timpani', 'flute', 'harmonium', 'harmonica'] as const),
];
/** Icons that stand for a monitor device. */
const MONITOR_KINDS: readonly SpObjectKind[] = ['wedge', 'iem', 'drum-fill', 'sidefill'];

/** "Own vocal prominent" / "Own instrument prominent", and the mix's own
 *  list of what it needs keeps those inputs OUT (Must exclude or Not needed,
 *  with none of them asked for). The inputs are the recipients' own: their
 *  vocals, or the rest of what they play. Pure; the Monitors card and the
 *  review both read it. */
export function spOwnClashes(p: SpProject, m: SpMix): { instruction: string; labels: string[] }[] {
  const out: { instruction: string; labels: string[] }[] = [];
  const own = (vocal: boolean) =>
    p.inputs.filter((i) => {
      const s = p.sources.find((x) => x.id === i.sourceId);
      return !!s && !!s.performerId && m.recipients.includes(s.performerId) && (s.category === 'vocals') === vocal && !i.cue;
    });
  for (const [instruction, vocal] of [['Own vocal prominent', true], ['Own instrument prominent', false]] as const) {
    if (!m.instructions.includes(instruction)) continue;
    const mine = own(vocal);
    const kept = mine.filter((i) => m.needs[i.id] === 'exclude' || m.needs[i.id] === 'not-needed');
    const wanted = mine.some((i) => m.needs[i.id] === 'primary' || m.needs[i.id] === 'supporting');
    if (kept.length && !wanted) out.push({ instruction, labels: kept.map((i) => `${i.label} (${SP_NEED_WORD[m.needs[i.id]]})`) });
  }
  return out;
}

export function spReview(p: SpProject): SpIssue[] {
  const out: SpIssue[] = [];
  const add = (i: SpIssue) => out.push(i);

  // broken references (a loaded project only: edits cannot create one)
  const broken = spBrokenRefs(p);
  if (broken.length) {
    add({
      key: 'broken',
      rule: 'broken',
      level: 'block',
      text: `This project has ${broken.length} link${broken.length === 1 ? '' : 's'} to something that is missing (${broken[0]}). A complete packet cannot be made from it. Open the row named, choose again what it belongs to, and the packet can be made.`,
      area: 'export',
      target: { kind: 'project', id: null },
      actions: ['edit'],
    });
  }

  // nothing to advance yet
  if (!p.performers.length && !p.inputs.length) {
    add({ key: 'empty', rule: 'empty', level: 'block', text: 'There is nothing to send yet. Add a performer or an input first.', area: 'setup', target: { kind: 'project', id: null }, actions: ['edit'] });
  }

  // whose packet is it?
  if ((p.performers.length || p.inputs.length) && !hasText(p.band)) {
    add({ key: 'band', rule: 'no-band-name', level: 'ask', text: 'The packet has no band or artist name on it.', packetText: 'No band or artist name is given.', area: 'setup', target: { kind: 'project', id: null }, actions: ['edit'] });
  }

  // an example's own title would print "(example)" on a document sent to a venue
  if (/\(example\)\s*$/i.test(p.title)) {
    add({ key: 'example-title', rule: 'example-title', level: 'ask', text: 'The title still says “(example)”. Change it or clear it in Setup.', packetText: 'The title of this stage plot is still an example’s.', area: 'setup', target: { kind: 'project', id: null }, actions: ['edit'] });
  }

  // who should the engineer contact? (one of the seven questions a packet answers)
  {
    const c = p.contact;
    const named = c.show.name && hasText(c.name);
    // an email counts only when it looks like one (the same test as the
    // Setup field's warning): "ana-at-example" reaches nobody
    // …and a phone only when it has the digits of one: "abc" reaches nobody
    // either (R2-SP1-07, the rest of round-1 S2-05)
    const reachable = (c.show.phone && spLooksLikePhone(c.phone)) || (c.show.email && c.email.trim().includes('@'));
    if ((p.performers.length || p.inputs.length) && (!named || !reachable)) {
      add({ key: 'contact', rule: 'no-contact', level: 'ask', text: 'The packet shows no technical contact with a phone number or an email. The venue’s engineer has nobody to ask.', packetText: 'No technical contact is listed for this band.', area: 'setup', target: { kind: 'project', id: null }, actions: ['edit'] });
    }
  }

  // duplicate channel numbers INSIDE one patch (the same number in two
  // systems is fine)
  for (const patch of p.patches) {
    const byNumber = new Map<number, SpId[]>();
    for (const id of patch.order) {
      const n = patch.numbers[id];
      if (n == null) continue;
      byNumber.set(n, [...(byNumber.get(n) ?? []), id]);
    }
    for (const [n, ids] of byNumber) {
      if (ids.length < 2) continue;
      const names = ids.map((id) => p.inputs.find((i) => i.id === id)?.label ?? '?').join(' and ');
      add({ key: `dup:${patch.id}:${n}`, rule: 'duplicate-channel', level: 'block', text: `${patch.name}: channel ${n} is given to ${names}. Give each its own number.`, area: 'inputs', target: { kind: 'patch', id: ids[0], patchId: patch.id }, actions: ['renumber', 'edit'] });
    }
    // an input on a channel the band keeps free: the packet cannot say both,
    // so it must be settled before "Ready to advance" (like a duplicate)
    for (const id of patch.order) {
      const n = patch.numbers[id];
      if (n == null || !patch.reserved.includes(n)) continue;
      const name = p.inputs.find((i) => i.id === id)?.label ?? 'An input';
      add({ key: `reserved:${patch.id}:${id}`, rule: 'reserved-channel-used', level: 'block', text: `${patch.name}: channel ${n} is kept free on purpose, and ${name} is on it. Give ${name} another number, or stop keeping channel ${n} free.`, area: 'inputs', target: { kind: 'input', id, patchId: patch.id }, actions: ['renumber', 'unreserve', 'edit'] });
    }
    // the same venue channel or socket written for two inputs of one system
    const byVenue = new Map<string, SpId[]>();
    for (const id of patch.order) {
      const v = (patch.venue[id] ?? '').trim().toLowerCase();
      if (v) byVenue.set(v, [...(byVenue.get(v) ?? []), id]);
    }
    for (const [, ids] of byVenue) {
      if (ids.length < 2) continue;
      const names = ids.map((id) => p.inputs.find((i) => i.id === id)?.label ?? '?').join(' and ');
      add({ key: `dupvenue:${patch.id}:${ids[0]}`, rule: 'duplicate-venue-channel', level: 'ask', text: `${patch.name}: ${names} have the same venue channel or socket (${patch.venue[ids[0]]}).`, area: 'inputs', target: { kind: 'input', id: ids[0], patchId: patch.id }, actions: ['edit'] });
    }
    for (const id of patch.order) {
      if (patch.numbers[id] != null) continue;
      const i = p.inputs.find((x) => x.id === id);
      add({ key: `nonum:${patch.id}:${id}`, rule: 'no-number', level: 'ask', text: `${patch.name}: ${i?.label ?? 'An input'} has no channel number yet.`, area: 'inputs', target: { kind: 'input', id, patchId: patch.id }, actions: ['renumber', 'edit'] });
    }
  }

  // sources
  for (const s of p.sources) {
    const inputs = p.inputs.filter((i) => i.sourceId === s.id);
    if (s.connection === 'inputs' && !inputs.length) {
      add({ key: `noinput:${s.id}`, rule: 'source-no-input', level: 'ask', text: `${s.label} has no input. Is it acoustic, is it self-contained, or does it still need its inputs?`, area: 'inputs', target: { kind: 'source', id: s.id }, actions: ['mark-acoustic', 'mark-self-contained', 'add-inputs'] });
    }
    if (inputs.length && !s.offstage && !spObjectOfSource(p, s.id)) {
      // Named from the SOURCE with its own rows: "Keys 2 is in the input
      // list" was false when the row called Keys 2 was another source's
      // (R2-SP2-05). The short sentence only when the one row has its name.
      const rows = inputs.map((i) => i.label);
      const same = rows.length === 1 && rows[0].trim().toLowerCase() === s.label.trim().toLowerCase();
      const list = rows.length > 1 ? `${rows.slice(0, -1).join(', ')} and ${rows[rows.length - 1]}` : rows[0];
      const text = same ? `${s.label} is in the input list but not on the stage.` : `${s.label} is not on the stage, and its ${rows.length === 1 ? 'input' : 'inputs'} ${list} ${rows.length === 1 ? 'is' : 'are'} in the input list.`;
      add({ key: `unplaced:${s.id}`, rule: 'source-unplaced', level: 'ask', text, area: 'stage', target: { kind: 'source', id: s.id }, actions: ['locate', 'mark-offstage'] });
    }
  }

  // a stereo pair with one side gone
  for (const i of p.inputs) {
    if (!i.pairId || spPartner(p, i)) continue;
    add({ key: `pair:${i.id}`, rule: 'pair-broken', level: 'ask', text: `${i.label} was one side of a stereo pair, and the other side is gone. Put the other side back, or make this a mono request.`, area: 'inputs', target: { kind: 'input', id: i.id }, actions: ['pair-restore', 'pair-mono'] });
  }

  // click or private cue heading for the audience mix
  for (const i of p.inputs) {
    if (!i.cue || i.audience !== 'audience' || i.cueAudienceOk) continue;
    add({ key: `cue:${i.id}`, rule: 'cue-to-audience', level: 'ask', text: `${i.label} is a click or cue, and it is set to go to the AUDIENCE mix. Is the audience meant to hear it?`, area: 'inputs', target: { kind: 'input', id: i.id }, actions: ['cue-audience-ok', 'edit'] });
  }

  // DI devices asked to carry more than they have (a capacity that was
  // entered). A packet cannot say both, so it must be corrected before Ready,
  // as a duplicate channel is (round-1 bug 18, still open in round 2).
  for (const o of spDiTotals(p).overloaded) {
    const d = p.diDevices.find((x) => x.label === o.label);
    add({ key: `dicap:${d?.id ?? o.label}`, rule: 'capacity', level: 'block', text: `${o.label} has ${o.channels} channel${o.channels === 1 ? '' : 's'} and is asked to carry ${o.used}. Move a channel to another DI device, or correct its number of channels.`, area: 'inputs', target: { kind: 'di', id: d?.id ?? null }, actions: ['edit'] });
  }

  // DI devices: one that carries nothing, and a contradiction the band typed
  for (const d of p.diDevices) {
    const on = p.inputs.filter((i) => i.capture === 'di' && i.diDeviceId === d.id);
    if (!on.length) add({ key: `diempty:${d.id}`, rule: 'di-unused', level: 'ask', text: `${d.label} carries no DI channel. Remove it, or put a channel on it.`, area: 'inputs', target: { kind: 'di', id: d.id }, actions: ['edit'] });
    if (d.kind === 'passive' && on.some((i) => i.phantom === 'required')) {
      add({ key: `dipassive:${d.id}`, rule: 'passive-phantom', level: 'ask', text: `${d.label} is marked passive, and a channel on it is marked “phantom power required”. A passive DI does not use phantom power. Which is right?`, area: 'inputs', target: { kind: 'di', id: d.id }, actions: ['edit'] });
    }
  }

  // STAGE BOXES (2026-11-13). A socket given to two inputs, and an input on a
  // socket the box does not have, cannot both be plugged in: corrected
  // before Ready, as a duplicate channel is. An input with no socket is a
  // QUESTION (some inputs go to the console directly), asked once for all of
  // them; a box with nothing plugged in is a question too.
  if (spBoxes(p).length) {
    for (const u of spBoxUse(p)) {
      const name = spBoxName(u.box);
      for (const d of u.doubled) {
        const names = d.inputs.map((i) => i.label).join(' and ');
        add({ key: `boxdup:${u.box.id}:${d.socket}`, rule: 'box-socket-twice', level: 'block', text: `${name} socket ${d.socket} is given to ${names}. One socket takes one cable: give each its own socket.`, area: 'inputs', target: { kind: 'input', id: d.inputs[1].id }, actions: ['edit'], field: 'box' });
      }
      if (u.over.length) {
        const list = u.over.map((x) => `${x.input.label} on ${x.socket}`).join(', ');
        add({ key: `boxover:${u.box.id}`, rule: 'box-over-capacity', level: 'block', text: `${name} has ${u.box.inputs} input socket${u.box.inputs === 1 ? '' : 's'}, and ${u.over.length === 1 ? 'an input is' : `${u.over.length} inputs are`} on a socket past ${u.box.inputs} (${list}). Move ${u.over.length === 1 ? 'it' : 'them'} to another box or socket, or correct the size of ${name}.`, area: 'inputs', target: { kind: 'box', id: u.box.id }, actions: ['edit'] });
      }
      // (round 2) SUB-SNAKES: what a box plugs into must have room for it.
      // Two cables on one socket, a socket the main box does not have, or a
      // socket in use that the feed does not carry: corrected before Ready.
      for (const c of u.feedClash) {
        const f = u.fedBy.find((x) => x.box.id === c.sub.id) as SpBoxUse['fedBy'][number];
        const many = c.with.length > 1 || c.sockets.length > 1;
        add({ key: `feedclash:${c.sub.id}`, rule: 'box-feed-overlap', level: 'block', text: `${spBoxName(c.sub)} plugs into ${name} ${socketsWord(f.first, f.last)}, and ${c.sockets.length === 1 ? `socket ${c.sockets[0]}` : `sockets ${spSocketRuns(c.sockets)}`} of ${name} ${c.sockets.length === 1 ? 'is' : 'are'} also given to ${joinAnd(c.with)}. One socket takes one cable: move ${many ? 'them' : 'it'} to other sockets, or plug ${spBoxName(c.sub)} into other sockets of ${name}.`, area: 'inputs', target: { kind: 'box', id: c.sub.id }, actions: ['edit'], field: 'feed' });
      }
      const main = u.box.feed ? spBox(p, u.box.feed.boxId) : undefined;
      if (u.box.feed && main && u.feedPast.length) {
        add({ key: `feedpast:${u.box.id}`, rule: 'box-feed-past', level: 'block', text: `${name} plugs into ${spBoxName(main)} ${socketsWord(u.box.feed.first, u.box.feed.last)}, and ${spBoxName(main)} has ${main.inputs} input socket${main.inputs === 1 ? '' : 's'}. Choose sockets ${spBoxName(main)} has, or correct the size of ${spBoxName(main)}.`, area: 'inputs', target: { kind: 'box', id: u.box.id }, actions: ['edit'], field: 'feed' });
      }
      if (u.box.feed && main && u.feedShort.length) {
        const carries = u.box.feed.last - u.box.feed.first + 1;
        const on = u.plugged.filter((x) => u.feedShort.includes(x.socket)).map((x) => x.input.label);
        add({ key: `feedshort:${u.box.id}`, rule: 'box-feed-short', level: 'block', text: `${name} plugs into ${spBoxName(main)} ${socketsWord(u.box.feed.first, u.box.feed.last)}: that carries sockets 1–${carries} of ${name} only, and ${on.length === 1 ? `${on[0]} is` : `${joinAnd(on)} are`} on socket${u.feedShort.length === 1 ? '' : 's'} ${spSocketRuns(u.feedShort)}. Plug ${name} into more sockets of ${spBoxName(main)}, or move ${on.length === 1 ? 'it' : 'them'}.`, area: 'inputs', target: { kind: 'box', id: u.box.id }, actions: ['edit'], field: 'feed' });
      }
      // (round 2) RETURNS: one return carries one mix, and only a return the
      // box has can carry it
      for (const d of u.returnsDoubled) {
        add({ key: `retdup:${u.box.id}:${d.ret}`, rule: 'return-twice', level: 'block', text: `${name} return ${d.ret} is given to ${joinAnd(d.mixes.map((m) => m.code))}. One return carries one mix: give each its own return, or set one to come from the console.`, area: 'monitors', target: { kind: 'mix', id: d.mixes[1].id }, actions: ['edit'], field: 'ret' });
      }
      if (u.returnsOver.length) {
        const mixes = [...new Set(u.returnsOver.map((x) => x.mix))];
        const has = u.box.returns ? `has ${u.box.returns} return${u.box.returns === 1 ? '' : 's'}` : 'has no returns given';
        add({ key: `retover:${u.box.id}`, rule: 'return-over', level: 'block', text: `${name} ${has}, and ${joinAnd(mixes.map((m) => `${m.code} is on ${spReturnWords(p, m).replace(`${name} · `, '')}`))}. Choose a return ${name} has, or correct its number of returns.`, area: 'monitors', target: { kind: 'mix', id: mixes[0].id }, actions: ['edit'], field: 'ret' });
      }
      // (round 2) a band's own digital box works only with a console that
      // speaks its format: asked once, answered in its "Connects to" field
      if (u.box.kind === 'digital' && u.box.supplier === 'band' && !u.box.feed && !u.box.connectsTo.trim() && !u.box.connectsTbc) {
        add({ key: `boxconsole:${u.box.id}`, rule: 'box-console', level: 'ask', text: `Which console does ${name} connect to? A digital stage box only works with a console that speaks its format. Type the console under Connects to, or mark it to be confirmed.`, packetText: `Which console ${name}, the band’s digital stage box, connects to is not said yet.`, area: 'inputs', target: { kind: 'box', id: u.box.id }, actions: ['edit'], field: 'connectsTo' });
      }
      // a box that only carries a sub-snake is not empty
      const carriesSub = u.fedBy.some((f) => p.inputs.some((i) => i.box?.boxId === f.box.id));
      if (!u.plugged.length && !carriesSub) {
        add({ key: `boxempty:${u.box.id}`, rule: 'box-empty', level: 'ask', text: `${name} has nothing plugged into it. Choose ${name} in an input’s editor, or remove ${name} if the stage does not need it.`, area: 'inputs', target: { kind: 'box', id: u.box.id }, actions: ['edit'] });
      }
    }
    const loose = p.inputs.filter((i) => !i.box && !i.direct);
    if (loose.length) {
      // a long list is cut to six names and a count, so it reads on a phone
      const names = loose.length > 7 ? [...loose.slice(0, 6).map((i) => i.label), `${loose.length - 6} more`] : loose.map((i) => i.label);
      const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
      add({
        key: 'boxnone',
        rule: 'box-none',
        level: 'ask',
        text: `${loose.length === 1 ? `${list} has` : `${loose.length} inputs have`} no stage box socket${loose.length === 1 ? '' : ` (${list})`}. Does ${loose.length === 1 ? 'it' : 'each'} plug into a stage box, or go to the console directly?`,
        packetText: `${loose.length === 1 ? `${list} has` : `${loose.length} inputs have`} no stage box socket yet${loose.length === 1 ? '' : ` (${list})`}.`,
        area: 'inputs',
        target: { kind: 'input', id: loose[0].id },
        actions: ['box-auto', 'edit'],
        field: 'box',
      });
    }
    // (round 2) more returns asked for than the boxes have: a question (a
    // mix can come from the console itself, or another box can bring more)
    const retBoxes = spReturnBoxes(p);
    if (retBoxes.length) {
      const wanting = p.mixes.filter(spMixWantsReturn);
      const need = wanting.reduce((n, m) => n + (m.format === 'stereo' ? 2 : 1), 0);
      // (a sub-snake's returns reach it through its main box: not counted twice)
      const have = retBoxes.filter((b) => !b.feed).reduce((n, b) => n + (b.returns ?? 0), 0);
      if (need > have) {
        const first = wanting.find((m) => !m.ret) ?? wanting[0];
        const stereo = wanting.some((m) => m.format === 'stereo') ? ' (a stereo mix takes two)' : '';
        add({
          key: 'returns-short',
          rule: 'returns-short',
          level: 'ask',
          text: `${wanting.length} mixes need ${need} returns${stereo}, and the stage boxes have ${have}. Set some mixes to come from the console (for example, an in-ear transmitter at a monitor console beside the stage), or add a box with more returns.`,
          packetText: `${wanting.length} mixes need ${need} returns${stereo}, and the stage boxes listed have ${have}.`,
          area: 'monitors',
          target: { kind: 'mix', id: first.id },
          actions: ['edit'],
          field: 'ret',
        });
      }
    }
  }

  // a riser drawn on the stage that nobody is asked for
  if (p.objects.some((o) => o.kind === 'riser') && !p.extras.some((e) => e.kind === 'riser')) {
    const o = p.objects.find((x) => x.kind === 'riser');
    add({ key: 'riser', rule: 'riser-not-listed', level: 'ask', text: 'A riser is drawn on the stage and is not in the equipment list. Who supplies it, and what size?', area: 'inputs', target: { kind: 'object', id: o?.id ?? null }, actions: ['edit'] });
  }

  // monitors
  for (const m of p.mixes) {
    const devs = p.devices.filter((d) => d.mixId === m.id);
    if (m.recipients.length && !devs.length) {
      add({ key: `mixdev:${m.id}`, rule: 'mix-no-device', level: 'ask', text: `${m.code}${m.name ? ` ${m.name}` : ''} has no device on it. Through what do they hear it?`, area: 'monitors', target: { kind: 'mix', id: m.id }, actions: ['edit'] });
    } else if (m.delivery === 'wireless-iem' && devs.length && !devs.some((d) => d.type === 'iem-tx')) {
      add({ key: `mixtx:${m.id}`, rule: 'wireless-no-transmitter', level: 'ask', text: `${m.code}${m.name ? ` ${m.name}` : ''} is wireless in-ear, and no transmitter is listed for it.`, area: 'monitors', target: { kind: 'mix', id: m.id }, actions: ['edit'] });
    }
  }
  // a mix that says one thing about the click and asks for another
  {
    const cues = p.inputs.filter((i) => i.cue);
    for (const m of p.mixes) {
      if (!cues.length) break;
      const wants = cues.some((i) => m.needs[i.id] === 'primary' || m.needs[i.id] === 'supporting');
      const name = m.code + (m.name ? ' ' + m.name : '');
      if (m.instructions.includes('No click') && wants) {
        add({ key: 'click:' + m.id, rule: 'click-clash', level: 'ask', text: name + ' says “No click”, and its list of what it needs asks for the click. Which is right?', area: 'monitors', target: { kind: 'mix', id: m.id }, actions: ['edit'] });
      } else if (m.instructions.includes('Click required') && !wants) {
        add({ key: 'click:' + m.id, rule: 'click-clash', level: 'ask', text: name + ' says “Click required”, and the click is not asked for in its list of what it needs. Which is right?', area: 'monitors', target: { kind: 'mix', id: m.id }, actions: ['edit'] });
      }
    }
  }

  // a mix that asks for its own vocal or instrument and keeps it out
  for (const m of p.mixes) {
    const name = m.code + (m.name ? ' ' + m.name : '');
    for (const c of spOwnClashes(p, m)) {
      add({ key: `own:${m.id}:${c.instruction}`, rule: 'own-clash', level: 'ask', text: `${name} says “${c.instruction}”, and its list of what it needs keeps ${c.labels.join(', ')} out. Which is right?`, area: 'monitors', target: { kind: 'mix', id: m.id }, actions: ['edit'] });
    }
  }

  for (const d of p.devices) {
    if (d.mixId || d.selfContained) continue;
    add({ key: `devmix:${d.id}`, rule: 'device-no-mix', level: 'ask', text: `${d.label || SP_DEVICE_WORD[d.type]} is not on any mix.`, area: 'monitors', target: { kind: 'device', id: d.id }, actions: ['assign-mix', 'mark-self-contained-device'] });
  }
  for (const m of p.mixes) {
    // a fill covers an area of the stage, so it may have nobody named on it
    if (m.recipients.length || m.delivery === 'drum-fill' || m.delivery === 'sidefill') continue;
    add({ key: `mixwho:${m.id}`, rule: 'mix-no-recipient', level: 'ask', text: `${m.code}${m.name ? ` ${m.name}` : ''} has nobody on it.`, area: 'monitors', target: { kind: 'mix', id: m.id }, actions: ['edit'] });
  }
  for (const pf of p.performers) {
    if (pf.noMonitor === true) continue;
    const onMix = p.mixes.some((m) => m.recipients.includes(pf.id));
    const ownRig = p.devices.some((d) => d.performerId === pf.id && d.selfContained);
    if (onMix || ownRig) continue;
    add({ key: `nomon:${pf.id}`, rule: 'performer-no-monitor', level: 'ask', text: `${pf.name || 'A performer'} has no monitor. Is that intended?`, area: 'monitors', target: { kind: 'performer', id: pf.id }, actions: ['add-mix', 'mark-no-monitor'] });
  }

  // the stage
  for (const pf of p.performers) {
    if (p.objects.some((o) => o.performerId === pf.id)) continue;
    add({ key: `pfplace:${pf.id}`, rule: 'performer-unplaced', level: 'ask', text: `${pf.name || 'A performer'} is not on the stage yet.`, area: 'stage', target: { kind: 'performer', id: pf.id }, actions: ['locate'] });
  }
  for (const o of p.objects) {
    // per shape: a thrust's tongue and a wing are on the stage (spShape). A
    // stage box or an equipment rack beside the stage is where such things
    // stand (monitor world, a box on the floor by the stage): not a question
    // (expert review 2026-11-13)
    const rackGear = o.kind === 'stage-box' || o.kind === 'rack' || (o.kind === 'iem' && p.devices.find((d) => d.id === o.deviceId)?.type === 'iem-tx');
    if (!spOnStage(o, p.stage) && !o.offstageOk && !rackGear) {
      add({ key: `off:${o.id}`, rule: 'object-offstage', level: 'ask', text: `${o.label || 'An object'} is outside the stage.`, area: 'stage', target: { kind: 'object', id: o.id }, actions: ['locate', 'object-offstage-ok'] });
    }
    if (SOUND_KINDS.includes(o.kind) && !o.sourceId && !o.inputId && !o.visualOnly) {
      add({ key: `visual:${o.id}`, rule: 'icon-no-input', level: 'ask', text: `${o.label || 'An instrument'} is drawn on the stage with no input behind it. Is it only a drawing (acoustic, or self-contained), or does it belong to a source?`, area: 'stage', target: { kind: 'object', id: o.id }, actions: ['mark-visual', 'link-source'] });
    }
    // a choir's area microphones follow its size (round 2, live-sound
    // review): about one for every 2.5 m of its width. Asked when its source
    // has fewer, or more than one extra (each open microphone adds feedback)
    if (o.kind === 'choir' && o.sourceId) {
      const mics = p.inputs.filter((i) => i.sourceId === o.sourceId && (i.capture === 'mic' || i.capture === 'wireless')).length;
      const lay = spChoirLayout(spChoirOf(o));
      const want = spChoirMics(lay);
      const name = o.label.trim() || 'The choir';
      const m = `${mics} area microphone${mics === 1 ? '' : 's'}`;
      if (mics && mics < want) add({ key: `choirmics:${o.id}`, rule: 'choir-mics', level: 'ask', text: `${name} (${spChoirWords(spChoirOf(o))}) has ${m}. A choir this wide usually needs about ${want}, one for every 2.5 m of its width. Add ${want - mics === 1 ? 'one' : 'more'} in Inputs, or check the choir's size on the stage.`, area: 'inputs', target: { kind: 'source', id: o.sourceId }, actions: ['edit'] });
      else if (mics > want + 1) add({ key: `choirmics:${o.id}`, rule: 'choir-mics', level: 'ask', text: `${name} has ${m}: more than its width needs (about ${want}, one for every 2.5 m). Each extra open microphone adds feedback and a hollow sound. Are they all needed?`, area: 'inputs', target: { kind: 'source', id: o.sourceId }, actions: ['edit'] });
    }
    if (MONITOR_KINDS.includes(o.kind) && !o.deviceId && !o.visualOnly) {
      add({ key: `mondraw:${o.id}`, rule: 'icon-no-device', level: 'ask', text: `${o.label || 'A monitor'} is drawn on the stage but is not in the monitor plan.`, area: 'stage', target: { kind: 'object', id: o.id }, actions: ['mark-visual', 'edit'] });
    }
  }

  // every "to be confirmed": kept, and printed as unresolved
  for (const o of spSummary(p).openItems) {
    const area: SpArea = o.kind === 'mix' || o.kind === 'device' ? 'monitors' : 'inputs';
    add({ key: `open:${o.kind}:${o.id}:${o.text}`, rule: 'to-be-confirmed', level: 'open', text: `${o.text}.`, area, target: { kind: o.kind, id: o.id }, actions: ['edit'], field: o.field });
  }
  return out;
}

export type SpReviewCounts = { block: number; ask: number; open: number };
export function spReviewCounts(issues: SpIssue[]): SpReviewCounts {
  const c: SpReviewCounts = { block: 0, ask: 0, open: 0 };
  for (const i of issues) c[i.level] += 1;
  return c;
}

/** "Ready to advance" is allowed when nothing must be corrected. Open items
 *  and unanswered questions are allowed: they are printed as unresolved. */
export const spCanMarkReady = (issues: SpIssue[]): boolean => !issues.some((i) => i.level === 'block');

/** A complete packet cannot be made from a project with missing links. A
 *  DRAFT of anything else can always be exported. */
export const spCanExport = (p: SpProject): boolean => spBrokenRefs(p).length === 0;

/** Has the patch any numbers out of step with its order (so "Renumber"
 *  would change something)? */
export function spNumbersFollowOrder(p: SpProject, patchId: SpPatchId): boolean {
  const patch = spPatch(p, patchId);
  if (!patch) return true;
  let last = 0;
  for (const id of patch.order) {
    const n = patch.numbers[id];
    if (n == null || n <= last) return false;
    last = n;
  }
  return true;
}

/* ── the optional guided task ───────────────────────────────────────────── */

export type SpGuidedStep = { id: 'performers' | 'sources' | 'monitors' | 'review' | 'export'; label: string; done: boolean };

/** The five steps of the optional guided task, judged from the project
 *  itself (never from a button press). `exported` is told by the screen: a
 *  packet was made from this revision. */
export function spGuidedSteps(p: SpProject, exported: boolean): SpGuidedStep[] {
  const issues = spReview(p);
  const placed = p.performers.length > 0 && p.performers.every((pf) => p.objects.some((o) => o.performerId === pf.id));
  // every source has its inputs, AND every performer has something listed
  // (a source with no sound system connection is an answer: acoustic)
  const sources =
    p.inputs.length > 0 &&
    p.sources.every((s) => s.connection === 'none' || p.inputs.some((i) => i.sourceId === s.id)) &&
    p.performers.every((pf) => p.sources.some((s) => s.performerId === pf.id));
  const monitors = p.performers.length > 0 && p.performers.every((pf) => pf.noMonitor === true || p.mixes.some((m) => m.recipients.includes(pf.id)) || p.devices.some((d) => d.performerId === pf.id && d.selfContained));
  const reviewed = placed && sources && monitors && !issues.some((i) => i.level !== 'open');
  return [
    { id: 'performers', label: 'Place every performer on the stage', done: placed },
    { id: 'sources', label: 'Add what each performer plays or sings', done: sources },
    { id: 'monitors', label: 'Give every performer a monitor, or say they need none', done: monitors },
    { id: 'review', label: 'Answer every review question', done: reviewed },
    { id: 'export', label: 'Make the packet', done: reviewed && exported },
  ];
}

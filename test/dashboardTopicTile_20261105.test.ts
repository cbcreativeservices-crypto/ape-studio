/**
 * The Study Dashboard's current-topic card and My Custom List (Pixel pass
 * 2026-11-05).
 *
 * (a) "TOPIC n OF m" counts real topics only, wherever the list sits in the deck.
 * (b) TrophyImage must get a NEW native view when it goes from its fallback back
 *     to the image. Unkeyed, React re-used the fallback's View as the image box
 *     (the proof test below shows it on the real reconciler). That is the
 *     suspected cause of the Dashboard tile staying blank on every topic after
 *     one visit to My Custom List; the blank tile itself needs a device to prove.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, stripTypeScriptTypes } from 'node:module';
import { join } from 'node:path';
import { test } from 'node:test';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const read = (p: string) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n');
const dashboard = read('src/screens/dashboard/DashboardScreen.tsx');
const trophy = read('src/components/TrophyImage.tsx');

const LIST = 'custom-list';
const realTopicNumber = (() => {
  const src = dashboard.match(/function realTopicNumber\([\s\S]*?\n\}\n/)?.[0];
  assert.ok(src, 'realTopicNumber is defined');
  const js = stripTypeScriptTypes(src);
  return new Function('FLAGGED_TOPIC_ID', `${js}; return realTopicNumber;`)(LIST) as (
    deck: { id: string }[],
    id: string,
  ) => { n: number; of: number };
})();
const deck = (...ids: string[]) => ids.map((id) => ({ id }));

test('(a) the first real topic is TOPIC 1 when the list is first', () => {
  assert.deepEqual(realTopicNumber(deck(LIST, 'a', 'b', 'c'), 'a'), { n: 1, of: 3 });
  assert.deepEqual(realTopicNumber(deck(LIST, 'a', 'b', 'c'), 'c'), { n: 3, of: 3 });
});

test('(a) the list does not count wherever the learner moved it', () => {
  assert.deepEqual(realTopicNumber(deck('a', LIST, 'b'), 'a'), { n: 1, of: 2 });
  assert.deepEqual(realTopicNumber(deck('a', LIST, 'b'), 'b'), { n: 2, of: 2 });
  assert.deepEqual(realTopicNumber(deck('a', 'b', LIST), 'b'), { n: 2, of: 2 });
});

test('(a) a deck with no list still numbers normally', () => {
  assert.deepEqual(realTopicNumber(deck('a', 'b'), 'b'), { n: 2, of: 2 });
});

test('(a) the card prints that number, not the deck position', () => {
  assert.match(dashboard, /const dispTopicNo = realTopicNumber\(topics, dispTopic\.id\);/);
  assert.match(dashboard, /`TOPIC \$\{dispTopicNo\.n\} OF \$\{dispTopicNo\.of\} · /);
  assert.doesNotMatch(dashboard, /TOPIC \$\{dispIdx/);
});

test('(b) the image box is keyed so it is never the fallback view re-styled', () => {
  assert.match(trophy, /if \(!url \|\| failed \|\| !bustedUri\) \{\n\s+return <>\{fallback\}<\/>;/);
  assert.match(trophy, /<View key="trophy-art" style=\{\[box, style, grayed && styles\.grayed\]\}>/);
});

test('(b) proof: on the real reconciler only a key gives the image a new host view', () => {
  const require = createRequire(join(root, 'package.json'));
  const React = require('react');
  const Reconciler = require('react-reconciler');
  const { DefaultEventPriority } = require('react-reconciler/constants');

  let created = 0;
  let priority = DefaultEventPriority;
  const host = Reconciler({
    supportsMutation: true,
    supportsPersistence: false,
    supportsHydration: false,
    isPrimaryRenderer: false,
    noTimeout: -1,
    scheduleTimeout: setTimeout,
    cancelTimeout: clearTimeout,
    getRootHostContext: () => ({}),
    getChildHostContext: (c: object) => c,
    getPublicInstance: (i: object) => i,
    createInstance: () => ({ id: ++created }),
    createTextInstance: () => ({}),
    appendInitialChild: () => {},
    appendChild: () => {},
    appendChildToContainer: () => {},
    insertBefore: () => {},
    insertInContainerBefore: () => {},
    removeChild: () => {},
    removeChildFromContainer: () => {},
    clearContainer: () => {},
    finalizeInitialChildren: () => false,
    prepareForCommit: () => null,
    resetAfterCommit: () => {},
    shouldSetTextContent: () => false,
    commitUpdate: () => {},
    detachDeletedInstance: () => {},
    preparePortalMount: () => {},
    getInstanceFromNode: () => null,
    beforeActiveInstanceBlur: () => {},
    afterActiveInstanceBlur: () => {},
    prepareScopeUpdate: () => {},
    getInstanceFromScope: () => null,
    NotPendingTransition: null,
    HostTransitionContext: React.createContext(null),
    resetFormInstance: () => {},
    requestPostPaintCallback: () => {},
    shouldAttemptEagerTransition: () => false,
    trackSchedulerEvent: () => {},
    resolveEventType: () => null,
    resolveEventTimeStamp: () => -1.1,
    maySuspendCommit: () => false,
    preloadInstance: () => true,
    startSuspendingCommit: () => {},
    suspendInstance: () => {},
    waitForCommitToBeReady: () => null,
    setCurrentUpdatePriority: (p: number) => { priority = p; },
    getCurrentUpdatePriority: () => priority,
    resolveUpdatePriority: () => priority,
  });
  const noop = () => {};
  const root_ = host.createContainer({}, 1, null, false, null, '', noop, noop, noop, noop, null);
  const h = React.createElement;
  // The shape of TrophyImage: a fragment around the fallback, or the box.
  const Tile = ({ art, boxKey }: { art: boolean; boxKey?: string }) =>
    art ? h('box', { key: boxKey }, h('image')) : h(React.Fragment, null, h('box', null, h('icon')));
  const hostViewsCreatedBy = (boxKey?: string) => {
    host.updateContainerSync(h(Tile, { art: false, boxKey }), root_, null, null);
    host.flushSyncWork();
    const before = created;
    host.updateContainerSync(h(Tile, { art: true, boxKey }), root_, null, null);
    host.flushSyncWork();
    const made = created - before;
    host.updateContainerSync(null, root_, null, null);
    host.flushSyncWork();
    return made;
  };
  assert.equal(hostViewsCreatedBy(undefined), 1, 'unkeyed: only the image is new, the box is re-used');
  assert.equal(hostViewsCreatedBy('trophy-art'), 2, 'keyed: box and image are both new');
});

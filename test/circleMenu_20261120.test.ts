/**
 * The CIRCLE MENU (owner-approved design 2026-11-20, "GO, separate branch").
 * It replaced the bottom tab bar on Home, the Study screens, Progress and
 * Profile. Pinned here: the clock order (owner's final order, Help 8 /
 * Settings 7 swapped the same day), where every circle goes, the Community
 * switch, the geometry at the design phone, the motion curve, the house
 * helpers the menu must use, the app-start budget, and the tab screens'
 * bottom clearance.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  CLOCK_ORDER,
  LABEL_POS,
  MENU_BUTTON,
  MENU_BUTTON_LEFT,
  MENU_BUTTON_LIFT,
  RING_R,
  circlePlaces,
  currentPlace,
  dragTop,
  flight,
  menuClearance,
  ringGeometry,
  settleOpen,
  slotCentre,
  spreadRanks,
} from '../src/components/nav/circleMenuPlaces.ts';
import { DRAWN_ICON, iconXml, menuMarkXml } from '../src/components/nav/circleMenuIconArt.ts';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const flat = (p: string) => read(p).replace(/\s+/g, ' ');

describe('the clock face (owner 2026-11-20, final order)', () => {
  it('12 Glossary, 1 Audio Tools, 2 Labs, 3 Study Dashboard, 4 Enrollment, 5 Progress, 6 Home, 7 Settings, 8 Help, 9 Community, 10 Profile, 11 Calculator Lab', () => {
    const names = circlePlaces(true).map((p) => `${p.hour} ${p.name}`);
    assert.deepEqual(names, [
      '12 Glossary',
      '1 Audio Tools',
      '2 Labs',
      '3 Study Dashboard',
      '4 Enrollment',
      '5 Progress',
      '6 Home',
      '7 Settings',
      '8 Help',
      '9 Community',
      '10 Profile',
      '11 Calculator Lab',
    ]);
    assert.equal(Object.keys(CLOCK_ORDER).length, 12);
    assert.equal(new Set(Object.values(CLOCK_ORDER)).size, 12, 'every place once');
  });
  it('a screen reader walks them clockwise from 12', () => {
    assert.deepEqual(circlePlaces(true).map((p) => p.hour), [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });
  it('each slot keeps the mockup label side', () => {
    assert.deepEqual(LABEL_POS, { 1: 'up', 2: 'sl', 3: 'sl', 4: 'sl', 5: 'sr', 6: 'up', 7: 'sl', 8: 'sr', 9: 'sr', 10: 'sr', 11: 'up', 12: '' });
  });
  it('colours are the mockup palette', () => {
    const c = Object.fromEntries(circlePlaces(true).map((p) => [p.key, p.color]));
    assert.deepEqual(c, {
      gloss: '#7fd4ff', tools: '#ff5a48', labs: '#2f9bff', study: '#ff8a1e', enroll: '#3fd3e6', prog: '#e6e6e6',
      home: '#ffc64d', set: '#b9bec8', help: '#c4a2ff', comm: '#ff7a9c', prof: '#37e05f', calc: '#b45bff',
    });
  });
});

describe('where each circle goes', () => {
  const dest = Object.fromEntries(circlePlaces(true).map((p) => [p.key, p.dest]));
  it('the data', () => {
    assert.deepEqual(dest, {
      gloss: { kind: 'glossary' },
      tools: { kind: 'root', route: 'ToolsHub' },
      labs: { kind: 'root', route: 'AudioLearning' },
      study: { kind: 'tab', tab: 'Study', root: 'Dashboard' },
      enroll: { kind: 'root', route: 'Awards', params: { category: 'enrollment' } },
      prog: { kind: 'tab', tab: 'Achievements', root: 'AchievementsHome' },
      home: { kind: 'tab', tab: 'Home' },
      set: { kind: 'root', route: 'Settings' },
      help: { kind: 'root', route: 'Help' },
      comm: { kind: 'community' },
      prof: { kind: 'tab', tab: 'Profile' },
      calc: { kind: 'root', route: 'CalcLab' },
    });
  });
  it('the menu navigates exactly there (and every root route exists)', () => {
    const m = flat('src/components/nav/CircleMenu.tsx');
    const root = read('src/navigation/RootNavigator.tsx');
    for (const [key, route, params] of [
      ['tools', 'ToolsHub', ', undefined, POP'],
      ['labs', 'AudioLearning', ', undefined, POP'],
      ['enroll', 'Awards', ", { category: 'enrollment' }, POP"],
      ['calc', 'CalcLab', ', undefined, POP'],
      ['help', 'Help', ', undefined, POP'],
      ['set', 'Settings', ', undefined, POP'],
    ] as const) {
      // `pop: true`: a screen already in the stack is gone back to, never stacked twice.
      assert.ok(m.includes(`case '${key}': return nav.navigate('${route}'${params});`), key);
      assert.match(root, new RegExp(`<Stack\\.Screen name="${route}"`), `${route} is a root screen`);
    }
    for (const [key, tab] of [['home', 'Home'], ['study', 'Study'], ['prog', 'Achievements'], ['prof', 'Profile']] as const) {
      assert.ok(m.includes(`case '${key}': return pressTab('${tab}');`), key);
    }
    // From a hub screen (root stack) the tab places go through the root route 'Main'.
    for (const [key, call] of [
      ['home', "nav.navigate('Main', { screen: 'Home' }, { pop: true })"],
      ['study', "nav.navigate('Main', { screen: 'Study', params: { screen: 'Dashboard' } }, { pop: true })"],
      ['prog', "nav.navigate('Main', { screen: 'Achievements', params: { screen: 'AchievementsHome' } }, { pop: true })"],
      ['prof', "nav.navigate('Main', { screen: 'Profile' }, { pop: true })"],
    ] as const) {
      assert.ok(m.includes(`case '${key}': return ${call};`), `hub ${key}`);
    }
    assert.ok(m.includes('if (key === here) return; // already here: the menu just folds away'));
    // The Glossary: on top of a Study screen, otherwise Home's way.
    assert.ok(m.includes("if (activeTab?.name === 'Study') return nav.navigate('Study', { screen: 'Glossary' });"));
    assert.ok(m.includes("return nav.navigate('Study', { screen: 'Glossary', params: { from: 'home' }, initial: false });"));
    // Study and Progress keep the tab bar's reset-to-root.
    assert.ok(m.includes("const TAB_ROOTS: Partial<Record<string, string>> = { Study: 'Dashboard', Achievements: 'AchievementsHome' };"));
    assert.ok(m.includes('CommonActions.reset({ index: 0, routes: [{ name: root }] }), target: nestedState.key'));
    assert.ok(m.includes("navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })"));
  });
  it('Community: the directory, or its REQUESTS when something is waiting', () => {
    assert.ok(flat('src/components/nav/CircleMenu.tsx').includes('go(key, (badgeCount(inbox) ?? 0) > 0);'));
    assert.ok(flat('src/components/nav/CircleMenu.tsx').includes(
      "return nav.navigate('AudioCommunityDirectory', unread ? { tab: 'requests' } : undefined, POP);",
    ));
  });
});

describe('the Community switch (config/communityVisible)', () => {
  it('off: no Community circle, every other circle keeps its hour', () => {
    const off = circlePlaces(false);
    assert.equal(off.length, 11);
    assert.ok(!off.some((p) => p.key === 'comm'));
    assert.deepEqual(off.map((p) => p.hour), [12, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11]);
  });
  it('the panel draws from the switch; the badges hang on it', () => {
    assert.match(read('src/components/nav/CircleMenuPanel.tsx'), /circlePlaces\(COMMUNITY_VISIBLE\)/);
    const m = read('src/components/nav/CircleMenu.tsx');
    assert.match(m, /\{COMMUNITY_VISIBLE \? <CommunityBadge state=\{inbox\}/);
    assert.match(m, /case 'comm':\n\s*if \(!COMMUNITY_VISIBLE\) return;/);
  });
});

describe('what is lit, and where the menu is not drawn', () => {
  it('the current place', () => {
    assert.equal(currentPlace('Home', undefined), 'home');
    assert.equal(currentPlace('Study', 'Dashboard'), 'study');
    assert.equal(currentPlace('Study', 'Flashcards'), 'study');
    assert.equal(currentPlace('Achievements', 'Topics'), 'prog');
    assert.equal(currentPlace('Profile', undefined), 'prof');
    assert.equal(currentPlace(undefined, undefined), null);
  });
  it('the Glossary carries the menu too (owner 2026-11-20), lit on Glossary', () => {
    assert.equal(currentPlace('Study', 'Glossary'), 'gloss');
    const m = read('src/components/nav/CircleMenu.tsx');
    assert.match(m, /const hidden = false;/);
    assert.match(m, /if \(hidden \|\| held\) return null;/);
  });
  it('the Glossary: its HOME key is the house; the open A–Z book sits beside the title; its overlays put the button away; the list and the hint clear it', () => {
    const g = read('src/screens/glossary/GlossaryScreen.tsx');
    assert.match(g, /accessibilityLabel="Home"\n\s*>\n\s*<NavIcon icon="Home" lit \/>/);
    // The open A–Z book BEFORE the title (owner 2026-11-20).
    assert.ok(g.indexOf('<PlaceArt place="gloss" size={30} />') > 0 && g.indexOf('<PlaceArt place="gloss" size={30} />') < g.indexOf('>GLOSSARY</Text>'));
    assert.match(g, /useHideCircleMenu\('glossary', !!chooser \|\| popupTrail\.length > 0 \|\| \(filter === 'topic' && topicPickerOpen\)\);/);
    assert.match(g, /paddingBottom: menuClearance\(insets\.bottom\) - insets\.bottom/);
    assert.match(g, /bottom=\{MENU_BUTTON_LIFT \+ MENU_BUTTON \+ 8\}/);
  });
  it('the button steps aside while the keyboard is up', () => {
    const m = read('src/components/nav/CircleMenu.tsx');
    assert.match(m, /keyboardDidShow/);
    assert.match(m, /\{keyboardUp \? null : \(/);
  });
});

describe('geometry', () => {
  it('the design phone (390 × 844, insets 47 / 34) is the mockup, exactly', () => {
    const g = ringGeometry(390, 844, 47, 34);
    assert.equal(g.openTop, 422, 'half the screen');
    assert.equal(g.r, RING_R);
    assert.equal(g.cx, 195);
    assert.equal(g.cy, 632);
    // The button: 50 pt since 2026-11-20 (owner, "13% smaller"), same corner.
    assert.equal(g.fabX, 43, '18 + 25');
    assert.equal(g.fabY, 781, 'button top 756, bottom 806');
    const home = slotCentre(g, 6);
    assert.equal(Math.round(home.y), 782);
  });
  it('the button: 50 pt (owner 2026-11-20, was 58), 18 from the left, 4 above the bottom inset', () => {
    assert.equal(MENU_BUTTON, 50);
    assert.equal(MENU_BUTTON_LEFT, 18);
    assert.equal(MENU_BUTTON_LIFT, 4);
    const m = read('src/components/nav/CircleMenu.tsx');
    assert.match(m, /bottom: insets\.bottom \+ MENU_BUTTON_LIFT/);
    assert.doesNotMatch(m, /\b844\b/, 'no hard-coded phone height');
  });
  it('every circle stays on screen on a small phone (360 × 640) and on an iPad', () => {
    for (const [w, h, t, b] of [[360, 640, 24, 0], [375, 667, 20, 0], [412, 915, 24, 24], [1024, 1366, 24, 20]]) {
      const g = ringGeometry(w, h, t, b);
      for (const p of circlePlaces(true)) {
        const c = slotCentre(g, p.hour);
        assert.ok(c.x - 27 >= 0 && c.x + 27 <= w, `${w}×${h} ${p.name} x`);
        assert.ok(c.y - 27 >= g.openTop + 30 && c.y + 27 <= h - b, `${w}×${h} ${p.name} y`);
      }
      assert.ok(g.openTop >= t + 8, 'never above the top inset');
    }
  });
  it('a tablet ring grows to fill a 60% panel, centred, every circle on screen (owner 2026-11-20, iPad)', () => {
    for (const [w, h, t, b] of [[768, 1024, 24, 20], [820, 1180, 24, 20], [1024, 1366, 24, 20], [1024, 768, 24, 20], [1366, 1024, 24, 20]]) {
      const g = ringGeometry(w, h, t, b);
      assert.ok(g.k >= 1 && g.k <= 1.6, `${w}x${h} k ${g.k}`);
      assert.equal(g.openTop, Math.round(h * 0.4));
      const half = 27 * g.k;
      for (const p of circlePlaces(true)) {
        const c = slotCentre(g, p.hour);
        assert.ok(c.x - half >= 0 && c.x + half <= w, `${w}x${h} ${p.name} x`);
        assert.ok(c.y - half >= g.openTop + 30 && c.y + half <= h - b, `${w}x${h} ${p.name} y`);
      }
      // Balanced: the space above the top labels and below Home differ by < 2 pt.
      const above = g.cy - 193 * g.k - (g.openTop + 41);
      const below = h - b - 8 - (g.cy + (150 + 27) * g.k);
      assert.ok(Math.abs(above - below) < 2, `${w}x${h} balance ${above} vs ${below}`);
    }
    assert.ok(ringGeometry(768, 1024, 24, 20).k > 1.4, 'portrait iPad ring is clearly bigger than the phone ring');
    assert.equal(ringGeometry(390, 844, 47, 34).k, 1, 'phones unchanged');
    assert.match(read('src/components/nav/CircleMenuPanel.tsx'), /scale: f\.scale \* k/);
  });
  it('the nearest circle to the button flies out first', () => {
    const g = ringGeometry(390, 844, 47, 34);
    const r = spreadRanks(g, [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    assert.equal(r[8], 0, 'Help (8 o’clock) sits nearest the corner');
    assert.deepEqual([r[1], r[2]].sort(), [10, 11], 'Audio Tools and Labs (1 and 2 o’clock) are farthest');
  });
  it('scroll clearance = inset + 4 + 50 + 12', () => {
    assert.equal(menuClearance(34), 100);
    assert.equal(menuClearance(0), 66);
  });
});

describe('motion (the mockup curve)', () => {
  it('flight', () => {
    assert.deepEqual(flight(0, 0), { q: 0, scale: 0.45, opacity: 0, label: 0 });
    assert.deepEqual(flight(1, 0), { q: 1, scale: 1, opacity: 1, label: 1 });
    assert.equal(flight(1.2, 0).q, 1.06, 'a small overshoot, capped');
    assert.ok(flight(0.5, 11).q < flight(0.5, 0).q, 'later ranks lag');
  });
  it('a drag settles on a flick or the nearer end; firm resistance past half', () => {
    assert.equal(settleOpen(800, -500, 422, 844), true);
    assert.equal(settleOpen(450, 500, 422, 844), false);
    assert.equal(settleOpen(500, 0, 422, 844), true);
    assert.equal(settleOpen(700, 0, 422, 844), false);
    assert.ok(dragTop(0, 422, 844) > 422 - 22, 'never more than 22 pt past half');
    assert.ok(dragTop(900, 422, 844) <= 848);
  });
  it('quick (owner 2026-11-20): open 240 ms, close 190 ms, firm ease-out, no spring; Reduce Motion / Low-Light → fade', () => {
    const m = read('src/components/nav/CircleMenu.tsx');
    assert.match(m, /export const OPEN_MS = 240;/);
    assert.match(m, /export const CLOSE_MS = 190;/);
    assert.match(m, /easing: Easing\.out\(Easing\.cubic\)/);
    assert.doesNotMatch(m, /withSpring/, 'no wobble, no slow settle');
    assert.match(m, /const motion = useDecorativeMotion\(\);/);
    assert.match(m, /const FADE_MS = 180;/);
  });
  it('the whole stagger fits inside the open time: the last circle lands as the panel does', () => {
    assert.equal(flight(1, 11).q, 1);
    assert.equal(flight(1, 11).label, 1);
  });
});

describe('house helpers and rules', () => {
  const m = read('src/components/nav/CircleMenu.tsx');
  it('Android BACK closes the open menu through useBackWhileFocused', () => {
    assert.match(m, /useBackWhileFocused\(shown, onBack\);/);
    assert.doesNotMatch(m, /BackHandler/);
  });
  it('the first-visit hint: createLocalStore, an ape:intro:* flag (kept through both wipes)', async () => {
    assert.match(m, /export const MENU_HINT_KEY = 'ape:intro:circleMenu';/);
    assert.match(m, /const hintStore = createLocalStore<boolean>\(/);
    assert.match(m, /onScreenIntrosReset\(\(\) => hintStore\.reset\(\)\);/);
    const wipe = read('src/features/account/clearLocalAccountData.ts');
    assert.match(wipe, /k\.startsWith\('ape:intro:'\)/, 'isOnboardingFlag keeps the ape:intro family');
  });
  it('the hint never auto-appears in Low-Light / with popups suppressed, over a popup, or off the tab screens', () => {
    assert.match(m, /const hintWanted = hintSeen === false && !suppressed && !modalUp && focused && !hidden && !held && !keyboardUp;/);
    assert.match(m, /const suppressed = useOverlaysSuppressed\(\);/);
    assert.match(m, /const modalUp = useModalHostOpen\(\);/);
  });
  it('the screen-reader branch excludes web (RNW reports a screen reader always)', () => {
    assert.match(m, /if \(Platform\.OS === 'web' \|\| !screenReaderOn\(\)\) return;/);
  });
  it('accessible names: the button is "Menu"; each circle its place name', () => {
    assert.match(m, /accessibilityLabel=\{unread \? `Menu, \$\{unread\}` : 'Menu'\}/);
    assert.match(read('src/components/nav/CircleMenuPanel.tsx'), /accessibilityLabel=\{extra \? `\$\{place\.name\}, \$\{extra\}` : place\.name\}/);
  });
  it('the PROGRESS circle keeps the tab’s moving faders when lit (owner 2026-11-20)', () => {
    const panel = read('src/components/nav/CircleMenuPanel.tsx');
    assert.match(panel, /if \(place\.key === 'prog' && lit\) \{/);
    assert.match(panel, /<ProgressFadersLit \/>/);
    assert.match(read('src/components/nav/NavIcon.tsx'), /^export function ProgressFadersLit\(\) \{/m);
  });
});

describe('the drawn icons', () => {
  it('owner picks: Tools 3, Glossary 2, Help 1, two stacked cards (dB + bulb) for Study Dashboard, Knob 1 for Settings, the mortarboard cap for Enrollment, three people for Community', () => {
    assert.deepEqual(DRAWN_ICON, {
      study: 'study3v2', calc: 'calc', tools: 'tools3', gloss: 'gloss2', help: 'help1', set: 'knob1', enroll: 'cap', comm: 'community',
    });
  });
  it('every icon is a full SVG whose gradients and clips are defined ahead of use', () => {
    for (const art of new Set(Object.values(DRAWN_ICON))) {
      const x = iconXml(art, '#3fd3e6');
      assert.match(x, /^<svg viewBox="0 0 48 48"/);
      const defsEnd = x.indexOf('</defs>');
      for (const ref of x.matchAll(/url\(#([a-z0-9]+)\)/g)) {
        const at = x.indexOf(`id="${ref[1]}"`);
        assert.ok(at >= 0 && at < defsEnd, `${art}: #${ref[1]} is in <defs>`);
      }
    }
  });
  it('the panel wears the Study Dashboard rack face and its screws (owner 2026-11-20)', () => {
    const panel = read('src/components/nav/CircleMenuPanel.tsx');
    assert.match(panel, /import \{ BlackFaceBg, PanelScrew \} from '\.\.\/ElevatedFrame';/);
    assert.match(panel, /<BlackFaceBg menu \/>/, 'the darker coat (owner 2026-11-20: "DARKER, like the old dark bar")');
    assert.match(read('src/components/ElevatedFrame.tsx'), /\[\{ o: 0, c: '#1c1c1f' \}, \{ o: 0\.42, c: '#232326' \}, \{ o: 1, c: '#0f0f11' \}\]/);
    assert.equal(panel.match(/<PanelScrew /g)?.length, 2);
    assert.match(read('src/screens/dashboard/DashboardScreen.tsx'), /import \{ BlackFaceBg, ElevatedFrame, PanelScrew \} from '\.\.\/\.\.\/components\/ElevatedFrame';/);
    assert.match(read('src/components/ElevatedFrame.tsx'), /export function BlackFaceBg\(/);
  });
  it('the Study Dashboard (flashcards) card carries a bold "EQ" as outline paths (owner 2026-11-20; no font inside the SVG)', () => {
    const x = iconXml('study3v2', '#ff8a1e');
    assert.match(x, /<path fill="#3a2614" d="M7\.01 37\.2V26\.27/);
    assert.doesNotMatch(x, /d="M8\.58 37\.34/, 'the old "dB" is gone from the Study card');
    assert.doesNotMatch(x, /<text/);
  });
  it('the Calculator Lab display reads "dB" (owner 2026-11-20)', () => {
    assert.match(iconXml('calc', '#a46bff'), /translate\(21\.6 -6\.45\) scale\(0\.58\)"><path fill="[^"]+" d="M8\.58 37\.34/);
  });
  it('the MENU mark is the ring of 11 dots', () => {
    assert.equal(menuMarkXml().match(/<circle /g)?.length, 11);
  });
  it('Home, Labs (the headphones), Progress and Profile reuse the bundled nav PNGs (no image touched)', () => {
    const panel = read('src/components/nav/CircleMenuPanel.tsx');
    for (const f of ['nav-home', 'nav-study', 'nav-progress', 'nav-profile']) assert.ok(panel.includes(`assets/icons/nav/${f}.png`), f);
    assert.ok(panel.includes("labs: require('../../../assets/icons/nav/nav-study.png')"));
  });
});

describe('the hub screens carry the menu too (owner 2026-11-20)', () => {
  for (const [f, here] of [
    ['src/screens/tools/ToolsHubScreen.tsx', 'tools'],
    ['src/screens/lab/calc/CalcLabScreen.tsx', 'calc'],
    ['src/screens/lab/AudioLearningScreen.tsx', 'labs'],
    ['src/screens/directory/AudioCommunityDirectoryScreen.tsx', 'comm'],
    ['src/screens/settings/SettingsScreen.tsx', 'set'],
    ['src/screens/help/HelpScreen.tsx', 'help'],
  ] as const) {
    it(`${f.split('/').pop()}: the MENU button lit on ${here}; the house on the HOME key, the section icon by the title; the scroll clear of the button`, () => {
      const s = read(f);
      assert.match(s, new RegExp(`<ScreenCircleMenu here="${here}" />`));
      // HOME, always (owner 2026-11-20): the house, and the press goes Home.
      assert.match(s, /<HomeOrBackKey\s+alwaysHome\s+onPress=\{\(\) => goHome\(navigation\)\}/, 'HOME key');
      assert.ok(!s.includes('homeArt'), 'no section icon on the HOME key (owner 2026-11-20)');
      assert.ok(s.includes(`<PlaceArt place="${here}" size={`), 'the section icon leads the title');
      assert.match(s, /paddingBottom: menuClearance\(insets\.bottom\)/);
    });
  }
  it('the HOME key keeps its press, its label "Home" and the house', () => {
    const k = read('src/components/nav/HomeOrBackKey.tsx');
    assert.match(k, /accessibilityLabel="Home"/);
    assert.match(k, /<NavIcon icon="Home" lit \/>/);
  });
  it('STUDY wears the new icon everywhere (owner 2026-11-20): stacked cards, dB and a bulb', () => {
    const nav = read('src/components/nav/NavIcon.tsx');
    assert.match(nav, /icon === 'Study' \? \(/);
    assert.match(nav, /art\.iconXml\('study3v2', '#ff8a1e'\)/);
    // The old headphones PNG now means LABS only.
    const hits: string[] = [];
    const walk = (d: string) => {
      for (const n of readdirSync(d)) {
        const p = `${d}/${n}`;
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.tsx?$/.test(n) && /require\([^)]*nav-study\.png/.test(read(p))) hits.push(p);
      }
    };
    walk('src');
    assert.deepEqual(hits.sort(), ['src/components/nav/CircleMenuPanel.tsx', 'src/components/nav/NavIcon.tsx']);
    assert.ok(read('src/components/nav/CircleMenuPanel.tsx').includes("labs: require('../../../assets/icons/nav/nav-study.png')"));
  });
  it('only these screens of the root stack: no lab or tool inside the hubs carries it', () => {
    const hits: string[] = [];
    const walk = (d: string) => {
      for (const n of readdirSync(d)) {
        const p = `${d}/${n}`;
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.tsx$/.test(n) && read(p).includes('<ScreenCircleMenu ')) hits.push(p);
      }
    };
    walk('src');
    assert.deepEqual(hits.sort(), [
      'src/screens/awards/AwardsScreen.tsx',
      'src/screens/directory/AudioCommunityDirectoryScreen.tsx',
      'src/screens/help/HelpScreen.tsx',
      'src/screens/lab/AudioLearningScreen.tsx',
      'src/screens/lab/calc/CalcLabScreen.tsx',
      'src/screens/settings/SettingsScreen.tsx',
      'src/screens/tools/ToolsHubScreen.tsx',
    ]);
  });
});

describe('HOME, always top-left, on every menu screen (owner 2026-11-20)', () => {
  it('My Enrollments Dashboard: HOME, the mortarboard, the menu lit on Enrollment', () => {
    const a = read('src/screens/awards/AwardsScreen.tsx');
    assert.match(a, /<HomeOrBackKey alwaysHome onPress=\{\(\) => goHome\(navigation\)\} backStyle=\{styles\.backChevron\} \/>/);
    assert.match(a, /<PlaceArt place="enroll" size=\{26\} \/>/);
    // Since 2026-11-20 the menu is on every pager page; Enrollment lights only here.
    assert.match(a, /<ScreenCircleMenu here=\{currentKey === 'enrollment' \? 'enroll' : null\} onSelf=\{menuSelf\} \/>/);
    assert.match(read('src/screens/enrollment/EnrollmentScreen.tsx'), /paddingBottom: menuClearance\(insets\.bottom\) \+ 8/);
  });
  for (const f of ['src/screens/dashboard/DashboardScreen.tsx', 'src/screens/profile/ProfileScreen.tsx', 'src/screens/achievements/AchievementsHomeScreen.tsx']) {
    it(`${f.split('/').pop()}: the house leads the header and goes Home`, () => {
      const s = read(f);
      assert.match(s, /lead=\{\s*<Pressable onPress=\{\(\) => goHome\(navigation\)\} hitSlop=\{10\} accessibilityRole="button" accessibilityLabel="Home">\s*<NavIcon icon="Home" lit \/>/);
    });
  }
  it('goHome goes BACK to the tabs, never a second copy', () => {
    assert.match(read('src/components/nav/CircleMenu.tsx'), /\(navigation as Nav\)\.navigate\('Main', \{ screen: 'Home' \}, \{ pop: true \}\);/);
  });
});

describe('Settings and Help are pushed screens now (owner 2026-11-20)', () => {
  it('no modal presentation; their HOME key leaves them', () => {
    const r = read('src/navigation/RootNavigator.tsx');
    assert.match(r, /<Stack\.Screen name="Settings" getComponent=\{Lazy\.Settings\} \/>/);
    assert.match(r, /<Stack\.Screen name="Help" getComponent=\{Lazy\.Help\} \/>/);
    assert.doesNotMatch(read('src/screens/settings/SettingsScreen.tsx'), /accessibilityLabel="Close settings"/);
  });
});

describe('the app-start budget', () => {
  it('the panel and its icon art load after the first frame (never a static import)', () => {
    const m = read('src/components/nav/CircleMenu.tsx');
    assert.doesNotMatch(m, /^import \{[^}]*\} from '\.\/CircleMenuPanel';/m);
    assert.doesNotMatch(m, /from '\.\/circleMenuIconArt'/);
    assert.match(m, /require\('\.\/CircleMenuPanel'\)/);
    assert.match(m, /runSoon\(/);
  });
});

describe('tab screens keep their last row clear of the MENU button', () => {
  for (const f of [
    'src/screens/courses/CourseSelectionScreen.tsx',
    'src/screens/dashboard/DashboardScreen.tsx',
    'src/screens/study/FlashcardsScreen.tsx',
    'src/screens/study/FillInBlankScreen.tsx',
    'src/screens/study/MatchingScreen.tsx',
    'src/screens/quiz/QuizScreen.tsx',
    'src/screens/study/ScenariosScreen.tsx',
    'src/screens/achievements/AchievementsHomeScreen.tsx',
    'src/screens/achievements/TopicsScreen.tsx',
    'src/screens/achievements/GalleryScreen.tsx',
    'src/screens/achievements/CredentialWall.tsx',
    'src/screens/achievements/LabsProgressScreen.tsx',
    'src/screens/profile/ProfileScreen.tsx',
  ]) {
    it(f.split('/').pop()!, () => assert.match(read(f), /menuClearance\(insets\.bottom\)/));
  }
  it('the old tab bar is gone; MainTabs draws the circle menu', () => {
    const t = read('src/navigation/MainTabs.tsx');
    assert.match(t, /tabBar=\{\(props\) => <CircleMenu \{\.\.\.props\} \/>\}/);
    assert.doesNotMatch(t, /from '\.\.\/components\/nav\/TabBar'/);
  });
});

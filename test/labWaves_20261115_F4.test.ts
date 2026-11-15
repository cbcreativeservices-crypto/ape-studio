/**
 * Beginner waves 1-3, group F4 (2026-11-15): Beginning Mixing, Advanced
 * Mixing, Mastering, Mixing Guides, Pre-Production, Post-Production.
 *
 * Owner go (2026-11-15): "build waves 1 thru 3" (D62 adoption plan). Every
 * lab ends this round CALMER, not bigger. Each test here would have failed
 * before its change.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source without comments, so a pin never matches an explanation. */
const code = (p: string) => read(p).replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
/** The body of `function name` up to the next top-level function. */
const fn = (src: string, name: string) => {
  const at = src.indexOf(`function ${name}(`);
  assert.ok(at >= 0, `function ${name} not found`);
  const next = src.indexOf('\nfunction ', at + 10);
  const nextExport = src.indexOf('\nexport ', at + 10);
  const ends = [next, nextExport].filter((n) => n > 0);
  return src.slice(at, ends.length ? Math.min(...ends) : undefined);
};

const MA = 'src/screens/lab/mastering';
const MX = 'src/screens/lab/mixing';
const MG = 'src/screens/lab/mixingGuides';
const PR = 'src/screens/lab/production';

// ── Wave 1 ───────────────────────────────────────────────────────────────────

describe('BM-02 · Beginning Mixing: the picture that reacts is in sight on a phone', () => {
  it('page 2: the session window is drawn ABOVE the seven prep steps', () => {
    const p = fn(code(`${MX}/pagesA.tsx`), 'PagePrepare');
    assert.ok(p.indexOf('<PrepArt') >= 0 && p.indexOf('<PrepArt') < p.indexOf('<ConceptList'), 'PrepArt before the list');
  });
  it('page 11: the terms drawing is drawn ABOVE the six term rows', () => {
    const p = fn(code(`${MX}/pagesC.tsx`), 'PageSixTerms');
    assert.ok(p.indexOf('<TermsArt') >= 0 && p.indexOf('<TermsArt') < p.indexOf('PATH_TRUTHS.map'), 'TermsArt before the rows');
  });
  it('the console scrolls to the channel the page names: the anchor on page 5, GTR on page 7', () => {
    const kit = code(`${MX}/kit.tsx`);
    const con = kit.slice(kit.indexOf('export function MiniConsole'));
    assert.match(con, /focus\?: TrackId \| null;/);
    assert.match(con, /scrollRef\.current\?\.scrollTo\(\{ x: Math\.max\(0, x - 8\), animated: false \}\)/);
    assert.match(con, /if \(!focus \|\| scrolledTo\.current === focus\) return;/, 'once per channel named: never fights a swipe');
    assert.match(con, /onLayout=\{\(e\) => \{\s*stripX\.current\[id\] = e\.nativeEvent\.layout\.x;/);
    const b = code(`${MX}/pagesB.tsx`);
    assert.match(fn(b, 'PageStaticMix'), /<MiniConsole [^>]*focus=\{anchor\}/);
    assert.match(fn(b, 'PagePanning'), /<MiniConsole [^>]*focus="gtr"/);
  });
  it('the page 2 guide says where the window is now', () => {
    assert.match(read(`${MX}/beginningMixingScreenGuides.ts`), /'Above the steps, a DAW \(recording software\) session window tidies itself/);
  });
});

describe('BM-06 · Beginning Mixing page 1: the mantra shows once, in its box', () => {
  it('the grey subtitle line no longer repeats MIX_MANTRA; page 1 still draws THE MIXER’S MANTRA box', () => {
    const s = code(`${MX}/BeginningMixingLabScreen.tsx`);
    assert.match(s, /<PagedLab labId="mixing-beg"[^>]*subtitle=""/);
    assert.doesNotMatch(s, /MIX_MANTRA/);
    assert.match(fn(code(`${MX}/pagesA.tsx`), 'PageWhatMixingDoes'), /<MixMantra \/>/);
  });
});

describe('BM-04 · the "bring in a pro" note no longer opens by itself (all four Mixing-family labs)', () => {
  it('no lab mounts ProNoteIntro; every lab keeps its link on page 1', () => {
    for (const f of [`${MA}/MasteringLabScreen.tsx`, `${MG}/MixingGuidesHubScreen.tsx`]) {
      assert.doesNotMatch(code(f), /ProNoteIntro/, f);
      assert.match(code(f), /<ProNoteButton/, f);
    }
    for (const f of [`${MX}/BeginningMixingLabScreen.tsx`, `${MX}/AdvancedMixingLabScreen.tsx`]) {
      assert.doesNotMatch(code(f), /\bproNote\b/, f);
    }
    assert.match(fn(code(`${MX}/pagesA.tsx`), 'PageWhatMixingDoes'), /<ProNoteButton \/>/);
    assert.match(fn(code(`${MX}/pagesAdvA.tsx`), 'PageGate'), /<ProNoteButton \/>/);
  });
});

describe('AM-03 · a compressor that is off says so in words, not "— BYPASSED" over dashes', () => {
  it('CompFace takes an offTitle and prints it while the unit is off', () => {
    const a = code(`${MX}/advArt.tsx`);
    assert.match(a, /export function CompFace\(\{[^}]*offTitle \}/);
    assert.match(a, /\{on \? title : offTitle \?\? `\$\{title\} — BYPASSED`\}/);
  });
  it('page 8 (Advanced), page 14 (Advanced) and page 9 (Beginning) open on a plain sentence', () => {
    assert.match(code(`${MX}/advPlots.tsx`), /<CompFace [^>]*offTitle="COMPRESSOR OFF: THE BASS IS UNTOUCHED"/);
    assert.match(code(`${MX}/advFigures.tsx`), /<CompFace [^>]*offTitle="NO BUS CHAIN: COMPRESSOR OFF"/);
    assert.match(code(`${MX}/begArt.tsx`), /<CompFace [^>]*offTitle="COMPRESSOR OFF: THE DRY HIT"/);
  });
});

describe('MA-01 · Mastering LISTEN steps lead with the habit; the mechanics fold under GO DEEPER', () => {
  const well = (src: string, title: string) => {
    const at = src.indexOf(`title: '${title}', kind: 'LISTEN'`);
    assert.ok(at >= 0, title);
    const w = src.indexOf('well: (', at);
    return src.slice(w, src.indexOf("key: '", w));
  };
  it('Module 5 step 3: THE HABIT first, the trim / loudness mechanics, the measured line and the faceplate note inside the fold', () => {
    const w = well(code(`${MA}/modules/mod5Workflow.tsx`), 'A considered change, matched');
    const fold = w.indexOf('<GoDeeper title="HOW THIS COMPARISON WORKS">');
    assert.ok(fold > 0);
    assert.ok(w.indexOf('title="The habit"') < fold, 'habit before the fold');
    assert.ok(w.indexOf('title="Before you switch MATCH off"') < fold, 'the MATCH warning stays in view');
    for (const inFold of ['output trim', 'Measured: BYPASS', 'title="The faceplate on the glass"']) assert.ok(w.indexOf(inFold) > fold, inFold);
    assert.equal(w.split('title="The habit"').length - 1, 1, 'the habit is said once');
  });
  it('Module 6 step 2: the no-fixed-target line first; BS.1770, the measured line and the limiter notes inside the fold', () => {
    const w = well(code(`${MA}/modules/mod6Loudness.tsx`), 'Quieter and louder, matched');
    const fold = w.indexOf('<GoDeeper title="HOW THIS COMPARISON WORKS">');
    assert.ok(fold > 0);
    assert.ok(w.indexOf('title="There is no fixed target in this lab"') < fold);
    assert.ok(w.indexOf('so what remains is the dynamics') < fold);
    for (const inFold of ['BS.1770-style', 'max GR', 'title="The faceplate on the glass"', 'title="This lab\'s limiter, honestly"']) assert.ok(w.indexOf(inFold) > fold, inFold);
    assert.equal(w.split('There is no fixed target').length - 1, 1);
  });
});

describe('MA-02 · Mastering: one name per option in the card, the tray, the dock and the readout', async () => {
  const C = await import('../src/screens/lab/mastering/masteringContent.ts');
  const mod4 = read(`${MA}/modules/mod4Tools.tsx`);
  const shortBlock = mod4.slice(mod4.indexOf('const TOOL_SHORT'), mod4.indexOf('const AMOUNT_LABEL'));
  const short = Object.fromEntries([...shortBlock.matchAll(/(\w+): '([A-Z]+)'/g)].filter(([, k]) => ['playback', 'monitor', 'eq', 'dyn', 'stereo', 'meters', 'analog'].includes(k)).map(([, k, v]) => [k, v]));
  it('each tool group title is its dock name (STEREO = Stereo, never "Stereo / spatial")', () => {
    assert.equal(Object.keys(short).length, 7);
    for (const g of C.TOOL_GROUPS) {
      const name = g.title.replace(/ \(optional\)$/, '');
      assert.equal(name.toUpperCase(), short[g.id], `${g.id}: "${g.title}" vs ${short[g.id]}`);
    }
    assert.doesNotMatch(mod4, /Stereo \/ spatial|Meters and analysis/);
  });
  it('each running-order label is its dock name (QUIET MID = Quiet mid); the old plain sentence opens its why', () => {
    const was = { s1: 'Opener first, quiet song last.', s2: 'Quiet song in the middle.', s3: 'Build to the opener.' } as Record<string, string>;
    for (const s of C.PROJECT_SEQUENCES) {
      assert.equal(s.label.toUpperCase(), s.short, s.id);
      assert.ok(s.why.startsWith(was[s.id]), s.id);
    }
  });
});

describe('MG-01 · Mixing Guides: the level numbers leave the top of every guide', () => {
  const s = code(`${MG}/MixingGuideScreen.tsx`);
  it('AT A GLANCE keeps origin, tempo, ensemble; Live SPL and Studio loudness open with SPL & loudness', () => {
    assert.match(s, /export const LEVEL_GLANCE_KEYS: readonly GlanceKey\[\] = \['liveSpl', 'studioLoudness'\];/);
    const top = s.slice(s.indexOf('>AT A GLANCE</Text>'), s.indexOf('THE GUIDE</Text>'));
    assert.match(top, /!LEVEL_GLANCE_KEYS\.includes\(r\.key\)/, 'the top drops the level rows');
    assert.match(s, /if \(k === 'loudness'\) \{[\s\S]*?<GlanceRows guide=\{guide\} keys=\{LEVEL_GLANCE_KEYS\} whoNote="none" \/>\s*<Prose items=\{guide\[k\]\} \/>/);
  });
  it('checker follow-up: the WHO hearing note stays VISIBLE in the top AT A GLANCE box, never folded', () => {
    const top = s.slice(s.indexOf('>AT A GLANCE</Text>'), s.indexOf('THE GUIDE</Text>'));
    assert.match(top, /whoNote=\{levelsMove \? 'end' : 'underLive'\}/);
    assert.match(s, /\{whoNote === 'end' \? \(\s*<View style=\{\[styles\.glanceRow, styles\.rowRule\]\}>\s*<Text style=\{styles\.glanceNote\}>\{WHO_LIVE_LEVEL_NOTE\}<\/Text>/);
    const sect = s.slice(s.indexOf("if (k === 'loudness')"), s.indexOf('return <Prose items={guide[k]} />;'));
    assert.match(sect, /whoNote="none"/, 'the folded section never carries it');
  });
  it('every guide has an SPL & loudness section, so no level row is ever lost', async () => {
    const dir = join(ROOT, `${MG}/data/guides`);
    const { readdirSync } = await import('node:fs');
    for (const f of readdirSync(dir)) assert.match(read(`${MG}/data/guides/${f}`), /"empty": \[\]/, f);
  });
});

describe('MG-02 · Mixing Guides: START HERE on three sections, REFERENCE on the four tables', () => {
  const s = code(`${MG}/MixingGuideScreen.tsx`);
  it('Balance & blend, common mistakes and Reference recordings are tagged START HERE; the tables REFERENCE', () => {
    assert.match(s, /START_HERE_SECTIONS: readonly GuideSectionKey\[\] = \['balance', 'notes', 'references'\];/);
    assert.match(s, /REFERENCE_SECTIONS: readonly GuideSectionKey\[\] = TABLE_KEYS;/);
    assert.match(s, /const TAG_TEXT = \{ start: 'START HERE', reference: 'REFERENCE' \} as const;/);
    assert.match(s, /<Section key=\{s\.key\} [^>]*tag=\{tagFor\(s\.key\)\}/);
    assert.match(s, /\{tag \? <Text style=\{\[styles\.tag, [^\]]*\]\}>\{TAG_TEXT\[tag\]\}<\/Text> : null\}/);
  });
  it('the tag is 10 pt (never under 9) and is read aloud', () => {
    assert.match(s, /tag: \{ fontFamily: fonts\.oswaldMedium, fontSize: 10,/);
    assert.match(s, /'Start here' : 'Reference table'/);
  });
  it('guide wording is untouched: the screen reads GUIDE_SECTIONS titles as they are', () => {
    assert.match(read(`${MG}/data/types.ts`), /\{ key: 'balance', title: 'Balance & blend' \}/);
  });
});

describe('PP-04 / PO-06 · the production labs’ start screens say what the lab does, in one plain paragraph', async () => {
  const { LABS } = await import('../src/features/production/labs.ts');
  it('Pre-Production opens with the plain first line and the one-stage-at-a-time promise', () => {
    assert.ok(LABS.preprod.blurb.startsWith('Plan a recording or a show before anyone presses record.'));
    assert.match(LABS.preprod.blurb, /one stage at a time/);
    assert.match(LABS.preprod.blurb, /names what is still missing/);
    assert.doesNotMatch(LABS.preprod.blurb, /Everything that should happen/);
  });
  it('Post-Production names the folder, its three chapters (as the lab titles them) and NEXT OUTSTANDING', () => {
    const b = LABS.postprod.blurb;
    assert.match(b, /handed a folder of recordings/);
    for (const c of LABS.postprod.chapters!) assert.ok(b.includes(c.title), c.title);
    assert.match(b, /follow NEXT OUTSTANDING/);
  });
  it('a line in, a line out: Pre-Production replaces its paragraph (+10%); Post-Production adds at most one short line', () => {
    // The replaced paragraphs were 184 and 180 characters.
    assert.ok(LABS.preprod.blurb.length <= 184 * 1.1, String(LABS.preprod.blurb.length));
    assert.ok(LABS.postprod.blurb.length <= 180 + 50, String(LABS.postprod.blurb.length));
  });
});

describe('SH-71 · production gaps are asked as questions (Stage Plot’s "Is that intended?")', async () => {
  const { readdirSync } = await import('node:fs');
  const files = ['preprod', 'postprod'].flatMap((l) => readdirSync(join(ROOT, `src/features/production/${l}`)).filter((f) => /^stage\d\.data\.ts$/.test(f)).map((f) => `src/features/production/${l}/${f}`));
  const rules = files.flatMap((f) => [...read(f).matchAll(/ruleId: "([^"]+)",[\s\S]*?severity: "(\w+)",[\s\S]*?title: "([^"]*)"/g)].map((m) => ({ id: m[1], severity: m[2], title: m[3] })));
  const asked = rules.filter((r) => r.title.endsWith('. Is that intended?'));
  it('94 gap findings are reworded as a question, none added (the rule count is unchanged at 227)', () => {
    assert.equal(rules.length, 227);
    assert.equal(asked.length, 94);
  });
  it('only gentle findings are asked: no blocker, and no safety, hearing or insurance finding is softened', () => {
    for (const r of asked) assert.notEqual(r.severity, 'blocker', r.id);
    for (const id of ['readiness-hearing-plan-missing', 'people-emergency-contact-missing', 'schedule-insurance-missing', 'people-hazards-unknown', 'readiness-hazard-open']) {
      const r = rules.find((x) => x.id === id);
      assert.ok(r && !r.title.includes('Is that intended?'), id);
    }
  });
  it('the stage screen heads the list OPEN QUESTIONS, not WHAT … IS STILL MISSING', () => {
    const s = code(`${PR}/ProductionStageScreen.tsx`);
    assert.match(s, /'OPEN QUESTIONS IN THIS PROJECT' : 'OPEN QUESTIONS IN THIS PLAN'/);
    assert.doesNotMatch(s, /STILL MISSING/);
  });
});

describe('PP-02 / PO-02 · a stage opens on its questions, not on stacked boxes and long links', () => {
  const s = code(`${PR}/ProductionStageScreen.tsx`);
  it('the stage’s LEGAL notices fold into ONE line; a tap opens them in place (no popup)', () => {
    assert.match(s, /\{stage\.notices\.length > 0 \? <StageNotices notices=\{stage\.notices\} \/> : null\}/);
    assert.doesNotMatch(s, /stage\.notices\.map/);
    assert.match(s, /\{open \? notices\.map\(\(n, i\) => <Notice key=\{`stage-\$\{i\}`\} notice=\{n\} \/>\) : null\}/);
    assert.doesNotMatch(s, /<Modal|Alert\./);
  });
  it('checker follow-up: SAFETY and QUALIFIED PERSONNEL notices (hearing, noise, power, rigging) are always shown OPEN', () => {
    assert.match(s, /export function noticeFolds\(kind: NoticeDef\['kind'\]\): boolean \{\s*return kind === 'legal';/);
    assert.match(s, /const notices = all\.filter\(\(n\) => noticeFolds\(n\.kind\)\);\s*const shown = all\.filter\(\(n\) => !noticeFolds\(n\.kind\)\);/);
    assert.match(s, /\{shown\.map\(\(n, i\) => <Notice key=\{`stage-open-\$\{i\}`\} notice=\{n\} \/>\)\}/);
  });
  it('the two hearing notes the checker found are SAFETY notices, so they stay open', async () => {
    const { LABS } = await import('../src/features/production/labs.ts');
    const hearing = (['preprod', 'postprod'] as const).flatMap((l) => LABS[l].stages.flatMap((st: { notices?: { kind: string; text: string }[] }) => st.notices ?? [])).filter((n: { text: string }) => /hearing|noise|monitoring level|close listening/i.test(n.text));
    assert.ok(hearing.length >= 3);
    for (const n of hearing) assert.notEqual(n.kind, 'legal', n.text.slice(0, 60));
  });
  it('section notices still sit beside their own questions', () => {
    assert.match(s, /section\.notices\.map\(\(n, i\) => \(\s*<Notice key=\{`\$\{section\.sectionId\}-\$\{i\}`\} notice=\{n\} \/>/);
  });
  it('stageNoticesLine: most serious first, one line', () => {
    const fnSrc = s.slice(s.indexOf('const noticeHead'), s.indexOf('function StageNotices'));
    assert.match(fnSrc, /NOTICE_ORDER: readonly NoticeDef\['kind'\]\[\] = \['qualified', 'safety', 'legal'\]/);
    assert.match(fnSrc, /`\$\{kinds\.join\(' · '\)\} · \$\{notices\.length === 1 \? 'A NOTE' : 'NOTES'\} FOR THIS STAGE \$\{open \? '▴' : '▾'\}`/);
  });
  it('the not-applicable link is short ("Not applicable?"); its spoken label keeps the full meaning', () => {
    const f = code(`${PR}/FieldRow.tsx`);
    assert.match(f, /<Text style=\{styles\.naLink\}>Not applicable\?<\/Text>/);
    assert.match(f, /accessibilityLabel=\{`Mark "\$\{field\.label\}" not applicable to this project`\}/);
  });
});

describe('MG-06 · the Mixing Guides hub says which guide a beginner opens first', () => {
  it('the top line ends "New to mixing? Open Pop first: every guide has the same layout." and is no longer than before', () => {
    const s = code(`${MG}/MixingGuidesHubScreen.tsx`);
    const line = s.match(/<Text style=\{\[styles\.intro, wide && readingText\]\}>\s*([^<]+?)\s*<\/Text>/)![1];
    assert.ok(line.endsWith('New to mixing? Open Pop first: every guide has the same layout.'), line);
    // The replaced line was 167 characters.
    assert.ok(line.length <= 167 + 30, String(line.length));
  });
  it('Pop really is the first guide on the hub', async () => {
    const { MIXING_GUIDE_INDEX } = await import('../src/screens/lab/mixingGuides/data/index.ts');
    assert.equal(MIXING_GUIDE_INDEX[0].id, 'pop');
  });
});

describe('PP-06 · a barely started project’s WHAT’S LEFT is one line per stage', async () => {
  const P = '../src/features/production/';
  const { LABS } = await import(P + 'labs.ts');
  const { resolveLab } = await import(P + 'schema.ts');
  const { readProject, projectLeftItems } = await import(P + 'readiness.ts');
  const { newProject } = await import(P + 'projectStore.ts');
  const SF = await import('../src/screens/lab/production/packetShortForm.ts');
  const left = (lab: 'preprod' | 'postprod', values: Record<string, unknown> = {}) => {
    const p = newProject(lab, 'music', 'Wave check');
    Object.assign(p.values, values);
    const resolved = resolveLab(LABS[lab].stages, p.pathway, p.values);
    return { p, left: projectLeftItems(resolved, readProject(resolved, p), p) };
  };
  it('on a new project every stage folds to one line (it was ~83 rows on Pre-Production)', () => {
    for (const lab of ['preprod', 'postprod'] as const) {
      const { p, left: groups } = left(lab);
      const rows = groups.reduce((n: number, g: { items: unknown[] }) => n + g.items.length, 0);
      assert.ok(rows > 40, `${lab}: ${rows} rows`);
      for (const g of groups) assert.ok(SF.foldsToOneLine(p, g.stageId, g.items), `${lab} ${g.stageId}`);
    }
  });
  it('a stage with an answer (or a not-applicable reason) shows every row; a stage with a blocker never folds', () => {
    const { p, left: groups } = left('preprod', { 'define.project_name': 'EP' });
    const define = groups.find((g: { stageId: string }) => g.stageId === 'define');
    if (define) assert.equal(SF.foldsToOneLine(p, 'define', define.items), false);
    assert.equal(SF.stageUntouched({ values: {}, na: { 'define.x': 'not ours' } }, 'define'), false);
    assert.equal(SF.foldsToOneLine({ values: {}, na: {} }, 's', [{ kind: 'required' }, { kind: 'blocker' }]), false);
    assert.equal(SF.foldsToOneLine({ values: {}, na: {} }, 's', [{ kind: 'required' }]), false, 'one row stays a row');
  });
  it('the line counts what is LEFT, and the packet screen opens the rows in place', () => {
    assert.equal(SF.oneLineText(17), '17 things still open · SHOW THEM ▾');
    const s = code(`${PR}/ProductionPacketScreen.tsx`);
    assert.match(s, /foldsToOneLine\(project, g\.stageId, g\.items\) && !shownStages\.has\(g\.stageId\) \?/);
    assert.match(s, /onPress=\{\(\) => setShownStages\(\(s\) => new Set\(s\)\.add\(g\.stageId\)\)\}/);
  });
});

describe('PO-03 · an exercise names its own setting when the project type differs', async () => {
  const X = await import('../src/screens/lab/production/exerciseSetting.ts');
  const { LABS } = await import('../src/features/production/labs.ts');
  it('every mapped exercise exists, and its setting appears in its own prompt’s world', () => {
    const acts = Object.fromEntries((['preprod', 'postprod'] as const).flatMap((l) => LABS[l].stages.filter((s: { activity?: unknown }) => s.activity).map((s: { activity: { activityId: string; prompt: string } }) => [s.activity.activityId, s.activity.prompt])));
    for (const id of Object.keys(X.EXERCISE_SETTING)) assert.ok(acts[id], id);
    assert.match(acts['clarify-the-handoff'], /an episode/);
  });
  it('Post-Production exercise 1 on a Live project says it uses a podcast episode; on a podcast project only the type shows', () => {
    assert.equal(X.exerciseSettingLine('clarify-the-handoff', 'live'), 'Live performance or event project. This exercise uses a podcast episode.');
    assert.equal(X.exerciseSettingLine('clarify-the-handoff', 'podcast'), 'Podcast or spoken word');
    assert.equal(X.exerciseSettingLine('repair-the-brief', 'live'), 'Live performance or event', 'a type-free exercise adds nothing');
  });
  it('the exercise screen draws the line in place of the bare type (no new element)', () => {
    const s = code(`${PR}/ProductionActivityScreen.tsx`);
    assert.match(s, /<Text style=\{styles\.pathway\}>\{exerciseSettingLine\(activityId, project\?\.pathway \?\? pathway\)\}<\/Text>/);
    assert.doesNotMatch(s, /PATHWAY_LABEL\[project/);
  });
});

describe('PO-01 · Post-Production stages 3 and 7 show the Stage 1 values they are checked against', async () => {
  const B = await import('../src/screens/lab/production/stageBriefLine.ts');
  it('stage 3 (session): delivery rate and depth, read from Stage 1', () => {
    assert.equal(B.stageBriefLine('postprod', 'session', { 'brief.target_sample_rate': '48000', 'brief.target_bit_depth': '24' }), 'FROM STAGE 1 · delivery 48 kHz, 24-bit');
    assert.equal(B.stageBriefLine('postprod', 'session', { 'brief.target_sample_rate': '44100', 'brief.target_bit_depth': '32f' }), 'FROM STAGE 1 · delivery 44.1 kHz, 32-bit float');
    assert.equal(B.stageBriefLine('postprod', 'session', {}), 'FROM STAGE 1 · delivery not set, not set');
  });
  it('stage 7 (finish): loudness target ± tolerance and the true-peak ceiling, never converted', () => {
    assert.equal(B.stageBriefLine('postprod', 'finish', { 'brief.loudness_target': -16, 'brief.loudness_tolerance': 1, 'brief.true_peak_max': -1 }), 'FROM STAGE 1 · loudness target −16 LUFS ±1 LU · true-peak ceiling −1 dBTP');
    assert.equal(B.stageBriefLine('postprod', 'finish', {}), 'FROM STAGE 1 · loudness target not set · true-peak ceiling not set');
  });
  it('only those two stages, only Post-Production', () => {
    assert.equal(B.stageBriefLine('postprod', 'brief', {}), undefined);
    assert.equal(B.stageBriefLine('preprod', 'session', {}), undefined);
  });
  it('the field ids are Stage 1’s real ones', async () => {
    const { LABS } = await import('../src/features/production/labs.ts');
    const brief = LABS.postprod.stages.find((s: { stageId: string }) => s.stageId === 'brief');
    const ids = brief.sections.flatMap((s: { fields: { fieldId: string }[] }) => s.fields.map((f) => f.fieldId));
    for (const f of ['target_sample_rate', 'target_bit_depth', 'loudness_target', 'loudness_tolerance', 'true_peak_max']) assert.ok(ids.includes(f), f);
    assert.match(code(`${PR}/ProductionStageScreen.tsx`), /const line = stageBriefLine\(lab, stage\.stageId, project\.values\);/);
  });
});

describe('AM-02 · Advanced Mixing: one plain sentence first; asides on their own lines; standards under the idea', () => {
  it('page 1 opens on a short plain Lead; the boundary rule and foundations follow as plain lines', () => {
    const p = fn(code(`${MX}/pagesAdvA.tsx`), 'PageGate');
    assert.match(p, /<Lead>The same five mix questions as Beginning Mixing, asked of a bigger, busier session\.<\/Lead>/);
    const lead = p.match(/<Lead>([^<]*)<\/Lead>/)![1];
    assert.ok(lead.length < 100, 'the bold line is short');
  });
  it('page 4 WHEN EACH TOOL WINS: no nested brackets; a plain first sentence', () => {
    const a = code(`${MX}/pagesAdvA.tsx`);
    const card = a.slice(a.indexOf('<Eyebrow>WHEN EACH TOOL WINS</Eyebrow>'), a.indexOf('</Card>', a.indexOf('<Eyebrow>WHEN EACH TOOL WINS</Eyebrow>')));
    assert.match(card, /<Body>Each tool wins at a different job\./);
    assert.doesNotMatch(card, /\(/, 'no bracketed aside');
    assert.match(card, /post-fader sends, which a subgroup fader does not/);
  });
  it('page 15: the eyebrow names the plain idea; ITU-R BS.1770 sits on its own line under it', () => {
    const d = code(`${MX}/pagesAdvD.tsx`);
    assert.match(d, /<Eyebrow>MEASURE — LOUDNESS AND TRUE PEAK<\/Eyebrow>/);
    assert.ok(d.indexOf('LOUDNESS AND TRUE PEAK</Eyebrow>') < d.indexOf('ITU-R BS.1770 procedure'));
    assert.doesNotMatch(d, /BS\.1770-STYLE ESTIMATES/);
  });
  it('page 14 THE MASTERING BORDER opens with one plain sentence', () => {
    assert.match(code(`${MX}/pagesAdvC.tsx`), /<Eyebrow>THE MASTERING BORDER<\/Eyebrow>\s*<Body>The mix ends at the mix bus; mastering starts after it\.<\/Body>/);
  });
});

describe('BM-01 · Beginning Mixing heavy pages open with one plain line, and read no longer', () => {
  const lead = (f: string, name: string) => fn(code(`${MX}/${f}`), name).match(/<Lead>([^<]*)<\/Lead>/)![1];
  const CASES: [string, string, string, number][] = [
    // file, page component, plain first sentence, length of the lede it replaced
    ['pagesA.tsx', 'PageSignalFlow', 'A channel is the path one sound takes through the mixer, from input to output.', 215],
    ['pagesC.tsx', 'PageEqContext', 'EQ means turning up or down only some pitches of one sound.', 195],
    ['pagesC.tsx', 'PageReverbDelay', 'Reverb is the sound of a room; delay is a distinct echo.', 158],
    ['pagesC.tsx', 'PageSixTerms', 'Routing means where each sound goes after its channel.', 146],
    ['pagesD.tsx', 'PageExport', 'The export is the product. Sample rate is how many snapshots of the sound per second; bit depth, how finely each is measured.', 153],
  ];
  for (const [f, name, first, was] of CASES) {
    it(`${name}: opens "${first.slice(0, 40)}…"`, () => {
      const l = lead(f, name);
      assert.ok(l.startsWith(first), l);
      // A line in, a line out: at most one short line (≈ 60 characters) longer than before.
      assert.ok(l.length <= was + 60, `${l.length} > ${was} + 60`);
    });
  }
  it('no lab-own definition of Hz, dB, RT60, ms or cents is added (plainTerms owns those)', () => {
    for (const [f, name] of CASES) assert.doesNotMatch(lead(f, name), /\b(Hz|dB|RT60|ms|cents)\b/);
  });
});

describe('SH-15 · Beginning Mixing page 4: a mix looked at with sound off shows its stored bar, marked NOT HEARD', async () => {
  const { STORED_P4_LEVELS } = await import('../src/screens/lab/mixing/storedLevels.ts');
  const { renderMix } = await import('../src/screens/lab/mixing/audio/mixAudio.ts');
  it('the stored numbers are what the lab measures (re-rendered here, to 0.1 dB)', () => {
    const r = (x: number) => Math.round(x * 10) / 10;
    const a = renderMix({}, 0);
    const b = renderMix({}, 3);
    assert.deepEqual(STORED_P4_LEVELS.a, { peakDb: r(a.peakDb), rmsDb: r(a.rmsDb) });
    assert.deepEqual(STORED_P4_LEVELS.b, { peakDb: r(b.peakDb), rmsDb: r(b.rmsDb) });
  });
  it('only a mix pressed with sound off (pb.studied) gets one; the bar says NOT HEARD', () => {
    assert.match(code(`${MX}/pagesA.tsx`), /const stored = Object\.fromEntries\(pb\.studied\.filter/);
    assert.match(code(`${MX}/pagesA.tsx`), /<HeadroomArt measured=\{pb\.measured\} stored=\{stored\} \/>/);
    const art = code(`${MX}/begArt.tsx`);
    assert.match(art, /sub=\{a \? \(aStored \? 'NOT HEARD' : 'MEASURED'\) : 'PLAY IT'\}/);
    assert.match(art, /'Stored, not heard \(sound is off\)'/);
  });
});

describe('SH-26 · Beginning Mixing page 1 spells out its short track names where they first appear', () => {
  it('PERC, GTR and BGV are spelled out in the sentence under the first picture', () => {
    assert.match(fn(code(`${MX}/pagesA.tsx`), 'PageWhatMixingDoes'), /\(PERC = percussion, GTR = guitar, BGV = backing vocals\)/);
  });
});

describe('Checker follow-up · Beginning Mixing page 4 with sound off: both columns and the caption are true', () => {
  it('MIX B says NOT HEARD when its bar is stored (it showed "+3.0 dB")', () => {
    assert.match(code(`${MX}/begArt.tsx`), /sub=\{b \? \(bStored \? 'NOT HEARD' : a \? `\+\$\{\(b\.rmsDb - a\.rmsDb\)\.toFixed\(1\)\} dB` : 'MEASURED'\) : 'PLAY IT'\}/);
  });
  it('the caption says "measured in advance … NOT HEARD" while a bar is stored, "measured as they play" otherwise', () => {
    const p = fn(code(`${MX}/pagesA.tsx`), 'PageGainStaging');
    assert.match(p, /const fromStore = Object\.keys\(stored\)\.some\(\(id\) => !pb\.measured\[id\]\);/);
    assert.match(p, /\$\{rightSide\}\. Vote with your ears first/);
    assert.match(p, /\$\{rightSide\} — B’s bar sits 3 dB higher/);
  });
});

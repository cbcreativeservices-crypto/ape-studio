/**
 * SetupArea — the first of the Stage Plot lab's five work areas: who the band
 * is, the gig, the technical contact, the document's revision and status, the
 * stage size, the performers and the notes (must-do D60; handoff §2).
 *
 *   • EVERYTHING IS OPTIONAL except a band to talk about. A field left empty
 *     is not printed; nothing here is invented for the band.
 *   • THE CONTACT IS THE BAND'S TO SHOW. Each of its four details has its own
 *     switch for the packet.
 *   • "READY TO ADVANCE" means the band's document is prepared for discussion.
 *     It is refused while the review holds something that must be corrected,
 *     and it never means the venue agreed: "venue confirmed" is a separate
 *     switch that only the band sets.
 *   • REMOVING A PERFORMER SAYS WHAT IT TOUCHES FIRST (spPerformerLinks), then
 *     asks whether their sources go too. A shared mix always stays.
 *   • RENAMING A PERFORMER renames the mixes and monitor devices that carry
 *     their name, in the same edit.
 *   • PERFORMERS is the second block: renaming the example's people is the
 *     first thing a user does.
 *   • The guided task is optional and closed until asked for.
 *
 * Every change goes through the editor's `apply` with spModel edits.
 */
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  spAddPerformer,
  spEdit,
  spLocationWord,
  spMarkDraft,
  spMarkReady,
  spPerformerLinks,
  spRemovePerformer,
  spSetVenueConfirmed,
  spToScale,
  spUpdateDevice,
  spUpdateMix,
  spUpdatePerformer,
} from '../../../features/stageplot/spModel';
import { spCanMarkReady } from '../../../features/stageplot/spReview';
import { spDateWords, spDayFromText, spProjectName, useSpProjects } from '../../../features/stageplot/spStore';
import { SP_TEMPLATES } from '../../../features/stageplot/spTemplates';
import type { SpContact, SpPerformer, SpProject, SpStatus } from '../../../features/stageplot/spTypes';
import { notify } from '../../../lib/confirm';
import { cardColumn } from '../../../theme/readingColumn';
import { colors, fonts } from '../../../theme/tokens';
import { GuidedTask } from './GuidedTask';
import { DATE_HOW, spWhen } from './ProjectLibrary';
import { useSpEditor } from './spContext';
import { spSetupField, takeSpSetupAsk } from './spIssueActions';
import { Button, Choice, Count, Fields, HelpTip, Note, RowCard, Section, Sheet, Switch, TextField, type SpCommitHow } from './spForm';

const CONTACT_FIELDS: readonly { key: 'name' | 'role' | 'email' | 'phone'; label: string; word: string; keyboard: 'default' | 'email' | 'phone'; placeholder?: string }[] = [
  { key: 'name', label: 'Contact name', word: 'name', keyboard: 'default' },
  { key: 'role', label: 'Their role', word: 'role', keyboard: 'default', placeholder: 'Band leader or sound engineer' },
  { key: 'email', label: 'Email', word: 'email address', keyboard: 'email' },
  { key: 'phone', label: 'Phone', word: 'phone number', keyboard: 'phone' },
];

const STATUS_OPTIONS: readonly { value: SpStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready to advance' },
];
const UNIT_OPTIONS = [
  { value: 'ft', label: 'Feet' },
  { value: 'm', label: 'Meters' },
] as const;
const DIMS_OPTIONS = [
  { value: 'estimated', label: 'Estimated' },
  { value: 'confirmed', label: 'Confirmed' },
] as const;

/** A stage size as typed: a number above zero, with a period or a comma.
 *  '' = no size. null = not understood. */
function sizeFromText(text: string): number | null | undefined {
  const t = text.trim();
  if (!t) return null;
  if (!/^\d+([.,]\d+)?$/.test(t)) return undefined;
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) && n > 0 && n <= 1000 ? Math.round(n * 100) / 100 : undefined;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Put a new name where the old one stands as a whole word ("Leo’s pack",
 *  "Drums, Leo"), and nowhere inside another word ("Leonard"). */
function swapName(text: string, from: string, to: string): string {
  if (!from || !text.includes(from)) return text;
  // A letter or a digit beside the name means it is part of a longer word.
  const inWord = (ch: string | undefined) => !!ch && (ch.toLowerCase() !== ch.toUpperCase() || (ch >= '0' && ch <= '9'));
  let out = '';
  let at = 0;
  for (;;) {
    const hit = text.indexOf(from, at);
    if (hit < 0) break;
    const whole = !inWord(text[hit - 1]) && !inWord(text[hit + from.length]);
    out += text.slice(at, hit) + (whole ? to : from);
    at = hit + from.length;
  }
  return out + text.slice(at);
}

export function SetupArea() {
  const ed = useSpEditor();
  const p = ed.project;
  const insets = useSafeAreaInsets();
  const library = useSpProjects();
  // Another area can send the user here for one performer ("Go to Setup"):
  // that performer's row opens, and the list is brought into view.
  const select = ed.select;
  const asked = ed.selection?.kind === 'performer' ? ed.selection.id : null;
  const [openPerformer, setOpenPerformer] = useState<string | null>(asked);
  const scrollRef = useRef<ScrollView>(null);
  const performersY = useRef<number | null>(null);
  const showAsked = useRef(asked != null);
  useEffect(() => {
    if (!asked) return;
    setOpenPerformer(asked);
    if (performersY.current != null) scrollRef.current?.scrollTo({ y: Math.max(0, performersY.current - 8), animated: false });
    else showAsked.current = true;
    // Asked once: coming back to Setup later must not open the row again.
    select(null);
  }, [asked, select]);
  // A review question about a Setup FIELD ("Go to" from another area): the
  // rule is left by spIssueActions and taken once here. The band name and
  // the title are on the first screen; the contact block and the performers
  // are scrolled to when they have been laid out.
  const wanted = useRef<'contact' | 'performers' | null>(null);
  const contactY = useRef<number | null>(null);
  useEffect(() => {
    const field = spSetupField(takeSpSetupAsk());
    if (field === 'performers') {
      if (performersY.current != null) scrollRef.current?.scrollTo({ y: Math.max(0, performersY.current - 8), animated: false });
      else showAsked.current = true;
    } else if (field === 'contact') {
      if (contactY.current != null) scrollRef.current?.scrollTo({ y: Math.max(0, contactY.current - 8), animated: false });
      else wanted.current = 'contact';
    }
  }, []);
  const [removing, setRemoving] = useState<string | null>(null);
  const [dateNote, setDateNote] = useState(false);
  const [sizeNote, setSizeNote] = useState(false);

  /** One edit of the project's own fields. */
  const set = (change: (d: SpProject) => void) => ed.apply((q) => spEdit(q, change));
  const setContact = (change: (c: SpContact) => void) => set((d) => change(d.contact));

  const template = p.startedFrom ? SP_TEMPLATES.find((t) => t.id === p.startedFrom) : undefined;
  const master = p.kind === 'gig' && p.masterId ? library.find((x) => x.id === p.masterId) : undefined;
  const blocks = ed.issues.filter((i) => i.level === 'block');
  const canReady = spCanMarkReady(ed.issues);
  const shared = p.frozenRevision >= p.revision;
  // Only a save the device REFUSED is said here. That the work of a guest is
  // kept only until the app is closed is said on the list of stage plots and
  // in the bar above every area; a third copy here pushed the first field
  // off a phone's first screen (visual review, 2026-11-12).
  const notSaved = ed.saveState === 'failed' ? 'Not saved: this device could not store your last change. Your work is still on screen. Saving is tried again with your next change, and when you leave this stage plot.' : null;
  const noBandName = ed.issues.find((i) => i.rule === 'no-band-name');
  const exampleTitle = ed.issues.find((i) => i.rule === 'example-title');
  const noContact = ed.issues.find((i) => i.rule === 'no-contact');
  const email = p.contact.email.trim();

  const setStatus = (next: SpStatus) => {
    if (next === 'draft') {
      ed.apply(spMarkDraft);
      return;
    }
    if (!canReady) {
      notify('Not ready to advance yet', `${plural(blocks.length, 'thing', 'things')} must be corrected first. The review list in the Export area says what and where.`);
      return;
    }
    ed.apply(spMarkReady);
  };

  // A text that is not understood is refused in words, but only once the
  // field is LEFT: after a pause the user may still be typing it.
  const commitDate = (text: string, how?: SpCommitHow) => {
    const day = spDayFromText(text);
    if (day === null && how === 'paused') return;
    setDateNote(day === null);
    if (day !== null && day !== p.eventDate) set((d) => (d.eventDate = day));
  };
  const commitSize = (key: 'width' | 'depth', text: string, how?: SpCommitHow) => {
    const n = sizeFromText(text);
    if (n === undefined && how === 'paused') return;
    setSizeNote(n === undefined);
    if (n !== undefined && n !== p.stage[key]) set((d) => (d.stage[key] = n));
  };

  // RENAMING A PERFORMER RENAMES WHAT WAS NAMED AFTER THEM, in the same edit:
  // their mixes ("Leo, wedge") and the monitor devices they use or that play
  // those mixes ("Leo’s pack"). Otherwise the packet names one person two
  // ways. `named` is the name those rows carry now: a one-letter name seen in
  // the middle of typing is never searched for, and the next full name is put
  // in place of the last full one.
  const named = useRef<Record<string, string>>({});
  const renamePerformer = (pf: SpPerformer, text: string) => {
    const from = named.current[pf.id] ?? pf.name.trim();
    const carry = from.length >= 2 && text.length >= 2 && from !== text;
    named.current[pf.id] = carry || from.length < 2 ? text : from;
    ed.apply((q) => {
      let next = spUpdatePerformer(q, pf.id, { name: text });
      if (!carry) return next;
      const theirs = new Set(q.mixes.filter((m) => m.recipients.includes(pf.id)).map((m) => m.id));
      for (const m of q.mixes) {
        if (!theirs.has(m.id)) continue;
        const name = swapName(m.name, from, text);
        if (name !== m.name) next = spUpdateMix(next, m.id, { name });
      }
      for (const d of q.devices) {
        if (d.performerId !== pf.id && !(d.mixId && theirs.has(d.mixId))) continue;
        const label = swapName(d.label, from, text);
        if (label !== d.label) next = spUpdateDevice(next, d.id, { label });
      }
      return next;
    });
  };

  const addPerformer = () => {
    let id = '';
    ed.apply((q) => {
      // A name to begin with, so the new row can be told from the others.
      let n = q.performers.length + 1;
      while (q.performers.some((x) => x.name === `Performer ${n}`)) n += 1;
      const r = spAddPerformer(q, { name: `Performer ${n}` });
      id = r.id;
      return r.p;
    });
    if (id) setOpenPerformer(id);
  };

  const where = (pf: SpPerformer): string => {
    const o = p.objects.find((x) => x.performerId === pf.id);
    return o ? spLocationWord(o) : 'Not on the stage yet';
  };

  const leaving = removing ? p.performers.find((x) => x.id === removing) : undefined;
  const links = leaving ? spPerformerLinks(p, leaving.id) : null;
  const remove = (withSources: boolean) => {
    if (!leaving) return;
    const id = leaving.id;
    setRemoving(null);
    setOpenPerformer(null);
    ed.apply((q) => spRemovePerformer(q, id, { withSources }));
  };
  const leavingName = leaving?.name.trim() || 'this performer';
  // spPerformerLinks names everything that is only theirs: sources, inputs,
  // a mix nobody else is on, the devices they use or that play such a mix,
  // and every drawing of any of these. The first choice removes ALL of it.
  const ownObjects = links && leaving ? links.objects.filter((o) => o.performerId !== leaving.id) : [];
  const hasOwn = !!links && (links.sources.length > 0 || links.soleMixes.length > 0 || links.devices.length > 0 || ownObjects.length > 0);

  return (
    <>
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: 48 + insets.bottom }]} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <View style={[cardColumn, styles.column]}>
          {notSaved ? <Note tone="warning">{notSaved}</Note> : null}

          <GuidedTask />

          <Section title="THE BAND">
            <TextField label="Band or artist name" value={p.band} onCommit={(band) => set((d) => (d.band = band))} />
            {noBandName ? <Note tone="warning">{noBandName.text} Type it above.</Note> : null}
            <TextField label="Title of this stage plot" value={p.title} onCommit={(title) => set((d) => (d.title = title))} hint="Optional. For example: Club set, Festival set." />
            {exampleTitle ? <Note tone="warning">{exampleTitle.text}</Note> : null}
            {template ? (
              <Note>
                Started from the example “{template.name}”. It assumed: {template.assumes} Change anything that is not true for your band.
              </Note>
            ) : null}
            {p.kind === 'gig' ? (
              <Note>{master ? `A gig copy of “${spProjectName(master)}”. What you change here does not change the master.` : 'A gig copy. Its master is no longer on this device.'}</Note>
            ) : null}
          </Section>

          <View
            onLayout={(e) => {
              performersY.current = e.nativeEvent.layout.y;
              if (showAsked.current) {
                showAsked.current = false;
                scrollRef.current?.scrollTo({ y: Math.max(0, e.nativeEvent.layout.y - 8), animated: false });
              }
            }}
          >
          <Section title="PERFORMERS" hint="Everyone on the stage. What each one plays or sings, and what each one hears, is linked to them in the other areas.">
            {p.performers.length === 0 ? <Text style={styles.quiet}>No performers yet.</Text> : null}
            {p.performers.map((pf) => {
              const open = openPerformer === pf.id;
              const name = pf.name.trim() || 'Unnamed performer';
              const placed = p.objects.some((x) => x.performerId === pf.id);
              return (
                <RowCard
                  key={pf.id}
                  title={name}
                  subtitle={[pf.role.trim(), where(pf)].filter(Boolean).join(' · ')}
                  selected={open}
                  onPress={() => setOpenPerformer(open ? null : pf.id)}
                  a11yLabel={`${name}, ${pf.role.trim() || 'no role yet'}, ${where(pf)}. ${open ? 'Close' : 'Edit'}.`}
                  right={<Button label={open ? 'CLOSE' : 'EDIT'} onPress={() => setOpenPerformer(open ? null : pf.id)} a11yLabel={`${open ? 'Close' : 'Edit'} ${name}`} />}
                >
                  {open ? (
                    <>
                      <TextField label="Name" value={pf.name} onCommit={(text) => renamePerformer(pf, text)} hint="Their mixes and monitor devices that carry this name are renamed with them." />
                      <TextField label="What they do" value={pf.role} placeholder="Guitar and lead vocal" onCommit={(text) => ed.apply((q) => spUpdatePerformer(q, pf.id, { role: text }))} />
                      <View style={styles.buttons}>
                        <Button
                          label={placed ? 'LOCATE ON THE STAGE' : 'PLACE ON THE STAGE'}
                          onPress={() => ed.goTo('stage', { kind: 'performer', id: pf.id })}
                          a11yLabel={placed ? `Locate ${name} on the stage` : `Go to the Stage area to place ${name}`}
                        />
                        <Button label="REMOVE" tone="danger" onPress={() => setRemoving(pf.id)} a11yLabel={`Remove ${name}. You are shown what they are linked to first.`} />
                      </View>
                    </>
                  ) : null}
                </RowCard>
              );
            })}
            <Button label="ADD A PERFORMER" tone="primary" onPress={addPerformer} />
          </Section>
          </View>

          <Section title="THE GIG" hint="All optional. Type what you know now. You can add the rest later.">
            <TextField label="Venue" value={p.venue} onCommit={(venue) => set((d) => (d.venue = venue))} />
            <TextField label="Event date" value={p.eventDate} onCommit={commitDate} placeholder="2026-12-05" hint="Year first, or the month as a word: 2026-12-05, or Dec 5, 2026. It is also used in the packet’s file name." />
            {p.eventDate && !dateNote ? <Text style={styles.quiet}>Read as {spDateWords(p.eventDate)}.</Text> : null}
            {dateNote ? <Note tone="warning">That date was not read, so it was not changed. {DATE_HOW}</Note> : null}
            <Fields>
              <TextField label="Load-in" value={p.loadIn} onCommit={(loadIn) => set((d) => (d.loadIn = loadIn))} placeholder="3:00 PM" width="half" />
              <TextField label="Soundcheck" value={p.soundcheck} onCommit={(soundcheck) => set((d) => (d.soundcheck = soundcheck))} placeholder="5:00 PM" width="half" />
              <TextField label="Performance" value={p.performance} onCommit={(performance) => set((d) => (d.performance = performance))} placeholder="9:00 PM" width="half" />
            </Fields>
          </Section>

          <View
            onLayout={(e) => {
              contactY.current = e.nativeEvent.layout.y;
              if (wanted.current === 'contact') {
                wanted.current = null;
                scrollRef.current?.scrollTo({ y: Math.max(0, e.nativeEvent.layout.y - 8), animated: false });
              }
            }}
          >
          <Section title="TECHNICAL CONTACT" hint="The person the venue’s engineer should ask. You choose which details the venue sees.">
            {noContact ? <Note tone="warning">{noContact.text}</Note> : null}
            {CONTACT_FIELDS.map((f) => (
              <View key={f.key} style={styles.pair}>
                <TextField label={f.label} value={p.contact[f.key]} keyboard={f.keyboard} placeholder={f.placeholder} onCommit={(text) => setContact((c) => (c[f.key] = text))} />
                {f.key === 'email' && email && !email.includes('@') ? <Note tone="warning">This does not look like an email address. It is kept as typed.</Note> : null}
                <Switch label={`Show the ${f.word} in the packet`} value={p.contact.show[f.key]} onChange={(on) => setContact((c) => (c.show[f.key] = on))} />
              </View>
            ))}
          </Section>
          </View>

          <Section title="REVISION AND STATUS">
            <View style={styles.counts}>
              <Count value={p.revision} label="revision, printed on every page" />
            </View>
            {p.modifiedAt > 0 ? <Text style={styles.quiet}>Last changed {spWhen(p.modifiedAt)}.</Text> : null}
            {shared ? (
              <Note>
                Revision {p.revision} was marked ready or shared. Your next change starts revision {p.revision + 1} as a draft. A changed document never carries the number of one you may already have sent.
              </Note>
            ) : null}
            <Choice
              label="Status"
              value={p.status}
              options={STATUS_OPTIONS}
              onChange={setStatus}
              hint="“Advancing” a show means sending your technical details to the venue before show day. Ready to advance means your document is prepared for that. It does not mean the venue has agreed to it."
            />
            {!canReady ? (
              <Note tone="warning">
                <Text style={styles.noteText}>
                  {plural(blocks.length, 'thing', 'things')} must be corrected before this can be marked ready. First: {blocks[0]?.text}
                </Text>
                <Button label="GO TO THE REVIEW" onPress={() => ed.goTo('export')} a11yLabel="Go to the review list in the Export area" />
              </Note>
            ) : null}
            {p.status === 'ready' ? (
              <Switch
                label="The venue has confirmed this revision"
                value={p.venueConfirmed}
                onChange={(on) => ed.apply((q) => spSetVenueConfirmed(q, on))}
                hint="Recorded only because you say so, and kept apart from the status. It returns to off when the stage plot changes."
              />
            ) : null}
          </Section>

          <Section title="STAGE SIZE" hint="Optional. Type it if the venue told you, or if you measured it.">
            <Fields>
              <TextField label="Width" value={p.stage.width == null ? '' : String(p.stage.width)} keyboard="numeric" width="half" onCommit={(t, how) => commitSize('width', t, how)} hint="Side to side." />
              <TextField label="Depth" value={p.stage.depth == null ? '' : String(p.stage.depth)} keyboard="numeric" width="half" onCommit={(t, how) => commitSize('depth', t, how)} hint="Front to back." />
            </Fields>
            {sizeNote ? <Note tone="warning">That size was not understood, so it was not changed. Type a number, like 24 or 7.5.</Note> : null}
            <Choice label="Measured in" value={p.stage.unit} options={UNIT_OPTIONS} onChange={(unit) => set((d) => (d.stage.unit = unit))} hint="Changing the unit does not convert the numbers." />
            <Choice label="These numbers are" value={p.stage.dims} options={DIMS_OPTIONS} onChange={(dims) => set((d) => (d.stage.dims = dims))} />
            <Note>
              {spToScale(p)
                ? 'The stage is drawn to scale. The symbols on it are not: they show what stands there, not the real size of your equipment. The drawing does not prove that everything fits.'
                : 'With no width and depth, the stage is drawn in a usual shape and the packet says “Not to scale”.'}
            </Note>
            <HelpTip
              title="Stage right, stage left, upstage, downstage"
              body="Stage directions are the performer’s, facing the audience. Stage right is the performer’s right, so it is on the LEFT of the drawing. Stage left is on the right of the drawing. Upstage is the back of the stage, away from the audience. Downstage is the front, toward the audience. The drawing always has the audience at the bottom."
            />
          </Section>

          <Section title="NOTES" hint="Printed in the packet as you write them.">
            <TextField label="General notes" value={p.notes} multiline onCommit={(notes) => set((d) => (d.notes = notes))} />
            <TextField label="Access and setup notes" value={p.accessNotes} multiline onCommit={(accessNotes) => set((d) => (d.accessNotes = accessNotes))} hint="Load-in route, parking, set changes: anything the crew should know." />
            <TextField
              label="Viewpoint note"
              value={p.viewNote}
              multiline
              onCommit={(viewNote) => set((d) => (d.viewNote = viewNote))}
              hint="Stage left and stage right are the performer’s left and right, facing the audience. If any of your names use another viewpoint, such as overhead microphones named as the audience sees the kit, say so here."
            />
          </Section>
        </View>
      </ScrollView>

      <Sheet visible={!!leaving} title={`Remove ${leavingName}?`} onClose={() => setRemoving(null)}>
        {leaving && links ? (
          <>
            <Text style={styles.body}>What {leavingName} is linked to:</Text>
            <View style={styles.links}>
              {links.sources.length ? (
                <Text style={styles.link}>
                  • {plural(links.sources.length, 'source', 'sources')} ({links.sources.map((s) => s.label).join(', ')}), with {plural(links.inputs.length, 'input', 'inputs')}.
                </Text>
              ) : (
                <Text style={styles.link}>• No sources.</Text>
              )}
              {links.soleMixes.map((m) => (
                <Text key={m.id} style={styles.link}>
                  • Mix {m.code}
                  {m.name ? ` “${m.name}”` : ''} is only theirs.
                </Text>
              ))}
              {links.sharedMixes.map((m) => (
                <Text key={m.id} style={styles.link}>
                  • Mix {m.code}
                  {m.name ? ` “${m.name}”` : ''} is shared. It stays, with the others still on it.
                </Text>
              ))}
              {links.devices.length ? (
                <Text style={styles.link}>
                  • {plural(links.devices.length, 'monitor device', 'monitor devices')} that only they use ({links.devices.map((d) => d.label.trim() || 'no name').join(', ')}).
                </Text>
              ) : null}
              {links.objects.length > ownObjects.length ? <Text style={styles.link}>• The object that stands for them on the stage. It is removed with them in both choices.</Text> : null}
              {ownObjects.length ? (
                <Text style={styles.link}>
                  • {plural(ownObjects.length, 'more object', 'more objects')} on the stage, drawn for their sources, inputs and monitor devices ({ownObjects.map((o) => o.label.trim() || 'no name').join(', ')}).
                </Text>
              ) : null}
            </View>
            {hasOwn ? (
              <>
                <Button label={`REMOVE ${leavingName.toUpperCase()} AND WHAT IS ONLY THEIRS`} tone="danger" onPress={() => remove(true)} a11yLabel={`Remove ${leavingName} with everything that is only theirs: sources, inputs, mix, monitor devices and objects on the stage`} />
                <Text style={styles.quiet}>Everything in the list above that is only theirs is removed: their sources and inputs, a mix that is only theirs, those monitor devices, and their objects on the stage. A shared mix stays. The channel numbers of the other inputs do not change.</Text>
                <Button label={`REMOVE ${leavingName.toUpperCase()}, KEEP THE REST`} onPress={() => remove(false)} a11yLabel={`Remove ${leavingName} and keep their sources, inputs and mixes`} />
                <Text style={styles.quiet}>Only the object that stands for them leaves the stage. Their sources and inputs stay in the list with no performer. A mix that was only theirs stays, with nobody on it, and its monitor devices stay, so you can give them to someone else.</Text>
              </>
            ) : (
              <Button label={`REMOVE ${leavingName.toUpperCase()}`} tone="danger" onPress={() => remove(false)} a11yLabel={`Remove ${leavingName}`} />
            )}
            <Button label="CANCEL" onPress={() => setRemoving(null)} a11yLabel="Cancel. Nobody is removed." />
            <Text style={styles.quiet}>If you change your mind afterward, UNDO reverses it.</Text>
          </>
        ) : null}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 12 },
  column: { gap: 22 },
  pair: { gap: 8 },
  counts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quiet: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSub },
  body: { fontFamily: fonts.barlowSemiBold, fontSize: 14.5, lineHeight: 21, color: colors.textPrimary },
  noteText: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19.5, color: colors.textSecondary },
  links: { gap: 8 },
  link: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
});

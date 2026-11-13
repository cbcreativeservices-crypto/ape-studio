/**
 * ProjectLibrary — the Stage Plot lab's first screen: start a stage plot, or
 * return to one (must-do D60; handoff §2).
 *
 *   • START from a blank stage or from an example band. Each example states
 *     what it ASSUMES before it is chosen, and every part of it can be changed.
 *   • YOUR STAGE PLOTS, newest change first, with the three faces of a list:
 *     still reading / could not be read / none yet. A failed read is never
 *     shown as "nothing saved".
 *   • MORE holds rename, duplicate, DUPLICATE FOR A GIG and delete. A gig copy
 *     remembers its master and never changes it; delete asks first.
 *   • A CAP, with a plain message at the cap. Nothing is ever pushed out of
 *     the list to make room.
 *
 * "Saved" is only said from a write the device accepted; a guest and a
 * preview are told, in words, that the work is kept only until the app is
 * closed.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAfterModalsClose } from '../../../components/DimModal';
import { persistAllowed, type Tier } from '../../../features/commercial/tier';
import { useGuestWording, useTier } from '../../../features/commercial/useTier';
import { sessionCarryOpen } from '../../../features/lab/sessionCarry';
import { spDuplicateProject, spEdit } from '../../../features/stageplot/spModel';
import {
  SP_MAX_PROJECTS,
  deleteSpProject,
  getSpProject,
  getSpProjects,
  retrySpLibrary,
  saveSpProject,
  spAtCap,
  spDateWords,
  spDayFromText,
  spNewProjectId,
  spProjectName,
  spProjectSaveState,
  useSpLibraryFace,
  useSpProjects,
} from '../../../features/stageplot/spStore';
import { SP_TEMPLATES, spFromTemplate, type SpTemplateId } from '../../../features/stageplot/spTemplates';
import type { SpProject } from '../../../features/stageplot/spTypes';
import { confirmDialog, notify } from '../../../lib/confirm';
import { useLatchedPress } from '../../../lib/latch';
import { colors, fonts } from '../../../theme/tokens';
import { accountWhy, type AccountWording } from '../kit/labEnd';
import type { SpSaveState } from './spContext';
import { Button, HelpTip, Note, RowCard, Section, Sheet, TextField } from './spForm';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "November 12, 2026, 3:05 PM", in the device's own time. One style for every
 *  date the lab SHOWS: the month in full, with a comma. */
export function spWhen(ms: number): string {
  const d = new Date(ms);
  if (!Number.isFinite(d.getTime()) || ms <= 0) return '';
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}, ${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Why the work is not being saved, in words; null for a real account.
 *  "Not signed in" is said only to a KNOWN guest (useGuestWording). */
export function spNotSavedLine(tier: Tier, wording: { guest: boolean; account?: AccountWording }, carryOpen: boolean): string | null {
  if (persistAllowed(tier)) return null;
  if (tier === 'preview') return 'This is a preview. Your stage plots are kept only until you close the app. They are not saved.';
  if (!wording.guest) return `${accountWhy(wording.account ?? 'checking')} Until it is confirmed, your stage plots are kept only until you close the app.`;
  return carryOpen
    ? 'You are not signed in. Your stage plots are kept only until you close the app. If you sign in before you close the app, they are saved.'
    : 'You are not signed in. Your stage plots are kept only until you close the app. They are not saved.';
}

/** How to type a date so it can be read one way only. */
export const DATE_HOW = 'Type the year first, like 2026-12-05, or write the month as a word, like Dec 5, 2026. A date such as 5/12/2026 is not read, because it can mean two days.';

const CAP_LINE = `This device keeps ${SP_MAX_PROJECTS} stage plots, and it is full. Delete one you no longer need, then start another.`;

export function ProjectLibrary({ onOpen }: { onOpen: (project: SpProject, saveState: SpSaveState) => void }) {
  const projects = useSpProjects();
  const face = useSpLibraryFace();
  const tier = useTier();
  const wording = useGuestWording();
  const afterClose = useAfterModalsClose();
  const [menuId, setMenuId] = useState<string | null>(null);
  const [gigForm, setGigForm] = useState(false);
  const [draft, setDraft] = useState({ band: '', title: '', venue: '', date: '' });

  const full = spAtCap(projects);
  const notSaved = spNotSavedLine(tier, wording, sessionCarryOpen());
  const menu = menuId ? projects.find((p) => p.id === menuId) : undefined;

  /** Save a NEW project, then open it. The cap is judged at the tap, on the
   *  list as it is then. */
  const openNew = async (make: (id: string, now: number) => SpProject | null) => {
    if (spAtCap(getSpProjects())) {
      notify('Your list of stage plots is full', CAP_LINE);
      return;
    }
    const now = Date.now();
    const p = make(spNewProjectId(now), now);
    if (!p) return;
    const result = await saveSpProject(p);
    onOpen(p, result);
  };

  const start = useLatchedPress((template: SpTemplateId) => openNew((id, now) => spFromTemplate(template, { id, now })));

  const openMenu = (p: SpProject) => {
    setDraft({ band: p.band, title: p.title, venue: '', date: '' });
    setGigForm(false);
    setMenuId(p.id);
  };
  const closeMenu = () => setMenuId(null);

  const rename = useLatchedPress(async () => {
    const cur = menuId ? getSpProject(menuId) : undefined;
    if (!cur) return;
    const band = draft.band.trim();
    const title = draft.title.trim();
    if (band === cur.band && title === cur.title) {
      closeMenu();
      return;
    }
    // A rename is an edit: on a revision that was marked ready or shared it starts
    // the next revision, because the name prints on the packet.
    const next = spEdit(cur, (d) => {
      d.band = band;
      d.title = title;
    });
    const result = await saveSpProject({ ...next, modifiedAt: Date.now() });
    if (result === 'failed') {
      notify('Name not changed', 'This device could not save the new name. The stage plot is as it was. Try again.');
      return;
    }
    closeMenu();
  });

  const duplicate = useLatchedPress(async (kind: 'master' | 'gig') => {
    const cur = menuId ? getSpProject(menuId) : undefined;
    if (!cur) return;
    const date = kind === 'gig' ? spDayFromText(draft.date) : '';
    if (date === null) {
      notify('Date not understood', DATE_HOW);
      return;
    }
    closeMenu();
    await openNew((id, now) => {
      if (kind === 'master') return spDuplicateProject(cur, { id, kind, now, title: cur.title ? `${cur.title} (copy)` : 'Copy' });
      const copy = spDuplicateProject(cur, { id, kind, now });
      const venue = draft.venue.trim();
      // The copy is a new document (revision 1), so the venue is part of it
      // from the start. The master is not touched.
      if (!venue && !date) return copy;
      return {
        ...spEdit(copy, (d) => {
          if (venue) d.venue = venue;
          if (date) d.eventDate = date;
        }),
        modifiedAt: now,
      };
    });
  });

  const runDelete = useLatchedPress(async (id: string) => {
    const ok = await deleteSpProject(id);
    if (!ok) notify('Not deleted', 'This device could not update its storage. The stage plot is still there. Try again.');
  });
  const askDelete = (p: SpProject) => {
    const copies = projects.filter((x) => x.masterId === p.id).length;
    closeMenu();
    // One popup at a time: the menu closes, then the question is asked.
    afterClose(() =>
      confirmDialog(
        'Delete this stage plot?',
        // A stage plot that was never written to the device is not "removed from this device".
        `“${spProjectName(p)}” will be removed${spProjectSaveState(p.id) === 'saved' ? ' from this device' : ''}. This cannot be undone.${copies ? ' The gig copies made from it are kept.' : ''}`,
        'Delete',
        () => runDelete(p.id),
        { destructive: true },
      ),
    );
  };

  /** A gig copy says which master it came from. (A master says so in its badge.) */
  const kindLine = (p: SpProject): string => {
    if (p.kind !== 'gig') return '';
    const master = p.masterId ? projects.find((x) => x.id === p.masterId) : undefined;
    return master ? `Gig copy of “${spProjectName(master)}”` : 'Gig copy (its master is no longer on this device)';
  };
  /** What tells two rows apart, one fact to a line: the master of a gig copy,
   *  the venue and the day, and the example an unnamed plot started from. */
  const cardLines = (p: SpProject): string[] => {
    const lines: string[] = [];
    const kind = kindLine(p);
    if (kind) lines.push(kind);
    const where = [p.venue.trim(), spDateWords(p.eventDate)].filter(Boolean).join(' · ');
    if (where) lines.push(where);
    const template = p.startedFrom ? SP_TEMPLATES.find((t) => t.id === p.startedFrom) : undefined;
    if (template && !p.band.trim()) lines.push(`Started from: ${template.name}`);
    const when = spWhen(p.modifiedAt);
    if (when) lines.push(`Changed ${when}`);
    return lines;
  };
  const gigDay = spDayFromText(draft.date);

  return (
    <View style={styles.root}>
      <Text style={styles.lead}>Draw your stage, list every input and monitor mix, and make a packet your venue’s sound engineer can read.</Text>
      <HelpTip
        title="What a stage plot is for"
        body="A stage plot shows who performs and where they stand. It comes with two lists. The input list has every sound that reaches the sound system. The monitor plan says what each performer needs to hear. A venue’s sound engineer reads all three before your show, so they can prepare the stage before you arrive."
      />
      <HelpTip
        title="Words used in the examples"
        body="A wedge is a monitor speaker on the floor, aimed at a performer. In-ear monitors are earphones that do the same job. A DI (direct box) connects an instrument straight to the mixer, with no microphone. A click is a metronome that only the players hear. The house console is the venue’s mixer. An input split sends each input to two mixers: the venue’s and the band’s own."
      />
      {notSaved ? <Note tone="warning">{notSaved}</Note> : null}

      <Section title="START A STAGE PLOT" hint="An example is a starting point. Read what it assumes; you can change every part of it.">
        {full ? <Note tone="warning">{CAP_LINE}</Note> : null}
        {SP_TEMPLATES.map((t) => (
          <RowCard
            key={t.id}
            title={t.name}
            subtitle={t.id === 'blank' ? t.assumes : `Assumes: ${t.assumes}`}
            right={<Button label="START" tone="primary" disabled={full} onPress={() => start(t.id)} a11yLabel={`Start from ${t.name}`} />}
          />
        ))}
      </Section>

      <Section title="YOUR STAGE PLOTS" hint="The one you changed last is at the top.">
        {face === 'unreadable' ? (
          <>
            <Note tone="warning">Your saved stage plots could not be read from this device just now. They are not lost, and nothing is written over them.</Note>
            <Button label="TRY AGAIN" onPress={retrySpLibrary} a11yLabel="Try to read your saved stage plots again" />
          </>
        ) : null}
        {face === 'loading' && projects.length === 0 ? <Text style={styles.quiet}>Reading your stage plots…</Text> : null}
        {face === 'ready' && projects.length === 0 ? <Text style={styles.quiet}>No stage plots yet. Start one above.</Text> : null}
        {projects.map((p) => {
          const state = spProjectSaveState(p.id);
          const lines = cardLines(p);
          return (
            <RowCard
              key={p.id}
              title={spProjectName(p)}
              subtitle={lines.join('\n')}
              onPress={() => onOpen(p, state)}
              a11yLabel={`Open ${spProjectName(p)}. ${[p.kind === 'gig' ? '' : 'Master', ...lines].filter(Boolean).join('. ')}. Revision ${p.revision}, ${p.status === 'ready' ? 'ready to advance' : 'draft'}${state === 'saved' ? '' : ', not saved'}.`}
            >
              {/* Plain small text, not outlined boxes: on this card only OPEN
                  and MORE are buttons, and only they look like buttons. */}
              <Text style={styles.tags}>
                {[p.kind === 'gig' ? 'GIG COPY' : 'MASTER', `REVISION ${p.revision}`, p.status === 'ready' ? 'READY TO ADVANCE' : 'DRAFT', ...(state === 'session-only' ? ['NOT SAVED'] : state === 'failed' ? ['NOT SAVED YET'] : [])].join(' · ')}
              </Text>
              <View style={styles.rowButtons}>
                <Button label="OPEN" tone="primary" onPress={() => onOpen(p, state)} a11yLabel={`Open ${spProjectName(p)}`} />
                <Button label="MORE" onPress={() => openMenu(p)} a11yLabel={`More for ${spProjectName(p)}${p.kind === 'gig' ? ' (gig copy)' : ''}: rename, duplicate, delete`} />
              </View>
            </RowCard>
          );
        })}
      </Section>

      <HelpTip
        title="A master and a gig copy"
        body="Keep one master for your band: the stage plot you bring to every show. For each show, use DUPLICATE FOR A GIG and put that venue’s details in the copy. A change in a gig copy never changes the master, and a change in the master never changes a copy you already made."
      />

      <Sheet visible={!!menu} title={menu ? spProjectName(menu) : ''} onClose={closeMenu}>
        {menu && !gigForm ? (
          <>
            <TextField label="Band or artist name" value={draft.band} onCommit={(band) => setDraft((d) => ({ ...d, band }))} onChange={(band) => setDraft((d) => ({ ...d, band }))} />
            <TextField
              label="Title of this stage plot"
              value={draft.title}
              onCommit={(title) => setDraft((d) => ({ ...d, title }))}
              onChange={(title) => setDraft((d) => ({ ...d, title }))}
              hint="Optional. For example: Club set, Festival set."
            />
            <Button label="RENAME" tone="primary" onPress={rename} a11yLabel="Save the new name" />
            <View style={styles.rule} />
            {full ? <Note tone="warning">{CAP_LINE}</Note> : null}
            <Button label="DUPLICATE" disabled={full} onPress={() => duplicate('master')} a11yLabel="Duplicate this stage plot" />
            <Text style={styles.quiet}>A separate copy of everything. It starts again at revision 1.</Text>
            <Button label="DUPLICATE FOR A GIG" disabled={full} onPress={() => setGigForm(true)} a11yLabel="Duplicate this stage plot for one gig" />
            <Text style={styles.quiet}>A copy for one venue. This stage plot is not changed by it.</Text>
            <View style={styles.rule} />
            <Button label="DELETE" tone="danger" onPress={() => askDelete(menu)} a11yLabel={`Delete ${spProjectName(menu)}`} />
          </>
        ) : null}
        {menu && gigForm ? (
          <>
            <Text style={styles.body}>
              A gig copy of “{spProjectName(menu)}”. Everything is copied. What you change in the copy stays in the copy.
            </Text>
            <TextField label="Venue" value={draft.venue} onCommit={(venue) => setDraft((d) => ({ ...d, venue }))} onChange={(venue) => setDraft((d) => ({ ...d, venue }))} hint="Optional. You can type it later, in Setup." />
            <TextField
              label="Event date"
              value={draft.date}
              onCommit={(date) => setDraft((d) => ({ ...d, date }))}
              onChange={(date) => setDraft((d) => ({ ...d, date }))}
              placeholder="2026-12-05"
              hint="Optional. Year first, or the month as a word: 2026-12-05, or Dec 5, 2026."
            />
            {draft.date.trim() ? <Text style={styles.quiet}>{gigDay ? `Read as ${spDateWords(gigDay)}.` : `Not read as a date yet. ${DATE_HOW}`}</Text> : null}
            <Button label="MAKE THE GIG COPY" tone="primary" onPress={() => duplicate('gig')} />
            <Button label="BACK" onPress={() => setGigForm(false)} a11yLabel="Back to rename, duplicate and delete" />
          </>
        ) : null}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 18 },
  lead: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary },
  quiet: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSub },
  tags: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, lineHeight: 17, letterSpacing: 0.8, color: colors.textSub },
  rowButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  rule: { height: 1, backgroundColor: '#232329' },
});

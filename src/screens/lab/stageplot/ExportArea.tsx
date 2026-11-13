/**
 * ExportArea — the fifth work area of the Stage Plot and Channel Designer
 * (must-do D60): see the packet, see what is still open, and get it out of
 * the app (handoff §7, §8).
 *
 * ONE SNAPSHOT FOR EACH OUTPUT. Every button below first saves the stage
 * plot (`ed.flush()`), then freezes it as it is at that moment
 * (`spBuildSnapshot`), makes ONE document from that frozen copy
 * (`spBuildDoc`) and makes every page from that document. An edit made
 * while a PDF is being written cannot reach its pages; it belongs to the
 * next revision (`spAfterExport`).
 *
 * AN EXPORT CHANGES ONE THING: it marks the revision as shared, so the next
 * real edit moves the revision number on. No other field of the stage plot
 * is touched from here. The paper size and the packet kind are choices of
 * this area, not saved data.
 *
 * EACH ACTION SAYS WHAT HAPPENED, IN ITS OWN LINE, and only what this app can
 * know. A share menu that opened is "opened": the app is never told whether
 * the person sent anything, so it never says "sent". A line stays until the
 * same button is pressed again or the revision moves on.
 *
 * NOTHING IS LOST ON A TAB CHANGE. The shell shows one area at a time, so
 * the PDF that was made, the edited message, the two choices and the lines
 * are held outside this component (export/exportSession.ts), for the open
 * stage plot.
 *
 * THE SAME PDF EVERYWHERE. A phone and a browser both get the pages from the
 * app's own PDF writer (features/stageplot/spExport.ts). In a browser, PRINT
 * only OPENS the print view; printing is a second, deliberate press inside
 * it (a browser's print call stops the page until its dialog is closed).
 *
 * EMAIL. The app has no mail composer (a native package: it waits for a
 * store build [MD:D60]). So the suggested message is copied for pasting and
 * the PDF goes through the phone's share menu, where the person picks their
 * mail app. In a browser the PDF is downloaded and the person attaches it.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { spDeviceCountWord, spInputSupplier, spSummary, spTextSummary, type SpBySupplier, type SpSummary } from '../../../features/stageplot/spDerive';
import type { SpDoc } from '../../../features/stageplot/spDocTypes';
import {
  SP_IS_WEB,
  spCanCopy,
  spCanDownloadPdf,
  spCanMakePdf,
  spCanPrintNative,
  spCanShareFile,
  spCopy,
  spDownloadPdf,
  spMakePdf,
  spPrintNative,
  spSharePdf,
  type SpFramePrintOutcome,
  type SpPdfVia,
} from '../../../features/stageplot/spExport';
import { SP_PACKET_WORD, SP_PAPER_WORD, spAfterExport, spBuildDoc, spBuildSnapshot, spDocText, spEmailText, spShownContact } from '../../../features/stageplot/spPacket';
import { SP_PAGES, spPacketHtml } from '../../../features/stageplot/spPacketHtml';
import { spCanExport } from '../../../features/stageplot/spReview';
import type { SpDeviceType, SpPacketKind, SpPaper, SpProject, SpSnapshot } from '../../../features/stageplot/spTypes';
import { useInFlightLatch, useLatchedPress } from '../../../lib/latch';
import { cardColumn } from '../../../theme/readingColumn';
import { colors, fonts } from '../../../theme/tokens';
import { spExportSession, spPatchExportSession, type SpExportLine, type SpExportSession, type SpExportTone, type SpKeptPdf } from './export/exportSession';
import { PacketPreview } from './export/PacketPreview';
import { WebPrintView } from './export/WebPrintView';
import { useSpEditor } from './spContext';
import { Button, Choice, Count, IssueList, Note, Section, TextField } from './spForm';
import { goToIssue, runIssueAction } from './spIssueActions';

const PACKETS: readonly { value: SpPacketKind; label: string }[] = [
  { value: 'full', label: SP_PACKET_WORD.full },
  { value: 'plot', label: SP_PACKET_WORD.plot },
  { value: 'compact', label: SP_PACKET_WORD.compact },
];
const PAPERS: readonly { value: SpPaper; label: string }[] = [
  { value: 'letter', label: SP_PAPER_WORD.letter },
  { value: 'a4', label: SP_PAPER_WORD.a4 },
];
const VIEWS: readonly { value: 'pages' | 'text'; label: string }[] = [
  { value: 'pages', label: 'Pages' },
  { value: 'text', label: 'Text only' },
];

const BROKEN = 'A link in this stage plot points at something that is missing, so a complete packet cannot be made. Open the first item of the REVIEW list and choose again what that row belongs to.';
const NOT_MADE = 'The packet could not be made from this stage plot. Nothing in your stage plot was changed. Try again.';
const NO_PDF = 'This version of the app cannot print or make a PDF on this device. COPY TECHNICAL SUMMARY and the text view still work.';
const NO_PRINT = 'This version of the app cannot open the print dialog on this device. SHARE PDF still makes the file.';
const NO_COPY = 'This version of the app cannot copy text on this device.';
const NOT_SENT = 'This app cannot tell whether you sent it, or to whom.';
const VIA_WORDS: Record<SpPdfVia, string> = {
  writer: 'Made by this app’s own PDF writer.',
  html: 'Made by this phone’s own converter, because the file from this app’s PDF writer could not be saved.',
};

/** THE one plural helper of this area: "1 input channel", "2 input channels". */
const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;
const word = (n: number, one: string, many = `${one}s`): string => (n === 1 ? one : many);

/** Who brings the listed equipment, added up from the same lines the packet prints. */
function supplierSplit(p: SpProject, s: SpSummary): SpBySupplier {
  const t: SpBySupplier = { band: 0, venue: 0, other: 0, tbc: 0 };
  const add = (b: SpBySupplier) => {
    t.band += b.band;
    t.venue += b.venue;
    t.other += b.other;
    t.tbc += b.tbc;
  };
  for (const l of [...s.microphoneLines, ...s.wirelessLines, ...s.stands]) add(l.bySupplier);
  add(s.di.devicesBySupplier);
  for (const k of Object.keys(s.monitors.devicesBySupplier) as SpDeviceType[]) add(s.monitors.devicesBySupplier[k]);
  for (const e of p.extras) t[e.supplier] += e.qty;
  for (const i of p.inputs) if (i.capture === 'line' || i.capture === 'custom') t[spInputSupplier(p, i)] += 1;
  return t;
}

export function ExportArea() {
  const ed = useSpEditor();
  const { project } = ed;
  const edRef = useRef(ed);
  edRef.current = ed;

  // What this area remembers lives outside it, so a tab change loses nothing.
  const projectId = project.id;
  const unit = project.stage.unit;
  const start = (): SpExportSession => ({ packet: 'full', paper: unit === 'm' ? 'a4' : 'letter', mail: null, kept: null, said: {} });
  const [session, setSession] = useState<SpExportSession>(() => spExportSession(projectId, start));
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  /** Change what is remembered. The store is written even when this area is
   *  no longer on screen (a PDF can finish after a tab change). */
  const patch = (change: Partial<SpExportSession>) => {
    const next = spPatchExportSession(projectId, change, start);
    if (alive.current) setSession(next);
  };
  const say = (line: SpExportLine, tone: SpExportTone, text: string, more: { a11y?: string; revision?: number } = {}) => {
    const said = { ...spExportSession(projectId, start).said };
    said[line] = { tone, text, a11y: more.a11y, revision: more.revision ?? edRef.current.project.revision };
    patch({ said });
  };

  const { packet, paper, kept } = session;
  const [view, setView] = useState<'pages' | 'text'>('pages');
  const [printView, setPrintView] = useState(false);
  // where the lines about the PDF are shown: beside the button that was pressed
  const [pdfAt, setPdfAt] = useState<'main' | 'email'>('main');

  const canExport = spCanExport(project);
  const what = `${SP_PACKET_WORD[packet]}, ${SP_PAPER_WORD[paper]}`;

  /** The document on screen: one snapshot of the stage plot as it is now. */
  const shown = useMemo<{ snap: SpSnapshot; doc: SpDoc } | null>(() => {
    try {
      const snap = spBuildSnapshot(project, { paper, packet }, Date.now());
      return { snap, doc: spBuildDoc(snap) };
    } catch {
      return null;
    }
  }, [project, paper, packet]);
  const shownRef = useRef(shown);
  shownRef.current = shown;
  const summary = useMemo(() => spSummary(project), [project]);
  const suggested = useMemo(() => spEmailText(project), [project]);
  const message = session.mail ?? suggested;
  const printHtml = useMemo(() => (SP_IS_WEB && printView && shown ? spPacketHtml(shown.doc) : null), [printView, shown]);

  /** Save, then freeze the stage plot for ONE output. Null (and the reason,
   *  in that output's own line) when a packet cannot be made. */
  const begin = (line: SpExportLine): { snap: SpSnapshot; doc: SpDoc } | null => {
    // the latest edit is saved before the snapshot is taken
    edRef.current.flush();
    const p = edRef.current.project;
    if (!spCanExport(p)) {
      say(line, 'warning', BROKEN);
      return null;
    }
    try {
      const snap = spBuildSnapshot(p, { paper, packet }, Date.now());
      return { snap, doc: spBuildDoc(snap) };
    } catch {
      say(line, 'warning', NOT_MADE);
      return null;
    }
  };

  /** After an output that left the app: the revision is marked as shared,
   *  and nothing else changes. `packetMade` = a packet (not only the short
   *  summary) was made from the revision the editor still shows. */
  const finish = (snap: SpSnapshot, packetMade: boolean) => {
    const now = edRef.current;
    // `apply` runs the change before it returns, on the stage plot as it is
    // NOW (it may have been edited in another area while the output was made)
    let untouched = false;
    now.apply((p) => {
      const next = spAfterExport(p, snap);
      untouched = next.revision === snap.project.revision;
      return next;
    });
    if (packetMade && untouched) now.markExported();
  };

  // one output at a time: two PDF writers must not run together
  const latch = useInFlightLatch();

  const makePdf = async (): Promise<SpKeptPdf | null> => {
    const b = begin('pdf');
    if (!b) return null;
    const revision = b.snap.project.revision;
    say('pdf', 'plain', 'Making the PDF. A long packet can take a moment.', { revision });
    const r = await spMakePdf(b.doc);
    if (r.state === 'made') {
      finish(b.snap, true);
      const file: SpKeptPdf = { ...r.file, what };
      patch({ kept: file });
      const text = `PDF made: ${file.fileName}${file.pages ? ` (${plural(file.pages, 'page')})` : ''}. It is kept in this app, so you can share it again.`;
      say('pdf', 'good', text, { revision, a11y: `${text} ${VIA_WORDS[file.via]}` });
      return file;
    }
    say('pdf', 'warning', r.state === 'unavailable' ? NO_PDF : 'The PDF could not be made. Nothing in your stage plot was changed. Try again.', { revision });
    return null;
  };

  const shareFile = async (file: SpKeptPdf) => {
    const r = await spSharePdf(file);
    const revision = file.revision;
    if (r === 'opened') say('share', 'plain', `Your phone’s share menu was opened with ${file.fileName}. ${NOT_SENT} The PDF is still kept here.`, { revision });
    else if (r === 'no-target') say('share', 'warning', 'No app on this device can receive the file. The PDF is still kept here.', { revision });
    else if (r === 'unavailable') say('share', 'warning', 'This version of the app cannot open your phone’s share menu on this device. The PDF was made and is kept here. PRINT can also save it as a file.', { revision });
    else say('share', 'warning', 'Your phone’s share menu could not be opened. The PDF is still kept here: press SHARE THE SAME PDF AGAIN.', { revision });
  };

  const onPrint = useLatchedPress(async () => {
    if (SP_IS_WEB) {
      // In a browser this press only SHOWS the print view. Printing is the
      // PRINT THIS VIEW button inside it: nothing prints by itself.
      if (!canExport || !shown) {
        say('print', 'warning', canExport ? NOT_MADE : BROKEN);
        return;
      }
      edRef.current.flush();
      setPrintView(true);
      say('print', 'plain', 'The print view is open below. Press PRINT THIS VIEW in it to print.');
      return;
    }
    const b = begin('print');
    if (!b) return;
    const revision = b.snap.project.revision;
    say('print', 'plain', 'Preparing the pages for the print dialog.', { revision });
    const r = await spPrintNative(b.doc);
    const a11y = (text: string) => (r.via ? { revision, a11y: `${text} ${VIA_WORDS[r.via]}` } : { revision });
    if (r.outcome === 'sent' || r.outcome === 'opened') finish(b.snap, true);
    if (r.outcome === 'sent') {
      const text = 'The print dialog finished: the pages were handed to the printer or the place you chose there.';
      say('print', 'good', text, a11y(text));
    } else if (r.outcome === 'opened') {
      const text = 'The print dialog was opened. This app cannot tell whether a page was printed.';
      say('print', 'plain', text, a11y(text));
    } else if (r.outcome === 'canceled') say('print', 'plain', 'Printing was canceled. Nothing was printed.', { revision });
    else if (r.outcome === 'unavailable') say('print', 'warning', NO_PRINT, { revision });
    else say('print', 'warning', 'The pages could not be prepared for printing. Nothing in your stage plot was changed. Try again.', { revision });
  }, latch);

  /** Web: PRINT THIS VIEW was pressed in the print view. */
  const onFramePrinted = (outcome: SpFramePrintOutcome) => {
    const s = shownRef.current;
    if (outcome === 'opened' && s) {
      finish(s.snap, true);
      say('print', 'plain', 'The browser’s print dialog was asked for. This app cannot tell whether a page was printed. To keep a file, choose “Save as PDF” there, or press DOWNLOAD PDF.', { revision: s.snap.project.revision });
    } else say('print', 'warning', 'The browser did not open its print dialog. Press DOWNLOAD PDF and print that file.');
  };

  const onSharePdf = useLatchedPress(async () => {
    setPdfAt('main');
    const file = await makePdf();
    if (file) await shareFile(file);
  }, latch);

  const onShareAgain = useLatchedPress(async () => {
    setPdfAt('main');
    const file = spExportSession(projectId, start).kept;
    if (file) await shareFile(file);
  }, latch);

  const download = (): boolean => {
    const b = begin('download');
    if (!b) return false;
    const revision = b.snap.project.revision;
    const r = spDownloadPdf(b.doc);
    if (r === 'started') {
      finish(b.snap, true);
      say('download', 'good', `The download of ${b.doc.fileName} was started. Look in your browser’s downloads. To email it, attach that file in your own email.`, { revision });
      return true;
    }
    say('download', 'warning', r === 'unavailable' ? 'This browser cannot save a file from here. Press PRINT and choose “Save as PDF” in the browser’s dialog.' : 'The PDF could not be made. Nothing in your stage plot was changed. Try again, or press PRINT.', { revision });
    return false;
  };
  const onDownload = useLatchedPress(() => {
    setPdfAt('main');
    download();
  }, latch);

  const onCopySummary = useLatchedPress(async () => {
    const b = begin('summary');
    if (!b) return;
    const revision = b.snap.project.revision;
    const r = await spCopy(spTextSummary(b.snap.project));
    if (r === 'copied') {
      finish(b.snap, false);
      say('summary', 'good', 'The technical summary was copied. Paste it into a message.', { revision });
    } else say('summary', 'warning', r === 'unavailable' ? `${NO_COPY} Choose “Text only” in PREVIEW, then select the text and copy it yourself.` : 'The summary could not be copied. Try again.', { revision });
  }, latch);

  const copyMessage = async (): Promise<boolean> => {
    const m = spExportSession(projectId, start).mail ?? spEmailText(edRef.current.project);
    const r = await spCopy(`Subject: ${m.subject}\n\n${m.body}`);
    if (r === 'copied') {
      say('message', 'good', 'Your message was copied. Paste it into your email. Nothing was sent.');
      return true;
    }
    say('message', 'warning', r === 'unavailable' ? `${NO_COPY} You can select the message above and copy it yourself.` : 'The message could not be copied. Try again.');
    return false;
  };
  const onCopyMessage = useLatchedPress(async () => {
    await copyMessage();
  }, latch);
  const onMessageAndPdf = useLatchedPress(async () => {
    setPdfAt('email');
    await copyMessage();
    if (SP_IS_WEB) {
      download();
      return;
    }
    const file = await makePdf();
    if (file) await shareFile(file);
  }, latch);

  const off = !canExport || !shown;
  // the full reason is said once, at the top of the section; a button names it briefly
  const offWhy = 'A packet cannot be made right now. The reason is at the top of this section.';
  const h = summary.house;
  const m = summary.monitors;
  const split = supplierSplit(project, summary);
  const devices = (Object.keys(m.devices) as SpDeviceType[]).filter((t) => m.devices[t] > 0).map((t) => spDeviceCountWord(t, m.devices[t]));
  const contact = spShownContact(project);
  const contactShown = [contact.name ? 'name' : '', contact.role ? 'role' : '', contact.email ? 'email' : '', contact.phone ? 'phone' : ''].filter(Boolean);
  const stampWhy = !shown?.doc.stamp
    ? null
    : project.status === 'draft'
      ? 'This packet is stamped DRAFT because the status is Draft. You can change the status in SETUP. A draft can still be printed and shared.'
      : 'This packet is stamped DRAFT because something must be corrected. It is at the top of the REVIEW list.';
  /** The last line a button said, while the revision it spoke of is the one on screen. */
  const line = (id: SpExportLine) => {
    const s = session.said[id];
    if (!s || s.revision !== project.revision) return null;
    return (
      <View accessible accessibilityLiveRegion="polite" accessibilityLabel={s.a11y ?? s.text}>
        <Note tone={s.tone}>{s.text}</Note>
      </View>
    );
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={[cardColumn, styles.column]}>
        <Section title="WHAT TO MAKE" hint="These two choices are for the packet you make now. They are not saved in your stage plot.">
          <Choice label="Packet" value={packet} options={PACKETS} onChange={(v) => patch({ packet: v })} hint="The compact packet leaves out what the plot and the other tables already say, and forces no page break. The text is never made smaller." />
          <Choice label="Paper" value={paper} options={PAPERS} onChange={(v) => patch({ paper: v })} />
          {shown ? <Note>{`File name: ${shown.doc.fileName}`}</Note> : null}
          <Note>{`Contact shown in the packet: ${contactShown.join(', ') || 'none'}. Change it in SETUP.`}</Note>
          <Button label="GO TO SETUP" onPress={() => ed.goTo('setup')} a11yLabel="Go to Setup to choose which contact details the packet shows" />
        </Section>

        <Section title="REQUIREMENTS SUMMARY" hint="Worked out from your stage, inputs and monitors. Nothing here is typed in.">
          <View style={styles.counts}>
            <Count value={h.channels} label={`${word(h.channels, 'input channel')} to the house system`} />
            <Count value={summary.microphones} label={word(summary.microphones, 'microphone')} />
            <Count value={summary.di.channels} label={word(summary.di.channels, 'DI channel')} />
            <Count value={summary.di.devices} label={word(summary.di.devices, 'DI device')} />
            <Count value={m.all.mixes} label={word(m.all.mixes, 'monitor mix', 'monitor mixes')} />
            <Count value={m.house.channels} label={`${word(m.house.channels, 'monitor feed audio channel')} asked of the house`} />
          </View>
          <Note>
            <View style={styles.noteLines}>
              <Text style={styles.noteText}>{`Inputs: ${h.audience} for the audience mix, ${h.monitorOnly} monitor only${h.audienceTbc ? `, ${h.audienceTbc} to be confirmed` : ''}.${summary.band ? ` The band monitor rig takes ${plural(summary.band.channels, 'input channel')}.` : ''}`}</Text>
              <Text style={styles.noteText}>{summary.di.summary}</Text>
              <Text style={styles.noteText}>{`Asked of the house console: ${plural(m.house.mixes, 'mix', 'mixes')}, ${plural(m.house.channels, 'audio channel')}.${m.bandOwned.mixes ? ` Apart from that, your band creates ${plural(m.bandOwned.mixes, 'mix', 'mixes')} in its own rig.` : ''}${m.byProvider.tbc.mixes ? ` For ${plural(m.byProvider.tbc.mixes, 'mix', 'mixes')}, who creates the mix is to be confirmed.` : ''}`}</Text>
              {devices.length ? <Text style={styles.noteText}>{`Monitor devices: ${devices.join(', ')}.`}</Text> : null}
              <Text style={styles.noteText}>{`Items the band brings: ${split.band}. Items asked of the venue: ${split.venue}.${split.other ? ` Items from another provider: ${split.other}.` : ''} Items to be confirmed: ${split.tbc}.`}</Text>
            </View>
          </Note>
          {summary.open.length ? <Note tone="warning">{`${plural(summary.open.length, 'detail is', 'details are')} still to be confirmed. The packet prints each one as unresolved. Nothing is filled in for you.`}</Note> : null}
        </Section>

        <Section title="REVIEW" hint="Answer what you can. What you leave is printed in the packet as unresolved. Review prepares your document; it does not mean the venue has agreed.">
          <IssueList issues={ed.issues} onGoTo={(i) => goToIssue(ed, i)} onAction={(i, a) => runIssueAction(ed, i, a)} empty="Nothing to review. The packet lists no open question." />
          {stampWhy ? <Note tone="warning">{stampWhy}</Note> : shown ? <Note tone="good">This revision is “Ready to advance”: your document is prepared for discussion with the venue. It is not stamped DRAFT.</Note> : null}
        </Section>

        <Section title="PREVIEW" hint="Every row and every note of the packet, from the same document the PDF is made from. On a phone a table row is set as a small block so it can be read.">
          <Choice label="Show the packet as" value={view} options={VIEWS} onChange={setView} hint="“Text only” is the whole packet as plain text, for a screen reader or for copying it yourself." />
          {!shown ? (
            <Note tone="warning">{canExport ? NOT_MADE : BROKEN}</Note>
          ) : view === 'pages' ? (
            <PacketPreview doc={shown.doc} />
          ) : (
            <Text style={styles.textView} selectable>
              {spDocText(shown.doc)}
            </Text>
          )}
        </Section>

        <Section title="PRINT, SHARE AND SAVE" hint={`Each button makes the packet you chose above (${what}) from your stage plot as it is at that moment. A line under the button says what happened.`}>
          {off ? <Note tone="warning">{canExport ? NOT_MADE : BROKEN}</Note> : null}
          {!SP_IS_WEB && !spCanMakePdf() ? <Note tone="warning">{NO_PDF}</Note> : null}

          <Button label="PRINT" tone="primary" onPress={onPrint} disabled={off || (!SP_IS_WEB && !spCanPrintNative())} disabledReason={off ? offWhy : NO_PRINT} a11yLabel={SP_IS_WEB ? 'Open the print view of the packet' : 'Open the print dialog with the packet'} />
          {SP_IS_WEB ? <Text style={styles.caption}>PRINT opens the print view here. You print from it with a second press; the browser’s own dialog opens then, and “Save as PDF” there makes a file.</Text> : null}
          {line('print')}
          {SP_IS_WEB && printHtml ? <WebPrintView html={printHtml} pageWidthPt={SP_PAGES[paper].w} onPrinted={onFramePrinted} onClose={() => setPrintView(false)} /> : null}

          {SP_IS_WEB ? (
            <>
              <Button label="DOWNLOAD PDF" tone="primary" onPress={onDownload} disabled={off || !spCanDownloadPdf()} disabledReason={off ? offWhy : 'This browser cannot save a file from here. Press PRINT and choose “Save as PDF” in the browser’s dialog.'} a11yLabel="Download the packet as a PDF file" />
              {pdfAt === 'main' ? line('download') : null}
              <Note>In a browser this app cannot hand a file to your mail app. Download the PDF, then attach it in your own email.</Note>
            </>
          ) : (
            <>
              <Button label="SHARE PDF" tone="primary" onPress={onSharePdf} disabled={off || !spCanMakePdf()} disabledReason={off ? offWhy : NO_PDF} a11yLabel="Make the PDF and open your phone’s share menu with it" />
              {pdfAt === 'main' ? line('pdf') : null}
              {pdfAt === 'main' ? line('share') : null}
              {kept ? (
                <>
                  <Note>
                    {kept.revision === project.revision
                      ? `Kept PDF: ${kept.fileName}, revision ${kept.revision} (${kept.what}). If you closed the share menu, the file is still here.`
                      : `Kept PDF: ${kept.fileName}, revision ${kept.revision}. Your stage plot is now at revision ${project.revision}. Press SHARE PDF to make the PDF of this revision.`}
                  </Note>
                  <Button label="SHARE THE SAME PDF AGAIN" onPress={onShareAgain} disabled={!spCanShareFile()} disabledReason="This version of the app cannot open your phone’s share menu on this device." a11yLabel={`Open your phone’s share menu again with ${kept.fileName}`} />
                </>
              ) : null}
            </>
          )}

          <Button label="COPY TECHNICAL SUMMARY" onPress={onCopySummary} disabled={off || !spCanCopy()} disabledReason={off ? offWhy : NO_COPY} a11yLabel="Copy a short technical summary as plain text" />
          {line('summary')}
        </Section>

        <Section
          title="EMAIL"
          hint={
            SP_IS_WEB
              ? 'This tool does not send email. It copies your message and downloads the PDF. You attach the file and paste the message in your own email.'
              : 'This tool does not send email. It copies your message and opens your phone’s share menu with the PDF. You choose your mail app there and paste the message.'
          }
        >
          <TextField label="Subject" value={message.subject} onCommit={(subject) => patch({ mail: { ...message, subject } })} onChange={(subject) => patch({ mail: { ...message, subject } })} />
          <TextField label="Message" value={message.body} multiline onCommit={(body) => patch({ mail: { ...message, body } })} onChange={(body) => patch({ mail: { ...message, body } })} hint="A suggestion. Change any of it. It names only the contact details you chose to show in SETUP." />
          {session.mail ? <Button label="USE THE SUGGESTED TEXT AGAIN" onPress={() => patch({ mail: null })} a11yLabel="Replace your message with the suggested subject and message" /> : null}
          <Button label="COPY THE MESSAGE" onPress={onCopyMessage} disabled={!spCanCopy()} disabledReason={NO_COPY} a11yLabel="Copy the subject and the message" />
          <Button
            label={SP_IS_WEB ? 'COPY THE MESSAGE AND DOWNLOAD THE PDF' : 'COPY THE MESSAGE AND SHARE THE PDF'}
            tone="primary"
            onPress={onMessageAndPdf}
            disabled={off || (SP_IS_WEB ? !spCanDownloadPdf() : !spCanMakePdf())}
            disabledReason={off ? 'A packet cannot be made right now. The reason is at the top of PRINT, SHARE AND SAVE.' : SP_IS_WEB ? 'This browser cannot save a file from here.' : NO_PDF}
            a11yLabel={SP_IS_WEB ? 'Copy the message, then download the PDF to attach' : 'Copy the message, then make the PDF and open your phone’s share menu'}
          />
          {line('message')}
          {pdfAt === 'email' ? line('download') : null}
          {pdfAt === 'email' ? line('pdf') : null}
          {pdfAt === 'email' ? line('share') : null}
        </Section>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 48 },
  column: { gap: 22 },
  counts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  noteLines: { gap: 6 },
  noteText: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19.5, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textSub },
  textView: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textPrimary },
});

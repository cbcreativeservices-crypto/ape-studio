/**
 * StagePlotLabScreen — the STAGE PLOT AND CHANNEL DESIGNER (must-do D60;
 * owner GO 2026-11-12). A band draws its stage, connects performers and
 * instruments to a channel list, plans its monitors, and makes a packet for a
 * venue's sound engineer.
 *
 * Two faces of one screen:
 *   • THE LIBRARY (ProjectLibrary): start a stage plot, or return to one.
 *   • THE EDITOR of one project (spContext): five work areas on a tab bar,
 *     Setup · Stage · Inputs · Monitors · Export. They are views of ONE
 *     project, so they can be opened in any order and never disagree. The
 *     tab bar is not a sequence: nothing is locked, nothing has to be done
 *     first. A tab carries a small mark while the review has a question for
 *     that area.
 *
 * Above the tabs, in every area: the way back to the library, the revision
 * and status ("Revision 2 · Draft"), where the work stands ("Saved on this device"
 * only from a write the device accepted), and UNDO / REDO.
 *
 * WHO IS SAVED (house guest rule): the tier decides, through useTier(). A
 * real account's work is written to the device; a guest's, and an account
 * still being checked, is kept for this session and held for a sign-in later
 * in the same session; a preview's is kept for the session only. The lab
 * says which, in words about stage plots (the library's note, the bar), and
 * the house GuestStartReminder is mounted on the library (AGENTS.md: the one
 * way a guest is told work is not saved; one popup per activity per session).
 * The reminder's shared wording speaks of "progress"; a wording for saved documents would need a new kind in the shared rules file, which is the owner's call [MD:D60].
 * Android BACK in the editor returns to the library; the header ‹ always
 * leaves the lab, and both save first.
 *
 * NOT LISTED YET [MD:D60]: this screen is reachable only from the web
 * preview (`#labpreview/StagePlotLab`). Putting it in the Labs menu is a
 * change to the navigator, the lab catalog and their tests, done in one pass
 * for the whole lab.
 *
 * Each work area is hosted in a box that fills the rest of the screen, with
 * no padding and no scrolling of the host's own: an area owns its layout
 * (Stage is a Rack Unit; the others scroll themselves).
 */
import { Component, useCallback, useMemo, useState, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { holdAllowed, persistAllowed } from '../../../features/commercial/tier';
import { useTier } from '../../../features/commercial/useTier';
import { GlossaryLinkProvider } from '../../../features/glossary/glossaryLink';
import { GuestStartReminder } from '../../../features/lab/GuestStartReminder';
import { ScreenGuideHost } from '../../../features/lab/screenGuide';
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';
import { setSpSaveMode, spProjectName, type SpSaveMode } from '../../../features/stageplot/spStore';
import { captureError } from '../../../features/telemetry/telemetry';
import type { SpProject } from '../../../features/stageplot/spTypes';
import { confirmDialog } from '../../../lib/confirm';
import { useBackWhileFocused } from '../../../lib/useBackWhileFocused';
import { fitValue } from '../../../theme/legibility';
import { cardColumn } from '../../../theme/readingColumn';
import { colors, fonts } from '../../../theme/tokens';
import { LabHeader } from '../kit/LabNavBar';
import { ExportArea } from './ExportArea';
import { SP_GUIDE_EXPORT } from './guides/export';
import { SP_GUIDE_INPUTS } from './guides/inputs';
import { SP_GUIDE_LIBRARY } from './guides/library';
import { SP_GUIDE_MONITORS } from './guides/monitors';
import { SP_GUIDE_SETUP } from './guides/setup';
import { SP_GUIDE_STAGE } from './guides/stage';
import { InputsArea } from './InputsArea';
import { MonitorsArea } from './MonitorsArea';
import { ProjectLibrary } from './ProjectLibrary';
import { SetupArea } from './SetupArea';
import { SP_AREAS, SpEditorProvider, useSpEditor, type SpAreaId, type SpSaveState } from './spContext';
import { setSpIssueAsk } from './spIssueActions';
import { StageArea } from './StageArea';

const TITLE = 'STAGE PLOT AND CHANNEL DESIGNER';
export const STAGE_PLOT_LAB_KEY = 'stageplot';

// A review answer that would renumber a revision that may have been sent asks first,
// with the house popup (spIssueActions is a pure file and cannot import it).
setSpIssueAsk((title, body, yesText, yes) => confirmDialog(title, body, yesText, yes));

const GUIDES: Record<SpAreaId, ScreenGuide> = {
  setup: SP_GUIDE_SETUP,
  stage: SP_GUIDE_STAGE,
  inputs: SP_GUIDE_INPUTS,
  monitors: SP_GUIDE_MONITORS,
  export: SP_GUIDE_EXPORT,
};

/** Where the work stands, in words. The mark only repeats the words. */
const SAVE_WORDS: Record<SpSaveState, string> = {
  saved: '✓ Saved on this device',
  saving: 'Saving…',
  'session-only': 'Not saved: kept only until you close the app',
  failed: '! Not saved',
};

type Open = { project: SpProject; saveState: SpSaveState; at: number };

/**
 * ONE AREA THAT THROWS DOES NOT TAKE THE STAGE PLOT WITH IT. A render error
 * inside a work area (or the list) used to blank the whole lab to an empty
 * page, and a guest's unsaved stage plot was gone after the reload that was
 * then needed (visual review, 2026-11-12). The boundary sits INSIDE the
 * editor, around the area only: the header, the bar and the five tabs stay,
 * the project in the editor is untouched, and `onCaught` saves it as it
 * stands. TRY AGAIN mounts the area fresh; another tab opens as usual (the
 * boundary is keyed by the area).
 *
 * The app's own ScreenErrorBoundary wraps the whole screen from the
 * navigator: it is the next line of defense, and it would replace the bar
 * and the tabs. Reported the same way (captureError), so a contained crash is
 * never a silent one.
 */
class AreaBoundary extends Component<{ what: string; message: string; onCaught?: () => void; children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error): { error: Error | null } {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureError(error, { boundary: 'stageplot-area', area: this.props.what });
    console.error(`[stageplot] the ${this.props.what} area stopped:`, error, info.componentStack);
    try {
      this.props.onCaught?.();
    } catch {
      // saving what is in the editor must never be a second failure here
    }
  }

  private again = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <View style={styles.stopped} accessibilityLiveRegion="polite">
        <Text style={styles.stoppedTitle} accessibilityRole="header">
          THIS PART COULD NOT BE SHOWN
        </Text>
        <Text style={styles.stoppedText}>{this.props.message}</Text>
        <Pressable onPress={this.again} style={styles.stoppedBtn} accessibilityRole="button" accessibilityLabel="Try again: show this part again">
          <Text style={styles.stoppedBtnText}>TRY AGAIN</Text>
        </Pressable>
        {__DEV__ ? <Text style={styles.stoppedDev}>{String(error.message ?? error)}</Text> : null}
      </View>
    );
  }
}

export function StagePlotLabScreen() {
  const insets = useSafeAreaInsets();
  const tier = useTier();
  // One answer per tier: write, hold for a sign-in, or keep for the session.
  const mode: SpSaveMode = persistAllowed(tier) ? 'write' : holdAllowed(tier) ? 'hold' : 'drop';
  // Told to the store on every render, before anything below can save.
  setSpSaveMode(mode);

  const [open, setOpen] = useState<Open | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const backToLibrary = useCallback(() => {
    setOpen(null);
    return true;
  }, []);
  useBackWhileFocused(open != null, backToLibrary);

  return (
    <GlossaryLinkProvider>
      <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
        {open ? (
          <SpEditorProvider key={`${open.project.id}:${open.at}`} initial={open.project} initialSaveState={open.saveState} mode={mode}>
            <Editor onClose={close} />
          </SpEditorProvider>
        ) : (
          <ScreenGuideHost resetKey="library" regions={false}>
            <LabHeader title={TITLE} subtitle="Your stage plots" guide={SP_GUIDE_LIBRARY} guideTitle="YOUR STAGE PLOTS" />
            <GuestStartReminder activity={`lab:${STAGE_PLOT_LAB_KEY}`} kind="progress" style={styles.guest} />
            <AreaBoundary what="library" message="Your list of stage plots could not be shown. Nothing in it was changed.">
              <ScrollView contentContainerStyle={[styles.libraryScroll, { paddingBottom: 48 + insets.bottom }]} keyboardShouldPersistTaps="handled">
                <View style={cardColumn}>
                  <ProjectLibrary onOpen={(project, saveState) => setOpen({ project, saveState, at: Date.now() })} />
                </View>
              </ScrollView>
            </AreaBoundary>
          </ScreenGuideHost>
        )}
      </View>
    </GlossaryLinkProvider>
  );
}

/** The open project: header, the bar that is in every area, the five tabs,
 *  and the area in view. */
function Editor({ onClose }: { onClose: () => void }) {
  const ed = useSpEditor();
  const area = ed.area;

  // A tab is marked while the review has a question there. "To be confirmed"
  // items are not questions: they are kept and printed as they are.
  const marks = useMemo(() => {
    const out: Record<SpAreaId, { ask: number; must: number }> = { setup: { ask: 0, must: 0 }, stage: { ask: 0, must: 0 }, inputs: { ask: 0, must: 0 }, monitors: { ask: 0, must: 0 }, export: { ask: 0, must: 0 } };
    for (const i of ed.issues) {
      if (i.level === 'open') continue;
      // "There is nothing to send yet" is true of every new, blank stage plot:
      // a mark for it would tell a user who has done nothing that something
      // "must be corrected". It stays in the review list and still refuses
      // Ready; the tab shows no mark until a performer or an input exists.
      if (i.rule === 'empty') continue;
      // Counted apart, so one thing that must be corrected is never also
      // called a question.
      if (i.level === 'block') out[i.area].must += 1;
      else out[i.area].ask += 1;
    }
    return out;
  }, [ed.issues]);

  const tabWord = SP_AREAS.find((a) => a.id === area)?.label ?? '';
  const p = ed.project;
  // The header has two lines at most, so it carries the band's name only; the
  // title is in Setup. With no band name yet, whatever name the plot has.
  // A gig copy says so in the header, in every area: it is not the master.
  // A DUPLICATE says so too (its title ends "(copy)"), so it is not taken
  // for the plot it was copied from (bug test S3-05).
  const headerName = `${p.band.trim() || spProjectName(p)}${p.kind === 'gig' ? ' · gig copy' : /\(copy\)$/i.test(p.title.trim()) ? ' · copy' : ''}`;
  // One word in the bar, so it is never cut at a phone's width; the full
  // words ("Ready to advance") are under Status in Setup and are what a
  // screen reader hears.
  const statusWord = p.status === 'ready' ? 'Ready' : 'Draft';
  const statusSaid = p.status === 'ready' ? 'ready to advance' : 'draft';

  return (
    // Regions only where a Rack Unit registers them (the Stage area).
    // ONE HOST PER AREA (keyed by it): an area's first-visit intro card belongs
    // to that area. It is offered, timed and shown only while the area is
    // open; switching tabs drops a card that is owed or up, unread and not
    // marked seen, so it comes back on the next visit to its own area and is
    // never presented over another one (the Setup card was seen on the Stage
    // tab, 2026-11-13).
    <ScreenGuideHost key={area} resetKey={area} regions={area === 'stage'}>
      <LabHeader title={TITLE} subtitle={headerName} guide={GUIDES[area]} guideTitle={tabWord} />

      <View style={styles.bar}>
        <Pressable onPress={onClose} style={styles.barKey} accessibilityRole="button" accessibilityLabel="Back to all stage plots.">
          <Text style={styles.barKeyText}>‹ ALL PLOTS</Text>
        </Pressable>
        <View style={styles.state}>
          {/* The revision is on screen in every area: the first change after a
              revision was shared moves it on, and the user must see that. */}
          {/* No one-line limit here: a browser cannot shrink a line to fit, it
              cuts it with "…". If it does not fit, it wraps. */}
          <Text style={styles.rev} maxFontSizeMultiplier={1.35} accessibilityLabel={`Revision ${p.revision}, ${statusSaid}.`}>
            Revision {p.revision} · {statusWord}
          </Text>
          <Text style={[styles.save, ed.saveState === 'failed' && styles.saveFailed, ed.saveState === 'session-only' && styles.saveSession]} accessibilityLiveRegion="polite">
            {SAVE_WORDS[ed.saveState]}
          </Text>
        </View>
        <Pressable onPress={ed.undo} disabled={!ed.canUndo} style={[styles.barKey, !ed.canUndo && styles.barKeyOff]} accessibilityRole="button" accessibilityState={{ disabled: !ed.canUndo }} aria-disabled={!ed.canUndo} accessibilityLabel="Undo the last change">
          <Text style={styles.barKeyText}>↶ UNDO</Text>
        </Pressable>
        <Pressable onPress={ed.redo} disabled={!ed.canRedo} style={[styles.barKey, !ed.canRedo && styles.barKeyOff]} accessibilityRole="button" accessibilityState={{ disabled: !ed.canRedo }} aria-disabled={!ed.canRedo} accessibilityLabel="Redo the change you undid">
          <Text style={styles.barKeyText}>REDO ↷</Text>
        </Pressable>
      </View>

      <View style={styles.tabs} accessibilityRole="tablist">
        {SP_AREAS.map((a) => {
          const on = a.id === area;
          const mark = marks[a.id];
          const word = a.label.charAt(0) + a.label.slice(1).toLowerCase();
          const said: string[] = [];
          if (mark.must) said.push(mark.must === 1 ? 'One thing must be corrected' : `${mark.must} things must be corrected`);
          if (mark.ask) said.push(mark.ask === 1 ? 'One review question' : `${mark.ask} review questions`);
          const seen = [mark.must ? `! ${mark.must}` : '', mark.ask ? `? ${mark.ask}` : ''].filter(Boolean).join('  ');
          return (
            <Pressable
              key={a.id}
              onPress={() => ed.goTo(a.id)}
              style={[styles.tab, on && styles.tabOn]}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              aria-selected={on}
              accessibilityLabel={said.length ? `${word}. ${said.join('. ')}.` : word}
            >
              <Text style={[styles.tabText, on && styles.tabTextOn]} {...fitValue(12)} maxFontSizeMultiplier={1.35}>
                {a.label}
              </Text>
              {/* The mark keeps its line when there is none, so the bar never jumps. */}
              <Text style={[styles.tabMark, mark.must > 0 && styles.tabMarkMust]} {...fitValue(12)} maxFontSizeMultiplier={1.35}>
                {seen || ' '}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.body}>
        {/* Keyed by the area: another tab is a fresh boundary, so one area
            that stopped never hides the other four. */}
        <AreaBoundary key={area} what={area} onCaught={ed.flush} message="This part could not be shown. Your stage plot is kept. Press TRY AGAIN, open another area, or go back to ALL PLOTS.">
          {area === 'setup' ? <SetupArea /> : area === 'stage' ? <StageArea /> : area === 'inputs' ? <InputsArea /> : area === 'monitors' ? <MonitorsArea /> : <ExportArea />}
        </AreaBoundary>
      </View>
    </ScreenGuideHost>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  guest: { marginHorizontal: 14, marginBottom: 6 },
  libraryScroll: { paddingHorizontal: 14, paddingTop: 8 },

  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 6 },
  barKey: { minHeight: 44, minWidth: 44, borderRadius: 9, borderWidth: 1, borderColor: '#34343b', backgroundColor: '#141418', paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  barKeyOff: { opacity: 0.4 },
  barKeyText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.textPrimary },
  state: { flex: 1, alignItems: 'center', gap: 1 },
  rev: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.6, color: colors.textSecondary, textAlign: 'center' },
  save: { fontFamily: fonts.barlowMedium, fontSize: 12, lineHeight: 16, color: colors.textSub, textAlign: 'center' },
  saveSession: { color: colors.amber },
  saveFailed: { color: '#ff8a7a' },

  tabs: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.hairlineDim, backgroundColor: colors.screenBgAlt },
  tab: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2, paddingTop: 6, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabOn: { borderBottomColor: colors.amber, backgroundColor: '#17140c' },
  tabText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.6, color: colors.textSub },
  tabTextOn: { color: colors.amber },
  tabMark: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, lineHeight: 15, color: colors.amber },
  tabMarkMust: { color: '#ff8a7a' },

  body: { flex: 1 },

  stopped: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
  stoppedTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.4, color: colors.amber, textAlign: 'center' },
  stoppedText: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, textAlign: 'center', maxWidth: 420 },
  stoppedBtn: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 26, borderRadius: 10, borderWidth: 1, borderColor: colors.amber, backgroundColor: 'rgba(255,198,77,.14)' },
  stoppedBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, color: colors.amber },
  stoppedDev: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textMuted, textAlign: 'center', maxWidth: 420 },
});

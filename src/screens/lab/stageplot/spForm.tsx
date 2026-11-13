/**
 * spForm — the small FORM KIT of the Stage Plot and Channel Designer (must-do
 * D60). One set of fields, chips, rows and popups for all five work areas, so
 * the lab reads as one tool. Dark, amber-accented, the app's tokens.
 *
 * Built for a working musician on a 390-wide phone:
 *   • one clear label per field, the hint under the field, never inside it;
 *   • every target at least 44 pt high; chips WRAP, forms never scroll sideways;
 *   • nothing is told by color alone: a chosen chip shows ✓, a note carries
 *     its mark, a review item carries its word;
 *   • a text field commits when you LEAVE it (blur or submit), with the text
 *     trimmed, and only when the text really changed. So tapping into a field
 *     and out again is never an edit. So that typed text is never lost, it
 *     also commits after 1500 ms without a key, when the app leaves the
 *     foreground, and when the field is taken off the screen;
 *   • CAPITALS for buttons, section titles, sub-headings, badges and tags;
 *     sentence case for chips, switches, field labels, row titles, popup
 *     titles, hints and notes (the lab's one rule);
 *   • what is chosen, on or open is said to a screen reader on every
 *     platform: `accessibilityState` for the phones, the matching `aria-`
 *     prop for the web, and the state word in a switch's label;
 *   • choices are chips and popups, never pulldowns.
 *
 * No text under 9 pt. No "…": a label wraps, a value shrinks (fitValue).
 */
import { Children, createContext, isValidElement, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Modal, useAfterModalsClose } from '../../../components/DimModal';
import { useGlossaryOpener } from '../../../features/glossary/glossaryLink';
import type { SpIssue, SpIssueAction, SpIssueLevel } from '../../../features/stageplot/spReview';
import { fitValue } from '../../../theme/legibility';
import { colors, fonts } from '../../../theme/tokens';
import { spIssueActionLabel } from './spIssueActions';

const DANGER = '#ff8a7a';
const SURFACE = '#101014';
const SURFACE_BORDER = '#232329';
const FIELD_BG = '#0c0c0f';
const FIELD_BORDER = '#2c2c33';
const PLACEHOLDER = '#6b6d76';

type FieldWidth = 'full' | 'half' | 'third';
const WIDTH: Record<FieldWidth, `${number}%`> = { full: '100%', half: '47.5%', third: '30%' };

/* ── layout ─────────────────────────────────────────────────────────────── */

export function Section(p: { title: string; hint?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionHeadText}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            {p.title}
          </Text>
          {p.hint ? <Text style={styles.hint}>{p.hint}</Text> : null}
        </View>
        {p.right ? <View style={styles.sectionRight}>{p.right}</View> : null}
      </View>
      <View style={styles.sectionBody}>{p.children}</View>
    </View>
  );
}

/** A row that WRAPS: put 'half' and 'third' fields in it to seat them side by
 *  side. (An addition to the kit; a field outside it simply takes its width.) */
export function Fields(p: { children: ReactNode }) {
  return <View style={styles.fields}>{p.children}</View>;
}

/* ── text and number fields ─────────────────────────────────────────────── */

const KEYBOARD = { default: 'default', numeric: 'numeric', email: 'email-address', phone: 'phone-pad' } as const;

/** How a field's text reached the project: the field was LEFT (blur, "done",
 *  taken off the screen), or the user only PAUSED in it (see useDraft). A
 *  handler that refuses text ("that date was not understood") can stay quiet
 *  for 'paused': the user may still be typing. */
export type SpCommitHow = 'left' | 'paused';

/** How long without a key before what is typed is put in the project. */
export const SP_FIELD_IDLE_MS = 1500;

/** The draft of one field: what is typed. It is committed when the field is
 *  left (blur, submit, unmount) and, so typed text can never be lost, also
 *  after 1500 ms without a key and when the app leaves the foreground (a long
 *  note typed just before switching to an email is in the project, and saved,
 *  before the phone can end the app). A pause does not end the visit: the
 *  text in the field stays exactly as typed. */
function useDraft(shown: string, commitText: (text: string, how: SpCommitHow) => void) {
  const [text, setText] = useState(shown);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) setText(shown);
  }, [shown, editing]);
  const latest = useRef({ text, editing, commitText });
  latest.current = { text, editing, commitText };
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopIdle = () => {
    if (idle.current) clearTimeout(idle.current);
    idle.current = null;
  };
  const pause = () => {
    stopIdle();
    const l = latest.current;
    if (l.editing) l.commitText(l.text, 'paused');
  };
  const pauseRef = useRef(pause);
  pauseRef.current = pause;
  useEffect(
    () => () => {
      if (idle.current) clearTimeout(idle.current);
      idle.current = null;
      const l = latest.current;
      if (l.editing) l.commitText(l.text, 'left');
    },
    [],
  );
  // Only a field that is being typed in listens for the app going away.
  useEffect(() => {
    if (!editing) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') pauseRef.current();
    });
    return () => sub.remove();
  }, [editing]);
  const begin = () => {
    latest.current.editing = true;
    setEditing(true);
  };
  const commit = () => {
    // ONE commit for one visit to the field: "done" on the keyboard and the
    // blur that follows it are the same leaving, not two.
    if (!latest.current.editing) return;
    stopIdle();
    // Leaving the field ends the draft: the effect above then shows the value
    // as it stands (the new one, or the old one when the text was refused).
    latest.current.editing = false;
    setEditing(false);
    commitText(latest.current.text, 'left');
  };
  const type = (next: string) => {
    if (!latest.current.editing) begin();
    latest.current.text = next;
    setText(next);
    stopIdle();
    idle.current = setTimeout(pause, SP_FIELD_IDLE_MS);
  };
  return { text, setText: type, begin, commit };
}

/** A labeled text input. `onCommit` fires on blur / submit with the trimmed text (not on every key).
 *  It also fires, with `how` = 'paused', after 1500 ms without a key and when the app leaves the foreground. */
export function TextField(p: {
  label: string;
  value: string;
  onCommit: (text: string, how?: SpCommitHow) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboard?: 'default' | 'numeric' | 'email' | 'phone';
  hint?: string;
  width?: FieldWidth;
  /** Addition: every key, for a small form that has its own button. */
  onChange?: (text: string) => void;
}) {
  const { value, onCommit } = p;
  const d = useDraft(value, (raw, how) => {
    const t = raw.trim();
    if (t !== value) onCommit(t, how);
  });
  const keyboard = p.keyboard ?? 'default';
  return (
    <View style={[styles.field, { width: WIDTH[p.width ?? 'full'] }]}>
      <Text style={styles.label}>{p.label}</Text>
      <TextInput
        style={[styles.input, p.multiline && styles.inputMulti]}
        value={d.text}
        onChangeText={(t) => {
          d.setText(t);
          p.onChange?.(t);
        }}
        onFocus={d.begin}
        onBlur={d.commit}
        onSubmitEditing={p.multiline ? undefined : d.commit}
        placeholder={p.placeholder}
        placeholderTextColor={PLACEHOLDER}
        multiline={p.multiline}
        keyboardType={KEYBOARD[keyboard]}
        autoCapitalize={keyboard === 'email' ? 'none' : 'sentences'}
        // Names (a band, a venue, a microphone) are not for the keyboard to
        // "correct"; only the long notes get spelling help.
        autoCorrect={!!p.multiline}
        returnKeyType={p.multiline ? 'default' : 'done'}
        accessibilityLabel={p.hint ? `${p.label}. ${p.hint}` : p.label}
      />
      {p.hint ? <Text style={styles.hint}>{p.hint}</Text> : null}
    </View>
  );
}

/** A labeled whole-number input; '' commits null. */
export function NumberField(p: { label: string; value: number | null; onCommit: (n: number | null) => void; min?: number; max?: number; hint?: string; width?: FieldWidth }) {
  const { value, onCommit, min, max } = p;
  const shown = value == null || !Number.isFinite(value) ? '' : String(Math.round(value));
  const d = useDraft(shown, (raw, how) => {
    const t = raw.trim();
    if (t === shown) return;
    if (t === '') {
      // An emptied field is "no number" only once it is left: after a pause
      // the user is most likely about to type the new one.
      if (how === 'left') onCommit(null);
      return;
    }
    // Whole numbers only; anything else leaves the value as it was.
    if (!/^-?\d+$/.test(t)) return;
    let n = Number(t);
    // A number out of range is brought into range when the field is left,
    // never in the middle of typing it.
    if (how === 'paused' && ((min != null && n < min) || (max != null && n > max))) return;
    if (min != null) n = Math.max(min, n);
    if (max != null) n = Math.min(max, n);
    if (n !== value) onCommit(n);
  });
  return (
    <View style={[styles.field, { width: WIDTH[p.width ?? 'full'] }]}>
      <Text style={styles.label}>{p.label}</Text>
      <TextInput
        style={[styles.input, styles.inputNumber]}
        value={d.text}
        onChangeText={d.setText}
        onFocus={d.begin}
        onBlur={d.commit}
        onSubmitEditing={d.commit}
        keyboardType="number-pad"
        placeholderTextColor={PLACEHOLDER}
        returnKeyType="done"
        accessibilityLabel={p.hint ? `${p.label}. ${p.hint}` : p.label}
      />
      {p.hint ? <Text style={styles.hint}>{p.hint}</Text> : null}
    </View>
  );
}

/* ── choices ────────────────────────────────────────────────────────────── */

/** One choice from a few: chips that wrap; the chosen one shows ✓. */
export function Choice<T extends string>(p: { label: string; value: T; options: readonly { value: T; label: string }[]; onChange: (v: T) => void; hint?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{p.label}</Text>
      {/* One of several: a radio group, so "checked" is a state the role has
          on every platform (a button has no "selected" on the web). */}
      <View style={styles.chips} accessibilityRole="radiogroup" aria-label={p.label}>
        {p.options.map((o) => {
          const on = o.value === p.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => {
                if (!on) p.onChange(o.value);
              }}
              style={[styles.chip, on && styles.chipOn]}
              accessibilityRole="radio"
              accessibilityState={{ selected: on, checked: on }}
              aria-checked={on}
              accessibilityLabel={`${p.label}: ${o.label}`}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{on ? `✓ ${o.label}` : o.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {p.hint ? <Text style={styles.hint}>{p.hint}</Text> : null}
    </View>
  );
}

/** An on/off line with its state as a word. */
export function Switch(p: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <View style={styles.field}>
      <Pressable
        onPress={() => p.onChange(!p.value)}
        style={styles.switchRow}
        accessibilityRole="switch"
        accessibilityState={{ checked: p.value }}
        aria-checked={p.value}
        accessibilityLabel={`${p.label}: ${p.value ? 'on' : 'off'}.${p.hint ? ` ${p.hint}` : ''}`}
      >
        <Text style={styles.switchLabel}>{p.label}</Text>
        <View style={[styles.switchPill, p.value && styles.switchPillOn]}>
          <Text style={[styles.switchWord, p.value && styles.switchWordOn]}>{p.value ? '✓ ON' : 'OFF'}</Text>
        </View>
      </Pressable>
      {p.hint ? <Text style={styles.hint}>{p.hint}</Text> : null}
    </View>
  );
}

/** "More details": closed by default; remembers nothing. */
export function MoreDetails(p: { title?: string; children: ReactNode; initiallyOpen?: boolean; /** Fields inside: GO TO one of them opens this. */ focusKeys?: readonly string[] }) {
  const [open, setOpen] = useState(() => (p.initiallyOpen ?? false) || !!p.focusKeys?.some(focusAsked));
  const title = p.title ?? 'More details';
  return (
    <View style={styles.more}>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.moreHead} accessibilityRole="button" accessibilityState={{ expanded: open }} aria-expanded={open} accessibilityLabel={`${title}. ${open ? 'Hide' : 'Show'}.`}>
        <Text style={styles.moreTitle}>{title.toUpperCase()}</Text>
        <Text style={styles.moreMark}>{open ? 'HIDE ▴' : 'SHOW ▾'}</Text>
      </Pressable>
      {open ? <View style={styles.moreBody}>{p.children}</View> : null}
    </View>
  );
}

/* ── rows, buttons, notes, counts ───────────────────────────────────────── */

/** A row in a list of things (an input, a mix, a device). */
export function RowCard(p: { title: string; subtitle?: string; badges?: string[]; selected?: boolean; onPress?: () => void; right?: ReactNode; children?: ReactNode; a11yLabel?: string }) {
  const main = (
    <>
      <Text style={styles.rowTitle}>{p.selected ? `▸ ${p.title}` : p.title}</Text>
      {p.subtitle ? <Text style={styles.rowSub}>{p.subtitle}</Text> : null}
      {p.badges && p.badges.length ? (
        <View style={styles.badges}>
          {p.badges.map((b, i) => (
            <View key={`${b}:${i}`} style={styles.badge}>
              <Text style={styles.badgeText}>{b}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
  // A row that is open or chosen says so in words: a button has no "selected"
  // state that reaches a screen reader on the web.
  const label = `${p.a11yLabel ?? [p.title, p.subtitle, ...(p.badges ?? [])].filter(Boolean).join(', ')}${p.selected ? ' Selected.' : ''}`;
  return (
    <View style={[styles.row, p.selected && styles.rowOn]}>
      <View style={styles.rowTop}>
        {p.onPress ? (
          <Pressable onPress={p.onPress} style={styles.rowMain} accessibilityRole="button" accessibilityState={{ selected: !!p.selected }} accessibilityLabel={label}>
            {main}
          </Pressable>
        ) : (
          <View style={styles.rowMain}>{main}</View>
        )}
        {p.right ? <View style={styles.rowRight}>{p.right}</View> : null}
      </View>
      {p.children ? <View style={styles.rowBody}>{p.children}</View> : null}
    </View>
  );
}

export function Button(p: { label: string; onPress: () => void; tone?: 'primary' | 'plain' | 'danger'; disabled?: boolean; disabledReason?: string; a11yLabel?: string }) {
  const tone = p.tone ?? 'plain';
  const off = !!p.disabled;
  const say = p.a11yLabel ?? p.label;
  return (
    <View style={styles.buttonWrap}>
      <Pressable
        onPress={p.onPress}
        disabled={off}
        style={[styles.button, tone === 'primary' && styles.buttonPrimary, tone === 'danger' && styles.buttonDanger, off && styles.buttonOff]}
        accessibilityRole="button"
        accessibilityState={{ disabled: off }}
        aria-disabled={off}
        accessibilityLabel={off && p.disabledReason ? `${say}. Not available: ${p.disabledReason}` : say}
      >
        <Text style={[styles.buttonText, tone === 'primary' && styles.buttonTextPrimary, tone === 'danger' && styles.buttonTextDanger]}>{p.label}</Text>
      </Pressable>
      {off && p.disabledReason ? <Text style={styles.hint}>{p.disabledReason}</Text> : null}
    </View>
  );
}

const NOTE_MARK = { plain: 'ⓘ', warning: '!', good: '✓' } as const;

/** Plain words in a quiet box. The mark says the tone; the color only repeats it. */
export function Note(p: { children: ReactNode; tone?: 'plain' | 'warning' | 'good' }) {
  const tone = p.tone ?? 'plain';
  // Words (and nested <Text>) are set as one paragraph; anything else is laid out as given.
  const wordsOnly = Children.toArray(p.children).every((c) => typeof c === 'string' || typeof c === 'number' || (isValidElement(c) && c.type === Text));
  return (
    <View style={[styles.note, tone === 'warning' && styles.noteWarning, tone === 'good' && styles.noteGood]}>
      <Text style={[styles.noteMark, tone === 'warning' && styles.noteMarkWarning, tone === 'good' && styles.noteMarkGood]}>{NOTE_MARK[tone]}</Text>
      <View style={styles.noteBody}>{wordsOnly ? <Text style={styles.noteText}>{p.children}</Text> : p.children}</View>
    </View>
  );
}

/** A count with its label ("14", "input channels"). Value text uses fitValue. */
export function Count(p: { value: string | number; label: string }) {
  return (
    <View style={styles.count} accessible accessibilityLabel={`${p.value} ${p.label}`}>
      <Text style={styles.countValue} {...fitValue(24)}>
        {p.value}
      </Text>
      <Text style={styles.countLabel}>{p.label}</Text>
    </View>
  );
}

/* ── popups ─────────────────────────────────────────────────────────────── */

/** A bottom sheet / centered popup for picking or editing (popups, never pulldowns).
 *  `scroll={false}` (an addition): the popup's body does not scroll, for content that
 *  brings its own scroller, so a popup never shows two scroll bars. */
/* ── GO TO a FIELD (bug test, 2026-11-13) ───────────────────────────────
 * A review question names a field ("Kick in: who supplies the microphone").
 * GO TO opened the right popup at its top, with the field below the fold or
 * inside a closed MORE DETAILS. Now GO TO asks for the field
 * (askSheetFocus), the popup that opens next scrolls to it (FocusMark), and
 * a MORE DETAILS that holds it opens (its `focusKeys`). The ask is taken
 * once, and only for a moment, so a popup opened later never jumps. */
let pendingFocus: { field: string; at: number } | null = null;
const FOCUS_FRESH_MS = 3000;
export function askSheetFocus(field: string | null | undefined): void {
  pendingFocus = field ? { field, at: Date.now() } : null;
}
const focusAsked = (k: string): boolean => !!pendingFocus && pendingFocus.field === k && Date.now() - pendingFocus.at < FOCUS_FRESH_MS;
type SheetScroller = { scrollToMark: (mark: View) => void };
const SheetScroll = createContext<SheetScroller | null>(null);

/** A field a review question can point at. Inside a popup that opens for
 *  that question, the popup scrolls so the field is at the top. */
export function FocusMark(p: { k: string; children: ReactNode }) {
  const ctx = useContext(SheetScroll);
  const ref = useRef<View>(null);
  useEffect(() => {
    if (!ctx || !focusAsked(p.k)) return undefined;
    pendingFocus = null;
    // after the popup has laid out (it fades in): measure, then scroll
    const t = setTimeout(() => {
      if (ref.current) ctx.scrollToMark(ref.current);
    }, 160);
    return () => clearTimeout(t);
    // asked once, when the field first appears
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View ref={ref} collapsable={false}>
      {p.children}
    </View>
  );
}

export function Sheet(p: { visible: boolean; title: string; onClose: () => void; children: ReactNode; scroll?: boolean }) {
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const scroller = useRef<SheetScroller>({
    scrollToMark: (mark) => {
      const content = contentRef.current;
      if (!content) return;
      content.measureInWindow((_cx, cy) => {
        mark.measureInWindow((_mx, my) => scrollRef.current?.scrollTo({ y: Math.max(0, my - cy - 12), animated: false }));
      });
    },
  }).current;
  // WHILE IT CLOSES, a popup keeps the title and the body it had. The caller
  // has usually let go of the row by then ("Remove Maya?" became "Remove this
  // performer?" during the fade-out, and a menu's title went blank).
  const last = useRef<{ title: string; children: ReactNode }>({ title: p.title, children: p.children });
  if (p.visible) last.current = { title: p.title, children: p.children };
  const { title, children } = last.current;
  return (
    <Modal accessibilityViewIsModal visible={p.visible} transparent animationType="fade" onRequestClose={p.onClose}>
      <Pressable accessible={false} style={styles.backdrop} onPress={p.onClose}>
        <Pressable accessible={false} style={styles.sheet} onPress={() => {}}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle} accessibilityRole="header">
              {title}
            </Text>
            <Pressable onPress={p.onClose} style={styles.sheetClose} accessibilityRole="button" accessibilityLabel={`Close ${title}`}>
              <Text style={styles.sheetCloseText}>✕</Text>
            </Pressable>
          </View>
          {p.scroll === false ? (
            <View style={[styles.sheetBody, styles.sheetBodyFixed]}>{children}</View>
          ) : (
            // "handled": with the keyboard up, the first tap on a button must
            // press the button, not only put the keyboard away.
            <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
              <View ref={contentRef} collapsable={false} style={styles.sheetBody}>
                <SheetScroll.Provider value={scroller}>{children}</SheetScroll.Provider>
              </View>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** A short optional explanation: a ⓘ line that opens a centered popup; `term` adds "Open in glossary". */
export function HelpTip(p: { title: string; body: string; term?: string }) {
  const [open, setOpen] = useState(false);
  const openGlossary = useGlossaryOpener();
  const afterClose = useAfterModalsClose();
  const term = p.term;
  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.tip} accessibilityRole="button" accessibilityLabel={`Explain: ${p.title}`}>
        <Text style={styles.tipMark}>ⓘ</Text>
        <Text style={styles.tipText}>{p.title}</Text>
      </Pressable>
      <Sheet visible={open} title={p.title} onClose={() => setOpen(false)}>
        <Text style={styles.tipBody}>{p.body}</Text>
        {term && openGlossary ? (
          <Button
            label="OPEN IN GLOSSARY ›"
            a11yLabel={`Open ${term} in the glossary`}
            onPress={() => {
              // One popup at a time: this one closes, then the glossary opens.
              setOpen(false);
              afterClose(() => openGlossary(term));
            }}
          />
        ) : null}
        <Button label="CLOSE" tone="primary" onPress={() => setOpen(false)} a11yLabel={`Close ${p.title}`} />
      </Sheet>
    </>
  );
}

/* ── the review list ────────────────────────────────────────────────────── */

const LEVEL_WORD: Record<SpIssueLevel, string> = { block: '! MUST BE CORRECTED', ask: '? QUESTION', open: '○ TO BE CONFIRMED' };

/** The review list (or part of it). Each issue shows its text, a "Go to" and its answers. */
export function IssueList(p: { issues: SpIssue[]; onGoTo: (i: SpIssue) => void; onAction: (i: SpIssue, a: SpIssueAction) => void; empty?: string }) {
  if (!p.issues.length) return <Note tone="good">{p.empty ?? 'Nothing to review here.'}</Note>;
  return (
    <View style={styles.issues}>
      {p.issues.map((issue) => {
        // "Go to" opens the row; the other actions are the answers.
        const answers = issue.actions.filter((a) => a !== 'edit');
        return (
          <View key={issue.key} style={[styles.issue, issue.level === 'block' && styles.issueBlock]}>
            <Text style={[styles.issueLevel, issue.level === 'block' && styles.issueLevelBlock, issue.level === 'open' && styles.issueLevelOpen]}>{LEVEL_WORD[issue.level]}</Text>
            <Text style={styles.issueText}>{issue.text}</Text>
            <View style={styles.issueActions}>
              <Pressable
                onPress={() => {
                  // the popup that opens shows the field that answers it
                  askSheetFocus(issue.field);
                  p.onGoTo(issue);
                }}
                style={styles.issueBtn}
                accessibilityRole="button"
                accessibilityLabel={`Go to it: ${issue.text}`}
              >
                <Text style={styles.issueBtnText}>GO TO ›</Text>
              </Pressable>
              {answers.map((a) => {
                const label = spIssueActionLabel(a, issue);
                return (
                  <Pressable
                    key={a}
                    onPress={() => p.onAction(issue, a)}
                    style={[styles.issueBtn, styles.issueAnswer]}
                    accessibilityRole="button"
                    accessibilityLabel={`${label}. ${issue.text}`}
                  >
                    <Text style={[styles.issueBtnText, styles.issueAnswerText]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // A section is a HEADING and a stack, not a box: the rows, notes and fields
  // inside it are the surfaces, so nothing is ever a card inside a card and a
  // row keeps the full width of a phone.
  section: { gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderTopWidth: 1, borderTopColor: SURFACE_BORDER, paddingTop: 14 },
  sectionHeadText: { flex: 1, gap: 4 },
  sectionTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13.5, letterSpacing: 1.4, color: colors.amberLabel },
  sectionRight: { flexShrink: 0, maxWidth: '50%' },
  sectionBody: { gap: 14 },
  fields: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 16, alignItems: 'flex-start' },

  field: { gap: 6 },
  label: { fontFamily: fonts.barlowSemiBold, fontSize: 14, lineHeight: 19, color: colors.textPrimary },
  hint: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textSub },
  input: {
    fontFamily: fonts.barlowRegular,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: FIELD_BORDER,
    borderRadius: 9,
    backgroundColor: FIELD_BG,
    paddingHorizontal: 12,
    paddingVertical: 11,
    minHeight: 48,
  },
  inputMulti: { minHeight: 104, textAlignVertical: 'top' },
  inputNumber: { fontFamily: fonts.mono, color: colors.amber },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: FIELD_BORDER, borderRadius: 9, backgroundColor: '#121216', paddingHorizontal: 13, paddingVertical: 8, minHeight: 44, justifyContent: 'center' },
  chipOn: { borderColor: colors.amber, backgroundColor: '#1d1709' },
  chipText: { fontFamily: fonts.barlowMedium, fontSize: 14, color: colors.textSecondary },
  chipTextOn: { color: colors.amber },

  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  switchLabel: { flex: 1, fontFamily: fonts.barlowSemiBold, fontSize: 14, lineHeight: 19, color: colors.textPrimary },
  switchPill: { minWidth: 68, minHeight: 34, borderRadius: 17, borderWidth: 1, borderColor: FIELD_BORDER, backgroundColor: '#121216', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  switchPillOn: { borderColor: colors.amber, backgroundColor: '#1d1709' },
  switchWord: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSub },
  switchWordOn: { color: colors.amber },

  more: { borderTopWidth: 1, borderTopColor: SURFACE_BORDER },
  moreHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 46 },
  moreTitle: { flex: 1, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.3, color: colors.textSecondary },
  moreMark: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.amber },
  moreBody: { gap: 16, paddingTop: 4, paddingBottom: 6 },

  row: { borderRadius: 10, borderWidth: 1, borderColor: SURFACE_BORDER, backgroundColor: '#131317', padding: 12, gap: 12 },
  rowOn: { borderColor: colors.amber, backgroundColor: '#17140c' },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowMain: { flex: 1, gap: 4, minHeight: 44, justifyContent: 'center' },
  rowRight: { flexShrink: 0 },
  rowTitle: { fontFamily: fonts.barlowSemiBold, fontSize: 15.5, lineHeight: 21, color: colors.textPrimary },
  rowSub: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSub },
  rowBody: { gap: 14 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  badge: { borderWidth: 1, borderColor: '#34343b', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  // A badge is read, not decoration: 12, and in capitals however it was typed.
  badgeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.textSecondary, textTransform: 'uppercase' },

  buttonWrap: { gap: 6, alignItems: 'flex-start' },
  button: { minHeight: 46, borderRadius: 9, borderWidth: 1, borderColor: '#3a3a42', backgroundColor: '#141418', paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  buttonPrimary: { borderColor: colors.amber, backgroundColor: 'rgba(255,198,77,.14)' },
  buttonDanger: { borderColor: '#5a2c2c', backgroundColor: '#160d0d' },
  buttonOff: { opacity: 0.45 },
  // Capitals are set HERE, so every button in the lab reads alike however its label was typed.
  buttonText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.1, color: colors.textPrimary, textAlign: 'center', textTransform: 'uppercase' },
  buttonTextPrimary: { color: colors.amber },
  buttonTextDanger: { color: DANGER },

  note: { flexDirection: 'row', gap: 10, borderLeftWidth: 3, borderLeftColor: '#3a3a42', backgroundColor: '#131317', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 11 },
  noteWarning: { borderLeftColor: colors.amber, backgroundColor: 'rgba(255,198,77,.08)' },
  noteGood: { borderLeftColor: colors.green, backgroundColor: 'rgba(55,224,95,.07)' },
  noteMark: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, lineHeight: 19, width: 14, textAlign: 'center', color: colors.textSub },
  noteMarkWarning: { color: colors.amber },
  noteMarkGood: { color: colors.green },
  noteBody: { flex: 1, gap: 8 },
  noteText: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19.5, color: colors.textSecondary },

  // In a wrapping row, three to a line on a phone; the label wraps inside its cell.
  count: { minWidth: 96, flexGrow: 1, flexShrink: 1, flexBasis: '30%', borderRadius: 10, borderWidth: 1, borderColor: SURFACE_BORDER, backgroundColor: '#131317', paddingVertical: 10, paddingHorizontal: 10, gap: 2 },
  countValue: { fontFamily: fonts.mono, fontSize: 24, color: colors.amber },
  countLabel: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.66)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  sheet: { width: '100%', maxWidth: 460, maxHeight: '88%', borderRadius: 14, borderWidth: 1, borderColor: '#2a2a31', backgroundColor: SURFACE },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 18, paddingRight: 8, paddingTop: 8, borderBottomWidth: 1, borderBottomColor: SURFACE_BORDER, paddingBottom: 8 },
  sheetTitle: { flex: 1, fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 0.8, color: colors.textPrimary },
  sheetClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sheetCloseText: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: colors.textSub },
  sheetBody: { padding: 18, gap: 16 },
  sheetBodyFixed: { flexShrink: 1 },

  tip: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  tipMark: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, color: colors.amber },
  tipText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19, color: colors.amber, textDecorationLine: 'underline' },
  tipBody: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22, color: colors.textSecondary },

  issues: { gap: 10 },
  issue: { borderRadius: 10, borderWidth: 1, borderColor: SURFACE_BORDER, backgroundColor: '#131317', padding: 12, gap: 8 },
  issueBlock: { borderColor: '#5a2c2c' },
  issueLevel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber },
  issueLevelBlock: { color: DANGER },
  issueLevelOpen: { color: colors.textSub },
  issueText: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  issueActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  issueBtn: { minHeight: 44, borderRadius: 9, borderWidth: 1, borderColor: '#3a3a42', backgroundColor: '#141418', paddingHorizontal: 12, paddingVertical: 8, justifyContent: 'center' },
  issueBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textPrimary, textTransform: 'uppercase' },
  issueAnswer: { borderColor: colors.amber, backgroundColor: 'rgba(255,198,77,.10)' },
  issueAnswerText: { color: colors.amber },
});

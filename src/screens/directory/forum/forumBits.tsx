/**
 * The Audio Community Forum's parts, drawn from the approved mockup's own
 * styles (Downloads/2026-11-01_COMMUNITY_FORUM_MOCKUP.html): the same panels,
 * status lights, plates and stamps as the chat redesign, so the forum reads as
 * one room with the Requests tab.
 *
 * Every number here is the mockup's. Change the mockup first.
 */
import { memo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Modal, useAfterModalsClose } from '../../../components/DimModal';
import { BACK_HIT_SLOP } from '../../../components/backHitSlop';
import { HomeOrBackKey } from '../../../components/nav/HomeOrBackKey';
import { safeGoBack } from '../../../lib/safeGoBack';
import { popupCard } from '../../../theme/readingColumn';
import { fonts } from '../../../theme/tokens';
import { sampleForumOn } from '../../../features/forum/sampleSwitch';
import {
  FORUM_CLOSED,
  SORTS,
  SORT_LABELS,
  badgeName,
  dotOf,
  plateOf,
  topicA11y,
  showsUnreadDot,
  topicReviewStamp,
  topicStat,
  topicTag,
  trackedFace,
  type DotTone,
  type StatusTone,
} from '../../../features/forum/rules';
import type { ForumAuthor, ForumCategory, ForumTopic, TopicSort } from '../../../features/forum/types';
import { ChannelBadge } from '../ChannelBadge';
import { KindPlate } from '../KindPlate';
import { Loading, RetryOrSignIn } from '../directoryBits';

/** The mockup's :root. */
export const F = {
  bg: '#0b0c0f',
  panel: '#121318',
  raised: '#181a21',
  line: '#24262e',
  line2: '#2e313b',
  text: '#f0f0f0',
  body: '#dcdce0',
  sub: '#a6a6ad',
  muted: '#7f818a',
  amber: '#ffc64d',
  amberDim: 'rgba(255,198,77,.14)',
  green: '#37e05f',
  greenDim: 'rgba(55,224,95,.12)',
  steel: '#9fb4c8',
  red: '#ff5a48',
  blue: '#5bb0ff',
  purple: '#c58cff',
  dimScrim: 'rgba(5,6,8,.72)',
} as const;

const DOT: Record<DotTone, string> = { amber: F.amber, green: F.green, blue: F.blue, steel: F.steel, purple: F.purple };

/* ── Headers ─────────────────────────────────────────────────────────── */

/** `.hdr`: back key, title, small line. Used by Ask, Ideas and "Your post". */
export function ForumHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  return (
    <View style={[st.hdr, { paddingTop: insets.top + 6 }]}>
      <HomeOrBackKey onPress={() => safeGoBack(navigation)} hitSlop={BACK_HIT_SLOP} style={st.back} backStyle={st.backGlyph} />
      <View style={st.hdrText}>
        <Text accessibilityRole="header" style={st.ttl}>
          {title}
        </Text>
        {sub ? <Text style={st.ttlSub}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
}

/** `.th-hdr`: the amber category line, ···, and the thread's title. */
export function ThreadHeader({ label, title, onMore }: { label: string; title?: string; onMore?: () => void }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  return (
    <View style={[st.thHdr, { paddingTop: insets.top + 6 }]}>
      <View style={st.thTop}>
        <HomeOrBackKey onPress={() => safeGoBack(navigation)} hitSlop={BACK_HIT_SLOP} style={st.back} backStyle={st.backGlyph} />
        <Text style={st.thCat} numberOfLines={2}>
          {label}
        </Text>
        {onMore ? <MoreKey onPress={onMore} label="More options" /> : null}
      </View>
      {title ? (
        <Text accessibilityRole="header" style={st.thTitle}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}

export function MoreKey({ onPress, label, style }: { onPress: () => void; label: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={[st.more, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={st.moreText}>···</Text>
    </Pressable>
  );
}

/** Says so on every sample screen, so a made-up post is never taken for real. */
export function SampleStamp() {
  if (!sampleForumOn()) return null;
  return <Text style={st.sample}>SAMPLE DATA · NOTHING HERE IS REAL</Text>;
}

/* ── Stamps, plates, tags ────────────────────────────────────────────── */

export function AuthorPlate({ author }: { author: ForumAuthor }) {
  const plate = plateOf(author);
  return plate ? <KindPlate tone={plate.tone} label={plate.label} /> : null;
}

export function Tag({ children }: { children: string }) {
  return (
    <Text style={st.tag}>{children}</Text>
  );
}

export function SolvedStamp() {
  return <Text style={st.solved}>✓ SOLVED</Text>;
}

export function NewMark({ long }: { long?: boolean }) {
  return <Text style={st.newm}>{long ? 'NEW MEMBER' : 'NEW'}</Text>;
}

export function PinStamp() {
  return <Text style={st.pin}>PINNED</Text>;
}

const STATUS: Record<StatusTone, { color: string; border: string }> = {
  planned: { color: F.amber, border: 'rgba(255,198,77,.45)' },
  progress: { color: F.blue, border: 'rgba(91,176,255,.45)' },
  shipped: { color: F.green, border: 'rgba(55,224,95,.45)' },
  review: { color: F.muted, border: F.line2 },
  declined: { color: F.red, border: 'rgba(255,90,72,.45)' },
};

export function StatusStamp({ tone, children }: { tone: StatusTone; children: string }) {
  const s = STATUS[tone];
  return <Text style={[st.status, { color: s.color, borderColor: s.border }]}>{children}</Text>;
}

/** Unread: where a row's tap lands. A thread opens at the first post the
 *  member has not read. */
export function topicRoute(t: ForumTopic): { topicId: string; jumpTo?: string; unread?: boolean } {
  return t.unread && t.firstUnreadPostId
    ? { topicId: t.id, jumpTo: t.firstUnreadPostId, unread: true }
    : { topicId: t.id };
}

/* ── Section heads and chips ─────────────────────────────────────────── */

export function SecHead({
  children,
  style,
  link,
}: {
  children: string;
  style?: StyleProp<TextStyle>;
  /** `.sec a`: a small amber link at the end of the line. */
  link?: { label: string; onPress: () => void };
}) {
  if (!link) {
    return (
      <Text accessibilityRole="header" style={[st.sec, style]}>
        {children}
      </Text>
    );
  }
  return (
    <View style={st.secRow}>
      <Text accessibilityRole="header" style={[st.sec, style]}>
        {children}
      </Text>
      <Pressable onPress={link.onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={link.label}>
        <Text style={st.secLink}>{link.label}</Text>
      </Pressable>
    </View>
  );
}

export function GroupHead({ children }: { children: string }) {
  return (
    <Text accessibilityRole="header" style={st.grp}>
      {children}
    </Text>
  );
}

export function CategoryChip({ category, onPress }: { category: ForumCategory; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 3, bottom: 3 }}
      style={({ pressed }) => [st.c2, pressed && st.pressed]}
      accessibilityRole="button"
      accessibilityLabel={category.name}
    >
      <View style={[st.dot, { backgroundColor: DOT[dotOf(category)] }]} />
      <Text style={st.c2Text}>{category.name}</Text>
    </Pressable>
  );
}

export function Chips({ children }: { children: ReactNode }) {
  return <View style={st.chips2}>{children}</View>;
}

/** Latest / Unanswered / Top this week. */
export function SortChips({ value, onChange }: { value: TopicSort; onChange: (s: TopicSort) => void }) {
  return (
    <View style={st.fchips} accessibilityRole="tablist">
      {SORTS.map((s) => {
        const on = s === value;
        return (
          <Pressable
            key={s}
            onPress={() => onChange(s)}
            hitSlop={{ top: 4, bottom: 4 }}
            style={[st.fchip, on && st.fchipOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            aria-selected={on}
          >
            <Text style={[st.fchipText, on && st.fchipTextOn]}>{SORT_LABELS[s]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ── A topic row ─────────────────────────────────────────────────────── */

export const TopicRow = memo(function TopicRow({
  topic,
  spelled,
  plates,
  onPress,
}: {
  topic: ForumTopic;
  /** The first row spells "4 replies"; the rows under it read "7 · 1h". */
  spelled: boolean;
  /** Pro Lounge rows wear the author's plate, as in the mockup. */
  plates?: boolean;
  onPress: (t: ForumTopic) => void;
}) {
  const tracked = trackedFace(topic.trackedStatus);
  const review = topicReviewStamp(topic);
  return (
    <Pressable
      onPress={() => onPress(topic)}
      style={({ pressed }) => [st.tp, pressed && st.pressed]}
      accessibilityRole="button"
      accessibilityLabel={topicA11y(topic)}
    >
      <ChannelBadge name={badgeName(topic.author.name)} led="off" steel={!!topic.author.verifiedKind} size={38} />
      <View style={st.tpBody}>
        <Text style={st.tt}>
          {showsUnreadDot(topic) ? <Text style={st.unread}>● </Text> : null}
          {topic.title}
        </Text>
        <View style={st.meta}>
          {topic.pinned ? <PinStamp /> : null}
          {review ? <StatusStamp tone={review === 'REMOVED' ? 'declined' : 'planned'}>{review}</StatusStamp> : null}
          {topic.solved ? <SolvedStamp /> : null}
          {tracked ? <StatusStamp tone={tracked.tone}>{tracked.stamp}</StatusStamp> : null}
          {topic.isNewMember ? <NewMark long /> : null}
          {plates ? <AuthorPlate author={topic.author} /> : null}
          <Tag>{topicTag(topic)}</Tag>
          <Text style={st.stat}>{topicStat(topic, spelled)}</Text>
        </View>
      </View>
    </Pressable>
  );
});

/* ── The faces of a screen ───────────────────────────────────────────── */

export function ForumLoading({ label = 'Loading the forum…' }: { label?: string }) {
  return <Loading label={label} />;
}

/** A failed read. Never "nothing here"; "closed" is its own honest words. */
export function ForumUnreadable({
  error,
  code,
  onRetry,
}: {
  error: string | null;
  code: string | null;
  onRetry: () => void;
}) {
  if (code === 'forum_closed') {
    return (
      <View style={st.face}>
        <Text style={st.faceHead}>{FORUM_CLOSED}</Text>
        <Text style={st.faceText}>Please check back soon.</Text>
      </View>
    );
  }
  return (
    <View style={st.face}>
      <Text style={st.faceHead}>This could not be loaded</Text>
      <Text style={st.faceText}>{error}</Text>
      <RetryOrSignIn message={error} onRetry={onRetry} />
    </View>
  );
}

/** A read that worked and found nothing. */
export function ForumEmpty({ title, text }: { title: string; text: string }) {
  return (
    <View style={st.face}>
      <Text style={st.faceHead}>{title}</Text>
      <Text style={st.faceText}>{text}</Text>
    </View>
  );
}

/** The last refresh failed: what is on screen stays, and says so. */
export function StaleNote() {
  return <Text style={st.stale}>Could not refresh. This may be out of date.</Text>;
}

/* ── Buttons, notices ────────────────────────────────────────────────── */

export function AmberButton({
  label,
  onPress,
  busy,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const off = disabled || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [st.pbtn, disabled && st.pbtnOff, pressed && !off && st.pressed, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      aria-disabled={!!off}
    >
      {busy ? <ActivityIndicator color="#111" /> : <Text style={[st.pbtnText, disabled && st.pbtnTextOff]}>{label}</Text>}
    </Pressable>
  );
}

export function QuietButton({
  label,
  onPress,
  style,
  disabled,
}: {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  /** Off while the write beside it is out (a CANCEL that cannot cancel it). */
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [st.sbtn, disabled && st.sbtnOff, pressed && !disabled && st.pressed, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      aria-disabled={!!disabled}
    >
      <Text style={st.sbtnText}>{label}</Text>
    </Pressable>
  );
}

/**
 * MY PROFILE from a forum notice: back to the Audio Community screen already
 * under this one, on its profile tab. `navigate` pushed a SECOND copy, so BACK
 * returned to the stale notice and each trip grew the stack (bug pass
 * 2026-11-08, CODE-1-09). popTo adds it only when it is not in the stack.
 */
export function openMyProfile(navigation: unknown): void {
  const nav = navigation as {
    popTo?: (route: string, params?: object) => void;
    navigate: (route: string, params?: object) => void;
  };
  if (nav.popTo) nav.popTo('AudioCommunityDirectory', { tab: 'profile' });
  else nav.navigate('AudioCommunityDirectory', { tab: 'profile' });
}

/** `.locked`: the notice that takes the reply box's place. */
export function LockedNotice({
  children,
  solid,
  action,
}: {
  children: ReactNode;
  /** Announcements' calm solid edge; the Pro Lounge's is dashed amber. */
  solid?: boolean;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={[st.locked, solid && st.lockedSolid]}>
      <Text style={st.lockedText}>{children}</Text>
      {action ? (
        <Pressable onPress={action.onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={action.label}>
          <Text style={st.lockedAction}>{action.label} ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Bold({ children, onPress }: { children: string; onPress?: () => void }) {
  return (
    <Text style={st.bold} onPress={onPress} accessibilityRole={onPress ? 'link' : undefined}>
      {children}
    </Text>
  );
}

/** The form's small label. */
export function FieldLabel({ children }: { children: string }) {
  return <Text style={st.lbl}>{children}</Text>;
}

export function Field({
  value,
  onChangeText,
  placeholder,
  multiline,
  maxLength,
  label,
  editable = true,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  label: string;
  /** Off while the form is posting: what is sent is what is on screen. */
  editable?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={F.muted}
      multiline={multiline}
      maxLength={maxLength}
      editable={editable}
      style={[st.fld, multiline && st.fldTa, !editable && st.fldOff]}
      accessibilityLabel={label}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  );
}

/** A form row that opens a popup. */
export function PickField({
  value,
  onPress,
  label,
  disabled,
}: {
  value: string;
  onPress: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[st.fld, disabled && st.fldOff]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text style={st.pickText}>{value} ›</Text>
    </Pressable>
  );
}

/* ── Moderation cards ────────────────────────────────────────────────── */

export function ModCard({
  tone,
  head,
  text,
  excerpt,
  how,
  actions,
  crisis,
}: {
  tone: 'hold' | 'removed' | 'good' | 'plain';
  head: string;
  text: string;
  excerpt?: string | null;
  how?: string | null;
  actions?: { label: string; onPress: () => void; primary?: boolean; disabled?: boolean }[];
  crisis?: boolean;
}) {
  return (
    <View style={[st.modcard, st[`mod_${tone}`]]}>
      <Text style={[st.modHead, st[`modHead_${tone}`]]}>{head}</Text>
      <Text style={st.modText}>{text}</Text>
      {excerpt ? <Text style={st.modEx}>"{excerpt}"</Text> : null}
      {crisis ? <CrisisNote /> : null}
      {actions && actions.length > 0 ? (
        <View style={st.modActs}>
          {actions.map((a) => (
            <Pressable
              key={a.label}
              onPress={a.onPress}
              disabled={a.disabled}
              style={[st.modAct, a.primary && st.modActPrimary, a.disabled && st.modActOff]}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              accessibilityState={{ disabled: !!a.disabled }}
              aria-disabled={!!a.disabled}
            >
              <Text style={[st.modActText, a.primary && st.modActTextPrimary]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {how ? <Text style={st.ai}>{how}</Text> : null}
    </View>
  );
}

/** The server tells the owner the member saw this, so it is never left out. */
export function CrisisNote() {
  return (
    <Text style={st.crisis}>
      If you are thinking about hurting yourself, you are not alone. In the US, call or text 988 at any time. Anywhere
      else, please call your local emergency number or reach out to someone you trust.
    </Text>
  );
}

/* ── Popups ──────────────────────────────────────────────────────────── */

/** A centred card over the dim: a popup, never something that moves the page. */
export function Popup({
  visible,
  onClose,
  children,
  label,
  closeOnBackdrop = true,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
  closeOnBackdrop?: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={st.scrim}
        onPress={closeOnBackdrop ? onClose : undefined}
        accessibilityLabel={closeOnBackdrop ? 'Close' : undefined}
        accessible={false}
        importantForAccessibility="no"
      >
        <Pressable style={st.popup} onPress={() => {}} accessibilityViewIsModal accessibilityLabel={label} accessible={false}>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export type MenuItem = { key: string; label: string; note?: string; danger?: boolean; onPress: () => void };

/**
 * `.menu`: Quote reply · Report post · Block member, with their small notes.
 *
 * ⛔ An item runs only AFTER this popup has gone (useAfterModalsClose, the
 * house hand-off of EnrollmentHelpMenu). Most items open a second popup
 * (Report, a confirm) or leave the screen, and iOS refuses to present a Modal
 * while another is still animating away: nothing appeared (review 2026-11-07,
 * High 3). One pending item at a time, so a double tap is one.
 */
export function MenuPopup({ visible, onClose, items }: { visible: boolean; onClose: () => void; items: MenuItem[] }) {
  const afterClose = useAfterModalsClose();
  return (
    <Popup visible={visible} onClose={onClose} label="Post options">
      <View style={st.menu}>
        <PopupScroll>
        {items.map((m, i) => (
          <Pressable
            key={m.key}
            onPress={() => {
              onClose();
              afterClose(m.onPress);
            }}
            style={({ pressed }) => [st.menuRow, i === items.length - 1 && st.menuRowLast, pressed && st.pressed]}
            accessibilityRole="button"
            accessibilityLabel={m.note ? `${m.label}. ${m.note}` : m.label}
          >
            <Text style={[st.menuText, m.danger && st.menuDanger]}>{m.label}</Text>
            {m.note ? <Text style={st.menuNote}>{m.note}</Text> : null}
          </Pressable>
        ))}
        </PopupScroll>
      </View>
    </Popup>
  );
}

/** The scroller inside a popup that may outgrow a small phone or large text. */
export function PopupScroll({ children }: { children: ReactNode }) {
  return (
    <ScrollView bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

/** The Pro Lounge block on the forum home. */
export function LoungeBlock({
  categories,
  onOpen,
  onCategory,
}: {
  categories: ForumCategory[];
  onOpen: () => void;
  onCategory: (c: ForumCategory) => void;
}) {
  return (
    <LinearGradient colors={['rgba(255,198,77,.07)', 'rgba(255,198,77,.02)']} style={st.lounge}>
      <Pressable onPress={onOpen} hitSlop={6} accessibilityRole="button" accessibilityLabel="Open the Pro Lounge">
        <Text style={st.loungeTitle}>★ PRO LOUNGE</Text>
        <Text style={st.loungeWho}>Everyone reads · graduates and verified organizations and instructors post</Text>
      </Pressable>
      <View style={st.loungeChips}>
        <Chips>
          {categories.map((c) => (
            <CategoryChip key={c.slug} category={c} onPress={() => onCategory(c)} />
          ))}
        </Chips>
      </View>
    </LinearGradient>
  );
}

/** `.ann`: one quiet line. */
export function AnnounceRow({
  mark,
  head,
  text,
  onPress,
}: {
  mark: string;
  head: string;
  text: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [st.ann, pressed && st.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${head}. ${text}`}
    >
      <Text style={st.annText} numberOfLines={2}>
        {mark} <Text style={st.bold}>{head}</Text> · {text}
      </Text>
    </Pressable>
  );
}

/** The search box and ASK. */
export function SearchBar({
  value,
  onChange,
  onAsk,
}: {
  value: string;
  onChange: (t: string) => void;
  onAsk: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={st.search}>
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search topics and answers"
        placeholderTextColor={F.muted}
        style={[st.searchBox, focused && st.searchBoxOn]}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel="Search topics and answers"
      />
      <Pressable
        onPress={onAsk}
        style={({ pressed }) => [st.ask, pressed && st.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Ask a question"
      >
        <Text style={st.askText}>ASK</Text>
      </Pressable>
    </View>
  );
}

export const forumStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: F.bg },
  screenPad: { paddingHorizontal: 16 },
});

const st = StyleSheet.create({
  pressed: { opacity: 0.7 },
  hdr: { flexDirection: 'row', alignItems: 'center', paddingLeft: 6, paddingRight: 18, paddingBottom: 12, backgroundColor: F.bg },
  hdrText: { flex: 1, minWidth: 0 },
  back: { minWidth: 44, minHeight: 44, marginRight: 2, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  backGlyph: { fontFamily: fonts.barlowRegular, fontSize: 26, color: F.sub },
  ttl: { fontFamily: fonts.oswaldSemiBold, fontSize: 19, letterSpacing: 0.76, color: F.text },
  ttlSub: { fontFamily: fonts.barlowMedium, fontSize: 12, color: F.muted, marginTop: 1 },
  thHdr: { paddingHorizontal: 6, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: F.line, backgroundColor: F.bg },
  thTop: { flexDirection: 'row', alignItems: 'center', paddingRight: 8, minHeight: 44 },
  thCat: { flex: 1, minWidth: 0, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.54, color: F.amber },
  thTitle: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 18,
    lineHeight: 22.5,
    color: F.text,
    marginTop: 2,
    paddingHorizontal: 10,
  },
  more: { minWidth: 36, minHeight: 28, alignItems: 'flex-end', justifyContent: 'center' },
  moreText: { fontFamily: fonts.barlowSemiBold, fontSize: 18, letterSpacing: 2, color: F.sub },
  sample: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: F.blue,
    textAlign: 'center',
    paddingVertical: 4,
    backgroundColor: 'rgba(91,176,255,.08)',
    marginBottom: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  tag: {
    flexShrink: 1,
    fontFamily: fonts.barlowMedium,
    fontSize: 11,
    color: F.sub,
    borderWidth: 1,
    borderColor: F.line2,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  solved: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 0.57,
    color: F.green,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.4)',
    backgroundColor: F.greenDim,
    borderRadius: 5,
    paddingVertical: 2,
    paddingHorizontal: 6,
    overflow: 'hidden',
  },
  newm: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 0.57,
    color: F.blue,
    borderWidth: 1,
    borderColor: 'rgba(91,176,255,.45)',
    borderRadius: 5,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  pin: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 0.76,
    color: F.amber,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.45)',
    borderRadius: 5,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  status: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 0.67,
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  sec: {
    fontFamily: fonts.oswaldMedium,
    fontSize: 11.5,
    letterSpacing: 1.84,
    color: F.muted,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 8,
  },
  secRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  secLink: { fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.1, color: F.amber },
  grp: {
    fontFamily: fonts.oswaldMedium,
    fontSize: 11,
    letterSpacing: 1.76,
    color: F.muted,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 7,
  },
  c2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: F.panel,
    borderWidth: 1,
    borderColor: F.line,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  c2Text: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: F.text },
  dot: { width: 7, height: 7, borderRadius: 4 },
  chips2: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  fchips: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  fchip: { borderWidth: 1, borderColor: F.line2, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  fchipOn: { backgroundColor: F.amber, borderColor: F.amber },
  fchipText: { fontFamily: fonts.barlowRegular, fontSize: 12, color: F.sub },
  fchipTextOn: { fontFamily: fonts.barlowSemiBold, color: '#111' },
  tp: { flexDirection: 'row', gap: 11, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: F.line },
  tpBody: { flex: 1, minWidth: 0 },
  tt: { fontFamily: fonts.barlowSemiBold, fontSize: 14.5, lineHeight: 19, color: F.text },
  unread: { fontSize: 10, color: F.blue },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 5 },
  stat: { marginLeft: 'auto', fontFamily: fonts.mono, fontSize: 10.5, color: F.muted },
  face: { paddingVertical: 34, paddingHorizontal: 8, alignItems: 'center' },
  faceHead: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 16,
    letterSpacing: 0.5,
    color: F.text,
    textAlign: 'center',
  },
  faceText: {
    fontFamily: fonts.barlowRegular,
    fontSize: 13.5,
    lineHeight: 19,
    color: F.sub,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 300,
  },
  stale: { fontFamily: fonts.barlowRegular, fontSize: 12, color: F.muted, marginBottom: 8 },
  pbtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: F.amber,
  },
  pbtnOff: { backgroundColor: F.raised, borderWidth: 1, borderColor: F.line2 },
  pbtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.3, color: '#111' },
  pbtnTextOff: { color: F.muted },
  sbtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: F.line2,
  },
  sbtnOff: { opacity: 0.45 },
  sbtnText: { fontFamily: fonts.oswaldMedium, fontSize: 13, letterSpacing: 1.3, color: F.sub },
  locked: {
    marginHorizontal: 14,
    marginBottom: 16,
    marginTop: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,198,77,.45)',
    borderRadius: 14,
    padding: 12,
  },
  lockedSolid: { borderStyle: 'solid', borderColor: F.line },
  lockedText: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: F.sub },
  lockedAction: { marginTop: 9, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1.2, color: F.amber },
  bold: { fontFamily: fonts.barlowSemiBold, color: F.amber },
  lbl: {
    fontFamily: fonts.oswaldMedium,
    fontSize: 11.5,
    letterSpacing: 1.38,
    color: F.muted,
    marginBottom: 5,
  },
  fld: {
    backgroundColor: F.panel,
    borderWidth: 1,
    borderColor: F.line2,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 13,
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    color: F.text,
  },
  fldTa: { minHeight: 58 },
  fldOff: { opacity: 0.6 },
  pickText: { fontFamily: fonts.barlowRegular, fontSize: 14, color: F.sub },
  modcard: { borderRadius: 14, padding: 12, borderWidth: 1 },
  mod_hold: { borderColor: 'rgba(255,198,77,.45)', backgroundColor: 'rgba(255,198,77,.06)' },
  mod_removed: { borderColor: 'rgba(255,90,72,.45)', backgroundColor: 'rgba(255,90,72,.06)' },
  mod_good: { borderColor: 'rgba(55,224,95,.45)', backgroundColor: 'rgba(55,224,95,.06)' },
  mod_plain: { borderColor: F.line2, backgroundColor: F.panel },
  modHead: { fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1.44 },
  modHead_hold: { color: F.amber },
  modHead_removed: { color: F.red },
  modHead_good: { color: F.green },
  modHead_plain: { color: F.sub },
  modText: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19.5, color: F.body, marginTop: 6 },
  modEx: {
    fontFamily: fonts.barlowItalic,
    fontSize: 12.5,
    lineHeight: 17,
    color: F.sub,
    borderLeftWidth: 2,
    borderLeftColor: F.line2,
    paddingLeft: 8,
    marginTop: 8,
  },
  modActs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  modAct: {
    minHeight: 32,
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: F.line2,
  },
  modActPrimary: { backgroundColor: F.amber, borderColor: F.amber },
  modActOff: { opacity: 0.55 },
  modActText: { fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1.2, color: F.sub },
  modActTextPrimary: { color: '#111' },
  ai: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 16, color: F.muted, marginTop: 8 },
  crisis: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18.5, color: F.text, marginTop: 8 },
  scrim: {
    flex: 1,
    backgroundColor: F.dimScrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  popup: { ...popupCard, width: '100%', maxHeight: '88%' },
  menu: {
    backgroundColor: F.raised,
    borderWidth: 1,
    borderColor: F.line2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuRow: { paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: F.line },
  menuRowLast: { borderBottomWidth: 0 },
  menuText: { fontFamily: fonts.barlowRegular, fontSize: 14, color: F.text },
  menuDanger: { color: F.red },
  menuNote: { fontFamily: fonts.barlowRegular, fontSize: 11.5, color: F.muted, marginTop: 2 },
  lounge: {
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.45)',
    borderRadius: 14,
    paddingTop: 10,
    paddingHorizontal: 11,
    paddingBottom: 11,
    marginBottom: 6,
  },
  loungeTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.82, color: F.amber },
  loungeWho: { fontFamily: fonts.barlowRegular, fontSize: 10.5, color: F.muted, marginTop: 2 },
  loungeChips: { marginTop: 8 },
  ann: {
    backgroundColor: F.panel,
    borderWidth: 1,
    borderColor: F.line,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 11,
    marginBottom: 10,
  },
  annText: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: F.sub },
  search: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  searchBox: {
    flex: 1,
    minWidth: 0,
    backgroundColor: F.panel,
    borderWidth: 1,
    borderColor: F.line,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    color: F.text,
  },
  searchBoxOn: { borderColor: F.line2 },
  ask: { backgroundColor: F.amber, borderRadius: 12, paddingHorizontal: 14, minHeight: 44, justifyContent: 'center' },
  askText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: '#111' },
});


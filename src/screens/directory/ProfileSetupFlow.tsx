/**
 * PROFILE SETUP — the guided version of the community profile.
 *
 * ── WHY THIS EXISTS (owner 2026-09-19) ──────────────────────────────────────
 *
 * The editor put nine sections on one scroll and opened on PUBLIC DISPLAY
 * NAME — a blank text box. So the very first thing we asked of a new member
 * was to type, and the reward for doing it was invisible. Nine accounts had
 * produced ZERO started profiles. Not zero finished: zero started.
 *
 * Owner: "best practice says users will complete if it is easy in steps and
 * clear." This is that, and the design follows from where it actually failed:
 *
 *   TAPS BEFORE TYPING. Areas, involvement and open-to come first and are
 *   pure chip taps. By the time anyone meets a keyboard they have already
 *   invested three easy steps, which is the whole of the commitment effect.
 *
 *   NOBODY MEETS A BLANK BOX. "About my work" arrives pre-drafted from the
 *   member's own picks (aboutDraft.ts). Editing a sentence is a far smaller
 *   ask than writing one, and they can clear it.
 *
 *   EVERY STEP IS SKIPPABLE. A wizard that traps people is worse than a form.
 *   The only thing that gates is PUBLISHING, which is the server's rule
 *   anyway — `gaps` is passed in rather than re-derived so this screen can
 *   never disagree with the editor about what "ready" means.
 *
 *   IT RESUMES. Every step persists through the same save path as the editor,
 *   so leaving mid-way loses nothing and re-entry lands on the first thing
 *   still outstanding.
 *
 * ── THIS SCREEN OWNS NO STATE AND NO RULES ──────────────────────────────────
 *
 * Everything is a prop from MyProfileView: the same `persist`, the same
 * togglers, the same caps, the same publish path. That is deliberate. Two
 * surfaces editing one profile through two code paths is how they drift, and
 * the caps here would eventually disagree with the server. This is a
 * PRESENTATION of the editor, not a second editor.
 */
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { LIMITS, type CommunityProfile, type Taxonomy } from '../../features/directory/api';
import { draftAbout } from '../../features/directory/aboutDraft';
import { Banner, Chip, ChipWrap, CountHint, Helper, PrimaryButton } from './directoryBits';

type StepId = 'areas' | 'roles' | 'openTo' | 'name' | 'about' | 'review';

const STEPS: StepId[] = ['areas', 'roles', 'openTo', 'name', 'about', 'review'];

/** Copy lives in one table so the whole flow can be read at a glance. */
const COPY: Record<StepId, { kicker: string; title: string; helper: string }> = {
  areas: {
    kicker: 'STEP 1',
    title: 'Where does your audio life happen?',
    helper: 'Pick up to three. There is no wrong answer here — if you are still working it out, say so; that is an option too.',
  },
  roles: {
    kicker: 'STEP 2',
    title: 'How are you involved?',
    helper: 'Up to two. This is your relationship to the work, not your job title.',
  },
  openTo: {
    kicker: 'STEP 3',
    title: 'What are you open to?',
    helper: 'Up to three. Nobody can contact you about anything you have not chosen here — this list IS the permission.',
  },
  name: {
    kicker: 'STEP 4',
    title: 'What should people call you?',
    helper: 'This is the only name shown publicly. Your account name and email are never published.',
  },
  about: {
    kicker: 'STEP 5',
    title: 'A line about your work',
    helper: 'We have written a first draft from your own answers. Edit it, or clear it and write your own.',
  },
  review: {
    kicker: 'LAST STEP',
    title: 'Ready when you are',
    helper: 'Nothing here is public until you publish, and you can unpublish at any time.',
  },
};

export function ProfileSetupFlow({
  tax,
  p,
  saving,
  err,
  gaps,
  label,
  onToggleArea,
  onToggle,
  onEdit,
  onCommit,
  onPublish,
  onExit,
}: {
  tax: Taxonomy;
  p: CommunityProfile;
  saving: boolean;
  err: string | null;
  /** What the EDITOR says is still missing. Never re-derived here. */
  gaps: string[];
  label: (kind: keyof Taxonomy, slug: string) => string;
  onToggleArea: (slug: string) => void;
  onToggle: (key: 'specialties' | 'roles' | 'openTo', slug: string, cap: number) => void;
  /**
   * LOCAL edit, every keystroke. Split from onCommit on purpose: the editor
   * persists text on BLUR, and `persist` rolls back to the previous profile
   * when the server refuses — so saving per character would both hammer the
   * network and yank characters back out from under someone mid-sentence.
   */
  onEdit: (next: CommunityProfile) => void;
  /** Server write. Blur, a discrete tap, or leaving a text step. */
  onCommit: (next: CommunityProfile) => void;
  onPublish: () => void;
  /** Leave the guide for the full editor. Always available, never forced. */
  onExit: () => void;
}) {
  /**
   * Resume where they stopped. Derived from what is already SAVED rather than
   * remembered in local state, so it survives quitting the app entirely —
   * every step writes through the same server save path.
   */
  const firstOutstanding = useMemo<StepId>(() => {
    if (!p.areas.length) return 'areas';
    if (!p.roles.length) return 'roles';
    if (!p.openTo.length) return 'openTo';
    if (!p.displayName.trim()) return 'name';
    return 'review';
  }, [p.areas.length, p.roles.length, p.openTo.length, p.displayName]);

  const [step, setStep] = useState<StepId>(firstOutstanding);
  const idx = STEPS.indexOf(step);
  const copy = COPY[step];

  /** The draft is offered, never auto-saved: the member decides it is theirs. */
  const suggestion = useMemo(
    () => draftAbout(p, label as never),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [p.primaryArea, p.areas, p.roles, p.specialties, p.openTo],
  );

  const go = (d: 1 | -1) => {
    // Commit before leaving a typed step: on RN, tapping Next does not
    // reliably blur the TextInput first, and losing what someone just typed
    // because they pressed the obvious button would be the worst bug on a
    // screen whose entire job is making people finish.
    if (step === 'name' || step === 'about') onCommit(p);
    const next = STEPS[Math.min(STEPS.length - 1, Math.max(0, idx + d))];
    setStep(next);
  };

  return (
    <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled">
      {/* Why bother — stated once, at the top, where the decision is made. */}
      <Text style={st.why}>
        This is how other people in audio, and employers, find you. It takes about a minute and
        nothing is public until you say so.
      </Text>

      <ProgressDots index={idx} total={STEPS.length} />

      <Text style={st.kicker}>{copy.kicker}</Text>
      <Text accessibilityRole="header" style={st.title}>
        {copy.title}
      </Text>
      <Helper>{copy.helper}</Helper>

      {err ? <Banner tone="warn">{err}</Banner> : null}

      <View style={st.body}>
        {step === 'areas' ? (
          <>
            <ChipWrap>
              {tax.areas.map((a) => (
                <Chip
                  key={a.slug}
                  label={a.label}
                  on={p.areas.includes(a.slug)}
                  disabled={!p.areas.includes(a.slug) && p.areas.length >= LIMITS.areas}
                  onPress={() => onToggleArea(a.slug)}
                />
              ))}
            </ChipWrap>
            <CountHint used={p.areas.length} cap={LIMITS.areas} noun="areas" />
          </>
        ) : null}

        {step === 'roles' ? (
          <>
            <ChipWrap>
              {tax.roles.map((r) => (
                <Chip
                  key={r.slug}
                  label={r.label}
                  on={p.roles.includes(r.slug)}
                  disabled={!p.roles.includes(r.slug) && p.roles.length >= LIMITS.roles}
                  onPress={() => onToggle('roles', r.slug, LIMITS.roles)}
                />
              ))}
            </ChipWrap>
            <CountHint used={p.roles.length} cap={LIMITS.roles} noun="ways" />
          </>
        ) : null}

        {step === 'openTo' ? (
          <>
            <ChipWrap>
              {tax.openTo.map((o) => (
                <Chip
                  key={o.slug}
                  label={o.label}
                  on={p.openTo.includes(o.slug)}
                  disabled={!p.openTo.includes(o.slug) && p.openTo.length >= LIMITS.openTo}
                  onPress={() => onToggle('openTo', o.slug, LIMITS.openTo)}
                />
              ))}
            </ChipWrap>
            <CountHint used={p.openTo.length} cap={LIMITS.openTo} noun="topics" />
          </>
        ) : null}

        {step === 'name' ? (
          <TextInput
            value={p.displayName}
            onChangeText={(t) => onEdit({ ...p, displayName: t })}
            onBlur={() => onCommit(p)}
            placeholder="e.g. Sam Okafor, or Sam O."
            placeholderTextColor={colors.textMuted}
            style={st.input}
            maxLength={60}
            accessibilityLabel="Public display name"
          />
        ) : null}

        {step === 'about' ? (
          <>
            <TextInput
              value={p.about}
              onChangeText={(t) => onEdit({ ...p, about: t })}
              onBlur={() => onCommit(p)}
              placeholder="A sentence about the work you do."
              placeholderTextColor={colors.textMuted}
              style={[st.input, st.inputTall]}
              multiline
              maxLength={LIMITS.about}
              accessibilityLabel="About my work"
            />
            <CountHint used={p.about.length} cap={LIMITS.about} noun="characters" />
            {/* Offered, not imposed — and only while the field is untouched. */}
            {suggestion && !p.about.trim() ? (
              <Pressable
                onPress={() => onCommit({ ...p, about: suggestion })}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Use the suggested sentence: ${suggestion}`}
                style={st.suggest}
              >
                <Text style={st.suggestKicker}>USE THIS AS A START</Text>
                <Text style={st.suggestText}>{suggestion}</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}

        {step === 'review' ? (
          <View style={{ gap: 12 }}>
            <Summary title="Areas" values={p.areas.map((s) => label('areas', s))} />
            <Summary title="How you’re involved" values={p.roles.map((s) => label('roles', s))} />
            <Summary title="Open to" values={p.openTo.map((s) => label('openTo', s))} />
            <Summary title="Shown as" values={p.displayName ? [p.displayName] : []} />
            {p.about.trim() ? <Summary title="About" values={[p.about.trim()]} /> : null}

            {gaps.length ? (
              <Banner tone="info">
                Still needed before publishing: {gaps.join(', ')}. You can go back and add them, or
                leave your profile as a private draft.
              </Banner>
            ) : null}

            <PrimaryButton
              label={p.published ? 'Published' : 'Publish my profile'}
              onPress={onPublish}
              disabled={saving || p.published || gaps.length > 0}
              tone="green"
            />
            <Helper>
              Publishing asks you to confirm you are 18 or over. You can unpublish at any time and
              your earned credentials are never affected.
            </Helper>
          </View>
        ) : null}
      </View>

      {/* ── NAVIGATION ─────────────────────────────────────────────────────
          "Skip" is a peer of "Next", not hidden: a step you cannot pass is a
          step people quit on, and a half-built profile still beats none. */}
      <View style={st.nav}>
        <Pressable
          onPress={() => go(-1)}
          disabled={idx === 0}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back a step"
        >
          <Text style={[st.navLink, idx === 0 && st.navLinkOff]}>‹ Back</Text>
        </Pressable>

        {step === 'review' ? (
          <Pressable onPress={onExit} hitSlop={8} accessibilityRole="button" accessibilityLabel="Open the full editor">
            <Text style={st.navLink}>Full editor ›</Text>
          </Pressable>
        ) : (
          <View style={st.navRight}>
            <Pressable onPress={() => go(1)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Skip this step">
              <Text style={st.navSkip}>Skip</Text>
            </Pressable>
            <Pressable onPress={() => go(1)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Next step">
              <Text style={st.navNext}>Next ›</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Pressable onPress={onExit} hitSlop={8} accessibilityRole="button" accessibilityLabel="Leave the guide and use the full editor">
        <Text style={st.escape}>Prefer the full form? Open the editor.</Text>
      </Pressable>
    </ScrollView>
  );
}

/** Progress as dots. Announced as text, because dots say nothing out loud. */
function ProgressDots({ index, total }: { index: number; total: number }) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${index + 1} of ${total}`}
      accessibilityValue={{ min: 1, max: total, now: index + 1 }}
      style={st.dots}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          importantForAccessibility="no-hide-descendants"
          style={[st.dot, i === index && st.dotOn, i < index && st.dotDone]}
        />
      ))}
    </View>
  );
}

function Summary({ title, values }: { title: string; values: string[] }) {
  return (
    <View style={st.sum}>
      <Text style={st.sumTitle}>{title.toUpperCase()}</Text>
      <Text style={[st.sumBody, !values.length && st.sumEmpty]}>
        {values.length ? values.join(' · ') : 'Not set — optional'}
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  why: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 20, color: colors.textSub },

  dots: { flexDirection: 'row', gap: 7, paddingVertical: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2a2a31' },
  dotDone: { backgroundColor: colors.green },
  dotOn: { backgroundColor: colors.amber, width: 20 },

  kicker: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.3, color: colors.textMuted },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 21, color: colors.textPrimary, marginTop: -2 },
  body: { gap: 10, marginTop: 4 },

  input: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 10,
    backgroundColor: '#101013',
    paddingHorizontal: 12,
    paddingVertical: 11,
    minHeight: 48,
    fontFamily: fonts.barlowRegular,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputTall: { minHeight: 96, textAlignVertical: 'top' },

  suggest: {
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.5)',
    backgroundColor: 'rgba(255,198,77,.07)',
    borderRadius: 10,
    padding: 12,
    gap: 4,
    minHeight: 44,
  },
  suggestKicker: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.1, color: colors.amber },
  suggestText: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },

  sum: { gap: 2 },
  sumTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.1, color: colors.textMuted },
  sumBody: { fontFamily: fonts.barlowRegular, fontSize: 14.5, color: colors.textPrimary },
  sumEmpty: { color: colors.textSub, fontStyle: 'italic' },

  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, minHeight: 44 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  navLink: { fontFamily: fonts.barlowMedium, fontSize: 15, color: colors.textSecondary, paddingVertical: 10 },
  navLinkOff: { color: '#3a3a44' },
  navSkip: { fontFamily: fonts.barlowRegular, fontSize: 14.5, color: colors.textSub, paddingVertical: 10 },
  navNext: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 0.6, color: colors.amber, paddingVertical: 10 },

  escape: {
    fontFamily: fonts.barlowRegular,
    fontSize: 13,
    color: colors.textMuted,
    textDecorationLine: 'underline',
    textAlign: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
});

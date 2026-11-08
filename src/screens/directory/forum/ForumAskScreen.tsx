/**
 * The guided Ask form (approved mockup, screen 5). Similar topics and glossary
 * terms appear under the title, so a question that has an answer finds it
 * before it is posted. Each kind of category asks for what its posts need; the
 * same form does Edit and Repost.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { notify } from '../../../lib/confirm';
import { useLatchedPress } from '../../../lib/latch';
import { safeGoBack } from '../../../lib/safeGoBack';
import { fonts } from '../../../theme/tokens';
import {
  editPost,
  fetchForumHome,
  glossaryMatches,
  searchTopics,
  submitPost,
  type ForumCategory,
  type ForumRights,
} from '../../../features/forum/api';
import { clearDraft, readDraft, saveDraft } from '../../../features/forum/drafts';
import { useForumFlags } from '../../../features/forum/forumFlags';
import {
  ASK_SLUG,
  BODY_MAX,
  EMPTY_ASK,
  SEARCH_MIN,
  TITLE_MAX,
  askChoices,
  askFormOf,
  askProblem,
  composeAskBody,
  draftKey,
  glossaryWords,
  hiddenOutcomeNote,
  labKeyOf,
  parseAskBody,
  refusalNeedsProfile,
  RULES_NOT_SAVED,
  asksForRules,
  topicFrom,
  type AskFormKind,
} from '../../../features/forum/rules';
import type { AskValues, ForumSearchHit, TopicKind } from '../../../features/forum/types';
import { useForumRead } from '../../../features/forum/useForumRead';
import { Chip, ChipWrap } from '../directoryBits';
import {
  AmberButton,
  F,
  Field,
  FieldLabel,
  ForumHeader,
  ForumLoading,
  ForumUnreadable,
  LockedNotice,
  PickField,
  Popup,
  QuietButton,
  SampleStamp,
  forumStyles,
} from './forumBits';
import { AI_DISCLOSURE, RulesPopup } from './forumPopups';

type EditTarget = { postId: string; isOpening: boolean; body: string; title?: string; partial?: boolean; suggestion?: string };
type LabThread = { key: string; title: string };
type Params = { slug?: string; edit?: EditTarget; labThread?: LabThread };
type Nav = {
  navigate: (route: string, params?: Record<string, unknown>) => void;
  replace?: (route: string, params?: Record<string, unknown>) => void;
};

const IDEA_AREAS = ['Labs', 'Glossary', 'Calculators', 'Miking', 'App'];

const POST_LABEL: Record<AskFormKind, string> = {
  question: 'POST QUESTION',
  discussion: 'POST TOPIC',
  idea: 'POST IDEA',
  glossary: 'POST CORRECTION',
  bug: 'POST REPORT',
};

export function ForumAskScreen() {
  const route = useRoute();
  const { slug, edit, labThread } = (route.params ?? {}) as Params;
  const home = useForumRead(fetchForumHome, []);

  if (home.face === 'loading') {
    return (
      <View style={forumStyles.root}>
        <ForumHeader title={edit ? 'Edit your post' : 'Ask the Community'} />
        <ForumLoading />
      </View>
    );
  }
  if (home.face === 'unreadable' || !home.value) {
    return (
      <View style={forumStyles.root}>
        <ForumHeader title={edit ? 'Edit your post' : 'Ask the Community'} />
        <ForumUnreadable error={home.error} code={home.code} onRetry={() => void home.reload()} />
      </View>
    );
  }
  return <AskForm slug={slug} edit={edit} labThread={labThread} categories={home.value.categories} rights={home.value.rights} />;
}

function AskForm({
  slug,
  edit,
  labThread,
  categories,
  rights,
}: {
  slug?: string;
  edit?: EditTarget;
  labThread?: LabThread;
  categories: ForumCategory[];
  rights: ForumRights[] | null;
}) {
  const navigation = useNavigation() as unknown as Nav;
  const insets = useSafeAreaInsets();

  /** Only categories this member may start a topic in, and what to say when
   *  there is none, or when the one they came for is refused (askChoices). */
  const choices = useMemo(() => askChoices(categories, rights, slug), [categories, rights, slug]);
  const open = choices.open;
  const initial = choices.wantedRefused
    ? null
    : (open.find((c) => c.slug === slug) ?? open.find((c) => c.slug === ASK_SLUG) ?? open[0] ?? null);
  const [category, setCategory] = useState<ForumCategory | null>(
    edit ? (categories.find((c) => c.slug === slug) ?? null) : initial,
  );
  const form: AskFormKind = category ? askFormOf(category) : 'discussion';
  const canPostJob = !!category && !!rights?.find((r) => r.slug === category.slug)?.canPostJob;

  /** The guided answers, when this is an edit of a guided question. */
  const guided = edit?.isOpening ? parseAskBody(edit.body) : null;
  const [values, setValues] = useState<AskValues>(() => {
    if (!edit) return EMPTY_ASK;
    return { ...EMPTY_ASK, title: edit.title ?? '', ...(guided ?? { body: edit.body }) };
  });
  const touched = useRef(false);
  const clientId = useRef<string | null>(null);
  const set = useCallback((patch: Partial<AskValues>) => {
    touched.current = true;
    // A retry keeps its id so it lands once; a CHANGED form is a new post.
    clientId.current = null;
    setValues((v) => ({ ...v, ...patch }));
  }, []);
  const [lab, setLab] = useState<string | null>(null);
  const [job, setJob] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const [picking, setPicking] = useState(false);
  const [pickingLab, setPickingLab] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const flags = useForumFlags();

  /* ── Draft saved ─────────────────────────────────────────────────── */
  const draftName = draftKey({ slug: labThread ? `lab:${labThread.key}` : category?.slug });
  const [draftSaved, setDraftSaved] = useState(false);
  useEffect(() => {
    if (edit) return undefined;
    let live = true;
    void readDraft(draftName).then((stored) => {
      if (!live || !stored || touched.current) return;
      try {
        setValues({ ...EMPTY_ASK, ...(JSON.parse(stored) as Partial<AskValues>) });
      } catch {
        // Not ours to read: leave the form blank.
      }
    });
    return () => {
      live = false;
    };
  }, [draftName, edit]);
  useEffect(() => {
    if (edit || !touched.current) return undefined;
    let live = true;
    const t = setTimeout(() => {
      void saveDraft(draftName, hasStarted(values) ? JSON.stringify(values) : '').then((ok) => {
        if (live) setDraftSaved(ok && hasStarted(values));
      });
    }, 800);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [draftName, edit, values]);

  /* ── Similar topics while typing the title ───────────────────────── */
  const [similar, setSimilar] = useState<{ topics: ForumSearchHit[]; terms: string[] }>({ topics: [], terms: [] });
  const title = values.title;
  useEffect(() => {
    const q = title.trim();
    if (edit || q.length < SEARCH_MIN) {
      setSimilar({ topics: [], terms: [] });
      return undefined;
    }
    let live = true;
    const t = setTimeout(() => {
      // Optional: a failed read shows nothing, and the form still posts.
      void Promise.all([searchTopics(q), glossaryMatches(glossaryWords(q))]).then(([hits, terms]) => {
        if (live) setSimilar({ topics: hits.ok ? hits.value.slice(0, 3) : [], terms });
      });
    }, 350);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [title, edit]);

  /* ── Posting ─────────────────────────────────────────────────────── */
  // An edit changes the post's text, whatever form first wrote it.
  const shownForm: AskFormKind = labThread ? 'discussion' : edit ? (guided ? 'question' : 'discussion') : form;
  const replyEdit = !!edit && !edit.isOpening;
  const problem =
    replyEdit || labThread
      ? values.body.trim()
        ? null
        : 'Write something first.'
      : !edit && !category
        ? 'Choose a category first.'
        : askProblem(shownForm, values);

  const postNow = useCallback(async () => {
    if (problem || (!edit && !labThread && !category)) return;
    setPosting(true);
    setError(null);
    // The server has no rules agreement for this account (its check is on):
    // the popup comes back, and I AGREE records it there before posting.
    const refused = (r: { error: string; code: string | null }) => {
      setError(r.error);
      if (asksForRules(r.code)) setRulesOpen(true);
    };
    if (edit) {
      const body = guided ? composeAskBody(values) : values.body.trim();
      const r = await editPost(edit.postId, body, edit.isOpening ? values.title.trim() : undefined);
      setPosting(false);
      if (!r.ok) refused(r);
      else safeGoBack(navigation as never);
      return;
    }
    if (labThread) {
      clientId.current = clientId.current ?? Crypto.randomUUID();
      const r = await submitPost({ body: values.body.trim(), clientId: clientId.current, labThread });
      setPosting(false);
      if (!r.ok) {
        refused(r);
        return;
      }
      void clearDraft(draftName);
      const hidden = hiddenOutcomeNote(r.value);
      if (hidden) {
        clientId.current = null;
        setValues(EMPTY_ASK);
        setError(hidden);
        return;
      }
      if (navigation.replace) navigation.replace('ForumThread', { topicId: r.value.topicId });
      else navigation.navigate('ForumThread', { topicId: r.value.topicId });
      return;
    }
    const draft = topicFrom(form, values, {
      appVersion: Constants.expoConfig?.version ?? 'unknown',
      device: `${Platform.OS} ${String(Platform.Version)}`,
    });
    clientId.current = clientId.current ?? Crypto.randomUUID();
    const r = await submitPost({
      ...draft,
      topicKind: job ? ('job' as TopicKind) : draft.topicKind,
      clientId: clientId.current,
      category: category?.slug,
      labKey: lab ? labKeyOf(lab) : null,
    });
    setPosting(false);
    if (!r.ok) {
      refused(r);
      return;
    }
    void clearDraft(draftName);
    // A post the child-safety screen stopped is in no list, so the thread would
    // open empty: say so here instead.
    const hidden = hiddenOutcomeNote(r.value);
    if (hidden) {
      clientId.current = null;
      setValues(EMPTY_ASK);
      setError(hidden);
      return;
    }
    // The author sees their own post here, whatever the check decided.
    if (navigation.replace) navigation.replace('ForumThread', { topicId: r.value.topicId });
    else navigation.navigate('ForumThread', { topicId: r.value.topicId });
  }, [category, draftName, edit, form, guided, job, lab, labThread, navigation, problem, values]);

  const post = useLatchedPress(async () => {
    if (!flags.rulesAccepted) {
      setRulesOpen(true);
      return;
    }
    await postNow();
  });
  const acceptRules = useLatchedPress(async () => {
    const ok = await flags.acceptRules();
    setRulesOpen(false);
    if (ok) await postNow();
    else notify('Not saved', RULES_NOT_SAVED);
  });

  const headerTitle = labThread ? `Discuss: ${labThread.title}` : edit ? 'Edit your post' : (category?.name ?? 'Ask the Community');
  const headerSub = edit?.partial
    ? 'Only the start of your post is shown. What you repost replaces all of it.'
    : edit
      ? 'Checked again before others see it'
      : labThread
        ? 'Start the discussion for this lab'
        : 'Pick the category; we’ll show similar topics';

  if (!edit && !labThread && choices.open.length === 0) {
    return (
      <View style={forumStyles.root}>
        <ForumHeader title={headerTitle} />
        <LockedNotice
          solid
          action={
            refusalNeedsProfile(choices.refusalCode)
              ? { label: 'MY PROFILE', onPress: () => navigation.navigate('AudioCommunityDirectory', { tab: 'profile' }) }
              : undefined
          }
        >
          {choices.refusal ?? ''}
        </LockedNotice>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={forumStyles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ForumHeader title={headerTitle} sub={headerSub} />
      <ScrollView
        style={st.fill}
        contentContainerStyle={[st.form, { paddingBottom: 20 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <SampleStamp />
        {!edit && !labThread && choices.wantedRefused && choices.refusal ? (
          <Text style={st.error}>{`${choices.refusal} Choose another category below.`}</Text>
        ) : null}
        {!edit && !labThread ? (
          <View>
            <FieldLabel>CATEGORY</FieldLabel>
            <PickField label="Category" value={category?.name ?? 'Choose one'} onPress={() => setPicking(true)} />
          </View>
        ) : null}
        {(!edit || edit.isOpening) && !labThread ? (
          <View>
            <FieldLabel>TITLE</FieldLabel>
            <Field
              label="Title"
              value={values.title}
              onChangeText={(t) => set({ title: t })}
              maxLength={TITLE_MAX}
              placeholder={form === 'question' ? 'Vocals sound thin in my mixes' : 'A clear, short title'}
            />
          </View>
        ) : null}

        {similar.topics.length > 0 || similar.terms.length > 0 ? (
          <View style={st.sim}>
            <Text style={st.simHead}>SIMILAR · MAYBE ALREADY ANSWERED</Text>
            {similar.topics.map((t) => (
              <Pressable
                key={t.topicId}
                onPress={() => navigation.navigate('ForumThread', { topicId: t.topicId })}
                style={st.simRow}
                accessibilityRole="button"
                accessibilityLabel={t.title}
              >
                <Text style={st.simText}>
                  {t.solved ? <Text style={st.simBold}>✓ </Text> : null}
                  {t.title}
                </Text>
              </Pressable>
            ))}
            {similar.terms.map((term) => (
              <Pressable
                key={term}
                onPress={() => navigation.navigate('PublicGlossary', { query: term })}
                style={st.simRow}
                accessibilityRole="button"
                accessibilityLabel={`Glossary: ${term}`}
              >
                <Text style={st.simText}>
                  Glossary: <Text style={st.simBold}>{term}</Text>
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {edit?.suggestion ? (
          <View style={st.sim}>
            <Text style={st.simHead}>THE CORRECTION YOU ACCEPTED</Text>
            <Text style={st.simText}>{edit.suggestion}</Text>
          </View>
        ) : null}

        <FormFields form={shownForm} values={values} set={set} />

        {!edit && !labThread && form === 'question' ? (
          <View>
            <FieldLabel>LINK A LAB (OPTIONAL)</FieldLabel>
            <PickField label="Link a lab" value={lab ?? 'Choose a lab'} onPress={() => setPickingLab(true)} />
          </View>
        ) : null}
        {!edit && !labThread && canPostJob ? (
          <ChipWrap>
            <Chip label={job ? 'This is a job post ✓' : 'This is a job post'} on={job} onPress={() => setJob((j) => !j)} />
          </ChipWrap>
        ) : null}

        {error ? <Text style={st.error}>{error}</Text> : null}
        <View style={st.btnrow}>
          <QuietButton label="CANCEL" onPress={() => safeGoBack(navigation as never)} />
          <AmberButton
            label={edit ? 'REPOST' : labThread ? 'POST' : POST_LABEL[form]}
            onPress={post}
            busy={posting}
            disabled={!!problem}
            style={st.grow}
          />
        </View>
        {problem && hasStarted(values) ? <Text style={st.problem}>{problem}</Text> : null}
        {draftSaved ? <Text style={st.problem}>Draft saved on this phone.</Text> : null}
        <Text style={st.ai}>{AI_DISCLOSURE}</Text>
      </ScrollView>

      <Popup visible={picking} onClose={() => setPicking(false)} label="Choose a category">
        <PickList
          title="Choose a category"
          rows={open.map((c) => c.name)}
          onPick={(name) => {
            setCategory(open.find((c) => c.name === name) ?? category);
            setJob(false);
            setPicking(false);
          }}
        />
      </Popup>
      {pickingLab ? (
        <Popup visible onClose={() => setPickingLab(false)} label="Choose a lab">
          <PickList
            title="Link a lab"
            rows={labNames()}
            clearLabel={lab ? 'No lab' : undefined}
            onClear={() => {
              setLab(null);
              setPickingLab(false);
            }}
            onPick={(name) => {
              setLab(name);
              setPickingLab(false);
            }}
          />
        </Popup>
      ) : null}
      <RulesPopup visible={rulesOpen} onAccept={acceptRules} onClose={() => setRulesOpen(false)} />
    </KeyboardAvoidingView>
  );
}

const hasStarted = (v: AskValues) => Object.values(v).some((x) => x.trim().length > 0);

/** Required on the tap: the lab catalog is not in the start graph. */
function labNames(): string[] {
  return (require('../../../features/forum/labLinks') as typeof import('../../../features/forum/labLinks')).labNames();
}

function FormFields({
  form,
  values,
  set,
}: {
  form: AskFormKind;
  values: AskValues;
  set: (patch: Partial<AskValues>) => void;
}) {
  if (form === 'question') {
    return (
      <>
        <View>
          <FieldLabel>WHAT ARE YOU TRYING TO DO?</FieldLabel>
          <Field
            label="What are you trying to do?"
            value={values.trying}
            onChangeText={(t) => set({ trying: t })}
            placeholder="Get a fuller, warmer lead vocal for a podcast"
            multiline
            maxLength={BODY_MAX}
          />
        </View>
        <View>
          <FieldLabel>GEAR AND SIGNAL CHAIN</FieldLabel>
          <Field
            label="Gear and signal chain"
            value={values.gear}
            onChangeText={(t) => set({ gear: t })}
            placeholder="Condenser mic → interface → DAW"
            maxLength={BODY_MAX}
          />
        </View>
        <View>
          <FieldLabel>WHAT HAVE YOU TRIED?</FieldLabel>
          <Field
            label="What have you tried?"
            value={values.tried}
            onChangeText={(t) => set({ tried: t })}
            placeholder="Boosted 200 Hz; it got muddy"
            multiline
            maxLength={BODY_MAX}
          />
        </View>
      </>
    );
  }
  if (form === 'glossary') {
    return (
      <>
        <LabelledField label="TERM" value={values.term} onChange={(t) => set({ term: t })} />
        <LabelledField label="CURRENT TEXT (OPTIONAL)" value={values.current} onChange={(t) => set({ current: t })} multiline />
        <LabelledField label="PROPOSED TEXT" value={values.proposed} onChange={(t) => set({ proposed: t })} multiline />
        <LabelledField label="WHY SHOULD IT CHANGE?" value={values.reason} onChange={(t) => set({ reason: t })} multiline />
        <LabelledField label="SOURCE" value={values.source} onChange={(t) => set({ source: t })} />
      </>
    );
  }
  return (
    <>
      <LabelledField
        label={form === 'idea' ? 'YOUR IDEA' : form === 'bug' ? 'WHAT HAPPENED?' : 'YOUR POST'}
        value={values.body}
        onChange={(t) => set({ body: t })}
        multiline
      />
      {form === 'idea' ? (
        <View>
          <FieldLabel>WHICH PART OF THE APP?</FieldLabel>
          <ChipWrap>
            {IDEA_AREAS.map((a) => (
              <Chip key={a} label={a} on={values.area === a} onPress={() => set({ area: values.area === a ? '' : a })} />
            ))}
          </ChipWrap>
        </View>
      ) : null}
      {form === 'bug' ? <Text style={st.ai}>Your app version and device are added automatically.</Text> : null}
    </>
  );
}

function LabelledField({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  multiline?: boolean;
}) {
  return (
    <View>
      <FieldLabel>{label}</FieldLabel>
      <Field label={label} value={value} onChangeText={onChange} multiline={multiline} maxLength={BODY_MAX} />
    </View>
  );
}

function PickList({
  title,
  rows,
  onPick,
  clearLabel,
  onClear,
}: {
  title: string;
  rows: string[];
  onPick: (row: string) => void;
  clearLabel?: string;
  onClear?: () => void;
}) {
  const [q, setQ] = useState('');
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? rows.filter((r) => r.toLowerCase().includes(needle)) : rows;
  }, [q, rows]);
  return (
    <View style={st.pick}>
      <Text accessibilityRole="header" style={st.pickTitle}>
        {title}
      </Text>
      {rows.length > 12 ? (
        <TextInput
          value={q}
          onChangeText={setQ}
          style={st.pickSearch}
          placeholder="Search"
          placeholderTextColor={F.muted}
          accessibilityLabel="Search"
        />
      ) : null}
      <FlatList
        data={shown}
        keyExtractor={(r) => r}
        keyboardShouldPersistTaps="handled"
        style={st.pickList}
        ListHeaderComponent={
          clearLabel ? (
            <Pressable onPress={onClear} style={st.pickRow} accessibilityRole="button">
              <Text style={st.pickClear}>{clearLabel}</Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPick(item)}
            style={({ pressed }) => [st.pickRow, pressed && st.pressed]}
            accessibilityRole="button"
            accessibilityLabel={item}
          >
            <Text style={st.pickRowText}>{item}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const st = StyleSheet.create({
  fill: { flex: 1 },
  pressed: { opacity: 0.7 },
  form: { paddingHorizontal: 16, paddingTop: 4, gap: 11 },
  sim: { backgroundColor: F.raised, borderWidth: 1, borderColor: F.line, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  simHead: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, color: F.muted, marginBottom: 6 },
  simRow: { paddingVertical: 4 },
  simText: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: F.sub },
  simBold: { fontFamily: fonts.barlowSemiBold, color: F.amber },
  btnrow: { flexDirection: 'row', gap: 10 },
  grow: { flex: 1 },
  error: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: F.red },
  problem: { fontFamily: fonts.barlowRegular, fontSize: 12, color: F.muted },
  ai: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 16, color: F.muted },
  pick: {
    backgroundColor: F.raised,
    borderWidth: 1,
    borderColor: F.line2,
    borderRadius: 20,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexShrink: 1,
  },
  pickTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, color: F.text, marginBottom: 8 },
  pickSearch: {
    backgroundColor: F.panel,
    borderWidth: 1,
    borderColor: F.line2,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    color: F.text,
    marginBottom: 6,
  },
  pickList: { flexGrow: 0, maxHeight: 420 },
  pickRow: { minHeight: 44, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: F.line },
  pickRowText: { fontFamily: fonts.barlowRegular, fontSize: 14, color: F.text },
  pickClear: { fontFamily: fonts.barlowMedium, fontSize: 14, color: F.amber },
});

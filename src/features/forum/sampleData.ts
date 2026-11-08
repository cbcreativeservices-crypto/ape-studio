/**
 * SAMPLE forum: made-up people, posts and votes so every screen renders in the
 * browser and on a dev build while `forum_enabled` is false. The wording comes
 * from the approved mockup (Downloads/2026-11-01_COMMUNITY_FORUM_MOCKUP.html).
 *
 * Reached ONLY through api.ts, behind `sampleForumOn()` (needs __DEV__).
 * Everything changes in memory and resets when a state is opened. The category
 * list mirrors the live table as read on 2026-11-07 (34 rows).
 */
import { TITLE_MIN, orderPosts } from './rules.ts';
import { SAMPLE_TOPIC, sampleForumOn, sampleState } from './sampleSwitch.ts';
import { WELCOME_PARAGRAPHS, WELCOME_TITLE } from './welcome.ts';
import type { AdminAppeal, QueueItem } from './adminRows.ts';
import type { DirectoryCard, PublicCredential, PublicProfile } from '../directory/api.ts';
import type { GraduateCard } from '../directory/kindsApi.ts';
import type { MemberBadge } from '../directory/kinds.ts';
import type { VerifiedStatus, VerifierKind } from '../employer/verifierKind.ts';
import type {
  CategoryKind,
  FollowLevel,
  ForumAppeal,
  ForumAuthor,
  ForumBookmark,
  ForumCategory,
  ForumMe,
  ForumNotice,
  ForumPost,
  ForumResult,
  ForumRights,
  ForumSearchHit,
  ForumTopic,
  ForumTopicDetail,
  PostOutcome,
  ReactionKind,
  SubmitInput,
  TopicKind,
  TopicSort,
  TrackedKind,
  TrackedStatus,
  VerifiedKind,
} from './types.ts';

const ago = (minutes: number) => new Date(Date.now() - minutes * 60000).toISOString();
const minutesSince = (iso: string) => Math.max(0, (Date.now() - new Date(iso).getTime()) / 60000);
const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

/* ── People ──────────────────────────────────────────────────────────── */

function person(
  name: string,
  over: { verifiedKind?: VerifiedKind; graduate?: boolean; trust?: ForumAuthor['trust']; academy?: boolean } = {},
): ForumAuthor {
  return {
    name,
    token: `sample-${name.toLowerCase().replace(/[^a-z]+/g, '-')}`,
    verifiedKind: over.verifiedKind ?? null,
    graduate: over.graduate ?? false,
    trust: over.trust ?? 'member',
    former: false,
    academy: over.academy ?? false,
  };
}

const ME = person('Alex P.');
// The Academy's own account: no Report or Block on its posts (owner 2026-11-08).
const FOUNDER = person('Prof. Channing Booth', { trust: 'leader', academy: true });
const JORDAN = person('Jordan L.', { trust: 'new' });
// The same public token as her row in the sample directory: real data has one.
const MAYA = { ...person('Maya R.', { graduate: true, trust: 'regular' }), token: '00000000-0000-4000-9000-000000000001' };
const DIEGO = person('Diego M.');
const RK = person('Ravi K.', { graduate: true, trust: 'regular' });
const AV = person('Ana V.');
const HARBOR = person('Harbor Venue Group', { verifiedKind: 'employer', trust: 'member' });
const COASTAL = person('Coastal Technical College', { verifiedKind: 'institution', trust: 'member' });
const NORTHSIDE = person('Northside Production Rentals', { verifiedKind: 'company', trust: 'member' });
const LUIS = person('Luis N.');
const AIKO = person('Aiko K.', { graduate: true });

/* ── Categories (the live table) ─────────────────────────────────────── */

const GROUPS: { slug: string; name: string; rows: [string, string, CategoryKind?, TrackedKind?, string?][] }[] = [
  { slug: 'pinned', name: 'Pinned', rows: [['announcements', 'Announcements', 'announcements']] },
  {
    slug: 'pro_lounge',
    name: 'Pro Lounge',
    rows: [
      ['introductions', 'Introductions'],
      ['hiring-gigs', 'Hiring & Gigs'],
      ['graduate-qa', 'Graduate Q&A', 'qa'],
      ['industry-news', 'Industry News'],
    ],
  },
  {
    slug: 'learn',
    name: 'Learn',
    rows: [
      ['ask-the-community', 'Ask the Community', 'qa'],
      ['labs-lessons', 'Labs & Lessons', 'qa'],
      ['new-to-audio', 'New to Audio', 'qa'],
    ],
  },
  {
    slug: 'science-listening',
    name: 'Science & Listening',
    rows: [
      ['acoustics-sound-science', 'Acoustics & Sound Science'],
      ['hearing-psychoacoustics', 'Hearing & Psychoacoustics'],
      ['hearing-health-clinical', 'Hearing Health & Clinical'],
      ['assistive-listening', 'Assistive Listening'],
      ['forensic-audio', 'Forensic Audio'],
      ['underwater-ultrasonic', 'Underwater & Ultrasonic'],
    ],
  },
  {
    slug: 'create-perform',
    name: 'Create & Perform',
    rows: [
      ['live-sound-events', 'Live Sound & Events'],
      ['studio-mixing-mastering', 'Studio, Mixing & Mastering'],
      ['music-production-sound-design', 'Music Production & Sound Design'],
      ['musicians-artists', 'Musicians & Artists'],
      ['picture-games-immersive', 'Picture, Games & Immersive'],
      ['broadcast-podcast-streaming', 'Broadcast, Podcast & Streaming'],
      ['theatre-performing-arts', 'Theatre & Performing Arts'],
      ['worship-audio', 'Worship Audio'],
      ['dj-club-nightlife', 'DJ, Club & Nightlife'],
      ['touring-backline', 'Touring & Backline'],
    ],
  },
  {
    slug: 'tech-systems',
    name: 'Tech & Systems',
    rows: [
      ['installed-commercial-audio', 'Installed & Commercial Audio'],
      ['systems-networking', 'Systems & Networking'],
      ['electronics-gear-repair', 'Electronics, Gear & Repair'],
      ['software-dsp-ai', 'Software, DSP & AI'],
      ['preservation-restoration', 'Preservation & Restoration'],
      ['standards-compliance', 'Standards & Compliance'],
    ],
  },
  { slug: 'work', name: 'Work', rows: [['careers-business', 'Careers & Business']] },
  {
    slug: 'help-improve-the-app',
    name: 'Help Improve the App',
    rows: [
      ['ideas-requests', 'Ideas & Requests', 'tracked', 'idea'],
      ['glossary-corrections', 'Glossary Corrections', 'tracked', 'glossary'],
      ['bug-reports', 'Bug Reports', 'tracked', 'bug'],
    ],
  },
];

function categories(): ForumCategory[] {
  return GROUPS.flatMap((g, groupSort) =>
    g.rows.map(([slug, name, kind, trackedKind], i) => ({
      slug,
      name,
      groupSlug: g.slug,
      groupName: g.name,
      groupSort,
      sortOrder: i + 1,
      kind: kind ?? 'discussion',
      trackedKind: trackedKind ?? null,
      staffOnlyTopics: slug === 'announcements',
      jobsAllowed: slug === 'hiring-gigs' || slug === 'careers-business',
      labThreads: slug === 'labs-lessons',
      description: null,
      followLevel: followLevels.get(slug) ?? null,
    })),
  );
}

const nameOf = (slug: string) => categories().find((c) => c.slug === slug)?.name ?? slug;
const kindOf = (slug: string) => categories().find((c) => c.slug === slug)?.kind ?? 'discussion';

/* ── Topics and posts ────────────────────────────────────────────────── */

type SampleTopic = ForumTopic & {
  fields: Record<string, unknown>;
  trackedReason: string | null;
  posts: ForumPost[];
  opened?: boolean;
};

let serial = 1000;
const nextId = () => uid(++serial);

function post(
  author: ForumAuthor,
  body: string,
  minutes: number,
  over: Partial<ForumPost> = {},
): ForumPost {
  return {
    id: nextId(),
    isOpening: false,
    postKind: 'reply',
    body,
    author,
    isMine: author === ME,
    modState: 'published',
    modReason: null,
    modRule: null,
    pendingState: null,
    pendingBody: null,
    urgentCategory: null,
    isSolution: false,
    helpfulCount: 0,
    thanksCount: 0,
    insightfulCount: 0,
    myReactions: [],
    quotePostId: null,
    quoteExcerpt: null,
    correctionOfPostId: null,
    correctionState: null,
    labKeys: [],
    safetyNote: false,
    edited: false,
    isFirstPost: false,
    bookmarked: false,
    publishedAt: ago(minutes),
    createdAt: ago(minutes),
    // The server after the 2026-11-07 package: it says whether a post waits
    // for its author's edit, and whom it mentions.
    pleaseEdit: false,
    mentions: [],
    ...over,
  };
}

function topic(
  id: string,
  slug: string,
  title: string,
  author: ForumAuthor,
  minutes: number,
  over: Partial<SampleTopic> = {},
): SampleTopic {
  const kind = kindOf(slug);
  const topicKind: TopicKind =
    over.topicKind ?? (kind === 'qa' ? 'question' : kind === 'announcements' ? 'announcement' : 'discussion');
  const posts = over.posts ?? [post(author, title, minutes, { isOpening: true, postKind: 'opening' })];
  return {
    id,
    categorySlug: slug,
    categoryName: nameOf(slug),
    title,
    topicKind,
    author,
    isMine: author === ME,
    modState: 'published',
    trackedStatus: null,
    solved: false,
    replyCount: posts.length - 1,
    voteCount: 0,
    myVote: false,
    pinned: false,
    locked: false,
    isNewMember: false,
    labKey: null,
    unread: false,
    firstUnreadPostId: null,
    // The server after the 2026-11-07 package: a topic opened before, and its
    // reason and area in the list itself.
    everRead: true,
    detailKnown: true,
    area: null,
    lastPostAt: ago(minutes),
    createdAt: ago(minutes),
    fields: {},
    trackedReason: null,
    posts,
    ...over,
  };
}

function idea(
  n: number,
  title: string,
  votes: number,
  mine: boolean,
  status: TrackedStatus,
  area: string,
  reason: string | null = null,
): SampleTopic {
  return topic(uid(300 + n), 'ideas-requests', title, n % 2 ? AV : LUIS, 1440 * n, {
    topicKind: 'idea',
    voteCount: votes,
    myVote: mine,
    trackedStatus: status,
    trackedReason: reason,
    fields: { area },
  });
}

function seed(): SampleTopic[] {
  const seen = sampleState()?.welcomeSeen ?? true;
  const solution = post(
    MAYA,
    "Ring out the wedge before soundcheck: raise its level slowly until it just starts to ring, then cut that band 3–6 dB on the wedge's graphic. Also check the mic is pointed away from the wedge.",
    8,
    { isSolution: true, helpfulCount: 6, thanksCount: 3, insightfulCount: 1, myReactions: ['helpful'], bookmarked: true },
  );
  const opener = post(
    JORDAN,
    'TRYING TO: Stop a ring around 2.5 kHz from the lead vocal wedge\nGEAR: Dynamic vocal mic · 12" wedge · 31-band graphic\nTRIED: Lowered the master; it still comes back',
    12,
    { isOpening: true, postKind: 'opening', isFirstPost: true, labKeys: ['gain-staging'] },
  );
  const diego = post(
    DIEGO,
    'The Mic Placement lab shows why the rear of a cardioid should face the wedge. That helped me a lot.',
    5,
    { helpfulCount: 2 },
  );
  const luis = post(LUIS, 'Check the graphic is on the wedge send and not across the main mix.', 3);
  const aiko = post(AIKO, 'Welcome, Jordan. As @Maya R. says, a small cut goes a long way. Watch your gain and the feedback stays down.', 2);

  return [
    topic(SAMPLE_TOPIC.welcome, 'announcements', WELCOME_TITLE, FOUNDER, minutesSince('2026-11-02T12:00:00Z'), {
      pinned: true,
      unread: !seen,
      everRead: seen,
      posts: [
        post(FOUNDER, WELCOME_PARAGRAPHS.join('\n\n'), minutesSince('2026-11-02T12:00:00Z'), {
          isOpening: true,
          postKind: 'opening',
          thanksCount: 24,
          helpfulCount: 3,
          myReactions: ['thanks'],
        }),
      ],
    }),
    topic(SAMPLE_TOPIC.solved, 'ask-the-community', 'Feedback squeals at the same frequency every night. Where do I start?', JORDAN, 12, {
      isNewMember: true,
      solved: true,
      posts: [opener, solution, diego, luis, aiko],
    }),
    topic(SAMPLE_TOPIC.correction, 'new-to-audio', 'How much does a 3 dB cut really change?', LUIS, 400, {
      posts: correctionPosts(),
    }),
    topic(uid(201), 'labs-lessons', 'Gain staging lab: why does PROC read −24 at the bottom edge?', RK, 60, {
      solved: true,
      labKey: 'gain-staging',
      replyCount: 7,
    }),
    topic(uid(202), 'glossary-corrections', 'Glossary: "Haas effect" range should be 1–40 ms, not 5–35', AV, 180, {
      topicKind: 'glossary',
      trackedStatus: 'planned',
      replyCount: 3,
    }),
    topic(SAMPLE_TOPIC.discussion, 'live-sound-events', 'What is your first move on a festival changeover?', AIKO, 240, {
      posts: [
        post(AIKO, 'Twenty minutes, a new band and no soundcheck. What do you touch first?', 240, {
          isOpening: true,
          postKind: 'opening',
        }),
        post(DIEGO, 'Line check from the stage box before anything else, so I know every input arrives.', 220, {
          helpfulCount: 1,
        }),
        post(MAYA, 'Monitors first. The band relaxes the moment they can hear themselves.', 200, {
          helpfulCount: 9,
          insightfulCount: 2,
        }),
        post(LUIS, 'Mute everything, then bring up one channel at a time with the engineer on the talkback.', 150),
      ],
    }),
    topic(uid(203), 'ask-the-community', 'Why do my vocals sound thin after EQ?', DIEGO, 2 * 1440, { solved: true, replyCount: 5 }),
    topic(uid(204), 'new-to-audio', 'What does gain actually change?', LUIS, 3 * 1440, { replyCount: 0, isNewMember: true }),
    topic(SAMPLE_TOPIC.mine, 'ask-the-community', 'Why does my sub rattle the stage on one note?', ME, 90, {
      posts: [
        post(ME, 'TRYING TO: Stop a rattle on one bass note\nGEAR: Dual 18" subs on a riser\nTRIED: Lowered the crossover', 90, {
          isOpening: true,
          postKind: 'opening',
        }),
        post(RK, 'That is often the riser panels and not the sub. Try weighting the panel.', 70, { helpfulCount: 4 }),
        post(ME, 'Thanks, I will check the panel at load-in tomorrow.', 40, {
          modState: 'pending',
          publishedAt: null,
        }),
        post(ME, 'You clearly did not read my question.', 30, {
          modState: 'blocked',
          modRule: 'respect',
          modReason: 'This reply was removed because it insults another member. Criticize the mix, not the person.',
          publishedAt: null,
        }),
      ],
    }),
    topic(SAMPLE_TOPIC.empty, 'careers-business', 'Where do freelancers find their first corporate gigs?', LUIS, 4 * 1440, { replyCount: 2 }),
    topic(uid(211), 'hiring-gigs', 'Hiring two A2s for our spring season', HARBOR, 120, { topicKind: 'job', replyCount: 6 }),
    topic(uid(212), 'introductions', "First festival as a monitor engineer: what I wish I'd known", MAYA, 300, { replyCount: 11 }),
    topic(uid(213), 'hiring-gigs', 'Adjunct instructor wanted: live sound, evenings', COASTAL, 1440, { topicKind: 'job', replyCount: 2 }),
    topic(uid(214), 'industry-news', 'New line array in our rental stock: open demo day', NORTHSIDE, 2 * 1440, { replyCount: 4 }),
    idea(1, 'A lab on wireless mic frequency coordination', 48, true, 'in_progress', 'Labs', 'building it for the next update.'),
    idea(2, 'Offline mode for the glossary', 31, false, 'planned', 'Glossary'),
    idea(3, 'Dark-room red light mode for live shows', 22, true, 'shipped', 'App', 'v1.1: Now in Settings › Low-Light Production Mode.'),
    idea(4, 'More Latin percussion miking lessons', 9, false, 'under_review', 'Miking'),
    idea(5, 'Export calculator results to CSV', 4, false, 'under_review', 'Calculators'),
  ];
}

function correctionPosts(): ForumPost[] {
  const opening = post(LUIS, 'TRYING TO: Understand what a 3 dB cut does to my wedge', 400, { isOpening: true, postKind: 'opening' });
  const mine = post(ME, 'A 3 dB cut halves the voltage going to the wedge.', 380);
  const correction = post(RK, 'A 3 dB cut halves the power. It takes 6 dB to halve the voltage.', 300, {
    postKind: 'correction',
    correctionOfPostId: mine.id,
    correctionState: 'suggested',
  });
  return [opening, mine, correction];
}

function seedNotices(): ForumNotice[] {
  const notice = (id: number, over: Partial<ForumNotice>): ForumNotice => ({
    id,
    postId: uid(900 + id),
    kind: 'held',
    rule: null,
    excerpt: null,
    message: null,
    automated: true,
    expiresAt: null,
    readAt: null,
    createdAt: ago(id * 10),
    topicId: null,
    ...over,
  });
  return [
    notice(1, {
      kind: 'held',
      message: 'Your reply is waiting for a quick review before others can see it. Only you can see it for now.',
    }),
    notice(2, {
      kind: 'blocked',
      rule: 'respect',
      message: 'This reply was removed because it insults another member. Criticize the mix, not the person.',
      excerpt: '…only an idiot would…',
    }),
  ];
}

let topics: SampleTopic[] = [];
let notices: ForumNotice[] = [];
let appeals: ForumAppeal[] = [];
const followLevels = new Map<string, FollowLevel>();
let seededFor: string | null = null;

/** Fresh data each time a state is opened. */
function ready(): SampleTopic[] {
  const id = sampleState()?.id ?? null;
  if (id !== seededFor || topics.length === 0) {
    seededFor = id;
    followLevels.clear();
    queue = null;
    adminAppeals = null;
    reminders.clear();
    topics = seed();
    notices = seedNotices();
    appeals = [];
  }
  return topics;
}

const find = (id: string): SampleTopic | undefined => ready().find((t) => t.id === id);
const findPost = (id: string): { topic: SampleTopic; post: ForumPost } | undefined => {
  for (const t of ready()) {
    const p = t.posts.find((x) => x.id === id);
    if (p) return { topic: t, post: p };
  }
  return undefined;
};

function bare(t: SampleTopic): ForumTopic {
  const { fields, posts: _p, opened: _o, ...row } = t;
  return { ...row, area: typeof fields.area === 'string' ? fields.area : null };
}

/* ── Reads ───────────────────────────────────────────────────────────── */

function rightsFor(slug: string, pro: boolean): ForumRights {
  const c = categories().find((x) => x.slug === slug);
  const proOnly = c?.groupSlug === 'pro_lounge';
  const barred = proOnly && !pro;
  const staff = !!c?.staffOnlyTopics;
  const refusal = sampleState()?.refusal ?? null;
  return {
    slug,
    proOnly,
    canStartTopic: !barred && !staff && !refusal,
    canReply: !barred && !refusal,
    canPostJob: false,
    reason: refusal ?? (barred ? 'pro_lounge_members_only' : staff ? 'staff_only' : null),
  };
}

export function sampleHome(): {
  categories: ForumCategory[];
  rights: ForumRights[];
  me: ForumMe;
  announcements: ForumTopic[];
} {
  const pro = sampleState()?.pro ?? false;
  const empty = sampleState()?.face === 'empty';
  ready();
  const unread = notices.filter((n) => !n.readAt).length;
  return {
    categories: categories(),
    rights: categories().map((c) => rightsFor(c.slug, pro)),
    me: {
      canPost: true,
      reason: null,
      trust: empty ? 'new' : 'member',
      mutedUntil: null,
      unreadNotices: empty ? 0 : unread,
      rulesAcceptedAt: null,
      badges: empty
        ? []
        : [
            { slug: 'first-solution', name: 'First Solution', awardedAt: ago(4000) },
            { slug: 'welcomer', name: 'Welcomer', awardedAt: ago(9000) },
          ],
    },
    announcements: empty ? [] : ready().filter((t) => t.categorySlug === 'announcements').map(bare),
  };
}

export function sampleTopics(category: string | null, sort: TopicSort): ForumTopic[] {
  if (sampleState()?.face === 'empty') return [];
  markUnread();
  const pool = ready().filter(
    (t) =>
      (category === null ? t.categorySlug !== 'announcements' : t.categorySlug === category) &&
      (t.modState === 'published' || t.isMine),
  );
  const rows = sort === 'unanswered' ? pool.filter((t) => t.topicKind === 'question' && !t.solved && t.replyCount === 0) : pool;
  const at = (t: ForumTopic) => t.lastPostAt ?? t.createdAt;
  const score = (t: SampleTopic) => t.posts.reduce((n, p) => n + p.helpfulCount + p.thanksCount, 0) + t.replyCount * 2;
  return [...rows]
    .sort((a, b) =>
      sort === 'top_week' ? score(b) - score(a) : at(a) < at(b) ? 1 : -1,
    )
    .map(bare);
}

/** One row shows the unread dot; its tap lands on the third post. */
function markUnread(): void {
  const t = find(SAMPLE_TOPIC.discussion);
  if (t && !t.opened) {
    t.unread = true;
    t.firstUnreadPostId = t.posts[2]?.id ?? null;
  }
}

/** The lounge as one feed, in the sort asked for, as the server does (the
 *  harness's sort chips did nothing: UI-1-09). */
export function sampleLounge(sort: TopicSort = 'latest'): ForumTopic[] {
  if (sampleState()?.face === 'empty') return [];
  const lounge = categories().filter((c) => c.groupSlug === 'pro_lounge').map((c) => c.slug);
  const at = (t: ForumTopic) => t.lastPostAt ?? t.createdAt;
  const score = (t: SampleTopic) => t.posts.reduce((n, p) => n + p.helpfulCount + p.thanksCount, 0) + t.replyCount * 2;
  const pool = ready().filter((t) => lounge.includes(t.categorySlug));
  const rows = sort === 'unanswered' ? pool.filter((t) => !t.solved && t.replyCount === 0) : pool;
  return [...rows]
    .sort((a, b) => (sort === 'top_week' ? score(b) - score(a) : at(a) < at(b) ? 1 : -1))
    .map(bare);
}

export function sampleThread(id: string): { topic: ForumTopicDetail; posts: ForumPost[]; rights: ForumRights | null } {
  const t = find(id) ?? ready()[0];
  const kind = kindOf(t.categorySlug);
  return {
    topic: {
      id: t.id,
      categorySlug: t.categorySlug,
      categoryName: t.categoryName,
      categoryKind: kind,
      title: t.title,
      topicKind: t.topicKind,
      fields: t.fields,
      labKey: t.labKey,
      author: t.author,
      isMine: t.isMine,
      modState: t.modState,
      trackedStatus: t.trackedStatus,
      trackedReason: t.trackedReason,
      solutionPostId: t.posts.find((p) => p.isSolution)?.id ?? null,
      solutionMarkedByName: null,
      replyCount: t.replyCount,
      voteCount: t.voteCount,
      myVote: t.myVote,
      pinned: t.pinned,
      locked: t.locked,
      canMarkSolution: kind === 'qa' && t.isMine,
      canVote: t.topicKind === 'idea',
      followLevel: null,
      createdAt: t.createdAt,
    },
    posts: orderPosts(t.posts, kind === 'qa').map((p) => ({ ...p })),
    rights: rightsFor(t.categorySlug, sampleState()?.pro ?? false),
  };
}

export function sampleSearch(q: string): ForumSearchHit[] {
  const words = q.toLowerCase().split(/\s+/).filter((w) => w.length >= 3);
  return ready()
    .filter((t) => t.modState === 'published' && words.some((w) => t.title.toLowerCase().includes(w)))
    .slice(0, 8)
    .map((t) => ({ topicId: t.id, title: t.title, categorySlug: t.categorySlug, solved: t.solved, replyCount: t.replyCount }));
}

export function sampleGlossary(words: string[]): string[] {
  const terms = ['Proximity effect', 'Gain staging', 'Feedback', 'Equalizer', 'Phantom power'];
  const hits = terms.filter((t) => words.some((w) => t.toLowerCase().includes(w)));
  return hits.length > 0 ? hits.slice(0, 2) : words.includes('vocals') ? ['Proximity effect'] : [];
}

export function sampleModeration(): { notices: ForumNotice[]; appeals: ForumAppeal[] } {
  ready();
  return { notices: notices.map((n) => ({ ...n })), appeals: [...appeals] };
}

/* ── Writes ──────────────────────────────────────────────────────────── */

/** Try the moderator in the sample: "idiot" is removed, "review" is held. */
function verdict(text: string): { state: string; modState: string; reason: string | null; rule: string | null } {
  if (/idiot/i.test(text)) {
    return {
      state: 'blocked',
      modState: 'blocked',
      rule: 'respect',
      reason: 'This reply was removed because it insults another member. Criticize the mix, not the person.',
    };
  }
  if (/review/i.test(text)) return { state: 'held', modState: 'held', rule: null, reason: null };
  return { state: 'published', modState: 'published', rule: null, reason: null };
}

function refuse<T>(code: string, error: string): ForumResult<T> {
  return { ok: false, error, code };
}

/** The server lands a post once per clientId: so does the sample, so the
 *  harness shows a repeated send as the one post (CODE-1-05). */
const landed = new Map<string, PostOutcome>();

export function sampleSubmit(input: SubmitInput): ForumResult<PostOutcome> {
  if (!sampleForumOn()) return refuse('not_allowed', 'Sample is off.');
  const again = input.clientId ? landed.get(input.clientId) : undefined;
  if (again) return { ok: true, value: again };
  const r = sampleSubmitNew(input);
  if (r.ok && input.clientId) landed.set(input.clientId, r.value);
  return r;
}

function sampleSubmitNew(input: SubmitInput): ForumResult<PostOutcome> {
  const v = verdict(input.body);
  const fresh = post(ME, input.body, 0, {
    modState: v.modState,
    modRule: v.rule,
    modReason: v.reason,
    publishedAt: v.modState === 'published' ? ago(0) : null,
    quotePostId: input.quotePostId ?? null,
    quoteExcerpt: input.quoteExcerpt ?? null,
    labKeys: input.labKey ? [input.labKey] : [],
    postKind: input.correctionOf ? 'correction' : 'reply',
    correctionOfPostId: input.correctionOf ?? null,
    correctionState: input.correctionOf ? 'suggested' : null,
  });
  if (input.labThread) {
    const { key, title } = input.labThread;
    const existing = ready().find((t) => t.labKey === key);
    const t =
      existing ??
      topic(nextId(), 'labs-lessons', `Lab: ${title}`, FOUNDER, 0, { labKey: key, posts: [] });
    if (!existing) topics.unshift(t);
    t.posts.push(fresh);
    return { ok: true, value: { postId: fresh.id, topicId: t.id, state: v.state, reason: v.reason, urgentCategory: null } };
  }
  if (input.topicId) {
    const t = find(input.topicId);
    if (!t) return refuse('not_found', 'This is no longer available.');
    t.posts.push(fresh);
    if (v.modState === 'published') t.replyCount += 1;
    return { ok: true, value: { postId: fresh.id, topicId: t.id, state: v.state, reason: v.reason, urgentCategory: null } };
  }
  const slug = input.category ?? 'ask-the-community';
  if ((input.title ?? '').trim().length < TITLE_MIN) return refuse('bad_title', 'The title needs at least 5 characters.');
  const id = nextId();
  const t = topic(id, slug, input.title ?? '', ME, 0, {
    topicKind: input.topicKind,
    fields: input.fields ?? {},
    modState: v.modState,
    trackedStatus: kindOf(slug) === 'tracked' ? 'under_review' : null,
    posts: [{ ...fresh, isOpening: true, postKind: 'opening' }],
  });
  topics.unshift(t);
  return {
    ok: true,
    value: { postId: t.posts[0].id, topicId: id, state: v.state, reason: v.reason, urgentCategory: null },
  };
}

export function sampleEdit(postId: string, body: string, title?: string): ForumResult<PostOutcome> {
  const found = findPost(postId);
  // A notice's post is not in a thread here: an edit of it simply clears.
  if (!found) {
    notices = notices.filter((n) => n.postId !== postId);
    return { ok: true, value: { postId, topicId: '', state: 'published', reason: null, urgentCategory: null } };
  }
  const v = verdict(body);
  Object.assign(found.post, {
    body,
    modState: v.modState,
    modRule: v.rule,
    modReason: v.reason,
    edited: true,
    // As the server does: an edit of a published post keeps its place and its
    // date (forum-moderate sets edited_at only); a post first published by
    // this edit is dated now (UI-2-06).
    publishedAt: found.post.publishedAt ?? (v.modState === 'published' ? ago(0) : null),
  });
  if (title && found.post.isOpening) found.topic.title = title;
  if (v.modState === 'published') found.topic.replyCount = found.topic.posts.filter((p) => !p.isOpening && p.modState === 'published').length;
  return { ok: true, value: { postId, topicId: found.topic.id, state: v.state, reason: v.reason, urgentCategory: null } };
}

export function sampleDelete(postId: string): true {
  const found = findPost(postId);
  if (found) {
    found.topic.posts = found.topic.posts.filter((p) => p.id !== postId);
    if (found.post.isOpening) topics = topics.filter((t) => t.id !== found.topic.id);
  }
  return true;
}

export function sampleReact(postId: string, kind: ReactionKind, on: boolean): { helpful: number; thanks: number; insightful: number } {
  const found = findPost(postId);
  if (found) {
    const p = found.post;
    const key = `${kind}Count` as 'helpfulCount' | 'thanksCount' | 'insightfulCount';
    const had = p.myReactions.includes(kind);
    if (on !== had) {
      p[key] += on ? 1 : -1;
      p.myReactions = on ? [...p.myReactions, kind] : p.myReactions.filter((k) => k !== kind);
    }
    return { helpful: p.helpfulCount, thanks: p.thanksCount, insightful: p.insightfulCount };
  }
  return { helpful: 0, thanks: 0, insightful: 0 };
}

export function sampleMarkSolution(topicId: string, postId: string | null): true {
  const t = find(topicId);
  if (t) {
    for (const p of t.posts) p.isSolution = p.id === postId;
    t.solved = postId !== null;
  }
  return true;
}

export function sampleMarkRead(topicId: string): void {
  const t = find(topicId);
  if (t) {
    t.unread = false;
    t.opened = true;
  }
}

export function sampleBlock(token: string): true {
  topics = ready()
    .filter((t) => t.author.token !== token)
    .map((t) => ({ ...t, posts: t.posts.filter((p) => p.author.token !== token) }));
  return true;
}

export function sampleVote(topicId: string, on: boolean): number {
  const t = find(topicId);
  if (!t) return 0;
  if (on !== t.myVote) {
    t.voteCount += on ? 1 : -1;
    t.myVote = on;
  }
  return t.voteCount;
}

export function sampleFollow(category: string, level: FollowLevel): true {
  followLevels.set(category, level);
  return true;
}

export function sampleAppeal(postId: string): true {
  appeals.push({ id: nextId(), postId, status: 'open' });
  return true;
}

export function sampleNoticeRead(id: number): void {
  const n = notices.find((x) => x.id === id);
  if (n) n.readAt = ago(0);
}


/* ── Launch set ──────────────────────────────────────────────────────── */

export function sampleBookmarks(): ForumBookmark[] {
  if (sampleState()?.face === 'empty') return [];
  return ready().flatMap((t) =>
    t.posts
      .filter((p) => p.bookmarked)
      .map((p) => ({
        postId: p.id,
        topicId: t.id,
        topicTitle: t.title,
        excerpt: p.body.slice(0, 160),
        remindAt: reminders.get(p.id) ?? null,
      })),
  );
}

const reminders = new Map<string, string>();

export function sampleSetBookmark(postId: string, on: boolean, remindAt: string | null): true {
  const found = findPost(postId);
  if (found) found.post.bookmarked = on;
  if (on && remindAt) reminders.set(postId, remindAt);
  else reminders.delete(postId);
  return true;
}

export function sampleResolveCorrection(postId: string, accept: boolean): true {
  const found = findPost(postId);
  if (found) found.post.correctionState = accept ? 'accepted' : 'dismissed';
  return true;
}

export function sampleLabThread(key: string): string | null {
  return ready().find((t) => t.labKey === key)?.id ?? null;
}

/* ── Directory ───────────────────────────────────────────────────────── */

type SampleMember = DirectoryCard & { kind: VerifierKind | null; graduate: boolean; latest: string | null; at: number };

function member(
  n: number,
  displayName: string,
  primaryArea: string,
  over: Partial<SampleMember> = {},
): SampleMember {
  return {
    publicToken: `00000000-0000-4000-9000-${String(n).padStart(12, '0')}`,
    displayName,
    primaryArea,
    specialties: [],
    roles: [],
    countryCode: 'US',
    workPref: 'either',
    credentialCount: 0,
    contactEnabled: true,
    kind: null,
    graduate: false,
    latest: null,
    at: n,
    ...over,
  };
}

const MEMBERS: SampleMember[] = [
  member(1, 'Maya R.', 'Live Sound & Events', { graduate: true, credentialCount: 2, latest: 'Live Sound Technician credential' }),
  member(2, 'Tomás S.', 'Studio & Recording', { graduate: true, credentialCount: 2, latest: 'Audio Fundamentals + Studio credential' }),
  member(3, 'Aiko K.', 'Broadcast', { graduate: true, credentialCount: 1, latest: 'Broadcast Audio credential' }),
  member(4, 'Bree O.', 'Live Sound & Events', { graduate: true, credentialCount: 1, latest: 'Monitor Engineering credential' }),
  member(5, 'Luis N.', 'Worship Audio', { graduate: true, credentialCount: 1, latest: 'Worship Audio credential' }),
  member(6, 'Northside Production Rentals', 'Rental house', { kind: 'company', countryCode: 'US' }),
  member(7, 'Harbor Venue Group', 'Hiring: A1 / A2', { kind: 'employer' }),
  member(8, 'Coastal Technical College', 'Audio technology program', { kind: 'institution' }),
  member(9, 'Dana W.', 'Live sound instructor', { kind: 'instructor', graduate: true, credentialCount: 3, latest: 'Live Sound Technician credential' }),
  member(10, 'Diego M.', 'Studio & Recording', {}),
];

const card = (m: SampleMember): DirectoryCard => {
  const { kind: _k, graduate: _g, latest: _l, at: _a, ...row } = m;
  return row;
};

function directoryFails(): { status: 'error'; error: string } | null {
  return sampleState()?.face === 'unreadable'
    ? { status: 'error', error: 'No connection. Check your signal and try again.' }
    : null;
}

export function sampleMembers(f: { q?: string }): { status: 'ok'; results: DirectoryCard[]; total: number } | { status: 'error'; error: string } {
  const bad = directoryFails();
  if (bad) return bad;
  if (sampleState()?.face === 'empty') return { status: 'ok', results: [], total: 0 };
  const q = (f.q ?? '').trim().toLowerCase();
  const rows = MEMBERS.filter((m) => !q || m.displayName.toLowerCase().includes(q));
  return { status: 'ok', results: rows.map(card), total: rows.length };
}

export function sampleGraduates():
  | { status: 'ok'; results: GraduateCard[]; total: number }
  | { status: 'error'; error: string } {
  const bad = directoryFails();
  if (bad) return bad;
  if (sampleState()?.face === 'empty') return { status: 'ok', results: [], total: 0 };
  const rows = MEMBERS.filter((m) => m.graduate).map((m) => ({
    ...card(m),
    latestCredential: m.latest,
    verifiedKind: m.kind,
  }));
  return { status: 'ok', results: rows, total: rows.length };
}

export function sampleBadges(tokens: string[]): Map<string, MemberBadge> {
  return new Map(
    MEMBERS.filter((m) => tokens.includes(m.publicToken)).map((m) => [
      m.publicToken,
      { verifiedKind: m.kind, graduate: m.graduate },
    ]),
  );
}

export function sampleProfile(token: string): {
  profile: PublicProfile;
  credentials: PublicCredential[];
  credentialsState: 'ok' | 'unavailable';
} | null {
  const m = MEMBERS.find((x) => x.publicToken === token);
  if (!m) return null;
  return {
    profile: {
      displayName: m.displayName,
      about: 'A made-up member of the sample directory.',
      countryCode: m.countryCode,
      region: null,
      workPref: m.workPref,
      primaryArea: m.primaryArea,
      areas: m.primaryArea ? [m.primaryArea] : [],
      specialties: [],
      roles: [],
      openTo: [],
      languages: [],
      contactEnabled: m.contactEnabled,
    },
    credentials: m.latest
      ? [{ credentialType: 'certificate', credentialName: m.latest, levelOrTier: null, earnedAt: ago(40000), verifyToken: null }]
      : [],
    credentialsState: 'ok',
  };
}

let sampleKind: 'employer' | 'company' = 'employer';

export function sampleVerifiedStatus(): VerifiedStatus {
  return { kind: sampleKind, canSwitch: true, switchTo: sampleKind === 'employer' ? 'company' : 'employer', nextSwitchAt: null };
}

export function sampleSwitchKind(to: VerifierKind): { ok: true; kind: VerifierKind } {
  if (to === 'employer' || to === 'company') sampleKind = to;
  return { ok: true, kind: to };
}

/* ── The owner's queue ───────────────────────────────────────────────── */

let queue: QueueItem[] | null = null;
let adminAppeals: AdminAppeal[] | null = null;

function queueRow(n: number, over: Partial<QueueItem>): QueueItem {
  return {
    logId: n,
    createdAt: ago(n * 20),
    mode: 'check',
    action: 'hold',
    actor: 'claude-haiku',
    rule: null,
    reason: null,
    excerpt: null,
    urgentCategory: null,
    recommendation: null,
    postId: uid(800 + n),
    topicId: SAMPLE_TOPIC.mine,
    topicTitle: 'Why does my sub rattle the stage on one note?',
    postBody: null,
    postState: 'held',
    pendingKnown: false,
    pendingState: null,
    pendingBody: null,
    pendingTitle: null,
    author: DIEGO,
    targetUser: uid(700 + n),
    openReports: 0,
    openAppealId: null,
    ...over,
  };
}

export function sampleQueue(): QueueItem[] {
  if (sampleState()?.face === 'empty') return [];
  queue ??= [
    queueRow(1, {
      urgentCategory: 'threat',
      rule: 'threat',
      action: 'urgent',
      actor: 'word-filter',
      reason: 'Word filter matched a threat pattern. Held for the owner; never auto-resolved.',
      postBody: 'A made-up post held for the owner to read.',
    }),
    queueRow(2, {
      urgentCategory: 'child_safety',
      rule: 'child_safety',
      action: 'child_safety_preserve',
      actor: 'word-filter',
      postState: 'hidden',
      reason: 'Text preserved, hidden, NOT sent to the AI.',
      recommendation: 'recommend_ban',
    }),
    queueRow(3, {
      mode: 'report',
      action: 'auto_hide_reports',
      rule: 'harassment',
      reason: '3 member report(s); hidden pending review.',
      postBody: 'You people never read anything.',
      openReports: 3,
      recommendation: 'warn',
    }),
    queueRow(4, {
      mode: 'sweep',
      action: 'hold',
      actor: 'claude-sonnet',
      rule: 'self_promotion',
      reason: 'Promotes a business outside Careers & Business.',
      postBody: 'Book our studio today, best rates in town.',
    }),
    // An older row about a post later reported as child safety: the row has no
    // urgent category of its own, the server masks the body (review High 1).
    queueRow(5, {
      mode: 'report',
      action: 'auto_hide_reports',
      rule: 'reports_pending_review',
      reason: '3 member report(s); hidden pending review.',
      postBody: '[preserved — not displayed (child-safety)]',
      postState: 'hidden',
      topicTitle: 'A made-up title the screen matched',
      openReports: 4,
    }),
    // A held EDIT of a published post: others still see the old text; the edit
    // is only in the excerpt (review High 2).
    queueRow(6, {
      action: 'hold',
      rule: 'respect',
      reason: 'The edit insults another member.',
      postState: 'published',
      postBody: 'The approved reply everyone can still see.',
      excerpt: 'A made-up edit that now calls another member names.',
    }),
    queueRow(7, {
      action: 'budget_hold',
      actor: 'system',
      reason: 'Monthly AI cap reached, so it was held unchecked.',
      postState: 'published',
      postBody: 'The approved reply everyone can still see.',
    }),
  ];
  return queue;
}

export function sampleDecide(logId: number): true {
  queue = (queue ?? []).filter((q) => q.logId !== logId);
  return true;
}

export function sampleAdminAppeals(): AdminAppeal[] {
  if (sampleState()?.face === 'empty') return [];
  adminAppeals ??= [
    {
      appealId: uid(600),
      postId: uid(601),
      topicId: SAMPLE_TOPIC.mine,
      member: ME,
      reason: 'I was talking about the mix, not about a person.',
      status: 'open',
      postBody: 'That kick is an insult to the whole mix.',
      modRule: 'respect',
      modReason: 'This reply was removed because it insults another member.',
      recommendation: null,
      createdAt: ago(45),
      postState: 'hidden',
      pendingKnown: false,
      pendingState: null,
      pendingBody: null,
      pendingTitle: null,
    },
    // An appeal about a refused EDIT: the post is still published with its
    // old text, and the edit is not shown, so OVERTURN is off (second review).
    {
      appealId: uid(602),
      postId: uid(603),
      topicId: SAMPLE_TOPIC.mine,
      member: ME,
      reason: 'My edit only fixed a typo.',
      status: 'open',
      postBody: 'The approved reply everyone can still see.',
      modRule: 'respect',
      modReason: 'This edit was not published.',
      recommendation: null,
      createdAt: ago(30),
      postState: 'published',
      pendingKnown: false,
      pendingState: null,
      pendingBody: null,
      pendingTitle: null,
    },
  ];
  return adminAppeals;
}

export function sampleDecideAppeal(id: string): true {
  adminAppeals = (adminAppeals ?? []).filter((a) => a.appealId !== id);
  return true;
}

export function sampleAiUsage(): { calls: number; costUsd: number; capUsd: number; capHitAt: string | null } | null {
  return sampleState()?.face === 'empty' ? null : { calls: 412, costUsd: 3.2, capUsd: 50, capHitAt: null };
}

export function sampleTracked(): ForumTopic[] {
  if (sampleState()?.face === 'empty') return [];
  return ready().filter((t) => t.trackedStatus).map(bare);
}

export function sampleSetStatus(topicId: string, status: TrackedStatus, reason: string | null): true {
  const t = find(topicId);
  if (t) {
    t.trackedStatus = status;
    t.trackedReason = reason;
  }
  return true;
}

export function sampleTopicFlags(topicId: string, flags: { pinned?: boolean; locked?: boolean }): true {
  const t = find(topicId);
  if (t) Object.assign(t, flags);
  return true;
}

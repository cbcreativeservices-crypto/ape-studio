/**
 * The server's rows, as the app's types. Pure, so what a missing or odd field
 * becomes is tested and not discovered on a phone. Only api.ts calls these.
 */
import type {
  CategoryKind,
  FollowLevel,
  ForumAppeal,
  ForumAuthor,
  ForumBadge,
  ForumBookmark,
  ForumCategory,
  ForumMe,
  ForumNotice,
  ForumPost,
  ForumRights,
  ForumSearchHit,
  ForumTopic,
  ForumTopicDetail,
  PostOutcome,
  ReactionKind,
  TopicKind,
  TrackedKind,
  TrackedStatus,
  TrustLevel,
  VerifiedKind,
} from './types.ts';

type Row = Record<string, unknown>;

const obj = (v: unknown): Row => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Row) : {});
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const strOr = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const yes = (v: unknown): boolean => v === true;

const TRUST: readonly string[] = ['new', 'member', 'regular', 'leader'];
const KINDS: readonly string[] = ['employer', 'company', 'institution', 'instructor'];

export function authorOf(v: unknown): ForumAuthor {
  const a = obj(v);
  const kind = str(a.verified_kind);
  const trust = str(a.trust);
  return {
    name: str(a.name) || 'Member',
    token: strOr(a.token),
    verifiedKind: KINDS.includes(kind) ? (kind as VerifiedKind) : null,
    graduate: yes(a.graduate),
    trust: TRUST.includes(trust) ? (trust as TrustLevel) : null,
    former: yes(a.former),
  };
}

export function categoryOf(v: unknown): ForumCategory {
  const r = obj(v);
  return {
    slug: str(r.slug),
    name: str(r.name),
    groupSlug: str(r.group_slug),
    groupName: str(r.group_name),
    groupSort: num(r.group_sort),
    sortOrder: num(r.sort_order),
    kind: str(r.kind) as CategoryKind,
    trackedKind: strOr(r.tracked_kind) as TrackedKind | null,
    staffOnlyTopics: yes(r.staff_only_topics),
    jobsAllowed: yes(r.jobs_allowed),
    labThreads: yes(r.lab_threads),
    description: strOr(r.description),
    followLevel: strOr(r.follow_level) as FollowLevel | null,
  };
}

export function rightsOf(v: unknown): ForumRights {
  const r = obj(v);
  return {
    slug: str(r.slug),
    proOnly: yes(r.pro_only),
    canStartTopic: yes(r.can_start_topic),
    canReply: yes(r.can_reply),
    canPostJob: yes(r.can_post_job),
    reason: strOr(r.reason),
  };
}

export function meOf(v: unknown): ForumMe {
  const r = obj(v);
  const trust = str(r.trust);
  return {
    canPost: yes(r.can_post),
    reason: strOr(r.reason),
    trust: TRUST.includes(trust) ? (trust as TrustLevel) : null,
    mutedUntil: strOr(r.muted_until),
    unreadNotices: num(r.unread_notices),
    badges: (Array.isArray(r.badges) ? r.badges : []).map(badgeOf).filter((b) => b.slug),
  };
}

function badgeOf(v: unknown): ForumBadge {
  const r = obj(v);
  return { slug: str(r.slug), name: str(r.name), awardedAt: strOr(r.awarded_at) };
}

export function topicOf(v: unknown): ForumTopic {
  const r = obj(v);
  return {
    id: str(r.topic_id),
    categorySlug: str(r.category_slug),
    categoryName: str(r.category_name),
    title: str(r.title),
    topicKind: str(r.topic_kind) as TopicKind,
    author: authorOf(r.author),
    isMine: yes(r.is_mine),
    modState: str(r.mod_state) || 'published',
    trackedStatus: strOr(r.tracked_status) as TrackedStatus | null,
    solved: yes(r.solved),
    replyCount: num(r.reply_count),
    voteCount: num(r.vote_count),
    myVote: yes(r.my_vote),
    pinned: yes(r.pinned),
    locked: yes(r.locked),
    isNewMember: yes(r.is_new_member),
    labKey: strOr(r.lab_key),
    unread: yes(r.unread),
    firstUnreadPostId: strOr(r.first_unread_post_id),
    lastPostAt: strOr(r.last_post_at),
    createdAt: str(r.created_at),
  };
}

export function topicDetailOf(v: unknown): ForumTopicDetail {
  const r = obj(v);
  return {
    id: str(r.topic_id),
    categorySlug: str(r.category_slug),
    categoryName: str(r.category_name),
    categoryKind: str(r.category_kind) as CategoryKind,
    title: str(r.title),
    topicKind: str(r.topic_kind) as TopicKind,
    fields: obj(r.fields),
    labKey: strOr(r.lab_key),
    author: authorOf(r.author),
    isMine: yes(r.is_mine),
    modState: str(r.mod_state) || 'published',
    trackedStatus: strOr(r.tracked_status) as TrackedStatus | null,
    trackedReason: strOr(r.tracked_reason),
    solutionPostId: strOr(r.solution_post_id),
    replyCount: num(r.reply_count),
    voteCount: num(r.vote_count),
    myVote: yes(r.my_vote),
    pinned: yes(r.pinned),
    locked: yes(r.locked),
    canMarkSolution: yes(r.can_mark_solution),
    canVote: yes(r.can_vote),
    followLevel: strOr(r.follow_level) as FollowLevel | null,
    createdAt: str(r.created_at),
  };
}

const REACTIONS: readonly string[] = ['helpful', 'thanks', 'insightful'];

/** Lab keys only: a card's other fields are client text nobody moderated. */
export function labKeysOf(cards: unknown): string[] {
  if (!Array.isArray(cards)) return [];
  return cards
    .map(obj)
    .filter((c) => c.type === 'lab' && typeof c.lab_key === 'string' && /^[a-z0-9][a-z0-9_-]{1,79}$/.test(c.lab_key))
    .map((c) => c.lab_key as string);
}

export function postOf(v: unknown): ForumPost {
  const r = obj(v);
  return {
    id: str(r.post_id),
    isOpening: yes(r.is_opening),
    postKind: str(r.post_kind),
    body: str(r.body),
    author: authorOf(r.author),
    isMine: yes(r.is_mine),
    modState: str(r.mod_state) || 'published',
    modReason: strOr(r.mod_reason),
    modRule: strOr(r.mod_rule),
    pendingState: strOr(r.pending_state),
    pendingBody: strOr(r.pending_body),
    urgentCategory: strOr(r.urgent_category),
    isSolution: yes(r.is_solution),
    helpfulCount: num(r.helpful_count),
    thanksCount: num(r.thanks_count),
    insightfulCount: num(r.insightful_count),
    myReactions: (Array.isArray(r.my_reactions) ? r.my_reactions : []).filter((k): k is ReactionKind =>
      REACTIONS.includes(k as string),
    ),
    quotePostId: strOr(r.quote_post_id),
    quoteExcerpt: strOr(r.quote_excerpt),
    correctionOfPostId: strOr(r.correction_of_post_id),
    correctionState: strOr(r.correction_state),
    labKeys: labKeysOf(r.cards),
    safetyNote: yes(r.safety_note),
    edited: yes(r.edited),
    isFirstPost: yes(r.is_first_post),
    bookmarked: yes(r.bookmarked),
    publishedAt: strOr(r.published_at),
    createdAt: str(r.created_at),
  };
}

export function noticeOf(v: unknown): ForumNotice {
  const r = obj(v);
  return {
    id: num(r.id),
    postId: strOr(r.post_id),
    kind: str(r.kind),
    rule: strOr(r.rule),
    excerpt: strOr(r.excerpt),
    message: strOr(r.message),
    automated: yes(r.automated),
    expiresAt: strOr(r.expires_at),
    readAt: strOr(r.read_at),
    createdAt: str(r.created_at),
  };
}

export function bookmarkOf(v: unknown): ForumBookmark {
  const r = obj(v);
  return {
    postId: str(r.post_id),
    topicId: str(r.topic_id),
    topicTitle: str(r.topic_title),
    excerpt: str(r.excerpt),
    remindAt: strOr(r.remind_at),
  };
}

export function appealOf(v: unknown): ForumAppeal {
  const r = obj(v);
  return { id: str(r.id), postId: str(r.post_id), status: str(r.status) };
}

export function searchHitOf(v: unknown): ForumSearchHit {
  const r = obj(v);
  return {
    topicId: str(r.topic_id),
    title: str(r.title),
    categorySlug: str(r.category_slug),
    solved: yes(r.solved),
    replyCount: num(r.reply_count),
  };
}

/** forum-moderate's answer. Null when it does not say which post it was. */
export function outcomeOf(v: unknown): PostOutcome | null {
  const r = obj(v);
  const postId = str(r.post_id);
  if (!postId) return null;
  return {
    postId,
    topicId: str(r.topic_id),
    state: str(r.state) || 'checking',
    reason: strOr(r.reason),
    urgentCategory: strOr(r.urgent_category),
  };
}

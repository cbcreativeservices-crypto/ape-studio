/**
 * Audio Community Forum: the shapes the app works with, in camelCase. The
 * server's rows are mapped to these in api.ts and nowhere else.
 *
 * Types only, so the pure rules and the sample set can import them directly.
 */

export type VerifiedKind = 'employer' | 'company' | 'institution' | 'instructor';
export type TrustLevel = 'new' | 'member' | 'regular' | 'leader';
export type ReactionKind = 'helpful' | 'thanks' | 'insightful';
export type TopicSort = 'latest' | 'unanswered' | 'top_week';
export type CategoryKind = 'announcements' | 'qa' | 'discussion' | 'tracked';
export type TrackedKind = 'idea' | 'glossary' | 'bug';
export type TrackedStatus = 'under_review' | 'planned' | 'in_progress' | 'shipped' | 'declined' | 'accepted';
export type TopicKind = 'question' | 'discussion' | 'announcement' | 'idea' | 'glossary' | 'bug' | 'job' | 'lab';
export type FollowLevel = 'all' | 'replies' | 'off';

export type ForumAuthor = {
  name: string;
  /** The published community profile's public token; null when there is none. */
  token: string | null;
  verifiedKind: VerifiedKind | null;
  graduate: boolean;
  trust: TrustLevel | null;
  former: boolean;
};

export type ForumCategory = {
  slug: string;
  name: string;
  groupSlug: string;
  groupName: string;
  groupSort: number;
  sortOrder: number;
  kind: CategoryKind;
  trackedKind: TrackedKind | null;
  staffOnlyTopics: boolean;
  jobsAllowed: boolean;
  labThreads: boolean;
  description: string | null;
  followLevel: FollowLevel | null;
};

/** forum_category_rights: what THIS member may do in one category. */
export type ForumRights = {
  slug: string;
  proOnly: boolean;
  canStartTopic: boolean;
  canReply: boolean;
  canPostJob: boolean;
  /** The refusal code, null when allowed. */
  reason: string | null;
};

export type ForumBadge = { slug: string; name: string; awardedAt: string | null };

export type ForumMe = {
  canPost: boolean;
  reason: string | null;
  trust: TrustLevel | null;
  mutedUntil: string | null;
  unreadNotices: number;
  badges: ForumBadge[];
};

export type ForumTopic = {
  id: string;
  categorySlug: string;
  categoryName: string;
  title: string;
  topicKind: TopicKind;
  author: ForumAuthor;
  isMine: boolean;
  modState: string;
  trackedStatus: TrackedStatus | null;
  solved: boolean;
  replyCount: number;
  voteCount: number;
  myVote: boolean;
  pinned: boolean;
  locked: boolean;
  isNewMember: boolean;
  labKey: string | null;
  unread: boolean;
  /** Where "jump to first unread" lands. */
  firstUnreadPostId: string | null;
  lastPostAt: string | null;
  createdAt: string;
};

/** forum_topic_get: the one topic a thread is about. */
export type ForumTopicDetail = {
  id: string;
  categorySlug: string;
  categoryName: string;
  categoryKind: CategoryKind;
  title: string;
  topicKind: TopicKind;
  fields: Record<string, unknown>;
  labKey: string | null;
  author: ForumAuthor;
  isMine: boolean;
  modState: string;
  trackedStatus: TrackedStatus | null;
  trackedReason: string | null;
  solutionPostId: string | null;
  replyCount: number;
  voteCount: number;
  myVote: boolean;
  pinned: boolean;
  locked: boolean;
  canMarkSolution: boolean;
  canVote: boolean;
  followLevel: FollowLevel | null;
  createdAt: string;
};

export type ForumPost = {
  id: string;
  isOpening: boolean;
  postKind: string;
  body: string;
  author: ForumAuthor;
  isMine: boolean;
  modState: string;
  modReason: string | null;
  modRule: string | null;
  pendingState: string | null;
  pendingBody: string | null;
  urgentCategory: string | null;
  isSolution: boolean;
  helpfulCount: number;
  thanksCount: number;
  insightfulCount: number;
  myReactions: ReactionKind[];
  quotePostId: string | null;
  quoteExcerpt: string | null;
  correctionOfPostId: string | null;
  /** suggested · accepted · dismissed */
  correctionState: string | null;
  labKeys: string[];
  safetyNote: boolean;
  edited: boolean;
  isFirstPost: boolean;
  bookmarked: boolean;
  publishedAt: string | null;
  createdAt: string;
};

export type ForumNotice = {
  id: number;
  postId: string | null;
  kind: string;
  rule: string | null;
  excerpt: string | null;
  message: string | null;
  automated: boolean;
  expiresAt: string | null;
  readAt: string | null;
  createdAt: string;
};

export type ForumBookmark = {
  postId: string;
  topicId: string;
  topicTitle: string;
  excerpt: string;
  remindAt: string | null;
};

export type ForumAppeal = { id: string; postId: string; status: string };

export type ForumSearchHit = {
  topicId: string;
  title: string;
  categorySlug: string;
  solved: boolean;
  replyCount: number;
};

/** What forum-moderate answers after a post or an edit. */
export type PostOutcome = {
  postId: string;
  topicId: string;
  /** published · checking · held · blocked · hidden · edit_held · edit_blocked */
  state: string;
  reason: string | null;
  urgentCategory: string | null;
};

/**
 * A read. A failed read is NEVER an empty list: it carries the refusal code
 * and the words to show, so a screen can tell its three faces apart.
 */
export type ForumResult<T> = { ok: true; value: T } | { ok: false; error: string; code: string | null };

export type AskValues = {
  title: string;
  trying: string;
  gear: string;
  tried: string;
  body: string;
  area: string;
  term: string;
  current: string;
  proposed: string;
  reason: string;
  source: string;
};

export type SubmitInput = {
  body: string;
  /** One id per draft, so a retry after a dropped connection posts once. */
  clientId: string;
  category?: string;
  topicId?: string;
  title?: string;
  topicKind?: TopicKind;
  fields?: Record<string, unknown>;
  quotePostId?: string;
  quoteExcerpt?: string;
  /** A lab linked from the Ask form: shown as a card. */
  labKey?: string | null;
  /** The post that this suggests a correction to. */
  correctionOf?: string;
  /** Public tokens of the people @mentioned. */
  mentionTokens?: string[];
  /** "Discuss this lab": the post opens or joins that lab's one thread. */
  labThread?: { key: string; title: string };
};

# SERVER GAPS: Audio Community Forum and Directory

The source for the next Comp A package. Each row is something the app cannot do properly with the live server, how the app behaves today (it always fails honestly), and the smallest server change that would fix it. Read from the live database on 2026-11-07. Nothing here has been applied.

**Priority:** A = needed before launch. B = worth doing, the app works without it. C = polish.

## Status: the Comp A package of 2026-11-07 (written, NOT applied to live)

The package `Downloads/2026-11-07_FOR_COMP_A_FORUM_GAPS.zip` (F00 to F90, VERIFY, F99 rollback) builds the server side of most rows below. **It is not on the live server yet** (read-only check, 2026-11-07: `forum_topics_list` still has 4 arguments, `directory_search` 9, and `forum_rules_accept`, `forum_block_author`, `directory_verified` do not exist). The app on `forum-next-build` now works with BOTH shapes: it tries the new function, column or argument first, and falls back to today's path only when the server answers that it does not have it (PGRST202 / 42883, `missingFunction` in `src/features/forum/rules.ts`). Any other failure is told as a failure. The two-shape calls live in `src/features/forum/serverShapes.ts` and `src/features/directory/kinds.ts` (`kindChip`); tests: `test/forumServerGaps_20261107.test.ts`.

| Row | Closed by | The app, once it lands | Still waits on |
|---|---|---|---|
| 1 | F90 (welcome post, pinned) | Nothing to change: the popup reads the pinned post's `unread`, which F40 leaves as it was. | HOLD B RESOLVED 2026-11-07 (owner): info@proaudiotrainingacademy.com is the one admin; Comp A moved the welcome post to that account (name still "Prof. Channing Booth"). APPLIED to live 2026-11-07. |
| 2 | F40 (`topic_id`) | Edit and Repost from a notice reads the thread and starts from the whole post; the excerpt path stays as the fallback. | Nothing. |
| 3 | F40 (`tracked_reason`, `area`) | Ideas takes every row's line from the list; no `forum_topic_get` per row. | Nothing. |
| 4 | Not built (convention `v1.1: text` kept) | Unchanged. | Nothing. |
| 5 | F40 (`area` returned) | The row's area is read. The Ask form does not yet OFFER an area on questions, and the header does not draw a sub-area: app work, not started. | App work. |
| 6 | Not built: a privacy choice | Unchanged. | The owner's decision. |
| 7 | F40 (`p_group`) | The Pro Lounge is one `forum_topics_list(p_group => 'pro_lounge')` read in the server's order, so Top this week truly ranks. | Nothing. |
| 8 | F30 (`solution_marked_by_name`) | "MARKED BY" names the marker; the asker only on a server without it. | Nothing. |
| 9 | F70 (`forum_block_author`) | Block (menu and Report) goes by the post, so an author with no profile can be blocked. Old server: the token block, and "no community profile" without a token. | Nothing. |
| 10 | F50 (`forum_rules_accept`, check switched OFF) | I AGREE records it on the account AND on the phone; either is enough. A post refused with `rules_not_accepted` shows plain words and brings the rules popup back. | **HOLD C**: switch the check on only after a store build with this app is in members' hands. |
| 11 | Not built (edge-function change) | Unchanged. | A later package. |
| 12 | F30 (cards cleaned when read) | Nothing to change: the app reads only `lab_key`. | Nothing. |
| 13 | F60 (`directory_search(p_kind)`, `verified_kind`) | A kind chip is one server search by kind, with paging; no 90-member scan, no "Looked through the first N". | Nothing. |
| 14 | F60 (`directory_verified`, organizations only) | Employers / Companies / Institutions also list verified organizations with no community profile; the card opens their page on the website. Only with no filter but the name box. | Instructors with no profile stay unlisted (package choice 9.5). |
| 15 | Not in the package | The switch row stays hidden. | **HOLD A**, after the website work. |
| 16 | F40 (`ever_read`) | The blue dot is for new replies in a topic read before; a topic never opened has none. `unread` itself (the welcome popup) is unchanged. | Nothing. |
| 17 | F30 (`mentions`) | A mention of someone outside the thread is drawn, and can be suggested by @. | Nothing. |
| 18 | Not built | Unchanged. | A design decision. |
| 19 | F70 (5 points, once) | Nothing to change. | Nothing. |
| 20 | Not in the package | Unchanged: both admin accounts can use the queue. | **HOLD B**. |
| 21 | F30 (Regular or Leader may mark one Solution in a lab thread) | The menu follows `can_mark_solution`, as before; MARKED BY now names them. | Nothing. |
| 22 | Nothing to build | Unchanged. | The launch-day test (HOLD D day). |
| 23, 24 | Nothing needed | Unchanged. | Nothing. |
| 25 | F10 (`pending_body`, `pending_state`, `pending_title`) | RESTORE comes back on a held edit once all three arrive and the body is there; the card shows the whole edit and the new title. | Nothing. |
| 26 | F30 (owner reads held, pending, hidden topics) | Not used yet: the queue's topic title is still a link only while the post is published (`queueTopicFace`). | App follow-up. |
| 27 | F10 (title and excerpt masked) | Nothing to change: the app already hides them. | Nothing. |
| 28 | F20 (child-safety lock, `forum:not_allowed`) | The owner sees a plain line about the post (`ADMIN_NOT_ALLOWED`), never "Could not read the queue". The app still never offers those buttons. | Nothing. |
| 29 | F20 + F30 (`please_edit`, neutral sentence) | Edit and Repost on a held post follows `please_edit`; the sentence rule only on a server without it. | The neutral sentence is a draft: the owner's copy. |
| 30 | F20 (`rule = 'reports_pending_review'`, `automated = false`) | The notice reads BEING REVIEWED by its rule as well as by its sentence (it would otherwise have read as REMOVED). | Nothing. |
| 31 | F80 (reason-only change saved) | Not used yet: the app still refuses the same status with a new reason (`trackedProblem`), because the old server would not save it. | App follow-up once live. |
| 32 | F80 (unmute returns null) | Nothing to change: the sentence stays true. | Nothing. |
| 33 | F10 (`post_state` and the pending fields on appeals) | OVERTURN follows the pending fields, and the card shows THE EDIT APPEALED FOR before it. | Nothing. |
| 34 | F20 item 1 (report hide drops the edit) | Nothing to change. | Nothing. |

**Not verified:** the app has not been run against the new functions (the package is not applied, and no test server has it). The new shapes are tested against a fake server built from the package's exact names (`BRIEF_FOR_COMP_A.md` section 9.16 and the F10 to F70 `returns table` lines).

## From slice 1

| # | Pri | What is missing | What the app does today | Smallest server change |
|---|---|---|---|---|
| 1 | A | The pinned welcome post does not exist: zero topics live, and no per-account "seen" flag. | Popup is once per device until the post exists; it can show again after sign-out. Announcements shows a local copy of the same words. | Seed one pinned topic and opening post in `announcements`, author the owner, using the approved text. No schema change: the read mark on it is then the per-account flag. |
| 2 | B | `forum_notices_mine` has no `topic_id` or full text. | Edit and Repost from a notice starts from the 280-character excerpt and warns that the repost replaces the whole post. In the thread it has the full text. | Add `topic_id` to the return table (join `forum_posts`). |
| 3 | B | `forum_topics_list` has no `tracked_reason` or `fields`. | Ideas makes one `forum_topic_get` per row, capped at 30; rows past that show their status without the line under it. | Add `tracked_reason` and `fields->>'area'` to the return table. |
| 4 | C | No shipped-version field. | "SHIPPED · v1.1" appears only when the reason is written `v1.1: text`. | None needed if staff keep that convention. Otherwise add `tracked_version text` to `forum_topics`. |
| 5 | C | Topics have no sub-area, so "ASK THE COMMUNITY · LIVE SOUND" cannot be drawn. | Header and row tag show the category alone. | Comes with row 3 if `area` is also allowed on questions; the Ask form would then offer it. |
| 6 | C | No location for an author, so lounge rows cannot show "Seattle, WA". | Rows show the category tag. | Add `region` and `country_code` to `private.forum_author_json`. |
| 7 | B | No lounge-wide topic list. | The app merges four calls. It fails whole if one fails, and **Top this week does not truly rank in the lounge feed** (it sorts by last activity). | Add `p_group text` to `forum_topics_list`, filtering on `group_slug`. |
| 8 | C | The server does not record who marked a Solution. | Shows "MARKED BY" the asker, so an admin marking it is mislabelled. | Add `solution_marked_by uuid` and return its first name from `forum_topic_get`. |
| 9 | B | Block needs a public token, so an author with no published profile cannot be blocked. | Says so and offers Report. | Add `forum_block_author(p_post_id uuid)` resolving the author on the server. |
| 10 | A | Rules acceptance is device-only (brief item h). | The popup shows on each new device and after sign-out; a client that skips the app skips it. | Add `forum_rules_accepted_at` to `forum_trust`, a `forum_rules_accept()` function, and a check in `private.forum_eligibility`. |
| 11 | C | `forum_post_edit` cannot change a topic's stored `fields`, while the moderator still reads them. | Guided answers live in the body. Glossary and bug `fields` cannot be fixed after posting. | Add `p_fields jsonb default null` to `forum_post_edit`. |
| 12 | C | Card JSON is stored as sent, and is not moderated. | The app reads only `lab_key` and builds the title from it. The key mismatch noted in slice 1 is closed: both ends now use the same key. | In `forum_post_submit`, store only `type` and `lab_key` from each card. |

## New in slice 2

| # | Pri | What is missing | What the app does today | Smallest server change |
|---|---|---|---|---|
| 13 | A | `directory_search` has no kind filter and returns no kind. | The four kind chips read up to 90 members, ask `directory_badges`, and say "Looked through the first N members" when they stopped early. | Add `p_kind text` to `directory_search` and return `verified_kind`, as `directory_graduates` already does. |
| 14 | A | A verified account with no published community profile is not in `directory_search` at all. | Such an employer does not appear under Employers. One employer exists live; if it has no profile, that chip is empty. | Decide the rule. Smallest: a `directory_verified(p_kind)` listing `employer_profiles` that are not revoked, with their public page token. |
| 15 | A | `new_kinds_open` is false, so Company and Institution cannot exist yet and the switch is refused. | The switch row is not drawn at all. Plates, chips and copy for all four kinds are ready. | On launch: `update private.verified_account_settings set new_kinds_open = true where id = 1`, after the website work. |
| 16 | B | `unread` is true for every topic a member has never opened. | Every such topic shows the blue dot, so a new member sees many. | Return `ever_read boolean` from `forum_topics_list`, or treat topics older than the member's first visit as read. |
| 17 | C | `forum_posts_list` does not return who was mentioned. | A mention is drawn only for someone already posting in the thread. A mention of anyone else still notifies them, but reads as plain text. | Add `mentions jsonb` (`[{name, token}]`) to the return table. |
| 18 | C | `private.forum_author_json` has no badges. | Badges show in Your forum only, never beside a name on a post. | Add a `badges` array, or only the top badge, to the author JSON. |
| 19 | B | `forum_correction_resolve` gives no credit. The proposal says accepting credits the corrector. | Accept marks it and opens the author's edit. No points or badge go to the corrector. | On accept, add a `forum_points_ledger` row for the correction's author and call `private.forum_award_badges`. |
| 20 | A | `is_admin()` is true for two live accounts, so "only the owner" is really "both admins". | The queue reads as the owner's, and either admin account can use it. | Decide. Smallest: `is_forum_owner()` on a stored user id, checked by every `forum_admin_*` function. Or set the second account's role to something else. |
| 21 | B | Lab threads have no asker (`author_user` is null), in a Q&A category. | Nobody but an admin can mark a Solution in a lab thread, and no opening post exists. | Put `lab_threads` in a discussion-kind category, or let `is_system` topics allow any Regular to mark. |
| 22 | A | Bookmark reminders are sent by the `forum-minute` job, which is off until launch. | The app says "We will remind you tomorrow morning" from the write's answer. Delivery has not been tested. | Nothing to build. Test it when the launch-day jobs are switched on. |
| 23 | C | A verified kind switch does not refresh a live session's forum plate. | The next read shows the new plate. | None needed. |
| 24 | B | `forum_admin_queue` has no filter and caps at 500; `forum_admin_appeals` is `open` only in this slice. | The queue reads the first 100, oldest first with urgent on top, and decided appeals are not listed. | None needed at launch. Add `p_offset` when the queue grows. |

## From the review fixes (2026-11-07)

| # | Pri | What is missing | What the app does today | Smallest server change |
|---|---|---|---|---|
| 25 | A | `forum_admin_queue` returns no `pending_state`, `pending_body` or `pending_title`. For a held EDIT, `post_body` is the old approved text, and the edit is only in the row's 280-character `excerpt` (none at all for `budget_hold` and `checker_unavailable`), never with a new title. Restoring applies the edit and the title. | The card shows the excerpt under THE EDIT BEING REVIEWED and the old text under WHAT OTHERS SEE NOW. RESTORE is off for every held edit (an appeal on a published post counts as one), and the card says that DISMISS leaves the edit waiting, never published. The owner can still hide or ask for an edit. | Add `pending_state text`, `pending_body text` and `pending_title text` (the topic's, for an opening post) to the return table, with child safety masked like `post_body`. The app turns RESTORE back on only when all three come back and the body is there. |
| 26 | B | `forum_topic_get` and `forum_posts_list` have no admin bypass, so the owner cannot open a held, pending or removed topic from the queue. | The topic title in the queue is a link only while the post is published, and plain text otherwise. | In both visibility checks, also allow `public.is_admin()`. Keep `forum_posts_list` excluding child-safety bodies for everyone. |
| 27 | A | `forum_admin_queue` masks `post_body` for child safety, but not `topic_title`, and not the `excerpt` of an older row with no urgent category of its own. The word screen reads the title, so the title can be the text it matched. | The app treats an item as child safety when the row OR the masked body says so. It then hides the body, the excerpt and the topic title. | Mask `t.title` and `l.excerpt` when `coalesce(p.urgent_category, l.urgent_category) = 'child_safety'`, as `post_body` already is. |
| 28 | A | An owner restore clears `urgent_category`, so `forum_admin_decide('restore')`, `forum_admin_post_action('restore' / 'please_edit')` and an overturned appeal can each put a child-safety post back. `forum_appeal_submit` also accepts an appeal on one. | The app never offers RESTORE, PLEASE EDIT or OVERTURN on a child-safety item, and never offers APPEAL on one. A client that skips the app still can. | In `private.forum_post_action`, refuse `restore`, `publish` and `please_edit` while `urgent_category = 'child_safety'`. In `forum_appeal_submit`, refuse the same posts (`not_allowed`). |
| 29 | B | A please-edit note and a plain hold are both `mod_state = 'held'`. When Claude asks for an edit with an empty `author_note`, the author is shown the log sentence (`coalesce(p_author_note, p_reason)`). | The app offers Edit and Repost only when the held post's reason is not the neutral "Your post is waiting for a review." | Store please-edit as its own state, or return `please_edit boolean` from `forum_posts_list`. Never fall back to `p_reason` for the author's text. |
| 30 | C | The notice for a post hidden by member reports has no `rule`, and `automated` defaults to true, though no AI looked at it. | The app recognizes it by its sentence ("This post is hidden while it is reviewed.") and shows BEING REVIEWED with no automation line. | In `forum_report`, insert that notice with `rule = 'reports_pending_review'` and `automated = false`. |
| 31 | C | `forum_admin_set_tracked_status` returns early when the status is unchanged, so a new reason (for example "v1.1: Now in Settings" on a SHIPPED item) cannot be saved. | The app refuses to save the same status and says why. | When only the reason changes, update `tracked_reason` and record it in `forum_status_history`. |
| 32 | C | `forum_admin_user_action('unmute')` logs and returns a log id even when there was no mute to lift. | The app says "Any mute this member had is lifted." | Return null (or raise `not_muted`) when no mute was lifted. |
| 33 | A | `forum_admin_appeals` returns no post state and no waiting edit. An appeal on a published post is about a held or refused EDIT, the card can show only the old body, and OVERTURN publishes the edit unseen. | OVERTURN is off unless the post's state is known (from its open queue row) and is not published. When the state is unknown, it is off too. The card says why, and UPHOLD stays. | Add `post_state text`, `pending_state text`, `pending_body text` and `pending_title text` (child safety masked) to the return table. The app already reads them. |
| 34 | A | `forum_report`'s auto-hide sets `mod_state = 'hidden'` but keeps `pending_body`, `pending_state` and `pending_title`. An owner RESTORE of that post then publishes an edit nobody reviewed. | Nothing in the queue row says a hidden post carries an edit, so the app cannot turn RESTORE off for it until row 25 lands. Once it does, the app turns RESTORE off for any row whose post has a waiting edit. | In the auto-hide `update`, also set `pending_body = null, pending_state = null`, as `private.forum_post_action('hide')` already does, and clear the topic's `pending_title` (neither path clears it today). |

# SERVER GAPS: Audio Community Forum and Directory

The source for the next Comp A package. Each row is something the app cannot do properly with the live server, how the app behaves today (it always fails honestly), and the smallest server change that would fix it. Read from the live database on 2026-11-07. Nothing here has been applied.

**Priority:** A = needed before launch. B = worth doing, the app works without it. C = polish.

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

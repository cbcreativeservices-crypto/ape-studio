# App task queue — owner, 2026-09-19

Five items, queued while the Android + iOS builds ran. Status is kept current
here; anything marked NEEDS OWNER is blocked on a decision, not on work.

---

## 1 · Sound labs must start at 30% volume

**Owner:** *"in all labs that turn on sound, the volume setting/fader auto
starts at 30% always when the user first opens that particular lab screen.
That way volume never starts loud. It can start off as needed."*

Every lab that can produce sound opens with its level control at **30%**, on
first open of that lab screen. Not remembered-loud, not 100%. A lab may still
start SILENT where that is the design — the rule is about where the fader
sits when sound is turned on, so nobody is ambushed.

Status: ✅ **DONE.** One constant `src/features/audio/startLevel.ts`, eight initialisers. Three levels deliberately excluded because they are not volumes — Liquid SHAKE (acceleration in g, Faraday threshold is the lesson), the Signal Generator (−20 dBFS already IS 10% of full scale), and the Mixing faders (unity is the lesson).

## 2 · Cap how many messages a user can send

**Owner:** *"we need to limit the amount of messages users can send so the app
does not become a secret messaging side app."*

Contact requests are already capped (`contact_limits()`); per-message volume
inside an accepted thread is the gap. The intent is that this is a
professional contact channel, not a chat app.

Status: ✅ **DONE at the owner's STRICTER setting.** 10 msgs/day, 30/week, 5 per PARTNER per day, 5 unanswered, 1000 chars, plus a 90-day cooldown after a decline and no second thread with the same person. Counted per PAIR so a second request cannot reset it.

## 3 · Report abuse, and suspend / remove / ban accounts

**Owner:** *"we need to allow the report of abusers and also we need to add
that users of the app can have their accounts suspended, removed, banned, etc
for malicious behavior."*

`contact_report` exists. Account-level enforcement does not: there is no
suspend, no ban, no removal, and nothing an admin can act on a report WITH.

⚠️ This is also **store-review relevant**. Both stores expect a report path
and a moderation response for user-to-user content, and the Community
directory is declared as user-to-user interaction.

Status: ✅ **PHASE 0 DONE.** States (warn/suspend/ban/remove) in
`account_standing` + an append-only `moderation_actions` audit; the report
queue is readable and actionable for the first time (`ReportsAdminScreen`);
enforcement on both the sender and target sides; the employer BLOCK hole
closed with `contact_block_thread`; reporter acknowledgement with
block-by-default; `AccountStandingNotice` tells a restricted member the fact
and the reason.

⚠️ **NEEDS OWNER, and these are not engineering questions:**
1. Does a ban REVOKE earned credentials? (`credential_awards.revoked_at`
   exists, so it is one UPDATE either way.) Revoking a credential someone
   passed an exam for is a different act from removing them from a directory.
2. Does a ban terminate PAID membership? You cannot refund an IAP yourself —
   Apple and Google own that — so banning a paid member without a refund is a
   consumer-law and chargeback question.
3. Retention period for reports, messages and moderation records after a
   removal.

## 4 · The Help search promises intelligence it does not have

**Owner:** *"the help search implies we have a smart search and we dont, so we
need to limit or not have the field help search since it just returns that it
cant find anything anyway (remove this frustration)."*

Status: ✅ **DONE.** Tokenised filter, honest label, and the empty state no longer renders INSTEAD of the manual it tells you to browse. ⚠️ Separately: the manual has no CANCELLATION entry, so that search still finds nothing — a content gap, pinned in a test.

## 5 · Legal: liability and refunds if the LLC closes

**Owner:** *"we need to add legal verbiage about if the LLC closes we cannot be
held liable or refund peoples money. etc."*

Status: **drafting.** ⚠️ **NEEDS A LAWYER.** ccode can draft plain, honest
wording and put it in the right places, but an enforceable limitation of
liability — and anything touching refunds — is exactly the text that gets
tested when someone is angry. It must be reviewed by someone qualified before
launch, and consumer law in some jurisdictions overrides parts of it
regardless.

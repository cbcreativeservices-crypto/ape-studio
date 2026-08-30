# RETURN TO THIS — Bugbot findings (unfinished)
# Date parked: 2026-08-30
# Origin: Bugbot review of branch changes, 2026-08-28
# Status: **not started**. Finish to conclusion before treating notifications / final exam / co-reqs as shipped.

Booth parked this to build `/connect`. Do not close this note until the three code fixes are in and the co-req ruling is written down.

---

## What to do (agreed 2026-08-28)

### 1. Notifications — wrong user id (ship blocker)

`notification_preferences` and `notification_concept_subscriptions` are keyed on internal `users.id`. New notification code writes `auth.uid()`. Token save and weekly subscriptions miss the real rows; weekly push never fires.

**Fix:** in `src/features/notifications/push.ts` and `src/features/notifications/weeklyConcept.ts`, replace every `authUserId()` write with the Settings pattern:

```ts
const { data: user } = await supabase.from('users').select('id').single();
// then .eq('user_id', user.id) / user_id: user.id
```

Also `setWeeklyConceptPref` and `deactivateAllWeeklySubscriptions`, not only the two lines Bugbot named.

### 2. Final exam offline queue never replays (ship blocker)

`enqueueExamSubmission` writes. `replayExamSubmissions()` is never called.

**Fix:** call it in the Dashboard `load` path next to `replayQuizSubmissions()`, and alert on a successful replay. Account switch is already covered (`clearLocalAccountData` wipes `ape:*`, including `ape:finalExamQueue`).

### 3. Co-req list gs3080 vs gs3081 (product ruling — do not auto-revert)

Governance R6 lists Electrical Power (`gs3080`) as a co-req, Foundations lab separate. Live `award_standing_requirements` (per `src/features/awards/api.ts`) already uses Audio Fundamentals Lab (`gs3081`) instead of `gs3080`. Client `COREQ_TOPIC_GS` was changed to `[3060, 3070, 3081, 4370]` to match the server.

**Need a ruling before code:**

- If Electrical Power is still required → put `3080` back in `COREQ_TOPIC_GS` and add it to `award_standing_requirements`.
- If the lab topic replaced Electrical Power → keep `3081`, update comments/governance, and make sure enrollment does not also count `FOUNDATIONS_REQ_NAME` as a second copy of the same lab.

---

## Locations

| Severity | Location | Finding |
| --- | --- | --- |
| high | `src/features/notifications/push.ts:118` | Token write uses `auth.uid()` |
| high | `src/features/notifications/weeklyConcept.ts:109` | Subscription upsert uses `auth.uid()` |
| high | `src/features/finalExam/api.ts:214` | `replayExamSubmissions` never called |
| high | `src/screens/awards/awardsData.ts:24` | `COREQ_TOPIC_GS` 3080 → 3081 |

Ship order: (1) user-id, (2) exam replay, (3) co-req ruling.

_End of parked note._

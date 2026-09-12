# RETURN TO THIS — Bugbot findings
# Date parked: 2026-08-30 · closed 2026-08-30 evening
# Origin: Bugbot review of branch changes, 2026-08-28
# Status: **done.**

---

## 1. Notifications — wrong user id — DONE

Prefs key on `public.users.id`; subscriptions key on `auth.users.id`. Edge Function maps between them.

## 2. Final exam offline queue never replays — DONE

`replayExamSubmissions()` runs from Dashboard `load` next to quiz replay.

## 3. Co-req list gs3080 vs gs3081 — DONE (owner 2026-08-30)

Audio Fundamentals Lab (**gs3081**) replaced Electrical Power (gs3080). `COREQ_TOPIC_GS` stays `[3060, 3070, 3081, 4370]`. Award banners no longer append a second “Foundations in Audio” requisite. The extra Enrollment lab card is gone — gs3081 is completed through the Audio Fundamentals labs, not a fifth standing requirement. Governance R6 amended.

_End of note._

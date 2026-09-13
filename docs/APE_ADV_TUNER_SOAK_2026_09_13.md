# Adv Tuner soak freeze — investigation + trace recipe (2026-09-13)

Evidence and history: memory `adv-tuner-soak-freeze-2026-09-13`. This doc holds
what the code investigation found, the two JS fixes shipped, and the exact
capture recipe for the still-open question (spinning vs blocked JS thread).

## What the code investigation established

The mic→JS frame path is entirely **JS-pulled** — `ApeDspModule.kt` has no
event emitter and posts nothing per frame; every frame crosses the bridge only
because `useDspEngine`'s 66 ms poll (or a RAF loop on other screens) asks for
it. So the "enqueue runnable on already finished thread" spam after instance
death is NOT ape-dsp emitting frames; its source is still unidentified (dev
client itself is the leading suspect). The hub preview tick is correctly gated
on focus and does not run behind a pushed tool.

Two sources of steady hidden churn during the exact soak scenario (fullscreen
tuner open, room quiet) were real and are now fixed in JS (no build needed):

1. **`tunerFrameStore.publishTunerFrame` dedup never fired.** Raw
   `confidence`/`levelDb` jitter on every engine frame defeated the equality
   check, so both fullscreen overlays (CenterLock `LiveReadout`, VU tuner)
   re-rendered ~15×/s for the whole soak. Fixed by quantizing confidence to
   0.01 and levelDb to 1 dB before the compare — no display loses precision
   (confidence renders as a whole percent; levelDb is not rendered by any
   frame consumer). CenterLock's 100 ms tick was always designed to keep its
   clocks running on deduped frames, so held/hint timing is unaffected.
2. **The covered tuner-mode UI kept reconciling at 15 Hz behind the opaque
   overlay.** `LivePitchMode` must keep running (its poll feeds the store),
   but its own subtree (skinned VU, stat cells, trays) is invisible while a
   fullscreen overlay is up. `FrozenWhileCovered` in
   `src/screens/tools/FrequencyCounterScreen.tsx` returns the previous element
   while covered, so React bails out of the whole subtree; state, layout and
   scroll position are untouched and the UI resumes the moment the overlay
   closes.

Neither fix explains a wedge that GROWS over minutes on its own — they remove
the largest steady load feeding it. The growth mechanism (and whether it exists
at all without the dev client) still needs the device work below.

## Open question 1 — spinning vs blocked (cheap check first)

During a wedge, the JS thread's scheduler state alone nearly decides it, and it
is read-only adb (no device driving needed):

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')
$pid = adb shell pidof com.cbcreativeservices.apestudio
adb shell ps -T -p $pid   # find the mqt_js / js thread TID and its state
# S = sleeping (blocked on a lock/queue) · R = running (spinning / backlog)
# Sample its CPU time twice, 5 s apart — utime climbing while wedged = spinning:
adb shell cat /proc/$pid/task/<TID>/stat
```

A watcher can sample this every 2 s in the background for the whole soak so the
moment of the freeze is captured without anyone having to react to it.

## Open question 1b — Perfetto sched trace (the definitive answer)

Start ~30 s before provoking the freeze (i.e. after the soak minutes, just
before pressing ✕):

```powershell
adb shell perfetto -o /data/misc/perfetto-traces/apesoak.pftrace -t 60s sched freq idle
adb pull /data/misc/perfetto-traces/apesoak.pftrace
```

Open in https://ui.perfetto.dev, find the app's `mqt_js` track: solid Running
slices = spinning; long Sleeping with wakeups from another thread = blocked
(the waker's track names the lock owner).

## Open question 2 — does it reproduce release-ish?

The dev client adds LogBox, Metro websockets and the inspector bridge — all
candidates for minutes-scale accumulation. A local release variant
(`npx expo run:android --variant release` — local gradle, NOT an EAS build)
would decide it, but that is an install on the owner's device: **owner's call,
not started unilaterally.** If it does NOT reproduce in release, the wedge
downgrades to dev-harness annoyance; the lifecycle hardening in
`docs/APE_NEXT_BUILD_CHECKLIST.md` (Adv Tuner section) stays warranted either
way because the engine demonstrably outlived the React instance.

## The native half

Recorded in `docs/APE_NEXT_BUILD_CHECKLIST.md` → "Adv Tuner soak freeze —
native lifecycle hardening": capture teardown on instance death independent of
the happy-path module destroy, WITHOUT touching the warm-mic design
(memory `mic-warm-session`). Not written into native source yet, per the
checklist's rule.

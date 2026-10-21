# Sound Systems BUILD: cables carry which console output — plan + owner decisions (2026-10-20)

**Owner go (2026-10-20):** "cables from the console carry WHICH output (main L/R, aux 1–8), so the lab can check a wedge is fed from an aux and stereo is wired L/R" — "Yes, add it". Finding WF-SS-02.

## Owner decisions
1. One cable may carry ALL outputs (like a network/AES link); the output is chosen where the signal enters each loudspeaker (or at a stagebox return / pass-through hop).
2. Speech and Groups/FX mains: L/R **or** mono into both sides both pass.
3. 2.1 "sub on its own output": **Aux 6 or MTX 1**.
4. Wedges: **each on a different monitor aux** (not necessarily Wedge N on Aux N).
5. Stereo subs: **any main output** (mono-summed is fine).
6. In-ears: **add "Aux 8 · In-ears"** to the lab console; the in-ear transmitter must use it.
7. A cable with no output chosen: the loudspeaker still lights; only the feed check fails and the tag reads "OUT ?".
8. Capstones passed before the change **stay passed**.

## Plan (from the planning pass)
- `types.ts`: `ConsoleOut` = mainL | mainR | mainMono | aux1–aux8 | mtx1–mtx4; `Link.out?: ConsoleOut`.
- New `outputs.ts`: list, labels ("MAIN L", "AUX 2", "MTX 1 · SUBS"), family, aux purpose from `bandConsole()`; mtx1–4 = mx-subs, mx-fills, mx-lobby, mx-rec.
- Carriers: console outputs (except to stagebox/snake: the multicore carries all); stagebox/snake returns (learner picks the output); pass-through gear (processor, amp, LINK, sub HP out, IEM TX) may carry an `out` chosen from what arrives. Input side ignores `out`.
- `system.ts`: one walk extending `sinksThroughConsole` → `{ viaConsole, feeds }`; missing or stale `out` reads as '*' (unchosen). `trace`/`chainTo` unchanged. `feedOf`, `setLinkOut`, `connect(…, out?)`.
- `capstones.ts`: common FEEDS check on all ten (monitor positions and the IEM bodypack: monitor/IEM aux only, never main; mainL: mainL or mono; mainR: mainR or mono; mainC: mono; sub: main, aux6 or mtx1; fill/delay: main or matrix) + per-capstone checks (stereo L/R on different sides where stereo; 2.1 sub on aux6 or mtx1; wedges on different auxes; matrices: fills MTX 2, subs MTX 1; festival IEM on aux8; subs per the existing console checks).
- BUILD UI (`pagesBuild.tsx`): OUTPUT key in the dock after PART — flipFader lane for the 15 console/return choices, `kind:'options'` tap key for 2–4, `locked:'<reason>'` for one; prompts name OUTPUT; the inspect card reads "FED BY · … · AUX 2" or "OUT ?"; bezel unchanged. Plot tags show the feed ("AUX 2", "MAIN L", "OUT ?"); shorten where they clash (per-scene check at 3×, D67–D70).
- Tests: update the ten reference builds with explicit outputs; new `test/consoleOutputs_20261020.test.ts`.

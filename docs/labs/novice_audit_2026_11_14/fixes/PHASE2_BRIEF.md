# Lab fix round 1, phase 2: fill in the shared mechanisms for your labs (2026-11-14)

All rules from 00_FIX_BRIEF.md still apply:
- own files only;
- no commits;
- verify each item;
- add tests, in your existing `test/labFixes_20261114_<GROUP>.test.ts`;
- save your report as you go: add a "Phase 2" section to your `<GROUP>_REPORT.md`;
- one browser tab at a time, and close it after each look.

**NEW:** do NOT run `npx tsc` (the machine runs out of memory with 12 agents). The coordinator runs it at the gate. To check a file parses, use the TypeScript parser on that one file, or load your preview tab. After every edit to a `.tsx`, make sure the preview still builds (`curl http://localhost:8142`, or load your tab). A parse error blanks every agent's preview.

**Two files have ONE writer in phase 2. Do not edit them:**
- `src/features/lab/understandingChecks.ts`: S2 is writing a per-option reason for every question there.
- `src/features/lab/labEndContent.ts`: S4 is writing the "What you learned" recap and the next lab for every lab.

If your lab's own words need to reach either agent, write a SHARED NEED.

## Do this in every lab you own (read SHARED_API.md sections S1, S2 and S3 first)

1. **Silent learner** (S3 API):
   - Turn on the "Sound off?" line (`RackStage.soundOffLine`, or your lab's equivalent) wherever the lab has a ▶.
   - Put a `NeedsSoundTag` on every step and goal chip that cannot be done with sound off.
   - Use `BezelItem.silent` so a readout shows the stored value while sound is off.
   - Give every listening step a "can't listen now" path that a sound-off learner can follow and see.
2. **Bezel captions** (S3 API): add a plain-word caption to every bezel readout whose label is a code or a term a beginner would not know ("RT60", "FDBK", "GR", "F0", "LOSS/BNC" and the like). Captions show on the first visit only.
3. **Check card** (S2 API):
   - If your lab renders its OWN check or quiz (not the shared LabUnderstandingCheck; for example Mastering's practice cards, Sound Systems, Drum Tuning, Patchbay, Cable Dressing, Connector Selection, Mic Selection), give each wrong option its own one-line reason: first miss = the reason, the answer only after a second miss. Balance the option lengths where the right answer is the longest.
   - Turn on FINISH · SEE WHAT'S LEFT after a pass. Pass `checkEnd` with `onOpen={stop}` so the sound stops when the end layer opens.
   - Update every CHECK screen-guide line that promised the explanation on a wrong tap. Use S2's proposed sentence (SHARED_API.md / S2_REPORT.md, shared need 2).
4. **End screen** (S2 API):
   - Give every unfinished row its own "what is missing" line: `pageDetail={(i) => …}` for PagedLab labs, `detail` per unit for LabEndScreen labs. Name the actual missing goal, never a rule every row shares.
   - Make each `endGuide.intro.start` line independent of the learner's state (the intro's seen-id is a hash of its text): "Read WHERE TO START at the top: it names the next thing to do from where you are."
5. **Arrival order** (S1 API, once SHARED_API.md section S1 is filled in): declare any popup holds your lab needs, so no intro or term card opens over an open tray or console, or during a first tap.
6. **Accuracy chip (D37):** in a concept lab, use `AccuracyNote variant="about"` (or the lab's equivalent prop) so only the lab's own note shows.

## Report

For each lab, a table: mechanism | done? | file:line | test | seen on screen. Then any SHARED NEEDS. Final reply: counts and the report path.

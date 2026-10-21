# Comp B brief: wiring and signal-flow audit, batch 1 (cable labs) — 2026-10-20

**Status: DRAFT, pending the owner's go to send.**

## Why
The owner wants every lab visual to reach **grade A** on wiring, cable routing, connections and signal flow. "A" means no error a working audio professional would catch. A B or B+ is a fail.

## What you have
Comp B has no app or database access. The owner places these in Downloads:
1. `WIRING_RULEBOOK_DRAFT_2026_10_20.md`: the standard to grade against. Each rule has an ID (C, L, F, S, P, R, G) and a status: U = universal, C = convention, H = house rule.
2. `WIRING_FINDINGS_2026_10_20.md`: what ccode's inventory already found. Do not re-report these. Do say if you disagree with one.
3. The source files listed below, for batch 1 only.

## Batch 1: the four cable labs
Paths are under `src/screens/lab/`.

| Lab | Files |
|---|---|
| Cable | `cable/art/wiring.tsx`, `cable/art/plugs.tsx`, `cable/art/sections.tsx`, `cable/art/kit.tsx`, `cable/art/kit2.ts`, `cable/data/connectors.analog.ts`, `cable/data/registry.ts`, `cable/data/testerCables.ts`, `cable/data/lesson01.ts` … `lesson12.ts` (those that exist) |
| Cable Install | `cableinstall/scenes/*.tsx` (22 files), `cableinstall/data/cableTypes.ts` |
| Connector Select | `connectorselect/art.tsx`, `connectorselect/pagesA.tsx` … `pagesD.tsx`, `connectorselect/data/*.ts` |
| Patchbay | `patchbay/art/*.tsx` (4 files), `patchbay/engine/*.ts`, `patchbay/pagesA.tsx` … `pagesD.tsx` |

The art is drawn in code (react-native-skia). Read the coordinates and labels as the picture. If the owner adds screenshots, grade those first.

## What to check, per drawing
1. **Connectors (C1–C13):**
   - right family, size and gender;
   - outputs male, inputs female (XLR);
   - pin numbers and roles right;
   - every plug fits its jack.
2. **Signal level and cable type (L1–L7, R5):**
   - the right level on each link;
   - the right cable for the signal;
   - no speaker level into a line input.
3. **Flow (F1–F8, S1–S7):**
   - direction arrows go source to destination;
   - processing order right;
   - insert serial, send/return parallel;
   - pre/post stated.
4. **Patchbays (P1–P6):** normal, half-normal, full-normal and open behave as stated; top is outputs and bottom is inputs, or the drawing says otherwise.
5. **Routing (R1–R7):**
   - every cable traceable along its own lane;
   - no cable ending in mid-air;
   - audio crosses power at right angles;
   - plugs drawn seated, at true scale.
6. **Words:**
   - each label matches what is drawn;
   - a convention is not taught as universal;
   - "polarity" and "phase" are used exactly.

## How to report
Use one table row per finding, in this format:

| ID | Lab | File:line | Sev | Rule | What is wrong | Why a pro would object | Proposed fix |
|---|---|---|---|---|---|---|---|

- **ID:** use `B-CB-01`, `B-CI-01`, `B-CS-01`, `B-PB-01`.
- **Severity:**
  - **S1** = wrong, or two screens disagree.
  - **S2** = a convention taught as universal.
  - **S3** = minor.
- **Grade each lab** A / B / C on wiring with the reason in one line.
- **Rules:** if a rule in the rule book is wrong or missing, list it separately under "Rule book notes".
- **Certainty:**
  - Mark anything you are unsure of "(verify)". Do not guess.
  - Do not report art style or colour unless it changes what the wiring means.
- **Owner-designed art (D79):** never propose replacing it. Name the wiring fault only.

## What happens next
ccode re-checks each finding in the code (✅ verified / ✗ rejected) and adds it to the register. The owner decides on fixes and signs off alone. Batches 2 to 4 (DJ, Sound Systems/Signal Chain/Gain/Production, Miking/Mixing/Mic) follow the same brief.

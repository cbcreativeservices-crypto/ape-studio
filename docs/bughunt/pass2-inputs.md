# Bug hunt — PASS 2, agent F: inputs, numbers and the calculators

Repo `C:\Users\profe\dev\ape-studio`, branch `audio-tools-engine`, 2026-09-18.
Read-only on source. No file changed except this one. No build, no EAS, no update,
no dev server, no network call.

## Baseline

- `npx tsc --noEmit` → **clean, exit 0**.
- `npm test` → **1439 tests, 1439 pass, 0 fail** (212 suites, 5.2 s).

Everything below therefore passes the type system and the existing suites.

## Method

Every claim about a calculator is machine-checked, not inferred. I loaded the real
registry with the same `registerHooks` resolver `test/calcDegenerate.test.ts` uses and
**executed all 163 compute functions across all 55 workspaces** with each field's own
placeholder value, rendering every numeric output through the real `formatOutput`/`fmt`
path. Then I re-derived the physics by hand for the subset listed under Coverage. The
production engine findings were produced the same way — by running `readStage()` against
the shipping stage data, not by reading it.

## Already reported in pass 1 — NOT repeated here

Pass 1 (`pass1-labs-content.md`) covered the calculator ground well. I verified and am
**not** re-reporting: the 70 V example/calculator mismatch; `warn` never blocking and
never firing on list fields; the `0.775` vs `√0.6` dBu reference; Voltage Drop's 20 °C
reverse solve and its unitless `REQUIRED AREA`; rack power factor; the network-audio MTU
estimate; speaker-cable AWG snapping; `MARGIN TO CEILING`; the dead `lv` field; the
timecode label table; the pad `K = 1` infinity. The pass-1 **blocker** in
`production/FieldRow.tsx` (table columns ignoring `kind`/`options`) is **fixed** — `Cell`
now renders choice/status/multiChoice chips and falls back to text when a choice column
has no options (`FieldRow.tsx:265-375`). Verified by reading the shipped file.

---

# BLOCKERS

## 1. Every calculator input goes through `parseFloat`, so a thousands separator or a decimal comma is silently accepted as a different number — and the shared report prints the text the user typed beside the answer computed from something else

**Severity:** blocker
**Confidence:** high on the mechanism (executed); the severity rests on how often a user
types a separator, which I judge to be often.
**Where:** `src/screens/lab/calc/calcPanel.tsx:44` (`buildValues`) and `:121` (the warn
path); the report echo at `src/screens/lab/calc/CalcWorkspaceScreen.tsx:207`; the same
parse again at `src/screens/lab/calc/CalcProjectsScreen.tsx:130`.

**What the user does:** opens Basic Electronics → RC cutoff frequency and types the
resistance the way it is written on every schematic and spec sheet: `10,000`.

**What happens:** `parseFloat("10,000")` is `10`. The lab computes the corner of a 10 Ω /
1 µF network and displays **15,920 Hz** (as `1.592e4 Hz` — see finding 4) instead of
**15.92 Hz**. Nothing is flagged: the field shows `10,000`, the answer stage shows a
confident number, `warn` does not fire because 10 Ω is a legal resistance, and
`computeError` never trips because the value is finite.

**What should happen:** either the separator is understood, or the input is refused with
a message. A source-of-truth calculator must not answer a question it misread.

**Why I believe it — executed, not reasoned:**

```
parseFloat("1,228")  -> 1        parseFloat("1 000") -> 1
parseFloat("12abc")  -> 12       parseFloat("1.2.3") -> 1.2
parseFloat("0x10")   -> 0        parseFloat(".5")    -> 0.5
```

`buildValues` (`calcPanel.tsx:38-48`) only rejects a value when `Number.isFinite` fails,
which none of the above do. The one genuinely-empty case (`"-"`, `""`) returns `null` and
correctly shows no answer.

**The part that makes it a blocker rather than a major:** the share path prints the raw
string, not the parsed value. `CalcWorkspaceScreen.tsx:205-209` builds the report inputs
from `raw[f.key]` — the literal text — while the results come from the parsed number. A
shared, branded, report-ID'd document therefore reads:

```
INPUTS
RESISTANCE ............... 10,000 Ω
RESULTS
CUTOFF FREQUENCY (−3 dB) . 1.592e4 Hz
```

Two mutually inconsistent lines in a document the owner's own copy calls a professional
calculator report. A recipient checking the arithmetic cannot tell which number was used.

Non-US decimal comma is the same defect one step worse: `1,228` → `1`, a 1000× error on a
dBu-to-volts conversion.

**Also affected by the same parse:** saved projects. `CalcProjectsScreen.tsx:130` parses
the stored value identically, so a project value saved as `1,5` is persisted as `1` and
reused by every workflow that imports it.

**Smallest honest fix:** normalise in one place before `parseFloat` — strip spaces and
group separators, and treat a lone `,` as a decimal point when there is exactly one and
no `.` — then feed the **parsed** value back into the report's INPUTS block so the
document can never disagree with itself.

## 2. In both Production labs a decimal point cannot be typed into a number, currency or duration field — and the attempt silently records a 10× or 100× value

**Severity:** blocker (downgrade to major if project data is considered non-critical; the
mechanism itself is not in doubt)
**Confidence:** high — traced through React Native 0.86.3's own `TextInput` source in
`node_modules`, not from memory. What would settle it completely: type `7.5` into
"Working hours per production day" on a device.
**Where:** `src/screens/lab/production/FieldRow.tsx:143-153`.

**What the user does:** Pre-Production → Schedule & Budget → "Working hours per production
day" and types `7.5`. Or "Total budget available" and types `1250.50`. Or
Post-Production → "Required programme duration" and types `28.5`.

**What happens:** the decimal point is deleted as they type it, and the digits after it
are appended to the digits before it. `7.5` is recorded as **75**. `1250.50` becomes
**125050**. The user sees the wrong number only if they look back at the box.

**Why:**

```tsx
value={value === null || value === undefined ? '' : String(value)}
onChangeText={(t) => {
  const cleaned = t.replace(/[^0-9.\-]/g, '');
  if (cleaned === '') return onChange(null);
  const n = Number(cleaned);
  onChange(Number.isFinite(n) ? n : cleaned);
}}
```

Keystroke by keystroke: `"7"` → `Number("7")` = 7 → the `value` prop is `String(7)` =
`"7"`. Next keystroke `"7."` → `Number("7.")` = **7** → the `value` prop is still `"7"`.
React Native then forces the native text back to the prop. From
`node_modules/react-native/Libraries/Components/TextInput/TextInput.js`:

- line 514, inside `_onChange`: `setLastNativeText(currentText)` — records `"7."`.
- lines 203-206, in the layout effect: `if (lastNativeText !== props.value && typeof props.value === 'string') { nativeUpdate.text = props.value; }` — `"7." !== "7"`, so it issues `setTextAndSelection` with `"7"`.

The `.` is gone before the user types the `5`, which lands as `75`.

**Blast radius:** 33 `number`, 10 `duration` and 2 `currency` declarations across the two
labs. The top-level ones where a decimal is the natural answer are
`schedule.hours_per_day`, `schedule.recording_hours`, `schedule.budget_total`,
`brief.program_duration`, `edit.assembly_duration`, `deliver.review_period`,
`define.size_estimate`. Table **cells** are unaffected (`Cell` stores raw strings) —
only the top-level editor.

**Downstream:** these feed real rules. `postprod/logic.ts:449-454`
(`edit-duration-off-target`) compares `assembly_duration` against `program_duration`
with a percentage tolerance; entering `28.5` as `285` on one side and `30` on the other
produces a loud, confident, wrong finding. `preprod/logic.ts:571-573` compares the summed
day schedule against `hours_per_day * 60`; `7.5` stored as `75` silences the
over-long-day check for the rest of the project. And the wrong number prints in the
exported packet.

**Fix:** hold the raw text in component state and lift the parsed number on blur (or keep
`value` as the user's string and only coerce in `num()`), which is what the table cells
already do.

## 3. Required fields — including the hazard register and the rights register — read COMPLETE when they hold nothing, a lone hyphen, or a date the engine cannot parse

**Severity:** blocker
**Confidence:** high — produced by running `readStage()` against the shipping stage data.
**Where:** `src/features/production/types.ts:184-191` (`isAnswered`),
`src/features/production/readiness.ts:64-71` (`decided`),
`src/screens/lab/production/FieldRow.tsx:424` (`+ ADD ROW`).

**What the user does:** taps `+ ADD ROW` on a required table and moves on. Or types `-`
into a required number field. Or types a date in their own country's format.

**What happens:** the field's dot turns green, the stage counts it as a decision made, and
the readiness meter — the thing the owner's spec insists must "evaluate actual decisions
rather than reward users merely for opening screens" — rewards an empty row.

**Measured, both labs, `film` pathway:**

| | required table fields | read `complete` from ONE BLANK ROW |
|---|---|---|
| Pre-production | 16 | **11** |
| Post-production | 6 | **5** |

The eleven include `readiness.hazard_register`, `readiness.rights_register`,
`readiness.manifest`, `readiness.contingency_table`, `people.participants`,
`technical.input_list`, `deliver.spec_table`, `deliver.reviewers`,
`schedule.milestone_list`. A blank row in the **hazard register** marks the safety field
complete. (The five that still read `attention` do so only because some other rule
happens to touch the same fieldId — not because anything checked the row.)

Every required `number`/`duration`/`currency` field tested reads `complete` holding the
string `"-"`, because `FieldRow.tsx:149` stores the unparsable text and
`isAnswered`'s string branch only trims and measures length. That includes
`finish.measured_integrated` and `finish.measured_true_peak` — the LUFS and dBTP numbers
the whole delivery-compliance promise of the post-production lab rests on. `num()`
(`rules.ts:77-84`) correctly returns `null` for `"-"`, so the loudness rules cannot fire
either: the field is green **and** unguarded.

Every required `date` field reads `complete` holding `next friday`.

**Why:** `isAnswered` is purely structural — `v.length > 0` for an array, `v.trim().length > 0`
for a string. It never asks the field whether the value means anything. `schema.ts`
exports an `isFieldAnswered`, and `validateSeeds()` exists precisely to force authored
seeds to use real values; the runtime answer path was never held to the same contract.

**What should happen:** a table row with no filled cell is not an answer; a `number` field
holding text `num()` rejects is not an answer; a date `when()` cannot read is not an
answer. Any of the three should read `missing`, not `complete`.

**Fix (small and local):** make `isAnswered` kind-aware — for `table`, require at least
one row with a non-empty cell; for `number`/`duration`/`currency`, require `num(v) !== null`;
for `date`, require `when(v) !== null`. `readiness.ts` and the meter then follow for free.

---

# MAJOR

## 4. Every calculator result between 10,000 and 10,000,000 is displayed in scientific notation — including sample rates, frequencies and exposure times

**Severity:** major (a reviewer could argue minor; a misread exponent is a 10× error in a
field tool, which is why I did not)
**Confidence:** high — executed.
**Where:** `src/screens/lab/calc/calcUnits.ts:140-150` (`fmt`), reached by every numeric
output through `formatOutput` (`calcPanel.tsx:78-84`) and by the `${fmt(...)}` in every
`steps()` line.

**What the user does:** any calculation whose answer is five, six or seven digits.

**What happens:**

```
distdelay/distToDelay   DELAY (µs) ................. 8.741e4 µs
imd/products            2ND-ORDER SUM (f₁+f₂) ...... 3.900e4 Hz
wave/distToFreq @ 1 cm  FULL-WAVE FREQUENCY ........ 3.432e4 Hz
loudtp/windows          MOMENTARY WINDOW (400 ms) .. 1.920e4 samples
convolution/cost        IR LENGTH IN TAPS .......... 9.600e4 samples
bitdepth/fromBits       QUANTIZATION LEVELS 2^N .... 1.678e7
dose/allowNiosh @ 70dBA ALLOWABLE TIME ............. 1.536e4 min
fft/tradeoff  (steps)   "With 4096 points at 4.800e4 Hz you resolve…"
```

48 kHz reads `4.800e4 Hz`. 39 kHz reads `3.900e4 Hz`.

**Why:** the guard at line 144 only routes `|x| ≥ 1e7` to exponential, but
`Number.prototype.toPrecision` **also** returns exponent form whenever the exponent is
≥ the precision — at the default `sig = 4` that is everything from 10,000 up. The comment
on line 145-146 shows the author hit this and normalised the `e+` spelling rather than
the format. Verified across `sig` 3/4/5 (the three the SIG FIGS bezel offers): the
threshold simply moves to 1,000 / 10,000 / 100,000.

**What should happen:** a plain integer with the digits the user expects, up to the
existing 1e7 ceiling.

**Fix:** when the `toPrecision` result contains `e` and `|x| < 1e7`, fall back to a fixed
representation — e.g. `Number(x.toPrecision(sig)).toString()`, which yields `48000`,
`39000`, `13640` and leaves every other case untouched.

## 5. Production-lab dates are free text parsed by `Date.parse`, so `01/04/2026` is read as 4 January, and a date the engine cannot read leaves its rules silently unfired while the field reads complete

**Severity:** major
**Confidence:** high for the parse results (executed on V8/Node); the exact Hermes
behaviour for the non-ISO forms should be confirmed on device — but both possible
outcomes (a US reading, or `null`) are wrong.
**Where:** `src/features/production/rules.ts:100-110` (`when`), the editor at
`src/screens/lab/production/FieldRow.tsx:159-171`.

**What the user does:** types a date into one of the 18 required-or-optional `date` fields
(plus 11 date columns) the way they write dates.

**What happens — measured:**

```
when("2026-03-15")      -> Sun Mar 15 2026    (the intended path, explicitly regex-handled)
when("15/03/2026")      -> null               (silently unreadable)
when("01/04/2026")      -> Sun Jan 04 2026    (user meant 1 April: three months out)
when("15-03-2026")      -> null
when("2026/03/15")      -> Sun Mar 15 2026
when("next friday")     -> null
```

Line 103-107 handles strict `YYYY-MM-DD` correctly and deliberately (constructing a local
`Date` rather than letting the ISO form be read as UTC — that part is good work). Line 108
then hands everything else to `Date.parse`, which is implementation-defined for non-ISO
input.

The consequence is not a visible error. `isAnswered` says the field is answered (finding
3), so it goes green; `when()` returns `null`, so every comparison in
`schedule-dates-do-not-fit` (`preprod/logic.ts:576-620`) that involves it is skipped. The
rule fails **open**: a delivery date before the production date is not reported. Confirmed
by running the rule: with ISO dates a mis-ordered schedule raises
`schedule-dates-do-not-fit`; with the same schedule typed `15/03/2026` the comparison is
skipped entirely (the finding I saw in my first `01/04/2026` run came from V8's US
reading, not from the check working).

**What should happen:** the field should either constrain input (a picker, or a masked
`YYYY-MM-DD`) or tell the user it could not read what they typed. A date the engine
ignores must not read as a decision made.

**Related, same file:** `clockMinutes` (`rules.ts:154-167`) returns `null` for `1600` and
`0900` — the bare 24-hour form call sheets are actually written in — and for `16h00` and
`noon`. The placeholder teaches `16:00 or 4pm`, so this is guided; it is still a silent
`null` into the day-schedule rules.

## 6. On Android every calculator field opens the full QWERTY keyboard, because `numbers-and-punctuation` is an iOS-only `keyboardType`

**Severity:** major
**Confidence:** high on the API (documented iOS-only in React Native and consistent with
`Libraries/Components/TextInput`); confirm on an Android device by opening any workspace.
**Where:** `src/screens/lab/calc/calcPanel.tsx:141`, and
`src/screens/lab/calc/CalcProjectsScreen.tsx:259`.

```tsx
keyboardType={isList ? 'default' : 'numbers-and-punctuation'}
```

`numbers-and-punctuation` has no Android mapping and falls back to `default`. So on
Android the flagship calculator lab — 55 workspaces, 163 functions, every input — presents
a text keyboard where a numeric keypad is meant, and letters typed into it are accepted
and silently truncated by `parseFloat` (`"12abc"` → `12`, finding 1). The app's own
production labs already do this correctly: `production/FieldRow.tsx:151` uses `'numeric'`,
which is cross-platform.

**Fix:** `Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'`, or just
`'numeric'` everywhere — it still offers `.` and `-`, which is all these fields need.

## 7. The panel-absorber calculator reports a "useful band" that is a single frequency, identical to the resonance above it

**Severity:** major (wrong information presented as a result)
**Confidence:** certain — executed.
**Where:** `src/screens/lab/calc/workspaces/roomsAdvanced.ts:269-275`.

**What the user does:** Panel & Helmholtz Absorbers → "Panel (membrane) absorber
resonance", 5 kg/m², 5 cm gap.

**What happens:**

```
RESONANT FREQUENCY ........... 120 Hz
USEFUL BAND (≈ ±½ oct) ....... 120 Hz
```

```ts
{ label: 'RESONANT FREQUENCY', value: f0, quantity: 'frequency' },
{ label: 'USEFUL BAND (≈ ±½ oct)', value: f0, quantity: 'frequency', chainable: false },
```

The second output is `f0` again. A band is not a frequency; ±½ octave around 120 Hz is
**85 – 170 Hz**, which is the number someone building a bass trap actually needs. The
`steps()` text beside it says the right thing in prose ("works roughly ±½ octave around
120 Hz"), so the result row is the only wrong element.

**Fix:** emit `f0 / √2` and `f0 · √2` as two outputs, or make it a text output naming the
range.

---

# MINOR

## 8. Comma-separated list fields silently discard anything they cannot parse, and split a spaced thousands separator into two values

**Where:** `src/screens/lab/calc/calcUnits.ts:163-169` (`parseList`), used by the resistor
list, the impedance list, the 70 V tap list, the Sabine surface/coefficient lists and the
exposure interval lists.

```
parseList("8, eight, 4")  -> [8,4]      (three speakers entered, two combined)
parseList("1 000, 10")    -> [1,0,10]   (a 1000 W tap becomes 1 W and 0 W)
parseList("1,5")          -> [1,5]      (one decimal-comma value becomes two)
parseList("8,,4")         -> [8,4]
```

In the 70 V workspace this under-reports the line load — the direction that leaves an
amplifier over-subscribed. The exposure dose functions already announce a length mismatch
between levels and durations (`splSafety.ts:496-505`, added on the QA night); the same
courtesy is not extended to a token that vanished. Worth one line of output whenever
`parseList` drops a token: "2 of 3 entries were read".

## 9. Two more numeric results carry their unit nowhere on screen

Same class as pass 1's `REQUIRED AREA`; these are the remaining two out of all 163
functions (checked programmatically — every other unitless output is genuinely
dimensionless: Q, K, ā, the source multiple).

- `src/screens/lab/calc/workspaces/powerElec.ts:355` — `HEAT OUTPUT` is BTU/hr, declared
  `quantity: 'number'` whose unit label is `''`. The row reads `2730` with no unit, directly
  under `MAINS CURRENT ... 6.667 A` and above `COOLING AIRFLOW (CFM)` which does name its
  unit. Rack heat load handed to an HVAC contractor as a bare number.
- `src/screens/lab/calc/workspaces/roomsAdvanced.ts:409` — `REQUIRED PANEL MASS` is
  kg/m², shown as `179.1` with no unit; the `lb/ft²` conversion on the next line has its
  unit in the label. Wall mass for a partition: exactly where an unlabelled number is worth
  fixing.

Both are one-word label edits.

## 10. Saving a project silently drops any value row that did not parse

**Where:** `src/screens/lab/calc/CalcProjectsScreen.tsx:125-135`.

```ts
if (!label || !Number.isFinite(base)) continue; // skip incomplete rows honestly
```

The comment says honestly, but nothing tells the user. A row typed as `abc` (easy on
Android, finding 6) or left labelled-but-empty disappears on SAVE with a success path and
no mention. The project then re-opens missing a value the user believes they entered. One
`notify()` naming the skipped labels would close it.

## 11. Exposure allowable time is pinned to minutes, so the two ends of the scale are unreadable

**Where:** `src/screens/lab/calc/workspaces/splSafety.ts:407` and `:441` (`unit: 'min'`).

```
115 dBA -> ALLOWABLE TIME  0.4688 min      (28 seconds)
140 dBA -> ALLOWABLE TIME  0.001453 min
 70 dBA -> ALLOWABLE TIME  1.536e4 min     (256 hours — also finding 4)
```

The value and unit are arithmetically correct and the criterion is displayed with every
result, which is the safety promise kept. But "0.4688 min" is the readout a user gets at a
level where the honest answer is "half a minute", and the unit chip cycles
min → ms → s, so the readable form is two taps away. Choosing the display unit by
magnitude (s below 1 min, h above 120 min) would fix both ends.

## 12. The rack-cooling temperature rise is a bare `number` in °F while every other temperature in the lab is a unit-aware field

**Where:** `src/screens/lab/calc/workspaces/powerElec.ts:337`.

```ts
{ key: 'dTempF', name: 'ALLOWABLE TEMP RISE (°F)', quantity: 'number', ... }
```

Every other temperature in the lab (`wave.temp`, `absorber.temp`, `roommodes.temp`…) is
`quantity: 'temperature'` with a °C ⇄ °F chip. This one is Fahrenheit-only with the unit in
the label and no chip, feeding the `1.08` constant that is itself imperial. A metric user
who enters 10 meaning °C gets a CFM figure for a 10 °F rise — 1.8× too much airflow
demanded (the safe direction, but wrong and undisclosed). It is labelled, so this is
consistency rather than a defect.

---

# Verified, not defects

Things the brief asked me to confirm or refute, and things I went looking for and did not
find. These are results, not padding.

- **The voltage-drop calculation is temperature-naïve — CONFIRMED — and it is LABELLED.**
  `powerElec.ts:14` uses `ρ_Cu = 1.724e-8 Ω·m` at 20 °C with no temperature term. The
  workspace `warnings` block (`:227-229`) states it unconditionally — *"Copper at 20 °C
  (ρ = 1.724×10⁻⁸ Ω·m); resistance rises ~0.4%/°C when hot"* — and
  `CalcWorkspaceScreen.tsx:524-528` renders that block on screen, uncollapsible, while
  `shareResult` (`:220-223`) routes it into the shared report. The same disclosure exists
  for the speaker-cable table (`speakers.ts:459-462`). So the approximation meets the
  owner's labelling rule. Pass 1 covers the residual "actionable gauge from a 20 °C model"
  risk; I confirm their arithmetic (at 75 °C, ×1.216 resistance, ≈0.84 AWG steps).
- **A rigging/flown-weight calculator is MISSING — confirmed.** There is no weight, load,
  bridle, WLL or centre-of-gravity calculation anywhere in `src/screens/lab/calc`
  (grepped for weight/rigging/kg/lb across all 55 workspaces). Nothing in the app promises
  one either: `COMING_SOON` in `registry.ts:60-64` is empty and the sections list has no
  rigging entry. So nothing wrong is being *shown* — this is an absence, not a defect, and
  the safest possible state for that particular calculation.
- **Formula correctness.** Of the 163 functions I re-derived or checked against a known
  reference value for the 75 listed under Coverage and found **no incorrect formula**. The
  dBu/dBV offset, the 20-vs-10 log distinction, RMS↔peak, `P = V²/Z`, the geometric band
  edges `f₁·f₂ = fc²`, `Q = √(2ᴺ)/(2ᴺ−1)`, the T/Pi pad networks, the AWG geometric
  definition and the Ω/m table (10/12/14/16/18 AWG), NIOSH 85/3/8 and OSHA 90/5/8 exposure
  math, energy summing, the piston SPL and port-length models, Sabine/Eyring, the mass law
  and the 1000/1001 pulldown are all right, and all carry their standards note.
- **Units are genuinely unit-aware.** Because `buildValues` converts to base units before
  `compute()` ever runs, switching a length field to feet, an area to ft², a volume to ft³
  or a temperature to °F feeds the metric constants (0.161, 0.057, 2000, `20·log10(d)`
  against a 1 m reference) correctly. I checked the conversion factors in
  `calcUnits.ts:60-137`: ft 0.3048, in 0.0254, ft² 0.09290304, ft³ 0.028316846592 —
  all exact. **No silent unit mismatch found anywhere in the 163 functions.**
- **Exposure time's `T * 60` is correct, not a bug.** `allowMin` returns minutes,
  `quantity: 'time'` has a base of seconds, and the display unit is `min`. The `× 60` is
  the required base conversion. Same for `TOTAL DURATION` in the Leq function.
- **Degenerate numbers do not leak.** `NaN`, `Infinity` and `-0` are contained: `fmt`
  returns `—`, `fmtInt` returns `—`, and `test/calcDegenerate.test.ts` sweeps every
  function for `NaN`/`Infinity`/`undefined` in any user-visible string. I found no new
  leak. Float noise (`1.0000000000000002`) cannot reach the user either — every numeric
  path goes through `fmt`'s 3–5 significant figures.
- **Division by a user-supplied zero, `log(0)`, `√(negative)`** all yield non-finite
  values that render `—` rather than a wrong number. Verified across the sweep.
- **Dynamic `RegExp` construction is safe.** All five sites escape their input —
  `glossaryLink.tsx:38`, `FlashcardsScreen.tsx:740`, `sentences.ts:315-318` (`escapeRe`),
  `CareerFinderQuizScreen.tsx:128` (a constant). None is built from a user-typed string.
- **The glossary search box is plain string comparison** (`GlossaryScreen.tsx:341-350`,
  `1962`), trimmed and lowercased, no regex — a regex-special character, a very long query
  and an empty query are all handled. Nothing to report.
- **Packet HTML escaping is correct.** `production/packet.ts` escapes every user value
  including table cells (`:77-81`, `:251`); the only unescaped branch is the table markup
  it generated itself. No injection, no broken layout from a `<` in a field.
- **Sliders are clamped.** `amp/kit.tsx:169-185` clamps to `[min, max]` after snapping,
  and correctly inverts the inset cap lane; `JogWheel.tsx`, `SpectrumColorPicker.tsx`,
  `ProgressRing.tsx` all clamp. I found no value able to leave its range.
- **The accept-a-condition sheet validates properly** — `AcceptConditionSheet.tsx:34`
  requires a trimmed name *and* a trimmed reason, and the button is `disabled` until both
  exist; `readiness.ts:74-81` re-checks the same on the data. Whitespace does not satisfy
  it. This is the model the rest of the field engine should follow.

---

# Coverage

**Executed:** all **55 workspaces / 163 functions**, every one run through its real
`compute()` with placeholder inputs and rendered through the real `fmt`/`formatOutput`
path; plus a programmatic audit of every field's quantity/unit declaration and every
numeric output's displayed unit.

**Physics re-derived or checked against a known reference value (75 functions):**
`wave` (6), `level` (10), `ohmspower` (7), `electronics` (7), `qbw` (6), `spldist` (4),
`spladd` (4), `dose` (5), `micgain` (3), `limiter` (2), `speakerpower` (3), `impedance` (3),
`cable` (3), `cv70` (2), `transformer` (2), `pads` (2), `vdrop` (2), `rackheat` (2),
`complexz` (2).

**Checked against the standard formula they cite, with the numeric result verified but the
embedded empirical constant taken as the published one (88 functions):** `distdelay`,
`phase`, `comb`, `latency`, `fft`, `compressor`, `bpm`, `pitch`, `filesize`, `roommodes`,
`sabine`, `treatment`, `critdist`, `schroeder`, `boundary`, `reflection`, `eyring`,
`diffuser`, `absorber`, `transloss`, `crossover`, `linearray`, `driver`, `clockdrift`,
`netaudio`, `timecode`, `firlen`, `convolution`, `bitdepth`, `stereomic`, `micsens`,
`rflink`, `loudnorm`, `loudtp`, `align`, `imd`. The constants I did not independently
derive are the published ones: 0.161 (Sabine), 0.057 (critical distance), 2000
(Schroeder), 60/√(m·d) (panel), 20·log(m·f)−47 (mass law), A/22 (fred harris FIR),
1.46·√(Av/π) (port end correction), 1.08 (CFM) and 3.412 (BTU/hr). I verified each is the
standard textbook value and that the workspace names its model in `warnings`; I did not
re-derive them from first principles.

**Production field engine:** all 6 screens/components, `schema.ts`, `types.ts`,
`rules.ts`, `readiness.ts`, `packet.ts`, both `logic.ts` sets, and all 14 stage data files
via the engine (`readStage` run against every required field of both labs on the `film`
pathway).

**Other inputs reached:** all 21 files containing a `TextInput`; every `keyboardType` in
the app; `maxLength` usage; the five dynamic-`RegExp` sites; the glossary search path; the
calculator projects/workflow/chain value paths; the shared report text renderer.

**NOT reached:**

- **Anything requiring a device or a running app.** No dev server, no simulator. Findings
  2 and 6 are traced through React Native's own source rather than observed; the exact
  Hermes `Date.parse` behaviour in finding 5 is likewise untested on device. Each names
  what would settle it.
- **The other 6 pathways of the production labs.** I ran `film`; `resolveStage` applies
  `onlyFor`/`labelBy` overlays per pathway, so a pathway-specific numeric or date field
  could exist that I did not enumerate. The three defects are in shared code, so the
  mechanism does not change — only the counts would.
- **The server side of the calculator cap** (`calc_consume` RPC) — no network calls.
- **Glossary term resolution** for the `glossary: [...]` chips — those are Supabase reads.
- **Audio/meter numeric paths** (SPL meter, tuner, de-esser): another agent's axis, and
  they are driven by native measurement rather than typed input.
- **Non-Latin numerals.** `parseFloat("٤")` is `NaN`, so an Arabic-numeral entry simply
  produces no result; I did not check whether any locale's keyboard would make that a
  common way in.

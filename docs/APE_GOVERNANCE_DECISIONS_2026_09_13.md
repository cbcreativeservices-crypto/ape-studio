# APE Governance Decisions — 2026-09-13

Decisions of record made by the owner on 2026-09-13. Where this document and memory or code disagree, this document wins (with `docs/SCREEN_STATUS.md`).

---

## R1 — Full screens and colour customization are FREE FOR EVERY TIER (STANDING RULE)

**Ruling (owner, 2026-09-13):** *"Make the full screens and custom color options available to all user free, account, member."*

The immersive full-screen tool views **and** colour customization are open to every tier — guest, free account, and Academy member alike.

**This reverses two earlier rulings:**

| Superseded | Was |
|---|---|
| `APE_GOVERNANCE_DECISIONS_2026_08_21.md` **R3** | Colour customization member-only, discreet wheel, gate popup for non-members |
| Owner ruling 2026-09-10 (recorded in `ToolLockUi.tsx`) | Full VU, Full Gauge, fullscreen waveform and the CenterLock stage were Academy-only |

**Implemented by DELETING the gates, not disabling them.** A gate left wired but unreachable is how the next reader concludes a feature is still gated:

- `src/components/ColorWheelButton.tsx` — the entitlement read and the MEMBER FEATURE popup are removed, along with the `useEntitlement` / `navigationRef` imports they were the only users of. The `feature` prop is kept (five call sites still pass it and it still says what each personalizes) with a docstring noting it no longer words a popup.
- `src/screens/tools/ToolLockUi.tsx` — `useFullScreenGate()` always proceeds and reports `locked: false`. **The hook is deliberately kept** and all three tool screens still call `fs.gate(...)`, so the policy lives in ONE place if it is ever re-gated, rather than being dissolved into three screens that would each have to be found again.

**⚠️ UNGATING THE DOOR IS NOT UNGATING THE ROOM (found in the copy sweep, same day).**

Removing the wheel's gate was **not sufficient**. `useToolColorPref` in
`src/features/tools/waveColorPref.ts` returned `!resolved || isMember ? color : null`
— so the stored colour stopped APPLYING for a non-member. Every tool colour runs
through that one hook (waveform trace, RTA bars, tuner in-tune colour, LED level,
LED average), so for a few hours a free user could open the wheel, pick a colour,
watch it save, and see nothing change — arguably worse than the honest "members
only" popup it replaced. The hook now always returns the stored colour.

Verified as a guest on the web preview: picking `#ff5a48` paints the trace
`#ff5a48`.

**The general lesson:** a paid feature is usually gated in at least two places —
the ENTRY (can you open it) and the EFFECT (does it do anything). Opening one
without the other produces a feature that appears available and silently does
nothing. When ungating, grep for the entitlement reads behind the feature, not
just the one on the button.

**⚠️ STILL MEMBER-ONLY — do not "tidy" these to match.** `useToolsLocked` has eight other consumers and only the full-screen one moved:

- Saved Measurements (`useSaveGate`)
- The LEARN / DEMO guided-training layer
- Advanced Training Labs (`section: 'training'`), Audio Fundamentals' `member` leaves, and everything else gated on entitlement

**Verified** on the web preview signed in as a GUEST: the colour wheel opens the TRACE COLOUR picker with no MEMBER FEATURE card; FULLSCREEN enters with no membership gate; and **SAVE SNAPSHOT still renders its 🔒**. That last check is the one that matters — it proves the change was surgical rather than a blanket ungating.

---

## R2 — Gate once at the door, not again inside the room

**Ruling (owner, 2026-09-13):** *"the harmonograph is already in member only area so colors are already approved."*

The Harmonograph viewer's ink-colour wheel carried its **own** member gate — a second MEMBER FEATURE card, separate from `ColorWheelButton`'s. It has been removed.

**Why it could never legitimately fire:** the Harmonograph is `section: 'training'` in `labCatalog.ts`, and training labs are locked at the ENTRY — `labCatalog.ts:41` states the rule as *"Lock = `leaf.member || section === 'training'`"*, under a section header reading **"ADVANCED TRAINING LABS · Members only"**. Anyone standing in that viewer has already passed a membership check. The inner gate's only real effect was to label a paid feature "members only" **to the member who had paid for it**.

**The general rule this establishes:** an entitlement check belongs at the boundary a non-member could actually cross. A second check deeper inside the same paid area is not defence in depth — it is a bug that shows a paying member a paywall.

Removed with its orphans: the `useEntitlement` / `navigationRef` imports, the `gateOpen` state and its BackHandler branch, and five now-unused styles (`gateTitle`, `gateBody`, `cta`, `ctaText`, `dismiss`). `overlayCard` stays — the ink picker still uses it.

---

## R3 — The Tools hub keeps its side-by-side tile arrangement

**Ruling (owner, 2026-09-13):** *"Tools hub should keep side by side arrangement."*

The tile grid is **two across at every width** — the column count is not responsive, and a proposed 2/4/8 column ladder was rejected mid-build. What changes on a wide screen is that the hub's content column stops growing (`HUB_MAX_CONTENT_W` = 560) and centres, so tiles settle at 246 pt on a tablet instead of ballooning to 351 or 479.

Found while implementing this and fixed with it: the grid previously spent **every** available pixel — measured, a 393 pt window left ONE spare and a 412 pt window (a common Android width) left **ZERO**. `styles.grid` is flex-wrap, so at zero slack one rounding difference drops the second tile onto its own row and the hub silently becomes a single column of half-width tiles. `TILE_FIT_SLACK` now reserves the margin, at a cost of one pixel of tile width.

---

## R4 — The Tools hub header carries a STUDY key

**Ruling (owner, 2026-09-13):** *"below the tio right [GLOSSARY] button add below it [STUDY] for use to go directly to the study dashboard."*

STUDY sits under GLOSSARY, routing to the Study tab's Dashboard. **Gold** against the glossary's blue: the two keys now share an edge and must be told apart at a glance, and gold is the Academy's own accent (the wordmark beside them uses it) while blue belongs to the Glossary wherever it appears. `popTo`, not `navigate` — under React Navigation 7, `navigate('Main')` pushes a second tab shell.

---

## R5 — Tile readouts are sized for the TILE, not for the artwork

**Ruling (owner, 2026-09-13):** asked for the nearest note and the Hz reading in the frequency-counter tile — **both of which already existed**, drawn at 58 viewBox units since the owner's own 2026-09-11 request.

Measured on the tile, they rendered **5 px tall at 0.4 opacity** — smaller than the CENTS label beside them, which is why they read as missing rather than as present-but-illegible.

**The standing rule this establishes:** the hub tiles draw a 2048-unit viewBox at roughly 155 pt, so **one unit is about a twelfth of a pixel**. Anything meant to be READ on a tile must be sized against the TILE, not against the artwork's own scale. Text that looks right in the source art disappears entirely on the tile.

Now 124 units (~11 px resting, ~18 px with a live reading), weight 700, resting opacity 0.5 so the honest em-dash — what shows when no pitch is detected — reads *as* an em-dash while staying clearly dimmer than a real reading.

---

## R6 — SPL tile flicker: retired, not fixed

**Ruling (owner, 2026-09-13):** *"spl tile flicker is retired for now - no longer an issue."*

The companion tuner-tile flicker WAS fixed (its retired round car-gauge strip sat underneath the live mini and showed on every engine dropout). The SPL one never reproduced under instrumentation and is closed unfixed.

**One thing left on the record for whoever picks it up:** `HubSplSkin` mutates its ballistic refs (`vuRef`, `vuVelRef`, `lastTickRef`) **during render**. Under React 19 concurrent rendering a render can be started and discarded; the ref mutations survive, the output does not, and because `lastTickRef` was already advanced the next render skips that step — the needle misses a step and lurches, intermittently, logging nothing. This was never observed, only reasoned. The diagnostic probe was removed at the owner's instruction when the issue was retired.

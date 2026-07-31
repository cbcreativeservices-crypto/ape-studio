# Pending Glossary Term — "Subtractive Mixing"

**Status:** authored, AWAITING INGEST (next phase / "computer B").
**Author:** computer A, 2026-08-01.
**Action for computer B:** insert as ONE new glossary row using the fields below.
Maps 1:1 to the app's glossary schema (`Entry` + `EntryDetail` in
`src/screens/glossary/GlossaryScreen.tsx`):
`term`, `definition`, `plain_english`, `purpose_function`,
`practical_application`, `scenario_contexts[]`, `common_mistakes[]`,
`related_terms[]`, `category`, `difficulty`.

> Note: this is subtractive **MIXING** (carving space *between tracks* by cutting),
> which is a different concept from subtractive **SYNTHESIS** (filtering one
> harmonically rich sound). Both may exist in the glossary; keep them separate.

---

## Machine-ingestable record (JSON)

```json
{
  "term": "Subtractive Mixing",
  "definition": "A mixing approach in which clarity, separation, and tonal balance are achieved primarily by attenuating (cutting) frequencies and reducing or removing elements, rather than by boosting them. By carving competing energy out of overlapping tracks — instead of adding gain or EQ boosts — each source is given its own space in the frequency spectrum and the stereo field. Subtractive mixing preserves headroom, reduces frequency masking and low-end buildup, and generally yields a cleaner, more natural result than additive (boost-heavy) mixing.",
  "plain_english": "Making a mix sound clear by taking things away instead of adding them. Rather than turning a part up or boosting its EQ so it stands out, you cut the frequencies that get in the way on the OTHER tracks. Give each instrument its own space by removing what it doesn't need — less clutter, cleaner mix.",
  "purpose_function": "To control frequency masking, low-end buildup, and level creep. Cutting instead of boosting keeps overall level and headroom in check, avoids the added noise and phase artifacts that boosts can introduce, and forces the engineer to fix the real problem (competing energy between sources) rather than paper over it with more gain.",
  "practical_application": "When two sources fight in the same range (kick vs. bass, vocal vs. guitars), cut the less-essential source in the overlapping band instead of boosting the one you want to hear. Use narrow cuts to tame resonances and problem frequencies, high-pass sources that carry no useful low end, and pull faders down or mute unneeded parts to open the mix. Reach for a boost only after subtractive moves are exhausted.",
  "scenario_contexts": [
    "Kick vs. bass: dip or high-pass the bass around the kick's fundamental (or vice-versa) so both read clearly without either being boosted.",
    "Vocal clarity: instead of boosting the vocal's presence, cut competing upper-mids in guitars/synths to open a pocket for it.",
    "Muddy mix: high-pass every source that doesn't need sub content and dip the shared 200-400 Hz buildup across the tracks that own it.",
    "Complementary EQ: where one track is cut in a band, its partner can be left flat (or gently lifted) so they interlock rather than stack."
  ],
  "common_mistakes": [
    "Reaching for a boost first. Boosting adds level and can worsen masking; cut the competing track before boosting the one you want forward.",
    "Over-cutting until the mix sounds thin and lifeless — subtraction removes what competes, it doesn't strip out an instrument's body.",
    "Cutting the same band on every track, which hollows the whole mix; identify which single source should own each range.",
    "Confusing subtractive MIXING (cutting to separate tracks) with subtractive SYNTHESIS (filtering a rich oscillator to shape one sound)."
  ],
  "related_terms": [
    "Subtractive Synthesis",
    "Frequency Masking",
    "Equalization (EQ)",
    "High-Pass Filter",
    "Complementary EQ",
    "Additive Mixing",
    "Headroom",
    "Gain Staging"
  ],
  "category": "Mixing",
  "difficulty": "Intermediate"
}
```

---

## Human-readable copy (same content)

**Term:** Subtractive Mixing

**Definition (ADV):**
A mixing approach in which clarity, separation, and tonal balance are achieved
primarily by attenuating (cutting) frequencies and reducing or removing elements,
rather than by boosting them. By carving competing energy out of overlapping
tracks — instead of adding gain or EQ boosts — each source is given its own space
in the frequency spectrum and the stereo field. Subtractive mixing preserves
headroom, reduces frequency masking and low-end buildup, and generally yields a
cleaner, more natural result than additive (boost-heavy) mixing.

**Plain English (BEG):**
Making a mix sound clear by taking things away instead of adding them. Rather than
turning a part up or boosting its EQ so it stands out, you cut the frequencies
that get in the way on the OTHER tracks. Give each instrument its own space by
removing what it doesn't need — less clutter, cleaner mix.

**Purpose / Function:** control masking, low-end buildup, and level creep; keep
headroom; fix the real problem (competing energy) instead of adding gain.

**Practical Application:** cut the less-essential source in a shared band instead
of boosting the wanted one; narrow cuts for resonances; high-pass sources with no
useful lows; lower faders / mute to open the mix; boost only as a last resort.

**Category:** Mixing · **Difficulty:** Intermediate

**Related:** Subtractive Synthesis (distinct), Frequency Masking, EQ, High-Pass
Filter, Complementary EQ, Additive Mixing, Headroom, Gain Staging.

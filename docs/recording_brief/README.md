# Recording Engineer Brief — source

`2026-10-01_APE_RECORDING_ENGINEER_BRIEF_v2.html` is the brief the owner SENT to the outside
recording engineer on 2026-10-01. The engineer has started recording from it. This folder is the
source that builds it.

- `rb2_items1.py`, `rb2_items2.py`, `rb2_items3.py` hold the data. There are 89 items, and each one holds `recs`, one per
  DISTINCT recording (523 recs, 593 files to deliver). Two recordings share a rec ONLY when they are identical in method,
  context and teaching point (alternate takes, or a derived copy of the same take). That rule is the owner's.
- `rb2_diagrams.py` holds the 60 new figures: session floor plans, input lists, run-order bars, mic
  placements, safety signal chains, the meter, the loop cut and filename anatomy, and the gear matrix.
  The other five figures are SVG constants in `rb2_build.py`.
- `rb2_build.py` is the generator. It writes to Downloads by default, and `RB_OUT=<path>` overrides that.
- `rb2_check.py <html>` checks that the HTML parses, has no duplicate ids, and has no broken internal links.

Rebuild (identical output verified 2026-10-01):

```bash
cd C:\Users\profe\dev\ape-studio\docs\recording_brief; python rb2_build.py
```

Add-on 1 — Drum Tuning Lab (drafted 2026-10-01, owner said yes to drafting; NOT yet sent):
- `rb2_drum_addon.py` builds `Downloads\2026-10-01_APE_RECORDING_BRIEF_ADDON_DRUM_TUNING.html` (RB_OUT overrides). It reads
  the CSS and page script out of `rb2_build.py` by regex so the two documents stay identical in look, and draws its own
  figures with the `rb2_diagrams` primitives. New prefix `DRM-` (asserted unused in v2), new folder `drum_tuning/`,
  Session 8. 10 items, 136 distinct recordings, 215 files; one rec per stroke or per lug tap, two files only when one
  strike is heard by the close mic and the SEAT mic (drummer's ear) at once. Adds `tunings.csv` (per-lug device readings
  per tuning state) and six sidecar columns. Check it with `rb2_check.py` as well.

Rules learned building it:
- Never use dark code blocks or dark figures. The owner hates black boxes. The page also sets
  `color-scheme: only light` so browsers don't auto-darken it.
- Put each diagram next to the recording it explains, not only in the session plan.
- Every SVG copy needs its own id prefix, or the duplicate-id assert fails.
- `rb2_build.py` has CRLF line endings, so edit it with Python `newline=''` or with the Edit tool.

Open points the engineer may raise:
- The MPR-04a.2 pop-filter geometry was corrected so the filter sits about 1 in from the lips and the mic 3 in away. The owner should confirm this.
- The session-3 gear list lacks the ribbon mic that MSL-01 needs. It is flagged in the input list.
- The bucket folder names in the brief are proposals. Only `bass_fretboard`, `demo_signals`,
  `mixing_lab` and `critical_listening` exist in the `lab-audio` bucket.

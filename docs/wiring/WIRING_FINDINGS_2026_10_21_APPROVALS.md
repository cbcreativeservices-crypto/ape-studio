# Owner approvals for the unattended run (2026-10-21, owner leaving for work)

1. **Push:** push `dj-lab` and `next-store-build` once the merge is done and the full suite passes. No eas, no OTA, never `audio-tools-engine`.
2. **Merge:** merge `dj-lab` into `next-store-build` in the `ape-build-snap` worktree (already on that branch; no branch switch). Run the full suite + tsc there.
3. **CRLF tests:** fix the Windows-only CRLF test failures in the tests only (normalise line endings on read). No app code.
4. **Round 4:** fresh graders on all labs; fix confirmed findings with tests on `dj-lab`, re-merge. Design-level items go on the owner list, not built.
5. **Digital clock card:** add one lesson card on clock master / word clock (75 Ω BNC) / AES3 and S/PDIF. Copy marked for owner review.
6. **Judgment calls:** take ccode's recommendation (more accurate / better for learning) and list each one in the handoff, to reverse if the owner disagrees.
Also approved earlier today: steel C04 VOL PEDAL fix; rule book APPROVED v1 with Comp B's 9 additions.

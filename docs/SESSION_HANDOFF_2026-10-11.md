# Session handoff — written 2026-10-10 (night), for the next session

**Read this first.** The rules decided today are in `docs/APE_GOVERNANCE_DECISIONS_2026_10_10.md` (D67–D74). The lessons are in `docs/APE_ENGINEERING_LESSONS.md` (section 2026-10-10).

## Where things are
- **Worktree:** `C:\Users\profe\dev\ape-build-snap`, branch **next-store-build**. Pushed to origin at c20732f7 (plus the docs commit for this handoff). The full suite was 10210/10210 and tsc was clean at c33e45ed.
- **Stores:** Apple 1.0 build 36 and Google production 20 are **IN REVIEW**. Apple rejected once under 3.1.2 (a missing Terms link in the description); Comp A fixed and resubmitted. Launch target: Tue 2026-10-13.
- **Website:** the `/terms` page now carries "Subscriptions & In-App Purchases" with the Apple Standard EULA link. It is LIVE (076844a8 on audio-tools-engine; the owner pushed it).
- **OTA:** preview channel only (Android runtime b975a5d1, group 5ac13339). **Production is held** under D74.

## ⏳ MUST DO when BOTH stores approve (owner: "don't forget anything")
1. Ask the owner to confirm both approvals; I cannot see the store consoles. `git status` and `git log c20732f7..` — say what rides along.
2. `preview_stop` the web preview. Run tsc and the full suite. Run `npx eas-cli update:list --branch production` and check for a rollback.
3. **Android 20:**
   - Check that `npx expo-updates fingerprint:generate --platform android` = **b975a5d1**.
   - Publish: `npx eas-cli update --branch production --platform android --environment production --message "…" --non-interactive`.
4. **iOS 36:**
   - Remove `expo.android.blockedPermissions` from app.json.
   - Check that the fingerprint for `--platform ios` = **f6a7ee3c**.
   - Publish with `--platform ios` to production.
   - Restore app.json byte for byte; `git diff` must be empty.
5. **At the same moment:** run `node scripts/upload-topic-tiles.mjs` to upload the 24 new topic tiles to the `topic-tiles` bucket. It needs the service key via the clipboard or env, never a placeholder command. Spot-check 2–3 of the new public URLs.
6. Prove the update landed on a device (Sentry OTA context or Pixel logcat). Report the update IDs.
7. **Also owed after approval:**
   - the owner's EDITED onboarding video swap, by update (`assets/onboarding/intro_v2` + `INTRO_VIDEO`);
   - launch day: web gate off plus store links (web/lib/gate.ts, web/lib/appstore.ts), push audio-tools-engine, check the pages return 200.

## Done today (all owner-approved in the browser unless noted)
- **Art pass across all labs:**
  - PNG head icons (lips anchored);
  - chair audiences;
  - guitar and bass turned 180°;
  - real stands, desk arms, mics, violin, tuba, VU (it reuses the SPL tool's meter);
  - Room Design SIDE VIEW in the dock;
  - the F04 jug;
  - the sleeve knob removed;
  - the violin bow drawn at the end of a down-bow, with the BOW label on the stick.
- **Figures (D68):**
  - anatomical arms, wrists and hands everywhere (one shared arm);
  - the left hand on violin, viola, cello and bass necks fixed;
  - the cellist raised, with the side SCROLL label hidden;
  - guitar wrist ≤ 70°.
  - The pages that still draw their own arms are listed below.
- **Cables (D70):**
  - traceable lanes and pro dressing across Cable Install and Sound Systems;
  - 2-way wedges everywhere, including the Miking plans;
  - a MON → snake return lane;
  - monitor sends from the snake side.
- **Patchbay lab:** on the Rack Unit (12 modules).
- **Clavinet:** real key action redrawn.
- **Speaker Coverage:** line array raised.
- **Other-labs clash sweep:** 17 fixes.
- **Comp C technical audit:** about 535 rows applied (D72).
- **Comp C images:** the picker is `Downloads/2026-10-10_COMP_C_IMAGE_PICKER.html`. The owner's choices are `Downloads/2026-10-10_COMP_C_IMAGE_CHOICES.csv`.
  - 24 accepted and installed (0d9b086a). They reach users only via the bucket upload in step 5 above.
  - 18 rejected; the brief for Comp C is `Downloads/2026-10-10_COMP_C_IMAGE_REDO_BRIEF.md`.

## Open / waiting
- **Comp C images:** the redo of the 18 rejected images, plus images 43–54 and all of Job 2 (43 certificate images). These never arrived; item 42's FINAL file was truncated. When they come, rebuild the picker with `scratchpad/picker/build_picker.py` (or rewrite it from the D73 notes) and install only on the owner's explicit go.
- **Pages still drawing their own arms** (not yet on the shared anatomical arm):
  - woodwinds/WindArt (A06);
  - mallets/MalletArt (I07–I10);
  - kitScene/KitSceneArt;
  - metal/metalArt;
  - handdrums/HandPlan;
  - cymbals/CymbalFxArt;
  - c10Harp/art;
  - f02Clothing/art;
  - the A10/A11 finger-on-key hands.
  - Offer this to the owner as a next pass.
- **Mandolin and soprano ukulele fretting wrist:** left as it is (owner).
- **Later (planned, not started):** the realistic figure redo (hybrid Comp C + artist agent); the Signal Chain Builder; Production Labs; the Wave Physics spike. All wait for the owner's go.
- **Standing rules this session added:** D67–D74, plus the memory files feedback_controls_at_bottom, feedback_cables_traceable and feedback_hammond_allowed (expanded).

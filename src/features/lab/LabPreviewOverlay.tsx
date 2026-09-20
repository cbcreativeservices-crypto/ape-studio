/**
 * LabPreviewOverlay — root overlay for a free-user Training-Lab preview (owner
 * 2026-08-02). Mounted beside the navigator; when a preview is active it renders
 * the shared UpgradeSheet OVER the live lab. UpgradeSheet is already a
 * full-screen grayed backdrop that intercepts every touch + shows the Academy
 * upgrade popup at the bottom — so the lab keeps running (readouts, animations,
 * mic) behind it, visible but grayed and non-interactive.
 *
 * Exits pop the lab off the stack so a free user never lands back on a live,
 * interactive members-only lab.
 */
import { UpgradeSheet } from '../commercial/UpgradeSheet';
import { navigationRef } from '../../navigation/navigationRef';
import { beginLabPreviewLeave, endLabPreview, useLabPreview } from './labPreviewStore';

export function LabPreviewOverlay() {
  const { active } = useLabPreview();

  // Leave the previewed lab back to the list. The scrim must stay up THROUGH the
  // stack-pop animation: clearing it at/before goBack() reveals the live
  // (ungrayed) lab for a beat as it slides out (user report 2026-08-12). The
  // overlay is a root sibling above the navigator, so keeping it visible covers
  // the whole transition; clear it once the pop has settled.
  const leaveLab = () => {
    beginLabPreviewLeave(); // hold the scrim through the pop; safety net stands down
    // ⛔ ONLY CLEAR IF THE POP ACTUALLY HAPPENED. If there is nothing to go back
    //    to, dropping the scrim 350 ms later would leave a free user sitting on
    //    a live, fully interactive members-only lab. Leaving the scrim up keeps
    //    the gate closed; the sheet is still there to exit by.
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
      setTimeout(endLabPreview, 350);
    }
  };

  return (
    <UpgradeSheet
      visible={active}
      onClose={leaveLab}
      onSeePlans={() => {
        // Pop the previewed lab, then push the Paywall over the top.
        //
        // ⛔ THE SAME HOLD AS leaveLab, FOR THE SAME REASON. This used to clear
        //    the preview immediately, on the assumption that "the Paywall hides
        //    the lab, so there's nothing to flash" — but the push is ANIMATED,
        //    and clearing before it lands drops the scrim off the live lab for
        //    the length of the transition. beginLabPreviewLeave() stands the
        //    safety net down so the scrim can cover both moves.
        beginLabPreviewLeave();
        if (navigationRef.isReady() && navigationRef.canGoBack()) navigationRef.goBack();
        if (navigationRef.isReady()) navigationRef.navigate('Paywall');
        setTimeout(endLabPreview, 350);
      }}
    />
  );
}

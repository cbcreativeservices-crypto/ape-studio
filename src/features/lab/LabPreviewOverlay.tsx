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
import { endLabPreview, useLabPreview } from './labPreviewStore';

export function LabPreviewOverlay() {
  const { active } = useLabPreview();

  const leaveLab = () => {
    endLabPreview();
    if (navigationRef.isReady() && navigationRef.canGoBack()) navigationRef.goBack();
  };

  return (
    <UpgradeSheet
      visible={active}
      onClose={leaveLab}
      onSeePlans={() => {
        // Pop the previewed lab first, then open the paywall — so returning from
        // the paywall lands on the lab list, never back on the live lab.
        leaveLab();
        if (navigationRef.isReady()) navigationRef.navigate('Paywall');
      }}
    />
  );
}

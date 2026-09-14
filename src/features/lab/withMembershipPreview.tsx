/**
 * withMembershipPreview — the members-only Training-Lab gate, at the SCREEN.
 *
 * The Ear Lab landing arms the free-user preview (startLabPreview) before it
 * navigates to a locked lab, so a row tap is gated. But a lab screen can also
 * be reached WITHOUT passing that landing:
 *   • a custom-scheme deep link — `proaudio://labs/compression` — which React
 *     Navigation resolves straight to the screen via linking.config, and
 *   • a pendingLink resume after sign-in (navigateToPath in Auth / Paywall).
 * Both bypass the Ear Lab entirely, so before this the lab opened LIVE for a
 * non-member (navigation/notifications bug hunt 2026-09-14, finding E1).
 *
 * This wrapper closes every one of those routes in one place: wrapped ONCE in
 * RootNavigator's gated registry, it arms the SAME preview the Ear Lab uses the
 * moment a resolved non-member lands on a members-only lab. The root
 * LabPreviewOverlay then draws the grayed UpgradeSheet over the live lab, the
 * AudioOutputGate stays muted, and labCompletion refuses credit — identical to a
 * locked row tap. Members (and anyone before entitlement resolves) see the lab
 * untouched, so a paying member never gets a paywall (the "gate once, at the
 * door" rule — the deep link IS a door a non-member can cross).
 *
 * Cold-boot flash: a deep link can mount the lab BEFORE the first server
 * entitlement read resolves. Mounting the live lab in that window would flash
 * the paid content (and start its engine/mic) at a non-member for a beat. So —
 * exactly like withAmplitudeOrientation's hydration beat — a members-only route
 * renders NOTHING until entitlement is known, and a resolved non-member renders
 * nothing until the preview is actually armed, so the lab only ever mounts
 * behind the scrim.
 *
 * The membership decision is read from labCatalog (isMemberOnlyLabRoute), the
 * one source of truth the Ear Lab's row locks also use, so the list and the gate
 * can never disagree. A route that is not members-only no-ops, so this is safe
 * to compose over any lab screen.
 */
import { useEffect } from 'react';
import { View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { colors } from '../../theme/tokens';
import { useEntitlement } from '../commercial/EntitlementProvider';
import { isMemberOnlyLabRoute, labRouteName } from '../../screens/lab/labCatalog';
import { endLabPreview, getLabPreview, startLabPreview, useLabPreview } from './labPreviewStore';

/** Full-bleed hold shown for the sub-second beat before the lab may mount. Never
 *  the live lab — see the cold-boot flash note above. */
function GateHold() {
  return <View style={{ flex: 1, backgroundColor: colors.screenBg }} />;
}

export function withMembershipPreview<P extends object>(
  Screen: React.ComponentType<P>,
): React.ComponentType<P> {
  function Guarded(props: P) {
    const route = useRoute();
    // Real academy standing; `resolved` false until the first server read lands.
    const { isMember, resolved } = useEntitlement();
    const memberOnly = isMemberOnlyLabRoute(route.name);
    // A resolved non-member on a members-only route is the one case we gate.
    const gated = memberOnly && resolved && !isMember;
    const preview = useLabPreview();
    const armedForThis = preview.active && preview.route === route.name;

    useEffect(() => {
      if (gated) {
        // Arm the preview if it isn't already (the Ear Lab arms it BEFORE
        // navigating, so a row tap arrives armed — don't re-arm and flicker).
        if (!armedForThis) startLabPreview(route.name, labRouteName(route.name) ?? 'This lab');
        return;
      }
      // Entitled (or unknown, or not a members-only route): clear only a stale
      // preview WE would own for this route — e.g. entitlement upgraded while
      // the lab is open. The LabPreviewOverlay owns the ordinary leave.
      if (memberOnly && armedForThis) endLabPreview();
    }, [gated, memberOnly, armedForThis, route.name]);

    // Unknown beat: hold rather than flash the paid lab (or a paywall at a
    // member). Non-member: hold until the scrim is actually up, so the lab
    // mounts behind it, never in front of it.
    if (memberOnly && !resolved) return <GateHold />;
    if (gated && !armedForThis) return <GateHold />;

    return <Screen {...props} />;
  }
  Guarded.displayName = `WithMembershipPreview(${Screen.displayName ?? Screen.name ?? 'Screen'})`;
  return Guarded;
}

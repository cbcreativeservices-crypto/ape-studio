/**
 * Texas SB 2420 age gates (owner go 2026-11-27, 1.0.1): Apple's Declared Age
 * Range API needs the `com.apple.developer.declared-age-range` entitlement
 * (Boolean, iOS 26.0+). Without it AgeRangeService answers nothing and the
 * app falls back to 'unknown', today's self-confirmation.
 * https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.declared-age-range
 *
 * ⚠️ NATIVE: lands only with a store build. The App ID must carry the
 * "Declared Age Range" capability, or signing fails: check it in the Apple
 * Developer portal (Identifiers → com.cbcreativeservices.apestudio) before the
 * build if EAS does not enable it by itself.
 *
 * Android needs no manifest change for the Play Age Signals API.
 */
const { withEntitlementsPlist } = require('expo/config-plugins');

const DECLARED_AGE_RANGE = 'com.apple.developer.declared-age-range';

function addDeclaredAgeRange(entitlements) {
  return { ...entitlements, [DECLARED_AGE_RANGE]: true };
}

const withDeclaredAgeRange = (config) =>
  withEntitlementsPlist(config, (c) => {
    c.modResults = addDeclaredAgeRange(c.modResults);
    return c;
  });

module.exports = withDeclaredAgeRange;
module.exports.addDeclaredAgeRange = addDeclaredAgeRange;
module.exports.DECLARED_AGE_RANGE = DECLARED_AGE_RANGE;

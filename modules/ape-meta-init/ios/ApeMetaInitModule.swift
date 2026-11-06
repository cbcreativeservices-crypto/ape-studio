// ape-meta-init — iOS Expo module (1.0.1, 2026-11-05).
//
// ⚠️ NEVER COMPILED: written on Windows. The first iOS build is its first
// compile. Names read from Meta's source, FBSDKCoreKit 18.0.0 and 18.1.1.
//
// react-native-fbsdk-next has no activateApp, and automatic logging is off, so
// nothing else makes this call. JS makes it only after
// src/features/growth/metaGate.ts says yes, and never after a turn-off.
//
// It sends the install report once ever, and the app open and the last
// session's length. A return to an app still in memory logs no new open: the
// SDK's own didBecomeActive observer loads its session data first, and then
// this call finds it loaded and does nothing. Coming back later than that is
// counted at the next fresh start.
import ExpoModulesCore
import FBSDKCoreKit

public class ApeMetaInitModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ApeMetaInit")

    // Main queue: Meta asks for it, and the library's initializeSDK runs there
    // too. initializeSDK does nothing the second time, so this is safe whichever
    // call lands first.
    AsyncFunction("activateApp") { () -> Bool in
      ApplicationDelegate.shared.initializeSDK()
      AppEvents.shared.activateApp()
      return true
    }.runOnQueue(.main)
  }
}

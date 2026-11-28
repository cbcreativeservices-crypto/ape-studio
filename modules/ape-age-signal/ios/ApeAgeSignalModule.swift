// ape-age-signal — Expo Module (Swift): Apple's Declared Age Range for the
// Texas SB 2420 age gates (owner go 2026-11-27, build 1.0.1).
//
// Docs (read 2026-11-27):
//   https://developer.apple.com/documentation/declaredagerange/agerangeservice
//   https://developer.apple.com/documentation/declaredagerange/agerangeservice/iseligibleforagefeatures
//   https://developer.apple.com/support/age-assurance
//
// FLOW
//   1. iOS < 26.2, or an SDK without DeclaredAgeRange  → kind "unsupported".
//   2. isEligibleForAgeFeatures == false (age assurance does not apply to
//      this person: not a covered region / account)   → kind "ineligible".
//      No sheet is shown to anyone outside a covered region.
//   3. requestAgeRange(ageGates: 13, 18, in: vc):
//        .sharing(range)   → kind "sharing" + lowerBound / upperBound
//        .declinedSharing  → kind "declined"
//        throws            → kind "error" + the error case's NAME
//                            (notAvailable, invalidRequest, and on iOS 27
//                            declinedOnboarding, invalidAccount, network).
//      The error is read by name so cases newer than the build SDK still
//      compile and still reach JS (they all map to 'unknown' there).
//
// Only the two bounds leave this file. The declaration method, parental
// controls and everything else are never read. Nothing is stored or sent:
// the JS side keeps the band in memory for the session (storeAge.ts).
//
// The entitlement com.apple.developer.declared-age-range is added by
// plugins/withDeclaredAgeRange.js. DeclaredAgeRange is weak linked (podspec),
// so the app still launches on iOS 15–25.
import ExpoModulesCore
import UIKit
#if canImport(DeclaredAgeRange)
import DeclaredAgeRange
#endif

public class ApeAgeSignalModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ApeAgeSignal")

    Function("moduleVersion") { () -> Int in 1 }

    // Resolves, never rejects: every failure is a raw answer JS maps to
    // 'unknown'. The system sheet needs the main thread.
    AsyncFunction("requestAgeSignal") { (promise: Promise) in
      Task { @MainActor in
        let out = await self.ask()
        promise.resolve(out)
      }
    }
  }

  private static func answer(_ kind: String, _ extra: [String: Any] = [:]) -> [String: Any] {
    var out: [String: Any] = ["platform": "ios", "kind": kind]
    for (k, v) in extra { out[k] = v }
    return out
  }

  @MainActor
  private func ask() async -> [String: Any] {
    #if canImport(DeclaredAgeRange)
    if #available(iOS 26.2, *) {
      do {
        let eligible = try await AgeRangeService.shared.isEligibleForAgeFeatures
        if !eligible { return Self.answer("ineligible") }
      } catch let e as AgeRangeService.Error {
        return Self.answer("error", ["error": String(describing: e)])
      } catch {
        return Self.answer("error", ["error": "other"])
      }

      guard let vc = appContext?.utilities?.currentViewController() else {
        return Self.answer("error", ["error": "noViewController"])
      }

      do {
        let response = try await AgeRangeService.shared.requestAgeRange(ageGates: 13, 18, in: vc)
        switch response {
        case .sharing(let range):
          var bounds: [String: Any] = [:]
          if let lo = range.lowerBound { bounds["lowerBound"] = lo }
          if let hi = range.upperBound { bounds["upperBound"] = hi }
          return Self.answer("sharing", bounds)
        case .declinedSharing:
          return Self.answer("declined")
        @unknown default:
          return Self.answer("error", ["error": "unknownResponse"])
        }
      } catch let e as AgeRangeService.Error {
        return Self.answer("error", ["error": String(describing: e)])
      } catch {
        return Self.answer("error", ["error": "other"])
      }
    }
    #endif
    return Self.answer("unsupported")
  }
}

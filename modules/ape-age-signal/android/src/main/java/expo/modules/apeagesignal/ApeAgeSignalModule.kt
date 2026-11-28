// ape-age-signal — Android Expo module (owner go 2026-11-27, 1.0.1): the
// Android half of ApeAgeSignalModule.swift. Same JS surface
// (Name("ApeAgeSignal")), so modules/ape-age-signal/index.ts resolves the same
// way on both platforms.
//
// Google Play Age Signals API, com.google.android.play:age-signals:0.0.6.
// Docs (read 2026-11-27):
//   https://developer.android.com/google/play/age-signals/request-age-signals
//   https://developer.android.com/google/play/age-signals/understand-age-signals-responses
//
// FLOW (mirrors iOS: nobody outside a covered region is asked anything)
//   1. getApplicableAgeFeatures(): no MANDATORY_SHARING → kind "ineligible".
//   2. requestAgeSignalsAccess(activity): status != SHARED → kind "access"
//      + accessStatus (NOT_SHARED / VERIFICATION_REQUIRED / UNSPECIFIED).
//   3. checkAgeSignals(): kind "result" + ageLower / ageUpper / source.
//   Any failure → kind "error" + errorCode (AgeSignalsErrorCode, or -1000
//   for a non-Play exception, -1001 when there is no Activity).
//
// Only the bounds and the source leave this file. installId and the
// significant-change fields are never read. Nothing is stored or sent: the
// JS side keeps the band in memory for the session (storeAge.ts).
package expo.modules.apeagesignal

import android.app.Activity
import com.google.android.play.agesignals.AgeSignalsAccessRequest
import com.google.android.play.agesignals.AgeSignalsException
import com.google.android.play.agesignals.AgeSignalsManager
import com.google.android.play.agesignals.AgeSignalsManagerFactory
import com.google.android.play.agesignals.AgeSignalsRequest
import com.google.android.play.agesignals.ApplicableAgeFeaturesRequest
import com.google.android.play.agesignals.model.AgeSignalsStatus
import com.google.android.play.agesignals.model.ApplicableAgeFeature
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val NOT_PLAY_ERROR = -1000
private const val NO_ACTIVITY = -1001

class ApeAgeSignalModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ApeAgeSignal")

    Function("moduleVersion") { 1 }

    // Resolves, never rejects: every failure is a raw answer JS maps to
    // 'unknown'.
    AsyncFunction("requestAgeSignal") { promise: Promise ->
      val ctx = appContext.reactContext?.applicationContext
      val activity = appContext.currentActivity
      if (ctx == null || activity == null) {
        promise.resolve(failure(NO_ACTIVITY))
        return@AsyncFunction
      }
      val manager: AgeSignalsManager
      try {
        manager = AgeSignalsManagerFactory.create(ctx)
      } catch (e: Exception) {
        promise.resolve(failure(codeOf(e)))
        return@AsyncFunction
      }
      try {
        manager.getApplicableAgeFeatures(ApplicableAgeFeaturesRequest.builder().build())
          .addOnSuccessListener { f ->
            if (f.features().contains(ApplicableAgeFeature.MANDATORY_SHARING)) {
              requestAccess(manager, activity, promise)
            } else {
              promise.resolve(answer("ineligible"))
            }
          }
          .addOnFailureListener { e -> promise.resolve(failure(codeOf(e))) }
      } catch (e: Exception) {
        promise.resolve(failure(codeOf(e)))
      }
    }
  }

  private fun requestAccess(manager: AgeSignalsManager, activity: Activity, promise: Promise) {
    try {
      manager.requestAgeSignalsAccess(AgeSignalsAccessRequest.builder().setActivity(activity).build())
        .addOnSuccessListener { r ->
          val status: Int = r.ageSignalsStatus() ?: AgeSignalsStatus.UNSPECIFIED
          if (status == AgeSignalsStatus.SHARED) {
            readSignals(manager, promise)
          } else {
            promise.resolve(answer("access", mapOf("accessStatus" to status)))
          }
        }
        .addOnFailureListener { e -> promise.resolve(failure(codeOf(e))) }
    } catch (e: Exception) {
      promise.resolve(failure(codeOf(e)))
    }
  }

  private fun readSignals(manager: AgeSignalsManager, promise: Promise) {
    try {
      manager.checkAgeSignals(AgeSignalsRequest.builder().build())
        .addOnSuccessListener { r ->
          val extra = mutableMapOf<String, Any>("accessStatus" to AgeSignalsStatus.SHARED)
          r.ageLower()?.let { extra["ageLower"] = it }
          r.ageUpper()?.let { extra["ageUpper"] = it }
          r.ageRangeSource()?.let { extra["source"] = it }
          promise.resolve(answer("result", extra))
        }
        .addOnFailureListener { e -> promise.resolve(failure(codeOf(e))) }
    } catch (e: Exception) {
      promise.resolve(failure(codeOf(e)))
    }
  }

  private fun codeOf(e: Exception): Int = (e as? AgeSignalsException)?.errorCode ?: NOT_PLAY_ERROR

  private fun failure(code: Int): Map<String, Any> = answer("error", mapOf("errorCode" to code))

  private fun answer(kind: String, extra: Map<String, Any> = emptyMap()): Map<String, Any> =
    mapOf<String, Any>("platform" to "android", "kind" to kind) + extra
}

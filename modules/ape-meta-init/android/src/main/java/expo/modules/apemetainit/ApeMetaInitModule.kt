// ape-meta-init — Android Expo module (1.0.1, 2026-11-05).
//
// WHY THIS EXISTS. The Meta Android SDK starts itself: its FacebookInitProvider
// runs sdkInitialize on every launch, before any JS, and that loads the app's
// settings from Meta over the network. The owner's rule is OFF unless the
// device region is US, CA or AU, so plugins/withMetaGuards.js removes that
// provider. react-native-fbsdk-next cannot make up for it: its initializeSDK
// only calls fullyInitialize(), which sets a flag. This module is the one
// missing call, and JS makes it only after src/features/growth/metaGate.ts
// says yes.
//
// On iOS the library's own initializeSDK does that part; ios/ has the activate
// call only.
package expo.modules.apemetainit

import android.app.Application
import com.facebook.FacebookSdk
import com.facebook.appevents.AppEventsLogger
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ApeMetaInitModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ApeMetaInit")

    /** True once the SDK is ready. Rejects when the build has no App ID. */
    AsyncFunction("initialize") {
      val context = appContext.reactContext?.applicationContext
        ?: throw Exceptions.ReactContextLost()
      @Suppress("DEPRECATION")
      FacebookSdk.sdkInitialize(context)
      FacebookSdk.fullyInitialize()
      FacebookSdk.isInitialized()
    }.runOnQueue(Queues.MAIN)

    /** Meta's real activate call: the install report, sent once ever by the
     *  SDK. It also starts the SDK's session tracker, which logs nothing while
     *  automatic logging is off, so metaGate.ts still sends the open. */
    AsyncFunction("activateApp") {
      val application = appContext.reactContext?.applicationContext as? Application
        ?: throw Exceptions.ReactContextLost()
      AppEventsLogger.activateApp(application)
      true
    }.runOnQueue(Queues.MAIN)
  }
}

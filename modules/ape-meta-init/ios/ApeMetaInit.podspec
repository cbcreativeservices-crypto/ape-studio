Pod::Spec.new do |s|
  s.name           = 'ApeMetaInit'
  s.version        = '0.1.0'
  s.summary        = "AP&E: Meta's real activate call, made only after consent"
  s.description    = "AppEvents.activateApp for the Meta SDK. JS calls it only after src/features/growth/metaGate.ts says yes."
  s.author         = 'Pro Audio Training Academy'
  s.homepage       = 'https://github.com/cbcreativeservices/ape-studio'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  # The version comes from react-native-fbsdk-next's own pod (~> 18.0).
  s.dependency 'FBSDKCoreKit'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = '**/*.swift'
end

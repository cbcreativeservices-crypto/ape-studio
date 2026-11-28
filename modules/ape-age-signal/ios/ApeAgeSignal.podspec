Pod::Spec.new do |s|
  s.name           = 'ApeAgeSignal'
  s.version        = '0.1.0'
  s.summary        = 'AP&E store age signal (Apple Declared Age Range) for the 18+ gates'
  s.description    = 'Asks AgeRangeService for the age range (gates 13 and 18) only when age assurance applies to this person (isEligibleForAgeFeatures, iOS 26.2+). Returns the range bounds only. No storage, no network.'
  s.author         = 'Pro Audio Training Academy'
  s.homepage       = 'https://github.com/cbcreativeservices/ape-studio'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # DeclaredAgeRange exists only on iOS 26+. The app still runs on older iOS,
  # so the framework is WEAK linked: it is simply absent there, and the Swift
  # code never touches it outside `if #available(iOS 26.2, *)`.
  s.weak_frameworks = 'DeclaredAgeRange'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = '**/*.{h,m,swift}'
end

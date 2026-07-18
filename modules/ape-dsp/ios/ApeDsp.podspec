Pod::Spec.new do |s|
  s.name           = 'ApeDsp'
  s.version        = '0.1.0'
  s.summary        = 'AP&E measurement-tools native capture + DSP core (Spike 0)'
  s.description    = 'AVAudioSession(.measurement) capture, lock-free SPSC ring, portable C++ DSP core, pull-based display frames.'
  s.author         = 'Pro Audio Training Academy'
  s.homepage       = 'https://github.com/cbcreativeservices/ape-studio'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++17',
  }

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
  s.private_header_files = 'core/**/*.hpp'
end

# ape-dsp — Android native build (ruling R3, 2026-07-23).
# The JNI shim lives in android/src/main/cpp; the portable, golden-tested
# C++17 DSP core is header-only and shared with iOS at ../ios/core (the same
# out-of-tree include pattern expo-sqlite uses for its vendored sources).
cmake_minimum_required(VERSION 3.4.1)
project(apedsp)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(apedspjni SHARED
  "${CMAKE_SOURCE_DIR}/src/main/cpp/ApeDspJni.cpp"
)

target_include_directories(apedspjni PRIVATE
  "${CMAKE_SOURCE_DIR}/src/main/cpp"
  "${CMAKE_SOURCE_DIR}/../ios/core"   # shared header-only C++17 core
)

# Oboe via prefab (find_package provided by the com.google.oboe:oboe AAR).
find_package(oboe REQUIRED CONFIG)

find_library(LOG_LIB log)

target_link_libraries(apedspjni
  oboe::oboe
  ${LOG_LIB}
)

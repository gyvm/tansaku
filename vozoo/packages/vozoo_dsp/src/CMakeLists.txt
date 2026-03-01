# The Flutter tooling requires that developers have CMake 3.10 or later
# installed. You should not increase this version limit unless you have to.
cmake_minimum_required(VERSION 3.10)

project(vozoo_dsp_library VERSION 0.0.1 LANGUAGES C CXX)

add_library(vozoo_dsp SHARED
  vozoo_dsp.cpp
)

set_target_properties(vozoo_dsp PROPERTIES
  PUBLIC_HEADER vozoo_dsp.h
  OUTPUT_NAME "vozoo_dsp"
)

target_compile_definitions(vozoo_dsp PUBLIC DART_SHARED_LIB)

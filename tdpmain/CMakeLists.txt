# Copyright (c) 2014 The Chromium Embedded Framework Authors. All rights
# reserved. Use of this source code is governed by a BSD-style license that
# can be found in the LICENSE file.

#
# Source files.
#

# tdpmain sources.
set(TDPMAIN_SRCS
  tdpmain_app.cc
  tdpmain_app.h
  tdpmain_cef_win.cc
  tdpmain_handler.cc
  tdpmain_handler.h
  tdpmain_window.cc
  tdpmain_window.h
  util_win.cc
  util_win.h
  )
set(TDPMAIN_SRCS_WINDOWS
  tdpmain.exe.manifest
  tdpmain.rc
  tdpmain_cef_win.cc
  resource.h
  tdpmain_handler_win.cc
  )
APPEND_PLATFORM_SOURCES(TDPMAIN_SRCS)
source_group(tdpmain FILES ${TDPMAIN_SRCS})

set(TDPMAIN_RES_SRCS_WINDOWS
  res/tdpmain.ico
  res/small.ico
  )
APPEND_PLATFORM_SOURCES(TDPMAIN_RES_SRCS)
source_group(tdpmain\\\\res FILES ${TDPMAIN_RES_SRCS})

set(TDPMAIN_SRCS
  ${TDPMAIN_SRCS}
  ${TDPMAIN_RES_SRCS}
  )

# tdpmain helper sources.
set(TDPMAIN_HELPER_SRCS_MACOSX
  process_helper_mac.cc
  )
APPEND_PLATFORM_SOURCES(TDPMAIN_HELPER_SRCS)
source_group(tdpmain FILES ${TDPMAIN_HELPER_SRCS})

# tdpmain resources.
set(TDPMAIN_RESOURCES_MAC_SRCS_MACOSX
  mac/Info.plist
  mac/tdpmain.icns
  )
APPEND_PLATFORM_SOURCES(TDPMAIN_RESOURCES_MAC_SRCS)
source_group(tdpmain\\\\mac FILES ${TDPMAIN_RESOURCES_MAC_SRCS})

set(TDPMAIN_RESOURCES_MAC_ENGLISH_LPROJ_SRCS_MACOSX
  mac/English.lproj/InfoPlist.strings
  mac/English.lproj/MainMenu.xib
  )
APPEND_PLATFORM_SOURCES(TDPMAIN_RESOURCES_MAC_ENGLISH_LPROJ_SRCS)
source_group(tdpmain\\\\mac\\\\English.lproj FILES ${TDPMAIN_RESOURCES_MAC_ENGLISH_LPROJ_SRCS})

set(TDPMAIN_RESOURCES_SRCS
  ${TDPMAIN_RESOURCES_MAC_SRCS}
  ${TDPMAIN_RESOURCES_MAC_ENGLISH_LPROJ_SRCS}
  )


#
# Shared configuration.
#

# Target executable names.
set(CEF_TARGET "tdpmain")
if(OS_MACOSX)
  set(CEF_HELPER_TARGET "TDP Helper")
endif()

# Logical target used to link the libcef library.
ADD_LOGICAL_TARGET("libcef_lib" "${CEF_LIB_DEBUG}" "${CEF_LIB_RELEASE}")

# Determine the target output directory.
SET_CEF_TARGET_OUT_DIR()

#
# Windows configuration.
#

if(OS_WINDOWS)
  # Executable target.
  add_executable(${CEF_TARGET} WIN32 ${TDPMAIN_SRCS})
  add_dependencies(${CEF_TARGET} libcef_dll_wrapper)
  target_link_libraries(${CEF_TARGET} libcef_lib libcef_dll_wrapper ${CEF_STANDARD_LIBS})

  if(USE_SANDBOX)
    # Logical target used to link the cef_sandbox library.
    ADD_LOGICAL_TARGET("cef_sandbox_lib" "${CEF_SANDBOX_LIB_DEBUG}" "${CEF_SANDBOX_LIB_RELEASE}")
    target_link_libraries(${CEF_TARGET} cef_sandbox_lib ${CEF_SANDBOX_STANDARD_LIBS})
  endif()

  # Add the custom manifest files to the executable.
  ADD_WINDOWS_MANIFEST("${CMAKE_CURRENT_SOURCE_DIR}" "${CEF_TARGET}")

  # Copy binary and resource files to the target output directory.
  COPY_FILES("${CEF_TARGET}" "${CEF_BINARY_FILES}" "${CEF_BINARY_DIR}" "${CEF_TARGET_OUT_DIR}")
  COPY_FILES("${CEF_TARGET}" "${CEF_RESOURCE_FILES}" "${CEF_RESOURCE_DIR}" "${CEF_TARGET_OUT_DIR}")
  COPY_FILES("${CEF_TARGET}" "${CEF_DISTRIBUTION_FILES}" "${CEF_DISTRIBUTION_DIR}" "${CEF_TARGET_OUT_DIR}")
endif()

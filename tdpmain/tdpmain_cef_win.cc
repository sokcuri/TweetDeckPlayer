// Copyright (c) 2013 The Chromium Embedded Framework Authors. All rights
// reserved. Use of this source code is governed by a BSD-style license that
// can be found in the LICENSE file.

#include <windows.h>

#include "include/base/cef_scoped_ptr.h"
#include "tdpmain/tdpmain_app.h"
#include "include/cef_sandbox_win.h"

using namespace tdpmain;

// Entry point function for all processes.
int APIENTRY wWinMain(HINSTANCE hInstance,
                      HINSTANCE hPrevInstance,
                      LPTSTR    lpCmdLine,
                      int       nCmdShow) {
  UNREFERENCED_PARAMETER(hPrevInstance);
  UNREFERENCED_PARAMETER(lpCmdLine);

  // Enable High-DPI support on Windows 7 or newer.
  CefEnableHighDPISupport();

  void* sandbox_info = NULL;

#if defined(CEF_USE_SANDBOX)
  // Manage the life span of the sandbox information object. This is necessary
  // for sandbox support on Windows. See cef_sandbox_win.h for complete details.
  CefScopedSandboxInfo scoped_sandbox;
  sandbox_info = scoped_sandbox.sandbox_info();
#endif

  // Provide CEF with command-line arguments.
  CefMainArgs main_args(hInstance);

  // CEF applications have multiple sub-processes (render, plugin, GPU, etc)
  // that share the same executable. This function checks the command-line and,
  // if this is a sub-process, executes the appropriate logic.
  int exit_code = CefExecuteProcess(main_args, NULL, sandbox_info);
  if (exit_code >= 0) {
	  // The sub-process has completed so return here.
	  return exit_code;
  }

  // Specify CEF global settings here.
  CefSettings settings;

  // Use Single process
  settings.single_process = true;

  // Disable logging.
  settings.log_severity = LOGSEVERITY_DISABLE;

  // Add to Accept-Language
  CefString AcceptLanguage;
  AcceptLanguage.Attach(&settings.accept_language_list, false);
  AcceptLanguage.FromString("ko-KR;");

#if !defined(CEF_USE_SANDBOX)
  settings.no_sandbox = true;
#endif

  // TDPApp implements application-level callbacks for the browser process.
  // It will create the first browser instance in OnContextInitialized() after
  // CEF has initialized.
  CefRefPtr<TDPApp> app(new TDPApp);

  //scoped_ptr<MainContextImpl> context(new MainContextImpl(command_line, true));

  // Initialize CEF.
  CefInitialize(main_args, settings, app.get(), sandbox_info);

  // Run the CEF message loop. This will block until CefQuitMessageLoop() is
  // called.
  CefRunMessageLoop();

  // Shut down CEF.
  CefShutdown();

  return 0;
}
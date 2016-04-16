// Copyright (c) 2013 The Chromium Embedded Framework Authors. All rights
// reserved. Use of this source code is governed by a BSD-style license that
// can be found in the LICENSE file.

#include "tdpmain/tdpmain_app.h"
#include "tdpmain/util_win.h"

#include <string>

#include "tdpmain/tdpmain_handler.h"
#include "include/cef_browser.h"
#include "include/cef_command_line.h"
#include "include/wrapper/cef_helpers.h"

namespace tdpmain
{
	TDPApp::TDPApp() {
	}
void TDPApp::OnContextInitialized() {
  CEF_REQUIRE_UI_THREAD();

  // Register cookieable schemes with the global cookie manager.
  CefRefPtr<CefCookieManager> manager =
	  CefCookieManager::GetGlobalManager(NULL);
  DCHECK(manager.get());
  manager->SetSupportedSchemes(cookieable_schemes_, NULL);
  manager->SetStoragePath(GetDataPath(), true, NULL);

  // Information used when creating the native window.
  CefWindowInfo window_info;

#if defined(OS_WIN)
  // On Windows we need to specify certain flags that will be passed to
  // CreateWindowEx().
  window_info.SetAsPopup(NULL, "TweetDeck Player");
#endif


  // Get Window size
  int left;
  int right;
  int top;
  int bottom;
  left = GetINI_Int(L"window", L"left", 0);
  top = GetINI_Int(L"window", L"top", 0);
  right = GetINI_Int(L"window", L"right", 0);
  bottom = GetINI_Int(L"window", L"bottom", 0);

  // window size is init
  if (right - left == 0 || bottom - top == 0)
  {
	  int width = 1300;
	  int height = 900;

	  RECT rect;
	  GetClientRect(GetDesktopWindow(), &rect);

	  rect.left = (rect.right / 2) - (width / 2);
	  rect.top = (rect.bottom / 2) - (height / 2);

	  window_info.x = rect.left;
	  window_info.y = rect.top;
	  window_info.width = width;
	  window_info.height = height;

  }
  else
  {
	  window_info.x = left;
	  window_info.y = top;
	  window_info.width = right - left;
	  window_info.height = bottom - top;
  }

  // TDPHandler implements browser-level callbacks.
  CefRefPtr<TDPHandler> handler(new TDPHandler());

  // Specify CEF browser settings here.
  CefBrowserSettings browser_settings;

  std::string url;

  // Check if a "--url=" value was provided via the command-line. If so, use
  // that instead of the default URL.
  CefRefPtr<CefCommandLine> command_line =
      CefCommandLine::GetGlobalCommandLine();
  url = command_line->GetSwitchValue("url");
  if (url.empty())
    url = "https://tweetdeck.twitter.com/";

  // Create the first browser window.
  CefBrowserHost::CreateBrowser(window_info, handler.get(), url,
                                browser_settings, NULL);

  //CefRefPtr<TDPHandler> cef_hTab = new TDPHandler();
  //CefRefPtr< CefBrowser > browser;
  //browser->GetHost()->GetWindowHandle();

}

}
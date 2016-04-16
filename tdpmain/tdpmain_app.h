// Copyright (c) 2013 The Chromium Embedded Framework Authors. All rights
// reserved. Use of this source code is governed by a BSD-style license that
// can be found in the LICENSE file.

#ifndef TWEETDECKPLAYER_TDP_APP_H_
#define TWEETDECKPLAYER_TDP_APP_H_
#pragma once

#include "include/cef_app.h"

namespace tdpmain
{
// Implement application-level callbacks for the browser process.
class TDPApp : public CefApp,
                  public CefBrowserProcessHandler {
 public:
  TDPApp();

  // CefApp methods:
  virtual CefRefPtr<CefBrowserProcessHandler> GetBrowserProcessHandler()
      OVERRIDE { return this; }

  // CefBrowserProcessHandler methods:
  virtual void OnContextInitialized() OVERRIDE;

 protected:
	// Schemes that will be registered with the global cookie manager.
	std::vector<CefString> cookieable_schemes_;

 private:
  // Include the default reference counting implementation.
  IMPLEMENT_REFCOUNTING(TDPApp);
};
}
#endif  // TWEETDECKPLAYER_TDP_APP_H_

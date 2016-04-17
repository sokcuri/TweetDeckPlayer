// Copyright (c) 2013 The Chromium Embedded Framework Authors. All rights
// reserved. Use of this source code is governed by a BSD-style license that
// can be found in the LICENSE file.

#ifndef TWEETDECKPLAYER_TDP_HANDLER_H_
#define TWEETDECKPLAYER_TDP_HANDLER_H_
#pragma once

#include "include/cef_client.h"
#include "include/cef_render_process_handler.h"
#include "include/cef_request_handler.h"
#include <list>

namespace tdpmain
{
class TDPHandler : public CefClient,
                      public CefContextMenuHandler,
                      public CefDisplayHandler,
                      public CefLifeSpanHandler,
                      public CefLoadHandler,
					  public CefDownloadHandler {
 public:
  TDPHandler();
  ~TDPHandler();

  // Provide access to the single global instance of this object.
  static TDPHandler* GetInstance();

  // CefClient methods
  CefRefPtr<CefContextMenuHandler> GetContextMenuHandler() OVERRIDE {
	  return this;
  }
  virtual CefRefPtr<CefDisplayHandler> GetDisplayHandler() OVERRIDE {
    return this;
  }
  virtual CefRefPtr<CefDownloadHandler> GetDownloadHandler() OVERRIDE {
	  return this;
  }
  virtual CefRefPtr<CefLifeSpanHandler> GetLifeSpanHandler() OVERRIDE {
    return this;
  }
  virtual CefRefPtr<CefLoadHandler> GetLoadHandler() OVERRIDE {
	  return this;
  }

  // CefDisplayHandler methods:
  virtual void OnTitleChange(CefRefPtr<CefBrowser> browser,
                             const CefString& title) OVERRIDE;

  // CefLifeSpanHandler methods:
  bool OnBeforePopup(
	  CefRefPtr<CefBrowser> browser,
	  CefRefPtr<CefFrame> frame,
	  const CefString& target_url,
	  const CefString& target_frame_name,
	  CefLifeSpanHandler::WindowOpenDisposition target_disposition,
	  bool user_gesture,
	  const CefPopupFeatures& popupFeatures,
	  CefWindowInfo& windowInfo,
	  CefRefPtr<CefClient>& client,
	  CefBrowserSettings& settings,
	  bool* no_javascript_access) OVERRIDE;
  virtual void OnAfterCreated(CefRefPtr<CefBrowser> browser) OVERRIDE;
  virtual bool DoClose(CefRefPtr<CefBrowser> browser) OVERRIDE;
  virtual void OnBeforeClose(CefRefPtr<CefBrowser> browser) OVERRIDE;

  // CefLoadHandler methods:
  virtual void OnLoadError(CefRefPtr<CefBrowser> browser,
                           CefRefPtr<CefFrame> frame,
                           ErrorCode errorCode,
                           const CefString& errorText,
                           const CefString& failedUrl) OVERRIDE;
  void OnLoadEnd(CefRefPtr<CefBrowser> browser,
	  CefRefPtr<CefFrame> frame,
	  int httpStatusCode) OVERRIDE;

  // Request that all existing browser windows close.
  void CloseAllBrowsers(bool force_close);

  bool IsClosing() const { return is_closing_; }

  // Show a new DevTools popup window.
  void ShowDevTools(CefRefPtr<CefBrowser> browser,
	  const CefPoint& inspect_element_at);

  // Close the existing DevTools popup window, if any.
  void CloseDevTools(CefRefPtr<CefBrowser> browser);

  // CefContextMenuHandler methods
  void OnBeforeContextMenu(CefRefPtr<CefBrowser> browser,
	  CefRefPtr<CefFrame> frame,
	  CefRefPtr<CefContextMenuParams> params,
	  CefRefPtr<CefMenuModel> model) OVERRIDE;
  bool OnContextMenuCommand(CefRefPtr<CefBrowser> browser,
	  CefRefPtr<CefFrame> frame,
	  CefRefPtr<CefContextMenuParams> params,
	  int command_id,
	  EventFlags event_flags) OVERRIDE;

  // CefDownloadHandler methods
  void OnBeforeDownload(
	  CefRefPtr<CefBrowser> browser,
	  CefRefPtr<CefDownloadItem> download_item,
	  const CefString& suggested_name,
	  CefRefPtr<CefBeforeDownloadCallback> callback) OVERRIDE;
  void OnDownloadUpdated(
	  CefRefPtr<CefBrowser> browser,
	  CefRefPtr<CefDownloadItem> download_item,
	  CefRefPtr<CefDownloadItemCallback> callback) OVERRIDE;

private:
	// Create a new popup window using the specified information. |is_devtools|
	// will be true if the window will be used for DevTools. Return true to
	// proceed with popup browser creation or false to cancel the popup browser.
	// May be called on any thead.
	bool CreatePopupWindow(
		CefRefPtr<CefBrowser> browser,
		bool is_devtools,
		const CefPopupFeatures& popupFeatures,
		CefWindowInfo& windowInfo,
		CefRefPtr<CefClient>& client,
		CefBrowserSettings& settings);

  // Open popup window
  void OpenPopup(CefRefPtr<CefFrame> frame, CefString url);
  
  // List of existing browser windows. Only accessed on the CEF UI thread.
  typedef std::list<CefRefPtr<CefBrowser> > BrowserList;
  BrowserList browser_list_;

  bool is_closing_;

  // Test context menu creation.
  void BuildTestMenu(CefRefPtr<CefMenuModel> model);
  bool ExecuteTestMenu(int command_id);

  // Track state information for the text context menu.
  struct TestMenuState {
	  TestMenuState() : check_item(true), radio_item(0) {}
	  bool check_item;
	  int radio_item;
  } test_menu_state_;

  std::string downloadPath;

  // Include the default reference counting implementation.
  IMPLEMENT_REFCOUNTING(TDPHandler);
};
}
#endif  // TWEETDECKPLAYER_TDP_HANDLER_H_

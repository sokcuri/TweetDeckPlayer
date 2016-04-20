// Copyright (c) 2013 The Chromium Embedded Framework Authors. All rights
// reserved. Use of this source code is governed by a BSD-style license that
// can be found in the LICENSE file.

#include "tdpmain/util_win.h"
#include "tdpmain/tdpmain_handler.h"
#include "tdpmain/tdpmain_window.h"
#include "tdpmain/resource.h"

#include <sstream>
#include <string>

#include "include/base/cef_bind.h"
#include "include/cef_app.h"
#include "include/wrapper/cef_closure_task.h"
#include "include/wrapper/cef_helpers.h"

#define T(x)      L ## x
#define TDP_MESSAGE T("TweetDeck Player v1.24 ~by @sokcuri")

namespace tdpmain
{
namespace {

TDPHandler* g_instance = NULL;

}  // namespace

// Custom menu command Ids.
enum client_menu_ids {
	CLIENT_ID_RELOAD_PAGE = MENU_ID_USER_FIRST,
	CLIENT_ID_BACK_PAGE,
	CLIENT_ID_FORWARD_PAGE,
	CLIENT_ID_OPEN_LINK,
	CLIENT_ID_OPEN_LINK_POPUP,
	CLIENT_ID_SAVE_LINK_AS,
	CLIENT_ID_COPY_LINK_ADDRESS,
	CLIENT_ID_SAVE_IMAGE_AS,
	CLIENT_ID_COPY_IMAGE_URL,
	CLIENT_ID_OPEN_IMAGE_LINK,
	CLIENT_ID_OPEN_IMAGE_LINK_POPUP,
	CLIENT_ID_SAVE_VIDEO_AS,
	CLIENT_ID_COPY_VIDEO_URL,
	CLIENT_ID_OPEN_VIDEO_LINK,
	CLIENT_ID_OPEN_VIDEO_LINK_POPUP,
	CLIENT_ID_SELECTION_UNDO,
	CLIENT_ID_SELECTION_REDO,
	CLIENT_ID_SELECTION_CUT,
	CLIENT_ID_SELECTION_COPY,
	CLIENT_ID_SELECTION_PASTE,
	CLIENT_ID_SELECTION_DELETE,
	CLIENT_ID_SELECT_ALL,

	CLIENT_ID_TWEET_TWITTER,
	CLIENT_ID_OPEN_TWITTER,
	CLIENT_ID_POPUP_COPY_PAGE_URL,
	CLIENT_ID_POPUP_OPEN_BROWSER,
	CLIENT_ID_CLOSE_BROWSER,

	CLIENT_ID_SHOW_DEVTOOLS,
	CLIENT_ID_CLOSE_DEVTOOLS,
	CLIENT_ID_INSPECT_ELEMENT,
	CLIENT_ID_TOAST_NOTI,

	CLIENT_ID_TESTMENU_SUBMENU,
	CLIENT_ID_TESTMENU_CHECKITEM,
	CLIENT_ID_TESTMENU_RADIOITEM1,
	CLIENT_ID_TESTMENU_RADIOITEM2,
	CLIENT_ID_TESTMENU_RADIOITEM3,

};

TDPHandler::TDPHandler()
    : is_closing_(false) {
  DCHECK(!g_instance);
  g_instance = this;
}

TDPHandler::~TDPHandler() {
  g_instance = NULL;
}

// static
TDPHandler* TDPHandler::GetInstance() {
  return g_instance;
}

bool TDPHandler::OnBeforePopup(
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
	bool* no_javascript_access) {
	CEF_REQUIRE_IO_THREAD();

	bool no_link_popup_ = (GetINI_Int(L"setting", L"DisableLinkPopup", 0) == 1);
	SetINI_Int(L"setting", L"DisableLinkPopup", no_link_popup_);

	// no use link popup
	std::wstring url = target_url.ToWString();

	// is popup menu, jump this logic
	if (url.find(L"tdppopup://", 0) != 0 && no_link_popup_ || // no_link_popup parameter
		url.find(L"tdppopup://", 0) != 0 && browser->IsPopup()) // Popup window do not allow popup
	{
		OpenURL(url);
		return true; // cancel the popup window
	}
	else if (url.find(L"tdppopup://", 0) == 0)
		url = url.substr(11);

	// is already open browser, move to link
	for (auto iter : browser_list_)
	{
		if (iter->IsPopup())
		{
			iter->GetMainFrame()->LoadURL(url);
			return true;
		}
	}

	/*
	// is already open browser, close browser
	std::list<CefRefPtr<CefBrowser>> browser_list_temp;
	for (auto iter : browser_list_)
	{
		if (iter->IsPopup())
		{
			iter->GetHost()->CloseBrowser(false);
		}
		else
			browser_list_temp.push_back(iter);
	}
	browser_list_ = browser_list_temp;
	*/
	// determine to popup window size
	int width = 1200;
	int height = 800;

	int left, right, top, bottom;

	left = GetINI_Int(L"popup", L"left", 0);
	right = GetINI_Int(L"popup", L"right", 0);
	top = GetINI_Int(L"popup", L"top", 0);
	bottom = GetINI_Int(L"popup", L"bottom", 0);

	// window size is init
	if (right - left == 0 || bottom - top == 0)
	{
		RECT rect;
		GetClientRect(GetDesktopWindow(), &rect);

		rect.left = (rect.right / 2) - (width / 2);
		rect.top = (rect.bottom / 2) - (height / 2);

		windowInfo.x = rect.left;
		windowInfo.y = rect.top;
		windowInfo.width = width;
		windowInfo.height = height;

	}
	else
	{
		windowInfo.x = left;
		windowInfo.y = top;
		windowInfo.width = right - left;
		windowInfo.height = bottom - top;
	}

	windowInfo.style &= ~WS_MINIMIZEBOX;
	windowInfo.style &= ~WS_MAXIMIZEBOX;

	// window title
	CefString WindowName;
	WindowName.Attach(&windowInfo.window_name, false);
	WindowName.FromWString(L"TweetDeck Player");

	return false;
	// Return true to cancel the popup window.
	//return !CreatePopupWindow(browser, false, popupFeatures, windowInfo, client,
	//                          settings);
}

void TDPHandler::OnAfterCreated(CefRefPtr<CefBrowser> browser) {
  CEF_REQUIRE_UI_THREAD();
  HWND hwnd_ = browser->GetHost()->GetWindowHandle();

  // Custom window style and procedure.
  TDPWindow::OnWndCreated(hwnd_, (browser_list_.size() == 0 ? true : false));

  // Add to the list of existing browsers.
  browser_list_.push_back(browser);

}

bool TDPHandler::DoClose(CefRefPtr<CefBrowser> browser) {
  CEF_REQUIRE_UI_THREAD();

  // save prevent when window minimize or maximize
  DWORD dwStyle = GetWindowLong(browser->GetHost()->GetWindowHandle(), GWL_STYLE);
  if (!(dwStyle & WS_MINIMIZE) && !(dwStyle & WS_MAXIMIZE))
  {
	  RECT rect;
	  GetWindowRect(browser->GetHost()->GetWindowHandle(), &rect);

	  // Save window info
	  if (!browser->IsPopup())
		  SaveMainWnd(&rect);
	  else SavePopupWnd(&rect);

	  // is main browser, close all browser
	  if (!browser->IsPopup())
	  {
		  is_closing_ = true;
		  CloseAllBrowsers(true);
	  }
  }
  // Closing the main window requires special handling. See the DoClose()
  // documentation in the CEF header for a detailed destription of this
  // process.

  if (browser_list_.size() == 1) {
    // Set a flag to indicate that the window close should be allowed.
    is_closing_ = true;
  }

  // Allow the close. For windowed browsers this will result in the OS close
  // event being sent.
  return false;
}

void TDPHandler::OnBeforeClose(CefRefPtr<CefBrowser> browser) {
  CEF_REQUIRE_UI_THREAD();

  // Remove from the list of existing browsers.
  BrowserList::iterator bit = browser_list_.begin();
  for (; bit != browser_list_.end(); ++bit) {
    if ((*bit)->IsSame(browser)) {
      browser_list_.erase(bit);
      break;
    }
  }

  if (browser_list_.empty()) {
    // All browser windows have closed. Quit the application message loop.
    CefQuitMessageLoop();
  }
}
/*
Notification Code (OnWebKitInitialized)
  std::wstring notiCode = 
	  L"var Notification;"
	  L"var TDP;"
	  L"if (!TDP){ TDP = {};}"
	  L"if (!Notification){"
	  L"  Notification = function(a,b){ "
	  "TDP.Notification(a,b); };"
	  L"(function() {"
	  L"  Notification.permission = 'granted';"
	  L"})();"
	  L"Notification.requestPermission = function() {"
	  L"return true;"
	  L"};"
      L"}";
  */
void TDPHandler::OnLoadEnd(CefRefPtr<CefBrowser> browser,
	CefRefPtr<CefFrame> frame,
	int httpStatusCode) {

	wchar_t kTweetDeck[] = L"https://tweetdeck.twitter.com";
	wchar_t kTwitter[] = L"https://twitter.com";
	// Apply if tweetdeck and twitter
	if (frame->GetURL().ToWString().find(kTweetDeck) == 0)
	{
		const std::wstring iniPath(GetINIPath());
		std::wstring code, para;
		code = L"var TDP;"
		       L"if (!TDP) TDP = {};"
			   L"if (!TDP.injectStyles){"
			   L"  TDP.injectStyles = function(rule) {"
			   L"var div = $(\"<div />\", {"
			   L"html: '&shy;<style>' + rule + '</style>'"
			   L"}).appendTo(\"body\");"
			   L"};"
			   L"}";
		// inject style modifiy code
		frame->ExecuteJavaScript(code, frame->GetURL(), 0);

		// font-family modify code
		para = GetINI_String(L"timeline", L"fontFamily", L"");
		SetINI_String(L"timeline", L"fontFamily", para);
		if (para.length())
		{
			code = L"TDP.injectStyles('.os-windows {font-family: Arial," + para +
				   L",Verdana,sans-serif; }');";
			frame->ExecuteJavaScript(code, frame->GetURL(), 0);
		}

		// print version info and prevent backspace
		code = L"TDP.onTDPageLoad = function(){ setTimeout(function(){"
			   L"if(!TD.ready){ TDP.onTDPageLoad(); } else { "
			   L"TD.controller.progressIndicator.addMessage("
			   L"TD.i('"
			   TDP_MESSAGE
			   L"'));"
			   L"}}, 1000);};"
			   L"$(document).ready(function(){"
			   L"TDP.onTDPageLoad();});";
		frame->ExecuteJavaScript(code, frame->GetURL(), 0);

		// prevent backspace
		code = L"$(document).on('keydown', function(event) {"
			   L"if (document.activeElement === document.body ||"
			   L"document.activeElement === document.body.parentElement) {"
			   L"if (event.keyCode === 8) {"
			   L"event.preventDefault();}"
			   L"}});";
		frame->ExecuteJavaScript(code, frame->GetURL(), 0);

		std::vector<std::wstring> file_list;
		std::vector<std::wstring>::iterator it;

		// Load script folder js files
		file_list = GetFindFiles(GetExePath() + L"\\script\\*.js");
		for (it = file_list.begin(); it != file_list.end(); it++)
		{
			code = LoadFileContent(GetExePath() + L"\\script\\" + (*it));
			frame->ExecuteJavaScript(code, frame->GetURL(), 0);
		}

		// Load script folder css files
		file_list = GetFindFiles(GetExePath() + L"\\style\\*.css");
		for (it = file_list.begin(); it != file_list.end(); it++)
		{
			code = LoadFileContent(GetExePath() + L"\\style\\" + (*it));
			code = replaceAll(code, L"\\", L"\\\\");
			code = replaceAll(code, L"'", L"\\'");
			code = replaceAll(code, L"\r\n", L"");
			code = replaceAll(code, L"\n", L"");
			code = L"TDP.injectStyles('" + code + L"');";
			frame->ExecuteJavaScript(code, frame->GetURL(), 0);
		}
	}
	// twitter.com
	else if (frame->GetURL().ToWString().find(kTwitter) == 0)
	{
		std::wstring url = frame->GetURL();
		
		// url ?& -> tweet form script run
		// $(document).trigger('uiShortcutShowTweetbox');
		// $(document).trigger('uiOpenTweetDialog');
		if (url.find(L"twitter.com/?&", 0) != std::wstring::npos)
		{
			std::wstring code, para;
			code = L"var TDP;"
				L"if (!TDP) TDP = {};"
				L"if (!TDP.DialogOpened){"
				L"TDP.onPageLoad = function(){ setTimeout(function(){"
				L"$(document).trigger('uiShortcutShowTweetbox'); }, 1000);};"
			    L"$(document).ready(function(){"
				L"TDP.onPageLoad();});"
				L"TDP.DialogOpened = true;"
				L"}";
			// inject style modifiy code
			frame->ExecuteJavaScript(code, kTwitter, 10);
		}
	}
}

void TDPHandler::OnLoadError(CefRefPtr<CefBrowser> browser,
                                CefRefPtr<CefFrame> frame,
                                ErrorCode errorCode,
                                const CefString& errorText,
                                const CefString& failedUrl) {
  CEF_REQUIRE_UI_THREAD();

  // Skip popup url, reload it
  std::wstring url = failedUrl;
  if (url.find(L"tdppopup://", 0) == 0 && browser->IsPopup())
  {
	  url = url.substr(11);
	  frame->LoadURL(url);
	  return;
  }

  // Don't display an error for downloaded files.
  if (errorCode == ERR_ABORTED)
    return;

  // Display a load error message.
  std::stringstream ss;
  ss << "<html><body bgcolor=\"white\">"
        "<h2>Failed to load URL " << std::string(failedUrl) <<
        " with error " << std::string(errorText) << " (" << errorCode <<
        ").</h2></body></html>";
  frame->LoadString(ss.str(), failedUrl);
}
void TDPHandler::CloseAllBrowsers(bool force_close) {
  if (!CefCurrentlyOn(TID_UI)) {
    // Execute on the UI thread.
    CefPostTask(TID_UI,
        base::Bind(&TDPHandler::CloseAllBrowsers, this, force_close));
    return;
  }

  if (browser_list_.empty())
    return;

  BrowserList::const_iterator it = browser_list_.begin();
  for (; it != browser_list_.end(); ++it)
    (*it)->GetHost()->CloseBrowser(force_close);
}


void TDPHandler::OnBeforeContextMenu(
	CefRefPtr<CefBrowser> browser,
	CefRefPtr<CefFrame> frame,
	CefRefPtr<CefContextMenuParams> params,
	CefRefPtr<CefMenuModel> model) {
	CEF_REQUIRE_UI_THREAD();

	// ContextMenu Initialize
	model->Clear();

	// is usable popup open menu
	bool no_popup_menu_ = (GetINI_Int(L"setting", L"DisablePopupOpenMenu", 0) == 1);
	SetINI_Int(L"setting", L"DisablePopupOpenMenu", no_popup_menu_);

	if (browser->IsPopup())
	{
		if ((params->GetTypeFlags() & (CM_TYPEFLAG_MEDIA)) != 0 ||
			(params->GetTypeFlags() & (CM_TYPEFLAG_PAGE)) != 0)
		{
			model->AddItem(CLIENT_ID_BACK_PAGE, "Back");
			model->AddItem(CLIENT_ID_FORWARD_PAGE, "Forward");
			model->AddItem(CLIENT_ID_RELOAD_PAGE, "Reload");

			if (!browser->CanGoBack())
				model->SetEnabled(CLIENT_ID_BACK_PAGE, false);
			if (!browser->CanGoForward())
				model->SetEnabled(CLIENT_ID_FORWARD_PAGE, false);
		}
	}

	if ((params->GetTypeFlags() & (CM_TYPEFLAG_LINK)))
	{
		if (model->GetCount())
			model->AddSeparator();

		model->AddItem(CLIENT_ID_OPEN_LINK, "Open link");
		if (!no_popup_menu_)
			model->AddItem(CLIENT_ID_OPEN_LINK_POPUP, "Open link in popup");
		model->AddItem(CLIENT_ID_SAVE_LINK_AS, "Save link as...");
		model->AddItem(CLIENT_ID_COPY_LINK_ADDRESS, "Copy link address");
	}
	
	if ((params->GetTypeFlags() & (CM_TYPEFLAG_MEDIA)) != 0 && (params->GetMediaType() & (CM_MEDIATYPE_IMAGE)) != 0)
	{
		if (model->GetCount())
			model->AddSeparator();
		model->AddItem(CLIENT_ID_SAVE_IMAGE_AS, "Save image as...");
		model->AddItem(CLIENT_ID_COPY_IMAGE_URL, "Copy image URL");
		model->AddItem(CLIENT_ID_OPEN_IMAGE_LINK, "Open image in browser");
		if (!no_popup_menu_)
			model->AddItem(CLIENT_ID_OPEN_IMAGE_LINK_POPUP, "Open image in popup");
	}
	else if ((params->GetTypeFlags() & (CM_TYPEFLAG_MEDIA)) != 0 && (params->GetMediaType() & (CM_MEDIATYPE_VIDEO)) != 0)
	{
		if (model->GetCount())
			model->AddSeparator();
		model->AddItem(CLIENT_ID_SAVE_VIDEO_AS, "Save video as...");
		model->AddItem(CLIENT_ID_COPY_VIDEO_URL, "Copy video URL");
		model->AddItem(CLIENT_ID_OPEN_VIDEO_LINK, "Open video in browser");
		if (!no_popup_menu_)
			model->AddItem(CLIENT_ID_OPEN_VIDEO_LINK_POPUP, "Open video in popup");
	}
	else if ((params->GetTypeFlags() & (CM_TYPEFLAG_EDITABLE)) != 0)
	{
		model->AddItem(CLIENT_ID_SELECTION_UNDO, "Undo");
		model->AddItem(CLIENT_ID_SELECTION_REDO, "Redo");
		model->AddSeparator();
		model->AddItem(CLIENT_ID_SELECTION_CUT, "Cut");
		model->AddItem(CLIENT_ID_SELECTION_COPY, "Copy");
		model->AddItem(CLIENT_ID_SELECTION_PASTE, "Paste");
		model->AddItem(CLIENT_ID_SELECTION_DELETE, "Delete");
		model->AddSeparator();
		model->AddItem(CLIENT_ID_SELECT_ALL, "Select All");

		if ((params->GetEditStateFlags() & (CM_EDITFLAG_CAN_UNDO)) == 0)
			model->SetEnabled(CLIENT_ID_SELECTION_UNDO, false);

		if ((params->GetEditStateFlags() & (CM_EDITFLAG_CAN_REDO)) == 0)
			model->SetEnabled(CLIENT_ID_SELECTION_REDO, false);

		if ((params->GetEditStateFlags() & (CM_EDITFLAG_CAN_CUT)) == 0)
			model->SetEnabled(CLIENT_ID_SELECTION_CUT, false);

		if ((params->GetEditStateFlags() & (CM_EDITFLAG_CAN_COPY)) == 0)
			model->SetEnabled(CLIENT_ID_SELECTION_COPY, false);

		if ((params->GetEditStateFlags() & (CM_EDITFLAG_CAN_PASTE)) == 0)
			model->SetEnabled(CLIENT_ID_SELECTION_PASTE, false);

		if ((params->GetEditStateFlags() & (CM_EDITFLAG_CAN_DELETE)) == 0)
			model->SetEnabled(CLIENT_ID_SELECTION_DELETE, false);
	}
	else if ((params->GetTypeFlags() & (CM_TYPEFLAG_SELECTION)) != 0)
	{
		if (model->GetCount())
			model->AddSeparator();
		model->AddItem(CLIENT_ID_SELECTION_COPY, "Copy");
	}
	// this menu only shown main window
	else if (params->GetTypeFlags() & (CM_TYPEFLAG_PAGE) && browser->GetHost()->GetWindowHandle() == TDPWindow::GetMainWndHandle())
	{
		bool write_twitter_ = (GetINI_Int(L"setting", L"DisableWriteTweetMenu", 0) == 1);
		SetINI_Int(L"setting", L"DisableWriteTweetMenu", write_twitter_);
		bool open_twitter_ = (GetINI_Int(L"setting", L"DisableTwitterOpenMenu", 0) == 1);
		SetINI_Int(L"setting", L"DisableTwitterOpenMenu", open_twitter_);

		if (model->GetCount() && (!write_twitter_ || !open_twitter_))
			model->AddSeparator();

		if (!write_twitter_)
			model->AddItem(CLIENT_ID_TWEET_TWITTER, "Write Tweet in Twitter");

		if (!open_twitter_)
			model->AddItem(CLIENT_ID_OPEN_TWITTER, "Open Twitter in popup");
	}
	
	if (browser->IsPopup())
	{
		if (model->GetCount())
			model->AddSeparator();
		model->AddItem(CLIENT_ID_POPUP_COPY_PAGE_URL, "Copy page URL");
		model->AddItem(CLIENT_ID_POPUP_OPEN_BROWSER, "Open page in browser");
		model->AddItem(CLIENT_ID_CLOSE_BROWSER, "Close");
	}
	else
	{
		if (model->GetCount())
			model->AddSeparator();

		// Add to Reload button
		model->AddItem(CLIENT_ID_RELOAD_PAGE, "Reload");
	}
	// Add DevTools items to all context menus.
	//bool is_debug = GetINI_Int(L"debug", L"devtools", 0) == 1;
	//if (is_debug)
	//{
	//	if (model->GetCount())
	//		model->AddSeparator();
	//
	//	model->AddItem(CLIENT_ID_SHOW_DEVTOOLS, "&Show DevTools");
	//	model->AddItem(CLIENT_ID_CLOSE_DEVTOOLS, "Close DevTools");
	//	model->AddSeparator();
	//	model->AddItem(CLIENT_ID_INSPECT_ELEMENT, "Inspect Elements");
	//}
	//SetINI_Int(L"debug", L"devtools", is_debug);
	//model->AddSeparator();
	//model->AddItem(CLIENT_ID_TOAST_NOTI, "Toast Noti");
	// Test context menu features.
	// BuildTestMenu(model);
}

void TDPHandler::OnBeforeDownload(
	CefRefPtr<CefBrowser> browser,
	CefRefPtr<CefDownloadItem> download_item,
	const CefString& suggested_name,
	CefRefPtr<CefBeforeDownloadCallback> callback) {
	CEF_REQUIRE_UI_THREAD();

	std::string filename = suggested_name;
	filename = PartialEraseStr(filename, "-orig");
	filename = PartialEraseStr(filename, "-large");
	filename = PartialEraseStr(filename, "-normal");
	filename = PartialEraseStr(filename, "-small");

	filename = downloadPath + filename;

	// Continue the download and show the "Save As" dialog.
	callback->Continue(filename, true);
}

void TDPHandler::OnDownloadUpdated(
	CefRefPtr<CefBrowser> browser,
	CefRefPtr<CefDownloadItem> download_item,
	CefRefPtr<CefDownloadItemCallback> callback) {
	CEF_REQUIRE_UI_THREAD();

	// save download path
	if (download_item->IsInProgress())
	{
		std::string path = download_item->GetFullPath().ToString();
		if (path.length() && path.rfind('\\') != std::string::npos)
		{
			downloadPath = path.substr(0, path.rfind('\\')) + '\\';
		}
	}
	if (download_item->IsComplete()) {
		//test_runner::Alert(
		//	browser,
		//	"File \"" + download_item->GetFullPath().ToString() +
		//	"\" downloaded successfully.");
	}
}

void TDPHandler::OpenPopup(CefRefPtr<CefFrame> frame, CefString url)
{
	std::wstring request;
	request += L"window.open('tdppopup://";
	request += url;
	request += L"')";
	frame->ExecuteJavaScript(request, frame->GetURL(), 0);
	return;
}

bool TDPHandler::OnContextMenuCommand(
	CefRefPtr<CefBrowser> browser,
	CefRefPtr<CefFrame> frame,
	CefRefPtr<CefContextMenuParams> params,
	int command_id,
	EventFlags event_flags) {
	CEF_REQUIRE_UI_THREAD();

	switch (command_id) {
	case CLIENT_ID_RELOAD_PAGE:
		browser->Reload();
		return true;
	case CLIENT_ID_BACK_PAGE:
		browser->GoBack();
		return true;
	case CLIENT_ID_FORWARD_PAGE:
		browser->GoForward();
		return true;
	case CLIENT_ID_OPEN_LINK:
		params->GetLinkUrl();
		OpenURL(params->GetLinkUrl());
		return true;
	case CLIENT_ID_OPEN_LINK_POPUP:
		OpenPopup(frame, params->GetLinkUrl());
		return true;
	case CLIENT_ID_SAVE_LINK_AS:
		browser->GetHost()->StartDownload(params->GetLinkUrl());
		return true;
	case CLIENT_ID_COPY_LINK_ADDRESS:
	{
		if (OpenClipboard(NULL))
		{
			if (EmptyClipboard())
			{
				int length = params->GetLinkUrl().length();
				HGLOBAL hGlob = GlobalAlloc(GMEM_FIXED, (length + 1) * 2);
				wcscpy_s((wchar_t*)hGlob, length + 1, params->GetLinkUrl().c_str());
				SetClipboardData(CF_UNICODETEXT, hGlob);
				GlobalUnlock(hGlob);
			}
			CloseClipboard();
		}
	}
	return true;
	case CLIENT_ID_SAVE_IMAGE_AS:
	{
		browser->GetHost()->StartDownload(Twimg_Orig(params->GetSourceUrl()));
		return true;
	}
	case CLIENT_ID_COPY_IMAGE_URL:
		if (OpenClipboard(NULL))
		{
			if (EmptyClipboard())
			{
				std::wstring url = Twimg_Orig(params->GetSourceUrl());
				int length = url.length();
				HGLOBAL hGlob = GlobalAlloc(GMEM_FIXED, (length + 1) * 2);
				wcscpy_s((wchar_t*)hGlob, length + 1, url.c_str());
				SetClipboardData(CF_UNICODETEXT, hGlob);
				GlobalUnlock(hGlob);
			}
			CloseClipboard();
		}
		return true;
	case CLIENT_ID_OPEN_IMAGE_LINK:
		OpenURL(Twimg_Orig(params->GetSourceUrl()));
		return true;
	case CLIENT_ID_OPEN_IMAGE_LINK_POPUP:
		OpenPopup(frame, Twimg_Orig(params->GetSourceUrl()));
		return true;
	case CLIENT_ID_SAVE_VIDEO_AS:
		browser->GetHost()->StartDownload(params->GetSourceUrl());
		return true;
	case CLIENT_ID_COPY_VIDEO_URL:
		if (OpenClipboard(NULL))
		{
			if (EmptyClipboard())
			{
				int length = params->GetSourceUrl().length();
				HGLOBAL hGlob = GlobalAlloc(GMEM_FIXED, (length + 1) * 2);
				wcscpy_s((wchar_t*)hGlob, length + 1, params->GetSourceUrl().c_str());
				SetClipboardData(CF_UNICODETEXT, hGlob);
				GlobalUnlock(hGlob);
			}
			CloseClipboard();
		}
		return true;
	case CLIENT_ID_OPEN_VIDEO_LINK:
		OpenURL(params->GetSourceUrl());
		return true;
	case CLIENT_ID_OPEN_VIDEO_LINK_POPUP:
		OpenPopup(frame, params->GetSourceUrl());
		return true;
	case CLIENT_ID_SELECTION_UNDO:
		frame->Undo();
		return true;
	case CLIENT_ID_SELECTION_REDO:
		frame->Redo();
		return true;
	case CLIENT_ID_SELECTION_CUT:
		frame->Cut();
		return true;
	case CLIENT_ID_SELECTION_COPY:
		frame->Copy();
		return true;
	case CLIENT_ID_SELECTION_PASTE:
		frame->Paste();
		return true;
	case CLIENT_ID_SELECTION_DELETE:
		frame->Delete();
		return true;
	case CLIENT_ID_SELECT_ALL:
		frame->SelectAll();
		return true;
	case CLIENT_ID_TWEET_TWITTER:
		OpenPopup(frame, L"https://www.twitter.com/?&");
		return true;
	case CLIENT_ID_OPEN_TWITTER:
		OpenPopup(frame, L"https://www.twitter.com/");
		return true;
	case CLIENT_ID_SHOW_DEVTOOLS:
		ShowDevTools(browser, CefPoint());
		return true;
	case CLIENT_ID_CLOSE_DEVTOOLS:
		CloseDevTools(browser);
		return true;
	case CLIENT_ID_INSPECT_ELEMENT:
		ShowDevTools(browser, CefPoint(params->GetXCoord(), params->GetYCoord()));
		return true;
	case CLIENT_ID_TOAST_NOTI:
		return true;
	case CLIENT_ID_POPUP_OPEN_BROWSER:
	case CLIENT_ID_POPUP_COPY_PAGE_URL:
	{
		std::wstring url = browser->GetMainFrame()->GetURL();

		if (url.find(L"twitter.com/", 0) != std::wstring::npos)
		{
			url = PartialEraseStr(url, L"/?&");
			url = PartialEraseStr(url, L"/??");
		}
		if (command_id == CLIENT_ID_POPUP_OPEN_BROWSER)
			OpenURL(url);
		else if (command_id == CLIENT_ID_POPUP_COPY_PAGE_URL)
		{
			if (OpenClipboard(NULL))
			{
				if (EmptyClipboard())
				{
					int length = url.length();
					HGLOBAL hGlob = GlobalAlloc(GMEM_FIXED, (length + 1) * 2);
					wcscpy_s((wchar_t*)hGlob, length + 1, url.c_str());
					SetClipboardData(CF_UNICODETEXT, hGlob);
					GlobalUnlock(hGlob);
				}
				CloseClipboard();
			}
		}
	}
	return true;
	case CLIENT_ID_CLOSE_BROWSER:
		browser->GetHost()->CloseBrowser(false);
		return true;
	//default:  // Allow default handling, if any.
	//	return ExecuteTestMenu(command_id);
	}
	return true;
}

void TDPHandler::BuildTestMenu(CefRefPtr<CefMenuModel> model) {
	if (model->GetCount() > 0)
		model->AddSeparator();

	// Build the sub menu.
	CefRefPtr<CefMenuModel> submenu =
		model->AddSubMenu(CLIENT_ID_TESTMENU_SUBMENU, "Context Menu Test");
	submenu->AddCheckItem(CLIENT_ID_TESTMENU_CHECKITEM, "Check Item");
	submenu->AddRadioItem(CLIENT_ID_TESTMENU_RADIOITEM1, "Radio Item 1", 0);
	submenu->AddRadioItem(CLIENT_ID_TESTMENU_RADIOITEM2, "Radio Item 2", 0);
	submenu->AddRadioItem(CLIENT_ID_TESTMENU_RADIOITEM3, "Radio Item 3", 0);

	// Check the check item.
	if (test_menu_state_.check_item)
		submenu->SetChecked(CLIENT_ID_TESTMENU_CHECKITEM, true);

	// Check the selected radio item.
	submenu->SetChecked(
		CLIENT_ID_TESTMENU_RADIOITEM1 + test_menu_state_.radio_item, true);
}

bool TDPHandler::ExecuteTestMenu(int command_id) {
	if (command_id == CLIENT_ID_TESTMENU_CHECKITEM) {
		// Toggle the check item.
		test_menu_state_.check_item ^= 1;
		return true;
	}
	else if (command_id >= CLIENT_ID_TESTMENU_RADIOITEM1 &&
		command_id <= CLIENT_ID_TESTMENU_RADIOITEM3) {
		// Store the selected radio item.
		test_menu_state_.radio_item = (command_id - CLIENT_ID_TESTMENU_RADIOITEM1);
		return true;
	}

	// Allow default handling to proceed.
	return false;
}

void TDPHandler::ShowDevTools(CefRefPtr<CefBrowser> browser,
	const CefPoint& inspect_element_at) {
	CefWindowInfo windowInfo;
	CefRefPtr<CefClient> client;
	CefBrowserSettings settings;

	//if (CreatePopupWindow(browser, true, CefPopupFeatures(), windowInfo, client,
	//	settings)) {
	//	browser->GetHost()->ShowDevTools(windowInfo, client, settings,
	//		inspect_element_at);
	//}
}

void TDPHandler::CloseDevTools(CefRefPtr<CefBrowser> browser) {
	browser->GetHost()->CloseDevTools();
}
bool TDPHandler::CreatePopupWindow(
	CefRefPtr<CefBrowser> browser,
	bool is_devtools,
	const CefPopupFeatures& popupFeatures,
	CefWindowInfo& windowInfo,
	CefRefPtr<CefClient>& client,
	CefBrowserSettings& settings) {
	// Note: This method will be called on multiple threads.

	// The popup browser will be parented to a new native window.
	// Don't show URL bar and navigation buttons on DevTools windows.
	//MainContext::Get()->GetRootWindowManager()->CreateRootWindowAsPopup(
	//	!is_devtools, is_osr(), popupFeatures, windowInfo, client, settings);

	return true;
}

}

// Copyright (c) 2016 Sokcuri. All rights reserved.

#include "tdpmain/tdpmain_window.h"
#include "tdpmain/util_win.h"
#include "tdpmain/resource.h"

namespace tdpmain
{
DWORD TDPWindow::wndOldProc = 0;
HWND TDPWindow::hMainWnd = 0;
HWND TDPWindow::hPopupWnd = 0;

TDPWindow::TDPWindow()
{
}


TDPWindow::~TDPWindow()
{
}

void TDPWindow::HideToTray(HWND hWnd)
{
	long exstyle = GetWindowLong(hWnd, GWL_EXSTYLE);
	exstyle |= WS_EX_TOOLWINDOW;
	exstyle &= ~WS_EX_APPWINDOW;

	ShowWindow(hWnd, SW_HIDE);
	SetWindowLong(hWnd, GWL_EXSTYLE, exstyle);
	ShowWindow(hWnd, SW_SHOW);
	ShowWindow(hWnd, SW_HIDE);
}

void TDPWindow::RestoreFromTray(HWND hWnd)
{
	long exstyle = GetWindowLong(hWnd, GWL_EXSTYLE);
	if (exstyle & WS_EX_TOOLWINDOW)
	{
		exstyle |= WS_EX_APPWINDOW;
		exstyle &= ~WS_EX_TOOLWINDOW;
		SetWindowLong(hWnd, GWL_EXSTYLE, exstyle);
	}
	ShowWindow(hWnd, SW_RESTORE);
	SetForegroundWindow(hWnd);
}

// static
LRESULT CALLBACK TDPWindow::PopupWndProc(HWND hWnd, UINT message,
	WPARAM wParam, LPARAM lParam) {

		// Callback for the main window
		switch (message) {
			case WM_SYSCOMMAND:
			{
				switch (wParam)
				{
					case SC_MINIMIZE:
						if (GetINI_Int(L"setting", L"MinimizeToTray", 1))
						{
							HideToTray(hWnd);
							return 0;
						}
						else break;
					case SC_MAXIMIZE:
					{
						RECT rect;
						GetWindowRect(hWnd, &rect);
						SaveMainWnd(&rect);
					}
					break;
				}
			}
			break;
			// When the user interacts with the tray icon:
			case MSG_NOTIFYICON:
				switch (lParam)
				{
					case WM_LBUTTONDBLCLK:
						RestoreFromTray(hWnd);
						break;
					case WM_RBUTTONUP:
					{
						// Display context menu
						HMENU hMenu = CreatePopupMenu();
						if (hMenu)
						{
							InsertMenu(hMenu, 0, MF_BYPOSITION | MF_DISABLED, 0, L"TweetDeck Player");
							InsertMenu(hMenu, (UINT)-1, MF_BYCOMMAND, IDB_SETTINGS, L"Settings");
							InsertMenu(hMenu, (UINT)-1, MF_SEPARATOR, 0, 0);
							InsertMenu(hMenu, (UINT)-1, MF_BYCOMMAND, IDB_TRAY_QUIT, L"Quit");
							POINT pt;
							GetCursorPos(&pt);
							SetForegroundWindow(hWnd);
							TrackPopupMenu(hMenu, TPM_RIGHTBUTTON, pt.x, pt.y, 0, hWnd, NULL);
						}
						break;
					}
				}
				break;
			case WM_DESTROY:
			{
				// Remove notification icon from the system tray.
				NOTIFYICONDATA x;
				ZeroMemory(&x, sizeof(NOTIFYICONDATA));
				x.hWnd = hWnd;
				x.uID = NOTIFYICON_ID_MAIN;
				Shell_NotifyIcon(NIM_DELETE, &x);
				PostQuitMessage(0);
			}
		}
		switch (wParam)
		{
		case IDB_ALWAYS_ON_TOP:
		{
			HMENU hMenu = GetSystemMenu(hWnd, false);
			MENUITEMINFO info;
			info.cbSize = sizeof(MENUITEMINFO);
			info.fMask = MIIM_STATE;

			DWORD dwStyle = GetWindowLong(hWnd, GWL_EXSTYLE);
			bool always_on_top_ = ((dwStyle & WS_EX_TOPMOST) != 0);

			if (always_on_top_) // en -> dis
			{
				info.fState = MFS_UNCHECKED;
				SetMenuItemInfo(hMenu, IDB_ALWAYS_ON_TOP, false, &info);

				SetWindowPos(hWnd, HWND_NOTOPMOST, 0, 0, 0, 0, SWP_NOSIZE | SWP_NOMOVE);
				SetWindowPos(hPopupWnd, HWND_NOTOPMOST, 0, 0, 0, 0, SWP_NOSIZE | SWP_NOMOVE);
			}
			else // dis -> en
			{
				info.fState = MFS_CHECKED;
				SetMenuItemInfo(hMenu, IDB_ALWAYS_ON_TOP, false, &info);

				SetWindowPos(hWnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOSIZE | SWP_NOMOVE);
				SetWindowPos(hPopupWnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOSIZE | SWP_NOMOVE);
			}
			return 0;
		}
		break;
		case IDB_SETTINGS:
			RestoreFromTray(hWnd);
			DialogBox(NULL, MAKEINTRESOURCE(IDD_SETTINGS), hWnd, (DLGPROC)SettingsDlgProc);
			break;

		// TRAY MENU HANDLERS //
		case IDB_TRAY_QUIT:
			PostMessage(hWnd, WM_DESTROY, 0, 0);
			break;
	}

	return reinterpret_cast<LRESULT(*)(HWND hWnd, UINT message, WPARAM wParam,
		LPARAM lParam)>(wndOldProc)(hWnd, message, wParam, lParam);
}

BOOL CALLBACK TDPWindow::SettingsDlgProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam)
{
	switch (message)
	{
	case WM_INITDIALOG:
	{
		// Center this dialog.
		HWND hParent;
		RECT rcParent, rcDlg, rc;

		hParent = GetParent(hWnd);
		if (hParent == NULL) hParent = GetDesktopWindow();
		GetWindowRect(hParent, &rcParent);
		GetWindowRect(hWnd, &rcDlg);
		CopyRect(&rc, &rcParent);

		OffsetRect(&rcDlg, -rcDlg.left, -rcDlg.top);
		OffsetRect(&rc, -rc.left, -rc.top);
		OffsetRect(&rc, -rcDlg.right, -rcDlg.bottom);
		SetWindowPos(hWnd, HWND_TOP, rcParent.left + rc.right / 2, rcParent.top + rc.bottom / 2, 0, 0, SWP_NOSIZE);

		// Read settings from appdata.ini and set controls appropriately.
		CheckDlgButton(hWnd, IDC_CHK_ALWAYS_ON_TOP, GetINI_Int(L"setting", L"DefaultAlwaysOnTop", 0));
		CheckDlgButton(hWnd, IDC_CHK_MINTRAY, GetINI_Int(L"setting", L"MinimizeToTray", 1));
		CheckDlgButton(hWnd, IDC_CHK_POPUP, GetINI_Int(L"setting", L"DisableLinkPopup", 0));
		CheckDlgButton(hWnd, IDC_CHK_CTX_TWEET_IN_TWITTER, GetINI_Int(L"setting", L"DisableWriteTweetMenu", 0));
		CheckDlgButton(hWnd, IDC_CHK_CTX_TWITTER_POPUP, GetINI_Int(L"setting", L"DisableTwitterOpenMenu", 0));
		CheckDlgButton(hWnd, IDC_CHK_CTX_LINK_POPUP, GetINI_Int(L"setting", L"DisablePopupOpenMenu", 0));
		CheckDlgButton(hWnd, IDC_CHK_DL_ORIG_IMG, GetINI_Int(L"setting", L"DisableTwimgOrig", 0));

		HWND hFont = GetDlgItem(hWnd, IDC_EDIT_FONT);
		SetWindowText(hFont, GetINI_String(L"timeline", L"fontFamily", L"").c_str());
	}
		return TRUE;
	case WM_COMMAND:
		switch (LOWORD(wParam))
		{
		case IDOK:
			// Write settings to appdata.ini
			SetINI_Int(L"setting", L"DefaultAlwaysOnTop", IsDlgButtonChecked(hWnd, IDC_CHK_ALWAYS_ON_TOP));
			SetINI_Int(L"setting", L"MinimizeToTray", IsDlgButtonChecked(hWnd, IDC_CHK_MINTRAY));
			SetINI_Int(L"setting", L"DisableLinkPopup", IsDlgButtonChecked(hWnd, IDC_CHK_POPUP));
			SetINI_Int(L"setting", L"DisableWriteTweetMenu", IsDlgButtonChecked(hWnd, IDC_CHK_CTX_TWEET_IN_TWITTER));
			SetINI_Int(L"setting", L"DisableTwitterOpenMenu", IsDlgButtonChecked(hWnd, IDC_CHK_CTX_TWITTER_POPUP));
			SetINI_Int(L"setting", L"DisablePopupOpenMenu", IsDlgButtonChecked(hWnd, IDC_CHK_CTX_LINK_POPUP));
			SetINI_Int(L"setting", L"DisableTwimgOrig", IsDlgButtonChecked(hWnd, IDC_CHK_DL_ORIG_IMG));

			WCHAR _fnt[1001];
			GetWindowText(GetDlgItem(hWnd, IDC_EDIT_FONT), _fnt, 1000);
			SetINI_String(L"timeline", L"fontFamily", _fnt);

			// Fall through to close this dialog.
		case IDCANCEL:
			EndDialog(hWnd, wParam);
			return TRUE;
		}
	}

	return FALSE;
}

void TDPWindow::OnWndCreated(HWND hWnd, bool isMainWnd)
{
	bool always_on_top_;
	bool parent_always_on_top_;

	// Get submenu
	HMENU systemMenu = GetSystemMenu(hWnd, false);

	if (isMainWnd)
	{
		hMainWnd = hWnd;

		// Read Always on top settings
		always_on_top_ = (GetINI_Int(L"setting", L"DefaultAlwaysOnTop", 0) == 1);
		SetINI_Int(L"setting", L"DefaultAlwaysOnTop", always_on_top_);

		// insert system menu
		if (systemMenu)
		{
			InsertMenu(systemMenu, (UINT)-1, MF_SEPARATOR, 0, 0);
			InsertMenu(systemMenu, (UINT)-1, MF_BYCOMMAND, IDB_ALWAYS_ON_TOP, L"Always On Top");
			InsertMenu(systemMenu, (UINT)-1, MF_BYCOMMAND, IDB_SETTINGS, L"Settings");
		}

		if (always_on_top_)
		{
			MENUITEMINFO info;
			info.cbSize = sizeof(MENUITEMINFO);
			info.fMask = MIIM_STATE;
			info.fState = MFS_CHECKED;
			SetMenuItemInfo(systemMenu, IDB_ALWAYS_ON_TOP, false, &info);
		}

		// Set tray icon
		NOTIFYICONDATA notiIcon;
		ZeroMemory(&notiIcon, sizeof(NOTIFYICONDATA));
		notiIcon.cbSize = sizeof(NOTIFYICONDATA);
		notiIcon.hWnd = hWnd;
		notiIcon.uID = NOTIFYICON_ID_MAIN;
		notiIcon.hIcon = LoadIcon(GetModuleHandle(NULL), MAKEINTRESOURCE(IDI_SMALL));
		notiIcon.uVersion = NOTIFYICON_VERSION;
		notiIcon.uCallbackMessage = MSG_NOTIFYICON;
		lstrcpy(notiIcon.szTip, L"TweetDeck Player");
		notiIcon.uFlags = NIF_ICON | NIF_TIP | NIF_MESSAGE;

		Shell_NotifyIcon(NIM_ADD, &notiIcon);
	}
	else
	{
		hPopupWnd = hWnd;

		DWORD dwStyle = GetWindowLong(hMainWnd, GWL_EXSTYLE);
		parent_always_on_top_ = ((dwStyle & WS_EX_TOPMOST) != 0);
		always_on_top_ = parent_always_on_top_;
	}

	if (always_on_top_)
		SetWindowPos(hWnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOSIZE | SWP_NOMOVE);
	//
	//
	// THIS CODE IS NOT USED
	// always child on parent window
	//if (!isMainWnd) // not main window
	//{
	//	//SetParent(TDPWindow::hMainWnd, hwnd_);
	//
	//	if (parent_always_on_top_)
	//		SetWindowPos(hMainWnd, HWND_NOTOPMOST, 0, 0, 0, 0, SWP_NOSIZE | SWP_NOMOVE);
	//
	//	// Always child window top on parent
	//	SetWindowLong(hWnd, GWL_HWNDPARENT, (DWORD)hMainWnd);
	//
	//	if (parent_always_on_top_)
	//		SetWindowPos(hMainWnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOSIZE | SWP_NOMOVE);
	//}
	//

	// Set Icon
	HINSTANCE hInst = GetModuleHandle(0);
	SetClassLong(hWnd, GCL_HICON, (LONG)LoadIcon(hInst, MAKEINTRESOURCE(IDI_TDPMAIN)));

	// Insert wndproc
	if (!wndOldProc)
		wndOldProc = reinterpret_cast<DWORD>(SetWndProcPtr(hWnd, reinterpret_cast<WNDPROC>(PopupWndProc)));

	/*
	else
	{ // follow main window setting

	DWORD dwStyle = GetWindowLong(hwnd_, GWL_EXSTYLE);
	always_on_top_ = ((dwStyle & WS_EX_TOPMOST) != 0);
	}*/
}

}
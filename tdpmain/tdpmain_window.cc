// Copyright (c) 2016 Sokcuri. All rights reserved.

#include "tdpmain/tdpmain_window.h"
#include "tdpmain/tdpmain_settingsdlg.h"
#include "tdpmain/util_win.h"
#include "tdpmain/resource.h"

namespace tdpmain
{
DWORD TDPWindow::wndOldProc = 0;
HWND TDPWindow::hMainWnd = 0;
HWND TDPWindow::hPopupWnd = 0;
bool TDPWindow::isShownTrayIcon = false;

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

	WINDOWPLACEMENT wndpl;
	wndpl.length = sizeof(WINDOWPLACEMENT);
	GetWindowPlacement(hWnd, &wndpl);
	if (wndpl.showCmd != SW_SHOWMAXIMIZED)
		ShowWindow(hWnd, SW_RESTORE);

	SetForegroundWindow(hWnd);
}

// static
LRESULT CALLBACK TDPWindow::PopupWndProc(HWND hWnd, UINT message,
	WPARAM wParam, LPARAM lParam) {

		// Callback for the main window
		switch (message) {
			break;
			case WM_SYSCOMMAND:
			{
				switch (wParam)
				{
					case SC_RESTORE:
					{
						RECT rect;
						GetClientRect(hWnd, &rect);
						InvalidateRect(hWnd, &rect, true);
						UpdateWindow(hWnd);
					}
					break;
					case SC_MINIMIZE:
						if (GetINI_Int(L"setting", L"MinimizeToTray", 0) && isShownTrayIcon)
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
		{
			RestoreFromTray(hWnd);
			TDPSettingsDlg::ShowDialog(hWnd);
		}	break;

		// TRAY MENU HANDLERS //
		case IDB_TRAY_QUIT:
			PostMessage(hWnd, WM_DESTROY, 0, 0);
			break;
	}

	return reinterpret_cast<LRESULT(*)(HWND hWnd, UINT message, WPARAM wParam,
		LPARAM lParam)>(wndOldProc)(hWnd, message, wParam, lParam);
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

		SetINI_Int(L"setting", L"MinimizeToTray",
			GetINI_Int(L"setting", L"MinimizeToTray", 0));

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

		if (GetINI_Int(L"setting", L"DisableTrayIcon", 0) == 0)
		{
			Shell_NotifyIcon(NIM_ADD, &notiIcon);
			isShownTrayIcon = true;
		}
		else
			isShownTrayIcon = false;
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

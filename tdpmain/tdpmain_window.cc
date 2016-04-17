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
					case SC_MAXIMIZE:
					{
						RECT rect;
						GetWindowRect(hWnd, &rect);
						SaveMainWnd(&rect);
					}
					break;
				}
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

		// insert system menu
		if (systemMenu)
		{
			InsertMenu(systemMenu, (UINT)-1, MF_SEPARATOR, 0, 0);
			InsertMenu(systemMenu, (UINT)-1, MF_BYCOMMAND, IDB_ALWAYS_ON_TOP, L"Always On Top");
		}

		if (always_on_top_)
		{
			MENUITEMINFO info;
			info.cbSize = sizeof(MENUITEMINFO);
			info.fMask = MIIM_STATE;
			info.fState = MFS_CHECKED;
			SetMenuItemInfo(systemMenu, IDB_ALWAYS_ON_TOP, false, &info);
		}
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
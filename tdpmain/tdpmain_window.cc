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
		break;
		case IDB_SETTINGS:
		{
			DialogBox(NULL, MAKEINTRESOURCE(IDD_SETTINGS), hWnd, (DLGPROC)SettingsDlgProc);
		}
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

		// Read settings from appdata.ini and set checkboxes appropriately.
		CheckDlgButton(hWnd, IDC_CHK_ALWAYS_ON_TOP, GetINI_Int(L"setting", L"DefaultAlwaysOnTop", 0));
		CheckDlgButton(hWnd, IDC_CHK_POPUP, GetINI_Int(L"setting", L"DisableLinkPopup", 0));
		CheckDlgButton(hWnd, IDC_CHK_CTX_TWEET_IN_TWITTER, GetINI_Int(L"setting", L"DisableWriteTweetMenu", 0));
		CheckDlgButton(hWnd, IDC_CHK_CTX_TWITTER_POPUP, GetINI_Int(L"setting", L"DisableTwitterOpenMenu", 0));
		CheckDlgButton(hWnd, IDC_CHK_CTX_LINK_POPUP, GetINI_Int(L"setting", L"DisablePopupOpenMenu", 0));
		CheckDlgButton(hWnd, IDC_CHK_DL_ORIG_IMG, GetINI_Int(L"setting", L"DisableTwimgOrig", 0));
	}
		return TRUE;
	case WM_COMMAND:
		switch (LOWORD(wParam))
		{
		case IDOK:
			// Write settings to appdata.ini
			SetINI_Int(L"setting", L"DefaultAlwaysOnTop", IsDlgButtonChecked(hWnd, IDC_CHK_ALWAYS_ON_TOP));
			SetINI_Int(L"setting", L"DisableLinkPopup", IsDlgButtonChecked(hWnd, IDC_CHK_POPUP));
			SetINI_Int(L"setting", L"DisableWriteTweetMenu", IsDlgButtonChecked(hWnd, IDC_CHK_CTX_TWEET_IN_TWITTER));
			SetINI_Int(L"setting", L"DisableTwitterOpenMenu", IsDlgButtonChecked(hWnd, IDC_CHK_CTX_TWITTER_POPUP));
			SetINI_Int(L"setting", L"DisablePopupOpenMenu", IsDlgButtonChecked(hWnd, IDC_CHK_CTX_LINK_POPUP));
			SetINI_Int(L"setting", L"DisableTwimgOrig", IsDlgButtonChecked(hWnd, IDC_CHK_DL_ORIG_IMG));

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
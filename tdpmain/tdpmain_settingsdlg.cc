#include "tdpmain/tdpmain_settingsdlg.h"
#include "tdpmain/tdpmain_window.h"
#include "tdpmain/util_win.h"
#include "tdpmain/resource.h"

namespace tdpmain
{
TDPSettingsDlg::TDPSettingsDlg() {}
TDPSettingsDlg::~TDPSettingsDlg() {}

void TDPSettingsDlg::ShowDialog(HWND hWnd)
{
	DialogBox(NULL, MAKEINTRESOURCE(IDD_SETTINGS), hWnd, (DLGPROC)DlgProc);
}

BOOL CALLBACK TDPSettingsDlg::DlgProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam)
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
		CheckDlgButton(hWnd, IDC_CHK_HIDETRAY, GetINI_Int(L"setting", L"DisableTrayIcon", 0));
		CheckDlgButton(hWnd, IDC_CHK_MINTRAY, GetINI_Int(L"setting", L"MinimizeToTray", 0));
		CheckDlgButton(hWnd, IDC_CHK_POPUP, GetINI_Int(L"setting", L"DisableLinkPopup", 0));
		CheckDlgButton(hWnd, IDC_CHK_CTX_TWEET_IN_TWITTER, !GetINI_Int(L"setting", L"DisableWriteTweetMenu", 0));
		CheckDlgButton(hWnd, IDC_CHK_CTX_TWITTER_POPUP, !GetINI_Int(L"setting", L"DisableTwitterOpenMenu", 0));
		CheckDlgButton(hWnd, IDC_CHK_CTX_LINK_POPUP, !GetINI_Int(L"setting", L"DisablePopupOpenMenu", 0));
		CheckDlgButton(hWnd, IDC_CHK_CTX_SEARCH_IMG, !GetINI_Int(L"setting", L"DisableSearchImageMenu", 0));
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
			SetINI_Int(L"setting", L"DisableTrayIcon", IsDlgButtonChecked(hWnd, IDC_CHK_HIDETRAY));
			SetINI_Int(L"setting", L"MinimizeToTray", IsDlgButtonChecked(hWnd, IDC_CHK_MINTRAY));
			SetINI_Int(L"setting", L"DisableLinkPopup", !IsDlgButtonChecked(hWnd, IDC_CHK_POPUP));
			SetINI_Int(L"setting", L"DisableWriteTweetMenu", !IsDlgButtonChecked(hWnd, IDC_CHK_CTX_TWEET_IN_TWITTER));
			SetINI_Int(L"setting", L"DisableTwitterOpenMenu", !IsDlgButtonChecked(hWnd, IDC_CHK_CTX_TWITTER_POPUP));
			SetINI_Int(L"setting", L"DisablePopupOpenMenu", !IsDlgButtonChecked(hWnd, IDC_CHK_CTX_LINK_POPUP));
			SetINI_Int(L"setting", L"DisableSearchImageMenu", !IsDlgButtonChecked(hWnd, IDC_CHK_CTX_SEARCH_IMG));
			SetINI_Int(L"setting", L"DisableTwimgOrig", IsDlgButtonChecked(hWnd, IDC_CHK_DL_ORIG_IMG));

			WCHAR _fnt[1001];
			GetWindowText(GetDlgItem(hWnd, IDC_EDIT_FONT), _fnt, 1000);
			SetINI_String(L"timeline", L"fontFamily", _fnt);

			if (TDPWindow::isShownTrayIcon && IsDlgButtonChecked(hWnd, IDC_CHK_HIDETRAY) == 1)
			{
				NOTIFYICONDATA notifyIconData;
				memset(&notifyIconData, 0, sizeof(notifyIconData));
				notifyIconData.cbSize = sizeof(NOTIFYICONDATA);
				notifyIconData.hWnd = TDPWindow::GetMainWndHandle();
				notifyIconData.uID = NOTIFYICON_ID_MAIN;

				Shell_NotifyIcon(NIM_DELETE, (NOTIFYICONDATA *)&notifyIconData);

				TDPWindow::isShownTrayIcon = false;

				// Show Window
				long exstyle = GetWindowLong(TDPWindow::GetMainWndHandle(), GWL_EXSTYLE);
				if (exstyle & WS_EX_TOOLWINDOW)
				{
					exstyle |= WS_EX_APPWINDOW;
					exstyle &= ~WS_EX_TOOLWINDOW;
					SetWindowLong(TDPWindow::GetMainWndHandle(), GWL_EXSTYLE, exstyle);
				}
			}
			else if (!TDPWindow::isShownTrayIcon && IsDlgButtonChecked(hWnd, IDC_CHK_HIDETRAY) == 0)
			{
				NOTIFYICONDATA notifyIconData;
				ZeroMemory(&notifyIconData, sizeof(NOTIFYICONDATA));
				notifyIconData.cbSize = sizeof(NOTIFYICONDATA);
				notifyIconData.hWnd = TDPWindow::GetMainWndHandle();
				notifyIconData.uID = NOTIFYICON_ID_MAIN;
				notifyIconData.hIcon = LoadIcon(GetModuleHandle(NULL), MAKEINTRESOURCE(IDI_SMALL));
				notifyIconData.uVersion = NOTIFYICON_VERSION;
				notifyIconData.uCallbackMessage = MSG_NOTIFYICON;
				lstrcpy(notifyIconData.szTip, L"TweetDeck Player");
				notifyIconData.uFlags = NIF_ICON | NIF_TIP | NIF_MESSAGE;
				Shell_NotifyIcon(NIM_ADD, &notifyIconData);

				TDPWindow::isShownTrayIcon = true;
			}

			// Fall through to close this dialog.
		case IDCANCEL:
			EndDialog(hWnd, wParam);
			return TRUE;
		}
	}

	return FALSE;
}
}
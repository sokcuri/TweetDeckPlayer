#include <Windows.h>
#include <wingdi.h>
#include "tdpmain/tdpmain_settingsdlg.h"
#include "tdpmain/tdpmain_window.h"
#include "tdpmain/util_win.h"
#include "tdpmain/resource.h"

#define BF_PATH L"E:\\Data\\btnface_"

namespace tdpmain
{
TDPSettingsDlg *TDPSettingsDlg::instance = nullptr;

TDPSettingsDlg *TDPSettingsDlg::GetInstance()
{
	instance = instance == nullptr ? new TDPSettingsDlg() : instance;
	return instance;
}

void TDPSettingsDlg::FreeInstance()
{
	delete instance;
	instance = nullptr;
}

const LPCWSTR TDPSettingsDlg::szBtnFaceNames[3][4] {
	{ BF_PATH L"n_lt.png", BF_PATH L"n_rt.png", BF_PATH L"n_lb.png", BF_PATH L"n_rb.png" },
	{ BF_PATH L"h_lt.png", BF_PATH L"h_rt.png", BF_PATH L"h_lb.png", BF_PATH L"h_rb.png" },
	{ BF_PATH L"d_lt.png", BF_PATH L"d_rt.png", BF_PATH L"d_lb.png", BF_PATH L"d_rb.png" }
};

Gdiplus::GdiplusStartupInput TDPSettingsDlg::gpsi;
ULONG_PTR TDPSettingsDlg::gptok;

TDPSettingsDlg::TDPSettingsDlg()
{
	OutputDebugString(L"TDPSettingsDlg constructor called.\n");
	GdiplusStartup(&gptok, &gpsi, NULL);

	for (int i = 0; i < 3; i++)
		for (int j = 0; j < 4; j++)
			iBtnFaces[i][j] = Image::FromFile(szBtnFaceNames[i][j]);
	brFaces[0] = new SolidBrush(Color(85, 172, 239));
	brFaces[1] = new SolidBrush(Color(80, 165, 230));
	brFaces[2] = new SolidBrush(Color(59, 148, 217));
	penShadow = new Pen(Color(48, 0, 0, 0));
}

TDPSettingsDlg::~TDPSettingsDlg() 
{
	GdiplusShutdown(gptok);
	for (auto &a : iBtnFaces)
		for (auto &img : a)
			delete img;
	for (auto &bf : brFaces)
		delete bf;
	delete penShadow;
}

void TDPSettingsDlg::ShowDialog(HWND hWnd)
{
	DialogBox(NULL, MAKEINTRESOURCE(IDD_SETTINGS), hWnd, (DLGPROC)TDPSettingsDlg::DlgProc);
}

BOOL CALLBACK TDPSettingsDlg::DlgProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam)
{
	TDPSettingsDlg *inst = TDPSettingsDlg::GetInstance();
	UNREFERENCED_PARAMETER(inst);

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

		GetWindowRect(hWnd, &rcDlg);
		HRGN rgn = CreateRoundRectRgn(0, 0, rcDlg.right - rcDlg.left, rcDlg.bottom - rcDlg.top, 2, 2);
		SetWindowRgn(hWnd, rgn, TRUE);
	}	return TRUE;
	case WM_PAINT:
	{
		Gdiplus::Graphics g(hWnd);
		Gdiplus::Image imgHandle(L"E:\\Data\\handle.png");
		g.DrawImage(&imgHandle, 16, 14);
	}	break;
	case WM_CTLCOLORDLG:
	case WM_CTLCOLORSTATIC:
		return (BOOL)GetStockObject(WHITE_BRUSH);
	case WM_NOTIFY:
	{
		LPNMHDR item = (LPNMHDR)lParam;
		if (item->idFrom == IDOK && item->code == NM_CUSTOMDRAW)
		{
			LPNMCUSTOMDRAW d = (LPNMCUSTOMDRAW)item;
			RECT &rcBtn = d->rc;
			Graphics g(d->hdc);
			static int corners[4][2]{
				{ rcBtn.left, rcBtn.top },
				{ rcBtn.right - 3, rcBtn.top },
				{ rcBtn.left, rcBtn.bottom - 3 },
				{ rcBtn.right - 3, rcBtn.bottom - 3 }
			};

			// Draw button face
			int nType;
			if (d->uItemState & CDIS_SELECTED) nType = 2;
			else if (d->uItemState & CDIS_HOT) nType = 1;
			else nType = 0;

			g.Clear(Color(255, 255, 255));
			for (int i = 0; i < 4; i++)
				g.DrawImage(inst->iBtnFaces[nType][i], corners[i][0], corners[i][1]);
			g.FillRectangle(inst->brFaces[nType], 3, 0, rcBtn.right - 6, rcBtn.bottom - 1);
			g.FillRectangle(inst->brFaces[nType], 0, 3, rcBtn.right - 1, rcBtn.bottom - 6);
			if (nType != 2)
			{
				g.DrawLine(inst->penShadow, rcBtn.right - 1, 3, rcBtn.right - 1, rcBtn.bottom - 4);
				g.DrawLine(inst->penShadow, 3, rcBtn.bottom - 1, rcBtn.right - 4, rcBtn.bottom - 1);
			}

			// Draw button text
			WCHAR szLabel[100];
			SendMessage(item->hwndFrom, WM_GETTEXT, 100, (LPARAM)szLabel);

			RectF rcfBtn(rcBtn.left, rcBtn.top, rcBtn.right, rcBtn.bottom), rcfText;
			SolidBrush brush(Color(255, 255, 255));
			FontFamily fontFamily(L"Arial");
			Font font(&fontFamily, 14, FontStyleRegular, UnitPixel);

			g.SetTextRenderingHint(TextRenderingHintAntiAliasGridFit);
			g.MeasureString(szLabel, -1, &font, rcfBtn, &rcfText);
			PointF origin(rcfBtn.GetRight() / 2 - rcfText.GetRight() / 2,
				rcfBtn.GetBottom() / 2 - rcfText.GetBottom() / 2);
			g.DrawString(szLabel, -1, &font, origin, &brush);

			SetWindowLong(hWnd, DWL_MSGRESULT, CDRF_SKIPDEFAULT);
			return TRUE;
		}
	}	break;
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
	}	return FALSE;
}
}
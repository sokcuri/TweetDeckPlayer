#include "tdpmain/tdpmain_settingsdlg.h"
#include "tdpmain/tdpmain_window.h"
#include "tdpmain/util_win.h"
#include "tdpmain/resource.h"

#define IMGPATH L"images\\"

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

Gdiplus::GdiplusStartupInput TDPSettingsDlg::gpsi;
ULONG_PTR TDPSettingsDlg::gptok;

const LPCWSTR TDPSettingsDlg::szBtnFaceNames[3][4]{
	{ IMGPATH L"btnface_n_lt.png", IMGPATH L"btnface_n_rt.png", IMGPATH L"btnface_n_lb.png", IMGPATH L"btnface_n_rb.png" },
	{ IMGPATH L"btnface_h_lt.png", IMGPATH L"btnface_h_rt.png", IMGPATH L"btnface_h_lb.png", IMGPATH L"btnface_h_rb.png" },
	{ IMGPATH L"btnface_d_lt.png", IMGPATH L"btnface_d_rt.png", IMGPATH L"btnface_d_lb.png", IMGPATH L"btnface_d_rb.png" }
};

const LPCWSTR TDPSettingsDlg::szSwitchNames[2]{
	IMGPATH L"sw_0.png", IMGPATH L"sw_1.png"
};

TDPSettingsDlg::TDPSettingsDlg()
{
	GdiplusStartup(&gptok, &gpsi, NULL);

	for (int i = 0; i < 3; i++)
		for (int j = 0; j < 4; j++)
			iBtnFaces[i][j] = Image::FromFile(szBtnFaceNames[i][j]);
	for (int i = 0; i < 2; i++)
		iSwitch[i] = Image::FromFile(szSwitchNames[i]);
	brFaces[0] = new SolidBrush(Color(85, 172, 239));
	brFaces[1] = new SolidBrush(Color(80, 165, 230));
	brFaces[2] = new SolidBrush(Color(59, 148, 217));
	brCtrlText = new SolidBrush(Color(17, 17, 17));
	penShadow = new Pen(Color(48, 0, 0, 0));
	ffArial = new FontFamily(L"Arial");
	fntDefault = new Font(ffArial, 13, FontStyleRegular, UnitPixel);
}

TDPSettingsDlg::~TDPSettingsDlg() 
{
	GdiplusShutdown(gptok);
	for (auto &a : iBtnFaces)
		for (auto &img : a)
			delete img;
	for (auto &img : iSwitch)
		delete img;
	for (auto &bf : brFaces)
		delete bf;
	delete brCtrlText;
	delete penShadow;
	delete ffArial;
	delete fntDefault;
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
		
		int stay_open_ = GetINI_Int(L"setting", L"OverrideStayOpen", 0);
		if (stay_open_ > 2) stay_open_ = 0;
		CheckRadioButton(hWnd, IDC_RADIO_STAYOPEN_DEFAULT, IDC_RADIO_STAYOPEN_ALWAYSOFF, IDC_RADIO_STAYOPEN_DEFAULT + stay_open_);

		HWND hFont = GetDlgItem(hWnd, IDC_EDIT_FONT);
		SetWindowText(hFont, GetINI_String(L"timeline", L"fontFamily", L"").c_str());

		SetWindowLong(GetDlgItem(hWnd, IDC_GRP_STAYOPEN), GWL_WNDPROC, (LONG)(WNDPROC)GrpProc);
		SetWindowLong(GetDlgItem(hWnd, IDC_GRP_CTXMENU), GWL_WNDPROC, (LONG)(WNDPROC)GrpProc);
		SetWindowLong(GetDlgItem(hWnd, IDC_LBL_TOP_DESC), GWL_WNDPROC, (LONG)(WNDPROC)TxtProc);
		SetWindowLong(GetDlgItem(hWnd, IDC_LBL_FONT), GWL_WNDPROC, (LONG)(WNDPROC)TxtProc);
		SetWindowLong(GetDlgItem(hWnd, IDC_LBL_FONT_DESC), GWL_WNDPROC, (LONG)(WNDPROC)TxtProc);

		// Apply rounded window frame
		GetWindowRect(hWnd, &rcDlg);
		HRGN rgn = CreateRoundRectRgn(0, 0, rcDlg.right - rcDlg.left, rcDlg.bottom - rcDlg.top, 2, 2);
		SetWindowRgn(hWnd, rgn, TRUE);
	}	return TRUE;
	case WM_PAINT:
	{
		RECT rcDlg;
		GetWindowRect(hWnd, &rcDlg);
		OffsetRect(&rcDlg, -rcDlg.left, -rcDlg.top);
		Rect grcDlg{ 16, 45, rcDlg.right-33, rcDlg.bottom-109 };

		PAINTSTRUCT ps;
		HDC dc = BeginPaint(hWnd, &ps);
		Gdiplus::Graphics g(dc);
		Gdiplus::Image imgHandle(IMGPATH L"handle.png");
		g.DrawImage(&imgHandle, 16, 14);
		Pen pen(Color(204, 214, 221));
		g.DrawRectangle(&pen, grcDlg);

		EndPaint(hWnd, &ps);
	}	break;
	// Make the dialog white
	case WM_CTLCOLORDLG:
	case WM_CTLCOLORSTATIC:
		return (BOOL)GetStockObject(WHITE_BRUSH);
	case WM_NOTIFY:
	{
		LPNMHDR item = (LPNMHDR)lParam;
		
		// Custom draw controls
		if (item->code == NM_CUSTOMDRAW)
		{
			LONG lStyle = GetWindowLong(item->hwndFrom, GWL_STYLE);
			
			if (item->idFrom == IDOK)
				CustomDrawOK(item);
			else if (item->idFrom == IDCANCEL)
				CustomDrawCancel(item);
			else if (LOWORD(lStyle) == BS_AUTOCHECKBOX)
				CustomDrawCheckbox(item);
			else if (LOWORD(lStyle) == BS_AUTORADIOBUTTON)
				CustomDrawRadio(item);

			SetWindowLong(hWnd, DWL_MSGRESULT, CDRF_SKIPDEFAULT);
			return TRUE;
		}
	}	break;
	case WM_COMMAND:
		switch (LOWORD(wParam))
		{
		// When the user pressed the OK button
		case IDOK:
		{
			// Write settings to appdata.ini
			SetINI_Int(L"setting", L"DefaultAlwaysOnTop", IsDlgButtonChecked(hWnd, IDC_CHK_ALWAYS_ON_TOP));
			SetINI_Int(L"setting", L"DisableTrayIcon", IsDlgButtonChecked(hWnd, IDC_CHK_HIDETRAY));
			SetINI_Int(L"setting", L"MinimizeToTray", IsDlgButtonChecked(hWnd, IDC_CHK_MINTRAY));
			SetINI_Int(L"setting", L"DisableLinkPopup", IsDlgButtonChecked(hWnd, IDC_CHK_POPUP));
			SetINI_Int(L"setting", L"DisableWriteTweetMenu", !IsDlgButtonChecked(hWnd, IDC_CHK_CTX_TWEET_IN_TWITTER));
			SetINI_Int(L"setting", L"DisableTwitterOpenMenu", !IsDlgButtonChecked(hWnd, IDC_CHK_CTX_TWITTER_POPUP));
			SetINI_Int(L"setting", L"DisablePopupOpenMenu", !IsDlgButtonChecked(hWnd, IDC_CHK_CTX_LINK_POPUP));
			SetINI_Int(L"setting", L"DisableSearchImageMenu", !IsDlgButtonChecked(hWnd, IDC_CHK_CTX_SEARCH_IMG));
			SetINI_Int(L"setting", L"DisableTwimgOrig", IsDlgButtonChecked(hWnd, IDC_CHK_DL_ORIG_IMG));

			// Stay Open Override setting
			int stay_open_ = 0;
			if (IsDlgButtonChecked(hWnd, IDC_RADIO_STAYOPEN_ALWAYSON))
				stay_open_ = 1;
			else if (IsDlgButtonChecked(hWnd, IDC_RADIO_STAYOPEN_ALWAYSOFF))
				stay_open_ = 2;

			SetINI_Int(L"setting", L"OverrideStayOpen", stay_open_);


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
		}
		// Fall through to close this dialog.
		case IDCANCEL:
			EndDialog(hWnd, wParam);
			return TRUE;
		}
	}	return FALSE;
}

LRESULT CALLBACK TDPSettingsDlg::GrpProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
	TDPSettingsDlg *inst = TDPSettingsDlg::GetInstance();

	switch (msg)
	{
	case WM_PAINT:
	{
		PAINTSTRUCT ps;
		HDC dc = BeginPaint(hWnd, &ps);
		Graphics g(dc);

		WCHAR buf[100];
		SendMessage(hWnd, WM_GETTEXT, 100, (LPARAM)buf);

		Font font(inst->ffArial, 13, FontStyleBold, UnitPixel);
		g.DrawString(buf, -1, &font, { 0.0f, 0.0f }, inst->brCtrlText);

		EndPaint(hWnd, &ps);
	}	break;
	}

	return DefWindowProc(hWnd, msg, wParam, lParam);
}

LRESULT CALLBACK TDPSettingsDlg::TxtProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
	TDPSettingsDlg *inst = TDPSettingsDlg::GetInstance();

	switch (msg)
	{
	case WM_PAINT:
	{
		PAINTSTRUCT ps;
		HDC dc = BeginPaint(hWnd, &ps);
		Graphics g(dc);

		WCHAR buf[1000];
		SendMessage(hWnd, WM_GETTEXT, 1000, (LPARAM)buf);

		Font font(inst->ffArial, 12, FontStyleRegular, UnitPixel);
		SolidBrush brDisabled(Color(136, 153, 166));
		SolidBrush *brush;

		long style = GetWindowLong(hWnd, GWL_STYLE);
		if (style & WS_DISABLED) brush = &brDisabled;
		else brush = inst->brCtrlText;
		g.DrawString(buf, -1, &font, { 0.0f, 0.0f }, brush);

		EndPaint(hWnd, &ps);
	}	break;
	}

	return DefWindowProc(hWnd, msg, wParam, lParam);
}

void TDPSettingsDlg::CustomDrawOK(LPNMHDR item)
{
	LPNMCUSTOMDRAW d = (LPNMCUSTOMDRAW)item;
	TDPSettingsDlg *inst = GetInstance();

	RECT &rcBtn = d->rc;
	Graphics g(d->hdc);
	int corners[4][2]{
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

	g.SetTextRenderingHint(TextRenderingHintAntiAliasGridFit);
	g.MeasureString(szLabel, -1, inst->fntDefault, rcfBtn, &rcfText);
	PointF origin(rcfBtn.GetRight() / 2 - rcfText.GetRight() / 2,
		rcfBtn.GetBottom() / 2 - rcfText.GetBottom() / 2);
	g.DrawString(szLabel, -1, inst->fntDefault, origin, &brush);
}

void TDPSettingsDlg::CustomDrawCancel(LPNMHDR item)
{
	LPNMCUSTOMDRAW d = (LPNMCUSTOMDRAW)item;

	RECT rc = d->rc;
	Graphics g(d->hdc);

	g.Clear(Color(255, 255, 255));
	Pen pen1(Color(89, 89, 89));
	Pen pen2(Color(17, 17, 17));
	Pen *pen;
	if (d->uItemState & CDIS_HOT) pen = &pen2;
	else pen = &pen1;
	pen->SetWidth(2);
	g.SetSmoothingMode(SmoothingModeAntiAlias);
	g.DrawLine(pen, Point{ 0, 0 }, Point{ rc.right - 1, rc.bottom - 1 });
	g.DrawLine(pen, Point{ 0, rc.bottom - 1 }, Point{ rc.right - 1, 0 });
}

void TDPSettingsDlg::CustomDrawCheckbox(LPNMHDR item)
{
	LPNMCUSTOMDRAW d = (LPNMCUSTOMDRAW)item;
	TDPSettingsDlg *inst = GetInstance();
	HWND hParent = GetParent(item->hwndFrom);
	Graphics g(d->hdc);

	if (IsDlgButtonChecked(hParent, item->idFrom))
		g.DrawImage(inst->iSwitch[1], 0, 0);
	else
		g.DrawImage(inst->iSwitch[0], 0, 0);

	WCHAR szLabel[100];
	SendMessage(item->hwndFrom, WM_GETTEXT, 100, (LPARAM)szLabel);
	g.SetTextRenderingHint(TextRenderingHintAntiAliasGridFit);
	g.DrawString(szLabel, -1, inst->fntDefault, { 30.0f, 0.0f }, inst->brCtrlText);

}

void TDPSettingsDlg::CustomDrawRadio(LPNMHDR item)
{
	LPNMCUSTOMDRAW d = (LPNMCUSTOMDRAW)item;
	TDPSettingsDlg *inst = GetInstance();
	HWND hParent = GetParent(item->hwndFrom);
	Graphics g(d->hdc);

	Pen *pen;
	SolidBrush *brush;
	if (d->uItemState & CDIS_HOT)
	{
		pen = new Pen(Color(59, 148, 217));
		brush = new SolidBrush(Color(59, 148, 217));
	}
	else
	{
		pen = new Pen(Color(51, 51, 51));
		brush = new SolidBrush(Color(51, 51, 51));
	}
	g.SetSmoothingMode(SmoothingModeAntiAlias);
	if (d->uItemState & CDIS_SELECTED)
	{
		SolidBrush bgBrush(Color(64, 59, 148, 217));
		g.FillEllipse(&bgBrush, Rect{ 0, 2, 13, 13 });
	}
	g.DrawEllipse(pen, Rect{ 0, 2, 13, 13 });
	if (IsDlgButtonChecked(hParent, item->idFrom))
		g.FillEllipse(brush, Rect{ 3, 5, 7, 7 });

	WCHAR szLabel[100];
	SendMessage(item->hwndFrom, WM_GETTEXT, 100, (LPARAM)szLabel);
	g.SetTextRenderingHint(TextRenderingHintAntiAliasGridFit);
	g.DrawString(szLabel, -1, inst->fntDefault, { 18.0f, 0.0f }, inst->brCtrlText);

	delete pen;
	delete brush;
}
}
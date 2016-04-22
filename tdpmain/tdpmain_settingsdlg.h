#ifndef TWEETDECKPLAYER_TDP_SETTINGSDLG_H_
#define TWEETDECKPLAYER_TDP_SETTINGSDLG_H_
#pragma once

#pragma warning(disable: 4458)

#include <algorithm>
namespace Gdiplus
{
	using std::min;
	using std::max;
}
#include <Windows.h>
#include <ObjIdl.h>
#include <gdiplus.h>

#pragma comment(lib, "Gdiplus.lib")

using namespace Gdiplus;

namespace tdpmain
{
class TDPSettingsDlg
{
private:
	static TDPSettingsDlg *instance;

	static GdiplusStartupInput gpsi;
	static ULONG_PTR gptok;

	static const LPCWSTR szBtnFaceNames[3][4];
	Image *iBtnFaces[3][4];
	SolidBrush *brFaces[3];
	Pen *penShadow;

private:
	TDPSettingsDlg();
	~TDPSettingsDlg();
	static BOOL CALLBACK DlgProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam);
	
public:
	static TDPSettingsDlg *GetInstance();
	static void FreeInstance();
	void ShowDialog(HWND hWnd);
};
}

#endif

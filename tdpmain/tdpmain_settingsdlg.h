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
	// Singleton
	static TDPSettingsDlg *instance;

	static GdiplusStartupInput gpsi;
	static ULONG_PTR gptok;

	// Resources for drawing controls
	static const LPCWSTR szBtnFaceNames[3][4];
	static const LPCWSTR szSwitchNames[2];
	Image *iBtnFaces[3][4];
	Image *iSwitch[2];
	SolidBrush *brFaces[3];
	SolidBrush *brCtrlText;
	Pen *penShadow;

private:
	TDPSettingsDlg();
	~TDPSettingsDlg();

	static BOOL CALLBACK DlgProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam);
	static LRESULT CALLBACK GrpProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam);
	static LRESULT CALLBACK TxtProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam);
	
public:
	static TDPSettingsDlg *GetInstance();
	static void FreeInstance();
	void ShowDialog(HWND hWnd);
};
}

#endif

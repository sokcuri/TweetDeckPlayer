#ifndef TWEETDECKPLAYER_TDP_SETTINGSDLG_H_
#define TWEETDECKPLAYER_TDP_SETTINGSDLG_H_
#pragma once

#include <Windows.h>

namespace tdpmain
{
class TDPSettingsDlg
{
private:
	TDPSettingsDlg();
	~TDPSettingsDlg();
	static BOOL CALLBACK DlgProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam);

public:
	static void ShowDialog(HWND hWnd);
};
}

#endif

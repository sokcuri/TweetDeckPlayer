// Copyright (c) 2016 Sokcuri. All rights reserved.

#ifndef TWEETDECKPLAYER_TDP_WINDOW_H_
#define TWEETDECKPLAYER_TDP_WINDOW_H_
#pragma once

#include <windows.h>
#include <commdlg.h>

#include "include/base/cef_scoped_ptr.h"

namespace tdpmain
{

class TDPWindow
{
public:
	TDPWindow();
	~TDPWindow();

	// Window style change method
	static void OnWndCreated(HWND hWnd, bool isMainWnd);
	static HWND GetMainWndHandle(){ return hMainWnd; };
private:
	static DWORD wndOldProc;
	static HWND hMainWnd;

	// Window procedure for the root window.
	static LRESULT CALLBACK PopupWndProc(HWND hWnd, UINT message, WPARAM wParam,
		LPARAM lParam);
};
}
#endif
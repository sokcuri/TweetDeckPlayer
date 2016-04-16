// Copyright (c) 2016 Sokcuri. All rights reserved.

#ifndef TWEETDECKPLAYER_UTIL_WIN_H_
#define TWEETDECKPLAYER_UTIL_WIN_H_
#pragma once

#include <windows.h>
#include <string>
#include <Shellapi.h>
#include <direct.h>
#include <shlobj.h>

#include "include/internal/cef_types_wrappers.h"

namespace tdpmain
{

	// Set the window's user data pointer.
	void SetUserDataPtr(HWND hWnd, void* ptr);

	// Return the window's user data pointer.
	template <typename T>
	T GetUserDataPtr(HWND hWnd) {
	  return reinterpret_cast<T>(GetWindowLongPtr(hWnd, GWLP_USERDATA));
	}

	// Set the window's window procedure pointer and return the old value.
	WNDPROC SetWndProcPtr(HWND hWnd, WNDPROC wndProc);

	// Return the resource string with the specified id.
	std::wstring GetResourceString(UINT id);

	int GetCefMouseModifiers(WPARAM wparam);
	int GetCefKeyboardModifiers(WPARAM wparam, LPARAM lparam);
	bool IsKeyDown(WPARAM wparam);

	// Return the Execute file folder.
	std::wstring GetExePath();

	// Return the data folder path.
	std::wstring GetDataPath();

	// Return the INI file path.
	std::wstring GetINIPath();

	// Read/Write INI
	std::wstring GetINI_String(std::wstring app, std::wstring key, std::wstring default);
	void SetINI_String(std::wstring app, std::wstring key, std::wstring string);
	int GetINI_Int(std::wstring app, std::wstring key, int default);
	void SetINI_Int(std::wstring app, std::wstring key, int value);

	// Save configuration to ini file.
	void SaveAppData(HWND hWnd);

	// Open URL in external browser
	void OpenURL(CefString url);

	// Get Download path (in Save as Dialog)
	std::string GetDownloadPath(const std::string& file_name);

	// if a tail contain b, return (a-b) string
	std::string PartialEraseStr(const std::string &a, const std::string &b);
}
#endif
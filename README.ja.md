# TweetDeck Player

http://github.com/sokcuri/TweetDeckPlayer

TweetDeck Playerは、[Electron](http://electron.atom.io/)をベースにしたTweetDeck専用ブラウザです。既存のウェブブラウザよりもっと軽く安定的に動作し、いろんな追加機能を加えてもっと便利に使用できます。また、ウェブブラウザと独立的にセッションを管理しているのでウェブブラウザとは別のアカウントでサインインできます。

ご使用中発生した不具合のご報告や質問はこちらへどうぞ。
https://github.com/sokcuri/TweetDeckPlayer/issues

# CREDIT

* Sokcuri - http://github.com/sokcuri
* Dalgona - http://github.com/dalgona
* Gaeulbyul - http://github.com/zn

# CHANGELOG

## バージョン 2.01a

誤った改行の処理による入力エリアのレイアウトが崩壊する不具合を修正しました。

## バージョン 2.01

- 不具合の修正
  - 設定ウィンドウを開いたままプログラムを終了するとエラーが発生する問題を修正しました。
  - 内蔵ブラウザでコンテクストメニューが無限に表示される問題を修正しました。
  - タッチデバイスで非常に重くなる問題を修正しました。
  - テキストの入力時、CPUの使用率が非常に高くなる問題を修正しました。
  - 起動時、断続的に発生するエラーを修正しました。
  - 絵文字「Y」を追加しました。
  - いいね（♥）アイコンを★に戻す機能が正常に動作しない問題を修正しました。
  - フォルダが存在しないと画像の自動保存機能が動作しない問題を修正しました。
  - ときどき画像の自動保存が動作しない問題を修正しました。
  - メッセージのtypoの修正しました。
- 機能の追加・改善
  - ハイライト機能の色のカスタマイズできるようにしました。
  - 名前の絵文字表示機能が改善され、再起動する必要がなくなりました。
  - キーボードで操作時アニメーションを消去する機能の追加しました。
  - コラムのサイズのカスタマイズ機能の追加しました。
  - 複数のフォントを設定できるようにしました。
  - 짤 자동저장 기능을 사용중일 때 키를 누르고 마음을 찍으면 짤 저장이 되지 않는 기능 추가 (MAC: alt, Win/Linux: ctrl) 

> 最新リリーズは[TweetDeck Playerのリリーズページ](https://github.com/sokcuri/TweetDeckPlayer/releases)からダウンロードできます。
> 更新履歴はChangeLog.mdファイルまたはTweetDeck Playerのリリーズページを参照してください。

# 要求スペック

- Window : 32/64bit
 - **Windows Vista以上が必要です** - ベースにしているElectron・ChromiumエンジンがWindows XPの対応を終了したため、Vista・７以上が必要です。
- Mac : 64bitのみ対応
- Linux : 32/64bit


# 追加機能一覧

- フォントの変更
- 正規表現(regex)によるフィルター機能
- ドラッグ&ドロップで画像の保存
- 画像をオリジナルサイズ(:orig)で保存
- 一部のツイートが表示されないバグを防ぐ
- unlink.isで始まるリンクを自動解析し元のリンクを表示
- いいね（♥）のアイコンを★に戻す
- リンク先を内蔵ブラウザで開く(shiftキーを押しながらリンクを選択すると外部ブラウザで開く)
- 簡単リツイート(shiftキーを押しながらリツイートするとリツイートウィンドウを表示する)
- Enter(return)キーで投稿
- 名前に絵文字を表示
- いいねと同時に画像の保存 (Macはoptionキー, Windows・LinuxはCtrlキーを押しながらふぁぼると保存しない）
- キーボード操作時のアニメーションの消去
- コラムのサイズのカスタマイズ

* unlink.isの解析・regexフィルター機能は設定の後アプリを再起動する必要があります。
* reload는 아무곳에 우클릭 후 reload 메뉴를 누르시거나 alt를 누르고 View의 Reload 메뉴를 눌러주세요.

# インストール
## リリーズページからダウンロード
[TweetDeck Playerのリリーズページ](https://github.com/sokcuri/TweetDeckPlayer/releases)からファイルをダウンロードします。
- MacOS :
 - `TweetDeckPlayer ... darwin-x64.zip`をダウンロードし解凍します。
 - `TweetDeckPlayer.app` で起動します。
- Windows :
 - `TweetDeckPlayer ... win32-ia32.zip`をダウンロードし解凍します。
 - `TweetDeckPlayer.exe` で起動します。
 - dataフォルダを除いて、フォルダ内のファイルを削除すると正常に動作しない恐れがあります。
 - 64ビットバージョンは win32-x64.zipをダウンロードしてください。
- Linux :
 - `TweetDeckPlayer ... linux-ia32.zip` または `... linux-x64.zip` をダウンロードし解凍します。
 - TweetDeckPlayerで起動します。

* app 파일이나 exe 파일의 이름을 바꾸셔도 됩니다.

## 直接インストール
TweetDeck PlayerのGitレポジトリをcloneして直接インストールできます。

**要求事項**
- Node 5.xx以上がインストールされている必要があります。
- gitがインストールされている必要があります。

**Gitレポジトリをcloneする**
```{r, engine='bash'}
$ git clone https://github.com/sokcuri/TweetDeckPlayer.git
```

**レポジトリに移動**
```{r, engine='bash'}
$ cd TweetDeckPlayer
```

**依存モジュールのインストール**
```{r, engine='bash'}
$ npm install
```

**TweetDeck Playerの起動**
```{r, engine='bash'}
$ npm start
```

**最新バージョンにアップデート**
```{r, engine='bash'}
$ git pull
$ npm install
```
- 이 방법으로 실행하면 아이콘이 트윗덱이 아닌 Electron 기본 아이콘으로 보일 수도 있습니다.

# 追加機能の使用方法
- **追加機能の設定**
 - altキーを押して、表示されるメニューからFile→Settingの順で選択します。
 - または、TweetDeckの設定アイコンを右クリックし、Settingを選択します。

- **dataフォルダ**
 - 트윗덱 플레이어는 각 폴더당 한개의 창을 띄울 수 있습니다. 여러 곳에 각각의 실행파일을 복사하고 실행하면 각각 다른 계정으로 로그인이 가능합니다.
 - Mac의 경우 app 파일이 위치한 폴더 안에 app 파일과 동일한 이름의 폴더가 생성되며, 생성된 폴더 안의 data 폴더에 데이터가 저장됩니다.
 - 윈도우의 경우 exe 파일이 위치한 폴더의 data 폴더 안에 데이터가 저장됩니다.


# 著作権・告知事項
"TweetDeck"は、Twitter, Incの商標です。
TweetDeck PlayerはTwitterとは全く関連がないサードパーティアプリケーションです。TweetDeck Playerの利用中発生した問題については、Twitterじゃなく、TweetDeck Playerの開発者にご報告してください。

# ライセンス
The MIT License (MIT)

Copyright (c) 2016 Sokcuri, Dalgona, Gaeulbyul and other contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## オープンソースライセンス
### [Electron](http://electron.atom.io/)
---
Copyright (c) 2014 GitHub Inc.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### [async](http://caolan.github.io/async/)
---
Copyright (c) 2010-2016 Caolan McMahon

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

### [detect-font](https://github.com/Wildhoney/DetectFont)
---
The MIT License (MIT)

Copyright (c) 2016 Adam Timberlake

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

### [request](https://github.com/request/request)
---
Apache License

Version 2.0, January 2004

http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.

"License" shall mean the terms and conditions for use, reproduction, and distribution as defined by Sections 1 through 9 of this document.

"Licensor" shall mean the copyright owner or entity authorized by the copyright owner that is granting the License.

"Legal Entity" shall mean the union of the acting entity and all other entities that control, are controlled by, or are under common control with that entity. For the purposes of this definition, "control" means (i) the power, direct or indirect, to cause the direction or management of such entity, whether by contract or otherwise, or (ii) ownership of fifty percent (50%) or more of the outstanding shares, or (iii) beneficial ownership of such entity.

"You" (or "Your") shall mean an individual or Legal Entity exercising permissions granted by this License.

"Source" form shall mean the preferred form for making modifications, including but not limited to software source code, documentation source, and configuration files.

"Object" form shall mean any form resulting from mechanical transformation or translation of a Source form, including but not limited to compiled object code, generated documentation, and conversions to other media types.

"Work" shall mean the work of authorship, whether in Source or Object form, made available under the License, as indicated by a copyright notice that is included in or attached to the work (an example is provided in the Appendix below).

"Derivative Works" shall mean any work, whether in Source or Object form, that is based on (or derived from) the Work and for which the editorial revisions, annotations, elaborations, or other modifications represent, as a whole, an original work of authorship. For the purposes of this License, Derivative Works shall not include works that remain separable from, or merely link (or bind by name) to the interfaces of, the Work and Derivative Works thereof.

"Contribution" shall mean any work of authorship, including the original version of the Work and any modifications or additions to that Work or Derivative Works thereof, that is intentionally submitted to Licensor for inclusion in the Work by the copyright owner or by an individual or Legal Entity authorized to submit on behalf of the copyright owner. For the purposes of this definition, "submitted" means any form of electronic, verbal, or written communication sent to the Licensor or its representatives, including but not limited to communication on electronic mailing lists, source code control systems, and issue tracking systems that are managed by, or on behalf of, the Licensor for the purpose of discussing and improving the Work, but excluding communication that is conspicuously marked or otherwise designated in writing by the copyright owner as "Not a Contribution."

"Contributor" shall mean Licensor and any individual or Legal Entity on behalf of whom a Contribution has been received by Licensor and subsequently incorporated within the Work.

2. Grant of Copyright License. Subject to the terms and conditions of this License, each Contributor hereby grants to You a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable copyright license to reproduce, prepare Derivative Works of, publicly display, publicly perform, sublicense, and distribute the Work and such Derivative Works in Source or Object form.

3. Grant of Patent License. Subject to the terms and conditions of this License, each Contributor hereby grants to You a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable (except as stated in this section) patent license to make, have made, use, offer to sell, sell, import, and otherwise transfer the Work, where such license applies only to those patent claims licensable by such Contributor that are necessarily infringed by their Contribution(s) alone or by combination of their Contribution(s) with the Work to which such Contribution(s) was submitted. If You institute patent litigation against any entity (including a cross-claim or counterclaim in a lawsuit) alleging that the Work or a Contribution incorporated within the Work constitutes direct or contributory patent infringement, then any patent licenses granted to You under this License for that Work shall terminate as of the date such litigation is filed.

4. Redistribution. You may reproduce and distribute copies of the Work or Derivative Works thereof in any medium, with or without modifications, and in Source or Object form, provided that You meet the following conditions:

You must give any other recipients of the Work or Derivative Works a copy of this License; and

You must cause any modified files to carry prominent notices stating that You changed the files; and

You must retain, in the Source form of any Derivative Works that You distribute, all copyright, patent, trademark, and attribution notices from the Source form of the Work, excluding those notices that do not pertain to any part of the Derivative Works; and

If the Work includes a "NOTICE" text file as part of its distribution, then any Derivative Works that You distribute must include a readable copy of the attribution notices contained within such NOTICE file, excluding those notices that do not pertain to any part of the Derivative Works, in at least one of the following places: within a NOTICE text file distributed as part of the Derivative Works; within the Source form or documentation, if provided along with the Derivative Works; or, within a display generated by the Derivative Works, if and wherever such third-party notices normally appear. The contents of the NOTICE file are for informational purposes only and do not modify the License. You may add Your own attribution notices within Derivative Works that You distribute, alongside or as an addendum to the NOTICE text from the Work, provided that such additional attribution notices cannot be construed as modifying the License. You may add Your own copyright statement to Your modifications and may provide additional or different license terms and conditions for use, reproduction, or distribution of Your modifications, or for any such Derivative Works as a whole, provided Your use, reproduction, and distribution of the Work otherwise complies with the conditions stated in this License.

5. Submission of Contributions. Unless You explicitly state otherwise, any Contribution intentionally submitted for inclusion in the Work by You to the Licensor shall be under the terms and conditions of this License, without any additional terms or conditions. Notwithstanding the above, nothing herein shall supersede or modify the terms of any separate license agreement you may have executed with Licensor regarding such Contributions.

6. Trademarks. This License does not grant permission to use the trade names, trademarks, service marks, or product names of the Licensor, except as required for reasonable and customary use in describing the origin of the Work and reproducing the content of the NOTICE file.

7. Disclaimer of Warranty. Unless required by applicable law or agreed to in writing, Licensor provides the Work (and each Contributor provides its Contributions) on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied, including, without limitation, any warranties or conditions of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A PARTICULAR PURPOSE. You are solely responsible for determining the appropriateness of using or redistributing the Work and assume any risks associated with Your exercise of permissions under this License.

8. Limitation of Liability. In no event and under no legal theory, whether in tort (including negligence), contract, or otherwise, unless required by applicable law (such as deliberate and grossly negligent acts) or agreed to in writing, shall any Contributor be liable to You for damages, including any direct, indirect, special, incidental, or consequential damages of any character arising as a result of this License or out of the use or inability to use the Work (including but not limited to damages for loss of goodwill, work stoppage, computer failure or malfunction, or any and all other commercial damages or losses), even if such Contributor has been advised of the possibility of such damages.

9. Accepting Warranty or Additional Liability. While redistributing the Work or Derivative Works thereof, You may choose to offer, and charge a fee for, acceptance of support, warranty, indemnity, or other liability obligations and/or rights consistent with this License. However, in accepting such obligations, You may act only on Your own behalf and on Your sole responsibility, not on behalf of any other Contributor, and only if You agree to indemnify, defend, and hold each Contributor harmless for any liability incurred by, or claims asserted against, such Contributor by reason of your accepting any such warranty or additional liability.

END OF TERMS AND CONDITIONS

### [twemoji](https://github.com/twitter/twemoji)
---
Copyright (c) 2014 Twitter, Inc and other contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

### [twitter-text](https://github.com/twitter/twitter-text)
---
Copyright and License

Copyright 2014 Twitter, Inc and other contributors

Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0

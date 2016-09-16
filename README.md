# 트윗덱 플레이어 2.00
http://github.com/sokcuri/TweetDeckPlayer

트윗덱 플레이어는 [Electron](http://electron.atom.io/) 하에서 구동되는 데스크톱 웹앱입니다. 기존 트윗덱 앱과 다르게 동영상과 움짤 재생 기능을 지원하고 있으며, 웹 브라우저로 트윗덱을 이용하는 사용하는 것보다 더 빠르고 안정적이고 여러가지 편의기능을 추가해 트윗덱을 더 편하게 쓸 수 있습니다. 또한 웹 브라우저와 독립적인 세션을 유지하기 때문에 각각 다른 아이디로 트윗덱을 로그인할 수 있습니다.

CREDIT
--------
* Sokcuri (소쿠릿) - http://github.com/sokcuri
* Dalgona (달고나) - http://github.com/dalgona
* Gaeulbyul (가을별) - http://github.com/zn

트윗덱 플레이어 2.00
-----------------------------
- 설정 윈도우 설명 수정
- 팝업 윈도우를 닫을 때 간혈적으로 오류가 발생하는 문제 수정
- 마음을 찍으면 자동으로 저장하는 기능이 여러 이미지를 제대로 받아오지 못하던 문제 수정
- 클릭 뿐만 아니라 단축키로도 마음을 찍으면 자동 저장 기능이 동작하도록 개선

> 최신 릴리즈는 [트윗덱 플레이어 릴리즈 페이지](https://github.com/sokcuri/TweetDeckPlayer/releases)에서 다운로드할 수 있습니다.

최소 사양
--------
**윈도우 비스타 이상** - 크로미움 및 Electron의 윈도우 XP 지원 종료로 인해 비스타, 윈도우 7 이상에서만 실행이 가능합니다.

추가 기능
----------
- 폰트 변경
- 정규식 트윗 필터
- 이미지를 끌어서 바탕화면에 저장하기
- 이미지를 원본(orig) 사이즈로 다운받기
- 트윗 씹힘 방지
- unlink.is 주소 자동 변환
- 마음(하트) 대신 관심글(별)로 바꾸기
- 내부 브라우저로 페이지 띄우기 (shift 키를 누르고 링크를 클릭하면 외부 브라우저로 띄움)
- 빠른 리트윗 (shift 키를 누르고 클릭하면 이전처럼 리트윗 박스가 뜸)
- 엔터 키로 트윗하기
- 이름에 이모지 적용
- 마음을 찍으면 바로 저장하기
- 트윗 작성시 컬러 하이라이트

* 이름에 이모지 적용, unlink.is, 정규식 트윗 필터 기능은 새로고침 (reload)를 해야 적용됩니다. 
* reload는 아무곳에 우클릭 후 reload 메뉴를 누르시거나 alt를 누르고 View의 Reload 메뉴를 눌러주세요.

패키지를 이용한 설치
------------------
트윗덱 플레이어 릴리즈 페이지에서 운영체제 버전에 맞는 파일을 다운받아 주세요.
- MacOS :
 - TweetDeckPlayer ... darwin-x64.zip 파일을 다운받고 압축을 풉니다.
 - TweetDeckPlayer.app 파일을 적당한 곳에 위치시킨 후 실행해 주세요. (다른 파일은 실행에 필요하지 않습니다)
- Windows :
 - TweetDeckPlayer ... win32-ia32.zip 파일을 다운받고 적당한 곳에 압축을 풉니다.
 - TweetDeckPlayer.exe 파일을 실행해 주세요.
 - data 폴더를 제외하고 같은 폴더 안에 있는 다른 파일을 삭제하시면 정상 작동하지 않습니다.
 - 64비트 버전을 다운받으려면 win32-x64.zip 파일을 다운받으시면 됩니다.
- Linux :
 - TweetDeckPlayer ... linux-ia32.zip 또는 linux-x64.zip 파일을 다운받고 적당한 곳에 압축을 풉니다.
 - TweetDeckPlayer 파일을 실행해 주세요. 

* app 파일이나 exe 파일의 이름을 바꾸셔도 됩니다.

직접 설치하기
------------
트윗덱 플레이어의 Git 저장소를 복사해 직접 PC에 설치하고 사용할 수 있습니다.

**요구사항**
- Node 5.xx 이상 버전이 설치되어 있어야 합니다.
- git이 설치되어 있어야 합니다.
- 아래 명령어를 트윗덱 플레이어 리포지토리를 저장할 장소에서 입력하세요.

**Git 저장소를 로컬로 복사해오기**
```{r, engine='bash'}
$ git clone https://github.com/sokcuri/TweetDeckPlayer.git
```

**디펜던시 및 모듈 설치**
```{r, engine='bash'}
$ npm install
```

**실행하기**
```{r, engine='bash'}
$ npm start
```

**최신 버전으로 업데이트하기**
```{r, engine='bash'}
$ git pull
$ npm install
```
- 이 방법으로 실행하면 아이콘이 트윗덱이 아닌 Electron 기본 아이콘으로 보일 수도 있습니다.

사용법
------
- **설정창 여는 법**
 - 트윗덱 플레이어 화면에서 alt를 누르고 File의 Setting 메뉴로 들어가세요.
 - 트윗덱 설정 아이콘에 마우스를 대고 우클릭한 후 Setting 메뉴를 클릭하세요.

- **데이터 폴더**
 - 트윗덱 플레이어는 각 폴더당 한개의 창을 띄울 수 있습니다. 여러 곳에 각각의 실행파일을 복사하고 실행하면 각각 다른 계정으로 로그인이 가능합니다.
 - Mac의 경우 app 파일이 위치한 폴더 안에 app 파일과 동일한 이름의 폴더가 생성되며, 생성된 폴더 안의 data 폴더에 데이터가 저장됩니다.
 - 윈도우의 경우 exe 파일이 위치한 폴더의 data 폴더 안에 데이터가 저장됩니다.

저작권 및 고지 사항
-----------------
"TweetDeck"은 Twitter, Inc의 상표입니다. TweetDeck Player는 Twitter와 관련이 없는 써드파티 어플리케이션입니다. 트윗덱 플레이어 사용 중 이슈가 발생하면 트위터가 아닌 트윗덱 플레이어 페이지에 알려주시기 바랍니다.

라이선스
--------
The MIT License (MIT)

Copyright (c) 2016 Sokcuri, Dalgona, Gaeulbyul and other contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## 오픈소스 라이브러리
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
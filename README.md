##TweetDeck Player
트윗덱 플레이어는 트윗덱 윈도우 앱의 종료로 만들게 된 프로그램입니다. 구조상으로는 [CEF](https://bitbucket.org/chromiumembedded/cef "Chromium Embedded Framework")를 통해 트윗덱을 불러오는 웹앱의 형태를 취합니다만, 가볍고 안정적이면서 기존 앱과 다르게 동영상, 움짤 재생 지원을 하고 있습니다. 최종 목표는 쾌적한 트잉트잉입니다. 많은 분들의 기여 또는 이슈, 버그 리포트를 받고 있으니 많이 참여해 주세요.

[최신 릴리즈 다운로드는 여기에서 가능합니다](http://github.com/sokcuri/TweetDeckPlayer/releases)

####최소 사양
* 최소 사양은 윈도우 XP 이상입니다.
* 윈도우 외 타 플랫폼은 지원하지 않고 있습니다.

####라이선스
* GPLv2(GNU General Public License version 2) 라이선스를 따릅니다
* 개별 라이브러리 라이선스 정보는 ROOT 폴더의 라이선스 또는 릴리즈 압축 파일의 LICENSE 폴더를 참고하세요.

####빌드하는 법
* TweetDeck Player를 빌드하기 위해서는 CMake와 Visual Studio가 필요합니다.
* 윈도우 XP 지원을 위해서는 컴파일러 집합 옵션(-T)을 xp 버전으로 주시면 됩니다. (예. v14_xp)
* 디버그 모드 또는 타 플랫폼의 빌드는 지원하지 않고 있습니다. 실행과 마찬가지로 윈도우 계열만 지원됩니다.
* 

####개발 버전
CEF가 아닌 electron 기반의 트윗덱 플레이어를 새롭게 만들고 있습니다. electron 버전으로 구현된 트윗덱 플레이어는 아직 공개 패키징이나 바이너리가 없지만, git clone 등의 명령어를 통해 사용해 볼 수 있습니다. Node v6 이상의 버전이 필요합니다.

##### Install
```
$ npm install
```
##### Run
```
$ npm start
```

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

**폴더 이동**
```{r, engine='bash'}
$ cd TweetDeckPlayer
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

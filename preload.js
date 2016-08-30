const {remote, clipboard, ipcRenderer} = require('electron');
const {Menu, MenuItem, dialog} = remote;

const ses = remote.session.fromPartition('persist:main');
const Util = require('./util');

const Config = require('./config');
const VERSION = require('./version');

const PlayerMonkey = require('./preload_scripts/playermonkey');
const WordFilter = require('./preload_scripts/wordfilter');
const Unlinkis = require('./preload_scripts/unlinkis');
const CBPaste = require('./preload_scripts/clipboard-paste');
const TwtLib = require('./preload_scripts/twtlib');

// 로딩 프로그레스 바 모듈 로드
require('./pace.min.js');

const config = Config.load();

// 디버그 관련 함수들을 모아놓는 오브젝트
const _Debug = {
  // 메모리 정보를 콘솔에 출력
  showMemoryInfo () {
    var i = process.getProcessMemoryInfo();
    console.log(`W: ${i.workingSetSize} PW: ${i.peakWorkingSetSize} PB: ${i.privateBytes} SB: ${i.sharedBytes}`);

    ses.getCacheSize(size => console.log(`cache size: ${size}`));
    if (_Debug.showMemoryInfo.repeat) {
      setTimeout(_Debug.showMemoryInfo, _Debug.showMemoryInfo.tick);
    }
  },
};
// 일정 시간마다 반복해서 출력하고 싶은 경우
_Debug.showMemoryInfo.repeat = true;
_Debug.showMemoryInfo.tick = 5000;

// 우클릭시 임시 저장하는 이미지 주소와 링크 주소를 담는 변수
var Addr = {
  img: '',
  link: '',
};

// 포인터 이벤트
ipcRenderer.on('pointer-events', (event, opt) => {
  document.body.style = `pointer-events: ${opt};`;
});

// 메인 스레드에서 렌더러로 요청하는 커맨드
ipcRenderer.on('command', (event, cmd) => {
  var href;
  switch (cmd) {
    case 'cut':
      document.execCommand('cut');
      break;
    case 'copy':
      document.execCommand('copy');
      break;
    case 'paste':
      document.execCommand('paste');
      break;
    case 'delete':
      document.execCommand('delete');
      break;
    case 'selectall':
      document.execCommand('selectall');
      break;
    case 'copyimage':
      href = Util.getOrigPath(Addr.img);
      clipboard.writeText(href);
      break;
    case 'openimage':
      href = Util.getOrigPath(Addr.img);
      window.open(href);
      break;
    case 'googleimage':
      href = 'https://www.google.com/searchbyimage?image_url=' +
                encodeURI(Util.getOrigPath(Addr.img));
      window.open(href);
      break;
    case 'openlink':
      href = Util.getOrigPath(Addr.link);
      window.open(href);
      break;
    case 'copylink':
      href = Util.getOrigPath(Addr.link);
      clipboard.writeText(href);
      break;
    case 'reload':
      document.location.reload();
      break;
  }
});

// 컨텍스트 메뉴 이벤트 리스너
window.addEventListener('contextmenu', e => {
  var target;

  // 기존 메뉴 이벤트를 무시
  e.preventDefault();

  // 현재 활성화된 element
  var el = document.activeElement;

  // 현재 마우스가 가리키고 있는 elements
  var hover = document.querySelectorAll(':hover');

  // 선택 영역이 있는지 여부
  var is_range = document.getSelection().type === 'Range';

  // input=text 또는 textarea를 가리킴
  if (el
    && (el.tagName.toLowerCase() === 'input' && el.type === 'text')
    || (el.tagName.toLowerCase() === 'textarea')) {
    target = (is_range ? 'text_sel' : 'text');
  } else if (document.querySelector('.js-app-settings:hover')) {
    // 설정 버튼
    target = 'setting';
  } else if (document.querySelector('img:hover')) {
    // 이미지
    Addr.img = document.querySelector('img:hover').src;

    // 링크가 포함되어 있는 경우
    if (document.querySelector('a:hover')) {
      Addr.link = document.querySelector('a:hover').href;
      target = 'linkandimage';
    } else {
      target = 'image';
    }
  } else if (document.querySelector('.js-media-image-link:hover')) {
    // 미디어 이미지 박스 (트윗 내의 이미지 박스)
    Addr.img = document.querySelector('.js-media-image-link:hover').style.backgroundImage.slice(5, -2);
    target = 'image';
  } else if (document.querySelector('a:hover') && document.querySelector('a:hover').href) {
    // 링크
    Addr.link = document.querySelector('a:hover').href;
    target = 'link';
  } else {
    // 기본 컨텍스트
    target = 'main';
  }

    // 컨텍스트 메뉴를 띄우라고 메인 스레드에 요청
  ipcRenderer.send('context-menu', target, is_range, Addr);
}, false);

document.addEventListener('DOMContentLoaded', WordFilter);
document.addEventListener('DOMContentLoaded', CBPaste);
document.addEventListener('DOMContentLoaded', TwtLib);

if (config.enableUnlinkis) {
  document.addEventListener('DOMContentLoaded', Unlinkis);
}

document.addEventListener('DOMContentLoaded', () => {
  function patchContentEditable () {
    $('[contenteditable="true"]').css({
      opacity: 0,
      pointerEvents: 'none',
    });
  }
  if (window.TD_mustaches) {
    window.TD_mustaches['version.mustache'] = `${VERSION} (TweetDeck {{version}}{{#buildIDShort}}-{{buildIDShort}}{{/buildIDShort}})`;
  }

  if (document.title === 'TweetDeck') {
    document.title = 'TweetDeck Player';
  } else {
    document.title = `TweetDeck Player - ${document.title}`;
  }

  // 맥용 한글 기본 입력기 이슈 해결
  $(document).on('keydown', e => {
    if (document.activeElement === document.body && e.key >= 'ㄱ' && e.key <= 'ㅣ') {
      e.preventDefault();
      e.stopPropagation();
      $(document.activeElement).trigger(jQuery.Event('keypress', {which: e.which}))
    }
  });

  $(document).on('mouseover', '.tweet-timestamp', e => {
    const target = e.currentTarget;
    const time = target.getAttribute('data-time');
    const date = new Date(parseInt(time, 10));
    target.setAttribute('title', date.toLocaleString());
  });

  var TDP = {};
  TDP.onPageLoad = () => {
    setTimeout(() => {
      if (!TD || !TD.ready) {
        TDP.onPageLoad();
      } else {
        TD.controller.progressIndicator.addMessage(TD.i(VERSION));
        setTimeout(() => {
          TD.settings.setUseStream(TD.settings.getUseStream());
          patchContentEditable();
        }, 3000);
        if (Pace) {
          setTimeout(() => {
            PlayerMonkey.GM_addStyle('.pace-progress { display: none }');
          }, 2000);
        }
        if (config.useStarForFavorite) {
          const cl = document.body.classList;
          cl.remove('hearty');
          cl.add('starry');
        }
      }
    }, 1000);
  };

  TDP.onPageLoad();
});

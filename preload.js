const {remote, clipboard, ipcRenderer} = require('electron');
const {Menu, MenuItem, dialog} = remote;

const ses = remote.session.fromPartition('persist:main');
const Util = require('./util');
const Config = require('./config');

// 로딩 프로그레스 바 모듈 로드 
require('./pace.min.js');

//
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
// 일정 시간마다 반복해서 출력라고 싶은 경우
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

document.addEventListener('DOMContentLoaded', () => {
  const config = Config.load();
  if (!config.enableWordFilter) return;
  let words = config.filterWords.split('\n');
  words = words.map(word => {
    // /로 감싼 단어는 정규식으로 변환한다.
    let match = word.match(/^\/(.+)\/$/);
    if (match) {
      // global flag 붙이지 말것
      // see: http://stackoverflow.com/a/2630538
      return new RegExp(match[1], 'i');
    } else {
      return word;
    }
  });
  let myID;
  // maskTweet - 트윗의 내용을 가린다.
  // 단, 클릭시에는 원래 트윗을 보여준다.
  function maskTweet (tweet) {
    const userID = tweet.querySelector('.username').textContent;
    const name = tweet.querySelector('.fullname').textContent;
    const text = tweet.querySelector('.js-tweet-text').textContent;
    let rt_by = '';
    let nbfc = tweet.querySelector('.nbfc');
    if (nbfc) {
      let nbfc_txt = nbfc.textContent.trim();
      if (/retweet/i.test(nbfc_txt)) {
        let by = nbfc.querySelector('a[rel="user"]');
        rt_by = by.pathname.replace('/', '');
      }
    }
    if (rt_by) {
      rt_by = `(RT from @${rt_by})`;
    }
    const hoverText = `${name}(${userID})님의 트윗: ${rt_by}\n${text}`;
    const maskMessage = document.createElement('div');
    maskMessage.classList.add('masked-tweet');
    maskMessage.setAttribute('title', hoverText);
    maskMessage.textContent = 'Filtered!';
    const originalHTML = tweet.innerHTML;
    function revealOriginal (event) {
      event.stopImmediatePropagation();
      tweet.innerHTML = originalHTML;
      tweet.removeEventListener('click', revealOriginal);
      // GIF 움짤이 있다면 이를 재생시킨다.
      let gif = tweet.querySelector('video.js-media-gif');
      if (gif && gif.paused) {
        gif.play();
      }
    }
    tweet.innerHTML = '';
    tweet.appendChild(maskMessage);
    tweet.addEventListener('click', revealOriginal);
  }
  // hideTweet - 말 그대로 트윗을 아예 안 보이도록 숨김.
  function hideTweet (tweet) {
    tweet.style.display = 'none';
  }
  // "Completely hide tweet" 옵션에 따라 결정한다.
  const action = config.hideFilteredTweet ? hideTweet : maskTweet;
  function filterTweet (tweet) {
    if (!myID) {
      myID = document.querySelector('.js-account-summary .username');
      myID = myID.textContent.trim();
    }
    let userID = tweet.querySelector('.username').textContent;
    if (userID === myID) return;
    let text = tweet.querySelector('.js-tweet-text');
    if (!text) return;
    text = text.textContent.toLowerCase();
    for (let word of words) {
      if (typeof word === 'string' && text.indexOf(word) > -1) {
        action(tweet);
        return;
      }
      if (word instanceof RegExp && word.test(text)) {
        action(tweet);
        return;
      }
    }
  }
  const wordFilterObserver = new MutationObserver(mutations => {
    for (let mut of mutations) {
      let added = mut.addedNodes;
      for (let node of added) {
        if (!node.matches) continue;
        if (!node.matches('article.stream-item')) continue;
        // DM은 필터링하지 않는다. .tweet-message 요소가 있으면 DM으로 간주
        if (node.querySelector('.tweet-message')) continue;
        // 디테일 (트윗 클릭시 나오는 조금 큰 트윗)에선 필터링하지 않는다.
        if (node.matches('.js-tweet-detail article')) continue;
        filterTweet(node);
      }
    }
  });
  wordFilterObserver.observe(document.body, {
    attributes: true,
    childList: true,
    characterData: true,
    subtree: true,
  });
});

const {shell, remote, clipboard, ipcRenderer} = require('electron');
// Guard against missing remote function properties
// https://github.com/electron/electron/pull/7209
try {
  const {Menu, MenuItem, dialog} = remote;
} catch (e) {
  console.warn('remote error : ' + e);
};
const fs = require('fs');
const Util = require('./util');

// 설정 파일 읽기
const config = require('./config').load();
const VERSION = require('./version');
const Unlinkis = require('./preload_scripts/unlinkis');

// 로딩 프로그레스 바 모듈 로드
require('./pace.min.js');

// 우클릭시 임시 저장하는 이미지 주소와 링크 주소를 담는 변수
const Addr = {
  img: '',
  link: '',
};

// 포인터 이벤트
ipcRenderer.on('no-pointer', (event, opt) => {
  if (opt && !document.body.classList.contain('no-pointer')) {
    document.body.classList.add('no-pointer');
  } else if (!opt && document.body.classList.contain('no-pointer')) {
    document.body.classList.remove('no-pointer');
  }
});

// 메인 스레드에서 렌더러로 요청하는 커맨드
ipcRenderer.on('command', (event, cmd) => {
  let href;
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
      window.toastMessage('Image downloading..');
      const nativeImage = require('electron').nativeImage;
      var request = require('request').defaults({ encoding: null });
      request.get(Addr.img, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          clipboard.writeImage(nativeImage.createFromBuffer(body));
          window.toastMessage('Image copied to clipboard');
        }
      });
      break;
    case 'copyimageurl':
      href = Util.getOrigPath(Addr.img);
      clipboard.writeText(href);
      break;
    case 'openimage':
      href = Util.getOrigPath(Addr.img);
      window.open(href);
      break;
    case 'openimagepopup':
      href = Util.getOrigPath(Addr.img);
      window.open(href, 'popup');
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
    case 'back':
      window.history.back();
      break;
    case 'forward':
      window.history.forward();
      break;
    case 'copypageurl':
      if (window.location.href) clipboard.writeText(window.location.href);
      break;
    case 'openpageexternal':
      shell.openExternal(window.location.href);
      window.close();
      break;
  }
});

// 컨텍스트 메뉴 이벤트 리스너
window.addEventListener('contextmenu', e => {
  let target;

  // 기존 메뉴 이벤트를 무시
  e.preventDefault();

  // 현재 활성화된 element
  const el = document.activeElement;

  // 선택 영역이 있는지 여부
  const is_range = document.getSelection().type === 'Range';

  // input=text 또는 textarea를 가리킴
  if (el
    && (el.tagName.toLowerCase() === 'input' && el.type === 'text')
    || (el.tagName.toLowerCase() === 'textarea')) {
    target = (is_range ? 'text_sel' : 'text');
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
  } else if (document.querySelector('a:hover') && document.querySelector('a:hover').href) {
    // 링크
    Addr.link = document.querySelector('a:hover').href;
    target = 'link';
  } else {
    // 기본 컨텍스트
    target = 'main';
  }

  // 컨텍스트 메뉴를 띄우라고 메인 스레드에 요청
  ipcRenderer.send('context-menu', target, is_range, Addr, true);
}, false);

if (config.enableUnlinkis) {
  document.addEventListener('DOMContentLoaded', Unlinkis);
}

// 트윗에 첨부된 이미지를 드래그해서 저장할 수 있도록 함
document.addEventListener('dragstart', evt => {
  var imageSrc = '';
  var imageOrgSrc = '';
  if (evt.srcElement.classList.contains('js-media-image-link')) {
    // 트윗 미디어 이미지
    imageSrc = evt.srcElement.style.backgroundImage.slice(5, -2);
  } else if (typeof evt.srcElement.currentSrc !== 'undefined' && evt.srcElement.currentSrc !== '') {
    // 일반 이미지
    imageSrc = evt.srcElement.currentSrc;
  }

  // 이미지인 경우
  if (imageSrc) {
    const image = Util.getOrigPath(imageSrc);
    let ext = image.substr(image.lastIndexOf('.') + 1);
    let filename = image.substr(image.lastIndexOf('/') + 1);
    if (filename.lastIndexOf(':') !== -1) {
      ext = ext.substr(0, ext.lastIndexOf(':'));
      filename = filename.substr(0, filename.lastIndexOf(':'));
    }
    const detail = `image/${ext}:${filename}:${image}`;
    evt.dataTransfer.setData('DownloadURL', detail);
    console.log(detail);
  }

}, false);

document.addEventListener('DOMContentLoaded', () => {
  // 맥용 한글 기본 입력기 이슈 해결
  window.$(document).on('keydown', e => {
    if (document.activeElement === document.body && e.key >= 'ㄱ' && e.key <= 'ㅣ') {
      e.preventDefault();
      e.stopPropagation();
      window.$(document.activeElement).trigger(window.$.Event('keypress', {which: e.which}));
    }
  });
});

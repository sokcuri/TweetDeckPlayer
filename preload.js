const {remote, clipboard, ipcRenderer} = require('electron');
const {Menu, MenuItem, dialog} = remote;
const twitter = require('twitter-text');

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

// 설정 파일 읽기
var config = Config.load();

ipcRenderer.on('apply-config', event => {
  var { detectFont, supportedFonts } = require('detect-font');
  config = Config.load();

  if (Config.data.customFonts) {
    var node = document.createElement('div');
    node.id = 'fontDetect';
    node.style = `font-family: ${config.customFonts} !important`;
    document.body.insertBefore(node, document.body.firstChild);

    var df = detectFont(node);
    document.getElementById('fontDetect').remove();
    if (df !== config.customFonts) {
      console.warn(`Not Supported Font : ${config.customFonts}`);
      document.body.style = '';
    }
    else
    {
      document.body.style = `font-family: ${config.customFonts} !important`;
    }
  } else {
    document.body.style = '';
  }

  const cl = document.body.classList;
  if (config.useStarForFavorite) {
    cl.remove('hearty');
    cl.add('starry');
  } else {
    cl.remove('starry');
    cl.add('hearty');
  }
});

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

// 트윗에 첨부된 이미지를 드래그해서 저장할 수 있도록 함
document.addEventListener('dragstart', (evt) => {
  var imageSrc = "";
  var imageOrgSrc = "";
  // 트윗 미디어 이미지
  if (evt.srcElement.classList.contains('js-media-image-link'))
    imageSrc = evt.srcElement.style.backgroundImage.slice(5, -2);
  // 일반 이미지
  else if (typeof evt.srcElement.currentSrc != 'undefined' && evt.srcElement.currentSrc != '')
    imageSrc = evt.srcElement.currentSrc;

  // 이미지인 경우
  if (imageSrc)
  {
    imageOrgSrc = imageSrc;
    var image = Util.getOrigPath(imageSrc);
    var ext = image.substr(image.lastIndexOf('.')+1);
    var filename = image.substr(image.lastIndexOf('/')+1);
    if (filename.lastIndexOf(':') != -1) {
      ext = ext.substr(0, ext.lastIndexOf(':'));
      filename = filename.substr(0, filename.lastIndexOf(':'));
    }
    var detail = `image/${ext}:${filename}:${image}`;
    evt.dataTransfer.setData("DownloadURL", detail);
  }

}, false);

document.addEventListener('DOMContentLoaded', () => {
  function patchContentEditable () {
    $('[contenteditable="true"]').css({
      opacity: 0,
      pointerEvents: 'none',
    });
  }
  if (window.TD_mustaches) {
    // version
    window.TD_mustaches['version.mustache'] = `${VERSION} (TweetDeck {{version}}{{#buildIDShort}}-{{buildIDShort}}{{/buildIDShort}})`;

    // set min_width to modal context
    window.TD_mustaches['modal/modal_context.mustache'] = window.TD_mustaches['modal/modal_context.mustache'].replace('<div class="js-modal-context', '<div style="min-width: 560px;" class="js-modal-context');
    window.TD_mustaches['app_container.mustache'] = window.TD_mustaches['app_container.mustache'].replace('<div id="open-modal', '<div style="min-width: 650px;" id="open-modal');

    // mention/url highlight
    window.TD_mustaches['compose/compose_inline_reply.mustache'] = window.TD_mustaches['compose/compose_inline_reply.mustache'].replace('<textarea class="js-compose-text', '<div class="backdrop scroll-v scroll-styled-v scroll-styled-h scroll-alt"><div class="highlights"></div></div><textarea class="js-compose-text');
    window.TD_mustaches['compose/docked_compose.mustache'] = window.TD_mustaches['compose/docked_compose.mustache'].replace('<textarea class="js-compose-text', '<div class="backdrop scroll-v scroll-styled-v scroll-styled-h scroll-alt"><div class="highlights"></div></div><textarea class="js-compose-text'); 
  }

  function applyHighlights(text) {
    text = text
      .replace(/\n$/g, '\n\n')
      .replace(/♥/gi, '<span class="mark_heart">$&</span>');

    var entities = twitter.extractEntitiesWithIndices(text);
    var part;
    var html_text = "";
    var prev_pos = 0;
    var start, end;
    for (var i = 0; i < entities.length; i++)
    {
      start = entities[i].indices[0];
      end = entities[i].indices[1] - start;
      padd = 0;

      if (typeof entities[i].screenName != 'undefined' && entities[i].screenName.length > 2)
        part = text.substr(start, end).replace('@' + entities[i].screenName, '<span class="mark_mention">$&</span>');
      else if (typeof entities[i].hashtag != 'undefined')
        part = text.substr(start, end).replace('#' + entities[i].hashtag, '<span class="mark_hashtag">$&</span>');
      else if (typeof entities[i].url != 'undefined')
        part = text.substr(start, end).replace(entities[i].url, '<span class="mark_url">$&</span>');
      else
        part = text.substr(start, end);

      html_text += text.substr(prev_pos, start - prev_pos);
      html_text += part;
      prev_pos = end + start;
    }
    html_text += text.substr(prev_pos);
    return html_text;
  }

  var prev_focus;
  // mention/url highlight
  function handleChange(evt)
  {
    if (evt.target.id == "account-safeguard-checkbox" || evt.target.id == "inline-account-safeguard-checkbox")
    {
      var el = $('.js-compose-text');
      for (var i = 0; i < el.length; i++)
      {
        var text = $(el[i]).val();

        // 인라인 height 반영
        if ($(el[i]).parent().children('div')[0].style != el[i].style.cssText)
          $(el[i]).parent().children('div')[0].style = el[i].style.cssText;
        
        // html 하이라이트 반영
        $(el[i]).parent().children('div').children('div').html(applyHighlights(text));

        // placeholder
        if (text == "")
          $(el[i]).parent().children('div').children('div').html('<span class="placeholder">' + el[i].placeholder + '</span>');

        // 마지막 멘션 아이디가 셀렉션 지정되는 버그 회피
        var x = el[i];
        
        if (typeof x.dataset.initcompl == 'undefined')
        {
          x.dataset.initcompl = true;
          $(x).on({'scroll': handleScroll});
        }
        if (prev_focus != document.querySelector(':focus'))
        {
          setTimeout(() => {
            var v = $(x).val();
            if (window.getSelection().toString().length > 3)
              $(x).focus().val("").val(v);
          }, 100);
        }
      }
    }
    prev_focus = document.querySelector(':focus');
  }


  function handleInput(evt)
  {
    if (evt.target.classList.contains('js-compose-text'))
    {
      // html 하이라이트 반영
      var text = $(evt.target).val();
      $(evt.target).parent().children('div').children('div').html(applyHighlights(text));

      // placeholder
      if (text == "")
        $(evt.target).parent().children('div').children('div').html('<span class="placeholder">' + $(evt.target)[0].placeholder + '</span>');

    }
  }

  function handleScroll(evt)
  {
    if (evt.target.classList.contains('js-compose-text'))
    {
      var scrollTop = evt.target.scrollTop;
      $(evt.target).parent().children('div').scrollTop(scrollTop);
    
      var scrollLeft = evt.target.scrollLeft;
      $(evt.target).parent().children('div').scrollLeft(scrollLeft);
    }
  }
  $(document).on({'input': handleInput, 'change': handleChange});

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
      $(document.activeElement).trigger(jQuery.Event('keypress', {which: e.which}));
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

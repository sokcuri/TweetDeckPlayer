const {remote, clipboard, ipcRenderer, shell} = require('electron');
// Guard against missing remote function properties
// https://github.com/electron/electron/pull/7209
try
{
  const {Menu, MenuItem, dialog} = remote;
} catch(e) {
  console.warn('remote error : ' + e)
};
const fs = require('fs');
const twitter = require('twitter-text');
const twemoji = require('twemoji');

const Config = require('./config');
const VERSION = require('./version');
const Util = require('./util');

const PlayerMonkey = require('./preload_scripts/playermonkey');
const WordFilter = require('./preload_scripts/wordfilter');
const Unlinkis = require('./preload_scripts/unlinkis');
const CBPaste = require('./preload_scripts/clipboard-paste');
const TwtLib = require('./preload_scripts/twtlib');
const AutoSaveFav = require('./preload_scripts/autosave-favorites');
const EmojiPad = require('./preload_scripts/emojipad');
const EmojiName = require('./preload_scripts/emojiname');

// 퍼포먼스 문제로 비활성화
// 로딩 프로그레스 바 모듈 로드
//require('./pace.min.js');

// 설정 파일 읽기
var config = Config.load();

var keyState = {
  shift: false,
  alt: false,
  ctrl: false
}

ipcRenderer.on('apply-config', event => {
  var style = "";
  try
  {
    var { detectFont, supportedFonts } = require('detect-font');
    config = Config.load();
    window.config = config;

    if (Config.data.customFonts) {
      var node = document.createElement('div');
      var fonts = config.customFonts.split(',').map(x => x.trim()).filter(x => x != '').map(x => `'${x}'`);
      node.id = 'fontDetect';
      node.style = `font-family: ${fonts.join(',')} !important`;
      document.body.insertBefore(node, document.body.firstChild);

      var sf = supportedFonts(node).map(x => `'${x.replace('"', '').trim()}'`);
      var notSupported = (() => {
        var tmpSet = new Set(sf);
        return fonts.filter(x => !tmpSet.has(x));
      })();

      if (notSupported.length != 0)
        console.warn(`Not Supported Font(s): ${notSupported.join(', ')}`);
      style = `font-family: ${sf.join(',')} !important;`;
      
      node.remove();
    } else {
      style = '';
    }

    // Mention/Hashtag/URL Color
    document.body.querySelector('.js-app.application').style = `--mention-color: ${Config.data.twColorMention};--hashtag-color: ${Config.data.twColorHashtag};--url-color: ${Config.data.twColorURL}`;

    const cl = document.body.classList;
    if (config.useStarForFavorite) {
      cl.remove('hearty');
      cl.add('starry');
    } else {
      cl.remove('starry');
      cl.add('hearty');
    }
    if (config.applyCustomizeSlider && !cl.contains('customize-columns'))
      cl.add('customize-columns');
    else if (!config.applyCustomizeSlider && cl.contains('customize-columns'))
      cl.remove('customize-columns');

    style += `--column-size: ${config.customizeColumnSize}px;`;

    document.body.style = style;
  }
  catch(e) { console.warn(e); }
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
      remote.getCurrentWindow().reload();
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

document.addEventListener('DOMContentLoaded', EmojiName);

// 트윗에 첨부된 이미지를 드래그해서 저장할 수 있도록 함
document.addEventListener('dragstart', evt => {
  var imageSrc = '';
  var imageOrgSrc = '';
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
    var ext = image.substr(image.lastIndexOf('.') + 1);
    var filename = image.substr(image.lastIndexOf('/') + 1);
    if (filename.lastIndexOf(':') != -1) {
      ext = ext.substr(0, ext.lastIndexOf(':'));
      filename = filename.substr(0, filename.lastIndexOf(':'));
    }
    var detail = `image/${ext}:${filename}:${image}`;
    evt.dataTransfer.setData('DownloadURL', detail);
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

    // create emojipad entry point
    window.TD_mustaches['compose/docked_compose.mustache'] = window.TD_mustaches['compose/docked_compose.mustache'].replace('<div class="js-send-button-container', '<div class="btn btn-on-blue padding-v--9 emojipad--entry-point"><img class="emoji" src="https://twemoji.maxcdn.com/2/72x72/1f600.png" style="pointer-events:none;"></div> <div class="js-send-button-container').replace('<textarea class="js-compose-text', '<textarea id="docked-textarea" class="js-compose-text');
  }

  if (document.title === 'TweetDeck') {
    document.title = 'TweetDeck Player';
  } else {
    document.title = `TweetDeck Player - ${document.title}`;
  }
  
  // detect to non-unicode char, purpose to inject to char before mark tag
  function getFillCh (c) {
    if (c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c >= '0' && c <= '9')
      return '&#8203;'
    if (c == '-')
      return '';
    if (c >= 0x20 && c <= 0x7F)
      return '&#8203;'
    return '';
  }
  function applyHighlights (text) {
    var entities = twitter.extractEntitiesWithIndices(text);
    var indices = [];
    for (item of entities)
      indices.push(item.indices[0]);

    var n = 0;
    var result = "";
    for (var i = 0; i < text.length; i++)
    {
      if (text[i] == '&')
        result += '&amp;';
      else if (text[i] == '<')
        result += '&lt;';
      else if (text[i] == '>')
        result += '&gt';
      else if (text[i] == '♥')
      {
        if (i != 0)
          getFillCh(text[i - 1])
        result += '<mark class="mark_heart">♥</mark>';
      }
      else if (i == indices[n]) {
        if (typeof entities[n].screenName != 'undefined' && entities[n].screenName.length > 2)
        {
          if (i != 0)
            result += getFillCh(text[i - 1]);
          result += text.substr(entities[n].indices[0], entities[n].indices[1]-entities[n].indices[0]).replace('@' + entities[n].screenName, '<mark class="mark_mention">$&</mark>');
          i += entities[n].indices[1] - entities[n].indices[0] - 1;
          n++;
        }

        // hashtag
        else if (typeof entities[n].hashtag != 'undefined')
        {
          if (i != 0)
            result += getFillCh(text[i - 1]);
          result += text.substr(entities[n].indices[0], entities[n].indices[1]-entities[n].indices[0]).replace('#' + entities[n].hashtag, '<mark class="mark_hashtag">$&</mark>');
          i += entities[n].indices[1] - entities[n].indices[0] - 1;
          n++;
        }

        // url
        else if (typeof entities[n].url != 'undefined')
        {
          if (i != 0)
            result += getFillCh(text[i - 1]);
          result += text.substr(entities[n].indices[0], entities[n].indices[1]-entities[n].indices[0]).replace(entities[n].url, '<mark class="mark_url">$&</mark>');
          i += entities[n].indices[1] - entities[n].indices[0] - 1;
          n++;
        }
        else
        {
          result += text[i];
          n++;
        }
      }
      else
      {
        result += text[i];
      }
    }
    return result;
  }

  var prev_focus;
  // mention/url highlight
  function handleChange (evt)
  {
    if (evt.target.id == 'account-safeguard-checkbox' || evt.target.id == 'inline-account-safeguard-checkbox')
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
        if (text == '')
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
              $(x).focus().val('').val(v);
          }, 100);
        }
      }
    }
    prev_focus = document.querySelector(':focus');
  }

  function handleInput (evt)
  {
    if (evt.target.classList.contains('js-compose-text'))
    {
      // html 하이라이트 반영
      var text = $(evt.target).val();
      $(evt.target).parent().children('div').children('div').html(applyHighlights(text));

      // placeholder
      if (text == '')
        $(evt.target).parent().children('div').children('div').html('<span class="placeholder">' + $(evt.target)[0].placeholder + '</span>');

    }
  }

  function handleScroll (evt)
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

  // 맥용 한글 기본 입력기 이슈 해결
  $(document).on('keydown', e => {
    if (document.activeElement === document.body && e.key >= 'ㄱ' && e.key <= 'ㅣ') {
      e.preventDefault();
      e.stopPropagation();
      $(document.activeElement).trigger(jQuery.Event('keypress', {which: e.which}));
    }
    // 엔터키로 트윗하기
    else if (!e.rep && e.which == 13 && config.enterKeyTweet == 'on')
    {
      el = document.activeElement;
      if (el && el.classList.contains('js-compose-text') && e.shiftKey != true &&
         ((el.tagName.toLowerCase() === 'input' && el.type === 'text') ||
         (el.tagName.toLowerCase() === 'textarea')))
      {
        e.preventDefault();
        e.stopPropagation();
        $(document.activeElement).trigger(jQuery.Event('keypress', {which: e.which, keyCode: e.which, ctrlKey: true, rep: true}));
      }
    }
  });

  $(document).on('mouseover', '.tweet-timestamp', e => {
    const target = e.currentTarget;
    const time = target.getAttribute('data-time');
    const date = new Date(parseInt(time, 10));
    target.setAttribute('title', date.toLocaleString());
  });

  // 타임라인 룰 변경
  // - 트윗 작성자가 팔로우중인지 여부를 확인하지 않음
  // - 팔로우 유저의 리트윗을 보기
  // - 팔로우가 아닌 유저의 멘션을 보기
  var processMiscTweet = TD.services.TwitterClient.prototype.processMiscTweet.toString().substr(13);
  processMiscTweet = processMiscTweet.substr(0, processMiscTweet.length - 1);
  var processMiscTweet_ptn = `(c||a&&(!s||n||l))&&(h||m||this.publishChirpsInternal("publish","home",[e]))`;
  var processMiscTweet_rep = `(c||(a||config.disableCheckFriendship=="on")&&((!s||config.disableFilteringMentionUser=="on")||n||l))&&(h||(m&&!config.showRetweetFollowingUser=="on")||this.publishChirpsInternal("publish","home",[e]))`;

  if (processMiscTweet.search(processMiscTweet_ptn) == -1)
    console.warn('procMiscTweet pattern not found');
  else
  {
    processMiscTweet = processMiscTweet.replace(processMiscTweet_ptn, processMiscTweet_rep);
    TD.services.TwitterClient.prototype.processMiscTweet = Function('e', processMiscTweet);
  }

  // Minimize Scroll Animation for Tweet Selection
  Math.min = (a, b) => {
    if (config.minimizeScrollAnimForTweetSel)
    {
      var obj = {};
      Error.captureStackTrace(obj, this);
      if (obj.stack.search('at d.calculateScrollDuration') != -1) return 1;
    }
    return (a < b ? a : b)
  };

  // Shift/alt/ctrl key detect
  var setKeyCheck = function(event){
    if (keyState.ctrl != event.ctrlKey)
    {
      console.info('ctrl: ' + event.ctrlKey)
      remote.getGlobal('keyState').ctrl = event.ctrlKey;
      keyState.ctrl = event.ctrlKey;
    }
    if (keyState.alt != event.altKey)
    {
      console.info('alt: ' + event.altKey)
      remote.getGlobal('keyState').alt = event.altKey;
      keyState.alt = event.altKey;
    }

    if (keyState.shift != event.shiftKey)
    {
      console.info('shift: ' + event.shiftKey)
      remote.getGlobal('keyState').shift = event.shiftKey;
      keyState.shift = event.shiftKey;
    }
  };

  document.addEventListener('keydown', setKeyCheck);
  document.addEventListener('keyup', setKeyCheck);
  document.addEventListener('mousedown', setKeyCheck);
  document.addEventListener('mouseup', setKeyCheck);

  // Built-in TweetDeck Filtering Rules
  var processMiscTweet_ptn = `(c||a&&(!s||n||l))&&(h||m||this.publishChirpsInternal("publish","home",[e]))`;
  var processMiscTweet_rep = `(c||(a||config.disableCheckFriendship=="on")&&((!s||config.disableFilteringMentionUser=="on")||n||l))&&(h||(m&&!config.showRetweetFollowingUser=="on")||this.publishChirpsInternal("publish","home",[e]))`;

  if (processMiscTweet.search(processMiscTweet_ptn) == -1)
    console.warn('procMiscTweet pattern not found');
  else
  {
    processMiscTweet = processMiscTweet.replace(processMiscTweet_ptn, processMiscTweet_rep);
    TD.services.TwitterClient.prototype.processMiscTweet = Function('e,t,i', processMiscTweet);
  }

  // Favorite to Image Save 
  var processFavorite = TD.services.TwitterClient.prototype.favorite.toString().substr(17);
  processFavorite = processFavorite.substr(0, processFavorite.length - 1);

  window.AutoSaveFav = AutoSaveFav;
  processFavorite = 'AutoSaveFav(e);' + processFavorite;
  TD.services.TwitterClient.prototype.favorite = Function('e,t,i', processFavorite);
  
  // Fast Retweet
  TD.services.TwitterStatus.prototype.retweet_direct = function(e) {
    if (config.enableFastRetweet && !keyState.shift)
    {
      var t, i, s, n;
      var r = this.isRetweeted;
      var o = TD.controller.clients.getClient(this.account.getKey());
      this.setRetweeted(!this.isRetweeted);
      this.animateRetweet(e.element);
      var n = function(e) {
      }
      var s = function(e) {
        var t = TD.core.defer.fail();
        if (403 === e.status || 404 === e.status)
        {
          TD.controller.progressIndicator.addMessage((r ? TD.i("Failed: Unretweet -") : TD.i("Failed: Retweet -")) + " " + JSON.parse(e.responseText).errors[0].message)
        }
        403 !== e.status && 404 !== e.status || (t = this.refreshRetweet(o)),
        t.addErrback(function() {
          this.setRetweeted(r),
          n(e)
        }
        .bind(this))
      }
      .bind(this)
      var i = function(e) {
          e.error && s()
      }
      r ? (o.unretweet(this.id, i, s),
      t = ()=>{}) : (o.retweet(this.id, i, s),
      t = TD.controller.stats.retweet),
      t(this.getScribeItemData(), this.account.getUserID())
    }
    else
    {
      var e = 1 === TD.storage.accountController.getAccountsForService("twitter").length;
      this.isRetweeted && e ? (this.setRetweeted(!1),
      $(document).trigger("uiUndoRetweet", {
          tweetId: this.getMainTweet().id,
          from: this.account.getKey()
      })) : new TD.components.ActionDialog(this)
    }
  }
  TD.services.TwitterStatus.prototype.refreshRetweet = function(e) {
    var t = new TD.core.defer.Deferred;
    return e.show(this.id, t.callback.bind(t), t.errback.bind(t)),
    t.addCallback(function(e) {
      this.setRetweeted(e.isRetweeted)
    }
    .bind(this)),
    t
  }
  TD.services.TwitterStatus.prototype.animateRetweet = function(e) {
    var t = "anim anim-slower anim-bounce-in";
    window.requestAnimationFrame(function() {
      e.find('a[rel="retweet"]').toggleClass(t, this.isRetweeted)
    }
    .bind(this))
  }
  TD.services.TwitterClient.prototype.retweet = function(e, t, i) {
    var s = this;
    var n = function(e) {
      t(e)
    }
    this.makeTwitterCall(this.API_BASE_URL + "statuses/retweet/" + e + ".json", {
        id: e
    }, "POST", this.processTweet, n, i)
  }
  TD.services.TwitterClient.prototype.unretweet = function(e, t, i) {
      var s = this;
      var n = function(e) {
          t(e)
      }
      this.makeTwitterCall(this.API_BASE_URL + "statuses/unretweet/" + e + ".json", {
          id: e
      }, "POST", this.processTweet, n, i)
  }
  TD.services.TwitterStatus.prototype.retweet_old = TD.services.TwitterStatus.prototype.retweet;
  TD.services.TwitterStatus.prototype.retweet = TD.services.TwitterStatus.prototype.retweet_direct;
  
  // TweetDeck Ready Check
  var TDP = {};
  if (TD) ipcRenderer.send('page-ready-tdp', this);
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
        /*
        if (Pace) {
          setTimeout(() => {
            PlayerMonkey.GM_addStyle('.pace-progress { display: none }');
          }, 2000);
        }*/
        if (config.useStarForFavorite) {
          const cl = document.body.classList;
          cl.remove('hearty');
          cl.add('starry');
        }

        var emojiPadCSS = document.createElement('link');
        var dockBtn = document.getElementsByClassName('emojipad--entry-point')[0]
        document.body.appendChild(EmojiPad.element);
        dockBtn.onclick = e => {
          EmojiPad.show(e.clientX, e.clientY);

          var el = EmojiPad.element;
          var rect = el.getClientRects()[0];

          if (window.innerWidth - rect.left - 10 < rect.width)
            el.style.left = `${window.innerWidth - rect.width - 10}px`;
          if (window.innerHeight - rect.top - 10 < rect.height)
            el.style.top = `${window.innerHeight - rect.height - 10}px`;
        }
        document.body.addEventListener('click', e => {
          if (e.target != dockBtn && EmojiPad.isOpen) EmojiPad.hide();
        }, false);
        EmojiPad.onEmojiClick = chr => {
          var txt = document.getElementById('docked-textarea');
          txt.value += chr;
          var evt = document.createEvent("HTMLEvents");
          evt.initEvent("change", false, true);
          txt.dispatchEvent(evt);
        }
      }
    }, 1000);
  };

  TDP.onPageLoad();
});

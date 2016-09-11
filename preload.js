const {remote, clipboard, ipcRenderer} = require('electron');
const {Menu, MenuItem, dialog} = remote;
const fs = require('fs');
const twitter = require('twitter-text');
const twemoji = require('twemoji');

const Util = require('./util');

const Config = require('./config');
const VERSION = require('./version');

const PlayerMonkey = require('./preload_scripts/playermonkey');
const WordFilter = require('./preload_scripts/wordfilter');
const Unlinkis = require('./preload_scripts/unlinkis');
const CBPaste = require('./preload_scripts/clipboard-paste');
const TwtLib = require('./preload_scripts/twtlib');
const AutoSaveFav = require('./preload_scripts/autosave-favorites');
const EmojiPad = require('./preload_scripts/emojipad');

// 로딩 프로그레스 바 모듈 로드
require('./pace.min.js');

// 설정 파일 읽기
var config = Config.load();

ipcRenderer.on('apply-config', event => {
  var { detectFont, supportedFonts } = require('detect-font');
  config = Config.load();
  window.config = config;

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
document.addEventListener('DOMContentLoaded', AutoSaveFav);

if (config.enableUnlinkis) {
  document.addEventListener('DOMContentLoaded', Unlinkis);
}

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

  // detect to non-unicode char, purpose to inject to char before mark tag
  function getFillCh (c) {
    if (RegExp('^[a-zA-Z0-9]$').test(c))
      return '.';
    if (c == '-')
      return ' ';
    if (RegExp('^[\x20-\x7F]$').test(c))
      return '.';
    return ' ';
  }
  function applyHighlights (text) {
    text = text
      .replace(/\n$/g, '\n\n');

    var entities = twitter.extractEntitiesWithIndices(text);
    var part;
    var html_text = '';
    var prev_pos = 0;
    var start, end;
    var len = 0;
    for (var i = 0; i < entities.length; i++)
    {
      start = entities[i].indices[0];
      end = entities[i].indices[1] - start;
      padd = 0;
      part = '';

      // mentions
      if (typeof entities[i].screenName != 'undefined' && entities[i].screenName.length > 2)
      {
        if (start != 0)
          part = '<mark class="zero_char">' + getFillCh(text[start - 1]) + '</mark>';
        part += text.substr(start, end).replace('@' + entities[i].screenName, '<mark class="mark_mention">$&</mark>');
      }

      // hashtag
      else if (typeof entities[i].hashtag != 'undefined')
      {
        if (start != 0)
          part = '<mark class="zero_char">' + getFillCh(text[start - 1]) + '</mark>';
        part += text.substr(start, end).replace('#' + entities[i].hashtag, '<mark class="mark_hashtag">$&</mark>');
      }

      // url
      else if (typeof entities[i].url != 'undefined')
      {
        if (start != 0 && text[start] == '-')
        {
          part = '';
          start++;
          end--;
          entities[i].url = entities[i].url.substr(1);
        }
        if (start != 0)
          part = '<mark class="zero_char">' + getFillCh(text[start - 1]) + '</mark>';
        part += text.substr(start, end).replace(entities[i].url, '<mark class="mark_url">$&</mark>');
      }
      else
        part = text.substr(start, end);

      // tweet text over 140
      len += twitter.getTweetLength(text.substr(prev_pos, start - prev_pos));

      var size = start - prev_pos;

      len += twitter.getTweetLength(text.substr(start, end));
      html_text += text.substr(prev_pos, start - prev_pos);
      html_text += part;
      prev_pos = end + start;
    }

    var jc_cnt = parseInt($('.js-character-count')[0].value);
    html_text += text.substr(prev_pos);
    
    // heart highlight
    var result = '';
    for (var i = 0; i < html_text.length; i++)
    {
      if (html_text[i] == '♥')
      {
        if (i != 0)
          result += '<mark class="zero_char">' + getFillCh(text[start - 1]) + '</mark>';
        result += '<mark class="mark_heart">' + html_text[i] + '</mark>';
      }
      else
        result += html_text[i];
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

  // Shift key detect
  window.shiftDown = false;
  var setShiftCheck = function(event){
      window.shiftDown = event.shiftKey;
  };

  document.addEventListener('keydown', setShiftCheck);
  document.addEventListener('keyup', setShiftCheck);
  document.addEventListener('mousedown', setShiftCheck);
  document.addEventListener('mouseup', setShiftCheck);

  // Fast Retweet
  TD.services.TwitterStatus.prototype.retweet_direct = function(e) {
    if (config.enableFastRetweet && !shiftDown)
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

        var emojiPadCSS = document.createElement('link');
        var dockBtn = document.getElementsByClassName('emojipad--entry-point')[0]
        document.body.appendChild(EmojiPad.element);
        dockBtn.onclick = e => EmojiPad.show(e.clientX, e.clientY);
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

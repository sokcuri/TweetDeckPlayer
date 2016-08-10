/*globals $ TD Pace*/
// TweetDeck Clipboard Paste script
// https://gist.github.com/zn/4f622ba80513e0f4d0dd3f13dcd085db

function enablePaste () {
  $(document.body).on('paste', event => {
    if ($('.js-add-image-button').hasClass('is-disabled')) {
      return;
    }
    var items = event.originalEvent.clipboardData.items;
    var item = items[0];
    if (item.kind !== 'file') return;
    var files = [ item.getAsFile() ];
    if (!$('.app-content').hasClass('is-open')) {
      $(document).trigger('uiComposeTweet', { type: 'tweet' });
    }
    $(document).trigger('uiFilesAdded', { files });
  });
}

function injectStyles (rule) {
  $('<div />', {
    html: `&shy;<style>${rule}</style>`,
  }).appendTo('body');    
}

function patchContentEditable () {
  $('[contenteditable="true"]').css({
    opacity: 0,
    pointerEvents: 'none',
  });
}
if (window.TD_mustaches) {
  window.TD_mustaches['version.mustache'] = '#VERSION (TweetDeck {{version}}{{#buildIDShort}}-{{buildIDShort}}{{/buildIDShort}})';
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

var TDP = {};
TDP.onPageLoad = () => {
  setTimeout(() => {
    if (!TD || !TD.ready) {
      TDP.onPageLoad();
    } else {
      // TODO
      TD.controller.progressIndicator.addMessage(TD.i('#VERSION'));
      enablePaste();
      setTimeout(() => {
        TD.settings.setUseStream(TD.settings.getUseStream());
        patchContentEditable();
      }, 3000);
      if (Pace) {
        setTimeout(() => {
          injectStyles('.pace-progress { display: none }');
        }, 2000);
      }
    }
  }, 1000);
  // TODO: event-ify
  // setInterval(clearCache, 60000);
};

TDP.onPageLoad();

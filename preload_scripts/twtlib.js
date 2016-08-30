// Twtlib - 자주쓰는 상용구 기능 지원
const electron = require('electron');
const {ipcRenderer} = electron;

function makeButton (text, clickEventHandler) {
  let btn = $('<div>')
    .addClass('needsclick btn btn-on-blue full-width txt-left margin-b--12 padding-v--9');
  let btnLabel = $('<span>')
    .addClass('label padding-ls')
    .text(text)
    .appendTo(btn);
  btn.on('click', clickEventHandler);
  let btnContainer = $('.js-add-image-button').parent();
  btn.appendTo(btnContainer);
  return btn;
}

function clickHandler (event) {
  event.preventDefault();
  ipcRenderer.send('twtlib-open');
}

function main () {
  let btn = makeButton('Tweet library™', clickHandler);
  ipcRenderer.on('twtlib-add-text', (event, arg) => {
    if (!$('.app-content').hasClass('is-open')) {
      $(document).trigger('uiComposeTweet', { type: 'tweet' });
    }
    let textarea = $('textarea.compose-text')
      .val(arg)
      .trigger('change');
  });
}

function TwtLib () {
  $(document).on('TD.ready', main);
}

module.exports = TwtLib;
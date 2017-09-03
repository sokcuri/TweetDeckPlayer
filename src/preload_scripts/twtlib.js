// Twtlib - 자주쓰는 상용구 기능 지원
const electron = require('electron');
const {ipcRenderer} = electron;

function makeButton (text, clickEventHandler) {
  const $ = window.$;
  const btn = $('<div>')
    .addClass('needsclick btn btn-on-blue full-width txt-left margin-b--12 padding-v--9');
  const btnLabel = $('<span>')
    .addClass('label padding-ls')
    .text(text)
    .appendTo(btn);
  btn.on('click', clickEventHandler);
  let btnContainer = jq('.js-add-image-button').parent();
  btn.appendTo(btnContainer);
  return btn;
}

function clickHandler (event) {
  event.preventDefault();
  ipcRenderer.send('twtlib-open');
}

function main () {
  makeButton('Tweet library™', clickHandler);
  const $ = window.$;
  ipcRenderer.on('twtlib-add-text', (event, arg) => {
    if (!$('.app-content').hasClass('is-open')) {
      $(document).trigger('uiComposeTweet', { type: 'tweet' });
    }
    const textarea = $('textarea.compose-text')
      .val(arg)
      .trigger('change');
  });
}

function TwtLib () {
  window.$(document).on('TD.ready', main);
}

module.exports = TwtLib;

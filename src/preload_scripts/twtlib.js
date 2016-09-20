// Twtlib - 자주쓰는 상용구 기능 지원
const electron = require('electron');
const {ipcRenderer} = electron;

function makeButton (text, clickEventHandler) {
  let jq = window.$;
  let btn = jq('<div>')
    .addClass('needsclick btn btn-on-blue full-width txt-left margin-b--12 padding-v--9');
  let btnLabel = jq('<span>')
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
  let jq = window.$;
  let btn = makeButton('Tweet library™', clickHandler);
  ipcRenderer.on('twtlib-add-text', (event, arg) => {
    if (!jq('.app-content').hasClass('is-open')) {
      jq(document).trigger('uiComposeTweet', { type: 'tweet' });
    }
    let textarea = jq('textarea.compose-text')
      .val(arg)
      .trigger('change');
  });
}

function TwtLib () {
  window.$(document).on('TD.ready', main);
}

module.exports = TwtLib;

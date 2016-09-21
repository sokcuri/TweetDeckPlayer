// TweetDeck Clipboard Paste script
// https://gist.github.com/zn/4f622ba80513e0f4d0dd3f13dcd085db

module.exports = function enablePaste () {
  let jq = window.$;
  jq(document.body).on('paste', event => {
    if (jq('.js-add-image-button').hasClass('is-disabled')) {
      return;
    }
    var items = event.originalEvent.clipboardData.items;
    var item = items[0];
    if (item.kind !== 'file') return;
    var files = [ item.getAsFile() ];
    if (!jq('.app-content').hasClass('is-open')) {
      jq(document).trigger('uiComposeTweet', { type: 'tweet' });
    }
    jq(document).trigger('uiFilesAdded', { files });
  });
};

// TweetDeck Clipboard Paste script
// https://gist.github.com/zn/4f622ba80513e0f4d0dd3f13dcd085db

module.exports = function enablePaste () {
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

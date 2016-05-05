// ==UserScript==
// @name        TweetDeck Paste Image
// @namespace   gaeulbyul.userscript
// @description 트윗덱에 클립보드 붙여넣기(Ctrl-V)로 이미지를 업로드하는 기능을 추가한다.
// @author      Gaeulbyul
// @license     WTFPL
// @include     https://tweetdeck.twitter.com/
// @version     0.3b1
// @run-at      document-end
// @grant       none
// ==/UserScript==

/* tweetdeck-paste-image.user.js
 * 트윗덱 플레이어의 경우, 해당 스크립트 파일을 'script'폴더에 넣어주세요.
 * 파이어폭스는 그리스몽키(Greasemonkey)가 필요합니다.
 * 크롬/오페라/비발디는 템퍼몽키(Tampermonkey)가 필요합니다.
 */

var catcher = $('<div>')
    .attr('contenteditable',true)
    .css('opacity', 0)
    .appendTo(document.body)
    .focus();

function dataURIToBlob (dataURI) {
    var [ mimeString, encodedData ] = dataURI.split(',');
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0) {
        byteString = atob(encodedData);
    } else {
        byteString = unescape(encodedData);
    }
    var type = mimeString.match(/^data:(.+);/)[1];
    var ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    var blob = new Blob([ ia ], { type });
    return blob;
}

function waitClipboard () {
    var cer = catcher[0];
    var child = cer.childNodes && cer.childNodes[0];
    if (child) {
        if (child.tagName === 'IMG') {
            var file = dataURIToBlob(child.src);
            pasteFile([ file ]);
        }
        cer.innerHTML = '';
    } else {
        setTimeout(waitClipboard, 100);
    }
}

function pasteFile (files) {
    // 트윗 입력창을 닫은 이후에 멘션 안 남게
    if (!$('.app-content').hasClass('is-open')) {
        $(document).trigger("uiComposeTweet", { type: 'tweet' });
    }
    $(document).trigger('uiFilesAdded', { files });
}

$(document.body).on('paste', function (event) {
    try {
        var clipdata = event.originalEvent.clipboardData;
        var items = clipdata.items;
        var item = items[0];
    } catch (e) {
        catcher.focus();
        setTimeout(waitClipboard, 300);
        return;
    }
    if (item.kind !== 'file') return;
    var file = [ item.getAsFile() ];
    pasteFile(file);
});

/* Firefox 클립보드 관련 참고한 링크:
 * http://stackoverflow.com/a/21378950
 * http://joelb.me/blog/2011/code-snippet-accessing-clipboard-images-with-javascript/
 * http://stackoverflow.com/a/5100158 (dataURIToBlob)
*/
/* globals TD */
const Config = require('../config');

function MakeQuoteWithoutNotification (ipcRenderer, id) {
  var host = Config.data.quoteServer;
  var apiUrl = `${host}/api?id=${id}&host=${encodeURIComponent(host)}`;

  function showLog (response) {
    console.log((new Date).toUTCString(), '>', ['Quote API', id, response.status]);
    return response;
  }

  function status (response) {
    return (response.status >= 200 && response.status < 300) ? Promise.resolve(response)
      : (response.status === 400) ? Promise.resolve(response)
      : Promise.reject(new Error(response.statusText));
  }

  function json (response) {
    return response.json();
  }

  function handleErrors (data) {
    if (!data.hasOwnProperty('err')) return data;
    var errMsg = data.err;
    var msg = `Quote Without Notification Fail: ${errMsg}`;
    return Promise.reject(new Error(msg));
  }

  fetch(apiUrl)
  .then(showLog)
  .then(status)
  .then(json)
  .then(handleErrors)
  .then(function (data) {
    let jq = window.$;
    var quoteUrl = data.url;
    ipcRenderer.send('twtlib-send-text', quoteUrl);
    jq(document).trigger('uiComposeTweet', { type: 'tweet' });
    window.toastMessage('Quote link generated');

  }).catch(function (err) {
    window.toastErrorMessage(err);
  });
};

module.exports = MakeQuoteWithoutNotification;

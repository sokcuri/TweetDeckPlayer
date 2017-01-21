const Config = require('../config');

function MakeQuoteWithoutNotification (ipcRenderer, id) {
  var host = Config.data.quoteServer;
  var apiUrl = `${host}/api?id=${id}&host=${encodeURIComponent(host)}`;

  function status (response) {
    if (response.status >= 200 && response.status < 300) {
      return Promise.resolve(response);
    } else if (response.status === 400) {
      return Promise.resolve(response);
    } else {
      return Promise.reject(new Error(response.statusText));
    }
  }

  function showLog (response) {
    console.log((new Date).toUTCString(), '>', ['Quote API', id, response.status]);
    return response;
  }

  function json (response) {
    return response.json();
  }

  function handleErrors (data) {
    if (data.hasOwnProperty('err')) {
      var errMsg = data.err;
      var msg = `Quote Without Notification Fail: ${errMsg}`;
      return Promise.reject(new Error(msg));

    } else {
      return data;
    }
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
    TD.controller.progressIndicator.addMessage('Quote link generated');

  }).catch(function (err) {
    TD.controller.progressIndicator.addMessage(err);
  });
};

module.exports = MakeQuoteWithoutNotification;

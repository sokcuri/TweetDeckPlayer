// PlayerMonkey - Greasemonkey/Tampermonkey compatible function
// for port userscript to TweetDeck Player

const request = require('request');

function GM_xmlhttpRequest (params) {
  let {method, url, onload, onerror} = params;
  method = method.toLowerCase();
  if (!(method in request)) {
    throw new Error('Unknown HTTP Method!');
  }
  request[method](url, (error, response, body) => {
    if (error) {
      onerror(error);
      return;
    }
    if (response.statusCode !== 200) {
      onerror(new Error(`Response code isn\'t HTTP 200 (got ${response.statusCode})`));
      return;
    }
    let gmResponse = {
      finalUrl: response.request.uri.href,
      response: body,
      responseHeaders: response.headers,
      status: response.statusCode,
    };
    onload(gmResponse);
  });
}

function GM_addStyle (css) {
  const div = document.createElement('div');
  div.innerHTML = `&shy;<style>${css}</style>`;
  document.body.appendChild(div);
}

const PlayerMonkey = {
  GM_xmlhttpRequest,
  GM_addStyle,
};

module.exports = PlayerMonkey;

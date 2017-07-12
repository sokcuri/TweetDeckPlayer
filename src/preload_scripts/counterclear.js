/* globals TD */
const Config = require('../config');

const UNREAD_URL = 'https://api.twitter.com/1.1/activity/about_me/unread.json';
const config = Config.load();

function clearCounter () {
  const headers = new Headers();
  {
    const bearerToken = TD.util.getBearerTokenAuthHeader();
    const csrfToken = TD.util.getCsrfTokenHeader();
    headers.append('content-type', 'application/x-www-form-urlencoded; charset=UTF-8');
    headers.append('authorization', bearerToken);
    headers.append('x-csrf-token', csrfToken);
    headers.append('x-twitter-active-user', 'yes');
    headers.append('x-twitter-auth-type', 'OAuth2Session');
  }
  const request = new Request(`${UNREAD_URL}?cursor=true`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: `cursor=${Date.now()}`,
  });
  return fetch(request);
}

module.exports = () => {
  const threeMinutes = (1000 * 60 * 3);
  window.setInterval(() => {
    if (config.useCounterClear) {
      clearCounter().then(() => {
        console.info('sent counter-clear request');
      }, () => {
        console.error('error on: send counter-clear request');
      });
    }
  }, threeMinutes);
};

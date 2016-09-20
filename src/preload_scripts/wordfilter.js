'use strict';
const Config = require('../config');

module.exports = () => {
  const config = Config.load();
  if (!config.enableWordFilter) return;
  let words = config.filterWords.split('\n');
  words = words.map(word => {
    // /로 감싼 단어는 정규식으로 변환한다.
    let match = word.match(/^\/(.+)\/$/);
    if (match) {
      // global flag 붙이지 말것
      // see: http://stackoverflow.com/a/2630538
      return new RegExp(match[1], 'i');
    } else {
      return word;
    }
  });
  let myID;
  // maskTweet - 트윗의 내용을 가린다.
  // 단, 클릭시에는 원래 트윗을 보여준다.
  function maskTweet (tweet) {
    const userID = tweet.querySelector('.username').textContent;
    const name = tweet.querySelector('.fullname').textContent;
    const text = tweet.querySelector('.js-tweet-text').textContent;
    let rt_by = '';
    let nbfc = tweet.querySelector('.nbfc');
    if (nbfc) {
      let nbfc_txt = nbfc.textContent.trim();
      if (/retweet/i.test(nbfc_txt)) {
        let by = nbfc.querySelector('a[rel="user"]');
        rt_by = by.pathname.replace('/', '');
      }
    }
    if (rt_by) {
      rt_by = `(RT from @${rt_by})`;
    }
    const hoverText = `${name}(${userID})님의 트윗: ${rt_by}\n${text}`;
    const maskMessage = document.createElement('div');
    maskMessage.classList.add('masked-tweet');
    maskMessage.setAttribute('title', hoverText);
    maskMessage.textContent = 'Filtered!';
    const originalHTML = tweet.innerHTML;
    function revealOriginal (event) {
      event.stopImmediatePropagation();
      tweet.innerHTML = originalHTML;
      tweet.removeEventListener('click', revealOriginal);
      // GIF 움짤이 있다면 이를 재생시킨다.
      let gif = tweet.querySelector('video.js-media-gif');
      if (gif && gif.paused) {
        gif.play();
      }
    }
    tweet.innerHTML = '';
    tweet.appendChild(maskMessage);
    tweet.addEventListener('click', revealOriginal);
  }
  // hideTweet - 말 그대로 트윗을 아예 안 보이도록 숨김.
  function hideTweet (tweet) {
    tweet.style.display = 'none';
  }
  // "Completely hide tweet" 옵션에 따라 결정한다.
  const action = config.hideFilteredTweet ? hideTweet : maskTweet;
  function filterTweet (tweet) {
    if (!myID) {
      myID = document.querySelector('.js-account-summary .username');
      myID = myID.textContent.trim();
    }
    let userID = tweet.querySelector('.username').textContent;
    if (userID === myID) return;
    let text = tweet.querySelector('.js-tweet-text');
    if (!text) return;
    text = text.textContent.toLowerCase();
    for (let word of words) {
      if (typeof word === 'string' && text.indexOf(word) > -1) {
        action(tweet);
        return;
      }
      if (word instanceof RegExp && word.test(text)) {
        action(tweet);
        return;
      }
    }
  }
  const wordFilterObserver = new MutationObserver(mutations => {
    for (let mut of mutations) {
      let added = mut.addedNodes;
      for (let node of added) {
        if (!node.matches) continue;
        if (!node.matches('article.stream-item')) continue;
        // DM은 필터링하지 않는다. .tweet-message 요소가 있으면 DM으로 간주
        if (node.querySelector('.tweet-message')) continue;
        // 디테일 (트윗 클릭시 나오는 조금 큰 트윗)에선 필터링하지 않는다.
        if (node.matches('.js-tweet-detail article')) continue;
        filterTweet(node);
      }
    }
  });
  wordFilterObserver.observe(document.body, {
    attributes: true,
    childList: true,
    characterData: true,
    subtree: true,
  });
};

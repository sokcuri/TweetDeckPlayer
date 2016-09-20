// emojiname.is - Apply emoji name

const twemoji = require('twemoji');

function EmojiApply () {
  function tweet_handler (elem) {
    let jq = window.$;
    if (!config.applyEmojiName) return;
    var target;
    target = [jq(elem).find('.fullname'),
              jq(elem).find('.js-action-url').find('.fullname'),
              jq(elem).find('.account-link'),
              jq(elem).find('.nbfc'),
              jq(elem).find('.social-proof-names'),
              jq(elem).find('.title-content')];

    for (let t of target) {
      if (t.length && !jq(t[0]).find('img.emoji').length)
        t[0].innerHTML = twemoji.parse(t[0].innerHTML);
    }
  }

  function get_tweets () {
    window.$('.tweet').each(function (i, tweet) {
      tweet_handler(tweet);
    });
  }

  var obs_config = {
    childList: true,
    characterData: true,
    subtree: true,
  };

  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      var added_nodes = mutation.addedNodes;
      for (var i = 0; i < added_nodes.length; i++) {
        tweet_handler(added_nodes[i]);
      }
    });
  });

  observer.observe(document.body, obs_config);
  get_tweets();

  console.log('EmojiApply ready!');
}

module.exports = EmojiApply;

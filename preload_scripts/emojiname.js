// emojiname.is - Apply emoji name

const twemoji = require('twemoji');

function EmojiApply () {
  function tweet_handler (elem) {
      if (!config.applyEmojiName) return;
      var target;
      target = [$(elem).find('.fullname'),
                $(elem).find('.js-action-url').find('.fullname'),
                $(elem).find('.account-link'),
                $(elem).find('.nbfc').find('a')];

      for (t of target)
      {
        if (t.length && !$(t[0]).find('img.emoji').length)
          t[0].innerHTML = twemoji.parse(t[0].innerHTML);
      }
  }

  function get_tweets () {
    $('.tweet').each(function (i, tweet) {
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

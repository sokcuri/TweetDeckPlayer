// unlink.is - Replace link.is links on twitter timeline to plain one.
// License: MPL-2.0
// https://github.com/perillamint/unlink.is

const PlayerMonkey = require('./playermonkey');
const {GM_xmlhttpRequest} = PlayerMonkey;

function Unlinkis () {
  //Caution: This parsing method is not code-change resist.
  var jsblock_regex = /<script[^>]*>[\s\S]([.\s\S]*?)<\/script>/g;
  var urlgrabber_regex = /longUrl"?:[ ]*"(.+?)"/;
  var linkdata_obj_regex = /var LinkData/;

  var linkis_detect = /(?:ln\.is|linkis\.com)\/\w+/;
  var linkis_card_detect = /(?:ln\.is|linkis\.com)/;
  var card_iframe_regex = /xdm_default\d+?_provider/;

  //Caution: This url extractor WILL CRASH when twitter changes working method of t.co
  var tco_url_extract_regex = /location\.replace\("(.*?)"\)/;
  var tco_url_detect = /http(|s):\/\/t.co\/[^\/]*$/;

  var tweetdeck = location.hostname === 'tweetdeck.twitter.com';

  function get_jsblock (str) {
    var match = str.match(jsblock_regex);
    var ret = [];
    for (var i = 1; i < match.length; i++) {
      ret[i - 1] = match[i];
    }
    return ret;
  }

  function extract_url (str) {
    if (str.match(linkdata_obj_regex) !== null) {
      var match = str.match(urlgrabber_regex);
      if (match !== null) {
        return match[1].replace(/\\\//g, '/');
      }
    }
    return null;
  }

  function convert_and_patch (url, jqobj, depth) {
    if (depth > 100) return;

    console.log('Resolving url: ' + url);

    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function (resp) {
        //Check xmlhttpRequest ends with t.co
        if (resp.finalUrl.match(tco_url_detect) !== null) {
          var url_arr = resp.response.match(tco_url_extract_regex);
          if (url_arr === null) return;

          convert_and_patch(url_arr[1].replace(/\\\//g, '/'), jqobj, depth + 1);
        }
        var jsblock_arr = get_jsblock(resp.response);
        var url = null;
        for (var i = 0; i < jsblock_arr.length; i++) {
          url = extract_url(jsblock_arr[i]);
          if (url !== null) break;
        }
        jqobj.attr('href', url);
        // Check `jqobj` is normal link or tweet card
        if (jqobj.hasClass('twitter-timeline-link') || jqobj.hasClass('url-ext')) {
          jqobj.text(url).attr('title', url);
        } else if (jqobj.hasClass('TwitterCard-container')) {
          jqobj.find('span.SummaryCard-destination').text(jqobj[0].hostname);
        }
      },
      onerror: function (err) {
        console.log(err);
      },
    });
  }

  function tweet_handler (elem) {
    let jq = window.$;
    if (elem.tagName === 'IFRAME' && card_iframe_regex.test(elem.id)) {
      jq(elem).on('load', function (event) {
        var card_hostname = elem.contentWindow.document.querySelector('span.SummaryCard-destination');
        if (card_hostname === null) return;
        if (linkis_card_detect.test(card_hostname.textContent)) {
          var link = elem.contentWindow.document.querySelector('a.js-openLink');
          convert_and_patch(link.href, jq(link), 0);
        } else {
          var twt_link = jq(elem).closest('.tweet').find('a.twitter-timeline-link');
          var xpurl = twt_link.data('expanded-url');
          if (linkis_detect.test(xpurl)) {
            var link = elem.contentWindow.document.querySelector('a.js-openLink');
            convert_and_patch(link.href, jq(link), 0);
          }
        }
      });
    } else {
      if (tweetdeck) {
        var links = jq(elem).find('a.url-ext');
      } else {
        var links = jq(elem).find('a.twitter-timeline-link');
      }
      for (var i = 0; i < links.length; i++) {
        var match = jq(links[i]).text().match(linkis_detect);

        if (match !== null) {
          var url = links[i].href;
          // expanded-url is for Twitter, full-url is for TweetDeck
          if (links[i].hasAttribute('data-expanded-url')) {
            url = links[i].getAttribute('data-expanded-url');
          } else if (links[i].hasAttribute('data-full-url')) {
            url = links[i].getAttribute('data-full-url');
          }
          convert_and_patch(url, jq(links[i]), 0);
          var media_url = jq(elem).find('a.PlayableMedia-externalUrl');
          if (media_url.length > 0) {
            convert_and_patch(media_url[0].href, media_url, 0);
          }
        }
      }
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

  console.log('Unlink.is ready!');
}

module.exports = Unlinkis;

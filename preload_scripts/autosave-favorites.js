const fs = require('fs');
const request = require('request');
const path = require('path');
const url = require('url');
const Config = require('../config');

const config = Config.load();

function download (url, filename) {
  let savepath = (config.autoSavePath || '').trim();
  if (!savepath) {
    savepath = path.join(__dirname, '/images');
    try {
      fs.mkdirSync(savepath);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }
  let filepath = path.join(savepath, filename);
  try {
    request(url).pipe(fs.createWriteStream(filepath));
  } catch (e) {
    window.alert(`파일을 "${filepath}"에 다운로드할 수 없습니다.`, 'Error');
  }
}

// should add to .tweet element
function heartClickEventHandler (event) {
  if (!config.enableAutoSaveFav) return;
  const target = $(event.target);
  //if (!target.matches('a.tweet-action[rel="favorite"]')) return;
  const tweet = target.closest('.tweet');
  // Already favorited. quit function
  if (tweet.hasClass('is-favorite')) return;
  const images = tweet.find('a.js-media-image-link');
  tweet.find('a.js-media-image-link').each((i, elem) => {
    let match = elem.style.backgroundImage.match(/url\("(.+)"\)/);
    if (!match) return;
    let imageURL = match[1].replace(':small',':orig');
    let parsedURL = url.parse(imageURL);
    // TODO: better filename
    let filename = parsedURL.pathname
      .replace(/[/:]/g,'_')
      .replace(/_orig$/, '');
    download(imageURL, filename);
  });
}

function onready () {
  $(document.body).on('click', '.tweet a.tweet-action[rel="favorite"]', heartClickEventHandler);
}

module.exports = onready;

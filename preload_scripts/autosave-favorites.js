const fs = require('fs');
const request = require('request');
const path = require('path');
const url = require('url');
const Config = require('../config');

const config = Config.load();

function download (url, filename) {
  let savepath = (config.autoSavePath || '').trim();
  if (!savepath) {
    savepath = path.join(__dirname, '../Favorited Images');
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

function generateFilename (imgurl) {
  let ext = imgurl.match(/\.(\w+):/);
  if (ext) {
    ext = ext[1];
  } else {
    console.warn('Fail to get extension from url %s!', imgurl);
    ext = 'png';
  }
  const now = new Date();
  let [date, time, zone] = now.toISOString().split(/T|\./);
  time = time.replace(/:/g, '');
  let result = `${date} ${time}.${ext}`;
  return result;
}

// should add to .js-tweet element
// if use .tweet, this function fail on detail-view
function heartClickEventHandler (event) {
  if (!config.enableAutoSaveFav) return;
  const target = $(event.target);
  //if (!target.matches('a.tweet-action[rel="favorite"]')) return;
  const tweet = target.closest('.js-tweet');
  // Already favorited. quit function
  if (tweet.hasClass('is-favorite')) return;
  // in detail view
  let images = tweet.find('img.media-img');
  if (images.length > 0) {
    images.each((i, elem) => {
      let imageURL = elem.src.replace(':small', ':orig');
      let filename = generateFilename(imageURL);
      download(imageURL, filename);
    });
  } else {
    // in timeline
    images = tweet.find('a.js-media-image-link');
    images.each((i, elem) => {
      let match = elem.style.backgroundImage.match(/url\("(.+)"\)/);
      if (!match) return;
      let imageURL = match[1].replace(':small',':orig');
      let filename = generateFilename(imageURL);
      download(imageURL, filename);
    });
  }
}

function onready () {
  $(document.body).on('click', '.js-tweet a[rel="favorite"]', heartClickEventHandler);
}

module.exports = onready;

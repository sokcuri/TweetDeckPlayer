const fs = require('fs');
const request = require('request');
const path = require('path');
const Config = require('../config');
const Util = require('../util');

const config = Config.load();

function download (url, filename) {
  console.info(`download start: ${url}`);
  let savepath = (config.autoSavePath || '').trim();
  if (!savepath) {
    savepath = path.join(Util.getWritableRootPath(), 'Favorited Images');
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
  let splitted = imgurl.split('.');
  let ext = splitted[splitted.length - 1];
  ext = ext.replace(/:\w+/, '');
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
  favoriteAutoSave($(event.target));
}

function favoriteAutoSave (target) {
  //if (!target.matches('a.tweet-action[rel="favorite"]')) return;
  const tweet = $(target.closest('.js-tweet')[0]);
  // Already favorited. quit function
  // if (tweet.hasClass('is-favorite')) return;

  console.log(tweet);
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
      let imageURL = match[1].replace(':small', ':orig');
      let filename = generateFilename(imageURL);
      download(imageURL, filename);
    });
  }
  // find GIF
  let video = tweet.find('video.js-media-gif');
  if (video.length > 0) {
    video = video[0];
    let src = video.currentSrc;
    let filename = generateFilename(src);
    download(src, filename);
  }
}

function tossElement(e) {
  if (typeof e !== 'undefined')
    favoriteAutoSave($(`[data-key="${e}"]`))
}

function onready (e) {
  $(document.body).on('click', '.js-tweet a[rel="favorite"]', heartClickEventHandler);
}

module.exports = tossElement;

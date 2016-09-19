const fs = require('fs');
const request = require('request');
const path = require('path');
const Config = require('../config');
const Util = require('../util');
const {remote} = require('electron');

const config = Config.load();

function download (url, filename) {
  console.info(`download start: ${url}`);
  if (config.autoSaveFavUrlName) {
    filename = Util.getFileName(url);
  }
  let savepath = (config.autoSavePath || '').trim();
  if (!savepath) {
    savepath = path.join(Util.getWritableRootPath(), 'Favorited Images');
  }
  try {
    fs.mkdirSync(savepath);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
  let filepath = path.join(savepath, filename);
  try {
    request(url).pipe(fs.createWriteStream(filepath));
  } catch (e) {
    TD.controller.progressIndicator.addMessage(`Failed - Save Image : Cannot save image to ${filepath}`);
  }
}

function generateFilename (imgurl, index) {
  let splitted = imgurl.split('.');
  let ext = splitted[splitted.length - 1];
  ext = ext.replace(/:\w+/, '');
  const now = new Date();
  let [date, time, zone] = now.toISOString().split(/T|Z/);
  time = time.replace(/:/g, '');
  let result = `${date} ${time} (${index}).${ext}`;
  return result;
}

// should add to .js-tweet element
// if use .tweet, this function fail on detail-view
function heartClickEventHandler (event) {
  if (!config.enableAutoSaveFav || remote.getGlobal('sharObj').shiftDown) return;
  favoriteAutoSave($(event.target));
}

function favoriteAutoSave (target) {
  //if (!target.matches('a.tweet-action[rel="favorite"]')) return;
  const tweet = $(target.closest('.js-tweet')[0]);
  // Already favorited. quit function
  // if (tweet.hasClass('is-favorite')) return;

  // in detail view
  let images = tweet.find('img.media-img');
  if (images.length > 0) {
    let index = 1;
    images.each((i, elem) => {
      let imageURL = Util.getOrigPath(elem.src);
      let filename = generateFilename(imageURL, index++);
      download(imageURL, filename);
    });
  } else {
    // in timeline
    images = tweet.find('a.js-media-image-link');
    let index = 1;
    images.each((i, elem) => {
      let match = elem.style.backgroundImage.match(/url\("(.+)"\)/);
      if (!match) return;
      let imageURL = Util.getOrigPath(match[1]);
      let filename = generateFilename(imageURL, index++);
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

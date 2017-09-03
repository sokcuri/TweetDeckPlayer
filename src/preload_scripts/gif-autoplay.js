/* globals $, TD */
const Config = require('../config');
const config = Config.load();

function Autoplay () {
  if (config.gifAutoplay === 'default') return;
  const $body = $(document.body);
  $body
    .on('play', 'video.js-media-gif', event => {
      const target = $(event.target);
      target.closest('.js-media-preview-container.is-gif').removeClass('is-paused');
    })
    .on('pause', 'video.js-media-gif', event => {
      const target = $(event.target);
      target.closest('.js-media-preview-container.is-gif').addClass('is-paused');
    });
  if (config.gifAutoplay === 'mouseenter') {
    $body
      .on('mouseenter', '.js-media-preview-container.is-gif', event => {
        const target = event.currentTarget;
        const video = target.querySelector('video');
        if (video && video.paused) {
          target.classList.remove('is-paused');
          video.play();
        }
      })
      .on('mouseleave', '.js-media-preview-container.is-gif', event => {
        const target = event.currentTarget;
        const video = target.querySelector('video');
        if (video && !video.paused) {
          target.classList.add('is-paused');
          video.pause();
        }
      });
  }
  TD.ui.Column.prototype.playGifIfNotManuallyPaused = function (e) {
    const container = this.getChirpById(e.id).find('.js-media-preview-container');
    const video = container.find('video').get(0);
    if (video && video.paused) {
      container.addClass('is-paused');
    }
  };
}

module.exports = Autoplay;

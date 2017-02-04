/* globals $, TD */
function Autoplay () {
  $(document.body)
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
  TD.ui.Column.prototype.playGifIfNotManuallyPaused = function (e) {
    const container = this.getChirpById(e.id).find('.js-media-preview-container');
    container.addClass('is-paused');
  };
}

module.exports = Autoplay;

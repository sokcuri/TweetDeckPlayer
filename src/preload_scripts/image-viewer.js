const {GM_addStyle} = require('./playermonkey');

const VIEWER_HTML = `
  <img class="tiv-image">
`;

const VIEWER_CSS = `
  .tdp-image-viewer {
    position: fixed;
    display: none;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 30px 50px;
    background-color: rgba(0, 0, 0, .9);
    z-index: 999;
    overflow-y: auto;
  }
  /* 노트:
  * Chromium >= 53 지원을 위해 user-select속성에
  * -webkit- prefix를 붙여야 함.
  * 출처: http://caniuse.com/#feat=user-select
  */
  .tiv-image {
    display: block;
    margin: auto;
    max-width: 100%;
    -webkit-user-select: none;
    user-select: none;
  }
`;

class TDPImageViewer {
  constructor () {
    const viewer = this.viewer = document.createElement('div');
    viewer.classList.add('tdp-image-viewer');
    viewer.innerHTML = VIEWER_HTML;
    const image = this.image = viewer.querySelector('img.tiv-image');
    image.addEventListener('load', event => {
      if (/:small$/.test(image.src)) {
        image.src = image.src.replace(/:small$/, ':orig');
      }
    });
    viewer.addEventListener('click', event => {
      if (!(event.target.isSameNode(image))) {
        window.$(document).trigger('tiv-close');
      }
    });
    GM_addStyle(VIEWER_CSS);
    document.body.appendChild(viewer);
  }
  showImage (url) {
    this.image.src = url;
    this.viewer.style.display = 'block';
  }
  close () {
    this.viewer.style.display = 'none';
  }
}

module.exports = function imageViewer () {
  const viewer = new TDPImageViewer;
  const $ = window.$;
  $(document).on('tiv-show-image', (event, url) => {
    viewer.showImage(url);
  });
  $(document).on('tiv-close', event => {
    viewer.close();
  });
  $(document.body).on('click', 'a[rel=mediaPreview]', event => {
    event.preventDefault();
    // event.stopPropagation();
    event.stopImmediatePropagation();
    const target = $(event.currentTarget);
    const img = target.find('img.media-img');
    let url = '';
    if (img.length !== 0) {
      url = img.attr('src');
    } else {
      url = target.css('background-image');
      url = url.replace(/^url\(['"]?/, '');
      url = url.replace(/['"]?\)$/, '');
    }
    url = url.replace(/:small$/, ':orig');
    if (url) {
      $(document).trigger('tiv-show-image', url);
    }
  });
};

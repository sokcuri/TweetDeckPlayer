const VIEWER_HTML = `
  <nav class="tiv-toolbar">
    <div class="tiv-btngroup-left">
      <button class="tiv-button tiv-btn-prev">
        Previous
      </button>
      <button class="tiv-button tiv-btn-next">
        Next
      </button>
    </div>
    <div class="tiv-btngroup-right">
      <button class="tiv-button tiv-btn-close">
        Close
      </button>
    </div>
  </nav>
  <img class="tiv-image">
`;

function extractURL (img) {
  const css = img.css('background-image');
  const url = css
    .replace(/^url\(['"]?/, '')
    .replace(/['"]?\)$/, '');
  return url;
}

class TDPImageViewer {
  constructor () {
    this.images = [];
    const viewer = this.viewer = document.createElement('div');
    viewer.classList.add('tdp-image-viewer');
    viewer.innerHTML = VIEWER_HTML;
    const image = this.image = viewer.querySelector('img.tiv-image');
    const toolbar = this.toolbar = viewer.querySelector('.tiv-toolbar');
    toolbar.querySelector('.tiv-btn-prev').addEventListener('click', event => {
      event.preventDefault();
      this.prev();
    });
    toolbar.querySelector('.tiv-btn-next').addEventListener('click', event => {
      event.preventDefault();
      this.next();
    });
    toolbar.querySelector('.tiv-btn-close').addEventListener('click', event => {
      window.$(document).trigger('tiv-close');
    });
    document.body.appendChild(viewer);
  }
  update () {
    const {images, index} = this;
    const length = images.length;
    this.image.src = images[index].url;
    const prev = this.toolbar.querySelector('.tiv-btn-prev');
    const next = this.toolbar.querySelector('.tiv-btn-next');
    prev.disabled = (index === 0);
    next.disabled = (index === length - 1);
  }
  prev () {
    this.index -= 1;
    this.update();
  }
  next () {
    this.index += 1;
    this.update();
  }
  show () {
    this.viewer.style.display = 'block';
  }
  close () {
    this.viewer.style.display = 'none';
  }
}

module.exports = function imageViewer () {
  const viewer = new TDPImageViewer;
  const $ = window.$;
  $(document).on('tiv-show-image', (event, parameter) => {
    viewer.images = parameter.images;
    viewer.index = parameter.index;
    viewer.update();
    viewer.show();
  });
  $(document).on('tiv-close', event => {
    viewer.close();
  });
  $(document.body).on('click', 'a[rel=mediaPreview]', event => {
    event.preventDefault();
    // event.stopPropagation();
    event.stopImmediatePropagation();
    const target = $(event.currentTarget);
    const container = target.parents('.media-preview');
    const images = container.find('a[rel=mediaPreview]');
    const parameter = {
      index: 0,
      images: [],
    };
    const targetImage = extractURL(target);
    images.each((index, image) => {
      image = $(image);
      const img = image.find('img.media-img');
      let url = '';
      if (img.length !== 0) {
        url = img.attr('src');
      } else {
        url = extractURL(image);
      }
      if (url === targetImage) {
        parameter.index = index;
      }
      url = url.replace(/:small$/, ':orig');
      parameter.images.push({
        index, url,
      });
    });
    $(document).trigger('tiv-show-image', parameter);
  });
};

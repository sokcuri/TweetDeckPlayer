const Config = require('../config');

const config = Config.load();

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
  <div class="tiv-imagewrapper">
    <img class="tiv-image">
  </div>
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
    const wrapper = this.wrapper = viewer.querySelector('.tiv-imagewrapper');
    const image = this.image = viewer.querySelector('img.tiv-image');
    const toolbar = this.toolbar = viewer.querySelector('.tiv-toolbar');
    viewer.addEventListener('click', event => {
      event.stopPropagation();
      if (wrapper.isSameNode(event.target)) {
        this.close();
      }
    });
    image.addEventListener('load', event => {
      image.classList.remove('loading');
    });
    image.addEventListener('click', event => {
      config.tivClickForNextImage && this.circleNext();
    });
    toolbar.querySelector('.tiv-btn-prev').addEventListener('click', event => {
      event.preventDefault();
      this.prev();
    });
    toolbar.querySelector('.tiv-btn-next').addEventListener('click', event => {
      event.preventDefault();
      this.next();
    });
    toolbar.querySelector('.tiv-btn-close').addEventListener('click', event => {
      this.close();
    });
    document.body.appendChild(viewer);
  }
  update () {
    const {images, index} = this;
    const length = images.length;
    this.image.classList.add('loading');
    this.image.src = images[index].url;
    this.wrapper.scrollTop = 0;
    const prev = this.toolbar.querySelector('.tiv-btn-prev');
    const next = this.toolbar.querySelector('.tiv-btn-next');
    prev.disabled = (index === 0);
    next.disabled = (index === length - 1);
  }
  prev () {
    if (!this.toolbar.querySelector('.tiv-btn-prev').disabled) {
      this.index -= 1;
      this.update();
    }
  }
  next () {
    if (!this.toolbar.querySelector('.tiv-btn-next').disabled) {
      this.index += 1;
      this.update();
    }
  }
  circleNext () {
    this.index = (this.index === this.images.length - 1) ? 0 : this.index + 1;
    this.update();
  }
  show () {
    const {images} = this;
    this.viewer.style.display = 'flex';
    if (config.tivClickForNextImage && images.length > 1) {
      this.image.classList.add('click-enabled');
    } else {
      this.image.classList.remove('click-enabled');
    }
  }
  close () {
    this.viewer.style.display = 'none';
  }
}

module.exports = function imageViewer () {
  const viewer = new TDPImageViewer;
  const $ = window.$;
  $(document)
    .on('tiv-show-image', (event, parameter) => {
      if (!config.altImageViewer) {
        return;
      }
      viewer.images = parameter.images;
      viewer.index = parameter.index;
      viewer.update();
      viewer.show();
      // Image preload
      parameter.images.map(img => {
        const i = new Image;
        i.src = img.url;
        return i;
      });
    })
    .on('tiv-close', event => {
      viewer.close();
    })
    .on('keydown', event_ => {
      if (!config.altImageViewer) {
        return;
      }
      const event = event_.originalEvent;
      const activated = document.activeElement;
      if (activated.tagName === 'INPUT' || activated.tagName === 'TEXTAREA') {
        return;
      }
      const code = event.code;
      if (viewer.viewer.style.display === 'flex') {
        if (code === 'ArrowLeft') {
          event.preventDefault();
          event.stopImmediatePropagation();
          viewer.prev();
        } else if (code === 'ArrowRight') {
          event.preventDefault();
          event.stopImmediatePropagation();
          viewer.next();
        } else if (code === 'Escape') {
          event.preventDefault();
          event.stopImmediatePropagation();
          viewer.close();
        }
      } else {
        if (code === 'Space') {
          event.preventDefault();
          const preview = $('.is-selected-tweet a[rel=mediaPreview]');
          if (preview.length > 0) {
            preview.eq(0).click();
          }
        }
      }
    });
  $(document.body).on('click', 'a[rel=mediaPreview]', event => {
    if (!config.altImageViewer) {
      return;
    }
    const target = $(event.currentTarget);
    const videoOverlay = target.has('.video-overlay');
    if (videoOverlay.length !== 0) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    const container = target.parents('.js-media');
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
      if (url.indexOf('pbs.twimg.com') !== -1) {
        url = url.replace(/:small$/, ':orig');
      } else if (url.indexOf('ton/data/dm') !== -1) {
        url = url.replace(/:small$/, ':large');
      }
      parameter.images.push({
        index, url,
      });
    });
    $(document).trigger('tiv-show-image', parameter);
  });
};

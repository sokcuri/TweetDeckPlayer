/*
  * emojipad -- Emoji palette for easy emoji input
  * by Dalgona. <dalgona@hontou.moe> https://github.com/Dalgona
  */

const fs = require('fs');
const twemoji = require('twemoji');
const path = require('path');

module.exports = (function (win, doc) {
  const rootElement = doc.createElement('div');
  rootElement.className = 'emojipad';
  rootElement.innerHTML = '<header class="emoji-category"></header><div class="emoji-container"></div><div class="emoji-tabs"></div>';
  rootElement.onclick = e => e.stopPropagation();

  const me = {
    element: rootElement,
    show: (x, y) => {
      rootElement.style.display = 'inline-block';
      rootElement.style.left = `${x}px`;
      rootElement.style.top = `${y}px`;
    },
    hide: () => rootElement.style.display = 'none',
    onEmojiClick: chr => console.log('Not implemented: ' + chr),
    get isOpen () {
      return !(rootElement.style.display === 'none');
    },
  };

  const pathEmoji = path.join(__dirname, '/../emoji.json');
  const data = JSON.parse(fs.readFileSync(pathEmoji), 'utf8');
  for (const d of data) {
    d.data = d.data.map(x => {
      const chr = x.map(y => twemoji.convert.fromCodePoint(y)).join('');
      return twemoji.parse(chr);
    });
  }
  buildUI();

  function buildUI () {
    const container = rootElement.getElementsByClassName('emoji-container')[0];
    const tabContainer = rootElement.getElementsByClassName('emoji-tabs')[0];

    for (let i = 0; i < data.length; i++) {
      const divPage = doc.createElement('div');
      const divInner = doc.createElement('div');
      divPage.className = 'emoji-page';
      divPage.setAttribute('data-page-index', i);
      divPage.appendChild(divInner);
      container.appendChild(divPage);

      for (const e of data[i].data) {
        const divCell = doc.createElement('div');
        divCell.className = 'emoji-item';
        divCell.innerHTML = e;
        const img = divCell.getElementsByTagName('img')[0];
        if (img) {
          img.onclick = function (e) {
            me.onEmojiClick(e.currentTarget.alt);
          };
        }
        divCell.setAttribute('data-emoji', img && img.alt || '');
        divInner.appendChild(divCell);
      }

      const btnTab = doc.createElement('button');
      btnTab.className = 'emoji-tab';
      btnTab.innerHTML = twemoji.parse(data[i].icon);
      btnTab.onclick = e => activateTab(i);
      tabContainer.appendChild(btnTab);
    }

    activateTab(0);
    me.hide();
  }

  function activateTab (index) {
    const header = rootElement.getElementsByClassName('emoji-category')[0];
    const pages = rootElement.getElementsByClassName('emoji-page');
    const tabs = rootElement.getElementsByClassName('emoji-tab');

    header.innerHTML = data[index].name;
    for (const page of pages) page.classList.remove('active');
    for (const tab of tabs) tab.classList.remove('active');
    pages[index].classList.add('active');
    tabs[index].classList.add('active');

    const container = rootElement.getElementsByClassName('emoji-container')[0];
    container.className = 'emoji-container';
    if (index === 0) container.classList.add('first-tab');
    else if (index === (data.length - 1)) container.classList.add('last-tab');
  }

  return me;
})(window, document);

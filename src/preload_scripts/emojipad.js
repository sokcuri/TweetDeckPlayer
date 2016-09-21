module.exports = (function (win, doc, undefined) {
  /*
   * emojipad -- Emoji palette for easy emoji input
   * by Dalgona. <dalgona@hontou.moe> https://github.com/Dalgona
   */

  'use strict';
  const fs = require('fs');
  const twemoji = require('twemoji');
  const path = require('path');
  var data = JSON.parse(fs.readFileSync(path.join(__dirname, '/../emoji.json')), 'utf8');
  var rootElement = doc.createElement('div');
  rootElement.className = 'emojipad';
  rootElement.innerHTML = '<header class="emoji-category"></header><div class="emoji-container"></div><div class="emoji-tabs"></div>';
  rootElement.onclick = e => e.stopPropagation();

  var me = {
    element: rootElement,
    show: (x, y) => {
      rootElement.style.display = 'inline-block';
      rootElement.style.left = `${x}px`;
      rootElement.style.top = `${y}px`;
    },
    hide: () => {
      rootElement.style.display = 'none';
    },
    onEmojiClick: chr => console.log('Not implemented: ' + chr),
    get isOpen () {
      if (rootElement.style.display === 'none') return false;
      else return true;
    },
  };

  for (let d of data) {
    d.data = d.data.map(x => {
      let chr = x.map(y => twemoji.convert.fromCodePoint(y)).join('');
      return twemoji.parse(chr);
    });
  }
  buildUI();

  function buildUI () {
    var container = rootElement.getElementsByClassName('emoji-container')[0];
    var tabContainer = rootElement.getElementsByClassName('emoji-tabs')[0];

    for (let i = 0; i < data.length; i++) {
      var divPage = doc.createElement('div');
      var divInner = doc.createElement('div');
      divPage.className = 'emoji-page';
      divPage.setAttribute('data-page-index', i);
      divPage.appendChild(divInner);
      container.appendChild(divPage);

      for (let e of data[i].data) {
        var divCell = doc.createElement('div');
        divCell.className = 'emoji-item';
        divCell.innerHTML = e;
        var img = divCell.getElementsByTagName('img')[0];
        if (img) img.onclick = onEmojiClicked;
        divCell.setAttribute('data-emoji', img && img.alt || '');
        divInner.appendChild(divCell);
      }

      var btnTab = doc.createElement('button');
      btnTab.className = 'emoji-tab';
      btnTab.innerHTML = twemoji.parse(data[i].icon);
      btnTab.onclick = e => activateTab(i);
      tabContainer.appendChild(btnTab);
    }

    activateTab(0);
    me.hide();
  }

  function activateTab (index) {
    var header = rootElement.getElementsByClassName('emoji-category')[0];
    var pages = rootElement.getElementsByClassName('emoji-page');
    var tabs = rootElement.getElementsByClassName('emoji-tab');

    header.innerHTML = data[index].name;
    for (let page of pages) page.classList.remove('active');
    for (let tab of tabs)   tab.classList.remove('active');
    pages[index].classList.add('active');
    tabs[index].classList.add('active');

    var container = rootElement.getElementsByClassName('emoji-container')[0];
    container.className = 'emoji-container';
    if (index === 0) container.classList.add('first-tab');
    else if (index === data.length - 1) container.classList.add('last-tab');
  }

  function onEmojiClicked (e) {
    me.onEmojiClick(e.currentTarget.alt);
  }

  return me;
})(window, document);

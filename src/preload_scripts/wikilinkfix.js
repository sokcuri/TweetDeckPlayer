'use strict';
const Config = require('../config');

module.exports = () => {
  const linkFixObserver = new MutationObserver(mutations => {
    for (const { addedNodes } of mutations) {
      for (const node of addedNodes) {
        if (!node.querySelectorAll) continue;
        const links = node.querySelectorAll('a.url-ext');
        for (const link of links) {
          const fullurl = link.getAttribute('data-full-url');
          const namuwiki = /^https?:\/\/namu\.wiki\/w\/$/.test(fullurl);
          const rigvedawiki = /https?:\/\/rigvedawiki\.net\/w\/$/.test(fullurl);
          const wikipedia = /^https?:\/\/\w+\.wikipedia\.org\/wiki\/$/.test(fullurl);

          const isWiki = (namuwiki || rigvedawiki || wikipedia);
          if (isWiki) {
            const postfix = link.nextSibling;
            if (!postfix) continue;

            const querystring = postfix.textContent;
            if (/^\s/.test(querystring)) continue;
            querystring = querystring.split(' ')[0];
            postfix.textContent = postfix.textContent.replace(querystring, ' ');
            querystring = decodeURI(querystring);
            const fixedURL = `${fullurl}${encodeURI(querystring)}`;
            link.setAttribute('href', fixedURL);
            link.setAttribute('data-full-url', fixedURL);
            link.setAttribute('title', `${fixedURL}\n(fixed from "${querystring}")`);
            link.style.color = '#35d4c7';
            link.textContent = fixedURL;
          }
        }
      }
    }
  });

  linkFixObserver.observe(document.body, {
    //attributes: true,
    childList: true,
    //characterData: true,
    subtree: true,
  });
};

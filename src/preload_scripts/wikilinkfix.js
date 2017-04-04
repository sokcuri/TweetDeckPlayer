'use strict';
const Config = require('../config');

module.exports = () => {
  const linkFixObserver = new MutationObserver(mutations => {
    for (const mut of mutations) {
      const added = mut.addedNodes;
      for (const node of added) {
        if (!node.querySelectorAll) continue;
        const links = node.querySelectorAll('a.url-ext');
        for (const link of links) {
          const fullurl = link.getAttribute('data-full-url');
          const namuwiki = /^https?:\/\/namu\.wiki\/w\/$/.test(fullurl);
          const rigvedawiki = /https?:\/\/rigvedawiki\.net\/w\/$/.test(fullurl);
          const wikipedia = /^https?:\/\/\w+\.wikipedia\.org\/wiki\/$/.test(fullurl);
          if (namuwiki || rigvedawiki || wikipedia) {
            const postfix = link.nextSibling;
            if (postfix) {
              let querystring = postfix.textContent;
              if (/^\s/.test(querystring)) continue;
              querystring = querystring.split(' ')[0];
              postfix.textContent = postfix.textContent.replace(querystring, ' ');
              querystring = decodeURI(querystring);
              let fixedURL = `${fullurl}${encodeURI(querystring)}`;
              link.setAttribute('href', fixedURL);
              link.setAttribute('data-full-url', fixedURL);
              link.setAttribute('title', `${fixedURL}\n(fixed from "${querystring}")`);
              link.style.color = '#35d4c7';
              link.textContent = fixedURL;
            }
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

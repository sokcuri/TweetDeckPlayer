const electron = require('electron');
const {ipcRenderer} = electron;

// temporary
const _defs = [
  { _type: 'section', label: 'Display' },
  { _type: 'subsection', label: 'Window Options' },
  {
    _type: 'entry',
    name: 'defaultTopmost',
    valueType: 'bool',
    label: 'Always on Top as Default',
    description: 'If checked, TweetDeck Player window will be set to be always on top on startup.',
  },
  { _type: 'subsection', label: 'Display Font' },
  {
    _type: 'entry',
    name: 'customFonts',
    valueType: 'text',
    description: 'Leave it blank if you want to use the default font.',
  },
  { _type: 'subsection', label: 'Custom Column Width' },
  {
    _type: 'entry',
    name: 'applyCustomizeSlider',
    valueType: 'bool',
    label: 'Enabled',
  },
  {
    _type: 'entry',
    name: 'customizeColumnSize',
    valueType: 'number',
    min: 250,
    max: 600,
    step: 1,
  },
  { _type: 'subsection', label: 'Miscellaneous' },
  {
    _type: 'entry',
    name: 'useCircleProfileImage',
    valueType: 'bool',
    label: 'Circle Profile Image',
  },

  { _type: 'section', label: 'Timeline' },
  { _type: 'subsection', label: 'Word Filter' },
  {
    _type: 'entry',
    name: 'enableWordFilter',
    valueType: 'bool',
    label: 'Enable Word Filter',
  },
  {
    _type: 'entry',
    name: 'hideFilteredTweet',
    valueType: 'bool',
    label: 'Completely Hide Filtered Tweets',
  },
  {
    _type: 'entry',
    name: 'stripWhitespace',
    valueType: 'bool',
    label: 'Strip Whitespaces Before Filtering',
  },
  {
    _type: 'entry',
    name: 'filterUserName',
    valueType: 'bool',
    label: "Apply Filter to User's Name",
  },
  {
    _type: 'entry',
    name: 'filterWords',
    valueType: 'longtext',
    description: 'Enter one word per line. Words wrapped with slashes will be parsed as RegExp. (e.g. /spam/)<br>* <b>Requires reload to apply.</b>',
  },
  { _type: 'subsection', label: 'Tweaks' },
  {
    _type: 'entry',
    name: 'enableUnlinkis',
    valueType: 'bool',
    label: 'Enable Unlink.is',
    description: 'If turned on, ln.is(or linkis.com) URL will be converted to original URL.<br>* <b>Requires reload to apply.</b>',
  },
  {
    _type: 'entry',
    name: 'useStarForFavorite',
    valueType: 'bool',
    label: 'Show Stars on Favorited Tweets (instead of hearts)',
  },
  {
    _type: 'entry',
    name: 'openURLInInternalBrowser',
    valueType: 'bool',
    label: 'Open External URL with Internal Browser',
    description: "If turned on, External links will be opened with TweetDeck Player's browser window.<br>The default web browser will be used otherwise.",
  },
  {
    _type: 'entry',
    name: 'enableFastRetweet',
    valueType: 'bool',
    label: 'Enable Fast Retweet',
    description: 'Hold down the Shift key to open the retweet/quote dialog.',
  },
  {
    _type: 'entry',
    name: 'enterKeyTweet',
    valueType: 'bool',
    label: 'Press Enter Key to Tweet',
    description: 'Press Shift+Enter to insert a line break.',
  },
  { _type: 'subsection', label: 'Context Menu' },
  {
    _type: 'entry',
    name: 'enableOpenLinkinPopup',
    valueType: 'bool',
    label: 'Open Links in Popup',
  },
  {
    _type: 'entry',
    name: 'enableOpenImageinPopup',
    valueType: 'bool',
    label: 'Open Images in Popup',
  },
  { _type: 'subsection', label: 'GIF Autoplay' },
  {
    _type: 'entry',
    name: 'gifAutoplay',
    valueType: 'enum',
    options: [
      { value: 'default', label: 'Autoplay (Default)' },
      { value: 'mouseenter', label: 'Hover to Play' },
      { value: 'click', label: 'Click to Play' },
    ],
  },

  { _type: 'section', label: 'Performance' },
  { _type: 'subsection', label: 'Animation' },
  {
    _type: 'entry',
    name: 'minimizeScrollAnimForTweetSel',
    valueType: 'bool',
    label: 'Minimize Scroll Animation for Tweet Selection',
  },

  { _type: 'section', label: 'Experimental' },
  { _type: 'subsection', label: 'Auto Save' },
  {
    _type: 'entry',
    name: 'enableAutoSaveFav',
    valueType: 'bool',
    label: 'Save Favorited Image Automatically',
  },
  {
    _type: 'entry',
    name: 'autoSaveFavUrlName',
    valueType: 'bool',
    label: 'Rename Saved Image File as URL',
  },
  { _type: 'subsection', label: 'Path to Save' },
  {
    _type: 'entry',
    name: 'autoSavePath',
    valueType: 'text',
    description: "Default path is 'Favorited Images' under TweetDeck Player's directory.",
  },
  { _type: 'subsection', label: 'Image Viewer' },
  {
    _type: 'entry',
    name: 'altImageViewer',
    valueType: 'bool',
    label: 'Use Alternative Image Viewer',
  },
  {
    _type: 'entry',
    name: 'tivClickForNextImage',
    valueType: 'bool',
    label: 'Click the Image to Cycle Through Images',
    description: 'You can still move forward or backword through images using the buttons on top of the screen.',
  },
  { _type: 'subsection', label: 'Privacy' },
  {
    _type: 'entry',
    name: 'blockGoogleAnalytics',
    valueType: 'bool',
    label: 'Block Google Analytics',
    description: 'You should restart the app to apply this setting.',
  },
];

function saveConfig (config) {
  ipcRenderer.send('save-config', config);
}

function loadConfig () {
  return ipcRenderer.sendSync('load-config');
}

var config;

function onload () {
  initializeComponents();

  config = loadConfig();
  var wrapper = document.getElementById('wrapper');
  // 트윗덱 테마를 바탕으로 설정창 테마 변경.
  var theme = ipcRenderer.sendSync('request-theme');
  if (theme === 'dark') {
    wrapper.classList.add('dark');
  }

  var settingsTop = wrapper.getElementsByClassName('top')[0];
  var settingsMain = wrapper.getElementsByTagName('main')[0];
  var topHeight = window.getComputedStyle(settingsTop).height;
  settingsMain.style.marginTop = topHeight;
  settingsMain.style.height = `calc(100% - ${topHeight})`;

  // 로딩한 config를 바탕으로 input/textarea의 값을 세팅한다.
  for (let key of Object.keys(config)) {
    let value = config[key];
    let elem = document.getElementById(key);
    if (!elem) continue;
    if (elem.type === 'checkbox') {
      elem.checked = Boolean(value);
    } else {
      elem.value = value;
    }
  }
  let settingForm = document.getElementById('settingform');

  var save = event => {
    let settingElements = settingForm.querySelectorAll('input, textarea, select');
    for (let elem of settingElements) {
      let id = elem.id;
      let value = elem.value;
      if (id === '') continue;
      if (typeof value === 'string') {
        value = value.trim();
      }
      if (elem.type === 'checkbox') {
        config[id] = elem.checked ? value : null;
      } else {
        config[id] = value;
      }
    }
    saveConfig(config);
    ipcRenderer.send('apply-config');
  };

  window.addEventListener('beforeunload', save);
  settingForm.addEventListener('change', save);
}

document.addEventListener('DOMContentLoaded', onload);
window.addEventListener('beforeunload', () => {
  saveConfig(config);
});

function initializeComponents () {
  let form = document.querySelector('#settingform > section');
  for (let obj of _defs) {
    switch (obj._type) {
      case 'section': {
        let e = document.createElement('header');
        e.innerHTML = `<span>${obj.label}</span>`;
        form.appendChild(e);
      } break;
      case 'subsection': {
        let e = document.createElement('div');
        e.className = 'settings-item sub-header';
        e.innerHTML = obj.label;
        form.appendChild(e);
      } break;
      case 'entry':
        initializeEntries(obj, form);
        break;
      default:
        form.appendChild((() => {
          let e = document.createElement('div');
          e.className = 'settings-item';
          e.innerHTML = obj.name;
          return e;
        })());
        break;
    }
  }
}

function initializeEntries(entry, form) {
  switch (entry.valueType) {
//    case 'bool': {
//    } break;
    default:
      form.appendChild((() => {
        let e = document.createElement('div');
        e.className = 'settings-item';
        e.innerHTML = entry.valueType + ' ' + entry.name;
        return e;
      })());
      break;
  }
}

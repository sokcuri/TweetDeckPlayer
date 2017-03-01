const electron = require('electron');
const {app} = electron;
const fs = require('fs');
const path = require('path');
const Util = require('./util');

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

/*
List of all settings item
section "Display" {
  section "Window Options" {
    bool defaultTopmost "Always on Top as Default"
      """If checked, TweetDeck Player window will be set to be always on top on startup."""
  }
  section "Display Font" {
    string customFonts ""
      """Leave it blank if you want to use the default font."""
  }
  section "Custom Column Width" {
    bool applyCustomizeSlider "Enabled"
    integer customizeColumnSize "" 250 600 1 // min max step
  }
  section "Misc." {
    bool useCircleProfileImage "Circle Profile Image"
  }
}
section "Timeline" {
  section "Word Filter" {
    bool enableWordFilter "Enable Word Filter"
    bool hideFilteredTweet "Completely Hide Filtered Tweets"
    bool stripWhitespace "Strip Whitespace before filtering"
    bool filterUserName "Apply Filter to User's Name"
    string filterWords ""
      """Enter one word per line. Word that wrapped with slashes will be parsed as RegExp. (e.g. /spam/)<br>
      * <b>Requires reload to apply.</b>"""
  }
  section "Tweaks" {
    bool enableUnlinkis "Enable Unlink.is"
      """If turned on, ln.is(or linkis.com) URL will be converted to original URL.<br>
      * <b>Requires reload to apply.</b>"""
    bool useStarForFavorite "Show Stars on Favorited Tweets (instead of hearts)
    bool openURLInInternalBrowser "Open External URL in Internal Browser"
      """If turned on, External Link will be opened in TweetDeck Player's browser window.<br>
      the default web browser will be used otherwise."""
    bool enableFastRetweet "Enable Fast Retweet"
      """Hold down the Shift key to open the retweet/quote dialog."""
    bool enterKeyTweet "Press Enter Key to Tweet"
      """Press Shift+Enter to insert a line break."""
  }
  section "Context Menu" {
    bool enableOpenLinkinPopup "Open Link in Popup"
    bool enableOpenImageinPopup "Open Image in Popup"
  }
  section "GIF Autoplay" {
    enum gifAutoplay "" {
      default "Autoplay (Default)"
      mouseenter "Hover to play"
      click "Click to play"
    }
  }
}
section "Performance" {
  section "Animation" {
    bool minimizeScrollAnimForTweetSel "Minimize Scroll Animation for Tweet Selection"
  }
}
section "Experimental" {
  section "Auto Save" {
    bool enableAutoSaveFav "Save Favorited Image Automatically"
    bool autoSaveFavUrlName "Save Image File Name by URL"
  }
  section "Path to Save" {
    string autoSavePath ""
      """Default path is 'Favorited Images' under TweetDeck Player's directory."""
  }
  section "Image Viewer" {
    bool altImageViewer "Use Alternative Image Viewer"
    bool tivClickForNextImage "Click the Image to Cycle Through Images"
      """You can still move forward or backword through images using the buttons on top of the screen."""
  }
  section "Privacey" {
    bool blockGoogleAnalytics "Block Google Analytics"
      """You should restart the app to apply this setting."""
  }
}
*/

module.exports = {
  // 설정파일 로드
  _filePath: Util.getUserDataPath() + '/config.json',
  _defaultConfig: {
    twColorMention: '#cb4f5f',
    twColorHashtag: '#2b7bb9',
    twColorURL: '#a84dba',
    customizeColumnSize: '310',
    quoteServer: 'https://quote.sapphire.sh',
    altImageViewer: 'on',
    tivClickForNextImage: 'on',
    enableOpenLinkinPopup: 'on',
    enableOpenImageinPopup: 'on',
    useCircleProfileImage: false,
  },
  data: {},
  load () {
    var config = this._defaultConfig;
    var userConfig = {};
    var fc = fs.constants; // shortcut
    try {
      fs.accessSync(this._filePath, (fc.F_OK | fc.R_OK | fc.W_OK));
      userConfig = JSON.parse(fs.readFileSync(this._filePath, 'utf8'));
    } catch (e) {
      userConfig = {};
    }
    Object.assign(config, userConfig);

    this.data = config;
    return config;
  },
  // 설정파일 저장
  save () {
    const jsonStr = JSON.stringify(this.data, null, 2);
    fs.writeFileSync(this._filePath, jsonStr, 'utf8');
  },
};

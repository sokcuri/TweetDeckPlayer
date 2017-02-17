const electron = require('electron');
const {app} = electron;
const fs = require('fs');
const path = require('path');
const Util = require('./util');

module.exports = {
  // 설정파일 로드
  _filePath: Util.getUserDataPath() + '/config.json',
  _defaultConfig: {},
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

    // default value
    if (!config.twColorMention) {
      config.twColorMention = '#cb4f5f';
    }
    if (!config.twColorHashtag) {
      config.twColorHashtag = '#2b7bb9';
    }
    if (!config.twColorURL) {
      config.twColorURL = '#a84dba';
    }
    if (!config.customizeColumnSize) {
      config.customizeColumnSize = '310';
    }
    if (!config.quoteServer) {
      config.quoteServer = 'https://quote.sapphire.sh';
    }
    if (!config.hasOwnProperty('altImageViewer')) {
      config.altImageViewer = 'on';
    }
    if (!config.hasOwnProperty('enableOpenLinkinPopup')) {
      config.enableOpenLinkinPopup = 'on';
    }
    if (!config.hasOwnProperty('enableOpenImageinPopup')) {
      config.enableOpenImageinPopup = 'on';
    }

    this.data = config;
    return config;
  },
  // 설정파일 저장
  save () {
    const jsonStr = JSON.stringify(this.data, null, 2);
    fs.writeFileSync(this._filePath, jsonStr, 'utf8');
  },
};

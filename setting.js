const electron = require('electron');
const {ipcRenderer} = electron;

function saveConfig (config) {
  ipcRenderer.send('save-config', config);
}

function loadConfig () {
  return ipcRenderer.sendSync('load-config');
}

var config;

function onload () {
  config = loadConfig();
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
  settingForm.addEventListener('change', event => {
    let settingElements = settingForm.querySelectorAll('input, textarea');
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
  });
}

document.addEventListener('DOMContentLoaded', onload);
window.addEventListener('beforeunload', () => {
  saveConfig(config);
});

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
  var wrapper = document.getElementById('wrapper');
  // 트윗덱 테마를 바탕으로 설정창 테마 변경.
  var theme = ipcRenderer.sendSync('request-theme');
  if (theme === 'dark')
    wrapper.classList.add('dark');

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
    ipcRenderer.send('apply-config');
  };

  window.addEventListener('beforeunload', save);
  settingForm.addEventListener('change', save);
}

document.addEventListener('DOMContentLoaded', onload);
window.addEventListener('beforeunload', () => {
  saveConfig(config);
});

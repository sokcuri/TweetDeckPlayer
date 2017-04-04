const electron = require('electron');
const noUiSlider = require('nouislider');
const {ipcRenderer} = electron;

const schema = require('./config-schema');

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
  for (let obj of schema) {
    switch (obj._type) {
      case 'section':
        var e = document.createElement('header');
        e.innerHTML = `<span>${obj.label}</span>`;
        form.appendChild(e);
        break;
      case 'subsection':
        var e = document.createElement('div');
        e.className = 'settings-item sub-header';
        e.innerHTML = obj.label;
        form.appendChild(e);
        break;
      case 'entry':
        initializeEntries(obj, form);
        break;
      default:
        console.warn(`Unrecognized item type: '${obj._type}'`);
        break;
    }
  }
}

function initializeEntries (entry, form) {
  let e = document.createElement('div');
  e.className = 'settings-item';

  switch (entry.valueType) {
    case 'bool':
      e.innerHTML = `<label><input type="checkbox" id="${entry.name}"><label for="${entry.name}"><div></div></label>${entry.label}</label>`;
      break;
    case 'text':
      e.innerHTML = `<input type="text" id="${entry.name}">`;
      break;
    case 'longtext':
      e.innerHTML = `<textarea id="${entry.name}" rows="5"></textarea>`;
      break;
    case 'enum':
      let opts = entry.options.map(x => `<option value="${x.value}">${x.label}</option>`).join('');
      e.innerHTML = `<select name="${entry.name}" id="${entry.name}">${opts}</select>`;
      break;
    case 'number': {
      e.innerHTML = `<div id="${entry.name}Slider"></div><div><input type="text" id="${entry.name}"></div>`;
      let slider = e.querySelector(`#${entry.name}Slider`);
      let text = e.querySelector(`#${entry.name}`);
      createSlider(entry, slider, text);
    } break;
    default:
      console.warn(`Unrecognized entry value type: '${entry.valueType}'`);
      break;
  }
  form.appendChild(e);

  if (entry.description) {
    let e = document.createElement('div');
    e.className = 'settings-item description' + (entry.valueType === 'bool' ? ' for-checkbox' : '');
    e.innerHTML = entry.description;
    form.appendChild(e);
  }
}

function createSlider (entry, slider, text) {
  noUiSlider.create(slider, {
    start: [ require('./config').load()[entry.name] || 0 ],
    step: entry.step,
    range: {
      min: [ entry.min ],
      max: [ entry.max ],
    },
    format: {
      to (value) {
        return Math.floor(value);
      },
      from (value) {
        return value;
      },
    },
  });
  var tTime;
  slider.noUiSlider.on('update', (values, handle) => {
    text.value = values[handle];
    if (!tTime || tTime + 100 < new Date().getTime()) {
      var event = new Event('change');
      var settingForm = document.getElementById('settingform');
      settingForm.dispatchEvent(event);
      tTime = new Date().getTime();
    }
  });
  text.addEventListener('change', e => {
    slider.noUiSlider.set(e.target.value);
  });
}

const {ipcRenderer, remote} = require('electron');
const noUiSlider = require('nouislider');

const schema = require('./config-schema');
const path = require('path');
const fs = require('fs');
const Util = require('./util');

const vex = require('vex-js');
vex.registerPlugin(require('vex-dialog'));
vex.defaultOptions.className = 'vex-theme-os';

function saveConfig (config) {
  ipcRenderer.send('save-config', config);
}

function loadConfig () {
  return ipcRenderer.sendSync('load-config');
}

let config;
let cloudSaveFlag = false;
let saveFunction;

function onload () {
  initializeComponents();

  config = loadConfig();
  const wrapper = document.getElementById('wrapper');
  // 트윗덱 테마를 바탕으로 설정창 테마 변경.
  const theme = ipcRenderer.sendSync('request-theme');
  if (theme === 'dark') {
    wrapper.classList.add('dark');
  }

  const settingsTop = wrapper.getElementsByClassName('top')[0];
  const settingsMain = wrapper.getElementsByTagName('main')[0];
  const topHeight = window.getComputedStyle(settingsTop).height;
  settingsMain.style.marginTop = topHeight;
  settingsMain.style.height = `calc(100% - ${topHeight})`;

  // 로딩한 config를 바탕으로 input/textarea의 값을 세팅한다.
  for (const key of Object.keys(config)) {
    const value = config[key];
    const elem = document.getElementById(key);
    if (!elem) continue;
    if (elem.type === 'checkbox') {
      elem.checked = Boolean(value);
    } else if (elem.type === 'file') {

    } else {
      elem.value = value;
    }
  }
  const settingForm = document.getElementById('settingform');

  const save = event => {
    if (cloudSaveFlag) {
      return;
    }
    const settingElements = settingForm.querySelectorAll('input, textarea, select');
    for (const elem of settingElements) {
      let value = elem.value;

      const isNotId = (elem.id === '');
      if (isNotId) continue;
      if (typeof value === 'string') {
        value = value.trim();
      }
      if (elem.type === 'file') {
        if (!(elem.files && elem.files.length > 0)) continue;
        if (elem.id !== 'notiAlarmSoundSource') {
          console.info(elem.files[0].path);
          config[elem.id] = elem.files[0];
          continue;
        }
        // check to valid sound file
        try {
          const blobUrl = URL.createObjectURL(document.querySelector('input[type="file"]').files[0]);
          const audio = new Audio(blobUrl);
          audio.addEventListener('canplaythrough', () => {
            URL.revokeObjectURL(blobUrl);
            audio.remove();
            const ext = elem.files[0].name.substr(elem.files[0].name.lastIndexOf('.'));
            fs.createReadStream(elem.files[0].path).pipe(fs.createWriteStream(path.join(Util.getUserDataPath(), 'alarmfile')))
              .on('error', function (e) {
                vex.dialog.alert({ message: 'Cannot copy audio file'} );
              });
            vex.dialog.alert({ message: 'Successfully registered alarm file'} );
            config['notiAlarmSoundExt'] = ext;
            elem.value = '';
          });
          audio.addEventListener('error', e => {
            vex.dialog.alert({ message: 'Invalid or not supported audio file'} );
            URL.revokeObjectURL(blobUrl);
            audio.remove();
            elem.value = '';
          });
        } catch (e) {
          /* eslint-disable quotes */
          vex.dialog.alert({ message: 'Can\'t load file'} );
          URL.revokeObjectURL(blobUrl);
          elem.value = '';
        }
      } else if (elem.type === 'checkbox') {
        config[elem.id] = elem.checked ? value : null;
      } else {
        config[elem.id] = value;
      }
    }
    saveConfig(config);
    ipcRenderer.send('apply-config');
  };

  window.addEventListener('beforeunload', save);
  settingForm.addEventListener('change', save);
  saveFunction = save;
}

document.addEventListener('DOMContentLoaded', onload);
window.addEventListener('beforeunload', () => saveConfig(config));

function initializeComponents () {
  const form = document.querySelector('#settingform > section');
  for (const obj of schema) {
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
  const e = document.createElement('div');
  e.className = 'settings-item';

  const { name, label } = entry;

  switch (entry.valueType) {
    case 'bool':
      e.innerHTML = `<label><input type="checkbox" id="${name}"><label for="${name}"><div></div></label>${label}</label>`;
      break;
    case 'text':
      e.innerHTML = `<input type="text" id="${name}">`;
      break;
    case 'longtext':
      e.innerHTML = `<textarea id="${name}" rows="5"></textarea>`;
      break;
    case 'enum':
      const opts = entry.options.map(x => `<option value="${x.value}">${x.label}</option>`).join('');
      e.innerHTML = `<select name="${name}" id="${name}">${opts}</select>`;
      break;
    case 'alarmfile':
      e.innerHTML = `<label><input id="${name}" type="file"><label for="${name}"><div></div></label><div>${label}</div></label>`;
      // const fileInput = e.querySelector('input[type="file"]');
      break;
    case 'number': {
      e.innerHTML = `<div id="${name}Slider"></div><div><input type="text" id="${name}"></div>`;
      const slider = e.querySelector(`#${name}Slider`);
      const text = e.querySelector(`#${name}`);
      createSlider(entry, slider, text);
    } break;
    case 'button':
    {
      e.innerHTML = `<label><input id="${name}" type="button"><label for="${name}"><div></div></label><div>${label}</div></label>`;

      if (name === 'cloudLoadConfig') {
        e.addEventListener('click', (e) => {
          e.preventDefault();
          const c = ipcRenderer.sendSync('cloud-load-config');
          const r = JSON.parse(c) || {};
          if (r && Array.prototype.toString.call(r) === '[object Object]' && r.saved_timestamp) {
            vex.dialog.confirm({
              unsafeMessage: `The settings are restored to the backup saved in the cloud storage.<br /><br />WARNING : ALL SETTINGS INCLUDING REGULAR EXPRESSION MUTE SETTINGS WILL BE CHANGED.<br />THIS ACTION CAN'T REVERT, TAKE CARE.${r.saved_timestamp ? `<br /><br />Latest saved: ${new Date(r.saved_timestamp)} ${(r.saved_title) ? `(${r.saved_title})` : ''}` : ``}`,
              callback: function (value) {
                if (value) { // yes
                  cloudSaveFlag = true;
                  config = r;
                  saveConfig(config);
                  ipcRenderer.send('apply-config');
                  vex.dialog.alert({ message: 'Config Restored.', callback: function () { remote.getCurrentWindow().reload(); }} );
                } else { // no
                  //vex.dialog.alert({ message: 'User canceled.'} );
                }
              }
            });
          } else {
            vex.dialog.alert({ message: 'No setting stored. Notting changed.'} );
          }
        });
      } else if (name === 'cloudSaveConfig') {
        e.addEventListener('click', (e) => {
          e.preventDefault();

          const c = ipcRenderer.sendSync('cloud-load-config');
          const r = JSON.parse(c) || {};
          let timestamp = '';
          if (r.saved_timestamp) {
            timestamp = '<br /><br />' + r.saved_timestamp;
          }

          vex.dialog.prompt({
            unsafeMessage: `Do you really want to save the settings?<br />If you have already stored settings, it will be overwritten.${r.saved_timestamp ? `<br /><br />Latest saved: ${new Date(r.saved_timestamp)} ${(r.saved_title) ? `(${r.saved_title})` : ''}` : ``}`,
            callback: function (value) {
              if (value !== false) { // yes
                saveFunction();
                saveConfig(config);
                const result = ipcRenderer.sendSync('cloud-save-config', value);
                if (result) {
                  vex.dialog.alert({ message: 'Successfully saved on cloud.'} );
                } else {
                  vex.dialog.alert({ message: 'Config Save failed.'} );
                }
              } else { // no
                //vex.dialog.alert({ message: 'User canceled.'} );
              }
            }
          });

        });
      } else if (name === 'cloudRemoveConfig') {
        e.addEventListener('click', (e) => {
          e.preventDefault();
          const c = ipcRenderer.sendSync('cloud-load-config');
          const r = JSON.parse(c) || {};
          if (r && Array.prototype.toString.call(r) === '[object Object]' && r.saved_timestamp) {
            vex.dialog.confirm({
              unsafeMessage: `Are you sure you want to delete the data on cloud storage? Deleting data will not delete local settings.${r.saved_timestamp ? `<br /><br />Latest saved: ${new Date(r.saved_timestamp)} ${(r.saved_title) ? `(${r.saved_title})` : ''}` : ``}`,
              callback: function (value) {
                if (value) { // yes
                  saveFunction();
                  saveConfig(config);
                  const result = ipcRenderer.sendSync('cloud-remove-config', value)
                  if (result) {
                    vex.dialog.alert({ message: 'Successfully removed data on cloud.'} );
                  } else {
                    vex.dialog.alert({ message: 'Remove failed.'} );
                  }
                } else { // no
                  //vex.dialog.alert({ message: 'User canceled.'} );
                }
              }
            });
          } else {
            vex.dialog.alert({ message: 'No setting stored. Notting changed.'} );
          }
        });
      } 
    }
    break;
    default:
      console.warn(`Unrecognized entry value type: '${entry.valueType}'`);
      break;
  }
  form.appendChild(e);

  if (entry.description) {
    const description = (entry.valueType === 'bool') ? ' for-checkbox' : '';
    const e = document.createElement('div');
    e.className = 'settings-item description' + description;
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
  let tTime;
  slider.noUiSlider.on('update', (values, handle) => {
    text.value = values[handle];
    if (!tTime || tTime + 100 < new Date().getTime()) {
      const event = new Event('change');
      const settingForm = document.getElementById('settingform');
      settingForm.dispatchEvent(event);
      tTime = new Date().getTime();
    }
  });
  text.addEventListener('change', e => {
    slider.noUiSlider.set(e.target.value);
  });
}

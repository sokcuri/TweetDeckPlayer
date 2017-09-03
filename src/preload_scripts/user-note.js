const fs = require('mz/fs');
const path = require('path');
const _ = require('lodash');
const Util = require('../util');
const Config = require('../config');
const insertStyle = require('./playermonkey').GM_addStyle;

const config = Config.load();
const dataPath = Util.getUserDataPath();

const UserNote = {
  // 설정파일 로드
  _filePath: path.join(dataPath, '/usernote.json'),
  async loadFile () {
    let notes;
    try {
      const json = await fs.readFile(this._filePath, 'utf8');
      notes = JSON.parse(json);
    } catch (e) {
      notes = {};
    }
    return notes;
  },
  saveFile (newData) {
    const json = JSON.stringify(newData, null, 2);
    return fs.writeFileSync(this._filePath, json, 'utf8');
  },
  async load (userID) {
    const notes = await this.loadFile();
    const note = String(notes[userID] || '').trim();
    return note;
  },
  // 설정파일 저장
  async save (userID, newnote) {
    const notes = await this.loadFile();
    notes[userID] = newnote;
    return this.saveFile(notes);
  },
};

class UserNoteUI {
  constructor (root) {
    this.root = root;
    this.textarea = root.querySelector('textarea.user-note-area');
    this.loading = root.querySelector('.user-note-loading');
    const inputListener = event => {
      const newNote = this.textarea.value;
      UserNote.save(this.currentUserID, newNote);
    };
    this.textarea.addEventListener('input', _.debounce(inputListener, 200));
  }
  async load (userID) {
    const { textarea, loading } = this;
    textarea.disabled = true;
    loading.classList.remove('loaded');
    this.currentUserID = userID;
    //debugger;
    const note = await UserNote.load(userID);
    textarea.value = note;
    textarea.disabled = false;
    loading.classList.add('loaded');
  }
  //save () {}
}

// ======================================================================

// 트위터상에서 유저네임은 자유롭게 바꿀 수 있으므로
// 노트는 유저네임 대신 ID를 기준으로 하여 작성함

// 트위터 프로필 modal에 사용자 고유 ID를 포함하게 만듦
const TEMPLATE_HACK_HTML = `
  {{#twitterProfile}}
    {{#profile}}
      <span hidden class="user-id" style="display:none">
        {{id}}
      </span>
    {{/profile}}
  {{/twitterProfile}}
`;

const USER_NOTE_HTML = `
  <div id="user-note-app">
    <div class="user-note-control">
      User Note: <span class="user-note-loading">(Loading...)</span>
    </div>
    <textarea class="user-note-area" placeholder="여기에 사용자별 노트를 작성할 수 있습니다. 여기에 적은 내용은 다른 트위터 유저에게 노출되지 않습니다.">
    </textarea>
  </div>
`;

const USER_NOTE_CSS = `
  #user-note-app {
    padding: 3px;
    font-size: 12pt;
    background-color: #e1e8ed;
    color: #292f33;
  }
  .user-note-area {
    height: 80px;
  }
  .user-note-control {
    margin: 3px;
    font-size: 10pt;
  }
  .user-note-loading.loaded {
    display: none;
  }
`;

module.exports = () => {
  insertStyle(USER_NOTE_CSS);
  window.TD_mustaches['twitter_profile.mustache'] += TEMPLATE_HACK_HTML;
  const observeMe = document.querySelector('.js-modals-container');
  const observer = new MutationObserver(mutations => {
    if (!config.enableUserNotes) {
      return;
    }
    for (const mut of mutations) {
      for (const node of mut.addedNodes) {
        if (!node.className) continue;
        if (document.getElementById('user-note-app')) continue;
        let userID;
        const userIDElement = node.querySelector('.user-id');
        if (node.matches('.user-id')) {
          userID = node.textContent.trim();
        } else if (userIDElement) {
          userID = userIDElement.textContent.trim();
        }
        if (!userID) continue;
        const appContainer = document.createElement('div');
        appContainer.innerHTML = USER_NOTE_HTML;
        window.$('.prf-header').after(appContainer);
        const app = new UserNoteUI(appContainer);
        app.load(userID);
      }
    }
  });
  observer.observe(observeMe, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  });
};

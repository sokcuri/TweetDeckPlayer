const electron = require('electron');
const {app, BrowserWindow, dialog, session, Menu, MenuItem, ipcMain, shell} = electron;
const fs = require('fs');
const path = require('path');
const request = require('request');
const child_process = require('child_process');
const Util = require('./util');

// set to userdata folder
app.setPath('userData', Util.getUserDataPath());

// 설정
const Config = require('./config');

let win, popup, settingsWin, twtlibWin, accessibilityWin;

function getSamePos (x, y) {
  for (var i = 0; i < Math.max(x.length, y.length); i++) {
    if (i === x.length || i === y.length || x[i] !== y[i]) {
      return i;
    }
  }
}

ipcMain.on('load-config', (event, arg) => {
  var config = Config.load();
  event.returnValue = config;
});

ipcMain.on('save-config', (event, config) => {
  Config.data = config;
  Config.save();
});

ipcMain.on('apply-config', (event, config) => {
  try {
    win.webContents.send('apply-config');
  } catch (e) { }
});

ipcMain.on('request-theme', event => {
  try {
    win.webContents.executeJavaScript(
      '(()=>{var x=document.querySelector("meta[http-equiv=Default-Style]");return x&&x.content||"light";})()',
      false,
      theme => {
        event.returnValue = theme;
      }
    );
  } catch (e) { }
});

ipcMain.on('open-settings', event => {
  openSetting(win);
});


// global keyState
global.keyState = {};
global.keyState.shift = false;
global.keyState.ctrl = false;
global.keyState.alt = false;

// 프로그램 시작시 설정파일을 로드
Config.load();

// 프로그램의 중복실행 방지
var existInst = app.makeSingleInstance((commandLine, workingDirectory) => {
  // 새로운 인스턴스가 실행되었을 때 기존 프로그램의 작동
  if (win) {
    win.show();
    win.focus();
  }
});

// 인스턴스가 존재하는 경우 프로그램 종료
if (existInst) {
  app.quit();
}

// 렌더러 프로세스가 죽었을때 이벤트
app.on('gpu-process-crashed', () => {

});

// setting window
var openSetting = window => {
  if (settingsWin) {
    settingsWin.focus();
    return;
  }
  var width = 500;
  var height = 620;
  var b = win.getBounds();
  var x = Math.floor(b.x + (b.width - width) / 2);
  var y = Math.floor(b.y + (b.height - height) / 2);
  settingsWin = new BrowserWindow({
    width, height, x, y,
    parent: win,
    icon: path.join(__dirname, 'tweetdeck.ico'),
    modal: false,
    show: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  settingsWin.on('close', () => {
    settingsWin = null;
  });
  settingsWin.loadURL('file:///' + path.join(__dirname, 'setting.html'));
};

var openPopup = url => {
  var preference = (Config.data && Config.data.popup_bounds) ? Config.data.popup_bounds : {};
  preference.icon = path.join(__dirname, 'tweetdeck.ico');
  preference.modal = false;
  preference.show = true;
  preference.autoHideMenuBar = true;
  preference.webPreferences = {
    nodeIntegration: false,
    webSecurity: true,
    preload: path.join(__dirname, 'preload_popup.js'),
  };
  popup = new BrowserWindow(preference);
  popup.on('close', e => {
    Config.load();
    if (popup) {
      e.sender.hide();
      if (e.sender.isMaximized()) {
        e.sender.unmaximize();
      }
      if (e.sender.isFullScreen()){
        e.sender.setFullScreen(false);
      }

      Config.data.popup_bounds = popup.getBounds();
    }
    Config.save();
    popup = null;
  });
  popup.webContents.on('new-window', (e, url) => {
    e.preventDefault();
    shell.openExternal(url);
  });
  popup.loadURL(url);
  popup.setAlwaysOnTop(win.isAlwaysOnTop());
};

//
// edit
//
var sub_cut = webContents => ({
  label: 'Cut',
  click () {
    webContents.send('command', 'cut');
  },
});
var sub_copy = webContents => ({
  label: 'Copy',
  click () {
    webContents.send('command', 'copy');
  },
});
var sub_paste = webContents => ({
  label: 'Paste',
  click () {
    webContents.send('command', 'paste');
  },
});
var sub_delete = webContents => ({
  label: 'Delete',
  click () {
    webContents.send('command', 'delete');
  },
});
var sub_selectall = webContents => ({
  label: 'Select All',
  click () {
    webContents.send('command', 'selectall');
  },
});

//
// page control
//

var sub_back_page = webContents => ({
  label: 'Back',
  click () {
    webContents.send('command', 'back');
  },
  enabled: webContents.canGoBack(),
});
var sub_forward_page = webContents => ({
  label: 'Forward',
  click () {
    webContents.send('command', 'forward');
  },
  enabled: webContents.canGoForward(),
});
var sub_reload = webContents => ({
  label: 'Reload',
  click () {
    webContents.send('command', 'reload');
  },
});
//
// setting
//
var sub_alwaystop = window => ({
  label: 'Always on top',
  type: 'checkbox',
  checked: window.isAlwaysOnTop(),
  click () {
    var flag = !window.isAlwaysOnTop();
    window.setAlwaysOnTop(flag);
    if (popup) popup.setAlwaysOnTop(flag);
  },
});

var sub_setting = window => ({
  label: 'Setting',
  click () {
    openSetting();
  },
});

//
// image
//
var sub_copy_img = webContents => ({
  label: 'Copy image',
  click () {
    webContents.send('command', 'copyimage');
  },
});
var sub_save_img = (webContents, Addr) => ({
  label: 'Save image as..',
  click () {
    // 원본 해상도 이미지 경로를 가져온다
    var path = Util.getOrigPath(Addr.img);
    var filename = Util.getFileName(path);
    var ext = Util.getFileExtension(path);
    var filters = [];

    // Save dialog에 들어갈 파일 필터 정의
    switch (ext) {
      case 'jpg':
        filters.push({name: 'JPG File', extensions: ['jpg']});
        break;
      case 'png':
        filters.push({name: 'PNG File', extensions: ['png']});
        break;
      case 'gif':
        filters.push({name: 'GIF File', extensions: ['gif']});
        break;
      default:
        filters.push({name: ext.toUpperCase() + ' File', extensions: [ext.toLowerCase()]});
    }
    filters.push({name: 'All Files', extensions: ['*']});

    // 모든 포인터 이벤트를 잠시 없앤다
    webContents.send('no-pointer', true);

    // Save Dialog를 띄운다
    var savepath = dialog.showSaveDialog({
      defaultPath: filename,
      filters: filters,
    });

    // 포인터 이벤트를 되살린다
    webContents.send('no-pointer', false);

    // savepath가 없는 경우 리턴
    if (typeof savepath === 'undefined') return;

    // http 요청을 보내고 저장
    request(path).pipe(fs.createWriteStream(savepath));
  },
});
var sub_copy_img_url = webContents => ({
  label: 'Copy image URL',
  click () {
    webContents.send('command', 'copyimageurl');
  },
});
var sub_open_img = webContents => ({
  label: 'Open image in browser',
  click () {
    webContents.send('command', 'openimage');
  },
});
var sub_open_img_popup = webContents => ({
  label: 'Open image in popup',
  click () {
    webContents.send('command', 'openimagepopup');
  },
});
var sub_search_img_google = webContents => ({
  label: 'Search image with Google',
  click () {
    webContents.send('command', 'googleimage');
  },
});

//
// link
//
var sub_open_link = webContents => ({
  label: 'Open link',
  click () {
    webContents.send('command', 'openlink');
  },
});

var sub_open_link_popup = webContents => ({
  label: 'Open link in Popup',
  click () {
    webContents.send('command', 'openlinkpopup');
  },
});

var sub_save_link = (webContents, Addr) => ({
  label: 'Save link as..',
  click () {
    // 될 수 있으면 원본 화질의 이미지를 가져온다
    var path = Util.getOrigPath(Addr.link);
    var filename = Util.getFileName(path);
    var ext = Util.getFileExtension(path);
    var filters = [];

    // 리퀘스트를 때려서 해당 링크의 MIME TYPE을 얻어온다
    let reqOption = {
      method: 'HEAD',
      followAllRedirects: true, // 리다이렉트 따라가기 켬
      url: path,
    };
    request(reqOption, (error, response, body) => {
        // 에러가 발생하면 동작하지 않음
      if (error) return;
        // 컨텍스트 타입이 text/html인 경우 htm을 붙이고 필터에 추가
      if (response.headers['content-type'] &&
          response.headers['content-type'].toLowerCase().search('text/html') !== -1) {
        filename += '.htm';
        filters.push({
          name: 'HTML Document',
          extensions: ['htm'],
        });
      }
      filters.push({
        name: 'All Files',
        extensions: ['*'],
      });

        // 모든 포인터 이벤트를 잠시 없앤다
      webContents.send('no-pointer', true);

        // 저장 다이얼로그를 띄운다
      var savepath = dialog.showSaveDialog({
        defaultPath: filename,
        filters: filters,
      });

        // 포인터 이벤트를 되살린다
      webContents.send('no-pointer', false);

      if (typeof savepath === 'undefined') return;

        // http 요청해서 링크를 저장
      var req_url = response.request.uri.href;
      request(req_url).pipe(fs.createWriteStream(savepath));
    });
  },
});

var sub_copy_link = webContents => ({
  label: 'Copy link URL',
  click () {
    webContents.send('command', 'copylink');
  },
});

// popup
var sub_copy_page_url = webContents => ({
  label: 'Copy Page URL',
  click () {
    webContents.send('command', 'copypageurl');
  },
});
var sub_open_page_external = webContents => ({
  label: 'Open Page in Browser',
  click () {
    webContents.send('command', 'openpageexternal');
  },
});

// quote
var sub_quote_without_notification = webContents => ({
  label: 'Quote without notification',
  click () {
    webContents.send('command', 'quotewithoutnotification');
  },
});

var sub_copy_tweet = webContents => ({
  label: 'Copy Tweet',
  click () {
    webContents.send('command', 'copy-tweet');
  },
});

var sub_copy_tweet_with_author = webContents => ({
  label: 'Copy Tweet (with @author)',
  click () {
    webContents.send('command', 'copy-tweet-with-author');
  },
});

app.on('ready', () => {
    // 리눅스 일부 환경에서 검은색으로 화면이 뜨는 문제 해결을 위한 코드
    // chrome://gpu/ 를 확인해 Canvas Hardware acceleration이 사용 불가면 disable-gpu를 달아준다
    // --
  var chk_win;
  var is_relaunch = false;

    // process.argv를 확인해 --relaunch 인자가 있는지 확인
  for (var e of process.argv) {
    if ('--relaunch'.search(e) !== -1) {
      is_relaunch = true;
    }
  }

    // --relaunch 인자가 없다면 pre_check
  if (!is_relaunch) {
    chk_win = new BrowserWindow({
      show: false,
      width: 0,
      height: 0,
      webPreferences: {
        preload: path.join(__dirname, 'pre_check.js'),
      },
    });
    chk_win.loadURL('chrome://gpu/');
  } else {
    // --relaunch 인자가 있다면 바로 run
    run();
  }

  // 렌더러 프로세스에서 run 명령을 받으면 실행
  ipcMain.on('run', event => run(chk_win));

  // MacOS Application menu
  const template = [
    {
      label: 'Edit',
      submenu: [
        {
          role: 'undo',
        },
        {
          role: 'redo',
        },
        {
          type: 'separator',
        },
        {
          role: 'cut',
        },
        {
          role: 'copy',
        },
        {
          role: 'paste',
        },
        {
          role: 'selectall',
        },
        {
          role: 'delete',
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click (item, focusedWindow) {
            if (focusedWindow) focusedWindow.reload();
          },
        },
        {
          role: 'togglefullscreen',
        },
        {
          type: 'separator',
        },
        {
          role: 'resetzoom',
        },
        {
          role: 'zoomin',
        },
        {
          role: 'zoomout',
        },
        {
          type: 'separator',
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click (item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.toggleDevTools();
          },
        },
      ],
    },
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        {
          role: 'about',
        },
        {
          type: 'separator',
        },
        {
          label: 'Setting...',
          click () {
            openSetting(win);
          },
        },
        {
          type: 'separator',
        },
        {
          role: 'hide',
        },
        {
          role: 'hideothers',
        },
        {
          role: 'unhide',
        },
        {
          type: 'separator',
        },
        {
          role: 'quit',
        },
      ],
    });

    template[3] = {
      role: 'window',
      submenu: [
        {
          label: 'Always on top',
          type: 'checkbox',
          checked: Config.data.defaultTopmost,
          click () {
            if (win) {
              var flag = !win.isAlwaysOnTop();
              win.setAlwaysOnTop(flag);
              if (popup) popup.setAlwaysOnTop(flag);
            }
          },
        },
        {
          type: 'separator',
        },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          click (item, focusedWindow) {
            if (focusedWindow) focusedWindow.close();
          },
        },
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize',
        },
        {
          label: 'Zoom',
          role: 'zoom',
        },
        {
          type: 'separator',
        },
        {
          label: 'Bring All to Front',
          role: 'front',
        },
      ],
    },

    template[4] = {
      role: 'help',
      submenu: [
        {
          label: 'About TweetDeck Player...',
          click () {
            require('electron').shell.openExternal('https://github.com/sokcuri/TweetDeckPlayer');
          },
        },
      ],
    };
  } else {
    template.unshift({
      label: 'File',
      submenu: [
        {
          label: 'Close',
          click (item, focusedWindow) {
            if (focusedWindow) focusedWindow.close();
          },
        },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
});

// disable-gpu 항목으로 재시작이 필요할 때
ipcMain.on('nogpu-relaunch', () => {
  app.releaseSingleInstance();
  existInst = null;
  var x = `${process.execPath} ${process.argv[1]} --disable-gpu --relaunch`;
  child_process.exec(x);
  setTimeout(() => app.quit(), 100);
});

// JS version number compare
// electron 버전 비교를 위해서 삽입
// http://stackoverflow.com/questions/6832596/how-to-compare-software-version-number-using-js-only-number
var versionCompare = (v1, v2, options) => {
  var lexicographical = options && options.lexicographical,
    zeroExtend = options && options.zeroExtend,
    v1parts = v1.split('.'),
    v2parts = v2.split('.');

  var isValidPart = x => {
    return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
  };

  if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
    return NaN;
  }

  if (zeroExtend) {
    while (v1parts.length < v2parts.length) v1parts.push("0");
    while (v2parts.length < v1parts.length) v2parts.push("0");
  }

  if (!lexicographical) {
    v1parts = v1parts.map(Number);
    v2parts = v2parts.map(Number);
  }

  for (var i = 0; i < v1parts.length; ++i) {
    if (v2parts.length === i) {
      return 1;
    }

    if (v1parts[i] === v2parts[i]) {
      continue;
    } else if (v1parts[i] > v2parts[i]) {
      return 1;
    } else {
      return -1;
    }
  }

  if (v1parts.length !== v2parts.length) {
    return -1;
  }

  return 0;
};

// accessibility mode issue (CPU 100% with touch device)
// https://github.com/sokcuri/TweetDeckPlayer/issues/29
// accessibility mode 일때 chrome://accessibility의 global setting을 off시킨다
// accessibility mode 여부는 app.isAccessibilitySupportEnabled()로 확인
// 1.3.7 버전 이하의 electron에서만 해당되는 문제.
var hotfix_accessibility_mode = () => {
  if (versionCompare(process.versions.electron, '1.3.8') < 0) {
    if (app.isAccessibilitySupportEnabled()) {
      if (accessibilityWin) accessibilityWin.close();
      accessibilityWin = new BrowserWindow({
        show: false,
        width: 0,
        height: 0,
        webPreferences: {
          preload: path.join(__dirname, 'pre_check.js'),
        },
      });
      accessibilityWin.loadURL('chrome://accessibility');
      accessibilityWin.webContents.on('did-finish-load', () => {
        if (app.isAccessibilitySupportEnabled()) {
          accessibilityWin.webContents.executeJavaScript(
            `if (document.querySelector('#toggle_global').text == 'on')
            document.querySelector('#toggle_global').click();`);
          setTimeout(() => {
            try {
              accessibilityWin.close();
              accessibilityWin = null;
            } catch (e) {

            }
            setTimeout(hotfix_accessibility_mode, 1000);
          }, 1000);
        }
      });
    } else {
      setTimeout(hotfix_accessibility_mode, 1000);
    }
  }
};
// 시현님 기여어
// Special Thanks for @uto_correction, @Gar_ella

// 트윗덱 플레이어 실행 프로시저
var run = chk_win => {
  hotfix_accessibility_mode();

  var preference = (Config.data && Config.data.bounds) ? Config.data.bounds : {};
  preference.icon = path.join(__dirname, 'tweetdeck.ico');
  preference.autoHideMenuBar = true;
  preference.webPreferences = {
    nodeIntegration: false,
    preload: path.join(__dirname, 'preload.js'),
  };
  win = new BrowserWindow(preference);
  win.loadURL('https://tweetdeck.twitter.com');

  win.setAlwaysOnTop(Config.data.defaultTopmost && true || false);

  if (Config.data.isMaximized) {
    win.maximize();
  }

  if (Config.data.isFullScreen) {
    win.setFullScreen(true);
  }

  // 체크를 위한 윈도우가 존재하는 경우 닫기
  if (chk_win) {
    chk_win.close();
    chk_win = null;
  }

  // application menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Setting...',
          click () {
            openSetting(win);
          },
        },
        {
          role: 'quit',
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {
          role: 'undo',
        },
        {
          role: 'redo',
        },
        {
          type: 'separator',
        },
        {
          role: 'cut',
        },
        {
          role: 'copy',
        },
        {
          role: 'paste',
        },
        {
          role: 'selectall',
        },
        {
          role: 'delete',
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click (item, focusedWindow) {
            if (focusedWindow) focusedWindow.reload();
          },
        },
        {
          role: 'togglefullscreen',
        },
        {
          type: 'separator',
        },
        {
          role: 'resetzoom',
        },
        {
          role: 'zoomin',
        },
        {
          role: 'zoomout',
        },
        {
          type: 'separator',
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click (item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.toggleDevTools();
          },
        },
      ],
    },
    {
      role: 'window',
      submenu: [
        {
          label: 'Always on top',
          type: 'checkbox',
          checked: win.isAlwaysOnTop(),
          click () {
            var flag = !win.isAlwaysOnTop();
            win.setAlwaysOnTop(flag);
            if (popup) popup.setAlwaysOnTop(flag);
          },
        },
        {
          role: 'minimize',
        },
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'About TweetDeck Player...',
          click () {
            require('electron').shell.openExternal('https://github.com/sokcuri/TweetDeckPlayer');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  win.setMenu(menu);

  // devtool 열기
  //win.webContents.openDevTools()

  // electron post 리다이렉트 문제 해결 코드
  win.webContents.on('did-get-redirect-request', (e, oldURL, newURL, isMainFrame) => {
    if (isMainFrame) {
      setTimeout(() => win.loadURL(newURL), 200);
      e.preventDefault();
    }
  });

  win.webContents.on('did-finish-load', () => {
    //let paceCSS = fs.readFileSync(path.join(__dirname, 'css/pace.css'), 'utf8');
    //win.webContents.insertCSS(paceCSS);
    let extraCSS = fs.readFileSync(path.join(__dirname, 'css/extra.css'), 'utf8');
    win.webContents.insertCSS(extraCSS);
    win.webContents.insertCSS(`
      .no-pointer {
        pointer-events: none;
      }`);
    if (Config.data.blockGoogleAnalytics) {
      const gaurl = ['*://*.google-analytics.com'];
      const ses = win.webContents.session;
      ses.webRequest.onBeforeRequest(gaurl, (details, callback) => {
        const block = /google-analytics/i.test(details.url);
        callback({
          cancel: block,
          requestHeaders: details.requestHeaders,
        });
      });
    }
  });

  ipcMain.on('page-ready-tdp', (event, arg) => {
    // destroyed contents when loading
    try {
      let emojipadCSS = fs.readFileSync(path.join(__dirname, 'css/emojipad.css'), 'utf8');
      win.webContents.insertCSS(emojipadCSS);
      win.webContents.insertCSS(`
        .list-account .emoji {
          width: 1em;
          height: 1em;
        }
        .customize-columns .column {
          width: var(--column-size) !important;
          margin-right: 6px;
        }
        `);
      win.webContents.send('apply-config');

      // 유저 스크립트 로딩
      fs.readdir(path.join(Util.getWritableRootPath(), 'scripts'), (error, files) => {
        if (error) {
          if (error.code === 'ENOENT') {
            fs.mkdir(path.join(Util.getWritableRootPath(), 'scripts'), () => {});
          } else {
            console.error('Fail to read scripts directory!');
          }
          return;
        }
        let jsFiles = files.filter(f => f.endsWith('.js'));
        for (let file of jsFiles) {
          let filepath = path.join(path.join(Util.getWritableRootPath(), 'scripts'), file);
          fs.readFile(filepath, 'utf8', (error, script) => {
            if (error) {
              console.error('Fail to read userscript "%s"!', filepath);
            } else {
              win.webContents.executeJavaScript(script);
            }
          });
        }
      });
    } catch (e) { }
  });

  win.on('close', e => {
    try {
      Config.load();

      Config.data.isMaximized = win.isMaximized();
      Config.data.isFullScreen = win.isFullScreen();

      e.sender.hide();
      if (e.sender.isMaximized()) {
        e.sender.unmaximize();
      }
      if (e.sender.isFullScreen()){
        e.sender.setFullScreen(false);
      }

      Config.data.bounds = win.getBounds();
      if (popup) {
        Config.data.popup_bounds = popup.getBounds();

        popup.sender.hide();
        if (popup.sender.isMaximized()) {
          popup.sender.unmaximize();
        }
        if (popup.sender.isFullScreen()){
          popup.sender.setFullScreen(false);
        }
      }
      Config.save();
      win = null;
    } catch (e) { };
  });

  win.webContents.on('new-window', (e, url, target) => {
    e.preventDefault();
    if (Config.data.openURLInInternalBrowser && !global.keyState.shift ||
        target === 'popup') {
      openPopup(url);
    } else {
      shell.openExternal(url);
    }
  });
};

// 컨텍스트 메뉴
ipcMain.on('context-menu', (event, menu, isRange, Addr, isPopup) => {

  var template = [];
  var separator = { type: 'separator' };

  switch (menu) {
    case 'main':
      if (isRange) {
        template.push(sub_copy(event.sender));
        template.push(separator);
      } else if (isPopup) {
        template.push(sub_back_page(event.sender));
        template.push(sub_forward_page(event.sender));
        template.push(sub_reload(event.sender));
      }
      if (!isPopup) {
        template.push(sub_reload(event.sender));
      }
      break;

    case 'text':
      template.push({ label: 'Cut', enabled: false });
      template.push({ label: 'Copy', enabled: false });
      template.push(separator);
      template.push(sub_paste(event.sender));
      template.push({ label: 'Delete', enabled: false });
      template.push(separator);
      template.push(sub_selectall(event.sender));
      break;

    case 'input_sel':
      template.push(sub_cut(event.sender));
      template.push(sub_copy(event.sender));
      template.push(separator);
      template.push(sub_paste(event.sender));
      template.push(sub_delete(event.sender));
      template.push(separator);
      template.push(sub_selectall(event.sender));
      break;

    case 'text_sel':
      template.push(sub_copy(event.sender));
      break;

    case 'setting':
      template.push(sub_alwaystop(win));
      template.push(sub_setting(win));
      template.push(separator);
      template.push(sub_reload(event.sender));
      break;

    case 'selection':
      template.push(sub_copy(event.sender));
      template.push(separator);
      template.push(sub_reload(event.sender));
      break;

    case 'image':
      template.push(sub_copy_img(event.sender));
      template.push(sub_save_img(event.sender, Addr));
      template.push(sub_copy_img_url(event.sender));
      if (Config.data.enableOpenImageinPopup) {
        template.push(separator);
        template.push(sub_open_img(event.sender));
        template.push(sub_open_img_popup(event.sender));
        template.push(separator);
      } else {
        template.push(sub_open_img(event.sender));
      }
      template.push(sub_search_img_google(event.sender));
      template.push(separator);
      template.push(sub_reload(event.sender));
      break;

    case 'link':
      if (!Config.data.enableOpenLinkinPopup) {
        template.push(sub_open_link(event.sender));
      } else {
        template.push(sub_open_link(event.sender));
        template.push(sub_open_link_popup(event.sender));
        template.push(separator);
      }
      template.push(sub_save_link(event.sender, Addr));
      template.push(sub_copy_link(event.sender));
      template.push(separator);
      if (isRange) {
        template.push(sub_copy(event.sender));
        template.push(separator);
      }
      template.push(sub_reload(event.sender));
      break;

    case 'linkandimage':
      template.push(sub_save_link(event.sender, Addr));
      template.push(sub_copy_link(event.sender));
      if (!Config.data.enableOpenLinkinPopup) {
        template.push(sub_open_link(event.sender));
        template.push(separator);
      } else {
        template.push(sub_open_link(event.sender));
        template.push(sub_open_link_popup(event.sender));
        template.push(separator);
      }

      template.push(sub_copy_img(event.sender));
      template.push(sub_save_img(event.sender, Addr));
      template.push(sub_copy_img_url(event.sender));
      if (Config.data.enableOpenImageinPopup) {
        template.push(separator);
        template.push(sub_open_img(event.sender));
        template.push(sub_open_img_popup(event.sender));
        template.push(separator);
      } else {
        template.push(sub_open_img(event.sender));
      }
      template.push(sub_search_img_google(event.sender));
      template.push(separator);
      template.push(sub_reload(event.sender));
      break;

    case 'tweet':
      if (Addr.id !== '') {
        template.push(sub_quote_without_notification(event.sender));
        template.push(separator);
      }
      if (Addr.text !== '') {
        template.push(sub_copy_tweet(event.sender));
        template.push(sub_copy_tweet_with_author(event.sender));
        template.push(separator);
      }
      template.push(sub_reload(event.sender));
      break;
  }

  if (isPopup) {
    template.push(separator);
    template.push(sub_copy_page_url(event.sender));
    template.push(sub_open_page_external(event.sender));
  }

  var contextMenu = Menu.buildFromTemplate(template);
  if (!isPopup) contextMenu.popup(win);
  else if (popup) contextMenu.popup(popup);
  return;
});

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.on('twtlib-open', (event, arg) => {
  if (twtlibWin) {
    twtlibWin.focus();
    return;
  }
  let width = 500;
  let height = 480;
  let b = win.getBounds();
  let x = Math.floor(b.x + (b.width - width) / 2);
  let y = Math.floor(b.y + (b.height - height) / 2);
  twtlibWin = new BrowserWindow({
    width, height, x, y,
    parent: win,
    modal: false,
    show: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  twtlibWin.on('close', () => {
    twtlibWin = null;
    win.focus();
  });
  twtlibWin.loadURL('file:///' + path.join(__dirname, 'ui/twtlib.html'));
});

ipcMain.on('twtlib-send-text', (event, arg) => {
  win.webContents.send('twtlib-add-text', arg);
});

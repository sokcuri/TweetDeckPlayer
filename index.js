const electron = require('electron');
const {app, BrowserWindow, dialog, session, Menu, MenuItem, ipcMain, shell} = electron;
const fs = require('fs');
const path = require('path');
const request = require('request');
const child_process = require('child_process');

const Util = require('./util');

// 설정
const Config = require('./config');

let win, settingsWin, twtlibWin;

ipcMain.on('load-config', (event, arg) => {
  var config = Config.load();
  event.returnValue = config;
});

ipcMain.on('save-config', (event, config) => {
  Config.data = config;
  Config.save();
});

ipcMain.on('apply-config', (event, config) => {
  win.webContents.send('apply-config');
});

ipcMain.on('request-theme', event => {
  win.webContents.executeJavaScript(
    '(()=>{var x=document.querySelector("meta[http-equiv=Default-Style]");return x&&x.content||"light";})()',
    false,
    theme => { event.returnValue = theme; }
  );
});

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
    window.setAlwaysOnTop(!window.isAlwaysOnTop());
  },
});

var sub_setting = window => ({
  label: 'Setting',
  click () {
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
  },
});

//
// image
//
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
    webContents.send('pointer-events', 'none');

    // Save Dialog를 띄운다
    var savepath = dialog.showSaveDialog({
      defaultPath: filename,
      filters: filters,
    });

    // 포인터 이벤트를 되살린다
    webContents.send('pointer-events', 'all');

    // savepath가 없는 경우 리턴
    if (typeof savepath === 'undefined') return;

    // http 요청을 보내고 저장
    request(path).pipe(fs.createWriteStream(savepath));
  },
});
var sub_copy_img = webContents => ({
  label: 'Copy image URL',
  click () {
    webContents.send('command', 'copyimage');
  },
});
var sub_open_img = webContents => ({
  label: 'Open image in browser',
  click () {
    webContents.send('command', 'openimage');
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
      webContents.send('pointer-events', 'none');

        // 저장 다이얼로그를 띄운다
      var savepath = dialog.showSaveDialog({
        defaultPath: filename,
        filters: filters,
      });

        // 포인터 이벤트를 되살린다
      webContents.send('pointer-events', 'all');

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
});

// disable-gpu 항목으로 재시작이 필요할 때
ipcMain.on('nogpu-relaunch', () => {
  app.releaseSingleInstance();
  existInst = null;
  var x = `${process.execPath} ${process.argv[1]} --disable-gpu --relaunch`;
  child_process.exec(x);
  setTimeout(() => app.quit(), 100);
});

// 트윗덱 플레이어 실행 프로시저
var run = chk_win => {
  const ses = session.fromPartition('persist:main');

  var preference = (Config.data && Config.data.bounds) ? Config.data.bounds : {};
  preference.icon = path.join(__dirname, 'tweetdeck.ico');
  preference.webPreferences = {
    nodeIntegration: false,
    partition: ses,
    preload: path.join(__dirname, 'preload.js'),
  };
  win = new BrowserWindow(preference);
  win.loadURL('https://tweetdeck.twitter.com');

  // 체크를 위한 윈도우가 존재하는 경우 닫기
  if (chk_win) {
    chk_win.close();
  }

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
    let paceCSS = fs.readFileSync(path.join(__dirname, 'pace.css'), 'utf8');
    win.webContents.insertCSS(paceCSS);
    let extraCSS = fs.readFileSync(path.join(__dirname, 'css/extra.css'), 'utf8');
    win.webContents.insertCSS(extraCSS);
    win.webContents.insertCSS(`
      .backdrop {
        position: absolute;
        z-index: 1;
        background-color: transparent;
        overflow: auto;
        pointer-events: none;
        width: 100%;
        height: 130px;
        font-weight: normal;
        line-height: 18px;
        transition: transform 1s;
      }
      
      .highlights {
        white-space: pre-wrap;
        word-wrap: break-word;
        color: transparent;
        -webkit-text-fill-color: black;
        padding: 10px;
        line-height: 18px;
      }
      .js-compose-text {
        z-index: 2;
        position: inherit;
        background-color: transparent;
        color: rgb(60, 0, 248);
        text-shadow: 0px 0px 0px transparent;
        -webkit-text-fill-color: transparent;
      }
      .mark_mention {
        #border-radius: 3px;
        color: transparent;
        background-color: transparent;
        -webkit-text-fill-color: #cb4f5f;
      }
      .mark_hashtag {
        color: transparent;
        background-color: transparent;
        -webkit-text-fill-color: #2b7bb9;
      }
      .mark_url {
        color: transparent;
        background-color: transparent;
        -webkit-text-fill-color: #a84dba;
      }
      .mark_heart {
        color: transparent;
        background-color: transparent;
        -webkit-text-fill-color: #dd2e44;
      }
      .placeholder {
        color: transparent;
        background-color: transparent;
        -webkit-text-fill-color: #e2e8ed;
      }
      `);
    win.webContents.send('apply-config');
    if (Config.data.customFonts) {
      
      /*
      win.webContents.insertCSS(`
        * {
          font-family: ${Config.data.customFonts} !important;
        }
      `);*/
    }
    // 유저 스크립트 로딩
    fs.readdir('./scripts', (error, files) => {
      if (error) {
        if (error.code === 'ENOENT') {
          fs.mkdir('./scripts', () => {});
        } else {
          console.error('Fail to read scripts directory!');
        }
        return;
      }
      let jsFiles = files.filter(f => f.endsWith('.js'));
      for (let file of jsFiles) {
        let filepath = path.join('./scripts', file);
        fs.readFile(filepath, 'utf8', (error, script) => {
          if (error) {
            console.error('Fail to read userscript "%s"!', filepath);
          } else {
            win.webContents.executeJavaScript(script);
          }
        });
      }
    });
  });

  win.on('close', () => {
    Config.load();
    Config.data.bounds = win.getBounds();
    Config.save();
    win = null;
  });

  win.webContents.on('new-window', (e, url) => {
    e.preventDefault();
    if (Config.data.openURLInInternalBrowser) {
      let popup = new BrowserWindow({
        parent: win,
        webPreferences: {
          webSecurity: true,
          nodeIntegration: false,
        },
      });
      popup.loadURL(url);
    } else {
      shell.openExternal(url);
    }
  });

};

// 컨텍스트 메뉴
ipcMain.on('context-menu', (event, menu, isRange, Addr) => {
  var template = [];
  var separator = { type: 'separator' };
  switch (menu) {
    case 'main':
      if (isRange) {
        template.push(sub_copy(event.sender));
        template.push(separator);
      }
      template.push(sub_reload(event.sender));
      break;

    case 'text':
      template.push({ label: 'Cut', enabled: false });
      template.push({ label: 'Copy', enabled: false });
      template.push(separator);
      template.push(sub_paste(event.sender));
      template.push({ label: 'Delete', enabled: false });
      template.push(separator);
      template.push(sub_selectall(event.sender));
      template.push(separator);
      template.push(sub_reload(event.sender));
      break;

    case 'text_sel':
      template.push(sub_cut(event.sender));
      template.push(sub_copy(event.sender));
      template.push(separator);
      template.push(sub_paste(event.sender));
      template.push(sub_delete(event.sender));
      template.push(separator);
      template.push(sub_selectall(event.sender));
      template.push(separator);
      template.push(sub_reload(event.sender));
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
      template.push(sub_save_img(event.sender, Addr));
      template.push(sub_copy_img(event.sender));
      template.push(sub_open_img(event.sender));
      template.push(sub_search_img_google(event.sender));
      template.push(separator);
      template.push(sub_reload(event.sender));
      break;

    case 'link':
      template.push(sub_open_link(event.sender));
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
      template.push(sub_open_link(event.sender));
      template.push(separator);
      template.push(sub_save_img(event.sender, Addr));
      template.push(sub_copy_img(event.sender));
      template.push(sub_open_img(event.sender));
      template.push(sub_search_img_google(event.sender));
      template.push(separator);
      template.push(sub_reload(event.sender));
      break;
  }
  var contextMenu = Menu.buildFromTemplate(template);
  contextMenu.popup(win);
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

  });
  twtlibWin.loadURL('file:///' + path.join(__dirname, 'ui/twtlib.html'));
});

ipcMain.on('twtlib-send-text', (event, arg) => {
  win.webContents.send('twtlib-add-text', arg);
});

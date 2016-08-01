const {app, BrowserWindow, session} = require('electron')
const {dialog} = require('electron')
const path = require('path')

const electron = require('electron');
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;
const ipcMain = electron.ipcMain;

const tdp_version = "TweetDeck Player v2.00 by @sokcuri"

var fs = require("fs");
var initPath = path.join(__dirname, "init.json");
var config;
try {
    config = JSON.parse(fs.readFileSync(initPath, 'utf8'));
}
catch(e) {
}

let win
global.sharedObj = {prop1: null};

const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (win) {
    //if (myWindow.isMinimized()) myWindow.restore()
    win.show()
    win.focus()
  }
})

if (shouldQuit) {
  app.quit()
}

// 링크가 트위터 이미지면 원본 해상도를 구한다 
var getLinkOrig = (link) => {
  var l = link;
  if (l.search('twimg.com/media') != -1)
  {
    l = l.substr(0, l.lastIndexOf(':'));
	  l = l + ':orig';
  }
  // 프로필 이미지는 (파일명)_small/_bigger/_400x400 등으로 구분됨
  // 언더바 이후를 지우면 원본 이미지가 튀어나온다 
  else if (l.search('pbs.twimg.com/profile_images') != -1)
  {
    // 확장자를 구해놓고 언더바 이후부터 파일경로를 날리고 확장자를 붙인다
    var ext = l.substr(l.lastIndexOf('.'));
    l = l.substr(0, l.lastIndexOf('_')) + ext;
  }
  
  return l;
}

// 링크의 파일 이름을 구한다
var getLinkFilename = (link) => {
  var l = link;
  if(l.search('twimg.com/media') != -1)
    l = l.substr(0, l.lastIndexOf(':'));
  return l.substr(l.lastIndexOf('/') + 1);
}

// 임시 저장되는 주소 변수들
var img_addr, link_addr;

// 
// edit
//
var sub_cut = (webContents) => {return {
  label: 'Cut',
  click() {
      webContents.send('command', 'cut')
  }
}};
var sub_copy = (webContents) => {return {
  label: 'Copy',
  click() {
      webContents.send('command', 'copy')
  }
}};
var sub_paste = (webContents) => {return {
  label: 'Paste',
  click() {
      webContents.send('command', 'paste')
  }
}};
var sub_delete = (webContents) => {return {
  label: 'Delete',
  click() {
      webContents.send('command', 'delete')
  }
}};
var sub_selectall = (webContents) => {return {
  label: 'Select All',
  click() {
      webContents.send('command', 'selectall')
  }
}};
var sub_reload = (webContents) => {return {
  label: 'Reload',
  click() {
      webContents.send('command', 'reload')
  }
}};

//
// setting
//
var sub_alwaystop = (win) => {return {
  label: 'Always on top',
  type: 'checkbox',
  checked: win.isAlwaysOnTop(),
  click() {
      win.setAlwaysOnTop(!win.isAlwaysOnTop())
  }
}};
var sub_setting = (win) => {return {
  label: 'Setting',
  click() {
      var width = 500;
      var height = 800;
      var b = win.getBounds()
      var x = Math.floor(b.x + (b.width - width) / 2)
      var y = Math.floor(b.y + (b.height - height) / 2)
      let child = new BrowserWindow({parent: win, width: width, height: height, x: x, y: y, 
          modal: true, show: false})
      child.setMenu(null)
      child.loadURL(path.join(__dirname, 'setting.htm'))
      child.once('ready-to-show', () => {
          child.show()
      })
  }
}};

//
// image
//
var sub_save_img = (webContents) => {return {
  label: 'Save image as..',
  click() {
      webContents.send('command', 'saveimage')
  }
}};
var sub_copy_img = (webContents) => {return {
  label: 'Copy image URL',
  click() {
      webContents.send('command', 'copyimage')
  }
}};
var sub_open_img = (webContents) => {return {
  label: 'Open image in browser',
  click() {
      webContents.send('command', 'openimage')
  }
}};
var sub_search_img_google = (webContents) => {return {
  label: 'Search image with Google',
  click() {
      webContents.send('command', 'googleimage')
  }
}};

//
// link
//
var sub_open_link = (webContents) => {return {
  label: 'Open link',
  click() {
      webContents.send('command', 'openlink')
  }
}};

var sub_save_link = (webContents) => {return {
  label: 'Save link as..',
  click() {
        webContents.send('command', 'savelink')
  }
}};
var sub_copy_link = (webContents) => {return {
  label: 'Copy link URL',
  click() {
      webContents.send('command', 'copylink')
  }
}};

app.on("ready", function() {
    const ses = session.fromPartition('persist:main')

const filter = {
urls: ['*']
}
/*
ses.webRequest.onBeforeSendHeaders(filter, (details, callback) => {

details.requestHeaders['Location'] = ['http://twtter.com/']
callback({cancel: false, requestHeaders: details.requestHeaders})
});
*/
/*
ses.webRequest.onHeadersReceived(filter, (details, callback) => {
    if(details.url.search('userstream.twitter.com') != -1)
    {
    console.log(details.responseHeaders);
    console.log(details.statusCode);
    console.log(details.statusLine);
    details.statusCode = 307;
    details.statusLine = "HTTP/1.1 307 Temporary Redirect";
    Object.defineProperty(details, "Location", { get: function() { return this.Location; }, set: function(value) { this.Location = value } });
    var url = details.url.substr(details.url.search('://')+3);
    var url = url.substr(url.search('/')+1);
    details.responseHeaders['Location'] = ['https://api.twitter.com/' + url]
    }
    callback({cancel: false, responseHeaders: details.responseHeaders, statusLine: details['statusLine']})
})
*/

    var preference = new Object((config && config.bounds) ? config.bounds : "");
    preference.icon = __dirname + '/tweetdeck.ico'
    preference.webPreferences = {
        nodeIntegration: false,
        partition: "persist:main",
        preload: path.join(__dirname, 'preload.js')
    }
    win = new BrowserWindow(preference);
    win.loadURL("https://tweetdeck.twitter.com/");
    //win.loadURL("https://userstream.twitter.com")
    //win.webContents.openDevTools();

    win.webContents.on('did-get-redirect-request', function(e, oldURL, newURL, isMainFrame, httpResponseCode, requestMethod, refeerrer, header) {
        if (isMainFrame)
	    {
            setTimeout(() => win.loadURL(newURL), 100);
            e.preventDefault();
        }
    });
    win.webContents.on('did-start-loading', function() {
    });
    win.webContents.on('dom-ready', function() {
        win.webContents.insertCSS(`.pace{-webkit-pointer-events:none;pointer-events:none;-webkit-user-select:none;-moz-user-select:none;user-select:none}.pace-inactive{display:none}.pace .pace-progress{background:#29d;position:fixed;z-index:2000;top:0;right:100%;width:100%;height:2px});`)
        
        var mod_version = `if (window.TD_mustaches) window.TD_mustaches["version.mustache"] = "${tdp_version} (TweetDeck {{version}}{{#buildIDShort}}-{{buildIDShort}}{{/buildIDShort}})"`
        var mod_title = `if (document.title == 'TweetDeck') document.title = 'TweetDeck Player'; else document.title = 'TweetDeck Player - ' + document.title`
        win.webContents.executeJavaScript(`${mod_version}; ${mod_title};`)
    });
    win.webContents.on('did-finish-load', function() {

        // 가을별(Gaeulbyul) 님의 트윗덱 이미지 붙여넣기 스크립트
        // 0.3b1 / 트윗덱에 클립보드 붙여넣기(Ctrl-V)로 이미지를 업로드하는 기능을 추가한다.
        var gaeulbyul_paste = `var catcher = $('<div>')
        .attr('contenteditable',true)
        .css('opacity', 0)
        .appendTo(document.body)
        .focus();

        function dataURIToBlob (dataURI) {
            var [ mimeString, encodedData ] = dataURI.split(',');
            var byteString;
            if (dataURI.split(',')[0].indexOf('base64') >= 0) {
                byteString = atob(encodedData);
            } else {
                byteString = unescape(encodedData);
            }
            var type = mimeString.match(/^data:(.+);/)[1];
            var ia = new Uint8Array(byteString.length);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            var blob = new Blob([ ia ], { type });
            return blob;
        }

        function waitClipboard () {
            var cer = catcher[0];
            var child = cer.childNodes && cer.childNodes[0];
            if (child) {
                if (child.tagName === 'IMG') {
                    var file = dataURIToBlob(child.src);
                    pasteFile([ file ]);
                }
                cer.innerHTML = '';
            } else {
                setTimeout(waitClipboard, 100);
            }
        }

        function pasteFile (files) {
            // 트윗 입력창을 닫은 이후에 멘션 안 남게
            if (!$('.app-content').hasClass('is-open')) {
                $(document).trigger("uiComposeTweet", { type: 'tweet' });
            }
            $(document).trigger('uiFilesAdded', { files });
        }

        $(document.body).on('paste', function (event) {
            try {
                var clipdata = event.originalEvent.clipboardData;
                var items = clipdata.items;
                var item = items[0];
            } catch (e) {
                catcher.focus();
                setTimeout(waitClipboard, 300);
                return;
            }
            if (item.kind !== 'file') return;
            var file = [ item.getAsFile() ];
            pasteFile(file);
        });`
        
        var inject_style = `function injectStyles(rule) {
        var div = $("<div />", {
            html: '&shy;<style>' + rule + '</style>'
        }).appendTo("body");    
        }`

        // contenteditable=true인 div에 커서가 가로막히는 현상을 방지하기 위한 패치 
        var cont_div_patch = `var el; if(document.body) el = document.body.querySelector('[contenteditable="true"]'); if (el) { document.body.querySelector('[contenteditable="true"]').style = 'opacity: 0; pointer-events: none'; }`

        // 시작시 트윗덱 플레이어 툴팁 표시 및 스크립트 동작 
        win.webContents.executeJavaScript(`${inject_style}; var TDP = {}; TDP.onPageLoad = () => {setTimeout(() => { if (!TD || !TD.ready) { TDP.onPageLoad(); } else { TD.controller.progressIndicator.addMessage(TD.i("${tdp_version}")); ${gaeulbyul_paste}; setTimeout(() => { TD.settings.setUseStream(TD.settings.getUseStream()); ${cont_div_patch}; }, 3000); if (Pace) setTimeout(() => { injectStyles('.pace-progress { display: none }') }, 2000) }}, 1000)}; TDP.onPageLoad();`)
    });

    win.on("close", function() {
        config.bounds = win.getBounds()
        fs.writeFileSync(initPath, JSON.stringify(config));
    });

    win.webContents.on('new-window', (e, url) => {
      /*
        if(url != win.webContents.getURL()) {
            var request = require('request');
            request({
                method: 'GET',
                followAllRedirects: true,
                url: url
            }, function (error, response, body) {
                console.warn(response);
                console.warn(body);
                require('electron').shell.openExternal(url)
            });
        }*/
	      e.preventDefault()
        require('electron').shell.openExternal(url)
    });

    cacheClear = () => 
	{
        win.webContents.session.clearCache(() => {
        })
        setTimeout(cacheClear, 60000);
    };
    cacheClear();



ipcMain.on('context-menu', function(event, menu, is_range) {

    var template = new Array();
    switch(menu)
    {
        case 'main':
            if (is_range)
            {
                template.push(sub_copy(event.sender));
                template.push(new Object({ type: 'separator' }));
            }
            template.push(sub_reload(event.sender));
        break;

        case 'text':
            template.push(new Object({ label: 'Cut', enabled: false }));
            template.push(new Object({ label: 'Copy', enabled: false }));
            template.push(new Object({ type: 'separator' }));
            template.push(sub_paste(event.sender));
            template.push(new Object({ label: 'Delete', enabled: false }));
            template.push(new Object({ type: 'separator' }));
            template.push(sub_selectall(event.sender));
            template.push(new Object({ type: 'separator' }));
            template.push(sub_reload(event.sender));
        break;

        case 'text_sel':
            template.push(sub_cut(event.sender));
            template.push(sub_copy(event.sender));
            template.push(new Object({ type: 'separator' }));
            template.push(sub_paste(event.sender));
            template.push(sub_delete(event.sender));
            template.push(new Object({ type: 'separator' }));
            template.push(sub_selectall(event.sender));
            template.push(new Object({ type: 'separator' }));
            template.push(sub_reload(event.sender));
        break;

        case 'setting':
            template.push(sub_alwaystop(win));
            template.push(sub_setting(win));
            template.push(new Object({ type: 'separator' }));
            template.push(sub_reload(event.sender));
        break;

        case 'selection':
            template.push(sub_copy(event.sender));
            template.push(new Object({ type: 'separator' }));
            template.push(sub_reload(event.sender));
        break;

        case 'image':
            template.push(sub_save_img(event.sender));
            template.push(sub_copy_img(event.sender));
            template.push(sub_open_img(event.sender));
            template.push(sub_search_img_google(event.sender));
            template.push(new Object({ type: 'separator' }));
            template.push(sub_reload(event.sender));
        break;

        case 'link':
            template.push(sub_open_link(event.sender));
            template.push(sub_save_link(event.sender));
            template.push(sub_copy_link(event.sender));
            template.push(new Object({ type: 'separator' }));
            if (is_range)
            {
                template.push(sub_copy(event.sender));
                template.push(new Object({ type: 'separator' }));
            }
            template.push(sub_reload(event.sender));
        break;

        case 'linkandimage':
            template.push(sub_save_link(event.sender));
            template.push(sub_copy_link(event.sender));
            template.push(sub_open_link(event.sender));
            template.push(new Object({ type: 'separator' }));
            template.push(sub_save_img(event.sender));
            template.push(sub_copy_img(event.sender));
            template.push(sub_open_img(event.sender));
            template.push(sub_search_img_google(event.sender));
            template.push(new Object({ type: 'separator' }));
            template.push(sub_reload(event.sender));
        break;
    }
    var contextMenu = Menu.buildFromTemplate(template);
    contextMenu.popup(win);
    return;
 });
});



app.on('ready-to-show', () => {

})

app.on('window-all-closed', () => {
		app.quit()
})
/*
app.on('activate', () => {
	if(win === null) {
		createWindow()
	}
})
*/
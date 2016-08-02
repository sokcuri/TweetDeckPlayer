const {app, BrowserWindow, dialog, session, Menu, MenuItem, ipcMain} = require('electron')
const electron = require('electron')
const path = require('path')
var fs = require("fs")

// TweetDeck Player 버전
const tdp_version = "TweetDeck Player v2.00 by @sokcuri"

// 설정
let win
var Config = {
    // 설정파일 로드
        try {
        }
        catch(e) {
        }
    },
    // 설정파일 저장
    save()
    {

    }
}
// 프로그램 시작시 설정파일을 로드
Config.load()

// 프로그램의 중복실행 방지
const existInst = app.makeSingleInstance((commandLine, workingDirectory) => {
    // 새로운 인스턴스가 실행되었을 때 기존 프로그램의 작동
    if (win) {
        win.show()
        win.focus()
    }
})

// 인스턴스가 존재하는 경우 프로그램 종료
if (existInst) {
    app.quit()
}

// 
// edit
//
var sub_cut = (webContents) => {return {
  label: 'Cut',
  click() {
      webContents.send('command', 'cut')
  }
}}
var sub_copy = (webContents) => {return {
  label: 'Copy',
  click() {
      webContents.send('command', 'copy')
  }
}}
var sub_paste = (webContents) => {return {
  label: 'Paste',
  click() {
      webContents.send('command', 'paste')
  }
}}
var sub_delete = (webContents) => {return {
  label: 'Delete',
  click() {
      webContents.send('command', 'delete')
  }
}}
var sub_selectall = (webContents) => {return {
  label: 'Select All',
  click() {
      webContents.send('command', 'selectall')
  }
}}
var sub_reload = (webContents) => {return {
  label: 'Reload',
  click() {
      webContents.send('command', 'reload')
  }
}}

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
}}
var sub_setting = (win) => {return {
  label: 'Setting',
  click() {
      var width = 500
      var height = 800
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
}}

//
// image
//
var sub_save_img = (webContents) => {return {
  label: 'Save image as..',
  click() {
      webContents.send('command', 'saveimage')
  }
}}
var sub_copy_img = (webContents) => {return {
  label: 'Copy image URL',
  click() {
      webContents.send('command', 'copyimage')
  }
}}
var sub_open_img = (webContents) => {return {
  label: 'Open image in browser',
  click() {
      webContents.send('command', 'openimage')
  }
}}
var sub_search_img_google = (webContents) => {return {
  label: 'Search image with Google',
  click() {
      webContents.send('command', 'googleimage')
  }
}}

//
// link
//
var sub_open_link = (webContents) => {return {
  label: 'Open link',
  click() {
      webContents.send('command', 'openlink')
  }
}}

var sub_save_link = (webContents) => {return {
  label: 'Save link as..',
  click() {
        webContents.send('command', 'savelink')
  }
}}
var sub_copy_link = (webContents) => {return {
  label: 'Copy link URL',
  click() {
      webContents.send('command', 'copylink')
  }
}}

app.on("ready", function() {
    const ses = session.fromPartition('persist:main')

    preference.icon = __dirname + '/tweetdeck.ico'
    preference.webPreferences = {
        nodeIntegration: false,
        partition: "persist:main",
        preload: path.join(__dirname, 'preload.js')
    }
    win = new BrowserWindow(preference)
    win.loadURL("https://tweetdeck.twitter.com/")
    //win.loadURL("https://userstream.twitter.com")
    //win.webContents.openDevTools()

    win.webContents.on('did-get-redirect-request', function(e, oldURL, newURL, isMainFrame, httpResponseCode, requestMethod, refeerrer, header) {
        if (isMainFrame)
	    {
            setTimeout(() => win.loadURL(newURL), 100)
            e.preventDefault()
        }
    })
    win.webContents.on('did-start-loading', function() {
    })
    win.webContents.on('dom-ready', function() {
        win.webContents.insertCSS(`.pace{-webkit-pointer-events:none;pointer-events:none;-webkit-user-select:none;-moz-user-select:none;user-select:none}.pace-inactive{display:none}.pace .pace-progress{background:#29d;position:fixed;z-index:2000;top:0;right:100%;width:100%;height:2px});`)
        
        var mod_version = `if (window.TD_mustaches) window.TD_mustaches["version.mustache"] = "${tdp_version} (TweetDeck {{version}}{{#buildIDShort}}-{{buildIDShort}}{{/buildIDShort}})"`
        var mod_title = `if (document.title == 'TweetDeck') document.title = 'TweetDeck Player'; else document.title = 'TweetDeck Player - ' + document.title`
        win.webContents.executeJavaScript(`${mod_version}; ${mod_title};`)
    })
    win.webContents.on('did-finish-load', function() {

        // 가을별(Gaeulbyul) 님의 트윗덱 이미지 붙여넣기 스크립트
        // 트윗덱에 클립보드 붙여넣기(Ctrl-V)로 이미지를 업로드하는 기능을 추가한다.
        // https://gist.github.com/zn/4f622ba80513e0f4d0dd3f13dcd085db
        var gaeulbyul_paste = `$(document.body).on('paste', function (event) {
        if ($('.js-add-image-button').hasClass('is-disabled')) {
            return;
        }
        var items = event.originalEvent.clipboardData.items;
        var item = items[0];
        if (item.kind !== 'file') return;
        var files = [ item.getAsFile() ];
        // 트윗 입력창을 닫은 이후에 멘션 안 남게
        if (!$('.app-content').hasClass('is-open')) {
            $(document).trigger('uiComposeTweet', { type: 'tweet' });
        }
        $(document).trigger('uiFilesAdded', { files });
        });`
        
        // inject to stylesheet
        var inject_style = `function injectStyles(rule) {
        var div = $("<div />", {
            html: '&shy;<style>' + rule + '</style>'
        }).appendTo("body");    
        }`

        // contenteditable=true인 div에 커서가 가로막히는 현상을 방지하기 위한 패치 
        var cont_div_patch = `var el; if(document.body) el = document.body.querySelector('[contenteditable="true"]'); if (el) { document.body.querySelector('[contenteditable="true"]').style = 'opacity: 0; pointer-events: none'; }`

        // 시작시 트윗덱 플레이어 툴팁 표시 및 스크립트 동작 
        win.webContents.executeJavaScript(`${inject_style}; var TDP = {}; TDP.onPageLoad = () => {setTimeout(() => { if (!TD || !TD.ready) { TDP.onPageLoad(); } else { TD.controller.progressIndicator.addMessage(TD.i("${tdp_version}")); ${gaeulbyul_paste}; setTimeout(() => { TD.settings.setUseStream(TD.settings.getUseStream()); ${cont_div_patch}; }, 3000); if (Pace) setTimeout(() => { injectStyles('.pace-progress { display: none }') }, 2000) }}, 1000)}; TDP.onPageLoad();`)
    })

    win.on("close", function() {
    })

    win.webContents.on('new-window', (e, url) => {
	    e.preventDefault()
	    require('electron').shell.openExternal(url)
    })

    cacheClear = () => 
	{
        win.webContents.session.clearCache(() => {
        })
        setTimeout(cacheClear, 60000)
    }
    cacheClear()



ipcMain.on('context-menu', function(event, menu, is_range) {

    var template = new Array()
    switch(menu)
    {
        case 'main':
            if (is_range)
            {
                template.push(sub_copy(event.sender))
                template.push(new Object({ type: 'separator' }))
            }
            template.push(sub_reload(event.sender))
        break

        case 'text':
            template.push(new Object({ label: 'Cut', enabled: false }))
            template.push(new Object({ label: 'Copy', enabled: false }))
            template.push(new Object({ type: 'separator' }))
            template.push(sub_paste(event.sender))
            template.push(new Object({ label: 'Delete', enabled: false }))
            template.push(new Object({ type: 'separator' }))
            template.push(sub_selectall(event.sender))
            template.push(new Object({ type: 'separator' }))
            template.push(sub_reload(event.sender))
        break

        case 'text_sel':
            template.push(sub_cut(event.sender))
            template.push(sub_copy(event.sender))
            template.push(new Object({ type: 'separator' }))
            template.push(sub_paste(event.sender))
            template.push(sub_delete(event.sender))
            template.push(new Object({ type: 'separator' }))
            template.push(sub_selectall(event.sender))
            template.push(new Object({ type: 'separator' }))
            template.push(sub_reload(event.sender))
        break

        case 'setting':
            template.push(sub_alwaystop(win))
            template.push(sub_setting(win))
            template.push(new Object({ type: 'separator' }))
            template.push(sub_reload(event.sender))
        break

        case 'selection':
            template.push(sub_copy(event.sender))
            template.push(new Object({ type: 'separator' }))
            template.push(sub_reload(event.sender))
        break

        case 'image':
            template.push(sub_save_img(event.sender))
            template.push(sub_copy_img(event.sender))
            template.push(sub_open_img(event.sender))
            template.push(sub_search_img_google(event.sender))
            template.push(new Object({ type: 'separator' }))
            template.push(sub_reload(event.sender))
        break

        case 'link':
            template.push(sub_open_link(event.sender))
            template.push(sub_save_link(event.sender))
            template.push(sub_copy_link(event.sender))
            template.push(new Object({ type: 'separator' }))
            if (is_range)
            {
                template.push(sub_copy(event.sender))
                template.push(new Object({ type: 'separator' }))
            }
            template.push(sub_reload(event.sender))
        break

        case 'linkandimage':
            template.push(sub_save_link(event.sender))
            template.push(sub_copy_link(event.sender))
            template.push(sub_open_link(event.sender))
            template.push(new Object({ type: 'separator' }))
            template.push(sub_save_img(event.sender))
            template.push(sub_copy_img(event.sender))
            template.push(sub_open_img(event.sender))
            template.push(sub_search_img_google(event.sender))
            template.push(new Object({ type: 'separator' }))
            template.push(sub_reload(event.sender))
        break
    }
    var contextMenu = Menu.buildFromTemplate(template)
    contextMenu.popup(win)
    return
 })
})

app.on('ready-to-show', () => {

})

app.on('window-all-closed', () => {
		app.quit()
})
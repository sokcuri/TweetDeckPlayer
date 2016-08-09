const {app, BrowserWindow, dialog, session, Menu, MenuItem, ipcMain} = require('electron')
const electron = require('electron')
const path = require('path')
const fs = require("fs")

var Util = require('./util.js')

// TweetDeck Player 버전
const tdp_version = "TweetDeck Player v2.00 by @sokcuri"

// 설정
let win
var Config = {
    // 설정파일 로드
    data: {},
    initPath: path.join(__dirname, "init.json"),
    load()
    {
        try {
            Config.data = JSON.parse(fs.readFileSync(Config.initPath, 'utf8'))
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
var existInst = app.makeSingleInstance((commandLine, workingDirectory) => {
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

// 렌더러 프로세스가 죽었을때 이벤트
app.on('gpu-process-crashed', () => {
    
})

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
      var height = 400
      var b = win.getBounds()
      var x = Math.floor(b.x + (b.width - width) / 2)
      var y = Math.floor(b.y + (b.height - height) / 2)
      let child = new BrowserWindow({parent: win, width: width, height: height, x: x, y: y, 
modal: true, show: false})
      child.setMenu(null)
      child.loadURL(path.join(__dirname, 'setting.html'))
      child.once('ready-to-show', () => {
          child.show()
      })
  }
}}

//
// image
//
var sub_save_img = (webContents, Addr) => {return {
  label: 'Save image as..',
  click() {
    var fs = require('fs')
    var request = require('request')

    // 원본 해상도 이미지 경로를 가져온다
    var path = Util.getOrigPath(Addr.img)
    var filename = Util.getFileName(path)
    var ext = Util.getFileExtension(path)
    var filters = new Array()

    // Save dialog에 들어갈 파일 필터 정의
    switch(ext)
    {
        case 'jpg':
            filters.push(new Object({name: 'JPG File', extensions: ['jpg']}))
        break
        case 'png':
            filters.push(new Object({name: 'PNG File', extensions: ['png']}))
        break
        case 'gif':
            filters.push(new Object({name: 'GIF File', extensions: ['gif']}))
        break
        default:
            filters.push(new Object({name: ext.toUpperCase() + ' File', extensions: [ext.toLowerCase()]}))
    }
    filters.push(new Object({name: 'All Files', extensions: ['*']}))

    // 모든 포인터 이벤트를 잠시 없앤다
    webContents.send('pointer-events', 'none')

    // Save Dialog를 띄운다
    var savepath = dialog.showSaveDialog(
    {
        defaultPath: filename,
        filters: filters
    })

    // 포인터 이벤트를 되살린다
    webContents.send('pointer-events', 'all')

    // savepath가 없는 경우 리턴
    if (typeof savepath == 'undefined') return
    
    // http 요청을 보내고 저장
    request(path).pipe(fs.createWriteStream(savepath))
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

var sub_save_link = (webContents, Addr) => {return {
  label: 'Save link as..',
  click() {
    var fs = require('fs')
    var request = require('request')

    // 될 수 있으면 원본 화질의 이미지를 가져온다
    var path = Util.getOrigPath(Addr.link)
    var filename = Util.getFileName(path)
    var ext = Util.getFileExtension(path)
    var filters = new Array()
    
    // 리퀘스트를 때려서 해당 링크의 MIME TYPE을 얻어온다
    request(
    {
        method: 'HEAD',
        followAllRedirects: true, // 리다이렉트 따라가기 켬
        url: path
    }, function (error, response, body)
    {
        // 에러가 발생하면 동작하지 않음
        if (error)
            return

        // 컨텍스트 타입이 text/html인 경우 htm을 붙이고 필터에 추가
        if (response.headers['content-type'] &&
            response.headers['content-type'].toLowerCase().search('text/html') != -1)
        {
            filename += '.htm'
            filters.push(new Object({name: 'HTML Document', extensions: ['htm']}))
        }
        filters.push(new Object({name: 'All Files', extensions: ['*']}))

        // 모든 포인터 이벤트를 잠시 없앤다
        webContents.send('pointer-events', 'none')

        // 저장 다이얼로그를 띄운다
        var savepath = dialog.showSaveDialog({defaultPath: filename, filters: filters})
    
        // 포인터 이벤트를 되살린다
        webContents.send('pointer-events', 'all')
        
        if (typeof savepath == 'undefined')
            return

        // http 요청해서 링크를 저장
        var req_url = response.request.uri.href
        request(req_url).pipe(fs.createWriteStream(savepath))
    })
  }
}}
var sub_copy_link = (webContents) => {return {
  label: 'Copy link URL',
  click() {
      webContents.send('command', 'copylink')
  }
}}

app.on("ready", function() {
    // 리눅스 일부 환경에서 검은색으로 화면이 뜨는 문제 해결을 위한 코드
    // chrome://gpu/ 를 확인해 Canvas Hardware acceleration이 사용 불가면 disable-gpu를 달아준다
    // --
    var chk_win;
    var is_relaunch = false;

    // process.argv를 확인해 --relaunch 인자가 있는지 확인
    for (var e of process.argv)
    {
        if ('--relaunch'.search(e) != -1)
            is_relaunch = true
    }
    
    // --relaunch 인자가 없다면 pre_check
    if (!is_relaunch)
    {
        chk_win = new BrowserWindow({show: false, width: 0, height: 0, webPreferences: { preload: path.join(__dirname, 'pre_check.js') }})
        chk_win.loadURL("chrome://gpu/")
    }
    // --relaunch 인자가 있다면 바로 run
    else
        run()

    // 렌더러 프로세스에서 run 명령을 받으면 실행
    ipcMain.on('run', (event) => run(chk_win))
})

// disable-gpu 항목으로 재시작이 필요할 때
ipcMain.on('nogpu-relaunch', () => {
    app.releaseSingleInstance()
    existInst = null
    var exec = require('child_process').exec;
    var x = process.execPath + ' ' + process.argv[1] + ' --disable-gpu --relaunch';
    exec(x);
    setTimeout(() => app.quit(), 100)
})

// 트윗덱 플레이어 실행 프로시저
run = (chk_win) => 
{
    const ses = session.fromPartition('persist:main')

    var preference = new Object((Config.data && Config.data.bounds) ? Config.data.bounds : "")
    preference.icon = __dirname + '/tweetdeck.ico'
    preference.webPreferences = {
        nodeIntegration: false,
        partition: "persist:main",
        preload: path.join(__dirname, 'preload.js')
    }
    win = new BrowserWindow(preference)
    win.loadURL("https://tweetdeck.twitter.com")

    // 체크를 위한 윈도우가 존재하는 경우 닫기
    if (chk_win)
        chk_win.close()

    // devtool 열기
    //win.webContents.openDevTools()

    // electron post 리다이렉트 문제 해결 코드 
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

        // 맥용 한글 기본 입력기 이슈 해결
        win.webContents.executeJavaScript(`$(document).on('keydown',(e)=>{if(document.activeElement==document.body&&e.key>='ㄱ'&&e.key<='ㅣ'){e.preventDefault();e.stopPropagation();$(document.activeElement).trigger(jQuery.Event('keypress',{which:e.which}))}});`);
    })

    win.on("close", function() {
        Config.data.bounds = win.getBounds()
        fs.writeFileSync(Config.initPath, JSON.stringify(Config.data))
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
    //cacheClear()
}

// 컨텍스트 메뉴
ipcMain.on('context-menu', function(event, menu, is_range, Addr) {

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
            template.push(sub_save_img(event.sender, Addr))
            template.push(sub_copy_img(event.sender))
            template.push(sub_open_img(event.sender))
            template.push(sub_search_img_google(event.sender))
            template.push(new Object({ type: 'separator' }))
            template.push(sub_reload(event.sender))
        break

        case 'link':
            template.push(sub_open_link(event.sender))
            template.push(sub_save_link(event.sender, Addr))
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
            template.push(sub_save_link(event.sender, Addr))
            template.push(sub_copy_link(event.sender))
            template.push(sub_open_link(event.sender))
            template.push(new Object({ type: 'separator' }))
            template.push(sub_save_img(event.sender, Addr))
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
app.on('ready-to-show', () => {

})

app.on('window-all-closed', () => {
		app.quit()
})
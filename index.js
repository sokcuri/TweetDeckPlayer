const {app, BrowserWindow} = require('electron')
const {dialog} = require('electron')
const path = require('path')

const electron = require('electron');
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;
const ipcMain = electron.ipcMain;

let win
global.sharedObj = {prop1: null};


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
    win = new BrowserWindow({
        webPreferences: {
            nodeIntegration: false,
            partition: "persist:main",
						preload: path.join(__dirname, 'preload.js')
        }
    });
    win.loadURL("https://tweetdeck.twitter.com/");
    //win.webContents.openDevTools();

    win.webContents.on('did-get-redirect-request', function(e, oldURL, newURL, isMainFrame, httpResponseCode, requestMethod, refeerrer, header) {
        if (isMainFrame)
	    {
            setTimeout(() => win.loadURL(newURL), 100);
            e.preventDefault();
        }
    });
    var handleRedirect = (e, url) => {
    if(url != win.webContents.getURL()) {
	        e.preventDefault()
            require('electron').shell.openExternal(url)
        }
    }

    //win.webContents.on('will-navigate', handleRedirect);
    win.webContents.on('new-window', handleRedirect);

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
	if(process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if(win === null) {
		createWindow()
	}
})

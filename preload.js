const {remote, clipboard} = require('electron')
const {dialog} = remote
const ses = remote.session.fromPartition('persist:main')
const ipcRenderer = require('electron').ipcRenderer;

getMemoryInfo = () =>
{
    var i = process.getProcessMemoryInfo()
    //console.log(`W: ${i.workingSetSize} PW: ${i.peakWorkingSetSize} PB: ${i.privateBytes} SB: ${i.sharedBytes}`);
    ses.getCacheSize((size) => {
        //console.log(`cache size: ${size}`)
    })
    setTimeout(getMemoryInfo, 5000)
}
getMemoryInfo();

const {Menu, MenuItem} = remote;

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
/* 
// Modify the user agent for all requests to the following urls.
const filter = {
urls: ['*']
}

ses.webRequest.onCompleted(filter, (details) => {

    console.log(details.url);
});

ses.webRequest.onBeforeRequest(filter, (details, callback) => {
    console.log(details.url);
    if(details.url.search('httpbin.org') != -1)
    callback({cancel: true, redirectURL: "https://twitter.com/"})
    else
    callback({cancel: true});
});

ses.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    //console.log(details.requestHeaders);
    if (details.url.search('/dist/bundle') != -1)
    {
        console.log(details.url);
        details.url = '/test';
    }
callback({cancel: true, requestHeaders: details.requestHeaders})
})
    

ses.webRequest.onSendHeaders(filter, (details) => {
details.requestHeaders['User-Agent'] = 'asdgasdgasdg'
});

ses.webRequest.onHeadersReceived(filter, (details, callback) => {
    //console.log(details.statusCode);
    //console.log(details.statusLine);
    //details.statusCode = 307;
    //details.statusLine = "HTTP/1.1 307 Temporary Redirect";
    //details.responseHeaders['Location'] = ["http://twitter.com"];
    callback({cancel: true, responseHeaders: details.responseHeaders, statusLine: details.statusLine})
})*/
// 임시 저장되는 주소 변수들
var img_addr, link_addr;

ipcRenderer.on('command', (event, cmd) => {
    switch(cmd)
    {
        case 'cut':
	          document.execCommand("cut");
        break;
        case 'copy':
   	        document.execCommand("copy");
        break;
        case 'paste':
            document.execCommand("paste")
        break;
        case 'delete':
            document.execCommand("delete");
        break;
        case 'selectall':
            document.execCommand("selectall");
        break;
        case 'saveimage':
        {
            // download original resolution image
            var filename = getLinkFilename(img_addr);
            var ext = filename.substr(filename.lastIndexOf('.'));
            var link = getLinkOrig(img_addr);
            var filters = new Array();
            
            if (ext == '.jpg')
            {
                filters.push(new Object({name: 'JPG File', extensions: ['jpg']}))
                filters.push(new Object({name: 'All Files', extensions: ['*']}))
            }
            else if (ext == '.png')
            {
                filters.push(new Object({name: 'PNG File', extensions: ['png']}))
                filters.push(new Object({name: 'All Files', extensions: ['*']}))
            }
            else if (ext == '.gif')
            {
                filters.push(new Object({name: 'GIF File', extensions: ['gif']}))
                filters.push(new Object({name: 'All Files', extensions: ['*']}))
            }

            var path = dialog.showSaveDialog({defaultPath: filename, filters: filters})
            if (typeof path == 'undefined')
              return;

            console.log('path: ' + path);

            console.log('link: ' + link);
            var https = require('https');
            var fs   = require('fs');

            var file = fs.createWriteStream(path);
            var request = https.get(img_addr, function(response) {
              response.pipe(file);
            });
        }
        break;
        case 'copyimage':
            var link = getLinkOrig(img_addr);
            clipboard.writeText(link);
        break;
        case 'openimage':
            var link = getLinkOrig(img_addr);
            window.open(link);
        break;
        case 'googleimage':
            var link = 'https://www.google.com/searchbyimage?image_url=' + encodeURI(getLinkOrig(img_addr));
            window.open(link);
        break;
        case 'openlink':
            var link = getLinkOrig(link_addr);
            window.open(link);
        break;
        case 'savelink':
        {
            var fs = require('fs');
            var http = require('http');
            var request = require('request');
            var filename = getLinkFilename(link_addr);
            var ext = filename.substr(filename.lastIndexOf('.'));
            var link = getLinkOrig(link_addr);
            var filters = new Array();
            
            request({
                method: 'HEAD',
                followAllRedirects: true,
                url: link_addr
            }, function (error, response, body) {
              if (!error)
              {
                  console.log(response);
                  if (response.headers['content-type'] && response.headers['content-type'].toLowerCase().search('text/html') != -1)
                  {
                      filename += '.htm';
                      filters.push(new Object({name: 'HTML Document', extensions: ['htm']}))
                      filters.push(new Object({name: 'All Files', extensions: ['*']}))
                  }
                  var path = dialog.showSaveDialog({defaultPath: filename, filters: filters})
                  if (typeof path == 'undefined')
                    return;

                  console.log('path: ' + path);
                  console.log('link: ' + link);
                  request(response.request.uri.href).pipe(fs.createWriteStream(path))
              }
            });
        }
        break;
        case 'copylink':
            var link = getLinkOrig(link_addr);
            clipboard.writeText(link);
        break;
        case 'reload':
            document.location.reload();
        break;
    }
})

// context menu event listener
window.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    var el = document.activeElement;
    var hover = document.querySelectorAll(":hover");
    var is_range = (document.getSelection().type == 'Range');
    var target = "main";
    
    // textbox/input
    if(el && (el.tagName.toLowerCase() == 'input' && el.type == 'text' ||
        el.tagName.toLowerCase() == 'textarea'))
    {
        if(is_range)
           target = 'text_sel'
        else
            target = 'text'
    }
    // image
    else if (document.querySelector('img:hover'))
    {
        img_addr = document.querySelector('img:hover').src;
        if (document.querySelector('a:hover'))
        {
            link_addr = document.querySelector('a:hover').href;
            target = 'linkandimage'
        }
        else
            target = 'image'
    }
    // media image box
    else if (document.querySelector('.js-media-image-link:hover'))
    {
        img_addr = document.querySelector('.js-media-image-link:hover').style.backgroundImage.slice(5, -2);
        target = 'image'
    }
    // link
    else if (document.querySelector('a:hover') && document.querySelector('a:hover').href)
    {
        link_addr = document.querySelector('a:hover').href;
        target = 'link'
    }
    else
        target = 'main'

    ipcRenderer.send('context-menu', target, is_range)
}, false)

var open = XMLHttpRequest.prototype.open;

XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    var oldReady;
    if (async) {   
        oldReady = this.onreadystatechange;
        // override onReadyStateChange
        this.onreadystatechange = function() {
            if (this.readyState == 4) {
                console.log(this.responseText.substr(0, 255));
                // this.responseText is the ajax result
                // create a dummay ajax object so we can modify responseText
                var self = this;
                var dummy = {};
                ["statusText", "status", "readyState", "responseType"].forEach(function(item) {
                    dummy[item] = self[item];
                });
                dummy.responseText = '{"msg": "Hello"}';
                //return oldReady.call(dummy);
            } else {
                // call original onreadystatechange handler
                //return oldReady.apply(this, arguments);
            }
        }
    } 
    // call original open method
    return open.apply(this, arguments);
}


/*
XMLHttpRequest.prototype.realSend = XMLHttpRequest.prototype.send;
var newSend = function(vData) { console.log("data: " + vData); this.realSend(vData); }
XMLHttpRequest.prototype.send = newSend;
*/
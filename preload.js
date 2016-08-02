const {remote, clipboard} = require('electron')
const {Menu, MenuItem, dialog} = remote

const ses = remote.session.fromPartition('persist:main')
const ipcRenderer = require('electron').ipcRenderer

// 로딩 프로그레스 바 모듈 로드 
require('./pace.min.js')

//
// 디버그 관련 함수들을 모아놓는 오브젝트
_Debug = {
    // 메모리 정보를 콘솔에 출력
    showMemoryInfo()
    {
        var i = process.getProcessMemoryInfo()
        console.log(`W: ${i.workingSetSize} PW: ${i.peakWorkingSetSize} PB: ${i.privateBytes} SB: ${i.sharedBytes}`)
    
        ses.getCacheSize((size) => console.log(`cache size: ${size}`))
        
        if (_Debug.showMemoryInfo.repeat)
            setTimeout(_Debug.showMemoryInfo, _Debug.showMemoryInfo.tick)
    }
}
// 일정 시간마다 반복해서 출력라고 싶은 경우
_Debug.showMemoryInfo.repeat = true
_Debug.showMemoryInfo.tick = 5000;

var Str = {
    twimg_media: "twimg.com/media",
    twimg_profile: "twimg.com/profile_images"
}

var Util = {

    // 트위터 이미지의 원본 크기를 가리키는 링크를 반환
    getOrigPath(_href)
    {
        var href = _href
        if (href.search(Str.twimg_media) != -1)
            href = href.substr(0, href.lastIndexOf(':')) + ':orig'
        else
        if (href.search(Str.twimg_profile) != -1)
            href = href.substr(0, href.lastIndexOf('_')) + href.substr(href.lastIndexOf('.'))
        
        return href
    },

    // 주어진 링크의 파일 이름을 반환
    getFileName(_href)
    {
        return _href.substr(_href.lastIndexOf('/') + 1)
    },

    // 파일의 확장자를 반환
    getFileExtension(_href)
    {
        // 파일 경로에서 파일 이름을 가져옴
        var filename = Util.getFileName(_href)

        // 확장자가 없는 경우 공백 반환
        if (filename.lastIndexOf('.') == -1) return ""

        // 확장자를 반환
        return filename.substr(filename.lastIndexOf('.') + 1)   
    }
}

// 우클릭시 임시 저장하는 이미지 주소와 링크 주소를 담는 변수
var Addr = {
    img: '',
    link: ''
}

// 메인 스레드에서 렌더러로 요청하는 커맨드
ipcRenderer.on('command', (event, cmd) => {
    switch(cmd)
    {
        case 'cut':
	        document.execCommand("cut")
        break
        case 'copy':
   	        document.execCommand("copy")
        break
        case 'paste':
            document.execCommand("paste")
        break
        case 'delete':
            document.execCommand("delete")
        break
        case 'selectall':
            document.execCommand("selectall")
        break
        case 'saveimage':
        {
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

            // Save Dialog를 띄운다
            var savepath = dialog.showSaveDialog(
            {
                defaultPath: filename,
                filters: filters
            })
            if (typeof savepath == 'undefined') return
            
            // http 요청을 보내고 저장
            request(path).pipe(fs.createWriteStream(savepath))
        }
        break
        case 'copyimage':
            var href = Util.getOrigPath(Addr.img)
            clipboard.writeText(href)
        break
        case 'openimage':
            var href = Util.getOrigPath(Addr.img)
            window.open(href)
        break
        case 'googleimage':
            var href = 'https://www.google.com/searchbyimage?image_url=' +
                encodeURI(Util.getOrigPath(Addr.img))
            window.open(href)
        break
        case 'openlink':
            var href = Util.getOrigPath(Addr.link)
            window.open(href)
        break
        case 'savelink':
        {
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

                // 저장 다이얼로그를 띄운다
                var savepath = dialog.showSaveDialog({defaultPath: filename, filters: filters})
                if (typeof savepath == 'undefined')
                    return

                // 경로와 링크 콘솔 출력
                console.log('path: ' + path)
                console.log('link: ' + link)

                // http 요청해서 링크를 저장
                var req_url = response.request.uri.href
                request(req_url).pipe(fs.createWriteStream(savepath))
            })
        }
        break
        case 'copylink':
            var href = Util.getOrigPath(Addr.link)
            clipboard.writeText(href)
        break
        case 'reload':
            document.location.reload()
        break
    }
})

// 컨텍스트 메뉴 이벤트 리스너
window.addEventListener('contextmenu', (e) => {
    var target;
    
    // 기존 메뉴 이벤트를 무시
    e.preventDefault()
    
    // 현재 활성화된 element
    var el = document.activeElement

    // 현재 마우스가 가리키고 있는 elements
    var hover = document.querySelectorAll(":hover")

    // 선택 영역이 있는지 여부
    var is_range = (document.getSelection().type == 'Range')
    
    // input=text 또는 textarea를 가리킴
    if (el &&
       (el.tagName.toLowerCase() == 'input' && el.type == 'text') ||
       (el.tagName.toLowerCase() == 'textarea'))
    {
        target = (is_rang ? 'text_sel' : 'text')
    }
    // 설정 버튼
    else if (document.querySelector('.js-app-settings:hover'))
    {
        target = 'setting'
    }
    // 이미지
    else if (document.querySelector('img:hover'))
    {
        Addr.img = document.querySelector('img:hover').src

        // 링크가 포함되어 있는 경우
        if (document.querySelector('a:hover'))
        {
            Addr.link = document.querySelector('a:hover').href
            target = 'linkandimage'
        }
        else
            target = 'image'
    }
    // 미디어 이미지 박스 (트윗 내의 이미지 박스)
    else if (document.querySelector('.js-media-image-link:hover'))
    {
        Addr.img = document.querySelector('.js-media-image-link:hover').style.backgroundImage.slice(5, -2)
        target = 'image'
    }
    // 링크
    else if (document.querySelector('a:hover') && document.querySelector('a:hover').href)
    {
        Addr.link = document.querySelector('a:hover').href
        target = 'link'
    }
    // 기본 컨텍스트
    else
    {
        target = 'main'
    }

    // 컨텍스트 메뉴를 띄우라고 메인 스레드에 요청
    ipcRenderer.send('context-menu', target, is_range)
}, false)
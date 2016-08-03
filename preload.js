const {remote, clipboard} = require('electron')
const {Menu, MenuItem, dialog} = remote

const ses = remote.session.fromPartition('persist:main')
const ipcRenderer = require('electron').ipcRenderer
var Util = require('./util.js')

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

// 우클릭시 임시 저장하는 이미지 주소와 링크 주소를 담는 변수
var Addr = {
    img: '',
    link: ''
}

// 포인터 이벤트
ipcRenderer.on('pointer-events', (event, opt) => {
    document.body.style = `pointer-events: ${opt};`
})

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
        target = (is_range ? 'text_sel' : 'text')
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
    ipcRenderer.send('context-menu', target, is_range, Addr)
}, false)
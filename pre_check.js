const {remote, app} = require('electron')
const ipcRenderer = require('electron').ipcRenderer

remote.getCurrentWebContents().on('did-finish-load', () => {

    // timeout
    setTimeout(() => {
        if(tick)
        ipcRenderer.send('nogpu-relaunch')
    }, 3000)

    document.body.style = 'display: none'
    var tick = true
    var check = () =>
    {
        if (!document.querySelector('.feature-status-list').childElementCount)
        {
            setTimeout(check, 100)
        }
        else
        {
            tick = false
            if (document.body.innerText.search('Canvas: Software only, hardware acceleration unavailable') != -1)
            {
                ipcRenderer.send('nogpu-relaunch')
            }
            else
            {
                ipcRenderer.send('run')
            }
        }
    }
    check()
})
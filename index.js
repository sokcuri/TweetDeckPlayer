const {app, BrowserWindow} = require('electron')
const {dialog} = require('electron')
const path = require('path')
const asdf = "asdf";

let win
global.sharedObj = {prop1: null};

app.on("ready", function() {
    win = new BrowserWindow({
        webPreferences: {
            nodeIntegration: false,
            partition: "persist:main",
						preload: path.join(__dirname, 'preload.js')
        }
    });
    win.loadURL("https://tweetdeck.twitter.com/");
    win.webContents.openDevTools();

    win.webContents.on('did-get-redirect-request', function(e, oldURL, newURL, isMainFrame, httpResponseCode, requestMethod, refeerrer, header) {
        if (isMainFrame)
        {
            setTimeout(() => win.loadURL(newURL), 100);
            e.preventDefault();
        }
    });

		cacheClear = () => 
		{
				win.webContents.session.clearCache(() => {
				})
				setTimeout(cacheClear, 60000);
		};
		cacheClear();

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

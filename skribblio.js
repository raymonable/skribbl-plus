const { app, BrowserWindow, protocol, ipcMain } = require('electron');
const path = require('path');
const fetch = require('cross-fetch').fetch;
const fs = require('fs')

app.on('ready', function() {
    var skribbl = new BrowserWindow({
        show: false,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'skribbler.js')
        },
    });
    
    // filter ads
    require('@cliqz/adblocker-electron').ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
        blocker.enableBlockingInSession(skribbl.webContents.session);
    })

    // custom game.js
    skribbl.webContents.on('did-start-loading', function(e) {
        protocol.interceptBufferProtocol('https', function(request, respond) {
            if (request.url.includes('game.js')) {
                protocol.uninterceptProtocol('https');
                respond(Buffer.from(fs.readFileSync('hacked.game.js', 'utf-8')))
            } else {
                // try to fix it
                fetch(request.url).then((res) => res.blob()).then(async(res) => {
                    respond(Buffer.from(Buffer.from(await res.arrayBuffer())));
                }).catch((err) => {
                    skribbl.loadURL('data:text/plain;base64,'+Buffer.from('An error occured: '+err).toString('base64')) // display error i guess
                })
            }
        });
      });

    skribbl.setFullScreen(true);
    skribbl.loadURL('https://skribbl.io');
    skribbl.show();

    ipcMain.on('exit', () => {
        skribbl.close();
        process.exit(0);
    })

    ipcMain.on('display', () => {
        //skribbl.show();
    })
});
const {
    contextBridge,
    ipcRenderer
} = require("electron");

// disarm redirects (it's in fullscreen, after all)

contextBridge.exposeInMainWorld('SKRIBBL_PLUS_DISARM', () => {
    document.querySelectorAll('a').forEach((link) => {
        if (!link.href.includes('#')) { 
            link.removeAttribute("href");
            link.style.cursor = "pointer" 
        } 
    });
});

// add exit button to replace audio button (audio will be disabled by default)

contextBridge.exposeInMainWorld('SKRIBBL_PLUS_EXIT_BTN', (jquery) => {
    var exit_btn = document.createElement('div');
    exit_btn.id = "exit_btn";
    exit_btn.setAttribute('data-toggle', 'tooltip');
    exit_btn.setAttribute('data-placement', 'right');
    exit_btn.title = "";
    exit_btn.setAttribute('data-original-title', 'Exit Scribbl');
    exit_btn.addEventListener('click', () => {
        if (exit_btn.getAttribute('data-original-title') == 'Exit Scribbl') {
            ipcRenderer.postMessage('exit');
        }
    })
    document.body.insertBefore(exit_btn, document.querySelector('#audio'))
})

// clean up any left-over ads

contextBridge.exposeInMainWorld('SKRIBBL_PLUS_ENFORCE_NO_ADS', () => {
    document.querySelectorAll('.adsbygoogle').forEach((ad) => {
        ad.remove();
    });
})

// add mods menu to lobby

contextBridge.exposeInMainWorld('SKRIBBL_PLUS_SHOW_MODS', () => {
    document.querySelector('#accordion').innerHTML += `
    <div id="tabMods" role="tab">
        <h3>
            <a role="button" data-toggle="collapse" data-parent="#accordion" href="#collapseMods" aria-expanded="true" aria-controls="collapseMods">
                Modifications
            </a>
        </h3>
    </div>
    <div class="panel-collapse collapse" id="collapseMods" role="tabpanel" aria-labelledby="tabMods" aria-expanded="false">
        This is a modified build of skribbl.io.<br>
        As such, features may be broken in the future or you may not be able to connect.<p>
        The game's main code has been modified to:<br>
         - give everyone little horns<br>
         - slightly better canvas<br>
         - mini keyboard<br>
         - create an exit button for in-lobbies & to close the application
         - and of course this little menu<p>
        All of this was done to make the experience on a standalone drawing tablet better.
    </div>
    `
})

// add virtual keyboard

contextBridge.exposeInMainWorld('SKRIBBL_PLUS_VIRTUAL_KEYBOARD', () => {
    var keyboard_injection = document.createElement('script');
    keyboard_injection.innerHTML = `document.querySelector('#boxMessages').style.height = "70%";
    var SKRIBBL_PLUS_KEYBOARD = [
        ['q','w','e','r','t','y','u','i','o','p', {name: '<', exec:() => {
            document.querySelector('#inputChat').value = document.querySelector('#inputChat').value.slice(0, -1)
        }}],
        ['a','s','d','f','g','h','j','k','l',{name: '>', exec:() => {
            window['submit_chat']();
        }}],
        ['z','x','c','v','b','n','m', '~'],
        [' ']
    ];
    var KEYBOARD =  document.createElement('div');
    KEYBOARD.classList = 'keyboard-container';
    document.querySelector('#boxChatInput').appendChild(KEYBOARD)
    SKRIBBL_PLUS_KEYBOARD.forEach((ROW) => {
        var _ROW = document.createElement('div');
        _ROW.classList = "keyboard-row"
        KEYBOARD.appendChild(_ROW);
        ROW.forEach((KEY) => {
            var EXEC = () => {
                if (typeof(KEY) == "object") {
                    KEY.exec()
                } else {
                    document.querySelector('#inputChat').value += KEY;
                }
            }
            var _KEY = document.createElement('div');
            _KEY.innerHTML = typeof(KEY) == "object" ? KEY.name : KEY;
            _KEY.classList = "keyboard-key";
            _KEY.addEventListener('click', () => {
                EXEC();
            });
            _ROW.appendChild(_KEY);
        });
    })`;
    document.head.appendChild(keyboard_injection);
});

// execute all the changes we've made

window.addEventListener('load', function () {
    var injection = document.createElement('script');
    injection.innerHTML = `
SKRIBBL_PLUS_DISARM();
SKRIBBL_PLUS_EXIT_BTN();
SKRIBBL_PLUS_ENFORCE_NO_ADS();
SKRIBBL_PLUS_SHOW_MODS();
SKRIBBL_PLUS_VIRTUAL_KEYBOARD();
$('[data-toggle="tooltip"]').tooltip();
document.querySelector('#exit_btn').addEventListener('click', () => {
    if (document.querySelector('#exit_btn').getAttribute('data-original-title') != "Exit Scribbl") {
        window["game_instance"].close();
    }
})`;
    document.head.appendChild(injection);
    var css_injection = document.createElement('style');
    css_injection.innerHTML = `
    #exit_btn {
        position: fixed;
        cursor: pointer;
        background: url('https://i.imgur.com/ZQo27FH.gif') center no-repeat;
        background-size: contain;
        left: 9px;
        top: 57px;
        width: 48px;
        height: 48px;
        z-index: 1000
    }
    .keyboard {
        width: 100%;
    }
    .keyboard-row {
        display: flex;
    }
    .keyboard-key {
        flex: 1 1 auto;
        display: flex;
        align-content: center;
        justify-content: center;
        float: left;
        cursor: pointer;
        padding: 6px;
        border: solid 0.5px #d3d3d3;
        border-radius: 5px;
        margin: 2px;
        image-rendering: pixelated;
        background: white;
        min-height: 25px;
        user-select: none;
    }`;
    document.head.appendChild(css_injection);
});
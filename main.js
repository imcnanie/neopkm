const { app, BrowserWindow, protocol, session } = require('electron');
const path = require('path');
const startServer = require('./electron_server');
const url = require('node:url')

let mainWindow;


protocol.registerSchemesAsPrivileged([
    {
        scheme: 'myapp',
        privileges: {
            standard: true,
            secure: true,                      // Treat the protocol as secure (like HTTPS)
            bypassCSP: true,                   // Bypass Content Security Policy
            allowServiceWorkers: true,         // Allow Service Workers
            supportFetchAPI: true,             // Enable Fetch API
            corsEnabled: true,                 // Enable Cross-Origin Resource Sharing
        }
    }
]);


app.commandLine.appendSwitch('disable-site-isolation-trials');

app.on('ready', () => {

    
    
    startServer(); // Start the server

    mainWindow = new BrowserWindow({
        width: 1920, // Half of 3840 for 2x scaling
        height: 1080, // Half of 2160 for 2x scaling
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // To use require in renderer process
            enableRemoteModule: true, // Required to use remote module in renderer
	    webviewTag: true, // Enable WebView
	    webSecurity: false,  // Disable web security
            allowRunningInsecureContent: true,
            nodeIntegrationInSubFrames: true,
	    plugins: true

        },
    });



    mainWindow.setFullScreen(true);

    // Set the zoom factor to 2x
    mainWindow.webContents.setZoomFactor(2);

    //mainWindow.loadURL('myapp://index.html');
    
    // loading from localhost will have problems with the preload script for darkreader in webviews
    mainWindow.loadURL('http://localhost:8004');

    // This may have file upload issue TODO
    //mainWindow.loadFile("/home/printer/projects/neopkm/public/uploads/test.pdf")l//path.join(__dirname, 'public', 'index.html'));
});


const { app, BrowserWindow } = require('electron');
const path = require('path');
const startServer = require('./electron_server');

let mainWindow;

app.on('ready', () => {
    startServer(); // Start the server

    mainWindow = new BrowserWindow({
        width: 3840, // Half of 3840 for 2x scaling
        height: 2160, // Half of 2160 for 2x scaling
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // To use require in renderer process
            enableRemoteModule: true, // Required to use remote module in renderer
        },
    });

    mainWindow.setFullScreen(true);

    // Set the zoom factor to 2x
    mainWindow.webContents.setZoomFactor(2);

    mainWindow.loadFile(path.join(__dirname, 'public', 'index.html'));
});


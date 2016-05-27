var electron = require('electron')
var app = electron.app
var BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  app.quit()
})

app.on('ready', function () {
  // get screen info
  var electronScreen = electron.screen
  var size = electronScreen.getPrimaryDisplay().bounds
  var windowSize = {}

  // if the screen is large enough to support a
  // 720p window comfortably
  if (size.width >= 1366 && size.height >= 768) {
    windowSize.width = 1280
    windowSize.height = 720
  } else {
    // otherwise make the window a little smaller
    windowSize.width = 1024
    windowSize.height = 576
  }

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: windowSize.width, 
    height: windowSize.height, 
    x: 0, 
    y: 0, 
    resizable: false, 
    useContentSize: true,
    autoHideMenuBar: true
  })

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html') // eslint-disable-line no-path-concat

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  mainWindow.focus()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
})

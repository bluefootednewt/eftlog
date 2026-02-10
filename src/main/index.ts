import { app, shell, BrowserWindow, ipcMain, dialog, protocol } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import path from 'path'

// Path to your database file in the user's local folder
const DB_PATH = path.join(app.getPath('userData'), 'books.json')
const userDataPath = app.getPath('userData')
const configPath = path.join(userDataPath, 'config.json')

function createWindows(): void {
  // 1. Create the Splash Screen (Frameless and Transparent)
  const splash = new BrowserWindow({
    width: 1000,
    height: 600,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    show: false,
    skipTaskbar: true 
  })

  // Points to the compiled version in the 'out' folder
  splash.loadFile(join(__dirname, '../renderer/splash.html'))
  splash.once('ready-to-show', () => splash.show())

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: "EftLog",
    icon: path.join(__dirname, '../resources/icon.ico'),
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // 3. The Hand-off
  mainWindow.once('ready-to-show', () => {
    // Give the splash at least 2 seconds of glory
    setTimeout(() => {
      splash.close()
      mainWindow.show()
      // Force focus so fields aren't locked
      mainWindow.focus() 
    }, 2000)
  })

  ipcMain.handle('save-book', async (_event, book) => {
    // 1. Explicitly tell TypeScript this is an array of objects
    let books: any[] = [] 
    
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8')
      try {
        books = JSON.parse(data)
      } catch (e) {
        console.error("Failed to parse books.json", e)
        books = [] // Reset to empty if file is corrupted
      }
    }

    // 2. Now 'book' can be pushed without the 'never' error
    books.push(book)

    fs.writeFileSync(DB_PATH, JSON.stringify(books, null, 2))
    return { success: true }
  })

  // Add a listener to load books too!
  ipcMain.handle('get-books', async () => {
    if (!fs.existsSync(DB_PATH)) return []
    const data = fs.readFileSync(DB_PATH, 'utf-8')
    return JSON.parse(data)
  })

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  
  protocol.handle('atom', async (request) => {
    try {
      // 1. Strip 'atom://' or 'atom:///'
      const url = new URL(request.url);
      let filePath = decodeURIComponent(url.pathname);
      
      // 2. On Windows, URL.pathname often leaves a leading slash before the drive letter (e.g. /C:/)
      // We need to strip that leading slash for fs.readFileSync
      if (process.platform === 'win32' && filePath.startsWith('/')) {
        filePath = filePath.slice(1);
      }

      const data = fs.readFileSync(filePath);
      return new Response(data);
    } catch (error) {
      console.error("Protocol error:", error);
      return new Response("Not Found", { status: 404 });
    }
  });

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.bluefootednewt.eftlog')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindows()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindows()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.handle('delete-book', async (_event, bookId) => {
  if (!fs.existsSync(DB_PATH)) return { success: false }

  const data = fs.readFileSync(DB_PATH, 'utf-8')
  let books: any[] = JSON.parse(data)

  // Filter out the book with the matching ID
  books = books.filter((b) => b.id !== bookId)

  fs.writeFileSync(DB_PATH, JSON.stringify(books, null, 2))
  return { success: true }
})

ipcMain.handle('save-all-books', async (_event, allBooks) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(allBooks, null, 2))
    return { success: true }
  } catch (error) {
    console.error("Failed to save all books", error)
    return { success: false }
  }
})

ipcMain.on('save-config', (_event, config) => {
  try {
    // This ensures the directory exists before trying to write to it
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save config:', error);
  }
});

ipcMain.handle('get-config', async () => {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8')
      return JSON.parse(data)
    }
    // Return empty defaults if file doesn't exist yet
    return { apiKey: '', sortBy: 'Newest' }
  } catch (error) {
    console.error('Failed to read config:', error)
    return { apiKey: '', sortBy: 'Newest' }
  }
})

ipcMain.handle('select-image', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp'] }]
  })

  if (!result.canceled && result.filePaths.length > 0) {
    // We return the path so React can show the preview
    return result.filePaths[0]
  }
  return null
})

ipcMain.handle('select-digital-book', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Digital Books', extensions: ['epub', 'cbz', 'pdf', 'cbr', 'mobi'] }
    ]
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.on('open-file', (_event, filePath) => {
  if (filePath) {
    // shell.openPath is the magic command to use the default system app
    shell.openPath(filePath)
  }
})
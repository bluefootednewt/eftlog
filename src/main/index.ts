import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import path from 'path'

// Path to your database file in the user's local folder
const DB_PATH = path.join(app.getPath('userData'), 'books.json')

function createWindow(): void {
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

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
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
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
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
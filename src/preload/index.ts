import { contextBridge, ipcRenderer } from 'electron' // Add ipcRenderer here
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // These functions send messages to the Main process listeners we created
  saveBook: (book) => ipcRenderer.invoke('save-book', book),
  getBooks: () => ipcRenderer.invoke('get-books'),
  deleteBook: (bookId) => ipcRenderer.invoke('delete-book', bookId),
  saveAllBooks: (allBooks) => ipcRenderer.invoke('save-all-books', allBooks),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.send('save-config', config),
  selectImage: () => ipcRenderer.invoke('select-image'),
  selectDigitalBook: () => ipcRenderer.invoke('select-digital-book'),
  openFile: (path) => ipcRenderer.send('open-file', path)
}

// Keep the rest of your file exactly as it is (the if/else block)
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

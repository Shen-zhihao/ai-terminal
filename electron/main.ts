import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { TerminalManager } from './terminal-manager'
import { ConfigManager } from './config-manager'
import { IPC_CHANNELS } from '../shared/constants'
import type { IPCResponse, TerminalOptions } from '../shared/types'

// 禁用硬件加速（可选）
// app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null = null
let terminalManager: TerminalManager | null = null
let configManager: ConfigManager | null = null

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
  })

  // 加载应用
  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
    terminalManager?.destroyAll()
  })
}

function setupIPC() {
  // 终端操作
  ipcMain.handle(IPC_CHANNELS.TERMINAL_CREATE, async (_, options: TerminalOptions): Promise<IPCResponse> => {
    try {
      if (!terminalManager) throw new Error('Terminal manager not initialized')

      const session = terminalManager.create(options, (sessionId, data) => {
        mainWindow?.webContents.send(IPC_CHANNELS.TERMINAL_DATA, sessionId, data)
      }, (sessionId, exitCode) => {
        mainWindow?.webContents.send(IPC_CHANNELS.TERMINAL_EXIT, sessionId, exitCode)
      })

      return { success: true, data: session }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.TERMINAL_WRITE, async (_, sessionId: string, data: string): Promise<IPCResponse> => {
    try {
      if (!terminalManager) throw new Error('Terminal manager not initialized')
      terminalManager.write(sessionId, data)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.TERMINAL_RESIZE, async (_, sessionId: string, cols: number, rows: number): Promise<IPCResponse> => {
    try {
      if (!terminalManager) throw new Error('Terminal manager not initialized')
      terminalManager.resize(sessionId, cols, rows)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.TERMINAL_DESTROY, async (_, sessionId: string): Promise<IPCResponse> => {
    try {
      if (!terminalManager) throw new Error('Terminal manager not initialized')
      terminalManager.destroy(sessionId)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 配置操作
  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, async (): Promise<IPCResponse> => {
    try {
      if (!configManager) throw new Error('Config manager not initialized')
      const config = await configManager.get()
      return { success: true, data: config }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.CONFIG_SET, async (_, config: any): Promise<IPCResponse> => {
    try {
      if (!configManager) throw new Error('Config manager not initialized')
      await configManager.set(config)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.CONFIG_RESET, async (): Promise<IPCResponse> => {
    try {
      if (!configManager) throw new Error('Config manager not initialized')
      await configManager.reset()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 历史记录操作
  ipcMain.handle(IPC_CHANNELS.HISTORY_GET, async (): Promise<IPCResponse> => {
    try {
      if (!configManager) throw new Error('Config manager not initialized')
      const history = await configManager.getHistory()
      return { success: true, data: history }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.HISTORY_ADD, async (_, entry: any): Promise<IPCResponse> => {
    try {
      if (!configManager) throw new Error('Config manager not initialized')
      await configManager.addHistory(entry)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.HISTORY_CLEAR, async (): Promise<IPCResponse> => {
    try {
      if (!configManager) throw new Error('Config manager not initialized')
      await configManager.clearHistory()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}

// 应用生命周期
app.whenReady().then(async () => {
  try {
    // 初始化管理器
    terminalManager = new TerminalManager()
    configManager = new ConfigManager()

    // 设置 IPC
    setupIPC()

    // 创建窗口
    await createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  } catch (error) {
    console.error('Failed to initialize app:', error)
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  terminalManager?.destroyAll()
})

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
})

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error)
})

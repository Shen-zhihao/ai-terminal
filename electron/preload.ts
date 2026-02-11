import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/constants'
import type { TerminalOptions, IPCResponse, CommandHistory } from '../shared/types'

// 暴露 Electron API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 终端操作
  terminal: {
    create: (options?: TerminalOptions): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.TERMINAL_CREATE, options),

    write: (sessionId: string, data: string): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.TERMINAL_WRITE, sessionId, data),

    resize: (sessionId: string, cols: number, rows: number): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.TERMINAL_RESIZE, sessionId, cols, rows),

    destroy: (sessionId: string): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.TERMINAL_DESTROY, sessionId),

    onData: (callback: (sessionId: string, data: string) => void) => {
      const handler = (_: any, sessionId: string, data: string) => callback(sessionId, data)
      ipcRenderer.on(IPC_CHANNELS.TERMINAL_DATA, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.TERMINAL_DATA, handler)
    },

    onExit: (callback: (sessionId: string, exitCode: number) => void) => {
      const handler = (_: any, sessionId: string, exitCode: number) => callback(sessionId, exitCode)
      ipcRenderer.on(IPC_CHANNELS.TERMINAL_EXIT, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.TERMINAL_EXIT, handler)
    },
  },

  // 配置操作
  config: {
    get: (): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET),

    set: (config: any): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SET, config),

    reset: (): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.CONFIG_RESET),
  },

  // 历史记录
  history: {
    get: (): Promise<IPCResponse<CommandHistory[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.HISTORY_GET),

    add: (entry: CommandHistory): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.HISTORY_ADD, entry),

    clear: (): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.HISTORY_CLEAR),
  },

  // 平台信息
  platform: process.platform,

  // 环境变量
  env: {
    HOME: process.env.HOME,
    SHELL: process.env.SHELL,
  },
})

// 类型声明（用于 TypeScript）
declare global {
  interface Window {
    electronAPI: {
      terminal: {
        create: (options?: TerminalOptions) => Promise<IPCResponse>
        write: (sessionId: string, data: string) => Promise<IPCResponse>
        resize: (sessionId: string, cols: number, rows: number) => Promise<IPCResponse>
        destroy: (sessionId: string) => Promise<IPCResponse>
        onData: (callback: (sessionId: string, data: string) => void) => () => void
        onExit: (callback: (sessionId: string, exitCode: number) => void) => () => void
      }
      config: {
        get: () => Promise<IPCResponse>
        set: (config: any) => Promise<IPCResponse>
        reset: () => Promise<IPCResponse>
      }
      history: {
        get: () => Promise<IPCResponse<CommandHistory[]>>
        add: (entry: CommandHistory) => Promise<IPCResponse>
        clear: () => Promise<IPCResponse>
      }
      platform: string
      env: {
        HOME?: string
        SHELL?: string
      }
    }
  }
}

// LESS 模块声明
declare module '*.less' {
  const content: { [className: string]: string }
  export default content
}

// CSS 模块声明
declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}

// 图片资源
declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.gif'
declare module '*.svg'
declare module '*.webp'

// Electron API
import type { TerminalOptions, IPCResponse, CommandHistory } from '@shared/types'

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
        set: (config: unknown) => Promise<IPCResponse>
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

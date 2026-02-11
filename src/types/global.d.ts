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

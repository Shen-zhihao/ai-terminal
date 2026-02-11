import * as pty from 'node-pty'
import { randomUUID } from 'crypto'
import type { TerminalSession, TerminalOptions } from '../shared/types'

type DataCallback = (sessionId: string, data: string) => void
type ExitCallback = (sessionId: string, exitCode: number) => void

interface ManagedSession extends TerminalSession {
  pty: pty.IPty
}

export class TerminalManager {
  private sessions: Map<string, ManagedSession> = new Map()

  create(
    options: TerminalOptions = {},
    onData: DataCallback,
    onExit: ExitCallback
  ): TerminalSession {
    const sessionId = randomUUID()

    // 确定 shell
    const shell = options.shell || process.env.SHELL || (process.platform === 'win32' ? 'powershell.exe' : '/bin/bash')

    // 确定工作目录
    const cwd = options.cwd || process.env.HOME || process.cwd()

    // 创建伪终端
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: options.cols || 80,
      rows: options.rows || 24,
      cwd,
      env: {
        ...process.env,
        ...options.env,
      } as any,
    })

    // 监听数据输出
    ptyProcess.onData((data: string) => {
      onData(sessionId, data)
    })

    // 监听进程退出
    ptyProcess.onExit(({ exitCode }) => {
      onExit(sessionId, exitCode)
      this.sessions.delete(sessionId)
    })

    const session: ManagedSession = {
      id: sessionId,
      pid: ptyProcess.pid,
      createdAt: new Date(),
      cwd,
      shell,
      pty: ptyProcess,
    }

    this.sessions.set(sessionId, session)

    return {
      id: session.id,
      pid: session.pid,
      createdAt: session.createdAt,
      cwd: session.cwd,
      shell: session.shell,
    }
  }

  write(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Terminal session not found: ${sessionId}`)
    }
    session.pty.write(data)
  }

  resize(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Terminal session not found: ${sessionId}`)
    }
    session.pty.resize(cols, rows)
  }

  destroy(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Terminal session not found: ${sessionId}`)
    }
    session.pty.kill()
    this.sessions.delete(sessionId)
  }

  destroyAll(): void {
    for (const [sessionId, session] of this.sessions) {
      try {
        session.pty.kill()
      } catch (error) {
        console.error(`Error destroying session ${sessionId}:`, error)
      }
    }
    this.sessions.clear()
  }

  get(sessionId: string): TerminalSession | undefined {
    const session = this.sessions.get(sessionId)
    if (!session) return undefined

    return {
      id: session.id,
      pid: session.pid,
      createdAt: session.createdAt,
      cwd: session.cwd,
      shell: session.shell,
    }
  }

  getAll(): TerminalSession[] {
    return Array.from(this.sessions.values()).map((session) => ({
      id: session.id,
      pid: session.pid,
      createdAt: session.createdAt,
      cwd: session.cwd,
      shell: session.shell,
    }))
  }
}

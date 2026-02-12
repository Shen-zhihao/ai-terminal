import * as pty from 'node-pty'
import { randomUUID } from 'crypto'
import * as fs from 'fs'
import type { TerminalSession, TerminalOptions } from '../shared/types'

type DataCallback = (sessionId: string, data: string) => void
type ExitCallback = (sessionId: string, exitCode: number) => void

interface ManagedSession extends TerminalSession {
  pty: pty.IPty
}

export class TerminalManager {
  private sessions: Map<string, ManagedSession> = new Map()

  private getShell(): string {
    if (process.platform === 'win32') {
      return process.env.COMSPEC || 'powershell.exe'
    }

    // List of shells to try in order
    const shells = [
      process.env.SHELL,
      '/bin/zsh',
      '/usr/bin/zsh',
      '/bin/bash',
      '/usr/bin/bash',
      '/bin/sh'
    ]

    for (const shell of shells) {
      if (shell && fs.existsSync(shell)) {
        return shell
      }
    }

    // Fallback
    return '/bin/sh'
  }

  create(
    options: TerminalOptions = {},
    onData: DataCallback,
    onExit: ExitCallback
  ): TerminalSession {
    const sessionId = randomUUID()

    // 确定 shell
    const shell = options.shell || this.getShell()

    // 确定工作目录
    let cwd = options.cwd || process.env.HOME || process.cwd()
    
    // 验证 cwd 是否存在
    if (!fs.existsSync(cwd)) {
      console.warn(`Working directory ${cwd} does not exist, falling back to HOME or /tmp`)
      cwd = process.env.HOME && fs.existsSync(process.env.HOME) 
        ? process.env.HOME 
        : (process.platform === 'win32' ? 'C:\\' : '/tmp')
    }

    try {
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
        type: 'local' as const,
        pid: session.pid,
        createdAt: session.createdAt,
        cwd: session.cwd,
        shell: session.shell,
      }
    } catch (error: any) {
      throw new Error(`Failed to spawn terminal (shell: ${shell}, cwd: ${cwd}): ${error.message}`)
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
      type: 'local' as const,
      pid: session.pid,
      createdAt: session.createdAt,
      cwd: session.cwd,
      shell: session.shell,
    }
  }

  getAll(): TerminalSession[] {
    return Array.from(this.sessions.values()).map((session) => ({
      id: session.id,
      type: 'local' as const,
      pid: session.pid,
      createdAt: session.createdAt,
      cwd: session.cwd,
      shell: session.shell,
    }))
  }
}

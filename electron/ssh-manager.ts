import { Client, type ClientChannel } from 'ssh2'
import { randomUUID } from 'crypto'
import * as fs from 'fs'
import type { SSHConnectOptions, SSHSession, SSHConnectionStatus } from '../shared/types'

type DataCallback = (sessionId: string, data: string) => void
type StatusCallback = (sessionId: string, status: SSHConnectionStatus, error?: string) => void
type ExitCallback = (sessionId: string) => void

interface ManagedSSHSession {
  id: string
  client: Client
  stream: ClientChannel | null
  host: string
  port: number
  username: string
  hostId?: string
  status: SSHConnectionStatus
  connectedAt?: Date
  cols: number
  rows: number
}

export class SSHManager {
  private sessions: Map<string, ManagedSSHSession> = new Map()

  async connect(
    options: SSHConnectOptions,
    onData: DataCallback,
    onStatus: StatusCallback,
    onExit: ExitCallback
  ): Promise<SSHSession> {
    const sessionId = randomUUID()
    const client = new Client()

    const managedSession: ManagedSSHSession = {
      id: sessionId,
      client,
      stream: null,
      host: options.host,
      port: options.port,
      username: options.username,
      hostId: options.hostId,
      status: 'connecting',
      cols: options.cols || 80,
      rows: options.rows || 24,
    }

    this.sessions.set(sessionId, managedSession)
    onStatus(sessionId, 'connecting')

    return new Promise((resolve, reject) => {
      const connectConfig: any = {
        host: options.host,
        port: options.port,
        username: options.username,
        readyTimeout: 10000,
        keepaliveInterval: 30000,
        keepaliveCountMax: 3,
      }

      if (options.authMethod === 'password') {
        connectConfig.password = options.password
      } else if (options.authMethod === 'privateKey') {
        try {
          connectConfig.privateKey = fs.readFileSync(options.privateKeyPath!)
          if (options.passphrase) {
            connectConfig.passphrase = options.passphrase
          }
        } catch (err: any) {
          this.sessions.delete(sessionId)
          reject(new Error(`无法读取私钥文件: ${err.message}`))
          return
        }
      }

      client.on('ready', () => {
        client.shell(
          {
            term: 'xterm-256color',
            cols: managedSession.cols,
            rows: managedSession.rows,
          },
          (err, stream) => {
            if (err) {
              managedSession.status = 'error'
              onStatus(sessionId, 'error', err.message)
              client.end()
              this.sessions.delete(sessionId)
              reject(new Error(`无法打开 Shell: ${err.message}`))
              return
            }

            managedSession.stream = stream
            managedSession.status = 'connected'
            managedSession.connectedAt = new Date()
            onStatus(sessionId, 'connected')

            stream.on('data', (data: Buffer) => {
              onData(sessionId, data.toString('utf-8'))
            })

            stream.stderr.on('data', (data: Buffer) => {
              onData(sessionId, data.toString('utf-8'))
            })

            stream.on('close', () => {
              managedSession.status = 'disconnected'
              onStatus(sessionId, 'disconnected')
              onExit(sessionId)
              client.end()
              this.sessions.delete(sessionId)
            })

            resolve({
              id: sessionId,
              hostId: options.hostId,
              host: options.host,
              port: options.port,
              username: options.username,
              status: 'connected',
              connectedAt: managedSession.connectedAt,
            })
          }
        )
      })

      client.on('error', (err) => {
        managedSession.status = 'error'
        onStatus(sessionId, 'error', err.message)
        this.sessions.delete(sessionId)
        reject(new Error(`SSH 连接失败: ${err.message}`))
      })

      client.on('close', () => {
        if (this.sessions.has(sessionId) && managedSession.status === 'connected') {
          managedSession.status = 'disconnected'
          onStatus(sessionId, 'disconnected')
          onExit(sessionId)
          this.sessions.delete(sessionId)
        }
      })

      client.on('end', () => {
        if (this.sessions.has(sessionId)) {
          managedSession.status = 'disconnected'
          onStatus(sessionId, 'disconnected')
          onExit(sessionId)
          this.sessions.delete(sessionId)
        }
      })

      client.connect(connectConfig)
    })
  }

  write(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId)
    if (!session || !session.stream) {
      throw new Error(`SSH 会话未找到或未连接: ${sessionId}`)
    }
    session.stream.write(data)
  }

  resize(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId)
    if (!session || !session.stream) {
      throw new Error(`SSH 会话未找到或未连接: ${sessionId}`)
    }
    session.cols = cols
    session.rows = rows
    session.stream.setWindow(rows, cols, 0, 0)
  }

  disconnect(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return
    if (session.stream) {
      session.stream.close()
    }
    session.client.end()
    this.sessions.delete(sessionId)
  }

  disconnectAll(): void {
    for (const [sessionId, session] of this.sessions) {
      try {
        if (session.stream) session.stream.close()
        session.client.end()
      } catch (error) {
        console.error(`断开 SSH 会话 ${sessionId} 失败:`, error)
      }
    }
    this.sessions.clear()
  }

  has(sessionId: string): boolean {
    return this.sessions.has(sessionId)
  }
}

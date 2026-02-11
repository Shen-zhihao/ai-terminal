import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import { useTerminalStore } from '../../stores/terminal-store'
import { useSettingsStore } from '../../stores/settings-store'

export default function TerminalView() {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const sessionIdRef = useRef<string | null>(null)

  const [isReady, setIsReady] = useState(false)
  const addSession = useTerminalStore((state) => state.addSession)
  const fontSize = useSettingsStore((state) => state.fontSize)

  useEffect(() => {
    if (!terminalRef.current) return

    // 创建 xterm 实例
    const xterm = new Terminal({
      cursorBlink: true,
      fontSize,
      fontFamily: 'Monaco, Menlo, "Courier New", monospace',
      theme: {
        background: '#000000',
        foreground: '#ffffff',
        cursor: '#ffffff',
        black: '#000000',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#bd93f9',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#bbbbbb',
        brightBlack: '#555555',
        brightRed: '#ff6e67',
        brightGreen: '#5af78e',
        brightYellow: '#f4f99d',
        brightBlue: '#caa9fa',
        brightMagenta: '#ff92d0',
        brightCyan: '#9aedfe',
        brightWhite: '#ffffff',
      },
      allowTransparency: false,
      scrollback: 10000,
    })

    // 添加插件
    const fitAddon = new FitAddon()
    xterm.loadAddon(fitAddon)
    xterm.loadAddon(new WebLinksAddon())

    // 挂载到 DOM
    xterm.open(terminalRef.current)
    fitAddon.fit()

    // 保存引用
    xtermRef.current = xterm
    fitAddonRef.current = fitAddon

    // 创建终端会话
    const createSession = async () => {
      try {
        const response = await window.electronAPI.terminal.create({
          cols: xterm.cols,
          rows: xterm.rows,
        })

        if (response.success && response.data) {
          sessionIdRef.current = response.data.id
          addSession(response.data)
          setIsReady(true)
        } else {
          xterm.writeln(`\x1b[31mError: ${response.error}\x1b[0m`)
        }
      } catch (error: any) {
        xterm.writeln(`\x1b[31mFailed to create terminal: ${error.message}\x1b[0m`)
      }
    }

    createSession()

    // 监听终端输入
    const disposable = xterm.onData((data) => {
      if (sessionIdRef.current) {
        window.electronAPI.terminal.write(sessionIdRef.current, data)
      }
    })

    // 监听终端输出
    const unsubscribeData = window.electronAPI.terminal.onData((sessionId, data) => {
      if (sessionId === sessionIdRef.current) {
        xterm.write(data)
      }
    })

    // 监听终端退出
    const unsubscribeExit = window.electronAPI.terminal.onExit((sessionId, exitCode) => {
      if (sessionId === sessionIdRef.current) {
        xterm.writeln(`\n\x1b[33mProcess exited with code ${exitCode}\x1b[0m`)
      }
    })

    // 监听窗口大小变化
    const handleResize = () => {
      if (fitAddon && sessionIdRef.current) {
        fitAddon.fit()
        window.electronAPI.terminal.resize(
          sessionIdRef.current,
          xterm.cols,
          xterm.rows
        )
      }
    }

    window.addEventListener('resize', handleResize)

    // 清理
    return () => {
      disposable.dispose()
      unsubscribeData()
      unsubscribeExit()
      window.removeEventListener('resize', handleResize)

      if (sessionIdRef.current) {
        window.electronAPI.terminal.destroy(sessionIdRef.current)
      }

      xterm.dispose()
    }
  }, [addSession, fontSize])

  // 响应字体大小变化
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.fontSize = fontSize
      fitAddonRef.current?.fit()
    }
  }, [fontSize])

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="flex-1 relative">
        <div ref={terminalRef} className="absolute inset-0" />
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-gray-400 animate-pulse">
              Initializing terminal...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

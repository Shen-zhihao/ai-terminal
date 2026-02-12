import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import type { TerminalSession, SSHConnectionStatus } from "@shared/types";
import { useSettingsStore } from "../../stores/settings-store";
import { useTerminalStore } from "../../stores/terminal-store";

interface TerminalViewProps {
  session: TerminalSession;
  isActive: boolean;
}

export default function TerminalView({ session, isActive }: TerminalViewProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const fontSize = useSettingsStore((state) => state.fontSize);
  const isSSH = session.type === "ssh";

  useEffect(() => {
    if (!terminalRef.current) return;

    const xterm = new Terminal({
      cursorBlink: true,
      fontSize,
      fontFamily: 'Monaco, Menlo, "Courier New", monospace',
      theme: {
        background: "#000000", // 恢复纯黑背景，保持原有布局感
        foreground: "#cccccc", // 结果颜色：淡灰色，与高亮命令（青色）区分
        cursor: "#ffffff",
        black: "#000000",
        red: "#ff5555",
        green: "#50fa7b",
        yellow: "#f1fa8c",
        blue: "#bd93f9",
        magenta: "#ff79c6",
        cyan: "#8be9fd",
        white: "#bbbbbb",
        brightBlack: "#555555",
        brightRed: "#ff6e67",
        brightGreen: "#5af78e",
        brightYellow: "#f4f99d",
        brightBlue: "#caa9fa",
        brightMagenta: "#ff92d0",
        brightCyan: "#9aedfe",
        brightWhite: "#ffffff",
      },
      allowTransparency: false,
      scrollback: 10000,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(new WebLinksAddon());
    xterm.open(terminalRef.current);

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // 根据会话类型选择 API
    const api = isSSH ? window.electronAPI.ssh : window.electronAPI.terminal;

    const disposable = xterm.onData((data) => {
      api.write(session.id, data);
    });

    const unsubscribeData = api.onData((sessionId, data) => {
      if (sessionId === session.id) {
        xterm.write(data);
      }
    });

    let unsubscribeExit: (() => void) | undefined;
    let unsubscribeStatus: (() => void) | undefined;

    if (isSSH) {
      unsubscribeExit = window.electronAPI.ssh.onExit((sessionId) => {
        if (sessionId === session.id) {
          xterm.writeln("\n\x1b[33mSSH 连接已关闭\x1b[0m");
        }
      });

      unsubscribeStatus = window.electronAPI.ssh.onStatus(
        (sessionId, status, error) => {
          if (sessionId === session.id) {
            useTerminalStore.getState().updateSession(sessionId, {
              sshInfo: {
                ...session.sshInfo!,
                status: status as SSHConnectionStatus,
              },
            });
            if (status === "error" && error) {
              xterm.writeln(`\n\x1b[31mSSH 错误: ${error}\x1b[0m`);
            }
          }
        },
      );
    } else {
      unsubscribeExit = window.electronAPI.terminal.onExit(
        (sessionId, exitCode) => {
          if (sessionId === session.id) {
            xterm.writeln(`\n\x1b[33m进程已退出，退出码：${exitCode}\x1b[0m`);
          }
        },
      );
    }

    const handleResize = () => {
      if (fitAddonRef.current) {
        try {
          fitAddonRef.current.fit();
          if (xtermRef.current) {
            api.resize(
              session.id,
              xtermRef.current.cols,
              xtermRef.current.rows,
            );
          }
        } catch (e) {
          console.warn("Resize failed:", e);
        }
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      disposable.dispose();
      unsubscribeData();
      unsubscribeExit?.();
      unsubscribeStatus?.();
      window.removeEventListener("resize", handleResize);
      xterm.dispose();
    };
  }, [session.id, isSSH]);

  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.fontSize = fontSize;
      if (isActive) {
        fitAddonRef.current?.fit();
      }
    }
  }, [fontSize, isActive]);

  useEffect(() => {
    if (isActive && fitAddonRef.current && xtermRef.current) {
      const api = isSSH ? window.electronAPI.ssh : window.electronAPI.terminal;
      const timer = setTimeout(() => {
        try {
          fitAddonRef.current?.fit();
          api.resize(
            session.id,
            xtermRef.current!.cols,
            xtermRef.current!.rows,
          );
          xtermRef.current?.focus();
        } catch (e) {
          console.warn("Fit failed", e);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isActive, session.id, isSSH]);

  return (
    <div className="terminal-container">
      <div className="terminal-wrapper">
        <div ref={terminalRef} className="terminal-mount" />
      </div>
    </div>
  );
}

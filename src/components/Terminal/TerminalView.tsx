import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import type { TerminalSession } from "@shared/types";
import { useSettingsStore } from "../../stores/settings-store";

interface TerminalViewProps {
  session: TerminalSession;
  isActive: boolean;
}

export default function TerminalView({ session, isActive }: TerminalViewProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const fontSize = useSettingsStore((state) => state.fontSize);

  useEffect(() => {
    if (!terminalRef.current) return;

    const xterm = new Terminal({
      cursorBlink: true,
      fontSize,
      fontFamily: 'Monaco, Menlo, "Courier New", monospace',
      theme: {
        background: "#000000",
        foreground: "#ffffff",
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

    const disposable = xterm.onData((data) => {
      window.electronAPI.terminal.write(session.id, data);
    });

    const unsubscribeData = window.electronAPI.terminal.onData(
      (sessionId, data) => {
        if (sessionId === session.id) {
          xterm.write(data);
        }
      },
    );

    const unsubscribeExit = window.electronAPI.terminal.onExit(
      (sessionId, exitCode) => {
        if (sessionId === session.id) {
          xterm.writeln(`\n\x1b[33m进程已退出，退出码：${exitCode}\x1b[0m`);
        }
      },
    );

    const handleResize = () => {
      if (fitAddonRef.current) {
        try {
          fitAddonRef.current.fit();
          if (xtermRef.current) {
            window.electronAPI.terminal.resize(
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
      unsubscribeExit();
      window.removeEventListener("resize", handleResize);
      xterm.dispose();
    };
  }, [session.id]);

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
      const timer = setTimeout(() => {
        try {
          fitAddonRef.current?.fit();
          window.electronAPI.terminal.resize(
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
  }, [isActive, session.id]);

  return (
    <div className="terminal-container">
      <div className="terminal-wrapper">
        <div ref={terminalRef} className="terminal-mount" />
      </div>
    </div>
  );
}

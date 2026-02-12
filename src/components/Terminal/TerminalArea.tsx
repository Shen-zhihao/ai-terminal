import { useCallback, useEffect, useRef } from "react";
import { useTerminalStore } from "@/stores/terminal-store";
import { useSSHStore } from "@/stores/ssh-store";
import TerminalTabs from "./TerminalTabs";
import TerminalView from "./TerminalView";
import SSHModal from "../SSH/SSHModal";
import type { SSHConnectOptions, TerminalSession } from "@shared/types";
import "./TerminalArea.less";

export default function TerminalArea() {
  const {
    sessions,
    activeSessionId,
    addSession,
    removeSession,
    setActiveSession,
  } = useTerminalStore();

  const { isSSHModalOpen, setSSHModalOpen } = useSSHStore();
  const isCreatingRef = useRef(false);

  const createSession = useCallback(async () => {
    if (isCreatingRef.current) return;
    isCreatingRef.current = true;
    try {
      const response = await window.electronAPI.terminal.create({
        cols: 80,
        rows: 24,
      });

      if (response.success && response.data) {
        addSession(response.data);
        setActiveSession(response.data.id);
      }
    } catch (error) {
      console.error("创建终端失败:", error);
    } finally {
      isCreatingRef.current = false;
    }
  }, [addSession, setActiveSession]);

  const createSSHSession = useCallback(
    async (options: SSHConnectOptions) => {
      const response = await window.electronAPI.ssh.connect(options);
      if (response.success && response.data) {
        const sshSession: TerminalSession = {
          id: response.data.id,
          type: "ssh",
          pid: 0,
          createdAt: new Date(),
          cwd: `${options.username}@${options.host}:${options.port}`,
          shell: "ssh",
          sshInfo: {
            host: options.host,
            port: options.port,
            username: options.username,
            status: "connected",
            hostId: options.hostId,
          },
        };
        addSession(sshSession);
        setActiveSession(sshSession.id);
      } else {
        throw new Error(response.error || "SSH 连接失败");
      }
    },
    [addSession, setActiveSession]
  );

  const openNewWindow = useCallback(async () => {
    await window.electronAPI.shell.openNewWindow();
  }, []);

  const handleCloseSession = useCallback(
    async (sessionId: string) => {
      const session = sessions.find((s) => s.id === sessionId);
      if (session?.type === "ssh") {
        await window.electronAPI.ssh.disconnect(sessionId);
      } else {
        await window.electronAPI.terminal.destroy(sessionId);
      }
      removeSession(sessionId);
    },
    [sessions, removeSession]
  );

  useEffect(() => {
    if (sessions.length === 0) {
      createSession();
    }
  }, [sessions.length, createSession]);

  useEffect(() => {
    const cleanupNewTab = window.electronAPI.shell.onNewTab(() => {
      createSession();
    });
    const cleanupSplitVertical = window.electronAPI.shell.onSplitVertical(
      () => {
        alert("垂直分屏功能开发中...");
      }
    );
    const cleanupSplitHorizontal = window.electronAPI.shell.onSplitHorizontal(
      () => {
        alert("水平分屏功能开发中...");
      }
    );

    // 监听菜单中的 SSH 打开事件
    const cleanupSSHModal = window.electronAPI.ssh.onOpenModal(() => {
      setSSHModalOpen(true);
    });

    return () => {
      cleanupNewTab();
      cleanupSplitVertical();
      cleanupSplitHorizontal();
      cleanupSSHModal();
    };
  }, [createSession, setSSHModalOpen]);

  return (
    <div className="terminal-area-container">
      <TerminalTabs
        sessions={sessions}
        activeId={activeSessionId}
        onSelect={setActiveSession}
        onClose={handleCloseSession}
        onAdd={openNewWindow}
      />
      <div className="terminal-content">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`terminal-instance ${
              session.id === activeSessionId ? "active" : ""
            }`}
          >
            <TerminalView
              session={session}
              isActive={session.id === activeSessionId}
            />
          </div>
        ))}
      </div>

      {isSSHModalOpen && (
        <SSHModal
          onClose={() => setSSHModalOpen(false)}
          onConnect={createSSHSession}
        />
      )}
    </div>
  );
}

import { useCallback, useEffect, useRef } from "react";
import { useTerminalStore } from "../../stores/terminal-store";
import TerminalTabs from "./TerminalTabs";
import TerminalView from "./TerminalView";
import "./TerminalArea.less";

export default function TerminalArea() {
  const {
    sessions,
    activeSessionId,
    addSession,
    removeSession,
    setActiveSession,
  } = useTerminalStore();

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

  const openNewWindow = useCallback(async () => {
    await window.electronAPI.shell.openNewWindow();
  }, []);

  const handleCloseSession = useCallback(
    async (sessionId: string) => {
      await window.electronAPI.terminal.destroy(sessionId);
      removeSession(sessionId);
    },
    [removeSession],
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
      },
    );
    const cleanupSplitHorizontal = window.electronAPI.shell.onSplitHorizontal(
      () => {
        alert("水平分屏功能开发中...");
      },
    );

    return () => {
      cleanupNewTab();
      cleanupSplitVertical();
      cleanupSplitHorizontal();
    };
  }, [createSession]);

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
    </div>
  );
}

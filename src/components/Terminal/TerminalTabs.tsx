import type { TerminalSession } from "@shared/types";
import "./TerminalTabs.less";

interface TerminalTabsProps {
  sessions: TerminalSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onAdd: () => void;
}

export default function TerminalTabs({
  sessions,
  activeId,
  onSelect,
  onClose,
  onAdd,
}: TerminalTabsProps) {
  return (
    <div className="terminal-tabs">
      <div className="tab-list">
        {sessions.map((session, index) => (
          <div
            key={session.id}
            className={`tab-item ${session.id === activeId ? "active" : ""}`}
            onClick={() => onSelect(session.id)}
          >
            <span className="tab-title">
              {session.type === "ssh" ? (
                <>
                  <span
                    className={`ssh-status-dot ${session.sshInfo?.status || "disconnected"}`}
                  />
                  {session.sshInfo?.username}@{session.sshInfo?.host}
                </>
              ) : (
                `终端 ${index + 1}`
              )}
            </span>
            <span
              className="tab-close"
              onClick={(event) => {
                event.stopPropagation();
                onClose(session.id);
              }}
            >
              ✕
            </span>
          </div>
        ))}
      </div>
      <div className="tab-add-btn" onClick={onAdd}>
        +
      </div>
    </div>
  );
}

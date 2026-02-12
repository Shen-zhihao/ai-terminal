import { useState, useEffect, useRef } from "react";
import type { CommandSuggestion as CommandSuggestionType } from "@shared/types";
import { useTerminalStore } from "../../stores/terminal-store";

const RISK_LABELS: Record<string, string> = {
  safe: "安全",
  warning: "警告",
  dangerous: "危险",
};

interface CommandSuggestionProps {
  suggestion: CommandSuggestionType;
}

export default function CommandSuggestion({
  suggestion,
}: CommandSuggestionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCommand, setEditedCommand] = useState(suggestion.command);
  const activeSessionId = useTerminalStore((state) => state.activeSessionId);
  const sessions = useTerminalStore((state) => state.sessions);
  const hasAutoExecuted = useRef(false);

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "dangerous":
        return "⚠️";
      case "warning":
        return "⚡";
      default:
        return "✓";
    }
  };

  const executeCommand = async (cmd: string) => {
    if (!activeSessionId) return;

    const session = sessions.find((s) => s.id === activeSessionId);
    if (!session) return;

    if (session.type === "ssh") {
      await window.electronAPI.ssh.write(activeSessionId, cmd + "\n");
    } else {
      await window.electronAPI.terminal.write(activeSessionId, cmd + "\n");
    }
  };

  const handleExecute = async () => {
    if (!activeSessionId) return;

    const confirmed =
      suggestion.riskLevel === "dangerous"
        ? window.confirm(
            `此命令可能存在危险：\n\n${editedCommand}\n\n确定要执行吗？`,
          )
        : true;

    if (confirmed) {
      await executeCommand(editedCommand);
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (
      !hasAutoExecuted.current &&
      activeSessionId &&
      suggestion.riskLevel !== "dangerous"
    ) {
      hasAutoExecuted.current = true;
      executeCommand(suggestion.command);
    }
  }, [activeSessionId]);

  const isTerminalReady = !!activeSessionId;

  return (
    <div className={`cmd-suggestion cmd-suggestion-${suggestion.riskLevel}`}>
      <div className="cmd-suggestion-header">
        <span className="cmd-suggestion-risk">
          {getRiskIcon(suggestion.riskLevel)}{" "}
          {RISK_LABELS[suggestion.riskLevel] || suggestion.riskLevel}
        </span>
        {suggestion.tags && suggestion.tags.length > 0 && (
          <div className="cmd-suggestion-tags">
            {suggestion.tags.map((tag, i) => (
              <span key={i} className="cmd-suggestion-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="cmd-suggestion-command">
        {isEditing ? (
          <input
            type="text"
            value={editedCommand}
            onChange={(e) => setEditedCommand(e.target.value)}
            className="cmd-suggestion-edit-input"
            autoFocus
          />
        ) : (
          <code className="cmd-suggestion-code">{editedCommand}</code>
        )}
      </div>

      <p className="cmd-suggestion-explanation">{suggestion.explanation}</p>

      <div className="cmd-suggestion-actions">
        <button
          onClick={handleExecute}
          className="cmd-suggestion-btn"
          disabled={!isTerminalReady}
          title={!isTerminalReady ? "终端正在初始化..." : "执行命令"}
        >
          {!isTerminalReady ? "⏳ 初始化中..." : "▶ 执行"}
        </button>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="cmd-suggestion-btn"
        >
          ✏️ {isEditing ? "完成" : "编辑"}
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(editedCommand)}
          className="cmd-suggestion-btn"
        >
          📋 复制
        </button>
      </div>
    </div>
  );
}

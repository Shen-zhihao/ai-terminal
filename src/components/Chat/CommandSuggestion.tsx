import { useState } from 'react'
import type { CommandSuggestion as CommandSuggestionType } from '@shared/types'
import { useTerminalStore } from '../../stores/terminal-store'

interface CommandSuggestionProps {
  suggestion: CommandSuggestionType
}

export default function CommandSuggestion({ suggestion }: CommandSuggestionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedCommand, setEditedCommand] = useState(suggestion.command)
  const activeSessionId = useTerminalStore((state) => state.activeSessionId)

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'dangerous': return '⚠️'
      case 'warning': return '⚡'
      default: return '✓'
    }
  }

  const handleExecute = async () => {
    if (!activeSessionId) {
      alert('No active terminal session')
      return
    }

    const confirmed = suggestion.riskLevel === 'dangerous'
      ? window.confirm(`This command is potentially dangerous:\n\n${editedCommand}\n\nAre you sure you want to execute it?`)
      : true

    if (confirmed) {
      await window.electronAPI.terminal.write(activeSessionId, editedCommand + '\n')
      setIsEditing(false)
    }
  }

  return (
    <div className={`cmd-suggestion cmd-suggestion-${suggestion.riskLevel}`}>
      <div className="cmd-suggestion-header">
        <span className="cmd-suggestion-risk">
          {getRiskIcon(suggestion.riskLevel)} {suggestion.riskLevel}
        </span>
        {suggestion.tags && suggestion.tags.length > 0 && (
          <div className="cmd-suggestion-tags">
            {suggestion.tags.map((tag, i) => (
              <span key={i} className="cmd-suggestion-tag">{tag}</span>
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
        <button onClick={handleExecute} className="cmd-suggestion-btn">
          ▶ Execute
        </button>
        <button onClick={() => setIsEditing(!isEditing)} className="cmd-suggestion-btn">
          ✏️ {isEditing ? 'Done' : 'Edit'}
        </button>
        <button onClick={() => navigator.clipboard.writeText(editedCommand)} className="cmd-suggestion-btn">
          📋 Copy
        </button>
      </div>
    </div>
  )
}

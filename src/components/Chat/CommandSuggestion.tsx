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

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'dangerous':
        return 'bg-red-900 border-red-700 text-red-200'
      case 'warning':
        return 'bg-yellow-900 border-yellow-700 text-yellow-200'
      default:
        return 'bg-green-900 border-green-700 text-green-200'
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'dangerous':
        return '⚠️'
      case 'warning':
        return '⚡'
      default:
        return '✓'
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
    <div className={`border rounded-lg p-4 ${getRiskColor(suggestion.riskLevel)}`}>
      {/* 风险标签 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase">
          {getRiskIcon(suggestion.riskLevel)} {suggestion.riskLevel}
        </span>
        {suggestion.tags && suggestion.tags.length > 0 && (
          <div className="flex space-x-1">
            {suggestion.tags.map((tag, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-black bg-opacity-20 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 命令 */}
      <div className="mb-2">
        {isEditing ? (
          <input
            type="text"
            value={editedCommand}
            onChange={(e) => setEditedCommand(e.target.value)}
            className="w-full px-3 py-2 bg-black bg-opacity-30 rounded font-mono text-sm"
            autoFocus
          />
        ) : (
          <code className="block px-3 py-2 bg-black bg-opacity-30 rounded font-mono text-sm break-all">
            {editedCommand}
          </code>
        )}
      </div>

      {/* 解释 */}
      <p className="text-sm mb-3 opacity-90">{suggestion.explanation}</p>

      {/* 操作按钮 */}
      <div className="flex space-x-2">
        <button
          onClick={handleExecute}
          className="px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm transition-colors"
        >
          ▶ Execute
        </button>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm transition-colors"
        >
          ✏️ {isEditing ? 'Done' : 'Edit'}
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(editedCommand)}
          className="px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm transition-colors"
        >
          📋 Copy
        </button>
      </div>
    </div>
  )
}

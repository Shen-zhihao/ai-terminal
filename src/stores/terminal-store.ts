import { create } from 'zustand'
import type { TerminalSession } from '@shared/types'

interface TerminalState {
  sessions: TerminalSession[]
  activeSessionId: string | null
  inputHistory: string[]
  historyIndex: number

  // 操作
  addSession: (session: TerminalSession) => void
  removeSession: (sessionId: string) => void
  setActiveSession: (sessionId: string) => void
  addToInputHistory: (command: string) => void
  clearInputHistory: () => void
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  inputHistory: [],
  historyIndex: -1,

  addSession: (session) => {
    set((state) => ({
      sessions: [...state.sessions, session],
      activeSessionId: state.activeSessionId || session.id,
    }))
  },

  removeSession: (sessionId) => {
    set((state) => {
      const newSessions = state.sessions.filter((s) => s.id !== sessionId)
      const newActiveId =
        state.activeSessionId === sessionId
          ? newSessions[0]?.id || null
          : state.activeSessionId

      return {
        sessions: newSessions,
        activeSessionId: newActiveId,
      }
    })
  },

  setActiveSession: (sessionId) => {
    set({ activeSessionId: sessionId })
  },

  addToInputHistory: (command) => {
    set((state) => ({
      inputHistory: [...state.inputHistory, command].slice(-1000), // 保留最近 1000 条
      historyIndex: -1,
    }))
  },

  clearInputHistory: () => {
    set({ inputHistory: [], historyIndex: -1 })
  },
}))

import { create } from 'zustand'
import type { Message, CommandSuggestion } from '@shared/types'

interface ChatMessage extends Message {
  id: string
  timestamp: Date
  suggestion?: CommandSuggestion
}

interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null

  // 操作
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  error: null,

  addMessage: (message) => {
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: Math.random().toString(36).substring(7),
          timestamp: new Date(),
        },
      ],
    }))
  },

  setLoading: (loading) => {
    set({ isLoading: loading })
  },

  setError: (error) => {
    set({ error })
  },

  clearMessages: () => {
    set({ messages: [], error: null })
  },
}))

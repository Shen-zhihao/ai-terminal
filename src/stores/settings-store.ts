import { create } from 'zustand'
import type { AppConfig, AIProvider } from '@shared/types'

interface SettingsState {
  aiProvider: AIProvider
  theme: 'light' | 'dark'
  fontSize: number
  fontFamily: string
  autoErrorDiagnosis: boolean
  commandRiskWarning: boolean
  autoSaveHistory: boolean

  // 操作
  setAIProvider: (provider: Partial<AIProvider>) => void
  setTheme: (theme: 'light' | 'dark') => void
  setFontSize: (size: number) => void
  setFeature: (feature: string, enabled: boolean) => void
  loadConfig: (config: AppConfig) => void
  saveConfig: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // 默认状态
  aiProvider: {
    name: 'OpenAI Compatible',
    type: 'openai',
    apiKey: '',
    apiBaseUrl: 'https://api.openai.com/v1',
    modelName: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
  },
  theme: 'dark',
  fontSize: 14,
  fontFamily: 'Monaco, Menlo, "Courier New", monospace',
  autoErrorDiagnosis: true,
  commandRiskWarning: true,
  autoSaveHistory: true,

  // 操作
  setAIProvider: (provider) => {
    set((state) => ({
      aiProvider: { ...state.aiProvider, ...provider },
    }))
  },

  setTheme: (theme) => {
    set({ theme })
  },

  setFontSize: (size) => {
    set({ fontSize: size })
  },

  setFeature: (feature, enabled) => {
    set({ [feature]: enabled })
  },

  loadConfig: (config) => {
    set({
      aiProvider: config.aiProvider,
      theme: config.terminal.theme as 'light' | 'dark',
      fontSize: config.terminal.fontSize,
      fontFamily: config.terminal.fontFamily,
      autoErrorDiagnosis: config.features.autoErrorDiagnosis,
      commandRiskWarning: config.features.commandRiskWarning,
      autoSaveHistory: config.features.autoSaveHistory,
    })
  },

  saveConfig: async () => {
    const state = get()
    const config: AppConfig = {
      aiProvider: state.aiProvider,
      terminal: {
        fontSize: state.fontSize,
        fontFamily: state.fontFamily,
        theme: state.theme,
        shell: window.electronAPI.env.SHELL || '/bin/bash',
        defaultCwd: window.electronAPI.env.HOME || '~',
      },
      features: {
        autoErrorDiagnosis: state.autoErrorDiagnosis,
        commandRiskWarning: state.commandRiskWarning,
        autoSaveHistory: state.autoSaveHistory,
      },
    }

    await window.electronAPI.config.set(config)
  },
}))

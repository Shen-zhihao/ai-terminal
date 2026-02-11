// 终端相关类型
export interface TerminalSession {
  id: string
  pid: number
  createdAt: Date
  cwd: string
  shell: string
}

export interface TerminalOptions {
  cols?: number
  rows?: number
  cwd?: string
  shell?: string
  env?: Record<string, string>
}

// AI 相关类型
export interface AIProvider {
  name: string
  type: 'openai' | 'deepseek' | 'custom'
  apiKey: string
  apiBaseUrl: string
  modelName: string
  temperature?: number
  maxTokens?: number
}

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface CommandSuggestion {
  command: string
  explanation: string
  riskLevel: 'safe' | 'warning' | 'dangerous'
  tags?: string[]
}

export interface Diagnosis {
  error: string
  analysis: string
  solutions: Solution[]
}

export interface Solution {
  description: string
  command?: string
  steps?: string[]
}

export interface CommandHistory {
  id: string
  command: string
  timestamp: Date
  cwd: string
  exitCode: number
  output?: string
  error?: string
}

// 配置类型
export interface AppConfig {
  aiProvider: AIProvider
  terminal: {
    fontSize: number
    fontFamily: string
    theme: string
    shell: string
    defaultCwd: string
  }
  features: {
    autoErrorDiagnosis: boolean
    commandRiskWarning: boolean
    autoSaveHistory: boolean
  }
}

// IPC 通信类型
export interface IPCResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

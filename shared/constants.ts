// IPC 通道名称
export const IPC_CHANNELS = {
  // 终端操作
  TERMINAL_CREATE: 'terminal:create',
  TERMINAL_WRITE: 'terminal:write',
  TERMINAL_RESIZE: 'terminal:resize',
  TERMINAL_DESTROY: 'terminal:destroy',
  TERMINAL_DATA: 'terminal:data',
  TERMINAL_EXIT: 'terminal:exit',

  // 配置操作
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  CONFIG_RESET: 'config:reset',

  // AI 操作
  AI_GENERATE_COMMAND: 'ai:generate-command',
  AI_EXPLAIN_COMMAND: 'ai:explain-command',
  AI_DIAGNOSE_ERROR: 'ai:diagnose-error',
  AI_SEARCH_HISTORY: 'ai:search-history',

  // 历史记录
  HISTORY_GET: 'history:get',
  HISTORY_ADD: 'history:add',
  HISTORY_CLEAR: 'history:clear',
} as const

// 危险命令模式
export const DANGEROUS_PATTERNS = [
  /rm\s+-rf/,
  /dd\s+/,
  /mkfs/,
  /:\(\)\{\s*:\|:&\s*\};:/,  // fork bomb
  />\/dev\/sd[a-z]/,
  /chmod\s+-R\s+777/,
  /chown\s+-R/,
  /sudo\s+rm/,
  /sudo\s+dd/,
] as const

// 警告命令模式
export const WARNING_PATTERNS = [
  /sudo/,
  /rm\s+/,
  /mv\s+.*\/dev\//,
  /curl.*\|\s*sh/,
  /wget.*\|\s*sh/,
] as const

// 默认配置
export const DEFAULT_CONFIG = {
  terminal: {
    fontSize: 14,
    fontFamily: 'Monaco, Menlo, "Courier New", monospace',
    theme: 'dark',
    shell: typeof process !== 'undefined' ? process.env.SHELL || '/bin/bash' : '/bin/bash',
    defaultCwd: typeof process !== 'undefined' ? process.env.HOME || '~' : '~',
  },
  features: {
    autoErrorDiagnosis: true,
    commandRiskWarning: true,
    autoSaveHistory: true,
  },
} as const

// AI 提示词模板
const platform = typeof process !== 'undefined' ? process.platform : 'unknown'

export const AI_PROMPTS = {
  SYSTEM_COMMAND_GENERATION: `You are a helpful terminal assistant. Generate shell commands based on user's natural language requests.
Rules:
- Output ONLY the command, no explanations
- Consider the current OS (${platform})
- Use safe, standard commands
- If the request is unclear, ask for clarification`,

  SYSTEM_COMMAND_EXPLANATION: `You are a terminal command expert. Explain shell commands in clear, concise language.
- Break down each part of the command
- Explain what it does
- Warn about potential risks
- Suggest safer alternatives if applicable`,

  SYSTEM_ERROR_DIAGNOSIS: `You are a terminal debugging expert. Analyze command errors and provide solutions.
- Identify the root cause
- Suggest 1-3 practical solutions
- Provide corrected commands when applicable
- Consider common mistakes`,
} as const

/// <reference types="node" />

// IPC 通道名称
export const IPC_CHANNELS = {
  // 终端操作
  TERMINAL_CREATE: "terminal:create",
  TERMINAL_WRITE: "terminal:write",
  TERMINAL_RESIZE: "terminal:resize",
  TERMINAL_DESTROY: "terminal:destroy",
  TERMINAL_DATA: "terminal:data",
  TERMINAL_EXIT: "terminal:exit",
  SHELL_NEW_TAB: "shell:new-tab",
  SHELL_NEW_WINDOW: "shell:new-window",
  SHELL_SPLIT_VERTICAL: "shell:split-vertical",
  SHELL_SPLIT_HORIZONTAL: "shell:split-horizontal",

  // 配置操作
  CONFIG_GET: "config:get",
  CONFIG_SET: "config:set",
  CONFIG_RESET: "config:reset",

  // AI 操作
  AI_GENERATE_COMMAND: "ai:generate-command",
  AI_EXPLAIN_COMMAND: "ai:explain-command",
  AI_DIAGNOSE_ERROR: "ai:diagnose-error",
  AI_SEARCH_HISTORY: "ai:search-history",

  // 历史记录
  HISTORY_GET: "history:get",
  HISTORY_ADD: "history:add",
  HISTORY_CLEAR: "history:clear",

  // SSH 操作
  SSH_CONNECT: "ssh:connect",
  SSH_DISCONNECT: "ssh:disconnect",
  SSH_WRITE: "ssh:write",
  SSH_RESIZE: "ssh:resize",
  SSH_DATA: "ssh:data",
  SSH_STATUS: "ssh:status",
  SSH_EXIT: "ssh:exit",

  // SSH 主机管理
  SSH_HOSTS_GET: "ssh:hosts-get",
  SSH_HOST_SAVE: "ssh:host-save",
  SSH_HOST_DELETE: "ssh:host-delete",
  SSH_SELECT_KEY_FILE: "ssh:select-key-file",
} as const;

// 危险命令模式
export const DANGEROUS_PATTERNS = [
  /rm\s+-rf/,
  /dd\s+/,
  /mkfs/,
  /:\(\)\{\s*:\|:&\s*\};:/, // fork bomb
  />\/dev\/sd[a-z]/,
  /chmod\s+-R\s+777/,
  /chown\s+-R/,
  /sudo\s+rm/,
  /sudo\s+dd/,
] as const;

// 警告命令模式
export const WARNING_PATTERNS = [
  /sudo/,
  /rm\s+/,
  /mv\s+.*\/dev\//,
  /curl.*\|\s*sh/,
  /wget.*\|\s*sh/,
] as const;

// 默认配置
export const DEFAULT_CONFIG = {
  terminal: {
    fontSize: 14,
    fontFamily: 'Monaco, Menlo, "Courier New", monospace',
    theme: "dark",
    shell:
      typeof process !== "undefined"
        ? process.env.SHELL || "/bin/bash"
        : "/bin/bash",
    defaultCwd: typeof process !== "undefined" ? process.env.HOME || "~" : "~",
  },
  features: {
    autoErrorDiagnosis: true,
    commandRiskWarning: true,
    autoSaveHistory: true,
  },
} as const;

// AI 提示词模板
const platform = typeof process !== "undefined" ? process.platform : "unknown";

export const AI_PROMPTS = {
  SYSTEM_COMMAND_GENERATION: `你是一个乐于助人的终端助手。根据用户的自然语言请求生成 Shell 命令。
规则：
- 仅输出命令，不要包含解释
- 考虑当前操作系统 (${platform})
- 使用安全、标准的命令
- 如果请求不明确，请要求澄清`,

  SYSTEM_COMMAND_EXPLANATION: `你是一个终端命令专家。用清晰简练的语言解释 Shell 命令。
- 拆解命令的每个部分
- 解释它的作用
- 警告潜在风险
- 如果适用，建议更安全的替代方案`,

  SYSTEM_ERROR_DIAGNOSIS: `你是一个终端调试专家。分析命令错误并提供解决方案。
- 识别根本原因
- 建议 1-3 个切实可行的解决方案
- 适用时提供修正后的命令
- 考虑常见错误`,
} as const;

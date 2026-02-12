// 终端相关类型
export type SessionType = 'local' | 'ssh';

export interface TerminalSession {
  id: string;
  type: SessionType;
  pid: number;
  createdAt: Date;
  cwd: string;
  shell: string;
  sshInfo?: {
    host: string;
    port: number;
    username: string;
    status: SSHConnectionStatus;
    hostId?: string;
  };
}

export interface TerminalOptions {
  cols?: number;
  rows?: number;
  cwd?: string;
  shell?: string;
  env?: Record<string, string>;
}

// SSH 相关类型
export type SSHAuthMethod = 'password' | 'privateKey';
export type SSHConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface SSHHostConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authMethod: SSHAuthMethod;
  privateKeyPath?: string;
  passphrase?: string;
  password?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SSHConnectOptions {
  hostId?: string;
  host: string;
  port: number;
  username: string;
  authMethod: SSHAuthMethod;
  password?: string;
  privateKeyPath?: string;
  passphrase?: string;
  cols?: number;
  rows?: number;
}

export interface SSHSession {
  id: string;
  hostId?: string;
  host: string;
  port: number;
  username: string;
  status: SSHConnectionStatus;
  connectedAt?: Date;
}

// AI 相关类型
export interface AIProvider {
  name: string;
  type:
    | "openai"
    | "anthropic"
    | "gemini"
    | "deepseek"
    | "moonshot"
    | "qwen"
    | "zhipu"
    | "groq"
    | "ollama"
    | "custom";
  apiKey: string;
  apiBaseUrl: string;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
}

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CommandSuggestion {
  command: string;
  explanation: string;
  riskLevel: "safe" | "warning" | "dangerous";
  tags?: string[];
}

export interface Diagnosis {
  error: string;
  analysis: string;
  solutions: Solution[];
}

export interface Solution {
  description: string;
  command?: string;
  steps?: string[];
}

export interface CommandHistory {
  id: string;
  command: string;
  timestamp: Date;
  cwd: string;
  exitCode: number;
  output?: string;
  error?: string;
}

// 配置类型
export interface AppConfig {
  aiProvider: AIProvider;
  isSetupCompleted?: boolean;
  terminal: {
    fontSize: number;
    fontFamily: string;
    theme: string;
    shell: string;
    defaultCwd: string;
  };
  features: {
    autoErrorDiagnosis: boolean;
    commandRiskWarning: boolean;
    autoSaveHistory: boolean;
  };
}

// IPC 通信类型
export interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

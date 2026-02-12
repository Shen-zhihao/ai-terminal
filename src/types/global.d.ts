// Electron API
import type {
  TerminalOptions,
  IPCResponse,
  CommandHistory,
  SSHConnectOptions,
  SSHHostConfig,
} from "@shared/types";

declare global {
  interface Window {
    electronAPI: {
      terminal: {
        create: (options?: TerminalOptions) => Promise<IPCResponse>;
        write: (sessionId: string, data: string) => Promise<IPCResponse>;
        resize: (
          sessionId: string,
          cols: number,
          rows: number,
        ) => Promise<IPCResponse>;
        destroy: (sessionId: string) => Promise<IPCResponse>;
        onData: (
          callback: (sessionId: string, data: string) => void,
        ) => () => void;
        onExit: (
          callback: (sessionId: string, exitCode: number) => void,
        ) => () => void;
      };
      ssh: {
        connect: (options: SSHConnectOptions) => Promise<IPCResponse>;
        write: (sessionId: string, data: string) => Promise<IPCResponse>;
        resize: (
          sessionId: string,
          cols: number,
          rows: number,
        ) => Promise<IPCResponse>;
        disconnect: (sessionId: string) => Promise<IPCResponse>;
        onData: (
          callback: (sessionId: string, data: string) => void,
        ) => () => void;
        onStatus: (
          callback: (sessionId: string, status: string, error?: string) => void,
        ) => () => void;
        onExit: (callback: (sessionId: string) => void) => () => void;
        getHosts: () => Promise<IPCResponse<SSHHostConfig[]>>;
        saveHost: (host: SSHHostConfig) => Promise<IPCResponse>;
        deleteHost: (hostId: string) => Promise<IPCResponse>;
        clearHosts: () => Promise<IPCResponse>;
        selectKeyFile: () => Promise<IPCResponse<string | null>>;
        onOpenModal: (callback: () => void) => () => void;
      };
      shell: {
        openNewWindow: () => Promise<IPCResponse>;
        onNewTab: (callback: () => void) => () => void;
        onSplitVertical: (callback: () => void) => () => void;
        onSplitHorizontal: (callback: () => void) => () => void;
      };
      config: {
        get: () => Promise<IPCResponse>;
        set: (config: unknown) => Promise<IPCResponse>;
        reset: () => Promise<IPCResponse>;
        clearApiKeys: () => Promise<IPCResponse>;
      };
      history: {
        get: () => Promise<IPCResponse<CommandHistory[]>>;
        add: (entry: CommandHistory) => Promise<IPCResponse>;
        clear: () => Promise<IPCResponse>;
      };
      platform: string;
      env: {
        HOME?: string;
        SHELL?: string;
      };
    };
  }
}

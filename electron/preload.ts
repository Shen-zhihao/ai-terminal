import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../shared/constants";
import type {
  TerminalOptions,
  IPCResponse,
  CommandHistory,
  SSHConnectOptions,
  SSHHostConfig,
} from "../shared/types";

// 暴露 Electron API 到渲染进程
contextBridge.exposeInMainWorld("electronAPI", {
  // 终端操作
  terminal: {
    create: (options?: TerminalOptions): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.TERMINAL_CREATE, options),

    write: (sessionId: string, data: string): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.TERMINAL_WRITE, sessionId, data),

    resize: (
      sessionId: string,
      cols: number,
      rows: number,
    ): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.TERMINAL_RESIZE, sessionId, cols, rows),

    destroy: (sessionId: string): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.TERMINAL_DESTROY, sessionId),

    onData: (callback: (sessionId: string, data: string) => void) => {
      const handler = (_: any, sessionId: string, data: string) =>
        callback(sessionId, data);
      ipcRenderer.on(IPC_CHANNELS.TERMINAL_DATA, handler);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.TERMINAL_DATA, handler);
    },

    onExit: (callback: (sessionId: string, exitCode: number) => void) => {
      const handler = (_: any, sessionId: string, exitCode: number) =>
        callback(sessionId, exitCode);
      ipcRenderer.on(IPC_CHANNELS.TERMINAL_EXIT, handler);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.TERMINAL_EXIT, handler);
    },
  },

  shell: {
    openNewWindow: (): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.SHELL_NEW_WINDOW),
    onNewTab: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on(IPC_CHANNELS.SHELL_NEW_TAB, handler);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.SHELL_NEW_TAB, handler);
    },
    onSplitVertical: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on(IPC_CHANNELS.SHELL_SPLIT_VERTICAL, handler);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.SHELL_SPLIT_VERTICAL, handler);
    },
    onSplitHorizontal: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on(IPC_CHANNELS.SHELL_SPLIT_HORIZONTAL, handler);
      return () =>
        ipcRenderer.removeListener(
          IPC_CHANNELS.SHELL_SPLIT_HORIZONTAL,
          handler,
        );
    },
  },

  // SSH 操作
  ssh: {
    connect: (options: SSHConnectOptions): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.SSH_CONNECT, options),

    write: (sessionId: string, data: string): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.SSH_WRITE, sessionId, data),

    resize: (
      sessionId: string,
      cols: number,
      rows: number,
    ): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.SSH_RESIZE, sessionId, cols, rows),

    disconnect: (sessionId: string): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.SSH_DISCONNECT, sessionId),

    onData: (callback: (sessionId: string, data: string) => void) => {
      const handler = (_: any, sessionId: string, data: string) =>
        callback(sessionId, data);
      ipcRenderer.on(IPC_CHANNELS.SSH_DATA, handler);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.SSH_DATA, handler);
    },

    onStatus: (
      callback: (sessionId: string, status: string, error?: string) => void,
    ) => {
      const handler = (
        _: any,
        sessionId: string,
        status: string,
        error?: string,
      ) => callback(sessionId, status, error);
      ipcRenderer.on(IPC_CHANNELS.SSH_STATUS, handler);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.SSH_STATUS, handler);
    },

    onExit: (callback: (sessionId: string) => void) => {
      const handler = (_: any, sessionId: string) => callback(sessionId);
      ipcRenderer.on(IPC_CHANNELS.SSH_EXIT, handler);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.SSH_EXIT, handler);
    },

    // 主机管理
    getHosts: (): Promise<IPCResponse<SSHHostConfig[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SSH_HOSTS_GET),

    saveHost: (host: SSHHostConfig): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.SSH_HOST_SAVE, host),

    deleteHost: (hostId: string): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.SSH_HOST_DELETE, hostId),

    selectKeyFile: (): Promise<IPCResponse<string | null>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SSH_SELECT_KEY_FILE),

    onOpenModal: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on("ssh:open-modal", handler);
      return () => ipcRenderer.removeListener("ssh:open-modal", handler);
    },
  },

  // 配置操作
  config: {
    get: (): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET),

    set: (config: any): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SET, config),

    reset: (): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.CONFIG_RESET),
  },

  // 历史记录
  history: {
    get: (): Promise<IPCResponse<CommandHistory[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.HISTORY_GET),

    add: (entry: CommandHistory): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.HISTORY_ADD, entry),

    clear: (): Promise<IPCResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.HISTORY_CLEAR),
  },

  // 平台信息
  platform: process.platform,

  // 环境变量
  env: {
    HOME: process.env.HOME,
    SHELL: process.env.SHELL,
  },
});

// 类型声明（用于 TypeScript）
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
      config: {
        get: () => Promise<IPCResponse>;
        set: (config: any) => Promise<IPCResponse>;
        reset: () => Promise<IPCResponse>;
      };
      history: {
        get: () => Promise<IPCResponse<CommandHistory[]>>;
        add: (entry: CommandHistory) => Promise<IPCResponse>;
        clear: () => Promise<IPCResponse>;
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
          callback: (
            sessionId: string,
            status: string,
            error?: string,
          ) => void,
        ) => () => void;
        onExit: (callback: (sessionId: string) => void) => () => void;
        getHosts: () => Promise<IPCResponse<SSHHostConfig[]>>;
        saveHost: (host: SSHHostConfig) => Promise<IPCResponse>;
        deleteHost: (hostId: string) => Promise<IPCResponse>;
        selectKeyFile: () => Promise<IPCResponse<string | null>>;
        onOpenModal: (callback: () => void) => () => void;
      };
      shell: {
        openNewWindow: () => Promise<IPCResponse>;
        onNewTab: (callback: () => void) => () => void;
        onSplitVertical: (callback: () => void) => () => void;
        onSplitHorizontal: (callback: () => void) => () => void;
      };
      platform: string;
      env: {
        HOME?: string;
        SHELL?: string;
      };
    };
  }
}

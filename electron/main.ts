import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  shell,
  webContents,
} from "electron";
import path from "path";
import { TerminalManager } from "./terminal-manager";
import { SSHManager } from "./ssh-manager";
import { ConfigManager } from "./config-manager";
import { IPC_CHANNELS } from "../shared/constants";
import type {
  IPCResponse,
  TerminalOptions,
  SSHConnectOptions,
  SSHHostConfig,
} from "../shared/types";

// 禁用硬件加速（可选）
// app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null = null;
let terminalManager: TerminalManager | null = null;
let sshManager: SSHManager | null = null;
let configManager: ConfigManager | null = null;
const windows = new Map<number, BrowserWindow>();
const sessionOwnerMap = new Map<string, number>();
let lastActiveWindowId: number | null = null;

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

function getActiveWindow() {
  return (
    BrowserWindow.getFocusedWindow() ||
    (lastActiveWindowId ? windows.get(lastActiveWindowId) || null : null)
  );
}

function cleanupSessionsByWebContentsId(ownerId: number) {
  const sessionIds = Array.from(sessionOwnerMap.entries())
    .filter(([, id]) => id === ownerId)
    .map(([sessionId]) => sessionId);

  sessionIds.forEach((sessionId) => {
    // 尝试作为本地终端销毁
    try {
      terminalManager?.destroy(sessionId);
    } catch {
      /* 非本地终端会话 */
    }
    // 尝试作为 SSH 会话断开
    try {
      sshManager?.disconnect(sessionId);
    } catch {
      /* 非 SSH 会话 */
    }
    sessionOwnerMap.delete(sessionId);
  });
}

function createMenu() {
  const isMac = process.platform === "darwin";

  const template: Electron.MenuItemConstructorOptions[] = [
    // App 菜单 (仅 macOS)
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { label: "关于 AI Terminal", role: "about" },
              { type: "separator" },
              { label: "服务", role: "services" },
              { type: "separator" },
              { label: "隐藏 AI Terminal", role: "hide" },
              { label: "隐藏其他", role: "hideOthers" },
              { label: "显示全部", role: "unhide" },
              { type: "separator" },
              { label: "退出 AI Terminal", role: "quit" },
            ],
          } as Electron.MenuItemConstructorOptions,
        ]
      : []),

    // 编辑菜单
    {
      label: "编辑",
      submenu: [
        { label: "撤销", role: "undo" },
        { label: "重做", role: "redo" },
        { type: "separator" },
        { label: "剪切", role: "cut" },
        { label: "复制", role: "copy" },
        { label: "粘贴", role: "paste" },
        ...(isMac
          ? [
              { label: "粘贴并匹配样式", role: "pasteAndMatchStyle" },
              { label: "删除", role: "delete" },
              { label: "全选", role: "selectAll" },
              { type: "separator" },
              {
                label: "语音",
                submenu: [
                  { label: "开始朗读", role: "startSpeaking" },
                  { label: "停止朗读", role: "stopSpeaking" },
                ],
              },
            ]
          : [
              { label: "删除", role: "delete" },
              { type: "separator" },
              { label: "全选", role: "selectAll" },
            ]),
      ] as Electron.MenuItemConstructorOptions[],
    },
    // 视图菜单
    {
      label: "视图",
      submenu: [
        { label: "重载", role: "reload" },
        { label: "强制重载", role: "forceReload" },
        { label: "切换开发者工具", role: "toggleDevTools" },
        { type: "separator" },
        { label: "重置缩放", role: "resetZoom" },
        { label: "放大", role: "zoomIn" },
        { label: "缩小", role: "zoomOut" },
        { type: "separator" },
        { label: "切换全屏", role: "togglefullscreen" },
      ],
    },
    {
      label: "Shell",
      submenu: [
        {
          label: "新建窗口",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            void createWindow();
          },
        },
        {
          label: "新建标签页",
          accelerator: "CmdOrCtrl+T",
          click: () => {
            const targetWindow = getActiveWindow();
            targetWindow?.webContents.send(IPC_CHANNELS.SHELL_NEW_TAB);
          },
        },
        { type: "separator" },
        {
          label: "SSH 连接",
          accelerator: "CmdOrCtrl+Shift+S",
          click: () => {
            const targetWindow = getActiveWindow();
            targetWindow?.webContents.send("ssh:open-modal");
          },
        },
        { type: "separator" },
        {
          label: "垂直分屏",
          accelerator: "CmdOrCtrl+D",
          click: () => {
            const targetWindow = getActiveWindow();
            targetWindow?.webContents.send(IPC_CHANNELS.SHELL_SPLIT_VERTICAL);
          },
        },
        {
          label: "水平分屏",
          accelerator: "CmdOrCtrl+Shift+D",
          click: () => {
            const targetWindow = getActiveWindow();
            targetWindow?.webContents.send(IPC_CHANNELS.SHELL_SPLIT_HORIZONTAL);
          },
        },
      ],
    },
    // 窗口菜单
    {
      label: "窗口",
      submenu: [
        { label: "最小化", role: "minimize" },
        { label: "缩放", role: "zoom" },
        ...(isMac
          ? [
              { type: "separator" },
              { label: "前置全部窗口", role: "front" },
              { type: "separator" },
              { label: "窗口", role: "window" },
            ]
          : [{ label: "关闭", role: "close" }]),
      ] as Electron.MenuItemConstructorOptions[],
    },
    // 帮助菜单
    {
      label: "帮助",
      submenu: [
        {
          label: "了解更多",
          click: async () => {
            await shell.openExternal("https://github.com/Shen-zhihao");
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function createWindow() {
  const browserWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 15, y: 15 },
  });

  // 加载应用
  if (isDev) {
    await browserWindow.loadURL("http://localhost:5173");
    browserWindow.webContents.openDevTools();
  } else {
    await browserWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  windows.set(browserWindow.id, browserWindow);
  mainWindow = browserWindow;

  browserWindow.on("focus", () => {
    lastActiveWindowId = browserWindow.id;
  });

  browserWindow.on("closed", () => {
    if (mainWindow === browserWindow) {
      mainWindow = null;
    }
    windows.delete(browserWindow.id);
    cleanupSessionsByWebContentsId(browserWindow.webContents.id);
  });
}

function setupIPC() {
  // 终端操作
  ipcMain.handle(
    IPC_CHANNELS.TERMINAL_CREATE,
    async (event, options: TerminalOptions): Promise<IPCResponse> => {
      try {
        if (!terminalManager)
          throw new Error("Terminal manager not initialized");

        const senderId = event.sender.id;
        const session = terminalManager.create(
          options,
          (sessionId, data) => {
            const ownerId = sessionOwnerMap.get(sessionId);
            const target = ownerId ? webContents.fromId(ownerId) : null;
            target?.send(IPC_CHANNELS.TERMINAL_DATA, sessionId, data);
          },
          (sessionId, exitCode) => {
            const ownerId = sessionOwnerMap.get(sessionId);
            const target = ownerId ? webContents.fromId(ownerId) : null;
            target?.send(IPC_CHANNELS.TERMINAL_EXIT, sessionId, exitCode);
            sessionOwnerMap.delete(sessionId);
          },
        );

        sessionOwnerMap.set(session.id, senderId);
        return { success: true, data: session };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.TERMINAL_WRITE,
    async (_, sessionId: string, data: string): Promise<IPCResponse> => {
      try {
        if (!terminalManager)
          throw new Error("Terminal manager not initialized");
        terminalManager.write(sessionId, data);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.TERMINAL_RESIZE,
    async (
      _,
      sessionId: string,
      cols: number,
      rows: number,
    ): Promise<IPCResponse> => {
      try {
        if (!terminalManager)
          throw new Error("Terminal manager not initialized");
        terminalManager.resize(sessionId, cols, rows);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.TERMINAL_DESTROY,
    async (_, sessionId: string): Promise<IPCResponse> => {
      try {
        if (!terminalManager)
          throw new Error("Terminal manager not initialized");
        terminalManager.destroy(sessionId);
        sessionOwnerMap.delete(sessionId);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.SHELL_NEW_WINDOW,
    async (): Promise<IPCResponse> => {
      try {
        await createWindow();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );

  // 配置操作
  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, async (): Promise<IPCResponse> => {
    try {
      if (!configManager) throw new Error("Config manager not initialized");
      const config = await configManager.get();
      return { success: true, data: config };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.CONFIG_SET,
    async (_, config: any): Promise<IPCResponse> => {
      try {
        if (!configManager) throw new Error("Config manager not initialized");
        await configManager.set(config);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(IPC_CHANNELS.CONFIG_RESET, async (): Promise<IPCResponse> => {
    try {
      if (!configManager) throw new Error("Config manager not initialized");
      await configManager.reset();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.CONFIG_CLEAR_API_KEYS,
    async (): Promise<IPCResponse> => {
      try {
        if (!configManager) throw new Error("Config manager not initialized");
        await configManager.clearApiKeys();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );

  // 历史记录操作
  ipcMain.handle(IPC_CHANNELS.HISTORY_GET, async (): Promise<IPCResponse> => {
    try {
      if (!configManager) throw new Error("Config manager not initialized");
      const history = await configManager.getHistory();
      return { success: true, data: history };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.HISTORY_ADD,
    async (_, entry: any): Promise<IPCResponse> => {
      try {
        if (!configManager) throw new Error("Config manager not initialized");
        await configManager.addHistory(entry);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(IPC_CHANNELS.HISTORY_CLEAR, async (): Promise<IPCResponse> => {
    try {
      if (!configManager) throw new Error("Config manager not initialized");
      await configManager.clearHistory();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // SSH 操作
  ipcMain.handle(
    IPC_CHANNELS.SSH_CONNECT,
    async (event, options: SSHConnectOptions): Promise<IPCResponse> => {
      try {
        if (!sshManager) throw new Error("SSH manager not initialized");

        const senderId = event.sender.id;
        const session = await sshManager.connect(
          options,
          (sessionId, data) => {
            const ownerId = sessionOwnerMap.get(sessionId);
            const target = ownerId ? webContents.fromId(ownerId) : null;
            target?.send(IPC_CHANNELS.SSH_DATA, sessionId, data);
          },
          (sessionId, status, error) => {
            const ownerId = sessionOwnerMap.get(sessionId);
            const target = ownerId ? webContents.fromId(ownerId) : null;
            target?.send(IPC_CHANNELS.SSH_STATUS, sessionId, status, error);
          },
          (sessionId) => {
            const ownerId = sessionOwnerMap.get(sessionId);
            const target = ownerId ? webContents.fromId(ownerId) : null;
            target?.send(IPC_CHANNELS.SSH_EXIT, sessionId);
            sessionOwnerMap.delete(sessionId);
          },
        );

        sessionOwnerMap.set(session.id, senderId);
        return { success: true, data: session };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.SSH_WRITE,
    async (_, sessionId: string, data: string): Promise<IPCResponse> => {
      try {
        if (!sshManager) throw new Error("SSH manager not initialized");
        sshManager.write(sessionId, data);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.SSH_RESIZE,
    async (
      _,
      sessionId: string,
      cols: number,
      rows: number,
    ): Promise<IPCResponse> => {
      try {
        if (!sshManager) throw new Error("SSH manager not initialized");
        sshManager.resize(sessionId, cols, rows);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.SSH_DISCONNECT,
    async (_, sessionId: string): Promise<IPCResponse> => {
      try {
        if (!sshManager) throw new Error("SSH manager not initialized");
        sshManager.disconnect(sessionId);
        sessionOwnerMap.delete(sessionId);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );

  // SSH 主机管理
  ipcMain.handle(IPC_CHANNELS.SSH_HOSTS_GET, async (): Promise<IPCResponse> => {
    try {
      if (!configManager) throw new Error("Config manager not initialized");
      const hosts = await configManager.getSSHHosts();
      return { success: true, data: hosts };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.SSH_HOST_SAVE,
    async (_, host: SSHHostConfig): Promise<IPCResponse> => {
      try {
        if (!configManager) throw new Error("Config manager not initialized");
        await configManager.saveSSHHost(host);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.SSH_HOST_DELETE,
    async (_, hostId: string): Promise<IPCResponse> => {
      try {
        if (!configManager) throw new Error("Config manager not initialized");
        await configManager.deleteSSHHost(hostId);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.SSH_HOSTS_CLEAR,
    async (): Promise<IPCResponse> => {
      try {
        if (!configManager) throw new Error("Config manager not initialized");
        await configManager.clearSSHHosts();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.SSH_SELECT_KEY_FILE,
    async (): Promise<IPCResponse> => {
      try {
        const result = await dialog.showOpenDialog({
          title: "选择 SSH 私钥文件",
          defaultPath: path.join(process.env.HOME || "", ".ssh"),
          properties: ["openFile"],
          filters: [{ name: "All Files", extensions: ["*"] }],
        });
        if (result.canceled || result.filePaths.length === 0) {
          return { success: true, data: null };
        }
        return { success: true, data: result.filePaths[0] };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );
}

// 应用生命周期
app.whenReady().then(async () => {
  try {
    // 初始化管理器
    terminalManager = new TerminalManager();
    sshManager = new SSHManager();
    configManager = new ConfigManager();

    // 设置 IPC
    setupIPC();

    // 创建菜单
    createMenu();

    // 创建窗口
    await createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error("Failed to initialize app:", error);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  terminalManager?.destroyAll();
  sshManager?.disconnectAll();
});

// 错误处理
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
});

import { app, BrowserWindow, ipcMain, Menu, shell } from "electron";
import path from "path";
import { TerminalManager } from "./terminal-manager";
import { ConfigManager } from "./config-manager";
import { IPC_CHANNELS } from "../shared/constants";
import type { IPCResponse, TerminalOptions } from "../shared/types";

// 禁用硬件加速（可选）
// app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null = null;
let terminalManager: TerminalManager | null = null;
let configManager: ConfigManager | null = null;

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

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
    // 文件菜单
    {
      label: "文件",
      submenu: [
        isMac
          ? { label: "关闭", role: "close" }
          : { label: "退出", role: "quit" },
      ],
    },
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
            await shell.openExternal(
              "https://github.com/shenzhihao/ai-terminal",
            );
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function createWindow() {
  mainWindow = new BrowserWindow({
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
    await mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
    terminalManager?.destroyAll();
  });
}

function setupIPC() {
  // 终端操作
  ipcMain.handle(
    IPC_CHANNELS.TERMINAL_CREATE,
    async (_, options: TerminalOptions): Promise<IPCResponse> => {
      try {
        if (!terminalManager)
          throw new Error("Terminal manager not initialized");

        const session = terminalManager.create(
          options,
          (sessionId, data) => {
            mainWindow?.webContents.send(
              IPC_CHANNELS.TERMINAL_DATA,
              sessionId,
              data,
            );
          },
          (sessionId, exitCode) => {
            mainWindow?.webContents.send(
              IPC_CHANNELS.TERMINAL_EXIT,
              sessionId,
              exitCode,
            );
          },
        );

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
}

// 应用生命周期
app.whenReady().then(async () => {
  try {
    // 初始化管理器
    terminalManager = new TerminalManager();
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
});

// 错误处理
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
});

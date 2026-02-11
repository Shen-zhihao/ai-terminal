import fs from "fs/promises";
import path from "path";
import { app, safeStorage } from "electron";
import { DEFAULT_CONFIG } from "../shared/constants";
import type { AppConfig, CommandHistory } from "../shared/types";

export class ConfigManager {
  private configDir: string;
  private configPath: string;
  private historyPath: string;
  private config: Partial<AppConfig> | null = null;
  private history: CommandHistory[] = [];

  constructor() {
    // 配置目录：~/.ai-terminal
    this.configDir = path.join(app.getPath("home"), ".ai-terminal");
    this.configPath = path.join(this.configDir, "config.json");
    this.historyPath = path.join(this.configDir, "history.json");
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // 确保配置目录存在
      await fs.mkdir(this.configDir, { recursive: true });

      // 加载配置
      await this.load();
    } catch (error) {
      console.error("Failed to initialize config manager:", error);
    }
  }

  private async load(): Promise<void> {
    try {
      // 加载配置文件
      const configData = await fs.readFile(this.configPath, "utf-8");
      this.config = JSON.parse(configData);
    } catch (error: any) {
      // 文件不存在时使用默认配置
      if (error.code === "ENOENT") {
        this.config = {};
      } else {
        throw error;
      }
    }

    try {
      // 加载历史记录
      const historyData = await fs.readFile(this.historyPath, "utf-8");
      this.history = JSON.parse(historyData);
    } catch (error: any) {
      // 文件不存在时使用空历史
      if (error.code === "ENOENT") {
        this.history = [];
      } else {
        throw error;
      }
    }
  }

  private async save(): Promise<void> {
    await fs.writeFile(
      this.configPath,
      JSON.stringify(this.config, null, 2),
      "utf-8",
    );
  }

  private async saveHistory(): Promise<void> {
    // 只保留最近 1000 条历史记录
    const recentHistory = this.history.slice(-1000);
    await fs.writeFile(
      this.historyPath,
      JSON.stringify(recentHistory, null, 2),
      "utf-8",
    );
  }

  async get(): Promise<AppConfig> {
    // 合并默认配置和用户配置
    const mergedConfig: AppConfig = {
      isSetupCompleted: this.config?.isSetupCompleted || false,
      aiProvider: {
        name: this.config?.aiProvider?.name || "OpenAI Compatible",
        type: this.config?.aiProvider?.type || "openai",
        apiKey: this.config?.aiProvider?.apiKey || "",
        apiBaseUrl:
          this.config?.aiProvider?.apiBaseUrl || "https://api.openai.com/v1",
        modelName: this.config?.aiProvider?.modelName || "gpt-4",
        temperature: this.config?.aiProvider?.temperature || 0.7,
        maxTokens: this.config?.aiProvider?.maxTokens || 2000,
      },
      terminal: {
        ...DEFAULT_CONFIG.terminal,
        ...this.config?.terminal,
      },
      features: {
        ...DEFAULT_CONFIG.features,
        ...this.config?.features,
      },
    };

    // 解密 API Key（如果已加密）
    if (mergedConfig.aiProvider.apiKey && safeStorage.isEncryptionAvailable()) {
      try {
        const buffer = Buffer.from(mergedConfig.aiProvider.apiKey, "base64");
        mergedConfig.aiProvider.apiKey = safeStorage.decryptString(buffer);
      } catch (error) {
        // API Key 未加密或解密失败，保持原值
      }
    }

    return mergedConfig;
  }

  async set(config: Partial<AppConfig>): Promise<void> {
    // 如果提供了 API Key，加密存储
    if (config.aiProvider?.apiKey && safeStorage.isEncryptionAvailable()) {
      try {
        const encrypted = safeStorage.encryptString(config.aiProvider.apiKey);
        config.aiProvider.apiKey = encrypted.toString("base64");
      } catch (error) {
        console.warn("Failed to encrypt API key:", error);
      }
    }

    // 深度合并配置
    this.config = {
      ...this.config,
      ...config,
      aiProvider: {
        ...this.config?.aiProvider,
        ...config.aiProvider,
      } as any,
      terminal: {
        ...this.config?.terminal,
        ...config.terminal,
      } as any,
      features: {
        ...this.config?.features,
        ...config.features,
      } as any,
    };

    await this.save();
  }

  async reset(): Promise<void> {
    this.config = {};
    await this.save();
  }

  async getHistory(): Promise<CommandHistory[]> {
    return this.history;
  }

  async addHistory(entry: CommandHistory): Promise<void> {
    this.history.push(entry);
    await this.saveHistory();
  }

  async clearHistory(): Promise<void> {
    this.history = [];
    await this.saveHistory();
  }
}

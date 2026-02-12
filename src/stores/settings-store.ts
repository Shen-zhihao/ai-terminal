import { create } from "zustand";
import type { AppConfig, AIProvider } from "@shared/types";

interface SettingsState {
  aiProvider: AIProvider;
  aiProviderConfigs: AIProvider[];
  isSetupCompleted: boolean;
  theme: "light" | "dark";
  fontSize: number;
  fontFamily: string;
  autoErrorDiagnosis: boolean;
  commandRiskWarning: boolean;
  autoSaveHistory: boolean;

  // 操作
  setAIProvider: (provider: Partial<AIProvider>) => void;
  addAIProviderConfig: (config: AIProvider) => void;
  updateAIProviderConfig: (config: AIProvider) => void;
  removeAIProviderConfig: (id: string) => void;
  setCurrentAIProviderConfig: (id: string) => void;
  setSetupCompleted: (completed: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
  setFontSize: (size: number) => void;
  setFeature: (feature: string, enabled: boolean) => void;
  loadConfig: (config: AppConfig) => void;
  saveConfig: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // 默认状态
  aiProvider: {
    name: "OpenAI Compatible",
    type: "openai",
    apiKey: "",
    apiBaseUrl: "https://api.openai.com/v1",
    modelName: "gpt-4",
    temperature: 0.7,
    maxTokens: 2000,
  },
  aiProviderConfigs: [],
  isSetupCompleted: false,
  theme: "dark",
  fontSize: 14,
  fontFamily: 'Monaco, Menlo, "Courier New", monospace',
  autoErrorDiagnosis: true,
  commandRiskWarning: true,
  autoSaveHistory: true,

  // 操作
  setAIProvider: (provider) => {
    set((state) => {
      const newProvider = { ...state.aiProvider, ...provider };
      // Ensure ID exists
      if (!newProvider.id) newProvider.id = "default";

      const existingIndex = state.aiProviderConfigs.findIndex(
        (c) => c.id === newProvider.id,
      );
      const newConfigs = [...state.aiProviderConfigs];

      if (existingIndex >= 0) {
        newConfigs[existingIndex] = newProvider;
      } else {
        newConfigs.push(newProvider);
      }

      return {
        aiProvider: newProvider,
        aiProviderConfigs: newConfigs,
      };
    });
  },

  addAIProviderConfig: (config) => {
    set((state) => ({
      aiProviderConfigs: [...state.aiProviderConfigs, config],
    }));
  },

  updateAIProviderConfig: (config) => {
    set((state) => ({
      aiProviderConfigs: state.aiProviderConfigs.map((c) =>
        c.id === config.id ? config : c,
      ),
      // Update current if it's the one being edited
      aiProvider:
        state.aiProvider.id === config.id
          ? { ...state.aiProvider, ...config }
          : state.aiProvider,
    }));
  },

  removeAIProviderConfig: (id) => {
    set((state) => ({
      aiProviderConfigs: state.aiProviderConfigs.filter((c) => c.id !== id),
    }));
  },

  setCurrentAIProviderConfig: (id) => {
    set((state) => {
      const config = state.aiProviderConfigs.find((c) => c.id === id);
      if (config) {
        return { aiProvider: config };
      }
      return {};
    });
  },

  setSetupCompleted: (completed) => {
    set({ isSetupCompleted: completed });
  },

  setTheme: (theme) => {
    set({ theme });
  },

  setFontSize: (size) => {
    set({ fontSize: size });
  },

  setFeature: (feature, enabled) => {
    set({ [feature]: enabled });
  },

  loadConfig: (config) => {
    const aiProviderConfigs = config.aiProviderConfigs || [config.aiProvider];
    // Ensure IDs exist
    if (!config.aiProvider.id) config.aiProvider.id = "default";
    aiProviderConfigs.forEach((c, index) => {
      if (!c.id)
        c.id = index === 0 ? config.aiProvider.id : self.crypto.randomUUID();
    });

    set({
      aiProvider: config.aiProvider,
      aiProviderConfigs,
      isSetupCompleted: config.isSetupCompleted || false,
      theme: config.terminal.theme as "light" | "dark",
      fontSize: config.terminal.fontSize,
      fontFamily: config.terminal.fontFamily,
      autoErrorDiagnosis: config.features.autoErrorDiagnosis,
      commandRiskWarning: config.features.commandRiskWarning,
      autoSaveHistory: config.features.autoSaveHistory,
    });
  },

  saveConfig: async () => {
    const state = get();
    const config: AppConfig = {
      aiProvider: state.aiProvider,
      aiProviderConfigs: state.aiProviderConfigs,
      isSetupCompleted: state.isSetupCompleted,
      terminal: {
        fontSize: state.fontSize,
        fontFamily: state.fontFamily,
        theme: state.theme,
        shell: window.electronAPI.env.SHELL || "/bin/bash",
        defaultCwd: window.electronAPI.env.HOME || "~",
      },
      features: {
        autoErrorDiagnosis: state.autoErrorDiagnosis,
        commandRiskWarning: state.commandRiskWarning,
        autoSaveHistory: state.autoSaveHistory,
      },
    };

    await window.electronAPI.config.set(config);
  },
}));

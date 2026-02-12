import { useState } from "react";
import type { AIProvider } from "@shared/types";
import { useSettingsStore } from "../../stores/settings-store";
import "./SetupWizard.less";

interface SetupWizardProps {
  onComplete: () => void;
}

const AI_PROVIDERS = [
  {
    type: "openai" as const,
    name: "OpenAI",
    description: "GPT-4, GPT-3.5 等模型",
    defaultUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4",
    icon: "🤖",
  },
  {
    type: "deepseek" as const,
    name: "DeepSeek",
    description: "DeepSeek Chat 系列模型",
    defaultUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    icon: "🧠",
  },
  {
    type: "custom" as const,
    name: "其他兼容服务",
    description: "OpenAI 兼容的 API 服务",
    defaultUrl: "https://api.example.com/v1",
    defaultModel: "gpt-4",
    icon: "⚙️",
  },
];

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<
    (typeof AI_PROVIDERS)[0] | null
  >(null);
  const [apiKey, setApiKey] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [modelName, setModelName] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { setAIProvider, setSetupCompleted, saveConfig } = useSettingsStore();

  const handleProviderSelect = (provider: (typeof AI_PROVIDERS)[0]) => {
    setSelectedProvider(provider);
    setApiBaseUrl(provider.defaultUrl);
    setModelName(provider.defaultModel);
    setStep(2);
  };

  const handleSkipSetup = async () => {
    setIsLoading(true);
    try {
      // 设置空配置表示跳过 AI 配置
      const emptyConfig: AIProvider = {
        id: self.crypto.randomUUID(),
        name: "普通终端",
        type: "custom", // 使用 custom 类型但不设置有效的 API key
        apiKey: "",
        apiBaseUrl: "",
        modelName: "",
        temperature: 0.7,
        maxTokens: 2000,
      };

      setAIProvider(emptyConfig);
      setSetupCompleted(true);
      await saveConfig();
      onComplete();
    } catch (error: any) {
      alert(`保存配置失败: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedProvider || !apiKey.trim()) {
      alert("请填写所有必填项");
      return;
    }

    setIsLoading(true);

    try {
      const config: AIProvider = {
        id: self.crypto.randomUUID(),
        name: selectedProvider.name,
        type: selectedProvider.type,
        apiKey: apiKey.trim(),
        apiBaseUrl: apiBaseUrl.trim(),
        modelName: modelName.trim(),
        temperature: 0.7,
        maxTokens: 2000,
      };

      setAIProvider(config);
      setSetupCompleted(true);
      await saveConfig();
      onComplete();
    } catch (error: any) {
      alert(`保存配置失败: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="setup-wizard">
      <div className="setup-container">
        {step === 1 && (
          <div className="slide-in">
            <div className="setup-header">
              <h1 className="setup-header-title">欢迎使用 AI Terminal</h1>
              <p className="setup-header-subtitle">
                让我们开始配置您的 AI 助手
              </p>
            </div>

            <div className="providers">
              <h2 className="providers-title">选择 AI 提供商</h2>
              <div className="providers-list">
                {AI_PROVIDERS.map((provider) => (
                  <button
                    key={provider.type}
                    onClick={() => handleProviderSelect(provider)}
                    className="provider-card"
                  >
                    <div className="provider-card-content">
                      <div className="provider-card-icon">{provider.icon}</div>
                      <div className="provider-card-info">
                        <h3 className="provider-card-name">{provider.name}</h3>
                        <p className="provider-card-desc">
                          {provider.description}
                        </p>
                      </div>
                      <div className="provider-card-arrow">→</div>
                    </div>
                  </button>
                ))}
                <button
                  onClick={handleSkipSetup}
                  disabled={isLoading}
                  className="provider-card provider-card-skip"
                >
                  <div className="provider-card-content">
                    <div className="provider-card-icon">⏭️</div>
                    <div className="provider-card-info">
                      <h3 className="provider-card-name">跳过配置</h3>
                      <p className="provider-card-desc">
                        仅使用普通终端功能，稍后可在设置中启用 AI
                      </p>
                    </div>
                    <div className="provider-card-arrow">→</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && selectedProvider && (
          <div className="slide-in">
            <div className="setup-step-header">
              <div className="setup-step-header-icon">
                {selectedProvider.icon}
              </div>
              <h2 className="setup-step-header-title">
                配置 {selectedProvider.name}
              </h2>
              <p className="setup-step-header-subtitle">
                请填写以下信息以完成设置
              </p>
            </div>

            <div className="config-form">
              <div className="config-form-field">
                <label className="config-form-label">
                  API Key <span className="required">*</span>
                </label>
                <div className="config-form-input-wrapper">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="config-form-input"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="config-form-toggle-btn"
                  >
                    {showApiKey ? "🙈" : "👁️"}
                  </button>
                </div>
                <p className="config-form-hint">
                  {selectedProvider.type === "openai" &&
                    "在 platform.openai.com 获取"}
                  {selectedProvider.type === "deepseek" &&
                    "在 platform.deepseek.com 获取"}
                  {selectedProvider.type === "custom" &&
                    "从您的 API 提供商获取"}
                </p>
              </div>

              <div className="config-form-field">
                <label className="config-form-label">API Base URL</label>
                <input
                  type="text"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  placeholder="https://api.example.com/v1"
                  className="config-form-input"
                />
              </div>

              <div className="config-form-field">
                <label className="config-form-label">模型名称</label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="gpt-4"
                  className="config-form-input"
                />
                <p className="config-form-hint">
                  常用模型：
                  {selectedProvider.type === "openai" &&
                    " gpt-4, gpt-3.5-turbo"}
                  {selectedProvider.type === "deepseek" &&
                    " deepseek-chat, deepseek-coder"}
                  {selectedProvider.type === "custom" && " 请查阅提供商文档"}
                </p>
              </div>

              <div className="info-box">
                <div className="info-box-content">
                  <div className="info-box-icon">💡</div>
                  <div className="info-box-text">
                    <p className="info-box-text-title">安全提示</p>
                    <p className="info-box-text-desc">
                      您的 API Key
                      将被加密存储在本地配置文件中，不会上传到任何服务器。
                    </p>
                  </div>
                </div>
              </div>

              <div className="config-actions">
                <button
                  onClick={() => setStep(1)}
                  className="btn btn-secondary"
                  disabled={isLoading}
                >
                  ← 返回
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!apiKey.trim() || isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? "保存中..." : "完成设置 →"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="setup-footer">
          <p>稍后可以在设置中修改这些配置</p>
        </div>
      </div>
    </div>
  );
}

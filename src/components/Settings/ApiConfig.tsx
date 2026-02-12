import { useState } from "react";
import { useSettingsStore } from "@/stores/settings-store";
import { AIProvider } from "@shared/types";
import "./SettingsModal.less";

// 预设配置
const PROVIDER_PRESETS: Record<
  string,
  { name: string; baseUrl: string; model: string }
> = {
  openai: {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4-turbo-preview",
  },
  anthropic: {
    name: "Anthropic (Claude)",
    baseUrl: "https://api.anthropic.com/v1",
    model: "claude-3-opus-20240229",
  },
  gemini: {
    name: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    model: "gemini-1.5-pro-latest",
  },
  deepseek: {
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-chat",
  },
  moonshot: {
    name: "Moonshot (Kimi)",
    baseUrl: "https://api.moonshot.cn/v1",
    model: "moonshot-v1-8k",
  },
  qwen: {
    name: "Qwen (通义千问)",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-turbo",
  },
  zhipu: {
    name: "Zhipu (智谱 GLM)",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-4",
  },
  groq: {
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama3-70b-8192",
  },
  ollama: {
    name: "Ollama (Local)",
    baseUrl: "http://localhost:11434/v1",
    model: "llama3",
  },
  custom: {
    name: "自定义",
    baseUrl: "",
    model: "",
  },
};

export default function ApiConfig() {
  const {
    aiProvider,
    aiProviderConfigs,
    addAIProviderConfig,
    updateAIProviderConfig,
    removeAIProviderConfig,
    setCurrentAIProviderConfig,
  } = useSettingsStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const selectedConfig =
    aiProviderConfigs.find((c) => c.id === selectedId) || aiProvider;

  // If no config is selected (shouldn't happen if initialized correctly), fallback to current
  const activeConfig = selectedConfig || aiProvider;
  const isCurrent = activeConfig.id === aiProvider.id;

  const handleAddConfig = () => {
    const newConfig: AIProvider = {
      id: self.crypto.randomUUID(),
      name: "新配置",
      type: "openai",
      apiKey: "",
      apiBaseUrl: "https://api.openai.com/v1",
      modelName: "gpt-4",
      temperature: 0.7,
      maxTokens: 2000,
    };
    addAIProviderConfig(newConfig);
    setSelectedId(newConfig.id!);
  };

  const handleUpdate = (updates: Partial<AIProvider>) => {
    if (activeConfig.id) {
      updateAIProviderConfig({ ...activeConfig, ...updates });
    }
  };

  const handleProviderChange = (type: string) => {
    const preset = PROVIDER_PRESETS[type];
    if (preset && type !== "custom") {
      handleUpdate({
        type: type as any,
        apiBaseUrl: preset.baseUrl,
        modelName: preset.model,
      });
    } else {
      handleUpdate({ type: type as any });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("确定要删除此配置吗？")) {
      removeAIProviderConfig(id);
      if (selectedId === id) {
        setSelectedId(aiProvider.id || null);
      }
    }
  };

  return (
    <>
      <div className="config-list">
        <h3>配置列表</h3>
        <button className="add-btn" onClick={handleAddConfig}>
          + 添加新配置
        </button>
        <div className="config-items-scroll">
          {aiProviderConfigs.map((config) => (
            <div
              key={config.id}
              className={`config-item ${
                activeConfig.id === config.id ? "active" : ""
              } ${config.id === aiProvider.id ? "current" : ""}`}
              onClick={() => setSelectedId(config.id!)}
            >
              <span className="item-name">{config.name || "未命名配置"}</span>
              {config.id === aiProvider.id && (
                <span className="current-badge">当前</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="config-form-container">
        <div className="config-form">
          <div className="config-header">
            <h3>{activeConfig.name}</h3>
            <div className="config-actions">
              {!isCurrent && (
                <button
                  className="btn-activate"
                  onClick={() => setCurrentAIProviderConfig(activeConfig.id!)}
                >
                  设为当前
                </button>
              )}
              {aiProviderConfigs.length > 1 && (
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(activeConfig.id!)}
                >
                  删除
                </button>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>配置名称</label>
            <input
              type="text"
              value={activeConfig.name}
              onChange={(e) => handleUpdate({ name: e.target.value })}
              placeholder="例如：公司 API"
            />
          </div>

          <div className="form-group">
            <label>服务商类型</label>
            <select
              value={activeConfig.type}
              onChange={(e) => handleProviderChange(e.target.value)}
            >
              {Object.entries(PROVIDER_PRESETS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>API 地址</label>
            <input
              type="text"
              value={activeConfig.apiBaseUrl}
              onChange={(e) => handleUpdate({ apiBaseUrl: e.target.value })}
              placeholder="https://api.openai.com/v1"
            />
            <div className="form-hint">
              {activeConfig.type !== "custom" &&
              PROVIDER_PRESETS[activeConfig.type]
                ? `默认地址: ${PROVIDER_PRESETS[activeConfig.type].baseUrl}`
                : "请输入 API 基础地址"}
            </div>
          </div>

          <div className="form-group">
            <label>API 密钥</label>
            <div className="form-group-input-wrapper">
              <input
                type={showApiKey ? "text" : "password"}
                value={activeConfig.apiKey}
                onChange={(e) => handleUpdate({ apiKey: e.target.value })}
                placeholder={
                  activeConfig.type === "ollama"
                    ? "Ollama 通常不需要密钥"
                    : "sk-..."
                }
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="form-group-toggle-btn"
              >
                {showApiKey ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>模型名称</label>
            <input
              type="text"
              value={activeConfig.modelName}
              onChange={(e) => handleUpdate({ modelName: e.target.value })}
              placeholder="gpt-4"
            />
            <div className="form-hint">
              {activeConfig.type !== "custom" &&
                PROVIDER_PRESETS[activeConfig.type] &&
                `推荐模型: ${PROVIDER_PRESETS[activeConfig.type].model}`}
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label>用量</label>
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={activeConfig.temperature}
                onChange={(e) =>
                  handleUpdate({ temperature: Number(e.target.value) })
                }
              />
            </div>

            <div className="form-group">
              <label>最大 Token 数</label>
              <input
                type="number"
                min="100"
                max="32000"
                step="100"
                value={activeConfig.maxTokens}
                onChange={(e) =>
                  handleUpdate({ maxTokens: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="form-tip">
            <p>
              💡 提示：你的 API
              密钥已加密存储在本地配置文件中，不会上传到任何服务器。
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

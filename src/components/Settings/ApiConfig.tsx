import { useState } from "react";
import { useSettingsStore } from "../../stores/settings-store";
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
  const { aiProvider, setAIProvider } = useSettingsStore();
  const [showApiKey, setShowApiKey] = useState(false);

  const handleProviderChange = (type: string) => {
    const preset = PROVIDER_PRESETS[type];
    if (preset && type !== "custom") {
      setAIProvider({
        type: type as any,
        apiBaseUrl: preset.baseUrl,
        modelName: preset.model,
      });
    } else {
      setAIProvider({ type: type as any });
    }
  };

  return (
    <>
      <div className="form-group">
        <label>服务商类型</label>
        <select
          value={aiProvider.type}
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
          value={aiProvider.apiBaseUrl}
          onChange={(e) => setAIProvider({ apiBaseUrl: e.target.value })}
          placeholder="https://api.openai.com/v1"
        />
        <div className="form-hint">
          {aiProvider.type !== "custom" && PROVIDER_PRESETS[aiProvider.type]
            ? `默认地址: ${PROVIDER_PRESETS[aiProvider.type].baseUrl}`
            : "请输入 API 基础地址"}
        </div>
      </div>

      <div className="form-group">
        <label>API 密钥</label>
        <div className="form-group-input-wrapper">
          <input
            type={showApiKey ? "text" : "password"}
            value={aiProvider.apiKey}
            onChange={(e) => setAIProvider({ apiKey: e.target.value })}
            placeholder={
              aiProvider.type === "ollama" ? "Ollama 通常不需要密钥" : "sk-..."
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
          value={aiProvider.modelName}
          onChange={(e) => setAIProvider({ modelName: e.target.value })}
          placeholder="gpt-4"
        />
        <div className="form-hint">
          {aiProvider.type !== "custom" &&
            PROVIDER_PRESETS[aiProvider.type] &&
            `推荐模型: ${PROVIDER_PRESETS[aiProvider.type].model}`}
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
            value={aiProvider.temperature}
            onChange={(e) =>
              setAIProvider({ temperature: Number(e.target.value) })
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
            value={aiProvider.maxTokens}
            onChange={(e) =>
              setAIProvider({ maxTokens: Number(e.target.value) })
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
    </>
  );
}

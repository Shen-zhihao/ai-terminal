import { useState } from 'react'
import { useSettingsStore } from '../../stores/settings-store'
import './SettingsModal.less'

export default function ApiConfig() {
  const { aiProvider, setAIProvider } = useSettingsStore()
  const [showApiKey, setShowApiKey] = useState(false)

  return (
    <>
      <div className="form-group">
        <label>服务商类型</label>
        <select
          value={aiProvider.type}
          onChange={(e) => setAIProvider({ type: e.target.value as any })}
        >
          <option value="openai">OpenAI 兼容</option>
          <option value="deepseek">DeepSeek</option>
          <option value="custom">自定义</option>
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
          {aiProvider.type === 'deepseek' && 'DeepSeek: https://api.deepseek.com/v1'}
          {aiProvider.type === 'openai' && 'OpenAI: https://api.openai.com/v1'}
        </div>
      </div>

      <div className="form-group">
        <label>API 密钥</label>
        <div className="form-group-input-wrapper">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={aiProvider.apiKey}
            onChange={(e) => setAIProvider({ apiKey: e.target.value })}
            placeholder="sk-..."
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="form-group-toggle-btn"
          >
            {showApiKey ? '🙈' : '👁️'}
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
      </div>

      <div className="form-group-row">
        <div className="form-group">
          <label>温度</label>
          <input
            type="number"
            min="0"
            max="2"
            step="0.1"
            value={aiProvider.temperature}
            onChange={(e) => setAIProvider({ temperature: Number(e.target.value) })}
          />
        </div>

        <div className="form-group">
          <label>最大 Token 数</label>
          <input
            type="number"
            min="100"
            max="8000"
            step="100"
            value={aiProvider.maxTokens}
            onChange={(e) => setAIProvider({ maxTokens: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="form-tip">
        <p>💡 提示：你的 API 密钥已加密存储在本地配置文件中，不会上传到任何服务器。</p>
      </div>
    </>
  )
}

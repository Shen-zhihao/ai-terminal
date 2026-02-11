import { useState } from 'react'
import { useSettingsStore } from '../../stores/settings-store'

export default function ApiConfig() {
  const { aiProvider, setAIProvider } = useSettingsStore()
  const [showApiKey, setShowApiKey] = useState(false)

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Provider Type
        </label>
        <select
          value={aiProvider.type}
          onChange={(e) => setAIProvider({ type: e.target.value as any })}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="openai">OpenAI Compatible</option>
          <option value="deepseek">DeepSeek</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          API Base URL
        </label>
        <input
          type="text"
          value={aiProvider.apiBaseUrl}
          onChange={(e) => setAIProvider({ apiBaseUrl: e.target.value })}
          placeholder="https://api.openai.com/v1"
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="mt-1 text-xs text-gray-400">
          {aiProvider.type === 'deepseek' && 'DeepSeek: https://api.deepseek.com/v1'}
          {aiProvider.type === 'openai' && 'OpenAI: https://api.openai.com/v1'}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          API Key
        </label>
        <div className="relative">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={aiProvider.apiKey}
            onChange={(e) => setAIProvider({ apiKey: e.target.value })}
            placeholder="sk-..."
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-sm"
          >
            {showApiKey ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Model Name
        </label>
        <input
          type="text"
          value={aiProvider.modelName}
          onChange={(e) => setAIProvider({ modelName: e.target.value })}
          placeholder="gpt-4"
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Temperature
          </label>
          <input
            type="number"
            min="0"
            max="2"
            step="0.1"
            value={aiProvider.temperature}
            onChange={(e) => setAIProvider({ temperature: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Max Tokens
          </label>
          <input
            type="number"
            min="100"
            max="8000"
            step="100"
            value={aiProvider.maxTokens}
            onChange={(e) => setAIProvider({ maxTokens: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg">
        <p className="text-xs text-blue-300">
          💡 Tip: Your API key is encrypted and stored securely in your local configuration file.
        </p>
      </div>
    </div>
  )
}

import { useState } from 'react'
import type { AIProvider } from '@shared/types'
import { useSettingsStore } from '../../stores/settings-store'

interface SetupWizardProps {
  onComplete: () => void
}

const AI_PROVIDERS = [
  {
    type: 'openai' as const,
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5 等模型',
    defaultUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4',
    icon: '🤖',
  },
  {
    type: 'deepseek' as const,
    name: 'DeepSeek',
    description: 'DeepSeek Chat 系列模型',
    defaultUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    icon: '🧠',
  },
  {
    type: 'custom' as const,
    name: '其他兼容服务',
    description: 'OpenAI 兼容的 API 服务',
    defaultUrl: 'https://api.example.com/v1',
    defaultModel: 'gpt-4',
    icon: '⚙️',
  },
]

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1)
  const [selectedProvider, setSelectedProvider] = useState<typeof AI_PROVIDERS[0] | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [apiBaseUrl, setApiBaseUrl] = useState('')
  const [modelName, setModelName] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { setAIProvider, saveConfig } = useSettingsStore()

  const handleProviderSelect = (provider: typeof AI_PROVIDERS[0]) => {
    setSelectedProvider(provider)
    setApiBaseUrl(provider.defaultUrl)
    setModelName(provider.defaultModel)
    setStep(2)
  }

  const handleComplete = async () => {
    if (!selectedProvider || !apiKey.trim()) {
      alert('请填写所有必填项')
      return
    }

    setIsLoading(true)

    try {
      const config: AIProvider = {
        name: selectedProvider.name,
        type: selectedProvider.type,
        apiKey: apiKey.trim(),
        apiBaseUrl: apiBaseUrl.trim(),
        modelName: modelName.trim(),
        temperature: 0.7,
        maxTokens: 2000,
      }

      setAIProvider(config)
      await saveConfig()
      onComplete()
    } catch (error: any) {
      alert(`保存配置失败: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center z-50">
      <div className="max-w-2xl w-full mx-4">
        {/* 步骤 1: 选择 AI 提供商 */}
        {step === 1 && (
          <div className="slide-in">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-white mb-4">
                欢迎使用 AI Terminal
              </h1>
              <p className="text-xl text-gray-300">
                让我们开始配置您的 AI 助手
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">
                选择 AI 提供商
              </h2>

              {AI_PROVIDERS.map((provider) => (
                <button
                  key={provider.type}
                  onClick={() => handleProviderSelect(provider)}
                  className="w-full p-6 bg-gray-800 bg-opacity-50 backdrop-blur-sm hover:bg-opacity-70 rounded-xl border border-gray-700 hover:border-blue-500 transition-all text-left group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">{provider.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {provider.name}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {provider.description}
                      </p>
                    </div>
                    <div className="text-gray-500 group-hover:text-blue-400 transition-colors">
                      →
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 步骤 2: 配置详情 */}
        {step === 2 && selectedProvider && (
          <div className="slide-in">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">{selectedProvider.icon}</div>
              <h2 className="text-3xl font-bold text-white mb-2">
                配置 {selectedProvider.name}
              </h2>
              <p className="text-gray-400">
                请填写以下信息以完成设置
              </p>
            </div>

            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 space-y-6">
              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Key <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={selectedProvider.type === 'deepseek' ? 'sk-...' : 'sk-...'}
                    className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showApiKey ? '🙈' : '👁️'}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {selectedProvider.type === 'openai' && '在 platform.openai.com 获取'}
                  {selectedProvider.type === 'deepseek' && '在 platform.deepseek.com 获取'}
                  {selectedProvider.type === 'custom' && '从您的 API 提供商获取'}
                </p>
              </div>

              {/* API Base URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Base URL
                </label>
                <input
                  type="text"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  placeholder="https://api.example.com/v1"
                  className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Model Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  模型名称
                </label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="gpt-4"
                  className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-2 text-xs text-gray-500">
                  常用模型：
                  {selectedProvider.type === 'openai' && ' gpt-4, gpt-3.5-turbo'}
                  {selectedProvider.type === 'deepseek' && ' deepseek-chat, deepseek-coder'}
                  {selectedProvider.type === 'custom' && ' 请查阅提供商文档'}
                </p>
              </div>

              {/* 提示信息 */}
              <div className="bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-blue-400 text-xl">💡</div>
                  <div className="flex-1 text-sm text-blue-300">
                    <p className="font-medium mb-1">安全提示</p>
                    <p className="text-blue-400 opacity-90">
                      您的 API Key 将被加密存储在本地配置文件中，不会上传到任何服务器。
                    </p>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  ← 返回
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!apiKey.trim() || isLoading}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                >
                  {isLoading ? '保存中...' : '完成设置 →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 底部提示 */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>稍后可以在设置中修改这些配置</p>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useSettingsStore } from '../../stores/settings-store'
import ApiConfig from './ApiConfig'

interface SettingsModalProps {
  onClose: () => void
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'ai' | 'terminal' | 'features'>('ai')
  const [isSaving, setIsSaving] = useState(false)

  const {
    fontSize,
    setFontSize,
    autoErrorDiagnosis,
    commandRiskWarning,
    autoSaveHistory,
    setFeature,
    saveConfig,
  } = useSettingsStore()

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveConfig()
      onClose()
    } catch (error: any) {
      alert(`Failed to save settings: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 选项卡 */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'ai'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            AI Model
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'terminal'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Terminal
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'features'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Features
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'ai' && <ApiConfig />}

          {activeTab === 'terminal' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Font Size
                </label>
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-sm text-gray-400 mt-1">{fontSize}px</div>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoErrorDiagnosis}
                  onChange={(e) => setFeature('autoErrorDiagnosis', e.target.checked)}
                  className="w-4 h-4"
                />
                <div>
                  <div className="text-sm font-medium text-white">
                    Auto Error Diagnosis
                  </div>
                  <div className="text-xs text-gray-400">
                    Automatically analyze and suggest fixes for failed commands
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={commandRiskWarning}
                  onChange={(e) => setFeature('commandRiskWarning', e.target.checked)}
                  className="w-4 h-4"
                />
                <div>
                  <div className="text-sm font-medium text-white">
                    Command Risk Warning
                  </div>
                  <div className="text-xs text-gray-400">
                    Warn about potentially dangerous commands
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSaveHistory}
                  onChange={(e) => setFeature('autoSaveHistory', e.target.checked)}
                  className="w-4 h-4"
                />
                <div>
                  <div className="text-sm font-medium text-white">
                    Auto Save History
                  </div>
                  <div className="text-xs text-gray-400">
                    Automatically save command history
                  </div>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

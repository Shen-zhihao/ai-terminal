import { useState } from 'react'
import { useSettingsStore } from '../../stores/settings-store'
import ApiConfig from './ApiConfig'
import './SettingsModal.less'

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
    <div className="settings-modal">
      <div className="settings-container">
        <div className="settings-header">
          <h2>Settings</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="settings-tabs">
          <button
            onClick={() => setActiveTab('ai')}
            className={activeTab === 'ai' ? 'active' : ''}
          >
            AI Model
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={activeTab === 'terminal' ? 'active' : ''}
          >
            Terminal
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={activeTab === 'features' ? 'active' : ''}
          >
            Features
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'ai' && <ApiConfig />}

          {activeTab === 'terminal' && (
            <div className="form-group">
              <label>Font Size</label>
              <input
                type="range"
                min="10"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
              />
              <div className="form-hint">{fontSize}px</div>
            </div>
          )}

          {activeTab === 'features' && (
            <>
              <label className="checkbox-group">
                <input
                  type="checkbox"
                  checked={autoErrorDiagnosis}
                  onChange={(e) => setFeature('autoErrorDiagnosis', e.target.checked)}
                />
                <div className="checkbox-label">
                  <div className="checkbox-label-title">Auto Error Diagnosis</div>
                  <div className="checkbox-label-desc">Automatically analyze and suggest fixes for failed commands</div>
                </div>
              </label>

              <label className="checkbox-group">
                <input
                  type="checkbox"
                  checked={commandRiskWarning}
                  onChange={(e) => setFeature('commandRiskWarning', e.target.checked)}
                />
                <div className="checkbox-label">
                  <div className="checkbox-label-title">Command Risk Warning</div>
                  <div className="checkbox-label-desc">Warn about potentially dangerous commands</div>
                </div>
              </label>

              <label className="checkbox-group">
                <input
                  type="checkbox"
                  checked={autoSaveHistory}
                  onChange={(e) => setFeature('autoSaveHistory', e.target.checked)}
                />
                <div className="checkbox-label">
                  <div className="checkbox-label-title">Auto Save History</div>
                  <div className="checkbox-label-desc">Automatically save command history</div>
                </div>
              </label>
            </>
          )}
        </div>

        <div className="settings-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

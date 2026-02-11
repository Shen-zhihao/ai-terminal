import { useState, useEffect } from 'react'
import TerminalView from './components/Terminal/TerminalView'
import ChatPanel from './components/Chat/ChatPanel'
import SettingsModal from './components/Settings/SettingsModal'
import SetupWizard from './components/Setup/SetupWizard'
import { useSettingsStore } from './stores/settings-store'
import './App.less'

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)
  const [splitRatio, setSplitRatio] = useState(0.6) // 60% terminal, 40% chat
  const theme = useSettingsStore((state) => state.theme)
  const aiProvider = useSettingsStore((state) => state.aiProvider)

  useEffect(() => {
    // 应用主题
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // 加载配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await window.electronAPI.config.get()
        if (response.success && response.data) {
          useSettingsStore.getState().loadConfig(response.data)

          // 检查是否已配置 API Key
          if (!response.data.aiProvider?.apiKey || response.data.aiProvider.apiKey.trim() === '') {
            setShowSetupWizard(true)
          }
        } else {
          // 配置不存在，显示设置向导
          setShowSetupWizard(true)
        }
      } catch (error) {
        console.error('Failed to load config:', error)
        // 加载失败也显示设置向导
        setShowSetupWizard(true)
      } finally {
        setIsLoadingConfig(false)
      }
    }
    loadConfig()
  }, [])

  const handleSetupComplete = () => {
    setShowSetupWizard(false)
  }

  // 显示加载状态
  if (isLoadingConfig) {
    return (
      <div className="loading">
        <div className="loading-content">
          <div className="loading-icon pulse">🚀</div>
          <div className="loading-text">加载中...</div>
        </div>
      </div>
    )
  }

  // 显示设置向导
  if (showSetupWizard) {
    return <SetupWizard onComplete={handleSetupComplete} />
  }

  const handleDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startRatio = splitRatio

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = (moveEvent.clientX - startX) / window.innerWidth
      const newRatio = Math.min(Math.max(startRatio + delta, 0.3), 0.8)
      setSplitRatio(newRatio)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div className="app">
      {/* 顶部工具栏 */}
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="toolbar-title">AI Terminal</h1>
          <div className="toolbar-platform">
            {window.electronAPI.platform}
          </div>
        </div>

        <div className="toolbar-actions">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="btn-settings"
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="main-content">
        {/* 终端区域 */}
        <div
          className="terminal-area"
          style={{ width: `${splitRatio * 100}%` }}
        >
          <TerminalView />
        </div>

        {/* 分割线 */}
        <div
          className="divider"
          onMouseDown={handleDrag}
        />

        {/* AI 对话区域 */}
        <div className="chat-area">
          <ChatPanel />
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="statusbar">
        <div className="statusbar-left">
          <span>Ready</span>
        </div>
        <div className="statusbar-right">
          <span>AI: {useSettingsStore.getState().aiProvider.name}</span>
          <span>Ctrl+K: Command</span>
        </div>
      </div>

      {/* 设置弹窗 */}
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  )
}

export default App

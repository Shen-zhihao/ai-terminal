import { useState, useEffect } from "react";
import TerminalArea from "./components/Terminal/TerminalArea";
import ChatPanel from "./components/Chat/ChatPanel";
import SettingsModal from "./components/Settings/SettingsModal";
import SetupWizard from "./components/Setup/SetupWizard";
import { useSettingsStore } from "./stores/settings-store";
import { useSSHStore } from "./stores/ssh-store";
import "./App.less";

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [splitRatio, setSplitRatio] = useState(0.6); // 60% 终端, 40% 对话
  const [isChatVisible, setIsChatVisible] = useState(true); // 控制聊天面板显示/隐藏
  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    // 应用主题
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true);
    window.addEventListener("open-settings", handleOpenSettings);
    return () =>
      window.removeEventListener("open-settings", handleOpenSettings);
  }, []);

  // 加载配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await window.electronAPI.config.get();
        if (response.success && response.data) {
          useSettingsStore.getState().loadConfig(response.data);

          // 检查是否已完成设置（优先使用 isSetupCompleted 标记，兼容旧版本检查 apiKey）
          const hasApiKey =
            !!response.data.aiProvider?.apiKey &&
            response.data.aiProvider.apiKey.trim() !== "";
          const isCompleted = response.data.isSetupCompleted || hasApiKey;

          if (!isCompleted) {
            setShowSetupWizard(true);
          }
        } else {
          // 配置不存在，显示设置向导
          setShowSetupWizard(true);
        }
      } catch (error) {
        console.error("加载配置失败:", error);
        // 加载失败也显示设置向导
        setShowSetupWizard(true);
      } finally {
        setIsLoadingConfig(false);
      }
    };
    loadConfig();
  }, []);

  const handleSetupComplete = () => {
    setShowSetupWizard(false);
  };

  // 显示加载状态
  if (isLoadingConfig) {
    return (
      <div className="loading">
        <div className="loading-content">
          <div className="loading-icon pulse">🚀</div>
          <div className="loading-text">加载中...</div>
        </div>
      </div>
    );
  }

  // 显示设置向导
  if (showSetupWizard) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  // 如果是跳过配置的情况，隐藏聊天面板
  const aiProvider = useSettingsStore.getState().aiProvider;
  const isAiConfigured = aiProvider?.apiKey && aiProvider.apiKey.trim() !== "";
  const shouldShowChat = isChatVisible && isAiConfigured;

  const handleDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startRatio = splitRatio;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = (moveEvent.clientX - startX) / window.innerWidth;
      const newRatio = Math.min(Math.max(startRatio + delta, 0.3), 0.8);
      setSplitRatio(newRatio);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="app">
      {/* 顶部工具栏 */}
      <div
        className={`toolbar ${
          window.electronAPI.platform === "darwin" ? "macos" : ""
        }`}
      >
        <div className="toolbar-left">
          <h1 className="toolbar-title">AI终端</h1>
        </div>

        <div className="toolbar-actions">
          <button
            onClick={() => useSSHStore.getState().setSSHModalOpen(true)}
            className="btn-settings"
          >
            SSH
          </button>
          {isAiConfigured && (
            <button
              onClick={() => setIsChatVisible(!isChatVisible)}
              className={`btn-toggle-chat ${!isChatVisible ? "active" : ""}`}
            >
              💬 {isChatVisible ? "隐藏助手" : "显示助手"}
            </button>
          )}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="btn-settings"
          >
            ⚙️ 设置
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="main-content">
        {/* 终端区域 */}
        <div
          className="terminal-area"
          style={{ width: isChatVisible ? `${splitRatio * 100}%` : "100%" }}
        >
          <TerminalArea />
        </div>

        {/* 分割线和聊天区域 - 仅在聊天可见且已配置 AI 时显示 */}
        {shouldShowChat && (
          <>
            <div className="divider" onMouseDown={handleDrag} />
            <div className="chat-area">
              <ChatPanel />
            </div>
          </>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="statusbar">
        <div className="statusbar-left">
          <span>就绪</span>
        </div>
        <div className="statusbar-right">
          <span>AI: {useSettingsStore.getState().aiProvider.name}</span>
          <span>Ctrl+K: 命令</span>
        </div>
      </div>

      {/* 设置弹窗 */}
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}

export default App;

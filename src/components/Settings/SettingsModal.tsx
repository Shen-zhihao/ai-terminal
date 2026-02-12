import { useState } from "react";
import { useSettingsStore } from "@/stores/settings-store";
import ApiConfig from "./ApiConfig";
import "./SettingsModal.less";

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<
    "ai" | "terminal" | "features" | "storage"
  >("ai");
  const [isSaving, setIsSaving] = useState(false);

  const {
    fontSize,
    setFontSize,
    autoErrorDiagnosis,
    commandRiskWarning,
    autoSaveHistory,
    setFeature,
    saveConfig,
    loadConfig,
  } = useSettingsStore();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveConfig();
      onClose();
    } catch (error: any) {
      alert(`保存设置失败：${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-modal">
      <div className="settings-container">
        <div className="settings-header">
          <h2>设置</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="settings-tabs">
          <button
            onClick={() => setActiveTab("ai")}
            className={activeTab === "ai" ? "active" : ""}
          >
            AI 模型
          </button>
          <button
            onClick={() => setActiveTab("terminal")}
            className={activeTab === "terminal" ? "active" : ""}
          >
            终端
          </button>
          <button
            onClick={() => setActiveTab("features")}
            className={activeTab === "features" ? "active" : ""}
          >
            功能
          </button>
          <button
            onClick={() => setActiveTab("storage")}
            className={activeTab === "storage" ? "active" : ""}
          >
            存储与隐私
          </button>
        </div>

        <div className="settings-content">
          {activeTab === "ai" && <ApiConfig />}

          {activeTab === "terminal" && (
            <div className="form-group">
              <label>字体大小</label>
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

          {activeTab === "features" && (
            <>
              <label className="checkbox-group">
                <input
                  type="checkbox"
                  checked={autoErrorDiagnosis}
                  onChange={(e) =>
                    setFeature("autoErrorDiagnosis", e.target.checked)
                  }
                />
                <div className="checkbox-label">
                  <div className="checkbox-label-title">自动错误诊断</div>
                  <div className="checkbox-label-desc">
                    自动分析失败的命令并给出修复建议
                  </div>
                </div>
              </label>

              <label className="checkbox-group">
                <input
                  type="checkbox"
                  checked={commandRiskWarning}
                  onChange={(e) =>
                    setFeature("commandRiskWarning", e.target.checked)
                  }
                />
                <div className="checkbox-label">
                  <div className="checkbox-label-title">命令风险警告</div>
                  <div className="checkbox-label-desc">
                    对潜在危险命令进行警告提示
                  </div>
                </div>
              </label>

              <label className="checkbox-group">
                <input
                  type="checkbox"
                  checked={autoSaveHistory}
                  onChange={(e) =>
                    setFeature("autoSaveHistory", e.target.checked)
                  }
                />
                <div className="checkbox-label">
                  <div className="checkbox-label-title">自动保存历史</div>
                  <div className="checkbox-label-desc">
                    自动保存命令执行历史记录
                  </div>
                </div>
              </label>
            </>
          )}

          {activeTab === "storage" && (
            <div className="storage-settings">
              <div className="setting-item">
                <div className="setting-info">
                  <h3>清除应用缓存</h3>
                  <p>重置所有应用设置到初始状态（不包括 SSH 配置）</p>
                </div>
                <button
                  className="btn-danger"
                  onClick={async () => {
                    if (
                      confirm("确定要重置应用吗？这将清除所有设置并重启应用。")
                    ) {
                      await window.electronAPI.config.reset();
                      window.location.reload();
                    }
                  }}
                >
                  初始化应用
                </button>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>清除 API 密钥</h3>
                  <p>移除所有保存的 AI 服务提供商 API 密钥</p>
                </div>
                <button
                  className="btn-warning"
                  onClick={async () => {
                    if (confirm("确定要清除所有 API 密钥吗？")) {
                      await window.electronAPI.config.clearApiKeys();
                      // Reload config to update UI
                      const response = await window.electronAPI.config.get();
                      if (response.success && response.data) {
                        loadConfig(response.data);
                      }
                      alert("API 密钥已清除");
                    }
                  }}
                >
                  清除 API 密钥
                </button>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>清除 SSH 配置</h3>
                  <p>移除所有保存的 SSH 主机配置</p>
                </div>
                <button
                  className="btn-warning"
                  onClick={async () => {
                    if (confirm("确定要清除所有 SSH 主机配置吗？")) {
                      await window.electronAPI.ssh.clearHosts();
                      alert("SSH 配置已清除");
                    }
                  }}
                >
                  清除 SSH 配置
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="settings-footer">
          <button className="btn-cancel" onClick={onClose}>
            取消
          </button>
          <button className="btn-save" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "保存中..." : "保存设置"}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useSettingsStore } from "@/stores/settings-store";
import ApiConfig from "./ApiConfig";
import "./SettingsModal.less";

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"ai" | "terminal" | "features">(
    "ai"
  );
  const [isSaving, setIsSaving] = useState(false);

  const {
    fontSize,
    setFontSize,
    autoErrorDiagnosis,
    commandRiskWarning,
    autoSaveHistory,
    setFeature,
    saveConfig,
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

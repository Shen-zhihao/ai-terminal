import { useState, useEffect } from "react";
import { useSSHStore } from "../../stores/ssh-store";
import SSHHostList from "./SSHHostList";
import SSHConnectForm from "./SSHConnectForm";
import type { SSHConnectOptions } from "@shared/types";
import "./SSHModal.less";

interface SSHModalProps {
  onClose: () => void;
  onConnect: (options: SSHConnectOptions) => Promise<void>;
}

export default function SSHModal({ onClose, onConnect }: SSHModalProps) {
  const { hosts, loadHosts, editingHost, setEditingHost } = useSSHStore();
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    loadHosts();
  }, [loadHosts]);

  const handleConnect = async (options: SSHConnectOptions) => {
    setIsConnecting(true);
    try {
      await onConnect(options);
      onClose();
    } catch (error: any) {
      alert(`SSH 连接失败: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="ssh-modal" onClick={onClose}>
      <div className="ssh-container" onClick={(e) => e.stopPropagation()}>
        <div className="ssh-header">
          <h2>SSH 连接</h2>
          <button className="ssh-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="ssh-body">
          <div className="ssh-host-list-panel">
            <SSHHostList
              hosts={hosts}
              selectedId={editingHost?.id}
              onSelect={setEditingHost}
              onNew={() => setEditingHost(null)}
            />
          </div>
          <div className="ssh-form-panel">
            <SSHConnectForm
              host={editingHost}
              onConnect={handleConnect}
              isConnecting={isConnecting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

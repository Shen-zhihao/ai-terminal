import { useState, useEffect } from "react";
import type {
  SSHHostConfig,
  SSHConnectOptions,
  SSHAuthMethod,
} from "@shared/types";
import { useSSHStore } from "@/stores/ssh-store";

interface SSHConnectFormProps {
  host: SSHHostConfig | null;
  onConnect: (options: SSHConnectOptions) => Promise<void>;
  isConnecting: boolean;
}

export default function SSHConnectForm({
  host,
  onConnect,
  isConnecting,
}: SSHConnectFormProps) {
  const { saveHost } = useSSHStore();

  const [name, setName] = useState("");
  const [hostname, setHostname] = useState("");
  const [port, setPort] = useState(22);
  const [username, setUsername] = useState("");
  const [authMethod, setAuthMethod] = useState<SSHAuthMethod>("password");
  const [password, setPassword] = useState("");
  const [privateKeyPath, setPrivateKeyPath] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [savePassword, setSavePassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (host) {
      setName(host.name);
      setHostname(host.host);
      setPort(host.port);
      setUsername(host.username);
      setAuthMethod(host.authMethod);
      setPassword(host.password || "");
      setPrivateKeyPath(host.privateKeyPath || "");
      setPassphrase(host.passphrase || "");
      setSavePassword(!!host.password || !!host.passphrase);
    } else {
      setName("");
      setHostname("");
      setPort(22);
      setUsername("");
      setAuthMethod("password");
      setPassword("");
      setPrivateKeyPath("");
      setPassphrase("");
      setSavePassword(false);
    }
  }, [host]);

  const handleSelectKeyFile = async () => {
    const response = await window.electronAPI.ssh.selectKeyFile();
    if (response.success && response.data) {
      setPrivateKeyPath(response.data);
    }
  };

  const handleSave = async () => {
    if (!hostname || !username) return;
    setIsSaving(true);
    try {
      const hostConfig: SSHHostConfig = {
        id: host?.id || crypto.randomUUID(),
        name: name || `${username}@${hostname}`,
        host: hostname,
        port,
        username,
        authMethod,
        privateKeyPath:
          authMethod === "privateKey" ? privateKeyPath : undefined,
        passphrase:
          authMethod === "privateKey" && savePassword ? passphrase : undefined,
        password:
          authMethod === "password" && savePassword ? password : undefined,
        createdAt: host?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveHost(hostConfig);
    } catch (error: any) {
      alert(`保存失败: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnect = async () => {
    const options: SSHConnectOptions = {
      hostId: host?.id,
      host: hostname,
      port,
      username,
      authMethod,
      password: authMethod === "password" ? password : undefined,
      privateKeyPath: authMethod === "privateKey" ? privateKeyPath : undefined,
      passphrase: authMethod === "privateKey" ? passphrase : undefined,
      cols: 80,
      rows: 24,
    };
    await onConnect(options);
  };

  const canConnect = hostname.trim() !== "" && username.trim() !== "";

  return (
    <div className="ssh-connect-form">
      <div className="form-group">
        <label>名称</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Server"
        />
      </div>

      <div className="form-group-row">
        <div className="form-group">
          <label>主机地址</label>
          <input
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            placeholder="192.168.1.1 或 example.com"
          />
        </div>
        <div className="form-group">
          <label>端口</label>
          <input
            type="number"
            value={port}
            onChange={(e) => setPort(Number(e.target.value))}
            min={1}
            max={65535}
          />
        </div>
      </div>

      <div className="form-group">
        <label>用户名</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="root"
        />
      </div>

      <div className="form-group">
        <label>认证方式</label>
        <select
          value={authMethod}
          onChange={(e) => setAuthMethod(e.target.value as SSHAuthMethod)}
        >
          <option value="password">密码</option>
          <option value="privateKey">私钥</option>
        </select>
      </div>

      {authMethod === "password" && (
        <div className="form-group">
          <label>密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入密码"
          />
        </div>
      )}

      {authMethod === "privateKey" && (
        <>
          <div className="form-group">
            <label>私钥文件</label>
            <div className="ssh-key-input">
              <input
                value={privateKeyPath}
                onChange={(e) => setPrivateKeyPath(e.target.value)}
                placeholder="~/.ssh/id_rsa"
                readOnly
              />
              <button
                className="btn-browse"
                onClick={handleSelectKeyFile}
                type="button"
              >
                浏览
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>密钥口令（可选）</label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="私钥的口令"
            />
          </div>
        </>
      )}

      <label className="checkbox-group">
        <input
          type="checkbox"
          checked={savePassword}
          onChange={(e) => setSavePassword(e.target.checked)}
        />
        <div className="checkbox-label">
          <div className="checkbox-label-title">保存凭证</div>
          <div className="checkbox-label-desc">使用系统密钥链加密存储</div>
        </div>
      </label>

      <div className="ssh-form-actions">
        <button
          className="btn-cancel"
          onClick={handleSave}
          disabled={!canConnect || isSaving}
        >
          {isSaving ? "保存中..." : "保存主机"}
        </button>
        <button
          className="btn-save"
          onClick={handleConnect}
          disabled={isConnecting || !canConnect}
        >
          {isConnecting ? "连接中..." : "连接"}
        </button>
      </div>
    </div>
  );
}

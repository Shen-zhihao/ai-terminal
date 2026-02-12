import type { SSHHostConfig } from '@shared/types'
import { useSSHStore } from '../../stores/ssh-store'

interface SSHHostListProps {
  hosts: SSHHostConfig[]
  selectedId?: string
  onSelect: (host: SSHHostConfig) => void
  onNew: () => void
}

export default function SSHHostList({
  hosts,
  selectedId,
  onSelect,
  onNew,
}: SSHHostListProps) {
  const { deleteHost } = useSSHStore()

  const handleDelete = async (e: React.MouseEvent, hostId: string) => {
    e.stopPropagation()
    if (confirm('确定删除此主机配置？')) {
      await deleteHost(hostId)
    }
  }

  return (
    <div className="ssh-host-list">
      <div className="ssh-host-list-header">
        <span>已保存主机</span>
        <button onClick={onNew} className="btn-new-host" title="新建连接">
          +
        </button>
      </div>
      <div className="ssh-host-list-items">
        {hosts.map((host) => (
          <div
            key={host.id}
            className={`ssh-host-item ${host.id === selectedId ? 'active' : ''}`}
            onClick={() => onSelect(host)}
          >
            <div className="ssh-host-item-info">
              <span className="ssh-host-name">{host.name}</span>
              <span className="ssh-host-detail">
                {host.username}@{host.host}:{host.port}
              </span>
            </div>
            <button
              className="ssh-host-delete"
              onClick={(e) => handleDelete(e, host.id)}
              title="删除"
            >
              ✕
            </button>
          </div>
        ))}
        {hosts.length === 0 && (
          <div className="ssh-host-empty">暂无保存的主机</div>
        )}
      </div>
    </div>
  )
}

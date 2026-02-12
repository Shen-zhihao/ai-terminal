import { create } from 'zustand'
import type { SSHHostConfig } from '@shared/types'

interface SSHState {
  hosts: SSHHostConfig[]
  isLoading: boolean
  isSSHModalOpen: boolean
  editingHost: SSHHostConfig | null

  loadHosts: () => Promise<void>
  saveHost: (host: SSHHostConfig) => Promise<void>
  deleteHost: (hostId: string) => Promise<void>
  setSSHModalOpen: (open: boolean) => void
  setEditingHost: (host: SSHHostConfig | null) => void
}

export const useSSHStore = create<SSHState>((set, get) => ({
  hosts: [],
  isLoading: false,
  isSSHModalOpen: false,
  editingHost: null,

  loadHosts: async () => {
    set({ isLoading: true })
    try {
      const response = await window.electronAPI.ssh.getHosts()
      if (response.success && response.data) {
        set({ hosts: response.data })
      }
    } catch (error) {
      console.error('加载 SSH 主机列表失败:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  saveHost: async (host) => {
    const response = await window.electronAPI.ssh.saveHost(host)
    if (response.success) {
      await get().loadHosts()
    } else {
      throw new Error(response.error)
    }
  },

  deleteHost: async (hostId) => {
    const response = await window.electronAPI.ssh.deleteHost(hostId)
    if (response.success) {
      await get().loadHosts()
    } else {
      throw new Error(response.error)
    }
  },

  setSSHModalOpen: (open) => set({ isSSHModalOpen: open }),
  setEditingHost: (host) => set({ editingHost: host }),
}))

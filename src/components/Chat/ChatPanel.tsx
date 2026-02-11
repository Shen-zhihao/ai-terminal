import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../../stores/chat-store'
import { useSettingsStore } from '../../stores/settings-store'
import { getAIService } from '../../services/ai-service'
import ChatMessage from './ChatMessage'
import CommandSuggestion from './CommandSuggestion'
import './ChatPanel.less'

export default function ChatPanel() {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const messages = useChatStore((state) => state.messages)
  const isLoading = useChatStore((state) => state.isLoading)
  const addMessage = useChatStore((state) => state.addMessage)
  const setLoading = useChatStore((state) => state.setLoading)
  const setError = useChatStore((state) => state.setError)

  const aiProvider = useSettingsStore((state) => state.aiProvider)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')

    addMessage({ role: 'user', content: userMessage })

    setLoading(true)
    setError(null)

    try {
      const aiService = getAIService(aiProvider)

      if (userMessage.toLowerCase().includes('explain') || userMessage.toLowerCase().includes('what does') || userMessage.includes('解释') || userMessage.includes('什么意思')) {
        const command = extractCommand(userMessage)
        if (command) {
          const explanation = await aiService.explainCommand(command)
          addMessage({ role: 'assistant', content: explanation })
        } else {
          addMessage({ role: 'assistant', content: '请提供要解释的命令。' })
        }
      } else {
        const suggestion = await aiService.generateCommand(userMessage)
        addMessage({ role: 'assistant', content: '已为你生成命令：', suggestion })
      }
    } catch (error: any) {
      setError(error.message)
      addMessage({ role: 'assistant', content: `错误：${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  const extractCommand = (text: string): string | null => {
    const match = text.match(/`([^`]+)`/)
    return match ? match[1] : null
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h2>AI 助手</h2>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-messages-empty">
            <div className="chat-messages-empty-content">
              <p>你好！我是你的 AI 终端助手。</p>
              <p>告诉我你想执行什么操作，我来帮你生成命令！</p>
              <div className="chat-messages-empty-content-examples">
                <p>示例：</p>
                <p>"查找所有大于 100MB 的文件"</p>
                <p>"解释：find . -name '*.log'"</p>
                <p>"删除所有 node_modules 文件夹"</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="chat-messages-list">
            {messages.map((message) => (
              <div key={message.id}>
                <ChatMessage message={message} />
                {message.suggestion && (
                  <div className="chat-suggestion-wrapper">
                    <CommandSuggestion suggestion={message.suggestion} />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {isLoading && (
          <div className="chat-loading">
            <div className="chat-loading-dot">●</div>
            <span>AI 思考中...</span>
          </div>
        )}
      </div>

      <div className="chat-input">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入你想执行的操作..."
            disabled={isLoading}
          />
          <button type="submit" disabled={!input.trim() || isLoading}>
            发送
          </button>
        </form>
      </div>
    </div>
  )
}

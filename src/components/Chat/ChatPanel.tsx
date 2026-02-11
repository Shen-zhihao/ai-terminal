import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../../stores/chat-store'
import { useSettingsStore } from '../../stores/settings-store'
import { getAIService } from '../../services/ai-service'
import ChatMessage from './ChatMessage'
import CommandSuggestion from './CommandSuggestion'

export default function ChatPanel() {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const messages = useChatStore((state) => state.messages)
  const isLoading = useChatStore((state) => state.isLoading)
  const addMessage = useChatStore((state) => state.addMessage)
  const setLoading = useChatStore((state) => state.setLoading)
  const setError = useChatStore((state) => state.setError)

  const aiProvider = useSettingsStore((state) => state.aiProvider)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')

    // 添加用户消息
    addMessage({
      role: 'user',
      content: userMessage,
    })

    // 发送到 AI
    setLoading(true)
    setError(null)

    try {
      // 初始化 AI 服务
      const aiService = getAIService(aiProvider)

      // 判断用户意图
      if (userMessage.toLowerCase().includes('explain') || userMessage.toLowerCase().includes('what does')) {
        // 命令解释
        const command = extractCommand(userMessage)
        if (command) {
          const explanation = await aiService.explainCommand(command)
          addMessage({
            role: 'assistant',
            content: explanation,
          })
        } else {
          addMessage({
            role: 'assistant',
            content: 'Please provide a command to explain.',
          })
        }
      } else {
        // 生成命令建议
        const suggestion = await aiService.generateCommand(userMessage)
        addMessage({
          role: 'assistant',
          content: `I'll generate a command for you:`,
          suggestion,
        })
      }
    } catch (error: any) {
      setError(error.message)
      addMessage({
        role: 'assistant',
        content: `Error: ${error.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  // 提取命令（简单实现）
  const extractCommand = (text: string): string | null => {
    const match = text.match(/`([^`]+)`/)
    return match ? match[1] : null
  }

  return (
    <div className="h-full flex flex-col">
      {/* 标题栏 */}
      <div className="h-12 bg-gray-700 border-b border-gray-600 flex items-center px-4">
        <h2 className="text-sm font-semibold text-white">AI Assistant</h2>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            <div className="text-center space-y-2">
              <p>👋 Hi! I'm your AI terminal assistant.</p>
              <p className="text-xs">Ask me to generate commands or explain them!</p>
              <div className="mt-4 text-xs text-left space-y-1">
                <p>Examples:</p>
                <p className="text-gray-500">• "Find all files larger than 100MB"</p>
                <p className="text-gray-500">• "Explain: find . -name '*.log'"</p>
                <p className="text-gray-500">• "Delete all node_modules folders"</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id}>
                <ChatMessage message={message} />
                {message.suggestion && (
                  <div className="mt-2">
                    <CommandSuggestion suggestion={message.suggestion} />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}

        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-400 text-sm">
            <div className="animate-pulse">●</div>
            <span>AI is thinking...</span>
          </div>
        )}
      </div>

      {/* 输入区 */}
      <div className="border-t border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

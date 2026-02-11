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

      if (userMessage.toLowerCase().includes('explain') || userMessage.toLowerCase().includes('what does')) {
        const command = extractCommand(userMessage)
        if (command) {
          const explanation = await aiService.explainCommand(command)
          addMessage({ role: 'assistant', content: explanation })
        } else {
          addMessage({ role: 'assistant', content: 'Please provide a command to explain.' })
        }
      } else {
        const suggestion = await aiService.generateCommand(userMessage)
        addMessage({ role: 'assistant', content: `I'll generate a command for you:`, suggestion })
      }
    } catch (error: any) {
      setError(error.message)
      addMessage({ role: 'assistant', content: `Error: ${error.message}` })
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
        <h2>AI Assistant</h2>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-messages-empty">
            <div className="chat-messages-empty-content">
              <p>Hi! I'm your AI terminal assistant.</p>
              <p>Ask me to generate commands or explain them!</p>
              <div className="chat-messages-empty-content-examples">
                <p>Examples:</p>
                <p>"Find all files larger than 100MB"</p>
                <p>"Explain: find . -name '*.log'"</p>
                <p>"Delete all node_modules folders"</p>
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
            <span>AI is thinking...</span>
          </div>
        )}
      </div>

      <div className="chat-input">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isLoading}
          />
          <button type="submit" disabled={!input.trim() || isLoading}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

import type { Message } from '@shared/types'

interface ChatMessageProps {
  message: Message & { timestamp: Date }
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`chat-message ${isUser ? 'chat-message-user' : 'chat-message-assistant'}`}>
      <div className={`chat-message-bubble ${isUser ? 'chat-message-bubble-user' : 'chat-message-bubble-assistant'}`}>
        <div className="chat-message-content">
          {message.content}
        </div>
        <div className="chat-message-time">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}

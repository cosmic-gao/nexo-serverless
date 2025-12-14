import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Sparkles, Copy, CheckCircle2 } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatPanelProps {
  onSendMessage?: (message: string) => Promise<void>
  isLoading?: boolean
  messages?: Message[]
  onMessageSubmit?: (message: string) => void
}

export default function ChatPanel({
  onSendMessage,
  isLoading = false,
  messages = [],
  onMessageSubmit,
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const [localMessages, setLocalMessages] = useState<Message[]>(messages)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [localMessages])

  // 同步外部消息
  useEffect(() => {
    setLocalMessages(messages)
  }, [messages])

  // 自动调整 textarea 高度
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setLocalMessages(prev => [...prev, userMessage])
    setInput('')

    if (onMessageSubmit) {
      onMessageSubmit(input)
    }

    if (onSendMessage) {
      try {
        await onSendMessage(input)
      } catch (error) {
        console.error('Failed to send message:', error)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex flex-col h-full bg-surface-900/50 rounded-xl border border-surface-700">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-700 bg-gradient-to-r from-nexo-500/10 to-transparent">
        <Sparkles className="w-4 h-4 text-nexo-400" />
        <h3 className="text-sm font-semibold text-white">AI 助手</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {localMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-surface-600" />
              <p className="text-surface-500 text-sm">开始与 AI 对话</p>
              <p className="text-surface-600 text-xs mt-1">描述您想要的功能或设计</p>
            </div>
          </div>
        ) : (
          <>
            {localMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-nexo-500/20 border border-nexo-500/30 text-white'
                      : 'bg-surface-800 border border-surface-700 text-surface-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <span className="text-xs text-surface-500">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {message.role === 'assistant' && (
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="text-surface-500 hover:text-white transition-colors"
                        title="复制"
                      >
                        {copiedId === message.id ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-surface-800 border border-surface-700 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-nexo-400" />
                    <span className="text-sm text-surface-400">AI 正在思考...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-surface-700 p-3 bg-surface-900/30">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入您的需求... (Shift+Enter 换行)"
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-white placeholder-surface-500 focus:outline-none focus:border-nexo-500 resize-none max-h-28 disabled:opacity-50"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="flex items-center justify-center w-10 h-10 bg-nexo-500 hover:bg-nexo-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="发送 (Enter)"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}


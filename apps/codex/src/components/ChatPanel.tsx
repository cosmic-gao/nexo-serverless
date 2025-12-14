import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Copy, CheckCircle2, Bot, Mic } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface QuickPrompt {
  icon: string
  label: string
  prompt: string
  gradient?: string
  projectType?: 'html' | 'react' | 'vue'
}

interface ChatPanelProps {
  onSendMessage?: (message: string) => Promise<void>
  isLoading?: boolean
  messages?: Message[]
  onMessageSubmit?: (message: string) => void
  quickPrompts?: QuickPrompt[]
  onQuickPromptClick?: (prompt: string, projectType?: 'html' | 'react' | 'vue') => Promise<void>
}

export default function ChatPanel({
  onSendMessage,
  isLoading = false,
  messages = [],
  onMessageSubmit,
  quickPrompts = [],
  onQuickPromptClick,
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
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 rounded-xl overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {localMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto px-4">
            {/* 热门问答 */}
            {quickPrompts.length > 0 && (
              <div className="w-full">
                <h3 className="text-gray-800 font-bold text-sm mb-3 text-center">✨ 热门问答</h3>
                <div className="relative overflow-hidden h-7">
                  <div className="flex animate-scroll" style={{ width: 'max-content' }}>
                    {/* 第一组卡片 */}
                    {quickPrompts.map((item, index) => {
                      const gapVariations = [1.5, 2.5, 2, 1.75, 2.25, 1.5] // 错落的间距
                      const gap = gapVariations[index % gapVariations.length]
                      return (
                        <button
                          key={`first-${item.label}-${index}`}
                          onClick={async () => {
                            if (onQuickPromptClick) {
                              await onQuickPromptClick(item.prompt, item.projectType)
                            } else {
                              setInput(item.prompt)
                              setTimeout(() => {
                                inputRef.current?.focus()
                              }, 100)
                            }
                          }}
                          className="group relative px-2 py-1 bg-white hover:bg-gray-50 border border-gray-200 hover:border-blue-300 rounded-md text-left transition-all duration-200 shadow-sm hover:shadow flex-shrink-0 whitespace-nowrap"
                          style={{
                            marginRight: `${gap * 0.25}rem`
                          }}
                        >
                          <div className="flex items-center gap-1.5">
                            <div className="flex-shrink-0 w-4 h-4 rounded bg-gray-100 flex items-center justify-center text-[9px]">
                              {item.icon}
                            </div>
                            <div className="text-[9px] font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                              {item.label}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                    {/* 第二组卡片（用于无缝循环） */}
                    {quickPrompts.map((item, index) => {
                      const gapVariations = [1.5, 2.5, 2, 1.75, 2.25, 1.5] // 错落的间距
                      const gap = gapVariations[index % gapVariations.length]
                      return (
                        <button
                          key={`second-${item.label}-${index}`}
                          onClick={async () => {
                            if (onQuickPromptClick) {
                              await onQuickPromptClick(item.prompt, item.projectType)
                            } else {
                              setInput(item.prompt)
                              setTimeout(() => {
                                inputRef.current?.focus()
                              }, 100)
                            }
                          }}
                          className="group relative px-2 py-1 bg-white hover:bg-gray-50 border border-gray-200 hover:border-blue-300 rounded-md text-left transition-all duration-200 shadow-sm hover:shadow flex-shrink-0 whitespace-nowrap"
                          style={{
                            marginRight: `${gap * 0.25}rem`
                          }}
                        >
                          <div className="flex items-center gap-1.5">
                            <div className="flex-shrink-0 w-4 h-4 rounded bg-gray-100 flex items-center justify-center text-[9px]">
                              {item.icon}
                            </div>
                            <div className="text-[9px] font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                              {item.label}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {localMessages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-xs lg:max-w-md xl:max-w-2xl px-4 py-3 rounded-2xl transition-all ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg'
                      : 'bg-white border border-gray-200 text-gray-800 shadow-sm hover:shadow-md'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <div className="flex items-center justify-between mt-2.5 gap-2">
                    <span className={`text-xs ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {message.role === 'assistant' && (
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-all p-1 rounded"
                        title="复制"
                      >
                        {copiedId === message.id ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                    <span className="text-white text-xs font-semibold">我</span>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-sm text-gray-600">AI 正在思考...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200/50 p-2 bg-white/90 backdrop-blur-sm">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-lg shadow-sm hover:shadow transition-all border border-gray-200/60">
          {/* 麦克风图标 */}
          <button
            type="button"
            className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-md transition-all flex-shrink-0"
            title="语音输入"
          >
            <Mic className="w-3.5 h-3.5" />
          </button>

          {/* 文本输入 */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            disabled={isLoading}
            className="flex-1 min-w-0 px-1.5 py-0.5 bg-transparent text-xs text-gray-800 placeholder-gray-400 focus:outline-none resize-none disabled:opacity-50 transition-all leading-tight"
            rows={1}
            style={{ height: '18px', lineHeight: '18px', overflow: 'hidden' }}
          />

          {/* 发送图标 */}
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className={`flex items-center justify-center w-6 h-6 rounded-md transition-all flex-shrink-0 ${
              input.trim() && !isLoading
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-sm hover:scale-105 active:scale-95'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title="发送 (Enter)"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Send className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* 自动滚动动画样式 */}
      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-50% - 0.5rem));
          }
        }
        .animate-scroll {
          animation: scroll 25s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}


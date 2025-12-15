import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Copy, CheckCircle2, Bot, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

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

  const getProjectTypeBadge = (projectType?: 'html' | 'react' | 'vue') => {
    if (!projectType) return null
    const variants = {
      html: { variant: 'warning' as const, label: 'HTML' },
      react: { variant: 'default' as const, label: 'React' },
      vue: { variant: 'success' as const, label: 'Vue' },
    }
    const config = variants[projectType]
    return <Badge variant={config.variant} className="text-[9px] px-1.5 py-0">{config.label}</Badge>
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50/80 via-purple-50/60 to-blue-50/80 rounded-xl overflow-hidden border border-white/60 shadow-inner">
      {/* 热门问答标题 - 放在 ScrollArea 外面，直接基于父容器宽度居中 */}
      {localMessages.length === 0 && quickPrompts.length > 0 && (
        <div className="flex-shrink-0 pt-[calc(33%-20px)] pb-3">
          <h3 className="text-gray-700 font-bold text-sm text-center whitespace-nowrap">
            <span className="text-lg mr-2">✨</span>
            <span>热门问答</span>
          </h3>
        </div>
      )}
      {/* Messages Area */}
      <ScrollArea className="flex-1">
        {localMessages.length === 0 ? (
          <div className="flex flex-col w-full">
            {/* 热门问答卡片 */}
            {quickPrompts.length > 0 && (
              <div className="w-full">
                {/* 两行错落布局容器 */}
                <div className="space-y-2 pb-2">
                  {/* 第一行 - 从左开始 */}
                  <div className="relative overflow-hidden h-10 py-1">
                    <div className="flex animate-scroll" style={{ width: 'max-content' }}>
                      {/* 第一行的卡片 - 偶数索引 */}
                      {quickPrompts.filter((_, i) => i % 2 === 0).map((item, index) => {
                        const gapVariations = [2, 3, 2.5, 1.75, 2.25]
                        const gap = gapVariations[index % gapVariations.length]
                        return (
                          <Card
                            key={`row1-first-${item.label}-${index}`}
                            onClick={async () => {
                              if (onQuickPromptClick) {
                                await onQuickPromptClick(item.prompt, item.projectType)
                              } else {
                                setInput(item.prompt)
                                setTimeout(() => inputRef.current?.focus(), 100)
                              }
                            }}
                            className="group cursor-pointer px-2.5 py-1.5 bg-white/90 hover:bg-white border-gray-200/80 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex-shrink-0 whitespace-nowrap"
                            style={{ marginRight: `${gap * 0.25}rem` }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 w-5 h-5 rounded-md bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-xs border border-gray-200/60">
                                {item.icon}
                              </div>
                              <span className="text-[10px] font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                                {item.label}
                              </span>
                              {getProjectTypeBadge(item.projectType)}
                            </div>
                          </Card>
                        )
                      })}
                      {/* 无缝循环的复制 */}
                      {quickPrompts.filter((_, i) => i % 2 === 0).map((item, index) => {
                        const gapVariations = [2, 3, 2.5, 1.75, 2.25]
                        const gap = gapVariations[index % gapVariations.length]
                        return (
                          <Card
                            key={`row1-second-${item.label}-${index}`}
                            onClick={async () => {
                              if (onQuickPromptClick) {
                                await onQuickPromptClick(item.prompt, item.projectType)
                              } else {
                                setInput(item.prompt)
                                setTimeout(() => inputRef.current?.focus(), 100)
                              }
                            }}
                            className="group cursor-pointer px-2.5 py-1.5 bg-white/90 hover:bg-white border-gray-200/80 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex-shrink-0 whitespace-nowrap"
                            style={{ marginRight: `${gap * 0.25}rem` }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 w-5 h-5 rounded-md bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-xs border border-gray-200/60">
                                {item.icon}
                              </div>
                              <span className="text-[10px] font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                                {item.label}
                              </span>
                              {getProjectTypeBadge(item.projectType)}
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                  {/* 第二行 - 错落偏移，反向滚动 */}
                  <div className="relative overflow-hidden h-10 py-1">
                    <div className="flex animate-scroll-reverse" style={{ width: 'max-content' }}>
                      {/* 第二行的卡片 - 奇数索引 */}
                      {quickPrompts.filter((_, i) => i % 2 === 1).map((item, index) => {
                        const gapVariations = [2.5, 1.75, 3, 2, 2.25]
                        const gap = gapVariations[index % gapVariations.length]
                        return (
                          <Card
                            key={`row2-first-${item.label}-${index}`}
                            onClick={async () => {
                              if (onQuickPromptClick) {
                                await onQuickPromptClick(item.prompt, item.projectType)
                              } else {
                                setInput(item.prompt)
                                setTimeout(() => inputRef.current?.focus(), 100)
                              }
                            }}
                            className="group cursor-pointer px-2.5 py-1.5 bg-white/90 hover:bg-white border-gray-200/80 hover:border-purple-300 hover:shadow-md transition-all duration-200 flex-shrink-0 whitespace-nowrap"
                            style={{ marginRight: `${gap * 0.25}rem` }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 w-5 h-5 rounded-md bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center text-xs border border-purple-200/60">
                                {item.icon}
                              </div>
                              <span className="text-[10px] font-medium text-gray-700 group-hover:text-purple-600 transition-colors">
                                {item.label}
                              </span>
                              {getProjectTypeBadge(item.projectType)}
                            </div>
                          </Card>
                        )
                      })}
                      {/* 无缝循环的复制 */}
                      {quickPrompts.filter((_, i) => i % 2 === 1).map((item, index) => {
                        const gapVariations = [2.5, 1.75, 3, 2, 2.25]
                        const gap = gapVariations[index % gapVariations.length]
                        return (
                          <Card
                            key={`row2-second-${item.label}-${index}`}
                            onClick={async () => {
                              if (onQuickPromptClick) {
                                await onQuickPromptClick(item.prompt, item.projectType)
                              } else {
                                setInput(item.prompt)
                                setTimeout(() => inputRef.current?.focus(), 100)
                              }
                            }}
                            className="group cursor-pointer px-2.5 py-1.5 bg-white/90 hover:bg-white border-gray-200/80 hover:border-purple-300 hover:shadow-md transition-all duration-200 flex-shrink-0 whitespace-nowrap"
                            style={{ marginRight: `${gap * 0.25}rem` }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 w-5 h-5 rounded-md bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center text-xs border border-purple-200/60">
                                {item.icon}
                              </div>
                              <span className="text-[10px] font-medium text-gray-700 group-hover:text-purple-600 transition-colors">
                                {item.label}
                              </span>
                              {getProjectTypeBadge(item.projectType)}
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {localMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2.5 group",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600">
                      <Bot className="w-4 h-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <Card
                  className={cn(
                    "max-w-[80%] px-3 py-2.5 transition-all",
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-400 shadow-md hover:shadow-lg'
                      : 'bg-white/95 border-gray-200/80 text-gray-800 shadow-sm hover:shadow-md'
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <span className={cn(
                      "text-[10px]",
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                    )}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {message.role === 'assistant' && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 text-gray-400 hover:text-blue-600"
                      >
                        {copiedId === message.id ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </Card>
                {message.role === 'user' && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600">
                      我
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-start gap-2.5">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600">
                    <Bot className="w-4 h-4 text-white" />
                  </AvatarFallback>
                </Avatar>
                <Card className="bg-white/95 border-gray-200/80 px-3 py-2.5 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-sm text-gray-600">AI 正在思考...</span>
                  </div>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-gray-200/60 p-2.5 bg-white/80 backdrop-blur-sm">
        <Card className="flex items-center gap-2 px-3 py-2 bg-white border-gray-200/80 shadow-sm hover:shadow transition-all focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
          {/* 麦克风图标 */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 flex-shrink-0"
          >
            <Mic className="w-4 h-4" />
          </Button>

          {/* 文本输入 */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            disabled={isLoading}
            className="flex-1 min-w-0 px-1 py-0.5 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none resize-none disabled:opacity-50 transition-all leading-tight"
            rows={1}
            style={{ height: '22px', lineHeight: '22px', overflow: 'hidden' }}
          />

          {/* 发送按钮 */}
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="icon-sm"
            className={cn(
              "flex-shrink-0 transition-all",
              input.trim() && !isLoading
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100'
            )}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </Button>
        </Card>
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
        @keyframes scroll-reverse {
          0% {
            transform: translateX(calc(-50% - 0.5rem));
          }
          100% {
            transform: translateX(0);
          }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
        .animate-scroll-reverse {
          animation: scroll-reverse 35s linear infinite;
        }
        .animate-scroll-reverse:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}

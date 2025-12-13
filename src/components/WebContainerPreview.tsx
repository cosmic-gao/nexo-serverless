import { useEffect, useRef, useState, useCallback } from 'react'
import { 
  Play, 
  RefreshCw, 
  Terminal, 
  Loader2, 
  Maximize2,
  Minimize2,
  XCircle,
  CheckCircle2,
  Square,
  AlertTriangle
} from 'lucide-react'
import { ProjectFile, ProjectType } from '../lib/projectTemplates'
import { 
  runViteProject, 
  WebContainerStatus,
  filesToFileSystemTree,
  getWebContainer
} from '../lib/webcontainer'

interface WebContainerPreviewProps {
  files: ProjectFile[]
  projectType: ProjectType
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

export default function WebContainerPreview({
  files,
  projectType,
  isFullscreen = false,
  onToggleFullscreen,
}: WebContainerPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const stopFnRef = useRef<(() => void) | null>(null)
  const hasStartedRef = useRef(false)
  
  const [status, setStatus] = useState<WebContainerStatus>({ 
    state: 'idle', 
    message: '点击运行按钮启动预览' 
  })
  const [logs, setLogs] = useState<string[]>([])
  const [showLogs, setShowLogs] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev.slice(-200), `[${timestamp}] ${message}`]) // 保留最近200条
  }, [])

  // 清理函数
  useEffect(() => {
    return () => {
      if (stopFnRef.current) {
        stopFnRef.current()
        stopFnRef.current = null
      }
    }
  }, [])

  // HTML 项目直接渲染
  const renderHtmlPreview = useCallback(() => {
    if (projectType !== 'html') return

    setStatus({ state: 'ready', message: 'HTML 预览已加载' })
    addLog('正在加载 HTML 预览...')

    const htmlFile = files.find(f => f.path === 'index.html')
    const cssFile = files.find(f => f.path === 'style.css')
    const jsFile = files.find(f => f.path === 'main.js')

    if (!htmlFile) {
      setStatus({ state: 'error', message: '找不到 index.html 文件' })
      return
    }

    let html = htmlFile.content
    
    if (cssFile) {
      html = html.replace(
        /<link[^>]*href=["']style\.css["'][^>]*>/gi,
        `<style>${cssFile.content}</style>`
      )
    }

    if (jsFile) {
      html = html.replace(
        /<script[^>]*src=["']main\.js["'][^>]*><\/script>/gi,
        `<script>${jsFile.content}</script>`
      )
    }

    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(html)
        doc.close()
      }
    }

    addLog('HTML 预览加载完成')
  }, [files, projectType, addLog])

  // 启动 Vite 项目
  const startViteProject = useCallback(async () => {
    if (projectType === 'html') {
      renderHtmlPreview()
      return
    }

    if (files.length === 0) {
      setStatus({ state: 'idle', message: '没有文件可预览' })
      return
    }

    // 停止之前的进程
    if (stopFnRef.current) {
      stopFnRef.current()
      stopFnRef.current = null
    }

    setPreviewUrl(null)
    setLogs([])
    hasStartedRef.current = true

    try {
      const result = await runViteProject(
        files,
        projectType,
        setStatus,
        addLog
      )

      setPreviewUrl(result.url)
      stopFnRef.current = result.stop

      // 设置 iframe src
      if (iframeRef.current) {
        iframeRef.current.src = result.url
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '启动失败'
      setStatus({ state: 'error', message })
      addLog(`[Error] ${message}`)
    }
  }, [files, projectType, addLog, renderHtmlPreview])

  // 停止服务器
  const stopServer = useCallback(() => {
    if (stopFnRef.current) {
      addLog('[System] 停止开发服务器...')
      stopFnRef.current()
      stopFnRef.current = null
      setStatus({ state: 'idle', message: '服务器已停止' })
      setPreviewUrl(null)
      if (iframeRef.current) {
        iframeRef.current.src = 'about:blank'
      }
    }
  }, [addLog])

  // 刷新预览
  const refresh = useCallback(() => {
    if (projectType === 'html') {
      renderHtmlPreview()
    } else if (previewUrl && iframeRef.current) {
      iframeRef.current.src = previewUrl
      addLog('[System] 刷新预览')
    }
  }, [projectType, previewUrl, renderHtmlPreview, addLog])

  // 热更新 - 当文件变化时更新
  useEffect(() => {
    const updateFiles = async () => {
      if (status.state !== 'ready' || projectType === 'html') return
      
      try {
        const container = await getWebContainer()
        const tree = filesToFileSystemTree(files)
        await container.mount(tree)
        addLog('[HMR] 文件已更新')
      } catch (e) {
        // 忽略更新错误
      }
    }

    // 防抖
    const timer = setTimeout(updateFiles, 500)
    return () => clearTimeout(timer)
  }, [files, status.state, projectType, addLog])

  // HTML 项目自动预览
  useEffect(() => {
    if (projectType === 'html' && files.length > 0) {
      renderHtmlPreview()
    }
  }, [files, projectType, renderHtmlPreview])

  const getStatusIcon = () => {
    switch (status.state) {
      case 'ready':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />
      case 'booting':
      case 'installing':
      case 'starting':
        return <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
      default:
        return <AlertTriangle className="w-4 h-4 text-surface-400" />
    }
  }

  const getStatusColor = () => {
    switch (status.state) {
      case 'ready': return 'text-green-400'
      case 'error': return 'text-red-400'
      case 'booting':
      case 'installing':
      case 'starting': return 'text-yellow-400'
      default: return 'text-surface-400'
    }
  }

  const isRunning = status.state === 'booting' || status.state === 'installing' || status.state === 'starting'
  const canStop = status.state === 'ready' && projectType !== 'html'

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-surface-950' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700 bg-surface-900/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={`text-sm ${getStatusColor()}`}>{status.message}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 运行/停止按钮 */}
          {projectType !== 'html' && (
            <>
              {canStop ? (
                <button
                  onClick={stopServer}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded-lg transition-colors"
                >
                  <Square className="w-3.5 h-3.5" />
                  停止
                </button>
              ) : (
                <button
                  onClick={startViteProject}
                  disabled={isRunning || files.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-nexo-500 hover:bg-nexo-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  {isRunning ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  {isRunning ? '启动中...' : '运行'}
                </button>
              )}
            </>
          )}

          {/* 日志按钮 */}
          <button
            onClick={() => setShowLogs(!showLogs)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm transition-colors ${
              showLogs ? 'bg-surface-700 text-white' : 'text-surface-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            日志
            {logs.length > 0 && (
              <span className="px-1.5 py-0.5 bg-surface-600 text-xs rounded">
                {logs.length}
              </span>
            )}
          </button>

          {/* 刷新按钮 */}
          <button
            onClick={refresh}
            disabled={isRunning}
            className="p-1.5 hover:bg-surface-700 rounded-lg transition-colors text-surface-400 hover:text-white disabled:opacity-50"
            title="刷新预览"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* 全屏按钮 */}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 hover:bg-surface-700 rounded-lg transition-colors text-surface-400 hover:text-white"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Preview iframe */}
        <iframe
          ref={iframeRef}
          title="Preview"
          className="w-full h-full border-0 bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads"
          allow="cross-origin-isolated"
        />

        {/* 空状态 */}
        {files.length === 0 && (
          <div className="absolute inset-0 bg-surface-900 flex items-center justify-center">
            <div className="text-center text-surface-500">
              <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>在左侧输入描述后</p>
              <p>预览将在这里显示</p>
            </div>
          </div>
        )}

        {/* 未启动提示 (Vite 项目) */}
        {projectType !== 'html' && files.length > 0 && status.state === 'idle' && !hasStartedRef.current && (
          <div className="absolute inset-0 bg-surface-900/95 flex items-center justify-center">
            <div className="text-center p-8 max-w-md">
              <div className="w-20 h-20 rounded-2xl bg-nexo-500/20 flex items-center justify-center mx-auto mb-6">
                <Play className="w-10 h-10 text-nexo-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {projectType === 'react' ? 'React' : 'Vue'} 项目已就绪
              </h3>
              <p className="text-surface-400 mb-6">
                点击"运行"按钮启动 Vite 开发服务器，在浏览器中预览您的项目。
                首次启动需要安装依赖，可能需要 30-60 秒。
              </p>
              <button
                onClick={startViteProject}
                className="px-8 py-3 bg-nexo-500 hover:bg-nexo-600 text-white font-medium rounded-xl transition-all duration-200 glow-green hover:glow-green-intense"
              >
                <span className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  启动预览
                </span>
              </button>
              <p className="text-surface-500 text-sm mt-4">
                使用 WebContainers 技术在浏览器中运行 Node.js
              </p>
            </div>
          </div>
        )}

        {/* 加载状态遮罩 */}
        {isRunning && (
          <div className="absolute inset-0 bg-surface-900/90 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-nexo-400 animate-spin mx-auto mb-4" />
              <p className="text-white font-medium mb-2">{status.message}</p>
              <p className="text-surface-400 text-sm">
                {status.state === 'booting' && '正在初始化 WebContainer 环境...'}
                {status.state === 'installing' && '正在安装 npm 依赖，请稍候...'}
                {status.state === 'starting' && '正在启动 Vite 开发服务器...'}
              </p>
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {status.state === 'error' && (
          <div className="absolute inset-0 bg-surface-900/95 flex items-center justify-center">
            <div className="text-center p-6 max-w-md">
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">预览出错</h3>
              <p className="text-surface-400 mb-4">{status.message}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowLogs(true)}
                  className="px-4 py-2 glass hover:bg-surface-700 text-white rounded-lg transition-colors"
                >
                  查看日志
                </button>
                <button
                  onClick={startViteProject}
                  className="px-4 py-2 bg-nexo-500 hover:bg-nexo-600 text-white rounded-lg transition-colors"
                >
                  重试
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 日志面板 */}
        {showLogs && (
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-surface-950 border-t border-surface-700 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-surface-800">
              <span className="text-sm text-surface-300 font-medium">控制台日志</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLogs([])}
                  className="text-xs text-surface-500 hover:text-white"
                >
                  清空
                </button>
                <button
                  onClick={() => setShowLogs(false)}
                  className="text-surface-500 hover:text-white text-lg leading-none"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-surface-500">暂无日志</div>
              ) : (
                logs.map((log, i) => (
                  <div 
                    key={i} 
                    className={`mb-1 ${
                      log.includes('[Error]') ? 'text-red-400' :
                      log.includes('[vite]') ? 'text-cyan-400' :
                      log.includes('[npm]') ? 'text-yellow-400' :
                      log.includes('[HMR]') ? 'text-green-400' :
                      'text-surface-400'
                    }`}
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

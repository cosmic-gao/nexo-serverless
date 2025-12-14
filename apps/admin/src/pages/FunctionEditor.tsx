import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  Code2, 
  Save, 
  Play, 
  ArrowLeft,
  Settings,
  Terminal,
  Clock,
  MemoryStick,
  Zap,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react'
import { api, CreateFunctionRequest, InvokeResult } from '../lib/api'

const DEFAULT_CODE = `// Nexo Serverless Function
// 
// handler 函数会在每次请求时被调用
// request 包含: url, method, headers, body, json()
// env 包含环境变量

function handler(request, { env }) {
  // 获取请求数据
  const data = request.json();
  
  // 返回响应
  return {
    message: "Hello from Nexo Serverless! 🚀",
    timestamp: new Date().toISOString(),
    received: data
  };
}
`

export default function FunctionEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [invoking, setInvoking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [functionLoaded, setFunctionLoaded] = useState(isNew)

  // Form state
  const [name, setName] = useState('')
  const [code, setCode] = useState(DEFAULT_CODE)
  const [route, setRoute] = useState('/api/hello')
  const [methods, setMethods] = useState<string[]>(['GET', 'POST'])
  const [maxExecutionTime, setMaxExecutionTime] = useState(50)
  const [maxMemory, setMaxMemory] = useState(128)
  const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([])

  // Test panel state
  const [testBody, setTestBody] = useState('{\n  "name": "World"\n}')
  const [testResult, setTestResult] = useState<InvokeResult | null>(null)
  const [testError, setTestError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (!isNew && id) {
      loadFunction(id)
    }
  }, [id, isNew])

  const loadFunction = async (functionId: string) => {
    setLoading(true)
    setFunctionLoaded(false)
    const res = await api.getFunction(functionId)
    if (res.success && res.data) {
      const fn = res.data
      setName(fn.name)
      setCode(fn.code || DEFAULT_CODE)
      setRoute(fn.route)
      setMethods(fn.methods)
      if (fn.limits) {
        setMaxExecutionTime(fn.limits.max_execution_time_ms)
        setMaxMemory(fn.limits.max_memory_mb)
      }
      setEnvVars(Object.entries(fn.env || {}).map(([key, value]) => ({ key, value: String(value) })))
      setFunctionLoaded(true)
    } else {
      console.error('Failed to load function:', res.error)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert('请输入函数名称')
      return
    }
    if (!route.trim()) {
      alert('请输入路由路径')
      return
    }

    setSaving(true)
    
    const envObj = envVars.reduce((acc, { key, value }) => {
      if (key.trim()) {
        acc[key.trim()] = value
      }
      return acc
    }, {} as Record<string, string>)

    const data: CreateFunctionRequest = {
      name: name.trim(),
      code,
      route: route.trim(),
      methods,
      env: envObj,
      limits: {
        max_execution_time_ms: maxExecutionTime,
        max_memory_mb: maxMemory,
        max_request_body_kb: 1024,
      },
    }

    try {
      const res = isNew 
        ? await api.createFunction(data)
        : await api.updateFunction(id!, data)

      setSaving(false)

      if (res.success && res.data) {
        if (isNew && res.data.id) {
          // 等待一下确保后端已保存
          await new Promise(resolve => setTimeout(resolve, 200))
          setFunctionLoaded(true)
          navigate(`/functions/${res.data.id}`, { replace: true })
        } else {
          // 更新现有函数后，重新加载以确保数据同步
          if (id) {
            await loadFunction(id)
          }
        }
      } else {
        alert(res.error || '保存失败')
      }
    } catch (err) {
      setSaving(false)
      alert(err instanceof Error ? err.message : '保存失败')
    }
  }

  const handleInvoke = async () => {
    if (isNew || !id || !functionLoaded) {
      alert('请先保存函数')
      return
    }

    setInvoking(true)
    setTestResult(null)
    setTestError(null)

    try {
      const body = testBody.trim() ? JSON.parse(testBody) : null
      const res = await api.invokeFunction(id, body)
      
      if (res.success && res.data) {
        setTestResult(res.data as InvokeResult)
      } else {
        setTestError(res.error || '调用失败')
      }
    } catch (err) {
      setTestError(err instanceof Error ? err.message : '调用失败')
    }

    setInvoking(false)
  }

  const toggleMethod = (method: string) => {
    if (methods.includes(method)) {
      setMethods(methods.filter(m => m !== method))
    } else {
      setMethods([...methods, method])
    }
  }

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }])
  }

  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...envVars]
    updated[index][field] = value
    setEnvVars(updated)
  }

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index))
  }

  const copyEndpoint = () => {
    const endpoint = `http://localhost:3000/fn${route}`
    navigator.clipboard.writeText(endpoint)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="pt-24 pb-20 min-h-screen flex items-center justify-center">
        <div className="text-surface-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link 
              to="/functions"
              className="p-2 hover:bg-surface-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-surface-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {isNew ? '新建函数' : '编辑函数'}
              </h1>
              {!isNew && (
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm font-mono text-nexo-400">{route}</code>
                  <button 
                    onClick={copyEndpoint}
                    className="p-1 hover:bg-surface-700 rounded transition-colors"
                  >
                    {copied ? (
                      <Check className="w-3 h-3 text-nexo-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-surface-500" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showSettings 
                  ? 'bg-surface-700 text-white' 
                  : 'glass text-surface-300 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              设置
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-nexo-500 hover:bg-nexo-600 text-white font-medium rounded-lg transition-all duration-200 glow-green hover:glow-green-intense disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Name & Route */}
            <div className="glass rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">
                    函数名称
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="my-function"
                    className="w-full px-4 py-3 bg-surface-900/50 rounded-lg text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-nexo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">
                    路由路径
                  </label>
                  <input
                    type="text"
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                    placeholder="/api/hello"
                    className="w-full px-4 py-3 bg-surface-900/50 rounded-lg text-white font-mono placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-nexo-500/50"
                  />
                </div>
              </div>

              {/* HTTP Methods */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-surface-300 mb-2">
                  允许的 HTTP 方法
                </label>
                <div className="flex flex-wrap gap-2">
                  {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((method) => (
                    <button
                      key={method}
                      onClick={() => toggleMethod(method)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        methods.includes(method)
                          ? method === 'GET' ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50' :
                            method === 'POST' ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/50' :
                            method === 'PUT' ? 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/50' :
                            method === 'DELETE' ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50' :
                            'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/50'
                          : 'bg-surface-800 text-surface-500 hover:text-surface-300'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Code Editor */}
            <div className="glass rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-nexo-400" />
                  <span className="text-sm font-medium text-white">代码编辑器</span>
                </div>
                <span className="text-xs text-surface-500">JavaScript / TypeScript</span>
              </div>
              <div className="relative">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck={false}
                  className="w-full h-[500px] p-4 bg-surface-950 text-surface-200 font-mono text-sm resize-none focus:outline-none"
                  style={{ tabSize: 2 }}
                />
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="glass rounded-xl p-6 space-y-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-nexo-400" />
                  函数配置
                </h3>

                {/* Limits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-surface-300 mb-2">
                      <Clock className="w-4 h-4" />
                      最大执行时间 (ms)
                    </label>
                    <input
                      type="number"
                      value={maxExecutionTime}
                      onChange={(e) => setMaxExecutionTime(Number(e.target.value))}
                      min={10}
                      max={30000}
                      className="w-full px-4 py-3 bg-surface-900/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-nexo-500/50"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-surface-300 mb-2">
                      <MemoryStick className="w-4 h-4" />
                      最大内存 (MB)
                    </label>
                    <input
                      type="number"
                      value={maxMemory}
                      onChange={(e) => setMaxMemory(Number(e.target.value))}
                      min={32}
                      max={512}
                      className="w-full px-4 py-3 bg-surface-900/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-nexo-500/50"
                    />
                  </div>
                </div>

                {/* Environment Variables */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-surface-300">
                      环境变量
                    </label>
                    <button
                      onClick={addEnvVar}
                      className="text-xs text-nexo-400 hover:text-nexo-300"
                    >
                      + 添加变量
                    </button>
                  </div>
                  
                  {envVars.length === 0 ? (
                    <p className="text-sm text-surface-500">暂无环境变量</p>
                  ) : (
                    <div className="space-y-2">
                      {envVars.map((envVar, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={envVar.key}
                            onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                            placeholder="KEY"
                            className="flex-1 px-3 py-2 bg-surface-900/50 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-nexo-500/50"
                          />
                          <input
                            type="text"
                            value={envVar.value}
                            onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                            placeholder="value"
                            className="flex-1 px-3 py-2 bg-surface-900/50 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-nexo-500/50"
                          />
                          <button
                            onClick={() => removeEnvVar(index)}
                            className="px-3 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Test Panel */}
          <div className="space-y-6">
            <div className="glass rounded-xl overflow-hidden sticky top-24">
              <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-nexo-400" />
                  <span className="text-sm font-medium text-white">测试</span>
                </div>
                <button
                  onClick={handleInvoke}
                  disabled={invoking || isNew || !functionLoaded}
                  className="flex items-center gap-1 px-3 py-1.5 bg-nexo-500 hover:bg-nexo-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  <Play className="w-3 h-3" />
                  {invoking ? '执行中...' : '执行'}
                </button>
              </div>

              {/* Request Body */}
              <div className="p-4 border-b border-surface-700">
                <label className="block text-xs text-surface-500 mb-2">请求体 (JSON)</label>
                <textarea
                  value={testBody}
                  onChange={(e) => setTestBody(e.target.value)}
                  spellCheck={false}
                  className="w-full h-32 p-3 bg-surface-900/50 rounded-lg text-surface-200 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-nexo-500/50"
                />
              </div>

              {/* Result */}
              <div className="p-4">
                <label className="block text-xs text-surface-500 mb-2">响应</label>
                
                {testError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {testError}
                    </div>
                  </div>
                )}

                {testResult && (
                  <div className="space-y-3">
                    {testResult.status !== undefined && (
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`px-2 py-0.5 rounded font-medium ${
                          testResult.status < 400 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {testResult.status}
                        </span>
                        {testResult.execution_time_ms !== undefined && (
                          <span className="flex items-center gap-1 text-surface-400">
                            <Zap className="w-3 h-3" />
                            {testResult.execution_time_ms}ms
                          </span>
                        )}
                      </div>
                    )}
                    {testResult.body !== undefined && (
                      <pre className="p-3 bg-surface-900/50 rounded-lg text-surface-200 font-mono text-xs overflow-auto max-h-64">
                        {JSON.stringify(testResult.body, null, 2)}
                      </pre>
                    )}
                    {testResult.data !== undefined && testResult.body === undefined && (
                      <pre className="p-3 bg-surface-900/50 rounded-lg text-surface-200 font-mono text-xs overflow-auto max-h-64">
                        {JSON.stringify(testResult.data, null, 2)}
                      </pre>
                    )}
                  </div>
                )}

                {!testResult && !testError && (
                  <p className="text-sm text-surface-500">
                    {isNew ? '保存函数后可以进行测试' : '点击"执行"按钮测试函数'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


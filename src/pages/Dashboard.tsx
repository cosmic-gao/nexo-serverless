import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Zap, 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  Code2,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import api, { PoolStats, Function } from '../lib/api'

export default function Dashboard() {
  const [stats, setStats] = useState<PoolStats | null>(null)
  const [functions, setFunctions] = useState<Function[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [statsRes, functionsRes] = await Promise.all([
        api.getStats(),
        api.listFunctions(),
      ])

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data)
      }
      if (functionsRes.success && functionsRes.data) {
        setFunctions(functionsRes.data)
      }
    } catch (err) {
      setError('无法连接到运行时服务，请确保服务已启动')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const successRate = stats && stats.total_executions > 0
    ? ((stats.successful_executions / stats.total_executions) * 100).toFixed(1)
    : '100'

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">控制台</h1>
            <p className="text-surface-400">监控你的 Serverless 函数运行状态</p>
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 glass rounded-lg text-surface-300 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="glass rounded-xl p-6 border border-yellow-500/30 mb-8">
            <div className="flex items-center gap-3 text-yellow-400">
              <Activity className="w-5 h-5" />
              <p>{error}</p>
            </div>
            <p className="text-surface-500 text-sm mt-2">
              运行时服务未连接时，下面显示的是示例数据
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-nexo-500/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-nexo-400" />
              </div>
              <span className="text-xs text-surface-500">总执行次数</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats?.total_executions ?? 0}
            </div>
            <div className="text-sm text-surface-400">次调用</div>
          </div>

          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-xs text-surface-500">成功率</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {successRate}%
            </div>
            <div className="text-sm text-surface-400">
              {stats?.successful_executions ?? 0} 成功 / {stats?.failed_executions ?? 0} 失败
            </div>
          </div>

          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-xs text-surface-500">平均执行时间</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats?.avg_execution_time_ms?.toFixed(2) ?? 0}
            </div>
            <div className="text-sm text-surface-400">毫秒</div>
          </div>

          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-xs text-surface-500">活跃 Isolates</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats?.active_isolates ?? 0}
            </div>
            <div className="text-sm text-surface-400">
              / {stats?.max_concurrent ?? 100} 最大并发
            </div>
          </div>
        </div>

        {/* Functions List */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="p-6 border-b border-surface-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Code2 className="w-5 h-5 text-nexo-400" />
              <h2 className="text-lg font-semibold text-white">已部署函数</h2>
              <span className="px-2 py-0.5 bg-surface-700 text-surface-300 text-xs rounded-full">
                {functions.length}
              </span>
            </div>
            <Link 
              to="/functions/new"
              className="flex items-center gap-2 text-nexo-400 hover:text-nexo-300 text-sm transition-colors"
            >
              新建函数
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {functions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mx-auto mb-4">
                <Code2 className="w-8 h-8 text-surface-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">还没有函数</h3>
              <p className="text-surface-400 mb-6">创建你的第一个 Serverless 函数开始使用</p>
              <Link 
                to="/functions/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-nexo-500 hover:bg-nexo-600 text-white font-medium rounded-xl transition-all duration-200 glow-green hover:glow-green-intense"
              >
                <Zap className="w-5 h-5" />
                创建函数
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-surface-700">
              {functions.map((fn) => (
                <Link
                  key={fn.id}
                  to={`/functions/${fn.id}`}
                  className="flex items-center justify-between p-6 hover:bg-surface-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      fn.status === 'active' ? 'bg-nexo-500/10' : 'bg-surface-700'
                    }`}>
                      <Code2 className={`w-5 h-5 ${
                        fn.status === 'active' ? 'text-nexo-400' : 'text-surface-500'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{fn.name}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          fn.status === 'active' 
                            ? 'bg-nexo-500/20 text-nexo-400' 
                            : 'bg-surface-700 text-surface-400'
                        }`}>
                          {fn.status === 'active' ? '运行中' : fn.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-surface-500">
                        <span className="font-mono">{fn.route}</span>
                        <span>•</span>
                        <span>{fn.methods.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-white font-medium">{fn.invocations}</div>
                    <div className="text-xs text-surface-500">调用次数</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


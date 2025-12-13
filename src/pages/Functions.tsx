import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Code2, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Play,
  Edit,
  Trash2,
  Clock,
  Zap
} from 'lucide-react'
import api, { Function } from '../lib/api'

export default function Functions() {
  const [functions, setFunctions] = useState<Function[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  useEffect(() => {
    fetchFunctions()
  }, [])

  const fetchFunctions = async () => {
    setLoading(true)
    const res = await api.listFunctions()
    if (res.success && res.data) {
      setFunctions(res.data)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除函数 "${name}" 吗？此操作无法撤销。`)) {
      return
    }
    
    const res = await api.deleteFunction(id)
    if (res.success) {
      setFunctions(functions.filter(f => f.id !== id))
    }
  }

  const filteredFunctions = functions.filter(fn => {
    const matchesSearch = fn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         fn.route.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || fn.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">函数管理</h1>
            <p className="text-surface-400">管理和部署你的 Serverless 函数</p>
          </div>
          <Link 
            to="/functions/new"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-nexo-500 hover:bg-nexo-600 text-white font-medium rounded-xl transition-all duration-200 glow-green hover:glow-green-intense"
          >
            <Plus className="w-5 h-5" />
            新建函数
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
            <input
              type="text"
              placeholder="搜索函数名称或路由..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 glass rounded-xl bg-surface-900/50 text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-nexo-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-surface-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 glass rounded-xl bg-surface-900/50 text-white focus:outline-none focus:ring-2 focus:ring-nexo-500/50"
            >
              <option value="all">全部状态</option>
              <option value="active">运行中</option>
              <option value="inactive">已停止</option>
              <option value="error">错误</option>
            </select>
          </div>
        </div>

        {/* Functions Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-surface-700 rounded w-2/3 mb-4" />
                <div className="h-4 bg-surface-800 rounded w-1/2 mb-2" />
                <div className="h-4 bg-surface-800 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredFunctions.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-surface-800 flex items-center justify-center mx-auto mb-6">
              <Code2 className="w-10 h-10 text-surface-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? '没有找到匹配的函数' : '还没有创建函数'}
            </h3>
            <p className="text-surface-400 mb-8 max-w-md mx-auto">
              {searchQuery 
                ? '尝试使用不同的搜索关键词'
                : 'Serverless 函数让你可以运行代码而无需管理服务器，开始创建你的第一个函数吧'
              }
            </p>
            {!searchQuery && (
              <Link 
                to="/functions/new"
                className="inline-flex items-center gap-2 px-8 py-4 bg-nexo-500 hover:bg-nexo-600 text-white font-medium rounded-xl transition-all duration-200 glow-green hover:glow-green-intense"
              >
                <Zap className="w-5 h-5" />
                创建第一个函数
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFunctions.map((fn) => (
              <div 
                key={fn.id}
                className="glass rounded-xl p-6 hover:border-surface-600 transition-all duration-200 group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      fn.status === 'active' ? 'bg-nexo-500/10' : 'bg-surface-700'
                    }`}>
                      <Code2 className={`w-5 h-5 ${
                        fn.status === 'active' ? 'text-nexo-400' : 'text-surface-500'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{fn.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        fn.status === 'active' 
                          ? 'bg-nexo-500/20 text-nexo-400' 
                          : 'bg-surface-700 text-surface-400'
                      }`}>
                        {fn.status === 'active' ? '运行中' : fn.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <button className="p-2 hover:bg-surface-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <MoreVertical className="w-4 h-4 text-surface-400" />
                    </button>
                  </div>
                </div>

                {/* Route */}
                <div className="mb-4">
                  <div className="text-xs text-surface-500 mb-1">路由</div>
                  <code className="text-sm font-mono text-nexo-400 bg-surface-800 px-2 py-1 rounded">
                    {fn.route}
                  </code>
                </div>

                {/* Methods */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {fn.methods.map((method) => (
                    <span 
                      key={method}
                      className={`px-2 py-0.5 text-xs rounded font-medium ${
                        method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                        method === 'POST' ? 'bg-green-500/20 text-green-400' :
                        method === 'PUT' ? 'bg-yellow-500/20 text-yellow-400' :
                        method === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                        'bg-surface-700 text-surface-400'
                      }`}
                    >
                      {method}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-surface-400 mb-4 pb-4 border-b border-surface-700">
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    <span>{fn.invocations} 次调用</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{fn.limits.max_execution_time_ms}ms</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    to={`/functions/${fn.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-surface-700 hover:bg-surface-600 text-white text-sm rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    编辑
                  </Link>
                  <button
                    onClick={() => handleDelete(fn.id, fn.name)}
                    className="p-2 hover:bg-red-500/20 text-surface-400 hover:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Last updated */}
                <div className="mt-4 text-xs text-surface-500">
                  更新于 {formatDate(fn.updated_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


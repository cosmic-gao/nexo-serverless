import { Link } from 'react-router-dom'
import { Zap, Globe, Shield, Clock, ArrowRight, Cpu, Server, Code2, Play, Sparkles } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: '毫秒级冷启动',
    description: '基于 V8 Isolate 技术，冷启动时间 < 5ms，比传统容器快 100 倍',
  },
  {
    icon: Shield,
    title: '安全沙箱隔离',
    description: '每个函数运行在独立的 V8 Isolate 中，天然安全隔离，无法访问其他实例',
  },
  {
    icon: Cpu,
    title: '高效资源利用',
    description: '单机可运行数千个 Isolate，内存占用仅 2-5MB，极致的资源效率',
  },
  {
    icon: Clock,
    title: '按需执行',
    description: '函数只在请求时执行，空闲时不占用资源，真正的按需付费',
  },
]

const codeExample = `// 你的第一个 Serverless 函数
async function handler(request, { env }) {
  const { name } = await request.json();
  
  return {
    message: \`Hello, \${name || 'World'}!\`,
    timestamp: new Date().toISOString(),
    region: env.get('REGION') || 'default'
  };
}`

export default function Home() {
  return (
    <div className="pt-24">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center">
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-surface-300 mb-8 animate-fade-in"
          >
            <span className="w-2 h-2 rounded-full bg-nexo-400 animate-pulse" />
            基于 V8 Isolate 的 Serverless 平台
          </div>
          
          <h1 
            className="text-5xl md:text-7xl font-bold leading-tight mb-6 animate-slide-up"
          >
            <span className="text-white">运行你的函数</span>
            <br />
            <span className="gradient-text">毫秒级启动</span>
          </h1>
          
          <p 
            className="text-xl text-surface-400 max-w-2xl mx-auto mb-10 animate-slide-up animate-delay-100"
          >
            Nexo Serverless 使用 V8 Isolate 作为运行时，为你的 JavaScript/TypeScript 函数提供
            极速冷启动、安全隔离和高效资源利用
          </p>
          
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animate-delay-200"
          >
            <Link 
              to="/functions/new"
              className="px-8 py-4 bg-nexo-500 hover:bg-nexo-600 text-white font-medium rounded-xl transition-all duration-200 glow-green hover:glow-green-intense flex items-center gap-2"
            >
              <Code2 className="w-5 h-5" />
              创建函数
            </Link>
            <Link 
              to="/dashboard"
              className="px-8 py-4 glass text-white font-medium rounded-xl hover:bg-surface-800 transition-all duration-200 flex items-center gap-2"
            >
              进入控制台
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Code Preview */}
        <div className="mt-20 relative animate-slide-up animate-delay-300">
          <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-transparent to-transparent z-10 pointer-events-none" />
          <div className="glass rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-nexo-500/10 rounded-full blur-3xl" />
            
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-xs text-surface-500 font-mono">handler.js</span>
              <Link 
                to="/functions/new"
                className="flex items-center gap-1 px-3 py-1 bg-nexo-500/20 hover:bg-nexo-500/30 text-nexo-400 text-xs rounded-lg transition-colors"
              >
                <Play className="w-3 h-3" />
                试一试
              </Link>
            </div>
            
            <pre className="p-6 font-mono text-sm text-surface-300 overflow-x-auto relative z-10">
              <code>{codeExample}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            为什么选择 V8 Isolate
          </h2>
          <p className="text-surface-400 text-lg max-w-2xl mx-auto">
            V8 Isolate 是 Chrome 和 Node.js 使用的 JavaScript 引擎核心技术，
            为 Serverless 场景提供极致性能
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="glass rounded-xl p-6 hover:border-nexo-500/50 transition-all duration-300 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-nexo-500/10 flex items-center justify-center mb-4 group-hover:bg-nexo-500/20 transition-colors">
                <feature.icon className="w-6 h-6 text-nexo-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-surface-400 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="glass rounded-2xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Isolate 运行架构
              </h2>
              <p className="text-surface-400 mb-6">
                每个函数请求都在独立的 V8 Isolate 中执行，Isolate 之间完全隔离，
                共享 V8 引擎实例以节省内存。这种架构让我们能够在单机上同时运行数千个函数实例。
              </p>
              <ul className="space-y-3">
                {[
                  '独立堆内存，无法互相访问',
                  '共享 V8 引擎，高效内存利用',
                  '毫秒级创建和销毁',
                  '支持 CPU 时间和内存限制',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-surface-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-nexo-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex justify-center">
              <div className="relative">
                {/* Architecture Diagram */}
                <div className="space-y-4">
                  {/* Request */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Globe className="w-7 h-7 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">HTTP 请求</div>
                      <div className="text-surface-500 text-sm">GET /api/hello</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 ml-6">
                    <div className="w-0.5 h-8 bg-surface-700" />
                  </div>
                  
                  {/* Router */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Server className="w-7 h-7 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">路由分发</div>
                      <div className="text-surface-500 text-sm">匹配函数路由</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 ml-6">
                    <div className="w-0.5 h-8 bg-surface-700" />
                  </div>
                  
                  {/* Isolate */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-nexo-500/20 flex items-center justify-center glow-green">
                      <Cpu className="w-7 h-7 text-nexo-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">V8 Isolate</div>
                      <div className="text-surface-500 text-sm">执行函数代码 ({"<"}5ms)</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 ml-6">
                    <div className="w-0.5 h-8 bg-surface-700" />
                  </div>
                  
                  {/* Response */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <Zap className="w-7 h-7 text-green-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">响应返回</div>
                      <div className="text-surface-500 text-sm">JSON Response</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Generator Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="glass rounded-2xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-nexo-500/10 rounded-full blur-3xl" />
          
          <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-sm text-purple-300 mb-6">
                <Sparkles className="w-4 h-4" />
                全新功能
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                AI 代码生成器
              </h2>
              <p className="text-surface-400 mb-6">
                使用 AI 自动生成前端代码，实时预览效果，一键发布到 Serverless 平台。
                无需编写代码，只需描述您想要的页面。
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  '自然语言描述，AI 自动生成代码',
                  '实时预览，所见即所得',
                  '一键发布到 Serverless 平台',
                  '支持导出和分享',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-surface-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link 
                to="/ai-generator"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/30"
              >
                <Sparkles className="w-5 h-5" />
                开始使用 AI 生成
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="relative">
              <div className="glass rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-700">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="p-4 bg-surface-900/50">
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-sm">👤</div>
                        <div className="bg-nexo-500 rounded-2xl px-4 py-2 text-sm text-white">
                          创建一个现代的登录页面
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="bg-surface-800 rounded-2xl px-4 py-2 text-sm text-surface-200">
                          我已生成代码，请在预览区查看效果 ✨
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            开始构建你的 Serverless 应用
          </h2>
          <p className="text-surface-400 mb-8 max-w-2xl mx-auto">
            几分钟内部署你的第一个函数，体验毫秒级冷启动带来的极致性能
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/functions/new"
              className="inline-flex items-center gap-2 px-8 py-4 bg-nexo-500 hover:bg-nexo-600 text-white font-medium rounded-xl transition-all duration-200 glow-green hover:glow-green-intense"
            >
              <Zap className="w-5 h-5" />
              创建第一个函数
            </Link>
            <Link 
              to="/ai-generator"
              className="inline-flex items-center gap-2 px-8 py-4 glass text-white font-medium rounded-xl hover:bg-surface-800 transition-all duration-200"
            >
              <Sparkles className="w-5 h-5" />
              用 AI 生成代码
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-surface-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-surface-500 text-sm">
            © 2024 Nexo Serverless. 基于 V8 Isolate 构建。
          </div>
          <div className="flex items-center gap-6 text-sm text-surface-500">
            <a href="#" className="hover:text-white transition-colors">文档</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">API</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

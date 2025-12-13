import { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  Send,
  Check,
  Rocket,
  MessageSquare,
  Loader2,
  ExternalLink,
  Trash2,
  Download,
  FolderOpen
} from 'lucide-react'
import api from '../lib/api'
import { ProjectFile, ProjectType, getTemplate, allTemplates } from '../lib/projectTemplates'
import WebContainerPreview from '../components/WebContainerPreview'
import FileEditor from '../components/FileEditor'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// 模拟 AI 生成代码（实际项目中应接入真实 AI API）
const generateCodeWithAI = async (
  prompt: string, 
  projectType: ProjectType,
  _existingFiles: ProjectFile[]
): Promise<ProjectFile[]> => {
  // 模拟 API 延迟
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // 获取基础模板
  const template = getTemplate(projectType)
  let files = [...template.files]
  
  // 根据提示词修改模板
  if (projectType === 'html') {
    // HTML 项目 - 生成完整 HTML
    files = generateHtmlProject(prompt)
  } else if (projectType === 'react') {
    // React 项目 - 修改 App.tsx
    files = generateReactProject(prompt, files)
  } else if (projectType === 'vue') {
    // Vue 项目 - 修改 App.vue
    files = generateVueProject(prompt, files)
  }

  return files
}

// 生成 HTML 项目
function generateHtmlProject(prompt: string): ProjectFile[] {
  const lowerPrompt = prompt.toLowerCase()
  
  let theme = {
    primary: '#667eea',
    secondary: '#764ba2',
    bg: 'from-slate-900 to-slate-800',
    accent: 'purple'
  }

  if (lowerPrompt.includes('绿') || lowerPrompt.includes('green')) {
    theme = { primary: '#10b981', secondary: '#059669', bg: 'from-emerald-900 to-teal-800', accent: 'emerald' }
  } else if (lowerPrompt.includes('蓝') || lowerPrompt.includes('blue')) {
    theme = { primary: '#3b82f6', secondary: '#1d4ed8', bg: 'from-blue-900 to-indigo-900', accent: 'blue' }
  } else if (lowerPrompt.includes('红') || lowerPrompt.includes('red')) {
    theme = { primary: '#ef4444', secondary: '#dc2626', bg: 'from-red-900 to-rose-900', accent: 'red' }
  }

  let contentType = 'landing'
  if (lowerPrompt.includes('dashboard') || lowerPrompt.includes('仪表') || lowerPrompt.includes('后台')) {
    contentType = 'dashboard'
  } else if (lowerPrompt.includes('登录') || lowerPrompt.includes('表单') || lowerPrompt.includes('login')) {
    contentType = 'form'
  } else if (lowerPrompt.includes('卡片') || lowerPrompt.includes('card')) {
    contentType = 'cards'
  }

  const htmlContent = generateHtmlContent(contentType, theme)

  return [
    {
      path: 'index.html',
      language: 'html',
      content: htmlContent,
    },
    {
      path: 'style.css',
      language: 'css',
      content: `/* 自定义动画 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.fade-in { animation: fadeIn 0.5s ease-out; }
.float { animation: float 3s ease-in-out infinite; }

.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}`,
    },
    {
      path: 'main.js',
      language: 'javascript',
      content: `// 交互逻辑
document.addEventListener('DOMContentLoaded', () => {
  console.log('页面已加载');
  
  // 添加点击效果
  document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const ripple = document.createElement('span');
      ripple.classList.add('fade-in');
      e.target.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);
    });
  });
});`,
    },
  ]
}

function generateHtmlContent(type: string, theme: { primary: string, secondary: string, bg: string, accent: string }): string {
  const templates: Record<string, string> = {
    landing: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-gradient-to-br ${theme.bg} text-white min-h-screen">
  <nav class="fixed top-0 w-full glass z-50">
    <div class="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
      <div class="text-xl font-bold" style="color: ${theme.primary}">Brand</div>
      <div class="hidden md:flex gap-6 text-gray-300">
        <a href="#" class="hover:text-white transition">首页</a>
        <a href="#" class="hover:text-white transition">功能</a>
        <a href="#" class="hover:text-white transition">定价</a>
      </div>
      <button class="px-5 py-2 rounded-lg font-medium transition hover:opacity-90" style="background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary})">
        开始使用
      </button>
    </div>
  </nav>

  <main class="pt-32 pb-20 px-6">
    <section class="max-w-4xl mx-auto text-center">
      <span class="inline-block px-4 py-2 rounded-full text-sm mb-6 glass">
        ✨ 全新发布
      </span>
      <h1 class="text-5xl md:text-7xl font-bold mb-6 leading-tight">
        构建下一代
        <span style="background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary}); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          产品体验
        </span>
      </h1>
      <p class="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
        使用我们的平台，快速构建、部署和扩展您的应用。强大的工具，简单的工作流程。
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button class="px-8 py-4 rounded-xl font-semibold text-lg transition hover:opacity-90 shadow-lg" style="background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary}); box-shadow: 0 10px 40px ${theme.primary}40">
          免费开始
        </button>
        <button class="px-8 py-4 rounded-xl font-semibold text-lg glass hover:bg-white/10 transition">
          查看演示
        </button>
      </div>
    </section>

    <section class="max-w-6xl mx-auto mt-32 grid md:grid-cols-3 gap-6">
      <div class="glass rounded-2xl p-8 hover:border-${theme.accent}-500/50 transition group">
        <div class="w-14 h-14 rounded-xl flex items-center justify-center mb-6 float" style="background: ${theme.primary}20">
          🚀
        </div>
        <h3 class="text-xl font-semibold mb-3">极速部署</h3>
        <p class="text-gray-400">一键部署到全球边缘网络，毫秒级响应。</p>
      </div>
      <div class="glass rounded-2xl p-8 hover:border-${theme.accent}-500/50 transition group">
        <div class="w-14 h-14 rounded-xl flex items-center justify-center mb-6 float" style="background: ${theme.primary}20; animation-delay: 0.5s">
          🔒
        </div>
        <h3 class="text-xl font-semibold mb-3">安全可靠</h3>
        <p class="text-gray-400">企业级安全，数据加密存储。</p>
      </div>
      <div class="glass rounded-2xl p-8 hover:border-${theme.accent}-500/50 transition group">
        <div class="w-14 h-14 rounded-xl flex items-center justify-center mb-6 float" style="background: ${theme.primary}20; animation-delay: 1s">
          📊
        </div>
        <h3 class="text-xl font-semibold mb-3">数据分析</h3>
        <p class="text-gray-400">实时监控，智能分析。</p>
      </div>
    </section>
  </main>
  <script src="main.js"></script>
</body>
</html>`,

    dashboard: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-gray-950 text-white min-h-screen">
  <div class="flex">
    <aside class="w-64 min-h-screen bg-gray-900 border-r border-gray-800 p-6 fixed">
      <div class="text-xl font-bold mb-8" style="color: ${theme.primary}">Dashboard</div>
      <nav class="space-y-2">
        <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg transition" style="background: ${theme.primary}15; color: ${theme.primary}">
          📊 概览
        </a>
        <a href="#" class="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 rounded-lg transition">
          📈 分析
        </a>
        <a href="#" class="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 rounded-lg transition">
          👥 用户
        </a>
        <a href="#" class="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 rounded-lg transition">
          ⚙️ 设置
        </a>
      </nav>
    </aside>

    <main class="ml-64 flex-1 p-8">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-bold">欢迎回来 👋</h1>
        <input type="search" placeholder="搜索..." class="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-${theme.accent}-500">
      </div>

      <div class="grid grid-cols-4 gap-6 mb-8">
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:-translate-y-1 transition-transform">
          <div class="text-gray-400 text-sm mb-2">总收入</div>
          <div class="text-3xl font-bold" style="color: ${theme.primary}">¥128,430</div>
          <div class="text-green-400 text-sm mt-2">↑ 12.5%</div>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:-translate-y-1 transition-transform">
          <div class="text-gray-400 text-sm mb-2">活跃用户</div>
          <div class="text-3xl font-bold text-purple-400">2,845</div>
          <div class="text-green-400 text-sm mt-2">↑ 8.2%</div>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:-translate-y-1 transition-transform">
          <div class="text-gray-400 text-sm mb-2">订单数</div>
          <div class="text-3xl font-bold text-orange-400">1,234</div>
          <div class="text-red-400 text-sm mt-2">↓ 3.1%</div>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:-translate-y-1 transition-transform">
          <div class="text-gray-400 text-sm mb-2">转化率</div>
          <div class="text-3xl font-bold text-green-400">4.28%</div>
          <div class="text-green-400 text-sm mt-2">↑ 1.2%</div>
        </div>
      </div>

      <div class="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 class="text-lg font-semibold mb-4">最近活动</h2>
        <div class="space-y-4">
          <div class="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg">
            <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: ${theme.primary}20; color: ${theme.primary}">✓</div>
            <div class="flex-1">
              <div class="font-medium">新用户注册</div>
              <div class="text-gray-400 text-sm">用户 #1234 完成注册</div>
            </div>
            <div class="text-gray-500 text-sm">2分钟前</div>
          </div>
          <div class="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg">
            <div class="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center">💰</div>
            <div class="flex-1">
              <div class="font-medium">订单完成</div>
              <div class="text-gray-400 text-sm">订单 #5678 已支付</div>
            </div>
            <div class="text-gray-500 text-sm">15分钟前</div>
          </div>
        </div>
      </div>
    </main>
  </div>
  <script src="main.js"></script>
</body>
</html>`,

    form: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>登录</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="min-h-screen flex items-center justify-center p-6" style="background: linear-gradient(135deg, ${theme.primary}30, ${theme.secondary}30), linear-gradient(to br, #1a1a2e, #16213e)">
  <div class="w-full max-w-md">
    <div class="glass rounded-3xl p-8 shadow-2xl">
      <div class="text-center mb-8">
        <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" style="background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary})">
          <span class="text-2xl">🔐</span>
        </div>
        <h1 class="text-2xl font-bold text-white mb-2">欢迎回来</h1>
        <p class="text-gray-400">请登录您的账户</p>
      </div>

      <form class="space-y-6">
        <div>
          <label class="block text-gray-300 text-sm mb-2">邮箱地址</label>
          <input type="email" placeholder="your@email.com" class="w-full px-4 py-3 glass rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition" style="--tw-ring-color: ${theme.primary}">
        </div>
        <div>
          <label class="block text-gray-300 text-sm mb-2">密码</label>
          <input type="password" placeholder="••••••••" class="w-full px-4 py-3 glass rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition" style="--tw-ring-color: ${theme.primary}">
        </div>
        <div class="flex items-center justify-between text-sm">
          <label class="flex items-center gap-2 text-gray-300 cursor-pointer">
            <input type="checkbox" class="w-4 h-4 rounded">
            记住我
          </label>
          <a href="#" class="hover:underline" style="color: ${theme.primary}">忘记密码？</a>
        </div>
        <button type="submit" class="w-full py-4 text-white font-semibold rounded-xl transition hover:opacity-90 shadow-lg" style="background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary}); box-shadow: 0 10px 40px ${theme.primary}40">
          登录
        </button>
      </form>

      <div class="mt-8 text-center text-gray-400">
        还没有账户？ 
        <a href="#" class="font-medium hover:underline" style="color: ${theme.primary}">立即注册</a>
      </div>
    </div>
  </div>
  <script src="main.js"></script>
</body>
</html>`,

    cards: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>卡片展示</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-gradient-to-br ${theme.bg} text-white min-h-screen p-8">
  <div class="max-w-6xl mx-auto">
    <h1 class="text-4xl font-bold text-center mb-12">精选内容</h1>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="glass rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300">
        <div class="h-48 bg-gradient-to-br from-pink-500 to-violet-600"></div>
        <div class="p-6">
          <span class="text-xs text-${theme.accent}-400 uppercase tracking-wider">分类一</span>
          <h3 class="text-xl font-bold mt-2 mb-3">卡片标题</h3>
          <p class="text-gray-400 text-sm mb-4">这是一段描述文字，展示卡片的主要内容信息。</p>
          <button class="text-sm font-medium" style="color: ${theme.primary}">了解更多 →</button>
        </div>
      </div>
      <div class="glass rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300">
        <div class="h-48 bg-gradient-to-br from-cyan-500 to-blue-600"></div>
        <div class="p-6">
          <span class="text-xs text-${theme.accent}-400 uppercase tracking-wider">分类二</span>
          <h3 class="text-xl font-bold mt-2 mb-3">另一个标题</h3>
          <p class="text-gray-400 text-sm mb-4">探索更多精彩内容，发现无限可能。</p>
          <button class="text-sm font-medium" style="color: ${theme.primary}">了解更多 →</button>
        </div>
      </div>
      <div class="glass rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300">
        <div class="h-48 bg-gradient-to-br from-amber-500 to-orange-600"></div>
        <div class="p-6">
          <span class="text-xs text-${theme.accent}-400 uppercase tracking-wider">分类三</span>
          <h3 class="text-xl font-bold mt-2 mb-3">第三个卡片</h3>
          <p class="text-gray-400 text-sm mb-4">创新设计，极致体验，尽在其中。</p>
          <button class="text-sm font-medium" style="color: ${theme.primary}">了解更多 →</button>
        </div>
      </div>
    </div>
  </div>
  <script src="main.js"></script>
</body>
</html>`,
  }

  return templates[type] || templates.landing
}

// 生成 React 项目
function generateReactProject(prompt: string, files: ProjectFile[]): ProjectFile[] {
  const appFile = files.find(f => f.path === 'src/App.tsx')
  if (!appFile) return files

  const lowerPrompt = prompt.toLowerCase()
  let componentCode = ''

  if (lowerPrompt.includes('计数') || lowerPrompt.includes('counter')) {
    componentCode = `import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 to-purple-800 flex items-center justify-center">
      <div className="text-center glass p-12 rounded-3xl">
        <h1 className="text-6xl font-bold text-white mb-4">
          {count}
        </h1>
        <p className="text-purple-200 mb-8">点击按钮增加计数</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setCount(c => c - 1)}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition"
          >
            -1
          </button>
          <button
            onClick={() => setCount(c => c + 1)}
            className="px-8 py-4 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-xl transition shadow-lg shadow-purple-500/30"
          >
            +1
          </button>
        </div>
      </div>
    </div>
  )
}

export default App`
  } else if (lowerPrompt.includes('todo') || lowerPrompt.includes('待办')) {
    componentCode = `import { useState } from 'react'

interface Todo {
  id: number
  text: string
  completed: boolean
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')

  const addTodo = () => {
    if (!input.trim()) return
    setTodos([...todos, { id: Date.now(), text: input, completed: false }])
    setInput('')
  }

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(t => t.id !== id))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">待办事项 ✓</h1>
        
        <div className="flex gap-2 mb-6">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTodo()}
            placeholder="添加新任务..."
            className="flex-1 px-4 py-3 bg-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={addTodo}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition"
          >
            添加
          </button>
        </div>

        <div className="space-y-3">
          {todos.map(todo => (
            <div
              key={todo.id}
              className={\`flex items-center gap-3 p-4 bg-slate-700/50 rounded-xl \${todo.completed ? 'opacity-60' : ''}\`}
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className={\`w-6 h-6 rounded-full border-2 flex items-center justify-center transition \${
                  todo.completed ? 'bg-green-500 border-green-500' : 'border-slate-500'
                }\`}
              >
                {todo.completed && <span className="text-white text-sm">✓</span>}
              </button>
              <span className={\`flex-1 text-white \${todo.completed ? 'line-through' : ''}\`}>
                {todo.text}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-slate-400 hover:text-red-400 transition"
              >
                ×
              </button>
            </div>
          ))}
          {todos.length === 0 && (
            <p className="text-center text-slate-500 py-8">暂无任务</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default App`
  } else {
    // 默认现代 landing page
    componentCode = `import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="fixed top-0 w-full backdrop-blur-lg bg-slate-900/50 border-b border-slate-700 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Brand
          </span>
          <button className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium text-white hover:opacity-90 transition">
            开始使用
          </button>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6">
        <section className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-2 rounded-full text-sm mb-6 bg-purple-500/20 text-purple-300">
            ✨ AI 生成的 React 应用
          </span>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            构建下一代
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {" "}产品体验
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            使用 React + Vite 构建的现代化应用，快速、灵活、强大。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setCount(c => c + 1)}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-lg text-white hover:opacity-90 transition shadow-lg shadow-purple-500/30"
            >
              点击计数: {count}
            </button>
            <button className="px-8 py-4 bg-slate-800 border border-slate-700 rounded-xl font-semibold text-lg text-white hover:bg-slate-700 transition">
              了解更多
            </button>
          </div>
        </section>

        <section className="max-w-6xl mx-auto mt-32 grid md:grid-cols-3 gap-6">
          {[
            { icon: '⚡', title: '极速', desc: 'Vite 驱动，毫秒级热更新' },
            { icon: '🔥', title: 'React 18', desc: '使用最新 React 特性' },
            { icon: '🎨', title: 'Tailwind', desc: '原子化 CSS，自由定制' },
          ].map((item, i) => (
            <div key={i} className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 transition">
              <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6 text-2xl">
                {item.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
              <p className="text-slate-400">{item.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}

export default App`
  }

  return files.map(f => 
    f.path === 'src/App.tsx' ? { ...f, content: componentCode } : f
  )
}

// 生成 Vue 项目
function generateVueProject(prompt: string, files: ProjectFile[]): ProjectFile[] {
  const appFile = files.find(f => f.path === 'src/App.vue')
  if (!appFile) return files

  const lowerPrompt = prompt.toLowerCase()
  let componentCode = ''

  if (lowerPrompt.includes('计数') || lowerPrompt.includes('counter')) {
    componentCode = `<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-teal-900 to-emerald-800 flex items-center justify-center">
    <div class="text-center glass p-12 rounded-3xl">
      <h1 class="text-6xl font-bold text-white mb-4">{{ count }}</h1>
      <p class="text-emerald-200 mb-8">点击按钮增加计数</p>
      <div class="flex gap-4 justify-center">
        <button @click="count--" class="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition">
          -1
        </button>
        <button @click="count++" class="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition shadow-lg shadow-emerald-500/30">
          +1
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>`
  } else {
    componentCode = `<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

const features = [
  { icon: '🍃', title: 'Vue 3', desc: '组合式 API，更灵活' },
  { icon: '⚡', title: 'Vite', desc: '极速开发体验' },
  { icon: '🎨', title: 'Tailwind', desc: '原子化样式' },
]
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
    <nav class="fixed top-0 w-full backdrop-blur-lg bg-slate-900/50 border-b border-slate-700 z-50">
      <div class="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <span class="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
          Brand
        </span>
        <button class="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-medium text-white hover:opacity-90 transition">
          开始使用
        </button>
      </div>
    </nav>

    <main class="pt-32 pb-20 px-6">
      <section class="max-w-4xl mx-auto text-center">
        <span class="inline-block px-4 py-2 rounded-full text-sm mb-6 bg-emerald-500/20 text-emerald-300">
          🍃 AI 生成的 Vue 应用
        </span>
        <h1 class="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          构建下一代
          <span class="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            产品体验
          </span>
        </h1>
        <p class="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          使用 Vue 3 + Vite 构建的现代化应用
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            @click="count++"
            class="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-semibold text-lg text-white hover:opacity-90 transition shadow-lg shadow-emerald-500/30"
          >
            点击计数: {{ count }}
          </button>
        </div>
      </section>

      <section class="max-w-6xl mx-auto mt-32 grid md:grid-cols-3 gap-6">
        <div
          v-for="(item, i) in features"
          :key="i"
          class="p-8 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 transition"
        >
          <div class="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-6 text-2xl">
            {{ item.icon }}
          </div>
          <h3 class="text-xl font-semibold text-white mb-3">{{ item.title }}</h3>
          <p class="text-slate-400">{{ item.desc }}</p>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
</style>`
  }

  return files.map(f => 
    f.path === 'src/App.vue' ? { ...f, content: componentCode } : f
  )
}

type ViewMode = 'chat' | 'files' | 'preview'

export default function AICodeGenerator() {
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [projectType, setProjectType] = useState<ProjectType>('html')
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([])
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('chat')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null)

  // 滚动到最新消息
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating) return

    const userMessage: Message = { role: 'user', content: inputValue }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsGenerating(true)

    try {
      const files = await generateCodeWithAI(inputValue, projectType, projectFiles)
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: `我已经根据您的描述生成了 ${projectType === 'html' ? 'HTML' : projectType === 'react' ? 'React' : 'Vue'} 项目代码。您可以在"文件"标签查看和编辑代码，或在"预览"标签查看效果。`,
      }
      
      setMessages(prev => [...prev, assistantMessage])
      setProjectFiles(files)
      setActiveFile(files[0]?.path || null)
      setPublishedUrl(null)
      setViewMode('preview') // 自动切换到预览
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: '抱歉，生成代码时出现错误，请重试。'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileChange = (path: string, content: string) => {
    setProjectFiles(files => 
      files.map(f => f.path === path ? { ...f, content } : f)
    )
  }

  const handleFileCreate = (path: string, language: ProjectFile['language']) => {
    setProjectFiles(files => [...files, { path, content: '', language }])
    setActiveFile(path)
  }

  const handleFileDelete = (path: string) => {
    setProjectFiles(files => files.filter(f => f.path !== path))
    if (activeFile === path) {
      setActiveFile(projectFiles[0]?.path || null)
    }
  }

  const downloadProject = () => {
    // 简单下载 - 对于 HTML 项目打包成单个文件
    if (projectType === 'html' && projectFiles.length > 0) {
      const htmlFile = projectFiles.find(f => f.path === 'index.html')
      if (htmlFile) {
        const blob = new Blob([htmlFile.content], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'index.html'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } else {
      // 对于 React/Vue 项目，下载 JSON 描述
      const projectData = {
        type: projectType,
        files: projectFiles,
      }
      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'project.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handlePublish = async () => {
    if (projectFiles.length === 0) return
    
    setIsPublishing(true)
    
    try {
      // 对于 HTML 项目，合并所有文件到一个 HTML
      let htmlContent = ''
      
      if (projectType === 'html') {
        const htmlFile = projectFiles.find(f => f.path === 'index.html')
        const cssFile = projectFiles.find(f => f.path === 'style.css')
        const jsFile = projectFiles.find(f => f.path === 'main.js')

        if (htmlFile) {
          htmlContent = htmlFile.content
          
          if (cssFile) {
            htmlContent = htmlContent.replace(
              /<link[^>]*href=["']style\.css["'][^>]*>/gi,
              `<style>${cssFile.content}</style>`
            )
          }

          if (jsFile) {
            htmlContent = htmlContent.replace(
              /<script[^>]*src=["']main\.js["'][^>]*><\/script>/gi,
              `<script>${jsFile.content}</script>`
            )
          }
        }
      } else {
        // React/Vue 项目 - 生成静态预览页面
        const appFile = projectFiles.find(f => 
          f.path === 'src/App.tsx' || f.path === 'src/App.vue'
        )
        
        htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectType === 'react' ? 'React' : 'Vue'} 项目预览</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background: #0f172a; color: white; font-family: system-ui, sans-serif; }
    .code-block { background: #1e293b; border-radius: 12px; padding: 20px; overflow-x: auto; }
    pre { margin: 0; white-space: pre-wrap; font-size: 13px; line-height: 1.6; }
  </style>
</head>
<body class="min-h-screen p-8">
  <div class="max-w-4xl mx-auto">
    <div class="text-center mb-8">
      <span class="inline-block px-4 py-2 rounded-full text-sm mb-4" style="background: ${projectType === 'react' ? '#61dafb20' : '#42b88320'}; color: ${projectType === 'react' ? '#61dafb' : '#42b883'}">
        ${projectType === 'react' ? 'React' : 'Vue'} 项目
      </span>
      <h1 class="text-3xl font-bold mb-2">AI 生成的代码</h1>
      <p class="text-gray-400">在 CodeSandbox 或 StackBlitz 中运行以查看完整效果</p>
    </div>
    <div class="code-block">
      <pre><code>${escapeHtml(appFile?.content || '')}</code></pre>
    </div>
    <p class="text-center text-gray-500 text-sm mt-8">
      项目包含 ${projectFiles.length} 个文件
    </p>
  </div>
</body>
</html>`
      }

      const res = await api.deployPreview({ html: htmlContent })

      if (res.success && res.data) {
        setPublishedUrl(res.data.url)
      } else {
        alert('发布失败: ' + (res.error || '未知错误'))
      }
    } catch (error) {
      alert('发布失败，请确保 Serverless 运行时已启动')
    } finally {
      setIsPublishing(false)
    }
  }

  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  const clearProject = () => {
    setMessages([])
    setProjectFiles([])
    setActiveFile(null)
    setPublishedUrl(null)
    setViewMode('chat')
  }

  const quickPrompts = [
    { label: 'Landing Page', prompt: '创建一个现代的产品着陆页，包含导航栏、英雄区域和特性展示' },
    { label: 'Dashboard', prompt: '创建一个数据仪表盘页面，包含侧边栏和统计卡片' },
    { label: '登录表单', prompt: '创建一个漂亮的登录表单页面' },
    { label: 'Todo 应用', prompt: '创建一个待办事项应用，可以添加、完成和删除任务' },
  ]

  return (
    <div className={`pt-24 pb-8 min-h-screen ${isFullscreen ? 'fixed inset-0 z-50 bg-surface-950 pt-0' : ''}`}>
      <div className={`${isFullscreen ? 'h-full' : 'max-w-[1600px] mx-auto px-6'}`}>
        {/* Header */}
        {!isFullscreen && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-nexo-400" />
                AI 代码生成器
              </h1>
              <p className="text-surface-400 mt-1">
                选择项目类型，描述您的需求，AI 自动生成代码
              </p>
            </div>
            <div className="flex items-center gap-3">
              {projectFiles.length > 0 && (
                <>
                  <button
                    onClick={downloadProject}
                    className="flex items-center gap-2 px-4 py-2 glass rounded-lg text-surface-300 hover:text-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    下载
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="flex items-center gap-2 px-6 py-2 bg-nexo-500 hover:bg-nexo-600 text-white font-medium rounded-lg transition-all duration-200 glow-green hover:glow-green-intense disabled:opacity-50"
                  >
                    {isPublishing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Rocket className="w-4 h-4" />
                    )}
                    {isPublishing ? '发布中...' : '发布'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Project Type Selector */}
        {!isFullscreen && (
          <div className="flex items-center gap-4 mb-6">
            <span className="text-surface-400 text-sm">项目类型:</span>
            <div className="flex gap-2">
              {allTemplates.map(template => (
                <button
                  key={template.type}
                  onClick={() => {
                    setProjectType(template.type)
                    if (projectFiles.length === 0) {
                      // 如果没有文件，加载模板
                      setProjectFiles(template.files)
                      setActiveFile(template.entryFile)
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    projectType === template.type
                      ? 'bg-nexo-500 text-white'
                      : 'glass text-surface-300 hover:text-white'
                  }`}
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Published URL Banner */}
        {publishedUrl && !isFullscreen && (
          <div className="glass rounded-xl p-4 mb-6 border border-nexo-500/30 bg-nexo-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-nexo-500/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-nexo-400" />
                </div>
                <div>
                  <div className="text-white font-medium">已成功发布!</div>
                  <div className="text-surface-400 text-sm">您的页面已部署到 Serverless 平台</div>
                </div>
              </div>
              <a
                href={publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-nexo-500 hover:bg-nexo-600 text-white rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                访问页面
              </a>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={`grid ${isFullscreen ? 'grid-cols-1 h-full' : 'grid-cols-1 lg:grid-cols-2 gap-6'}`}>
          {/* Left Panel - Chat & Files */}
          {!isFullscreen && (
            <div className="glass rounded-xl overflow-hidden flex flex-col h-[calc(100vh-320px)]">
              {/* Tab Bar */}
              <div className="flex items-center border-b border-surface-700">
                <button
                  onClick={() => setViewMode('chat')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    viewMode === 'chat'
                      ? 'text-nexo-400 border-b-2 border-nexo-400'
                      : 'text-surface-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  对话
                </button>
                <button
                  onClick={() => setViewMode('files')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    viewMode === 'files'
                      ? 'text-nexo-400 border-b-2 border-nexo-400'
                      : 'text-surface-400 hover:text-white'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  文件
                  {projectFiles.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-surface-700 text-xs rounded">
                      {projectFiles.length}
                    </span>
                  )}
                </button>
                <div className="flex-1" />
                <button
                  onClick={clearProject}
                  className="p-2 mr-2 hover:bg-surface-700 rounded-lg transition-colors text-surface-400 hover:text-white"
                  title="清空项目"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden">
                {viewMode === 'chat' ? (
                  <div className="flex flex-col h-full">
                    {/* Messages */}
                    <div
                      ref={chatContainerRef}
                      className="flex-1 overflow-y-auto p-4 space-y-4"
                    >
                      {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-nexo-500/20 to-purple-500/20 flex items-center justify-center mb-6">
                            <Sparkles className="w-10 h-10 text-nexo-400" />
                          </div>
                          <h3 className="text-xl font-semibold text-white mb-2">
                            开始创建您的项目
                          </h3>
                          <p className="text-surface-400 text-sm max-w-xs mb-6">
                            选择项目类型后，描述您想要的页面设计
                          </p>
                          
                          {/* Quick Prompts */}
                          <div className="w-full space-y-2">
                            <span className="text-xs text-surface-500">快速开始:</span>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {quickPrompts.map((item) => (
                                <button
                                  key={item.label}
                                  onClick={() => setInputValue(item.prompt)}
                                  className="px-3 py-1.5 bg-surface-800 hover:bg-surface-700 text-surface-300 text-sm rounded-lg transition-colors"
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        messages.map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                                message.role === 'user'
                                  ? 'bg-nexo-500 text-white'
                                  : 'bg-surface-800 text-surface-200'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                          </div>
                        ))
                      )}

                      {isGenerating && (
                        <div className="flex justify-start">
                          <div className="bg-surface-800 rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-2 text-surface-300">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-sm">AI 正在生成代码...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-surface-700">
                      <div className="flex gap-3">
                        <textarea
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="描述您想要的页面..."
                          rows={2}
                          className="flex-1 px-4 py-3 bg-surface-900/50 rounded-xl text-white placeholder-surface-500 resize-none focus:outline-none focus:ring-2 focus:ring-nexo-500/50"
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!inputValue.trim() || isGenerating}
                          className="px-6 bg-nexo-500 hover:bg-nexo-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <FileEditor
                    files={projectFiles}
                    activeFile={activeFile}
                    onFileSelect={setActiveFile}
                    onFileChange={handleFileChange}
                    onFileCreate={handleFileCreate}
                    onFileDelete={handleFileDelete}
                  />
                )}
              </div>
            </div>
          )}

          {/* Right Panel - Preview */}
          <div className={`glass rounded-xl overflow-hidden flex flex-col ${isFullscreen ? 'h-full' : 'h-[calc(100vh-320px)]'}`}>
            <WebContainerPreview
              files={projectFiles}
              projectType={projectType}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

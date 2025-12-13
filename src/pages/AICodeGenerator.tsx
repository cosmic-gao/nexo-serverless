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
  Wand2,
  Code,
  Palette,
  Zap,
  Bot,
  User,
  Layers,
  Terminal,
  Maximize2,
  Copy,
  CheckCircle2
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
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const template = getTemplate(projectType)
  let files = [...template.files]
  
  if (projectType === 'html') {
    files = generateHtmlProject(prompt)
  } else if (projectType === 'react') {
    files = generateReactProject(prompt, files)
  } else if (projectType === 'vue') {
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
    { path: 'index.html', language: 'html', content: htmlContent },
    { path: 'style.css', language: 'css', content: `@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.fade-in { animation: fadeIn 0.5s ease-out; }
.float { animation: float 3s ease-in-out infinite; }
.glass { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }` },
    { path: 'main.js', language: 'javascript', content: `document.addEventListener('DOMContentLoaded', () => { console.log('页面已加载'); });` },
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
      <button class="px-5 py-2 rounded-lg font-medium transition hover:opacity-90" style="background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary})">开始使用</button>
    </div>
  </nav>
  <main class="pt-32 pb-20 px-6">
    <section class="max-w-4xl mx-auto text-center">
      <span class="inline-block px-4 py-2 rounded-full text-sm mb-6 glass">✨ 全新发布</span>
      <h1 class="text-5xl md:text-7xl font-bold mb-6 leading-tight">构建下一代<span style="background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary}); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"> 产品体验</span></h1>
      <p class="text-xl text-gray-400 max-w-2xl mx-auto mb-10">使用我们的平台，快速构建、部署和扩展您的应用。</p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button class="px-8 py-4 rounded-xl font-semibold text-lg transition hover:opacity-90 shadow-lg" style="background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary}); box-shadow: 0 10px 40px ${theme.primary}40">免费开始</button>
        <button class="px-8 py-4 rounded-xl font-semibold text-lg glass hover:bg-white/10 transition">查看演示</button>
      </div>
    </section>
    <section class="max-w-6xl mx-auto mt-32 grid md:grid-cols-3 gap-6">
      <div class="glass rounded-2xl p-8 hover:border-${theme.accent}-500/50 transition"><div class="w-14 h-14 rounded-xl flex items-center justify-center mb-6 float" style="background: ${theme.primary}20">🚀</div><h3 class="text-xl font-semibold mb-3">极速部署</h3><p class="text-gray-400">一键部署到全球边缘网络。</p></div>
      <div class="glass rounded-2xl p-8 hover:border-${theme.accent}-500/50 transition"><div class="w-14 h-14 rounded-xl flex items-center justify-center mb-6 float" style="background: ${theme.primary}20; animation-delay: 0.5s">🔒</div><h3 class="text-xl font-semibold mb-3">安全可靠</h3><p class="text-gray-400">企业级安全保障。</p></div>
      <div class="glass rounded-2xl p-8 hover:border-${theme.accent}-500/50 transition"><div class="w-14 h-14 rounded-xl flex items-center justify-center mb-6 float" style="background: ${theme.primary}20; animation-delay: 1s">📊</div><h3 class="text-xl font-semibold mb-3">数据分析</h3><p class="text-gray-400">实时监控与分析。</p></div>
    </section>
  </main>
</body>
</html>`,
    dashboard: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nexo Analytics - 智能数据分析平台</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { font-family: 'Outfit', system-ui, sans-serif; }
    .glass { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(148, 163, 184, 0.1); }
    .glass-light { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.06); }
    .stat-card { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    .stat-card:hover { transform: translateY(-8px) scale(1.02); }
    .glow-cyan { box-shadow: 0 0 60px rgba(34, 211, 238, 0.15), 0 0 100px rgba(34, 211, 238, 0.05); }
    .glow-violet { box-shadow: 0 0 60px rgba(139, 92, 246, 0.15), 0 0 100px rgba(139, 92, 246, 0.05); }
    .glow-amber { box-shadow: 0 0 60px rgba(251, 191, 36, 0.15), 0 0 100px rgba(251, 191, 36, 0.05); }
    .glow-rose { box-shadow: 0 0 60px rgba(251, 113, 133, 0.15), 0 0 100px rgba(251, 113, 133, 0.05); }
    @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-10px) rotate(2deg); } }
    @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
    @keyframes gradient-shift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @keyframes bar-grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
    .float { animation: float 6s ease-in-out infinite; }
    .gradient-animate { background-size: 200% 200%; animation: gradient-shift 8s ease infinite; }
    .shimmer { background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%); background-size: 200% 100%; animation: shimmer 2s infinite; }
    .bar-animate { transform-origin: bottom; animation: bar-grow 1s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
    .noise { background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); opacity: 0.02; }
    .progress-ring { stroke-dasharray: 251.2; stroke-dashoffset: calc(251.2 - (251.2 * var(--progress)) / 100); transition: stroke-dashoffset 1s ease; }
  </style>
</head>
<body class="bg-[#030712] text-white min-h-screen overflow-x-hidden">
  <!-- 背景效果 -->
  <div class="fixed inset-0 pointer-events-none overflow-hidden">
    <div class="absolute inset-0 noise"></div>
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-cyan-500/10 via-violet-500/5 to-transparent rounded-full blur-3xl"></div>
    <div class="absolute top-1/4 -left-40 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-3xl float" style="animation-delay: -2s"></div>
    <div class="absolute bottom-0 right-0 w-[600px] h-[600px] bg-cyan-600/8 rounded-full blur-3xl float" style="animation-delay: -4s"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.03)_0%,transparent_70%)]"></div>
  </div>

  <div class="flex relative min-h-screen">
    <!-- 侧边栏 -->
    <aside class="w-72 min-h-screen bg-[#0a0f1a]/80 backdrop-blur-xl border-r border-white/5 p-6 fixed z-20">
      <!-- Logo -->
      <div class="flex items-center gap-3 mb-10">
        <div class="relative">
          <div class="absolute inset-0 bg-gradient-to-br from-cyan-400 to-violet-500 rounded-xl blur-lg opacity-60"></div>
          <div class="relative w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
        </div>
        <div>
          <div class="font-bold text-lg tracking-tight">Nexo</div>
          <div class="text-[10px] text-slate-500 uppercase tracking-[0.2em]">Analytics</div>
        </div>
      </div>
      
      <!-- 导航菜单 -->
      <div class="text-[10px] text-slate-500 uppercase tracking-[0.15em] mb-4 px-3 font-medium">导航</div>
      <nav class="space-y-1.5">
        <a href="#" class="group flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500/20 via-violet-500/10 to-transparent text-cyan-400 border border-cyan-500/20 relative overflow-hidden">
          <div class="absolute inset-0 shimmer"></div>
          <div class="relative w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
          </div>
          <span class="font-medium relative">数据概览</span>
        </a>
        <a href="#" class="group flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
          <div class="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center group-hover:bg-slate-700/80 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
          </div>
          <span>趋势分析</span>
        </a>
        <a href="#" class="group flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
          <div class="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center group-hover:bg-slate-700/80 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/></svg>
          </div>
          <span>用户管理</span>
        </a>
        <a href="#" class="group flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
          <div class="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center group-hover:bg-slate-700/80 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
          </div>
          <span>交易记录</span>
        </a>
        <a href="#" class="group flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
          <div class="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center group-hover:bg-slate-700/80 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          </div>
          <span>产品库存</span>
        </a>
      </nav>
      
      <div class="text-[10px] text-slate-500 uppercase tracking-[0.15em] mb-4 px-3 mt-8 font-medium">系统</div>
      <nav class="space-y-1.5">
        <a href="#" class="group flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
          <div class="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center group-hover:bg-slate-700/80 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <span>系统设置</span>
        </a>
      </nav>

      <!-- 用户信息 -->
      <div class="absolute bottom-6 left-6 right-6">
        <div class="glass-light rounded-2xl p-4 relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-violet-500/5"></div>
          <div class="relative flex items-center gap-3">
            <div class="relative">
              <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-400 via-pink-500 to-violet-500"></div>
              <div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0a0f1a]"></div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm truncate">张小明</div>
              <div class="text-xs text-slate-500 truncate">admin@nexo.io</div>
            </div>
            <button class="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="ml-72 flex-1 p-8 min-h-screen relative">
      <!-- 顶部栏 -->
      <div class="flex items-center justify-between mb-10">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-3xl font-bold tracking-tight">数据概览</h1>
            <span class="px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 rounded-full text-xs font-medium text-cyan-400 uppercase tracking-wider">Live</span>
          </div>
          <p class="text-slate-500">实时监控您的业务数据和关键指标</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="relative group">
            <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
            <input type="search" placeholder="搜索..." class="relative bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 pl-11 text-sm focus:outline-none focus:border-cyan-500/50 w-72 transition-all placeholder:text-slate-500">
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <button class="relative p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-700/50 transition-all group">
            <svg class="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            <span class="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#030712]"></span>
          </button>
          <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-400 via-pink-500 to-violet-500 cursor-pointer hover:scale-105 transition-transform shadow-lg shadow-pink-500/25"></div>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-4 gap-5 mb-8">
        <!-- 总收入 -->
        <div class="stat-card glass-light rounded-2xl p-6 glow-cyan relative overflow-hidden group">
          <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div class="relative">
            <div class="flex items-center justify-between mb-5">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
              <div class="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-400/10 rounded-lg">
                <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                <span class="text-emerald-400 text-sm font-semibold">12.5%</span>
              </div>
            </div>
            <div class="text-slate-400 text-sm mb-2 font-medium">总收入</div>
            <div class="text-4xl font-bold bg-gradient-to-r from-cyan-300 to-cyan-500 bg-clip-text text-transparent mb-1">¥128,430</div>
            <div class="text-xs text-slate-500 flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              较上月增长 ¥14,280
            </div>
          </div>
        </div>
        
        <!-- 活跃用户 -->
        <div class="stat-card glass-light rounded-2xl p-6 glow-violet relative overflow-hidden group">
          <div class="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div class="relative">
            <div class="flex items-center justify-between mb-5">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          </div>
              <div class="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-400/10 rounded-lg">
                <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                <span class="text-emerald-400 text-sm font-semibold">8.2%</span>
              </div>
            </div>
            <div class="text-slate-400 text-sm mb-2 font-medium">活跃用户</div>
            <div class="text-4xl font-bold text-white mb-1">2,845</div>
            <div class="text-xs text-slate-500 flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
              日活 1,234 · 周活 2,156
            </div>
          </div>
        </div>
        
        <!-- 订单数量 -->
        <div class="stat-card glass-light rounded-2xl p-6 glow-amber relative overflow-hidden group">
          <div class="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div class="relative">
            <div class="flex items-center justify-between mb-5">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          </div>
              <div class="flex items-center gap-1.5 px-2.5 py-1 bg-rose-400/10 rounded-lg">
                <svg class="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                <span class="text-rose-400 text-sm font-semibold">3.1%</span>
              </div>
            </div>
            <div class="text-slate-400 text-sm mb-2 font-medium">订单数量</div>
            <div class="text-4xl font-bold text-white mb-1">1,234</div>
            <div class="text-xs text-slate-500 flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              待处理 56 · 已完成 1,178
            </div>
          </div>
        </div>
        
        <!-- 转化率 -->
        <div class="stat-card glass-light rounded-2xl p-6 glow-rose relative overflow-hidden group">
          <div class="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div class="relative">
            <div class="flex items-center justify-between mb-5">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
          </div>
              <div class="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-400/10 rounded-lg">
                <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                <span class="text-emerald-400 text-sm font-semibold">1.2%</span>
              </div>
            </div>
            <div class="text-slate-400 text-sm mb-2 font-medium">转化率</div>
            <div class="text-4xl font-bold text-white mb-1">4.28%</div>
            <div class="text-xs text-slate-500 flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              目标 5% · 差距 0.72%
            </div>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="grid grid-cols-3 gap-5 mb-8">
        <!-- 收入趋势图 -->
        <div class="col-span-2 glass-light rounded-2xl p-6 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-60 h-60 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl"></div>
          <div class="relative">
            <div class="flex items-center justify-between mb-8">
            <div>
                <h3 class="font-bold text-xl mb-1">收入趋势</h3>
                <p class="text-slate-500 text-sm">最近7天收入变化</p>
            </div>
              <div class="flex gap-1.5 p-1 bg-slate-800/50 rounded-xl">
                <button class="px-4 py-2 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-cyan-500/20">周</button>
                <button class="px-4 py-2 text-slate-400 hover:text-white rounded-lg text-sm font-medium transition-colors">月</button>
                <button class="px-4 py-2 text-slate-400 hover:text-white rounded-lg text-sm font-medium transition-colors">年</button>
            </div>
          </div>
            <!-- 图表 -->
            <div class="flex items-end justify-between h-52 gap-3 px-2">
              <div class="flex-1 flex flex-col items-center gap-3">
                <div class="relative w-full h-full flex items-end">
                  <div class="bar-animate w-full bg-gradient-to-t from-cyan-500 via-cyan-400 to-violet-400 rounded-xl opacity-90 hover:opacity-100 transition-opacity cursor-pointer" style="height: 60%; animation-delay: 0.1s"></div>
            </div>
                <span class="text-xs text-slate-500 font-medium">周一</span>
            </div>
              <div class="flex-1 flex flex-col items-center gap-3">
                <div class="relative w-full h-full flex items-end">
                  <div class="bar-animate w-full bg-gradient-to-t from-cyan-500 via-cyan-400 to-violet-400 rounded-xl opacity-90 hover:opacity-100 transition-opacity cursor-pointer" style="height: 80%; animation-delay: 0.2s"></div>
            </div>
                <span class="text-xs text-slate-500 font-medium">周二</span>
            </div>
              <div class="flex-1 flex flex-col items-center gap-3">
                <div class="relative w-full h-full flex items-end">
                  <div class="bar-animate w-full bg-gradient-to-t from-cyan-500 via-cyan-400 to-violet-400 rounded-xl opacity-90 hover:opacity-100 transition-opacity cursor-pointer" style="height: 45%; animation-delay: 0.3s"></div>
            </div>
                <span class="text-xs text-slate-500 font-medium">周三</span>
            </div>
              <div class="flex-1 flex flex-col items-center gap-3">
                <div class="relative w-full h-full flex items-end">
                  <div class="bar-animate w-full bg-gradient-to-t from-cyan-500 via-cyan-400 to-violet-400 rounded-xl opacity-90 hover:opacity-100 transition-opacity cursor-pointer" style="height: 90%; animation-delay: 0.4s"></div>
            </div>
                <span class="text-xs text-slate-500 font-medium">周四</span>
              </div>
              <div class="flex-1 flex flex-col items-center gap-3">
                <div class="relative w-full h-full flex items-end">
                  <div class="bar-animate w-full bg-gradient-to-t from-cyan-500 via-cyan-400 to-violet-400 rounded-xl opacity-90 hover:opacity-100 transition-opacity cursor-pointer" style="height: 70%; animation-delay: 0.5s"></div>
                </div>
                <span class="text-xs text-slate-500 font-medium">周五</span>
              </div>
              <div class="flex-1 flex flex-col items-center gap-3">
                <div class="relative w-full h-full flex items-end">
                  <div class="bar-animate w-full bg-gradient-to-t from-cyan-500 via-violet-400 to-pink-400 rounded-xl hover:opacity-100 transition-opacity cursor-pointer" style="height: 100%; animation-delay: 0.6s"></div>
                </div>
                <span class="text-xs text-white font-semibold">周六</span>
              </div>
              <div class="flex-1 flex flex-col items-center gap-3">
                <div class="relative w-full h-full flex items-end">
                  <div class="bar-animate w-full bg-gradient-to-t from-slate-600 to-slate-500 rounded-xl opacity-50 cursor-pointer" style="height: 55%; animation-delay: 0.7s"></div>
                </div>
                <span class="text-xs text-slate-500 font-medium">周日</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 进度环形图 -->
        <div class="glass-light rounded-2xl p-6 relative overflow-hidden">
          <div class="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-violet-500/10 to-transparent rounded-full blur-2xl"></div>
          <div class="relative">
            <h3 class="font-bold text-xl mb-6">月度目标</h3>
            <div class="flex flex-col items-center">
              <div class="relative w-44 h-44 mb-6">
                <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(148,163,184,0.1)" stroke-width="8"/>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="url(#gradient)" stroke-width="8" stroke-linecap="round" class="progress-ring" style="--progress: 72"/>
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="#22d3ee"/>
                      <stop offset="100%" stop-color="#a78bfa"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="text-4xl font-bold">72%</span>
                  <span class="text-slate-500 text-sm">已完成</span>
                </div>
              </div>
              <div class="w-full space-y-3">
                <div class="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
            <div class="flex items-center gap-3">
                    <div class="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
                    <span class="text-sm text-slate-300">销售额</span>
              </div>
                  <span class="text-sm font-semibold">¥92,430</span>
            </div>
                <div class="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
            <div class="flex items-center gap-3">
                    <div class="w-2.5 h-2.5 rounded-full bg-violet-400"></div>
                    <span class="text-sm text-slate-300">目标</span>
                  </div>
                  <span class="text-sm font-semibold">¥128,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部区域 -->
      <div class="grid grid-cols-3 gap-5">
        <!-- 热门产品 -->
        <div class="glass-light rounded-2xl p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-xl">热门产品</h3>
            <button class="text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors">查看全部</button>
          </div>
          <div class="space-y-4">
            <div class="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20 group-hover:scale-110 transition-transform">📱</div>
              <div class="flex-1">
                <div class="font-semibold mb-0.5">iPhone 15 Pro</div>
                <div class="text-xs text-slate-500">销量 234 件</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-emerald-400">¥28.4k</div>
                <div class="text-xs text-slate-500">收入</div>
            </div>
            </div>
            <div class="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">💻</div>
              <div class="flex-1">
                <div class="font-semibold mb-0.5">MacBook Pro</div>
                <div class="text-xs text-slate-500">销量 156 件</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-emerald-400">¥45.6k</div>
                <div class="text-xs text-slate-500">收入</div>
            </div>
            </div>
            <div class="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform">🎧</div>
              <div class="flex-1">
                <div class="font-semibold mb-0.5">AirPods Pro</div>
                <div class="text-xs text-slate-500">销量 423 件</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-emerald-400">¥12.3k</div>
                <div class="text-xs text-slate-500">收入</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近活动 -->
        <div class="col-span-2 glass-light rounded-2xl p-6">
        <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-xl">最近活动</h3>
            <button class="text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors">查看全部 →</button>
        </div>
          <div class="space-y-3">
            <div class="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-all cursor-pointer group">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              </div>
            <div class="flex-1">
                <div class="font-semibold mb-0.5">新用户注册</div>
                <div class="text-sm text-slate-500">用户 张三 完成了注册流程</div>
            </div>
            <div class="text-right">
                <div class="text-emerald-400 font-semibold">+1 用户</div>
                <div class="text-xs text-slate-500">2 分钟前</div>
            </div>
          </div>
            <div class="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-all cursor-pointer group">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
            <div class="flex-1">
                <div class="font-semibold mb-0.5">订单支付成功</div>
                <div class="text-sm text-slate-500">订单 #ORD-2024-5678 已完成支付</div>
            </div>
            <div class="text-right">
                <div class="text-emerald-400 font-semibold">+¥2,999</div>
                <div class="text-xs text-slate-500">15 分钟前</div>
            </div>
          </div>
            <div class="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-all cursor-pointer group">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
              </div>
            <div class="flex-1">
                <div class="font-semibold mb-0.5">商品发货</div>
                <div class="text-sm text-slate-500">订单 #ORD-2024-5632 已发货</div>
            </div>
            <div class="text-right">
                <div class="text-cyan-400 font-semibold">配送中</div>
                <div class="text-xs text-slate-500">1 小时前</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</body>
</html>`,
    form: `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>登录</title><script src="https://cdn.tailwindcss.com"></script><style>.glass{background:rgba(255,255,255,0.05);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1)}</style></head>
<body class="min-h-screen flex items-center justify-center p-6" style="background: linear-gradient(135deg, ${theme.primary}30, ${theme.secondary}30), linear-gradient(to br, #1a1a2e, #16213e)"><div class="w-full max-w-md"><div class="glass rounded-3xl p-8 shadow-2xl"><div class="text-center mb-8"><div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" style="background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary})"><span class="text-2xl">🔐</span></div><h1 class="text-2xl font-bold text-white mb-2">欢迎回来</h1><p class="text-gray-400">请登录您的账户</p></div><form class="space-y-6"><div><label class="block text-gray-300 text-sm mb-2">邮箱</label><input type="email" placeholder="your@email.com" class="w-full px-4 py-3 glass rounded-xl text-white placeholder-gray-500 focus:outline-none"></div><div><label class="block text-gray-300 text-sm mb-2">密码</label><input type="password" placeholder="••••••••" class="w-full px-4 py-3 glass rounded-xl text-white placeholder-gray-500 focus:outline-none"></div><button type="submit" class="w-full py-4 text-white font-semibold rounded-xl" style="background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary})">登录</button></form></div></div></body>
</html>`,
    cards: `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>卡片</title><script src="https://cdn.tailwindcss.com"></script><style>.glass{background:rgba(255,255,255,0.05);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1)}</style></head>
<body class="bg-gradient-to-br ${theme.bg} text-white min-h-screen p-8"><div class="max-w-6xl mx-auto"><h1 class="text-4xl font-bold text-center mb-12">精选内容</h1><div class="grid md:grid-cols-3 gap-8"><div class="glass rounded-2xl overflow-hidden hover:scale-105 transition-transform"><div class="h-48 bg-gradient-to-br from-pink-500 to-violet-600"></div><div class="p-6"><h3 class="text-xl font-bold mb-3">卡片标题</h3><p class="text-gray-400 text-sm">这是描述文字。</p></div></div><div class="glass rounded-2xl overflow-hidden hover:scale-105 transition-transform"><div class="h-48 bg-gradient-to-br from-cyan-500 to-blue-600"></div><div class="p-6"><h3 class="text-xl font-bold mb-3">另一个标题</h3><p class="text-gray-400 text-sm">探索更多内容。</p></div></div><div class="glass rounded-2xl overflow-hidden hover:scale-105 transition-transform"><div class="h-48 bg-gradient-to-br from-amber-500 to-orange-600"></div><div class="p-6"><h3 class="text-xl font-bold mb-3">第三个卡片</h3><p class="text-gray-400 text-sm">极致体验。</p></div></div></div></div></body>
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
      <div className="text-center backdrop-blur-lg bg-white/5 p-12 rounded-3xl border border-white/10">
        <h1 className="text-7xl font-bold text-white mb-4">{count}</h1>
        <p className="text-purple-200 mb-8">点击按钮增加计数</p>
        <div className="flex gap-4 justify-center">
          <button onClick={() => setCount(c => c - 1)} className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition">-1</button>
          <button onClick={() => setCount(c => c + 1)} className="px-8 py-4 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-xl transition shadow-lg shadow-purple-500/30">+1</button>
        </div>
      </div>
    </div>
  )
}
export default App`
  } else if (lowerPrompt.includes('todo') || lowerPrompt.includes('待办')) {
    componentCode = `import { useState } from 'react'

interface Todo { id: number; text: string; completed: boolean }

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')

  const addTodo = () => { if (!input.trim()) return; setTodos([...todos, { id: Date.now(), text: input, completed: false }]); setInput('') }
  const toggleTodo = (id: number) => { setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t)) }
  const deleteTodo = (id: number) => { setTodos(todos.filter(t => t.id !== id)) }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">待办事项 ✓</h1>
        <div className="flex gap-2 mb-6">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTodo()} placeholder="添加新任务..." className="flex-1 px-4 py-3 bg-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button onClick={addTodo} className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition">添加</button>
        </div>
        <div className="space-y-3">
          {todos.map(todo => (
            <div key={todo.id} className={\`flex items-center gap-3 p-4 bg-slate-700/50 rounded-xl \${todo.completed ? 'opacity-60' : ''}\`}>
              <button onClick={() => toggleTodo(todo.id)} className={\`w-6 h-6 rounded-full border-2 flex items-center justify-center transition \${todo.completed ? 'bg-green-500 border-green-500' : 'border-slate-500'}\`}>{todo.completed && <span className="text-white text-sm">✓</span>}</button>
              <span className={\`flex-1 text-white \${todo.completed ? 'line-through' : ''}\`}>{todo.text}</span>
              <button onClick={() => deleteTodo(todo.id)} className="text-slate-400 hover:text-red-400 transition text-xl">×</button>
            </div>
          ))}
          {todos.length === 0 && <p className="text-center text-slate-500 py-8">暂无任务</p>}
        </div>
      </div>
    </div>
  )
}
export default App`
  } else if (lowerPrompt.includes('dashboard') || lowerPrompt.includes('仪表') || lowerPrompt.includes('后台')) {
    componentCode = `import { useState } from 'react'

const menuItems = [
  { id: 'overview', icon: '📊', label: '数据概览' },
  { id: 'trends', icon: '📈', label: '趋势分析' },
  { id: 'users', icon: '👥', label: '用户管理' },
  { id: 'transactions', icon: '💳', label: '交易记录' },
]

const stats = [
  { icon: '💰', label: '总收入', value: '¥128,430', change: '+12.5%', positive: true, color: 'from-cyan-400 to-cyan-600' },
  { icon: '👥', label: '活跃用户', value: '2,845', change: '+8.2%', positive: true, color: 'from-violet-400 to-violet-600' },
  { icon: '📦', label: '订单数量', value: '1,234', change: '-3.1%', positive: false, color: 'from-amber-400 to-orange-500' },
  { icon: '📈', label: '转化率', value: '4.28%', change: '+1.2%', positive: true, color: 'from-rose-400 to-pink-600' },
]

const chartData = [
  { day: '周一', value: 60 }, { day: '周二', value: 80 }, { day: '周三', value: 45 },
  { day: '周四', value: 90 }, { day: '周五', value: 70 }, { day: '周六', value: 100 }, { day: '周日', value: 55 },
]

const activities = [
  { icon: '✓', title: '新用户注册', desc: '用户 张三 完成了注册', time: '2分钟前', amount: '+1 用户', color: 'from-emerald-400 to-emerald-600' },
  { icon: '💰', title: '订单支付成功', desc: '订单 #ORD-2024-5678', time: '15分钟前', amount: '+¥2,999', color: 'from-cyan-400 to-blue-600' },
  { icon: '📦', title: '商品发货', desc: '订单 #ORD-2024-5632', time: '1小时前', amount: '配送中', color: 'from-amber-400 to-orange-600' },
]

const pageContent: Record<string, { title: string; desc: string }> = {
  overview: { title: '数据概览', desc: '实时监控您的业务数据' },
  trends: { title: '趋势分析', desc: '查看数据变化趋势和预测' },
  users: { title: '用户管理', desc: '管理用户账户和权限' },
  transactions: { title: '交易记录', desc: '查看所有交易历史记录' },
}

function App() {
  const [activeMenu, setActiveMenu] = useState('overview')
  const [activeTab, setActiveTab] = useState('week')
  
  const currentPage = pageContent[activeMenu]
  
  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-cyan-500/10 via-violet-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      <div className="flex relative min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-[#0a0f1a]/80 backdrop-blur-xl border-r border-white/5 p-5 fixed">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-lg">⚡</div>
            <div>
              <div className="font-bold">Nexo</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">Analytics</div>
            </div>
          </div>
          
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all \${activeMenu === item.id ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}\`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="absolute bottom-5 left-5 right-5 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500" />
              <div>
                <div className="font-medium text-sm">张小明</div>
                <div className="text-xs text-slate-500">admin@nexo.io</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="ml-64 flex-1 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold mb-1">{currentPage.title}</h1>
              <p className="text-slate-500 text-sm">{currentPage.desc}</p>
            </div>
            <div className="flex items-center gap-3">
              <input type="search" placeholder="搜索..." className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2 pl-10 text-sm w-64" />
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 cursor-pointer hover:scale-105 transition-transform" />
            </div>
          </div>

          {activeMenu === 'overview' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-5 mb-8">
                {stats.map((stat, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:translate-y-[-4px] transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                      <div className={\`w-12 h-12 rounded-xl bg-gradient-to-br \${stat.color} flex items-center justify-center text-xl shadow-lg\`}>{stat.icon}</div>
                      <span className={\`text-sm font-medium px-2 py-1 rounded-lg \${stat.positive ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}\`}>{stat.change}</span>
                    </div>
                    <div className="text-slate-400 text-sm mb-1">{stat.label}</div>
                    <div className="text-3xl font-bold">{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="grid grid-cols-3 gap-5 mb-8">
                <div className="col-span-2 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-lg">收入趋势</h3>
                      <p className="text-slate-500 text-sm">最近7天收入变化</p>
                    </div>
                    <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg">
                      {['week', 'month', 'year'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={\`px-4 py-2 rounded-lg text-sm font-medium transition-all \${activeTab === tab ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white' : 'text-slate-400 hover:text-white'}\`}>
                          {tab === 'week' ? '周' : tab === 'month' ? '月' : '年'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-end justify-between h-48 gap-3">
                    {chartData.map((item, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-gradient-to-t from-cyan-500 via-cyan-400 to-violet-400 rounded-xl hover:opacity-100 opacity-80 transition-opacity cursor-pointer" style={{ height: \`\${item.value}%\` }} />
                        <span className={\`text-xs \${item.value === 100 ? 'text-white font-semibold' : 'text-slate-500'}\`}>{item.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress */}
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <h3 className="font-bold text-lg mb-6">月度目标</h3>
                  <div className="flex flex-col items-center">
                    <div className="relative w-36 h-36 mb-4">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="8"/>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="url(#grad)" strokeWidth="8" strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset="70"/>
                        <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#22d3ee"/><stop offset="100%" stopColor="#a78bfa"/></linearGradient></defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold">72%</span>
                        <span className="text-slate-500 text-sm">已完成</span>
                      </div>
                    </div>
                    <div className="w-full space-y-2">
                      <div className="flex justify-between p-3 bg-slate-800/30 rounded-xl text-sm">
                        <span className="text-slate-400">销售额</span>
                        <span className="font-semibold">¥92,430</span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-800/30 rounded-xl text-sm">
                        <span className="text-slate-400">目标</span>
                        <span className="font-semibold">¥128,000</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activities */}
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg">最近活动</h3>
                  <button className="text-cyan-400 text-sm hover:text-cyan-300">查看全部 →</button>
                </div>
                <div className="space-y-3">
                  {activities.map((act, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-all cursor-pointer group">
                      <div className={\`w-12 h-12 rounded-xl bg-gradient-to-br \${act.color} flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform\`}>{act.icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold">{act.title}</div>
                        <div className="text-slate-500 text-sm">{act.desc}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-semibold">{act.amount}</div>
                        <div className="text-slate-500 text-xs">{act.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeMenu === 'trends' && (
            <div className="p-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
              <div className="text-6xl mb-6">📈</div>
              <h2 className="text-2xl font-bold mb-3">趋势分析</h2>
              <p className="text-slate-400 max-w-md mx-auto">这里展示数据趋势分析图表和预测。点击左侧菜单可以切换不同页面。</p>
            </div>
          )}

          {activeMenu === 'users' && (
            <div className="p-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
              <div className="text-6xl mb-6">👥</div>
              <h2 className="text-2xl font-bold mb-3">用户管理</h2>
              <p className="text-slate-400 max-w-md mx-auto">这里可以管理用户账户、权限设置和用户分组。</p>
            </div>
          )}

          {activeMenu === 'transactions' && (
            <div className="p-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
              <div className="text-6xl mb-6">💳</div>
              <h2 className="text-2xl font-bold mb-3">交易记录</h2>
              <p className="text-slate-400 max-w-md mx-auto">这里展示所有交易历史记录和账单明细。</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
export default App`
  } else {
    componentCode = `import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="fixed top-0 w-full backdrop-blur-lg bg-slate-900/50 border-b border-slate-700 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Brand</span>
          <button className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium text-white hover:opacity-90 transition">开始使用</button>
        </div>
      </nav>
      <main className="pt-32 pb-20 px-6">
        <section className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-2 rounded-full text-sm mb-6 bg-purple-500/20 text-purple-300">✨ AI 生成</span>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">构建下一代<span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> 产品体验</span></h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">React + Vite 构建的现代化应用</p>
          <button onClick={() => setCount(c => c + 1)} className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-lg text-white hover:opacity-90 transition shadow-lg shadow-purple-500/30">点击计数: {count}</button>
        </section>
        <section className="max-w-6xl mx-auto mt-32 grid md:grid-cols-3 gap-6">
          {[{ icon: '⚡', title: '极速', desc: 'Vite 驱动' }, { icon: '🔥', title: 'React 18', desc: '最新特性' }, { icon: '🎨', title: 'Tailwind', desc: '原子化 CSS' }].map((item, i) => (
            <div key={i} className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 transition">
              <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6 text-2xl">{item.icon}</div>
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
  return files.map(f => f.path === 'src/App.tsx' ? { ...f, content: componentCode } : f)
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
    <div class="text-center backdrop-blur-lg bg-white/5 p-12 rounded-3xl border border-white/10">
      <h1 class="text-7xl font-bold text-white mb-4">{{ count }}</h1>
      <p class="text-emerald-200 mb-8">点击按钮增加计数</p>
      <div class="flex gap-4 justify-center">
        <button @click="count--" class="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition">-1</button>
        <button @click="count++" class="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition shadow-lg shadow-emerald-500/30">+1</button>
      </div>
    </div>
  </div>
</template>`
  } else if (lowerPrompt.includes('dashboard') || lowerPrompt.includes('仪表') || lowerPrompt.includes('后台')) {
    componentCode = `<script setup lang="ts">
import { ref, computed } from 'vue'

const activeMenu = ref('overview')
const activeTab = ref('week')

const menuItems = [
  { id: 'overview', icon: '📊', label: '数据概览' },
  { id: 'trends', icon: '📈', label: '趋势分析' },
  { id: 'users', icon: '👥', label: '用户管理' },
  { id: 'transactions', icon: '💳', label: '交易记录' },
]

const pageContent: Record<string, { title: string; desc: string }> = {
  overview: { title: '数据概览', desc: '实时监控您的业务数据' },
  trends: { title: '趋势分析', desc: '查看数据变化趋势和预测' },
  users: { title: '用户管理', desc: '管理用户账户和权限' },
  transactions: { title: '交易记录', desc: '查看所有交易历史记录' },
}

const currentPage = computed(() => pageContent[activeMenu.value])

const stats = [
  { icon: '💰', label: '总收入', value: '¥128,430', change: '+12.5%', positive: true, color: 'from-cyan-400 to-cyan-600' },
  { icon: '👥', label: '活跃用户', value: '2,845', change: '+8.2%', positive: true, color: 'from-violet-400 to-violet-600' },
  { icon: '📦', label: '订单数量', value: '1,234', change: '-3.1%', positive: false, color: 'from-amber-400 to-orange-500' },
  { icon: '📈', label: '转化率', value: '4.28%', change: '+1.2%', positive: true, color: 'from-rose-400 to-pink-600' },
]

const chartData = [
  { day: '周一', value: 60 }, { day: '周二', value: 80 }, { day: '周三', value: 45 },
  { day: '周四', value: 90 }, { day: '周五', value: 70 }, { day: '周六', value: 100 }, { day: '周日', value: 55 },
]

const activities = [
  { icon: '✓', title: '新用户注册', desc: '用户 张三 完成了注册', time: '2分钟前', amount: '+1 用户', color: 'from-emerald-400 to-emerald-600' },
  { icon: '💰', title: '订单支付成功', desc: '订单 #ORD-2024-5678', time: '15分钟前', amount: '+¥2,999', color: 'from-cyan-400 to-blue-600' },
  { icon: '📦', title: '商品发货', desc: '订单 #ORD-2024-5632', time: '1小时前', amount: '配送中', color: 'from-amber-400 to-orange-600' },
]
</script>
<template>
  <div class="min-h-screen bg-[#030712] text-white">
    <!-- Background -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-cyan-500/10 via-violet-500/5 to-transparent rounded-full blur-3xl" />
      <div class="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-3xl" />
    </div>

    <div class="flex relative min-h-screen">
      <!-- Sidebar -->
      <aside class="w-64 min-h-screen bg-[#0a0f1a]/80 backdrop-blur-xl border-r border-white/5 p-5 fixed">
        <div class="flex items-center gap-3 mb-8">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-lg">⚡</div>
          <div>
            <div class="font-bold">Nexo</div>
            <div class="text-[10px] text-slate-500 uppercase tracking-widest">Analytics</div>
          </div>
        </div>
        
        <nav class="space-y-1">
          <button
            v-for="item in menuItems"
            :key="item.id"
            @click="activeMenu = item.id"
            :class="['w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left', activeMenu === item.id ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white']"
          >
            <span class="text-lg">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </button>
        </nav>
        
        <div class="absolute bottom-5 left-5 right-5 p-4 rounded-xl bg-white/5 border border-white/10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500" />
            <div>
              <div class="font-medium text-sm">张小明</div>
              <div class="text-xs text-slate-500">admin@nexo.io</div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main -->
      <main class="ml-64 flex-1 p-8">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-2xl font-bold mb-1">{{ currentPage.title }}</h1>
            <p class="text-slate-500 text-sm">{{ currentPage.desc }}</p>
          </div>
          <div class="flex items-center gap-3">
            <input type="search" placeholder="搜索..." class="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2 pl-10 text-sm w-64" />
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 cursor-pointer hover:scale-105 transition-transform" />
          </div>
        </div>

        <!-- Overview Content -->
        <template v-if="activeMenu === 'overview'">
          <!-- Stats -->
          <div class="grid grid-cols-4 gap-5 mb-8">
            <div v-for="(stat, i) in stats" :key="i" class="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:translate-y-[-4px] transition-all duration-300">
              <div class="flex items-center justify-between mb-4">
                <div :class="['w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl shadow-lg', stat.color]">{{ stat.icon }}</div>
                <span :class="['text-sm font-medium px-2 py-1 rounded-lg', stat.positive ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10']">{{ stat.change }}</span>
              </div>
              <div class="text-slate-400 text-sm mb-1">{{ stat.label }}</div>
              <div class="text-3xl font-bold">{{ stat.value }}</div>
            </div>
          </div>

          <!-- Chart -->
          <div class="grid grid-cols-3 gap-5 mb-8">
            <div class="col-span-2 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h3 class="font-bold text-lg">收入趋势</h3>
                  <p class="text-slate-500 text-sm">最近7天收入变化</p>
                </div>
                <div class="flex gap-1 p-1 bg-slate-800/50 rounded-lg">
                  <button v-for="tab in ['week', 'month', 'year']" :key="tab" @click="activeTab = tab" :class="['px-4 py-2 rounded-lg text-sm font-medium transition-all', activeTab === tab ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white' : 'text-slate-400 hover:text-white']">
                    {{ tab === 'week' ? '周' : tab === 'month' ? '月' : '年' }}
                  </button>
                </div>
              </div>
              <div class="flex items-end justify-between h-48 gap-3">
                <div v-for="(item, i) in chartData" :key="i" class="flex-1 flex flex-col items-center gap-2">
                  <div class="w-full bg-gradient-to-t from-cyan-500 via-cyan-400 to-violet-400 rounded-xl hover:opacity-100 opacity-80 transition-opacity cursor-pointer" :style="{ height: item.value + '%' }" />
                  <span :class="['text-xs', item.value === 100 ? 'text-white font-semibold' : 'text-slate-500']">{{ item.day }}</span>
                </div>
              </div>
            </div>

            <!-- Progress -->
            <div class="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <h3 class="font-bold text-lg mb-6">月度目标</h3>
              <div class="flex flex-col items-center">
                <div class="relative w-36 h-36 mb-4">
                  <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(148,163,184,0.1)" stroke-width="8"/>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="url(#vueGrad)" stroke-width="8" stroke-linecap="round" stroke-dasharray="251.2" stroke-dashoffset="70"/>
                    <defs><linearGradient id="vueGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#a78bfa"/></linearGradient></defs>
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-3xl font-bold">72%</span>
                    <span class="text-slate-500 text-sm">已完成</span>
                  </div>
                </div>
                <div class="w-full space-y-2">
                  <div class="flex justify-between p-3 bg-slate-800/30 rounded-xl text-sm">
                    <span class="text-slate-400">销售额</span>
                    <span class="font-semibold">¥92,430</span>
                  </div>
                  <div class="flex justify-between p-3 bg-slate-800/30 rounded-xl text-sm">
                    <span class="text-slate-400">目标</span>
                    <span class="font-semibold">¥128,000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Activities -->
          <div class="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div class="flex items-center justify-between mb-6">
              <h3 class="font-bold text-lg">最近活动</h3>
              <button class="text-cyan-400 text-sm hover:text-cyan-300">查看全部 →</button>
            </div>
            <div class="space-y-3">
              <div v-for="(act, i) in activities" :key="i" class="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-all cursor-pointer group">
                <div :class="['w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform', act.color]">{{ act.icon }}</div>
                <div class="flex-1">
                  <div class="font-semibold">{{ act.title }}</div>
                  <div class="text-slate-500 text-sm">{{ act.desc }}</div>
                </div>
                <div class="text-right">
                  <div class="text-emerald-400 font-semibold">{{ act.amount }}</div>
                  <div class="text-slate-500 text-xs">{{ act.time }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Trends Content -->
        <div v-else-if="activeMenu === 'trends'" class="p-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
          <div class="text-6xl mb-6">📈</div>
          <h2 class="text-2xl font-bold mb-3">趋势分析</h2>
          <p class="text-slate-400 max-w-md mx-auto">这里展示数据趋势分析图表和预测。点击左侧菜单可以切换不同页面。</p>
        </div>

        <!-- Users Content -->
        <div v-else-if="activeMenu === 'users'" class="p-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
          <div class="text-6xl mb-6">👥</div>
          <h2 class="text-2xl font-bold mb-3">用户管理</h2>
          <p class="text-slate-400 max-w-md mx-auto">这里可以管理用户账户、权限设置和用户分组。</p>
        </div>

        <!-- Transactions Content -->
        <div v-else-if="activeMenu === 'transactions'" class="p-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
          <div class="text-6xl mb-6">💳</div>
          <h2 class="text-2xl font-bold mb-3">交易记录</h2>
          <p class="text-slate-400 max-w-md mx-auto">这里展示所有交易历史记录和账单明细。</p>
        </div>
      </main>
    </div>
  </div>
</template>`
  } else {
    componentCode = `<script setup lang="ts">
import { ref } from 'vue'
const count = ref(0)
const features = [{ icon: '🍃', title: 'Vue 3', desc: '组合式 API' }, { icon: '⚡', title: 'Vite', desc: '极速开发' }, { icon: '🎨', title: 'Tailwind', desc: '原子化样式' }]
</script>
<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
    <nav class="fixed top-0 w-full backdrop-blur-lg bg-slate-900/50 border-b border-slate-700 z-50">
      <div class="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <span class="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Brand</span>
        <button class="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-medium text-white hover:opacity-90 transition">开始使用</button>
      </div>
    </nav>
    <main class="pt-32 pb-20 px-6">
      <section class="max-w-4xl mx-auto text-center">
        <span class="inline-block px-4 py-2 rounded-full text-sm mb-6 bg-emerald-500/20 text-emerald-300">🍃 AI 生成</span>
        <h1 class="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">构建下一代<span class="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent"> 产品体验</span></h1>
        <p class="text-xl text-slate-400 max-w-2xl mx-auto mb-10">Vue 3 + Vite 构建的现代化应用</p>
        <button @click="count++" class="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-semibold text-lg text-white hover:opacity-90 transition shadow-lg shadow-emerald-500/30">点击计数: {{ count }}</button>
      </section>
      <section class="max-w-6xl mx-auto mt-32 grid md:grid-cols-3 gap-6">
        <div v-for="(item, i) in features" :key="i" class="p-8 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 transition">
          <div class="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-6 text-2xl">{{ item.icon }}</div>
          <h3 class="text-xl font-semibold text-white mb-3">{{ item.title }}</h3>
          <p class="text-slate-400">{{ item.desc }}</p>
        </div>
      </section>
    </main>
  </div>
</template>`
  }
  return files.map(f => f.path === 'src/App.vue' ? { ...f, content: componentCode } : f)
}

type RightPanelTab = 'preview' | 'code'

// 项目类型图标和颜色
const projectTypeConfig = {
  html: { icon: '🌐', color: 'from-orange-500 to-amber-500', bgGlow: 'bg-orange-500/20', label: 'HTML', desc: '纯静态页面' },
  react: { icon: '⚛️', color: 'from-cyan-400 to-blue-500', bgGlow: 'bg-cyan-500/20', label: 'React', desc: 'Vite + React 18' },
  vue: { icon: '🍃', color: 'from-emerald-400 to-teal-500', bgGlow: 'bg-emerald-500/20', label: 'Vue', desc: 'Vite + Vue 3' },
}

export default function AICodeGenerator() {
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [projectType, setProjectType] = useState<ProjectType>('html')
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([])
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>('preview')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishStatus, setPublishStatus] = useState('')
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null)
  const [urlCopied, setUrlCopied] = useState(false)

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
        content: `✨ 已生成 ${projectTypeConfig[projectType].label} 项目！共 ${files.length} 个文件。您可以在右侧预览效果，或切换到"文件"标签编辑代码。`,
      }
      setMessages(prev => [...prev, assistantMessage])
      setProjectFiles(files)
      setActiveFile(files[0]?.path || null)
      setPublishedUrl(null)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，生成代码时出现错误，请重试。' }])
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
    setProjectFiles(files => files.map(f => f.path === path ? { ...f, content } : f))
  }

  const handleFileCreate = (path: string, language: ProjectFile['language']) => {
    setProjectFiles(files => [...files, { path, content: '', language }])
    setActiveFile(path)
  }

  const handleFileDelete = (path: string) => {
    setProjectFiles(files => files.filter(f => f.path !== path))
    if (activeFile === path) setActiveFile(projectFiles[0]?.path || null)
  }

  const downloadProject = () => {
    if (projectType === 'html' && projectFiles.length > 0) {
      const htmlFile = projectFiles.find(f => f.path === 'index.html')
      if (htmlFile) {
        const blob = new Blob([htmlFile.content], { type: 'text/html' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'index.html'
        a.click()
      }
    } else {
      const blob = new Blob([JSON.stringify({ type: projectType, files: projectFiles }, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'project.json'
      a.click()
    }
  }

  const handlePublish = async () => {
    if (projectFiles.length === 0) return
    setIsPublishing(true)
    setPublishStatus('正在准备发布...')
    
    try {
      let filesToDeploy: { path: string; content: string }[] = []
      
      if (projectType === 'html') {
        // HTML 项目：合并文件后发布
        const htmlFile = projectFiles.find(f => f.path === 'index.html')
        const cssFile = projectFiles.find(f => f.path === 'style.css')
        const jsFile = projectFiles.find(f => f.path === 'main.js')
        
        let htmlContent = htmlFile?.content || ''
        if (cssFile) htmlContent = htmlContent.replace(/<link[^>]*href=["']style\.css["'][^>]*>/gi, `<style>${cssFile.content}</style>`)
        if (jsFile) htmlContent = htmlContent.replace(/<script[^>]*src=["']main\.js["'][^>]*><\/script>/gi, `<script>${jsFile.content}</script>`)
        
        filesToDeploy = [{ path: 'index.html', content: htmlContent }]
      } else {
        // React/Vue 项目需要先构建
        setPublishStatus('正在构建项目...')
        
        const { buildProject } = await import('../lib/webcontainer')
        
        const buildResult = await buildProject(
          projectFiles,
          projectType,
          (status) => {
            setPublishStatus(status.message)
          },
          (log) => {
            console.log('[Build]', log)
          }
        )
        
        if (!buildResult.success) {
          alert('构建失败: ' + (buildResult.error || '未知错误'))
          setPublishStatus('')
          return
        }
        
        filesToDeploy = buildResult.files
        setPublishStatus(`构建完成，共 ${filesToDeploy.length} 个文件，正在部署...`)
      }
      
      // 使用静态站点 API 部署
      console.log('[Publish] 正在部署站点，文件数:', filesToDeploy.length)
      const res = await api.deploySite({ 
        files: filesToDeploy,
        project_type: projectType,
      })
      console.log('[Publish] 部署响应:', res)
      
      if (res.success && res.data) {
        console.log('[Publish] 部署成功:', res.data.url)
        setPublishedUrl(res.data.url)
        setPublishStatus('')
      } else {
        console.error('[Publish] 部署失败:', res.error)
        alert('部署失败: ' + (res.error || '未知错误'))
        setPublishStatus('')
      }
    } catch (err) {
      console.error('Publish error:', err)
      alert('发布失败: ' + (err instanceof Error ? err.message : '未知错误'))
      setPublishStatus('')
    } finally {
      setIsPublishing(false)
    }
  }

  const clearProject = () => {
    setMessages([])
    setProjectFiles([])
    setActiveFile(null)
    setPublishedUrl(null)
    setRightPanelTab('preview')
  }

  const quickPrompts = [
    { icon: '🚀', label: 'Landing Page', prompt: '创建一个现代的产品着陆页', gradient: 'from-violet-500 to-purple-600' },
    { icon: '📊', label: 'Dashboard', prompt: '创建一个数据仪表盘页面', gradient: 'from-blue-500 to-cyan-500' },
    { icon: '🔐', label: '登录页面', prompt: '创建一个漂亮的登录表单', gradient: 'from-amber-500 to-orange-500' },
    { icon: '✅', label: 'Todo 应用', prompt: '创建一个待办事项应用', gradient: 'from-emerald-500 to-teal-500' },
  ]

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-surface-950">
        <WebContainerPreview
          files={projectFiles}
          projectType={projectType}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(false)}
        />
      </div>
    )
  }

  return (
    <div className="pt-16 pb-4 min-h-screen relative overflow-hidden">
      {/* 背景装饰 - 赛博朋克风格 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* 主渐变光晕 - 更强烈的色彩 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-gradient-to-b from-nexo-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-20 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-purple-600/15 to-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-0 -right-40 w-[800px] h-[800px] bg-gradient-to-tl from-cyan-500/15 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-emerald-500/5 to-nexo-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        
        {/* 网格背景 - 更明显 */}
        <div className="absolute inset-0 bg-grid opacity-40" />
        
        {/* 扫描线效果 */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,136,0.02)_50%)] bg-[length:100%_4px] animate-scan" style={{ animationDuration: '8s' }} />
        
        {/* 装饰性光点 - 更多更炫 */}
        <div className="absolute top-28 left-[15%] w-2 h-2 bg-nexo-400 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute top-40 right-[20%] w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
        <div className="absolute bottom-32 left-[25%] w-2 h-2 bg-cyan-400 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1s' }} />
        <div className="absolute top-60 left-[40%] w-1 h-1 bg-pink-400 rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '1.5s' }} />
        <div className="absolute bottom-48 right-[35%] w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" style={{ animationDuration: '3.5s', animationDelay: '2s' }} />
        
        {/* 流动的光线效果 */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-nexo-500/50 to-transparent animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent animate-pulse" style={{ animationDuration: '4s' }} />
      </div>

      <div className="max-w-[1920px] mx-auto px-4 relative">
        {/* Header - 紧凑的设计 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* 动态图标 - 更紧凑 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-nexo-500 to-emerald-500 rounded-xl blur-md opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-nexo-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-nexo-500/40 group-hover:scale-110 transition-transform">
                <Wand2 className="w-6 h-6 text-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse shadow-lg shadow-purple-500/50">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight bg-gradient-to-r from-white to-white/80 bg-clip-text">AI 代码生成器</h1>
                <span className="px-2 py-0.5 bg-gradient-to-r from-nexo-500/30 to-purple-500/30 border border-nexo-500/40 rounded-md text-[10px] font-bold text-nexo-400 uppercase tracking-wider animate-pulse">
                  Live
                </span>
              </div>
              <p className="text-surface-400 text-sm flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                描述您的想法，AI 将为您生成完整的前端项目
              </p>
            </div>
          </div>
          
          {/* 右侧快捷入口 */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-800/50 rounded-lg border border-surface-700/50">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-surface-400">WebContainer 运行中</span>
            </div>
          </div>
        </div>

        {/* 项目类型选择器 - 紧凑的胶囊设计 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-surface-500 text-xs">
            <Layers className="w-3.5 h-3.5" />
            <span>类型</span>
          </div>
          <div className="flex items-center gap-2 p-1 bg-surface-900/80 rounded-xl border border-surface-700/50">
          {allTemplates.map(template => {
            const config = projectTypeConfig[template.type]
            const isActive = projectType === template.type
            return (
              <button
                key={template.type}
                onClick={() => {
                  setProjectType(template.type)
                  if (projectFiles.length === 0) {
                    setProjectFiles(template.files)
                    setActiveFile(template.entryFile)
                  }
                }}
                className={`relative group flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? 'text-white shadow-lg' 
                    : 'text-surface-400 hover:text-white hover:bg-surface-800/60'
                }`}
              >
                {/* 活跃状态的渐变背景 */}
                {isActive && (
                  <>
                    <div className={`absolute inset-0 bg-gradient-to-r ${config.color} rounded-lg`} />
                    <div className={`absolute inset-0 bg-gradient-to-r ${config.color} rounded-lg blur-md opacity-60`} />
                  </>
                )}
                
                <span className="relative text-lg group-hover:scale-110 transition-transform">{config.icon}</span>
                <span className="relative font-medium text-sm">{config.label}</span>
              </button>
            )
          })}
          </div>
          
          {/* 分隔线 */}
          <div className="h-6 w-px bg-surface-700/50" />
          
          {/* 快速模板按钮 */}
          <div className="hidden md:flex items-center gap-2">
            {quickPrompts.slice(0, 3).map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setInputValue(item.prompt)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-800/50 hover:bg-surface-700/60 border border-surface-700/50 hover:border-surface-600 rounded-lg text-sm text-surface-400 hover:text-white transition-all group"
              >
                <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="hidden xl:inline">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 发布成功提示 - 紧凑但醒目 */}
        {publishedUrl && (
          <div className="relative overflow-hidden glass rounded-xl p-4 mb-4 border border-nexo-500/50 animate-fade-in">
            {/* 背景光效 */}
            <div className="absolute inset-0 bg-gradient-to-r from-nexo-500/15 to-emerald-500/15" />
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-nexo-500/30 rounded-full blur-2xl" />
            
            <div className="relative flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-nexo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-nexo-500/40 flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                    <div className="text-white font-bold flex items-center gap-2">
                      🎉 发布成功!
                    </div>
                <code className="text-nexo-400 text-xs font-mono truncate max-w-[300px]">{publishedUrl}</code>
              </div>
              
              <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(publishedUrl)
                    setUrlCopied(true)
                    setTimeout(() => setUrlCopied(false), 2000)
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                    urlCopied 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-white border border-surface-600'
                  }`}
                >
                  {urlCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span className="hidden sm:inline">{urlCopied ? '已复制' : '复制'}</span>
                </button>
                <a
                  href={publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-nexo-500 to-emerald-500 hover:from-nexo-600 hover:to-emerald-600 text-white font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-nexo-500/30 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  访问
                </a>
              </div>
            </div>
          </div>
        )}

        {/* 主内容区域 - 预览区域更大 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 左侧面板 - AI 对话 (占 4 列) */}
          <div className="lg:col-span-4 xl:col-span-3 glass rounded-xl overflow-hidden flex flex-col h-[calc(100vh-200px)] min-h-[600px] shadow-2xl shadow-black/30 border border-surface-700/30">
            {/* 标题栏 - 更紧凑 */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-700/50 bg-surface-900/70">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <div className="h-3 w-px bg-surface-700 mx-1" />
                <MessageSquare className="w-3.5 h-3.5 text-nexo-400" />
                <span className="text-xs text-surface-300 font-medium">AI 助手</span>
              </div>
              <button
                onClick={clearProject}
                className="p-1.5 hover:bg-surface-700/80 rounded-md transition-colors text-surface-400 hover:text-red-400 group"
                title="清空项目"
              >
                <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* 内容区 */}
            <div className="flex-1 overflow-hidden">
              <div className="flex flex-col h-full">
                  {/* 消息列表 */}
                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-5">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6">
                        {/* 空状态插画 */}
                        <div className="relative mb-8">
                          <div className="absolute inset-0 bg-gradient-to-br from-nexo-500/20 to-purple-500/20 rounded-full blur-2xl scale-150" />
                          <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-surface-800 to-surface-900 border border-surface-700/50 flex items-center justify-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-nexo-500/20 to-purple-500/20 flex items-center justify-center">
                              <Sparkles className="w-10 h-10 text-nexo-400" />
                          </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg animate-bounce" style={{ animationDuration: '2s' }}>
                              <Zap className="w-4 h-4 text-white" />
                        </div>
                            <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
                              <Code className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-white mb-3">开始创作</h3>
                        <p className="text-surface-400 max-w-sm mb-10">
                          描述您想要的页面设计，AI 将智能生成完整的代码
                        </p>
                        
                        {/* 快速提示 - 更吸引人的卡片 */}
                        <div className="w-full max-w-md">
                          <div className="text-xs text-surface-500 mb-4 flex items-center gap-2 justify-center">
                            <Palette className="w-3.5 h-3.5" />
                            快速模板
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {quickPrompts.map((item) => (
                              <button
                                key={item.label}
                                onClick={() => setInputValue(item.prompt)}
                                className="relative overflow-hidden group p-4 bg-surface-800/50 hover:bg-surface-700/60 border border-surface-700/50 hover:border-surface-600 rounded-xl text-left transition-all duration-300"
                              >
                                {/* 悬停时的渐变背景 */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                                
                                <div className="relative flex items-center gap-3">
                                  <span className="text-2xl group-hover:scale-125 transition-transform duration-300">{item.icon}</span>
                                  <span className="text-sm font-medium text-surface-300 group-hover:text-white transition-colors">{item.label}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {message.role === 'assistant' && (
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nexo-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-nexo-500/20">
                              <Bot className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${
                              message.role === 'user'
                                ? 'bg-gradient-to-r from-nexo-500 to-emerald-500 text-white shadow-lg shadow-nexo-500/20'
                                : 'bg-surface-800/80 text-surface-200 border border-surface-700/50'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          </div>
                          {message.role === 'user' && (
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-surface-700 to-surface-800 flex items-center justify-center flex-shrink-0 border border-surface-600">
                              <User className="w-5 h-5 text-surface-300" />
                            </div>
                          )}
                        </div>
                      ))
                    )}

                    {/* 生成中状态 */}
                    {isGenerating && (
                      <div className="flex gap-3 animate-fade-in">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nexo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-nexo-500/20">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="bg-surface-800/80 rounded-2xl px-5 py-4 border border-surface-700/50">
                          <div className="flex items-center gap-4 text-surface-300">
                            <div className="flex gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-nexo-400 to-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-nexo-400 to-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-nexo-400 to-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-sm font-medium">AI 正在生成代码...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 输入区 - 更精致的设计 */}
                  <div className="p-4 border-t border-surface-700/50 bg-surface-900/50">
                    {/* 快捷操作栏 - 类似 Teams 风格 */}
                    {projectFiles.length > 0 && (
                      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-surface-700/30">
                        <button
                          onClick={handlePublish}
                          disabled={isPublishing}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-nexo-500/20 to-emerald-500/20 hover:from-nexo-500/30 hover:to-emerald-500/30 text-nexo-400 hover:text-nexo-300 text-sm rounded-lg transition-all border border-nexo-500/30 hover:border-nexo-500/50 disabled:opacity-50"
                          title={publishStatus || '发布到线上'}
                        >
                          {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
                          <span>{isPublishing ? '发布中...' : '发布'}</span>
                        </button>
                        <button
                          onClick={downloadProject}
                          className="flex items-center gap-2 px-3 py-1.5 bg-surface-800/60 hover:bg-surface-700/80 text-surface-400 hover:text-white text-sm rounded-lg transition-all border border-surface-700/50 hover:border-surface-600"
                          title="下载项目文件"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>下载</span>
                        </button>
                        <div className="flex-1" />
                        <span className="text-xs text-surface-500">
                          {projectFiles.length} 个文件
                        </span>
                      </div>
                    )}
                    
                    {/* 输入框 */}
                    <div className="flex gap-3">
                      <div className="flex-1 relative group">
                        <textarea
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="描述您想要的页面设计..."
                          rows={2}
                          className="w-full px-4 py-3 bg-surface-800/60 border border-surface-700/50 rounded-xl text-white placeholder-surface-500 resize-none focus:outline-none focus:border-nexo-500/50 focus:ring-2 focus:ring-nexo-500/20 transition-all text-sm"
                        />
                        <div className="absolute bottom-2 right-3 text-xs text-surface-500 flex items-center gap-1.5">
                          <kbd className="px-1.5 py-0.5 bg-surface-700/80 rounded border border-surface-600 text-surface-400 text-[10px]">Enter</kbd>
                          <span>发送</span>
                        </div>
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isGenerating}
                        className="px-5 bg-gradient-to-r from-nexo-500 to-emerald-500 hover:from-nexo-600 hover:to-emerald-600 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-nexo-500/20 disabled:shadow-none hover:scale-[1.02] disabled:hover:scale-100"
                      >
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
            </div>
          </div>

          {/* 右侧面板 - 预览 & 代码 (占 8-9 列，更大的预览区) */}
          <div className="lg:col-span-8 xl:col-span-9 glass rounded-xl overflow-hidden flex flex-col h-[calc(100vh-200px)] min-h-[600px] shadow-2xl shadow-black/30 border border-surface-700/30">
            {/* 标签栏 - 更紧凑 */}
            <div className="flex items-center border-b border-surface-700/50 bg-surface-900/70">
              <div className="flex items-center gap-1 px-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <div className="h-3 w-px bg-surface-700 mx-2" />
              
              {/* Tab 切换按钮 */}
              <button
                onClick={() => setRightPanelTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-all relative ${
                  rightPanelTab === 'preview' ? 'text-white' : 'text-surface-400 hover:text-white hover:bg-surface-800/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>预览</span>
                {rightPanelTab === 'preview' && (
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-nexo-500 to-emerald-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setRightPanelTab('code')}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-all relative ${
                  rightPanelTab === 'code' ? 'text-white' : 'text-surface-400 hover:text-white hover:bg-surface-800/50'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>代码</span>
                {projectFiles.length > 0 && (
                  <span className={`px-1.5 py-0.5 text-xs rounded-md ml-1 ${rightPanelTab === 'code' ? 'bg-nexo-500/20 text-nexo-400' : 'bg-surface-700 text-surface-400'}`}>
                    {projectFiles.length}
                  </span>
                )}
                {rightPanelTab === 'code' && (
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-nexo-500 to-emerald-500 rounded-full" />
                )}
              </button>
              
              <div className="flex-1" />
              
              {/* 项目类型标签 */}
              {projectFiles.length > 0 && (
                <span className={`px-2 py-1 ${projectTypeConfig[projectType].bgGlow} text-xs rounded-md font-medium flex items-center gap-1 mr-2`}>
                  <span>{projectTypeConfig[projectType].icon}</span>
                  <span className="text-white/90">{projectTypeConfig[projectType].label}</span>
                </span>
              )}
              
              {/* 全屏按钮 */}
              {projectFiles.length > 0 && rightPanelTab === 'preview' && (
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="p-1.5 mr-2 hover:bg-surface-700/80 rounded-md transition-colors text-surface-400 hover:text-white group"
                  title="全屏预览"
                >
                  <Maximize2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              )}
            </div>
            
            {/* 内容区 */}
            <div className="flex-1 overflow-hidden bg-surface-950">
              {rightPanelTab === 'preview' ? (
                <WebContainerPreview
                  files={projectFiles}
                  projectType={projectType}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={() => setIsFullscreen(true)}
                />
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
        </div>
      </div>
    </div>
  )
}

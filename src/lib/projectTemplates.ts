// 项目模板系统
// 支持 HTML、React、Vue 三种项目类型

export type ProjectType = 'html' | 'react' | 'vue'

export interface ProjectFile {
  path: string
  content: string
  language: 'html' | 'css' | 'javascript' | 'typescript' | 'jsx' | 'tsx' | 'vue' | 'json'
}

export interface ProjectTemplate {
  type: ProjectType
  name: string
  description: string
  files: ProjectFile[]
  entryFile: string
  buildCommand?: string
  devCommand?: string
}

// HTML 单页模板
export const htmlTemplate: ProjectTemplate = {
  type: 'html',
  name: 'HTML 页面',
  description: '简单的 HTML/CSS/JS 单页应用',
  entryFile: 'index.html',
  files: [
    {
      path: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>我的页面</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-slate-900 text-white min-h-screen">
  <div id="app" class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <h1 class="text-4xl font-bold mb-4">Hello, World!</h1>
      <p class="text-slate-400">开始编辑您的页面</p>
      <button id="btn" class="mt-6 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-lg transition">
        点击我
      </button>
    </div>
  </div>
  <script src="main.js"></script>
</body>
</html>`,
    },
    {
      path: 'style.css',
      language: 'css',
      content: `/* 自定义样式 */
body {
  font-family: system-ui, -apple-system, sans-serif;
}

.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}`,
    },
    {
      path: 'main.js',
      language: 'javascript',
      content: `// 主要逻辑
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btn');
  let count = 0;
  
  btn.addEventListener('click', () => {
    count++;
    btn.textContent = \`已点击 \${count} 次\`;
    btn.classList.add('fade-in');
  });
  
  console.log('页面已加载');
});`,
    },
  ],
}

// React + Vite 模板
export const reactTemplate: ProjectTemplate = {
  type: 'react',
  name: 'React + Vite',
  description: '现代化的 React 项目，使用 Vite 构建',
  entryFile: 'src/App.tsx',
  devCommand: 'npm run dev',
  buildCommand: 'npm run build',
  files: [
    {
      path: 'package.json',
      language: 'json',
      content: JSON.stringify({
        name: 'ai-generated-react-app',
        private: true,
        version: '0.0.1',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {
          react: '^18.3.1',
          'react-dom': '^18.3.1',
        },
        devDependencies: {
          '@types/react': '^18.3.12',
          '@types/react-dom': '^18.3.1',
          '@vitejs/plugin-react': '^4.3.4',
          'autoprefixer': '^10.4.20',
          'postcss': '^8.4.49',
          'tailwindcss': '^3.4.17',
          typescript: '^5.7.2',
          vite: '^6.0.3',
        },
      }, null, 2),
    },
    {
      path: 'vite.config.ts',
      language: 'typescript',
      content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`,
    },
    {
      path: 'tailwind.config.js',
      language: 'javascript',
      content: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
    },
    {
      path: 'postcss.config.js',
      language: 'javascript',
      content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
    },
    {
      path: 'tsconfig.json',
      language: 'json',
      content: JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true,
        },
        include: ['src'],
      }, null, 2),
    },
    {
      path: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
    },
    {
      path: 'src/main.tsx',
      language: 'tsx',
      content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
    },
    {
      path: 'src/App.tsx',
      language: 'tsx',
      content: `import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-6">
          React + Vite ⚡
        </h1>
        <p className="text-slate-400 mb-8">
          AI 生成的 React 应用
        </p>
        <button
          onClick={() => setCount(c => c + 1)}
          className="px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/30"
        >
          点击次数: {count}
        </button>
      </div>
    </div>
  )
}

export default App`,
    },
    {
      path: 'src/index.css',
      language: 'css',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
}`,
    },
  ],
}

// Vue + Vite 模板
export const vueTemplate: ProjectTemplate = {
  type: 'vue',
  name: 'Vue + Vite',
  description: '现代化的 Vue 3 项目，使用 Vite 构建',
  entryFile: 'src/App.vue',
  devCommand: 'npm run dev',
  buildCommand: 'npm run build',
  files: [
    {
      path: 'package.json',
      language: 'json',
      content: JSON.stringify({
        name: 'ai-generated-vue-app',
        private: true,
        version: '0.0.1',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {
          vue: '^3.5.13',
        },
        devDependencies: {
          '@vitejs/plugin-vue': '^5.2.1',
          'autoprefixer': '^10.4.20',
          'postcss': '^8.4.49',
          'tailwindcss': '^3.4.17',
          typescript: '^5.7.2',
          vite: '^6.0.3',
          'vue-tsc': '^2.1.10',
        },
      }, null, 2),
    },
    {
      path: 'vite.config.ts',
      language: 'typescript',
      content: `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})`,
    },
    {
      path: 'tailwind.config.js',
      language: 'javascript',
      content: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
    },
    {
      path: 'postcss.config.js',
      language: 'javascript',
      content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
    },
    {
      path: 'tsconfig.json',
      language: 'json',
      content: JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          module: 'ESNext',
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'preserve',
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true,
        },
        include: ['src/**/*.ts', 'src/**/*.vue'],
      }, null, 2),
    },
    {
      path: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`,
    },
    {
      path: 'src/main.ts',
      language: 'typescript',
      content: `import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

createApp(App).mount('#app')`,
    },
    {
      path: 'src/App.vue',
      language: 'vue',
      content: `<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-emerald-900 to-teal-800 flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-5xl font-bold text-white mb-6">
        Vue 3 + Vite 🍃
      </h1>
      <p class="text-emerald-200 mb-8">
        AI 生成的 Vue 应用
      </p>
      <button
        @click="count++"
        class="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/30"
      >
        点击次数: {{ count }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 组件样式 */
</style>`,
    },
    {
      path: 'src/style.css',
      language: 'css',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
}`,
    },
  ],
}

// 获取模板
export function getTemplate(type: ProjectType): ProjectTemplate {
  switch (type) {
    case 'react':
      return reactTemplate
    case 'vue':
      return vueTemplate
    case 'html':
    default:
      return htmlTemplate
  }
}

// 所有模板
export const allTemplates: ProjectTemplate[] = [htmlTemplate, reactTemplate, vueTemplate]


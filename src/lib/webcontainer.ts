/**
 * WebContainer 管理器
 * 
 * 使用 StackBlitz 的 WebContainers API 在浏览器中运行完整的 Node.js 环境
 * 可以启动 Vite 开发服务器来预览 React/Vue 项目
 */

import { WebContainer, FileSystemTree } from '@webcontainer/api'
import { ProjectFile, ProjectType } from './projectTemplates'

// WebContainer 单例
let webcontainerInstance: WebContainer | null = null
let isBooting = false
let bootPromise: Promise<WebContainer> | null = null

/**
 * 获取或创建 WebContainer 实例
 */
export async function getWebContainer(): Promise<WebContainer> {
  if (webcontainerInstance) {
    return webcontainerInstance
  }

  if (isBooting && bootPromise) {
    return bootPromise
  }

  isBooting = true
  bootPromise = WebContainer.boot()
  
  try {
    webcontainerInstance = await bootPromise
    console.log('WebContainer booted successfully')
    return webcontainerInstance
  } finally {
    isBooting = false
  }
}

/**
 * 将 ProjectFile 数组转换为 WebContainer 文件系统树
 */
export function filesToFileSystemTree(files: ProjectFile[]): FileSystemTree {
  const tree: FileSystemTree = {}

  for (const file of files) {
    const parts = file.path.split('/')
    let current = tree

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isLast = i === parts.length - 1

      if (isLast) {
        // 文件
        current[part] = {
          file: {
            contents: file.content,
          },
        }
      } else {
        // 目录
        if (!current[part]) {
          current[part] = {
            directory: {},
          }
        }
        const node = current[part]
        if ('directory' in node) {
          current = node.directory
        }
      }
    }
  }

  return tree
}

/**
 * React 项目的 Tailwind 配置
 */
export const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`

/**
 * PostCSS 配置
 */
export const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`

/**
 * 获取 React 项目的完整文件列表（包含 Tailwind）
 */
export function getReactProjectFiles(appCode: string): ProjectFile[] {
  return [
    {
      path: 'package.json',
      language: 'json',
      content: JSON.stringify({
        name: 'vite-react-app',
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@vitejs/plugin-react': '^4.2.0',
          autoprefixer: '^10.4.16',
          postcss: '^8.4.32',
          tailwindcss: '^3.4.0',
          typescript: '^5.3.0',
          vite: '^5.0.0',
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
        },
        include: ['src'],
      }, null, 2),
    },
    {
      path: 'tailwind.config.js',
      language: 'javascript',
      content: tailwindConfig,
    },
    {
      path: 'postcss.config.js',
      language: 'javascript',
      content: postcssConfig,
    },
    {
      path: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
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
      content: appCode,
    },
    {
      path: 'src/index.css',
      language: 'css',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;`,
    },
  ]
}

/**
 * 获取 Vue 项目的完整文件列表（包含 Tailwind）
 */
export function getVueProjectFiles(appCode: string): ProjectFile[] {
  return [
    {
      path: 'package.json',
      language: 'json',
      content: JSON.stringify({
        name: 'vite-vue-app',
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {
          vue: '^3.4.0',
        },
        devDependencies: {
          '@vitejs/plugin-vue': '^5.0.0',
          autoprefixer: '^10.4.16',
          postcss: '^8.4.32',
          tailwindcss: '^3.4.0',
          typescript: '^5.3.0',
          vite: '^5.0.0',
          'vue-tsc': '^1.8.0',
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
        },
        include: ['src/**/*.ts', 'src/**/*.vue'],
      }, null, 2),
    },
    {
      path: 'tailwind.config.js',
      language: 'javascript',
      content: tailwindConfig,
    },
    {
      path: 'postcss.config.js',
      language: 'javascript',
      content: postcssConfig,
    },
    {
      path: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
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
      content: appCode,
    },
    {
      path: 'src/style.css',
      language: 'css',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;`,
    },
  ]
}

export interface WebContainerStatus {
  state: 'idle' | 'booting' | 'installing' | 'starting' | 'ready' | 'error'
  message: string
  url?: string
}

export type StatusCallback = (status: WebContainerStatus) => void
export type LogCallback = (log: string) => void

/**
 * 在 WebContainer 中运行 Vite 项目
 */
export async function runViteProject(
  files: ProjectFile[],
  _projectType: ProjectType,
  onStatus: StatusCallback,
  onLog: LogCallback,
): Promise<{ url: string; stop: () => void }> {
  onStatus({ state: 'booting', message: '正在启动 WebContainer...' })
  onLog('[System] 启动 WebContainer 环境...')

  const container = await getWebContainer()

  onStatus({ state: 'installing', message: '正在写入项目文件...' })
  onLog('[System] 写入项目文件...')

  // 转换文件为文件系统树
  const fileTree = filesToFileSystemTree(files)
  await container.mount(fileTree)

  onLog('[System] 项目文件写入完成')
  onLog(`[System] 共 ${files.length} 个文件`)

  onStatus({ state: 'installing', message: '正在安装依赖 (pnpm install)...' })
  onLog('[pnpm] 安装依赖中...')

  // 安装依赖 - 使用 pnpm
  const installProcess = await container.spawn('pnpm', ['install', '--prefer-offline'])

  // 监听安装输出
  installProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        // 清理 ANSI 转义码和特殊字符，避免乱码
        const cleanData = data
          .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '') // 移除 ANSI 转义码
          .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F]/g, '') // 移除控制字符
          .trim()
        if (cleanData) {
          onLog(`[pnpm] ${cleanData}`)
        }
      },
    })
  )

  const installExitCode = await installProcess.exit

  if (installExitCode !== 0) {
    onStatus({ state: 'error', message: '依赖安装失败' })
    onLog(`[Error] pnpm install 失败，退出码: ${installExitCode}`)
    throw new Error(`pnpm install failed with exit code ${installExitCode}`)
  }

  onLog('[pnpm] 依赖安装完成')
  onStatus({ state: 'starting', message: '正在启动 Vite 开发服务器...' })
  onLog('[vite] 启动开发服务器...')

  // 启动 Vite 开发服务器
  const devProcess = await container.spawn('pnpm', ['run', 'dev'])

  // 监听 Vite 输出
  devProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        // 清理 ANSI 转义码和特殊字符，避免乱码
        const cleanData = data
          .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '') // 移除 ANSI 转义码
          .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F]/g, '') // 移除控制字符
          .trim()
        if (cleanData) {
          onLog(`[vite] ${cleanData}`)
        }
      },
    })
  )

  // 等待服务器就绪
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Vite 服务器启动超时'))
    }, 60000) // 60 秒超时

    container.on('server-ready', (_port, url) => {
      clearTimeout(timeout)
      onLog(`[vite] 服务器就绪: ${url}`)
      onStatus({ state: 'ready', message: '开发服务器已就绪', url })
      
      resolve({
        url,
        stop: () => {
          devProcess.kill()
        },
      })
    })

    container.on('error', (error) => {
      clearTimeout(timeout)
      onLog(`[Error] ${error.message}`)
      onStatus({ state: 'error', message: error.message })
      reject(error)
    })
  })
}

/**
 * 更新 WebContainer 中的单个文件
 */
export async function updateFile(path: string, content: string): Promise<void> {
  const container = await getWebContainer()
  await container.fs.writeFile(path, content)
}

/**
 * 销毁 WebContainer 实例
 */
export async function teardownWebContainer(): Promise<void> {
  if (webcontainerInstance) {
    await webcontainerInstance.teardown()
    webcontainerInstance = null
  }
}


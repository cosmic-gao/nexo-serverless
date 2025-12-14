// 环境变量工具函数

/**
 * 获取 API 基础 URL
 * 在浏览器环境中从 import.meta.env 读取，在 Node.js 中从 process.env 读取
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // 浏览器环境
    // @ts-ignore - import.meta.env 在 Vite 环境中可用
    const viteEnv = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {} as Record<string, any>
    return (viteEnv.VITE_API_URL as string) || 'http://localhost:3000'
  } else {
    // Node.js 环境
    // @ts-ignore - process 在 Node.js 环境中可用
    const nodeEnv = typeof process !== 'undefined' ? process.env : {} as Record<string, any>
    return (nodeEnv.API_URL || nodeEnv.VITE_API_URL || 'http://localhost:3000') as string
  }
}


// API client for Nexo Serverless Runtime

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface Function {
  id: string
  name: string
  code: string
  route: string
  methods: string[]
  env: Record<string, string>
  limits: {
    max_execution_time_ms: number
    max_memory_mb: number
    max_request_body_kb: number
  }
  created_at: string
  updated_at: string
  status: 'active' | 'inactive' | 'deploying' | 'error'
  invocations: number
  last_invoked_at: string | null
}

export interface CreateFunctionRequest {
  name: string
  code: string
  route: string
  methods?: string[]
  env?: Record<string, string>
  limits?: Partial<Function['limits']>
}

export interface UpdateFunctionRequest {
  name?: string
  code?: string
  route?: string
  methods?: string[]
  env?: Record<string, string>
  limits?: Partial<Function['limits']>
  status?: Function['status']
}

export interface PoolStats {
  total_executions: number
  successful_executions: number
  failed_executions: number
  total_execution_time_ms: number
  avg_execution_time_ms: number
  active_isolates: number
  max_concurrent: number
}

export interface InvokeResult {
  status: number
  body: unknown
  execution_time_ms: number
  function_id?: string
}

export interface DeployPreviewRequest {
  html: string
  name?: string
  route?: string
}

export interface DeploySiteRequest {
  files: { path: string; content: string }[]
  name?: string
  route?: string
}

export interface DeployPreviewResult {
  id: string
  route: string
  url: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

class NexoAPI {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      const data = await response.json()
      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Health check
  async health() {
    return this.request<{ status: string; version: string }>('/health')
  }

  // Get runtime statistics
  async getStats() {
    return this.request<PoolStats>('/stats')
  }

  // Function CRUD
  async listFunctions() {
    return this.request<Function[]>('/api/functions')
  }

  async getFunction(id: string) {
    return this.request<Function>(`/api/functions/${id}`)
  }

  async createFunction(data: CreateFunctionRequest) {
    return this.request<Function>('/api/functions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateFunction(id: string, data: UpdateFunctionRequest) {
    return this.request<Function>(`/api/functions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteFunction(id: string) {
    return this.request<void>(`/api/functions/${id}`, {
      method: 'DELETE',
    })
  }

  // Invoke function
  async invokeFunction(id: string, body?: unknown) {
    return this.request<InvokeResult>(`/api/functions/${id}/invoke`, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  // Invoke by route
  async invokeByRoute(route: string, method: string = 'GET', body?: unknown) {
    return this.request<InvokeResult>(`/fn${route}`, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  // Deploy static HTML preview
  async deployPreview(data: DeployPreviewRequest): Promise<ApiResponse<DeployPreviewResult>> {
    const timestamp = Date.now()
    const routePath = data.route || `/preview/${timestamp}`
    const functionName = data.name || `ai-preview-${timestamp}`
    
    // 创建一个函数来托管静态 HTML
    const functionCode = `// 静态 HTML 页面托管函数
// 由 AI 代码生成器创建

var htmlContent = ${JSON.stringify(data.html)};

function handler(request, ctx) {
  return new Response(htmlContent, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}`

    const res = await this.createFunction({
      name: functionName,
      code: functionCode,
      route: routePath,
      methods: ['GET'],
      env: {},
      limits: {
        max_execution_time_ms: 1000,
        max_memory_mb: 32,
        max_request_body_kb: 16,
      },
    })

    if (res.success && res.data) {
      return {
        success: true,
        data: {
          id: res.data.id,
          route: routePath,
          url: `${this.baseUrl}/fn${routePath}`,
        },
      }
    }

    return {
      success: false,
      error: res.error || '部署失败',
    }
  }

  // List deployed previews
  async listPreviews(): Promise<ApiResponse<Function[]>> {
    const res = await this.listFunctions()
    if (res.success && res.data) {
      const previews = res.data.filter(fn => fn.name.startsWith('ai-preview-'))
      return { success: true, data: previews }
    }
    return res
  }

  // Deploy static site with multiple files (built React/Vue project)
  async deploySite(data: DeploySiteRequest): Promise<ApiResponse<DeployPreviewResult>> {
    const timestamp = Date.now()
    const basePath = data.route || `/app/${timestamp}`
    // 使用通配符路由来匹配所有子路径
    const routePath = `${basePath}/*`
    const functionName = data.name || `ai-app-${timestamp}`
    
    // 构建文件映射
    const filesMap: Record<string, { content: string; mimeType: string }> = {}
    
    for (const file of data.files) {
      // 确定 MIME 类型
      let mimeType = 'application/octet-stream'
      const ext = file.path.split('.').pop()?.toLowerCase()
      
      switch (ext) {
        case 'html': mimeType = 'text/html; charset=utf-8'; break
        case 'css': mimeType = 'text/css; charset=utf-8'; break
        case 'js': mimeType = 'application/javascript; charset=utf-8'; break
        case 'mjs': mimeType = 'application/javascript; charset=utf-8'; break
        case 'json': mimeType = 'application/json; charset=utf-8'; break
        case 'svg': mimeType = 'image/svg+xml'; break
        case 'png': mimeType = 'image/png'; break
        case 'jpg': case 'jpeg': mimeType = 'image/jpeg'; break
        case 'gif': mimeType = 'image/gif'; break
        case 'webp': mimeType = 'image/webp'; break
        case 'ico': mimeType = 'image/x-icon'; break
        case 'woff': mimeType = 'font/woff'; break
        case 'woff2': mimeType = 'font/woff2'; break
        case 'ttf': mimeType = 'font/ttf'; break
        case 'eot': mimeType = 'application/vnd.ms-fontobject'; break
        case 'txt': mimeType = 'text/plain; charset=utf-8'; break
        case 'xml': mimeType = 'application/xml'; break
      }
      
      filesMap[file.path] = { content: file.content, mimeType }
    }
    
    // 创建一个可以处理多文件的函数
    // 使用 JSON.stringify 来安全地传递 basePath
    const functionCode = `// 静态站点托管函数
// 由 AI 代码生成器构建并部署

var files = ${JSON.stringify(filesMap)};
var BASE_PATH = ${JSON.stringify('/fn' + basePath)};

function handler(request, ctx) {
  // 解析请求路径，移除前缀
  var url = request.url || '';
  var path = url;
  
  // 移除 BASE_PATH 前缀
  if (path.indexOf(BASE_PATH) === 0) {
    path = path.substring(BASE_PATH.length);
  }
  
  // 移除开头的斜杠
  if (path.charAt(0) === '/') {
    path = path.substring(1);
  }
  
  // 如果路径为空，使用 index.html
  if (!path || path === '') {
    path = 'index.html';
  }
  
  // 如果路径不包含点（没有扩展名），尝试添加 index.html
  if (path.indexOf('.') === -1) {
    // 移除结尾的斜杠
    if (path.charAt(path.length - 1) === '/') {
      path = path.substring(0, path.length - 1);
    }
    path = path + '/index.html';
    // 再次移除开头的斜杠
    if (path.charAt(0) === '/') {
      path = path.substring(1);
    }
  }
  
  // 尝试直接匹配
  var file = files[path];
  
  // 如果没找到，返回 index.html (SPA fallback)
  if (!file) {
    file = files['index.html'];
  }
  
  if (file) {
    return new Response(file.content, {
      headers: {
        'Content-Type': file.mimeType,
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  }
  
  return new Response('404 Not Found', {
    status: 404,
    headers: { 'Content-Type': 'text/plain' }
  });
}`

    // 使用通配符路由来处理所有子路径
    const res = await this.createFunction({
      name: functionName,
      code: functionCode,
      route: routePath,
      methods: ['GET'],
      env: {},
      limits: {
        max_execution_time_ms: 1000,
        max_memory_mb: 64, // 增加内存限制以支持更多文件
        max_request_body_kb: 16,
      },
    })

    if (res.success && res.data) {
      return {
        success: true,
        data: {
          id: res.data.id,
          route: routePath,
          // 返回不带通配符的基础路径供用户访问
          url: `${this.baseUrl}/fn${basePath}/`,
        },
      }
    }

    return {
      success: false,
      error: res.error || '部署失败',
    }
  }
}

export const api = new NexoAPI()
export default api


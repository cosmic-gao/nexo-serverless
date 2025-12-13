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
  project_type?: string
}

export interface DeployPreviewResult {
  id: string
  route: string
  url: string
}

export interface DeploySiteResult {
  id: string
  name: string
  route: string
  url: string
  files_count: number
}

export interface Site {
  id: string
  name: string
  route: string
  files: { path: string; content: string; mime_type: string }[]
  project_type: string
  created_at: string
  updated_at: string
  visits: number
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

      const text = await response.text()
      
      // 尝试解析 JSON
      try {
        const data = JSON.parse(text)
        return data
      } catch {
        // 如果不是 JSON，返回错误
        console.error('API response is not JSON:', text)
        return {
          success: false,
          error: response.ok ? 'Invalid response format' : `HTTP ${response.status}: ${text}`,
        }
      }
    } catch (error) {
      console.error('API request failed:', error)
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

  // Deploy static site with multiple files (使用独立的静态站点存储)
  async deploySite(data: DeploySiteRequest): Promise<ApiResponse<DeploySiteResult>> {
    return this.request<DeploySiteResult>('/api/sites', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        route: data.route,
        files: data.files,
        project_type: data.project_type || 'html',
      }),
    })
  }

  // 列出所有静态站点
  async listSites(): Promise<ApiResponse<Site[]>> {
    return this.request<Site[]>('/api/sites')
  }

  // 获取站点详情
  async getSite(id: string): Promise<ApiResponse<Site>> {
    return this.request<Site>(`/api/sites/${id}`)
  }

  // 删除站点
  async deleteSite(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/sites/${id}`, {
      method: 'DELETE',
    })
  }
}

export const api = new NexoAPI()
export default api


// @nexo/api - Browser API client for Nexo Runtime (framework-agnostic)
// This package avoids bundler-specific globals. Provide baseUrl via ctor.

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

export class NexoAPI {
  private baseUrl: string
  private fetcher: typeof fetch

  constructor(baseUrl: string, fetcher?: typeof fetch) {
    this.baseUrl = baseUrl || ''
    const rawFetch = fetcher ?? (globalThis.fetch as typeof fetch)
    if (!rawFetch) {
      throw new Error('fetch is not available in this environment. Provide a fetch implementation (e.g., undici).')
    }
    // 绑定 fetch 以确保正确的 this 上下文，避免 "Illegal invocation" 错误
    // 如果用户提供了自定义 fetcher，也进行绑定以确保兼容性
    this.fetcher = rawFetch.bind(globalThis) as typeof fetch
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetcher(`${this.baseUrl}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      })

      const text = await response.text()

      try {
        const data = JSON.parse(text)
        return data
      } catch {
        return {
          success: false,
          error: response.ok ? 'Invalid response format' : `HTTP ${response.status}: ${text}`,
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Health check
  async health() {
    return this.request<{ status: string; version: string }>("/health")
  }

  // Get runtime statistics
  async getStats() {
    return this.request<PoolStats>("/stats")
  }

  // Function CRUD
  async listFunctions() {
    return this.request<Function[]>("/api/functions")
  }

  async getFunction(id: string) {
    return this.request<Function>(`/api/functions/${id}`)
  }

  async createFunction(data: CreateFunctionRequest) {
    return this.request<Function>("/api/functions", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateFunction(id: string, data: UpdateFunctionRequest) {
    return this.request<Function>(`/api/functions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteFunction(id: string) {
    return this.request<void>(`/api/functions/${id}`, {
      method: "DELETE",
    })
  }

  // Invoke function
  async invokeFunction(id: string, body?: unknown) {
    return this.request<InvokeResult>(`/api/functions/${id}/invoke`, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  // Invoke by route
  async invokeByRoute(route: string, method: string = "GET", body?: unknown) {
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

    const functionCode = `// 静态 HTML 页面托管函数\n// 由 AI 代码生成器创建\n\nvar htmlContent = ${JSON.stringify(data.html)};\n\nfunction handler(request, ctx) {\n  return new Response(htmlContent, {\n    headers: {\n      'Content-Type': 'text/html; charset=utf-8'\n    }\n  });\n}`

    const res = await this.createFunction({
      name: functionName,
      code: functionCode,
      route: routePath,
      methods: ["GET"],
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
      const previews = res.data.filter((fn) => fn.name.startsWith('ai-preview-'))
      return { success: true, data: previews }
    }
    return res
  }

  // Static site APIs
  async deploySite(data: DeploySiteRequest): Promise<ApiResponse<DeploySiteResult>> {
    return this.request<DeploySiteResult>("/api/sites", {
      method: "POST",
      body: JSON.stringify({
        name: data.name,
        route: data.route,
        files: data.files,
        project_type: data.project_type || "html",
      }),
    })
  }

  async listSites(): Promise<ApiResponse<Site[]>> {
    return this.request<Site[]>("/api/sites")
  }

  async getSite(id: string): Promise<ApiResponse<Site>> {
    return this.request<Site>(`/api/sites/${id}`)
  }

  async deleteSite(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/sites/${id}`, {
      method: "DELETE",
    })
  }
}

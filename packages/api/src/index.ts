// Nexo API Client
export class NexoAPI {
  private baseURL: string

  constructor(baseURL: string = 'http://localhost:3000') {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      const responseData = await response.json()
      
      // 后端返回的格式是 { success: boolean, data?: T, error?: string }
      if (!response.ok || !responseData.success) {
        return { 
          success: false, 
          error: responseData.error || `HTTP ${response.status}` 
        }
      }

      // 如果响应本身就是数据（如 invoke 接口），直接返回
      // 否则返回 data 字段
      if (responseData.data !== undefined) {
        return { success: true, data: responseData.data }
      }
      
      // 兼容直接返回数据的情况
      return { success: true, data: responseData as T }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Functions API
  async listFunctions(): Promise<{
    success: boolean
    data?: Function[]
    error?: string
  }> {
    return this.request<Function[]>('/api/functions')
  }

  async getFunction(id: string): Promise<{
    success: boolean
    data?: Function
    error?: string
  }> {
    return this.request<Function>(`/api/functions/${id}`)
  }

  async createFunction(
    data: CreateFunctionRequest
  ): Promise<{ success: boolean; data?: Function; error?: string }> {
    return this.request<Function>('/api/functions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateFunction(
    id: string,
    data: Partial<CreateFunctionRequest>
  ): Promise<{ success: boolean; data?: Function; error?: string }> {
    return this.request<Function>(`/api/functions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteFunction(id: string): Promise<{
    success: boolean
    error?: string
  }> {
    return this.request(`/api/functions/${id}`, {
      method: 'DELETE',
    })
  }

  async invokeFunction(
    id: string,
    data?: Record<string, unknown>
  ): Promise<{ success: boolean; data?: InvokeResult; error?: string }> {
    return this.request<InvokeResult>(`/api/functions/${id}/invoke`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // Sites API
  async deploySite(data: {
    files: { path: string; content: string }[]
    project_type?: string
  }): Promise<{ success: boolean; data?: { url: string }; error?: string }> {
    return this.request<{ url: string }>('/api/sites', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Pool Stats
  async getPoolStats(): Promise<{
    success: boolean
    data?: PoolStats
    error?: string
  }> {
    return this.request<PoolStats>('/api/pool/stats')
  }

  // Stats (alias for getPoolStats)
  async getStats(): Promise<{
    success: boolean
    data?: PoolStats
    error?: string
  }> {
    return this.getPoolStats()
  }
}

// Types
export interface Function {
  id: string
  name: string
  route: string
  methods: string[]
  status: 'active' | 'inactive' | 'error'
  code?: string
  env?: Record<string, string>
  limits?: FunctionLimits
  invocations?: number
  createdAt?: string
  updatedAt?: string
  updated_at?: string // 后端可能使用 snake_case
  created_at?: string // 后端可能使用 snake_case
}

export interface FunctionLimits {
  max_execution_time_ms: number
  max_memory_mb: number
  max_request_body_kb?: number
}

export interface CreateFunctionRequest {
  name: string
  route: string
  methods: string[]
  code?: string
  environment?: Record<string, string>
  env?: Record<string, string> // 别名，用于兼容
  limits?: FunctionLimits
}

export interface InvokeResult {
  success: boolean
  data?: unknown
  error?: string
  logs?: string[]
  status?: number
  execution_time_ms?: number
  body?: unknown
}

export interface PoolStats {
  total: number
  active: number
  idle: number
  max: number
  // 扩展统计字段
  total_executions?: number
  successful_executions?: number
  failed_executions?: number
  avg_execution_time_ms?: number
  active_isolates?: number
  max_concurrent?: number
}


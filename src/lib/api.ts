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
}

export const api = new NexoAPI()
export default api


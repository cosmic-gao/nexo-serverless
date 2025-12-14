// 共享的 API 客户端配置
import { NexoAPI } from '@nexo/api'
import { getApiBaseUrl } from './env'

// 创建并导出配置好的 API 实例
export const createApiClient = (baseURL?: string) => {
  return new NexoAPI(baseURL || getApiBaseUrl())
}

// 导出默认实例
export const api = createApiClient()
export default api


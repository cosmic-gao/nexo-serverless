// Thin wrapper for @nexo/api in the web app
import { NexoAPI } from '@nexo/api'
export * from '@nexo/api'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = new NexoAPI(API_BASE)
export default api


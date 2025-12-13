//! Runtime - 运行时协调器
//!
//! 负责协调函数存储、Isolate 池和请求处理。

use crate::function::{Function, FunctionStore, FunctionStatus};
use crate::isolate::IsolateConfig;
use crate::pool::{IsolatePool, PoolStats};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

/// 函数请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionRequest {
    pub url: String,
    pub method: String,
    pub headers: HashMap<String, String>,
    pub body: Option<String>,
    pub path_params: HashMap<String, String>,
    pub query_params: HashMap<String, String>,
    #[serde(default)]
    pub env: HashMap<String, String>,
}

/// 函数响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionResponse {
    pub status: u16,
    pub headers: HashMap<String, String>,
    pub body: Option<serde_json::Value>,
    pub execution_time_ms: u64,
    pub memory_used_bytes: usize,
    pub function_id: String,
    pub logs: Vec<String>,
}

/// Nexo 运行时
pub struct NexoRuntime {
    /// 函数存储
    pub functions: FunctionStore,
    /// Isolate 池
    pool: Arc<IsolatePool>,
}

impl NexoRuntime {
    /// 创建新的运行时
    pub fn new(max_concurrent_isolates: usize) -> Self {
        Self {
            functions: FunctionStore::new(),
            pool: Arc::new(IsolatePool::new(max_concurrent_isolates)),
        }
    }

    /// 执行函数
    pub async fn execute_function(
        &self,
        function: &Function,
        request: FunctionRequest,
    ) -> FunctionResponse {
        // 记录调用
        self.functions.record_invocation(&function.id).await;

        // 构建 Isolate 配置
        let config = IsolateConfig {
            max_execution_time_ms: function.limits.max_execution_time_ms,
            max_heap_size_bytes: (function.limits.max_memory_mb as usize) * 1024 * 1024,
            function_id: function.id.clone(),
        };

        // 构建请求数据（包含环境变量）
        let mut request_with_env = request.clone();
        request_with_env.env = function.env.clone();
        let request_data = serde_json::to_value(&request_with_env).unwrap_or_default();

        // 在 Isolate 池中执行
        let result = self.pool.execute(
            &function.id,
            &function.code,
            request_data,
            Some(config),
        ).await;

        // 转换为响应
        self.result_to_response(&function.id, result)
    }

    /// 通过路由执行函数
    pub async fn execute_by_route(
        &self,
        route: &str,
        method: &str,
        request: FunctionRequest,
    ) -> Result<FunctionResponse, String> {
        // 查找函数
        let function = self.functions.get_by_route(route).await
            .ok_or_else(|| format!("No function found for route: {}", route))?;

        // 检查 HTTP 方法
        if !function.methods.iter().any(|m| m.eq_ignore_ascii_case(method)) {
            return Err(format!("Method {} not allowed for this function", method));
        }

        // 检查函数状态
        if function.status != FunctionStatus::Active {
            return Err("Function is not active".to_string());
        }

        Ok(self.execute_function(&function, request).await)
    }

    /// 将执行结果转换为 HTTP 响应
    fn result_to_response(
        &self,
        function_id: &str,
        result: crate::isolate::ExecutionResult,
    ) -> FunctionResponse {
        if result.success {
            FunctionResponse {
                status: 200,
                headers: [("Content-Type".to_string(), "application/json".to_string())]
                    .into_iter()
                    .collect(),
                body: result.output,
                execution_time_ms: result.execution_time_ms,
                memory_used_bytes: result.memory_used_bytes,
                function_id: function_id.to_string(),
                logs: result.logs,
            }
        } else {
            FunctionResponse {
                status: 500,
                headers: [("Content-Type".to_string(), "application/json".to_string())]
                    .into_iter()
                    .collect(),
                body: Some(serde_json::json!({
                    "error": result.error.unwrap_or_else(|| "Unknown error".to_string())
                })),
                execution_time_ms: result.execution_time_ms,
                memory_used_bytes: result.memory_used_bytes,
                function_id: function_id.to_string(),
                logs: result.logs,
            }
        }
    }

    /// 获取池统计
    pub async fn get_pool_stats(&self) -> PoolStats {
        self.pool.get_stats().await
    }

    /// 获取 Isolate 池引用
    pub fn pool(&self) -> &Arc<IsolatePool> {
        &self.pool
    }
}

impl Default for NexoRuntime {
    fn default() -> Self {
        Self::new(100)
    }
}

//! Isolate Pool - 管理 V8 Isolate 的并发执行
//!
//! 由于 V8 Isolate 创建非常快（< 5ms），我们采用按需创建的策略，
//! 而不是维护预热池。使用 Semaphore 控制最大并发数。

use crate::isolate::{NexoIsolate, IsolateConfig, ExecutionResult};
use std::sync::Arc;
use tokio::sync::{Semaphore, RwLock};
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};

/// 池统计信息
#[derive(Debug, Clone, Default, serde::Serialize)]
pub struct PoolStats {
    pub total_executions: u64,
    pub successful_executions: u64,
    pub failed_executions: u64,
    pub total_execution_time_ms: u64,
    pub avg_execution_time_ms: f64,
    pub current_concurrent: usize,
    pub max_concurrent: usize,
    pub total_memory_used_bytes: u64,
}

/// 函数级别的统计
#[derive(Debug, Clone, Default, serde::Serialize)]
pub struct FunctionStats {
    pub invocations: u64,
    pub successful: u64,
    pub failed: u64,
    pub total_time_ms: u64,
    pub avg_time_ms: f64,
    pub last_execution_ms: u64,
}

/// Isolate 池
pub struct IsolatePool {
    /// 最大并发数（用于初始化信号量）
    #[allow(dead_code)]
    max_concurrent: usize,
    /// 并发控制信号量
    semaphore: Arc<Semaphore>,
    /// 当前并发计数
    current_concurrent: AtomicU64,
    /// 全局统计
    stats: Arc<RwLock<PoolStats>>,
    /// 函数级统计
    function_stats: Arc<RwLock<HashMap<String, FunctionStats>>>,
}

impl IsolatePool {
    /// 创建新的 Isolate 池
    pub fn new(max_concurrent: usize) -> Self {
        // 初始化 V8（只需一次）
        crate::isolate::init_v8();

        Self {
            max_concurrent,
            semaphore: Arc::new(Semaphore::new(max_concurrent)),
            current_concurrent: AtomicU64::new(0),
            stats: Arc::new(RwLock::new(PoolStats {
                max_concurrent,
                ..Default::default()
            })),
            function_stats: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// 在池中执行代码
    /// 
    /// 这个方法会：
    /// 1. 获取并发许可
    /// 2. 创建新的 Isolate
    /// 3. 执行代码
    /// 4. 释放许可并更新统计
    pub async fn execute(
        &self,
        function_id: &str,
        code: &str,
        request_data: serde_json::Value,
        config: Option<IsolateConfig>,
    ) -> ExecutionResult {
        // 获取并发许可
        let _permit = self.semaphore.acquire().await.unwrap();
        
        // 更新并发计数
        self.current_concurrent.fetch_add(1, Ordering::SeqCst);
        
        // 更新统计中的当前并发数
        {
            let mut stats = self.stats.write().await;
            stats.current_concurrent = self.current_concurrent.load(Ordering::SeqCst) as usize;
        }

        // 创建 Isolate 配置
        let isolate_config = config.unwrap_or_else(|| {
            IsolateConfig {
                function_id: function_id.to_string(),
                ..Default::default()
            }
        });

        // 在独立线程中执行（V8 操作是同步的）
        let code = code.to_string();
        let function_id = function_id.to_string();
        
        let result = tokio::task::spawn_blocking(move || {
            let isolate = NexoIsolate::new(isolate_config);
            isolate.execute(&code, request_data)
        })
        .await
        .unwrap_or_else(|e| Ok(ExecutionResult {
            success: false,
            output: None,
            error: Some(format!("Task panicked: {}", e)),
            execution_time_ms: 0,
            memory_used_bytes: 0,
            logs: vec![],
        }))
        .unwrap_or_else(|e| ExecutionResult {
            success: false,
            output: None,
            error: Some(e.to_string()),
            execution_time_ms: 0,
            memory_used_bytes: 0,
            logs: vec![],
        });

        // 减少并发计数
        self.current_concurrent.fetch_sub(1, Ordering::SeqCst);

        // 更新统计
        self.update_stats(&function_id, &result).await;

        result
    }

    /// 更新执行统计
    async fn update_stats(&self, function_id: &str, result: &ExecutionResult) {
        // 更新全局统计
        {
            let mut stats = self.stats.write().await;
            stats.total_executions += 1;
            stats.total_execution_time_ms += result.execution_time_ms;
            stats.total_memory_used_bytes += result.memory_used_bytes as u64;
            stats.current_concurrent = self.current_concurrent.load(Ordering::SeqCst) as usize;

            if result.success {
                stats.successful_executions += 1;
            } else {
                stats.failed_executions += 1;
            }

            if stats.total_executions > 0 {
                stats.avg_execution_time_ms =
                    stats.total_execution_time_ms as f64 / stats.total_executions as f64;
            }
        }

        // 更新函数级统计
        {
            let mut function_stats = self.function_stats.write().await;
            let entry = function_stats
                .entry(function_id.to_string())
                .or_insert_with(FunctionStats::default);

            entry.invocations += 1;
            entry.total_time_ms += result.execution_time_ms;
            entry.last_execution_ms = result.execution_time_ms;

            if result.success {
                entry.successful += 1;
            } else {
                entry.failed += 1;
            }

            if entry.invocations > 0 {
                entry.avg_time_ms = entry.total_time_ms as f64 / entry.invocations as f64;
            }
        }
    }

    /// 获取全局统计
    pub async fn get_stats(&self) -> PoolStats {
        self.stats.read().await.clone()
    }

    /// 获取函数统计
    pub async fn get_function_stats(&self, function_id: &str) -> Option<FunctionStats> {
        self.function_stats.read().await.get(function_id).cloned()
    }

    /// 获取所有函数统计
    #[allow(dead_code)]
    pub async fn get_all_function_stats(&self) -> HashMap<String, FunctionStats> {
        self.function_stats.read().await.clone()
    }

    /// 获取当前并发数
    #[allow(dead_code)]
    pub fn current_concurrent(&self) -> usize {
        self.current_concurrent.load(Ordering::SeqCst) as usize
    }

    /// 获取可用许可数
    #[allow(dead_code)]
    pub fn available_permits(&self) -> usize {
        self.semaphore.available_permits()
    }
}

impl Default for IsolatePool {
    fn default() -> Self {
        Self::new(100)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_pool_execution() {
        let pool = IsolatePool::new(10);
        
        let code = r#"
            function handler(request) {
                return { message: "Hello from pool!" };
            }
        "#;

        let result = pool.execute("test-fn", code, serde_json::json!({}), None).await;
        
        assert!(result.success);
        assert!(result.output.is_some());
    }

    #[tokio::test]
    async fn test_pool_stats() {
        let pool = IsolatePool::new(10);
        
        let code = r#"
            function handler(request) {
                return { ok: true };
            }
        "#;

        // 执行几次
        for _ in 0..3 {
            pool.execute("test-fn", code, serde_json::json!({}), None).await;
        }

        let stats = pool.get_stats().await;
        assert_eq!(stats.total_executions, 3);
        assert_eq!(stats.successful_executions, 3);
    }

    #[tokio::test]
    async fn test_concurrent_execution() {
        let pool = Arc::new(IsolatePool::new(10));
        
        let code = r#"
            function handler(request) {
                return { id: __REQUEST__.id };
            }
        "#;

        let mut handles = vec![];
        
        for i in 0..5 {
            let pool = Arc::clone(&pool);
            let code = code.to_string();
            
            handles.push(tokio::spawn(async move {
                pool.execute(
                    &format!("fn-{}", i),
                    &code,
                    serde_json::json!({ "id": i }),
                    None,
                ).await
            }));
        }

        for handle in handles {
            let result = handle.await.unwrap();
            assert!(result.success);
        }

        let stats = pool.get_stats().await;
        assert_eq!(stats.total_executions, 5);
    }
}

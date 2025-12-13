//! Function management - 函数存储和管理

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::path::PathBuf;
use tokio::sync::RwLock;
use chrono::{DateTime, Utc};
use uuid::Uuid;

/// 已部署的函数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Function {
    /// 函数 ID
    pub id: String,
    /// 函数名称
    pub name: String,
    /// 函数代码
    pub code: String,
    /// 路由路径
    pub route: String,
    /// 允许的 HTTP 方法
    pub methods: Vec<String>,
    /// 环境变量
    pub env: HashMap<String, String>,
    /// 资源限制
    pub limits: FunctionLimits,
    /// 创建时间
    pub created_at: DateTime<Utc>,
    /// 更新时间
    pub updated_at: DateTime<Utc>,
    /// 状态
    pub status: FunctionStatus,
    /// 调用次数
    pub invocations: u64,
    /// 最后调用时间
    pub last_invoked_at: Option<DateTime<Utc>>,
}

/// 函数资源限制
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionLimits {
    /// 最大执行时间（毫秒）
    pub max_execution_time_ms: u64,
    /// 最大内存（MB）
    pub max_memory_mb: u32,
    /// 最大请求体大小（KB）
    pub max_request_body_kb: u32,
}

impl Default for FunctionLimits {
    fn default() -> Self {
        Self {
            max_execution_time_ms: 50,
            max_memory_mb: 128,
            max_request_body_kb: 1024,
        }
    }
}

/// 函数状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum FunctionStatus {
    Active,
    Inactive,
    Deploying,
    Error,
}

/// 创建函数请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateFunctionRequest {
    pub name: String,
    pub code: String,
    pub route: String,
    #[serde(default = "default_methods")]
    pub methods: Vec<String>,
    #[serde(default)]
    pub env: HashMap<String, String>,
    #[serde(default)]
    pub limits: Option<FunctionLimits>,
}

fn default_methods() -> Vec<String> {
    vec!["GET".to_string(), "POST".to_string()]
}

/// 更新函数请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateFunctionRequest {
    pub name: Option<String>,
    pub code: Option<String>,
    pub route: Option<String>,
    pub methods: Option<Vec<String>>,
    pub env: Option<HashMap<String, String>>,
    pub limits: Option<FunctionLimits>,
    pub status: Option<FunctionStatus>,
}

/// 持久化数据结构
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
struct PersistedData {
    functions: HashMap<String, Function>,
    routes: HashMap<String, String>,
}

/// 函数存储
#[derive(Clone)]
pub struct FunctionStore {
    functions: Arc<RwLock<HashMap<String, Function>>>,
    routes: Arc<RwLock<HashMap<String, String>>>, // route -> function_id
    storage_path: PathBuf,
}

impl FunctionStore {
    pub fn new() -> Self {
        // 获取可执行文件所在目录的父目录（项目根目录）
        // 或者使用当前工作目录
        let storage_path = std::env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join("data")
            .join("functions.json");
        
        println!("[FunctionStore] 数据存储路径: {}", storage_path.display());
        
        Self::with_storage_path(storage_path)
    }
    
    pub fn with_storage_path(storage_path: PathBuf) -> Self {
        // 先同步加载数据
        let (functions_data, routes_data) = match Self::load_from_path(&storage_path) {
            Ok(data) => {
                println!("[FunctionStore] 已加载 {} 个函数", data.functions.len());
                (data.functions, data.routes)
            }
            Err(_) => (HashMap::new(), HashMap::new()),
        };
        
        Self {
            functions: Arc::new(RwLock::new(functions_data)),
            routes: Arc::new(RwLock::new(routes_data)),
            storage_path,
        }
    }
    
    /// 从文件加载数据（静态方法）
    fn load_from_path(path: &PathBuf) -> Result<PersistedData, String> {
        if !path.exists() {
            return Ok(PersistedData::default());
        }
        
        let content = std::fs::read_to_string(path)
            .map_err(|e| format!("Failed to read storage file: {}", e))?;
        
        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse storage file: {}", e))
    }
    
    /// 异步保存数据
    async fn save(&self) -> Result<(), String> {
        let functions = self.functions.read().await;
        let routes = self.routes.read().await;
        
        let data = PersistedData {
            functions: functions.clone(),
            routes: routes.clone(),
        };
        
        // 确保目录存在
        if let Some(parent) = self.storage_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create storage directory: {}", e))?;
        }
        
        let content = serde_json::to_string_pretty(&data)
            .map_err(|e| format!("Failed to serialize data: {}", e))?;
        
        std::fs::write(&self.storage_path, content)
            .map_err(|e| format!("Failed to write storage file: {}", e))?;
        
        Ok(())
    }

    /// 创建函数
    pub async fn create(&self, req: CreateFunctionRequest) -> Result<Function, String> {
        let mut functions = self.functions.write().await;
        let mut routes = self.routes.write().await;

        // 检查路由是否已存在
        if routes.contains_key(&req.route) {
            return Err(format!("Route '{}' is already in use", req.route));
        }

        // 验证函数名称
        if req.name.is_empty() {
            return Err("Function name cannot be empty".to_string());
        }

        // 验证路由格式
        if !req.route.starts_with('/') {
            return Err("Route must start with '/'".to_string());
        }

        let id = Uuid::new_v4().to_string();
        let now = Utc::now();

        let function = Function {
            id: id.clone(),
            name: req.name,
            code: req.code,
            route: req.route.clone(),
            methods: req.methods,
            env: req.env,
            limits: req.limits.unwrap_or_default(),
            created_at: now,
            updated_at: now,
            status: FunctionStatus::Active,
            invocations: 0,
            last_invoked_at: None,
        };

        routes.insert(req.route, id.clone());
        functions.insert(id, function.clone());
        
        // 释放锁后保存
        drop(functions);
        drop(routes);
        if let Err(e) = self.save().await {
            eprintln!("[FunctionStore] 保存失败: {}", e);
        }

        Ok(function)
    }

    /// 获取函数
    pub async fn get(&self, id: &str) -> Option<Function> {
        self.functions.read().await.get(id).cloned()
    }

    /// 通过路由获取函数
    pub async fn get_by_route(&self, route: &str) -> Option<Function> {
        let routes = self.routes.read().await;
        
        // 精确匹配
        if let Some(id) = routes.get(route) {
            return self.functions.read().await.get(id).cloned();
        }

        // 模式匹配
        let functions = self.functions.read().await;
        for func in functions.values() {
            if Self::route_matches(&func.route, route) {
                return Some(func.clone());
            }
        }
        
        None
    }

    /// 路由匹配
    fn route_matches(pattern: &str, path: &str) -> bool {
        if pattern == path {
            return true;
        }

        // 通配符匹配 /api/*
        if pattern.ends_with("/*") {
            let prefix = &pattern[..pattern.len() - 2];
            return path.starts_with(prefix);
        }

        // 路径参数匹配 /users/:id
        let pattern_parts: Vec<&str> = pattern.split('/').collect();
        let path_parts: Vec<&str> = path.split('/').collect();

        if pattern_parts.len() != path_parts.len() {
            return false;
        }

        for (p, actual) in pattern_parts.iter().zip(path_parts.iter()) {
            if p.starts_with(':') {
                continue;
            }
            if p != actual {
                return false;
            }
        }

        true
    }

    /// 列出所有函数
    pub async fn list(&self) -> Vec<Function> {
        self.functions.read().await.values().cloned().collect()
    }

    /// 更新函数
    pub async fn update(&self, id: &str, req: UpdateFunctionRequest) -> Result<Function, String> {
        let mut functions = self.functions.write().await;
        let mut routes = self.routes.write().await;

        let function = functions.get_mut(id).ok_or("Function not found")?;

        // 更新路由
        if let Some(new_route) = &req.route {
            if new_route != &function.route {
                if routes.contains_key(new_route) {
                    return Err(format!("Route '{}' is already in use", new_route));
                }
                routes.remove(&function.route);
                routes.insert(new_route.clone(), id.to_string());
                function.route = new_route.clone();
            }
        }

        if let Some(name) = req.name {
            function.name = name;
        }
        if let Some(code) = req.code {
            function.code = code;
        }
        if let Some(methods) = req.methods {
            function.methods = methods;
        }
        if let Some(env) = req.env {
            function.env = env;
        }
        if let Some(limits) = req.limits {
            function.limits = limits;
        }
        if let Some(status) = req.status {
            function.status = status;
        }

        function.updated_at = Utc::now();
        
        let result = function.clone();
        
        // 释放锁后保存
        drop(functions);
        drop(routes);
        if let Err(e) = self.save().await {
            eprintln!("[FunctionStore] 保存失败: {}", e);
        }

        Ok(result)
    }

    /// 删除函数
    pub async fn delete(&self, id: &str) -> Result<(), String> {
        let mut functions = self.functions.write().await;
        let mut routes = self.routes.write().await;

        if let Some(function) = functions.remove(id) {
            routes.remove(&function.route);
            
            // 释放锁后保存
            drop(functions);
            drop(routes);
            if let Err(e) = self.save().await {
                eprintln!("[FunctionStore] 保存失败: {}", e);
            }
            
            Ok(())
        } else {
            Err("Function not found".to_string())
        }
    }

    /// 记录调用
    pub async fn record_invocation(&self, id: &str) {
        if let Some(function) = self.functions.write().await.get_mut(id) {
            function.invocations += 1;
            function.last_invoked_at = Some(Utc::now());
        }
    }
}

impl Default for FunctionStore {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_function() {
        let store = FunctionStore::new();
        
        let req = CreateFunctionRequest {
            name: "test-fn".to_string(),
            code: "function handler() {}".to_string(),
            route: "/api/test".to_string(),
            methods: vec!["GET".to_string()],
            env: HashMap::new(),
            limits: None,
        };

        let function = store.create(req).await.unwrap();
        assert_eq!(function.name, "test-fn");
        assert_eq!(function.route, "/api/test");
    }

    #[tokio::test]
    async fn test_duplicate_route() {
        let store = FunctionStore::new();
        
        let req1 = CreateFunctionRequest {
            name: "fn1".to_string(),
            code: "".to_string(),
            route: "/api/test".to_string(),
            methods: vec![],
            env: HashMap::new(),
            limits: None,
        };

        let req2 = CreateFunctionRequest {
            name: "fn2".to_string(),
            code: "".to_string(),
            route: "/api/test".to_string(),
            methods: vec![],
            env: HashMap::new(),
            limits: None,
        };

        store.create(req1).await.unwrap();
        assert!(store.create(req2).await.is_err());
    }

    #[tokio::test]
    async fn test_route_matching() {
        assert!(FunctionStore::route_matches("/api/users/:id", "/api/users/123"));
        assert!(FunctionStore::route_matches("/api/*", "/api/anything/here"));
        assert!(!FunctionStore::route_matches("/api/users", "/api/posts"));
    }
}

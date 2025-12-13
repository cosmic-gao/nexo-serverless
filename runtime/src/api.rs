//! HTTP API for Nexo Serverless Runtime
//!
//! 提供 RESTful API 用于：
//! - 函数管理（CRUD）
//! - 函数调用
//! - 运行时统计

use axum::{
    extract::{Path, State, Query},
    http::{StatusCode, Method, HeaderMap},
    response::Json,
    routing::{get, post, put, delete},
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::collections::HashMap;
use tower_http::cors::{CorsLayer, Any};
use tower_http::trace::TraceLayer;

use crate::function::{CreateFunctionRequest, UpdateFunctionRequest, Function};
use crate::runtime::{NexoRuntime, FunctionRequest};
use crate::pool::PoolStats;

/// 应用状态
pub struct AppState {
    pub runtime: NexoRuntime,
}

/// API 响应包装
#[derive(Serialize)]
pub struct ApiResponse<T: Serialize> {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

impl<T: Serialize> ApiResponse<T> {
    pub fn ok(data: T) -> Json<Self> {
        Json(Self {
            success: true,
            data: Some(data),
            error: None,
        })
    }

    pub fn err(message: impl Into<String>) -> Json<Self> {
        Json(Self {
            success: false,
            data: None,
            error: Some(message.into()),
        })
    }
}

/// 健康检查响应
#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
    pub runtime: String,
}

/// 启动 API 服务器
pub async fn start_server() -> anyhow::Result<()> {
    let max_concurrent = std::env::var("NEXO_MAX_CONCURRENT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(100);

    let state = Arc::new(AppState {
        runtime: NexoRuntime::new(max_concurrent),
    });

    tracing::info!("📊 Max concurrent isolates: {}", max_concurrent);

    // CORS 配置
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS])
        .allow_headers(Any);

    // 构建路由
    let app = Router::new()
        // 健康检查和统计
        .route("/health", get(health_handler))
        .route("/stats", get(stats_handler))
        
        // 函数管理 API
        .route("/api/functions", get(list_functions))
        .route("/api/functions", post(create_function))
        .route("/api/functions/:id", get(get_function))
        .route("/api/functions/:id", put(update_function))
        .route("/api/functions/:id", delete(delete_function))
        .route("/api/functions/:id/invoke", post(invoke_function))
        .route("/api/functions/:id/stats", get(function_stats))
        
        // 函数调用网关
        .route("/fn/*path", get(invoke_by_route))
        .route("/fn/*path", post(invoke_by_route))
        .route("/fn/*path", put(invoke_by_route))
        .route("/fn/*path", delete(invoke_by_route))
        
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = std::env::var("NEXO_ADDR").unwrap_or_else(|_| "0.0.0.0:3000".to_string());
    let listener = tokio::net::TcpListener::bind(&addr).await?;

    tracing::info!("🌐 API server listening on http://{}", addr);
    tracing::info!("📚 Endpoints:");
    tracing::info!("   GET  /health          - Health check");
    tracing::info!("   GET  /stats           - Runtime statistics");
    tracing::info!("   GET  /api/functions   - List functions");
    tracing::info!("   POST /api/functions   - Create function");
    tracing::info!("   ANY  /fn/*            - Invoke function by route");

    axum::serve(listener, app).await?;

    Ok(())
}

/// 健康检查
async fn health_handler() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "healthy".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        runtime: "V8 Isolate (rusty_v8)".to_string(),
    })
}

/// 运行时统计
async fn stats_handler(
    State(state): State<Arc<AppState>>,
) -> Json<ApiResponse<PoolStats>> {
    let stats = state.runtime.get_pool_stats().await;
    ApiResponse::ok(stats)
}

/// 列出所有函数
async fn list_functions(
    State(state): State<Arc<AppState>>,
) -> Json<ApiResponse<Vec<Function>>> {
    let functions = state.runtime.functions.list().await;
    ApiResponse::ok(functions)
}

/// 获取单个函数
async fn get_function(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<Function>>, StatusCode> {
    match state.runtime.functions.get(&id).await {
        Some(function) => Ok(ApiResponse::ok(function)),
        None => Err(StatusCode::NOT_FOUND),
    }
}

/// 创建函数
async fn create_function(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateFunctionRequest>,
) -> Result<Json<ApiResponse<Function>>, (StatusCode, Json<ApiResponse<()>>)> {
    match state.runtime.functions.create(req).await {
        Ok(function) => {
            tracing::info!("✅ Created function: {} ({})", function.name, function.id);
            Ok(ApiResponse::ok(function))
        }
        Err(e) => Err((StatusCode::BAD_REQUEST, ApiResponse::err(e))),
    }
}

/// 更新函数
async fn update_function(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<UpdateFunctionRequest>,
) -> Result<Json<ApiResponse<Function>>, (StatusCode, Json<ApiResponse<()>>)> {
    match state.runtime.functions.update(&id, req).await {
        Ok(function) => {
            tracing::info!("✅ Updated function: {} ({})", function.name, function.id);
            Ok(ApiResponse::ok(function))
        }
        Err(e) => Err((StatusCode::BAD_REQUEST, ApiResponse::err(e))),
    }
}

/// 删除函数
async fn delete_function(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<()>>, (StatusCode, Json<ApiResponse<()>>)> {
    match state.runtime.functions.delete(&id).await {
        Ok(_) => {
            tracing::info!("🗑️ Deleted function: {}", id);
            Ok(ApiResponse::ok(()))
        }
        Err(e) => Err((StatusCode::NOT_FOUND, ApiResponse::err(e))),
    }
}

/// 函数统计
async fn function_stats(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<crate::pool::FunctionStats>>, StatusCode> {
    match state.runtime.pool().get_function_stats(&id).await {
        Some(stats) => Ok(ApiResponse::ok(stats)),
        None => Err(StatusCode::NOT_FOUND),
    }
}

/// 调用参数
#[derive(Deserialize, Default)]
pub struct InvokeParams {
    #[serde(flatten)]
    pub query: HashMap<String, String>,
}

/// 通过 ID 调用函数
async fn invoke_function(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    headers: HeaderMap,
    Query(params): Query<InvokeParams>,
    body: Option<String>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<ApiResponse<()>>)> {
    let function = match state.runtime.functions.get(&id).await {
        Some(f) => f,
        None => return Err((StatusCode::NOT_FOUND, ApiResponse::err("Function not found"))),
    };

    let request = FunctionRequest {
        url: format!("/fn{}", function.route),
        method: "POST".to_string(),
        headers: headers
            .iter()
            .filter_map(|(k, v)| v.to_str().ok().map(|v| (k.to_string(), v.to_string())))
            .collect(),
        body,
        path_params: HashMap::new(),
        query_params: params.query,
        env: HashMap::new(),
    };

    let response = state.runtime.execute_function(&function, request).await;

    Ok(Json(serde_json::json!({
        "success": true,
        "data": {
            "status": response.status,
            "body": response.body,
            "execution_time_ms": response.execution_time_ms,
            "memory_used_bytes": response.memory_used_bytes,
            "function_id": response.function_id,
            "logs": response.logs,
        }
    })))
}

/// 通过路由调用函数
async fn invoke_by_route(
    State(state): State<Arc<AppState>>,
    Path(path): Path<String>,
    method: Method,
    headers: HeaderMap,
    Query(params): Query<InvokeParams>,
    body: Option<String>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<ApiResponse<()>>)> {
    let route = format!("/{}", path);

    let request = FunctionRequest {
        url: format!("/fn{}", route),
        method: method.to_string(),
        headers: headers
            .iter()
            .filter_map(|(k, v)| v.to_str().ok().map(|v| (k.to_string(), v.to_string())))
            .collect(),
        body,
        path_params: HashMap::new(),
        query_params: params.query,
        env: HashMap::new(),
    };

    match state.runtime.execute_by_route(&route, &method.to_string(), request).await {
        Ok(response) => Ok(Json(serde_json::json!({
            "success": true,
            "data": {
                "status": response.status,
                "body": response.body,
                "execution_time_ms": response.execution_time_ms,
                "memory_used_bytes": response.memory_used_bytes,
                "logs": response.logs,
            }
        }))),
        Err(e) => Err((StatusCode::NOT_FOUND, ApiResponse::err(e))),
    }
}

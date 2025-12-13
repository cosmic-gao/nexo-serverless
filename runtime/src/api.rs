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
use crate::site::{SiteStore, CreateSiteRequest, Site};

/// 应用状态
pub struct AppState {
    pub runtime: NexoRuntime,
    pub sites: SiteStore,
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
        sites: SiteStore::new(),
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
        
        // 静态站点 API
        .route("/api/sites", get(list_sites))
        .route("/api/sites", post(create_site))
        .route("/api/sites/:id", get(get_site))
        .route("/api/sites/:id", delete(delete_site))
        
        // 静态站点访问
        .route("/site/*path", get(serve_site))
        
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
    tracing::info!("   GET  /api/sites       - List static sites");
    tracing::info!("   POST /api/sites       - Deploy static site");
    tracing::info!("   GET  /site/*          - Serve static site");
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

/// 通过路由调用函数 - 直接返回函数响应内容（用于静态页面托管等）
async fn invoke_by_route(
    State(state): State<Arc<AppState>>,
    Path(path): Path<String>,
    method: Method,
    headers: HeaderMap,
    Query(params): Query<InvokeParams>,
    body: Option<String>,
) -> axum::response::Response {
    use axum::response::IntoResponse;
    use axum::http::header;
    
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
        Ok(response) => {
            // 获取函数返回的 Content-Type
            let content_type = response.headers
                .get("Content-Type")
                .or_else(|| response.headers.get("content-type"))
                .cloned()
                .unwrap_or_else(|| "application/json".to_string());
            
            // 直接返回函数的响应体
            let body_str = match &response.body {
                Some(serde_json::Value::String(s)) => s.clone(),
                Some(v) => v.to_string(),
                None => String::new(),
            };
            
            axum::response::Response::builder()
                .status(response.status)
                .header(header::CONTENT_TYPE, content_type)
                .header("X-Execution-Time-Ms", response.execution_time_ms.to_string())
                .header("X-Function-Id", response.function_id)
                .body(axum::body::Body::from(body_str))
                .unwrap()
                .into_response()
        }
        Err(e) => {
            (StatusCode::NOT_FOUND, Json(serde_json::json!({
                "success": false,
                "error": e
            }))).into_response()
        }
    }
}

// ==================== 静态站点 API ====================

/// 列出所有站点
async fn list_sites(
    State(state): State<Arc<AppState>>,
) -> Json<ApiResponse<Vec<Site>>> {
    let sites = state.sites.list().await;
    ApiResponse::ok(sites)
}

/// 创建站点响应
#[derive(Serialize)]
struct CreateSiteResponse {
    id: String,
    name: String,
    route: String,
    url: String,
    files_count: usize,
}

/// 创建/部署站点
async fn create_site(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateSiteRequest>,
) -> Result<Json<ApiResponse<CreateSiteResponse>>, (StatusCode, Json<ApiResponse<()>>)> {
    let files_count = req.files.len();
    
    match state.sites.create(req).await {
        Ok(site) => {
            tracing::info!("✅ Created site: {} ({}) with {} files", site.name, site.id, files_count);
            
            // 构建访问 URL
            let addr = std::env::var("NEXO_ADDR").unwrap_or_else(|_| "localhost:3000".to_string());
            let host = if addr.starts_with("0.0.0.0") {
                format!("localhost:{}", addr.split(':').last().unwrap_or("3000"))
            } else {
                addr
            };
            
            Ok(ApiResponse::ok(CreateSiteResponse {
                id: site.id,
                name: site.name,
                route: site.route.clone(),
                url: format!("http://{}/site{}", host, site.route),
                files_count,
            }))
        }
        Err(e) => Err((StatusCode::BAD_REQUEST, ApiResponse::err(e))),
    }
}

/// 获取站点详情
async fn get_site(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<Site>>, StatusCode> {
    match state.sites.get(&id).await {
        Some(site) => Ok(ApiResponse::ok(site)),
        None => Err(StatusCode::NOT_FOUND),
    }
}

/// 删除站点
async fn delete_site(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<()>>, (StatusCode, Json<ApiResponse<()>>)> {
    match state.sites.delete(&id).await {
        Ok(_) => {
            tracing::info!("🗑️ Deleted site: {}", id);
            Ok(ApiResponse::ok(()))
        }
        Err(e) => Err((StatusCode::NOT_FOUND, ApiResponse::err(e))),
    }
}

/// 提供静态站点文件
async fn serve_site(
    State(state): State<Arc<AppState>>,
    Path(path): Path<String>,
) -> axum::response::Response {
    use axum::response::IntoResponse;
    use axum::http::header;
    
    // 解析路径：/site/{site_route}/{file_path}
    // path 格式: "1234567890/index.html" 或 "1234567890"
    let path = path.trim_start_matches('/');
    
    // 尝试找到匹配的站点
    let route = format!("/{}", path.split('/').next().unwrap_or(""));
    
    if let Some(site) = state.sites.get_by_route(&route).await {
        // 获取文件路径（移除站点路由部分）
        let file_path = path.strip_prefix(route.trim_start_matches('/'))
            .unwrap_or("")
            .trim_start_matches('/');
        
        // 记录访问
        state.sites.record_visit(&site.id).await;
        
        if let Some(file) = state.sites.get_file(&site.id, file_path).await {
            return axum::response::Response::builder()
                .status(StatusCode::OK)
                .header(header::CONTENT_TYPE, &file.mime_type)
                .header(header::CACHE_CONTROL, "public, max-age=31536000")
                .header("X-Site-Id", &site.id)
                .body(axum::body::Body::from(file.content))
                .unwrap()
                .into_response();
        }
    }
    
    // 如果通过路由没找到，尝试在所有站点中搜索该文件
    // 这处理了构建工具生成的绝对路径资源引用（如 /assets/index.js）
    let sites = state.sites.list().await;
    for site in sites {
        if let Some(file) = state.sites.get_file(&site.id, path).await {
            state.sites.record_visit(&site.id).await;
            return axum::response::Response::builder()
                .status(StatusCode::OK)
                .header(header::CONTENT_TYPE, &file.mime_type)
                .header(header::CACHE_CONTROL, "public, max-age=31536000")
                .header("X-Site-Id", &site.id)
                .body(axum::body::Body::from(file.content))
                .unwrap()
                .into_response();
        }
    }
    
    // 404
    axum::response::Response::builder()
        .status(StatusCode::NOT_FOUND)
        .header(header::CONTENT_TYPE, "text/html; charset=utf-8")
        .body(axum::body::Body::from(r#"<!DOCTYPE html>
<html>
<head><title>404 Not Found</title></head>
<body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0a0a0a; color: #fff;">
<div style="text-align: center;">
<h1 style="font-size: 4rem; margin: 0;">404</h1>
<p style="color: #888;">Page not found</p>
</div>
</body>
</html>"#))
        .unwrap()
        .into_response()
}

//! Static site storage - 静态站点存储和管理

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::{DateTime, Utc};
use uuid::Uuid;

/// 静态站点文件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SiteFile {
    /// 文件路径
    pub path: String,
    /// 文件内容
    pub content: String,
    /// MIME 类型
    pub mime_type: String,
}

/// 静态站点
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Site {
    /// 站点 ID
    pub id: String,
    /// 站点名称
    pub name: String,
    /// 访问路由
    pub route: String,
    /// 站点文件
    pub files: Vec<SiteFile>,
    /// 项目类型
    pub project_type: String,
    /// 创建时间
    pub created_at: DateTime<Utc>,
    /// 更新时间
    pub updated_at: DateTime<Utc>,
    /// 访问次数
    pub visits: u64,
}

/// 创建站点请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSiteRequest {
    /// 站点名称（可选）
    pub name: Option<String>,
    /// 路由路径（可选）
    pub route: Option<String>,
    /// 文件列表
    pub files: Vec<SiteFileRequest>,
    /// 项目类型
    #[serde(default = "default_project_type")]
    pub project_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SiteFileRequest {
    pub path: String,
    pub content: String,
}

fn default_project_type() -> String {
    "html".to_string()
}

/// 持久化数据
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
struct PersistedSites {
    sites: HashMap<String, Site>,
    routes: HashMap<String, String>, // route -> site_id
}

/// 站点存储
#[derive(Clone)]
pub struct SiteStore {
    sites: Arc<RwLock<HashMap<String, Site>>>,
    routes: Arc<RwLock<HashMap<String, String>>>,
    storage_path: PathBuf,
}

impl SiteStore {
    pub fn new() -> Self {
        let storage_path = std::env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join("data")
            .join("sites.json");
        
        println!("[SiteStore] 数据存储路径: {}", storage_path.display());
        
        Self::with_storage_path(storage_path)
    }
    
    pub fn with_storage_path(storage_path: PathBuf) -> Self {
        // 先同步加载数据
        let (sites_data, routes_data) = match Self::load_from_path(&storage_path) {
            Ok(data) => {
                println!("[SiteStore] 已加载 {} 个站点", data.sites.len());
                (data.sites, data.routes)
            }
            Err(_) => (HashMap::new(), HashMap::new()),
        };
        
        Self {
            sites: Arc::new(RwLock::new(sites_data)),
            routes: Arc::new(RwLock::new(routes_data)),
            storage_path,
        }
    }
    
    /// 从文件加载数据（静态方法）
    fn load_from_path(path: &PathBuf) -> Result<PersistedSites, String> {
        if !path.exists() {
            return Ok(PersistedSites::default());
        }
        
        let content = std::fs::read_to_string(path)
            .map_err(|e| format!("Failed to read storage file: {}", e))?;
        
        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse storage file: {}", e))
    }
    
    async fn save(&self) -> Result<(), String> {
        let sites = self.sites.read().await;
        let routes = self.routes.read().await;
        
        let data = PersistedSites {
            sites: sites.clone(),
            routes: routes.clone(),
        };
        
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
    
    /// 获取 MIME 类型
    fn get_mime_type(path: &str) -> String {
        let ext = path.split('.').last().unwrap_or("").to_lowercase();
        match ext.as_str() {
            "html" | "htm" => "text/html; charset=utf-8",
            "css" => "text/css; charset=utf-8",
            "js" | "mjs" => "application/javascript; charset=utf-8",
            "json" => "application/json; charset=utf-8",
            "svg" => "image/svg+xml",
            "png" => "image/png",
            "jpg" | "jpeg" => "image/jpeg",
            "gif" => "image/gif",
            "webp" => "image/webp",
            "ico" => "image/x-icon",
            "woff" => "font/woff",
            "woff2" => "font/woff2",
            "ttf" => "font/ttf",
            "txt" => "text/plain; charset=utf-8",
            "xml" => "application/xml",
            _ => "application/octet-stream",
        }.to_string()
    }
    
    /// 创建站点
    pub async fn create(&self, req: CreateSiteRequest) -> Result<Site, String> {
        let mut sites = self.sites.write().await;
        let mut routes = self.routes.write().await;
        
        let id = Uuid::new_v4().to_string();
        let timestamp = Utc::now().timestamp_millis();
        let route = req.route.unwrap_or_else(|| format!("/{}", timestamp));
        let name = req.name.unwrap_or_else(|| format!("site-{}", timestamp));
        
        // 检查路由是否已存在
        if routes.contains_key(&route) {
            return Err(format!("Route '{}' is already in use", route));
        }
        
        let now = Utc::now();
        
        let files: Vec<SiteFile> = req.files.into_iter().map(|f| {
            SiteFile {
                mime_type: Self::get_mime_type(&f.path),
                path: f.path,
                content: f.content,
            }
        }).collect();
        
        let site = Site {
            id: id.clone(),
            name,
            route: route.clone(),
            files,
            project_type: req.project_type,
            created_at: now,
            updated_at: now,
            visits: 0,
        };
        
        routes.insert(route, id.clone());
        sites.insert(id, site.clone());
        
        drop(sites);
        drop(routes);
        if let Err(e) = self.save().await {
            eprintln!("[SiteStore] 保存失败: {}", e);
        }
        
        Ok(site)
    }
    
    /// 获取站点
    pub async fn get(&self, id: &str) -> Option<Site> {
        self.sites.read().await.get(id).cloned()
    }
    
    /// 通过路由获取站点
    pub async fn get_by_route(&self, route: &str) -> Option<Site> {
        let routes = self.routes.read().await;
        
        // 精确匹配
        if let Some(id) = routes.get(route) {
            return self.sites.read().await.get(id).cloned();
        }
        
        // 前缀匹配（用于静态资源）
        for (site_route, id) in routes.iter() {
            if route.starts_with(site_route) || route.starts_with(&format!("{}/", site_route)) {
                return self.sites.read().await.get(id).cloned();
            }
        }
        
        None
    }
    
    /// 列出所有站点
    pub async fn list(&self) -> Vec<Site> {
        self.sites.read().await.values().cloned().collect()
    }
    
    /// 删除站点
    pub async fn delete(&self, id: &str) -> Result<(), String> {
        let mut sites = self.sites.write().await;
        let mut routes = self.routes.write().await;
        
        if let Some(site) = sites.remove(id) {
            routes.remove(&site.route);
            
            drop(sites);
            drop(routes);
            if let Err(e) = self.save().await {
                eprintln!("[SiteStore] 保存失败: {}", e);
            }
            
            Ok(())
        } else {
            Err("Site not found".to_string())
        }
    }
    
    /// 记录访问
    pub async fn record_visit(&self, id: &str) {
        if let Some(site) = self.sites.write().await.get_mut(id) {
            site.visits += 1;
        }
    }
    
    /// 获取站点文件
    pub async fn get_file(&self, site_id: &str, file_path: &str) -> Option<SiteFile> {
        let sites = self.sites.read().await;
        if let Some(site) = sites.get(site_id) {
            // 规范化路径
            let normalized_path = file_path.trim_start_matches('/');
            
            // 精确匹配
            if let Some(file) = site.files.iter().find(|f| f.path == normalized_path) {
                return Some(file.clone());
            }
            
            // 如果是目录，尝试 index.html
            let index_path = if normalized_path.is_empty() {
                "index.html".to_string()
            } else {
                format!("{}/index.html", normalized_path.trim_end_matches('/'))
            };
            
            if let Some(file) = site.files.iter().find(|f| f.path == index_path) {
                return Some(file.clone());
            }
            
            // SPA fallback - 返回 index.html
            if let Some(file) = site.files.iter().find(|f| f.path == "index.html") {
                return Some(file.clone());
            }
        }
        None
    }
}

impl Default for SiteStore {
    fn default() -> Self {
        Self::new()
    }
}


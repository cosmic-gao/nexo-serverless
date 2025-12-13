mod isolate;
mod runtime;
mod api;
mod function;
mod pool;
mod site;

use anyhow::Result;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> Result<()> {
    // 初始化日志
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .init();

    tracing::info!("🚀 Nexo Serverless Runtime v{}", env!("CARGO_PKG_VERSION"));
    tracing::info!("⚡ Powered by V8 Isolate (rusty_v8)");

    // 初始化 V8
    isolate::init_v8();
    tracing::info!("✅ V8 engine initialized");

    // 启动 API 服务器
    api::start_server().await?;

    Ok(())
}

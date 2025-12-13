#!/bin/bash
# Nexo Serverless 开发环境一键启动脚本 (Linux/macOS)

set -e

echo "🚀 Starting Nexo Serverless..."

# 获取项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "📁 Project root: $PROJECT_ROOT"

# 检查 Rust
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust/Cargo not found. Please install from https://rustup.rs"
    exit 1
fi

# 检查包管理器
if command -v pnpm &> /dev/null; then
    PM="pnpm"
elif command -v npm &> /dev/null; then
    PM="npm"
else
    echo "❌ npm/pnpm not found"
    exit 1
fi

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    $PM install
fi

echo ""
echo "🔧 Starting Runtime (Rust)..."
echo "🌐 Starting Web Console..."
echo ""

# 清理函数
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $RUNTIME_PID 2>/dev/null || true
    kill $WEB_PID 2>/dev/null || true
    echo "👋 Goodbye!"
    exit 0
}

trap cleanup SIGINT SIGTERM

# 启动 Runtime
cd "$PROJECT_ROOT/runtime"
cargo run --release &
RUNTIME_PID=$!

# 启动 Web
cd "$PROJECT_ROOT"
$PM dev &
WEB_PID=$!

echo "✅ Services starting..."
echo ""
echo "   Runtime API:  http://localhost:3000"
echo "   Web Console:  http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# 等待进程
wait


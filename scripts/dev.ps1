# Nexo Serverless 开发环境一键启动脚本 (Windows PowerShell)

Write-Host "🚀 Starting Nexo Serverless..." -ForegroundColor Green

# 获取脚本所在目录的父目录（项目根目录）
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $ProjectRoot

Write-Host "📁 Project root: $ProjectRoot" -ForegroundColor Cyan

# 检查 Rust 是否安装
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Rust/Cargo not found. Please install from https://rustup.rs" -ForegroundColor Red
    exit 1
}

# 检查 pnpm 是否安装
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️ pnpm not found, trying npm..." -ForegroundColor Yellow
    $PackageManager = "npm"
} else {
    $PackageManager = "pnpm"
}

# 安装前端依赖（如果需要）
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    & $PackageManager install
}

Write-Host ""
Write-Host "🔧 Starting Runtime (Rust)..." -ForegroundColor Cyan
Write-Host "🌐 Starting Web Console..." -ForegroundColor Cyan
Write-Host ""

# 并行启动两个进程
$RuntimeJob = Start-Job -ScriptBlock {
    param($ProjectRoot)
    Set-Location "$ProjectRoot\runtime"
    cargo run --release 2>&1
} -ArgumentList $ProjectRoot

$WebJob = Start-Job -ScriptBlock {
    param($ProjectRoot, $PM)
    Set-Location $ProjectRoot
    & $PM dev 2>&1
} -ArgumentList $ProjectRoot, $PackageManager

Write-Host "✅ Services starting..." -ForegroundColor Green
Write-Host ""
Write-Host "   Runtime API:  http://localhost:3000" -ForegroundColor White
Write-Host "   Web Console:  http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host ""

# 实时显示输出
try {
    while ($true) {
        # 获取 Runtime 输出
        $RuntimeOutput = Receive-Job -Job $RuntimeJob -ErrorAction SilentlyContinue
        if ($RuntimeOutput) {
            $RuntimeOutput | ForEach-Object { Write-Host "[Runtime] $_" -ForegroundColor Blue }
        }

        # 获取 Web 输出
        $WebOutput = Receive-Job -Job $WebJob -ErrorAction SilentlyContinue
        if ($WebOutput) {
            $WebOutput | ForEach-Object { Write-Host "[Web] $_" -ForegroundColor Magenta }
        }

        Start-Sleep -Milliseconds 500
    }
} finally {
    Write-Host ""
    Write-Host "🛑 Stopping services..." -ForegroundColor Yellow
    Stop-Job -Job $RuntimeJob -ErrorAction SilentlyContinue
    Stop-Job -Job $WebJob -ErrorAction SilentlyContinue
    Remove-Job -Job $RuntimeJob -ErrorAction SilentlyContinue
    Remove-Job -Job $WebJob -ErrorAction SilentlyContinue
    Write-Host "👋 Goodbye!" -ForegroundColor Green
}


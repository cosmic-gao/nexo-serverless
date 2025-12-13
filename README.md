# Nexo Serverless

基于 **rusty_v8** (V8 Isolate) 的 Serverless 函数运行平台。

## 架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Nexo Serverless 平台                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Web 控制台  │    │   REST API   │    │  函数网关      │     │
│  │  (React)     │───▶│  (Axum)      │───▶│  /fn/*       │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                            │                   │            │
│                            ▼                   ▼            │
│                    ┌─────────────────────────────┐          │
│                    │      Isolate Pool           │          │
│                    │   (Semaphore 并发控制)        │          │
│                    └─────────────────────────────┘          │
│                            │                                │
│           ┌────────────────┼────────────────┐               │
│           ▼                ▼                ▼               │
│    ┌───────────┐    ┌───────────┐    ┌───────────┐         │
│    │ V8 Isolate │    │ V8 Isolate │    │ V8 Isolate │         │
│    │  (rusty_v8)│    │  (rusty_v8)│    │  (rusty_v8)│         │
│    └───────────┘    └───────────┘    └───────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 核心特性

### V8 Isolate 运行时

- **直接使用 rusty_v8** - 不依赖 Deno，更轻量
- **毫秒级冷启动** - V8 Isolate 创建时间 < 5ms
- **安全沙箱隔离** - 每个函数运行在独立 Isolate，无法互相访问
- **资源限制** - 支持 CPU 时间和堆内存限制
- **高密度部署** - 单机可运行数千个 Isolate

### 项目结构

```
nexo-serverless/
├── runtime/                    # Rust 运行时
│   ├── src/
│   │   ├── main.rs            # 入口
│   │   ├── isolate.rs         # V8 Isolate 封装 (rusty_v8)
│   │   ├── pool.rs            # Isolate 池 (并发控制)
│   │   ├── function.rs        # 函数存储
│   │   ├── runtime.rs         # 运行时协调
│   │   └── api.rs             # HTTP API (Axum)
│   └── Cargo.toml
│
├── src/                        # Web 控制台 (React)
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Functions.tsx
│   │   └── FunctionEditor.tsx
│   └── lib/
│       └── api.ts
└── package.json
```

## 函数 API

```javascript
// handler 函数会在每次请求时被调用
function handler(request, { env }) {
  // request 对象
  // - request.url      请求 URL
  // - request.method   HTTP 方法
  // - request.headers  请求头
  // - request.body     请求体字符串
  // - request.json()   解析 JSON body

  // env 对象
  // - env.get(key)     获取环境变量

  return {
    message: "Hello from Nexo!",
    timestamp: new Date().toISOString()
  };
}
```

## REST API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/stats` | 运行时统计 |
| GET | `/api/functions` | 列出所有函数 |
| POST | `/api/functions` | 创建函数 |
| GET | `/api/functions/:id` | 获取函数详情 |
| PUT | `/api/functions/:id` | 更新函数 |
| DELETE | `/api/functions/:id` | 删除函数 |
| POST | `/api/functions/:id/invoke` | 调用函数 |
| GET | `/api/functions/:id/stats` | 函数统计 |
| ANY | `/fn/*` | 通过路由调用函数 |

## 快速开始

### 一键启动（推荐）

```bash
# 安装依赖
pnpm install

# 一键启动 Runtime + Web 控制台
pnpm dev:all
```

> ⚠️ 首次编译 Rust 运行时会下载 V8 预编译二进制，需要几分钟时间。

### 或者分别启动

**启动 Runtime (Rust):**
```bash
cd runtime
cargo run --release
```

**启动 Web 控制台:**
```bash
pnpm dev
```

### 3. 创建函数

```bash
curl -X POST http://localhost:3000/api/functions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "hello-world",
    "route": "/api/hello",
    "methods": ["GET", "POST"],
    "code": "function handler(request) { return { message: \"Hello!\" }; }"
  }'
```

### 4. 调用函数

```bash
curl http://localhost:3000/fn/api/hello
```

## 环境变量

| 变量 | 默认值 | 描述 |
|------|--------|------|
| `NEXO_ADDR` | `0.0.0.0:3000` | 服务监听地址 |
| `NEXO_MAX_CONCURRENT` | `100` | 最大并发 Isolate 数 |
| `RUST_LOG` | `info` | 日志级别 |

## 技术栈

### 运行时
- **rusty_v8** - V8 引擎 Rust 绑定
- **Axum** - 高性能 Web 框架
- **Tokio** - 异步运行时

### 控制台
- **React + TypeScript**
- **Tailwind CSS**
- **Vite**

## 与其他方案对比

| 方案 | 引擎 | 优势 | 劣势 |
|------|------|------|------|
| **Nexo (rusty_v8)** | V8 | 轻量、直接控制 | 需要自己实现 API |
| deno_core | V8 | 更多内置功能 | 依赖较重 |
| quickjs-rs | QuickJS | 超轻量 | 性能稍弱 |
| Bun | JavaScriptCore | 快速 | 不提供 Isolate API |

## License

MIT

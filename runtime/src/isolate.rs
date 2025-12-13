//! V8 Isolate wrapper for executing JavaScript functions
//!
//! 使用 rusty_v8 直接操作 V8 引擎，实现轻量级沙箱隔离执行环境。
//! 每个 Isolate 拥有独立的堆内存，无法访问其他 Isolate 的数据。

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::time::Instant;
use v8;

/// V8 平台初始化（全局只需一次）
static V8_INIT: std::sync::Once = std::sync::Once::new();

/// 初始化 V8 平台
pub fn init_v8() {
    V8_INIT.call_once(|| {
        let platform = v8::new_default_platform(0, false).make_shared();
        v8::V8::initialize_platform(platform);
        v8::V8::initialize();
    });
}

/// Isolate 配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IsolateConfig {
    /// 最大执行时间（毫秒）
    pub max_execution_time_ms: u64,
    /// 最大堆内存（字节）
    pub max_heap_size_bytes: usize,
    /// 函数 ID
    pub function_id: String,
}

impl Default for IsolateConfig {
    fn default() -> Self {
        Self {
            max_execution_time_ms: 50,
            max_heap_size_bytes: 128 * 1024 * 1024, // 128MB
            function_id: String::new(),
        }
    }
}

/// 执行结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionResult {
    pub success: bool,
    pub output: Option<serde_json::Value>,
    pub error: Option<String>,
    pub execution_time_ms: u64,
    pub memory_used_bytes: usize,
    pub logs: Vec<String>,
}

/// Nexo V8 Isolate - 轻量级 JavaScript 执行沙箱
pub struct NexoIsolate {
    config: IsolateConfig,
}

impl NexoIsolate {
    /// 创建新的 Isolate
    pub fn new(config: IsolateConfig) -> Self {
        init_v8();
        Self { config }
    }

    /// 执行 JavaScript 代码
    pub fn execute(&self, code: &str, request_data: serde_json::Value) -> Result<ExecutionResult> {
        let start_time = Instant::now();
        let mut logs: Vec<String> = Vec::new();

        // 创建 Isolate 参数，设置堆限制
        let create_params = v8::CreateParams::default()
            .heap_limits(0, self.config.max_heap_size_bytes);

        // 创建 Isolate
        let isolate = &mut v8::Isolate::new(create_params);

        // 设置执行超时
        let timeout_ms = self.config.max_execution_time_ms;
        let start = Instant::now();

        // 执行代码
        let result = {
            let handle_scope = &mut v8::HandleScope::new(isolate);
            let context = v8::Context::new(handle_scope);
            let scope = &mut v8::ContextScope::new(handle_scope, context);

            // 注入全局对象和函数
            self.inject_globals(scope, &request_data, &mut logs)?;

            // 编译并执行代码
            match self.compile_and_run(scope, code, &request_data, timeout_ms, start) {
                Ok(value) => {
                    let execution_time_ms = start_time.elapsed().as_millis() as u64;
                    
                    // 获取堆统计
                    let mut stats = v8::HeapStatistics::default();
                    scope.get_heap_statistics(&mut stats);

                    ExecutionResult {
                        success: true,
                        output: Some(value),
                        error: None,
                        execution_time_ms,
                        memory_used_bytes: stats.used_heap_size(),
                        logs,
                    }
                }
                Err(e) => {
                    let execution_time_ms = start_time.elapsed().as_millis() as u64;
                    ExecutionResult {
                        success: false,
                        output: None,
                        error: Some(e.to_string()),
                        execution_time_ms,
                        memory_used_bytes: 0,
                        logs,
                    }
                }
            }
        };

        Ok(result)
    }

    /// 注入全局对象
    fn inject_globals(
        &self,
        scope: &mut v8::ContextScope<v8::HandleScope>,
        request_data: &serde_json::Value,
        _logs: &mut Vec<String>,
    ) -> Result<()> {
        let global = scope.get_current_context().global(scope);

        // 注入 console 对象
        self.inject_console(scope, global)?;
        
        // 注入 Response 类
        self.inject_response_class(scope, global)?;

        // 注入 __REQUEST__ 对象
        let request_key = v8::String::new(scope, "__REQUEST__").unwrap();
        let request_json = serde_json::to_string(request_data)?;
        let request_str = v8::String::new(scope, &request_json).unwrap();
        let request_val = v8::json::parse(scope, request_str).unwrap_or_else(|| {
            v8::Object::new(scope).into()
        });
        global.set(scope, request_key.into(), request_val);

        Ok(())
    }
    
    /// 注入 Response 类（模拟 Web API Response）
    fn inject_response_class(
        &self,
        scope: &mut v8::ContextScope<v8::HandleScope>,
        global: v8::Local<v8::Object>,
    ) -> Result<()> {
        // 定义 Response 类作为 JavaScript 代码
        let response_class_code = r#"
            class Response {
                constructor(body, options = {}) {
                    this.body = body;
                    this.status = options.status || 200;
                    this.statusText = options.statusText || 'OK';
                    this.headers = options.headers || {};
                    this._isResponse = true;
                }
                
                text() {
                    return this.body;
                }
                
                json() {
                    return JSON.parse(this.body);
                }
            }
            globalThis.Response = Response;
        "#;
        
        let code = v8::String::new(scope, response_class_code).unwrap();
        let script = v8::Script::compile(scope, code, None)
            .ok_or_else(|| anyhow!("Failed to compile Response class"))?;
        script.run(scope)
            .ok_or_else(|| anyhow!("Failed to run Response class definition"))?;
        
        let _ = global; // 使用 global 避免警告
        Ok(())
    }

    /// 注入 console 对象
    fn inject_console(
        &self,
        scope: &mut v8::ContextScope<v8::HandleScope>,
        global: v8::Local<v8::Object>,
    ) -> Result<()> {
        let console = v8::Object::new(scope);
        
        // console.log
        let log_fn = v8::Function::new(scope, |scope: &mut v8::HandleScope,
                                        args: v8::FunctionCallbackArguments,
                                        mut _rv: v8::ReturnValue| {
            let mut parts = Vec::new();
            for i in 0..args.length() {
                let arg = args.get(i);
                if let Some(s) = arg.to_string(scope) {
                    parts.push(s.to_rust_string_lossy(scope));
                }
            }
            let msg = parts.join(" ");
            // 在实际实现中，这里会收集日志
            println!("[LOG] {}", msg);
        }).unwrap();

        let log_key = v8::String::new(scope, "log").unwrap();
        console.set(scope, log_key.into(), log_fn.into());

        // console.error
        let error_fn = v8::Function::new(scope, |scope: &mut v8::HandleScope,
                                          args: v8::FunctionCallbackArguments,
                                          mut _rv: v8::ReturnValue| {
            let mut parts = Vec::new();
            for i in 0..args.length() {
                let arg = args.get(i);
                if let Some(s) = arg.to_string(scope) {
                    parts.push(s.to_rust_string_lossy(scope));
                }
            }
            let msg = parts.join(" ");
            println!("[ERROR] {}", msg);
        }).unwrap();

        let error_key = v8::String::new(scope, "error").unwrap();
        console.set(scope, error_key.into(), error_fn.into());

        // console.warn
        let warn_fn = v8::Function::new(scope, |scope: &mut v8::HandleScope,
                                         args: v8::FunctionCallbackArguments,
                                         mut _rv: v8::ReturnValue| {
            let mut parts = Vec::new();
            for i in 0..args.length() {
                let arg = args.get(i);
                if let Some(s) = arg.to_string(scope) {
                    parts.push(s.to_rust_string_lossy(scope));
                }
            }
            let msg = parts.join(" ");
            println!("[WARN] {}", msg);
        }).unwrap();

        let warn_key = v8::String::new(scope, "warn").unwrap();
        console.set(scope, warn_key.into(), warn_fn.into());

        let console_key = v8::String::new(scope, "console").unwrap();
        global.set(scope, console_key.into(), console.into());

        Ok(())
    }

    /// 编译并执行代码
    fn compile_and_run(
        &self,
        scope: &mut v8::ContextScope<v8::HandleScope>,
        user_code: &str,
        _request_data: &serde_json::Value,
        timeout_ms: u64,
        start: Instant,
    ) -> Result<serde_json::Value> {
        // 包装用户代码
        let wrapped_code = format!(r#"
            (function() {{
                // 请求对象
                var request = {{
                    url: __REQUEST__.url || '',
                    method: __REQUEST__.method || 'GET',
                    headers: __REQUEST__.headers || {{}},
                    body: __REQUEST__.body || null,
                    json: function() {{ 
                        return this.body ? JSON.parse(this.body) : null; 
                    }}
                }};

                // 环境变量对象
                var envData = __REQUEST__.env || {{}};
                var env = {{
                    get: function(key) {{ 
                        return envData[key]; 
                    }}
                }};
                
                // 上下文对象（传递给 handler 的第二个参数）
                var ctx = {{ env: env }};

                // 用户代码
                {user_code}

                // 调用 handler
                if (typeof handler === 'function') {{
                    var result = handler(request, ctx);
                    // 如果是 Promise，尝试获取同步结果（对于简单的 async 函数）
                    if (result && typeof result.then === 'function') {{
                        // 无法在同步上下文中 await，返回提示
                        return JSON.stringify({{ 
                            error: "Async functions are not fully supported. Please use synchronous handler.",
                            hint: "Remove 'async' keyword from your handler function."
                        }});
                    }}
                    // 处理 Response 对象
                    if (result && result._isResponse) {{
                        return JSON.stringify({{
                            __isResponse: true,
                            body: result.body,
                            status: result.status,
                            statusText: result.statusText,
                            headers: result.headers
                        }});
                    }}
                    return JSON.stringify(result);
                }} else if (typeof main === 'function') {{
                    var result = main(request);
                    if (result && typeof result.then === 'function') {{
                        return JSON.stringify({{ 
                            error: "Async functions are not fully supported. Please use synchronous handler."
                        }});
                    }}
                    // 处理 Response 对象
                    if (result && result._isResponse) {{
                        return JSON.stringify({{
                            __isResponse: true,
                            body: result.body,
                            status: result.status,
                            statusText: result.statusText,
                            headers: result.headers
                        }});
                    }}
                    return JSON.stringify(result);
                }}
                
                return JSON.stringify(null);
            }})()
        "#);

        // 编译脚本
        let code = v8::String::new(scope, &wrapped_code)
            .ok_or_else(|| anyhow!("Failed to create code string"))?;

        let script = v8::Script::compile(scope, code, None)
            .ok_or_else(|| anyhow!("Failed to compile script"))?;

        // 检查超时
        if start.elapsed().as_millis() as u64 > timeout_ms {
            return Err(anyhow!("Execution timeout: exceeded {}ms limit", timeout_ms));
        }

        // 执行脚本
        let result = script.run(scope)
            .ok_or_else(|| anyhow!("Script execution failed"))?;

        // 检查超时
        if start.elapsed().as_millis() as u64 > timeout_ms {
            return Err(anyhow!("Execution timeout: exceeded {}ms limit", timeout_ms));
        }

        // 转换结果
        if let Some(result_str) = result.to_string(scope) {
            let json_str = result_str.to_rust_string_lossy(scope);
            let value: serde_json::Value = serde_json::from_str(&json_str)
                .unwrap_or(serde_json::Value::Null);
            Ok(value)
        } else {
            Ok(serde_json::Value::Null)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_execution() {
        let isolate = NexoIsolate::new(IsolateConfig::default());
        let code = r#"
            function handler(request) {
                return { message: "Hello, Nexo!" };
            }
        "#;

        let result = isolate.execute(code, serde_json::json!({})).unwrap();
        assert!(result.success);
        assert!(result.output.is_some());
    }

    #[test]
    fn test_request_data() {
        let isolate = NexoIsolate::new(IsolateConfig::default());
        let code = r#"
            function handler(request) {
                return { 
                    url: request.url,
                    method: request.method 
                };
            }
        "#;

        let request = serde_json::json!({
            "url": "/api/test",
            "method": "POST"
        });

        let result = isolate.execute(code, request).unwrap();
        assert!(result.success);
        
        let output = result.output.unwrap();
        assert_eq!(output["url"], "/api/test");
        assert_eq!(output["method"], "POST");
    }

    #[test]
    fn test_console_log() {
        let isolate = NexoIsolate::new(IsolateConfig::default());
        let code = r#"
            function handler(request) {
                console.log("Hello from isolate!");
                return { logged: true };
            }
        "#;

        let result = isolate.execute(code, serde_json::json!({})).unwrap();
        assert!(result.success);
    }

    #[test]
    fn test_syntax_error() {
        let isolate = NexoIsolate::new(IsolateConfig::default());
        let code = r#"
            function handler(request) {
                return { invalid syntax here
            }
        "#;

        let result = isolate.execute(code, serde_json::json!({})).unwrap();
        assert!(!result.success);
        assert!(result.error.is_some());
    }
}

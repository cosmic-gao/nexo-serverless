#!/usr/bin/env node
/**
 * Nexo Serverless 一键启动脚本
 * 同时启动 Rust 运行时和 Web 控制台
 */

import { spawn, execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(__dirname);

console.log('🚀 Starting Nexo Serverless...\n');

// 颜色
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
};

function log(prefix, color, message) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

// 停止已运行的 nexo-runtime 进程（Windows）
if (process.platform === 'win32') {
  try {
    execSync('taskkill /F /IM nexo-runtime.exe 2>nul', { stdio: 'ignore' });
    console.log(`${colors.yellow}🛑 Stopped existing nexo-runtime process${colors.reset}`);
  } catch {
    // 进程不存在，忽略错误
  }
} else {
  try {
    execSync('pkill -f nexo-runtime 2>/dev/null', { stdio: 'ignore' });
    console.log(`${colors.yellow}🛑 Stopped existing nexo-runtime process${colors.reset}`);
  } catch {
    // 进程不存在，忽略错误
  }
}

// 启动 Runtime (Rust)
console.log(`${colors.cyan}🔧 Starting Runtime (Rust)...${colors.reset}`);
const runtime = spawn('cargo', ['run', '--release'], {
  cwd: join(projectRoot, 'runtime'),
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'],
});

runtime.stdout?.on('data', (data) => {
  data.toString().trim().split('\n').forEach(line => {
    if (line) log('Runtime', colors.blue, line);
  });
});

runtime.stderr?.on('data', (data) => {
  data.toString().trim().split('\n').forEach(line => {
    if (line) log('Runtime', colors.blue, line);
  });
});

runtime.on('error', (err) => {
  log('Runtime', colors.red, `Error: ${err.message}`);
  log('Runtime', colors.yellow, 'Make sure Rust is installed: https://rustup.rs');
});

// 启动 Web Console
console.log(`${colors.magenta}🌐 Starting Web Console...${colors.reset}`);
const web = spawn('npx', ['vite'], {
  cwd: join(projectRoot, 'apps', 'web'),
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'],
});

web.stdout?.on('data', (data) => {
  data.toString().trim().split('\n').forEach(line => {
    if (line) log('Web', colors.magenta, line);
  });
});

web.stderr?.on('data', (data) => {
  data.toString().trim().split('\n').forEach(line => {
    if (line) log('Web', colors.magenta, line);
  });
});

// 等待一下再显示信息
setTimeout(() => {
  console.log(`
${colors.green}✅ Services starting...${colors.reset}

   ${colors.blue}Runtime API:${colors.reset}  http://localhost:3000
   ${colors.magenta}Web Console:${colors.reset}  http://localhost:5173

${colors.yellow}Press Ctrl+C to stop all services${colors.reset}
`);
}, 2000);

// 清理
function cleanup() {
  console.log(`\n${colors.yellow}🛑 Stopping services...${colors.reset}`);
  runtime.kill('SIGTERM');
  web.kill('SIGTERM');
  setTimeout(() => {
    console.log(`${colors.green}👋 Goodbye!${colors.reset}`);
    process.exit(0);
  }, 500);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// 监听进程退出
runtime.on('close', (code) => {
  if (code !== 0 && code !== null) {
    log('Runtime', colors.red, `Exited with code ${code}`);
  }
});

web.on('close', (code) => {
  if (code !== 0 && code !== null) {
    log('Web', colors.red, `Exited with code ${code}`);
  }
});


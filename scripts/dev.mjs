#!/usr/bin/env node
/**
 * Nexo Serverless 一键启动脚本
 * 同时启动 Rust 运行时、Admin 控制台和 Codex
 */

import { spawn, execSync, exec } from 'child_process';
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
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: process.platform === 'win32', // Windows 上使用 shell
  env: process.env,
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

runtime.on('exit', (code, signal) => {
  if (code !== 0 && code !== null) {
    log('Runtime', colors.red, `Exited with code ${code}${signal ? ` (signal: ${signal})` : ''}`);
  }
});

// 启动 Web Console (Admin)
console.log(`${colors.magenta}🌐 Starting Admin Console...${colors.reset}`);

// 在 Windows 上使用 shell: true 让系统自动处理命令
let web;
if (process.platform === 'win32') {
  // Windows 上使用 shell: true，让系统自动找到 pnpm
  web = spawn('pnpm', ['dev'], {
    cwd: join(projectRoot, 'apps', 'admin'),
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true, // 使用 shell 让系统自动处理 pnpm.cmd
    env: process.env,
  });
} else {
  // Unix 系统使用 spawn
  web = spawn('pnpm', ['dev'], {
    cwd: join(projectRoot, 'apps', 'admin'),
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: false,
    env: process.env,
  });
}

web.stdout?.on('data', (data) => {
  data.toString().trim().split('\n').forEach(line => {
    if (line) log('Admin', colors.magenta, line);
  });
});

web.stderr?.on('data', (data) => {
  data.toString().trim().split('\n').forEach(line => {
    if (line) log('Admin', colors.magenta, line);
  });
});

web.on('error', (err) => {
  log('Admin', colors.red, `Error: ${err.message}`);
  log('Admin', colors.yellow, 'Make sure Node.js and pnpm are installed');
});

web.on('exit', (code, signal) => {
  if (code !== 0 && code !== null) {
    log('Admin', colors.red, `Exited with code ${code}${signal ? ` (signal: ${signal})` : ''}`);
  }
});

// 启动 Codex
console.log(`${colors.cyan}💻 Starting Codex...${colors.reset}`);

let codex;
if (process.platform === 'win32') {
  codex = spawn('pnpm', ['dev'], {
    cwd: join(projectRoot, 'apps', 'codex'),
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    env: process.env,
  });
} else {
  codex = spawn('pnpm', ['dev'], {
    cwd: join(projectRoot, 'apps', 'codex'),
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: false,
    env: process.env,
  });
}

codex.stdout?.on('data', (data) => {
  data.toString().trim().split('\n').forEach(line => {
    if (line) log('Codex', colors.cyan, line);
  });
});

codex.stderr?.on('data', (data) => {
  data.toString().trim().split('\n').forEach(line => {
    if (line) log('Codex', colors.cyan, line);
  });
});

codex.on('error', (err) => {
  log('Codex', colors.red, `Error: ${err.message}`);
  log('Codex', colors.yellow, 'Make sure Node.js and pnpm are installed');
});

codex.on('exit', (code, signal) => {
  if (code !== 0 && code !== null) {
    log('Codex', colors.red, `Exited with code ${code}${signal ? ` (signal: ${signal})` : ''}`);
  }
});

// 等待一下再显示信息
setTimeout(() => {
  console.log(`
${colors.green}✅ Services starting...${colors.reset}

   ${colors.blue}Runtime API:${colors.reset}  http://localhost:3000
   ${colors.magenta}Admin Console:${colors.reset}  http://localhost:5173
   ${colors.cyan}Codex:${colors.reset}  http://localhost:5174

${colors.yellow}Press Ctrl+C to stop all services${colors.reset}
`);
}, 2000);

// 清理
function cleanup() {
  console.log(`\n${colors.yellow}🛑 Stopping services...${colors.reset}`);
  runtime.kill('SIGTERM');
  web.kill('SIGTERM');
  codex.kill('SIGTERM');
  setTimeout(() => {
    console.log(`${colors.green}👋 Goodbye!${colors.reset}`);
    process.exit(0);
  }, 500);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// 监听进程退出（保留用于兼容性）

web.on('close', (code) => {
  if (code !== 0 && code !== null) {
    log('Admin', colors.red, `Exited with code ${code}`);
  }
});

codex.on('close', (code) => {
  if (code !== 0 && code !== null) {
    log('Codex', colors.red, `Exited with code ${code}`);
  }
});


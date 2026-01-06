#!/usr/bin/env node

/**
 * 开发环境启动脚本
 * 同时启动前后端服务并进行集成验证
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 进程管理
const processes = new Map();

/**
 * 启动后端服务
 */
function startBackend() {
  return new Promise((resolve, reject) => {
    colorLog('blue', '🚀 启动后端服务...');
    
    const backendPath = path.join(__dirname, '..', 'backend');
    const backend = spawn('npm', ['run', 'dev'], {
      cwd: backendPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });
    
    processes.set('backend', backend);
    
    let startupComplete = false;
    
    backend.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[后端] ${output.trim()}`);
      
      // 检查服务是否启动成功
      if (output.includes('服务器已启动在端口') && !startupComplete) {
        startupComplete = true;
        colorLog('green', '✅ 后端服务启动成功');
        resolve(backend);
      }
    });
    
    backend.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(`[后端错误] ${output.trim()}`);
    });
    
    backend.on('error', (error) => {
      colorLog('red', `❌ 后端服务启动失败: ${error.message}`);
      reject(error);
    });
    
    backend.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        colorLog('red', `❌ 后端服务异常退出，代码: ${code}`);
        processes.delete('backend');
      }
    });
    
    // 超时处理
    setTimeout(() => {
      if (!startupComplete) {
        colorLog('yellow', '⚠️  后端服务启动超时，但继续等待...');
        resolve(backend);
      }
    }, 30000);
  });
}

/**
 * 启动前端服务
 */
function startFrontend() {
  return new Promise((resolve, reject) => {
    colorLog('blue', '🌐 启动前端服务...');
    
    const frontendPath = path.join(__dirname, '..', 'frontend');
    const frontend = spawn('npm', ['run', 'dev:h5'], {
      cwd: frontendPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });
    
    processes.set('frontend', frontend);
    
    let startupComplete = false;
    
    frontend.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[前端] ${output.trim()}`);
      
      // 检查服务是否启动成功
      if ((output.includes('Local:') || output.includes('ready in')) && !startupComplete) {
        startupComplete = true;
        colorLog('green', '✅ 前端服务启动成功');
        resolve(frontend);
      }
    });
    
    frontend.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(`[前端错误] ${output.trim()}`);
    });
    
    frontend.on('error', (error) => {
      colorLog('red', `❌ 前端服务启动失败: ${error.message}`);
      reject(error);
    });
    
    frontend.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        colorLog('red', `❌ 前端服务异常退出，代码: ${code}`);
        processes.delete('frontend');
      }
    });
    
    // 超时处理
    setTimeout(() => {
      if (!startupComplete) {
        colorLog('yellow', '⚠️  前端服务启动超时，但继续等待...');
        resolve(frontend);
      }
    }, 30000);
  });
}

/**
 * 等待服务就绪
 */
function waitForServices() {
  return new Promise((resolve) => {
    colorLog('yellow', '⏳ 等待服务完全就绪...');
    setTimeout(() => {
      colorLog('green', '✅ 服务就绪检查完成');
      resolve();
    }, 5000);
  });
}

/**
 * 运行集成测试
 */
async function runIntegrationTest() {
  colorLog('blue', '🧪 运行集成测试...');
  
  try {
    const { runIntegrationTests } = require('./integration-test.js');
    await runIntegrationTests();
    colorLog('green', '✅ 集成测试通过');
    return true;
  } catch (error) {
    colorLog('red', `❌ 集成测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 显示服务信息
 */
function showServiceInfo() {
  colorLog('cyan', '\n📋 服务信息:');
  console.log('  后端服务: http://localhost:3000');
  console.log('  前端服务: http://localhost:8080');
  console.log('  健康检查: http://localhost:3000/api/health');
  console.log('  抽签接口: http://localhost:3000/api/fortune');
  
  colorLog('cyan', '\n🎯 可用命令:');
  console.log('  Ctrl+C: 停止所有服务');
  console.log('  npm run test:integration: 运行集成测试');
  console.log('  npm run build: 构建项目');
}

/**
 * 优雅关闭
 */
function gracefulShutdown() {
  colorLog('yellow', '\n🛑 正在关闭服务...');
  
  processes.forEach((process, name) => {
    colorLog('yellow', `关闭${name}服务...`);
    process.kill('SIGTERM');
  });
  
  setTimeout(() => {
    processes.forEach((process, name) => {
      if (!process.killed) {
        colorLog('red', `强制关闭${name}服务...`);
        process.kill('SIGKILL');
      }
    });
    
    colorLog('green', '✅ 所有服务已关闭');
    process.exit(0);
  }, 5000);
}

/**
 * 主启动函数
 */
async function startDevelopment() {
  try {
    colorLog('magenta', '🎉 启动微信小程序新年抽签应用开发环境');
    colorLog('magenta', '='.repeat(50));
    
    // 检查依赖
    const backendPackage = path.join(__dirname, '..', 'backend', 'package.json');
    const frontendPackage = path.join(__dirname, '..', 'frontend', 'package.json');
    
    if (!fs.existsSync(backendPackage)) {
      throw new Error('后端package.json不存在，请先安装后端依赖');
    }
    
    if (!fs.existsSync(frontendPackage)) {
      throw new Error('前端package.json不存在，请先安装前端依赖');
    }
    
    // 启动后端服务
    await startBackend();
    
    // 等待后端完全启动
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 启动前端服务
    await startFrontend();
    
    // 等待服务就绪
    await waitForServices();
    
    // 运行集成测试
    const testPassed = await runIntegrationTest();
    
    if (testPassed) {
      colorLog('green', '\n🎉 开发环境启动成功！');
    } else {
      colorLog('yellow', '\n⚠️  开发环境启动完成，但集成测试有问题');
    }
    
    // 显示服务信息
    showServiceInfo();
    
    // 设置优雅关闭
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
    
  } catch (error) {
    colorLog('red', `❌ 启动失败: ${error.message}`);
    gracefulShutdown();
  }
}

// 运行启动脚本
if (require.main === module) {
  startDevelopment();
}

module.exports = {
  startDevelopment,
  startBackend,
  startFrontend,
  gracefulShutdown
};
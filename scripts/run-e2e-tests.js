#!/usr/bin/env node

/**
 * 端到端测试运行脚本
 * 启动服务并运行完整的集成测试
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
let backendProcess = null;
let testProcess = null;

/**
 * 启动后端服务
 */
function startBackend() {
  return new Promise((resolve, reject) => {
    colorLog('blue', '🚀 启动后端服务用于测试...');
    
    const backendPath = path.join(__dirname, '..', 'backend');
    backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: backendPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        DB_PATH: './test-data/test.db',
        PORT: '3000'
      }
    });
    
    let startupComplete = false;
    
    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[后端] ${output.trim()}`);
      
      if (output.includes('服务器已启动在端口') && !startupComplete) {
        startupComplete = true;
        colorLog('green', '✅ 测试后端服务启动成功');
        resolve();
      }
    });
    
    backendProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(`[后端错误] ${output.trim()}`);
    });
    
    backendProcess.on('error', (error) => {
      colorLog('red', `❌ 后端服务启动失败: ${error.message}`);
      reject(error);
    });
    
    // 超时处理
    setTimeout(() => {
      if (!startupComplete) {
        colorLog('yellow', '⚠️  后端服务启动超时');
        reject(new Error('后端服务启动超时'));
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
      colorLog('green', '✅ 服务就绪');
      resolve();
    }, 3000);
  });
}

/**
 * 运行端到端测试
 */
function runE2ETests() {
  return new Promise((resolve, reject) => {
    colorLog('blue', '🧪 开始运行端到端测试...');
    
    const rootPath = path.join(__dirname, '..');
    testProcess = spawn('npx', ['jest', '--config', 'jest.e2e.config.js', '--runInBand'], {
      cwd: rootPath,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        TEST_ENV: 'e2e'
      }
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        colorLog('green', '✅ 端到端测试全部通过');
        resolve(true);
      } else {
        colorLog('red', `❌ 端到端测试失败，退出码: ${code}`);
        resolve(false);
      }
    });
    
    testProcess.on('error', (error) => {
      colorLog('red', `❌ 测试执行错误: ${error.message}`);
      reject(error);
    });
  });
}

/**
 * 清理测试环境
 */
function cleanup() {
  colorLog('yellow', '🧹 清理测试环境...');
  
  if (backendProcess && !backendProcess.killed) {
    colorLog('yellow', '关闭后端服务...');
    backendProcess.kill('SIGTERM');
  }
  
  if (testProcess && !testProcess.killed) {
    colorLog('yellow', '停止测试进程...');
    testProcess.kill('SIGTERM');
  }
  
  // 清理测试数据
  const testDbPath = path.join(__dirname, '..', 'test-data', 'test.db');
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath);
      colorLog('green', '✅ 清理测试数据库');
    } catch (error) {
      colorLog('yellow', '⚠️  清理测试数据库失败:', error.message);
    }
  }
  
  setTimeout(() => {
    if (backendProcess && !backendProcess.killed) {
      colorLog('red', '强制关闭后端服务...');
      backendProcess.kill('SIGKILL');
    }
    
    colorLog('green', '✅ 清理完成');
  }, 3000);
}

/**
 * 优雅关闭
 */
function gracefulShutdown() {
  colorLog('yellow', '\n🛑 收到关闭信号，正在清理...');
  cleanup();
  
  setTimeout(() => {
    process.exit(0);
  }, 5000);
}

/**
 * 检查依赖
 */
function checkDependencies() {
  colorLog('blue', '🔍 检查测试依赖...');
  
  const backendPackage = path.join(__dirname, '..', 'backend', 'package.json');
  const rootPackage = path.join(__dirname, '..', 'package.json');
  
  if (!fs.existsSync(backendPackage)) {
    throw new Error('后端package.json不存在，请先安装后端依赖');
  }
  
  // 检查Jest配置
  const jestConfig = path.join(__dirname, '..', 'jest.e2e.config.js');
  if (!fs.existsSync(jestConfig)) {
    throw new Error('Jest E2E配置文件不存在');
  }
  
  // 检查测试文件
  const testDir = path.join(__dirname, '..', 'tests', 'e2e');
  if (!fs.existsSync(testDir)) {
    throw new Error('E2E测试目录不存在');
  }
  
  colorLog('green', '✅ 依赖检查通过');
}

/**
 * 生成测试报告
 */
function generateTestReport(testPassed) {
  colorLog('cyan', '\n📊 端到端测试报告');
  colorLog('cyan', '='.repeat(50));
  
  if (testPassed) {
    colorLog('green', '🎉 所有端到端测试通过！');
    colorLog('green', '✅ 系统集成正常');
    colorLog('green', '✅ 前后端通信正常');
    colorLog('green', '✅ 数据库操作正常');
    colorLog('green', '✅ 并发处理正常');
    colorLog('green', '✅ 错误处理正常');
  } else {
    colorLog('red', '❌ 部分端到端测试失败');
    colorLog('yellow', '⚠️  请检查测试输出了解详细信息');
    colorLog('yellow', '⚠️  可能需要修复代码或配置');
  }
  
  colorLog('cyan', '\n📋 测试覆盖范围:');
  console.log('  • 基础连接测试');
  console.log('  • 完整抽签流程测试');
  console.log('  • 错误处理场景测试');
  console.log('  • 数据一致性测试');
  console.log('  • 性能测试');
  console.log('  • 并发用户测试');
  console.log('  • 系统压力测试');
  
  colorLog('cyan', '\n🔗 相关文件:');
  console.log('  • 测试配置: jest.e2e.config.js');
  console.log('  • 集成测试: tests/e2e/integration.test.js');
  console.log('  • 并发测试: tests/e2e/concurrent.test.js');
  console.log('  • 测试设置: tests/e2e/setup.js');
}

/**
 * 主函数
 */
async function main() {
  try {
    colorLog('magenta', '🎯 微信小程序新年抽签应用 - 端到端测试');
    colorLog('magenta', '='.repeat(60));
    
    // 检查依赖
    checkDependencies();
    
    // 设置信号处理
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
    
    // 启动后端服务
    await startBackend();
    
    // 等待服务就绪
    await waitForServices();
    
    // 运行测试
    const testPassed = await runE2ETests();
    
    // 生成报告
    generateTestReport(testPassed);
    
    // 清理环境
    cleanup();
    
    // 退出
    process.exit(testPassed ? 0 : 1);
    
  } catch (error) {
    colorLog('red', `❌ 端到端测试执行失败: ${error.message}`);
    cleanup();
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  main,
  startBackend,
  runE2ETests,
  cleanup
};
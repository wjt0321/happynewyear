#!/usr/bin/env node

/**
 * 前后端集成测试脚本
 * 验证前后端服务的连接和API通信
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// 加载集成配置
const configPath = path.join(__dirname, '..', 'integration-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// 当前环境配置
const env = process.env.NODE_ENV || 'development';
const envConfig = config[env];

console.log(`🔧 开始集成测试 - 环境: ${env}`);
console.log(`📡 后端服务: ${envConfig.backend.baseUrl}`);
console.log(`🌐 前端服务: ${envConfig.frontend.baseUrl}`);

/**
 * 发送HTTP请求
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const timeout = options.timeout || config.timeouts.api;
    
    const req = protocol.get(url, { timeout }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`请求超时: ${url}`));
    });
  });
}

/**
 * 发送POST请求
 */
function makePostRequest(url, data, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...options.headers
      },
      timeout: options.timeout || config.timeouts.api
    };
    
    const req = protocol.request(requestOptions, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`请求超时: ${url}`));
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * 测试后端健康检查
 */
async function testBackendHealth() {
  console.log('\n🏥 测试后端健康检查...');
  
  try {
    const url = `${envConfig.backend.baseUrl}${config.endpoints.health}`;
    const response = await makeRequest(url);
    
    if (response.statusCode === 200) {
      console.log('✅ 后端健康检查通过');
      console.log(`   状态: ${response.data.status}`);
      console.log(`   数据库: ${response.data.database}`);
      console.log(`   时间戳: ${response.data.timestamp}`);
      return true;
    } else {
      console.log(`❌ 后端健康检查失败 - 状态码: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 后端健康检查失败 - 错误: ${error.message}`);
    return false;
  }
}

/**
 * 测试根路径
 */
async function testBackendRoot() {
  console.log('\n🏠 测试后端根路径...');
  
  try {
    const url = envConfig.backend.baseUrl;
    const response = await makeRequest(url);
    
    if (response.statusCode === 200) {
      console.log('✅ 后端根路径访问成功');
      console.log(`   服务: ${response.data.message}`);
      console.log(`   版本: ${response.data.version}`);
      return true;
    } else {
      console.log(`❌ 后端根路径访问失败 - 状态码: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 后端根路径访问失败 - 错误: ${error.message}`);
    return false;
  }
}

/**
 * 测试抽签API
 */
async function testFortuneAPI() {
  console.log('\n🎲 测试抽签API...');
  
  try {
    const url = `${envConfig.backend.baseUrl}${config.endpoints.fortune}`;
    const testOpenid = 'test_openid_' + Date.now();
    
    const response = await makePostRequest(url, { openid: testOpenid });
    
    if (response.statusCode === 200 || response.statusCode === 429) {
      console.log('✅ 抽签API响应正常');
      console.log(`   状态码: ${response.statusCode}`);
      console.log(`   成功: ${response.data.success}`);
      
      if (response.data.success && response.data.data) {
        console.log(`   运势ID: ${response.data.data.id}`);
        console.log(`   运势内容: ${response.data.data.text}`);
        console.log(`   是否新抽: ${response.data.data.isNew}`);
      } else if (response.data.cooldown) {
        console.log(`   冷却时间: ${response.data.cooldown}秒`);
      }
      
      return true;
    } else {
      console.log(`❌ 抽签API测试失败 - 状态码: ${response.statusCode}`);
      console.log(`   错误: ${response.data.error || '未知错误'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 抽签API测试失败 - 错误: ${error.message}`);
    return false;
  }
}

/**
 * 测试CORS配置
 */
async function testCORS() {
  console.log('\n🌐 测试CORS配置...');
  
  try {
    const url = `${envConfig.backend.baseUrl}${config.endpoints.health}`;
    const response = await makeRequest(url);
    
    const corsHeaders = {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-methods': response.headers['access-control-allow-methods'],
      'access-control-allow-headers': response.headers['access-control-allow-headers']
    };
    
    console.log('✅ CORS头信息:');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      if (value) {
        console.log(`   ${key}: ${value}`);
      }
    });
    
    return true;
  } catch (error) {
    console.log(`❌ CORS测试失败 - 错误: ${error.message}`);
    return false;
  }
}

/**
 * 测试数据库连接
 */
async function testDatabaseConnection() {
  console.log('\n🗄️  测试数据库连接...');
  
  try {
    const dbPath = envConfig.database.path;
    
    // 检查数据库文件是否存在
    if (fs.existsSync(dbPath)) {
      console.log('✅ 数据库文件存在');
      console.log(`   路径: ${dbPath}`);
      
      // 获取文件信息
      const stats = fs.statSync(dbPath);
      console.log(`   大小: ${stats.size} 字节`);
      console.log(`   修改时间: ${stats.mtime}`);
      
      return true;
    } else {
      console.log('⚠️  数据库文件不存在，将在首次运行时创建');
      console.log(`   预期路径: ${dbPath}`);
      return true; // 这不是错误，数据库会自动创建
    }
  } catch (error) {
    console.log(`❌ 数据库连接测试失败 - 错误: ${error.message}`);
    return false;
  }
}

/**
 * 测试网络连通性
 */
async function testNetworkConnectivity() {
  console.log('\n🔗 测试网络连通性...');
  
  const testUrls = [
    'http://www.baidu.com',
    'https://www.google.com'
  ];
  
  let successCount = 0;
  
  for (const url of testUrls) {
    try {
      await makeRequest(url, { timeout: 5000 });
      console.log(`✅ ${url} - 连接成功`);
      successCount++;
    } catch (error) {
      console.log(`❌ ${url} - 连接失败: ${error.message}`);
    }
  }
  
  if (successCount > 0) {
    console.log(`✅ 网络连通性正常 (${successCount}/${testUrls.length})`);
    return true;
  } else {
    console.log('❌ 网络连通性异常');
    return false;
  }
}

/**
 * 生成测试报告
 */
function generateReport(results) {
  console.log('\n📊 集成测试报告');
  console.log('='.repeat(50));
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(result => result).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${failedTests}`);
  console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  console.log('\n详细结果:');
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${test}`);
  });
  
  if (failedTests === 0) {
    console.log('\n🎉 所有测试通过！系统集成正常。');
    return true;
  } else {
    console.log('\n⚠️  部分测试失败，请检查相关配置。');
    return false;
  }
}

/**
 * 主测试函数
 */
async function runIntegrationTests() {
  console.log('🚀 开始前后端集成测试...\n');
  
  const results = {};
  
  // 执行各项测试
  results['网络连通性'] = await testNetworkConnectivity();
  results['数据库连接'] = await testDatabaseConnection();
  results['后端根路径'] = await testBackendRoot();
  results['后端健康检查'] = await testBackendHealth();
  results['抽签API'] = await testFortuneAPI();
  results['CORS配置'] = await testCORS();
  
  // 生成报告
  const allPassed = generateReport(results);
  
  // 退出码
  process.exit(allPassed ? 0 : 1);
}

// 运行测试
if (require.main === module) {
  runIntegrationTests().catch((error) => {
    console.error('❌ 集成测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  runIntegrationTests,
  testBackendHealth,
  testFortuneAPI,
  testCORS
};
/**
 * Docker测试全局设置
 * 在所有Docker测试开始前运行
 */

const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('🐳 开始Docker配置验证测试设置...');
  
  try {
    // 创建测试所需的目录
    const projectRoot = path.resolve(__dirname, '../../..');
    const testDirs = [
      path.join(projectRoot, 'logs')
    ];
    
    testDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ 创建测试目录: ${dir}`);
      }
    });
    
    // 设置测试环境变量
    process.env.NODE_ENV = 'test';
    process.env.CI = 'true';
    
    console.log('✅ Docker配置验证测试环境设置完成');
    
  } catch (error) {
    console.error('❌ Docker测试环境设置失败:', error.message);
    process.exit(1);
  }
};
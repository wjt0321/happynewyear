/**
 * Docker测试全局清理
 * 在所有Docker测试完成后运行
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('🧹 开始Docker测试环境清理...');
  
  try {
    // 停止并删除所有测试容器
    console.log('停止测试容器...');
    try {
      execSync('docker stop $(docker ps -aq --filter "name=fortune-test")', { stdio: 'ignore' });
      execSync('docker rm -f $(docker ps -aq --filter "name=fortune-test")', { stdio: 'ignore' });
    } catch (error) {
      // 忽略错误，可能没有运行的容器
    }
    
    // 删除测试镜像
    console.log('删除测试镜像...');
    try {
      execSync('docker rmi -f $(docker images -q --filter "reference=wechat-fortune-draw:*test*")', { stdio: 'ignore' });
    } catch (error) {
      // 忽略错误，可能没有测试镜像
    }
    
    // 清理测试网络
    console.log('清理测试网络...');
    try {
      execSync('docker network rm $(docker network ls -q --filter "name=test")', { stdio: 'ignore' });
    } catch (error) {
      // 忽略错误
    }
    
    // 清理测试数据目录
    const projectRoot = path.resolve(__dirname, '../../..');
    const testDirs = [
      path.join(projectRoot, 'test-data'),
      path.join(projectRoot, 'test-logs')
    ];
    
    testDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        try {
          fs.rmSync(dir, { recursive: true, force: true });
          console.log(`✅ 清理测试目录: ${dir}`);
        } catch (error) {
          console.warn(`⚠️  无法删除目录 ${dir}: ${error.message}`);
        }
      }
    });
    
    // 清理临时文件
    const tempFiles = [
      path.join(projectRoot, 'docker-compose.test.yml'),
      path.join(projectRoot, '.env.test')
    ];
    
    tempFiles.forEach(file => {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
          console.log(`✅ 清理临时文件: ${file}`);
        } catch (error) {
          console.warn(`⚠️  无法删除文件 ${file}: ${error.message}`);
        }
      }
    });
    
    // 清理Docker系统（可选，谨慎使用）
    if (process.env.DOCKER_CLEANUP === 'true') {
      console.log('执行Docker系统清理...');
      try {
        execSync('docker system prune -f', { stdio: 'pipe' });
      } catch (error) {
        console.warn('Docker系统清理失败:', error.message);
      }
    }
    
    console.log('✅ Docker测试环境清理完成');
    
  } catch (error) {
    console.error('❌ Docker测试环境清理失败:', error.message);
    // 不要因为清理失败而导致测试失败
  }
};
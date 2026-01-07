# Docker容器化部署测试

本目录包含Docker容器化部署相关的测试，用于验证Docker镜像构建、容器启动、健康检查等功能。

## 测试概述

### 测试文件说明

- `docker-build.test.js` - Docker镜像构建测试
- `docker-compose.test.js` - Docker Compose部署测试  
- `deployment.test.js` - 部署脚本功能测试
- `setup.js` - 测试环境全局设置
- `teardown.js` - 测试环境全局清理

### 测试覆盖范围

#### 1. Docker镜像构建测试 (`docker-build.test.js`)
- ✅ Docker镜像成功构建
- ✅ 容器启动和健康检查
- ✅ 数据目录正确挂载
- ✅ 非root用户运行
- ✅ 环境变量正确传递
- ✅ API接口正常响应
- ✅ 容器日志输出
- ✅ 信号处理和优雅关闭

#### 2. Docker Compose部署测试 (`docker-compose.test.js`)
- ✅ Compose配置文件解析
- ✅ 服务构建和启动
- ✅ 健康检查通过
- ✅ 数据卷正确挂载
- ✅ 网络配置正常
- ✅ 环境变量传递
- ✅ API请求响应
- ✅ 日志输出
- ✅ 服务停止和清理
- ✅ 服务重启功能

#### 3. 部署脚本测试 (`deployment.test.js`)
- ✅ 脚本文件存在和权限
- ✅ 帮助信息显示
- ✅ Docker环境验证
- ✅ 配置文件验证
- ✅ 备份和恢复功能
- ✅ 日志功能
- ✅ 错误处理
- ✅ 权限和安全检查

## 运行测试

### 前提条件

1. **Docker环境**
   ```bash
   # 检查Docker是否安装
   docker --version
   docker-compose --version
   
   # 确保Docker服务运行
   docker info
   ```

2. **系统要求**
   - Docker 20.10.0+
   - Docker Compose 1.29.0+
   - Node.js 18+
   - 至少2GB可用内存
   - 至少5GB可用磁盘空间

### 运行方式

#### 1. 运行所有Docker测试
```bash
# 在backend目录下运行
npm run test:docker
```

#### 2. 运行详细输出的Docker测试
```bash
npm run test:docker:verbose
```

#### 3. 运行特定测试文件
```bash
# 只运行镜像构建测试
npx jest --config jest.docker.config.js docker-build.test.js

# 只运行Compose测试
npx jest --config jest.docker.config.js docker-compose.test.js

# 只运行部署脚本测试
npx jest --config jest.docker.config.js deployment.test.js
```

#### 4. 运行完整测试套件
```bash
# 运行所有类型的测试
npm run test:all
```

## 测试配置

### Jest配置 (`jest.docker.config.js`)

```javascript
{
  testTimeout: 300000,    // 5分钟超时
  maxWorkers: 1,          // 串行运行避免冲突
  cache: false,           // 禁用缓存
  bail: true,             // 遇错即停
  verbose: true           // 详细输出
}
```

### 环境变量

测试过程中会设置以下环境变量：
- `NODE_ENV=test`
- `CI=true`
- `DOCKER_CLEANUP=true` (可选，用于完整清理)

## 测试端口分配

为避免端口冲突，测试使用以下端口：
- `3001` - Docker镜像构建测试
- `3002` - Docker Compose测试
- `3000` - 默认应用端口（容器内）

## 故障排除

### 常见问题

#### 1. Docker守护进程未运行
```
Error: Cannot connect to the Docker daemon
```
**解决方案**: 启动Docker服务
```bash
# Linux
sudo systemctl start docker

# macOS/Windows
# 启动Docker Desktop
```

#### 2. 端口被占用
```
Error: Port 3001 is already in use
```
**解决方案**: 停止占用端口的进程或修改测试端口

#### 3. 权限不足
```
Error: permission denied while trying to connect to Docker daemon
```
**解决方案**: 将用户添加到docker组
```bash
sudo usermod -aG docker $USER
# 重新登录或重启终端
```

#### 4. 内存不足
```
Error: Cannot create container: no space left on device
```
**解决方案**: 清理Docker资源
```bash
docker system prune -a
docker volume prune
```

#### 5. 测试超时
```
Error: Timeout - Async callback was not invoked within the 300000ms timeout
```
**解决方案**: 
- 检查系统资源使用情况
- 增加测试超时时间
- 检查Docker镜像构建是否卡住

### 调试技巧

#### 1. 查看测试日志
```bash
# 运行测试时保留详细输出
npm run test:docker:verbose

# 查看Docker容器日志
docker logs fortune-test-container
```

#### 2. 手动验证
```bash
# 手动构建镜像
docker build -t wechat-fortune-draw:manual ./backend

# 手动运行容器
docker run -d --name manual-test -p 3003:3000 wechat-fortune-draw:manual

# 测试API
curl http://localhost:3003/api/health
```

#### 3. 清理测试环境
```bash
# 停止所有测试容器
docker stop $(docker ps -aq --filter "name=fortune-test")

# 删除所有测试容器
docker rm $(docker ps -aq --filter "name=fortune-test")

# 删除测试镜像
docker rmi $(docker images -q --filter "reference=wechat-fortune-draw:*test*")
```

## 持续集成

### GitHub Actions配置示例

```yaml
name: Docker Tests

on: [push, pull_request]

jobs:
  docker-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd backend
        npm ci
        
    - name: Run Docker tests
      run: |
        cd backend
        npm run test:docker
        
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: docker-test-results
        path: backend/test-results/docker/
```

## 性能基准

### 预期测试时间
- Docker镜像构建: 2-5分钟
- Docker Compose测试: 1-3分钟  
- 部署脚本测试: 30秒-1分钟
- 总计: 4-9分钟

### 资源使用
- 内存: 峰值约1GB
- 磁盘: 约2GB (镜像+容器)
- CPU: 构建期间高使用率

## 贡献指南

### 添加新测试

1. 在相应的测试文件中添加测试用例
2. 确保测试具有适当的超时设置
3. 添加必要的清理逻辑
4. 更新本README文档

### 测试最佳实践

1. **隔离性**: 每个测试应该独立运行
2. **清理**: 测试后清理所有资源
3. **超时**: 设置合理的超时时间
4. **错误处理**: 提供清晰的错误信息
5. **文档**: 为复杂测试添加注释

---

**注意**: Docker测试需要较长时间和较多资源，建议在专门的测试环境中运行。
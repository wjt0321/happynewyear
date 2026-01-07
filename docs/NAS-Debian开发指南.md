# 🏠 NAS Debian环境开发指南

## 📋 项目概述

本文档专为在Debian NAS环境中继续开发微信小程序新年抽签应用而编写。项目已完成基础开发，现需要在NAS环境中进行进一步开发和部署。

## 🎯 当前项目状态

### ✅ 已完成功能
- **核心抽签系统** - 50条运势数据，防重复算法
- **用户认证系统** - 微信登录集成
- **防刷机制** - 10秒冷却期
- **前端界面** - 新年主题UI，响应式设计
- **后端API** - RESTful接口，完整的业务逻辑
- **数据库系统** - SQLite数据库，完整的数据管理
- **Docker配置** - 容器化部署配置
- **测试覆盖** - 315个测试用例，85%+覆盖率

## 🆕 NAS专用配置文件

### 新增配置文件

项目现在提供了专门为NAS环境优化的配置：

- **`docker-compose.nas.yml`** - NAS专用Docker Compose配置
- **`.env.nas.example`** - NAS环境变量模板

### NAS配置优化特性

1. **端口优化**
   - 后端服务：18080端口（避免与NAS Web管理界面冲突）
   - 数据库管理：18082端口（可选的Adminer工具）

2. **资源管理**
   - CPU限制：默认1.0核心，可根据NAS性能调整
   - 内存限制：默认1GB，适合大多数NAS环境
   - 预留资源：确保基础服务稳定运行

3. **安全增强**
   - 只读根文件系统：提高容器安全性
   - 安全选项配置：禁用新权限获取
   - 临时文件系统：限制临时文件大小

4. **性能优化**
   - SQLite WAL模式：提高数据库并发性能
   - 数据库缓存：增大缓存提升查询速度
   - Node.js优化：内存和线程池配置

5. **监控完善**
   - 独立健康检查脚本
   - 日志轮转配置
   - 服务依赖管理

### 使用新配置的快速部署

```bash
# 1. 准备NAS环境配置
cp .env.nas.example .env.nas
# 编辑 .env.nas 文件，设置正确的NAS路径和端口

# 2. 创建NAS数据目录
mkdir -p /volume1/docker/wechat-fortune-draw/{data,logs}
chmod 755 /volume1/docker/wechat-fortune-draw

# 3. 使用NAS专用配置启动服务
docker-compose -f docker-compose.nas.yml --env-file .env.nas up -d

# 4. 验证服务状态
curl http://localhost:18080/api/health
```

## 🔧 NAS环境配置

### 系统要求
- **操作系统**: Debian 11+ (已满足)
- **Docker**: 20.10+ (已安装)
- **Docker Compose**: 2.0+ (已安装)
- **Node.js**: 18+ (容器内提供)
- **内存**: 建议4GB+
- **存储**: 建议20GB+可用空间

### 端口配置调整
为避免与NAS现有服务冲突，项目将使用以下高位端口：

```bash
# 新的端口配置
后端API服务: 18080
前端开发服务: 18081
数据库管理: 18082 (可选)
监控服务: 18083 (可选)
```

## 🚀 快速开始

### 1. 项目迁移到NAS
```bash
# 在NAS上创建项目目录
mkdir -p /volume1/docker/wechat-fortune-draw
cd /volume1/docker/wechat-fortune-draw

# 克隆或复制项目文件
# 如果从Git克隆：
git clone <your-repository-url> .

# 如果从其他环境复制，确保包含所有文件
```

### 2. 使用NAS专用配置文件
项目已经为NAS环境准备了专用配置文件：

```bash
# 使用NAS专用环境变量
cp .env.nas .env

# 使用NAS专用Docker Compose配置
# docker-compose.nas.yml 已经配置好高位端口

# 使用NAS专用前端配置
cp frontend/.env.nas frontend/.env
```

### 3. 一键启动服务
```bash
# 使用专用启动脚本
chmod +x scripts/start-nas.sh
./scripts/start-nas.sh

# 或手动启动
docker-compose -f docker-compose.nas.yml up -d
```

### 4. 验证部署
```bash
# 检查后端健康状态
curl http://localhost:18080/api/health

# 检查数据库管理界面
curl http://localhost:18082
```
### 3. NAS专用环境变量配置
```env
# backend/.env - NAS环境配置
# 服务配置 - 使用高位端口避免冲突
PORT=18080
NODE_ENV=development

# 数据库配置
DB_PATH=./data/fortune.db

# 微信小程序配置 (需要您填入真实值)
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret

# 安全配置
JWT_SECRET=your_super_secret_jwt_key_for_nas
CORS_ORIGIN=http://localhost:18081,http://your-nas-ip:18081

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# NAS特定配置
NAS_DATA_PATH=/volume1/docker/wechat-fortune-draw/data
NAS_LOGS_PATH=/volume1/docker/wechat-fortune-draw/logs
```

### 4. Docker Compose配置调整
创建NAS专用的Docker Compose文件：

```yaml
# docker-compose.nas.yml
version: '3.8'

services:
  fortune-app:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    container_name: fortune-app-nas
    restart: unless-stopped
    ports:
      - "18080:18080"  # 使用高位端口
    volumes:
      - /volume1/docker/wechat-fortune-draw/data:/app/data
      - /volume1/docker/wechat-fortune-draw/logs:/app/logs
    environment:
      - NODE_ENV=development
      - PORT=18080
    env_file:
      - ./backend/.env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:18080/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - fortune-network

  # 可选：数据库管理界面
  db-admin:
    image: coleifer/sqlite-web
    container_name: fortune-db-admin
    ports:
      - "18082:8080"
    volumes:
      - /volume1/docker/wechat-fortune-draw/data:/data
    command: sqlite_web -H 0.0.0.0 -x /data/fortune.db
    networks:
      - fortune-network
    depends_on:
      - fortune-app

networks:
  fortune-network:
    driver: bridge

volumes:
  nas-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /volume1/docker/wechat-fortune-draw/data
  nas-logs:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /volume1/docker/wechat-fortune-draw/logs
```

## 🔧 后端配置调整

### 1. 更新后端端口配置
```typescript
// backend/src/index.ts - 端口配置调整
const PORT = process.env.PORT || 18080; // 改为高位端口

const app = express();

// ... 其他配置

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📡 API地址: http://localhost:${PORT}/api`);
  console.log(`🏥 健康检查: http://localhost:${PORT}/api/health`);
});
```

### 2. 更新CORS配置
```typescript
// backend/src/middleware/index.ts - CORS配置
const corsOptions = {
  origin: [
    'http://localhost:18081',  // 前端开发服务器
    'http://127.0.0.1:18081',
    process.env.CORS_ORIGIN?.split(',') || []
  ].flat().filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200
};
```

## 🎨 前端配置调整

### 1. 更新API基础URL
```typescript
// frontend/src/utils/constants.ts
export const API_CONFIG = {
  // NAS环境API配置
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://your-nas-domain.com/api'  // 生产环境
    : 'http://localhost:18080/api',      // 开发环境
  
  TIMEOUT: 10000,
  RETRY_TIMES: 3
};
```

### 2. 更新开发服务器配置
```typescript
// frontend/vite.config.ts - 开发服务器端口调整
export default defineConfig({
  // ... 其他配置
  
  server: {
    port: 18081,  // 使用高位端口
    host: '0.0.0.0',  // 允许外部访问
    proxy: {
      '/api': {
        target: 'http://localhost:18080',  // 代理到后端高位端口
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // ... 其他配置
});
```

## 📦 NAS环境部署

### 1. 创建必要目录
```bash
# 创建数据和日志目录
sudo mkdir -p /volume1/docker/wechat-fortune-draw/{data,logs}
sudo chown -R 1000:1000 /volume1/docker/wechat-fortune-draw/

# 设置权限
chmod 755 /volume1/docker/wechat-fortune-draw/data
chmod 755 /volume1/docker/wechat-fortune-draw/logs
```

### 2. 启动服务
```bash
# 进入项目目录
cd /volume1/docker/wechat-fortune-draw

# 构建并启动服务
docker-compose -f docker-compose.nas.yml up -d

# 查看服务状态
docker-compose -f docker-compose.nas.yml ps

# 查看日志
docker-compose -f docker-compose.nas.yml logs -f
```

### 3. 验证部署
```bash
# 检查后端健康状态
curl http://localhost:18080/api/health

# 检查前端访问 (如果启动了前端开发服务)
curl http://localhost:18081

# 检查数据库管理界面 (可选)
curl http://localhost:18082
```

## 🧪 测试配置调整

### 1. 更新集成测试配置
```json
// integration-config.json - NAS环境测试配置
{
  "environment": "nas-development",
  "backend": {
    "url": "http://localhost:18080",
    "healthEndpoint": "/api/health",
    "fortuneEndpoint": "/api/fortune"
  },
  "frontend": {
    "url": "http://localhost:18081"
  },
  "database": {
    "path": "./data/fortune.db"
  },
  "network": {
    "timeout": 10000,
    "retries": 3
  }
}
```

### 2. 更新测试脚本
```javascript
// scripts/integration-test.js - 端口调整
const config = {
  backend: {
    url: 'http://localhost:18080',  // 使用新端口
    // ... 其他配置
  }
};
```

## 🔍 开发工作流程

### 1. 日常开发流程
```bash
# 1. 启动开发环境
cd /volume1/docker/wechat-fortune-draw
docker-compose -f docker-compose.nas.yml up -d

# 2. 查看实时日志
docker-compose -f docker-compose.nas.yml logs -f fortune-app

# 3. 进入容器进行调试 (如需要)
docker exec -it fortune-app-nas bash

# 4. 运行测试
npm run test:integration

# 5. 停止服务
docker-compose -f docker-compose.nas.yml down
```

### 2. 代码更新流程
```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建镜像
docker-compose -f docker-compose.nas.yml build

# 3. 重启服务
docker-compose -f docker-compose.nas.yml up -d

# 4. 验证更新
curl http://localhost:18080/api/health
```

## 🔧 NAS特定优化

### 1. 性能优化配置
```yaml
# docker-compose.nas.yml - 性能优化
services:
  fortune-app:
    # ... 其他配置
    deploy:
      resources:
        limits:
          cpus: '1.0'      # 限制CPU使用
          memory: 1G       # 限制内存使用
        reservations:
          cpus: '0.5'
          memory: 512M
    
    # 使用tmpfs提升性能
    tmpfs:
      - /tmp
      - /var/tmp
```

### 2. 日志轮转配置
```bash
# 创建日志轮转配置
sudo tee /etc/logrotate.d/fortune-app << EOF
/volume1/docker/wechat-fortune-draw/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 1000 1000
    postrotate
        docker-compose -f /volume1/docker/wechat-fortune-draw/docker-compose.nas.yml restart fortune-app
    endscript
}
EOF
```

## 🚨 故障排除

### 常见问题及解决方案

#### 1. 端口冲突
```bash
# 检查端口占用
netstat -tlnp | grep :18080

# 如果仍有冲突，可以更换端口
# 修改 docker-compose.nas.yml 中的端口映射
```

#### 2. 权限问题
```bash
# 修复数据目录权限
sudo chown -R 1000:1000 /volume1/docker/wechat-fortune-draw/
sudo chmod -R 755 /volume1/docker/wechat-fortune-draw/
```

#### 3. 容器启动失败
```bash
# 查看详细错误信息
docker-compose -f docker-compose.nas.yml logs fortune-app

# 检查配置文件语法
docker-compose -f docker-compose.nas.yml config
```

#### 4. 数据库连接问题
```bash
# 检查数据库文件
ls -la /volume1/docker/wechat-fortune-draw/data/

# 重新初始化数据库
rm /volume1/docker/wechat-fortune-draw/data/fortune.db
docker-compose -f docker-compose.nas.yml restart fortune-app
```

## 📊 监控和维护

### 1. 系统监控
```bash
# 查看容器资源使用
docker stats fortune-app-nas

# 查看磁盘使用
df -h /volume1/docker/wechat-fortune-draw/

# 查看内存使用
free -h
```

### 2. 自动备份脚本
```bash
#!/bin/bash
# /volume1/docker/wechat-fortune-draw/scripts/backup-nas.sh

BACKUP_DIR="/volume1/docker/wechat-fortune-draw/backups"
DB_PATH="/volume1/docker/wechat-fortune-draw/data/fortune.db"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
cp $DB_PATH $BACKUP_DIR/fortune_backup_$DATE.db

# 压缩备份
gzip $BACKUP_DIR/fortune_backup_$DATE.db

# 删除7天前的备份
find $BACKUP_DIR -name "fortune_backup_*.db.gz" -mtime +7 -delete

echo "NAS备份完成: fortune_backup_$DATE.db.gz"
```

### 3. 设置定时任务
```bash
# 编辑crontab
crontab -e

# 添加每日备份任务 (每天凌晨2点)
0 2 * * * /volume1/docker/wechat-fortune-draw/scripts/backup-nas.sh
```

## 🔄 下一步开发计划

### 立即需要处理的任务
1. **端口配置验证** - 确认18080端口可用
2. **测试环境调试** - 修复在NAS环境中的测试问题
3. **分享功能完善** - 优化微信分享功能的测试
4. **性能调优** - 针对NAS硬件特性进行优化

### 后续开发重点
1. **微信小程序配置** - 申请小程序账号并配置
2. **生产环境部署** - 配置HTTPS和域名
3. **监控告警** - 完善系统监控
4. **用户体验优化** - 根据测试反馈优化界面

## 📞 技术支持

### 快速命令参考
```bash
# 启动服务
docker-compose -f docker-compose.nas.yml up -d

# 查看日志
docker-compose -f docker-compose.nas.yml logs -f

# 重启服务
docker-compose -f docker-compose.nas.yml restart

# 停止服务
docker-compose -f docker-compose.nas.yml down

# 健康检查
curl http://localhost:18080/api/health

# 进入容器调试
docker exec -it fortune-app-nas bash
```

### 重要文件路径
- **项目根目录**: `/volume1/docker/wechat-fortune-draw/`
- **数据库文件**: `/volume1/docker/wechat-fortune-draw/data/fortune.db`
- **日志文件**: `/volume1/docker/wechat-fortune-draw/logs/`
- **配置文件**: `/volume1/docker/wechat-fortune-draw/backend/.env`

---

**🏠 欢迎来到NAS开发环境！项目已经为Debian NAS环境进行了优化配置。**
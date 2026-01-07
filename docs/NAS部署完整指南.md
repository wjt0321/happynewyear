# NAS环境部署完整指南

## 📋 概述

本指南详细说明如何在NAS（Network Attached Storage）环境中部署微信小程序新年抽签应用。适用于群晖NAS、威联通NAS等支持Docker的NAS系统。

## 🎯 部署目标

- 在NAS上运行稳定的后端API服务
- 使用高端口避免与现有服务冲突
- 实现数据持久化和自动备份
- 提供监控和健康检查功能

## 📋 系统要求

### 硬件要求
- **CPU**: 双核心或以上
- **内存**: 最少2GB，推荐4GB以上
- **存储**: 至少10GB可用空间
- **网络**: 千兆网络连接

### 软件要求
- **操作系统**: 支持Docker的NAS系统
  - 群晖DSM 7.0+
  - 威联通QTS 5.0+
  - 其他Linux NAS系统
- **Docker**: 20.10+
- **Docker Compose**: 1.29+

## 🚀 快速部署

### 步骤1：环境准备

```bash
# 1. 克隆项目代码
git clone <项目地址>
cd wechat-fortune-draw

# 2. 验证环境配置
chmod +x scripts/validate-nas-config.sh
./scripts/validate-nas-config.sh

# 3. 创建环境配置文件
cp .env.nas.example .env.nas
```

### 新增NAS专用配置

项目现在提供了专门为NAS环境优化的配置文件：

- **`docker-compose.nas.yml`** - NAS专用Docker Compose配置
- **`.env.nas.example`** - NAS环境变量模板

#### NAS配置特点

1. **高端口配置**：使用18080/18082端口避免与NAS现有服务冲突
2. **资源优化**：针对NAS硬件特点进行CPU和内存限制
3. **数据持久化**：优化的数据卷挂载配置
4. **安全增强**：只读根文件系统和安全选项
5. **健康检查**：完善的服务健康监控
6. **日志管理**：适合NAS环境的日志轮转配置
7. **性能优化**：SQLite WAL模式和缓存优化

### 步骤2：配置环境变量

编辑 `.env.nas` 文件：

```bash
# === 基础配置 ===
COMPOSE_PROJECT_NAME=wechat-fortune-draw-nas
NODE_ENV=production
VERSION=latest
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')

# === 端口配置 ===
BACKEND_PORT=18080
ADMINER_PORT=18082

# === CORS配置 ===
CORS_ORIGINS=http://localhost:18081,http://127.0.0.1:18081,https://servicewechat.com

# === NAS路径配置（根据实际NAS系统调整）===
# 群晖NAS
NAS_DATA_PATH=/volume1/docker/wechat-fortune-draw/data
NAS_LOGS_PATH=/volume1/docker/wechat-fortune-draw/logs

# 威联通NAS
# NAS_DATA_PATH=/share/Container/wechat-fortune-draw/data
# NAS_LOGS_PATH=/share/Container/wechat-fortune-draw/logs

# === 数据库配置 ===
DB_PATH=/app/data/fortune.db
DB_CACHE_SIZE=10000
DB_JOURNAL_MODE=WAL
DB_SYNCHRONOUS=NORMAL

# === 性能配置 ===
CPU_LIMIT=1.0
MEMORY_LIMIT=1G
CPU_RESERVATION=0.2
MEMORY_RESERVATION=256M

# === 日志配置 ===
LOG_MAX_SIZE=50m
LOG_MAX_FILES=5

# === 网络配置 ===
NETWORK_SUBNET=172.21.0.0/16
```

### 步骤3：创建数据目录

```bash
# 群晖NAS
sudo mkdir -p /volume1/docker/wechat-fortune-draw/{data,logs,backups}
sudo chmod 755 /volume1/docker/wechat-fortune-draw
sudo chown -R 1000:1000 /volume1/docker/wechat-fortune-draw

# 威联通NAS
sudo mkdir -p /share/Container/wechat-fortune-draw/{data,logs,backups}
sudo chmod 755 /share/Container/wechat-fortune-draw
```

### 步骤4：启动服务

```bash
# 启动所有服务
docker-compose -f docker-compose.nas.yml --env-file .env.nas up -d

# 查看服务状态
docker-compose -f docker-compose.nas.yml ps

# 查看启动日志
docker-compose -f docker-compose.nas.yml logs -f fortune-backend
```

### 步骤5：验证部署

```bash
# 健康检查
curl http://localhost:18080/api/health

# 预期响应
{
  "status": "ok",
  "timestamp": "2026-01-06T10:00:00.000Z",
  "database": "connected"
}
```

## 🔧 高级配置

### 性能优化配置

```yaml
# 在 .env.nas 中添加性能优化配置
# Node.js优化
NODE_OPTIONS=--max-old-space-size=512
UV_THREADPOOL_SIZE=4

# 数据库优化
DB_CACHE_SIZE=20000
DB_JOURNAL_MODE=WAL
DB_SYNCHRONOUS=NORMAL

# 资源限制优化
CPU_LIMIT=2.0
MEMORY_LIMIT=2G
```

### SSL/HTTPS配置

如果需要HTTPS访问，可以配置反向代理：

```nginx
# Nginx配置示例
server {
    listen 443 ssl;
    server_name your-nas-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:18080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 监控和维护

### 自动监控设置

```bash
# 设置监控脚本权限
chmod +x scripts/nas-monitor.sh

# 添加到crontab（每5分钟检查一次）
echo "*/5 * * * * /path/to/wechat-fortune-draw/scripts/nas-monitor.sh" | crontab -
```

### 自动备份设置

```bash
# 设置备份脚本权限
chmod +x scripts/nas-backup.sh

# 添加到crontab（每天凌晨2点备份）
echo "0 2 * * * /path/to/wechat-fortune-draw/scripts/nas-backup.sh" | crontab -
```

### 日志管理

```bash
# 查看应用日志
docker-compose -f docker-compose.nas.yml logs -f fortune-backend

# 查看监控日志
tail -f /volume1/docker/wechat-fortune-draw/logs/monitor.log

# 清理旧日志（保留最近30天）
find /volume1/docker/wechat-fortune-draw/logs -name "*.log" -mtime +30 -delete
```

## 🛠️ 故障排除

### 常见问题

#### 1. 端口冲突
```bash
# 检查端口占用
netstat -tuln | grep 18080

# 修改端口配置
vim .env.nas
# 修改 BACKEND_PORT=18081

# 重启服务
docker-compose -f docker-compose.nas.yml restart
```

#### 2. 权限问题
```bash
# 检查目录权限
ls -la /volume1/docker/wechat-fortune-draw/

# 修复权限
sudo chown -R 1000:1000 /volume1/docker/wechat-fortune-draw/
sudo chmod -R 755 /volume1/docker/wechat-fortune-draw/
```

#### 3. 内存不足
```bash
# 检查内存使用
docker stats

# 调整内存限制
vim .env.nas
# 修改 MEMORY_LIMIT=512M

# 重启服务
docker-compose -f docker-compose.nas.yml restart
```

#### 4. 数据库锁定
```bash
# 停止服务
docker-compose -f docker-compose.nas.yml stop

# 检查数据库文件
ls -la /volume1/docker/wechat-fortune-draw/data/

# 删除锁文件（如果存在）
rm -f /volume1/docker/wechat-fortune-draw/data/*.db-wal
rm -f /volume1/docker/wechat-fortune-draw/data/*.db-shm

# 重启服务
docker-compose -f docker-compose.nas.yml start
```

### 性能调优

#### 1. 数据库性能优化
```bash
# 在 .env.nas 中调整数据库配置
DB_CACHE_SIZE=20000        # 增加缓存大小
DB_JOURNAL_MODE=WAL        # 使用WAL模式
DB_SYNCHRONOUS=NORMAL      # 平衡性能和安全性
```

#### 2. 容器资源优化
```bash
# 根据NAS性能调整资源限制
CPU_LIMIT=1.5              # 允许使用更多CPU
MEMORY_LIMIT=1.5G          # 增加内存限制
CPU_RESERVATION=0.5        # 提高CPU预留
MEMORY_RESERVATION=512M    # 增加内存预留
```

## 📈 扩展功能

### 集群部署（多NAS环境）

如果有多台NAS，可以配置负载均衡：

```yaml
# docker-compose.cluster.yml
version: '3.8'
services:
  nginx-lb:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - fortune-backend-1
      - fortune-backend-2
```

### 数据同步

配置多NAS之间的数据同步：

```bash
# 使用rsync同步数据
rsync -avz /volume1/docker/wechat-fortune-draw/data/ \
  nas2:/volume1/docker/wechat-fortune-draw/data/
```

## 🔒 安全建议

### 1. 网络安全
- 使用防火墙限制访问端口
- 配置VPN访问
- 启用HTTPS

### 2. 数据安全
- 定期备份数据
- 加密敏感配置
- 监控异常访问

### 3. 系统安全
- 定期更新Docker镜像
- 使用非root用户运行
- 限制容器权限

## 📞 技术支持

如果遇到问题，请按以下顺序排查：

1. 运行配置验证脚本
2. 查看应用日志
3. 检查系统资源
4. 参考故障排除章节
5. 联系技术支持

---

**部署成功后，您可以通过以下地址访问服务：**
- 后端API: `http://NAS_IP:18080`
- 数据库管理: `http://NAS_IP:18082`
- 健康检查: `http://NAS_IP:18080/api/health`
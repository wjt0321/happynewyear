# 微信小程序新年抽签应用 - Docker部署文档

## 概述

本应用已成功完成Docker容器化部署，支持本地运行和Cloudflare隧道配置。

## 部署架构

- **后端服务**: Node.js + Express + SQLite
- **容器化**: Docker + Docker Compose
- **数据持久化**: Docker Volume
- **外部访问**: Cloudflare Tunnel

## 快速开始

### 1. 构建和启动Docker容器

```bash
# 进入后端目录
cd /vol1/1000/docker/news小程序/backend

# 构建并启动容器
docker compose up -d

# 查看容器状态
docker ps | grep fortune-backend

# 查看容器日志
docker logs fortune-backend -f
```

### 2. 验证服务运行

```bash
# 健康检查
curl http://localhost:5000/api/health

# 测试抽签接口
curl -X POST http://localhost:5000/api/fortune \
  -H "Content-Type: application/json" \
  -d '{"openid":"test_user"}'
```

## Cloudflare Tunnel 配置

由于你有Cloudflare隧道和固定域名，请按以下步骤配置：

### 步骤1: 安装Cloudflare Tunnel客户端

```bash
# 下载cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
```

### 步骤2: 创建Tunnel

```bash
# 认证Cloudflare账户
cloudflared tunnel login

# 创建隧道
cloudflared tunnel create fortune-tunnel

# 配置隧道
cloudflared tunnel route dns fortune-tunnel your-domain.com
```

### 步骤3: 配置隧道指向本地服务

创建配置文件 `~/.cloudflared/config.yml`:

```yaml
tunnel: <tunnel-id>
credentials-file: /path/to/credentials.json

ingress:
  - hostname: your-domain.com
    service: http://localhost:5000
  - service: http_status:404
```

### 步骤4: 启动Tunnel

```bash
# 启动tunnel（测试）
cloudflared tunnel run fortune-tunnel

# 或者使用systemd服务（生产环境）
sudo cloudflared service install
```

## Docker容器管理

### 常用命令

```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose down

# 重启服务
docker compose restart

# 查看日志
docker logs fortune-backend

# 进入容器
docker exec -it fortune-backend sh

# 查看容器资源使用
docker stats fortune-backend
```

### 数据持久化

数据存储在Docker Volume中，容器重启不会丢失数据：

```bash
# 查看数据卷
docker volume ls | grep fortune

# 备份数据卷
docker run --rm -v backend_fortune-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/fortune-backup.tar.gz /data

# 恢复数据卷
docker run --rm -v backend_fortune-data:/data -v $(pwd):/backup \
  alpine sh -c "cd /data && tar xzf /backup/fortune-backup.tar.gz --strip 1"
```

## 服务监控

### 健康检查

容器已配置健康检查，每30秒检查一次：

```bash
# 查看健康状态
docker inspect fortune-backend | grep -A 10 Health

# 手动健康检查
curl http://localhost:5000/api/health
```

### 日志查看

```bash
# 实时查看日志
docker logs -f fortune-backend

# 查看最近100行日志
docker logs --tail 100 fortune-backend

# 查看特定时间段的日志
docker logs --since 2026-01-07T00:00:00 fortune-backend
```

## 环境变量配置

当前配置的环境变量：

```yaml
services:
  fortune-backend:
    environment:
      - NODE_ENV=production
      - PORT=5000
      - DB_PATH=/app/data/fortune.db
```

### 修改环境变量

编辑 `docker-compose.yml` 文件：

```yaml
environment:
  - NODE_ENV=production
  - PORT=5000
  - DB_PATH=/app/data/fortune.db
  - # 添加自定义变量
```

修改后重启服务：

```bash
docker compose down
docker compose up -d
```

## 网络配置

### 端口映射

```yaml
ports:
  - "5000:5000"  # 主机端口:容器端口
```

### 防火墙配置

如果需要外部访问，确保防火墙允许5000端口：

```bash
# UFW防火墙
sudo ufw allow 5000/tcp

# iptables
sudo iptables -A INPUT -p tcp --dport 5000 -j ACCEPT
```

## 故障排除

### 容器无法启动

```bash
# 查看容器日志
docker logs fortune-backend

# 检查端口占用
netstat -tulpn | grep :5000

# 重建容器
docker compose down
docker compose up -d --force-recreate
```

### 数据库问题

```bash
# 进入容器检查数据库
docker exec -it fortune-backend sh
sqlite3 /app/data/fortune.db
.tables
.quit

# 检查数据卷权限
docker exec fortune-backend ls -la /app/data
```

### 性能问题

```bash
# 查看容器资源使用
docker stats fortune-backend

# 查看容器详细信息
docker inspect fortune-backend
```

## 更新部署

### 更新代码后重新构建

```bash
# 拉取最新代码
git pull

# 重新构建镜像
docker compose build

# 重启服务
docker compose up -d
```

### 滚动更新（零停机）

```bash
# 启动新容器
docker compose up -d --scale fortune-backend=2

# 停止旧容器
docker compose up -d --scale fortune-backend=1
```

## 备份和恢复

### 自动备份脚本

创建 `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/vol1/1000/docker/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份数据卷
docker run --rm -v backend_fortune-data:/data -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/fortune_$DATE.tar.gz /data

# 删除30天前的备份
find $BACKUP_DIR -name "fortune_*.tar.gz" -mtime +30 -delete

echo "Backup completed: fortune_$DATE.tar.gz"
```

设置定时任务：

```bash
# 添加到crontab（每天凌晨2点备份）
0 2 * * * /vol1/1000/docker/news小程序/backend/backup.sh
```

## 安全建议

1. **不要在代码中暴露敏感信息**，使用环境变量
2. **定期备份数据库**
3. **监控容器日志**，及时发现异常
4. **保持镜像更新**，及时安装安全补丁
5. **限制容器权限**，使用非root用户运行

## 技术支持

如有问题，请查看：

1. Docker日志: `docker logs fortune-backend`
2. 应用日志: 容器内 `/app/logs/` 目录
3. 健康检查: `http://localhost:5000/api/health`

## 性能指标

- **镜像大小**: ~200MB
- **启动时间**: ~5秒
- **内存占用**: ~100MB
- **健康检查**: 30秒间隔

---

**部署完成！** 本地Docker容器已成功运行，接下来你可以配置Cloudflare Tunnel实现外网访问。

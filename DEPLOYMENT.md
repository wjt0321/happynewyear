# 微信小程序新年抽签应用 - 部署指南

本文档详细说明如何在NAS环境中部署微信小程序新年抽签应用的后端服务。

## 目录

- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [详细部署步骤](#详细部署步骤)
- [Cloudflare Tunnel配置](#cloudflare-tunnel配置)
- [监控和维护](#监控和维护)
- [故障排除](#故障排除)

## 系统要求

### 硬件要求
- **CPU**: 1核心以上 (推荐2核心)
- **内存**: 512MB以上 (推荐1GB)
- **存储**: 2GB可用空间 (用于Docker镜像和数据)
- **网络**: 稳定的互联网连接

### 软件要求
- **操作系统**: Linux (Ubuntu 18.04+, CentOS 7+, 或其他支持Docker的发行版)
- **Docker**: 20.10.0+ 
- **Docker Compose**: 1.29.0+
- **curl**: 用于健康检查
- **bc**: 用于数值计算 (通常系统自带)

### NAS兼容性
已测试的NAS系统：
- Synology DSM 7.0+
- QNAP QTS 5.0+
- 其他支持Docker的NAS系统

## 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd wechat-fortune-draw
```

### 2. 配置环境变量
```bash
# 复制环境变量模板
cp .env.docker .env

# 编辑配置文件
nano .env
```

### 3. 开发环境部署
```bash
# 给脚本执行权限
chmod +x scripts/*.sh

# 部署到开发环境
./scripts/deploy.sh deploy dev
```

### 4. 生产环境部署
```bash
# 配置Cloudflare Tunnel (可选)
./scripts/setup-tunnel.sh setup your-domain.com

# 部署到生产环境
./scripts/deploy.sh deploy prod
```

## 详细部署步骤

### 步骤1: 环境准备

#### 1.1 安装Docker和Docker Compose

**Ubuntu/Debian:**
```bash
# 更新包索引
sudo apt update

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 将用户添加到docker组
sudo usermod -aG docker $USER
```

**CentOS/RHEL:**
```bash
# 安装Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 1.2 验证安装
```bash
docker --version
docker-compose --version
```

### 步骤2: 项目配置

#### 2.1 下载项目代码
```bash
# 克隆仓库
git clone <repository-url>
cd wechat-fortune-draw

# 或者下载压缩包并解压
wget <archive-url>
unzip wechat-fortune-draw.zip
cd wechat-fortune-draw
```

#### 2.2 配置环境变量
```bash
# 复制环境变量模板
cp .env.docker .env

# 编辑配置文件
nano .env
```

**重要配置项说明:**
```bash
# 后端服务端口 (映射到宿主机)
BACKEND_PORT=3000

# 数据持久化目录 (建议使用绝对路径)
DATA_PATH=/volume1/docker/fortune-draw/data

# 运行环境
NODE_ENV=production

# Cloudflare Tunnel Token (生产环境必需)
TUNNEL_TOKEN=your-tunnel-token-here

# 允许的跨域来源
CORS_ORIGINS=https://servicewechat.com,https://your-domain.com
```

#### 2.3 创建数据目录
```bash
# 创建数据目录
sudo mkdir -p /volume1/docker/fortune-draw/data
sudo mkdir -p /volume1/docker/fortune-draw/logs

# 设置权限 (Docker容器使用用户ID 1001)
sudo chown -R 1001:1001 /volume1/docker/fortune-draw/data
sudo chown -R 1001:1001 /volume1/docker/fortune-draw/logs
```

### 步骤3: 部署服务

#### 3.1 开发环境部署
```bash
# 给脚本执行权限
chmod +x scripts/*.sh

# 部署开发环境
./scripts/deploy.sh deploy dev

# 查看服务状态
./scripts/deploy.sh status dev
```

#### 3.2 生产环境部署
```bash
# 部署生产环境
./scripts/deploy.sh deploy prod

# 查看服务状态
./scripts/deploy.sh status prod
```

### 步骤4: 验证部署

#### 4.1 检查容器状态
```bash
# 查看运行中的容器
docker ps

# 查看容器日志
docker logs fortune-backend-prod
```

#### 4.2 测试API接口
```bash
# 健康检查
curl http://localhost:3000/api/health

# 测试抽签接口
curl -X POST http://localhost:3000/api/fortune \
  -H "Content-Type: application/json" \
  -d '{"openid":"test_user_123"}'
```

## Cloudflare Tunnel配置

Cloudflare Tunnel提供安全的HTTPS访问，无需在路由器上开放端口。

### 前提条件
- Cloudflare账户
- 域名已添加到Cloudflare并激活

### 配置步骤

#### 1. 一键设置 (推荐)
```bash
# 运行一键设置脚本
./scripts/setup-tunnel.sh setup your-domain.com
```

#### 2. 手动设置
```bash
# 1. 安装cloudflared
./scripts/setup-tunnel.sh install

# 2. 登录Cloudflare
./scripts/setup-tunnel.sh login

# 3. 创建tunnel
./scripts/setup-tunnel.sh create fortune-draw-tunnel

# 4. 配置域名
./scripts/setup-tunnel.sh configure fortune-draw-tunnel api.your-domain.com

# 5. 获取token
./scripts/setup-tunnel.sh token fortune-draw-tunnel
```

#### 3. 配置环境变量
将获取的Token添加到`.env`文件：
```bash
TUNNEL_TOKEN=eyJhIjoiYWJjZGVmZ2hpams...
```

#### 4. 重新部署
```bash
./scripts/deploy.sh deploy prod
```

### 验证Tunnel连接
```bash
# 测试HTTPS访问
curl https://api.your-domain.com/api/health
```

## 监控和维护

### 健康检查
```bash
# 执行健康检查
./scripts/health-check.sh check

# 查看服务状态
./scripts/health-check.sh status

# 启动持续监控
./scripts/health-check.sh monitor
```

### 日志管理
```bash
# 查看应用日志
docker logs fortune-backend-prod

# 查看实时日志
docker logs -f fortune-backend-prod

# 查看健康检查日志
tail -f logs/health-check.log
```

### 数据备份
```bash
# 手动备份数据
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# 查看自动备份
ls -la backups/
```

### 服务管理
```bash
# 停止服务
./scripts/deploy.sh stop prod

# 重启服务
./scripts/deploy.sh deploy prod

# 清理Docker资源
./scripts/deploy.sh cleanup
```

## 故障排除

### 常见问题

#### 1. 容器启动失败
```bash
# 查看容器日志
docker logs fortune-backend-prod

# 检查配置文件
cat .env

# 检查数据目录权限
ls -la data/
```

#### 2. 数据库连接失败
```bash
# 检查数据目录挂载
docker exec fortune-backend-prod ls -la /app/data/

# 检查数据库文件
docker exec fortune-backend-prod sqlite3 /app/data/fortune.db ".tables"
```

#### 3. API接口无响应
```bash
# 检查端口映射
docker port fortune-backend-prod

# 检查防火墙设置
sudo ufw status

# 测试内部连接
docker exec fortune-backend-prod curl localhost:3000/api/health
```

#### 4. Cloudflare Tunnel连接失败
```bash
# 检查tunnel状态
docker logs fortune-cloudflare-tunnel

# 验证token配置
echo $TUNNEL_TOKEN

# 测试tunnel连接
./scripts/setup-tunnel.sh test fortune-draw-tunnel
```

### 性能优化

#### 1. 资源限制调整
编辑`docker-compose.prod.yml`中的资源限制：
```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'      # 根据NAS性能调整
      memory: 1G       # 根据可用内存调整
```

#### 2. 日志轮转配置
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"    # 单个日志文件大小
    max-file: "5"      # 保留日志文件数量
```

### 安全建议

1. **定期更新**: 定期更新Docker镜像和系统包
2. **访问控制**: 限制API访问来源
3. **数据备份**: 定期备份数据库文件
4. **监控告警**: 配置健康检查告警
5. **SSL证书**: 使用Cloudflare提供的SSL证书

### 联系支持

如果遇到问题，请：
1. 查看日志文件：`logs/deploy.log`, `logs/health-check.log`
2. 运行健康检查：`./scripts/health-check.sh status`
3. 收集系统信息：Docker版本、系统版本、错误日志
4. 提交Issue或联系技术支持

---

**注意**: 本部署指南假设您有基本的Linux系统管理经验。如果您是初学者，建议先在测试环境中练习部署流程。